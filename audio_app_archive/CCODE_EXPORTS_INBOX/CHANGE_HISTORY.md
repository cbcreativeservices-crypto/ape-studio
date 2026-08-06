# ccode → backend change history (data/model implications)

Chronological, append-only. Focus: everything ccode built/changed with
backend/data implications. **Persistence key:** `DB` = writes to Supabase ·
`LOCAL` = device AsyncStorage · `CONFIG` = hardcoded in app source (no DB row).

> Git in this repo begins at the **2026-07-18 initial commit** — the certificates,
> programs, and v2 matrix were already present in it (built pre-git-init from the
> "CCODE handoff 2026-07-18"). Pre-07-18 evolution survives only as dated inline
> code comments + memory; it is folded into the 07-18 entry below.

| Date | Change | Entities / data | Persists to |
|---|---|---|---|
| 2026-07-18 | **Initial commit** (Expo SDK 57). App shipped with the full **68 Specialized Certificates** + **15 Program paths** + **v2 course/topic matrix** (26 subjects / 203 topics, gs 100–2040, "approved & locked Prof. Booth 2026-07-18"). Awards = 2 levels only (L1 single-topic cert, L2 program). 3 core coreqs defined: gs100/gs120/gs1590. | `SPECIALIZED_CERTIFICATES`, `PROGRAM_PATHS`, `course_topic_matrix_v2.json` | **CONFIG** (all three; no DB tables exist for them) |
| 2026-07-18 | Certificate naming rule: leading "Audio " dropped, picker sorts A–Z. | cert names | CONFIG |
| 2026-07-20 | Commercial UX pass: awards/curriculum screens, profile, dev index. | awards rendering | CONFIG |
| 2026-07-22 | **Enrollment model introduced (client-side).** Device-local topic list (`ape:enrollmentList`, `{gs,favorite,active}`), cert/program **bundles** (`ape:enrolledBundles`, LOAD/UNLOAD), and **Home cards** (`ape:homeCards` + bundles + default, cap 20). Seeded FREE topics = gs100 + gs1240. | enrollment list, bundles, home cards, free-topic set | **LOCAL** (free-topic set = CONFIG in `FREE_ENROLL_GS`) |
| 2026-07-22 | Architectural Audio certificate added → **68th** cert. | `SPECIALIZED_CERTIFICATES` | CONFIG |
| 2026-07-23 | Enrollment progress: per-topic % merges server progress over device-local method mirror (offline/anon safe). | topic progress (read) | DB (read) + LOCAL mirror |
| 2026-07-24 | Per-context bookmarks; core-lock; custom-list dashboard topic. | bookmarks (`ape:bm:<ctx>`), custom list | LOCAL |
| 2026-07-25 | `resetEnrollment` returns list to seeded FREE topics; progress preserved separately. | enrollment list | LOCAL |
| 2026-07-26 | **Account wipe / user switch** clears all device-local stores (`clearLocalAccountData`); enrollment X-button remove. | all LOCAL stores | LOCAL |
| 2026-07-27 | Whole-award (bundle) remove from enrollment. | bundles | LOCAL |
| 2026-07-30 | **"Foundations in Audio" lab = 4th requisite** for every cert/program (surfaced as a green lab-link container, not a Dashboard card; lab keeps own progress). | cert/program prerequisites | CONFIG (requirement) + LOCAL (lab progress) |
| 2026-07-30 | Requisite cores now track **certificate presence** (appear when a cert/program is held, vanish when the last is removed). | coreqs ↔ enrollment | LOCAL (derived) |
| 2026-07-30 | Home carousel default/return-centering rules. | `ape:homeDefaultGs` | LOCAL |
| 2026-07-31 | Awards requirement copy: program bullet → "Complete a program's topic path"; both cert & program add a "Sound Fundamentals Lab" checkmark. | awards copy | CONFIG |
| 2026-07-31 | **Paywall/entitlement:** multi-topic Professional Certificate cards require full access (no longer "open" because one topic is free). New UpgradeSheet copy; beta pricing note (lock-in through year-end + lifetime). | menu-card access gating, pricing copy | CONFIG (gating) + entitlement (DB, read) |
| 2026-07-31 | Home Setup rework: "On your home" lists only enrolled topics; always-on = Audio Tools + Glossary + Pro Audio Safety, plus locked core reminders while a credential is held. Unpaid users can't save/arrange (writes gated). | home cards | LOCAL (writes gated by entitlement) |
| 2026-07-31 | Bundle drag-sort (`moveBundle`) for cert/program/subject containers. | bundle order | LOCAL |
| 2026-07-31 | Glossary "Subtractive Mixing" authored as a **pending-term handoff doc** for the backend/"computer B" to ingest (glossary lives in Supabase, not local). | glossary term (pending) | DB (pending ingest, not by ccode) |

## Pricing — source of truth (CONFIG, needs a DB home)
Hardcoded in app source, no DB row:
- `src/lib/copy.ts` → `lifetimePrice: '$99.99'`
- `src/screens/commercial/PaywallScreen.tsx` → Lifetime `$99.99`, Annual `$59.99/yr`,
  Monthly `$9.99/mo`. Store products resolve via `entitlements` (product/status)
  but the **displayed prices are literals**.

## Badges / awards (mostly DB-side already)
- Only the **4 seed badges** (`badges` table, `trigger_achievement_id`, `is_mvp`).
  Awards recorded server-side in `student_badges`; ccode **reads** them
  (`profile/api.ts` via `badge_name_snapshot`) but never issues them.
- **Certificate/program completion is NOT awarded or recorded anywhere** (no DB,
  no local). This is the biggest gap: earning a cert/program has no persisted
  representation today.

## Things that live app-side but should probably live in the DB
1. **Programs (15)** and **Certificates (68)** + their topic membership — CONFIG today. *(exported)*
2. **Free-topic set** (`FREE_ENROLL_GS` = gs100, gs1240) — CONFIG.
3. **Pricing** (see above) — CONFIG literals.
4. **Enrollment state** (topics/bundles/home cards) — LOCAL only, per-install.
5. **Certificate/program completion + issuance rules** — not persisted at all.
6. **Course/topic matrix v2** (203 topics) — CONFIG (`course_topic_matrix_v2.json`);
   the DB has `achievements` by `global_sequence`, so this is the join surface.
