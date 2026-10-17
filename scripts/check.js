#!/usr/bin/env node
// Static checks: every file referenced by index.html exists and every script parses.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="((?:js|css|data|icons)\/[^"]+|manifest\.webmanifest)"/g)].map((m) => m[1]);
let failed = 0;

for (const ref of refs) {
  if (!fs.existsSync(path.join(root, ref))) {
    console.error(`MISSING  ${ref}`);
    failed++;
  }
}
for (const ref of refs.filter((r) => r.endsWith(".js"))) {
  try {
    new vm.Script(fs.readFileSync(path.join(root, ref), "utf8"), { filename: ref });
  } catch (e) {
    console.error(`SYNTAX   ${ref}: ${e.message}`);
    failed++;
  }
}
const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) {
  console.error(`DUPLICATE IDS ${[...new Set(dup)].join(", ")}`);
  failed++;
}
if (failed) process.exit(1);
console.log(`OK: ${refs.length} referenced files present, scripts parse, no duplicate ids`);
