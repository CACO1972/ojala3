"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { isValidRut, normalizeRut } from "@/src/lib/rut";
import { AGENDA_ONLINE_URL, WHATSAPP_URL } from "@/src/lib/constants";
import { Button, Card, Input } from "../_components/ui";
import { useToast } from "../_components/toast";
import { track } from "@/src/lib/track";

const RutSchema = z.string().refine((v) => isValidRut(v), "RUT inválido");

export default function AntiguoLoginPage() {
  const router = useRouter();
  const { push } = useToast();
  const [rut, setRut] = React.useState("");
  const [stage, setStage] = React.useState<"rut" | "otp">("rut");
  const [mask, setMask] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function requestOtp() {
    try {
      setLoading(true);
      const r = normalizeRut(rut);
      RutSchema.parse(r);

      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: r })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "No se pudo enviar el código");

      setMask(data?.toMasked ?? null);
      setStage("otp");
      track({ name: "antiguo_request_otp_ok" });
      push({ title: "Código enviado", description: `Enviamos un SMS${data?.toMasked ? ` a ${data.toMasked}` : ""}.`, kind: "success" });
    } catch (e: any) {
      track({ name: "antiguo_request_otp_error" });
      push({ title: "No pudimos enviar", description: e?.message ?? "Error", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Código inválido");

      track({ name: "antiguo_verify_otp_ok" });
      router.push("/antiguo/portal");
    } catch (e: any) {
      track({ name: "antiguo_verify_otp_error" });
      push({ title: "Revisa el código", description: e?.message ?? "Error", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-grid relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-90" />
      <div className="relative mx-auto max-w-xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
            ← Volver
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-slate-900">
            WhatsApp
          </a>
        </div>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-semibold">Portal de paciente</h1>
        <p className="mt-2 text-sm text-slate-600">Accede con tu RUT y verificación por SMS.</p>

        <Card className="mt-6 space-y-4">
          {stage === "rut" ? (
            <>
              <div>
                <div className="mb-1 text-xs text-slate-600">RUT (sin puntos con guión)</div>
                <Input value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12345678-9" />
              </div>
              <Button onClick={requestOtp} disabled={loading}>
                {loading ? "Enviando..." : "Enviar código por SMS"}
              </Button>
              <div className="text-xs text-slate-500">
                Si tienes problemas, usa el botón de "Cambiar hora" o WhatsApp.
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                Código enviado{mask ? ` a ${mask}` : ""}. Ingresa el código de 6 dígitos.
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600">Código</div>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" inputMode="numeric" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStage("rut")} disabled={loading}>
                  Volver
                </Button>
                <Button onClick={verifyOtp} disabled={loading}>
                  {loading ? "Verificando..." : "Entrar"}
                </Button>
              </div>
              <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="inline-block text-sm text-slate-700 hover:text-slate-900">
                Cambiar hora (Agenda Online) →
              </a>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
