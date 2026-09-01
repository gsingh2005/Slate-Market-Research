import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createPreviewServer } from "../scripts/preview-pages.mjs";

function request(port, path) {
  return new Promise((resolve, reject) => {
    get({ host: "127.0.0.1", port, path }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () =>
        resolve({
          body,
          headers: response.headers,
          status: response.statusCode,
        }),
      );
    }).on("error", reject);
  });
}

test("preview server serves exported routes safely beneath the GitHub Pages base path", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "slate-preview-"));
  await mkdir(join(outputDirectory, "research"));
  await writeFile(join(outputDirectory, "index.html"), "<main>home</main>");
  await writeFile(join(outputDirectory, "research", "index.html"), "<main>research</main>");
  await writeFile(join(outputDirectory, "site.css"), "body {};");

  const server = createPreviewServer({ outputDirectory });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const home = await request(port, "/Slate-Market-Research/?symbol=AAPL");
    const route = await request(port, "/Slate-Market-Research/research/");
    const stylesheet = await request(port, "/Slate-Market-Research/site.css");
    const missing = await request(port, "/Slate-Market-Research/missing/");
    const traversal = await request(port, "/Slate-Market-Research/%2e%2e/secret.txt");

    assert.equal(home.status, 200);
    assert.match(home.body, /home/);
    assert.equal(route.status, 200);
    assert.match(route.body, /research/);
    assert.match(stylesheet.headers["content-type"], /^text\/css/);
    assert.equal(missing.status, 404);
    assert.notEqual(traversal.status, 200);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
