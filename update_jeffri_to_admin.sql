-- Script untuk mengubah role Jeffri Subastian Adi Prasetyo menjadi admin
-- Jalankan script ini di SQL Editor Supabase (Cloud tab)

-- 1. Cek user dengan nama tersebut
SELECT 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.full_name,
  ur.role as current_role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
WHERE p.full_name ILIKE '%jeffri%' OR p.full_name ILIKE '%subastian%';

-- 2. Update atau insert role admin untuk user tersebut
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM profiles
WHERE full_name ILIKE '%jeffri%subastian%' OR full_name ILIKE '%jeffry%subastian%'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::app_role;

-- 3. Jika user sudah punya role 'user', update ke 'admin'
UPDATE user_roles 
SET role = 'admin'::app_role
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE full_name ILIKE '%jeffri%subastian%' OR full_name ILIKE '%jeffry%subastian%'
);

-- 4. Verifikasi hasilnya
SELECT 
  p.email,
  p.full_name,
  ur.role,
  ur.created_at as role_assigned_at
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.user_id
WHERE p.full_name ILIKE '%jeffri%' OR p.full_name ILIKE '%subastian%';
