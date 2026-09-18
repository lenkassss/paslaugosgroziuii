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
      ad_slots: {
        Row: {
          advertiser_id: string
          body: string | null
          clicks: number
          created_at: string
          cta_label: string
          cta_url: string | null
          ends_at: string | null
          frequency: number
          id: string
          image_url: string | null
          impressions: number
          is_active: boolean
          placement: string
          placements: string[]
          priority: number
          starts_at: string
          target_category: string | null
          target_city: string | null
          title: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          body?: string | null
          clicks?: number
          created_at?: string
          cta_label?: string
          cta_url?: string | null
          ends_at?: string | null
          frequency?: number
          id?: string
          image_url?: string | null
          impressions?: number
          is_active?: boolean
          placement?: string
          placements?: string[]
          priority?: number
          starts_at?: string
          target_category?: string | null
          target_city?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          body?: string | null
          clicks?: number
          created_at?: string
          cta_label?: string
          cta_url?: string | null
          ends_at?: string | null
          frequency?: number
          id?: string
          image_url?: string | null
          impressions?: number
          is_active?: boolean
          placement?: string
          placements?: string[]
          priority?: number
          starts_at?: string
          target_category?: string | null
          target_city?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      advertiser_profiles: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          intent: string | null
          listing_credits: number
          person_type: string
          phone: string
          rejection_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: string | null
          status: string
          subscription_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          intent?: string | null
          listing_credits?: number
          person_type?: string
          phone: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string | null
          status?: string
          subscription_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          intent?: string | null
          listing_credits?: number
          person_type?: string
          phone?: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string | null
          status?: string
          subscription_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active_from: string
          active_until: string | null
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          level: string
          title: string
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          title: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          title?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          cancel_token: string
          cancellation_fee: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          client_user_id: string | null
          confirmation_channel: Database["public"]["Enums"]["confirmation_channel"]
          confirmation_sent_at: string | null
          created_at: string
          deposit_amount: number
          deposit_status: Database["public"]["Enums"]["deposit_status"]
          duration_mins: number
          fee_card_last4: string | null
          guarantee_card_last4: string | null
          id: string
          notes: string | null
          payment_id: string | null
          payment_status: string
          platform_fee: number
          reminder_sent_at: string | null
          rescheduled_from: Json | null
          salon_id: string
          service_id: string | null
          service_name: string
          service_price: number
          staff_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          time_slot: string
        }
        Insert: {
          appointment_date: string
          cancel_token?: string
          cancellation_fee?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          client_user_id?: string | null
          confirmation_channel?: Database["public"]["Enums"]["confirmation_channel"]
          confirmation_sent_at?: string | null
          created_at?: string
          deposit_amount?: number
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          duration_mins?: number
          fee_card_last4?: string | null
          guarantee_card_last4?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_status?: string
          platform_fee?: number
          reminder_sent_at?: string | null
          rescheduled_from?: Json | null
          salon_id: string
          service_id?: string | null
          service_name: string
          service_price?: number
          staff_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          time_slot: string
        }
        Update: {
          appointment_date?: string
          cancel_token?: string
          cancellation_fee?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          client_user_id?: string | null
          confirmation_channel?: Database["public"]["Enums"]["confirmation_channel"]
          confirmation_sent_at?: string | null
          created_at?: string
          deposit_amount?: number
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          duration_mins?: number
          fee_card_last4?: string | null
          guarantee_card_last4?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_status?: string
          platform_fee?: number
          reminder_sent_at?: string | null
          rescheduled_from?: Json | null
          salon_id?: string
          service_id?: string | null
          service_name?: string
          service_price?: number
          staff_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "salon_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string
          body: string
          created_at: string
          downvotes: number
          edited_at: string | null
          id: string
          parent_id: string | null
          reply_count: number
          report_count: number
          score: number
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          article_id: string
          body: string
          created_at?: string
          downvotes?: number
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          reply_count?: number
          report_count?: number
          score?: number
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          article_id?: string
          body?: string
          created_at?: string
          downvotes?: number
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          reply_count?: number
          report_count?: number
          score?: number
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          body_md: string
          category: string
          comment_count: number
          cover_url: string | null
          created_at: string
          event_currency: string | null
          event_ends_at: string | null
          event_location: string | null
          event_paid_required: boolean | null
          event_price: number | null
          event_price_eur: number | null
          event_seats: number | null
          event_starts_at: string | null
          excerpt: string | null
          id: string
          is_promoted: boolean
          kind: Database["public"]["Enums"]["article_kind"]
          promo_discount_pct: number | null
          promo_ends_at: string | null
          promo_service_ids: string[] | null
          promo_starts_at: string | null
          promoted_label: string | null
          promoted_priority: number
          promoted_until: string | null
          published_at: string
          slug: string
          status: string
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          body_md?: string
          category?: string
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          event_currency?: string | null
          event_ends_at?: string | null
          event_location?: string | null
          event_paid_required?: boolean | null
          event_price?: number | null
          event_price_eur?: number | null
          event_seats?: number | null
          event_starts_at?: string | null
          excerpt?: string | null
          id?: string
          is_promoted?: boolean
          kind?: Database["public"]["Enums"]["article_kind"]
          promo_discount_pct?: number | null
          promo_ends_at?: string | null
          promo_service_ids?: string[] | null
          promo_starts_at?: string | null
          promoted_label?: string | null
          promoted_priority?: number
          promoted_until?: string | null
          published_at?: string
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          body_md?: string
          category?: string
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          event_currency?: string | null
          event_ends_at?: string | null
          event_location?: string | null
          event_paid_required?: boolean | null
          event_price?: number | null
          event_price_eur?: number | null
          event_seats?: number | null
          event_starts_at?: string | null
          excerpt?: string | null
          id?: string
          is_promoted?: boolean
          kind?: Database["public"]["Enums"]["article_kind"]
          promo_discount_pct?: number | null
          promo_ends_at?: string | null
          promo_service_ids?: string[] | null
          promo_starts_at?: string | null
          promoted_label?: string | null
          promoted_priority?: number
          promoted_until?: string | null
          published_at?: string
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      b2b_feed: {
        Row: {
          approved: boolean
          author_id: string
          content_text: string
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          approved?: boolean
          author_id: string
          content_text: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          approved?: boolean
          author_id?: string
          content_text?: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_feed_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_feed_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          post_id: string
          replier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          post_id: string
          replier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          post_id?: string
          replier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "b2b_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_replies_replier_id_fkey"
            columns: ["replier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_replies_replier_id_fkey"
            columns: ["replier_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_nodes: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_global: boolean
          kind: string
          label: string
          metadata: Json
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          kind?: string
          label: string
          metadata?: Json
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          kind?: string
          label?: string
          metadata?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_listings: {
        Row: {
          amount_cents: number
          applicant_name: string | null
          approved_at: string | null
          approved_by: string | null
          category: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          highlight_until: string | null
          id: string
          images: string[]
          is_active: boolean
          is_highlighted: boolean
          listing_kind: string
          owner_id: string
          payment_status: string
          person_type: string
          place_type: string | null
          price: number | null
          price_period: string | null
          rejection_note: string | null
          service_category: string | null
          social_links: string | null
          status: string
          subtype: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          applicant_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          highlight_until?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_highlighted?: boolean
          listing_kind?: string
          owner_id: string
          payment_status?: string
          person_type?: string
          place_type?: string | null
          price?: number | null
          price_period?: string | null
          rejection_note?: string | null
          service_category?: string | null
          social_links?: string | null
          status?: string
          subtype?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          applicant_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          highlight_until?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_highlighted?: boolean
          listing_kind?: string
          owner_id?: string
          payment_status?: string
          person_type?: string
          place_type?: string | null
          price?: number | null
          price_period?: string | null
          rejection_note?: string | null
          service_category?: string | null
          social_links?: string | null
          status?: string
          subtype?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
          value: number
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
          value: number
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      component_styles: {
        Row: {
          element_key: string
          id: string
          is_visible: boolean
          styles: Json
          updated_at: string
        }
        Insert: {
          element_key: string
          id?: string
          is_visible?: boolean
          styles?: Json
          updated_at?: string
        }
        Update: {
          element_key?: string
          id?: string
          is_visible?: boolean
          styles?: Json
          updated_at?: string
        }
        Relationships: []
      }
      course_registrations: {
        Row: {
          amount_cents: number | null
          course_id: string
          created_at: string
          email: string
          id: string
          name: string
          note: string | null
          payment_status: string
          phone: string | null
          seats: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          course_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          note?: string | null
          payment_status?: string
          phone?: string | null
          seats?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          course_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          note?: string | null
          payment_status?: string
          phone?: string | null
          seats?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          amount_cents: number
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean
          payment_status: string
          price: number
          rejection_note: string | null
          school_id: string
          seats: number
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          payment_status?: string
          price?: number
          rejection_note?: string | null
          school_id: string
          seats?: number
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          payment_status?: string
          price?: number
          rejection_note?: string | null
          school_id?: string
          seats?: number
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_payments: {
        Row: {
          amount: number
          card_last4: string | null
          created_at: string
          credit_applied_eur: number
          id: string
          kind: string | null
          meta: Json
          plan_tier: string | null
          plan_type: string | null
          status: string
          target_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          card_last4?: string | null
          created_at?: string
          credit_applied_eur?: number
          id?: string
          kind?: string | null
          meta?: Json
          plan_tier?: string | null
          plan_type?: string | null
          status?: string
          target_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          card_last4?: string | null
          created_at?: string
          credit_applied_eur?: number
          id?: string
          kind?: string | null
          meta?: Json
          plan_tier?: string | null
          plan_type?: string | null
          status?: string
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          amount_cents: number | null
          article_id: string
          created_at: string
          email: string
          id: string
          name: string
          note: string | null
          paid_at: string | null
          payment_provider: string | null
          payment_ref: string | null
          payment_status: string | null
          phone: string | null
          seats: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          article_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          note?: string | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string | null
          phone?: string | null
          seats?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          article_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          note?: string | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string | null
          phone?: string | null
          seats?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          config: Json
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          id?: string
          target_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          id?: string
          target_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          category_id: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string
          reply_count: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          body: string
          category_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string
          reply_count?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          category_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string
          reply_count?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      global_brands: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          logo_url: string | null
          name: string
          slug: string
          suggested_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name: string
          slug: string
          suggested_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          suggested_by?: string | null
        }
        Relationships: []
      }
      highlight_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          ends_at: string
          id: string
          payment_provider: string | null
          payment_ref: string | null
          payment_status: string
          plan_type: string | null
          starts_at: string
          target_id: string
          target_kind: string
          user_id: string
          weeks: number
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          ends_at: string
          id?: string
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string
          plan_type?: string | null
          starts_at?: string
          target_id: string
          target_kind: string
          user_id: string
          weeks?: number
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          ends_at?: string
          id?: string
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: string
          plan_type?: string | null
          starts_at?: string
          target_id?: string
          target_kind?: string
          user_id?: string
          weeks?: number
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          created_at: string
          cv_url: string | null
          email: string
          id: string
          job_id: string
          message: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          cv_url?: string | null
          email: string
          id?: string
          job_id: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          cv_url?: string | null
          email?: string
          id?: string
          job_id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          applications_count: number
          benefits: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          description: string
          employer_id: string
          employment_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          requirements: string | null
          salary_from: number | null
          salary_to: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          applications_count?: number
          benefits?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description: string
          employer_id: string
          employment_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary_from?: number | null
          salary_to?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          applications_count?: number
          benefits?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string
          employer_id?: string
          employment_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary_from?: number | null
          salary_to?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lookbook_items: {
        Row: {
          city: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          master_name: string | null
          price: number | null
          profile_id: string | null
          service_name: string | null
          sort_order: number
          title: string
          trend: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          master_name?: string | null
          price?: number | null
          profile_id?: string | null
          service_name?: string | null
          sort_order?: number
          title: string
          trend: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          master_name?: string | null
          price?: number | null
          profile_id?: string | null
          service_name?: string | null
          sort_order?: number
          title?: string
          trend?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lookbook_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookbook_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_calls: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          image_urls: string[]
          price_cents: number
          provider_id: string
          service_category: string | null
          service_name: string
          spots: number
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          image_urls?: string[]
          price_cents?: number
          provider_id: string
          service_category?: string | null
          service_name: string
          spots?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          image_urls?: string[]
          price_cents?: number
          provider_id?: string
          service_category?: string | null
          service_name?: string
          spots?: number
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          brand_snapshot: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          qty: number
          snapshot_title: string
          unit_price: number
        }
        Insert: {
          brand_snapshot?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          qty: number
          snapshot_title: string
          unit_price: number
        }
        Update: {
          brand_snapshot?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          snapshot_title?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          delivered_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          platform_fee: number
          shipped_at: string | null
          shipping_address: Json | null
          shipping_fee: number
          shipping_method: Database["public"]["Enums"]["shipping_method"] | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          supplier_id: string
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          platform_fee?: number
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_fee?: number
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          platform_fee?: number
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_fee?: number
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_cards: {
        Row: {
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          holder: string | null
          id: string
          is_default: boolean
          last4: string
          user_id: string
        }
        Insert: {
          brand?: string
          created_at?: string
          exp_month: number
          exp_year: number
          holder?: string | null
          id?: string
          is_default?: boolean
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          holder?: string | null
          id?: string
          is_default?: boolean
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          comments_count: number
          created_at: string
          id: string
          image_urls: string[]
          likes_count: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          comments_count?: number
          created_at?: string
          id?: string
          image_urls?: string[]
          likes_count?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          comments_count?: number
          created_at?: string
          id?: string
          image_urls?: string[]
          likes_count?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          brand_id: string | null
          category: string | null
          country_of_origin: string | null
          created_at: string
          currency: string
          description: string | null
          discount_percent: number | null
          id: string
          images: Json
          inci: string | null
          is_active: boolean
          price: number
          price_retail: number | null
          price_wholesale: number | null
          slug: string | null
          stock: number
          supplier_id: string
          title: string
          updated_at: string
          usage_instructions: string | null
          volume: string | null
        }
        Insert: {
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          country_of_origin?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          images?: Json
          inci?: string | null
          is_active?: boolean
          price: number
          price_retail?: number | null
          price_wholesale?: number | null
          slug?: string | null
          stock?: number
          supplier_id: string
          title: string
          updated_at?: string
          usage_instructions?: string | null
          volume?: string | null
        }
        Update: {
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          country_of_origin?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          images?: Json
          inci?: string | null
          is_active?: boolean
          price?: number
          price_retail?: number | null
          price_wholesale?: number | null
          slug?: string | null
          stock?: number
          supplier_id?: string
          title?: string
          updated_at?: string
          usage_instructions?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "global_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accept_app_payments: boolean
          accept_onsite_payments: boolean
          accepted_terms_at: string | null
          address: string | null
          amenities: string[]
          at_home_service: boolean
          auto_renew: boolean
          avatar_url: string | null
          bank_beneficiary: string | null
          bank_iban: string | null
          bio: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          business_description: string | null
          business_name: string | null
          cancellation_fee_percent: number
          cancellation_window_mins: number
          category: string | null
          city: string | null
          company_code: string | null
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          featured_priority: number
          featured_until: string | null
          first_membership_at: string | null
          free_until: string | null
          gallery_urls: string[]
          id: string
          is_approved: boolean
          is_featured: boolean
          is_primary_owner: boolean
          lat: number | null
          license_no: string | null
          lng: number | null
          membership_level: string
          min_advance_mins: number
          newsletter_opt_in: boolean
          newsletter_opt_in_at: string | null
          next_billing_at: string | null
          notify_bookings: boolean
          notify_email: boolean
          notify_marketing: boolean
          notify_messages: boolean
          notify_payments: boolean
          owner_name: string | null
          payments_enabled: boolean
          phone: string | null
          plan_tier: string | null
          plan_type: string
          referral_bonus_granted: boolean
          referral_code: string | null
          rejection_reason: string | null
          same_day_closed_on: string | null
          shipping_config: Json
          stripe_account_id: string | null
          subscription_active: boolean
          subscription_billing:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_started_at: string | null
          subscription_state: Database["public"]["Enums"]["subscription_status"]
          suspended: boolean
          updated_at: string
          vat_code: string | null
          verification_docs: Json
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          wallet_balance: number
          wallet_pending: number
        }
        Insert: {
          accept_app_payments?: boolean
          accept_onsite_payments?: boolean
          accepted_terms_at?: string | null
          address?: string | null
          amenities?: string[]
          at_home_service?: boolean
          auto_renew?: boolean
          avatar_url?: string | null
          bank_beneficiary?: string | null
          bank_iban?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          business_description?: string | null
          business_name?: string | null
          cancellation_fee_percent?: number
          cancellation_window_mins?: number
          category?: string | null
          city?: string | null
          company_code?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          featured_priority?: number
          featured_until?: string | null
          first_membership_at?: string | null
          free_until?: string | null
          gallery_urls?: string[]
          id: string
          is_approved?: boolean
          is_featured?: boolean
          is_primary_owner?: boolean
          lat?: number | null
          license_no?: string | null
          lng?: number | null
          membership_level?: string
          min_advance_mins?: number
          newsletter_opt_in?: boolean
          newsletter_opt_in_at?: string | null
          next_billing_at?: string | null
          notify_bookings?: boolean
          notify_email?: boolean
          notify_marketing?: boolean
          notify_messages?: boolean
          notify_payments?: boolean
          owner_name?: string | null
          payments_enabled?: boolean
          phone?: string | null
          plan_tier?: string | null
          plan_type?: string
          referral_bonus_granted?: boolean
          referral_code?: string | null
          rejection_reason?: string | null
          same_day_closed_on?: string | null
          shipping_config?: Json
          stripe_account_id?: string | null
          subscription_active?: boolean
          subscription_billing?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_state?: Database["public"]["Enums"]["subscription_status"]
          suspended?: boolean
          updated_at?: string
          vat_code?: string | null
          verification_docs?: Json
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          wallet_balance?: number
          wallet_pending?: number
        }
        Update: {
          accept_app_payments?: boolean
          accept_onsite_payments?: boolean
          accepted_terms_at?: string | null
          address?: string | null
          amenities?: string[]
          at_home_service?: boolean
          auto_renew?: boolean
          avatar_url?: string | null
          bank_beneficiary?: string | null
          bank_iban?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          business_description?: string | null
          business_name?: string | null
          cancellation_fee_percent?: number
          cancellation_window_mins?: number
          category?: string | null
          city?: string | null
          company_code?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          featured_priority?: number
          featured_until?: string | null
          first_membership_at?: string | null
          free_until?: string | null
          gallery_urls?: string[]
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          is_primary_owner?: boolean
          lat?: number | null
          license_no?: string | null
          lng?: number | null
          membership_level?: string
          min_advance_mins?: number
          newsletter_opt_in?: boolean
          newsletter_opt_in_at?: string | null
          next_billing_at?: string | null
          notify_bookings?: boolean
          notify_email?: boolean
          notify_marketing?: boolean
          notify_messages?: boolean
          notify_payments?: boolean
          owner_name?: string | null
          payments_enabled?: boolean
          phone?: string | null
          plan_tier?: string | null
          plan_type?: string
          referral_bonus_granted?: boolean
          referral_code?: string | null
          rejection_reason?: string | null
          same_day_closed_on?: string | null
          shipping_config?: Json
          stripe_account_id?: string | null
          subscription_active?: boolean
          subscription_billing?:
            | Database["public"]["Enums"]["billing_cycle"]
            | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_state?: Database["public"]["Enums"]["subscription_status"]
          suspended?: boolean
          updated_at?: string
          vat_code?: string | null
          verification_docs?: Json
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          wallet_balance?: number
          wallet_pending?: number
        }
        Relationships: []
      }
      provider_brands: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "global_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_brands_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_brands_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          invited_user_id: string
          inviter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          inviter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          inviter_id?: string
        }
        Relationships: []
      }
      rental_inquiries: {
        Row: {
          created_at: string
          id: string
          message: string
          owner_id: string
          rental_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          owner_id: string
          rental_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          owner_id?: string
          rental_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_inquiries_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          area_sqm: number | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          owner_id: string
          price: number
          price_per_day: number | null
          price_per_month: number | null
          price_period: string
          title: string
          updated_at: string
          utilities_included: boolean
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          owner_id: string
          price: number
          price_per_day?: number | null
          price_per_month?: number | null
          price_period?: string
          title: string
          updated_at?: string
          utilities_included?: boolean
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          owner_id?: string
          price?: number
          price_per_day?: number | null
          price_per_month?: number | null
          price_period?: string
          title?: string
          updated_at?: string
          utilities_included?: boolean
        }
        Relationships: []
      }
      salon_clients: {
        Row: {
          blocked_reason: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_user_id: string | null
          created_at: string
          id: string
          is_blocked: boolean
          note: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          blocked_reason?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          note?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          blocked_reason?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          note?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      salon_reviews: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          rating_stars: number
          reviewer_name: string
          salon_id: string
          text_comment: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          rating_stars: number
          reviewer_name: string
          salon_id: string
          text_comment?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          rating_stars?: number
          reviewer_name?: string
          salon_id?: string
          text_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_staff: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          salon_id: string
          specialization: string | null
          staff_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          salon_id: string
          specialization?: string | null
          staff_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          salon_id?: string
          specialization?: string | null
          staff_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          id: string
          kind: string
          note: string | null
          order_id: string | null
          payment_id: string | null
          salon_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          salon_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "public_appointment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      service_suggestions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggestion: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          deposit_fixed: number | null
          deposit_percent: number
          description: string | null
          discount_ends_at: string | null
          discount_label: string | null
          discount_percent: number | null
          discount_price: number | null
          discount_starts_at: string | null
          duration_mins: number
          id: string
          name: string
          price: number
          salon_id: string
          standard_service_id: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          deposit_fixed?: number | null
          deposit_percent?: number
          description?: string | null
          discount_ends_at?: string | null
          discount_label?: string | null
          discount_percent?: number | null
          discount_price?: number | null
          discount_starts_at?: string | null
          duration_mins?: number
          id?: string
          name: string
          price?: number
          salon_id: string
          standard_service_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deposit_fixed?: number | null
          deposit_percent?: number
          description?: string | null
          discount_ends_at?: string | null
          discount_label?: string | null
          discount_percent?: number | null
          discount_price?: number | null
          discount_starts_at?: string | null
          duration_mins?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
          standard_service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_standard_service_id_fkey"
            columns: ["standard_service_id"]
            isOneToOne: false
            referencedRelation: "standard_services"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          align: string
          block_kind: string
          body_text: string | null
          button_link: string | null
          button_text: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          is_custom: boolean
          page_slug: string
          section_id: string
          sort_order: number
          style: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          align?: string
          block_kind?: string
          body_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_custom?: boolean
          page_slug: string
          section_id: string
          sort_order?: number
          style?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          align?: string
          block_kind?: string
          body_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_custom?: boolean
          page_slug?: string
          section_id?: string
          sort_order?: number
          style?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string
          announcement: string | null
          announcement_active: boolean
          background_color: string
          base_font_size: string
          border_radius: string
          brand_name: string
          button_style: string
          card_bg_color: string
          contact_email: string | null
          contact_phone: string | null
          cookie_banner_text: string | null
          favicon_url: string | null
          features: Json
          footer_text: string | null
          ga_measurement_id: string | null
          heading_font: string
          hero_cta_label: string
          hero_subtitle: string
          hero_title: string
          id: number
          logo_url: string | null
          meta_pixel_id: string | null
          primary_color: string
          primary_font: string
          secondary_color: string
          sections: Json
          site_name: string
          tagline: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          announcement?: string | null
          announcement_active?: boolean
          background_color?: string
          base_font_size?: string
          border_radius?: string
          brand_name?: string
          button_style?: string
          card_bg_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          cookie_banner_text?: string | null
          favicon_url?: string | null
          features?: Json
          footer_text?: string | null
          ga_measurement_id?: string | null
          heading_font?: string
          hero_cta_label?: string
          hero_subtitle?: string
          hero_title?: string
          id?: number
          logo_url?: string | null
          meta_pixel_id?: string | null
          primary_color?: string
          primary_font?: string
          secondary_color?: string
          sections?: Json
          site_name?: string
          tagline?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          announcement?: string | null
          announcement_active?: boolean
          background_color?: string
          base_font_size?: string
          border_radius?: string
          brand_name?: string
          button_style?: string
          card_bg_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          cookie_banner_text?: string | null
          favicon_url?: string | null
          features?: Json
          footer_text?: string | null
          ga_measurement_id?: string | null
          heading_font?: string
          hero_cta_label?: string
          hero_subtitle?: string
          hero_title?: string
          id?: number
          logo_url?: string | null
          meta_pixel_id?: string | null
          primary_color?: string
          primary_font?: string
          secondary_color?: string
          sections?: Json
          site_name?: string
          tagline?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_name: string | null
          salon_id: string
          specialization: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_name?: string | null
          salon_id: string
          specialization?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_name?: string | null
          salon_id?: string
          specialization?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          synonyms: string[]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      supplier_requests: {
        Row: {
          admin_notes: string | null
          company_code: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          products_description: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["supplier_request_status"]
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_code?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          products_description: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["supplier_request_status"]
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_code?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          products_description?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["supplier_request_status"]
          website?: string | null
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string
          id: string
          reason: string | null
          salon_id: string
          staff_id: string | null
          start_time: string
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          salon_id: string
          staff_id?: string | null
          start_time: string
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          salon_id?: string
          staff_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "salon_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          end_time: string
          id: string
          is_closed: boolean
          salon_id: string
          staff_id: string | null
          start_time: string
          weekday: number
        }
        Insert: {
          end_time?: string
          id?: string
          is_closed?: boolean
          salon_id: string
          staff_id?: string | null
          start_time?: string
          weekday: number
        }
        Update: {
          end_time?: string
          id?: string
          is_closed?: boolean
          salon_id?: string
          staff_id?: string | null
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "salon_staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_appointment_slots: {
        Row: {
          appointment_date: string | null
          duration_mins: number | null
          id: string | null
          salon_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          time_slot: string | null
        }
        Insert: {
          appointment_date?: string | null
          duration_mins?: number | null
          id?: string | null
          salon_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time_slot?: string | null
        }
        Update: {
          appointment_date?: string | null
          duration_mins?: number | null
          id?: string | null
          salon_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          category: string | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          featured_priority: number | null
          featured_until: string | null
          gallery_urls: string[] | null
          id: string | null
          is_featured: boolean | null
          lat: number | null
          lng: number | null
          plan_tier: string | null
          plan_type: string | null
          subscription_active: boolean | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          featured_priority?: number | null
          featured_until?: string | null
          gallery_urls?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          plan_tier?: string | null
          plan_type?: string | null
          subscription_active?: boolean | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          featured_priority?: number | null
          featured_until?: string | null
          gallery_urls?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          plan_tier?: string | null
          plan_type?: string | null
          subscription_active?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_staff_invite: {
        Args: { _token: string }
        Returns: {
          salon_id: string
          salon_name: string
        }[]
      }
      admin_block_user: {
        Args: { _reason: string; _target: string }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      admin_set_salon_approved: {
        Args: { _approved: boolean; _salon: string }
        Returns: undefined
      }
      admin_unblock_user: { Args: { _target: string }; Returns: undefined }
      auto_cancel_unpaid_appointments: { Args: never; Returns: undefined }
      bump_ad_click: { Args: { _id: string }; Returns: undefined }
      bump_ad_impression: { Args: { _id: string }; Returns: undefined }
      cancel_appointment_by_token: {
        Args: { _reason?: string; _token: string }
        Returns: boolean
      }
      course_seats_left: { Args: { _course: string }; Returns: number }
      expire_featured: { Args: never; Returns: undefined }
      expire_promoted_articles: { Args: never; Returns: undefined }
      expire_stale_subscriptions: { Args: never; Returns: undefined }
      get_appointment_by_token: {
        Args: { _token: string }
        Returns: {
          address: string
          appointment_date: string
          business_name: string
          cancellation_reason: string
          cancelled_at: string
          city: string
          client_email: string
          client_name: string
          client_phone: string
          confirmation_channel: Database["public"]["Enums"]["confirmation_channel"]
          duration_mins: number
          id: string
          phone: string
          salon_id: string
          service_name: string
          status: Database["public"]["Enums"]["appointment_status"]
          time_slot: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_active_highlight: {
        Args: { _kind: string; _target: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_article_author: { Args: { _article_id: string }; Returns: boolean }
      is_business_user: { Args: { _user_id: string }; Returns: boolean }
      is_provider_user: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      list_provider_roles: {
        Args: never
        Returns: {
          role: string
          user_id: string
        }[]
      }
      list_salon_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      my_referral_status: {
        Args: never
        Returns: {
          bonus_granted: boolean
          free_until: string
          invited_count: number
          referral_code: string
        }[]
      }
      notify_admins: {
        Args: {
          _payload: Json
          _type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      peek_staff_invite: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          salon_name: string
          status: string
        }[]
      }
      purchase_article_promotion: {
        Args: { _article: string; _plan: string }
        Returns: string
      }
      register_referral: { Args: { _code: string }; Returns: boolean }
      super_admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "client"
        | "salon"
        | "supplier"
        | "admin"
        | "super_admin"
        | "staff"
        | "school"
        | "employer"
        | "advertiser"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      article_kind: "article" | "event" | "promo"
      billing_cycle: "monthly" | "yearly"
      comment_status: "visible" | "pending" | "hidden" | "deleted"
      confirmation_channel: "none" | "email" | "sms" | "both"
      deposit_status: "none" | "pending" | "paid" | "refunded"
      notification_type:
        | "comment_reply"
        | "comment_on_article"
        | "comment_vote"
        | "comment_removed"
        | "system"
        | "rental_inquiry"
        | "b2b_order_new"
        | "b2b_order_shipped"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_reminder"
        | "promotion_active"
        | "promotion_expiring"
        | "admin_classified_pending"
        | "admin_supplier_pending"
        | "admin_course_pending"
        | "listing_approved"
        | "listing_rejected"
      order_status:
        | "pending"
        | "paid"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "demo_card" | "invoice"
      shipping_method: "omniva" | "dpd" | "courier" | "pickup" | "free"
      subscription_status:
        | "none"
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      supplier_request_status: "new" | "contacted" | "approved" | "rejected"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "client",
        "salon",
        "supplier",
        "admin",
        "super_admin",
        "staff",
        "school",
        "employer",
        "advertiser",
      ],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      article_kind: ["article", "event", "promo"],
      billing_cycle: ["monthly", "yearly"],
      comment_status: ["visible", "pending", "hidden", "deleted"],
      confirmation_channel: ["none", "email", "sms", "both"],
      deposit_status: ["none", "pending", "paid", "refunded"],
      notification_type: [
        "comment_reply",
        "comment_on_article",
        "comment_vote",
        "comment_removed",
        "system",
        "rental_inquiry",
        "b2b_order_new",
        "b2b_order_shipped",
        "booking_confirmed",
        "booking_cancelled",
        "booking_reminder",
        "promotion_active",
        "promotion_expiring",
        "admin_classified_pending",
        "admin_supplier_pending",
        "admin_course_pending",
        "listing_approved",
        "listing_rejected",
      ],
      order_status: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["demo_card", "invoice"],
      shipping_method: ["omniva", "dpd", "courier", "pickup", "free"],
      subscription_status: [
        "none",
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      supplier_request_status: ["new", "contacted", "approved", "rejected"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
