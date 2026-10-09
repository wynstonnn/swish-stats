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

## Shared Film Room And Youth Suggestions

Staff → Film Room → Build The Film Room → Publish A Clip saves YouTube, Instagram or Google Drive video file links directly to Supabase. Choose a shelf, title and viewing cue. The server checks staff access, provider URLs and input limits; a submission ID makes retries safe. Everyone can read published clips. No GitHub push, JSON editing or Vercel redeployment is required to add or remove shared clips.

The bundled `public/hub/content/film-room.json` remains a fallback catalogue. Catalogue Backup downloads the combined watchlist; old device drafts can be published with Publish Restored Device Drafts. Shared clips require the database; a failed save retains form input and never claims success.

For existing installations apply `supabase/film-suggestions.sql`. Fresh installations use `supabase/schema.sql`. RLS is enabled and direct anon/authenticated table grants are revoked; access runs through the Vercel APIs. Challenges accepts Drill, Skill, Play and Film suggestions from a roster player, using a signed browser identity, idempotent retries and five suggestions per rolling 24 hours. Suggestions are a current shared planning board, independent of historical stats filters.

Google Drive needs a video file link with viewer access. Folder links cannot play. Provider/owner embedding permissions still apply. Saved links remain in your Supabase project independently of ChatGPT subscriptions.

### Complete Game Logging

Staff → **Log Game** writes the game, participating player rows, optional shot rows and a retry receipt in one Google Sheets batch. New drafts start with no players or shots. Open **Full Box Score & Notes** for each participant to enter position, number, minutes, player +/−, fouls, direct FGM/FGA, close shots, rebound splits, contested shots, deflections, passing turnovers and remarks. The main row contains points, rebounds, assists, steals, blocks, turnovers and 2PT/3PT/FT makes and attempts. Optional blanks remain unrecorded. Player +/− is independent of the automatically calculated team point differential. Remarks are written as text, never as formulas.

FGM/FGA derive from complete 2PT + 3PT totals. FG%, 2FG%, 3P%, FT%, eFG%, TS%, AST/TO and AST/PTO are calculated where the required inputs are known; no-attempt/no-turnover ratios stay blank. The form also supports the Games tab’s Box Score and Game Events URL columns. IDs, game number, dates, result and team margin are automatic. Shooting makes cannot exceed attempts; points, rebound splits and passing turnovers are reconciled on the server before saving.

**Shot Log** covers all 18 original Shot_Data columns: shot ID/date/opponent/number, player, zone, result, L/R, detail, error, type, scoring situation, play, contest, assisted, assister, quality and remarks. IDs/date/opponent are automatic. L/R means shooting hand, not court location. Use the court or zone dropdown suggestions to choose a location. Existing detail values appear as suggestions; custom text is supported. Shot numbers must be unique across the game. Assisters must belong to the roster. Partial shot logs are accepted but cannot exceed any known box-score total. **Use Shot Log As Complete Shooting Totals** explicitly replaces one player’s shooting figures and points; use it only when every attempt has been logged, then reconcile the team score.

The heatmap groups normalized zones, separates rim and non-restricted paint, lists free throws outside the field-goal map, and reports unmappable zones. It never invents locations from box scores. A player with no Shot_Data records has an explicit empty state. Configured service-account reads include Shot_Data so saves refresh using authenticated Google data. Missing Shot_Data tabs are created automatically when the first shot log is saved. Existing records and columns are retained. This does not import historical locations that were never logged or provide editing of previously saved games.

### Shared Statistics Windows

The filter above the dashboard applies to player and team stats, player ratings/team-relative badges, shot heatmaps, game history, trends and development recommendations. **Career** includes every record, including undated records. **Selected Years** defaults to the most recent logged calendar year; tick several years to combine them. **Select All** in the year picker combines all dated years, while **Clear Selection** produces an explicit empty view. **Last Five Games** uses each player’s own five latest distinct dated appearances and the team’s five latest distinct dated Games records, within the chosen years and divisions. The team player table uses appearances in those five team games; individual stats use that player’s own stretch. Same-day games use their game number where available, then source order. Incomplete stats stay unrecorded.

The division picker uses the division attached to the historical game/player record, with a unique matching game as a fallback. It never infers historical age groups from current roster memberships. Missing divisions remain **Division Not Recorded**. Development charts/tables group by calendar year and recorded division, expose totals/averages, and show samples. Team counting averages require complete matching box scores for that category; points use official Games scores. Shooting percentages use paired makes/attempts. The latest-five versus previous-five comparison requires ten dated games with the chosen stat recorded in both stretches. Small samples describe recorded results, not proof of a causal development trend.

Selected years also filter saved awards (using the season label first), challenges, attendance and notes (note timestamps use Singapore time). Lineup summaries follow the selected team games. Film content and logging forms remain available independently of the stats filter; staff still have the complete roster and game list for new entries. New game saves retain the current filter, so a game logged outside it appears after changing the stats window. Filters and the selected player persist on the same device and survive live-sheet refreshes. No filter modifies the source sheet or backend records.

Click a stat heading’s **↕ / ↓ / ↑** button to sort highest-first, then lowest-first. Team/player/game tables and development summaries support this; missing values stay last. Charts keep chronological order when a summary table is sorted. Team comparisons remain top-percentile descriptions, without numerical player rankings.
