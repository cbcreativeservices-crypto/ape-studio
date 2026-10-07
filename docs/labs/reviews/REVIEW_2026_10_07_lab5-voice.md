# Review — Miking Lab 5, VOICE lessons (E01–E07) — 2026-10-07

Branch `review-lab5-voice` (from `final-lab` 456064b1). Two reviewers in one pass:
**AE** = senior audio engineer (studio + live); **CL** = cognitive-learning / instructional design.

Scope: E01 Lead Vocal, E02 Background Vocals, E03 Rap, E04 Duets and Small Groups, E05 Choirs,
E06 Children's Choirs, E07 Singer with Guitar or Piano, and the shared voice toolkit
(`lessons/shared/voice/`). Method: LESSON_JOURNEY.md, BUILDER_BRIEF.md and the visual charter read;
every lesson's data and copy read (pages, checks, quick check, symptoms, order tasks, briefs, zones,
setting, orient/sound); STARTING SETUPS captured in the web preview at 412 × 915 (E01 studio, E07
guitar two-mic, E02 studio circle). The physics behind each check re-derived where a number is given
(the 126° wedge angle on a level stage mic at 6 cm, 6 dB per doubling, 2.9 ms per metre, 3 dB per
doubling of open mics, the 17 cm / 110° pair's 95° recording angle, E07's computed 3:1 ratio).

OWNER REVIEW items already in `CORRECTIONS_LOG.md` (OR-V1…V15, G2-OR-1…12, G4-OR-3) were not
overridden; where a finding touches one it is marked "owner decision".

## Findings

| id | lesson / page | expert | severity | finding | fix applied / owner decision |
|---|---|---|---|---|---|
| V-01 | E02 · microphone check `bv.mic.4`; STARTING SETUPS card `b2b` | AE | major | "Two cardioids back to back — where should nobody stand? **At the sides, where both hear less.**" is wrong physics as taught: each cardioid is only ~6 dB down at 90°, and the two summed are an omni (0.5+0.5cosθ + 0.5−0.5cosθ = 1), so a side singer is about as loud in the mono sum as one in front. The real reason to keep singers in front is control and image: a side voice lands equally in both channels, on neither fader alone, in the middle of the stereo picture. | Fixed: the check now asks *why* the singers stand in front; correct = "A side voice lands equally in both mics", each wrong option explained (6 dB, the sum hears all round; the room is in both mics anyway). The setup card's START line says the same. Pinned in `test/mikingLab5VoiceReview.test.ts` (V-01, including the cardioid-sum identity). |
| V-02 | E06 · setting `rig` note; ADVANCED safety line | AE + CL | major | Safety message contradicts itself: E06 says "Never a mic hung over the children's heads **without a competent rigger**" (reads as: over the heads is fine with a rigger), while E06's own brief feedback, the shared `overHeads` / `hangDiag` items and E05 all say *never over the heads — in front of the mouths*. Two answers to one safety question. | Fixed: "Nothing hangs over the children's heads. A hung mic goes in front of the mouths, aimed at the back row — put up only by a competent rigger, with the venue's approval." (both places). Pinned (V-02). |
| V-03 | E04 · setting `wedge` note | AE / CL | minor | Names a **hypercardioid** for the side-placed wedge while the lesson (and E01–E03, E05) offer and draw a supercardioid — an unexplained new term for the same idea. | Fixed: "supercardioid". Pinned (V-03). |
| V-04 | E07 · twoMic takeaway, `sw.two.1`, a placement explain, a symptom | CL | minor | "Correlated bleed" — jargon never defined on screen (plain-language rule). | Fixed: "bleed (the same sound in both mics)". Pinned (V-04). |
| V-05 | E07 · BRIEF 1 option e feedback | CL | minor | "An omni rejects nothing; distance does more than the pattern here." — the feedback half-defends the wrong option and does not say why it fails (the misconception is "an omni blocks the guitar"). | Fixed: "An omni blocks nothing: at 5 cm only the closeness keeps the voice ahead of the guitar — and the capsule sits in the breath." |
| V-06 | E01 · `lv.prac.gain` why | CL | minor | "never ask for clipping, nor for less" — garbled; a learner cannot act on it. | Fixed: "do not ask the singer to hold back." |
| V-07 | E01 / E03 · screened condenser "at least 10 cm" from the screen; `lv.place.3`, `rp.place` | AE | minor | Many engineers run a pop screen 5–10 cm off the capsule, so a screened LDC can start nearer than ~15 cm. The lab's "at least 10 cm" is the screen maker's wording (N-POP) and the 10 cm gap is the drawn geometry (E1-05, OR-V3), so the checks are consistent with the drawing. | Owner decision (OR-V3): kept. If the owner wants the common studio range, change `VOICE_DIMS` screen gap to ~6 cm and soften the two checks. |
| V-08 | shared `LOUD_REASON` (used by E01, E03) | CL | minor | Wrong-reason label "loudest sound of any position **on the instrument**" reads oddly for a voice. | Not changed (shared bowed-family item used by many lessons; other reviewers run in parallel). Noted. |
| V-09 | E03 · `rp.two.2` (doubled takes hollow) | AE | minor | "Same mic, distance and position for each take" is a production habit for a tight stack, not the cause of hollowness between two separate performances (that is mostly timing/pitch alignment). The explain does mention lining the performances up. | Kept (the lesson's own L80); low risk. |
| V-10 | E05 / E06 · microphone prediction "rejects most of the PA behind it" | AE | minor | The mains usually sit downstage and to the sides, not straight behind an area mic; the prediction simplifies. Ungraded, so low cost. | Kept. |
| V-11 | E06 · `cc.mic` headset "What does it NOT do?" | CL | minor | Negative stem (item-writing guidance prefers positive stems); it is capitalised and the options are clear. | Kept. |
| V-12 | E02 · STARTING SETUPS "TRUE SHAPE" inset | CL | minor | In the 412-wide capture the inset's FRONT label sits over the drawn mic body. Shared `ArrayArt` (group lessons), not a voice-only file. | Not changed (shared engine art; other reviewers in parallel). Noted for the ensemble owner. |
| V-13 | E06 · featured child's stand mic within ~10 cm | AE | minor | Children rarely hold a steady few-cm distance; many engineers would start a child soloist nearer 10–20 cm. | Owner decision (G2-OR-7, already logged). |
| V-14 | E06 · 94 dB / 120 dB child-event limits shown without a source | AE | — | Numbers are right for the cited standard. | Owner decision (G2-OR-8, already logged). |

### Checked and found sound (no change)
- **AE**: studio lead vocal (screened LDC ~15 cm, 10–20 cm band) and stage handheld (within 10 cm, lips off the grille); the floor wedge 1 m out arrives ~126° off a level stage mic at 6 cm (re-derived) — in a supercardioid's null, not a cardioid's; cupping warnings; phantom after connection with outputs muted; headroom ~10 dB in a digital recording; the no-provocation feedback rule everywhere (E04 EX4, E07, shared items); 3:1 defined mic-to-mic everywhere; 6 dB per doubling, 2.9 ms per metre, 3 dB per doubling of open mics; the 17 cm / 110° pair with a 95° recording angle; choir area mics 2–4 ft out, 1–3 ft above, aimed at the back rows, never over the heads; E07's guitar mic 15–30 cm from the 12th fret / sound hole, vocal mic rejection toward the guitar (front tilted up puts the guitar off the rear — re-derived), pickup/DI first live; E07's computed 3:1 shortfall is honest.
- **CL**: every page has a goal and a takeaway; foundations (MEET IT, STARTING SETUPS) before any operated mic; worked example before free placement; a FROM EARLIER retrieval item on each later page; every wrong option has its own why; briefs accept several setups and grade reasons; tendencies are worded as tendencies; the starting-points line is present; no brands or citations seen in learner text (the learner-text test passes).

## Shared-engine files touched
None. All edits are lesson data/copy (E01, E02 lesson + geometry setup card text, E04, E06, E07) plus one new test file.

## Tests
- New: `test/mikingLab5VoiceReview.test.ts` (4 tests: V-01…V-04).
- tsc clean; full suite 8848 / 8848 pass (8844 on final-lab + 4 new).
