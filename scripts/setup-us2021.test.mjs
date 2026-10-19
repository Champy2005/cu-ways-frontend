import { test } from "node:test";
import assert from "node:assert/strict";
import { accountInput, localBackendUrl, prepareInvitations } from "./setup-us2021.mjs";

test("manual setup refuses remote or credential-bearing URLs before making requests", () => {
  assert.equal(localBackendUrl("http://localhost:8081"), "http://localhost:8081");
  assert.equal(localBackendUrl("http://127.0.0.1:8082/"), "http://127.0.0.1:8082");
  for (const value of [
    "https://example.com",
    "http://localhost.evil.test",
    "http://user:secret@localhost",
    "http://localhost/?token=secret",
    "http://localhost/api",
    "file:///tmp/test",
  ])
    assert.throws(() => localBackendUrl(value));
});

test("manual accounts use unique valid contacts and only marketers get marketer profiles", () => {
  const creator = accountInput("creator");
  const marketer = accountInput("marketer");
  assert.match(creator.phone, /^09\d{8}$/);
  assert.notEqual(creator.email, marketer.email);
  assert.ok(creator.password.length >= 8);
  assert.equal(creator.marketer_profile, undefined);
  assert.ok(marketer.marketer_profile);
});

test("manual fixtures provide pending, accepted and saved-offer scenarios without US24 actions", async () => {
  const calls = [];
  let jobId = 0;
  const api = async (path, token, body) => {
    calls.push({ path, token, body });
    if (path === "/api/v1/surveys") return { survey_id: 1 };
    if (path === "/api/v1/jobs") return { job_id: ++jobId };
    if (path.endsWith("/requests")) return [{ job_request_id: jobId + 10 }];
    return {};
  };
  const fixture = await prepareInvitations(
    api,
    { creator: { token: "creator", id: 1 }, marketer: { token: "marketer", id: 2 } },
    new Date("2026-10-15T20:00:00Z"),
  );
  assert.equal(fixture.scenarios.length, 4);
  assert.equal(calls.filter((call) => call.path.endsWith("/accept")).length, 2);
  const submissions = calls.filter((call) => call.path.endsWith("/offers"));
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].body.delivery_date, "2026-10-23");
  assert.equal(submissions[0].body.offered_price, "1200.50");
  assert.ok(!calls.some((call) => /withdraw|delete|reject/.test(call.path)));
  assert.ok(calls.every((call) => call.token !== "emptyMarketer"));
});
