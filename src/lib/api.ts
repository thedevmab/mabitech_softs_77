import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

/** Short public cache for list/detail content GETs. */
export function publicCacheHeaders(seconds = 60): HeadersInit {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`,
    "CDN-Cache-Control": `public, s-maxage=${seconds}`,
  };
}

/** Auth, me, download grants — never cache. */
export function privateNoStoreHeaders(): HeadersInit {
  return { "Cache-Control": "private, no-store" };
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ApiErrorBody = { error: { code, message, details } };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid request", error.flatten());
  }
  if (error instanceof ApiError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }
  console.error(error);
  return jsonError(500, "INTERNAL_ERROR", "Something went wrong");
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json().catch(() => {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON");
  });
  return schema.parse(body);
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20) || 20));
  const cursor = searchParams.get("cursor") || undefined;
  return { page, limit, skip: (page - 1) * limit, cursor };
}
