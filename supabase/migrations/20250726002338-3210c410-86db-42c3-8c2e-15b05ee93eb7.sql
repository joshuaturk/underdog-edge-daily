-- Create table for betting picks history
CREATE TABLE public.betting_picks (
  id TEXT NOT NULL PRIMARY KEY,
  date TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  recommended_bet TEXT NOT NULL CHECK (recommended_bet IN ('home_runline', 'away_runline')),
  confidence INTEGER NOT NULL,
  reason TEXT NOT NULL,
  odds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'live')),
  home_score INTEGER,
  away_score INTEGER,
  score_difference INTEGER,
  profit DECIMAL,
  home_pitcher TEXT,
  away_pitcher TEXT,
  inning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint to prevent duplicate picks
  UNIQUE(date, home_team, away_team, recommended_bet)
);

-- Enable Row Level Security
ALTER TABLE public.betting_picks ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Betting picks are publicly readable" 
ON public.betting_picks 
FOR SELECT 
USING (true);

-- Create policy for service role to insert/update data
CREATE POLICY "Service role can manage betting picks" 
ON public.betting_picks 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_betting_picks_date ON public.betting_picks(date);
CREATE INDEX idx_betting_picks_status ON public.betting_picks(status);
CREATE INDEX idx_betting_picks_created_at ON public.betting_picks(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_betting_picks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_betting_picks_updated_at
  BEFORE UPDATE ON public.betting_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_betting_picks_updated_at();