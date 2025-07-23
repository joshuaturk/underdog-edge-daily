export interface GolfPlayer {
  id: string;
  name: string;
  owgr: number; // Official World Golf Ranking
  fedexCupRank: number;
  recentForm: {
    top10sLast4Starts: number;
    sgTotalLast3: number;
    sgApproachLast3: number;
    sgAroundGreenLast3: number;
    sgPuttingLast3: number;
    sgOffTeeLastMonth: number;
    lastStartResult: string; // "T5", "MC", "T23", etc.
  };
  courseHistory: {
    pastTop10s: number;
    bestFinish: string;
    timesPlayed: number;
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
}

export interface GolfPick {
  id: string;
  player: GolfPlayer;
  confidence: number;
  scoreCardPoints: number;
  reason: string;
  top10Probability: number;
  keyFactors: string[];
  riskFactors: string[];
  odds: {
    bet365: number;
    impliedProbability: number;
  };
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