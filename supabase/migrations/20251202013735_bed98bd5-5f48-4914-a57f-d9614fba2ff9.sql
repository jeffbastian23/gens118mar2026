-- Add unique constraint to nip column in pendidikan table
-- First, remove any duplicate NIPs if they exist
DELETE FROM public.pendidikan a
USING public.pendidikan b
WHERE a.id > b.id 
AND a.nip = b.nip 
AND a.nip IS NOT NULL;

-- Add unique constraint
ALTER TABLE public.pendidikan 
ADD CONSTRAINT pendidikan_nip_unique UNIQUE (nip);

-- Add unique constraint to nip column in pensiun table
-- First, remove any duplicate NIPs if they exist
DELETE FROM public.pensiun a
USING public.pensiun b
WHERE a.id > b.id 
AND a.nip = b.nip 
AND a.nip IS NOT NULL;

-- Add unique constraint
ALTER TABLE public.pensiun 
ADD CONSTRAINT pensiun_nip_unique UNIQUE (nip);