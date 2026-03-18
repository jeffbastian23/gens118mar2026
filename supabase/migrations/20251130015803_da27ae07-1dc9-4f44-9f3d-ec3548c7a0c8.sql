-- Create storage bucket for konsep documents (Excel/Word files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('konsep-documents', 'konsep-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for konsep-documents bucket
CREATE POLICY "Authenticated users can upload konsep documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'konsep-documents');

CREATE POLICY "Authenticated users can view konsep documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'konsep-documents');

CREATE POLICY "Authenticated users can update konsep documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'konsep-documents');

CREATE POLICY "Authenticated users can delete konsep documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'konsep-documents');