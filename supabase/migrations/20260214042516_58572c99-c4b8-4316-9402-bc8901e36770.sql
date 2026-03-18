
-- Update get_next_tim_upk to exclude Bella Atria, Fakhrunnisa, and Izdhihar Rayhanah
CREATE OR REPLACE FUNCTION public.get_next_tim_upk()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_upk_id uuid;
BEGIN
  -- Get Tim UPK with lowest assignment count, excluding specific members
  -- Excluded: Bella Atria, Fakhrunnisa, Izdhihar Rayhanah
  SELECT id INTO next_upk_id
  FROM public.tim_upk
  WHERE email NOT IN (
    'bella.atria@kemenkeu.go.id',
    'fakhrunnisa@kemenkeu.go.id',
    'izdhihar.rayhanah@kemenkeu.go.id'
  )
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp) ASC
  LIMIT 1;
  
  -- Update the assignment count and last assigned time
  UPDATE public.tim_upk
  SET 
    assignment_count = assignment_count + 1,
    last_assigned_at = now(),
    updated_at = now()
  WHERE id = next_upk_id;
  
  RETURN next_upk_id;
END;
$function$;

-- Update get_next_tim_upk_for_plh to exclude same members
CREATE OR REPLACE FUNCTION public.get_next_tim_upk_for_plh()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_upk_id uuid;
BEGIN
  SELECT id INTO next_upk_id
  FROM tim_upk
  WHERE email NOT IN (
    'bella.atria@kemenkeu.go.id',
    'fakhrunnisa@kemenkeu.go.id',
    'izdhihar.rayhanah@kemenkeu.go.id'
  )
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp with time zone) ASC
  LIMIT 1;
  
  UPDATE tim_upk
  SET 
    assignment_count = assignment_count + 1,
    last_assigned_at = NOW()
  WHERE id = next_upk_id;
  
  RETURN next_upk_id;
END;
$function$;

-- Reset assignment counts for fair FIFO starting point
-- Set all eligible members to 0 so distribution starts fresh and fair
UPDATE public.tim_upk
SET assignment_count = 0, last_assigned_at = NULL
WHERE email NOT IN (
  'bella.atria@kemenkeu.go.id',
  'fakhrunnisa@kemenkeu.go.id',
  'izdhihar.rayhanah@kemenkeu.go.id'
);
