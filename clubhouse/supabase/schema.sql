-- Run in Supabase SQL Editor. Additive: existing legacy tables are left intact.
-- Browsers have no direct table access. Every write passes the Vercel backend.
CREATE TABLE IF NOT EXISTS observations (id text PRIMARY KEY,player text NOT NULL,category text NOT NULL,body text NOT NULL,author text NOT NULL,created text NOT NULL);
CREATE TABLE IF NOT EXISTS dataset (id text PRIMARY KEY,raw text NOT NULL,name text NOT NULL,blob_key text NOT NULL,revision integer NOT NULL DEFAULT 1,author text NOT NULL,updated text NOT NULL);
CREATE TABLE IF NOT EXISTS game_submissions (id uuid PRIMARY KEY,payload_hash text NOT NULL,status text NOT NULL CHECK(status IN ('pending','complete')),author text NOT NULL,created text NOT NULL,updated text NOT NULL);
CREATE TABLE IF NOT EXISTS pin_attempts (id text PRIMARY KEY,attempts integer NOT NULL,reset_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS check_ins (id text PRIMARY KEY,title text NOT NULL,date text NOT NULL,kind text NOT NULL CHECK(kind IN ('Volunteering session','Match')),names text NOT NULL,revision integer NOT NULL DEFAULT 1,created text NOT NULL);
CREATE TABLE IF NOT EXISTS films (id text PRIMARY KEY,title text NOT NULL,url text NOT NULL,provider text NOT NULL CHECK(provider IN ('youtube','instagram')),category text NOT NULL CHECK(category IN ('Skills library','Our game footage')),cue text NOT NULL DEFAULT '',created text NOT NULL);
CREATE TABLE IF NOT EXISTS awards (id text PRIMARY KEY,player text NOT NULL,title text NOT NULL,season text NOT NULL,event_key text NOT NULL,reason text NOT NULL DEFAULT '',awarded text NOT NULL,UNIQUE(player,title,season,event_key));
CREATE TABLE IF NOT EXISTS predictions (id text PRIMARY KEY,device_id text NOT NULL,player text NOT NULL,date text NOT NULL,opponent text NOT NULL,metrics text NOT NULL,created text NOT NULL,UNIQUE(device_id,player,date,opponent));
CREATE TABLE IF NOT EXISTS lineup_stints (id text PRIMARY KEY,game_id text NOT NULL,players text NOT NULL,period integer NOT NULL CHECK(period BETWEEN 1 AND 10),start_clock integer NOT NULL,end_clock integer NOT NULL CHECK(end_clock>=0 AND end_clock<start_clock),start_for integer NOT NULL,start_against integer NOT NULL,end_for integer NOT NULL CHECK(end_for>=start_for),end_against integer NOT NULL CHECK(end_against>=start_against),poss_for integer,poss_against integer,note text NOT NULL DEFAULT '',created text NOT NULL);
CREATE INDEX IF NOT EXISTS check_ins_date ON check_ins(date DESC);
CREATE INDEX IF NOT EXISTS predictions_device ON predictions(device_id,date DESC);
CREATE INDEX IF NOT EXISTS awards_player ON awards(player);
CREATE INDEX IF NOT EXISTS lineup_game_period ON lineup_stints(game_id,period,start_clock,end_clock);
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_stints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON observations,dataset,game_submissions,pin_attempts,check_ins,films,awards,predictions,lineup_stints FROM anon,authenticated;
