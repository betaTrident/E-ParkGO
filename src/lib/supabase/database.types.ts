export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          correlation_id: string
          created_at: string
          id: number
          parking_location_id: string
          reason: string | null
          request_metadata: Json
          result: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          correlation_id: string
          created_at?: string
          id?: never
          parking_location_id: string
          reason?: string | null
          request_metadata?: Json
          result: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          correlation_id?: string
          created_at?: string
          id?: never
          parking_location_id?: string
          reason?: string | null
          request_metadata?: Json
          result?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_location_fk"
            columns: ["actor_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "audit_logs_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          name: string
          parking_location_id: string
          public_identifier: string
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name: string
          parking_location_id: string
          public_identifier: string
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name?: string
          parking_location_id?: string
          public_identifier?: string
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          actor_id: string
          created_at: string
          expires_at: string
          id: string
          key: string
          locked_until: string | null
          operation: string
          parking_location_id: string
          request_hash: string
          resource_id: string | null
          response_json: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          expires_at: string
          id?: string
          key: string
          locked_until?: string | null
          operation: string
          parking_location_id: string
          request_hash: string
          resource_id?: string | null
          response_json?: Json | null
          status: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          locked_until?: string | null
          operation?: string
          parking_location_id?: string
          request_hash?: string
          resource_id?: string | null
          response_json?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_actor_location_fk"
            columns: ["actor_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "idempotency_keys_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_locations: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          receipt_prefix: string
          settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          receipt_prefix: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          receipt_prefix?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      parking_rate_snapshots: {
        Row: {
          created_at: string
          daily_max_centavos: number | null
          flat_fee_centavos: number | null
          grace_minutes: number
          id: string
          initial_fee_centavos: number | null
          initial_minutes: number | null
          lost_ticket_penalty_centavos: number
          mode: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos: number
          parking_location_id: string
          parking_rate_id: string
          parking_session_id: string
          rate_version: number
          snapshot_hash: string
          snapshot_json: Json
          succeeding_fee_centavos: number | null
          succeeding_interval_minutes: number | null
        }
        Insert: {
          created_at?: string
          daily_max_centavos?: number | null
          flat_fee_centavos?: number | null
          grace_minutes: number
          id?: string
          initial_fee_centavos?: number | null
          initial_minutes?: number | null
          lost_ticket_penalty_centavos: number
          mode: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos: number
          parking_location_id: string
          parking_rate_id: string
          parking_session_id: string
          rate_version: number
          snapshot_hash: string
          snapshot_json: Json
          succeeding_fee_centavos?: number | null
          succeeding_interval_minutes?: number | null
        }
        Update: {
          created_at?: string
          daily_max_centavos?: number | null
          flat_fee_centavos?: number | null
          grace_minutes?: number
          id?: string
          initial_fee_centavos?: number | null
          initial_minutes?: number | null
          lost_ticket_penalty_centavos?: number
          mode?: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos?: number
          parking_location_id?: string
          parking_rate_id?: string
          parking_session_id?: string
          rate_version?: number
          snapshot_hash?: string
          snapshot_json?: Json
          succeeding_fee_centavos?: number | null
          succeeding_interval_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_rate_snapshots_rate_fk"
            columns: ["parking_rate_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_rates"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_rate_snapshots_session_fk"
            columns: ["parking_session_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_sessions"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      parking_rates: {
        Row: {
          created_at: string
          created_by: string
          daily_max_centavos: number | null
          effective_from: string
          effective_to: string | null
          flat_fee_centavos: number | null
          grace_minutes: number
          id: string
          initial_fee_centavos: number | null
          initial_minutes: number | null
          is_published: boolean
          lost_ticket_penalty_centavos: number
          mode: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos: number
          parking_location_id: string
          succeeding_fee_centavos: number | null
          succeeding_interval_minutes: number | null
          updated_at: string
          vehicle_type_id: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          daily_max_centavos?: number | null
          effective_from: string
          effective_to?: string | null
          flat_fee_centavos?: number | null
          grace_minutes?: number
          id?: string
          initial_fee_centavos?: number | null
          initial_minutes?: number | null
          is_published?: boolean
          lost_ticket_penalty_centavos?: number
          mode: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos?: number
          parking_location_id: string
          succeeding_fee_centavos?: number | null
          succeeding_interval_minutes?: number | null
          updated_at?: string
          vehicle_type_id?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          daily_max_centavos?: number | null
          effective_from?: string
          effective_to?: string | null
          flat_fee_centavos?: number | null
          grace_minutes?: number
          id?: string
          initial_fee_centavos?: number | null
          initial_minutes?: number | null
          is_published?: boolean
          lost_ticket_penalty_centavos?: number
          mode?: Database["public"]["Enums"]["rate_mode"]
          overnight_fee_centavos?: number
          parking_location_id?: string
          succeeding_fee_centavos?: number | null
          succeeding_interval_minutes?: number | null
          updated_at?: string
          vehicle_type_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "parking_rates_created_by_fk"
            columns: ["created_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_rates_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_rates_vehicle_type_fk"
            columns: ["vehicle_type_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      parking_sessions: {
        Row: {
          adjustment_centavos: number | null
          created_at: string
          discount_centavos: number | null
          entry_processed_by: string
          entry_time: string
          exit_processed_by: string | null
          exit_time: string | null
          fee_calculated_at: string | null
          id: string
          override_approved_by: string | null
          parking_location_id: string
          parking_space_id: string
          payment_processed_by: string | null
          payment_status: Database["public"]["Enums"]["session_payment_status"]
          penalty_centavos: number | null
          quote_expires_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          subtotal_centavos: number | null
          total_centavos: number | null
          total_minutes: number | null
          updated_at: string
          vehicle_id: string
          version: number
        }
        Insert: {
          adjustment_centavos?: number | null
          created_at?: string
          discount_centavos?: number | null
          entry_processed_by: string
          entry_time?: string
          exit_processed_by?: string | null
          exit_time?: string | null
          fee_calculated_at?: string | null
          id?: string
          override_approved_by?: string | null
          parking_location_id: string
          parking_space_id: string
          payment_processed_by?: string | null
          payment_status?: Database["public"]["Enums"]["session_payment_status"]
          penalty_centavos?: number | null
          quote_expires_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          subtotal_centavos?: number | null
          total_centavos?: number | null
          total_minutes?: number | null
          updated_at?: string
          vehicle_id: string
          version?: number
        }
        Update: {
          adjustment_centavos?: number | null
          created_at?: string
          discount_centavos?: number | null
          entry_processed_by?: string
          entry_time?: string
          exit_processed_by?: string | null
          exit_time?: string | null
          fee_calculated_at?: string | null
          id?: string
          override_approved_by?: string | null
          parking_location_id?: string
          parking_space_id?: string
          payment_processed_by?: string | null
          payment_status?: Database["public"]["Enums"]["session_payment_status"]
          penalty_centavos?: number | null
          quote_expires_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          subtotal_centavos?: number | null
          total_centavos?: number | null
          total_minutes?: number | null
          updated_at?: string
          vehicle_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "parking_sessions_entry_processed_by_fk"
            columns: ["entry_processed_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_sessions_exit_processed_by_fk"
            columns: ["exit_processed_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_sessions_override_approved_by_fk"
            columns: ["override_approved_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_sessions_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_sessions_payment_processed_by_fk"
            columns: ["payment_processed_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_sessions_space_fk"
            columns: ["parking_space_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_spaces"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_sessions_vehicle_fk"
            columns: ["vehicle_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      parking_spaces: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          parking_location_id: string
          status: Database["public"]["Enums"]["space_status"]
          updated_at: string
          vehicle_type_id: string | null
          version: number
          zone_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          parking_location_id: string
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          vehicle_type_id?: string | null
          version?: number
          zone_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parking_location_id?: string
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          vehicle_type_id?: string | null
          version?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_spaces_vehicle_type_fk"
            columns: ["vehicle_type_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_spaces_zone_fk"
            columns: ["zone_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_zones"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      parking_tickets: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          last_reprinted_at: string | null
          parking_location_id: string
          parking_session_id: string
          qr_token_hash: string
          reissue_of_ticket_id: string | null
          reprint_count: number
          revoked_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          last_reprinted_at?: string | null
          parking_location_id: string
          parking_session_id: string
          qr_token_hash: string
          reissue_of_ticket_id?: string | null
          reprint_count?: number
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          last_reprinted_at?: string | null
          parking_location_id?: string
          parking_session_id?: string
          qr_token_hash?: string
          reissue_of_ticket_id?: string | null
          reprint_count?: number
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_tickets_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_tickets_reissue_fk"
            columns: ["reissue_of_ticket_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_tickets"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "parking_tickets_session_fk"
            columns: ["parking_session_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_sessions"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      parking_zones: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parking_location_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parking_location_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parking_location_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_zones_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_centavos: number
          cash_tendered_centavos: number | null
          change_centavos: number | null
          created_at: string
          external_reference: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          parking_location_id: string
          parking_session_id: string
          processed_at: string
          processed_by: string
          reason: string | null
          receipt_number: string
          reverses_payment_id: string | null
          staff_shift_id: string | null
        }
        Insert: {
          amount_centavos: number
          cash_tendered_centavos?: number | null
          change_centavos?: number | null
          created_at?: string
          external_reference?: string | null
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          parking_location_id: string
          parking_session_id: string
          processed_at?: string
          processed_by: string
          reason?: string | null
          receipt_number: string
          reverses_payment_id?: string | null
          staff_shift_id?: string | null
        }
        Update: {
          amount_centavos?: number
          cash_tendered_centavos?: number | null
          change_centavos?: number | null
          created_at?: string
          external_reference?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          parking_location_id?: string
          parking_session_id?: string
          processed_at?: string
          processed_by?: string
          reason?: string | null
          receipt_number?: string
          reverses_payment_id?: string | null
          staff_shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_processed_by_fk"
            columns: ["processed_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "payments_reversal_fk"
            columns: ["reverses_payment_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "payments_reverses_payment_id_fkey"
            columns: ["reverses_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_session_fk"
            columns: ["parking_session_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_sessions"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "payments_shift_fk"
            columns: ["staff_shift_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          disabled_at: string | null
          full_name: string
          id: string
          is_active: boolean
          parking_location_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          full_name: string
          id: string
          is_active?: boolean
          parking_location_id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          parking_location_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          actor_id: string
          blocked_until: string | null
          bucket_start: string
          id: string
          operation: string
          parking_location_id: string
          request_count: number
          updated_at: string
        }
        Insert: {
          actor_id: string
          blocked_until?: string | null
          bucket_start: string
          id?: string
          operation: string
          parking_location_id: string
          request_count?: number
          updated_at?: string
        }
        Update: {
          actor_id?: string
          blocked_until?: string | null
          bucket_start?: string
          id?: string
          operation?: string
          parking_location_id?: string
          request_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_buckets_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_buckets_actor_location_fk"
            columns: ["actor_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "rate_limit_buckets_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          artifact_path: string | null
          content_hash: string
          generated_at: string
          generated_by: string
          id: string
          parking_location_id: string
          payment_id: string
          version: number
        }
        Insert: {
          artifact_path?: string | null
          content_hash: string
          generated_at?: string
          generated_by: string
          id?: string
          parking_location_id: string
          payment_id: string
          version?: number
        }
        Update: {
          artifact_path?: string | null
          content_hash?: string
          generated_at?: string
          generated_by?: string
          id?: string
          parking_location_id?: string
          payment_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_generated_by_fk"
            columns: ["generated_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "receipts_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_fk"
            columns: ["payment_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      session_corrections: {
        Row: {
          after_data: Json
          approved_by: string | null
          before_data: Json
          correction_type: string
          correlation_id: string
          created_at: string
          id: string
          parking_location_id: string
          parking_session_id: string
          reason: string
          requested_by: string
        }
        Insert: {
          after_data: Json
          approved_by?: string | null
          before_data: Json
          correction_type: string
          correlation_id: string
          created_at?: string
          id?: string
          parking_location_id: string
          parking_session_id: string
          reason: string
          requested_by: string
        }
        Update: {
          after_data?: Json
          approved_by?: string | null
          before_data?: Json
          correction_type?: string
          correlation_id?: string
          created_at?: string
          id?: string
          parking_location_id?: string
          parking_session_id?: string
          reason?: string
          requested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_corrections_approved_by_location_fk"
            columns: ["approved_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "session_corrections_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_corrections_requested_by_location_fk"
            columns: ["requested_by", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "session_corrections_session_fk"
            columns: ["parking_session_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_sessions"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          can_approve_overrides: boolean
          can_cancel_sessions: boolean
          can_correct_session_times: boolean
          can_process_lost_tickets: boolean
          can_void_payments: boolean
          created_at: string
          profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          can_approve_overrides?: boolean
          can_cancel_sessions?: boolean
          can_correct_session_times?: boolean
          can_process_lost_tickets?: boolean
          can_void_payments?: boolean
          created_at?: string
          profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          can_approve_overrides?: boolean
          can_cancel_sessions?: boolean
          can_correct_session_times?: boolean
          can_process_lost_tickets?: boolean
          can_void_payments?: boolean
          created_at?: string
          profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          closed_at: string | null
          created_at: string
          declared_cash_centavos: number | null
          device_id: string | null
          expected_cash_centavos: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_float_centavos: number
          parking_location_id: string
          profile_id: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          variance_centavos: number | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          declared_cash_centavos?: number | null
          device_id?: string | null
          expected_cash_centavos?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float_centavos?: number
          parking_location_id: string
          profile_id: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          variance_centavos?: number | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          declared_cash_centavos?: number | null
          device_id?: string | null
          expected_cash_centavos?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float_centavos?: number
          parking_location_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          variance_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_device_fk"
            columns: ["device_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "staff_shifts_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_profile_fk"
            columns: ["profile_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "parking_location_id"]
          },
          {
            foreignKeyName: "staff_shifts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parking_location_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parking_location_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parking_location_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_types_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          display_plate_number: string
          id: string
          normalized_plate_number: string
          parking_location_id: string
          updated_at: string
          vehicle_type_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_plate_number: string
          id?: string
          normalized_plate_number: string
          parking_location_id: string
          updated_at?: string
          vehicle_type_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_plate_number?: string
          id?: string
          normalized_plate_number?: string
          parking_location_id?: string
          updated_at?: string
          vehicle_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_parking_location_id_fkey"
            columns: ["parking_location_id"]
            isOneToOne: false
            referencedRelation: "parking_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_fk"
            columns: ["vehicle_type_id", "parking_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id", "parking_location_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_parking_space: {
        Args: {
          p_code: string
          p_correlation_id: string
          p_vehicle_type_id: string
          p_zone_id: string
        }
        Returns: string
      }
      admin_create_parking_zone: {
        Args: {
          p_code: string
          p_correlation_id: string
          p_name: string
          p_sort_order: number
        }
        Returns: string
      }
      admin_create_rate_draft: {
        Args: {
          p_correlation_id: string
          p_daily_max_centavos: number
          p_effective_from: string
          p_effective_to: string
          p_flat_fee_centavos: number
          p_grace_minutes: number
          p_initial_fee_centavos: number
          p_initial_minutes: number
          p_lost_ticket_penalty_centavos: number
          p_mode: Database["public"]["Enums"]["rate_mode"]
          p_overnight_fee_centavos: number
          p_succeeding_fee_centavos: number
          p_succeeding_interval_minutes: number
          p_vehicle_type_id: string
        }
        Returns: string
      }
      admin_create_staff_profile: {
        Args: {
          p_can_approve_overrides: boolean
          p_can_cancel_sessions: boolean
          p_can_correct_session_times: boolean
          p_can_process_lost_tickets: boolean
          p_can_void_payments: boolean
          p_correlation_id: string
          p_full_name: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: string
      }
      admin_create_vehicle_type: {
        Args: { p_code: string; p_correlation_id: string; p_name: string }
        Returns: string
      }
      admin_deactivate_parking_space: {
        Args: { p_correlation_id: string; p_space_id: string }
        Returns: undefined
      }
      admin_deactivate_parking_zone: {
        Args: { p_correlation_id: string; p_zone_id: string }
        Returns: undefined
      }
      admin_deactivate_vehicle_type: {
        Args: { p_correlation_id: string; p_vehicle_type_id: string }
        Returns: undefined
      }
      admin_disable_staff: {
        Args: {
          p_correlation_id: string
          p_reason: string
          p_target_id: string
        }
        Returns: undefined
      }
      admin_publish_rate: {
        Args: { p_correlation_id: string; p_rate_id: string }
        Returns: string
      }
      admin_reactivate_staff: {
        Args: {
          p_correlation_id: string
          p_reason: string
          p_target_id: string
        }
        Returns: undefined
      }
      admin_retire_published_rate: {
        Args: {
          p_correlation_id: string
          p_effective_to: string
          p_rate_id: string
        }
        Returns: undefined
      }
      admin_set_parking_space_status: {
        Args: {
          p_correlation_id: string
          p_expected_version: number
          p_space_id: string
          p_status: Database["public"]["Enums"]["space_status"]
        }
        Returns: number
      }
      admin_update_facility_settings: {
        Args: {
          p_correlation_id: string
          p_name: string
          p_receipt_prefix: string
          p_settings: Json
          p_timezone: string
        }
        Returns: string
      }
      admin_update_parking_space: {
        Args: {
          p_correlation_id: string
          p_space_id: string
          p_vehicle_type_id: string
          p_zone_id: string
        }
        Returns: string
      }
      admin_update_parking_zone: {
        Args: {
          p_correlation_id: string
          p_name: string
          p_sort_order: number
          p_zone_id: string
        }
        Returns: string
      }
      admin_update_rate_draft: {
        Args: {
          p_correlation_id: string
          p_daily_max_centavos: number
          p_effective_from: string
          p_effective_to: string
          p_flat_fee_centavos: number
          p_grace_minutes: number
          p_initial_fee_centavos: number
          p_initial_minutes: number
          p_lost_ticket_penalty_centavos: number
          p_mode: Database["public"]["Enums"]["rate_mode"]
          p_overnight_fee_centavos: number
          p_rate_id: string
          p_succeeding_fee_centavos: number
          p_succeeding_interval_minutes: number
          p_vehicle_type_id: string
        }
        Returns: string
      }
      admin_update_staff_permissions: {
        Args: {
          p_can_approve_overrides: boolean
          p_can_cancel_sessions: boolean
          p_can_correct_session_times: boolean
          p_can_process_lost_tickets: boolean
          p_can_void_payments: boolean
          p_correlation_id: string
          p_target_id: string
        }
        Returns: undefined
      }
      admin_update_staff_role: {
        Args: {
          p_correlation_id: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_target_id: string
        }
        Returns: undefined
      }
      admin_update_vehicle_type: {
        Args: {
          p_correlation_id: string
          p_name: string
          p_vehicle_type_id: string
        }
        Returns: string
      }
      admin_withdraw_rate_draft: {
        Args: { p_correlation_id: string; p_rate_id: string }
        Returns: undefined
      }
      calculate_parking_exit: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_session_id: string
        }
        Returns: Json
      }
      cancel_parking_session: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_reason: string
          p_session_id: string
        }
        Returns: Json
      }
      close_staff_shift: {
        Args: {
          p_correlation_id: string
          p_declared_cash_centavos: number
          p_idempotency_key: string
          p_notes: string
          p_shift_id: string
        }
        Returns: Json
      }
      confirm_vehicle_exit: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_session_id: string
        }
        Returns: Json
      }
      correct_parking_session: {
        Args: {
          p_correction_type: string
          p_correlation_id: string
          p_idempotency_key: string
          p_reason: string
          p_session_id: string
          p_values: Json
        }
        Returns: Json
      }
      create_parking_entry: {
        Args: {
          p_color: string
          p_correlation_id: string
          p_idempotency_key: string
          p_plate: string
          p_space_id: string
          p_vehicle_type_id: string
        }
        Returns: Json
      }
      get_dashboard_snapshot: {
        Args: { p_business_date?: string }
        Returns: Json
      }
      process_lost_ticket: {
        Args: {
          p_correlation_id: string
          p_evidence: Json
          p_idempotency_key: string
          p_reason: string
          p_session_id: string
        }
        Returns: Json
      }
      record_parking_payment: {
        Args: {
          p_cash_tendered_centavos: number
          p_correlation_id: string
          p_external_reference: string
          p_idempotency_key: string
          p_session_id: string
        }
        Returns: Json
      }
      reissue_parking_ticket: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_reason: string
          p_session_id: string
        }
        Returns: Json
      }
      start_staff_shift: {
        Args: {
          p_correlation_id: string
          p_device_id: string
          p_idempotency_key: string
          p_opening_float_centavos: number
        }
        Returns: Json
      }
      validate_parking_ticket: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_ticket_number: string
          p_token: string
        }
        Returns: Json
      }
      void_parking_payment: {
        Args: {
          p_correlation_id: string
          p_idempotency_key: string
          p_payment_id: string
          p_reason: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "ADMIN" | "STAFF"
      payment_kind: "COLLECTION" | "TOP_UP" | "REVERSAL"
      rate_mode: "TIERED" | "FLAT"
      session_payment_status: "UNPAID" | "PAID" | "NOT_REQUIRED" | "VOIDED"
      session_status:
        | "ACTIVE"
        | "EXIT_PENDING"
        | "PAYMENT_PENDING"
        | "PAID_AWAITING_EXIT"
        | "COMPLETED"
        | "CANCELLED"
        | "LOST_TICKET"
        | "MANUAL_REVIEW"
      shift_status: "OPEN" | "CLOSED"
      space_status: "AVAILABLE" | "OCCUPIED" | "OUT_OF_SERVICE"
      ticket_status: "ACTIVE" | "REVOKED" | "COMPLETED"
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
      app_role: ["ADMIN", "STAFF"],
      payment_kind: ["COLLECTION", "TOP_UP", "REVERSAL"],
      rate_mode: ["TIERED", "FLAT"],
      session_payment_status: ["UNPAID", "PAID", "NOT_REQUIRED", "VOIDED"],
      session_status: [
        "ACTIVE",
        "EXIT_PENDING",
        "PAYMENT_PENDING",
        "PAID_AWAITING_EXIT",
        "COMPLETED",
        "CANCELLED",
        "LOST_TICKET",
        "MANUAL_REVIEW",
      ],
      shift_status: ["OPEN", "CLOSED"],
      space_status: ["AVAILABLE", "OCCUPIED", "OUT_OF_SERVICE"],
      ticket_status: ["ACTIVE", "REVOKED", "COMPLETED"],
    },
  },
} as const

