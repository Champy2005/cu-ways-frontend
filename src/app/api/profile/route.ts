import { NextResponse } from "next/server";

import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { getSession } from "@/lib/auth/session";
import { validateContactUpdate } from "@/features/users/schemas";

const INVALID_REQUEST = {
  status: "error",
  error: { code: "validation_error", message: "request validation failed" },
} as const;

export async function PUT(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { status: "error", error: { code: "unauthorized", message: "authentication is required" } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(INVALID_REQUEST, { status: 422 });
  }

  if (!validateContactUpdate(body)) {
    return NextResponse.json(INVALID_REQUEST, { status: 422 });
  }

  try {
    const upstream = await fetchBackend(`/api/v1/users/${session.userId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(body),
    });
    const payload = await readBackendPayload(upstream);
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: { code: "backend_unavailable", message: "backend service is unavailable" },
      },
      { status: 503 },
    );
  }
}
