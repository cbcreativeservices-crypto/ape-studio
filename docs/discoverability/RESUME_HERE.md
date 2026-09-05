# Resume here — website SEO, and everything not finished on 2026-09-05

Read this first when we come back to discoverability. It is the single entry point: what is done, what is blocked and on whom, and what to do next in order. Everything referenced lives in `docs/discoverability/`.

Last session: 2026-09-05. Branch `audio-tools-engine`. Commits `f3a5b13` → `ed1ec6e`.

---

## 1. State of play in one screen

| Area | State |
|---|---|
| Android App Links | **Done in the app and shipped in a build.** Inert until the website hosts `assetlinks.json` |
| iOS Universal Links | **Not enabled.** Needs one interactive build. See §3.1 |
| `proaudio://` scheme | Done, works in any build after 2026-09-05 |
| Link security | Hardened and tested. A real host-spoofing bug was fixed |
| URL contract | Agreed and written down: `URL_ROUTE_CONTRACT.md` |
| Store listing copy | Drafted with verified lengths and corrected numbers: `STORE_LISTING_SOURCE_OF_TRUTH.md` |
| Play API 36 requirement | **Verified compliant** from the shipped APK. Not a blocker |
| Website pages | **Nothing built.** The whole site is also `noindex`. See §2 |
| Analytics | Spec written, no provider chosen, nothing wired |
| In-app review | Logic written and tested, native prompt not wired (needs a build) |
| Accessibility | Worst colour-only and reduced-motion defects fixed; a ranked list remains |
| Performance | Two glossary fixes landed; the startup-graph item is open and needs measurement |

**Do not re-derive any of this.** The audit with cited evidence is `SEO_ASO_AUDIT.md`.

---

## 2. The website session — do these in this order

Everything here is on `proaudiotrainingacademy.com` (`web/`, Next.js). **`web/` is the owner's uncommitted work in progress — coordinate before touching any file in it.**

### 2.0 The blocker that makes everything else pointless if skipped

`web/lib/gate.ts` has `GATE_ENABLED = true`, which applies a **sitewide noindex**. Until it flips at launch, nothing built below can be indexed by anyone. Flipping it also needs `GATE_UNLOCK_KEY` and `GATE_COOKIE_TOKEN` set. This is an owner/launch decision, not a code task.

Second, smaller trap in the same area: whatever gating remains **must not cover `/.well-known/*`**, or the two association files below will be unreadable and deep links will silently never verify.

### 2.1 The two association files (about 20 minutes, unblocks deep links)

Templates with the real values are in `examples/`:

- `examples/apple-app-site-association.example` → deploy as `/.well-known/apple-app-site-association`, **no file extension**, `Content-Type: application/json`, no redirect, no auth. Apple Team ID `XAQQN594RH` is already filled in.
- `examples/assetlinks.json.example` → deploy as `/.well-known/assetlinks.json`. **One value is still missing:** the SHA-256 fingerprint. It must be the **Play app-signing** key from Play Console, not the EAS upload key. Getting this wrong is the most common reason app links fail silently. The file explains how to list both if you want internal builds to verify too.

Verification commands are written at the bottom of each file.

### 2.2 Glossary pages — the biggest asset

`GLOSSARY_WEB_PAGE_SPEC.md` is complete, including a full worked example built from the real `Phantom Power` row. It specifies the page anatomy, the metadata, the JSON-LD, and a **quality filter**.

Do the filter first and report the counts before building anything: publish a term only when it has a real definition, at least two of the four supporting fields, and at least two related terms. If only part of the 26,847 qualifies, that is an owner decision, not a reason to publish thin pages.

Also needed: `/glossary` index, `/glossary/category/{slug}` hubs, and sitemaps split by letter or category.

### 2.3 The rest of the route families

The website must serve a real page at **every** path in `URL_ROUTE_CONTRACT.md` §2, whether or not the app claims it. Priority order: `/get` (smart landing, platform detection, store badges), `/glossary/*`, `/topics/*`, `/tools/*`, `/labs/*`, `/subjects/*`, `/careers`.

`/subjects/*` matters here: the app deliberately does **not** claim it, so the website is the only thing serving those links.

### 2.4 Per-page metadata

Canonical URLs, unique titles and descriptions, Open Graph and Twitter cards with a generated image, `DefinedTerm` on glossary pages, `Course` on curriculum pages, `Organization` sitewide, plus the Safari smart app banner and the Android `alternate` link. Build one central metadata helper rather than repeating strings; add tests for titles, canonicals and noindex rules.

Already correct, leave alone: the noindex layouts on `registry`, `verify`, `u`, `login`, `reset-password`, `dashboard`, and the existing `robots.ts` / `sitemap.ts`.

Do **not** add `llms.txt`. Google's September 2026 guidance is that it neither helps nor harms.

---

## 3. App-side work still open

### 3.1 iOS Universal Links — needs ONE interactive build

`ios.associatedDomains` was removed from `app.json` on 2026-09-05 because the stored Ad Hoc provisioning profile has no Associated Domains capability, and a `--non-interactive` EAS build cannot add it, so the build would fail at signing.

After the AASA file is live:

1. Add back under `expo.ios`:
   `"associatedDomains": ["applinks:proaudiotrainingacademy.com", "applinks:www.proaudiotrainingacademy.com"]`
2. Run `eas build --profile development --platform ios` **once interactively**, so EAS can sign in to Apple and regenerate the profile.

**Builds require the owner's explicit go at that moment** — governance R2, `docs/APE_GOVERNANCE_DECISIONS_2026_09_05.md`.

### 3.2 In-app review prompt

`src/features/review/reviewEligibility.ts` is complete and tested (11 tests). Remaining: `npx expo install expo-store-review`, wire the call behind `optionalModule()` following the house pattern, add a row to `docs/APE_NEXT_BUILD_CHECKLIST.md`, and trigger it only from the qualifying success events. Needs a build.

### 3.3 `/subjects/{slug}` in the app

Currently unclaimed on purpose. To claim it: give `CourseSelectionScreen` a `subjectSlug` param that expands and scrolls to the matching subject, then add `subjects` to `isClaimedPath`, to `app.json` intent filters, and to the AASA `paths` — all three together.

### 3.4 Destination through a purchase

A deep link is preserved through sign-in but not through a completed membership purchase. Carry the pending path through the paywall.

### 3.5 Performance — measure before changing anything

The audit's biggest item is the startup module graph: `RootNavigator.tsx` has 95 static imports and Metro has `inlineRequires: false` (confirmed in `@expo/metro-config`), so every screen module is evaluated before first paint.

**Two candidate fixes, neither safe to do blind:**

- Enable `inlineRequires: true` in `metro.config.js`. One line, defers evaluation app-wide, and is the standard recommendation. **Risk:** this codebase uses hydrate-on-import side effects (`loadLocalSettings`, `initExposureMonitor`, store registrations), and inline requires change evaluation order. Needs a full device pass.
- Convert the six preview-exclusive imports in `App.tsx` to requires inside their `__DEV__ && web` guards. Small, contained win. I attempted this on 2026-09-05, made a mess of the edit, and reverted cleanly rather than patch over it — redo it carefully with one edit per usage site.

Record a baseline first. Do not do both at once.

Still open and cited in the audit: remote images load full-size objects with no CDN transform even though the pattern and a measured 4–5× win already exist at `tubeRefs.ts:153`; `vu_skin_spl.png` is 2.81 MB and resident on the longest-dwell screen; hub tiles animate while scrolled out of view.

### 3.6 Accessibility — what remains

The worst defects are fixed. The ranked remainder is in `SEO_ASO_AUDIT.md`, with file and line for each. Highest value first: the Flashcards card has no role, label or hint on its primary tap-to-reveal control; the RTA spectrum has no accessibility surface at all; meters expose no `accessibilityValue` (`LedMeterWell` has none); quiz progress and the countdown are never announced.

**Do not claim accessibility support in store metadata beyond what is actually done.** Reduced motion can now be claimed for the fixed screens; it is not yet true app-wide.

---

## 4. Decisions waiting on the owner

1. **Installed app name.** Store listing should be `Pro Audio Training Academy`. Whether `expo.name` changes from `Pro Audio` on the home screen is a separate call — iOS truncates around 12 characters. Recommendation: leave the device name alone.
2. **Glossary page scope.** All qualifying terms, or a curated subset?
3. **Analytics provider**, and the consent model.
4. **Install `expo-store-review`** and authorise the build that carries it.
5. **When `GATE_ENABLED` flips.**

---

## 5. Traps worth remembering

- **Web preview console errors persist across reloads.** Open a *fresh* tab before believing an error is real. Two "bugs" on 2026-09-05 were stale Fast Refresh state.
- **A top-level `import { Linking } from 'react-native'` in `App.tsx` throws on the Expo web preview** (`ReferenceError: Linking is not defined`) because of lazy-bundle scope. Resolve it at call time instead — see `attachLinkCapture` in `src/navigation/pendingLink.ts`.
- **Node's test runner needs explicit `.ts` on relative imports** in modules under test. The project sets `allowImportingTsExtensions` for exactly this.
- **`.easignore` replaces `.gitignore` for the EAS upload**, so every new ignore entry must be mirrored there. An unmirrored symlink under `.agents/skills/` broke an upload on Windows.
- **The retired v2 curriculum is still imported** by `AwardsScreen`, `CourseSelectionScreen` and `HomeSetupSheet`, which is where the wrong "26 subjects" figure comes from. The live v3 numbers are 20 fields, 50 subjects, 166 topics.
- **`common_mistakes` reads as null over the anon key** because it is masked per entitlement. That is the mask, not missing data.
