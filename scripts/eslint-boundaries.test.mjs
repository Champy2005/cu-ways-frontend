import { test } from "node:test";
import { resolve } from "node:path";
import { RuleTester } from "eslint";
import nextTypeScript from "eslint-config-next/typescript";
import { clientServerBoundary } from "./eslint-boundaries.mjs";

test("client/server import boundary rejects unsafe direct dependencies", () => {
  const parser = nextTypeScript.find((config) => config.languageOptions?.parser)?.languageOptions
    .parser;
  const tester = new RuleTester({ languageOptions: { parser } });
  const filename = resolve("src/features/example/client.tsx");
  const invalid = [
    '"use client"; import { cookies } from "next/headers";',
    '"use client"; import { getBackendApiUrl } from "@/lib/env";',
    '"use client"; import { getSession } from "../../lib/auth/session";',
    '"use strict"; "use client"; export * from "@/lib/api/backend-client";',
    '"use client"; async function load() { return import("@/lib/api/server-client"); }',
    '"use client"; const server = require("@/lib/auth/guards");',
    '"use client"; import { type Session, getSession } from "@/lib/auth/session";',
    '"use client"; export { type Session, getSession } from "@/lib/auth/session";',
    '"use client"; import { getBackendApiUrl } from "../../lib/env.ts";',
  ];
  tester.run("client-server-boundary", clientServerBoundary, {
    valid: [
      { filename, code: 'import { cookies } from "next/headers";' },
      { filename, code: '"use client"; import { apiPost } from "@/lib/api/browser-client";' },
      { filename, code: '"use client"; const text = "@/lib/env";' },
      { filename, code: '"use client"; import type { Session } from "@/lib/auth/session";' },
      { filename, code: '"use client"; import { type Session } from "@/lib/auth/session";' },
      { filename, code: '"use client"; export type { Session } from "@/lib/auth/session";' },
      { filename, code: '"use client"; export { type Session } from "@/lib/auth/session";' },
    ],
    invalid: invalid.map((code) => ({ filename, code, errors: [{ messageId: "serverImport" }] })),
  });
});
