# APE Studio — Session Handoff — 2026-09-16

Full context for a fresh session. Read this top to bottom before touching anything.

---

## 0. WHAT THIS PROJECT IS
**Pro Audio Training Academy (PATA)** — a commercial mobile app: pro-audio reference + learning + skills assessment. Expo SDK 57 / RN 0.86 (Fabric / New Arch), TypeScript strict. Commercial-first — the app IS the commercial app (institutional/academic mode is RETIRED — **never mention it**).

---

## 1. FOLDERS / CONNECTIONS TO WIRE UP

| What | Value |
|---|---|
| **Repo (working folder)** | `C:\Users\profe\dev\ape-studio` |
| **Branch** | `audio-tools-engine` |
| **Git remote** | `https://github.com/cbcreativeservices-crypto/ape-studio.git` |
| **HEAD (this session)** | `a9100fd5` (committed **and pushed**) |
| **Session cwd may differ** | tooling sometimes opens at `C:\Users\profe` — always `cd C:\Users\profe\dev\ape-studio` for git/npm |
| **Scratchpad** | session temp dir (generator scripts + device screenshots live here) |
| **Comp B / Comp C deliverables** | arrive on `D:\` and/or `C:\Users\profe\Downloads` (owner routes them) |
| **Owner-provided image drops** | owner saves the file to a path in the repo and names it explicitly (see image rule) |

### MCP servers to connect / authorize (were used or needed this session)
- **Supabase** (`mcp__supabase__*`) — the backend. Disconnects mid-session; re-authorize via `/mcp` in an interactive session if its tools go missing. Project below.
- **expo** (Metro dev server) — for the dev client; needs auth in some sessions.
- **pencil / pen.dev** (`mcp__pencil__*`) — the .pen design tool. Owner said **ignore pen.dev** for now; do not act on pen.dev requests unless owner re-raises.
- Non-interactive sessions cannot run MCP OAuth — tell the owner to authorize via claude.ai connectors or `claude mcp` / `/mcp`.

### Supabase backend
- **Project id:** `yjgolswjggmlpeowvtxr`
- **Active v3 curriculum_version_id:** `a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72` (resolve by `is_active` / `status='active'`)
- **Tables:** `achievements` (curriculum: field→subject→topic, `global_sequence` = gs), `certificates`/`programs` (+ `_topics`), `academy_stats` (daily precomputed counts), `quiz_questions` (admin-only → RPCs), `user_topic_enrollments`.
- **RPCs (SECURITY DEFINER):** `get_glossary_term_count()`, `get_question_count()`, `get_academy_stats()`, `get_scenario_items()`.
- **Cron:** glossary refresh 09:30 UTC; `refresh_academy_stats()` 09:35 UTC (pg_cron).
- **Live counts (2026-09-16):** 166 topics · 50 subjects · 124 certs · 36 programs · 117,624 practice questions · 26,855 glossary terms · 1,898 career-finder careers.
- **RLS gotcha:** any public catalog table needs BOTH a public-read RLS policy AND table `GRANT SELECT` (anon+authenticated); `fetchV3*` swallow errors→[] so denial is silent.

### Device workflow (live dev via adb over USB)
- **Device serial:** `34211FDH3000F5` (Pixel). Package: `com.cbcreativeservices.apestudio`.
- **Screenshot:** `adb -s 34211FDH3000F5 exec-out screencap -p > out.png`
- **Coord mapping:** screenshots are 1080×2340; if a tool shows them at 923×2000, multiply tap coords by **1.17** to hit the real pixels. `adb shell input tap X Y` (real px). `input swipe x1 y1 x2 y2 ms`.
- **Cold restart (fixes stale Fast Refresh / Fabric "SurfaceMountingManager" mount errors, and forces re-bundle of changed ASSETS behind an unchanged `require`):**
  ```
  export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
  adb -s 34211FDH3000F5 shell am force-stop com.cbcreativeservices.apestudio
  adb -s 34211FDH3000F5 shell monkey -p com.cbcreativeservices.apestudio -c android.intent.category.LAUNCHER 1
  # wait ~30s; cold start lands on the login screen → tap GUEST MODE (FREE) to enter as guest
  ```
- **Fast Refresh caveat:** editing a JS file hot-reloads and RESETS scroll to top (makes multi-tap nav flaky). Changing an image file's bytes while keeping the same filename does NOT refresh in the running app → cold restart.
- `export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` is required before adb commands that contain `/sdcard` or other POSIX-looking paths (Git Bash mangles them otherwise).

### tsc gate
`npx tsc --noEmit -p tsconfig.json` must be clean. Ignore pre-existing `docs/` Deno errors: `... | grep -v "docs[/\\]"`.

---

## 2. HARD RULES (violating these wastes the owner's tokens — they are emphatic)

1. **⛔ NEVER touch image assets without explicit permission.** Never add/upload/commit/delete an image on assumption or a handoff's say-so. The owner names the **exact folder + filename** and gives the go **each time**. `assets/Certificate_Squares/`, `assets/Program_Squares/`, `assets/credential-squares/` are OLD/UNAPPROVED — **leave them alone** (they were deliberately excluded from commit a9100fd5).
2. **⛔ NEVER run `eas build` / `eas submit`** (any profile/platform) or any billed/external action on your own read of a message. Deadlines, "we need to build", task lists — none are the cue. The ONLY cue is the owner saying, in that moment, in their own words, to build now. When work reaches the build step: ask ONE line, then WAIT.
3. **⛔ NEVER `--no-verify`** / never skip git hooks / never bypass signing unless the owner explicitly says so.
4. **Ask before push.** Commit when asked; push only on explicit "push". (This session: committed on "commit", pushed on "push it".)
5. **⛔ NEVER mention institutional/academic mode.** Commercial is the only mode.
6. **⛔ Disclose required education for careers — always, every time.** Any listed career/role needing a degree, license, or certification beyond the app MUST say so. Never imply the credential alone qualifies. Implemented via `src/data/careerRequirement.ts` (`Career = {name, requires?}`, `REQUIRES_LABEL`). Applies to `credentialCopy` careers, `topicCopy` roles, and ALL future career copy.
7. **⛔ WAIT for GO + FABLE reminder before lab / complex generative builds.** A spec or prompt is NOT permission to begin. Complex builds need explicit consent AND a reminder to switch to Fable first. Small edits are exempt.
8. **Ask delivery location first** before creating a deliverable (docs/ is the handoff convention).
9. **Verify before claiming done.** Screenshot the real device and check the actual result before reporting a fix as complete — the owner will catch unverified claims. Don't apologize until it's actually corrected.
10. **Simplest fix first** (for EDITS/FIXES, not creative work): smallest direct change, edit the real thing, no scaffolding/agents unless asked.
11. **Design at actual dimensions** — when working a design, use the REAL component / real sizes, never guessed-size mockups.
12. **Art direction ≠ app copy** — the owner's creative wording styles VISUALS ONLY; user-facing copy stays professional/technical.
13. **Calculators = 100% accurate source of truth** (pros use them in the field with hazard/voltage/weight); some are approximations and must be labeled/reworked. Every lab/tool/calc needs the `<AccuracyNote/>` "learn here, measure with a calibrated tool" steer.
14. **No future PROMISES/timelines** ("coming soon", "in development", "soon", "later") — but DO show planned labs as dimmed placeholders with `DEV_NOTE "Planned lab — not open yet."`.
15. **Visual standards:** lab visuals draw illustrated real objects (mic/speaker/head), never boxes/circles/lines proxies; beautiful motion.
16. **No new native deps** (must run on the current dev client): no react-native-webview, no @react-native-masked-view, no adding react-native-gesture-handler. Core PanResponder → reanimated for gestures.
17. Meters bypass React state (drive SharedValues from native each rAF). Loudness color standard via `levelColor.ts`. Peak text always red `#ff5a48`. Low-Light mode: nothing auto-appears/flashes.

---

## 3. WHAT SHIPPED THIS SESSION (commit `a9100fd5`, pushed)

**Explore "Academy at a Glance" hero** (`src/screens/curriculum/InsideStats.tsx`, `CurriculumScreen.tsx`):
- Radial 8-node ring around the green glossary core; HUD portal background (`assets/glance-bg.webp`); square panel, full-bleed.
- Node clock positions (owner's final, after a revert): 12 study topics · 1:30 specialist certificates · 3 full programs · 4:30 Audio Learning Labs · 6 practice questions · 7:30 pro measurement tools · 9 pro audio calculators · 10:30 subject categories. (Per-node `clock?` field exists in `InsideStat` for custom placement; currently unused → even 45° default.)
- Numbers all white; **per-word tinted labels** via `InsideStat.labelParts`: "study"=blue, "certificates"=blue, "programs"=purple, "calculators"=purple, "tools"=green, "Labs"=green, "subject"=amber.
- **Lightning:** CONSTANT, dim, crackling arcs from the **link-icon centre** (measured via the link ROW's `onLayout`, NOT cross-view measureLayout which was unreliable on Fabric) out to each node. Regenerated ~every 130ms (jagged, amp 9 / 6 segs). Opacities very low (0.016 / 0.031 / 0.052). NOT dashes, NOT occasional strikes.
- Instant counts: `src/features/curriculum/academyStats.ts` (`useAcademyStats` — AsyncStorage cache `ape:academyStats:v1` + background `get_academy_stats` RPC). Question count via `get_question_count` in `curriculumStats.ts`.
- Membership button frame + fill de-purpled (neutral). Career Finder row text: "Career Finder - 1,898 possible Careers in audio - click here".

**Per-credential copy + audit** (Comp B deliverable integrated):
- `src/data/credentialCopy.ts` — 124 certs + 36 programs keyed by slug: `{description, whereApplies[], careers[]}`. Regenerate from `D:\credential_copy_template_2026-09-15.FILLED.json` (do not hand-edit rows).
- `src/data/careerRequirement.ts` — shared `Career`/`RequireKind`/`REQUIRES_LABEL` (education disclosure — see rule 6). 98 gated titles classified across 517 credential careers + 232 topic roles (craft "engineer" = unlabeled; hardware/DSP/acoustical-science design "engineer" = ENG_DEGREE; clinical/regulated/NDT/science = license/cert/degree).
- `src/data/topicCopy.ts` — regenerated (Comp C copy) with `roles: Career[]` (education-labelled); factual audit fixes applied (diode error, MMC/MTC/HUI, grounding overreach). DB fix: `achievements` gs 4500 em-dash → hyphen.
- Generator scripts live in this session's scratchpad: `apply_copy2.py`, `requires_map.json`, `dump_titles.py`.

**Credential detail** (`src/screens/awards/CredentialDetailModal.tsx`, `AwardsScreen.tsx`):
- Shows description + WHERE THESE SKILLS APPLY + CAREERS THIS CAN LEAD TO (career chips carry a "requires…" sub-label; hairline lightened frame).
- Accent blue (certs) / purple (programs).
- **In-place enroll** — tapping ENROLL enrolls the bundle and flips to "ENROLLED ✓" WITHOUT navigating away (was navigating to Enrollments — fixed per owner). Reflected live via `useBundles()` / `isBundleEnrolled(bundleKey(...))`. `enrollFromDetail` (old, navigates) still exists but is no longer wired.
- "Simulated possible work environment" faint watermark over the art.

**Topic detail** (`src/screens/curriculum/TopicDetailModal.tsx`): single acknowledge-checkbox that enrols the topic in place (no nav, user then taps CLOSE) via `addTopic`/`removeTopic`; "Stylized illustration — not technically accurate" faint watermark at top of the art.

**Pro Registry** (`src/screens/directory/DirectoryScreen.tsx`): inline example certificate `assets/cert-sample.webp` (owner-provided "Live Sound System Engineer" mockup) between the 1st and 2nd paragraphs.

**Shared:** `src/components/detailSwipe.tsx` (DetailPager, core PanResponder→reanimated) used by both detail modals; back-text shimmer (`BackSweep`) got a soft glow so it reads on the light Glossary-blue as well as purple.

### Theme tokens (`src/theme/tokens.ts`)
amber `#ffc64d` · green `#37e05f` · blue `#2f9bff` (Study tab / full-app blue) · cyan `#5bb0ff` (= GLOSSARY_BLUE) · purple `#b45bff` · programPurple `#c4a2ff` (PURPLE const in AwardsScreen). fonts oswald*/barlow*/cinzel*/mono.

---

## 4. NOT COMMITTED / DELIBERATELY EXCLUDED
- Image folders `assets/Certificate_Squares/`, `assets/Program_Squares/`, `assets/credential-squares/` (UNAPPROVED — rule 1).
- Parked/unused cert-SVG: `src/features/credentials/certificateSampleSvg.ts`, `src/screens/directory/CertificateSample.tsx` (the native/SVG certificate was rejected & parked — owner: "fire that designer").
- `docs/*` handoffs, `"save here before pen erases it!/"` junk folder, modified `docs/CROSS_SESSION_HANDOFF.md` (a repo hook auto-stamps it; rides the next commit).

---

## 5. OPEN / NEXT
- Nothing outstanding from this session's threads (all owner-verified).
- Standing before-launch reminders: review/turn OFF `devMode.ts` DEV_BYPASS flags; run the CALCULATOR ACCURACY AUDIT (voltage-drop temp gap, no weight calc).
- Pending glossary term awaiting Comp B ingest: "Subtractive Mixing".
- A's launch scope (new ccode work): LIFETIME IAP + privacy-first analytics/crash SDK.
- Full standing history: the memory index at `C:\Users\profe\.claude\projects\C--Users-profe\memory\MEMORY.md`.
