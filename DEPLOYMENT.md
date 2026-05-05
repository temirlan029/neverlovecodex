# NeverLove Deployment

This project has two services:

- `website/` - Next.js app, best hosted on Vercel.
- `bot/` - long-running Discord Python bot, best hosted as a Railway worker.

Supabase stays external and is shared by both services.

## Recommended 24/7 Setup

### Website: Vercel

Use Vercel for the Next.js site.

Settings:

- Framework preset: Next.js
- Root directory: `website`
- Build command: `npm run build`
- Install command: `npm ci`
- Output directory: leave default

Environment variables:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/discord/callback
DISCORD_GUILD_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
```

After deploy, add the same redirect URL in Discord Developer Portal:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/discord/callback
```

### Bot: Railway

Use Railway for the Discord bot as a long-running worker.

Settings:

- Root directory: `bot`
- Start command: `python -u main.py`
- Restart policy: on failure

Environment variables:

```env
DISCORD_BOT_TOKEN=
GUILD_ID=
SUPABASE_URL=
SUPABASE_KEY=
PYTHONUNBUFFERED=1
```

For stable 24/7 bot hosting, Railway Hobby is recommended. Free/Trial credits are useful for testing, but a Discord bot is a persistent process and will consume runtime continuously.

## Update Workflow

1. Make local changes.
2. Run checks:

```bash
cd website
npm run lint
npm run build

cd ../bot
python -m py_compile main.py
```

3. Commit and push to GitHub.
4. Vercel redeploys the website automatically.
5. Railway redeploys the bot automatically.

## GitHub Repo Layout

Best long-term layout is one GitHub repository from the root:

```text
neverlovecodex/
├── website/
├── bot/
├── AGENTS.md
└── DEPLOYMENT.md
```

Current local note: `website/` has its own `.git` folder and no remote. The bot is outside that git repo. Before connecting auto-deploy, either:

- create one clean root-level repo that includes both `website/` and `bot/`, or
- create separate repos/services for website and bot.

Do not commit `.env`, `.env.local`, logs, `.next`, `node_modules`, or `__pycache__`.
