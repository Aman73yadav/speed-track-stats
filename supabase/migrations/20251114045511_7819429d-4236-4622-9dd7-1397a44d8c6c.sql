-- Create events_queue table for fast ingestion
CREATE TABLE IF NOT EXISTS public.events_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick processing queries
CREATE INDEX IF NOT EXISTS idx_events_queue_processed ON public.events_queue(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_events_queue_created ON public.events_queue(created_at);

-- Create processed events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_site_id ON public.events(site_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_site_timestamp ON public.events(site_id, timestamp);

-- Create daily aggregated stats table for fast reporting
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  path_stats JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, date)
);

-- Create index for quick stat lookups
CREATE INDEX IF NOT EXISTS idx_daily_stats_site_date ON public.daily_stats(site_id, date);

-- Enable RLS
ALTER TABLE public.events_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Public access policies for the ingestion API (called from edge functions)
CREATE POLICY "Allow public insert to events_queue" 
  ON public.events_queue 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role to manage events_queue" 
  ON public.events_queue 
  FOR ALL 
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to manage events" 
  ON public.events 
  FOR ALL 
  TO service_role
  USING (true);

CREATE POLICY "Allow public read on events" 
  ON public.events 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role to manage daily_stats" 
  ON public.daily_stats 
  FOR ALL 
  TO service_role
  USING (true);

CREATE POLICY "Allow public read on daily_stats" 
  ON public.daily_stats 
  FOR SELECT 
  TO anon, authenticated
  USING (true);