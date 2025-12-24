import crypto from "crypto";
import { cookies } from "next/headers";
import { ApiError } from "./errors";

const SESSION_COOKIE = "cm_session";
const OTP_CHALLENGE_COOKIE = "cm_otp";

type SessionPayload = {
  patientId: string;
  rut: string;
  iat: number;
};

type OtpChallengePayload = {
  patientId: string;
  rut: string;
  phone: string;
  iat: number;
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new ApiError("SESSION_SECRET faltante", 500, "MISSING_SESSION_SECRET");
  return s;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function unbase64url(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  return Buffer.from(input, "base64");
}

function sign(payload: unknown) {
  const json = JSON.stringify(payload);
  const p = base64url(json);
  const sig = crypto.createHmac("sha256", secret()).update(p).digest();
  return `${p}.${base64url(sig)}`;
}

function verify<T>(token: string): T | null {
  const [p, s] = token.split(".");
  if (!p || !s) return null;
  const expected = crypto.createHmac("sha256", secret()).update(p).digest();
  const got = unbase64url(s);
  if (got.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(got, expected)) return null;
  try {
    return JSON.parse(unbase64url(p).toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function setSession(payload: Omit<SessionPayload, "iat">) {
  const value = sign({ ...payload, iat: Date.now() });
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 días
  });
}

export function getSession(): SessionPayload | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!value) return null;
  return verify<SessionPayload>(value);
}

export function clearSession() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function setOtpChallenge(payload: Omit<OtpChallengePayload, "iat">) {
  const value = sign({ ...payload, iat: Date.now() });
  cookies().set(OTP_CHALLENGE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10 // 10 minutos
  });
}

export function getOtpChallenge(): OtpChallengePayload | null {
  const value = cookies().get(OTP_CHALLENGE_COOKIE)?.value;
  if (!value) return null;
  return verify<OtpChallengePayload>(value);
}

export function clearOtpChallenge() {
  cookies().set(OTP_CHALLENGE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
