import "server-only";

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = () => new AppError("Login diperlukan", 401, "UNAUTHENTICATED");
export const forbidden = () => new AppError("Akses ditolak", 403, "FORBIDDEN");
export const notFound = () => new AppError("Data tidak ditemukan", 404, "NOT_FOUND");
export const conflict = (message: string) => new AppError(message, 409, "CONFLICT");
