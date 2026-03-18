-- Hapus user roles untuk user yang akan dihapus
DELETE FROM public.user_roles 
WHERE user_id IN (
  'eb0d0274-dcf2-4462-a77f-cbc7cebc61ef', -- Sadis
  '257c0ec3-2d02-4893-a844-61ec4436709c', -- Melanisa K
  '5246dcdb-fdbb-49a3-ba28-75909ab6e120', -- pora
  '8e90e369-d32f-497d-a01a-2b1f1c815d94'  -- duana
);

-- Hapus profiles untuk user yang akan dihapus
DELETE FROM public.profiles 
WHERE user_id IN (
  'eb0d0274-dcf2-4462-a77f-cbc7cebc61ef', -- Sadis
  '257c0ec3-2d02-4893-a844-61ec4436709c', -- Melanisa K
  '5246dcdb-fdbb-49a3-ba28-75909ab6e120', -- pora
  '8e90e369-d32f-497d-a01a-2b1f1c815d94'  -- duana
);