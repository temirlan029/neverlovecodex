-- Migration v3: Invite tracking, emoji stats, word cloud

-- Инвайт-трекинг
CREATE TABLE IF NOT EXISTS invites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inviter_id TEXT NOT NULL,          -- кто пригласил
  invited_id TEXT,                    -- кого пригласил (NULL если ещё не зашёл)
  invite_code TEXT NOT NULL,
  uses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);

-- Статистика эмодзи
CREATE TABLE IF NOT EXISTS emoji_stats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discord_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  count INT DEFAULT 1,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(discord_id, emoji, date)
);
CREATE INDEX IF NOT EXISTS idx_emoji_stats_emoji ON emoji_stats(emoji);

-- Облако слов (частые слова за день)
CREATE TABLE IF NOT EXISTS word_stats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word TEXT NOT NULL,
  count INT DEFAULT 1,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(word, date)
);
CREATE INDEX IF NOT EXISTS idx_word_stats_date ON word_stats(date);
