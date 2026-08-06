# CCODE → Machine A — Reconciliation Exports (2026-08-01)

Response to Machine A's reconciliation request. Generated from the live ccode
app source on branch `audio-tools-engine` @ HEAD `413ba55`.

## ⚠️ Read first — the UUID join
**ccode holds NO `achievements.id` UUIDs.** Every topic reference in the app is by
**`gs` = `achievements.global_sequence`** (the v2 matrix is the display SSoT;
gs is the stable join key). So all exports key on **`gs`**, and every
`member_topic_achievement_ids` field is an **empty array** — Machine A must
resolve `gs → achievements.id` on load (join reference included, see
`topic_matrix_v2.json`). Every gs referenced by a cert/program was verified to
resolve to a matrix topic — **0 dangling references.**

## Files
| File | Contents | Count |
|---|---|---|
| `programs.json` | 15 Academy Program certificates (L2), topic paths by gs + names | **15** |
| `certificates.json` | 68 Specialized certificates (L1), 3 topics each by gs + names | **68** |
| `cert_topic_membership.json` | flat `{certificate_id, gs, name, required}` | **204** (68×3) |
| `topic_matrix_v2.json` | full gs→subject→name join reference | **203** topics / 26 subjects |
| `ENROLLMENT_MODEL.md` | request 2(d) — the client-side enrollment model | — |
| `CHANGE_HISTORY.md` | request 1 — dated change log w/ persistence classification | — |

## Counts vs. Machine A's expectation
- Programs: **15** ✅  · Certificates: **68** ✅ (matches request).

## Deviations from the requested shapes (intentional, documented)
- **`member_topic_achievement_ids` empty** everywhere → join on `gs` (see above).
- **`certificates[].requirements.quiz/study_gate/integrity` = null** — not modeled
  per-cert in ccode (see the `_note`). Enforced requisites = 3 core coreqs
  (gs100/gs120/gs1590) + Foundations-in-Audio lab + the cert's 3 topics; the
  "final assessment" is prose only. Per-topic quiz/study gates are
  **server-enforced**, not certificate-scoped.
- **`programs[].member_certificate_ids` empty** — ccode programs are **topic
  paths**, not compositions of certificates; they don't reference certs. Program
  topics are exported as `member_topic_gs` instead. Some programs carry an
  `elective_choose_one_gs` group (learner picks one).
- **`is_free: false`, `price: null`** on programs — pricing is app-wide
  (subscription/lifetime), not per-program. See `CHANGE_HISTORY.md` → Pricing.
- `parent_program_id`/`track`/`description`/`icon_url` = null where ccode has no
  such data. `track` on certs is best-effort from the first topic's matrix subject.

## Provenance
- Certs/programs: `src/screens/awards/awardsData.ts`
- Topic names/subjects: `src/data/course_topic_matrix_v2.json` (v2, Booth-locked)
- Enrollment: `src/features/enrollment/*`, `src/features/home/homeCardsStore.ts`
- Pricing: `src/lib/copy.ts`, `src/screens/commercial/PaywallScreen.tsx`
- Regenerate: `node scratchpad/gen_exports.js` (deterministic).
