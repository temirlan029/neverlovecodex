-- Migration v2: XP/уровни + лог модерации

-- Добавить XP и уровень в members
ALTER TABLE members ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS level INT DEFAULT 0;

-- Лог модерации
CREATE TABLE IF NOT EXISTS mod_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discord_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'ban', 'unban', 'kick', 'timeout'
  reason TEXT,
  moderator_id TEXT,
  moderator_name TEXT,
  duration_seconds INT,           -- для timeout
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mod_log_user ON mod_log(discord_id);
CREATE INDEX IF NOT EXISTS idx_mod_log_action ON mod_log(action);
