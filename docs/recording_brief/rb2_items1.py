# -*- coding: utf-8 -*-
# Recording brief item data, part 1 (Mixing .. Envelope) — v2: one `rec` per DISTINCT recording.
# Content strings may contain minimal HTML.
# file tuple: (filename, variant, length, notes, kind)  kind: rec | edit | reuse | opt
# Item level: id, title, pri, sess, group, used, safety, reuse, see, usedin, recs.
# item() also fills item["files"] = union of recs[*].files (in rec order) for builders that still read it.

ITEMS = []


def item(**k):
    recs = k.get("recs", [])
    if "files" not in k:
        k["files"] = [f for r in recs for f in r["files"]]
    ITEMS.append(k)


def rec(rid, title, files, context, teaches, record, how, tips, specs, qc, safety=None):
    d = dict(rid=rid, title=title, files=list(files), context=context, teaches=teaches, record=record,
             how=list(how), tips=list(tips), specs=dict(specs), qc=list(qc))
    if safety:
        d["safety"] = list(safety)
    return d


# ================================================================ MIXING / MASTERING
G = "Mixing and Mastering"


def _stem_files(k, v):
    f = [(f"mixing_lab/mix-{k}.wav", v, "24.000 s", "Master take. 1,152,000 samples, starts on bar 1 beat 1.", "rec")]
    for t in (1, 2):
        f.append((f"mixing_lab/alt/mix-{k}-alt{t}.wav", f"{v} — alternate take {t}", "24.000 s",
                  "Same length and alignment as the master take.", "rec"))
    return f


MIX_SPECS = {"Channels": "Mono", "Length": "Exactly 24.000 s = 1,152,000 samples at 48 kHz, from bar 1 beat 1 of the second pass",
             "Type": "Seamless loop (cut on bar lines, at the same sample as every other stem)",
             "Levels": "Peaks ≤ −6 dBFS; no clipping anywhere in the chain",
             "Set": "Not matched: raw stem level (the app RMS-aligns on load)", "Processing": "None. Edits and fades only.",
             "Count-in": "None in the delivered file", "Takes": "Master + alternate 1 + alternate 2, each from a different full band take"}
MIX_CAPTURE = ("Capture: the band plays the 8-bar form (A minor, 80 BPM, verse bars 1–4, chorus bars 5–8) three times to click without stopping. "
               "Deliver the SECOND pass; cut at its downbeat, the same sample for all stems, so the file is exactly 1,152,000 samples and its first beat "
               "already contains the ring-over from the bar before (the loop has no hole).")
MIX_ALTS = "Master and both alternates come from three different full takes, never from different passes of one take."

item(id="MIX-01", title="House multitrack song — 8 mono stems", pri="P1", sess=[3], group=G,
 used="Both Mixing labs (Beginning, 16 pages; Advanced, 20 pages) load one 8-track session. The learner balances, pans, EQs, compresses, sends to reverb and automates it on every page, from <em>Build a Static Mix</em> to <em>The Final Mix</em>. Today that session is a 10-second synthesized groove; the vocal and backing-vocal tracks are labelled on screen as a “synth stand-in for the vocal”.",
 safety=[], reuse="MIX-02 (same take), MIX-03, MST-01, EAR-01, EAR-03 bed feel, PATCH-01 (dry lead), MTR-01 music, SC-01, SS-04 (stems as monitor programme), Start Here.",
 see=["MIX-02", "MST-01", "FX-03"],
 usedin="Mixing labs › session tracks (src/screens/lab/mixing/audio/mixAudio.ts sessionStems; engine/mixModel.ts; docs/APE_MIXING_LAB_ASSETS_2026_09_11.md)",
 recs=[
  rec("MIX-01.1", "Kick drum — inside/port close mic", _stem_files("kick", "Kick (inside/port mic)"),
   context="Track 1 of the session and the first fader the learner sets on <em>Build a Static Mix</em>: the whole balance is built up from the kick. Later pages put a high-pass, a low-mid cut and a compressor on it, and set it against the bass for low-end space.",
   teaches="What a real close-miked kick contains: the low thump (50–100 Hz) that fights the bass, the cardboard low-mid (200–400 Hz) that EQ cleans out, and the beater click (2–5 kHz) that lets it cut through on small speakers. The synth kick has none of that detail.",
   record="The kick part of the house song, played by the drummer with the band to click.",
   how=["Mic: large-diaphragm dynamic kick mic (Beta 52 / D112 class), cardioid.",
        "Placement: through the port into the drum, capsule 5–10 cm from the batter head, aimed at the beater but slightly off-centre (on-centre gives the most click, off-centre more body).",
        "Drum: tuned for a short, punchy note; a small pillow or blanket just touching the batter head. It should sound finished but untreated.",
        "Gain: hardest hit peaks around −8 dBFS so the loudest chorus fills stay under −6 dBFS.",
        MIX_CAPTURE, MIX_ALTS],
   tips=["Set the kick channel up first and leave it: ENV-01's single kick hit and MIX-02's kick-out mic use the same drum and tuning.",
         "Tape the kick-mic stand to the floor: if it moves between takes, the alternates stop matching the master in tone."],
   specs=MIX_SPECS,
   qc=["Every hit is even in level (no flammed or ghosted beats unless played on purpose).", "The beater click is audible on a phone speaker.",
       "No ringing low note sustaining between hits (tuning and damping are right).", "Loops on itself without a gap or double hit at the seam."]),
  rec("MIX-01.2", "Snare — top close mic", _stem_files("snare", "Snare top"),
   context="The backbeat track. The learner EQs it (body vs crack), compresses it for snap and sends it to the reverb on the FX pages. On the Advanced <em>Phase, Polarity and Alignment</em> page it is the top half of the top/bottom pair (MIX-02.1 is the bottom).",
   teaches="The two parts of a snare: body at 150–250 Hz and crack at 2–5 kHz, plus the hi-hat bleed every real snare mic carries. A real snare shows how attack and release settings change the hit.",
   record="The snare part of the house song, close-miked on the top head.",
   how=["Mic: cardioid dynamic (SM57 class).",
        "Placement: 3–5 cm above the rim at the drummer's side, angled 30–45° down toward the centre of the head; turn the mic so its rear (the null) points at the hi-hat.",
        "Snare: tuned medium, lightly damped (one gel pad at most), wires on.",
        "Gain: rim-shot accents peak around −8 dBFS.", MIX_CAPTURE, MIX_ALTS],
   tips=["Leave the polarity exactly as it comes from the mic: MIX-02.1 (snare bottom) is judged against this track.",
         "This same mic and tuning give ENV-01's single snare hit: record that one-shot during the drum setup, before the band arrives."],
   specs=MIX_SPECS,
   qc=["Crack and body both present; hi-hat bleed audible but well below the snare.", "No stick hits on the mic (no sharp clicks unrelated to the snare).",
       "Ghost notes, if played, are consistent across master and alternates."]),
  rec("MIX-01.3", "Percussion — hi-hat and shaker on one SDC", _stem_files("perc", "Percussion: hi-hat and shaker"),
   context="The top-end rhythm track. The learner pans it off-centre, high-passes it and turns it down until it sits under the vocal; it is also the track that shows how much high end a mix really needs.",
   teaches="A high, busy part needs little level and no low end: a high-pass up to 300–500 Hz removes kick and snare bleed without changing the part. Panning it moves the whole mix's top end.",
   record="Hi-hat played by the drummer and a shaker played by a second percussionist, both into one small-diaphragm condenser.",
   how=["Mic: cardioid small-diaphragm condenser (SDC).",
        "Placement: 15 cm above the hi-hat, aimed between the edge and the bell, angled away from the snare.",
        "Shaker: the percussionist stands 30 cm from the same SDC, on-axis, and plays 16ths through the chorus (bars 5–8) only, or throughout if the arrangement calls for it; note which in the sidecar.",
        "Gain: hi-hat accents peak around −10 dBFS.", MIX_CAPTURE, MIX_ALTS],
   tips=["If the shaker is overdubbed instead, do it to the master drum take, then to each alternate take, so all three files still line up with their own takes.",
         "Keep the hi-hat mic out of the snare's direct line: snare bleed here makes the high-pass lesson less clean."],
   specs=MIX_SPECS,
   qc=["Hi-hat and shaker both clearly audible; shaker sits in time with the hat.", "Snare bleed is present but clearly lower than the hat.",
       "No harsh ringing from the SDC being too close to the cymbal edge (air blast whoosh)."]),
  rec("MIX-01.4", "Bass — DI", _stem_files("bass", "Bass DI"),
   context="The low-end partner of the kick. The learner balances the two, compresses the bass to even out the notes, and carves EQ space between bass and kick. On the Advanced Phase page it is the DI half of the DI/amp pair (MIX-02.3).",
   teaches="A clean DI bass: full, even low end with no room and no amp colour, so the fight with the kick at 50–100 Hz is easy to see and hear. Real finger dynamics show what a compressor is for.",
   record="The bass part played by the bassist with the band, taken from a DI box before the amp.",
   how=["DI: active DI box; bass into the DI input, DI thru to the bass amp (MIX-02.3 mics that amp at the same time).",
        "Ground lift off unless there is hum; if it is used, note it.",
        "Bassist plays with consistent fingers or pick throughout all three takes; tell them to play the part, not to compress themselves.",
        "Gain: loudest notes peak around −8 dBFS.", MIX_CAPTURE, MIX_ALTS],
   tips=["Print DI and amp mic from the same DI box on the same take: that is what makes the Advanced Phase page work.",
         "Fresh-ish strings: dead strings make the DI dull and the EQ lesson harder."],
   specs=MIX_SPECS,
   qc=["No hum or buzz on held notes (SAFE-1 checks).", "Every note speaks; no fret buzz or string noise louder than the notes.",
       "Low end even across the neck (no single note jumping out by more than about 3 dB)."]),
  rec("MIX-01.5", "Electric guitar — close mic on the amp", _stem_files("gtr", "Electric guitar, close mic"),
   context="The mid-range track. The learner pans it, high-passes it and cuts room for the vocal in the 1–4 kHz region; on the Advanced pages it pairs with the guitar room mic (MIX-02.6).",
   teaches="Masking: a real guitar and a real vocal share 1–4 kHz, so the vocal disappears when the guitar is loud there. Small EQ cuts and panning bring the vocal back without turning the guitar down.",
   record="The rhythm-guitar part, close-miked on the amp.",
   how=["Mic: cardioid dynamic (SM57 class).",
        "Placement: 3 cm from the grille cloth, on-axis to the cone just off the dust cap (on the cap is brighter, further out is darker; note the spot).",
        "Amp: a clean-to-edge-of-breakup tone, not heavily distorted; volume moderate.",
        "Gain: loudest strums peak around −8 dBFS.", MIX_CAPTURE, MIX_ALTS],
   tips=["Mark the mic position on the grille cloth with tape: the alternates must sound like the same mic position.",
         "MIX-02.6 (the room mic) is up at the same time; set it before the first take."],
   specs=MIX_SPECS,
   qc=["Tone is full but not fizzy; no amp hum between chords.", "Part sits in time with the drums at the loop seam."]),
  rec("MIX-01.6", "Keys / pad", _stem_files("keys", "Keys / pad"),
   context="The sustained harmonic bed. The learner fits it under the vocal with EQ and level, and automates it between verse and chorus.",
   teaches="A pad fills the same mid-range the vocal needs; turning it down is the wrong first move — a gentle cut where the vocal lives keeps the pad's size and lets the voice through.",
   record="The keyboard part, recorded direct.",
   how=["Source: the keyboard's stereo outputs summed to mono at the DI, or the LEFT output only if the patch is mono-compatible. Write which in the sidecar.",
        "Patch: a warm pad or electric-piano/pad layer with no built-in delay or chorus on the output (effects belong to the mix lab).",
        "Gain: loudest chords peak around −8 dBFS.", MIX_CAPTURE, MIX_ALTS],
   tips=["Check the mono sum before the first take: some stereo patches cancel when summed. Switch to the left output if they do.",
         "Ask the player to keep the same voicings across all three takes."],
   specs=MIX_SPECS,
   qc=["No phasey or hollow sound (mono sum is clean).", "Sustained chords do not cut off at the loop seam."]),
  rec("MIX-01.7", "Lead vocal — S2, soft verse into full chorus", _stem_files("lead", "Lead vocal (real sung lyric, S2)"),
   context="The track the whole mix serves. The learner sets it on top of the band, compresses and de-esses it, sends it to reverb and, on the automation page, rides it up from the soft verse (first half) into the loud chorus (second half). Today it is a synth stand-in.",
   teaches="Mixing a real voice: real sibilance to tame, real verse-to-chorus dynamics to automate, and real masking by the guitar and keys. The lesson only works if the performance itself gets louder in the chorus.",
   record="The S2 melody and lyric (contains S, Z, SH, P and B), sung over the band take: soft and intimate in bars 1–4, full voice in bars 5–8.",
   how=["Overdub in the booth to the drum, bass, guitar and keys take, after the band is done.",
        "Mic: cardioid large-diaphragm condenser (LDC) at 15–20 cm, mouth height, with a fabric pop filter 5 cm in front of the grille.",
        "Room: DRY booth. Headphones closed-back and not too loud, to keep click and band spill out of the mic.",
        "Gain: set on the loudest chorus note, peaking around −8 dBFS; leave it fixed through all takes.",
        "Performance: real dynamics — no leaning into the mic in the chorus to compensate; the level change must come from the voice.",
        "Sing over each of the three band takes; cut each vocal with its band take.", MIX_ALTS],
   tips=["Comp nothing: each delivered file is one continuous vocal pass, so the de-esser and compressor see a real performance.",
         "Mute the click in the singer's headphones if it bleeds; give them the drums instead.",
         "Record DES-01 and EQ-01 vocal items with the same singer on the same day while the voice is warm."],
   specs=MIX_SPECS,
   qc=["Bars 5–8 are clearly louder than bars 1–4 (at least 4–6 dB RMS).", "S sounds are audible and unprocessed (no de-esser in the chain).",
       "Solo the track: no audible click or band bleed from the headphones.", "No plosive pops through the pop filter."]),
  rec("MIX-01.8", "Backing vocals — 2–3 harmony parts bounced to one mono file", _stem_files("bgv", "Backing vocals, 2–3 parts bounced to one mono file"),
   context="The support vocal track. The learner sets it behind the lead with level, a darker EQ, more reverb and, on the Advanced pages, group compression.",
   teaches="Backing vocals sit behind the lead: lower, darker and more distant, so the lead stays in front. A real stack of voices also shows why one bus compressor glues them together.",
   record="Two or three harmony parts to the chorus (and verse if arranged), each sung once, balanced and bounced to one mono file.",
   how=["Same booth, LDC and pop filter as the lead; singers at 30 cm (further than the lead, so the parts sound slightly more distant).",
        "Record each harmony part as its own pass over each band take, then bounce the parts to one mono file at a simple balance. Level only: no EQ, compression or reverb.",
        MIX_ALTS],
   tips=["Record the backing parts right after the lead while the singer is warm; if the same singer sings them, keep the distance at 30 cm so the parts sound different from the lead.",
         "Keep the harmony parts' individual files in your archive; deliver only the bounce."],
   specs=MIX_SPECS,
   qc=["Harmony parts in tune with each other and with the lead (within about ±10 cents on held notes).", "Balance between the parts sounds even; no single part sticks out.",
       "Bounce did not clip (peaks ≤ −6 dBFS)."]),
 ])

MIX2_COMMON = {"Channels": "Mono", "Length": "Exactly 24.000 s, sample-aligned with MIX-01", "Type": "Seamless loop, same cut as MIX-01",
               "Levels": "Peaks ≤ −6 dBFS", "Set": "Raw: not time-aligned, not polarity-corrected",
               "Sidecar": "Measured offsets go in mixing_lab/mix-02-offsets.txt (samples and ms)"}
MIX2_RIDE = "Set this mic up before the first MIX-01 take: it rides on the same three takes and is cut at the same sample as the MIX-01 stems."
item(id="MIX-02", title="Extended stems for the Advanced Mixing lab", pri="P2", sess=[3], group=G,
 used="Advanced Mixing pages <em>Phase, Polarity &amp; Alignment</em>, <em>Advanced Dynamics</em> (gating and de-essing), and <em>Stems &amp; Alternate Mixes</em> / <em>Stem Reconstruction</em>. The learner flips polarity (Ø), nudges alignment, gates real bleed and rebuilds stems. Today all of it runs on the synthesized session.",
 safety=[], reuse="FX-06 (Phase lab), EAR-06 context, De-Esser (real sibilance in the lead), FX-02 context.",
 see=["MIX-01", "FX-06"],
 usedin="Advanced Mixing › Phase, Advanced Dynamics, Stems pages (src/screens/lab/mixing/pagesAdvB.tsx, pagesAdvC.tsx, pagesAdvD.tsx)",
 recs=[
  rec("MIX-02.1", "Snare — bottom mic (polarity as recorded)", [("mixing_lab/mix-snare-bottom.wav", "Snare bottom", "24.000 s", "Polarity as recorded — do NOT flip", "rec")],
   context="Paired with the snare top (MIX-01.2) on <em>Phase, Polarity and Alignment</em>. The learner sums the two, hears the snare go thin, presses Ø on the bottom mic and hears it come back full.",
   teaches="Two mics facing each other on one drum head see opposite pressure: the bottom head moves away when the top moves toward the top mic. Summed as recorded they partly cancel; flipping one restores the body. That is a polarity lesson, not a timing one.",
   record="The snare wires captured from underneath, on the MIX-01 takes.",
   how=["Mic: cardioid dynamic or SDC.", "Placement: 5–8 cm under the snare, pointing up at the wires, angled away from the kick beater.",
        "Leave the polarity exactly as the mic delivers it; no Ø switch on the preamp.", "Gain: peaks around −10 dBFS (it is brighter and spikier than the top).",
        MIX2_RIDE, "Measure the top/bottom time offset from a single hit and write it in the offsets sidecar."],
   tips=["Never polarity-correct or align it: the thin sum is the lesson.", "If the preamp has a Ø button, tape over it."],
   specs={**MIX2_COMMON, "Polarity": "As recorded — the sum with MIX-01.2 should be thin"},
   qc=["Sum top + bottom as recorded: thin. Flip the bottom: fuller. If it is the other way round, the bottom mic was already inverted somewhere in the chain — find out, note it, do not fix it.",
       "Wires are bright and clear; kick bleed is audible but not dominant."]),
  rec("MIX-02.2", "Kick — outside mic, 20 cm from the front head", [("mixing_lab/mix-kick-out.wav", "Kick outside (front head, ~20 cm)", "24.000 s", "Not time-aligned to kick-in", "rec")],
   context="Paired with the kick-inside mic (MIX-01.1) on <em>Phase, Polarity and Alignment</em>. The learner sums them, hears comb-filter colour, then nudges the inside mic later in time until the low end locks.",
   teaches="Two mics at different distances from one source arrive at different times: about 0.6 ms later per 20 cm. The sum comb-filters (some frequencies cancel, some add) until the earlier mic is delayed to match. This is a timing lesson, unlike the snare bottom.",
   record="The kick from outside the front head, on the MIX-01 takes.",
   how=["Mic: LDC or large dynamic, cardioid.", "Placement: 20 cm outside the front (resonant) head, on-axis with the beater; if the head has a port, aim at the solid head beside it.",
        "Gain: peaks around −10 dBFS.", MIX2_RIDE, "Measure the inside/outside offset from a single hit and write it in the offsets sidecar."],
   tips=["Never time-align it to the inside mic: the comb filter is the lesson.", "A short tunnel (blanket over the mic and drum) cuts cymbal spill if the room is live; note it."],
   specs={**MIX2_COMMON, "Offset": "Expected ≈ 0.6 ms (≈ 29 samples) later than kick-in per 20 cm; measure and log"},
   qc=["Kick in + out summed raw shows audible hollow colouring; after delaying the inside mic by the logged offset, the low end is fuller.",
       "More round low end and less beater click than the inside mic."]),
  rec("MIX-02.3", "Bass — amp mic (same take as the DI)", [("mixing_lab/mix-bass-amp.wav", "Bass amp mic", "24.000 s", "Same take as the DI (mix-bass.wav)", "rec")],
   context="Paired with the bass DI (MIX-01.4) on the Advanced Phase page and on <em>Stems and Alternate Mixes</em>. The learner blends DI and amp, hears the blend go hollow, and aligns the amp to the DI.",
   teaches="An amp mic arrives later than its DI: the speaker, the air gap and converter latency add a fraction of a millisecond to a few milliseconds. Blending the two without alignment thins the low end; aligned, the DI gives the floor and the amp gives the growl.",
   record="The bass amp's speaker, miked on the same take as the DI.",
   how=["Mic: cardioid dynamic or LDC.", "Placement: 5–10 cm from the speaker cone, slightly off the centre.",
        "Signal: from the DI box's thru output; the DI is the MIX-01.4 stem.", "Gain: peaks around −8 dBFS.", MIX2_RIDE,
        "Measure DI-to-amp offset from a single plucked note and write it in the offsets sidecar."],
   tips=["Do not align or polarity-flip the amp track; that is the learner's job.", "Keep the amp at a moderate level so it does not bleed into the drum mics more than a real session would."],
   specs={**MIX2_COMMON, "Offset": "Amp arrives later than the DI by a measurable amount — log it"},
   qc=["Amp arrives later than the DI by a measurable amount (noted).", "No rattles from the cabinet or the room on low notes."]),
  rec("MIX-02.4", "Drum overheads — spaced pair or ORTF, left and right", [("mixing_lab/mix-oh-l.wav", "Overhead left", "24.000 s", "", "rec"),
                                                                          ("mixing_lab/mix-oh-r.wav", "Overhead right", "24.000 s", "", "rec")],
   context="The kit picture on <em>Advanced Dynamics</em> and <em>Stem Reconstruction</em>: the learner hears how much of every drum the overheads carry, and why gating the close mics changes the kit sound less than expected. The two files are the two halves of one stereo pair.",
   teaches="Overheads are the whole kit at a distance: cymbals plus every drum arriving a few milliseconds after the close mics. They show bleed as part of the sound, not a fault, and they set the stereo picture of the kit.",
   record="The whole kit from above with a matched stereo pair, delivered as two mono files (left, right).",
   how=["Mics: matched pair of cardioid SDCs.", "Placement: spaced pair or ORTF about 1 m above the cymbals; measure the distance from each capsule to the centre of the snare and make them equal (tape measure). Note the technique and the distances.",
        "Gain: identical on both channels; crash hits peak around −8 dBFS.", MIX2_RIDE],
   tips=["Equal distance to the snare is what keeps the snare centred; check it with a tape measure, not by eye.", "Photograph the kit and overheads from above and from the front for the delivery folder."],
   specs={**MIX2_COMMON, "Pair": "Two mono files = left and right of one pair; identical gain"},
   qc=["Snare sits in the centre when both files are panned hard left and right.", "Cymbals not harsh or swishy from being too close.",
       "Line up with MIX-01 sample for sample (check a transient)."]),
  rec("MIX-02.5", "Drum room — stereo pair 3–4 m from the kit", [("mixing_lab/mix-room-l.wav", "Room left", "24.000 s", "", "rec"),
                                                                   ("mixing_lab/mix-room-r.wav", "Room right", "24.000 s", "", "rec")],
   context="The ambience tracks on <em>Advanced Dynamics</em> and <em>Stem Reconstruction</em>. The learner blends the room under the close mics, compresses it hard for size, and hears it arrive later than everything else.",
   teaches="A room pair gives size and distance; it arrives about 9–12 ms after the close mics at 3–4 m, so it adds depth rather than detail. Heavy compression on it makes the kit sound bigger without changing the close mics.",
   record="The whole kit in the room from 3–4 m, with a stereo pair delivered as two mono files.",
   how=["Mics: matched pair (cardioid LDCs or omnis).", "Placement: 3–4 m in front of the kit at head height, about 1–2 m apart, facing the kit.",
        "Gain: identical on both channels; loudest fills peak around −8 dBFS.", MIX2_RIDE],
   tips=["Walk the room while the drummer plays and put the pair where the kit sounds best, not where it is convenient.", "Keep the bass amp turned away from the room pair."],
   specs={**MIX2_COMMON, "Pair": "Two mono files = left and right of one pair; identical gain"},
   qc=["Clearly roomier and later than the overheads.", "No single drum dominates; no flutter echo from a parallel wall."]),
  rec("MIX-02.6", "Electric guitar — room mic 1.5–2 m", [("mixing_lab/mix-gtr-room.wav", "Guitar room mic", "24.000 s", "", "rec")],
   context="Paired with the close guitar (MIX-01.5) on <em>Phase, Polarity and Alignment</em> and on <em>Stems and Alternate Mixes</em>: the learner blends close and room, hears the delay, and decides whether to align it.",
   teaches="A distant mic on the same amp arrives 4–6 ms late and carries the room. Blended under the close mic it adds space; aligned, it thickens instead. Both are valid choices, and the learner hears the difference.",
   record="The guitar amp from 1.5–2 m away in the room.",
   how=["Mic: cardioid LDC or omni.", "Placement: 1.5–2 m from the amp, at the height of the speaker, facing it.",
        "Gain: peaks around −10 dBFS.", MIX2_RIDE, "Measure the close-to-room offset from a single pick attack and write it in the offsets sidecar."],
   tips=["Do not align it to the close mic.", "If the drums bleed heavily, move the mic closer to the amp (not further than 2 m) and note the distance."],
   specs={**MIX2_COMMON, "Offset": "Expected ≈ 4–6 ms later than the close mic — measure and log"},
   qc=["Audibly more distant than the close guitar.", "Drum bleed present but the guitar is the main sound."]),
  rec("MIX-02.7", "Snare top — reused from MIX-01", [("mixing_lab/mix-snare.wav", "Snare top", "—", "Reuse — delivered under MIX-01", "reuse")],
   context="The partner for MIX-02.1 on the Phase page: the polarity flip is judged against this track.",
   teaches="See MIX-01.2 and MIX-02.1: the top mic is the reference polarity.", record="Nothing new — deliver MIX-01.2 (mix-snare.wav) once.",
   how=["No recording. The file is delivered under MIX-01.2."], tips=["Do not deliver a second copy."],
   specs={"Source": "MIX-01.2"}, qc=["The MIX-01.2 file lines up sample for sample with MIX-02.1."]),
  rec("MIX-02.8", "Kick inside — reused from MIX-01", [("mixing_lab/mix-kick.wav", "Kick inside", "—", "Reuse — delivered under MIX-01", "reuse")],
   context="The partner for MIX-02.2 on the Phase page: the learner delays this track to meet the outside mic.",
   teaches="See MIX-01.1 and MIX-02.2: the inside mic arrives first.", record="Nothing new — deliver MIX-01.1 (mix-kick.wav) once.",
   how=["No recording. The file is delivered under MIX-01.1."], tips=["Do not deliver a second copy."],
   specs={"Source": "MIX-01.1"}, qc=["The MIX-01.1 file lines up sample for sample with MIX-02.2."]),
  rec("MIX-02.9", "Bass DI — reused from MIX-01", [("mixing_lab/mix-bass.wav", "Bass DI", "—", "Reuse — delivered under MIX-01", "reuse")],
   context="The partner for MIX-02.3 on the Phase page: the DI is the early, clean reference the amp is aligned to.",
   teaches="See MIX-01.4 and MIX-02.3.", record="Nothing new — deliver MIX-01.4 (mix-bass.wav) once.",
   how=["No recording. The file is delivered under MIX-01.4."], tips=["Do not deliver a second copy."],
   specs={"Source": "MIX-01.4"}, qc=["The MIX-01.4 file lines up sample for sample with MIX-02.3."]),
  rec("MIX-02.10", "Guitar close — reused from MIX-01", [("mixing_lab/mix-gtr.wav", "Guitar close", "—", "Reuse — delivered under MIX-01", "reuse")],
   context="The partner for MIX-02.6: the close mic the room mic is blended under.",
   teaches="See MIX-01.5 and MIX-02.6.", record="Nothing new — deliver MIX-01.5 (mix-gtr.wav) once.",
   how=["No recording. The file is delivered under MIX-01.5."], tips=["Do not deliver a second copy."],
   specs={"Source": "MIX-01.5"}, qc=["The MIX-01.5 file lines up sample for sample with MIX-02.6."]),
 ])

MIX3_SPEC = {"Channels": "Stereo", "Length": "24.000 s, loops like MIX-01", "Set": "MATCHED: within ±0.5 LU of the clean version's integrated loudness",
             "Exception": "Mastered references: peak ceiling is −1 dBTP, not −3 dBFS (see Safety)"}
MIX3_FROM = "Start from the clean pro mix session (MIX-03.1). Change ONLY the one setting below, then bounce."
item(id="MIX-03", title="Reference bounces: one clean mix and three flawed mixes", pri="P3", sess=[3], group=G,
 used="Beginning Mixing <em>Check &amp; Finish</em> and <em>Basic Export</em>, Advanced <em>Translation &amp; Quality Control</em> and <em>Professional Delivery</em>. The learner compares a finished mix with flawed versions and names what is wrong.",
 safety=[], reuse="MST-01 context, SCN-01 (Audio Scenarios), Production.", see=["MIX-01", "MST-01", "SCN-01"],
 usedin="Mixing labs › Check & Finish, Export, Translation pages (src/screens/lab/mixing/pagesD.tsx, pagesAdvD.tsx)",
 recs=[
  rec("MIX-03.1", "Clean professional mix (the reference)", [("mixing_lab/mix03-ref-clean.wav", "Clean pro mix", "24.000 s", "−14 LUFS, ≤ −1 dBTP", "rec")],
   context="The target on every check-and-finish page: the learner's own mix and the three flawed bounces are all compared against it.",
   teaches="What a finished, translated mix of this song sounds like: vocal on top, kick and bass locked, nothing harsh or muddy, and level that holds up on a phone and on monitors.",
   record="A professional mix of MIX-01 (stems plus MIX-02 mics), lightly mastered.",
   how=["Mix MIX-01 with the MIX-02 mics to a clean, professional balance. EQ, compression, reverb and limiting ARE allowed here: this item is a produced mix.",
        "Master lightly to −14 LUFS integrated and ≤ −1 dBTP.", "Bounce the same 24.000 s loop as MIX-01. Write every processing setting in the sidecar."],
   tips=["Check it on a phone speaker and in a car or earbuds before calling it done: it is the translation reference.", "Keep this session: the three flawed versions are made from it."],
   specs={**MIX3_SPEC, "Levels": "−14 LUFS integrated, ≤ −1 dBTP"},
   qc=["True peak ≤ −1 dBTP after a 48 → 44.1 kHz conversion.", "Vocal clear and on top on both studio monitors and a phone speaker."]),
  rec("MIX-03.2", "Flawed mix: HARSH (+4 dB high shelf at 3 kHz)", [("mixing_lab/mix03-ref-harsh.wav", "Harsh: +4 dB shelf at 3 kHz", "24.000 s", "Matched to clean", "rec")],
   context="One of the three flawed bounces on the check pages: the learner A/Bs it with the clean mix at the same loudness and names the fault.",
   teaches="Harshness: too much 3 kHz and above makes cymbals and S sounds hurt and the mix tiring, even at the same loudness. It is the most common translation failure on phone speakers and earbuds.",
   record="The clean mix with one extra high shelf on the stereo bus.",
   how=[MIX3_FROM, "Add a +4 dB high shelf at 3 kHz on the master bus, before the limiter.", "Loudness-match to the clean version within ±0.5 LU."],
   tips=["Bounce all four from one session so nothing else changes."],
   specs={**MIX3_SPEC, "Change": "+4 dB high shelf at 3 kHz"},
   qc=["Obviously harsh on both studio monitors and a phone speaker.", "Within ±0.5 LU of the clean mix."]),
  rec("MIX-03.3", "Flawed mix: MUDDY (low-mid build-up)", [("mixing_lab/mix03-ref-muddy.wav", "Muddy: low-mid build-up", "24.000 s", "Matched to clean", "rec")],
   context="The second flawed bounce: the learner hears a mix that is the same loudness but cloudy, and names the low-mids as the cause.",
   teaches="Mud: a build-up around 200–300 Hz blurs the kick, bass and guitar together and buries the vocal's clarity, without making anything louder.",
   record="The clean mix with one wide low-mid boost on the stereo bus.",
   how=[MIX3_FROM, "Suggested: +4 dB wide bell, Q about 0.7, at 250 Hz on the master bus, before the limiter.", "Loudness-match to the clean version within ±0.5 LU."],
   tips=["If the suggested boost is not obvious on a phone, raise it to +5 dB and note the setting."],
   specs={**MIX3_SPEC, "Change": "≈ +4 dB bell at 250 Hz, Q ≈ 0.7"},
   qc=["Audibly cloudy; kick and bass less defined than the clean mix.", "Within ±0.5 LU of the clean mix."]),
  rec("MIX-03.4", "Flawed mix: OVER-COMPRESSED (pumping)", [("mixing_lab/mix03-ref-overcompressed.wav", "Over-compressed: pumping, flattened", "24.000 s", "Matched to clean", "rec")],
   context="The third flawed bounce: matched in loudness, so the learner judges the squashed dynamics and pumping, not the level.",
   teaches="Over-compression flattens the drums' attack, makes the mix pump with the kick, and kills the verse-to-chorus lift. At matched loudness it sounds smaller, not bigger.",
   record="The clean mix through heavy bus compression.",
   how=[MIX3_FROM, "Suggested: heavy bus compression, fast attack and release, audible pumping; push it until the crest factor is about 6 dB.", "Loudness-match to the clean version within ±0.5 LU."],
   tips=["Measure the crest factor (peak minus RMS) and write it in the sidecar next to the clean mix's value."],
   specs={**MIX3_SPEC, "Change": "Heavy fast bus compression; crest factor ≈ 6 dB"},
   qc=["Pumping audible with each kick; snare loses its crack.", "Within ±0.5 LU of the clean mix."]),
 ])

MST1_SPEC = {"Channels": "Stereo", "Length": "24.000 s (within the md's 24–30 s), loopable on bars, same cut as MIX-01",
             "Set": "Not matched — the level difference is part of Module 8", "Conversion": "Must play cleanly after a 48 → 44.1 kHz conversion"}
item(id="MST-01", title="Real unmastered mix, plus a bus-limited version", pri="P1", sess=[3], group=G,
 used="The Mastering lab rack: the learner applies tilt EQ, a limiter, width and matched-level A/B to a stereo programme. Today it plays the same synthesized groove as the Mixing labs. Module 8 also asks the learner to request a “bus-limiter-off” mix — this pair is exactly that.",
 safety=[], reuse="FX-05 (Stereo Imaging), EQ-02 programme, AMP-01 programme, RD-01 music, MTR-01 music, Spectrogram music scene.", see=["MIX-01", "MIX-03", "MST-02"],
 usedin="Mastering lab › rack playback and Module 8 project (src/screens/lab/mastering/)",
 recs=[
  rec("MST-01.1", "Unmastered mix — no bus processing", [("mastering_lab/mst01-mix-unmastered.wav", "(a) No bus processing", "24.000 s", "≈ −19 LUFS, PLR ≈ 15", "rec")],
   context="The programme that plays through the whole Mastering rack. The learner adds tilt EQ, limiting and width to it and A/Bs at matched level; it is also the “bus-limiter-off” mix Module 8 tells them to ask for.",
   teaches="What a mastering engineer wants to receive: a balanced mix with headroom and intact transients, so small tilt EQ moves and the limiter's effect on the drums are clearly audible.",
   record="A balanced stereo mix of the MIX-01 song with no processing on the stereo bus.",
   how=["Mix MIX-01 (with the MIX-02 mics) to a balanced, finished-sounding mix. Channel processing is fine; the stereo bus has NOTHING on it (no EQ, compressor or limiter).",
        "Set the master fader so the sample peak is about −4 dBFS; that gives about −19 LUFS integrated and a peak-to-loudness ratio (PLR) of about 15 dB.",
        "Bounce the same 24.000 s loop as MIX-01."],
   tips=["Print MST-01.2 from this exact session straight afterwards, so the limiter is the only difference.",
         "After bouncing, convert a test copy to 44.1 kHz with a high-quality converter and check it does not clip; discard the test copy."],
   specs={**MST1_SPEC, "Levels": "≈ −4 dBFS sample peak, ≈ −19 LUFS integrated, PLR ≈ 15 dB"},
   qc=["Drum transients intact: crest factor clearly higher than MST-01.2.", "Loops seamlessly.", "Plays cleanly after a 44.1 kHz conversion."]),
  rec("MST-01.2", "Bus-limited mix — same mix through a limiter", [("mastering_lab/mst01-mix-buslimited.wav", "(b) Bus-limited", "24.000 s", "−0.1 dBTP, ≈ −12.6 LUFS", "rec")],
   context="The version a mix engineer often sends by mistake. In Module 8 the learner compares it with MST-01.1 and learns why a mastering engineer asks for the mix with the bus limiter off.",
   teaches="A bus limiter already used up the headroom: it is louder (≈ −12.6 vs ≈ −19 LUFS) but the transients are flattened, so the mastering limiter has nothing left to work with. At matched loudness it sounds smaller than the unmastered mix.",
   record="The MST-01.1 mix with a limiter on the stereo bus.",
   how=["Open the MST-01.1 session. Add one true-peak limiter on the stereo bus, ceiling −0.1 dBTP, input driven until the integrated loudness is about −12.6 LUFS.",
        "Change nothing else. Bounce the same 24.000 s loop."],
   tips=["Write the limiter model and settings in the sidecar.", "Check the 44.1 kHz test copy for inter-sample overs; adjust the ceiling only if it clips, and note it."],
   specs={**MST1_SPEC, "Levels": "−0.1 dBTP, ≈ −12.6 LUFS", "Exception": "Peaks at −0.1 dBTP on purpose (see Safety)"},
   qc=["True peak never exceeds −0.1 dBTP, including after the 44.1 kHz conversion.", "Clearly lower crest factor than MST-01.1.", "Loops seamlessly."]),
 ])

EP = [("night-signal", "Night Signal", "dense and bright", "≈ −12.6 LUFS, peaks near −0.4 dBTP",
       "Dense, bright arrangement, bus-limited close to full scale.",
       "A track that arrives already too limited: the master can only make it worse. The right move is little or nothing — or asking for a less-limited mix.",
       "The loudest and densest of the four."),
      ("tide-table", "Tide Table", "piano and voice ballad, wide dynamics", "≈ −19.8 LUFS, ≈ −6.1 dBTP",
       "Piano and voice only, wide dynamics, lots of headroom.",
       "A deliberately quiet track: in an album it should stay quieter than the others. Pushing it to the same LUFS as Night Signal would destroy it.",
       "Clearly the quietest and most dynamic of the four."),
      ("static-bloom", "Static Bloom", "vocal sits low in the LAST chorus only", "≈ −13.9 LUFS, ≈ −1.2 dBTP",
       "Good tone and level, but the vocal sits low in the final chorus only — the excerpt must include that chorus.",
       "A mix problem that mastering cannot fix: a vocal low in one section needs a mix revision, not EQ on the whole track.",
       "The vocal is clearly low only in the last chorus."),
      ("harbour-lights", "Harbour Lights", "slightly dull and narrow", "≈ −15.1 LUFS, ≈ −2.0 dBTP",
       "Balanced, but slightly dull and narrow next to the other three.",
       "A true mastering problem: a gentle high-shelf lift and a little width bring it in line with the rest of the EP.",
       "Audibly duller and narrower than the other three in a quick A/B.")]
MST2_SPEC = {"Channels": "Stereo", "Length": "30–45 s", "Set": "Not matched — the level differences are the lesson"}
_mst2 = []
_n = 0
for k, name, short, lv, char, lesson, check in EP:
    _n += 1
    v = f"“{name}” — {short}"
    _mst2.append(rec(f"MST-02.{_n}", f"“{name}” — full mix", [(f"mastering_lab/mst02-{k}-full.wav", v + " — full mix", "30–45 s", lv, "rec")],
        context=f"One of the four tracks in Module 8 <em>Putting it all together</em>. The learner reads its written problem, listens, and decides what (if anything) mastering should do. Character: {short}.",
        teaches=lesson,
        record=f"A 30–45 s excerpt of an original piece, “{name}”, mixed to its written character. {char}",
        how=["Write and record the piece with the session-3 band and singer; each EP track in a different key and tempo.",
             f"Mix to the character: {char}", f"Bounce the full mix at the written level: {lv}."]
            + (["Make sure the excerpt contains the final chorus where the vocal drops."] if k == "static-bloom" else []),
        tips=["Budget this as extra studio time: it is a small production in itself. It is P3 — do it after all P1/P2 items are delivered.",
              "Bounce the instrumental (next rec) from the same session immediately afterwards, with only the vocal muted."],
        specs={**MST2_SPEC, "Levels": lv} | ({"Exception": "Peaks near −0.4 dBTP on purpose"} if k == "night-signal" else {}),
        qc=[check, "Measured LUFS within about 1 LU of the written figure.", "Sounds like the same artist as the other three EP tracks."]))
    _n += 1
    _mst2.append(rec(f"MST-02.{_n}", f"“{name}” — instrumental", [(f"mastering_lab/mst02-{k}-instrumental.wav", v + " — instrumental", "30–45 s", "Same mix, vocal muted", "rec")],
        context=f"The instrumental of “{name}” in Module 8: the EP brief asks for instrumentals of everything for sync, and the delivery checklist has the learner check each instrumental against its vocal version (same length, same level). It is also the way to hear the bed without the voice.",
        teaches=("With the vocal gone, the learner can tell whether a problem lives in the vocal or in the bed. "
                 + ("Here it proves the bed is fine and only the last-chorus vocal level is wrong." if k == "static-bloom" else
                    "Here the bed carries the same character as the full mix, so the fix (if any) applies to both versions identically.")
                 + " An alternate version comes from the same session and is mastered identically."),
        record=f"The same “{name}” mix with the vocal muted.",
        how=["Open the full-mix session. Mute the lead and backing vocal tracks only; change nothing else (bus processing stays).", "Bounce the same excerpt, start and end sample identical to the full mix."],
        tips=["Bounce straight after the full mix so the two files line up sample for sample."],
        specs={**MST2_SPEC, "Levels": "Whatever the muted mix measures — do not re-level it"},
        qc=["Lines up sample for sample with the full mix (vocal-free null check).", "No vocal bleed audible (muted tracks really muted, reverb returns included)."]))
item(id="MST-02", title="The “Night Signal” EP — four contrasting excerpts", pri="P3", sess=[3], group=G,
 used="Mastering Module 8 <em>Putting it all together</em>: the learner triages a four-track EP, each track with a written problem (too limited, deliberately quiet, vocal low in one chorus, dull and narrow). Today the tracks exist only as text.",
 safety=[], reuse="None.", see=["MST-01"],
 usedin="Mastering lab › Module 8, Night Signal EP (src/screens/lab/mastering/masteringContent.ts)",
 recs=_mst2)

# ================================================================ MIC PRINCIPLES
G = "Mic Principles"

MPR1_RIG = ["Room: DRY booth (RT60 ≤ 0.3 s). Talker seated, head against a headrest marker so the mouth never moves. Mic at mouth height, capsule centre 30 cm from the lips at 0°.",
            "Tape a printed 360° protractor to the floor, centred under the capsule (use a plumb line). Rotate the MIC about the vertical axis through its capsule; the talker never turns.",
            "Mic: a C414-class multi-pattern LDC. If it has no named supercardioid, use the position between cardioid and hypercardioid and say so in the sidecar.",
            "Reference mic: any cardioid at 30 cm on-axis on a spare channel, never moved, never delivered. It shows how loud the talker was on each take.",
            "Gain: set ONCE, on omni at 0° (this take), so S1 peaks around −6 dBFS. Tape the knob. Never touch it for all 27 positions.",
            "Two takes of S1 per position, slated (“pattern omni, zero degrees, take one”). Keep the take whose reference-mic level is closest to the omni-0° take (reject drift over 0.5 dB)."]
MPR1_MATCH = "MATCHED copy: loudness-match the kept take to the omni-0° take within ±0.5 LU, but never apply more than +20 dB; if it needs more, stop at +20 dB and note it."
MPR1_ORDER = "Order: one pattern at a time — 0°, 30°, 60°, 90°, (null), 180° — then change pattern; 20 s of room tone at the end of each pattern block."


def _mpr1_files(p, pn, a, null_label=None, note=""):
    out = []
    for st, stn in (("fixed", "FIXED-GAIN"), ("matched", "MATCHED copy")):
        lab = f"{null_label} · {stn}" if null_label else f"{pn} {a}° · {stn}"
        out.append((f"mic_principles/mpr01-{p}-{a:03d}-{st}.wav", lab, "6 s", note, "rec" if st == "fixed" else "edit"))
    return out


# (pattern key, pattern name, angle, theory dB vs 0° (a + b·cosθ), title tail, teaches, qc, extra how, tip, null_label, note)
MPR1 = [
 ("omni", "Omni", 0, "0 dB (reference)", "on-axis — the reference for the whole set",
  "The level and tone every other take in MPR-01 is judged against. An omni at 30 cm in a dry booth: natural, full, with no proximity boost.",
  ["S1 peaks around −6 dBFS (this take sets the gain).", "Full, natural tone; no plosive thumps at 30 cm."], None,
  "Record this first: it sets the gain for all 27 positions.", None, ""),
 ("omni", "Omni", 30, "≈ 0 dB", "30°",
  "An omni does not care about 30°: same level, same tone as 0°. This is what “omni” means — no rejection, so no penalty for a talker who moves.",
  ["Within about 0.5 dB of omni 0° (reference-corrected).", "No audible tone change against 0°."], None, None, None, ""),
 ("omni", "Omni", 60, "≈ 0 dB", "60°",
  "Still the same level. On a large-diaphragm omni the very top may soften slightly: the capsule is big enough to shade the highest frequencies arriving from the side.",
  ["Within about 1 dB of omni 0°.", "Tone nearly identical; at most a hint less air."], None, None, None, ""),
 ("omni", "Omni", 90, "≈ 0 dB (slight HF loss on an LDC)", "90°, side",
  "Side-on, an omni keeps its level but a large diaphragm starts to lose the top octave: omni at low frequencies, slightly directional at high frequencies. Compare with cardioid 90°, which also loses about 6 dB.",
  ["Within about 1–2 dB of omni 0°.", "Slightly softer above about 8 kHz than 0°; nowhere near as dull as cardioid 90°."], None, None, None, ""),
 ("omni", "Omni", 180, "≈ 0 dB (body shadow on the highs)", "180°, rear",
  "An omni has no null: the voice from behind is nearly as loud as from the front, only a little duller from the mic body's shadow. This is why an omni gives no protection from a monitor wedge behind it.",
  ["Clearly audible at nearly full level.", "A little duller than omni 0°, but not dramatically."], None, None, None, ""),
 ("cardioid", "Cardioid", 0, "0 dB (cardioid reference)", "on-axis",
  "The cardioid's front reference. Against omni 0° at the same distance it hears less room and a touch more low end (mild proximity effect even at 30 cm).",
  ["Slightly drier than omni 0° in an A/B.", "Natural tone, no boom."], "Switch the mic to cardioid; let it settle a few seconds after the pattern change.", "Batch all cardioid angles before changing pattern.", None, ""),
 ("cardioid", "Cardioid", 30, "≈ −0.6 dB", "30°",
  "Inside the cardioid's forgiving front: almost no level change and very little tone change. A singer can move a little without the sound changing.",
  ["Nearly identical to cardioid 0°; at most a hair less top."], None, None, None, ""),
 ("cardioid", "Cardioid", 60, "≈ −2.5 dB", "60°",
  "The edge of the forgiving zone: a couple of dB down, and the highs start to fall faster than the lows. Off-axis is not only quieter, it is duller.",
  ["A little quieter and a little darker than cardioid 0°.", "In the MATCHED copy, the darker tone is still audible."], None, None, None, ""),
 ("cardioid", "Cardioid", 90, "≈ −6 dB", "90°, side pickup",
  "Side pickup at half sensitivity: about 6 dB down and clearly duller, with more room relative to the voice. This is the sound of a talker turned away from the mic.",
  ["About 6 dB below cardioid 0° (reference-corrected).", "In the MATCHED copy, clearly darker than 0°."], None, None, None, ""),
 ("cardioid", "Cardioid", 180, "null (deepest rejection)", "180°, the null",
  "The cardioid null: the voice drops to mostly room reflections and is much duller. This is the direction a stage monitor goes, and the reason cardioid is the live-vocal standard.",
  ["The quietest cardioid take, much duller than 0°.", "The voice is still faintly audible (room reflections) — it never vanishes completely."],
  "Before recording, confirm with pink noise from the talker position that the deepest dip really is at 180° on this mic; note any offset.", None, None, "Null take"),
 ("super", "Supercardioid", 0, "0 dB (super reference)", "on-axis",
  "The supercardioid's front reference: a little tighter than cardioid, so a little less room than cardioid 0° at the same distance.",
  ["Slightly drier than cardioid 0°."], "Set the pattern switch to supercardioid (or the position between cardioid and hyper — note which).", None, None, ""),
 ("super", "Supercardioid", 30, "≈ −0.8 dB", "30°",
  "Still inside the front pickup: a fraction of a dB more loss than cardioid at 30°. The narrower pattern hardly shows yet.",
  ["Nearly identical to super 0°."], None, None, None, ""),
 ("super", "Supercardioid", 60, "≈ −3.3 dB", "60°",
  "The narrower front starts to show: about a dB more loss than cardioid at 60°, and duller.",
  ["Quieter than super 0° and a touch darker; slightly quieter than cardioid 60°."], None, None, None, ""),
 ("super", "Supercardioid", 90, "≈ −8.6 dB", "90°, side",
  "Better side rejection than cardioid (≈ −8.6 vs ≈ −6 dB): the reason supercardioids are used on loud stages with sources beside the singer.",
  ["Clearly quieter than cardioid 90° (about 2–3 dB).", "Dull, roomy side sound."], None, None, None, ""),
 ("super", "Supercardioid", 127, "null (≈127° in theory — use the measured angle)", "the null, ≈127°",
  "The supercardioid's null is NOT at the back: it sits at about 127°. Monitors for a super should be aimed at the null, not directly behind the mic.",
  ["Quieter than super 180° (the rear lobe is louder than the null).", "The measured null angle is written in the sidecar."],
  "Before recording, play pink noise from a small speaker at the talker's mouth position, rotate the mic to the deepest dip and record at that MEASURED angle (theory ≈127°).",
  "The file name keeps 127 even if the measured null differs; the true angle goes in the sidecar.", "Supercardioid null (≈127°, use measured)", "Null take; write the measured angle in the sidecar"),
 ("super", "Supercardioid", 180, "≈ −11.7 dB (rear lobe)", "180°, rear lobe",
  "Directly behind a supercardioid there is a small rear lobe: the voice comes back up compared with the null. Pointing a monitor straight at the back of a super is a mistake.",
  ["Louder than the 127° null take; much quieter than super 0°.", "Dull, but clearly audible."], None, None, None, ""),
 ("hyper", "Hypercardioid", 0, "0 dB (hyper reference)", "on-axis",
  "The hypercardioid's front reference: the tightest of the cardioid family, with the least room at 0°.",
  ["Drier than cardioid 0°."], "Set the pattern switch to hypercardioid.", None, None, ""),
 ("hyper", "Hypercardioid", 30, "≈ −0.9 dB", "30°",
  "Still in the front pickup: about 1 dB down, little tone change.",
  ["Close to hyper 0°."], None, None, None, ""),
 ("hyper", "Hypercardioid", 60, "≈ −4.1 dB", "60°",
  "The narrowest front of the family shows here: about 4 dB down already, and darker. A singer who drifts loses level quickly on a hyper.",
  ["Noticeably quieter than hyper 0°; quieter than cardioid 60° and super 60°."], None, None, None, ""),
 ("hyper", "Hypercardioid", 90, "≈ −12 dB", "90°, side",
  "The best side rejection of the cardioid family (≈ −12 dB): sources beside the mic are pushed well down.",
  ["The quietest 90° take of cardioid, super and hyper.", "Thin, distant side sound."], None, None, None, ""),
 ("hyper", "Hypercardioid", 110, "null (≈110° in theory — use the measured angle)", "the null, ≈110°",
  "The hypercardioid's null is at about 110°, even further forward than the super's. Monitors for a hyper go to the side-rear, never directly behind.",
  ["Quieter than hyper 180° (the rear lobe is clearly louder).", "The measured null angle is written in the sidecar."],
  "Find the real null with pink noise from the talker position, as for the super; record at the MEASURED angle (theory ≈110°).",
  "The file name keeps 110 even if the measured null differs; the true angle goes in the sidecar.", "Hypercardioid null (≈110°, use measured)", "Null take; write the measured angle in the sidecar"),
 ("hyper", "Hypercardioid", 180, "≈ −6 dB (rear lobe)", "180°, rear lobe",
  "A bigger rear lobe than the super: the voice from directly behind is only about 6 dB down. Maximum side rejection is paid for with a weaker back.",
  ["Clearly louder than the 110° null and louder than super 180°."], None, None, None, ""),
 ("fig8", "Figure-8", 0, "0 dB (front lobe)", "on-axis, front lobe",
  "The figure-8's front lobe: full level and a tight front. Figure-8 has the strongest proximity effect of any pattern up close; at 30 cm it adds only a little warmth.",
  ["Full level, natural tone; slightly warmer than omni 0°."], "Set the pattern switch to figure-8.", None, None, ""),
 ("fig8", "Figure-8", 30, "≈ −1.25 dB", "30°",
  "Figure-8 narrows faster than cardioid: already more than 1 dB down at 30°.",
  ["Slightly quieter than fig-8 0°."], None, None, None, ""),
 ("fig8", "Figure-8", 60, "≈ −6 dB", "60°",
  "At 60° a figure-8 is already at half sensitivity (≈ −6 dB), where a cardioid is only ≈ −2.5 dB. The front lobe is narrow.",
  ["About as quiet as cardioid 90°; darker than fig-8 0°."], None, None, None, ""),
 ("fig8", "Figure-8", 90, "null (deepest, most reliable null)", "90°, side null",
  "The figure-8's side null is the deepest and most reliable null of any pattern: it is what makes the side mic of M/S and Blumlein pairs work, and how a ribbon rejects a source beside it.",
  ["The quietest figure-8 take, and the quietest take of the whole set.", "Voice reduced to faint room reflections."],
  "Confirm the null with pink noise from the talker position; it should sit at 90° on a good capsule. Note any offset.", None, None, "Null take"),
 ("fig8", "Figure-8", 180, "≈ 0 dB (rear lobe, polarity inverted)", "180°, rear lobe",
  "The back of a figure-8 is as sensitive as the front, with opposite polarity. By ear alone it sounds about the same as 0° — the polarity flip matters only when it is mixed with another mic.",
  ["Within about 1–2 dB of fig-8 0° (rear lobe) — not a null.", "Tone close to 0°; a multi-pattern LDC may be a touch darker from the back."], None, None, None, ""),
]

_mpr1 = []
for i, (p, pn, a, th, tt, teach, qc, xhow, xtip, nlab, note) in enumerate(MPR1, 1):
    first = i == 1
    howl = (MPR1_RIG + [MPR1_ORDER]) if first else [f"Same rig, talker position and taped gain as MPR-01.1. Pattern: {pn.lower()}. Rotate the mic about its capsule to {a}° on the floor protractor."]
    if xhow and not first:
        howl.append(xhow)
    howl.append(MPR1_MATCH)
    tips = [xtip] if xtip else []
    if first:
        tips += ["Rotate the mic, not the talker: a mouth is directional too, so turning the head would change the sound for the wrong reason.",
                 "Batch all angles before changing pattern — pattern switching on some LDCs needs a few seconds to settle."]
    else:
        tips.append("Watch the reference mic: if the talker drifts more than 0.5 dB from the omni-0° take, take it again.")
    ctx = (f"Plays on Mic Principles › <em>Pickup Patterns</em> / <em>Off-Axis Response</em> when PATTERN = {pn.upper()} and the source sits at {tt}"
           + (" (a preset ANGLE chip)." if a in (0, 30, 60, 90, 180) else " (between the ANGLE chips — reached by dragging the source around the polar plot).")
           + " The learner compares it with the other angles of the same pattern; the MATCHED copy lets them hear the tone change with the level difference removed.")
    _mpr1.append(rec(f"MPR-01.{i}", f"{pn} — {tt}", _mpr1_files(p, pn, a, nlab, note),
        context=ctx,
        teaches=f"{teach} Theory for this position: {th}.",
        record=f"S1 spoken by the house adult male voice; multi-pattern LDC on {pn.lower()}, mic rotated to {a}° from the mouth at 30 cm.",
        how=howl, tips=tips,
        specs={"Channels": "Mono", "Length": "6 s (S1 plus natural tail, 0.5 s room tone at each end)", "Type": "One-shot phrase",
               "Pattern / angle": f"{pn}, {a}°" + (" (use the measured null)" if nlab else ""),
               "Levels": "FIXED-GAIN from omni 0° (peaks ≈ −6 dBFS there); expected " + th,
               "Set": "FIXED-GAIN original + MATCHED copy (±0.5 LU to omni 0°, max +20 dB)", "Room": "DRY, RT60 ≤ 0.3 s", "Distance": "30 cm, mouth height"},
        qc=qc + ["Reference-mic level within 0.5 dB of the omni-0° take."]))

item(id="MPR-01", title="Pickup patterns and off-axis response", pri="P1", sess=[1], group=G,
 used="Mic Principles › <em>Pickup Patterns</em> and <em>Off-Axis Response</em>. The learner picks a pattern (omni, cardioid, super, hyper, figure-8) and drags a source around the mic, or sweeps an ANGLE fader 0–180° with preset chips at 0°, 30°, 60°, 90° and 180°. The polar plot and readouts move. Today the page is silent.",
 safety=["SAFE-3 for phantom power when changing mics (switch phantom off before plugging)."],
 reuse="Speech off-axis (SPC-04 records its own take — see there), Mic Selection, Spectrogram demo.",
 see=["MPR-03", "SPC-04", "MSL-01"],
 usedin="Mic Principles › Pickup Patterns, Off-Axis Response (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr1)

# ---- MPR-02 distance
DIST2 = {4: ("0 dB", "90%", "The reference: the direct voice dominates (about 90% of what the mic hears in the app's model). Close, intimate and dry, even in a live room."),
         6: ("≈ −3.5 dB", "80%", "Still mostly direct sound: the usual handheld or podcast working distance. A little quieter; the room barely noticeable."),
         12: ("≈ −9.5 dB", "50%", "About the critical distance in the app's model: direct and room sound are roughly equal. The voice starts to sound like it is in a room."),
         24: ("≈ −15.6 dB", "20%", "The room has taken over: the voice sounds distant and hollow, and turning the gain up only brings up more room."),
         48: ("≈ −21.6 dB", "6%", "Mostly room: the voice is far away, smeared by reflections, and the room's noise floor becomes part of the sound.")}
MIC2 = {"dyn": ("cardioid dynamic (SM58 class)", "cardioid dynamic", "The cardioid rejects some of the room from behind, so it stays drier than the omni at the same distance.",
                "At 4–6 in the dynamic also adds proximity warmth that the omni does not."),
        "omni": ("omni", "omni", "The omni hears the room from every direction, so at the same distance it always sounds roomier than the cardioid.",
                 "No proximity effect: the tone up close is the same as far away; only the room balance changes.")}
_mpr2 = []
_n = 0
for v in ("male", "female"):
    for m in ("dyn", "omni"):
        mn, mshort, mteach, mextra = MIC2[m]
        for d in (4, 6, 12, 24, 48):
            _n += 1
            rel, direct, dteach = DIST2[d]
            first = _n == 1
            if first:
                howl = ["Room: an untreated medium room, RT60 about 0.6–0.8 s (NOT the booth). Talker standing in the middle of the room, away from walls.",
                        "Mount the cardioid dynamic and the omni side by side on one stand bar, capsules touching; both record at once.",
                        "Mark 4, 6, 12, 24 and 48 in on the floor with tape, measured mouth to capsule.",
                        "Set each preamp's gain once at 4 in so S1 peaks around −6 dBFS. Tape the knobs. Do not touch them for any distance or for the second voice.",
                        "Use a fixed reference mic (as in MPR-01) to keep the talker's voice level steady; redo any take that drifts more than 0.5 dB."]
            else:
                howl = [f"Same room, stand bar and taped gains as MPR-02.1; stand moved to the {d} in mark. The talker stays put and keeps the same voice level.",
                        f"This is the {mshort} channel of the side-by-side pair: it comes from the same performance as the other mic's {d} in take."]
            if v == "female" and d == 4:
                howl.append("Female voice: same stand marks and the same taped gains as the male set — do not re-gain, so the two voices stay comparable.")
            if d == 48:
                howl.append("Record 20 s of room tone at the 48 in position (once per voice).")
            qc = ["S1 peaks around −6 dBFS; no plosive pops."] if d == 4 else [f"About {rel.replace('≈ −', '')} below the 4 in take of the same mic and voice (roughly 6 dB per doubling)."]
            if d == 12:
                qc.append("From 6 to 12 in the level falls by roughly 5–6 dB.")
            if d >= 24:
                qc.append("Room clearly audible; " + ("the omni sounds roomier than the dynamic at this mark." if m == "omni" else "still drier than the omni at this mark."))
            if d == 48:
                qc.append("The quietest take of its set; not normalised.")
            _mpr2.append(rec(f"MPR-02.{_n}", f"{v.title()} voice · {mshort} · {d} in",
                [(f"mic_principles/mpr02-{v}-{m}-{d:02d}in.wav", f"{v.title()} · {'cardioid dynamic' if m == 'dyn' else 'omni'} · {d} in", "6 s", "FIXED-GAIN", "rec")],
                context=(f"Mic Principles › <em>Distance and the Room</em> with the DISTANCE fader at {d} in (readouts: LEVEL {rel} rel 4 in, DIRECT {direct}). "
                         f"This is the {v} voice on the {mshort}; the other voice and the other mic at the same mark give the page a second voice and a second pickup pattern at the same distance."),
                teaches=f"{dteach} {mteach}" + (f" {mextra}" if (m == "dyn" and d <= 6) or (m == "omni" and d == 4) else ""),
                record=f"S1 by the {v} voice on the {mn}, mouth to capsule {d} in, untreated medium room.",
                how=howl,
                tips=(["Capture both mics in one performance — halves the session and guarantees the same delivery.",
                       "Do the female voice straight after the male without moving the stand marks."] if first else
                      ["Never normalise: the level drop from 4 in is the lesson."]),
                specs={"Channels": "Mono", "Length": "6 s", "Levels": f"FIXED-GAIN from the 4 in setting; expected {rel} vs 4 in; noise floor ≤ −60 dBFS",
                       "Set": "FIXED-GAIN — never normalise", "Room": "Untreated medium room, RT60 0.6–0.8 s", "Distance": f"{d} in mouth to capsule"},
                qc=qc))

item(id="MPR-02", title="Distance and the room", pri="P1", sess=[2], group=G,
 used="Mic Principles › <em>Distance &amp; the Room</em>. The learner drags a DISTANCE fader from 4 to 48 inches; readouts show level relative to 4 in and the percentage of direct sound. Today it is silent.",
 safety=[], reuse="Speech › The Distance Effect (context), Wave reverb, Gain lab.", see=["SPC-04", "MPR-01"],
 usedin="Mic Principles › Distance & the Room (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr2)

# ---- MPR-03 proximity
PROX = {1: "+10 dB", 2: "≈ +8.8 dB", 4: "≈ +6.4 dB", 8: "≈ +2.4 dB", 12: "no boost"}
SRC3 = {"s1": ("S1 spoken, low male", "S1 spoken by the low male voice",
               "On speech the boost shows as chest and boom under the words, and it makes the plosives heavier."),
        "sung-a2": ("Sung A2 (110 Hz), low male", "A sung A2 (110 Hz) held on “ah” for 4 s by the same low male singer",
                    "A steady 110 Hz note puts the fundamental right inside the proximity region, so the boost is easiest to hear and to see on an analyser.")}
_mpr3 = []
_n = 0
for src in ("s1", "sung-a2"):
    sn, srec, steach = SRC3[src]
    for m, mn in (("dyn", "cardioid dynamic"), ("omni", "true omni")):
        for d in (1, 2, 4, 8, 12):
            _n += 1
            first = _n == 1
            files = [(f"mic_principles/mpr03-{src}-{m}-{d:02d}in-{st}.wav", f"{sn} · {mn} · {d} in · {stn}", "6 s", "", "rec" if st == "fixed" else "edit")
                     for st, stn in (("fixed", "FIXED-GAIN"), ("matched", "MATCHED copy"))]
            if m == "dyn":
                if d == 12:
                    t = "The cardioid reference with no proximity boost: the natural low end of this voice. Every other cardioid distance is compared with it."
                elif d == 1:
                    t = "Maximum proximity effect: the cardioid's low end is boosted by about 10 dB. Even loudness-matched it is much fuller and boomier than at 12 in — a tone change, not just a level change."
                else:
                    t = f"Proximity effect building as the cardioid moves in: about {PROX[d]} of low-shelf lift against 12 in (app model). The closer, the bassier."
            else:
                if d == 12:
                    t = "The omni reference at 12 in. Every omni distance is compared with it, and none of them gets bassier."
                elif d == 1:
                    t = "An omni at 1 in: much LOUDER than at 12 in, but in the MATCHED copy the tone is the same. A pressure mic has no gradient, so no proximity effect — the app's readout says FLAT."
                else:
                    t = f"An omni at {d} in: louder than at 12 in but the same tonal balance. Compare with the cardioid at {d} in ({PROX[d]})."
            if first:
                howl = ["Room: DRY booth. Talker seated, head on a headrest marker; mic on a stand at mouth height, on-axis.",
                        "Mics: a cardioid dynamic and a TRUE pressure omni (not a multi-pattern LDC on omni — its two-diaphragm omni can still show some proximity).",
                        "Gain: set on each mic at 1 in so the loudest plosive peaks no higher than −3 dBFS. Tape the knob.",
                        "Record 12 → 8 → 4 → 2 → 1 in on the cardioid, then switch mics and repeat. Measure lips to grille with a ruler every time."]
            else:
                howl = [f"Same booth, headrest and taped {mn} gain as MPR-03.1. Ruler-measure {d} in from lips to grille, on-axis."]
            if src == "sung-a2":
                howl.append("Give the singer A2 (110 Hz) from a tuner drone in one headphone ear; hold “ah” for 4 s, steady, no vibrato.")
            howl.append("MATCHED copy: loudness-match to the 12 in take of the same mic and source within ±0.5 LU.")
            tips = []
            if d <= 2:
                tips.append("Plosives will be strong this close: keep them (they are real); if a take clips, redo it at the same gain with a slightly softer P.")
            if first:
                tips.append("The MATCHED copies are what let learners hear that “bassier” is not just “louder”.")
            tips.append("Record the whole distance ladder for one mic and source in one run, without touching the stand height.")
            qc = []
            if m == "dyn" and d < 12:
                qc.append(f"Fuller in the lows than the cardioid 12 in take, and still fuller in the MATCHED copy (app model: {PROX[d]}).")
            if m == "omni" and d < 12:
                qc.append("The MATCHED copy sounds the same in tone as the omni 12 in take — no extra bass.")
            if d == 12:
                qc.append("No boom: the voice's natural low end.")
            if d == 1:
                qc.append("Loudest plosive peaks ≤ −3 dBFS; no clipping.")
            if src == "sung-a2":
                qc.append("The A2 is steady in pitch (within ±10 cents).")
            _mpr3.append(rec(f"MPR-03.{_n}", f"{sn.split(',')[0]} · {mn} · {d} in", files,
                context=(f"Mic Principles › <em>Proximity Effect</em> with DISTANCE = {d} in and MIC = {'CARDIOID' if m == 'dyn' else 'OMNI'} "
                         f"(readout: {PROX[d] if m == 'dyn' else 'FLAT'}). The learner steps from 12 in down to 1 in and flips between the two mics; "
                         + ("the sung-note version makes the low-end change easiest to hear." if src == "sung-a2" else "the spoken version shows it on a natural voice.")),
                teaches=f"{t} {steach}",
                record=f"{srec}, on the {mn}, {d} in from lips to grille.",
                how=howl, tips=tips,
                specs={"Channels": "Mono", "Length": "6 s", "Levels": "FIXED-GAIN from the 1 in setting (loudest plosive ≤ −3 dBFS there)",
                       "Set": "FIXED-GAIN original + MATCHED copy (±0.5 LU to the 12 in take of the same mic and source)", "Room": "DRY", "Distance": f"{d} in, on-axis"},
                qc=qc))

item(id="MPR-03", title="Proximity effect — cardioid versus omni", pri="P1", sess=[1], group=G,
 used="Mic Principles › <em>Proximity Effect</em>. The learner drags DISTANCE from 12 in down to 1 in and switches MIC between CARDIOID and OMNI; the readout shows the low-shelf boost (up to about +10 dB at 1–2 in on cardioid; none on omni). Today it is silent.",
 safety=[], reuse="Speech › proximity question context, Mic Selection.", see=["MPR-01", "MPR-04a"],
 usedin="Mic Principles › Proximity Effect (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr3)

# ---- MPR-04a plosives
PLOS_LINE = "“Peter's best microphone sits six inches from the speaker — simple, steady, and clear.” followed by “Bob bought a big blue bass.”"
PLOS_SPEC = {"Channels": "Mono", "Length": "≈ 8 s (both lines, one take)", "Levels": "Worst plosive ≤ −3 dBFS on the NONE take of the same mic",
             "Set": "FIXED-GAIN per mic (gain set on that mic's NONE take)", "Room": "DRY booth", "Distance": "Mouth 2–3 in from the grille, on-axis"}
PLOS_BASE = "DRY booth. Talker standing or seated, mouth 2–3 in from the grille, on-axis, at mouth height. One take contains both lines; same energy on every P and B."
_p4 = [
 ("ldc", "none", "LDC · no protection", "Large-diaphragm condenser — no protection",
  "The light condenser diaphragm takes the full air blast: the P and B in both lines arrive as huge slow low-frequency thumps, far bigger than the words. This is the 100% case on the tray.",
  ["NO filter, no foam. Set the gain HERE so the worst pop peaks at −3 dBFS; tape it and keep it for the LDC pop-filter and foam takes.",
   "Record this one LAST for the LDC (see tips), but set the gain on a trial run of it first."],
  ["Record the NONE take last for each mic — a bad pop can momentarily overload a condenser capsule; get the protected takes in the can first.",
   "Watch the waveform: a real plosive shows one slow, huge low-frequency swing. That is what you are capturing."],
  ["Clear low thumps on every P and B; no digital clipping.", "Thumps clearly bigger than on the dynamic NONE take."], "NONE"),
 ("ldc", "popfilter", "LDC · pop filter", "Large-diaphragm condenser — pop filter",
  "The mesh breaks up the air burst before it reaches the capsule; the voice passes untouched. The thumps disappear and the consonants stay crisp (the app reads about 30% of the blast getting through).",
  ["Standard 6 in fabric or metal-mesh pop filter, 2 in in front of the grille. The mouth stays where it was for the NONE take, so the filter sits between mouth and grille, about 1 in from the lips (use the 3 in end of the range for all three takes so the filter fits).",
   "Same taped gain as the LDC NONE take."],
  ["Check the filter is centred on the capsule, not on the mic body."],
  ["Thumps gone or nearly gone; consonants still crisp.", "Tone the same as the NONE take apart from the thumps."], "POP FILTER"),
 ("ldc", "foam", "LDC · foam", "Large-diaphragm condenser — foam windscreen",
  "Foam over the grille softens the blast (about 50% gets through in the app) but also takes a little off the top — the trade-off against a pop filter.",
  ["The manufacturer's foam windscreen for this LDC, fitted snugly.", "Same mouth position and taped gain as the LDC NONE take."],
  ["Use a clean, dry foam; a damp, used foam is duller than a new one."],
  ["Thumps reduced, but more left than with the pop filter.", "Slight top-end loss audible against the pop-filter take."], "FOAM"),
 ("dyn", "none", "Dynamic · no protection", "Handheld dynamic — no protection",
  "A handheld dynamic has a ball grille and an internal pop pad, so it pops less than the LDC — but at 2–3 in P and B still thump. This is the live-stage reality for a singer who eats the mic.",
  ["Handheld cardioid dynamic (SM58 class) on a stand, mouth 2–3 in from the grille ball.",
   "NO extra foam. Set the gain HERE so the worst pop peaks at −3 dBFS; tape it for the dynamic's other two takes."],
  ["Record it last for the dynamic, after the pop-filter and foam takes."],
  ["Low thumps on P and B, smaller than on the LDC NONE take; no clipping."], "NONE"),
 ("dyn", "popfilter", "Dynamic · pop filter", "Handheld dynamic — pop filter",
  "A pop filter in front of a dynamic: the thumps go, the voice stays. It shows the filter works the same way on any mic — it stops wind, not sound.",
  ["Pop filter 2 in in front of the grille ball; mouth where it was for the NONE take.", "Same taped gain as the dynamic NONE take."],
  ["Same filter as the LDC takes, so only the mic changes."],
  ["Thumps gone or nearly gone; consonants unchanged."], "POP FILTER"),
 ("dyn", "foam", "Dynamic · foam", "Handheld dynamic — foam windscreen",
  "The coloured foam ball you see on stage mics: on a dynamic it cuts the remaining blast with only a small top-end cost, because the dynamic is already less airy than a condenser.",
  ["The manufacturer's foam ball for this mic.", "Same mouth position and taped gain as the dynamic NONE take."],
  ["A brand-new foam is the cleanest comparison; note the model."],
  ["Thumps reduced; slight dulling against the pop-filter take, less obvious than on the LDC."], "FOAM"),
]
_mpr4a = []
for i, (m, b, var, title, teach, howx, tips, qc, tray) in enumerate(_p4, 1):
    _mpr4a.append(rec(f"MPR-04a.{i}", title, [(f"mic_principles/mpr04-plosive-{m}-{b}.wav", var, "8 s", "", "rec")],
        context=f"Mic Principles › <em>Plosives and Wind</em> with the BARRIER tray on {tray}"
                + (" (readout: 100% of the blast reaches the capsule)." if tray == "NONE" else " (readout: 30%)." if tray == "POP FILTER" else " (readout: 50%).")
                + f" This is the {'large-diaphragm condenser' if m == 'ldc' else 'handheld dynamic'} version; the learner compares it with the other two barriers on the same mic.",
        teaches=teach, record=f"The plosive lines {PLOS_LINE}, spoken at 2–3 in on the {'LDC' if m == 'ldc' else 'handheld dynamic'}, {tray.lower()}.",
        how=[PLOS_BASE] + howx + ["Slate each take with the mic and barrier."], tips=tips, specs={**PLOS_SPEC, "Barrier": tray}, qc=qc))

item(id="MPR-04a", title="Plosives: no protection, pop filter, foam", pri="P1", sess=[1], group=G,
 used="Mic Principles › <em>Plosives &amp; Wind</em>. A BARRIER tray offers NONE, POP FILTER, FOAM and SHOTGUN WINDSHIELD; a readout shows how much of the blast reaches the capsule (100% / 30% / 50% / 12%). This item covers the indoor plosive part (NONE, POP FILTER, FOAM). Today it is silent.",
 safety=[], reuse="Speech › Why Pop Filters Work, EQ high-pass context.", see=["MPR-04b", "SPC-04", "PROD-02"],
 usedin="Mic Principles › Plosives & Wind (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr4a)

# ---- MPR-04b wind
WIND_SPEC = {"Channels": "Mono", "Length": "Delivered: 12 s (4 s wind, then S1 ×2); keep the full takes", "Levels": "Wind peaks ≤ −3 dBFS on the BARE take",
             "Set": "FIXED-GAIN (set on the bare take)", "Conditions": "Breeze 10–20 km/h, logged per take"}
WIND_BASE = ["Open outdoor spot with a steady 10–20 km/h breeze (handheld anemometer; log the reading for every take). Avoid traffic.",
             "Shotgun on a stand at 1.5 m height, side-on to the wind. Talker 60 cm in front, on-axis.",
             "Each take: 20 s of wind alone (talker silent), then S1 twice. Deliver 4 s of wind plus both S1 lines; keep the full take."]
_w = [
 ("bare", "Shotgun, bare", "Log wind speed", "Shotgun — bare (no wind protection)",
  "Wind is moving air, not sound: on a bare mic it arrives as a loud, irregular low rumble that masks the voice. This is the problem the other three states solve.",
  "No protection at all. Set the gain HERE so wind peaks reach −3 dBFS; tape it for the other three states.",
  ["Its 20 s of wind-only is also the Noise Lab wind loop (NOI-01a) — mark it in your notes and keep the full take.",
   "Shoot all four states back-to-back within a few minutes so the wind is comparable; repeat the cycle twice and keep the cycle with the steadiest readings."],
  ["The wind rumble dominates; speech partly masked.", "No digital clipping in the gusts."], "NONE (bare mic)"),
 ("foam", "Shotgun, foam", "", "Shotgun — foam windscreen",
  "Foam helps a little outdoors: the rumble drops but is still obvious in a breeze. Foam is a plosive tool more than a wind tool.",
  "The shotgun's slip-on foam. Same stand, talker position and taped gain as the bare take.",
  ["Keep the talker's level steady; the wind varies, the voice should not."],
  ["Rumble reduced but clearly present; speech easier to follow than bare."], "FOAM"),
 ("blimp", "Shotgun, blimp (basket)", "", "Shotgun — blimp (basket) without fur",
  "A basket holds a pocket of still air around the mic: most of the rumble goes. Without fur the basket itself still catches gusts.",
  "Full basket (blimp) without its fur cover. Same stand, talker position and taped gain.",
  ["Make sure the mic sits in the basket's suspension, not touching the cage."],
  ["Much less rumble than foam; occasional gust noise left."], "SHOTGUN WINDSHIELD (basket part)"),
 ("blimp-fur", "Shotgun, blimp + fur", "", "Shotgun — blimp plus fur",
  "The outdoor standard: basket plus fur. The fur breaks up the airflow before it reaches the basket, so the wind is almost gone and the voice is clear (the app's 12%).",
  "Basket with its fur cover on, fur brushed out (not matted). Same stand, talker position and taped gain.",
  ["Brush the fur out before the take; flattened fur works less well."],
  ["Wind almost gone; speech clear.", "Wind speed logged within about 3 km/h of the other three takes."], "SHOTGUN WINDSHIELD"),
]
_mpr4b = []
for i, (k, var, note, title, teach, howx, tips, qc, tray) in enumerate(_w, 1):
    _mpr4b.append(rec(f"MPR-04b.{i}", title, [(f"mic_principles/mpr04-wind-{k}.wav", var, "12 s", note, "rec")],
        context=f"Mic Principles › <em>Plosives and Wind</em>, the outdoor half, matching the {tray} option. The learner hears wind with no voice, then the same voice through it, and compares the four states of the same shotgun.",
        teaches=teach, record=f"Outdoors in a steady breeze: shotgun mic, {var.split(', ')[1]}; 20 s of wind alone, then a talker speaking S1 twice.",
        how=WIND_BASE + [howx], tips=tips, specs=WIND_SPEC, qc=qc))

item(id="MPR-04b", title="Wind on a shotgun: bare, foam, blimp, blimp plus fur", pri="P1", sess=[6], group=G,
 used="Mic Principles › <em>Plosives &amp; Wind</em>, the outdoor half: FOAM and SHOTGUN WINDSHIELD options (“a full basket creates still air around the mic — the outdoor standard”). Today it is silent.",
 safety=[], reuse="NOI-01a wind loop (edited from the bare take).", see=["MPR-04a", "NOI-01a"],
 usedin="Mic Principles › Plosives & Wind (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr4b)

# ---- MPR-05a handling
HAND_SPEC = {"Channels": "Mono", "Length": "8 s", "Levels": "Voice peaks ≈ −6 dBFS; handling peaks ≤ −3 dBFS", "Set": "FIXED-GAIN (set on clean S1)"}
HAND_BASE = "Untreated medium room (or the booth if session 2 runs short). Talker standing, handheld cardioid dynamic (SM58 class) at 2–3 in. Fixed gain set on S1 for peaks at −6 dBFS."
_h = [
 ("grip-shuffle", "Grip shuffle + S1", "Handheld — grip shuffle",
  "Re-gripping the handle sends rustle and low thumps straight into the capsule: the most common handheld noise, made by nervous presenters.",
  "During S1, re-grip the handle twice: open the hand and close it again a little higher or lower.",
  ["Two shuffles, both under words, not in the gaps."]),
 ("tap", "Finger tap + S1", "Handheld — fingertip taps",
  "A single fingertip tap becomes a sharp knock: the mic body carries it into the capsule much louder than it sounds in the room.",
  "During S1, tap a fingertip on the handle three times, evenly spaced.",
  ["Three distinct knocks."]),
 ("cable-whip", "Cable whip + S1", "Handheld — cable whip",
  "A cable flicked near the mic end transmits a whip-crack thump and a low rumble through the connector: cable management is part of mic technique.",
  "During S1, flick the cable near the mic end twice (a short whip, not a pull).",
  ["Two thumps that sound like cable, not like a knock."]),
 ("ring-tap", "Ring tap + S1", "Handheld — ring knocking the body",
  "A metal ring tapping the body gives a bright metallic click on top of the thump — a noise that is easy to miss in the room and obvious in headphones.",
  "During S1, tap a metal ring against the handle twice.",
  ["Two clear metallic clicks."]),
]
_mpr5a = []
for i, (k, var, title, teach, how1, qcx) in enumerate(_h, 1):
    _mpr5a.append(rec(f"MPR-05a.{i}", title, [(f"mic_principles/mpr05-handheld-{k}.wav", var, "8 s", "", "rec")],
        context="Mic Principles › <em>Handling Noise and Isolation</em> (“vibration travels through solids into the capsule”) and the <em>Common Handheld Mistakes</em> field guide. The learner hears this one noise under the voice and names its cause.",
        teaches=teach, record=f"S1 spoken into a handheld cardioid dynamic while making one handling noise: {var.split(' + ')[0].lower()}.",
        how=[HAND_BASE, how1, "Slate the noise type before the take."],
        tips=["Use the same mic, cable and ring for all four takes; note them in the sidecar.", "Record the four handling takes back-to-back with the same gain."],
        specs=HAND_SPEC, qc=qcx + ["The noise is clearly audible under the voice and sounds like itself (no mystery thumps).", "No clipping."]))

item(id="MPR-05a", title="Handling noise on a handheld dynamic", pri="P1", sess=[2], group=G,
 used="Mic Principles › <em>Handling Noise &amp; Isolation</em> (“vibration travels through solids into the capsule”), and the <em>Common Handheld Mistakes</em> field guide. Today it is silent.",
 safety=[], reuse="CAB-05 context (cable noise).", see=["MPR-05b", "MPR-06", "CAB-05"],
 usedin="Mic Principles › Handling Noise & Isolation, Common Handheld Mistakes (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr5a)

# ---- MPR-05b isolation
ISO_SPEC = {"Channels": "Mono", "Length": "8 s", "Levels": "Voice peaks ≈ −6 dBFS", "Set": "FIXED-GAIN (same gain for rigid and shock)", "Room": "Untreated medium room with a wooden floor"}
DESK = ["Podcast setup: LDC on a desk stand, talker speaking S1 at 15 cm.",
        "Knock: a tennis ball dropped from 30 cm (along a ruler) onto the desk 30 cm from the stand base, twice during S1 — identical impacts every take."]
FOOT = ["LDC on a floor stand on a wooden floor; talker speaking S1 at 15 cm.",
        "Footsteps: one person walks the same path past the stand, 1 m away, in the same shoes, to a metronome, during S1."]
_i = [
 ("desk-knock", "rigid", "Desk knock · rigid mount", "Desk knock — rigid clip",
  "A knock on the desk travels up the desk stand and through a rigid clip into the mic body: it arrives as a heavy low thump under the voice (the app's 90% INTO MIC).",
  DESK + ["Mount: the mic's rigid stand clip."], ["Knocks are loud low thumps."], "RIGID MOUNT"),
 ("desk-knock", "shock", "Desk knock · shock mount", "Desk knock — shock mount",
  "The same knock through a shock mount: the elastic suspension soaks up the vibration and only a little airborne sound is left (the app's 15%). The voice is unchanged.",
  DESK + ["Mount: the mic's own shock mount. Swap ONLY the mount: same mic, same position (taped), same gain."], ["Knocks much quieter than the rigid take; mostly airborne sound left.", "Voice level and tone identical to the rigid take."], "SHOCK MOUNT"),
 ("footsteps", "rigid", "Footsteps · rigid mount", "Footsteps — rigid clip",
  "Footsteps on a wooden floor shake a floor stand: through a rigid clip each step becomes a low thud — how footsteps get into a recording on a quiet stage.",
  FOOT + ["Mount: the rigid clip."], ["Each step a clear low thud."], "RIGID MOUNT"),
 ("footsteps", "shock", "Footsteps · shock mount", "Footsteps — shock mount",
  "The same footsteps through a shock mount: the thuds almost disappear, while the voice is unchanged. Decoupling works for floor-borne noise too.",
  FOOT + ["Mount: the shock mount. Swap ONLY the mount: same mic, same stand position (taped), same gain, same walk."], ["Steps much quieter than the rigid take.", "Voice level and tone identical to the rigid take."], "SHOCK MOUNT"),
]
_mpr5b = []
for i, (k, mt, var, title, teach, howl, qc, tray) in enumerate(_i, 1):
    _mpr5b.append(rec(f"MPR-05b.{i}", title, [(f"mic_principles/mpr05-{k}-{mt}.wav", var, "8 s", "", "rec")],
        context=f"Mic Principles › <em>Handling Noise and Isolation</em> with the MOUNT tray on {tray} (INTO MIC readout {'90%' if mt == 'rigid' else '15%'}). The learner flips between rigid and shock on the same {'desk knock' if k == 'desk-knock' else 'footsteps'} and hears what the mount removes.",
        teaches=teach, record=f"S1 at 15 cm on an LDC in a {'rigid clip' if mt == 'rigid' else 'shock mount'}, with {'a repeatable desk knock' if k == 'desk-knock' else 'footsteps on a wooden floor'}.",
        how=howl, tips=(["Tape the stand position and mic height so the mount swap changes nothing else.", "Record rigid then shock straight away, same gain."]
                        + (["A tennis ball dropped along a ruler gives identical knocks every take."] if k == "desk-knock" else ["Walk to a metronome so the steps land at the same moments in both takes."])),
        specs=ISO_SPEC, qc=qc))

item(id="MPR-05b", title="Isolation: rigid mount versus shock mount", pri="P1", sess=[2], group=G,
 used="Mic Principles › <em>Handling Noise &amp; Isolation</em>. A MOUNT tray switches RIGID MOUNT and SHOCK MOUNT; the readout shows how much vibration gets into the mic (90% rigid, 15% shock). Today it is silent.",
 safety=[], reuse="None.", see=["MPR-05a"],
 usedin="Mic Principles › Handling Noise & Isolation (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr5b)

# ---- MPR-06 grip
GRIP = [("low-handle", "LOW HANDLE", "INTACT", "Hand at the bottom of the handle.",
         "Holding low on the handle leaves the grille and rear ports clear: the cardioid pattern is intact and the rear speaker stays rejected."),
        ("correct", "CORRECT", "INTACT", "Hand on the upper body, top edge just below the grille rim, touching no grille.",
         "The correct grip: a firm hold that still leaves the ports open. Sounds the same as the low grip — the pattern is intact."),
        ("grille-rim", "GRILLE RIM", "DEGRADING", "Fingertips overlapping the grille rim.",
         "Fingers on the rim start covering the rear ports: the pattern begins to widen, a little more of the rear speaker gets in and the tone starts to change."),
        ("full-cup", "FULL CUP", "COLLAPSED", "Hand wrapped round the whole grille.",
         "A full cup blocks the rear ports: the cardioid collapses toward omni, the voice turns boxy and honky, and the rear speaker pours in — on stage this means feedback.")]
GRIP_SPEC = {"Channels": "Mono", "Length": "8 s", "Levels": "Peaks ≈ −6 dBFS on CORRECT (gain set there)", "Set": "FIXED-GAIN", "Room": "DRY booth, with the rear reference speaker"}
_mpr6 = []
_n = 0
for src, sn, srec in (("s1", "S1 spoken", "S1 spoken"), ("sung", "Sung phrase (S2 bars 5–6)", "the sung phrase S2 bars 5–6")):
    for g, gn, pat, grip, teach in GRIP:
        _n += 1
        first = _n == 1
        howl = (["DRY booth. Performer standing, handheld cardioid dynamic 2 in from the lips, on-axis.",
                 "Rear reference: a small speaker 1 m directly behind the mic (180°) playing a quiet, steady original guitar loop (FX-04 DI) at about 60 dBA at the mic, the same level for all eight takes.",
                 "Gain: fixed, set on the CORRECT grip for peaks at −6 dBFS."] if first else
                [f"Same booth, rear speaker level, mic distance and taped gain as MPR-06.1."])
        howl.append(f"Grip: {gn} — {grip}")
        _mpr6.append(rec(f"MPR-06.{_n}", f"{sn.split(' (')[0]} · {gn} grip", [(f"mic_principles/mpr06-{src}-{g}.wav", f"{sn} · {gn}", "8 s", "", "rec")],
            context=f"Mic Principles › <em>How Your Hand Changes the Mic</em> with POSITION on {gn} (PATTERN readout: {pat}). The learner moves the hand through the four grips and hears the rear guitar creep in as the pattern collapses; this is the {'spoken' if src == 's1' else 'sung'} version.",
            teaches=teach + (" On the sung phrase the colour change is easiest to hear on held vowels." if src == "sung" else ""),
            record=f"{srec[0].upper() + srec[1:]} into a handheld cardioid dynamic at 2 in, held with the {gn} grip, with the quiet guitar loop playing from behind.",
            how=howl,
            tips=(["Photograph each grip for our art team; put the photos in the folder.",
                   "Feedback when cupped is NOT captured here; if wanted, it belongs in the SS-01 feedback session under SAFE-2."] if first else
                  ["Do all four grips of one source back-to-back; the performer keeps the same distance and loudness."]),
            specs={**GRIP_SPEC, "Grip": gn},
            qc={"low-handle": ["Sounds nearly identical to CORRECT; rear guitar faint."],
                "correct": ["Rear guitar faint; voice natural.", "Peaks ≈ −6 dBFS."],
                "grille-rim": ["Between CORRECT and FULL CUP: a little more rear guitar and slight colour."],
                "full-cup": ["Audibly boxy/honky and lets in noticeably more of the rear guitar than CORRECT."]}[g]))

item(id="MPR-06", title="Hand grip and cupping", pri="P1", sess=[1], group=G,
 used="Mic Principles › <em>How Your Hand Changes the Mic</em>. A POSITION control moves the hand through LOW HANDLE, CORRECT, GRILLE RIM and FULL CUP; the PATTERN readout goes INTACT → DEGRADING → COLLAPSED. Today it is silent.",
 safety=["SAFE-2 if anyone tries the optional cupped-feedback demo (do it only in session 5)."], reuse="None.", see=["SS-01", "MPR-05a"],
 usedin="Mic Principles › How Your Hand Changes the Mic (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=_mpr6)

# ---- MPR-07 stereo
ST_PERF = "Performance (20–30 s), one take for all arrays: fingerpicked guitar throughout at centre, 2 m away; shaker 2 m to the left; talker starts far left and walks slowly to far right speaking S1 twice."
ST_RIG = ("Live room, RT60 ≈ 0.8 s. All arrays 2 m from the performance line at 1.5 m height. Coincident pairs clustered on one stereo bar at the same point (XY above, M/S below); "
          "ORTF beside them; AB straddles the cluster. Before the take, clap at the exact centre and check every pair shows it centred — fix by moving mics, not by panning.")
ST_SPEC = {"Channels": "Stereo", "Length": "20–30 s", "Levels": "Peaks ≤ −6 dBFS", "Set": "MATCHED (decoded stereo files and mono spot within ±0.5 LU of each other)",
           "Room": "RT60 ≈ 0.8 s; arrays at 2 m"}
item(id="MPR-07", title="Stereo techniques — four arrays, one performance", pri="P2", sess=[3], group=G,
 used="Mic Principles › <em>Stereo Techniques</em>. A TECHNIQUE tray switches XY, ORTF, AB and MID-SIDE; readouts say where the stereo comes from (LEVEL, LEVEL+TIME, TIME, MIX) and how safe it is in mono. Today it is silent.",
 safety=[], reuse="FX-05 (Stereo Imaging lab), EAR-06, Meter phase/stereo, Binaural lab.", see=["EAR-06", "FX-05"],
 usedin="Mic Principles › Stereo Techniques (src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx)",
 recs=[
  rec("MPR-07.1", "XY — coincident cardioid SDCs at 90°", [("mic_principles/mpr07-xy.wav", "XY, cardioid SDCs at 90°", "20–30 s", "", "rec")],
   context="TECHNIQUE = XY (FROM: LEVEL; IN MONO: safe). The learner follows the walking talker across the image and sums to mono to hear nothing change.",
   teaches="A coincident pair images by level difference only: both capsules hear every sound at the same instant, so the mono sum loses nothing. The price is a narrower image than the spaced techniques.",
   record="The shared stereo performance, captured by an XY pair.",
   how=[ST_RIG, "XY: two matched cardioid SDCs, capsules stacked one above the other over one point, 90° between their axes, the pair aimed at the centre.",
        "Match the two gains on the guitar alone at centre so the image is balanced.", ST_PERF],
   tips=["Capture all four arrays plus the mono spot in ONE performance — the comparison is only fair if the performance is identical.", "Use the same SDC model for XY and ORTF so only the geometry differs."],
   specs={**ST_SPEC, "Array": "XY, cardioid SDCs, 90°"},
   qc=["The walker moves smoothly from left to right; the image is narrower than AB.", "Summed to mono, nothing thins or changes tone.", "Guitar dead centre."]),
  rec("MPR-07.2", "ORTF — cardioid SDCs 17 cm apart at 110°", [("mic_principles/mpr07-ortf.wav", "ORTF, 17 cm / 110°", "20–30 s", "", "rec")],
   context="TECHNIQUE = ORTF (FROM: LEVEL+TIME; IN MONO: good). The learner compares its width and depth with XY and AB.",
   teaches="Near-coincident ORTF uses level AND a small time difference, like a pair of ears: wider and more natural than XY, while the mono sum costs width rather than tone.",
   record="The shared stereo performance, captured by an ORTF pair.",
   how=[ST_RIG, "ORTF: two matched cardioid SDCs, capsules 17 cm apart, 110° between their axes, pair aimed at the centre.",
        "Use an ORTF bar or measure capsule spacing and angle precisely.", ST_PERF],
   tips=["Measure 17 cm capsule-to-capsule, not body-to-body."],
   specs={**ST_SPEC, "Array": "ORTF, 17 cm / 110°"},
   qc=["Wider than XY, still a solid centre.", "Mono sum slightly narrower but the tone holds.", "Guitar dead centre."]),
  rec("MPR-07.3", "AB — spaced omnis 60 cm apart", [("mic_principles/mpr07-ab.wav", "AB, omnis 60 cm apart", "20–30 s", "", "rec")],
   context="TECHNIQUE = AB (FROM: TIME; IN MONO: risky). The learner hears the widest image, then sums to mono and hears the low end thin or change.",
   teaches="A spaced pair images by arrival-time difference: the widest, most spacious picture, but when summed to mono one mic can be pushing while the other pulls, so parts of the spectrum cancel.",
   record="The shared stereo performance, captured by a spaced omni pair.",
   how=[ST_RIG, "AB: two matched omnis 60 cm apart, both facing forward, centred on the same point as the cluster.", ST_PERF],
   tips=["Keep the spacing exactly 60 cm and symmetrical about the centre line — measure from the centre clap point."],
   specs={**ST_SPEC, "Array": "AB, omnis 60 cm apart"},
   qc=["Widest image of the four.", "Summed to mono, the low end thins or changes audibly.", "Guitar centred (equal distance to both omnis)."]),
  rec("MPR-07.4", "Mid-Side — cardioid mid plus figure-8 side (raw and decoded)", [("mic_principles/mpr07-ms-raw.wav", "M/S raw (ch1 Mid, ch2 Side)", "20–30 s", "Not matched", "rec"),
                                                                                ("mic_principles/mpr07-ms-decoded.wav", "M/S decoded to L/R", "20–30 s", "", "edit")],
   context="TECHNIQUE = MID-SIDE (FROM: MIX; IN MONO: perfectly safe). The decoded file is what plays as stereo; the raw file lets the page show mid and side separately and set the width after the fact.",
   teaches="M/S builds stereo from a forward mic plus a sideways figure-8: L = M + S, R = M − S. Turning the side down narrows the image; at zero only the mid remains, so mono is always safe.",
   record="The shared stereo performance, captured by an M/S pair, delivered raw (two channels) and decoded to left/right.",
   how=[ST_RIG, "M/S: a cardioid facing forward (MID) and a figure-8 sideways (SIDE) with its positive lobe to the LEFT, capsules stacked.",
        ST_PERF, "Raw file: ch1 = Mid, ch2 = Side, no processing, not loudness-matched.",
        "Decoded file: L = M + S, R = M − S, side at unity; then loudness-match it with the other stereo files."],
   tips=["Confirm the figure-8's positive lobe faces LEFT by tapping that side before the take: the decoded tap must appear on the left.",
         "The raw file stays raw; only the decoded file is matched."],
   specs={**ST_SPEC, "Channels": "Stereo (raw: ch1 = Mid, ch2 = Side)", "Set": "Decoded file MATCHED; raw file left raw", "Array": "M/S: cardioid mid + figure-8 side, positive lobe left"},
   qc=["Decoded: the shaker is on the LEFT (confirms the figure-8 orientation).", "Decoded: guitar dead centre.", "Raw ch1 alone sounds like a normal mono cardioid; ch2 alone has almost no guitar (centre is in the side null)."]),
  rec("MPR-07.5", "Mono spot — single cardioid on the centre line", [("mic_principles/mpr07-mono-spot.wav", "Mono spot (centre cardioid)", "20–30 s", "For Ear Training M6", "rec")],
   context="The mono reference for the stereo comparisons, and the source used in Ear Training module 6: it is what the performance sounds like with no stereo information at all.",
   teaches="One mic gives no left/right information: the walker never moves, only gets nearer and further. Against it, every stereo array's width becomes obvious.",
   record="The shared stereo performance, captured by one cardioid on the centre line.",
   how=[ST_RIG, "Mono spot: one cardioid 2 m away on the centre line, at the array height.", ST_PERF],
   tips=["Use a cardioid of the same family as the XY/ORTF SDCs so the tone matches the stereo files."],
   specs={**ST_SPEC, "Channels": "Mono"},
   qc=["The talker does not move left or right; only the distance changes.", "Within ±0.5 LU of the decoded stereo files."]),
 ])

# ================================================================ SPEAKER COVERAGE
SPK_BASE = ["Outdoors on a quiet day or in a large empty room. 2-way PA speaker on a stand, HF driver at 1.8 m; measurement omni at the same height.",
            "Programme per take: 5 s of pink noise, then the dry S1 (from SPC-04 clean) from a playback device. Speaker level about 85 dBA at 4 m on-axis; never change it.",
            "Preamp gain set ONCE at 1 m on-axis so the peaks reach −6 dBFS; tape it. Record the 1 m take first, then the others."]
SPK_SPEC = {"Channels": "Mono", "Length": "≈ 12 s (5 s pink noise, then S1)", "Set": "FIXED-GAIN (gain set at 1 m on-axis)",
            "Conditions": "Outdoors or large room; SPL ≈ 85 dBA at 4 m on-axis"}
ANG = {0: ("On-axis reference at 4 m: full top end. Every angle is compared with it.", ["Full, bright pink noise; S1 clear."]),
       15: ("Well inside every coverage pattern in the lab (60° to 120° wide): almost no change. A listener here hears the PA as intended.", ["Nearly identical to 0°."]),
       30: ("The edge of a 60°-wide box (±30°): the highs start to drop. A narrow box already sounds less bright here.", ["Slightly duller than 0° on the pink noise."]),
       45: ("Outside a 60° pattern, inside a 90° one: the top end is clearly lower while the lows are almost unchanged. Off-axis loss is a tone change first.", ["Audibly duller than 0°; level only a little lower."]),
       60: ("The edge of a 120°-wide box and well outside narrower ones: dull and quieter. The seats at the side of the room hear this.", ["Clearly duller AND quieter than 0°."]),
       90: ("Beside the box, outside every pattern: mostly low and mid frequencies wrap round; the highs are gone. Why side seats need fill speakers.", ["The dullest take: pink noise loses its top; S1 less intelligible."])}
DIST = {1: ("Close to the box: the loudest take (gain set here). At 1 m the two drivers are not yet fully combined, so the tone can differ slightly from further back.", ["Peaks ≈ −6 dBFS; no clipping."]),
        2: ("Double the distance: about 6 dB quieter outdoors (inverse-square law), tone unchanged on-axis.", ["About 6 dB below 1 m."]),
        8: ("Twice as far as 4 m: another 6 dB down outdoors; indoors the room makes it fall less. Distance costs level; angle costs tone.", ["About 6 dB below the 4 m on-axis take outdoors (less indoors — note it)."])}
_spk = []
_n = 0
for a in (0, 15, 30, 45, 60, 90):
    _n += 1
    t, qc = ANG[a]
    _spk.append(rec(f"SPK-01.{_n}", f"Off-axis {a}° at 4 m", [(f"speaker_coverage/spk01-offaxis-{a:02d}deg-4m.wav", f"{a}° off-axis at 4 m", "12 s", "5 s pink noise, then S1", "rec")],
        context=f"Speaker Coverage lab and Wave lab <em>Loudspeaker Coverage</em>: the sound of a listener {a}° off the speaker's axis at 4 m. The learner sets a dispersion pattern and aims the box, then hears what a seat at this angle gets.",
        teaches=t, record=f"Pink noise then S1 through one 2-way PA speaker, measurement omni 4 m away at {a}° off the speaker's axis.",
        how=SPK_BASE + ["Put the speaker on a turntable (or mark angles on the floor around its acoustic centre). The mic stays put at 4 m; rotate the SPEAKER to " + f"{a}°."],
        tips=["Rotate the speaker, not the mic — the room (or ground) reflection pattern then stays the same.",
              "Do all six angles in one run before moving the mic for the distance takes.", "Log temperature and wind outdoors; note the speaker model and its published dispersion."],
        specs={**SPK_SPEC, "Position": f"4 m, {a}° off-axis"}, qc=qc + (["Level lower than 0° by a few dB."] if a >= 60 else []),
        safety=["Hearing protection for anyone near the speaker (≈ 85 dBA)."]))
for d in (1, 2, 8):
    _n += 1
    t, qc = DIST[d]
    _spk.append(rec(f"SPK-01.{_n}", f"On-axis at {d} m", [(f"speaker_coverage/spk01-onaxis-{d}m.wav", f"On-axis at {d} m", "12 s", "5 s pink noise, then S1", "rec")],
        context=f"Speaker Coverage lab and Wave lab <em>Loudspeaker Coverage</em>: an on-axis listener at {d} m. The learner compares distances along the axis (1, 2, 4, 8 m) to hear level fall without the tone changing.",
        teaches=t, record=f"Pink noise then S1 through the same speaker, measurement omni on-axis at {d} m.",
        how=SPK_BASE + [f"Speaker on-axis (0°). Move the MIC along the axis to {d} m. Do not change the speaker level or the preamp gain."],
        tips=["Measure from the speaker's front baffle to the mic capsule with a tape.", "Keep the mic at 1.8 m height for every distance."],
        specs={**SPK_SPEC, "Position": f"On-axis, {d} m"}, qc=qc, safety=["Hearing protection for anyone near the speaker (≈ 85 dBA)."]))
_n += 1
_spk.append(rec(f"SPK-01.{_n}", "On-axis at 4 m (distance step) — reuse of the 0° take", [("speaker_coverage/spk01-offaxis-00deg-4m.wav", "On-axis at 4 m", "—", "Reuse — this is the 0° take above", "reuse")],
    context="The 4 m step of the on-axis distance ladder (1, 2, 4, 8 m).", teaches="See SPK-01.1: the 0° take at 4 m doubles as the 4 m distance step.",
    record="Nothing new — the SPK-01.1 file.", how=["No recording."], tips=["Do not deliver a second copy."], specs={"Source": "SPK-01.1"},
    qc=["SPK-01.1 sits about 6 dB below the 2 m take and about 6 dB above the 8 m take (outdoors)."]))
item(id="SPK-01", title="Loudspeaker off-axis and distance", pri="P3", sess=[5], group="Speaker Coverage",
 used="Speaker Coverage lab (top view and side view) and Wave lab <em>Loudspeaker Coverage</em>: the learner chooses dispersion patterns (60°×40° to 120°×60°), aims boxes and watches the coverage map. Today it is visual only.",
 safety=["Hearing protection for anyone near the speaker (≈ 85 dBA)."], reuse="Wave lab coverage module.", see=["SS-03b"],
 usedin="Speaker Coverage lab; Wave lab › Loudspeaker Coverage (src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx)",
 recs=_spk)

# ================================================================ MIC SELECTION
G = "Mic Selection"
MSL_MICS = {"dyn": "Dynamic", "ldc": "Large-diaphragm condenser", "sdc": "Small-diaphragm condenser", "ribbon": "Ribbon",
            "lav": "Lavalier (chest)", "headworn": "Headworn", "shotgun": "Shotgun (overhead boom)", "boundary": "Boundary (on desk)"}
MSL_SRC = {"voice-s1": ("S1 voice", "S1 spoken", 1, "8 in from the mouth", "voice"),
           "sung-s2": ("S2 sung", "S2 sung (the house melody)", 1, "8 in from the mouth", "sung"),
           "acgtr": ("Acoustic guitar strum", "an acoustic guitar strumming a steady pattern (A minor, 80 BPM, the house song chords)", 3, "12 in from the 12th-fret/body joint", "guitar"),
           "snare": ("Snare loop", "a snare loop (backbeat with a few ghost notes and one rim-shot)", 3, "3 in above the rim, angled at the centre", "snare")}
# (source, mic): (placement, teaches, qc)
MSL = {
 ("voice-s1", "dyn"): ("Cardioid dynamic (SM58/SM7 class) in the cluster, capsule 8 in from the mouth.",
   "A moving-coil dynamic on speech: a presence lift and a gentle top roll-off, so the voice is focused but less airy; it also hears less of the booth than the condensers. The broadcast and live-stage sound.",
   ["Least airy of the four core mics; voice focused and mid-forward."]),
 ("voice-s1", "ldc"): ("Cardioid LDC in the cluster, capsule 8 in from the mouth.",
   "The studio voice mic: a detailed, airy top and a full, flattering body. It hears more of the booth than the dynamic.",
   ["Airier and fuller than the dynamic; sounds like a studio voice-over."]),
 ("voice-s1", "sdc"): ("Cardioid SDC in the cluster, capsule 8 in from the mouth.",
   "The most neutral of the four: what the voice really sounds like at 8 in. Less flattering than the LDC, more open than the dynamic.",
   ["The most neutral-sounding core take; no obvious presence peak."]),
 ("voice-s1", "ribbon"): ("Passive ribbon (figure-8) in the cluster, 8 in from the mouth, on its own preamp channel with phantom OFF.",
   "A ribbon on speech: smooth, darker top and natural low mids; the figure-8 rear also hears the booth behind the talker. Kind to a harsh voice.",
   ["Darker and smoother than the condensers; needs more gain (note it)."]),
 ("voice-s1", "lav"): ("Lavalier clipped on the sternum, about 20 cm from the mouth, cable taped so it cannot rub clothing.",
   "A chest-worn lav: chesty, with less top end because the chin shadows the mouth's highs; it moves with the talker so the level stays steady. Clothing rustle is its typical problem.",
   ["Chesty and slightly dull compared with the cluster mics; no clothing rustle."]),
 ("voice-s1", "headworn"): ("Headworn mic with the capsule 2–3 cm from the corner of the mouth, out of the breath stream.",
   "A headworn mic: very close and clear, almost no room, and a fixed distance however the head moves — the theatre and presenter choice for gain before feedback.",
   ["Close and clear; no breath pops (capsule out of the airflow)."]),
 ("voice-s1", "shotgun"): ("Shotgun on a boom overhead, 60 cm from the mouth, aimed at the mouth from above and in front (out of frame).",
   "A shotgun from out of shot: usable speech at 60 cm, but more room and a slightly hollow colour from sounds arriving off-axis. The film and TV compromise.",
   ["Roomier than the cluster mics; speech still intelligible."]),
 ("voice-s1", "boundary"): ("Boundary mic flat on a hard desk, 60 cm in front of the talker.",
   "A boundary mic: the surface removes the desk-reflection comb filter, so the voice is full and even, but at 60 cm it carries more room. The conference-table sound.",
   ["Full and even, with some room; no hollow comb colour."]),
 ("sung-s2", "dyn"): ("Cardioid dynamic in the cluster, 8 in from the mouth.",
   "A dynamic on a sung vocal handles the loud chorus easily and keeps the voice forward, but loses detail on the soft verse.",
   ["Chorus solid and unclipped; verse less detailed than on the LDC."]),
 ("sung-s2", "ldc"): ("Cardioid LDC in the cluster, 8 in from the mouth.",
   "The studio vocal standard: detail and breath on the soft verse, size on the chorus.",
   ["Most detailed verse; chorus full but not harsh."]),
 ("sung-s2", "sdc"): ("Cardioid SDC in the cluster, 8 in from the mouth.",
   "Neutral and exact on a sung vocal: often sounds thinner and more exposed than the LDC — the reason SDCs are rarely the first vocal choice.",
   ["Accurate but thinner than the LDC."]),
 ("sung-s2", "ribbon"): ("Passive ribbon in the cluster, 8 in from the mouth, phantom OFF.",
   "A ribbon on a singer: a smooth, dark top that tames a bright or harsh voice; it needs a lot of clean gain.",
   ["Smooth, dark top; no harshness on loud notes."]),
 ("acgtr", "dyn"): ("Cardioid dynamic in the cluster, 12 in from where the neck meets the body (12th-fret/body joint).",
   "A dynamic on acoustic guitar: mid-forward and rounded, missing the string sparkle and the fast attack of the strum.",
   ["Duller and more mid-focused than the SDC."]),
 ("acgtr", "ldc"): ("Cardioid LDC in the cluster, 12 in from the 12th-fret/body joint.",
   "An LDC on acoustic guitar: big and full, with plenty of body; it can lean boomy if it sees too much of the soundhole.",
   ["Full and big without obvious boom."]),
 ("acgtr", "sdc"): ("Cardioid SDC in the cluster, 12 in from the 12th-fret/body joint.",
   "The classic acoustic-guitar mic: a fast, detailed capture of the pick and string sparkle with an even body.",
   ["Most detailed strum; strings sparkle."]),
 ("acgtr", "ribbon"): ("Passive ribbon in the cluster, 12 in from the 12th-fret/body joint, phantom OFF.",
   "A ribbon on acoustic guitar: warm and smooth, the strum softened at the top — a vintage, mix-friendly sound.",
   ["Warm and smooth; less pick attack than the SDC."]),
 ("snare", "dyn"): ("Cardioid dynamic in the cluster, 3 in above the rim, angled at the centre of the head.",
   "The snare standard: handles the level, presence for the crack, and its cardioid rear rejects the hi-hat.",
   ["Solid crack and body; peaks ≤ −3 dBFS."]),
 ("snare", "ldc"): ("Cardioid LDC (pad engaged if it has one) in the cluster, 3 in above the rim.",
   "An LDC on a snare: fuller, more ring and more bleed; it can be overloaded without a pad. Big, but less controlled.",
   ["Fuller with more ring than the dynamic; no capsule or preamp distortion."]),
 ("snare", "sdc"): ("Cardioid SDC (pad engaged if needed) in the cluster, 3 in above the rim.",
   "An SDC on a snare: crisp, detailed crack and wires, and more hi-hat in the picture.",
   ["Crispest wires; more hi-hat than the dynamic."]),
 ("snare", "ribbon"): ("Ribbon rated for snare SPL in the cluster, 3 in above the rim and angled slightly off the air blast (or at 6 in — note it), phantom OFF.",
   "A ribbon on a snare: fat, dark and smooth — a character choice, and a risky one, because the air blast can damage a delicate ribbon.",
   ["Dark and fat; no ribbon rattle or distortion."]),
}
_msl1 = []
_n = 0
for s in ("voice-s1", "sung-s2", "acgtr", "snare"):
    sn, srec, sess, dist, kind = MSL_SRC[s]
    mics = ["dyn", "ldc", "sdc", "ribbon"] + (["lav", "headworn", "shotgun", "boundary"] if s == "voice-s1" else [])
    for m in mics:
        _n += 1
        mn = MSL_MICS[m]
        place, teach, qc = MSL[(s, m)]
        files = [(f"mic_selection/msl01-{s}-{m}-{st}.wav", f"{sn} · {mn} · {stn}", "8 s", "", "rec" if st == "fixed" else "edit")
                 for st, stn in (("matched", "MATCHED"), ("fixed", "FIXED-GAIN raw"))]
        if kind in ("voice", "sung"):
            room = "Session 1, DRY booth."
            together = ("All eight mics (four core plus lav, headworn, shotgun, boundary) record the same S1 performance at once." if kind == "voice"
                        else "The four core mics record the same S2 performance at once.")
        else:
            room = "Session 3, studio room."
            together = f"The four core mics record the same {'strum' if kind == 'guitar' else 'snare loop'} at once."
        how = [room, together, f"This channel: {place}"]
        if m in ("dyn", "ldc", "sdc", "ribbon"):
            how.append(f"Core cluster: the four core capsules as close together as possible, all {dist}, all aimed at the source.")
        else:
            how.append("Specialist mic: keep it in its own working position (not in the core cluster); its position is part of its sound.")
        how.append("Fixed gain per mic, set on the loudest moment of this source; record once.")
        if m == "ribbon":
            how.append("Passive ribbons get NO phantom power — use a separate preamp channel with phantom OFF, or an inline switch. If you use an active ribbon, note it.")
        how.append("MATCHED copy: loudness-match across the mics of this source within ±0.5 LU, after QC of the raw set.")
        tips = ["One performance, all mics together — the only fair comparison."]
        if s == "snare" and m == "ribbon":
            tips.append("Snare at 3 in is hard on a ribbon: use one rated for snare SPL, angle it slightly off the air blast, or move it to 6 in and note it.")
        if m in ("lav", "headworn", "shotgun", "boundary"):
            tips.append("Set the specialist mics' gains on a trial pass first: the lav and boundary sit much further from the mouth than the headworn.")
        if s == "acgtr" and m == "dyn":
            tips.append("Record the guitar and snare clusters during the session-3 setup, before the band arrives.")
        _msl1.append(rec(f"MSL-01.{_n}", f"{sn} · {mn}", files,
            context=(f"Mic Selection lab: the learner studies {mn.lower().split(' (')[0]} mics and their response shape, then hears this one on {('speech' if kind == 'voice' else 'a sung vocal' if kind == 'sung' else 'acoustic guitar' if kind == 'guitar' else 'a snare')} "
                     f"against the other mics on the same performance. The MATCHED copy removes level so only tone is compared; the raw file keeps each mic's real output level."),
            teaches=teach, record=f"{srec[0].upper() + srec[1:]}, through the {mn.lower()}" + ("" if m in ("lav", "headworn", "shotgun", "boundary") else f", {dist}") + ".",
            how=how, tips=tips,
            specs={"Channels": "Mono", "Length": "8 s", "Levels": "Peaks ≤ −3 dBFS" if s == "snare" else "Peaks ≤ −6 dBFS",
                   "Set": "MATCHED copy + raw FIXED-GAIN original", "Position": place.split(", phantom")[0]},
            qc=qc + ["MATCHED copy within ±0.5 LU of the other mics on this source."],
            safety=(["SAFE-3: never phantom on a passive ribbon."] if m == "ribbon" else None)))

item(id="MSL-01", title="The same source through different mic types", pri="P2", sess=[1, 3], group=G,
 used="Mic Selection lab: the learner studies mic types (moving-coil dynamic, condensers, ribbon, lavalier, headworn, shotgun, boundary…) and response shapes (flat, presence rise, low roll-off, extended highs) and picks a mic for a job. Today it is visual only.",
 safety=["SAFE-3: never phantom on a passive ribbon."], reuse="WAV-03 context (boundary mic).", see=["MPR-01", "MSL-02"],
 usedin="Mic Selection lab (src/screens/lab/micselect/)",
 recs=_msl1)

MSL2_BASE = ["DRY booth, quietest time of day (first thing; HVAC off, nobody else in the building).",
             "Same preamp model and the SAME high gain on both channels (e.g. +60 dB). Tape the knobs."]
MSL2_SPEC = {"Channels": "Mono", "Length": "10 s", "Levels": "Same high gain on all four takes", "Set": "FIXED-GAIN"}
item(id="MSL-02", title="Sensitivity and self-noise", pri="P3", sess=[1], group=G,
 used="Mic Selection lab › specification terms <em>Sensitivity</em>, <em>Self-noise</em>, <em>Signal-to-noise ratio</em> and <em>Equivalent noise level</em>. Today these are text and diagrams.",
 safety=[], reuse="Gain lab context, Digital noise floor.", see=["GAN-01"],
 usedin="Mic Selection lab › specification terms (src/screens/lab/micselect/micSelectData.ts)",
 recs=[
  rec("MSL-02.1", "Ticking clock — dynamic", [("mic_selection/msl02-clock-dynamic.wav", "Ticking clock · dynamic", "10 s", "", "rec")],
   context="Illustrates <em>Sensitivity</em> and <em>Signal-to-noise ratio</em>: the learner hears a quiet source on a low-sensitivity mic at high gain.",
   teaches="A dynamic's low sensitivity (a few mV/Pa) means a quiet source needs a lot of gain, so the preamp's hiss is heard behind the clock: low signal-to-noise.",
   record="A mechanical ticking clock at 30 cm on a dynamic mic, at the shared high gain.",
   how=MSL2_BASE + ["Clock at 30 cm from the dynamic and the LDC, side by side; both channels record at once."],
   tips=["Record this and MSL-02.2 in one pass — same ticks, same gain.", "Note the mic's published sensitivity (mV/Pa) in the sidecar."],
   specs=MSL2_SPEC, qc=["Ticks audible but with clearly audible hiss behind them.", "No room sounds (traffic, HVAC tones)."]),
  rec("MSL-02.2", "Ticking clock — LDC", [("mic_selection/msl02-clock-ldc.wav", "Ticking clock · LDC", "10 s", "", "rec")],
   context="The comparison for MSL-02.1 on the <em>Sensitivity</em> term: the same clock at the same gain on a sensitive mic.",
   teaches="A condenser's higher sensitivity (often 15–30 mV/Pa) puts out a much bigger signal from the same clock, so at the same gain the ticks are far louder than the noise.",
   record="The same ticking clock at 30 cm on an LDC, at the same high gain.",
   how=MSL2_BASE + ["Recorded in the same pass as MSL-02.1."],
   tips=["Note the LDC's published sensitivity and self-noise (dBA) in the sidecar."],
   specs=MSL2_SPEC, qc=["Ticks clearly louder relative to the noise than on the dynamic.", "No clipping at the shared gain."]),
  rec("MSL-02.3", "Self-noise — dynamic plus preamp", [("mic_selection/msl02-selfnoise-dynamic.wav", "Self-noise · dynamic (+ preamp)", "10 s", "", "rec")],
   context="Illustrates <em>Self-noise</em> and <em>Equivalent noise level</em>: the floor under every recording with this mic.",
   teaches="A dynamic has no electronics, so its noise here is almost entirely the preamp's hiss at high gain — the noise floor is a property of the whole chain.",
   record="10 s of silence from the dynamic, isolated, at the shared high gain.",
   how=MSL2_BASE + ["Put the dynamic inside an isolation box or under a heavy blanket in the booth; nothing playing; record 10 s."],
   tips=["Record both self-noise takes straight after the clock, before anyone arrives."],
   specs=MSL2_SPEC, qc=["Only steady hiss: no room sounds, no hum."]),
  rec("MSL-02.4", "Self-noise — LDC", [("mic_selection/msl02-selfnoise-ldc.wav", "Self-noise · LDC", "10 s", "", "rec")],
   context="The LDC's floor for <em>Self-noise</em>: compared with MSL-02.3 and with the clock takes, it shows why a sensitive mic wins on quiet sources even though it makes its own noise.",
   teaches="A condenser's own electronics make some hiss (its published self-noise, e.g. 7–15 dBA), but because its output is much higher, its signal-to-noise on a quiet source is still far better.",
   record="10 s of silence from the LDC, isolated, at the same high gain.",
   how=MSL2_BASE + ["Put the LDC inside the isolation box or under the blanket; phantom on; nothing playing; record 10 s."],
   tips=["Let the condenser warm up for a few minutes after phantom is applied before recording its noise."],
   specs=MSL2_SPEC, qc=["Only steady hiss: no room sounds, no hum."], safety=["SAFE-3 for phantom power (switch phantom off before plugging)."]),
 ])

# ================================================================ SPEECH & VOICE
G = "Speech and Voice"
SPEECH_SETUP = "House speech setup: cardioid LDC at 8 in, pop filter, DRY booth."
VOW = [("ah", "AH (father)", 730, 1090, 850, 1220, "The most open vowel: jaw low, tongue low and back. F1 high and F2 low, close together."),
       ("eh", "EH (bed)", 530, 1840, 610, 2330, "A front, mid-height vowel: F1 in the middle, F2 high."),
       ("ee", "EE (see)", 270, 2290, 310, 2790, "The most closed front vowel: tongue high and forward. F1 very low and F2 very high — the widest gap of the five."),
       ("aw", "AW (law)", 570, 840, 590, 920, "A back, rounded vowel: F1 and F2 both low and close together; a dark sound."),
       ("oo", "OO (boot)", 300, 870, 370, 950, "The closed, rounded back vowel: F1 and F2 both low — the darkest of the five.")]
_spc1 = []
_n = 0
for v in ("male", "female"):
    for k, vn, m1, m2, f1, f2, desc in VOW:
        _n += 1
        F1, F2 = (m1, m2) if v == "male" else (f1, f2)
        pitch = "≈120 Hz" if v == "male" else "≈210 Hz"
        _spc1.append(rec(f"SPC-01.{_n}", f"{v.title()} · {vn}", [(f"speech_voice/spc01-{v}-{k}.wav", f"{v.title()} · {vn}", "3 s", pitch, "rec")],
            context=f"Speech and Voice › <em>Vowels and Formants</em> with {vn.split(' ')[0]} selected: the tongue drawing and harmonic spectrum show F1 ≈ {F1} Hz, F2 ≈ {F2} Hz"
                    + (" (the app's teaching values)." if v == "male" else " (female voices sit about 15–20% higher than the app's male teaching values).")
                    + f" The learner plays the {v} vowel and compares it with the other four at the same pitch.",
            teaches=f"{desc} Same buzz ({pitch}) as the other {v} vowels — only the mouth shape, and so the formants, changed."
                    + (" The female version puts the formants higher and spaces the harmonics further apart, so the formant peaks are sampled more coarsely." if v == "female" else ""),
            record=f"{vn.split(' ')[0]} sustained for 3 s by the adult {v} voice at a steady monotone {pitch}.",
            how=[SPEECH_SETUP, f"Reference drone in one headphone ear ({'≈ 123 Hz / B2' if v == 'male' else '≈ 208 Hz / G♯3'}) so all five vowels share one pitch.",
                 "3 s, steady level, no vibrato, no glide in or out: start and stop cleanly.", "Peaks ≈ −6 dBFS; loudness-match the five vowels and both voices to each other (±0.5 LU)."],
            tips=["Record all five vowels of one voice in one take with 2 s gaps; cut afterwards.", "Measure the pitch of the delivered file and write it in the sidecar."],
            specs={"Channels": "Mono", "Length": "3 s", "Levels": "Peaks ≈ −6 dBFS", "Set": "MATCHED (±0.5 LU across all 10)", "Pitch": pitch, "Setup": "House speech setup: LDC 8 in, pop filter, DRY"},
            qc=["Pitch within ±10 cents of the other four vowels of this voice.", f"A pure {vn.split(' ')[0]} — no diphthong at the end" + (" (EE does not turn into EE-uh)." if k == "ee" else ".")]))
item(id="SPC-01", title="Vowels and formants", pri="P1", sess=[1], group=G,
 used="Speech &amp; Voice › <em>Vowels &amp; Formants</em>: the learner picks A, E, I, O, U (AH, EH, EE, AW, OO) and sees tongue position plus a harmonic spectrum with the formant peaks (e.g. AH F1 730 Hz, F2 1090 Hz; EE F1 270 Hz, F2 2290 Hz). Today it is silent.",
 safety=[], reuse="FND-01 voice “ah” context.", see=["SPC-02", "SPC-03", "FND-01"],
 usedin="Speech & Voice › Vowels & Formants (src/screens/lab/speech/, src/features/speech/speechModel.ts)",
 recs=_spc1)

SPC2_SPEC = {"Channels": "Mono", "Length": "3 s", "Levels": "Peaks ≈ −6 dBFS (spoken)", "Set": "FIXED-GAIN"}
_pair = [("zzz", "ZZZ (voiced)", "ZZZ — voiced S", "SSS", "S/Z: tongue near the ridge, air over the teeth.",
          "The same hiss as SSS with the vocal folds buzzing underneath: a pitched hum below about 500 Hz plus the 4–10 kHz hiss.", ["An audible pitch under the hiss."]),
         ("sss", "SSS (unvoiced)", "SSS — unvoiced", "ZZZ", "S/Z: tongue near the ridge, air over the teeth.",
          "Hiss only, no pitch: intense noise around 4–10 kHz — the sibilant a de-esser hunts.", ["No pitched buzz at all."]),
         ("vvv", "VVV (voiced)", "VVV — voiced F", "FFF", "F/V: lower lip against the upper teeth.",
          "A buzzing lip-teeth friction: weak, broad hiss on top of the pitched buzz.", ["An audible pitch under the hiss."]),
         ("fff", "FFF (unvoiced)", "FFF — unvoiced", "VVV", "F/V: lower lip against the upper teeth.",
          "A weak, broad hiss with no pitch — much quieter than SSS, one of the first sounds lost at a distance.", ["No pitched buzz; clearly quieter than SSS."]),
         ("zh", "ZH as in “measure” (voiced)", "ZH — voiced SH (“measure”)", "SH", "SH/ZH: tongue further back, wider channel.",
          "The voiced partner of SH: a lower, softer hiss than S with the pitched buzz under it.", ["An audible pitch under the hiss."]),
         ("sh", "SH (unvoiced)", "SH — unvoiced", "ZH", "SH/ZH: tongue further back, wider channel.",
          "Hiss only, and lower in frequency than S: the wider channel moves the noise down.", ["No pitched buzz; hiss audibly lower than SSS."])]
_spc2 = []
for i, (k, var, title, partner, place, teach, qc) in enumerate(_pair, 1):
    _spc2.append(rec(f"SPC-02.{i}", title, [(f"speech_voice/spc02-{k}.wav", var, "3 s", "", "rec")],
        context=f"Speech and Voice › <em>Voiced vs Unvoiced</em>: one half of the {var.split(' ')[0]}/{partner} pair (same mouth shape, folds {'on' if 'voiced)' in var and 'unvoiced' not in var else 'off'}). The learner plays the pair back to back and listens for the buzz.",
        teaches=teach, record=f"{var.split(' (')[0].split(' as')[0]} sustained for 3 s by the male voice. {place}",
        how=[SPEECH_SETUP + " One male voice.", f"Sustain 3 s, steady; keep exactly the same mouth shape as for {partner}, switching only the voice on or off.", "Same gain for the whole voiced/unvoiced block."],
        tips=[f"Record the pairs back-to-back in one take (SSS-ZZZ, FFF-VVV, SH-ZH) and cut afterwards."],
        specs=SPC2_SPEC, qc=qc + ["Steady for the full 3 s; no vowel at the start or end."]))
_spc2.append(rec("SPC-02.7", "S1 whispered", [("speech_voice/spc02-s1-whispered.wav", "S1 whispered", "6 s", "Same gain as spoken", "rec")],
    context="Speech and Voice › <em>Voiced vs Unvoiced</em>: the whole sentence with the folds switched off, played against the spoken S1.",
    teaches="A whisper is speech with no voicing anywhere: no pitch, much less level, yet the vowels are still recognisable because the mouth still shapes the noise into formants.",
    record="S1 whispered by the same male voice at the same distance.",
    how=[SPEECH_SETUP, "Whisper S1 at a natural whisper level; same distance and SAME gain as the spoken S1 (let it be quieter)."],
    tips=["Record whispered and spoken S1 back to back."],
    specs={"Channels": "Mono", "Length": "≈ 6 s", "Levels": "Same gain as the spoken S1 — naturally quieter", "Set": "FIXED-GAIN"},
    qc=["No pitched buzz at all.", "Every word still intelligible."]))
_spc2.append(rec("SPC-02.8", "S1 spoken", [("speech_voice/spc02-s1-spoken.wav", "S1 spoken", "6 s", "", "rec")],
    context="Speech and Voice › <em>Voiced vs Unvoiced</em>: the voiced reference for the whispered S1.",
    teaches="The same sentence with the folds on: a pitched buzz under every vowel and every voiced consonant (B, M, N, V, Z), against the whisper's pure noise.",
    record="S1 spoken normally by the same male voice.",
    how=[SPEECH_SETUP, "Normal speaking level; gain set here for peaks ≈ −6 dBFS."],
    tips=["Speak it first to set the gain, then whisper."],
    specs={"Channels": "Mono", "Length": "≈ 6 s", "Levels": "Peaks ≈ −6 dBFS", "Set": "FIXED-GAIN"},
    qc=["Natural, even delivery; no plosive pops."]))
item(id="SPC-02", title="Voiced versus unvoiced", pri="P1", sess=[1], group=G,
 used="Speech &amp; Voice › <em>Voiced vs Unvoiced</em>: pairs with the same mouth shape, folds off vs on (P/B, T/D, K/G, F/V, S/Z, SH/ZH, TH/TH). Today it is silent.",
 safety=[], reuse="De-Esser context.", see=["SPC-01", "SPC-03"],
 usedin="Speech & Voice › Voiced vs Unvoiced (src/screens/lab/speech/)",
 recs=_spc2)

FAM = [("plosive", "Plosives (stops)", "aPa aBa aTa aDa aKa aGa",
        "Airflow is blocked completely, pressure builds, then bursts out: a short silence, then a click plus a low blast of air. The air blast is what pops a microphone.",
        ["P and B release bursts clearly audible but no mic pops (pop filter in place)."]),
       ("fricative", "Fricatives", "aFa aVa aSa aZa aSHa aZHa aTHa (thin) aTHa (this) aHa",
        "Air forced through a narrow gap turns into continuous hiss: S and Z peak around 4–10 kHz, SH lower, F and TH weaker and broader. S and Z are what a de-esser hunts.",
        ["Each hiss distinct: S brightest, SH lower, F and TH weakest."]),
       ("affricate", "Affricates", "aCHa aJa",
        "A stop released straight into a fricative: a click then a short SH-like hiss. They can need both a pop filter and a de-esser.",
        ["Both the burst and the hiss audible in CH and J."]),
       ("nasal", "Nasals", "aMa aNa aNGa",
        "The mouth closes and the soft palate drops, so the buzz resonates out through the nose: a low hum, strong below about 500 Hz, weak highs. The first sounds to vanish in a muffled recording.",
        ["A clear hum during M, N and NG; no breath noise."]),
       ("liquid", "Liquids", "aLa aRa",
        "The tongue shapes the airway without blocking it: voiced and vowel-like, with a dip in the formants. Rarely a microphone problem.",
        ["L and R clearly different from each other."]),
       ("glide", "Glides", "aWa aYa",
        "A fast slide from one vowel shape to another: vowel-like, with moving formants. Rarely a microphone problem.",
        ["The slide is audible; no break between the vowels."])]
_spc3 = []
_n = 0
for v in ("male", "female"):
    for k, n, frames, teach, qc in FAM:
        _n += 1
        _spc3.append(rec(f"SPC-03.{_n}", f"{v.title()} · {n}", [(f"speech_voice/spc03-{v}-{k}.wav", f"{v.title()} · {n}: {frames}", "≈ 8–14 s", "1 s gap between frames", "rec")],
            context=f"Speech and Voice › <em>Consonant Families</em> with {n} selected: the page shows how the family is made and where its energy sits. The learner hears each consonant of the family between two “ah” vowels, in the {v} voice.",
            teaches=teach + (" The female voice shows the same family with a higher pitch under the voiced members." if v == "female" else ""),
            record=f"Every {n.lower().split(' (')[0][:-1]} in an “a_a” frame, in order: {frames}; {v} voice.",
            how=[SPEECH_SETUP, "Even level and pace: one frame per second with a 1 s gap; neutral stress on both syllables.", "Speak the frames in the order listed."],
            tips=["Print the frame list on a music stand at eye level so the talker does not look down off-axis.", "Record all six families for one voice in one sitting, then switch voices."],
            specs={"Channels": "Mono", "Length": "≈ 8–14 s (per family)", "Levels": "Peaks ≈ −6 dBFS", "Set": "FIXED-GAIN"},
            qc=qc + ["Every frame present and in order; no frame repeated."]))
item(id="SPC-03", title="Consonant families in an “a_a” frame", pri="P2", sess=[1], group=G,
 used="Speech &amp; Voice › <em>Consonant Families</em>: plosives, fricatives, affricates, nasals, liquids and glides, each with where its energy sits (e.g. S and Z peak around 4–10 kHz; nasals strong below 500 Hz). Today it is silent.",
 safety=[], reuse="None.", see=["SPC-02"], usedin="Speech & Voice › Consonant Families (src/screens/lab/speech/, src/features/speech/speechModel.ts)",
 recs=_spc3)

SPC4_SPEC = {"Channels": "Mono", "Levels": "Clean peaks ≈ −6 dBFS; problems ≤ −3 dBFS", "Set": "FIXED-GAIN (exceptions logged)"}
SPC4 = [("clean", "Clean reference", "6 s", "", "Clean reference — house speech setup",
         "The reference every problem is judged against: the same voice, mic and distance with nothing wrong.", "Plays alongside every problem in the simulator as the A/B partner.",
         ["House speech setup (LDC 8 in, pop filter, DRY). Set the gain here and tape it."], ["Natural, even, clear; no clicks, pops or breaths."], "DRY booth"),
        ("sibilance", "Sibilance", "6 s", "", "Sibilance",
         "Intense hiss on S, Z and SH between about 4 and 10 kHz — piercing “ess” sounds that spit. Fix: angle the mic slightly off-axis, back off, then a de-esser.", "Problem: SIBILANCE (the orange hump above 4 kHz).",
         ["Remove the pop filter; talker at 3–4 in, on-axis, with naturally strong S sounds."], ["Real, unprocessed S energy 4–10 kHz, clearly stronger than in the clean take."], "DRY booth"),
        ("plosive", "Plosive", "6 s", "", "Plosives",
         "The P and B air blast hits the capsule: low thumps and pops, one slow huge swing on the waveform. Fix: pop filter, mic slightly above or beside the mouth, high-pass.", "Problem: PLOSIVES.",
         ["Pop filter removed; talker at 3 in, on-axis."], ["Obvious thumps on P and B; no clipping."], "DRY booth"),
        ("mouth-clicks", "Mouth clicks", "6 s", "Natural clicks only", "Mouth clicks",
         "Tiny dry ticks from saliva as the tongue and lips separate — sharp spikes a close mic hears. Fix: water before the take, a little more distance, then a de-clicker.", "Problem: MOUTH CLICKS.",
         ["The talker skips water for a while beforehand; real clicks only — never added with fingers or by editing."], ["Clicks are genuine mouth clicks, audible between words."], "DRY booth"),
        ("nasality", "Nasality", "6 s", "", "Nasality",
         "Too much voice through the nose, or a mic aimed where the nasal path is loudest: a honky, pinched tone around 800 Hz–1.5 kHz. Fix: mic lower and closer to the mouth, then a narrow cut.", "Problem: NASALITY.",
         ["The talker speaks with a deliberately nasal placement, and the mic is aimed at the nose from 4 in."], ["Honky and pinched against the clean take; still clearly the same voice."], "DRY booth"),
        ("muffled", "Muffled", "6 s", "", "Muffled",
         "Something absorbs the highs: everything above about 1.5 kHz falls away and consonants blur. Fix: clear the path to the capsule first, presence lift only afterwards.", "Problem: MUFFLED.",
         ["Drape a folded thick cloth over the mic; change nothing else."], ["Dull and indistinct; nasals and consonants harder to follow."], "DRY booth"),
        ("offaxis-90", "Off-axis 90°", "6 s", "", "Off-axis 90°",
         "Speaking to the side of a directional mic: thinner, duller and quieter, with the top end falling fastest. Fix: aim the capsule at the mouth.", "Problem: OFF-AXIS.",
         ["Rotate the mic 90° away from the mouth, same 8 in distance, same gain."], ["Quieter and duller than the clean take."], "DRY booth"),
        ("distance-48in", "Excessive distance, 48 in, live room", "6 s", "Session 2", "Excessive distance — 48 in, live room",
         "Direct sound falls 6 dB per doubling while the room and noise floor do not: roomy, distant and noisy. Fix: halve the distance before touching the gain.", "Problem: EXCESSIVE DISTANCE.",
         ["Session 2, untreated medium room: same mic and same taped gain, talker 48 in from the mic."], ["Roomy and distant; clearly quieter than the clean take."], "Untreated medium room (session 2)"),
        ("breath-popping", "Popping breath", "8 s", "", "Popping breath",
         "Fast inhales and exhales straight into the capsule: gasps and whooshes between phrases. Fix: turn the head to breathe, mic beside the airflow, windscreen; edit the rest.", "Problem: POPPING BREATH.",
         ["Talker at 3 in, on-axis, with audible fast inhales and exhales between the two halves of S1."], ["Gasps and whooshes clearly audible between the halves."], "DRY booth")]
_spc4 = []
for i, (k, var, ln, note, title, teach, ctx, how1, qc, room) in enumerate(SPC4, 1):
    _spc4.append(rec(f"SPC-04.{i}", title, [(f"speech_voice/spc04-{k}.wav", var, ln, note, "rec")],
        context=f"Speech and Voice › <em>Speech Problem Simulator</em>. {ctx} The learner reads the cause, hears it against the clean reference, and picks the fix (placement first, processing second).",
        teaches=teach, record=f"S1 by the house male voice{'' if k == 'clean' else ', recorded with this one problem'}.",
        how=([] if k == "clean" else ["Same voice, mic and taped gain as SPC-04.1 (clean)."]) + how1
            + ([] if k == "clean" else ["If the take would exceed −3 dBFS at the clean gain, lower the gain and write the exact change in the sidecar."]),
        tips=(["Record the problems fresh on this setup rather than reusing MPR files: the A/B against the clean take only works with the same mic, voice and distance.",
               "Do the takes in one block; slate each problem by name."] if k == "clean" else
              ["Schedule this in session 2 with MPR-02 (same room)."] if k == "distance-48in" else ["Slate the problem by name."]),
        specs={**SPC4_SPEC, "Length": ln, "Room": room}, qc=qc + ["Unmistakable against the clean take on small speakers."] if k != "clean" else qc))
item(id="SPC-04", title="The eight speech problems", pri="P1", sess=[1, 2], group=G,
 used="Speech &amp; Voice › <em>Speech Problem Simulator</em>: the learner picks Sibilance, Plosives, Mouth clicks, Nasality, Muffled, Off-axis, Excessive distance or Popping breath and sees the cause, what you hear, what you see and the fix. Today it is silent.",
 safety=[], reuse="SPC-05 (male clean), MTR-01 speech, SPK-01 playback programme, WAV-03 playback programme.", see=["MPR-01", "MPR-02", "MPR-04a", "SPC-05"],
 usedin="Speech & Voice › Speech Problem Simulator (src/screens/lab/speech/, src/features/speech/speechModel.ts)",
 recs=_spc4)

item(id="SPC-05", title="Voices differ — male and female, matched", pri="P2", sess=[1], group=G,
 used="Speech &amp; Voice › <em>Voices Differ</em>: a chart of typical pitch and formant ranges for an adult male (≈120 Hz), adult female (≈210 Hz) and child (≈300 Hz). Today it is silent.",
 safety=[], reuse="None.", see=["SPC-04"],
 usedin="Speech & Voice › Voices Differ (src/screens/lab/speech/)",
 recs=[
  rec("SPC-05.1", "Male S1, loudness-matched (copy of SPC-04 clean)", [("speech_voice/spc05-male.wav", "Male S1, matched", "6 s", "Copy of SPC-04 clean", "edit")],
   context="The adult-male row of the <em>Voices Differ</em> chart (pitch ≈120 Hz, typical range 85–155 Hz).",
   teaches="A typical adult male: longer vocal folds vibrate more slowly and a longer vocal tract puts the formants lower. Matched loudness keeps the comparison about pitch and timbre, not level.",
   record="No new recording: a MATCHED copy of SPC-04.1 (clean).", how=["Copy SPC-04.1 and loudness-match it to −20 LUFS integrated (±0.5 LU)."],
   tips=["No new male recording needed."], specs={"Channels": "Mono", "Length": "6 s", "Set": "MATCHED, −20 LUFS ±0.5 LU"},
   qc=["Same loudness as the female file."]),
  rec("SPC-05.2", "Female S1, loudness-matched", [("speech_voice/spc05-female.wav", "Female S1, matched", "6 s", "New female take", "rec")],
   context="The adult-female row of the <em>Voices Differ</em> chart (pitch ≈210 Hz, typical range 165–255 Hz).",
   teaches="A typical adult female: shorter folds, higher pitch, and formants about 15–20% higher than the male. The numbers are typical, not labels.",
   record="S1 by the female voice on the house speech setup.", how=[SPEECH_SETUP, "Same session and setup as the male SPC-04 clean take; gain for peaks ≈ −6 dBFS.", "MATCHED: −20 LUFS integrated (±0.5 LU)."],
   tips=["Record it in the speech block right after SPC-04 clean."], specs={"Channels": "Mono", "Length": "6 s", "Set": "MATCHED, −20 LUFS ±0.5 LU"},
   qc=["Same loudness as the male file; clearly higher in pitch."]),
  rec("SPC-05.3", "Child S1, loudness-matched (OPTIONAL)", [("speech_voice/spc05-child.wav", "Child S1, matched (OPTIONAL)", "6 s", "Only with guardian consent", "opt")],
   context="The child row of the <em>Voices Differ</em> chart (≈300 Hz). Optional: the chart works without it.",
   teaches="A child's short folds and small vocal tract put both the pitch and the formants higher still.",
   record="S1 by a child voice — only with written guardian consent. Default: skip it.", how=[SPEECH_SETUP, "Only with written guardian consent on file. MATCHED to −20 LUFS (±0.5 LU)."],
   tips=["Skip unless consent is already arranged; it is optional."], specs={"Channels": "Mono", "Length": "6 s", "Set": "MATCHED, −20 LUFS ±0.5 LU"},
   qc=["Consent on file before delivery."]),
 ])

# ================================================================ DE-ESSER
DES_BASE = ["DRY booth. A bright cardioid LDC at 6 in, on-axis at mouth height.",
            "NO fabric pop filter (it dulls the highs). A thin metal-mesh filter is acceptable; otherwise none, with the talker slightly softening plosives.",
            "Performers chosen for naturally strong S sounds (auditioned on this mic). Never exaggerate S sounds.",
            "Fixed gain per voice for peaks ≈ −6 dBFS on the loudest S. No de-esser, EQ or limiter anywhere in the chain."]
DES_SPEC = {"Channels": "Mono", "Levels": "Peaks ≈ −6 dBFS", "Set": "MATCHED (±0.5 LU per voice across its four files)", "Room": "DRY"}
DES_BAND = {"male": "typical male S energy around 5–6.5 kHz (a deep male nearer 4.5 kHz)", "female": "typical female S energy around 6–8 kHz, often reaching 9 kHz"}
_des = []
_n = 0
for v in ("male", "female"):
    band = DES_BAND[v]
    _n += 1
    _des.append(rec(f"DES-01.{_n}", f"{v.title()} · “This is a sentence with essess.” (on-axis)",
        [(f"deesser/des01-{v}-essess.wav", f"{v.title()} · “This is a sentence with essess.”", "4 s", "", "rec")],
        context=f"The De-Esser lab's model phrase, on <em>What Sibilance Is</em>, <em>Threshold</em> and <em>Choosing the Frequency</em>: the learner sets the threshold so only the S sounds trigger gain reduction, and tunes the detector to the {v} voice's S band.",
        teaches=f"A short phrase packed with S sounds isolates sibilance: {band}. The learner hears exactly which syllables a de-esser should touch and which it must leave alone.",
        record=f"“This is a sentence with essess.” spoken by the {v} voice, on-axis at 6 in.",
        how=DES_BASE + ["Speak the phrase naturally three times; deliver the best single phrase."],
        tips=["Audition several talkers' S sounds on this exact mic before booking: the lesson needs real, not dramatized, sibilance.",
              f"Check the S energy on an analyser while recording ({band})."],
        specs={**DES_SPEC, "Length": "4 s"},
        qc=[f"Real, unprocessed S energy ({band}).", "Vowels clean and natural; the S sounds stand out without being forced."]))
    _n += 1
    _des.append(rec(f"DES-01.{_n}", f"{v.title()} · S1 spoken", [(f"deesser/des01-{v}-s1.wav", f"{v.title()} · S1", "6 s", "", "rec")],
        context="Normal speech for the De-Esser pages beyond the model phrase (e.g. <em>Broadband vs Split-Band</em>, <em>Over-De-Essing</em>): the learner hears what the settings do to an ordinary sentence with S, SH and plosives.",
        teaches=f"On running speech a de-esser must catch S sounds of different strengths; overdo it and the talker starts to lisp. This take shows where that line is for the {v} voice ({band}), so the detector frequency set on the model phrase is tested on real speech.",
        record=f"S1 spoken by the {v} voice, on-axis at 6 in.",
        how=DES_BASE + ["Speak S1 at a normal, even level."],
        tips=["Record straight after the essess phrase with the same gain."],
        specs={**DES_SPEC, "Length": "6 s"},
        qc=[f"S sounds bright and real ({band}); no pops on P and B even without a fabric filter."]))
    _n += 1
    _des.append(rec(f"DES-01.{_n}", f"{v.title()} · S2 sung (8 bars)", [(f"deesser/des01-{v}-s2-sung.wav", f"{v.title()} · S2 sung (8 bars)", "24 s", "", "rec")],
        context="The sung example in the De-Esser lab: a vocal where sibilance changes with level, from the soft verse to the full chorus. The learner sets a de-esser that works on both halves.",
        teaches="Singing makes sibilance harder: louder chorus S sounds hit harder, and a threshold set for the verse over-de-esses the chorus (or the reverse)."
                + (" The female sung S also feeds EQ-01e's sibilant vocal loop." if v == "female" else ""),
        record=f"The S2 melody (8 bars at 80 BPM, soft verse into full chorus) sung by the {v} voice, on-axis at 6 in.",
        how=DES_BASE + ["Singer performs the full 8 bars to a click or a guide in one headphone ear, soft verse (bars 1–4) into full chorus (bars 5–8)."],
        tips=["Record the same day as MIX-01.7 with the same singer while the voice is warm."]
             + (["EQ-01e's sibilant vocal loop is edited from this take: keep at least one clean full pass."] if v == "female" else []),
        specs={**DES_SPEC, "Length": "24 s (8 bars at 80 BPM)"},
        qc=["Real S energy in both verse and chorus; chorus S sounds stronger.", "Pitch steady; no edits inside the 8 bars."]))
    _n += 1
    _des.append(rec(f"DES-01.{_n}", f"{v.title()} · essess phrase, mic 20° off-axis (placement fix)",
        [(f"deesser/des01-{v}-essess-offaxis20.wav", f"{v.title()} · essess phrase, mic 20° off-axis (placement fix)", "4 s", "", "rec")],
        context="The placement fix the De-Esser lab teaches before any processing: the learner A/Bs it with the on-axis phrase and hears how much a small turn of the mic already achieves.",
        teaches=f"Turning a bright condenser just 20° off the mouth softens the S sounds clearly, because the highs fall first off-axis, while the vowels stay nearly the same. Placement first, de-esser second. With the {v} voice ({band}) the drop shows most in that band.",
        record=f"“This is a sentence with essess.” by the {v} voice, with the mic turned 20° horizontally away from the mouth.",
        how=DES_BASE + ["Same distance (6 in) and same gain as the on-axis phrase; turn the mic 20° horizontally away from the mouth (protractor on the stand or a marked floor line).",
                        "The talker keeps facing where the mic was; only the mic turns."],
        tips=["Record it immediately after the on-axis phrase so the performance matches."],
        specs={**DES_SPEC, "Length": "4 s", "Angle": "20° horizontally off-axis, 6 in"},
        qc=[f"Clearly softer S sounds than the {v} on-axis phrase (DES-01.{_n-3}); vowels nearly the same.", "Same delivery and pace as the on-axis take."]))
item(id="DES-01", title="Naturally sibilant dry vocal", pri="P1", sess=[1], group="De-Esser",
 used="De-Esser lab, nine pages from <em>What Sibilance Is</em> through <em>Threshold</em>, <em>Choosing the Frequency</em> (deep male ≈4.5 kHz, typical male 5–6.5 kHz, female 6–8 kHz, bright condenser 7–9 kHz), <em>Broadband vs Split-Band</em> and <em>Over-De-Essing</em>. The visual model is the phrase “This is a sentence with essess.” Today it is silent.",
 safety=[], reuse="EQ-01e sibilant vocal loop (edited from the female S2 take), Speech, Compression, Reverb, Spectrogram demo.",
 see=["EQ-01e", "SPC-04", "FX-03"],
 usedin="De-Esser lab (src/screens/lab/deesser/, src/features/deesser/deEsserModel.ts)",
 recs=_des)

# ================================================================ ENVELOPE
G = "Envelope and Transients"
ENV1_SPEC = {"Channels": "Mono", "Type": "One-shot", "Levels": "Peaks ≤ −3 dBFS", "Set": "FIXED-GAIN per instrument (not matched)", "Tail": "Full natural decay + 0.5 s room tone"}
item(id="ENV-01", title="Sound-shape gallery", pri="P2", sess=[3], group=G,
 used="Envelope &amp; Transients › <em>Common Sound Shapes</em>: snare, kick, piano, violin, trumpet and cymbal, each with its attack-decay-sustain-release outline. Today the curves are drawn but nothing plays.",
 safety=[], reuse="MTR-02 cymbal, TL-05 snare, Meter snare.", see=["ENV-02", "FX-01"],
 usedin="Envelope lab › Common Sound Shapes (src/screens/lab/envelope/, src/features/envelope/envelopeModel.ts)",
 recs=[
  rec("ENV-01.1", "Snare — single hit", [("envelope/env01-snare.wav", "Snare hit", "≈ 1.5 s", "", "rec")],
   context="The SNARE shape on <em>Common Sound Shapes</em>: the learner plays it next to its drawn envelope.",
   teaches="An instant attack and a fast decay with almost no sustain: the wires add a short noisy tail after the hit.",
   record="One medium-hard snare hit with the other drums silent, close-miked.",
   how=["Session-3 kit, snare tuned as for MIX-01; other drums and cymbals silent (choked).", "Mic: the MIX-01 snare-top dynamic, 3–5 cm above the rim.", "One hit, centre of the head; let it ring out fully."],
   tips=["Record during the session-3 drum setup, before the band arrives, to save a reset."],
   specs={**ENV1_SPEC, "Length": "≈ 1.5 s"}, qc=["Single clean hit; tail not cut.", "No other drum ringing in sympathy."]),
  rec("ENV-01.2", "Kick — single hit", [("envelope/env01-kick.wav", "Kick hit", "≈ 1.5 s", "", "rec")],
   context="The KICK shape on <em>Common Sound Shapes</em>.",
   teaches="A sharp attack and a short low-frequency decay: most of the energy is gone within a few hundred milliseconds.",
   record="One kick hit with the other drums silent, close-miked.",
   how=["Session-3 kit, kick tuned and damped as for MIX-01.", "Mic: the MIX-01 kick-inside mic through the port.", "One firm hit; let it decay fully."],
   tips=["Same setup as MIX-01.1 — record it while the kick mic is already placed."],
   specs={**ENV1_SPEC, "Length": "≈ 1.5 s"}, qc=["Single hit, no double beater bounce.", "Tail decays naturally to room tone."]),
  rec("ENV-01.3", "Piano C4 — held to full decay", [("envelope/env01-piano-c4.wav", "Piano C4 to full decay", "≈ 10–15 s", "", "rec")],
   context="The PIANO shape on <em>Common Sound Shapes</em>.",
   teaches="A struck string: a fast attack, then a long, slowly falling decay with no true sustain — the note dies away even while held.",
   record="Middle C (C4) struck once mf and held with the sustain pedal down until it fades completely.",
   how=["Acoustic piano; mic 30 cm above the hammers (cardioid condenser).", "Strike C4 mf, sustain pedal down, hands off; wait for full silence."],
   tips=["Keep the room silent for the full 10–15 s: one cough ruins the tail."],
   specs={**ENV1_SPEC, "Length": "≈ 10–15 s"}, qc=["Decays all the way to room tone; no pedal or bench noise."]),
  rec("ENV-01.4", "Violin A4 — bowed", [("envelope/env01-violin-a4.wav", "Violin A4 bowed", "≈ 5 s", "", "rec")],
   context="The VIOLIN shape on <em>Common Sound Shapes</em>.",
   teaches="A bowed note: a softer attack that swells, a steady sustain as long as the bow moves, and a short release when it stops.",
   record="A4 bowed mf for 3–4 s with a natural release.",
   how=["Mic: cardioid condenser 50 cm from the violin, above and in front.", "One even bow stroke, mf, 3–4 s, then release cleanly."],
   tips=["Record violin and trumpet back to back with the same mic stand."],
   specs={**ENV1_SPEC, "Length": "≈ 5 s"}, qc=["Steady sustain with no bow change in the middle.", "Natural release, no scratch."]),
  rec("ENV-01.5", "Trumpet A4 (concert) — held note", [("envelope/env01-trumpet-a4.wav", "Trumpet A4 (concert)", "≈ 5 s", "", "rec")],
   context="The TRUMPET shape on <em>Common Sound Shapes</em>.",
   teaches="A tongued brass note: a quick, slightly brassy attack, a steady sustain and a clean release when the air stops.",
   record="Concert A4 held mf for 3–4 s with a clean release.",
   how=["Mic: cardioid condenser or ribbon 50 cm from the bell, slightly off-axis to tame the blast.", "One tongued note, mf, 3–4 s, clean release."],
   tips=["A ribbon here gives a smoother top; note the mic used."],
   specs={**ENV1_SPEC, "Length": "≈ 5 s"}, qc=["Pitch steady at concert A4.", "Clean start and stop."]),
  rec("ENV-01.6", "Crash cymbal — full ≥ 6 s decay", [("envelope/env01-crash.wav", "Crash, full ≥ 6 s decay", "≈ 7–8 s", "", "rec")],
   context="The CYMBAL shape on <em>Common Sound Shapes</em>.",
   teaches="A crash: an explosive attack and a very long decay of bright noise — one of the longest tails in the gallery.",
   record="One medium crash hit, left to ring at least 6 s to silence.",
   how=["Mic: cardioid condenser 60 cm above the crash.", "One medium hit; do not choke it; wait for silence."],
   tips=["Record during the drum setup with the other cymbals muted."],
   specs={**ENV1_SPEC, "Length": "≈ 7–8 s"}, qc=["Decays at least 6 s before the 0.5 s of room tone.", "No stand rattle."]),
 ])

ENV2_SPEC = {"Channels": "Mono", "Length": "≈ 3 s", "Levels": "Peaks ≤ −3 dBFS", "Set": "Not matched"}
item(id="ENV-02", title="Transient types: sharp, soft, none", pri="P2", sess=[3], group=G,
 used="Envelope &amp; Transients › <em>Transient Explorer</em>: Sharp transient (≈2 ms rise), Soft transient (≈60 ms), No transient (≈400 ms swell). Today it is silent.",
 safety=[], reuse="None.", see=["ENV-01", "MTR-01"],
 usedin="Envelope lab › Transient Explorer (src/screens/lab/envelope/)",
 recs=[
  rec("ENV-02.1", "Sharp transient — woodblock (or palm-muted pick)", [("envelope/env02-sharp-woodblock.wav", "Sharp: woodblock (or muted pick)", "3 s", "", "rec")],
   context="SHARP on the <em>Transient Explorer</em> (≈2 ms rise).",
   teaches="A near-instant onset: the sound reaches full level in about 2 ms, which sits exactly on the beat and is what compressors with fast attack and gates react to first.",
   record="One woodblock hit (or a palm-muted guitar pick stroke).",
   how=["Mic: cardioid condenser 30 cm from the block, dry-ish studio room.", "One firm hit; let it ring out."],
   tips=["Record it during the session-3 percussion setup."],
   specs=ENV2_SPEC, qc=["One hit, crisp onset; no double strike."]),
  rec("ENV-02.2", "Soft transient — slow-bowed cello", [("envelope/env02-soft-cello.wav", "Soft: slow-bowed cello", "3 s", "", "rec")],
   context="SOFT on the <em>Transient Explorer</em> (≈60 ms rise).",
   teaches="A soft onset: the bow takes tens of milliseconds to bring the string up to level, so the note blooms rather than strikes and feels slightly behind the beat.",
   record="A mid-register cello note with a slow, soft bow attack.",
   how=["Mic: cardioid condenser 50 cm from the cello, aimed at the bridge area.", "Slow, gentle bow start; hold about 2 s; release."],
   tips=["Ask for a deliberately soft start — no accent."],
   specs=ENV2_SPEC, qc=["No scratch or bite at the start; the note swells in."]),
  rec("ENV-02.3", "No transient — organ chord swelling from silence", [("envelope/env02-none-organ-swell.wav", "None: organ swelling from silence", "3 s", "", "rec")],
   context="NONE on the <em>Transient Explorer</em> (≈400 ms swell).",
   teaches="No attack at all: the level rises smoothly over about 400 ms, so there is no moment a gate or compressor can catch, and the note has no clear start in time.",
   record="An organ chord rising from silence with the expression pedal.",
   how=["Drawbar organ through its own speaker (rotary off / stationary) or DI.", "Expression pedal closed; hold the chord; open the pedal over about 0.5 s from true silence."],
   tips=["Do the organ swell straight after MTR-01 (same organ setup)."],
   specs=ENV2_SPEC, qc=["Starts in true silence; no key click at the onset."]),
 ])

item(id="ENV-03", title="Duration ladder: finger snap and a spoken phrase", pri="P3", sess=[1], group=G,
 used="Envelope &amp; Transients › <em>How Long Does a Sound Last?</em>: a ladder from impulse (finger snap ≈12 ms) to short, medium (a spoken word), long and continuous; the explorer also shows the syllables of “pro-fes-sion-al au-di-o”. Today it is silent.",
 safety=[], reuse="None.", see=["ENV-01"], usedin="Envelope lab › Duration (src/screens/lab/envelope/)",
 recs=[
  rec("ENV-03.1", "Finger snap", [("envelope/env03-finger-snap.wav", "Finger snap", "≈ 1 s", "", "rec")],
   context="The IMPULSE rung of the duration ladder (≈12 ms).",
   teaches="An impulse: nearly all of the sound happens in about a hundredth of a second — the shortest sound on the ladder.",
   record="One finger snap 30 cm from the mic.",
   how=["House speech setup in the booth (LDC; pop filter moved aside).", "One crisp snap at 30 cm, on-axis."],
   tips=["Record during the speech block of session 1."],
   specs={"Channels": "Mono", "Length": "≈ 1 s", "Levels": "Snap ≤ −3 dBFS"}, qc=["A single crisp click; no second snap or finger rub."]),
  rec("ENV-03.2", "Spoken “professional audio”", [("envelope/env03-professional-audio.wav", "“professional audio”", "≈ 2 s", "", "rec")],
   context="The MEDIUM rung and the syllable explorer: the page splits “pro-fes-sion-al au-di-o” into its syllables over the waveform.",
   teaches="A spoken phrase is a chain of short envelopes, one per syllable, each a few hundred milliseconds long.",
   record="The words “professional audio”, spoken clearly at a normal pace.",
   how=["House speech setup in the booth (LDC 8 in, pop filter).", "Clear, normal pace; slight separation between syllables, no exaggeration."],
   tips=["Record straight after the snap."],
   specs={"Channels": "Mono", "Length": "≈ 2 s", "Levels": "Peaks ≈ −6 dBFS"}, qc=["All six syllables clearly separate on the waveform."]),
 ])
