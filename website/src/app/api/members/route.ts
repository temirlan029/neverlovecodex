import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get all members with their message counts and voice hours
  const { data: members, error: membersErr } = await supabase
    .from("members")
    .select("*")
    .order("display_name");

  if (membersErr) {
    return Response.json({ error: membersErr.message }, { status: 500 });
  }

  // Get total messages per user (all time)
  const { data: msgStats } = await supabase
    .from("message_stats")
    .select("discord_id, message_count");

  // Aggregate messages by user
  const msgByUser: Record<string, number> = {};
  for (const row of msgStats || []) {
    msgByUser[row.discord_id] = (msgByUser[row.discord_id] || 0) + row.message_count;
  }

  // Get total voice minutes per user
  const { data: voiceStats } = await supabase
    .from("voice_sessions")
    .select("discord_id, duration_minutes")
    .not("duration_minutes", "is", null);

  const voiceByUser: Record<string, number> = {};
  for (const row of voiceStats || []) {
    voiceByUser[row.discord_id] = (voiceByUser[row.discord_id] || 0) + (row.duration_minutes || 0);
  }

  // Enrich members
  const enriched = (members || []).map((m) => ({
    discord_id: m.discord_id,
    username: m.username,
    display_name: m.display_name,
    avatar_url: m.avatar_url,
    roles: m.roles || [],
    joined_at: m.joined_at,
    is_online: m.is_online || false,
    is_in_voice: m.is_in_voice || false,
    voice_channel: m.voice_channel,
    messages: msgByUser[m.discord_id] || 0,
    voice_minutes: voiceByUser[m.discord_id] || 0,
    xp: m.xp || 0,
    level: m.level || 0,
  }));

  return Response.json({
    members: enriched,
    total: enriched.length,
    online: enriched.filter((m) => m.is_online).length,
  });
}
