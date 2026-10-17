export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences?: Json;
  created_at: string;
  updated_at: string;
};

export type StudyDaySettings = {
  id: string;
  user_id: string;
  timezone: string;
  day_start_time: string; // e.g. "06:00:00"
  effective_from: string;
  created_at: string;
  updated_at: string;
};

export type SessionState = "active" | "paused" | "completed";
export type SessionMode = "pomodoro" | "stopwatch";

export type StudySession = {
  id: string;
  user_id: string;
  state: SessionState;
  mode: SessionMode;
  target_minutes: number;
  subject_tag: string;
  started_at: string;
  paused_at: string | null;
  ended_at: string | null;
  accumulated_seconds: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySessionSegment = {
  id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      study_day_settings: {
        Row: StudyDaySettings;
        Insert: Partial<StudyDaySettings> & { user_id: string };
        Update: Partial<StudyDaySettings>;
        Relationships: [];
      };
      study_sessions: {
        Row: StudySession;
        Insert: Partial<StudySession> & { user_id: string; started_at: string };
        Update: Partial<StudySession>;
        Relationships: [];
      };
      study_session_segments: {
        Row: StudySessionSegment;
        Insert: Partial<StudySessionSegment> & {
          session_id: string;
          user_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_seconds?: number;
        };
        Update: Partial<StudySessionSegment>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Partial<Friendship> & { requester_id: string; recipient_id: string };
        Update: Partial<Friendship>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
