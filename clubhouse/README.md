# SWISH Clubhouse

SWISH's basketball growth dashboard for youths, coaches and volunteers, with a 2K-inspired player lab, levels, quests, sessions, attendance, drill library, lineups and coaching notes.

This is the portable Next.js version. Vercel hosts the app, Supabase provides sign-in, Postgres and private workbook storage, and Google Sheets remains the source of basketball statistics.

## Main workflows

- **Players:** sign in to the player lab, team roster, game room and their own quests/attendance XP. They cannot call staff endpoints, change roles, add games, upload workbooks, or read coaching notes.
- **Coaches and volunteers:** access every staff tool, including sessions, attendance, duties, quests, coaching notes, lineups, workbook backups and Add game.
- **Club administrator:** assigns roles and links each account to a roster player from Account access. New confirmed accounts start as players. Administrator identity is the verified email in `SWISH_ADMIN_EMAILS`, configured on the server.
- **Add game:** choose the date/opponent/format, enter final scores, tick the players who played, enter box scores, then save. One atomic Google batch inserts the match and player records under the existing headers. Existing records are retained, computed shooting cells receive formulas, and unknown optional shooting data stays blank.
- Stats refresh on opening, every 60 seconds while visible, and on Refresh now. Save game invalidates the shared cache and refreshes stats.

## Set up the backend

1. Create a Supabase project in Singapore (`ap-southeast-1`). Run `supabase/schema.sql` in its SQL editor. It creates the clubhouse tables and a private `swish-workbooks` bucket. Existing data is not deleted.
2. In Supabase Auth, enable email/password sign-in and email confirmation. Set the Site URL to your Vercel production origin, and add the exact production origin as an allowed redirect. Configure SMTP if required for reliable confirmation emails.
3. Create a Google Cloud service account, enable the Google Sheets API in its project, create a JSON key, and share the linked tracker with its `client_email` as **Editor**. No domain-wide delegation is needed. Keep the credential in Vercel environment settings; never upload the JSON to GitHub.
4. Set the eight variables in `.env.example` in Vercel. Use Supabase's transaction pooler connection for `DATABASE_URL`; encode special password characters in the URL and use SSL. The service-role key is only used by the server for the private workbook bucket. All variables are server-only.
5. Put your confirmed email into `SWISH_ADMIN_EMAILS`. Sign up, confirm your email, then sign in. Ask players, coaches and volunteers to create their accounts, then use Account access to assign staff roles or link player profiles. An account appears after its first confirmed sign-in.

The app can read a private Google Sheet through the service account. If the original Sheet is still shared publicly, its separate Google sharing rules still apply; app roles do not control direct access to Google Sheets.

## GitHub and Vercel

This folder is designed to live at `clubhouse/` in `wynstonnn/swish-stats`, alongside the earlier dashboard.

Import the repository into Vercel as **swish-clubhouse**, choose **Next.js**, set **Root Directory: clubhouse**, and use the default `npm install` / `npm run build` settings with Node 22 or 24. Add backend variables before live use. Once linked, pushes to the production branch deploy automatically. Preview deployments keep the team's default protection.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm run typecheck
npm test
npm run build
```

No credential, workbook, cached player data or personal staff records are committed in this folder. The old root app and its settings are preserved during this migration. The existing ChatGPT-hosted site is a separate deployment; it does not gain these permission changes until separately upgraded or retired.

## Retry and data rules

A UUID belongs to one submitted game draft. A Postgres advisory lock serializes SWISH writes to this spreadsheet; an atomic Google developer-metadata marker identifies successfully written submissions. Retrying an uncertain save with the same draft does not duplicate the game. Editing a previously submitted draft requires starting a new game, and the duplicate check still applies.

The date/opponent combination must be unique because the original tracker joins game records by those fields. Two games against the same opponent on the same date need a future tracker format change; this version blocks them. Keep the four existing tab names and headers. New match rows are inserted at row 2, with selected player rows inserted at row 2 of Player_Data. Existing formula references shift with Google Sheets row insertion; review any external exports that assume fixed row positions.

Player points must equal the SWISH score. Makes must not exceed attempts. When all three shot categories are recorded, they must reconcile to points. Missing shooting detail stays unknown, not zero. Per-shot location logging remains in the original Sheet; this form adds aggregate player box scores.

## Migrating existing staff records

This repository does not include live records from the earlier hosted site. Export sessions, attendance, duties, quests and observations privately and import them into the matching Supabase tables before retiring that site. Workbook backups must be moved into the private storage bucket separately. Live Google statistics need no data migration.

## Checks

`npm test` covers verified identities, forged role/header rejection, player/staff API separation, private-field filtering, box-score validation, worksheet mapping, literal text safety and idempotent retry after an uncertain write. A production build verifies the Vercel-compatible runtime. Real Google writes require the service account and are not replaced by public viewer access.
