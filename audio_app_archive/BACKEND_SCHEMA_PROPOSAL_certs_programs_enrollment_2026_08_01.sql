-- CANDIDATE schema to persist programs / certificates / enrollment in the DB.
-- DO NOT RUN YET. Draft for review; final shape depends on ccode's export (§2 of the reconciliation request).
-- Grounded in existing tables: achievements, curriculum_versions, courses, entitlements, users.

------------------------------------------------------------------
-- 1) PROGRAMS  (expect 15 rows)
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id uuid REFERENCES curriculum_versions(id),
  slug                  text UNIQUE,
  name                  text NOT NULL,
  tier                  text,                 -- e.g. diploma / masters (per ccode)
  track                 text,                 -- e.g. Music / Audio (if used)
  description           text,
  sequence              integer,
  is_free               boolean NOT NULL DEFAULT false,
  price_cents           integer,              -- if pricing lives here; else keep in entitlements SSoT
  icon_url              text,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------
-- 2) CERTIFICATES  (expect 68 rows)
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id uuid REFERENCES curriculum_versions(id),
  program_id            uuid REFERENCES programs(id),   -- parent program (nullable if standalone L1)
  slug                  text UNIQUE,
  name                  text NOT NULL,
  level                 text,                 -- 'L1' | 'L2' | 'L3'
  track                 text,
  description           text,
  sequence              integer,
  requirements          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- quiz/study-gate/integrity thresholds
  icon_url              text,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------
-- 3) CERTIFICATE → TOPIC membership (which achievements a cert requires)
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_topics (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id),
  is_required    boolean NOT NULL DEFAULT true,
  seq            integer,
  UNIQUE (certificate_id, achievement_id)
);

------------------------------------------------------------------
-- 4) PROGRAM → CERTIFICATE membership (which certs make up a program)
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_certificates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  certificate_id uuid NOT NULL REFERENCES certificates(id),
  seq            integer,
  UNIQUE (program_id, certificate_id)
);

------------------------------------------------------------------
-- 5) CERTIFICATE PREREQUISITES (requisite/reminder topics, per retired-gating model)
--    Optional: could also derive from achievements.is_prerequisite. Explicit table is clearer.
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_prerequisites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  prereq_achievement_id uuid NOT NULL REFERENCES achievements(id),
  UNIQUE (certificate_id, prereq_achievement_id)
);

------------------------------------------------------------------
-- 6) ENROLLMENT reconciliation
-- The existing `enrollment` table is course-based (institutional: user+course+section+semester).
-- ccode built "My Enrollments" for programs/certs AND for free-with-account users.
-- Proposal: a polymorphic selection table that covers both audiences without disturbing
-- the institutional `enrollment` table. Confirm against ccode's actual model before creating.
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  target_type   text NOT NULL,               -- 'program' | 'certificate' | 'course' | 'topic'
  target_id     uuid NOT NULL,               -- id in the matching table (app enforces)
  audience      text NOT NULL DEFAULT 'member', -- 'member' | 'free'
  status        text NOT NULL DEFAULT 'active', -- active | completed | dropped
  selected_at   timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  UNIQUE (user_id, target_type, target_id)
);

-- OPEN QUESTIONS for ccode before running:
--  * Does a user enroll in PROGRAMS, CERTIFICATES, or both? (drives which target_types matter)
--  * Is pricing the source-of-truth here (programs.price_cents) or in entitlements? (avoid two SSoTs)
--  * Are the 4 existing `badges` the award side of certificates, or a separate concept?
--  * Should certificate prerequisites be a table (above) or stay on achievements.is_prerequisite?
--  * Do any existing user rows (enrollment/app-local) need migrating into user_enrollments?
