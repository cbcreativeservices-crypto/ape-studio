/**
 * Stage Plot and Channel Designer — the PDF writer
 * (src/features/stageplot/spPdf.ts + spPdfFonts.ts), proven with no device
 * and no PDF library.
 *
 * The tests READ THE FILE BACK with a small parser of their own (the xref
 * table, the page tree, the page streams, the text operators) and check what
 * a venue relies on: every row, note and open question is on paper; a long
 * table repeats its header and never splits a row; nothing is printed
 * outside the margins or under 10 pt in a table; Letter and A4 are both
 * real pages. The `SpDoc` objects are built by hand here: the writer's only
 * contract is spDocTypes.ts.
 *
 * To LOOK at the pages: set SP_PDF_OUT to a folder and the test also writes
 * its PDFs there.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SpDoc, SpDocColumn, SpDocKeyItem, SpDocPlot, SpDocPlotItem, SpDocRow, SpDocSection } from '../src/features/stageplot/spDocTypes.ts';
import { SP_PDF_KEY, SP_PDF_MARGIN, SP_PDF_PAPER, SP_PDF_PLOT, SP_PDF_PLOT_WORDS, SP_PDF_TABLE_PT, spPdfBytes, spPdfWrap } from '../src/features/stageplot/spPdf.ts';
import { SP_PDF_HELVETICA, SP_PDF_HELVETICA_BOLD, SP_PDF_MARKS, spPdfEncode, spPdfWidth } from '../src/features/stageplot/spPdfFonts.ts';
import { spKeySymbol, spSymbol, type SpShape } from '../src/features/stageplot/spSymbols.ts';
import type { SpObjectKind, SpPaper } from '../src/features/stageplot/spTypes.ts';

// ───────────────────────── a reader for the file ─────────────────────────
/** One piece of printed text. `up` / `down` = turned to read up or down the page. */
type Run = { text: string; size: number; bold: boolean; x: number; y: number; up: boolean; down: boolean; fonts: string[] };
type Page = { mediaBox: number[]; stream: string; runs: Run[]; flat: string };
type Parsed = { raw: string; objects: Map<number, string>; pages: Page[]; trailer: string; fontNames: string[] };

const WIN = new TextDecoder('windows-1252');
const squash = (s: string): string => s.replace(/\s+/g, '');
const latin1 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
};

type Tok = { w?: string; bytes?: number[] };
function tokens(stream: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < stream.length) {
    const c = stream[i];
    if (c === '(') {
      const bytes: number[] = [];
      let j = i + 1;
      while (stream[j] !== ')') {
        assert.ok(j < stream.length, 'a text string is not closed');
        if (stream[j] === '\\') {
          const nx = stream[j + 1];
          if (nx >= '0' && nx <= '7') {
            bytes.push(parseInt(stream.slice(j + 1, j + 4), 8));
            j += 4;
          } else {
            bytes.push(nx.charCodeAt(0));
            j += 2;
          }
        } else {
          bytes.push(stream.charCodeAt(j));
          j++;
        }
      }
      out.push({ bytes });
      i = j + 1;
    } else if (c === ' ' || c === '\n') i++;
    else {
      let j = i;
      while (j < stream.length && stream[j] !== ' ' && stream[j] !== '\n' && stream[j] !== '(') j++;
      out.push({ w: stream.slice(i, j) });
      i = j;
    }
  }
  return out;
}

const markChar = (byte: number): string => SP_PDF_MARKS.find((m) => m.byte === byte)?.char ?? '?';

function runsOf(stream: string): Run[] {
  const toks = tokens(stream);
  const runs: Run[] = [];
  let cur: Run | null = null;
  let font = '';
  let size = 0;
  toks.forEach((t, k) => {
    if (t.w === 'BT') cur = { text: '', size: 0, bold: false, x: 0, y: 0, up: false, down: false, fonts: [] };
    else if (t.w === 'Tf') {
      font = String(toks[k - 2].w).slice(1);
      size = Number(toks[k - 1].w);
    } else if (t.w === 'Tm' && cur) {
      const m = toks.slice(k - 6, k).map((x) => Number(x.w));
      cur.x = m[4];
      cur.y = m[5];
      cur.up = m[0] === 0 && m[1] === 1;
      cur.down = m[0] === 0 && m[1] === -1;
    } else if (t.w === 'Tj' && cur) {
      const b = toks[k - 1].bytes ?? [];
      cur.text += font === 'F3' ? b.map(markChar).join('') : WIN.decode(Uint8Array.from(b));
      if (!cur.size) {
        cur.size = size;
        cur.bold = font === 'F2';
      }
      cur.fonts.push(font);
    } else if (t.w === 'ET' && cur) {
      runs.push(cur);
      cur = null;
    }
  });
  return runs;
}

/** Reads the file the way a PDF program does: from the end, through the xref table. */
function parsePdf(bytes: Uint8Array): Parsed {
  const raw = latin1(bytes);
  assert.ok(raw.startsWith('%PDF-1.4\n'), 'starts with %PDF-1.4');
  assert.ok(raw.endsWith('%%EOF\n'), 'ends with %%EOF');
  const sx = raw.lastIndexOf('startxref\n');
  const xrefAt = parseInt(raw.slice(sx + 10), 10);
  assert.equal(raw.slice(xrefAt, xrefAt + 5), 'xref\n', 'startxref points at the xref table');
  const head = /^xref\n0 (\d+)\n/.exec(raw.slice(xrefAt, xrefAt + 40));
  assert.ok(head, 'the xref table has one section from 0');
  const count = Number(head[1]);
  const first = xrefAt + head[0].length;
  const objects = new Map<number, string>();
  for (let id = 0; id < count; id++) {
    const entry = raw.slice(first + id * 20, first + id * 20 + 20);
    assert.match(entry, /^\d{10} \d{5} [fn] \n$/, `xref entry ${id} is 20 bytes`);
    if (id === 0) {
      assert.equal(entry, '0000000000 65535 f \n');
      continue;
    }
    const off = Number(entry.slice(0, 10));
    const start = `${id} 0 obj\n`;
    assert.equal(raw.slice(off, off + start.length), start, `xref offset of object ${id}`);
    const end = raw.indexOf('\nendobj\n', off);
    assert.ok(end > off, `object ${id} is closed`);
    objects.set(id, raw.slice(off + start.length, end));
  }
  const trailer = raw.slice(first + count * 20, sx);
  assert.match(trailer, new RegExp(`^trailer\\n<< /Size ${count} /Root 1 0 R /Info \\d+ 0 R `));
  const catalog = objects.get(1) ?? '';
  assert.match(catalog, /\/Type \/Catalog \/Pages 2 0 R/);
  const tree = objects.get(2) ?? '';
  const kids = /\/Kids \[([^\]]*)\]/.exec(tree);
  assert.ok(kids, 'the page tree lists its pages');
  const ids = kids[1].split(' 0 R').map((s) => s.trim()).filter((s) => s).map(Number);
  assert.equal(Number(/\/Count (\d+)/.exec(tree)?.[1]), ids.length, '/Count = the number of pages');
  const pages = ids.map((id): Page => {
    const page = objects.get(id) ?? '';
    assert.match(page, /\/Type \/Page \/Parent 2 0 R/);
    const box = /\/MediaBox \[([^\]]*)\]/.exec(page);
    assert.ok(box);
    const contents = Number(/\/Contents (\d+) 0 R/.exec(page)?.[1]);
    const body = objects.get(contents) ?? '';
    const m = /^<< \/Length (\d+) >>\nstream\n/.exec(body);
    assert.ok(m, 'a page stream states its length');
    const stream = body.slice(m[0].length, m[0].length + Number(m[1]));
    assert.equal(body.slice(m[0].length + Number(m[1])), '\nendstream', '/Length is the exact length of the stream');
    const runs = runsOf(stream);
    return { mediaBox: box[1].trim().split(' ').map(Number), stream, runs, flat: squash(runs.map((r) => r.text).join(' ')) };
  });
  const fontNames = [...objects.values()].filter((o) => o.includes('/Type /Font')).map((o) => /\/BaseFont \/([A-Za-z-]+)/.exec(o)?.[1] ?? '');
  return { raw, objects, pages, trailer, fontNames };
}

const pagesWith = (p: Parsed, text: string): number[] => p.pages.map((pg, i) => (pg.flat.includes(squash(text)) ? i : -1)).filter((i) => i >= 0);
const allText = (p: Parsed): string => p.pages.map((pg) => pg.flat).join('');

// ───────────────────────── documents, built by hand ─────────────────────────
const NOW = 1_800_000_000_000;
const pad = (n: number): string => String(n).padStart(2, '0');

const shift = (shapes: SpShape[], dx: number, dy: number): SpShape[] =>
  shapes.map((s): SpShape => {
    if (s.t === 'rect') return { ...s, x: s.x + dx, y: s.y + dy };
    if (s.t === 'circle') return { ...s, cx: s.cx + dx, cy: s.cy + dy };
    if (s.t === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy };
    return { ...s, pts: s.pts.map((v, i) => v + (i % 2 ? dy : dx)) };
  });

function item(id: string, kind: SpObjectKind, x: number, y: number, label: string, badges: string[] = [], person = false): SpDocPlotItem {
  const sym = spSymbol(kind);
  return { id, shapes: shift(sym.shapes, x, y), tag: sym.tag, at: { x, y }, label, labelAt: { x, y: y + sym.h / 2 + 0.06 }, badges, person };
}

const PEOPLE = ['José Peña', 'Zoë Müller', 'Renée O’Neil', 'Íñigo Ordóñez', 'Anaïs Brontë', 'Dmitri “Dima” Volkov'];

/** A plot with 30 items: 6 people, the kit, amplifiers, wedges, DI boxes, power, a riser, and two things offstage. */
function plot30(grid = 0.5): SpDocPlot {
  const items: SpDocPlotItem[] = [];
  items.push({ id: 'riser', shapes: [{ t: 'rect', x: 2.4, y: 0.2, w: 2.4, h: 2.0, dash: true, fill: 'none' }], tag: '', at: { x: 3.6, y: 1.2 }, label: 'Drum riser 8 ft × 8 ft', labelAt: { x: 3.6, y: 2.25 }, badges: [], person: false });
  items.push(item('kit', 'drum-kit', 3.6, 1.1, 'Drum kit', ['1–8', 'M4']));
  PEOPLE.forEach((name, i) => items.push(item(`p${i}`, 'performer', 0.9 + i * 1.1, i % 2 ? 2.9 : 3.5, name, [`M${i + 1}`], true)));
  for (let i = 0; i < 6; i++) items.push(item(`mic${i}`, 'vocal-mic', 0.9 + i * 1.1, 4.1, `Vocal ${i + 1}`, [String(20 + i)]));
  for (let i = 0; i < 5; i++) items.push(item(`w${i}`, 'wedge', 0.7 + i * 1.4, 4.35, `Wedge ${i + 1}`, [`M${i + 1}`]));
  items.push(item('ga', 'guitar-amp', 0.8, 1.2, 'Guitar amplifier', ['9']));
  items.push(item('ba', 'bass-amp', 6.2, 1.2, 'Bass amplifier', ['10', '11']));
  items.push(item('kb', 'keyboard', 5.9, 2.4, 'Keys', ['12–13']));
  items.push(item('di1', 'di', 5.2, 2.9, '', ['12–13']));
  items.push(item('di2', 'di', 6.8, 0.6, 'DI (bass)', ['10']));
  items.push(item('ac1', 'power', 0.3, 0.3, 'Power', []));
  items.push(item('iem', 'iem', 1.6, 0.5, 'In-ear rack', ['M5', 'M6']));
  items.push(item('sb', 'stage-box', 3.6, 0.15, 'Stage box', []));
  items.push(item('fill', 'drum-fill', 2.0, 1.2, 'Drum fill', ['M4']));
  items.push(item('rack', 'rack', -0.7, 2.0, 'Monitor desk (offstage)', []));
  items.push(item('side', 'sidefill', 7.9, 2.6, 'Side fill', ['M7']));
  assert.equal(items.length, 30);
  return {
    widthM: 7.2,
    depthM: 4.5,
    toScale: true,
    sizeNote: '24 ft × 15 ft (estimated). Symbols are drawings, not equipment footprints.',
    marginM: 1,
    gridM: grid,
    items,
    viewNote: 'Overhead microphones: left and right as the audience sees the kit.',
    legend: ['A number in a box is an input channel on the input list.', 'M and a number in a box is a monitor mix.', 'AC is a place where the band asks for power.'],
    key: [],
    roomy: false,
  };
}

const INPUT_NAMES = [
  'Kick drum inside',
  'Kick drum outside',
  'Snare top',
  'Snare bottom',
  'Hi-hat',
  'Rack tom 1 (10 in)',
  'Floor tom',
  'Overhead left',
  'Overhead right',
  'Bass DI',
  'Bass amplifier microphone',
  'Electric guitar amplifier (stage right)',
  'Acoustic guitar DI — José',
  'Keyboards left/right stereo pair through two DI boxes',
  'Lead vocal (Zoë)',
  'Backing vocal: Renée',
  'Trumpet & flugelhorn \\ doubling',
  'Playback click (monitor only)',
];
const HEAD = { ch: 'Ch', input: 'Input', who: 'Performer or location', capture: 'Capture', stand: 'Stand', supplier: 'Supplier', audience: 'Audience mix' };
const COLUMNS: SpDocColumn[] = [
  { key: 'ch', label: HEAD.ch, width: 1, align: 'center' },
  { key: 'input', label: HEAD.input, width: 4 },
  { key: 'who', label: HEAD.who, width: 3 },
  { key: 'capture', label: HEAD.capture, width: 4 },
  { key: 'stand', label: HEAD.stand, width: 2 },
  { key: 'supplier', label: HEAD.supplier, width: 2 },
  { key: 'audience', label: HEAD.audience, width: 2 },
];
const inputLabel = (i: number): string => `${INPUT_NAMES[i % INPUT_NAMES.length]} [${pad(i + 1)}]`;
const inputNote = (i: number): string =>
  `Note ${pad(i + 1)}: the band brings this microphone (a large-diaphragm condenser), asks the venue for a short boom stand, and would like this input kept out of the wedges; phantom power to be confirmed with the house engineer before soundcheck. End of note ${pad(i + 1)}.`;
const inputRows = (n: number): SpDocRow[] =>
  Array.from({ length: n }, (_, i): SpDocRow => ({
    cells: {
      ch: String(i + 1),
      input: inputLabel(i),
      who: `${PEOPLE[i % PEOPLE.length]}, downstage ${i % 2 ? 'left' : 'right'}`,
      capture: i % 4 === 0 ? 'Microphone (dynamic, cardioid), required' : 'DI, to be confirmed',
      stand: i % 3 === 0 ? 'Short boom' : 'None',
      supplier: i % 2 ? 'Band' : 'Venue',
      audience: i % 9 === 8 ? 'MONITOR ONLY' : 'Yes',
    },
    strong: i % 7 === 6,
    note: i % 3 === 1 ? inputNote(i) : undefined,
  }));
const unresolved = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => `Open question ${pad(i + 1)}: who supplies the stand, cable and DI box for input ${i + 1}, and where does the venue want the split? (question ${pad(i + 1)} ends)`);

function packet(o: { paper?: SpPaper; inputs?: number; open?: number; stamp?: string; breaks?: SpDocSection['breakBefore']; grid?: number; title?: string } = {}): SpDoc {
  const sections: SpDocSection[] = [
    {
      id: 'plot',
      title: 'Stage plot',
      breakBefore: 'none',
      blocks: [
        { t: 'facts', rows: [['Venue', 'The Blue Room, 12 Río Street'], ['Date', 'December 5, 2026'], ['Load-in', '4:00 PM'], ['Soundcheck', '5:30 PM'], ['Performance', '9:00 PM'], ['Technical contact', 'María López · 555-0100 · maria@example.com'], ['Status', 'Draft']] },
        { t: 'plot', plot: plot30(o.grid ?? 0.5) },
      ],
    },
    {
      id: 'inputs',
      title: 'Input list',
      breakBefore: o.breaks ?? 'page',
      blocks: [
        { t: 'para', text: 'Channel numbers are the band’s own. The venue may patch them where it needs to.', tone: 'muted' },
        { t: 'table', table: { columns: COLUMNS, rows: inputRows(o.inputs ?? 32), empty: 'No inputs yet.' } },
      ],
    },
    {
      id: 'monitors',
      title: 'Monitor plan',
      breakBefore: o.breaks ?? 'page',
      blocks: [
        { t: 'heading', level: 2, text: 'Mixes' },
        {
          t: 'table',
          table: {
            columns: [
              { key: 'code', label: 'Mix', width: 1, align: 'center' },
              { key: 'name', label: 'For', width: 3 },
              { key: 'how', label: 'Heard through', width: 3 },
              { key: 'who', label: 'Created by', width: 2 },
            ],
            rows: PEOPLE.map((n, i) => ({ cells: { code: `M${i + 1}`, name: n, how: i % 2 ? 'In-ear monitors (stereo)' : 'Wedge', who: i % 2 ? 'Band' : 'Venue' } })),
            empty: 'No monitor mixes yet.',
          },
        },
      ],
    },
    {
      id: 'equipment',
      title: 'Equipment and responsibilities',
      breakBefore: 'none',
      blocks: [
        { t: 'heading', level: 1, text: 'Who brings what' },
        { t: 'list', items: ['Band: 6 vocal microphones ✓', 'Venue: 5 wedges, 14 stands', 'To be confirmed: 2 DI boxes'] },
      ],
    },
    {
      id: 'notes',
      title: 'Notes and open questions',
      breakBefore: 'none',
      blocks: [
        { t: 'para', text: 'Please keep the click out of the audience mix.', tone: 'strong' },
        { t: 'heading', level: 2, text: 'To be confirmed' },
        { t: 'list', items: unresolved(o.open ?? 25) },
      ],
    },
  ];
  return {
    title: o.title ?? 'The Example Four — Stage plot and technical packet',
    paper: o.paper ?? 'letter',
    footer: 'The Example Four · Revision 3',
    stamp: o.stamp ?? 'DRAFT',
    sections,
    fileName: 'TheExampleFour_StagePlot_2026-12-05_Rev03.pdf',
    revision: 3,
    generatedAt: NOW,
  };
}

const save = (name: string, bytes: Uint8Array): void => {
  const dir = process.env.SP_PDF_OUT;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), bytes);
};

const PAPERS: SpPaper[] = ['letter', 'a4'];

// ───────────────────────── the fonts ─────────────────────────
describe('stage plot PDF: fonts and encoding', () => {
  it('has the published Helvetica and Helvetica-Bold widths for WinAnsi 32–255', () => {
    assert.equal(SP_PDF_HELVETICA.length, 224);
    assert.equal(SP_PDF_HELVETICA_BOLD.length, 224);
    const w = (table: readonly number[], ch: string): number => table[ch.charCodeAt(0) - 32];
    assert.deepEqual([' ', 'A', 'W', 'i', 'm'].map((c) => w(SP_PDF_HELVETICA, c)), [278, 667, 944, 222, 833]);
    assert.deepEqual([' ', 'A', 'W', 'i', 'm'].map((c) => w(SP_PDF_HELVETICA_BOLD, c)), [278, 722, 944, 278, 889]);
    for (const d of '0123456789') {
      assert.equal(w(SP_PDF_HELVETICA, d), 556);
      assert.equal(w(SP_PDF_HELVETICA_BOLD, d), 556);
    }
    // the codes WinAnsi leaves undefined have no width; every other code has one
    const undefinedCodes = [127, 129, 141, 143, 144, 157];
    for (let code = 32; code <= 255; code++) {
      for (const table of [SP_PDF_HELVETICA, SP_PDF_HELVETICA_BOLD]) {
        if (undefinedCodes.includes(code)) assert.equal(table[code - 32], 0, `code ${code}`);
        else assert.ok(table[code - 32] >= 167 && table[code - 32] <= 1015, `code ${code}`);
      }
    }
    // bold is never narrower than regular by more than the one known case ("@")
    for (let code = 32; code <= 255; code++) if (code !== 64) assert.ok(SP_PDF_HELVETICA_BOLD[code - 32] >= SP_PDF_HELVETICA[code - 32], `code ${code}`);
  });

  it('writes accented letters and typographic marks as their one WinAnsi byte', () => {
    const codes = (s: string): number[] => [...spPdfEncode(s)].map((c) => c.charCodeAt(0));
    assert.deepEqual(codes('áéíóúñü'), [225, 233, 237, 243, 250, 241, 252]);
    assert.deepEqual(codes('’–—“”…€•×·'), [146, 150, 151, 147, 148, 133, 128, 149, 215, 183]);
    // the same text agrees with the platform's own Windows-1252 table
    const sample = 'Señor Peña’s “café” — naïve façade, 24 ft × 16 ft · ½ in';
    assert.equal(WIN.decode(Uint8Array.from(codes(sample))), sample);
  });

  it('replaces a character outside WinAnsi with text that keeps its meaning, and never drops it silently', () => {
    assert.equal(spPdfEncode('gain ≥ 3 → ok'), 'gain >= 3 -> ok');
    assert.equal(spPdfEncode('Łukasz Dvořák, İstanbul'), 'Lukasz Dvorák, Istanbul');
    assert.equal(spPdfEncode('50 Ω'), '50 ohm');
    assert.equal(spPdfEncode('fire 🔥 band'), 'fire ? band');
    assert.equal(spPdfEncode('日本'), '??');
    // a letter typed as "e" + a combining accent is still é
    assert.deepEqual([...spPdfEncode('Cafe' + String.fromCharCode(0x301))].map((c) => c.charCodeAt(0)), [67, 97, 102, 233]);
    // line breaks are kept, tabs and odd spaces become a space, invisible characters go
    assert.equal(spPdfEncode('a\r\nb\rc\td' + String.fromCharCode(0x200b) + 'e'), 'a\nb\nc de');
    // the check and cross marks stay marks (printed from ZapfDingbats)
    assert.deepEqual([...spPdfEncode('✓✔✗✘')].map((c) => c.charCodeAt(0)), [0x100, 0x101, 0x102, 0x103]);
  });

  it('never produces a byte that WinAnsi does not define, for any character', () => {
    const bad = new Set([127, 129, 141, 143, 144, 157]);
    for (let cp = 0; cp <= 0xffff; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      const out = spPdfEncode(String.fromCharCode(cp));
      for (let i = 0; i < out.length; i++) {
        const c = out.charCodeAt(i);
        assert.ok(c === 10 || (c >= 32 && c <= 255 && !bad.has(c)) || (c >= 0x100 && c <= 0x103), `U+${cp.toString(16)} gave code ${c}`);
      }
    }
  });

  it('wraps to the width, keeps every character, and divides a word only when it is longer than a line', () => {
    const text = spPdfEncode('Keyboards left/right stereo pair through two DI boxes, Supercalifragilisticexpialidocious-and-then-some/with/many/parts');
    for (const [size, bold, maxW] of [[10, false, 80], [10, true, 44], [9, false, 20], [10, false, 3]] as const) {
      const lines = spPdfWrap(text, size, bold, maxW);
      assert.equal(squash(lines.join(' ')), squash(text), 'no character is lost');
      for (const l of lines) assert.ok(l.length === 1 || spPdfWidth(l, size, bold) <= maxW + 0.01, `"${l}" fits ${maxW}`);
    }
    // words that fit are never divided
    for (const l of spPdfWrap(spPdfEncode('one two three four five six seven'), 10, false, 40)) for (const w of l.split(' ')) assert.ok(['one', 'two', 'three', 'four', 'five', 'six', 'seven'].includes(w));
    assert.deepEqual(spPdfWrap('', 10, false, 100), ['']);
    assert.deepEqual(spPdfWrap(spPdfEncode('a\n\nb'), 10, false, 100), ['a', '', 'b']);
  });
});

// ───────────────────────── the file ─────────────────────────
describe('stage plot PDF: the file', () => {
  it('is a PDF 1.4 file with a valid xref table, trailer and page tree, on Letter and on A4', () => {
    const boxes: string[] = [];
    for (const paper of PAPERS) {
      const bytes = spPdfBytes(packet({ paper }));
      save(`sp_32_${paper}.pdf`, bytes);
      assert.ok(bytes instanceof Uint8Array);
      const p = parsePdf(bytes);
      assert.ok(p.pages.length >= 3, 'a full packet has several pages');
      for (const pg of p.pages) {
        assert.deepEqual(pg.mediaBox, [0, 0, SP_PDF_PAPER[paper].w, SP_PDF_PAPER[paper].h]);
      }
      boxes.push(p.pages[0].mediaBox.join(' '));
      // the two standard fonts, WinAnsi; the third only because this packet prints a ✓
      assert.deepEqual(p.fontNames, ['Helvetica', 'Helvetica-Bold', 'ZapfDingbats']);
      assert.match(p.objects.get(3) ?? '', /\/Subtype \/Type1 \/BaseFont \/Helvetica \/Encoding \/WinAnsiEncoding/);
      assert.match(p.objects.get(4) ?? '', /\/Subtype \/Type1 \/BaseFont \/Helvetica-Bold \/Encoding \/WinAnsiEncoding/);
      // page streams are plain (no filter), and the whole body is 7-bit text after the header line
      assert.ok(!p.raw.includes('/Filter'));
      assert.ok(!/[\x80-\xff]/.test(p.raw.slice(p.raw.indexOf('\n1 0 obj'))));
    }
    assert.deepEqual(boxes, ['0 0 612 792', '0 0 595.28 841.89']);
    assert.notEqual(boxes[0], boxes[1], 'Letter and A4 are different pages');
  });

  it('gives the same bytes for the same packet, and its date is the snapshot’s, not the clock’s', () => {
    const a = spPdfBytes(packet());
    const b = spPdfBytes(packet());
    assert.deepEqual(a, b);
    assert.ok(latin1(a).includes('/CreationDate (D:20270115080000Z)'));
    assert.notDeepEqual(spPdfBytes(packet({ inputs: 31 })), a);
  });

  it('prints EVERY input label, every row note and every open question of a 32-input packet', () => {
    for (const paper of PAPERS) {
      const p = parsePdf(spPdfBytes(packet({ paper, inputs: 32, open: 25 })));
      const text = allText(p);
      for (let i = 0; i < 32; i++) {
        assert.ok(text.includes(squash(inputLabel(i))), `${paper}: input "${inputLabel(i)}"`);
        if (i % 3 === 1) assert.ok(text.includes(squash(inputNote(i))), `${paper}: the note of input ${i + 1}`);
      }
      for (const q of unresolved(25)) assert.ok(text.includes(squash(q)), `${paper}: "${q}"`);
      for (const name of PEOPLE) assert.ok(text.includes(squash(name)), `${paper}: ${name}`);
      // a label with ( ) and \ comes back exactly
      assert.ok(text.includes(squash('Trumpet & flugelhorn \\ doubling [17]')));
      assert.ok(text.includes(squash('Rack tom 1 (10 in) [06]')));
    }
  });

  it('repeats the header of a 60-row table on every page it runs to, and never splits a row from its note', () => {
    for (const paper of PAPERS) {
      const bytes = spPdfBytes(packet({ paper, inputs: 60, open: 40 }));
      save(`sp_60_${paper}.pdf`, bytes);
      const p = parsePdf(bytes);
      const isHeader = (r: Run): boolean => r.bold && r.size === SP_PDF_TABLE_PT && r.text === HEAD.capture;
      const tablePages = new Set<number>();
      let last = -1;
      for (let i = 0; i < 60; i++) {
        const at = pagesWith(p, inputLabel(i));
        assert.equal(at.length, 1, `${paper}: row ${i + 1} is printed once, on one page`);
        assert.ok(at[0] >= last, 'rows are in order');
        last = at[0];
        tablePages.add(at[0]);
        if (i % 3 === 1) assert.deepEqual(pagesWith(p, inputNote(i)), at, `${paper}: the note of row ${i + 1} is on the row's page`);
      }
      assert.ok(tablePages.size >= 3, `${paper}: 60 rows need several pages (got ${tablePages.size})`);
      for (const n of tablePages) {
        const runs = p.pages[n].runs;
        const heads = runs.map((r, k) => (isHeader(r) ? k : -1)).filter((k) => k >= 0);
        assert.equal(heads.length, 1, `${paper}: page ${n + 1} has the table header once`);
        for (const label of Object.values(HEAD)) assert.ok(squash(runs.filter((r) => r.bold && r.size === SP_PDF_TABLE_PT).map((r) => r.text).join('')).includes(squash(label)), `${paper}: page ${n + 1} header "${label}"`);
        // the header is above the first row of that page: it comes first, and higher on the sheet
        const firstRow = runs.findIndex((r) => /\[\d\d\]$/.test(r.text.trim()) || /^\d+$/.test(r.text.trim()));
        const firstCell = runs.findIndex((r, k) => k > heads[0] && !r.bold && r.size === SP_PDF_TABLE_PT);
        assert.ok(firstRow === -1 || heads[0] < firstRow);
        if (firstCell >= 0) assert.ok(runs[heads[0]].y > runs[firstCell].y, 'the header is above the rows');
      }
    }
  });

  it('never prints table text under 10 pt, and nothing at all under 7 pt', () => {
    const p = parsePdf(spPdfBytes(packet({ inputs: 60 })));
    const rowsText = squash(inputRows(60).map((r) => Object.values(r.cells).join(' ') + ' ' + (r.note ?? '')).join(' '));
    let checked = 0;
    for (const pg of p.pages) {
      for (const r of pg.runs) {
        assert.ok(r.size >= 7, `"${r.text}" is ${r.size} pt`);
        // a whole line of a row or of a note (long enough not to be a word found by chance)
        if (squash(r.text).length >= 12 && rowsText.includes(squash(r.text)) && /\[\d\d\]|Note \d\d|End of note/.test(r.text)) {
          assert.equal(r.size, SP_PDF_TABLE_PT, `table text "${r.text}"`);
          checked++;
        }
      }
    }
    assert.ok(checked >= 60, `checked ${checked} table lines`);
    assert.equal(SP_PDF_TABLE_PT, 10);
  });

  it('keeps every word inside the 0.6 in margins', () => {
    assert.ok(Math.abs(SP_PDF_MARGIN - 0.6 * 72) < 1e-9);
    for (const paper of PAPERS) {
      const { w, h } = SP_PDF_PAPER[paper];
      const p = parsePdf(spPdfBytes(packet({ paper, inputs: 60 })));
      for (const pg of p.pages) {
        for (const r of pg.runs) {
          const len = spPdfWidth(spPdfEncode(r.text), r.size, r.bold);
          // the two ends of the line of text (a turned line runs up or down the page)
          const x1 = r.up || r.down ? r.x : r.x + len;
          const y1 = r.up ? r.y + len : r.down ? r.y - len : r.y;
          const where = `${paper}: "${r.text}" at ${r.x},${r.y}`;
          assert.ok(r.x >= SP_PDF_MARGIN - 0.5 && x1 <= w - SP_PDF_MARGIN + 0.5, where);
          assert.ok(Math.min(r.y, y1) >= SP_PDF_MARGIN - 0.5 && Math.max(r.y, y1) <= h - SP_PDF_MARGIN + 0.5, where);
        }
      }
    }
  });

  it('prints the title, the stamp and "Page N of M" on every page', () => {
    for (const paper of PAPERS) {
      const p = parsePdf(spPdfBytes(packet({ paper, inputs: 60 })));
      const total = p.pages.length;
      p.pages.forEach((pg, i) => {
        assert.ok(pg.flat.includes(squash('The Example Four — Stage plot and technical packet')), `page ${i + 1}: title`);
        const stamps = pg.runs.filter((r) => r.text === 'DRAFT' && r.bold);
        assert.equal(stamps.length, 1, `page ${i + 1}: the stamp`);
        const title = pg.runs.find((r) => r.text.startsWith('The Example Four —'));
        assert.ok(title);
        assert.ok(title.y > SP_PDF_PAPER[paper].h - SP_PDF_MARGIN - 20, 'the title is at the top of the page');
        assert.ok(Math.abs(stamps[0].y - title.y) < 12, 'the stamp is beside the title');
        assert.ok(stamps[0].x > title.x, 'the stamp is to the right of the title');
        const foot = pg.runs[pg.runs.length - 1];
        assert.equal(foot.text, `The Example Four · Revision 3 · Page ${i + 1} of ${total}`);
        assert.ok(foot.y < 60, 'the footer is at the bottom of the page');
      });
    }
    // no stamp when the packet has none
    const clean = parsePdf(spPdfBytes(packet({ stamp: '' })));
    for (const pg of clean.pages) assert.ok(!pg.runs.some((r) => r.text === 'DRAFT'));
  });

  it('prints accents, curly quotes and dashes in the title and the footer as they are', () => {
    const words = 'Los Niños – “Año Nuevo”';
    const d = packet({ title: `${words} ✓` });
    d.footer = `${words} · Revision 12`;
    const p = parsePdf(spPdfBytes(d));
    p.pages.forEach((pg, i) => {
      assert.equal(pg.runs[pg.runs.length - 1].text, `${words} · Revision 12 · Page ${i + 1} of ${p.pages.length}`);
      assert.ok(pg.runs.some((r) => r.text === `${words} ✓`), 'the title');
    });
    // the file's own title (a PDF program shows it in its window) is the same words
    const hex = /\/Title <FEFF([0-9A-F]+)>/.exec(p.raw)?.[1] ?? '';
    assert.equal((hex.match(/.{4}/g) ?? []).map((h) => String.fromCharCode(parseInt(h, 16))).join(''), `${words} ✓`);
  });

  it('starts a section on a new page only when the packet says so (the compact packet says never)', () => {
    const full = parsePdf(spPdfBytes(packet({ inputs: 2, open: 1 })));
    const compact = parsePdf(spPdfBytes(packet({ inputs: 2, open: 1, breaks: 'none' })));
    assert.ok(compact.pages.length < full.pages.length, `${compact.pages.length} < ${full.pages.length}`);
    // full: "Input list" is the first thing under the page header of its page
    const n = pagesWith(full, 'Input list')[0];
    assert.ok(n > 0);
    assert.equal(full.pages[n].runs.filter((r) => r.size > 9)[0].text, 'Input list');
    // compact: the same words, the same sizes
    assert.equal(squash(allText(compact)).length > 0, true);
    for (let i = 0; i < 2; i++) assert.ok(allText(compact).includes(squash(inputLabel(i))));
    const sizes = (p: Parsed): number => Math.min(...p.pages.flatMap((pg) => pg.runs.map((r) => r.size)));
    assert.equal(sizes(compact), sizes(full), 'compact never means smaller text');
  });

  /** A packet of plain lines: `filler` one-line paragraphs, then the blocks under test. */
  const lines = (filler: number, rest: SpDocSection[], first: Partial<SpDocSection> = {}): SpDoc => ({
    ...packet(),
    sections: [{ id: 'notes', title: 'Filler', breakBefore: 'none', blocks: Array.from({ length: filler }, (_, i) => ({ t: 'para' as const, text: `Filler line <${pad(i + 1)}>.` })), ...first }, ...rest],
  });
  /** The lowest baseline a section's words may have (the footer is under it), and the highest. */
  const pageSpan = (paper: SpPaper): { top: number; bottom: number } => ({ top: SP_PDF_PAPER[paper].h - SP_PDF_MARGIN - 40, bottom: SP_PDF_MARGIN + 22 });

  it('with "auto", starts a section on a new page only when less than a third of the page is left', () => {
    for (const paper of PAPERS) {
      const next = (mode: SpDocSection['breakBefore'], filler: number): { page: number; fillerPage: number; left: number } => {
        const d = lines(filler, [{ id: 'inputs', title: 'Next section', breakBefore: mode, blocks: [{ t: 'para', text: 'Its first line.' }] }]);
        const p = parsePdf(spPdfBytes({ ...d, paper }));
        const last = pagesWith(p, `Filler line <${pad(filler)}>.`)[0];
        const run = p.pages[last].runs.find((r) => r.text === `Filler line <${pad(filler)}>.`);
        assert.ok(run);
        const span = pageSpan(paper);
        // the share of the page that is still free under the last filler line
        return { page: pagesWith(p, 'Next section')[0], fillerPage: last, left: (run.y - span.bottom) / (span.top - span.bottom) };
      };
      let moved = 0;
      let stayed = 0;
      for (let filler = 1; filler <= 46; filler += 1) {
        const auto = next('auto', filler);
        if (auto.fillerPage !== 0) break;
        // 'page' always moves; 'none' moves only when the page is full
        assert.equal(next('page', filler).page, 1, `${paper}: 'page' after ${filler} lines`);
        if (auto.left > 0.12) assert.equal(next('none', filler).page, 0, `${paper}: 'none' after ${filler} lines`);
        // 'auto': the same page while a third or more is left, a new page when clearly less is
        if (auto.left > 0.38) assert.equal(auto.page, 0, `${paper}: ${filler} lines, ${Math.round(auto.left * 100)}% left: it follows on`);
        if (auto.left < 0.28) assert.equal(auto.page, 1, `${paper}: ${filler} lines, ${Math.round(auto.left * 100)}% left: a new page`);
        if (auto.page === 0) stayed += 1;
        else moved += 1;
      }
      assert.ok(stayed >= 10 && moved >= 5, `${paper}: both cases were seen (${stayed} stayed, ${moved} moved)`);
    }
  });

  it('keeps a heading, and the short lines under it, with the first row of the table that follows', () => {
    const table = { columns: COLUMNS, rows: inputRows(6), empty: 'No inputs yet.' };
    for (const paper of PAPERS) {
      let pushed = 0;
      for (let filler = 20; filler <= 46; filler += 1) {
        const d = lines(filler, [], {
          blocks: [
            ...Array.from({ length: filler }, (_, i) => ({ t: 'para' as const, text: `Filler line <${pad(i + 1)}>.` })),
            { t: 'heading', level: 2, text: 'House input list' },
            { t: 'para', text: 'Channel numbers are the band’s proposed order.', tone: 'muted' },
            { t: 'para', text: 'Equipment named here is a preference unless it says REQUIRED.', tone: 'muted' },
            { t: 'table', table },
          ],
        });
        const p = parsePdf(spPdfBytes({ ...d, paper }));
        const at = (text: string): number => {
          const pages = pagesWith(p, text);
          assert.ok(pages.length >= 1, text);
          return pages[0];
        };
        const head = at('House input list');
        assert.equal(at('Channel numbers are the band’s proposed order.'), head, `${paper}, ${filler} lines: the first line under the heading`);
        assert.equal(at('Equipment named here is a preference unless it says REQUIRED.'), head, `${paper}, ${filler} lines: the second line`);
        assert.equal(at(inputLabel(0)), head, `${paper}, ${filler} lines: the first row of the table`);
        assert.ok(p.pages[head].runs.some((r) => r.bold && r.text === HEAD.capture), 'and the table header');
        // the heading went overleaf although the page still had room for it alone
        if (head === 1 && at(`Filler line <${pad(filler)}>.`) === 0) pushed += 1;
      }
      assert.ok(pushed >= 2, `${paper}: the rule was needed ${pushed} times`);
    }
    // the same for a line of text above a table with no heading
    for (let filler = 30; filler <= 46; filler += 1) {
      const d = lines(filler, [], {
        blocks: [...Array.from({ length: filler }, (_, i) => ({ t: 'para' as const, text: `Filler line <${pad(i + 1)}>.` })), { t: 'para', text: 'One line about the split.' }, { t: 'table', table }],
      });
      const p = parsePdf(spPdfBytes(d));
      assert.deepEqual(pagesWith(p, 'One line about the split.'), [pagesWith(p, inputLabel(0))[0]], `${filler} lines`);
    }
  });

  it('never divides a phone number at the end of a line, and prints it with ordinary spaces', () => {
    const phones = Array.from({ length: 14 }, (_, n) => (n % 2 ? `+1 555 010 01${pad(n)}` : `(555) 010 01${pad(n)}`));
    const d = packet();
    d.sections = [
      {
        id: 'plot',
        title: 'Stage plot',
        breakBefore: 'none',
        // more and more words before the number, so that a line end falls at every place in it
        blocks: [{ t: 'facts', rows: phones.map((ph, n): [string, string] => ['Technical contact', `${'ab '.repeat(n)}${ph} · maria@example.com`]) }, { t: 'para', text: phones.map((ph, n) => `${'word '.repeat(n)}call ${ph} before 5 PM`).join(' ') }],
      },
    ];
    for (const paper of PAPERS) {
      const runs = parsePdf(spPdfBytes({ ...d, paper })).pages.flatMap((pg) => pg.runs);
      for (const ph of phones) {
        const whole = runs.filter((r) => r.text.includes(ph));
        assert.equal(whole.length, 2, `${paper}: "${ph}" is on one line in the facts and in the paragraph`);
      }
      // the values did wrap (so the rule was needed), and nothing left the page
      assert.ok(runs.some((r) => r.text === 'maria@example.com' || r.text.startsWith('· maria@example.com')));
      for (const r of runs) assert.ok(r.x + spPdfWidth(spPdfEncode(r.text), r.size, r.bold) <= SP_PDF_PAPER[paper].w - SP_PDF_MARGIN + 0.5, `"${r.text}"`);
    }
    // a row of channel numbers is not a phone number: it still wraps where it needs to
    const numbers = Array.from({ length: 40 }, (_, i) => String(i + 10)).join(' ');
    d.sections = [{ id: 'notes', title: 'Notes', breakBefore: 'none', blocks: [{ t: 'facts', rows: [['Channels', numbers], ['A', 'b'], ['C', 'd'], ['E', 'f']] }] }];
    const p = parsePdf(spPdfBytes(d));
    assert.ok(p.pages[0].flat.includes(squash(numbers)));
    assert.ok(!p.pages[0].runs.some((r) => r.text === numbers), 'more than one line');
  });

  it('prints a row that is taller than a whole page, to its last word', () => {
    const words = Array.from({ length: 1500 }, (_, i) => `<word${i}>`);
    const d = packet({ inputs: 3 });
    const table = d.sections[1].blocks[1];
    assert.equal(table.t, 'table');
    if (table.t === 'table') table.table.rows[1].note = words.join(' ');
    const p = parsePdf(spPdfBytes(d));
    // every word once, in order, over more than one page (the page header and footer come between)
    let last = -1;
    const used = new Set<number>();
    for (const w of words) {
      const at = pagesWith(p, w);
      assert.equal(at.length, 1, w);
      assert.ok(at[0] >= last, `${w} is in order`);
      last = at[0];
      used.add(at[0]);
    }
    assert.ok(used.size >= 2, 'the note needed more than one page');
    // each page it runs to starts with the table header, and the rows after it are printed too
    for (const n of used) assert.ok(p.pages[n].runs.some((r) => r.bold && r.text === HEAD.capture), `page ${n + 1} repeats the header`);
    assert.deepEqual(pagesWith(p, inputLabel(2)), [last]);
    // a row that DOES fit on a page is still never divided
    assert.equal(pagesWith(p, inputLabel(0)).length, 1);
  });

  it('prints the words of an empty table, and makes one page for an empty packet', () => {
    const d = packet();
    d.sections = [{ id: 'inputs', title: 'Input list', breakBefore: 'page', blocks: [{ t: 'table', table: { columns: COLUMNS, rows: [], empty: 'No inputs yet.' } }] }];
    const p = parsePdf(spPdfBytes(d));
    assert.equal(p.pages.length, 1);
    assert.ok(p.pages[0].flat.includes(squash('No inputs yet.')));
    assert.ok(p.pages[0].flat.includes(squash(HEAD.who)));
    assert.deepEqual(p.fontNames, ['Helvetica', 'Helvetica-Bold'], 'no third font when no mark is printed');
    const none = parsePdf(spPdfBytes({ ...d, sections: [] }));
    assert.equal(none.pages.length, 1);
    assert.equal(none.pages[0].runs[none.pages[0].runs.length - 1].text, 'The Example Four · Revision 3 · Page 1 of 1');
  });

  it('does not print a section title twice when the section starts with the same heading', () => {
    const d = packet();
    d.sections = [{ id: 'notes', title: 'Notes', breakBefore: 'none', blocks: [{ t: 'heading', level: 1, text: 'Notes' }, { t: 'para', text: 'One note.' }] }];
    const p = parsePdf(spPdfBytes(d));
    assert.equal(p.pages[0].runs.filter((r) => r.text === 'Notes').length, 1);
  });

  it('keeps a ✓ a real ✓, from the third standard font', () => {
    const p = parsePdf(spPdfBytes(packet()));
    const run = p.pages.flatMap((pg) => pg.runs).find((r) => r.text.includes('✓'));
    assert.ok(run);
    assert.equal(run.text, 'Band: 6 vocal microphones ✓');
    assert.deepEqual(run.fonts, ['F1', 'F3']);
    assert.match([...p.objects.values()].find((o) => o.includes('ZapfDingbats')) ?? '', /\/Type \/Font \/Subtype \/Type1 \/BaseFont \/ZapfDingbats/);
  });
});

// ───────────────────────── the plot ─────────────────────────
describe('stage plot PDF: the plot', () => {
  const plotPage = (paper: SpPaper, grid = 0.5): Page => parsePdf(spPdfBytes(packet({ paper, grid }))).pages[0];
  const find = (pg: Page, text: string): Run => {
    // a name too long for the sheet is wrapped: then this is its first line, with the rest in the lines after it
    const k = pg.runs.findIndex((x) => x.text === text || (x.text.length >= 4 && squash(text).startsWith(squash(x.text))));
    assert.ok(k >= 0, `"${text}" is on the plot page`);
    let got = '';
    for (let i = k; i < pg.runs.length && got.length < squash(text).length; i++) got += squash(pg.runs[i].text);
    assert.equal(got, squash(text), `"${text}" is printed whole`);
    return pg.runs[k];
  };
  const widthOf = (r: Run): number => spPdfWidth(spPdfEncode(r.text), r.size, r.bold);

  it('labels the four directions the way a performer facing the audience means them', () => {
    for (const paper of PAPERS) {
      const pg = plotPage(paper);
      const up = find(pg, SP_PDF_PLOT_WORDS.up);
      const down = find(pg, SP_PDF_PLOT_WORDS.down);
      const sr = find(pg, SP_PDF_PLOT_WORDS.right);
      const sl = find(pg, SP_PDF_PLOT_WORDS.left);
      assert.equal(SP_PDF_PLOT_WORDS.down, 'AUDIENCE / DOWNSTAGE');
      // PDF's y grows upward: UPSTAGE is higher on the sheet than the audience line
      assert.ok(up.y > down.y, 'UPSTAGE is above, the audience below');
      assert.ok(sr.x < sl.x, 'STAGE RIGHT is at the left side of the sheet, STAGE LEFT at the right');
      // the two side words are turned (one reads up, one reads down); the other two are level
      assert.ok(sr.up && sl.down && !up.up && !up.down && !down.up && !down.down);
      for (const r of [up, down, sr, sl]) assert.ok(r.bold && r.size === SP_PDF_PLOT.direction);
      // every item is between them
      for (const name of PEOPLE) {
        const r = find(pg, name);
        assert.ok(r.y < up.y && r.y > down.y && r.x > sr.x && r.x < sl.x, name);
      }
    }
  });

  it('prints every label, tag and badge, with the names of people in bold', () => {
    for (const paper of PAPERS) {
      const pg = plotPage(paper);
      const plot = plot30();
      for (const it of plot.items) {
        if (it.label) assert.ok(pg.flat.includes(squash(it.label)), `${paper}: label "${it.label}"`);
        for (const b of it.badges) assert.ok(pg.runs.some((r) => r.text === b && r.bold && r.size === SP_PDF_PLOT.badge), `${paper}: badge "${b}"`);
        if (it.tag) assert.ok(pg.runs.some((r) => r.text === it.tag && r.bold), `${paper}: tag "${it.tag}"`);
      }
      for (const name of PEOPLE) assert.equal(find(pg, name).bold, true, `${name} is bold`);
      assert.equal(find(pg, PEOPLE[0]).size, SP_PDF_PLOT.person);
      assert.equal(find(pg, 'Drum kit').bold, false);
      assert.equal(find(pg, 'Drum kit').size, SP_PDF_PLOT.label);
      assert.ok(SP_PDF_PLOT.person > SP_PDF_PLOT.label && SP_PDF_PLOT.label >= 9, 'a person’s name is larger than an equipment label; nothing on the plot is under 9 pt');
      // a tag is inside its symbol: the DI box at x = 6.8 m is right of the one at 5.2 m
      const tags = pg.runs.filter((r) => r.text === 'DI');
      assert.equal(tags.length, 2);
      assert.ok(Math.abs(tags[0].x - tags[1].x) > 50);
      // the size note, the view note and the legend
      assert.ok(pg.runs.some((r) => r.text === `Stage size: ${plot.sizeNote}`), 'the size note');
      assert.ok(pg.flat.includes(squash(plot.viewNote)));
      for (const l of plot.legend) assert.ok(pg.flat.includes(squash(l)), l);
    }
  });

  it('prints a name and its references as one row: the name, then the boxes to its right', () => {
    for (const paper of PAPERS) {
      const pg = plotPage(paper);
      const name = find(pg, 'Drum kit');
      const k = pg.runs.indexOf(name);
      const [a, b] = [pg.runs[k + 1], pg.runs[k + 2]];
      assert.deepEqual([a.text, b.text], ['1–8', 'M4']);
      assert.ok(Math.abs(a.y - name.y) < 1.5 && Math.abs(b.y - name.y) < 1.5, 'one row');
      assert.ok(name.x + widthOf(name) < a.x && a.x + widthOf(a) < b.x, 'the name, then its boxes');
      // `labelAt` is the top-center of the NAME: the kit stands at the middle of the stage, so its name is centered on the sheet
      assert.ok(Math.abs(name.x + widthOf(name) / 2 - SP_PDF_PAPER[paper].w / 2) < 0.6);
      // an input number has a box with square corners, a mix code one with round ends: told apart by shape
      const radii = [...pg.stream.matchAll(/(?:^|\n)0\.8 w 0 G \[\] 0 d 1 g [\d.]+ ([\d.]+) m [\d.]+ [\d.]+ l [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ ([\d.]+) c/g)].map((m) => Number(m[1]) - Number(m[2]));
      const all = plot30().items.flatMap((it) => it.badges);
      const mixes = all.filter((x) => /^M\d+$/.test(x)).length;
      assert.equal(radii.length, all.length, `${paper}: one box for each badge`);
      assert.equal(radii.filter((r) => Math.abs(r - SP_PDF_PLOT.badgeH / 2) < 0.05).length, mixes, 'round ends for mix codes');
      assert.equal(radii.filter((r) => Math.abs(r - 1.5) < 0.05).length, all.length - mixes, 'square corners for input numbers');
    }
    // plain PDF only: nothing see-through, no color
    assert.ok(!parsePdf(spPdfBytes(packet())).raw.includes('/ExtGState'));
  });

  it('draws the stage with a heavier front edge, the grid in light gray only when asked, and dashes where the symbol has them', () => {
    const withGrid = plotPage('letter', 0.5).stream;
    const noGrid = plotPage('letter', 0).stream;
    const count = (s: string, re: RegExp): number => (s.match(re) ?? []).length;
    const gridLine = /(^|\n)0\.4 w 0\.74 G \[\] 0 d [\d. ]+ m [\d. ]+ l S/g;
    // 7.2 m wide and 4.5 m deep, every 0.5 m: 14 lines down, 8 lines across
    assert.equal(count(withGrid, gridLine), 14 + 8);
    assert.equal(count(noGrid, gridLine), 0);
    // one 3 pt line (the downstage edge), lower on the sheet than the top of the 1.4 pt stage outline
    const front = /(^|\n)3 w 0 G \[\] 0 d ([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l S/.exec(withGrid);
    assert.ok(front, 'the front edge is 3 pt');
    assert.equal(front[3], front[5], 'it is level');
    const outline = /(^|\n)1\.4 w 0 G \[\] 0 d ([\d.]+) ([\d.]+) m/.exec(withGrid);
    assert.ok(outline);
    assert.ok(Number(front[3]) < Number(outline[3]), 'the heavy edge is the one nearest the audience (lower on the sheet)');
    assert.ok(Number(front[3]) > find(plotPage('letter'), SP_PDF_PLOT_WORDS.down).y, 'and the audience line is under it');
    // dashes: the riser and the two cymbals of the kit, and nothing else
    assert.equal(count(withGrid, /\[4 3\] 0 d/g), 3);
    // fills: white (paper), light gray (tone) and black (ink) are all used; nothing has a color
    assert.ok(/ 1 g /.test(withGrid) && / 0\.82 g /.test(withGrid) && / 0 g /.test(withGrid));
    assert.ok(!/ (rg|RG|k|K)(\n| )/.test(withGrid), 'gray only');
  });

  it('says NOT TO SCALE in bold capitals when the stage size is not known', () => {
    const d = packet();
    const block = d.sections[0].blocks[1];
    assert.equal(block.t, 'plot');
    if (block.t !== 'plot') return;
    block.plot.toScale = false;
    block.plot.sizeNote = 'Not to scale';
    const pg = parsePdf(spPdfBytes(d)).pages[0];
    const note = pg.runs.find((r) => r.text === 'NOT TO SCALE');
    assert.ok(note && note.bold);
    assert.ok(note.y < find(pg, SP_PDF_PLOT_WORDS.down).y, 'under the drawing');
  });

  it('shows an item that is far offstage, and a very long name, without drawing off the sheet or cutting a word', () => {
    const d = packet();
    const block = d.sections[0].blocks[1];
    assert.equal(block.t, 'plot');
    if (block.t !== 'plot') return;
    const longName = 'The second keyboard rig with the rotating speaker cabinet, the bass pedals, the volume pedal and the music stand light that the venue said it would lend us for the night';
    block.plot.items.push(item('far', 'rack', -1.8, 5.6, 'Front of house desk', ['FOH']));
    block.plot.items.push(item('long', 'keyboard', 3.0, 3.0, longName, ['14–15', 'M2']));
    const { w, h } = SP_PDF_PAPER.letter;
    const pg = parsePdf(spPdfBytes(d)).pages[0];
    const r = find(pg, 'Front of house desk');
    assert.ok(r.x >= SP_PDF_MARGIN && r.x < w - SP_PDF_MARGIN && r.y > SP_PDF_MARGIN && r.y < h - SP_PDF_MARGIN);
    assert.ok(r.y > find(pg, SP_PDF_PLOT_WORDS.down).y, 'still above the audience line');
    find(pg, longName);
    // every word and every path point of the page is on the sheet, inside the margins
    for (const run of pg.runs) {
      if (run.up || run.down) continue;
      assert.ok(run.x >= SP_PDF_MARGIN - 0.5 && run.x + widthOf(run) <= w - SP_PDF_MARGIN + 0.5, `"${run.text}"`);
    }
    for (const m of pg.stream.matchAll(/(-?[\d.]+) (-?[\d.]+) (m|l)( |\n)/g)) {
      assert.ok(Number(m[1]) >= SP_PDF_MARGIN - 1 && Number(m[1]) <= w - SP_PDF_MARGIN + 1, `x ${m[1]}`);
      assert.ok(Number(m[2]) >= SP_PDF_MARGIN - 1 && Number(m[2]) <= h - SP_PDF_MARGIN + 1, `y ${m[2]}`);
    }
  });

  it('fits a deep stage on the page by drawing it smaller, never by making words smaller', () => {
    const d = packet();
    const block = d.sections[0].blocks[1];
    if (block.t !== 'plot') return;
    block.plot.depthM = 14;
    block.plot.items = block.plot.items.map((it) => ({ ...it }));
    const p = parsePdf(spPdfBytes(d));
    const n = pagesWith(p, SP_PDF_PLOT_WORDS.down)[0];
    const pg = p.pages[n];
    assert.deepEqual(pagesWith(p, SP_PDF_PLOT_WORDS.up), [n], 'the whole plot is on one page');
    assert.ok(find(pg, SP_PDF_PLOT_WORDS.down).y >= SP_PDF_MARGIN);
    assert.equal(find(pg, PEOPLE[0]).size, SP_PDF_PLOT.person);
    assert.equal(find(pg, 'Drum kit').size, SP_PDF_PLOT.label);
    // the drawing itself is never taller than the packet allows
    const front = /(^|\n)3 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(pg.stream);
    const outline = /(^|\n)1\.4 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(pg.stream);
    assert.ok(front && outline);
    assert.ok(Number(outline[2]) - Number(front[2]) <= SP_PDF_PLOT.maxH + 0.01);
  });

  it('draws the plot of one or two performers at most 240 pt tall, and any other plot at most 380', () => {
    const height = (people: number): number => {
      const d = packet();
      const block = d.sections[0].blocks[1];
      assert.equal(block.t, 'plot');
      if (block.t !== 'plot') return 0;
      block.plot.depthM = 6;
      block.plot.marginM = 1;
      block.plot.items = Array.from({ length: people }, (_, i) => item(`p${i}`, 'performer', 1 + i, 3, PEOPLE[i], [], true));
      block.plot.items.push(item('w', 'wedge', 3, 5, 'Wedge 1', ['M1']));
      const s = parsePdf(spPdfBytes(d)).pages[0].stream;
      const front = /(^|\n)3 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(s);
      const outline = /(^|\n)1\.4 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(s);
      assert.ok(front && outline);
      // the stage is 6 m of the 8 m drawn (1 m of room upstage and downstage)
      return ((Number(outline[2]) - Number(front[2])) * 8) / 6;
    };
    assert.equal(SP_PDF_PLOT.smallH, 240);
    assert.equal(SP_PDF_PLOT.smallPeople, 2);
    for (const people of [0, 1, 2]) assert.ok(Math.abs(height(people) - 240) < 0.1, `${people} performers: ${height(people)}`);
    for (const people of [3, 5]) assert.ok(Math.abs(height(people) - 380) < 0.1, `${people} performers: ${height(people)}`);
  });

  it('draws with the same plot sizes as the packet builder and the HTML sheet (where the place of every name is worked out)', (t) => {
    const dir = join('src', 'features', 'stageplot');
    if (!existsSync(join(dir, 'spPacket.ts')) || !existsSync(join(dir, 'spPacketHtml.ts'))) {
      t.skip('the packet builder is not in this checkout');
      return;
    }
    const read = (f: string): string => readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n');
    const moved = 'the shared plot sizes moved or changed: bring SP_PDF_PLOT in spPdf.ts in line with them';
    const numberIn = (src: string, re: RegExp): number => {
      const m = re.exec(src);
      assert.ok(m, `${re}: ${moved}`);
      return Number(m[1]);
    };
    const packetSrc = read('spPacket.ts');
    const htmlSrc = read('spPacketHtml.ts');
    const type = /export const SP_PLOT_TYPE = \{([\s\S]*?)\n\} as const;/.exec(packetSrc)?.[1] ?? '';
    for (const key of ['person', 'label', 'badge', 'badgeH', 'badgePad', 'badgeGap', 'direction', 'charW', 'charWBold'] as const) {
      assert.equal(numberIn(type, new RegExp(`\\b${key}: ([\\d.]+),`)), SP_PDF_PLOT[key], `${key}: ${moved}`);
    }
    assert.equal(numberIn(packetSrc, /export const SP_PLOT_SIDE = ([\d.]+);/), SP_PDF_PLOT.side, moved);
    assert.equal(numberIn(packetSrc, /export const SP_PLOT_MAX_H = ([\d.]+);/), SP_PDF_PLOT.maxH, moved);
    assert.equal(numberIn(packetSrc, /export const SP_PLOT_SMALL_H = ([\d.]+);/), SP_PDF_PLOT.smallH, moved);
    assert.equal(numberIn(packetSrc, /export const SP_PLOT_SMALL_PEOPLE = ([\d.]+);/), SP_PDF_PLOT.smallPeople, moved);
    assert.equal(numberIn(htmlSrc, /\nconst TOP = ([\d.]+);/), SP_PDF_PLOT.top, moved);
    assert.equal(numberIn(htmlSrc, /\nconst BOTTOM = ([\d.]+);/), SP_PDF_PLOT.bottom, moved);
    assert.equal(numberIn(htmlSrc, /\nconst NOTE = ([\d.]+);/), SP_PDF_PLOT.note, moved);
    // the key: the cell sizes, the room kept at the right of a name, and the number of cells across
    const cell = /export const SP_KEY_CELL = \{([^}]*)\} as const;/.exec(packetSrc)?.[1] ?? '';
    for (const key of ['symbolW', 'symbolH', 'textPt', 'gap', 'colW', 'lineH', 'rowGap', 'headPt', 'headH'] as const) {
      assert.equal(numberIn(cell, new RegExp(`\\b${key}: ([\\d.]+)`)), SP_PDF_KEY[key], `${key}: ${moved}`);
    }
    assert.equal(numberIn(packetSrc, /const room = K\.colW - K\.symbolW - K\.gap - ([\d.]+);/), SP_PDF_KEY.right, moved);
    assert.match(packetSrc, /const cols = Math\.max\(1, Math\.floor\(width \/ K\.colW\)\);/, moved);
    assert.match(htmlSrc, /keyOps\(plot\.key, SP_PLOT_SIDE, keyTop, width - SP_PLOT_SIDE \* 2, ops\)/, moved);
    // the size note at the key's left edge; a leader's line; people drawn over the other symbols
    assert.match(htmlSrc, /x: SP_PLOT_SIDE, y: h - 4, text: plot\.toScale/, moved);
    assert.match(htmlSrc, /const LEADER = '#8a8a8a';/, moved);
    assert.match(htmlSrc, /stroke: LEADER, sw: 0\.5, dash: false/, moved);
    assert.match(htmlSrc, /\[\.\.\.plot\.items\.filter\(\(i\) => !i\.person\), \.\.\.plot\.items\.filter\(\(i\) => i\.person\)\]/, moved);
  });
});

// ───────────────────────── the key of the plot ─────────────────────────
describe('stage plot PDF: the key (what each drawn symbol is)', () => {
  const NINE: [SpObjectKind, string][] = [
    ['performer', 'Performer'],
    ['vocal-mic', 'Microphone on a stand'],
    ['drum-kit', 'Drum kit, as the audience sees it'],
    ['guitar-amp', 'Amplifier'],
    ['keyboard', 'Keyboard'],
    ['di', 'DI = direct box'],
    ['wedge', 'Wedge monitor (wide side faces the performer)'],
    ['power', 'Power wanted here'],
    ['riser', 'Riser (dashed outline)'],
  ];
  const ALL_KINDS: SpObjectKind[] = [
    'performer', 'vocal-mic', 'mic-stand', 'drum-kit', 'percussion', 'congas', 'timbales', 'bongo', 'guitar-amp', 'bass-amp', 'keyboard', 'piano', 'acoustic-guitar',
    'horn', 'playback', 'di', 'wedge', 'iem', 'drum-fill', 'sidefill', 'rack', 'stage-box', 'power', 'chair', 'music-stand', 'riser',
  ];
  const keyOf = (pairs: [SpObjectKind, string][]): SpDocKeyItem[] =>
    pairs.map(([kind, name]) => {
      // the key's own symbol (a riser is given a small sample box)
      const sym = spKeySymbol(kind);
      return { kind, name, w: sym.w, h: sym.h, shapes: sym.shapes, tag: sym.tag };
    });
  /** A small plot whose own labels are not words of the key. */
  const keyPlot = (key: SpDocKeyItem[], people = 2, depthM = 4.5): SpDocPlot => ({
    widthM: 7.2,
    depthM,
    toScale: true,
    sizeNote: '24 ft × 15 ft (estimated)',
    marginM: 0.6,
    gridM: 0,
    items: [...Array.from({ length: people }, (_, i) => item(`p${i}`, 'performer', 2 + i * 1.2, 2.5, ['Alex', 'Billie', 'Casey', 'Devon', 'Eli'][i], [`M${i + 1}`], true)), item('w', 'wedge', 2, 4, 'Front left', ['M1'])],
    viewNote: 'Left and right are as the audience sees them.',
    legend: ['A number in a box is an input channel.'],
    key,
    roomy: false,
  });
  const docOf = (plot: SpDocPlot, paper: SpPaper = 'letter', filler = 0): SpDoc => ({
    ...packet({ paper }),
    sections: [
      {
        id: 'plot',
        title: 'Stage plot',
        breakBefore: 'none',
        blocks: [...Array.from({ length: filler }, (_, i) => ({ t: 'para' as const, text: `Filler line <${pad(i + 1)}>.` })), { t: 'facts', rows: [['Venue', 'The Blue Room'], ['Date', 'December 5, 2026']] }, { t: 'plot', plot }],
      },
    ],
  });
  const times = (hay: string, needle: string): number => hay.split(needle).length - 1;
  const insideMargins = (pg: Page, paper: SpPaper): void => {
    const { w, h } = SP_PDF_PAPER[paper];
    for (const r of pg.runs) {
      if (r.up || r.down) continue;
      assert.ok(r.x >= SP_PDF_MARGIN - 0.5 && r.x + spPdfWidth(spPdfEncode(r.text), r.size, r.bold) <= w - SP_PDF_MARGIN + 0.5, `"${r.text}" is inside the side margins`);
      assert.ok(r.y >= SP_PDF_MARGIN - 0.5 && r.y <= h - SP_PDF_MARGIN + 0.5, `"${r.text}" is inside the top and bottom margins`);
    }
    for (const m of pg.stream.matchAll(/(-?[\d.]+) (-?[\d.]+) (m|l)( |\n)/g)) {
      assert.ok(Number(m[1]) >= SP_PDF_MARGIN - 1 && Number(m[1]) <= w - SP_PDF_MARGIN + 1, `x ${m[1]}`);
      assert.ok(Number(m[2]) >= SP_PDF_MARGIN - 1 && Number(m[2]) <= h - SP_PDF_MARGIN + 1, `y ${m[2]}`);
    }
  };

  it('prints the heading and every name of a 9-entry key once, on the page of the stage, with each symbol drawn', () => {
    for (const paper of PAPERS) {
      const p = parsePdf(spPdfBytes(docOf(keyPlot(keyOf(NINE)), paper)));
      save(`sp_key9_${paper}.pdf`, spPdfBytes(docOf(keyPlot(keyOf(NINE)), paper)));
      assert.equal(p.pages.length, 1);
      const pg = p.pages[0];
      const heads = pg.runs.filter((r) => r.text === SP_PDF_PLOT_WORDS.key);
      assert.equal(heads.length, 1, 'the heading KEY, once');
      assert.ok(heads[0].bold && heads[0].size === SP_PDF_KEY.headPt);
      assert.ok(pg.runs.some((r) => r.text === SP_PDF_PLOT_WORDS.up), 'the same page as the stage');
      for (const [, name] of NINE) assert.equal(times(pg.flat, squash(name)), 1, `${paper}: "${name}" is printed once`);
      // a name is 9 pt, not bold; the short words inside the symbols are there too ("DI", "AC")
      const name = pg.runs.find((r) => r.text === 'Keyboard');
      assert.ok(name && !name.bold && name.size === SP_PDF_KEY.textPt);
      for (const tag of ['DI', 'AC']) assert.equal(pg.runs.filter((r) => r.text === tag && r.bold).length, 1, `the tag ${tag} inside its symbol`);
      // the symbols are drawn, with their own dashes: the riser's outline and the kit's two cymbals
      assert.equal((pg.stream.match(/\[4 3\] 0 d/g) ?? []).length, 3);
      // as many cells across as fit the drawing's width (its side room left free), each `colW` wide
      const across = Math.floor((SP_PDF_PAPER[paper].w - 2 * SP_PDF_MARGIN - 2 * SP_PDF_PLOT.side) / SP_PDF_KEY.colW);
      assert.equal(across, paper === 'letter' ? 4 : 3, `${paper}: ${across} cells across`);
      const first = (n: string): Run | undefined => pg.runs.find((r) => squash(n).startsWith(squash(r.text)) && r.text.length >= 4 && r.size === SP_PDF_KEY.textPt && !r.bold);
      const row = NINE.slice(0, across).map(([, n]) => first(n));
      assert.ok(row.every((r) => r));
      const xs = row.map((r) => (r ? r.x : 0));
      assert.ok(Math.abs(xs[0] - (SP_PDF_MARGIN + SP_PDF_PLOT.side + SP_PDF_KEY.symbolW + SP_PDF_KEY.gap)) < 0.01, 'the first name starts after its symbol and the gap');
      for (let i = 1; i < across; i++) assert.ok(Math.abs(xs[i] - xs[i - 1] - SP_PDF_KEY.colW) < 0.01, 'columns of equal width');
      const next = first(NINE[across][1]);
      assert.ok(next && Math.abs(next.x - xs[0]) < 0.01 && next.y < Math.min(...row.map((r) => r?.y ?? 0)), 'the next entry starts the second row');
      insideMargins(pg, paper);
    }
  });

  it('puts the key under the drawing and above the size note, the view note and the legend', () => {
    const pg = parsePdf(spPdfBytes(docOf(keyPlot(keyOf(NINE))))).pages[0];
    const at = (text: string): Run => {
      const r = pg.runs.find((x) => x.text === text);
      assert.ok(r, text);
      return r;
    };
    const order = [SP_PDF_PLOT_WORDS.up, SP_PDF_PLOT_WORDS.down, SP_PDF_PLOT_WORDS.key, 'Performer', 'Power wanted here', 'Stage size: 24 ft × 15 ft (estimated)', 'Left and right are as the audience sees them.', 'A number in a box is an input channel.'];
    // PDF's y grows upward: each of these is lower on the sheet than the one before
    for (let i = 1; i < order.length; i++) assert.ok(at(order[i]).y < at(order[i - 1]).y, `"${order[i]}" is under "${order[i - 1]}"`);
  });

  it('wraps a name that is longer than its cell, and prints every word of it', () => {
    const long = 'Wedge monitor on the floor: the wide side of the drawing is the side that faces the performer who listens to it, and the narrow side faces the audience';
    for (const paper of PAPERS) {
      const key = keyOf([['wedge', long], ['performer', 'Performer'], ['di', 'DI = direct box'], ['power', 'Power wanted here'], ['riser', 'Riser']]);
      const pg = parsePdf(spPdfBytes(docOf(keyPlot(key), paper))).pages[0];
      assert.equal(times(pg.flat, squash(long)), 1);
      const lines = pg.runs.filter((r) => r.size === SP_PDF_KEY.textPt && !r.bold && squash(long).includes(squash(r.text)) && r.text.length > 8);
      assert.ok(lines.length >= 7, `the long name runs to ${lines.length} lines`);
      const room = SP_PDF_KEY.colW - SP_PDF_KEY.symbolW - SP_PDF_KEY.gap - SP_PDF_KEY.right;
      assert.equal(room, 80);
      for (const l of lines) assert.ok(spPdfWidth(spPdfEncode(l.text), l.size, false) <= room + 0.01, `"${l.text}" stays in its cell`);
      // the cells of its row share its height: the second row starts under the last line of the long name
      const riser = pg.runs.find((r) => r.text === 'Riser');
      assert.ok(riser && riser.y < Math.min(...lines.map((l) => l.y)));
      insideMargins(pg, paper);
    }
  });

  it('prints no heading and takes no room for an empty key', () => {
    const none = parsePdf(spPdfBytes(docOf(keyPlot([])))).pages[0];
    const some = parsePdf(spPdfBytes(docOf(keyPlot(keyOf(NINE))))).pages[0];
    assert.ok(!none.runs.some((r) => r.text === SP_PDF_PLOT_WORDS.key));
    const noteY = (pg: Page): number => pg.runs.find((r) => r.text.startsWith('Stage size:'))?.y ?? 0;
    const downY = (pg: Page): number => pg.runs.find((r) => r.text === SP_PDF_PLOT_WORDS.down)?.y ?? 0;
    assert.ok(Math.abs(downY(none) - downY(some)) < 0.01, 'the drawing is the same');
    assert.ok(downY(none) - noteY(none) < 30, 'with no key the size note is right under the drawing');
    assert.ok(noteY(none) - noteY(some) > SP_PDF_KEY.headH + 3 * SP_PDF_KEY.symbolH, 'with a key the note is under the key');
  });

  it('keeps the drawing, its key and its notes on one page, inside the margins, however long the key is', () => {
    const all = keyOf(ALL_KINDS.map((k): [SpObjectKind, string] => [k, `${k.replace(/-/g, ' ')} (in the key)`]));
    assert.equal(all.length, 26);
    for (const paper of PAPERS) {
      // a small act (the 240 pt drawing), a full band, a deep stage; alone on the page and after other text
      for (const [people, depth] of [[1, 4.5], [5, 4.5], [5, 14]] as const) {
        for (const filler of [0, 8, 16, 24, 32, 40]) {
          const p = parsePdf(spPdfBytes(docOf(keyPlot(all, people, depth), paper, filler)));
          const where = `${paper}, ${people} people, ${depth} m deep, ${filler} lines above`;
          const page = pagesWith(p, SP_PDF_PLOT_WORDS.up);
          assert.equal(page.length, 1, where);
          const pg = p.pages[page[0]];
          for (const word of [SP_PDF_PLOT_WORDS.down, SP_PDF_PLOT_WORDS.right, SP_PDF_PLOT_WORDS.left, 'Alex', 'Front left', 'Stage size: 24 ft × 15 ft (estimated)', 'Left and right are as the audience sees them.']) {
            assert.ok(pg.runs.some((r) => r.text === word), `${where}: "${word}" is on the page of the drawing`);
          }
          assert.equal(pg.runs.filter((r) => r.text === SP_PDF_PLOT_WORDS.key).length, 1, `${where}: the key is on the page of the drawing`);
          for (const k of all) assert.equal(times(pg.flat, squash(k.name)), 1, `${where}: "${k.name}"`);
          for (const other of p.pages) if (other !== pg) assert.ok(!other.runs.some((r) => r.text === SP_PDF_PLOT_WORDS.key));
          insideMargins(pg, paper);
          // the words keep their size when the drawing has to give way
          assert.equal(pg.runs.find((r) => r.text === 'Alex')?.size, SP_PDF_PLOT.person);
          assert.equal(pg.runs.find((r) => r.text.startsWith('performer (in'))?.size, SP_PDF_KEY.textPt);
        }
      }
    }
    save('sp_key26_letter.pdf', spPdfBytes(docOf(keyPlot(all, 1), 'letter', 8)));
  });
});

// ───────────────────────── review 2: leaders, a roomy plot, how a table ends ─────────────────────────
describe('stage plot PDF: leaders, a roomy plot, and how a table ends (review 2)', () => {
  const plotOf = (o: Partial<SpDocPlot> & { people?: number } = {}): SpDocPlot => {
    const { people, ...rest } = o;
    return {
      widthM: 7.2,
      depthM: 4.5,
      toScale: false,
      sizeNote: 'Not to scale',
      marginM: 0.6,
      gridM: 0,
      items: Array.from({ length: people ?? 3 }, (_, i) => item(`p${i}`, 'performer', 1 + i, 2.2, PEOPLE[i], [`M${i + 1}`], true)),
      viewNote: '',
      legend: ['A number in a box is an input channel.'],
      key: [],
      roomy: false,
      ...rest,
    };
  };
  const AFTER_PLOT: SpDocSection['blocks'] = [
    { t: 'heading', level: 2, text: 'Performers' },
    { t: 'para', text: 'The first line after the plot.' },
  ];
  const plotDoc = (plot: SpDocPlot, paper: SpPaper = 'letter', after: SpDocSection['blocks'] = AFTER_PLOT): SpDoc => ({
    ...packet({ paper }),
    sections: [
      { id: 'plot', title: 'Stage plot', breakBefore: 'none', blocks: [{ t: 'facts', rows: [['Band', 'The Example Four']] }, { t: 'plot', plot }, ...after] },
      { id: 'inputs', title: 'Input list', breakBefore: 'auto', blocks: [{ t: 'para', text: 'The first line of the input list.' }] },
    ],
  });
  /** The height of the whole drawing (the stage and the room around it), from the stage outline. */
  const drawingHeight = (pg: Page, plot: SpDocPlot): number => {
    const front = /(^|\n)3 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(pg.stream);
    const outline = /(^|\n)1\.4 w 0 G \[\] 0 d [\d.]+ ([\d.]+) m/.exec(pg.stream);
    assert.ok(front && outline);
    return ((Number(outline[2]) - Number(front[2])) * (plot.depthM + 2 * plot.marginM)) / plot.depthM;
  };
  const LEADER = /(?:^|\n)0\.5 w 0\.54 G \[\] 0 d ([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l S/g;

  it('draws a leader as one hairline in the muted gray, from the name to its symbol, under the symbols', () => {
    const plain = plotOf();
    const led = plotOf();
    // Billie's name was moved away from her: 1.8 m toward stage left and 1.2 m upstage of her
    led.items[1] = { ...led.items[1], labelAt: { x: 3.8, y: 0.9 }, leader: { from: { x: 3.8, y: 1 }, to: { x: 2, y: 2.2 } } };
    for (const paper of PAPERS) {
      const none = parsePdf(spPdfBytes(plotDoc(plain, paper))).pages[0].stream;
      const s = parsePdf(spPdfBytes(plotDoc(led, paper))).pages[0].stream;
      assert.equal([...none.matchAll(LEADER)].length, 0, 'no leader, no line');
      const lines = [...s.matchAll(LEADER)];
      assert.equal(lines.length, 1, 'one leader, one line');
      const [x1, y1, x2, y2] = lines[0].slice(1).map(Number);
      // the same slope as in the document (PDF's y grows upward, so "upstage" is a larger y)
      assert.ok(x1 > x2 && y1 > y2);
      assert.ok(Math.abs((x1 - x2) / (y1 - y2) - 1.8 / 1.2) < 0.01);
      // its symbol end is the middle of Billie's circle: between Alex's name and Casey's
      // under the symbols: after the stage outline, before the first symbol
      const at = s.indexOf(lines[0][0]);
      assert.ok(at > s.search(/(^|\n)3 w 0 G/) && at < s.search(/(^|\n)1 w 0 G \[\] 0 d 0\.82 g/), 'between the stage and the symbols');
      assert.equal(SP_PDF_PLOT.leader, 0.5);
    }
    // a leader with a missing or broken end is left out, and nothing else changes
    const broken = plotOf();
    broken.items[1] = { ...broken.items[1], leader: { from: { x: Number.NaN, y: 1 }, to: { x: 2, y: 2.2 } } };
    assert.equal([...parsePdf(spPdfBytes(plotDoc(broken))).pages[0].stream.matchAll(LEADER)].length, 0);
  });

  it('lets a roomy plot grow to the height the page has left, and starts what follows on a new page', () => {
    for (const paper of PAPERS) {
      const { h } = SP_PDF_PAPER[paper];
      // a deep stage with six performers: the usual cap is 380 pt
      const usual = plotOf({ depthM: 9, people: 5 });
      const roomy = plotOf({ depthM: 9, people: 5, roomy: true });
      const a = parsePdf(spPdfBytes(plotDoc(usual, paper)));
      const b = parsePdf(spPdfBytes(plotDoc(roomy, paper)));
      assert.ok(Math.abs(drawingHeight(a.pages[0], usual) - SP_PDF_PLOT.maxH) < 0.1, `${paper}: the usual plot is 380 pt`);
      const tall = drawingHeight(b.pages[0], roomy);
      assert.ok(tall > SP_PDF_PLOT.maxH + 80, `${paper}: the roomy plot is ${Math.round(tall)} pt tall`);
      // it uses the page: the legend is its last line, near the footer and above it
      const legend = b.pages[0].runs.find((r) => r.text === 'A number in a box is an input channel.');
      const foot = b.pages[0].runs[b.pages[0].runs.length - 1];
      assert.ok(legend && legend.y > foot.y + 10 && legend.y < foot.y + 45, `${paper}: the plot block ends at the foot of the page`);
      for (const r of b.pages[0].runs) assert.ok(r.y >= SP_PDF_MARGIN - 0.5 && r.y <= h - SP_PDF_MARGIN + 0.5, `"${r.text}"`);
      for (const m of b.pages[0].stream.matchAll(/(-?[\d.]+) (-?[\d.]+) (m|l)( |\n)/g)) assert.ok(Number(m[2]) >= SP_PDF_MARGIN - 1 && Number(m[2]) <= h - SP_PDF_MARGIN + 1);
      // the words keep their size
      assert.equal(b.pages[0].runs.find((r) => r.text === PEOPLE[0])?.size, SP_PDF_PLOT.person);
      // what follows: on the same page for the usual plot, on a new page for the roomy one
      assert.deepEqual(pagesWith(a, 'The first line after the plot.'), [0]);
      assert.deepEqual(pagesWith(b, 'The first line after the plot.'), [1]);
      assert.deepEqual(pagesWith(b, 'Performers'), [1]);
      assert.equal(b.pages[1].runs.filter((r) => r.size > 9)[0].text, 'Performers', 'it starts the new page');
      // with nothing after the plot in its section, the next SECTION starts the new page
      const c = parsePdf(spPdfBytes(plotDoc(roomy, paper, [])));
      assert.deepEqual(pagesWith(c, 'The first line of the input list.'), [1]);
      assert.equal(c.pages.length, 2);
      // a plot-only packet is one page
      const only = plotDoc(roomy, paper, []);
      only.sections = only.sections.slice(0, 1);
      assert.equal(parsePdf(spPdfBytes(only)).pages.length, 1);
    }
  });

  it('cannot make a roomy plot wider than the page: a wide, shallow stage keeps its size, a small act’s plot grows', () => {
    // 7.2 m × 4.5 m with 0.6 m around it is as wide as the page at 335 pt tall: the height has nothing to give
    const wide = plotOf({ people: 5 });
    const wideRoomy = plotOf({ people: 5, roomy: true });
    const a = drawingHeight(parsePdf(spPdfBytes(plotDoc(wide))).pages[0], wide);
    const b = drawingHeight(parsePdf(spPdfBytes(plotDoc(wideRoomy))).pages[0], wideRoomy);
    assert.ok(a < SP_PDF_PLOT.maxH && Math.abs(a - b) < 0.1, `${a} and ${b}`);
    // the page is not full then: what follows the plot in its own section runs on, and the NEXT SECTION starts a new page
    const p = parsePdf(spPdfBytes(plotDoc(wideRoomy)));
    assert.deepEqual(pagesWith(p, 'The first line after the plot.'), [0]);
    assert.deepEqual(pagesWith(p, 'The first line of the input list.'), [1]);
    // (a section that follows on: only the roomy plot sends it to a new page)
    const follows = (plot: SpDocPlot): number => {
      const d = plotDoc(plot);
      d.sections[1].breakBefore = 'none';
      return pagesWith(parsePdf(spPdfBytes(d)), 'The first line of the input list.')[0];
    };
    assert.equal(follows(wide), 0);
    assert.equal(follows(wideRoomy), 1);
    // one performer: 240 pt as a rule, the page width when roomy (a plot-only packet)
    const solo = plotOf({ people: 1 });
    const soloRoomy = plotOf({ people: 1, roomy: true });
    assert.ok(Math.abs(drawingHeight(parsePdf(spPdfBytes(plotDoc(solo))).pages[0], solo) - SP_PDF_PLOT.smallH) < 0.1);
    assert.ok(Math.abs(drawingHeight(parsePdf(spPdfBytes(plotDoc(soloRoomy))).pages[0], soloRoomy) - a) < 0.1);
  });

  it('starts the size note at the key’s left edge, under the heading KEY', () => {
    for (const paper of PAPERS) {
      const x = SP_PDF_MARGIN + SP_PDF_PLOT.side;
      // a small act: the drawing is much narrower than the page
      const plot = plotOf({ people: 1, key: [{ kind: 'performer', name: 'Performer', w: 0.6, h: 0.6, shapes: spKeySymbol('performer').shapes, tag: '' }] });
      const pg = parsePdf(spPdfBytes(plotDoc(plot, paper))).pages[0];
      const key = pg.runs.find((r) => r.text === SP_PDF_PLOT_WORDS.key);
      const note = pg.runs.find((r) => r.text === 'NOT TO SCALE');
      assert.ok(key && note);
      assert.ok(Math.abs(key.x - x) < 0.01 && Math.abs(note.x - x) < 0.01, `${paper}: KEY at ${key.x}, NOT TO SCALE at ${note.x}`);
      const sized = parsePdf(spPdfBytes(plotDoc(plotOf({ people: 1, toScale: true, sizeNote: '12 ft × 8 ft (estimated)' }), paper))).pages[0];
      assert.ok(Math.abs((sized.runs.find((r) => r.text.startsWith('Stage size:'))?.x ?? 0) - x) < 0.01);
    }
  });

  // tables of one-line rows after `filler` one-line paragraphs
  const SMALL: SpDocColumn[] = [
    { key: 'ch', label: 'Ch', width: 1, align: 'center' },
    { key: 'name', label: 'Thing', width: 5 },
    { key: 'who', label: 'Supplied by', width: 3 },
  ];
  const rowsOf = (n: number, tag: string): SpDocRow[] => Array.from({ length: n }, (_, i) => ({ cells: { ch: String(i + 1), name: `${tag} row <${pad(i + 1)}>`, who: 'Venue' } }));
  const tableDoc = (filler: number, blocks: SpDocSection['blocks'], paper: SpPaper = 'letter'): SpDoc => ({
    ...packet({ paper }),
    sections: [{ id: 'notes', title: 'Filler', breakBefore: 'none', blocks: [...Array.from({ length: filler }, (_, i) => ({ t: 'para' as const, text: `Filler line <${pad(i + 1)}>.` })), ...blocks] }],
  });
  const rowPages = (p: Parsed, n: number, tag: string): number[] => Array.from({ length: n }, (_, i) => pagesWith(p, `${tag} row <${pad(i + 1)}>`)[0]);

  it('never leaves one row of a table alone on a page: the row before it is carried too', () => {
    for (const paper of PAPERS) {
      const shapes = new Set<string>();
      for (const n of [3, 5, 8]) {
        for (let filler = 0; filler <= 46; filler += 1) {
          const p = parsePdf(spPdfBytes(tableDoc(filler, [{ t: 'table', table: { columns: SMALL, rows: rowsOf(n, 'Alpha'), empty: '' } }], paper)));
          const pages = rowPages(p, n, 'Alpha');
          const counts = [...new Set(pages)].map((pg) => pages.filter((x) => x === pg).length);
          // after the page where the table starts, no page holds one row; a table of three rows is never divided
          counts.slice(1).forEach((c) => assert.ok(c >= 2, `${paper}: ${n} rows after ${filler} lines are printed ${counts.join(' + ')}`));
          if (n === 3) assert.equal(counts.length, 1, `${paper}: 3 rows after ${filler} lines are printed ${counts.join(' + ')}`);
          for (const pg of new Set(pages)) assert.equal(p.pages[pg].runs.filter((r) => r.bold && r.text === 'Thing').length, 1, 'each of its pages has the header');
          shapes.add(counts.join('+'));
        }
      }
      // the table WAS divided in these runs, and the last page then holds two rows or more
      assert.ok([...shapes].some((s) => /\+2$/.test(s)), `${paper}: seen ${[...shapes].join(', ')}`);
      assert.ok(![...shapes].some((s) => /\+1(\+|$)/.test(s)), `${paper}: seen ${[...shapes].join(', ')}`);
    }
  });

  it('keeps the gray note under a table on the page of the table’s last row', () => {
    const note = 'A mono mix is 1 audio channel and a stereo mix is 2.';
    for (const paper of PAPERS) {
      let carried = 0;
      for (let filler = 0; filler <= 46; filler += 1) {
        const blocks: SpDocSection['blocks'] = [
          { t: 'table', table: { columns: SMALL, rows: rowsOf(4, 'Alpha'), empty: '' } },
          { t: 'para', text: note, tone: 'muted' },
          { t: 'table', table: { columns: SMALL, rows: rowsOf(3, 'Beta'), empty: '' } },
        ];
        const p = parsePdf(spPdfBytes(tableDoc(filler, blocks, paper)));
        const rows = rowPages(p, 4, 'Alpha');
        assert.deepEqual(pagesWith(p, note), [rows[3]], `${paper}, ${filler} lines: the note is with the last row`);
        // it belongs to the table ABOVE it: it is under that table's last row, not carried off with the next table
        const pg = p.pages[rows[3]];
        const last = pg.runs.find((r) => r.text === 'Alpha row <04>');
        const noteRun = pg.runs.find((r) => r.text === note);
        assert.ok(last && noteRun && noteRun.y < last.y && last.y - noteRun.y < 30, 'right under the last row');
        const counts = [...new Set(rows)].map((x) => rows.filter((v) => v === x).length);
        counts.slice(1).forEach((c) => assert.ok(c >= 2));
        if (counts.length === 2) carried += 1;
      }
      assert.ok(carried >= 1, `${paper}: the table was divided ${carried} times`);
    }
  });

  it('starts a row’s note under the second column when the first is the channel number', () => {
    const p = parsePdf(spPdfBytes(packet({ inputs: 8 })));
    const runs = p.pages.flatMap((pg) => pg.runs);
    const label = runs.find((r) => r.text === inputLabel(1));
    const note = runs.find((r) => r.text.startsWith('Note 02:'));
    const ch = runs.find((r) => r.text === '2' && r.size === SP_PDF_TABLE_PT && !r.bold);
    assert.ok(label && note && ch);
    assert.equal(note.x, label.x, 'the note starts at the Input column’s left edge');
    assert.ok(note.x > ch.x + 10 && note.y < label.y);
    // every line of it stays inside the table
    for (const r of runs.filter((x) => x.size === SP_PDF_TABLE_PT)) assert.ok(r.x + spPdfWidth(spPdfEncode(r.text), r.size, r.bold) <= SP_PDF_PAPER.letter.w - SP_PDF_MARGIN + 0.5);
    // a table whose first column is not a centered number keeps the small indent
    const d = packet();
    d.sections = [{ id: 'notes', title: 'Notes', breakBefore: 'none', blocks: [{ t: 'table', table: { columns: [{ key: 'a', label: 'Item', width: 2 }, { key: 'b', label: 'Qty', width: 1 }], rows: [{ cells: { a: 'Wedge', b: '2' }, note: 'A note under the row.' }], empty: '' } }] }];
    const q = parsePdf(spPdfBytes(d)).pages[0].runs;
    const item0 = q.find((r) => r.text === 'Wedge');
    const note0 = q.find((r) => r.text === 'A note under the row.');
    assert.ok(item0 && note0 && Math.abs(note0.x - item0.x - 10) < 0.01);
  });
});

// ───────────────────────── the source ─────────────────────────
describe('stage plot PDF: the files are pure', () => {
  it('uses no Node, DOM or React, and only erasable TypeScript', () => {
    for (const f of ['spPdf.ts', 'spPdfFonts.ts']) {
      const src = readFileSync(join('src', 'features', 'stageplot', f), 'utf8').replace(/\r\n/g, '\n');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const banned of [/\bBuffer\b/, /\brequire\(/, /from 'node:/, /\bdocument\./, /\bwindow\./, /from 'react/, /\benum\s/, /\bnamespace\s/, /TextEncoder/, /Date\.now\(/]) {
        assert.ok(!banned.test(code), `${f} must not use ${banned}`);
      }
      for (const m of code.matchAll(/from '(\.[^']+)'/g)) assert.ok(m[1].endsWith('.ts'), `${f}: import "${m[1]}" names its .ts file`);
      assert.ok(!/colour|grey|centre/.test(src), `${f}: US spelling`);
    }
  });

  it('uses nothing a phone’s JavaScript engine (Hermes) may lack', () => {
    // The writer now makes the PDF on phones too. Each of these is either
    // missing from some engine the app runs on, or depends on how the engine
    // was built (Intl, Unicode tables), so the two files do without them.
    const banned: [RegExp, string][] = [
      [/\.padStart\(|\.padEnd\(/, 'padStart / padEnd'],
      [/\.flat\(|\.flatMap\(/, 'Array flat / flatMap'],
      [/String\.raw/, 'String.raw'],
      [/\bIntl\b|toLocale|localeCompare/, 'Intl and locale-dependent text'],
      [/\(\?</, 'regex lookbehind or named groups'],
      [/\\p\{|\\P\{/, 'regex Unicode property escapes'],
      [/TextEncoder|TextDecoder/, 'TextEncoder / TextDecoder'],
      [/\.replaceAll\(|\.matchAll\(|\.at\(/, 'replaceAll / matchAll / at'],
      [/\.findLast|\.toSorted\(|\.toReversed\(|\.toSpliced\(|\.with\(/, 'newer array methods'],
      [/structuredClone|\bBigInt\b|\bWeakRef\b|Object\.fromEntries|Object\.groupBy/, 'newer globals'],
      [/\basync\b|\bawait\b|\bPromise\b|setTimeout/, 'anything that waits (the writer is one plain function call)'],
      [/codePointAt|fromCodePoint/, 'code point helpers'],
    ];
    let regexes = 0;
    for (const f of ['spPdf.ts', 'spPdfFonts.ts']) {
      const src = readFileSync(join('src', 'features', 'stageplot', f), 'utf8').replace(/\r\n/g, '\n');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const [re, what] of banned) assert.ok(!re.test(code), `${f} must not use ${what} (${re})`);
      // every regular expression uses only the flags g, i, m
      for (const m of code.matchAll(/[(=,:>]\s*\/(?![/*\s])((?:\\.|\[(?:\\.|[^\]\n])*\]|[^/\n\\[])+)\/([a-z]*)/g)) {
        regexes += 1;
        assert.match(m[2], /^[gim]*$/, `${f}: /${m[1]}/${m[2]}`);
      }
      // `normalize` is the one optional method used: each call is inside a try, behind a typeof check
      const calls = [...code.matchAll(/\.normalize\('/g)];
      const guards = [...code.matchAll(/typeof \w+\.normalize [!=]== 'function'/g)];
      assert.equal(calls.length, guards.length, `${f}: every normalize call has its guard`);
      for (const c of calls) {
        const before = code.slice(Math.max(0, (c.index ?? 0) - 260), c.index ?? 0);
        assert.ok(/try \{/.test(before) && /typeof \w+\.normalize/.test(before), `${f}: a normalize call is guarded`);
      }
    }
    assert.ok(regexes >= 4, `the flag check looked at ${regexes} regular expressions`);
  });
});
