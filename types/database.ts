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

export type UserWallet = {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: "earned_focus" | "gift_sent" | "gift_received" | "bonus" | "welcome";
  reference_id: string | null;
  idempotency_key: string | null;
  created_at: string;
};

export type GiftItem = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  coin_price: number;
  is_active: boolean;
  created_at: string;
};

export type GiftTransfer = {
  id: string;
  sender_id: string;
  recipient_id: string;
  gift_id: string;
  note: string | null;
  created_at: string;
};

export type StudyRoom = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  invite_code: string;
  created_at: string;
  updated_at: string;
};

export type RoomMember = {
  id: string;
  room_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type CompanionStage = "sprout" | "seedling" | "bloom" | "evergreen" | "celestial";
export type CompanionCosmetic =
  | "default"
  | "headphones"
  | "quill"
  | "tea_cup"
  | "sakura_crown"
  | "royal_crown"
  | "wizard_hat";

export type CompanionProfile = {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  current_stage: CompanionStage;
  equipped_cosmetic: CompanionCosmetic;
  created_at: string;
  updated_at: string;
};

export type UserCosmetic = {
  id: string;
  user_id: string;
  cosmetic_id: CompanionCosmetic;
  unlocked_via: "milestone" | "gift" | "default";
  unlocked_at: string;
};

export type NotificationType =
  | "gift_received"
  | "friend_request"
  | "friend_accepted"
  | "milestone_unlocked"
  | "room_invite"
  | "level_up";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Json;
  is_read: boolean;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  sound_effects: boolean;
  activity_visibility: "public" | "friends" | "private";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  reduced_motion: boolean;
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
      user_wallets: {
        Row: UserWallet;
        Insert: Partial<UserWallet> & { user_id: string };
        Update: Partial<UserWallet>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: Partial<WalletTransaction> & { user_id: string; amount: number; type: WalletTransaction["type"] };
        Update: Partial<WalletTransaction>;
        Relationships: [];
      };
      gift_catalog: {
        Row: GiftItem;
        Insert: GiftItem;
        Update: Partial<GiftItem>;
        Relationships: [];
      };
      gift_transfers: {
        Row: GiftTransfer;
        Insert: Partial<GiftTransfer> & { sender_id: string; recipient_id: string; gift_id: string };
        Update: Partial<GiftTransfer>;
        Relationships: [];
      };
      study_rooms: {
        Row: StudyRoom;
        Insert: Partial<StudyRoom> & { owner_id: string; name: string };
        Update: Partial<StudyRoom>;
        Relationships: [];
      };
      room_members: {
        Row: RoomMember;
        Insert: Partial<RoomMember> & { room_id: string; user_id: string };
        Update: Partial<RoomMember>;
        Relationships: [];
      };
      room_messages: {
        Row: RoomMessage;
        Insert: Partial<RoomMessage> & { room_id: string; sender_id: string; content: string };
        Update: Partial<RoomMessage>;
        Relationships: [];
      };
      companion_profiles: {
        Row: CompanionProfile;
        Insert: Partial<CompanionProfile> & { user_id: string };
        Update: Partial<CompanionProfile>;
        Relationships: [];
      };
      user_cosmetics: {
        Row: UserCosmetic;
        Insert: Partial<UserCosmetic> & { user_id: string; cosmetic_id: CompanionCosmetic };
        Update: Partial<UserCosmetic>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; type: NotificationType; title: string; message: string };
        Update: Partial<Notification>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettings;
        Insert: Partial<UserSettings> & { user_id: string };
        Update: Partial<UserSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
