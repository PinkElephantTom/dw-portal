-- Migration 002: Admin users table + write policies for admin panel
-- Panel administracyjny D-W.PL

-- Admin users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS dw_admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'editor'
    CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dw_admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can see the admin users list
CREATE POLICY "admin_users_select" ON dw_admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

-- Only 'admin' role can manage other admin users
CREATE POLICY "admin_users_insert" ON dw_admin_users
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM dw_admin_users WHERE role = 'admin')
  );

CREATE POLICY "admin_users_update" ON dw_admin_users
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users WHERE role = 'admin')
  );

CREATE POLICY "admin_users_delete" ON dw_admin_users
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users WHERE role = 'admin')
  );

-- Write policies for dw_events (any admin/editor can insert and update)
CREATE POLICY "dw_events_admin_insert" ON dw_events
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_events_admin_update" ON dw_events
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

-- Only 'admin' role can delete events
CREATE POLICY "dw_events_admin_delete" ON dw_events
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users WHERE role = 'admin')
  );

-- Write policies for dw_photos
CREATE POLICY "dw_photos_admin_insert" ON dw_photos
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_photos_admin_update" ON dw_photos
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_photos_admin_delete" ON dw_photos
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );
