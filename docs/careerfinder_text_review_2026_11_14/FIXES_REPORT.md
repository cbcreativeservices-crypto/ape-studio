# Career Finder text fixes: report (2026-11-14)

**What this is:** Comp A's Career Finder text review (`2026-11-14_FROM_COMP_A_CAREER_FINDER_TEXT_REVIEW.md`) applied to the app, on the owner's word: "assign an agent in the background to work on this".
**Repo:** `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`. **Nothing was committed or pushed.** No eas, no publishing. The coordinator commits after the full gate.

## 1. Summary

| | Count |
|---|---|
| Comp A single findings (table rows) | 57 |
| APPLIED | 51 (47 in round 1, plus the 4 title renames in round 2) |
| SKIPPED | 0 |
| OWNER TEXT (left for the owner) | 4 |
| OWNER DECISION (Comp A wrote "owner to choose") | 2 |
| Patterns (15) | 11 applied in full (round 2 completed 10 and 15), 2 in part (11 hyphens, 12 Title Case: the rest is owner text or held by an owner example), 2 owner text |

**Round 2 (coordinator follow-up, same day):** the build script `scripts/build-career-index.py` was added to my files. What changed:
- **Five hooks added:**
  - `settings`: replaces a family's "where people work" list, applied early;
  - `renameTitles`, `renamePreparation`, `renameWorkModel` and `sourceNames`: wording only, applied LAST, so every other override keeps matching the workbook's exact text.
  - Each hook stops the build if it changes nothing.
- **The 5 D59 "where people work" fixes are now in the overrides** (`settings`).
  - **Proof:** with the hooks and those 5 entries, and before any new change, a scratch rebuild reproduced **both** files byte for byte (line endings normalized): `careerFamilies.json` = HEAD, and `careerIndex.json` = the round-1 file. Either file can now be rebuilt safely.
- **The 4 skipped title renames and Pattern 11 are applied where they are not owner text.** Each was checked against a public source first.
- **Patterns 10 and 15, skipped in round 1 for the same file-scope reason, are applied too:** no serial comma in the Part D lines, and source acronyms spelled out.
- Both files were rebuilt and every column diffed (section 4).
- Tests were updated and the career set rerun: 373 of 373 pass.

**Most important:**
1. **"1 of 28 answers were …" is fixed** with a real one/many branch for the answers, the activities and the dashed bars (`unknownNote` in `src/features/careerfinder/scoring.ts:218`).
2. **The three softened requirement lines now say "required"** (SLPA, audiologists, speech-language pathology and allied clinical titles). I checked them against BLS and ASHA first. The line under every expanded title now says a stated requirement *is* required.
3. **One licensing warning** is used in all three places (`LICENSED_WARNING`, `src/features/careerfinder/educationNote.ts:33`).
4. **Problem found and fixed on the way: the career index and its build had drifted apart.** The 2026-11-11 copy commit (16f59f11, D59) edited `src/data/careerIndex.json` (46 preparation lines) and `src/data/careerFamilies.json` (5 "where people work" lines) directly, not through `scripts/career-index-overrides.json`. If anyone reran the build, all 51 fixes would come back out. I moved the 46 preparation lines into the overrides and proved the rebuild was byte-identical to the committed file, then made this review's changes. In round 2 the 5 family lines went into the overrides through the new `settings` hook, also proved byte-identical, so both files are now safe to rebuild.

## 2. Every finding

Status: APPLIED / SKIPPED (why) / OWNER TEXT / OWNER DECISION. Line numbers are in the working tree after the edits.

### Single findings (Comp A section 3)

| ID | Old | New | file:line | Status |
|---|---|---|---|---|
| CF-A0108–A0110 | {n} of {QUESTION_COUNT} answers were “I don’t know enough about this”. Those activities are unexplored, not disliked — the dashed bars had no rating at all. | You chose “I don’t know enough about this” for {n} of the 28 questions. That activity / Those activities are unexplored, not disliked. The dashed bar has / The dashed bars have no rating. (branched on the real counts: answers, distinct activities, fully unknown activities) | scoring.ts:218 (`unknownNote`), CareerFinderResultsScreen.tsx:222 | APPLIED. This is a real singular/plural branch, not a word swap. Two "I don't know" answers on one activity read "That activity". |
| CF-E0005 | The careers built on sound level and acoustics — find your fit. | Careers built on sound level and acoustics. | src/features/intro/samplerStops.ts:92 | APPLIED |
| CF-A0072 | Five audio career families lean on what you said you would enjoy. … | (unchanged) | CareerFinderResultsScreen.tsx:30 | OWNER TEXT |
| CF-A0073 | These are possibilities to explore — not limits … and these will too. | (unchanged) | CareerFinderResultsScreen.tsx:31 | OWNER TEXT |
| CF-A0137 | Did these results give you a direction to explore | (unchanged) | CareerFinderResultsScreen.tsx:273 | OWNER TEXT |
| CF-A0309 | Not sure | (unchanged) | questions.ts:62 | OWNER TEXT |
| AC-0589 | Occupational Hearing-Conservationist | Occupational Hearing Conservationist | overrides `renameTitles` → careerIndex.json | APPLIED (round 2). Verified: CAOHC names the credential "Occupational Hearing Conservationist" (OHC). The LICENSED flag is kept (pinned in the test). |
| CF-A0004 | You’ll answer for activities, not job titles. Answer for enjoyment only — … say so: that is … | You’ll rate activities, not job titles. Rate each one only by how much you would enjoy it. Whether you would be good at it, or could do it today, does not matter here. If you don’t know what an activity is like, say so. That is a useful answer, never a low score. | CareerFinderScreen.tsx:34 | APPLIED |
| CF-A0006 | … determine what you are capable of learning. No percentages, no verdicts, no talent scores — possibilities … | … decide what you can learn. It gives no percentages, verdicts or talent scores, only possibilities to explore, each with a place to start learning. | CareerFinderScreen.tsx:40 | APPLIED |
| CF-A0040/A0041 | … across fourteen kinds … the families that lean on what you enjoy come to the top — with the reason … | … across {DIMENSION_CODES.length} (=14) kinds … the families that draw most on what you enjoy come to the top. Each one shows why it appeared and which Academy topics lead into it. | CareerFinderScreen.tsx:135 | APPLIED |
| CF-A0071 | … It simply marks an activity you have not met yet. | … It only marks an activity you haven’t tried yet. | CareerFinderQuizScreen.tsx:199 | APPLIED |
| CF-A0112 | OTHER PROMISING DIRECTIONS | OTHER FAMILIES TO EXPLORE | CareerFinderResultsScreen.tsx:227 | APPLIED |
| CF-A0114 | Same strongest interest, a different corner of the audio world. … — that is part of why … | It shares your strongest interest, in a different part of audio. … audio, which is part of why the index exists. | CareerFinderResultsScreen.tsx:233 | APPLIED |
| CF-A0126 | Read {name} — same strongest interest, a different corner. | Read {name}: it shares your strongest interest, in a different part of audio. | CareerFinderResultsScreen.tsx:254 | APPLIED. I used a colon instead of the suggested dash (Pattern 7: no dash joining sentences). |
| CF-A0176 | … draw on; they are not a route …, and completing them does not … | … Academy topics teach the audio and acoustics knowledge those fields draw on. They are not a route to any license, clinical credential, bar admission or security clearance. Completing them does not qualify anyone to practice. … | CareerFamilyScreen.tsx:191 | APPLIED. Every requirement word is kept. |
| CF-A0192 | REPRESENTATIVE CAREERS | EXAMPLE TITLES | CareerFamilyScreen.tsx:245 | APPLIED |
| CF-A0202 | {n} titles from the Grand Audio Career Index. … — that is how the industry actually talks. | {n} titles in this family. Some are the same job under different names, seniority levels or employers, because that is how people in the industry name them. | CareerFamilyScreen.tsx:291 | APPLIED |
| CF-A0219 | {status}. Common pathways are described, not mandatory requirements. | {status}. Preparation shows common routes. Where it says a degree, license or certification is required, it is required. | CareerFamilyScreen.tsx:349, educationNote.ts:41 (`PREPARATION_ROUTES_NOTE`) | APPLIED. My own wording: Comp A's "These are common routes" had no clear subject right after the status sentence. Both versions make the requirement explicit. |
| CF-A0254 | PROVISIONAL, AND LABELED SO | AN EARLY ESTIMATE | CareerFinderAboutScreen.tsx:65 | APPLIED |
| CF-A0255 | … as people use the Finder … | … as people use the Career Finder … | CareerFinderAboutScreen.tsx:66 | APPLIED |
| CF-A0565 | … incomplete rather than wrong. Seeing more of the work will teach you more than more questions would — open one … | … incomplete, not wrong. Learning about the work will tell you more than extra questions would. Open one family you said you didn’t know enough about, then answer again. | scoring.ts:123 | APPLIED |
| CF-A0570 | … the rest sat lower, so these directions rest on real preferences. … compare what each one leans on. | … the rest were lower, so these results reflect clear preferences. Open your top two and compare which activities each one draws on. | scoring.ts:126 | APPLIED |
| CF-A0572 | … more than one direction could suit you — trying things … | … more than one family could interest you. Trying things is the fastest way to tell them apart. | scoring.ts:131 | APPLIED |
| CF-A0580 | Leans on {list} — {your strongest interest(s)}. | Draws most on {list}, {your strongest interest(s)}. | scoring.ts:199 | APPLIED. The singular/plural branch is kept. |
| CF-A0586 | {list} {is/are} part of this work too, rated lower as well. | {list} {is/are} also part of this work. You rated {it/them} lower too. | scoring.ts:207 | APPLIED. A new it/them branch was added. |
| CF-A0605 | how a sound tells a story in time | see how a sound starts, holds and fades | labsForDimension.ts:22 | APPLIED |
| CF-A0611 | get hands-on with the hardware | learn the cables and connectors pros use | labsForDimension.ts:25 | APPLIED |
| CF-A0617 | train the listening that hearing work depends on | hear the pitch and level differences hearing work deals with | labsForDimension.ts:28 | APPLIED |
| CF-A0619 | the course you would teach from | the basics every audio course starts with | labsForDimension.ts:29 | APPLIED |
| CF-A0625 | keep a signal inside the rules at every stage | see how signal level is kept right at every stage | labsForDimension.ts:32 | APPLIED |
| CF-D0045 | Associate speech-language pathology assistant (SLPA) program or bachelor's in communication sciences, plus supervised fieldwork; state rules vary | Associate degree from a speech-language pathology assistant (SLPA) program, or a bachelor's in communication sciences, plus supervised fieldwork; most US states require a license, registration or certification | overrides `preparation["Speech-Language Pathology Assistant"]` → careerIndex.json | APPLIED and verified. ASHA counts more than 40 states that license, register or certify SLPAs outside schools, so "most" and "or certification" are stronger and more accurate than Comp A's "many states … license or registration". |
| CF-D0056 | Clinical doctorate and a license where you practice typically required | Clinical doctorate and a license where you practice required | overrides (11 audiologist titles) → careerIndex.json | APPLIED and verified. BLS: "All states require audiologists to be licensed." |
| CF-D0062 | Graduate clinical training and a license or credential where you practice commonly required | Graduate clinical training and a license or credential where you practice required | overrides (17 titles, all flagged LICENSED) → careerIndex.json | APPLIED and verified. BLS: "All states require speech-language pathologists to be licensed." |
| CF-D0101 | AI Audio › AI Audio | AI Audio (the name is shown once when field and subject match) | CareerFamilyScreen.tsx:199 | APPLIED (display). Whether this family should map elsewhere (it also covers DSP and plug-ins) is in the owner decision list. |
| CF-E0006 | From a single number to a whole career. Explore more, or make yourself at home? | A single sound-level number can lead to a whole career. Keep exploring, or head into the Academy? | samplerStops.ts:95 | APPLIED. I changed Comp A's wording. This stop can follow the room-acoustics stop as well as the meter, so "one reading on a meter" is not always true. The tour's own end menu says "head into the Academy", not "Home screen". |
| AC-0116 | Audio System Tech | Audio System Technician | overrides `renameTitles` | APPLIED (round 2). This only expands the abbreviation; the job is the same. Public live-sound listings use "Audio Technician"; the exact phrase "Audio System Technician" was not found in a listing, and "Technician" is the index's own form everywhere else. |
| AC-1052 | Mobile-Device Audio Engineer | Mobile Device Audio Engineer | overrides `renameTitles` | APPLIED (round 2). Matches the index's own AC-1624. The same title now appears in two families (Consumer and Telecom); the licensing lookup handles lists. |
| AC-1331 | Hand-Percussionist | Hand Percussionist | overrides `renameTitles` | APPLIED (round 2). Verified: no hyphen in published use (Michigan Public, All About Jazz). |
| CF-A0127 | … change any answer — the results recalculate. | … change any answer. Your results update. | CareerFinderResultsScreen.tsx:257 | APPLIED |
| CF-A0154 | , ranked {rank} for you | , ranked number {rank} for you | CareerFamilyListScreen.tsx:47 | APPLIED |
| CF-A0201 | BROWSE CAREERS IN THIS FAMILY | BROWSE TITLES IN THIS FAMILY | CareerFamilyScreen.tsx:290 | APPLIED |
| CF-A0224 | It helps you discover paid work involving audio and identify promising directions to investigate. | It helps you find kinds of paid audio work and pick the ones worth looking into. | CareerFinderAboutScreen.tsx:30 | APPLIED |
| CF-A0239 | … role descriptions — including those published by … SMPTE, ASHA, IATSE and the Piano Technicians Guild — and grouped by the Academy into | … role descriptions. Sources include the U.S. Bureau of Labor Statistics and O*NET, …, the Society of Motion Picture and Television Engineers (SMPTE), the American Speech-Language-Hearing Association (ASHA), the International Alliance of Theatrical Stage Employees (IATSE) and the Piano Technicians Guild. The Academy grouped the titles into | CareerFinderAboutScreen.tsx:58 | APPLIED (Pattern 15 included) |
| CF-A0241 | …; the index keeps them because that is how the industry actually talks. | … employers. The index keeps them all, because that is how people in the industry name them. | CareerFinderAboutScreen.tsx:59 | APPLIED |
| CF-A0253 | % of answers were “I don’t know”. | % of answers were “I don’t know enough about this.” | CareerFinderAboutScreen.tsx:61 | APPLIED |
| CF-A0562–A0564 | Clear Profile / Broad Profile / Early Profile | Clear profile / Broad profile / Early profile | scoring.ts:81 | APPLIED. The results header upper-cases it, so it looks the same there. The feedback email and the screen-reader label change. |
| CF-A0585 | … which you rated lower — as you compare families, notice how big a part … | … which you rated lower. When you compare families, check how big a part of each one that is. | scoring.ts:206 | APPLIED |
| CF-A0597 | DEGREE REQ. | DEGREE REQUIRED | educationNote.ts:80 | APPLIED. Not checked on screen for chip width (section 7). |
| CF-A0609 | make install decisions a pro would | see the install decisions a pro makes | labsForDimension.ts:24 | APPLIED |
| CF-A0615 | read a measurement like an analyst | see how an analyst reads a measurement | labsForDimension.ts:27 | APPLIED |
| CF-D0050 | Bachelor's degree common; portfolio/ certification may supplement | (removed; its one title, Audio Circuit Designer, now uses the CF-D0051 text) | overrides → careerIndex.json | APPLIED. The title keeps its explicit override, so the craft re-table behaves as before. |
| CF-D0059 | Doctorate (PhD) required; postdoctoral positions require a completed doctorate | Completed doctorate (PhD) required | overrides (Postdoctoral Researcher — Acoustics) | APPLIED |
| CF-D0069/71/72/73 | library/ information science | library and information science | overrides (8 + 2 + 1 + 4 titles) | APPLIED |
| CF-D0072 | … the professional 'Librarian' role … | … the professional “Librarian” role … | overrides (Music Metadata Librarian) | APPLIED |
| CF-D0079 | (US: CAOHC, the hearing-conservation council) | (US: CAOHC, the Council for Accreditation in Occupational Hearing Conservation) | overrides (Occupational Hearing-Conservationist) | APPLIED and verified (caohc.org) |
| CF-D0115/D0116 | Studio Recording › Recording Craft | (unchanged) | careerFamilies.json | OWNER DECISION (Comp A: "owner to choose"). The build has no field/subject hook either. |
| CF-D0125 | Sound for Picture & Media › Localization & Game | (unchanged) | careerFamilies.json | OWNER DECISION (same) |

### Patterns (Comp A section 2)

| Pattern | Status | What was done |
|---|---|---|
| 1 "lean on" | APPLIED (CF-A0072 is OWNER TEXT) | CF-A0041, A0173 ("THE ACTIVITIES IT DRAWS ON", CareerFamilyScreen.tsx:181), A0570, A0580 |
| 2 phone → device | APPLIED | CF-A0003, A0030, A0031, A0035, A0036, A0037, A0043, A0059, A0090, A0171. CF-A0005 has no "phone" in it, so nothing changed there. |
| 3 one name for families and for titles | APPLIED (the owner's feedback question is left alone) | CF-A0112, A0192, A0201, A0224, A0570, A0572; CF-E0005 keeps "Careers" (Comp A's own suggestion) |
| 4 "the Finder" | APPLIED | CF-A0255 |
| 5 the index's name | APPLIED | CF-A0202 |
| 6 one licensing warning | APPLIED | `LICENSED_WARNING` (educationNote.ts:33), shown at CareerFinderResultsScreen.tsx:141, CareerFamilyScreen.tsx:260 and :343. CF-A0081/A0194 now share `EDUCATION_NOT_REPLACED` ("Academy study does not replace it. Check what is required where you live."). |
| 7 dashes joining sentences | APPLIED for every ID except owner text (A0073); labels A0043/A0064/A0067/A0171 and "— Live" qualifiers kept, as Comp A said | Rewrites without a table row: A0099 and A0107 ("…, not …"), A0143, A0144, A0198 ("… this index. See How this works."), A0226 ("… audio ability. That includes …"), A0232 (parentheses), A0234 ("… decision. Research finds it relates to satisfaction, but only modestly."), A0245 (comma) |
| 8 family example titles | OWNER TEXT | decision list, section 3 |
| 9 straight apostrophes (Part D) | APPLIED on screen | `prepForDisplay()` (educationNote.ts:53) shows ’ and “…”, and removes the stray space after "/". The data keeps straight quotes: the build script matches `Bachelor's degree common…` and `Varies: …bachelor's pathway` exactly. The degree regexes now accept both apostrophes (educationNote.ts `GRADUATE`, careerIndex.ts:120), so a "Master’s" can never lose its DEGREE REQUIRED chip. |
| 10 serial comma | APPLIED (round 2) | CF-A0141 in round 1. Round 2, through `renamePreparation` (8 lines, 1,269 titles) and `renameWorkModel` (2 lines, 861 titles): CF-D0033, D0035, D0044, D0058, D0067, D0068, D0074, D0076, D0078, D0085. Only the comma changed; the work-model codes did not move. |
| 11 hyphens in titles | IN PART (round 2) | **Applied:** "Voice-Over" → "Voiceover" (AC-0369/0370/0373; SAG-AFTRA writes "voiceover" as one word; this also makes the owner's example "Voiceover Recording Engineer", CF-A0395, a real index title); "Mobile-Device" (AC-1052). **Not changed:** AC-1616 "Voice-over-IP Test Engineer" (VoIP is a different term). "Plug-In" and "Voice Quality": the index already uses the suggested form; the mismatch is in owner text (CF-A0279 question, CF-A0430 and CF-A0528 examples). "Sound-System" (AC-0479, AC-1079, AC-1189, AC-1190) is **held for the owner**: AC-1190 is exactly the owner's example CF-A0488 "Sound-System Alignment Engineer", so renaming it alone would break that example's match. As a compound modifier the hyphen is also correct English. Rename together with Pattern 8 if the owner wants it. |
| 12 Title Case | IN PART | CF-A0562–A0564 applied. CF-E0001 "Find Your Audio Career" SKIPPED: every Home deck headline is Title Case (CourseSelectionScreen.tsx:263–279), so changing one would make Home inconsistent. "Your Audio Career Results" is owner text. CourseSelectionScreen.tsx was not touched. |
| 13 numbers | APPLIED | "Halfway — 14 to go" is now computed from QUESTION_COUNT (CareerFinderQuizScreen.tsx:37–44; for 28 questions the keys 6/13/20 and the words are unchanged). "fourteen" → {DIMENSION_CODES.length} in both places. Rule used: a count the app knows comes from its constant. "about five minutes", "A quarter done" and "Last seven" stay as words. |
| 14 screen-reader labels | OWNER TEXT | CF-A0309, A0137 |
| 15 source acronyms | APPLIED (round 2) | CF-A0239 in round 1. Round 2, through `sourceNames` (11 families): International Alliance of Theatrical Stage Employees (IATSE); National Institute for Occupational Safety and Health (NIOSH); National Oceanic and Atmospheric Administration (NOAA); NAMM (National Association of Music Merchants). NASA is left as is. |

## 3. Decision list for the owner (OWNER TEXT / OWNER DECISION)

| ID | Current text | Comp A's suggestion |
|---|---|---|
| CF-A0072 (results intro) | Five audio career families lean on what you said you would enjoy. Start with the top one. | These five audio career families draw most on what you said you would enjoy. Start with the top one. |
| CF-A0073 (results note) | These are possibilities to explore — not limits on what you can pursue. Interests change with experience, and these will too. | These are possibilities to explore, not limits on what you can pursue. Interests change with experience, so your results may change too. |
| CF-A0137 (feedback question, screen-reader label) | Did these results give you a direction to explore | Did these results give you at least one career direction you would explore |
| CF-A0309 ("I don't know" button, screen-reader label) | Not sure | I don’t know enough about this |
| CF-A0097 (Pattern 12) | Your Audio Career Results | Comp A: owner decides on sentence case |
| Pattern 3 (feedback question CF-A0136) | Did these results give you at least one career direction you would explore? | Comp A: "career families" everywhere else; the owner decides on "direction" here |
| CF-D0101 mapping | AI Audio › AI Audio (now shown as "AI Audio") | Check the mapping: the family also covers DSP and plug-ins |
| CF-D0115 / CF-D0116 | Session performance and conducting families → Studio Recording › Recording Craft | Owner to choose a field/subject (for example a performance or musicianship subject, if one exists) |
| CF-D0125 | Audio description family → Sound for Picture & Media › Localization & Game | Owner to choose the field/subject |
| Pattern 8 (29 family example titles) | see the table below | the nearest real title in the index |
| Pattern 11 "Sound-System" (AC-0479, AC-1079, AC-1189, AC-1190 and the owner's example CF-A0488) | Sound-System Alignment Engineer, etc. | "Sound System" (no hyphen). Held only because AC-1190 matches the owner's example word for word; rename the titles and the example together, or keep the hyphen (a correct compound modifier). |

Pattern 8: each example now, then the nearest title in the index (from Comp A):
CF-A0360 Assistant Mix Engineer → Assistant Mixing Engineer (AC-0037) · A0383 Game Audio Designer → Game Sound Designer (AC-0260) · A0394 Audiobook Engineer → Audiobook Recording Engineer (AC-0363) · ~~A0395 Voiceover Recording Engineer~~ (now matches AC-0370, renamed to "Voiceover Recording Engineer" in round 2, so 28 remain) · A0400 Commissioning Technician → AV Commissioning Technician (AC-0388) · A0424 Loudspeaker Engineer → Loudspeaker Design Engineer (AC-0636) · A0430 Audio Plugin Developer → Audio Plug-In Developer (AC-0686) · A0433 Audio Repair Technician → Audio Equipment Repair Technician (AC-0749) · A0434 Calibration Technician → Audio Calibration Technician (AC-0789) · A0435 Audio QA Test Engineer → Audio Test Engineer (AC-0660) · A0439 Preservation Engineer → Audio Preservation Engineer (AC-0811) · A0444 Surveillance Audio Analyst → Surveillance Audio Technician (AC-0854) or Intelligence Audio Analyst (AC-0859) · A0445 Public-Safety Audio Technician → Public-Safety Communications Audio Specialist (AC-0865) · A0453 Audio Instructor → Recording Arts Instructor (AC-0916) or Adjunct Audio Instructor (AC-0924) · A0454 Audio Curriculum Designer → Curriculum Developer — Audio (AC-0929) · A0459 Pro Audio Sales Engineer → Audio Sales Engineer (AC-0985) · A0463 Automotive Audio Installer → Car Audio Installer (AC-1020) · A0465 Consumer Audio Product Specialist → Personal Audio Product Specialist (AC-1049) · A0473 Sonic Branding Designer → Sonic Brand Designer (AC-1087) · A0474 UX Sound Designer → Audio UX Designer (AC-1096) or User-Interface Sound Designer (AC-1091) · A0479 Music Editor → Music Editor — Scoring (AC-1134) · A0484 Broadcast Infrastructure Engineer → Broadcast IP Infrastructure Engineer (AC-1162) · A0485 Cloud Audio Engineer → Cloud Audio Infrastructure Engineer (AC-1169) · A0500 Music Director → Music Director — Recording (AC-1256) · A0525 Linguistics Laboratory Technician → Phonetics Laboratory Technician (AC-1607) · A0528 Voice-Quality Engineer → Voice Quality Engineer (AC-1612) · A0533 Acoustic Installer → Acoustic Treatment Installer (AC-1657) · A0535 Noise-Control Technician → Vibration-Control Technician (AC-1679) or Noise Survey Technician (AC-1686) · A0550 Accessibility Audio Producer → Accessible Media Audio Producer (AC-1813).
Note: an example that is not an index title also misses the licensing check (`isRegulatedTitle` matches by title), so fixing these helps disclosure too.

## 4. The data files: what changed (every column diffed)

- `scripts/career-index-overrides.json`:
  - 46 hand-edited preparation lines moved in from the committed careerIndex.json (13 new per-title entries, 33 updated), proved to reproduce the committed `careerIndex.json` **byte-identically** (line endings normalized) before any change of mine;
  - then this review's 10 line edits (47 titles).
- `src/data/careerIndex.json`, rebuilt by `scripts/build-career-index.py` (workbook `Downloads\Pro_Audio_Training_Academy_Grand_Audio_Career_Index-2.xlsx`):
  - **records:** 1,896 before and 1,896 after; 42 families before and after; same career and family order; version unchanged;
  - **every column diffed:** family, title, alternates, title class, status, relationship, tier, orientation, work model, reg, pe, extra keys: **0 changes**. Preparation: **47 records changed**, exactly the intended ones (1 SLPA + 11 audiologists + 17 clinical + 1 + 1 + 8 + 2 + 1 + 4 + 1);
  - preparation table 45 → 44 lines (D0050 merged into D0051). No other enum table changed.
- `src/data/careerFamilies.json`: not rewritten in round 1.

**Round 2** (`scripts/build-career-index.py` + overrides):
- **Proof first.** With the 5 hooks added and the 5 D59 settings moved into `settings`, and before any new change, a scratch rebuild gave:
  - `careerFamilies.json` byte-identical to HEAD;
  - `careerIndex.json` byte-identical to the round-1 file (line endings normalized).
- **Then the new changes, rebuilt and diffed against the round-1 files, every column:**
  - **careerIndex.json**:
    - **records:** 1,896 before and 1,896 after; 42 families; same career and family order; version unchanged.
    - **Columns:** family, alternates, title class, status, relationship, tier, orientation, reg, pe, extra keys: **0 changes**.
    - **title: 7** (AC-0116, AC-0369, AC-0370, AC-0373, AC-0589, AC-1052, AC-1331).
    - **preparation: 1,269 records**, every one a `renamePreparation` entry (Varies 736, Hands-on 224, Portfolio 206, Craft school 67, Military 21, Music-therapy 12, Law 2, Patent 1). The table stays at 44 lines.
    - **workModel text: 861 records** ("Staff, freelance or …" 774, "Project, venue, tour or …" 87); no work-model code moved.
    - A script checked every changed preparation and work-model value against the rename map: 0 unexpected.
  - **careerFamilies.json:** 42 families; field changes: **11, all `sources`** (the 4 acronyms spelled out). `settings` unchanged (the D59 lines kept).
- The build reads the live v3 curriculum through a read-only REST GET with the anon key from `.env`. I ran it in a scratch copy, so nothing was written to the repo until the diff was checked. The copied `.env` was deleted right after each run.

## 5. Problems and what the coordinator needs to know

1. **Fixed in round 2:** careerFamilies.json is safe to rebuild again. The 5 D59 lines ("XR (extended reality: …) companies", "Automotive OEMs (carmakers)", "Film and television post-production", "theaters" ×2) are in `settings`.
2. **Fixed in round 2: hooks added to `scripts/build-career-index.py`.**
   - `settings` runs after the families are read.
   - `renameTitles`, `renamePreparation`, `renameWorkModel` and `sourceNames` run LAST, just before the preparation table is built. So `regulated`, `preparation`, the craft re-table (it matches "Tech" in titles and the workbook's DEGREE_DEFAULT) and the licensed-role guard (it matches VARIES) all still see the workbook text.
   - Each hook stops the build on a key that changes nothing. `renameTitles` also stops it on a name clash inside a family.
   - The overrides stay keyed by the **workbook** title, e.g. "Occupational Hearing-Conservationist" in `regulated` and `preparation`. That is on purpose.
   - Python syntax checked.
3. `npx tsc --noEmit`:
   - Round 1: 2 errors, both in a lab file other agents are editing (`src/screens/lab/dj/pages/p10Tempo.tsx(247)` couldn't find `beatOffsetText` and `beatAligned`).
   - Round 2 rerun: **0 errors.**
4. The old copy is still in the ratification sheet `docs/APE_CAREER_FINDER_COPY_2026_09_04.md` (history; not in my file list).

## 6. Tests

- **New:** `test/careerFinderText_20261114.test.ts`, 20 tests. It covers:
  - the "I don't know" line for 0, 1, 2-on-one-activity, 2-on-two and 4 answers;
  - the one licensing warning in all three places;
  - SLPA, audiologist and SLP lines now say "required", and no clinical line still says "typically/commonly required";
  - the line under every title;
  - DEGREE REQUIRED firing on a straight or a curly "Master's";
  - the display cleaner;
  - no "lean on" in the results wording, sentence-case labels, the computed halfway label, and the tour stop.
- **Updated** (each with a comment quoting the owner: "assign an agent in the background to work on this"):
  - careerFinder.test.ts ("Draws most on" sentence)
  - communityCareersFullRun1_20261001 (curly apostrophe; shared sentence)
  - communityHunt12_20261004, communityHunt13_20261004, finalRoundA_20261002, guestCareer_20261004, guestEphemeral_20261004 (phone → device)
  - consistencyWave4_20261002 (DEGREE REQUIRED)
  - factAuditR3_F_career_20261022 (SLPA line)
- **Run** with `node --test --test-timeout=120000`:
  - careerFinder, careerFinderIndex, factAuditR2_F_career, factAuditR3_F_career, guestCareer, the four communityCareers files, communityHunt12, communityHunt13, finalRoundA, guestEphemeral, consistencyWave4, factAuditR3_E_other: **320 tests, 320 pass, 0 fail**;
  - new test plus ratchetCrlfReads, usSpellingDisplayText, wording-a, noMarketingToMembers, gatedRoleDisclosure: **47 pass, 0 fail**.
- **Round 2:**
  - The new test gained 6 tests (now 26). They cover:
    - the hooks exist and fail loudly;
    - the 5 settings in the overrides equal the shipped file;
    - the 7 renamed titles, with AC-0589 still LICENSED;
    - "Voiceover Recording Engineer" is now a real title in its family;
    - no serial comma in preparation or work-model lines;
    - the acronyms are spelled out.
  - factAuditR2_F_career and factAuditR3_F_career were updated for the serial-comma text, including the VARIES constant that the licensed-role check compares against, with the owner's words in a comment.
  - **The whole career set together (21 files): 373 tests, 373 pass, 0 fail.**
- `npx tsc --noEmit`: see section 5, item 3.
- **The full suite was not run** (per the brief); the coordinator runs it at the gate.

## 7. What I did not check

- **Nothing was checked on screen.** In round 1 the built-in browser pane was at its tab limit (9 tabs held by other sessions); `tabs_create` failed three times, and I did not use anyone else's tab. In round 2 the coordinator said to skip this; the coordinator will check once the pane is free. The start screen, a result and a family page at 390×844 are **not seen**. Worth checking:
  - the longer "DEGREE REQUIRED" chip beside a long title;
  - the longer licensing warning on a results card;
  - the "I don't know" line.
- I did not check Comp A's "what I did not check" item 1 for every title. I spot-checked: the sonographers use "Accredited clinical training and credentialing commonly expected", and CF-D0075 is used only by Point-of-Care Ultrasound Specialist, which is right.
- I did not re-read every other preparation line against BLS/O*NET; only D0045, D0056, D0062 and D0079 were checked.
- Member vs non-member branches: the existing `upsell` branches were not changed, and no new "free" wording was added. Not checked on screen.

Sources used for the facts: [BLS Audiologists](https://www.bls.gov/ooh/healthcare/audiologists.htm), [BLS Speech-Language Pathologists](https://www.bls.gov/ooh/healthcare/speech-language-pathologists.htm), [ASHA: Regulating SLPAs](https://www.asha.org/advocacy/regulating-speech-language-pathology-assistants/), [CAOHC OHC certification](https://caohc.org/training-and-certifications/occupational-hearing-conservationist/about-the-training/ohc-training-and-certification), [SAG-AFTRA Voiceover](https://sagaftra.org/voiceover), [Michigan Public on Armando Peraza ("hand percussionist")](https://michiganpublic.org/2014-05-01/remembering-armando-peraza-an-afro-cuban-percussion-giant). Search for "Audio System Technician": exact phrase not found in public live-sound listings, which use "Audio Technician" (for example [4Wall job descriptions](https://www.4wall.com/employees/job-descriptions/720-audio-specialist)).
