# APE Studio — Session Handoff — 2026-09-16 (session B, afternoon)
Full context for a fresh session. Read this top to bottom before touching anything. Paste it as the first message of the new session.

## 0. WHAT THIS PROJECT IS
Pro Audio Training Academy (PATA) — a commercial mobile app: pro-audio reference + learning + skills assessment. Expo SDK 57 / RN 0.86 (Fabric / New Arch), TypeScript strict. **Commercial-first — the app IS the commercial app.**

## 1. FOLDERS / CONNECTIONS TO WIRE UP

| What | Value |
|---|---|
| Repo (working folder) | `C:\Users\profe\dev\ape-studio` |
| Branch | `audio-tools-engine` |
| Git remote | `https://github.com/cbcreativeservices-crypto/ape-studio.git` |
| HEAD (this session) | `7fbd0786` — **ahead of origin by 3** (`98f070dd`, `83d4bb76`, `7fbd0786`) — NOT pushed; ask before push |
| Uncommitted | `src/screens/courses/StudyAreaExplore.tsx` (swipe-down-to-close + ✕ — owner-verified "it works") · `docs/CROSS_SESSION_HANDOFF.md` (sync entries) |
| Session cwd differs | tooling opens at `C:\Users\profe` — **every command handed to the owner starts `cd C:\Users\profe\dev\ape-studio;`** |
| **Deliverables for the owner** | **`C:\Users\profe\Downloads\<YYYY-MM-DD>_<NAME>\`** — the ONLY place the owner can reach ccode files. NOT the OneDrive `AUDIO APP` project (owner cannot see ccode files there), NOT repo `docs/` alone. |
| Owner → ccode inbound | Comp B / Comp C deliverables arrive on `D:\` and/or `C:\Users\profe\Downloads` (owner routes them); owner-provided images land in a repo path the owner names explicitly |
| Scratchpad | session temp dir (screenshots, throwaway scripts) |

**MCP servers** — Supabase (`mcp__supabase__*`, project `yjgolswjggmlpeowvtxr`) disconnects mid-session; re-authorize via `/mcp` in an interactive session. `expo` MCP needs auth some sessions. `pencil / pen.dev` — owner said ignore. Non-interactive sessions cannot run OAuth — tell the owner to authorize via claude.ai connectors or `claude mcp`.

**Supabase backend** — project `yjgolswjggmlpeowvtxr`; active v3 `curriculum_version_id` `a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72`; tables `achievements` (gs = global_sequence), `certificates`/`programs` (+`_topics`), `academy_stats`, `quiz_questions` (admin-only → RPCs), `user_topic_enrollments`; RPCs `get_glossary_term_count`, `get_question_count`, `get_academy_stats`, `get_scenario_items`; pg_cron 09:30/09:35 UTC. Live counts: 166 topics · 50 subjects · 124 certs · 36 programs · 117,624 questions · 26,855 glossary terms · 1,898 careers. RLS gotcha: a public catalog table needs BOTH a public-read policy AND `GRANT SELECT` (anon+authenticated); `fetchV3*` swallow errors → `[]`.
Storage bucket `course-cards` (public): credential art `cert-<slug>.webp` / `prog-<slug>.webp`, study-area cards `area_<slug>.webp`, 941×1672 portrait WebP. Upload scripts: `scripts/upload-credential-cards.mjs`, `scripts/upload-menu-cards.mjs` — owner runs them with `$env:SUPABASE_SERVICE_ROLE_KEY` (the dashboard's new `sb_secret_…` key works with supabase-js 2.110). ccode never handles the key. **The owner pasted the `sb_secret_JkeMI…` key into chat this session — advise rotating it.**

**Device workflow (Pixel over USB)** — serial `34211FDH3000F5`, package `com.cbcreativeservices.apestudio`.
- Metro: `preview_start` name `expo-dev` (port 8081) — NEVER Bash for dev servers; then `adb -s 34211FDH3000F5 reverse tcp:8081 tcp:8081`. The USB link drops several times an hour — re-run the reverse after every reconnect; a "device not found" mid-script is the link, not the app.
- Launch to Metro: `adb shell am start -a android.intent.action.VIEW -d "proaudio://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.cbcreativeservices.apestudio` (wait ~100–140 s for the bundle). Cold start → Welcome → LET'S GET STARTED → login → GUEST MODE (FREE) → dismiss the commitment overlay.
- Screenshot: `adb exec-out screencap -p > out.png` (1080×2340; a tool showing 923×2000 → ×1.17 for tap coords). `export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` before adb commands with POSIX-looking paths.
- Members-only labs on the guest client: long-press the Home WORDMARK (DEV cycle anonymous→free→academy, dismiss each alert), then deep-link `proaudio://labs/<lab>`. First visit to any audio visualizer passes the amplitude-orientation gate (scroll to the bottom; answer: orange swatch, LEFT pad grid, Display B; CONTINUE) then the audio-output gate (PROCEED / hold-to-enable).
- Fast Refresh hot-reloads JS but resets carousel scroll; a changed image with the same filename needs a cold restart (immutable cache).
- Gates: `npx tsc --noEmit -p tsconfig.json` must be clean (ignore pre-existing `docs/` Deno errors: `| grep -v "docs[/\\]"`); `npm test` (node --test, 1189 tests today); ape-dsp goldens: `cd modules/ape-dsp/test; cmd /c build_and_run.bat` then run `golden.exe` (171/171 today).

## 2. HARD RULES (violating these wastes the owner's tokens — they are emphatic)
- ⛔ **DELIVER FILES TO `C:\Users\profe\Downloads\`.** Handoffs for Computer A/B/C, exports, reports — anything the owner must open or forward. Never the OneDrive project, never docs/-only. Violated twice in one hour this session. Then state the exact path in chat.
- ⛔ **Every command block for the owner starts `cd C:\Users\profe\dev\ape-studio;`** (PowerShell 5.1 `;` chaining). One command per fenced `bash` block, no `$` prompt.
- ⛔ **NEVER touch image assets without explicit permission.** No add/upload/commit/delete on assumption or on a handoff's say-so. Owner names the exact folder + file and gives the go each time. `assets/Certificate_Squares/`, `assets/Program_Squares/`, `assets/credential-squares/`, `assets/Menu Course Cards/` are UNCOMMITTED — leave them alone. (This session the owner explicitly said "convert and ship" the 3 menu cards → converted to WebP; the owner ran the upload himself.)
- ⛔ **NEVER run `eas build` / `eas submit`** or any billed/external action on your own read. The ONLY cue is the owner saying, in the moment, in his own words, to build now. When work reaches the build step: ask ONE line, then WAIT.
- ⛔ NEVER `--no-verify` / skip hooks / bypass signing. **Ask before push. Commit when asked** ("commit"); push only on "push".
- ⛔ NEVER mention institutional/academic mode. Commercial is the only mode.
- ⛔ Disclose required education for careers — always (`src/data/careerRequirement.ts`).
- ⛔ WAIT for GO + Fable reminder before lab / complex generative builds. Spec ≠ permission. Small edits exempt.
- **Verify before claiming done** — screenshot the real device and look at it. Don't say "verified" from a log line alone. Don't apologize until it's actually corrected. **Owner 2026-09-16: "please stop assuming things are working on your end."**
- Simplest fix first (edits/fixes). Design at actual dimensions. Art direction ≠ app copy. Calculators = 100 % accurate source of truth + `<AccuracyNote/>` on every lab/tool/calc. No future PROMISES/timelines (planned things shown dimmed as "Planned — not open yet"). Visual standards: illustrated real objects, never boxes. Meters bypass React state (SharedValues). Loudness colour = `heatColor`/`levelColor` (`src/features/tools/levelColor.ts`). Peak text red `#ff5a48`. Low-Light: nothing auto-appears. Every rendered simulation carries a Simulation / Calculated / Approximated label.
- No new native deps unless owner-approved (this session approved: `@sentry/react-native`, `@aptabase/react-native`, and the `GEN_MODES.dual` addition to `modules/ape-dsp` — all ride the NEXT build).
- Sync channel: `docs/CROSS_SESSION_HANDOFF.md` — the post-commit hook stamps a stub per commit (not always); fill `affects other side:` / `needs:` before ending the turn; add a manual entry when the hook misses.

## 3. WHAT SHIPPED THIS SESSION (all on `audio-tools-engine`)
Pushed (`…6a625d0a`):
- `e7589ecd` **v1 purge** — `courseTopicMatrix.ts` + `course_topic_matrix_v2.json` deleted; AwardsScreen/HomeSetupSheet resolve names off live v3 only; CARD_IMAGE lost MUSI###/pub#/free0/free36; showcase card "Sound Reinforcement Systems" → "Sound Reinforcement".
- `426d33fa` dead `'public'` carousel card kind removed.
- `7078b21b` **Telemetry wired** — Sentry + Aptabase, privacy-first. Kill switch `src/config/telemetry.ts`; `src/features/telemetry/{telemetry,scrub}.ts` (+8 tests); keys in git-ignored `.env`; `metro.config.js` → `getSentryExpoConfig`; app.json plugin. JS-only on the current dev client. Store-form table for Computer A: `docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md`.
- `b91fb353` **Sentry FULLY ANONYMOUS (owner "Option B")** — no user binding, `setUser` never called (source-pinned by test); table updated: 100 % not linked.
- `d5bc4ee6` Pro Registry placeholder tile reads "YOUR QR CODE".
Not yet pushed:
- `98f070dd` **Study Area EXPLORE → credential picker** (`src/screens/courses/StudyAreaExplore.tsx`, mapping `src/data/studyAreaCredentials.ts`): 1 match opens the popup, 2+ opens the sheet, same `CredentialDetailModal` as the Certificates/Programs screens with in-place ENROLL and ‹ ›. **3 NEW cards** (owner ruling — separate cards, not bloated menus): Mixing & Mastering, Audio Restoration & Archiving, Acoustics Science — art `area_*.webp` **uploaded by the owner and device-verified live in the carousel**. 26 credentials deliberately not surfaced on any card. Also committed `docs/APE_CYMATICS_LAB_SPEC_2026_09_16.md`.
- `83d4bb76` **Cymatics Lab: Sound Made Visible — Phase 1** (owner GO, Fable). Members-only, Training › Sound Visualization, replaces the planned stub. `src/features/cymatics/` (materials incl. orthotropic wood w/ rotatable grain; Bessel disc + Ritz rectangular plate modes; exact `f ∝ h/L²·√(E/ρ(1−ν²))` law; driver/support mode weighting; resonance readout BELOW/APPROACHING/AT/BETWEEN; grid field sampler; note/cents/λ; 8 experiment presets; 9 tests). `src/screens/lab/cymatics/` (home w/ live hero, Chladni Plate Studio on the LabShell rack — bezel Hz/note/mode/res, 6 dock keys, sweep, fine nudge, slow-mo, silent drive, second tone; `vizPlate` Skia engine — worklet sand point cloud, heat/phase/node meshes, strobed 3D + cross-section, illustrated finishes, driver puck + clamp, drag-to-place; modules Intro / Nodes&Modes / Harmonics-vs-Modes / Evidence-vs-Myth / Experiments). Routes `CymaticsLab / CymaticsModule / CymaticsPlateStudio`, deep link `labs/cymatics`, guided lesson `cymatics`. **Native `GEN_MODES.dual = 14`** (two sines summed mono for real beats) — engine 7→8 in Generator.hpp / ObjC / Swift / Kotlin / JNI / index.ts, goldens 171/171 — rides the NEXT build; JS gates on `engineVersion() ≥ 8` and says "visual-only" otherwise.
- `7fbd0786` sand static-friction settle rule (figures hold on nodal lines — was dissolving to dots), cross-section layout, `scripts/upload-menu-cards.mjs`.
Uncommitted:
- **StudyAreaExplore swipe-down-to-close** (Animated sheet follows the finger; >90 px or a flick dismisses; header always grabs; the list grabs only when it isn't scrollable — Android's ScrollView steals vertical drags otherwise; long lists close from the header, the new ✕, or the scrim; visible grip). Owner hand-tested: "ok it works". Note: adb-driven header drags were inconclusive; the owner's finger test is the verdict.

Device-verified live this session: v1-purge carousel + Enrollments names · Sentry ingest HTTP 200 + Aptabase self-test · YOUR QR CODE tile · study-area menus (Theatrical 5-option, Assisted Listening direct-open, Acoustics Science 17-option) · the 3 new cards with art · Cymatics home hero, Plate Studio (mode tray, tone playing, sand snapping into (4,4), heat/phase/3D/section views, plate tray A/B), Nodes module · swipe-close by owner.

## 4. NOT COMMITTED / DELIBERATELY EXCLUDED
- Image folders: `assets/Certificate_Squares/`, `assets/Program_Squares/`, `assets/credential-squares/` (old/unapproved), `assets/Menu Course Cards/` (+ `webp/` — owner's 3 PNGs and their WebP conversions, already in the bucket). Leave alone.
- Parked cert-SVG: `src/features/credentials/certificateSampleSvg.ts`, `src/screens/directory/CertificateSample.tsx`.
- `docs/CCODE_*`, `docs/SESSION_HANDOFF_*`, `docs/lab-audio.edge-fn.reference.ts`, `"save here before pen erases it!/"`.
- Side effect of my automated adb testing: the **guest** got enrolled in "EQ & Tonal Shaping" (local-only; guests are factory-reset on the next guest launch — nothing server-side).

## 5. OPEN / NEXT
1. **Commit + push** — commit the swipe-close change on "commit"; push the 3 (→4) commits on "push".
2. **Cymatics Phase 2 (Liquid / Faraday studio)** — spec §1.4 + §3; needs owner GO + Fable. Then Phase 3 (Harmony in Motion, membrane/loudspeaker, other systems, Change-One-Thing) and Phase 4 (Gallery & Art Studio reusing `harmoExport`).
3. **Computer B modal library** — handoff delivered at `C:\Users\profe\Downloads\2026-09-16_COMPUTER_B_CYMATICS_MODAL_LIBRARY\` (+ `.zip`): 8 shape variants, JSON schema in `MODAL_LIBRARY_BRIEF.md`. When it returns: ingest to `src/data/cymatics/`, add a `libraryModes()` branch in `plateModes.ts`, un-dim the SHAPE rows.
4. **Credential thumbnails** — many certs still have no `cert-….webp` in the bucket (blank thumbs in the pickers/Certificates screen). Owner: "images are being prepared — accounted for." Do nothing until told.
5. **Rotate the Supabase `sb_secret_…` key** (pasted into chat). Owner action.
6. **Telemetry follow-ups** — owner to eyeball Aptabase (EU) + Sentry dashboards for the self-test events; for the NEXT build add `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` (org slug) as EAS env vars, then re-run the dev self-test (`EXPO_PUBLIC_TELEMETRY_SELFTEST=1` for one Metro run) to confirm native crash capture.
7. **Next EAS build carries** Sentry/Aptabase native, engine-8 `dual`, view-shot/expo-sharing/media-library/print (calc + harmonograph exports). NEVER start it unprompted.
8. Standing before-launch: review/turn OFF `src/config/devMode.ts` DEV_BYPASS flags (`instantIntros` is still true); CALCULATOR ACCURACY AUDIT; glossary persistent cache; "Subtractive Mixing" glossary term awaiting Comp B.
9. Full standing history: memory index `C:\Users\profe\.claude\projects\C--Users-profe\memory\MEMORY.md`.
