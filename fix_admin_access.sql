-- Script untuk memperbaiki akses admin
-- Jalankan script ini di SQL Editor Supabase

-- 1. Cek apakah user dengan email duana.pahlawan@kemenkeu.go.id ada di profiles
SELECT 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.full_name,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
WHERE p.email = 'duana.pahlawan@kemenkeu.go.id';

-- 2. Jika user ada di profiles tapi tidak punya role, insert role admin
-- Ganti 'USER_ID_HERE' dengan user_id yang didapat dari query di atas
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('USER_ID_HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Atau gunakan query otomatis ini untuk langsung assign role admin
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM profiles
WHERE email = 'duana.pahlawan@kemenkeu.go.id'
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = profiles.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Verifikasi hasilnya
SELECT 
  p.email,
  p.full_name,
  ur.role,
  ur.created_at as role_assigned_at
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.user_id
WHERE p.email = 'duana.pahlawan@kemenkeu.go.id';
