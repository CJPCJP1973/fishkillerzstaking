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
    PostgrestVersion: "14.4"
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ocr_scan_history: {
        Row: {
          auto_flagged: boolean
          confidence: number | null
          created_at: string
          end_amount: number | null
          id: string
          scanned_by: string
          session_id: string
          start_amount: number | null
        }
        Insert: {
          auto_flagged?: boolean
          confidence?: number | null
          created_at?: string
          end_amount?: number | null
          id?: string
          scanned_by: string
          session_id: string
          start_amount?: number | null
        }
        Update: {
          auto_flagged?: boolean
          confidence?: number | null
          created_at?: string
          end_amount?: number | null
          id?: string
          scanned_by?: string
          session_id?: string
          start_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_scan_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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
          transaction_reference: string | null
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
          transaction_reference?: string | null
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
          transaction_reference?: string | null
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
          balance: number
          bio: string | null
          completed_sessions: number
          created_at: string | null
          display_name: string
          email: string | null
          fraud_flags: number
          id: string
          is_shadow_banned: boolean
          is_vip: boolean
          reliability_score: number
          seller_paid: boolean
          seller_status: string
          seller_tier: number
          total_staked: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string
          username: string
          verification_note: string | null
          verification_status: string
          verified: boolean | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          completed_sessions?: number
          created_at?: string | null
          display_name: string
          email?: string | null
          fraud_flags?: number
          id?: string
          is_shadow_banned?: boolean
          is_vip?: boolean
          reliability_score?: number
          seller_paid?: boolean
          seller_status?: string
          seller_tier?: number
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          verification_note?: string | null
          verification_status?: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          completed_sessions?: number
          created_at?: string | null
          display_name?: string
          email?: string | null
          fraud_flags?: number
          id?: string
          is_shadow_banned?: boolean
          is_vip?: boolean
          reliability_score?: number
          seller_paid?: boolean
          seller_status?: string
          seller_tier?: number
          total_staked?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verification_note?: string | null
          verification_status?: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Relationships: []
      }
      screenshot_hashes: {
        Row: {
          created_at: string
          file_hash: string
          id: string
          session_id: string
          upload_type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_hash: string
          id?: string
          session_id: string
          upload_type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_hash?: string
          id?: string
          session_id?: string
          upload_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_hashes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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
      session_journal: {
        Row: {
          author_name: string
          created_at: string
          entry_type: string
          id: string
          message: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          created_at?: string
          entry_type?: string
          id?: string
          message: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          entry_type?: string
          id?: string
          message?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_journal_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          admin_confirmed_deposit: boolean | null
          admin_released_winnings: boolean | null
          agent_cashout_window: string | null
          agent_daily_limit: string | null
          agent_room: string
          created_at: string | null
          deposit_proof_url: string | null
          end_screenshot_url: string | null
          end_time: string
          id: string
          manual_rake_status: string | null
          ocr_confidence: number | null
          ocr_end_amount: number | null
          ocr_start_amount: number | null
          payout_proof_url: string | null
          platform: string
          platform_fee: number | null
          proof_url: string | null
          seller_payout_agreement: boolean
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
          agent_cashout_window?: string | null
          agent_daily_limit?: string | null
          agent_room: string
          created_at?: string | null
          deposit_proof_url?: string | null
          end_screenshot_url?: string | null
          end_time: string
          id?: string
          manual_rake_status?: string | null
          ocr_confidence?: number | null
          ocr_end_amount?: number | null
          ocr_start_amount?: number | null
          payout_proof_url?: string | null
          platform: string
          platform_fee?: number | null
          proof_url?: string | null
          seller_payout_agreement?: boolean
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
          agent_cashout_window?: string | null
          agent_daily_limit?: string | null
          agent_room?: string
          created_at?: string | null
          deposit_proof_url?: string | null
          end_screenshot_url?: string | null
          end_time?: string
          id?: string
          manual_rake_status?: string | null
          ocr_confidence?: number | null
          ocr_end_amount?: number | null
          ocr_start_amount?: number | null
          payout_proof_url?: string | null
          platform?: string
          platform_fee?: number | null
          proof_url?: string | null
          seller_payout_agreement?: boolean
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
          backer_confirmed: boolean | null
          backer_id: string
          created_at: string | null
          deposit_confirmed: boolean | null
          id: string
          payment_method: string | null
          payment_mode: string
          rake_rate: number
          seller_confirmed: boolean | null
          session_id: string
          updated_at: string | null
          winnings_amount: number | null
          winnings_released: boolean | null
        }
        Insert: {
          amount: number
          backer_confirmed?: boolean | null
          backer_id: string
          created_at?: string | null
          deposit_confirmed?: boolean | null
          id?: string
          payment_method?: string | null
          payment_mode?: string
          rake_rate?: number
          seller_confirmed?: boolean | null
          session_id: string
          updated_at?: string | null
          winnings_amount?: number | null
          winnings_released?: boolean | null
        }
        Update: {
          amount?: number
          backer_confirmed?: boolean | null
          backer_id?: string
          created_at?: string | null
          deposit_confirmed?: boolean | null
          id?: string
          payment_method?: string | null
          payment_mode?: string
          rake_rate?: number
          seller_confirmed?: boolean | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      confirmed_agents_public: {
        Row: {
          agent_name: string | null
          created_at: string | null
          id: string | null
        }
        Insert: {
          agent_name?: string | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          agent_name?: string | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
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
          username?: string | null
          verified?: boolean | null
          win_rate?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_balance: {
        Args: { delta: number; target_uid: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_public_sessions: {
        Args: never
        Returns: {
          agent_room: string
          created_at: string
          end_time: string
          id: string
          platform: string
          share_price: number
          shooter_fraud_flags: number
          shooter_name: string
          shooter_tier: number
          stake_available: number
          stake_sold: number
          status: Database["public"]["Enums"]["session_status"]
          stream_url: string
          total_buy_in: number
        }[]
      }
      get_seller_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          completed_sessions: number
          display_name: string
          is_vip: boolean
          seller_tier: number
          total_earnings: number
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_session_backer: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      is_session_shooter: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      start_seller_trial: { Args: never; Returns: undefined }
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
