const test = require("node:test");
const assert = require("node:assert/strict");
const { boot } = require("./harness.js");

const TABS = ["Today", "Syllabus", "Backlog", "Revision", "Mistakes", "Tests", "Focus", "Progress"];

test("fresh install starts with no hardcoded chapters and every tab renders", () => {
  const app = boot();
  assert.equal(app.ev("state.chapters.length"), 0);
  assert.equal(JSON.stringify(app.ev("subjectNames()")), '["General"]');
  for (const tab of TABS) {
    app.ev(`tab='${tab}';render()`);
    assert.ok(app.el("app").innerHTML.length > 50, `${tab} rendered nothing`);
  }
  assert.deepEqual(app.errors, [], "no runtime errors while rendering");
});

test("backlog: add items, plan them, log time, finish and remove", () => {
  const app = boot();
  const due = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  app.el("bn").value = "Rotation\nThermodynamics\n\nOptics";
  app.el("bs").value = "General";
  app.el("be").value = "90";
  app.el("bd").value = due;
  app.ev("saveBacklog()");
  assert.equal(app.ev("state.chapters.length"), 3);

  const plan = app.ev("JSON.parse(JSON.stringify((()=>{const p=backlogPlan();return {total:p.total,cap:p.cap,late:p.late.length,days:p.days.length,first:p.days[0].blocks.map(b=>b.min)}})()))");
  assert.equal(plan.total, 270);
  assert.equal(plan.cap, 60);
  assert.deepEqual(plan.first, [60]);
  assert.ok(plan.late > 0, "270 min at 60/day cannot meet a deadline 3 days away (4 working days)");

  app.ev("setBacklogPace(240)");
  assert.equal(app.ev("backlogPlan().late.length"), 0);

  const id = app.ev("backlogPlan().items[0].c.id");
  app.ev(`state.sessions.push({chapterId:'${id}',date:today(),minutes:50})`);
  assert.equal(app.ev(`backlogItems().find(x=>x.c.id==='${id}').remaining`), 40);

  app.ev(`markBacklogDone('${id}')`);
  assert.equal(app.ev(`backlogItems().some(x=>x.manual&&x.c.id==='${id}')`), false);

  const other = app.ev("backlogPlan().items[0].c.id");
  app.ev(`removeBacklog('${other}')`);
  assert.equal(app.ev(`state.chapters.some(c=>c.id==='${other}')`), false);

  app.ev("tab='Backlog';render()");
  assert.deepEqual(app.errors, []);
});

test("priority used by the app equals the original formula", () => {
  const app = boot();
  app.ev(`state.chapters.push({id:'c1',subject:'General',name:'Optics',status:'Learning',mastery:35,confidence:2,lastStudied:'2020-01-01'})`);
  app.ev(`state.mistakes.push({id:'m1',chapterId:'c1'},{id:'m2',chapterId:'c1'})`);
  app.ev(`state.revisions.push({id:'r1',chapterId:'c1',done:false,date:'2020-01-01'})`);
  const stale = app.ev("Math.min(daysSince('2020-01-01'),21)");
  const legacy = Math.round((100 - 35) * 0.42 + (5 - 2) * 8 + Math.min(stale, 14) * 1.3 + 1 * 12 + 2 * 5);
  assert.equal(app.ev("priority(state.chapters[0])"), legacy);
});

test("exam readiness is 0 for an untouched syllabus and rises with progress", () => {
  const app = boot();
  app.ev(`state.chapters.push({id:'a',subject:'General',name:'A',status:'Not started',mastery:0,confidence:0,lastStudied:null})`);
  assert.equal(app.ev("readiness(state.chapters)"), 0);
  app.ev("state.chapters[0].mastery=80;state.chapters[0].status='Strong';state.chapters[0].lastStudied=today()");
  assert.ok(app.ev("readiness(state.chapters)") > 70);
});

test("printable report builds and calls print", () => {
  const app = boot();
  app.ev("printReport()");
  assert.equal(app.ctx.__printed, 1);
  assert.match(app.el("printReport").innerHTML, /StudyFlow progress report/);
});

test("App Lock encrypts data at rest, rejects a wrong PIN and unlocks with the right one", async () => {
  const storage = new Map();
  const first = boot({ storage, prompts: ["2468", "2468"] });
  first.ev(`state.chapters.push({id:'secret',subject:'General',name:'Quantum Secrets',status:'Learning',mastery:20,confidence:1,lastStudied:null})`);
  first.ev("promptEnableLock()");
  await first.wait(400);
  const raw = storage.get(first.ev("KEY"));
  const env = JSON.parse(raw);
  assert.equal(env.locked, true);
  assert.ok(!raw.includes("Quantum Secrets") && !raw.includes('"chapters"'), "plaintext must not be stored");

  const second = boot({ storage });
  assert.ok(second.ev("lockedEnvelope!==null"));
  assert.equal(second.el("lockScreen").style.display, "flex");

  second.el("lockPin").value = "0000";
  await second.ev("attemptUnlock()");
  assert.match(second.el("lockError").textContent, /Incorrect PIN/);

  second.el("lockPin").value = "2468";
  await second.ev("attemptUnlock()");
  assert.equal(second.ev("state.chapters.some(c=>c.name==='Quantum Secrets')"), true);
  assert.equal(second.el("lockScreen").style.display, "none");
});

test("reset clears data without throwing", () => {
  const app = boot();
  app.ev(`state.chapters.push({id:'x',subject:'General',name:'X',status:'Learning',mastery:10,confidence:1,lastStudied:null})`);
  app.ev("resetAll()");
  assert.deepEqual(app.errors, []);
});
