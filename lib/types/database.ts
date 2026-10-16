export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
      alpha_invites: {
        Row: {
          email: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        ComputedFields: never;
        Insert: {
          email: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      application_ratings: {
        Row: {
          application_id: string;
          rating: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          rating: number;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_ratings_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          applied_at: string;
          contact_email: string | null;
          cover_letter: string | null;
          id: string;
          job_post_id: string;
          phone: string | null;
          resume_name: string | null;
          resume_path: string | null;
          seeker_id: string;
          status: Database["public"]["Enums"]["application_status"];
          submitted_name: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          applied_at?: string;
          contact_email?: string | null;
          cover_letter?: string | null;
          id?: string;
          job_post_id: string;
          phone?: string | null;
          resume_name?: string | null;
          resume_path?: string | null;
          seeker_id: string;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_name?: string | null;
          updated_at?: string;
        };
        Update: {
          applied_at?: string;
          contact_email?: string | null;
          cover_letter?: string | null;
          id?: string;
          job_post_id?: string;
          phone?: string | null;
          resume_name?: string | null;
          resume_path?: string | null;
          seeker_id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_name?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_post_id_fkey";
            columns: ["job_post_id"];
            isOneToOne: false;
            referencedRelation: "job_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_seeker_id_fkey";
            columns: ["seeker_id"];
            isOneToOne: false;
            referencedRelation: "seeker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      employer_profiles: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          instagram_handle: string | null;
          location_city: string;
          location_state: string;
          logo_url: string | null;
          photos: NonNullable<Json>;
          salon_name: string;
          updated_at: string;
          user_id: string;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          instagram_handle?: string | null;
          location_city: string;
          location_state: string;
          logo_url?: string | null;
          photos?: NonNullable<Json>;
          salon_name: string;
          updated_at?: string;
          user_id: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          instagram_handle?: string | null;
          location_city?: string;
          location_state?: string;
          logo_url?: string | null;
          photos?: NonNullable<Json>;
          salon_name?: string;
          updated_at?: string;
          user_id?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employer_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_posts: {
        Row: {
          arrangement: string;
          category: string;
          city: string;
          commission_percent: number | null;
          created_at: string;
          description: string;
          employer_id: string;
          experience_level: Database["public"]["Enums"]["experience_level"];
          expires_at: string | null;
          id: string;
          job_type: Database["public"]["Enums"]["job_type"];
          pay_range_high: number | null;
          pay_range_low: number | null;
          pay_unit: string | null;
          posted_at: string | null;
          schedule: string;
          specialties: Json | null;
          state: string;
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          arrangement?: string;
          category: string;
          city: string;
          commission_percent?: number | null;
          created_at?: string;
          description: string;
          employer_id: string;
          experience_level: Database["public"]["Enums"]["experience_level"];
          expires_at?: string | null;
          id?: string;
          job_type: Database["public"]["Enums"]["job_type"];
          pay_range_high?: number | null;
          pay_range_low?: number | null;
          pay_unit?: string | null;
          posted_at?: string | null;
          schedule?: string;
          specialties?: Json | null;
          state: string;
          status?: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          arrangement?: string;
          category?: string;
          city?: string;
          commission_percent?: number | null;
          created_at?: string;
          description?: string;
          employer_id?: string;
          experience_level?: Database["public"]["Enums"]["experience_level"];
          expires_at?: string | null;
          id?: string;
          job_type?: Database["public"]["Enums"]["job_type"];
          pay_range_high?: number | null;
          pay_range_low?: number | null;
          pay_unit?: string | null;
          posted_at?: string | null;
          schedule?: string;
          specialties?: Json | null;
          state?: string;
          status?: Database["public"]["Enums"]["job_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_posts_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employer_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          employer_id: string;
          id: string;
          job_post_id: string;
          stripe_payment_id: string;
          type: Database["public"]["Enums"]["payment_type"];
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          created_at?: string;
          employer_id: string;
          id?: string;
          job_post_id: string;
          stripe_payment_id: string;
          type: Database["public"]["Enums"]["payment_type"];
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          employer_id?: string;
          id?: string;
          job_post_id?: string;
          stripe_payment_id?: string;
          type?: Database["public"]["Enums"]["payment_type"];
        };
        Relationships: [
          {
            foreignKeyName: "payments_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employer_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_job_post_id_fkey";
            columns: ["job_post_id"];
            isOneToOne: false;
            referencedRelation: "job_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          profile_complete: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          profile_complete?: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          profile_complete?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      seeker_profiles: {
        Row: {
          bio: string | null;
          city: string | null;
          contact_email: string | null;
          created_at: string;
          headline: string | null;
          id: string;
          instagram_handle: string | null;
          open_to_work: boolean;
          phone: string | null;
          portfolio_url: string | null;
          resume_url: string | null;
          specialties: Json | null;
          state: string | null;
          updated_at: string;
          user_id: string;
          years_experience: number | null;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          city?: string | null;
          contact_email?: string | null;
          created_at?: string;
          headline?: string | null;
          id?: string;
          instagram_handle?: string | null;
          open_to_work?: boolean;
          phone?: string | null;
          portfolio_url?: string | null;
          resume_url?: string | null;
          specialties?: Json | null;
          state?: string | null;
          updated_at?: string;
          user_id: string;
          years_experience?: number | null;
        };
        Update: {
          bio?: string | null;
          city?: string | null;
          contact_email?: string | null;
          created_at?: string;
          headline?: string | null;
          id?: string;
          instagram_handle?: string | null;
          open_to_work?: boolean;
          phone?: string | null;
          portfolio_url?: string | null;
          resume_url?: string | null;
          specialties?: Json | null;
          state?: string | null;
          updated_at?: string;
          user_id?: string;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "seeker_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      applied_to_job: { Args: { job_id: string }; Returns: boolean };
      can_read_resume: { Args: { path: string }; Returns: boolean };
      can_review_applicant: {
        Args: { applicant_user: string };
        Returns: boolean;
      };
      has_role: {
        Args: { expected: Database["public"]["Enums"]["user_role"] };
        Returns: boolean;
      };
      owns_application: { Args: { application: string }; Returns: boolean };
      owns_job: { Args: { job_id: string }; Returns: boolean };
      resume_submitted: { Args: { path: string }; Returns: boolean };
      search_jobs: {
        Args: { industry?: string; keyword?: string };
        Returns: {
          arrangement: string;
          category: string;
          city: string;
          commission_percent: number | null;
          created_at: string;
          description: string;
          employer_id: string;
          experience_level: Database["public"]["Enums"]["experience_level"];
          expires_at: string | null;
          id: string;
          job_type: Database["public"]["Enums"]["job_type"];
          pay_range_high: number | null;
          pay_range_low: number | null;
          pay_unit: string | null;
          posted_at: string | null;
          schedule: string;
          specialties: Json | null;
          state: string;
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "job_posts";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      set_job_status: {
        Args: {
          job_id: string;
          new_status: Database["public"]["Enums"]["job_status"];
        };
        Returns: undefined;
      };
      submit_application: {
        Args: {
          applicant_name: string;
          email: string;
          file_name: string;
          file_path: string;
          job_id: string;
          letter: string;
          telephone: string;
        };
        Returns: string;
      };
    };
    Enums: {
      application_status:
        "submitted" | "reviewed" | "interview" | "rejected" | "hired";
      experience_level: "entry" | "mid" | "senior";
      job_status: "draft" | "active" | "closed";
      job_type: "booth_rental" | "commission" | "salary" | "hourly";
      payment_type: "single_post";
      user_role: "employer" | "seeker";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "submitted",
        "reviewed",
        "interview",
        "rejected",
        "hired",
      ],
      experience_level: ["entry", "mid", "senior"],
      job_status: ["draft", "active", "closed"],
      job_type: ["booth_rental", "commission", "salary", "hourly"],
      payment_type: ["single_post"],
      user_role: ["employer", "seeker"],
    },
  },
} as const;
