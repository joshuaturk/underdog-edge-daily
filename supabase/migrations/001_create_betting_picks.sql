-- Create table for storing betting picks
CREATE TABLE IF NOT EXISTS betting_picks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  recommended_bet TEXT NOT NULL CHECK (recommended_bet IN ('home_runline', 'away_runline')),
  confidence DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  odds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push')),
  home_score INTEGER,
  away_score INTEGER,
  score_difference INTEGER,
  profit DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_betting_picks_date ON betting_picks(date DESC);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_betting_picks_status ON betting_picks(status);

-- Enable Row Level Security
ALTER TABLE betting_picks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all picks
CREATE POLICY "Allow read access to betting picks" ON betting_picks
  FOR SELECT USING (true);

-- Create policy to allow insert/update for system operations
CREATE POLICY "Allow insert/update betting picks" ON betting_picks
  FOR ALL USING (true);