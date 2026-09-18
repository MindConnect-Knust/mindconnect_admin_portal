import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");

test("local development defaults to the local API and cannot be pointed at production", () => {
  const source = read("src/services/http.js");
  assert.match(source, /APP_ENV === 'development' \? 'http:\/\/localhost:5000\/api'/);
  assert.match(source, /APP_ENV === 'development' && parsed\.hostname\.toLowerCase\(\) === PRODUCTION_API_HOST/);
  // The production API is never the unconditional fallback.
  assert.doesNotMatch(source, /VITE_API_URL \|\| 'https:\/\//);
});
