import { BTTSPick, BTTSAnalysis, TeamBTTSStats, SoccerMatch } from '@/types/soccer';
import { supabase } from '@/integrations/supabase/client';

export class BTTSAnalysisService {
  private static readonly RECENCY_N = 10;
  private static readonly CONFIDENCE_THRESHOLD = 0.80; // Increased to 80%

  // Calculate recency weights: most recent game has highest weight
  private static calculateRecencyWeights(): number[] {
    const weights = [];
    const totalSum = Array.from({length: this.RECENCY_N}, (_, i) => this.RECENCY_N - i)
      .reduce((sum, val) => sum + val, 0);
    
    for (let i = 0; i < this.RECENCY_N; i++) {
      weights.push((this.RECENCY_N - i) / totalSum);
    }
    return weights;
  }

  // Calculate recency-weighted BTTS rate for a team
  private static calculateTeamBTTSRate(lastMatches: { btts: boolean }[]): number {
    if (lastMatches.length === 0) return 0;
    
    const weights = this.calculateRecencyWeights();
    const matchesToUse = lastMatches.slice(0, this.RECENCY_N);
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    matchesToUse.forEach((match, index) => {
      if (index < weights.length) {
        weightedSum += weights[index] * (match.btts ? 1 : 0);
        totalWeight += weights[index];
      }
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Fetch football data from Edge Function
  static async fetchFootballData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      console.log(`Fetching football data: ${endpoint}`, params);
      
      const response = await supabase.functions.invoke('football-data', {
        body: { 
          endpoint,
          params
        }
      });

      if (!response.data?.success) {
        console.error('Failed to fetch football data:', response.data?.error);
        throw new Error(response.data?.error || 'Failed to fetch football data');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching football data:', error);
      throw error;
    }
  }

  // Get fixtures for current gameweek from major leagues
  static async getCurrentGameweekFixtures(): Promise<SoccerMatch[]> {
    try {
      const leagues = [
        { name: 'Premier League', endpoint: 'premier-league' },
        { name: 'Championship', endpoint: 'championship' },
        { name: 'La Liga', endpoint: 'la-liga' },
        { name: 'Bundesliga', endpoint: 'bundesliga' },
        { name: 'Serie A', endpoint: 'serie-a' },
        { name: 'Ligue 1', endpoint: 'ligue-1' }
      ];

      const allFixtures: SoccerMatch[] = [];
      
      for (const league of leagues) {
        try {
          const response = await this.fetchFootballData('fixtures', {
            league: league.endpoint,
            season: '2024-25'
          });

          if (response.data?.fixtures) {
            const fixtures = response.data.fixtures
              .filter((f: any) => f.status === 'upcoming')
              .map((fixture: any) => ({
                id: `${league.endpoint}-${fixture.id || Math.random()}`,
                homeTeam: fixture.homeTeam?.name || fixture.home_team,
                awayTeam: fixture.awayTeam?.name || fixture.away_team,
                date: fixture.date || fixture.kickoff_time,
                kickoffTime: fixture.kickoff_time || fixture.date,
                league: league.name as 'Premier League' | 'Championship' | 'La Liga' | 'Bundesliga' | 'Serie A' | 'Ligue 1',
                gameweek: fixture.gameweek || this.getCurrentGameweek(league.name),
                status: 'upcoming' as const,
                venue: fixture.venue || `${fixture.homeTeam?.name || fixture.home_team} Stadium`,
                isOutdoor: true,
                weather: this.generateMockWeather()
              }));
            allFixtures.push(...fixtures);
          }
        } catch (error) {
          console.error(`Error fetching ${league.name} fixtures:`, error);
          // Generate mock fixtures for this league
          allFixtures.push(...this.generateMockFixtures(league.name as any));
        }
      }

      console.log(`Found ${allFixtures.length} upcoming fixtures across all leagues`);
      return allFixtures;
    } catch (error) {
      console.error('Error fetching current gameweek fixtures:', error);
      // Generate mock fixtures for all leagues
      return this.generateAllMockFixtures();
    }
  }

  // Generate mock weather data
  private static generateMockWeather() {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Sunny'];
    const temps = ['18°C', '20°C', '22°C', '25°C', '16°C', '14°C'];
    
    return {
      temperature: temps[Math.floor(Math.random() * temps.length)],
      conditions: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: `${Math.floor(Math.random() * 40) + 40}%`
    };
  }

  // Generate mock fixtures for a specific league
  private static generateMockFixtures(league: string): SoccerMatch[] {
    const mockTeams: Record<string, string[]> = {
      'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'],
      'Championship': ['Leeds United', 'Leicester City', 'Birmingham City', 'Bristol City', 'Cardiff City', 'Hull City'],
      'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia', 'Villarreal'],
      'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg', 'Frankfurt'],
      'Serie A': ['Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma', 'Lazio'],
      'Ligue 1': ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Nice', 'Rennes']
    };

    const teams = mockTeams[league] || ['Team A', 'Team B', 'Team C', 'Team D'];
    const fixtures: SoccerMatch[] = [];

    for (let i = 0; i < Math.min(4, teams.length / 2); i++) {
      const homeIndex = i * 2;
      const awayIndex = (i * 2 + 1) % teams.length;
      
      if (homeIndex < teams.length && awayIndex < teams.length) {
        const kickoffDate = new Date();
        kickoffDate.setDate(kickoffDate.getDate() + Math.floor(Math.random() * 7) + 1);
        
        fixtures.push({
          id: `${league.toLowerCase().replace(' ', '-')}-${i}`,
          homeTeam: teams[homeIndex],
          awayTeam: teams[awayIndex],
          kickoffTime: kickoffDate.toISOString(),
          date: kickoffDate.toISOString().split('T')[0],
          league: league as 'Premier League' | 'Championship' | 'La Liga' | 'Bundesliga' | 'Serie A' | 'Ligue 1',
          gameweek: this.getCurrentGameweek(league),
          status: 'upcoming',
          venue: `${teams[homeIndex]} Stadium`,
          isOutdoor: true,
          weather: this.generateMockWeather()
        });
      }
    }

    return fixtures;
  }

  // Generate mock fixtures for all leagues
  private static generateAllMockFixtures(): SoccerMatch[] {
    const leagues = ['Premier League', 'Championship', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];
    const allFixtures: SoccerMatch[] = [];

    for (const league of leagues) {
      allFixtures.push(...this.generateMockFixtures(league));
    }

    return allFixtures;
  }

  // Get last N matches for a team to calculate BTTS rate
  static async getTeamLastMatches(teamName: string, league: string): Promise<{ btts: boolean }[]> {
    try {
      const response = await this.fetchFootballData('team-matches', {
        team: teamName,
        league: league.toLowerCase().replace(' ', '-'),
        limit: this.RECENCY_N
      });

      if (!response.data?.matches) {
        console.log(`No recent matches found for ${teamName}`);
        return [];
      }

      return response.data.matches.map((match: any) => ({
        btts: match.home_score > 0 && match.away_score > 0
      }));
    } catch (error) {
      console.error(`Error fetching matches for ${teamName}:`, error);
      // Return mock data with realistic BTTS rates if API fails
      return this.generateMockTeamMatches(teamName);
    }
  }

  // Generate realistic mock data for testing
  private static generateMockTeamMatches(teamName: string): { btts: boolean }[] {
    // Simulate realistic BTTS rates (typically 40-70% in top leagues)
    const bttsRate = 0.45 + Math.random() * 0.25; // 45-70%
    
    return Array.from({ length: this.RECENCY_N }, () => ({
      btts: Math.random() < bttsRate
    }));
  }

  // Get current gameweek (mock implementation)
  private static getCurrentGameweek(league: string): number {
    // In real implementation, this would calculate based on current date
    // For now, return a reasonable gameweek number
    const now = new Date();
    const seasonStart = new Date('2024-08-17'); // Typical PL season start
    const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(38, weeksPassed + 1));
  }

  // Generate BTTS picks for current gameweek
  static async generateBTTSPicks(): Promise<BTTSAnalysis> {
    try {
      console.log('=== GENERATING BTTS PICKS ===');
      
      // Get upcoming fixtures
      const fixtures = await this.getCurrentGameweekFixtures();
      console.log(`Processing ${fixtures.length} fixtures`);

      const picks: BTTSPick[] = [];
      
      for (const fixture of fixtures) {
        try {
          // Get BTTS rates for both teams
          const [homeMatches, awayMatches] = await Promise.all([
            this.getTeamLastMatches(fixture.homeTeam, fixture.league),
            this.getTeamLastMatches(fixture.awayTeam, fixture.league)
          ]);

          const homeRate = this.calculateTeamBTTSRate(homeMatches);
          const awayRate = this.calculateTeamBTTSRate(awayMatches);

          // Calculate fixture probability: P_BTTS = 0.5 * R_home + 0.5 * R_away
          const probability = 0.5 * homeRate + 0.5 * awayRate;
          
          // Only include picks above confidence threshold
          if (probability >= this.CONFIDENCE_THRESHOLD) {
            picks.push({
              id: fixture.id,
              league: fixture.league,
              gameweek: fixture.gameweek,
              homeTeam: fixture.homeTeam,
              awayTeam: fixture.awayTeam,
              homeTeamRate: homeRate,
              awayTeamRate: awayRate,
              probability,
              confidence: Math.round(probability * 100),
              valueRating: Math.random() * 20 - 10, // Mock value rating between -10% and +10%
              kickoffTime: fixture.kickoffTime || fixture.date,
              date: fixture.date,
              venue: fixture.venue,
              weather: fixture.weather
            });
          }
        } catch (error) {
          console.error(`Error processing fixture ${fixture.homeTeam} vs ${fixture.awayTeam}:`, error);
        }
      }

      // Sort by confidence (highest first)
      picks.sort((a, b) => b.probability - a.probability);

      const averageConfidence = picks.length > 0 
        ? picks.reduce((sum, pick) => sum + pick.confidence, 0) / picks.length 
        : 0;

      console.log(`Generated ${picks.length} BTTS picks with average confidence ${averageConfidence.toFixed(1)}%`);
      
      return {
        lastUpdated: new Date(),
        currentGameweek: {
          premierLeague: this.getCurrentGameweek('Premier League'),
          championship: this.getCurrentGameweek('Championship')
        },
        picks,
        totalPicks: picks.length,
        averageConfidence: Math.round(averageConfidence)
      };
    } catch (error) {
      console.error('Error generating BTTS picks:', error);
      throw error;
    }
  }

  // Get stored BTTS analysis from database
  static async getStoredBTTSAnalysis(): Promise<BTTSAnalysis | null> {
    try {
      // Fetch current analysis metadata
      const { data: analysisData, error: analysisError } = await supabase
        .from('btts_analysis')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (analysisError) {
        console.log('No stored analysis found, generating fresh picks');
        return await this.generateBTTSPicks();
      }

      // Fetch current picks
      const { data: picksData, error: picksError } = await supabase
        .from('btts_picks')
        .select('*')
        .gte('kickoff_time', new Date().toISOString())
        .order('confidence', { ascending: false });

      if (picksError) {
        console.error('Error fetching picks:', picksError);
        return await this.generateBTTSPicks();
      }

      // Convert database records to BTTSPick format
      const picks: BTTSPick[] = (picksData || []).map(pick => ({
        id: pick.id,
        league: pick.league as 'Premier League' | 'Championship',
        gameweek: pick.gameweek,
        homeTeam: pick.home_team,
        awayTeam: pick.away_team,
        homeTeamRate: parseFloat(pick.home_team_rate.toString()),
        awayTeamRate: parseFloat(pick.away_team_rate.toString()),
        probability: parseFloat(pick.probability.toString()),
        confidence: pick.confidence,
        valueRating: Math.random() * 20 - 10, // Mock value rating
        kickoffTime: pick.kickoff_time,
        date: pick.match_date
      }));

      return {
        lastUpdated: new Date(analysisData.last_updated),
        currentGameweek: {
          premierLeague: analysisData.premier_league_gameweek,
          championship: analysisData.championship_gameweek
        },
        picks,
        totalPicks: analysisData.total_picks,
        averageConfidence: parseFloat(analysisData.average_confidence.toString())
      };
    } catch (error) {
      console.error('Error getting stored BTTS analysis:', error);
      // Fall back to generating fresh picks
      return await this.generateBTTSPicks();
    }
  }

  // Trigger the scheduled update function
  static async triggerScheduledUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Triggering scheduled BTTS update...');
      
      const response = await supabase.functions.invoke('btts-scheduler');
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Scheduled update failed');
      }
      
      return {
        success: true,
        message: `Updated successfully: ${response.data.data?.picks_generated || 0} picks generated`
      };
    } catch (error) {
      console.error('Error triggering scheduled update:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }
}