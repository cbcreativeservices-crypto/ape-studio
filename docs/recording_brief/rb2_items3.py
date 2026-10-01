# -*- coding: utf-8 -*-
# Recording brief item data, part 3 (Sound Systems .. Other), v2 schema.
# One rec per DISTINCT recording. Files share a rec only when they are the same
# performance/method, the same context and the same teaching point (alternate
# takes, or derived copies that keep the content).
# file tuple: (filename, variant, length, notes, kind)  kind: rec | edit | reuse | opt | hold
try:
    from rb2_items1 import item, rec
except ImportError:  # stand-alone load while rb2_items1 is being written
    ITEMS = []

    def item(**k):
        if "files" not in k:
            k["files"] = [f for r in k.get("recs", []) for f in r["files"]]
        ITEMS.append(k)

    def rec(rid, title, files, context, teaches, record, how, tips, specs, qc, safety=None):
        d = dict(rid=rid, title=title, files=list(files), context=context, teaches=teaches, record=record,
                 how=list(how), tips=list(tips), specs=dict(specs), qc=list(qc))
        if safety:
            d["safety"] = list(safety)
        return d


SAFE2 = ["SAFE-2 — mandatory: console post-fader direct out (line), never acoustic capture; brick-wall limiter on the wedge amp; a second person cuts any ring within 1 s; −25 dB plugs for everyone; never chase a full howl."]
SAFE1 = ["SAFE-1 — line capture, gain at minimum first, limiter on the monitor bus. NEVER lift or defeat a mains safety earth; hum is made and fixed on the signal side only (isolation transformer or DI ground-lift)."]
SAFE3 = ["SAFE-3 — mandatory: NO loudspeakers anywhere in the path (recorder only), preamp at minimum gain, robust condenser only, never phantom on a ribbon or unbalanced gear, let phantom drain between takes."]
DUMMY = ["Amplifier clipping: into a dummy load through a rated attenuator ONLY — never real speakers. The load's power rating must exceed the amp's output with margin."]

# ================================================================ SOUND SYSTEMS
G = "Sound Systems"

# ---------------------------------------------------------------- SS-01
FB_HOW_RIG = [
    "Venue PA session. One vocal dynamic on a stand 1 m in front of a wedge, aimed slightly off the wedge's null so it CAN ring. The talker speaks S1 continuously, 5–10 cm from the mic.",
    "Before anything else: a brick-wall limiter on the wedge amp, set well below the drivers' ratings; a second person whose ONLY job is the wedge mute; −25 dB plugs on everyone.",
    "Record the console channel's post-fader direct output (LINE) into the recorder. No room mic — or one at a safe level only.",
]
recs = [
    rec(rid="SS-01.1", title="≈ 2.5 kHz, severity 1 — the ringy tail on speech",
        files=[("sound_systems/ss01-feedback-2k5-ringy.wav", "≈ 2.5 kHz · severity 1: ringy tail on speech", "4–6 s", "", "rec")],
        context="The first warning state on the Feedback control page: as the learner pushes the wedge SEND up, this is what speech turns into just before a ring takes hold. It is also the opening sound of the fault-bench symptom “a ring starts every time the singer's wedge comes up”, and the first wedge the learner hears in Soundcheck.",
        teaches="The early warning, in the presence band where vocal mics and wedges both peak: every word leaves a short metallic, hollow tail, but nothing sustains yet. The learner learns to act on THIS sound, not on the howl.",
        record="S1 speech into the vocal mic with the wedge send raised just to the point where each word leaves a ringing tail near 2.5 kHz; hold about 3 s, then pull the send back.",
        how=FB_HOW_RIG + [
            "Steer the ring: a broad ≈ +6 dB boost at 2.5 kHz on the wedge's graphic EQ. Log it.",
            "Raise the send slowly while the talker speaks. Stop the moment the words grow a ringing tail. Hold ≈ 3 s, then pull the send back by 3 dB.",
            "Write down the send position where the tail started — SS-01.2 starts from it."],
        tips=["Record SS-01.1 and SS-01.2 back to back without touching the mic, the EQ or the talker's position.",
              "Slate “2.5 k, severity 1” before every take.",
              "Take three or four passes and keep the one where the tail is clear but never sustains."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "≈ +6 dB broad boost at 2.5 kHz on the wedge EQ"},
        qc=["Every word ends in an audible ringing tail; no tone sustains between words.",
            "On a spectrum view, the tail sits within about a third-octave of 2.5 kHz.",
            "Peaks never above −6 dBFS; no limiter pumping on the speech itself."],
        safety=SAFE2),
    rec(rid="SS-01.2", title="≈ 2.5 kHz, severity 2 — the ring builds and is cut within 1 s",
        files=[("sound_systems/ss01-feedback-2k5-build.wav", "≈ 2.5 kHz · severity 2: build, cut within 1 s", "4–6 s", "", "rec")],
        context="The danger state on the Feedback control page: the ring stops decaying and starts to grow. This exact file is also the Spectrogram tool's feedback demo (TL-02), where the ring shows as one bright horizontal line growing out of the speech.",
        teaches="What the moment of no return sounds like — a single tone that sustains and gets louder on its own — and that a cut within 1 s stops it before it becomes a howl. Severity 1 only rings; this one feeds itself.",
        record="Same set-up as SS-01.1, the send raised a little past the severity-1 mark until a 2.5 kHz tone starts to build; the second person mutes within 1 s.",
        how=["Same rig and 2.5 kHz steering as SS-01.1; do not move anything.",
             "Start at the severity-1 send position, then raise it 1–2 dB at a time while the talker speaks.",
             "When a tone starts to sustain and climb, the mute person cuts the wedge within 1 s. Keep recording ≈ 1 s after the cut so the stop is in the file."],
        tips=["Rehearse the mute once at low level before the real take.", "This is the TL-02 file: keep the speech before the build at least 2 s long so the spectrogram shows speech first, then the line.", "Slate “2.5 k, severity 2”."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "As SS-01.1"},
        qc=["A tone clearly builds (gets louder on its own) and stops within 1 s of starting to build.",
            "The tone measures within about a third-octave of 2.5 kHz.",
            "Peaks never above −6 dBFS — the build must not clip."],
        safety=SAFE2),
    rec(rid="SS-01.3", title="≈ 250 Hz, severity 1 — a low ringy tail",
        files=[("sound_systems/ss01-feedback-250-ringy.wav", "≈ 250 Hz · severity 1: ringy tail on speech", "4–6 s", "", "rec")],
        context="The low-frequency version of the warning on the Feedback control page. The learner hears that rings are not always high and whistly; it is used so the notching exercise has a low ring to find as well as a high one.",
        teaches="A low ring sounds like a droning, boomy hang-over on the voice — easy to mistake for room boom. Hearing it next to SS-01.1 teaches that the ear has to search the whole spectrum, not just the top.",
        record="Same rig as SS-01.1, but steered to ≈ 250 Hz: speech with a low ringing tail, held about 3 s, then pulled back.",
        how=["Same rig as SS-01.1. Remove the 2.5 kHz boost; put a broad ≈ +6 dB boost at 250 Hz on the wedge graphic EQ. Log it.",
             "Raise the send until the words leave a low, droning tail. Hold ≈ 3 s, pull back 3 dB. Note the send position for SS-01.4."],
        tips=["Record straight after SS-01.1/.2 with the same talker — only the EQ steering changes.", "Low rings need more send; watch the wedge limiter's gain-reduction light — if it is working, back off.", "Slate “250, severity 1”."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "≈ +6 dB broad boost at 250 Hz"},
        qc=["Each word leaves a low droning tail; nothing sustains between words.", "The tail measures within about a third-octave of 250 Hz.", "Peaks never above −6 dBFS."],
        safety=SAFE2),
    rec(rid="SS-01.4", title="≈ 250 Hz, severity 2 — a low ring builds, cut within 1 s",
        files=[("sound_systems/ss01-feedback-250-build.wav", "≈ 250 Hz · severity 2: build, cut within 1 s", "4–6 s", "", "rec")],
        context="The low ring in its danger state, for the Feedback control page and the fault-bench ring symptom. It gives the learner a low build to compare with the 2.5 kHz build (SS-01.2).",
        teaches="A low ring builds more slowly and sounds like a swelling hum rather than a whistle — but it is the same runaway, and it is cut the same way.",
        record="Same rig and 250 Hz steering as SS-01.3; send raised past the severity-1 mark until the low tone builds; muted within 1 s.",
        how=["Same rig and steering as SS-01.3.", "Raise the send 1–2 dB at a time from the severity-1 mark until the low tone sustains and climbs; mute within 1 s; record ≈ 1 s past the cut."],
        tips=["Do it immediately after SS-01.3.", "Slate “250, severity 2”."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "As SS-01.3"},
        qc=["A low tone audibly builds and is stopped within 1 s.", "It measures within about a third-octave of 250 Hz.", "Peaks never above −6 dBFS."],
        safety=SAFE2),
    rec(rid="SS-01.5", title="≈ 1 kHz (third frequency), severity 1 — a mid ringy tail",
        files=[("sound_systems/ss01-feedback-1k-ringy.wav", "≈ 1 kHz (third frequency) · severity 1: ringy tail on speech", "4–6 s", "", "rec")],
        context="The third ring on the Feedback control page, so the learner meets a high, a low and a midrange ring before the ring-out. It sits between the other two so the learner has to listen for it rather than guess.",
        teaches="A midrange ring has a nasal, “honky” or telephone-like tail — a different colour again from the whistle (2.5 kHz) and the drone (250 Hz).",
        record="Same rig as SS-01.1, steered to around 1 kHz: speech with a mid ringing tail, held about 3 s, then pulled back.",
        how=["Same rig as SS-01.1. Remove the other boosts; a broad ≈ +6 dB boost around 1 kHz on the wedge graphic EQ. Log the exact band you used.",
             "Raise the send until the words leave a nasal ringing tail; hold ≈ 3 s; pull back 3 dB; note the position for SS-01.6."],
        tips=["Record after the 250 Hz pair, same talker, same mic.", "Log the measured ring frequency in the sidecar — it does not need to be exactly 1 kHz.", "Slate “1 k, severity 1”."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "≈ +6 dB broad boost around 1 kHz"},
        qc=["Words leave a nasal ringing tail; nothing sustains between words.", "The measured ring frequency is logged and is clearly between the 250 Hz and 2.5 kHz rings.", "Peaks never above −6 dBFS."],
        safety=SAFE2),
    rec(rid="SS-01.6", title="≈ 1 kHz (third frequency), severity 2 — a mid ring builds, cut within 1 s",
        files=[("sound_systems/ss01-feedback-1k-build.wav", "≈ 1 kHz (third frequency) · severity 2: build, cut within 1 s", "4–6 s", "", "rec")],
        context="The midrange ring in its danger state, completing the three-frequency set on the Feedback control page and the fault bench.",
        teaches="With three builds in hand the learner hears that the runaway always sounds the same (one tone growing on its own) whatever its pitch — the pitch only tells you WHERE to notch.",
        record="Same rig and steering as SS-01.5; send raised past the severity-1 mark until the mid tone builds; muted within 1 s.",
        how=["Same rig and steering as SS-01.5.", "Raise the send 1–2 dB at a time from the severity-1 mark; mute within 1 s of the build; record ≈ 1 s past the cut."],
        tips=["Do it immediately after SS-01.5, then remove ALL steering boosts ready for SS-01.7.", "Slate “1 k, severity 2”."],
        specs={"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Steering": "As SS-01.5"},
        qc=["A mid tone audibly builds and is stopped within 1 s.", "Its frequency matches the one logged for SS-01.5.", "Peaks never above −6 dBFS."],
        safety=SAFE2),
    rec(rid="SS-01.7", title="Ring-out sequence — each ring notched in turn until stable",
        files=[("sound_systems/ss01-ringout-sequence.wav", "Ring-out: each ring notched in turn until stable", "≈ 10 s (longer allowed)", "Log the notch frequencies", "rec")],
        context="The procedure the Feedback control page asks the learner to perform: raise the send, find the ring, notch it, raise again. Also the professional answer to the fault-bench ring symptom and the Soundcheck wedge-by-wedge step.",
        teaches="Ring-out as a method: each notch buys a few dB more gain before the next frequency rings. The learner hears 3 to 5 rings appear and disappear in turn until the mic is stable at a higher gain.",
        record="One continuous capture of a real ring-out on the flat wedge (no steering boosts): ring, notch, raise, next ring — 3 to 5 notches — until stable.",
        how=["Same rig as SS-01.1 with ALL steering boosts removed (wedge EQ flat).",
             "Talker speaks S1 throughout. Raise the send until something rings (severity 1 is enough); identify it and pull that band on the wedge graphic EQ (or a parametric notch, about −6 dB, narrow).",
             "Raise the send again until the next ring; notch it. Repeat for 3 to 5 notches, until a further 2–3 dB of send no longer rings.",
             "Capture the whole sequence as one file. Log each ring frequency and the cut depth, with the time it happened in the file."],
        tips=["The sequence can run longer than 10 s — deliver it whole; production will trim.", "Do not call the frequencies aloud — the mic is live and on the line. Write them down.", "Leave the final EQ in place for SS-01.8."],
        specs={"Channels": "Mono", "Length": "≈ 10 s (longer allowed)", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)", "Log": "Ring frequencies, cut depths and file times"},
        qc=["3 to 5 separate rings are audible, each removed by a notch before the next appears.", "No ring is allowed to build for more than 1 s.", "The notch log matches what is heard (spot-check two on a spectrum)."],
        safety=SAFE2),
    rec(rid="SS-01.8", title="Speech at the final gain-before-feedback",
        files=[("sound_systems/ss01-speech-final-gain.wav", "Speech at the final gain-before-feedback", "6–8 s", "", "rec")],
        context="The pay-off at the end of the Feedback control page and Soundcheck: the wedge after the ring-out, loud and clean. It is the “after” the learner compares with SS-01.1.",
        teaches="What a properly rung-out wedge sounds like — more level than the severity-1 take with no tail on any word.",
        record="S1 speech at the final send position reached in SS-01.7, with the notches in place.",
        how=["Straight after SS-01.7: leave the notches and the send exactly where the ring-out ended (or 2–3 dB below the last ring, the usual working margin).",
             "The talker reads S1 at a natural level for 6–8 s."],
        tips=["Record it in the same breath as SS-01.7 — the set-up is already correct.", "Note the final send in dB relative to the SS-01.1 tail position: the gain gained is the lesson."],
        specs={"Channels": "Mono", "Length": "6–8 s", "Levels": "Peaks ≤ −6 dBFS at the recorder", "Capture": "Console post-fader direct out (LINE)"},
        qc=["No ringing tail on any word.", "The send gain is higher than in SS-01.1 (logged).", "Peaks never above −6 dBFS."],
        safety=SAFE2),
]
item(id="SS-01", title="Feedback: onset and ring-out", pri="P1", sess=[5], group=G,
     used="Sound Systems › <em>Feedback control</em> (learner raises the wedge SEND, moves the mic to the wedge's null or a live spot, and notches a ring), <em>Soundcheck</em> (wedge by wedge) and the fault bench's “a ring starts every time the singer's wedge comes up”. Also the Spectrogram tool demo (TL-02). Today there is no audio at all.",
     recs=recs, safety=SAFE2,
     reuse="TL-02 Spectrogram demo (SS-01.2), MTR-02 feedback spectrum, MPR-06 optional cupped feedback.", see=["SS-02E", "TL-02", "MPR-06"],
     usedin="Sound Systems › Feedback control, Soundcheck, fault bench (src/screens/lab/soundsystems/pagesLearnC.tsx, pagesOperate.tsx, src/features/soundsystems/faults.ts)")

# ---------------------------------------------------------------- SS-02E (electronic faults, line capture)
E_RIG = "Bench rig: console → stereo system processor → two-channel power amp → two dummy loads, each through a rated attenuator. Record the console main L/R (LINE) unless the step says otherwise. Programme: the house song (MIX-01 stems through the console, or MST-01.1) at a typical show level."
E_SPECS = {"Channels": "Stereo", "Length": "8 s", "Levels": "Peaks ≤ −3 dBFS", "Capture": "LINE", "Set": "Fault and good partner LUFS-matched (±0.5 LU)"}
E_TIPS_GOOD = "Record the good partner FIRST, then introduce the fault without touching anything else."


def ef(k, fault_label, good_note="Same programme, same moment"):
    return (("sound_systems/ss02-%s-fault.wav" % k, fault_label, "8 s", "", "rec"),
            ("sound_systems/ss02-%s-good.wav" % k, "Healthy A/B partner for %s" % k, "8 s", good_note, "rec"))


fa, ga = ef("amp-clip", "“It gets harsh and nasty as soon as the band gets loud.” — power amp clipping (dummy load)")
fl, gl = ef("limiter", "“It will not get loud. It just sounds squashed.” — system limiter squash (NOT loudness-matched)")
fh, gh = ef("hum-keys", "“There is a hum on the keyboards.” — hum on a keyboard DI")
fg, gg = ef("ground-loop", "“A hum that is there even when everything is muted.” — ground loop")
fi, gi = ef("intermittent", "“The bass keeps dropping out. Sometimes it crackles.” — intermittent crackle and dropout")
fc, gc = ef("clocking", "“Clicks and pops, every few seconds, on every channel.” — clock clicks")
fn, gn = ef("network", "“The whole PA drops out for a second, then comes back.” — 1 s network dropout")
fd, gd = ef("left-dead", "“Only the right side is playing.” — left side dead")
fp, gp = ef("pre-post", "“When I pull the vocal down, the reverb stays just as loud.” — reverb send pre-fader")

recs = [
    rec(rid="SS-02E.1", title="Amp clip — fault", files=[fa],
        context="Fault-bench card “It gets harsh and nasty as soon as the band gets loud.” The learner plays it before walking the chain; the answer is the amplifier, the first station with no headroom left.",
        teaches="Power-amp clipping on real programme: the loud passages turn gritty, flat and bright while the quiet ones stay clean — the sound of the last stage running out of headroom.",
        record="The house song through the bench rig with the amplifier driven into clipping on the loud passages, into the dummy loads; captured at the attenuator outputs.",
        how=[E_RIG, "For this pair, record the ATTENUATOR outputs (after the amp), not the console.",
             "Good partner first (SS-02E.2). Then raise the amp input (or processor output) until the clip lights flash on every loud beat. Nothing else changes.",
             "Re-trim the recorder only if it would clip; then loudness-match to the partner (±0.5 LU)."],
        tips=[E_TIPS_GOOD, "Shares the dummy-load set-up with AMP-01 — do both on the same bench pass."],
        specs=dict(E_SPECS, Capture="Attenuator output after the amp (LINE)"),
        qc=["Distortion is obvious on loud beats and absent in quiet ones.", "Loudness within ±0.5 LU of SS-02E.2.", "Nothing clips in the recorder — the distortion is the amp's."],
        safety=DUMMY),
    rec(rid="SS-02E.2", title="Amp clip — healthy partner", files=[ga],
        context="The A/B reference the learner flips to on the amp-clip card, so the fault is heard against the same system working properly.",
        teaches="The same loud passage with the amp below clipping (the processor's limiter, not the amp, is the last thing to act) — clean at the same loudness.",
        record="The same programme moment through the same rig, amp input set so the clip lights never flash.",
        how=[E_RIG, "Capture at the attenuator outputs, same as SS-02E.1. Amp gain set so that no clip light flashes on the loudest beat."],
        tips=["Record this before SS-02E.1, then only turn the amp up."],
        specs=dict(E_SPECS, Capture="Attenuator output after the amp (LINE)"),
        qc=["No audible distortion anywhere.", "Same programme moment as SS-02E.1."],
        safety=DUMMY),
    rec(rid="SS-02E.3", title="Limiter squash — fault", files=[fl],
        context="Fault-bench card “It will not get loud. It just sounds squashed.” The processor's limiter, set for a smaller box, is shaving every peak.",
        teaches="Over-limiting: the mix stops getting louder, transients go flat and the kick loses its punch. This is the ONE pair that is not loudness-matched — the lost loudness is the symptom.",
        record="The house song through the rig with the processor's limiter thresholds set far too low (as a preset for a smaller cabinet would be), driven hard.",
        how=[E_RIG, "Good partner first (SS-02E.4) with correct limiter thresholds.",
             "Lower the processor limiter thresholds by about 10–12 dB (or load a preset for a much smaller cabinet). Keep the console level identical.",
             "Do NOT loudness-match: keep the recorder gain fixed between the pair."],
        tips=[E_TIPS_GOOD, "Photograph the limiter page in both states for the sidecar."],
        specs=dict(E_SPECS, Set="FIXED-GAIN with its partner — NOT loudness-matched"),
        qc=["Clearly quieter and flatter than SS-02E.4, with dull transients.", "Recorder gain identical to SS-02E.4 (log it)."]),
    rec(rid="SS-02E.4", title="Limiter squash — healthy partner", files=[gl],
        context="The A/B reference on the limiter card: the same system with limiters set for the cabinets actually in use.",
        teaches="With the right thresholds the limiter only touches the odd peak; the mix gets loud and keeps its punch.",
        record="Same programme moment, processor limiter thresholds correct for the cabinets.",
        how=[E_RIG, "Correct thresholds (manufacturer's data for this amp and cabinet). Same console level and recorder gain as SS-02E.3."],
        tips=["Record first; then only change the limiter thresholds."],
        specs=dict(E_SPECS, Set="FIXED-GAIN with its partner — NOT loudness-matched"),
        qc=["Louder and punchier than SS-02E.3 at the same recorder gain."]),
    rec(rid="SS-02E.5", title="Hum on the keyboards — fault", files=[fh],
        context="Fault-bench card “There is a hum on the keyboards.” The keyboard is clean at its source; the hum is picked up by a long unbalanced cable run to the stagebox.",
        teaches="Hum that lives on ONE channel and comes and goes with that channel's fader: the keys sit in a bed of 60 Hz hum and buzz while the rest of the band is clean.",
        record="The house song through the console with the keys channel fed over a long unbalanced (TS) run laid beside power and lighting cable.",
        how=[E_RIG, "Keys source: a keyboard, or a playback device standing in for it playing the MIX-01 keys stem, on a 10–15 m TS cable run to the stagebox alongside mains or dimmer cable.",
             "All gear on properly earthed outlets. The hum comes from the unbalanced run, not from any change to an earth.",
             "Good partner first (SS-02E.6), then swap only the cable."],
        tips=[E_TIPS_GOOD, "Shares the dimmer/cable layout with CAB-02 — set both up together on the bench day."],
        specs=E_SPECS,
        qc=["Hum/buzz clearly on the keys and nowhere else (it follows the keys fader).", "Loudness within ±0.5 LU of SS-02E.6."],
        safety=SAFE1),
    rec(rid="SS-02E.6", title="Hum on the keyboards — healthy partner", files=[gh],
        context="The A/B reference on the keys-hum card: the professional fix in place.",
        teaches="With a DI box at the keyboard and a balanced XLR run, the same long cable path is silent.",
        record="Same programme moment with the keys fed through a DI box at the keyboard and an XLR run along the same route.",
        how=[E_RIG, "Replace the TS run with a DI at the keyboard and a balanced XLR along the identical route. Use the DI's ground-lift switch only if a loop remains — never lift a mains earth."],
        tips=["Record first; then swap to the TS run for SS-02E.5."],
        specs=E_SPECS, qc=["No hum on the keys."], safety=SAFE1),
    rec(rid="SS-02E.7", title="Ground loop — fault", files=[fg],
        context="Fault-bench card “A hum that is there even when everything is muted.” Hum that survives muting every channel is current flowing between two grounds through a cable shield, not signal.",
        teaches="The tell of a ground loop: the music stops, the hum doesn't. The learner hears the programme with hum underneath, then every channel muted and the hum still there.",
        record="About 4 s of programme with a ground-loop hum under it, then every console channel muted for the last 4 s while the hum carries on.",
        how=[E_RIG, "Make the loop safely as in CAB-01: two mains-earthed devices on properly earthed outlets with separate earth paths, joined by an unbalanced link into the system. Never lift or defeat a mains earth.",
             "Play the programme for ≈ 4 s, then mute all channels (or the master) — the hum stays.",
             "Loudness-match the pair on the first 4 s (the programme part)."],
        tips=[E_TIPS_GOOD, "Same rig as CAB-01 and the NOI-01b/EAR-04 ground-loop takes — record them in one block."],
        specs=dict(E_SPECS, Set="LUFS-matched to its partner on the programme section (first ≈ 4 s)"),
        qc=["The hum continues, unchanged, after everything is muted.", "Hum is mains frequency (60 Hz plus harmonics)."],
        safety=SAFE1),
    rec(rid="SS-02E.8", title="Ground loop — healthy partner", files=[gg],
        context="The A/B reference on the ground-loop card.",
        teaches="With the loop broken on the signal side (isolation transformer), muting everything gives silence — only the noise floor.",
        record="Same programme moment and the same mute at ≈ 4 s, with an audio isolation transformer in the link.",
        how=[E_RIG, "Insert an audio isolation transformer in the offending link (or use a DI ground-lift). Play ≈ 4 s, mute everything at the same moment as SS-02E.7."],
        tips=["Record first, then remove the transformer for SS-02E.7."],
        specs=dict(E_SPECS, Set="LUFS-matched to its partner on the programme section"),
        qc=["After the mute: noise floor only, no hum."], safety=SAFE1),
    rec(rid="SS-02E.9", title="Intermittent crackle and dropout — fault", files=[fi],
        context="Fault-bench card “The bass keeps dropping out. Sometimes it crackles.” The cable at the bass DI is failing; the tell is that the fault follows movement.",
        teaches="An intermittent: the bass crackles and cuts in and out irregularly while everything else plays on — a fault that hides from a resting test.",
        record="The house song with the bass channel fed through a genuinely faulty cable at the DI, flexed by hand during the take.",
        how=[E_RIG, "Bass DI → a genuinely faulty XLR (broken shield strands or a loose pin) → stagebox. Flex the cable near its connector during the 8 s, irregularly, so it crackles and drops out 2–3 times.",
             "Good partner first (SS-02E.10) with a good cable flexed the same way."],
        tips=[E_TIPS_GOOD, "Use the same faulty cables as CAB-03 — label them and keep them out of service afterwards."],
        specs=E_SPECS, qc=["Bass alone crackles and drops out 2–3 times; nothing else is affected.", "Loudness within ±0.5 LU of SS-02E.10."], safety=SAFE1),
    rec(rid="SS-02E.10", title="Intermittent — healthy partner", files=[gi],
        context="The A/B reference on the intermittent card.", teaches="The same flexing on a good cable changes nothing.",
        record="Same programme moment, a good cable at the bass DI flexed the same way.",
        how=[E_RIG, "Good XLR at the bass DI, flexed by hand in the same way as SS-02E.9."],
        tips=["Record first."], specs=E_SPECS, qc=["Bass steady throughout; no crackle."], safety=SAFE1),
    rec(rid="SS-02E.11", title="Clock clicks — fault", files=[fc],
        context="Fault-bench card “Clicks and pops, every few seconds, on every channel at once.” Two digital devices each believe they are clock master.",
        teaches="A clocking fault: small clicks and ticks, every few seconds, on every channel at the same instant — unlike a bad cable, which hits one channel.",
        record="The house song with a digital device on its own internal clock feeding the console.",
        how=[E_RIG, "Feed the programme from a digital device (interface, stagebox or player) over AES or a digital link, set to its INTERNAL clock while the console is also master (or at a mismatched rate on a non-converting input).",
             "Check you hear periodic clicks across the whole mix; capture 8 s.",
             "Good partner first (SS-02E.12) with the device slaved to the console."],
        tips=[E_TIPS_GOOD, "Batch with the EAR-04 clock-slip take — same rig."],
        specs=E_SPECS, qc=["Clicks audible every few seconds on the whole mix.", "Loudness within ±0.5 LU of SS-02E.12."], safety=SAFE1),
    rec(rid="SS-02E.12", title="Clock clicks — healthy partner", files=[gc],
        context="The A/B reference on the clocking card.", teaches="One clock master, every other device slaved: the same digital link is click-free.",
        record="Same programme moment with the device slaved to the console's clock.",
        how=[E_RIG, "Set the digital device to external/word clock from the console (one master). Confirm matching sample rates."],
        tips=["Record first."], specs=E_SPECS, qc=["No clicks anywhere in 8 s."], safety=SAFE1),
    rec(rid="SS-02E.13", title="Network dropout — fault", files=[fn],
        context="Fault-bench card “The whole PA drops out for a second, then comes back.” The stagebox is where all channels share one network path.",
        teaches="A network interruption: the WHOLE system goes silent at once for about a second and comes back — every channel, not one.",
        record="The house song over a networked stagebox or audio stream, with the network link interrupted for about 1 s.",
        how=[E_RIG, "Run the programme over a networked stagebox or audio-over-IP stream into the console.",
             "Interrupt the link for ≈ 1 s (pull and re-seat the cable, or disable/enable the switch port). Some systems take longer than 1 s to resync — check the gap and retake until it is ≈ 1 s.",
             "Good partner first (SS-02E.14)."],
        tips=[E_TIPS_GOOD, "A managed switch with a port toggle gives the most repeatable 1 s gap."],
        specs=E_SPECS, qc=["One full-system dropout of about 1 s, then the programme returns.", "Loudness within ±0.5 LU of SS-02E.14 on the audible parts."], safety=SAFE1),
    rec(rid="SS-02E.14", title="Network dropout — healthy partner", files=[gn],
        context="The A/B reference on the network card.", teaches="The same networked path, uninterrupted.",
        record="Same programme moment with the network link intact.", how=[E_RIG, "Link untouched for 8 s."],
        tips=["Record first."], specs=E_SPECS, qc=["No gap."], safety=SAFE1),
    rec(rid="SS-02E.15", title="Left side dead — fault", files=[fd],
        context="Fault-bench card “Only the right side is playing.” Console and processor show both sides; the left amp channel has gone into protect.",
        teaches="A dead side on stereo playback: everything collapses into the right ear — the learner hears the image lean hard right and the left channel go to nothing.",
        record="The house song captured after the amps (attenuator outputs), with the left amp channel silent.",
        how=[E_RIG, "For this pair, record the ATTENUATOR outputs (after the amps).",
             "Good partner first (SS-02E.16). Then switch off (or pull the input of) the left amp channel only. Leave the right untouched."],
        tips=[E_TIPS_GOOD], specs=dict(E_SPECS, Capture="Attenuator outputs after the amps (LINE)", Set="LUFS-matched on the right channel"),
        qc=["Left channel truly silent (noise floor only).", "Right channel identical in level to the partner."], safety=DUMMY),
    rec(rid="SS-02E.16", title="Left side dead — healthy partner", files=[gd],
        context="The A/B reference on the left-dead card.", teaches="Both sides playing: a normal stereo image.",
        record="Same programme moment, both amp channels running.", how=[E_RIG, "Attenuator outputs after both amps, both channels on."],
        tips=["Record first."], specs=dict(E_SPECS, Capture="Attenuator outputs after the amps (LINE)"), qc=["Both channels present and balanced."], safety=DUMMY),
    rec(rid="SS-02E.17", title="Reverb send pre-fader — fault", files=[fp],
        context="Fault-bench card “When I pull the vocal down, the reverb stays just as loud.” The vocal's reverb send (Aux 5) is set pre-fader.",
        teaches="A pre-fader effects send: the dry vocal disappears when its fader comes down but the reverb carries on at full level — a ghost vocal made only of reverb.",
        record="Lead vocal (MIX-01 lead stem) with a reverb return, the vocal fader pulled down mid-clip while its reverb send is PRE-fader.",
        how=[E_RIG, "Programme for this pair: the MIX-01.7 lead vocal stem (with the band underneath at a low level) and a hall reverb on a return.",
             "Set the vocal's reverb send PRE-fader. At ≈ 3 s pull the vocal fader smoothly to −∞ over about 1 s; leave the reverb return alone.",
             "Good partner first (SS-02E.18) with the send POST-fader and the same fader move."],
        tips=[E_TIPS_GOOD, "Use a fader-automation pass so the move is identical in both takes."],
        specs=dict(E_SPECS, Set="LUFS-matched on the first 3 s (before the fader move)"),
        qc=["After the fader move: reverb alone at undiminished level.", "The fader move happens at the same moment as in SS-02E.18."]),
    rec(rid="SS-02E.18", title="Reverb send pre-fader — healthy partner", files=[gp],
        context="The A/B reference on the pre/post card.", teaches="With the send post-fader, the reverb follows the vocal down and away.",
        record="Same programme and identical fader move with the reverb send POST-fader.",
        how=[E_RIG, "Send POST-fader; same automated fader move at ≈ 3 s."],
        tips=["Record first."], specs=dict(E_SPECS, Set="LUFS-matched on the first 3 s"), qc=["Reverb falls with the vocal fader."]),
]
item(id="SS-02E", title="Fault bench symptoms — electronic faults (line capture)", pri="P2", sess=[4], group=G,
     used="Sound Systems › troubleshooting fault bench: 22 faults, each a customer symptom in quotes; the learner walks the signal chain station by station to find it. Today the symptoms are text only.",
     recs=recs, safety=SAFE1 + DUMMY,
     reuse="SCN-01.", see=["SS-02A", "AMP-01", "EAR-04"], usedin="Sound Systems › fault bench (src/features/soundsystems/faults.ts)")

# ---------------------------------------------------------------- SS-02A (acoustic faults at the seat)
A_RIG = "Venue PA, empty room. Binaural dummy head (or in-ear binaural mics on a person who stays still) at seated ear height; ORTF if neither is available. Programme: the house song at a moderate level (≈ 90 dBA max at FOH). Same position for the fault and its partner."
A_SPECS = {"Channels": "Stereo (binaural or ORTF)", "Length": "8 s", "Levels": "Peaks ≤ −3 dBFS", "Set": "Fault and partner LUFS-matched", "Capture": "Acoustic, at the listening seat"}
A_NOTE = "Binaural or ORTF at FOH / the affected seat"
A_SAFE = ["Hearing protection; programme ≤ ≈ 90 dBA at FOH.", "Never drive real speakers into clipping. The buzzing driver must be ALREADY damaged — never damage one on purpose."]
recs = [
    rec(rid="SS-02A.1", title="Buzzing driver — fault",
        files=[("sound_systems/ss02-driver-fault.wav", "“The left top buzzes on every low note.” — buzzing driver (ALREADY-DAMAGED driver only)", "8 s", A_NOTE, "rec")],
        context="Fault-bench card “The left top buzzes on every low note.” Every electrical station reads clean; the buzz moves with the cabinet — it is mechanical.",
        teaches="A damaged driver: a rattling, papery buzz that rides on the bass notes and sits on the LEFT side of the image, present even at moderate level.",
        record="The house song through the PA with an already-damaged driver fitted in a spare cabinet standing in as the left top; captured binaurally at FOH.",
        how=[A_RIG, "Fit a driver that is ALREADY damaged (torn cone or rubbing voice coil) into a spare cabinet, placed as the left top. Never damage a driver on purpose.",
             "Good partner first (SS-02A.2) with a healthy cabinet in the same spot, then swap cabinets only."],
        tips=["Ask the venue or a repair shop for a known-bad driver in advance.", "Record all four acoustic pairs in one FOH sitting, good first each time."],
        specs=A_SPECS, qc=["Buzz audible on bass notes and localised to the left.", "Loudness within ±0.5 LU of SS-02A.2."], safety=A_SAFE),
    rec(rid="SS-02A.2", title="Buzzing driver — healthy partner",
        files=[("sound_systems/ss02-driver-good.wav", "Healthy A/B partner for driver", "8 s", "", "rec")],
        context="The A/B reference on the driver card.", teaches="The same low notes from a healthy left top: clean bass, no rattle.",
        record="Same programme moment and seat, healthy cabinet as the left top.", how=[A_RIG, "Healthy cabinet in the left-top position."],
        tips=["Record first."], specs=A_SPECS, qc=["No buzz on low notes."], safety=A_SAFE),
    rec(rid="SS-02A.3", title="L/R polarity at the centre seat — fault",
        files=[("sound_systems/ss02-polarity-fault.wav", "“Each side alone sounds full. Both together, the bass disappears in the middle.” — L/R polarity, centre seat", "8 s", A_NOTE, "rec")],
        context="Fault-bench card “Each side alone sounds full. Both together, the bass disappears in the middle.” One side is wired out of polarity; every electrical reading is normal. Also reused by Audio Scenarios (SCN-01) as a system fault.",
        teaches="Polarity cancellation: at the centre seat the low end thins out dramatically and the image goes vague and phasey, though each side alone is fine.",
        record="The house song with one side's polarity inverted, captured at the centre seat on the L/R axis.",
        how=[A_RIG, "Seat: dead centre between the left and right mains (measure it).",
             "Good partner first (SS-02A.4), then invert polarity on ONE side at the system processor."],
        tips=["Measure the centre seat with a laser so both takes are truly centred.", "Optional check: solo each side briefly to confirm each is full on its own (not delivered)."],
        specs=A_SPECS, qc=["Obvious bass loss vs SS-02A.4 at the same seat.", "Loudness-matched within ±0.5 LU (the matching will make the thinness, not the level, the difference)."], safety=A_SAFE),
    rec(rid="SS-02A.4", title="L/R polarity — healthy partner",
        files=[("sound_systems/ss02-polarity-good.wav", "Healthy A/B partner for polarity", "8 s", "", "rec")],
        context="The A/B reference on the polarity card.", teaches="Both sides in polarity at the centre seat: full, solid bass and a firm centre image.",
        record="Same seat and programme moment, both sides in correct polarity.", how=[A_RIG, "Processor polarity normal on both sides."],
        tips=["Record first."], specs=A_SPECS, qc=["Full bass at the centre seat."], safety=A_SAFE),
    rec(rid="SS-02A.5", title="Vocals in the subs — fault",
        files=[("sound_systems/ss02-vocals-in-subs-fault.wav", "“The vocal sounds boomy and thick — you can hear it coming from the subs.” — vocal routed to subs / crossover", "8 s", A_NOTE, "rec")],
        context="Fault-bench cards “The vocal sounds boomy and thick — you can hear it coming from the subs” (an accidental vocal send to aux-fed subs) and the related wrong-crossover card.",
        teaches="A vocal in the subs: the voice gains a thick, chesty boom that seems to come from the floor and the sub positions instead of the tops.",
        record="The house song (vocal prominent) with the vocal sent to the aux-fed subs, captured at FOH.",
        how=[A_RIG, "Aux-fed subs. Good partner first (SS-02A.6), then turn up the vocal's sub send (Aux 6) to unity — or, on a crossover-fed system, set the crossover far too high.",
             "Note in the sidecar which method you used."],
        tips=["Use a section of the song where the vocal is exposed."],
        specs=A_SPECS, qc=["The vocal is audibly boomier and seems to come from the subs.", "Loudness within ±0.5 LU of SS-02A.6."], safety=A_SAFE),
    rec(rid="SS-02A.6", title="Vocals in the subs — healthy partner",
        files=[("sound_systems/ss02-vocals-in-subs-good.wav", "Healthy A/B partner for vocals-in-subs", "8 s", "", "rec")],
        context="The A/B reference on the vocals-in-subs card.", teaches="Only low-frequency sources in the subs: the vocal sits clean in the tops.",
        record="Same seat and programme moment with the vocal's sub send off (crossover correct).", how=[A_RIG, "Vocal sub send off; crossover set for the cabinets (typically 80–120 Hz)."],
        tips=["Record first."], specs=A_SPECS, qc=["Vocal clean and localised to the tops."], safety=A_SAFE),
    rec(rid="SS-02A.7", title="Mis-set delay speaker — fault",
        files=[("sound_systems/ss02-delay-time-fault.wav", "“Under the delay towers everything sounds smeared, like a slap echo.” — mis-set delay speaker", "8 s", A_NOTE, "rec")],
        context="Fault-bench card “Under the delay towers everything sounds smeared, like a slap echo.” The delay speaker arrives before the mains.",
        teaches="Wrong delay time: under the delay speaker each hit arrives twice — the delay first, the mains tens of milliseconds later — so the sound smears into a slap echo.",
        record="The house song captured under a delay/fill speaker 10–20 m back from the mains, with its delay set to 0 ms.",
        how=[A_RIG, "Seat: under the delay or fill speaker, 10–20 m back from the mains. Log the distance.",
             "Good partner first (SS-02A.8) at the measured delay, then set the delay output to 0 ms."],
        tips=["Measure the correct delay (distance ÷ speed of sound for the day's temperature, plus a few ms) before the take; the app's Delay from Distance calculator gives the figure."],
        specs=A_SPECS, qc=["A distinct slap/smear on every transient.", "Loudness within ±0.5 LU of SS-02A.8."], safety=A_SAFE),
    rec(rid="SS-02A.8", title="Mis-set delay speaker — healthy partner",
        files=[("sound_systems/ss02-delay-time-good.wav", "Healthy A/B partner for delay-time", "8 s", "", "rec")],
        context="The A/B reference on the delay-time card.", teaches="With the measured delay the delay speaker and the mains arrive together: one clear, closer-sounding image.",
        record="Same seat and programme moment, delay set to the correct measured value.", how=[A_RIG, "Delay output at the measured value; log it."],
        tips=["Record first."], specs=A_SPECS, qc=["No slap; transients are single and clean."], safety=A_SAFE),
]
item(id="SS-02A", title="Fault bench symptoms — acoustic faults at the listening seat", pri="P2", sess=[5], group=G,
     used="Sound Systems fault bench (same as SS-02E): the faults that can only be heard in a room from a seat.",
     recs=recs, safety=A_SAFE,
     reuse="SCN-01.", see=["SS-02E"], usedin="Sound Systems › fault bench (src/features/soundsystems/faults.ts)")

# ---------------------------------------------------------------- SS-03a / b / c
P_HOW = ["DRY booth, LDC at 20 cm, pop filter.", "Natural, clear, even reading at about 150 words per minute of the 30 s phonetically balanced reference passage (House Scripts)."]
P_SPECS = {"Channels": "Mono", "Length": "≈ 30 s", "Levels": "−18 dBFS RMS", "Room": "DRY"}
recs = [
    rec(rid="SS-03a.1", title="Reference passage — male voice",
        files=[("sound_systems/ss03a-passage-male.wav", "Reference passage, male", "≈ 30 s", "", "rec")],
        context="The male reference voice on the Sound Systems speech pages (intelligibility, line check, coverage): the clean original the learner compares every PA version against. It is also the programme played through the PA for SS-03b.",
        teaches="What a clear, dry male voice sounds like at the source — every consonant crisp — so loss of clarity through a PA is heard as loss, not as the voice.",
        record="The 30 s reference passage read by a male talker in a dry booth.",
        how=P_HOW, tips=["Two complete takes; deliver the cleaner one.", "Record SS-03a.1 and .2 in one booth sitting with identical mic placement and gain."],
        specs=P_SPECS, qc=["No stumbles; every word intelligible.", "No room sound, no plosive pops."]),
    rec(rid="SS-03a.2", title="Reference passage — female voice",
        files=[("sound_systems/ss03a-passage-female.wav", "Reference passage, female", "≈ 30 s", "", "rec")],
        context="The female reference voice on the same speech pages, and the female programme for SS-03b.",
        teaches="The same passage in a higher, lighter voice, whose clarity depends more on the upper consonant range — so it degrades differently through a PA than the male voice.",
        record="Same passage, same booth set-up as SS-03a.1, read by a female talker.",
        how=["Same booth, mic and distance as SS-03a.1.", "Same pace (≈ 150 words per minute) and evenness."],
        tips=["Two complete takes; deliver the cleaner one."], specs=P_SPECS, qc=["No stumbles; every word intelligible.", "Matches SS-03a.1 in loudness (−18 dBFS RMS)."]),
]
item(id="SS-03a", title="Speech intelligibility: dry reference passage", pri="P2", sess=[1], group=G,
     used="Sound Systems speech pages (intelligibility, line check, coverage): the reference voice that the PA must deliver clearly. Today silent.",
     recs=recs, safety=[],
     reuse="SS-03b programme, RD-01 speech, Production, Speech lab.", see=["SS-03b"],
     usedin="Sound Systems › speech pages (src/screens/lab/soundsystems/pagesOperate.tsx, pagesLearnC.tsx)")

SEATS = [
    ("front", "front seats", "close to the PA, where direct sound dominates",
     "The best case: mostly direct sound, high clarity — the PA sounds close to the dry reference."),
    ("mid", "middle", "mid-hall, where direct and reflected sound start to balance",
     "Clarity starts to soften as room reflections catch up with the direct sound."),
    ("back", "back", "the back of the hall, far from the PA",
     "Distance: the direct sound is weaker and the reverberant field is a bigger share, so consonants blur and the voice gets roomier."),
    ("balcony", "under the balcony", "under a balcony overhang, shadowed from the PA's high frequencies",
     "The shadow seat: the overhang blocks the high-frequency direct sound and traps reflections, so the voice is duller and roomier — the case for an under-balcony fill speaker."),
]
recs = []
n = 0
for v, ref in (("male", "SS-03a.1"), ("female", "SS-03a.2")):
    for s, sn, where, teach in SEATS:
        n += 1
        recs.append(rec(
            rid="SS-03b.%d" % n, title="%s passage · %s" % (v.title(), sn),
            files=[("sound_systems/ss03b-%s-%s.wav" % (v, s), "%s passage · %s" % (v.title(), sn), "≈ 30 s", "Log distance and SPL", "rec")],
            context="Sound Systems coverage and intelligibility pages: the learner hears the %s voice as delivered to the %s (%s) and compares it with the dry reference (%s) and the other seats." % (v, sn, where, ref),
            teaches=teach + (" Heard in the %s voice." % v),
            record="%s (the %s reference passage) played through the venue PA at a fixed level, captured at seated ear height in the %s." % (ref, v, sn),
            how=["Play %s through the PA at a fixed level (≈ 75–80 dBA at FOH). Do NOT change the PA level between seats or voices." % ref,
                 "Binaural dummy head or ORTF at seated ear height in the %s seat." % sn,
                 "Log the seat's distance from the PA and the measured dBA at the seat."],
            tips=["Do all four seats for the male voice, then all four for the female, without touching the PA.", "Mark each seat with tape so both voices are captured at exactly the same spot."],
            specs={"Channels": "Stereo (binaural or ORTF)", "Length": "≈ 30 s", "Set": "FIXED-GAIN (PA and recorder unchanged across all eight)", "Log": "Distance from PA, dBA at seat"},
            qc=["Distance and SPL logged.", ("Audibly duller and roomier than the front and middle takes." if s == "balcony" else ("Clearly the clearest of the four seats." if s == "front" else "Clarity sits between the neighbouring seats (front > middle > back)."))]))
item(id="SS-03b", title="Speech intelligibility: the passage through a PA, by seat", pri="P2", sess=[5], group=G,
     used="Sound Systems coverage and intelligibility pages: the learner judges how a PA serves different seats.",
     recs=recs, safety=[],
     reuse="Room Design context.", see=["SS-03a", "SPK-01"], usedin="Sound Systems › speech/coverage pages (src/screens/lab/soundsystems/)")

LC_HOW = ["Venue vocal dynamic, handheld at 2–3 in, captured from the console's direct out (line).", "Say “Check one-two, sss, t-t-t” briskly and clearly, as an engineer would."]
LC_SPECS = {"Channels": "Mono", "Length": "≈ 6 s", "Levels": "Peaks ≈ −6 dBFS", "Capture": "Console direct out (LINE)"}
recs = [
    rec(rid="SS-03c.1", title="Line check — male voice",
        files=[("sound_systems/ss03c-linecheck-male.wav", "Line check, male", "6 s", "", "rec")],
        context="Sound Systems › <em>Line check</em>: the learner works down the input list and hears this on the vocal line before marking it OK or fault.",
        teaches="What a professional line check sounds like and why each part is there: “check one-two” for level, a sibilant “sss” for the top end, “t-t-t” for transients.",
        record="“Check one-two, sss, t-t-t” on a handheld vocal dynamic, male voice.",
        how=LC_HOW, tips=["Do it during SS-01 set-up, before any feedback work, on the same mic and channel.", "Record .1 and .2 back to back."],
        specs=LC_SPECS, qc=["Clean, unclipped.", "The “sss” and “t-t-t” are crisp and distinct."]),
    rec(rid="SS-03c.2", title="Line check — female voice",
        files=[("sound_systems/ss03c-linecheck-female.wav", "Line check, female", "6 s", "", "rec")],
        context="The female version of the Line check vocal line, so the input list has two different vocal channels to check.",
        teaches="The same three-part check in a higher voice; the sibilance check lands higher in the spectrum.",
        record="Same words, same mic and distance as SS-03c.1, female voice.",
        how=LC_HOW, tips=["Same channel and gain as SS-03c.1."], specs=LC_SPECS, qc=["Clean, unclipped.", "Crisp “sss” and “t-t-t”."]),
]
item(id="SS-03c", title="Line-check takes", pri="P2", sess=[5], group=G,
     used="Sound Systems › <em>Line check</em>: the learner works down the input list marking each line OK or fault.",
     recs=recs, safety=[], reuse="None.", see=["SS-01"],
     usedin="Sound Systems › Line check (src/screens/lab/soundsystems/pagesOperate.tsx)")

M_RIG = "No band needed: send the MIX-01 stems from the console into realistic monitor mixes. Stage level moderate (≤ ≈ 95 dBA)."
M_SPECS = {"Channels": "Stereo", "Length": "10 s", "Levels": "Peaks ≤ −6 dBFS"}
M_SAFE = ["Hearing protection on stage; stage level ≤ ≈ 95 dBA."]
recs = [
    rec(rid="SS-04.1", title="Singer's wedge, heard at the singer",
        files=[("sound_systems/ss04-wedge-singer.wav", "Singer's wedge, at the singer", "10 s", "", "rec")],
        context="Sound Systems › <em>Stage monitors</em> and <em>Four monitor mixes</em>: the learner builds a mix per performer; this is what the singer actually hears at the vocal position.",
        teaches="A singer's wedge is vocal-forward with just enough band for pitch and time — and on stage it arrives mixed with the band's own stage sound.",
        record="A vocal-heavy wedge mix of the MIX-01 stems, captured binaurally at the singer's position.",
        how=[M_RIG, "Wedge mix: lead vocal loud, keys and guitar for pitch, a little kick.", "Binaural dummy head (or in-ear binaural mics) at the singer's head position, facing the wedge."],
        tips=["Set up all three wedge mixes first, then move the head from position to position.", "Mark each performer position with tape."],
        specs=M_SPECS, qc=["Vocal clearly on top."], safety=M_SAFE),
    rec(rid="SS-04.2", title="Drummer's wedge",
        files=[("sound_systems/ss04-wedge-drummer.wav", "Drummer's wedge", "10 s", "", "rec")],
        context="Same pages: the drummer's mix, heard at the drum stool.", teaches="A drummer's wedge is built on kick and bass, with only enough vocal to follow the song — the opposite balance from the singer's.",
        record="A kick-and-bass-heavy wedge mix captured binaurally at the drummer's position.",
        how=[M_RIG, "Wedge (or drum fill) mix: kick and bass loud, some vocal for cues.", "Binaural head at the drummer's seated head position."],
        tips=["Same session as SS-04.1; only the mix and the head position change."], specs=M_SPECS, qc=["Kick and bass dominate; vocal is present but lower."], safety=M_SAFE),
    rec(rid="SS-04.3", title="Guitarist's wedge",
        files=[("sound_systems/ss04-wedge-guitarist.wav", "Guitarist's wedge", "10 s", "", "rec")],
        context="Same pages: the guitarist's mix at their position.", teaches="A guitarist's wedge carries their own guitar plus vocal and drums for time — a third, different picture of the same song.",
        record="A guitar-forward wedge mix captured binaurally at the guitarist's position.",
        how=[M_RIG, "Wedge mix: guitar forward, vocal and snare for cues.", "Binaural head at the guitarist's standing head position."],
        tips=["Same session as SS-04.1."], specs=M_SPECS, qc=["Guitar forward; clearly different from .1 and .2."], safety=M_SAFE),
    rec(rid="SS-04.4", title="IEM mix (aux feed)",
        files=[("sound_systems/ss04-iem-mix.wav", "IEM mix (aux feed)", "10 s", "", "rec")],
        context="Sound Systems › <em>Monitor console, splits and talkback</em> and the monitor-mix pages: the in-ear alternative to a wedge.",
        teaches="An IEM mix is direct, stereo and isolated: no stage spill and no room — compare it with the wedge at the singer (SS-04.1).",
        record="A singer's IEM mix taken directly from the aux/IEM feed at line level.",
        how=[M_RIG, "Build the singer's IEM mix (stereo, with some reverb); record the aux feed (LINE), not acoustically."],
        tips=["Record SS-04.4 and SS-04.5 together: they share the feed."], specs=dict(M_SPECS, Capture="Aux / IEM feed (LINE)"), qc=["No room sound or stage spill."]),
    rec(rid="SS-04.5", title="Talkback over the IEM mix",
        files=[("sound_systems/ss04-talkback.wav", "Talkback over the IEM mix", "10 s", "", "rec")],
        context="Monitor console and talkback page: how the engineer talks to a performer in their ears.",
        teaches="Talkback cuts into the IEM mix (usually with the programme dimmed) — the learner hears why talkback level and dim matter.",
        record="The IEM mix of SS-04.4 with the engineer pressing talkback and speaking a short instruction mid-clip.",
        how=["Same feed as SS-04.4.", "At ≈ 3 s the engineer presses talkback and says a short instruction (e.g. “One more chorus, then we'll stop”). Use the console's talkback dim if it has one."],
        tips=["Script the line so it can be re-taken identically."], specs=dict(M_SPECS, Capture="Aux / IEM feed (LINE)"), qc=["Talkback clearly intelligible over the mix; nothing clips."]),
]
item(id="SS-04", title="Monitor wedge versus IEM perspective", pri="P3", sess=[5], group=G,
     used="Sound Systems monitoring pages: wedge mixes per performer and in-ear monitors, plus talkback.",
     recs=recs, safety=M_SAFE, reuse="None.", see=["MIX-01"],
     usedin="Sound Systems › monitoring pages (src/screens/lab/soundsystems/pagesLearnB.tsx, pagesRoute.tsx)")

# ================================================================ AMP / TUBE
G = "Amplifier and Tube"
AMP_RIG = ["Class AB power amp output → dummy load with a rated attenuator / line tap → interface. NO loudspeakers anywhere.",
           "Programme: the house mix (MST-01.1, the unmastered mix), summed to mono.",
           "Capture gain is set ONCE, on the hard-clip take (peaks ≤ −3 dBFS), and taped — the level differences between takes are real."]
AMP_SPECS = {"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −3 dBFS", "Set": "FIXED-GAIN with the other drive states"}
AMP_TIP = "Record the drive states in one pass from quietest to loudest (clean → just clipping → hard clip) without re-trimming the recorder."
amp_ctx = "Amplifier Principles modules (bias, classes, Class D, real-world gain chain, diagnosis), which today are silent."
recs = [
    rec(rid="AMP-01.1", title="Clean, 10 dB below clipping",
        files=[("amp_lab/amp01-clean.wav", "Clean, 10 dB below clip", "6 s", "", "rec")],
        context=amp_ctx + " This is the baseline the learner compares every other drive state against.",
        teaches="An amplifier working with 10 dB of headroom: it simply makes the programme louder and changes nothing else.",
        record="The house mix through the amp, set 10 dB below the point where the clip light first flickers.",
        how=AMP_RIG + ["Find the clip point (clip light flickers on peaks), then turn the amp input down 10 dB and record."],
        tips=[AMP_TIP], specs=AMP_SPECS, qc=["No distortion anywhere.", "Recorder gain as logged for the whole set."], safety=DUMMY),
    rec(rid="AMP-01.2", title="Just clipping",
        files=[("amp_lab/amp01-just-clipping.wav", "Just clipping", "6 s", "", "rec")],
        context=amp_ctx + " The threshold state: where a real show's amp first runs out of headroom.",
        teaches="The first clipping is subtle — a slight hardening and grit on the loudest drum hits only. The learner learns to hear it before it becomes obvious.",
        record="The same programme with the amp input raised until the clip light just flickers on peaks.",
        how=AMP_RIG + ["Raise the amp input from the clean setting until the clip light flickers on the loudest peaks only."],
        tips=[AMP_TIP], specs=AMP_SPECS, qc=["Distortion only on the loudest peaks; subtle against AMP-01.1."], safety=DUMMY),
    rec(rid="AMP-01.3", title="Hard clip, 6 dB over",
        files=[("amp_lab/amp01-hard-clip.wav", "Hard clip, 6 dB over", "6 s", "", "rec")],
        context=amp_ctx + " The damage state the diagnosis module warns about.",
        teaches="Hard clipping: flattened, high-frequency-rich waveforms that sound harsh and buzzy on everything loud — the sound that heats and burns tweeters.",
        record="The same programme with the amp driven 6 dB past the just-clipping point.",
        how=AMP_RIG + ["Raise the amp input 6 dB above the just-clipping setting. This is the take the capture gain is set on."],
        tips=[AMP_TIP, "Keep the take short — the dummy load heats up when driven hard."], specs=AMP_SPECS,
        qc=["Obviously harsh.", "Nothing clips in the interface — the distortion is the amp's."], safety=DUMMY),
    rec(rid="AMP-01.4", title="Upstream clipping — console clips, amp clean",
        files=[("amp_lab/amp01-upstream-clip.wav", "Console clipping, amp clean", "6 s", "", "rec")],
        context=amp_ctx + " The real-world gain-chain module asks WHERE in the chain the clipping happens; this is one half of that pair.",
        teaches="Clipping upstream at the console is just as harsh as amp clipping. What differs is where you fix it. Heard as a pair with AMP-01.5 at matched loudness.",
        record="The programme with the console output driven into clipping while the amp stays clean.",
        how=AMP_RIG + ["Drive the console (or its output stage) into clipping by about the same amount as AMP-01.5; amp set well below its clip point.",
                       "This pair is loudness-MATCHED, not fixed-gain: match it to AMP-01.5."],
        tips=["Record AMP-01.4 and .5 back to back and match their loudness afterwards (±0.5 LU)."],
        specs=dict(AMP_SPECS, Set="Loudness-matched to AMP-01.5 (the one exception to fixed gain)"),
        qc=["Clipping clearly audible; loudness matched to AMP-01.5."], safety=DUMMY),
    rec(rid="AMP-01.5", title="Output clipping — console clean, amp clips",
        files=[("amp_lab/amp01-output-clip.wav", "Amp clipping, console clean", "6 s", "", "rec")],
        context=amp_ctx + " The other half of the upstream-vs-output pair.",
        teaches="The amp clipping by the same amount as the console did in AMP-01.4: both stages can clip, and the amp must be the last to clip, protected by a limiter.",
        record="The programme with the console clean and the amp clipping by a similar amount.",
        how=AMP_RIG + ["Console clean; amp input raised until it clips by about the same amount as the console did in AMP-01.4.", "Loudness-match to AMP-01.4."],
        tips=["Record straight after AMP-01.4."], specs=dict(AMP_SPECS, Set="Loudness-matched to AMP-01.4"),
        qc=["Clipping audible; loudness matched to AMP-01.4."], safety=DUMMY),
    rec(rid="AMP-01.6", title="Limiter engaged",
        files=[("amp_lab/amp01-limiter.wav", "Limiter engaged", "6 s", "", "rec")],
        context=amp_ctx + " Shows what the amp's (or processor's) limiter prevents.",
        teaches="Driven as hard as the hard-clip take but with the limiter on: the peaks are held down cleanly — slightly squashed, never harsh.",
        record="The programme driven as for AMP-01.3 with the amp's (or a processor's) limiter engaged.",
        how=AMP_RIG + ["Same input drive as AMP-01.3; engage the amp's limiter (or a system processor's limiter ahead of the amp)."],
        tips=["Do it straight after AMP-01.3 so the drive is identical."], specs=AMP_SPECS,
        qc=["No harsh clipping, compared with AMP-01.3 at the same drive."], safety=DUMMY),
    rec(rid="AMP-01.7", title="+3 dB level step (clean)",
        files=[("amp_lab/amp01-step-plus3db.wav", "+3 dB step", "6 s", "", "rec")],
        context=amp_ctx + " Used on the power-and-headroom pages to show how big a few decibels really is.",
        teaches="+3 dB (twice the amplifier power) is only a modest, just-clear step up in loudness.",
        record="The programme 3 dB above the clean take, without clipping.",
        how=AMP_RIG + ["From the clean setting (AMP-01.1), raise the amp input exactly 3 dB. Check the clip light never flickers."],
        tips=["Use a stepped attenuator or the console's dB scale for exact steps."], specs=AMP_SPECS,
        qc=["Exactly +3 dB vs AMP-01.1 (measure RMS); no clipping."], safety=DUMMY),
    rec(rid="AMP-01.8", title="+10 dB level step (clean)",
        files=[("amp_lab/amp01-step-plus10db.wav", "+10 dB step", "6 s", "", "rec")],
        context=amp_ctx + " The companion to the +3 dB step.",
        teaches="+10 dB (ten times the amplifier power) sounds roughly twice as loud — a big jump, and the reason headroom costs so much power.",
        record="The programme 10 dB above the clean take, without clipping.",
        how=AMP_RIG + ["Raise the amp input exactly 10 dB above AMP-01.1. Because the clean take sits 10 dB below clip, this lands right at the clip point: watch the light."],
        tips=["If +10 dB flickers the clip light, re-record AMP-01.1 a dB or two lower so both steps are clean, and log the change."], specs=AMP_SPECS,
        qc=["Exactly +10 dB vs AMP-01.1; no clipping."], safety=DUMMY),
    rec(rid="AMP-01.9", title="Amplifier noise floor",
        files=[("amp_lab/amp01-noise-floor.wav", "Amp noise floor", "6 s", "", "rec")],
        context=amp_ctx + " The quiet end of the gain chain: what the amp adds when nothing is playing.",
        teaches="Every amp has a hiss floor; heard at the fixed capture gain it shows how far below the programme it sits.",
        record="The amp powered on with no input signal, 6 s.",
        how=AMP_RIG + ["Disconnect or mute the input; amp input control at the clean setting; record 6 s."],
        tips=["Record it first, while everything is cool and quiet."], specs=AMP_SPECS, qc=["Steady hiss only; no hum, no clicks."], safety=DUMMY),
]
item(id="AMP-01", title="Real power-amp clipping into a dummy load", pri="P2", sess=[4], group=G,
     used="Amplifier Principles modules (bias, classes, Class D, real-world gain chain, diagnosis): the learner learns why a clipped amp sounds harsh and where in the chain clipping happens. Today the lab is silent.",
     recs=recs, safety=DUMMY, reuse="SS-02E amp-clip context.", see=["SS-02E", "TUBE-01"], usedin="Amplifier Principles lab (src/screens/lab/amp/modules/)")

recs = []
n = 0
DRV = {1: ("gentle", "a light thickening, still close to clean"), 2: ("medium", "obvious saturation, still musical"), 3: ("heavy", "full distortion")}
for s, sn, src in (("guitar", "DI guitar", "FX-04 DI guitar"), ("bass", "DI bass", "FX-04 DI bass"), ("vocal", "Vocal", "FX-03 vocal")):
    for c, cn in (("tube", "12AX7 tube preamp"), ("ss", "Solid-state clipper")):
        for d in (1, 2, 3):
            n += 1
            recs.append(rec(
                rid="TUBE-01.%d" % n, title="HOLD · %s · %s · drive %d" % (sn, cn, d),
                files=[("tube_lab/tube01-%s-%s-drive%d.wav" % (s, c, d), "%s · %s · drive %d" % (sn, cn, d), "6 s", "HOLD", "hold")],
                context="Vacuum Tube lab — silent BY DESIGN today. Would let the learner compare the %s through the %s at drive %d (%s) with the other circuit at the same drive." % (sn.lower(), cn.lower(), d, DRV[d][0]),
                teaches=("How a 12AX7 stage saturates at this drive (%s): a softer onset, rich in low-order harmonics." if c == "tube" else "How a solid-state clipper distorts at this drive (%s): a harder onset with a brighter, odd-order edge.") % DRV[d][1],
                record="HOLD — do not record unless production confirms in writing. The %s re-amped through the %s at drive %d." % (src, cn, d),
                how=["Re-amp the %s through the %s at drive setting %d; level-match at −18 dBFS RMS." % (src, cn, d)],
                tips=["Wait for written confirmation.", "If it goes ahead: all three drives per circuit in one re-amp pass, then swap circuits."],
                specs={"Channels": "Mono", "Length": "6 s", "Levels": "−18 dBFS RMS"},
                qc=["Level-matched to the other circuit at the same drive."]))
recs.append(rec(rid="TUBE-01.19", title="HOLD · Tube preamp warm-up from cold",
                files=[("tube_lab/tube01-warmup.wav", "Tube preamp warm-up from cold", "≈ 60 s", "HOLD", "hold")],
                context="Vacuum Tube lab — silent BY DESIGN today. Would let the learner hear a tube stage come up from cold.",
                teaches="A tube stage needs time to warm up: its output and tone settle over the first minute.",
                record="HOLD — do not record unless production confirms. A tube preamp switched on from cold with signal present, about 60 s.",
                how=["Signal (a steady DI loop) into the cold preamp; start recording; switch on; record ≈ 60 s."],
                tips=["Wait for written confirmation."], specs={"Channels": "Mono", "Length": "≈ 60 s"}, qc=["Starts from silence; the level settles by the end."]))
item(id="TUBE-01", title="Tube versus solid-state saturation", pri="P3", sess=[4], group=G, status="hold",
     used="Vacuum Tube lab — silent BY DESIGN today. Record this only if production reverses that decision.",
     recs=recs, safety=[], reuse="—", see=["AMP-01"], usedin="Vacuum Tube lab (src/screens/lab/tube/)")

# ================================================================ CABLES / PATCHBAY
G = "Cables, Connectors and Patchbay"
GL_RIG = ["Two mains-earthed devices, each on a properly earthed outlet on DIFFERENT circuits (separate earth paths), joined by an unbalanced cable into the recorder's line input. That earth-path difference is the loop. NEVER lift or defeat a mains earth.",
          "Line capture. Gain at minimum first, then up. The same recorder gain for every CAB-01 file."]
CAB1_SPECS = {"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −3 dBFS", "Set": "FIXED-GAIN", "Capture": "LINE"}
cab_ctx = "Cable lab and Connector Select (power connectors and analog lessons), which explain that hum is solved on the signal side — isolation transformers, DI ground-lift — never by defeating the safety earth."
recs = [
    rec(rid="CAB-01.1", title="Ground-loop hum alone (60 Hz)",
        files=[("cable_lab/cab01-hum-alone.wav", "Hum alone", "6 s", "", "rec")],
        context=cab_ctx + " This is the bare symptom, heard first.",
        teaches="What a ground loop sounds like with nothing to hide it: a steady 60 Hz hum with buzzy harmonics above it.",
        record="The looped rig with no programme playing: hum only.",
        how=GL_RIG + ["No programme. Record 6 s of the hum."],
        tips=["Record all four CAB-01 files without touching the recorder gain.", "Same rig as SS-02E.7/.8 and the NOI-01b and EAR-04 ground-loop takes — record them as one block."],
        specs=CAB1_SPECS, qc=["Steady 60 Hz hum with harmonics; no programme."], safety=SAFE1),
    rec(rid="CAB-01.2", title="Hum under music",
        files=[("cable_lab/cab01-hum-under-music.wav", "Hum under music", "6 s", "", "rec")],
        context=cab_ctx + " Shows the hum the way an audience meets it.",
        teaches="Hum under programme: obvious in quiet passages and gaps, partly masked in loud ones — which is why it is easy to miss in a loud soundcheck.",
        record="The house mix played through the looped rig.",
        how=GL_RIG + ["Play the house mix (MST-01.1) at line level from the source device through the loop. Note the programme time you started at."],
        tips=["Record CAB-01.3 and .4 from the SAME programme moment so the A/B is exact."], specs=CAB1_SPECS,
        qc=["Hum audible under the music, especially in quieter moments."], safety=SAFE1),
    rec(rid="CAB-01.3", title="Fixed with an isolation transformer",
        files=[("cable_lab/cab01-fixed-isolation.wav", "Fixed: isolation transformer", "6 s", "", "rec")],
        context=cab_ctx + " The first correct fix.",
        teaches="An audio isolation transformer breaks the loop in the signal path: the same music, the hum gone, the earths untouched.",
        record="The same programme moment as CAB-01.2 with an audio isolation transformer inserted in the signal line.",
        how=GL_RIG + ["Insert an audio isolation transformer in the signal line. Same programme moment as CAB-01.2."],
        tips=["Record straight after CAB-01.2."], specs=CAB1_SPECS, qc=["No audible hum.", "Same programme moment as CAB-01.2."], safety=SAFE1),
    rec(rid="CAB-01.4", title="Fixed with a DI ground-lift",
        files=[("cable_lab/cab01-fixed-groundlift.wav", "Fixed: DI ground-lift", "6 s", "", "rec")],
        context=cab_ctx + " The second correct fix — the one most engineers carry.",
        teaches="A DI box with its ground-lift switch engaged also cures the loop on the signal side. This is the safe ground-lift, unlike lifting a mains earth.",
        record="The same programme moment with the link replaced by a DI and its ground-lift switch engaged.",
        how=GL_RIG + ["Replace the unbalanced link with a DI box; engage its ground-lift switch. Same programme moment."],
        tips=["Check with the lift OFF first that the DI alone did not cure it (not delivered), then record with it ON."], specs=CAB1_SPECS,
        qc=["No audible hum.", "Same programme moment as CAB-01.2."], safety=SAFE1),
    rec(rid="CAB-01.5", title="50 Hz hum alone (OPTIONAL — abroad only)",
        files=[("cable_lab/cab01-hum-50hz.wav", "50 Hz hum alone (OPTIONAL — abroad only)", "6 s", "", "opt")],
        context=cab_ctx + " An optional international version for learners on 50 Hz mains.",
        teaches="Ground-loop hum on 50 Hz mains is lower in pitch than the 60 Hz hum of CAB-01.1: the hum's pitch tells you the mains frequency.",
        record="Only if you are working on 50 Hz mains: the CAB-01.1 rig, hum alone.",
        how=GL_RIG + ["Only on a 50 Hz mains supply. No programme. Record 6 s. Never fake it by pitch-shifting."],
        tips=["Skip unless you are already working on 50 Hz mains."], specs=CAB1_SPECS, qc=["The fundamental measures 50 Hz."], safety=SAFE1),
]
item(id="CAB-01", title="Ground-loop hum, then fixed", pri="P2", sess=[4], group=G,
     used="Cable lab and Connector Select (power connectors and analog lessons): the text explains that hum is solved on the signal side — isolation transformers, DI ground-lift — never by defeating the safety earth. Today silent.",
     recs=recs, safety=SAFE1, reuse="None.", see=["NOI-01b", "EAR-04"],
     usedin="Cable lab, Connector Select (src/screens/lab/cable/data/connectors.power.ts, connectors.analog.ts)")

C2_RIG = ["Two 15 m runs laid side by side and left in place for all four takes: one unbalanced (TS), one balanced (XLR).",
          "Send a quiet signal (S1 speech at mic level) down each run. Identical receiver gain for all four takes."]
C2_SPECS = {"Channels": "Mono", "Length": "8 s", "Set": "FIXED-GAIN — identical gain", "Capture": "LINE"}
c2_ctx = "Cable lab lessons on balanced lines and interference: the learner A/Bs the two cable types under the same interference."
recs = [
    rec(rid="CAB-02.1", title="Unbalanced run beside a dimmer",
        files=[("cable_lab/cab02-unbal-dimmer.wav", "Unbalanced · dimmer", "8 s", "", "rec")],
        context=c2_ctx + " The dimmer case, unbalanced.",
        teaches="An unbalanced line picks up a dimmer's buzz — harsh and spiky, full of harmonics — right over the speech.",
        record="S1 at mic level down the 15 m unbalanced run, laid along a dimmer pack's load cable with the lamp dimmed to ≈ 50%.",
        how=C2_RIG + ["Lay both runs along the dimmer pack's load cable; dim the lamp to ≈ 50% (where dimmer buzz is usually worst).", "Record the unbalanced run."],
        tips=["Do not move the cables between takes — swap only the receiver input.", "Record CAB-02.1 and .2 back to back."],
        specs=C2_SPECS, qc=["Buzz clearly audible under the speech."], safety=SAFE1),
    rec(rid="CAB-02.2", title="Balanced run beside a dimmer",
        files=[("cable_lab/cab02-bal-dimmer.wav", "Balanced · dimmer", "8 s", "", "rec")],
        context=c2_ctx + " The dimmer case, balanced.",
        teaches="The balanced line in exactly the same place rejects the dimmer buzz: the noise arrives equally on both legs and cancels at the receiver.",
        record="Same as CAB-02.1, but the balanced run.", how=C2_RIG + ["Same dimmer setting; switch the receiver to the balanced run."],
        tips=["Same gain as CAB-02.1."], specs=C2_SPECS, qc=["Clean against CAB-02.1 at the same gain."], safety=SAFE1),
    rec(rid="CAB-02.3", title="Unbalanced run beside a phone",
        files=[("cable_lab/cab02-unbal-phone.wav", "Unbalanced · phone", "8 s", "", "rec")],
        context=c2_ctx + " The radio-frequency case, unbalanced.",
        teaches="A phone next to an unbalanced line causes the familiar “dit-dit-dit” RF chatter — a different interference from the dimmer buzz.",
        record="S1 down the unbalanced run with the dimmer off and a phone on a call next to the line.",
        how=C2_RIG + ["Dimmer OFF. A 2G phone (or the noisiest phone you have) on a call, lying next to the line.", "Record the unbalanced run."],
        tips=["Batch with the NOI-01b and EAR-04 RF takes.", "Record CAB-02.3 and .4 back to back without moving the phone."],
        specs=C2_SPECS, qc=["RF chatter audible; no dimmer buzz."], safety=SAFE1),
    rec(rid="CAB-02.4", title="Balanced run beside a phone",
        files=[("cable_lab/cab02-bal-phone.wav", "Balanced · phone", "8 s", "", "rec")],
        context=c2_ctx + " The radio-frequency case, balanced.",
        teaches="The balanced line rejects most of the phone's interference from the same position.",
        record="Same as CAB-02.3, but the balanced run.", how=C2_RIG + ["Phone unmoved; switch the receiver to the balanced run."],
        tips=["Same gain as CAB-02.3."], specs=C2_SPECS, qc=["Clean, or far cleaner, against CAB-02.3."], safety=SAFE1),
]
item(id="CAB-02", title="Unbalanced versus balanced, 15 m beside a dimmer and a phone", pri="P2", sess=[4], group=G,
     used="Cable lab lessons on balanced lines and interference.",
     recs=recs, safety=SAFE1, reuse="None.", see=["CAB-01"], usedin="Cable lab (src/screens/lab/cable/data/)")

C3_RIG = ["Programme: the house mix (MST-01.1) at line level through the cable under test into the recorder.",
          "Flex the cable near the connector in a steady rhythm, once a second, for the whole take."]
C3_SPECS = {"Channels": "Mono", "Length": "8 s", "Levels": "Peaks ≤ −3 dBFS", "Capture": "LINE"}
c3_ctx = "Cable lab and Cable Install defect scenes, at the inspection point “crackle or dropout when the cable is flexed near the connector”."
recs = [
    rec(rid="CAB-03.1", title="Crackle while flexing",
        files=[("cable_lab/cab03-crackle-flex.wav", "Crackle while flexing", "8 s", "", "rec")],
        context=c3_ctx + " The crackle form of the fault.",
        teaches="Broken shield strands or a dirty contact crackle in time with the movement — the sound tells you to look at the connector end.",
        record="Programme through a genuinely faulty cable flexed near the connector once a second, crackling but not cutting out.",
        how=C3_RIG + ["Use a genuinely faulty cable (broken shield strands or a dirty contact) that crackles but does not cut out."],
        tips=["Label the faulty cables and keep them out of service afterwards.", "Same faulty cables as SS-02E.9 — record them in one block."],
        specs=C3_SPECS, qc=["Crackle follows the flexing rhythm."], safety=SAFE1),
    rec(rid="CAB-03.2", title="Dropout while flexing",
        files=[("cable_lab/cab03-dropout-flex.wav", "Dropout while flexing", "8 s", "", "rec")],
        context=c3_ctx + " The dropout form of the fault.",
        teaches="A loose pin or broken conductor makes the signal cut out completely, in time with the flexing — worse than a crackle, and it can happen mid-show.",
        record="Programme through a cable with a loose pin, flexed the same way, so the signal drops out.",
        how=C3_RIG + ["Use a genuinely faulty cable with a loose pin or broken conductor that cuts the signal when flexed."],
        tips=["Same flex rhythm as CAB-03.1."], specs=C3_SPECS, qc=["Full dropouts follow the flexing rhythm."], safety=SAFE1),
    rec(rid="CAB-03.3", title="Good cable flexed (reference)",
        files=[("cable_lab/cab03-good-flex.wav", "Good cable flexed (reference)", "8 s", "", "rec")],
        context=c3_ctx + " The reference: a sound cable under the same test.",
        teaches="A good cable flexed the same way changes nothing — so any crackle or drop under the flex test is the cable's fault.",
        record="Programme through a good cable flexed in the same rhythm.", how=C3_RIG + ["Use a known-good cable of the same type."],
        tips=["Record it first, as the reference."], specs=C3_SPECS, qc=["No crackle, no dropout."], safety=SAFE1),
]
item(id="CAB-03", title="Bad-cable crackle and dropout while flexing", pri="P2", sess=[4], group=G,
     used="Cable lab and Cable Install defect scenes; inspection point “crackle or dropout when the cable is flexed near the connector”.",
     recs=recs, safety=SAFE1, reuse="None.", see=["NOI-01b", "SS-02E"],
     usedin="Cable lab, Cable Install (src/screens/lab/cable/data/connectors.analog.ts, connectors.digital.ts)")

C4_RIG = ["Recorder only — NO loudspeakers anywhere in the path. Preamp/recorder at minimum gain, raised only as needed.",
          "2 s one-shot: a short lead-in, the full transient, then 0.5 s of tail."]
C4_SPECS = {"Channels": "Mono", "Length": "2 s", "Levels": "Peaks ≤ −3 dBFS"}
c4_ctx = "Cable and Connector lessons: never hot-plug into a live input; switch phantom off before patching."
recs = [
    rec(rid="CAB-04.1", title="TS plug into a live input",
        files=[("cable_lab/cab04-ts-hotplug.wav", "TS into a live input", "2 s", "", "rec")],
        context=c4_ctx + " The hot-plug rule.",
        teaches="Why you mute before patching: a TS plug sliding into a live input shorts tip to sleeve on the way in and makes a loud pop and buzz.",
        record="A TS cable plugged into a live line input.",
        how=C4_RIG + ["Plug a TS cable (other end connected to a powered source with nothing playing) into a live line input at a normal speed."],
        tips=["Do the CAB-04 set last on the bench day.", "Take three and keep the most typical."], specs=C4_SPECS, qc=["Full transient, no digital clipping."], safety=SAFE3),
    rec(rid="CAB-04.2", title="RCA plugged in live (buzz while seating)",
        files=[("cable_lab/cab04-rca-seating-buzz.wav", "RCA plugged in live", "2 s", "", "rec")],
        context=c4_ctx + " The consumer-connector case.",
        teaches="An RCA connects its centre pin before its shield, so there is a loud buzz while it seats, until the shield makes contact — a different sound from the TS pop.",
        record="An RCA cable pushed into a live input slowly enough to hear the buzz while seating.",
        how=C4_RIG + ["Push an RCA plug (other end on a powered source) into a live input over about half a second."],
        tips=["Same session as CAB-04.1."], specs=C4_SPECS, qc=["Buzz audible during seating, then stops."], safety=SAFE3),
    rec(rid="CAB-04.3", title="+48 V phantom switched ON, condenser connected",
        files=[("cable_lab/cab04-phantom-on.wav", "+48 V on, condenser connected", "2 s", "", "rec")],
        context=c4_ctx + " The phantom-on thump.",
        teaches="Switching phantom on sends a thump through the channel as the mic's circuit charges — why phantom is switched with the channel muted and the speakers down.",
        record="A robust condenser connected; +48 V switched on.",
        how=C4_RIG + ["Robust condenser connected. Phantom fully drained beforehand. Switch +48 V ON."],
        tips=["Then wait and record CAB-04.4."], specs=C4_SPECS, qc=["Thump captured whole; no clipping."], safety=SAFE3),
    rec(rid="CAB-04.4", title="+48 V phantom switched OFF",
        files=[("cable_lab/cab04-phantom-off.wav", "+48 V off", "2 s", "", "rec")],
        context=c4_ctx + " The phantom-off thump.",
        teaches="Switching phantom off thumps too, as the supply drains — both directions need the channel muted.",
        record="The same condenser; +48 V switched off.",
        how=C4_RIG + ["After CAB-04.3, wait a few seconds; switch +48 V OFF. Let phantom drain fully before any other take."],
        tips=["Do not unplug the mic until the phantom has drained."], specs=C4_SPECS, qc=["Thump captured whole; no clipping."], safety=SAFE3),
]
item(id="CAB-04", title="Hot-plug pops and phantom-power thumps", pri="P2", sess=[4], group=G,
     used="Cable and Connector lessons: never hot-plug into a live input; switch phantom off before patching.",
     recs=recs, safety=SAFE3, reuse="None.", see=["CAB-05"], usedin="Cable lab, Connector Select (src/screens/lab/cable/, src/screens/lab/connectorselect/)")

C5_HOW = ["A condenser on phantom in a quiet box or room; the mic itself stays still. Same mic, same gain for both takes.",
          "The cable lies on a hard floor. The same person flexes and taps it the same way for 8 s."]
C5_SPECS = {"Channels": "Mono", "Length": "8 s", "Set": "FIXED-GAIN"}
recs = [
    rec(rid="CAB-05.1", title="Cheap mic cable, flexed and tapped",
        files=[("cable_lab/cab05-cable-cheap.wav", "Cheap cable", "8 s", "", "rec")],
        context="Cable lab, mic cable construction: why good mic cable is built to stay quiet when it moves.",
        teaches="Triboelectric (handling) noise: a cheap cable crackles and thumps when it is moved, stepped on or tapped, and the noise comes through the mic channel.",
        record="The condenser's cable (a cheap one) flexed and tapped on a hard floor.", how=C5_HOW,
        tips=["Record .1 and .2 back to back; swap only the cable."], specs=C5_SPECS, qc=["Handling noise clearly audible."], safety=SAFE3),
    rec(rid="CAB-05.2", title="Good mic cable, flexed and tapped",
        files=[("cable_lab/cab05-cable-good.wav", "Good cable", "8 s", "", "rec")],
        context="Cable lab, mic cable construction: the reference.", teaches="A well-made cable handled the same way stays quiet.",
        record="Same as CAB-05.1, but a good-quality mic cable.", how=C5_HOW, tips=["Same person, same movements."], specs=C5_SPECS,
        qc=["Clearly quieter than CAB-05.1 at the same gain."], safety=SAFE3),
]
item(id="CAB-05", title="Mic-cable handling noise, cheap versus good", pri="P3", sess=[4], group=G,
     used="Cable lab (mic cable construction).", recs=recs, safety=SAFE3, reuse="None.", see=["MPR-05a"], usedin="Cable lab (src/screens/lab/cable/)")

recs = [
    rec(rid="PATCH-01.1", title="Patch-cord insertion click",
        files=[("patchbay/patch01-cord-insert-click.wav", "Patch cord insertion click", "1 s", "", "rec")],
        context="Patchbay lab › processor chain and the SERVICE CALL: the one real sound in the half-normal lesson, heard when a cord moves. The dry, compressed and cord-pulled audio around it is rendered by the app from the MIX-01 dry lead.",
        teaches="A cord moving in a patchbay makes a sound — and on a half-normalled return the signal then falls back silently to the dry path, so the click is the only warning.",
        record="One real patch-cord insertion click, captured through the console while a signal passes.",
        how=["TT or 1/4 in patchbay, half-normalled insert, the house lead vocal (MIX-01.7) passing at line level.",
             "Insert a cord into the return jack; capture the console output. Trim to 1 s around the click."],
        tips=["Take several insertions and keep the most typical one.", "Do it during the console + amp rig block."],
        specs={"Channels": "Mono", "Length": "1 s", "Levels": "Peaks ≤ −3 dBFS"}, qc=["A real, short click; no clipping."], safety=SAFE1),
    rec(rid="PATCH-01.2", title="Dry lead vocal — reuse of MIX-01.7",
        files=[("mixing_lab/mix-lead.wav", "Dry lead", "—", "Reuse — MIX-01", "reuse")],
        context="The vocal the Patchbay lab processes and renders as dry, compressed and “cord pulled”.",
        teaches="See MIX-01.7.", record="Reuse — no new recording: MIX-01.7 (mixing_lab/mix-lead.wav).",
        how=["Nothing extra."], tips=[], specs={"Source": "MIX-01.7"}, qc=[]),
]
item(id="PATCH-01", title="Patchbay: a patch-cord insertion click", pri="P2", sess=[4], group=G,
     used="Patchbay lab › processor chain and the SERVICE CALL: pulling the return cord from a half-normalled jack silently falls back to the DRY vocal. The dry/compressed/cord-pulled audio is rendered by the app from the MIX-01 dry lead.",
     recs=recs, safety=SAFE1, reuse="—", see=["MIX-01"], usedin="Patchbay lab (src/screens/lab/patchbay/pagesA.tsx, pagesC.tsx)")

# ================================================================ PRODUCTION / POST
G = "Production and Post"
NG_CTX = "Production / Post lab, Northgate episode 4 media stage: the learner ingests and verifies a media inventory of exactly these file names and must judge each row."
NG_VOICE_HOW = ["Studio/booth, dynamic mic at 10 cm, each voice on its own track, recorded at 48 kHz/24-bit. Every track runs the whole ≈ 62 s conversation from the original scripted Northgate episode 4 (House Scripts).",
                "The host, the studio guest and the remote guest perform together, the remote guest over a real call. Slate the start with a hand clap that all three recorders hear."]
recs = [
    rec(rid="PROD-01.1", title="Host track (as authored + clean master)",
        files=[("production_post/as_authored/NG_E4_host.wav", "Host · as authored", "62 s", "48 kHz / 24-bit mono", "rec"),
               ("production_post/clean/NG_E4_host.wav", "Host · clean master", "62 s", "48/24", "edit")],
        context=NG_CTX + " The host track is a healthy row: 62 s at 48 kHz/24-bit mono — the reference the other rows are checked against.",
        teaches="What a correct inventory row looks like — the right length, format and sound — so the faulty rows stand out against it.",
        record="The host's side of the scripted conversation, close-miked, ≈ 62 s.",
        how=NG_VOICE_HOW + ["Deliver the same take twice: in the as_authored folder and in the clean folder. Both are 48/24 and identical in content."],
        tips=["Keep the exact file name NG_E4_host.wav — the lab already shows it.", "Record PROD-02's host lines straight after, while the voice is warm."],
        specs={"Channels": "Mono", "Format": "48 kHz / 24-bit", "Length": "62 s", "Levels": "Voice peaks ≈ −6 dBFS"},
        qc=["Exactly 62 s, 48 kHz/24-bit mono in both folders.", "Clean, close, consistent speech; no plosive pops (those belong to PROD-02.1)."]),
    rec(rid="PROD-01.2", title="Studio guest track (as authored + clean master)",
        files=[("production_post/as_authored/NG_E4_guest_studio.wav", "Studio guest · as authored", "62 s", "48 kHz / 24-bit mono", "rec"),
               ("production_post/clean/NG_E4_guest_studio.wav", "Studio guest · clean master", "62 s", "48/24", "edit")],
        context=NG_CTX + " The studio guest is the second healthy row, recorded in the same room as the host.",
        teaches="The second healthy row: the same format and length as the host, so a learner can confirm two files that belong together.",
        record="The studio guest's side of the same conversation, ≈ 62 s.",
        how=["Same room, mic type, distance and format as PROD-01.1, on its own track.", "Deliver in both folders, identical content."],
        tips=["Keep the exact name NG_E4_guest_studio.wav.", "Record the PROD-02 guest problems (HVAC, mouth click) right after."],
        specs={"Channels": "Mono", "Format": "48 kHz / 24-bit", "Length": "62 s", "Levels": "Voice peaks ≈ −6 dBFS"},
        qc=["Exactly 62 s, 48/24 mono in both folders.", "Matches the host track in tone (same mic type and distance)."]),
    rec(rid="PROD-01.3", title="Remote guest double-ender (as received + 48/24 conversion)",
        files=[("production_post/as_authored/NG_E4_guest_remote.wav", "Remote guest · as received", "58 s", "44.1 kHz / 16-bit mono", "rec"),
               ("production_post/clean/NG_E4_guest_remote.wav", "Remote guest · converted to 48/24", "58 s", "48/24", "edit")],
        context=NG_CTX + " The remote file is “sent by the guest”: 58 s at 44.1 kHz/16-bit. The learner must decide it is a FACT to handle (convert), not a fault.",
        teaches="A mixed sample rate is normal in remote work and is handled by a good sample-rate conversion; the low-quality laptop/phone sound is the real-world double-ender.",
        record="The remote guest recording themselves locally on their own laptop or phone mic at 44.1 kHz/16-bit, during the call — a real “double-ender”.",
        how=["The remote guest joins over a real call AND records themselves locally on their laptop or phone mic at 44.1 kHz/16-bit — real low quality.",
             "They start a little late, so their file is ≈ 58 s.",
             "As authored: deliver their file exactly as received (44.1/16, 58 s).",
             "Clean: sample-rate convert to 48 kHz/24-bit with a high-quality converter — the only conversion allowed in this brief."],
        tips=["Send the guest a one-page setup note (record locally, 44.1/16, phone flat on a soft surface) the day before.", "The clap slate helps line the double-ender up with the studio tracks."],
        specs={"Channels": "Mono", "Format": "As received 44.1 kHz/16-bit; clean copy 48/24", "Length": "58 s"},
        qc=["As-received file is exactly 44.1 kHz/16-bit, 58 s.", "It really sounds like a laptop/phone mic.", "The clean copy is the same audio at 48/24 — no other processing."]),
    rec(rid="PROD-01.4", title="Room tone, full 30 s (clean master)",
        files=[("production_post/clean/NG_E4_room.wav", "Room tone · full", "30 s", "48/24", "rec")],
        context=NG_CTX + " The clean-folder room tone is the complete file editors use to fill gaps.",
        teaches="Proper room tone: 30 s of the studio's own silence, recorded with the mics as set, so edits can be filled without holes.",
        record="30 s of the studio with everyone silent and still, mics as set for PROD-01.1/.2.",
        how=["Straight after the conversation, nobody moves: record 30 s of the room on the host mic at the same gain.", "No HVAC change, no door movement."],
        tips=["Announce “room tone, 30 seconds” and have everyone freeze; then cut the announcement off."],
        specs={"Channels": "Mono", "Format": "48 kHz / 24-bit", "Length": "30 s"},
        qc=["30 s exactly; no voices, rustles or clicks."]),
    rec(rid="PROD-01.5", title="Room tone truncated to 4 s (as authored — deliberate fault)",
        files=[("production_post/as_authored/NG_E4_room.wav", "Room tone · truncated", "4 s", "Cut off mid-way on purpose", "edit")],
        context=NG_CTX + " This row is the inventory's one true fault: a room-tone file that “stops part way”.",
        teaches="A truncated file is a real fault to catch at ingest: it plays and looks valid but holds 4 s instead of 30 s, which is too short to fill an edit.",
        record="An edit of PROD-01.4: the room tone cut off abruptly at 4 s.",
        how=["Copy PROD-01.4 and cut it at 4 s with NO fade, so it stops abruptly mid-way.", "Keep the 48/24 mono format."],
        tips=["Make it straight after delivering PROD-01.4."],
        specs={"Channels": "Mono", "Format": "48 kHz / 24-bit", "Length": "4 s (cut off mid-way)"},
        qc=["Exactly 4 s; ends abruptly."]),
    rec(rid="PROD-01.6", title="Theme music, full 15 s (clean master)",
        files=[("production_post/clean/theme_music.wav", "Theme · full", "15 s", "48/24 stereo, original music", "rec")],
        context=NG_CTX + " The full theme the show opens with.",
        teaches="A healthy stereo music row at 48/24, so the learner sees that a stereo file among mono voice files is correct for music.",
        record="A 15 s original instrumental sting, stereo.",
        how=["Recorded in session 3 with the house band (or a solo player), stereo, 48 kHz/24-bit.", "Wholly original — no library music, no samples."],
        tips=["Record it at the end of the MIX-01 band session while the band is set up."],
        specs={"Channels": "Stereo", "Format": "48 kHz / 24-bit", "Length": "15 s"},
        qc=["Wholly original.", "15 s with a clean ending."]),
    rec(rid="PROD-01.7", title="Theme music, as authored (2 s, 44.1 kHz/16-bit excerpt)",
        files=[("production_post/as_authored/theme_music.wav", "Theme · as authored", "2 s", "44.1 kHz / 16-bit stereo", "edit")],
        context=NG_CTX + " The lab lists theme_music.wav as 2 s, 44.1 kHz/16-bit stereo; this file makes that row real.",
        teaches="A second format mismatch in the inventory (44.1/16 among 48/24 files) that has to be noticed and handled.",
        record="An edit of PROD-01.6: a 2 s excerpt converted to 44.1 kHz/16-bit stereo.",
        how=["Take a 2 s excerpt of PROD-01.6 and render it as 44.1 kHz/16-bit stereo (with dither)."],
        tips=["Make it straight after PROD-01.6."],
        specs={"Channels": "Stereo", "Format": "44.1 kHz / 16-bit", "Length": "2 s"},
        qc=["Exactly 2 s, 44.1 kHz/16-bit stereo."]),
]
item(id="PROD-01", title="“Northgate, episode 4” — the raw media", pri="P2", sess=[1, 3], group=G,
     used="Production / Post lab, Northgate episode 4: the learner ingests and verifies a media inventory of exactly these file names — host and studio guest (62 s, 48 kHz/24-bit mono), a remote guest file “sent by the guest” (58 s, 44.1 kHz/16-bit), a room-tone file that “stops part way” (4 s), a duplicate host file, and theme_music.wav (listed as 2 s, 44.1 kHz/16-bit stereo). Today the files exist only as table rows.",
     recs=recs, safety=[], reuse="PROD-02 (problems on these voices), SS-03 context.", see=["PROD-02", "PROD-03"],
     usedin="Production / Post lab › Northgate ep. 4 media stage (src/features/production/postprod/stage2.data.ts)")

P2_CTX = "Production / Post › editing stage problem list. The learner rates each problem's severity by ear and chooses repair, reduce, keep or re-record."
P2_SPECS = {"Channels": "Mono", "Length": "4–6 s", "Levels": "Peaks ≤ −3 dBFS"}
P2_TIP_2 = "Two examples are delivered: two different lines (or two moments), same method."
recs = [
    rec(rid="PROD-02.1", title="Plosive (host)",
        files=[("production_post/prod02-plosive-1.wav", "Plosive (host, “Palace Theatre…”) · 1", "4–6 s", "", "rec"),
               ("production_post/prod02-plosive-2.wav", "Plosive (host, “Palace Theatre…”) · 2", "4–6 s", "", "rec")],
        context=P2_CTX + " The plosive row (host, rated “distracting”, action: repair).",
        teaches="A plosive is a low thump of air on a P or B: distracting, but repairable in the edit (high-pass or plosive repair on just that syllable) — no re-record needed.",
        record="The host's line with “Palace Theatre… Bridge Street”, read at 5 cm with no pop filter.",
        how=["Same host, same mic type as PROD-01.1, but at 5 cm and with the pop filter removed.", "Read the line naturally; do not exaggerate the Ps."],
        tips=[P2_TIP_2, "Record straight after the PROD-01 conversation while the voices are warm."], specs=P2_SPECS,
        qc=["A clear low-frequency pop on the P/B; no clipping."]),
    rec(rid="PROD-02.2", title="HVAC under the studio guest",
        files=[("production_post/prod02-hvac-1.wav", "HVAC under the studio guest (session 2 room) · 1", "4–6 s", "", "rec"),
               ("production_post/prod02-hvac-2.wav", "HVAC under the studio guest (session 2 room) · 2", "4–6 s", "", "rec")],
        context=P2_CTX + " The HVAC row (guest, “noticeable”, action: reduce — air conditioning throughout).",
        teaches="Steady air-conditioning noise under speech is noticeable but best REDUCED (noise reduction), not removed or re-recorded.",
        record="The studio guest reading a line in the session-2 room with the HVAC running.",
        how=["Session-2 room, HVAC on. Studio guest on the same mic type at 10 cm.", "Read a line from the script."],
        tips=[P2_TIP_2, "Batch with TL-01 (the same HVAC room)."], specs=P2_SPECS,
        qc=["HVAC rumble/hiss clearly audible under and between words."]),
    rec(rid="PROD-02.3", title="Mouth click (studio guest)",
        files=[("production_post/prod02-mouth-click-1.wav", "Mouth click (studio guest) · 1", "4–6 s", "", "rec"),
               ("production_post/prod02-mouth-click-2.wav", "Mouth click (studio guest) · 2", "4–6 s", "", "rec")],
        context=P2_CTX + " The mouth-noise row (guest, “subtle”). The lab's lesson is that re-recording it would be the expensive wrong call.",
        teaches="A mouth click is a small, dry tick — subtle enough that nobody would notice it in context. A re-record costs a session and a performance that won't match.",
        record="Natural mouth clicks from the studio guest (dry mouth) — never faked.",
        how=["Close mic, studio guest reading. Clicks come naturally with a dry mouth (no water for a while, after a long read).", "Pick two lines where a click is clearly but subtly audible."],
        tips=[P2_TIP_2, "Do not add clicks by any other means."], specs=P2_SPECS, qc=["The click is real and audible on close listening only."]),
    rec(rid="PROD-02.4", title="Edit click (host) — a cut off a zero crossing",
        files=[("production_post/prod02-edit-click-1.wav", "Edit click (host) — a cut made off a zero crossing · 1", "4–6 s", "", "edit"),
               ("production_post/prod02-edit-click-2.wav", "Edit click (host) — a cut made off a zero crossing · 2", "4–6 s", "", "edit")],
        context=P2_CTX + " The clicks row (host, “subtle”, action: repair).",
        teaches="A badly made edit clicks: cutting off a zero crossing with no fade creates a step in the waveform. It is repaired with a short crossfade.",
        record="An edit of host speech: a cut placed NOT on a zero crossing, with no fade.",
        how=["In your editor, take a host line from PROD-01.1, cut it at a point that is NOT a zero crossing, and join it with no fade so it clicks.", "This is the only deliberate editing defect in this brief."],
        tips=[P2_TIP_2], specs=P2_SPECS, qc=["One audible click at the edit point; nothing else changed."]),
    rec(rid="PROD-02.5", title="Remote dropout — half a word gone",
        files=[("production_post/prod02-remote-dropout-1.wav", "Remote dropout — half a word gone · 1", "4–6 s", "", "rec"),
               ("production_post/prod02-remote-dropout-2.wav", "Remote dropout — half a word gone · 2", "4–6 s", "", "rec")],
        context=P2_CTX + " The dropout row (remote, “distracting”, “half a word gone”), which the learner must decide how to handle.",
        teaches="A call dropout loses part of a word: it cannot be repaired from what is there, so it needs the double-ender (PROD-01.3), a pickup or a cut.",
        record="A real dropout on the call side of the remote guest's audio.",
        how=["Move the remote guest onto weak Wi-Fi during a line. Record the CALL side (what the studio receives), not their local file.", "Keep two takes where half a word disappears."],
        tips=[P2_TIP_2, "Record during the PROD-01 session while the call is up."], specs=P2_SPECS, qc=["Part of a word is clearly missing."]),
    rec(rid="PROD-02.6", title="Breaths kept",
        files=[("production_post/prod02-breath-kept-1.wav", "Breaths kept · 1", "4–6 s", "", "rec"),
               ("production_post/prod02-breath-kept-2.wav", "Breaths kept · 2", "4–6 s", "", "rec")],
        context=P2_CTX + " The breath decision: the natural version.",
        teaches="Natural breaths keep speech sounding human and paced.",
        record="A passage of continuous speech with its natural breaths.",
        how=["Host or guest reads a 4–6 s passage with natural breaths; no editing."],
        tips=[P2_TIP_2, "PROD-02.7 is cut from these same takes."], specs=P2_SPECS, qc=["Breaths audible but natural."]),
    rec(rid="PROD-02.7", title="Breaths removed (edited out)",
        files=[("production_post/prod02-breath-removed-1.wav", "Breaths removed (edited out) · 1", "4–6 s", "", "edit"),
               ("production_post/prod02-breath-removed-2.wav", "Breaths removed (edited out) · 2", "4–6 s", "", "edit")],
        context=P2_CTX + " The breath decision: the over-edited version. The lab warns “speech with every breath removed does not sound clean, it sounds synthetic”.",
        teaches="Removing every breath makes speech sound synthetic and tiring, though no one can say why.",
        record="Edits of PROD-02.6: the same passages with every breath cut out.",
        how=["From each PROD-02.6 take, edit out every breath and close the gaps (with short crossfades, so there are no clicks)."],
        tips=["Make -1 from breath-kept-1 and -2 from breath-kept-2."], specs=P2_SPECS, qc=["No breaths left; no edit clicks; it sounds unnaturally breathless."]),
]
item(id="PROD-02", title="Northgate: the problem list", pri="P2", sess=[1, 2], group=G,
     used="Production / Post › editing stage problem list: host plosive, HVAC under the guest, a guest mouth noise, host clicks, a remote dropout (“half a word gone”); plus the choice of what happens to breaths (“speech with every breath removed does not sound clean, it sounds synthetic”). Today text only.",
     recs=recs, safety=[], reuse="—", see=["PROD-01", "SPC-04"], usedin="Production / Post › editing stage (src/features/production/postprod/stage4.data.ts)")

P3_LINE = "Line: “I told you the door was locked when I got here.”"
P3_CTX = "Production / Post stage 5 <em>Replacement and Pickup Recording</em>, including the warning case “replacement recorded with no plan to match it”."
recs = [
    rec(rid="PROD-03.1", title="Location line (boom shotgun)",
        files=[("production_post/prod03-location-line.wav", "Location line (boom shotgun)", "4 s", "Session 2", "rec")],
        context=P3_CTX + " The original the replacement must match.",
        teaches="The sound of a location recording: a boom from above and in front picks up the room as well as the voice.",
        record="The line recorded on location in the session-2 room on a boom shotgun.",
        how=[P3_LINE, "Session-2 room, boom shotgun 60 cm above and in front of the talker, natural room."],
        tips=["Photograph the mic position so the matched ADR (PROD-03.3) can copy it."], specs={"Channels": "Mono", "Length": "≈ 4 s"},
        qc=["Natural room sound around the voice."]),
    rec(rid="PROD-03.2", title="ADR, unmatched (booth LDC at 15 cm)",
        files=[("production_post/prod03-adr-unmatched.wav", "ADR, unmatched (LDC 15 cm)", "4 s", "Session 1", "rec")],
        context=P3_CTX + " The warning case: replacement recorded with no plan.",
        teaches="An unplanned replacement sounds closer, drier and fuller than the location line and jumps out of the scene — processing cannot fix the mismatch.",
        record="The same line, same talker, in the dry booth on an LDC at 15 cm.",
        how=[P3_LINE, "Booth: LDC at 15 cm with a pop filter."], tips=["Record it in session 1 with the other booth work."],
        specs={"Channels": "Mono", "Length": "≈ 4 s"}, qc=["Obviously closer and drier than PROD-03.1."]),
    rec(rid="PROD-03.3", title="ADR, matched (same shotgun at 60 cm)",
        files=[("production_post/prod03-adr-matched.wav", "ADR, matched (shotgun 60 cm)", "4 s", "", "rec")],
        context=P3_CTX + " The correct, planned replacement.",
        teaches="Matching is a RECORDING decision: the same mic model, distance and perspective in a similar room gets close to the location sound.",
        record="The same line on the same shotgun model at 60 cm above and in front, in a room or booth set to resemble the location, with room tone.",
        how=[P3_LINE, "Same shotgun model at 60 cm above and in front (copy the photo), in a room or booth set up to resemble the location.", "Also record room tone to go with it."],
        tips=["Do it right after PROD-03.1 in the same room if possible."], specs={"Channels": "Mono", "Length": "≈ 4 s"},
        qc=["Close to PROD-03.1 in tone and perspective."]),
]
item(id="PROD-03", title="ADR versus the location line", pri="P3", sess=[2, 1], group=G,
     used="Production / Post stage 5 <em>Replacement and Pickup Recording</em>, including the warning case “replacement recorded with no plan to match it”.",
     recs=recs, safety=[], reuse="—", see=["PROD-01"], usedin="Production / Post stage 5 (src/features/production/postprod/stage5.data.ts)")

recs = [
    rec(rid="PROD-04a.1", title="Street atmosphere, 60 s (ORTF)",
        files=[("production_post/prod04-street-atmos-60s.wav", "Street atmosphere, ORTF", "60 s", "", "rec")],
        context="Production / Post stage 5 <em>Atmosphere, Effects and Design</em>: the usable atmosphere bed for the scene.",
        teaches="A good atmosphere is long and varied enough that no event repeats, so it can sit under a scene without being noticed.",
        record="60 s of a quiet-to-moderate street in ORTF.",
        how=["Quiet-to-moderate street; ORTF pair at 1.5 m.", "60 s with no intelligible speech and no music.", "Include one or two distinctive events (a door slam, a bicycle bell) — PROD-04a.2 is cut around one."],
        tips=["Original recordings only — no library atmospheres.", "Record 3–4 minutes and choose the best 60 s."],
        specs={"Channels": "Stereo", "Length": "60 s", "Levels": "Peaks ≤ −6 dBFS"}, qc=["No intelligible words, no music."]),
    rec(rid="PROD-04a.2", title="4 s excerpt that repeats audibly when looped",
        files=[("production_post/prod04-street-atmos-4s-loop.wav", "4 s excerpt that repeats audibly", "4 s", "Edit", "edit")],
        context="Production / Post stage 5: the effects list's “street atmosphere — 4 second file”, and the lab's warning that repeated material is recognised as a loop after a few passes.",
        teaches="A short loop with a recognisable event gives itself away: the ear spots the door slam (or bell) coming round again.",
        record="An edit of PROD-04a.1: a 4 s excerpt containing one distinctive event.",
        how=["Cut 4 s from PROD-04a.1 that contains ONE distinctive event (a single door slam or bicycle bell).", "Make the loop point seamless (crossfade) so only the repetition, not a click, gives it away."],
        tips=["Loop it three times yourself to check the repetition is obvious."],
        specs={"Channels": "Stereo", "Length": "4 s", "Levels": "Peaks ≤ −6 dBFS"}, qc=["Repetition obvious on the second or third pass; no click at the loop point."]),
]
item(id="PROD-04a", title="Street atmosphere, and a loop that gives itself away", pri="P3", sess=[6], group=G,
     used="Production / Post stage 5 <em>Atmosphere, Effects and Design</em>: the effects list includes a “street atmosphere — 4 second file”, and the lab warns that repeated material is recognised as a loop after a few passes.",
     recs=recs, safety=[], reuse="—", see=["PROD-04b", "NOI-01a"], usedin="Production / Post stage 5 (src/features/production/postprod/stage5.data.ts)")

F_HOW = "Dry room; mic (LDC or shotgun) 50–100 cm from the action."
F_SPECS = {"Channels": "Mono", "Length": "3–6 s", "Levels": "Peaks ≤ −3 dBFS"}
F_CTX = "Production / Post stage 5 effects: foley performed to picture."
F_TIP = "Original recordings only. Record all five in one foley block with the same mic and room."
recs = [
    rec(rid="PROD-04b.1", title="Footsteps on concrete",
        files=[("production_post/prod04-foley-footsteps-concrete.wav", "Footsteps, concrete", "5 s", "", "rec")],
        context=F_CTX + " The hard-surface footsteps.", teaches="Footsteps carry the surface: concrete gives a hard, short heel click.",
        record="6–8 steps on concrete at a walking pace.", how=[F_HOW, "Walk 6–8 steps at a walking pace on concrete, hard-soled shoes."],
        tips=[F_TIP, "Walk in place over a small patch if the room is short; keep the mic distance constant."], specs=F_SPECS, qc=["Dry, close, clean; even steps."]),
    rec(rid="PROD-04b.2", title="Footsteps on wood (or gravel)",
        files=[("production_post/prod04-foley-footsteps-wood.wav", "Footsteps, wood (or gravel)", "5 s", "", "rec")],
        context=F_CTX + " The second surface, for contrast.", teaches="The same walk on wood (or gravel) sounds completely different — the surface tells the audience where the scene is.",
        record="6–8 steps on wood (or gravel) at the same pace and shoes as PROD-04b.1.", how=[F_HOW, "Same shoes and pace as PROD-04b.1; a wooden floor or a gravel tray."],
        tips=[F_TIP], specs=F_SPECS, qc=["Clearly different surface from PROD-04b.1."]),
    rec(rid="PROD-04b.3", title="Door open and close",
        files=[("production_post/prod04-foley-door.wav", "Door open/close", "4 s", "", "rec")],
        context=F_CTX + " A door effect.", teaches="A door is a sequence — handle, swing, latch — performed and recorded close.",
        record="One interior door opened and closed.", how=[F_HOW, "Open and close one interior door: handle, swing, latch."],
        tips=[F_TIP], specs=F_SPECS, qc=["Handle, swing and latch all audible."]),
    rec(rid="PROD-04b.4", title="Cup set down",
        files=[("production_post/prod04-foley-cup.wav", "Cup set down", "3 s", "", "rec")],
        context=F_CTX + " A small prop sound.", teaches="Small sounds need close, quiet recording to be usable.",
        record="A ceramic cup set down on a wooden table.", how=[F_HOW, "Set a ceramic cup down on a wooden table, normally."],
        tips=[F_TIP], specs=F_SPECS, qc=["One clean contact; no extra rattles."]),
    rec(rid="PROD-04b.5", title="Clothing rustle",
        files=[("production_post/prod04-foley-clothing.wav", "Clothing rustle", "4 s", "", "rec")],
        context=F_CTX + " The movement layer under any character.", teaches="Clothing rustle is the quiet layer that makes on-screen movement feel real.",
        record="A jacket rustle.", how=[F_HOW, "Move in a jacket as a character would (arms, shrug)."],
        tips=[F_TIP], specs=F_SPECS, qc=["Dry and clean; no footsteps or voice."]),
]
item(id="PROD-04b", title="Foley: footsteps, door, cup, clothing", pri="P3", sess=[6], group=G,
     used="Production / Post stage 5 effects: foley performed to picture.",
     recs=recs, safety=[], reuse="—", see=["PROD-04a"], usedin="Production / Post stage 5 (src/features/production/postprod/stage5.data.ts)")

# ================================================================ ROOM DESIGN
RD_RIG = ["A small, bare room (bedroom/office size) with parallel hard walls and a pair of studio monitors.",
          "Binaural dummy head (or in-ear binaural mics on a person who stays still) at seated ear height. Same recorder gain for the untreated and treated passes.",
          "Good seat: the planned listening position (≈ 38% of room length). Boom seat: play a slow sine sweep 30–200 Hz and walk the room with an SPL meter; the seat with the largest bass peak.",
          "Treated pass: broadband absorbers at the first-reflection points, corner bass traps, a ceiling cloud and a rug (portable panels/gobos are fine)."]
STIM = {
    "clap-goodseat": ("Clap at the good seat", "A single hand clap from the speaker position, heard at the good seat.",
                      "the room's decay and early reflections on a clap", "Clap once, firmly, at the left-monitor position; let it ring out fully."),
    "speech-goodseat": ("Speech (SS-03a) at the good seat", "SS-03a.1 speech played through the monitors, heard at the good seat.",
                        "how the room affects speech clarity", "Play SS-03a.1 (male reference passage) through the monitors at a natural speech level; capture a 6 s excerpt."),
    "ir-goodseat": ("Sweep IR at the good seat", "A 10 s log sweep through the monitors at the good seat, deconvolved to an impulse response.",
                    "the room's measured decay (impulse response)", "Play a 10 s log sweep at ≈ 85 dBA at the mic; deconvolve to the impulse response (as WAV-02). Deliver the IR."),
    "music-goodseat": ("Music (MST-01 a) at the good seat", "MST-01.1 music through the monitors at ≈ 80 dBA, heard at the good seat.",
                       "how the room colours music at the best seat", "Play MST-01.1 through the monitors at ≈ 80 dBA; capture a 6 s excerpt (same excerpt every time)."),
    "music-boomseat": ("Music at the modal “boom” seat", "The same music excerpt heard at the boom seat.",
                       "the room's modes: a seat where one bass region piles up", "Same music and level as music-goodseat, head moved to the boom seat."),
    "flutter-clap": ("Clap between the parallel walls (flutter)", "A clap between the two parallel hard walls.",
                     "flutter echo — a fast, zingy repeat between parallel walls", "Stand midway between the parallel walls; clap once; the head beside you at ear height."),
}
recs = []
n = 0
for c, cn in (("untreated", "Before treatment"), ("treated", "After treatment")):
    for k in ("clap-goodseat", "speech-goodseat", "ir-goodseat", "music-goodseat", "music-boomseat", "flutter-clap"):
        n += 1
        lab, rec_txt, what, step = STIM[k]
        if c == "untreated":
            teach = {"clap-goodseat": "The bare room rings: a long, uneven decay with hard early reflections.",
                     "speech-goodseat": "In the bare room the speech blurs — reflections smear the consonants.",
                     "ir-goodseat": "The bare room's IR has a long tail and strong early spikes from the hard walls.",
                     "music-goodseat": "Even at the best seat the bare room adds ring and uneven bass to the music.",
                     "music-boomseat": "At the boom seat one bass region swells and drones — the room's mode, not the music.",
                     "flutter-clap": "Untreated parallel walls give a fast, metallic “zing” after the clap."}[k]
        else:
            teach = {"clap-goodseat": "After treatment the clap decays clearly faster and smoother.",
                     "speech-goodseat": "After treatment the same speech is clearer: fewer reflections smear the words.",
                     "ir-goodseat": "The treated IR is shorter, with the early spikes tamed.",
                     "music-goodseat": "Treated, the music at the good seat is tighter and more even.",
                     "music-boomseat": "Even treated, the boom seat still has a bass hump — the fix for a modal seat is moving the seat or more trapping.",
                     "flutter-clap": "Treated, the flutter echo is gone."}[k]
        recs.append(rec(
            rid="RD-01.%d" % n, title="%s · %s" % (cn, lab),
            files=[("room_design/rd01-%s-%s.wav" % (c, k), "%s · %s" % (cn, lab), "6 s", "Binaural", "edit" if k == "ir-goodseat" else "rec")],
            context="Room Design lab, <em>%s</em>: the learner hears %s %s, and compares it with the %s version." % ("Explore placement" if k in ("music-boomseat", "music-goodseat") else "Add treatment", what, "in the bare room" if c == "untreated" else "after the treatment is installed", "treated" if c == "untreated" else "untreated"),
            teaches=teach,
            record="%s (%s)." % (rec_txt, "untreated room" if c == "untreated" else "after treatment"),
            how=RD_RIG + [("UNTREATED pass (first). " if c == "untreated" else "TREATED pass (after installing treatment; identical positions and gain). ") + step],
            tips=["Mark every position with tape so the treated pass matches exactly.", "Record all six untreated takes in one pass, install treatment, then the six treated takes in the same order."],
            specs={"Channels": "Stereo (binaural)", "Length": "6 s (IR as needed)", "Levels": "Peaks ≤ −3 dBFS", "Set": "FIXED-GAIN between untreated and treated"},
            qc=[{"clap-goodseat": "Full decay into the noise floor.", "speech-goodseat": "Same excerpt as its pair.", "ir-goodseat": "Clean IR, no sweep residue or distortion artefacts.",
                 "music-goodseat": "Same excerpt as its pair.", "music-boomseat": "An obvious bass hump compared with the good seat in the same pass.", "flutter-clap": ("Flutter clearly audible." if c == "untreated" else "Flutter gone.")}[k],
                "Same gain and position as its untreated/treated pair."],
            safety=(["Sweeps ≈ 85 dBA: hearing protection for everyone in the room."] if k == "ir-goodseat" else None)))
item(id="RD-01", title="One small room before and after acoustic treatment", pri="P2", sess=[6], group="Room Design",
     used="Room Design lab: <em>Explore placement</em> (modal pressure and reflections update as you move speakers and listener) and <em>Add treatment</em> (absorbers at reflection points, bass traps, a cloud, diffusers, a rug — compare with and without). Today the comparison is visual only.",
     recs=recs, safety=["Sweeps ≈ 85 dBA: hearing protection."], reuse="—", see=["WAV-02", "TL-01"],
     usedin="Room Design lab › Explore placement, Add treatment (src/screens/lab/roomdesign/)")

# ================================================================ AUDIO TOOLS
G = "Audio Tools demos"
TL1_HOW = ["Session-2 room with HVAC. Omni measurement mic at 1.2 m, 3–4 m from the source. Same position and recorder gain for all three.",
           "Include 0.5 s of noise floor before the impulse (the tool needs it), then let the decay run fully into the noise floor."]
TL1_SPECS = {"Channels": "Mono", "Length": "RT60 × 1.5 + 0.5 s pre-roll", "Levels": "Balloon peaks ≤ −3 dBFS", "Set": "FIXED-GAIN"}
TL1_CTX = "Audio Tools › <em>RT60 Reverb Time</em>: the tool records a clap or click, plots the decay, fits a line, and reports RT60, EDT, T20, T30, R² and the clean decay range."
recs = [
    rec(rid="TL-01.1", title="Balloon pop, HVAC off (clean decay)",
        files=[("audio_tools/tl01-balloon-hvac-off.wav", "Balloon, HVAC off (clean decay)", "≈ 2–3 s", "", "rec")],
        context=TL1_CTX + " The good measurement the other two are compared with.",
        teaches="A strong impulse in a quiet room gives 30–40 dB or more of clean decay, so T30 is trustworthy and R² is high.",
        record="A balloon pop with the HVAC switched off.", how=TL1_HOW + ["HVAC OFF; wait a minute for the air to settle. Pop one balloon at the source position."],
        tips=["Do all three takes in one sitting; only the HVAC and the source change.", "Bring spare balloons of the same size."], specs=TL1_SPECS,
        qc=["Clean decay of at least 35–40 dB above the noise floor."], safety=["Balloon pops are loud: hearing protection."]),
    rec(rid="TL-01.2", title="Balloon pop, HVAC on (decay stops ≈ −38 dB)",
        files=[("audio_tools/tl01-balloon-hvac-on.wav", "Balloon, HVAC on (decay stops ≈ −38 dB)", "≈ 2–3 s", "", "rec")],
        context=TL1_CTX + " Shows the noise floor cutting the measurement short.",
        teaches="With the HVAC running, the same strong impulse decays only to about −38 dB before it disappears into the noise — enough for T20, marginal for T30.",
        record="The same balloon pop with the HVAC on.", how=TL1_HOW + ["HVAC ON. Same balloon size and position as TL-01.1."],
        tips=["Record straight after TL-01.1."], specs=TL1_SPECS,
        qc=["The decay flattens into the noise around 35–40 dB below the peak."], safety=["Balloon pops are loud: hearing protection."]),
    rec(rid="TL-01.3", title="Weak hand clap, HVAC on",
        files=[("audio_tools/tl01-clap-hvac-on.wav", "Weak clap, HVAC on", "≈ 2–3 s", "", "rec")],
        context=TL1_CTX + " The tool's common mistake “weak source into a noisy room”.",
        teaches="A weak clap in a noisy room gives too little clean decay: the tool still prints a number, but it isn't real.",
        record="A weak hand clap with the HVAC on.", how=TL1_HOW + ["HVAC ON. A soft, ordinary hand clap at the source position."],
        tips=["Clap softly on purpose; this is the bad example."], specs=dict(TL1_SPECS, Levels="As recorded at the fixed gain"),
        qc=["Only a short decay range above the noise floor."]),
]
item(id="TL-01", title="RT60 tool demo: clean decay versus a noisy room", pri="P2", sess=[2], group=G,
     used="Audio Tools › <em>RT60 Reverb Time</em>: the tool records a clap or click, plots the decay, fits a line, and reports RT60, EDT, T20, T30, R² and the clean decay range. Its common mistakes include “weak source into a noisy room”.",
     recs=recs, safety=["Balloon pops are loud: hearing protection."], reuse="—", see=["WAV-02", "RD-01"], usedin="Audio Tools › RT60 (src/screens/tools/Rt60Screen.tsx)")

recs = [rec(rid="TL-02.1", title="Feedback build — reuse of SS-01.2",
            files=[("sound_systems/ss01-feedback-2k5-build.wav", "Feedback build", "—", "Reuse — SS-01", "reuse")],
            context="Audio Tools › Spectrogram demo scene.", teaches="A feedback ring appears as a single bright horizontal line growing out of speech.",
            record="Reuse — no new recording: SS-01.2 (2.5 kHz build).", how=["Nothing extra."], tips=[], specs={"Source": "SS-01.2"}, qc=[])]
item(id="TL-02", title="Spectrogram demo: feedback", pri="P1", sess=[5], group=G, status="reuse",
     used="Audio Tools › Spectrogram demo scene.", recs=recs, safety=[], reuse="—", see=["SS-01"], usedin="Audio Tools › Spectrogram (src/screens/tools/SpectrogramScreen.tsx)")

recs = [rec(rid="TL-03.1", title="Kick loop and bass DI loop — reuse of EQ-01a and FX-04",
            files=[("eq_lab/eq01-kick-loop.wav", "Kick loop", "—", "Reuse — EQ-01a", "reuse"), ("fx_labs/fx04-bass-di-loop.wav", "Bass DI loop", "—", "Reuse — FX-04", "reuse")],
            context="Audio Tools › SPL meter demo: A and C weighting read differently on bass-heavy sound.", teaches="A-weighting discounts bass; a kick and bass read much higher on C.",
            record="Reuse — no new recording: the EQ-01a kick loop (eq_lab/eq01-kick-loop.wav) and the FX-04 bass DI loop (fx_labs/fx04-bass-di-loop.wav).",
            how=["Nothing extra."], tips=[], specs={"Source": "EQ-01a, FX-04"}, qc=[])]
item(id="TL-03", title="SPL meter demo: A versus C weighting", pri="P3", sess=[3], group=G, status="reuse",
     used="Audio Tools › SPL meter demo: A and C weighting read differently on bass-heavy sound.", recs=recs, safety=[], reuse="—", see=["EQ-01a", "FX-04"], usedin="Audio Tools › SPL meter (src/screens/tools/SplMeterScreen.tsx)")

recs = [
    rec(rid="TL-04.1", title="Tuning fork A4 (440 Hz)",
        files=[("audio_tools/tl04-tuning-fork-a4.wav", "Tuning fork A4", "6 s", "", "rec")],
        context="Audio Tools › tuner and frequency counter demos: the steady reference the tuner locks onto.",
        teaches="A tuning fork holds one pure, steady pitch: the tuner needle sits still on A4 at 440 Hz.",
        record="A struck A4 (440 Hz) tuning fork ringing for 6 s.",
        how=["Booth, SDC at 10 cm.", "Strike the fork on a rubber pad (not a hard surface), then touch its stem to a resonance box or tabletop; let it ring 6 s."],
        tips=["Record TL-04.1 and .2 in the same booth sitting as AUT-01."],
        specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −6 dBFS"}, qc=["Measures 440 Hz ±1 Hz.", "No strike clank dominating the start."]),
    rec(rid="TL-04.2", title="Sung A4 with natural vibrato",
        files=[("audio_tools/tl04-sung-a4-vibrato.wav", "Sung A4 with vibrato", "6 s", "", "rec")],
        context="Audio Tools › tuner demo: the same note from a real voice.",
        teaches="A singer's vibrato swings the pitch above and below the note several times a second — the tuner needle wobbles around A4 instead of sitting still.",
        record="A sung A4 on “ah” with natural vibrato, 6 s.",
        how=["Same booth and mic as TL-04.1.", "Singer (female or tenor): A4 on “ah” with natural vibrato, 6 s. Give the pitch from the fork first."],
        tips=["Record straight after TL-04.1."], specs={"Channels": "Mono", "Length": "6 s", "Levels": "Peaks ≤ −6 dBFS"},
        qc=["Centred on A4 with audible, regular vibrato; no pitch correction."]),
]
item(id="TL-04", title="Tuner demo: tuning fork A4 versus a sung A4 with vibrato", pri="P3", sess=[1], group=G,
     used="Audio Tools › tuner and frequency counter demos.", recs=recs, safety=[], reuse="—", see=["AUT-01"], usedin="Audio Tools › tuner demos (src/screens/tools/)")

recs = [rec(rid="TL-05.1", title="Snare and organ — reuse of ENV-01 and MTR-01",
            files=[("envelope/env01-snare.wav", "Snare", "—", "Reuse — ENV-01", "reuse"), ("meter/mtr01-organ-chord-loop.wav", "Organ", "—", "Reuse — MTR-01", "reuse")],
            context="Audio Tools › meter demo: peak versus average on a transient and a steady sound.", teaches="A snare's peak is far above its average; an organ's are close.",
            record="Reuse — no new recording: the ENV-01 snare (envelope/env01-snare.wav) and the MTR-01 organ (meter/mtr01-organ-chord-loop.wav).",
            how=["Nothing extra."], tips=[], specs={"Source": "ENV-01, MTR-01"}, qc=[])]
item(id="TL-05", title="Meter demo: snare versus organ", pri="P3", sess=[3], group=G, status="reuse",
     used="Audio Tools › meter demo: peak versus average on a transient and a steady sound.", recs=recs, safety=[], reuse="—", see=["ENV-01", "MTR-01"], usedin="Audio Tools › meter demos (src/screens/tools/)")

# ================================================================ OTHER
G = "Other labs"
recs = [
    rec(rid="FM-01.1", title="Struck bell",
        files=[("fm_synth/fm01-struck-bell.wav", "Struck bell", "≈ 6–10 s", "", "rec")],
        context="FM Synthesis lab: the learner builds an FM bell and can compare it with this real one.",
        teaches="A real bell is inharmonic: its partials are not whole-number multiples, which is exactly what FM's non-integer ratios imitate — and its long, beating decay is what the FM envelope has to copy.",
        record="One struck handbell or tubular bell, full decay.",
        how=["Mic at 50 cm, quiet room.", "One strike, mf; let it decay fully into the noise floor."],
        tips=["Record both FM-01 sources in the same session 3 slot."], specs={"Channels": "Mono", "Length": "Full decay", "Levels": "Peaks ≤ −3 dBFS"},
        qc=["Full natural decay; no handling noise."]),
    rec(rid="FM-01.2", title="Electric-piano tine, A3",
        files=[("fm_synth/fm01-ep-tine.wav", "Electric piano tine, A3", "≈ 5 s", "", "rec")],
        context="FM Synthesis lab: the learner builds an FM electric piano and can compare it with a real tine instrument.",
        teaches="A tine electric piano has a bright, bell-like attack that fades to a mellow tone — the attack is the part FM reproduces so well.",
        record="One mf A3 note on a tine-type electric piano, full decay.",
        how=["DI from the instrument.", "One mf A3 note, held to full decay."],
        tips=["Same session as FM-01.1."], specs={"Channels": "Mono", "Length": "Full decay", "Levels": "Peaks ≤ −3 dBFS"},
        qc=["Full natural decay; no pedal or key noise."]),
]
item(id="FM-01", title="FM lab: a real bell and an electric-piano tine", pri="P3", sess=[3], group=G,
     used="FM Synthesis lab: the learner builds an FM bell and electric piano and can compare them with the real thing.",
     recs=recs, safety=[], reuse="—", see=[], usedin="FM Synthesis lab (src/screens/lab/FmLabScreen.tsx)")

recs = [rec(rid="AUT-01.1", title="The Autotune melody, sung naturally out of tune",
            files=[("autotune/aut01-sung-melody-untuned.wav", "Melody A3 B3 C♯4 E4 C♯4 A3, untuned", "≈ 7 s", "", "rec")],
            context="Autotune lab: a fixed demo melody A3, B3, C♯4, E4, C♯4, A3 (1.1 s per note) is shown “sung” off pitch (about +38, −32, +22, −45, +15, −28 cents) and the learner sets AMOUNT and SPEED. This recording is a “before” reference only — live correction of a real voice is out of scope.",
            teaches="What a real, untuned performance sounds like before correction: small, natural pitch errors on held notes.",
            record="That melody sung on “ah”, naturally a little out of tune.",
            how=["Booth, LDC at 8 in.", "Sing to a click at 1.1 s per note; give only the first pitch, then no reference.",
                 "Take several passes; keep the one whose measured errors fall naturally in the 15–45 cent range. Never retune or fake it.",
                 "Log each note's measured cents in the sidecar."],
            tips=["Record in the session-1 booth block with TL-04."], specs={"Channels": "Mono", "Length": "≈ 6.6 s + tail", "Levels": "Peaks ≈ −6 dBFS"},
            qc=["No pitch correction anywhere.", "Measured errors logged per note."])]
item(id="AUT-01", title="Autotune lab: a naturally out-of-tune sung phrase", pri="P3", sess=[1], group=G,
     used="Autotune lab: a fixed demo melody A3, B3, C♯4, E4, C♯4, A3 (1.1 s per note) is “sung” off pitch (about +38, −32, +22, −45, +15, −28 cents) and the learner sets AMOUNT and SPEED (fast snap / medium / slow glide). Live correction of a real voice is out of scope; this is a “before” reference only.",
     recs=recs, safety=[], reuse="—", see=["TL-04"], usedin="Autotune lab (src/screens/lab/AutotuneLabScreen.tsx)")

recs = [rec(rid="SC-01.1", title="Drum loop, vocal and guitar DI — reuse of EAR-02, MIX-01.7 and FX-04",
            files=[("ear_training/ear02-straight.wav", "Drum loop", "—", "Reuse — EAR-02", "reuse"), ("mixing_lab/mix-lead.wav", "Vocal", "—", "Reuse — MIX-01", "reuse"), ("fx_labs/fx04-egtr-di-loop.wav", "Guitar DI", "—", "Reuse — FX-04", "reuse")],
            context="Signal Chain lab (today click, pink and sine only; real sources need a native app build first).", teaches="Following a real signal through a chain.",
            record="Reuse — no new recording: EAR-02 (ear_training/ear02-straight.wav), MIX-01.7 (mixing_lab/mix-lead.wav) and the FX-04 guitar DI (fx_labs/fx04-egtr-di-loop.wav).",
            how=["Nothing extra."], tips=[], specs={"Source": "EAR-02, MIX-01.7, FX-04"}, qc=[])]
item(id="SC-01", title="Signal Chain lab: musical sources", pri="P3", sess=[3], group=G, status="reuse",
     used="Signal Chain lab (today click, pink and sine only; real sources need a native app build first).", recs=recs, safety=[], reuse="—", see=["EAR-02", "MIX-01", "FX-04"], usedin="Signal Chain lab (src/screens/lab/SignalChainLabScreen.tsx)")

recs = [rec(rid="SCN-01.1", title="Flawed mixes, defects and system faults — reuse of MIX-03.2, EAR-04 and SS-02A.3",
            files=[("mixing_lab/mix03-ref-harsh.wav", "Flawed mixes", "—", "Reuse — MIX-03", "reuse"), ("ear_training/ear04-crackle-1.wav", "Defects", "—", "Reuse — EAR-04", "reuse"), ("sound_systems/ss02-polarity-fault.wav", "System faults", "—", "Reuse — SS-02", "reuse")],
            context="Audio Scenarios (study area): short listening problems.", teaches="Diagnosing problems by ear in context.",
            record="Reuse — no new recording: MIX-03 (e.g. MIX-03.2 harsh mix), EAR-04 (e.g. ear04-crackle-1.wav) and SS-02 files (e.g. SS-02A.3 polarity fault). The files listed are examples of each family.",
            how=["Nothing extra."], tips=[], specs={"Source": "MIX-03, EAR-04, SS-02E/A"}, qc=[])]
item(id="SCN-01", title="Audio Scenarios: “what's wrong with this mix?”", pri="P3", sess=[3], group=G, status="reuse",
     used="Audio Scenarios (study area): short listening problems.", recs=recs, safety=[], reuse="—", see=["MIX-03", "EAR-04", "SS-02E", "SS-02A"], usedin="Audio Scenarios")

recs = [rec(rid="GLO-01.1", title="HOLD · Recorded pronunciations (only if a term list arrives)", files=[],
            context="Glossary: pronunciations are text-to-speech by design.", teaches="How tricky terms are said.",
            record="HOLD — only if production sends a term list. Not in scope until then.",
            how=["If requested: house speech setup, one word per file, male voice."], tips=[], specs={"Channels": "Mono"}, qc=[])]
item(id="GLO-01", title="Glossary: recorded pronunciations (optional)", pri="P3", sess=[1], group=G, status="hold",
     used="Glossary: pronunciations are text-to-speech by design.", recs=recs, safety=[], reuse="—", see=[], usedin="Glossary")
