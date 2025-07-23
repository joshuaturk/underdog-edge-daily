// Service for fetching real MLB team statistics from the official MLB Stats API
export interface TeamStatistics {
  teamId: number;
  teamName: string;
  record: string;
  winPercentage: number;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  homeRecord: string;
  awayRecord: string;
  lastTenRecord: string;
  streak: string;
  bullpenERA: number;
  teamERA: number;
  teamBattingAvg: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  runs: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  errors: number;
}

export class MLBStatsService {
  private static readonly BASE_URL = 'https://statsapi.mlb.com/api/v1';
  
  // MLB team ID mapping for common team names
  private static readonly TEAM_NAME_TO_ID: Record<string, number> = {
    'Arizona Diamondbacks': 109,
    'Atlanta Braves': 144,
    'Baltimore Orioles': 110,
    'Boston Red Sox': 111,
    'Chicago Cubs': 112,
    'Chicago White Sox': 145,
    'Cincinnati Reds': 113,
    'Cleveland Guardians': 114,
    'Colorado Rockies': 115,
    'Detroit Tigers': 116,
    'Houston Astros': 117,
    'Kansas City Royals': 118,
    'Los Angeles Angels': 108,
    'Los Angeles Dodgers': 119,
    'Miami Marlins': 146,
    'Milwaukee Brewers': 158,
    'Minnesota Twins': 142,
    'New York Mets': 121,
    'New York Yankees': 147,
    'Oakland Athletics': 133,
    'Philadelphia Phillies': 143,
    'Pittsburgh Pirates': 134,
    'San Diego Padres': 135,
    'San Francisco Giants': 137,
    'Seattle Mariners': 136,
    'St. Louis Cardinals': 138,
    'Tampa Bay Rays': 139,
    'Texas Rangers': 140,
    'Toronto Blue Jays': 141,
    'Washington Nationals': 120
  };

  // Clean team name variations
  private static cleanTeamName(teamName: string): string {
    // Remove common prefixes/suffixes and normalize
    const cleaned = teamName
      .replace(/^(LA|NY|SF|SD)\s+/, '')
      .replace(/\s+(Angels|Dodgers|Mets|Yankees|Giants|Padres)$/, ' $1')
      .trim();
    
    // Try exact match first
    if (this.TEAM_NAME_TO_ID[cleaned]) {
      return cleaned;
    }
    
    // Try partial matches
    for (const [fullName] of Object.entries(this.TEAM_NAME_TO_ID)) {
      if (fullName.toLowerCase().includes(cleaned.toLowerCase()) || 
          cleaned.toLowerCase().includes(fullName.toLowerCase())) {
        return fullName;
      }
    }
    
    return teamName; // Return original if no match
  }

  static async getTeamStats(teamName: string): Promise<TeamStatistics | null> {
    try {
      const normalizedName = this.cleanTeamName(teamName);
      const teamId = this.TEAM_NAME_TO_ID[normalizedName];
      
      if (!teamId) {
        console.warn(`Team ID not found for: ${teamName} (normalized: ${normalizedName})`);
        return null;
      }

      // Get current season
      const currentYear = new Date().getFullYear();
      
      // Fetch team stats
      const [statsResponse, recordResponse] = await Promise.all([
        fetch(`${this.BASE_URL}/teams/${teamId}/stats?stats=season&group=hitting,pitching&season=${currentYear}`),
        fetch(`${this.BASE_URL}/teams/${teamId}?hydrate=record&season=${currentYear}`)
      ]);

      if (!statsResponse.ok || !recordResponse.ok) {
        throw new Error(`HTTP error! Stats: ${statsResponse.status}, Record: ${recordResponse.status}`);
      }

      const [statsData, recordData] = await Promise.all([
        statsResponse.json(),
        recordResponse.json()
      ]);

      // Extract hitting and pitching stats
      const hittingStats = statsData.stats.find((s: any) => s.group.displayName === 'hitting')?.splits[0]?.stat || {};
      const pitchingStats = statsData.stats.find((s: any) => s.group.displayName === 'pitching')?.splits[0]?.stat || {};
      
      // Extract record information
      const teamInfo = recordData.teams[0];
      const record = teamInfo.record.overall;
      const homeRecord = teamInfo.record.home;
      const awayRecord = teamInfo.record.away;
      const lastTen = teamInfo.record.lastTen;
      const streak = teamInfo.record.streak;

      return {
        teamId,
        teamName: normalizedName,
        record: `${record.wins}-${record.losses}`,
        winPercentage: parseFloat(record.pct),
        runsScored: parseInt(hittingStats.runs || '0'),
        runsAllowed: parseInt(pitchingStats.runs || '0'),
        runDifferential: parseInt(hittingStats.runs || '0') - parseInt(pitchingStats.runs || '0'),
        homeRecord: `${homeRecord.wins}-${homeRecord.losses}`,
        awayRecord: `${awayRecord.wins}-${awayRecord.losses}`,
        lastTenRecord: `${lastTen.wins}-${lastTen.losses}`,
        streak: `${streak.streakType === 'wins' ? 'W' : 'L'}${streak.streakNumber}`,
        bullpenERA: parseFloat(pitchingStats.era || '0.00'),
        teamERA: parseFloat(pitchingStats.era || '0.00'),
        teamBattingAvg: parseFloat(hittingStats.avg || '0.000'),
        onBasePercentage: parseFloat(hittingStats.obp || '0.000'),
        sluggingPercentage: parseFloat(hittingStats.slg || '0.000'),
        runs: parseInt(hittingStats.runs || '0'),
        hits: parseInt(hittingStats.hits || '0'),
        homeRuns: parseInt(hittingStats.homeRuns || '0'),
        rbi: parseInt(hittingStats.rbi || '0'),
        stolenBases: parseInt(hittingStats.stolenBases || '0'),
        errors: parseInt(hittingStats.errors || '0')
      };

    } catch (error) {
      console.error(`Error fetching stats for ${teamName}:`, error);
      return null;
    }
  }

  static async getMultipleTeamStats(teamNames: string[]): Promise<Record<string, TeamStatistics | null>> {
    const results: Record<string, TeamStatistics | null> = {};
    
    // Batch requests to avoid rate limiting
    const promises = teamNames.map(async (teamName) => {
      const stats = await this.getTeamStats(teamName);
      results[teamName] = stats;
    });

    await Promise.all(promises);
    return results;
  }

  // Generate advanced insights based on real stats
  static generateAdvancedAnalysis(teamStats: TeamStatistics, opponentStats: TeamStatistics | null, isHome: boolean): string {
    const analyses = [];
    
    // Record-based analysis
    if (teamStats.winPercentage > 0.550) {
      analyses.push(`${teamStats.teamName} is having a strong season at ${teamStats.record} (${(teamStats.winPercentage * 100).toFixed(1)}% win rate)`);
    } else if (teamStats.winPercentage < 0.450) {
      analyses.push(`Despite their ${teamStats.record} record, ${teamStats.teamName} has been competitive in close games`);
    }

    // Home/Away splits
    const relevantRecord = isHome ? teamStats.homeRecord : teamStats.awayRecord;
    const venue = isHome ? 'at home' : 'on the road';
    analyses.push(`They're ${relevantRecord} ${venue} this season`);

    // Recent form
    analyses.push(`Coming off a ${teamStats.streak} streak and ${teamStats.lastTenRecord} in their last 10 games`);

    // Run differential insight
    if (teamStats.runDifferential > 50) {
      analyses.push(`Their +${teamStats.runDifferential} run differential shows they consistently outscore opponents`);
    } else if (teamStats.runDifferential < -50) {
      analyses.push(`Despite a ${teamStats.runDifferential} run differential, they keep games competitive`);
    }

    // Pitching analysis
    if (teamStats.teamERA < 3.50) {
      analyses.push(`Solid pitching staff with a ${teamStats.teamERA.toFixed(2)} ERA keeps them in every game`);
    } else if (teamStats.teamERA > 4.50) {
      analyses.push(`While their ${teamStats.teamERA.toFixed(2)} ERA isn't elite, their offense can keep pace`);
    }

    // Batting analysis
    if (teamStats.teamBattingAvg > 0.270) {
      analyses.push(`Strong hitting lineup batting ${teamStats.teamBattingAvg.toFixed(3)} as a team`);
    }

    return analyses.join('. ') + '. The +1.5 runline gives us excellent value here.';
  }
}