# Session state — 2026-09-01 (post-restart)

All owner decisions 1–7 and the whole approved "yellow" batch are **DONE,
committed and pushed** to `origin/audio-tools-engine`. tsc clean at every
commit. The dirty files in `git status` (app.json, web/*, supabase/*, three
docs) are the OWNER'S own pre-existing edits — leave them.

## ⚠ ONE OWNER ACTION OUTSTANDING

**Run `docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL`** — the calculator weekly
allowance is server-authoritative. The client says 5; the server keeps
enforcing 10 until this runs. Safe to re-run (create-or-replace, no data
touched).

## Restart checklist (both servers die with the machine)

| Step | What |
|---|---|
| 1 | Phone Metro: `npx expo start --dev-client --clear` (8081), as a background task Claude can read |
| 2 | Web preview: `expo-dev` from `.claude/launch.json` (8090) via preview_start |
| 3 | Web tier: `localStorage.setItem('ape:dev:entitlement','academy')` + reload |

## Shipped this session

**Ratifications (`088849b`)** — compressor example now says 9 dB of gain
reduction (with the subtraction shown so it can't drift back); RF link-budget
example now −47.2 dBm → 47.8 dB.

**1–3 (`0517cd1`)** — Calculator Laboratory is `alwaysFree`: it had inherited
the Advanced Training section's members-only lock, which is what actually made
the cap look unreachable. Free allowance 10 → 5, halfway nudge rescaled to
`ceil(limit/2)`, cap dialogs work on web. Plus the SQL above.

**4 (`871e4cd`)** — SAVE is Academy-only: new `useSaveGate()` greys the control
with 🔒 and routes to membership, wired through all eight save paths (SPL,
Waveform, Spectrogram, RTA, MultiMeter, RT60, both Frequency Counter saves).

**5 (`0a6d4f3`)** — a previewed lab earns nothing: `markLabUnit` returns early
while a lab preview is active, so a free account can't bank certificate credit
by walking previews.

**6 (`14fda4c`)** — topic deep-linking: card taps front their own topic (the
`focusGs` param existed; the menu never sent one), the STUDY tab still returns
to the last-known topic AND a deep-linked topic now becomes that last-known
one, and Enrollments bundle icons front their bundle's first topic (per-topic
icons already carried their gs). Deck ORDER untouched.

**7 (`5d31f76`)** — a guest is remembered in no way: `clearLocalAccountData`
gained `{ total: true }`, used only on guest entry, so a guest also loses the
onboarding/coach flags that an ACCOUNT switch still keeps (the 2026-08-13 fix
stands for account users). KEEP list is only mic calibration, the install id
the single-device login needs, and dev overrides.

**Yellow batch (`396347d`, `7af3125`, `6cf7a65`, `9370fa6`)** — FindFrequency
"no correction applied" verdict · schedule steppers carry AM/PM and the hour ·
the remaining RN-web dead dialogs routed through `src/lib/confirm.ts`
(measurement deletes, exposure deletes, lapsed notice, coming-soon notices, and
the signal-gen cap unlock, which also had a latch that could never re-open) ·
**root error boundary** (one uncaught render error used to white-screen the
whole app) · guest Settings honesty (GUEST status, no Student ID / Log out /
DELETE ACCOUNT, "Sign in to manage notifications") · glossary term rows
demoted, ending the button-in-button family · BPM dashes above 600 · Vd carries
cm³ · MultiMeter catalog copy matches the tool.

## Repair notes (the restart damaged git + memory)

The unclean shutdown zeroed several files that were open at the time. All
repaired, nothing lost:
- `.git/index`, `.git/refs/heads/audio-tools-engine`,
  `.git/refs/remotes/origin/*` → rebuilt from origin (my last commit was
  verified as an ancestor of origin's tip first). `git fsck` is now clean.
- `~/.claude/.../memory/MEMORY.md` → was 22,857 null bytes; the 71 individual
  memory files were intact, so the index was regenerated from their frontmatter
  and grouped by type.

## NEXT — the two live workstreams

1. **Feedback email system** (owner brief, mid-session): app feedback →
   `info@proaudiotrainingacademy.com`; intake aliases `feedback@`,
   `corrections@`, `suggestions@` forwarding in, each carrying metadata (app
   screen, ids, date/time, device, version); Gmail rules bucketing each alias
   for batch processing. Owner wants it driven with **Claude in Chrome** against
   his already-signed-in Bluehost + Gmail — I never enter credentials; he stays
   logged in and I drive. Creating forwarders/filters are account-settings
   changes, so confirm as we go. Code side: `src/lib/feedback.ts`
   `SUPPORT_EMAIL` is still `profechano@yahoo.com`. Two open questions: send
   FROM three addresses vs one tagged address, and the subject-line convention.
2. **IAP store setup + sandbox test** — owner: "getting close but not yet."

Deferred "green" backlog is in memory (`deferred-backlog-2026-09-01`) and in
`docs/APE_TEST_EXPERT_NIGHT_2026_08_31.md`.
