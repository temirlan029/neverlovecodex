import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Total members
  const { count: totalMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true });

  // Online count
  const { count: onlineCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("is_online", true);

  // In voice count
  const { count: inVoiceCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("is_in_voice", true);

  // Activity by hour (from snapshots, last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: snapshots } = await supabase
    .from("server_snapshots")
    .select("hour, online_count, voice_count, day_of_week, created_at")
    .gte("created_at", weekAgo);

  // Average online by hour
  const hourBuckets: Record<number, number[]> = {};
  for (let h = 0; h < 24; h++) hourBuckets[h] = [];
  for (const s of snapshots || []) {
    hourBuckets[s.hour]?.push(s.online_count);
  }
  const activityByHour = Array.from({ length: 24 }, (_, h) => {
    const vals = hourBuckets[h];
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  });

  // Activity by day of week
  const dayBuckets: Record<number, number[]> = {};
  for (let d = 0; d < 7; d++) dayBuckets[d] = [];
  for (const s of snapshots || []) {
    const dow = s.day_of_week ?? ((new Date(s.created_at).getDay() + 6) % 7);
    dayBuckets[dow]?.push(s.online_count);
  }
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const activityByDay = dayNames.map((name, i) => {
    const vals = dayBuckets[i];
    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { day: name, value: avg };
  });

  // Top messagers (all time, top 10)
  const { data: msgStats } = await supabase
    .from("message_stats")
    .select("discord_id, message_count");

  const msgByUser: Record<string, number> = {};
  for (const row of msgStats || []) {
    msgByUser[row.discord_id] = (msgByUser[row.discord_id] || 0) + row.message_count;
  }

  // Get display names for top users
  const topDiscordIds = Object.entries(msgByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  const { data: topUsers } = await supabase
    .from("members")
    .select("discord_id, display_name, avatar_url")
    .in("discord_id", topDiscordIds.length > 0 ? topDiscordIds : ["_"]);

  const userMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  for (const u of topUsers || []) {
    userMap[u.discord_id] = { display_name: u.display_name, avatar_url: u.avatar_url };
  }

  const topMessagers = topDiscordIds.map((id) => ({
    discord_id: id,
    display_name: userMap[id]?.display_name || "Unknown",
    avatar_url: userMap[id]?.avatar_url,
    messages: msgByUser[id],
  }));

  // Top emojis (all time)
  const { data: emojiRaw } = await supabase
    .from("emoji_stats")
    .select("emoji, count");
  const emojiTotals: Record<string, number> = {};
  for (const row of emojiRaw || []) {
    emojiTotals[row.emoji] = (emojiTotals[row.emoji] || 0) + row.count;
  }
  const topEmojis = Object.entries(emojiTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([emoji, count]) => ({ emoji, count }));

  // Word cloud (all time)
  const { data: wordRaw } = await supabase
    .from("word_stats")
    .select("word, count");
  const wordTotals: Record<string, number> = {};
  for (const row of wordRaw || []) {
    wordTotals[row.word] = (wordTotals[row.word] || 0) + row.count;
  }
  const topWords = Object.entries(wordTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  // Invites
  const { data: inviteRaw } = await supabase
    .from("invites")
    .select("inviter_id");
  const inviteCounts: Record<string, number> = {};
  for (const row of inviteRaw || []) {
    inviteCounts[row.inviter_id] = (inviteCounts[row.inviter_id] || 0) + 1;
  }
  const topInviterIds = Object.entries(inviteCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);
  const { data: inviterUsers } = await supabase
    .from("members")
    .select("discord_id, display_name, avatar_url")
    .in("discord_id", topInviterIds.length > 0 ? topInviterIds : ["_"]);
  const inviterMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  for (const u of inviterUsers || []) {
    inviterMap[u.discord_id] = { display_name: u.display_name, avatar_url: u.avatar_url };
  }
  const topInviters = topInviterIds.map((id) => ({
    discord_id: id,
    display_name: inviterMap[id]?.display_name || "Unknown",
    avatar_url: inviterMap[id]?.avatar_url || null,
    count: inviteCounts[id],
  }));

  return Response.json({
    totalMembers: totalMembers || 0,
    onlineCount: onlineCount || 0,
    inVoiceCount: inVoiceCount || 0,
    activityByHour,
    activityByDay,
    topMessagers,
    topEmojis,
    topWords,
    topInviters,
  });
}
