-- rounding_charge: new bill charge kind 'rounding' (receipt "Pembulatan").
-- Rounding is a signed amount, so value may be negative for that kind only.
-- Only widens the existing checks, so it is backward compatible (ADR 0007):
-- every row that was valid before stays valid, and old app code never writes 'rounding'.
-- save_bill() passes kind/value through unchanged, so it needs no change.

alter table public.bill_charges drop constraint if exists bill_charges_kind_check;
alter table public.bill_charges
  add constraint bill_charges_kind_check
  check (kind in ('tax', 'service', 'discount', 'rounding'));

alter table public.bill_charges drop constraint if exists bill_charges_value_check;
alter table public.bill_charges
  add constraint bill_charges_value_check
  check (value >= 0 or kind = 'rounding');

alter table public.bill_charges drop constraint if exists bill_charges_rounding_amount_check;
alter table public.bill_charges
  add constraint bill_charges_rounding_amount_check
  check (kind <> 'rounding' or mode = 'amount');
