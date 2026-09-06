const DEFAULT_BACKEND_API_URL = "http://localhost:8081";
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

/**
 * Server-only configuration. Do not import this module from a Client
 * Component: BACKEND_API_URL must never be exposed to the browser bundle.
 */
export function getBackendApiUrl(): string {
  return process.env.BACKEND_API_URL?.trim() || DEFAULT_BACKEND_API_URL;
}

/**
 * The public origin of this Next.js application. Auth BFF routes use it to
 * reject cross-site login and registration requests.
 */
export function getFrontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN?.trim() || DEFAULT_FRONTEND_ORIGIN;
}
