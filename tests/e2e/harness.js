// Headless smoke-test harness: runs the real index.html scripts, in order, inside a
// Node vm context with a minimal DOM stub. It is not a browser, so it cannot judge
// layout or animation, but it exercises the real application code end to end.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..", "..");

function makeEl(id) {
  const cls = new Set();
  const el = {
    id, value: "", style: {}, dataset: {}, children: [], files: [], checked: false, _html: "", _text: "",
    classList: {
      add: (...c) => c.forEach((x) => cls.add(x)),
      remove: (...c) => c.forEach((x) => cls.delete(x)),
      toggle: (c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; },
      contains: (c) => cls.has(c),
    },
    addEventListener() {}, removeEventListener() {}, focus() {}, click() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, scrollIntoView() {},
    appendChild(c) { el.children.push(c); return c; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get offsetWidth() { return 100; },
  };
  return el;
}

function boot({ storage = new Map(), prompts = [] } = {}) {
  const els = new Map();
  const errors = [];
  const getEl = (id) => { if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); };
  const ls = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };
  const body = makeEl("body");
  const doc = {
    getElementById: getEl, createElement: (t) => makeEl(t), body,
    documentElement: makeEl("html"), querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, visibilityState: "visible", hidden: false,
  };
  const timers = (fn, ms, ...a) => { const t = setTimeout(fn, ms, ...a); t.unref && t.unref(); return t; };
  const ctx = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.map(String).join(" ")) },
    document: doc, localStorage: ls, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
    navigator: { userAgent: "node-smoke" }, location: { href: "http://localhost/" }, history: { pushState() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    innerWidth: 390, innerHeight: 800, requestAnimationFrame: (f) => timers(f, 0),
    addEventListener() {}, removeEventListener() {},
    setTimeout: timers, clearTimeout, setInterval: (f, ms) => { const t = setInterval(f, ms); t.unref && t.unref(); return t; }, clearInterval,
    URL, Blob, TextEncoder, TextDecoder, atob, btoa, crypto: require("crypto").webcrypto,
    Date, Math, JSON, Promise, Number, String, Array, Object, Set, Map, Error, Image: function () {}, FileReader: function () {},
    alert() {}, confirm: () => true, prompt: () => (prompts.length ? prompts.shift() : null),
    print() { ctx.__printed = (ctx.__printed || 0) + 1; },
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), "utf8"), ctx, { filename: s });

  return {
    ctx, storage, errors, el: getEl,
    ev: (code) => vm.runInContext(code, ctx),
    wait: (ms = 20) => new Promise((r) => setTimeout(r, ms)),
  };
}

module.exports = { boot };
