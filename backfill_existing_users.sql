-- Script untuk membuat profile bagi user yang sudah ada
-- Jalankan script ini di SQL Editor Supabase setelah create_profile_trigger.sql

-- Insert profile untuk user yang sudah ada tapi belum punya profile
insert into public.profiles (user_id, email, full_name)
select 
  au.id as user_id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', au.email) as full_name
from auth.users au
where not exists (
  select 1 from public.profiles p 
  where p.user_id = au.id
)
on conflict (user_id) do nothing;

-- Verifikasi hasilnya - harus menampilkan semua user termasuk duana.pahlawan@kemenkeu.go.id
select 
  p.user_id,
  p.email,
  p.full_name,
  ur.role,
  p.created_at
from public.profiles p
left join public.user_roles ur on ur.user_id = p.user_id
order by p.created_at desc;

-- Khusus cek user admin
select 
  p.user_id,
  p.email,
  p.full_name,
  ur.role
from public.profiles p
left join public.user_roles ur on ur.user_id = p.user_id
where p.email = 'duana.pahlawan@kemenkeu.go.id';
