-- Fix konsep_masuk_by for agenda 38 from 'Unknown' to correct email
UPDATE public.assignments 
SET konsep_masuk_by = 'elsa.april@kemenkeu.go.id' 
WHERE agenda_number = 38 AND konsep_masuk_by = 'Unknown';