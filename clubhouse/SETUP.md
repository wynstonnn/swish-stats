# Keep SWISH running after ChatGPT Plus

Your deployed app is https://swish-clubhouse.vercel.app. Its source is https://github.com/wynstonnn/swish-stats, in the `clubhouse` folder. Vercel is linked to GitHub, so changes to main deploy automatically. Staff access uses one PIN with the same tools for coaches and volunteers.

The app runs through **your Vercel, Supabase and Google accounts**. Ending ChatGPT Plus does not shut down those accounts or make the deployed code stop working. The runtime contains no ChatGPT/OpenAI API calls. Keep the external projects, credentials and any required billing active. Hosting is an ongoing service; it does not need a computer or a ChatGPT conversation left open.

## What has been configured, and what remains

The repository, Vercel project, linked spreadsheet ID, staff PIN and generated session secret have been configured. The owner must create/connect the Supabase database and supply a Google service-account credential with Editor permission on the Sheet. Until then, the app can show public Sheet statistics but **cannot durably save clubhouse records or write games**. It reports failed saves rather than pretending to store them locally.

| Service | Responsibility | What you need |
|---|---|---|
| GitHub | Code and version history | Keep `wynstonnn/swish-stats`; `main` is production |
| Vercel | Website and server API | Keep `swish-clubhouse`, root `clubhouse`; add server environment variables |
| Supabase | Attendance, forecasts, videos, accolades, lineup stints, notes, cache and write ledger | Project, SQL tables, transaction pooler connection string |
| Google Sheets | Match results and player box scores | Sheets API, service account key, share this Sheet with that account as Editor |

## 1. Create Supabase and run the SQL

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and create a project in an organization you control. Select a plan intentionally; Free is enough to try the app. Singapore is a sensible region for this club.
2. Save the database password in your password manager. This is not your Supabase account password.
3. In the project, open **SQL Editor → New query**.
4. Open [clubhouse/supabase/schema.sql](https://github.com/wynstonnn/swish-stats/blob/main/clubhouse/supabase/schema.sql), copy all its SQL, paste it into the editor and run it. The script is safe to rerun and leaves existing legacy tables intact.
5. Use the project's **Connect** panel and select **Transaction pooler**. Copy the Postgres URI, normally on port **6543**. Serverless Vercel functions need a pooler rather than many direct database connections.
6. Replace the password placeholder with your database password. URL-encode special password characters; do not include the surrounding placeholder brackets. Add `?sslmode=require` if the URI has no query string, or `&sslmode=require` if it already has one. Use the host/user shown in your own Connect panel rather than guessing them.
7. In Vercel, put that full URI in `DATABASE_URL` for the **swish-clubhouse** project, Production environment.

Example shape only — do not copy these placeholders as real credentials:

```text
postgresql://postgres.PROJECT_REFERENCE:ENCODED_DATABASE_PASSWORD@YOUR_POOLER_HOST:6543/postgres?sslmode=require
```

The backend uses parameterized `pg` queries without named prepared statements, and transaction-scoped advisory locks, compatible with the transaction pooler. Tables have Row Level Security enabled and no anon/authenticated grants; browsers never connect directly to Postgres. The trusted server connection performs the validated operations.

**You do not need Supabase Auth, player sign-ups, SMTP, email confirmation, admin email lists, redirect URL settings, anon/publishable keys or service-role keys for this version.** Supabase is just the database. No workbook storage bucket is needed.

## 2. Give the website Google editing access

This editing permission belongs to the backend service account, not to the players. Coaches use the PIN-protected website form; they do not each need Google Editor access to use it.

1. Open [Google Cloud Console](https://console.cloud.google.com/) using the Google account that owns or can share the tracker. Create or choose a project you control.
2. Go to **APIs & Services → Library**, search **Google Sheets API**, and enable it.
3. Go to **IAM & Admin → Service Accounts → Create service account**. Give it a name such as `swish-sheet-writer`.
4. For this use, skip optional Google Cloud project roles and user access. Sheet sharing grants the required file permission; you do not need broad Owner/Editor IAM roles or domain-wide delegation.
5. Open the new service account → **Keys → Add key → Create new key → JSON**. Download and store the key privately. If your organization's policy blocks creating service-account keys, its administrator must enable an allowed credential approach; do not paste a personal Google password or browser token into Vercel.
6. Open [your SWISH tracker](https://docs.google.com/spreadsheets/d/1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI/edit).
7. Click **Share**, paste the JSON's `client_email` (ending in `iam.gserviceaccount.com`), and choose **Editor**. Turn off email notification for that service account if Google offers it. Share just this spreadsheet.
8. In Vercel environment settings, set `GOOGLE_SERVICE_ACCOUNT_EMAIL` to the JSON's `client_email`, and `GOOGLE_PRIVATE_KEY` to the JSON's `private_key` value. Keep the BEGIN/END PRIVATE KEY lines and line breaks. The app accepts actual line breaks or the literal `\n` sequences from JSON. Paste the value without the enclosing JSON quotation marks.
9. Keep `GOOGLE_SHEET_ID` set to `1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI` for production. Do not paste the whole edit URL into this field.

Keep the original tabs/column order: `Player_Roster`, `Player_Data`, `Games`, and `Shot_Data`. The website writes aggregate box scores into Games and Player_Data. It does not write notes, attendance, videos or awards into the Sheet; those are shared through Supabase.

A service-account key is a persistent server credential rather than a short-lived ChatGPT connection. The app obtains fresh Google access tokens automatically from it. Revoking the key or removing its Sheet permission stops writes. Never commit the key JSON to GitHub, put it in frontend JavaScript, or prefix it with `NEXT_PUBLIC_`.

The app can read a private spreadsheet once these credentials work. Before setup, it tries the public viewer endpoint for your proxy data. You can later restrict Google sharing and retain service-account Editor access; verify authenticated reads before changing that sharing setting.

## 3. Finish Vercel configuration and redeploy

Open [Vercel Dashboard](https://vercel.com/dashboard) → **swish-clubhouse → Settings → Environment Variables**. These six variables are all server-only:

| Variable | Value / current action |
|---|---|
| `STAFF_PIN` | Already configured to the requested shared staff code |
| `STAFF_SESSION_SECRET` | Already generated and configured; retain it or replace with a cryptographically random secret of at least 32 characters |
| `DATABASE_URL` | Add your Supabase transaction pooler URI with SSL |
| `GOOGLE_SHEET_ID` | Already configured to your tracker ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Add `client_email` from the Google key JSON |
| `GOOGLE_PRIVATE_KEY` | Add `private_key` from the JSON, including BEGIN/END lines |

Use the Production target. For Preview/Development, use a separate test Sheet and separate database if you want to test writes without touching the live tracker. Rotate the staff PIN in Vercel whenever needed; redeploy to apply it. Changing the PIN invalidates older staff cookies after that deployment. The staff session lasts eight hours; players never need the PIN.

After saving variables, open **Deployments**, choose the latest production deployment, and **Redeploy**. Environment changes apply to new deployments. The app is already configured for Next.js, root `clubhouse`, default npm build, and production branch main.

Players should open the stable production URL, not a preview URL. If they see a Vercel sign-in page rather than SWISH, check **Settings → Deployment Protection** and allow public production access while retaining preview protection. The website's staff PIN remains separate from Vercel's deployment protection.

## 4. Verify the connections, then use it

1. Open the app in a private/incognito window: it should show the player side, live statistics, Unseen Hours, Film Room, Accolades and Call your shot. Staff tools should be hidden.
2. Press **Staff access**, enter the shared code, and open **Setup & sheet**. Database should show CONNECTED; Google editing should show CONFIGURED. These checks establish connection/schema or variable presence, not successful write permission.
3. Save an attendance record, an award and a Film Room clip. Open another browser, unlock staff, and check that all three appear. This confirms shared persistence rather than a local browser draft.
4. For the first game-write test, make a **copy of the Google tracker**, share that copy with the service account as Editor, and use its ID in a Preview/test deployment. Add a small test game with player points equal to the team score. Confirm the result in Games and player rows in Player_Data, then refresh the app and compare. Do not add fake test rows to your live tracker.
5. On production, use **Add game** for your next real match: date, opponent, format, final scores, players who played, box scores, optional makes/attempts. Click Save game to Google Sheet.
6. If a network timeout occurs, retry the same unchanged draft. The atomic Google batch and submission marker prevent duplication. Player points must match SWISH score; makes cannot exceed attempts; fully recorded shot categories must reconcile to points.
7. Enter a forecast before the match, using the same player/date/opponent. After the box score is logged, it shows prediction → actual. It is tied to that browser's cookie; clearing cookies loses the player-side association, while staff still have the saved record.
8. Press **Lock staff tools** before handing the device to players. Unhiding a staff tab through browser tools does not bypass the server's PIN check. A shared code is simple access control, not individual staff identity; anyone who knows it gets all staff features.

## 5. Use the lineup tracker without a possession-by-possession log

Assign one volunteer to note only substitutions. Start with one quarter, then expand when it feels manageable.

- Choose the game after it exists in the tracker. From the bench's notes or film, select the five players, period, entry clock and cumulative score.
- At the next substitution, record exit clock and cumulative score. Use **Save stint & next**. The next start clock and scores carry over; change only the subbed players.
- End a stint at the period boundary. Start the next period with the actual period length (for example 10:00) and the unchanged cumulative score. Split an unchanged five across periods as well.
- Leave possession fields blank initially. You will still get minutes, points for/against, plus/minus and scaled plus/minus per 40. If a second volunteer counts possessions, enter both teams' counts to enable per-100 offensive/defensive efficiency. Count a new possession after a change of control; an offensive rebound continues the same possession.
- Add a short context note: opposing starters, zone defence, foul trouble. Compare multiple games and larger samples before changing a rotation. An eight-point run in two minutes is an observation, not proof of lineup superiority.
- Overlapping stints in the same game/period are rejected. Remove an incorrect saved stint and enter its replacement. One staff logger per match keeps the process straightforward.

The tracker can analyse partial coverage; it does not infer unlogged minutes or calculate on/off net ratings from a full-game individual box score. Direct game-footage uploads and an automated substitution/video tagging tool would be later additions.

## Costs and continuity

The app does need hosting for as long as you want the URL available, but you do not need to keep ChatGPT Plus. Code and data stay in your external accounts. A custom domain is optional; the `vercel.app` address is sufficient.

- [Vercel Hobby](https://vercel.com/docs/plans/hobby) can serve qualifying personal, non-commercial projects within its limits. If your organization's use does not qualify, choose an appropriate paid plan. Hosting quotas and terms can change.
- [Supabase Free](https://supabase.com/pricing) is useful for testing but currently pauses projects after one week of inactivity. Resume a paused project in the dashboard. For a dependable ongoing club service, evaluate a paid plan; the current Pro base price starts at US$25/month and includes one Micro project via compute credits, with additional usage potentially billed. Free is not a promise of uninterrupted hosting forever.
- [Google Sheets API](https://developers.google.com/workspace/sheets/api/limits) currently has no additional API usage charge but does enforce quotas. This app has no AI inference or video-hosting bill; YouTube/Instagram host the linked clips.
- Keep a monthly Google Sheet Excel export and a Supabase database export. The Free plan should not be treated as your only backup. GitHub backs up source code, not your live database or service credentials.

## Troubleshooting

| Symptom | Check |
|---|---|
| Player page works; Save says connect database | Add DATABASE_URL, run schema.sql, redeploy |
| PIN fails after adding DATABASE_URL | Verify DB password, SSL URI and pin_attempts table; run the full schema before enabling DB |
| Too many PIN attempts | Wait 15 minutes; database-backed throttling counts attempts per source IP |
| Google authorisation fails | Correct service-account email/private key, correct new deployment, active key |
| Google denies editing | Enable Sheets API and share the actual Sheet with client_email as Editor |
| Private Sheet cannot load | Configure working Google credentials; public viewer fallback cannot read a private file |
| Live Sheet reports missing columns/tabs | Preserve original tab names/header layout; inspect original tracker |
| Save game reports duplicate opponent/date | This tracker joins those two fields; correct/inspect existing rows instead of creating a duplicate |
| Forecast stays pending | Player name, date and opponent must match exactly apart from opponent casing/spaces; duplicate player rows are ambiguous |
| Instagram doesn't play | Post must allow public embeds; browser/provider restrictions can still block it; use the original-link fallback or a YouTube clip |
| Lineup efficiency shows — | Supply both possession counts for every included stint; otherwise minutes and plus/minus still work |
| Old Quest board is still visible | You are on the earlier root dashboard or ChatGPT-hosted site; use the new swish-clubhouse production URL |

The earlier ChatGPT-hosted site and root dashboard are separate from this deployment. New access rules/features apply to this app. Existing staff records from the earlier site are not automatically copied into the new database.
