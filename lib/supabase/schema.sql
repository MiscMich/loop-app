-- Loop App Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE content_type AS ENUM ('doodle', 'photo', 'mood', 'voice', 'game');
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'finished');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  apple_id TEXT UNIQUE,
  current_mood TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$')
);

-- Friendships (bidirectional)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friend_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure no duplicate friendships
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  -- Prevent self-friendship
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Friend groups
CREATE TABLE friend_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES friend_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- Content (doodles, photos, moods, voice notes, game invites)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type content_type NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent sending to self
  CONSTRAINT no_self_content CHECK (sender_id != recipient_id)
);

-- Content reactions
CREATE TABLE content_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One reaction per user per content
  CONSTRAINT unique_reaction UNIQUE (content_id, user_id)
);

-- Games (Tic-Tac-Toe)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT DEFAULT 'tictactoe' NOT NULL,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board JSONB DEFAULT '[null,null,null,null,null,null,null,null,null]' NOT NULL,
  current_turn UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status game_status DEFAULT 'waiting' NOT NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent playing against self
  CONSTRAINT no_self_game CHECK (player1_id != player2_id)
);

-- Game moves
CREATE TABLE game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 8),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_content_sender ON content(sender_id);
CREATE INDEX idx_content_recipient ON content(recipient_id);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_games_player1 ON games(player1_id);
CREATE INDEX idx_games_player2 ON games(player2_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_apple_id ON users(apple_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view friend profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = users.id)
           OR (friend_id = auth.uid() AND user_id = users.id))
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend groups policies
CREATE POLICY "Users can view groups they belong to"
  ON friend_groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = friend_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON friend_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON friend_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON friend_groups FOR DELETE
  USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Users can view group memberships"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM friend_groups
      WHERE id = group_members.group_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Group creators can manage members"
  ON group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE id = group_members.group_id AND created_by = auth.uid()
    )
  );

-- Content policies
CREATE POLICY "Users can view content sent to them"
  ON content FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view content they sent"
  ON content FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can send content to friends"
  ON content FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = recipient_id)
           OR (friend_id = auth.uid() AND user_id = recipient_id))
    )
  );

CREATE POLICY "Recipients can update viewed_at"
  ON content FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Senders can delete their content"
  ON content FOR DELETE
  USING (auth.uid() = sender_id);

-- Content reactions policies
CREATE POLICY "Users can view reactions on content they can see"
  ON content_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE id = content_reactions.content_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can react to content sent to them"
  ON content_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM content
      WHERE id = content_id AND recipient_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their reactions"
  ON content_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Games policies
CREATE POLICY "Players can view their games"
  ON games FOR SELECT
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create games with friends"
  ON games FOR INSERT
  WITH CHECK (
    auth.uid() = player1_id
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = player2_id)
           OR (friend_id = auth.uid() AND user_id = player2_id))
    )
  );

CREATE POLICY "Players can update their games"
  ON games FOR UPDATE
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Game moves policies
CREATE POLICY "Players can view moves in their games"
  ON game_moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE id = game_moves.game_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Players can make moves in their games"
  ON game_moves FOR INSERT
  WITH CHECK (
    auth.uid() = player_id
    AND EXISTS (
      SELECT 1 FROM games
      WHERE id = game_id
      AND current_turn = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get friends with user details
CREATE OR REPLACE FUNCTION get_friends(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status friend_status,
  added_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  current_mood TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    f.status,
    f.created_at as added_at,
    u.last_active,
    u.current_mood
  FROM friendships f
  JOIN users u ON (
    CASE
      WHEN f.user_id = user_uuid THEN f.friend_id = u.id
      ELSE f.user_id = u.id
    END
  )
  WHERE (f.user_id = user_uuid OR f.friend_id = user_uuid)
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content feed
CREATE OR REPLACE FUNCTION get_feed(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  type content_type,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  recipient_id UUID,
  created_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.type,
    c.sender_id,
    u.display_name as sender_name,
    u.avatar_url as sender_avatar,
    c.recipient_id,
    c.created_at,
    c.viewed_at,
    c.data
  FROM content c
  JOIN users u ON c.sender_id = u.id
  WHERE c.recipient_id = user_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_active = NOW() WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friend_groups_updated_at
  BEFORE UPDATE ON friend_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Run these in the Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('avatars', 'avatars', true),
--   ('doodles', 'doodles', true),
--   ('photos', 'photos', true),
--   ('voice-notes', 'voice-notes', false);

-- Storage policies (run after creating buckets)
--
-- -- Avatars (public read, authenticated write)
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
--
-- CREATE POLICY "Users can upload their own avatars"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'avatars'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY "Users can update their own avatars"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'avatars'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- -- Doodles & Photos (public)
-- CREATE POLICY "Content images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id IN ('doodles', 'photos'));
--
-- CREATE POLICY "Users can upload content images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id IN ('doodles', 'photos')
--     AND auth.uid() IS NOT NULL
--   );
--
-- -- Voice notes (private, only sender/recipient can access)
-- CREATE POLICY "Voice notes require authentication"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'voice-notes'
--     AND auth.uid() IS NOT NULL
--   );
--
-- CREATE POLICY "Users can upload voice notes"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'voice-notes'
--     AND auth.uid() IS NOT NULL
--   );
