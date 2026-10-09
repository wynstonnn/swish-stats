# SWISH Setup

The same clubhouse is open to everyone. No access PIN, Supabase Auth, Google service account or Google Editor integration is required.

## Vercel and Supabase

1. Keep Vercel connected to GitHub `wynstonnn/swish-stats`, branch `main`, project root `clubhouse`.
2. If setting up a new Supabase project, run `clubhouse/supabase/schema.sql` in its SQL Editor. The existing project already has its tables.
3. Set server-only `DATABASE_URL` in Vercel to your Supabase transaction pooler URI. Replace its password placeholder with your URI-encoded database password. The bundled official CA verifies Supabase TLS.
4. Set `CLUBHOUSE_SESSION_SECRET` to a random value of at least 32 characters. The existing `STAFF_SESSION_SECRET` works as a compatibility fallback; it does not gate access. Do not change it unless you intend to reset browser prediction identities.
5. Redeploy after environment changes. Data & Sheet reports a live database read. Attendance, accolades, notes, forecasts and lineup stints use this database. Game worksheets and published films do not write to it.

`STAFF_PIN`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are no longer read by the code; you may remove them from Vercel. Removing them does not require changing the database password.

## Live Spreadsheet

Keep the current `GOOGLE_SHEET_ID` and original `Player_Roster`, `Player_Data`, and `Games` worksheet names/column layout. The feed needs **Anyone with the link → Viewer** sharing. Editors enter game statistics directly in Google Sheets. The site refreshes automatically every 60 seconds while visible and has Refresh Now. An optional Supabase cache retains the last successful snapshot during a feed outage.

Game Worksheet helps prepare box scores and exports a labelled CSV. Review and transfer values into the matching existing columns; this is not a direct-import file for the tracker and does not preserve formulas if pasted over formula cells. The site never writes to Google.

## Film Room Without a Database

1. Open Film Room → Build the Film Room · Clip Editor.
2. Select Skills Library, 5 On 5 Plays, 3 On 3 Plays, or Game Footage. Paste a supported link and a viewing cue.
3. Preview the clip. Drive footage needs the **video file** shared as Anyone with the link → Viewer. Public Instagram posts and YouTube videos must permit embedding.
4. Export Catalogue downloads `film-room.json`. Until publication, changes/removals are device-local drafts.
5. In GitHub, replace `clubhouse/public/hub/content/film-room.json` with that file and commit to `main`. Vercel deploys the static catalogue for every viewer.
6. Reset Device Drafts to return your browser to the published version after publication. Import Catalogue restores an exported device draft.

No Supabase, Google API keys or Google editor permissions are needed to watch published clips. Provider restrictions may require the original-link fallback.

## Independence From ChatGPT

The app runs in your GitHub, Vercel, Supabase and Google accounts. Ending ChatGPT Plus does not stop the deployed app. Keep these accounts active and monitor their plan limits; hosting and shared database availability depend on those providers.
