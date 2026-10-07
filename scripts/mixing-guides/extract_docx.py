"""READ-ONLY extraction of the owner's mixing guides (.docx) into JSON blocks.

The source folder (assets/Mixing-Guides-50-Styles) is untracked owner
material: this script only reads it and writes JSON to the folder given
as argv[1] (use a scratch folder, never the assets folder).

Each block is {kind: 'p', style, text, numbered, boldPrefix, allBold}
or {kind: 'table', rows}.
"""
import zipfile, json, os, sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "..", "assets", "Mixing-Guides-50-Styles", "Word"))
if not os.path.isdir(SRC):  # worktree: fall back to the main checkout's untracked assets
    SRC = r"C:\Users\profe\dev\ape-studio\assets\Mixing-Guides-50-Styles\Word"
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def para(p):
    style = ""
    ppr = p.find(W + "pPr")
    numbered = False
    if ppr is not None:
        ps = ppr.find(W + "pStyle")
        if ps is not None:
            style = ps.get(W + "val")
        if ppr.find(W + "numPr") is not None:
            numbered = True
    runs = []
    for r in p.iter(W + "r"):
        b = False
        rpr = r.find(W + "rPr")
        if rpr is not None and rpr.find(W + "b") is not None:
            bv = rpr.find(W + "b").get(W + "val")
            b = bv not in ("0", "false")
        parts = []
        for x in r:
            if x.tag == W + "t":
                parts.append(x.text or "")
            elif x.tag == W + "tab":
                parts.append("\t")
            elif x.tag == W + "br":
                parts.append("\n")
        runs.append(("".join(parts), b))
    text = "".join(t for t, _ in runs)
    boldprefix = ""
    for t, b in runs:
        if b:
            boldprefix += t
        else:
            break
    return {
        "kind": "p",
        "style": style,
        "text": text,
        "numbered": numbered,
        "boldPrefix": boldprefix,
        "allBold": bool(text.strip()) and all(b or not t.strip() for t, b in runs),
    }


def table(tbl):
    rows = []
    for tr in tbl.findall(W + "tr"):
        rows.append(["\n".join(para(p)["text"] for p in tc.findall(W + "p")) for tc in tr.findall(W + "tc")])
    return {"kind": "table", "rows": rows}


for fn in sorted(os.listdir(SRC)):
    if not fn.endswith(".docx"):
        continue
    with zipfile.ZipFile(os.path.join(SRC, fn)) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    blocks = []
    for el in root.find(W + "body"):
        if el.tag == W + "p":
            b = para(el)
            if b["text"].strip():
                blocks.append(b)
        elif el.tag == W + "tbl":
            blocks.append(table(el))
    with open(os.path.join(OUT, fn.replace(".docx", ".json")), "w", encoding="utf-8", newline="\n") as f:
        json.dump(blocks, f, ensure_ascii=False, indent=1)
print("extracted to", OUT)
