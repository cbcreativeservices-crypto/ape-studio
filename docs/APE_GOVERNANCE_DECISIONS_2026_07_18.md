# AP&E — Governance & Decisions Log (2026-07-18)

Locked decisions and standing rules as of this date. Client-only work; the
backend stays frozen. Supersedes conflicting notes in earlier handoffs where
dated later.

## Content SSoT

- **Course/Topic Matrix v2 is the locked SSoT** (26 subjects · 203 topics, gs
  canonical 100–2040). Repo copy: `src/data/course_topic_matrix_v2.json` via
  `src/data/courseTopicMatrix.ts`. **Scope: the Curriculum view only** — the
  catalog/dashboard/course cards still read the live public catalog
  (`getPublicCatalog()` / `public_courses_seed.json`, D-1 export 2026-07-11).
  Making the matrix the app-wide catalog SSoT is a separate future change.
- `gs` is the stable join key; never hardcode UUIDs.

## Awards / certificates

- **Two award levels only — no diploma, no master** (removed):
  1. **Academy Specialization Certificate** — choose **3 topics** from the 203.
  2. **Professional Certificate Program** — complete an **established program
     path**.
- Prereqs are **co-requisites** (`corequisite` field; labeled CO-REQUISITES).
- **Co-req topics** `COREQ_TOPIC_GS` = gs100 (Pro Audio Safety) + gs1590
  (Workplace Skills): always-checked, locked, grayed, excluded from the 3.
- `PROGRAM_PATHS` in `awardsData.ts` are **TBD placeholders** — Prof. Booth sets
  the final path→course sets.
- Level-1 topic selection is shared (persist key `ape:specTopics`) between the
  Awards picker and the Curriculum "Build your certificate" accordion. Saved
  only with an account (`entitlement !== 'anonymous'`), else a warning.

## Standing rules (unchanged, restated)

- Read `https://docs.expo.dev/versions/v57.0.0/` before Expo-touching code.
- **No fake meters** (measurement-tools §1.7): tools are info screens until the
  native `ape-dsp` module ships; `planned` marks not-yet-built tools. The
  Frequency Counter Tap mode is the one genuinely-live tool (real tap timing).
- `src/lib/copy.ts` commercial copy is ratified — add strings, don't reword.
- Web platform: keep expo-sqlite off the web bundle via `.native.ts` + web
  fallback splits (offline queues); native behavior byte-identical.

## Verification note

Almost all features are behind login (and commercial features need commercial
mode). The web preview (port 8090) only confirms the app bundles/mounts —
real behavior must be checked on-device via Expo Go.
