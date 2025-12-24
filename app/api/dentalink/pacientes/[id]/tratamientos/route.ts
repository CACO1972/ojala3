import { NextResponse } from "next/server";
import { dentalinkFetch } from "@/src/lib/dentalink-client";
import { toPublicError } from "@/src/lib/errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await dentalinkFetch<any>(`pacientes/${params.id}/tratamientos`, { method: "GET" });
    return NextResponse.json(data);
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}
