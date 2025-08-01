export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      betting_picks: {
        Row: {
          away_pitcher: string | null
          away_score: number | null
          away_team: string
          confidence: number
          created_at: string
          date: string
          home_pitcher: string | null
          home_score: number | null
          home_team: string
          id: string
          inning: string | null
          odds: number
          profit: number | null
          reason: string
          recommended_bet: string
          score_difference: number | null
          status: string
          updated_at: string
        }
        Insert: {
          away_pitcher?: string | null
          away_score?: number | null
          away_team: string
          confidence: number
          created_at?: string
          date: string
          home_pitcher?: string | null
          home_score?: number | null
          home_team: string
          id: string
          inning?: string | null
          odds: number
          profit?: number | null
          reason: string
          recommended_bet: string
          score_difference?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          away_pitcher?: string | null
          away_score?: number | null
          away_team?: string
          confidence?: number
          created_at?: string
          date?: string
          home_pitcher?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          inning?: string | null
          odds?: number
          profit?: number | null
          reason?: string
          recommended_bet?: string
          score_difference?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      btts_analysis: {
        Row: {
          average_confidence: number
          championship_gameweek: number
          created_at: string
          id: string
          last_updated: string
          premier_league_gameweek: number
          total_picks: number
        }
        Insert: {
          average_confidence?: number
          championship_gameweek: number
          created_at?: string
          id?: string
          last_updated?: string
          premier_league_gameweek: number
          total_picks?: number
        }
        Update: {
          average_confidence?: number
          championship_gameweek?: number
          created_at?: string
          id?: string
          last_updated?: string
          premier_league_gameweek?: number
          total_picks?: number
        }
        Relationships: []
      }
      btts_picks: {
        Row: {
          away_team: string
          away_team_rate: number
          confidence: number
          created_at: string
          gameweek: number
          home_team: string
          home_team_rate: number
          id: string
          kickoff_time: string
          league: string
          match_date: string
          probability: number
          updated_at: string
        }
        Insert: {
          away_team: string
          away_team_rate: number
          confidence: number
          created_at?: string
          gameweek: number
          home_team: string
          home_team_rate: number
          id?: string
          kickoff_time: string
          league: string
          match_date: string
          probability: number
          updated_at?: string
        }
        Update: {
          away_team?: string
          away_team_rate?: number
          confidence?: number
          created_at?: string
          gameweek?: number
          home_team?: string
          home_team_rate?: number
          id?: string
          kickoff_time?: string
          league?: string
          match_date?: string
          probability?: number
          updated_at?: string
        }
        Relationships: []
      }
      golf_leaderboard: {
        Row: {
          created_at: string
          current_round: number | null
          id: string
          is_top_10: boolean | null
          last_updated: string
          made_cut: boolean | null
          player_name: string
          position: number | null
          round_1_score: number | null
          round_2_score: number | null
          round_3_score: number | null
          round_4_score: number | null
          status: string | null
          thru: string | null
          total_score: number | null
          tournament_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_round?: number | null
          id?: string
          is_top_10?: boolean | null
          last_updated?: string
          made_cut?: boolean | null
          player_name: string
          position?: number | null
          round_1_score?: number | null
          round_2_score?: number | null
          round_3_score?: number | null
          round_4_score?: number | null
          status?: string | null
          thru?: string | null
          total_score?: number | null
          tournament_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_round?: number | null
          id?: string
          is_top_10?: boolean | null
          last_updated?: string
          made_cut?: boolean | null
          player_name?: string
          position?: number | null
          round_1_score?: number | null
          round_2_score?: number | null
          round_3_score?: number | null
          round_4_score?: number | null
          status?: string | null
          thru?: string | null
          total_score?: number | null
          tournament_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_btts_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          league: string
          recency_weighted_rate: number
          team_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          league: string
          recency_weighted_rate: number
          team_name: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          league?: string
          recency_weighted_rate?: number
          team_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
