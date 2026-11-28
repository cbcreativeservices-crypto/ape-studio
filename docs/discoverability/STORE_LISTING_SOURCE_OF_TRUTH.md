# Store listing — source of truth

Every value the two stores show, in one place, with a note on where it actually lives. Nothing here is submitted; store metadata is entered by hand in App Store Connect and Play Console and **is not controlled by this repository**.

Drafted from the owner's SEO research (2026-09-05), corrected against the live data. Where a number differs from the brief, the repo/database value wins and the discrepancy is flagged.

## 1. Where each field lives

| Field | Controlled by | Current value |
|---|---|---|
| Installed app name (home screen) | `app.json` → `expo.name` | **"Pro Audio"** — decided, see §3 |
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

## 3. The app's display name (decided)

The brief requires the name to be exactly `Pro Audio Training Academy` (26 characters, inside both stores' 30-character limit). The installed app is currently named `Pro Audio`.

This is the owner's call, not a silent edit, because it changes what appears under the icon on every user's home screen:

- **Store listing name** should be `Pro Audio Training Academy` regardless. That is the searchable field and the strongest ranking signal.
- **Installed name** (`expo.name`) is a separate trade-off. iOS truncates around 12 characters under the icon, so the full name would render as something like "Pro Audio Tr…". Keeping `Pro Audio` on the home screen while the store listing carries the full name is a normal, defensible split.

**Decided (owner, 2026-09-06):** the store name is the full `Pro Audio Training Academy`; the installed name stays `Pro Audio` — abbreviated on purpose rather than truncated by the OS.

## 4. Apple App Store — APPROVED 2026-11-27, owner

Approved copy (theme "accuracy and trust"), relayed by Comp A 2026-11-27 17:22 PT. **Use it word for word; do not rewrite.** The owner enters it in App Store Connect himself.

| Field | Limit | Approved | Length |
|---|---|---|---|
| Name | 30 | `Pro Audio Training Academy` (unchanged) | 26 |
| Subtitle | 30 | `Trusted Glossary & Calculators` | 30 |
| Keywords | 100 bytes | `engineering,sound,acoustics,mixing,live,studio,recording,course,certificate,SPL,decibel,microphone` | 98 bytes |
| Promotional text | 170 | `Accurate audio education from a college professor. 35,000+ terms and 166 calculations, free for everyone every week, so you learn it right and work safely.` | 155 |

**Category:** Primary `Education`, Secondary `Reference`.

## 5. Google Play — APPROVED 2026-11-27, owner

| Field | Limit | Approved | Length |
|---|---|---|---|
| Title | 30 | `Pro Audio Training Academy` (unchanged) | 26 |
| Short description | 80 | `Accurate audio education: free glossary and calculators, labs and credentials` | 77 |
| Full description | 4000 | see §6 | 3,996 |

## 6. Long description — APPROVED 2026-11-27, owner

The body is the same on both stores; each keeps its own SUBSCRIPTIONS section from the live listing. Source files: `Downloads/2026-11-27_COMP_A_TO_CCODE_STORE_LISTING/APPLE_DESCRIPTION_APPROVED.txt` (3,969) and `PLAY_DESCRIPTION_APPROVED.txt` (3,996).

**Facts this copy states, which the app must keep true** (tell Comp A first if any changes): glossary 14 definitions a week free, guests included, searching free (`GLOSSARY_WEEKLY_LIMIT` = 14); calculators 5 a week (`CALC_WEEKLY_LIMIT` = 5); Academy members unlimited; 35,000+ terms (`academy_stats.terms` 35,145), 166 calculations, 171 topics, 36 programs; verified instructors get a class code. Checked by ccode 2026-11-27 against the code and the live `get_academy_stats()` (35,145 · 171 · 36): all match, except the one below.

> ⚠ **FLAG (ccode 2026-11-27, not changed, owner/Comp A to decide):** the line "Explore 20 career fields and more than 1,800 real roles with the Career Finder" — the Career Finder has **42 career families** across **18 fields** (`src/data/careerFamilies.json`, `src/features/careerfinder/families.ts`); roles total 1,896, so "more than 1,800" is true. Nothing in the app says 20.

### 6a. Apple

```text
Accurate. Trusted. Free for everyone, every week.

Pro Audio Training Academy is independent, college-level audio education built on one principle: accuracy keeps people safe. Look up 35,000+ audio terms and run 166 audio calculations free every week, then learn the whole craft of sound, from your first signal to professional mastery.

WHY ACCURACY MATTERS
Much of the audio information online today is fast, confident and wrong. In audio, wrong answers don't just sound bad: they blow speakers, damage hearing, overload circuits and put people in danger on stages and rigging. The Academy gives you one source you can rely on, written to a college-classroom standard and continually audited for accuracy.

THE GLOSSARY AND CALCULATORS ARE FREE
Everyone gets the glossary and calculators free every week, no account needed: 14 definitions and 5 calculations a week, and searching is always free. It is the Academy's thank-you to the audio community, so anyone can check the facts and do the math before they do the work. The weekly limit is what keeps the lights on: running the servers costs real money, and memberships pay for it.

FOUNDED BY A PROFESSOR OF AUDIO
Pro Audio Training Academy was founded by a professor of audio with 28 years of college teaching experience, a graduate of Berklee College of Music (Dual BA and MA), and a working professional with 40 years in live sound, studio recording and production. Every topic, flashcard, lab and credential is built on a disciplined, standards-based approach to teaching, training and measuring real competency, the same rigor used in the college classroom and expected on professional stages and in studios.

COLLEGE-LEVEL DEPTH, WITHOUT COLLEGE TUITION
• A 171-topic curriculum across 36 professional programs, from studio and live sound to acoustics, broadcast and electronics
• Verifiable Academy credentials, with QR verification
• Safety taught up front, as part of the required curriculum, not as an afterthought
Academy credentials are educational credentials from Pro Audio Training Academy. They are not a college degree, license or accredited qualification.

FOR STUDENTS AND INSTRUCTORS
The Academy supplements the classroom; it doesn't replace it. Verified instructors get a class code, and students who choose to share their progress appear on the instructor's class screen. Schools can license seats for their students at a discount: proaudiotrainingacademy.com/institutions

INDEPENDENT, AND BUILT WITH AI THE RIGHT WAY
The Academy is independent: no corporate owner and no shareholders deciding what you may learn for free. AI was used as it should be, as a tool in an expert's hands. It let one educator build a resource on a scale that once took a large company, and every piece is directed, checked and audited by the Founder & Editor.

LEARN BY DOING
• Interactive lessons, flashcards and scenarios
• Hands-on Learning Labs for ear training, equipment, mixing and microphone technique, plus live measurement tools
• Master one topic at a time; quizzes unlock as you progress

PLAN YOUR CAREER
• Explore 20 career fields and more than 1,800 real roles with the Career Finder
• Connect with employers in the Audio Community Directory

NEW TO AUDIO? Start Here: Your First Steps in Audio walks you from your very first signal to a solid foundation.

Start free with the weekly glossary and calculator allowance, Pro Audio Safety and DAW Fundamentals. Membership unlocks the complete Academy, with unlimited glossary and calculators.

SUBSCRIPTIONS
Academy Monthly and Academy Annual renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple ID settings. Academy Lifetime is a one-time purchase. Current prices are shown in the app and on the App Store before you buy.
Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://www.proaudiotrainingacademy.com/privacy
```

### 6b. Google Play

```text
Accurate. Trusted. Free for everyone, every week.

Pro Audio Training Academy is independent, college-level audio education built on one principle: accuracy keeps people safe. Look up 35,000+ audio terms and run 166 audio calculations free every week, then learn the whole craft of sound, from your first signal to professional mastery.

WHY ACCURACY MATTERS
Much of the audio information online today is fast, confident and wrong. In audio, wrong answers don't just sound bad: they blow speakers, damage hearing, overload circuits and put people in danger on stages and rigging. The Academy gives you one source you can rely on, written to a college-classroom standard and continually audited for accuracy.

THE GLOSSARY AND CALCULATORS ARE FREE
Everyone gets the glossary and calculators free every week, no account needed: 14 definitions and 5 calculations a week, and searching is always free. It is the Academy's thank-you to the audio community, so anyone can check the facts and do the math before they do the work. The weekly limit is what keeps the lights on: running the servers costs real money, and memberships pay for it.

FOUNDED BY A PROFESSOR OF AUDIO
Pro Audio Training Academy was founded by a professor of audio with 28 years of college teaching experience, a graduate of Berklee College of Music (Dual BA and MA), and a working professional with 40 years in live sound, studio recording and production. Every topic, flashcard, lab and credential is built on a disciplined, standards-based approach to teaching, training and measuring real competency, the same rigor used in the college classroom and expected on professional stages and in studios.

COLLEGE-LEVEL DEPTH, WITHOUT COLLEGE TUITION
• A 171-topic curriculum across 36 professional programs, from studio and live sound to acoustics, broadcast and electronics
• Verifiable Academy credentials, with QR verification
• Safety taught up front, as part of the required curriculum, not as an afterthought
Academy credentials are educational credentials from Pro Audio Training Academy. They are not a college degree, license or accredited qualification.

FOR STUDENTS AND INSTRUCTORS
The Academy supplements the classroom; it doesn't replace it. Verified instructors get a class code, and students who choose to share their progress appear on the instructor's class screen. Schools can license seats for their students at a discount: proaudiotrainingacademy.com/institutions

INDEPENDENT, AND BUILT WITH AI THE RIGHT WAY
The Academy is independent: no corporate owner and no shareholders deciding what you may learn for free. AI was used as it should be, as a tool in an expert's hands. It let one educator build a resource on a scale that once took a large company, and every piece is directed, checked and audited by the Founder & Editor.

LEARN BY DOING
• Interactive lessons, flashcards and scenarios
• Hands-on Learning Labs for ear training, equipment, mixing and microphone technique, plus live measurement tools
• Master one topic at a time; quizzes unlock as you progress

PLAN YOUR CAREER
• Explore 20 career fields and more than 1,800 real roles with the Career Finder
• Connect with employers in the Audio Community Directory

NEW TO AUDIO? Start Here: Your First Steps in Audio walks you from your very first signal to a solid foundation.

Start free with the weekly glossary and calculator allowance, Pro Audio Safety and DAW Fundamentals. Membership unlocks the complete Academy, with unlimited glossary and calculators.

SUBSCRIPTIONS
Academy Monthly and Academy Annual renew automatically until you cancel. Cancel anytime in the Google Play Store app under Payments & subscriptions, then Subscriptions. You keep access until the end of the period you have paid for. Academy Lifetime is a one-time purchase. Current prices are shown in the app and on Google Play before you buy.
Terms of Service: https://www.proaudiotrainingacademy.com/terms
Privacy Policy: https://www.proaudiotrainingacademy.com/privacy
```

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
