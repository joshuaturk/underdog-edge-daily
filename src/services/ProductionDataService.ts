import { supabase } from '@/lib/supabase';

export class ProductionDataService {
  private static async getFirecrawlApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { secretName: 'FIRECRAWL_API_KEY' }
      });
      
      if (error) {
        console.error('Error fetching API key:', error);
        return null;
      }
      
      return data?.secret || null;
    } catch (error) {
      console.error('Error getting Firecrawl API key:', error);
      return null;
    }
  }

  static async scrapeMLBData(): Promise<{ success: boolean; data?: any; error?: string }> {
    const apiKey = await this.getFirecrawlApiKey();
    
    if (!apiKey) {
      return { 
        success: false, 
        error: 'Firecrawl API key not configured. Please contact support.' 
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('scrape-mlb-data', {
        body: { apiKey }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error scraping MLB data:', error);
      return { 
        success: false, 
        error: 'Failed to scrape MLB data. Please try again.' 
      };
    }
  }

  static async savePickResult(pick: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Transform pick data to match database schema
      const dbPick = {
        id: pick.id,
        date: pick.date,
        home_team: pick.homeTeam,
        away_team: pick.awayTeam,
        recommended_bet: pick.recommendedBet,
        confidence: pick.confidence,
        reason: pick.reason,
        odds: pick.odds,
        status: pick.status,
        home_score: pick.result?.homeScore,
        away_score: pick.result?.awayScore,
        score_difference: pick.result?.scoreDifference,
        profit: pick.profit,
        home_pitcher: pick.homePitcher,
        away_pitcher: pick.awayPitcher,
        inning: pick.inning
      };

      // Use upsert to handle duplicates while preserving existing data
      const { data, error } = await supabase
        .from('betting_picks')
        .upsert(dbPick, {
          onConflict: 'date,home_team,away_team,recommended_bet',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving pick result:', error);
      return { success: false, error: 'Failed to save pick result' };
    }
  }

  static async saveBulkPicks(picks: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Transform picks to match database schema
      const dbPicks = picks.map(pick => ({
        id: pick.id,
        date: pick.date,
        home_team: pick.homeTeam,
        away_team: pick.awayTeam,
        recommended_bet: pick.recommendedBet,
        confidence: pick.confidence,
        reason: pick.reason,
        odds: pick.odds,
        status: pick.status,
        home_score: pick.result?.homeScore,
        away_score: pick.result?.awayScore,
        score_difference: pick.result?.scoreDifference,
        profit: pick.profit,
        home_pitcher: pick.homePitcher,
        away_pitcher: pick.awayPitcher,
        inning: pick.inning
      }));

      // Insert all picks, ignoring duplicates
      const { data, error } = await supabase
        .from('betting_picks')
        .upsert(dbPicks, {
          onConflict: 'date,home_team,away_team,recommended_bet',
          ignoreDuplicates: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving bulk picks:', error);
      return { success: false, error: 'Failed to save bulk picks' };
    }
  }

  static async getPickHistory(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('betting_picks')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform database results back to BettingPick format
      const picks = data?.map(row => ({
        id: row.id,
        date: row.date,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        recommendedBet: row.recommended_bet,
        confidence: row.confidence,
        reason: row.reason,
        odds: row.odds,
        status: row.status,
        result: row.home_score !== null && row.away_score !== null ? {
          homeScore: row.home_score,
          awayScore: row.away_score,
          scoreDifference: row.score_difference
        } : undefined,
        profit: row.profit,
        homePitcher: row.home_pitcher,
        awayPitcher: row.away_pitcher,
        inning: row.inning
      })) || [];

      return { success: true, data: picks };
    } catch (error) {
      console.error('Error getting pick history:', error);
      return { success: false, error: 'Failed to get pick history' };
    }
  }

  static async restoreWonPicks(): Promise<{ success: boolean; restored?: number; error?: string }> {
    try {
      // This function would restore previously won picks from a backup table
      // Since we don't have a backup table yet, we'll return success
      // In a real implementation, you would:
      // 1. Query backup/archive table for won picks
      // 2. Insert them back into the main table using saveBulkPicks
      
      console.log('Won picks restoration would happen here');
      return { success: true, restored: 0 };
    } catch (error) {
      console.error('Error restoring won picks:', error);
      return { success: false, error: 'Failed to restore won picks' };
    }
  }

  static async deletePick(pickId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('betting_picks')
        .delete()
        .eq('id', pickId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting pick:', error);
      return { success: false, error: 'Failed to delete pick' };
    }
  }

  static async deletePickByTeamsAndDate(
    homeTeam: string, 
    awayTeam: string, 
    date: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('betting_picks')
        .delete()
        .eq('date', date)
        .or(`and(home_team.ilike.%${homeTeam}%,away_team.ilike.%${awayTeam}%),and(home_team.ilike.%${awayTeam}%,away_team.ilike.%${homeTeam}%)`);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting pick by teams and date:', error);
      return { success: false, error: 'Failed to delete pick' };
    }
  }
}