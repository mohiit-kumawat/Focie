export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences?: Json;
  created_at: string;
  updated_at: string;
}

export interface StudyDaySettings {
  id: string;
  user_id: string;
  timezone: string;
  day_start_time: string; // e.g. "06:00"
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export type SessionState = 'active' | 'paused' | 'completed';

export interface StudySession {
  id: string;
  user_id: string;
  state: SessionState;
  started_at: string;
  paused_at: string | null;
  ended_at: string | null;
  accumulated_seconds: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionSegment {
  id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
      };
      study_day_settings: {
        Row: StudyDaySettings;
        Insert: Partial<StudyDaySettings> & { user_id: string };
        Update: Partial<StudyDaySettings>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Partial<StudySession> & { user_id: string; started_at: string };
        Update: Partial<StudySession>;
      };
      study_session_segments: {
        Row: StudySessionSegment;
        Insert: Partial<StudySessionSegment> & {
          session_id: string;
          user_id: string;
          started_at: string;
          ended_at: string;
          duration_seconds: number;
        };
        Update: Partial<StudySessionSegment>;
      };
      friendships: {
        Row: Friendship;
        Insert: Partial<Friendship> & { requester_id: string; recipient_id: string };
        Update: Partial<Friendship>;
      };
    };
  };
}
