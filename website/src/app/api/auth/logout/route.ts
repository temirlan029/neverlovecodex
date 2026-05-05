import { NextResponse } from "next/server";
import { deleteSession } from "@/app/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/", req.url));
}
