
-- Create storage bucket for realisasi PDF files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('realisasi-pdf', 'realisasi-pdf', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload PDF" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'realisasi-pdf');

-- Allow public read access
CREATE POLICY "Public can read realisasi PDF" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'realisasi-pdf');

-- Allow authenticated users to list files
CREATE POLICY "Authenticated users can list realisasi PDF" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'realisasi-pdf');
