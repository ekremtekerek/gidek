export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          created_at: string;
          deal_id: string;
          id: string;
          referrer: string | null;
          sub_deal_external_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          deal_id: string;
          id?: string;
          referrer?: string | null;
          sub_deal_external_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          deal_id?: string;
          id?: string;
          referrer?: string | null;
          sub_deal_external_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_clicks_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_cache: {
        Row: {
          created_at: string;
          expires_at: string;
          hit_count: number;
          id: number;
          query_embedding: string;
          query_hash: string;
          response: Json;
          user_segment: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          hit_count?: number;
          id?: number;
          query_embedding: string;
          query_hash: string;
          response: Json;
          user_segment?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          hit_count?: number;
          id?: number;
          query_embedding?: string;
          query_hash?: string;
          response?: Json;
          user_segment?: string | null;
        };
        Relationships: [];
      };
      ai_daily_budget: {
        Row: {
          circuit_open: boolean;
          date: string;
          total_cost_usd: number;
          total_queries: number;
          updated_at: string;
        };
        Insert: {
          circuit_open?: boolean;
          date: string;
          total_cost_usd?: number;
          total_queries?: number;
          updated_at?: string;
        };
        Update: {
          circuit_open?: boolean;
          date?: string;
          total_cost_usd?: number;
          total_queries?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_query_logs: {
        Row: {
          cache_hit: boolean;
          cost_usd: number | null;
          created_at: string;
          duration_ms: number | null;
          error_message: string | null;
          id: number;
          input_tokens: number | null;
          ip_hash: string | null;
          model_used: string;
          output_tokens: number | null;
          query_text: string;
          response_deal_ids: string[];
          retrieved_deal_ids: string[];
          session_id: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          cache_hit?: boolean;
          cost_usd?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: number;
          input_tokens?: number | null;
          ip_hash?: string | null;
          model_used: string;
          output_tokens?: number | null;
          query_text: string;
          response_deal_ids?: string[];
          retrieved_deal_ids?: string[];
          session_id?: string | null;
          status: string;
          user_id?: string | null;
        };
        Update: {
          cache_hit?: boolean;
          cost_usd?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: number;
          input_tokens?: number | null;
          ip_hash?: string | null;
          model_used?: string;
          output_tokens?: number | null;
          query_text?: string;
          response_deal_ids?: string[];
          retrieved_deal_ids?: string[];
          session_id?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_query_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'ai_query_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      badges: {
        Row: {
          created_at: string;
          criteria_extra: string | null;
          criteria_type: string;
          criteria_value: number;
          description: string;
          emoji: string;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          tier: string;
        };
        Insert: {
          created_at?: string;
          criteria_extra?: string | null;
          criteria_type: string;
          criteria_value?: number;
          description: string;
          emoji: string;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          tier: string;
        };
        Update: {
          created_at?: string;
          criteria_extra?: string | null;
          criteria_type?: string;
          criteria_value?: number;
          description?: string;
          emoji?: string;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          tier?: string;
        };
        Relationships: [];
      };
      booking_guests: {
        Row: {
          birth_date: string;
          booking_id: string;
          created_at: string;
          email: string | null;
          first_name: string;
          gender: string | null;
          guest_index: number;
          guest_type: string;
          id: string;
          is_lead: boolean;
          last_name: string;
          national_id: string | null;
          nationality: string;
          passport_no: string | null;
          phone: string | null;
          room_index: number | null;
          special_requests: string | null;
        };
        Insert: {
          birth_date: string;
          booking_id: string;
          created_at?: string;
          email?: string | null;
          first_name: string;
          gender?: string | null;
          guest_index: number;
          guest_type: string;
          id?: string;
          is_lead?: boolean;
          last_name: string;
          national_id?: string | null;
          nationality?: string;
          passport_no?: string | null;
          phone?: string | null;
          room_index?: number | null;
          special_requests?: string | null;
        };
        Update: {
          birth_date?: string;
          booking_id?: string;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          gender?: string | null;
          guest_index?: number;
          guest_type?: string;
          id?: string;
          is_lead?: boolean;
          last_name?: string;
          national_id?: string | null;
          nationality?: string;
          passport_no?: string | null;
          phone?: string | null;
          room_index?: number | null;
          special_requests?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_guests_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          adult_count?: number | null;
          board_basis?: string | null;
          booking_code?: string;
          cancelled_by_admin_at?: string | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          child_count?: number | null;
          coupon_code?: string | null;
          coupon_id?: string | null;
          created_at?: string;
          currency?: string;
          deal_id: string;
          discount_amount?: number;
          gift_message?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          id?: string;
          insurance_fee?: number;
          insurance_purchased?: boolean;
          is_gift?: boolean;
          nights?: number | null;
          notes?: string | null;
          quantity?: number;
          refunded_at?: string | null;
          room_type_id?: string | null;
          selected_date?: string | null;
          selected_time?: string | null;
          status?: string;
          total_amount: number;
          tourism_tax_total?: number;
          unit_price: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          adult_count?: number | null;
          board_basis?: string | null;
          booking_code?: string;
          cancelled_by_admin_at?: string | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          child_count?: number | null;
          coupon_code?: string | null;
          coupon_id?: string | null;
          created_at?: string;
          currency?: string;
          deal_id?: string;
          discount_amount?: number;
          gift_message?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          id?: string;
          insurance_fee?: number;
          insurance_purchased?: boolean;
          is_gift?: boolean;
          nights?: number | null;
          notes?: string | null;
          quantity?: number;
          refunded_at?: string | null;
          room_type_id?: string | null;
          selected_date?: string | null;
          selected_time?: string | null;
          status?: string;
          total_amount?: number;
          tourism_tax_total?: number;
          unit_price?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_coupon_id_fkey';
            columns: ['coupon_id'];
            isOneToOne: false;
            referencedRelation: 'coupons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_room_type_id_fkey';
            columns: ['room_type_id'];
            isOneToOne: false;
            referencedRelation: 'deal_room_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          id: string;
          parts: Json;
          role: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          id?: string;
          parts: Json;
          role: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          id?: string;
          parts?: Json;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean;
          max_uses: number | null;
          min_order_amount: number;
          updated_at: string;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          min_order_amount?: number;
          updated_at?: string;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          min_order_amount?: number;
          updated_at?: string;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      deal_categories: {
        Row: {
          category_id: string;
          deal_id: string;
        };
        Insert: {
          category_id: string;
          deal_id: string;
        };
        Update: {
          category_id?: string;
          deal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_categories_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_hotel_meta: {
        Row: {
          cancellation_policy: string | null;
          check_in_time: string;
          check_out_time: string;
          child_policy: string | null;
          concept: string | null;
          created_at: string;
          deal_id: string;
          distance_to_airport_km: number | null;
          distance_to_beach_m: number | null;
          distance_to_center_m: number | null;
          extra_bed_available: boolean;
          extra_bed_price: number | null;
          has_aircon: boolean;
          has_aquapark: boolean;
          has_bar: boolean;
          has_beach_access: boolean;
          has_breakfast: boolean;
          has_business_center: boolean;
          has_disabled_access: boolean;
          has_gym: boolean;
          has_hamam: boolean;
          has_indoor_pool: boolean;
          has_kids_club: boolean;
          has_kids_pool: boolean;
          has_laundry: boolean;
          has_meeting_room: boolean;
          has_parking: boolean;
          has_pool: boolean;
          has_private_beach: boolean;
          has_restaurant: boolean;
          has_room_service: boolean;
          has_sauna: boolean;
          has_spa: boolean;
          has_transfer: boolean;
          has_valet: boolean;
          has_wifi: boolean;
          pet_friendly: boolean;
          pet_policy: string | null;
          smoking_allowed: boolean;
          star_rating: number | null;
          total_rooms: number | null;
          tourism_tax_per_night: number;
          updated_at: string;
        };
        Insert: {
          cancellation_policy?: string | null;
          check_in_time?: string;
          check_out_time?: string;
          child_policy?: string | null;
          concept?: string | null;
          created_at?: string;
          deal_id: string;
          distance_to_airport_km?: number | null;
          distance_to_beach_m?: number | null;
          distance_to_center_m?: number | null;
          extra_bed_available?: boolean;
          extra_bed_price?: number | null;
          has_aircon?: boolean;
          has_aquapark?: boolean;
          has_bar?: boolean;
          has_beach_access?: boolean;
          has_breakfast?: boolean;
          has_business_center?: boolean;
          has_disabled_access?: boolean;
          has_gym?: boolean;
          has_hamam?: boolean;
          has_indoor_pool?: boolean;
          has_kids_club?: boolean;
          has_kids_pool?: boolean;
          has_laundry?: boolean;
          has_meeting_room?: boolean;
          has_parking?: boolean;
          has_pool?: boolean;
          has_private_beach?: boolean;
          has_restaurant?: boolean;
          has_room_service?: boolean;
          has_sauna?: boolean;
          has_spa?: boolean;
          has_transfer?: boolean;
          has_valet?: boolean;
          has_wifi?: boolean;
          pet_friendly?: boolean;
          pet_policy?: string | null;
          smoking_allowed?: boolean;
          star_rating?: number | null;
          total_rooms?: number | null;
          tourism_tax_per_night?: number;
          updated_at?: string;
        };
        Update: {
          cancellation_policy?: string | null;
          check_in_time?: string;
          check_out_time?: string;
          child_policy?: string | null;
          concept?: string | null;
          created_at?: string;
          deal_id?: string;
          distance_to_airport_km?: number | null;
          distance_to_beach_m?: number | null;
          distance_to_center_m?: number | null;
          extra_bed_available?: boolean;
          extra_bed_price?: number | null;
          has_aircon?: boolean;
          has_aquapark?: boolean;
          has_bar?: boolean;
          has_beach_access?: boolean;
          has_breakfast?: boolean;
          has_business_center?: boolean;
          has_disabled_access?: boolean;
          has_gym?: boolean;
          has_hamam?: boolean;
          has_indoor_pool?: boolean;
          has_kids_club?: boolean;
          has_kids_pool?: boolean;
          has_laundry?: boolean;
          has_meeting_room?: boolean;
          has_parking?: boolean;
          has_pool?: boolean;
          has_private_beach?: boolean;
          has_restaurant?: boolean;
          has_room_service?: boolean;
          has_sauna?: boolean;
          has_spa?: boolean;
          has_transfer?: boolean;
          has_valet?: boolean;
          has_wifi?: boolean;
          pet_friendly?: boolean;
          pet_policy?: string | null;
          smoking_allowed?: boolean;
          star_rating?: number | null;
          total_rooms?: number | null;
          tourism_tax_per_night?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_hotel_meta_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: true;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_room_types: {
        Row: {
          base_price_per_night: number;
          bed_setup: string | null;
          board_basis: string;
          capacity_adults: number;
          capacity_children: number;
          cover_image: string | null;
          created_at: string;
          deal_id: string;
          description: string | null;
          has_balcony: boolean;
          has_jacuzzi: boolean;
          has_kitchenette: boolean;
          has_minibar: boolean;
          has_safe: boolean;
          has_tv: boolean;
          id: string;
          images: string[];
          is_active: boolean;
          name: string;
          size_sqm: number | null;
          sort_order: number;
          total_units: number | null;
          updated_at: string;
          view_type: string | null;
        };
        Insert: {
          base_price_per_night: number;
          bed_setup?: string | null;
          board_basis?: string;
          capacity_adults?: number;
          capacity_children?: number;
          cover_image?: string | null;
          created_at?: string;
          deal_id: string;
          description?: string | null;
          has_balcony?: boolean;
          has_jacuzzi?: boolean;
          has_kitchenette?: boolean;
          has_minibar?: boolean;
          has_safe?: boolean;
          has_tv?: boolean;
          id?: string;
          images?: string[];
          is_active?: boolean;
          name: string;
          size_sqm?: number | null;
          sort_order?: number;
          total_units?: number | null;
          updated_at?: string;
          view_type?: string | null;
        };
        Update: {
          base_price_per_night?: number;
          bed_setup?: string | null;
          board_basis?: string;
          capacity_adults?: number;
          capacity_children?: number;
          cover_image?: string | null;
          created_at?: string;
          deal_id?: string;
          description?: string | null;
          has_balcony?: boolean;
          has_jacuzzi?: boolean;
          has_kitchenette?: boolean;
          has_minibar?: boolean;
          has_safe?: boolean;
          has_tv?: boolean;
          id?: string;
          images?: string[];
          is_active?: boolean;
          name?: string;
          size_sqm?: number | null;
          sort_order?: number;
          total_units?: number | null;
          updated_at?: string;
          view_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_room_types_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
        ];
      };
      deals: {
        Row: {
          affiliate_options: Json | null;
          audience: string[];
          available_times: Json | null;
          capacity: number | null;
          city: string;
          cover_image: string;
          created_at: string;
          currency: string;
          description: string;
          description_ai: boolean;
          discount_percent: number | null;
          discounted_price: number;
          district: string | null;
          duration_minutes: number | null;
          embedding: string | null;
          external_id: string | null;
          external_tags: string[];
          external_url: string | null;
          highlights: string[] | null;
          id: string;
          images: string[];
          is_active: boolean;
          is_featured: boolean;
          lat: number | null;
          lng: number | null;
          max_per_user: number;
          merchant_id: string;
          meta_description: string | null;
          meta_title: string | null;
          original_price: number;
          published_at: string | null;
          rating_avg: number | null;
          rating_count: number;
          search_text: unknown;
          slug: string;
          sold_count: number;
          sort_priority: number;
          source: string;
          subtitle: string | null;
          tags: string[];
          terms: string | null;
          title: string;
          updated_at: string;
          valid_from: string;
          valid_until: string;
          venue_name: string | null;
          view_count: number;
        };
        Insert: {
          affiliate_options?: Json | null;
          audience?: string[];
          available_times?: Json | null;
          capacity?: number | null;
          city: string;
          cover_image: string;
          created_at?: string;
          currency?: string;
          description: string;
          description_ai?: boolean;
          discount_percent?: number | null;
          discounted_price: number;
          district?: string | null;
          duration_minutes?: number | null;
          embedding?: string | null;
          external_id?: string | null;
          external_tags?: string[];
          external_url?: string | null;
          highlights?: string[] | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          lat?: number | null;
          lng?: number | null;
          max_per_user?: number;
          merchant_id: string;
          meta_description?: string | null;
          meta_title?: string | null;
          original_price: number;
          published_at?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          search_text?: unknown;
          slug: string;
          sold_count?: number;
          sort_priority?: number;
          source?: string;
          subtitle?: string | null;
          tags?: string[];
          terms?: string | null;
          title: string;
          updated_at?: string;
          valid_from?: string;
          valid_until: string;
          venue_name?: string | null;
          view_count?: number;
        };
        Update: {
          affiliate_options?: Json | null;
          audience?: string[];
          available_times?: Json | null;
          capacity?: number | null;
          city?: string;
          cover_image?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          description_ai?: boolean;
          discount_percent?: number | null;
          discounted_price?: number;
          district?: string | null;
          duration_minutes?: number | null;
          embedding?: string | null;
          external_id?: string | null;
          external_tags?: string[];
          external_url?: string | null;
          highlights?: string[] | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          lat?: number | null;
          lng?: number | null;
          max_per_user?: number;
          merchant_id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          original_price?: number;
          published_at?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          search_text?: unknown;
          slug?: string;
          sold_count?: number;
          sort_priority?: number;
          source?: string;
          subtitle?: string | null;
          tags?: string[];
          terms?: string | null;
          title?: string;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string;
          venue_name?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'deals_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
        ];
      };
      event_messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          room_key: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          room_key: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          room_key?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'event_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          deal_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deal_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deal_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'follows_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      merchants: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          description: string | null;
          district: string | null;
          email: string | null;
          external_id: string | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          lat: number | null;
          lng: number | null;
          logo_url: string | null;
          name: string;
          phone: string | null;
          rating_avg: number | null;
          rating_count: number;
          slug: string;
          source: string;
          updated_at: string;
          website: string | null;
          working_hours: Json | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          district?: string | null;
          email?: string | null;
          external_id?: string | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          lat?: number | null;
          lng?: number | null;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          slug: string;
          source?: string;
          updated_at?: string;
          website?: string | null;
          working_hours?: Json | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          district?: string | null;
          email?: string | null;
          external_id?: string | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          lat?: number | null;
          lng?: number | null;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          slug?: string;
          source?: string;
          updated_at?: string;
          website?: string | null;
          working_hours?: Json | null;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null;
          email: string;
          id: number;
          source: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          confirmed_at?: string | null;
          email: string;
          id?: number;
          source?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          email?: string;
          id?: number;
          source?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_public: boolean;
          loyalty_points: number;
          merchant_id: string | null;
          onboarding_done: boolean;
          phone: string | null;
          public_slug: string | null;
          share_attendance: boolean;
          streak_last_week: string | null;
          streak_weeks: number;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_public?: boolean;
          loyalty_points?: number;
          merchant_id?: string | null;
          onboarding_done?: boolean;
          phone?: string | null;
          public_slug?: string | null;
          share_attendance?: boolean;
          streak_last_week?: string | null;
          streak_weeks?: number;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_public?: boolean;
          loyalty_points?: number;
          merchant_id?: string | null;
          onboarding_done?: boolean;
          phone?: string | null;
          public_slug?: string | null;
          share_attendance?: boolean;
          streak_last_week?: string | null;
          streak_weeks?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth_secret: string;
          created_at: string;
          endpoint: string;
          id: number;
          last_used_at: string | null;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth_secret: string;
          created_at?: string;
          endpoint: string;
          id?: number;
          last_used_at?: string | null;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth_secret?: string;
          created_at?: string;
          endpoint?: string;
          id?: number;
          last_used_at?: string | null;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      referral_claims: {
        Row: {
          claimed_at: string;
          code: string;
          id: number;
          redeemer_id: string;
        };
        Insert: {
          claimed_at?: string;
          code: string;
          id?: number;
          redeemer_id: string;
        };
        Update: {
          claimed_at?: string;
          code?: string;
          id?: number;
          redeemer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_claims_code_fkey';
            columns: ['code'];
            isOneToOne: false;
            referencedRelation: 'referrals';
            referencedColumns: ['code'];
          },
        ];
      };
      referrals: {
        Row: {
          code: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      review_photos: {
        Row: {
          created_at: string;
          id: string;
          review_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          review_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          review_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_photos_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      review_replies: {
        Row: {
          body: string;
          created_at: string;
          display_name: string;
          id: string;
          is_active: boolean;
          is_merchant_reply: boolean;
          review_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          display_name: string;
          id?: string;
          is_active?: boolean;
          is_merchant_reply?: boolean;
          review_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          is_merchant_reply?: boolean;
          review_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'review_replies_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      review_summaries: {
        Row: {
          caution_notes: string[];
          deal_id: string;
          generated_at: string;
          positive_themes: string[];
          rating_avg_at_gen: number | null;
          review_count_at_gen: number;
          summary: string;
        };
        Insert: {
          caution_notes?: string[];
          deal_id: string;
          generated_at?: string;
          positive_themes?: string[];
          rating_avg_at_gen?: number | null;
          review_count_at_gen: number;
          summary: string;
        };
        Update: {
          caution_notes?: string[];
          deal_id?: string;
          generated_at?: string;
          positive_themes?: string[];
          rating_avg_at_gen?: number | null;
          review_count_at_gen?: number;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_summaries_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: true;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          body: string;
          created_at: string;
          deal_id: string;
          display_name: string;
          id: string;
          is_active: boolean;
          rating: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          deal_id: string;
          display_name: string;
          id?: string;
          is_active?: boolean;
          rating: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          deal_id?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          rating?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_searches: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          query: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          query: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          query?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_city_bingos: {
        Row: {
          city: string;
          claimed_at: string;
          coupon_code: string;
          district_count: number;
          user_id: string;
        };
        Insert: {
          city: string;
          claimed_at?: string;
          coupon_code: string;
          district_count: number;
          user_id: string;
        };
        Update: {
          city?: string;
          claimed_at?: string;
          coupon_code?: string;
          district_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_city_bingos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_city_bingos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_daily_spins: {
        Row: {
          coupon_code: string | null;
          coupon_value: number | null;
          label: string;
          points: number | null;
          prize_kind: string;
          spin_date: string;
          spun_at: string;
          user_id: string;
        };
        Insert: {
          coupon_code?: string | null;
          coupon_value?: number | null;
          label: string;
          points?: number | null;
          prize_kind: string;
          spin_date?: string;
          spun_at?: string;
          user_id: string;
        };
        Update: {
          coupon_code?: string | null;
          coupon_value?: number | null;
          label?: string;
          points?: number | null;
          prize_kind?: string;
          spin_date?: string;
          spun_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_daily_spins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_daily_spins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_loyalty_rewards: {
        Row: {
          coupon_code: string;
          granted_at: string;
          threshold: number;
          user_id: string;
        };
        Insert: {
          coupon_code: string;
          granted_at?: string;
          threshold: number;
          user_id: string;
        };
        Update: {
          coupon_code?: string;
          granted_at?: string;
          threshold?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_loyalty_rewards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_loyalty_rewards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          accessibility: string[] | null;
          budget_max: number | null;
          budget_min: number | null;
          city: string | null;
          dietary: string[] | null;
          dislikes: string[] | null;
          district: string | null;
          embedding: string | null;
          has_car: boolean | null;
          has_pet: boolean | null;
          household_type: string | null;
          interests: string[] | null;
          kids_age_groups: string[] | null;
          language: string;
          preferred_times: Json | null;
          time_preference: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accessibility?: string[] | null;
          budget_max?: number | null;
          budget_min?: number | null;
          city?: string | null;
          dietary?: string[] | null;
          dislikes?: string[] | null;
          district?: string | null;
          embedding?: string | null;
          has_car?: boolean | null;
          has_pet?: boolean | null;
          household_type?: string | null;
          interests?: string[] | null;
          kids_age_groups?: string[] | null;
          language?: string;
          preferred_times?: Json | null;
          time_preference?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accessibility?: string[] | null;
          budget_max?: number | null;
          budget_min?: number | null;
          city?: string | null;
          dietary?: string[] | null;
          dislikes?: string[] | null;
          district?: string | null;
          embedding?: string | null;
          has_car?: boolean | null;
          has_pet?: boolean | null;
          household_type?: string | null;
          interests?: string[] | null;
          kids_age_groups?: string[] | null;
          language?: string;
          preferred_times?: Json | null;
          time_preference?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_refund_coupons: {
        Row: {
          booking_id: string;
          coupon_code: string;
          created_at: string;
          refund_value: number;
          user_id: string;
        };
        Insert: {
          booking_id: string;
          coupon_code: string;
          created_at?: string;
          refund_value: number;
          user_id: string;
        };
        Update: {
          booking_id?: string;
          coupon_code?: string;
          created_at?: string;
          refund_value?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_refund_coupons_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_refund_coupons_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_follow_counts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_refund_coupons_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      profile_follow_counts: {
        Row: {
          followers_count: number | null;
          following_count: number | null;
          user_id: string | null;
        };
        Insert: {
          followers_count?: never;
          following_count?: never;
          user_id?: string | null;
        };
        Update: {
          followers_count?: never;
          following_count?: never;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      apply_coupon_to_booking: {
        Args: { p_booking_id: string; p_code: string };
        Returns: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      attendees_for_booking: {
        Args: { p_booking_code: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          public_slug: string;
          quantity: number;
          user_id: string;
        }[];
      };
      bingo_progress_for_user: {
        Args: { p_user_id: string };
        Returns: {
          city: string;
          claimed: boolean;
          coupon_code: string;
          district_count: number;
          districts: string[];
        }[];
      };
      build_event_room_key: {
        Args: { p_date: string; p_deal_id: string; p_time: string };
        Returns: string;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      claim_city_bingo: {
        Args: { p_city: string; p_user_id: string };
        Returns: string;
      };
      confirm_booking_payment: {
        Args: { p_booking_id: string };
        Returns: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      deal_trending_score: {
        Args: {
          published_at_in: string;
          sold_count_in: number;
          view_count_in: number;
        };
        Returns: number;
      };
      evaluate_loyalty_rewards: {
        Args: { p_user_id: string };
        Returns: string[];
      };
      extend_booking: {
        Args: { p_booking_id: string };
        Returns: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      gen_referral_code: { Args: never; Returns: string };
      generate_booking_code: { Args: never; Returns: string };
      match_ai_cache: {
        Args: { query_embedding: string; threshold?: number };
        Returns: {
          created_at: string;
          hit_count: number;
          id: number;
          response: Json;
          similarity: number;
        }[];
      };
      match_deals: {
        Args: {
          filter_city?: string;
          match_count?: number;
          near_lat?: number;
          near_lng?: number;
          query_embedding: string;
        };
        Returns: {
          audience: string[];
          city: string;
          cover_image: string;
          description: string;
          discount_percent: number;
          discounted_price: number;
          distance_km: number;
          district: string;
          duration_minutes: number;
          id: string;
          lat: number;
          lng: number;
          original_price: number;
          similarity: number;
          slug: string;
          subtitle: string;
          tags: string[];
          title: string;
          venue_name: string;
        }[];
      };
      refresh_deal_rating: { Args: { deal_uuid: string }; Returns: undefined };
      remove_coupon_from_booking: {
        Args: { p_booking_id: string };
        Returns: {
          admin_notes: string | null;
          adult_count: number | null;
          board_basis: string | null;
          booking_code: string;
          cancelled_by_admin_at: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          child_count: number | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          currency: string;
          deal_id: string;
          discount_amount: number;
          gift_message: string | null;
          guest_email: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          id: string;
          insurance_fee: number;
          insurance_purchased: boolean;
          is_gift: boolean;
          nights: number | null;
          notes: string | null;
          quantity: number;
          refunded_at: string | null;
          room_type_id: string | null;
          selected_date: string | null;
          selected_time: string | null;
          status: string;
          total_amount: number;
          tourism_tax_total: number;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'bookings';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      spin_daily: {
        Args: { p_user_id: string };
        Returns: {
          coupon_code: string;
          coupon_value: number;
          label: string;
          points: number;
          prize_kind: string;
        }[];
      };
      user_can_access_event_room: {
        Args: { p_room_key: string };
        Returns: boolean;
      };
      validate_coupon: {
        Args: { p_amount: number; p_code: string };
        Returns: {
          coupon_id: string;
          discount_amount: number;
          reason: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
