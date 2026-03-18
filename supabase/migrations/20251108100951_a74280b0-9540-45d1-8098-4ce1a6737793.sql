-- Change leave total columns from integer to numeric to support half-day leaves (0.5)
ALTER TABLE cuti 
  ALTER COLUMN total_cuti_tahunan TYPE NUMERIC(5,1),
  ALTER COLUMN total_cuti_sakit TYPE NUMERIC(5,1),
  ALTER COLUMN total_cuti_alasan_penting TYPE NUMERIC(5,1),
  ALTER COLUMN total_cuti_melahirkan TYPE NUMERIC(5,1),
  ALTER COLUMN total_cuti_besar_non_keagamaan TYPE NUMERIC(5,1),
  ALTER COLUMN total_pengganti_cuti_bersama TYPE NUMERIC(5,1);