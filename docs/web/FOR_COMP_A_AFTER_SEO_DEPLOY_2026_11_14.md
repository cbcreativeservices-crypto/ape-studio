# For Comp A: after the SEO deploy, plus round 2 notes (2026-11-14)

From ccode. One page. Nothing here needs SQL, and nothing changes on the database.

## 1. To do: the website (must-do D65)

The SEO finish from your handoff (COMP_A_TO_CCODE_2026-11-14_SEO_WEB_FINISH.md) is **live**.
- Deploy commit: bb16c61c on audio-tools-engine (web/ only, 37 files). The owner said "Yes, deploy now".
- Site: https://www.proaudiotrainingacademy.com

Your steps (section 5 of your own handoff):

| # | Where | What |
|---|---|---|
| 1 | Google Rich Results Test | Test the live `/` and `/founder`. Expect 0 errors (warnings are fine). |
| 2 | The live site | Check each item in section 4.2 of your handoff on www. |
| 3 | Google Search Console | Request re-indexing of `/` and `/founder`. |
| 4 | Back to ccode | Send `Downloads/COMP_A_TO_CCODE_<date>_SEO_LIVE_CHECK.md` with the results. |

What ccode already saw live on www:
- the home title is exact;
- one JSON-LD script holds the 4 nodes (organization, website, founder, app);
- the apple-itunes-app meta tag is present;
- 11 video stills, each the first frame of its own clip;
- both store badges;
- one self-canonical on each of the 19 sitemap pages;
- 19 lastmod dates;
- `/founder` has its own og:url.

The owner's answers:
- each page has its own link preview;
- Jazz piano is left out.

## 2. For your information only: Career Finder

Your text review flagged "Audio Test Engineer" listed under the wrong family. A check found 11 examples like it. On the owner's word ("fix the 11 career finder job listings"), each family page now shows a job from that same family:

| Family page | Was | Now |
|---|---|---|
| Manufacturing, Quality, Calibration & Repair | Audio Test Engineer | Audio Quality Engineer |
| Audio Business, Product, Sales & Operations | Studio Manager | Studio Business Manager |
| Sonic Branding, UX, Exhibits & Experience Design | Exhibit Audio Designer | Exhibition Audio Designer |
| Music for Picture, Scoring & Editorial | Orchestrator | Score Orchestrator |
| Session Performance, Voice & Musical Direction | Vocal Producer | Studio Vocalist |
| Telecom, Voice Quality & Communications Audio | Telecommunications Audio Engineer | Telephony Audio Engineer |
| Music Curation, Repertoire, Libraries & Editorial | Music Supervisor | Assistant Music Supervisor |
| Defense, Sonar & Acoustic Intelligence | Underwater Acoustics Engineer | Underwater Acoustics Engineer — Defense |
| Accessible Media & Audio Description | Audio Description Narrator | Audio Description Voice Talent |
| Music Retail, Rental & Instrument Services | Pro Audio Retail Specialist | Pro Audio Retail Sales Associate |
| Music Retail, Rental & Instrument Services | Backline Technician | Backline Rental Technician |

These changes are in the app only; the Career Finder lists are not on the server. A new test keeps every example in its own family. The two titles the owner chose to keep are the exceptions: Audio Instructor and Consumer Audio Product Specialist.

## 3. For your information only: the lab fix server edits match

Your edits (COMP_A_TO_CCODE_2026-11-14_LAB_FIX_APPLIED_1.md) are matched in the app:
- the Miking titles are "Bass Clarinet" and "Amplified Speakers and Leslie";
- `docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql` was regenerated, with 2 lines changed.

Nothing more is needed on the server.

One read-only check, if you have time:
- The Speech & Voice lab's first card now shows the glossary term **"Source-filter model"** (id `1ae9fda0-87df-4e8a-9bf3-78a71ebd39cf`). Until now it showed "miking".
- The owner kept the change.
- Please confirm that the row is live and that its plain-English text reads well for a beginner.
- If it needs a wording fix, send it back as a proposal; do not apply it.

## 4. Where the app stands

- Lab fix rounds 1 and 2, the Career Finder text and the 11 examples are committed and pushed on ota-after-approval-39-23.
- They are **not published.** They reach phones with the next OTA, and only on the owner's word.
