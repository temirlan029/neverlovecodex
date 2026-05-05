-- Участники сервера
CREATE TABLE members (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  roles TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  is_in_voice BOOLEAN DEFAULT false,
  voice_channel TEXT,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Счётчик сообщений (по дням)
CREATE TABLE message_stats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discord_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  message_count INT DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(discord_id, channel_name, date)
);

-- Войс-сессии
CREATE TABLE voice_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discord_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE WHEN left_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (left_at - joined_at))::INT / 60
      ELSE NULL
    END
  ) STORED
);

-- Снапшоты сервера (каждые 5 минут)
CREATE TABLE server_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  online_count INT DEFAULT 0,
  voice_count INT DEFAULT 0,
  total_members INT DEFAULT 0,
  hour INT NOT NULL,
  day_of_week INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Случайные цитаты из чата
CREATE TABLE quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрых запросов
CREATE INDEX idx_message_stats_date ON message_stats(date);
CREATE INDEX idx_message_stats_user ON message_stats(discord_id);
CREATE INDEX idx_voice_sessions_user ON voice_sessions(discord_id);
CREATE INDEX idx_voice_sessions_joined ON voice_sessions(joined_at);
CREATE INDEX idx_server_snapshots_time ON server_snapshots(created_at);
