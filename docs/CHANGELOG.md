# Changelog

## v2.2
- Timer: Pomodoro mode (short and long breaks, optional auto-start), stopwatch mode, pause and resume, +5 minutes, and finish early (logs the minutes actually studied). The clock is now timestamp-based.
- Ambient soundscapes (rain, ocean, forest wind, café murmur, brown and white noise) synthesized with Web Audio; plays during focus, pauses with the timer, stops during breaks
- Task lists: multiple lists, due dates, overdue flag, and a Focus button that links a session to a task
- Encrypted cloud backup: passphrase-encrypted (PBKDF2 + AES-GCM) file shared to your own cloud via the system share sheet or downloaded; restore with the passphrase
- Fixed: the focus book kept stale pages when a second session started in the same visit
- Added `docs/SECURITY.md`; 14 more tests (29 total)

## v2.1 (modular)
- Split the single file into `css/`, `js/` (15 ordered modules), `data/`, `icons/`, `docs/`, `scripts/` and `tests/`
- The app now uses the same `js/priority.js` engine that the unit tests cover (a random-input test confirms it matches the previous inline formula)
- Added headless smoke tests that run the real application code: rendering, backlog planning, App Lock round trip, report, reset
- Added `npm run build` (single-file bundle) and `npm run check` (static checks), plus CI that runs both
- Added web app manifest and icons for Add to Home Screen

## v2.0
- Backlog planner with user-entered items, estimates, deadlines, finish plan and deadline warnings
- Exam countdown and per-subject readiness score
- Printable progress report
- Removed hardcoded sample chapters (one-click cleanup for existing data)
- PIN App Lock with AES-GCM encryption; warning before unencrypted export
- Visual and animation polish; fixed hero contrast, undefined colour variables and numeric guards

## v1.0
- Original single-file StudyFlow
