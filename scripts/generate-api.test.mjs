import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const scriptPath = resolve("scripts/generate-api.mjs");
const cliUrl = pathToFileURL(resolve("node_modules/openapi-typescript/bin/cli.js")).href;

test("API freshness check preserves source and retains inspectable drift snapshots", () => {
  const temporaryRoot = resolve(tmpdir());
  const fixtureRoot = mkdtempSync(join(temporaryRoot, "cuways-api-test-"));
  const sourcePath = join(fixtureRoot, "src/lib/api/generated/backend.ts");
  const specification = join(fixtureRoot, "openapi.json");
  const artifacts = join(fixtureRoot, "evidence");
  const cliPath = join(fixtureRoot, "node_modules/openapi-typescript/bin/cli.js");
  const run = (...args) =>
    spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: fixtureRoot,
      encoding: "utf8",
      env: { ...process.env, OPENAPI_SPEC_PATH: specification, VERIFY_ARTIFACT_DIR: artifacts },
    });

  try {
    mkdirSync(dirname(sourcePath), { recursive: true });
    mkdirSync(dirname(cliPath), { recursive: true });
    // Run the installed real generator from an isolated project; no tracked file is a fixture.
    writeFileSync(cliPath, `import(${JSON.stringify(cliUrl)}).catch(error => { throw error; });\n`);
    writeFileSync(
      specification,
      JSON.stringify({
        openapi: "3.0.3",
        info: { title: "Verification fixture", version: "1.0.0" },
        paths: {},
      }),
    );
    const generated = run();
    assert.equal(generated.status, 0, generated.stderr);
    const initialSource = readFileSync(sourcePath, "utf8");
    const matching = run("--check");
    assert.equal(matching.status, 0, matching.stderr);
    assert.equal(readFileSync(sourcePath, "utf8"), initialSource);
    assert.equal(existsSync(artifacts), false, "Matching checks should not create drift evidence");

    const windowsSource = initialSource.replace(/\r?\n/g, "\r\n");
    writeFileSync(sourcePath, windowsSource);
    const lineEndingsOnly = run("--check");
    assert.equal(lineEndingsOnly.status, 0, lineEndingsOnly.stderr);
    assert.equal(readFileSync(sourcePath, "utf8"), windowsSource);
    assert.equal(existsSync(artifacts), false, "Line endings alone should not count as drift");

    const staleSource = `${initialSource}\n// Deliberately stale fixture.\n`;
    writeFileSync(sourcePath, staleSource);
    const stale = run("--check");
    assert.equal(stale.status, 1, stale.stderr);
    assert.equal(readFileSync(sourcePath, "utf8"), staleSource, "Check must not overwrite source");
    assert.equal(readFileSync(join(artifacts, "backend.generated.ts"), "utf8"), initialSource);
    assert.equal(readFileSync(join(artifacts, "backend.committed.ts"), "utf8"), staleSource);
    assert.ok(stale.stderr.includes(join(artifacts, "backend.generated.ts")));
    assert.ok(stale.stderr.includes(join(artifacts, "backend.committed.ts")));
  } finally {
    const resolvedFixture = resolve(fixtureRoot);
    assert.equal(dirname(resolvedFixture), temporaryRoot);
    assert.ok(basename(resolvedFixture).startsWith("cuways-api-test-"));
    rmSync(resolvedFixture, { recursive: true, force: true });
  }
});
