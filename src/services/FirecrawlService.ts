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
    // ESPN MLB schedule
    return this.scrapeSportsData('https://www.espn.com/mlb/schedule');
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