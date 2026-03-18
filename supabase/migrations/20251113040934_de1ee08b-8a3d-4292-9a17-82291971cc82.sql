-- Fix Storage Bucket Permissions
-- Replace overly permissive policies with owner-based access control

-- ============================================
-- 1. DROP EXISTING OVERLY PERMISSIVE POLICIES
-- ============================================

-- Drop policies for assignment-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload assignment documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view assignment documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assignment documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assignment documents" ON storage.objects;

-- Drop policies for konsideran-documents bucket  
DROP POLICY IF EXISTS "Authenticated users can upload konsideran documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view konsideran documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update konsideran documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete konsideran documents" ON storage.objects;

-- ============================================
-- 2. CREATE OWNER-BASED POLICIES FOR ASSIGNMENT-DOCUMENTS
-- ============================================

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own assignment documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-documents' AND
  auth.role() = 'authenticated'
);

-- All authenticated users can view assignment documents (for collaboration)
CREATE POLICY "Users can view assignment documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-documents' AND
  auth.role() = 'authenticated'
);

-- Only owner or admin can update their documents
CREATE POLICY "Owner or admin can update assignment documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-documents' AND
  (auth.uid() = owner OR public.has_role(auth.uid(), 'admin'))
);

-- Only owner or admin can delete documents
CREATE POLICY "Owner or admin can delete assignment documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-documents' AND
  (auth.uid() = owner OR public.has_role(auth.uid(), 'admin'))
);

-- ============================================
-- 3. CREATE OWNER-BASED POLICIES FOR KONSIDERAN-DOCUMENTS
-- ============================================

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own konsideran documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'konsideran-documents' AND
  auth.role() = 'authenticated'
);

-- All authenticated users can view konsideran documents (for collaboration)
CREATE POLICY "Users can view konsideran documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'konsideran-documents' AND
  auth.role() = 'authenticated'
);

-- Only owner or admin can update their documents
CREATE POLICY "Owner or admin can update konsideran documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'konsideran-documents' AND
  (auth.uid() = owner OR public.has_role(auth.uid(), 'admin'))
);

-- Only owner or admin can delete documents
CREATE POLICY "Owner or admin can delete konsideran documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'konsideran-documents' AND
  (auth.uid() = owner OR public.has_role(auth.uid(), 'admin'))
);