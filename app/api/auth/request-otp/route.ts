import { NextResponse } from "next/server";
import { z } from "zod";
import { dentalinkFetch } from "@/src/lib/dentalink-client";
import { isValidRut, normalizeRut } from "@/src/lib/rut";
import { getOtpProvider } from "@/src/lib/otp";
import { rateLimit } from "@/src/lib/rate-limit";
import { ApiError, toPublicError } from "@/src/lib/errors";
import { setOtpChallenge } from "@/src/lib/session";

const BodySchema = z.object({ rut: z.string().min(3) });

function getIP(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `+${digits.slice(0, digits.length - 4).replace(/./g, "*")}${digits.slice(-4)}`;
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    rateLimit(`otp_req:${ip}`, { limit: 8, windowMs: 60_000 });

    const body = BodySchema.parse(await req.json());
    const rut = normalizeRut(body.rut);
    if (!isValidRut(rut)) throw new ApiError("RUT inválido", 400);

    // Buscar paciente por RUT
    const results = await dentalinkFetch<any>(`pacientes?q=${encodeURIComponent(rut)}`);
    const first = Array.isArray(results) ? results[0] : results?.results?.[0] ?? null;
    if (!first) throw new ApiError("No encontramos tu ficha. Escríbenos por WhatsApp.", 404, "PATIENT_NOT_FOUND");

    const patientId = String(first.id ?? first.patientId ?? "");
    const phone = String(first.celular ?? first.telefono ?? first.phone ?? "");
    if (!patientId) throw new ApiError("Ficha inválida", 500);
    if (!phone) throw new ApiError("No hay celular registrado. Escríbenos por WhatsApp.", 409, "NO_PHONE");

    const provider = getOtpProvider();
    await provider.requestOtp({ to: phone, channel: "sms" });

    setOtpChallenge({ patientId, rut, phone });

    return NextResponse.json({ ok: true, toMasked: maskPhone(phone) });
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}
