# Website SEO finish: build report (2026-11-14)

**Spec:** `Downloads/COMP_A_TO_CCODE_2026-11-14_SEO_WEB_FINISH.md` (Comp A, 2026-11-14).
**Where:** `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`, `web/` only. Before the edits, `web/` was identical to `origin/audio-tools-engine` (abfe2cfb); `git diff` was empty.
**Not done, by instruction:** no commit, no push, no deploy, no `vercel`/`eas`. Nothing outside `web/` was touched. No image file was touched. The production site changes only when the owner says so.

## What changed, per part

| Part | Change | File:line |
|---|---|---|
| A | Home `metadata`: absolute title "Pro Audio Training Academy: Audio Engineering Training App"; the approved description; OG and Twitter carry the same title and description and keep `og-home.png`; `alternates.canonical: "/"` | `web/app/page.tsx:16-49` |
| B | `ORG_JSON_LD` replaced by `SITE_JSON_LD`, one `@graph` with EducationalOrganization, WebSite, Person and MobileApplication. It keeps the `DESCRIPTION` and `TAGLINE` constants. MobileApplication is added only when `APP_LINKS_LIVE` is true, with `APP_STORE_URL` and `PLAY_STORE_URL` imported from `web/lib/appstore.ts` | `web/app/layout.tsx:85-152`, rendered at `:162` |
| C1 | `alternates: { canonical: "<own path>" }` on all 19 sitemap paths. `/get` gets its canonical in its existing `layout.tsx`. Pages not in the sitemap get no canonical (checked: /login, /store, /tubes) | `web/app/page.tsx:31`, `web/app/get/layout.tsx:17`, and line 8-39 of each `web/app/{about,academy,accessibility,ai,contact,credentials,curriculum,delete-account,employers,founder,institutions,membership,privacy,standards,support,terms,verify}/page.tsx` |
| C2 | Sitemap: `lastModified` set to build time; `changeFrequency` and `priority` removed; the 19 paths are unchanged | `web/app/sitemap.ts:29-40` |
| C3 | `keywords` removed from the root metadata | `web/app/layout.tsx` (old lines 54-59) |
| C4 | Videos load `preload="metadata"`, with no `autoPlay`, except the one clip on screen at first paint (the hero marquee's first clip, `eager`), which keeps `preload="auto"` and `autoPlay`. Play and pause are driven by the IntersectionObserver that was already there. A clip stays behind its labelled placeholder until a frame can be painted (`HAVE_CURRENT_DATA`, not metadata). A `poster` field is supported. Reduced motion now pauses the eager clip. | `web/components/AppScreen.tsx:13-20, 30-44, 66-92, 101-104, 139-146`; `web/components/AppScreenMarquee.tsx:33-42`; `web/lib/app-screens.ts:11-33` |
| D | `other: { "apple-itunes-app": "app-id=6813607582" }` is added only when `APP_LINKS_LIVE` is true. The id is read from `APP_STORE_URL` | `web/app/layout.tsx:8-10, 58-61` |
| E | New `StoreBadges` export (the two existing badges: Apple first, Google Play second, same Badge shape, the row stretches both to one height). `GetTheApp` now uses it. It is rendered in the home hero under the existing "Get the app" and "Explore the Academy" buttons. Every existing `/get` link stays | `web/components/GetTheApp.tsx:50, 61-89, 120`; `web/app/page.tsx:89-90` |

## Facts checked before the change

| Fact in the spec | Result |
|---|---|
| "171 topics" | **True on the live server, but the website does not say it anywhere.** A read-only query on 2026-11-14 found 171 active topics (`is_active`, gs 3000+) in the active curriculum version `a7c1f2e0-…`; 9 more are inactive. No page in `web/`, and none of 9 live pages fetched, states a topic count. The approved description is used unchanged, so this is the first time the number appears on the site. |
| Credentials verified at /verify | True: `/verify` exists and is in the sitemap. |
| Person facts on `/founder` | Name Channing Booth, "Cháno", Professor, "Founder & Curriculum Director", San Diego Miramar College and Berklee College of Music: all stated on `/founder`. knowsAbout Audio engineering, Live sound, Studio recording (front of house, monitors, studio recording) and Audio education (taught since 1999): stated. **"Jazz piano" is not stated on `/founder`** (the page says only "performing music" and never names a style), so it was left out, following the live site. |
| sameAs URLs | All three answer 200; the YouTube channel title reads "Pro Audio Training Academy". (Read from the public URLs; not re-checked inside Meta Business Suite.) |
| Store URLs, `APP_LINKS_LIVE = true` | True in `web/lib/appstore.ts`; both URLs answer 200. |
| App Store id 6813607582 | Matches `APP_STORE_URL`. |

## Checks (production build, run locally)

| Check | Result |
|---|---|
| `npm run build` in `web/` | **Passed** (exit 0, Next.js 16.3.1 Turbopack, TypeScript clean, 38 static pages). ESLint on the changed files: clean. |
| Server | `next start -p 3217`, stopped when done (port free again). |
| Home `<title>` | Exactly `Pro Audio Training Academy: Audio Engineering Training App`. |
| JSON-LD | One `<script type="application/ld+json">` on `/` and on `/founder`, `@graph` with 4 nodes in order: EducationalOrganization, WebSite, Person, MobileApplication. The block is byte-identical on both pages. |
| Canonical | One `<link rel="canonical">` on each of the 19 sitemap paths, each pointing at itself (`/` resolves to `https://www.proaudiotrainingacademy.com`). |
| `apple-itunes-app` meta | `<meta name="apple-itunes-app" content="app-id=6813607582"/>` is present. |
| `keywords` meta | Gone. |
| `/sitemap.xml` | 19 `<url>`, 19 `<lastmod>`, 0 `priority`, 0 `changefreq`. robots.txt is unchanged (allows all, points to the sitemap). |
| Store badges at 390 px | Both are visible in the hero, on one row: Apple at x 36 (164×55), Google Play at x 213 (141×55). Same height, no sideways scroll (scrollWidth 390). |
| Store badges on desktop (1243 px) | Visible: Apple at x 455 (164×55), Google Play at x 632 (141×55). |
| Videos | The HTML has 25 `<video>` elements: the hero's first clip has `preload="auto"` and `autoPlay`, all others `preload="metadata"` with no autoplay. In the browser, on-screen clips play and off-screen clips pause (390 px: the first clip, scrolled off left, paused; the next 3 playing; the rest paused). Clips far off screen fetched only about 300 bytes (metadata) until they scrolled near. The eager clip's request starts at 88 ms, before DOMContentLoaded (107 ms); FCP was 220 ms. Before a frame is ready, each phone frame shows its labelled placeholder (title, caption, tint), so the hero is never empty. |
| Posters | **Not met: no poster stills exist.** See "Differs from the spec". |

## Rich Results Test (Google, Code input, built-in browser pane)

| Page | Result |
|---|---|
| `/founder`: the full rendered HTML (36 KB) pasted | **2 valid items, 0 errors.** Organization: 1 valid item, no issues. Software Apps: 1 valid item, 1 non-critical issue: `Missing field "aggregateRating" (optional)`. |
| `/` (home) | **2 valid items, 0 errors.** Same result: Organization valid; Software Apps valid with the same optional `aggregateRating` warning. |

How the home test was run: the full 105 KB home HTML could not be moved into Google's editor. Clipboard paste did not reach the pane, and a cross-origin fetch and a popup were both blocked. So the pasted code was the home page's rendered `<head>` (title, description, canonical, OG, Twitter, `apple-itunes-app`) with only the font, CSS and script links removed, plus its JSON-LD block. That block is byte-identical to the one in the full `/founder` HTML that passed. Person is not a Google rich-result type, so the tool does not list it. It parsed without error.

The `aggregateRating` warning can only be cleared with real store ratings. It is optional, and the spec says warnings are fine.

## Differs from the spec / to note

1. **Posters (C4): made and checked, but NOT in the repo yet.** No existing still matches a clip: `study.png` and `flashcards.png` show different screens from their videos. Round 2 (below) has the details.
2. **"Jazz piano" left out of `knowsAbout`**: `/founder` does not state it, so the live site wins. The owner confirmed "Leave it out" in round 2.
3. **171 topics** is right on the server but appears nowhere on the site until this change (see the facts table).
4. **Reduced motion**: before this change, the `autoPlay` attribute played every clip even for reduced-motion visitors (the observer skipped them, but autoplay ran anyway). Now only the eager clip has autoplay, and it is paused for those visitors.
5. **Link previews per page:** done in round 2 (below).
6. Spec step 4 ("commit, then wait") was not done: this task says never commit. Nothing is committed or pushed.

## Round 2: the owner's answers (2026-11-14, relayed by the coordinator)

The owner's answers: (1) deploy now, which the coordinator does; (2) poster stills, "Yes, make them"; (3) link previews, "Yes, each page its own"; (4) "Jazz piano", "Leave it out".

### (3) Each sitemap page has its own link preview: DONE
- New helper `web/lib/seo.ts` `pageMeta({ path, title, description, image? })`. From the page's existing title and description it returns:
  - the title and description;
  - `alternates.canonical`;
  - `openGraph`: type, siteName, its own `url`, title "<Title> · Pro Audio Training Academy", the description, and the image;
  - `twitter`: summary_large_image with the same title, description and image.
- The 17 static pages now use `export const metadata: Metadata = pageMeta({ path, title, description[, image] })`. Their titles and descriptions are unchanged, and the comment on delete-account is kept.
- Image: the page's own 1200×630 preview where one already exists in `web/public/og/`, otherwise the shared `og-home.png`.
  - Own preview: academy, credentials, curriculum, employers, founder, institutions, membership, verify.
  - These 8 files were committed on 2026-11-06 but were never referenced until now. No image file was changed.
- `/get` (client page) keeps its existing OG title, description and image in `app/get/layout.tsx`, and now also has `url: "/get"`, type, siteName and a twitter title and description.
- Home was already done in part A (`og:url` = `/`, its own title).
- Pages not in the sitemap (e.g. /login, /store) still inherit the root preview. That is unchanged.

### (2) Poster stills: made and verified, NOT placed in the repo
- **Made:** 11 stills, one per home-page video, each the video's own first frame (t = 0).
  - Method: the video was loaded in the built-in pane on the local production server, frame 0 drawn to a canvas at native 540×1170, encoded as WebP (quality 0.82), and saved by a local receiver.
  - Sizes: 23–46 KB each (study 44.8, mic-principles 32.0, flashcards 39.2, quiz 32.7, fill-blank 23.0, lab 37.1, eq-lab 36.4, mic-lab 37.9, dac-lab 46.1, tools 32.7, rta 30.8 KB).
  - Location: the scratchpad folder `...\scratchpad\posters\<file>-poster.webp`.
- **Verified:** `study` and `rta` were opened and compared by eye with the video paused at 0:00. They match: Foundations of Sound, module 7/14; Signal Detective, case 2 of 7, peak meter.
- **Blocked:** copying the 11 files into `web/public/app-screens/` was **refused by the permission system**. This task's first instruction was "never touch any image file", and the go-ahead to make them reached me through the coordinator, not from the owner directly.
  - So no image file is in the repo, and the posters are **not wired**. Wiring them without the files would point at missing images.
  - Real blocker: owner permission in this session.
- **To finish** (owner or coordinator):
  1. Copy the 11 `*-poster.webp` files next to the videos in `C:\Users\profe\dev\ape-workbench\web\public\app-screens\`.
  2. In `web/lib/app-screens.ts`, add `"/app-screens/<file>-poster.webp"` as the 6th argument of each `video(...)` call (study, micPrinciples, flashcards, lab, eqLab, micLab, dacLab, tools, rta, quiz, fillBlank).
  3. `AppScreen` already shows a clip with a poster at once (`components/AppScreen.tsx:101-104, 146`).

### Round 2 checks (rebuilt; local production server on :3217, stopped afterwards)
| Check | Result |
|---|---|
| `npm run build` | **Passed** (exit 0, TypeScript clean, 38 pages). ESLint on `lib/seo.ts`, `app/get/layout.tsx` and the 17 pages is clean. The one ESLint error it prints is in `app/get/page.tsx:23`; I did not touch that file (it matches production) and the error was there before. |
| Titles, canonical, og:url, og:title, twitter:title on **all 19** sitemap pages | Each has exactly 1 canonical pointing at itself. `og:url` is the page's own path. `<title>`, `og:title` and `twitter:title` are identical on every page (e.g. "Founder · Pro Audio Training Academy", og:url /founder, og:image og-founder.png). |
| OG images | Own preview on the 8 pages above, `og-home.png` on the rest; `/og/og-academy.png`, `og-founder.png` and `og-verify.png` answer 200. |
| JSON-LD | Still one block, 4 nodes: EducationalOrganization, WebSite, Person, MobileApplication. |
| `apple-itunes-app` | Present. |
| Sitemap | 19 URLs, 19 lastmod, 0 priority, 0 changefreq. |
| Posters shown before play | **Not checkable**: the files are not in the repo (see above); 0 `poster=` attributes in the home HTML. |

## Files changed (26, all under `web/`; 25 modified + 1 added)

- `web/app/layout.tsx`
- `web/app/page.tsx`
- `web/app/sitemap.ts`
- `web/app/get/layout.tsx`
- `web/app/about/page.tsx`
- `web/app/academy/page.tsx`
- `web/app/accessibility/page.tsx`
- `web/app/ai/page.tsx`
- `web/app/contact/page.tsx`
- `web/app/credentials/page.tsx`
- `web/app/curriculum/page.tsx`
- `web/app/delete-account/page.tsx`
- `web/app/employers/page.tsx`
- `web/app/founder/page.tsx`
- `web/app/institutions/page.tsx`
- `web/app/membership/page.tsx`
- `web/app/privacy/page.tsx`
- `web/app/standards/page.tsx`
- `web/app/support/page.tsx`
- `web/app/terms/page.tsx`
- `web/app/verify/page.tsx`
- `web/components/AppScreen.tsx`
- `web/components/AppScreenMarquee.tsx`
- `web/components/GetTheApp.tsx`
- `web/lib/app-screens.ts`
- `web/lib/seo.ts` (new, round 2)

No image file was added or changed under `web/`. Plus this report: `docs/web/SEO_FINISH_2026_11_14_REPORT.md`.
