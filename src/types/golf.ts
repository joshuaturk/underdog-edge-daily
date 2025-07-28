export interface GolfPlayer {
  id: string;
  name: string;
  owgr: number; // Official World Golf Ranking
  fedexCupRank: number;
  recentForm: {
    top10sLast4Starts: number;
    top10sLast10Starts: number; // For new scoring system
    top10sThisSeason: number; // For season consistency
    sgTotalLast3: number;
    sgApproachLast3: number;
    sgAroundGreenLast3: number;
    sgPuttingLast3: number;
    sgOffTeeLastMonth: number;
    lastStartResult: string; // "T5", "MC", "T23", etc.
    // New fields for momentum scoring
    wonInLast3Events: boolean;
    top3InLast3Events: boolean;
    top10InLast3Events: boolean;
    madeCutInLast3Events: boolean;
  };
  courseHistory: {
    pastTop10s: number;
    bestFinish: string;
    timesPlayed: number;
    // New fields for course history scoring
    top3InLast3Years: boolean;
    top10InLast3Years: boolean;
    madeCutInLast3Years: boolean;
  };
  seasonStats: {
    drivingDistance: number;
    drivingAccuracy: number;
    sgApproach: number;
    sgAroundGreen: number;
    sgPutting: number;
    sgOffTee: number;
    sgTotal: number;
  };
  specialties: string[]; // ["wind player", "bermuda specialist", "links expert", etc.]
  // Live scoring data
  liveScore?: {
    currentPosition: number;
    totalScore: number;
    thru: number; // holes completed current round
    currentRound: number;
    rounds: number[]; // scores for each completed round
    isWinner: boolean; // Changed from isTop10 to isWinner
    status: 'WON' | 'LOST' | 'ACTIVE' | 'CUT';
    teeTime?: string;
    lastUpdated: Date;
  };
}

export interface GolfPick {
  id: string;
  player: GolfPlayer;
  confidence: number;
  scoreCardPoints: number;
  reason: string;
  winProbability: number; // Changed from top10Probability to winProbability
  valueRating: number; // New field for betting value assessment
  keyFactors: string[];
  riskFactors: string[];
  odds?: string; // e.g., "+185" - for outright winner odds
  impliedProbability?: number; // Calculated from odds
}

export interface GolfTournament {
  name: string;
  course: string;
  location: string;
  dates: string;
  purse: string;
  fieldStrength: 'Elite' | 'Strong' | 'Average' | 'Weak';
  courseCharacteristics: {
    length: number;
    parTotal: number;
    rough: 'Heavy' | 'Moderate' | 'Light';
    greens: 'Bentgrass' | 'Bermuda' | 'Mixed';
    wind: 'High' | 'Moderate' | 'Low';
    treelined: boolean;
    waterHazards: number;
    elevation: 'Sea Level' | 'Moderate' | 'High';
  };
  weatherForecast: {
    wind: string;
    temperature: string;
    precipitation: string;
  };
  pastWinners: Array<{
    year: string;
    winner: string;
    score: string;
  }>;
}

export interface GolfAnalysis {
  tournament: GolfTournament;
  picks: GolfPick[];
  lastUpdated: Date;
  confidence: 'High' | 'Medium' | 'Low';
  keyInsights: string[];
}