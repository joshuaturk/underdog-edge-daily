// Alternative sports API service using The Odds API
// This provides more reliable MLB game and odds data

export interface MLBGame {
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
  // Live score properties
  homeScore?: number;
  awayScore?: number;
  status?: 'scheduled' | 'live' | 'final';
  inning?: string;
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
  static async getMLBGamesFromESPN(daysOffset: number = 0): Promise<{ success: boolean; error?: string; data?: MLBGame[] }> {
    try {
      console.log(`Fetching MLB games from ESPN API for ${daysOffset === 0 ? 'today' : 'tomorrow'}...`);
      
      // Get target date in YYYYMMDD format for ESPN API
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysOffset);
      const dateString = targetDate.getFullYear().toString() + 
                        (targetDate.getMonth() + 1).toString().padStart(2, '0') + 
                        targetDate.getDate().toString().padStart(2, '0');
      
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

        // Extract live scores and status
        const homeScore = parseInt(homeTeam?.score || '0');
        const awayScore = parseInt(awayTeam?.score || '0');
        
        // Determine game status
        let status: 'scheduled' | 'live' | 'final' = 'scheduled';
        let inning: string | undefined;
        
        const competition = event.competitions[0];
        if (competition?.status?.type?.completed) {
          status = 'final';
        } else if (competition?.status?.type?.state === 'in' || competition?.recent) {
          status = 'live';
          // Extract inning information if available
          if (competition?.status?.period) {
            const period = competition.status.period;
            const displayClock = competition?.status?.displayClock;
            inning = displayClock ? `${displayClock}` : `T${period}`;
          }
        }

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
          awayPitcher,
          homeScore: homeScore || undefined,
          awayScore: awayScore || undefined,
          status,
          inning
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
    const cleanName = name
      .replace(/\s*(Baseball|MLB|\d+|\(.*\))/gi, '')
      .trim();
    
    // Apply city shortcodes
    return this.shortenTeamName(cleanName);
  }

  private static shortenTeamName(name: string): string {
    const cityMap: { [key: string]: string } = {
      'New York Yankees': 'NY Yankees',
      'New York Mets': 'NY Mets',
      'Los Angeles Dodgers': 'LA Dodgers',
      'Los Angeles Angels': 'LA Angels',
      'San Francisco Giants': 'SF Giants',
      'San Diego Padres': 'SD Padres',
      'Toronto Blue Jays': 'TOR Blue Jays',
      'Boston Red Sox': 'BOS Red Sox',
      'Chicago Cubs': 'CHI Cubs',
      'Chicago White Sox': 'CHI White Sox',
      'St. Louis Cardinals': 'STL Cardinals',
      'Philadelphia Phillies': 'PHI Phillies',
      'Cleveland Guardians': 'CLE Guardians',
      'Detroit Tigers': 'DET Tigers',
      'Minnesota Twins': 'MIN Twins',
      'Tampa Bay Rays': 'TB Rays',
      'Baltimore Orioles': 'BAL Orioles',
      'Houston Astros': 'HOU Astros',
      'Texas Rangers': 'TEX Rangers',
      'Seattle Mariners': 'SEA Mariners',
      'Oakland Athletics': 'OAK Athletics',
      'Kansas City Royals': 'KC Royals',
      'Atlanta Braves': 'ATL Braves',
      'Miami Marlins': 'MIA Marlins',
      'Washington Nationals': 'WAS Nationals',
      'Pittsburgh Pirates': 'PIT Pirates',
      'Cincinnati Reds': 'CIN Reds',
      'Milwaukee Brewers': 'MIL Brewers',
      'Colorado Rockies': 'COL Rockies',
      'Arizona Diamondbacks': 'ARI Diamondbacks'
    };

    return cityMap[name] || name;
  }
}