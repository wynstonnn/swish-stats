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

Fresh page loads start with Team Average, Career, all years and all divisions. Within a page, player and filter changes follow every tab and live refresh. The team placeholder uses team totals per match (official scores for points, complete participant boxes for other stats).

The usage explorer includes a roster-age cohort ladder, equally weighted player-average crosshairs, an assists axis, and personal same-game benchmarks. Expected scoring uses the other eligible teammates’ weighted points per used play; assist comparisons need complete minutes and assists and do not infer passing from usage. A conservative +2 percentage-point team-play-share trial needs three games, 20 used plays, at least 10% above peer scoring efficiency and no higher turnover share. It is a coach conversation, not a production forecast. Roster age cohorts are derived server-side from named Age/Birth Year fields; unknown ages stay Unrecorded and underlying personal columns remain private. These cohorts do not rewrite historical game divisions.

Twenty 2K-inspired SWISH build definitions have info explanations and three study examples each. Four strength launchpads can be shown from the expanded NBA/FIBA library, plus a separate development example where available. These labels are coaching roles, not official NBA 2K attribute unlock rules.

Game logging accepts total FGM/FGA plus 3PM/3PA. Read-only 2PM/2PA are calculated by subtraction on the client and validated/derived again on the server before the atomic spreadsheet write. Unknown optional shooting stays unknown; enter 0/0 explicitly for a recorded zero. Existing drafts with the older two/three split migrate to total field goals automatically.
