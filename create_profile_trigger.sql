-- Script untuk membuat trigger otomatis create profile saat user baru sign up
-- Jalankan script ini di SQL Editor Supabase

-- Function untuk handle user baru
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- Drop trigger jika sudah ada
drop trigger if exists on_auth_user_created on auth.users;

-- Trigger yang akan dipanggil setiap user baru
create trigger on_auth_user_created
  after insert on auth.users
  for each row 
  execute procedure public.handle_new_user();

-- Verifikasi trigger sudah dibuat
select 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
