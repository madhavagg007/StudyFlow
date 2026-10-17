/**
 * StudyFlow adaptive prioritization engine.
 *
 * Scores a chapter from 0 (do-not-worry-about-it) upward based on five signals:
 *  - mastery gap        (lower mastery -> higher priority)
 *  - confidence gap     (lower stated confidence -> higher priority)
 *  - staleness          (days since last studied, capped at 14 days of effect)
 *  - due revisions      (spaced-repetition items overdue for this chapter)
 *  - mistake frequency  (logged mistakes against this chapter, capped at 4)
 *  - test weakness flag (chapter flagged as a weak topic in a past test)
 *
 * This is a pure function — no globals, no DOM, no dates computed internally
 * beyond what's passed in — so it can be unit tested without the rest of the app.
 */

const WEIGHTS = {
  masteryGap: 0.42,
  confidenceGap: 8,
  staleness: 1.3,
  staleCap: 14,
  revisionDue: 12,
  mistake: 5,
  mistakeCap: 4,
  testWeak: 15,
};

/**
 * @param {object} chapter - { id, name, mastery (0-100), confidence (0-5), lastStudiedDaysAgo (number) }
 * @param {object} signals - {
 *   dueRevisionCount: number,   // overdue revisions for this chapter
 *   mistakeCount: number,       // logged mistakes for this chapter
 *   flaggedWeakInTest: boolean  // chapter appeared as a weak topic in any test
 * }
 * @returns {number} integer priority score, higher = more urgent
 */
function priorityScore(chapter, signals) {
  const mastery = chapter.mastery || 0;
  const confidence = chapter.confidence || 0;
  const stale = Math.min(chapter.lastStudiedDaysAgo ?? 0, 21);
  const revDue = signals.dueRevisionCount || 0;
  const mistakes = signals.mistakeCount || 0;
  const testWeak = !!signals.flaggedWeakInTest;

  const score =
    (100 - mastery) * WEIGHTS.masteryGap +
    (5 - confidence) * WEIGHTS.confidenceGap +
    Math.min(stale, WEIGHTS.staleCap) * WEIGHTS.staleness +
    revDue * WEIGHTS.revisionDue +
    Math.min(mistakes, WEIGHTS.mistakeCap) * WEIGHTS.mistake +
    (testWeak ? WEIGHTS.testWeak : 0);

  return Math.round(score);
}

function priorityLabel(score) {
  if (score >= 65) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

if (typeof module !== 'undefined' && module.exports) module.exports = { priorityScore, priorityLabel, WEIGHTS };
