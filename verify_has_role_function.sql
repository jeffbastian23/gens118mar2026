-- Script untuk verifikasi dan create function has_role
-- Jalankan script ini di SQL Editor Supabase

-- 1. Cek apakah function has_role sudah ada
select 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public' 
  and p.proname = 'has_role';

-- 2. Create or replace function has_role
-- Function ini digunakan oleh RLS policies untuk cek role user
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 3. Test function dengan user admin
-- Ganti 'USER_ID' dengan user_id dari duana.pahlawan@kemenkeu.go.id
-- select public.has_role('USER_ID'::uuid, 'admin'::app_role);

-- 4. Verifikasi function sudah dibuat dengan benar
select 
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public' 
  and p.proname = 'has_role';
