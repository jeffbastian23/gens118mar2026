-- Create public-assets bucket for login backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access for public-assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'public-assets');

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload to public-assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update in public-assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete from public-assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');