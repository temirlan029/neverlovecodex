# NeverLove — Clan Website

## Start Here

This file is the project memory. Read it before making changes.

Workspace copy for Codex: `C:\Users\tima\Desktop\neverlovecodex`

Current state:
- Website is mostly implemented: auth, members, stats, shame, maps, tactics.
- Discord bot collects live server data into Supabase.
- Site reads real Supabase data through Next.js API routes.
- Tactics currently save to localStorage only.
- Bot works. `presence_sync` was moved to non-blocking threaded Supabase updates, but other bot DB calls are still synchronous.
- Deployment package added: Vercel config for `website/`, Railway worker config for `bot/`, and `DEPLOYMENT.md` with env/update workflow.

Next priorities:
1. Connect GitHub repo(s), then deploy website to Vercel and bot to Railway.
2. Review remaining synchronous bot DB calls in high-traffic events (`on_message`, voice events, XP loop).
3. Add clan wars feature: results for up to 70 players + win/loss stats.
4. Move tactics sharing from localStorage to Supabase.

Agent rules:
- Work in `website/` for Next.js changes and `bot/` for Discord bot changes.
- Do not edit, print, or commit `.env` / `.env.local` secrets.
- Prefer small scoped changes. Do not rewrite the visual style unless requested.
- After website changes, run `npm run lint` and `npm run build`.
- After bot changes, run a syntax check or start with `python -u main.py` if credentials are available.
- For Next.js 16 behavior, check local `node_modules/next/dist/docs/` before assuming older patterns.
- Never manually set `voice_sessions.duration_minutes`; it is a generated DB column.

## About
Сайт клана **NeverLove** для GTA V RP (Majestic).

## Project Structure
```
website/
├── src/
│   ├── app/
│   │   ├── api/auth/discord/          # OAuth2 login redirect
│   │   ├── api/auth/discord/callback/ # OAuth2 callback
│   │   ├── api/auth/logout/           # Session destroy
│   │   ├── api/auth/me/               # Current user info
│   │   ├── api/members/route.ts       # Members API (XP, level, voice, messages)
│   │   ├── api/stats/route.ts         # Stats API (online, snapshots, activity, top)
│   │   ├── api/quotes/route.ts        # Random quote API
│   │   ├── api/shame/route.ts         # Shame API (records, top voice/msg)
│   │   ├── lib/
│   │   │   ├── session.ts             # JWT session (jose, cookies)
│   │   │   ├── discord.ts             # Discord API helpers
│   │   │   └── supabase.ts            # Supabase client (service role)
│   │   ├── login/page.tsx             # Login page
│   │   ├── members/page.tsx           # Участники (top-3 cards, XP bars, table)
│   │   ├── shame/page.tsx             # Доска позора (9 records, top voice/msg)
│   │   ├── maps/page.tsx              # Карты Ban Ban Pink
│   │   ├── tactics/page.tsx           # Тактический редактор
│   │   ├── stats/page.tsx             # Статистика (charts, top messagers, emojis, word cloud, inviters)
│   │   ├── layout.tsx                 # Root layout (AuthProvider)
│   │   ├── globals.css                # Theme, animations, effects
│   │   └── page.tsx                   # Главная (particles, counters, online)
│   ├── components/
│   │   ├── AuthProvider.tsx            # React context (user state, login/logout)
│   │   ├── Navbar.tsx                  # Nav with auth (avatar, dropdown)
│   │   ├── FadeIn.tsx                  # IntersectionObserver fade-in animations
│   │   ├── CountUp.tsx                 # Animated number counter
│   │   ├── Particles.tsx               # Canvas particle animation (hero)
│   │   ├── Footer.tsx
│   │   └── Skeleton.tsx                # Loading skeletons (named export: { Skeleton })
│   └── proxy.ts                        # Route protection (Next.js 16 proxy)
├── public/images/
│   ├── logo.png                        # Clan logo (unoptimized, from Downloads)
│   └── maps/                           # 14 PNG map screenshots
└── .env.local                          # Secrets (Discord, Supabase, session)

bot/
├── main.py                             # Discord bot (discord.py)
├── .env                                # Bot token & Supabase creds
├── schema.sql                          # Initial DB schema
├── migration_v2.sql                    # XP/level columns + mod_log table
└── migration_v3.sql                    # invites, emoji_stats, word_stats tables
```

## Dev Commands
```bash
cd website
npm run dev          # Dev server (default port 3000)
npm run build        # Production build
npm run lint         # ESLint

cd bot
python -u main.py    # Run bot (unbuffered output)
```

## Features

### DONE

#### UI/Frontend
- [x] Все 7 страниц с реальными данными из Supabase
- [x] Fade-in анимации при скролле (IntersectionObserver)
- [x] Hover-эффекты: card-shine, scale, translate, ring glow
- [x] Navbar: scroll shadow, мобильное меню с stagger-анимацией
- [x] Skeleton/loading states
- [x] Графики статистики с тултипами (тепловая карта, бар-чарты)
- [x] Canvas Particles на hero-секции (мерцающие частицы + линии-связи)
- [x] CountUp — анимированные каунтеры чисел (ease-out cubic)
- [x] CSS анимации: gradient-border, float, pulse-glow, shimmer, card-shine, status-pulse, xp-bar, text-gradient

#### Карты Ban Ban Pink
- [x] 14 PNG скриншотов из Google Sheets в public/images/maps/
- [x] Страница /maps с лайтбоксом (fullscreen просмотр)
- [x] Файлы: церковь.png, завод.png, кейшоп.png, пирс.png, миррор.png, тату.png, сендик.png, бизвар.png, витряки.png, яки.png, палето.png, рокфорд.png, ферма.png, порт.png

#### Тактический редактор
- [x] Canvas с фоновыми картами (contain, без лишней сетки)
- [x] Маркеры (свой/враг/цель) с подписями
- [x] Стрелки направлений
- [x] Свободное рисование
- [x] Сохранение/загрузка/удаление тактик в localStorage

#### Discord OAuth2
- [x] Вход через Discord (OAuth2 code flow)
- [x] Проверка членства в гильде (DISCORD_GUILD_ID)
- [x] JWT сессия в httpOnly cookie (jose, 7 дней)
- [x] proxy.ts — редирект неавторизованных на /login
- [x] AuthProvider context (useAuth hook)
- [x] Navbar: аватар, dropdown, выход; мобильная версия
- [x] Страница /login с Discord кнопкой и ошибками
- [x] Upsert пользователей в Supabase (таблица users)

#### Discord Bot (Python)
- [x] Бот на discord.py для сбора данных
- [x] Кто онлайн / в войсе (presence_sync каждые 2 мин — синкает is_online + is_in_voice + voice_channel)
- [x] Список участников с ролями
- [x] Топ по сообщениям (день/неделя/месяц)
- [x] Топ по времени в войсе
- [x] XP/уровни (активность: msg=10xp, voice=5xp/min)
- [x] Лог модерации (ban/unban/timeout events → mod_log таблица)
- [x] Рекорды: длинная войс-сессия, сова, марафонец, АФК-шник, непоседа, спамер дня, XP-король
- [x] Случайные цитаты (1 из 50 сообщений)
- [x] Команды бота: !online, !top, !stats, !emoji, !words, !invites, !help_nl
- [x] Server snapshots каждые 5 мин (online_count, voice_count, day_of_week)
- [x] Voice XP loop (каждую минуту всем в войсе)
- [x] Инвайт-трекинг (on_member_join, сравнение invite_cache)
- [x] Топ по эмодзи (парсинг из сообщений + реакции)
- [x] Облако слов (слова 3+ символов, стоп-слова RU+EN)
- [x] duration_minutes — generated column в voice_sessions (auto из joined_at/left_at)
- [x] Pending voice sessions (left_at=NULL при входе в войс, обновляется при выходе) — позволяет API считать время активных сессий в реальном времени
- [x] safe_print() — обход UnicodeEncodeError на Windows cp1251 (unicode в названиях каналов)
- [x] try/finally в on_voice_state_update — members.is_in_voice обновляется даже при ошибках

#### Backend / API Routes
- [x] API endpoints для данных бота → сайт
  - GET /api/members — все участники с XP/level/messages/voice/avatar
  - GET /api/stats — онлайн, снапшоты, активность по часам/дням, топ сообщений, топ эмодзи, облако слов, топ инвайтеров
  - GET /api/quotes — случайная цитата из чата
  - GET /api/shame — 9 рекордов (войс, сова, чемпион, болтун, XP-король, непоседа, марафонец, АФК-шник, спамер дня), топ-10 войс (с active sessions), топ-10 сообщений с аватарами
- [x] Реальные данные вместо моков на всех страницах

### TODO

#### Бот — улучшения
- [x] Переделать presence_sync на non-blocking DB updates через `asyncio.to_thread` + concurrency limit — убрать heartbeat блокировку от массового sync loop
- [ ] Проверить остальные sync Supabase вызовы в high-traffic событиях бота (`on_message`, voice events, XP loop)
- [ ] Инвайт-трекинг: боту нужно разрешение Manage Server для чтения инвайтов
- [ ] Голосовая история: при перезапуске бота активные сессии сбрасываются (joined_at = now). Рассмотреть сохранение active_voice в БД

#### Войны кланов
- [ ] Результаты войн (до 70 игроков)
- [ ] Статистика побед/поражений

#### Тактики — шаринг
- [ ] Сохранение тактик в Supabase (вместо localStorage)
- [ ] Шаринг тактик с кланом (ссылка/список общих)

#### Training
- [ ] Контент: гайды по паркуру, видео, советы новичкам

#### Деплой
- [x] Добавить deploy-конфиги: `website/vercel.json`, `website/.vercelignore`, `bot/railway.json`, `bot/runtime.txt`, `bot/.gitignore`
- [x] Добавить `DEPLOYMENT.md` с env variables и workflow обновлений
- [ ] Подключить GitHub repo к Vercel и Railway
- [ ] Хостинг сайта: Vercel
- [ ] Хостинг бота: Railway
- [ ] Production env variables

## Tech Stack
- **Frontend**: Next.js 16.2.4, React 19, Tailwind CSS 4, TypeScript 5
- **Auth**: Discord OAuth2 + jose (JWT) + httpOnly cookies
- **Database**: Supabase (PostgreSQL)
- **Backend/API**: Next.js Route Handlers
- **Discord Bot**: Python (discord.py) — DONE
- **Хостинг сайта**: Vercel (бесплатно)
- **Хостинг бота**: Railway или Render (бесплатный tier)

## Branding
- Цвет клана: фиолетовый (#7B2FBE и оттенки)
- Лого: public/images/logo.png (unoptimized, copied from Downloads)

## Доступ
- **Тип**: Discord OAuth2
- **Открыто для всех**: Главная (`/`), Логин (`/login`)
- **Только для участников**: Участники, Доска позора, Карты, Тактики, Training, Статистика

## Env Variables (.env.local)
```
DISCORD_CLIENT_ID=           # Discord Developer Portal → OAuth2
DISCORD_CLIENT_SECRET=       # Discord Developer Portal → OAuth2
DISCORD_REDIRECT_URI=        # http://localhost:3000/api/auth/discord/callback
DISCORD_GUILD_ID=            # ID Discord сервера NeverLove
NEXT_PUBLIC_SUPABASE_URL=    # https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Legacy anon JWT key
SUPABASE_SERVICE_ROLE_KEY=   # Legacy service_role JWT key
SESSION_SECRET=              # openssl rand -base64 32
```

## Supabase Tables
- `users` — OAuth2 пользователи сайта
- `members` — участники Discord (discord_id PK, xp, level, roles, is_online, is_in_voice, voice_channel, avatar_url, last_seen, etc.)
- `message_stats` — счётчик сообщений по дням (discord_id, channel_name, date, message_count)
- `voice_sessions` — войс-сессии (discord_id, channel_name, joined_at, left_at, duration_minutes GENERATED). left_at=NULL = активная сессия
- `server_snapshots` — снапшоты онлайна каждые 5 мин (online_count, voice_count, hour, day_of_week)
- `quotes` — случайные цитаты из чата (discord_id, username, content, channel_name)
- `mod_log` — лог модерации (ban/unban/timeout, reason, moderator)
- `invites` — инвайт-трекинг (inviter_id, invited_id, invite_code, uses)
- `emoji_stats` — эмодзи по юзерам и дням (discord_id, emoji, count, date)
- `word_stats` — облако слов (word, count, date)

См. `bot/schema.sql`, `bot/migration_v2.sql` и `bot/migration_v3.sql` для полной схемы.

## Important Notes
- **Skeleton imports**: Use named import `{ Skeleton }` — NOT default import. Turbopack fails with default.
- **Logo**: Use `unoptimized` prop on `<Image>` for logo.png to prevent Next.js compression.
- **Bot stdout**: Run with `python -u main.py` for unbuffered output.
- **Deploy docs**: See `DEPLOYMENT.md`. Website deploy target is Vercel (`website/` root). Bot deploy target is Railway worker (`bot/` root, `python -u main.py`).
- **Next.js 16**: Check `node_modules/next/dist/docs/` before writing code — breaking changes from training data.
- **duration_minutes**: GENERATED column — NEVER set manually in INSERT/UPDATE. Auto-calculated from joined_at & left_at.
- **Windows cp1251**: Discord channel names contain unicode (🔊├➣ᴠᴏɪᴄᴇ). Use `safe_print()` for all bot print statements.
- **presence_sync**: массовые Supabase updates перенесены в `asyncio.to_thread` с лимитом concurrency 10, чтобы не блокировать event loop. Остальные high-traffic DB calls в боте ещё стоит проверить отдельно.

## Google Sheets (карты)
- Source: https://docs.google.com/spreadsheets/d/1RWonpmIXoq5I80yqOcQ5X2OqyEzDuL-vXDXn9zQNAAM/
- 14 локаций, скриншоты сохранены вручную как PNG
- Embedded images нельзя получить через API (Google Sheets отдаёт через JS)
