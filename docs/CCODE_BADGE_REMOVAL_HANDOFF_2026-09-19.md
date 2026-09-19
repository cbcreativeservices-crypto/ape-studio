# ccode handoff — REMOVE the V1 badge feature (client only)

**From:** A (Cowork / DB+governance) · **Date:** 2026-09-19 · **Approved by:** Cháno
**Scope:** client app only. The database side is A's — do **not** touch it (see §6).

---

## 1 · READ ONLY THIS FILE. Boundaries first.

- This is a **client-only** change in `ape-studio`. You remove the dead V1 badge feature from the app.
- **DO NOT touch the database.** A owns and will run a guarded migration that edits `submit_quiz`,
  `delete_my_account`, `lookup_student_by_qr` and drops the `badges`/`student_badges` tables,
  `v_badge_roster`, and the badge columns. Do not write SQL, do not edit those functions.
- **DO NOT remove these — they are name collisions, not the badge feature:**
  - `components/CredentialBadge.tsx` — the certificate/credential card. KEEP.
  - `components/CautionBadge.tsx` — a safety pill. KEEP.
  - iOS notification "badge" (app-icon count) — OS feature. KEEP.

## 2 · Goal

The badge feature was retired with the V1 curriculum. Remove it **completely** from the client:
no screens, no mentions, no titles, no images, no earned-badge celebration, no settings toggle.
There are **0 earned badges** in production and **no active topic triggers one**, so nothing the
user sees today depends on it — this is dead-path removal.

## 3 · The contract change that makes this safe

A's migration removes `badge_earned` from the `submit_quiz` return payload. So the client must
stop reading it. Because `badge_earned` is **already always false** (no active `badge_trigger`),
you can ship the client strip **before, with, or after** the DB migration without a user-visible
gap. Recommended: ship client first or same release.

## 4 · Files to change (A verified these references — re-grep to confirm you got them all)

Run `rg -n "badge_earned|badgeEarned|student_badges|notify_badge|notifyBadge" src` and
`rg -in "badge" src` and reconcile against this list before you start:

| File | What's there | Do |
|---|---|---|
| `src/features/quiz/api.ts` | parses `badge_earned` from submit_quiz response | drop the field + its type |
| `src/screens/quiz/QuizScreen.tsx` | handles `badge_earned` (2 refs) | remove badge handling; **keep trophy path** |
| `src/screens/results/TrophyScreen.tsx` | badge celebration (4 refs) alongside trophy | strip **only** the badge parts; **keep the trophy screen intact** |
| `src/screens/achievements/GalleryScreen.tsx` | badge display | remove badge display/section |
| `src/features/celebration/Celebration.tsx` | badge celebration branch | remove the badge branch |
| `src/features/profile/api.ts` | queries `student_badges` (`.from('student_badges')`) | remove the query + any consumer |
| `src/features/settings/store.ts` + `src/screens/settings/SettingsPreview.tsx` | `notify_badge` toggle | see §5 — CONFIRM first |
| `src/navigation/types.ts` | badge param in a route type | remove the badge param/route type |
| `src/features/dev/DevVisualIndex.tsx` | dev-only badge visual | remove or leave dev-only; your call |

**Careful on the two shared screens:** `TrophyScreen.tsx` and `QuizScreen.tsx` handle both the
**trophy** (keep — that system is live and correct) and the **badge** (remove). Strip only the
badge branches; do not regress the trophy award/celebration flow.

## 5 · One thing to CONFIRM before removing

`notification_preferences.notify_badge` / the `notify_badge` client toggle: is it the
**"notify me when I earn a badge"** preference (part of this feature → remove it and its DB column),
or the **OS app-icon badge count** toggle (unrelated → keep it)?
Check `src/features/notifications/push.ts` and the settings store. Tell A which it is —
A drops the DB column only if it's the badge-earn toggle.

## 6 · A's side (for coordination — do not do this)

A will run one guarded SQL migration (PRECHECK/BACKUP/APPLY/VERIFY/ROLLBACK, dry-run first) that:
- recreates `submit_quiz`, `delete_my_account`, `lookup_student_by_qr` without badge references,
- drops `v_badge_roster`, then `student_badges`, then `badges`,
- drops `achievements.badge_trigger` and (pending your §5 answer) `notification_preferences.notify_badge`.
No user data is lost (`student_badges` empty; `badges` on an inactive curriculum version).

## 7 · Verify before you call it done

- `rg -in "badge_earned|student_badges|badge_trigger" src` → 0 hits.
- `rg -in "badge" src` → only `CredentialBadge`, `CautionBadge`, and OS-notification badge remain.
- Quiz → pass a topic → trophy screen and celebration still work; no badge UI, no console error
  about a missing `badge_earned`.
- Settings render without the badge toggle (or with the OS toggle only, per §5).

## 8 · When done

Append an entry to `docs/CROSS_SESSION_HANDOFF.md` (newest on top): what you removed, the commit
sha, and your §5 answer on `notify_badge`, so A can finalize the DB migration to match.
