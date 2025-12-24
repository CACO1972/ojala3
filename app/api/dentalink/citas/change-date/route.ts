import { NextResponse } from "next/server";
import { AGENDA_ONLINE_URL } from "@/src/lib/constants";

export async function POST() {
  // Fase 1: derivar a Agenda Online oficial
  return NextResponse.json({ ok: false, phase: 1, redirect: AGENDA_ONLINE_URL }, { status: 501 });
}
