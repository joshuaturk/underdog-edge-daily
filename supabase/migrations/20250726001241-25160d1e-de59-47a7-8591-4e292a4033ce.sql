-- Create table for live golf leaderboard data
CREATE TABLE public.golf_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  position INTEGER,
  total_score INTEGER,
  thru TEXT, -- 'F' for finished, number for holes completed
  current_round INTEGER DEFAULT 1,
  round_1_score INTEGER,
  round_2_score INTEGER,
  round_3_score INTEGER,
  round_4_score INTEGER,
  made_cut BOOLEAN DEFAULT true,
  is_top_10 BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'CUT', 'WON', 'LOST'
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.golf_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (leaderboard is public data)
CREATE POLICY "Golf leaderboard is publicly readable" 
ON public.golf_leaderboard 
FOR SELECT 
USING (true);

-- Create policy for service role to insert/update data
CREATE POLICY "Service role can manage golf leaderboard" 
ON public.golf_leaderboard 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_golf_leaderboard_tournament ON public.golf_leaderboard(tournament_name);
CREATE INDEX idx_golf_leaderboard_player ON public.golf_leaderboard(player_name);
CREATE INDEX idx_golf_leaderboard_updated ON public.golf_leaderboard(last_updated);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_golf_leaderboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_golf_leaderboard_updated_at
  BEFORE UPDATE ON public.golf_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_golf_leaderboard_updated_at();