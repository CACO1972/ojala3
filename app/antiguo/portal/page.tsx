import Link from "next/link";
import { redirect } from "next/navigation";
import { AGENDA_ONLINE_URL, WHATSAPP_URL } from "@/src/lib/constants";
import { dentalinkFetch } from "@/src/lib/dentalink-client";
import { getSession } from "@/src/lib/session";
import { Card } from "../../_components/ui";

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export default async function PortalPage() {
  const session = getSession();
  if (!session) redirect("/antiguo");

  const patientId = session.patientId;

  const citas = await safe(() => dentalinkFetch<any>(`pacientes/${patientId}/citas`));
  const pagos = await safe(() => dentalinkFetch<any>(`pacientes/${patientId}/pagos`));
  const tratamientos = await safe(() => dentalinkFetch<any>(`pacientes/${patientId}/tratamientos`));
  const archivos = await safe(() => dentalinkFetch<any>(`pacientes/${patientId}/archivos`));

  return (
    <main className="bg-grid relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-90" />
      <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
            ← Inicio
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-slate-900">
              WhatsApp
            </a>
            <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-slate-900">
              Cambiar hora →
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="text-slate-700 hover:text-slate-900">Salir</button>
            </form>
          </div>
        </div>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-semibold">Tu portal</h1>
        <p className="mt-2 text-sm text-slate-600">Acceso seguro. Si algo falla, puedes reagendar en la agenda online.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <div className="font-medium">Citas</div>
            <div className="mt-2 text-sm text-slate-600">
              {citas ? <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(citas, null, 2)}</pre> : "No disponible por ahora."}
            </div>
          </Card>

          <Card>
            <div className="font-medium">Tratamientos</div>
            <div className="mt-2 text-sm text-slate-600">
              {tratamientos ? <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(tratamientos, null, 2)}</pre> : "No disponible por ahora."}
            </div>
          </Card>

          <Card>
            <div className="font-medium">Pagos y deuda</div>
            <div className="mt-2 text-sm text-slate-600">
              {pagos ? <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(pagos, null, 2)}</pre> : "No disponible por ahora."}
            </div>
          </Card>

          <Card>
            <div className="font-medium">Archivos clínicos</div>
            <div className="mt-2 text-sm text-slate-600">
              {archivos ? <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(archivos, null, 2)}</pre> : "No disponible por ahora."}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              * En fase 2 se generan links temporales on-demand.
            </div>
          </Card>
        </div>

        <Card className="mt-6">
          <div className="font-medium">Acción rápida</div>
          <div className="mt-2 text-sm text-slate-600">
            Si quieres cambiar tu hora ahora, usa Agenda Online oficial.
          </div>
          <div className="mt-4">
            <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
              Cambiar hora / Agendar
            </a>
          </div>
        </Card>

        <div className="mt-6 text-xs text-slate-500">Sesión: {session.rut} · Paciente ID: {patientId}</div>
      </div>
    </main>
  );
}
