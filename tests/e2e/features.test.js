const test = require("node:test");
const assert = require("node:assert/strict");
const { boot } = require("./harness.js");

const MIN = 60 * 1000;

test("countdown: pause freezes the clock, resume continues, extend adds time", () => {
  const app = boot({ clock: true });
  app.ev("state.profile.focusMinutes=25;timer=idleTimer()");
  app.ev("toggleTimer()");
  assert.equal(app.ev("timer.sec"), 1500);
  app.advance(MIN); app.ev("tickTimer()");
  assert.equal(app.ev("timer.sec"), 1440);
  app.ev("togglePause()"); app.advance(5 * MIN); app.ev("tickTimer()");
  assert.equal(app.ev("timer.sec"), 1440, "paused clock must not move");
  assert.ok(app.audio.suspended >= 0);
  app.ev("togglePause()"); app.advance(MIN); app.ev("tickTimer()");
  assert.equal(app.ev("timer.sec"), 1380);
  app.ev("extendTimer(5)");
  assert.equal(app.ev("timer.sec"), 1680);
  assert.equal(app.ev("timer.total"), 1800);
  assert.deepEqual(app.errors, []);
});

test("finish early logs the minutes actually studied; under a minute can be discarded", () => {
  const app = boot({ clock: true });
  app.ev("toggleTimer()");
  app.advance(10 * MIN + 20000); app.ev("tickTimer()");
  app.ev("finishTimerEarly()");
  assert.equal(app.ev("state.sessions.length"), 1);
  assert.equal(app.ev("state.sessions[0].minutes"), 10);
  assert.equal(app.ev("timer.on"), false);

  app.ev("toggleTimer()"); app.advance(20000);
  app.ev("finishTimerEarly()");
  assert.equal(app.ev("state.sessions.length"), 1, "a discarded session is not logged");
  assert.equal(app.ev("timer.on"), false);
});

test("stopwatch counts up and logs the elapsed time", () => {
  const app = boot({ clock: true });
  app.ev("setTimerMode('stopwatch')");
  app.ev("toggleTimer()");
  assert.equal(app.ev("timer.sec"), 0);
  app.advance(7 * MIN + 20000); app.ev("tickTimer()");
  assert.equal(app.ev("timer.sec"), 440);
  assert.ok(app.ev("bookProgress()") > 0 && app.ev("bookProgress()") < 1);
  app.ev("finishTimerEarly()");
  assert.equal(app.ev("state.sessions[0].minutes"), 7);
  assert.equal(app.ev("state.sessions[0].mode"), "stopwatch");
});

test("pomodoro runs focus, short break, then a long break after the configured cycles", async () => {
  const app = boot({ clock: true });
  app.ev("state.profile.cyclesBeforeLong=2;state.profile.autoNext=true;setTimerMode('pomodoro')");
  app.ev("toggleTimer()");
  assert.equal(app.ev("timer.phase"), "focus");
  app.advance(25 * MIN + 1000); app.ev("tickTimer()");
  await app.wait(1300);
  assert.equal(app.ev("state.sessions.length"), 1);
  assert.equal(app.ev("timer.phase"), "short");
  assert.equal(app.ev("timer.sec"), 300);
  app.ev("finishTimerEarly()"); // skip break, auto-start next focus
  assert.equal(app.ev("timer.phase"), "focus");
  assert.equal(app.ev("timer.on"), true);
  app.advance(25 * MIN + 1000); app.ev("tickTimer()");
  await app.wait(1300);
  assert.equal(app.ev("state.sessions.length"), 2);
  assert.equal(app.ev("timer.phase"), "long");
  assert.equal(app.ev("timer.sec"), 900);
  app.ev("state.profile.autoNext=false;finishTimerEarly()");
  assert.equal(app.ev("timer.on"), false);
  assert.deepEqual(app.errors, []);
});

test("every soundscape builds, plays with the timer, pauses and stops", () => {
  const app = boot({ clock: true });
  for (const id of ["rain", "ocean", "wind", "cafe", "brown", "white"]) {
    assert.equal(app.ev(`playSound('${id}')`), true, id);
    assert.equal(app.ev("audioGraph!==null"), true);
    app.ev("stopSound()");
  }
  assert.ok(app.audio.sources >= 6);
  app.ev("setSound('rain')");
  app.ev("toggleTimer()");
  assert.equal(app.ev("audioGraph!==null&&audioGraph.id==='rain'"), true, "sound starts with focus");
  app.ev("togglePause()");
  assert.ok(app.audio.suspended >= 1);
  app.ev("togglePause()");
  assert.ok(app.audio.resumed >= 1);
  app.advance(2 * MIN); app.ev("tickTimer()");
  app.ev("finishTimerEarly()");
  assert.equal(app.ev("audioGraph"), null, "sound stops when the session ends");
  assert.equal(app.ev("(setSound('bogus'),state.profile.sound)"), "");
  assert.deepEqual(app.errors, []);
});

test("sound does not play during a break", async () => {
  const app = boot({ clock: true });
  app.ev("setSound('ocean');setTimerMode('pomodoro')");
  app.ev("toggleTimer()");
  assert.equal(app.ev("audioGraph!==null"), true);
  app.advance(25 * MIN + 1000); app.ev("tickTimer()");
  await app.wait(1300);
  assert.equal(app.ev("timer.phase"), "short");
  assert.equal(app.ev("audioGraph"), null);
  app.ev("finishTimerEarly()");
});

test("task lists: add, complete, due dates, multiple lists, focus link", () => {
  const app = boot({ prompts: ["Homework"] });
  app.ev("tab='Tasks';render()");
  assert.match(app.el("app").innerHTML, /Inbox/);
  app.el("taskNew").value = "Read chapter 3";
  app.el("taskDue").value = "2020-01-01";
  app.ev("addTask()");
  app.el("taskNew").value = "Solve 10 problems";
  app.ev("addTask()");
  assert.equal(app.ev("activeTaskList().tasks.length"), 2);
  assert.match(app.el("app").innerHTML, /Overdue/);
  const id = app.ev("activeTaskList().tasks[0].id");
  app.ev(`toggleTask('${id}')`);
  assert.equal(app.ev("activeTaskList().tasks.filter(t=>t.done).length"), 1);
  app.ev("addTaskList()");
  assert.equal(app.ev("activeTaskList().name"), "Homework");
  assert.equal(app.ev("state.taskLists.length"), 2);
  app.ev("selectTaskList('inbox')");
  const open = app.ev("activeTaskList().tasks.find(t=>!t.done).id");
  app.ev(`focusTask('${open}')`);
  assert.equal(app.ev("tab"), "Focus");
  assert.equal(app.ev("taskTitle()"), "Solve 10 problems");
  assert.match(app.el("app").innerHTML, /Solve 10 problems/);
  app.ev("completeFocusTask()");
  assert.equal(app.ev("state.profile.focusTaskId"), "");
  app.ev("tab='Tasks';selectTaskList('inbox');clearDoneTasks()");
  assert.equal(app.ev("activeTaskList().tasks.length"), 0);
  app.ev("deleteTaskList()");
  assert.deepEqual(app.errors, []);
});

test("malformed task data is sanitised on load", () => {
  const app = boot();
  const clean = app.ev(`JSON.stringify(migrate({profile:{},taskLists:[null,{id:'a',name:5,tasks:[{text:'ok',due:'bad'},{},null,{text:'x',done:1}]}]}).taskLists)`);
  const lists = JSON.parse(clean);
  assert.equal(lists.length, 1);
  assert.equal(lists[0].tasks.length, 2);
  assert.equal(lists[0].tasks[0].due, "");
  assert.equal(lists[0].tasks[1].done, true);
});

test("encrypted cloud backup: create, reject wrong passphrase, restore", async () => {
  const app = boot();
  app.ev(`state.chapters.push({id:'c',subject:'General',name:'Secret Optics',status:'Learning',mastery:30,confidence:2,lastStudied:null})`);
  app.ev("openCloudBackup()");
  app.el("bkPass").value = "short"; app.el("bkPass2").value = "short";
  await app.ev("runCloudBackup()");
  assert.equal(app.ctx.__lastBlob, undefined, "weak passphrase must not create a file");
  app.el("bkPass").value = "a strong passphrase"; app.el("bkPass2").value = "a strong passphrase";
  await app.ev("runCloudBackup()");
  const text = await app.ctx.__lastBlob.text();
  assert.ok(!text.includes("Secret Optics"));
  assert.ok(app.ev("state.profile.lastCloudBackupAt"));

  const other = boot();
  assert.equal(other.ev("state.chapters.length"), 0);
  other.el("bkFile").files = [new Blob([text])];
  other.el("bkPass3").value = "not the passphrase";
  await other.ev("runCloudRestore()");
  assert.equal(other.ev("state.chapters.length"), 0, "wrong passphrase must not restore");
  assert.match(other.el("bkMsg").textContent, /Wrong passphrase/);
  other.el("bkPass3").value = "a strong passphrase";
  await other.ev("runCloudRestore()");
  assert.equal(other.ev("state.chapters[0].name"), "Secret Optics");
  assert.deepEqual(app.errors, []);
});

test("every tab, including Tasks and the new focus controls, renders without errors", () => {
  const app = boot();
  for (const tab of ["Today", "Syllabus", "Backlog", "Tasks", "Revision", "Mistakes", "Tests", "Focus", "Progress"]) {
    app.ev(`tab='${tab}';render()`);
    assert.ok(app.el("app").innerHTML.length > 50, tab);
  }
  for (const mode of ["countdown", "pomodoro", "stopwatch"]) {
    app.ev(`setTimerMode('${mode}')`);
    assert.match(app.el("app").innerHTML, /Ambient sound/);
  }
  assert.deepEqual(app.errors, []);
});
