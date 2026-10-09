# SWISH Clubhouse

A 2K-inspired basketball hub with one shared view for youths, coaches and volunteers. No PIN, login, or separate staff tools.

## Features

- Clubhouse: choose a player, see their card, and carry that selection across the site and device reloads.
- Individual Breakdown — Your Player Lab: stats, trends, practice goals, ratings and team-relative badges.
- Team Breakdown — Together as One, SWISH: recorded contributions and team stats.
- Game History: results and box scores, refreshed from the Google Sheet every 60 seconds while visible.
- Challenges — Calling Your Own Number: forecasts matched to later box scores; shared visibility, signed browser identity for updating submissions.
- In The Lab — Unseen Hours: individual/team gaps, training suggestions and animated court walkthroughs.
- Film Room: static published catalogue, embedded YouTube/Instagram/Google Drive video files; Skills Library, 5 On 5 Plays, 3 On 3 Plays and Game Footage.
- Accolades — The Trophy Cabinet: awards, repeat counts, seasons and unique references.
- Attendance: typed names for a session or match; revision-safe edits.
- Clubhouse Notebook: shared notes and next steps.
- Lineup Tracker: five-player stints, clock/score deltas, plus-minus and efficiency when possessions are counted. Small samples remain exploratory.
- Game Worksheet: device draft and validated CSV export for manually updating the source sheet. No Google write integration.

## Hosting and Data

GitHub stores the code, Vercel hosts the app, Supabase stores shared records, and Google Sheets supplies live stats in one direction. Published Film Room content is a static site file. The deployed app has no ChatGPT runtime dependency; it works independently while these external services remain active. Free-plan limits and provider terms still apply.

Everyone can use the same shared tools, including saves and removals. Server validation, same-origin mutation checks, attendance revisions, duplicate-award protection, and overlapping-lineup checks remain. There are no verified individual accounts. RLS keeps direct database API access closed; Vercel's server connection handles shared saves.

Google editing credentials and STAFF_PIN are unused. The code contains no Google write client. Existing saved records remain in Supabase; legacy tables are not dropped. API `/games` and legacy PIN unlock return 410. Stats remain read-only from the app.

## Film Room Publishing

Open Film Room's Clip Editor. Add links and viewing cues, preview, then Export Catalogue. Edits are **device drafts**, not shared saves. Replace `clubhouse/public/hub/content/film-room.json` in GitHub with the exported file and commit to `main`; Vercel's connected deployment publishes it. Viewers load that file without Supabase or cookies. The catalogue is validated and URLs restricted to supported providers.

Drive links must point to individual video files shared as **Anyone with the link → Viewer**. Folder links are rejected. Providers may restrict playback or embedding; each viewer includes an original-link fallback. This does not upload footage or bypass sharing permissions.

## Setup and Development

See [SETUP.md](SETUP.md). Locally: copy `.env.example` to `.env.local`, configure your server values, `npm ci`, then `npm run dev`. Never commit credentials. Run `npm test`, `npm run typecheck`, and `npm run build` before publishing.
