# Case study: two bugs and one cleanup

## 1. The invisible headline (CSS cascade)

**Symptom:** the main headline on the home screen could not be read.

**Cause:** an early rule set `.hero { background: var(--ink); color: #fff }`. A later "polish" rule intended for cards, `.card, .hero, .panel { background: <light gradient> }`, also matched `.hero`. Same specificity, later in the file, so it silently won: the dark background became cream while the text stayed white.

**Wrong first fix:** the headline text had also been hard-coded to black elsewhere, and changing it to white made the real problem worse. The lesson was to find the rule that actually decides the background rather than patching the symptom.

**Fix:** remove `.hero` from the shared rule and give `.hero` exactly one background declaration.

## 2. Variables that only existed in dark mode

`--muted` and `--gold` were defined only under `.dark`. In light mode every muted caption and gold bar fell back to the wrong colour with no error. Fixed by defining them on `:root`.

## 3. Removing dead code safely

Stacked redesign passes had left about 2.7 KB of CSS for classes that no longer existed in the markup, including a whole superseded Focus Lock screen. Before deleting each class I searched the entire HTML and JavaScript for the literal name. A near miss: `focus-lock-time` looked unused, but a naive substring search also matched the live `focus-lock-timer`. Only classes with zero real references were removed.

## Takeaway

CSS order bugs do not show up in a linter and each rule looks correct on its own. The durable fixes were structural: one declaration per concern, and tests that run the real code (see `tests/e2e`).
