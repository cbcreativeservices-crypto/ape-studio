# SESSION HANDOFF — read this first (for 2026-10-10)

Owner: Cháno. **Launch: Tuesday, October 13, 2026.** Both stores were SUBMITTED on 2026-10-09 and are waiting for review. Release is manual on both.

## Where the code is
- **Branch `next-store-build`** (pushed; head about `2c948385` + docs) is the store code. It is **not merged into `final-lab`**. Merge AFTER launch.
- Work and integrate in the clean worktree **`C:\Users\profe\dev\ape-build-snap`**, not the main checkout (line-ending noise).
  - This worktree checks out CRLF on merges (autocrlf).
  - After any merge, normalise TEXT files to LF (the tests regex on `\n`).
  - Use `git -c core.autocrlf=false commit`. Never `commit -a`.
- The last full test suite passed 10,155 / 10,155 before the evening fixes. Targeted tests passed for every change after that.
- Website = branch `audio-tools-engine` (**a push publishes the live site**).

## Store builds and how to update them (CRITICAL)
| | Build | Fingerprint | Update rule |
|---|---|---|---|
| **iOS** | **36** (in review; also in TestFlight "alpha testers") | `f6a7ee3c` | `app.json` holds Android-only `blockedPermissions`, which moves the iOS fingerprint (now 4b675830). For any iOS update: remove that block → confirm `npx expo-updates fingerprint:generate --platform ios` = f6a7ee3c → `eas update --branch production --environment production --platform ios` → restore app.json byte for byte. Memory: reference_ios_ota_android_block_trap. |
| **Android** | **20** (production, in review) | `b975a5d1` | Publish normally from `next-store-build` (`--platform android`). |
| **Pixel** | preview twin of **20**, installed by adb | `b975a5d1` (preview channel) | `eas update --branch preview --environment preview --platform android`; prove with adb logcat. |

- Only publish when the owner asks.
- iOS submit needs a temporary `ascAppId` 6813607582 in eas.json, then restore it.
- EAS has no Google upload key: Android bundles are dragged into Play by the owner. Bundles are in Downloads: `2026-10-09_ANDROID_19/20_STORE_BUILD.aab`.

## What shipped in 36 / 20 (vs 34 / 16)
- Onboarding video (bundled 1080p, plays once on the first Academy menu visit, no skip, no tap-pause). Then a one-time landing page:
  - MEMBERSHIP opens over it and returns to it after purchase;
  - NEW TO AUDIO? START HERE;
  - TAKE ME TO THE HOME SCREEN;
  - Glossary / Calculators / Labs / Explore Topics, with icons;
  - Enroll;
  - Watch again;
  - Learn more.
- "Replay intro" (dim green) under About on the Academy menu.
- Miking Labs + Mixing Guides **PUBLIC (62 labs)**. Every Beta badge removed. Labs menu title "LEARNING LABS" with the official **speaker icon** (`LabsIcon`).
- "Our Commitment to You" moved to the Glossary: once, after ~4 min of use, on the next definition close.
- Login screen: "Browse the Glossary" removed (PublicGlossary is kept for deep links).
- Deep links (iOS applinks:www; Android www only). iPad mic crash fix. Package updates: expo-iap 5.8.3, Reanimated 4.5.5, Worklets 0.10.4, speech 57.1.1, supabase-js 2.117.3, navigation 7.5/7.20, expo-video.
- Android: `ACTIVITY_RECOGNITION` + `READ_MEDIA_*` blocked; Save → share sheet. CameraX 1.4.2 (16 KB pages).
- **By update (live on 36/18/19/20):**
  - VU clip lamp only at real clipping;
  - Harmonograph sound follows the figure (raised to hearing, detune audible as beating);
  - Save keeps the sound playing (own share sheet is not "leaving");
  - 13" iPad layout (card column 1000, reading 720, tools hub 560, Study dashboard scaled to fill);
  - iPad oscilloscope ×6 / spectrogram 80 dB.

## Store status (end of 10-09)
- **Apple:** submission `03ba5af0`, 5 items Waiting for Review (1.0 build 36 + monthly/annual/lifetime + the "Academy Membership" group). 29 screenshots. Notification URLs set. APPLE_* secrets set; sandbox fallback confirmed.
- **Google:** 11 changes "In review" (production 20 full rollout, 177 countries + rest of world, listing, IARC Everyone/PEGI 3 with Users Interact + IAP, target 13+, Data safety, Health, Education). **Managed publishing ON**: approval does not publish.
- Play service-account permissions confirmed (account level: view app info, financial, manage orders). **Still to prove:** a license-test purchase on an internal install as info@ (Comp A).

## Waiting on others
- **Apple / Google review.** Watch email and the Publishing overview; send any reviewer question to ccode.
- **Comp C:** technical-accuracy audit of ALL Miking + Mixing copy. The brief and the package are in Downloads (`2026-10-09_COMP_C_TECH_ACCURACY_AUDIT_BRIEF.md` + `…_AUDIT_PACKAGE.zip`). It comes back as `2026-10-09_COMP_C_TECH_AUDIT_FINDINGS.csv` (location_id → corrected_text). ccode applies the fixes by update (iOS with the strip trick).
- **Comp A:** the license-test purchase; launch-day guidance; the password-reset template check; `certificate_requires_exam` → TRUE after launch.

## Launch day (Tue Oct 13)
1. Owner: Apple **Release this version**; Google **Publishing overview → Publish**.
2. **ccode:**
   - `GATE_ENABLED = false` (web/lib/gate.ts);
   - in `web/lib/appstore.ts`, store URLs + `APP_LINKS_LIVE = true`;
   - push `audio-tools-engine`;
   - check that `/`, `/robots.txt` and `/sitemap.xml` return 200.
3. Comp A: password-reset template; `certificate_requires_exam`.

## After launch (queued)
- Merge `next-store-build` → `final-lab`.
- First post-launch native build:
  - iPad mic source / level fix (measurement mode reads low);
  - remove `SYSTEM_ALERT_WINDOW`;
  - R8 / deobfuscation;
  - the EAS Google key (optional).
- Apply Comp C findings.

## Rules in force
- Opus 5.5 MEDIUM until Wed 10-14.
- Never publish or build unasked.
- Give the owner **direct clickable links**, never menu paths.
- Ask questions as **multiple choice**.
- Files go to Downloads as single dated files.
- The owner prefers speed and "do everything you can" in store work, but approvals are still needed for saves and submits.
