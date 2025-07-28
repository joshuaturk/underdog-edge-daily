-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Re-create the triggers to use the updated function
DROP TRIGGER IF EXISTS update_btts_picks_updated_at ON public.btts_picks;
DROP TRIGGER IF EXISTS update_team_btts_stats_updated_at ON public.team_btts_stats;

CREATE TRIGGER update_btts_picks_updated_at
BEFORE UPDATE ON public.btts_picks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_btts_stats_updated_at
BEFORE UPDATE ON public.team_btts_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();