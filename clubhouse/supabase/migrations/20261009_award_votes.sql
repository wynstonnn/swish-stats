CREATE TABLE IF NOT EXISTS public.award_votes (
 id text PRIMARY KEY, device_id text NOT NULL, player text NOT NULL,
 title text NOT NULL, season text NOT NULL, reason text NOT NULL DEFAULT '',
 created text NOT NULL, updated text NOT NULL,
 UNIQUE(device_id,title,season)
);
CREATE INDEX IF NOT EXISTS award_votes_season_player_idx ON public.award_votes(season,player,title);
ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.award_votes FROM anon, authenticated;
