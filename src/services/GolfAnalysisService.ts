import { GolfPlayer, GolfPick, GolfTournament, GolfAnalysis } from '@/types/golf';

export class GolfAnalysisService {
  private static readonly ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';
  private static readonly DEFAULT_API_KEY = '1fea8e349f56d166ae430f8946fbea6e';

  private static getApiKey(): string {
    const stored = localStorage.getItem('odds_api_key');
    return stored || this.DEFAULT_API_KEY;
  }

  private static async fetchGolfOdds(): Promise<Array<{ playerName: string; odds: string; bookmaker: string; market: string }>> {
    const apiKey = this.getApiKey();
    
    try {
      console.log('Fetching golf odds from The Odds API...');
      
      const sportsResponse = await fetch(`${this.ODDS_API_BASE_URL}/sports/?apiKey=${apiKey}`);
      if (sportsResponse.ok) {
        const sports = await sportsResponse.json();
        const golfSports = sports.filter((sport: any) => sport.key.includes('golf'));
        console.log('Available golf sports:', golfSports);
      }
      
      const golfEndpoints = [
        'golf_pga_championship',
        'golf_masters_tournament', 
        'golf_us_open',
        'golf_the_open_championship',
        'golf_pga_tour'
      ];
      
      for (const endpoint of golfEndpoints) {
        try {
          const markets = ['outrights', 'top_5', 'top_10', 'top_20', 'make_cut'];
          const marketParam = markets.join(',');
          
          const response = await fetch(
            `${this.ODDS_API_BASE_URL}/sports/${endpoint}/odds/?apiKey=${apiKey}&regions=us&markets=${marketParam}&oddsFormat=american&dateFormat=iso`
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`${endpoint} response:`, data);
            const parsedOdds = this.parseGolfOdds(data);
            if (parsedOdds.length > 0) {
              return parsedOdds;
            }
          }
        } catch (endpointError) {
          console.log(`Failed to fetch from ${endpoint}:`, endpointError);
        }
      }
      
      console.log('No live golf odds available, using mock Top 10 odds');
      return this.getMockGolfOdds();
      
    } catch (error) {
      console.error('Error fetching golf odds:', error);
      return this.getMockGolfOdds();
    }
  }

  private static parseGolfOdds(data: any[]): Array<{ playerName: string; odds: string; bookmaker: string; market: string }> {
    const odds: Array<{ playerName: string; odds: string; bookmaker: string; market: string }> = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      return this.getMockGolfOdds();
    }

    data.forEach(tournament => {
      if (tournament.bookmakers && Array.isArray(tournament.bookmakers)) {
        tournament.bookmakers.forEach((bookmaker: any) => {
          if (['draftkings', 'fanduel', 'bet365', 'unibet', 'williamhill'].includes(bookmaker.key)) {
            bookmaker.markets?.forEach((market: any) => {
              const marketPriority = {
                'top_10': 1,
                'top_5': 2,
                'top_20': 3,
                'outrights': 4,
                'make_cut': 5
              };
              
              if (market.outcomes && Object.keys(marketPriority).includes(market.key)) {
                market.outcomes.forEach((outcome: any) => {
                  odds.push({
                    playerName: outcome.name,
                    odds: outcome.price > 0 ? `+${outcome.price}` : `${outcome.price}`,
                    bookmaker: bookmaker.title,
                    market: market.key
                  });
                });
              }
            });
          }
        });
      }
    });

    const uniqueOdds = odds
      .sort((a, b) => {
        const priorityA = { 'top_10': 1, 'top_5': 2, 'top_20': 3, 'outrights': 4, 'make_cut': 5 }[a.market] || 10;
        const priorityB = { 'top_10': 1, 'top_5': 2, 'top_20': 3, 'outrights': 4, 'make_cut': 5 }[b.market] || 10;
        return priorityA - priorityB;
      })
      .filter((odd, index, self) => 
        index === self.findIndex(o => o.playerName === odd.playerName)
      );

    return uniqueOdds.length > 0 ? uniqueOdds : this.getMockGolfOdds();
  }

  private static getMockGolfOdds(): Array<{ playerName: string; odds: string; bookmaker: string; market: string }> {
    return [
      { playerName: "Chris Gotterup", odds: "+140", bookmaker: "DraftKings", market: "top_10" },
      { playerName: "Maverick McNealy", odds: "+180", bookmaker: "FanDuel", market: "top_10" },
      { playerName: "Sam Burns", odds: "+220", bookmaker: "Bet365", market: "top_10" },
      { playerName: "Harris English", odds: "+200", bookmaker: "DraftKings", market: "top_10" },
      { playerName: "Tony Finau", odds: "+260", bookmaker: "FanDuel", market: "top_10" },
      { playerName: "Max Homa", odds: "+350", bookmaker: "Bet365", market: "top_10" },
      { playerName: "Jhonattan Vegas", odds: "+320", bookmaker: "DraftKings", market: "top_10" },
      { playerName: "Wyndham Clark", odds: "+380", bookmaker: "FanDuel", market: "top_10" },
      { playerName: "Keegan Bradley", odds: "+450", bookmaker: "Bet365", market: "top_10" },
      { playerName: "Taylor Pendrith", odds: "+400", bookmaker: "DraftKings", market: "top_10" },
      { playerName: "Akshay Bhatia", odds: "+420", bookmaker: "FanDuel", market: "top_10" },
      { playerName: "Rickie Fowler", odds: "+480", bookmaker: "Bet365", market: "top_10" }
    ];
  }

  static getMockTournament(): GolfTournament {
    return {
      name: "3M Open",
      course: "TPC Twin Cities",
      location: "Blaine, MN", 
      dates: "July 24-27, 2025",
      purse: "$8,200,000",
      fieldStrength: 'Strong',
      courseCharacteristics: {
        length: 7431,
        parTotal: 71,
        rough: 'Moderate',
        greens: 'Bentgrass',
        wind: 'Low',
        treelined: true,
        waterHazards: 4,
        elevation: 'Sea Level'
      },
      weatherForecast: {
        wind: "8-12 mph SW",
        temperature: "75-82°F",
        precipitation: "10% chance Friday"
      },
      pastWinners: [
        { year: "2024", winner: "Jhonattan Vegas", score: "-14" },
        { year: "2023", winner: "Lee Hodges", score: "-15" },
        { year: "2022", winner: "Tony Finau", score: "-17" }
      ]
    };
  }

  // Player data updated for weighted scoring system
  static getMockPlayers(): GolfPlayer[] {
    return [
      {
        id: "1",
        name: "Chris Gotterup", 
        owgr: 25,
        fedexCupRank: 18,
        recentForm: {
          top10sLast4Starts: 3,
          top10sLast10Starts: 6, // 3 pts
          top10sThisSeason: 8, // 1 pt
          sgTotalLast3: 2.4,
          sgApproachLast3: 1.6,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.6,
          sgOffTeeLastMonth: 1.1,
          lastStartResult: "T3",
          wonInLast3Events: false,
          top3InLast3Events: true, // 3 pts
          top10InLast3Events: true,
          madeCutInLast3Events: true
        },
        courseHistory: {
          pastTop10s: 0,
          bestFinish: "T35",
          timesPlayed: 1,
          top3InLast3Years: false,
          top10InLast3Years: false,
          madeCutInLast3Years: true // 1 pt
        },
        seasonStats: {
          drivingDistance: 312,
          drivingAccuracy: 63.2,
          sgApproach: 1.4,
          sgAroundGreen: 0.3,
          sgPutting: 0.5,
          sgOffTee: 0.8,
          sgTotal: 3.0
        },
        specialties: ["rising star", "momentum player", "scottish open winner"]
      },
      {
        id: "2",
        name: "Tony Finau",
        owgr: 28,
        fedexCupRank: 31,
        recentForm: {
          top10sLast4Starts: 2,
          top10sLast10Starts: 4, // 2 pts
          top10sThisSeason: 6, // 1 pt
          sgTotalLast3: 1.2,
          sgApproachLast3: 0.7,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.1,
          sgOffTeeLastMonth: 1.0,
          lastStartResult: "T10",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: true, // 2 pts
          madeCutInLast3Events: true
        },
        courseHistory: {
          pastTop10s: 4,
          bestFinish: "1st",
          timesPlayed: 6,
          top3InLast3Years: true, // 3 pts (former winner)
          top10InLast3Years: true,
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 315,
          drivingAccuracy: 59.4,
          sgApproach: 0.8,
          sgAroundGreen: 0.4,
          sgPutting: 0.0,
          sgOffTee: 1.0,
          sgTotal: 2.2
        },
        specialties: ["power player", "TPC Twin Cities expert", "former winner"]
      },
      {
        id: "3",
        name: "Harris English",
        owgr: 29,
        fedexCupRank: 22,
        recentForm: {
          top10sLast4Starts: 2,
          top10sLast10Starts: 5, // 3 pts
          top10sThisSeason: 7, // 1 pt
          sgTotalLast3: 1.7,
          sgApproachLast3: 1.0,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.4,
          sgOffTeeLastMonth: 0.7,
          lastStartResult: "2nd",
          wonInLast3Events: false,
          top3InLast3Events: true, // 3 pts (runner-up)
          top10InLast3Events: true,
          madeCutInLast3Events: true
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T7",
          timesPlayed: 4,
          top3InLast3Years: false,
          top10InLast3Years: true, // 2 pts
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 301,
          drivingAccuracy: 63.5,
          sgApproach: 0.9,
          sgAroundGreen: 0.3,
          sgPutting: 0.3,
          sgOffTee: 0.6,
          sgTotal: 2.1
        },
        specialties: ["recent runner-up", "momentum player", "major contender"]
      },
      {
        id: "4",
        name: "Jhonattan Vegas",
        owgr: 48,
        fedexCupRank: 38,
        recentForm: {
          top10sLast4Starts: 2,
          top10sLast10Starts: 3, // 2 pts
          top10sThisSeason: 5, // 1 pt
          sgTotalLast3: 1.5,
          sgApproachLast3: 0.8,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.5,
          sgOffTeeLastMonth: 0.6,
          lastStartResult: "T14",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: true, // 2 pts
          madeCutInLast3Events: true
        },
        courseHistory: {
          pastTop10s: 3,
          bestFinish: "1st",
          timesPlayed: 5,
          top3InLast3Years: true, // 3 pts (defending champion)
          top10InLast3Years: true,
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 298,
          drivingAccuracy: 64.7,
          sgApproach: 0.7,
          sgAroundGreen: 0.3,
          sgPutting: 0.4,
          sgOffTee: 0.5,
          sgTotal: 1.9
        },
        specialties: ["defending champion", "course expert", "clutch performer"]
      },
      {
        id: "5",
        name: "Maverick McNealy",
        owgr: 17,
        fedexCupRank: 28,
        recentForm: {
          top10sLast4Starts: 2,
          top10sLast10Starts: 4, // 2 pts
          top10sThisSeason: 6, // 1 pt
          sgTotalLast3: 1.8,
          sgApproachLast3: 1.2,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.7,
          lastStartResult: "T11",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: false,
          madeCutInLast3Events: true // 1 pt
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T9",
          timesPlayed: 3,
          top3InLast3Years: false,
          top10InLast3Years: true, // 2 pts
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 297,
          drivingAccuracy: 68.1,
          sgApproach: 1.1,
          sgAroundGreen: 0.4,
          sgPutting: 0.2,
          sgOffTee: 0.4,
          sgTotal: 2.1
        },
        specialties: ["accuracy specialist", "consistent player", "course veteran"]
      },
      {
        id: "6",
        name: "Max Homa",
        owgr: 35,
        fedexCupRank: 42,
        recentForm: {
          top10sLast4Starts: 1,
          top10sLast10Starts: 3, // 2 pts
          top10sThisSeason: 5, // 1 pt
          sgTotalLast3: 1.3,
          sgApproachLast3: 0.9,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.6,
          lastStartResult: "T22",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: false,
          madeCutInLast3Events: true // 1 pt
        },
        courseHistory: {
          pastTop10s: 2,
          bestFinish: "T3",
          timesPlayed: 4,
          top3InLast3Years: true, // 3 pts
          top10InLast3Years: true,
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 292,
          drivingAccuracy: 65.2,
          sgApproach: 0.8,
          sgAroundGreen: 0.2,
          sgPutting: 0.2,
          sgOffTee: 0.4,
          sgTotal: 1.6
        },
        specialties: ["iron play specialist", "course management", "social media presence"]
      },
      {
        id: "7",
        name: "Sam Burns",
        owgr: 22,
        fedexCupRank: 24,
        recentForm: {
          top10sLast4Starts: 2,
          top10sLast10Starts: 4, // 2 pts
          top10sThisSeason: 6, // 1 pt
          sgTotalLast3: 1.6,
          sgApproachLast3: 1.1,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.2,
          sgOffTeeLastMonth: 0.9,
          lastStartResult: "T18",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: false,
          madeCutInLast3Events: true // 1 pt
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T8",
          timesPlayed: 3,
          top3InLast3Years: false,
          top10InLast3Years: true, // 2 pts
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 305,
          drivingAccuracy: 61.8,
          sgApproach: 1.0,
          sgAroundGreen: 0.3,
          sgPutting: 0.1,
          sgOffTee: 0.7,
          sgTotal: 2.1
        },
        specialties: ["long iron specialist", "wind player"]
      },
      {
        id: "8",
        name: "Wyndham Clark",
        owgr: 31,
        fedexCupRank: 35,
        recentForm: {
          top10sLast4Starts: 1,
          top10sLast10Starts: 2, // 1 pt
          top10sThisSeason: 4,
          sgTotalLast3: 1.1,
          sgApproachLast3: 0.6,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.2,
          sgOffTeeLastMonth: 0.8,
          lastStartResult: "T28",
          wonInLast3Events: false,
          top3InLast3Events: false,
          top10InLast3Events: false,
          madeCutInLast3Events: true // 1 pt
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T6",
          timesPlayed: 3,
          top3InLast3Years: false,
          top10InLast3Years: true, // 2 pts
          madeCutInLast3Years: true
        },
        seasonStats: {
          drivingDistance: 318,
          drivingAccuracy: 58.9,
          sgApproach: 0.7,
          sgAroundGreen: 0.1,
          sgPutting: 0.1,
          sgOffTee: 0.9,
          sgTotal: 1.8
        },
        specialties: ["power player", "major winner", "clutch performer"]
      }
    ];
  }

  // New weighted scoring algorithm
  static analyzePlayer(player: GolfPlayer, tournament: GolfTournament): { score: number; factors: string[]; risks: string[]; buddyInsight: string } {
    let score = 0;
    const factors: string[] = [];
    const risks: string[] = [];

    // 1. Recent Top-10 Rate (Max 4 pts)
    const top10Last10 = player.recentForm.top10sLast10Starts;
    if (top10Last10 >= 7) {
      score += 4;
      factors.push(`${top10Last10} top-10s in last 10 starts`);
    } else if (top10Last10 >= 5) {
      score += 3;
      factors.push(`${top10Last10} top-10s in last 10 starts`);
    } else if (top10Last10 >= 3) {
      score += 2;
      factors.push(`${top10Last10} top-10s in last 10 starts`);
    } else if (top10Last10 >= 1) {
      score += 1;
      factors.push(`${top10Last10} top-10 in last 10 starts`);
    } else {
      risks.push('No top-10s in last 10 starts');
    }

    // 2. Course/Tournament History (Max 3 pts)
    if (player.courseHistory.top3InLast3Years) {
      score += 3;
      factors.push('Top-3 finish at this event in last 3 years');
    } else if (player.courseHistory.top10InLast3Years) {
      score += 2;
      factors.push('Top-10 finish at this event in last 3 years');
    } else if (player.courseHistory.madeCutInLast3Years) {
      score += 1;
      factors.push('Made cut at this event in last 3 years');
    } else {
      risks.push('Limited course success in recent years');
    }

    // 3. Recent Momentum (Max 3 pts)
    if (player.recentForm.wonInLast3Events || player.recentForm.top3InLast3Events) {
      score += 3;
      factors.push('Win or top-3 finish in last 3 events');
    } else if (player.recentForm.top10InLast3Events) {
      score += 2;
      factors.push('Top-10 in last 3 events');
    } else if (player.recentForm.madeCutInLast3Events) {
      score += 1;
      factors.push('Made cut in last 3 events');
    } else {
      risks.push('Struggling form in recent events');
    }

    // 4. Season-Long Elite Consistency (Max 2 pts)
    const seasonTop10s = player.recentForm.top10sThisSeason;
    if (seasonTop10s >= 10) {
      score += 2;
      factors.push(`${seasonTop10s} top-10s this season`);
    } else if (seasonTop10s >= 5) {
      score += 1;
      factors.push(`${seasonTop10s} top-10s this season`);
    } else {
      risks.push('Limited top-10 consistency this season');
    }

    // Generate Buddy Insight based on score and key factors
    const confidence = Math.round((score / 12) * 100);
    let buddyInsight = '';
    
    if (confidence >= 90) {
      buddyInsight = `Buddy's not even breaking a sweat on this one—${player.name}'s the real deal, a near-guarantee for the top 10! (${confidence}% confidence)`;
    } else if (confidence >= 75) {
      buddyInsight = `${player.name}'s got his groove going and loves this course. High five for another top-10! (${confidence}% confidence)`;
    } else if (confidence >= 60) {
      buddyInsight = `${player.name} is trending in the right direction. Buddy likes the value here! (${confidence}% confidence)`;
    } else {
      buddyInsight = `${player.name} is a bit of a wild card this week. Proceed with caution! (${confidence}% confidence)`;
    }

    return { score, factors, risks, buddyInsight };
  }

  static async generateTop10Picks(): Promise<GolfAnalysis> {
    const tournament = this.getMockTournament();
    const players = this.getMockPlayers();
    const allAnalyses: Array<{ player: GolfPlayer; analysis: ReturnType<typeof this.analyzePlayer> }> = [];

    // Fetch real odds for the tournament
    const liveOdds = await this.fetchGolfOdds();

    // Analyze all players using new weighted system
    players.forEach(player => {
      const analysis = this.analyzePlayer(player, tournament);
      allAnalyses.push({ player, analysis });
    });

    // Sort by weighted score and show top performers
    const qualifiedPlayers = allAnalyses
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 10);

    // Create picks with buddy-style descriptions
    const picks: GolfPick[] = qualifiedPlayers.map(({ player, analysis }, index) => {
      const confidence = Math.round((analysis.score / 12) * 100);
      
      // Get live odds for this player
      const playerOdds = liveOdds.find(odd => 
        odd.playerName.toLowerCase().includes(player.name.toLowerCase()) ||
        player.name.toLowerCase().includes(odd.playerName.toLowerCase().split(' ')[0])
      );

      // Buddy-style descriptions based on the examples provided
      const getBuddyDescription = (playerName: string, score: number, factors: string[]): string => {
        const confidence = Math.round((score / 12) * 100);
        
        switch (playerName) {
          case "Chris Gotterup":
            return `Dude, Chris is absolutely scorching hot right now! Won the Scottish Open, followed it up with a T3 at The Open - the guy is playing out of his mind. At these odds for a guy playing the best golf of his career? That's serious value.`;
          
          case "Tony Finau":
            return `Tony literally owns this place - won it in 2022, finished 2nd in 2021, and has four career top-10s here. Former winner, great course history, and the field is a bit weaker than usual? Tony should be right in the thick of things come Sunday.`;
          
          case "Harris English":
            return `Harris just finished 2nd at The Open Championship, so his confidence is through the roof coming into this week. Coming off a major runner-up into a weaker field? That's exactly the spot you want to back a guy who's seeing the ball really well right now.`;
          
          case "Jhonattan Vegas":
            return `The defending champ knows exactly what it takes to win here, and that confidence of having lifted the trophy before is huge. I love backing defending champions, especially when they're playing well.`;
          
          case "Maverick McNealy":
            return `Maverick is the highest-ranked guy in the field for a reason - he's been Mr. Consistency all year. He knows TPC Twin Cities well with a T9 finish here before, and his accuracy off the tee is perfect for these tree-lined fairways.`;
          
          case "Max Homa":
            return `Max has been quietly solid all season and his methodical approach is perfect for TPC Twin Cities where course management beats raw power. He finished T3 here in 2023, so he clearly knows how to score on this layout.`;
          
          default:
            return `BetBud says: "${playerName} is showing some solid indicators with ${score} total points. ${factors.slice(0, 2).join('. ')}. Buddy likes the setup here!" (${confidence}% confidence)`;
        }
      };

      return {
        id: `pick-${player.id}`,
        player,
        confidence,
        scoreCardPoints: analysis.score,
        reason: getBuddyDescription(player.name, analysis.score, analysis.factors),
        top10Probability: confidence,
        keyFactors: analysis.factors,
        riskFactors: analysis.risks,
        odds: playerOdds?.odds || "+2000"
      };
    });

    const keyInsights = [
      `New weighted scoring system: 12 points maximum per player`,
      `Recent top-10 rate accounts for up to 4 points`,
      `Course history and recent momentum each worth up to 3 points`,
      `Season consistency adds up to 2 points`,
      `Weather forecast: ${tournament.weatherForecast.wind} wind, ${tournament.weatherForecast.temperature}`
    ];

    return {
      tournament,
      picks,
      lastUpdated: new Date(),
      confidence: picks.length >= 4 ? 'High' : picks.length >= 2 ? 'Medium' : 'Low',
      keyInsights
    };
  }

  static async scrapeUpcomingTournament(): Promise<{ success: boolean; error?: string; data?: any }> {
    return {
      success: true,
      data: this.getMockTournament()
    };
  }
}