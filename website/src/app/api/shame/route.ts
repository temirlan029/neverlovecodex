import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Longest voice session ever
  const { data: longestVoice } = await supabase
    .from("voice_sessions")
    .select("discord_id, channel_name, duration_minutes")
    .not("duration_minutes", "is", null)
    .order("duration_minutes", { ascending: false })
    .limit(1);

  // Owl: latest voice session end (most late-night)
  const { data: lateNight } = await supabase
    .from("voice_sessions")
    .select("discord_id, left_at")
    .not("left_at", "is", null)
    .order("left_at", { ascending: false })
    .limit(50);

  // All voice sessions
  const { data: voiceAll } = await supabase
    .from("voice_sessions")
    .select("discord_id, duration_minutes, joined_at, left_at");

  // Voice stats by user
  const voiceByUser: Record<string, { totalMinutes: number; sessions: number }> = {};
  const now = new Date();
  for (const row of voiceAll || []) {
    if (!voiceByUser[row.discord_id]) {
      voiceByUser[row.discord_id] = { totalMinutes: 0, sessions: 0 };
    }
    let mins = row.duration_minutes;
    if (mins == null && row.joined_at) {
      // Active session (left_at is NULL) or generated column — calculate from timestamps
      const end = row.left_at ? new Date(row.left_at) : now;
      const start = new Date(row.joined_at);
      mins = Math.floor((end.getTime() - start.getTime()) / 60000);
    }
    voiceByUser[row.discord_id].totalMinutes += Math.max(mins || 0, 0);
    voiceByUser[row.discord_id].sessions += 1;
  }

  // Top voice (by total minutes)
  const topVoice = Object.entries(voiceByUser)
    .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
    .slice(0, 10)
    .map(([id, data]) => ({ discord_id: id, total_minutes: data.totalMinutes }));

  // Top messagers
  const { data: msgAll } = await supabase
    .from("message_stats")
    .select("discord_id, message_count");

  const msgByUser: Record<string, number> = {};
  for (const row of msgAll || []) {
    msgByUser[row.discord_id] = (msgByUser[row.discord_id] || 0) + row.message_count;
  }

  const topMsg = Object.entries(msgByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ discord_id: id, messages: count }));

  // XP / Level leaderboard
  const { data: xpLeaders } = await supabase
    .from("members")
    .select("discord_id, display_name, xp, level")
    .order("xp", { ascending: false })
    .limit(1);

  // Most voice sessions (join/leave count)
  const sessionChamp = Object.entries(voiceByUser)
    .sort(([, a], [, b]) => b.sessions - a.sessions)
    .slice(0, 1);

  // AFK king — shortest avg voice session (at least 5 sessions)
  const afkCandidates = Object.entries(voiceByUser)
    .filter(([, d]) => d.sessions >= 3)
    .map(([id, d]) => ({ id, avg: d.totalMinutes / d.sessions }))
    .sort((a, b) => a.avg - b.avg);

  // Marathon man — longest avg voice session (at least 3 sessions)
  const marathonCandidates = Object.entries(voiceByUser)
    .filter(([, d]) => d.sessions >= 2)
    .map(([id, d]) => ({ id, avg: d.totalMinutes / d.sessions }))
    .sort((a, b) => b.avg - a.avg);

  // Most active day — user with most messages in a single day
  const { data: dailyMsgs } = await supabase
    .from("message_stats")
    .select("discord_id, date, message_count")
    .order("message_count", { ascending: false })
    .limit(1);

  // Collect all discord_ids we need names for
  const allIds = new Set<string>();
  longestVoice?.forEach((r) => allIds.add(r.discord_id));
  lateNight?.forEach((r) => allIds.add(r.discord_id));
  topVoice.forEach((r) => allIds.add(r.discord_id));
  topMsg.forEach((r) => allIds.add(r.discord_id));
  sessionChamp.forEach(([id]) => allIds.add(id));
  afkCandidates.slice(0, 1).forEach((r) => allIds.add(r.id));
  marathonCandidates.slice(0, 1).forEach((r) => allIds.add(r.id));
  xpLeaders?.forEach((r) => allIds.add(r.discord_id));
  dailyMsgs?.forEach((r) => allIds.add(r.discord_id));

  const { data: users } = await supabase
    .from("members")
    .select("discord_id, display_name, avatar_url")
    .in("discord_id", [...allIds].length > 0 ? [...allIds] : ["_"]);

  const userMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  for (const u of users || []) {
    userMap[u.discord_id] = { display_name: u.display_name, avatar_url: u.avatar_url };
  }

  const getName = (id: string) => userMap[id]?.display_name || "Unknown";

  // Build records
  const records: { title: string; icon: string; holder: string; value: string }[] = [];

  if (longestVoice && longestVoice.length > 0) {
    const r = longestVoice[0];
    const hours = Math.floor((r.duration_minutes || 0) / 60);
    const mins = (r.duration_minutes || 0) % 60;
    records.push({
      title: "Рекорд войса",
      icon: "🎙️",
      holder: getName(r.discord_id),
      value: `${hours}ч ${mins}м без перерыва`,
    });
  }

  // Owl - find latest left_at time (by hour of day)
  if (lateNight && lateNight.length > 0) {
    let latestHour = -1;
    let owlId = "";
    let owlTime = "";
    for (const row of lateNight) {
      const d = new Date(row.left_at);
      const h = d.getUTCHours();
      // "Late night" = 0-6 AM
      if (h >= 0 && h <= 6 && h > latestHour) {
        latestHour = h;
        owlId = row.discord_id;
        owlTime = `${h}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
      }
    }
    if (owlId) {
      records.push({
        title: "Сова",
        icon: "🦉",
        holder: getName(owlId),
        value: `В войсе до ${owlTime} UTC`,
      });
    }
  }

  // Voice champion
  if (topVoice.length > 0) {
    const champH = Math.floor(topVoice[0].total_minutes / 60);
    const champM = topVoice[0].total_minutes % 60;
    records.push({
      title: "Войс-чемпион",
      icon: "🏆",
      holder: getName(topVoice[0].discord_id),
      value: champH > 0 ? `${champH}ч ${champM}м суммарно` : `${champM}м суммарно`,
    });
  }

  // Top messager
  if (topMsg.length > 0) {
    records.push({
      title: "Болтун",
      icon: "💬",
      holder: getName(topMsg[0].discord_id),
      value: `${topMsg[0].messages.toLocaleString()} сообщений`,
    });
  }

  // XP King
  if (xpLeaders && xpLeaders.length > 0) {
    const leader = xpLeaders[0];
    records.push({
      title: "XP Король",
      icon: "👑",
      holder: leader.display_name,
      value: `Lv.${leader.level} — ${leader.xp.toLocaleString()} XP`,
    });
  }

  // Session hopper (most voice sessions)
  if (sessionChamp.length > 0) {
    const [id, data] = sessionChamp[0];
    records.push({
      title: "Непоседа",
      icon: "🔄",
      holder: getName(id),
      value: `${data.sessions} заходов в войс`,
    });
  }

  // Marathon man — longest avg session
  if (marathonCandidates.length > 0) {
    const m = marathonCandidates[0];
    const avgH = Math.floor(m.avg / 60);
    const avgM = Math.round(m.avg % 60);
    records.push({
      title: "Марафонец",
      icon: "🏃",
      holder: getName(m.id),
      value: `В среднем ${avgH}ч ${avgM}м за сессию`,
    });
  }

  // AFK king — shortest avg session
  if (afkCandidates.length > 0) {
    const a = afkCandidates[0];
    records.push({
      title: "АФК-шник",
      icon: "💤",
      holder: getName(a.id),
      value: `В среднем ${Math.round(a.avg)}м за заход`,
    });
  }

  // Most messages in a single day
  if (dailyMsgs && dailyMsgs.length > 0) {
    const d = dailyMsgs[0];
    records.push({
      title: "Спамер дня",
      icon: "🔥",
      holder: getName(d.discord_id),
      value: `${d.message_count} сообщений за ${d.date}`,
    });
  }

  return Response.json({
    records,
    topVoice: topVoice.map((r) => ({
      ...r,
      display_name: getName(r.discord_id),
      avatar_url: userMap[r.discord_id]?.avatar_url || null,
    })),
    topMsg: topMsg.map((r) => ({
      ...r,
      display_name: getName(r.discord_id),
      avatar_url: userMap[r.discord_id]?.avatar_url || null,
    })),
  });
}
