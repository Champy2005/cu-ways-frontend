import { randomInt, randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

/**
 * Test data setup through the public backend API. Each run creates its own new
 * synthetic accounts and job, so tests never depend on existing data and can
 * be repeated any number of times.
 *
 * Only the steps that belong to OTHER epics (registering, creating the job,
 * hiring, starting it, adding proof) are done here through the API. Every
 * EPC-08 step is done in the browser, like a real user.
 */
export const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";

export type Account = { name: string; email: string; password: string; token: string; id: number };

export async function api<T>(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${backendURL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Test setup: ${method} ${path} returned ${response.status}`);
  return (await response.json()).data as T;
}

/** Calls the backend and returns the HTTP status and error code instead of throwing. */
export async function apiStatus(path: string, token: string, method = "GET", body?: unknown) {
  const response = await fetch(`${backendURL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string };
  } | null;
  return { status: response.status, code: payload?.error?.code };
}

export async function createAccount(role: "creator" | "marketer", label: string): Promise<Account> {
  const run = randomUUID().slice(0, 8);
  const name = `EPC08 ${label} ${run}`;
  const email = `epc08-${label.toLowerCase()}-${run}@example.test`;
  const password = randomUUID();
  const auth = await api<{ access_token: string; user: { user_id: number } }>(
    "/api/v1/auth/register",
    undefined,
    "POST",
    {
      email,
      password,
      name,
      phone: `09${randomInt(100_000_000).toString().padStart(8, "0")}`,
      ...(role === "marketer"
        ? {
            marketer_profile: {
              bio: "Synthetic EPC-08 test marketer",
              experience_years: 1,
              availability_text: "",
            },
          }
        : {}),
    },
  );
  return { name, email, password, token: auth.access_token, id: auth.user.user_id };
}

/**
 * Creates a job owned by `creator` and hires `marketer` at the given price,
 * so the job is Accepted and ready for payment (EPC-05 and EPC-06 steps).
 */
export async function createAcceptedJob(creator: Account, marketer: Account, price: string) {
  const survey = await api<{ survey_id: number }>("/api/v1/surveys", creator.token, "POST", {
    title: "EPC-08 payment survey",
    survey_link: "https://example.test/epc08-survey",
    deadline: "2099-10-28T00:00:00+07:00",
  });
  const title = `EPC-08 payment job ${randomUUID().slice(0, 6)}`;
  const { job_id: jobId } = await api<{ job_id: number }>("/api/v1/jobs", creator.token, "POST", {
    title,
    survey_ids: [survey.survey_id],
    deadline: "2099-10-28",
  });
  const [request] = await api<{ job_request_id: number }[]>(
    `/api/v1/jobs/${jobId}/requests`,
    creator.token,
    "POST",
    { marketer_ids: [marketer.id] },
  );
  const requestPath = `/api/v1/me/job-requests/${request.job_request_id}`;
  await api(`${requestPath}/accept`, marketer.token, "POST");
  const { offer_id: offerId } = await api<{ offer_id: number }>(
    `${requestPath}/offers`,
    marketer.token,
    "POST",
    { offered_price: price, delivery_date: "2099-10-25" },
  );
  await api(`/api/v1/jobs/${jobId}/offers/${offerId}/accept`, creator.token, "POST");
  return { jobId, title };
}

/** EPC-07 steps: the hired marketer starts the job and adds one delivery proof link. */
export async function startJob(marketer: Account, jobId: number) {
  await api(`/api/v1/jobs/${jobId}/start`, marketer.token, "POST");
}

export async function addProof(marketer: Account, jobId: number) {
  await api(`/api/v1/jobs/${jobId}/proofs`, marketer.token, "POST", {
    url: "https://example.test/epc08-delivery-proof",
    attachment_type: "Proof",
  });
}

export async function signIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/(creator|marketer)\/dashboard$/);
}
