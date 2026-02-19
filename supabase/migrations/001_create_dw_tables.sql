-- Migration 001: Create dw_events and dw_photos tables for d-w.pl
-- Kalendarium Południowej Wielkopolski

-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Historical events table
CREATE TABLE IF NOT EXISTS dw_events (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  event_date VARCHAR(10) NOT NULL,  -- format: "YYYY-MM-DD" matching original MySQL
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for date-based lookup (main query: WHERE event_date LIKE '%-MM-DD')
CREATE INDEX IF NOT EXISTS idx_dw_events_date ON dw_events(event_date);

-- Trigram index for full-text search
CREATE INDEX IF NOT EXISTS idx_dw_events_desc_trgm ON dw_events USING gin (description gin_trgm_ops);

-- Event photos table
CREATE TABLE IF NOT EXISTS dw_photos (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES dw_events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dw_photos_event_id ON dw_photos(event_id);

-- Enable Row Level Security
ALTER TABLE dw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw_photos ENABLE ROW LEVEL SECURITY;

-- Public read access (calendar is publicly accessible)
CREATE POLICY "dw_events_public_read" ON dw_events FOR SELECT USING (true);
CREATE POLICY "dw_photos_public_read" ON dw_photos FOR SELECT USING (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_dw_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dw_events_updated_at
  BEFORE UPDATE ON dw_events
  FOR EACH ROW
  EXECUTE FUNCTION update_dw_events_updated_at();
