import test from "node:test";
import assert from "node:assert/strict";

test("public API URL is a credential-free local default", () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  assert.match(apiUrl, /^https?:\/\//);
  assert.doesNotMatch(apiUrl, /@|password|token|secret/i);
});
