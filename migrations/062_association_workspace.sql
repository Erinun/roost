-- 062_association_workspace.sql
-- Föreningsarbetsyta + Medlemsportal: föreningar, möten, beslut, uppgifter,
-- dokument, kommunikation, aktiviteter, nyheter, medlemsfrågor.

-- ============ ENUMS ============
CREATE TYPE association_role AS ENUM ('admin', 'internal', 'member');
CREATE TYPE meeting_status AS ENUM ('planned', 'held', 'cancelled');
CREATE TYPE association_task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE member_news_status AS ENUM ('draft', 'published');
CREATE TYPE member_question_status AS ENUM ('open', 'answered', 'closed');

-- ============ TABELLER ============
CREATE TABLE associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description TEXT,
    contact_info TEXT,
    avatar_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE association_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role association_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (association_id, user_id)
);
CREATE INDEX idx_association_members_assoc ON association_members(association_id);
CREATE INDEX idx_association_members_user ON association_members(user_id);

CREATE TABLE association_workgroups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    description TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_association_workgroups_assoc ON association_workgroups(association_id);

CREATE TABLE workgroup_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workgroup_id UUID NOT NULL REFERENCES association_workgroups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workgroup_id, user_id)
);

CREATE TABLE association_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    workgroup_id UUID REFERENCES association_workgroups(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    agenda TEXT,
    minutes TEXT,
    meeting_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    status meeting_status NOT NULL DEFAULT 'planned',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_association_meetings_assoc ON association_meetings(association_id, meeting_date DESC);

CREATE TABLE meeting_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES association_meetings(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (char_length(description) >= 2),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meeting_decisions_meeting ON meeting_decisions(meeting_id);

CREATE TABLE association_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    workgroup_id UUID REFERENCES association_workgroups(id) ON DELETE SET NULL,
    decision_id UUID REFERENCES meeting_decisions(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    description TEXT,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    status association_task_status NOT NULL DEFAULT 'todo',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_association_tasks_assoc ON association_tasks(association_id, status);
CREATE INDEX idx_association_tasks_assignee ON association_tasks(assignee_id);

CREATE TABLE association_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    workgroup_id UUID REFERENCES association_workgroups(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_association_documents_assoc ON association_documents(association_id);

CREATE TABLE association_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    parent_post_id UUID REFERENCES association_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_association_posts_assoc ON association_posts(association_id, created_at DESC);
CREATE INDEX idx_association_posts_parent ON association_posts(parent_post_id);

CREATE TABLE association_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_association_activities_assoc ON association_activities(association_id, starts_at);

CREATE TABLE activity_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES association_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (activity_id, user_id)
);

CREATE TABLE member_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    content TEXT NOT NULL CHECK (char_length(content) >= 1),
    status member_news_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_member_news_assoc ON member_news(association_id, status, published_at DESC);

CREATE TABLE member_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 200),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
    status member_question_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_member_questions_assoc ON member_questions(association_id, status);
CREATE INDEX idx_member_questions_author ON member_questions(author_id);

CREATE TABLE member_question_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES member_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_member_question_replies_q ON member_question_replies(question_id);

-- ============ UPDATED_AT-TRIGGRAR ============
CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON associations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_association_meetings_updated_at BEFORE UPDATE ON association_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_association_tasks_updated_at BEFORE UPDATE ON association_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_association_posts_updated_at BEFORE UPDATE ON association_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_association_activities_updated_at BEFORE UPDATE ON association_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_news_updated_at BEFORE UPDATE ON member_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_questions_updated_at BEFORE UPDATE ON member_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ HJÄLPFUNKTIONER ============
-- Mönster enligt befintliga RLS-hjälpare (is_platform_admin, is_group_member):
-- SECURITY DEFINER + SET search_path = public med okvalificerade tabellnamn.
CREATE OR REPLACE FUNCTION public.is_association_admin(assoc_id UUID, user_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM association_members
        WHERE association_id = assoc_id AND user_id = user_uuid AND role = 'admin'
    ) OR is_platform_admin(user_uuid);
$$;

CREATE OR REPLACE FUNCTION public.is_association_internal(assoc_id UUID, user_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM association_members
        WHERE association_id = assoc_id AND user_id = user_uuid AND role IN ('admin', 'internal')
    ) OR is_platform_admin(user_uuid);
$$;

CREATE OR REPLACE FUNCTION public.is_association_member(assoc_id UUID, user_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM association_members
        WHERE association_id = assoc_id AND user_id = user_uuid
    ) OR is_platform_admin(user_uuid);
$$;

-- 060 drog in default-EXECUTE for nya funktioner (ALTER DEFAULT PRIVILEGES ...
-- REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC). RLS-policies evalueras som den
-- fragande anvandarens roll, sa authenticated behover EXECUTE explicit —
-- samma monster som 060:s grants for RLS-hjalpare. service_role behaller
-- EXECUTE for backend, i linje med 060.
GRANT EXECUTE ON FUNCTION public.is_association_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_association_internal(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_association_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_association_admin(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_association_internal(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_association_member(UUID, UUID) TO service_role;

-- ============ RLS ============
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_workgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workgroup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_question_replies ENABLE ROW LEVEL SECURITY;

-- associations
CREATE POLICY "Members can view their associations" ON associations FOR SELECT
    USING (is_association_member(id, auth.uid()));
CREATE POLICY "Platform admins can create associations" ON associations FOR INSERT
    WITH CHECK (auth.uid() = created_by AND is_platform_admin(auth.uid()));
CREATE POLICY "Association admins can update" ON associations FOR UPDATE
    USING (is_association_admin(id, auth.uid()));
CREATE POLICY "Platform admins can delete associations" ON associations FOR DELETE
    USING (is_platform_admin(auth.uid()));

-- association_members
CREATE POLICY "Members can view association members" ON association_members FOR SELECT
    USING (is_association_member(association_id, auth.uid()));
CREATE POLICY "Association admins manage members (insert)" ON association_members FOR INSERT
    WITH CHECK (is_association_admin(association_id, auth.uid()));
CREATE POLICY "Association admins manage members (update)" ON association_members FOR UPDATE
    USING (is_association_admin(association_id, auth.uid()));
CREATE POLICY "Association admins manage members (delete)" ON association_members FOR DELETE
    USING (is_association_admin(association_id, auth.uid()));

-- Interna arbetsyte-tabeller
CREATE POLICY "Internal can view workgroups" ON association_workgroups FOR SELECT
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Internal can create workgroups" ON association_workgroups FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Admins can update workgroups" ON association_workgroups FOR UPDATE
    USING (is_association_admin(association_id, auth.uid()) OR auth.uid() = created_by);
CREATE POLICY "Admins can delete workgroups" ON association_workgroups FOR DELETE
    USING (is_association_admin(association_id, auth.uid()) OR auth.uid() = created_by);

CREATE POLICY "Internal can view workgroup members" ON workgroup_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM association_workgroups wg
        WHERE wg.id = workgroup_id AND is_association_internal(wg.association_id, auth.uid())));
CREATE POLICY "Internal can add workgroup members" ON workgroup_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM association_workgroups wg
        WHERE wg.id = workgroup_id AND is_association_internal(wg.association_id, auth.uid())));
CREATE POLICY "Internal can remove workgroup members" ON workgroup_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM association_workgroups wg
        WHERE wg.id = workgroup_id AND is_association_internal(wg.association_id, auth.uid())));

CREATE POLICY "Internal can view meetings" ON association_meetings FOR SELECT
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Internal can create meetings" ON association_meetings FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Internal can update meetings" ON association_meetings FOR UPDATE
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Creator or admin can delete meetings" ON association_meetings FOR DELETE
    USING (auth.uid() = created_by OR is_association_admin(association_id, auth.uid()));

CREATE POLICY "Internal can view decisions" ON meeting_decisions FOR SELECT
    USING (EXISTS (SELECT 1 FROM association_meetings m
        WHERE m.id = meeting_id AND is_association_internal(m.association_id, auth.uid())));
CREATE POLICY "Internal can create decisions" ON meeting_decisions FOR INSERT
    WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM association_meetings m
        WHERE m.id = meeting_id AND is_association_internal(m.association_id, auth.uid())));
CREATE POLICY "Creator or admin can delete decisions" ON meeting_decisions FOR DELETE
    USING (EXISTS (SELECT 1 FROM association_meetings m
        WHERE m.id = meeting_id AND (auth.uid() = meeting_decisions.created_by
            OR is_association_admin(m.association_id, auth.uid()))));

CREATE POLICY "Internal can view tasks" ON association_tasks FOR SELECT
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Internal can create tasks" ON association_tasks FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Internal can update tasks" ON association_tasks FOR UPDATE
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Creator or admin can delete tasks" ON association_tasks FOR DELETE
    USING (auth.uid() = created_by OR is_association_admin(association_id, auth.uid()));

CREATE POLICY "Internal can view documents" ON association_documents FOR SELECT
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Internal can upload documents" ON association_documents FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = uploaded_by);
CREATE POLICY "Uploader or admin can delete documents" ON association_documents FOR DELETE
    USING (auth.uid() = uploaded_by OR is_association_admin(association_id, auth.uid()));

CREATE POLICY "Internal can view posts" ON association_posts FOR SELECT
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Internal can create posts" ON association_posts FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "Author can update posts" ON association_posts FOR UPDATE
    USING (auth.uid() = author_id);
CREATE POLICY "Author or admin can delete posts" ON association_posts FOR DELETE
    USING (auth.uid() = author_id OR is_association_admin(association_id, auth.uid()));

-- Aktiviteter: internt full åtkomst; medlemmar ser endast publicerade
CREATE POLICY "Internal or members view activities" ON association_activities FOR SELECT
    USING (is_association_internal(association_id, auth.uid())
        OR (is_published = TRUE AND is_association_member(association_id, auth.uid())));
CREATE POLICY "Internal can create activities" ON association_activities FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Internal can update activities" ON association_activities FOR UPDATE
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Creator or admin can delete activities" ON association_activities FOR DELETE
    USING (auth.uid() = created_by OR is_association_admin(association_id, auth.uid()));

-- Anmälningar
CREATE POLICY "Own or internal view signups" ON activity_signups FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM association_activities a
        WHERE a.id = activity_id AND is_association_internal(a.association_id, auth.uid())));
CREATE POLICY "Members can sign up" ON activity_signups FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM association_activities a
        WHERE a.id = activity_id AND a.is_published = TRUE
        AND is_association_member(a.association_id, auth.uid())));
CREATE POLICY "Users can cancel own signup" ON activity_signups FOR DELETE
    USING (auth.uid() = user_id);

-- Nyheter
CREATE POLICY "Internal or members view news" ON member_news FOR SELECT
    USING (is_association_internal(association_id, auth.uid())
        OR (status = 'published' AND is_association_member(association_id, auth.uid())));
CREATE POLICY "Internal can create news" ON member_news FOR INSERT
    WITH CHECK (is_association_internal(association_id, auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Internal can update news" ON member_news FOR UPDATE
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Creator or admin can delete news" ON member_news FOR DELETE
    USING (auth.uid() = created_by OR is_association_admin(association_id, auth.uid()));

-- Medlemsfrågor
CREATE POLICY "Author or internal view questions" ON member_questions FOR SELECT
    USING (auth.uid() = author_id OR is_association_internal(association_id, auth.uid()));
CREATE POLICY "Members can ask questions" ON member_questions FOR INSERT
    WITH CHECK (auth.uid() = author_id AND is_association_member(association_id, auth.uid()));
CREATE POLICY "Internal can update question status" ON member_questions FOR UPDATE
    USING (is_association_internal(association_id, auth.uid()));
CREATE POLICY "Author can delete own question" ON member_questions FOR DELETE
    USING (auth.uid() = author_id);

CREATE POLICY "Participants view replies" ON member_question_replies FOR SELECT
    USING (EXISTS (SELECT 1 FROM member_questions q WHERE q.id = question_id
        AND (q.author_id = auth.uid() OR is_association_internal(q.association_id, auth.uid()))));
CREATE POLICY "Participants can reply" ON member_question_replies FOR INSERT
    WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM member_questions q
        WHERE q.id = question_id
        AND (q.author_id = auth.uid() OR is_association_internal(q.association_id, auth.uid()))));
