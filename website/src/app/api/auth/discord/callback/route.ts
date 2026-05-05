import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  getDiscordUser,
  getUserGuilds,
  getAvatarUrl,
} from "@/app/lib/discord";
import { createSession } from "@/app/lib/session";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  try {
    // 1. Exchange code for access token
    const tokenData = await exchangeCode(code);

    // 2. Get Discord user info
    const discordUser = await getDiscordUser(tokenData.access_token);

    // 3. Check if user is in our guild
    const guildId = process.env.DISCORD_GUILD_ID;
    let isMember = false;
    if (guildId) {
      const guilds = await getUserGuilds(tokenData.access_token);
      isMember = guilds.some((g) => g.id === guildId);
    } else {
      // If no guild ID configured, allow everyone (dev mode)
      isMember = true;
    }

    const avatarUrl = getAvatarUrl(discordUser);

    // 4. Upsert user in Supabase (if configured)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      await supabase.from("users").upsert(
        {
          discord_id: discordUser.id,
          username: discordUser.username,
          display_name: discordUser.global_name || discordUser.username,
          avatar_url: avatarUrl,
          is_member: isMember,
          last_login: new Date().toISOString(),
        },
        { onConflict: "discord_id" }
      );
    }

    // 5. Create session cookie
    await createSession({
      discordId: discordUser.id,
      username: discordUser.username,
      displayName: discordUser.global_name || discordUser.username,
      avatar: avatarUrl,
      isMember,
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", req.url)
    );
  }
}
