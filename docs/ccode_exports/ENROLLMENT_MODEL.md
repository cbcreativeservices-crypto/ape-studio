# Enrollment model — as implemented in ccode (2026-08-01)

Answers Machine A's request 2(d). **Nothing here touches the backend `enrollment`
table.** All enrollment state below is **device-local (AsyncStorage)**; the
backend `enrollment` table (course-based) is unused by the current app flow.

## 1. What a user actually "enrolls" in
Three distinct things, all client-side:

| Thing | What it is | Store | Storage key |
|---|---|---|---|
| **Topic** | a single `gs` (achievement) | `enrollmentStore.ts` | `ape:enrollmentList` |
| **Bundle** | a whole certificate / program / subject (its topic gs list) | `enrolledBundlesStore.ts` | `ape:enrolledBundles` |
| **Home card** | topics/bundles pinned to the Home (Course Select) screen | `homeCardsStore.ts` | `ape:homeCards`, `ape:homeBundles`, `ape:homeDefaultGs` |

Adding a **bundle** ALSO adds each of its topics as individual topic entries
(`addTopics`). So the enrollment list is the flat topic set; bundles are an
overlay grouping + a LOAD/UNLOAD switch onto the Dashboard study swipe.

There is **no course-level and no certificate-award enrollment** persisted —
"earning" a certificate is not recorded client-side at all (see §5).

## 2. Per-entry shape
- **Topic** (`EnrollTopic`): `{ gs, favorite, active }`.
  `active=false` = set aside without removing (drops out of the active study set).
  Order is user-arrangeable (move up/down).
- **Bundle** (`EnrolledBundle`): `{ key: "cert:<name>"|"program:<name>"|"subject:<name>", kind, name, topics: gs[], loaded }`.
  `loaded` = its topics are currently on the Dashboard study swipe.

## 3. Free vs. paid — where it's stored
- **Storage is identical for everyone** — always device-local. Entitlement only
  changes the **UI warning**, not the storage path.
- **Anonymous** users: enrollment works but the UI warns it won't be saved to an
  account (there is no server persistence for enrollment for anyone yet).
- **Free-with-account** and **paid**: same local stores; no server rows written.
- **Seeded FREE topics** (every new user, one-time, idempotent via
  `ape:enrollmentSeeded4`): `gs100` Professional Audio Safety + `gs1240` DAW
  Fundamentals & Session Management (`FREE_ENROLL_GS`). `gs120/gs1590` are NOT
  seeded — they join only when the user adds their first cert/program.
  Legacy seeds removed on migrate: `gs0, gs36, gs150`.

## 4. "My Enrollments" + Menu-card lifecycle (as built)
- Enrollment screen manages the topic list (add/remove/favorite/active/reorder)
  and the bundle list (add/remove/reorder/LOAD-UNLOAD).
- **Home cards** (paid feature): user pins up to `HOME_MAX = 20` cards
  (topics + bundles combined) to the Home screen; Glossary + Audio Tools are
  always-on and locked (never stored). `ape:homeDefaultGs` = which topic the
  Home carousel opens on.
- **Reset** (`resetEnrollment`): returns the list to the seeded FREE topics;
  user **progress is stored separately and is NOT touched**.
- **Account wipe / user switch** (`resetLocal` in each store, via
  `clearLocalAccountData.ts`): clears in-memory + storage; next read re-seeds the
  free topics = correct new-user default.

## 5. Progress / completion
- Per-topic progress is computed by `enrollmentProgress.ts` →
  `fetchEnrollmentDashboard(gsList)` (resolves gs→achievements, loads server
  progress) **merged over a device-local method mirror** (`study/localProgress`),
  so offline / pre-write / anonymous work still shows. Display % mirrors the
  Dashboard meter (Booth 2026-07-15 model).
- **Certificate/program completion is NOT tracked or awarded client-side.** No
  local record of "cert earned." Badges are server-side only (the 4 seed badges
  in `student_badges`, awarded by `trigger_achievement_id`); ccode reads them via
  `profile/api.ts` but never issues them.

## 6. Rows that need migrating
- **None from a server table** (enrollment was never written server-side).
- **Device-local only**, per install (not centrally reconcilable): the four
  AsyncStorage keys in §1 plus `ape:enrollmentSeeded4`. If Machine A wants these
  to become authoritative, the reconciled `enrollment`/`enrolled_bundles` tables
  should key on **`user_id + gs`** (topics) and **`user_id + bundle_key`**
  (bundles), with `favorite/active` and `loaded` columns respectively.
