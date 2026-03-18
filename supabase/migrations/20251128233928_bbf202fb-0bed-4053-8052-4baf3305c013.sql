-- Create table for QR Presensi locations and events
CREATE TABLE qr_presensi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kegiatan TEXT NOT NULL,
  link_tujuan TEXT NOT NULL,
  qr_code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meter INTEGER NOT NULL DEFAULT 5,
  tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create table for QR attendance responses
CREATE TABLE qr_presensi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES qr_presensi_events(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nip TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distance_meter DOUBLE PRECISION NOT NULL,
  waktu_absen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  foto_absen TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE qr_presensi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_presensi_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_presensi_events
CREATE POLICY "Authenticated users can view events"
  ON qr_presensi_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage events"
  ON qr_presensi_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for qr_presensi_responses
CREATE POLICY "Authenticated users can view responses"
  ON qr_presensi_responses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert responses"
  ON qr_presensi_responses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage responses"
  ON qr_presensi_responses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_qr_events_active ON qr_presensi_events(is_active);
CREATE INDEX idx_qr_events_dates ON qr_presensi_events(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_qr_responses_event ON qr_presensi_responses(event_id);
CREATE INDEX idx_qr_responses_waktu ON qr_presensi_responses(waktu_absen);