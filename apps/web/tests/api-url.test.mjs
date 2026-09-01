import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("API client uses localhost only for development and same origin for production", async () => {
  const source = await readFile(new URL("../lib/api.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NODE_ENV === "development"/);
  assert.match(source, /"http:\/\/localhost:8000"/);
  assert.match(source, /new URL\(window\.location\.origin\)/);
  assert.match(source, /url\.username \|\| url\.password/);
});
