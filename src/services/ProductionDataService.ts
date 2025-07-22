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
      const { data, error } = await supabase
        .from('betting_picks')
        .upsert(pick)
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

  static async getPickHistory(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('betting_picks')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting pick history:', error);
      return { success: false, error: 'Failed to get pick history' };
    }
  }
}