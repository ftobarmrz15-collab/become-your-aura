export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type_id: string
          attribute_deltas: Json
          completed_at: string
          duration_minutes: number
          id: string
          note: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_type_id: string
          attribute_deltas?: Json
          completed_at?: string
          duration_minutes?: number
          id?: string
          note?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_type_id?: string
          attribute_deltas?: Json
          completed_at?: string
          duration_minutes?: number
          id?: string
          note?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_types: {
        Row: {
          attribute_boosts: Json
          category: string
          emoji: string
          id: string
          is_custom: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          attribute_boosts?: Json
          category: string
          emoji: string
          id?: string
          is_custom?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          attribute_boosts?: Json
          category?: string
          emoji?: string
          id?: string
          is_custom?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      avatar_state: {
        Row: {
          charisma: number
          courage: number
          creativity: number
          discipline: number
          dominant_attribute: string | null
          flow: number
          focus: number
          freedom: number
          id: string
          level: number
          strength: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          charisma?: number
          courage?: number
          creativity?: number
          discipline?: number
          dominant_attribute?: string | null
          flow?: number
          focus?: number
          freedom?: number
          id?: string
          level?: number
          strength?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          charisma?: number
          courage?: number
          creativity?: number
          discipline?: number
          dominant_attribute?: string | null
          flow?: number
          focus?: number
          freedom?: number
          id?: string
          level?: number
          strength?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          max_streak: number
          shield_available: boolean | null
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          max_streak?: number
          shield_available?: boolean | null
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          max_streak?: number
          shield_available?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          is_highlight: boolean | null
          media_type: string
          storage_path: string
          thumbnail_path: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          is_highlight?: boolean | null
          media_type: string
          storage_path: string
          thumbnail_path?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          is_highlight?: boolean | null
          media_type?: string
          storage_path?: string
          thumbnail_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          activity_type_id: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type_id: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          monthly_goal: number | null
          onboarded: boolean | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          monthly_goal?: number | null
          onboarded?: boolean | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          monthly_goal?: number | null
          onboarded?: boolean | null
          user_id?: string
          username?: string
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
