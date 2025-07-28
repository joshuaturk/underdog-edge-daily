export interface SoccerMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  kickoffTime: string;
  result?: {
    homeScore: number;
    awayScore: number;
    btts: boolean; // Both Teams To Score
  };
  league: 'Premier League' | 'Championship' | 'La Liga' | 'Bundesliga' | 'Serie A' | 'Ligue 1';
  gameweek: number;
  status: 'upcoming' | 'live' | 'finished';
  venue?: string;
  isOutdoor?: boolean;
  weather?: {
    temperature: string;
    conditions: string;
    humidity: string;
  };
}

export interface TeamBTTSStats {
  teamName: string;
  league: 'Premier League' | 'Championship' | 'La Liga' | 'Bundesliga' | 'Serie A' | 'Ligue 1';
  lastMatches: {
    opponent: string;
    date: string;
    btts: boolean;
    isHome: boolean;
  }[];
  recencyWeightedBTTSRate: number; // R_T in the algorithm
}

export interface BTTSPick {
  id: string;
  league: 'Premier League' | 'Championship' | 'La Liga' | 'Bundesliga' | 'Serie A' | 'Ligue 1';
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamRate: number;
  awayTeamRate: number;
  probability: number; // P_BTTS
  confidence: number; // probability * 100
  valueRating: number; // Betting value assessment
  kickoffTime: string;
  date: string;
  venue?: string;
  weather?: {
    temperature: string;
    conditions: string;
    humidity: string;
  };
}

export interface BTTSAnalysis {
  lastUpdated: Date;
  currentGameweek: {
    premierLeague: number;
    championship: number;
  };
  picks: BTTSPick[];
  totalPicks: number;
  averageConfidence: number;
}

export interface FootballAPIResponse {
  success: boolean;
  data: any;
  source: string;
  errors?: string[];
}