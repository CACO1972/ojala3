"use client";

import React from "react";
import Link from "next/link";
import { z } from "zod";
import { AGENDA_ONLINE_URL, WHATSAPP_URL } from "@/src/lib/constants";
import { Button, Card, Input, Textarea } from "../_components/ui";
import { useToast } from "../_components/toast";
import { track } from "@/src/lib/track";

const Schema = z.object({
  nombre: z.string().min(2),
  celular: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  mensaje: z.string().min(3)
});

type Form = z.infer<typeof Schema>;

export default function SegundaOpinionPage() {
  const { push } = useToast();
  const [form, setForm] = React.useState<Form>({ nombre: "", celular: "", email: "", mensaje: "" });
  const [file, setFile] = React.useState<File | null>(null);
  const [images, setImages] = React.useState<File[]>([]);
  const [sent, setSent] = React.useState(false);

  async function submit() {
    try {
      Schema.parse(form);
      if (!file) throw new Error("Sube al menos un presupuesto (PDF/JPG)");

      const payload = {
        ...form,
        files: [{ name: file.name, type: file.type, size: file.size }],
        images: images.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      };

      const res = await fetch("/api/leads/segunda-opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "No fue posible enviar");

      setSent(true);
      push({ title: "Recibido", description: "Te contactaremos con una explicación y opciones.", kind: "success" });
      track({ name: "segunda_opinion_submit_ok" });
    } catch (e: any) {
      push({ title: "Revisa los datos", description: e?.message ?? "Error", kind: "error" });
      track({ name: "segunda_opinion_submit_error" });
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

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-semibold">Segunda opinión</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sube un presupuesto (anonimizado). Opcional: radiografías/fotos. Te devolvemos explicación y alternativas.
        </p>

        <Card className="mt-6 space-y-4">
          {!sent ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-slate-600">Nombre</div>
                  <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div>
                  <div className="mb-1 text-xs text-slate-600">Celular</div>
                  <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs text-slate-600">Email (opcional)</div>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-600">Mensaje</div>
                <Textarea rows={4} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} placeholder="Qué te ofrecieron, qué te preocupa, objetivo (estética/función)" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                Importante: tacha nombre de clínica y dentista antes de subir el documento.
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-600">Presupuesto (PDF/JPG)</div>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <div className="text-xs text-slate-600">{file.name}</div> : null}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-600">Radiografías / fotos (opcional)</div>
                <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files ?? []))} />
                {images.length ? <div className="text-xs text-slate-600">{images.map((f) => f.name).join(", ")}</div> : null}
              </div>

              <Button onClick={submit}>Enviar para revisión</Button>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <div className="font-medium">Recibido.</div>
                <div className="text-slate-600">Te enviaremos comparación + explicación + opciones de financiamiento.</div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full">Agendar videoconsulta</Button>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">WhatsApp</Button>
                </a>
              </div>
            </>
          )}
        </Card>

        <div className="mt-6 text-xs text-slate-500">
          Módulo de comparación listo para OCR/IA (fase posterior). En fase 1 almacenamos lead y metadata.
        </div>
      </div>
    </main>
  );
}
