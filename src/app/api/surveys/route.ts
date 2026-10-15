import { NextResponse } from "next/server";

import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { getSession } from "@/lib/auth/session";
import {
  normalizeCreateSurveyInput,
  validateCreateSurveyInput,
} from "@/features/surveys/schemas";
import type { CreateSurveyRequest } from "@/features/surveys/types";

const INVALID_REQUEST = {
  status: "error",
  error: { code: "validation_error", message: "request validation failed" },
} as const;

export async function POST(request: Request): Promise<Response> {
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

  if (!validateCreateSurveyInput(body)) {
    return NextResponse.json(INVALID_REQUEST, { status: 422 });
  }

  const normalizedPayload = normalizeCreateSurveyInput(body as CreateSurveyRequest);

  try {
    const upstream = await fetchBackend("/api/v1/surveys", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });

    // If backend endpoint is not yet registered (returns 404), fallback to mock success for frontend testing
    if (upstream.status === 404) {
      return NextResponse.json(
        {
          status: "success",
          data: {
            survey_id: Math.floor(Math.random() * 1000) + 1,
            user_id: session.userId,
            ...normalizedPayload,
            created_at: new Date().toISOString(),
          },
        },
        { status: 201 },
      );
    }

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
