/**
 * The display BEZEL is READ-ONLY (owner rule 2026-10-10).
 *
 * "Every lab control goes in the BOTTOM dock; only HIDE DISPLAY and FULL
 * SCREEN sit in the middle; the display's bezel strip is READ-ONLY."
 *
 * The bezel strip (RackStage.bezel / BezelReadouts items) used to accept an
 * `onPress` per cell — tap-to-cycle, tap-to-reset, tap-to-land. Every such
 * cell was moved to the screen's dock (or, on a tool's full screen, its
 * control bar) and the cell kept only its readout.
 *
 * RATCHET: no BezelItem literal in src/screens/**\/*.tsx — an object literal
 * that starts `{ k: '…'` (single-line or multi-line) — may carry `onPress`.
 * The allowlist is EMPTY and may only stay empty.
 *
 * RATCHET 2: no labelled button (a chip, or a Pressable with onPress and its
 * own <Text>) inside an inline stage / render body — buttons drawn on the
 * display move to the dock too. A glass-wide tap stays allowed.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS = join(ROOT, 'src', 'screens');

/** May only shrink — and it is empty. */
const ALLOWLIST: string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** Strip // and /* *\/ comments so a comment that mentions onPress is not a hit. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/** Every `{ k: '…'` / `{ k: `…`` / `{ k: "…"` object literal, brace-matched. */
function bezelLiterals(src: string): { line: number; body: string }[] {
  const out: { line: number; body: string }[] = [];
  const re = /\{\s*k:\s*['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let depth = 0;
    let j = m.index;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ line: src.slice(0, m.index).split('\n').length, body: src.slice(m.index, j + 1) });
  }
  return out;
}

/** Inline display bodies: `stage: (w, h) => …`, `render: (w, h) => …`,
 *  `renderDisplay = (w, h) => …` — the bracket-matched body after the arrow. */
function displayBodies(src: string): { line: number; body: string }[] {
  const out: { line: number; body: string }[] = [];
  const re = /\b(?:stage|render|renderDisplay)\s*[:=]\s*\(\s*_?\w*\s*(?::\s*number)?\s*,\s*\w+[^)]*\)\s*=>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let j = m.index + m[0].length;
    while (/\s/.test(src[j] ?? '')) j++;
    if (src[j] !== '(' && src[j] !== '{') continue;
    let depth = 0;
    let k = j;
    for (; k < src.length; k++) {
      const c = src[k];
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ line: src.slice(0, m.index).split('\n').length, body: src.slice(j, k + 1) });
  }
  return out;
}

/** Labelled buttons in a display body: chip/button components, or a
 *  Pressable that has an onPress AND its own <Text> label. */
function labelledButtons(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(/<(LabChip|MiniBtn|Chip|GainBtn|Button)\b/g)) out.push(m[1]);
  for (const m of body.matchAll(/<Pressable\b/g)) {
    const start = m.index ?? 0;
    const close = body.indexOf('</Pressable>', start);
    const el = body.slice(start, close > 0 ? close : start + 200);
    let depth = 0;
    let tagEnd = el.length;
    for (let i = 0; i < el.length; i++) {
      const c = el[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) {
        tagEnd = i;
        break;
      }
    }
    if (/\bonPress=/.test(el.slice(0, tagEnd)) && /<Text\b/.test(el.slice(tagEnd))) out.push('Pressable with a label');
  }
  return out;
}

/** The WELL of every <RackUnit …> / <XxxRackLayout …> / <XxxRack …> element:
 *  its children, between the opening tag's `>` and the closing tag. */
function rackWells(src: string): { line: number; body: string }[] {
  const out: { line: number; body: string }[] = [];
  for (const m of src.matchAll(/<(RackUnit|\w+RackLayout|\w+Rack)\b/g)) {
    const tag = m[1];
    let depth = 0;
    let i = (m.index ?? 0) + m[0].length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    if (src[i - 1] === '/') continue; // self-closing — no well
    const close = src.indexOf(`</${tag}>`, i);
    if (close < 0) continue;
    out.push({ line: src.slice(0, m.index).split('\n').length, body: src.slice(i + 1, close) });
  }
  return out;
}

describe('bezel read-only (owner rule 2026-10-10)', () => {
  it('no BezelItem literal under src/screens carries onPress', () => {
    const hits: string[] = [];
    for (const file of walk(SCREENS)) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const { line, body } of bezelLiterals(src)) {
        if (/\bonPress\b/.test(body)) {
          const k = /k:\s*['"`]([^'"`]*)/.exec(body)?.[1] ?? '?';
          hits.push(`${relative(ROOT, file).split(sep).join('/')}:${line} (${k})`);
        }
      }
    }
    const unexpected = hits.filter((h) => !ALLOWLIST.some((a) => h.startsWith(a)));
    assert.deepEqual(unexpected, [], `bezel cells must be read-only — move the control to the dock:\n${unexpected.join('\n')}`);
  });

  it('the allowlist stays empty', () => {
    assert.equal(ALLOWLIST.length, 0);
  });

  it('no labelled button is drawn INSIDE a display (stage / render bodies)', () => {
    // Same owner rule: buttons drawn on the display itself ("OPEN THE
    // LOUDSPEAKER ›" in Cymatics module 6, the Signal Chain's module pills)
    // move to the dock. A glass-wide tap (Pressable around the whole viz, no
    // label of its own) and long-press-only lesson hooks stay allowed.
    const hits: string[] = [];
    for (const file of walk(SCREENS)) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const { line, body } of displayBodies(src)) {
        for (const b of labelledButtons(body)) hits.push(`${relative(ROOT, file).split(sep).join('/')}:${line} (${b})`);
      }
    }
    assert.deepEqual(hits, [], `buttons drawn inside a display — move them to the dock:\n${hits.join('\n')}`);
  });

  it('no slider or big button lives in a rack WELL (owner 2026-10-10: well controls dock too)', () => {
    // The reliable slice of the rule: a DragSlider or a GlassButton inside a
    // RackUnit / *RackLayout / *Rack well is always a control (chips are not
    // checked — the well legitimately holds link chips and disclosures).
    const hits: string[] = [];
    for (const file of walk(SCREENS)) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const { line, body } of rackWells(src)) {
        for (const m of body.matchAll(/<(DragSlider|GlassButton)\b/g)) hits.push(`${relative(ROOT, file).split(sep).join('/')}:${line} (${m[1]})`);
      }
    }
    assert.deepEqual(hits, [], `controls in a rack well — move them to the dock:\n${hits.join('\n')}`);
  });

  it('the well detector finds a slider in a rack well (self-check)', () => {
    const src = "return (\n  <RackUnit params={params} stage={{ render: (w, h) => <G /> }}>\n    <Text>notes</Text>\n    <DragSlider value={v} onChange={f} />\n  </RackUnit>\n);";
    const wells = rackWells(src);
    assert.equal(wells.length, 1);
    assert.match(wells[0].body, /<DragSlider/);
    assert.doesNotMatch(wells[0].body, /stage=/);
  });

  it('the in-display detector sees a labelled button and spares a glass tap (self-check)', () => {
    const bad = "stage: (w, h) => (\n  <View>\n    <Pressable onPress={go} accessibilityRole=\"button\">\n      <Text>OPEN ›</Text>\n    </Pressable>\n  </View>\n),";
    assert.equal(displayBodies(bad).flatMap((d) => labelledButtons(d.body)).length, 1);
    const glass = "render: (w, h) => (\n  <Pressable onPress={toggle} style={{ width: w, height: h }}>\n    <Glass w={w} h={h} />\n  </Pressable>\n),";
    assert.equal(displayBodies(glass).flatMap((d) => labelledButtons(d.body)).length, 0);
    const chip = "render: (_w, h) => {\n  return <View><LabChip label=\"X\" selected={false} onPress={f} /></View>;\n},";
    assert.equal(displayBodies(chip).flatMap((d) => labelledButtons(d.body)).length, 1);
  });

  it('the detector sees a multi-line tappable cell (self-check)', () => {
    const sample = "const b = [\n  { k: 'A', v: '1' },\n  {\n    k: 'B',\n    v: '2',\n    onPress: () => go(),\n  },\n];";
    const lits = bezelLiterals(stripComments(sample));
    assert.equal(lits.length, 2);
    assert.equal(lits.filter((l) => /\bonPress\b/.test(l.body)).length, 1);
    // a comment mentioning onPress inside a cell is not a hit
    const commented = "[{ k: 'C', v: '3', // onPress: moved to the dock\n }]";
    assert.equal(bezelLiterals(stripComments(commented)).filter((l) => /\bonPress\b/.test(l.body)).length, 0);
  });
});
