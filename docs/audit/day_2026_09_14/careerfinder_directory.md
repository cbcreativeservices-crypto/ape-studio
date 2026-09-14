# Bug hunt — Career Finder & Directory / Pro Registry (2026-09-14)

Agent: correctness + privacy. Scope EDITED: `src/screens/careerfinder/**`, `src/screens/directory/**`,
`src/features/directory/**`. Everything else READ-only. No commits, no network/DB, no builds.
`npx tsc --noEmit` clean; `npm test` green (1165 pass / 0 fail) after the edit below.

---

## FIXED (in scope)

### F1 — Explore: a failed search rendered a misleading "0 members"
`src/screens/directory/ExploreView.tsx` (results conditional, ~line 252)

On a search error, `run()` sets `rows=[]`, `total=0`, `err`. The render branch was
`busy ? Loading : (visibleRows.length === 0 && !err) ? Empty : Results`. With `err` truthy the
middle test is false, so it fell through to the **Results** block and drew a `0 members` count
header plus the `SelfReportedNote` directly under the warning banner — an error state that reads
like a successful empty result (the exact "failed load looks empty" class this feature has been
fighting elsewhere).

Fix: added an explicit `err ? null :` arm so the error state shows only the banner + RETRY (already
rendered above), never a count:
`busy ? Loading : err ? null : visibleRows.length === 0 ? Empty : Results`. Pure display; does not
change what publishes or who can see it.

---

## PRIVACY FLAGS FOR OWNER (report-only — touches the consent trail / §8.1 exact-preview / §9 ratified attestation; NOT changed)

### P1 — Publish preview + consent disclosure understate the fields that actually go public
- Consent disclosure (publish confirm dialog): `src/screens/directory/MyProfileView.tsx:271-273`
  — lists only "display name, areas, specialties, how you're involved and About My Work".
- "THIS IS WHAT OTHERS SEE" exact preview: `MyProfileView.tsx` `PreviewSheet` body `:743-774`
  — renders only displayName, primaryArea, about, specialties, roles, featured credentials.
- What the public projection ACTUALLY shows (member sheet, "same projection the web page renders"):
  `src/screens/directory/AudioCommunityDirectoryScreen.tsx:187-214` — also renders **countryCode,
  region, languages** (meta line 188-191) and the **OPEN TO** list (205-214). The RPC returns them
  too: `src/features/directory/api.ts` `fetchPublicProfile` `:361-373` (country_code, region,
  languages, open_to).

So a member who filled Location / Languages / Open To sees a preview and a consent line that never
mention those fields, yet they are published and visible to anyone with the link. §8.1 requires an
*exact* preview before confirmation; this one is not exact, and the §9 attestation copy omits the
same fields. Because this changes the consent trail / ratified attestation wording, it is left for
the owner to decide field set + ratified copy rather than fixed here.

Note: `workPref` is shown on the Explore *card* (`ExploreView.tsx:296`) but not on the member
profile sheet — a minor inconsistency in the public surface, same family of issue.

---

## ATTACKED AND CLEAN

- **Career Finder count trap (the known one):** verified against the bundled JSON.
  `CAREER_COUNT = index.careers.length = 1898`; `careerFamilies.json` has 42 entries; **sum of
  per-family `count` = 1898**, and every family's `meta.count` equals the number of titles actually
  carrying that family index (0 mismatches). `FAMILIES.length = FAMILY_COUNT = 42`, all 42 family
  names in `careerIndex.json` resolve to a `families.ts` id (name→id map, 0 orphans).
- **Index integrity:** 1898 careers, **0 duplicate ids**, **0 duplicate titles within a family**,
  **0 undefined enum decodes**, no `tier` out of `[0,2]`.
- **Questionnaire:** 28 questions = 14 dimensions × exactly 2 each; `DIMENSION_CODES` length 14
  matches the "fourteen kinds of audio work" copy; milestone gates (Q7/Q14/Q21) line up.
- **Beta disclaimer** present on intro, results and about (`BetaPill`).
- **Career Finder empty / weak-result state:** `weak` heading logic ("CLOSEST TO YOUR ANSWERS" vs
  "STRONGEST MATCHES") handled, incl. the BROAD-profile case.
- **18+ gate ordering (Directory):** `MyProfileView.tsx onPublish :255-286` — for a first-time
  publisher the age attestation dialog fires BEFORE the field-disclosure/consent dialog, before the
  RPC; discoverable/contact toggles are `disabled` until published, so the age gate is transitive.
  Server also enforces (`rules.ts readableError` age branch). Correct.
- **Directory loading/error/empty triads:** RequestsView (`:220-262`) and MyProfileView
  (`:315-327`) and the member sheet (`:167-173`) all separate loading / error+retry / genuinely
  empty. A failed *refresh* after a good load shows a "showing the last list that loaded" banner.
- **De-listing is self-service and complete:** `deleteCommunityProfile` + unpublish/discoverable/
  contact toggles all exist and are RPC-backed; delete resets local state to EMPTY.
- **Contact purpose can't be forged past the recipient's Open To at the DB:** purpose slug is
  rebuilt from the recipient's own Open To labels (`AudioCommunityDirectoryScreen.tsx:301-306`,
  mirroring `rules.slugify`) and the server validates it ("not something this member is open to" →
  `rules.ts:185`). ContactSheet remounts per member (MemberSheet returns null when closed), so a
  stale purpose cannot leak from member A to member B.
- **No email crosses the boundary** in api.ts (all RPC, addressed by publicToken).

## OUT-OF-SCOPE / LOW-PRIORITY OBSERVATIONS (not changed)

- **Stale count comments (READ-only files):** `src/features/careerfinder/careerIndex.ts:3`
  ("1,902 titles") and `src/navigation/types.ts:324` ("1,902-title index") — actual is 1,898.
  Doc drift only; the UI uses `CAREER_COUNT` dynamically everywhere, so nothing user-facing is wrong.
- **Explore has no pagination:** `directory_search` accepts page/pageSize and returns `total_count`,
  but `ExploreView` always requests page 0 (30 rows) with no "load more". If matches ever exceed 30,
  the "N members" header can exceed what is reachable. Fine while the directory is small; revisit
  before it fills.
- **Explore concurrent-search race:** two rapid filter/`q` changes issue overlapping `searchDirectory`
  calls with no request-id/abort guard; a slow earlier response can overwrite a newer one. Low
  likelihood; pre-existing.
- **`rules.ts aboutProblem()` is exported but unused** — the About editor relies on server refusal +
  `readableError` rather than inline pre-validation. Dead code or a missing inline hint.
- **`AudioCommunityDirectoryScreen` re-implements `slugify` locally** (`:301`) instead of importing
  `rules.slugify`; identical transform, just duplication.
- **ContactSheet / respondToRequest have no in-flight button disable** — double-tap is possible but
  the server dedupes/rate-limits and returns "already answered"; no privacy impact.

## DEVICE-ONLY (not verifiable here)

- Actual on-device rendering of the member sheet / preview, haptics, modal overlay behavior, and the
  real DB round-trip of purpose slugs vs stored Open To slugs (no network/DB access in this run).
