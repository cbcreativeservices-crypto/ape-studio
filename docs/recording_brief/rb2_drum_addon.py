# -*- coding: utf-8 -*-
"""Recording brief v2 — ADD-ON 1: the Drum Tuning Lab (DRM- items).

Builds ONE self-contained HTML file in the same layout, CSS, item format and
checklist style as the v2 brief. The CSS and the page script are read straight
out of rb2_build.py (regex, no execution) so the two documents never drift.
Diagrams use the rb2_diagrams primitives. Every distinct recording is its own
rec (owner rule: group only identical); one rec holds two files only when they
are the same strike heard by the close mic and the seat mic at once.

    cd C:\\Users\\profe\\dev\\ape-studio\\docs\\recording_brief; python rb2_drum_addon.py
    RB_OUT=<path> overrides the Downloads target.
"""
import re, os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rb2_diagrams as D
from rb2_diagrams import INK, SUB, ACC, RED, LINE, ACCL, REDL, MUTE, T, TL, L, R, C, P, G, DIM, lead, mic, person

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("RB_OUT") or r"C:\Users\profe\Downloads\2026-10-01_APE_RECORDING_BRIEF_ADDON_DRUM_TUNING.html"
DATE = "2026-10-01"
SESSION = 8
LAB_KEY = "drum_tuning"

_src = open(os.path.join(HERE, "rb2_build.py"), encoding="utf-8").read()
CSS = re.search(r"\nCSS = r'''(.*?)'''", _src, re.S).group(1)
JS = re.search(r"\nJS = r'''(.*?)'''", _src, re.S).group(1)

WARN = []
def warn(*a):
    WARN.append(" ".join(str(x) for x in a))

def amp(s):
    return re.sub(r"&(?!(amp|lt|gt|quot|nbsp|#\d+|[a-zA-Z]+);)", "&amp;", s)

# ============================================================ the kit, as the lab models it
# (name, lugs, ladder fundamentals Hz low/mid/high, useful range, one-shot length, strike spot)
KIT = {
 "snare": dict(name='14" × 5.5" snare drum', short="snare", lugs=10, ladder=(180, 220, 280), useful=(170, 300), length="2.0 s", spot="about 5 cm off centre, toward the drummer"),
 "rack": dict(name='12" × 8" rack tom', short="rack tom", lugs=6, ladder=(140, 165, 230), useful=(130, 260), length="3.0 s", spot="about 4–5 cm off centre, toward the drummer"),
 "floor": dict(name='16" × 16" floor tom', short="floor tom", lugs=8, ladder=(95, 110, 125), useful=(75, 130), length="3.0 s", spot="about 6 cm off centre, toward the drummer"),
 "kick": dict(name='22" × 16" bass drum', short="bass drum", lugs=8, ladder=(50, 62, 80), useful=(45, 90), length="2.0 s", spot="where the pedal lands (log the offset from centre)"),
}
LAD = {"low": 0, "mid": 1, "high": 2}
LADWORD = {"low": "LOW — near the bottom of the useful range", "mid": "MID — the middle of the useful range", "high": "HIGH — near the top of the useful range"}

STROKES = {
 "soft": ("SOFT", "a ghost note: stick tip from ≈ 5 cm, wrist only", "a light heel-down tap; the beater rebounds"),
 "med": ("MED", "a backbeat: wrist stroke from ≈ 15 cm", "a normal stroke; the beater rebounds"),
 "hard": ("HARD", "a full stroke from ≈ 40 cm (shoulder height), no rimshot", "a full stroke; the beater still rebounds — never buried"),
}
STICK = "one pair of 5A hickory wood-tip sticks for the whole session (write the model in the sidecar)"
BEATER = "a medium felt beater on the house pedal (write the model in the sidecar)"

# tuning states: id -> (drum, label, batter/reso/notes)
TUNINGS = [
 ("T-R1", "rack", "LOW — batter ≈ 140 Hz, resonant equal, all lugs even"),
 ("T-R2", "rack", "MID — batter ≈ 165 Hz, resonant equal, all lugs even (the lab's Chapter 1 / 4 / 7 rack tom)"),
 ("T-R2a", "rack", "T-R2 with rod 1 backed off ¼ turn"),
 ("T-R2b", "rack", "T-R2 with rod 1 backed off ½ turn"),
 ("T-R2c", "rack", "T-R2 with rod 1 tightened ¼ turn"),
 ("T-R2d", "rack", "T-R2 with rod 1 tightened ½ turn"),
 ("T-R2e", "rack", "T-R2 made uneven: rod 2 −¼, rod 4 +⅛, rod 5 −⅜ turn"),
 ("T-R2f", "rack", "T-R2 batter; resonant lug readings 3 semitones ABOVE the batter (× 1.19)"),
 ("T-R2g", "rack", "T-R2 batter; resonant lug readings 3 semitones BELOW the batter (÷ 1.19)"),
 ("T-R2h", "rack", "T-R2 after the drift take: whatever rod 2 has dropped to (read it, do not touch it)"),
 ("T-R3", "rack", "HIGH — batter ≈ 230 Hz, resonant equal, all lugs even"),
 ("T-R3f", "rack", "T-R3 batter; resonant 3 semitones above"),
 ("T-F1", "floor", "LOW — batter ≈ 95 Hz, resonant equal, even"),
 ("T-F2", "floor", "MID — batter ≈ 110 Hz, resonant equal, even (the lab's Chapter 3 floor tom)"),
 ("T-F2e", "floor", "T-F2 made uneven: lug 2 −¼, lug 4 +⅛, lug 6 −⅜, lug 7 +¼ turn"),
 ("T-F2f", "floor", "T-F2 batter; resonant 3 semitones above"),
 ("T-F2g", "floor", "T-F2 batter; resonant 3 semitones below"),
 ("T-F3", "floor", "HIGH — batter ≈ 125 Hz, resonant equal, even"),
 ("T-S1", "snare", "LOW — batter ≈ 180 Hz; snare-side head MID (+500 ¢ ≈ 240 Hz); even"),
 ("T-S2", "snare", "MID — batter ≈ 220 Hz; snare-side head MID (+500 ¢ ≈ 294 Hz); even (the lab's Chapter 5 / 7 snare)"),
 ("T-S2e", "snare", "T-S2 made uneven: lugs 2 −¼, 5 +⅛, 7 −⅜, 9 +¼ turn"),
 ("T-S2l", "snare", "T-S2 batter; snare-side head LOOSE (+100 ¢ ≈ 233 Hz)"),
 ("T-S2t", "snare", "T-S2 batter; snare-side head TIGHT (+900 ¢ ≈ 370 Hz)"),
 ("T-S3", "snare", "HIGH — batter ≈ 280 Hz; snare-side head MID (+500 ¢ ≈ 374 Hz); even"),
 ("T-K1", "kick", "LOW — batter ≈ 50 Hz, ported front head at the same lug readings, even"),
 ("T-K2", "kick", "MID — batter ≈ 62 Hz, ported front head equal, even (the lab's Chapter 5 bass drum)"),
 ("T-K2c", "kick", "T-K2 batter; the UNPORTED front head fitted and brought to the ported head's logged readings"),
 ("T-K3", "kick", "HIGH — batter ≈ 80 Hz, ported front head equal, even"),
]
TUN = {t[0]: t for t in TUNINGS}

# ============================================================ items
ITEMS = []
def item(**k):
    ITEMS.append(k)

def rec(rid, title, files, context, teaches, record, how, tips, specs, qc, safety=None):
    d = dict(rid=rid, title=title, files=list(files), context=context, teaches=teaches, record=record,
             how=list(how), tips=list(tips), specs=dict(specs), qc=list(qc), safety=list(safety or []))
    return d

G_ = "Drum Tuning Lab"
LAB = "Drum Tuning Lab"
PATHS = {1: "src/screens/lab/drumtuning/modules/ch1Sound.tsx", 2: "src/screens/lab/drumtuning/modules/ch2Prepare.tsx", 3: "src/screens/lab/drumtuning/modules/ch3Method.tsx",
         4: "src/screens/lab/drumtuning/modules/ch4Whole.tsx", 5: "src/screens/lab/drumtuning/modules/ch5Types.tsx", 6: "src/screens/lab/drumtuning/modules/ch6Kit.tsx", 7: "src/screens/lab/drumtuning/modules/ch7Trouble.tsx"}

CLOSE = {"snare": "cardioid dynamic (SM57 class) 3–5 cm above the rim at the drummer's side, angled 30–45° down toward the strike spot, rear toward the hi-hat position",
         "rack": "cardioid dynamic (SM57 class) 3–5 cm above the rim, angled 30–45° down toward the strike spot",
         "floor": "cardioid dynamic (SM57 class) 3–5 cm above the rim, angled 30–45° down toward the strike spot",
         "kick": "kick-OUT position: large-diaphragm condenser or large dynamic 20 cm in front of the front head (or of the front hoop when the head is off), on the beater axis — the one close position that is valid for all three front-head states"}
SEAT = "the SEAT mic: a true pressure omni (measurement omni or true omni LDC) 10 cm to the right of the drummer's right ear, 1.2 m above the floor, capsule up; it does not move all day"
MIC_HOW = lambda d: [f"Close mic: {CLOSE[d]}. Seat mic: {SEAT}.",
                     f"Gain: one taped STRIKE gain per drum for the close mic and one for the seat mic, set so the HARD stroke peaks about −6 dBFS (never above −3). SOFT will land near −20 dBFS: that is the lesson. Never normalize."]
TAP_HOW = lambda d: [f"Close mic only (the seat mic is not delivered for taps): {CLOSE[d]}.",
                     "Gain: one taped TAP gain per drum (taps are 15–20 dB quieter than a stroke); the loudest tap peaks about −10 dBFS. Keep it for every tap round on that drum so lugs compare honestly."]
TAP_METHOD = "Tap with the stick tip, lightly, 2.5 cm (1 in) in from the hoop, directly in front of the lug, the drum on its stand as played, nothing touching either head. Let it ring out; one tap per file."
LOG = "Before the first file of a tuning state, read EVERY lug of both heads with the tuning device and write the row in tunings.csv (the state's tuning_id goes into each file's sidecar row)."
NO_FAKE = "If the drum will not do what the row asks, do not fake it — log what it did in the manifest notes."

def ffile(name, var, ln, note="", kind="rec"):
    return (f"{LAB_KEY}/{name}.wav", var, ln, note, kind)

def strike_files(iid, d, state, stroke, note=""):
    return [ffile(f"{iid}-{d}-{state}-{stroke}-close", f"{KIT[d]['short']} · {state} · {STROKES[stroke][0]} · close mic", KIT[d]["length"], note),
            ffile(f"{iid}-{d}-{state}-{stroke}-seat", f"{KIT[d]['short']} · {state} · {STROKES[stroke][0]} · seat mic", KIT[d]["length"], "Same strike as the close file, from the seat mic.")]

def reuse_files(rid_from, names):
    return [(f"{LAB_KEY}/{n}.wav", v, ln, f"Recorded under {rid_from}.", "reuse") for n, v, ln in names]

STRIKE_SPECS = lambda d, tid, extra=None: dict([("Channels", "Mono (two files: close, seat)"), ("Length", f"{KIT[d]['length']}: the full natural decay plus 0.5 s of room tone"),
   ("Type", "One-shot"), ("Tuning state", f"{tid} — {TUN[tid][2]}"), ("Levels", "FIXED-GAIN per drum: HARD ≈ −6 dBFS; one-shots never above −3 dBFS"),
   ("Set", "FIXED-GAIN only (no matched copies: level is part of the stroke lesson)"), ("Room", "Quiet, fairly dry: RT60 ≤ 0.5 s, noise floor ≤ −60 dBFS")] + list((extra or {}).items()))
TAP_SPECS = lambda d, tid: {"Channels": "Mono (close mic only)", "Length": "1.5 s: the tap, its ring, 0.5 s room tone", "Type": "One-shot (lug tap)",
   "Tuning state": f"{tid} — {TUN[tid][2]}", "Levels": "FIXED-GAIN per drum (the TAP gain): loudest tap ≈ −10 dBFS", "Set": "FIXED-GAIN only", "Room": "As the strikes"}
STRIKE_QC = ["The strike landed on the marked spot (listen for a consistent attack across the three strokes).", "Full decay present; nothing cut; no stick or stand noise.",
             "Both files start within 1 ms of each other (same strike; do not align them).", "tunings.csv row written BEFORE the file; tuning_id in the sidecar."]
TAP_QC = ["One tap only, 2.5 cm from the hoop, in front of the right lug (say the lug number aloud on the slate, before the tap, then trim it out).",
          "No second bounce of the stick on the head.", "tuning_id and lug number in the sidecar row."]

# ---------------------------------------------------------------- DRM-00 setup, room tone, the log
item(id="DRM-00", title="Session setup — mics, strokes, lug numbering, the tuning log", pri="P1", sess=[SESSION], group=G_,
 used="This card holds the method every DRM item shares: the two mic positions (close and SEAT), the three named strokes, how the lugs are numbered, and the tuning log (<code>tunings.csv</code>) that lets the lab show the real per-lug numbers next to each sound. It also records the room tone. Read it first; the other cards only say what changes.",
 safety=["Hearing protection for everyone in the room during strokes: a close snare or bass drum peaks above 120 dB SPL at the player. The drummer wears plugs too.", "Drum key and fingers only. Never a wrench or pliers on a tension rod."],
 reuse="—", see=["DRM-01", "DRM-03"],
 usedin="Every chapter of the lab (src/screens/lab/drumtuning/*)",
 recs=[
  rec("DRM-00.1", "Room tone at the kit", [ffile("drm00-roomtone-close", "room tone · snare close mic position", "30 s"), ffile("drm00-roomtone-seat", "room tone · seat mic", "30 s")],
   context="Not played in the lab; it is the noise-floor reference for every DRM file, and the editor's source for the 0.5 s tails.",
   teaches="—", record="30 s of silence with every mic live at its STRIKE gain, the drummer seated and still, HVAC as it will be for the session.",
   how=["Record this FIRST, before any drum is struck, and again whenever the HVAC state changes.", "Both mics at their taped STRIKE gains for the snare (the first drum's gains are the reference)."],
   tips=["If the floor is above −60 dBFS at the seat mic, fix the room (HVAC, fridge, neighbours) before tuning anything."],
   specs={"Channels": "Mono (two files)", "Length": "30 s", "Levels": "≤ −60 dBFS", "Set": "FIXED-GAIN"},
   qc=["No ticking, hum or HVAC rumble above −60 dBFS.", "Nobody moves during the take."])])

# ---------------------------------------------------------------- DRM-01 the tuning ladder
LADDER_CTX = {
 ("rack", "mid"): "Chapter 1 › <em>Tension and pitch</em> (TENSION in the middle of its range, ▶ STRIKE) and <em>Pitch, overtones, sustain, pitch bend</em> (the STRIKE fader at {pct}); Chapter 4 › <em>Compare head relationships</em> as the EQUAL preset; Chapter 5 › <em>Tune a drum for a sound</em> (rack tom at mid range, DAMPING none); Chapter 6 › <em>Build the tom range</em> as ▶ RACK at 165 Hz.",
 ("rack", "low"): "Chapter 1 › <em>Tension and pitch</em> with TENSION near the bottom; Chapter 5 › <em>Tune a drum for a sound</em> goals LOW and BEND (a low batter bends most); Chapter 6 › <em>Build the tom range</em> ▶ RACK at 140 Hz and the TOO-CLOSE pair with the floor tom at 125 Hz.",
 ("rack", "high"): "Chapter 1 › <em>Tension and pitch</em> with TENSION near the top; Chapter 5 › <em>Tune a drum for a sound</em> goal SHORT (a high batter is the start of a tight note); Chapter 6 › <em>Build the tom range</em> ▶ RACK at 230 Hz and the UNBALANCED (too wide) pair; Chapter 7 › the <em>Excessive ring</em> case (both heads equal and high, no damping) is THIS drum before any fix.",
 ("floor", "mid"): "Chapter 3 › <em>Tap near each lug</em> and <em>Tune the head</em> — the finished, even floor tom the learner is working toward (▶ STRIKE); Chapter 5 › <em>Tune a drum for a sound</em> floor tom at mid range; Chapter 6 › ▶ FLOOR at 110 Hz; Chapter 7 › the <em>Drum sounds choked</em> case AFTER its fix (pillow out).",
 ("floor", "low"): "Chapter 5 › <em>Tune a drum for a sound</em> goal LOW on the floor tom; Chapter 6 › ▶ FLOOR at 95 Hz (the bottom of its range).",
 ("floor", "high"): "Chapter 6 › ▶ FLOOR at 125 Hz, and the floor tom of all three tom-pair fills (DRM-08); Chapter 5 › a floor tom near the top of its range.",
 ("snare", "mid"): "Chapter 5 › <em>Snare drum</em> with STRAINER medium, BOTTOM mid and STROKE at {pct}; Chapter 5 › <em>Tune a drum for a sound</em> snare at mid range; Chapter 7 › <em>Weak snare response</em> AFTER the fix (strainer backed off to medium), struck softly.",
 ("snare", "low"): "Chapter 5 › <em>Snare drum</em> with BATTER near 170 Hz: fatter, more body, less articulate.",
 ("snare", "high"): "Chapter 5 › <em>Snare drum</em> with BATTER near 300 Hz: crisper, more articulate, shorter.",
 ("kick", "mid"): "Chapter 5 › <em>Bass drum</em> with FRONT = PORTED, PILLOW none and BEATER at {pct}; Chapter 5 › <em>Tune a drum for a sound</em> bass drum at mid range.",
 ("kick", "low"): "Chapter 5 › <em>Bass drum</em> with BATTER near 45 Hz: the lowest, loosest note, the most beater flap.",
 ("kick", "high"): "Chapter 5 › <em>Bass drum</em> with BATTER near 90 Hz: a tighter, more tonal, shorter note.",
}
PCT = {"soft": "≈ 30 %", "med": "≈ 60 %", "hard": "100 %"}
TEACH_STROKE = {"soft": "the quiet stroke: the fundamental dominates, little attack, almost no pitch bend",
                "med": "the working stroke: the balance of attack, note and overtones a player hears most of the time",
                "hard": "the full stroke: the loudest attack, the richest overtones and the deepest pitch bend (the note starts sharp and settles)"}
TEACH_LAD = {"low": "a head near the bottom of its range: a low, full note that bends the most and can flap",
             "mid": "the drum where its heads and shell work together: the reference sound of this drum",
             "high": "a head near the top of its range: higher, tighter, shorter, more ping — on the way to choking"}
_ladder = []
for d in ("floor", "rack", "snare", "kick"):
    k = KIT[d]
    for lad in ("low", "mid", "high"):
        tid = {"rack": "T-R", "floor": "T-F", "snare": "T-S", "kick": "T-K"}[d] + str(LAD[lad] + 1)
        hz = k["ladder"][LAD[lad]]
        for stroke in ("soft", "med", "hard"):
            n = len(_ladder) + 1
            sdesc = STROKES[stroke][2 if d == "kick" else 1]
            ctx = LADDER_CTX[(d, lad)].format(pct=PCT[stroke])
            if stroke != "med" and "{pct}" not in LADDER_CTX[(d, lad)]:
                ctx += f" The {STROKES[stroke][0]} stroke is what the page plays when its STRIKE / STROKE / BEATER fader sits at {PCT[stroke]}."
            how = [f"Tuning state {tid}: {TUN[tid][2]}. {LOG}",
                   f"Stroke {STROKES[stroke][0]}: {sdesc}; {BEATER if d == 'kick' else STICK}. Strike {k['spot']} — mark the spot with a small piece of tape BESIDE it, never under it.",
                   *MIC_HOW(d),
                   "Slate the take, strike once, let it ring out fully. Three good takes; deliver the most typical one (not the loudest) and note the take in the sidecar."]
            tips = []
            if stroke == "soft" and lad == "low":
                tips.append(f"Tune the {k['short']} LOW first and only ever tighten through the ladder: LOW → MID → HIGH. Nothing on this drum needs loosening until the kick's front-head swap.")
            if d == "kick" and stroke == "hard":
                tips.append("A buried beater damps the head and is a different sound. Let it rebound for all three strokes; the lab's BEATER fader is level and click, not burying.")
            if d == "snare":
                tips.append("Strainer at its medium setting (the wires just stop buzzing when you speak at the drum), snare-side head at MID (+500 ¢). DRM-07 changes these; the ladder does not.")
            if d == "floor" and lad == "high" and stroke == "med":
                tips.append("Leave the floor tom at HIGH after this: the rack-tom block and all three DRM-08 pair fills use the floor tom at T-F3.")
            _ladder.append(rec(f"DRM-01.{n}", f"{k['short'].capitalize()} — {LADWORD[lad].split(' — ')[0]} ({hz} Hz) — {STROKES[stroke][0]} stroke",
                strike_files("drm01", d, lad, stroke),
                context=f"Plays on {ctx}",
                teaches=f"{TEACH_LAD[lad].capitalize()}, heard with {TEACH_STROKE[stroke]}. The lab's engine can only model this; the real {k['short']} is what the learner should carry away.",
                record=f"One {STROKES[stroke][0]} stroke on the {k['name']} at {LADWORD[lad].split(' — ')[0]} tuning (batter fundamental ≈ {hz} Hz, both heads even, resonant equal), close mic and seat mic at once.",
                how=how, tips=tips, specs=STRIKE_SPECS(d, tid), qc=STRIKE_QC))
item(id="DRM-01", title="The tuning ladder — every drum LOW / MID / HIGH, three strokes", pri="P1", sess=[SESSION], group=G_,
 used="The spine of the lab's sound. Chapter 1 › <em>Tension and pitch</em> moves a TENSION fader and strikes; <em>Pitch, overtones, sustain, pitch bend</em> moves a STRIKE fader from a light tap to a full hit; Chapter 5 tunes each drum type toward a stated sound; Chapter 6 › <em>Build the tom range</em> plays ▶ RACK, ▶ FLOOR and ▶ BOTH at any pitch in each drum's useful range. Today every one of those strikes is synthesized. Each real drum at three points in its range, each struck three ways, gives the lab a real sound to put next to its model at every fader position (the app interpolates between the three).",
 safety=["Hearing protection for everyone during the snare and bass-drum strokes.", "A head has a working range: when the pitch stops rising as you turn, stop. Never chase the HIGH target past that point."],
 reuse="DRM-04 (EQUAL relationship = this item's MID files), DRM-06 (PORTED = this item's kick files), DRM-07 (strainer MEDIUM = this item's snare files), DRM-08 (the single hits of each pair), DRM-09 (the ring case = rack HIGH; the choked case's fixed state = floor MID).",
 see=["DRM-00", "DRM-04", "DRM-08"],
 usedin="Ch1 Tension and pitch; Ch1 Pitch, overtones, sustain, pitch bend; Ch5 Snare drum / Bass drum / Tune a drum for a sound; Ch6 Build the tom range (" + PATHS[1] + ", " + PATHS[5] + ", " + PATHS[6] + ")",
 recs=_ladder)

# ---------------------------------------------------------------- DRM-02 even vs uneven: the warble
ROD = [("a", "−¼", "backed off a quarter turn", "T-R2a"), ("b", "−½", "backed off half a turn", "T-R2b"), ("c", "+¼", "tightened a quarter turn", "T-R2c"), ("d", "+½", "tightened half a turn", "T-R2d")]
_r2 = []
for i, (suf, turn, words, tid) in enumerate(ROD, 1):
    _r2.append(rec(f"DRM-02.{i}", f"Rack tom — rod 1 {words} — MED stroke", strike_files("drm02", "rack", f"rod1{'minus' if '−' in turn else 'plus'}{'quarter' if '¼' in turn else 'half'}", "med"),
      context=f"Chapter 1 › <em>Turn one rod</em>: ROD = 1, TURN = {turn} turn, ▶ STRIKE. The learner hears the warble appear and the SPREAD and BEAT readouts move; Chapter 7 › <em>Uneven or “warbling” tone</em> is the same sound as its symptom. The even reference is DRM-01's rack MID / MED file.",
      teaches=f"One rod {words} changes the pitch near that rod AND the balance of the whole head: the head makes two slightly different notes at once and they beat — the warble. Half a turn beats faster and more obviously than a quarter.",
      record=f"One MED stroke on the rack tom at MID tuning with rod 1 {words} from even and every other rod untouched.",
      how=[f"Start from T-R2 (even, logged). Turn rod 1 ONLY, {turn} turn, with the drum key. Read all six lugs again: that row is {tid}.", *MIC_HOW("rack"),
           "Strike the marked spot once with the MED stroke, let it ring out. Three takes, deliver the most typical.",
           "Order: −¼ → −½ (then record the −½ tap round, DRM-03.7–12) → back to even by the device → +¼ → +½ → back to even."],
      tips=["Rod 1 is the lug farthest from the drummer (12 o'clock looking down on the batter); the lab numbers rods the same way, clockwise.", "Check that the warble is audible on the seat mic before moving on: if the room masks it, move the seat mic 10 cm closer and log it."],
      specs=STRIKE_SPECS("rack", tid), qc=STRIKE_QC + ["A slow beat is audible under the note on both files (it is the point)."]))
_r2.append(rec("DRM-02.5", "Rack tom — three rods uneven — MED stroke", strike_files("drm02", "rack", "uneven", "med"),
  context="Chapter 2 › <em>Preparation checklist</em>, the “tuning problem — lugs at clearly different pitches” fault; Chapter 7 › <em>Uneven or “warbling” tone</em> as the case opens (the lab's case uses a random spread of about half a turn). Its tap round is DRM-03.13–18.",
  teaches="A head that is uneven at several rods, not one: a thicker, slower warble and a smeared pitch — the everyday “out of tune” drum rather than the one-rod textbook case.",
  record="One MED stroke on the rack tom at MID tuning with rod 2 −¼, rod 4 +⅛ and rod 5 −⅜ turn from even.",
  how=["Start from T-R2 (even). Make the three moves with the drum key; read all lugs: T-R2e.", *MIC_HOW("rack"), "One MED stroke, ring out, three takes."],
  tips=["Return to even BY THE DEVICE afterwards (T-R2 readings), not by ear — the rest of the rack block depends on it."],
  specs=STRIKE_SPECS("rack", "T-R2e"), qc=STRIKE_QC))
_r2.append(rec("DRM-02.6", "Floor tom — four lugs uneven — MED stroke", strike_files("drm02", "floor", "uneven", "med"),
  context="Chapter 3 › <em>Tune the head</em>: the floor tom the learner receives at the start of the step (random, uneven) when they press ▶ STRIKE before touching a rod. Its tap round is DRM-03.27–34; the finished state is DRM-01's floor MID / MED.",
  teaches="What the learner is tuning AWAY from: a floor tom whose eight lugs disagree warbles slowly (a big head beats slowly) and loses its low note.",
  record="One MED stroke on the floor tom at MID tuning with lug 2 −¼, lug 4 +⅛, lug 6 −⅜ and lug 7 +¼ turn from even.",
  how=["Start from T-F2 (even, logged). Make the four moves; read all lugs: T-F2e.", *MIC_HOW("floor"), "One MED stroke, ring out, three takes."],
  tips=["Record the T-F2e tap round (DRM-03) straight after this strike, then even the head by the device."],
  specs=STRIKE_SPECS("floor", "T-F2e"), qc=STRIKE_QC))
_r2.append(rec("DRM-02.7", "Snare — four lugs uneven — MED stroke", strike_files("drm02", "snare", "uneven", "med"),
  context="Chapter 2 › <em>Preparation checklist</em> on a snare: the uneven tension-map fault. Its tap round is DRM-03.45–54.",
  teaches="An uneven snare batter: the ring under the crack wobbles and the wires answer unevenly — a different symptom from a strainer problem (DRM-07).",
  record="One MED stroke on the snare at MID tuning with lugs 2 −¼, 5 +⅛, 7 −⅜ and 9 +¼ turn from even; strainer medium.",
  how=["Start from T-S2 (even). Make the four moves; read all lugs: T-S2e.", *MIC_HOW("snare"), "One MED stroke, ring out, three takes."],
  tips=["Record the T-S2e tap round next, then even the batter by the device before the strainer and snare-side work (DRM-07)."],
  specs=STRIKE_SPECS("snare", "T-S2e"), qc=STRIKE_QC))
item(id="DRM-02", title="Even vs uneven heads — the warble", pri="P1", sess=[SESSION], group=G_,
 used="Chapter 1 › <em>Turn one rod</em> is the lab's first interactive: pick a ROD, drag TURN from −1 to +1 turn, ▶ TAP it or ▶ STRIKE the drum, and watch SPREAD (cents between the highest and lowest lug) and BEAT (Hz) move while the warble appears. Chapter 2's checklist shows an uneven tension map as a fault; Chapter 7's first case is the warbling tom. All of it is synthesized today.",
 safety=["Half a turn on one rod is the most this brief ever asks of a single rod. Big single-rod moves are how hoops go out of round."],
 reuse="DRM-01 rack MID / MED is the even reference for every file here. DRM-03 holds the matching tap rounds. DRM-09 (warble case) reuses DRM-02.2.",
 see=["DRM-01", "DRM-03", "DRM-09"],
 usedin="Ch1 Turn one rod; Ch2 Preparation checklist; Ch3 Tune the head; Ch7 Diagnose the symptom (" + PATHS[1] + ", " + PATHS[2] + ", " + PATHS[3] + ", " + PATHS[7] + ")",
 recs=_r2)

# ---------------------------------------------------------------- DRM-03 lug-by-lug taps
TAP_ROUNDS = [
 ("rack", "even", "T-R2", "Chapter 1 › <em>Turn one rod</em> with TURN = 0 (▶ TAP on any ROD) and Chapter 7 › <em>Drum will not hold tuning</em> before the drift; also the BEFORE state of every rack case.",
  "An even head: every lug taps the same note. The learner needs to hear “the same” before “different” means anything."),
 ("rack", "rod1minushalf", "T-R2b", "Chapter 1 › <em>Turn one rod</em> with ROD 1 at −½ turn, ▶ TAP on each ROD; Chapter 7 › <em>Uneven or “warbling” tone</em>, where the learner must tap at least three lugs and find the odd one out.",
  "The lug by the backed-off rod taps clearly lower; its neighbours (6 and 2) sit a little low; the far side is untouched. Where the beat comes from."),
 ("rack", "uneven", "T-R2e", "Chapter 7 › <em>Uneven or “warbling” tone</em> (the case's spread) and Chapter 2's uneven tension map.",
  "Several lugs disagree in both directions: the learner must sort high from low before deciding which to move."),
 ("floor", "even", "T-F2", "Chapter 3 › <em>Tap near each lug</em> (LUG 1–8, ▶ TAP) — the HEAR page — and the finished state of <em>Tune the head</em> (every lug within 10 cents).",
  "Eight even taps on a big head: the same low note at every lug, so the learner learns the tapping method on a drum that is right."),
 ("floor", "uneven", "T-F2e", "Chapter 3 › <em>Tune the head</em>: the starting taps of the practice head the learner evens out (LUG, ▶ TAP, then TURN).",
  "The practice head: lugs 2 and 6 low, 4 and 7 high, the rest on pitch. The learner's job is to hear which is which."),
 ("snare", "even", "T-S2", "Chapter 5 › <em>Snare drum</em> and Chapter 7 › <em>Weak snare response</em> — the evidence that “the heads are even” when the fault is the strainer.",
  "Ten even taps on a snare: a higher, shorter tap with the wire buzz under it (wires on, strainer medium)."),
 ("snare", "uneven", "T-S2e", "Chapter 2 › <em>Preparation checklist</em> (uneven tension map on a snare).",
  "Ten taps with four lugs off: the uneven map the learner reads on the glass, as sound."),
]
_taps = []
n = 0
for d, state, tid, ctx, teach in TAP_ROUNDS:
    k = KIT[d]
    for lug in range(1, k["lugs"] + 1):
        n += 1
        _taps.append(rec(f"DRM-03.{n}", f"{k['short'].capitalize()} — {state.replace('rod1minushalf', 'rod 1 −½ turn')} — lug {lug} tap",
            [ffile(f"drm03-{d}-{state}-lug{lug:02d}-tap", f"{k['short']} · {state.replace('rod1minushalf', 'rod 1 −½')} · lug {lug}", "1.5 s")],
            context=f"Plays when the learner picks LUG {lug} and presses ▶ TAP on {ctx}",
            teaches=teach + (f" This is lug {lug} of {k['lugs']}." if lug > 1 else f" Lug 1 of {k['lugs']}: the lug farthest from the drummer, 12 o'clock looking down on the batter head; the others follow clockwise, exactly as the lab numbers them."),
            record=f"One light tap 2.5 cm in from the hoop in front of lug {lug} of the {k['name']} at tuning state {tid}.",
            how=[f"State {tid}: {TUN[tid][2]}. {LOG if lug == 1 else 'Same state as the previous lug; do not touch a rod between lugs.'}", TAP_METHOD, *TAP_HOW(d)],
            tips=(["Record the whole round in one pass, lug 1 to lug " + str(k["lugs"]) + ", slating each lug number aloud before the tap. The device reading for each lug is already in the tunings.csv row — that is what the lab prints beside this sound.",
                   "Tap the same distance from the hoop every time: a ruler mark on a strip of tape on the hoop, not on the head."] if lug == 1 else []),
            specs=TAP_SPECS(d, tid), qc=TAP_QC))
item(id="DRM-03", title="Lug-by-lug taps — even and uneven heads", pri="P1", sess=[SESSION], group=G_,
 used="Chapter 3 › <em>Tap near each lug</em> is the lab's method page: pick LUG 1–8 on the floor tom, ▶ TAP, listen for the pitch at each spot, then on <em>Tune the head</em> bring an uneven head to EVEN (every lug within 10 cents) with small opposing moves. Chapter 1 › <em>Turn one rod</em> taps the rack tom; Chapter 7's warble and drift cases demand three taps before the learner may name a cause. Each tap is a separate file so the app can play exactly the lug the learner picked. The device reading per lug (tunings.csv) is shown beside the sound.",
 safety=[], reuse="DRM-09 reuses the T-R2 round as the drift case's BEFORE taps.", see=["DRM-02", "DRM-00", "DRM-09"],
 usedin="Ch3 Tap near each lug, Tune the head; Ch1 Turn one rod; Ch7 Diagnose the symptom (" + PATHS[3] + ", " + PATHS[1] + ", " + PATHS[7] + ")",
 recs=_taps)

# ---------------------------------------------------------------- DRM-04 head relationships
REL = [("rack", "resoup", "T-R2f", "Resonant higher than batter", "RESO ↑", "med"), ("rack", "resoup", "T-R2f", "Resonant higher than batter", "RESO ↑", "hard"),
       ("rack", "resodown", "T-R2g", "Batter higher than resonant", "BATTER ↑", "med"), ("rack", "resodown", "T-R2g", "Batter higher than resonant", "BATTER ↑", "hard"),
       ("floor", "resoup", "T-F2f", "Resonant higher than batter", "RESO ↑", "med"), ("floor", "resodown", "T-F2g", "Batter higher than resonant", "BATTER ↑", "med")]
_rel = []
for i, (d, state, tid, label, short, stroke) in enumerate(REL, 1):
    k = KIT[d]
    up = state == "resoup"
    _rel.append(rec(f"DRM-04.{i}", f"{k['short'].capitalize()} — {label} — {STROKES[stroke][0]} stroke", strike_files("drm04", d, f"mid-{state}", stroke),
      context=(f"Chapter 4 › <em>Compare head relationships</em>: SET = {short} (the RESO fader {'3 semitones above' if up else '3 semitones below'} BATTER), ▶ STRIKE; the learner compares SUSTAIN and the late pitch against EQUAL (DRM-01 rack MID). "
               + ("Chapter 7 › <em>Excessive ring</em>: the “retune the resonant head away from the batter” fix on a mid-tuned drum. " if up and d == "rack" else "")
               + ("Chapter 5 › <em>Tune a drum for a sound</em> goal BEND (the lab's model leaves the late sound lower with the resonant head low). " if not up else "Chapter 5 › goal SHORT (a focused, quicker note). ")
               + (f"The HARD stroke shows the pitch bend of this relationship." if stroke == "hard" else "")
               + (f" Chapter 4 › <em>Why the same tuning sounds different</em>: the same relationship on a 16\" drum." if d == "floor" else "")),
      teaches=(f"{label}: in the lab's model the energy " + ("leaves faster — a quicker, focused note with a clear attack, the late sound settling ABOVE the batter's own pitch" if up else "settles toward the lower resonant head — a fuller body and a note that can seem to drop as it fades")
               + ". The brief does not call either one correct: the learner is told these are sounds, not rules, and that players describe the bend both ways. Your real drum is the evidence."),
      record=f"One {STROKES[stroke][0]} stroke on the {k['name']} with the batter at MID and the resonant head's lug readings {'3 semitones above (× 1.19)' if up else '3 semitones below (÷ 1.19)'} the batter's.",
      how=[f"Batter stays at {'T-R2' if d == 'rack' else 'T-F2'} — do not touch it. Bring EVERY resonant lug to {'× 1.19' if up else '÷ 1.19'} of the batter reading by the device, in a star pattern, small steps. Read all lugs: {tid}.",
           *MIC_HOW(d), f"One {STROKES[stroke][0]} stroke on the marked spot, ring out, three takes."],
      tips=["Do RESO ↑ first (tightening), then RESO ↓ (loosening past equal), then return the resonant head to equal by the device."] if i in (1, 5) else
           (["On the floor tom the 3-semitone step is only about 20 Hz: use the device, not your ear, to set it."] if d == "floor" else []),
      specs=STRIKE_SPECS(d, tid), qc=STRIKE_QC + ["Sustain differs audibly from the EQUAL file of the same drum and stroke (if it does not, log it — do not exaggerate the tuning)."]))
item(id="DRM-04", title="Batter / resonant relationships on one drum", pri="P1", sess=[SESSION], group=G_,
 used="Chapter 4 › <em>Compare head relationships</em>: BATTER and RESO faders in Hz, a SET preset for RESO ↑ / EQUAL / BATTER ↑, ▶ STRIKE, and readouts for SUSTAIN (T60) and the late pitch. The learner must hear all three and say which rang longest. The lab's wording is strict: no relationship is “correct”; each is a sound. EQUAL is the DRM-01 MID file of the same drum, so this card records only the two unequal relationships, on the rack tom (MED and HARD) and the floor tom (MED).",
 safety=[], reuse="EQUAL = DRM-01 rack MID (MED, HARD) and floor MID (MED). DRM-09 ring fix at HIGH is its own file (DRM-09.1).", see=["DRM-01", "DRM-09"],
 usedin="Ch4 Compare head relationships; Ch5 Tune a drum for a sound; Ch7 Diagnose the symptom (" + PATHS[4] + ", " + PATHS[5] + ", " + PATHS[7] + ")",
 recs=_rel)

# ---------------------------------------------------------------- DRM-05 damping
DAMP = [("rack", "gel", "T-R2", "one gel pad (about 2 cm) on the batter, 3 cm in from the hoop at lug 4", "Chapter 1 › <em>Pitch, overtones, sustain, pitch bend</em> with DAMPING ≈ 25 % (“gel”); Chapter 5 › <em>Tune a drum for a sound</em> DAMPING in its gel band; Chapter 7 › <em>Excessive ring</em> “add a gel pad near the rim” on a mid drum; and the WRONG fix for the warble (“damping shortens the warble but does not remove its cause”).", "Light damping takes the high ring first and shortens the note a little; the fundamental and the beat (if any) stay."),
        ("rack", "felt", "T-R2", "a felt strip 3 cm wide taped across the batter under the hoop, lug 1 to lug 4", "Chapter 1 › DAMPING ≈ 60 %; Chapter 5 › <em>Tune a drum for a sound</em> goal SHORT at mid tuning.", "Heavy damping: a short, dry, thuddy tom — the overtones gone, the attack left."),
        ("floor", "gel", "T-F2", "one gel pad on the batter, 3 cm in from the hoop at lug 5", "Chapter 5 › <em>Tune a drum for a sound</em> on the floor tom, DAMPING in its gel band.", "A little gel on a big head: the long low note loses its top ring but keeps its length."),
        ("floor", "pillow", "T-F2", "a small pillow (about 30 × 20 cm) resting inside against the batter head", "Chapter 7 › <em>Drum sounds choked</em>: THIS is the case as it opens — a floor tom with no note, a dead “thup”. The fix (take the pillow out) is DRM-01 floor MID / MED.", "A pillow in a floor tom kills the fundamental with the ring: the choked drum. Over-damping, not tension, is the cause the learner must find."),
        ("kick", "smallpillow", "T-K2", "a felt strip or small pillow just touching the batter head inside, nothing against the front head", "Chapter 5 › <em>Bass drum</em> with PILLOW ≈ 30 % (“a felt strip / small pillow”).", "A touch of damping on a kick: the beater click stays, the boom shortens, the note is still there."),
        ("kick", "pillow", "T-K2", "a full pillow against the batter head, pressing about a third of the head", "Chapter 5 › <em>Bass drum</em> with PILLOW ≈ 80 % and the Chapter 5 decision “a heavily damped bass drum compared to an open one… a different instrument, not a worse one”.", "The damped studio kick: short, overtones gone first, click on top. Not worse — different.")]
_damp = []
for i, (d, state, tid, what, ctx, teach) in enumerate(DAMP, 1):
    k = KIT[d]
    _damp.append(rec(f"DRM-05.{i}", f"{k['short'].capitalize()} — {state.replace('smallpillow', 'small pillow')} — MED stroke", strike_files("drm05", d, f"mid-{state}", "med"),
      context="Plays on " + ctx + f" The undamped reference is DRM-01 {k['short']} MID / MED.",
      teaches=teach, record=f"One MED stroke on the {k['name']} at MID tuning (both heads even, equal) with {what}.",
      how=[f"State {tid} — heads untouched from the ladder. Add {what}; photograph it (photos/DRM-05).", *MIC_HOW(d), "One MED stroke, ring out, three takes. Remove the damping afterwards and strike once more off-record to confirm the drum is unchanged."],
      tips=["Damping is a photo item: the lab shows where the gel or pillow sat."] if i == 1 else [],
      specs=STRIKE_SPECS(d, tid, {"Damping": what}), qc=STRIKE_QC + ["Sustain audibly shorter than the undamped MID file; the pitch essentially unchanged."]))
item(id="DRM-05", title="Damping — none / gel / felt / pillow", pri="P2", sess=[SESSION], group=G_,
 used="Chapter 1 › <em>Pitch, overtones, sustain, pitch bend</em> has a DAMPING fader (none → gel → heavier); Chapter 5 › <em>Bass drum</em> has PILLOW; <em>Tune a drum for a sound</em> uses DAMPING to reach goals SHORT and OPEN; Chapter 7's choked floor tom is an over-damped drum and a gel pad is both a right fix (ring) and a wrong one (warble). “None” is always the DRM-01 MID file of that drum.",
 safety=[], reuse="DRM-01 MID files are the undamped references. DRM-09 reuses DRM-05.4 (choked case) and records its own gel-at-HIGH (DRM-09.2).", see=["DRM-01", "DRM-09"],
 usedin="Ch1 Pitch, overtones, sustain, pitch bend; Ch5 Bass drum, Tune a drum for a sound; Ch7 Diagnose the symptom (" + PATHS[1] + ", " + PATHS[5] + ", " + PATHS[7] + ")",
 recs=_damp)

# ---------------------------------------------------------------- DRM-06 kick front head
FRONT = [("nofront", "removed", "T-K2", "med"), ("nofront", "removed", "T-K2", "hard"), ("closed", "closed (no port)", "T-K2c", "med"), ("closed", "closed (no port)", "T-K2c", "hard")]
_front = []
for i, (state, label, tid, stroke) in enumerate(FRONT, 1):
    rem = state == "nofront"
    _front.append(rec(f"DRM-06.{i}", f"Bass drum — front head {label} — {STROKES[stroke][0]} beater", strike_files("drm06", "kick", f"mid-{state}", stroke),
      context=f"Chapter 5 › <em>Bass drum</em> with FRONT = {'NO FRONT' if rem else 'CLOSED'}, PILLOW none, BEATER at {PCT[stroke]}. PORTED at the same BATTER and BEATER is DRM-01 kick MID / {STROKES[stroke][0]}.",
      teaches=("The batter alone: the air spring is gone, so the note is the shortest and the attack the most exposed — the lab calls it “the most attack”." if rem else
               "Full coupling through a closed front head: the longest, roundest note and the least click reaching the outside mic; harder to mic inside (which is why the port exists)."),
      record=f"One {STROKES[stroke][0]} beater stroke on the {KIT['kick']['name']} at MID batter tuning with the front head {label}.",
      how=([f"Remove the ported front head (eight rods, star order, support the hoop). Batter untouched: still T-K2.", *MIC_HOW("kick"), "The close mic stays exactly where it was for PORTED: 20 cm in front of the front HOOP, beater axis. One stroke, ring out, three takes."] if rem else
           [f"Fit the second, UNPORTED front head. Seat it, finger-tight, star pattern, and bring every lug to the ported head's logged T-K2 readings. Read all lugs: {tid}.", *MIC_HOW("kick"), "Close mic unchanged. One stroke, ring out, three takes."]),
      tips=(["Order inside the kick block: PORTED (DRM-01) → pillows (DRM-05) → head OFF (this) → UNPORTED head on → then refit the ported head for the HIGH ladder step. That is the one deliberate re-tune of the day."] if i == 1 else
            ["Do not cut a port in a head on site. Two front heads: one with a factory port (10–13 cm, off-centre), one without."] if i == 3 else []),
      specs=STRIKE_SPECS("kick", tid, {"Front head": label}), qc=STRIKE_QC + ["The close mic did not move between PORTED, NO FRONT and CLOSED (tape its stand)."]))
item(id="DRM-06", title="Bass drum front head — closed / ported / removed", pri="P2", sess=[SESSION], group=G_,
 used="Chapter 5 › <em>Bass drum</em>: a FRONT selector (CLOSED · PORTED · NO FRONT), PILLOW, BATTER and BEATER, ▶ STRIKE; the glass shows the beater and the front head. The lab's engine models the three as different coupling and losses (removed is the shortest note). PORTED is the kick's standard state in this brief, so it is DRM-01's kick files; this card adds the other two states at MED and HARD.",
 safety=["Support the front hoop while rods are out; a dropped 22\" hoop bends.", "Hearing protection: a hard beater stroke on a 22\" with the front head off is loud at the seat."],
 reuse="PORTED = DRM-01 kick MID (MED, HARD). Pillows at PORTED are DRM-05.5–6.", see=["DRM-01", "DRM-05"],
 usedin="Ch5 Bass drum (" + PATHS[5] + ")",
 recs=_front)

# ---------------------------------------------------------------- DRM-07 snare strainer and snare-side head
_sn = []
STRAIN = [("off", "thrown OFF (wires away from the head)", "the wires do not touch the head: a high, ringing tom-like drum"),
          ("tight", "wound TIGHT (as far as the strainer allows without binding)", "a tight strainer raises the threshold the head must move the wires past: ghost notes lose their wire sound, and wound hard the whole drum chokes")]
for st, words, teach in STRAIN:
    for stroke in ("soft", "med", "hard"):
        i = len(_sn) + 1
        _sn.append(rec(f"DRM-07.{i}", f"Snare — strainer {st.upper()} — {STROKES[stroke][0]} stroke", strike_files("drm07", "snare", f"mid-strainer-{st}", stroke),
          context=(f"Chapter 5 › <em>Snare drum</em> with STRAINER {'thrown off' if st == 'off' else '≈ 90 % (tight)'} and STROKE at {PCT[stroke]}. "
                   + ("Chapter 7 › <em>Weak snare response</em>: THIS is the case as it opens — the lab strikes it SOFTLY on purpose (“soft strokes give no wire sound — only a tom-like thud”). The fix is DRM-01 snare MID / SOFT." if st == "tight" and stroke == "soft" else "")
                   + ("The medium strainer at the same stroke is DRM-01 snare MID." if not (st == "tight" and stroke == "soft") else "")),
          teaches=f"Strainer {st}: {teach}. At the {STROKES[stroke][0]} stroke" + (" the difference is at its largest: the quiet stroke is where sensitivity lives." if stroke == "soft" else " the wires' answer (or absence) sits under a louder note."),
          record=f"One {STROKES[stroke][0]} stroke on the {KIT['snare']['name']} at MID tuning (T-S2, snare-side head MID) with the strainer {words}.",
          how=["Heads untouched: T-S2. Set the strainer as described; photograph the lever/knob (photos/DRM-07).", *MIC_HOW("snare"), f"One {STROKES[stroke][0]} stroke on the marked spot, ring out, three takes."],
          tips=(["Order: OFF (3 strokes) → MEDIUM is already recorded (DRM-01) → TIGHT (3 strokes) → back to medium for the snare-side work."] if i == 1 else
                ["If the tight strainer still rattles on the SOFT stroke, wind it a little more and log it; the lab's symptom is “no wire sound on a soft stroke”. Never force the strainer past its stop."] if (st == "tight" and stroke == "soft") else []),
          specs=STRIKE_SPECS("snare", "T-S2", {"Strainer": words}), qc=STRIKE_QC + (["No wire buzz audible after the stroke on either file (that is the point)." ] if st == "off" else [])))
SIDE = [("loose", "T-S2l", "LOOSE (+100 ¢ above the batter ≈ 233 Hz)", "a loose snare-side head: buzzy, sensitive, long wire sound that blurs the stroke"),
        ("tight", "T-S2t", "TIGHT (+900 ¢ above the batter ≈ 370 Hz)", "a tight snare-side head: crisp, fast, dry — and less sensitive to the softest strokes")]
for st, tid, words, teach in SIDE:
    for stroke in ("soft", "med"):
        i = len(_sn) + 1
        _sn.append(rec(f"DRM-07.{i}", f"Snare — snare-side head {st.upper()} — {STROKES[stroke][0]} stroke", strike_files("drm07", "snare", f"mid-side-{st}", stroke),
          context=f"Chapter 5 › <em>Snare drum</em> with BOTTOM at {'+100 ¢' if st == 'loose' else '+900 ¢'} and STROKE at {PCT[stroke]}; Chapter 7 › <em>Weak snare response</em> names “snare-side head tension” as the first area to investigate — these files are what that area sounds like. The MID snare-side head is DRM-01 snare MID.",
          teaches=f"{teach.capitalize()}. The wires answer to the snare-side head, not the batter; the {STROKES[stroke][0]} stroke shows " + ("the sensitivity change." if stroke == "soft" else "the tone change."),
          record=f"One {STROKES[stroke][0]} stroke on the {KIT['snare']['name']} at MID batter tuning with the snare-side head {words}, strainer medium.",
          how=[f"Batter stays at T-S2. Strainer back to medium. Bring every snare-side lug to the target by the device (a 2–3 mil snare-side head: small steps, star pattern). Read all lugs: {tid}.", *MIC_HOW("snare"), f"One {STROKES[stroke][0]} stroke, ring out, three takes."],
          tips=(["LOOSE first (loosening from MID), then TIGHT (tightening past MID), then back to MID by the device before the HIGH ladder step."] if st == "loose" and stroke == "soft" else
                ["A snare-side head is thin. At +900 ¢ the pitch may stop rising before the target: STOP there and log the reading. Never go past that point."] if st == "tight" and stroke == "soft" else []),
          specs=STRIKE_SPECS("snare", tid), qc=STRIKE_QC))
item(id="DRM-07", title="Snare — strainer OFF / MEDIUM / TIGHT and snare-side head LOOSE / MID / TIGHT", pri="P1", sess=[SESSION], group=G_,
 used="Chapter 5 › <em>Snare drum</em>: STRAINER (thrown off → tight), BOTTOM (the snare-side head in cents against the batter), BATTER and STROKE, ▶ STRIKE, with a glass that shows the wires lifting off the head. Chapter 7 › <em>Weak snare response</em> opens on a tight strainer struck softly; the areas to investigate are the snare-side head tension and the wire adjustment. MEDIUM strainer with the MID snare-side head is DRM-01's snare, so this card records the other states.",
 safety=["Hearing protection: a HARD snare stroke at 3–5 cm is the loudest thing in this brief after the kick.", "A snare-side head is 2–3 mil thick: small steps, and stop when the pitch stops rising."],
 reuse="Strainer MEDIUM / side MID = DRM-01 snare MID (SOFT, MED, HARD). DRM-09's snare case reuses DRM-07.4 and DRM-01.", see=["DRM-01", "DRM-09"],
 usedin="Ch5 Snare drum; Ch7 Diagnose the symptom (" + PATHS[5] + ", " + PATHS[7] + ")",
 recs=_sn)

# ---------------------------------------------------------------- DRM-08 tom pair intervals
PAIR = [("distinct", "DISTINCT", "T-R2 + T-F3", "rack MID (165 Hz) with floor HIGH (125 Hz): about 4.8 semitones", "each drum keeps its own pitch and the fall reads as one kit"),
        ("close", "TOO CLOSE", "T-R1 + T-F3", "rack LOW (140 Hz) with floor HIGH (125 Hz): about 2 semitones", "the two crowd each other — a fill reads as one drum repeated"),
        ("unbalanced", "UNBALANCED (too wide)", "T-R3 + T-F3", "rack HIGH (230 Hz) with floor HIGH (125 Hz): about 10.5 semitones", "both drums respond, but the pair no longer reads as one kit — a fill jumps")]
_pair = []
for i, (state, verdict, tids, words, teach) in enumerate(PAIR, 1):
    _pair.append(rec(f"DRM-08.{i}", f"Tom pair — {verdict} — one-bar fill", [ffile(f"drm08-pair-{state}-rackclose", f"fill · {verdict} · rack close mic", "4.0 s"), ffile(f"drm08-pair-{state}-floorclose", f"fill · {verdict} · floor close mic", "4.0 s"), ffile(f"drm08-pair-{state}-seat", f"fill · {verdict} · seat mic", "4.0 s", "The same fill from the seat; the file the lab plays for ▶ BOTH.")],
      context=f"Chapter 6 › <em>Build the tom range</em>: with RACK and FLOOR set so the VERDICT reads {verdict}, ▶ BOTH plays the pair; ▶ RACK and ▶ FLOOR play the single hits (DRM-01 files at those tunings). The learner must reach DISTINCT to bank the chapter.",
      teaches=f"{words} — {teach}. The interval is heard in a fill, which is how a player hears it; the single hits alone do not show the crowding.",
      record=f"A one-bar fill at 90 BPM — two MED strokes on the rack tom, two on the floor tom, then let both ring — with {words}.",
      how=[f"Tuning states {tids}: the floor tom stays at T-F3 for all three pairs; the rack tom is at the ladder step named. Nothing is retuned for this card.",
           f"Rack close mic and floor close mic as DRM-00; the seat mic as always. Three mono files from one performance; do not align or balance them.",
           "A click in the drummer's ear at 90 BPM (not recorded): R R F F on beats 1–4, then ring out. Three takes; deliver the cleanest."],
      tips=["The fills sit at the END of each rack ladder step (LOW → CLOSE pair; MID → DISTINCT pair; HIGH → UNBALANCED pair), so they cost no retuning."] if i == 1 else [],
      specs={"Channels": "Mono (three files: rack close, floor close, seat)", "Length": "4.0 s from the first stroke, full decay + 0.5 s room tone", "Type": "One-shot phrase (fill)",
             "Tuning states": tids, "Levels": "FIXED-GAIN per drum as DRM-01; ≤ −6 dBFS", "Set": "FIXED-GAIN", "Room": "As the strikes"},
      qc=["Exactly four strokes, even in level and timing (within 20 ms of the click).", "Both drums ring out fully; no third drum or cymbal is touched.", "Three files start within 1 ms of each other."]))
item(id="DRM-08", title="The tom pair — distinct / too close / unbalanced", pri="P2", sess=[SESSION], group=G_,
 used="Chapter 6 › <em>Build the tom range</em>: RACK (100–300 Hz) and FLOOR (70–220 Hz) faders, ▶ RACK, ▶ FLOOR, ▶ BOTH and a VERDICT readout — DISTINCT (about 2.5–9 semitones apart, both drums in range), CLOSE (under 2.5) or UNBALANCED (over 9, one drum out of range, or the floor above the rack). The chapter banks when the learner reaches DISTINCT and has heard both drums. The single hits come from DRM-01; this card adds the three pair fills, chosen so every one uses a tuning the ladder already passes through.",
 safety=[], reuse="Single hits: DRM-01 rack LOW/MID/HIGH and floor HIGH.", see=["DRM-01"],
 usedin="Ch6 Build the tom range (" + PATHS[6] + ")",
 recs=_pair)

# ---------------------------------------------------------------- DRM-09 the Chapter 7 cases
_c7 = []
_c7.append(rec("DRM-09.1", "Rack tom HIGH — resonant head retuned 3 semitones above — MED stroke", strike_files("drm09", "rack", "high-resoup", "med"),
  context="Chapter 7 › <em>Excessive ring</em> (rack tom, both heads high and equal, no damping — DRM-01 rack HIGH / MED as the case opens): the FIX “retune the resonant head away from the batter”. The lab accepts this and the gel pad (DRM-09.2) as two legitimate fixes with different sounds.",
  teaches="Two heads near the same pitch exchange energy and sustain each other; moving the resonant head changes the sustain and where the ring sits — without damping anything.",
  record="One MED stroke on the rack tom at HIGH batter tuning with the resonant head's lug readings 3 semitones above the batter's.",
  how=["Batter stays at T-R3. Resonant head to × 1.19 by the device, star pattern. Read all lugs: T-R3f.", *MIC_HOW("rack"), "One MED stroke, ring out, three takes. Then return the resonant head to equal (T-R3) by the device."],
  tips=["Record this straight after the T-R3 ladder strokes, before the gel pad, so the gel file is at the equal relationship."],
  specs=STRIKE_SPECS("rack", "T-R3f"), qc=STRIKE_QC + ["Sustain audibly shorter than DRM-01 rack HIGH / MED."]))
_c7.append(rec("DRM-09.2", "Rack tom HIGH — one gel pad — MED stroke", strike_files("drm09", "rack", "high-gel", "med"),
  context="Chapter 7 › <em>Excessive ring</em>: the FIX “add a gel pad near the rim” (the lab: “damping takes the high ring first and shortens it; the heads keep their relationship — a different sound from retuning the resonant head”).",
  teaches="The other legitimate fix for ring: damping. Same relationship, shorter note, high ring gone first. The learner hears that two fixes can both be right and sound different.",
  record="One MED stroke on the rack tom at HIGH tuning, heads equal (T-R3), with one gel pad 3 cm in from the hoop at lug 4.",
  how=["State T-R3 (resonant back to equal). Add the gel pad; photograph it.", *MIC_HOW("rack"), "One MED stroke, ring out, three takes. Remove the gel."],
  tips=[], specs=STRIKE_SPECS("rack", "T-R3", {"Damping": "one gel pad"}), qc=STRIKE_QC))
_c7.append(rec("DRM-09.3", "Rack tom MID — the drift take: 24 MED strokes with rod 2 free to back out", [ffile("drm09-rack-mid-drift-24strokes-close", "drift · 24 strokes · close mic", "≈ 50 s"), ffile("drm09-rack-mid-drift-24strokes-seat", "drift · 24 strokes · seat mic", "≈ 50 s", "Same take from the seat mic.")],
  context="Chapter 7 › <em>Drum will not hold tuning</em>: “the rack tom is even after tuning, then one lug drops within a few minutes of playing — every strike moves one rod.” The lab counts strikes and drops lug 2 a little on each; the app will cut this take into per-strike clips so the learner hears the drum drift as they press ▶ STRIKE.",
  teaches="A rod backing out under vibration: the drum is even, then is not, with nothing touched. Retuning the lug is not the fix if it drifts again; the hardware is. The two tap rounds (before: DRM-03.1–6; after: DRM-09.4–9) show where it went.",
  record="One continuous take: 24 MED strokes, one every 2 s to a click in the drummer's ear, on the rack tom at MID (T-R2, even) with rod 2 prepared so it CAN back out: its washer removed and its threads lightly oiled, snugged by hand to the even reading, no lug lock.",
  how=["Start from T-R2 (even, logged, DRM-03.1–6 recorded). Back rod 2 out, remove its washer, oil the threads lightly, bring it back to the T-R2 reading by the device. Do not strike before the take.", *MIC_HOW("rack"),
       "Roll, slate, 24 MED strokes at 2 s spacing, stop. Do not touch the drum.", "Read all six lugs: that row is T-R2h. Then record DRM-09.4–9 (the AFTER taps) before anything is refitted.",
       f"If rod 2 did NOT move in 24 strokes, deliver the take anyway and log it; then — clearly labelled in the sidecar notes as STAGED — back rod 2 off ¼ turn by hand and record the after-taps as a demonstration. {NO_FAKE}"],
  tips=["Honest first: an oiled, washer-less rod on a 12\" tom often walks within 24 hard-ish strokes. If the drum has lug locks or nylon inserts, use the drum without them for this one take.", "Refit the washer afterwards and re-even the head by the device (T-R2) before the DISTINCT pair fill."],
  specs={"Channels": "Mono (two files)", "Length": "≈ 50 s (24 strokes at 2 s + decay + 0.5 s)", "Type": "Continuous take (the app cuts it)", "Tuning state": "T-R2 at the start; T-R2h at the end (both logged)",
         "Levels": "FIXED-GAIN rack STRIKE gain; ≤ −6 dBFS", "Set": "FIXED-GAIN", "Room": "As the strikes"},
  qc=["Exactly 24 strokes, even in stroke height (the drummer must not compensate for the changing sound).", "No touch, knock or key on the drum during the take.", "T-R2 and T-R2h both in tunings.csv; the sidecar notes say whether the drift was natural or STAGED."],
  safety=["Refit the washer. A washer-less rod left in a drum is how a lug insert strips."]))
for lug in range(1, 7):
    _c7.append(rec(f"DRM-09.{3 + lug}", f"Rack tom — after the drift take — lug {lug} tap", [ffile(f"drm09-rack-drift-after-lug{lug:02d}-tap", f"after drift · lug {lug}", "1.5 s")],
      context=f"Chapter 7 › <em>Drum will not hold tuning</em>: the learner must tap at least three lugs after striking and find the one that dropped (LUG {lug}, ▶ TAP). The BEFORE taps are DRM-03.1–6.",
      teaches=("Lug 2 taps lower than the rest after nothing but playing. " if lug == 2 else f"Lug {lug} is where it was: the drop is local to one rod. ") + "Hardware first — rods, washers — before tuning.",
      record=f"One light tap in front of lug {lug} of the rack tom at state T-R2h (as the drift take left it; nothing touched).",
      how=[("State T-R2h: read every lug FIRST, touch nothing. " if lug == 1 else "Same state; touch nothing between lugs. ") + TAP_METHOD, *TAP_HOW("rack")],
      tips=["Slate each lug number aloud before the tap; trim the slate out."] if lug == 1 else [],
      specs=TAP_SPECS("rack", "T-R2h"), qc=TAP_QC))
item(id="DRM-09", title="Chapter 7 symptom cases — the sounds the lab's five diagnoses need", pri="P2", sess=[SESSION], group=G_,
 used="Chapter 7 › <em>Diagnose the symptom</em>: five cases on the simulated drum — <em>Uneven or “warbling” tone</em> (rack), <em>Drum sounds choked</em> (floor), <em>Excessive ring</em> (rack), <em>Weak snare response</em> (snare, struck softly) and <em>Drum will not hold tuning</em> (rack, drifting with every strike). The learner strikes, taps at least three lugs where the case calls for it, names the area, then picks a FIX; wrong fixes leave the fault in place. Three of the five cases are already covered by files elsewhere in this add-on (listed below as reuse); this card records what is missing: the two ring fixes at HIGH tuning, and the drift — a real continuous take plus its AFTER tap round.",
 safety=["The drift take removes a washer on purpose. Refit it before the drum is retuned."],
 reuse="Warble: symptom DRM-02.2, taps DRM-03.7–12, fix DRM-01 rack MID / MED + DRM-03.1–6. Choked: symptom DRM-05.4, fix DRM-01 floor MID / MED. Ring: symptom DRM-01 rack HIGH / MED. Weak snare: symptom DRM-07.4, fix DRM-01 snare MID / SOFT. Drift BEFORE taps: DRM-03.1–6.",
 see=["DRM-02", "DRM-03", "DRM-05", "DRM-07"],
 usedin="Ch7 Diagnose the symptom (" + PATHS[7] + ")",
 recs=_c7)

# ============================================================ validation and counts
for it in ITEMS:
    it.setdefault("status", "new")
    for r in it["recs"]:
        for f in r["files"]:
            assert len(f) == 5 and f[4] in ("rec", "edit", "reuse", "opt", "hold"), (r["rid"], f)
IDS = {it["id"] for it in ITEMS}
assert len(IDS) == len(ITEMS)
RIDS = [r["rid"] for it in ITEMS for r in it["recs"]]
_d = [r for r, c in collections.Counter(RIDS).items() if c > 1]
assert not _d, ("duplicate rids", _d)
for it in ITEMS:
    it["see"] = [s for s in it["see"] if s in IDS or warn("see-also unknown:", it["id"], s)]
# the v2 brief must not already use the prefix
_v2 = "".join(open(os.path.join(HERE, f), encoding="utf-8").read() for f in ("rb2_items1.py", "rb2_items2.py", "rb2_items3.py"))
assert "DRM-" not in _v2 and LAB_KEY + "/" not in _v2, "prefix or folder already used in v2"
for tid in TUN:
    pass
_used_t = set(re.findall(r"T-[RFSK]\d[a-z]?", repr(ITEMS)))
_unused = [t for t in TUN if t not in _used_t]
if _unused:
    warn("tuning states never referenced:", _unused)

def all_files(it):
    return [f for r in it["recs"] for f in r["files"]]
def counted_files(files):
    c = collections.Counter()
    for f in files:
        c[f[4]] += 1
    return c
tot = collections.Counter()
for it in ITEMS:
    tot += counted_files(all_files(it))
N_ITEMS, N_RECS = len(ITEMS), len(RIDS)
REQ = tot["rec"] + tot["edit"]
names = [f[0] for it in ITEMS for f in all_files(it) if f[4] in ("rec", "edit", "opt")]
dups = [n for n, c in collections.Counter(names).items() if c > 1]
assert not dups, ("duplicate filenames", dups)
pri = collections.Counter(it["pri"] for it in ITEMS)
PER_DRUM = collections.Counter()
for n in names:
    m = re.search(r"/drm\d\d-(snare|rack|floor|kick|pair|roomtone)", n)
    PER_DRUM[m.group(1) if m else "other"] += 1

# ============================================================ diagrams
FIGS = []
_FIG_ANCH = set()
def _anchor(slug):
    a = "fig-" + re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-")
    base, k = a, 2
    while a in _FIG_ANCH:
        a = f"{base}-{k}"; k += 1
    _FIG_ANCH.add(a)
    return a
def fig(label, svg_tpl, caption, where, slug):
    a = _anchor(slug)
    FIGS.append((a, label, where))
    return f'<figure class="dfig" id="{a}">{D.uniq(svg_tpl)}<figcaption><b>Figure @@FN:{a}@@ · {label}.</b> {caption}</figcaption></figure>'
def tablefig(label, table_html, caption, where, slug):
    a = _anchor(slug)
    FIGS.append((a, label, where))
    return f'<figure class="dfig tfig" id="{a}"><figcaption class="top"><b>Figure @@FN:{a}@@ · {label}.</b> {caption}</figcaption>{table_html}</figure>'

def drum_side(x, y, w, h, hoop=4, batter=True, reso=True):
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.6, 4)
    if batter:
        o += L(x - w / 2 - 3, y - h / 2, x + w / 2 + 3, y - h / 2, INK, hoop)
    if reso:
        o += L(x - w / 2 - 3, y + h / 2, x + w / 2 + 3, y + h / 2, INK, hoop)
    for i in range(3):
        xx = x - w / 2 + 12 + i * (w - 24) / 2
        o += R(xx - 3, y - h / 2 + 4, 6, 14, "#fff", MUTE, 1, 1) + R(xx - 3, y + h / 2 - 18, 6, 14, "#fff", MUTE, 1, 1)
    return o

def svg_tom_mics():
    w, h = 680, 410
    o = T(340, 24, "Close mic and SEAT mic on a tom — side view, the drummer seated", 13, w="700")
    # floor line
    o += L(30, 320, 650, 320, MUTE, 1.2) + T(640, 314, "floor", 11, "end", SUB)
    # throne + drummer (side): seat at 190, head at 90
    px = 150
    o += R(px - 22, 212, 44, 10, "#fff", INK, 1.4, 3) + L(px, 222, px, 300, INK, 2) + L(px - 18, 300, px + 18, 300, INK, 2)
    o += C(px, 96, 16, "#fff", INK, 1.6) + L(px, 112, px, 212, INK, 2.2) + L(px, 140, px + 70, 170, INK, 2)   # head, torso, arm
    o += T(px - 24, 165, "drummer", 12, "end", SUB)
    # seat omni next to the right ear
    o += mic(px + 34, 92, 0, "omni", 0.9) + T(px + 34, 74, "SEAT mic", 12, fill=ACC, w="700")
    o += TL(30, 366, ["SEAT mic: a true pressure omni 10 cm to the right of the drummer's right ear, 1.2 m above the floor, capsule up.", "Delivered as “seat”. It never moves: it IS the playing position the lab talks about."], 11, "start", ACC)
    o += DIM(px + 60, 300, px + 60, 100, "1.2 m", -22, 0, 11)
    # tom on stand
    tx, ty = 420, 230
    o += drum_side(tx, ty, 130, 90)
    o += L(tx, ty + 45, tx, 318, INK, 2) + L(tx - 24, 318, tx + 24, 318, INK, 2)
    o += T(tx, ty + 6, '12" × 8" rack tom', 11, fill=SUB)
    # strike spot
    o += C(tx - 20, ty - 45, 4, RED, RED, 1) + lead(tx - 20, ty - 49, tx - 40, ty - 90) + TL(tx - 40, ty - 100, ["strike spot: a third of the way", "from centre to hoop, drummer's side;", "tape BESIDE it, never under it"], 11, "middle", RED)
    o += L(px + 70, 170, tx - 24, ty - 50, MUTE, 1.2, "3 3")   # stick
    # close mic over the far rim
    o += mic(tx + 90, ty - 95, 215, "dyn", 1.1)
    o += DIM(tx + 66, ty - 45, tx + 66, ty - 80, "3–5 cm", 26, 4, 11, SUB, "start")
    o += lead(tx + 100, ty - 112, tx + 120, ty - 150) + TL(tx + 120, ty - 160, ["CLOSE mic: SM57-class cardioid dynamic", "3–5 cm above the hoop, 30–45° down toward", "the strike spot. One taped gain per drum."], 11, "middle", ACC)
    o += DIM(px + 34, 334, tx, 334, "≈ 60–80 cm from the ear to the drum (log the real distance)", 0, 14, 11)
    return D.SVG("Close mic and seat mic on a tom", "Side view. A drummer sits at a rack tom. A dynamic close mic hangs 3 to 5 cm above the far rim angled toward a marked strike spot a third of the way from the centre. A pressure omni, the seat mic, stands 10 cm to the right of the drummer's right ear at 1.2 m, capsule up, and never moves. The ear is 60 to 80 cm from the drum.", w, h, o)

def svg_lugmap():
    w, h = 680, 350
    o = T(340, 24, "Lug numbering and the tap spot — looking down on the batter head", 13, w="700")
    import math
    def head(cx, cy, r, n, label, star):
        s = C(cx, cy, r + 8, "#fff", INK, 2) + C(cx, cy, r, "#fff", MUTE, 1) + C(cx, cy, r - 9, "none", ACC, 1, "3 3")
        pts = []
        for i in range(n):
            a = -math.pi / 2 + 2 * math.pi * i / n
            x, y = cx + (r + 8) * math.cos(a), cy + (r + 8) * math.sin(a)
            pts.append((x, y))
            s += R(x - 5, y - 5, 10, 10, ACCL, ACC, 1.2, 2) + T(cx + (r + 24) * math.cos(a), cy + (r + 24) * math.sin(a) + 4, str(i + 1), 11, fill=INK, w="700")
            s += C(cx + (r - 9) * math.cos(a), cy + (r - 9) * math.sin(a), 2.5, RED, RED, 1)
        if star:
            for a_, b_ in zip(star, star[1:]):
                s += L(pts[a_ - 1][0], pts[a_ - 1][1], pts[b_ - 1][0], pts[b_ - 1][1], RED, 1, "4 3", "rd")
        s += T(cx, cy + r + 46, label, 11, fill=SUB)
        return s
    o += head(120, 160, 58, 6, "rack tom · 6 lugs · star 1-4-2-5-3-6", [1, 4, 2, 5, 3, 6])
    o += head(300, 160, 64, 8, "floor tom / bass drum · 8 lugs", [1, 5, 2, 6, 3, 7, 4, 8])
    o += head(500, 160, 66, 10, "snare · 10 lugs", [])
    o += person(630, 296, 0, 0.8) + T(630, 318, "drummer", 10, fill=SUB)
    o += T(300, 300, "Lug 1 = the lug farthest from the drummer (12 o'clock); number clockwise, as the lab does.", 11, fill=INK)
    o += T(300, 316, "Red dot = tap spot, 2.5 cm (1 in) in from the hoop, in front of the lug.", 11, fill=INK)
    o += T(300, 332, "Red dashed = the star (cross) order for every tension change: half a turn at a time, then eighths.", 11, fill=RED)
    return D.SVG("Lug numbering and tap spots", "Three drum heads seen from above: a six-lug rack tom, an eight-lug floor tom or bass drum and a ten-lug snare. Lug 1 is the farthest from the drummer at 12 o'clock and the rest are numbered clockwise. A red dot one inch inside the hoop in front of each lug marks the tap spot. Red dashed lines show the star tightening order.", w, h, o)

def svg_strokes():
    w, h = 680, 345
    o = T(340, 24, "The three named strokes — stick height above the head, and the beater", 13, w="700")
    hy = 238
    o += L(40, hy, 440, hy, INK, 3) + T(240, hy + 18, "drum head (side view)", 11, fill=SUB)
    for x, name, cm, px in ((110, "SOFT", "≈ 5 cm", 18), (240, "MED", "≈ 15 cm", 55), (370, "HARD", "≈ 40 cm", 150)):
        y = hy - px
        o += L(x - 40, y - 24, x + 10, y, INK, 3) + C(x + 12, y + 1, 3.5, "#fff", INK, 1.4)
        o += DIM(x + 40, hy, x + 40, y, cm, 30, 4, 11, SUB, "start")
        o += T(x - 10, y - 34, name, 13, fill=RED if name == "HARD" else ACC, w="700")
    o += TL(40, 276, ["SOFT: a ghost note, wrist only — the lab's STRIKE/STROKE fader near 30 %.", "MED: a backbeat, wrist stroke — the fader near 60 %.", "HARD: a full stroke from shoulder height, NO rimshot — the fader at 100 %.", "One pair of 5A hickory wood-tip sticks all day. Same spot on the head every time."], 11, "start", INK)
    # beater
    bx = 560
    o += L(bx + 40, 110, bx + 40, 240, INK, 3) + L(bx + 42, 108, bx + 42, 242, INK, 1)
    o += P(f"M{bx + 40} 240 L{bx - 10} 180", "none", INK, 2.5) + C(bx - 16, 174, 9, "#fff", INK, 1.6)
    o += T(bx, 60, "BEATER", 13, fill=ACC, w="700") + TL(bx, 78, ["medium felt; the beater", "REBOUNDS at all three", "strokes — never buried"], 11, "middle", SUB)
    o += TL(bx, 280, ["SOFT = heel-down tap", "MED = normal · HARD = full"], 10, "middle", SUB)
    return D.SVG("The three named strokes", "Side view of a drum head with three stick positions: SOFT about 5 cm above the head, MED about 15 cm, HARD about 40 cm. To the right a bass-drum pedal and beater; the beater rebounds at every stroke and is never buried. One pair of 5A sticks and a medium felt beater are used all day.", w, h, o)

def svg_relationships():
    w, h = 680, 250
    o = T(340, 24, "The three head relationships, as lug readings (rack tom at MID, batter ≈ 165 Hz)", 13, w="700")
    for i, (lab, rhz, col, tid) in enumerate((("RESO ↑ · T-R2f", 196, ACC, "× 1.19"), ("EQUAL · T-R2", 165, INK, "× 1.00"), ("BATTER ↑ · T-R2g", 139, RED, "÷ 1.19"))):
        x = 100 + i * 215
        o += drum_side(x, 140, 100, 70)
        o += T(x, 56, lab, 12, fill=col, w="700")
        o += T(x + 58, 108, "batter 165 Hz", 11, "start", INK, w="700") + T(x + 58, 180, f"resonant {rhz} Hz", 11, "start", col, w="700") + T(x + 58, 196, f"({tid})", 10, "start", SUB)
    o += T(340, 232, "Resonant head set by the device at every lug (3 semitones = × or ÷ 1.19); the batter is never touched. “Equal” = equal lug READINGS.", 11, fill=SUB)
    return D.SVG("The three head relationships", "Three side views of a rack tom: resonant head 3 semitones above the batter, both heads equal, and the batter 3 semitones above the resonant head, with the lug readings 196, 165 and 139 Hz against a batter of 165 Hz.", w, h, o)

def svg_kick():
    w, h = 680, 400
    o = T(340, 24, "Bass drum — side view: the OUT close mic, the seat mic and the three front-head states", 13, w="700")
    kx, ky = 300, 190
    o += R(kx - 90, ky - 70, 180, 140, "#fff", INK, 1.6, 6) + L(kx - 90, ky - 72, kx - 90, ky + 72, INK, 4) + L(kx + 90, ky - 72, kx + 90, ky + 72, INK, 4)
    o += T(kx, ky + 4, '22" × 16"', 12, fill=SUB)
    o += P(f"M{kx - 128} {ky + 60} L{kx - 96} {ky + 6}", "none", INK, 2.4) + C(kx - 94, ky + 2, 6, "#fff", INK, 1.5) + T(kx - 118, ky + 80, "beater (pedal)", 11, fill=SUB)
    o += T(kx - 96, ky - 84, "batter", 11, fill=SUB) + T(kx + 92, ky - 84, "front head", 11, fill=SUB)
    o += mic(kx + 160, ky, -90, "ldc", 1.1) + DIM(kx + 92, ky - 30, kx + 151, ky - 30, "20 cm", 0, -6, 11)
    o += TL(kx + 160, ky + 64, ["OUT close mic: LDC or large dynamic", "20 cm in front of the front head", "(or of the front HOOP when the head is off),", "on the beater axis. It never moves."], 11, "middle", ACC)
    # drummer + seat
    px = 80
    o += C(px, 80, 14, "#fff", INK, 1.5) + L(px, 94, px, 170, INK, 2) + mic(px + 30, 78, 0, "omni", 0.85) + T(px + 30, 62, "SEAT mic", 11, fill=ACC, w="700") + T(px, 190, "drummer", 11, fill=SUB)
    # states
    for i, (lab, port, present) in enumerate((("CLOSED · T-K2c", False, True), ("PORTED · T-K2 (DRM-01)", True, True), ("NO FRONT · T-K2", False, False))):
        x = 110 + i * 200
        y = 340
        o += C(x, y, 26, "#fff", INK, 1.6)
        if present:
            o += C(x, y, 23, "#fbfaf7", MUTE, 1)
            if port:
                o += C(x + 9, y + 8, 6, "#fff", INK, 1.4)
        else:
            o += C(x, y, 23, "none", MUTE, 1, "3 3")
        o += T(x + 36, y + 4, lab, 11, "start", INK)
    o += T(340, 388, "Front-head states are all recorded at the MID batter (T-K2); PORTED is the kick's standard state everywhere else in this add-on.", 10, fill=SUB)
    return D.SVG("Bass drum mics and front-head states", "Side view of a 22 inch bass drum with the beater on the left. An outside close mic sits 20 cm in front of the front head on the beater axis and never moves. The drummer with the seat omni is on the left. Below, three front views show the front head closed without a port, ported, and removed.", w, h, o)

def svg_snare():
    w, h = 680, 300
    o = T(340, 24, "Snare — side view: close mic, strainer, snare-side head, seat mic", 13, w="700")
    sx, sy = 330, 170
    o += drum_side(sx, sy, 170, 46, 3.5)
    o += P(f"M{sx - 70} {sy + 27} " + " ".join(f"L{sx - 70 + i * 10} {sy + 27 + (3 if i % 2 else 0)}" for i in range(15)), "none", MUTE, 1.2)
    o += T(sx, sy + 4, '14" × 5.5" snare', 11, fill=SUB) + T(sx - 60, sy + 46, "wires on the snare-side head", 11, "start", SUB)
    o += R(sx + 86, sy - 12, 10, 30, "#fff", INK, 1.3, 2) + L(sx + 96, sy - 8, sx + 118, sy - 26, INK, 2.2) + T(sx + 120, sy - 34, "strainer (throw-off)", 11, "start", INK)
    o += TL(sx + 120, sy - 14, ["OFF · MEDIUM · TIGHT", "photograph each setting"], 10, "start", SUB)
    o += mic(sx - 112, sy - 60, 125, "dyn", 1.1) + lead(sx - 118, sy - 78, sx - 40, sy - 102) + TL(sx + 40, sy - 118, ["CLOSE: SM57 class 3–5 cm above the hoop,", "30–45° down to the strike spot, rear to the hat side"], 11, "middle", ACC)
    o += C(sx - 30, sy - 24, 4, RED, RED, 1) + T(sx - 30, sy - 32, "strike spot", 10, fill=RED)
    o += TL(sx, sy + 76, ["snare-side head (2–3 mil): LOOSE +100 ¢ · MID +500 ¢ · TIGHT +900 ¢ above the batter's lug reading —", "set by the device; stop when the pitch stops rising."], 11, "middle", INK)
    o += C(70, 80, 14, "#fff", INK, 1.5) + L(70, 94, 70, 160, INK, 2) + mic(100, 78, 0, "omni", 0.85) + T(100, 62, "SEAT mic", 11, fill=ACC, w="700")
    o += T(340, 284, "Hearing protection for everyone during HARD strokes.", 11, fill=RED)
    return D.SVG("Snare drum mics, strainer and snare-side head", "Side view of a snare drum. A dynamic close mic hangs above the hoop angled at a marked strike spot. The strainer lever is on the right; the wires lie on the thin snare-side head below. The seat omni stands by the drummer on the left. Text gives the three strainer settings and the three snare-side head tunings.", w, h, o)

def svg_plan8():
    w, h = 680, 440
    o = T(340, 24, "Session 8 floor plan — one kit, two mic positions, the tuning station", 13, w="700")
    o += R(30, 44, 620, 360, "#fff", INK, 3, 4)
    kx, ky = 300, 240
    o += D.drumkit_small(kx, ky, 0, 1.5)
    o += C(kx + 28, ky + 56, 9, ACCL, ACC, 1.5) + T(kx + 42, ky + 60, "SEAT omni", 11, "start", ACC, w="700")
    o += T(kx, ky + 100, "drummer (throne)", 11, fill=SUB)
    o += mic(kx - 70, ky - 60, ang_to_(kx - 70, ky - 60, kx - 42, ky + 12), "dyn", 0.9) + T(kx - 118, ky - 70, "close dyn", 10, "end", ACC)
    o += mic(kx - 34, ky - 110, ang_to_(kx - 34, ky - 110, kx - 18, ky - 45), "dyn", 0.9) + T(kx - 60, ky - 128, "close dyn (rack)", 10, "end", ACC)
    o += mic(kx + 92, ky + 40, ang_to_(kx + 92, ky + 40, kx + 51, ky + 21), "dyn", 0.9) + T(kx + 104, ky + 22, "close dyn (floor)", 10, "start", ACC)
    o += mic(kx, ky - 100, 0, "ldc", 0.9) + T(kx + 14, ky - 112, "kick OUT, 20 cm in front", 10, "start", ACC)
    # engineer table
    o += D.table(470, 300, 150, 70, "recorder / laptop · engineer") if hasattr(D, "table") else R(470, 300, 150, 70)
    o += DIM(kx + 60, ky + 86, 470, 340, "≈ 3 m", 0, 14, 11)
    # tuning station
    o += R(70, 300, 130, 80, "#fbfaf7", MUTE, 1.3, 4) + TL(135, 322, ["TUNING STATION", "device · drum key · log sheet", "gel pads · felt · pillows", "spare heads · washers · oil"], 10, "middle", INK)
    o += R(70, 60, 130, 44, REDL, RED, 1.2, 4) + TL(135, 78, ["EAR PLUGS — everyone,", "including the drummer"], 10, "middle", RED)
    o += T(340, 426, "Quiet, fairly dry room (RT60 ≤ 0.5 s). The kit, the seat mic and the close-mic stands are taped down and never move once the first drum is struck.", 10, fill=SUB)
    return D.SVG("Session 8 floor plan", "A room with a drum kit in the centre, the drummer on a throne at the bottom with the seat omni beside the head. Close dynamics over the snare, rack tom and floor tom and an outside kick mic. The engineer's table with the recorder is about 3 m to the right. A tuning station with the device, keys, log sheet, damping materials and spare heads is at the left, and a box of ear plugs by the door.", w, h, o)

def ang_to_(x1, y1, x2, y2):
    import math
    return math.degrees(math.atan2(x2 - x1, -(y2 - y1)))

TIMELINE = [("Drum day|(≈ 7½ h)", [
    ("Q", "Room tone, gains, seat mic, stroke rehearsal, log sheet", 30, None, "quiet"),
    ("F", "FLOOR: LOW → MID (taps, uneven, RESO ↑/↓, gel, pillow) → HIGH; stays HIGH", 90, "mic", "normal"),
    ("R", "RACK: LOW + close pair → MID (taps, rods, damping, RESO, drift) → HIGH + ring fixes", 150, "mic", "normal"),
    ("S", "SNARE: LOW → MID (taps, strainer OFF/TIGHT, side LOOSE/TIGHT) → HIGH", 90, "mic", "loud"),
    ("K", "KICK: LOW → MID (pillows, head OFF, CLOSED head) → re-fit ported → HIGH", 90, "mic", "loud")])]

INPUTS8 = [
 ("all", "Seat — the playing position", "True pressure omni (measurement omni or true omni LDC), 10 cm right of the right ear, 1.2 m, capsule up", "Omni", "ON", "one STRIKE gain per drum, taped and logged", "seat", "every DRM item"),
 ("F R S", "Tom / snare close", "SM57-class cardioid dynamic, 3–5 cm above the hoop, 30–45° to the strike spot", "Cardioid", "off", "STRIKE gain and a separate TAP gain per drum, taped and logged", "close", "DRM-01 … DRM-05, DRM-07, DRM-09"),
 ("R+F", "Second tom close (pair fills)", "Second SM57-class dynamic on the floor tom while the rack mic stays up", "Cardioid", "off", "the floor tom's STRIKE gain", "floorclose", "DRM-08"),
 ("K", "Kick OUT", "LDC or large dynamic, 20 cm in front of the front head / hoop, beater axis", "Cardioid", "ON (LDC) / off (dynamic)", "STRIKE gain, HARD ≈ −6 dBFS", "close", "DRM-01 kick, DRM-05.5–6, DRM-06"),
 ("—", "Click to the drummer", "Headphone/earpiece feed at 90 BPM (fills) and 30 BPM (drift take); NOT recorded", "—", "—", "—", "—", "DRM-08, DRM-09.3"),
]
def input_table8():
    rows = []
    for i, (st, src, mic_, pat, ph, gain, trk, items) in enumerate(INPUTS8, 1):
        il = re.sub(r"DRM-\d\d", lambda m: f'<a href="#item-{m.group(0).lower()}">{m.group(0)}</a>', items)
        phh = '<span class="ph-on">ON</span>' if ph == "ON" else ph
        rows.append(f"<tr><td class='num'>{i}</td><td>{st}</td><td>{src}</td><td>{mic_}</td><td>{pat}</td><td class='ph'>{phh}</td><td>{gain}</td><td><code>{trk}</code></td><td class='idl'>{il}</td></tr>")
    return ("<div class='tablewrap'><table class='inputs'><thead><tr><th>#</th><th>Block</th><th>Source</th><th>Mic</th><th>Pattern</th><th>+48 V</th><th>Preamp gain mark</th><th>File suffix</th><th>Items</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table></div>")

TUN_COLS = ("tuning_id,drum,batter_head_model,reso_head_model,device_model,device_mode,units,"
            + ",".join(f"batter_lug_{i:02d}" for i in range(1, 11)) + "," + ",".join(f"reso_lug_{i:02d}" for i in range(1, 11))
            + ",batter_mean,reso_mean,drum_fundamental_hz,temp_c,humidity_pct,notes")
TUN_EX = "T-R2,rack,Remo Ambassador coated 12,Remo Ambassador clear 12,Tune-Bot Studio,lug pitch,Hz,166,165,164,166,165,165,,,,,165,166,165,164,166,165,,,,,165.2,165.2,163,21,45,even by device then checked by ear"
def tunings_table():
    rows = "".join(f"<tr><td><code>{t}</code></td><td>{KIT[d]['short']}</td><td>{lab}</td></tr>" for t, d, lab in TUNINGS)
    return f"<div class='tablewrap'><table class='specs'><thead><tr><th>tuning_id</th><th>Drum</th><th>State (what the row must show)</th></tr></thead><tbody>{rows}</tbody></table></div>"

FIGDEF = {
 "tommics": ("Close mic and seat mic on a tom", svg_tom_mics(), "Side view; the seat omni never moves — it is the playing position the lab talks about."),
 "lugmap": ("Lug numbering and tap spots", svg_lugmap(), "Lug 1 farthest from the drummer, clockwise; tap 2.5 cm inside the hoop; star order for every change."),
 "strokes": ("The three named strokes", svg_strokes(), "SOFT ≈ 5 cm, MED ≈ 15 cm, HARD ≈ 40 cm; the beater always rebounds."),
 "rel": ("The three head relationships", svg_relationships(), "Lug readings on the rack tom at MID; the batter is never touched."),
 "kick": ("Bass drum mics and front-head states", svg_kick(), "The OUT position is valid for closed, ported and removed; it never moves."),
 "snare": ("Snare mics, strainer and snare-side head", svg_snare(), "Three strainer settings, three snare-side tunings; the batter stays at MID."),
}
DIAG = {"DRM-00": ["tommics", "strokes", "lugmap"], "DRM-01": ["strokes"], "DRM-02": ["lugmap"], "DRM-03": ["lugmap"], "DRM-04": ["rel"], "DRM-06": ["kick"], "DRM-07": ["snare"], "DRM-09": ["lugmap"]}
RDIAG = {"DRM-05.4": [], "DRM-09.3": ["lugmap"]}
def figs_for(keys, where, slug):
    return "".join(fig(FIGDEF[k][0], FIGDEF[k][1], FIGDEF[k][2], where, f"{k}-{slug}") for k in keys)

# ============================================================ render (same markup as rb2_build)
def aid(i):
    return "item-" + i.lower()
def rid_anchor(r):
    return re.sub(r"\s+", "-", r["rid"].strip())
def badge(p):
    return f'<span class="badge {p.lower()}">{p}</span>'
def ul(lst, cls=""):
    if not lst:
        return "<p class='muted'>—</p>"
    return f"<ul class='{cls}'>" + "".join(f"<li>{x}</li>" for x in lst) + "</ul>"
def ol(lst):
    return "<ol>" + "".join(f"<li>{x}</li>" for x in lst) + "</ol>"
def safety_html(lst):
    if not lst:
        return ""
    return "<div class='safety-note'><strong>Safety:</strong> " + " · ".join(lst) + " <a href='#safety'>(Safety section)</a></div>"
KIND = {"rec": "New recording", "edit": "Edit/derived copy", "reuse": "Reuse — not a new file", "opt": "Optional", "hold": "On hold"}
def files_table(files):
    rows = []
    for fn, var, ln, note, k in files:
        cb = "" if k in ("reuse", "hold") else f'<input type="checkbox" aria-label="Delivered: {fn}" data-file="{fn}">'
        rows.append(f"<tr class='k-{k}'><td class='cb'>{cb}</td><td class='fn'><code>{fn}</code></td><td>{var}</td><td class='nowrap'>{ln}</td><td>{note}{'' if k == 'rec' else (' <span class=kind>' + KIND[k] + '</span>')}</td></tr>")
    return ("<div class='tablewrap'><table class='files'><thead><tr><th class='cb'>✓</th><th>Filename</th><th>Variant</th><th>Length</th><th>Notes</th></tr></thead><tbody>" + "".join(rows) + "</tbody></table></div>")
def specs_table(sp):
    return "<div class='tablewrap'><table class='specs'><tbody>" + "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in sp.items()) + "</tbody></table></div>"
def nfiles_c(c):
    n = c["rec"] + c["edit"]
    s = f"{n} file{'s' if n != 1 else ''}"
    if c["opt"]:
        s += f" + {c['opt']} optional"
    return s
def plain(*parts):
    t = re.sub(r"<[^>]+>", " ", " ".join(parts)).lower()
    return re.sub(r"\s+", " ", t).replace('"', "").strip()
def flat(v):
    if isinstance(v, dict):
        return " ".join(f"{k} {x}" for k, x in v.items())
    if isinstance(v, (list, tuple)):
        return " ".join(flat(x) for x in v)
    return str(v)
def rec_text(r):
    return plain(r["rid"], r["title"], r["context"], r["teaches"], r["record"], flat(r["how"]), flat(r["tips"]), flat(r["specs"]), flat(r["qc"]), " ".join(f[0] + " " + f[1] for f in r["files"]))
def rec_html(it, r, open_):
    c = counted_files(r["files"])
    sh = safety_html(r["safety"]) if r["safety"] else ""
    return f'''<details class="rec" id="{rid_anchor(r)}" data-text="{amp(rec_text(r))}" data-defopen="{1 if open_ else 0}"{" open" if open_ else ""}>
<summary><h4 class="rech"><span class="rid">{r['rid']}</span> — {r['title']}</h4><span class="rnf">{nfiles_c(c)}</span></summary>
<div class="rbody">
<h5>Where it's used</h5><p>{r['context'] or '—'}</p>
<h5>What it teaches</h5><p>{r['teaches'] or '—'}</p>
<h5>What to record</h5><p>{r['record'] or '—'}</p>
<h5>How to make it</h5>{ol(r['how']) if r['how'] else "<p class='muted'>—</p>"}
{('<h5>Diagram</h5>' + figs_for(RDIAG[r['rid']], r['rid'], r['rid'])) if RDIAG.get(r['rid']) else ''}
<h5>Efficient method / pro tips</h5>{ul(r['tips'], 'tips')}
<h5>Specs</h5>{specs_table(r['specs'])}
<h5>Files to deliver</h5>{files_table(r['files'])}
<h5>Quality check before delivery</h5>{ul(r['qc'], 'qc')}
{('<h5>Safety</h5>' + sh) if sh else ''}
</div></details>'''
def card(it):
    sid = aid(it["id"])
    is_open = " open" if it["pri"] == "P1" else ""
    rec_open = bool(is_open) and len(it["recs"]) <= 12
    text = plain(it["id"], it["title"], it["used"], flat(it["reuse"]), " ".join(rec_text(r) for r in it["recs"]), " ".join(f[0] for f in all_files(it)))
    see = " ".join(f'<a href="#{aid(s)}">{s}</a>' for s in it["see"]) or "—"
    recs = "".join(rec_html(it, r, rec_open) for r in it["recs"])
    rlist = " ".join(f'<a href="#{rid_anchor(r)}">{r["rid"]}</a>' for r in it["recs"])
    c = counted_files(all_files(it))
    nr = len(it["recs"])
    keys = DIAG.get(it["id"], [])
    diag = (f'<h4>Setup diagram{"s" if len(keys) > 1 else ""}</h4>' + figs_for(keys, f"card {it['id']}", it["id"])) if keys else ""
    return f'''<details class="card st-new" id="{sid}" data-pri="{it['pri']}" data-sess="{SESSION}" data-text="{amp(text)}"{is_open}>
<summary><span class="cid">{it['id']}</span><span class="ctitle">{it['title']}</span>{badge(it['pri'])}<span class="csess">Session {SESSION}</span><span class="cnf">{nr} recording{'s' if nr != 1 else ''} · {nfiles_c(c)}</span></summary>
<div class="cbody">
<div class="meta">{badge(it['pri'])} <a href="#session-{SESSION}">Session {SESSION}</a> · {nr} recording{'s' if nr != 1 else ''} · {nfiles_c(c)}</div>
<h4>About this lab page</h4><p>{it['used']}</p>
{diag}
{safety_html(it['safety'])}
<p class="reuse"><strong>Reuse:</strong> {it['reuse'] or '—'} &nbsp; <strong>See also:</strong> {see}</p>
<div class="recs"><p class="reclist"><strong>Recordings in this item:</strong> {rlist}</p>{recs}</div>
<p class="usedin">Used in: {it['usedin']}</p>
</div></details>'''

items_html = f'<section class="labgroup" id="lab-drum-tuning-lab"><h3>{G_} <span class="muted small">· {N_ITEMS} items · {N_RECS} recordings · {REQ} files</span></h3>' + "".join(card(it) for it in ITEMS) + "</section>"

# ============================================================ front matter, spec, session, safety, checklists
glance = f'''<div class="glance">
<div><b>{N_ITEMS}</b><span>new item cards (DRM-00 … DRM-09)</span></div>
<div><b>{N_RECS}</b><span>distinct recordings described</span></div>
<div><b>{REQ}</b><span>files to deliver</span></div>
<div><b>{PER_DRUM['rack'] + PER_DRUM['floor']}</b><span>tom files (rack {PER_DRUM['rack']}, floor {PER_DRUM['floor']})</span></div>
<div><b>1</b><span>session (Session 8)</span></div>
<div><b>{len(TUNINGS)}</b><span>tuning states to log</span></div>
</div>
<p>Files by drum: snare {PER_DRUM['snare']} · rack tom {PER_DRUM['rack']} · floor tom {PER_DRUM['floor']} · bass drum {PER_DRUM['kick']} · tom-pair fills {PER_DRUM['pair']} · room tone {PER_DRUM['roomtone']}. Priority: <span class="badge p1">P1</span> {pri['P1']} · <span class="badge p2">P2</span> {pri['P2']}. Every file is a new recording; there are no edits or derived copies in this add-on (the app cuts the drift take itself).</p>
<p><strong>P1 — do first:</strong> {", ".join(f'<a href="#{aid(it["id"])}">{it["id"]}</a>' for it in ITEMS if it["pri"] == "P1")}. In practice the run order in Session 8 does them in one pass per drum, so P2 items cost little extra once a drum is up.</p>'''

HOWTO = f'''<ol>
<li><strong>This is an add-on to the v2 brief</strong> (2026-10-01). Everything in v2's sections B (global spec), F (safety) and G (checklists) still applies. This document only states what is <em>different or extra</em> for the drum files, then lists the items.</li>
<li><strong>Read <a href="#item-drm-00">DRM-00</a> first.</strong> It defines the two mic positions, the three named strokes, lug numbering and the tuning log that every other card relies on.</li>
<li><strong>Plan from <a href="#session-8">Session 8</a>.</strong> One day, one kit. The shot list is ordered so each drum is tuned LOW → MID → HIGH by tightening only, and every file that needs a given tuning is recorded while the drum is there. There is exactly one deliberate re-tune (the bass drum's ported head goes back on after the closed-head files).</li>
<li><strong>Each distinct recording has its own section</strong> (DRM-03.5 is one lug tap; DRM-01.14 is one stroke). A section holds two files only when they are the SAME strike heard by the close mic and the seat mic at once.</li>
<li><strong>“Reuse” rows</strong> point at a file recorded under another DRM item. Never record those twice.</li>
<li><strong>The tuning log is a deliverable.</strong> <code>{LAB_KEY}/tunings.csv</code> has one row per tuning state (T-R2, T-F2e …) with every lug's device reading on both heads. The lab prints those numbers next to the sound; a file without its tuning row is incomplete.</li>
<li>Anything you cannot capture honestly (a drift that did not happen, a snare-side head that would not reach +900 ¢): deliver what the drum did and say so in the notes. {NO_FAKE}</li></ol>'''

spec_rows = [
 ("Format", "As v2: WAV PCM, <strong>48 kHz / 24-bit</strong>, mono. Every DRM file is mono; a close/seat pair is two mono files, never a stereo file."),
 ("Two mic positions", "<strong>CLOSE</strong>: SM57-class dynamic 3–5 cm over the hoop for snare and toms; the kick-OUT position (20 cm in front of the front head) for the bass drum. <strong>SEAT</strong>: a true pressure omni 10 cm to the right of the drummer's right ear, 1.2 m up, capsule up, never moved. The lab says “play it from the playing position and listen from the seat”; the seat file is that. Strikes deliver both; lug taps deliver the close mic only."),
 ("Three named strokes", "<strong>SOFT</strong> (ghost note, tip from ≈ 5 cm), <strong>MED</strong> (backbeat, wrist from ≈ 15 cm), <strong>HARD</strong> (full stroke from ≈ 40 cm, never a rimshot). Beater: SOFT heel-down tap, MED normal, HARD full — the beater always rebounds. One pair of 5A wood-tip sticks and one medium felt beater all day; models in the sidecar."),
 ("Strike spot", "Snare and toms: about a third of the way from centre to hoop on the drummer's side (≈ 5 cm on 14\", 4–5 cm on 12\", 6 cm on 16\"); the same spot every time, marked with tape BESIDE it. Bass drum: where the pedal lands; log the offset."),
 ("Gains (FIXED-GAIN)", "Per drum: one taped STRIKE gain on each of the close and seat mics (HARD ≈ −6 dBFS, never above −3) and one taped TAP gain on the close mic (loudest tap ≈ −10 dBFS). SOFT strokes will sit near −20 dBFS: <strong>never normalize</strong> — the level is part of the stroke lesson. No MATCHED copies in this add-on."),
 ("Lengths", "Tom strikes 3.0 s, snare and kick strikes 2.0 s, lug taps 1.5 s, pair fills 4.0 s, the drift take ≈ 50 s, room tone 30 s. Always the full decay plus 0.5 s of room tone; fades 5–10 ms at zero crossings."),
 ("Lug numbering", "Lug 1 is the lug farthest from the drummer (12 o'clock looking down on the batter head); the rest clockwise. The lab numbers its rods the same way. Tap 2.5 cm (1 in) inside the hoop, in front of the lug."),
 ("The tuning device", "A lug-reading drum tuner that reports Hz (Tune-Bot class) in its lug-pitch mode, plus its fundamental mode for the whole-drum note. A dial tension gauge (DrumDial class) is acceptable only if you also log its units and model. The device sets and repeats states; your ears judge them (that is the lab's own wording)."),
 ("Tuning states", f"Every state has an id (<code>T-R2</code>, <code>T-F2e</code> …) listed in the table below. Before the first file of a state, read every lug of both heads and write the row in <code>{LAB_KEY}/tunings.csv</code>. Targets are approximate (±5 Hz; ±10 ¢ between lugs for “even”): write what you got, not the target."),
 ("Sidecar", f"<code>{LAB_KEY}/sidecars.csv</code> uses the v2 columns plus six extra columns at the end: <code>tuning_id, stroke, lug, strainer, damping, front_head</code>. Use “n/a” where a column does not apply."),
 ("Processing", "<strong>NONE</strong>, as v2. No alignment of the close and seat files (the ≈ 2 ms offset is real), no polarity changes, no trimming of the attack."),
 ("Photos", "A photo of every damping placement (DRM-05, DRM-09.2), each strainer setting (DRM-07), each front-head state (DRM-06) and the seat-mic position, in <code>photos/DRM-xx/</code>."),
]
spec_table = "<table class='specs big'><tbody>" + "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in spec_rows) + "</tbody></table>"
sidecar_cols = "filename,item_id,take,date,engineer,performer,source,mic_model,mic_pattern,distance_cm,angle_deg,height_cm,preamp_model,preamp_gain_db,pad_db,phantom,converter,room,rt60_s,noise_floor_dbfs,set_type,notes,tuning_id,stroke,lug,strainer,damping,front_head"
sidecar_ex = f"{LAB_KEY}/drm01-rack-mid-hard-close.wav,DRM-01,2,2026-10-20,J. Engineer,Drummer A,12x8 rack tom,Shure SM57,cardioid,4,40,n/a,API 512c,28,0,off,RME ADI-2,Studio B,0.4,-66,FIXED-GAIN,5A hickory wood tip,T-R2,hard,n/a,n/a,none,n/a"
sidecar_ex2 = f"{LAB_KEY}/drm03-floor-even-lug03-tap.wav,DRM-03,1,2026-10-20,J. Engineer,Drummer A,16x16 floor tom,Shure SM57,cardioid,4,40,n/a,API 512c,46,0,off,RME ADI-2,Studio B,0.4,-66,FIXED-GAIN,TAP gain,T-F2,tap,3,n/a,none,n/a"
folder_tree = f"APE_RECORDINGS_2026-10/          (the v2 delivery; this folder is added to it)\n  manifest.csv                   (add one row per DRM file)\n  photos/DRM-05/ … DRM-07/ …     (damping, strainer, front-head and seat-mic photos)\n  {LAB_KEY}/\n    sidecars.csv                 (v2 columns + tuning_id, stroke, lug, strainer, damping, front_head)\n    tunings.csv                  (one row per tuning state, every lug of both heads)\n    drm00-… drm09-….wav          ({REQ} files)"

SHOTS8 = [
 "<strong>Q — quiet first (30 min):</strong> HVAC as it will stay. Seat omni placed and taped; DRM-00.1 room tone (both mics). Drummer rehearses the three strokes to a level meter until SOFT/MED/HARD repeat within ±2 dB. Start the tunings.csv sheet; put the device, keys, gel, felt, pillows, spare heads, washers and oil on the tuning station.",
 "<strong>F — floor tom (≈ 90 min).</strong> Close dyn to the floor tom; set STRIKE and TAP gains. <strong>T-F1 LOW:</strong> DRM-01 soft/med/hard. <strong>T-F2 MID:</strong> DRM-01 soft/med/hard; even tap round (DRM-03.19–26); make T-F2e → DRM-02.6 strike, uneven tap round (DRM-03.27–34); even by device; RESO ↑ (T-F2f) DRM-04.5, RESO ↓ (T-F2g) DRM-04.6, resonant back to equal; gel DRM-05.3; pillow DRM-05.4 (choked), pillow out. <strong>T-F3 HIGH:</strong> DRM-01 soft/med/hard. Leave the floor tom at HIGH.",
 "<strong>R — rack tom (≈ 150 min).</strong> Close dyn to the rack tom (the floor mic stays up for the fills); gains. <strong>T-R1 LOW:</strong> DRM-01 ×3; pair fill TOO CLOSE DRM-08.2. <strong>T-R2 MID:</strong> DRM-01 ×3; even tap round (DRM-03.1–6); rod-1 series DRM-02.1 (−¼) → DRM-02.2 (−½) + tap round DRM-03.7–12 → even → DRM-02.3 (+¼) → DRM-02.4 (+½) → even; T-R2e DRM-02.5 + tap round DRM-03.13–18 → even; gel DRM-05.1, felt DRM-05.2; RESO ↑ DRM-04.1–2, RESO ↓ DRM-04.3–4, resonant back to equal; <em>drift</em>: washer off rod 2, oil, back to reading → DRM-09.3 (24 strokes) → read T-R2h → after-taps DRM-09.4–9 → washer back, even by device; pair fill DISTINCT DRM-08.1. <strong>T-R3 HIGH:</strong> DRM-01 ×3; RESO ↑ DRM-09.1 → equal; gel DRM-09.2; pair fill UNBALANCED DRM-08.3.",
 "<strong>S — snare (≈ 90 min; plugs in).</strong> Close dyn to the snare; gains; strainer medium, snare-side MID. <strong>T-S1 LOW:</strong> DRM-01 ×3. <strong>T-S2 MID:</strong> DRM-01 ×3; even tap round DRM-03.35–44; T-S2e DRM-02.7 + tap round DRM-03.45–54 → even; strainer OFF DRM-07.1–3 → TIGHT DRM-07.4–6 → medium; snare-side LOOSE (T-S2l) DRM-07.7–8 → TIGHT (T-S2t) DRM-07.9–10 → MID. <strong>T-S3 HIGH:</strong> DRM-01 ×3.",
 "<strong>K — bass drum, loudest last (≈ 90 min; plugs in).</strong> OUT mic 20 cm in front, taped; ported front head on. <strong>T-K1 LOW:</strong> DRM-01 ×3. <strong>T-K2 MID:</strong> DRM-01 ×3; small pillow DRM-05.5, full pillow DRM-05.6, pillow out; front head OFF DRM-06.1–2; unported head on, to the logged readings (T-K2c) DRM-06.3–4; ported head back on to T-K2 readings (the day's one deliberate re-tune). <strong>T-K3 HIGH:</strong> DRM-01 ×3.",
 "<strong>Wrap:</strong> every tunings.csv row complete; sidecars; photos sorted by item; manifest rows; the drummer's and tech's releases signed.",
]
session_html = f'''<section class="session" id="session-{SESSION}"><h3>Session {SESSION} — Drum tuning day</h3>
<table class="specs"><tbody><tr><th>Time</th><td>One full day (≈ 7½ h with breaks). Tuning time dominates; the strikes themselves are quick.</td></tr>
<tr><th>Room</th><td>A quiet, fairly dry room: RT60 ≤ 0.5 s, noise floor ≤ −60 dBFS at the seat mic at working gain. Stable temperature (log it; heads drift with it). If Session 3's studio is used, do this on a day when the MIX-01 kit is not set up, or on a second kit — the MIX-01 tuning must not be disturbed.</td></tr>
<tr><th>People</th><td>Engineer; a drummer who can repeat three stroke heights consistently (a tech who tunes well can be the same person); ideally a second pair of hands for the tuning log.</td></tr>
<tr><th>Kit</th><td>The four drums the lab models: <strong>14" × 5.5" snare (10 lugs)</strong>, <strong>12" × 8" rack tom (6 lugs)</strong>, <strong>16" × 16" floor tom (8 lugs)</strong>, <strong>22" × 16" bass drum (8 lugs)</strong>. Fresh, seated heads fitted the day before (coated single-ply batters; clear single-ply resonants; a 3-mil snare-side head); TWO front heads for the bass drum, one with a factory port and one without. Hoops round, bearing edges clean, every lug with its washer (one washer comes off for DRM-09.3 and goes back). Snare wires in good order. Lug locks / nylon inserts OFF the rack tom for the drift take.</td></tr>
<tr><th>Gear</th><td>Interface/recorder 48 kHz / 24-bit with four inputs; true pressure omni (seat); two SM57-class dynamics; LDC or large dynamic for kick OUT; a lug-reading drum tuner that reads Hz (plus its fundamental mode); drum keys (two); light oil; spare washers; gel pads; a 3 cm felt strip and tape; a small pillow and a full pillow; a click source to an earpiece; SPL meter; tape measure; camera; ear plugs for everyone; the tunings.csv sheet on a clipboard.</td></tr>
<tr><th>Items covered</th><td class="idlinks">{" ".join(f'<a href="#{aid(it["id"])}">{it["id"]}</a>' for it in ITEMS)}</td></tr></tbody></table>
<h4>Floor plan</h4>{fig("Session 8 floor plan", svg_plan8(), "One kit, the seat omni beside the drummer, close dynamics, kick OUT, the tuning station and the engineer's table.", "Session 8", "s8-plan")}
<h4>Input list / track sheet</h4>{tablefig("Session 8 input list / track sheet", input_table8(), "Four inputs all day. Gain marks are per drum: tape and log them; the TAP gain is a second mark on the close channel.", "Session 8", "s8-inputs")}
<h4>Tuning states to log</h4>{tablefig("Session 8 tuning states", tunings_table(), f"Every id here must have a row in <code>{LAB_KEY}/tunings.csv</code>. The ladder runs LOW → MID → HIGH by tightening only; variants branch off MID and return to it by the device.", "Session 8", "s8-tunings")}
<h4>Ordered shot list</h4>{ol(SHOTS8)}
<h4>Run order</h4>{fig("Session 8 run order", D.svg_timeline(SESSION, TIMELINE, "Session 8 run order: quietest drum first, the snare and bass drum last"), "One block per drum; inside a block the drum only ever gets tighter. Red marks are mic moves between drums.", "Session 8", "s8-run")}
</section>'''

SAFETY = f'''
<div class="hardrules"><h3>Hard rules for the drum session</h3><ul>
<li><strong>Hearing protection for everyone in the room</strong> during snare and bass-drum strokes — the drummer included. A close snare or kick peaks above 120 dB SPL at the player. Toms are quieter but the HARD stroke still warrants plugs.</li>
<li><strong>Drum key and fingers only.</strong> Never a wrench, pliers or a powered key on a tension rod. If a rod binds, stop and look.</li>
<li><strong>A head has a working range.</strong> When the pitch stops rising as you turn, STOP — the collar can split, the hoop go out of round, a lug insert strip. The HIGH targets are aims, not orders; log where the drum actually stopped.</li>
<li><strong>Small, opposing moves.</strong> Half a turn at a time in the star order up to tension, then eighths. The biggest single-rod move in this brief is half a turn (DRM-02).</li>
<li><strong>The thin heads.</strong> The snare-side head (2–3 mil) and the resonant heads are the ones that split: smaller steps, and never past the point where pitch stops rising.</li>
<li><strong>Hardware.</strong> Support the bass-drum hoop while rods are out. Refit the washer after the drift take. Do not cut a port in a head on site — use two front heads.</li>
<li><strong>Nothing faked.</strong> If a symptom does not appear (the drift, a choke), deliver what happened and say so. A staged demonstration is allowed only where this brief says so, labelled STAGED in the sidecar.</li>
</ul></div>
<div class="safe"><h4>Levels at the ear</h4><ul><li>Measure the HARD snare and kick strokes at the seat position with an SPL meter once and log them; expect 110–125 dB peak.</li><li>Keep sessions on the snare and kick short; take the plugs out between blocks, not between takes.</li></ul></div>
<div class="safe"><h4>Equipment care</h4><ul><li>Seat new heads the day before (press the centre, bring up evenly, let them settle) so the ladder is not fighting a stretching head.</li><li>Keep the kit out of sun and draughts; log the room temperature on each tuning row.</li><li>Tape the stands, not the heads. Nothing sticks to a head except the gel pads and felt strip that a card asks for.</li></ul></div>
'''

CHECK_GLOBAL = [
 "Every DRM file is 48 kHz / 24-bit mono WAV PCM (check in an inspector).",
 "Sample peaks: HARD strokes ≈ −6 dBFS and never above −3 dBFS; no clipping anywhere (listen to every HARD snare and kick file on headphones).",
 "No processing, no normalizing, no alignment of close and seat files, no polarity changes.",
 "Every strike file keeps its full decay plus 0.5 s room tone; fades 5–10 ms at zero crossings; nothing cut at the attack.",
 "FIXED-GAIN: one STRIKE gain per drum per mic and one TAP gain per drum, taped, logged, identical across every file that shares it.",
 f"<code>{LAB_KEY}/tunings.csv</code>: one row per tuning state in the Session 8 table ({len(TUNINGS)} rows), every lug of both heads filled, device model and mode named.",
 f"<code>{LAB_KEY}/sidecars.csv</code>: one row per delivered file with the six extra columns filled (tuning_id, stroke, lug, strainer, damping, front_head).",
 "Manifest rows added for every DRM file, measured from the delivered files.",
 "Photos for every damping placement, strainer setting, front-head state and the seat-mic position, named by item ID.",
 "Filenames exactly as listed (lowercase, hyphens, two-digit lug numbers, folder = drum_tuning).",
 "Releases signed by the drummer and anyone else heard; a statement that nothing comes from a sample library.",
]
CHECK_FILE = ["Open it and listen end to end on headphones.", "Correct drum, tuning state, stroke, lug and mic position — against the sidecar row.", "Starts clean (no slate left in), ends with the full decay and room tone.", "Level within the item's targets.", "Ticked in this document's file table."]

OPEN_Q = [
 "<strong>Seat mic for taps.</strong> This add-on delivers lug taps from the close mic only (the lab's taps are a tuning tool, not a listening test). If the owner wants taps from the seat too, the tap rounds double (+54 files).",
 "<strong>Bass-drum lug taps.</strong> None are asked for: no lab page taps the kick. Say if Chapter 5's bass-drum page should get a tap round (+8 files per state).",
 "<strong>The drift take.</strong> DRM-09.3 relies on a washer-less, lightly oiled rod walking out over 24 strokes. If it does not, the brief allows a clearly labelled STAGED after-tap round. The owner should confirm that a staged demonstration is acceptable in the lab, or that the case should fall back to the model.",
 "<strong>Snare-side head targets</strong> (+100 / +500 / +900 ¢ above the batter's lug reading) are a proposal matched to the lab's BOTTOM fader (−200 … +900 ¢). The engineer may find +900 ¢ unreachable on a given head; the brief says stop and log.",
 "<strong>Which drums.</strong> The sizes and lug counts are the lab's model drums (14×5.5/10, 12×8/6, 16×16/8, 22×16/8). A 12\" tom with 6 lugs is common but not universal; if the available tom has 8 lugs, record all 8 and say so — the lab's lug count for that chapter would then need to follow the recording.",
 "<strong>Stroke percentages.</strong> SOFT/MED/HARD are mapped to the lab's fader at about 30 / 60 / 100 %. The app will interpolate between them; the owner may prefer four strokes (adding a 45 % point) on the rack tom only.",
 "<strong>Pair fills at HIGH floor tom.</strong> To avoid retuning, all three DRM-08 fills use the floor tom at HIGH (125 Hz) and move only the rack tom. The lab's own default pairing is rack MID + floor MID, which the engine calls wide; the recorded DISTINCT pair (rack MID + floor HIGH, 4.8 st) is what the lab will show as the good interval. Confirm.",
 f"<strong>Bucket folder.</strong> <code>{LAB_KEY}</code> is a proposal; it does not exist in the <code>lab-audio</code> bucket yet (only bass_fretboard, demo_signals, mixing_lab and critical_listening do).",
 "<strong>Not covered on purpose:</strong> Chapter 2's visual faults (worn head, debris, loose lug casing) are inspection tasks in the lab; recording a grit buzz would mean putting grit on a bearing edge. Chapter 1's bearing-edge page compares edge profiles — that needs two shells, not two tunings, and is not asked for.",
]

index_rows = "".join(f'<tr data-pri="{it["pri"]}"><td><a href="#{aid(it["id"])}">{it["id"]}</a></td><td>{it["title"]}</td><td>{badge(it["pri"])}</td><td class="num">{len(it["recs"])}</td><td class="num">{nfiles_c(counted_files(all_files(it)))}</td><td>{it["usedin"].split(" (")[0]}</td></tr>' for it in ITEMS)

toc_ids = " ".join(f'<a href="#{aid(it["id"])}" class="p-{it["pri"].lower()}">{it["id"]}</a>' for it in ITEMS)
def toc_recs():
    rows = "".join(f'<div class="tocrrow"><a href="#{aid(it["id"])}" class="tocri">{it["id"]}</a> ' + " ".join(f'<a href="#{rid_anchor(r)}">{r["rid"]}</a>' for r in it["recs"]) + "</div>" for it in ITEMS)
    return f'<details class="tocrecs"><summary>{N_RECS} recordings</summary>{rows}</details>'
TOC = f'''<nav class="toc" aria-label="Contents"><details class="tocd" id="tocd" open><summary class="toch">Contents</summary><ol class="tocmain">
<li><a href="#front">A · About this add-on</a></li><li><a href="#diagrams">Diagrams</a>@@DIAGTOC@@</li><li><a href="#spec">B · What is different for drum files</a></li><li><a href="#method">C · The kit, the strokes, the mics</a></li>
<li><a href="#items">D · Recording items</a><ol class="tocsub"><li><a href="#lab-drum-tuning-lab">{G_}</a><div class="tocids">{toc_ids}</div>{toc_recs()}</li></ol></li>
<li><a href="#sessions">E · Session 8</a></li><li><a href="#safety">F · Safety</a></li><li><a href="#checklists">G · Delivery and QC checklists</a></li><li><a href="#appendix">H · Appendix</a></li></ol></details></nav>'''

METHOD = (fig(*FIGDEF["tommics"][:2], FIGDEF["tommics"][2], "C · Method", "method-tommics")
          + "<p>The lab's own instruction to the learner is “play it from the playing position and listen from the seat; the lug taps tell you about evenness, the stroke tells you about the sound.” That is why there are two mic positions and why taps come from the close mic only. The close mic is the sound an engineer knows; the seat mic is the sound the drummer tunes to.</p>"
          + fig(*FIGDEF["strokes"][:2], FIGDEF["strokes"][2], "C · Method", "method-strokes")
          + "<p>Three strokes, named and repeatable. The lab's STRIKE / STROKE / BEATER faders run from a light tap to a full hit; the app will play SOFT below about 45 %, MED to about 80 % and HARD above, and interpolate levels between them. Consistency matters more than the exact heights: rehearse until the three repeat within ±2 dB on the meter before the first take.</p>"
          + fig(*FIGDEF["lugmap"][:2], FIGDEF["lugmap"][2], "C · Method", "method-lugmap")
          + "<p>Lug 1 is the lug farthest from the drummer; the lab numbers its rods the same way (rod 1 at 12 o'clock, clockwise). Tap a finger's width inside the hoop in front of the lug, the same distance every time, nothing touching either head. Tighten and loosen in the star order shown, half a turn at a time up to tension and eighths when evening.</p>"
          + fig(*FIGDEF["rel"][:2], FIGDEF["rel"][2], "C · Method", "method-rel")
          + "<p>“Resonant 3 semitones above” means every resonant lug reads 1.19 × the batter's lug reading on the device; “below” means ÷ 1.19. The batter is never touched when the relationship changes, so the batter files of one tuning state stay comparable.</p>")

html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only light">
<title>AP&amp;E Recording Brief — Add-on 1: Drum Tuning</title><meta name="description" content="Add-on to the AP&amp;E Studio recording brief v2: the drum-tuning recordings the Drum Tuning Lab needs — every distinct strike and lug tap, the tuning log, Session 8, safety and QC.">
<style>{CSS}</style></head><body>
<div class="layout">{TOC}
<main><div class="wrap">
<header class="top" id="front"><h1>AP&amp;E Studio — Recording Brief · Add-on 1: Drum Tuning Lab</h1>
<div class="docmeta"><span>Date: {DATE}</span><span>Adds to: Recording Brief v2 ({DATE})</span><span>New ID prefix: <code>DRM-</code> · new folder: <code>{LAB_KEY}/</code> · new session: 8</span><span>Production contact: AP&amp;E Studio</span><span>Audience: recording engineer</span></div></header>

<h2>A · About this add-on</h2>
<h3>What this is for</h3>
<p>The Drum Tuning Lab is a new, seven-chapter lab in AP&amp;E Studio. The learner names the parts of a drum, hears what tension does to pitch, turns one rod and hears the warble, taps round a head lug by lug and evens it, compares the three batter/resonant relationships, tunes a snare, the toms and the bass drum toward a stated sound, builds a tom range and diagnoses five symptoms — all on a <em>simulated</em> drum whose every sound is synthesized from a membrane model. The model is honest about being a model (every display says so), but a learner should carry away the sound of a real drum. These recordings put a real snare, rack tom, floor tom and bass drum behind every control the lab has: three tunings per drum, three strokes, even and uneven heads, every lug, the three relationships, damping, the bass drum's front head, the snare's strainer and snare-side head, the tom pair at three intervals, and the five symptom cases.</p>
<p>Two things are new compared with the v2 items. First, every strike is delivered from <strong>two mic positions</strong> — a close mic and a “seat” mic at the drummer's ear — because the lab tells the learner to listen from the playing position. Second, the <strong>tuning log is a deliverable</strong>: for every tuning state the device reading of every lug on both heads goes into <code>{LAB_KEY}/tunings.csv</code>, so the lab can show the real numbers next to the real sound.</p>
<h3>At a glance</h3>{glance}
<h3>How to use this document</h3>{HOWTO}
<h3 id="diagrams">Diagram index</h3><p class="muted">Every drawn figure and table in this add-on. Links open the card or section that holds it.</p>@@DIAGINDEX@@

<h2 id="spec">B · What is different for drum files</h2>
<p>The v2 global spec (48 kHz / 24-bit, no processing, peaks, fades, one-shots with 0.5 s of room tone, FIXED-GAIN sets, sidecars, manifest, rights, delivery) applies in full. These rows add to or sharpen it for the DRM items.</p>{spec_table}
<h3>Sidecar (one <code>sidecars.csv</code> in <code>{LAB_KEY}/</code>) — v2 columns plus six</h3>
<pre>{sidecar_cols}
{sidecar_ex}
{sidecar_ex2}</pre>
<h3>Tuning log (<code>{LAB_KEY}/tunings.csv</code>) — one row per tuning state</h3>
<pre>{TUN_COLS}
{TUN_EX}</pre>
<p class="muted">Lug columns beyond the drum's lug count stay empty. <code>device_mode</code> is “lug pitch” for the lug columns; put the fundamental-mode reading of the whole drum (centre strike) in <code>drum_fundamental_hz</code>. If a dial gauge is used instead, <code>units</code> says so and every reading is in its units.</p>
<h3>File naming</h3>
<ul><li>As v2: lowercase, hyphens, <code>{LAB_KEY}/drm&lt;nn&gt;-&lt;drum&gt;-&lt;state&gt;-&lt;stroke&gt;-&lt;mic&gt;.wav</code>, e.g. <code>{LAB_KEY}/drm01-rack-mid-hard-close.wav</code>, <code>{LAB_KEY}/drm01-rack-mid-hard-seat.wav</code>.</li>
<li>Lug taps: <code>drm03-floor-even-lug03-tap.wav</code> — two-digit lug number, suffix <code>tap</code>, close mic only.</li>
<li>Pair fills: <code>drm08-pair-distinct-rackclose.wav</code>, <code>-floorclose</code>, <code>-seat</code>.</li>
<li>Use the exact filename in each item's table. The folder is the lab key (the proposed storage bucket folder).</li></ul>
<h3>Delivery folder structure</h3><pre>{folder_tree}</pre>

<h2 id="method">C · The kit, the strokes, the mics</h2>{METHOD}

<h2 id="items">D · Recording items ({N_ITEMS} cards, {N_RECS} recordings, {REQ} files)</h2>
<div class="controls hidden noprint" id="controls" role="search">
<input type="search" id="q" placeholder="Search items, recordings, filenames, tuning states…" aria-label="Search items">
<label><input type="checkbox" class="fp" value="P1" checked> P1</label><label><input type="checkbox" class="fp" value="P2" checked> P2</label><label><input type="checkbox" class="fp" value="P3" checked> P3</label>
<label>Session <select id="fs" aria-label="Filter by session"><option value="">All</option><option value="{SESSION}">{SESSION}</option></select></label>
<button type="button" id="xall">Expand all</button><button type="button" id="call">Collapse all</button><button type="button" id="clr">Clear</button>
<span class="progress" id="fcount"></span><span class="progress" id="prog"></span></div>
{items_html}

<h2 id="sessions">E · Session 8 — the drum tuning day</h2>
<p>One session, one kit, one day. The shot list is built around tuning states, not items: each drum goes LOW → MID → HIGH by tightening only, and everything that needs a state is recorded while the drum is in it. Variants (a backed-off rod, an uneven head, a changed resonant head) branch off MID and return to it by the device.</p>
{session_html}

<h2 id="safety">F · Safety</h2>{SAFETY}

<h2 id="checklists">G · Delivery and QC checklists</h2>
<h3>Global — before you send the drum folder</h3><ul class="qc">{''.join(f'<li><label><input type="checkbox" class="noprint-cb"> {x}</label></li>' for x in CHECK_GLOBAL)}</ul>
<h3>Per file — every file</h3><ul class="qc">{''.join(f'<li>{x}</li>' for x in CHECK_FILE)}</ul>
<h3>Final delivery checklist (add-on)</h3><ul class="qc">
<li><label><input type="checkbox"> All {REQ} DRM files present (tick count in section D), names exactly as listed.</label></li>
<li><label><input type="checkbox"> <code>{LAB_KEY}/tunings.csv</code> complete: {len(TUNINGS)} rows, every lug of both heads.</label></li>
<li><label><input type="checkbox"> <code>{LAB_KEY}/sidecars.csv</code> complete with the six extra columns; <code>manifest.csv</code> extended.</label></li>
<li><label><input type="checkbox"> Photos in <code>photos/DRM-xx/</code> for damping, strainer, front head and the seat mic.</label></li>
<li><label><input type="checkbox"> Logged values present: room temperature per tuning row, SPL at the seat for HARD snare and kick, the seat-to-drum distances, whether the drift was natural or STAGED, where any head stopped short of its target.</label></li>
<li><label><input type="checkbox"> The drummer's release signed; session files and all takes archived on your side.</label></li></ul>

<h2 id="appendix">H · Appendix</h2>
<h3>Open questions for the owner and the engineer</h3><ul>{''.join(f'<li>{x}</li>' for x in OPEN_Q)}</ul>
<h3>Which lab pages each item feeds</h3><div class="tablewrap"><table class="specs"><thead><tr><th>ID</th><th>Title</th><th>P</th><th>Recs</th><th>Files</th><th>Lab pages</th></tr></thead><tbody>{index_rows}</tbody></table></div>
<p class="muted">Totals: {N_ITEMS} items; {N_RECS} distinct recordings; {REQ} files to deliver (all new recordings). Where a lab state is already covered by another DRM file, the card's Reuse line says which — nothing is recorded twice.</p>
</div></main></div>
@@SCRIPT@@</body></html>'''

# ---------- figure numbering, index, script, checks
_order = re.findall(r'<figure class="dfig[^"]*" id="([^"]+)"', html)
assert len(_order) == len(set(_order)) == len(FIGS), (len(_order), len(set(_order)), len(FIGS))
_num = {a: i + 1 for i, a in enumerate(_order)}
html = re.sub(r"@@FN:([^@]+)@@", lambda m: str(_num[m.group(1)]), html)
_meta = {a: (l, w) for a, l, w in FIGS}
_groups = []
for a in _order:
    w = _meta[a][1]
    sec = "Section C · method" if w.startswith("C") else "Section E · Session 8" if w.startswith("Session") else "Section D · item cards"
    if not _groups or _groups[-1][0] != sec:
        _groups.append((sec, []))
    _groups[-1][1].append(a)
def _li(a):
    l, w = _meta[a]
    return f'<li><a href="#{a}">Fig. {_num[a]} — {l}</a> <span class="muted">({w.replace("card ", "")})</span></li>'
DIAGINDEX = "<div class='figindex'>" + "".join(f"<h4>{g}</h4><ul>" + "".join(_li(a) for a in al) + "</ul>" for g, al in _groups) + "</div>"
DIAGTOC = f'<details class="tocfigs"><summary>{len(_order)} figures</summary><ol>' + "".join(f'<li><a href="#{a}">{_num[a]}. {_meta[a][0]}</a></li>' for a in _order) + "</ol></details>"
html = html.replace("@@DIAGINDEX@@", DIAGINDEX).replace("@@DIAGTOC@@", DIAGTOC)
html = amp(html).replace("@@SCRIPT@@", "<script>" + JS.replace("@@REQ@@", str(REQ)).replace("@@OPT@@", str(tot["opt"])).replace("ape-recbrief-ticks-v2", "ape-recbrief-ticks-drm1") + "</script>")
_ids = re.findall(r'\sid="([^"]+)"', html)
_dupids = [i for i, c in collections.Counter(_ids).items() if c > 1]
assert not _dupids, ("duplicate ids", _dupids)
_idset = set(_ids)
def _unlink(m):
    if m.group(1) in _idset:
        return m.group(0)
    warn("broken internal link unlinked:", m.group(1))
    return m.group(2)
html = re.sub(r'<a href="#([^"]+)"[^>]*>(.*?)</a>', _unlink, html)
assert "color-scheme: only light" in html.replace("color-scheme:only light", "color-scheme: only light")
assert "#000" not in CSS and "background:#1" not in CSS
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8", newline="\n").write(html)
print("OUT", OUT)
print("items", N_ITEMS, "recs", N_RECS, "files", REQ, "reuse rows", tot["reuse"], "opt", tot["opt"], "figures", len(_order), "tuning states", len(TUNINGS))
print("per drum", dict(PER_DRUM))
print("bytes", len(html.encode("utf-8")))
for w in WARN:
    print("WARN", w)
