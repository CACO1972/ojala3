"use client";

import React from "react";
import Link from "next/link";
import { z } from "zod";
import { isValidRut, normalizeRut } from "@/src/lib/rut";
import { AGENDA_ONLINE_URL, WHATSAPP_URL } from "@/src/lib/constants";
import { track } from "@/src/lib/track";
import { Button, Card, Input, Textarea } from "../_components/ui";
import { Stepper } from "../_components/stepper";
import { useToast } from "../_components/toast";

const BasicSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  rut: z.string().refine((v) => isValidRut(v), "RUT inválido"),
  celular: z.string().min(8, "Celular requerido"),
  email: z.string().email().optional().or(z.literal(""))
});

const QuestionnaireSchema = z.object({
  motivo: z.string().min(3, "Cuéntanos tu motivo"),
  dolor: z.enum(["no", "leve", "moderado", "fuerte"]),
  sangrado: z.boolean().default(false),
  urgencia: z.enum(["normal", "24h", "48h"]).default("normal")
});

type Basic = z.infer<typeof BasicSchema>;
type Q = z.infer<typeof QuestionnaireSchema>;

const steps = ["Datos", "Triage", "Adjuntos", "Confirmación"];

export default function NuevoPage() {
  const { push } = useToast();
  const [step, setStep] = React.useState(0);
  const [basic, setBasic] = React.useState<Basic>({
    nombre: "",
    apellidos: "",
    rut: "",
    celular: "",
    email: ""
  });
  const [q, setQ] = React.useState<Q>({ motivo: "", dolor: "no", sangrado: false, urgencia: "normal" });
  const [consent, setConsent] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<{ patientId: string } | null>(null);

  const derivedSpecialty = React.useMemo(() => {
    if (q.dolor === "fuerte" || q.urgencia === "24h") return "Urgencia";
    if (q.motivo.toLowerCase().includes("implante")) return "Implantología";
    if (q.motivo.toLowerCase().includes("ortodon")) return "Ortodoncia";
    if (q.sangrado) return "Periodoncia";
    return "Evaluación";
  }, [q]);

  async function next() {
    try {
      if (step === 0) {
        const parsed = BasicSchema.parse({ ...basic, rut: normalizeRut(basic.rut) });
        setBasic({ ...parsed, rut: normalizeRut(parsed.rut) });
        track({ name: "nuevo_step_datos_ok" });
      }
      if (step === 1) {
        QuestionnaireSchema.parse(q);
        track({ name: "nuevo_step_triage_ok", props: { specialty: derivedSpecialty } });
      }
      if (step === 2) {
        if (!consent) throw new Error("Debes aceptar el consentimiento informado");
      }
      setStep((s) => Math.min(s + 1, steps.length - 1));
    } catch (e: any) {
      push({ title: "Revisa el formulario", description: e?.message ?? "Error", kind: "error" });
    }
  }

  async function submit() {
    try {
      setLoading(true);
      const payload = {
        ...BasicSchema.parse({ ...basic, rut: normalizeRut(basic.rut) }),
        triage: QuestionnaireSchema.parse(q),
        specialty: derivedSpecialty,
        consent,
        attachments: files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      };

      const res = await fetch("/api/dentalink/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "No fue posible crear la ficha");

      setCreated({ patientId: String(data.patientId ?? "") });
      push({ title: "¡Listo!", description: "Ahora agenda tu evaluación.", kind: "success" });
      track({ name: "nuevo_submit_ok" });
      setStep(3);
    } catch (e: any) {
      track({ name: "nuevo_submit_error" });
      push({ title: "No pudimos enviar", description: e?.message ?? "Error", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-grid relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-90" />
      <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
            ← Volver
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-slate-900">
            WhatsApp
          </a>
        </div>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-semibold">Paciente nuevo</h1>
        <p className="mt-2 text-sm text-slate-600">
          En menos de 2 minutos. Después te llevamos directo a la agenda online.
        </p>

        <div className="mt-5">
          <Stepper steps={steps} current={step} />
        </div>

        <Card className="mt-6">
          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-slate-600">Nombre</div>
                  <Input value={basic.nombre} onChange={(e) => setBasic({ ...basic, nombre: e.target.value })} placeholder="Ej: Camila" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">Apellidos</div>
                  <Input value={basic.apellidos} onChange={(e) => setBasic({ ...basic, apellidos: e.target.value })} placeholder="Ej: Pérez" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">RUT (sin puntos con guión)</div>
                  <Input value={basic.rut} onChange={(e) => setBasic({ ...basic, rut: e.target.value })} placeholder="12345678-9" />
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">Celular</div>
                  <Input value={basic.celular} onChange={(e) => setBasic({ ...basic, celular: e.target.value })} placeholder="+56 9 ..." />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs text-slate-600">Email (opcional)</div>
                  <Input value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} placeholder="correo@ejemplo.com" />
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs text-slate-600">Motivo / qué te preocupa</div>
                <Textarea rows={4} value={q.motivo} onChange={(e) => setQ({ ...q, motivo: e.target.value })} placeholder="Ej: dolor al morder, quiero implantes, estética..." />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-slate-600">Dolor</div>
                  <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={q.dolor} onChange={(e) => setQ({ ...q, dolor: e.target.value as any })}>
                    <option value="no">No</option>
                    <option value="leve">Leve</option>
                    <option value="moderado">Moderado</option>
                    <option value="fuerte">Fuerte</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">Urgencia</div>
                  <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={q.urgencia} onChange={(e) => setQ({ ...q, urgencia: e.target.value as any })}>
                    <option value="normal">Normal</option>
                    <option value="48h">En 48h</option>
                    <option value="24h">En 24h</option>
                  </select>
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <input type="checkbox" checked={q.sangrado} onChange={(e) => setQ({ ...q, sangrado: e.target.checked })} />
                  Sangrado de encías
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm">
                <div className="font-medium">Derivación sugerida</div>
                <div className="text-slate-600">{derivedSpecialty}</div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                Adjunta fotos (opcional). En fase 1 guardamos metadata; el módulo de almacenamiento está listo para Vercel Blob/S3.
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length ? (
                <div className="text-xs text-slate-600">Archivos: {files.map((f) => f.name).join(", ")}</div>
              ) : null}
              <label className="flex gap-2 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                Acepto el consentimiento informado para contacto y orientación clínica.
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <div className="font-medium">Recibido.</div>
                <div className="text-slate-600">
                  {created?.patientId ? `Ficha creada (ID: ${created.patientId}). ` : ""}
                  Ahora agenda tu evaluación.
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full" onClick={() => track({ name: "nuevo_cta_agendar" })}>Agendar en Dentalink</Button>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full" onClick={() => track({ name: "nuevo_cta_whatsapp" })}>
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              Atrás
            </Button>

            {step < 2 ? (
              <Button onClick={next}>Continuar</Button>
            ) : null}

            {step === 2 ? (
              <Button onClick={submit} disabled={loading}>
                {loading ? "Enviando..." : "Enviar y continuar"}
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
