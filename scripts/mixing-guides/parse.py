"""Parse the extracted guide blocks (extract_docx.py output) into the ONE
template the Mixing Guides lab renders. No copy edits here — see edits.py.

The template (mirrors src/screens/lab/mixingGuides/data/types.ts):
  glance   six fixed rows (origin, tempo, ensemble, priority, liveSpl, studioLoudness)
  purpose / instruments / arrangement / dynamics / balance / vocals /
  loudness / notes / references   -> Prose = [{label?, text, bullet?}]
  eq / compression / fx / liveStudio -> {rows: [...], notes: Prose}
Sources are kept apart (docs only, never shown in the app).
"""
import json, os, re

SECTION_BY_HEADING = {
    "Purpose, meaning & audience expectations": "purpose",
    "Instruments": "instruments",
    "Ensemble & arrangement": "arrangement",
    "Dynamics": "dynamics",
    "Balance & blend": "balance",
    "EQ starting points": "eq",
    "Compression & dynamics processing": "compression",
    "Effects (FX) & amounts": "fx",
    "Vocal treatment": "vocals",
    "SPL & loudness": "loudness",
    "Live vs studio — key differences": "liveStudio",
    "Engineer’s notes & common mistakes": "notes",
    "Reference recordings": "references",
    "Sources": "sources",
}
PROSE = ["purpose", "instruments", "arrangement", "dynamics", "balance", "vocals", "loudness", "notes", "references"]
TABLES = {
    "eq": (["Source", "Cut", "Boost", "Notes"], ["source", "cut", "boost", "notes"]),
    "compression": (["Source", "Use?", "Ratio", "Attack / Release", "Gain reduction", "Notes"], ["source", "use", "ratio", "attackRelease", "gainReduction", "notes"]),
    "fx": (["Effect", "Applied to", "Setting", "Amount"], ["effect", "appliedTo", "setting", "amount"]),
    "liveStudio": (["Area", "Live (FOH)", "Studio mix"], ["area", "live", "studio"]),
}
GLANCE = {
    "Origin / region": "origin",
    "Typical tempo": "tempo",
    "Typical ensemble size": "ensemble",
    "Mix priority #1": "priority",
    "Live SPL (FOH, avg)": "liveSpl",
    "Studio / streaming loudness": "studioLoudness",
}
INLINE_HEAD = re.compile(r"\s*##\s*(\d+)\.\s*(" + "|".join(re.escape(h) for h in SECTION_BY_HEADING) + r")\s*")


def split_inline_heads(blocks, log):
    """Some paragraphs carry a stray markdown heading ('## 10. SPL & loudness')
    mid-text: split them into a heading block and the paragraph after it."""
    out = []
    for b in blocks:
        if b["kind"] != "p" or "##" not in b["text"]:
            out.append(b)
            continue
        text = b["text"]
        parts = INLINE_HEAD.split(text)
        # parts = [before, num, title, after, num, title, after...]
        first = parts[0].strip()
        if first:
            out.append({**b, "text": first})
        i = 1
        while i < len(parts):
            title = parts[i + 1]
            after = parts[i + 2].strip()
            log.append(f"split a stray in-paragraph heading '## {parts[i]}. {title}' into its own section")
            out.append({"kind": "p", "style": "Heading2", "text": f"{parts[i]}. {title}", "numbered": False, "boldPrefix": "", "allBold": False})
            if after:
                # A section that begins with "Live:" keeps that run-in label.
                bp = "Live:" if after.startswith("Live:") else ""
                out.append({"kind": "p", "style": "FirstParagraph", "text": after, "numbered": False, "boldPrefix": bp, "allBold": False})
            i += 3
    return out


def prose_block(b):
    text = b["text"].strip()
    label = b["boldPrefix"].strip()
    blk = {}
    if label and text.startswith(label) and label != text:
        blk["label"] = label
        blk["text"] = text[len(b["boldPrefix"]):].strip()
    else:
        blk["text"] = text
    if b["style"] == "Compact" or b["numbered"]:
        blk["bullet"] = True
    return blk


def parse_guide(blocks, fname):
    log = []
    blocks = split_inline_heads(blocks, log)
    g = {"title": None, "glance": {}, "sources": []}
    for k in PROSE:
        g[k] = []
    for k in TABLES:
        g[k] = {"rows": [], "notes": []}
    cur = None
    seen_glance = False
    for b in blocks:
        if b["kind"] == "p" and b["style"] == "Heading1":
            g["title"] = re.sub(r"^Mixing Guide:\s*", "", b["text"]).strip()
            continue
        if b["kind"] == "p" and b["style"] == "Heading2":
            head = re.sub(r"^\d+\.\s*", "", b["text"]).strip()
            if head not in SECTION_BY_HEADING:
                raise SystemExit(f"{fname}: unknown heading {head!r}")
            cur = SECTION_BY_HEADING[head]
            continue
        if cur is None:
            if b["kind"] == "table" and not seen_glance:
                seen_glance = True
                for row in b["rows"]:
                    g["glance"][GLANCE[row[0]]] = row[1].strip()
            # the standard intro line and "At a glance" label are template text
            continue
        if b["kind"] == "table":
            header = [c.strip() for c in b["rows"][0]]
            target = cur
            if cur not in TABLES:
                # a Live/Studio table that landed under another heading
                for k, (h, _) in TABLES.items():
                    if h == header:
                        target = k
                        log.append(f"a '{' / '.join(header)}' table sat under section '{cur}' (a missing heading); moved to '{k}'")
                        break
            h, keys = TABLES[target]
            if header != h:
                raise SystemExit(f"{fname}: table header {header} under {cur}")
            for row in b["rows"][1:]:
                g[target]["rows"].append({k: v.strip() for k, v in zip(keys, row)})
            continue
        if cur == "sources":
            g["sources"].append(b["text"].strip())
            continue
        blk = prose_block(b)
        if cur in TABLES:
            if not g[cur]["rows"]:
                blk["before"] = True  # a lead-in the owner wrote above the table
            g[cur]["notes"].append(blk)
        else:
            g[cur].append(blk)
    return g, log


if __name__ == "__main__":
    import sys
    raw, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for f in sorted(os.listdir(raw)):
        if f.startswith("00"):
            continue
        blocks = json.load(open(os.path.join(raw, f), encoding="utf-8"))
        g, log = parse_guide(blocks, f)
        g["_log"] = log
        json.dump(g, open(os.path.join(out, f), "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    print("parsed")
