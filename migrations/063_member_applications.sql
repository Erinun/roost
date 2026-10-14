-- =============================================================
-- 063: Medlemsansökningar till medlemsportalen
-- Besökare utan konto ansöker via publikt formulär i portalen
-- (anon INSERT). Föreningens admins granskar i arbetsytans flik
-- "Ansökningar" och notifieras via notiser + mejlkön.
-- =============================================================

-- Nytt notistypvärde för ansökningsnotiser till föreningens admins
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'member_application';

CREATE TABLE member_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    email TEXT NOT NULL CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 30),
    message TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    handled_at TIMESTAMPTZ,
    handled_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- En pågående ansökan per e-postadress och förening
CREATE UNIQUE INDEX member_applications_pending_unique
    ON member_applications (association_id, lower(email))
    WHERE status = 'pending';

CREATE INDEX member_applications_assoc_status_idx
    ON member_applications (association_id, status, created_at DESC);

ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;

-- Utloggade besökare i portalen får skicka in väntande ansökningar.
-- Inget RETURNING i klienten, därför behövs ingen SELECT-policy för anon.
CREATE POLICY member_applications_insert ON member_applications
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending' AND handled_at IS NULL AND handled_by IS NULL);

-- Föreningens admins (eller plattformsadmin) läser och uppdaterar
CREATE POLICY member_applications_select ON member_applications
    FOR SELECT TO authenticated
    USING (is_association_admin(association_id, auth.uid()));

CREATE POLICY member_applications_update ON member_applications
    FOR UPDATE TO authenticated
    USING (is_association_admin(association_id, auth.uid()))
    WITH CHECK (is_association_admin(association_id, auth.uid()));

-- Publik föreningslista (endast id + namn) för formulärets dropdown
CREATE OR REPLACE FUNCTION public.list_associations_public()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT id, name FROM associations ORDER BY name;
$$;

REVOKE ALL ON FUNCTION public.list_associations_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_associations_public() TO anon;
GRANT EXECUTE ON FUNCTION public.list_associations_public() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_associations_public() TO service_role;

-- Notisa föreningens admins (notis + mejlkö) när en ansökan kommer in
CREATE OR REPLACE FUNCTION public.notify_member_application()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, email_pending)
    SELECT am.user_id,
           'member_application',
           'Ny medlemsansökan',
           NEW.name || ' har ansökt om medlemskap i ' || a.name || '.',
           '/associations/' || a.slug || '/applications',
           TRUE
    FROM association_members am
    JOIN associations a ON a.id = NEW.association_id
    WHERE am.association_id = NEW.association_id
      AND am.role = 'admin';
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_member_application() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER member_applications_notify
    AFTER INSERT ON member_applications
    FOR EACH ROW EXECUTE FUNCTION public.notify_member_application();
