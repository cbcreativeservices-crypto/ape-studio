# URL and route contract

Status: **implemented in the app** 2026-09-05 (commit `6684a60`). The website half is not built.
Owner: this is the agreement between the app, the website and the two stores. A path here is a public promise: change one and you break saved links, shares, printed QR codes and search results at the same time.

## 1. The rule that governs everything else

**A path is claimed by the app only if the app handles it WELL.** Everything else stays with the browser and the website. Opening the app on a nearly-right screen is worse than letting the website serve a correct page, because the user cannot tell the app is doing its best — it just looks broken.

Three consequences:

- The app claims a strict subset of the website's routes.
- The website must serve a real page at **every** path in this table, claimed or not, because the app may not be installed.
- Path lists live in exactly three places and move together: `src/navigation/linkPaths.ts` (`isClaimedPath`), `app.json` (`android.intentFilters`), and the website's `apple-app-site-association` `paths`.

## 2. The table

| Public path | App destination | Claimed by app | Notes |
|---|---|---|---|
| `/get` | Home (Main) | ✅ | The install/landing page. |
| `/glossary` | Public glossary | ✅ | Works signed-in or anonymous. |
| `/glossary/{term-slug}` | Public glossary, search prefilled | ✅ | The single biggest SEO asset (26,847 terms). |
| `/topics/{topic-slug}` | Study → Dashboard, fronted on that topic | ✅ | Resolved from the topic NAME, so no database id is ever public. |
| `/tools` | Measurement & Analysis hub | ✅ | |
| `/tools/{spl,rta,waveform,spectrogram,rt60,signalgen,hzcounter}` | That tool's info screen | ✅ | |
| `/tools/multimeter`, `/tools/frequency-counter` | Straight to the live screen | ✅ | These two skip the info screen by design. |
| `/learn` | Audio Learning fork | ✅ | |
| `/labs` | Lab menu | ✅ | |
| `/labs/{lab-slug}` | That lab, or a lab category | ✅ | Named labs are explicit; anything else resolves as a category id. |
| `/awards/{curriculum,specialization,program,directory,enrollment}` | Awards pager on that page | ✅ | Only these five values. |
| `/directory` | Audio Community Directory | ✅ | |
| `/careers` | Career Finder | ✅ | |
| `/subjects/{subject-slug}` | — | ❌ **deliberately not claimed** | See §3. |
| `/verify/{code}` | — | ❌ never | Public credential verification. Website only. |
| `/registry/{token}` | — | ❌ never | Public registry listing. Website only. |
| `/u/{token}` | — | ❌ never | Public profile. Website only. |
| everything else (`/academy`, `/membership`, `/store`, `/login`, …) | — | ❌ | Marketing, legal and account pages belong to the website. |

Custom scheme: `proaudio://<same paths>`. Universal/App Links: `https://proaudiotrainingacademy.com/<path>` and the `www.` form.

## 3. Why `/subjects/*` is not claimed

The v3 curriculum is Field → Subject → Topic (20 fields, 50 subjects, 166 topics). A subject is a real browsable thing and the website should absolutely have a page per subject. But the app's Explore screen (`src/screens/courses/CourseSelectionScreen.tsx`) takes no route params and has no "focus this subject" affordance, so the honest app behaviour today would be "open Explore and hope the user scrolls". Under §1 that means the website keeps the link.

**To claim it later:** give Explore a `subjectSlug` param that expands and scrolls to the matching subject, then add `subjects` to `isClaimedPath`, to `app.json`'s intent filters, and to the AASA `paths`. Not before.

## 4. Renames, legacy paths and missing content

- **Slugs come from names**, via `slugify()` in `src/navigation/linkPaths.ts`: fold accents, lowercase, runs of non-alphanumerics collapse to a single hyphen. The website must use the identical rule or the two will disagree.
- **A renamed term or topic changes its slug.** The website owns the redirect: old slug → `301` → new slug, one hop, never a chain. The app needs no redirect table because it resolves by matching the live name; an unmatched slug simply leaves the screen on its normal content (see below).
- **Missing content must not 200.** The website returns a real `404` with a useful page. The app, which cannot know whether a slug is wrong or merely belongs to a course this account lacks, stays on its normal state rather than showing an error — the website page is the fallback that explains.
- **Never put a database id, token, email address or access token in a public path.** `/topics/{slug}` exists precisely so `global_sequence` stays private.

## 5. Locked content and the sign-in detour

- A link to content behind membership must land on something that **explains what was requested** and how to get it. It must never dump the user on Home.
- A link followed **before signing in** is preserved: `src/navigation/pendingLink.ts` stores the validated path in memory, and `AuthScreen` resumes it after sign-in through the same linking config. Single-use, in-memory only, never a full URL and never a query string, so nothing sensitive can be parked there. Splash clears it when a session already exists.
- Still open: the same preservation across a **membership purchase**. The paywall does not yet carry the pending destination through to a completed purchase.

## 6. Security requirements (all enforced and tested)

Every incoming URL is attacker-controllable: any app can send us `proaudio://…`, and a browser can hand us an https one. `parseLink()` + `isAcceptedLink()` in `src/navigation/linkPaths.ts` enforce:

| Requirement | How |
|---|---|
| Host allowlist, not path-only | The authority is parsed, lowercased and port-stripped, then checked against `LINK_HOSTS`. |
| No host spoofing via userinfo | Any `@` in the authority is rejected outright. This was a **real bug**: React Navigation's prefix match is a string compare, so `https://proaudiotrainingacademy.com@evil.example/tools` previously passed. |
| No foreign schemes | `javascript:`, `data:`, `file:`, `intent:` refused, with or without `://`. |
| No traversal or smuggling | `.`/`..` segments, empty segments, `%2F`, `%5C` and backslashes all rejected. |
| Bounded input | ≤2048 chars, ≤8 segments, ≤128 chars per segment. |
| No open redirect | The app never navigates to a URL from a link; it resolves a path against its own config. |
| No secrets in URLs | No token, id or email appears in any claimed path. |

Covered by `test/linkPaths.test.ts` (15 tests). Add a case there before changing any rule.

## 7. Verifying on a device

The custom scheme works in any build made after 2026-09-05. The https forms stay inert until the website hosts the two association files.

```bash
npx uri-scheme open "proaudio://glossary/phantom-power" --ios
npx uri-scheme open "proaudio://topics/professional-audio-safety" --android
```

Test matrix that must pass before claiming universal links work: iOS and Android × cold and warm start × installed and not installed × signed in and out × free and locked content × valid, malformed, removed and unauthorised paths × unicode and percent-encoded slugs × canonical and rejected hosts. The last two rows are covered by unit tests; the rest need a device and the deployed domain.
