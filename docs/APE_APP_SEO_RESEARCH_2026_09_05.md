# App discoverability ("app SEO") — research + plan, 2026-09-05

Owner: "optimize the app for SEO (not the web) today; make a doc of anything for the website for another day." This is ccode's own research pass (Aug/Sep 2026 sources) done BEFORE reading the owner's prepared data, so the two can be merged.

## 1. What "SEO for an app" actually is in 2026

There are four separate discovery channels, and each is fed by different work:

| Channel | Who searches there | What ranks you | Where the work lives |
|---|---|---|---|
| **App Store search (iOS)** | people typing into the App Store | App **name** (strongest), **subtitle**, the 100-char **keyword field**, then ratings, retention and engagement; Apple's new **AI-generated tags** are derived from your metadata + screenshots and human-reviewed (you can remove wrong ones, not add) | App Store Connect metadata + screenshots (owner submits; drafts in §4) |
| **Google Play search** | Android users | **Title**, **short description**, **long description** (Play indexes it — keywords in prose count), ratings/reviews, localisation, the 5 store tags, video; Google moved to *theme-based* keyword understanding, so natural phrasing beats stuffing | Play Console listing (drafts in §4) |
| **On-device search** (iOS Spotlight / Siri; Android shortcuts / Assistant) | people who already installed the app | iOS: **App Intents** + Core Spotlight entity indexing (Apple is making Spotlight/Siri the next in-app discovery layer; SiriKit is deprecated as of WWDC26 — App Intents is the only path); Android: **App Shortcuts** / App Actions | native code (a Swift App Intents extension) — **not** doable in Expo JS alone; parked (§6) |
| **The open web → the app** (Google search, links people share, social previews) | everyone | HTTPS URLs that open the app when installed (**Universal Links** / **Android App Links**) and fall back to a real web page when not; **Open Graph** tags on those pages; a page per piece of content (glossary term, tool, lab) so Google can index it | the WEBSITE hosts the pages + two verification files; the APP declares the domain and maps URLs to screens |

The biggest asset this app has for channel 4 is the **26,847-term glossary**: 26,847 potential indexable pages, each one a door into the app. That is website work (parked, §6) — but the app side of it (URL → screen mapping, the domain association, the custom scheme) is app work and is done today so the pages can light up the moment they exist.

Deferred deep links (install-then-land-on-the-right-screen) need an attribution SDK; no OS provides it natively. Firebase Dynamic Links is gone. Not recommended before launch — owned links + a smart landing page cover 95%.

## 2. Where the app stood this morning

- **No URL scheme, no associated domains, no intent filters, no React Navigation `linking` config** — the app could not be opened by any link at all. A shared glossary term carried the site root only.
- Shares already carry one uniform branded footer with `https://proaudiotrainingacademy.com` (owner 2026-08-10 rule) — good; that line is the hook every future term/tool URL rides on.
- The website has product/legal pages, `/get`, `/verify/[code]`, `/registry/[token]`, `/tubes/[id]` — no glossary/tool/lab pages, no `/.well-known` files, so nothing for the app to be associated *with* yet.
- App identity: name "Pro Audio", slug `ape-studio`, iOS bundle `com.cbcreativeservices.apestudio`, Android package the same; no `description`.

## 3. App-side plan (done today unless marked)

1. **Custom scheme** `proaudio://` — required for any deep link and by every OS share/return path.
2. **App Links declared (Android)**: `intentFilters` (autoVerify, https, host `proaudiotrainingacademy.com` + `www.`, pathPrefixes for the routes below). **iOS `associatedDomains` DEFERRED** — the stored provisioning profile lacks the capability and a non-interactive EAS build cannot add it, so it would have failed the demo build; the exact re-enable step is in the website notes §A. Until the website hosts the two verification files (§6) the https links are inert on both platforms anyway (Android opens the browser); the `proaudio://` scheme works now.
3. **URL → screen map** (`linking` on `NavigationContainer`), same paths the website will use:
   - `/get` → Home · `/tools` → Measurement hub · `/tools/<key>` → tool info (spl, rta, waveform, spectrogram, rt60, signalgen; `multimeter`, `frequency-counter` go straight to their live screens)
   - `/learn` → Audio Learning fork · `/labs` → lab menu · `/labs/<category>` → a lab category · `/labs/harmonograph` etc. for the named labs
   - `/glossary` → the glossary · `/glossary/<term>` → the glossary opened on that term (search prefilled)
   - `/awards/<category>` → curriculum / certificates / programs · `/directory` → Audio Community Directory · `/careers` → Career Finder
   - `/verify/<code>`, `/registry/<token>`, `/u/<token>` stay **website-only** (the app never claims them — they are public verification pages).
4. **Share links become real URLs** — every glossary share already prints the site URL; the term share now also prints its own `https://proaudiotrainingacademy.com/glossary/<slug>` line so the link opens the app (once associated) and the term page (once built). Until the page exists the link lands on the site root, which is what it does today. *(Only if the glossary share code can take it cleanly — see the commit.)*
5. **`expo.description`** set (used by Expo tooling and as the seed for the store description). Store keyword work is metadata, not code — §4.

## 3b. Platform compliance — VERIFIED from the shipped build (2026-09-05)

The owner's research flagged Google Play's **API 36 requirement** (new apps and updates must target Android 16 / API level 36 from 31 August 2026) as a potential submission blocker. **We are compliant.** Read directly out of the binary `AndroidManifest.xml` inside the Android development APK built 2026-09-05 (build `fb10c2f2`, versionCode 10), fetched by HTTP range request rather than downloading all 347 MB:

| Manifest value | Shipped |
|---|---|
| `targetSdkVersion` | **36** |
| `compileSdkVersion` | 36 |
| `minSdkVersion` | 24 |

Not inferred from `app.json`: the Android project is generated at build time (no `expo-build-properties` override), so the levels come from Expo SDK 57's gradle plugin, whose fallback is also 36. The same manifest confirms today's deep links compiled in: both hosts, the `proaudio` scheme, `autoVerify`, `VIEW`/`BROWSABLE`, and the `/glossary`, `/tools`, `/labs`, `/awards`, `/careers` path prefixes are all present. Re-verify with the same method after any Expo SDK upgrade. Script: `scratchpad/apk-manifest.js` (reads the manifest from a remote APK without a full download).

## 4. Store listing drafts (to merge with the owner's research)

**iOS App Store** (name ≤30, subtitle ≤30, keyword field ≤100 chars, promo text 170, description 4000):
- Name: `Pro Audio Training Academy` (26)
- Subtitle candidates (30): `Audio Engineering Glossary` · `Learn Pro Audio · Measure It` · `Sound Engineering Training`
- Keyword field (100, comma-separated, no spaces, no words already in name/subtitle): `spl,meter,decibel,rta,spectrum,analyzer,rt60,reverb,tuner,mixing,mastering,live sound,acoustics,dsp,ear training`
- Promo text: "A 26,000-term professional audio glossary, real measurement tools, and interactive labs — from cables to acoustics."
- Description: lead with the free glossary (the public entry point per the owner's share rule), then tools (honest about phone-mic limits), then labs and the Academy, then certificates/programs. Apple's AI tags are derived from this text + screenshots: keep the nouns concrete (glossary, SPL meter, RTA, spectrogram, reverb decay, ear training, cable lab).
- Screenshots: first image decides — the glossary card and the tools hub (real hardware look) are the two strongest; 2026 data says most users never scroll past image two.
- Custom Product Pages (up to 70, keyword-targetable): one for "SPL meter / decibel" intent, one for "audio glossary / learn audio engineering", one for "ear training".

**Google Play** (title 30, short 80, long 4000): title `Pro Audio Training Academy`; short: `Audio engineering glossary, SPL/RTA tools, interactive labs & certificates.`; long description = the iOS description in prose with the keyword themes repeated naturally (Play indexes it); 5 tags: Education, Music & Audio, Reference, Productivity, Tools (pick per Console options).

**Ratings/retention** are now ranking factors on both stores: the in-app "rate us" prompt after a completed topic/lab (not on first open) is worth adding before public launch — not today.

## 5. Sources (Aug–Sep 2026)
- [App Store custom product pages: how to use them in 2026 (Adapty)](https://adapty.io/blog/custom-product-pages-app-store/) · [Custom Product Pages in 2026 — 70 pages, keywords (RespectASO)](https://respectaso.com/blog/custom-product-pages-app-store-guide-2026/) · [App Store keyword research 2026 (AppLaunchFlow)](https://www.applaunchflow.com/blog/app-store-keyword-research-2026) · [ASO best practices 2026 (TekRevol)](https://www.tekrevol.com/blogs/app-store-optimization-best-practices/)
- [Apple AI-generated App Store tags — WWDC25 (AppTweak recap)](https://www.apptweak.com/en/aso-blog/apple-wwdc-2025-recap) · [AI tags in iOS 26 beta (TechCrunch)](https://techcrunch.com/?p=3018815) · [App Store ranking factors, 2025 update (SplitMetrics)](https://splitmetrics.com/blog/apple-app-store-ranking-factors/)
- [Google Play optimization guide 2026 (AppLaunchFlow)](https://www.applaunchflow.com/blog/google-play-store-optimization-2026) · [App listings in Google Play 2026 (ASOMobile)](https://asomobile.net/en/blog/app-listings-in-google-play-2026/) · [Play ASO checklist (AppTweak)](https://www.apptweak.com/en/aso-blog/app-store-optimization-aso-checklist-for-google-play)
- [Expo: linking overview](https://docs.expo.dev/linking/overview/) · [Expo: iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/) · [Expo: Android App Links](https://docs.expo.dev/linking/android-app-links/) · [React Navigation: deep linking](https://reactnavigation.org/docs/deep-linking/) · [Expo blog: universal + app links with EAS Hosting](https://expo.dev/blog/universal-and-app-links)
- [App Intents / Spotlight as a growth channel (Medium)](https://hasanalidev.medium.com/app-intents-are-no-longer-just-for-siri-in-the-apple-intelligence-era-spotlight-may-be-your-ios-5208a368fd7b) · [WWDC26: App Schemas for Siri (Apple)](https://developer.apple.com/videos/play/wwdc2026/240/) · [iOS 27 App Intents guide (eCorpIT)](https://ecorpit.com/ios-27-app-intents-siri-ai-developer-guide-2026/) · [Android App Actions (Google)](https://developers.google.com/learn/pathways/app-actions) · [Android app shortcuts](https://developer.android.com/develop/ui/views/launch/shortcuts)
- [Deep linking in 2026 (Adapty)](https://adapty.io/blog/app-deep-linking/) · [Deep linking guide 2026 (ChottuLink)](https://chottulink.com/blog/what-is-deep-linking-a-complete-guide-for-mobile-apps-2026/) · [Rich link previews (Kochava)](https://www.kochava.com/blog/configure-rich-link-previews-higher-smartlinks-conversion-rates)

## 6. Parked (website day, and native-later)
See `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md` for the website list (AASA + assetlinks, term/tool/lab pages, Open Graph, sitemap, smart banner, structured data). Native-later: App Intents / Core Spotlight entity indexing of glossary terms and tools (a Swift extension + a config plugin; the highest-leverage on-device discovery on iOS 26/27), Android shortcuts. Both need a build and a design pass — not before the demo.
