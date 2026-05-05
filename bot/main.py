import os
import re
import random
import asyncio
from collections import Counter
from datetime import datetime, timezone

import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GUILD_ID = int(os.getenv("GUILD_ID", "0"))

db = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bot setup with minimal intents for stats
intents = discord.Intents.default()
intents.members = True          # Track member join/leave, member list
intents.presences = True        # Track online/offline status
intents.message_content = True  # Read messages for quotes/word cloud
intents.voice_states = True     # Track voice channel activity
intents.moderation = True       # Track bans/kicks

bot = commands.Bot(
    command_prefix="!",
    intents=intents,
    chunk_guilds_at_startup=False,
)

# ── Track active voice sessions (in memory) ──
# { discord_id: { "channel": str, "joined_at": datetime } }
active_voice: dict[str, dict] = {}

# ── Invite cache for tracking ──
# { invite_code: uses_count }
invite_cache: dict[str, int] = {}

# XP constants
XP_PER_MESSAGE = 10
XP_PER_VOICE_MINUTE = 5

# Word cloud: stop-words (Russian common words to skip)
STOP_WORDS = {
    "и", "в", "на", "с", "не", "что", "а", "я", "он", "она", "они", "мы", "вы",
    "это", "то", "но", "да", "нет", "по", "из", "за", "к", "от", "до", "у", "о",
    "как", "так", "все", "уже", "ещё", "еще", "бы", "же", "ты", "мне", "тебе",
    "его", "её", "их", "мой", "твой", "свой", "наш", "ваш", "этот", "тот", "эта",
    "для", "при", "без", "через", "между", "под", "над", "перед", "после",
    "или", "ни", "тоже", "также", "если", "чтобы", "потому", "когда", "где",
    "кто", "чего", "чем", "чему", "ну", "вот", "там", "тут", "здесь", "сюда",
    "очень", "только", "можно", "нужно", "надо", "будет", "был", "была", "были",
    "быть", "есть", "нас", "вас", "себе", "себя", "просто", "типа", "вообще",
    "the", "is", "are", "was", "were", "be", "been", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "that", "this", "it", "not", "you", "he", "she", "they", "we", "my", "your",
}

# Emoji regex
EMOJI_REGEX = re.compile(r"<a?:\w+:\d+>|[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U0001FA00-\U0001FAFF\U00002600-\U000026FF\U0000FE00-\U0000FE0F\U0001F900-\U0001F9FF]+")


# ═══════════════════════════════════════════
# XP / Level helpers
# ═══════════════════════════════════════════

def xp_for_level(level: int) -> int:
    """XP needed to reach a given level. Simple curve: 100 * level^1.5"""
    return int(100 * (level ** 1.5))


def level_from_xp(xp: int) -> int:
    """Calculate level from total XP."""
    level = 0
    while xp >= xp_for_level(level + 1):
        level += 1
    return level


def add_xp(discord_id: str, amount: int):
    """Add XP and recalculate level."""
    try:
        row = (
            db.table("members")
            .select("xp, level")
            .eq("discord_id", discord_id)
            .single()
            .execute()
        )
        if not row.data:
            return
        current_xp = (row.data.get("xp") or 0) + amount
        new_level = level_from_xp(current_xp)
        db.table("members").update(
            {"xp": current_xp, "level": new_level}
        ).eq("discord_id", discord_id).execute()
    except Exception:
        pass


# ═══════════════════════════════════════════
# Events
# ═══════════════════════════════════════════

@bot.event
async def on_ready():
    try:
        print(f"Bot ready: {bot.user} (ID: {bot.user.id})")
        guild = bot.get_guild(GUILD_ID)
        if guild:
            print(f"Tracking guild: {guild.name} ({guild.member_count} members)")
            await sync_all_members(guild)
            # Restore active voice sessions
            # First, clean up any stale pending sessions (left_at IS NULL)
            db.table("voice_sessions").update(
                {"left_at": datetime.now(timezone.utc).isoformat()}
            ).is_("left_at", "null").execute()
            for vc in guild.voice_channels:
                for member in vc.members:
                    if not member.bot:
                        joined_at = datetime.now(timezone.utc)
                        active_voice[str(member.id)] = {
                            "channel": vc.name,
                            "joined_at": joined_at,
                        }
                        # Create pending session in DB
                        db.table("voice_sessions").insert(
                            {
                                "discord_id": str(member.id),
                                "channel_name": vc.name,
                                "joined_at": joined_at.isoformat(),
                            }
                        ).execute()
            print(f"Restored {len(active_voice)} active voice sessions")
            # Cache invites for tracking
            try:
                for inv in await guild.invites():
                    invite_cache[inv.code] = inv.uses or 0
                print(f"Cached {len(invite_cache)} invites")
            except discord.Forbidden:
                print("WARNING: No permission to read invites (Manage Server needed)")
        else:
            print(f"ERROR: Guild {GUILD_ID} not found! Is the bot added to the server?")
        # Start background tasks
        if not snapshot_loop.is_running():
            snapshot_loop.start()
        if not presence_sync.is_running():
            presence_sync.start()
        if not voice_xp_loop.is_running():
            voice_xp_loop.start()
    except Exception as e:
        print(f"ERROR in on_ready: {e}")
        import traceback
        traceback.print_exc()


@bot.event
async def on_member_join(member: discord.Member):
    if member.bot or member.guild.id != GUILD_ID:
        return
    upsert_member(member)
    # Invite tracking: compare cached invites with current
    try:
        new_invites = await member.guild.invites()
        for inv in new_invites:
            old_uses = invite_cache.get(inv.code, 0)
            if inv.uses and inv.uses > old_uses and inv.inviter:
                db.table("invites").insert({
                    "inviter_id": str(inv.inviter.id),
                    "invited_id": str(member.id),
                    "invite_code": inv.code,
                    "uses": inv.uses,
                }).execute()
                print(f"  Invite: {inv.inviter.display_name} invited {member.display_name} (code: {inv.code})")
                break
        # Update cache
        for inv in new_invites:
            invite_cache[inv.code] = inv.uses or 0
    except discord.Forbidden:
        pass
    except Exception as e:
        print(f"  Invite tracking error: {e}")
    print(f"+ Member joined: {member.display_name}")


@bot.event
async def on_member_remove(member: discord.Member):
    if member.bot or member.guild.id != GUILD_ID:
        return
    db.table("members").delete().eq("discord_id", str(member.id)).execute()
    print(f"- Member left: {member.display_name}")


@bot.event
async def on_message(message: discord.Message):
    if message.author.bot or not message.guild or message.guild.id != GUILD_ID:
        return

    uid = str(message.author.id)
    channel = message.channel.name
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Upsert message count
    db.table("message_stats").upsert(
        {
            "discord_id": uid,
            "channel_name": channel,
            "date": today,
            "message_count": 1,
        },
        on_conflict="discord_id,channel_name,date",
    ).execute()

    # Increment count
    existing = (
        db.table("message_stats")
        .select("id,message_count")
        .eq("discord_id", uid)
        .eq("channel_name", channel)
        .eq("date", today)
        .single()
        .execute()
    )
    if existing.data:
        current = existing.data["message_count"]
        if current >= 1:
            db.table("message_stats").update(
                {"message_count": current + 1}
            ).eq("id", existing.data["id"]).execute()

    # XP for message
    add_xp(uid, XP_PER_MESSAGE)

    # Random quote saving (~1 in 50 messages, min 10 chars)
    content = message.clean_content.strip()
    if len(content) >= 10 and random.randint(1, 50) == 1:
        db.table("quotes").insert(
            {
                "discord_id": uid,
                "username": message.author.display_name,
                "content": content[:500],
                "channel_name": channel,
            }
        ).execute()

    # Emoji tracking (from message content)
    emojis_found = EMOJI_REGEX.findall(content)
    if emojis_found:
        for emoji in emojis_found:
            try:
                db.table("emoji_stats").upsert(
                    {"discord_id": uid, "emoji": emoji, "count": 1, "date": today},
                    on_conflict="discord_id,emoji,date",
                ).execute()
                existing = (
                    db.table("emoji_stats")
                    .select("id,count")
                    .eq("discord_id", uid).eq("emoji", emoji).eq("date", today)
                    .single().execute()
                )
                if existing.data and existing.data["count"] >= 1:
                    db.table("emoji_stats").update(
                        {"count": existing.data["count"] + 1}
                    ).eq("id", existing.data["id"]).execute()
            except Exception:
                pass

    # Word cloud tracking (words 3+ chars, not stop-words)
    if len(content) >= 3:
        words = re.findall(r"[а-яёa-z]{3,}", content.lower())
        word_counts: dict[str, int] = {}
        for w in words:
            if w not in STOP_WORDS and len(w) <= 30:
                word_counts[w] = word_counts.get(w, 0) + 1
        for word, cnt in word_counts.items():
            try:
                db.table("word_stats").upsert(
                    {"word": word, "count": cnt, "date": today},
                    on_conflict="word,date",
                ).execute()
                existing = (
                    db.table("word_stats")
                    .select("id,count")
                    .eq("word", word).eq("date", today)
                    .single().execute()
                )
                if existing.data:
                    db.table("word_stats").update(
                        {"count": existing.data["count"] + cnt}
                    ).eq("id", existing.data["id"]).execute()
            except Exception:
                pass

    await bot.process_commands(message)


@bot.event
async def on_reaction_add(reaction: discord.Reaction, user: discord.User):
    """Track emoji reactions."""
    if user.bot or not reaction.message.guild or reaction.message.guild.id != GUILD_ID:
        return
    uid = str(user.id)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    emoji = str(reaction.emoji)
    try:
        db.table("emoji_stats").upsert(
            {"discord_id": uid, "emoji": emoji, "count": 1, "date": today},
            on_conflict="discord_id,emoji,date",
        ).execute()
        existing = (
            db.table("emoji_stats")
            .select("id,count")
            .eq("discord_id", uid).eq("emoji", emoji).eq("date", today)
            .single().execute()
        )
        if existing.data and existing.data["count"] >= 1:
            db.table("emoji_stats").update(
                {"count": existing.data["count"] + 1}
            ).eq("id", existing.data["id"]).execute()
    except Exception:
        pass


@bot.event
async def on_voice_state_update(
    member: discord.Member,
    before: discord.VoiceState,
    after: discord.VoiceState,
):
    if member.bot or member.guild.id != GUILD_ID:
        return

    uid = str(member.id)

    try:
        # Left voice channel
        if before.channel and not after.channel:
            session = active_voice.pop(uid, None)
            if session:
                left_at = datetime.now(timezone.utc)
                mins = int((left_at - session["joined_at"]).total_seconds() / 60)
                # Update the pending session (left_at=NULL) with final data
                pending = (
                    db.table("voice_sessions")
                    .select("id")
                    .eq("discord_id", uid)
                    .is_("left_at", "null")
                    .limit(1)
                    .execute()
                )
                if pending.data:
                    db.table("voice_sessions").update(
                        {"left_at": left_at.isoformat()}
                    ).eq("id", pending.data[0]["id"]).execute()
                else:
                    db.table("voice_sessions").insert(
                        {
                            "discord_id": uid,
                            "channel_name": session["channel"],
                            "joined_at": session["joined_at"].isoformat(),
                            "left_at": left_at.isoformat(),
                        }
                    ).execute()
                # XP for voice time
                if mins > 0:
                    add_xp(uid, mins * XP_PER_VOICE_MINUTE)
                safe_print(f"Voice end: {member.display_name} ({session['channel']}, {mins}m)")

        # Joined voice channel
        elif after.channel and not before.channel:
            joined_at = datetime.now(timezone.utc)
            active_voice[uid] = {
                "channel": after.channel.name,
                "joined_at": joined_at,
            }
            # Insert pending session (left_at=NULL) so API can see active sessions
            db.table("voice_sessions").insert(
                {
                    "discord_id": uid,
                    "channel_name": after.channel.name,
                    "joined_at": joined_at.isoformat(),
                }
            ).execute()
            safe_print(f"Voice start: {member.display_name} ({after.channel.name})")

        # Moved channels
        elif before.channel and after.channel and before.channel != after.channel:
            session = active_voice.pop(uid, None)
            if session:
                left_at = datetime.now(timezone.utc)
                mins = int((left_at - session["joined_at"]).total_seconds() / 60)
                # Close pending session
                pending = (
                    db.table("voice_sessions")
                    .select("id")
                    .eq("discord_id", uid)
                    .is_("left_at", "null")
                    .limit(1)
                    .execute()
                )
                if pending.data:
                    db.table("voice_sessions").update(
                        {"left_at": left_at.isoformat()}
                    ).eq("id", pending.data[0]["id"]).execute()
                else:
                    db.table("voice_sessions").insert(
                        {
                            "discord_id": uid,
                            "channel_name": session["channel"],
                            "joined_at": session["joined_at"].isoformat(),
                            "left_at": left_at.isoformat(),
                        }
                    ).execute()
                if mins > 0:
                    add_xp(uid, mins * XP_PER_VOICE_MINUTE)
            # Open new pending session for new channel
            joined_at = datetime.now(timezone.utc)
            active_voice[uid] = {
                "channel": after.channel.name,
                "joined_at": joined_at,
            }
            db.table("voice_sessions").insert(
                {
                    "discord_id": uid,
                    "channel_name": after.channel.name,
                    "joined_at": joined_at.isoformat(),
                }
            ).execute()
            safe_print(f"Voice move: {member.display_name} -> {after.channel.name}")
    finally:
        # Always update member voice status, even if something above fails
        try:
            db.table("members").update(
                {
                    "is_in_voice": after.channel is not None,
                    "voice_channel": after.channel.name if after.channel else None,
                }
            ).eq("discord_id", uid).execute()
        except Exception:
            pass


# ═══════════════════════════════════════════
# Moderation logging
# ═══════════════════════════════════════════

@bot.event
async def on_member_ban(guild: discord.Guild, user: discord.User):
    if guild.id != GUILD_ID:
        return
    # Try to get audit log for reason & moderator
    reason = None
    mod_id = None
    mod_name = None
    try:
        async for entry in guild.audit_logs(limit=5, action=discord.AuditLogAction.ban):
            if entry.target and entry.target.id == user.id:
                reason = entry.reason
                mod_id = str(entry.user.id) if entry.user else None
                mod_name = entry.user.display_name if entry.user else None
                break
    except Exception:
        pass
    db.table("mod_log").insert({
        "discord_id": str(user.id),
        "display_name": user.display_name,
        "action": "ban",
        "reason": reason,
        "moderator_id": mod_id,
        "moderator_name": mod_name,
    }).execute()
    print(f"BAN: {user.display_name} (reason: {reason})")


@bot.event
async def on_member_unban(guild: discord.Guild, user: discord.User):
    if guild.id != GUILD_ID:
        return
    db.table("mod_log").insert({
        "discord_id": str(user.id),
        "display_name": user.display_name,
        "action": "unban",
    }).execute()
    print(f"UNBAN: {user.display_name}")


@bot.event
async def on_member_update(before: discord.Member, after: discord.Member):
    if after.guild.id != GUILD_ID or after.bot:
        return
    # Detect timeout (communication_disabled_until)
    if not before.timed_out and after.timed_out:
        reason = None
        mod_id = None
        mod_name = None
        duration = None
        try:
            async for entry in after.guild.audit_logs(limit=5, action=discord.AuditLogAction.member_update):
                if entry.target and entry.target.id == after.id:
                    reason = entry.reason
                    mod_id = str(entry.user.id) if entry.user else None
                    mod_name = entry.user.display_name if entry.user else None
                    break
        except Exception:
            pass
        if after.communication_disabled_until:
            duration = int((after.communication_disabled_until - datetime.now(timezone.utc)).total_seconds())
        db.table("mod_log").insert({
            "discord_id": str(after.id),
            "display_name": after.display_name,
            "action": "timeout",
            "reason": reason,
            "moderator_id": mod_id,
            "moderator_name": mod_name,
            "duration_seconds": max(duration, 0) if duration else None,
        }).execute()
        print(f"TIMEOUT: {after.display_name} ({duration}s)")

    # Update roles if changed
    if before.roles != after.roles:
        roles = [r.name for r in after.roles if r.name != "@everyone"]
        db.table("members").update({"roles": roles}).eq("discord_id", str(after.id)).execute()


# ═══════════════════════════════════════════
# Bot commands
# ═══════════════════════════════════════════

@bot.command(name="online")
async def cmd_online(ctx: commands.Context):
    """Show who's online right now."""
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        return
    online = [m for m in guild.members if not m.bot and m.status != discord.Status.offline]
    in_voice = []
    for vc in guild.voice_channels:
        for m in vc.members:
            if not m.bot:
                in_voice.append(f"  🎙 {m.display_name} ({vc.name})")

    lines = [f"**Онлайн: {len(online)}**"]
    for m in online[:20]:
        status = "🟢" if m.status == discord.Status.online else "🟡"
        lines.append(f"{status} {m.display_name}")
    if len(online) > 20:
        lines.append(f"...и ещё {len(online) - 20}")
    if in_voice:
        lines.append(f"\n**В войсе ({len(in_voice)}):**")
        lines.extend(in_voice)
    await ctx.send("\n".join(lines))


@bot.command(name="top")
async def cmd_top(ctx: commands.Context):
    """Show top 10 members by XP."""
    result = (
        db.table("members")
        .select("display_name, xp, level")
        .order("xp", desc=True)
        .limit(10)
        .execute()
    )
    if not result.data:
        await ctx.send("Пока нет данных")
        return
    lines = ["**🏆 Топ 10 по XP:**"]
    medals = ["🥇", "🥈", "🥉"]
    for i, row in enumerate(result.data):
        prefix = medals[i] if i < 3 else f"#{i+1}"
        lines.append(
            f"{prefix} **{row['display_name']}** — Lv.{row.get('level', 0)} ({row.get('xp', 0):,} XP)"
        )
    await ctx.send("\n".join(lines))


@bot.command(name="stats")
async def cmd_stats(ctx: commands.Context, member: discord.Member = None):
    """Show stats for a member (or yourself)."""
    target = member or ctx.author
    uid = str(target.id)

    # Get member data
    row = db.table("members").select("display_name, xp, level").eq("discord_id", uid).single().execute()
    if not row.data:
        await ctx.send("Участник не найден")
        return

    # Total messages
    msg_res = db.table("message_stats").select("message_count").eq("discord_id", uid).execute()
    total_msgs = sum(r["message_count"] for r in (msg_res.data or []))

    # Total voice
    voice_res = (
        db.table("voice_sessions")
        .select("duration_minutes")
        .eq("discord_id", uid)
        .not_("duration_minutes", "is", "null")
        .execute()
    )
    total_voice = sum(r["duration_minutes"] for r in (voice_res.data or []))

    xp = row.data.get("xp", 0)
    lvl = row.data.get("level", 0)
    next_xp = xp_for_level(lvl + 1)

    lines = [
        f"**📊 {row.data['display_name']}**",
        f"Уровень: **{lvl}** ({xp:,} / {next_xp:,} XP)",
        f"Сообщения: **{total_msgs:,}**",
        f"Войс: **{total_voice // 60}ч {total_voice % 60}м**",
    ]
    await ctx.send("\n".join(lines))


@bot.command(name="emoji")
async def cmd_emoji(ctx: commands.Context):
    """Show top emojis used."""
    result = db.table("emoji_stats").select("emoji, count").execute()
    if not result.data:
        await ctx.send("Пока нет данных по эмодзи")
        return
    totals: dict[str, int] = {}
    for row in result.data:
        totals[row["emoji"]] = totals.get(row["emoji"], 0) + row["count"]
    top = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:15]
    lines = ["**😀 Топ эмодзи:**"]
    for i, (emoji, count) in enumerate(top):
        lines.append(f"{i+1}. {emoji} — **{count}**")
    await ctx.send("\n".join(lines))


@bot.command(name="words")
async def cmd_words(ctx: commands.Context):
    """Show word cloud (top words in chat)."""
    result = db.table("word_stats").select("word, count").execute()
    if not result.data:
        await ctx.send("Пока нет данных по словам")
        return
    totals: dict[str, int] = {}
    for row in result.data:
        totals[row["word"]] = totals.get(row["word"], 0) + row["count"]
    top = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:20]
    lines = ["**☁️ Облако слов (топ 20):**"]
    for i, (word, count) in enumerate(top):
        lines.append(f"{i+1}. **{word}** — {count}")
    await ctx.send("\n".join(lines))


@bot.command(name="invites")
async def cmd_invites(ctx: commands.Context):
    """Show top inviters."""
    result = db.table("invites").select("inviter_id").execute()
    if not result.data:
        await ctx.send("Пока нет данных по инвайтам")
        return
    counts: dict[str, int] = {}
    for row in result.data:
        counts[row["inviter_id"]] = counts.get(row["inviter_id"], 0) + 1
    top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]
    # Get names
    ids = [t[0] for t in top]
    names_res = db.table("members").select("discord_id, display_name").in_("discord_id", ids).execute()
    name_map = {r["discord_id"]: r["display_name"] for r in (names_res.data or [])}
    lines = ["**📨 Топ по приглашениям:**"]
    medals = ["🥇", "🥈", "🥉"]
    for i, (uid, count) in enumerate(top):
        prefix = medals[i] if i < 3 else f"#{i+1}"
        name = name_map.get(uid, "Unknown")
        lines.append(f"{prefix} **{name}** — {count} приглашений")
    await ctx.send("\n".join(lines))


@bot.command(name="help_nl")
async def cmd_help(ctx: commands.Context):
    """Show available commands."""
    lines = [
        "**NeverLove Bot — Команды:**",
        "`!online` — Кто сейчас онлайн",
        "`!top` — Топ 10 по XP",
        "`!stats [@user]` — Статистика участника",
        "`!emoji` — Топ эмодзи",
        "`!words` — Облако слов (топ 20)",
        "`!invites` — Топ по приглашениям",
        "`!help_nl` — Список команд",
    ]
    await ctx.send("\n".join(lines))


# ═══════════════════════════════════════════
# Background tasks
# ═══════════════════════════════════════════

@tasks.loop(minutes=5)
async def snapshot_loop():
    """Save server stats snapshot every 5 minutes."""
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        return

    now = datetime.now(timezone.utc)
    online = sum(
        1
        for m in guild.members
        if not m.bot and m.status != discord.Status.offline
    )
    in_voice = sum(
        1
        for vc in guild.voice_channels
        for m in vc.members
        if not m.bot
    )

    db.table("server_snapshots").insert(
        {
            "online_count": online,
            "voice_count": in_voice,
            "total_members": guild.member_count,
            "hour": now.hour,
            "day_of_week": now.weekday(),  # 0=Mon, 6=Sun
        }
    ).execute()


@tasks.loop(minutes=2)
async def presence_sync():
    """Sync online/offline + voice status to DB every 2 minutes."""
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        return

    # Build set of members currently in voice
    voice_members: dict[str, str] = {}  # discord_id -> channel_name
    for vc in guild.voice_channels:
        for m in vc.members:
            if not m.bot:
                voice_members[str(m.id)] = vc.name

    updates = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for member in guild.members:
        if member.bot:
            continue
        uid = str(member.id)
        is_online = member.status != discord.Status.offline
        in_voice = uid in voice_members
        updates.append(
            (
                uid,
                {
                    "is_online": is_online,
                    "is_in_voice": in_voice,
                    "voice_channel": voice_members.get(uid),
                    "last_seen": now_iso if is_online else None,
                },
            )
        )

    semaphore = asyncio.Semaphore(10)

    async def update_presence(uid: str, payload: dict):
        async with semaphore:
            try:
                await asyncio.to_thread(
                    lambda: db.table("members")
                    .update(payload)
                    .eq("discord_id", uid)
                    .execute()
                )
            except Exception as e:
                safe_print(f"  presence_sync error for {uid}: {e}")

    await asyncio.gather(
        *(update_presence(uid, payload) for uid, payload in updates)
    )


@tasks.loop(minutes=1)
async def voice_xp_loop():
    """Grant XP to members currently in voice every minute."""
    for uid in list(active_voice.keys()):
        add_xp(uid, XP_PER_VOICE_MINUTE)


# ═══════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════

def safe_print(msg: str):
    """Print safely on Windows (cp1251 can't encode some unicode chars)."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("ascii", errors="replace").decode("ascii"))


def get_avatar_url(member: discord.Member) -> str | None:
    if member.avatar:
        return member.avatar.url
    if member.default_avatar:
        return member.default_avatar.url
    return None


def upsert_member(member: discord.Member):
    roles = [r.name for r in member.roles if r.name != "@everyone"]
    try:
        db.table("members").upsert(
            {
                "discord_id": str(member.id),
                "username": member.name,
                "display_name": member.display_name,
                "avatar_url": get_avatar_url(member),
                "roles": roles,
                "joined_at": member.joined_at.isoformat() if member.joined_at else None,
            },
            on_conflict="discord_id",
        ).execute()
    except Exception as e:
        print(f"  DB error for {member.display_name}: {e}")


async def sync_all_members(guild: discord.Guild):
    """Full sync of all members on startup."""
    if guild.chunked is False:
        print("Fetching member list from Discord...")
        await guild.chunk()
    count = 0
    for member in guild.members:
        if member.bot:
            continue
        try:
            upsert_member(member)
            count += 1
        except Exception as e:
            print(f"  Error syncing {member.display_name}: {e}")
    print(f"Synced {count} members to Supabase")


# ═══════════════════════════════════════════
# Run
# ═══════════════════════════════════════════

if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("ERROR: DISCORD_BOT_TOKEN not set in .env")
        exit(1)
    bot.run(DISCORD_TOKEN)
