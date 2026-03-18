-- Create storage bucket for assignment documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-documents',
  'assignment-documents',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf']
);

-- Create RLS policies for assignment-documents bucket
CREATE POLICY "Authenticated users can upload assignment documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view assignment documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'assignment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their assignment documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'assignment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete assignment documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'assignment-documents' AND auth.role() = 'authenticated');

-- Add document_path column to assignments table
ALTER TABLE public.assignments
ADD COLUMN document_path text;