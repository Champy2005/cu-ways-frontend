import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import { once } from "node:events";
import { test } from "node:test";
import { JSDOM } from "jsdom";

test("design preview serves allowlisted files and rejects traversal", async () => {
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));

  const server = spawn(process.execPath, ["design/serve.mjs"], {
    env: { ...process.env, DESIGN_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const startup = await Promise.race([
      once(server.stdout, "data"),
      once(server, "exit").then(([code]) => {
        throw new Error(`Design server exited with code ${code}`);
      }),
    ]);
    assert.match(String(startup[0]), /design preview/i);
    const request = (path, method = "GET") =>
      new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, path, method }, (response) => {
          response.resume();
          response.on("end", () => resolve(response.statusCode));
        });
        req.on("error", reject);
        req.end();
      });

    assert.equal(await request("/design/us-029-payment-recording.html"), 200);
    assert.equal(await request("/public/marketer-assets/logo.svg", "HEAD"), 200);
    assert.equal(await request("/design/%2e%2e%2fpackage.json"), 404);
    assert.equal(await request("/design/%2e%2e%5cpackage.json"), 404);
    assert.equal(await request("/package.json"), 404);
    assert.equal(await request("/design/shared.js", "POST"), 405);
  } finally {
    server.kill();
  }
});

test("design preview treats a hostile job parameter as text", async () => {
  const html = await readFile("design/us-029-payment-recording.html", "utf8");
  const script = await readFile("design/shared.js", "utf8");
  const payload = '1042"><img src=x onerror="window.injected=1">';
  const dom = new JSDOM(html, {
    url: `http://localhost/design/us-029-payment-recording.html?job=${encodeURIComponent(payload)}`,
    runScripts: "outside-only",
  });
  dom.window.matchMedia = () => ({ matches: false });
  dom.window.eval(script);
  const controls = dom.window.document.querySelector("#preview-controls");
  assert.equal(
    controls.querySelector("#preview-route").textContent,
    `/creator/jobs/${payload}/payment`,
  );
  assert.equal(controls.querySelector("img"), null);
  assert.equal(dom.window.injected, undefined);
  assert.equal(controls.querySelectorAll("#scenario option").length, 8);
  assert.equal(
    controls.querySelector("#preview-review").getAttribute("href"),
    "us-033-submit-review.html?job=1038",
  );
  dom.window.close();
});

test("design preview keeps scenario controls and navigation working", async () => {
  const html = await readFile("design/us-029-payment-recording.html", "utf8");
  const script = await readFile("design/shared.js", "utf8");
  const dom = new JSDOM(html, {
    url: "http://localhost/design/us-029-payment-recording.html?job=1042",
    runScripts: "outside-only",
  });
  dom.window.matchMedia = () => ({ matches: false });
  dom.window.structuredClone = structuredClone;
  dom.window.eval(script);
  const document = dom.window.document;
  const scenario = document.querySelector("#scenario");
  assert.equal(scenario.value, "normal");
  scenario.value = "delivery";
  scenario.dispatchEvent(new dom.window.Event("change"));
  assert.equal(document.querySelector("#scenario").value, "delivery");
  const saved = JSON.parse(dom.window.localStorage.getItem("cuways-sprint3-design-v1"));
  const job = saved.jobs.find((item) => item.id === "1042");
  assert.equal(job.status, "In Progress");
  assert.equal(job.proof.url, "https://example.com/");
  assert.equal(
    document.querySelector("#preview-payment").getAttribute("href"),
    "us-029-payment-recording.html?job=1042",
  );
  dom.window.close();
});
