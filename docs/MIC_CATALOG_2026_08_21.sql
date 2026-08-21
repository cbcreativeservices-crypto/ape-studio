-- ============================================================================
-- Community Microphone Catalog — anonymous calibration contributions
-- Owner 2026-08-21. Plan: docs/CROWDSOURCED_MIC_CATALOG_PLAN_2026_08_21.md
--
-- Isolated from ALL user/account data: no user_id, no PII, no audio, no geo.
-- Clients (anon key) may INSERT contributions but can NEVER read the raw rows;
-- they read only the aggregated, privacy-safe `mic_catalog_public` view.
--
-- OWNER: run this in the Supabase SQL editor (same pattern as the other
-- docs/*.sql migrations). Safe to re-run (idempotent).
-- ============================================================================

create table if not exists public.mic_calibration_contributions (
  id               uuid primary key default gen_random_uuid(),
  -- Client-generated random id (dedup on re-upload). NOT an account id.
  contribution_id  uuid not null unique,
  -- { platform, model, osVersion, osBuild, appVersion, engineVersion,
  --   measurementGrade, inputPortType, profileVersion } — no identity.
  device_key       jsonb not null,
  device_key_hash  text generated always as (md5(device_key::text)) stored,
  offset_db        real not null,
  nominal_start    real,
  reference_quality text not null
    check (reference_quality in ('calibrator','type1_2_meter','consumer_app','eyeballed')),
  mic_info         jsonb,
  noise_floor_db   real,
  sample_rate      real,
  schema_version   int  not null default 1,
  created_at       timestamptz not null default now()
);

alter table public.mic_calibration_contributions enable row level security;

-- Clients may INSERT only, with sanity bounds. No SELECT/UPDATE/DELETE for
-- anon/authenticated — raw contributions are never client-readable.
grant insert on public.mic_calibration_contributions to anon, authenticated;

drop policy if exists "anon insert contributions" on public.mic_calibration_contributions;
create policy "anon insert contributions"
  on public.mic_calibration_contributions
  for insert to anon, authenticated
  with check (
    offset_db between 0 and 200
    and reference_quality in ('calibrator','type1_2_meter','consumer_app','eyeballed')
  );

-- Aggregated catalog (the ONLY thing clients read). Per device key: a median
-- starting offset from TRUSTED references (calibrator / real meter), the spread,
-- and counts — published only once enough trusted contributions agree. Runs as
-- owner (security_invoker off) so anon can read the aggregate without raw access.
create or replace view public.mic_catalog_public as
  select
    (device_key->>'platform')                       as platform,
    (device_key->>'model')                          as model,
    (device_key->>'measurementGrade')::boolean      as measurement_grade,
    count(*) filter (where reference_quality in ('calibrator','type1_2_meter')) as trusted_count,
    count(*)                                         as total_count,
    round(percentile_cont(0.5) within group (order by offset_db)
      filter (where reference_quality in ('calibrator','type1_2_meter'))::numeric, 2) as suggested_offset_db,
    round(stddev_samp(offset_db)
      filter (where reference_quality in ('calibrator','type1_2_meter'))::numeric, 2) as spread_db,
    max(created_at)                                  as updated_at
  from public.mic_calibration_contributions
  where device_key->>'model' is not null
  group by 1, 2, 3
  -- Publish bar (tunable): enough TRUSTED contributions before a suggestion goes
  -- live. Start conservative; raise as the catalog fills (plan target ~20-30).
  having count(*) filter (where reference_quality in ('calibrator','type1_2_meter')) >= 10;

grant select on public.mic_catalog_public to anon, authenticated;

-- Optional: for future weighting/outlier work, index the grouping key.
create index if not exists mic_contrib_key_idx
  on public.mic_calibration_contributions (device_key_hash);
