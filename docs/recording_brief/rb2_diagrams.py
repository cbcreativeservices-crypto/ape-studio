# -*- coding: utf-8 -*-
"""Drawn diagrams (inline SVG) and session tables for the recording brief v2.

Every SVG template uses the token @@ in front of its internal ids (title, desc, markers);
uniq() swaps @@ for a fresh prefix on each copy, so two copies of one diagram never share an id.
Legacy constants without @@ get every id prefixed by regex instead.
"""
import re, math, itertools

INK = "#1d1b17"; SUB = "#5d574b"; ACC = "#1f4e79"; RED = "#b42318"; LINE = "#e2ddd1"
ACCL = "#e9f0f7"; REDL = "#fee4e2"; WOOD = "#f4ede1"; MUTE = "#8c8577"

_N = itertools.count(1)


def uniq(svg):
    p = f"d{next(_N)}-"
    if "@@" in svg:
        return svg.replace("@@", p)
    ids = sorted(set(re.findall(r'\sid="([^"]+)"', svg)), key=len, reverse=True)
    for i in ids:
        svg = svg.replace(f'id="{i}"', f'id="{p}{i}"').replace(f"#{i})", f"#{p}{i})")
    return re.sub(r'aria-labelledby="([^"]+)"', lambda m: 'aria-labelledby="' + " ".join(p + x for x in m.group(1).split()) + '"', svg)


MARKERS = ('<marker id="@@ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f4e79"/></marker>'
           '<marker id="@@ak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1d1b17"/></marker>'
           '<marker id="@@rd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#b42318"/></marker>'
           '<marker id="@@dm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" fill="#5d574b"/></marker>')


def SVG(title, desc, w, h, body):
    return (f'<svg viewBox="0 0 {w} {h}" role="img" aria-labelledby="@@t @@d" class="diagram"><title id="@@t">{title}</title><desc id="@@d">{desc}</desc>'
            f'<defs>{MARKERS}</defs><rect x="1" y="1" width="{w - 2}" height="{h - 2}" rx="10" fill="#fff" stroke="{LINE}"/>{body}</svg>')


# ---------------------------------------------------------------- primitives
def T(x, y, s, size=12, a="middle", fill=INK, w=None, it=False, mono=False):
    extra = (f' font-weight="{w}"' if w else "") + (' font-style="italic"' if it else "") + (' font-family="ui-monospace,Menlo,Consolas,monospace"' if mono else "")
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{a}" fill="{fill}"{extra}>{s}</text>'


def TL(x, y, lines, size=12, a="middle", fill=INK, lh=None, w=None):
    lh = lh or size + 3
    return "".join(T(x, y + i * lh, s, size, a, fill, w) for i, s in enumerate(lines))


def L(x1, y1, x2, y2, c=INK, w=1.5, dash=None, m=None, ms=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    me = f' marker-end="url(#@@{m})"' if m else ""
    mst = f' marker-start="url(#@@{ms})"' if ms else ""
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d}{me}{mst}/>'


def R(x, y, w, h, fill="#fff", c=INK, sw=1.5, rx=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{c}" stroke-width="{sw}"{d}/>'


def C(x, y, r, fill="#fff", c=INK, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" stroke="{c}" stroke-width="{sw}"{d}/>'


def P(d, fill="none", c=INK, sw=1.5, dash=None, m=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    me = f' marker-end="url(#@@{m})"' if m else ""
    return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{sw}"{da}{me}/>'


def G(x, y, ang, body, s=1.0, extra=""):
    sc = f" scale({s})" if s != 1 else ""
    return f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f}){sc}"{extra}>{body}</g>'


def DIM(x1, y1, x2, y2, label, dx=0, dy=-6, size=12, c=SUB, a="middle"):
    return L(x1, y1, x2, y2, c, 1.2, m="dm", ms="dm") + T((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, label, size, a, c)


def ang_to(x1, y1, x2, y2):
    """rotation (deg) that points a 'up'-facing object at (x1,y1) toward (x2,y2)"""
    return math.degrees(math.atan2(x2 - x1, -(y2 - y1)))


def lead(x1, y1, x2, y2):
    return L(x1, y1, x2, y2, MUTE, 1, "2 2")


# ---- objects (local coords; the front / capsule faces up = -y unless noted)
def mic(x, y, ang, kind="ldc", s=1.0, aim=0, dash=None, col=ACC):
    k = kind
    o = 'stroke-dasharray="3 2"' if dash else ""
    if k == "ldc":
        b = (f'<rect x="-6" y="7" width="12" height="24" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<circle cx="0" cy="0" r="9" fill="{ACCL}" stroke="{col}" stroke-width="1.5" {o}/><line x1="-6" y1="-3" x2="6" y2="-3" stroke="{col}" stroke-width="2.5"/>')
    elif k == "dyn":
        b = (f'<path d="M-4.5 6 L4.5 6 L3 34 L-3 34 Z" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<circle cx="0" cy="0" r="7" fill="{ACCL}" stroke="{col}" stroke-width="1.5" {o}/><path d="M-5 -2 H5 M-5 2 H5 M-2 -5 V5 M2 -5 V5" stroke="{col}" stroke-width=".7"/>')
    elif k == "kick":
        b = (f'<rect x="-6" y="8" width="12" height="22" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<circle cx="0" cy="0" r="9.5" fill="{ACCL}" stroke="{col}" stroke-width="1.5" {o}/><path d="M-6 -3 H6 M-6 1 H6 M-5 5 H5" stroke="{col}" stroke-width=".7"/>')
    elif k == "sdc":
        b = (f'<rect x="-4" y="-3" width="8" height="34" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<line x1="-4" y1="2" x2="4" y2="2" stroke="{col}" stroke-width="1"/><line x1="-3" y1="-2" x2="3" y2="-2" stroke="{col}" stroke-width="2"/>')
    elif k == "omni":
        b = (f'<path d="M-2 -4 L2 -4 L3 4 L3 40 L-3 40 L-3 4 Z" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<circle cx="0" cy="-3" r="2.5" fill="{ACCL}" stroke="{col}" stroke-width="1"/>')
    elif k == "shotgun":
        b = (f'<rect x="-4" y="-4" width="8" height="58" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5" {o}/>'
             f'<path d="M-4 6 H4 M-4 14 H4 M-4 22 H4 M-4 30 H4" stroke="{col}" stroke-width=".8"/>')
    elif k == "ribbon":
        b = (f'<rect x="-5" y="9" width="10" height="20" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5"/>'
             f'<rect x="-8" y="-8" width="16" height="17" rx="4" fill="{ACCL}" stroke="{col}" stroke-width="1.5"/><path d="M-4 -6 V7 M0 -6 V7 M4 -6 V7" stroke="{col}" stroke-width=".8"/>')
    elif k == "boundary":
        b = (f'<rect x="-12" y="-6" width="24" height="12" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5"/>'
             f'<circle cx="0" cy="-1" r="2.5" fill="{ACCL}" stroke="{col}" stroke-width="1"/>')
    else:
        b = f'<circle cx="0" cy="0" r="5" fill="{ACCL}" stroke="{col}" stroke-width="1.5"/>'
    if aim:
        b += f'<line x1="0" y1="-11" x2="0" y2="{-11 - aim}" stroke="{col}" stroke-width="1" stroke-dasharray="3 3" marker-end="url(#@@ar)"/>'
    return G(x, y, ang, b, s)


def person(x, y, ang, s=1.0, col=INK):
    b = (f'<ellipse cx="0" cy="7" rx="21" ry="9" fill="#fff" stroke="{col}" stroke-width="1.5"/>'
         f'<circle cx="0" cy="0" r="9.5" fill="#fff" stroke="{col}" stroke-width="1.5"/><path d="M-3 -8.5 L0 -13 L3 -8.5" fill="#fff" stroke="{col}" stroke-width="1.3"/>')
    return G(x, y, ang, b, s)


def dummy_head(x, y, ang, s=1.0):
    b = (f'<ellipse cx="-10.5" cy="1" rx="2.5" ry="5" fill="#fff" stroke="{ACC}" stroke-width="1.3"/><ellipse cx="10.5" cy="1" rx="2.5" ry="5" fill="#fff" stroke="{ACC}" stroke-width="1.3"/>'
         f'<circle cx="0" cy="0" r="9.5" fill="{ACCL}" stroke="{ACC}" stroke-width="1.5"/><path d="M-3 -8.5 L0 -13 L3 -8.5" fill="{ACCL}" stroke="{ACC}" stroke-width="1.3"/>'
         f'<circle cx="-10.5" cy="1" r="1.6" fill="{ACC}"/><circle cx="10.5" cy="1" r="1.6" fill="{ACC}"/>')
    return G(x, y, ang, b, s)


def speaker(x, y, ang, w=36, d=24, s=1.0, waves=True, col=INK):
    b = (f'<rect x="{-w / 2}" y="0" width="{w}" height="{d}" rx="3" fill="#fff" stroke="{col}" stroke-width="1.5"/>'
         f'<line x1="{-w / 2 + 2}" y1="1.5" x2="{w / 2 - 2}" y2="1.5" stroke="{col}" stroke-width="3"/>'
         f'<path d="M{-w / 2 + 6} 3 Q0 {d - 4} {w / 2 - 6} 3" fill="none" stroke="{col}" stroke-width="1"/>')
    if waves:
        b += f'<path d="M{-w / 3} -6 Q0 -13 {w / 3} -6 M{-w / 2.2} -13 Q0 -22 {w / 2.2} -13" fill="none" stroke="{MUTE}" stroke-width="1"/>'
    return G(x, y, ang, b, s)


def wedge(x, y, ang, s=1.0):
    b = (f'<path d="M-24 0 L24 0 L18 20 L-18 20 Z" fill="#fff" stroke="{INK}" stroke-width="1.5"/><line x1="-22" y1="1.5" x2="22" y2="1.5" stroke="{INK}" stroke-width="3"/>'
         f'<path d="M-14 -6 Q0 -12 14 -6" fill="none" stroke="{MUTE}" stroke-width="1"/>')
    return G(x, y, ang, b, s)


def speaker_front(x, y, w=40, h=64, label=None, cross=False):
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.5, 3) + C(x, y + h / 2 - w / 2 + 2, w / 2 - 6, "#fff", INK, 1.3) + C(x, y + h / 2 - w / 2 + 2, 4, ACCL, INK, 1)
    o += R(x - 8, y - h / 2 + 5, 16, 9, "#fff", INK, 1.2, 2)
    if cross:
        o += L(x - w / 2 - 6, y - h / 2 - 6, x + w / 2 + 6, y + h / 2 + 6, RED, 3) + L(x + w / 2 + 6, y - h / 2 - 6, x - w / 2 - 6, y + h / 2 + 6, RED, 3)
    return o


def amp_front(x, y, w=90, h=80):
    """guitar/bass combo amp, front view centred on (x,y)"""
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.6, 6) + R(x - 12, y - h / 2 - 6, 24, 6, "#fff", INK, 1.2, 2)
    o += R(x - w / 2 + 6, y - h / 2 + 14, w - 12, h - 20, "#fbfaf7", INK, 1, 3)
    o += "".join(L(x - w / 2 + 6 + i * 6, y - h / 2 + 14, x - w / 2 + 6 + i * 6, y + h / 2 - 6, LINE, .8) for i in range(1, int((w - 12) / 6)))
    o += "".join(C(x - w / 2 + 12 + i * 9, y - h / 2 + 7, 2.2, "#fff", INK, 1) for i in range(4))
    return o


def recorder(x, y, w=74, h=42, label=None, size=11):
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.5, 4)
    o += C(x - w / 2 + 12, y - h / 2 + 13, 5, "#fff", INK, 1.2) + C(x - w / 2 + 27, y - h / 2 + 13, 5, "#fff", INK, 1.2)
    o += "".join(R(x + w / 2 - 26 + i * 6, y - h / 2 + 6 + (3 - i) * 3, 4, 14 - (3 - i) * 3, ACC if i < 3 else RED, ACC if i < 3 else RED, .5, 1) for i in range(4))
    o += "".join(C(x - w / 2 + 12 + i * 14, y + h / 2 - 9, 4, "#fff", INK, 1) for i in range(int((w - 14) / 14)))
    if label:
        o += T(x, y + h / 2 + 15, label, size, "middle", INK)
    return o


def console(x, y, w=120, h=56, n=8, label=None, size=11):
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.5, 4)
    step = (w - 16) / n
    for i in range(n):
        cx = x - w / 2 + 8 + step * (i + .5)
        o += C(cx, y - h / 2 + 9, 2.4, "#fff", INK, .9) + C(cx, y - h / 2 + 17, 2.4, "#fff", INK, .9)
        o += L(cx, y - h / 2 + 25, cx, y + h / 2 - 6, MUTE, 1) + R(cx - 3, y + (i % 3) * 4 - 2, 6, 5, ACC, ACC, .5, 1)
    if label:
        o += T(x, y + h / 2 + 15, label, size)
    return o


def laptop(x, y, label=None, size=11):
    o = R(x - 24, y - 20, 48, 30, "#fff", INK, 1.5, 3) + R(x - 20, y - 16, 40, 22, ACCL, ACC, .8, 1)
    o += P(f"M{x - 30} {y + 10} L{x + 30} {y + 10} L{x + 26} {y + 16} L{x - 26} {y + 16} Z", "#fff", INK, 1.4)
    if label:
        o += T(x, y + 31, label, size)
    return o


def headphones(x, y, s=1.0):
    return G(x, y, 0, f'<path d="M-14 4 Q-14 -16 0 -16 Q14 -16 14 4" fill="none" stroke="{INK}" stroke-width="2"/><rect x="-18" y="0" width="8" height="14" rx="3" fill="#fff" stroke="{INK}" stroke-width="1.5"/><rect x="10" y="0" width="8" height="14" rx="3" fill="#fff" stroke="{INK}" stroke-width="1.5"/>', s)


def di_box(x, y, label="DI", lift=True):
    o = R(x - 20, y - 13, 40, 26, "#fff", INK, 1.5, 4) + C(x - 12, y, 4, "#fff", INK, 1.1) + C(x + 12, y, 4.5, "#fff", INK, 1.1) + C(x + 12, y, 1.5, INK, INK, .5)
    if lift:
        o += R(x - 4, y - 9, 8, 5, ACCL, ACC, .8, 1)
    o += T(x, y + 26, label, 11)
    return o


def dummy_load(x, y, w=74, h=40):
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.5, 3)
    o += "".join(L(x - w / 2 + 6 + i * 6, y - h / 2 + 3, x - w / 2 + 6 + i * 6, y - 2, MUTE, 1.6) for i in range(int((w - 8) / 6)))
    o += C(x - w / 2 + 10, y + h / 2 - 9, 3.5, "#fff", RED, 1.2) + C(x - w / 2 + 22, y + h / 2 - 9, 3.5, "#fff", INK, 1.2)
    return o


def outlet(x, y, ok=True):
    o = R(x - 10, y - 14, 20, 28, "#fff", INK, 1.4, 4)
    for dy in (-6, 6):
        o += R(x - 5, y + dy - 4, 2.2, 5, INK, INK, .3, .5) + R(x + 3, y + dy - 4, 2.2, 5, INK, INK, .3, .5) + P(f"M{x - 2} {y + dy + 4} a2 2 0 0 1 4 0 v1 h-4 z", INK, INK, .3)
    return o


def table(x, y, w, h, label=None):
    return R(x, y, w, h, WOOD, "#a08a68", 1.4, 4) + (T(x + w / 2, y + h / 2 + 4, label, 11, "middle", SUB) if label else "")


def stand_legs(x, y, r=13):
    return "".join(L(x, y, x + r * math.sin(math.radians(a)), y - r * math.cos(math.radians(a)), MUTE, 1.2) for a in (60, 180, 300))


def guitar_side(x, y, s=1.0):
    b = (f'<path d="M0 0 C-8 -22 18 -30 26 -14 C34 -24 56 -22 58 -4 C60 14 40 22 30 12 C22 26 -4 22 0 0 Z" fill="#fff" stroke="{INK}" stroke-width="1.5"/>'
         f'<rect x="56" y="-6" width="70" height="8" rx="2" fill="#fff" stroke="{INK}" stroke-width="1.3"/><rect x="124" y="-9" width="16" height="14" rx="3" fill="#fff" stroke="{INK}" stroke-width="1.3"/>'
         f'<rect x="14" y="-8" width="10" height="16" rx="1" fill="{ACCL}" stroke="{INK}" stroke-width="1"/><circle cx="36" cy="8" r="2.5" fill="#fff" stroke="{INK}"/>')
    return G(x, y, 0, b, s)


def piano_top(x, y, s=1.0):
    b = (f'<path d="M0 0 L0 -150 C0 -205 40 -215 70 -205 C100 -195 104 -165 112 -130 L122 -60 L122 0 Z" fill="#fff" stroke="{INK}" stroke-width="1.6"/>'
         f'<rect x="-2" y="0" width="126" height="14" rx="2" fill="#fff" stroke="{INK}" stroke-width="1.3"/>'
         + "".join(f'<line x1="{2 + i * 6}" y1="0" x2="{2 + i * 6}" y2="14" stroke="{MUTE}" stroke-width=".7"/>' for i in range(21))
         + f'<line x1="4" y1="-16" x2="118" y2="-16" stroke="{ACC}" stroke-width="2" stroke-dasharray="4 2"/>')
    return G(x, y, 0, b, s)


def hand_on(x, y, w=26, h=22):
    """a hand gripping a horizontal handle, side view (fist), centred at x,y"""
    o = R(x - w / 2, y - h / 2, w, h, "#fff", INK, 1.5, 8)
    o += "".join(L(x - w / 2 + 5 + i * (w - 10) / 3, y - h / 2 + 3, x - w / 2 + 5 + i * (w - 10) / 3, y + 2, MUTE, 1) for i in range(4))
    o += P(f"M{x - w / 2 + 2} {y + 4} Q{x} {y + h / 2 + 6} {x + w / 2 - 2} {y + 3}", "none", INK, 1.3)
    return o


def handheld_side(x, y, length=150, ball=15):
    """handheld dynamic, side view, grille ball at left, centred on y"""
    hx = x + ball
    o = P(f"M{hx - 2} {y - 8} L{x + length} {y - 5} L{x + length} {y + 5} L{hx - 2} {y + 8} Z", "#fff", ACC, 1.5)
    o += C(x, y, ball, ACCL, ACC, 1.5) + "".join(L(x - ball + 3 + i * 5, y - ball + 4, x - ball + 3 + i * 5, y + ball - 4, ACC, .6) for i in range(int(2 * ball / 5) - 0))
    o += R(hx, y - 10, 6, 20, "#fff", ACC, 1.3, 2)
    o += P(f"M{x + length} {y} q12 0 18 10 t18 10", "none", INK, 1.6)
    return o


def head_profile(x, y, f=1, col=INK):
    """side view of a head facing +x (f=1) or -x (f=-1); mouth near (x+21f, y+14)"""
    return (f'<g transform="translate({x} {y}) scale({f} 1)"><path d="M-22 -10 C-26 -40 6 -50 20 -30 C24 -24 24 -16 24 -8 L31 2 L25 5 L25 10 L22 13 L24 18 C22 30 4 34 -2 30 L-4 46 L-24 46 L-22 22 C-28 12 -24 0 -22 -10 Z" fill="#fff" stroke="{col}" stroke-width="1.6"/>'
            f'<path d="M-6 -2 q-5 4 0 10" fill="none" stroke="{col}" stroke-width="1.2"/><line x1="16" y1="14" x2="23" y2="14" stroke="{col}" stroke-width="1.4"/></g>')


def ldc_side(x, y, h=56, col=ACC):
    """side-address LDC standing upright; capsule front faces -x; capsule centre at (x,y)"""
    return (R(x - 11, y - 17, 22, 34, ACCL, col, 1.5, 10) + "".join(L(x - 9, y - 12 + i * 6, x + 9, y - 12 + i * 6, col, .6) for i in range(5))
            + R(x - 7, y + 17, 14, h - 20, "#fff", col, 1.5, 3) + L(x - 11, y - 8, x - 11, y + 8, col, 3))


def waveform(x0, y0, w, amp, hits, decay=18.0, freq=0.9, seed=1, noise=.04, step=1.5):
    """path of a percussive waveform; hits = list of (x offset, relative amp)"""
    pts = []
    n = int(w / step)
    for i in range(n + 1):
        t = i * step
        v = 0.0
        for hx, ha in hits:
            if t >= hx:
                dt = t - hx
                v += ha * math.exp(-dt / decay) * math.sin(dt * freq + seed)
        v += noise * math.sin(i * 12.9898 + seed * 78.233) * math.sin(i * 0.7)
        v = max(-1.0, min(1.0, v))
        pts.append(f"{x0 + t:.1f} {y0 - v * amp:.1f}")
    return "M" + " L".join(pts)


# ================================================================ SECTION B: how-to visuals
def svg_meter():
    w, h = 640, 304
    x0, x1 = 40, 600

    def X(db):
        return x0 + (db + 80) / 80 * (x1 - x0)
    by = 150
    o = T(320, 26, "Level targets on a dBFS meter (sample peak; RMS where stated)", 13, w="700")
    o += R(x0 - 6, by - 16, x1 - x0 + 12, 32, "#fbfaf7", INK, 1.5, 6)
    o += R(X(-80), by - 9, X(-20) - X(-80), 18, ACCL, ACC, 1, 2)
    o += R(X(-20), by - 9, X(-6) - X(-20), 18, "#fff", ACC, 1, 2, "3 2")
    o += L(X(-6), by - 13, X(-6), by + 13, ACC, 3)
    o += R(X(-3), by - 9, X(0) - X(-3), 18, REDL, RED, 1, 2)
    for db in range(-80, 1, 10):
        o += L(X(db), by + 16, X(db), by + 24, INK, 1.2) + T(X(db), by + 38, f"{db}" if db else "0", 12, fill=SUB)
    o += T(X(-40), by + 56, "dBFS (0 = digital full scale)", 11, fill=SUB)
    o += lead(X(0), by - 16, X(0), 52) + T(X(0) - 4, 48, "0 dBFS: clipped — never", 12, "end", RED, "700")
    o += lead(X(-3), by - 16, X(-3), 72) + T(X(-3) - 4, 68, "−3: hard ceiling for every clip learners hear;", 12, "end", RED)
    o += T(X(-3) - 4, 84, "one-shots and plosive takes may peak here", 12, "end", RED)
    o += lead(X(-6), by - 16, X(-6), 104) + T(X(-6) - 4, 108, "−6: default peak target (≤ −6, never clipped)", 12, "end", ACC, "700")
    o += T(x0 - 4, by + 58, "≤ −80: DIG-01 aims this low", 11, "start", SUB)
    o += lead(X(-60), by + 44, X(-60), 218) + T(X(-60) + 4, 222, "≤ −60: room / chain", 12, "start", INK)
    o += T(X(-60) + 4, 237, "noise floor at working gain", 12, "start", INK)
    o += lead(X(-20), by + 44, X(-20), 252) + T(X(-20) - 4, 256, "≈ −20 RMS: sustained / looping sources", 12, "end", ACC)
    o += T(X(-20) - 4, 271, "(−18 RMS where the item says so)", 12, "end", ACC)
    o += T(320, 294, "Exceptions: mastered references (MIX-03 −1 dBTP, MST-01 b −0.1 dBTP, MST-02 as written) — the level is the lesson.", 11, fill=SUB)
    return SVG("Level targets in dBFS", "A horizontal dBFS meter from −80 to 0. Peaks default to −6 dBFS or lower. One-shots and plosive takes may reach −3 dBFS, which is also the hard ceiling for every clip delivered to learners. Sustained or looping sources sit around −20 dBFS RMS (−18 where an item says so). The room and chain noise floor must be −60 dBFS or lower at working gain; DIG-01 aims for −80. 0 dBFS is clipping and is never allowed. Mastered references are the stated exceptions.", w, h, o)


def svg_loopcut():
    w, h = 640, 380
    o = T(320, 26, "Loops: play the form three times, deliver the middle pass", 13, w="700")
    x0, x1, y = 30, 610, 100
    pw = (x1 - x0) / 3
    hits = []
    for p in range(3):
        for b in range(8):
            hits.append((p * pw + b * pw / 8 + 2, 1.0 if b % 2 == 0 else .6))
    o += R(x0 + pw, 54, pw, 92, ACCL, ACC, 1.2, 4)
    o += P(waveform(x0, y, x1 - x0, 34, hits, decay=9, freq=1.3, noise=.03), "none", INK, 1)
    for p in range(4):
        xx = x0 + p * pw
        o += L(xx, 54, xx, 146, INK if p in (1, 2) else MUTE, 1.2 if p in (1, 2) else 1, None if p in (1, 2) else "3 3")
    for p, lab in enumerate(("pass 1 (lead-in)", "pass 2 = DELIVERED", "pass 3 (tail)")):
        o += T(x0 + pw * (p + .5), 164, lab, 12, fill=ACC if p == 1 else SUB, w="700" if p == 1 else None)
    for p in (1, 2):
        xx = x0 + p * pw
        o += L(xx, 46, xx, 54, RED, 2) + T(xx, 42, "cut", 12, fill=RED, w="700")
    o += T(x0 + pw * 1.5, 182, "first beat already holds the ring-over from pass 1, so the loop has no hole", 11, fill=SUB)
    o += T(x0 + pw * 1.5, 198, "count-in removed · same cut sample for every stem", 11, fill=SUB)
    zx, zy, zw, zh = 70, 222, 500, 140
    o += R(zx, zy, zw, zh, "#fbfaf7", LINE, 1, 6)
    o += lead(x0 + pw, 204, zx + 40, zy)
    o += T(zx + 10, zy + 18, "zoom on a cut point", 12, "start", SUB, "700")
    cy = zy + 80
    o += L(zx + 20, cy, zx + zw - 20, cy, LINE, 1)
    pts = []
    for t in range(0, 461, 2):
        v = math.sin((t - 250) * 0.085) * 40 * (0.6 + 0.4 * math.sin(t * .013))
        if 200 < t < 250:
            v *= (250 - t) / 50.0
        elif 250 <= t <= 300:
            v *= (t - 250) / 50.0
        pts.append(f"{zx + 20 + t:.1f} {cy - v:.1f}")
    o += P("M" + " L".join(pts), "none", INK, 1.1)
    cx = zx + 20 + 250
    o += L(cx, zy + 30, cx, zy + zh - 14, RED, 1.6, "4 3") + C(cx, cy, 4, "#fff", RED, 2)
    o += T(cx + 8, zy + 22, "cut on the downbeat at a zero crossing", 12, "start", RED)
    o += P(f"M{cx - 40} {cy - 44} L{cx} {cy - 4}", "none", ACC, 1.4, "5 3") + P(f"M{cx} {cy - 4} L{cx + 40} {cy - 44}", "none", ACC, 1.4, "5 3")
    o += DIM(cx + 2, cy + 50, cx + 50, cy + 50, "", 0, 0) + T(cx + 56, cy + 54, "5–10 ms fades (loop crossfade ≤ 50 ms for", 11, "start", ACC)
    o += T(cx + 56, cy + 68, "sustained loops; ≤ 20 ms for 2.000 s excerpts)", 11, "start", ACC)
    return SVG("Loop cut method", "Top: a drum waveform of three passes of the same form. Pass 2 is shaded and delivered; red cut marks sit on the downbeat that starts pass 2 and the downbeat that starts pass 3. The first beat of pass 2 contains the ring-over from pass 1. Bottom: a zoom on a cut point showing the cut placed on a zero crossing, with short 5 to 10 millisecond fades.", w, h, o)


def svg_fixed_matched():
    w, h = 640, 330
    o = T(320, 26, "One take set, two deliverables: FIXED-GAIN originals and MATCHED copies", 13, w="700")
    rows = [("12 in", .32), ("4 in", .6), ("1 in", .95)]
    lx, rx, ww = 70, 400, 190
    o += T(lx + ww / 2, 54, "FIXED-GAIN originals", 13, fill=INK, w="700") + T(lx + ww / 2, 70, "same taped gain; real level differences kept", 11, fill=SUB)
    o += T(rx + ww / 2, 54, "MATCHED copies", 13, fill=ACC, w="700") + T(rx + ww / 2, 70, "integrated LUFS within ±0.5 LU", 11, fill=ACC)
    for i, (lab, a) in enumerate(rows):
        y = 104 + i * 62
        hits = [(4, 1.0), (60, .8), (110, .9), (150, .6)]
        o += T(lx - 10, y + 4, lab, 12, "end", SUB)
        o += L(lx, y, lx + ww, y, LINE, 1) + P(waveform(lx, y, ww, 26 * a, hits, decay=14, freq=.9, seed=i + 1), "none", INK, 1)
        o += L(rx, y, rx + ww, y, LINE, 1) + P(waveform(rx, y, ww, 22, hits, decay=14, freq=.9, seed=i + 1), "none", ACC, 1)
        o += L(lx + ww + 14, y, rx - 14, y, ACC, 1.4, None, "ar")
        o += T((lx + ww + rx) / 2, y - 8, "copy + one static gain", 11, fill=ACC) if i == 0 else ""
    o += T(lx + ww / 2, 288, "mpr03-s1-dyn-12in-fixed.wav", 11, fill=INK, mono=True)
    o += T(rx + ww / 2, 288, "mpr03-s1-dyn-12in-matched.wav", 11, fill=ACC, mono=True)
    o += T(320, 312, "Never normalize or alter the originals. MATCHED = clip gain only, nothing else; cap +20 dB (log any file that hits it).", 11, fill=RED)
    return SVG("Fixed-gain versus matched", "Left: three waveforms of the same performance recorded at 12, 4 and 1 inch with one taped gain, so they differ in level. Arrows lead right to three loudness-matched copies of equal level, made with a single static gain change each. The originals are delivered untouched as the -fixed files, the copies as the -matched files.", w, h, o)


def svg_filename():
    w, h = 640, 190
    o = T(320, 26, "Filename anatomy", 13, w="700")
    parts = [("mic_principles", "folder = lab key", INK), ("/", None, SUB), ("mpr01", "item ID, lowercase, no hyphen", ACC), ("-", None, SUB),
             ("cardioid", "descriptor (pattern)", INK), ("-", None, SUB), ("090", "angle: 3 digits", ACC), ("-", None, SUB), ("fixed", "set type", INK), (".wav", "WAV PCM 48/24", SUB)]
    cw = 12.6
    x = 320 - sum(len(p[0]) for p in parts) * cw / 2
    y = 80
    rows = [116, 140, 116, 140, 116, 140]
    k = 0
    for s, lab, col in parts:
        wdt = len(s) * cw
        o += f'<text x="{x:.1f}" y="{y}" font-size="21" fill="{col}" font-family="ui-monospace,Menlo,Consolas,monospace" textLength="{wdt:.1f}" lengthAdjust="spacingAndGlyphs">{s}</text>'
        if lab:
            yy = rows[k % len(rows)]
            k += 1
            o += P(f"M{x + 1:.1f} {y + 8} v6 H{x + wdt - 1:.1f} v-6", "none", col, 1.3)
            o += lead(x + wdt / 2, y + 14, x + wdt / 2, yy - 12) + T(x + wdt / 2, yy, lab, 11, fill=col)
        x += wdt
    o += T(320, 172, "Distances: two digits + unit (04in, 48in). Two exceptions keep app names: mix-*.wav stems and NG_E4_*.wav / theme_music.wav.", 11, fill=SUB)
    return SVG("Filename anatomy", "The example filename mic_principles/mpr01-cardioid-090-fixed.wav split into its parts: the folder is the lab key; mpr01 is the item ID in lowercase without a hyphen; cardioid is the descriptor; 090 is a three-digit angle; fixed is the set type; .wav is the format.", w, h, o)


# ================================================================ CLOSE-UPS
def svg_drum_top():
    w, h = 680, 600
    ox = 30
    o = T(340, 24, "Drum kit from above — close mics, overheads and room pair", 13, w="700")
    kx = 300 + ox
    o += mic(250 + ox, 70, 180, "ldc") + mic(350 + ox, 70, 180, "ldc")
    o += DIM(250 + ox, 50, 350 + ox, 50, "1–2 m apart", 0, -6) + T(kx, 104, "room pair (MIX-02.5): 3–4 m in front, head height", 12, fill=ACC)
    o += L(kx, 112, kx, 158, MUTE, 1.2, "4 4", "dm", "dm") + T(kx + 6, 140, "3–4 m (not to scale)", 11, "start", SUB)

    def cym(x, y, r):
        return C(x, y, r, "#fff", MUTE, 1.2) + C(x, y, r * .78, "none", LINE, 1) + C(x, y, r * .22, "#fff", MUTE, 1.2)
    o += cym(175 + ox, 282, 36) + cym(456 + ox, 318, 34)
    o += R(kx - 30, 230, 60, 130, "#fff", INK, 1.6, 6) + L(kx - 30, 232, kx + 30, 232, INK, 3.5) + L(kx - 30, 358, kx + 30, 358, INK, 3.5)
    o += P(f"M{kx + 8} 232 a9 9 0 0 1 18 0", "#fff", INK, 1.2)
    o += C(250 + ox, 300, 25, "#fff", INK, 1.6) + C(250 + ox, 300, 21, "none", LINE, 1)
    o += C(410 + ox, 400, 34, "#fff", INK, 1.6) + C(410 + ox, 400, 30, "none", LINE, 1)
    o += C(215 + ox, 392, 30, "#fff", INK, 1.6) + C(215 + ox, 392, 26, "none", LINE, 1)
    o += C(135 + ox, 370, 27, "#fff", MUTE, 1.3) + C(135 + ox, 370, 23, "none", MUTE, 1) + C(135 + ox, 370, 6, "#fff", MUTE, 1)
    o += C(kx, 476, 15, "#fff", MUTE, 1.2, "3 2") + person(kx, 462, 0) + T(kx, 510, "drummer", 11, fill=SUB)
    o += mic(kx + 8, 330, 180, "kick")
    o += mic(kx, 196, 180, "ldc")
    o += mic(186 + ox, 404, ang_to(186, 404, 215, 392), "dyn")
    o += mic(244 + ox, 414, ang_to(244, 414, 222, 396), "sdc", dash=True)
    o += mic(122 + ox, 336, ang_to(122, 336, 138, 366), "sdc")
    o += mic(234 + ox, 330, ang_to(234, 330, 250, 300), "dyn")
    o += mic(446 + ox, 430, ang_to(446, 430, 410, 400), "dyn")
    o += mic(135 + ox, 200, ang_to(135, 200, 215, 392), "sdc") + mic(295 + ox, 200, ang_to(295, 200, 215, 392), "sdc")
    o += L(135 + ox, 210, 213 + ox, 388, ACC, 1, "2 4") + L(295 + ox, 210, 217 + ox, 388, ACC, 1, "2 4")
    o += lead(128 + ox, 196, 128, 170) + TL(14, 140, ["overheads ≈ 1 m above", "the cymbals, spaced", "or ORTF; equal distance", "to the snare (tape)"], 12, "start", ACC)
    o += lead(kx + 14, 182, 520, 172) + TL(524, 160, ["kick OUT (MIX-02.2):", "20 cm outside the", "front head, on-axis", "with the beater"], 12, "start", ACC)
    o += lead(kx + 18, 330, 520, 244) + TL(524, 232, ["kick IN: through the", "port, capsule 5–10 cm", "from the batter head,", "slightly off-centre", "on the beater"], 12, "start", ACC)
    o += lead(464 + ox, 438, 520, 470) + TL(524, 470, ["toms: dynamic 3–5 cm", "over the rim, aimed", "at the centre (FX-01:", "undamped, no gate)"], 12, "start", ACC)
    o += lead(112 + ox, 330, 120, 300) + TL(14, 252, ["hi-hat SDC 15 cm", "above (FX-01: 10–15", "cm), bell-to-edge,", "aimed away from", "the snare"], 12, "start", ACC)
    o += lead(176 + ox, 412, 130, 446) + TL(14, 452, ["snare TOP: SM57 class", "3–5 cm above the rim,", "30–45° down; rear", "(null) toward the hat"], 12, "start", ACC)
    o += lead(250 + ox, 424, 250, 516) + TL(14, 530, ["snare BOTTOM (dashed, under the drum): 5–8 cm below,", "pointing up at the wires, angled away from the kick"], 12, "start", ACC)
    o += R(14, 556, 652, 34, REDL, RED, 1.2, 6) + TL(340, 570, ["Never time-align or polarity-flip snare bottom, kick out, bass amp or guitar room —", "the thin / comb-filtered sum is the lesson. Measure offsets into mix-02-offsets.txt."], 11, "middle", RED, 13)
    return SVG("Drum kit mic placement, top view", "A drum kit seen from above with the drummer at the bottom. Kick in: a dynamic through the port, 5 to 10 cm from the batter head. Kick out: 20 cm outside the front head. Snare top: SM57-class dynamic 3 to 5 cm above the rim, angled 30 to 45 degrees down, rear toward the hi-hat. Snare bottom: 5 to 8 cm under the drum aimed at the wires. Hi-hat: small-diaphragm condenser 15 cm above. Toms: dynamics 3 to 5 cm over the rim. Overheads about 1 m above the cymbals, equal distance to the snare. Room pair 3 to 4 m in front at head height, 1 to 2 m apart. A red note says never time-align or polarity-flip the bottom, outside, amp or room tracks.", w, h, o)


def svg_drum_side():
    w, h = 680, 330
    o = T(340, 24, "Side views — snare top vs bottom, kick in vs out", 13, w="700")
    sx, sy = 150, 170
    o += R(sx - 70, sy - 18, 140, 36, "#fff", INK, 1.6, 3) + L(sx - 72, sy - 18, sx + 72, sy - 18, INK, 3) + L(sx - 72, sy + 18, sx + 72, sy + 18, INK, 3)
    o += P(f"M{sx - 60} {sy + 22} " + " ".join(f"L{sx - 60 + i * 10} {sy + 22 + (3 if i % 2 else 0)}" for i in range(13)), "none", MUTE, 1)
    o += T(sx, sy + 4, "snare", 12, fill=SUB) + T(sx - 68, sy + 40, "wires", 11, "start", SUB)
    o += mic(sx - 82, sy - 46, 125, "dyn", 1.15) + lead(sx - 92, sy - 60, sx - 110, sy - 84) + TL(sx - 132, sy - 116, ["TOP: 3–5 cm above the rim,", "30–45° down to the centre"], 12, "start", ACC)
    o += mic(sx + 50, sy + 62, 0, "sdc") + DIM(sx + 66, sy + 22, sx + 66, sy + 52, "5–8 cm", 6, 4, 11, SUB, "start")
    o += TL(sx - 132, sy + 80, ["BOTTOM: up at the wires,", "polarity as recorded"], 12, "start", ACC)
    o += T(sx, sy + 122, "Ø switch taped over — the thin sum is the lesson", 12, fill=RED)
    kx, ky = 500, 170
    o += R(kx - 80, ky - 52, 160, 104, "#fff", INK, 1.6, 6) + L(kx - 80, ky - 54, kx - 80, ky + 54, INK, 4) + L(kx + 80, ky - 54, kx + 80, ky + 54, INK, 4)
    o += P(f"M{kx - 112} {ky + 30} L{kx - 86} {ky + 4}", "none", INK, 2) + C(kx - 84, ky + 2, 5, "#fff", INK, 1.4) + T(kx - 104, ky + 52, "beater", 11, fill=SUB)
    o += R(kx + 76, ky + 10, 8, 18, "#fff", INK, 1.2, 2) + T(kx + 96, ky + 66, "port", 11, "start", SUB)
    o += mic(kx - 50, ky + 4, -90, "kick") + L(kx - 20, ky + 4, kx + 80, ky + 18, ACC, 1.2, "2 3")
    o += DIM(kx - 80, ky - 22, kx - 59, ky - 22, "", 0, 0) + TL(kx - 80, ky - 84, ["IN: 5–10 cm", "from the batter"], 12, "middle", ACC)
    o += mic(kx + 130, ky, -90, "ldc") + DIM(kx + 82, ky - 26, kx + 121, ky - 26, "20 cm", 0, -6, 11)
    o += TL(kx + 106, ky - 84, ["OUT: 20 cm outside", "the front head"], 12, "middle", ACC)
    o += T(kx, ky + 96, "OUT arrives ≈ 0.6 ms (≈ 29 samples) later per 20 cm —", 12, fill=RED)
    o += T(kx, ky + 112, "measure and log it; never align it to IN", 12, fill=RED)
    o += T(kx, ky + 136, "EQ-01a (separate kick-only take): RE20 class 15 cm outside", 11, fill=SUB)
    return SVG("Snare and kick mic placement, side view", "Left: a snare drum from the side. The top mic is 3 to 5 cm above the rim, angled 30 to 45 degrees down. The bottom mic is 5 to 8 cm under the drum, aimed up at the wires, with its polarity left as recorded. Right: a kick drum from the side with the beater on the left. The inside mic goes through the port with its capsule 5 to 10 cm from the batter head; the outside mic is 20 cm outside the front head, and arrives about 0.6 ms later, which is logged and never aligned.", w, h, o)


def svg_amp_mic():
    w, h = 680, 330
    o = T(340, 24, "Guitar amp: close mic on the cone, plus the room mic", 13, w="700")
    cx, cy = 100, 180
    o += R(16, 56, 300, 250, "#fbfaf7", LINE, 1, 8) + T(166, 76, "speaker, front view (grille off)", 11, fill=SUB)
    o += C(cx, cy, 70, "#fff", INK, 1.6) + C(cx, cy, 64, "none", LINE, 1) + C(cx, cy, 20, ACCL, INK, 1.4)
    o += C(cx + 28, cy, 5, ACC, ACC, 1) + C(cx + 28, cy, 10, "none", ACC, 1.5)
    o += lead(cx + 4, cy - 8, 180, 112) + TL(184, 112, ["on the cap:", "brighter"], 12, "start", SUB)
    o += lead(cx + 38, cy, 180, 170) + TL(184, 168, ["just off the cap:", "the house spot", "(tape the grille)"], 12, "start", ACC)
    o += lead(cx + 50, cy + 40, 180, 240) + TL(184, 244, ["further out:", "darker"], 12, "start", SUB)
    ax, ay = 400, 180
    o += R(ax - 40, ay - 60, 40, 120, "#fff", INK, 1.6, 4) + L(ax, ay - 60, ax, ay + 60, INK, 3) + P(f"M{ax - 2} {ay - 40} Q{ax - 22} {ay} {ax - 2} {ay + 40}", "none", INK, 1.2)
    o += T(ax - 20, ay + 78, "amp (side)", 11, fill=SUB)
    o += mic(ax + 18, ay, -90, "dyn") + TL(ax + 24, ay - 74, ["SM57 class, 3 cm from", "the grille cloth, on-axis"], 12, "start", ACC)
    o += mic(ax + 236, ay, -90, "ldc")
    o += L(ax + 52, ay - 24, ax + 224, ay - 24, MUTE, 1.2, "4 4", "dm", "dm") + T(ax + 138, ay - 30, "1.5–2 m (not to scale)", 11, fill=SUB)
    o += TL(ax + 216, ay + 32, ["room mic (MIX-02.6):", "LDC or omni, at", "speaker height"], 12, "middle", ACC)
    o += T(ax + 120, ay + 96, "Never align the room mic to the close mic", 12, fill=RED)
    o += T(ax + 120, ay + 112, "(it lands ≈ 4–6 ms later; measure and log).", 12, fill=RED)
    o += T(340, 320, "Bass amp (MIX-02.3): dynamic or LDC 5–10 cm from the cone, slightly off centre, same take as the DI.", 11, fill=SUB)
    return SVG("Guitar amp mic placement", "Left: the amp's speaker seen from the front. The close mic goes just off the dust cap; on the cap is brighter, further out is darker. Right: a side view with an SM57-class mic 3 cm from the grille cloth, on-axis, and a room mic 1.5 to 2 m away at speaker height. The room mic is never aligned to the close mic.", w, h, o)


def svg_di_split():
    w, h = 680, 330
    o = T(340, 24, "DI + amp on the same take (never re-amp later)", 13, w="700")

    def row(y, inst, amp_lab, mic_lab, ch_amp, ch_di):
        s = guitar_side(30, y, .62) + T(70, y + 30, inst, 12, fill=INK)
        s += L(118, y, 166, y, INK, 1.6, None, "ak") + di_box(190, y, "") + T(190, y - 20, "DI box", 11, fill=INK)
        s += P(f"M210 {y} L250 {y}", "none", INK, 1.6, None, "ak") + T(230, y - 8, "thru", 11, fill=SUB)
        s += amp_front(300, y, 84, 70) + T(300, y - 46, amp_lab, 11, fill=SUB)
        s += mic(358, y, -90, "dyn") + T(372, y - 20, mic_lab, 11, "start", ACC)
        s += L(392, y, 478, y, ACC, 1.6, None, "ar")
        s += P(f"M190 {y + 13} L190 {y + 60} L478 {y + 60}", "none", INK, 1.6, None, "ak") + T(330, y + 54, "DI out (balanced)", 11, fill=SUB)
        s += R(482, y - 22, 58, 104, "#fff", INK, 1.5, 4) + T(511, y - 28, "interface", 11, fill=INK)
        s += C(496, y, 6, "#fff", INK, 1.2) + C(496, y + 60, 6, "#fff", INK, 1.2) + "".join(R(518 + i * 5, y + 30 - i * 3, 3, 10 + i * 3, ACC, ACC, .4, 1) for i in range(3))
        s += T(548, y + 4, ch_amp, 11, "start", ACC) + T(548, y + 64, ch_di, 11, "start", INK)
        return s
    o += row(84, "electric guitar", "guitar amp, clean", "SM57, 3 cm", "amp (FX-04.2)", "DI (FX-04.1)")
    o += row(212, "bass", "bass amp", "5–10 cm", "amp (MIX-02.3)", "DI (MIX-01.4)")
    o += T(340, 318, "FX-04.3 bass loop = DI only, no amp. Log the DI-to-amp offset in mix-02-offsets.txt; never align or flip it.", 11, fill=SUB)
    return SVG("DI and amp split", "Two signal paths. Electric guitar into a DI box; the DI's thru output feeds the guitar amp, miked with an SM57-class mic at 3 cm, while the DI's balanced output goes to its own interface channel, both on the same take. Bass the same way: DI output to one channel, the bass amp miked at 5 to 10 cm to another. The FX-04.3 bass loop is DI only.", w, h, o)


def svg_proximity():
    w, h = 640, 300
    o = T(320, 24, "MPR-03 distance ladder, side view (to scale along the ruler)", 13, w="700")
    mx, my = 104, 140   # mouth
    o += head_profile(80, 126, 1)
    px = 36  # px per inch
    o += L(mx, 200, mx + 12 * px, 200, INK, 1.4)
    for d in (1, 2, 4, 8, 12):
        x = mx + d * px
        o += L(x, 192, x, 208, INK, 1.4) + T(x, 224, f"{d} in", 12, fill=INK, w="700")
        if d != 4:
            o += C(x + 7, my, 7, "none", MUTE, 1, "2 2")
    o += L(mx, 192, mx, 208, INK, 1.4) + T(mx, 224, "lips", 11, fill=SUB)
    o += mic(mx + 4 * px + 7, my, -90, "dyn") + L(mx + 4 * px + 40, my, mx + 4 * px + 40, 200, MUTE, 1.2) + T(mx + 4 * px + 44, 186, "stand: height never changes", 11, "start", SUB)
    o += P(f"M{mx + 12 * px} 70 L{mx + 1 * px} 70", "none", ACC, 1.6, None, "ar") + T(mx + 6.5 * px, 62, "record 12 → 8 → 4 → 2 → 1 in on the cardioid dynamic, then the true omni", 12, fill=ACC)
    o += T(mx + 1 * px, 100, "gain set HERE: loudest plosive ≤ −3 dBFS, then taped", 12, "start", RED)
    o += L(mx + 1 * px, 104, mx + 1 * px, 126, RED, 1.2, None, "rd")
    o += T(320, 250, "Measure lips to grille with a ruler every time, on-axis at mouth height; talker seated, head on the headrest marker.", 11, fill=SUB)
    o += T(320, 266, "Same taped gain for every distance (FIXED-GAIN); MATCHED copies are made later to the 12 in take.", 11, fill=SUB)
    o += T(320, 282, "Omni = a TRUE pressure omni, not a multi-pattern LDC switched to omni.", 11, fill=SUB)
    return SVG("Proximity distance ladder", "Side view of a seated talker with a ruler from the lips: marks at 1, 2, 4, 8 and 12 inches. The cardioid dynamic is shown at 4 inches with dashed ghost positions at the other marks. Record from 12 inches in to 1 inch, then repeat on the true omni. Gain is set at 1 inch so the loudest plosive peaks no higher than −3 dBFS and is then taped for every distance.", w, h, o)


def svg_plosive():
    w, h = 640, 380
    o = T(320, 24, "MPR-04a plosive takes, side view — same mouth position, same taped gain", 13, w="700")
    rows = [("POP FILTER", "6 in fabric or metal-mesh disc, 2 in in front of the grille", "first"),
            ("FOAM", "the maker's foam, fitted snugly", "second"),
            ("NONE", "no barrier — set the gain here (worst pop −3 dBFS), record LAST", "last")]
    px = 34  # px per inch
    for i, (lab, note, order) in enumerate(rows):
        y = 90 + i * 100
        o += head_profile(70, y - 14, 1)
        mx = 91 + 3 * px
        o += ldc_side(mx + 11, y, 52)
        if lab == "POP FILTER":
            fx = mx - 2 * px
            o += f'<ellipse cx="{fx:.1f}" cy="{y}" rx="4" ry="24" fill="{ACCL}" fill-opacity=".6" stroke="{ACC}" stroke-width="1.5"/>' + P(f"M{fx} {y + 24} Q{fx + 30} {y + 40} {mx + 4} {y + 30}", "none", MUTE, 1.2)
            o += DIM(fx, y - 32, mx, y - 32, "2 in", 0, -5, 11)
        if lab == "FOAM":
            o += R(mx - 3, y - 22, 28, 44, "none", ACC, 2, 12, "2 2")
        o += DIM(93, y + 36, mx, y + 36, "3 in mouth → grille", 0, 14, 11)
        o += T(250, y - 10, lab, 13, "start", RED if lab == "NONE" else ACC, "700") + T(250, y + 8, note, 12, "start", INK)
        o += T(250, y + 24, f"record {order} for each mic (LDC, then the handheld dynamic)", 11, "start", SUB)
    o += T(320, 368, "Mouth 2–3 in from the grille, on-axis, mouth height (drawn at 3 in so the filter fits). One take holds both plosive lines.", 11, fill=SUB)
    return SVG("Plosive takes, side view", "Three rows, each a talker's head facing a side-address condenser with the mouth 3 inches from the grille. Row 1: a pop filter 2 inches in front of the grille, between mouth and mic. Row 2: a foam windscreen on the mic. Row 3: no barrier; the gain is set on this take so the worst pop peaks at −3 dBFS, and it is recorded last for each mic.", w, h, o)


def svg_offaxis():
    w, h = 640, 300
    o = T(320, 24, "DES-01 placement fix: same 6 in, mic turned 20° off-axis (top view)", 13, w="700")
    hx, hy = 120, 160
    o += person(hx, hy, 90, 1.3)
    cx, cy = hx + 18 + 6 * 22, hy
    o += mic(cx, cy, -90, "ldc", 1.3, dash=True, col=MUTE)
    o += mic(cx, cy, -90 + 20, "ldc", 1.3)
    r = 120
    o += L(cx, cy, cx - r, cy, MUTE, 1, "4 3")
    a = math.radians(20)
    o += L(cx, cy, cx - r * math.cos(a), cy - r * math.sin(a), ACC, 1.2, "4 3")
    o += P(f"M{cx - 70} {cy} A70 70 0 0 1 {cx - 70 * math.cos(a):.1f} {cy - 70 * math.sin(a):.1f}", "none", RED, 1.8) + T(cx - 84, cy - 14, "20°", 13, "end", RED, "700")
    o += DIM(hx + 18, cy + 44, cx, cy + 44, "6 in, mouth to capsule", 0, 18, 12)
    o += TL(cx + 46, cy - 60, ["mic turned 20° horizontally", "away from the mouth", "(protractor on the stand or", "a marked floor line)"], 12, "start", ACC)
    o += TL(cx + 46, cy + 22, ["dashed = the on-axis take", "just before (same gain)"], 12, "start", SUB)
    o += TL(hx - 10, cy - 60, ["talker keeps facing", "where the mic was"], 11, "middle", SUB, 13)
    o += T(320, 272, "Bright cardioid LDC, DRY booth, no fabric pop filter (thin metal mesh is acceptable). Record straight after the on-axis phrase.", 11, fill=SUB)
    return SVG("De-esser off-axis placement", "Top view. The talker faces right. A bright cardioid condenser sits 6 inches from the mouth. The dashed outline is the on-axis position; the solid mic is the same capsule position turned 20 degrees horizontally away from the mouth. The talker keeps facing where the mic was; only the mic turns, at the same gain.", w, h, o)


def svg_grips():
    w, h = 640, 444
    o = T(320, 24, "Handheld dynamic: MPR-06 grips (top) and MPR-05a handling noises (bottom)", 13, w="700")
    grips = [("LOW HANDLE", "hand at the bottom of the handle", "lo"), ("CORRECT", "hand on the upper body, top edge just below the grille rim", "ok"),
             ("GRILLE RIM", "fingertips overlapping the grille rim", "rim"), ("FULL CUP", "hand wrapped round the whole grille", "cup")]
    bx = 70
    for i, (lab, note, k) in enumerate(grips):
        y = 64 + i * 48
        o += handheld_side(bx, y, 150, 14)
        if k == "lo":
            o += hand_on(bx + 134, y)
        elif k == "ok":
            o += hand_on(bx + 38, y)
        elif k == "rim":
            o += hand_on(bx + 22, y) + P(f"M{bx + 10} {y - 10} q-6 6 -2 14", "none", INK, 1.5)
        else:
            o += R(bx - 22, y - 20, 50, 40, "#fff", INK, 1.5, 16) + "".join(L(bx - 12 + j * 9, y - 18, bx - 12 + j * 9, y + 16, MUTE, 1) for j in range(4))
        o += T(270, y - 2, lab, 12, "start", RED if k in ("rim", "cup") else ACC, "700") + T(270, y + 13, note, 11, "start", SUB)
    o += T(320, 258, "MPR-06: mic 2 in from the lips, small speaker 1 m behind (180°) at ≈60 dBA; gain set on CORRECT (−6 dBFS).", 11, fill=SUB)
    y = 340
    o += L(20, 274, 620, 274, LINE, 1)
    o += handheld_side(150, y, 200, 16)
    o += P(f"M{350} {y} q30 0 40 16 t40 16", "none", INK, 1.6)
    o += hand_on(260, y) + P(f"M246 {y - 22} L246 {y - 34} M274 {y - 22} L274 {y - 34}", "none", ACC, 1.2) + P(f"M240 {y - 40} L280 {y - 40}", "none", ACC, 1.4, None, "ar")
    o += T(260, y - 46, "1 grip shuffle ×2", 11, fill=ACC, w="700")
    o += P(f"M208 {y - 32} L208 {y - 12}", "none", ACC, 1.4, None, "ar") + T(204, y - 46, "2 fingertip taps ×3", 11, "end", ACC, "700")
    o += P(f"M372 {y + 34} q10 -16 26 -2", "none", ACC, 1.4, None, "ar") + T(392, y + 52, "3 cable whip ×2 near the mic end", 11, "start", ACC, "700")
    o += C(318, y + 20, 6, "#fff", MUTE, 2) + P(f"M318 {y + 34} L318 {y + 12}", "none", ACC, 1.4, None, "ar") + T(300, y + 52, "4 ring knocks ×2", 11, "end", ACC, "700")
    o += T(320, 424, "MPR-05a: talker standing, mic 2–3 in, gain set on clean S1 (−6 dBFS); same mic, cable and ring; handling peaks ≤ −3 dBFS.", 11, fill=SUB)
    return SVG("Handheld grips and handling noises", "Top: four side views of a handheld dynamic held in the four MPR-06 grips: low on the handle, correct (top edge of the hand just below the grille rim), fingertips over the grille rim, and a full cup around the grille. Bottom: the four MPR-05a handling noises on one mic: re-gripping the handle twice, three fingertip taps, two cable whips near the mic end, and two ring knocks on the handle.", w, h, o)


def svg_spk01():
    w, h = 640, 330
    o = T(320, 24, "SPK-01: rotate the SPEAKER, keep the mic; then move the mic on-axis", 13, w="700")
    sx, sy = 120, 170
    m = 56
    o += C(sx, sy, 30, "#fbfaf7", MUTE, 1.2, "3 2") + T(sx - 38, sy - 4, "turntable /", 11, "end", SUB) + T(sx - 38, sy + 10, "angle marks", 11, "end", SUB)
    o += speaker(sx, sy, 90, 40, 26)
    for a in (15, 30, 45, 60, 90):
        r = math.radians(a)
        o += L(sx, sy, sx + 120 * math.cos(r), sy - 120 * math.sin(r), MUTE, 1, "3 3") + T(sx + 132 * math.cos(r), sy - 132 * math.sin(r) + 4, f"{a}°", 12, "middle", SUB)
    o += L(sx + 14, sy, sx + 8.4 * m, sy, ACC, 1.2)
    for d in (1, 2, 4, 8):
        x = sx + d * m
        o += L(x, sy + 8, x, sy + 18, INK, 1.4) + T(x, sy + 34, f"{d} m", 12, fill=INK, w="700")
    o += mic(sx + 4 * m, sy, -90, "omni", 1.2) + T(sx + 4 * m, sy - 30, "omni fixed at 4 m", 12, fill=ACC, w="700") + T(sx + 4 * m, sy - 16, "for all six angles", 11, fill=ACC)
    o += T(sx + 1 * m, sy + 54, "1 m: set the gain here first", 11, fill=RED) + T(sx + 1 * m, sy + 68, "(peaks −6 dBFS), tape it", 11, fill=RED)
    o += T(sx + 6 * m, sy + 54, "then 2 m and 8 m on-axis;", 11, fill=SUB) + T(sx + 6 * m, sy + 68, "4 m = the 0° take (reuse)", 11, fill=SUB)
    o += T(320, 286, "HF driver and mic both 1.8 m high. ≈ 85 dBA at 4 m on-axis, never changed. Outdoors on a quiet day or a large empty room.", 11, fill=SUB)
    o += T(320, 302, "Each take: 5 s pink noise, then the dry S1. Measure baffle to capsule with a tape. Angles: 0, 15, 30, 45, 60, 90°.", 11, fill=SUB)
    return SVG("Speaker off-axis and distance rig", "Top view. A 2-way speaker sits on a turntable on the left. Rays mark 15, 30, 45, 60 and 90 degree rotations. A measurement omni stays fixed at 4 m on-axis for all angles. Distance marks at 1, 2, 4 and 8 m along the axis: the gain is set at 1 m first and taped, then the mic moves to 2 and 8 m; the 4 m on-axis take reuses the 0 degree take.", w, h, o)


def hall(o_list, x0=40, y0=40, w=560, stage_h=80, balcony=True, hgt=420):
    """common venue plan outline"""
    o = R(x0, y0, w, hgt, "#fff", INK, 2.5, 4)
    o += R(x0 + 70, y0, w - 140, stage_h, "#fbfaf7", INK, 1.4, 2) + T(x0 + 78, y0 + 16, "stage", 11, "start", SUB)
    if balcony:
        o += R(x0, y0 + hgt - 80, w, 80, "#fbfaf7", MUTE, 1, 0, "6 4") + T(x0 + 8, y0 + hgt - 64, "balcony overhead", 11, "start", SUB)
    return o


def svg_ss03b():
    w, h = 640, 492
    o = T(320, 24, "SS-03b seat map — PA fixed, head moves seat to seat", 13, w="700")
    o += hall(None, 40, 40, 560, 80, True, 400)
    o += speaker(120, 130, 180, 40, 26) + speaker(520, 130, 180, 40, 26) + T(120, 172, "L main", 11, fill=SUB) + T(520, 172, "R main", 11, fill=SUB)
    o += T(320, 98, "PA ≈ 75–80 dBA at FOH, never changed", 12, fill=ACC)
    for yy in range(190, 430, 22):
        o += L(150, yy, 490, yy, LINE, 1)
    seats = [("front seats", 205), ("middle", 285), ("back", 350), ("under the balcony", 410)]
    for lab, y in seats:
        o += dummy_head(320, y, 0) + T(344, y + 5, lab, 12, "start", ACC, "700")
    o += R(170, 300, 70, 30, "#fff", INK, 1.4, 4) + T(205, 320, "FOH", 11, fill=INK)
    o += speaker(560, 392, 200, 30, 20) + T(538, 400, "delay / fill", 11, "end", SUB)
    o += T(320, 462, "At each seat: binaural head (or ORTF) at seated ear height; tape the spot. Log distance from the PA and dBA.", 11, fill=SUB)
    o += T(320, 478, "Male passage at all four seats, then female — without touching the PA.", 11, fill=SUB)
    return SVG("Speech intelligibility seat map", "A venue plan with the stage and left and right mains at the top, the front-of-house desk in the room, and a balcony over the back. Four seat positions on the centre line: front, middle, back and under the balcony, each with a binaural dummy head at seated ear height. The PA plays at a fixed level of about 75 to 80 dBA at front of house. Seat distances are not specified: measure and log them.", w, h, o)


def svg_chain_safe1():
    w, h = 640, 320
    o = T(320, 24, "SAFE-1 fault bench: line capture, faults made on the SIGNAL side only", 13, w="700")
    o += L(20, 70, 300, 70, INK, 3) + T(26, 62, "wall", 11, "start", SUB)
    o += outlet(80, 92) + outlet(240, 92) + T(80, 124, "circuit A", 11, fill=SUB) + T(240, 124, "circuit B", 11, fill=SUB)
    o += T(160, 96, "both earthed ✓", 11, fill=ACC)
    o += R(40, 160, 80, 44, "#fff", INK, 1.5, 4) + T(80, 186, "device 1", 11) + R(200, 160, 80, 44, "#fff", INK, 1.5, 4) + T(240, 186, "device 2", 11)
    o += L(80, 106, 80, 160, MUTE, 1.6) + L(240, 106, 240, 160, MUTE, 1.6)
    o += P("M120 182 C150 210 170 210 200 182", "none", RED, 2) + T(160, 222, "unbalanced link = the loop", 11, fill=RED)
    o += L(280, 182, 330, 182, INK, 1.6, None, "ak")
    o += R(334, 158, 96, 48, ACCL, ACC, 1.4, 6) + TL(382, 176, ["fix: isolation", "transformer or", "DI ground-lift"], 11, "middle", ACC, 12)
    o += L(430, 182, 470, 182, INK, 1.6, None, "ak") + recorder(520, 182, 92, 50) + T(520, 224, "interface line in:", 11) + T(520, 238, "gain at MINIMUM, then up", 11, fill=RED)
    o += headphones(600, 120, 1.1) + L(566, 160, 594, 136, MUTE, 1.2) + TL(600, 72, ["phones LOW,", "limiter on the", "monitor bus"], 11, "middle", INK, 12)
    o += R(20, 262, 600, 44, REDL, RED, 1.4, 6)
    o += TL(320, 280, ["NEVER lift or defeat a mains safety earth — no lifted pins, no “cheater” adapters.", "Hum, buzz, RF, crackle, clock and dropout captures are LINE level, never through speakers."], 12, "middle", RED, 15)
    return SVG("SAFE-1 line-capture bench", "Two mains-earthed devices plugged into properly earthed outlets on different circuits, joined by an unbalanced cable, which forms the ground loop. The fix goes in the signal line: an isolation transformer or a DI ground-lift. The signal goes into the interface's line input with the gain at minimum first. Monitoring is on headphones at low level with a limiter. A red banner says never lift or defeat a mains safety earth.", w, h, o)


def svg_chain_safe3():
    w, h = 640, 280
    o = T(320, 24, "SAFE-3 phantom / hot-plug bench: recorder only", 13, w="700")
    o += mic(70, 130, 90, "ldc", 1.5) + stand_legs(50, 170, 16) + L(50, 140, 50, 170, MUTE, 1.6)
    o += T(70, 186, "robust condenser", 11, fill=ACC) + T(70, 200, "(never a ribbon)", 11, fill=RED)
    o += P("M118 130 C160 130 170 150 210 150", "none", INK, 2) + T(164, 124, "XLR", 11, fill=SUB)
    o += R(214, 116, 130, 70, "#fff", INK, 1.5, 6) + T(279, 134, "preamp / recorder", 11, w="700")
    o += R(226, 144, 34, 18, REDL, RED, 1.2, 3) + T(243, 157, "+48 V", 11, fill=RED) + C(300, 154, 10, "#fff", INK, 1.4) + L(300, 154, 293, 147, INK, 1.6) + T(300, 178, "gain MIN", 11, fill=INK)
    o += L(344, 150, 394, 150, INK, 1.6, None, "ak") + recorder(440, 150, 82, 46) + T(440, 190, "recorder only", 11)
    o += speaker_front(560, 140, 40, 66, cross=True) + T(560, 196, "NO loudspeakers", 11, fill=RED, w="700") + T(560, 210, "anywhere in the path", 11, fill=RED)
    o += T(320, 240, "CAB-04: switch +48 V on, wait, switch off; let phantom drain fully before unplugging or the next take.", 11, fill=SUB)
    o += T(320, 256, "Hot-plug pops: TS or RCA into a live LINE input. Never phantom on ribbons or unbalanced gear. Do this set last.", 11, fill=SUB)
    return SVG("SAFE-3 phantom and hot-plug bench", "A robust condenser on a stand connects by XLR to a preamp whose +48 V switch is the event being recorded, with the gain at minimum. Its output goes to a recorder only. A loudspeaker is crossed out in red: no loudspeakers anywhere in the path. Notes: let phantom drain between takes; never phantom on ribbons or unbalanced gear.", w, h, o)


def svg_chain_amp():
    w, h = 640, 290
    o = T(320, 24, "AMP-01: amplifier clipping goes into a dummy load, never a speaker", 13, w="700")
    y = 120
    o += laptop(50, y) + T(50, y + 34, "house mix", 11) + T(50, y + 48, "(MST-01.1, mono)", 11, fill=SUB)
    o += L(82, y, 104, y, INK, 1.6, None, "ak") + console(150, y, 86, 50, 5) + T(150, y + 40, "console", 11)
    o += L(193, y, 213, y, INK, 1.6, None, "ak") + R(216, y - 20, 70, 40, "#fff", INK, 1.5, 4) + TL(251, y - 4, ["processor", "limiter"], 11, "middle", INK, 12) + T(251, y + 34, "(AMP-01.6)", 11, fill=SUB)
    o += L(286, y, 306, y, INK, 1.6, None, "ak") + R(308, y - 26, 84, 52, "#fff", INK, 1.6, 4)
    o += "".join(L(316 + i * 8, y - 20, 316 + i * 8, y - 8, MUTE, 1.4) for i in range(9)) + C(320, y + 12, 5, "#fff", INK, 1.2) + C(372, y + 10, 3, RED, RED, 1)
    o += T(350, y + 42, "Class AB amp", 11) + T(372, y - 32, "clip", 11, fill=RED)
    o += L(392, y, 412, y, INK, 2, None, "ak") + dummy_load(452, y, 76, 44) + T(452, y + 38, "dummy load", 11, w="700") + T(452, y + 52, "rated > amp output", 11, fill=RED)
    o += L(490, y, 506, y, INK, 1.6, None, "ak") + R(508, y - 18, 50, 36, "#fff", INK, 1.5, 4) + C(522, y, 6, "#fff", INK, 1.2) + T(546, y + 4, "−dB", 11, fill=INK)
    o += T(533, y + 34, "attenuator", 11) + T(533, y + 48, "/ line tap", 11)
    o += L(558, y, 572, y, INK, 1.6, None, "ak") + recorder(600, y, 50, 40) + T(600, y + 34, "interface", 11)
    o += speaker_front(452, 212, 34, 50, cross=True) + T(500, 210, "never real speakers", 12, "start", RED, "700")
    o += T(320, 258, "Capture gain set ONCE on the hard-clip take (peaks ≤ −3 dBFS) and taped. Keep hard-clip takes short: the load heats.", 11, fill=SUB)
    o += T(320, 274, "Record clean → just clipping → hard clip without re-trimming the recorder. AMP-01.4/.5 are the one loudness-matched pair.", 11, fill=SUB)
    return SVG("Amplifier clipping chain", "The house mix from a laptop feeds a console, an optional processor limiter for the limiter take, then a Class AB power amp. The amp drives a dummy load whose rating exceeds the amp's output, through a rated attenuator or line tap into the interface. A crossed-out speaker: never real speakers.", w, h, o)


def svg_chain_ir():
    w, h = 640, 310
    o = T(320, 24, "Impulse-response sweep chain (WAV-02, WAV-04, RD-01)", 13, w="700")
    y = 112
    o += laptop(52, y) + TL(52, y + 34, ["10 s log sweep", "20 Hz–20 kHz"], 11, "middle", INK, 13)
    o += L(84, y, 112, y, INK, 1.6, None, "ak") + recorder(148, y, 64, 40) + T(148, y + 34, "interface out", 11)
    o += L(180, y, 206, y, INK, 1.6, None, "ak") + speaker_front(232, y, 40, 64) + TL(232, y + 46, ["powered speaker", "or dodecahedron,", "1.5 m high,", "≥ 1 m from walls"], 11, "middle", INK, 13)
    o += P(f"M262 {y - 18} Q300 {y - 40} 340 {y - 18} M262 {y} Q300 {y - 14} 340 {y} M262 {y + 18} Q300 {y + 12} 340 {y + 18}", "none", MUTE, 1.2)
    o += T(300, y - 46, "room", 11, fill=SUB)
    o += mic(366, y, -90, "omni", 1.1) + mic(366, y + 30, -78, "sdc") + mic(366, y - 30, -102, "sdc")
    o += TL(372, y + 62, ["omni + ORTF", "at 1.2 m"], 11, "middle", ACC, 13)
    o += L(408, y, 430, y, INK, 1.6, None, "ak") + recorder(462, y, 60, 40) + T(462, y + 34, "recorder", 11) + T(462, y + 48, "(archive raw sweeps)", 11, fill=SUB)
    o += L(494, y, 512, y, INK, 1.6, None, "ak") + R(514, y - 26, 110, 52, ACCL, ACC, 1.4, 6) + TL(569, y - 8, ["deconvolve with", "the inverse filter;", "trim, 10 ms end fade"], 11, "middle", ACC, 13)
    o += T(569, y + 44, "IR peak ≤ −3 dBFS", 11, fill=ACC, w="700")
    o += R(20, 226, 600, 64, REDL, RED, 1.4, 6)
    o += TL(320, 246, ["≈ 85 dBA at the mic — everyone in the room wears hearing protection.", "Warn building occupants before sweeps. Balloon pops are loud close up.", "EAR-05 plate/spring: the unit replaces speaker + mic (line in, line out, no SPL)."], 12, "middle", RED, 16)
    return SVG("Impulse-response sweep chain", "A laptop plays a 10 second log sweep from 20 Hz to 20 kHz through the interface output into a powered speaker or dodecahedron at 1.5 m height, at least 1 m from walls. An omni and an ORTF pair at 1.2 m pick it up into the recorder; raw sweeps are archived. The sweep is deconvolved with its inverse filter, trimmed with a 10 ms end fade, IR peak no higher than −3 dBFS. Red note: about 85 dBA at the mic, hearing protection for everyone, warn occupants.", w, h, o)


# ================================================================ SESSION FLOOR PLANS
def svg_plan1():
    w, h = 640, 470
    o = T(320, 24, "Session 1 — booth and control room (plan view, not to scale)", 13, w="700")
    o += R(16, 40, 404, 414, "#fff", INK, 2.5, 4) + T(28, 60, "Vocal booth — treated, RT60 ≤ 0.3 s, HVAC off", 12, "start", SUB)
    o += R(436, 40, 188, 414, "#fff", INK, 2.5, 4) + T(530, 60, "Control room", 12, fill=SUB)
    o += R(417, 130, 22, 90, ACCL, ACC, 1, 2) + T(446, 236, "window", 11, "start", SUB)
    tx, ty = 64, 160
    o += P(f"M{tx - 26} {ty - 18} Q{tx - 34} {ty} {tx - 26} {ty + 18}", "none", ACC, 3) + person(tx, ty, 90)
    o += TL(tx, ty + 36, ["talker, head on", "headrest marker"], 11, "middle", INK, 13)
    mx, my = 170, 160
    o += C(mx, my, 44, "none", MUTE, 1, "4 3") + "".join(L(mx + 44 * math.cos(math.radians(a)), my + 44 * math.sin(math.radians(a)), mx + 50 * math.cos(math.radians(a)), my + 50 * math.sin(math.radians(a)), MUTE, 1.2) for a in range(0, 360, 30))
    o += mic(mx, my, -90, "ldc")
    o += DIM(tx + 13, my - 22, mx - 10, my - 22, "30 cm", 0, -5, 11)
    o += T(mx, 104, "A: floor protractor under the capsule", 11, fill=ACC)
    rx, ry = 150, 214
    o += mic(rx, ry, ang_to(rx, ry, tx + 12, ty + 4), "sdc", col=MUTE) + T(rx + 8, ry + 30, "reference mic 30 cm, never moved", 11, fill=SUB)
    o += speaker(282, my, -90, 30, 20) + DIM(186, my + 40, 270, my + 40, "1 m (D)", 0, -5, 11)
    o += TL(306, my + 22, ["D: rear speaker", "180°, ≈60 dBA"], 11, "start", INK, 13)
    o += R(318, 82, 76, 36, "#fff", INK, 1.4, 4) + P("M318 82 q10 -8 19 0 t19 0 t19 0 t19 0", "none", MUTE, 1.4) + T(356, 104, "iso box", 11, fill=INK)
    o += T(356, 134, "MSL-02 / GAN-01", 11, fill=SUB)
    o += TL(28, 272, ["Same talker spot; the mic changes per setup:", "B proximity 12 → 1 in · C plosives 2–3 in", "D handheld 2 in + rear speaker 1 m behind", "E house LDC 8 in (SS-03a 20 cm) · F bright LDC 6 in", "G singing LDC 8 in · H eight-mic cluster at 8 in"], 11, "start", INK, 15)
    o += table(130, 376, 150, 36) + person(110, 394, 90) + person(300, 394, -90)
    o += mic(146, 394, -90, "dyn", .9) + mic(264, 394, 90, "dyn", .9)
    o += T(205, 368, "I: podcast — dynamics at 10 cm", 11, fill=ACC) + T(205, 430, "clap slate · 30 s room tone", 11, fill=SUB)
    o += console(530, 128, 140, 56, 8) + TL(530, 176, ["interface / preamps", "gains taped + logged"], 11, "middle", INK, 13)
    o += laptop(530, 262) + TL(530, 296, ["remote guest call;", "tuner drone (A2, A3)"], 11, "middle", INK, 13)
    o += headphones(530, 370, 1.1) + TL(530, 404, ["talkback + phones", "(closed-back, low)"], 11, "middle", INK, 13)
    return SVG("Session 1 floor plan", "Plan of the vocal booth and control room. The talker sits on the left with the head on a headrest marker. The multi-pattern condenser stands 30 cm away over a floor protractor; a reference mic 30 cm away is never moved. For setup D a small speaker stands 1 m behind the mic. An isolation box sits in the corner for the self-noise captures. A podcast table with two dynamics at 10 cm is at the bottom. The control room holds the interface, a laptop for the remote call and drone, and the headphone feed.", w, h, o)


def svg_plan2():
    w, h = 640, 480
    o = T(320, 24, "Session 2 — untreated medium room (plan view, not to scale)", 13, w="700")
    o += R(16, 40, 608, 424, "#fff", INK, 2.5, 4) + T(28, 60, "Wooden floor · RT60 ≈ 0.6–0.8 s · HVAC switchable", 12, "start", SUB)
    o += R(470, 36, 80, 10, "#fff", INK, 1.4, 2) + "".join(L(476 + i * 8, 38, 476 + i * 8, 44, INK, 1) for i in range(9)) + T(510, 60, "HVAC grille", 11, fill=SUB)
    o += table(36, 82, 220, 56) + speaker(64, 110, 90, 26, 18) + mic(226, 110, -90, "omni")
    o += DIM(76, 74, 222, 74, "1 m", 0, -4, 11)
    o += TL(146, 156, ["B · WAV-03: speaker 35 cm above the table;", "omni at 2 / 6 / 12 / 24 in, then boundary"], 11, "middle", ACC, 13)
    tx, ty = 520, 240
    o += person(tx, ty, -90) + T(tx + 2, ty + 34, "talker", 11, fill=INK)
    mouth = tx - 13
    for d, off in [(4, 32), (6, 48), (12, 84), (24, 140), (48, 250)]:
        x = mouth - off
        o += L(x, ty + 16, x, ty + 28, RED, 3) + T(x, ty + 44, f"{d}", 11, fill=RED, w="700")
    o += T(mouth - 140, ty + 60, "tape marks, inches mouth → capsule", 11, fill=RED)
    o += mic(mouth - 32, ty - 5, 90, "dyn", .9) + mic(mouth - 32, ty + 6, 90, "omni", .9)
    o += TL(mouth - 150, ty - 50, ["A · MPR-02: dynamic + omni on one bar,", "capsules touching; stand moves out"], 11, "middle", ACC, 13)
    o += T(tx, ty - 26, "D · MPR-05a here", 11, fill=ACC)
    o += C(560, 120, 9, "#fff", RED, 1.5) + P("M560 129 q-3 8 2 14", "none", RED, 1) + T(560, 152, "balloon", 11, fill=RED)
    o += mic(380, 120, 90, "omni") + DIM(392, 104, 548, 104, "3–4 m", 0, -5, 11) + T(400, 150, "TL-01 omni, 1.2 m high", 11, fill=ACC)
    o += table(36, 330, 170, 56) + mic(100, 372, 180, "ldc") + person(100, 418, 0)
    o += C(150, 352, 5, "#fff", INK, 1.4)
    o += T(36, 322, "C · MPR-05b desk: ball drop 30 cm from base", 11, "start", ACC)
    o += stand_legs(264, 372, 14) + mic(264, 372, 180, "ldc") + person(264, 420, 0)
    o += L(330, 336, 330, 450, MUTE, 1.5, "6 4") + DIM(272, 352, 328, 352, "1 m", 0, -5, 11) + T(336, 446, "walk path", 11, "start", SUB)
    o += T(264, 460, "C · floor stand + footsteps", 11, fill=ACC)
    o += person(560, 410, -60) + L(612, 452, 590, 400, INK, 2) + mic(574, 390, ang_to(574, 390, 552, 404), "shotgun", .7)
    o += TL(470, 360, ["E · PROD-03 boom: shotgun", "60 cm above + in front"], 11, "middle", ACC, 13)
    o += recorder(585, 306, 56, 32) + T(585, 336, "recorder", 11)
    return SVG("Session 2 floor plan", "Plan of the untreated medium room. Top left: the WAV-03 table, a small speaker 1 m from the omni position. Top right: a balloon at the source and an omni 3 to 4 m away for TL-01. Middle right: the talker with tape marks at 4, 6, 12, 24 and 48 inches for MPR-02 and the dynamic and omni on one bar. Bottom left: a desk with a condenser on a desk stand for the ball-drop knocks, and a floor stand with a walking path 1 m away. Bottom right: a boom shotgun 60 cm above and in front of a talker for PROD-03.", w, h, o)


def drumkit_small(x, y, ang=0, s=1.0):
    b = (f'<rect x="-14" y="-40" width="28" height="56" rx="4" fill="#fff" stroke="{INK}" stroke-width="1.4"/>'
         f'<circle cx="-28" cy="8" r="13" fill="#fff" stroke="{INK}" stroke-width="1.3"/><circle cx="34" cy="14" r="16" fill="#fff" stroke="{INK}" stroke-width="1.3"/>'
         f'<circle cx="-12" cy="-30" r="11" fill="#fff" stroke="{INK}" stroke-width="1.3"/><circle cx="-56" cy="-2" r="13" fill="#fff" stroke="{MUTE}" stroke-width="1.2"/>'
         f'<circle cx="-44" cy="-44" r="18" fill="none" stroke="{MUTE}" stroke-width="1"/><circle cx="44" cy="-30" r="20" fill="none" stroke="{MUTE}" stroke-width="1"/>'
         f'<ellipse cx="0" cy="44" rx="18" ry="8" fill="#fff" stroke="{INK}" stroke-width="1.3"/><circle cx="0" cy="38" r="8" fill="#fff" stroke="{INK}" stroke-width="1.3"/>')
    return G(x, y, ang, b, s)


def svg_plan3():
    w, h = 680, 520
    o = T(340, 24, "Session 3 — studio, tracking days (plan view, not to scale)", 13, w="700")
    o += R(16, 40, 420, 310, "#fff", INK, 2.5, 4) + T(28, 60, "Live room (RT60 ≈ 0.8 s)", 12, "start", SUB)
    o += R(452, 40, 212, 136, "#fff", INK, 2.5, 4) + T(558, 60, "Amp isolation", 12, fill=SUB)
    o += R(452, 192, 212, 158, "#fff", INK, 2.5, 4) + T(558, 212, "Vocal booth", 12, fill=SUB)
    o += R(16, 366, 648, 140, "#fff", INK, 2.5, 4) + T(28, 386, "Control room", 12, "start", SUB)
    o += drumkit_small(150, 150, 180, 1.0) + TL(222, 82, ["kit: close mics + overheads", "(see the drum figures)"], 11, "start", ACC, 13)
    o += mic(110, 300, 0, "ldc") + mic(190, 300, 0, "ldc")
    o += L(150, 206, 150, 288, MUTE, 1.2, "4 4", "dm", "dm") + T(156, 252, "3–4 m", 11, "start", SUB) + DIM(110, 330, 190, 330, "1–2 m", 0, 14, 11)
    o += T(206, 304, "room pair", 11, "start", ACC)
    o += G(392, 130, 0, f'<rect x="-26" y="-18" width="52" height="36" rx="4" fill="#fff" stroke="{INK}" stroke-width="1.5"/><line x1="-24" y1="-16" x2="24" y2="-16" stroke="{INK}" stroke-width="3"/>')
    o += mic(392, 100, 180, "dyn", .9) + TL(372, 166, ["bass amp, faced away", "from the room pair"], 11, "middle", INK, 13)
    o += piano_top(330, 330, .5) + T(324, 330, "piano", 11, "end", SUB)
    o += TL(296, 208, ["MPR-07 later: arrays 2 m from", "the performance line, 1.5 m high"], 11, "middle", ACC, 13)
    o += G(486, 112, 90, f'<rect x="-30" y="0" width="60" height="30" rx="4" fill="#fff" stroke="{INK}" stroke-width="1.5"/><line x1="-28" y1="1.5" x2="28" y2="1.5" stroke="{INK}" stroke-width="3"/>')
    o += mic(500, 112, -90, "dyn", .9) + mic(630, 112, -90, "ldc", .9)
    o += DIM(510, 140, 620, 140, "1.5–2 m", 0, 16, 11) + T(500, 92, "3 cm", 11, "start", ACC) + T(470, 168, "guitar amp", 11, "start", SUB)
    o += person(512, 280, 90) + mic(586, 280, -90, "ldc") + L(560, 262, 560, 298, ACC, 3)
    o += TL(558, 318, ["lead 15–20 cm, pop filter", "5 cm; BGV at 30 cm"], 11, "middle", ACC, 13)
    o += console(250, 440, 260, 60, 14) + T(250, 488, "console / interface", 11)
    o += speaker(140, 412, 20, 26, 18, waves=False) + speaker(360, 412, -20, 26, 18, waves=False)
    o += di_box(460, 430, "DI boxes") + di_box(510, 430, "", False)
    o += R(560, 410, 90, 40, "#fff", INK, 1.4, 4) + TL(605, 426, ["plate / spring", "(EAR-05, line)"], 11, "middle", INK, 13)
    o += T(500, 486, "click: 80 / 96 / 100 BPM · tuner", 11, fill=SUB)
    return SVG("Session 3 floor plan", "Studio plan. The live room holds the drum kit facing a room pair 3 to 4 m in front, 1 to 2 m apart; the bass amp faces away from the room pair; the piano sits in the corner. The amp isolation room has the guitar amp with a close mic at 3 cm and a room mic 1.5 to 2 m away. The vocal booth has the lead singer 15 to 20 cm from a condenser with a pop filter. The control room has the console, monitors, DI boxes and the plate and spring units.", w, h, o)


def svg_plan4():
    w, h = 680, 460
    o = T(340, 24, "Session 4 — electrical bench (plan view, not to scale)", 13, w="700")
    o += L(16, 44, 664, 44, INK, 3) + T(22, 38, "wall", 11, "start", SUB)
    o += outlet(120, 66) + outlet(260, 66) + T(104, 70, "circuit A", 11, "end", SUB) + T(244, 70, "circuit B", 11, "end", SUB) + T(190, 96, "earthed ✓", 11, fill=ACC)
    o += R(16, 110, 648, 170, "#fbfaf7", "#a08a68", 1.4, 6) + T(26, 128, "bench", 11, "start", SUB)
    o += recorder(70, 186, 80, 46) + T(70, 226, "interface (line)", 11) + headphones(70, 258, .9) + T(110, 262, "limiter", 11, "start", SUB)
    o += R(140, 140, 64, 34, "#fff", INK, 1.4, 4) + T(172, 162, "device 1", 11) + R(228, 140, 64, 34, "#fff", INK, 1.4, 4) + T(260, 162, "device 2", 11)
    o += L(120, 80, 160, 140, MUTE, 1.4) + L(260, 80, 260, 140, MUTE, 1.4) + P("M204 166 Q216 182 228 166", "none", RED, 2) + T(216, 194, "ground loop", 11, fill=RED)
    o += di_box(180, 236, "DI + lift") + R(234, 222, 62, 28, "#fff", INK, 1.4, 4) + T(265, 241, "iso xfmr", 11)
    o += console(370, 160, 92, 50, 6) + T(370, 200, "console", 11)
    o += R(336, 222, 70, 26, "#fff", INK, 1.4, 4) + T(371, 240, "processor", 11)
    o += R(430, 140, 76, 46, "#fff", INK, 1.5, 4) + "".join(L(436 + i * 8, 146, 436 + i * 8, 158, MUTE, 1.3) for i in range(8)) + T(468, 178, "power amp", 11)
    o += dummy_load(570, 150, 76, 36) + dummy_load(570, 208, 76, 36) + T(570, 240, "2 dummy loads +", 11) + T(570, 254, "rated attenuators", 11)
    o += L(506, 163, 532, 150, INK, 1.4) + L(506, 163, 532, 208, INK, 1.4)
    # floor / shelf items
    o += C(70, 330, 12, "#fff", INK, 1.4) + R(64, 342, 12, 8, "#fff", INK, 1.2, 1) + R(96, 322, 46, 30, "#fff", INK, 1.4, 4) + T(119, 341, "dimmer", 11)
    o += T(100, 372, "lamp ≈ 50%", 11, fill=SUB)
    o += P("M150 330 C200 300 230 360 280 330 C330 300 360 360 410 330", "none", ACC, 2) + P("M150 340 C200 310 230 370 280 340 C330 310 360 370 410 340", "none", MUTE, 2)
    o += T(280, 372, "two 15 m runs (TS + XLR) along the dimmer load cable", 11, fill=SUB)
    o += R(430, 318, 14, 24, "#fff", INK, 1.4, 3) + T(437, 360, "2G phone", 11)
    o += R(470, 318, 42, 26, "#fff", INK, 1.4, 4) + C(482, 331, 6, "#fff", INK, 1) + T(491, 360, "AM radio", 11)
    o += R(530, 318, 56, 26, "#fff", INK, 1.4, 3) + "".join(C(538 + i * 10, 331, 2.5, "#fff", INK, .9) for i in range(5)) + T(558, 360, "patchbay", 11)
    o += mic(626, 318, 0, "ldc") + T(626, 364, "condenser", 11) + T(626, 378, "(last)", 11, fill=RED)
    o += R(16, 392, 648, 52, REDL, RED, 1.4, 6)
    o += TL(340, 412, ["NO loudspeakers anywhere on this bench · never lift a mains earth", "Line captures start at minimum gain · phantom and hot-plug takes last, at minimum gain"], 12, "middle", RED, 16)
    return SVG("Session 4 floor plan", "Bench plan. Two earthed outlets on different circuits on the wall. On the bench: the interface with limited headphones; two devices joined by an unbalanced cable forming the ground loop, with a DI ground-lift and an isolation transformer as the fixes; a console, processor and power amp into two dummy loads with rated attenuators. Beside the bench: a dimmer and lamp, two 15 m cable runs along the dimmer load cable, a 2G phone, an AM radio, a patchbay and a condenser mic for the last captures. A red banner: no loudspeakers, never lift a mains earth.", w, h, o)


def svg_plan5():
    w, h = 640, 520
    o = T(320, 24, "Session 5 — venue with a PA (plan view, not to scale)", 13, w="700")
    o += hall(None, 40, 40, 560, 110, True, 440)
    o += R(280, 54, 80, 40, "#fff", INK, 1.2, 2) + T(276, 70, "riser", 11, "end", SUB)
    o += speaker(110, 150, 180, 40, 26) + speaker(530, 150, 180, 40, 26) + T(110, 192, "L top + sub", 11, fill=SUB) + T(530, 192, "R top + sub", 11, fill=SUB)
    o += person(320, 70, 180, .9) + mic(320, 94, 0, "dyn", .8) + wedge(320, 128, 0, .9)
    o += DIM(352, 94, 352, 128, "1 m", 4, 4, 11, SUB, "start") + TL(372, 62, ["SS-01: vocal mic", "1 m from the wedge"], 11, "start", ACC, 13)
    o += dummy_head(180, 84, 180) + T(180, 112, "drummer pos.", 11, fill=SUB) + T(180, 126, "SS-04 binaural", 11, fill=ACC)
    o += dummy_head(500, 84, 180) + T(500, 112, "guitar pos.", 11, fill=SUB)
    for yy in range(214, 470, 22):
        o += L(150, yy, 490, yy, LINE, 1)
    for lab, y in [("front", 230), ("middle", 310), ("back (centre: SS-02A)", 380), ("under balcony", 446)]:
        o += dummy_head(320, y, 0, .9) + T(340, y + 5, lab, 11, "start", ACC)
    o += R(166, 288, 80, 36, "#fff", INK, 1.4, 4) + T(206, 311, "FOH desk", 11)
    o += T(206, 340, "mute person", 11, fill=RED) + T(206, 354, "(SAFE-2)", 11, fill=RED)
    o += speaker(560, 430, 200, 30, 20) + T(538, 440, "delay / fill", 11, "end", SUB)
    o += T(320, 498, "SS-03b / SS-02A / SS-04: binaural head at seated or performer ear height; log each seat's distance from the PA and dBA.", 11, fill=SUB)
    o += T(320, 512, "SPK-01: outdoors or the empty hall — see its figure. Everyone: −25 dB plugs for feedback and sweeps.", 11, fill=SUB)
    return SVG("Session 5 floor plan", "Venue plan. The stage at the top with a riser, the singer, a wedge 1 m from the vocal mic for SS-01, and binaural head positions for the drummer and guitarist. Left and right tops with subs at the stage edges. In the room: rows of seats with binaural head positions front, middle, back and under the balcony, the front-of-house desk where the mute person sits, and a delay or fill speaker under the balcony.", w, h, o)


def svg_plan6():
    w, h = 640, 640
    o = T(320, 24, "Session 6 — spaces and field: six layouts (not to scale)", 13, w="700")
    pw, ph = 300, 190
    pos = [(14, 40), (326, 40), (14, 240), (326, 240), (14, 440), (326, 440)]

    def panel(i, title):
        x, y = pos[i]
        return R(x, y, pw, ph, "#fff", LINE, 1.2, 8) + T(x + 10, y + 18, title, 12, "start", INK, "700"), x, y
    # 1 field
    s, x, y = panel(0, "Open field · WAV-01 (still air)")
    s += L(x + 10, y + 150, x + pw - 10, y + 150, "#7a9a5a", 1.4) + "".join(P(f"M{x + 16 + i * 14} {y + 150} l3 -7 l3 7", "none", "#7a9a5a", 1) for i in range(20))
    s += person(x + 100, y + 96, 90) + mic(x + 170, y + 96, -90, "omni") + DIM(x + 112, y + 70, x + 166, y + 70, "1 m", 0, -5, 11)
    s += TL(x + 150, y + 172, ["omni 1.5 m high, wind cover", "≥ 30 m from any building, wall, tree"], 11, "middle", SUB, 13)
    o += s
    # 2 wall
    s, x, y = panel(1, "Large flat wall · WAV-04")
    s += R(x + 14, y + 34, 12, 120, "#f3f0e8", INK, 2, 1) + T(x + 20, y + 168, "wall", 11, fill=SUB)
    s += person(x + 190, y + 96, -90) + mic(x + 230, y + 90, -90, "omni") + mic(x + 230, y + 104, -100, "sdc", .8)
    s += DIM(x + 28, y + 60, x + 176, y + 60, "15–25 m (log it)", 0, -5, 11) + DIM(x + 200, y + 126, x + 228, y + 126, "1 m", 0, 14, 11)
    s += T(x + 150, y + 172, "omni + ORTF 1.5 m high; source 1 m in front", 11, fill=SUB)
    o += s
    # 3 wind
    s, x, y = panel(2, "Wind · MPR-04b (10–20 km/h)")
    s += "".join(L(x + 20, y + 60 + i * 22, x + 70, y + 60 + i * 22, ACC, 1.4, None, "ar") for i in range(4)) + T(x + 44, y + 52, "wind", 11, fill=ACC)
    s += mic(x + 150, y + 96, 90, "shotgun", .8) + person(x + 240, y + 96, -90)
    s += DIM(x + 194, y + 128, x + 228, y + 128, "60 cm", 0, 14, 11)
    s += TL(x + 150, y + 64, ["shotgun 1.5 m high,", "side-on to the wind"], 11, "middle", ACC, 13)
    s += T(x + 150, y + 172, "log the anemometer reading every take", 11, fill=SUB)
    o += s
    # 4 road / plant
    s, x, y = panel(3, "Road, street, plant · NOI-01a, PROD-04a")
    s += R(x + 10, y + 36, pw - 20, 30, "#f3f0e8", MUTE, 1, 2) + L(x + 14, y + 51, x + pw - 14, y + 51, "#fff", 2, "10 8")
    s += R(x + 60, y + 41, 30, 14, "#fff", INK, 1.2, 4) + R(x + 180, y + 43, 34, 14, "#fff", INK, 1.2, 4) + T(x + pw - 14, y + 82, "busy road", 11, "end", SUB)
    s += mic(x + 80, y + 116, 0, "omni") + DIM(x + 60, y + 68, x + 60, y + 112, "10–20 m", -4, 4, 11, SUB, "end")
    s += TL(x + 96, y + 122, ["omni 1.5 m,", "wind cover"], 11, "start", ACC, 13)
    s += TL(x + 220, y + 110, ["HVAC plant: omni", "2–3 m from grille,", "out of the airflow"], 11, "middle", INK, 13)
    s += T(x + 150, y + 180, "street atmosphere: ORTF at 1.5 m, 60 s", 11, fill=SUB)
    o += s
    # 5 indoor IR
    s, x, y = panel(4, "Indoor spaces · WAV-02 (×5 rooms)")
    s += R(x + 14, y + 30, pw - 28, 126, "#fff", INK, 2, 2)
    s += speaker(x + 50, y + 92, 90, 26, 18, waves=False) + T(x + 50, y + 132, "source ≥ 1 m", 11, fill=SUB) + T(x + 50, y + 145, "from walls", 11, fill=SUB)
    s += mic(x + 190, y + 76, -90, "omni") + mic(x + 250, y + 132, -60, "omni", col="#b54708")
    s += DIM(x + 66, y + 62, x + 186, y + 62, "4 m", 0, -5, 11) + T(x + 200, y + 100, "pos 1", 11, "start", ACC) + T(x + 230, y + 126, "pos 2", 11, "end", "#b54708")
    s += T(x + 150, y + 176, "pos 2 ≥ 2 m from pos 1, off the centre line", 11, fill=SUB)
    o += s
    # 6 small room
    s, x, y = panel(5, "Small room · RD-01 (untreated → treated)")
    s += R(x + 14, y + 30, pw - 28, 132, "#fff", INK, 2, 2)
    s += speaker(x + 104, y + 46, 160, 22, 16, waves=False) + speaker(x + 196, y + 46, 200, 22, 16, waves=False)
    s += dummy_head(x + 150, y + 90, 180) + T(x + 150, y + 118, "good seat ≈ 38% of length", 11, "middle", ACC)
    s += dummy_head(x + 52, y + 142, 180, .8) + T(x + 68, y + 146, "boom seat (sweep 30–200 Hz)", 11, "start", RED)
    s += R(x + 16, y + 32, 10, 10, ACCL, ACC, 1, 1) + R(x + pw - 26, y + 32, 10, 10, ACCL, ACC, 1, 1) + R(x + 16, y + 70, 6, 34, ACCL, ACC, 1, 1) + R(x + pw - 22, y + 70, 6, 34, ACCL, ACC, 1, 1)
    s += T(x + 150, y + 180, "treated: absorbers, corner traps, cloud, rug", 11, fill=SUB)
    o += s
    return SVG("Session 6 layouts", "Six small plans. Open field: a source with an omni 1 m away, 1.5 m high, at least 30 m from any reflector. Wall: source and mics 15 to 25 m from a large flat wall, the source 1 m in front of the omni and ORTF pair. Wind: a shotgun side-on to the wind at 1.5 m with the talker 60 cm in front. Road: an omni 10 to 20 m from a busy road; HVAC plant 2 to 3 m from the grille. Indoor spaces: source at least 1 m from walls, position 1 at 4 m, position 2 at least 2 m away and off the centre line. Small room: two monitors, the good seat at about 38 percent of the length and the boom seat found with a sweep, then treatment added.", w, h, o)


def svg_plan7():
    w, h = 640, 360
    o = T(320, 24, "Session 7 — piano room (plan view, not to scale)", 13, w="700")
    o += R(16, 40, 608, 300, "#fff", INK, 2.5, 4) + T(28, 60, "Quiet room, piano freshly stretch-tuned", 12, "start", SUB)
    o += piano_top(150, 292, 1.0)
    o += mic(211, 262, 180, "ldc") + lead(222, 254, 282, 238) + TL(286, 234, ["mic 30 cm above the hammers", "(LDC or SDC), lid on full stick"], 11, "start", ACC, 13)
    o += person(211, 318, 0, .9) + T(240, 322, "pianist", 11, "start", SUB)
    o += laptop(330, 110) + TL(330, 144, ["tuner / strobe app;", "log the tuner's stretch"], 11, "middle", INK, 13)
    o += person(470, 160, 90) + person(580, 160, -90) + mic(525, 160, 0, "sdc")
    o += DIM(482, 196, 568, 196, "SDC at 1 m, between the players", 0, 16, 11)
    o += TL(525, 110, ["optional TUN-02:", "two violins, A4 + C♯5"], 11, "middle", ACC, 13)
    o += recorder(540, 290, 64, 36) + T(540, 320, "recorder", 11)
    return SVG("Session 7 floor plan", "A quiet room with a grand piano. One mic sits 30 cm above the hammers with the lid on full stick; the pianist is on the bench. A laptop runs the tuner or strobe app. For the optional TUN-02, two violinists face each other with a small-diaphragm condenser 1 m between them.", w, h, o)


# ================================================================ timelines
def svg_timeline(n, rows, title):
    w = 640
    bx0, bx1 = 112, 624
    rh = 40
    legend = [b for _, blocks in rows for b in blocks]
    o = T(320, 24, title, 13, w="700")
    y = 46
    for rl, blocks in rows:
        tot = sum(b[2] for b in blocks)
        o += TL(bx0 - 8, y + 18, rl.split("|"), 11, "end", SUB, 13)
        x = bx0
        for code, lab, mins, reset, kind in blocks:
            bw = (bx1 - bx0) * mins / tot
            fill, col, dash = {"quiet": ("#fff", ACC, None), "loud": (REDL, RED, None), "hold": ("#fff", MUTE, "4 3")}.get(kind, (ACCL, ACC, None))
            o += R(x + 1, y, bw - 2, rh, fill, col, 1.3, 4, dash)
            if bw > 22:
                o += T(x + bw / 2, y + 25, code, 12, fill=col, w="700")
            if reset:
                o += L(x, y - 6, x, y + rh + 6, RED, 3 if reset == "room" else 2, None if reset == "room" else "3 2")
            x += bw
        y += rh + 12
    o += L(bx0, y + 2, bx0 + 18, y + 2, RED, 3) + T(bx0 + 24, y + 6, "room / location change", 11, "start", SUB)
    o += L(bx0 + 190, y + 2, bx0 + 208, y + 2, RED, 2, "3 2") + T(bx0 + 214, y + 6, "mic move / re-rig", 11, "start", SUB)
    o += R(bx0 + 340, y - 5, 16, 12, "#fff", ACC, 1.2, 2) + T(bx0 + 362, y + 6, "quiet", 11, "start", SUB)
    o += R(bx0 + 410, y - 5, 16, 12, REDL, RED, 1.2, 2) + T(bx0 + 432, y + 6, "loud / risky", 11, "start", SUB)
    y += 28
    for code, lab, mins, reset, kind in legend:
        tm = f"≈ {mins} min" if mins < 90 else f"≈ {mins / 60:.1f} h".replace(".0 h", " h")
        o += T(20, y, code, 12, "start", RED if kind == "loud" else ACC, "700") + T(60, y, lab, 11, "start", INK) + T(w - 16, y, tm, 11, "end", SUB)
        y += 17
    h = y + 4
    desc = f"Run order for session {n}: " + "; ".join(f"{b[0]} {re.sub('<[^>]+>', '', b[1])} about {b[2]} minutes" for b in legend) + ". Red marks show where a mic is moved or the room changes. Durations are planning estimates."
    return SVG(f"Session {n} run order", desc, w, h, o)


TIMELINES = {
 1: [("Day 1|(≈ 8 h)", [("Q", "Quiet first: MSL-02 self-noise + clock, GAN-01, room tone", 45, None, "quiet"),
                        ("A", "Rotation rig, LDC at 30 cm: MPR-01, 5 patterns × all angles", 180, "mic", "normal"),
                        ("B", "Proximity ladder 12 → 1 in: MPR-03 (dynamic, then omni)", 75, "mic", "normal"),
                        ("C", "Plosives at 2–3 in: MPR-04a (protected first, NONE last)", 40, "mic", "normal"),
                        ("D", "Handheld 2 in + rear speaker: MPR-06 four grips", 40, "mic", "normal"),
                        ("E", "House speech LDC 8 in: SPC-01…05, SS-03a, ENV-03, STH-01, FND-01, AUT-01, MTR-02, TL-04", 100, "mic", "normal")]),
     ("Day 2|(≈ ½ day+)", [("E", "(continued) house speech setup", 60, None, "normal"),
                          ("F", "Bright LDC 6 in: DES-01 male + female, then 20° off-axis", 45, "mic", "normal"),
                          ("G", "Singing LDC 8 in: FX-03, EQ-01b", 45, "mic", "normal"),
                          ("H", "Eight-mic cluster: MSL-01 S1 then S2", 50, "mic", "normal"),
                          ("I", "Podcast + ADR: PROD-01, PROD-02, PROD-03", 120, "room", "normal")])],
 2: [("Room|(½–1 day)", [("Q", "HVAC OFF: TL-01 balloon, 30 s room tone", 20, None, "quiet"),
                         ("A", "Distance 4 → 48 in: MPR-02 both voices; SPC-04 at 48 in", 90, "mic", "normal"),
                         ("B", "Table comb: WAV-03 at 2/6/12/24 in, then boundary", 60, "mic", "normal"),
                         ("C", "Isolation: MPR-05b desk knocks, footsteps (rigid → shock)", 45, "mic", "normal"),
                         ("D", "Handheld noises: MPR-05a", 20, "mic", "normal"),
                         ("E", "Location line: PROD-03 boom shotgun (photograph it)", 20, "mic", "normal"),
                         ("N", "HVAC ON last: TL-01 balloon + clap, PROD-02 HVAC lines", 30, "room", "loud")])],
 3: [("Day 1|kit", [("K", "Mic the kit once; room tone", 90, None, "normal"),
                    ("M", "MIX-01 + MIX-02 band, 80 BPM, three full takes", 120, None, "normal"),
                    ("E3", "EAR-03 beds + EAR-02 grooves, 100 BPM", 60, None, "normal"),
                    ("F", "FX-01 (96 BPM, toms undamped), EQ-01a kick only", 70, "mic", "normal"),
                    ("S", "ENV-01 single hits, ENV-02 woodblock, MSL-01 snare", 45, "mic", "normal")]),
     ("Day 2|overdubs", [("V", "Lead + backing vocals (booth)", 120, "room", "normal"),
                         ("G", "FX-04 guitar DI + amp, bass DI", 60, "room", "normal"),
                         ("A", "EQ-01d, MSL-01 guitar, DIG-01 guitar", 45, "mic", "normal"),
                         ("P", "Piano: EQ-02, DIG-01, ENV-01 C4, FND-01", 60, "mic", "quiet"),
                         ("O", "Organ: MTR-01, ENV-02 swell; orchestral FND/ENV", 105, "mic", "normal"),
                         ("X", "FM-01, PROD-01 theme, EAR-05 plate/spring (line)", 60, "mic", "normal")]),
     ("Day 3|live + mix", [("L", "Live room: MPR-07 four arrays, one performance", 90, "room", "quiet"),
                           ("Mx", "Mix day: MIX-03, MST-01, edits (MST-02 adds ≈ 1 day)", 480, "room", "normal")])],
 4: [("Bench|(1 day)", [("Q", "EAR-04 chain noise floor, max-gain hiss", 30, None, "quiet"),
                        ("H", "Hum family: CAB-01, NOI-01b, EAR-04; then dimmer buzz, CAB-02", 90, "mic", "normal"),
                        ("R", "RF + AM static, CAB-02 phone pair", 45, "mic", "normal"),
                        ("C", "Crackle / dropouts / clock slip: NOI-01b, EAR-04, CAB-03", 60, "mic", "normal"),
                        ("A", "Console + amp rig: SS-02E pairs, AMP-01, PATCH-01", 120, "mic", "loud"),
                        ("P", "Phantom last: CAB-05, EAR-04 plosives, CAB-04 (min gain)", 45, "mic", "loud"),
                        ("T", "TUBE-01 only if confirmed in writing (HOLD)", 30, None, "hold")])],
 5: [("Venue|(1 day)", [("IR", "WAV-02 hall IRs (sweeps ≈ 85 dBA), balloon, clap, S1", 60, None, "quiet"),
                        ("S", "SPK-01 angles at 4 m, then 1, 2, 8 m", 75, "mic", "normal"),
                        ("B", "SS-03b passage by seat, male then female", 60, "mic", "normal"),
                        ("F", "SS-02A acoustic faults at the seat", 60, "mic", "normal"),
                        ("M", "SS-04 monitor mixes, binaural + IEM", 60, "mic", "normal"),
                        ("V", "SS-03c line checks, EQ-01c on the riser", 30, "mic", "normal"),
                        ("FB", "SS-01 feedback onset + ring-out (SAFE-2)", 60, "mic", "loud")])],
 6: [("Outdoor|(weather-led)", [("D", "Dawn: MTR-02 birdsong", 60, None, "quiet"),
                                ("W", "Still air: WAV-01 field, WAV-04 wall", 90, "room", "quiet"),
                                ("Wi", "Breeze: MPR-04b four wind states ×2", 60, "room", "normal"),
                                ("U", "Urban: NOI-01a traffic + plant, PROD-04a street", 75, "room", "normal")]),
     ("Indoor", [("IR", "WAV-02: studio → living room → classroom → stairwell → gym/church", 240, "room", "normal"),
                 ("RD", "RD-01 small room: untreated, treat, treated", 120, "room", "normal"),
                 ("St", "NOI-01a babble (releases first), PROD-04b foley", 120, "room", "normal")])],
 7: [("Piano|(1–2 h)", [("Q", "Room tone", 5, None, "quiet"),
                        ("T", "TUN-01: A1–A5, then the two octaves", 45, None, "normal"),
                        ("+", "DIG-01 decay, ENV-01 C4 if this is the studio piano", 20, None, "normal"),
                        ("V", "Optional TUN-02: two violins, pure and equal thirds", 25, "mic", "normal")])],
}


# ================================================================ input lists (track sheets)
RIB = '<span class="ph-off">⚠ OFF</span>'
ON = '<span class="ph-on">ON</span>'
OFF = "off"
INPUTS = {
 1: [("Q", "Clock / self-noise", "Cardioid dynamic (SM58 class)", "Cardioid", OFF, "+60 dB, same as ch 2, taped", "msl02-dyn", "MSL-02, GAN-01"),
     ("Q", "Clock / self-noise", "Cardioid LDC", "Cardioid", ON, "+60 dB, taped", "msl02-ldc", "MSL-02"),
     ("A", "Talker, S1", "Multi-pattern LDC (C414 class) on the protractor, 30 cm", "Omni → card → super → hyper → fig-8", ON, "set ONCE on omni 0° (≈ −6 dBFS), taped", "mpr01-ldc", "MPR-01"),
     ("A", "Talker (level reference)", "Any cardioid, 30 cm on-axis, never moved", "Cardioid", "as the mic needs", "fixed, logged", "ref (not delivered)", "MPR-01"),
     ("B", "Low male S1, sung A2", "Cardioid dynamic", "Cardioid", OFF, "set at 1 in, loudest plosive ≤ −3 dBFS", "mpr03-dyn", "MPR-03"),
     ("B", "Low male S1, sung A2", "True pressure omni", "Omni", ON, "set at 1 in, ≤ −3 dBFS", "mpr03-omni", "MPR-03"),
     ("C", "Plosive lines", "LDC, mouth 2–3 in", "Cardioid", ON, "set on its NONE take, worst pop −3 dBFS", "mpr04-ldc", "MPR-04a"),
     ("C", "Plosive lines", "Handheld dynamic on a stand", "Cardioid", OFF, "set on its NONE take, −3 dBFS", "mpr04-dyn", "MPR-04a"),
     ("D", "S1 + sung phrase, four grips", "Handheld cardioid dynamic, 2 in", "Cardioid", OFF, "set on CORRECT grip, −6 dBFS", "mpr06-dyn", "MPR-06"),
     ("E", "Speech (male, female)", "House LDC 8 in, pop filter (SS-03a: 20 cm)", "Cardioid", ON, "set on SPC-04 clean, taped", "spc-ldc", "SPC-01…05, SS-03a, ENV-03, STH-01, FND-01, AUT-01"),
     ("E", "Whistle glide", "SDC 30 cm, slightly off-axis", "Cardioid", ON, "peaks ≤ −6 dBFS", "mtr02-sdc", "MTR-02"),
     ("E", "Tuning fork, sung A4", "SDC 10 cm", "Cardioid", ON, "peaks ≤ −6 dBFS", "tl04-sdc", "TL-04"),
     ("F", "Sibilant voices", "Bright cardioid LDC 6 in, no fabric pop filter", "Cardioid", ON, "per voice, loudest S ≈ −6 dBFS", "des01-ldc", "DES-01"),
     ("G", "Singer", "LDC 8 in, pop filter", "Cardioid", ON, "loudest chorus note ≈ −6 dBFS", "fx03-ldc", "FX-03, EQ-01b"),
     ("H", "S1, then S2 sung", "Cardioid dynamic (SM58/SM7 class), 8 in", "Cardioid", OFF, "fixed per mic, on the loudest moment", "msl01-dyn", "MSL-01"),
     ("H", "S1, then S2 sung", "Cardioid LDC, 8 in", "Cardioid", ON, "fixed per mic", "msl01-ldc", "MSL-01"),
     ("H", "S1, then S2 sung", "SDC, 8 in", "Cardioid", ON, "fixed per mic", "msl01-sdc", "MSL-01"),
     ("H", "S1, then S2 sung", "Passive ribbon, 8 in, own preamp", "Figure-8", RIB, "fixed per mic", "msl01-rib", "MSL-01"),
     ("H", "S1", "Lavalier (chest)", "Omni (typ.)", "ON / own supply", "fixed per mic", "msl01-lav", "MSL-01"),
     ("H", "S1", "Headworn", "per model", "ON / own supply", "fixed per mic", "msl01-head", "MSL-01"),
     ("H", "S1", "Shotgun on an overhead boom", "Shotgun", ON, "fixed per mic", "msl01-shot", "MSL-01"),
     ("H", "S1", "Boundary mic on the desk", "Boundary", ON, "fixed per mic", "msl01-bnd", "MSL-01"),
     ("I", "Host", "Cardioid dynamic, 10 cm", "Cardioid", OFF, "voice peaks ≈ −6 dBFS", "NG_E4_host", "PROD-01, PROD-02"),
     ("I", "Studio guest", "Cardioid dynamic, 10 cm", "Cardioid", OFF, "voice peaks ≈ −6 dBFS", "NG_E4_guest_studio", "PROD-01, PROD-02"),
     ("I", "Remote guest (call side)", "Call return, line in (their local file comes separately)", "—", OFF, "line", "call-return", "PROD-01, PROD-02"),
     ("I", "ADR line", "LDC 15 cm, pop filter", "Cardioid", ON, "—", "prod03-adr", "PROD-03")],
 2: [("A", "Talker S1 (male, female)", "Cardioid dynamic on one stand bar", "Cardioid", OFF, "set at 4 in (≈ −6 dBFS), taped", "mpr02-dyn", "MPR-02"),
     ("A", "Talker S1", "Omni on the same bar, capsules touching", "Omni", ON, "set at 4 in, taped", "mpr02-omni", "MPR-02"),
     ("A", "Talker (level reference)", "Fixed reference mic", "Cardioid", "as the mic needs", "fixed", "ref (not delivered)", "MPR-02"),
     ("A", "SPC-04 distance take", "House LDC at 48 in", "Cardioid", ON, "speech gain (SPC-04)", "spc04-dist", "SPC-04"),
     ("B", "Speaker: S1, then pink", "Omni at 2 / 6 / 12 / 24 in above the table", "Omni", ON, "same gain + playback level every height", "wav03-omni", "WAV-03"),
     ("B", "Speaker: S1, then pink", "Boundary mic flat on the table", "Boundary", ON, "same playback level", "wav03-bnd", "WAV-03"),
     ("C", "Talker S1 at 15 cm", "LDC: rigid clip → shock mount", "Cardioid", ON, "≈ −6 dBFS; unchanged when the mount swaps", "mpr05b-ldc", "MPR-05b"),
     ("D", "Talker S1", "Handheld cardioid dynamic, 2–3 in", "Cardioid", OFF, "set on clean S1, −6 dBFS", "mpr05a-dyn", "MPR-05a"),
     ("E", "Location line", "Boom shotgun, 60 cm above + in front", "Shotgun", ON, "—", "prod03-loc", "PROD-03"),
     ("N", "Balloon, clap", "Omni measurement mic, 1.2 m, 3–4 m from source", "Omni", ON, "same gain all three takes", "tl01-omni", "TL-01"),
     ("N", "Studio guest, HVAC on", "Cardioid dynamic, 10 cm", "Cardioid", OFF, "voice peaks ≈ −6 dBFS", "prod02-hvac", "PROD-02")],
 3: [("Kit", "Kick in", "Large-diaphragm dynamic (Beta 52 / D112 class), through the port", "Cardioid", OFF, "hardest hit ≈ −8 dBFS", "kick-in", "MIX-01, FX-01, EAR-02, ENV-01"),
     ("Kit", "Kick out", "LDC or large dynamic, 20 cm outside", "Cardioid", "ON if LDC", "≈ −10 dBFS", "kick-out", "MIX-02"),
     ("Kit", "Kick (kick-only take)", "RE20-class dynamic, 15 cm outside", "Cardioid", OFF, "hardest hits ≈ −6 dBFS", "kick-eq", "EQ-01a"),
     ("Kit", "Snare top", "SM57-class dynamic", "Cardioid", OFF, "rim shots ≈ −8 dBFS", "snare-top", "MIX-01, FX-01, ENV-01"),
     ("Kit", "Snare bottom", "Dynamic or SDC, 5–8 cm under", "Cardioid", "ON if SDC", "≈ −10 dBFS; Ø switch taped over", "snare-btm", "MIX-02"),
     ("Kit", "Hi-hat (+ shaker)", "SDC 15 cm above", "Cardioid", ON, "accents ≈ −10 dBFS", "perc", "MIX-01, FX-01"),
     ("Kit", "Rack tom", "Dynamic 3–5 cm over the rim", "Cardioid", OFF, "≈ −6 dBFS", "tom-rack", "FX-01"),
     ("Kit", "Floor tom", "Dynamic 3–5 cm over the rim", "Cardioid", OFF, "≈ −6 dBFS", "tom-floor", "FX-01"),
     ("Kit", "Overhead L / R", "Matched SDC pair, ≈ 1 m above the cymbals", "Cardioid", ON, "identical; crash ≈ −8 dBFS", "oh-l, oh-r", "MIX-02, FX-01"),
     ("Kit", "Room L / R", "Matched pair (LDC or omni), 3–4 m", "Cardioid or omni", ON, "identical; fills ≈ −8 dBFS", "room-l, room-r", "MIX-02"),
     ("Band", "Bass DI", "Active DI (thru to the amp)", "—", "ON (active DI)", "loudest ≈ −8 dBFS", "bass-di", "MIX-01, FX-04"),
     ("Band", "Bass amp", "Dynamic or LDC 5–10 cm", "Cardioid", "ON if LDC", "≈ −8 dBFS", "bass-amp", "MIX-02"),
     ("Band", "Guitar close", "SM57-class 3 cm from the grille", "Cardioid", OFF, "≈ −8 dBFS (FX-04: −6)", "gtr", "MIX-01, FX-04"),
     ("Band", "Guitar room", "LDC or omni 1.5–2 m", "Cardioid or omni", ON, "≈ −10 dBFS", "gtr-room", "MIX-02"),
     ("Band", "Guitar DI", "DI (high-impedance input)", "—", "per DI", "hardest pick −6 dBFS", "egtr-di", "FX-04"),
     ("Band", "Keys / pad", "DI (summed mono or LEFT)", "—", "per DI", "≈ −8 dBFS", "keys", "MIX-01"),
     ("Booth", "Lead vocal", "Cardioid LDC 15–20 cm, pop filter 5 cm", "Cardioid", ON, "loudest chorus ≈ −8 dBFS", "lead", "MIX-01"),
     ("Booth", "Backing vocals", "Same LDC, 30 cm", "Cardioid", ON, "—", "bgv", "MIX-01"),
     ("Over", "Acoustic guitar", "SDC 20 cm at the 12th–14th fret", "Cardioid", ON, "≈ −6 dBFS", "ac-gtr", "EQ-01d, DIG-01, FND-01"),
     ("Over", "Piano", "SDC or LDC 30 cm above the hammers", "Cardioid", ON, "≈ −6 dBFS", "piano", "EQ-02, DIG-01, ENV-01, FND-01"),
     ("Over", "Violin, cello, trumpet, clarinet, alto flute", "Cardioid condenser 30–50 cm", "Cardioid", ON, "per instrument", "inst", "ENV-01, ENV-02, FND-01"),
     ("Over", "Organ", "Line out (DI), or a mic on its speaker", "—", "per DI", "RMS ≈ −20 dBFS", "organ", "MTR-01, ENV-02, FND-01"),
     ("Over", "Bell / EP tine", "Mic 50 cm (bell); DI (EP)", "Cardioid", "ON / —", "peaks ≤ −3 dBFS", "fm01", "FM-01"),
     ("Over", "Guitar + snare clusters", "Dynamic, LDC, SDC, passive RIBBON", "Card / fig-8", "ribbon " + RIB, "fixed per mic", "msl01-*", "MSL-01"),
     ("Over", "Plate / spring", "Line in / line out", "—", OFF, "peaks ≤ −3 dBFS", "ear05", "EAR-05"),
     ("Live", "XY L / R", "Matched cardioid SDCs, 90°", "Cardioid", ON, "matched on the guitar at centre", "xy-l, xy-r", "MPR-07"),
     ("Live", "ORTF L / R", "Matched cardioid SDCs, 17 cm, 110°", "Cardioid", ON, "matched", "ortf-l, ortf-r", "MPR-07"),
     ("Live", "AB L / R", "Matched omnis 60 cm apart", "Omni", ON, "matched", "ab-l, ab-r", "MPR-07"),
     ("Live", "M / S", "Cardioid forward + figure-8 sideways (+ lobe LEFT)", "Card / fig-8", "ON (" + RIB + " if the fig-8 is a ribbon)", "matched", "ms-m, ms-s", "MPR-07"),
     ("Live", "Mono spot", "Spot mic on the centre line", "Cardioid", ON, "—", "spot", "MPR-07")],
 4: [("all", "Fault rigs (hum, buzz, RF, crackle, dropout)", "Interface LINE input", "—", OFF, "start at MINIMUM, then up; same gain per set", "flt-line", "CAB-01, CAB-02, CAB-03, NOI-01b, EAR-04"),
     ("all", "Single-coil guitar near the dimmer", "Passive DI", "—", OFF, "minimum, then up", "flt-gtr", "NOI-01b, EAR-04"),
     ("A", "Console main L / R", "Line", "—", OFF, "re-trim only to avoid clipping", "ss02e-l, ss02e-r", "SS-02E"),
     ("A", "Amp → dummy loads → attenuators L / R", "Attenuator / line-tap outputs", "—", OFF, "set ONCE on the hard-clip take (≤ −3 dBFS)", "amp-att", "AMP-01, SS-02E"),
     ("A", "Patchbay insert return", "Console output, line", "—", OFF, "peaks ≤ −3 dBFS", "patch01", "PATCH-01"),
     ("C", "Two digital devices", "S/PDIF or AES, receiver on INTERNAL clock", "—", "—", "programme level", "clockslip", "EAR-04"),
     ("P", "Cable handling noise", "Condenser in a quiet box", "Cardioid", ON, "same gain both cables", "cab05", "CAB-05"),
     ("P", "Plosives", "Mic → preamp", "Cardioid", "per mic", "peaks ≤ −3 dBFS", "ear04-plos", "EAR-04"),
     ("P", "Phantom thumps", "Robust condenser (never a ribbon)", "Cardioid", "+48 V is the event", "MINIMUM gain", "cab04-48v", "CAB-04"),
     ("P", "Hot-plug pops", "Live LINE input (TS, RCA plugged in)", "—", OFF, "MINIMUM gain", "cab04-plug", "CAB-04")],
 5: [("IR", "Hall sweeps, balloon, clap, S1", "Omni measurement mic", "Omni", ON, "fixed per space", "wav02-omni", "WAV-02"),
     ("IR", "Hall sweeps", "ORTF pair (17 cm, 110°)", "Cardioid", ON, "matched", "wav02-ortf", "WAV-02"),
     ("S", "Pink noise + S1 from the 2-way speaker", "Omni measurement mic, 1.8 m high", "Omni", ON, "set ONCE at 1 m on-axis (−6 dBFS)", "spk01-omni", "SPK-01"),
     ("B F M", "PA / wedge programme at the seat or performer", "Binaural dummy head or in-ear binaural (ORTF if neither)", "Binaural", "ON / plug-in power", "fixed; PA level never changed", "bin-l, bin-r", "SS-03b, SS-02A, SS-04"),
     ("M", "Singer's IEM mix", "Aux / IEM feed, line", "—", OFF, "peaks ≤ −6 dBFS", "iem", "SS-04"),
     ("V", "Line checks, live vocal", "Vocal dynamic, handheld 2–3 in → console direct out", "Cardioid", OFF, "≈ −6 dBFS; preamp + console HPF OFF", "vox-dout", "SS-03c, EQ-01c"),
     ("FB", "Feedback onset", "Vocal dynamic 1 m from the wedge → post-fader direct out", "Cardioid", OFF, "peaks ≤ −6 dBFS at the recorder", "ss01-dout", "SS-01")],
 6: [("W IR", "Clap, clave, S1, sweeps", "Omni (measurement), wind cover", "Omni", ON, "peaks ≤ −3 dBFS", "omni", "WAV-01, WAV-02, WAV-04"),
     ("W IR U", "Wall, rooms, street", "ORTF pair", "Cardioid", ON, "matched", "ortf-l, ortf-r", "WAV-02, WAV-04, PROD-04a"),
     ("Wi", "Wind states", "Shotgun: bare / foam / blimp / blimp + fur", "Shotgun", ON, "set on BARE: wind peaks −3 dBFS, taped", "mpr04b-shot", "MPR-04b"),
     ("D", "Birdsong", "Shotgun or parabolic, wind cover", "Shotgun / parabolic", ON, "peaks ≤ −6 dBFS", "mtr02-bird", "MTR-02"),
     ("U St", "Traffic, HVAC plant, babble", "Omni (wind cover outdoors)", "Omni", ON, "loops matched at −20 dBFS RMS", "noi01a", "NOI-01a"),
     ("RD", "Clap, passage, sweep, music", "Binaural dummy head (or in-ears on a still person)", "Binaural", "ON / plug-in power", "same gain untreated + treated", "rd01-l, rd01-r", "RD-01"),
     ("St", "Foley", "LDC or shotgun, 50–100 cm", "Cardioid / shotgun", ON, "peaks ≤ −3 dBFS", "foley", "PROD-04b")],
 7: [("T", "Piano A1–A5, octaves", "LDC or SDC, 30 cm above the hammers", "Cardioid", ON, "peaks ≤ −6 dBFS", "piano", "TUN-01 (+ DIG-01, ENV-01 if here)"),
     ("V", "Two violins, A4 + C♯5", "SDC at 1 m between the players", "Cardioid", ON, "—", "tun02-sdc", "TUN-02 (optional)")],
}


def input_table(n, idlink):
    rows = []
    for i, (st, src, mic_, pat, ph, gain, trk, items) in enumerate(INPUTS[n], 1):
        il = re.sub(r"[A-Z]{2,5}-\d{2}[a-zA-Z]?", lambda m: idlink(m.group(0)), items)
        rows.append(f"<tr><td class='num'>{i}</td><td>{st}</td><td>{src}</td><td>{mic_}</td><td>{pat}</td><td class='ph'>{ph}</td><td>{gain}</td><td><code>{trk}</code></td><td class='idl'>{il}</td></tr>")
    return ("<div class='tablewrap'><table class='inputs'><thead><tr><th>#</th><th>Setup</th><th>Source</th><th>Mic / DI</th><th>Pattern</th><th>+48 V</th><th>Preamp gain mark</th><th>Track name</th><th>Items</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table></div>")


# ================================================================ gear matrix
GEAR = [
 ("Interface / recorder, 48 kHz / 24-bit", "1234567", ""),
 ("Multi-pattern LDC (C414 class)", "1", "MPR-01; can double as the M/S figure-8 in session 3"),
 ("Cardioid LDC (house speech / vocal)", "12367", "S2 needs rigid clip AND shock mount; S6 foley; S7 piano"),
 ("Bright cardioid LDC", "1", "DES-01"),
 ("Second LDC", "1", "session 1 list"),
 ("Cardioid SDC (single)", "137", "MTR-02, TL-04; hat, acoustic, piano; TUN-02"),
 ("Matched SDC pair (XY / ORTF / overheads)", "356", "ORTF for WAV-02, SS-03b, WAV-04, PROD-04a"),
 ("Cardioid dynamic, SM58 class (×3 in S1)", "125", "handheld, podcast, stage vocal"),
 ("SM57-class instrument dynamic", "3", "snare top, guitar amp"),
 ("Kick dynamic (Beta 52 / D112 class)", "3", "kick in"),
 ("RE20-class dynamic", "3", "EQ-01a"),
 ("True pressure omni", "12", "MPR-03; MPR-02 bar; WAV-03 table"),
 ("Omni measurement mic", "256", "TL-01; WAV-02, SPK-01; WAV-01/02/04"),
 ("Matched omni pair (AB)", "3", "MPR-07; drum room pair option"),
 ("Figure-8 (M/S side)", "3", "MPR-07"),
 ("Passive ribbon — phantom OFF", "13", "MSL-01 voice, guitar and snare clusters"),
 ("Lavalier + headworn", "1", "MSL-01"),
 ("Shotgun + boom", "12", "MSL-01; PROD-03 location line"),
 ("Shotgun + foam, blimp, fur", "6", "MPR-04b; birdsong"),
 ("Parabolic mic", "6", "birdsong (or the shotgun)"),
 ("Boundary mic", "12", "MSL-01; WAV-03"),
 ("Robust condenser (phantom thumps)", "4", "CAB-04, CAB-05"),
 ("Binaural dummy head / in-ear mics", "56", "SS-03b, SS-02A, SS-04; RD-01"),
 ("Fixed reference cardioid", "12", "MPR-01, MPR-02 (not delivered)"),
 ("Pop filters (fabric + metal mesh), foams", "13", "S1 all; S3 vocal booth"),
 ("DI boxes (with ground-lift)", "34", "S3 bass, guitar, keys; S4 CAB-01"),
 ("Small full-range playback speaker", "126", "MPR-06 rear; WAV-03; WAV-04 S1 playback"),
 ("Powered speaker / dodecahedron (sweeps)", "6", "S5 uses the house PA; 2-way PA speaker for SPK-01"),
 ("Laptop + sweep / playback", "13456", "S1 remote call + drone; EAR-05; sweeps"),
 ("Console", "45", "S3 uses the studio console"),
 ("Power amp + dummy load + rated attenuator", "4", "AMP-01, SS-02E"),
 ("Headphones (limiter on the monitor bus in S4)", "1234567", ""),
 ("Floor protractor / angle marks / turntable", "15", "MPR-01, DES-01; SPK-01"),
 ("Tape measure / laser / ruler", "12356", "every distance is measured"),
 ("SPL meter", "256", "TL-01 area; venue; RD-01 boom-seat search"),
 ("Hearing protection (−25 dB plugs)", "256", "balloons, feedback, sweeps"),
 ("Balloons", "256", "TL-01; WAV-02"),
 ("Tuner / drone / strobe app", "137", "MPR-03 A2 drone; FND-01 cents; TUN-01"),
 ("Anemometer", "6", "MPR-04b"),
 ("Isolation box / heavy blanket", "1", "MSL-02, GAN-01"),
]


def gear_matrix():
    head = "<tr><th>Gear</th>" + "".join(f"<th class='c'><a href='#session-{i}'>S{i}</a></th>" for i in range(1, 8)) + "<th>Notes</th></tr>"
    body = "".join("<tr><td>" + g + "</td>" + "".join(f"<td class='c{' tick' if str(i) in s else ''}'>{'✓' if str(i) in s else ''}</td>" for i in range(1, 8)) + f"<td class='muted small'>{note}</td></tr>" for g, s, note in GEAR)
    return f"<div class='tablewrap'><table class='gearm'><thead>{head}</thead><tbody>{body}</tbody></table></div>"
