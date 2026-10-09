# SWISH Clubhouse

A responsive basketball clubhouse for players, coaches and volunteers. Vercel hosts it; Supabase persists shared records; Google Sheets supplies live stats and receives staff-submitted box scores. It runs independently of ChatGPT.

Players get Lounge snapshots, Individual Breakdown with logged shot zones and team percentiles, Team Breakdown, Game History, Challenges, In The Lab animations, embedded Film Room and Accolades. End-of-year commendations are informal browser-based votes; staff decide official awards.

Staff Access uses the configured server PIN and an expiring signed cookie. Attendance, award creation/removal, coaching notes, lineup tracking, Log Game, Film Room catalogue editing and connection diagnostics unlock for coaches and volunteers together. Server permission checks enforce shared-record writes and private staff reads.

Published Film Room clips are static and need no database. Device catalogue drafts are exported to GitHub to publish through Vercel. Google writes require a service account shared as Editor, with credentials in server-only Vercel variables. A Google metadata receipt protects game retries from duplicates.

Badges use SWISH statistics-based percentage thresholds. See [SETUP.md](SETUP.md) for the credential setup, connection test, vote limits and data methods.

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Vercel root directory: `clubhouse`. Database bootstrap: `supabase/schema.sql`; hosted updates: `supabase/migrations/`.


Player builds now use the reference's six team-relative attributes, a 40% best-three / 60% all-attribute blend, and a 60–95 OVR with shared tie ranks. Historical OVR is recalculated from dated records under formula v2, with year, game-date and historical division views; undated records stay in career totals only. Participation badges are separate from percentile-earned performance badges. The ten-segment hot-zone court needs five own attempts and ten other-teammate attempts before colouring a zone hot/cold. Usage estimates require complete matching box scores; time-adjusted USG also requires all participants' minutes and an explicit 5v5/3v3 format. The opportunity slider is a constant-efficiency scenario, not a player-potential forecast. All calculations follow the shared year/division window.
