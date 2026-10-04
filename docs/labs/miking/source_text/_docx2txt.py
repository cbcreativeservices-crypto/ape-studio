import sys, zipfile, re, os, html
def conv(path):
    z = zipfile.ZipFile(path)
    x = z.read('word/document.xml').decode('utf-8')
    rels = {}
    try:
        r = z.read('word/_rels/document.xml.rels').decode('utf-8')
        for m in re.finditer(r'<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*TargetMode="External"', r): rels[m.group(1)] = html.unescape(m.group(2))
        for m in re.finditer(r'<Relationship [^>]*TargetMode="External"[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', r): rels[m.group(1)] = html.unescape(m.group(2))
    except KeyError: pass
    x = re.sub(r'<w:hyperlink [^>]*r:id="([^"]+)"[^>]*>(.*?)</w:hyperlink>', lambda m: m.group(2) + ('<w:r><w:t> &lt;' + html.escape(rels.get(m.group(1),'?')) + '&gt;</w:t></w:r>'), x, flags=re.S)
    out = []
    for p in re.findall(r'<w:p[ >].*?</w:p>', x, re.S):
        style = re.search(r'<w:pStyle w:val="([^"]+)"', p)
        t = ''.join(re.findall(r'<w:t(?: [^>]*)?>(.*?)</w:t>', p, re.S))
        t = html.unescape(t)
        if '<w:tab/>' in p and not t: t = '\t'
        num = '<w:numPr>' in p
        s = style.group(1) if style else ''
        if re.match(r'Heading(\d)', s): t = '#' * int(re.match(r'Heading(\d)', s).group(1)) + ' ' + t
        elif s.lower().startswith('title'): t = '# ' + t
        elif num: t = '- ' + t
        out.append(t)
    # tables: mark row separation roughly
    return '\n'.join(out)
src, dst = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(src)):
    if f.endswith('.docx'):
        open(os.path.join(dst, f[:-5] + '.txt'), 'w', encoding='utf-8', newline='\n').write(conv(os.path.join(src, f)))
