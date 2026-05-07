# NeverLove — Clan Website

> Сайт клана **NeverLove** для GTA V RP (Majestic Server) — авторизация через Discord, статистика, карты залазов, тактический редактор.

**Живая версия:** https://neverlovecodex.vercel.app/

---

## О проекте

Веб-приложение для клана в GTA V RP:

- **Участники** — список игроков с XP, уровнями, временем в войсе и количеством сообщений
- **Статистика** — графики активности по часам/дням, топы, облако слов, топ эмодзи
- **Доска позора** — 9 игровых рекордов (войс-чемпион, сова, марафонец, спамер дня и др.)
- **Карты Ban Ban Pink** — 14 локаций с точками и лайтбоксом
- **Тактический редактор** — Canvas с маркерами, стрелками, свободным рисованием
- **Training** — гайды и советы для новичков
- **Авторизация** — только через Discord OAuth2 с проверкой членства в гильде

## Стек

**Frontend**
- Next.js 16.2.4, React 19, TypeScript 5
- Tailwind CSS 4
- Canvas API (частицы на главной, тактический редактор)
- IntersectionObserver (fade-in анимации)
- Кастомные CSS-анимации: gradient-border, pulse-glow, shimmer, card-shine, xp-bar

**Backend / API**
- Next.js Route Handlers (`/api/*`)
- JWT-сессии через `jose` в httpOnly cookie (7 дней)
- Supabase (PostgreSQL) — сервис-роль

**Auth**
- Discord OAuth2 code flow
- Проверка членства в гильде (`DISCORD_GUILD_ID`)
- `proxy.ts` — редирект неавторизованных на `/login`

**Discord Bot (Python)**
- `discord.py`
- Сбор данных в Supabase: онлайн, войс-сессии, сообщения, XP, эмодзи, слова, инвайты, модерация
- Server snapshots каждые 5 минут
- Voice XP loop (каждую минуту всем в войсе)
- `presence_sync` через `asyncio.to_thread` с concurrency-лимитом, чтобы не блокировать event loop

**Deploy**
- Сайт → Vercel (`website/`)
- Бот → Railway (worker, `python -u main.py`)

## Структура

```
neverlovecodex/
├── website/                   # Next.js приложение
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/           # OAuth + data endpoints
│   │   │   ├── lib/           # session.ts, discord.ts, supabase.ts
│   │   │   ├── members/       # Участники
│   │   │   ├── shame/         # Доска позора
│   │   │   ├── maps/          # Карты Ban Ban Pink
│   │   │   ├── tactics/       # Тактический редактор
│   │   │   ├── stats/         # Статистика
│   │   │   ├── login/
│   │   │   └── page.tsx       # Главная (particles, counters)
│   │   ├── components/        # AuthProvider, Navbar, FadeIn, CountUp, Particles, Skeleton
│   │   └── proxy.ts           # Route protection
│   └── public/images/maps/    # 14 PNG скриншотов локаций
│
├── bot/                       # Discord bot
│   ├── main.py
│   ├── schema.sql
│   ├── migration_v2.sql       # XP/level + mod_log
│   └── migration_v3.sql       # invites, emoji_stats, word_stats
│
├── DEPLOYMENT.md
├── AGENTS.md
└── CODEX.md
```

## Локальный запуск

**Сайт:**
```bash
cd website
npm install
cp .env.local.example .env.local   # заполнить секреты
npm run dev                        # http://localhost:3000
npm run build                      # production build
npm run lint                       # ESLint
```

**Бот:**
```bash
cd bot
pip install -r requirements.txt
# создать .env с BOT_TOKEN + Supabase креды
python -u main.py
```

## Переменные окружения

**Сайт (`website/.env.local`):**

| Переменная | Назначение |
|---|---|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth2 |
| `DISCORD_REDIRECT_URI` | callback URL (`/api/auth/discord/callback`) |
| `DISCORD_GUILD_ID` | ID Discord-сервера (для проверки членства) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase-проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role JWT |
| `SESSION_SECRET` | ключ подписи JWT (`openssl rand -base64 32`) |

Полный список и workflow деплоя — в [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Supabase-таблицы

- `users` — OAuth-пользователи сайта
- `members` — участники Discord (xp, level, roles, is_online, is_in_voice, avatar_url)
- `message_stats` — счётчик сообщений по дням
- `voice_sessions` — войс-сессии (`duration_minutes` — generated column)
- `server_snapshots` — снапшоты онлайна каждые 5 мин
- `quotes` — случайные цитаты из чата
- `mod_log` — лог модерации
- `invites` — инвайт-трекинг
- `emoji_stats` / `word_stats` — топ эмодзи и облако слов

Полные схемы — в `bot/schema.sql`, `bot/migration_v2.sql`, `bot/migration_v3.sql`.

## API (сайт)

| Endpoint | Назначение |
|---|---|
| `GET /api/auth/discord` | редирект на OAuth2 |
| `GET /api/auth/discord/callback` | обработка code, выдача JWT |
| `GET /api/auth/me` | текущий пользователь |
| `GET /api/auth/logout` | сброс сессии |
| `GET /api/members` | все участники с XP/level/voice/messages |
| `GET /api/stats` | активность, топы, эмодзи, облако слов, инвайтеры |
| `GET /api/shame` | 9 рекордов + топ-10 войс/сообщений |
| `GET /api/quotes` | случайная цитата |

## Автор

**Карлыбай Темирлан** — [@temirlan029](https://github.com/temirlan029)
