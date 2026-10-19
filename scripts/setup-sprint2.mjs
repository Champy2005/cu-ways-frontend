import { randomInt, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { localBackendUrl } from "./setup-us2021.mjs";

function bangkokDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function demoInputs(runId) {
  const password = randomUUID();
  const phones = new Set();
  return Object.fromEntries(
    ["creator", "marketerA", "marketerB", "emptyMarketer", "registration"].map((role) => {
      let phone;
      do {
        phone = `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`;
      } while (phones.has(phone));
      phones.add(phone);
      const marketer = role.includes("arketer");
      return [
        role,
        {
          name: `Sprint2 ${role} ${runId}`,
          email: `sprint2-${role.toLowerCase()}-${runId}@example.test`,
          phone,
          password,
          line_id: `sprint2-${role.toLowerCase()}`,
          ...(marketer
            ? {
                marketer_profile: {
                  bio:
                    role === "marketerB"
                      ? "Student club distribution"
                      : "Campus community outreach",
                  experience_years: role === "marketerB" ? 3 : 1,
                  availability_text: "Available for the sprint demonstration",
                },
              }
            : {}),
        },
      ];
    }),
  );
}

export function createDemoApi(backendURL) {
  const origin = localBackendUrl(backendURL);
  return async (path, token, body) => {
    let response;
    try {
      response = await fetch(`${origin}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
      });
    } catch {
      throw new Error(
        `Cannot reach the local API at ${path}. Start the backend and database first.`,
      );
    }
    if (!response.ok)
      throw new Error(
        `API returned ${response.status} for ${path}. Check migrations and backend readiness.`,
      );
    const payload = await response.json();
    if (payload.status !== "success" || payload.data === undefined)
      throw new Error(`Unexpected response from ${path}.`);
    return payload.data;
  };
}

export async function prepareSprint2(api, inputs, frontendURL, now, checkpoint) {
  const accounts = {};
  for (const role of ["creator", "marketerA", "marketerB", "emptyMarketer"]) {
    const auth = await api("/api/v1/auth/register", undefined, inputs[role]);
    accounts[role] = { id: auth.user.user_id, token: auth.access_token };
    await checkpoint(role, auth.user.user_id);
  }
  for (const role of ["marketerA", "marketerB"]) {
    await api("/api/v1/me/services", accounts[role].token, {
      service_type: `Sprint2 ${role} survey distribution`,
      scope_text: "Reach 50 university students through campus communities.",
      price: role === "marketerA" ? "1200.50" : "1500.00",
    });
  }
  const deadline = new Date(now.getTime() + 21 * 86_400_000).toISOString();
  const deliveryDate = bangkokDate(new Date(now.getTime() + 7 * 86_400_000));
  const briefURLs = [1, 2].map((version) => `${frontendURL}/sprint2-demo/brief-v${version}.txt`);
  const surveys = {};
  for (const [key, title] of Object.entries({
    dining: "Campus dining survey",
    transport: "Campus transport survey",
    decline: "Decline practice invitation",
    backup: "Prepared hiring practice",
  })) {
    surveys[key] = await api("/api/v1/surveys", accounts.creator.token, {
      title,
      description: "Synthetic metadata for Sprint 2 practice.",
      survey_link: `${frontendURL}/sprint2-demo/survey-link.txt`,
      target_group: "Chulalongkorn University students",
      desired_responses: 50,
      deadline,
    });
  }
  async function invite(survey, roles) {
    const job = await api("/api/v1/jobs", accounts.creator.token, {
      survey_ids: [survey.survey_id],
    });
    await api(`/api/v1/jobs/${job.job_id}/briefs`, accounts.creator.token, { url: briefURLs[0] });
    const requests = await api(`/api/v1/jobs/${job.job_id}/requests`, accounts.creator.token, {
      marketer_ids: roles.map((role) => accounts[role].id),
    });
    const requestIds = Object.fromEntries(
      roles.map((role) => {
        const request = requests.find((entry) => entry.marketer_id === accounts[role].id);
        if (!request) throw new Error("The API did not return the expected invitation.");
        return [role, request.job_request_id];
      }),
    );
    return { jobId: job.job_id, requestIds };
  }
  const decline = await invite(surveys.decline, ["marketerA"]);
  const backup = await invite(surveys.backup, ["marketerA", "marketerB"]);
  await api(
    `/api/v1/me/job-requests/${backup.requestIds.marketerB}/accept`,
    accounts.marketerB.token,
    {},
  );
  const offer = await api(
    `/api/v1/me/job-requests/${backup.requestIds.marketerB}/offers`,
    accounts.marketerB.token,
    {
      offered_price: "1500.00",
      delivery_date: deliveryDate,
      message: "Distribution through student clubs, reaching 50 students.",
    },
  );
  return {
    deadline,
    jobDeadline: bangkokDate(new Date(deadline)),
    deliveryDate,
    briefURLs,
    surveys: Object.fromEntries(
      Object.entries(surveys).map(([key, survey]) => [
        key,
        { id: survey.survey_id, title: survey.title },
      ]),
    ),
    decline,
    backup: { ...backup, offerId: offer.offer_id },
    search: `Sprint2 marketer`,
  };
}

export async function setupSprint2({
  backendURL = process.env.BACKEND_API_URL || "http://127.0.0.1:8081",
  frontendURL = process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  now = new Date(),
  outputDirectory = resolve(".artifacts/sprint2-demo"),
} = {}) {
  const backend = localBackendUrl(backendURL);
  const frontend = localBackendUrl(frontendURL);
  const api = createDemoApi(backend);
  await api("/readyz");
  const runId = `${now.toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
  const directory = resolve(outputDirectory, runId);
  await mkdir(directory, { recursive: true });
  const file = resolve(directory, "accounts-and-scenarios.json");
  const inputs = demoInputs(runId);
  const manifest = {
    runId,
    backendURL: backend,
    frontendURL: frontend,
    createdAt: now.toISOString(),
    status: "preparing",
    accounts: inputs,
    registrationNote: "Reserved for live UI registration; this account has NOT been created.",
    createdUserIds: {},
  };
  await writeFile(file, JSON.stringify(manifest, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const save = () => writeFile(file, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
  const scenarios = await prepareSprint2(api, inputs, frontend, now, async (role, userId) => {
    manifest.createdUserIds[role] = userId;
    await save();
  });
  Object.assign(manifest, { status: "ready", scenarios });
  await save();
  const links = {
    register: "/register",
    login: "/login",
    settings: "/creator/settings",
    createJob: "/creator/jobs/create",
    invitations: "/marketer/invitations",
    offers: "/marketer/offers",
    compare: "/creator/jobs/offers",
    backupJob: `/creator/jobs/${scenarios.backup.jobId}`,
    backupComparison: `/creator/jobs/${scenarios.backup.jobId}/offers`,
  };
  await writeFile(
    resolve(directory, "practice-card.md"),
    [
      `# Sprint 2 practice: ${runId}`,
      "",
      "Logins and the unused registration account are in accounts-and-scenarios.json in this folder. Keep that file off the projector.",
      "Use docs/sprint2-demo.md for the click-by-click sequence. Each setup run creates a fresh set; no reset or deletion is needed.",
      "",
      `Marketer search: Sprint2 marketerA ${runId} / Sprint2 marketerB ${runId}`,
      `Live job deadline: ${scenarios.jobDeadline}; offered delivery date: ${scenarios.deliveryDate}`,
      `Offer A: 1200.50; replacement: 1100.00; offer B: 1500.00`,
      "",
      ...Object.entries(links).map(([label, path]) => `- ${label}: ${frontend}${path}`),
      "",
      ...Object.entries(scenarios.surveys).map(
        ([key, survey]) => `- ${key}: ${survey.title} (survey ${survey.id})`,
      ),
      `- Brief v1: ${scenarios.briefURLs[0]}`,
      `- Brief v2: ${scenarios.briefURLs[1]}`,
      `- Decline practice Job #${scenarios.decline.jobId}: invitation #${scenarios.decline.requestIds.marketerA}`,
      `- Backup Job #${scenarios.backup.jobId}: A invitation Pending; B invitation Accepted with a Pending 1500.00 offer.`,
      "",
      "The backup job is separate from the job you create live. New marketers correctly show No ratings yet.",
      "The sample survey URL is a labelled placeholder, not a questionnaire. Brief URLs serve real sample text from the frontend.",
      "",
    ].join("\n"),
  );
  return { file, card: resolve(directory, "practice-card.md") };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes("--help")) {
    console.log(
      "pnpm setup:sprint2: prepare fresh local accounts, surveys, decline and backup hiring scenarios. Start the migrated local backend first. BACKEND_API_URL and FRONTEND_ORIGIN must be loopback origins. Credentials stay in ignored .artifacts/sprint2-demo/. Existing data is preserved; each rehearsal uses a new run.",
    );
  } else {
    setupSprint2()
      .then(({ file, card }) => {
        console.log(
          `Sprint 2 practice is ready.\nPrivate logins: ${file}\nPractice card: ${card}\nFull walkthrough: docs/sprint2-demo.md`,
        );
      })
      .catch((error) => {
        console.error(
          `Sprint 2 setup did not finish: ${error.message}\nAny partially created accounts remain accessible through the saved credential file in .artifacts/sprint2-demo/. Fix the issue and run again for fresh data.`,
        );
        process.exitCode = 1;
      });
  }
}
