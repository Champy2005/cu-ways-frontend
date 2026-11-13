import { createServer } from "node:http";
import { readFile, readdir, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
// Build an allowlist from real directory entries. Symbolic links are excluded.
const assets = new Map();
async function addAssets(directory, urlPrefix, root = directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const url = `${urlPrefix}/${entry.name}`;
    if (entry.isDirectory()) await addAssets(path, url, root);
    else if (entry.isFile() && types[extname(entry.name)]) assets.set(url, { path, root });
  }
}
await addAssets(resolve(repository, "design"), "/design");
await addAssets(resolve(repository, "public/marketer-assets"), "/public/marketer-assets");
const port = Number(process.env.DESIGN_PORT || 3113);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("DESIGN_PORT must be a valid port number.");

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    if (pathname === "/") {
      response.writeHead(302, { Location: "/design/us-029-payment-recording.html" });
      response.end();
      return;
    }
    if (pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    const target = assets.get(pathname);
    if (!target) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const canonical = await realpath(target.path);
    const withinRoot = relative(target.root, canonical);
    if (isAbsolute(withinRoot) || withinRoot === ".." || withinRoot.startsWith(`..${sep}`)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const body = await readFile(canonical);
    response.writeHead(200, {
      "Content-Type": types[extname(canonical)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
server.on("error", (error) => {
  console.error(`Could not start design preview: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `CU Ways design preview: http://127.0.0.1:${port}/design/us-029-payment-recording.html`,
  ),
);
