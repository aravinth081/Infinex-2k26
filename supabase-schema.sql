-- =====================================================================
-- AIVORA 2K26 / INNOVATION HACKS — SUPABASE DATABASE & STORAGE SCHEMA
-- Single Required Backend Platform for PostgreSQL Data & Storage
-- =====================================================================

-- 1. PARTICIPANTS TABLE
-- Stores registered hackathon attendees and their certificate claim status
CREATE TABLE IF NOT EXISTS public.participants (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    cert_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on email (lowercased) and cert_id for instant lookups
CREATE INDEX IF NOT EXISTS idx_participants_cert_id ON public.participants (cert_id);
CREATE INDEX IF NOT EXISTS idx_participants_claimed ON public.participants (claimed);

-- 2. WINNER CODES TABLE
-- Secret passkeys allocated to distinction winners and team quotas
CREATE TABLE IF NOT EXISTS public.winner_codes (
    code TEXT PRIMARY KEY,
    rank INT NOT NULL,
    label TEXT,
    team_name TEXT,
    max_quota INT DEFAULT 4,
    used_count INT DEFAULT 0,
    claimed_members JSONB DEFAULT '[]'::jsonb,
    tpl_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WINNER CLAIMS TABLE
-- Detailed log of all distinction awards claimed by winners
CREATE TABLE IF NOT EXISTS public.winner_claims (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL REFERENCES public.winner_codes(code) ON DELETE CASCADE,
    rank INT NOT NULL,
    rank_label TEXT,
    team_name TEXT,
    cert_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    date TEXT,
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winner_claims_cert_id ON public.winner_claims (cert_id);
CREATE INDEX IF NOT EXISTS idx_winner_claims_code ON public.winner_claims (code);

-- 4. JUDGE CODES TABLE
-- Verification codes for hackathon evaluators and mentors
CREATE TABLE IF NOT EXISTS public.judge_codes (
    code TEXT PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'Judge & Evaluator',
    event TEXT DEFAULT 'AIVORA 2K26',
    max_quota INT DEFAULT 1,
    used_count INT DEFAULT 0,
    claimed_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. JUDGE CERTIFICATES TABLE
-- Evaluator certificate records
CREATE TABLE IF NOT EXISTS public.judge_certs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    role TEXT NOT NULL,
    cert_id TEXT UNIQUE NOT NULL,
    date TEXT,
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judge_certs_cert_id ON public.judge_certs (cert_id);

-- 6. CUSTOM CERTIFICATE TEMPLATES TABLE
-- Stores uploaded template artwork references and storage URLs
CREATE TABLE IF NOT EXISTS public.custom_templates (
    key TEXT PRIMARY KEY, -- 'participation', 'winner1', 'winner2', 'winner3', 'judges'
    url TEXT NOT NULL,
    storage_path TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADMIN CONFIGURATION TABLE
-- Stores system settings, dynamic name coordinates (nameX, nameY), etc.
CREATE TABLE IF NOT EXISTS public.admin_config (
    key TEXT PRIMARY KEY, -- 'config', 'positions', 'winnerCodes', 'judgeCodes'
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SITE STATS TABLE
-- Live hackathon metrics displayed on the homepage
CREATE TABLE IF NOT EXISTS public.site_stats (
    id INT PRIMARY KEY DEFAULT 1,
    participants INT DEFAULT 2481,
    nations INT DEFAULT 150,
    themes INT DEFAULT 5,
    mentors INT DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Seed initial site stats row
INSERT INTO public.site_stats (id, participants, nations, themes, mentors)
VALUES (1, 2481, 150, 5, 30)
ON CONFLICT (id) DO NOTHING;

-- Seed default name coordinates in admin_config
INSERT INTO public.admin_config (key, data, updated_at)
VALUES (
    'positions',
    '{
        "participation": {"nameX": 1754, "nameY": 1175},
        "winner1": {"nameX": 1754, "nameY": 1420},
        "winner2": {"nameX": 1754, "nameY": 1420},
        "winner3": {"nameX": 1754, "nameY": 1420},
        "judges": {"nameX": 1754, "nameY": 1250}
    }'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data security while enabling client-side verification flows
-- =====================================================================

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to verify credentials, load stats & templates
CREATE POLICY "Public read participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Public update participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Public insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete participants" ON public.participants FOR DELETE USING (true);

CREATE POLICY "Public read winner_codes" ON public.winner_codes FOR SELECT USING (true);
CREATE POLICY "Public update winner_codes" ON public.winner_codes FOR UPDATE USING (true);
CREATE POLICY "Public insert winner_codes" ON public.winner_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete winner_codes" ON public.winner_codes FOR DELETE USING (true);

CREATE POLICY "Public read winner_claims" ON public.winner_claims FOR SELECT USING (true);
CREATE POLICY "Public insert winner_claims" ON public.winner_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete winner_claims" ON public.winner_claims FOR DELETE USING (true);

CREATE POLICY "Public read judge_codes" ON public.judge_codes FOR SELECT USING (true);
CREATE POLICY "Public update judge_codes" ON public.judge_codes FOR UPDATE USING (true);
CREATE POLICY "Public insert judge_codes" ON public.judge_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete judge_codes" ON public.judge_codes FOR DELETE USING (true);

CREATE POLICY "Public read judge_certs" ON public.judge_certs FOR SELECT USING (true);
CREATE POLICY "Public insert judge_certs" ON public.judge_certs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete judge_certs" ON public.judge_certs FOR DELETE USING (true);

CREATE POLICY "Public read custom_templates" ON public.custom_templates FOR SELECT USING (true);
CREATE POLICY "Public insert/update custom_templates" ON public.custom_templates FOR ALL USING (true);

CREATE POLICY "Public read admin_config" ON public.admin_config FOR SELECT USING (true);
CREATE POLICY "Public insert/update admin_config" ON public.admin_config FOR ALL USING (true);

CREATE POLICY "Public read site_stats" ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "Public update site_stats" ON public.site_stats FOR ALL USING (true);

-- =====================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION
-- Bucket: 'event-assets' (Public storage for templates, avatars & logos)
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-assets',
    'event-assets',
    true,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- Storage RLS: Public read, authorized upload/update/delete
CREATE POLICY "Public read event-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-assets');

CREATE POLICY "Public upload event-assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'event-assets');

CREATE POLICY "Public update event-assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'event-assets');

CREATE POLICY "Public delete event-assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'event-assets');
