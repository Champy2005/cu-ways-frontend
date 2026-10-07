import { dirname, resolve } from "node:path";

const serverModules = new Set([
  "src/lib/env",
  "src/lib/auth/session",
  "src/lib/auth/guards",
  "src/lib/auth/origin",
  "src/lib/api/server-client",
  "src/lib/api/backend-client",
  "src/lib/api/auth-route",
]);

function isServerModule(importPath, filename) {
  if (importPath === "next/headers" || importPath === "server-only") return true;
  if (!importPath.startsWith("@/") && !importPath.startsWith(".")) return false;
  const target = importPath.startsWith("@/")
    ? resolve(process.cwd(), "src", importPath.slice(2))
    : resolve(dirname(filename), importPath);
  const normalized = target.replace(/\\/g, "/").replace(/\.[cm]?[jt]sx?$/, "");
  return [...serverModules].some((module) => normalized === resolve(module).replace(/\\/g, "/"));
}

export const clientServerBoundary = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      serverImport:
        "Client Components must not import server-only module '{{module}}'. Use the browser API boundary instead.",
    },
  },
  create(context) {
    let client = false;
    function check(node, source, typeOnly = false) {
      if (
        client &&
        !typeOnly &&
        typeof source?.value === "string" &&
        isServerModule(source.value, context.filename)
      ) {
        context.report({ node, messageId: "serverImport", data: { module: source.value } });
      }
    }
    return {
      Program(node) {
        client = node.body.some((statement) => statement.directive === "use client");
      },
      ImportDeclaration(node) {
        const typeOnly =
          node.importKind === "type" ||
          (node.specifiers.length > 0 &&
            node.specifiers.every((specifier) => specifier.importKind === "type"));
        check(node, node.source, typeOnly);
      },
      ExportNamedDeclaration(node) {
        const typeOnly =
          node.exportKind === "type" ||
          (node.specifiers.length > 0 &&
            node.specifiers.every((specifier) => specifier.exportKind === "type"));
        check(node, node.source, typeOnly);
      },
      ExportAllDeclaration(node) {
        check(node, node.source, node.exportKind === "type");
      },
      ImportExpression(node) {
        check(node, node.source);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require")
          check(node, node.arguments[0]);
      },
    };
  },
};
