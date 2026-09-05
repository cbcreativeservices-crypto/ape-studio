# Store listing — source of truth

Every value the two stores show, in one place, with a note on where it actually lives. Nothing here is submitted; store metadata is entered by hand in App Store Connect and Play Console and **is not controlled by this repository**.

Drafted from the owner's SEO research (2026-09-05), corrected against the live data. Where a number differs from the brief, the repo/database value wins and the discrepancy is flagged.

## 1. Where each field lives

| Field | Controlled by | Current value |
|---|---|---|
| Installed app name (home screen) | `app.json` → `expo.name` | **"Pro Audio"** — conflicts with the target name, see §3 |
| Bundle id / package | `app.json` | `com.cbcreativeservices.apestudio` (both platforms) |
| Version / build number | EAS, `appVersionSource: remote` | 1.0.0 · iOS build 14 · Android versionCode 10 |
| App Store name, subtitle, keywords, description, promo text, category | **App Store Connect only** | not yet entered |
| Play title, short/full description, tags | **Play Console only** | not yet entered |
| Screenshots, feature graphic | store consoles | not yet produced |
| Support / privacy URLs | store consoles | site has `/support`, `/privacy`, `/terms` |

Setting `expo.name` does **not** set the App Store or Play listing name. They are three separate fields that should agree.

## 2. Verified numbers to use in copy

Measured 2026-09-05, not estimated.

| Claim | Verified value | Source |
|---|---|---|
| Glossary terms | **26,847** | `glossary` table; matches the app's Explore readout |
| Topics | **166** | live v3 curriculum (`achievements`, active version) |
| Subjects | **50** | same query, distinct subject |
| Fields | **20** | same query, distinct field |
| Labs | 46 catalogue entries | `src/screens/lab/labCatalog.ts` |
| Measurement tools | 8 | `src/screens/tools/toolsData.ts` |

**Two corrections to the brief's screenshot captions:**

- *"Look Up 10,000+ Audio Terms"* understates the corpus by more than half. Use **26,000+**, which is both true and a far stronger claim.
- *"Build Skills Across 26 Subjects"* is **wrong**. 26 is the subject count of the **retired v2 curriculum** (`src/data/course_topic_matrix_v2.json`), which three screens still import even though v3 is live. The live figure is **50 subjects across 20 fields**.

## 3. Open decision: the app's display name

The brief requires the name to be exactly `Pro Audio Training Academy` (26 characters, inside both stores' 30-character limit). The installed app is currently named `Pro Audio`.

This is the owner's call, not a silent edit, because it changes what appears under the icon on every user's home screen:

- **Store listing name** should be `Pro Audio Training Academy` regardless. That is the searchable field and the strongest ranking signal.
- **Installed name** (`expo.name`) is a separate trade-off. iOS truncates around 12 characters under the icon, so the full name would render as something like "Pro Audio Tr…". Keeping `Pro Audio` on the home screen while the store listing carries the full name is a normal, defensible split.

Recommendation: set the store name to the full name, leave `expo.name` as `Pro Audio`, and revisit only if the owner wants the longer form on the device.

## 4. Apple App Store

| Field | Limit | Draft | Length |
|---|---|---|---|
| Name | 30 | `Pro Audio Training Academy` | 26 |
| Subtitle | 30 | `Audio Glossary, Labs & Tools` | 28 |
| Keywords | 100 bytes | `engineering,acoustics,studio,recording,mixer,microphone,SPL,RTA,ear,sound,certificate,quiz,DAW` | 94 bytes |
| Promotional text | 170 | see below | |

All three lengths verified. The keyword field is a **hypothesis to test**, not a final answer: no word repeats the name, subtitle or category, there are no competitor names, no superlatives, and it stays under the conservative 100-byte reading of Apple's limit. Promotional text is not indexed for search.

Promotional text draft (161):
> A 26,000-term professional audio glossary, real measurement tools, and interactive labs — from cables and gain structure to room acoustics.

**Category:** Primary `Education`, Secondary `Reference`.

**Apple's AI-generated tags** are derived from the metadata and screenshots and reviewed by a human; the developer can deselect a wrong one but cannot add one. That makes concrete nouns in the description worth more than adjectives: glossary, SPL meter, RTA, spectrogram, reverb decay time, ear training, cable installation.

## 5. Google Play

| Field | Limit | Draft | Length |
|---|---|---|---|
| Title | 30 | `Pro Audio Training Academy` | 26 |
| Short description | 80 | `Learn pro audio with a free glossary, interactive labs, tools, and quizzes.` | 75 |
| Full description | 4000 | see §6 | |

Play indexes the full description, and its matching is theme-based rather than exact-token, so natural prose that covers a topic thoroughly beats repetition. Five store tags, chosen from Play's fixed list, should cover education, music and audio, and reference.

## 6. Long description — rules for whoever writes it

Not drafted here, because it must be written once and then ratified rather than rewritten by each pass. The constraints:

- **Lead with the free glossary.** It is the public entry point and the largest asset.
- Then lessons, labs, tools, quizzes, progress, and certificates, in that order.
- **Be exact about tiers:** what is free without an account, what a free account adds, what Academy membership unlocks, what institutional access covers.
- **State plainly that Academy certificates are internal educational credentials** and are not licences, degrees, or accredited qualifications.
- **Claim nothing the product cannot substantiate:** no job placement, no professional licensure, no measurement-grade accuracy. The app's own honesty notices already say the phone microphone is not a calibrated instrument; the store copy must not contradict them.
- No keyword stuffing, no competitor names (governance R1), no "best" or "#1".

## 7. Screenshot capture plan

Order matters more than count: most users never scroll past the second image.

| # | Caption | Screen and state |
|---|---|---|
| 1 | Look Up 26,000+ Audio Terms | Glossary, a real term expanded. Use a visually rich, widely-known term. Search field empty, no personal bookmarks visible. |
| 2 | Use Real Audio Analysis Tools | Tools hub, live previews running. This is the app's strongest visual. |
| 3 | Learn by Doing in Interactive Labs | A lab mid-interaction with its controls visible, not a title card. |
| 4 | Build Skills Across 50 Subjects | Explore, several fields expanded. |
| 5 | Test Your Knowledge and Track Progress | A study method mid-question, or the Dashboard rack with real progress. |
| 6 | Earn Academy Certificates with QR Verification | Certificate view. **Use a demo account**: no real name, no real credential token, no scannable code tied to a real person. |

For every capture: a device frame at the store's required size, the demo account signed in, no notification banners, no debug overlay, the status bar clean. Do not produce or redesign these during a technical pass — they are a design deliverable.

## 8. Custom product pages (plan only, not for launch day)

Apple allows up to 70 custom product pages, they can be given their own keywords, and on iOS 18 and later they can carry a deep-linked destination. Play has the equivalent in custom store listings.

Start with three, and only after the default listing and deep links are proven:

| Variant | Intent | Destination | Success metric |
|---|---|---|---|
| Glossary and reference | "audio glossary", "what is phantom power" | `/glossary` | install rate from that page |
| Interactive learning | "learn audio engineering", "audio course" | `/learn` | install → first lab completed |
| Tools and career | "spl meter", "rta app", "audio certification" | `/tools` | install → first tool session |

Do not create dozens at launch. Each one is a listing to maintain and a measurement to read.

## 9. Ratings

Ratings and recent review volume are ranking inputs on both stores. The eligibility logic is implemented and tested (`src/features/review/reviewEligibility.ts`), but the native prompt is **not wired**: `expo-store-review` is not installed and adding it needs a build. See the audit for the exact remaining step.
