# Setup Role-Based Access Control (RBAC)

## Gambaran Umum
Aplikasi ini sekarang memiliki 2 role:
- **Admin**: Akses penuh ke semua fitur (CRUD data penugasan, pegawai, export, dll)
- **User**: Hanya dapat melihat data penugasan dan mengunduh Nota Dinas (tidak bisa unduh Surat Tugas)

## Langkah-Langkah Setup

### 1. Jalankan SQL untuk RLS Policies
1. Buka Supabase Dashboard
2. Pilih project Anda (`employee`)
3. Pergi ke **SQL Editor**
4. Buka file `setup_rls_policies.sql` dari project ini
5. Copy semua isinya dan paste ke SQL Editor
6. Klik **Run** untuk menjalankan

File ini akan:
- Mengaktifkan RLS pada semua tabel
- Membuat policies untuk admin (full access)
- Membuat policies untuk user (read-only pada data penugasan)

### 2. Registrasi User
Minta kedua user untuk melakukan sign up melalui aplikasi:
1. **duana.pahlawan@kemenkeu.go.id** (akan jadi admin)
2. **jeffry.subastian@kemenkeu.go.id** (akan jadi user)

Mereka perlu:
- Buka aplikasi
- Klik "Daftar" 
- Isi nama lengkap, email, dan password
- Submit form

**PENTING**: Kedua user HARUS sudah sign up sebelum langkah berikutnya!

### 3. Assign Roles ke User
Setelah kedua user berhasil sign up:

1. Buka Supabase Dashboard → **SQL Editor**
2. Buka file `assign_user_roles.sql` dari project ini
3. Copy semua isinya dan paste ke SQL Editor
4. Klik **Run**

File ini akan:
- Membuat function `assign_role_by_email`
- Assign role **admin** ke duana.pahlawan@kemenkeu.go.id
- Assign role **user** ke jeffry.subastian@kemenkeu.go.id

### 4. Verifikasi Setup
1. Login sebagai **duana.pahlawan@kemenkeu.go.id**
   - ✅ Harus bisa lihat tombol "Panel Admin" di header
   - ✅ Harus bisa akses semua tab (Dashboard, Data Penugasan, PLH Kepala, dll)
   - ✅ Harus bisa Create, Edit, Delete data
   - ✅ Harus bisa unduh Nota Dinas dan Surat Tugas

2. Login sebagai **jeffry.subastian@kemenkeu.go.id**
   - ✅ TIDAK bisa lihat tombol "Panel Admin"
   - ✅ Hanya bisa lihat tab "Data Penugasan"
   - ✅ TIDAK bisa Edit atau Delete data penugasan
   - ✅ Hanya bisa unduh Nota Dinas (TIDAK bisa unduh Surat Tugas)

## Manage User Roles (Untuk Admin)
Setelah login sebagai admin:
1. Klik tombol **"Panel Admin"** di header
2. Anda akan melihat daftar semua user yang sudah terdaftar
3. Gunakan dropdown untuk mengubah role user (Admin/User)
4. Role akan langsung tersimpan dan berlaku

## Troubleshooting

### User tidak bisa login setelah assign role
- Pastikan user sudah logout dan login kembali
- Clear browser cache/cookies

### RLS error "new row violates row-level security policy"
- Pastikan SQL `setup_rls_policies.sql` sudah dijalankan dengan benar
- Cek di Supabase Dashboard → Authentication → Policies

### User tidak muncul di Panel Admin
- Pastikan user sudah sign up di aplikasi
- Cek tabel `profiles` di Supabase untuk memastikan data user tersimpan

### Role tidak berubah setelah diupdate di Panel Admin
- Refresh halaman atau logout dan login kembali
- Cek tabel `user_roles` di Supabase untuk memastikan role tersimpan

## Menambah User Baru
Untuk menambah user baru:
1. Minta user melakukan sign up melalui aplikasi
2. Login sebagai admin
3. Pergi ke **Panel Admin**
4. Pilih role untuk user baru dari dropdown
5. Role akan langsung aktif

## Catatan Keamanan
- ✅ RLS (Row Level Security) sudah dikonfigurasi dengan benar
- ✅ User role disimpan di tabel terpisah (bukan di localStorage)
- ✅ Server-side validation menggunakan function `has_role()`
- ✅ User biasa tidak bisa mengubah role mereka sendiri
