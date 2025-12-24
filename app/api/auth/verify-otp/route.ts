import { NextResponse } from "next/server";
import { z } from "zod";
import { getOtpProvider } from "@/src/lib/otp";
import { rateLimit } from "@/src/lib/rate-limit";
import { ApiError, toPublicError } from "@/src/lib/errors";
import { getOtpChallenge, clearOtpChallenge, setSession } from "@/src/lib/session";

const BodySchema = z.object({ code: z.string().min(4).max(10) });

function getIP(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    rateLimit(`otp_ver:${ip}`, { limit: 12, windowMs: 60_000 });

    const { code } = BodySchema.parse(await req.json());
    const challenge = getOtpChallenge();
    if (!challenge) throw new ApiError("Sesión expirada. Repite el ingreso.", 401, "NO_CHALLENGE");

    const provider = getOtpProvider();
    const ok = await provider.verifyOtp({ to: challenge.phone, code });
    if (!ok) throw new ApiError("Código inválido", 401, "OTP_INVALID");

    setSession({ patientId: challenge.patientId, rut: challenge.rut });
    clearOtpChallenge();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const pub = toPublicError(err);
    return NextResponse.json(pub, { status: pub.status });
  }
}
