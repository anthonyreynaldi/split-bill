-- Private bucket for receipt photos. Accessed only by the server
-- (service role) and served to the browser through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bill-images', 'bill-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
