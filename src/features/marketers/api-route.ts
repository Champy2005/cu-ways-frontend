import { NextResponse } from "next/server";

import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { extractData } from "@/lib/api/envelope";
import { apiErrorFromResponse } from "@/lib/api/errors";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import { isPositiveId, readMarketerProfile, readService } from "@/features/marketers/contracts";
import { validateProfileInput, validateServiceInput } from "@/features/marketers/schemas";

interface MutationOptions {
  path: string;
  method: "POST" | "PUT" | "DELETE";
  validate?: (value: unknown) => boolean;
  readData?: (value: unknown) => unknown;
}

function errorResponse(status: number, code: string, message: string, details?: unknown): Response {
  return NextResponse.json({ status: "error", error: { code, message, details } }, { status });
}

async function mutationBody(request: Request, options: MutationOptions): Promise<unknown> {
  if (options.method === "DELETE") return undefined;
  const body: unknown = await request.json();
  if (!options.validate?.(body)) throw new Error("invalid input");
  return body;
}

async function mutationResponse(upstream: Response, options: MutationOptions): Promise<Response> {
  if (upstream.status === 204 && options.method === "DELETE") {
    return new Response(null, { status: 204 });
  }
  const payload = await readBackendPayload(upstream);
  if (!upstream.ok) {
    const error = apiErrorFromResponse(upstream.status, payload);
    return errorResponse(error.status, error.code, error.message, error.details);
  }
  try {
    if (!options.readData) throw new Error("expected an empty deletion response");
    const data = options.readData(extractData<unknown>(payload));
    return NextResponse.json({ status: "success", data }, { status: upstream.status });
  } catch {
    return errorResponse(
      502,
      "invalid_backend_response",
      "Marketer data is temporarily unavailable. Please try again later.",
    );
  }
}

async function handleMutation(request: Request, options: MutationOptions): Promise<Response> {
  if (!isAllowedFrontendOrigin(request.headers.get("origin"))) {
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  }
  const session = await getSession();
  if (!session) return errorResponse(401, "unauthorized", "Authentication is required.");

  let body: unknown;
  try {
    body = await mutationBody(request, options);
  } catch {
    return errorResponse(422, "validation_error", "Check the submitted fields and try again.");
  }
  try {
    const upstream = await fetchBackend(options.path, {
      method: options.method,
      headers: { Authorization: `Bearer ${session.token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return await mutationResponse(upstream, options);
  } catch {
    return errorResponse(
      503,
      "backend_unavailable",
      "The service is unavailable. Please try again later.",
    );
  }
}

export function saveMarketerProfile(request: Request): Promise<Response> {
  return handleMutation(request, {
    path: "/api/v1/marketers/me",
    method: "PUT",
    validate: validateProfileInput,
    readData: readMarketerProfile,
  });
}

export function publishMarketerService(request: Request): Promise<Response> {
  return handleMutation(request, {
    path: "/api/v1/services",
    method: "POST",
    validate: validateServiceInput,
    readData: readService,
  });
}

export function changeMarketerService(
  request: Request,
  id: string,
  method: "PUT" | "DELETE",
): Promise<Response> {
  if (!/^\d+$/.test(id) || !isPositiveId(Number(id))) {
    return Promise.resolve(
      errorResponse(422, "validation_error", "The service identifier is invalid."),
    );
  }
  return handleMutation(request, {
    path: `/api/v1/services/${Number(id)}`,
    method,
    validate: validateServiceInput,
    readData: method === "PUT" ? readService : undefined,
  });
}
