import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";

// Pages that require authentication (clan members only)
const protectedRoutes = [
  "/members",
  "/shame",
  "/maps",
  "/tactics",
  "/training",
  "/stats",
];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  if (!isProtectedRoute) return NextResponse.next();

  // Check session
  const cookie = (await cookies()).get("neverlove-session")?.value;
  const session = await decrypt(cookie);

  if (!session?.discordId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is a guild member
  if (!session.isMember) {
    return NextResponse.redirect(new URL("/login?error=not_member", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon\\.ico).*)"],
};
