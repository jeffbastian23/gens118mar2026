-- Populate eselon_iii from nm_unit_organisasi
UPDATE public.employees
SET eselon_iii = nm_unit_organisasi
WHERE nm_unit_organisasi IS NOT NULL;

-- Populate eselon_iv by extracting Seksi/Subbagian from uraian_jabatan
-- Pattern: "... Pada Seksi xxx, ..." or "Kepala Seksi xxx, ..."
UPDATE public.employees
SET eselon_iv = 
  CASE 
    -- Extract "Seksi xxx" pattern (before the comma)
    WHEN uraian_jabatan LIKE '%Pada Seksi %' THEN 
      regexp_replace(
        substring(uraian_jabatan FROM 'Pada (Seksi [^,]+)'),
        'Pada ', '', 'i'
      )
    WHEN uraian_jabatan LIKE '%Kepala Seksi %' THEN 
      substring(uraian_jabatan FROM '(Seksi [^,]+)')
    -- Extract "Subbagian xxx" pattern
    WHEN uraian_jabatan LIKE '%Pada Subbagian %' THEN 
      regexp_replace(
        substring(uraian_jabatan FROM 'Pada (Subbagian [^,]+)'),
        'Pada ', '', 'i'
      )
    WHEN uraian_jabatan LIKE '%Kepala Subbagian %' THEN 
      substring(uraian_jabatan FROM '(Subbagian [^,]+)')
    ELSE NULL
  END
WHERE uraian_jabatan IS NOT NULL;