-- 1. Modify gudang_arsip_tegalsari table
-- Drop old columns and add new ones
ALTER TABLE gudang_arsip_tegalsari 
  DROP COLUMN IF EXISTS nama_rak,
  DROP COLUMN IF EXISTS jenis_rak,
  DROP COLUMN IF EXISTS kapasitas_maksimal,
  DROP COLUMN IF EXISTS kapasitas_terpakai,
  DROP COLUMN IF EXISTS lokasi,
  DROP COLUMN IF EXISTS keterangan;

-- Add new columns
ALTER TABLE gudang_arsip_tegalsari
  ADD COLUMN no_urut integer,
  ADD COLUMN nomor_rak text NOT NULL DEFAULT '',
  ADD COLUMN jenis_rak text NOT NULL DEFAULT 'Tipe 1',
  ADD COLUMN kapasitas_box_per_rak integer NOT NULL DEFAULT 20,
  ADD COLUMN jumlah_rak integer NOT NULL DEFAULT 0,
  ADD COLUMN kapasitas integer NOT NULL DEFAULT 0,
  ADD COLUMN jumlah_terisi_box integer NOT NULL DEFAULT 0,
  ADD COLUMN sisa_kapasitas_box integer NOT NULL DEFAULT 0;

-- Create sequence for no_urut
CREATE SEQUENCE IF NOT EXISTS gudang_arsip_no_urut_seq START 1;

-- Update existing records with sequential no_urut
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM gudang_arsip_tegalsari
)
UPDATE gudang_arsip_tegalsari g
SET no_urut = n.rn
FROM numbered_rows n
WHERE g.id = n.id;

-- Set default for new records
ALTER TABLE gudang_arsip_tegalsari 
  ALTER COLUMN no_urut SET DEFAULT nextval('gudang_arsip_no_urut_seq');

-- 2. Create pendataan_masuk table
CREATE TABLE IF NOT EXISTS pendataan_masuk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daftar_berkas_id uuid REFERENCES daftar_berkas(id) ON DELETE CASCADE,
  no_berkas integer NOT NULL,
  kode_klasifikasi text NOT NULL,
  uraian_informasi_berkas text NOT NULL,
  jenis_berkas text NOT NULL,
  nomor_rak text NOT NULL,
  sub_rak text NOT NULL,
  susun text NOT NULL,
  baris text NOT NULL,
  geotag text GENERATED ALWAYS AS (nomor_rak || sub_rak || susun || baris) STORED,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE pendataan_masuk ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pendataan_masuk
CREATE POLICY "Authenticated users can view pendataan_masuk"
  ON pendataan_masuk FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pendataan_masuk"
  ON pendataan_masuk FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pendataan_masuk"
  ON pendataan_masuk FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pendataan_masuk"
  ON pendataan_masuk FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_pendataan_masuk_updated_at
  BEFORE UPDATE ON pendataan_masuk
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();