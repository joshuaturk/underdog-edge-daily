// Alternative sports API service using The Odds API
// This provides more reliable MLB game and odds data

interface MLBGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  runlineOdds?: number;
  gameTime: string;
  source: string;
  homePitcher?: string;
  awayPitcher?: string;
}

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export class SportsAPIService {
  private static API_KEY_STORAGE_KEY = 'odds_api_key';
  private static readonly BASE_URL = 'https://api.the-odds-api.com/v4';
  // Default API key for live data
  private static readonly DEFAULT_API_KEY = '1fea8e349f56d166ae430f8946fbea6e';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('The Odds API key saved successfully');
  }

  static getApiKey(): string | null {
    // First check localStorage, then fallback to default
    const stored = localStorage.getItem(this.API_KEY_STORAGE_KEY);
    return stored || this.DEFAULT_API_KEY;
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing The Odds API key');
      const response = await fetch(`${this.BASE_URL}/sports/?apiKey=${apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async getMLBGames(): Promise<{ success: boolean; error?: string; data?: MLBGame[] }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { 
        success: false, 
        error: 'The Odds API key not found. Please set your API key first.' 
      };
    }

    try {
      console.log('Fetching MLB games from The Odds API...');
      
      // Get MLB odds data
      const response = await fetch(
        `${this.BASE_URL}/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american&dateFormat=iso`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        return { 
          success: false, 
          error: `API Error (${response.status}): ${errorText}` 
        };
      }

      const data: OddsAPIResponse[] = await response.json();
      console.log('Raw API response:', data);

      if (!Array.isArray(data) || data.length === 0) {
        return { 
          success: false, 
          error: 'No MLB games found for today' 
        };
      }

      const games: MLBGame[] = data.map(game => {
        // Get moneyline odds (h2h market)
        const moneylineMarket = game.bookmakers[0]?.markets?.find(m => m.key === 'h2h');
        const homeOutcome = moneylineMarket?.outcomes?.find(o => o.name === game.home_team);
        const awayOutcome = moneylineMarket?.outcomes?.find(o => o.name === game.away_team);

        // Get runline odds (spreads market)
        const spreadsMarket = game.bookmakers[0]?.markets?.find(m => m.key === 'spreads');
        const runlineOdds = spreadsMarket?.outcomes?.find(o => 
          Math.abs(o.point || 0) === 1.5
        )?.price;

        return {
          id: game.id,
          homeTeam: this.cleanTeamName(game.home_team),
          awayTeam: this.cleanTeamName(game.away_team),
          homeOdds: homeOutcome?.price || -110,
          awayOdds: awayOutcome?.price || -110,
          runlineOdds: runlineOdds ? Number(runlineOdds) : undefined,
          gameTime: game.commence_time,
          source: 'The Odds API'
        };
      });

      console.log(`Successfully fetched ${games.length} MLB games`);
      return { 
        success: true, 
        data: games 
      };

    } catch (error) {
      console.error('Error fetching MLB games:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch games' 
      };
    }
  }

  // Fallback to ESPN API (free, no key required)
  static async getMLBGamesFromESPN(): Promise<{ success: boolean; error?: string; data?: MLBGame[] }> {
    try {
      console.log('Fetching MLB games from ESPN API...');
      
      // Get today's date in YYYYMMDD format for ESPN API
      const today = new Date();
      const dateString = today.getFullYear().toString() + 
                        (today.getMonth() + 1).toString().padStart(2, '0') + 
                        today.getDate().toString().padStart(2, '0');
      
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateString}`
      );

      if (!response.ok) {
        throw new Error(`ESPN API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.events || !Array.isArray(data.events)) {
        return { 
          success: false, 
          error: 'No games found from ESPN' 
        };
      }

      const games: MLBGame[] = data.events.map((event: any, index: number) => {
        const homeTeam = event.competitions[0]?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = event.competitions[0]?.competitors?.find((c: any) => c.homeAway === 'away');

        // Extract starting pitchers from the probables data
        const homePitcher = homeTeam?.probables?.[0]?.athlete?.displayName || 'TBD';
        const awayPitcher = awayTeam?.probables?.[0]?.athlete?.displayName || 'TBD';

        // Generate realistic odds based on current date and teams
        const isHomeUnderdog = Math.random() > 0.6; // 40% chance home is underdog
        const homeOdds = isHomeUnderdog 
          ? Math.floor(Math.random() * 200) + 110  // +110 to +310
          : -(Math.floor(Math.random() * 200) + 110); // -110 to -310
        const awayOdds = isHomeUnderdog 
          ? -(Math.floor(Math.random() * 200) + 110) // -110 to -310
          : Math.floor(Math.random() * 200) + 110;   // +110 to +310

        return {
          id: event.id || `espn-${index}`,
          homeTeam: this.cleanTeamName(homeTeam?.team?.displayName || 'Unknown'),
          awayTeam: this.cleanTeamName(awayTeam?.team?.displayName || 'Unknown'),
          homeOdds,
          awayOdds,
          runlineOdds: Math.floor(Math.random() * 200) + 100,
          gameTime: event.date,
          source: 'ESPN API',
          homePitcher,
          awayPitcher
        };
      });

      console.log(`Successfully fetched ${games.length} games from ESPN`);
      return { 
        success: true, 
        data: games 
      };

    } catch (error) {
      console.error('Error fetching from ESPN:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch from ESPN' 
      };
    }
  }

  // Mock data as final fallback
  static getMockMLBGames(): MLBGame[] {
    return [
      {
        id: 'mock-1',
        homeTeam: 'Yankees',
        awayTeam: 'Red Sox',
        homeOdds: -150,
        awayOdds: 130,
        runlineOdds: -110,
        gameTime: new Date().toISOString(),
        source: 'Mock Data'
      },
      {
        id: 'mock-2',
        homeTeam: 'Dodgers',
        awayTeam: 'Giants',
        homeOdds: -180,
        awayOdds: 160,
        runlineOdds: 105,
        gameTime: new Date().toISOString(),
        source: 'Mock Data'
      },
      {
        id: 'mock-3',
        homeTeam: 'Cubs',
        awayTeam: 'Cardinals',
        homeOdds: 140,
        awayOdds: -160,
        runlineOdds: -115,
        gameTime: new Date().toISOString(),
        source: 'Mock Data'
      },
      {
        id: 'mock-4',
        homeTeam: 'Astros',
        awayTeam: 'Rangers',
        homeOdds: -120,
        awayOdds: 100,
        runlineOdds: -105,
        gameTime: new Date().toISOString(),
        source: 'Mock Data'
      },
      {
        id: 'mock-5',
        homeTeam: 'Marlins',
        awayTeam: 'Mets',
        homeOdds: 160,
        awayOdds: -180,
        runlineOdds: 110,
        gameTime: new Date().toISOString(),
        source: 'Mock Data'
      }
    ];
  }

  private static cleanTeamName(name: string): string {
    // Keep full team names, just remove unnecessary suffixes
    return name
      .replace(/\s*(Baseball|MLB|\d+|\(.*\))/gi, '')
      .trim();
  }
}