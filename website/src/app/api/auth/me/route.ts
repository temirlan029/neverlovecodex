import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      discordId: session.discordId,
      username: session.username,
      displayName: session.displayName,
      avatar: session.avatar,
      isMember: session.isMember,
    },
  });
}
