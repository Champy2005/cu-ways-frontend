import { NextResponse } from "next/server";

import {
  fetchBackend,
  readBackendPayload,
} from "@/lib/api/backend-client";
import { extractData, isRecord } from "@/lib/api/envelope";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import {
  validateLoginInput,
  validateRegisterInput,
} from "@/features/auth/schemas";

type AuthRequestValidator = (value: unknown) => boolean;

const INVALID_REQUEST = {
  status: "error",
  error: {
    code: "validation_error",
    message: "request validation failed",
  },
} as const;

const INVALID_ORIGIN = {
  status: "error",
  error: {
    code: "invalid_origin",
    message: "request origin is not allowed",
  },
} as const;

const INVALID_UPSTREAM_RESPONSE = {
  status: "error",
  error: {
    code: "authentication_unavailable",
    message: "authentication service returned an invalid response",
  },
} as const;

export async function handleAuthRequest(
  request: Request,
  path: string,
  validator: AuthRequestValidator,
): Promise<Response> {
  if (!isAllowedFrontendOrigin(request.headers.get("origin"))) {
    return NextResponse.json(INVALID_ORIGIN, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(INVALID_REQUEST, { status: 422 });
  }

  if (!validator(body)) {
    return NextResponse.json(INVALID_REQUEST, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetchBackend(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "backend_unavailable",
          message: "backend service is unavailable",
        },
      },
      { status: 503 },
    );
  }

  const payload = await readBackendPayload(upstream);
  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const authData = extractData<Record<string, unknown>>(payload);
  const token = authData?.access_token;
  if (!isRecord(payload) || !authData || typeof token !== "string" || token.length === 0) {
    return NextResponse.json(INVALID_UPSTREAM_RESPONSE, { status: 502 });
  }

  const safeAuthData = { ...authData };
  delete safeAuthData.access_token;
  const safePayload = { ...payload, data: safeAuthData };
  const response = NextResponse.json(safePayload, { status: upstream.status });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}

export { validateLoginInput, validateRegisterInput };
