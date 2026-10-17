const test = require("node:test");
const assert = require("node:assert/strict");
const { priorityScore, priorityLabel } = require("../js/priority.js");

test("a fully mastered, confident, recently studied chapter scores low", () => {
  const score = priorityScore(
    { mastery: 100, confidence: 5, lastStudiedDaysAgo: 0 },
    { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false }
  );
  assert.equal(score, 0);
  assert.equal(priorityLabel(score), "Low");
});

test("a never-studied chapter with zero mastery/confidence scores high", () => {
  const score = priorityScore(
    { mastery: 0, confidence: 0, lastStudiedDaysAgo: 21 },
    { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false }
  );
  // (100*0.42) + (5*8) + (14*1.3) = 42 + 40 + 18.2 = 100.2 -> 100
  assert.equal(score, 100);
  assert.equal(priorityLabel(score), "High");
});

test("overdue revisions push a mid-mastery chapter into High priority", () => {
  const base = priorityScore(
    { mastery: 70, confidence: 3, lastStudiedDaysAgo: 2 },
    { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false }
  );
  const withRevision = priorityScore(
    { mastery: 70, confidence: 3, lastStudiedDaysAgo: 2 },
    { dueRevisionCount: 1, mistakeCount: 0, flaggedWeakInTest: false }
  );
  assert.ok(withRevision > base, "overdue revision should raise the score");
  assert.equal(withRevision - base, 12);
});

test("mistake count is capped at 4 for scoring purposes", () => {
  const atCap = priorityScore(
    { mastery: 50, confidence: 2, lastStudiedDaysAgo: 1 },
    { dueRevisionCount: 0, mistakeCount: 4, flaggedWeakInTest: false }
  );
  const overCap = priorityScore(
    { mastery: 50, confidence: 2, lastStudiedDaysAgo: 1 },
    { dueRevisionCount: 0, mistakeCount: 40, flaggedWeakInTest: false }
  );
  assert.equal(atCap, overCap, "mistakes beyond the cap should not add further score");
});

test("staleness beyond 14 days stops adding extra urgency", () => {
  const at14 = priorityScore(
    { mastery: 50, confidence: 2, lastStudiedDaysAgo: 14 },
    { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false }
  );
  const at100 = priorityScore(
    { mastery: 50, confidence: 2, lastStudiedDaysAgo: 100 },
    { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false }
  );
  assert.equal(at14, at100, "staleness cap should prevent further score growth");
});

test("a flagged test weakness adds exactly 15 points", () => {
  const base = { mastery: 60, confidence: 3, lastStudiedDaysAgo: 3 };
  const signalsOff = { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: false };
  const signalsOn = { dueRevisionCount: 0, mistakeCount: 0, flaggedWeakInTest: true };
  const diff = priorityScore(base, signalsOn) - priorityScore(base, signalsOff);
  assert.equal(diff, 15);
});

test("priorityLabel boundaries are inclusive at 65 and 40", () => {
  assert.equal(priorityLabel(65), "High");
  assert.equal(priorityLabel(64), "Medium");
  assert.equal(priorityLabel(40), "Medium");
  assert.equal(priorityLabel(39), "Low");
});

test("shared engine matches the original inline formula across random inputs", () => {
  const legacy = (c, rev, mist, weak) => {
    const stale = Math.min(c.lastStudiedDaysAgo, 21);
    return Math.round(
      (100 - c.mastery) * 0.42 + (5 - c.confidence) * 8 + Math.min(stale, 14) * 1.3 +
      rev * 12 + Math.min(mist, 4) * 5 + (weak ? 15 : 0)
    );
  };
  let seed = 42;
  const rnd = (n) => { seed = (seed * 1664525 + 1013904223) % 4294967296; return Math.floor((seed / 4294967296) * n); };
  for (let i = 0; i < 500; i++) {
    const c = { mastery: rnd(101), confidence: rnd(6), lastStudiedDaysAgo: rnd(400) };
    const rev = rnd(6), mist = rnd(9), weak = rnd(2) === 1;
    assert.equal(
      priorityScore(c, { dueRevisionCount: rev, mistakeCount: mist, flaggedWeakInTest: weak }),
      legacy(c, rev, mist, weak)
    );
  }
});
