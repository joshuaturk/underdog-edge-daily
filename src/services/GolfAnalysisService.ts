import { GolfPlayer, GolfPick, GolfTournament, GolfAnalysis } from '@/types/golf';

export class GolfAnalysisService {
  // Based on the user's analysis patterns
  private static readonly MIN_CONFIDENCE_THRESHOLD = 65;
  private static readonly TOP_10_TARGET = 10; // Show top 10 players
  private static readonly ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';
  private static readonly DEFAULT_API_KEY = '1fea8e349f56d166ae430f8946fbea6e';

  private static getApiKey(): string {
    // Use same API key as SportsAPIService
    const stored = localStorage.getItem('odds_api_key');
    return stored || this.DEFAULT_API_KEY;
  }

  private static async fetchGolfOdds(): Promise<Array<{ playerName: string; odds: string; bookmaker: string; market: string }>> {
    const apiKey = this.getApiKey();
    
    try {
      console.log('Fetching golf odds from The Odds API...');
      
      // First, let's check what sports are available
      const sportsResponse = await fetch(`${this.ODDS_API_BASE_URL}/sports/?apiKey=${apiKey}`);
      if (sportsResponse.ok) {
        const sports = await sportsResponse.json();
        const golfSports = sports.filter((sport: any) => sport.key.includes('golf'));
        console.log('Available golf sports:', golfSports);
      }
      
      // Try to fetch current golf tournament odds with Top 10 markets
      const golfEndpoints = [
        'golf_pga_championship',
        'golf_masters_tournament', 
        'golf_us_open',
        'golf_the_open_championship',
        'golf_pga_tour'
      ];
      
      for (const endpoint of golfEndpoints) {
        try {
          // Try multiple market types including Top 10
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
          // Prefer DraftKings, FanDuel, Bet365, or other major books
          if (['draftkings', 'fanduel', 'bet365', 'unibet', 'williamhill'].includes(bookmaker.key)) {
            bookmaker.markets?.forEach((market: any) => {
              // Prioritize Top 10 markets over outright winner
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

    // Sort by market priority (Top 10 first) and remove duplicates
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
    // Mock Top 10 finish odds from major sportsbooks for actual 3M Open 2025 field
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

  // Sample tournament data - in production this would come from web scraping
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

  // Mock player data with realistic stats for actual 3M Open 2025 field participants
  static getMockPlayers(): GolfPlayer[] {
    return [
      {
        id: "1",
        name: "Chris Gotterup",
        owgr: 25,
        fedexCupRank: 18,
        recentForm: {
          top10sLast4Starts: 3,
          sgTotalLast3: 2.4,
          sgApproachLast3: 1.6,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.6,
          sgOffTeeLastMonth: 1.1,
          lastStartResult: "T3"
        },
        courseHistory: {
          pastTop10s: 0,
          bestFinish: "T35",
          timesPlayed: 1
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
        name: "Maverick McNealy",
        owgr: 17,
        fedexCupRank: 28,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.8,
          sgApproachLast3: 1.2,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.7,
          lastStartResult: "T11"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T9",
          timesPlayed: 3
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
        id: "3",
        name: "Sam Burns",
        owgr: 22,
        fedexCupRank: 24,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.6,
          sgApproachLast3: 1.1,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.2,
          sgOffTeeLastMonth: 0.9,
          lastStartResult: "T18"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T8",
          timesPlayed: 3
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
        id: "4", 
        name: "Tony Finau",
        owgr: 28,
        fedexCupRank: 31,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 1.2,
          sgApproachLast3: 0.7,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.1,
          sgOffTeeLastMonth: 1.0,
          lastStartResult: "T25"
        },
        courseHistory: {
          pastTop10s: 4,
          bestFinish: "1st",
          timesPlayed: 6
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
        id: "5",
        name: "Max Homa", 
        owgr: 35,
        fedexCupRank: 42,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 1.3,
          sgApproachLast3: 0.9,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.6,
          lastStartResult: "T22"
        },
        courseHistory: {
          pastTop10s: 2,
          bestFinish: "T3",
          timesPlayed: 4
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
        id: "6",
        name: "Wyndham Clark",
        owgr: 31,
        fedexCupRank: 35,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 1.1,
          sgApproachLast3: 0.6,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.2,
          sgOffTeeLastMonth: 0.8,
          lastStartResult: "T28"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T6",
          timesPlayed: 3
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
      },
      {
        id: "7",
        name: "Jhonattan Vegas",
        owgr: 48,
        fedexCupRank: 38,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.5,
          sgApproachLast3: 0.8,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.5,
          sgOffTeeLastMonth: 0.6,
          lastStartResult: "T14"
        },
        courseHistory: {
          pastTop10s: 3,
          bestFinish: "1st",
          timesPlayed: 5
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
        id: "8",
        name: "Rickie Fowler",
        owgr: 42,
        fedexCupRank: 55,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 0.9,
          sgApproachLast3: 0.5,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.4,
          lastStartResult: "T31"
        },
        courseHistory: {
          pastTop10s: 2,
          bestFinish: "T4",
          timesPlayed: 5
        },
        seasonStats: {
          drivingDistance: 296,
          drivingAccuracy: 62.1,
          sgApproach: 0.4,
          sgAroundGreen: 0.2,
          sgPutting: 0.2,
          sgOffTee: 0.3,
          sgTotal: 1.1
        },
        specialties: ["fan favorite", "experience factor", "course history"]
      },
      {
        id: "9",
        name: "Harris English",
        owgr: 29,
        fedexCupRank: 22,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.7,
          sgApproachLast3: 1.0,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.4,
          sgOffTeeLastMonth: 0.7,
          lastStartResult: "2nd"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T7",
          timesPlayed: 4
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
        id: "10",
        name: "Keegan Bradley",
        owgr: 39,
        fedexCupRank: 47,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 1.0,
          sgApproachLast3: 0.6,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.3,
          sgOffTeeLastMonth: 0.5,
          lastStartResult: "T19"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T8",
          timesPlayed: 3
        },
        seasonStats: {
          drivingDistance: 303,
          drivingAccuracy: 61.9,
          sgApproach: 0.5,
          sgAroundGreen: 0.2,
          sgPutting: 0.2,
          sgOffTee: 0.4,
          sgTotal: 1.3
        },
        specialties: ["ryder cup captain", "major winner", "veteran presence"]
      },
      {
        id: "11",
        name: "Taylor Pendrith",
        owgr: 44,
        fedexCupRank: 51,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.4,
          sgApproachLast3: 0.8,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.4,
          sgOffTeeLastMonth: 0.8,
          lastStartResult: "T12"
        },
        courseHistory: {
          pastTop10s: 0,
          bestFinish: "T23",
          timesPlayed: 2
        },
        seasonStats: {
          drivingDistance: 314,
          drivingAccuracy: 59.8,
          sgApproach: 0.7,
          sgAroundGreen: 0.3,
          sgPutting: 0.3,
          sgOffTee: 0.7,
          sgTotal: 2.0
        },
        specialties: ["power player", "canadian standout", "trending upward"]
      },
      {
        id: "12",
        name: "Akshay Bhatia",
        owgr: 33,
        fedexCupRank: 29,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 1.2,
          sgApproachLast3: 0.7,
          sgAroundGreenLast3: 0.2,
          sgPuttingLast3: 0.4,
          sgOffTeeLastMonth: 0.6,
          lastStartResult: "T17"
        },
        courseHistory: {
          pastTop10s: 0,
          bestFinish: "T27",
          timesPlayed: 2
        },
        seasonStats: {
          drivingDistance: 306,
          drivingAccuracy: 60.4,
          sgApproach: 0.6,
          sgAroundGreen: 0.2,
          sgPutting: 0.3,
          sgOffTee: 0.5,
          sgTotal: 1.6
        },
        specialties: ["young talent", "rising star", "aggressive style"]
      }
    ];
  }

  static analyzePlayer(player: GolfPlayer, tournament: GolfTournament): { score: number; factors: string[]; risks: string[] } {
    let score = 0;
    const factors: string[] = [];
    const risks: string[] = [];

    // 1. Recent Form & Momentum
    if (player.recentForm.top10sLast4Starts >= 2) {
      score += 2;
      factors.push(`${player.recentForm.top10sLast4Starts} Top 10s in last 4 starts`);
    }

    if (player.recentForm.sgTotalLast3 > 1.0 && player.recentForm.sgApproachLast3 > 0.8) {
      score += 2;
      factors.push(`Strong ball striking: SG Total ${player.recentForm.sgTotalLast3.toFixed(1)}, SG Approach ${player.recentForm.sgApproachLast3.toFixed(1)}`);
    }

    // 2. Strokes Gained Breakdown
    if (player.recentForm.sgApproachLast3 > 0.8) {
      factors.push(`Elite iron play: SG Approach ${player.recentForm.sgApproachLast3.toFixed(1)}`);
    }

    if (player.recentForm.sgAroundGreenLast3 < 0.0) {
      score -= 1;
      risks.push(`Poor scrambling: SG Around Green ${player.recentForm.sgAroundGreenLast3.toFixed(1)}`);
    }

    if (player.recentForm.sgPuttingLast3 > 0.5) {
      factors.push(`Hot putter: SG Putting ${player.recentForm.sgPuttingLast3.toFixed(1)}`);
    }

    // 3. Course Fit & History
    if (player.courseHistory.pastTop10s >= 2) {
      score += 1;
      factors.push(`${player.courseHistory.pastTop10s} career Top 10s at this venue`);
    }

    // Driving requirements based on course
    if (tournament.courseCharacteristics.treelined && player.seasonStats.drivingAccuracy > 60) {
      factors.push(`Accurate driver (${player.seasonStats.drivingAccuracy.toFixed(1)}%) suits tree-lined course`);
    } else if (!tournament.courseCharacteristics.treelined && player.seasonStats.drivingDistance > 300) {
      factors.push(`Power advantage (${player.seasonStats.drivingDistance} yards) on open course`);
    }

    // 4. World Ranking & Competitive Depth
    if (player.owgr <= 50 || player.fedexCupRank <= 25) {
      score += 1;
      factors.push(`Elite ranking: OWGR ${player.owgr}, FedEx Cup ${player.fedexCupRank}`);
    }

    // 5. Field Strength & Tournament Context
    if (tournament.fieldStrength === 'Elite' && player.owgr > 50) {
      risks.push('Strong field may favor elite players');
    }

    // Weather adjustments
    if (tournament.weatherForecast.wind.includes('15') && player.specialties.includes('wind player')) {
      factors.push('Wind specialist advantage in forecast conditions');
    }

    // Penalty for missed cuts
    if (player.recentForm.lastStartResult === 'MC') {
      score -= 1;
      risks.push('Missed cut last start');
    }

    return { score, factors, risks };
  }

  static async generateTop10Picks(): Promise<GolfAnalysis> {
    const tournament = this.getMockTournament();
    const players = this.getMockPlayers();
    const allAnalyses: Array<{ player: GolfPlayer; analysis: ReturnType<typeof this.analyzePlayer> }> = [];

    // Fetch real odds for the tournament
    const liveOdds = await this.fetchGolfOdds();

    // Analyze all players
    players.forEach(player => {
      const analysis = this.analyzePlayer(player, tournament);
      allAnalyses.push({ player, analysis });
    });

    // Sort by score and show top 10 performers
    const qualifiedPlayers = allAnalyses
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 10); // Show top 10 players

    // Create picks with real-world buddy tone descriptions and live odds
    const picks: GolfPick[] = qualifiedPlayers.map(({ player, analysis }, index) => {
      const baseConfidence = Math.min(65 + (analysis.score * 5), 85);
      const probability = baseConfidence;

      // Get live odds for this player or use fallback
      const playerOdds = liveOdds.find(odd => 
        odd.playerName.toLowerCase().includes(player.name.toLowerCase()) ||
        player.name.toLowerCase().includes(odd.playerName.toLowerCase().split(' ')[0]) ||
        player.name.toLowerCase().includes(odd.playerName.toLowerCase().split(' ')[1])
      );

      // Real buddy-tone descriptions for actual 3M Open 2025 field
      const buddyDescriptions = {
        "Chris Gotterup": {
          description: [
            "Dude, Chris is absolutely scorching hot right now! Won the Scottish Open, followed it up with a T3 at The Open - the guy is playing out of his mind.",
            "I know he doesn't have much history at TPC Twin Cities, but when someone's ball-striking is this dialed in, course knowledge becomes secondary real quick.",
            "He's gaining over 2 strokes per round lately, which is just insane stuff. Plus he's only 26 and fearless - exactly the type who can catch lightning in a bottle.",
            "The confidence from that Scottish Open win is going to carry him here. When you're seeing the ball like he is right now, you attack every pin.",
            "At these odds for a guy playing the best golf of his career? That's serious value for someone who could easily run away with this thing."
          ],
          odds: "+140"
        },
        "Maverick McNealy": {
          description: [
            "Maverick is the highest-ranked guy in the field for a reason - he's been Mr. Consistency all year and never really has those blow-up rounds.",
            "He knows TPC Twin Cities well with a T9 finish here before, and his accuracy off the tee is perfect for these tree-lined fairways.",
            "The guy hits like 68% of his fairways, which means he's attacking pins all day while others are scrambling from the rough.",
            "He's made 11 straight cuts and just has that steady, methodical game that grinds out top-10s even when he's not at his absolute best.",
            "I love him this week because he's not going to beat himself, and on a course with this much water, that's half the battle right there."
          ],
          odds: "+180"
        },
        "Harris English": {
          description: [
            "Harris just finished 2nd at The Open Championship, so his confidence is through the roof coming into this week.",
            "That runner-up finish shows he can handle the pressure when it matters, and this field isn't nearly as deep as what he just faced.",
            "His iron play has been money lately - gaining over a stroke on approach - and these tight pin positions are going to reward that precision.",
            "He's got that calm, collected demeanor that works perfectly at TPC Twin Cities where patience and smart course management win out.",
            "Coming off a major runner-up into a weaker field? That's exactly the spot you want to back a guy who's seeing the ball really well right now."
          ],
          odds: "+200"
        },
        "Sam Burns": {
          description: [
            "Sam's been knocking on the door all season with super consistent play, and TPC Twin Cities has always been good to him.",
            "He finished T8 here a couple years back and just understands how to navigate these water hazards without taking unnecessary risks.",
            "His iron play has been exceptional lately - gaining over a stroke on approach - which is exactly what you need on these tight, protected greens.",
            "The guy's made 11 straight cuts and has that veteran presence now where he knows how to grind out scores even when things aren't perfect.",
            "I like him because he's not going to do anything crazy, and sometimes that steady approach is exactly what gets you into the top 10."
          ],
          odds: "+220"
        },
        "Tony Finau": {
          description: [
            "Tony literally owns this place - won it in 2022, finished 2nd in 2021, and has four career top-10s here. The course just fits his eye perfectly.",
            "He's never missed a cut at TPC Twin Cities in six tries, which tells you everything about his comfort level and course knowledge.",
            "The length advantage he has here is massive. While guys are hitting 6-irons into greens, he's got 9-iron in his hands with better angles.",
            "His putting has actually improved this year, which was always the missing piece for him at venues like this with tricky greens.",
            "Former winner, great course history, and the field is a bit weaker than usual? Tony should be right in the thick of things come Sunday."
          ],
          odds: "+260"
        },
        "Jhonattan Vegas": {
          description: [
            "The defending champ knows exactly what it takes to win here, and that confidence of having lifted the trophy before is huge.",
            "He's got three career top-10s at TPC Twin Cities and just seems to understand how to play these conditions better than most.",
            "His recent form has been solid with a couple top-10s lately, and defending champions always have that extra motivation to repeat.",
            "The guy's short game is really sharp, which is crucial for scrambling around all the water hazards when your approach shots are slightly off.",
            "I love backing defending champions, especially when they're playing well. He knows every break on these greens and where all the trouble spots are."
          ],
          odds: "+320"
        },
        "Max Homa": {
          description: [
            "Max has been quietly solid all season and his methodical approach is perfect for TPC Twin Cities where course management beats raw power.",
            "He finished T3 here in 2023, so he clearly knows how to score on this layout when his game is dialed in.",
            "His iron play has been exceptional lately, and these bentgrass greens should reward his precise putting stroke perfectly.",
            "The guy's one of the smartest players on tour and rarely makes the big mistakes that can derail a round at a water-heavy course like this.",
            "Plus his Twitter game keeps him loose and relaxed. When Max is having fun out there, he usually plays his best golf."
          ],
          odds: "+350"
        },
        "Wyndham Clark": {
          description: [
            "Wyndham's power game should be a huge advantage here, especially with the forecast calling for calm wind conditions this week.",
            "He finished T6 here in 2023 and as a major winner, he's got that championship experience when the pressure mounts on Sunday.",
            "His driving distance gives him shorter clubs into these protected greens, and he's been way more accurate off the tee this season.",
            "The guy's been gaining strokes on approach lately and has that clutch putting stroke that shows up when he needs to make birdies.",
            "Major winners in weaker fields is always a great betting angle. He's just got that extra gear when things get tight."
          ],
          odds: "+380"
        },
        "Keegan Bradley": {
          description: [
            "The future Ryder Cup captain has been playing with extra motivation this year, and his experience at big moments is invaluable.",
            "He's got a T8 finish here before and understands how to play these tree-lined fairways without getting too aggressive.",
            "His putting has actually been really solid lately, and these bentgrass greens should suit his stroke perfectly.",
            "As a major winner, he's got that championship DNA that helps when you need to close out rounds in tough conditions.",
            "I like backing guys with something extra to prove, and being the Ryder Cup captain definitely gives him that extra edge this season."
          ],
          odds: "+450"
        },
        "Taylor Pendrith": {
          description: [
            "Taylor's been trending upward all season with some really solid ball-striking numbers, and his power game fits TPC Twin Cities well.",
            "He's got that fearless Canadian mentality where he's not afraid to attack pins, which can pay off big on courses like this.",
            "His iron play has improved significantly this year, gaining nearly a stroke on approach, which is huge for scoring at this venue.",
            "The guy's got two top-10s lately and seems to be peaking at the right time heading into this crucial stretch of the season.",
            "At these odds, you're getting a player who's capable of going really low when everything clicks, and his ceiling is pretty high."
          ],
          odds: "+400"
        },
        "Akshay Bhatia": {
          description: [
            "Akshay's got that young, aggressive style that can either pay off big or blow up, but I like his upside this week.",
            "His ball-striking has been solid lately and he's got the kind of fearless mentality that works well in smaller fields like this.",
            "The guy's been working on his course management and seems to be maturing as a player, making fewer costly mistakes.",
            "His short game is really sharp, which is key for scrambling around these water hazards when approach shots drift slightly off target.",
            "Young talent in a weaker field is always intriguing. If he can avoid the big numbers, his scoring ability could get him into contention."
          ],
          odds: "+420"
        },
        "Rickie Fowler": {
          description: [
            "Rickie's got a T4 finish here before and just seems to love playing TPC Twin Cities - the course setup suits his eye really well.",
            "The guy's a fan favorite for a reason, and he always seems to play better when the crowds are into it and the atmosphere is fun.",
            "His experience factor is huge in fields like this where course management and avoiding big mistakes matter more than raw power.",
            "He's been working hard on his putting stroke and showed some improvement lately, which could be the missing piece he needs.",
            "While he might not have the highest ceiling anymore, his floor is solid and he knows how to grind out top-10 finishes when needed."
          ],
          odds: "+480"
        }
      };

      const playerDesc = buddyDescriptions[player.name as keyof typeof buddyDescriptions];
      
      return {
        id: `pick-${player.id}`,
        player,
        confidence: baseConfidence,
        scoreCardPoints: analysis.score,
        reason: playerDesc?.description?.join(' ') || `Strong scorecard with ${analysis.score} points. ${analysis.factors.slice(0, 2).join('. ')}.`,
        top10Probability: probability,
        keyFactors: analysis.factors,
        riskFactors: analysis.risks,
        odds: playerOdds?.odds || playerDesc?.odds || "+2000"
      };
    });

    const keyInsights = [
      `Course favors ${tournament.courseCharacteristics.treelined ? 'accuracy' : 'distance'} off the tee`,
      `${tournament.courseCharacteristics.greens} greens reward ${tournament.courseCharacteristics.greens === 'Bentgrass' ? 'precise' : 'aggressive'} putting`,
      `Field strength is ${tournament.fieldStrength.toLowerCase()}, favoring ${tournament.fieldStrength === 'Elite' ? 'top-ranked' : 'value'} players`,
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
    // In production, this would scrape PGA Tour schedule, course info, and player stats
    // For now, return mock data
    return {
      success: true,
      data: this.getMockTournament()
    };
  }
}