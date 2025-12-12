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
      achievement_rules: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description_key: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_key: string
          target_audience: string | null
          trigger_conditions: Json
          version: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description_key?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key: string
          target_audience?: string | null
          trigger_conditions: Json
          version?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description_key?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key?: string
          target_audience?: string | null
          trigger_conditions?: Json
          version?: number
        }
        Relationships: []
      }
      domains: {
        Row: {
          code: string
          created_at: string | null
          description_key: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_key: string
          sort_order: number | null
          subject_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description_key?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key: string
          sort_order?: number | null
          subject_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description_key?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key?: string
          sort_order?: number | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          answer: Json | null
          created_at: string | null
          exercise_id: string | null
          hints_used: number | null
          id: string
          is_correct: boolean
          student_id: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          answer?: Json | null
          created_at?: string | null
          exercise_id?: string | null
          hints_used?: number | null
          id?: string
          is_correct: boolean
          student_id?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          answer?: Json | null
          created_at?: string | null
          exercise_id?: string | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean
          student_id?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json
          created_at: string | null
          difficulty: number | null
          id: string
          is_ai_generated: boolean | null
          is_validated: boolean | null
          metadata: Json | null
          skill_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          difficulty?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_validated?: boolean | null
          metadata?: Json | null
          skill_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          difficulty?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_validated?: boolean | null
          metadata?: Json | null
          skill_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          correct_answers: number | null
          ended_at: string | null
          exercises_completed: number | null
          id: string
          skills_practiced: string[] | null
          started_at: string | null
          student_id: string | null
        }
        Insert: {
          correct_answers?: number | null
          ended_at?: string | null
          exercises_completed?: number | null
          id?: string
          skills_practiced?: string[] | null
          started_at?: string | null
          student_id?: string | null
        }
        Update: {
          correct_answers?: number | null
          ended_at?: string | null
          exercises_completed?: number | null
          id?: string
          skills_practiced?: string[] | null
          started_at?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notifications: {
        Row: {
          body_key: string
          context: Json | null
          created_at: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          parent_id: string | null
          student_id: string | null
          title_key: string
        }
        Insert: {
          body_key: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          parent_id?: string | null
          student_id?: string | null
          title_key: string
        }
        Update: {
          body_key?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          parent_id?: string | null
          student_id?: string | null
          title_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          code: string
          country_programs: string[] | null
          created_at: string | null
          description_key: string | null
          difficulty_level: number | null
          domain_id: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          name_key: string
          prerequisites: string[] | null
          sort_order: number | null
        }
        Insert: {
          code: string
          country_programs?: string[] | null
          created_at?: string | null
          description_key?: string | null
          difficulty_level?: number | null
          domain_id?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name_key: string
          prerequisites?: string[] | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          country_programs?: string[] | null
          created_at?: string | null
          description_key?: string | null
          difficulty_level?: number | null
          domain_id?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name_key?: string
          prerequisites?: string[] | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          avatar_url: string | null
          birth_year: number | null
          country_program: string | null
          created_at: string | null
          display_name: string
          id: string
          preferred_language: string | null
          preferred_method: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_year?: number | null
          country_program?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          preferred_language?: string | null
          preferred_method?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_year?: number | null
          country_program?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          preferred_language?: string | null
          preferred_method?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skill_progress: {
        Row: {
          attempts_count: number | null
          correct_count: number | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          mastered_at: string | null
          mastery_level: number | null
          skill_id: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          attempts_count?: number | null
          correct_count?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastered_at?: string | null
          mastery_level?: number | null
          skill_id?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts_count?: number | null
          correct_count?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastered_at?: string | null
          mastery_level?: number | null
          skill_id?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skill_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_key: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      user_ai_settings: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          current_daily_usage: number | null
          current_monthly_usage: number | null
          daily_limit: number | null
          id: string
          is_key_valid: boolean | null
          last_reset_daily: string | null
          last_reset_monthly: string | null
          last_validated_at: string | null
          monthly_limit: number | null
          preferred_model: string | null
          provider: string | null
          updated_at: string | null
          usage_this_month: number | null
          user_id: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          current_daily_usage?: number | null
          current_monthly_usage?: number | null
          daily_limit?: number | null
          id?: string
          is_key_valid?: boolean | null
          last_reset_daily?: string | null
          last_reset_monthly?: string | null
          last_validated_at?: string | null
          monthly_limit?: number | null
          preferred_model?: string | null
          provider?: string | null
          updated_at?: string | null
          usage_this_month?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          current_daily_usage?: number | null
          current_monthly_usage?: number | null
          daily_limit?: number | null
          id?: string
          is_key_valid?: boolean | null
          last_reset_daily?: string | null
          last_reset_monthly?: string | null
          last_validated_at?: string | null
          monthly_limit?: number | null
          preferred_model?: string | null
          provider?: string | null
          updated_at?: string | null
          usage_this_month?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
