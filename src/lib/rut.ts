/**
 * RUT chileno
 * - Entrada esperada: sin puntos y con guión (ej: 12345678-9)
 * - DV puede ser 0-9 o K
 */

export function normalizeRut(input: string): string {
  const raw = (input || "").trim().toUpperCase();
  const cleaned = raw.replace(/\./g, "").replace(/\s+/g, "");
  // permitir que venga sin guión
  if (!cleaned.includes("-")) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${body}-${dv}`;
  }
  return cleaned;
}

export function rutSplit(input: string): { body: string; dv: string } | null {
  const rut = normalizeRut(input);
  const match = rut.match(/^([0-9]{1,9})-([0-9K])$/);
  if (!match) return null;
  return { body: match[1], dv: match[2] };
}

export function computeRutDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  if (mod === 11) return "0";
  if (mod === 10) return "K";
  return String(mod);
}

export function isValidRut(input: string): boolean {
  const parts = rutSplit(input);
  if (!parts) return false;
  return computeRutDv(parts.body) === parts.dv;
}
