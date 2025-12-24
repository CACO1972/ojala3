import { NextResponse } from "next/server";
import { z } from "zod";
import { toPublicError } from "@/src/lib/errors";

const Schema = z.object({
  nombre: z.string().min(2),
  celular: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  mensaje: z.string().min(3),
  files: z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })).min(1),
  images: z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })).optional()
});

// stub
const leads: any[] = [];

export async function POST(req: Request) {
  try {
    const payload = Schema.parse(await req.json());
    leads.push({ ts: Date.now(), ...payload });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}
