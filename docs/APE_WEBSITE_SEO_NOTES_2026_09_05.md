# Website SEO — parked list (for another day), noted 2026-09-05

Owner: today is app-side only; anything for the website goes here. Everything below is on `proaudiotrainingacademy.com` (`web/`, Next.js on Vercel). Nothing here was started.

## A. The two files that make app links work (do these first — 20 minutes)
1. `web/public/.well-known/apple-app-site-association` (no extension, served as `application/json`, HTTPS, <128 KB):
   ```json
   { "applinks": { "apps": [], "details": [ { "appID": "<TEAMID>.com.cbcreativeservices.apestudio",
       "paths": [ "/get", "/tools", "/tools/*", "/learn", "/labs", "/labs/*", "/glossary", "/glossary/*", "/awards/*", "/directory", "/careers",
                  "NOT /verify/*", "NOT /registry/*", "NOT /u/*" ] } ] } }
   ```
   `<TEAMID>` = the Apple Developer Team ID (App Store Connect → Membership). Vercel: add a header rule so the path serves `Content-Type: application/json`.
2. `web/public/.well-known/assetlinks.json`:
   ```json
   [ { "relation": ["delegate_permission/common.handle_all_urls"],
       "target": { "namespace": "android_app", "package_name": "com.cbcreativeservices.apestudio",
                   "sha256_cert_fingerprints": [ "<SHA256 from `eas credentials -p android` (the profile you ship) — and the Play App Signing key once on Play>" ] } } ]
   ```
   The app already declares `applinks:proaudiotrainingacademy.com` and the matching Android intent filters (2026-09-05), so the links start opening the app the moment these two files are live and a build after that date is installed.

## B. Pages that give Google (and shares) something to land on
- **Glossary term pages** `/glossary/[slug]` — 26,847 pages from the same Supabase glossary (public terms + definitions are already anonymous-readable; render statically/ISR). Each page: term, definition, plain-English, "Open in the app" (universal link) + store badges, related terms, JSON-LD `DefinedTerm`. This is the single biggest SEO asset the company owns.
- **Tool pages** `/tools/[key]` (SPL meter, RTA, waveform, spectrogram, RT60, generator, multimeter, frequency counter/tuner) — what it measures / doesn't (the ToolInfo copy already exists in `toolsData.ts`), honest phone-mic limits, screenshots.
- **Lab pages** `/labs/[id]` and a `/learn` overview — one page per lab category and per named lab.
- **`/get` smart landing** — detects platform, shows the right store badge, carries the deep link back into the app for installed users (the app's `/get` → Home).
- **Careers** `/careers` — the Career Finder families as public pages (1,902 titles).

## C. Metadata on every page
- Open Graph + Twitter cards (title, description, 1200×630 image) — this is what a shared glossary link shows in iMessage/WhatsApp/LinkedIn.
- `<meta name="apple-itunes-app" content="app-id=<APPLE_ID>, app-argument=https://proaudiotrainingacademy.com/<path>">` (Safari Smart App Banner) and `<link rel="alternate" href="android-app://com.cbcreativeservices.apestudio/https/proaudiotrainingacademy.com/<path>">`.
- JSON-LD: `SoftwareApplication` / `MobileApplication` on `/get` and the home page (name, operatingSystem, applicationCategory, offers, aggregateRating once it exists); `DefinedTerm` on glossary pages; `Course` on curriculum/certificate pages; `Organization` sitewide.
- Canonical URLs, `sitemap.xml` (split: static, glossary-A…Z, tools, labs), `robots.txt` allowing the glossary.

## D. Store-adjacent
- App Store / Play badges with the real store URLs on `/get`, home, glossary pages.
- Product Page Optimization / Custom Product Pages URLs (App Store) can be linked from specific website pages (e.g. the SPL-meter page → the SPL-meter custom product page).

## E. Already noted elsewhere
`web/app/layout.tsx`, `robots.ts`, `sitemap.ts`, `proxy.ts` and the Connect pages are the owner's in-progress work (never committed by ccode) — coordinate before touching.
