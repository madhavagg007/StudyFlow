# StudyFlow: Private Study OS

Private, on-device study tracker with adaptive daily plans, a focus timer, revision and mistake tracking, a backlog planner and a growing study library. No account, no server.

## Features

- **Adaptive daily plan** ranks what to study from mastery, confidence, revision due dates, mistakes and test signals (`js/priority.js`)
- **Backlog planner**: add what you missed with a time estimate and deadline and get a day-by-day plan, a finish date and a warning if a deadline is at risk
- **Exam countdown and readiness score** per subject
- **Flexible focus timer**: countdown, Pomodoro (short and long breaks, optional auto-start) or stopwatch, with pause, +5 min, and finish early (logs the time you actually studied)
- **Ambient soundscapes** generated on-device (rain, ocean, forest wind, café murmur, brown and white noise) that play during focus and stop for breaks
- **Task lists**: several lists with due dates, and a Focus button that starts a session on a task
- **Encrypted cloud backup**: backups are encrypted with your passphrase before they leave the device, so you can store the file in any cloud safely
- A book that grows as you study, and a library shelf of completed sessions
- **Revision tracker**, **mistake log** and **test tracking**
- **App Lock**: optional PIN that encrypts your data at rest (AES-GCM, PBKDF2)
- **Printable progress report** (print or save as PDF)
- Export and import backups; works offline and installs to the home screen

## Run it

No dependencies and no build step needed.

```bash
npx serve .        # or just open index.html
```

## Scripts

```bash
npm test           # unit tests + headless smoke tests
npm run check      # static checks (files exist, scripts parse, no duplicate ids)
npm run build      # writes dist/StudyFlow.html, one self-contained file
```

## Project layout

```
index.html              markup and script/style references
manifest.webmanifest    install metadata
css/styles.css          all styles
js/                     ordered modules (see docs/ARCHITECTURE.md)
data/starter.js         legacy sample-chapter names
icons/                  favicon and app icons
dist/StudyFlow.html     built single-file bundle
docs/                   architecture, case study, changelog
scripts/                build.js, check.js
tests/                  unit tests (priority engine, backup encryption)
tests/e2e/              headless smoke tests that run the real app code (timer modes, tasks, sound, backup)
.github/workflows/      CI
```

## Testing note

`tests/e2e` runs the real scripts in Node with a small DOM stub. It checks behaviour and logic end to end (rendering, planning, encryption round trip) but is not a browser, so layout and animation still need a manual look.

## Privacy

All data stays in your browser. Nothing is uploaded. Plain exported backups are unencrypted JSON; encrypted cloud backups are not readable without your passphrase. See docs/SECURITY.md.

## License

MIT. See [LICENSE](LICENSE).
