export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          pin_hash: string
          role: 'student' | 'teacher'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nickname: string
          pin_hash: string
          role: 'student' | 'teacher'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          pin_hash?: string
          role?: 'student' | 'teacher'
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_classes: {
        Row: {
          id: string
          user_id: string
          class_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          joined_at?: string
        }
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          mode: 'free' | 'weakness'
          started_at: string
          ended_at: string | null
          total_score: number
          max_combo: number
        }
        Insert: {
          id?: string
          user_id: string
          mode: 'free' | 'weakness'
          started_at?: string
          ended_at?: string | null
          total_score?: number
          max_combo?: number
        }
        Update: {
          id?: string
          user_id?: string
          mode?: 'free' | 'weakness'
          started_at?: string
          ended_at?: string | null
          total_score?: number
          max_combo?: number
        }
      }
      question_logs: {
        Row: {
          id: string
          session_id: string
          user_id: string
          operation: 'add' | 'subtract'
          first_number: number
          second_number: number
          correct_answer: number
          user_answer: number | null
          has_carry: boolean
          has_borrow: boolean
          is_correct: boolean
          response_time_ms: number
          combo_at_answer: number
          answered_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          operation: 'add' | 'subtract'
          first_number: number
          second_number: number
          correct_answer: number
          user_answer?: number | null
          has_carry?: boolean
          has_borrow?: boolean
          is_correct: boolean
          response_time_ms: number
          combo_at_answer?: number
          answered_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          operation?: 'add' | 'subtract'
          first_number?: number
          second_number?: number
          correct_answer?: number
          user_answer?: number | null
          has_carry?: boolean
          has_borrow?: boolean
          is_correct?: boolean
          response_time_ms?: number
          combo_at_answer?: number
          answered_at?: string
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_value: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_value: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_value?: string
          earned_at?: string
        }
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
  }
}
