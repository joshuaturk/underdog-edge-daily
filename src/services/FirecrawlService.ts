import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapeResponse {
  success: true;
  data: {
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
    };
  };
}

type ScrapingResponse = ScrapeResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
    console.log('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key');
      this.firecrawlApp = new FirecrawlApp({ apiKey });
      // Simple test scrape
      const testResponse = await this.firecrawlApp.scrapeUrl('https://example.com');
      return testResponse.success;
    } catch (error) {
      console.error('Error testing Firecrawl API key:', error);
      return false;
    }
  }

  static async scrapeSportsData(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'Firecrawl API key not found. Please set your API key first.' };
    }

    try {
      console.log('Scraping sports data from:', url);
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const scrapeResponse = await this.firecrawlApp.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }) as ScrapingResponse;

      if (!scrapeResponse.success) {
        console.error('Scrape failed:', (scrapeResponse as ErrorResponse).error);
        return { 
          success: false, 
          error: (scrapeResponse as ErrorResponse).error || 'Failed to scrape website' 
        };
      }

      console.log('Scrape successful');
      return { 
        success: true,
        data: scrapeResponse.data 
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to website' 
      };
    }
  }

  static async scrapeMLBOdds(): Promise<{ success: boolean; error?: string; data?: any }> {
    // ESPN MLB odds page
    return this.scrapeSportsData('https://www.espn.com/mlb/lines');
  }

  static async scrapeMLBStandings(): Promise<{ success: boolean; error?: string; data?: any }> {
    // ESPN MLB standings
    return this.scrapeSportsData('https://www.espn.com/mlb/standings');
  }

  static async scrapeMLBSchedule(): Promise<{ success: boolean; error?: string; data?: any }> {
    // Try multiple sources including betting sites with Bet365 odds
    const sources = [
      {
        url: 'https://www.bet365.com/en/sports/baseball/mlb',
        name: 'Bet365 MLB Odds'
      },
      {
        url: 'https://www.vegasinsider.com/mlb/odds/',
        name: 'Vegas Insider MLB'
      },
      {
        url: 'https://www.oddsshark.com/mlb/odds',
        name: 'OddsShark MLB'
      },
      {
        url: 'https://www.baseball-reference.com/previews/',
        name: 'Baseball Reference Previews'
      },
      {
        url: 'https://www.mlb.com/scores',
        name: 'MLB Scores'
      },
      {
        url: 'https://www.covers.com/sports/mlb/matchups',
        name: 'Covers MLB Matchups'
      }
    ];

    for (const source of sources) {
      try {
        console.log(`Attempting to scrape from: ${source.name} (${source.url})`);
        const result = await this.scrapeSportsData(source.url);
        
        if (result.success && result.data && result.data.markdown) {
          console.log(`Successfully scraped from: ${source.name}`);
          console.log('Raw scraped data sample:', result.data.markdown.substring(0, 500));
          
          // Try to parse games from this source
          const parsedGames = this.parseMLBGamesAdvanced(result.data.markdown, source.name);
          if (parsedGames.length > 0) {
            console.log(`Found ${parsedGames.length} games from ${source.name}:`, parsedGames);
            return { 
              success: true, 
              data: { 
                ...result.data, 
                parsedGames,
                source: source.name 
              } 
            };
          }
        } else {
          console.log(`No usable data from: ${source.name}`);
        }
      } catch (error) {
        console.log(`Error scraping ${source.name}:`, error);
        continue;
      }
    }

    return { success: false, error: 'All MLB data sources failed to return usable game information' };
  }
  
  static parseMLBGamesAdvanced(scrapedData: string, sourceName: string): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    const games = [];
    const lines = scrapedData.split('\n');
    
    console.log(`Parsing data from ${sourceName}, total lines: ${lines.length}`);
    
    // Different parsing strategies based on source
    if (sourceName.includes('Bet365')) {
      return this.parseBet365Data(lines);
    } else if (sourceName.includes('Vegas Insider')) {
      return this.parseVegasInsiderData(lines);
    } else if (sourceName.includes('OddsShark')) {
      return this.parseOddsSharkData(lines);
    } else if (sourceName.includes('Baseball Reference')) {
      return this.parseBaseballReferenceData(lines);
    } else if (sourceName.includes('MLB')) {
      return this.parseMLBData(lines);
    } else if (sourceName.includes('Covers')) {
      return this.parseCoversData(lines);
    }
    
    // Fallback to general parsing
    return this.parseOddsData(scrapedData).map(game => ({
      ...game,
      source: sourceName
    }));
  }

  private static parseBet365Data(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    const games = [];
    const mlbTeams = ['Yankees', 'Red Sox', 'Blue Jays', 'Orioles', 'Rays', 'Astros', 'Angels', 'Athletics', 'Mariners', 'Rangers', 
                      'Braves', 'Marlins', 'Mets', 'Phillies', 'Nationals', 'Cubs', 'Reds', 'Brewers', 'Pirates', 'Cardinals',
                      'Diamondbacks', 'Rockies', 'Dodgers', 'Padres', 'Giants', 'Indians', 'Tigers', 'Royals', 'Twins', 'White Sox'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      // Look for team names in the line
      const foundTeams = mlbTeams.filter(team => line.includes(team.toLowerCase()));
      
      if (foundTeams.length >= 2) {
        // Look for odds patterns around this line
        const oddsContext = lines.slice(Math.max(0, i-3), Math.min(lines.length, i+4)).join(' ');
        const oddsMatches = oddsContext.match(/[-+]\d{2,4}/g);
        
        if (oddsMatches && oddsMatches.length >= 2) {
          games.push({
            homeTeam: foundTeams[1],
            awayTeam: foundTeams[0],
            homeOdds: parseInt(oddsMatches[1]) || -110,
            awayOdds: parseInt(oddsMatches[0]) || -110,
            runlineOdds: oddsMatches[2] ? parseInt(oddsMatches[2]) : undefined,
            source: 'Bet365'
          });
        }
      }
    }
    
    return games.slice(0, 10); // Limit to 10 games
  }

  private static parseVegasInsiderData(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    const games = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Vegas Insider often uses @ symbol for away vs home
      if (line.includes('@') && !line.includes('http')) {
        const parts = line.split('@');
        if (parts.length === 2) {
          const awayTeam = this.cleanTeamName(parts[0].trim());
          const homeTeam = this.cleanTeamName(parts[1].trim());
          
          // Look for odds in surrounding lines
          const contextLines = lines.slice(Math.max(0, i-2), Math.min(lines.length, i+3));
          const oddsPattern = /[-+]\d{2,4}/g;
          let allOdds = [];
          
          contextLines.forEach(contextLine => {
            const matches = contextLine.match(oddsPattern);
            if (matches) allOdds.push(...matches);
          });
          
          if (allOdds.length >= 2) {
            games.push({
              homeTeam,
              awayTeam,
              homeOdds: parseInt(allOdds[1]) || -110,
              awayOdds: parseInt(allOdds[0]) || -110,
              runlineOdds: allOdds[2] ? parseInt(allOdds[2]) : undefined,
              source: 'Vegas Insider'
            });
          }
        }
      }
    }
    
    return games.slice(0, 10);
  }

  private static parseOddsSharkData(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    return this.parseGenericOddsData(lines, 'OddsShark');
  }

  private static parseBaseballReferenceData(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    return this.parseGenericOddsData(lines, 'Baseball Reference');
  }

  private static parseMLBData(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    return this.parseGenericOddsData(lines, 'MLB.com');
  }

  private static parseCoversData(lines: string[]): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    return this.parseGenericOddsData(lines, 'Covers');
  }

  private static parseGenericOddsData(lines: string[], source: string): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number, runlineOdds?: number, source: string}> {
    const games = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for common game patterns
      if ((line.includes('vs') || line.includes('@') || line.includes(' - ')) && !line.includes('http')) {
        const teamPattern = /([\w\s]+?)\s*(?:vs|@|-)\s*([\w\s]+)/i;
        const match = line.match(teamPattern);
        
        if (match) {
          const team1 = this.cleanTeamName(match[1]);
          const team2 = this.cleanTeamName(match[2]);
          
          // Determine home/away based on pattern
          const isAwayAtHome = line.includes('@');
          const homeTeam = isAwayAtHome ? team2 : team1;
          const awayTeam = isAwayAtHome ? team1 : team2;
          
          // Look for odds
          const contextLines = lines.slice(Math.max(0, i-1), Math.min(lines.length, i+2));
          const oddsPattern = /[-+]\d{2,4}/g;
          let allOdds = [];
          
          contextLines.forEach(contextLine => {
            const matches = contextLine.match(oddsPattern);
            if (matches) allOdds.push(...matches);
          });
          
          if (team1.length > 2 && team2.length > 2) {
            games.push({
              homeTeam,
              awayTeam,
              homeOdds: allOdds[1] ? parseInt(allOdds[1]) : -110,
              awayOdds: allOdds[0] ? parseInt(allOdds[0]) : -110,
              runlineOdds: allOdds[2] ? parseInt(allOdds[2]) : undefined,
              source
            });
          }
        }
      }
    }
    
    return games.slice(0, 10);
  }
  static parseOddsData(scrapedData: string): Array<{homeTeam: string, awayTeam: string, homeOdds: number, awayOdds: number}> {
    // Basic parsing logic for scraped odds data
    const games = [];
    const lines = scrapedData.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for team matchups (simplified pattern matching)
      if (line.includes('@') && line.includes('vs')) {
        try {
          // Extract team names and odds
          const parts = line.split('@');
          if (parts.length >= 2) {
            const awayTeam = parts[0].trim();
            const homePart = parts[1].trim();
            const homeTeam = homePart.split(' ')[0];
            
            // Look for odds in nearby lines
            let homeOdds = -110;
            let awayOdds = -110;
            
            for (let j = i - 2; j <= i + 2 && j < lines.length; j++) {
              if (j >= 0) {
                const oddsLine = lines[j];
                const oddsMatch = oddsLine.match(/[-+]\d{2,4}/g);
                if (oddsMatch && oddsMatch.length >= 2) {
                  awayOdds = parseInt(oddsMatch[0]);
                  homeOdds = parseInt(oddsMatch[1]);
                  break;
                }
              }
            }
            
            games.push({
              homeTeam: this.cleanTeamName(homeTeam),
              awayTeam: this.cleanTeamName(awayTeam),
              homeOdds,
              awayOdds
            });
          }
        } catch (error) {
          console.error('Error parsing game data:', error);
        }
      }
    }
    
    return games;
  }

  private static cleanTeamName(name: string): string {
    // Remove common suffixes and clean team names
    return name
      .replace(/\s*(MLB|Baseball|\d+|\(.*\))/gi, '')
      .trim()
      .replace(/^(New York|Los Angeles|San Francisco|San Diego|Tampa Bay).*/, '$1')
      .substring(0, 20); // Limit length
  }
}