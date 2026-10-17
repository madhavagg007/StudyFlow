#!/usr/bin/env node
// Inlines css/ and js/ into one self-contained file: dist/StudyFlow.html
// Usage: node scripts/build.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, p) => `<style>\n${read(p)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) => {
  const code = read(p);
  if (/<\/script/i.test(code)) throw new Error(`${p} contains "</script" and cannot be inlined`);
  return `<script>\n${code}</script>`;
});
// the single-file build has no sibling icon/manifest files to point at
html = html
  .replace(/<link rel="manifest"[^>]*>/, "")
  .replace(/<link rel="icon"[^>]*>/, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>/, "");

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "StudyFlow.html");
fs.writeFileSync(out, html);
console.log(`Built ${path.relative(root, out)} (${(html.length / 1024).toFixed(1)} KB)`);
