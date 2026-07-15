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
      brands: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      perfumers: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      fragrances: {
        Row: {
          id: string
          brand_id: string
          name: string
          slug: string
          type: string | null
          concentration: concentration | null
          launch_year: number | null
          rating_average: number | null
          rating_count: number | null
          source: import_source
          external_id: string | null
          external_url: string | null
          import_hash: string
          raw_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          slug: string
          type?: string | null
          concentration?: concentration | null
          launch_year?: number | null
          rating_average?: number | null
          rating_count?: number | null
          source: import_source
          external_id?: string | null
          external_url?: string | null
          import_hash: string
          raw_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          slug?: string
          type?: string | null
          concentration?: concentration | null
          launch_year?: number | null
          rating_average?: number | null
          rating_count?: number | null
          source?: import_source
          external_id?: string | null
          external_url?: string | null
          import_hash?: string
          raw_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      accords: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      fragrance_accords: {
        Row: {
          fragrance_id: string
          accord_id: string
          intensity: string | null
          created_at: string
        }
        Insert: {
          fragrance_id: string
          accord_id: string
          intensity?: string | null
          created_at?: string
        }
        Update: {
          fragrance_id?: string
          accord_id?: string
          intensity?: string | null
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      fragrance_notes: {
        Row: {
          fragrance_id: string
          note_id: string
          position: note_position
          intensity: string | null
          created_at: string
        }
        Insert: {
          fragrance_id: string
          note_id: string
          position: note_position
          intensity?: string | null
          created_at?: string
        }
        Update: {
          fragrance_id?: string
          note_id?: string
          position?: note_position
          intensity?: string | null
          created_at?: string
        }
      }
      fragrance_perfumers: {
        Row: {
          fragrance_id: string
          perfumer_id: string
          created_at: string
        }
        Insert: {
          fragrance_id: string
          perfumer_id: string
          created_at?: string
        }
        Update: {
          fragrance_id?: string
          perfumer_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
  }
}

export type import_source = 'parfumo'
export type concentration = 'EDT' | 'EDP' | 'Parfum' | 'Eau Fraiche' | 'Cologne' | 'Eau de Cologne' | 'Extrait' | 'Aftershave'
export type note_position = 'top' | 'heart' | 'base'