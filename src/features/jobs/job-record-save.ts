import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";

/**
 * Server-side helpers shared by the server actions that create a job's single
 * record (its payment or its review). The backend allows one per job, so a
 * request whose result is unclear is resolved by reading the record back
 * instead of guessing or submitting again.
 */

/** A stalled backend must not hold the Creator in a pending state indefinitely. */
const REQUEST_TIMEOUT_MS = 15_000;

export const SESSION_EXPIRED = "Your session expired. Sign in again to continue.";
export const NO_ACCESS = "You no longer have access to this job. Return to your jobs to continue.";

export function validJobId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

/** The session or ownership message for a 401, 403 or 404, otherwise null. */
export function accessErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 401) return SESSION_EXPIRED;
  if (error.status === 403 || error.status === 404) return NO_ACCESS;
  return null;
}

export type JobRecordSave<Saved, Existing> =
  | { status: "saved"; record: Saved }
  /** The record already existed (duplicate) or was found after an unclear request. */
  | { status: "existing"; record: Existing; afterUnclearRequest: boolean }
  /** The backend refused a duplicate, but the existing record could not be read. */
  | { status: "existing_unconfirmed" }
  /** The request failed or timed out and no saved record was found yet. */
  | { status: "unknown" }
  /** The backend refused the request for another reason, so nothing was saved. */
  | { status: "rejected"; error: ApiError };

async function readQuietly<T>(read: () => Promise<T | null>): Promise<T | null | undefined> {
  try {
    return await read();
  } catch {
    return undefined;
  }
}

/**
 * Finding nothing after a failed or timed-out request is not proof that it
 * failed: the backend may still be saving it. So the outcome stays unknown
 * and the Creator checks again rather than being told it was not saved.
 */
async function confirmUnclearRequest<S, E>(
  read: () => Promise<E | null>,
): Promise<JobRecordSave<S, E>> {
  const record = await readQuietly(read);
  return record ? { status: "existing", record, afterUnclearRequest: true } : { status: "unknown" };
}

export async function saveJobRecord<Saved, Existing>({
  path,
  body,
  isSaved,
  readCurrent,
  duplicateCode,
}: {
  path: string;
  body: unknown;
  isSaved: (value: unknown) => value is Saved;
  readCurrent: () => Promise<Existing | null>;
  duplicateCode: string;
}): Promise<JobRecordSave<Saved, Existing>> {
  let saved: unknown;
  try {
    saved = await serverApiRequest<unknown>(path, {
      method: "POST",
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (!(error instanceof ApiError)) return confirmUnclearRequest(readCurrent);
    if (error.code !== duplicateCode) return { status: "rejected", error };
    // Read the real record so its status is shown, never assumed.
    const record = await readQuietly(readCurrent);
    return record
      ? { status: "existing", record, afterUnclearRequest: false }
      : { status: "existing_unconfirmed" };
  }
  return isSaved(saved) ? { status: "saved", record: saved } : confirmUnclearRequest(readCurrent);
}

export type JobRecordCheck<T> =
  { status: "found"; record: T } | { status: "none" } | { status: "error"; message: string };

/** Reads the record again, for when an earlier request had an unknown result. */
export async function checkJobRecord<T>(
  read: () => Promise<T | null>,
  failureMessage: string,
): Promise<JobRecordCheck<T>> {
  try {
    const record = await read();
    return record ? { status: "found", record } : { status: "none" };
  } catch (error) {
    return { status: "error", message: accessErrorMessage(error) ?? failureMessage };
  }
}
