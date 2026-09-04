# Audio Career Finder — copy ratification sheet (2026-09-04)

Everything a user can read in the Career Discovery Lab that was **not** given
verbatim in the owner's brief of 2026-09-03. Mark each block ✅ / ✏️ / ❌.
The brief's own copy (intro paragraph three, the 28 questions, the six answer
labels, "YOUR AUDIO CAREER RESULTS", the results intro, the feedback question,
the family names, dimensions and representative careers) is NOT repeated here
except where the reviewers changed it — those are listed under **Deviations**.

Where it lives: `src/features/careerfinder/families.ts` (descriptions),
`src/features/careerfinder/scoring.ts` (clarity + explanation templates),
`src/screens/careerfinder/*.tsx` (screen copy), `src/screens/curriculum/CurriculumScreen.tsx`
(entry card).

---

## 1. Deviations from the brief (decide these first)

| # | Brief said | Shipped | Why (which reviewer) |
|---|---|---|---|
| D1 | Clarity labels "Clear / Broad / Developing Profile" | **Clear / Broad / Early Profile** | "Developing" is the bottom band of most school rubrics; students read it as "scored lowest". (learning) |
| D2 | CLEAR = "at least four dimension scores ≥ 0.75 and meaningful variation" | CLEAR = **at least one** dimension ≥ 0.75 **and** a spread ≥ 0.375 between highest and lowest rated dimension | Differentiation is the gap between highs and lows, not a count of highs; the four-strong rule labelled the sharpest profiles (two at 4/4, rest at 1) "Broad" while the sentence under it said they stood out. (learning) |
| D3 | Rank 1–2 "STRONGEST MATCHES", 3–5 "OTHER PROMISING DIRECTIONS" | Same — **except** when nothing stood out (no dimension ≥ 0.75, or #1 scores < 0.5): "CLOSEST TO YOUR ANSWERS" / "NEXT CLOSEST" with a lead saying these are the nearest families, not matches | "Match" is a fit claim the answers may not support; an all-Dislike profile must not be told it has two strongest matches. (learning) |
| D4 | First three families on larger cards, 4–5 compact | Ranks 1–2 large (with explanation), 3–5 compact (chips + examples) | A "large" card under "other" muddled the hierarchy and added ~400 px. (design) |
| D5 | Theatre, Worship, Venues & Show Control = LO, MS, SD | **MS, LO, SD** | Identical triple to Broadcast made the two families a permanent tied pair; theatre sound design is storytelling-first, cue by cue. (industry) |
| D6 | Stagecraft, Rigging, Power & Production Support = LO, SD, BM | **BM, LO, SD** | Identical triple to Live Sound; riggers, electricians and stagehands build and strike — the LO questions are about mixing and fixing during a show. (industry) |
| D7 | Musical Instrument Building, Tuning & Repair = BM, AR, PC | **BM, CP, PC** | The second thing the trade runs on is the ear (tuning, voicing, intonation), captured by CP02, not by "measurement, experimentation, investigation". (industry) |
| D8 | Acoustic Construction & Noise-Control Trades = BM, SD, AR | **BM, AR, SD** | Identical triple to Hardware Engineering made a loudspeaker EE and a floating-floor installer a permanent pair; trades spend more time on field testing than deployment. (industry) |
| D9 | Representative careers (see table below) | 12 families changed | Invented or non-credential titles replaced with titles that exist in the index. (industry) |
| D10 | Explanation template: "This appeared because you showed strong interest in X, Y and Z activities." | Kept for ranks 3+; ranks 1–2 open "Leans on X and Y — your strongest interests."; a rated-lower main activity is named first; "some interest" is never said for a Neutral/Neutral (0.5) rating — that reads "you were neutral about". | Six identical openers read as a form letter; a 0.5 was being misquoted as interest. (design, learning) |
| D11 | (not in brief) | A **licensed-professions** card above the learning card on any family with regulated titles; LICENSED chips on rows; PE note on consulting acoustics engineers | Never imply Academy study is a route to a clinical, legal or engineering licence. (industry) |
| D12 | (not in brief) | **WHAT TO DO NEXT** card on results: open the top family, try one lab for the strongest dimension, read the surprise / an unexplored family | A results page that ends in a list is a test; one that ends in three taps is a lesson. (learning) |

### D9 — representative careers changed

| Family | Brief | Shipped |
|---|---|---|
| Live Sound, Touring & Festivals | … Live Sound Systems Technician | … **Live Systems Engineer** |
| Theatre, Worship, Venues & Show Control | Theatre Sound Designer; A1 Audio Engineer | **Theatrical Sound Designer; Theatre A1** |
| Broadcast, Radio, Sports & Streaming | … Sports Broadcast A1 | … **Broadcast A1** |
| Scientific, Environmental & Applied Acoustics | Research Acoustician; Bioacoustics Researcher; Environmental Acoustics Scientist | **Acoustics Research Scientist; Bioacoustician; Acoustic Oceanographer** |
| Hearing, Audiology, Psychoacoustics & Accessibility | … Hearing-Aid Specialist; Psychoacoustics Researcher | … **Hearing Instrument Specialist; Psychoacoustician** |
| Medical Ultrasound & Therapeutic Acoustics | Medical Sonographer; Therapeutic Ultrasound Engineer; Ultrasound Research Scientist | **Diagnostic Medical Sonographer; Ultrasound Transducer Engineer; Ultrasound Imaging Scientist** |
| Technical Standards, Regulation, Law & Rights | … Acoustic Compliance Officer | … **Broadcast Loudness Compliance Specialist** |
| Audio Measurement, System Tuning & Instrumentation | Sound System Tuner; Electroacoustic Measurement Technician; Audio Test Engineer | **Sound-System Alignment Engineer; Electroacoustic Measurement Engineer; Audio Measurement Technician** |
| Stagecraft, Rigging, Power & Production Support | Stage Audio Technician; Production Systems Technician; Audio Crew Chief | **Entertainment Rigger; Audio Stagehand; Power Distribution Technician — Events** |
| Music Performance, Conducting & Live Musical Direction | … Conductor; Band Leader | … **Orchestra Conductor; Bandleader** |
| Field Recording, Sound Libraries & Sonic Heritage | Field Recordist; Sound Library Creator; Acoustic Heritage Documentarian | **Wildlife Sound Recordist; Sound Library Producer; Sonic Heritage Specialist** |

---

## 2. The 42 family descriptions (one sentence each, NEW)

| Family | Description |
|---|---|
| Recording Studios & Music Production | Capturing performances in studios and on location, then shaping the recordings into finished music. |
| Mixing & Mastering | Balancing recorded tracks into a mix, then preparing finished mixes so they sound consistent on different playback systems. |
| Music Creation, DAWs, Synthesis & Sonic Art | Composing and producing original music and sound with software, synthesizers, samplers and creative tools. |
| Live Sound, Touring & Festivals | Deploying, operating and troubleshooting sound systems for concerts, tours, festivals and events as they happen. |
| Theatre, Worship, Venues & Show Control | Designing and running sound for staged productions, services and permanent venues, cue by cue. |
| Film, Television & Post-Production Audio | Recording, editing, designing and mixing every sound that accompanies moving pictures. |
| Game, Interactive, XR & Immersive Audio | Creating sound that responds to a player or a space, in games, virtual worlds and immersive formats. |
| Broadcast, Radio, Sports & Streaming | Mixing and delivering live and produced audio for radio, television, sports and streaming audiences. |
| Podcast, Audiobook, Voice & Spoken-Word Production | Recording, editing and producing the spoken voice for podcasts, audiobooks, narration and voiceover. |
| Installed AV, Integration & Institutional Systems | Designing, installing and commissioning permanent audio and AV systems in buildings people use every day. |
| Architectural Acoustics, Noise & Vibration | Measuring, predicting and controlling how sound and vibration behave in rooms, buildings and the environment. |
| Scientific, Environmental & Applied Acoustics | Studying sound as a physical phenomenon, from animal calls and ocean noise to seismic and atmospheric acoustics. |
| Hearing, Audiology, Psychoacoustics & Accessibility | Assessing and managing hearing and balance, protecting hearing, fitting hearing technology, and studying how people perceive sound. |
| Medical Ultrasound & Therapeutic Acoustics | Imaging the body with ultrasound, and engineering and researching the ultrasound systems used for diagnosis and therapy. |
| Audio Hardware, Transducers & Electronics Engineering | Engineering the circuits, microphones, loudspeakers and devices that turn sound into signals and back again. |
| Audio Software, DSP, AI & Machine Learning | Writing the software, signal processing and learning systems that analyze, transform and generate audio. |
| Manufacturing, Quality, Calibration & Repair | Building, testing, calibrating and repairing audio equipment so it performs to specification. |
| Audio Archiving, Preservation & Restoration | Transferring recordings from aging carriers, restoring their sound and keeping them accessible for the future. |
| Forensic, Surveillance, Security & Public-Safety Audio | Examining, enhancing and authenticating recordings for investigations, courts and public safety. |
| Technical Standards, Regulation, Law & Rights | Writing and applying the standards, rules, licenses and rights that govern how audio is made, shared and measured. |
| Education, Research, Training & Technical Communication | Teaching audio, designing courses, and explaining technical ideas clearly in classrooms, manuals and media. |
| Audio Business, Product, Sales & Operations | Selling, planning, managing and running the studios, companies, products and teams that professional audio depends on. |
| Consumer, Home, Vehicle & Personal Audio | Designing, installing and supporting the audio people live with, in homes, vehicles and personal devices. |
| DJ, Club & Event Performance Technology | Performing with recorded music and the technology that drives clubs, events and dance floors. |
| Sonic Branding, UX, Exhibits & Experience Design | Designing the sound of brands, products, interfaces, exhibits and public experiences. |
| Music for Picture, Scoring & Editorial | Composing, arranging and editing music that serves film, television, trailers and advertising. |
| Audio Networks, Cloud & Technical Infrastructure | Building and running the networks, timing and cloud systems that move audio reliably between many places. |
| Audio Measurement, System Tuning & Instrumentation | Measuring sound systems and spaces with instruments, then tuning them until they perform as intended. |
| Stagecraft, Rigging, Power & Production Support | Rigging, powering and supporting the physical production that live audio depends on, safely and on schedule. |
| Session Performance, Voice & Musical Direction | Performing and directing music and voice in recording sessions, from the first take to the final one. |
| Music Performance, Conducting & Live Musical Direction | Performing, conducting and leading music in front of audiences, in halls, clubs, worship and touring. |
| Musical Instrument Building, Tuning & Repair | Building, tuning, restoring and repairing the instruments musicians play. |
| Music Education, Lessons & Musicianship Coaching | Teaching music, voice and listening, and coaching players as their abilities grow. |
| Music Therapy, Speech & Clinical Voice | Clinical work with music, speech and voice — music therapy, speech-language pathology and voice rehabilitation — for people with communication, developmental or health needs. |
| Phonetics, Linguistics & Speech Science | Analyzing, recording and modeling the sounds of human speech and language. |
| Telecom, Voice Quality & Communications Audio | Making transmitted voice clear and intelligible across phones, conferencing, radios and networks. |
| Acoustic Construction & Noise-Control Trades | Building and installing the treatments, partitions and enclosures that control sound in real spaces. |
| Music Curation, Repertoire, Libraries & Editorial | Selecting, organizing and licensing music for productions, platforms, collections and audiences. |
| Defense, Sonar & Acoustic Intelligence | Detecting, tracking and interpreting sound underwater and in the field for defense and security, often in military or government service. |
| Accessible Media & Audio Description | Writing, voicing and producing audio that makes film, television, theatre and museums accessible to blind and low-vision audiences and others who need it. |
| Music Retail, Rental & Instrument Services | Advising, supplying, renting and servicing the instruments and equipment musicians and productions rely on. |
| Field Recording, Sound Libraries & Sonic Heritage | Recording the sounds of places, nature and cultures, and building the libraries that preserve them. |

---

## 3. Screen copy (NEW)

### Explore page entry card
- Eyebrow: **CAREER DISCOVERY LAB · FREE** + BETA pill
- Title: **Audio Career Finder**
- Blurb (first visit): *Which kinds of audio work would you enjoy? 28 questions, 42 career families, 1,902 ways to work in audio. About five minutes.* Pill: START ›
- Blurb (in progress): *You’re at question n of 28. Your answers are saved.* Pill: CONTINUE ›
- Blurb (done): *Your top match: {family} — and four more.* Pill: RESULTS ›

### Intro
- Kicker: **CAREER DISCOVERY LAB · FREE · NO ACCOUNT**; stat strip 1,902 TITLES · 42 FAMILIES · 28 QUESTIONS · ~5 MINUTES
- Lead: *Which kinds of audio work would you enjoy doing?*
- Body: *Rate 28 activities. In about five minutes you’ll have five career families worth exploring, and a place in the Academy to start on each.*
- Under the button: *Free. No account. Your answers stay on this phone.*
- HOW TO ANSWER: *You’ll answer for activities, not job titles. Answer for enjoyment only — whether you would be good at it, or could do it today, does not matter here. If you don’t know what an activity is like, say so: that is a useful answer, never a low score.*
- WHAT YOU GET: *Your answers become a profile across fourteen kinds of audio work. That profile is compared with 42 career families, and the families that lean on what you enjoy come to the top — with the reason each one appeared, and the Academy topics that lead into it.* + the brief's third paragraph + *No percentages, no verdicts, no talent scores — possibilities to explore, with a place to start learning for each.*
- Buttons: START CAREER FINDER · CONTINUE · QUESTION n OF 28 · VIEW MY RESULTS · CHANGE MY ANSWERS · RESET PREVIOUS ANSWERS; links *Browse all 42 career families* · *How this works, and what it does not measure*
- Reset confirm: *Reset the Career Finder? Clears your answers and results on this device. Saved families are kept.*

### Questions
- Title *Question n of 28*; question shown as "How would you feel about **…**?" with the stem muted
- Milestones under the bar at 7 / 14 / 21: *A quarter done* · *Halfway — 14 to go* · *Last seven*
- Note (first question, and whenever "I don’t know" is chosen): *“I don’t know enough about this” is never counted as dislike. It simply marks an activity you have not met yet.*
- Screen-reader hint on that answer: *Not scored. Tells us this activity is new to you.*
- Footer: ‹ BACK · CONTINUE › · SEE MY RESULTS ›

### Results
- Lead: *Five audio career families lean on what you said you would enjoy. Start with the top one.* (weak profile: *Nothing stood out strongly yet, so these are the families nearest to your answers — not matches. Exploring one will teach you more than the questions did.*)
- Profile card: YOUR PROFILE + CLEAR / BROAD / EARLY PROFILE; legend of the highlighted dimension codes; *Activities you said you would enjoy most*; WHAT THESE MEAN ▾ reveals the dimension definitions plus *Each activity is measured by only two questions, so one answer moves its bar a lot. Treat the bars as a sketch of what you said you would enjoy — not a measurement of ability.* and *n of 28 answers were “I don’t know enough about this”. Those activities are unexplored, not disliked — the dashed bars had no rating at all.*
- Clarity sentences (scoring.ts `clarityCopy`):
  - Clear: *{One activity / Two activities / Three activities / Several activities} stood out clearly and the rest sat lower, so these directions rest on real preferences. Open your top two and compare what each one leans on.*
  - Broad: *You rated many activities similarly. That is common, and it means more than one direction could suit you — trying things is the fastest way to tell them apart.*
  - Broad, all on the dislike side: *You rated most activities on the dislike side. That usually means the activities you would enjoy are not in this set yet, or that you answered on whether you would be good at them rather than whether you would enjoy them. Browse the families, then answer again for enjoyment only.*
  - Early: *Many activities were new to you, so the picture is incomplete rather than wrong. Exposure will teach you more than more questions would — open one family you said you didn’t know enough about, then answer again.*
- Explanation templates (scoring.ts `explainFamily`):
  - Ranks 1–2: *Leans on {A} and {B} — your strongest interests.* [+ *You also showed some interest in {C}.* / *You were neutral about {C}.*] [+ *It also draws on {C}, which you rated lower — notice how much of each family that is as you compare them.*]
  - Otherwise: *This appeared because you showed strong interest in {A} and {B} activities, and some interest in {C}.* / *…and you were neutral about {C}.*
  - Main activity rated lower: *Its main activity is {A}, which you rated lower. It still appeared because you showed …* [+ *{C} is part of this work too, rated lower as well.*]
  - Unexplored: *You said you did not know enough about {C} yet, so that part is unexplored rather than ruled out.*
  - Surprise card: *Shares your strongest interest, {A}, in a field none of your top five touch.*
- ONE YOU MAY NOT HAVE CONSIDERED: *Same strongest interest, a different corner of the audio world. Many of these families are unfamiliar even to people who work in audio — that is part of why the index exists.*
- WHAT TO DO NEXT: 1 *Open {top family} and add its first topic to your study list.* 2 *Try a lab that uses {dimension}: {lab} — {why}.* 3 *Read {surprise} — same strongest interest, a different corner.* (Early profile: *Open one family you said you didn’t know enough about: {family}.*) Footer: *When you have tried one, come back and change any answer — the results recalculate.*
- Lab per dimension (labsForDimension.ts): CP Oscillator Lab · RC Microphone Selection Lab · ER EQ Lab · MS Sound Envelope & Transients Lab · LO Signal Chain Lab · SD Cable Dressing & Installation Lab · BM Cable & Connector Fundamentals · DA Digital Audio Lab · AR Visual Audio Analysis Lab · HC Ear Training Lab · TE Foundations of Sound · BO Audio Calculators Lab · PC Vacuum Tube Reference · GS Gain Staging Lab
- Under the actions: *These are possibilities to explore — not limits on what you can pursue. Interests change with experience, and these will too.*
- Feedback (after an answer): *What did the Career Finder misunderstand? (optional)* · placeholder *Anything it got wrong, missed, or named badly.* · *Saved on this device. To send it to the Academy, use the button — it opens your mail app with the answer filled in, and you decide whether to send.* · SEND TO THE ACADEMY

### Family detail
- RANKED #n FOR YOU (top 5) · IN YOUR TOP TEN (6–10) · nothing below that
- HOW IT LINES UP WITH YOUR ANSWERS (or, without results: THE ACTIVITIES IT LEANS ON — *Main activity first. Take the Career Finder to see how your own interests line up with them.*)
- Licensed card: **LICENSED OR CREDENTIALED PROFESSIONS IN THIS FAMILY** — *Some titles here are licensed, credentialed or restricted-entry occupations (marked LICENSED below). Academy topics build the audio and acoustics knowledge those fields draw on; they are not a route to any licence, clinical credential, bar admission or security clearance, and completing them does not qualify anyone to practise. Check the licensing body where you live.*
- Learning card: **START LEARNING IN THE ACADEMY** (licensed families: **AUDIO KNOWLEDGE THAT SUPPORTS THIS FAMILY**) — *These Academy topics lead into this family. Tap one to add it to your study list — free to add, and the first free topics are open to everyone.* · START HERE (first three topics) · *Show n more topics* · STUDY n TOPICS NOW › · *Open the full curriculum*
- HOW CENTRAL AUDIO IS chips; *Titles cross-checked against public listings from {organizations}. None of them reviewed or endorsed this index — see How this works.*
- COMMON ENTRY POINTS — *Titles in this family that usually ask the least formal preparation to get started.*
- BROWSE CAREERS IN THIS FAMILY — *n titles from the Grand Audio Career Index. Some are the same occupation under different names, seniority levels or employers — that is how the industry actually talks.* · SHOW n MORE · m LEFT
- Row detail labels: ALSO CALLED · KIND OF ROLE · HOW PEOPLE WORK · TYPICAL PREPARATION · AUDIO IN THIS ROLE; licensed rows: *⚠ Licensed, credentialed or restricted-entry occupation in many jurisdictions. Academy study does not lead to that licence or credential — verify requirements with the licensing body or employer where you live.*; PE rows: *⚠ In many jurisdictions, offering engineering services to the public or sealing reports requires a Professional Engineer licence.*; every row: *{status}. Common pathways are described, not mandatory requirements.*
- Audio centrality: **Audio-core** — *Audio or acoustics is the job itself.* · **Audio-specialized** — *An established profession with a recognized audio or acoustics specialty.* · **Audio-enabled** — *A role in which audio knowledge is one required, paid skill among others.*

### All families
- Title *Every kind of paid audio work*; *1,902 titles, grouped into 42 families, each listed under the Academy field that leads into it. Your rank from the Career Finder is shown beside each one.* (rank badge only for the top five)

### How this works (methodology page) — full text in `CareerFinderAboutScreen.tsx`
Sections: WHAT COUNTS AS AN AUDIO CAREER · WHAT THE QUESTIONS MEASURE · WHAT IT DOES NOT MEASURE (incl. the two-questions caveat and *Your answers are stored only on this device and are never sent anywhere unless you choose to email feedback.*) · HOW CAREERS ARE GROUPED AND MATCHED (incl. *None of those organizations participated in, reviewed or endorsed this index, and no title here implies membership in or certification by any of them. Titles and licensing rules are described mainly as used in the United States; names and requirements differ elsewhere.*) · PROVISIONAL, AND LABELLED SO · SEE SOMETHING WRONG? → SUGGEST A CORRECTION

---

## 4. Recommended but NOT applied — the brief said "exactly"

The learning reviewer flagged six questions as jargon-loaded or unevenly warm
(creative items get outcome language, governance items read as procedure,
which inflates MS/ER/CP relative to GS/PC). The brief says to create the
question records exactly, so they ship as written. If you want the rewrites,
say so and they go in under the same ids:

| Id | Shipped (brief) | Proposed |
|---|---|---|
| MS01 | designing sound that strengthens the emotion and meaning of a film scene | designing the sounds for a film scene — footsteps, atmosphere, effects — so they fit what is happening on screen |
| ER02 | balancing many tracks until the sound feels clear, powerful and emotionally right | adjusting the levels, tone and balance of many recorded tracks until they sit together as one mix |
| TE01 | teaching beginners how sound, signal flow and audio equipment work | teaching beginners how sound travels through microphones, mixers and speakers |
| PC01 | cataloging recordings and creating accurate descriptions and metadata | cataloguing recordings and writing accurate descriptions and labels so they can be found later |
| DA02 | creating algorithms that modify, analyze or generate sound in real time | automating repetitive audio tasks with scripts, macros or software tools |
| GS01 | interpreting technical standards and checking whether audio systems comply with them | reading the rules an audio system is required to meet and checking whether it does |

Also proposed and not applied: the midpoint answer label "Neutral" → "Neither
like nor dislike" (beginners use "neutral" to mean "not sure"). The scoring
already treats a Neutral/Neutral rating as neutral, never as "some interest".

---

## 5. Index corrections applied on top of the workbook

`scripts/career-index-overrides.json`, applied by the build script every time
the workbook is rebuilt — these are the app's corrections until the workbook
itself is revised:

- Flagged **licensed**: Hearing Instrument Specialist, Hearing-Aid Specialist, Hearing-Aid Fitting Specialist, Speech-Language Pathology Assistant, Voice Therapist, Auditory-Verbal Therapist, Listening and Spoken Language Specialist, Neurosonographer.
- **PE note** on every title ending "Engineer" / "Consultant" in Architectural Acoustics, Noise & Vibration (33 titles).
- **Moved to Defense**: Sonar Technician, Sonar Systems Engineer, Sonar Signal-Processing Engineer.
- **Preparation**: five civilian sonar engineering titles no longer "military or defense-employer training"; Beat Maker no longer "craft school / apprenticeship"; in the six craft families (Live Sound, Theatre, Recording, Manufacturing, Stagecraft, DJ) the workbook's "Bachelor's degree common" default is re-tabled to hands-on training (technician / operator / stagehand rows) or the "varies" pathway.
- **Orientation**: every Audiologist → Clinical / therapeutic; Songwriter, Arranger, Orchestrator, Audiobook Narrator, Podcast Host, Foley Walker → Creative / performance; Audio Research Engineer, Postdoctoral Researcher — Acoustics, Acoustics Laboratory Technician → Science / research.
- **Title class**: the four headphone/headset rows out of "Leadership/management".
- **Audio-core demotion**: 106 rows the workbook itself calls "Closely related / supporting", "Audio-dependent allied work" or "Adjacent but audio-specific" are shown as audio-specialized, not audio-core.

Source codes (S01…S46) now render as organization names, never as codes.
