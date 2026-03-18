-- Script untuk update RLS policies pada table profiles
-- Jalankan script ini di SQL Editor Supabase

-- 1. Drop existing policies jika ada
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admin users have full access" on public.profiles;

-- 2. Pastikan RLS enabled
alter table public.profiles enable row level security;

-- 3. Policy: User bisa lihat profile sendiri
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

-- 4. Policy: User bisa update profile sendiri
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5. Policy: Admin bisa lihat semua profile
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 6. Policy: Admin bisa update semua profile
create policy "Admins can update all profiles"
on public.profiles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 7. Verifikasi policies sudah dibuat
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename = 'profiles'
order by policyname;
