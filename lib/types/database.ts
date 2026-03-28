// Generated from supabase/migrations/00001_initial_schema.sql
// Replace with: npx supabase gen types typescript --linked > lib/types/database.ts
// (after linking: npx supabase link --project-ref itpvubcxmvwxawibkicr)

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
      profiles: {
        Row: {
          id: string
          role: Database['public']['Enums']['user_role']
          full_name: string
          avatar_url: string | null
          profile_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: Database['public']['Enums']['user_role']
          full_name?: string
          avatar_url?: string | null
          profile_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['user_role']
          full_name?: string
          avatar_url?: string | null
          profile_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      employer_profiles: {
        Row: {
          id: string
          user_id: string
          salon_name: string
          location_city: string
          location_state: string
          description: string
          website_url: string | null
          instagram_handle: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          salon_name: string
          location_city: string
          location_state: string
          description: string
          website_url?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          salon_name?: string
          location_city?: string
          location_state?: string
          description?: string
          website_url?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employer_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      seeker_profiles: {
        Row: {
          id: string
          user_id: string
          headline: string | null
          bio: string | null
          resume_url: string | null
          portfolio_url: string | null
          instagram_handle: string | null
          city: string | null
          state: string | null
          specialties: Json
          years_experience: number | null
          open_to_work: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          headline?: string | null
          bio?: string | null
          resume_url?: string | null
          portfolio_url?: string | null
          instagram_handle?: string | null
          city?: string | null
          state?: string | null
          specialties?: Json
          years_experience?: number | null
          open_to_work?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          headline?: string | null
          bio?: string | null
          resume_url?: string | null
          portfolio_url?: string | null
          instagram_handle?: string | null
          city?: string | null
          state?: string | null
          specialties?: Json
          years_experience?: number | null
          open_to_work?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'seeker_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      job_posts: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          job_type: Database['public']['Enums']['job_type']
          experience_level: Database['public']['Enums']['experience_level']
          category: string
          specialties: Json
          city: string
          state: string
          pay_range_low: number | null
          pay_range_high: number | null
          status: Database['public']['Enums']['job_status']
          posted_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          description: string
          job_type: Database['public']['Enums']['job_type']
          experience_level: Database['public']['Enums']['experience_level']
          category: string
          specialties?: Json
          city: string
          state: string
          pay_range_low?: number | null
          pay_range_high?: number | null
          status?: Database['public']['Enums']['job_status']
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string
          job_type?: Database['public']['Enums']['job_type']
          experience_level?: Database['public']['Enums']['experience_level']
          category?: string
          specialties?: Json
          city?: string
          state?: string
          pay_range_low?: number | null
          pay_range_high?: number | null
          status?: Database['public']['Enums']['job_status']
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'job_posts_employer_id_fkey'
            columns: ['employer_id']
            isOneToOne: false
            referencedRelation: 'employer_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      applications: {
        Row: {
          id: string
          job_post_id: string
          seeker_id: string
          cover_letter: string | null
          status: Database['public']['Enums']['application_status']
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_post_id: string
          seeker_id: string
          cover_letter?: string | null
          status?: Database['public']['Enums']['application_status']
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_post_id?: string
          seeker_id?: string
          cover_letter?: string | null
          status?: Database['public']['Enums']['application_status']
          applied_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'applications_job_post_id_fkey'
            columns: ['job_post_id']
            isOneToOne: false
            referencedRelation: 'job_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_seeker_id_fkey'
            columns: ['seeker_id']
            isOneToOne: false
            referencedRelation: 'seeker_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          id: string
          employer_id: string
          job_post_id: string
          stripe_payment_id: string
          amount_cents: number
          type: Database['public']['Enums']['payment_type']
          created_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          job_post_id: string
          stripe_payment_id: string
          amount_cents: number
          type: Database['public']['Enums']['payment_type']
          created_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          job_post_id?: string
          stripe_payment_id?: string
          amount_cents?: number
          type?: Database['public']['Enums']['payment_type']
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_employer_id_fkey'
            columns: ['employer_id']
            isOneToOne: false
            referencedRelation: 'employer_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_job_post_id_fkey'
            columns: ['job_post_id']
            isOneToOne: false
            referencedRelation: 'job_posts'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'employer' | 'seeker'
      job_type: 'booth_rental' | 'commission' | 'salary' | 'hourly'
      experience_level: 'entry' | 'mid' | 'senior'
      job_status: 'draft' | 'active' | 'closed'
      application_status: 'submitted' | 'reviewed' | 'interview' | 'rejected' | 'hired'
      payment_type: 'single_post'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
