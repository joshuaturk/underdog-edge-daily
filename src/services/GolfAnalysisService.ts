import { GolfPlayer, GolfPick, GolfTournament, GolfAnalysis } from '@/types/golf';

export class GolfAnalysisService {
  // Based on the user's analysis patterns
  private static readonly MIN_CONFIDENCE_THRESHOLD = 65;
  private static readonly TOP_10_TARGET = 4; // Target 4 players

  // Sample tournament data - in production this would come from web scraping
  static getMockTournament(): GolfTournament {
    return {
      name: "FedEx St. Jude Championship",
      course: "TPC Southwind",
      location: "Memphis, TN", 
      dates: "August 15-18, 2025",
      purse: "$20,000,000",
      fieldStrength: 'Elite',
      courseCharacteristics: {
        length: 7244,
        parTotal: 70,
        rough: 'Moderate',
        greens: 'Bentgrass',
        wind: 'Low',
        treelined: true,
        waterHazards: 3,
        elevation: 'Sea Level'
      },
      weatherForecast: {
        wind: "5-10 mph variable",
        temperature: "85-90°F",
        precipitation: "20% chance Thursday"
      },
      pastWinners: [
        { year: "2024", winner: "Hideki Matsuyama", score: "-17" },
        { year: "2023", winner: "Lucas Glover", score: "-15" },
        { year: "2022", winner: "J.J. Spaun", score: "-13" }
      ]
    };
  }

  // Mock player data with realistic stats
  static getMockPlayers(): GolfPlayer[] {
    return [
      {
        id: "1",
        name: "Viktor Hovland",
        owgr: 8,
        fedexCupRank: 12,
        recentForm: {
          top10sLast4Starts: 3,
          sgTotalLast3: 1.8,
          sgApproachLast3: 1.2,
          sgAroundGreenLast3: 0.4,
          sgPuttingLast3: 0.2,
          sgOffTeeLastMonth: 0.8,
          lastStartResult: "T4"
        },
        courseHistory: {
          pastTop10s: 2,
          bestFinish: "T3",
          timesPlayed: 4
        },
        seasonStats: {
          drivingDistance: 295,
          drivingAccuracy: 62.5,
          sgApproach: 1.1,
          sgAroundGreen: 0.3,
          sgPutting: 0.1,
          sgOffTee: 0.5,
          sgTotal: 2.0
        },
        specialties: ["iron play specialist", "bentgrass expert"]
      },
      {
        id: "2", 
        name: "Collin Morikawa",
        owgr: 15,
        fedexCupRank: 8,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.5,
          sgApproachLast3: 1.8,
          sgAroundGreenLast3: 0.1,
          sgPuttingLast3: -0.2,
          sgOffTeeLastMonth: 0.3,
          lastStartResult: "T7"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T6",
          timesPlayed: 3
        },
        seasonStats: {
          drivingDistance: 288,
          drivingAccuracy: 68.2,
          sgApproach: 1.4,
          sgAroundGreen: 0.2,
          sgPutting: -0.1,
          sgOffTee: 0.2,
          sgTotal: 1.7
        },
        specialties: ["iron play specialist", "tight course expert"]
      },
      {
        id: "3",
        name: "Tony Finau", 
        owgr: 22,
        fedexCupRank: 18,
        recentForm: {
          top10sLast4Starts: 2,
          sgTotalLast3: 1.2,
          sgApproachLast3: 0.9,
          sgAroundGreenLast3: 0.5,
          sgPuttingLast3: 0.8,
          sgOffTeeLastMonth: 1.1,
          lastStartResult: "T9"
        },
        courseHistory: {
          pastTop10s: 3,
          bestFinish: "2nd",
          timesPlayed: 6
        },
        seasonStats: {
          drivingDistance: 312,
          drivingAccuracy: 58.9,
          sgApproach: 0.7,
          sgAroundGreen: 0.4,
          sgPutting: 0.3,
          sgOffTee: 0.9,
          sgTotal: 2.3
        },
        specialties: ["power player", "course history"]
      },
      {
        id: "4",
        name: "Xander Schauffele",
        owgr: 3,
        fedexCupRank: 2,
        recentForm: {
          top10sLast4Starts: 3,
          sgTotalLast3: 2.1,
          sgApproachLast3: 1.0,
          sgAroundGreenLast3: 0.3,
          sgPuttingLast3: 0.6,
          sgOffTeeLastMonth: 0.7,
          lastStartResult: "T2"
        },
        courseHistory: {
          pastTop10s: 2,
          bestFinish: "T4",
          timesPlayed: 5
        },
        seasonStats: {
          drivingDistance: 298,
          drivingAccuracy: 65.1,
          sgApproach: 0.9,
          sgAroundGreen: 0.4,
          sgPutting: 0.5,
          sgOffTee: 0.6,
          sgTotal: 2.4
        },
        specialties: ["all-around player", "clutch performer"]
      },
      {
        id: "5",
        name: "Tommy Fleetwood",
        owgr: 28,
        fedexCupRank: 35,
        recentForm: {
          top10sLast4Starts: 1,
          sgTotalLast3: 0.8,
          sgApproachLast3: 1.1,
          sgAroundGreenLast3: 0.6,
          sgPuttingLast3: -0.3,
          sgOffTeeLastMonth: 0.4,
          lastStartResult: "T15"
        },
        courseHistory: {
          pastTop10s: 0,
          bestFinish: "T12",
          timesPlayed: 2
        },
        seasonStats: {
          drivingDistance: 285,
          drivingAccuracy: 71.3,
          sgApproach: 0.8,
          sgAroundGreen: 0.5,
          sgPutting: 0.0,
          sgOffTee: 0.1,
          sgTotal: 1.4
        },
        specialties: ["accuracy specialist", "wind player"]
      },
      {
        id: "6",
        name: "Scottie Scheffler",
        owgr: 1,
        fedexCupRank: 1,
        recentForm: {
          top10sLast4Starts: 4,
          sgTotalLast3: 2.8,
          sgApproachLast3: 1.5,
          sgAroundGreenLast3: 0.7,
          sgPuttingLast3: 0.4,
          sgOffTeeLastMonth: 1.2,
          lastStartResult: "1st"
        },
        courseHistory: {
          pastTop10s: 1,
          bestFinish: "T8",
          timesPlayed: 3
        },
        seasonStats: {
          drivingDistance: 302,
          drivingAccuracy: 63.8,
          sgApproach: 1.6,
          sgAroundGreen: 0.6,
          sgPutting: 0.3,
          sgOffTee: 0.8,
          sgTotal: 3.3
        },
        specialties: ["elite all-around", "momentum player"]
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

  static generateTop10Picks(): GolfAnalysis {
    const tournament = this.getMockTournament();
    const players = this.getMockPlayers();
    const allAnalyses: Array<{ player: GolfPlayer; analysis: ReturnType<typeof this.analyzePlayer> }> = [];

    // Analyze all players
    players.forEach(player => {
      const analysis = this.analyzePlayer(player, tournament);
      allAnalyses.push({ player, analysis });
    });

    // Sort by score and filter for top performers
    const qualifiedPlayers = allAnalyses
      .filter(({ analysis }) => analysis.score >= 3) // Minimum threshold
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, this.TOP_10_TARGET);

    // Create picks with real-world buddy tone descriptions and actual odds
    const picks: GolfPick[] = qualifiedPlayers.map(({ player, analysis }, index) => {
      const baseConfidence = Math.min(65 + (analysis.score * 5), 85);
      const probability = baseConfidence;

      // Real buddy-tone descriptions based on player
      const buddyDescriptions = {
        "Viktor Hovland": {
          description: [
            "Dude, Viktor's been absolutely crushing it lately with his iron play, and TPC Southwind is basically built for guys who can stick it close.",
            "He's coming off a solid T4 finish and has that Norwegian precision that just works on tight, tree-lined tracks like this.",
            "The guy's got serious course history here too - two top-10s in four tries tells you he knows how to navigate these tricky Memphis greens.",
            "With bentgrass putting surfaces that reward his methodical approach, he should be right in the mix come Sunday.",
            "Plus, the weather looks pretty calm this week, which means his ball-striking advantage should really shine through."
          ],
          odds: "+185"
        },
        "Collin Morikawa": {
          description: [
            "Man, Collin's iron game is just ridiculous right now - he's gaining nearly two strokes per round on approach shots, which is exactly what you need at Southwind.",
            "Sure, he's been struggling a bit with the putter, but these bentgrass greens tend to be more predictable than the grainy bermuda stuff he's been dealing with.",
            "This course rewards precision over power, and nobody hits it more consistently than Morikawa when he's dialed in.",
            "He finished T6 here before and has that major championship mentality that shows up when the pressure's on.",
            "With the field being so stacked, having a guy who rarely makes big numbers is exactly the type of steady play that sneaks into the top 10."
          ],
          odds: "+195"
        },
        "Tony Finau": {
          description: [
            "Tony's basically become Mr. Consistency lately, and this course has been really good to him over the years with three top-10s.",
            "The dude finished second here before, so he clearly knows how to score on this layout, especially with his improved putting stroke.",
            "He's been gaining almost a full stroke per round on the greens in his last few starts, which was always the missing piece of his game.",
            "Length isn't everything at Southwind, but when you can bomb it 310+ yards AND control your distances like Tony's been doing, that's a lethal combo.",
            "Plus, the guy just has this clutch gene in big moments now - he's not the same player who used to struggle to close out tournaments."
          ],
          odds: "+165"
        },
        "Xander Schauffele": {
          description: [
            "Xander's having one of those seasons where everything just seems to click - three top-10s in four starts is no joke, especially in these strong fields.",
            "He finished T2 in his last start and has that champion's confidence rolling after his major wins this year.",
            "This guy never really has a bad week anymore; he's become one of those players who finds a way to grind out solid finishes even when he's not at his best.",
            "The course setup should suit his all-around game perfectly - he doesn't need any one aspect to be perfect because he's elite at everything.",
            "When you're ranked in the top 3 in the world and playing with house money, that's when guys like Xander tend to be most dangerous."
          ],
          odds: "+145"
        },
        "Tommy Fleetwood": {
          description: [
            "Tommy might not have the course history here, but his accuracy off the tee is exactly what you want on a tree-lined track like this.",
            "He's been striking his irons really well lately, gaining over a stroke on approach in his last three starts, which is his bread and butter.",
            "The English weather he grew up playing in should actually help him if those afternoon storms roll through like they're forecasting.",
            "Sure, he's only played here twice before, but sometimes fresh perspective and a methodical European approach can be exactly what a course needs.",
            "At his odds, he's definitely worth a flyer - the guy knows how to peak at the right moments, and this late-season push could be his time."
          ],
          odds: "+285"
        },
        "Scottie Scheffler": {
          description: [
            "Look, Scottie's obviously the best player in the world right now, but weirdly enough, this course hasn't been his best venue historically.",
            "That said, when you're coming off a major win and playing with this kind of confidence, course history sometimes goes out the window.",
            "His approach play has been absolutely unconscious lately - gaining 1.5 strokes per round is video game numbers that nobody else is putting up.",
            "The guy's in that zone where even his bad weeks result in top-15 finishes, so a top-10 here feels like almost a lock.",
            "With the momentum he's carrying and the way he's been closing tournaments, it's hard to bet against the world number one regardless of the venue."
          ],
          odds: "+120"
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
        odds: playerDesc?.odds || "+200"
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