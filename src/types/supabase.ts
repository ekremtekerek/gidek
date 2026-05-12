export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          created_at: string
          expires_at: string
          hit_count: number
          id: number
          query_embedding: string
          query_hash: string
          response: Json
          user_segment: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          hit_count?: number
          id?: number
          query_embedding: string
          query_hash: string
          response: Json
          user_segment?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: number
          query_embedding?: string
          query_hash?: string
          response?: Json
          user_segment?: string | null
        }
        Relationships: []
      }
      ai_daily_budget: {
        Row: {
          circuit_open: boolean
          date: string
          total_cost_usd: number
          total_queries: number
          updated_at: string
        }
        Insert: {
          circuit_open?: boolean
          date: string
          total_cost_usd?: number
          total_queries?: number
          updated_at?: string
        }
        Update: {
          circuit_open?: boolean
          date?: string
          total_cost_usd?: number
          total_queries?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_query_logs: {
        Row: {
          cache_hit: boolean
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: number
          input_tokens: number | null
          ip_hash: string | null
          model_used: string
          output_tokens: number | null
          query_text: string
          response_deal_ids: string[]
          retrieved_deal_ids: string[]
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          input_tokens?: number | null
          ip_hash?: string | null
          model_used: string
          output_tokens?: number | null
          query_text: string
          response_deal_ids?: string[]
          retrieved_deal_ids?: string[]
          session_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          input_tokens?: number | null
          ip_hash?: string | null
          model_used?: string
          output_tokens?: number | null
          query_text?: string
          response_deal_ids?: string[]
          retrieved_deal_ids?: string[]
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          created_at: string
          currency: string
          deal_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          quantity: number
          selected_date: string | null
          selected_time: string | null
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_code?: string
          created_at?: string
          currency?: string
          deal_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          selected_date?: string | null
          selected_time?: string | null
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_code?: string
          created_at?: string
          currency?: string
          deal_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          selected_date?: string | null
          selected_time?: string | null
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_categories: {
        Row: {
          category_id: string
          deal_id: string
        }
        Insert: {
          category_id: string
          deal_id: string
        }
        Update: {
          category_id?: string
          deal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_categories_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          audience: string[]
          available_times: Json | null
          capacity: number | null
          city: string
          cover_image: string
          created_at: string
          currency: string
          description: string
          discount_percent: number | null
          discounted_price: number
          district: string | null
          duration_minutes: number | null
          embedding: string | null
          highlights: string[] | null
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          lat: number | null
          lng: number | null
          max_per_user: number
          merchant_id: string
          meta_description: string | null
          meta_title: string | null
          original_price: number
          published_at: string | null
          rating_avg: number | null
          rating_count: number
          search_text: unknown
          slug: string
          sold_count: number
          sort_priority: number
          subtitle: string | null
          tags: string[]
          terms: string | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
          venue_name: string | null
          view_count: number
        }
        Insert: {
          audience?: string[]
          available_times?: Json | null
          capacity?: number | null
          city: string
          cover_image: string
          created_at?: string
          currency?: string
          description: string
          discount_percent?: number | null
          discounted_price: number
          district?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          max_per_user?: number
          merchant_id: string
          meta_description?: string | null
          meta_title?: string | null
          original_price: number
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          search_text?: unknown
          slug: string
          sold_count?: number
          sort_priority?: number
          subtitle?: string | null
          tags?: string[]
          terms?: string | null
          title: string
          updated_at?: string
          valid_from?: string
          valid_until: string
          venue_name?: string | null
          view_count?: number
        }
        Update: {
          audience?: string[]
          available_times?: Json | null
          capacity?: number | null
          city?: string
          cover_image?: string
          created_at?: string
          currency?: string
          description?: string
          discount_percent?: number | null
          discounted_price?: number
          district?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          max_per_user?: number
          merchant_id?: string
          meta_description?: string | null
          meta_title?: string | null
          original_price?: number
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          search_text?: unknown
          slug?: string
          sold_count?: number
          sort_priority?: number
          subtitle?: string | null
          tags?: string[]
          terms?: string | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
          venue_name?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          deal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          phone: string | null
          rating_avg: number | null
          rating_count: number
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          phone?: string | null
          rating_avg?: number | null
          rating_count?: number
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          rating_avg?: number | null
          rating_count?: number
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_done: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_done?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_done?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          deal_id: string
          display_name: string
          id: string
          is_active: boolean
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          deal_id: string
          display_name: string
          id?: string
          is_active?: boolean
          rating: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string
          display_name?: string
          id?: string
          is_active?: boolean
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          name: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility: string[] | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          dietary: string[] | null
          dislikes: string[] | null
          district: string | null
          embedding: string | null
          household_type: string | null
          interests: string[] | null
          kids_age_groups: string[] | null
          language: string
          preferred_times: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          dietary?: string[] | null
          dislikes?: string[] | null
          district?: string | null
          embedding?: string | null
          household_type?: string | null
          interests?: string[] | null
          kids_age_groups?: string[] | null
          language?: string
          preferred_times?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          dietary?: string[] | null
          dislikes?: string[] | null
          district?: string | null
          embedding?: string | null
          household_type?: string | null
          interests?: string[] | null
          kids_age_groups?: string[] | null
          language?: string
          preferred_times?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          created_at: string
          currency: string
          deal_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          quantity: number
          selected_date: string | null
          selected_time: string | null
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_booking_code: { Args: never; Returns: string }
      match_deals: {
        Args: {
          filter_city?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          audience: string[]
          city: string
          cover_image: string
          description: string
          discount_percent: number
          discounted_price: number
          district: string
          duration_minutes: number
          id: string
          lat: number
          lng: number
          original_price: number
          similarity: number
          slug: string
          subtitle: string
          tags: string[]
          title: string
          venue_name: string
        }[]
      }
      refresh_deal_rating: { Args: { deal_uuid: string }; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

