# Discoverability audit — app, stores, and the web boundary

Audit and implementation pass, 2026-09-05, against the owner's SEO/ASO brief. Priorities use the brief's scale: **P0** submission or discoverability blocker · **P1** high-value launch improvement · **P2** valuable post-launch.

Every row says what was actually observed, in which file, and whether it was implemented in this pass. Where something could not be verified locally, it says so rather than guessing.

## Executive result

- The **one P0 in the brief is not a blocker for us**: the app already targets Android API 36, verified from the shipped APK rather than inferred.
- Deep linking went from "the app cannot be opened by a URL at all" to a hardened, tested, host-validated contract, with a **real security bug found and fixed** in the process.
- The largest remaining obstacle to discoverability is **not in this repository**: the website is globally `noindex` behind a gate flag, and the two association files that make https links work are not hosted.
- Accessibility and Android-vitals evidence was gathered in depth. Both are documented rather than half-fixed; each has a short list of high-value changes.

## 1. Technology and routing detected

| Item | Observed |
|---|---|
| Expo / React Native / React | `~57.0.18` · `0.86.3` · `19.2.3` (`package.json`) |
| Native projects | **Generated**, not committed — `/ios` and `/android` are gitignored; no `expo-build-properties` override |
| Navigation | React Navigation native-stack + bottom tabs. **Not** Expo Router |
| Build | EAS, `appVersionSource: remote`, profiles `development` / `preview` / `production` |
| Identifiers | iOS `com.cbcreativeservices.apestudio` · Android `com.cbcreativeservices.apestudio` · Apple Team `XAQQN594RH` |
| Website | Next.js in `web/` **in this same repo**, and it is the owner's uncommitted work in progress |
| Analytics / crash / attribution | **None.** Only `record_tool_usage` (opens and durations, authenticated users) |
| In-app review | **Not installed** (`expo-store-review` absent) |

## 2. Evidence table

### Platform compliance

| P | Area | Current state | Evidence | Risk / opportunity | Action | Implemented? |
|---|---|---|---|---|---|---|
| P0 | Play API 36 requirement (from 31 Aug 2026) | `targetSdkVersion` **36**, `compileSdk` 36, `minSdk` 24 | Binary `AndroidManifest.xml` read out of the 2026-09-05 APK (build `fb10c2f2`, versionCode 10) via HTTP range requests; script kept at `scratchpad/apk-manifest.js` | Would have blocked every Play submission | None needed. Re-verify after any Expo SDK upgrade — the value comes from the toolchain, not from our config | ✅ verified, not a blocker |
| P1 | Firebase Dynamic Links | Not used anywhere | grep | Shut down 25 Aug 2025 | Never add | ✅ n/a |

### Deep linking

| P | Area | Current state | Evidence | Risk / opportunity | Action | Implemented? |
|---|---|---|---|---|---|---|
| P1 | URL scheme | `proaudio://` declared | `app.json` | Required by every OS return path | Added | ✅ |
| P1 | Android App Links | Intent filters for both hosts, `autoVerify`, 8 path prefixes — **confirmed present in the shipped APK** | manifest read (above) | Works the moment `assetlinks.json` is hosted | Added | ✅ app side |
| P0 | iOS Universal Links | `ios.associatedDomains` **deliberately removed** | `app.json`, `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md` §A | The stored Ad Hoc profile has no Associated Domains capability and a non-interactive EAS build cannot add it — the iOS build would fail at signing | Restore the key, then run `eas build --platform ios` **once interactively** so EAS can regenerate the profile | ⬜ blocked on an interactive build (owner authorises builds) |
| **P0** | **Link filter could be host-spoofed** | The filter checked only the path, and React Navigation's prefix match is a plain string compare — so `https://proaudiotrainingacademy.com@evil.example/tools` passed **both** and deep-linked into the app | `src/navigation/linkPaths.ts`, test `test/linkPaths.test.ts` | Arbitrary third-party pages could drive in-app navigation | `parseLink()` now validates the authority; userinfo rejected, hosts lowercased/port-stripped/allowlisted, foreign schemes refused with or without `://`, traversal and encoded separators rejected, input bounded | ✅ fixed + 15 tests |
| P1 | URL → screen map | Full map, native-only so the web harness keeps its hash routes | `src/navigation/linking.ts` | | Added | ✅ |
| P1 | `/topics/{slug}` | Opens the Study dashboard fronted on that topic, resolved from the topic **name** so no database id is public | `src/screens/dashboard/DashboardScreen.tsx` | Big search surface (166 topics) | Added | ✅ |
| P1 | `/subjects/{slug}` | **Not claimed.** Explore takes no route params and cannot focus a subject | `src/screens/courses/CourseSelectionScreen.tsx` | Opening the app on the wrong screen is worse than letting the website serve it | Website keeps it; claim only after Explore can focus | ⬜ deliberate, documented |
| P1 | Destination through sign-in | A link followed before signing in was discarded by Auth's reset | `src/navigation/pendingLink.ts`, `AuthScreen.tsx`, `SplashScreen.tsx` | The "silently sent to home" anti-pattern the brief calls out | In-memory, validated, single-use; resumed via the same config by navigate (a reset would remount Splash and its hand-off would discard it) | ✅ |
| P2 | Destination through **purchase** | Not preserved across a completed membership purchase | — | Same class of problem, smaller audience | Carry the pending path through the paywall | ⬜ |
| P2 | Deferred deep linking | Not implemented | — | Needs a third-party attribution SDK; no OS provides it | Not recommended pre-launch | ⬜ deliberate |

### Store listing

| P | Area | Current state | Evidence | Risk / opportunity | Action | Implemented? |
|---|---|---|---|---|---|---|
| P1 | Listing source of truth | Nothing entered in either console | store consoles | | `STORE_LISTING_SOURCE_OF_TRUTH.md` written, all lengths verified (name 26, subtitle 28, Play short 75, keywords 94 bytes) | ✅ doc |
| P1 | **"10,000+ terms" understates** | Corpus is **26,847** | `glossary` table; matches the app's Explore readout | Weaker claim than the truth | Use 26,000+ | ✅ corrected in doc |
| P1 | **"26 Subjects" is wrong** | Live v3 curriculum has **50 subjects across 20 fields**, 166 topics. 26 is the **retired v2** matrix, still imported by three screens | live query; `src/data/course_topic_matrix_v2.json`; `src/data/v3Curriculum.ts` | A false number in a store screenshot | Use 50 subjects | ✅ corrected in doc |
| P1 | App display name | `expo.name` is `Pro Audio`; brief requires `Pro Audio Training Academy` | `app.json` | Changing it changes every home screen | Store name = full name; installed name is the **owner's decision** | ⬜ owner decision |
| P2 | Custom product pages | None | — | Up to 70, keyword-targetable, deep-linkable on iOS 18+ | Three-variant plan written; only after the default page is proven | ⬜ plan |

### Website boundary

| P | Area | Current state | Evidence | Risk / opportunity | Action | Implemented? |
|---|---|---|---|---|---|---|
| **P0** | **Site is globally `noindex`** | `GATE_ENABLED = true` applies a sitewide noindex | `web/lib/gate.ts` | **Every** web SEO task is blocked behind this until launch | Flip at launch, set the gate env vars | ⬜ owner, launch-day |
| P0 | Association files | `/.well-known/` does not exist | `web/public/` | https deep links are inert on both platforms without them | Both example files written with real Team ID and package; the Android SHA-256 must be the **Play app-signing** key, not the upload key | ⬜ website, examples ready |
| P1 | Glossary pages | None | `web/app/` route listing | 26,847 potential indexable pages, the largest asset the company owns | `GLOSSARY_WEB_PAGE_SPEC.md` written with a real worked example and a quality filter | ⬜ spec ready |
| P1 | Credential pages indexing | Already `noindex` | `web/app/{registry,verify,u,login,reset-password,dashboard}/layout.tsx` | The brief requires exactly this | None — already correct | ✅ pre-existing |
| P1 | Sitemap / robots / org schema | Present since 21 Aug | `web/app/robots.ts`, `sitemap.ts`, `layout.tsx` | | Extend when glossary pages land | ✅ pre-existing |
| P2 | `llms.txt` | Absent | — | Google's Sept 2026 guidance: neither helps nor harms | Do not add | ✅ decided |

### Technical quality as Play visibility

Android vitals affect Play visibility. Current bad-behaviour thresholds: user-perceived crash rate 1.09%, ANR 0.47%, excessive partial wake locks 5%; memory, bitmap memory and DEX optimisation join from February 2027. Evidence below from a dedicated read-only audit.

| P | Area | Current state | Evidence | Risk | Action | Implemented? |
|---|---|---|---|---|---|---|
| P1 | Startup module graph | `RootNavigator.tsx` has **95 static imports**, zero lazy loading; `App.tsx` statically imports 12 dev/web-only preview screens that are unreachable in release | `src/navigation/RootNavigator.tsx`, `App.tsx:15-33` | **High** — every lab, tool and art module is parsed before first paint, in release, on device. Dominant TTI and startup-memory cost | Move the dev-only previews behind the existing `__DEV__ && web` guard using `require()` inside the branch; that alone also drops 243 KB of career JSON from the release startup path | ⬜ highest-value perf fix |
| P1 | Glossary corpus cache | All 26,847 rows plus three index Maps held at module level for the whole process, **never evicted**, no low-memory hook | `src/screens/glossary/GlossaryScreen.tsx:86-88`, `:1312`, `:945` | **High** — multi-MB JS heap held permanently after one visit; feeds the Feb-2027 memory metric and OOM-kill crash rate on 2–3 GB devices | Add an AppState background trim; the loader already re-fetches correctly and does not cache failures | ⬜ |
| P1 | Glossary search cost | Full filter + sort over 26,847 entries synchronously **per keystroke**; the only debounce is cosmetic | `src/screens/glossary/GlossaryScreen.tsx:1442-1477`, `:891`, `:895` | **Med** — typing jank, input-latency reports | `useDeferredValue` on the search term, or debounce the value feeding the memo | ⬜ |
| P1 | Remote image sizing | Every remote image loads the **raw full-size object**; no width/quality/format transform anywhere | `labPhoto.tsx:23`, `micImages.ts:32`, `connectorImages.ts:98`, `GlossaryScreen.tsx:148`, `CourseSelectionScreen.tsx:279` | **Med** — full-resolution bytes for tiles as small as 44×66 | The pattern and a measured 4–5× win already exist in-repo at `tubeRefs.ts:153`; these buckets are public, so it is a URL-shape change with no re-upload | ⬜ |
| P2 | Largest bundled bitmap | `assets/tool-strips/vu_skin_spl.png` 2.81 MB, 1586×992, ≈6 MB decoded, resident on the app's longest-dwell screen | `src/screens/tools/SkinnedVu.tsx:28` | **Med** — squarely in the Feb-2027 bitmap-memory metric | Downsize; same for four ~2.5 MB lab backgrounds | ⬜ |
| P2 | Hub tile previews off-screen | All 8 tiles share one `active` flag; tiles scrolled out of view keep animating, one re-rendering at 14 Hz | `ToolsHubScreen.tsx:923-931`, `hubPreviewsSim.tsx:373` | Low–Med | Per-tile viewport gating | ⬜ |
| P2 | Release shrinking / baseline profile | No `expo-build-properties`, no explicit R8/resource shrinking, no baseline profile | `app.json`, `eas.json` | Med for the Feb-2027 DEX metric | Add when the perf pass is taken on | ⬜ |
| — | Wake locks | **None.** No keep-awake anywhere; the native module requests no `WAKE_LOCK` or `FOREGROUND_SERVICE` | grep; `modules/ape-dsp/android/.../AndroidManifest.xml` | **None** — the 5% threshold is unreachable | Do not "fix" by adding keep-awake without tight gating | ✅ verified clean |
| — | Mic lifecycle | Released on blur, unmount **and** background, with a generation counter and a dead-capture watchdog | `useDspEngine.ts:180-200`, `:258-276` | **None** — textbook | No action | ✅ verified correct |
| — | Timers and listeners | Every `setInterval` has a matching clear; 11 of 13 AppState listeners removed, the 2 that are not are latched process-lifetime singletons | audit sweep | **None** | No action | ✅ verified correct |
| — | List virtualization | Glossary is a properly windowed `FlatList` with stable keys; curriculum is an accordion capped at ~26 rendered rows | `GlossaryScreen.tsx:1856-1863`; `CurriculumScreen.tsx:286` | **None** | No action | ✅ verified correct |
| P2 | Crash reporting | No Sentry/Crashlytics; a root error boundary exists, async rejections still escape | `src/components/RootErrorBoundary.tsx` | Play Console is the only crash signal | Limits diagnosis, not the metric | ⬜ |

### Accessibility and store trust

The brief's rule is that accessibility must not be claimed in store metadata beyond what the app actually does. Evidence from a dedicated read-only audit. **Do not claim reduced-motion support today**: the helper exists but only 9 call sites repo-wide, and the two most visible loops ignore it.

| P | Area | Current state | Evidence | Action | Implemented? |
|---|---|---|---|---|---|
| P1 | Study answers are colour-only | `AnswerCell` never emits `accessibilityState`; selected, correct and wrong are colour, border and text colour only | `src/components/AnswerCell.tsx:21-31`, `:61-68` | Add `accessibilityState` and a spoken suffix for correct/wrong | ⬜ |
| P1 | Fill-in-Blank / Matching verdicts | Correct or incorrect is conveyed **only** by cell colour, then the screen auto-advances | `FillInBlankScreen.tsx:346-353`; `MatchingScreen.tsx:381-393` | Announce the verdict, following the existing pattern at `lab/amp/kit.tsx:305` | ⬜ |
| P1 | SPL clip indication is colour-only | Digital clip on PEAK / PEAK HOLD is a tint with no text or glyph; the code comment says so | `SplMeterScreen.tsx:1328`, `:1333`, `:1347` | Append a `CLIP` token so it survives greyscale and a screen reader | ⬜ |
| P1 | Hearing-safety warnings not announced | Warnings appear and disappear with no live region | `SplMeterScreen.tsx:393-408` | `accessibilityLiveRegion="assertive"` plus an announcement | ⬜ |
| P1 | Auth errors not announced | Every failure path renders a plain `Text` with no live region | `AuthScreen.tsx:376`, `:409` | Live region on error and info | ⬜ |
| P1 | Two unguarded animation loops | Dashboard quiz-glow and the SPL warning strobe both ignore `animationsAllowed()` | `DashboardScreen.tsx:877-887`; `SplMeterScreen.tsx:374-387` | Gate both, then reduced motion can be claimed | ⬜ |
| P1 | Flashcard has no semantics | The primary tap-to-reveal control has no role, label or hint | `FlashcardsScreen.tsx:1322-1327` | Move semantics onto the term text | ⬜ |
| P2 | Touch targets under 44 pt | `StudioButton small` is 36 pt with no `hitSlop`; glossary chips 40 pt; exposure chips ≈27 pt including three destructive ones | `StudioButton.tsx:49`; `GlossaryScreen.tsx:736-743`; `ExposureMonitorScreen.tsx:457-463` | Add `hitSlop` | ⬜ |
| P2 | Fixed heights around text | `TextField` `height: 48`, glossary search `height: 44` — clip at large system font sizes | `TextField.tsx:97`; `GlossaryScreen.tsx:2595` | `minHeight` instead | ⬜ |
| P2 | Meters silent to screen readers | `accessibilityValue` used 5 times repo-wide, none in the audited flows; `LedMeterWell` has no accessibility props | `src/components/LedMeter.tsx:115-123` | Add values to meters | ⬜ |
| — | Paywall | Correct radio roles with `checked`, full spoken labels, `hitSlop`, native alerts | `PaywallScreen.tsx:131-137`, `:112-120` | The model to copy | ✅ good |
| — | Tools hub | The only audited screen that gates animation on reduced motion; every tile and lock state is labelled | `ToolsHubScreen.tsx:259-262`, `:117` | | ✅ good |
| — | Icon-only controls | **No unlabelled icon-only or emoji-only control found** in any of the six audited flows | audit sweep | | ✅ good |

### Ratings

| P | Area | Current state | Evidence | Action | Implemented? |
|---|---|---|---|---|---|
| P1 | Review eligibility | Implemented and tested: 3 sessions, 2 active days, 2 successes, 7 days installed, 120-day cooldown, once per version; hard vetoes for onboarding, first launch, measuring, post-purchase, post-error, post-permission-denial | `src/features/review/reviewEligibility.ts`, `test/reviewEligibility.test.ts` (11 tests) | It records that we **asked**, and deliberately cannot record what the user answered | ✅ logic |
| P1 | Native prompt | Not wired — `expo-store-review` is not installed and adding it needs a build | `package.json` | `npx expo install expo-store-review`, wire behind `optionalModule()`, add a checklist row. **Build authorisation is the owner's** | ⬜ |

## 3. Validation run

| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| `npm test` | **276 pass, 0 fail** (250 before this pass) |
| New tests | 15 link-contract + 11 review-eligibility |
| Web preview boot | clean, zero console errors in a fresh tab |
| APK manifest read | `targetSdk` 36 confirmed; deep-link filters confirmed present |

Not run, and why: no device deep-link matrix (universal links are inert until the association files are hosted, and iOS is not enabled); no production web build (the website is the owner's uncommitted work); no Play Console deep-link check (the app is not uploaded).

**No claim is made that Universal Links or App Links verify.** That requires the deployed domain and a production-signed build.

## 4. What is manual, and whose it is

**App Store Connect** — enter name, subtitle, keywords, description, promo text, categories; upload screenshots; set support and privacy URLs; later, custom product pages.

**Play Console** — enter title, short and full description, tags; upload screenshots and feature graphic; read the Deep links page after the first upload; copy the **app-signing** SHA-256 for `assetlinks.json`.

**Website / DNS** — host the two association files with the right content type and no redirect and no gate; flip `GATE_ENABLED` at launch; build glossary, topic, subject, tool and lab pages; add per-page metadata and the smart app banner.

**Owner decisions still open** — the installed app name; whether to install `expo-store-review` and authorise a build; which analytics provider; whether the whole glossary or only the rich subset gets public pages.

## 5. Before and after

| | Before today | After |
|---|---|---|
| Can a URL open the app? | No, at all | Yes on Android and via `proaudio://`; iOS pending one interactive build |
| Is the link surface safe? | Path-only check, host could be spoofed | Authority validated, 15 tests |
| Public address for a term or topic | None | `/glossary/{slug}`, `/topics/{slug}` |
| Link followed before sign-in | Discarded | Preserved and resumed |
| Play API 36 status | Unknown | Verified compliant from the APK |
| Store copy | None | Drafted, lengths verified, two false numbers corrected |
| Website plan | None | Association files, glossary page spec, analytics spec |
| Accessibility and vitals | Unmeasured | Measured, with cited evidence and ranked fixes |
