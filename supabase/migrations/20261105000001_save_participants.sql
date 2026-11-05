-- save_participants: apply a batch of people edits to one event in one transaction.
-- Additive only (new function), so it is backward compatible (ADR 0007).
--
-- p_changes = {
--   "add":    ["Ana", "Budi"],                -- appended in order after existing people
--   "rename": [{ "id": "<uuid>", "name": "…" }],
--   "remove": ["<uuid>"]                      -- FKs: allocations cascade, bills.paid_by → null
-- }
-- Ids that are not in p_event_id are ignored (the service checks ownership first).
create or replace function public.save_participants(p_event_id uuid, p_changes jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_next int;
begin
  delete from participants
  where event_id = p_event_id
    and id in (
      select r::uuid from jsonb_array_elements_text(coalesce(p_changes->'remove', '[]'::jsonb)) as r
    );

  update participants p
  set name = r.name
  from jsonb_to_recordset(coalesce(p_changes->'rename', '[]'::jsonb)) as r(id uuid, name text)
  where p.id = r.id and p.event_id = p_event_id;

  -- now() is the same for every row in a transaction, so order the new people by position
  select coalesce(max(position) + 1, 0) into v_next from participants where event_id = p_event_id;

  insert into participants (event_id, name, position)
  select p_event_id, t.name, v_next + t.ord::int - 1
  from jsonb_array_elements_text(coalesce(p_changes->'add', '[]'::jsonb)) with ordinality as t(name, ord);
end;
$$;

revoke execute on function public.save_participants(uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.save_participants(uuid, jsonb) to service_role;
