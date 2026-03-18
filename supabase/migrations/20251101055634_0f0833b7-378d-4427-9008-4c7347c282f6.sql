-- Allow authenticated users to update download status fields
CREATE POLICY "Users can update download status"
ON public.assignments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can update download status" ON public.assignments IS 
'Allows all authenticated users to update download status fields (nota_dinas_downloaded, surat_tugas_downloaded, etc.) when they download documents';