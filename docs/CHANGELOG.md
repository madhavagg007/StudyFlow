# Changelog

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
