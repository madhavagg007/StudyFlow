# Architecture

StudyFlow is a dependency-free static web app. There is no framework and no build step required to run it: open `index.html`.

## Load order

Scripts are classic (non-module) scripts that share one global scope, so **order matters**. `index.html` loads them in this order:

| File | Responsibility |
| --- | --- |
| `data/starter.js` | Legacy sample-chapter names, used only to recognise and remove old sample data |
| `js/priority.js` | Pure scoring engine. Also `require`-able from Node, which is how it is unit tested |
| `js/core.js` | Constants, helpers, default state, storage load/save and migration |
| `js/lock.js` | App Lock (PBKDF2 key derivation, AES-GCM encryption), theme |
| `js/cloud-sync.js` | Optional sync hook. Inert unless a host environment provides it |
| `js/intelligence.js` | Navigation, stats, task ranking built on the priority engine |
| `js/views.js` | Today, progress and shared views |
| `js/backlog.js` | Backlog planner, exam readiness, printable report |
| `js/insights.js` | Toast, end-of-day review, weekly insight |
| `js/syllabus-revision.js` | Syllabus map and spaced revision |
| `js/mistakes-tests.js` | Mistake log and test tracking |
| `js/focus.js` | Focus timer, forming-book animation and study library |
| `js/settings.js` | Subjects, settings, onboarding, import/export, reset |
| `js/ui.js` | Dialogs, global listeners, swipe navigation |
| `js/main.js` | Error reporting and boot |

## Data model

One JSON object (`state`) holds `profile`, `chapters`, `revisions`, `mistakes`, `tests`, `sessions` and `completedActions`. A backlog item is simply a chapter with `backlog: true`, `backlogEst` (minutes), `backlogDue` and `backlogAdded`. Time spent against it is derived from `sessions`, so there is no duplicated counter to drift.

## Storage and encryption

State is stored in `localStorage` as plain JSON by default. With App Lock enabled it is stored as an envelope `{ locked, salt, iter, iv, data }`: a key is derived from the PIN with PBKDF2 (SHA-256, 150,000 iterations) and the state is encrypted with AES-GCM using a fresh random IV on every write. A wrong PIN fails authentication and nothing is decrypted. There is deliberately no recovery path for a forgotten PIN. Exported backups are plain JSON and the app warns before exporting while locked.

## Backlog planner

Items are ordered by deadline, then by priority score. Each day is filled up to the user's minutes-per-day budget; an item can be split across days. An item is late if its finish day falls after its deadline (the exam date is used when no deadline is set). The minimum daily time needed is the maximum, over deadlines, of cumulative remaining minutes divided by days left.

## Build

`npm run build` inlines `css/` and `js/` into `dist/StudyFlow.html`, a single self-contained file that can be emailed or pasted into any static host.
