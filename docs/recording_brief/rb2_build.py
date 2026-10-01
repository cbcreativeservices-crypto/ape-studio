# -*- coding: utf-8 -*-
import re, sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
FAKE = os.environ.get("RB_FAKE") == "1"
if FAKE:
    from rb2_fake import ITEMS
else:
    from rb2_items1 import ITEMS
    import rb2_items2, rb2_items3  # noqa: register items

OUT = os.environ.get("RB_OUT") or r"C:\Users\profe\Downloads\2026-10-01_APE_RECORDING_ENGINEER_BRIEF_v2.html"
if FAKE:
    OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fake.html")

WARN = []
def warn(*a):
    WARN.append(" ".join(str(x) for x in a))

def amp(s):
    return re.sub(r"&(?!(amp|lt|gt|quot|nbsp|#\d+|[a-zA-Z]+);)", "&amp;", s)

def aid(i):
    return "item-" + i.lower()

def rid_anchor(r):
    return re.sub(r"\s+", "-", r["rid"].strip())

IDS = {it["id"] for it in ITEMS}
assert len(IDS) == len(ITEMS), [i for i, c in collections.Counter(it["id"] for it in ITEMS).items() if c > 1]
for it in ITEMS:
    it.setdefault("status", "new")
    it.setdefault("see", [])
    it.setdefault("usedin", "")
    it.setdefault("safety", [])
    it.setdefault("reuse", "")
    it.setdefault("recs", [])
    if not it["recs"]:
        warn("item has no recs:", it["id"])
    for r in it["recs"]:
        for k, d in (("files", []), ("context", ""), ("teaches", ""), ("record", ""), ("how", []), ("tips", []), ("specs", {}), ("qc", []), ("safety", [])):
            r.setdefault(k, d)
        for f in r["files"]:
            assert len(f) == 5 and f[4] in ("rec", "edit", "reuse", "opt", "hold"), (r["rid"], f)
    it["see"] = [s for s in it["see"] if s in IDS or warn("see-also to unknown id dropped:", it["id"], "->", s)]
RIDS = [r["rid"] for it in ITEMS for r in it["recs"]]
_d = [r for r, c in collections.Counter(RIDS).items() if c > 1]
assert not _d, ("duplicate rids", _d)

# ---------- counts
def all_files(it):
    # files of every rec; item-level files only for a legacy item with no recs
    fs = [f for r in it["recs"] for f in r["files"]]
    if not it["recs"]:
        fs = list(it.get("files", []))
    return fs

def counted_files(files, status):
    c = collections.Counter()
    for f in files:
        k = f[4]
        if status == "hold" or k == "hold":
            c["hold"] += 1
        else:
            c[k] += 1
    return c

def counted(it):
    return counted_files(all_files(it), it["status"])

tot = collections.Counter()
for it in ITEMS:
    tot += counted(it)
N_ITEMS = len(ITEMS)
N_RECS = len(RIDS)
N_RECS_ACTIVE = sum(len(it["recs"]) for it in ITEMS if it["status"] not in ("hold", "reuse"))
st = collections.Counter(it["status"] for it in ITEMS)
pri = collections.Counter(it["pri"] for it in ITEMS)
pri_active = collections.Counter(it["pri"] for it in ITEMS if it["status"] not in ("hold",))
REQ = tot["rec"] + tot["edit"]
names = [f[0] for it in ITEMS if it["status"] != "hold" for f in all_files(it) if f[4] in ("rec", "edit", "opt")]
dups = [n for n, c in collections.Counter(names).items() if c > 1]
if dups:
    warn("duplicate deliverable filenames:", dups)

# ---------- svgs
SVG_POLAR = '''<svg viewBox="0 0 520 330" role="img" aria-labelledby="svgp-t svgp-d" class="diagram"><title id="svgp-t">MPR-01 rotation rig, top view</title><desc id="svgp-d">The talker sits fixed with the head on a marker. The mic is 30 cm away on a floor protractor centred under its capsule and is rotated, not the talker, to 0, 30, 60, 90, 110, 127 and 180 degrees. A fixed reference mic stays on-axis.</desc>
<rect x="1" y="1" width="518" height="328" rx="10" fill="#fbfaf7" stroke="#d9d4c7"/>
<circle cx="300" cy="165" r="110" fill="none" stroke="#c9c2b2" stroke-dasharray="4 4"/>
<g font-size="12" fill="#3d3a33" text-anchor="middle">
<line x1="300" y1="165" x2="190" y2="165" stroke="#b42318" stroke-width="2"/><text x="170" y="160">0°</text>
<line x1="300" y1="165" x2="204.7" y2="110" stroke="#9a9384"/><text x="190" y="100">30°</text>
<line x1="300" y1="165" x2="245" y2="69.7" stroke="#9a9384"/><text x="238" y="58">60°</text>
<line x1="300" y1="165" x2="300" y2="55" stroke="#9a9384"/><text x="300" y="46">90°</text>
<line x1="300" y1="165" x2="337.6" y2="61.6" stroke="#9a9384"/><text x="343" y="54" text-anchor="start">110° hyper null</text>
<line x1="300" y1="165" x2="366.2" y2="77.2" stroke="#9a9384"/><text x="372" y="80" text-anchor="start">127° super null</text>
<line x1="300" y1="165" x2="410" y2="165" stroke="#9a9384"/><text x="440" y="160">180°</text></g>
<circle cx="90" cy="165" r="26" fill="#efe9dc" stroke="#7a705c"/><text x="90" y="169" font-size="12" text-anchor="middle" fill="#3d3a33">talker</text>
<text x="90" y="210" font-size="11" text-anchor="middle" fill="#5d574b">head fixed</text>
<rect x="288" y="153" width="24" height="24" rx="5" fill="#1f4e79"/><text x="300" y="200" font-size="12" text-anchor="middle" fill="#1f4e79">mic (rotates)</text>
<path d="M330 200 A50 50 0 0 0 330 130" fill="none" stroke="#1f4e79" stroke-width="2" marker-end="url(#ah)"/>
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1f4e79"/></marker></defs>
<line x1="118" y1="165" x2="288" y2="165" stroke="#3d3a33" stroke-dasharray="2 3"/><text x="200" y="182" font-size="11" text-anchor="middle" fill="#5d574b">30 cm, mouth height</text>
<rect x="130" y="230" width="18" height="18" rx="4" fill="#7a705c"/><text x="185" y="262" font-size="11" text-anchor="middle" fill="#5d574b">fixed reference mic (not delivered)</text>
<text x="300" y="312" font-size="11" text-anchor="middle" fill="#5d574b">Floor protractor centred under the capsule (plumb line). Rotate the mic; never the talker.</text></svg>'''

SVG_STEREO = '''<svg viewBox="0 0 600 400" role="img" aria-labelledby="svgs-t svgs-d" class="diagram"><title id="svgs-t">MPR-07 four stereo arrays, top view</title><desc id="svgs-d">Top: the performance line 2 m in front of the arrays, with the shaker on the left, the guitar in the centre and a talker walking left to right. All arrays and a mono spot sit together on the centre line. Bottom: each array's geometry. XY: two cardioids at one point, 90 degrees apart. ORTF: two cardioids 17 cm apart, 110 degrees apart. AB: two omnis 60 cm apart, both facing forward. M/S: a forward cardioid and a sideways figure-8 at one point, positive lobe to the left.</desc>
<rect x="1" y="1" width="598" height="398" rx="10" fill="#fbfaf7" stroke="#d9d4c7"/>
<defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b42318"/></marker><marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1f4e79"/></marker></defs>
<g font-size="12" fill="#3d3a33" text-anchor="middle">
<circle cx="170" cy="52" r="15" fill="#fef0c7" stroke="#b54708"/><text x="170" y="30">shaker (left)</text>
<circle cx="300" cy="52" r="17" fill="#e3ecf6" stroke="#1f4e79"/><text x="300" y="28">guitar (centre)</text>
<path d="M120 88 L480 88" stroke="#b42318" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ah2)"/><text x="300" y="106" fill="#b42318">talker walks left → right speaking S1</text>
<line x1="300" y1="114" x2="300" y2="158" stroke="#9a9384" stroke-dasharray="3 3"/><text x="318" y="140" text-anchor="start" fill="#5d574b">2 m</text>
<circle cx="300" cy="166" r="7" fill="#1f4e79"/><text x="300" y="190" fill="#1f4e79">all arrays + mono spot together on the centre line, 1.5 m high</text>
<line x1="12" y1="204" x2="588" y2="204" stroke="#e2ddd1"/>
<text x="300" y="222" font-size="11" fill="#5d574b">Array geometry (drawn apart for clarity; each faces the performance, i.e. up)</text></g>
<g font-size="11" fill="#3d3a33" text-anchor="middle">
<rect x="14" y="232" width="134" height="152" rx="8" fill="#fff" stroke="#e2ddd1"/>
<g stroke="#1f4e79" stroke-width="3" marker-end="url(#ah3)"><line x1="81" y1="320" x2="56" y2="295"/><line x1="81" y1="320" x2="106" y2="295"/></g><circle cx="81" cy="320" r="4" fill="#1f4e79"/>
<text x="81" y="346" font-weight="700">XY</text><text x="81" y="360">cardioids</text><text x="81" y="368" dy="4">90° · one point</text>
<rect x="158" y="232" width="134" height="152" rx="8" fill="#fff" stroke="#e2ddd1"/>
<g stroke="#1f4e79" stroke-width="3" marker-end="url(#ah3)"><line x1="205" y1="320" x2="176" y2="300"/><line x1="245" y1="320" x2="274" y2="300"/></g><circle cx="205" cy="320" r="4" fill="#1f4e79"/><circle cx="245" cy="320" r="4" fill="#1f4e79"/>
<line x1="205" y1="330" x2="245" y2="330" stroke="#3d3a33"/><text x="225" y="326" font-size="9">17 cm</text>
<text x="225" y="346" font-weight="700">ORTF</text><text x="225" y="360">cardioids</text><text x="225" y="368" dy="4">17 cm · 110°</text>
<rect x="302" y="232" width="134" height="152" rx="8" fill="#fff" stroke="#e2ddd1"/>
<g stroke="#1f4e79" stroke-width="3" marker-end="url(#ah3)"><line x1="329" y1="314" x2="329" y2="284"/><line x1="409" y1="314" x2="409" y2="284"/></g>
<circle cx="329" cy="318" r="7" fill="#fff" stroke="#3d3a33" stroke-width="2"/><circle cx="409" cy="318" r="7" fill="#fff" stroke="#3d3a33" stroke-width="2"/>
<line x1="329" y1="332" x2="409" y2="332" stroke="#3d3a33"/><text x="369" y="328" font-size="9">60 cm</text>
<text x="369" y="346" font-weight="700">AB</text><text x="369" y="360">omnis, both forward</text><text x="369" y="368" dy="4">60 cm apart</text>
<rect x="446" y="232" width="140" height="152" rx="8" fill="#fff" stroke="#e2ddd1"/>
<g stroke="#1f4e79" stroke-width="3" marker-end="url(#ah3)"><line x1="516" y1="318" x2="516" y2="282"/></g>
<circle cx="498" cy="318" r="12" fill="#e3ecf6" stroke="#1f4e79"/><circle cx="534" cy="318" r="12" fill="#fef0c7" stroke="#b54708"/><text x="498" y="322" font-size="13" font-weight="700">+</text><text x="534" y="322" font-size="13" font-weight="700">−</text>
<text x="516" y="348" font-weight="700">M/S</text><text x="516" y="360">cardioid forward +</text><text x="516" y="368" dy="4">fig-8 sideways, + LEFT</text></g></svg>'''

SVG_TABLE = '''<svg viewBox="0 0 520 300" role="img" aria-labelledby="svgt-t svgt-d" class="diagram"><title id="svgt-t">WAV-03 table comb setup, side view</title><desc id="svgt-d">A small speaker at seated mouth height, 35 cm above a hard table, 1 m from the mic position. The omni mic is placed 2, 6, 12 and 24 inches above the table. Direct sound and a table reflection reach the mic. A boundary mic lies flat on the table.</desc>
<rect x="1" y="1" width="518" height="298" rx="10" fill="#fbfaf7" stroke="#d9d4c7"/>
<rect x="40" y="220" width="440" height="14" fill="#c8a97e" stroke="#8a6d45"/><text x="200" y="252" font-size="12" text-anchor="middle" fill="#5d574b">hard table top</text>
<rect x="60" y="150" width="34" height="46" rx="4" fill="#3d3a33"/><circle cx="77" cy="173" r="10" fill="#9a9384"/><text x="77" y="140" font-size="12" text-anchor="middle" fill="#3d3a33">speaker (S1, pink)</text>
<line x1="77" y1="196" x2="77" y2="220" stroke="#3d3a33"/>
<g font-size="11" fill="#1f4e79"><circle cx="400" cy="210" r="5" fill="#1f4e79"/><text x="412" y="214">2 in</text><circle cx="400" cy="188" r="5" fill="#1f4e79" opacity=".7"/><text x="412" y="192">6 in</text><circle cx="400" cy="160" r="5" fill="#1f4e79" opacity=".55"/><text x="412" y="164">12 in</text><circle cx="400" cy="100" r="5" fill="#1f4e79" opacity=".4"/><text x="412" y="104">24 in</text></g>
<line x1="94" y1="173" x2="395" y2="160" stroke="#1f4e79" stroke-width="2"/><text x="240" y="155" font-size="11" fill="#1f4e79">direct</text>
<polyline points="94,180 250,220 395,162" fill="none" stroke="#b42318" stroke-width="2" stroke-dasharray="5 3"/><text x="260" y="28" font-size="11" text-anchor="middle" fill="#b42318">red dashed = reflection off the table (a delayed copy)</text>
<rect x="383" y="215" width="34" height="5" fill="#b54708"/><text x="400" y="272" font-size="11" text-anchor="middle" fill="#b54708">boundary mic flat on table (same spot)</text>
<line x1="94" y1="120" x2="400" y2="120" stroke="#9a9384" stroke-dasharray="3 3"/><text x="247" y="114" font-size="11" text-anchor="middle" fill="#5d574b">1 m</text>
<text x="260" y="292" font-size="11" text-anchor="middle" fill="#5d574b">Same playback level and gain for every height.</text></svg>'''

SVG_IR = '''<svg viewBox="0 0 520 300" role="img" aria-labelledby="svgi-t svgi-d" class="diagram"><title id="svgi-t">WAV-02 impulse-response positions, plan view</title><desc id="svgi-d">A room plan. The source loudspeaker is at least 1 m from the walls. Position 1 is 4 m from the source. Position 2 is at least 2 m from position 1 and placed off the room's centre line so the two are not symmetrical. Each position has an omni measurement mic and an ORTF pair at 1.2 m height.</desc>
<rect x="1" y="1" width="518" height="298" rx="10" fill="#fbfaf7" stroke="#d9d4c7"/>
<rect x="30" y="30" width="460" height="230" fill="#fff" stroke="#3d3a33" stroke-width="3"/>
<rect x="70" y="95" width="26" height="34" rx="4" fill="#3d3a33"/><text x="83" y="150" font-size="12" text-anchor="middle" fill="#3d3a33">source</text><text x="83" y="165" font-size="10" text-anchor="middle" fill="#5d574b">≥ 1 m from walls</text><line x1="40" y1="145" x2="480" y2="145" stroke="#e2ddd1" stroke-dasharray="8 6"/><text x="470" y="140" font-size="10" text-anchor="end" fill="#9a9384">room centre line</text>
<line x1="96" y1="112" x2="328" y2="112" stroke="#9a9384" stroke-dasharray="4 3"/><text x="213" y="105" font-size="11" text-anchor="middle" fill="#5d574b">4 m</text>
<circle cx="340" cy="112" r="12" fill="#e3ecf6" stroke="#1f4e79" stroke-width="2"/><text x="340" y="88" font-size="12" text-anchor="middle" fill="#1f4e79">position 1</text>
<circle cx="410" cy="205" r="12" fill="#fef0c7" stroke="#b54708" stroke-width="2"/><text x="410" y="235" font-size="12" text-anchor="middle" fill="#b54708">position 2</text>
<line x1="347" y1="122" x2="403" y2="195" stroke="#9a9384" stroke-dasharray="2 3"/><text x="384" y="160" font-size="10" fill="#5d574b">≥ 2 m</text>
<text x="260" y="283" font-size="11" text-anchor="middle" fill="#5d574b">Omni + ORTF at 1.2 m at each position. Not on the room's centre line or symmetric.</text></svg>'''

SVG_FB = '''<svg viewBox="0 0 560 280" role="img" aria-labelledby="svgf-t svgf-d" class="diagram"><title id="svgf-t">SS-01 feedback rig</title><desc id="svgf-d">A vocal mic 1 m in front of a monitor wedge. The mic feeds the console; the wedge send goes through a graphic EQ and a brick-wall limiter to the wedge amp. The recording is taken from the console channel's post-fader direct output to the recorder. A second person keeps a hand on the wedge mute.</desc>
<rect x="1" y="1" width="558" height="278" rx="10" fill="#fbfaf7" stroke="#d9d4c7"/>
<g font-size="12" fill="#3d3a33" text-anchor="middle">
<rect x="40" y="170" width="70" height="40" rx="6" fill="#3d3a33"/><text x="75" y="230">wedge</text>
<circle cx="150" cy="130" r="9" fill="#1f4e79"/><line x1="150" y1="139" x2="150" y2="210" stroke="#1f4e79" stroke-width="3"/><text x="150" y="110">vocal mic</text>
<text x="112" y="160" font-size="10" fill="#5d574b">1 m</text>
<rect x="240" y="40" width="110" height="50" rx="6" fill="#e3ecf6" stroke="#1f4e79"/><text x="295" y="70">console</text>
<rect x="420" y="40" width="110" height="50" rx="6" fill="#efe9dc" stroke="#7a705c"/><text x="475" y="62">recorder</text><text x="475" y="78" font-size="10">line in</text>
<rect x="240" y="150" width="110" height="34" rx="6" fill="#fff" stroke="#7a705c"/><text x="295" y="172">graphic EQ</text>
<rect x="240" y="200" width="110" height="34" rx="6" fill="#fee4e2" stroke="#b42318"/><text x="295" y="222">brick-wall limiter</text>
<rect x="420" y="200" width="110" height="34" rx="6" fill="#fff" stroke="#7a705c"/><text x="475" y="222">wedge amp</text></g>
<g stroke="#3d3a33" fill="none" stroke-width="1.5"><path d="M155 128 L240 70"/><path d="M350 65 L420 65"/><path d="M295 90 L295 150"/><path d="M295 184 L295 200"/><path d="M350 217 L420 217"/><path d="M475 234 L475 262 L75 262 L75 210"/></g>
<text x="385" y="34" font-size="10" fill="#1f4e79" text-anchor="middle">post-fader direct out</text><text x="302" y="125" font-size="10" fill="#5d574b" text-anchor="start">wedge aux send</text>
<text x="20" y="24" font-size="11" fill="#b42318">2nd person: hand on the wedge MUTE — cut any ring within 1 s</text></svg>'''

# ---------- drawn diagrams (rb2_diagrams) and the figure registry
import rb2_diagrams as D

FIGS = []          # (anchor, label, where) — numbered in document order at the end
_FIG_ANCH = set()

def _anchor(slug):
    a = "fig-" + re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-")
    base, k = a, 2
    while a in _FIG_ANCH:
        a = f"{base}-{k}"
        k += 1
    _FIG_ANCH.add(a)
    return a

def fig(label, svg_tpl, caption, where, slug):
    """one <figure>; every call makes a fresh copy of the SVG with its own id prefix"""
    a = _anchor(slug)
    FIGS.append((a, label, where))
    return f'<figure class="dfig" id="{a}">{D.uniq(svg_tpl)}<figcaption><b>Figure @@FN:{a}@@ · {label}.</b> {caption}</figcaption></figure>'

def tablefig(label, table_html, caption, where, slug):
    a = _anchor(slug)
    FIGS.append((a, label, where))
    return f'<figure class="dfig tfig" id="{a}"><figcaption class="top"><b>Figure @@FN:{a}@@ · {label}.</b> {caption}</figcaption>{table_html}</figure>'

FIGDEF = {
 "polar": ("MPR-01 rotation rig", SVG_POLAR, "Top view; rotate the mic about its capsule, never the talker."),
 "stereo": ("MPR-07 four stereo arrays", SVG_STEREO, "One performance, all arrays together on the centre line."),
 "table": ("WAV-03 table comb setup", SVG_TABLE, "Side view; same playback level and gain at every height."),
 "ir": ("WAV-02 impulse-response positions", SVG_IR, "Plan view; two positions per space, never symmetrical."),
 "fb": ("SS-01 feedback rig", SVG_FB, "Recorded from the console's post-fader direct out, never acoustically."),
 "drumtop": ("Drum kit from above", D.svg_drum_top(), "Close mics, overheads and the room pair, with distances from the item text."),
 "drumside": ("Snare and kick, side views", D.svg_drum_side(), "Top vs bottom and in vs out: printed raw, never aligned."),
 "amp": ("Guitar amp mic placement", D.svg_amp_mic(), "Close mic just off the dust cap at 3 cm; room mic 1.5–2 m."),
 "displit": ("DI + amp split", D.svg_di_split(), "Both channels from one take through one DI box."),
 "prox": ("MPR-03 proximity ladder", D.svg_proximity(), "Ruler distances lips to grille; one taped gain for the whole ladder."),
 "plosive": ("MPR-04a plosive positions", D.svg_plosive(), "Same mouth position and taped gain for all three barriers of one mic."),
 "offaxis": ("DES-01 20° off-axis placement", D.svg_offaxis(), "Only the mic turns; distance and gain stay."),
 "grips": ("Handheld grips and handling noises", D.svg_grips(), "MPR-06 grips (top) and the MPR-05a noise actions (bottom)."),
 "spk01": ("SPK-01 coverage rig", D.svg_spk01(), "Rotate the speaker for angles; move the mic for distances."),
 "seats": ("SS-03b seat map", D.svg_ss03b(), "Seat distances are not specified: measure and log them."),
 "safe1": ("SAFE-1 line-capture fault bench", D.svg_chain_safe1(), "Hum, buzz, RF, crackle, clock slips and dropouts."),
 "safe3": ("SAFE-3 phantom / hot-plug bench", D.svg_chain_safe3(), "CAB-04: recorder only, minimum gain."),
 "ampchain": ("AMP-01 dummy-load chain", D.svg_chain_amp(), "Amplifier clipping never reaches a loudspeaker."),
 "irchain": ("Impulse-response sweep chain", D.svg_chain_ir(), "Sweep → speaker → room → mics → recorder → deconvolve."),
}
DIAG = {"MPR-01": ["polar"], "WAV-03": ["table"], "MPR-07": ["stereo"], "SS-01": ["fb"], "WAV-02": ["ir", "irchain"],
        "MIX-01": ["drumtop", "drumside"], "MIX-02": ["drumtop", "drumside"], "FX-01": ["drumtop", "drumside"],
        "FX-04": ["amp", "displit"], "MPR-03": ["prox"], "MPR-04a": ["plosive"], "MPR-05a": ["grips"], "MPR-06": ["grips"],
        "SPK-01": ["spk01"], "SS-03b": ["seats"], "AMP-01": ["ampchain"], "CAB-04": ["safe3"], "CAB-01": ["safe1"], "RD-01": ["irchain"]}
RDIAG = {"MIX-01.4": ["displit"], "MIX-01.5": ["amp"], "MIX-02.3": ["displit"], "MIX-02.6": ["amp"], "DES-01.4": ["offaxis"], "DES-01.8": ["offaxis"]}

def figs_for(keys, where, slug):
    return "".join(fig(FIGDEF[k][0], FIGDEF[k][1], FIGDEF[k][2], where, f"{k}-{slug}") for k in keys)

# ---------- render helpers
def badge(p):
    return f'<span class="badge {p.lower()}">{p}</span>'

def status_tag(s):
    return {"reuse": '<span class="tag reuse">Reuse — no new recording</span>', "hold": '<span class="tag hold">HOLD — do not record unless confirmed</span>',
            "optional": '<span class="tag opt">Optional</span>'}.get(s, "")

def ul(lst, cls=""):
    if not lst:
        return "<p class='muted'>—</p>"
    return f"<ul class='{cls}'>" + "".join(f"<li>{x}</li>" for x in lst) + "</ul>"

def ol(lst):
    return "<ol>" + "".join(f"<li>{x}</li>" for x in lst) + "</ol>"

def safety_html(lst):
    if not lst:
        return ""
    out = []
    for s in lst:
        s2 = re.sub(r"(SAFE-[123])", r'<a href="#safe-\1">\1</a>', s)
        s2 = s2.replace('href="#safe-SAFE-', 'href="#safe-')
        out.append(s2)
    return f"<div class='safety-note'><strong>Safety:</strong> " + " · ".join(out) + " <a href='#safety'>(Safety section)</a></div>"

KIND = {"rec": "New recording", "edit": "Edit/derived copy", "reuse": "Reuse — not a new file", "opt": "Optional", "hold": "On hold"}

def files_table(files, status):
    if not files:
        return "<p class='muted'>No files until production confirms.</p>" if status == "hold" else "<p class='muted'>No files for this recording.</p>"
    rows = []
    for fn, var, ln, note, kind in files:
        k = "hold" if status == "hold" else kind
        cb = "" if k in ("reuse", "hold") else f'<input type="checkbox" aria-label="Delivered: {fn}" data-file="{fn}">'
        rows.append(f"<tr class='k-{k}'><td class='cb'>{cb}</td><td class='fn'><code>{fn}</code></td><td>{var}</td><td class='nowrap'>{ln}</td><td>{note}{'' if k=='rec' else (' <span class=kind>' + KIND[k] + '</span>')}</td></tr>")
    return ("<div class='tablewrap'><table class='files'><thead><tr><th class='cb'>✓</th><th>Filename</th><th>Variant</th><th>Length</th><th>Notes</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table></div>")

def specs_table(sp):
    rows = sp.items() if isinstance(sp, dict) else sp
    if not rows:
        return "<p class='muted'>As the global spec (section B).</p>"
    return "<div class='tablewrap'><table class='specs'><tbody>" + "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows) + "</tbody></table></div>"

def nfiles_c(c, status):
    if status == "hold":
        return f"{c['hold']} file{'s' if c['hold'] != 1 else ''} on hold"
    n = c["rec"] + c["edit"]
    if n == 0 and not c["opt"] and c["reuse"]:
        return "reuse only"
    s = f"{n} file{'s' if n != 1 else ''}"
    if c["opt"]:
        s += f" + {c['opt']} optional"
    return s

def nfiles(it):
    return nfiles_c(counted(it), it["status"])

def nrecs(it):
    n = len(it["recs"])
    return f"{n} recording{'s' if n != 1 else ''}"

def plain(*parts):
    t = " ".join(parts)
    t = re.sub(r"<[^>]+>", " ", t).lower()
    return re.sub(r"\s+", " ", t).replace('"', "").strip()

def flat(v):
    if isinstance(v, dict):
        return " ".join(f"{k} {x}" for k, x in v.items())
    if isinstance(v, (list, tuple)):
        return " ".join(flat(x) for x in v)
    return str(v)

def rec_text(r):
    return plain(r["rid"], r["title"], r["context"], r["teaches"], r["record"], flat(r["how"]), flat(r["tips"]), flat(r["specs"]), flat(r["qc"]),
                 " ".join(f[0] + " " + f[1] for f in r["files"]))

def rec_html(it, r, open_):
    c = counted_files(r["files"], it["status"])
    sh = safety_html(r["safety"]) if r["safety"] else ""
    o = " open" if open_ else ""
    return f'''<details class="rec" id="{rid_anchor(r)}" data-text="{amp(rec_text(r))}" data-defopen="{1 if open_ else 0}"{o}>
<summary><h4 class="rech"><span class="rid">{r['rid']}</span> — {r['title']}</h4><span class="rnf">{nfiles_c(c, it['status'])}</span></summary>
<div class="rbody">
<h5>Where it's used</h5><p>{r['context'] or '—'}</p>
<h5>What it teaches</h5><p>{r['teaches'] or '—'}</p>
<h5>What to record</h5><p>{r['record'] or '—'}</p>
<h5>How to make it</h5>{ol(r['how']) if r['how'] else "<p class='muted'>—</p>"}
{('<h5>Diagram</h5>' + figs_for(RDIAG[r['rid']], r['rid'], r['rid'])) if r['rid'] in RDIAG else ''}
<h5>Efficient method / pro tips</h5>{ul(r['tips'], 'tips')}
<h5>Specs</h5>{specs_table(r['specs'])}
<h5>Files to deliver</h5>{files_table(r['files'], it['status'])}
<h5>Quality check before delivery</h5>{ul(r['qc'], 'qc')}
{('<h5>Safety</h5>' + sh) if sh else ''}
</div></details>'''

def card_diagram(iid):
    keys = DIAG.get(iid, [])
    if not keys:
        return ""
    return f'<h4>Setup diagram{"s" if len(keys) > 1 else ""}</h4>' + figs_for(keys, f"card {iid}", iid)

def card(it):
    sid = aid(it["id"])
    sess = ", ".join(str(s) for s in it["sess"])
    is_open = " open" if (it["pri"] == "P1" and it["status"] != "reuse") else ""
    rec_open = bool(is_open) or len(it["recs"]) == 1
    text = plain(it["id"], it["title"], it["used"], flat(it["reuse"]), " ".join(rec_text(r) for r in it["recs"]),
                 " ".join(f[0] for f in all_files(it)))
    see = " ".join(f'<a href="#{aid(s)}">{s}</a>' for s in it["see"]) or "—"
    sesslinks = " ".join(f'<a href="#session-{s}">Session {s}</a>' for s in it["sess"])
    legacy = ""
    if not it["recs"] and it.get("files"):
        legacy = f"<h4>Files to deliver</h4>{files_table(it['files'], it['status'])}"
    recs = "".join(rec_html(it, r, rec_open) for r in it["recs"])
    rlist = " ".join(f'<a href="#{rid_anchor(r)}">{r["rid"]}</a>' for r in it["recs"])
    return f'''<details class="card st-{it['status']}" id="{sid}" data-pri="{it['pri']}" data-sess="{' '.join(str(s) for s in it['sess'])}" data-text="{amp(text)}"{is_open}>
<summary><span class="cid">{it['id']}</span><span class="ctitle">{it['title']}</span>{badge(it['pri'])}<span class="csess">Session {sess}</span><span class="cnf">{nrecs(it)} · {nfiles(it)}</span>{status_tag(it['status'])}</summary>
<div class="cbody">
<div class="meta">{badge(it['pri'])} {sesslinks} · {nrecs(it)} · {nfiles(it)} {status_tag(it['status'])}</div>
<h4>About this lab page</h4><p>{it['used']}</p>
{card_diagram(it['id'])}
{safety_html(it['safety'])}
<p class="reuse"><strong>Reuse:</strong> {it['reuse'] or '—'} &nbsp; <strong>See also:</strong> {see}</p>
{legacy}
<div class="recs"><p class="reclist"><strong>Recordings in this item:</strong> {rlist or '—'}</p>{recs}</div>
<p class="usedin">Used in: {it['usedin'] or '—'}</p>
</div></details>'''

groups = []
for it in ITEMS:
    if it["group"] not in groups:
        groups.append(it["group"])
def gid(g):
    return "lab-" + re.sub(r"[^a-z0-9]+", "-", g.lower()).strip("-")

# ---------- sessions
SESS = [
 dict(n=1, name="Voice session — treated booth", time="1.5 days (one long day is possible if the podcast cast is booked for the afternoon)",
  room="Treated vocal booth, RT60 ≤ 0.3 s, noise floor ≤ −60 dBFS at working gain; HVAC that can be switched off.",
  people="Adult male voice talent (a LOW voice suits MPR-03); adult female voice talent; a male and a female singer with naturally strong S sounds (can be the same talents); Northgate cast: host, studio guest, remote guest (at home on a call); a hummer/whistler (any of the above). Child voice: skip (optional only with guardian consent).",
  gear="Multi-pattern LDC (C414 class); bright cardioid LDC; second LDC; SDC; cardioid dynamics ×3 (SM58 class); true pressure omni; passive ribbon (separate preamp, phantom OFF); lavalier; headworn; shotgun on a boom; boundary mic; fixed reference cardioid; pop filters (fabric and metal mesh); foam windscreens for each mic; floor protractor, plumb line, headrest marker; small full-range rear speaker (for MPR-06); mechanical ticking clock; isolation box/heavy blanket; tuner drone source; tuning fork A4 with resonance box; finger-snap performer; laptop/phone for the remote guest; tape and marker for gain knobs.",
  items=["MSL-02", "GAN-01", "MPR-01", "MPR-03", "MPR-04a", "MPR-06", "SPC-01", "SPC-02", "SPC-03", "SPC-04", "SPC-05", "SS-03a", "ENV-03", "STH-01", "FND-01", "AUT-01", "TL-04", "MTR-02", "DES-01", "FX-03", "EQ-01b", "MSL-01", "PROD-01", "PROD-02", "PROD-03"],
  shots=["<strong>Quietest first (building empty, HVAC off):</strong> MSL-02 self-noise (dynamic, LDC) and ticking clock; GAN-01 preamp noise at +60 dB. Record 30 s booth room tone.",
         "<strong>Setup A — rotation rig, multi-pattern LDC at 30 cm:</strong> measure nulls with pink noise; MPR-01 omni → cardioid → super → hyper → figure-8, all angles per pattern before switching.",
         "<strong>Setup B — proximity:</strong> MPR-03 cardioid dynamic 12 → 1 in (S1, then sung A2), then the true omni.",
         "<strong>Setup C — plosives at 2–3 in:</strong> MPR-04a LDC (pop filter, foam, then NONE last), then dynamic.",
         "<strong>Setup D — handheld dynamic at 2 in + rear speaker:</strong> MPR-06 four grips × S1 and sung.",
         "<strong>Setup E — house speech setup (LDC 8 in, pop filter):</strong> SPC-01 vowels (drone), SPC-02, SPC-03 frames, SPC-04 clean then each booth problem, SPC-05 female, SS-03a passages (LDC moved to 20 cm), ENV-03, STH-01, FND-01 voice “ah” A3, AUT-01, MTR-02 whistle (SDC 30 cm), TL-04 fork and sung A4 (SDC 10 cm).",
         "<strong>Setup F — bright LDC 6 in, no fabric pop filter:</strong> DES-01 male and female, then the 20° off-axis takes.",
         "<strong>Setup G — singing LDC 8 in with pop filter:</strong> FX-03 male and female; EQ-01b forte chorus.",
         "<strong>Setup H — mic-selection cluster (all eight mics at once):</strong> MSL-01 S1 voice, then S2 sung (core four).",
         "<strong>Setup I — podcast:</strong> two dynamics at 10 cm + remote call (double-ender). PROD-01 conversation (clap slate), 30 s room tone, then PROD-02 problem lines (plosive, mouth click, breaths, remote dropout) and PROD-03 unmatched ADR (LDC 15 cm)."],
  svg=SVG_POLAR),
 dict(n=2, name="Untreated medium room, plus a room with HVAC", time="Half a day to one day",
  room="An untreated medium room (RT60 ≈ 0.6–0.8 s) with a wooden floor, a large hard table and a desk; and a room whose HVAC can be switched on and off (can be the same room).",
  people="Male and female voice talents; the Northgate studio guest; a walker (footsteps); someone to drop the knock ball.",
  gear="Cardioid dynamic (SM58 class) + omni on one stand bar; LDC with rigid clip AND shock mount; desk stand and floor stand; handheld dynamic, a ring, a spare cable; small full-range playback speaker; omni for the table test; boundary mic; boom shotgun; omni measurement mic; balloons; tennis ball and ruler; tape measure; SPL meter.",
  items=["TL-01", "MPR-02", "SPC-04", "WAV-03", "MPR-05b", "MPR-05a", "PROD-03", "PROD-02"],
  shots=["<strong>HVAC OFF, quiet room first:</strong> TL-01 balloon (HVAC off). Record 30 s room tone.",
         "<strong>Setup A — distance:</strong> MPR-02 male then female, both mics at once, 4 → 48 in. Then SPC-04 distance take (LDC at 48 in, speech gain).",
         "<strong>Setup B — table comb:</strong> WAV-03 omni at 2, 6, 12, 24 in (S1 then pink), then the boundary mic.",
         "<strong>Setup C — isolation:</strong> MPR-05b desk knocks rigid → shock; footsteps rigid → shock.",
         "<strong>Setup D — handheld:</strong> MPR-05a four handling noises.",
         "<strong>Setup E — location line:</strong> PROD-03 boom shotgun line (photograph the position).",
         "<strong>HVAC ON (noisy captures last):</strong> TL-01 balloon and weak clap with HVAC on; PROD-02 HVAC-under-guest lines."],
  svg=SVG_TABLE),
 dict(n=3, name="Band and song session, studio (plus a mix day)", time="2–3 days tracking + 1 mix day (MST-02 adds about 1 more day; it is P3)",
  room="A studio with a live room (RT60 ≈ 0.8 s for MPR-07), an amp isolation space and a vocal booth; acoustic piano, drawbar organ and electric piano available; plate and spring reverb units if owned (or hired).",
  people="Drummer, bassist, guitarist (electric and acoustic), keyboard player, lead singer and 2–3 backing singers; for FND-01/ENV: pianist, trumpeter, alto flautist, clarinettist, violinist, cellist; a talker for MPR-07; a percussionist (shaker, woodblock, bell).",
  gear="Full drum mic kit (kick in dynamic, kick out LDC/large dynamic, RE20-class dynamic for EQ-01a, snare top and bottom, hat SDC, toms, matched SDC overhead pair, room pair); DI boxes; SM57-class guitar mic; bass amp mic; guitar room mic; LDC for vocals and pop filter; SDC pairs for XY/ORTF, omni pair for AB, figure-8 + cardioid for M/S, mono spot; click/tempo map at 80, 96 and 100 BPM; tuner; stereo bars; sweep player for EAR-05.",
  items=["MIX-01", "MIX-02", "FX-01", "FX-02", "FX-06", "EAR-02", "EAR-03", "EQ-01a", "ENV-01", "ENV-02", "FX-04", "EQ-01d", "EQ-02", "MSL-01", "FND-01", "DIG-01", "MTR-01", "FM-01", "EAR-05", "PROD-01", "MPR-07", "MIX-03", "MST-01", "MST-02", "EAR-01", "EAR-06", "EQ-01e", "FX-05", "TL-03", "TL-05", "SC-01", "SCN-01"],
  shots=["<strong>Day 1 — kit mic'd once for everything.</strong> Room tone. MIX-01 + MIX-02 full band at 80 BPM, three-pass takes (master + 2 alternates). EAR-03 beds at 100 BPM (band). EAR-02 three grooves at 100 BPM (drums). FX-01 at 96 BPM (toms undamped). EQ-01a kick only at 96 BPM. ENV-01 kick, snare and crash single hits. ENV-02 woodblock. MSL-01 snare cluster.",
         "<strong>Day 2 — overdubs.</strong> Lead and backing vocals for MIX-01 (booth). FX-04 guitar DI + amp, bass DI loop. EQ-01d acoustic strum, MSL-01 guitar cluster. EQ-02 piano loop, DIG-01 piano decay and fingerpicked guitar, ENV-01 piano C4. MTR-01 organ chord then ENV-02 organ swell. FND-01 instruments at A3. ENV-01 violin and trumpet, ENV-02 cello. FM-01 bell and EP tine. PROD-01 15 s theme. EAR-05 plate and spring sweeps (line, no SPL).",
         "<strong>Live room (quiet captures):</strong> MPR-07 four arrays in one performance.",
         "<strong>Mix day:</strong> MIX-03 four references; MST-01 (a) and (b); MST-02 if booked; then edits: EAR-01 (12 excerpts), EAR-06 (6), EQ-01e, NOI-01a wind loop, SPC-05 matched copies, MSL-01/MPR-01/MPR-03 matched copies, PROD-01 clean/as-authored set."],
  svg=SVG_STEREO),
 dict(n=4, name="Electrical bench", time="1 day",
  room="A workshop/bench with properly earthed outlets, a console, a power amp, dummy load and rated attenuator, a dimmer pack with a lamp load. No loudspeakers in any capture path.",
  people="Engineer plus one assistant (also the safety second).",
  gear="Interface with line inputs; headphones with a limiter on the monitor bus; console; system processor with limiter; Class AB power amp; dummy load and rated attenuator/line tap; isolation transformer; DI with ground-lift; unbalanced and balanced 15 m cables; known-faulty cables (crackle, dropout); dimmer + lamp; single-coil guitar; 2G/GSM phone (if obtainable); AM radio; two digital devices with S/PDIF/AES; wireless link; TT or 1/4 in patchbay and cords; robust condenser; cheap and good mic cables; the house programme for playback.",
  items=["EAR-04", "NOI-01b", "CAB-01", "CAB-02", "CAB-03", "SS-02E", "AMP-01", "PATCH-01", "CAB-05", "CAB-04", "TUBE-01"],
  shots=["<strong>Quietest first:</strong> EAR-04 chain noise floor (input terminated), then hiss at maximum gain.",
         "<strong>Hum/buzz family (same ground-loop rig):</strong> CAB-01 (hum alone, under music, both fixes) → NOI-01b hum, ground loop → EAR-04 ground loop ×2. Then dimmer: NOI-01b single-coil buzz, EAR-04 dimmer buzz, CAB-02 dimmer pair.",
         "<strong>RF and radio:</strong> NOI-01b RF and AM static, EAR-04 RF, CAB-02 phone pair.",
         "<strong>Crackle and dropouts:</strong> NOI-01b crackle, EAR-04 crackle, CAB-03 (three), EAR-04 dropout (wireless), EAR-04 clock slip.",
         "<strong>Console + amp rig:</strong> SS-02E nine pairs (good first, then fault); AMP-01 into the dummy load; PATCH-01 cord click.",
         "<strong>Mic-on-phantom captures last:</strong> CAB-05 cable noise; EAR-04 plosives (mic → preamp); then CAB-04 hot-plug and phantom thumps (riskiest, at minimum gain).",
         "TUBE-01 only if production confirms in writing."],
  svg=""),
 dict(n=5, name="Venue with a PA", time="1 day",
  room="An empty venue with a house PA (left/right tops, subs, a delay or fill speaker), stage risers, monitor wedges, an IEM system and a balcony if possible.",
  people="Engineer, a second person for SAFE-2 mute duty, a talker/singer (male and female for SS-03c), a still person for in-ear binaural mics (or a dummy head).",
  gear="Measurement omni; binaural dummy head or in-ear binaural mics; ORTF pair; vocal dynamics; recorder with line inputs from the console direct outs; brick-wall limiter for the wedge; graphic EQ; SPL meter; turntable or floor angle marks for SPK-01; a 2-way PA speaker for SPK-01; an already-damaged driver in a spare cabinet; −25 dB earplugs for everyone; sweep source for the hall IRs; tape measure/laser.",
  items=["SPK-01", "WAV-02", "SS-03b", "SS-02A", "SS-04", "EQ-01c", "SS-03c", "SS-01", "TL-02"],
  shots=["<strong>Quiet room first (HVAC off):</strong> WAV-02 hall IRs (sweeps ≈ 85 dBA, everyone protected), balloon, clap, S1.",
         "<strong>SPK-01:</strong> measurement omni at 4 m, rotate the speaker through the angles, then 1, 2, 8 m.",
         "<strong>SS-03b:</strong> passage through the PA at a fixed level; front, middle, back, under-balcony; male then female.",
         "<strong>SS-02A:</strong> acoustic faults at FOH/under the delay speaker (good first, then fault).",
         "<strong>SS-04:</strong> monitor mixes from the MIX-01 stems; binaural at each performer position; IEM from aux; talkback.",
         "<strong>Stage vocal:</strong> SS-03c line checks; EQ-01c live vocal on the riser, high-pass off.",
         "<strong>Loudest, riskiest last:</strong> SS-01 feedback onset (2.5 kHz, 250 Hz, ~1 kHz; two severities), ring-out sequence, speech at final gain. SAFE-2 throughout."],
  svg=SVG_FB),
 dict(n=6, name="Spaces and field", time="1–2 days (weather-dependent; the wind takes need a breeze, the dry and echo takes need still air)",
  room="Treated studio, a furnished living room, a classroom, a gym or church, a concrete stairwell, a small untreated room that can be treated temporarily, an open grassy field, a large flat wall with open ground, a busy road, a street, an HVAC plant area.",
  people="Engineer and an assistant; a talker; 10–15 babble volunteers with signed releases; a foley performer.",
  gear="Full-range powered speaker or dodecahedron; omni measurement mic; ORTF pair; binaural head/in-ear mics; shotgun with foam, blimp and fur; anemometer; parabolic or shotgun for birdsong; balloons; claves; sweep player; studio monitors for RD-01; portable absorbers, bass traps, cloud, rug; laser distance meter; earplugs.",
  items=["MTR-02", "WAV-01", "WAV-04", "MPR-04b", "NOI-01a", "PROD-04a", "WAV-02", "RD-01", "PROD-04b"],
  shots=["<strong>Dawn, outdoors:</strong> MTR-02 birdsong.",
         "<strong>Still air, open field:</strong> WAV-01 dry clap, clave, S1. Then WAV-04 at the wall (log distance).",
         "<strong>Breezy period (may be another day):</strong> MPR-04b four wind states, twice; keep the 20 s wind-only parts.",
         "<strong>Urban:</strong> NOI-01a traffic and HVAC plant; PROD-04a street atmosphere 60 s.",
         "<strong>Indoor spaces, one rig, quietest first:</strong> WAV-02 treated studio → living room → classroom → stairwell → gym/church (sweeps, balloon, clap, S1 at two positions).",
         "<strong>Small room:</strong> RD-01 untreated set, install treatment, treated set.",
         "<strong>Staged and foley:</strong> NOI-01a babble session (releases signed first); PROD-04b foley in the dry room."],
  svg=SVG_IR),
 dict(n=7, name="Piano (and optional players)", time="1–2 hours, right after a professional tuning",
  room="A good acoustic piano in a quiet room, freshly stretch-tuned by a professional tuner.",
  people="Pianist (or the engineer); the tuner; optional two violinists (TUN-02).",
  gear="One mic 30 cm above the hammers (LDC or SDC); tuner/strobe app; SDC at 1 m for TUN-02.",
  items=["TUN-01", "TUN-02"],
  shots=["Room tone.", "TUN-01 A1, A2, A3, A4, A5, then octaves A2–A3 and A4–A5. Ask the tuner for their stretch setting.", "If the studio piano is this piano: DIG-01 piano decay and ENV-01 piano C4 can be done here instead.", "Optional: TUN-02 pure and equal-tempered thirds, two takes each."],
  svg=""),
]

# every non-reuse item must appear in at least one session's list
for it in ITEMS:
    if it["status"] == "hold" and not all_files(it):
        continue
    for s in it["sess"]:
        if not (1 <= s <= len(SESS)) or it["id"] not in SESS[s - 1]["items"]:
            warn("item not in its session's list:", it["id"], "session", s)
for s in SESS:
    for i in s["items"]:
        if i not in IDS:
            warn("session", s["n"], "lists an unknown item id (shown as plain text):", i)

def idlink(i):
    return f'<a href="#{aid(i)}">{i}</a>' if i in IDS else f"<span>{i}</span>"

PLANS = {1: D.svg_plan1, 2: D.svg_plan2, 3: D.svg_plan3, 4: D.svg_plan4, 5: D.svg_plan5, 6: D.svg_plan6, 7: D.svg_plan7}
SVG_KEY = {SVG_POLAR: "polar", SVG_TABLE: "table", SVG_STEREO: "stereo", SVG_FB: "fb", SVG_IR: "ir"}

def session_html(s):
    n = s["n"]
    links = " ".join(idlink(i) for i in s["items"])
    where = f"Session {n}"
    plan = fig(f"Session {n} floor plan", PLANS[n](), "Where the performer, mics, speakers and recorder go. Distances are from the item cards; anything unlabelled is approximate.", where, f"s{n}-plan")
    sheet = tablefig(f"Session {n} input list / track sheet", D.input_table(n, idlink),
                     "One row per input, grouped by the setup letter of the shot list. Phantom: “off” for dynamics and DIs; a red ⚠ OFF marks a passive ribbon. Gain marks are the item targets: tape and log the knob.", where, f"s{n}-inputs")
    run = fig(f"Session {n} run order", D.svg_timeline(n, D.TIMELINES[n], f"Session {n} run order: quiet first, loud and risky last (durations approx.)"),
              "Blocks follow the ordered shot list. Durations are planning estimates scaled to the session's stated length, not commitments. Red marks show resets.", where, f"s{n}-run")
    k = SVG_KEY.get(s["svg"])
    setup = fig(FIGDEF[k][0], FIGDEF[k][1], FIGDEF[k][2], where, f"s{n}-{k}") if k else ""
    return f'''<section class="session" id="session-{n}"><h3>Session {n} — {s['name']}</h3>
<table class="specs"><tbody><tr><th>Time</th><td>{s['time']}</td></tr><tr><th>Room</th><td>{s['room']}</td></tr><tr><th>People</th><td>{s['people']}</td></tr><tr><th>Gear</th><td>{s['gear']}</td></tr><tr><th>Items covered</th><td class="idlinks">{links}</td></tr></tbody></table>
<h4>Floor plan</h4>{plan}
<h4>Input list / track sheet</h4>{sheet}
<h4>Ordered shot list</h4>{ol(s['shots'])}
<h4>Run order</h4>{run}
{('<h4>Setup diagram</h4>' + setup) if setup else ''}</section>'''

# ---------- front matter blocks
p1_list = ", ".join(f'<a href="#{aid(it["id"])}">{it["id"]}</a>' for it in ITEMS if it["pri"] == "P1" and it["status"] != "reuse")

glance = f'''<div class="glance">
<div><b>{N_ITEMS}</b><span>recording items (cards)</span></div>
<div><b>{N_RECS}</b><span>distinct recordings described</span></div>
<div><b>{REQ}</b><span>files to deliver</span></div>
<div><b>{tot['rec']}</b><span>new recordings</span></div>
<div><b>{tot['edit']}</b><span>edits / derived copies</span></div>
<div><b>{tot['opt']}</b><span>optional files</span></div>
<div><b>7</b><span>sessions</span></div>
</div>
<p>The {N_ITEMS} item cards describe {N_RECS} distinct recordings ({N_RECS_ACTIVE} of them in active, non-reuse items). Priority of the {N_ITEMS} items: <span class="badge p1">P1</span> {pri['P1']} · <span class="badge p2">P2</span> {pri['P2']} · <span class="badge p3">P3</span> {pri['P3']}. Of these, {st['reuse']} are reuse-only cards (no new files: they point at files recorded under another item), {st['optional']} is optional and {st['hold']} are on hold ({tot['hold']} held files, not counted above). The {REQ} files are {tot['rec']} new recordings plus {tot['edit']} edited or derived files (loudness-matched copies, loop cuts, deconvolved impulse responses, stereo balances and as-authored copies).</p>
<p><strong>P1 — do first:</strong> {p1_list}.</p>'''

spec_rows = [
 ("Format", "WAV PCM, <strong>48 kHz / 24-bit</strong>. Mono unless the item says stereo. Never 44.1 kHz or 16-bit, except the deliberate PROD-01 “as authored” files."),
 ("Editing", "Edit only: trim, with <strong>5–10 ms fades at zero crossings</strong>. For sustained loops (organ, hum, noise beds) a loop crossfade of ≤ 50 ms is allowed; for 2.000 s Ear Training excerpts ≤ 20 ms."),
 ("Processing", "<strong>NONE</strong>: no EQ, compression, limiting, reverb, noise reduction, de-essing, pitch correction or normalizing. Exceptions are named in the item: the produced mixes (MIX-03, MST-01 b, MST-02), deconvolved impulse responses, the M/S decode, the EAR-06 polarity flip, the PROD-01 sample-rate conversion and the PROD-02 edit click."),
 ("Peaks", "Sample peak <strong>≤ −6 dBFS</strong>, never clipped. One-shots and plosive takes may peak at <strong>−3 dBFS</strong>. Mastered references: as specified (see Safety)."),
 ("Sustained level", "Sustained or looping sources: RMS about <strong>−20 dBFS</strong> (where an item says −18 dBFS RMS, use that)."),
 ("Noise floor", "Room/chain noise floor <strong>≤ −60 dBFS</strong> at working gain (DIG-01 aims lower)."),
 ("FIXED-GAIN set", "Every variant recorded with the <strong>same preamp gain</strong>, marked with tape and logged. <em>Why:</em> the real level differences are the lesson — the cardioid's rear is quieter, distance drops 6 dB per doubling. Never normalize these files."),
 ("MATCHED set", "Variants loudness-matched to <strong>integrated LUFS within ±0.5 LU</strong>. <em>Why:</em> louder sounds “better” and brighter to everyone; removing level leaves only tone. <em>How:</em> make a separate COPY of the fixed-gain originals, apply a single static gain change per file (clip gain), nothing else; never alter the originals. Cap the gain at +20 dB (note any file that hits the cap)."),
 ("Loops", "Seamless; cut on bar lines at zero crossings. Tip: play the pattern three times and deliver the middle pass, so the first beat contains the natural ring-over from the bar before."),
 ("One-shots", "Keep the full natural decay plus <strong>0.5 s of room tone</strong> after it."),
 ("DRY room", "Treated booth or dead room: <strong>RT60 ≤ 0.3 s</strong>, no audible early reflections."),
 ("Sidecar", "One row per delivered file in the folder's <code>sidecars.csv</code> (template below)."),
 ("Takes", "Slate every take verbally and in the working filename (e.g. <code>mpr01-cardioid-090_t02</code>). Deliver the chosen take under the final name; put the take number in the sidecar."),
]
spec_table = "<table class='specs big'><tbody>" + "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in spec_rows) + "</tbody></table>"

sidecar_cols = "filename,item_id,take,date,engineer,performer,source,mic_model,mic_pattern,distance_cm,angle_deg,height_cm,preamp_model,preamp_gain_db,pad_db,phantom,converter,room,rt60_s,noise_floor_dbfs,set_type,notes"
sidecar_ex = "mic_principles/mpr01-cardioid-090-fixed.wav,MPR-01,2,2026-10-14,J. Engineer,Male talker A,S1 spoken,AKG C414 XLII,cardioid,30,90,120,API 512c,42,0,on,RME ADI-2,Booth B,0.25,-68,FIXED-GAIN,reference mic within 0.3 dB of 0° take"
manifest_cols = "filename,item_id,channels,duration_s,sample_peak_dbfs,true_peak_dbtp,lufs_i,rms_dbfs,set_type,notes"

lab_keys = sorted({f[0].split("/")[0] for it in ITEMS for f in all_files(it) if it["status"] != "hold" and "/" in f[0]})
folder_tree = "APE_RECORDINGS_2026-10/\n  manifest.csv\n  releases/            (signed performer, voice and location releases, PDF)\n  photos/              (setup photos, by item ID)\n" + "".join(f"  {k}/\n    sidecars.csv\n" for k in lab_keys)

# ---------- scripts
SCRIPTS = '''
<div class="script"><h4>S1 — spoken line (rich in plosives and sibilants)</h4>
<p class="verbatim">“Peter's best microphone sits six inches from the speaker — simple, steady, and clear.”</p>
<p class="muted">Delivery: natural, conversational, about 4 s, even level, no performance colour. The same wording every time.</p></div>

<div class="script"><h4>S2 — sung brief (original)</h4>
<p>An original 8-bar melody whose lyric contains S, Z, SH, P and B. We recommend that S2 <em>is</em> the house song's lead vocal (A minor, 80 BPM, 8 bars): verse bars 1–4 soft, chorus bars 5–8 full voice. One song for everything means the singers learn one part.</p>
<p class="label">Suggested lyric — <strong>suggested; the performer may substitute an original lyric meeting the same phoneme requirements</strong>:</p>
<p class="verbatim">Bars 1–2: Shadows pass the busy station,<br>Bars 3–4: silver buses hiss and sigh;<br>Bars 5–6: push the noise out, Sunday's breaking,<br>Bars 7–8: zip your coat and pass me by.</p>
<p class="muted">Contains S (station, silver, sigh, Sunday), Z (busy, buses, zip), SH (shadows, push), P (pass, push), B (busy, buses, breaking, by). Original text written for this brief.</p></div>

<div class="script"><h4>Speech lists</h4>
<ul>
<li><strong>Sustained vowels</strong> (3 s each, one pitch): AH (father) · EH (bed) · EE (see) · AW (law) · OO (boot).</li>
<li><strong>Sustained voiced/unvoiced pairs</strong> (3 s each): SSS → ZZZ · FFF → VVV · SH → ZH (as in “measure”).</li>
<li><strong>Consonant frames</strong> (“a_a”, one per second):<br>
Plosives: aPa · aBa · aTa · aDa · aKa · aGa<br>
Fricatives: aFa · aVa · aSa · aZa · aSHa · aZHa · aTHa (thin) · aTHa (this) · aHa<br>
Affricates: aCHa · aJa<br>Nasals: aMa · aNa · aNGa<br>Liquids: aLa · aRa<br>Glides: aWa · aYa</li>
<li><strong>Words:</strong> “professional audio”</li>
<li><strong>De-Esser phrase:</strong> “This is a sentence with essess.”</li>
<li><strong>Plosive line:</strong> “Bob bought a big blue bass.”</li>
<li><strong>Line check:</strong> “Check one-two, sss, t-t-t.”</li>
<li><strong>ADR line (PROD-03, original):</strong> “I told you the door was locked when I got here.”</li>
</ul></div>

<div class="script"><h4>The house song brief (original)</h4>
<table class="specs"><tbody>
<tr><th>Key / tempo</th><td>A minor, 80 BPM, 4/4</td></tr>
<tr><th>Length</th><td>8 bars = exactly 24.000 s (1,152,000 samples at 48 kHz); loops seamlessly bar 8 → bar 1</td></tr>
<tr><th>Form</th><td>Verse bars 1–4 (soft, intimate) into chorus bars 5–8 (full). The Mixing lab's automation page treats the first half as verse and the second half as chorus.</td></tr>
<tr><th>Instrumentation</th><td>Kick, snare, percussion (hi-hat + shaker), bass (DI + amp), electric guitar (comp/rhythm), keys/pad, lead vocal (S2), backing vocals (2–3 harmony parts).</td></tr>
<tr><th>Suggested harmony</th><td>Verse: Am | F | C | G — Chorus: F | G | Am | E (the E turns back to bar 1). Suggestion only; any original progression in A minor that loops works.</td></tr>
<tr><th>Recording</th><td>Record to a click; play the 8-bar form three times without stopping and deliver the middle pass. No count-in in any delivered file. Every stem sample-aligned from bar 1 beat 1.</td></tr>
<tr><th>Rights</th><td>Wholly original music and lyric, owned by AP&amp;E; no samples, loops or library sounds.</td></tr>
</tbody></table></div>

<div class="script"><h4>Reference speech passage — 30 s, phonetically balanced (original, 78 words)</h4>
<p class="verbatim">When the sun rises over the harbor, the fishing boats are already out past the breakwater. Judy checks the weather while her brother Zack measures the rope and loads the heavy crates. Six gulls shout above the deck, and the cold spray stings their cheeks. By noon they will haul the nets, sort the catch, and choose which pieces to sell in the village market. It is tough, quiet work, yet they would not trade it for anything.</p>
<p class="muted">Original text written for this brief. Covers stops (P B T D K G), fricatives (F V S Z SH ZH TH H), affricates (CH J), nasals (M N NG), liquids, glides (W Y) and a wide vowel set. Read at about 150 words per minute (≈ 30 s).</p></div>

<div class="script"><h4>“Northgate, episode 4” — scripted podcast, ≈ 60 s (original)</h4>
<p class="muted">Cast: MAYA (host, studio), DAN (studio guest), SASHA (remote guest on a call). Names and places are fictional.</p>
<div class="verbatim podcast">
<p><b>MAYA:</b> Welcome back to Northgate. I'm Maya Ortiz, and this is episode four. Today we're talking about the old Palace Theatre on Bridge Street — and why it might open its doors again.</p>
<p><b>MAYA:</b> With me in the studio is Dan Reyes, who runs the Northgate Preservation Project. Dan, thanks for coming in.</p>
<p><b>DAN:</b> Happy to be here. People pass that building every day and probably picture a pile of plaster and pigeons. <span class="cue">[plosive line]</span></p>
<p><b>MAYA:</b> And joining us remotely is Sasha Lin, a structural engineer. Sasha, can you hear us?</p>
<p><b>SASHA:</b> Loud and clear. I spent six weeks inspecting the place, and honestly, the steel is in surprisingly solid shape. <span class="cue">[sibilance line]</span></p>
<p><b>DAN:</b> That's the part nobody expects. The roof is the problem, not the bones.</p>
<p><b>MAYA:</b> So what happens next?</p>
<p><b>SASHA:</b> A proper survey, then a plan for the roof before winter.</p>
<p><b>MAYA:</b> We'll pick that up after the break. Stay with us.</p>
</div>
<p class="muted">PROD-02 problems are recorded on these voices: the host plosive uses “Palace Theatre on Bridge Street”, the studio guest's plosive-rich line is “a pile of plaster and pigeons”, and the sibilant line is Sasha's “six weeks… surprisingly solid shape”.</p></div>
'''

SAFETY = '''
<div class="hardrules"><h3>Hard rules — no exceptions</h3><ul>
<li><strong>NEVER defeat a mains safety earth.</strong> No lifted ground pins, no “cheater” adapters. Ground loops are made and fixed on the SIGNAL side only (DI ground-lift, isolation transformer).</li>
<li><strong>NEVER drive real loudspeakers into clipping.</strong> Amplifier clipping goes into a dummy load through a rated attenuator only.</li>
<li><strong>NO phantom power on ribbon mics</strong> (passive ribbons) or on unbalanced gear.</li>
<li><strong>Feedback is cut within 1 s</strong>, with a second person whose only job is the mute.</li>
<li><strong>Hearing protection</strong> for everyone during feedback work, sweeps, balloon pops and any loud session (−25 dB plugs for feedback).</li>
<li><strong>Every clip delivered to learners peaks ≤ −3 dBFS</strong> — except the mastered references (MIX-03 at −1 dBTP, MST-01 b at −0.1 dBTP, MST-02 as written), where the level is the lesson; production sets their playback level in the app. Do not lower them. Fault clips are level-matched with, or quieter than, the programme.</li>
</ul></div>
<div class="safe" id="safe-SAFE-1"><h4 id="safe-1">SAFE-1 · Hum, buzz, RF, crackle, clocking, dropouts</h4><ul>
<li>Capture at line level straight into the interface.</li><li>Monitor on headphones at low level with a limiter on the monitor bus.</li><li>Start every capture with the gain at minimum and bring it up.</li><li>Never lift a mains safety earth. Use a DI or isolation-transformer ground-lift only.</li></ul>@@F_SAFE1@@</div>
<div class="safe" id="safe-SAFE-2"><h4 id="safe-2">SAFE-2 · Feedback</h4><ul>
<li>Record from the console's direct or post-fader output, not acoustically.</li><li>A brick-wall limiter on the wedge amp, set well below the drivers' ratings.</li><li>Cut any ring within 1 s, with a second person on the mute.</li><li>Everyone wears −25 dB plugs.</li><li>Never chase a full howl; the onset is the lesson.</li><li>Log the SPL ceiling (≤ 95 dBA peak at 1 m).</li></ul></div>
<div class="safe" id="safe-SAFE-3"><h4 id="safe-3">SAFE-3 · Phantom-power thumps and hot-plug pops</h4><ul>
<li>No loudspeakers in the path: recorder only, preamp at minimum gain.</li><li>Use a robust condenser mic.</li><li>Never apply phantom power to ribbon mics or unbalanced gear.</li><li>Let the phantom power drain between takes.</li></ul>@@F_SAFE3@@</div>
<div class="safe"><h4>Amplifier clipping</h4><ul><li>Dummy load and a rated attenuator only. Never real speakers. Check the load's power rating exceeds the amp's output with margin.</li></ul>@@F_AMP@@</div>
<div class="safe"><h4>Room sweeps and impulse responses</h4><ul><li>Sweeps at about 85 dBA at the mic; everyone in the room wears hearing protection. Balloon pops are loud at close range — protect ears.</li><li>Warn building occupants before sweeps.</li></ul>@@F_IR@@</div>
<div class="safe"><h4>Venue programme levels</h4><ul><li>Acoustic fault and monitor captures at moderate level (≤ ≈ 90–95 dBA). The buzzing-driver fault uses a driver that is ALREADY damaged — never damage one on purpose.</li></ul></div>
'''

SAFETY = (SAFETY.replace("@@F_SAFE1@@", figs_for(["safe1"], "F · Safety", "safety"))
          .replace("@@F_SAFE3@@", figs_for(["safe3"], "F · Safety", "safety"))
          .replace("@@F_AMP@@", figs_for(["ampchain"], "F · Safety", "safety"))
          .replace("@@F_IR@@", figs_for(["irchain"], "F · Safety", "safety")))

CHECK_GLOBAL = ["Every file is 48 kHz / 24-bit WAV PCM (check in a file inspector, not by the filename) — except the PROD-01 as-authored files listed at 44.1 kHz / 16-bit.",
  "Channel count matches the item table (mono unless stated).", "Sample peaks within limits (≤ −6 dBFS; one-shots/plosives ≤ −3 dBFS; mastered references as specified).",
  "No clipping anywhere: no flat-topped samples, no clipped preamp (listen to the loudest moment on headphones).",
  "No processing: no EQ, compression, limiting, reverb, noise reduction, de-essing, pitch correction or normalizing outside the named exceptions.",
  "Fades: 5–10 ms at zero crossings; one-shots keep full decay + 0.5 s room tone; loops tested by repeating 3× (seamless).",
  "FIXED-GAIN sets: gain logged and identical across variants. MATCHED sets: separate copies within ±0.5 LU.",
  "Sidecars: one row per delivered file in each folder's sidecars.csv; every column filled.",
  "Manifest: one row per file, with duration, sample peak, true peak, LUFS and RMS measured from the delivered file.",
  "Rights: signed releases for every performer, voice, babble volunteer and private location; a statement that all music and lyrics are original.",
  "Filenames exactly as listed in this brief (lowercase, hyphens, folder = lab key; NG_E4_*.wav and theme_music.wav exactly).",
  "Nothing from a sound library, sample pack, commercial song or the internet."]
CHECK_FILE = ["Open it and listen end to end on headphones.", "Correct take, correct variant, correct item ID in the sidecar.", "Starts and ends cleanly (no click, no cut-off tail, no count-in).",
  "Level within the item's targets.", "Ticked in this brief's file table."]

EXISTING = '''<div class="tablewrap"><table class="specs"><thead><tr><th>Group (bucket folder)</th><th>Count</th><th>What</th><th>Status — what to do</th></tr></thead><tbody>
<tr><td><code>bass_fretboard</code></td><td>72</td><td>52 chromatic frets + 16 harmonics + 4 open strings (mono)</td><td>Used by the Bass Lab. <strong>Done — do not re-record.</strong></td></tr>
<tr><td><code>demo_signals</code></td><td>9</td><td>Piano chords 1–4, acoustic guitar A and E chords, kick / snare / hi-hat “bip” (stereo)</td><td>Unused. Keep; do not re-record unless asked. Shared one-shots you create in future go here.</td></tr>
<tr><td><code>mixing_lab</code></td><td>5</td><td>Bass / guitar / organ “bip” (4 s), full-band-output-2 (16 s), a drum clip that clipped at 0 dBFS</td><td>Unused and mismatched; cannot serve as a multitrack. <strong>May be replaced</strong> by MIX-01 (new names do not collide).</td></tr>
<tr><td><code>critical_listening</code></td><td>2</td><td>Male voice: “Clear sound begins with…”, “Learning begins by listening…” (5.4–5.6 s)</td><td>Unused; a possible interim speech source. Do not re-record.</td></tr>
</tbody></table></div><p class="muted">These 88 files are all 48 kHz. An earlier wish-list (2026-08-05) is superseded by this brief.</p>'''

SYNTH = '''<ul>
<li><strong>Generators:</strong> sine, noise colours (white, pink, brown, blue, violet, grey), sweeps, impulses, clicks, bursts; Oscillator, Harmonic, FM voice, Modular, Harmonograph and Cymatics drive tones; the Signal Generator and hub previews.</li>
<li><strong>Labs where exact maths is the point:</strong> Foundations modules 1–10 and 12–14; Digital aliasing and the quantization listening example (fixed in code); Wave interference, standing waves, alignment and arrays; Tuning &amp; Temperament comparisons (cent-exact); Ear Training frequency, noise/waveform, loudness and pitch modules and the measured ladders (synthesized stays the graded baseline; real material is an extra source); Mixing comb and null maths; Amplifier crossover distortion, THD and the Class-D concept.</li>
<li><strong>Binaural lab</strong> with sine or noise (it may reuse S1).</li>
<li><strong>Signal Chain</strong> click, pink and sine.</li>
<li><strong>Glossary</strong> pronunciations: text-to-speech by design (GLO-01 is on hold).</li>
<li><strong>Patchbay</strong> dry/compressed/cord-pulled versions: rendered by the app from MIX-01.</li>
<li><strong>Bass Lab:</strong> done.</li>
<li><strong>Grey noise</strong> and a <strong>50 Hz hum</strong> on US mains: synthesis (a real 50 Hz capture abroad is optional).</li>
</ul>'''

SPLITS = '''<ul>
<li><strong>WAV-02 / EAR-05 / RD-01 / TL-01</strong> (one merged “real spaces” entry in the source list) is split into five cards because the purpose or method differs: <a href="#item-wav-02">WAV-02</a> impulse responses of six spaces for auralization; <a href="#item-wav-04">WAV-04</a> the outdoor wall echo (one reflector, open air); <a href="#item-ear-05">EAR-05</a> plate and spring hardware (line capture, no microphones); <a href="#item-rd-01">RD-01</a> one small room before and after treatment (binaural, good seat vs boom seat); <a href="#item-tl-01">TL-01</a> the RT60 tool demo in a noisy room.</li>
<li><strong>MPR-04</strong> → <a href="#item-mpr-04a">MPR-04a</a> plosives (indoor, LDC and dynamic) and <a href="#item-mpr-04b">MPR-04b</a> wind (outdoor shotgun) — different mics, place and session.</li>
<li><strong>MPR-05</strong> → <a href="#item-mpr-05a">MPR-05a</a> handheld handling noise and <a href="#item-mpr-05b">MPR-05b</a> rigid vs shock mount.</li>
<li><strong>EQ-01</strong> → <a href="#item-eq-01a">EQ-01a</a> to <a href="#item-eq-01e">EQ-01e</a>, one per Fix-the-Signal scenario (different source, method and session).</li>
<li><strong>NOI-01</strong> → <a href="#item-noi-01a">NOI-01a</a> acoustic environmental noise (field) and <a href="#item-noi-01b">NOI-01b</a> electrical noise (line capture on the bench).</li>
<li><strong>SS-02</strong> → <a href="#item-ss-02e">SS-02E</a> electronic faults (line capture, bench) and <a href="#item-ss-02a">SS-02A</a> acoustic faults (binaural at the seat, venue).</li>
<li><strong>SS-03</strong> → <a href="#item-ss-03a">SS-03a</a> dry reference passage, <a href="#item-ss-03b">SS-03b</a> the passage through the PA by seat, <a href="#item-ss-03c">SS-03c</a> line-check takes.</li>
<li><strong>PROD-04</strong> → <a href="#item-prod-04a">PROD-04a</a> street atmosphere (ORTF field) and <a href="#item-prod-04b">PROD-04b</a> foley (close, dry).</li>
<li><strong>TL-03/04/05</strong> → three cards; only <a href="#item-tl-04">TL-04</a> needs new files.</li>
<li>Kept separate as the owner instructed: <a href="#item-ear-02">EAR-02</a> (100 BPM, Ear Training) vs <a href="#item-fx-01">FX-01</a> (96 BPM, Compression); <a href="#item-ear-04">EAR-04</a> vs <a href="#item-noi-01b">NOI-01b</a> vs <a href="#item-cab-01">CAB-01</a> vs <a href="#item-ss-02e">SS-02E</a>.</li>
<li>Reuse-only cards (no new files): FX-02, FX-05, FX-06, TL-02, TL-03, TL-05, SC-01, SCN-01.</li></ul>'''

# ---------- TOC
def toc_recs(g):
    gi = [it for it in ITEMS if it["group"] == g and it["recs"]]
    n = sum(len(it["recs"]) for it in gi)
    if not n:
        return ""
    rows = "".join(f'<div class="tocrrow"><a href="#{aid(it["id"])}" class="tocri">{it["id"]}</a> ' + " ".join(f'<a href="#{rid_anchor(r)}">{r["rid"]}</a>' for r in it["recs"]) + "</div>" for it in gi)
    return f'<details class="tocrecs"><summary>{n} recordings</summary>{rows}</details>'

toc_groups = "".join(f'<li><a href="#{gid(g)}">{g}</a><div class="tocids">' + " ".join(f'<a href="#{aid(it["id"])}" class="p-{it["pri"].lower()}">{it["id"]}</a>' for it in ITEMS if it["group"] == g) + "</div>" + toc_recs(g) + "</li>" for g in groups)
B_FIGS = ("<h3>Levels, loops and the two set types — drawn</h3>"
          + fig("Level targets in dBFS", D.svg_meter(), "Peak −6, one-shots/plosives −3, sustained ≈ −20 RMS, noise floor ≤ −60; every clip a learner hears ≤ −3 dBFS.", "B · Global spec", "meter")
          + fig("Loop cut", D.svg_loopcut(), "Three passes, deliver the second; cut on the downbeat at a zero crossing with 5–10 ms fades.", "B · Global spec", "loopcut")
          + fig("Fixed-gain vs matched", D.svg_fixed_matched(), "Same take, two deliverables: the untouched original and a gain-only copy.", "B · Global spec", "fixed-matched"))
F_FILENAME = fig("Filename anatomy", D.svg_filename(), "<code>&lt;lab_key&gt;/&lt;itemid&gt;-&lt;descriptor&gt;.wav</code>, part by part.", "B · Global spec", "filename")
GEAR_HTML = tablefig("Gear-reuse matrix", D.gear_matrix(), "Book or rent once: each row is a mic or key unit, each tick a session that uses it (from the session gear lists and the item methods).", "E · Session plan", "gear-matrix")

TOC = f'''<nav class="toc" aria-label="Contents"><details class="tocd" id="tocd" open><summary class="toch">Contents</summary><ol class="tocmain">
<li><a href="#front">A · About this brief</a></li><li><a href="#diagrams">Diagrams</a>@@DIAGTOC@@</li><li><a href="#spec">B · Global technical spec</a></li><li><a href="#scripts">C · House scripts and music</a></li>
<li><a href="#items">D · Recording items</a><ol class="tocsub">{toc_groups}</ol></li>
<li><a href="#sessions">E · Session plan</a><ol class="tocsub">{''.join(f'<li><a href="#session-{s["n"]}">Session {s["n"]}</a></li>' for s in SESS)}</ol></li>
<li><a href="#safety">F · Safety</a></li><li><a href="#checklists">G · Delivery and QC checklists</a></li><li><a href="#appendix">H · Appendix</a></li></ol></details></nav>'''

items_html = ""
for g in groups:
    gi = [it for it in ITEMS if it["group"] == g]
    nf = sum(counted(it)["rec"] + counted(it)["edit"] for it in gi)
    nr = sum(len(it["recs"]) for it in gi)
    items_html += f'<section class="labgroup" id="{gid(g)}"><h3>{g} <span class="muted small">· {len(gi)} items · {nr} recordings · {nf} files</span></h3>' + "".join(card(it) for it in gi) + "</section>"

index_rows = "".join(f'<tr data-pri="{it["pri"]}"><td><a href="#{aid(it["id"])}">{it["id"]}</a></td><td>{it["title"]}</td><td>{badge(it["pri"])}</td><td>{", ".join(map(str, it["sess"]))}</td><td class="num">{len(it["recs"])}</td><td class="num">{nfiles(it)}</td></tr>' for it in ITEMS)

CSS = r'''
:root{color-scheme:only light;--bg:#f7f5f0;--paper:#ffffff;--ink:#1d1b17;--sub:#5d574b;--line:#e2ddd1;--zebra:#faf8f3;--acc:#1f4e79;--p1:#b42318;--p1bg:#fee4e2;--p2:#93370d;--p2bg:#fef0c7;--p3:#475467;--p3bg:#eaecf0;--warn:#fff4e5;--warnline:#f79009;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
a{color:var(--acc)}code{font-family:var(--mono);font-size:.88em}.fn code{font-size:13px}
[id]{scroll-margin-top:84px}
.layout{display:grid;grid-template-columns:270px minmax(0,1fr);max-width:1400px;margin:0 auto}
.toc{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;padding:20px 14px 40px 20px;border-right:1px solid var(--line);font-size:14px;background:var(--bg)}
.toch{font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:12px;color:var(--sub);margin:0 0 8px}
.toc ol{padding-left:0;list-style:none;margin:0}.toc li{margin:4px 0}.tocsub{padding-left:10px!important;margin-top:4px!important}
.tocids{display:flex;flex-wrap:wrap;gap:3px;margin:3px 0 6px}.tocids a{font-family:var(--mono);font-size:11px;text-decoration:none;padding:1px 4px;border-radius:4px;background:var(--p3bg);color:var(--p3)}
.tocids a.p-p1{background:var(--p1bg);color:var(--p1)}.tocids a.p-p2{background:var(--p2bg);color:var(--p2)}
main{padding:24px 32px 80px;min-width:0}
.wrap{max-width:980px}
header.top{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:28px 28px 20px;margin-bottom:24px}
header.top h1{margin:0 0 6px;font-size:32px;line-height:1.15}
.docmeta{color:var(--sub);font-size:14px;display:flex;flex-wrap:wrap;gap:6px 18px}
h2{font-size:24px;margin:44px 0 12px;padding-top:8px;border-top:2px solid var(--ink)}
h3{font-size:19px;margin:28px 0 10px}h4{font-size:15px;margin:18px 0 6px;color:#2d2a24}
.muted{color:var(--sub)}.small{font-size:14px;font-weight:400}
.glance{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:16px 0}
.glance div{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px}.glance b{display:block;font-size:28px;line-height:1.1}.glance span{font-size:13px;color:var(--sub)}
.badge{display:inline-block;font-size:12px;font-weight:700;padding:1px 8px;border-radius:999px;letter-spacing:.03em;vertical-align:middle}
.badge.p1{background:var(--p1bg);color:var(--p1);border:1px solid #fda29b}.badge.p2{background:var(--p2bg);color:var(--p2);border:1px solid #fec84b}.badge.p3{background:var(--p3bg);color:var(--p3);border:1px solid #d0d5dd}
.tag{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;margin-left:6px}.tag.reuse{background:#e0f2fe;color:#075985}.tag.hold{background:#f2f4f7;color:#344054;border:1px dashed #98a2b3}.tag.opt{background:#f4f3ff;color:#5925dc}
table{border-collapse:collapse;width:100%;background:var(--paper)}th,td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
thead th{background:#efebe2;font-size:13px}tbody tr:nth-child(even){background:var(--zebra)}
table.specs th{width:170px;background:#f3f0e8;font-weight:600;font-size:14px}table.specs.big th{width:190px}
.tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
table.files{font-size:14px;min-width:640px}table.files td.fn{white-space:nowrap}td.cb,th.cb{width:34px;text-align:center}td.cb input{width:18px;height:18px}
.nowrap{white-space:nowrap}.kind{display:inline-block;font-size:11px;color:var(--sub);background:#f2efe7;border-radius:4px;padding:0 5px;margin-left:4px}
tr.k-reuse td{color:var(--sub);font-style:italic}tr.k-opt td{color:#5925dc}tr.k-hold td{color:var(--sub)}
details.card{background:var(--paper);border:1px solid var(--line);border-left:5px solid #d0d5dd;border-radius:10px;margin:12px 0;overflow:hidden}
details.card[data-pri=P1]{border-left-color:var(--p1)}details.card[data-pri=P2]{border-left-color:#f79009}
details.card.st-reuse,details.card.st-hold{background:#fcfcfb}
details.card>summary{cursor:pointer;list-style:none;padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
details.card>summary::-webkit-details-marker{display:none}
details.card>summary::before{content:"▸";color:var(--sub);font-size:14px;transition:transform .15s}details.card[open]>summary::before{transform:rotate(90deg)}
.cid{font-family:var(--mono);font-weight:700;background:#f2efe7;padding:1px 6px;border-radius:5px}.ctitle{font-weight:600;flex:1 1 280px}.csess,.cnf{font-size:13px;color:var(--sub)}
.cbody{padding:0 18px 16px;border-top:1px solid var(--line)}.meta{margin-top:12px;font-size:14px;color:var(--sub)}
.safety-note{background:var(--warn);border-left:4px solid var(--warnline);padding:8px 12px;margin:12px 0;border-radius:6px;font-size:14px}
.reuse{font-size:14px}.usedin{font-size:12px;color:var(--sub);border-top:1px dashed var(--line);padding-top:6px;margin-top:10px}
ul.tips li::marker{content:"→ "}ul.qc li::marker{content:"☐ "}
.script{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:6px 18px 12px;margin:12px 0}
.verbatim{font-family:Georgia,"Times New Roman",serif;font-size:18px;line-height:1.6;background:#fbfaf7;border-left:4px solid var(--acc);padding:10px 14px;margin:8px 0}
.podcast p{margin:6px 0}.cue{font-family:var(--mono);font-size:12px;color:var(--p1)}.label{margin-bottom:0}
pre{background:var(--paper);color:var(--ink);border:1px solid var(--line);padding:12px 14px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.45}
.hardrules{background:#fff1f0;border:2px solid var(--p1);border-radius:12px;padding:6px 20px 12px;margin:14px 0}.hardrules h3{color:var(--p1);margin-top:12px}
.safe{background:var(--paper);border:1px solid var(--line);border-left:5px solid var(--warnline);border-radius:10px;padding:4px 16px 8px;margin:10px 0}
.session{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:6px 18px 16px;margin:18px 0}
.idlinks a{font-family:var(--mono);font-size:13px;margin-right:6px;white-space:nowrap;display:inline-block}
figure{margin:14px 0}svg.diagram{width:100%;max-width:760px;height:auto;display:block}svg.diagram text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.controls{position:sticky;top:0;z-index:5;background:rgba(247,245,240,.96);backdrop-filter:blur(4px);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:10px 0 16px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:14px}
.controls input[type=search]{flex:1 1 200px;padding:7px 10px;border:1px solid #cfc8b8;border-radius:7px;font-size:15px}
.controls select,.controls button{padding:6px 10px;border:1px solid #cfc8b8;border-radius:7px;background:#fff;font-size:14px;cursor:pointer}
.controls label{white-space:nowrap}.progress{font-size:13px;color:var(--sub)}
.hidden{display:none!important}
.num{text-align:right;white-space:nowrap}
.menu-btn{display:none}
.tocrecs{margin:0 0 8px}.tocrecs>summary{cursor:pointer;font-size:12px;color:var(--sub)}.tocrrow{font-family:var(--mono);font-size:11px;line-height:1.5;margin:2px 0 2px 8px}.tocrrow a{text-decoration:none;margin-right:4px;white-space:nowrap}.tocrrow a.tocri{font-weight:700;color:var(--ink)}
.recs{margin-top:14px}.reclist{font-size:13px;color:var(--sub)}.reclist a{font-family:var(--mono);font-size:12px;white-space:nowrap;margin-right:4px}
details.rec{background:#fcfbf8;border:1px solid var(--line);border-left:3px solid #9fb6cd;border-radius:8px;margin:12px 0}
details.rec>summary{cursor:pointer;list-style:none;padding:9px 12px;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}
details.rec>summary::-webkit-details-marker{display:none}
details.rec>summary::before{content:"▸";color:var(--sub);font-size:13px;transition:transform .15s}details.rec[open]>summary::before{transform:rotate(90deg)}
details.rec[open]>summary{border-bottom:1px dashed var(--line)}
h4.rech{margin:0;font-size:15px;flex:1 1 240px;color:var(--ink)}.rid{font-family:var(--mono);font-size:13px;color:var(--acc);background:#e9f0f7;padding:1px 5px;border-radius:4px}.rnf{font-size:12px;color:var(--sub)}
.rbody{padding:0 14px 12px}h5{font-size:13px;margin:14px 0 4px;text-transform:uppercase;letter-spacing:.04em;color:var(--sub)}
details.rec.rmatch{border-left-color:var(--acc)}
.rbody p,.rbody li,.cbody p{overflow-wrap:anywhere}
.dfig{margin:14px 0;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 8px 6px}.dfig svg.diagram{max-width:100%}
.dfig figcaption{font-size:13px;color:var(--sub);margin:6px 2px 0;line-height:1.45}.dfig figcaption.top{margin:0 2px 8px}.dfig figcaption b{color:var(--ink)}
.tfig{padding:10px}table.inputs{font-size:13px;min-width:900px}table.inputs td{padding:5px 7px}table.inputs td.ph{white-space:nowrap}table.inputs td.idl a{white-space:nowrap}
.ph-off{color:var(--p1);font-weight:700;white-space:nowrap}.ph-on{color:var(--acc);font-weight:600}
table.gearm{font-size:13px;min-width:620px}table.gearm th.c,table.gearm td.c{text-align:center;width:38px;padding:5px 2px}table.gearm td.tick{color:var(--acc);font-weight:700;background:#eaf1f8}
.dfig.zoom{overflow-x:auto;-webkit-overflow-scrolling:touch}.dfig.zoom svg.diagram{width:760px;max-width:none}.dfig svg.diagram{cursor:zoom-in}.dfig.zoom svg.diagram{cursor:zoom-out}
@media (max-width:900px){.dfig:not(.tfig) figcaption::after{content:" Tap the drawing to enlarge; tap again to fit.";color:var(--acc)}}
.figindex h4{margin:12px 0 4px}.figindex ul{margin:0;padding-left:20px;font-size:14px}.figindex li{margin:2px 0}
.tocfigs{margin:2px 0 6px}.tocfigs>summary{cursor:pointer;font-size:12px;color:var(--sub)}.tocfigs ol{padding-left:8px!important;font-size:12px}.tocfigs li{margin:2px 0!important}
.tocd>summary{cursor:pointer;list-style:none}.tocd>summary::-webkit-details-marker{display:none}
@media (max-width:900px){.controls{position:static}.tocd>summary::after{content:" ▾"}.layout{display:block}.toc{position:static;max-height:none;border-right:0;border-bottom:1px solid var(--line);padding:14px 16px}
 main{padding:16px 16px 60px}header.top{padding:18px 16px}header.top h1{font-size:26px}table.specs th{width:110px}.toc .tocids,.toc .tocrecs{display:none}
 .cbody{padding:0 10px 14px}.rbody{padding:0 10px 10px}details.rec>summary{padding:8px 10px}details.card>summary{padding:10px 10px}.cbody ol,.cbody ul{padding-left:24px}}
@media print{
 .toc,.controls,.noprint{display:none!important}.layout{display:block}main{padding:0}body{background:#fff;font-size:11pt}
 details.card{break-inside:auto;border-left-width:3px}details.card>summary::before,details.rec>summary::before{content:""}details.rec{break-inside:auto;background:#fff}
 details>*:not(summary){display:block!important}details::details-content{content-visibility:visible!important;display:block!important}
 .session{page-break-before:always;break-before:page}#sessions>h2{page-break-before:always}
 a{color:inherit;text-decoration:none}.tablewrap{overflow:visible}table.files{min-width:0}table.files td.fn{white-space:normal;word-break:break-all}
 .hidden{display:block!important}
 .dfig.zoom svg.diagram{width:100%!important}.dfig figcaption::after{content:none!important}.dfig{break-inside:avoid;page-break-inside:avoid;border-color:#ccc}.tfig{break-inside:auto}table.inputs,table.gearm{min-width:0;font-size:9pt}svg.diagram{max-width:100%!important}
}
'''

JS = r'''
(function(){
 var KEY='ape-recbrief-ticks-v2';var REQN=@@REQ@@,OPTN=@@OPT@@;var store={};try{store=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){store={}}
 var boxes=[].slice.call(document.querySelectorAll('input[data-file]'));
 function prog(){var n=0;boxes.forEach(function(b){if(b.checked)n++});var p=document.getElementById('prog');if(p)p.textContent=n+' of '+boxes.length+' files ticked ('+REQN+' required + '+OPTN+' optional; saved in this browser only)';}
 boxes.forEach(function(b){if(store[b.dataset.file])b.checked=true;b.addEventListener('change',function(){if(b.checked)store[b.dataset.file]=1;else delete store[b.dataset.file];try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}prog();});});
 prog();
 var c=document.getElementById('controls');if(c)c.classList.remove('hidden');var td=document.getElementById('tocd');if(td&&window.innerWidth<900)td.open=false;
 var q=document.getElementById('q'),ps=[].slice.call(document.querySelectorAll('.fp')),ss=document.getElementById('fs');
 var cards=[].slice.call(document.querySelectorAll('details.card'));
 var recs=[].slice.call(document.querySelectorAll('details.rec'));var lastT='';
 function apply(){var t=(q.value||'').toLowerCase().trim();var on={};ps.forEach(function(p){on[p.value]=p.checked});var s=ss.value;var shown=0,rshown=0;
  cards.forEach(function(d){var ok=on[d.dataset.pri]&&(!s||(' '+d.dataset.sess+' ').indexOf(' '+s+' ')>=0)&&(!t||d.dataset.text.indexOf(t)>=0||d.textContent.toLowerCase().indexOf(t)>=0);d.classList.toggle('hidden',!ok);if(ok)shown++;if(ok&&t)d.open=true;
   [].slice.call(d.querySelectorAll('details.rec')).forEach(function(r){var m=!!t&&(r.dataset.text.indexOf(t)>=0||r.textContent.toLowerCase().indexOf(t)>=0);r.classList.toggle('rmatch',m);
    if(ok&&(!t||m))rshown++;if(t){if(ok)r.open=m;}else if(lastT){r.open=r.dataset.defopen==='1';}});});
  lastT=t;
  document.querySelectorAll('.labgroup').forEach(function(g){var any=g.querySelector('details.card:not(.hidden)');g.classList.toggle('hidden',!any)});
  var r=document.getElementById('fcount');if(r)r.textContent=shown+' of '+cards.length+' items shown ('+rshown+(t?' matching':'')+' recording'+(rshown===1?'':'s')+')';}
 q.addEventListener('input',apply);ps.forEach(function(p){p.addEventListener('change',apply)});ss.addEventListener('change',apply);
 document.getElementById('xall').addEventListener('click',function(){cards.forEach(function(d){d.open=true});recs.forEach(function(d){d.open=true})});
 document.getElementById('call').addEventListener('click',function(){cards.forEach(function(d){d.open=false})});
 function openHash(){var h=decodeURIComponent(location.hash.slice(1));if(!h)return;var el=document.getElementById(h);if(!el)return;var p=el;while(p){if(p.tagName==='DETAILS'){p.open=true;p.classList.remove('hidden');}if(p.classList&&p.classList.contains('labgroup'))p.classList.remove('hidden');p=p.parentElement;}setTimeout(function(){el.scrollIntoView()},0);}
 window.addEventListener('hashchange',openHash);
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(a&&a.getAttribute('href')===location.hash)openHash();});
 document.getElementById('clr').addEventListener('click',function(){q.value='';ps.forEach(function(p){p.checked=true});ss.value='';apply();});
 var opened=[];window.addEventListener('beforeprint',function(){opened=[];document.querySelectorAll('details').forEach(function(d){if(!d.open){d.open=true;opened.push(d)}})});
 window.addEventListener('afterprint',function(){opened.forEach(function(d){d.open=false})});
 document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('figure.dfig svg');if(s)s.parentNode.classList.toggle('zoom');});
 apply();openHash();
})();
'''

HOWTO = '''<ol>
<li><strong>Read B (spec), C (scripts) and F (safety) once</strong> before booking anything. They apply to every item.</li>
<li><strong>Plan from E (sessions).</strong> Each session lists the gear, room, people, time and an ordered shot list that keeps resets to a minimum.</li>
<li><strong>Work from the item cards in D.</strong> Each card opens with what the learner does on that lab page, then contains <strong>one section per distinct recording</strong> (for example MIX-01.3), each with its own context, teaching goal, method, tips, specs, file list with tick boxes and quality check. Recordings share a section only when they are identical in method, context and teaching. P1 cards and their recordings open by default; the contents list can expand each lab's recording IDs.</li>
<li><strong>“Reuse — no new recording”</strong> rows and cards point at a file you already made for another item. Never record those twice.</li>
<li><strong>Filter</strong> with the search box, the priority boxes and the session menu (needs JavaScript; with it off, everything is simply shown). Ticks are saved only in your browser.</li>
<li><strong>Before delivery, run G</strong> (global + per-file QC) and fill the sidecars and manifest.</li>
<li>Questions, substitutions (e.g. the alto flute for FND-01) or anything you cannot capture honestly: write it in the manifest notes. Never fake a sound to fill a row.</li></ol>'''

html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only light">
<title>AP&amp;E Recording Brief v2</title><meta name="description" content="AP&amp;E Studio recording brief for an outside recording engineer: spec, scripts, every recording item with file lists, session plan, safety and QC.">
<style>{CSS}</style></head><body>
<div class="layout">{TOC}
<main><div class="wrap">
<header class="top" id="front"><h1>AP&amp;E Studio — Recording Brief</h1>
<div class="docmeta"><span>Date: 2026-10-01</span><span>Version 2.0 — every distinct recording described individually</span><span>Production contact: AP&amp;E Studio</span><span>Audience: recording engineer</span></div></header>

<h2>A · About this brief</h2>
<h3>What this is for</h3>
<p>AP&amp;E Studio is an interactive pro-audio training app. Learners work through labs — microphones, speech, EQ, dynamics, mixing, mastering, live sound, cables, acoustics, post-production — and <em>hear</em> the sound change while they move the controls on screen: they rotate a mic and hear the rear go quiet and dull, drag a distance fader and hear the room take over, flip polarity and hear a snare thin out. Most of those pages are silent today, or play a synthesized stand-in. Your recordings replace them. Accuracy matters because learners copy real technique from what they hear: a mislabelled pattern, a normalized fixed-gain set or a processed “dry” vocal would teach the wrong thing.</p>
<h3>At a glance</h3>{glance}
<h3>How to use this document</h3>{HOWTO}
<h3 id="diagrams">Diagram index</h3><p class="muted">Every drawn figure and track sheet in this brief. Links open the card or recording that holds it.</p>@@DIAGINDEX@@

<h2 id="spec">B · Global technical spec</h2>
<p>Applies to every item unless its card says otherwise.</p>{spec_table}
{B_FIGS}
<h3>Sidecar template (one <code>sidecars.csv</code> per lab folder)</h3>
<pre>{sidecar_cols}
{sidecar_ex}</pre>
<p class="muted">Use “n/a” where a column does not apply (e.g. a DI). Add extra notes for anything an item asks you to log (measured null angle, wind speed, wall distance, SPL, notch frequencies, cents).</p>
<h3>File naming</h3>
<ul><li>Lowercase, hyphens, no spaces: <code>&lt;lab_key&gt;/&lt;itemid&gt;-&lt;descriptor&gt;.wav</code>, e.g. <code>mic_principles/mpr01-cardioid-090-fixed.wav</code>, <code>speech_voice/spc04-offaxis-90.wav</code>, <code>fx_labs/fx01-snare.wav</code>.</li>
<li>Angles are three digits (<code>000</code>, <code>030</code>, <code>127</code>); distances two digits plus unit (<code>04in</code>, <code>48in</code>).</li>
<li>Two exceptions keep names already used by the app: the house stems <code>mixing_lab/mix-kick.wav</code> … <code>mix-bgv.wav</code>, and the Northgate files <code>NG_E4_host.wav</code>, <code>NG_E4_guest_studio.wav</code>, <code>NG_E4_guest_remote.wav</code>, <code>NG_E4_room.wav</code>, <code>theme_music.wav</code>.</li>
<li>Use the exact filename in each item's table. The folder is the lab key (the storage bucket folder).</li></ul>
{F_FILENAME}
<h3>Delivery folder structure</h3><pre>{folder_tree}</pre>
<h3>Manifest (<code>manifest.csv</code> at the top level)</h3><pre>{manifest_cols}</pre>
<p class="muted">Measure every value from the delivered file. LUFS = integrated (ITU-R BS.1770).</p>
<h3>Rights</h3>
<ul><li>Original recordings only, wholly owned by AP&amp;E (work-for-hire or assignment in your contract).</li>
<li>Signed performer and voice releases for everyone heard, including babble volunteers and the remote podcast guest; location releases where needed.</li>
<li>No copyrighted songs, samples, loops or sound libraries. All music and lyrics are original (the house song, S2, the EP excerpts, the Northgate theme).</li>
<li>No recordings of the public with intelligible speech; no background music in field recordings.</li>
<li>No child voices without written guardian consent — the default is to skip them.</li></ul>
<h3>Delivery method</h3><p>One folder per lab key, each with its <code>sidecars.csv</code>; <code>manifest.csv</code> at the top; signed releases in <code>releases/</code>; setup photos in <code>photos/</code>. Deliver as a single archive or shared drive folder; keep your session files and raw takes (including raw sweep recordings) archived for at least 12 months.</p>

<h2 id="scripts">C · House scripts and music</h2>{SCRIPTS}

<h2 id="items">D · Recording items ({N_ITEMS} cards, {N_RECS} recordings, {REQ} files)</h2>
<div class="controls hidden noprint" id="controls" role="search">
<input type="search" id="q" placeholder="Search items, recordings, filenames, techniques…" aria-label="Search items">
<label><input type="checkbox" class="fp" value="P1" checked> P1</label><label><input type="checkbox" class="fp" value="P2" checked> P2</label><label><input type="checkbox" class="fp" value="P3" checked> P3</label>
<label>Session <select id="fs" aria-label="Filter by session"><option value="">All</option>{''.join(f'<option value="{i}">{i}</option>' for i in range(1, 8))}</select></label>
<button type="button" id="xall">Expand all</button><button type="button" id="call">Collapse all</button><button type="button" id="clr">Clear</button>
<span class="progress" id="fcount"></span><span class="progress" id="prog"></span></div>
{items_html}

<h2 id="sessions">E · Recording session plan</h2>
<p>Seven sessions. Within each, the shot list groups everything that shares a mic and setup, records the quietest captures first and the loudest or riskiest last, and names the items covered. Each session has a floor plan, an input list, the shot list and a run-order bar.</p>
<h3 id="gear">Gear across the sessions</h3>{GEAR_HTML}
{''.join(session_html(s) for s in SESS)}

<h2 id="safety">F · Safety</h2>{SAFETY}

<h2 id="checklists">G · Delivery and QC checklists</h2>
<h3>Global — before you send anything</h3><ul class="qc">{''.join(f'<li><label><input type="checkbox" class="noprint-cb"> {x}</label></li>' for x in CHECK_GLOBAL)}</ul>
<h3>Per file — every file</h3><ul class="qc">{''.join(f'<li>{x}</li>' for x in CHECK_FILE)}</ul>
<h3>Final delivery checklist</h3><ul class="qc">
<li><label><input type="checkbox"> All {REQ} required files present (tick count in section D), names exactly as listed.</label></li>
<li><label><input type="checkbox"> Optional files delivered only if captured honestly ({tot['opt']} possible).</label></li>
<li><label><input type="checkbox"> No HOLD item recorded without written confirmation (TUBE-01, GLO-01).</label></li>
<li><label><input type="checkbox"> <code>manifest.csv</code> complete; every folder has <code>sidecars.csv</code>.</label></li>
<li><label><input type="checkbox"> <code>mixing_lab/mix-02-offsets.txt</code> included.</label></li>
<li><label><input type="checkbox"> Signed releases in <code>releases/</code>; setup photos in <code>photos/</code>.</label></li>
<li><label><input type="checkbox"> Logged values present: MPR-01 null angles, MPR-04b wind speeds, WAV-04 wall distance, SS-01 notch frequencies, SS-03b seat distances and SPL, FND-01/AUT-01/TUN-01 cents, room dimensions and RT60s.</label></li>
<li><label><input type="checkbox"> Raw sweeps, session files and all takes archived on your side.</label></li></ul>

<h2 id="appendix">H · Appendix</h2>
<h3>Recordings already in the app</h3>{EXISTING}
<h3>You do NOT need to record these (synthesis is correct)</h3>{SYNTH}
<h3>How this brief splits the source list's merged entries</h3>{SPLITS}
<h3>Item index</h3><div class="tablewrap"><table class="specs"><thead><tr><th>ID</th><th>Title</th><th>P</th><th>Session</th><th>Recs</th><th>Files</th></tr></thead><tbody>{index_rows}</tbody></table></div>
<p class="muted">Totals: {N_ITEMS} items; {N_RECS} distinct recordings; {REQ} files to deliver ({tot['rec']} new recordings + {tot['edit']} edits/derived); {tot['opt']} optional; {tot['hold']} on hold.</p>
</div></main></div>
@@SCRIPT@@</body></html>'''

_order = re.findall(r'<figure class="dfig[^"]*" id="([^"]+)"', html)
assert len(_order) == len(set(_order)) == len(FIGS), (len(_order), len(FIGS))
_num = {a: i + 1 for i, a in enumerate(_order)}
html = re.sub(r"@@FN:([^@]+)@@", lambda m: str(_num[m.group(1)]), html)
_meta = {a: (l, w) for a, l, w in FIGS}
_groups = []
for a in _order:
    w = _meta[a][1]
    sec = "Section B · global spec" if w.startswith("B") else "Section E · session plan" if w.startswith(("Session", "E")) else "Section F · safety" if w.startswith("F") else "Section D · item cards"
    if not _groups or _groups[-1][0] != sec:
        _groups.append((sec, []))
    _groups[-1][1].append(a)
def _li(a):
    l, w = _meta[a]
    w2 = w.replace("card ", "")
    return f'<li><a href="#{a}">Fig. {_num[a]} — {l}</a> <span class="muted">({w2})</span></li>'
DIAGINDEX = "<div class='figindex'>" + "".join(f"<h4>{g}</h4><ul>" + "".join(_li(a) for a in al) + "</ul>" for g, al in _groups) + "</div>"
DIAGTOC = f'<details class="tocfigs"><summary>{len(_order)} figures</summary><ol>' + "".join(f'<li><a href="#{a}">{_num[a]}. {_meta[a][0]}</a></li>' for a in _order) + "</ol></details>"
html = html.replace("@@DIAGINDEX@@", DIAGINDEX).replace("@@DIAGTOC@@", DIAGTOC)
print("figures", len(_order))
html = amp(html).replace("@@SCRIPT@@", "<script>" + JS.replace("@@REQ@@", str(REQ)).replace("@@OPT@@", str(tot["opt"])) + "</script>")
# ---------- anchor integrity: unlink any internal link whose target id does not exist (e.g. appendix text naming a renamed item)
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
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8", newline="\n").write(html)
print("OUT", OUT)
print("items", N_ITEMS, "recs", N_RECS, "recs(active)", N_RECS_ACTIVE, "status", dict(st), "pri", dict(pri))
print("files rec", tot["rec"], "edit", tot["edit"], "REQ", REQ, "opt", tot["opt"], "hold", tot["hold"], "reuse rows", tot["reuse"])
print("bytes", len(html.encode("utf-8")))
for w in WARN:
    print("WARN", w)
