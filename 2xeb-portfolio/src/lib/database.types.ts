// Database types for Supabase
// Run `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
// to regenerate after schema changes. Structure mirrors the Supabase CLI output so the
// typed client (`createClient<Database>`) resolves Insert/Update payloads correctly.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      projects: {
        Row: {
          id: number;
          slug: string;
          title: string;
          short_desc: string;
          long_desc: string | null;
          primary_discipline: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID';
          tags: string[];
          created_at: string;
          video_url: string | null;
          image_url: string | null;
          status: 'live' | 'wip' | null;
          is_external: boolean;
          external_url: string | null;
          role: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          title: string;
          short_desc: string;
          long_desc?: string | null;
          primary_discipline: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID';
          tags?: string[];
          created_at: string;
          video_url?: string | null;
          image_url?: string | null;
          status?: 'live' | 'wip' | null;
          is_external?: boolean;
          external_url?: string | null;
          role?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          title?: string;
          short_desc?: string;
          long_desc?: string | null;
          primary_discipline?: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID';
          tags?: string[];
          created_at?: string;
          video_url?: string | null;
          image_url?: string | null;
          status?: 'live' | 'wip' | null;
          is_external?: boolean;
          external_url?: string | null;
          role?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      experience: {
        Row: {
          id: number;
          company: string;
          role: string;
          date_range: string;
          location: string;
          description: string | null;
          skills: string[];
          type: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID' | 'OTHER';
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          company: string;
          role: string;
          date_range: string;
          location: string;
          description?: string | null;
          skills?: string[];
          type: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID' | 'OTHER';
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          company?: string;
          role?: string;
          date_range?: string;
          location?: string;
          description?: string | null;
          skills?: string[];
          type?: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID' | 'OTHER';
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_studies: {
        Row: {
          id: number;
          slug: string;
          title: string;
          subtitle: string;
          problem: string;
          solution: string;
          tech_stack: string[];
          architecture: string | null;
          lessons: string[];
          updated_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          title: string;
          subtitle: string;
          problem: string;
          solution: string;
          tech_stack?: string[];
          architecture?: string | null;
          lessons?: string[];
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          title?: string;
          subtitle?: string;
          problem?: string;
          solution?: string;
          tech_stack?: string[];
          architecture?: string | null;
          lessons?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      case_study_timeline: {
        Row: {
          id: number;
          case_study_id: number;
          title: string;
          description: string;
          event_type: 'decision' | 'milestone' | 'challenge' | 'learning';
          sort_order: number;
        };
        Insert: {
          id?: number;
          case_study_id: number;
          title: string;
          description: string;
          event_type: 'decision' | 'milestone' | 'challenge' | 'learning';
          sort_order?: number;
        };
        Update: {
          id?: number;
          case_study_id?: number;
          title?: string;
          description?: string;
          event_type?: 'decision' | 'milestone' | 'challenge' | 'learning';
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'case_study_timeline_case_study_id_fkey';
            columns: ['case_study_id'];
            isOneToOne: false;
            referencedRelation: 'case_studies';
            referencedColumns: ['id'];
          },
        ];
      };
      case_study_results: {
        Row: {
          id: number;
          case_study_id: number;
          metric: string;
          value: string;
          description: string;
          sort_order: number;
        };
        Insert: {
          id?: number;
          case_study_id: number;
          metric: string;
          value: string;
          description: string;
          sort_order?: number;
        };
        Update: {
          id?: number;
          case_study_id?: number;
          metric?: string;
          value?: string;
          description?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'case_study_results_case_study_id_fkey';
            columns: ['case_study_id'];
            isOneToOne: false;
            referencedRelation: 'case_studies';
            referencedColumns: ['id'];
          },
        ];
      };
      page_content: {
        Row: {
          id: number;
          page_slug: string;
          content: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          page_slug: string;
          content: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          id?: number;
          page_slug?: string;
          content?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_index: {
        Row: {
          id: number;
          path: string;
          title: string;
          description: string;
          keywords: string[];
          sort_order: number;
        };
        Insert: {
          id?: number;
          path: string;
          title: string;
          description: string;
          keywords?: string[];
          sort_order?: number;
        };
        Update: {
          id?: number;
          path?: string;
          title?: string;
          description?: string;
          keywords?: string[];
          sort_order?: number;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          last_login?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          admin_id: string | null;
          action: 'CREATE' | 'UPDATE' | 'DELETE';
          table_name: string;
          record_id: string;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: 'CREATE' | 'UPDATE' | 'DELETE';
          table_name: string;
          record_id: string;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: 'CREATE' | 'UPDATE' | 'DELETE';
          table_name?: string;
          record_id?: string;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          message: string;
          reason: string | null;
          source_page: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          message: string;
          reason?: string | null;
          source_page?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          message?: string;
          reason?: string | null;
          source_page?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
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
