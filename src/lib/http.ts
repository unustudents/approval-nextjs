import "server-only";
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError, type ZodType } from "zod";
import { AppError } from "@/lib/errors";

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError("Body JSON tidak valid", 400, "INVALID_JSON");
  }

  return schema.parse(body);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    throw new AppError("Origin request tidak diizinkan", 403, "INVALID_ORIGIN");
  }
}

export async function handleApi<T>(operation: () => Promise<T>) {
  try {
    return NextResponse.json({ data: await operation() });
  } catch (error) {
    return handleApiError(error);
  }
}

export function handleApiError(error: unknown) {
  unstable_rethrow(error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Input tidak valid", details: error.flatten() } },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Data dengan nilai tersebut sudah ada" } },
      { status: 409 },
    );
  }

  console.error("API request failed", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" } },
    { status: 500 },
  );
}

export function noContent() {
  return new Response(null, { status: 204 });
}
