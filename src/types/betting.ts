export interface BettingPick {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  recommendedBet: 'home_runline' | 'away_runline';
  confidence: number;
  reason: string;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'push';
  result?: {
    homeScore: number;
    awayScore: number;
    scoreDifference: number;
  };
  profit?: number;
  homePitcher?: string;
  awayPitcher?: string;
}

export interface TeamStats {
  team: string;
  runlineCoverRate: number;
  homeRunlineCoverRate: number;
  awayRunlineCoverRate: number;
  recentForm: number;
  unitsProfit: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesPush: number;
}

export interface DailyAnalysis {
  date: string;
  totalGames: number;
  qualifiedPicks: BettingPick[];
  averageConfidence: number;
  expectedValue: number;
}

export interface BettingResults {
  totalPicks: number;
  wonPicks: number;
  lostPicks: number;
  pushPicks: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  streak: {
    type: 'win' | 'loss';
    count: number;
  };
}