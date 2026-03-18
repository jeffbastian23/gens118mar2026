
ALTER TABLE pegawai_atasan ADD COLUMN IF NOT EXISTS atasan_langsung TEXT;
ALTER TABLE pegawai_atasan ADD COLUMN IF NOT EXISTS atasan_dari_atasan TEXT;
