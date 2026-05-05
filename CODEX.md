# NeverLove Codex Notes

## Project

NeverLove is a GTA V RP clan project for Majestic.

The repository contains two deployable services:

- `website/` - Next.js 16 site with Discord OAuth, Supabase data, members, stats, shame board, maps, tactics, and training pages.
- `bot/` - Python `discord.py` bot that collects Discord server activity into Supabase.

Production website:

```text
https://neverlovecodex.vercel.app/
```

GitHub repository:

```text
https://github.com/temirlan029/neverlovecodex
```

## Hosting Plan

- Website: Vercel, root directory `website`.
- Bot: Railway worker, root directory `bot`, start command `python -u main.py`.
- Database: Supabase.
- Discord OAuth redirect:

```text
https://neverlovecodex.vercel.app/api/auth/discord/callback
```

## Last Completed Work

1. Created a root GitHub repo for the full project.
2. Removed nested `website/.git` so both `website/` and `bot/` are tracked together.
3. Added deploy docs and configs:
   - `DEPLOYMENT.md`
   - `website/vercel.json`
   - `website/.vercelignore`
   - `bot/railway.json`
   - `bot/runtime.txt`
   - `bot/.gitignore`
4. Deployed the website to Vercel:

```text
https://neverlovecodex.vercel.app/
```

5. Fixed Discord OAuth env handling by trimming whitespace/newlines in `website/src/app/lib/discord.ts`.
6. Updated public Discord invite links on the homepage and footer to:

```text
https://discord.gg/TGCjdarTSb
```

Latest pushed commit:

```text
50f7e8e Update public Discord invite link
```

## Checks Run

Website:

```bash
cd website
npm run lint
npm run build
```

Build passed. Lint passes with warnings about `<img>` usage.

Bot:

```bash
cd bot
python -m py_compile main.py
```

Syntax check passed.

## Bot Status

`presence_sync` was updated to avoid blocking the Discord event loop:

- Uses `asyncio.to_thread` for Supabase updates.
- Uses a concurrency limit of 10.
- Logs per-member sync errors without crashing the full sync loop.

Remaining bot work:

- Review remaining synchronous Supabase calls in high-traffic events:
  - `on_message`
  - voice state events
  - XP loop
- Deploy bot to Railway as a 24/7 worker.

## Railway Bot Deploy Settings

Use the same GitHub repo:

```text
temirlan029/neverlovecodex
```

Railway service settings:

```text
Root Directory: bot
Start Command: python -u main.py
```

Environment variables:

```env
DISCORD_BOT_TOKEN=
GUILD_ID=
SUPABASE_URL=
SUPABASE_KEY=
PYTHONUNBUFFERED=1
```

For stable 24/7 hosting, Railway Hobby is recommended because a Discord bot is a persistent process.
