-- Create table for storing BTTS picks and analysis
CREATE TABLE public.btts_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league TEXT NOT NULL CHECK (league IN ('Premier League', 'Championship')),
  gameweek INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_rate DECIMAL(5,4) NOT NULL,
  away_team_rate DECIMAL(5,4) NOT NULL,
  probability DECIMAL(5,4) NOT NULL,
  confidence INTEGER NOT NULL,
  kickoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
  match_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing team BTTS statistics
CREATE TABLE public.team_btts_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('Premier League', 'Championship')),
  recency_weighted_rate DECIMAL(5,4) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_name, league)
);

-- Create table for storing BTTS analysis metadata
CREATE TABLE public.btts_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  premier_league_gameweek INTEGER NOT NULL,
  championship_gameweek INTEGER NOT NULL,
  total_picks INTEGER NOT NULL DEFAULT 0,
  average_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.btts_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_btts_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btts_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no auth required for sports data)
CREATE POLICY "BTTS picks are viewable by everyone" 
ON public.btts_picks 
FOR SELECT 
USING (true);

CREATE POLICY "Team BTTS stats are viewable by everyone" 
ON public.team_btts_stats 
FOR SELECT 
USING (true);

CREATE POLICY "BTTS analysis is viewable by everyone" 
ON public.btts_analysis 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_btts_picks_league_gameweek ON public.btts_picks(league, gameweek);
CREATE INDEX idx_btts_picks_confidence ON public.btts_picks(confidence DESC);
CREATE INDEX idx_team_btts_stats_team_league ON public.team_btts_stats(team_name, league);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_btts_picks_updated_at
BEFORE UPDATE ON public.btts_picks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_btts_stats_updated_at
BEFORE UPDATE ON public.team_btts_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();