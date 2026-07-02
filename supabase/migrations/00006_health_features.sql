-- Health Scores table
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  bmi_score INTEGER CHECK (bmi_score >= 0 AND bmi_score <= 100),
  activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
  sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  heart_rate_score INTEGER CHECK (heart_rate_score >= 0 AND heart_rate_score <= 100),
  factors JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health scores"
  ON health_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health scores"
  ON health_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_health_scores_user ON health_scores(user_id);
CREATE INDEX idx_health_scores_date ON health_scores(calculated_at DESC);

-- Messages / Provider Chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Health sync data (Apple Health / Google Fit)
CREATE TABLE health_sync_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('apple_health', 'google_fit', 'manual')),
  data_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_sync_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health sync data"
  ON health_sync_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health sync data"
  ON health_sync_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_health_sync_user ON health_sync_data(user_id);
CREATE INDEX idx_health_sync_type ON health_sync_data(data_type);
CREATE INDEX idx_health_sync_recorded ON health_sync_data(recorded_at DESC);

-- Add onboarding_completed to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add biometric_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE;
