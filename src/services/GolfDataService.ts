import { supabase } from '@/integrations/supabase/client';

export interface GolfLeaderboardData {
  name: string;
  position: number;
  score: number;
  thru: string | number;
  status: 'WON' | 'LOST' | 'ACTIVE' | 'CUT';
  rounds?: number[];
  teeTime?: string;
}

export interface GolfDataResponse {
  success: boolean;
  data: GolfLeaderboardData[];
  source: string;
  errors?: string[];
  tournament?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface GolfOddsData {
  playerName: string;
  odds: string;
  bookmaker: string;
  market: string;
}

/**
 * Five-tier golf data service with fallback hierarchy:
 * 1. Slash Golf API (Primary)
 * 2. PGA Tour Internal JSON (Secondary) 
 * 3. ESPN Golf API (Fallback #1)
 * 4. Sportsdata.io Golf API (Fallback #2)
 * 5. The Odds API (Fallback #3)
 */
export class GolfDataService {
  private static readonly API_ENDPOINTS = {
    SLASH_GOLF_BASE: 'https://api.slashgolf.com/v1',
    PGA_TOUR_BASE: 'https://statdata.pgatour.com/r',
    ESPN_BASE: 'https://site.api.espn.com/apis/site/v2/sports/golf',
    SPORTSDATA_BASE: 'https://api.sportsdata.io/golf/v2/json',
    ODDS_API_BASE: 'https://api.the-odds-api.com/v4'
  };

  /**
   * Fetch golf statistics using edge function with five-tier fallback system
   */
  static async fetchGolfStats(endpoint: string = 'leaderboard'): Promise<GolfDataResponse> {
    try {
      const response = await supabase.functions.invoke('golf-live-data', {
        body: { 
          endpoint: endpoint,
          params: {}
        }
      });

      if (response.data?.success) {
        return response.data;
      }

      throw new Error('Edge function returned unsuccessful response');
    } catch (error) {
      throw new Error(`Golf data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch golf odds using the same five-tier system
   */
  static async fetchGolfOdds(): Promise<GolfOddsData[]> {
    try {
      // Use existing edge function which will be updated to use new system
      const response = await supabase.functions.invoke('golf-live-data', {
        body: { 
          endpoint: 'odds',
          params: {}
        }
      });

      if (response.data?.success && response.data.data) {
        return this.parseOddsData(response.data.data);
      }

      return [];
    } catch (error) {
      console.error('Error fetching golf odds:', error);
      return [];
    }
  }

  // Private methods for each API tier

  private static async trySlashGolfAPI(endpoint: string): Promise<GolfDataResponse & { error?: string }> {
    // All API calls are handled through the edge function for security
    return { success: false, error: 'Use edge function for API calls', data: [], source: 'Slash Golf' };
  }

  private static async tryPGATourAPI(): Promise<GolfDataResponse & { error?: string }> {
    try {
      // First get current tournament ID
      const messageResponse = await fetch(`${this.API_ENDPOINTS.PGA_TOUR_BASE}/current/message.json`);
      if (!messageResponse.ok) {
        return { success: false, error: 'Cannot fetch current tournament', data: [], source: 'PGA Tour' };
      }

      const messageData = await messageResponse.json();
      const tournamentId = messageData?.tid || messageData?.tournament_id;
      
      if (!tournamentId) {
        return { success: false, error: 'No active tournament found', data: [], source: 'PGA Tour' };
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch(`${this.API_ENDPOINTS.PGA_TOUR_BASE}/${tournamentId}/leaderboard-v2.json`);
      if (!leaderboardResponse.ok) {
        return { success: false, error: `HTTP ${leaderboardResponse.status}`, data: [], source: 'PGA Tour' };
      }

      const leaderboardData = await leaderboardResponse.json();
      const transformedData = this.transformPGATourData(leaderboardData);

      return {
        success: true,
        data: transformedData,
        source: 'PGA Tour',
        tournament: {
          id: tournamentId,
          name: leaderboardData.tournament?.name || 'Current Tournament',
          status: leaderboardData.tournament?.status || 'active'
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        data: [], 
        source: 'PGA Tour' 
      };
    }
  }

  private static async tryESPNAPI(): Promise<GolfDataResponse & { error?: string }> {
    const apiKey = process.env.ESPN_API_KEY;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${this.API_ENDPOINTS.ESPN_BASE}/pga/leaderboard`, {
      headers
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, data: [], source: 'ESPN' };
    }

    const data = await response.json();
    const transformedData = this.transformESPNData(data);

    return {
      success: true,
      data: transformedData,
      source: 'ESPN',
      tournament: data.events?.[0] ? {
        id: data.events[0].id,
        name: data.events[0].name,
        status: data.events[0].status?.type?.name || 'active'
      } : undefined
    };
  }

  private static async trySportsdataAPI(endpoint: string): Promise<GolfDataResponse & { error?: string }> {
    const apiKey = process.env.SPORTSDATA_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'API key not configured', data: [], source: 'Sportsdata.io' };
    }

    const url = `${this.API_ENDPOINTS.SPORTSDATA_BASE}/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, data: [], source: 'Sportsdata.io' };
    }

    const data = await response.json();
    const transformedData = this.transformSportsdataData(data);

    return {
      success: true,
      data: transformedData,
      source: 'Sportsdata.io'
    };
  }

  private static async tryOddsAPI(): Promise<GolfDataResponse & { error?: string }> {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'API key not configured', data: [], source: 'Odds API' };
    }

    const response = await fetch(`${this.API_ENDPOINTS.ODDS_API_BASE}/sports/golf/odds/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, data: [], source: 'Odds API' };
    }

    const data = await response.json();
    const transformedData = this.transformOddsAPIData(data);

    return {
      success: true,
      data: transformedData,
      source: 'Odds API'
    };
  }

  // Data transformation methods

  private static transformSlashGolfData(data: any): GolfLeaderboardData[] {
    if (!data?.leaderboard) return [];
    
    return data.leaderboard.map((player: any) => ({
      name: player.name || player.player_name,
      position: player.position || player.pos,
      score: player.total_score || player.score || 0,
      thru: player.thru || player.holes_completed || 'F',
      status: this.normalizeStatus(player.status),
      rounds: player.rounds || [],
      teeTime: player.tee_time
    }));
  }

  private static transformPGATourData(data: any): GolfLeaderboardData[] {
    if (!data?.leaderboard?.players) return [];
    
    return data.leaderboard.players.map((player: any) => ({
      name: player.player_bio?.first_name + ' ' + player.player_bio?.last_name,
      position: parseInt(player.current_position) || 0,
      score: parseInt(player.total_strokes) || 0,
      thru: player.thru || 'F',
      status: this.normalizeStatus(player.player_state),
      rounds: player.rounds?.map((r: any) => r.strokes) || [],
      teeTime: player.tee_time
    }));
  }

  private static transformESPNData(data: any): GolfLeaderboardData[] {
    if (!data?.events?.[0]?.competitions?.[0]?.competitors) return [];
    
    const competitors = data.events[0].competitions[0].competitors;
    return competitors.map((competitor: any) => ({
      name: competitor.athlete?.displayName || competitor.athlete?.name,
      position: competitor.status?.position || 0,
      score: competitor.score || 0,
      thru: competitor.status?.thru || 'F',
      status: this.normalizeStatus(competitor.status?.type?.name)
    }));
  }

  private static transformSportsdataData(data: any): GolfLeaderboardData[] {
    if (!Array.isArray(data)) return [];
    
    return data.map((player: any) => ({
      name: player.Name || player.PlayerName,
      position: player.Rank || player.Position || 0,
      score: player.TotalScore || player.Score || 0,
      thru: player.Thru || 'F',
      status: this.normalizeStatus(player.Status)
    }));
  }

  private static transformOddsAPIData(data: any): GolfLeaderboardData[] {
    // Odds API typically doesn't have leaderboard data, but may have player info
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      name: item.player_name || item.name,
      position: 0, // No position data from odds
      score: 0, // No score data from odds
      thru: '-',
      status: 'ACTIVE' as const
    }));
  }

  private static normalizeStatus(status: string | undefined): 'WON' | 'LOST' | 'ACTIVE' | 'CUT' {
    if (!status) return 'ACTIVE';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('cut') || statusLower.includes('wd') || statusLower.includes('dq')) {
      return 'CUT';
    }
    if (statusLower.includes('won') || statusLower.includes('win')) {
      return 'WON';
    }
    if (statusLower.includes('complete') || statusLower.includes('finish')) {
      return 'LOST';
    }
    return 'ACTIVE';
  }

  private static parseOddsData(data: any): GolfOddsData[] {
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      playerName: item.name || item.playerName || item.player_name,
      odds: item.odds || item.price || item.value || '+100',
      bookmaker: item.bookmaker || item.sportsbook || 'Unknown',
      market: item.market || 'top_10'
    }));
  }
}