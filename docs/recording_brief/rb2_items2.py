# -*- coding: utf-8 -*-
# Recording brief item data, part 2 (EQ .. Tuning), v2: one rec per DISTINCT recording.
# item(...) keeps id/title/pri/sess/group/used/safety/reuse/see/usedin/status.
# recs=[rec(rid, title, files, context, teaches, record, how, tips, specs{dict}, qc, safety?)]
# file tuple: (filename, variant, length, notes, kind)  kind: rec | edit | reuse | opt
try:
    from rb2_items1 import item, rec
except ImportError:  # rb2_items1 not written yet: stand-alone fallback for testing
    ITEMS = []

    def item(**k):
        k.setdefault("files", [f for r in k.get("recs", []) for f in r["files"]])
        ITEMS.append(k)

    rec = dict

R = rec

# ================================================================ EQ LAB
G = "EQ Lab"
FIX = ("EQ Lab › lesson 15 <em>Fix the Signal</em>: the learner reads a story (“the kick sounds thick and boomy”), sets FREQ, GAIN and Q on one band, presses CHECK and auditions the result. The app adds a hidden problem to the source and the learner's band must undo it. Today every scenario is pink noise with the hidden boost (“synthetic spectrum”).")
FIXHOW_MATCH = "Make the MATCHED copy with gain only: −20 dBFS RMS, peaks ≤ −3 dBFS (no EQ, no compression, no limiting)."

item(id="EQ-01a", title="Fix the Signal: clean kick loop (BOOMY KICK)", pri="P1", sess=[3], group=G,
 used=FIX + " Scenario: BOOMY KICK (+8 dB at 250 Hz).", safety=[],
 reuse="TL-03 (A vs C weighting), MTR-01 kick, MTR-02 kick.", see=["EQ-01b", "FX-01"],
 usedin="EQ Lab › Fix the Signal (src/screens/lab/eq/modules/FixSignal.tsx)",
 recs=[R(rid="EQ-01a.1", title="Clean kick drum loop, 96 BPM",
   files=[("eq_lab/eq01-kick-loop.wav", "Kick loop, 96 BPM", "10.000 s", "", "rec")],
   context="The source of the BOOMY KICK scenario. The app hides a +8 dB peak at 250 Hz (Q 1.4) on this loop and shows the story “the kick drum sounds thick and boomy — it swallows the bass line”; the learner sets one band, presses CHECK and hears whether the boom goes away. Because the app adds the boom, the recorded kick must start out clean, or a correct cut will leave it thin.",
   teaches="That “boomy” on a kick is a low-mid bump around 200–300 Hz, not the sub thump: a cut there restores punch while the 50–80 Hz body stays. Of the five loops, only the kick has its fundamental and its “box” this close together, so the learner learns to keep the cut narrow.",
   record="A clean, balanced kick drum alone: four on the floor with a few 8th-note pushes, steady velocity, to a 96 BPM click.",
   how=["Tune the kick for a short, controlled note: a front head with a port or a felt strip against the batter head. It must NOT be boomy (the app adds the boom).",
        "Mic: a large-diaphragm dynamic (RE20 class) 15 cm outside the front head, on-axis toward the beater. This is a flatter capture than an inside “kick-in” mic, which is already scooped.",
        "No high-pass, EQ or compression anywhere. Set the preamp so the hardest hits peak around −6 dBFS.",
        "Play 12 bars to the click (three-pass method) and deliver the middle 4 bars, cut on the downbeat at a zero crossing: exactly 10.000 s (480,000 samples).",
        FIXHOW_MATCH],
   tips=["Record it during the session-3 drum setup, straight after FX-01, so the kick is already tuned; only the outside mic is added.",
         "Choke the cymbals and switch the snare wires off so no ring from the rest of the kit rides on the kick.",
         "Check the take on an analyser before moving on: a smooth 150–400 Hz region means the app's +8 dB bump will be obvious."],
   specs={"Channels": "Mono", "Length": "10.000 s (4 bars at 96 BPM)", "Type": "Seamless loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED with EQ-01b–e", "Session": "3"},
   qc=["Balanced, not boomy: no obvious bump at 200–300 Hz on an analyser.", "Loops seamlessly when repeated.", "No snare-wire buzz or cymbal wash under the kick."])])

item(id="EQ-01b", title="Fix the Signal: forte sung vocal (HARSH VOCAL)", pri="P1", sess=[1], group=G,
 used=FIX + " Scenario: HARSH VOCAL (+7 dB at 3.2 kHz).", safety=[], reuse="None.", see=["EQ-01a", "FX-03"],
 usedin="EQ Lab › Fix the Signal (src/screens/lab/eq/modules/FixSignal.tsx)",
 recs=[R(rid="EQ-01b.1", title="Forte sung vocal, S2 chorus bars 5–7",
   files=[("eq_lab/eq01-vocal-forte-loop.wav", "Forte sung vocal, S2 bars 5–7", "9.000 s", "", "rec")],
   context="The source of the HARSH VOCAL scenario: the app adds +7 dB at 3.2 kHz (Q 2) and tells the learner “the vocal gets painful when the singer pushes”. The learner finds and cuts the presence peak with one band. It must be a pushed, full voice, because harshness is a complaint about loud singing.",
   teaches="Harshness lives in the 2–5 kHz presence region, where the ear is most sensitive. Unlike the sibilant loop (EQ-01e), the problem here sits under the vowels, not on the S sounds, so the learner hears the difference between a broad presence cut and a narrow de-ess.",
   record="The S2 chorus (bars 5–7) sung at full, pushed volume, but with a balanced, unharsh tone.",
   how=["House singing setup: LDC at 8 in, pop filter, DRY booth; no high-pass, EQ or compression.",
        "Warm the singer up on FX-03 first; then ask for the chorus at full voice without shouting or squeezing.",
        "Set gain on the loudest note so it peaks near −6 dBFS before matching.",
        "Sing to the house click and backing in headphones (keep headphone level low so nothing spills). Cut 3 bars at 80 BPM = 9.000 s on bar lines, with the loop point in a breath-free moment.",
        FIXHOW_MATCH],
   tips=["Record it in the same block as FX-03 and DES-01 while the singers are warm; only the brief changes, not the setup.",
         "Record both session singers and deliver the stronger one: one file only.",
         "If the voice already sounds edgy at 2–5 kHz, move the mic slightly off-axis instead of using EQ."],
   specs={"Channels": "Mono", "Length": "9.000 s (3 bars at 80 BPM)", "Type": "Seamless loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED with EQ-01a, c–e", "Session": "1"},
   qc=["Full and loud but not harsh to begin with.", "Loop point has no click or breath cut.", "No headphone click or backing spill audible."])])

item(id="EQ-01c", title="Fix the Signal: live vocal with stage rumble (STAGE RUMBLE)", pri="P1", sess=[5], group=G,
 used=FIX + " Scenario: STAGE RUMBLE (+9 dB at 60 Hz).", safety=["SAFE-2 applies: the PA and wedges are live; keep wedge sends low."],
 reuse="None.", see=["SS-01"], usedin="EQ Lab › Fix the Signal (src/screens/lab/eq/modules/FixSignal.tsx)",
 recs=[R(rid="EQ-01c.1", title="Live handheld vocal on a riser, no high-pass",
   files=[("eq_lab/eq01-vocal-live-rumble-loop.wav", "Live vocal on riser, no HPF", "9.000 s", "", "rec")],
   context="The source of the STAGE RUMBLE scenario: the app adds +9 dB at 60 Hz (Q 1) and tells the learner “something is rumbling under everything — you feel it more than hear it”. The learner should reach for a low cut. The real riser rumble in this file makes the app's boost sound like a real stage, not an added tone.",
   teaches="Sub-100 Hz rumble is the classic low-cut situation, and the reason high-pass filters are on every channel. It is the only loop in the set where real, mechanical low-frequency noise sits under the voice, so the learner hears that cutting below the voice costs nothing.",
   record="S2 bars 5–7 sung live into a handheld dynamic by a singer standing on a stage riser, with no high-pass filter anywhere, so the natural floor rumble is captured.",
   how=["At the venue (session 5): singer on a stage riser, handheld SM58-class mic at 2–3 in.",
        "Preamp and console high-pass OFF; capture from the console's direct out at line level.",
        "Let normal stage activity happen: light footsteps, shifting weight, the riser flexing. No exaggerated stomping.",
        "Sing to the house click in an in-ear or a low wedge; cut 3 bars of S2 at 80 BPM = 9.000 s.",
        FIXHOW_MATCH],
   tips=["Check on an analyser that there is real energy below 100 Hz before you move on.", "Record it in the venue's sound-check slot before SS-01 feedback work, while the stage is still quiet and wedges are low."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED with EQ-01a, b, d, e", "Session": "5"},
   qc=["Audible natural rumble/thump below 100 Hz, but the vocal is otherwise clean.", "No feedback ring or wedge howl anywhere in the 9 s."],
   safety=["SAFE-2: PA and wedges live; keep wedge sends low and a mute within reach."])])

item(id="EQ-01d", title="Fix the Signal: acoustic guitar strum (HONKY GUITAR)", pri="P1", sess=[3], group=G,
 used=FIX + " Scenario: HONKY GUITAR (+7 dB at 800 Hz).", safety=[],
 reuse="EAR-01 acoustic guitar excerpts, MTR-01 guitar.", see=["MSL-01"], usedin="EQ Lab › Fix the Signal (src/screens/lab/eq/modules/FixSignal.tsx)",
 recs=[R(rid="EQ-01d.1", title="Acoustic guitar strum loop, A minor, 80 BPM",
   files=[("eq_lab/eq01-acgtr-strum-loop.wav", "Acoustic guitar strum", "9.000 s", "", "rec")],
   context="The source of the HONKY GUITAR scenario: the app adds +7 dB at 800 Hz (Q 1.4) and tells the learner “the acoustic guitar sounds boxy and honky, like it's in a cardboard tube”. The learner finds the low-mid peak. The guitar must start natural, neither boomy nor thin.",
   teaches="“Boxy/honky” points at the 400–1000 Hz low-mids. The guitar is the only loop whose problem sits in the middle of its own range, so the learner hears that a mid cut can open a sound up without making it quieter.",
   record="A clean, steady strummed A-minor progression on acoustic guitar to an 80 BPM click.",
   how=["Small-diaphragm condenser (SDC) 20 cm from where the neck meets the body, aimed at the 12th–14th fret. A DRY-ish room.",
        "No high-pass or EQ. Gain so the loudest strums peak around −6 dBFS.",
        "Strum steady 8ths to the click; play 9 bars and cut 3 bars from the middle = 9.000 s on bar lines.",
        FIXHOW_MATCH],
   tips=["Record it straight after MSL-01's guitar cluster with the same guitar and fresh-ish strings.",
         "Aiming at the sound hole makes it boomy, not honky; keep the mic on the neck joint."],
   specs={"Channels": "Mono", "Length": "9.000 s (3 bars at 80 BPM)", "Type": "Seamless loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED with EQ-01a–c, e", "Session": "3"},
   qc=["Natural, balanced guitar; not already boxy.", "Even strum level across the 3 bars; loop seamless."])])

item(id="EQ-01e", title="Fix the Signal: sibilant vocal loop (SIBILANT VOCAL)", pri="P1", sess=[3], group=G,
 used=FIX + " Scenario: SIBILANT VOCAL (+6 dB at 6.5 kHz, narrow).", safety=[], reuse="—", see=["DES-01"],
 usedin="EQ Lab › Fix the Signal (src/screens/lab/eq/modules/FixSignal.tsx)",
 recs=[R(rid="EQ-01e.1", title="Sibilant vocal loop (edit of DES-01 female S2)",
   files=[("eq_lab/eq01-vocal-sibilant-loop.wav", "Sibilant vocal (edit of DES-01 female S2)", "9.000 s", "Edit — no new recording", "edit")],
   context="The source of the SIBILANT VOCAL scenario: the app adds a narrow +6 dB at 6.5 kHz (Q 3) and tells the learner “every S and T spits”. The learner must find a narrow cut high up. The loop needs many real S, Z and SH sounds so the boost lands on consonants.",
   teaches="Sibilance sits around 5–8 kHz, and a narrow cut (or a de-esser) tames it. Compared with HARSH VOCAL, the learner hears a problem that only appears on consonants and leaves the vowels untouched.",
   record="No new recording: a 9 s loop edited from the DES-01 female sung S2 take.",
   how=["Choose the 3 bars of the DES-01 female sung take with the most S, Z and SH sounds; cut on bar lines (9.000 s at 80 BPM).",
        "No de-essing and no EQ: the raw S energy is the point.",
        FIXHOW_MATCH],
   tips=["Edit on the mix day together with the other EQ-01 loops so all five can be matched in one pass with one meter."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED with EQ-01a–d", "Source": "DES-01 female sung S2"},
   qc=["Real S energy at 5–9 kHz; no de-essing.", "Loop point not on an S (no chopped consonant)."])])

item(id="EQ-02", title="Find the Frequency, Challenges, Multi-band: piano loop", pri="P2", sess=[3], group=G,
 used="EQ Lab › <em>Find the Frequency</em>, the challenge modules and multi-band work: the learner hunts a boosted band by ear. Today the audition is pink noise or a sweep.",
 safety=[], reuse="EAR-01 piano excerpts.", see=["EQ-01a", "FX-04", "MST-01"],
 usedin="EQ Lab › Find the Frequency, Challenges, Multi-band (src/screens/lab/eq/modules/)",
 recs=[R(rid="EQ-02.1", title="Piano loop across low, middle and high registers",
   files=[("eq_lab/eq02-piano-loop.wav", "Piano loop", "9.000 s", "", "rec")],
   context="One of the real programmes the learner can audition in Find the Frequency and the challenges: the app boosts a hidden band and the learner sweeps to find it. The other programmes reuse the EQ-01 loops, MST-01 and the FX-04 bass DI. The piano is the wide-range source: it has to carry energy in every band the game can pick.",
   teaches="Finding a frequency by ear on real, wide-range music rather than noise. Piano shows a boost as a change in one register (boomy left hand, honky middle, glassy top), which the single-instrument loops cannot.",
   record="A chordal A-minor figure on acoustic piano at 80 BPM, moving across the low, middle and high registers.",
   how=["Acoustic piano; one mic (SDC or LDC) 30 cm above the hammers, or a pair summed to mono (check the sum for comb filtering).",
        "Play a chordal A-minor figure covering roughly A1 to A6 inside 3 bars, to click.",
        "No EQ or compression. Cut 3 bars on bar lines = 9.000 s.",
        "Make the MATCHED copy at −20 dBFS RMS (gain only)."],
   tips=["Play across a wide range so every band has energy.", "If session 7's tuned piano is the studio piano, record this right after DIG-01 and TUN-01."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED with EQ-01", "Session": "3"},
   qc=["Energy from about 60 Hz to 8 kHz on an analyser.", "Mono sum (if a pair) has no hollow, phasey colour."]),
  R(rid="EQ-02.2", title="Bass DI loop (reuse of FX-04.3)",
   files=[("fx_labs/fx04-bass-di-loop.wav", "Bass DI loop", "—", "Reuse — delivered under FX-04", "reuse")],
   context="The low-end programme for Find the Frequency and the multi-band work. The file is delivered once, under FX-04.3.",
   teaches="Hunting a boost in the bass range, where 60, 120 and 250 Hz are hard to tell apart on small speakers.",
   record="Reuse — no new recording. Source: FX-04.3.", how=["Nothing extra to record."],
   tips=["Make sure FX-04.3 has clear note attacks: those carry the bass's upper harmonics that the higher bands act on."],
   specs={"Source": "FX-04.3"}, qc=["See FX-04.3."])])

# ================================================================ FX / DYNAMICS
G = "FX and Dynamics Labs"
FX01_RIG = "Same performance as FX-01.2–.7, captured at the same time (full kit, 96 BPM, three-pass take; deliver the middle 4 bars = 10.000 s, 480,000 samples)."
item(id="FX-01", title="Dry dynamic drum loop — 96 BPM", pri="P1", sess=[3], group=G,
 used="Compression lab (also Gate, Limiter, Distortion, Delay, Reverb): the learner rides THRESHOLD, RATIO, ATTACK and RELEASE and watches measured gain reduction. Today the only sources are click, sine and pink noise.",
 safety=[], reuse="FX-02 (tom and snare), ENV context, EAR-01 drum excerpts, AMP-01 programme option.", see=["FX-02", "EAR-02", "EQ-01a"],
 usedin="FX labs › Compression, Gate, Limiter, Distortion (src/screens/lab/fxLabConfigs.tsx)",
 recs=[
  R(rid="FX-01.1", title="Stereo kit balance (faders and pans only)",
   files=[("fx_labs/fx01-drums-stereo-loop.wav", "Stereo balance (faders/pans only)", "10.000 s", "", "edit")],
   context="The default programme in the Compression, Limiter and Distortion labs. The learner moves THRESHOLD, RATIO, ATTACK and RELEASE and watches gain reduction on a whole kit. It is a balance of FX-01.2–.7, so its dynamics must be untouched for the lesson to work.",
   teaches="How attack and release shape a whole kit: a slow attack lets the stick through, a fast one flattens it, a short release pumps, and heavy compression lifts ghost notes and room. Only the full mix shows the kit “breathing” as one.",
   record="A fader-and-pan balance of the seven FX-01 close and overhead tracks: no new performance.",
   how=["Balance kick, snare, hi-hat, rack tom, floor tom and the overhead pair with faders and pans only: no EQ, no compression, no bus processing.",
        "Pan overheads hard L/R, toms to match their overhead image, kick and snare centre.",
        "Render the same 480,000-sample region as the tracks, peaks −6 dBFS."],
   tips=["Bounce it the same day as the take while the kit image is fresh; note the fader and pan values in the sidecar."],
   specs={"Channels": "Stereo", "Length": "10.000 s (480,000 samples)", "Type": "Seamless loop", "Levels": "Peaks −6 dBFS; no bus processing", "Set": "Raw", "Source": "FX-01.2–.7"},
   qc=["Crest factor ≥ 15 dB (drums uncompressed).", "Ghost notes audible but 15–20 dB below the accents.", "Loops seamlessly."]),
  R(rid="FX-01.2", title="Kick close track",
   files=[("fx_labs/fx01-kick.wav", "Kick", "10.000 s", "", "rec")],
   context="Used solo in the Compression and Gate labs when the learner focuses on one drum, and as a component of FX-01.1. A kick under a compressor is the classic attack-time demonstration.",
   teaches="Attack time on a single low, fast transient: a 1 ms attack removes the beater click, 20–30 ms lets it through and adds punch.",
   record="The kick mic of the FX-01 take.",
   how=[FX01_RIG, "Kick: dynamic inside the shell or at the port, as for MIX-01; no gate, no EQ.", "Gain so the hardest accent peaks at −6 dBFS."],
   tips=["Record FX-01, EAR-02 (100 BPM) and EQ-01a (kick only, 96 BPM) back-to-back on the same kit setup.", "Mark preamp gains with tape; check every channel peaks near −6 dBFS on the loudest accent."],
   specs={"Channels": "Mono", "Length": "10.000 s (480,000 samples)", "Levels": "Peaks −6 dBFS", "Set": "Raw"},
   qc=["Clear beater attack on every hit.", "Exactly 480,000 samples, aligned with the other FX-01 tracks."]),
  R(rid="FX-01.3", title="Snare top close track with real bleed",
   files=[("fx_labs/fx01-snare.wav", "Snare top", "10.000 s", "Real bleed — no gate", "rec")],
   context="The snare source in the Compression and Gate labs (reused by FX-02). Ghost notes and hi-hat bleed sit between the backbeats, so a compressor lifts them and a gate has to decide what to cut.",
   teaches="What a compressor does to dynamics inside one instrument (accents vs ghost notes), and that real close mics are never isolated: the hi-hat bleed is part of the sound.",
   record="The snare-top mic of the FX-01 take, ungated.",
   how=[FX01_RIG, "Snare top: dynamic (SM57 class) 3–5 cm above the rim, aimed at the centre, angled away from the hi-hat; no gate.", "Gain so the loudest accent peaks at −6 dBFS."],
   tips=["Ask the drummer for soft, clear ghost notes: at least 15 dB below the backbeat."],
   specs={"Channels": "Mono", "Length": "10.000 s (480,000 samples)", "Levels": "Peaks −6 dBFS", "Set": "Raw, ungated"},
   qc=["Ghost notes audible; hi-hat bleed audible between hits.", "No gate or expander on the channel."]),
  R(rid="FX-01.4", title="Hi-hat close track",
   files=[("fx_labs/fx01-hihat.wav", "Hi-hat", "10.000 s", "", "rec")],
   context="A component of FX-01.1 and the steady high-frequency part of the kit in the Distortion and Limiter labs.",
   teaches="A dense, high, low-crest source: compression barely moves it, distortion turns it to fizz — the opposite of the kick.",
   record="The hi-hat mic of the FX-01 take.",
   how=[FX01_RIG, "Hi-hat: SDC 10–15 cm above the top cymbal, aimed between bell and edge, pointing away from the snare."],
   tips=["Keep it away from the hi-hat's air blast when the pedal closes."],
   specs={"Channels": "Mono", "Length": "10.000 s (480,000 samples)", "Levels": "Peaks −6 dBFS", "Set": "Raw"},
   qc=["No air-puff thumps from the pedal closing.", "Accents and openings audible."]),
  R(rid="FX-01.5", title="Rack tom close track, undamped",
   files=[("fx_labs/fx01-tom-rack.wav", "Rack tom", "10.000 s", "Undamped, real ring", "rec")],
   context="A component of FX-01.1; it carries the first half of the bar-4 fill. In the Gate lab it is the higher, shorter-ringing tom alongside the floor tom (FX-02).",
   teaches="A pitched, ringing drum: release time decides whether the ring is kept or chopped. A rack tom rings shorter and higher than the floor tom.",
   record="The rack-tom mic of the FX-01 take, undamped.",
   how=[FX01_RIG, "Rack tom: dynamic 3–5 cm over the rim, aimed at the centre. Tuned to ring, NO gel or ring damper, no gate."],
   tips=["Check before the take that no tom has a gel or damper on it."],
   specs={"Channels": "Mono", "Length": "10.000 s (480,000 samples)", "Levels": "Peaks −6 dBFS", "Set": "Raw, ungated"},
   qc=["Natural ring after each fill hit; snare and kick bleed between hits."]),
  R(rid="FX-01.6", title="Floor tom close track, undamped",
   files=[("fx_labs/fx01-tom-floor.wav", "Floor tom", "10.000 s", "Undamped, real ring", "rec")],
   context="A component of FX-01.1 and the main source of the Gate lab (reused by FX-02): the floor tom's long ring and the kit bleed between fill hits are what the gate opens and closes on.",
   teaches="The gate's CHATTER lesson: a long, decaying ring crossing the threshold makes the gate flutter unless HOLD and RELEASE are set sensibly.",
   record="The floor-tom mic of the FX-01 take, undamped.",
   how=[FX01_RIG, "Floor tom: dynamic 3–5 cm over the rim, aimed at the centre. Tuned to ring, NO damping, no gate."],
   tips=["The bar-4 fill must end on the floor tom so the last hit rings into the loop point."],
   specs={"Channels": "Mono", "Length": "10.000 s (480,000 samples)", "Levels": "Peaks −6 dBFS", "Set": "Raw, ungated"},
   qc=["Floor tom rings at least 0.5 s after each hit.", "Hi-hat and snare bleed audible between hits."]),
  R(rid="FX-01.7", title="Overhead pair (left and right)",
   files=[("fx_labs/fx01-oh-l.wav", "Overhead left", "10.000 s", "", "rec"), ("fx_labs/fx01-oh-r.wav", "Overhead right", "10.000 s", "", "rec")],
   context="The overall kit picture inside FX-01.1. The two files are one stereo recording, delivered as two mono files.",
   teaches="What the kit sounds like as a whole in the room; under compression the overheads bring up cymbal wash and room.",
   record="The overhead pair of the FX-01 take.",
   how=[FX01_RIG, "Matched SDC pair, spaced or ORTF, about 1 m above the cymbals; equal distance to the snare (measure it) so the snare sits centred."],
   tips=["Measure snare-to-capsule distance for both mics with a string or tape."],
   specs={"Channels": "2 × mono (L, R)", "Length": "10.000 s (480,000 samples) each", "Levels": "Peaks −6 dBFS", "Set": "Raw"},
   qc=["Snare centred when the two files are panned L/R.", "Both files exactly 480,000 samples."]),
 ])

item(id="FX-02", title="Gate lab: close tom and snare with real bleed and ring", pri="P2", sess=[3], group=G, status="reuse",
 used="Gate lab: THRESHOLD, HOLD, RELEASE and the CHATTER lesson. Today the source is a click.",
 safety=[], reuse="—", see=["FX-01"], usedin="FX labs › Gate (src/screens/lab/fxLabConfigs.tsx)",
 recs=[R(rid="FX-02.1", title="Floor tom and snare from FX-01 (reuse of FX-01.6 and FX-01.3)",
   files=[("fx_labs/fx01-tom-floor.wav", "Floor tom with bleed and ring", "—", "Reuse — delivered under FX-01", "reuse"),
          ("fx_labs/fx01-snare.wav", "Snare with bleed", "—", "Reuse — delivered under FX-01", "reuse")],
   context="The Gate lab loads these two tracks unedited: the floor tom for ring and CHATTER, the snare for bleed and ghost notes. They are delivered once, under FX-01.",
   teaches="A gate reacts to what a hit decays to; real tom ring and real bleed make the chatter and release choices audible in a way a click cannot.",
   record="Reuse — no new recording. Sources: FX-01.6 (floor tom) and FX-01.3 (snare).",
   how=["Nothing extra to record. It depends on FX-01 being captured with undamped toms and no gates."],
   tips=["Check before the FX-01 take that no tom has a gel or ring damper on it."],
   specs={"Source": "FX-01.6, FX-01.3 (unedited)"},
   qc=["Floor tom rings at least 0.5 s after each hit; hi-hat bleed audible between hits."])])

FX03_HOW = ["House singing setup: LDC at 8 in, pop filter, DRY booth; no high-pass, EQ or compression.",
            "Sing S2 to the house click and backing in headphones (closed-back, low level): verse soft and close, chorus full voice. Keep the singer's distance constant; the level change must come from the voice.",
            "Fixed gain set on the loudest chorus note (peaks ≈ −6 dBFS); do not ride it.",
            "Deliver bars 3–8 = 18.000 s at 80 BPM, cut on bar lines."]
item(id="FX-03", title="Dry sung lead vocal — soft verse into loud chorus", pri="P2", sess=[1], group=G,
 used="Reverb, Delay, Chorus (doubling) and Compression labs: a real vocal through the effect. Today only noise, sine and click are offered.",
 safety=[], reuse="GAN-01 sources.", see=["MIX-01", "DES-01"], usedin="FX labs › Reverb, Delay, Chorus, Compression (src/screens/lab/fxLabConfigs.tsx)",
 recs=[
  R(rid="FX-03.1", title="Male lead vocal, S2 bars 3–8",
   files=[("fx_labs/fx03-vocal-male.wav", "Male, S2 bars 3–8", "18.000 s", "", "rec")],
   context="The male vocal choice in the Reverb, Delay, Chorus and Compression labs; also a programme in the Gain Staging lab (GAN-01). The learner hears the effect sit behind a real voice and watches the compressor ride the jump from soft verse to loud chorus.",
   teaches="How reverb and delay sit behind a lower voice, where the tail can muddy the low mids, and how a compressor evens out a 6 dB+ jump in level. Compare with FX-03.2: the same effect settings land differently on a lower, fuller voice.",
   record="S2 bars 3–8 sung by the male session singer: soft verse into a full chorus.",
   how=FX03_HOW,
   tips=["Record FX-03, DES-01 and EQ-01b in one block with the singers warmed up; only the brief changes.", "Do the male take first, then swap singers without changing mic or gain structure (re-set gain only)."],
   specs={"Channels": "Mono", "Length": "18.000 s", "Levels": "Chorus peaks ≈ −6 dBFS", "Set": "Raw (fixed gain per singer)", "Session": "1"},
   qc=["Chorus at least 6 dB louder than the verse.", "Completely dry: no headphone click spill."]),
  R(rid="FX-03.2", title="Female lead vocal, S2 bars 3–8",
   files=[("fx_labs/fx03-vocal-female.wav", "Female, S2 bars 3–8", "18.000 s", "", "rec")],
   context="The female vocal choice in the same labs. Her brighter, higher voice makes delay repeats and chorus doubling more obvious, and the S sounds hit a reverb harder.",
   teaches="How the same effect settings sound on a higher voice: sibilance splashing into the reverb, a chorus that sounds more obviously doubled. Compare with FX-03.1.",
   record="S2 bars 3–8 sung by the female session singer: soft verse into a full chorus.",
   how=FX03_HOW,
   tips=["Same rig as FX-03.1; re-set the preamp for her loudest chorus note."],
   specs={"Channels": "Mono", "Length": "18.000 s", "Levels": "Chorus peaks ≈ −6 dBFS", "Set": "Raw (fixed gain per singer)", "Session": "1"},
   qc=["Chorus at least 6 dB louder than the verse.", "Completely dry: no headphone click spill.", "S sounds natural and unprocessed."]),
 ])

FX04_GTR = "Guitar → DI box → amp; clean A-minor arpeggios at 80 BPM to click. Print the DI and the amp mic at the same time from the same take (never re-amp later); cut 3 bars = 9.000 s on bar lines."
item(id="FX-04", title="Clean electric guitar (DI + amp together) and a bass DI", pri="P2", sess=[3], group=G,
 used="Chorus, Flanger, Phaser and Distortion labs: the learner hears the effect on a real instrument instead of noise or a sine.",
 safety=[], reuse="EQ-02 bass DI, EAR-01 bass excerpts, MPR-06 rear source, TL-03, SC-01, GAN-01.", see=["EQ-02", "GAN-01"],
 usedin="FX labs › Chorus, Flanger, Phaser, Distortion (src/screens/lab/fxLabConfigs.tsx)",
 recs=[
  R(rid="FX-04.1", title="Clean electric guitar, DI",
   files=[("fx_labs/fx04-egtr-di-loop.wav", "Electric guitar DI", "9.000 s", "", "rec")],
   context="The guitar source for the Distortion lab and a clean source for Chorus, Flanger and Phaser. The app's distortion acts like an amp on this raw pickup signal, so the learner can drive it from clean to fuzz.",
   teaches="What a guitar pickup sounds like before any amp: thin, bright and very dynamic. It is the right input for distortion, and the learner hears how much of a “guitar sound” the amp adds (compare FX-04.2).",
   record="The DI output of the clean arpeggio take.",
   how=[FX04_GTR, "DI: active or passive DI box with a high-impedance input; pickup selector and tone noted in the sidecar.", "Gain so the hardest pick peaks at −6 dBFS."],
   tips=["Fresh strings and a well-intonated guitar; check tuning before every take."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "Peaks −6 dBFS", "Set": "Raw", "Session": "3"},
   qc=["No buzz from single-coil hum (turn away from lights or use the middle position).", "Loop seamless; notes ring through the loop point."]),
  R(rid="FX-04.2", title="Clean electric guitar, amp mic (same take as the DI)",
   files=[("fx_labs/fx04-egtr-amp-loop.wav", "Electric guitar amp mic (same take)", "9.000 s", "", "rec")],
   context="The amp version of the same performance as FX-04.1, for the modulation labs. The learner can A/B a modulation effect on the DI and on the amp, and compare a clean DI with a miked amp.",
   teaches="How a speaker and cabinet shape a guitar: the top end above about 5 kHz rolls off and the mids come forward. Modulation sounds smoother on it than on the bright DI.",
   record="The amp-mic channel of the same take as FX-04.1.",
   how=[FX04_GTR, "Amp set clean (no breakup); SM57-class dynamic 3 cm from the grille, on-axis just off the dust cap. Note the amp model and settings.", "Gain so the hardest pick peaks at −6 dBFS."],
   tips=["Turn the amp up enough that the speaker works, but stay below breakup; check with the hardest strum."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "Peaks −6 dBFS", "Set": "Raw", "Session": "3"},
   qc=["Clean, no breakup.", "Aligned with the DI within the amp's natural delay; note the offset in the sidecar."]),
  R(rid="FX-04.3", title="Bass DI loop",
   files=[("fx_labs/fx04-bass-di-loop.wav", "Bass DI", "9.000 s", "", "rec")],
   context="The bass source for the Chorus and Distortion labs, and reused widely: the EQ-02 low-end programme, the EAR-01 bass excerpts, the MPR-06 rear source and the GAN-01 programme. A clean DI is the most flexible bass signal the app can have.",
   teaches="How modulation and distortion behave on a low, fundamental-heavy instrument: chorus can blur the low end, distortion adds the upper harmonics that make bass audible on small speakers.",
   record="A melodic finger-style bass line, DI only, at 80 BPM with clear note attacks.",
   how=["Bass → DI box (high-impedance input) → interface; no amp needed.", "A melodic finger-style line in A minor at 80 BPM to click, with clear, even attacks.", "Gain so the strongest note peaks at −6 dBFS; cut 3 bars = 9.000 s."],
   tips=["Record it straight after the guitar on the same DI box.", "Ask for clear attacks: EAR-01 needs the finger noise for energy up high."],
   specs={"Channels": "Mono", "Length": "9.000 s", "Type": "Seamless loop", "Levels": "Peaks −6 dBFS", "Set": "Raw", "Session": "3"},
   qc=["Even notes, no fret buzz.", "Loop seamless with no low-frequency thump at the loop point."]),
 ])

item(id="FX-05", title="Stereo Imaging lab programme", pri="P2", sess=[3], group=G, status="reuse",
 used="Stereo Imaging lab: width, M/S and mono safety.", safety=[], reuse="—", see=["MST-01", "MPR-07"],
 usedin="FX labs › Stereo Imaging (src/screens/lab/fxLabConfigs.tsx)",
 recs=[R(rid="FX-05.1", title="Stereo mix and spaced pair (reuse of MST-01 and MPR-07)",
   files=[("mastering_lab/mst01-mix-unmastered.wav", "Stereo mix", "—", "Reuse — MST-01", "reuse"), ("mic_principles/mpr07-ab.wav", "Spaced-pair recording", "—", "Reuse — MPR-07", "reuse")],
   context="The Stereo Imaging lab plays these two files while the learner widens, narrows and checks mono. Delivered under MST-01 (a) and MPR-07 (AB).",
   teaches="Width and mono compatibility on real stereo material: a panned mix holds up in mono, a spaced pair loses some highs and gains comb colour.",
   record="Reuse — no new recording. Sources: MST-01 (a) and MPR-07 AB.", how=["Nothing extra to record."], tips=[],
   specs={"Source": "MST-01 (a), MPR-07 AB"}, qc=["See MST-01 and MPR-07."])])

item(id="FX-06", title="Phase lab: polarity and phase multitrack", pri="P2", sess=[3], group=G, status="reuse",
 used="Phase lab: polarity vs phase, cancellation.", safety=[], reuse="—", see=["MIX-02"], usedin="FX labs › Phase (src/screens/lab/fxLabConfigs.tsx)",
 recs=[R(rid="FX-06.1", title="Three two-mic pairs from MIX-01 and MIX-02 (reuse)",
   files=[(f"mixing_lab/{n}.wav", d, "—", "Reuse — MIX-01/MIX-02", "reuse") for n, d in (("mix-kick", "Kick in"), ("mix-kick-out", "Kick out"), ("mix-snare", "Snare top"), ("mix-snare-bottom", "Snare bottom"), ("mix-bass", "Bass DI"), ("mix-bass-amp", "Bass amp"))],
   context="The Phase lab loads kick in/out, snare top/bottom and bass DI/amp as pairs; the learner flips polarity and slides one track in time against the other. Delivered under MIX-01 and MIX-02.",
   teaches="Two mics on one source: flipping polarity and delaying one changes the sum. Snare top/bottom is the polarity case, kick in/out and DI/amp the time-delay case.",
   record="Reuse — no new recording.", how=["Nothing extra; MIX-02 must stay un-aligned and un-flipped."], tips=[],
   specs={"Source": "MIX-01 + MIX-02, 6 files"}, qc=["See MIX-01 and MIX-02: sample-aligned, unedited, no polarity flips."])])

# ================================================================ METER / GAIN / WAVE / DIGITAL / FOUNDATIONS / START HERE
G = "Meter, Gain, Wave, Digital, Foundations, Start Here"
item(id="MTR-01", title="Meter teaching signals: drawbar organ chord", pri="P2", sess=[3], group=G,
 used="Meter lab: the learner switches teaching signals (speech, kick, snare, guitar, organ, music, plus generators) and watches peak, RMS, LUFS and VU readings. Today the signals are synthesized.",
 safety=[], reuse="TL-05 organ.", see=["ENV-02", "MTR-02"], usedin="Meter lab › teaching signals (src/screens/lab/meter/meterEngine.ts)",
 recs=[R(rid="MTR-01.1", title="Held drawbar organ chord, A minor, loop",
   files=[("meter/mtr01-organ-chord-loop.wav", "Drawbar organ chord, held", "8 s", "", "rec")],
   context="The “organ” teaching signal in the Meter lab, alongside reused speech (SPC-04), kick (EQ-01a), snare (ENV-01), guitar (EQ-01d) and music (MST-01). The learner switches to it and watches peak, RMS, LUFS and VU settle on steady values.",
   teaches="A steady, sustained signal has a low crest factor: peak and RMS sit close together and every meter reads steadily. It is the opposite of the kick and snare, whose peaks run far above their average.",
   record="An A-minor chord held steady on a drawbar organ, no rotary speed.",
   how=["Drawbar organ (or a clonewheel), stationary: rotary/Leslie OFF or stopped, vibrato and chorus off, percussion off. Note the drawbar setting.",
        "Capture DI from the organ's line out, or a mic on the speaker if there is no line out (note which).",
        "Hold the chord for 15 s with no expression-pedal movement; cut an 8 s loop. A ≤ 50 ms equal-power loop crossfade is allowed (an edit, not processing).",
        "Level: RMS ≈ −20 dBFS; raw, no processing."],
   tips=["Do ENV-02's organ swell on the same setup straight after.", "Tape the expression pedal down so the level cannot drift."],
   specs={"Channels": "Mono", "Length": "8 s loop", "Levels": "RMS ≈ −20 dBFS", "Set": "Raw", "Session": "3"},
   qc=["No level wobble at the loop point; no rotary modulation.", "Peak-to-RMS (crest factor) small and steady across the loop."])])

item(id="MTR-02", title="“Read the shape” spectrum set: whistle glide and birdsong", pri="P3", sess=[1, 6], group=G,
 used="Meter lab spectral pages: the learner reads spectra of speech, cymbal, kick, guitar, hum and feedback. New shapes to read: a moving whistle and birdsong.",
 safety=[], reuse="None.", see=["MTR-01"], usedin="Meter lab › spectrum shapes (src/screens/lab/meter/)",
 recs=[
  R(rid="MTR-02.1", title="Human whistle, slow glide low to high",
   files=[("meter/mtr02-whistle-glide.wav", "Whistle glide", "10 s", "Session 1", "rec")],
   context="A “read the shape” example on the Meter lab's spectrum pages. Against the broad shapes of speech and cymbal, the learner sees one thin line move steadily up the frequency axis.",
   teaches="A whistle is nearly a pure tone: one peak with almost no harmonics. When it glides, the learner links a moving spectral line to rising pitch.",
   record="A human whistle gliding slowly and evenly from about 1 kHz to about 3 kHz over 10 s.",
   how=["Booth (session 1), SDC at 30 cm, slightly off-axis to avoid breath noise.", "One slow, continuous glide upward over about 1–3 kHz, steady loudness; repeat 3–4 times and keep the smoothest.", "Peaks ≤ −6 dBFS; raw."],
   tips=["Record it between session-1 speech takes with whoever whistles most cleanly.", "A tuner app on the whistler's phone helps keep the glide slow."],
   specs={"Channels": "Mono", "Length": "10 s", "Levels": "Peaks ≤ −6 dBFS", "Session": "1"},
   qc=["One clean line on a spectrogram with little breath noise.", "Glide continuous, no breaks."]),
  R(rid="MTR-02.2", title="Birdsong, one bird, quiet background",
   files=[("meter/mtr02-birdsong.wav", "Birdsong", "10 s", "Session 6", "rec")],
   context="The second new shape on the spectrum pages: dense, fast chirps that look completely different from speech or a held tone.",
   teaches="Fast frequency sweeps and harmonic chirps, mostly 2–8 kHz: the learner sees rapid, high-pitched movement that the ear hears as “bright and busy”.",
   record="10 s of one bird singing with little background, recorded outdoors.",
   how=["Field (session 6) at dawn, away from roads. Shotgun or parabolic mic aimed at a single singing bird.", "Record several minutes; choose 10 s with one bird and no traffic, wind or voices.", "Peaks ≤ −6 dBFS; a wind cover on the mic."],
   tips=["Do it at dawn on the same morning as WAV-01 and WAV-04 (same quiet conditions).", "Note the species if you know it; location goes in the sidecar."],
   specs={"Channels": "Mono", "Length": "10 s", "Levels": "Peaks ≤ −6 dBFS", "Session": "6"},
   qc=["No traffic, wind thumps or voices.", "Only one bird clearly dominant."]),
 ])

item(id="GAN-01", title="Gain staging: preamp noise capture", pri="P2", sess=[1], group=G,
 used="Gain Staging lab: the learner sets gain at each stage and hears the consequences: “too low early” lifts the hiss when the level is made up later; “clipped early, faded later” keeps the distortion. Today it is the built-in generator only.",
 safety=[], reuse="Digital noise floor.", see=["MSL-02", "FX-03", "FX-04"], usedin="Gain Staging lab (src/screens/lab/gain/)",
 recs=[R(rid="GAN-01.1", title="Real preamp noise at +60 dB, dynamic mic connected",
   files=[("gain_staging/gan01-preamp-noise-60db.wav", "Preamp noise, +60 dB, mic connected", "10 s", "", "rec")],
   context="The real noise floor the Gain Staging lab adds under its programme (FX-03 vocal, FX-04 guitar). When the learner sets gain too low early and makes it up later, this hiss rises with it.",
   teaches="That noise comes in at the stage where it happens: the preamp's own hiss, plus the mic's source resistance, is fixed once the gain is set. Later gain cannot remove it.",
   record="A preamp's noise with a dynamic mic connected, about +60 dB of gain, nothing playing, 10 s.",
   how=["Do it with MSL-02 at the quietest time in the booth; HVAC off.", "Dynamic mic connected (phantom OFF), pointed into an isolation box or under a heavy blanket.",
        "Preamp at about +60 dB; note the exact value and the preamp model.", "Record 10 s; no normalising, no processing."],
   tips=["Record a second 10 s at +40 dB too if time allows (archive only).", "Listen on headphones at a raised level before delivering: any hum tone means move the cable away from power."],
   specs={"Channels": "Mono", "Length": "10 s", "Levels": "Whatever the noise is — do not normalise", "Gain": "≈ +60 dB (exact value logged)", "Session": "1"},
   qc=["Steady hiss only; no hum tones, no room sounds."])])

WAV01_HOW = ["Open grassy field at least 30 m from any building, wall or large tree; still air (no wind).", "Omni at 1 m from the source, 1.5 m high; wind cover on.", "Peaks ≤ −3 dBFS. Record two of each and keep the best."]
item(id="WAV-01", title="Dry impulsive sources: clap, clave, S1", pri="P2", sess=[6], group=G,
 used="Wave lab <em>Echo Laboratory</em>, <em>Comb Filtering Laboratory</em> and <em>Reverberation Laboratory</em>: the app will add echoes, combs and reverb to a dry source. Today the sources are generated clicks.",
 safety=[], reuse="WAV-02 / WAV-04 comparison.", see=["WAV-02", "WAV-04", "WAV-03"], usedin="Wave lab › Echo, Comb, Reverb modules (src/screens/lab/wave/)",
 recs=[
  R(rid="WAV-01.1", title="Hand clap, dry outdoors",
   files=[("wave_lab/wav01-clap.wav", "Hand clap, dry", "1.5 s", "", "rec")],
   context="The dry clap the Wave lab feeds into its echo, comb and reverb simulations, and the “no room” reference against the claps in WAV-02 spaces and the WAV-04 wall echo.",
   teaches="What a clap sounds like with no space at all: a short, broadband burst with no tail. Every echo and reverb the learner then hears is clearly added.",
   record="A single, firm hand clap with cupped hands, outdoors.", how=WAV01_HOW,
   tips=["Schedule early morning at a quiet time, away from traffic.", "Do WAV-01 before the WAV-04 wall echo on the same day, with the same person clapping."],
   specs={"Channels": "Mono", "Length": "≈ 1.5 s", "Levels": "≤ −3 dBFS", "Conditions": "Outdoors, ≥ 30 m from reflectors, no wind", "Session": "6"},
   qc=["No audible echo or room after the clap.", "No wind noise."]),
  R(rid="WAV-01.2", title="Clave hit, dry outdoors",
   files=[("wave_lab/wav01-clave.wav", "Clave, dry", "1.5 s", "", "rec")],
   context="A second dry impulse for the same Wave lab modules. Unlike the clap it has a pitch, so comb filtering and echoes act on a tonal hit.",
   teaches="A short, pitched impulse (a woody ring, typically around 2–2.5 kHz) shows comb notches and echo repeats as a change in tone, where the clap shows them as a change in texture.",
   record="One clave hit, outdoors.", how=WAV01_HOW,
   tips=["Same spot and mic as WAV-01.1; just swap the source."],
   specs={"Channels": "Mono", "Length": "≈ 1.5 s", "Levels": "≤ −3 dBFS", "Conditions": "Outdoors, ≥ 30 m from reflectors, no wind", "Session": "6"},
   qc=["Clean ring, no hand rattle, no echo."]),
  R(rid="WAV-01.3", title="S1 spoken, dry outdoors",
   files=[("wave_lab/wav01-s1.wav", "S1, dry outdoors", "6 s", "", "rec")],
   context="A dry speech source for the Echo and Reverberation laboratories: the learner hears what an echo or a reverb does to words, starting from speech with no room in it.",
   teaches="How echoes and reverb affect intelligibility: consonants smear first. Unlike the clap and clave, the learner hears the effect on running speech.",
   record="S1 spoken once at a natural level, outdoors.", how=WAV01_HOW,
   tips=["Same talker as the WAV-02 and WAV-04 claps if possible."],
   specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −3 dBFS", "Conditions": "Outdoors, ≥ 30 m from reflectors, no wind", "Session": "6"},
   qc=["No room or echo after the last word.", "No wind or traffic under the speech."]),
 ])

# ---------------- WAV-02: real spaces, one rec per space × capture
spaces = [("studio", "Treated studio (≈ 0.3 s)", 6), ("livingroom", "Furnished living room (≈ 0.5 s)", 6), ("classroom", "Classroom (≈ 1.0 s)", 6),
          ("gym", "Gym or church (≈ 2 s)", 6), ("stairwell", "Concrete stairwell (flutter echo)", 6), ("hall", "Hall or large church (session 5 venue)", 5)]
SP = {
 "studio": dict(name="the treated studio", char="a short, controlled decay of about 0.3 s with few distinct reflections",
                lesson="the near-dry reference: how little a good control room adds", qc="Decay under about 0.4 s; no flutter or ring."),
 "livingroom": dict(name="the furnished living room", char="a short, warm decay of about 0.5 s; carpets and sofas absorb the highs, so the tail is darker than the direct sound",
                lesson="a home room: short, but coloured by furniture", qc="Decay about 0.4–0.6 s; tail darker than the direct sound."),
 "classroom": dict(name="the classroom", char="a bright, hard decay of about 1 s from parallel walls and hard surfaces",
                lesson="the classic poor-intelligibility room, where speech starts to smear", qc="Decay about 1 s; consonants audibly smeared on S1."),
 "gym": dict(name="the gym or church", char="a long, dense decay of about 2 s",
                lesson="a large reverberant room, where each syllable's tail masks the next", qc="Decay about 2 s, smooth into the noise floor."),
 "stairwell": dict(name="the concrete stairwell", char="flutter echo: a rapid, buzzy repeating echo between parallel hard walls",
                lesson="flutter echo, a defect rather than a reverb", qc="Audible flutter (rapid repeating echo) after the impulse."),
 "hall": dict(name="the hall or large church (session-5 venue, empty, HVAC off)", char="a long, smooth, enveloping decay with a clear gap between the direct sound and the reverberant field",
                lesson="a performance space, the “hall” answer in Reverb Recognition", qc="Long, smooth decay with no flutter; HVAC noise absent."),
}
WAV02_SRC = "Source: a full-range powered loudspeaker (an omnidirectional dodecahedron is best if you have one) at 1.5 m height, at least 1 m from walls. Note its model."
WAV02_SWEEP = ["Sweep: 10 s exponential (log) sine sweep, 20 Hz–20 kHz, followed by silence longer than the room's RT60. About 85 dBA at the mic. Record 2–3 sweeps.",
               "Deconvolve with the sweep's inverse filter (time-reversed sweep with matching amplitude correction). Keep the linear impulse and discard the harmonic-distortion images that land before it.",
               "Trim from just before the direct sound to RT60 × 1.5 or to where the tail meets the noise floor, whichever is longer; 10 ms fade at the end only. IR peak ≤ −3 dBFS."]
WAV02_POS = {1: "Position 1: 4 m from the source (less only if the space is smaller — note it), 1.2 m high (seated ear height).",
             2: "Position 2: at least 2 m from position 1 and not symmetrical with it, same height; log the distance to the source."}
WAV02_TIPS = ["Do every capture in a space before moving on: sweeps at position 1 (omni + ORTF on the same stand, one pass), sweeps at position 2, then balloon, clap and S1 at position 1.",
              "Use a log sweep and deconvolve: it rejects background noise and separates distortion far better than a balloon alone.",
              "Record 30 s of room tone at every setup (archive; it tells us the noise floor). Keep the raw sweep recordings — we may ask for them.",
              "Log temperature, humidity and room dimensions; photograph the space with the source and mic positions."]
SWEEP_SAFE = ["Room sweeps ≈ 85 dBA: everyone in the room wears hearing protection."]
wav02 = []
n = 0
for k, nm, s in spaces:
    sp = SP[k]
    for p in (1, 2):
        for kind in ("omni", "ortf"):
            n += 1
            fn = f"wave_lab/wav02-{k}-ir-{kind}-pos{p}.wav"
            var = f"{nm} · IR, {'omni' if kind == 'omni' else 'ORTF stereo'}, position {p}"
            if kind == "omni":
                ctx = (f"The mono impulse response of {sp['name']} at position {p}. With a convolution step the app places any dry source (WAV-01, FX-03) in this room, and the Reverberation Laboratory draws it as direct → early → late → diffuse. "
                       + ("Position 1 is the reference measurement for this space." if p == 1 else "Position 2 lets the app show the same room from a second seat."))
                tch = (f"What {sp['name']} does to sound: {sp['char']}. " + ("Measured on an omni, it is the room's neutral fingerprint, with no stereo cues." if p == 1 else
                       "Against position 1 the late decay stays about the same while the early reflections and the direct-to-reverberant balance change: decay time belongs to the room, the early pattern to the seat."))
                mic = "Mic: omni measurement mic, pointing at the source."
                ch = "Mono"
            else:
                ctx = (f"The stereo impulse response of {sp['name']} at position {p}, for headphone and stereo playback in the Reverberation Laboratory and Ear Training M9 Reverb Recognition. "
                       + ("It is the one the learner hears as “being in the room”." if p == 1 else "It gives the same room heard from a second seat, in stereo."))
                tch = (f"The width and envelopment of {sp['name']}: {sp['char']}, arriving from all around rather than from a point. " + ("Compared with the omni, the learner hears space as well as decay." if p == 1 else
                       "Compared with position 1, early reflections shift in time and side, so the image of the room changes while its decay does not."))
                mic = "Mic: ORTF pair (17 cm spacing, 110°) on the same stand as the omni, aimed at the source."
                ch = "Stereo"
            wav02.append(R(rid=f"WAV-02.{n}", title=f"{nm}: {'omni' if kind == 'omni' else 'ORTF'} impulse response, position {p}",
                files=[(fn, var, "RT60 × 1.5", "Deconvolved sweep", "edit")], context=ctx, teaches=tch,
                record=f"Log-sweep impulse response of {sp['name']}, {'omni' if kind == 'omni' else 'ORTF pair'}, position {p}, deconvolved.",
                how=[WAV02_SRC, mic, WAV02_POS[p]] + WAV02_SWEEP + (["The hall IRs are done at the session-5 venue (empty, HVAC off) with the same rig."] if k == "hall" else []),
                tips=WAV02_TIPS[:1] + ["Capture omni and ORTF in the same sweep pass: one sweep feeds both files."] + WAV02_TIPS[1:],
                specs={"Channels": ch, "Length": "RT60 × 1.5 (≈ 0.6–4 s), or to the noise floor if longer", "Format": "48 kHz / 24-bit, deconvolved", "Levels": "IR peak ≤ −3 dBFS; sweeps ≈ 85 dBA", "Position": str(p), "Session": str(s)},
                qc=["Clean direct spike, then a smooth decay into the noise floor (no cut-off tail).", "No pre-echo artefacts before the direct sound.", sp["qc"],
                    ("One mono channel with a single sharp direct spike." if kind == "omni" else "Both channels start together (within the ORTF spacing, about 0.5 ms); stable image.")
                    + (" Decay time logged as the reference for this space." if p == 1 else " Decay time within about 10% of position 1; early reflections visibly different.")],
                safety=SWEEP_SAFE))
    n += 1
    wav02.append(R(rid=f"WAV-02.{n}", title=f"{nm}: balloon pop (ORTF, position 1)",
        files=[(f"wave_lab/wav02-{k}-balloon-pos1.wav", f"{nm} · balloon pop (ORTF)", "RT60 × 1.5", "Cross-check of the IR", "rec")],
        context=f"A real impulse in {sp['name']} that plays back with no convolution step, and the cross-check of the sweep IRs. The learner can hear the room's decay on a sound they recognise.",
        teaches=f"The decay of {sp['name']} excited by a single acoustic bang: {sp['char']}. Unlike the sweep IR it carries a little of the balloon's own colour, a lesson in why engineers prefer sweeps for measurement.",
        record=f"One balloon popped at the source position in {sp['name']}, captured by the ORTF pair at position 1.",
        how=["Same rig as the position-1 IRs: ORTF pair at position 1, 1.2 m high.", "Inflate a standard party balloon to the same size each time (about 30 cm); pop it with a pin at the loudspeaker's position, 1.5 m high.", "Pop 2–3 and keep the cleanest; trim like an IR (RT60 × 1.5, 10 ms end fade).", "Turn the preamp down first: a balloon is far louder than the sweep; peak ≤ −3 dBFS."],
        tips=["Pop the balloons straight after the position-1 sweeps without touching the stands."],
        specs={"Channels": "Stereo", "Length": "RT60 × 1.5", "Levels": "Peak ≤ −3 dBFS", "Position": "1", "Session": str(s)},
        qc=["Decay time similar to the sweep IR for this space.", "Not clipped.", sp["qc"]],
        safety=["Balloon pops are very loud close up: hearing protection for the person popping and anyone nearby."]))
    n += 1
    wav02.append(R(rid=f"WAV-02.{n}", title=f"{nm}: S1 played in the space (ORTF, position 1)",
        files=[(f"wave_lab/wav02-{k}-s1.wav", f"{nm} · S1 played in the space (ORTF)", "≈ 6 s + tail", "", "rec")],
        context=f"Speech heard in {sp['name']}, for plain playback today in the Reverberation Laboratory and Ear Training M9: the learner hears S1 as a listener in this room would.",
        teaches=f"What {sp['name']} does to speech: {sp['lesson']}. Against the dry WAV-01 S1 the learner hears exactly what the room adds.",
        record=f"The dry S1 (WAV-01) played through the loudspeaker in {sp['name']}, captured by the ORTF pair at position 1.",
        how=["Same rig as the position-1 IRs; source loudspeaker in the same place.", "Play the dry S1 (WAV-01.3) at a natural speech level, about 65–70 dBA at the mic.", "Capture until the tail meets the noise floor; trim with a 10 ms end fade."],
        tips=["Play S1 straight after the balloon; same gain structure as the IRs if the level allows."],
        specs={"Channels": "Stereo", "Length": "≈ 6 s + tail", "Levels": "Peaks ≤ −3 dBFS", "Position": "1", "Session": str(s)},
        qc=["Tail not cut off.", "No background noise events (doors, voices).", sp["qc"]]))
    n += 1
    wav02.append(R(rid=f"WAV-02.{n}", title=f"{nm}: hand clap (ORTF, position 1)",
        files=[(f"wave_lab/wav02-{k}-clap.wav", f"{nm} · hand clap (ORTF)", "RT60 × 1.5", "", "rec")],
        context=f"The everyday room test in {sp['name']}, for plain playback: the learner compares it with the dry clap (WAV-01.1) and the clap in the other spaces.",
        teaches=f"The quick clap test engineers do on walking into a room: in {sp['name']} it reveals {sp['char']}.",
        record=f"A firm hand clap at the source position in {sp['name']}, captured by the ORTF pair at position 1.",
        how=["Same rig as the position-1 IRs.", "Clap with cupped hands at the loudspeaker position, 1.5 m high, same person as WAV-01.", "Clap 2–3 times with a full decay between; keep the cleanest; trim to RT60 × 1.5."],
        tips=["Clap last, straight after S1, before moving to the next space."],
        specs={"Channels": "Stereo", "Length": "RT60 × 1.5", "Levels": "Peak ≤ −3 dBFS", "Position": "1", "Session": str(s)},
        qc=["Clap and IR give a similar decay time.", sp["qc"]]))

item(id="WAV-02", title="Real spaces: impulse responses for auralization", pri="P2", sess=[6, 5], group=G,
 used="Wave lab <em>Reverberation Laboratory</em> (direct → early → late → diffuse), Ear Training M9 <em>Reverb Recognition</em> (room / chamber / hall, today labelled “(emulation)”) and the Mixing reverb pages. With a convolution step the app can place any dry source in these real rooms; with plain playback the S1 and clap files work today.",
 safety=["Room sweeps ≈ 85 dBA: everyone in the room wears hearing protection; see Safety."],
 reuse="EAR-05 room/chamber/hall choices, Mixing reverb pages, Room Design context.", see=["WAV-04", "EAR-05", "RD-01", "TL-01", "WAV-01"],
 usedin="Wave lab › Reverberation; Ear Training › M9 Reverb Recognition (src/screens/lab/wave/, src/features/ear/modules/time.ts)",
 recs=wav02)

# ---------------- WAV-03: comb filtering, one rec per height × signal
COMB = {2: (0.10, 5100, 10200), 6: (0.29, 1700, 3400), 12: (0.57, 880, 1770), 24: (1.03, 490, 970)}
WAV03_RIG = ["Untreated room, a large hard table (wood or laminate) with nothing else on it.", "Small full-range speaker at seated mouth height (35 cm above the table), 1 m horizontally from the mic position, aimed at the mic.", "Same gain and same playback level for every take (FIXED-GAIN); peaks ≤ −6 dBFS."]
wav03 = []
n = 0
for h in (2, 6, 12, 24):
    dly, n1, sp_ = COMB[h]
    for sig in ("s1", "pink"):
        n += 1
        fn = f"wave_lab/wav03-omni-{h:02d}in-{sig}.wav"
        var = f"Omni {h} in above table · {'S1' if sig == 's1' else 'pink noise'}"
        geo = f"At {h} in the table reflection arrives about {dly:.2f} ms after the direct sound, so the first notch lands near {n1:,} Hz with further notches every ≈ {sp_:,} Hz (approximate, for this geometry)."
        if sig == "pink":
            ctx = f"One step of the Comb Filtering Laboratory's “move the microphone” demonstration: the learner switches between heights on steady pink noise and watches the notches move on the analyser. {geo}"
            tch = ("On steady noise the comb is heard as a hollow, phasey colour and seen as regular notches. " +
                   {2: "So close to the table the first notch sits high, near 5 kHz: a dulling of the top rather than an obvious hollowness.",
                    6: "At 6 in the notches fall in the upper mids, the most obviously hollow height.",
                    12: "At 12 in the notches are closer together and lower, giving a dense, phasey colour through the mids.",
                    24: "At 24 in the notches are packed tightly from about 500 Hz up, and the reflection is a little weaker, so the comb is shallower."}[h])
            rec_ = f"Pink noise from the speaker, captured by the omni {h} in above the table."
            qc = ["Steady level; no handling or stand noise.", f"First notch near {n1:,} Hz on an analyser (allow ±20%)."] + (["Sounds hollow/phasey compared with the boundary take."] if h in (6, 12) else ["Comb colour audible against the boundary take on an analyser."])
        else:
            ctx = f"The speech version of the same height in the Comb Filtering Laboratory: the learner hears what a mic {h} in above a table does to a voice, as at a podium, conference table or desk. {geo}"
            tch = ("On a voice the comb is heard as a coloured, slightly “tubey” tone that changes with mic height. " +
                   {2: "At 2 in the colour is subtle and only dulls the S sounds.", 6: "At 6 in the voice sounds hollow in the presence range.",
                    12: "At 12 in the voice takes on a phasey, boxy colour.", 24: "At 24 in the colour is milder but the voice is more distant."}[h])
            rec_ = f"The dry S1 (SPC-04 clean) from the speaker, captured by the omni {h} in above the table."
            qc = ["Same playback level and gain as every other WAV-03 take.", "No room noise events between words.", f"Voice colour matches the {h} in pink-noise take (same capsule height, logged)."]
        wav03.append(R(rid=f"WAV-03.{n}", title=f"Omni {h} in above the table: {'S1' if sig == 's1' else 'pink noise'}",
            files=[(fn, var, "6 s", "", "rec")], context=ctx, teaches=tch, record=rec_,
            how=WAV03_RIG + [f"Omni on a stand pointing at the speaker, capsule exactly {h} in above the table top (measure to the capsule).", f"Play {'the dry S1 (SPC-04 clean)' if sig == 's1' else 'pink noise'} for 6 s."],
            tips=["Using playback, not a live talker, makes every height identical except the reflection.", "Batch it: at each height play S1 then pink noise, then raise the mic; finish with the boundary mic."],
            specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −6 dBFS", "Set": "FIXED-GAIN", "Height": f"{h} in", "Session": "2"},
            qc=qc))
n += 1
wav03.append(R(rid=f"WAV-03.{n}", title="Boundary mic flat on the table: S1",
    files=[("wave_lab/wav03-boundary-s1.wav", "Boundary mic flat on table · S1", "6 s", "", "rec")],
    context="The fix in the Comb Filtering Laboratory, on speech: after hearing the omni at four heights, the learner hears a boundary mic on the table surface, as used on conference tables and lecterns.",
    teaches="A mic capsule on the surface receives the direct sound and the reflection at the same moment, so there is no comb: the voice sounds even and natural again, and a few dB louder (pressure doubling).",
    record="The dry S1 from the speaker, captured by a boundary mic lying flat on the table.",
    how=WAV03_RIG + ["Boundary (PZM-type) mic flat on the table at the same horizontal position as the omni stand.", "Play the dry S1 (SPC-04 clean) for 6 s."],
    tips=["Remove the omni stand first so it does not reflect into the boundary mic."],
    specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −6 dBFS", "Set": "FIXED-GAIN", "Session": "2"},
    qc=["Evenly toned compared with the omni takes.", "A few dB louder than the omni takes at the same gain."]))
n += 1
wav03.append(R(rid=f"WAV-03.{n}", title="Boundary mic flat on the table: pink noise",
    files=[("wave_lab/wav03-boundary-pink.wav", "Boundary mic flat on table · pink noise", "6 s", "", "rec")],
    context="The analyser view of the fix: on pink noise the learner sees the notches of the omni takes disappear when the mic sits on the surface.",
    teaches="On steady noise the boundary take is smooth on the analyser, with no regular notches. It proves the comb came from the reflection, not the room or the mic.",
    record="Pink noise from the speaker, captured by the boundary mic lying flat on the table.",
    how=WAV03_RIG + ["Boundary mic flat on the table at the same horizontal position as the omni stand.", "Play pink noise for 6 s."],
    tips=["Record straight after the boundary S1 without moving anything."],
    specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −6 dBFS", "Set": "FIXED-GAIN", "Session": "2"},
    qc=["Pink noise at 6 and 12 in sounds hollow/phasey compared with this take.", "A few dB louder (pressure doubling) and evenly toned."]))

item(id="WAV-03", title="Comb filtering from a nearby table", pri="P2", sess=[2], group=G,
 used="Wave lab <em>Comb Filtering Laboratory</em> (“one reflection plus the direct sound — move the microphone six inches”). Today it is drawn and synthesized.",
 safety=[], reuse="Phase lab, Flanger, Mic Selection (boundary).", see=["MSL-01", "FX-06"], usedin="Wave lab › Comb Filtering (src/screens/lab/wave/)",
 recs=wav03)

WAV04_RIG = ["Large flat wall (warehouse or school building) with open ground in front and no other reflectors near. Stand 15–25 m away (round trip ≈ 87–146 ms); measure and log the distance.",
             "Source and mics together, facing the wall: omni plus ORTF pair at 1.5 m height; the source (claps, the S1 playback speaker) 1 m in front of them.",
             "Early morning, no wind, no traffic."]
item(id="WAV-04", title="Outdoor wall echo — a discrete echo", pri="P2", sess=[6], group=G,
 used="Wave lab <em>Echo Laboratory</em>: discrete echoes vs fused reflections and the ~50 ms threshold. Today the echo is synthesized.",
 safety=["Sweeps ≈ 85 dBA: protection for anyone nearby."], reuse="None.", see=["WAV-01", "WAV-02"], usedin="Wave lab › Echo Laboratory (src/screens/lab/wave/)",
 recs=[
  R(rid="WAV-04.1", title="Clap with wall echo, omni",
   files=[("wave_lab/wav04-echo-clap-omni.wav", "Clap + wall echo · omni", "2 s", "", "rec")],
   context="The main example in the Echo Laboratory: the learner hears a clap, a gap, and a single echo, and checks the delay against the 2 × distance ÷ 343 m/s formula on the waveform.",
   teaches="Beyond about 50 ms a reflection stops fusing with the sound and is heard as a separate echo. In mono the echo's delay is easy to see and measure.",
   record="A hand clap facing the wall, with its real echo, on the omni.", how=WAV04_RIG + ["Clap 3–4 times, a few seconds apart; keep the cleanest; peaks ≤ −3 dBFS."],
   tips=["Split from WAV-02 because the method is different: one wall, one echo, open air.", "Do it the same morning as WAV-01, with the same person clapping, so the dry clap is a true comparison."],
   specs={"Channels": "Mono", "Length": "≈ 2 s", "Levels": "≤ −3 dBFS", "Conditions": "Wall 15–25 m (logged)", "Session": "6"},
   qc=["One clear, separate echo 87–146 ms after the clap, matching the logged distance."]),
  R(rid="WAV-04.2", title="Clap with wall echo, ORTF",
   files=[("wave_lab/wav04-echo-clap-ortf.wav", "Clap + wall echo · ORTF", "2 s", "", "rec")],
   context="The stereo version for headphone listening in the Echo Laboratory: the learner hears the echo come back from in front, as in the real place.",
   teaches="An echo as a direction as well as a delay: the clap is close and the echo arrives from the wall, a stereo cue the omni cannot give.",
   record="The same claps as WAV-04.1, on the ORTF pair.", how=WAV04_RIG + ["Captured at the same time as WAV-04.1 (same claps)."],
   tips=["Record omni and ORTF together; deliver the same clap in both files."],
   specs={"Channels": "Stereo", "Length": "≈ 2 s", "Levels": "≤ −3 dBFS", "Conditions": "Wall 15–25 m (logged)", "Session": "6"},
   qc=["Same clap as the omni file; echo at the same delay."]),
  R(rid="WAV-04.3", title="S1 with wall echo, ORTF",
   files=[("wave_lab/wav04-echo-s1.wav", "S1 + wall echo · ORTF", "6 s", "", "rec")],
   context="Speech with a real, late echo in the Echo Laboratory: the learner hears what a stadium or outdoor-concert echo does to words.",
   teaches="A discrete echo on speech repeats each syllable on top of the next, worse for intelligibility than a reverb of the same level.",
   record="The dry S1 played back from a speaker facing the wall, captured by the ORTF pair.", how=WAV04_RIG + ["Play the dry S1 (WAV-01.3) from a small full-range speaker at a natural level."],
   tips=["Same speaker as the sweep; play S1 between the claps and the sweep."],
   specs={"Channels": "Stereo", "Length": "≈ 6 s", "Levels": "Peaks ≤ −3 dBFS", "Conditions": "Wall 15–25 m (logged)", "Session": "6"},
   qc=["Every syllable has an audible echo at the logged delay."]),
  R(rid="WAV-04.4", title="Wall echo impulse response, omni (deconvolved sweep)",
   files=[("wave_lab/wav04-echo-ir-omni.wav", "Wall echo IR · omni (deconvolved)", "1 s", "", "edit")],
   context="The measured version for the Echo Laboratory's waveform display: a direct spike and one echo spike, with the app able to convolve any dry source with it.",
   teaches="The impulse response of a single echo is just two spikes: the time between them is the delay and the height difference the echo's loss. It is the clearest picture of an echo there is.",
   record="A 10 s log sweep from the speaker toward the wall, captured on the omni and deconvolved as in WAV-02.",
   how=WAV04_RIG + ["Play a 10 s log sweep (20 Hz–20 kHz) at about 85 dBA; record 2–3.", "Deconvolve as in WAV-02; trim to 1 s from just before the direct sound."],
   tips=["Do the sweep last, after the claps and S1, so the louder sweep does not disturb the neighbours for longer than needed."],
   specs={"Channels": "Mono", "Length": "≈ 1 s", "Levels": "IR peak ≤ −3 dBFS", "Conditions": "Wall 15–25 m (logged)", "Session": "6"},
   qc=["Two clean spikes: the direct sound and the echo at the logged delay.", "No pre-echo artefacts."],
   safety=["Sweeps ≈ 85 dBA: hearing protection for anyone nearby."]),
 ])

DIG_CHAIN = "Quiet room, HVAC off; low-noise preamp; true 24-bit capture (no 16-bit stage anywhere). Aim for a noise floor ≤ −80 dBFS."
item(id="DIG-01", title="Long quiet decays for bit depth and dither", pri="P2", sess=[3], group=G,
 used="Digital Audio lab (bit depth, quantization, dither): the app will requantize a real decay to show quantization error growing as the level falls, and how dither helps. Today it uses generated tones.",
 safety=[], reuse="None.", see=["ENV-01"], usedin="Digital Audio lab (src/screens/lab/digital/)",
 recs=[
  R(rid="DIG-01.1", title="Piano C4 decaying to silence",
   files=[("digital_audio/dig01-piano-c4-decay.wav", "Piano C4 to silence", "15 s", "", "rec")],
   context="The main source of the bit-depth demonstration: the app requantizes this decay to 16, 12, 8 bits and fewer, and the learner hears the tail turn gritty as it falls, then hears dither turn the grit into smooth hiss.",
   teaches="Low bit depths fail at the quiet end: a long, smooth decay crosses every level from loud to silence, so the learner hears exactly where quantization distortion takes over.",
   record="One piano C4, sustain pedal down, left to decay 10–15 s to silence.",
   how=[DIG_CHAIN, "Mic 30 cm above the hammers; peaks ≈ −6 dBFS.", "Play C4 once at mf, sustain pedal down; nobody moves until the note has gone into the noise floor. Record 3 and keep the cleanest."],
   tips=["If session 7's freshly tuned piano is the studio piano, do the take there."],
   specs={"Channels": "Mono", "Length": "15 s", "Levels": "Peaks ≈ −6 dBFS; noise floor as low as possible (aim ≤ −80 dBFS)", "Set": "Raw"},
   qc=["The tail fades into a smooth, quiet noise floor (no hum tones).", "No chair creaks, pedal thumps or breathing in the tail."]),
  R(rid="DIG-01.2", title="Soft fingerpicked guitar phrase",
   files=[("digital_audio/dig01-guitar-fingerpicked-soft.wav", "Soft fingerpicked guitar", "10–15 s", "", "rec")],
   context="A second, musical source for the same requantize and dither comparison: quiet, detailed playing rather than a single decay.",
   teaches="Quantization error on quiet, detailed music: at low bit depth the soft notes and finger noise turn rough, and dither keeps the detail audible under hiss. Unlike the piano decay, it shows the effect on a whole phrase.",
   record="A soft fingerpicked guitar phrase, 10–15 s, ending in a natural decay.",
   how=[DIG_CHAIN, "SDC at 20 cm aimed at the 12th–14th fret; peaks ≈ −6 dBFS.", "Ask for a gentle, pp–mp phrase ending on a ringing chord."],
   tips=["Record it straight after EQ-01d with the same guitar and mic, after moving to the quietest available room."],
   specs={"Channels": "Mono", "Length": "10–15 s", "Levels": "Peaks ≈ −6 dBFS; noise floor aim ≤ −80 dBFS", "Set": "Raw"},
   qc=["Quiet floor between notes, no hum.", "Last chord rings into the noise floor without being cut."]),
 ])

FND = {
 "piano": ("a hammered, decaying tone whose upper partials run slightly sharp (inharmonicity)", "the only struck-and-decaying keyboard in the set: the harmonics fade at different rates", "Mic 30–50 cm above the hammers; strike once at mf and hold the key."),
 "trumpet": ("a bright, brassy tone with strong harmonics well up the spectrum", "the brightest sustained tone in the set; loudness and brightness rise together", "Ask for concert A3 (written B3 on a B♭ trumpet). Mic 40–50 cm, slightly off the bell axis to avoid blast."),
 "flute": ("a breathy, nearly pure tone with few harmonics", "the closest to a sine in the set, plus breath noise", "A concert C flute's lowest note is C4 (B3 with a B foot), so it cannot play A3. Use an alto flute in G (lowest G3) and note it — or tell production if no alto flute is available. Mic 30–40 cm, aimed between the embouchure and the first keys."),
 "clarinet": ("a hollow, woody tone in which the odd harmonics dominate in the low register", "the missing even harmonics: a different harmonic recipe at the same pitch", "Ask for concert A3 (written B3 on a B♭ clarinet), in the low chalumeau register. Mic 30–40 cm, aimed at the lower keys, not the bell."),
 "violin": ("a bowed tone with a dense, sawtooth-like harmonic series and some bow noise", "a sustained, harmonically rich string tone, with bow noise as part of the timbre", "A3 = first finger on the G string, first position. Mic 40–50 cm above, aimed at the bridge-to-f-hole area. Steady bow, no vibrato."),
 "acgtr": ("a plucked, decaying tone shaped by the body resonance", "a plucked attack and decay, against the piano's struck one", "A3 = 2nd fret on the G string. SDC 20–30 cm at the neck joint. Pluck once at mf and let it ring."),
 "organ": ("a perfectly steady tone with no attack or decay changes; the stops set the harmonic recipe", "the steadiest tone: timbre with no envelope at all", "Organ, a single 8′ flue stop (or drawbars 8 only, e.g. 00 8000 000), no tremulant, no rotary. DI, or a mic on the speaker; note which."),
 "voice-ah": ("a sung vowel whose formants (vocal-tract resonances) shape the harmonics", "formants: the same harmonics, shaped by the mouth into a vowel", "Session 1, house speech setup. A singer whose range comfortably holds A3 (most male voices). Sing “ah” steadily, no vibrato."),
}
FNDQC = {"piano": "Key held through the decay; no pedal or bench noise.", "trumpet": "No valve clicks or blast thump at the attack.",
         "flute": "Alto flute (or the substitute) named in the sidecar; breath noise natural, not dominant.", "clarinet": "Concert A3 confirmed (written B3); no reed squeak.",
         "violin": "Even bow, no scratch at the start or bow change.", "acgtr": "Single plucked note; other strings muted.",
         "organ": "Perfectly steady level; no tremulant or rotary.", "voice-ah": "A clean “ah” vowel throughout; no pitch scoop at the start."}
inst = [("piano", "Piano"), ("trumpet", "Trumpet (concert A3)"), ("flute", "Flute — see note: concert flute cannot reach A3"), ("clarinet", "Clarinet (concert A3)"),
        ("violin", "Violin"), ("acgtr", "Acoustic guitar"), ("organ", "Organ"), ("voice-ah", "Voice singing “ah”")]
fnd = []
for i, (k, nm) in enumerate(inst, 1):
    tone, uniq, mic = FND[k]
    fnd.append(R(rid=f"FND-01.{i}", title=f"A3 (220 Hz): {nm}",
        files=[(f"foundations/fnd01-a3-{k}.wav", nm + " · A3 (220 Hz)", "3 s", "Session 1" if k == "voice-ah" else "", "rec")],
        context=f"One of eight matched A3 notes in the Foundations timbre lesson and the Harmonics, Oscillator, Envelope and Meter labs. The learner plays them in turn, at the same pitch and loudness, and compares spectra: here {tone}.",
        teaches=f"Pitch is the same; timbre is what tells instruments apart. This note shows {uniq}.",
        record=f"A3 (220 Hz) held about 3 s at mf: {nm}.",
        how=["Close-miked (30–50 cm), DRY-ish room, mf, steady, no vibrato where the instrument allows; same mic for all eight.", mic,
             "Tune to A = 440 Hz within ±3 cents; check every take with a tuner and log the measured cents.", "Keep the natural release; MATCHED to ±0.5 LU with the other seven (gain only)."],
        tips=["Record all instruments in one block with the same mic and distance; book players back-to-back." if k != "voice-ah" else "Recorded in session 1 with the singers; use the same mic model and distance as the session-3 instruments."],
        specs={"Channels": "Mono", "Length": "≈ 3 s + natural release", "Set": "MATCHED (±0.5 LU)", "Tuning": "A = 440 Hz, ±3 cents", "Session": "1" if k == "voice-ah" else "3"},
        qc=["Measures A3 within ±3 cents (logged).", "Same loudness as the other seven.", "No vibrato or pitch drift.", FNDQC[k]]))
item(id="FND-01", title="Same note, different instruments (timbre)", pri="P2", sess=[3, 1], group=G,
 used="Foundations course (timbre) and the Harmonics, Oscillator, Envelope and Meter labs: the same pitch played by different instruments.",
 safety=[], reuse="Harmonics, Oscillator, Envelope, Meter labs.", see=["SPC-01", "ENV-01"],
 usedin="Foundations course, Harmonic and Oscillator labs (src/screens/lab/foundations/)", recs=fnd)

item(id="STH-01", title="Start Here: a person humming", pri="P3", sess=[1], group=G,
 used="Start Here beginner lab: the learner meets sound, meters and spectra for the first time with friendly signals. Today the speech and guitar come from the meter engine's synthesis.",
 safety=[], reuse="None.", see=["SPC-04"], usedin="Start Here lab",
 recs=[
  R(rid="STH-01.1", title="Steady hum at about 180 Hz, loop",
   files=[("start_here/sth01-hum-loop.wav", "Hum ≈ 180 Hz, loop", "6 s", "", "rec")],
   context="One of the first real sounds a beginner meets in the Start Here lab: it plays on a loop while they look at the meter and the spectrum for the first time.",
   teaches="A hum is one steady pitch with a ladder of harmonics: a simple, stable picture on the spectrum, unlike the constantly changing shape of speech (STH-01.2).",
   record="A person humming with lips closed at a steady pitch (≈ F♯3, 185 Hz) and level for 8 s.",
   how=["House speech setup. Hum with lips closed, steady pitch (≈ F♯3, 185 Hz) and level for 8 s.", "Cut a 6 s loop; a ≤ 50 ms loop crossfade is allowed.", "Peaks ≈ −6 dBFS."],
   tips=["Use the session-1 male talker between other takes.", "Give a reference tone in headphones, then mute it before the take."],
   specs={"Channels": "Mono", "Length": "6 s loop", "Levels": "Peaks ≈ −6 dBFS", "Session": "1"},
   qc=["Pitch steady within ±10 cents; loop seamless."]),
  R(rid="STH-01.2", title="S1 spoken by the same person",
   files=[("start_here/sth01-s1.wav", "S1", "6 s", "", "rec")],
   context="The speech example in Start Here, next to the hum from the same voice: the learner sees how much busier speech is on the meter and spectrum.",
   teaches="Speech changes pitch, level and spectrum every few tens of milliseconds. Heard right after the hum from the same person, it shows the difference between a steady tone and running speech.",
   record="S1 spoken by the same person as the hum.",
   how=["House speech setup, same distance as the hum.", "S1 at a natural, friendly level; peaks ≈ −6 dBFS."],
   tips=["Record straight after the hum without changing anything."],
   specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≈ −6 dBFS", "Session": "1"},
   qc=["Clear, natural delivery; no plosive pops."]),
 ])

# ================================================================ NOISE LAB
G = "Noise Lab"
NOI_LOOP = "Cut a 15–20 s seamless loop (≤ 50 ms loop crossfade allowed). Match at −20 dBFS RMS."
item(id="NOI-01a", title="Real-world environmental noise: babble, HVAC, traffic, wind", pri="P2", sess=[6], group=G,
 used="Noise Lab: next to the generated noise colours (white, pink, brown…), the lab lists textured real-world sources — speech babble, HVAC, traffic, wind — which the code marks as needing recorded assets. Today they are not offered.",
 safety=[], reuse="PROD-02 HVAC context.", see=["NOI-01b", "MPR-04b"], usedin="Noise Lab (src/screens/lab/NoiseLabScreen.tsx)",
 recs=[
  R(rid="NOI-01a.1", title="Staged café babble, unintelligible",
   files=[("noise_lab/noi01-cafe-babble.wav", "Babble, unintelligible", "15–20 s", "Signed releases for all voices", "rec")],
   context="The “speech babble” source in the Noise Lab, next to the generated colours. The learner hears and sees the noise that masks speech in restaurants and crowds.",
   teaches="Babble is the hardest noise for speech because it has the same spectrum and rhythm as speech; its energy sits in the 250 Hz–4 kHz speech band, unlike pink noise.",
   record="A staged café-style babble: 10–15 volunteers talking at once, with no intelligible words and no music.",
   how=["STAGE it: 10–15 volunteers with signed releases talking at once in a medium room (counting, nonsense words, overlapping). No music.",
        "Do NOT record a real café: private speech and background music create privacy and copyright problems.", "Omni 2 m from the group.", NOI_LOOP],
   tips=["Record 2–3 minutes so you can choose a steady 20 s.", "Ask the group to keep talking through laughter; listen back for any single clear word and avoid it."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "6"},
   qc=["No intelligible word anywhere.", "Loop seamless; no single voice dominates."]),
  R(rid="NOI-01a.2", title="HVAC air-handler noise",
   files=[("noise_lab/noi01-hvac.wav", "HVAC", "15–20 s", "", "rec")],
   context="The “HVAC” source in the Noise Lab: the background noise of almost every building, and the noise an engineer asks to have turned off before a take.",
   teaches="HVAC is steady but not flat: a low rumble and fan tones under a broadband air hiss. The learner sees tonal peaks on top of a noise floor, which the noise colours do not have.",
   record="A commercial air-handler or rooftop unit, recorded indoors near a supply grille.",
   how=["Omni 2–3 m from a supply grille indoors, out of the direct air stream (wind cover on).", "Steady running state, not starting or stopping.", NOI_LOOP],
   tips=["Record 2–3 minutes and choose a steady section.", "Note the unit type in the sidecar."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "6"},
   qc=["Steady, no on/off cycling or voices.", "No wind buffeting on the mic."]),
  R(rid="NOI-01a.3", title="Road traffic",
   files=[("noise_lab/noi01-traffic.wav", "Road traffic", "15–20 s", "", "rec")],
   context="The “traffic” source in the Noise Lab: the outdoor noise that ruins location sound and drives isolation design.",
   teaches="Traffic is a slowly swelling low-frequency rumble with tyre hiss on top: most of its energy is below 250 Hz, which is why it passes through walls and windows.",
   record="A busy road from 10–20 m, with no horns or sirens.",
   how=["Omni 1.5 m high, 10–20 m from a busy road; wind cover on.", "Choose a period of continuous flow; no horns or sirens in the delivered loop.", NOI_LOOP],
   tips=["Record 2–3 minutes; the loop must not have one obvious passing vehicle at the cut."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "6"},
   qc=["No horns, sirens or voices.", "Loop seamless: no obvious single pass-by at the loop point."]),
  R(rid="NOI-01a.4", title="Wind (edit of MPR-04b bare shotgun)",
   files=[("noise_lab/noi01-wind.wav", "Wind (edit of MPR-04b bare)", "15–20 s", "Edit", "edit")],
   context="The “wind” source in the Noise Lab, edited from the MPR-04b take, where wind hits a bare shotgun mic.",
   teaches="Wind on a microphone is turbulence at the capsule, not an acoustic sound: irregular low thumps below about 200 Hz. That is why the fix is a windshield, not EQ.",
   record="No new recording: cut from the 20 s wind-only part of the MPR-04b bare-shotgun take.",
   how=["Cut from the wind-only part of MPR-04b (bare shotgun).", NOI_LOOP],
   tips=["Edit it on the mix day together with the other three loops so all four match in one pass."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Source": "MPR-04b bare"},
   qc=["Loop seamless; no speech from the MPR-04b take."]),
 ])

NOI_LINE = "Capture at line level into the interface: start at minimum gain and bring it up. Monitor on headphones at low level with a limiter on the monitor bus."
NOI_CUT = "Cut a 15–20 s loop at −20 dBFS RMS; peaks ≤ −3 dBFS."
item(id="NOI-01b", title="Real-world electrical noise: hum, buzz, ground loop, RF, crackle, AM static", pri="P2", sess=[4], group=G,
 used="Noise Lab real-world sources (electrical family). Today not offered.",
 safety=["SAFE-1"], reuse="MTR-02 hum.", see=["EAR-04", "CAB-01", "SS-02E"], usedin="Noise Lab (src/screens/lab/NoiseLabScreen.tsx)",
 recs=[
  R(rid="NOI-01b.1", title="60 Hz hum from real gear",
   files=[("noise_lab/noi01-hum-60hz.wav", "60 Hz hum, real gear", "15–20 s", "", "rec")],
   context="The “hum” source in the Noise Lab's electrical family, and the hum shape on the Meter lab's spectrum pages (MTR-02).",
   teaches="Mains hum is a smooth, low 60 Hz tone with a few soft harmonics: magnetic pickup from a transformer. The learner sees a single strong line at 60 Hz.",
   record="Hum induced into an unshielded input or a guitar pickup by a nearby power transformer.",
   how=["Hold a guitar pickup (or an unshielded input lead) near a working power transformer (an amp's or a wall-wart's) and move it until the hum is steady. Never open equipment.", NOI_LINE, NOI_CUT],
   tips=["Line-capture electrical faults instead of acoustic ones: cleaner, safer, repeatable.", "Do the hum, buzz and ground loop back-to-back on the same bench."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["Smooth hum, fundamental at 60 Hz; few harmonics.", "No guitar string noise."], safety=["SAFE-1: line capture; never open mains equipment."]),
  R(rid="NOI-01b.2", title="Single-coil guitar near a dimmer (SCR buzz)",
   files=[("noise_lab/noi01-buzz-singlecoil-dimmer.wav", "Single-coil near a dimmer", "15–20 s", "", "rec")],
   context="The “buzz” source in the Noise Lab: the stage and studio noise a guitarist gets near a dimmed light.",
   teaches="Buzz runs at mains rate like hum but is harmonic-rich and edgy, with energy up past 3 kHz from the dimmer's sharp switching. The learner compares it with the smooth hum.",
   record="A single-coil guitar DI'd while placed near a dimmer-controlled light.",
   how=["A plug-in or wall dimmer driving an incandescent lamp, set to about half. Never open the dimmer.", "Single-coil guitar (bridge or neck pickup) DI'd, held 0.5–1 m from the dimmer and lamp; strings muted.", NOI_LINE, NOI_CUT],
   tips=["Turn the guitar to find the loudest buzz; note the dimmer setting."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["Edgy buzz with high harmonics; clearly different from NOI-01b.1."], safety=["SAFE-1."]),
  R(rid="NOI-01b.3", title="Ground loop",
   files=[("noise_lab/noi01-ground-loop.wav", "Ground loop", "15–20 s", "No mains earth lifted", "rec")],
   context="The “ground loop” source in the Noise Lab, and the real version of what Ear Training labels “(emulation)” today.",
   teaches="A ground loop's hum is mains frequency plus a strong set of harmonics (120/180 Hz audible), coarser than plain hum. It comes from current flowing in the cable shield between two earthed devices.",
   record="Hum from two mains-grounded devices joined by an unbalanced cable, each with its own earth.",
   how=["Two mains-earthed devices on different outlets (different earth paths), joined by an unbalanced cable.", "NEVER lift a mains earth to create or cure the loop.", NOI_LINE, NOI_CUT],
   tips=["Plugging the two devices into outlets on different circuits usually makes the loop audible."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["Audible 120/180 Hz harmonics, coarser than the plain hum."], safety=["SAFE-1: never lift a mains earth."]),
  R(rid="NOI-01b.4", title="RF “dit-dit” from a 2G phone",
   files=[("noise_lab/noi01-rf-gsm.wav", "RF “dit-dit”", "15–20 s", "Needs a 2G phone", "rec")],
   context="The “RF” source in the Noise Lab and the real version of the Ear Training “(emulation)” label: the pulsed buzz a GSM phone puts into nearby audio gear.",
   teaches="RF interference is pulsed: a GSM phone's bursts rectified in an audio input give the rhythmic “dit-dit-dit” buzz, unlike the steady mains noises.",
   record="A 2G/GSM phone next to an unbalanced input or guitar amp input, during a call or registration.",
   how=["2G is largely shut down in the US: an older 2G phone on a network that still offers 2G may be needed. If not possible, say so — do not fake it.", "Phone 10–30 cm from an unbalanced input or guitar amp input; place a call to trigger the bursts.", NOI_LINE, NOI_CUT],
   tips=["The bursts are strongest while the phone registers or rings; record a few minutes and choose the clearest 20 s."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["Clear pulsed pattern; real, not synthesized."], safety=["SAFE-1."]),
  R(rid="NOI-01b.5", title="Crackle from a dirty pot or bad connection",
   files=[("noise_lab/noi01-crackle.wav", "Crackle", "15–20 s", "", "rec")],
   context="The “crackle” source in the Noise Lab: the sound of a worn control or a failing cable.",
   teaches="Crackle is a random rain of small impulses with no pitch at all, unlike hum and buzz. It points at a mechanical fault, not interference.",
   record="A dirty potentiometer or bad connection in a line signal path.",
   how=["Turn a dirty pot slowly, or wiggle a worn cable, in a line signal path.", NOI_LINE, NOI_CUT],
   tips=["Old mixers and guitar amps have the best dirty pots; do not clean them first."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["Random, irregular crackle; no hum under it."], safety=["SAFE-1."]),
  R(rid="NOI-01b.6", title="AM radio static between stations",
   files=[("noise_lab/noi01-am-static.wav", "AM static", "15–20 s", "", "rec")],
   context="The “AM static” source in the Noise Lab: atmospheric and electrical noise as picked up by a receiver.",
   teaches="Static is broadband noise with crackles and faint whistles: the receiver hears every electrical event in range. It sits between steady hiss and impulsive crackle.",
   record="An AM radio tuned between stations, from its line or headphone out.",
   how=["Tune an AM radio between stations; take its line or headphone output (volume low) into the interface.", NOI_LINE, NOI_CUT],
   tips=["Move off any frequency where faint speech or music appears."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED", "Capture": "Line", "Session": "4"},
   qc=["No intelligible station audio."], safety=["SAFE-1."]),
  R(rid="NOI-01b.7", title="50 Hz hum (OPTIONAL, abroad only)",
   files=[("noise_lab/noi01-hum-50hz.wav", "50 Hz hum (OPTIONAL — abroad only)", "15–20 s", "Never fake it", "opt")],
   context="An optional companion to the 60 Hz hum, so learners outside the Americas hear their own mains frequency.",
   teaches="Mains hum is 50 Hz in most of the world and 60 Hz in North America; the tone and its harmonics move accordingly.",
   record="OPTIONAL. The same method as NOI-01b.1 on 50 Hz mains.",
   how=["50 Hz hum cannot be produced on US mains; capture it abroad if possible, or leave it to a labelled synthesized version.", "Same method as NOI-01b.1.", NOI_CUT],
   tips=["Only if someone is recording abroad anyway; never fake it."],
   specs={"Channels": "Mono", "Length": "15–20 s loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Capture": "Line"},
   qc=["Fundamental at 50 Hz."], safety=["SAFE-1."]),
 ])

# ================================================================ EAR TRAINING
G = "Ear Training"
EAR01 = {
 "mix": ("Full mix (mono sum of MIX-01)", "the full house song", "every EQ move interacts with masking between instruments: the hardest and most realistic test", "Cut from the mono sum of the MIX-01 master stems (no processing)."),
 "vocal": ("Vocal (MIX-01 lead / FX-03)", "a sung lead vocal", "EQ on a voice: low-mid boom, nasal 1 kHz, presence and air are heard as changes in the singer, not in a noise", "Cut from the MIX-01 lead vocal or FX-03; prefer a sustained vowel with some consonants."),
 "drums": ("Drums (FX-01 / EAR-02)", "a drum kit", "EQ on transients: boosts change the kick's thump, the snare's crack and the cymbals' sizzle", "Cut from the FX-01 stereo loop (folded to mono) or an EAR-02 groove."),
 "acgtr": ("Acoustic guitar (EQ-01d)", "an acoustic guitar strum", "the body (200 Hz), honk (800 Hz) and string sparkle (5 kHz+) of a single instrument", "Cut from EQ-01d."),
 "bass": ("Bass DI (FX-04)", "a bass DI", "EQ in the low end, where 60, 120 and 250 Hz are hard to tell apart", "Cut from FX-04.3; pick passages with strong note attacks so there is some energy up high."),
 "piano": ("Piano (EQ-02)", "a piano", "a boost heard as a change in one register of a wide-range instrument", "Cut from EQ-02.1."),
}
EAR01QC = {"mix": "Mono sum has no hollow phasey colour; all instruments present.", "vocal": "Sung (not a breath or a gap) for most of the 2 s.",
           "drums": "At least one kick and one snare hit in each excerpt.", "acgtr": "Steady strumming, no chord change at the loop point.",
           "bass": "Clear note attacks; some energy above 2 kHz.", "piano": "Notes from at least two registers in each excerpt."}
src6 = [("mix", "Full mix (mono sum of MIX-01)"), ("vocal", "Vocal (MIX-01 lead / FX-03)"), ("drums", "Drums (FX-01 / EAR-02)"), ("acgtr", "Acoustic guitar (EQ-01d)"), ("bass", "Bass DI (FX-04)"), ("piano", "Piano (EQ-02)")]
ear01 = []
for i, (k, nm) in enumerate(src6, 1):
    _, what, lesson, cut = EAR01[k]
    ear01.append(R(rid=f"EAR-01.{i}", title=f"{nm}: excerpts A and B",
        files=[(f"ear_training/ear01-{k}-{x}.wav", f"{nm} · excerpt {x.upper()}", "2.000 s", "Edit", "edit") for x in ("a", "b")],
        context=f"Programme for Ear Training M2 EQ Recognition and M3 Band Identification: the learner hears A (dry) and B (one EQ move) on {what} and names the frequency, direction, amount or band. Excerpts A and B are two interchangeable passages, so a round does not always repeat the same two seconds.",
        teaches=f"Hearing EQ changes on real music, not noise. On {what}: {lesson}.",
        record=f"No new recording: two 2.000 s loop-safe excerpts of {what}, cut on the mix day.",
        how=[cut, "Choose passages with energy across 125 Hz–8 kHz (check on an analyser).",
             "2.000 s will not land on a bar line at 80/96/100 BPM: put the loop point in a sustained moment and use a ≤ 20 ms loop crossfade.",
             "Mono. Match to −20 dBFS RMS, peaks ≤ −3 dBFS."],
        tips=["Make all 12 excerpts in one sitting with one analyser setting.", "Pick A and B from different bars so they are not near-duplicates."],
        specs={"Channels": "Mono", "Length": "2.000 s exactly (96,000 samples)", "Levels": "−20 dBFS RMS; peaks ≤ −3 dBFS", "Set": "MATCHED"},
        qc=["Both excerpts show energy from 125 Hz to 8 kHz.", "Each loops without a click.", EAR01QC[k]]))
item(id="EAR-01", title="Programme excerpts for EQ and Band ID", pri="P2", sess=[3], group=G,
 used="Ear Training M2 <em>EQ Recognition</em> and M3 <em>Band Identification</em>: the learner hears A (dry) and B (one EQ move) and names the frequency, direction, amount or band. Today the source is pink noise or a synthetic harmonic tone (the spec marks real music as “V2”).",
 safety=[], reuse="—", see=["MIX-01", "FX-01", "EQ-01d", "FX-04", "EQ-02"], usedin="Ear Training › M2 EQ, M3 Band ID (src/features/ear/modules/tone.ts)", recs=ear01)

EAR02_HOW = ["Same kit and mics as FX-01, re-clicked to 100 BPM. Toms and snare as for FX-01; no gates, no compression.",
             "Mono delivery: a fader-only mono balance of the close mics and overheads (no EQ, no compression).",
             "Three-pass method; cut exactly 4 bars = 9.600 s (460,800 samples); peak −3 dBFS."]
EAR02_TIPS = ["Record the grooves at 96 AND 100 BPM in one sitting: the 96 is FX-01, the 100 is this item. Separate items, different lessons.", "Play the three grooves back-to-back without touching the mics."]
item(id="EAR-02", title="Real drum loop — 100 BPM, three grooves", pri="P2", sess=[3], group=G,
 used="Ear Training M10 <em>Compression</em>, M14 <em>Clipping</em>, M12 <em>Polarity</em> and M13 <em>Comb Filtering</em>: the app processes a drum loop (none/light/moderate/heavy compression, mild/moderate/severe clipping, summed copies). Today it is a rendered kick-and-snare pattern (spec: “V2: real drum loop”).",
 safety=[], reuse="SC-01.", see=["FX-01"], usedin="Ear Training › M10, M12, M13, M14 (src/features/ear/modules/common.ts)",
 recs=[
  R(rid="EAR-02.1", title="Straight groove, 100 BPM",
   files=[("ear_training/ear02-straight.wav", "Straight groove", "9.600 s", "", "rec")],
   context="The default loop for Ear Training M10 Compression, M14 Clipping, M12 Polarity and M13 Comb Filtering: the app applies none/light/moderate/heavy compression, mild/moderate/severe clipping, or sums a delayed or inverted copy, and the learner names what changed.",
   teaches="Recognising each process on a plain, even rock beat, where every hit is clear and evenly spaced: the baseline groove for hearing compression and clipping on transients.",
   record="Acoustic kit, 4 bars at 100 BPM: kick on 1, 3 and the and-of-3; snare on 2 and 4; hi-hat 8ths.",
   how=EAR02_HOW, tips=EAR02_TIPS,
   specs={"Channels": "Mono", "Length": "9.600 s exactly", "Type": "Seamless loop", "Levels": "Peak −3 dBFS; crest factor ≥ 15 dB", "Set": "Uncompressed", "Session": "3"},
   qc=["Crest factor ≥ 15 dB.", "Loops seamlessly."]),
  R(rid="EAR-02.2", title="Half-time groove, 100 BPM",
   files=[("ear_training/ear02-halftime.wav", "Half-time groove", "9.600 s", "", "rec")],
   context="An alternative loop for the same modules, with more space between hits.",
   teaches="With the snare only on beat 3, the gaps are longer, so compression release and pumping, and the room's decay after each hit, are easier to hear than on the straight groove.",
   record="Acoustic kit, 4 bars at 100 BPM: kick on 1, snare on beat 3 only, hi-hat 8ths.",
   how=EAR02_HOW, tips=EAR02_TIPS,
   specs={"Channels": "Mono", "Length": "9.600 s exactly", "Type": "Seamless loop", "Levels": "Peak −3 dBFS; crest factor ≥ 15 dB", "Set": "Uncompressed", "Session": "3"},
   qc=["Crest factor ≥ 15 dB.", "Loops seamlessly; snare ring carries across the loop point naturally."]),
  R(rid="EAR-02.3", title="Busy groove, 100 BPM",
   files=[("ear_training/ear02-busy.wav", "Busy groove", "9.600 s", "", "rec")],
   context="The hardest loop for the same modules: many hits close together.",
   teaches="With 16th hats, ghost notes and extra kicks, heavy compression lifts the ghost notes and clipping smears dense hits together: the tests become subtler, closer to a real mix.",
   record="Acoustic kit, 4 bars at 100 BPM: 16th-note hi-hat, snare ghost notes and extra kicks.",
   how=EAR02_HOW, tips=EAR02_TIPS,
   specs={"Channels": "Mono", "Length": "9.600 s exactly", "Type": "Seamless loop", "Levels": "Peak −3 dBFS; crest factor ≥ 15 dB", "Set": "Uncompressed", "Session": "3"},
   qc=["Crest factor ≥ 15 dB.", "Ghost notes audible but soft.", "Loops seamlessly."]),
 ])

EAR03_HOW = ["The band plays one-bar loops at 100 BPM to click.", "Mono balance with faders only; no processing.", "Three-pass method; cut one bar exactly (2.400 s, 115,200 samples). Match at −20 dBFS RMS."]
item(id="EAR-03", title="Defect bed — 2.4 s band loop, no vocal", pri="P2", sess=[3], group=G,
 used="Ear Training M5 <em>Audio Defect Recognition</em>: at higher levels, a defect plays under a “programme bed” (today a rendered chord pad and soft drum pulse).",
 safety=[], reuse="EAR-04 dropout programme.", see=["EAR-04"], usedin="Ear Training › M5 Defects (src/features/ear/modules/defects.ts)",
 recs=[
  R(rid="EAR-03.1", title="Bed 1: full band",
   files=[("ear_training/ear03-bed-1.wav", "Full band", "2.400 s", "", "rec")],
   context="The densest programme bed for Ear Training M5 at higher levels: the defect plays 20–35 dB under it, and the learner names it.",
   teaches="Finding a defect hidden in a full arrangement, where every frequency range is busy: the hardest masking case.",
   record="A one-bar full-band loop (drums, bass, guitar, keys) at 100 BPM, no vocal.", how=EAR03_HOW,
   tips=["Record right after EAR-02 while the click is at 100 BPM."],
   specs={"Channels": "Mono", "Length": "2.400 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "3"},
   qc=["Loops seamlessly; steady level; no vocal.", "All four instruments audible; energy across the whole spectrum."]),
  R(rid="EAR-03.2", title="Bed 2: keys, bass, soft drums",
   files=[("ear_training/ear03-bed-2.wav", "Keys, bass, soft drums", "2.400 s", "", "rec")],
   context="A softer bed for M5: sustained keys over bass and quiet drums. It is also the programme fed through the wireless link for the EAR-04 dropout capture.",
   teaches="A defect under sustained chords: hum and hiss are masked by the keys, while clicks and dropouts stand out against the smooth bed.",
   record="A one-bar loop of keys, bass and soft drums at 100 BPM.", how=EAR03_HOW,
   tips=["Same session as Bed 1; the drummer switches to brushes or plays softly."],
   specs={"Channels": "Mono", "Length": "2.400 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "3"},
   qc=["Loops seamlessly; steady level; no vocal.", "Keys sustain through the bar; drums clearly soft."]),
  R(rid="EAR-03.3", title="Bed 3: guitar, bass, shaker",
   files=[("ear_training/ear03-bed-3.wav", "Guitar, bass, shaker", "2.400 s", "", "rec")],
   context="A light, high-frequency-rich bed for M5: shaker and guitar fill the top end.",
   teaches="A defect under a bright, sparse bed: hiss and crackle hide in the shaker, while low hum is exposed. The opposite masking to Bed 2.",
   record="A one-bar loop of guitar, bass and shaker at 100 BPM.", how=EAR03_HOW,
   tips=["Same session as Beds 1–2."],
   specs={"Channels": "Mono", "Length": "2.400 s", "Type": "Seamless loop", "Levels": "−20 dBFS RMS", "Set": "MATCHED", "Session": "3"},
   qc=["Loops seamlessly; steady level; no vocal.", "Shaker steady across the bar; no kick or snare."]),
 ])

EAR04_GEN = ["Defects are delivered SOLO (no programme), except clock-slip clicks and dropout, which need programme to be heard.", "Cut 4 s loops; peaks ≤ −3 dBFS; level-matched or quieter than programme."]
EAR04_TIP = ["Line-capture electrical faults instead of acoustic ones.", "Record more than you need; choose the two most typical examples."]
D = {
 "ground-loop-60hz": ("Ground loop", "Ground-loop hum: mains frequency plus strong harmonics, coarser than plain hum (the deck's “Ground loop (emulation)” answer, confusable with Hum).",
                      "A real ground loop has a harmonic signature a simple 60 Hz tone lacks; after this the learner can tell it from plain hum.",
                      ["Two grounded devices on an unbalanced link with different earth paths (outlets on different circuits).", "NEVER lift a mains earth."], ["120/180 Hz harmonics audible; not a pure 60 Hz tone."]),
 "dimmer-buzz": ("Buzz", "Dimmer (SCR) buzz: the deck's “Buzz” answer, edgy where hum is smooth.",
                 "Buzz has energy right up past 3 kHz; the learner hears why it is not hum.",
                 ["A dimmer-loaded circuit (lamp at about half) near an unbalanced line or single-coil pickup. Never open the dimmer."], ["Edgy, harmonic-rich buzz."]),
 "rf-gsm": ("RF interference", "RF “dit-dit” from a 2G phone: the real version of the deck's “RF interference (emulation)” answer.",
            "RF pickup is pulsed and rhythmic, unlike steady hum or buzz.",
            ["A 2G phone near an unbalanced input. If no 2G network is available, say so; do not fake it."], ["Clear pulsed pattern."]),
 "crackle": ("Crackle", "Crackle: the deck's “Crackle” answer, confusable with Click.",
             "Crackle is a random rain of small impulses; a click is one.",
             ["A dirty pot turned slowly on a quiet line path (programme off). If the crackle only appears with signal, use a low steady tone and say so in the sidecar."], ["Many small random impulses, not one click."]),
 "clock-slip": ("Click / Digital glitch", "Clock-slip clicks: the “Click” and “Digital glitch” family, from two digital devices that are not clocked together.",
                "Regular clicks at a steady interval point at a clocking fault, not an edit.",
                ["Two digital devices passing S/PDIF or AES with the receiver set to its own INTERNAL clock instead of syncing to the input, so samples slip at regular intervals.", "Programme: a steady tone or the EAR-03 bed through the link."], ["Clicks at regular intervals on the programme."]),
 "dropout": ("Dropout", "Dropout: the deck's “Dropout” answer, a moment of programme missing.",
             "Real dropouts are not clean silences: the learner hears the fade, the noise burst or the squelch of a wireless link failing.",
             ["The EAR-03 bed through a wireless link pushed to its range edge, so real dropouts happen.", "Programme: EAR-03 bed 2 (keys, bass, soft drums)."], ["At least one clear dropout in each example."]),
 "hiss-maxgain": ("Hiss", "Hiss at maximum gain: the deck's “Hiss” answer.",
                  "Broadband hiss is the noise floor every engineer fights; at maximum gain it is the preamp itself.",
                  ["A preamp at maximum gain with nothing connected but a terminated input (shorted or 150 Ω terminator). Phantom OFF."], ["Steady hiss only; no hum tones."]),
 "plosive": ("Pop", "Plosive (mic → preamp): the deck's “Pop” answer.",
             "A plosive is a low thump from a burst of air hitting the capsule, not an electrical fault.",
             ["A talker says a P (e.g. from S1) into a mic at 2 in with no pop filter (mic → preamp → line)."], ["A clear low thump; not clipped."]),
}
d8 = [("ground-loop-60hz", "Ground-loop hum, 60 Hz"), ("dimmer-buzz", "Dimmer (SCR) buzz"), ("rf-gsm", "RF “dit-dit”"), ("crackle", "Crackle"),
      ("clock-slip", "Clock-slip clicks"), ("dropout", "Dropout"), ("hiss-maxgain", "Hiss at maximum gain"), ("plosive", "Plosive (mic → preamp)")]
ear04 = []
for i, (k, nm) in enumerate(d8, 1):
    ans, ctx2, tch, how1, qc1 = D[k]
    ear04.append(R(rid=f"EAR-04.{i}", title=f"{nm}: two examples",
        files=[(f"ear_training/ear04-{k}-{j}.wav", f"{nm} · {j}", "4 s", "", "rec") for j in (1, 2)],
        context=f"A real example for the Ear Training M5 defect deck. {ctx2} The two examples are interchangeable, so the learner does not memorise one file.",
        teaches=f"Naming “{ans}” by ear from a real example, so the synthesized version (and any “(emulation)” label) can be replaced. {tch}",
        record=f"{nm}, captured at line level: two typical examples, 4 s each.",
        how=how1 + EAR04_GEN, tips=EAR04_TIP,
        specs={"Channels": "Mono", "Length": "4 s loops", "Levels": "Peaks ≤ −3 dBFS", "Capture": "LINE capture only", "Session": "4"},
        qc=["Recognisable on its own, without being told what it is.", "No acoustic room sound." if k != "plosive" else "Only the plosive and speech; no room noise."] + qc1,
        safety=["SAFE-1."] if k != "plosive" else []))
ear04.append(R(rid=f"EAR-04.{len(d8) + 1}", title="Noise floor of the recording chain",
    files=[("ear_training/ear04-chain-noise-floor.wav", "Noise floor of the recording chain itself", "4 s", "Reference", "rec")],
    context="The reference for the defect deck: it tells the app (and the learner) what the chain sounded like with no defect, so every other example can be judged against it.",
    teaches="The difference between a chain's normal, quiet noise floor and a defect: “hiss at maximum gain” is a fault, this is normal.",
    record="The full recording chain with its input terminated, at your normal working gain.",
    how=["Same chain as the defect captures, input terminated (shorted or 150 Ω), normal working gain.", "Record 4 s; do not normalise."],
    tips=["Record it first thing, before any defect is set up."],
    specs={"Channels": "Mono", "Length": "4 s", "Levels": "As captured — do not normalise", "Capture": "LINE", "Session": "4"},
    qc=["Steady, quiet hiss; no hum tones."]))
ear04.append(R(rid=f"EAR-04.{len(d8) + 2}", title="Ground-loop hum, 50 Hz: two examples (OPTIONAL, abroad only)",
    files=[(f"ear_training/ear04-ground-loop-50hz-{i}.wav", f"Ground-loop hum, 50 Hz · {i} (OPTIONAL — abroad only)", "4 s", "", "opt") for i in (1, 2)],
    context="An optional 50 Hz version of the ground-loop examples: the defect deck picks 50 or 60 Hz mains at random.",
    teaches="Ground-loop hum on 50 Hz mains, as heard in most of the world: the same harmonic signature, a lower fundamental.",
    record="OPTIONAL. The same method as EAR-04.1 on 50 Hz mains.",
    how=["Only abroad on 50 Hz mains; never fake it.", "Same method as EAR-04.1; NEVER lift a mains earth."] + EAR04_GEN[1:],
    tips=["Only if someone is recording abroad anyway."],
    specs={"Channels": "Mono", "Length": "4 s loops", "Levels": "Peaks ≤ −3 dBFS", "Capture": "LINE"},
    qc=["Fundamental at 50 Hz with harmonics."], safety=["SAFE-1."]))
item(id="EAR-04", title="Real defects for the defect deck", pri="P2", sess=[4], group=G,
 used="Ear Training M5 <em>Audio Defect Recognition</em>: 12 answers (hum, ground loop, buzz, hiss, crackle, pop, click, distortion, clipping, dropout, digital glitch, RF). Today all are synthesized; ground loop and RF are labelled “(emulation)”.",
 safety=["SAFE-1"], reuse="SCN-01 (Audio Scenarios).", see=["NOI-01b", "CAB-01", "SS-02E", "EAR-03"],
 usedin="Ear Training › M5 Defects (src/features/ear/modules/defects.ts)", recs=ear04)

EAR05_LINE = "Line in, line out: the sweep from the interface into the unit's input; record its output. No microphones, no SPL."
item(id="EAR-05", title="Reverb hardware: plate and spring impulse responses", pri="P2", sess=[3], group=G,
 used="Ear Training M9 <em>Reverb Recognition</em> (room / hall / plate / chamber / spring — all labelled “(emulation)” today). Room, chamber and hall come from WAV-02; plate and spring need hardware.",
 safety=[], reuse="Mixing reverb pages.", see=["WAV-02"], usedin="Ear Training › M9 Reverb Recognition (src/features/ear/modules/time.ts)",
 recs=[
  R(rid="EAR-05.1", title="Plate reverb impulse response, wet only",
   files=[("ear_training/ear05-plate-ir.wav", "Plate IR, wet only", "≈ 2.5 s", "Deconvolved", "edit")],
   context="The “plate” answer in Ear Training M9: the app convolves the test source with this IR so the plate choice is a real plate, not an emulation. Also used on the Mixing reverb pages.",
   teaches="A plate's sound: instant density and a bright sheen, with no room cues (no early reflections). In M9 it is the classic confusion with “hall”.",
   record="A deconvolved log-sweep impulse response of a real plate reverb, wet only.",
   how=[EAR05_LINE, "Set the damper for a decay of about 1.6 s and note the setting.", "10 s log sweep, deconvolve as in WAV-02; deliver wet only (no dry signal mixed in)."],
   tips=["Split from the WAV-02 spaces because it is a line capture through hardware, not an acoustic measurement.", "Sweep and S1 on the same unit setting, back-to-back."],
   specs={"Channels": "Stereo (dual-mono if the unit is mono-out; say so)", "Length": "IR ≈ RT × 1.5", "Levels": "Peaks ≤ −3 dBFS"},
   qc=["Smooth, bright, dense tail; no pre-echo.", "No dry signal in the file."]),
  R(rid="EAR-05.2", title="Spring reverb impulse response, wet only",
   files=[("ear_training/ear05-spring-ir.wav", "Spring IR, wet only", "≈ 3 s", "Deconvolved", "edit")],
   context="The “spring” answer in Ear Training M9, replacing the emulation.",
   teaches="A spring's dispersive, chirpy “boing”: high frequencies travel along the spring at a different speed from lows, which no room does.",
   record="A deconvolved log-sweep impulse response of a real spring reverb, wet only.",
   how=[EAR05_LINE, "Use the unit as is; keep the sweep level moderate (springs misbehave when driven).", "10 s log sweep, deconvolve as in WAV-02; wet only."],
   tips=["Do not knock the unit during the sweep: springs crash."],
   specs={"Channels": "Stereo (dual-mono if the unit is mono-out; say so)", "Length": "IR ≈ RT × 1.5", "Levels": "Peaks ≤ −3 dBFS"},
   qc=["The characteristic chirpy “boing”.", "No crash from knocking; no dry signal."]),
  R(rid="EAR-05.3", title="S1 through the plate, wet",
   files=[("ear_training/ear05-plate-s1.wav", "S1 through the plate, wet", "≈ 8 s", "", "rec")],
   context="A plain-playback version of the plate for M9 and the Mixing reverb pages: works today without a convolution step.",
   teaches="How a plate sounds on a voice: the bright, dense wash that made plates the classic vocal reverb.",
   record="The dry S1 (SPC-04 clean) sent through the plate, wet output only.",
   how=[EAR05_LINE, "Same damper setting as EAR-05.1.", "Send S1 at a moderate level; record until the tail ends; wet only."],
   tips=["Record straight after the plate sweep."],
   specs={"Channels": "Stereo (dual-mono if mono-out)", "Length": "≈ 8 s", "Levels": "Peaks ≤ −3 dBFS"},
   qc=["Wet only; tail not cut off."]),
  R(rid="EAR-05.4", title="S1 through the spring, wet",
   files=[("ear_training/ear05-spring-s1.wav", "S1 through the spring, wet", "≈ 8 s", "", "rec")],
   context="A plain-playback version of the spring for M9.",
   teaches="How a spring sounds on a voice: the plosives and consonants set off the “boing”, which the plate does not do.",
   record="The dry S1 (SPC-04 clean) sent through the spring, wet output only.",
   how=[EAR05_LINE, "Moderate send level so the spring does not crash on the P sounds.", "Record until the tail ends; wet only."],
   tips=["Record straight after the spring sweep."],
   specs={"Channels": "Stereo (dual-mono if mono-out)", "Length": "≈ 8 s", "Levels": "Peaks ≤ −3 dBFS"},
   qc=["Wet only; audible spring character; no crash."]),
 ])

EAR06 = [("xy", "XY", "a coincident pair: a stable, precise image built only from level differences, and fully mono-safe", "XY"),
         ("ortf", "ORTF", "a near-coincident pair: level and small time differences give a wider, airier image than XY", "ORTF"),
         ("ab", "AB", "a spaced pair: time differences give a wide, diffuse image with a softer centre", "AB"),
         ("ms", "M/S decoded", "mid-side decoded to L/R: an image whose width depends on the side level", "M/S decoded"),
         ("mono-spot", "Mono spot", "the same moment in mono: centred, with no width at all", "mono spot"),
         ("xy-polarity-inverted", "XY, right channel inverted", "an out-of-phase pair: on headphones it sounds diffuse and inside the head, and in mono it partly cancels", "XY")]
EAR06QC = {"xy": "Sharp, stable image; mono sum loses nothing.", "ortf": "Wider than XY, still a solid centre.", "ab": "Widest image; softer centre than XY and ORTF.",
           "ms": "Decoded correctly: talker on the correct side (not mirrored).", "mono-spot": "Identical in both channels.", "xy-polarity-inverted": "On headphones it sounds diffuse/in-head."}
ear06 = []
for i, (k, d, lesson, srcname) in enumerate(EAR06, 1):
    ear06.append(R(rid=f"EAR-06.{i}", title=f"Stereo excerpt: {d}",
        files=[(f"ear_training/ear06-{k}.wav", d, "6 s", "Edit of MPR-07", "edit")],
        context=f"One answer in Ear Training M6 Stereo Recognition (headphones required): the learner hears 6 s of the same performance and names the technique or fault. This one is {d}.",
        teaches=f"Hearing {lesson}.",
        record=f"No new recording: 6 s cut from the MPR-07 {srcname} take." + (" Right channel polarity-inverted." if "inverted" in k else ""),
        how=[f"Cut the same 6 s as the other EAR-06 files from MPR-07 {srcname}.",
             ("Invert the polarity of the RIGHT channel only (a lossless flip, allowed here because it is the content)." if "inverted" in k else ("Deliver as dual mono." if k == "mono-spot" else "Keep the channels as recorded.")),
             "RMS-match to the other five."],
        tips=["Choose 6 s where the talker crosses the centre.", "Cut all six in one pass from the same timecode."],
        specs={"Channels": "Stereo (mono spot as dual mono)", "Length": "6 s", "Set": "MATCHED (RMS)", "Listening": "Headphones required", "Source": f"MPR-07 {srcname}"},
        qc=[EAR06QC[k], "Same 6 s as the other five excerpts."]))
item(id="EAR-06", title="Stereo Recognition excerpts", pri="P3", sess=[3], group=G,
 used="Ear Training M6 <em>Stereo Recognition</em> (headphones required): left, right, centre, wide, narrow, mono, out-of-phase.",
 safety=[], reuse="—", see=["MPR-07"], usedin="Ear Training › M6 Stereo (src/features/ear/modules/spatial.ts)", recs=ear06)

# ================================================================ TUNING
G = "Tuning and Temperament"
TUN_HOW = ["Book the tuner right before the session; ask for a normal concert stretch and record their stretch setting.",
           "Mic 30 cm above the hammers (mono), lid on full stick (note it).",
           "Play mf, hold the key down for 6 s or more; let low notes ring longer, never fade early. Peaks ≤ −6 dBFS."]
TUN_TIP = ["Record all seven files in one pass, low to high, straight after the tuner leaves.", "Measure each note's pitch with a tuner app or analyser and log the cents from equal temperament."]
TN = {1: ("A1 (55 Hz)", "the most inharmonic note in the set: the thick bass string's overtones run audibly sharp of whole-number multiples, and the fundamental is weak", "tuned slightly flat of equal temperament"),
      2: ("A2 (110 Hz)", "a low note whose sharp upper partials pull the octave above it wider", "tuned a little flat"),
      3: ("A3 (220 Hz)", "the middle of the stretch: close to equal temperament", "close to equal temperament"),
      4: ("A4 (440 Hz)", "the tuning reference itself, set to 440 Hz", "the reference, 0 cents"),
      5: ("A5 (880 Hz)", "a treble note tuned sharp so it agrees with the sharp upper partials of the notes below", "tuned a few cents sharp")}
tun01 = []
for n_ in (1, 2, 3, 4, 5):
    nm, lesson, where = TN[n_]
    tun01.append(R(rid=f"TUN-01.{n_}", title=f"Single note {nm}",
        files=[(f"tuning/tun01-a{n_}.wav", f"A{n_} single note", "≥ 6 s", "", "rec")],
        context=f"One of five single A's the Tuning &amp; Temperament chapters on harmonics and trade-offs use to show a real stretch tuning. The learner compares its measured pitch and partials with equal temperament: on a stretched piano, {nm} is {where}.",
        teaches=f"Real strings are inharmonic. This note shows {lesson}.",
        record=f"{nm} on a freshly, professionally stretch-tuned acoustic piano, held to full decay.",
        how=TUN_HOW, tips=TUN_TIP,
        specs={"Channels": "Mono", "Length": "≥ 6 s with full decay", "Levels": "Peaks ≤ −6 dBFS", "Session": "7"},
        qc=["Measured pitch logged in the sidecar (cents from equal temperament).", "Full decay; no pedal or bench noise.", f"{nm}: expected {where}; flag it if the measurement disagrees."]))
tun01.append(R(rid="TUN-01.6", title="Octave A2 + A3",
    files=[("tuning/tun01-octave-a2-a3.wav", "Octave A2 + A3", "≥ 6 s", "", "rec")],
    context="The low-octave example in the stretch-tuning chapter: the learner hears two notes a stretched octave apart, tuned beatless by ear, against the pure 2:1 the synthesis offers.",
    teaches="A tuner sets an octave so the upper note matches the lower note's sharp 2nd partial: the octave ends up wider than 2:1 yet sounds clean. In the bass this is driven by heavy, inharmonic strings.",
    record="A2 and A3 struck together on the stretch-tuned piano, held to full decay.",
    how=TUN_HOW, tips=TUN_TIP,
    specs={"Channels": "Mono", "Length": "≥ 6 s with full decay", "Levels": "Peaks ≤ −6 dBFS", "Session": "7"},
    qc=["No audible beating between the two notes.", "Both pitches logged in the sidecar.", "Octave measured wider than 1200 cents; value logged (bass stretch)."]))
tun01.append(R(rid="TUN-01.7", title="Octave A4 + A5",
    files=[("tuning/tun01-octave-a4-a5.wav", "Octave A4 + A5", "≥ 6 s", "", "rec")],
    context="The treble-octave example in the same chapter, to compare with the low octave (TUN-01.6).",
    teaches="In the treble the octave is stretched too, but by a different amount: the stretch is a curve across the keyboard, not a fixed offset.",
    record="A4 and A5 struck together on the stretch-tuned piano, held to full decay.",
    how=TUN_HOW, tips=TUN_TIP,
    specs={"Channels": "Mono", "Length": "≥ 6 s with full decay", "Levels": "Peaks ≤ −6 dBFS", "Session": "7"},
    qc=["No audible beating between the two notes.", "Both pitches logged in the sidecar.", "Octave measured wider than 1200 cents; value logged and compared with TUN-01.6."]))
item(id="TUN-01", title="Real piano octave stretch", pri="P3", sess=[7], group=G,
 used="Tuning &amp; Temperament chapters on harmonics and trade-offs: real pianos are tuned with stretched octaves because their strings are inharmonic. Today it is synthesized.",
 safety=[], reuse="DIG-01 context.", see=["TUN-02"], usedin="Tuning & Temperament (ch12Tradeoffs, ch4Harmonics)", recs=tun01)

TUN02_HOW = ["Two violins (or two voices) holding A4 + C♯5; SDC at 1 m between the players.", "Each player watches a tuner set to show cents; the lower player holds A4 at 0.", "Hold steady for 6 s, no vibrato; two takes."]
item(id="TUN-02", title="Pure versus equal-tempered major third by real players", pri="P3", sess=[7], group=G, status="optional",
 used="Tuning &amp; Temperament comparisons (synthesis remains the measured reference).", safety=[], reuse="—", see=["TUN-01"], usedin="Tuning & Temperament",
 recs=[
  R(rid="TUN-02.1", title="Pure major third, A4 + C♯5 (two takes, OPTIONAL)",
   files=[(f"tuning/tun02-third-pure-take{t}.wav", f"Pure third, take {t} (OPTIONAL)", "6 s", "", "opt") for t in (1, 2)],
   context="OPTIONAL. The pure-third example in the Tuning &amp; Temperament comparisons, next to the synthesized reference: real players holding a just third.",
   teaches="A pure major third (5:4, ≈ 386 cents) sounds still and sweet, with no beating; players tune it about 14 cents narrower than the piano's.",
   record="OPTIONAL. Two violins (or two voices) holding A4 + C♯5 as a pure third.",
   how=TUN02_HOW + ["The upper player aims for −14 cents on C♯5 (pure)."],
   tips=["Performers cannot hold cents exactly; log the measured values.", "Record pure and equal takes alternately so the players hear the difference."],
   specs={"Channels": "Mono", "Length": "6 s", "Target": "C♯5 at −14 cents"},
   qc=["Measured interval logged (aim ≈ 386 cents).", "Little or no beating."]),
  R(rid="TUN-02.2", title="Equal-tempered major third, A4 + C♯5 (two takes, OPTIONAL)",
   files=[(f"tuning/tun02-third-equal-take{t}.wav", f"Equal-tempered third, take {t} (OPTIONAL)", "6 s", "", "opt") for t in (1, 2)],
   context="OPTIONAL. The equal-tempered comparison: the same players and notes, with the third set as on a piano.",
   teaches="An equal-tempered third (400 cents) is about 14 cents wide of pure and beats audibly. Next to TUN-02.1 the learner hears the trade-off equal temperament makes.",
   record="OPTIONAL. The same players holding A4 + C♯5 as an equal-tempered third.",
   how=TUN02_HOW + ["The upper player aims for 0 cents on C♯5 (equal)."],
   tips=["Performers cannot hold cents exactly; log the measured values."],
   specs={"Channels": "Mono", "Length": "6 s", "Target": "C♯5 at 0 cents"},
   qc=["Measured interval logged (aim ≈ 400 cents).", "Audible beating."]),
 ])
