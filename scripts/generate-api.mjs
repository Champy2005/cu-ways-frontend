import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const frontendRoot = process.cwd();
const configuredSpec = process.env.OPENAPI_SPEC_PATH?.trim();
const candidates = configuredSpec
  ? [resolve(frontendRoot, configuredSpec)]
  : [
      resolve(frontendRoot, "../cu-ways-backend/docs/openapi.yaml"),
      resolve(frontendRoot, "../backend/docs/openapi.yaml"),
    ];

const specPath = candidates.find((candidate) => existsSync(candidate));
if (!specPath) {
  console.error("OpenAPI specification was not found. Checked:");
  for (const candidate of candidates) console.error(`- ${candidate}`);
  console.error("Set OPENAPI_SPEC_PATH to override the source location.");
  process.exit(1);
}

const cliPath = resolve(frontendRoot, "node_modules/openapi-typescript/bin/cli.js");
const outputPath = resolve(frontendRoot, "src/lib/api/generated/backend.ts");
const result = spawnSync(process.execPath, [cliPath, specPath, "-o", outputPath], {
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
