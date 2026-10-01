# -*- coding: utf-8 -*-
import sys, collections
from html.parser import HTMLParser
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path", "circle", "line", "rect", "polyline", "stop"}

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []; self.hrefs = []; self.stack = []; self.errs = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.append(a["id"])
        if tag == "a" and a.get("href", "").startswith("#"): self.hrefs.append(a["href"][1:])
        if tag not in VOID: self.stack.append((tag, self.getpos()))
    def handle_startendtag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.append(a["id"])
    def handle_endtag(self, tag):
        if tag in VOID: return
        if not self.stack:
            self.errs.append(("stray close", tag, self.getpos())); return
        if self.stack[-1][0] == tag:
            self.stack.pop(); return
        # tolerate implicit closes of p/li/td/tr/th
        while self.stack and self.stack[-1][0] in ("p", "li", "td", "th", "tr") and self.stack[-1][0] != tag:
            self.stack.pop()
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            self.errs.append(("mismatch", tag, self.stack[-1] if self.stack else None, self.getpos()))

p = P()
p.feed(open(sys.argv[1], encoding="utf-8").read()); p.close()
dup = [i for i, c in collections.Counter(p.ids).items() if c > 1]
ids = set(p.ids)
broken = sorted({h for h in p.hrefs if h and h not in ids})
left = [s for s in p.stack if s[0] not in ("p", "li", "td", "th", "tr", "html", "body", "head")]
print("ids", len(p.ids), "internal links", len(p.hrefs), "dup ids", dup, "broken", broken)
print("unclosed", left[:10], "errors", p.errs[:10])
print("OK" if not (dup or broken or left or p.errs) else "PROBLEMS")
