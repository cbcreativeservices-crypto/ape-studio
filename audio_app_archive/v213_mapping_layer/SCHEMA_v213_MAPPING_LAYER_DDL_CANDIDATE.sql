-- =====================================================================
-- SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql
-- Pro Audio Training Academy (AP&E) · Path B commercial mapping layer
-- STATUS: CANDIDATE — pending Prof. Booth PROD go-ahead. NOTHING DEPLOYED.
-- SOURCE OF TRUTH: PATH_B_MAPPING_LAYER_SCHEMA_2026_07_11_v1.md (DESIGN APPROVED)
-- TARGET: live project yjgolswjggmlpeowvtxr (SCHEMA v2.12 baseline)
-- PRINCIPLE: additive only. No academic table altered/renamed/overwritten.
--            Rollback = SCHEMA_v213_ROLLBACK_CANDIDATE.sql (single step).
-- APPLY: as ONE tracked migration (apply_migration wraps it in a transaction).
--        Do NOT add explicit BEGIN/COMMIT when using apply_migration.
-- COMPANION FILES: _SEED_ (run after this), _ROLLBACK_, _VERIFICATION_HARNESS_.
--
-- VERIFIED READ-ONLY AGAINST PROD 2026-07-11:
--   achievements = 51 rows, global_sequence 0..50, distinct.
--   glossary = 13 cols; common_mistakes is col 10 (ARRAY).
--   users.ape_student_id is NOT NULL (commercial gets a synthetic id).
--   No favorites table exists (favorites-migration payload is an OPEN ITEM).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. users.audience  (additive, default-safe: existing rows -> institutional)
-- ---------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'institutional';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_audience_chk' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_audience_chk CHECK (audience IN ('institutional','commercial'));
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. public_courses  (9 rows seeded by _SEED_ file)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_courses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  display_name text NOT NULL,
  sort_order   int  UNIQUE NOT NULL,
  description  text,                      -- Booth-authored marketing copy (seed NULL now)
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. public_course_topics  (54 rows: 51 primary + 3 cross_list; seeded by _SEED_)
--    achievement_id references the canonical achievements row (NEVER duplicated).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_course_topics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_course_id uuid NOT NULL REFERENCES public.public_courses(id) ON DELETE CASCADE,
  achievement_id   uuid NOT NULL REFERENCES public.achievements(id),
  placement        text NOT NULL CHECK (placement IN ('primary','cross_list')),
  seq              int  NOT NULL,              -- in-course order == commercial clamp sequence (D6 §1)
  is_free          boolean NOT NULL DEFAULT false,  -- data-driven free flag (Achv0 + gs36 = true)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (public_course_id, achievement_id),      -- no topic twice in one course
  UNIQUE (public_course_id, seq)                  -- unambiguous ordering
);

-- 3a. Integrity trigger: exactly one primary home per achievement across the whole table.
CREATE OR REPLACE FUNCTION public.validate_single_primary_home()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.placement = 'primary' THEN
    IF EXISTS (
      SELECT 1 FROM public.public_course_topics t
      WHERE t.achievement_id = NEW.achievement_id
        AND t.placement = 'primary'
        AND t.id <> NEW.id
    ) THEN
      RAISE EXCEPTION
        'validate_single_primary_home: achievement % already has a primary home', NEW.achievement_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_single_primary_home ON public.public_course_topics;
CREATE TRIGGER trg_single_primary_home
  BEFORE INSERT OR UPDATE ON public.public_course_topics
  FOR EACH ROW EXECUTE FUNCTION public.validate_single_primary_home();

-- ---------------------------------------------------------------------
-- 4. entitlements  (single all-9 'academy' entitlement; server/service_role writes only)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entitlements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product    text NOT NULL CHECK (product IN ('academy')),
  status     text NOT NULL CHECK (status IN ('active','lapsed','revoked')),
  source     text NOT NULL CHECK (source IN ('app_store','play_store','admin_grant','institutional')),
  expires_at timestamptz,
  store_ref  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
-- Self-read only. No INSERT/UPDATE/DELETE policy => authenticated cannot write (RLS default deny).
-- Writes happen via service_role (RevenueCat webhook edge fn) or admin_grant, which bypass RLS.
DROP POLICY IF EXISTS ent_self_read ON public.entitlements;
CREATE POLICY ent_self_read ON public.entitlements
  FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 5. has_academy_access(uid)  — SECURITY DEFINER entitlement helper
--    institutional users are implicitly academy-equivalent (D4/§2.1).
--    anon (uid NULL) -> false.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_academy_access(p_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_id = p_uid
      AND (
        u.audience = 'institutional'
        OR EXISTS (
          SELECT 1 FROM public.entitlements e
          WHERE e.user_id = u.id
            AND e.product = 'academy'
            AND e.status  = 'active'
            AND (e.expires_at IS NULL OR e.expires_at > now())
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public.has_academy_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_academy_access(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. ITEM-D FIX: server-gate glossary.common_mistakes (governance flag)
--    Before: authenticated held table-level SELECT (all 13 cols incl. common_mistakes),
--            so a free (non-academy) logged-in user could read it. anon had NO select.
--    After:  authenticated gets a 12-col grant EXCLUDING common_mistakes; the column is
--            reachable only through the academy-gated view glossary_full_v (masked to NULL
--            for non-academy). Enforced at the Postgres layer (AD-4).
--    *** CLIENT COORDINATION REQUIRED FOR PROD ***: GlossaryScreen must read common_mistakes
--        from public.glossary_full_v (not the base table) or the institutional app's query
--        will 403 on that column. Deploy to PROD only alongside the client release.
-- ---------------------------------------------------------------------
REVOKE SELECT ON public.glossary FROM authenticated;
GRANT SELECT (
  id, term, definition, plain_english, achievement_id, course_id,
  related_terms, category, difficulty, scenario_contexts,
  purpose_function, practical_application
) ON public.glossary TO authenticated;

CREATE OR REPLACE VIEW public.glossary_full_v AS
SELECT
  g.id, g.term, g.definition, g.plain_english, g.achievement_id, g.course_id,
  g.related_terms, g.category, g.difficulty, g.scenario_contexts,
  g.purpose_function, g.practical_application,
  CASE WHEN public.has_academy_access(auth.uid())
       THEN g.common_mistakes
       ELSE NULL
  END AS common_mistakes
FROM public.glossary g;
-- View runs with owner rights (security_invoker=false default) so it can read the base
-- column and apply the per-caller mask; auth.uid() still reflects the CALLER's JWT.
GRANT SELECT ON public.glossary_full_v TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. ANONYMOUS CATALOG BROWSE (C-4 / AD-3): read-only, no rows written by anon.
--    common_mistakes deliberately absent from every anon grant.
-- ---------------------------------------------------------------------
GRANT SELECT (
  id, term, definition, plain_english, achievement_id, course_id,
  related_terms, category, difficulty, scenario_contexts,
  purpose_function, practical_application
) ON public.glossary TO anon;

DROP POLICY IF EXISTS anon_read_glossary ON public.glossary;
CREATE POLICY anon_read_glossary ON public.glossary
  FOR SELECT TO anon USING (true);

GRANT SELECT ON public.glossary_topics    TO anon;
GRANT SELECT ON public.achievements       TO anon;   -- curriculum names/structure only; never questions/answers
GRANT SELECT ON public.public_courses     TO anon, authenticated;
GRANT SELECT ON public.public_course_topics TO anon, authenticated;

-- New catalog tables: RLS on + open read (no per-user data in them).
ALTER TABLE public.public_courses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_course_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pc_read  ON public.public_courses;
DROP POLICY IF EXISTS pct_read ON public.public_course_topics;
CREATE POLICY pc_read  ON public.public_courses       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pct_read ON public.public_course_topics FOR SELECT TO anon, authenticated USING (true);

-- glossary_topics / achievements: add anon read policy only if RLS is enabled on them.
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='glossary_topics') THEN
    DROP POLICY IF EXISTS anon_read_glossary_topics ON public.glossary_topics;
    CREATE POLICY anon_read_glossary_topics ON public.glossary_topics
      FOR SELECT TO anon USING (true);
  END IF;
  IF (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='achievements') THEN
    DROP POLICY IF EXISTS anon_read_achievements ON public.achievements;
    CREATE POLICY anon_read_achievements ON public.achievements
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 8. register_commercial_user(nickname, favorites)  RPC v1
--    Open self-signup: the client first calls supabase.auth.signUp (email+password),
--    then this RPC (as the new authenticated user) creates the app users row.
--    No enrollment, no claim code. audience='commercial'.
--    p_favorites: accepted for forward-compat; NOT persisted (no server favorites
--    table exists yet — OPEN ITEM). Client keeps favorites device-local for now.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_commercial_user(
  p_nickname  text,
  p_favorites jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_existing uuid;
  v_user_id  uuid;
  v_ape      text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('status','not_authenticated');
  END IF;

  IF p_nickname IS NULL OR length(btrim(p_nickname)) = 0 THEN
    RETURN jsonb_build_object('status','nickname_required');
  END IF;

  SELECT id INTO v_existing FROM public.users WHERE auth_id = v_uid;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_registered','user_id',v_existing);
  END IF;

  -- synthetic unique student id for commercial accounts (no class code path)
  LOOP
    v_ape := 'APE-C-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE ape_student_id = v_ape);
  END LOOP;

  INSERT INTO public.users(auth_id, ape_student_id, nickname, role, audience, registration_used)
  VALUES (v_uid, v_ape, btrim(p_nickname), 'student', 'commercial', true)
  RETURNING id INTO v_user_id;

  -- p_favorites intentionally not persisted (see OPEN ITEM above).

  RETURN jsonb_build_object(
    'status','ok',
    'user_id', v_user_id,
    'ape_student_id', v_ape,
    'audience','commercial'
  );
END $$;
REVOKE ALL ON FUNCTION public.register_commercial_user(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.register_commercial_user(text, jsonb) TO authenticated;

-- =====================================================================
-- END DDL. Run SCHEMA_v213_SEED_CANDIDATE.sql next, then the harness.
-- Post-apply: get_advisors (security) must show no new WARN beyond expected
-- anon-read entries; otherwise STOP (strategy report §6.4 edge-function fallback).
-- =====================================================================
