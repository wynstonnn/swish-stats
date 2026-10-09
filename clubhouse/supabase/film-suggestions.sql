-- Upgrade existing installations; shared writes go through staff-checked Vercel APIs.
ALTER TABLE public.films DROP CONSTRAINT IF EXISTS films_provider_check;
ALTER TABLE public.films ADD CONSTRAINT films_provider_check CHECK(provider IN ('youtube','instagram','drive'));
ALTER TABLE public.films DROP CONSTRAINT IF EXISTS films_category_check;
ALTER TABLE public.films ADD CONSTRAINT films_category_check CHECK(category IN ('Skills Library','5 On 5 Plays','3 On 3 Plays','Game Footage','Skills library','Our game footage'));
CREATE TABLE IF NOT EXISTS public.suggestions (
 id text PRIMARY KEY,
 device_id text NOT NULL,
 player text NOT NULL,
 category text NOT NULL CHECK(category IN ('Drill','Skill','Play','Film')),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 500),
 created text NOT NULL
);
CREATE INDEX IF NOT EXISTS suggestions_created_idx ON public.suggestions(created DESC);
CREATE INDEX IF NOT EXISTS suggestions_device_created_idx ON public.suggestions(device_id,created);
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.suggestions FROM anon,authenticated;
