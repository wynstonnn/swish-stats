# SWISH Clubhouse Setup

SWISH runs in your GitHub, Vercel, Supabase and Google accounts. Ending ChatGPT Plus does not stop it. Keep those accounts active and within their plan limits.

## Staff Access

Vercel uses server-only `STAFF_PIN` (your existing PIN is retained) and a random `STAFF_SESSION_SECRET` of at least 32 characters. Staff Access unlocks the same coach/volunteer view for eight hours. Player View locks it again. The PIN is checked on the server with rate limiting and an HttpOnly signed cookie; hiding tabs alone never grants permission. Rotating the PIN invalidates staff sessions.

Attendance, coaching notes, lineups, game writes, official accolade awards/removals and setup are staff-only. Players can read stats, challenges, film and awards, and submit forecasts and end-of-year votes. Votes use one signed browser identity per award and season; clearing cookies or switching devices creates a different identity. These are informal commendations, not verified-person ballots. Staff decide and award the official trophies.

## Supabase

1. Keep Vercel linked to GitHub `wynstonnn/swish-stats`, branch `main`, root `clubhouse`.
2. A new database needs `supabase/schema.sql` run in Supabase SQL Editor. The existing database has the award-vote migration applied.
3. Vercel `DATABASE_URL` uses your Supabase transaction-pooler URI, with its password URI encoded. The bundled official CA verifies TLS.
4. Redeploy after changing environment variables. Staff → Data & Sheet checks a real database read.
5. Attendance, accolades, commendations, forecasts, notes, lineups and game submission receipts persist in Supabase. Browser clients cannot directly read or edit these tables; Vercel enforces access.

## Direct Google Sheet Writes

Supabase is the record store. Google Sheets is a separate direct integration from the Vercel server; it needs its own Google credentials. No ChatGPT or Gemini agent is needed at runtime.

1. In [Google Cloud Console](https://console.cloud.google.com/), select/create a project owned by you.
2. Enable **Google Sheets API** in APIs & Services → Library.
3. IAM & Admin → Service Accounts → Create Service Account. It does not need broad project roles or domain-wide delegation to edit one shared sheet.
4. Open that service account → Keys → Add Key → Create New Key → JSON. Keep the downloaded key private.
5. Open your Google Sheet → Share. Add the JSON `client_email` as **Editor**; notification is unnecessary for a service account.
6. In Vercel project Settings → Environment Variables, configure production (and preview if needed):
   - `GOOGLE_SHEET_ID`: `1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: JSON `client_email`
   - `GOOGLE_PRIVATE_KEY`: JSON `private_key`, including BEGIN/END lines. Real line breaks and literal `\n` are supported.
7. Save and redeploy. Staff Access → Data & Sheet → **Test Google Connection** verifies the credential and that the sheet can be read. This does not write a test game or prove Editor permission. The first real successful save proves writes.
8. Staff → **Log Game**: choose a division (Men’s Open, U21, U18, Women’s Open, Girls U21/U18 or a custom division), add optional comma-separated tags, add only the participants from the empty player picker, enter scores and optional shooting detail, reconcile player points with the SWISH total, then save. Games and Player_Data update together. Existing records/formulas are retained. The dashboard refreshes afterward.

The same submission ID is retained when retrying a draft. A Google metadata receipt prevents duplicates after an uncertain response. A second game with the same date/opponent/division is blocked. Different divisions can play the same opponent on the same date: new Games and Player_Data rows share a SWISH Game ID so stats stay separate. Legacy games without divisions retain their date/opponent matching and block ambiguous duplicates. Keep original sheet names and columns. Metadata fields (SWISH Division, SWISH Tags, SWISH Game ID) are appended automatically on the first new save without replacing existing columns or formulas. Existing games remain Division Not Recorded until you explicitly update the source. New games always start with no players added; returning to an unsaved draft retains your selected participants.

A 403 from Google usually means the service account needs Editor access or the API is disabled. An authorisation error requires checking the email/key pair and redeploying. Never put the private key, database URL, session secret or PIN in public JavaScript or GitHub. Use Vercel settings to maintain them outside ChatGPT.

Official guidance: [Create Service-Account Credentials And Share Specific Files](https://developers.google.com/workspace/guides/create-credentials), [Sheets API Scopes](https://developers.google.com/workspace/sheets/api/scopes).

## Adding Players And Divisions

Staff → **Team Breakdown → Team Roster → Add Player** writes the name, optional position/hand, Active status and optional multiple comma-separated divisions to Player_Roster. For example, a player can belong to U18 and U21. Custom names such as Girls U16 are supported. The SWISH Divisions field is appended automatically. Duplicate names (ignoring case) are rejected; use a surname or other distinguishing name when two players share a name. The roster save has a Google metadata receipt so retrying the same draft does not insert duplicates. Adding a player does not add a game appearance or zero-stat row. Players without game logs are visible in Team Roster and individual selectors.

Game History filters by division and tag. Team Breakdown filters by roster membership; statistical averages and Top X% comparisons remain season totals across recorded divisions. Roster membership is a label, not a verified age or eligibility rule. The participant dropdown groups other divisions separately; staff can select someone who plays across divisions. All roster and game mutations remain staff-only.

## Live Stats And Shot Heatmap

Keep Anyone With The Link → Viewer sharing for the public stats feed. Vercel polls Player_Roster, Player_Data, Games and optional Shot_Data. A Supabase snapshot cache retains the last successful read through outages. The site refreshes every minute while visible, or on Refresh.

The heatmap reads Shot_Data **E Player, F Zone, G Result** (Make/Made or Miss/Missed). It groups named areas rather than inventing shot coordinates. Every recorded zone remains in the summary, including zones without a supported court position. No shot logs means an explicit empty state. Aggregate FG totals cannot establish shot locations.

Player comparisons use qualified teammates with at least five records, exclude the selected player, share tie credit and require three eligible peers. Turnovers favour fewer. Top X% rounds conservatively to a whole percentage; insufficient samples stay unscored. The implemented shooting badges (Set and Fire, Smooth Operator, Static Middy) use verified NBA 2K27 glossary icons in Bronze, Silver, Gold and Hall Of Fame colours. The full 53-badge game catalogue is not implemented. SWISH unlocks use stat proxies and team percentiles, not the game’s attribute requirements. Publisher image source: https://cdn.prgloo.com/media/21380e3231894ed3bc29a6f113c5f2f2.jpg.

## Film Room Without A Database

Staff → Film Room → Clip Editor can prepare YouTube, Instagram and Google Drive file links. Select Skills Library, 5 On 5 Plays, 3 On 3 Plays or Game Footage and add a viewing cue. Preview, then Export Catalogue. Replace `public/hub/content/film-room.json` in GitHub and commit to main; Vercel publishes it for everyone. Device drafts do not automatically publish. Reset Device Drafts returns to the published catalogue.

Drive links must point to a video **file**, shared as Anyone With The Link → Viewer. Provider embedding restrictions may require the original-link fallback. Viewing published clips needs no Supabase or Google key.
