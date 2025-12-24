export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function toPublicError(err: unknown): { message: string; status: number; code?: string } {
  if (err instanceof ApiError) return { message: err.message, status: err.status, code: err.code };
  return { message: "Error inesperado", status: 500 };
}
