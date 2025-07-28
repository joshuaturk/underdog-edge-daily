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
  league: 'Premier League' | 'Championship';
  gameweek: number;
  status: 'upcoming' | 'live' | 'finished';
}

export interface TeamBTTSStats {
  teamName: string;
  league: 'Premier League' | 'Championship';
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
  league: 'Premier League' | 'Championship';
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamRate: number;
  awayTeamRate: number;
  probability: number; // P_BTTS
  confidence: number; // probability * 100
  kickoffTime: string;
  date: string;
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