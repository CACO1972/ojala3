import { NextResponse } from "next/server";
import { clearSession, clearOtpChallenge } from "@/src/lib/session";

export async function POST(req: Request) {
  clearSession();
  clearOtpChallenge();
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url, 303);
}
