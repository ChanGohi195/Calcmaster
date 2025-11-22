-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル（児童・教師）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname VARCHAR(50) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL, -- PINのハッシュ値
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クラステーブル
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーとクラスの関連テーブル
CREATE TABLE user_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, class_id)
);

-- 学習セッションテーブル
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('free', 'weakness')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_score INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0
);

-- 問題ログテーブル
CREATE TABLE question_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 問題データ
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('add', 'subtract')),
  first_number INTEGER NOT NULL,
  second_number INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL,
  user_answer INTEGER,

  -- 問題特性
  has_carry BOOLEAN DEFAULT FALSE,      -- 繰り上がり
  has_borrow BOOLEAN DEFAULT FALSE,     -- 繰り下がり

  -- 回答データ
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,    -- ミリ秒単位の回答時間
  combo_at_answer INTEGER DEFAULT 0,    -- 回答時のコンボ数

  -- タイムスタンプ
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- インデックス用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 達成記録テーブル（バッジ、レベルなど）
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_value VARCHAR(100) NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type, achievement_value)
);

-- インデックスの作成
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_user_classes_user_id ON user_classes(user_id);
CREATE INDEX idx_user_classes_class_id ON user_classes(class_id);
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_question_logs_session_id ON question_logs(session_id);
CREATE INDEX idx_question_logs_user_id ON question_logs(user_id);
CREATE INDEX idx_question_logs_operation ON question_logs(operation);
CREATE INDEX idx_question_logs_has_carry ON question_logs(has_carry);
CREATE INDEX idx_question_logs_has_borrow ON question_logs(has_borrow);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS ポリシーの設定

-- Users: 自分の情報のみ閲覧・更新可能
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Classes: 所属するクラスまたは担当するクラスのみ閲覧可能
CREATE POLICY "Users can view their classes" ON classes
  FOR SELECT USING (
    id IN (SELECT class_id FROM user_classes WHERE user_id = auth.uid()) OR
    teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can manage their classes" ON classes
  FOR ALL USING (teacher_id = auth.uid());

-- User Classes: 自分が所属するクラス情報のみ閲覧可能
CREATE POLICY "Users can view their class memberships" ON user_classes
  FOR SELECT USING (user_id = auth.uid());

-- Learning Sessions: 自分のセッションのみ閲覧・作成・更新可能
CREATE POLICY "Users can manage their own sessions" ON learning_sessions
  FOR ALL USING (user_id = auth.uid());

-- Question Logs: 自分のログのみ閲覧・作成可能
CREATE POLICY "Users can manage their own question logs" ON question_logs
  FOR ALL USING (user_id = auth.uid());

-- Achievements: 自分の達成記録のみ閲覧可能
CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT USING (user_id = auth.uid());

-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新日時トリガーの設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
