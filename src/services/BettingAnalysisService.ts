import { BettingPick, TeamStats, DailyAnalysis, BettingResults } from '@/types/betting';

export class BettingAnalysisService {
  private static readonly PROFITABLE_TEAMS = [
    { name: 'Houston', runlineRate: 81.2, homeRate: 79.5, awayRate: 82.1 },
    { name: 'Toronto', runlineRate: 73.3, homeRate: 71.2, awayRate: 74.8 },
    { name: 'Tampa Bay', runlineRate: 69.6, homeRate: 67.1, awayRate: 71.3 },
    { name: 'San Diego', runlineRate: 69.4, homeRate: 66.8, awayRate: 71.2 },
    { name: 'LA Angels', runlineRate: 61.7, homeRate: 58.9, awayRate: 63.4 },
    { name: 'Cincinnati', runlineRate: 62.1, homeRate: 59.8, awayRate: 63.7 },
    { name: 'Miami', runlineRate: 62.1, homeRate: 60.2, awayRate: 63.5 }
  ];

  private static readonly MIN_CONFIDENCE_THRESHOLD = 65;
  private static readonly ROAD_DOG_BONUS = 5;
  private static readonly RECENT_FORM_WEIGHT = 0.3;

  static analyzeGame(homeTeam: string, awayTeam: string, isHomeUnderdog: boolean, odds: number, homePitcher?: string, awayPitcher?: string): BettingPick | null {
    const homeStats = this.getTeamStats(homeTeam);
    const awayStats = this.getTeamStats(awayTeam);
    
    if (!homeStats && !awayStats) return null;

    let confidence = 0;
    let recommendedBet: 'home_runline' | 'away_runline';
    let reason = '';

    if (isHomeUnderdog && homeStats) {
      // Home team is underdog
      confidence = homeStats.homeRate;
      recommendedBet = 'home_runline';
      reason = `${homeTeam} as home underdog - ${homeStats.runlineRate}% runline cover rate`;
    } else if (!isHomeUnderdog && awayStats) {
      // Away team is underdog (road dog - bonus points)
      confidence = awayStats.awayRate + this.ROAD_DOG_BONUS;
      recommendedBet = 'away_runline';
      reason = `${awayTeam} as road underdog - ${awayStats.runlineRate}% runline cover rate + road dog bonus`;
    } else {
      return null;
    }

    // Apply recent form adjustment
    const teamStats = isHomeUnderdog ? homeStats : awayStats;
    if (teamStats && teamStats.recentForm) {
      const formAdjustment = (teamStats.recentForm - 60) * this.RECENT_FORM_WEIGHT;
      confidence += formAdjustment;
    }

    // Only recommend if confidence meets threshold
    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return null;
    }

    return {
      id: `${homeTeam}-${awayTeam}-${new Date().toISOString().split('T')[0]}`,
      date: new Date().toISOString().split('T')[0],
      homeTeam,
      awayTeam,
      recommendedBet,
      confidence: Math.min(confidence, 95), // Cap at 95%
      reason,
      odds,
      status: 'pending',
      homePitcher,
      awayPitcher
    };
  }

  private static getTeamStats(teamName: string): { runlineRate: number; homeRate: number; awayRate: number; recentForm?: number } | null {
    const team = this.PROFITABLE_TEAMS.find(t => 
      t.name.toLowerCase().includes(teamName.toLowerCase()) || 
      teamName.toLowerCase().includes(t.name.toLowerCase())
    );
    
    if (!team) return null;

    return {
      runlineRate: team.runlineRate,
      homeRate: team.homeRate,
      awayRate: team.awayRate,
      recentForm: team.runlineRate + Math.random() * 10 - 5 // Simulated recent form
    };
  }

  static calculateDayOfWeekBonus(date: Date): number {
    const dayOfWeek = date.getDay();
    // Thursday (4) and Saturday (6) get bonuses based on analysis
    if (dayOfWeek === 4) return 3; // Thursday bonus
    if (dayOfWeek === 6) return 4; // Saturday bonus
    return 0;
  }

  static analyzeResults(picks: BettingPick[]): BettingResults {
    const completedPicks = picks.filter(p => p.status !== 'pending');
    const wonPicks = completedPicks.filter(p => p.status === 'won');
    const lostPicks = completedPicks.filter(p => p.status === 'lost');
    const pushPicks = completedPicks.filter(p => p.status === 'push');

    const totalProfit = completedPicks.reduce((sum, pick) => sum + (pick.profit || 0), 0);
    const winRate = completedPicks.length > 0 ? (wonPicks.length / completedPicks.length) * 100 : 0;
    const roi = completedPicks.length > 0 ? (totalProfit / completedPicks.length) * 100 : 0;

    // Calculate current streak
    let streak: { type: 'win' | 'loss'; count: number } = { type: 'win', count: 0 };
    if (completedPicks.length > 0) {
      const recent = [...completedPicks].reverse();
      const firstStatus = recent[0].status;
      let count = 0;
      
      for (const pick of recent) {
        if (pick.status === firstStatus && pick.status !== 'push') {
          count++;
        } else {
          break;
        }
      }
      
      streak = {
        type: firstStatus === 'won' ? 'win' : 'loss',
        count
      };
    }

    return {
      totalPicks: completedPicks.length,
      wonPicks: wonPicks.length,
      lostPicks: lostPicks.length,
      pushPicks: pushPicks.length,
      winRate,
      totalProfit,
      roi,
      streak
    };
  }

  static mockDailyGames(): Array<{homeTeam: string, awayTeam: string, isHomeUnderdog: boolean, odds: number}> {
    const teams = ['Houston', 'Toronto', 'Tampa Bay', 'San Diego', 'LA Angels', 'Cincinnati', 'Miami', 
                  'Yankees', 'Dodgers', 'Red Sox', 'Giants', 'Braves', 'Cubs', 'Mets', 'Rangers'];
    
    const games = [];
    const numGames = Math.floor(Math.random() * 8) + 8; // 8-15 games
    
    for (let i = 0; i < numGames; i++) {
      const homeIdx = Math.floor(Math.random() * teams.length);
      let awayIdx = Math.floor(Math.random() * teams.length);
      while (awayIdx === homeIdx) {
        awayIdx = Math.floor(Math.random() * teams.length);
      }
      
      games.push({
        homeTeam: teams[homeIdx],
        awayTeam: teams[awayIdx],
        isHomeUnderdog: Math.random() > 0.6, // 40% chance home team is underdog
        odds: -110 + Math.floor(Math.random() * 40) // Odds between -110 and -70
      });
    }
    
    return games;
  }
}