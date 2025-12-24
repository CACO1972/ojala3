import { ApiError } from "./errors";

const DEFAULT_BASE_URL = "https://api.dentalink.healthatom.com/api/v1";

type Json = Record<string, unknown> | unknown[] | null;

export type DentalinkClientOptions = {
  baseUrl?: string;
  token?: string;
  clientId?: string;
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(id) };
}

/**
 * Cliente para API de Dentalink
 * 
 * Variables de entorno requeridas:
 * - DENTALINK_TOKEN: Token de autenticación
 * - DENTALINK_CLIENT_ID: ID del cliente (opcional, algunas rutas lo requieren)
 * - DENTALINK_BASE_URL: URL base (opcional, default: https://api.dentalink.healthatom.com/api/v1)
 */
export async function dentalinkFetch<T extends Json>(
  path: string,
  init: RequestInit = {},
  opts: DentalinkClientOptions = {}
): Promise<T> {
  const baseUrl = opts.baseUrl ?? process.env.DENTALINK_BASE_URL ?? DEFAULT_BASE_URL;
  const token = opts.token ?? process.env.DENTALINK_TOKEN;
  const clientId = opts.clientId ?? process.env.DENTALINK_CLIENT_ID;

  if (!token) {
    throw new ApiError("Dentalink no configurado (falta DENTALINK_TOKEN)", 500, "DENTALINK_MISSING_TOKEN");
  }

  // Reemplazar {clientId} en la ruta si existe
  let finalPath = path;
  if (path.includes("{clientId}")) {
    if (!clientId) {
      throw new ApiError("Dentalink no configurado (falta DENTALINK_CLIENT_ID)", 500, "DENTALINK_MISSING_CLIENT_ID");
    }
    finalPath = path.replace("{clientId}", clientId);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${finalPath.replace(/^\//, "")}`;
  const { controller, clear } = withTimeout(12_000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
        ...(init.headers ?? {})
      }
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : (null as T);

    if (!res.ok) {
      console.error("Dentalink error:", res.status, text);
      throw new ApiError("Error al consultar Dentalink", res.status, "DENTALINK_ERROR");
    }

    return data;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError("Timeout consultando Dentalink", 504, "DENTALINK_TIMEOUT");
    }
    throw e;
  } finally {
    clear();
  }
}

/**
 * Obtener pacientes
 */
export async function getPacientes(params?: { rut?: string; nombre?: string; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.rut) searchParams.set("rut", params.rut);
  if (params?.nombre) searchParams.set("nombre", params.nombre);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  
  const query = searchParams.toString();
  return dentalinkFetch(`/pacientes${query ? `?${query}` : ""}`);
}

/**
 * Obtener paciente por ID
 */
export async function getPaciente(id: string) {
  return dentalinkFetch(`/pacientes/${id}`);
}

/**
 * Obtener citas de un paciente
 */
export async function getCitasPaciente(pacienteId: string) {
  return dentalinkFetch(`/pacientes/${pacienteId}/citas`);
}

/**
 * Obtener sucursales
 */
export async function getSucursales() {
  return dentalinkFetch("/sucursales");
}

/**
 * Obtener tratamientos de un paciente
 */
export async function getTratamientosPaciente(pacienteId: string) {
  return dentalinkFetch(`/pacientes/${pacienteId}/tratamientos`);
}

/**
 * Obtener pagos de un paciente
 */
export async function getPagosPaciente(pacienteId: string) {
  return dentalinkFetch(`/pacientes/${pacienteId}/pagos`);
}
