import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
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
const committedOutput = resolve(frontendRoot, "src/lib/api/generated/backend.ts");
const checkOnly = process.argv.includes("--check");
const temporaryRoot = resolve(tmpdir());
const temporaryPrefix = "cuways-api-check-";
const temporaryDirectory = checkOnly ? mkdtempSync(join(temporaryRoot, temporaryPrefix)) : null;
const outputPath = temporaryDirectory ? join(temporaryDirectory, "backend.ts") : committedOutput;

try {
  const result = spawnSync(process.execPath, [cliPath, specPath, "-o", outputPath], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else if (checkOnly) {
    const normalized = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    if (!existsSync(committedOutput) || normalized(outputPath) !== normalized(committedOutput)) {
      console.error("Generated API types are stale. Run pnpm generate:api and review the diff.");
      process.exitCode = 1;
      if (process.env.VERIFY_ARTIFACT_DIR?.trim()) {
        const artifactDirectory = resolve(process.env.VERIFY_ARTIFACT_DIR);
        mkdirSync(artifactDirectory, { recursive: true });
        const generatedSnapshot = join(artifactDirectory, "backend.generated.ts");
        copyFileSync(outputPath, generatedSnapshot);
        console.error(`Generated candidate: ${generatedSnapshot}`);
        if (existsSync(committedOutput)) {
          const committedSnapshot = join(artifactDirectory, "backend.committed.ts");
          copyFileSync(committedOutput, committedSnapshot);
          console.error(`Committed snapshot: ${committedSnapshot}`);
        } else {
          const missingSnapshot = join(artifactDirectory, "backend.committed.missing.txt");
          writeFileSync(missingSnapshot, "The committed generated API types file is missing.\n");
          console.error(`Missing committed source evidence: ${missingSnapshot}`);
        }
      }
    } else console.log("Generated API types match the backend OpenAPI specification.");
  }
} finally {
  // This is the exact directory created by this process, never a user-provided path.
  if (temporaryDirectory) {
    const resolvedTemporaryDirectory = resolve(temporaryDirectory);
    if (
      dirname(resolvedTemporaryDirectory) !== temporaryRoot ||
      !basename(resolvedTemporaryDirectory).startsWith(temporaryPrefix)
    ) {
      throw new Error(
        "Refusing to remove a temporary directory outside the owned API-check scope.",
      );
    }
    rmSync(resolvedTemporaryDirectory, { recursive: true, force: true });
  }
}
