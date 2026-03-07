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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      confirmed_agents: {
        Row: {
          agent_name: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      payment_profiles: {
        Row: {
          btc_address: string | null
          btc_lightning: string | null
          cashapp_tag: string | null
          chime_handle: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          venmo_username: string | null
        }
        Insert: {
          btc_address?: string | null
          btc_lightning?: string | null
          cashapp_tag?: string | null
          chime_handle?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          venmo_username?: string | null
        }
        Update: {
          btc_address?: string | null
          btc_lightning?: string | null
          cashapp_tag?: string | null
          chime_handle?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          venmo_username?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount_owed: number
          backer_cashtag: string | null
          backer_id: string
          backer_name: string | null
          created_at: string | null
          id: string
          session_id: string
          stake_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_owed?: number
          backer_cashtag?: string | null
          backer_id: string
          backer_name?: string | null
          created_at?: string | null
          id?: string
          session_id: string
          stake_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_owed?: number
          backer_cashtag?: string | null
          backer_id?: string
          backer_name?: string | null
          created_at?: string | null
          id?: string
          session_id?: string
          stake_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "stakes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          seller_status: string
          total_staked: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string
          username: string
          verified: boolean | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          seller_status?: string
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          seller_status?: string
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Relationships: []
      }
      seller_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          admin_confirmed_deposit: boolean | null
          admin_released_winnings: boolean | null
          agent_room: string
          created_at: string | null
          end_screenshot_url: string | null
          end_time: string
          id: string
          ocr_confidence: number | null
          ocr_end_amount: number | null
          ocr_start_amount: number | null
          platform: string
          platform_fee: number | null
          proof_url: string | null
          share_price: number
          shooter_id: string
          shooter_name: string
          stake_available: number
          stake_sold: number | null
          start_screenshot_url: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          stream_url: string | null
          total_buy_in: number
          updated_at: string | null
          winnings: number | null
        }
        Insert: {
          admin_confirmed_deposit?: boolean | null
          admin_released_winnings?: boolean | null
          agent_room: string
          created_at?: string | null
          end_screenshot_url?: string | null
          end_time: string
          id?: string
          ocr_confidence?: number | null
          ocr_end_amount?: number | null
          ocr_start_amount?: number | null
          platform: string
          platform_fee?: number | null
          proof_url?: string | null
          share_price?: number
          shooter_id: string
          shooter_name: string
          stake_available: number
          stake_sold?: number | null
          start_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          stream_url?: string | null
          total_buy_in: number
          updated_at?: string | null
          winnings?: number | null
        }
        Update: {
          admin_confirmed_deposit?: boolean | null
          admin_released_winnings?: boolean | null
          agent_room?: string
          created_at?: string | null
          end_screenshot_url?: string | null
          end_time?: string
          id?: string
          ocr_confidence?: number | null
          ocr_end_amount?: number | null
          ocr_start_amount?: number | null
          platform?: string
          platform_fee?: number | null
          proof_url?: string | null
          share_price?: number
          shooter_id?: string
          shooter_name?: string
          stake_available?: number
          stake_sold?: number | null
          start_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          stream_url?: string | null
          total_buy_in?: number
          updated_at?: string | null
          winnings?: number | null
        }
        Relationships: []
      }
      stakes: {
        Row: {
          amount: number
          backer_id: string
          created_at: string | null
          deposit_confirmed: boolean | null
          id: string
          payment_method: string | null
          session_id: string
          updated_at: string | null
          winnings_amount: number | null
          winnings_released: boolean | null
        }
        Insert: {
          amount: number
          backer_id: string
          created_at?: string | null
          deposit_confirmed?: boolean | null
          id?: string
          payment_method?: string | null
          session_id: string
          updated_at?: string | null
          winnings_amount?: number | null
          winnings_released?: boolean | null
        }
        Update: {
          amount?: number
          backer_id?: string
          created_at?: string | null
          deposit_confirmed?: boolean | null
          id?: string
          payment_method?: string | null
          session_id?: string
          updated_at?: string | null
          winnings_amount?: number | null
          winnings_released?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "stakes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      win_feed: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          platform: string
          session_id: string | null
          shooter_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          platform: string
          session_id?: string | null
          shooter_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          platform?: string
          session_id?: string | null
          shooter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "win_feed_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          seller_status: string | null
          total_staked: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          seller_status?: string | null
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          seller_status?: string | null
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          win_rate?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "shooter" | "backer" | "seller"
      session_status:
        | "pending"
        | "funding"
        | "live"
        | "completed"
        | "disputed"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "shooter", "backer", "seller"],
      session_status: [
        "pending",
        "funding",
        "live",
        "completed",
        "disputed",
        "cancelled",
      ],
    },
  },
} as const
