# G4 · Mixing Guides (MixingGuides hub + 50 guides) — beginner orientation audit

Auditor G4 · 2026-11-14 · web preview `http://localhost:8142/#labpreview/MixingGuides` (hub) and `#labpreview/MixingGuide/<id>` (guides), phone 390 x 844, member, intro cards unseen, SOUND OFF (the guides are reading pages; nothing needs sound).
Owner rule respected: the world map is left alone in every suggestion (no changes proposed to the map itself).
Method: hub walked and searched; the shared guide layout walked in full on Pop (g01); then every one of the 50 guides opened in the browser and its on-screen text captured (section list, length, first lines, unexplained terms) to note per-guide differences briefly, as the brief allows. Guide content files: `src/screens/lab/mixingGuides/data/guides/g01…g50`.
Note on the preview: on a desktop browser the map caption reads "Point at a style … Click one to open it." The code (GuideWorldMap.tsx line 133-135) switches to "Swipe through the styles … Tap one to open it." on touch devices, so a phone shows the touch wording. The intro card, however, says "Press and hold a style card" — a third description of the same gesture.

---

## Hub · Mixing Guides menu · `#labpreview/MixingGuides`

| Field | Finding |
|---|---|
| First look | Arrival stack: a glossary popup ("Mixing — Mixing is where many tracks become one polished piece…", CONTINUE), then the intro card, then the page. Under the header ("50 music styles — what the audience expects, and where to start the mix") the world map is the eye-catcher, then two short paragraphs, "When to bring in a pro ›", a search field ("Find a style — salsa, metal, k-pop…"), "0 read", and a two-column grid of 50 numbered style cards, each with a one-line priority. Thinks: "a library of styles — pick my music". Inviting. |
| Overwhelm | 2. Lots of cards, but it reads as a menu, not a lesson. The card one-liners are where the jargon is ("Kick-and-sub relationship: a short, tuned, punchy kick that the bass ducks around, translating to a massive sub array without mud"; "palm-muted guitars"; "surdo-like tamborzão hits and 808"). |
| Knows what it is learning? | Yes: "how each style is usually mixed". "Starting points, not rules" is said up front: excellent framing. |
| Knows what to do first? | Yes: tap your style, or search. Search works well (typing "brazil" gives "4 matches": Latin Pop, Sertanejo, Brazilian Funk, MPB / Bossa Nova — it searches countries, not just names). The press-and-hold-to-light-the-map gesture is hidden (only in the intro card and the map caption). |
| Words they would not know | (card lines) intelligibility, kick/808, low end, sub, ducks, mud, dembow (glossed), clave (glossed), timbal, four-on-the-floor, palm-muted, pocket, one-drop, offbeat, stems, dub stage, "ride cymbal", "walking bass". Several cards gloss foreign terms in brackets (dembow, tololoche, guitarrón, clave) — good and consistent with the owner's gloss rule. |
| Follows / continues? | Yes. "0 read" counter gives a sense of progress without "N of total". |
| What works | "Starting points, not rules. Put on a reference track in the style, match its level…"; search by country; numbered cards; one-line priority per style so you can browse by what the music cares about; non-English terms glossed on the cards. |
| Suggestions | 1. (S) Use one description of the map gesture everywhere (intro card vs caption). 2. (S) Add a "Not sure? Start with Pop — the guides share one layout" pointer above the grid for total beginners. 3. (S) Card one-liners: keep them but swap the heaviest jargon for plain words on the card (e.g. EDM: "A punchy kick and deep bass that take turns, huge on festival speakers"); the guide itself can hold the technical line. 4. (S) A filter chip row (Vocal-led · Groove-led · Acoustic/orchestral) would help a beginner who does not know genre names. |
| Hobbyist | They will search their own genre and go straight in; the hub serves them well. |


---

## Shared guide layout · judged on Pop (g01) · `#labpreview/MixingGuide/pop` (reached by tapping a card)

| Field | Finding |
|---|---|
| First look | Header "POP · Mixing guide 1 of 50", a strip "MODULE 1 / 50 ▾" with ‹ PREV / NEXT ›, then WHAT THE AUDIENCE EXPECTS (one plain sentence) and MIX PRIORITY #1 in a highlight, the "Starting points, not rules" line, an AT A GLANCE table (ORIGIN / REGION, TYPICAL TEMPO, TYPICAL ENSEMBLE SIZE, LIVE SPL (FOH, AVERAGE), a WHO hearing note, STUDIO / STREAMING LOUDNESS), then THE GUIDE: 13 collapsed sections with OPEN ALL ▾, MARK AS READ and NEXT: <next style> ›. The eye lands on MIX PRIORITY #1: exactly the right first thing. |
| Overwhelm | Top of page: 2 (two plain sentences up front). AT A GLANCE: 4 — the very first data a beginner meets is "95–100 dBA LAeq,15min (common safe-listening cap 100 dBA); 105–115 dBC with sub-heavy material" and "Masters commonly −9 to −7 LUFS-I". Opened in full (OPEN ALL): about 2,450 words on a phone, with dense tables (EQ: "HPF 80–100 Hz; −2 to −4 dB at 200–400 Hz if boxy"; compression: "4:1–6:1 (FET) · 1–5 ms / 50–100 ms"). For a beginner the guide body is a reference manual, overwhelm 5 if opened all at once. |
| Knows what it is learning? | Yes, at the top ("what the audience expects", "MIX PRIORITY #1"). Sections 01 (Purpose & audience), 05 (Balance & blend — the hierarchy "lead vocal → kick and snare/clap → bass/sub → …") and 12 (Engineer's notes & common mistakes) are the beginner-useful core; 06-08 and 10-11 are for practitioners. |
| Knows what to do first? | Yes: read the two top lines (intro card says so), then open a section. The collapsed accordion keeps the first view calm (good). |
| Words they would not know | (top) BPM, "playback/tracks", SPL, FOH, dBA, LAeq,15min, dBC, LUFS-I, "normalize". (body) 808, sub, stems, "ear candy", risers, "Micro-/Macro-dynamics", sidechain, HPF, de-ess, FET / opto / VCA-style compressor, "Gain reduction", "Parallel version crushed", plate reverb, pre-delay, dotted 1/8, slapback, "micro-pitch ±5–10 cents", saturation, "gain-before-feedback", IEMs, scenes/snapshots, PLR, dBTP. |
| Follows / continues? | Yes. MARK AS READ and "NEXT: HIP-HOP / RAP ›" make the path clear; the hub counts reads ("0 read"). Nothing tests understanding (by design: a reference library). |
| What works | MIX PRIORITY #1 as the headline of every style (one sentence a beginner can act on); "Starting points, not rules" repeated on every guide; the balance hierarchy written as a ranked list; "Engineer's notes & common mistakes" in plain imperative bullets ("Start from the vocal", "Check on small speakers"); reference recordings with "match their level before you compare"; the keyboard-bass caveat in the EQ section ("Before you low-cut the keys: Talk with the keyboardist first…"), which matches the owner's piano/bass rule; hearing-safety note on every guide. |
| Suggestions | 1. (S) The strip says "MODULE 1 / 50" and the header "Mixing guide 1 of 50": a guide is not a module, and "N of total" appears twice. Use "GUIDE ▾" (contents) without the count, or drop the count (owner rule on "N of total"). (SHARED) 2. (M) Move AT A GLANCE below THE GUIDE or collapse it to ORIGIN and TEMPO only, with SPL / loudness in a "Numbers" fold; a beginner should not meet "LAeq,15min" in the first screen. 3. (M) Mark sections by audience: a small "Start here" tag on 01, 05 and 12 (the beginner core), and "Reference" on 06-08, 10, 11. 4. (S) Add a one-line plain reading before each table ("EQ table: where to cut (take away) and boost (add) for each instrument; numbers are starting points") and say in words what the shorthand means once (HPF = remove the lowest rumble; dB = how much; Hz = which pitch). 5. (S) OPEN ALL turns the page into ~2,500 words; prefer opening one section at a time, or label OPEN ALL "Open all (long read)". |
| Hobbyist | This is where the guides shine: concrete starting numbers, style-specific mistakes, references. They will use the EQ and compression tables directly. |


---

## All 50 guides walked · per-guide differences (shared layout judged above)

Every guide was opened on screen in order (NEXT › from Pop through French Variété / Chanson), OPEN ALL pressed, and its full on-screen text captured and checked. All 50 share exactly the same 13 sections in the same order (Purpose & audience expectations · Instruments · Ensemble & arrangement · Dynamics · Balance & blend · EQ starting points · Compression & dynamics processing · Effects & amounts · Vocal treatment · SPL & loudness · Live vs studio · Engineer's notes & common mistakes · Reference recordings), the same AT A GLANCE table and the same top two lines. Opened in full each runs 2,186–3,058 words. So the shared-layout findings above apply to every guide; below are only the differences a beginner would feel.

Columns: words (fully opened) · glosses = bracketed in-line explanations counted on screen (more = friendlier to a newcomer, but longer sentences) · keys = the "low-cut the keys / talk with the keyboardist" caution present · MIX PRIORITY #1 readability for a total beginner (P plain · ~ partly · J jargon-led) · note.

| # | Guide | words | glosses | keys | Priority | Beginner note |
|---|---|---|---|---|---|---|
| 01 | Pop | 2455 | 39 | yes | P | Shared-layout reference page (see above). Best first guide for a beginner. |
| 02 | Hip-Hop / Rap | 2186 | 31 | no | ~ | Shortest guide. "kick/808" in the headline unexplained; 808 is the core idea of the style, gloss it once at the top. |
| 03 | Rock | 2277 | 45 | yes | P | "drums-and-bass engine" is a friendly image. |
| 04 | Contemporary R&B | 2271 | 35 | yes | P | "every breath and run audible" — "run" (vocal run) unexplained. |
| 05 | EDM / Festival Electronic | 2263 | 35 | no | J | Headline is the most jargon-dense on the hub ("ducks around", "sub array", "mud"). |
| 06 | Country | 2372 | 37 | yes | P | Plain; pedal steel and fiddle named and described in Instruments. |
| 07 | Latin Pop | 2339 | 66 | yes | P | Many Spanish terms glossed in place (balada romántica, bolero) — good. |
| 08 | Reggaeton | 2586 | 62 | no | ~ | dembow glossed in the headline; "timbal" not. |
| 09 | Regional Mexican | 2746 | 134 | no | ~ | Most glossed guide; headline has nested brackets "(tuba, tololoche (upright bass), guitarrón (large acoustic bass) or bass)" — hard to read. Four sub-styles (banda, mariachi, norteño, corridos tumbados) in one guide: a beginner may want them separated. |
| 10 | K-pop | 2434 | 43 | yes | P | "Every member's voice identifiable" is a clear, style-specific goal. |
| 11 | Alternative / Indie Rock | 2437 | 28 | yes | P | Fewest glosses, plain language; fine. |
| 12 | Christian Contemporary / Worship | 2421 | 28 | yes | P | Strong human goal ("invites the room to sing"). |
| 13 | Bollywood / Indian Film Music | 2423 | 88 | no | ~ | "playback vocal" means the film playback singer, not DAW playback — a beginner will misread it after the mixing labs used "playback" differently. Gloss it. |
| 14 | Afrobeats | 2393 | 46 | yes | ~ | clave glossed; "rimshot" not. |
| 15 | Classical (Orchestral) | 2587 | 38 | yes | P | The only guide where the goal is a natural picture of the hall rather than a built mix; worth one line telling beginners this guide works differently. |
| 16 | Film & Video Game Score | 2481 | 53 | no | J | Headline mentions "stems", "dub stage", "game engine"; the longest "expects" line (43 words). Most technical for a newcomer. |
| 17 | Trap | 2358 | 37 | yes | ~ | "808–kick relationship", "pitched, sustained sub"; vivid "rattles car trunks" helps. |
| 18 | House | 2422 | 36 | no | ~ | "four-on-the-floor" unexplained in the headline (again in Techno and Disco). |
| 19 | Heavy Metal | 2402 | 54 | no | J | "Note definition in the low end", "palm-muted" — jargon-led headline. |
| 20 | Gospel | 2548 | 39 | yes | P | Hammond organ through a rotating speaker described in Instruments. |
| 21 | Jazz | 2352 | 53 | yes | ~ | "ride cymbal", "walking bass" unexplained in headline; organ-trio note present. |
| 22 | Soul | 2479 | 51 | yes | ~ | "pocket" unexplained. |
| 23 | Hard Rock | 2393 | 41 | yes | ~ | "mid-forward guitars" unexplained. |
| 24 | J-pop | 2360 | 36 | yes | P | Plain. |
| 25 | C-pop / Mandopop | 2449 | 72 | yes | P | Chinese instruments section well glossed. |
| 26 | Indie Pop | 2469 | 32 | yes | P | "one person talking to you" — the friendliest headline in the set. |
| 27 | Punk / Pop-Punk | 2324 | 40 | no | P | Plain. |
| 28 | Reggae | 2358 | 60 | no | ~ | "one-drop kick" unexplained in headline; "skank guitar" / "bubble" organ glossed in the body. |
| 29 | Sertanejo | 2521 | 88 | no | P | Two-voice harmony goal is clear; Portuguese instrument names glossed. |
| 30 | Punjabi Pop / Bhangra | 2666 | 89 | no | ~ | Dhol, tumbi, algoza, chimta each have an Instruments entry; "Dhol-driven" in the headline assumes the word. |
| 31 | Blues | 2488 | 40 | yes | P | "voice and lead instrument in conversation" — plain and musical. |
| 32 | Funk | 2320 | 48 | yes | ~ | "ghost notes", "the one" unexplained in headline. |
| 33 | Techno | 2321 | 43 | no | ~ | "mono, solid, physical four-on-the-floor". |
| 34 | Folk / Singer-Songwriter | 2477 | 42 | yes | P | Plain. |
| 35 | Brazilian Funk (Baile Funk) | 2479 | 89 | no | J | "surdo-like tamborzão hits and 808" — three unexplained terms in the headline. |
| 36 | Dancehall | 2518 | 71 | no | ~ | Headline glosses riddim and deejay in brackets — good, but dense. |
| 37 | Amapiano | 2294 | 42 | no | ~ | "log drum" is the style's core and is explained in Instruments; the headline assumes it. |
| 38 | Salsa | 3058 | 131 | yes | ~ | Longest guide; the owner-approved "Caution — don't low-cut the piano" note is present and clear. Heavy glossing makes sentences long ("piano montuno (the piano's repeating syncopated pattern), bass tumbao (the bass's repeating rhythm pattern)…"); a small word box at the top of the guide would read easier than repeating brackets. |
| 39 | Bachata | 2405 | 94 | no | ~ | "requinto", "güira" — glossed in the body, not in the headline. |
| 40 | Cumbia | 2555 | 107 | yes | ~ | "bass on 1 and the 'and' of 2" — counting language a beginner will not follow. |
| 41 | Arabic Pop | 2498 | 111 | yes | ~ | "ornament, microtone", "darbuka" in headline; the body explains them. |
| 42 | Turkish Pop | 2633 | 109 | no | ~ | Similar to Arabic Pop; many instruments glossed. |
| 43 | Dangdut | 2511 | 96 | yes | ~ | "kendang", "dhut / tak" in headline — the sound-words actually help. |
| 44 | MPB / Bossa Nova | 2675 | 87 | yes | P | Plain goal ("voice and nylon-string guitar as an equal, intimate pair"). |
| 45 | Drum & Bass | 2410 | 60 | no | ~ | "mono, controlled sub", "Reese bass" (body). |
| 46 | Lo-Fi / Chillhop | 2300 | 40 | no | ~ | "swung", "pocket", "dusty snare" — evocative but unexplained. |
| 47 | Bluegrass / Americana | 2344 | 50 | no | P | Plain. |
| 48 | Musical Theater | 2306 | 36 | yes | P | "Every word intelligible" — plain; body mics and float mics described. |
| 49 | Disco / Nu-Disco | 2470 | 55 | yes | ~ | "four-on-the-floor", "octave-jumping bass". |
| 50 | French Variété / Chanson | 2405 | 59 | yes | P | Full text read on screen. Clear, warm writing; good beginner habit in Engineer's notes ("If you don't speak French, check intelligibility with someone who does"). |

Patterns across the 50:
- Headlines (MIX PRIORITY #1, also the hub card line): 20 plain, 26 partly, 4 jargon-led (EDM, Film & Game Score, Heavy Metal, Brazilian Funk); Regional Mexican's nested brackets are a readability problem of their own. The jargon-led ones are groove/low-end styles where the key word (808, sub, four-on-the-floor, palm-muted, tamborzão) is the whole point and is never glossed at the top.
- Glossing is excellent for non-English terms (owner rule followed throughout) but almost absent for English studio jargon (808, sub, pocket, four-on-the-floor, ghost notes, ride cymbal), which a beginner equally does not know.
- Length is uniform (~2,200–3,000 words opened); no guide offers a short beginner summary beyond the two top lines.

---

## Interaction checks on the guides

- MARK AS READ adds "· read" to the header and "✓ READ" at the foot.
- Completion: I pressed MARK AS READ on ONE guide only (French Variété), yet FINISH showed "LAB COMPLETE · Every guide is done · ✓ 50 DONE". Visiting a guide (paging through with NEXT) appears to count it as done, so MARK AS READ has no visible role in completion, and a learner who taps NEXT 49 times "completes" the lab. The hub showed "0 read" before I started. A beginner cannot tell what "read" means here. (Observed; the coordinator restores local data in the morning.)

---

## End screen · What's left (Mixing Guides)

| Field | Finding |
|---|---|
| First look | "LAB COMPLETE · Every guide is done. Review any of them, or practice the whole lab again." with ✓ 50 DONE, REVIEW ▾, PRACTICE AGAIN FROM THE START, DONE · BACK TO THE GUIDES. |
| Overwhelm | 1. |
| Knows what it is learning? | Partly: the screen says done, not what was learned. |
| Knows what to do first? | Yes. |
| Words they would not know | none. |
| Follows / continues? | Yes. |
| What works | Calm, clear completion. |
| Suggestions | 1. (S, SHARED wording) "PRACTICE AGAIN" is lab-frame wording; for a reading library say "Read again from the start". 2. (S) Count a guide as read only on MARK AS READ (or on reaching the foot), and say which on the hub. 3. (S) Offer "Read next: …" (a related style) rather than only "done". |
| Hobbyist | Fine. |

---

## Lab verdict · Mixing Guides (hub + 50 guides + end screen walked)

**The beginner's journey.** The hub is inviting: a world map, "starting points, not rules", a search that finds styles by country, and 50 cards each led by a one-sentence mix priority. Opening a guide, the first two lines (what the audience expects, MIX PRIORITY #1) are the best beginner content in the whole mixing area: one clear goal per style. Below that the guide becomes a professional reference — an AT A GLANCE table that starts with LAeq and LUFS, then 13 sections totalling ~2,400 words of tables and engineering shorthand. A beginner can take away the priority, the balance hierarchy and the common mistakes; the rest is for later (or for the hobbyist, who is the real audience here and is well served).

**3 biggest orientation problems**
1. AT A GLANCE puts dBA LAeq,15min / dBC / LUFS-I / normalization in the first screen of every guide.
2. No signposting of which sections are beginner-core (Purpose, Balance & blend, Engineer's notes) and which are reference tables (EQ, Compression, Effects, SPL, Live vs studio); OPEN ALL dumps ~2,500 words.
3. English studio jargon in the headlines and tables is not glossed (808, sub, four-on-the-floor, pocket, palm-muted), while non-English terms are glossed thoroughly; plus "MODULE n / 50" and "Mixing guide n of 50" labels, and completion that counts visits, not reading.

**3 best things**
1. MIX PRIORITY #1 per style — one sentence that tells a beginner what to protect.
2. "Starting points, not rules … match its level, listen and adjust" on every page, plus references with "match their level before you compare".
3. Careful, respectful style knowledge: glossed non-English terms, the keyboard/piano low-end caution (owner rule; in 30 guides, and in full in Salsa), and style-specific common mistakes.

**First 30 seconds (rewrite suggestion).** Hub top line: "Pick a music style to see what its listeners care about most and where engineers usually start. New to mixing? Open Pop first — every guide has the same layout." In each guide, show WHAT THE AUDIENCE EXPECTS and MIX PRIORITY #1, then a three-item "Start here" (Balance & blend · Common mistakes · Reference recordings), with AT A GLANCE and the numeric tables below under "For the studio".
