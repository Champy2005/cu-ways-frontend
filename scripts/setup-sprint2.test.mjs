import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { setupSprint2, createDemoApi } from "./setup-sprint2.mjs";

test("setup saves recoverable credentials and prepares hiring without consuming live demo actions", async (t) => {
  const calls = [];
  const users = new Map();
  let nextId = 10;
  const server = createServer(async (request, response) => {
    const parts = [];
    for await (const part of request) parts.push(part);
    const body = parts.length ? JSON.parse(Buffer.concat(parts).toString()) : undefined;
    const path = request.url;
    const token = request.headers.authorization?.slice(7);
    calls.push({ path, method: request.method, body, token });
    let data = {};
    if (path === "/api/v1/auth/register") {
      const id = ++nextId;
      users.set(id, body);
      data = { user: { user_id: id }, access_token: `private-token-${id}` };
    } else if (path === "/api/v1/surveys") data = { ...body, survey_id: ++nextId };
    else if (path === "/api/v1/jobs") data = { job_id: ++nextId };
    else if (path.endsWith("/requests")) {
      data = body.marketer_ids.map((marketer_id) => ({ marketer_id, job_request_id: ++nextId }));
    } else if (path.endsWith("/offers")) data = { offer_id: ++nextId };
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ status: "success", data }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const root = await mkdtemp(join(tmpdir(), "sprint2-demo-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const options = {
    backendURL: `http://127.0.0.1:${server.address().port}`,
    frontendURL: "http://localhost:3000",
    now: new Date("2026-10-19T20:00:00Z"),
    outputDirectory: root,
  };
  const first = await setupSprint2(options);
  const manifestText = await readFile(first.file, "utf8");
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.status, "ready");
  assert.equal(calls[0].path, "/readyz");
  assert.equal(calls[0].method, "GET");
  assert.equal(users.size, 4);
  assert.ok(
    ![...users.values()].some((user) => user.email === manifest.accounts.registration.email),
  );
  assert.equal(new Set(Object.values(manifest.accounts).map((user) => user.phone)).size, 5);
  assert.ok(!manifestText.includes("private-token-"));
  assert.equal(manifest.scenarios.deliveryDate, "2026-10-27");
  assert.equal(manifest.scenarios.jobDeadline, "2026-11-10");
  assert.equal(calls.filter((call) => call.path === "/api/v1/jobs").length, 2);
  assert.equal(calls.filter((call) => call.path === "/api/v1/surveys").length, 4);
  const accepts = calls.filter((call) => call.path.endsWith("/accept"));
  assert.equal(accepts.length, 1);
  assert.equal(
    accepts[0].path,
    `/api/v1/me/job-requests/${manifest.scenarios.backup.requestIds.marketerB}/accept`,
  );
  assert.equal(accepts[0].token, `private-token-${manifest.createdUserIds.marketerB}`);
  assert.ok(!calls.some((call) => /withdraw|decline$|\/offers\/\d+\/accept/.test(call.path)));
  assert.ok(calls.every((call) => ["GET", "POST"].includes(call.method)));
  assert.ok(
    !calls.some((call) => call.token === `private-token-${manifest.createdUserIds.emptyMarketer}`),
  );
  const card = await readFile(first.card, "utf8");
  assert.ok(
    card.includes(`http://localhost:3000/creator/jobs/${manifest.scenarios.backup.jobId}/offers`),
  );
  assert.ok(!card.includes(manifest.accounts.creator.password));
  const second = await setupSprint2(options);
  assert.notEqual(dirname(first.file), dirname(second.file));
  assert.notEqual(
    JSON.parse(await readFile(second.file, "utf8")).accounts.creator.email,
    manifest.accounts.creator.email,
  );
  assert.equal(await readFile(first.file, "utf8"), manifestText);
});

test("setup refuses remote origins and failed readiness before registration", async () => {
  assert.throws(() => createDemoApi("https://example.com"));
  await assert.rejects(setupSprint2({ frontendURL: "https://example.com" }));
  const server = createServer((request, response) => {
    assert.equal(request.url, "/readyz");
    response.writeHead(503).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await assert.rejects(
      setupSprint2({ backendURL: `http://127.0.0.1:${server.address().port}` }),
      /503.*readyz/,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
