# SWISH Clubhouse

A responsive basketball clubhouse for players, coaches and volunteers. Vercel hosts it; Supabase persists shared records; Google Sheets supplies live stats and receives staff-submitted box scores. It runs independently of ChatGPT.

Players get Lounge snapshots, Individual Breakdown with logged shot zones and team percentiles, Team Breakdown, Game History, Challenges, In The Lab animations, embedded Film Room and Accolades. End-of-year commendations are informal browser-based votes; staff decide official awards.

Staff Access uses the configured server PIN and an expiring signed cookie. Attendance, award creation/removal, coaching notes, lineup tracking, Log Game, Film Room catalogue editing and connection diagnostics unlock for coaches and volunteers together. Server permission checks enforce shared-record writes and private staff reads.

Staff publish YouTube, Instagram and Google Drive video links directly to Supabase from the Film Room. Viewers load shared clips without a GitHub push; the bundled JSON catalogue remains an offline seed/fallback. Existing device clip drafts can be restored and published from Catalogue Backup. Youth suggestions are shared through Challenges, with signed browser identity and a five-per-day limit. Google writes require a service account shared as Editor, with credentials in server-only Vercel variables. A Google metadata receipt protects game retries from duplicates.

Badges use SWISH statistics-based percentage thresholds. See [SETUP.md](SETUP.md) for the credential setup, connection test, vote limits and data methods.

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Vercel root directory: `clubhouse`. Database bootstrap: `supabase/schema.sql`; hosted updates: `supabase/migrations/`.


Player builds now use the reference's six team-relative attributes, a 40% best-three / 60% all-attribute blend, and a 60–95 OVR with shared tie ranks. Historical OVR is recalculated from dated records under formula v2, with year, game-date and historical division views; undated records stay in career totals only. Participation badges are separate from percentile-earned performance badges. The ten-segment court defaults to observed accuracy colours even for sparse logged shots; small samples are labelled. Relative hot/cold mode needs five own attempts and ten other-teammate attempts. Shot-share mode visualises volume. Usage estimates require complete matching box scores; time-adjusted USG also requires all participants' minutes and an explicit 5v5/3v3 format. The expanded usage scatterplot switches between team play share and USG%, and points per game and efficiency. Bubble area reflects matching-game PPG. Qualitative NBA/FIBA film launchpads use the six attributes, with shot-diet and spatial context when sufficient real logs exist. All calculations follow the shared year/division window.

Existing databases: apply `supabase/film-suggestions.sql` to expand film providers/shelves and create the private suggestions table. This upgrade was applied to the connected hosted project.
