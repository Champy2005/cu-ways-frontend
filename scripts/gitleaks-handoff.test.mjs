import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repository = fileURLToPath(new URL("../", import.meta.url));
const binary = process.env.GITLEAKS_BINARY;

test(
  "handoff fingerprint exception preserves credential detection and path boundaries",
  { skip: !binary && "Set GITLEAKS_BINARY to run the real scanner fixture" },
  () => {
    const artifacts = path.join(repository, ".artifacts");
    fs.mkdirSync(artifacts, { recursive: true });
    const fixture = fs.mkdtempSync(path.join(artifacts, "gitleaks-handoff-"));
    const write = (name, value) => {
      const file = path.join(fixture, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, value);
    };
    const digest = createHash("sha256").update("design token artifact fixture").digest("hex");
    const credential = randomBytes(32).toString("hex");
    const fingerprintKeys = [
      "theme/tokens.css",
      "../theme/tokens.css",
      "UX UI/theme/tokens.css",
      "tokens.css",
      "theme/resolved-tokens.json",
      "resolved-tokens.json",
    ];
    write(
      "design/chp-sprint-iii/book/allowed.json",
      JSON.stringify(Object.fromEntries(fingerprintKeys.map((key) => [key, digest])), null, 2),
    );
    write(
      "design/chp-sprint-iii/book/credential.json",
      JSON.stringify({ api_key: credential }, null, 2),
    );
    write(
      "design/chp-sprint-iii/book/mixed.json",
      JSON.stringify({ "theme/tokens.css": digest, api_key: credential }),
    );
    write("src/outside.json", JSON.stringify({ "theme/tokens.css": digest }, null, 2));
    write(
      "design/chp-sprint-iii/book/provider.json",
      JSON.stringify({ "theme/tokens.css": "ghp_" + randomBytes(18).toString("hex") }, null, 2),
    );
    const git = (args) => {
      const result = spawnSync("git", args, {
        cwd: fixture,
        encoding: "utf8",
        windowsHide: true,
      });
      assert.equal(result.status, 0, "Owned fixture Git operation failed");
    };
    git(["init", "--quiet"]);
    git(["add", "."]);
    git([
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "-m",
      "test: synthetic scanner fixture",
    ]);
    const report = path.join(artifacts, path.basename(fixture) + ".json");
    const result = spawnSync(
      binary,
      [
        "git",
        "--redact",
        "--no-banner",
        "--config",
        path.join(repository, ".gitleaks.toml"),
        "--report-format",
        "json",
        "--report-path",
        report,
        fixture,
      ],
      { cwd: repository, encoding: "utf8", windowsHide: true },
    );
    assert.equal(result.status, 1, "Synthetic credentials must still fail the scan");
    const findings = JSON.parse(fs.readFileSync(report, "utf8"));
    const forFile = (name) => findings.filter((finding) => path.basename(finding.File) === name);
    assert.equal(forFile("allowed.json").length, 0, "Known artifact fingerprint fields");
    assert.ok(forFile("credential.json").length > 0, "Other keys in the same directory");
    assert.ok(forFile("mixed.json").length > 0, "Adjacent credential on a fingerprint line");
    assert.ok(forFile("outside.json").length > 0, "Exception must not extend outside handoff");
    assert.ok(
      forFile("provider.json").some((finding) => finding.RuleID === "github-pat"),
      "Provider-specific rules must remain enabled",
    );
  },
);
