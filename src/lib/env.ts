const DEFAULT_BACKEND_API_URL = "http://localhost:8081";

/**
 * Server-only configuration. Do not import this module from a Client
 * Component: BACKEND_API_URL must never be exposed to the browser bundle.
 */
export function getBackendApiUrl(): string {
  return process.env.BACKEND_API_URL?.trim() || DEFAULT_BACKEND_API_URL;
}
