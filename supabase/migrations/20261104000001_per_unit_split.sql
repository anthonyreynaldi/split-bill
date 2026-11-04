-- ════════════════════════════════════════════════════════════════════════
-- Per-unit split (bill_items.split_mode = 'per_unit').
-- Each unit of an item's qty has its own group of people; the unit index is
-- stored on item_allocations.unit_index (0-based, null for 'custom').
-- See docs/architecture.md §2–3.
-- ════════════════════════════════════════════════════════════════════════

alter table public.bill_items drop constraint if exists bill_items_split_mode_check;
alter table public.bill_items
  add constraint bill_items_split_mode_check check (split_mode in ('even', 'custom', 'per_unit'));

alter table public.item_allocations
  add column unit_index int check (unit_index >= 0);

-- One row per (item, person) for 'custom', per (item, person, unit) for 'per_unit'.
alter table public.item_allocations drop constraint item_allocations_pkey;
create unique index item_allocations_item_participant_unit_key
  on public.item_allocations (item_id, participant_id, coalesce(unit_index, -1));

-- save_bill: same as 20261103000001_init.sql, plus allocations[].unit_index.
-- p_bill.items[].allocations = [{ participant_id, units, unit_index? }]
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

    insert into item_allocations (item_id, participant_id, units, unit_index)
    select v_item_id, (a->>'participant_id')::uuid, sum((a->>'units')::numeric),
           nullif(a->>'unit_index', '')::int
    from jsonb_array_elements(coalesce(r.item->'allocations', '[]'::jsonb)) a
    group by (a->>'participant_id')::uuid, nullif(a->>'unit_index', '')::int;
  end loop;

  insert into bill_charges (bill_id, position, kind, mode, value)
  select v_id, ordinality::int, c->>'kind', c->>'mode', (c->>'value')::numeric
  from jsonb_array_elements(coalesce(p_bill->'charges', '[]'::jsonb)) with ordinality as t(c, ordinality);

  return v_id;
end;
$$;
