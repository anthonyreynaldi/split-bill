-- Per share link: whether viewers see the receipt photos.
-- Additive with a default, so it is backward compatible (ADR 0007):
-- old code never reads it, and existing links keep showing photos.
alter table public.share_links
  add column if not exists show_photos boolean not null default true;
