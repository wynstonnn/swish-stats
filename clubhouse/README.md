# SWISH Clubhouse

A 2K-inspired basketball development hub for youths, coaches and volunteers. Players explore the shared proxy roster; coaches and volunteers unlock identical tools with a server-verified PIN.

**Live app:** https://swish-clubhouse.vercel.app

**Complete backend setup:** [SETUP.md](SETUP.md)

## Features

- MyPlayer cards: transparent stat-based development ratings, provisional samples, Bronze/Silver/Gold badges and award totals.
- Call your shot: next-game predictions compared with the matching Google Sheet box score. Forecasts are tied to a signed browser cookie, not individual accounts.
- Unseen Hours (The Grind): individual/team shooting and turnover gaps, recent three vs previous three comparisons, practical game cues, six animated drills/plays with pause and step controls.
- Film Room: YouTube and Instagram embedded viewers; Skills library and Our game footage shelves; staff add a link and viewing cue. Public/embedding restrictions can prevent a clip playing; an original-link fallback remains available. Direct uploads are not implemented.
- Accolades: staff awards, repeat counts (such as 2× Hustle Player of the Year), seasons, reasons and unique game/event references.
- Simple attendance: session or match, date, names typed on separate lines or comma-separated; names deduplicate and staff can edit saved lists.
- Shared staff notebook: observations, next steps, game cues and session plans.
- Lineup tracker: five names, countdown entry/exit clocks and cumulative scores per substitution stint. Save & next carries the clock/score forward. Summaries show recorded minutes, plus/minus, scaled plus/minus per 40 and optional possession-based efficiency. Overlapping stints are rejected; individual game averages are never treated as lineup performance.
- Add game: validates final scores and box scores, then atomically adds Games and Player_Data rows to Google Sheets. Optional shooting remains unknown when blank. Safe retries prevent duplicate writes.
- Live statistics: refresh on opening, every 60 seconds while visible, on returning to the tab, and on Refresh now. Last successful snapshots are retained in Postgres when connected.

## Architecture and independence

GitHub owns the code, Vercel runs Next.js/API functions, Supabase Postgres stores clubhouse records and Google Sheets stores match statistics. No ChatGPT session, subscription, API, Supabase Auth, SMTP, browser OAuth token or Supabase Storage key is used by the deployed app. It continues independently after ChatGPT Plus ends while those external services and credentials remain active.

The public player side has read access to the shared proxy statistics and curated club content. Staff reads/writes require the signed HttpOnly PIN cookie. The PIN is only checked on the server. A player cannot gain write access by unhiding a tab or forging role headers. Successful sessions last eight hours; changing STAFF_PIN or STAFF_SESSION_SECRET invalidates them. PIN attempt throttling is database-backed when connected; before database setup, the fallback is per server instance. A shared PIN gives all holders the same access, rather than individual identity/audit attribution.

## Development and deploy

Vercel project **swish-clubhouse** links this repository with Root Directory **clubhouse**, framework Next.js, production branch main. Main pushes trigger deployments. The older root dashboard and ChatGPT-hosted site are separate deployments.

```sh
cd clubhouse
npm ci
cp .env.example .env.local
npm run dev
npm run typecheck
npm test
npm run build
```

Use six server environment variables from `.env.example`. Configuration diagnostics appear under staff **Setup & sheet**. No player accounts, admin emails, anon keys, service-role keys, confirmation emails or redirect URL configuration are needed.

## Data rules

Player averages use recorded values, not blanks as zero. Ratings are SWISH training indicators, not official NBA 2K ratings. Full formulas and badge thresholds are visible on every player card. Shooting uses paired makes/attempts for development cards. Team gap analysis includes only dated games with the relevant metric fully recorded. Box scores cannot establish defensive coverage, shooting openness or lineup chemistry; use the drill cues and Film Room alongside them.

A prediction matches one player/date/opponent box score. Opponent matching ignores case and surrounding spaces. Forecasts for past dates or games with logged player box scores are rejected. SWISH serializes forecast/game writes against the same spreadsheet lock, but direct edits in Google Sheets are outside that lock. Clearing the browser cookie loses access to that browser's predictions; staff still see them in the database. This setup does not claim verified individual player identities.

Each game submission has a UUID and payload hash. A Postgres transaction lock serializes writes to the Sheet; a Google developer-metadata marker proves whether an uncertain atomic save succeeded. Retry the same unchanged draft after a timeout. Games sharing the same date/opponent are blocked because the original tracker joins on those fields. Preserve original tab names and column layout. Writes insert at row 2 under the headers; review external integrations that assume fixed row positions.

Lineup writes serialize overlap checks and inserts in a Postgres transaction; retries with the same stint ID return success only for the same payload. Delete an incorrect stint before replacing it. Period breaks need separate stints. Per-100 values require both possession counts on every included stint; per-40 values are scaled observations, not predictions.

SQL setup is additive. It does not erase legacy records, but quests, old attendance categories and account-role endpoints are removed from the new app. Earlier hosted staff records are not automatically migrated. Export anything you need before retiring the previous deployment.

## Verification

Tests cover PIN tampering/expiry, public/staff API boundaries, forged headers, origin checks, input validation, video URL allowlists, attendance edit conflicts, frontend navigation, predictions vs actual results, repeat awards, lineup calculations and atomic game retry/idempotence. Production build checks the Vercel runtime. Real database persistence and Google write permissions must be verified after the owner adds external credentials; configuration indicators alone are not proof of a successful write.
