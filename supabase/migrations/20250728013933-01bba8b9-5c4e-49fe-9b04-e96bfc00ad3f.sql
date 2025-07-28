-- Fix the remaining function search path issue for the existing golf function
CREATE OR REPLACE FUNCTION public.update_golf_leaderboard_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;