import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("PWA configuration includes installable branded icons and protected API exclusions", () => {
  const config = fs.readFileSync(path.join(root, "vite.config.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(config, /name: 'MindConnect Admin'/);
  assert.match(config, /short_name: 'MindConnect Admin'/);
  assert.match(config, /start_url: '\/'/);
  assert.match(config, /scope: '\/'/);
  assert.match(config, /display: 'standalone'/);
  assert.match(config, /knust-ecounselling-icon-192\.png/);
  assert.match(config, /knust-ecounselling-icon-512\.png/);
  assert.match(config, /purpose: 'maskable'/);
  assert.match(config, /handler: 'NetworkOnly'/);
  assert.match(config, /startsWith\('\/api\/'\)/);
  assert.match(html, /apple-touch-icon/);
});

test("branded PWA icon assets are present", () => {
  for (const asset of [
    "knust-ecounselling-icon-180.png",
    "knust-ecounselling-icon-192.png",
    "knust-ecounselling-icon-512.png",
    "knust-ecounselling-icon-maskable-192.png",
    "knust-ecounselling-icon-maskable-512.png",
  ]) {
    assert.ok(fs.existsSync(path.join(root, "public", asset)), `${asset} must exist`);
  }
});