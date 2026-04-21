-- Create public bucket for email assets (logo)
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do nothing;

-- Public read access
create policy "Email assets are publicly readable"
on storage.objects
for select
using (bucket_id = 'email-assets');