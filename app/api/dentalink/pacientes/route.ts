import { NextResponse } from "next/server";
import { z } from "zod";
import { dentalinkFetch } from "@/src/lib/dentalink-client";
import { toPublicError, ApiError } from "@/src/lib/errors";

const CreateSchema = z.object({
  nombre: z.string().min(2),
  apellidos: z.string().min(2),
  rut: z.string().min(3),
  celular: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  triage: z.any().optional(),
  specialty: z.string().optional(),
  consent: z.boolean().optional(),
  attachments: z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })).optional()
});

// Stub de leads (fase 1). En fase 2 -> DB
const leads: any[] = [];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    // Dentalink suele soportar búsqueda por 'q' (puede variar). Mantener flexible.
    const path = q ? `pacientes?q=${encodeURIComponent(q)}` : "pacientes";
    const data = await dentalinkFetch<any>(path, { method: "GET" });
    return NextResponse.json(data);
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CreateSchema.parse(json);

    // 1) Guardar lead local (stub)
    leads.push({
      ts: Date.now(),
      ...input,
      // No guardar adjuntos reales aquí
    });

    // 2) Crear ficha en Dentalink (campos pueden variar por instancia)
    //    Mantenemos un payload básico y tolerante.
    const payload = {
      nombres: input.nombre,
      apellidos: input.apellidos,
      rut: input.rut,
      celular: input.celular,
      email: input.email || undefined
    };

    let created: any = null;
    try {
      created = await dentalinkFetch<any>("pacientes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch {
      // Si Dentalink falla en fase 1, no romper el flujo: devolvemos lead accepted.
      created = null;
    }

    const patientId = created?.id ?? created?.patientId ?? null;

    return NextResponse.json({ ok: true, patientId }, { status: 201 });
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}

export async function DELETE() {
  // seguridad: no exponer dump en prod
  if (process.env.NODE_ENV === "production") throw new ApiError("Not Found", 404);
  leads.length = 0;
  return NextResponse.json({ ok: true });
}
