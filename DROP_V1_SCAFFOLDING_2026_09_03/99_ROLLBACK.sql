-- DROP V1 SCAFFOLDING · 99_ROLLBACK
--
-- Reverses every stage that has run, in reverse order (80 -> 10). Each section
-- is independently guarded and idempotent: a stage that never ran, or has
-- already been rolled back, is skipped with a notice.
--
-- Requires the 05_BACKUP tables to still exist. If you have already dropped
-- them, this file can do nothing - that is why the README says keep them.
--
-- --------------------------------------------------------- what comes back exactly
--   * All 12 function definitions, byte-for-byte, from pg_get_functiondef text.
--   * The trigger trig_seed_first_topic, byte-for-byte.
--   * Every RLS policy, from captured CREATE POLICY text.
--   * Every table grant, from captured GRANT text.
--   * Every row of all five tables, and all 51 achievements.course_id values.
--   * The four badges rows.
--   * All columns, defaults, primary keys, unique constraints, indexes and
--     foreign keys, written out longhand below from the live catalog.
--
-- ------------------------------------------------------------ what does NOT come back
--   * `glossary_course_id_fkey`. If REMOVE_V1_REMNANTS stage 50 has already run,
--     glossary.course_id is gone and that constraint is that package's rollback
--     to restore, not this one's. If you ran stage 80 here first, that package's
--     rollback will restore the column and its 3,660 values but must skip the
--     constraint - it says so when it does.
--   * Object OIDs, and therefore anything keyed on them outside the catalog.
--   * Table-level COMMENTs, if any existed (none did on these five).

BEGIN;

-- ============================================================ ROLLBACK OF STAGE 80
DO $r80$
BEGIN
  IF to_regclass('public.courses') IS NOT NULL THEN
    RAISE NOTICE 'stage 80: courses already present - skipped';
  ELSIF to_regclass('public.v1scaffold_courses_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 80 rollback impossible: the courses backup is gone';
  ELSE
    CREATE TABLE public.courses (
      id                    uuid NOT NULL DEFAULT gen_random_uuid(),
      curriculum_version_id uuid,
      code                  text NOT NULL,
      name                  text NOT NULL,
      sequence              integer NOT NULL,
      achievement_count     integer NOT NULL,
      color_hex             text,
      is_mvp                boolean DEFAULT false,
      CONSTRAINT courses_pkey PRIMARY KEY (id),
      CONSTRAINT courses_curriculum_version_id_code_key UNIQUE (curriculum_version_id, code),
      CONSTRAINT courses_curriculum_version_id_fkey
        FOREIGN KEY (curriculum_version_id) REFERENCES public.curriculum_versions(id)
    );
    CREATE INDEX idx_courses_version ON public.courses USING btree (curriculum_version_id);
    INSERT INTO public.courses SELECT * FROM public.v1scaffold_courses_backup_20260903;
    ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'stage 80 rolled back: courses restored with % rows',
      (SELECT count(*) FROM public.courses);
  END IF;
END $r80$;

-- ============================================================ ROLLBACK OF STAGE 70
DO $r70$
BEGIN
  IF to_regclass('public.course_sections') IS NOT NULL THEN
    RAISE NOTICE 'stage 70: course_sections already present - skipped';
  ELSIF to_regclass('public.v1scaffold_course_sections_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 70 rollback impossible: the course_sections backup is gone';
  ELSIF to_regclass('public.courses') IS NULL THEN
    RAISE EXCEPTION 'stage 70 rollback blocked: restore courses first (stage 80 section above)';
  ELSE
    CREATE TABLE public.course_sections (
      id         uuid NOT NULL DEFAULT gen_random_uuid(),
      course_id  uuid NOT NULL,
      label      text NOT NULL,
      semester   text,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT course_sections_pkey PRIMARY KEY (id),
      CONSTRAINT course_sections_course_id_label_semester_key UNIQUE (course_id, label, semester),
      CONSTRAINT course_sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
    );
    CREATE INDEX idx_course_sections_course ON public.course_sections USING btree (course_id);
    INSERT INTO public.course_sections SELECT * FROM public.v1scaffold_course_sections_backup_20260903;
    ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'stage 70 rolled back: course_sections restored with % rows',
      (SELECT count(*) FROM public.course_sections);
  END IF;

  IF to_regclass('public.instructor_sections') IS NOT NULL THEN
    RAISE NOTICE 'stage 70: instructor_sections already present - skipped';
  ELSIF to_regclass('public.v1scaffold_instructor_sections_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 70 rollback impossible: the instructor_sections backup is gone';
  ELSE
    CREATE TABLE public.instructor_sections (
      id            uuid NOT NULL DEFAULT gen_random_uuid(),
      instructor_id uuid NOT NULL,
      section_id    uuid NOT NULL,
      created_at    timestamptz DEFAULT now(),
      CONSTRAINT instructor_sections_pkey PRIMARY KEY (id),
      CONSTRAINT instructor_sections_instructor_id_section_id_key UNIQUE (instructor_id, section_id),
      CONSTRAINT instructor_sections_instructor_id_fkey
        FOREIGN KEY (instructor_id) REFERENCES public.users(id),
      CONSTRAINT instructor_sections_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.course_sections(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_instructor_sections_instructor ON public.instructor_sections USING btree (instructor_id);
    CREATE INDEX idx_instructor_sections_section    ON public.instructor_sections USING btree (section_id);
    INSERT INTO public.instructor_sections SELECT * FROM public.v1scaffold_instructor_sections_backup_20260903;
    ALTER TABLE public.instructor_sections ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'stage 70 rolled back: instructor_sections restored with % rows',
      (SELECT count(*) FROM public.instructor_sections);
  END IF;
END $r70$;

-- ============================================================ ROLLBACK OF STAGE 60
DO $r60$
BEGIN
  IF to_regclass('public.enrollment') IS NOT NULL THEN
    RAISE NOTICE 'stage 60: enrollment already present - skipped';
  ELSIF to_regclass('public.v1scaffold_enrollment_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 60 rollback impossible: the enrollment backup is gone';
  ELSIF to_regclass('public.courses') IS NULL OR to_regclass('public.course_sections') IS NULL THEN
    RAISE EXCEPTION 'stage 60 rollback blocked: restore courses and course_sections first';
  ELSE
    CREATE TABLE public.enrollment (
      id                    uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id               uuid,
      course_id             uuid,
      curriculum_version_id uuid,
      enrolled_at           timestamptz DEFAULT now(),
      semester              text,
      section_id            uuid,
      CONSTRAINT enrollment_pkey PRIMARY KEY (id),
      CONSTRAINT enrollment_user_id_course_id_key UNIQUE (user_id, course_id),
      CONSTRAINT enrollment_user_id_fkey    FOREIGN KEY (user_id)    REFERENCES public.users(id),
      CONSTRAINT enrollment_course_id_fkey  FOREIGN KEY (course_id)  REFERENCES public.courses(id),
      CONSTRAINT enrollment_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.course_sections(id),
      CONSTRAINT enrollment_curriculum_version_id_fkey
        FOREIGN KEY (curriculum_version_id) REFERENCES public.curriculum_versions(id)
    );
    CREATE INDEX idx_enrollment_user         ON public.enrollment USING btree (user_id);
    CREATE INDEX idx_enrollment_section      ON public.enrollment USING btree (section_id);
    CREATE INDEX idx_enrollment_version      ON public.enrollment USING btree (curriculum_version_id);
    CREATE INDEX idx_enrollment_user_version ON public.enrollment USING btree (user_id, curriculum_version_id);
    INSERT INTO public.enrollment SELECT * FROM public.v1scaffold_enrollment_backup_20260903;
    ALTER TABLE public.enrollment ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'stage 60 rolled back: enrollment restored with % rows',
      (SELECT count(*) FROM public.enrollment);
  END IF;
END $r60$;

-- ============================================================ ROLLBACK OF STAGE 50
DO $r50$
DECLARE v_n int;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id') THEN
    RAISE NOTICE 'stage 50: achievements.course_id already present - skipped';
  ELSIF to_regclass('public.v1scaffold_ach_course_id_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 50 rollback impossible: the course_id backup is gone';
  ELSE
    ALTER TABLE public.achievements ADD COLUMN course_id uuid;
    UPDATE public.achievements a
       SET course_id = k.course_id
      FROM public.v1scaffold_ach_course_id_backup_20260903 k
     WHERE k.id = a.id;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    IF to_regclass('public.courses') IS NOT NULL THEN
      ALTER TABLE public.achievements
        ADD CONSTRAINT achievements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
      RAISE NOTICE 'stage 50 rolled back: % course_id values restored, FK recreated', v_n;
    ELSE
      RAISE WARNING 'stage 50 rolled back: % course_id values restored, but achievements_course_id_fkey was NOT recreated because public.courses does not exist. Restore courses (stage 80 section) and re-run this file to add it.', v_n;
    END IF;
  END IF;
END $r50$;

-- ============================================================ ROLLBACK OF STAGE 40
DO $r40$
BEGIN
  IF to_regclass('public.session_logs') IS NOT NULL THEN
    RAISE NOTICE 'stage 40: session_logs already present - skipped';
  ELSIF to_regclass('public.v1scaffold_session_logs_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 40 rollback impossible: the session_logs backup is gone';
  ELSIF to_regclass('public.courses') IS NULL THEN
    RAISE EXCEPTION 'stage 40 rollback blocked: session_logs_course_id_fkey needs courses. Restore it first.';
  ELSE
    CREATE TABLE public.session_logs (
      id          uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id     uuid,
      started_at  timestamptz DEFAULT now(),
      ended_at    timestamptz,
      course_id   uuid,
      device_info text,
      CONSTRAINT session_logs_pkey PRIMARY KEY (id),
      CONSTRAINT session_logs_user_id_fkey   FOREIGN KEY (user_id)   REFERENCES public.users(id),
      CONSTRAINT session_logs_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
    );
    INSERT INTO public.session_logs SELECT * FROM public.v1scaffold_session_logs_backup_20260903;
    ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'stage 40 rolled back: session_logs restored with % rows',
      (SELECT count(*) FROM public.session_logs);
  END IF;
END $r40$;

-- ====================================================== RLS + GRANTS FOR 40/60/70/80
-- Replayed from the captured text, after all five tables are back.
DO $rls$
DECLARE r record;
BEGIN
  IF to_regclass('public.v1scaffold_policy_backup_20260903') IS NULL THEN
    RAISE NOTICE 'no policy backup - skipping policy restore';
  ELSE
    FOR r IN SELECT tblname, polname, def FROM public.v1scaffold_policy_backup_20260903 LOOP
      IF to_regclass('public.'||quote_ident(r.tblname)) IS NULL THEN CONTINUE; END IF;
      IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
                 WHERE c.relname=r.tblname AND p.polname=r.polname) THEN CONTINUE; END IF;
      -- A policy naming is_instructor_for_user cannot be recreated until that
      -- function is back; the stage-20 section below runs first on a re-run.
      BEGIN
        EXECUTE r.def;
        RAISE NOTICE 'restored policy %.%', r.tblname, r.polname;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'could not restore policy %.% (%) - re-run this file after the function restore below', r.tblname, r.polname, SQLERRM;
      END;
    END LOOP;
  END IF;

  IF to_regclass('public.v1scaffold_grant_backup_20260903') IS NULL THEN
    RAISE NOTICE 'no grant backup - skipping grant restore';
  ELSE
    FOR r IN SELECT tblname, def FROM public.v1scaffold_grant_backup_20260903 LOOP
      IF to_regclass('public.'||quote_ident(r.tblname)) IS NULL THEN CONTINUE; END IF;
      BEGIN EXECUTE r.def; EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'could not restore grant on % (%)', r.tblname, SQLERRM; END;
    END LOOP;
  END IF;
END $rls$;

-- ============================================================ ROLLBACK OF STAGE 30
DO $r30$
BEGIN
  IF to_regclass('public.v1scaffold_badges_backup_20260903') IS NULL THEN
    RAISE NOTICE 'stage 30: no badges backup - skipped';
  ELSIF (SELECT count(*) FROM public.badges) > 0 THEN
    RAISE NOTICE 'stage 30: badges is not empty - skipped';
  ELSE
    INSERT INTO public.badges SELECT * FROM public.v1scaffold_badges_backup_20260903;
    RAISE NOTICE 'stage 30 rolled back: % badges rows restored', (SELECT count(*) FROM public.badges);
  END IF;
END $r30$;

-- ============================================================ ROLLBACK OF STAGE 20
-- The five dropped functions, verbatim, then the trigger.
DO $r20$
DECLARE r record;
BEGIN
  IF to_regclass('public.v1scaffold_func_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 20 rollback impossible: the function backup is gone';
  END IF;
  FOR r IN SELECT identity, def FROM public.v1scaffold_func_backup_20260903 WHERE disposition='dropped' LOOP
    BEGIN
      EXECUTE r.def;
      RAISE NOTICE 'restored function %', r.identity;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'could not restore % (%) - it may depend on a table not yet restored', r.identity, SQLERRM;
    END;
  END LOOP;

  IF to_regclass('public.enrollment') IS NOT NULL
     AND to_regprocedure('public.seed_first_topic_on_enrollment()') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                     WHERE NOT t.tgisinternal AND c.relname='enrollment' AND t.tgname='trig_seed_first_topic') THEN
    FOR r IN SELECT def FROM public.v1scaffold_trigger_backup_20260903 WHERE tgname='trig_seed_first_topic' LOOP
      EXECUTE r.def;
      RAISE NOTICE 'restored trigger trig_seed_first_topic';
    END LOOP;
  END IF;
END $r20$;

-- ============================================================ ROLLBACK OF STAGE 10
-- The seven rewritten functions, verbatim, back to their pre-stage-10 bodies
-- (which are REMOVE_V1_REMNANTS stage 30's output for the two quiz functions).
DO $r10$
DECLARE r record;
BEGIN
  IF to_regclass('public.v1scaffold_func_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'stage 10 rollback impossible: the function backup is gone';
  END IF;
  FOR r IN SELECT identity, def FROM public.v1scaffold_func_backup_20260903 WHERE disposition='rewritten' LOOP
    BEGIN
      EXECUTE r.def;
      RAISE NOTICE 'restored function %', r.identity;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'could not restore % (%) - restore the tables it reads first, then re-run', r.identity, SQLERRM;
    END;
  END LOOP;
END $r10$;

COMMIT;

-- NOTE: if any policy or function restore emitted a WARNING above, run this
-- file a SECOND time. The second pass sees the objects the first pass created
-- and completes what it had to skip.

-- Read-back.
SELECT 'courses'             AS object, CASE WHEN to_regclass('public.courses')             IS NULL THEN 'ABSENT' ELSE 'RESTORED' END AS state
UNION ALL SELECT 'enrollment',          CASE WHEN to_regclass('public.enrollment')          IS NULL THEN 'ABSENT' ELSE 'RESTORED' END
UNION ALL SELECT 'course_sections',     CASE WHEN to_regclass('public.course_sections')     IS NULL THEN 'ABSENT' ELSE 'RESTORED' END
UNION ALL SELECT 'instructor_sections', CASE WHEN to_regclass('public.instructor_sections') IS NULL THEN 'ABSENT' ELSE 'RESTORED' END
UNION ALL SELECT 'session_logs',        CASE WHEN to_regclass('public.session_logs')        IS NULL THEN 'ABSENT' ELSE 'RESTORED' END
UNION ALL SELECT 'achievements.course_id',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
       THEN 'RESTORED' ELSE 'ABSENT' END
UNION ALL SELECT 'achievements_course_id_fkey',
  CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname='achievements_course_id_fkey')
       THEN 'RESTORED' ELSE 'ABSENT' END
UNION ALL SELECT 'functions restored (expect 12)',
  (SELECT count(*)::text FROM public.v1scaffold_func_backup_20260903 b
   WHERE to_regprocedure('public.'||b.identity) IS NOT NULL)
UNION ALL SELECT 'badges rows', (SELECT count(*)::text FROM public.badges);
