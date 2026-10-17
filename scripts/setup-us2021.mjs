import { randomInt, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function localBackendUrl(value) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Manual setup requires a loopback development backend URL, such as http://127.0.0.1:8081.",
    );
  return url.origin;
}

export function accountInput(role) {
  return {
    name:
      role === "creator"
        ? "Manual Test Creator"
        : role === "marketer"
          ? "Manual Test Marketer"
          : "Manual Test Empty Inbox",
    email: `manual-us2021-${role}-${randomUUID()}@example.test`,
    password: randomUUID(),
    phone: `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`,
    ...(role === "creator"
      ? {}
      : {
          marketer_profile: {
            bio: "Local manual testing",
            experience_years: 0,
            availability_text: "",
          },
        }),
  };
}

export async function prepareInvitations(api, accounts, now = new Date()) {
  const deadline = new Date(now.getTime() + 21 * 86_400_000).toISOString();
  const deliveryDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() + 7 * 86_400_000));
  const creator = accounts.creator;
  const marketer = accounts.marketer;
  const survey = await api("/api/v1/surveys", creator.token, {
    title: "Campus survey for manual testing",
    survey_link: "https://example.test/manual-survey",
    description: "Synthetic survey metadata for testing invitations and offers.",
    target_group: "University students",
    desired_responses: 50,
    deadline,
  });
  const scenarios = [];
  for (const scenario of [
    "Accept this invitation",
    "Decline this invitation",
    "Submit an offer",
    "View saved offer",
  ]) {
    const job = await api("/api/v1/jobs", creator.token, { survey_ids: [survey.survey_id] });
    const requests = await api(`/api/v1/jobs/${job.job_id}/requests`, creator.token, {
      marketer_ids: [marketer.id],
    });
    const requestId = requests[0].job_request_id;
    if (scenario === "Accept this invitation")
      await api(`/api/v1/jobs/${job.job_id}/briefs`, creator.token, {
        url: "https://example.test/manual-brief",
      });
    if (scenario === "Submit an offer" || scenario === "View saved offer")
      await api(`/api/v1/me/job-requests/${requestId}/accept`, marketer.token, {});
    if (scenario === "View saved offer")
      await api(`/api/v1/me/job-requests/${requestId}/offers`, marketer.token, {
        offered_price: "1200.50",
        delivery_date: deliveryDate,
        message: "A saved offer for manual testing.",
      });
    scenarios.push({ scenario, jobId: job.job_id, requestId });
  }
  return { surveyId: survey.survey_id, deadline, suggestedDeliveryDate: deliveryDate, scenarios };
}

export async function setupManualData() {
  const backendURL = localBackendUrl(process.env.BACKEND_API_URL || "http://127.0.0.1:8081");
  async function api(path, token, body) {
    const response = await fetch(`${backendURL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error(
        `Local API returned ${response.status} for ${path}. Check backend readiness and its existing migrations (including 7–9).`,
      );
    const payload = await response.json();
    if (payload.status !== "success" || !payload.data)
      throw new Error(`Unexpected response from ${path}.`);
    return payload.data;
  }
  await api("/readyz");
  const createdAt = new Date().toISOString();
  const directory = resolve(".artifacts/manual-us2021");
  await mkdir(directory, { recursive: true });
  const file = resolve(
    directory,
    `${createdAt.replaceAll(":", "-")}-${randomUUID().slice(0, 8)}.json`,
  );
  const inputs = Object.fromEntries(
    ["creator", "marketer", "emptyMarketer"].map((role) => [role, accountInput(role)]),
  );
  const credentials = {
    backendURL,
    createdAt,
    accounts: Object.fromEntries(
      Object.entries(inputs).map(([role, input]) => [
        role,
        { email: input.email, password: input.password },
      ]),
    ),
  };
  // Save credentials before creating records so they remain available even if setup is interrupted.
  await writeFile(file, JSON.stringify(credentials, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const accounts = {};
  for (const [role, input] of Object.entries(inputs)) {
    const auth = await api("/api/v1/auth/register", undefined, input);
    accounts[role] = { token: auth.access_token, id: auth.user.user_id };
    credentials.accounts[role].userId = auth.user.user_id;
  }
  const fixture = await prepareInvitations(api, accounts);
  await writeFile(file, JSON.stringify({ ...credentials, ...fixture }, null, 2) + "\n", {
    mode: 0o600,
  });
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes("--help")) {
    console.log(
      "pnpm setup:us2021: create fresh local test accounts and four invitations through existing APIs.\nStart the migrated backend first. BACKEND_API_URL defaults to http://127.0.0.1:8081.\nCredentials and job IDs are written only to ignored .artifacts/manual-us2021/*.json. Existing records are never changed or deleted.",
    );
  } else {
    setupManualData()
      .then((file) => {
        console.log(
          `Manual US20/21 test data is ready.\nCredentials and scenario IDs: ${file}\nStart pnpm dev, open /login, and sign in with the marketer credentials. Use emptyMarketer to check the gray-bird empty state.\nExample survey URLs are intentionally not real forms.`,
        );
      })
      .catch(() => {
        console.error(
          "Manual setup could not finish. Start the local backend, apply its existing migrations 7–9, and check BACKEND_API_URL. Any generated credentials remain in ignored .artifacts/manual-us2021/. No existing records were changed.",
        );
        process.exitCode = 1;
      });
  }
}
