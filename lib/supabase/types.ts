// Database types for Supabase
// Generated from schema.sql - update when schema changes
// Note: All tables use 'loop_' prefix to avoid conflicts with existing database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentType = 'doodle' | 'photo' | 'mood' | 'voice' | 'game';
export type FriendStatus = 'pending' | 'accepted' | 'blocked';
export type GameStatus = 'waiting' | 'active' | 'finished';

export interface Database {
  public: {
    Tables: {
      loop_users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          email: string | null;
          apple_id: string | null;
          created_at: string;
          updated_at: string;
          last_active: string | null;
          current_mood: string | null;
          push_token: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
          apple_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string | null;
          current_mood?: string | null;
          push_token?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
          apple_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string | null;
          current_mood?: string | null;
          push_token?: string | null;
        };
        Relationships: [];
      };
      loop_friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: FriendStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: FriendStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: FriendStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_friendships_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_friendships_friend_id_fkey';
            columns: ['friend_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_friend_groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_friend_groups_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'loop_friend_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_group_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_content: {
        Row: {
          id: string;
          type: ContentType;
          sender_id: string;
          recipient_id: string;
          created_at: string;
          viewed_at: string | null;
          data: Json;
        };
        Insert: {
          id?: string;
          type: ContentType;
          sender_id: string;
          recipient_id: string;
          created_at?: string;
          viewed_at?: string | null;
          data: Json;
        };
        Update: {
          id?: string;
          type?: ContentType;
          sender_id?: string;
          recipient_id?: string;
          created_at?: string;
          viewed_at?: string | null;
          data?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_content_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_content_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_content_reactions: {
        Row: {
          id: string;
          content_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_content_reactions_content_id_fkey';
            columns: ['content_id'];
            referencedRelation: 'loop_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_content_reactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_games: {
        Row: {
          id: string;
          game_type: string;
          player1_id: string;
          player2_id: string;
          board: Json;
          current_turn: string;
          status: GameStatus;
          winner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_type?: string;
          player1_id: string;
          player2_id: string;
          board?: Json;
          current_turn: string;
          status?: GameStatus;
          winner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_type?: string;
          player1_id?: string;
          player2_id?: string;
          board?: Json;
          current_turn?: string;
          status?: GameStatus;
          winner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_games_player1_id_fkey';
            columns: ['player1_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_games_player2_id_fkey';
            columns: ['player2_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_games_current_turn_fkey';
            columns: ['current_turn'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_games_winner_id_fkey';
            columns: ['winner_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
      loop_game_moves: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loop_game_moves_game_id_fkey';
            columns: ['game_id'];
            referencedRelation: 'loop_games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loop_game_moves_player_id_fkey';
            columns: ['player_id'];
            referencedRelation: 'loop_users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      loop_get_friends: {
        Args: { user_uuid: string };
        Returns: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          status: FriendStatus;
          added_at: string;
          last_active: string | null;
          current_mood: string | null;
        }[];
      };
      loop_get_feed: {
        Args: { user_uuid: string; limit_count?: number };
        Returns: {
          id: string;
          type: ContentType;
          sender_id: string;
          sender_name: string;
          sender_avatar: string | null;
          recipient_id: string;
          created_at: string;
          viewed_at: string | null;
          data: Json;
        }[];
      };
    };
    Enums: {
      content_type: ContentType;
      friend_status: FriendStatus;
      game_status: GameStatus;
    };
  };
}

// Convenience type aliases (using loop_ prefixed table names)
export type User = Database['public']['Tables']['loop_users']['Row'];
export type UserInsert = Database['public']['Tables']['loop_users']['Insert'];
export type UserUpdate = Database['public']['Tables']['loop_users']['Update'];
export type Friendship = Database['public']['Tables']['loop_friendships']['Row'];
export type FriendGroup = Database['public']['Tables']['loop_friend_groups']['Row'];
export type GroupMember = Database['public']['Tables']['loop_group_members']['Row'];
export type Content = Database['public']['Tables']['loop_content']['Row'];
export type ContentInsert = Database['public']['Tables']['loop_content']['Insert'];
export type ContentReaction = Database['public']['Tables']['loop_content_reactions']['Row'];
export type Game = Database['public']['Tables']['loop_games']['Row'];
export type GameMove = Database['public']['Tables']['loop_game_moves']['Row'];

// Type for loop_content with joined sender data from relations
export interface ContentWithSender extends Content {
  sender: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// Content data types for JSONB field
export interface DoodleData {
  image_url: string;
  paths: string;
}

export interface PhotoData {
  image_url: string;
  caption?: string;
}

export interface MoodData {
  emoji: string;
  note?: string;
}

export interface VoiceData {
  audio_url: string;
  duration: number;
  waveform?: number[];
}

export interface GameData {
  game_type: string;
  game_id: string;
}
