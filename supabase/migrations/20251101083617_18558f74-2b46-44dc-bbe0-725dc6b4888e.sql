-- Create storage bucket for konsideran documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'konsideran-documents',
  'konsideran-documents',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf']
);

-- Create RLS policies for konsideran-documents bucket
CREATE POLICY "Authenticated users can upload konsideran documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'konsideran-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view konsideran documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'konsideran-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their konsideran documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'konsideran-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete konsideran documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'konsideran-documents' AND auth.role() = 'authenticated');

-- Add document_path column to plh_kepala table
ALTER TABLE public.plh_kepala
ADD COLUMN document_path text;