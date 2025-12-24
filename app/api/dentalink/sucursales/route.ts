import { NextResponse } from "next/server";
import { dentalinkFetch } from "@/src/lib/dentalink-client";
import { toPublicError } from "@/src/lib/errors";

export async function GET() {
  try {
    const data = await dentalinkFetch<any>("sucursales", { method: "GET" });
    return NextResponse.json(data);
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}
