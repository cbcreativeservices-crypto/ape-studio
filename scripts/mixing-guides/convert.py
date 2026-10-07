"""Convert the parsed guides into the app's TS data (one file per style).

  python convert.py <parsed-dir> <repo-root> [--report <file>]

Steps per guide: the per-guide copy edits (edits.py: exact substrings, each
must be found), the shared rewrites (edits.GLOBAL), the template split of the
loudness section into Live / Studio-and-streaming, the short "the audience
expects…" line (edits.EXPECTS, a sentence of the guide's own section 1), then
the gate: no brand/model/authority or citation form may survive (flags.py).
Writes src/screens/lab/mixingGuides/data/guides/*.ts, index.ts and load.ts.
"""
import json, os, re, sys
from flags import BRAND_RE, CITE_RE
from edits import EDITS, GLOBAL, EXPECTS

sys.stdout.reconfigure(encoding="utf-8")
parsed, root = sys.argv[1], sys.argv[2]
report_path = sys.argv[sys.argv.index("--report") + 1] if "--report" in sys.argv else None
OUT = os.path.join(root, "src", "screens", "lab", "mixingGuides", "data")
GUIDES = os.path.join(OUT, "guides")
os.makedirs(GUIDES, exist_ok=True)

PROSE = ["purpose", "instruments", "arrangement", "dynamics", "balance", "vocals", "loudness", "notes", "references"]
TABLES = ["eq", "compression", "fx", "liveStudio"]


def walk_strings(g, fn):
    """Apply fn to every learner-facing string of a guide (in place)."""
    g["title"] = fn(g["title"])
    for k in list(g["glance"]):
        g["glance"][k] = fn(g["glance"][k])
    for k in PROSE:
        for b in g[k]:
            b["text"] = fn(b["text"])
            if "label" in b:
                b["label"] = fn(b["label"])
    for k in TABLES:
        for r in g[k]["rows"]:
            for c in list(r):
                r[c] = fn(r[c])
        for b in g[k]["notes"]:
            b["text"] = fn(b["text"])
            if "label" in b:
                b["label"] = fn(b["label"])


def all_strings(g):
    out = []
    walk_strings(g, lambda s: (out.append(s), s)[1])
    return out


def split_loudness(blocks):
    """'Live: … Studio / streaming: …' in one paragraph → two labelled blocks."""
    out = []
    for b in blocks:
        t = b["text"]
        m = re.search(r"\s*Studio\s*/\s*streaming:\s*", t)
        if m and m.start() > 0:
            out.append({**b, "text": t[: m.start()].strip()})
            out.append({"label": "Studio / streaming:", "text": t[m.end():].strip()})
        elif t.startswith("Studio / streaming:") and "label" not in b:
            out.append({"label": "Studio / streaming:", "text": t[len("Studio / streaming:"):].strip()})
        else:
            out.append(b)
    return out


def tidy(s):
    s = re.sub(r"\(\s*\)", "", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    s = re.sub(r"\s+([,.;:])", r"\1", s)
    return s.strip()


report = []
index = []
problems = 0
files = sorted(f for f in os.listdir(parsed) if f.endswith(".json"))
assert len(files) == 50, len(files)
for f in files:
    num = int(f[:2])
    gid = f[3:-5]
    g = json.load(open(os.path.join(parsed, f), encoding="utf-8"))
    log = list(g.pop("_log"))
    sources = g.pop("sources")
    applied = 0
    for old, new in EDITS.get(gid, []):
        hits = [0]

        def rep(s, old=old, new=new, hits=hits):
            if old in s:
                hits[0] += s.count(old)
                return s.replace(old, new)
            # The source sets a no-break space after "e.g." / "Mrs."; an edit
            # written with a plain space still matches (that string loses it).
            flat = s.replace(" ", " ")
            if old in flat:
                hits[0] += flat.count(old)
                return flat.replace(old, new)
            return s

        # An edit written against "Label: text" of a labelled item (the
        # bold run-in label is stored apart) is applied to the pair.
        for blocks in [g[k] for k in PROSE] + [g[k]["notes"] for k in TABLES]:
            for b in blocks:
                if "label" not in b:
                    continue
                pair = b["label"] + " " + b["text"]
                if old in pair and old not in b["text"] and old not in b["label"]:
                    out = rep(pair)
                    if out.startswith(b["label"] + " "):
                        b["text"] = out[len(b["label"]) + 1:]
                    else:
                        del b["label"]
                        b["text"] = out
        walk_strings(g, rep)
        if hits[0] == 0:
            print(f"!! {gid}: edit not found: {old[:80]!r}")
            problems += 1
        applied += 1
    for rx, new in GLOBAL:
        walk_strings(g, lambda s, rx=rx, new=new: re.sub(rx, new, s))
    walk_strings(g, tidy)
    g["loudness"] = split_loudness(g["loudness"])
    # drop blocks an edit emptied (a whole sentence/item removed)
    for k in PROSE:
        g[k] = [b for b in g[k] if b["text"] or b.get("label")]
    for k in TABLES:
        g[k]["notes"] = [b for b in g[k]["notes"] if b["text"] or b.get("label")]
    expects = EXPECTS.get(gid)
    if expects is None:
        print(f"!! {gid}: no EXPECTS line")
        problems += 1
        expects = ""
    purpose_text = " ".join(b["text"] for b in g["purpose"])
    if expects and expects not in purpose_text and not expects.startswith("="):
        print(f"!! {gid}: EXPECTS is not a sentence of the edited section 1: {expects[:70]!r}")
        problems += 1
    expects = expects.lstrip("=")
    bad = []
    # References name artists and recordings (a guitarist called Underwood is
    # not a pickup maker), so the gate reads everything else.
    gated = {**g, "references": []}
    for s in all_strings(gated) + [expects]:
        for m in BRAND_RE.finditer(s):
            bad.append(f"brand {m.group(0)!r} in {s[:100]!r}")
        for m in CITE_RE.finditer(s):
            bad.append(f"citation form {m.group(0)!r} in {s[:100]!r}")
    if bad and not "--loose" in sys.argv:
        for b in bad:
            print(f"!! {gid}: {b}")
        problems += len(bad)
    empty = [k for k in PROSE if not g[k]] + [k for k in TABLES if not g[k]["rows"]]
    guide = {
        "id": gid,
        "num": num,
        "title": g["title"],
        "expects": expects,
        "glance": g["glance"],
        **{k: g[k] for k in PROSE[:-1]},
        **{k: g[k] for k in TABLES},
        "references": [b["text"] if "label" not in b else f'{b["label"]} {b["text"]}' for b in g["references"]],
        "empty": empty,
    }
    # key order for readability in the TS file
    order = ["id", "num", "title", "expects", "glance", "purpose", "instruments", "arrangement", "dynamics", "balance",
             "eq", "compression", "fx", "vocals", "loudness", "liveStudio", "notes", "references", "empty"]
    guide = {k: guide[k] for k in order}
    fname = f"g{num:02d}-{gid}.ts"
    body = json.dumps(guide, ensure_ascii=False, indent=2)
    with open(os.path.join(GUIDES, fname), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(
            "/**\n"
            f" * Mixing guide {num:02d} — {g['title']}. GENERATED by scripts/mixing-guides/convert.py\n"
            " * from the owner's guide (assets/Mixing-Guides-50-Styles, read only). Edit the\n"
            " * conversion (scripts/mixing-guides/edits.py), not this file.\n"
            " */\n"
            "import type { MixingGuide } from '../types';\n\n"
            f"export const GUIDE: MixingGuide = {body};\n"
        )
    index.append({"id": gid, "num": num, "title": g["title"], "line": g["glance"]["priority"], "origin": g["glance"]["origin"], "file": fname[:-3]})
    report.append({"num": num, "id": gid, "title": g["title"], "edits": applied, "log": log, "empty": empty, "sources": sources})

with open(os.path.join(OUT, "index.ts"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write(
        "/**\n"
        " * The Mixing Guides index — the 50 styles in the owner's index order (00-index:\n"
        " * ranked by listening reach; no families). Light on purpose: the hub and the\n"
        " * Labs-menu tile read only this; each guide's body loads on first open\n"
        " * (load.ts). GENERATED by scripts/mixing-guides/convert.py.\n"
        " */\n"
        "export type MixingGuideEntry = {\n"
        "  id: string;\n  num: number;\n  title: string;\n"
        "  /** The guide's \"Mix priority #1\" — the tile's second line. */\n  line: string;\n"
        "  /** Where and when the style comes from — searched, not shown on the tile. */\n  origin: string;\n"
        "};\n\n"
        "export const MIXING_GUIDE_INDEX: readonly MixingGuideEntry[] = "
        + json.dumps([{k: v for k, v in e.items() if k != "file"} for e in index], ensure_ascii=False, indent=2)
        + ";\n"
    )
with open(os.path.join(OUT, "load.ts"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write(
        "/**\n"
        " * Load ONE guide's body on first open. Each `require` sits inside a function, so\n"
        " * no guide is evaluated at app start or when the hub opens — only the guide\n"
        " * being read (perf: test/perfStartTrim caps the start graph). GENERATED by\n"
        " * scripts/mixing-guides/convert.py.\n"
        " */\n"
        "import type { MixingGuide } from './types';\n\n"
        "/* eslint-disable @typescript-eslint/no-var-requires */\n"
        "const LOADERS: Record<string, () => MixingGuide> = {\n"
        + "".join(f"  '{e['id']}': () => (require('./guides/{e['file']}') as {{ GUIDE: MixingGuide }}).GUIDE,\n" for e in index)
        + "};\n\n"
        "const cache = new Map<string, MixingGuide>();\n\n"
        "/** The guide with this id, or null for an id the lab does not have. */\n"
        "export function loadGuide(id: string): MixingGuide | null {\n"
        "  const hit = cache.get(id);\n"
        "  if (hit) return hit;\n"
        "  const load = LOADERS[id];\n"
        "  if (!load) return null;\n"
        "  const g = load();\n"
        "  cache.set(id, g);\n"
        "  return g;\n"
        "}\n"
    )
if report_path:
    json.dump(report, open(report_path, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
print(f"converted {len(index)} guides; problems: {problems}")
sys.exit(1 if problems else 0)
