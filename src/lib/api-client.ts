export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string = "REQUEST_FAILED",
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  let payload: { data?: T; error?: { message: string; code?: string; details?: unknown } };
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("Respon server tidak valid", "INVALID_RESPONSE", response.status);
  }

  if (!response.ok || payload.error) {
    const error = payload.error;
    throw new ApiError(
      error?.message || "Permintaan gagal diproses",
      error?.code || "HTTP_ERROR",
      response.status,
      error?.details,
    );
  }

  return payload.data as T;
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: "DELETE" }),
};
