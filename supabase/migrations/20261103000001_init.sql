-- ════════════════════════════════════════════════════════════════════════
-- Split Bill: initial schema
-- ERD: docs/architecture.md §2 · Money = bigint minor units (ADR 0004)
-- Access: ONLY the server, with the service-role key (ADR 0003).
--         RLS is enabled with NO policies → anon/authenticated get nothing.
-- ════════════════════════════════════════════════════════════════════════

-- ── users (shaped like auth.users so we can migrate to Supabase Auth) ──
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (email = lower(email)),
  password_hash text not null,
  created_at    timestamptz not null default now()
);
comment on table public.users is 'App users (temporary custom auth, ADR 0003). Mirrors auth.users id/email/created_at.';

-- ── events: a group of bills ──
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.users(id) on delete cascade,
  name            text not null check (length(name) between 1 and 100),
  currency        text not null default 'IDR',
  settlement_mode text not null default 'nett' check (settlement_mode in ('per_bill', 'nett')),
  created_at      timestamptz not null default now()
);
create index events_owner_idx on public.events(owner_id, created_at desc);

-- ── participants: people in an event (name only, no account) ──
create table public.participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null check (length(name) between 1 and 100),
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index participants_event_idx on public.participants(event_id, position);

-- ── bills: one receipt ──
create table public.bills (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  title             text not null check (length(title) between 1 and 200),
  bill_date         date,
  paid_by           uuid references public.participants(id) on delete set null,
  image_path        text,
  charge_split_mode text not null default 'proportional' check (charge_split_mode in ('proportional', 'even')),
  ocr_raw           jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index bills_event_idx on public.bills(event_id, created_at);

-- ── bill_items: receipt lines ──
create table public.bill_items (
  id         uuid primary key default gen_random_uuid(),
  bill_id    uuid not null references public.bills(id) on delete cascade,
  position   int     not null,
  name       text    not null,
  qty        numeric not null check (qty > 0),
  unit_price bigint  not null check (unit_price >= 0),
  total      bigint  not null check (total >= 0),
  split_mode text    not null check (split_mode in ('even', 'custom'))
);
create index bill_items_bill_idx on public.bill_items(bill_id, position);

-- ── item_allocations: who had how many units of an item (custom split) ──
create table public.item_allocations (
  item_id        uuid not null references public.bill_items(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  units          numeric not null check (units > 0),
  primary key (item_id, participant_id)
);
create index item_allocations_participant_idx on public.item_allocations(participant_id);

-- ── bill_charges: tax / service / discount ──
create table public.bill_charges (
  id       uuid primary key default gen_random_uuid(),
  bill_id  uuid not null references public.bills(id) on delete cascade,
  position int     not null,
  kind     text    not null check (kind in ('tax', 'service', 'discount')),
  mode     text    not null check (mode in ('percent', 'amount')),
  value    numeric not null check (value >= 0)
);
create index bill_charges_bill_idx on public.bill_charges(bill_id, position);

-- ── share_links: one read-only public link per event ──
create table public.share_links (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null unique references public.events(id) on delete cascade,
  slug            text not null unique,
  passcode_hash   text,
  failed_attempts int  not null default 0,
  locked_until    timestamptz,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ── Security: deny everything to API roles; server uses service_role ──
alter table public.users            enable row level security;
alter table public.events           enable row level security;
alter table public.participants     enable row level security;
alter table public.bills            enable row level security;
alter table public.bill_items       enable row level security;
alter table public.item_allocations enable row level security;
alter table public.bill_charges     enable row level security;
alter table public.share_links      enable row level security;

-- ════════════════════════════════════════════════════════════════════════
-- save_bill: create or replace a bill with its items, allocations and
-- charges in ONE transaction. Called by SupabaseBillRepository.save().
-- Ownership is checked by BillService before calling this.
--
-- p_bill = { id?, event_id, title, bill_date, paid_by, image_path,
--            charge_split_mode, ocr_raw?,
--            items: [{ name, qty, unit_price, total, split_mode,
--                      allocations: [{ participant_id, units }] }],
--            charges: [{ kind, mode, value }] }
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.save_bill(p_bill jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id       uuid := coalesce(nullif(p_bill->>'id', '')::uuid, gen_random_uuid());
  v_event_id uuid := (p_bill->>'event_id')::uuid;
  v_item_id  uuid;
  r          record;
begin
  insert into bills (id, event_id, title, bill_date, paid_by, image_path, charge_split_mode, ocr_raw)
  values (
    v_id, v_event_id, p_bill->>'title', nullif(p_bill->>'bill_date', '')::date,
    nullif(p_bill->>'paid_by', '')::uuid, p_bill->>'image_path',
    p_bill->>'charge_split_mode', p_bill->'ocr_raw'
  )
  on conflict (id) do update set
    title             = excluded.title,
    bill_date         = excluded.bill_date,
    paid_by           = excluded.paid_by,
    image_path        = excluded.image_path,
    charge_split_mode = excluded.charge_split_mode,
    ocr_raw           = coalesce(excluded.ocr_raw, bills.ocr_raw),
    updated_at        = now()
  where bills.event_id = v_event_id;  -- never move a bill to another event

  if not found then
    raise exception 'bill % does not belong to event %', v_id, v_event_id;
  end if;

  delete from bill_items   where bill_id = v_id;   -- cascades to item_allocations
  delete from bill_charges where bill_id = v_id;

  for r in
    select value as item, ordinality::int as pos
    from jsonb_array_elements(coalesce(p_bill->'items', '[]'::jsonb)) with ordinality
  loop
    insert into bill_items (bill_id, position, name, qty, unit_price, total, split_mode)
    values (v_id, r.pos, r.item->>'name', (r.item->>'qty')::numeric,
            (r.item->>'unit_price')::bigint, (r.item->>'total')::bigint, r.item->>'split_mode')
    returning id into v_item_id;

    insert into item_allocations (item_id, participant_id, units)
    select v_item_id, (a->>'participant_id')::uuid, sum((a->>'units')::numeric)
    from jsonb_array_elements(coalesce(r.item->'allocations', '[]'::jsonb)) a
    group by (a->>'participant_id')::uuid;
  end loop;

  insert into bill_charges (bill_id, position, kind, mode, value)
  select v_id, ordinality::int, c->>'kind', c->>'mode', (c->>'value')::numeric
  from jsonb_array_elements(coalesce(p_bill->'charges', '[]'::jsonb)) with ordinality as t(c, ordinality);

  return v_id;
end;
$$;

revoke execute on function public.save_bill(jsonb) from public, anon, authenticated;
grant  execute on function public.save_bill(jsonb) to service_role;
