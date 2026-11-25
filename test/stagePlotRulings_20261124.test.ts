/**
 * Stage Plot — the owner's rulings of 2026-11-23 (must-do row D60), built
 * 2026-11-24:
 *
 *   1. A TABLE NEVER LEAVES ITS HEADER WITH FEWER THAN 3 ROWS AT A PAGE FOOT
 *      (a table of fewer than 3 rows stays whole). The PDF writer (the app's
 *      printing path on every platform) and the HTML sheet (the browser's
 *      print view, and a phone's fallback) both keep it.
 *   2. THE SOLO COMPACT PACKET IS ONE PAGE (it was 2), with nothing left out
 *      and no text under 9 pt.
 *   3. PHANTOM POWER (overruled): "dynamic microphones and most ribbons do
 *      NOT use phantom power." A dynamic prints No, a ribbon prints No, an
 *      ACTIVE ribbon prints Yes with a note; condensers are unchanged.
 *   4. No change: leader lines stay numbers-only; "Supplied by" stays.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SP_ACTIVE_RIBBON_NOTE, SP_PACKAGES, spMicKind, spPhantomOf } from '../src/features/stageplot/spCatalog.ts';
import { spOpenItems } from '../src/features/stageplot/spDerive.ts';
import type { SpDoc, SpDocBlock, SpDocRow, SpDocTable } from '../src/features/stageplot/spDocTypes.ts';
import { spAddPackage, spNewProject, spUpdateInput } from '../src/features/stageplot/spModel.ts';
import { spBuildDoc, spBuildSnapshot, spDocText } from '../src/features/stageplot/spPacket.ts';
import { SP_HTML_KEEP_ROWS, spPacketHtml } from '../src/features/stageplot/spPacketHtml.ts';
import { SP_PDF_ONE_SHEET_PT, SP_PDF_TABLE_KEEP_ROWS, spPdfBytes, spPdfPageCount, spPdfTableRuns, type SpPdfTableRun } from '../src/features/stageplot/spPdf.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { spFromTemplate, SP_TEMPLATES, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpPacketKind, SpPaper, SpPhantom, SpProject, SpSupplier } from '../src/features/stageplot/spTypes.ts';

const NOW = Date.UTC(2026, 10, 24, 12, 0);
const EXAMPLES = SP_TEMPLATES.map((t) => t.id).filter((id) => id !== 'blank') as SpTemplateId[];
const PAPERS: SpPaper[] = ['letter', 'a4'];
const PACKETS: SpPacketKind[] = ['full', 'compact', 'plot'];
/** The band name as an example is opened in the app (none), and as the older tests name it. */
const BANDS = ['', 'The Example'];
const tpl = (id: SpTemplateId, band = 'The Example'): SpProject => spFromTemplate(id, { id: `p-${id}`, now: NOW, band });
const docOf = (p: SpProject, paper: SpPaper = 'letter', packet: SpPacketKind = 'full'): SpDoc => spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));

/** The owner's rule, on the PDF writer's record of where each table landed. */
function footBreaks(runs: SpPdfTableRun[]): string[] {
  const bad: string[] = [];
  for (const r of runs) {
    if (r.rows < SP_PDF_TABLE_KEEP_ROWS && r.pages.length > 1) bad.push(`${r.head}: ${r.rows} rows split over ${r.pages.length} pages`);
    r.pages.forEach((s, k) => {
      // a page the table runs on FROM (not its last): its header must have 3 rows under it
      if (k < r.pages.length - 1 && s.rows < Math.min(SP_PDF_TABLE_KEEP_ROWS, r.rows)) bad.push(`${r.head}: header and ${s.rows} row(s) at the foot of page ${s.page + 1}`);
    });
  }
  return bad;
}

/* ── 1. a header never stands at a page foot with fewer than 3 rows ───────── */

describe('ruling 1 (owner 2026-11-23): a table never leaves its header with fewer than 3 rows at a page foot', () => {
  it('the rule is 3 rows, in both renderers', () => {
    assert.equal(SP_PDF_TABLE_KEEP_ROWS, 3);
    assert.equal(SP_HTML_KEEP_ROWS, 3);
  });

  it('every example band, every packet, both papers, with and without a band name (PDF)', () => {
    let tables = 0;
    for (const band of BANDS)
      for (const id of [...EXAMPLES, 'blank' as SpTemplateId])
        for (const paper of PAPERS)
          for (const packet of PACKETS) {
            const runs = spPdfTableRuns(docOf(tpl(id, band), paper, packet));
            tables += runs.length;
            assert.deepEqual(footBreaks(runs), [], `${id} ${paper} ${packet} band="${band}"`);
          }
    assert.ok(tables > 100, `${tables} tables were checked`);
  });

  /** A table under a filler paragraph of `lines` lines: moved down the page line by line. */
  const probe = (lines: number, rows: SpDocRow[], oneSheet = false, paper: SpPaper = 'letter'): SpDoc => {
    const filler = Array.from({ length: lines }, (_, i) => `Filler line ${i + 1}.`).join('\n');
    const table: SpDocTable = { columns: [{ key: 'a', label: 'Ch', width: 1, align: 'center' }, { key: 'b', label: 'Input', width: 4 }, { key: 'c', label: 'Supplied by', width: 2 }], rows, empty: 'None.' };
    const blocks: SpDocBlock[] = [{ t: 'para', text: filler }, { t: 'table', table }, { t: 'para', text: 'After the table.' }];
    return { title: 'Probe', paper, footer: 'Probe · Revision 1', stamp: '', sections: [{ id: 'notes', title: 'Probe', blocks, breakBefore: 'none' }], fileName: 'probe.pdf', revision: 1, generatedAt: NOW, ...(oneSheet ? { oneSheet: true } : {}) };
  };
  const shortRows = (n: number): SpDocRow[] => Array.from({ length: n }, (_, i) => ({ cells: { a: String(i + 1), b: `Input ${i + 1}`, c: 'Venue' } }));
  const tallRows = (n: number): SpDocRow[] =>
    Array.from({ length: n }, (_, i) => ({ cells: { a: String(i + 1), b: `Input ${i + 1} with a longer name that wraps over two lines of its column`, c: 'Band' }, note: i % 2 ? `A note for input ${i + 1}, long enough to run the full width of the table and on to a second line of its own.` : undefined }));

  it('a table moved down the page one line at a time: never a header with 1 or 2 rows at the foot (usual and one-sheet sizes, Letter and A4)', () => {
    let checked = 0;
    for (const paper of PAPERS)
      for (const oneSheet of [false, true])
        for (const rows of [shortRows(8), tallRows(7), shortRows(3), shortRows(4), tallRows(4)])
          for (let n = 30; n <= 72; n++) {
            const runs = spPdfTableRuns(probe(n, rows, oneSheet, paper));
            assert.equal(runs.length, 1);
            assert.deepEqual(footBreaks(runs), [], `${paper} oneSheet=${oneSheet} rows=${rows.length} filler=${n}: ${JSON.stringify(runs[0].pages)}`);
            checked++;
          }
    assert.ok(checked > 800);
  });

  it('a table of fewer than 3 rows stays whole, wherever it starts', () => {
    for (const rows of [shortRows(1), shortRows(2), tallRows(2)])
      for (let n = 30; n <= 72; n++) {
        const [run] = spPdfTableRuns(probe(n, rows));
        assert.equal(run.pages.length, 1, `rows=${rows.length} filler=${n}`);
        assert.equal(run.pages[0].rows, rows.length);
      }
  });

  it('the HTML sheet (the browser print view, the phone fallback): the header keeps with the first 3 rows as one unbreakable group', () => {
    // checked in Chrome's print engine (Android's web view): with each row
    // its own group, a header and 1 or 2 rows were left at a page foot; with
    // the first three rows in one group, the header and the three go over
    // together. Here the markup and the rules that do it are pinned.
    for (const id of EXAMPLES) {
      const d = docOf(tpl(id), 'letter', 'full');
      const html = spPacketHtml(d);
      const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
      assert.ok(style.includes('thead { display: table-header-group; break-after: avoid; page-break-after: avoid; }'));
      assert.ok(style.includes('tbody.row { break-inside: avoid; page-break-inside: avoid; }'));
      assert.ok(style.includes('tbody.lead { break-before: avoid; page-break-before: avoid; }'));
      const tables = d.sections.flatMap((s) => s.blocks).filter((b): b is Extract<SpDocBlock, { t: 'table' }> => b.t === 'table' && b.table.rows.length > 0);
      const printed = [...html.matchAll(/<table><colgroup>[\s\S]*?<\/table>/g)].map((m) => m[0]);
      assert.equal(printed.length, tables.length, id);
      printed.forEach((t, n) => {
        const rows = tables[n].table.rows.length;
        const groups = [...t.matchAll(/<tbody class="([^"]*)">([\s\S]*?)<\/tbody>/g)];
        assert.equal(groups[0][1], 'row lead', `${id} table ${n + 1}: the first group is the lead`);
        const leadRows = (groups[0][2].match(/<tr(?! class="note")[ >]/g) ?? []).length;
        assert.equal(leadRows, Math.min(SP_HTML_KEEP_ROWS, rows), `${id} table ${n + 1}: the lead holds the first ${Math.min(3, rows)} rows`);
        assert.equal(groups.length, 1 + Math.max(0, rows - SP_HTML_KEEP_ROWS), `${id} table ${n + 1}: every later row is its own group`);
        for (const g of groups.slice(1)) assert.equal(g[1], 'row');
      });
    }
  });
});

/* ── 2. the solo compact packet on one page ─────────────────────────────── */

/** The words printed on a PDF's pages (the page header and footer left out). */
function pdfWords(bytes: Uint8Array): { pages: number; words: string[]; sizes: number[] } {
  let raw = '';
  for (const b of bytes) raw += String.fromCharCode(b);
  const win = new TextDecoder('windows-1252');
  const streams = [...raw.matchAll(/<< \/Length (\d+) >>\nstream\n/g)].map((m) => raw.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + Number(m[1])));
  const words: string[] = [];
  const sizes: number[] = [];
  for (const s of streams) {
    for (const m of s.matchAll(/\/F\d ([\d.]+) Tf/g)) sizes.push(Number(m[1]));
    for (const m of s.matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)) {
      const bytesOut: number[] = [];
      const str = m[1];
      for (let j = 0; j < str.length; j++) {
        if (str[j] === '\\') {
          const nx = str[j + 1];
          if (nx >= '0' && nx <= '7') {
            bytesOut.push(parseInt(str.slice(j + 1, j + 4), 8));
            j += 3;
          } else {
            bytesOut.push(nx.charCodeAt(0));
            j += 1;
          }
        } else bytesOut.push(str.charCodeAt(j));
      }
      words.push(...win.decode(Uint8Array.from(bytesOut)).split(/\s+/).filter(Boolean));
    }
  }
  return { pages: streams.length, words, sizes };
}

describe('ruling 2 (owner 2026-11-23): the solo compact packet fits on 1 page', () => {
  it('1 page on US Letter and A4, as the app opens it (no band name) and with a band name', () => {
    for (const band of BANDS)
      for (const paper of PAPERS) {
        const d = docOf(tpl('solo', band), paper, 'compact');
        assert.equal(d.oneSheet, true, `${paper} band="${band}"`);
        assert.equal(spPdfPageCount(d), 1, `${paper} band="${band}"`);
        assert.equal(pdfWords(spPdfBytes(d)).pages, 1);
      }
  });

  it('nothing is left out: every word of the usual layout is printed, and the document is the same', () => {
    for (const band of BANDS)
      for (const paper of PAPERS) {
        const one = docOf(tpl('solo', band), paper, 'compact');
        const { oneSheet: _o, ...usual } = one;
        assert.equal(spPdfPageCount(usual), 2, 'the usual sizes print it on 2 pages');
        // the same content: only the layout differs
        assert.equal(spDocText(one), spDocText(usual));
        const a = pdfWords(spPdfBytes(usual)).words;
        const b = pdfWords(spPdfBytes(one)).words;
        // the usual layout's second page repeats the title, the stamp and the footer: those words once less
        const left = [...b];
        const missing: string[] = [];
        for (const w of a) {
          const at = left.indexOf(w);
          if (at >= 0) left.splice(at, 1);
          else missing.push(w);
        }
        // (the second page's title, stamp and footer, and the page count "2")
        const header = [...`${band ? `${band} — ` : ''}Stage plot, input list and monitor plan DRAFT`.split(/\s+/), ...(band ? `${band} ·`.split(/\s+/) : []), 'Revision', '·', 'Page', 'of', '1', '2', '2', '2'];
        for (const w of missing) {
          const at = header.indexOf(w);
          assert.ok(at >= 0, `${paper} band="${band}": "${w}" is missing from the one-page packet`);
          header.splice(at, 1);
        }
      }
  });

  it('no text under 9 pt on the page', () => {
    assert.deepEqual(SP_PDF_ONE_SHEET_PT, { table: 9, body: 9, legend: 9 });
    for (const band of BANDS)
      for (const paper of PAPERS) {
        const { sizes } = pdfWords(spPdfBytes(docOf(tpl('solo', band), paper, 'compact')));
        assert.ok(sizes.length > 50);
        assert.ok(Math.min(...sizes) >= 9, `${paper}: ${Math.min(...sizes)} pt`);
      }
  });

  it('only a compact packet of a solo act or a duo can be one sheet: every other example and packet keeps its usual layout', () => {
    for (const band of BANDS)
      for (const id of [...EXAMPLES, 'blank' as SpTemplateId])
        for (const paper of PAPERS)
          for (const packet of PACKETS) {
            const d = docOf(tpl(id, band), paper, packet);
            if (id === 'solo' && packet === 'compact') continue;
            assert.equal(d.oneSheet, undefined, `${id} ${paper} ${packet}`);
          }
  });

  it('the HTML sheet takes the same tighter sizes (no rule under 9 pt) when the packet is one sheet', () => {
    const one = spPacketHtml(docOf(tpl('solo'), 'letter', 'compact'));
    const usual = spPacketHtml(docOf(tpl('duo'), 'letter', 'compact'));
    assert.ok(one.includes('table { font-size: 9pt;'));
    assert.ok(!usual.includes('table { font-size: 9pt;'));
    const style = one.slice(one.indexOf('<style>'), one.indexOf('</style>'));
    for (const m of style.matchAll(/font-size: ([\d.]+)pt/g)) assert.ok(Number(m[1]) >= 9, m[0]);
  });
});

/* ── 3. phantom power: dynamics and most ribbons do not use it ───────────── */

const EQUIPMENTS = [...new Set(SP_PACKAGES.flatMap((p) => p.rows.filter((r) => r.capture === 'mic').map((r) => r.equipment)))];
const SUPPLIERS: SpSupplier[] = ['band', 'venue', 'other', 'tbc'];
const PHANTOMS: SpPhantom[] = ['required', 'not-required', 'do-not-apply', 'unknown'];

/** One project holding one microphone row per (equipment, supplier, phantom). */
function grid(equipments: string[]): { p: SpProject; key: Map<string, string> } {
  let p = spNewProject({ id: 'grid', now: NOW, band: 'Grid', startedFrom: '' });
  const key = new Map<string, string>();
  let n = 0;
  for (const equipment of equipments)
    for (const supplier of SUPPLIERS)
      for (const phantom of PHANTOMS) {
        const r = spAddPackage(p, 'vocal', { performerId: null, sourceLabel: `S${n}` });
        const label = `Row ${++n}`;
        p = spUpdateInput(r.p, r.inputIds[0], { label, equipment, supplier, phantom });
        key.set(`${equipment} | ${supplier} | ${phantom}`, label);
      }
  return { p, key };
}
/** The input list's capture cell and note of each row, by its label. */
function cells(p: SpProject): Map<string, { capture: string; note: string }> {
  const d = docOf(p, 'letter', 'full');
  const table = d.sections.find((s) => s.id === 'inputs')?.blocks.find((b): b is Extract<SpDocBlock, { t: 'table' }> => b.t === 'table')?.table;
  assert.ok(table);
  return new Map(table.rows.map((r) => [r.cells.input, { capture: r.cells.capture, note: r.note ?? '' }]));
}

describe('ruling 3 (owner 2026-11-23): "dynamic microphones and most ribbons do NOT use phantom power"', () => {
  it('every dynamic microphone of the catalog: No phantom power (Not required), never "to be confirmed"', () => {
    const dynamics = SP_PACKAGES.flatMap((p) => p.rows.map((r) => ({ pkg: p.id, ...r }))).filter((r) => /dynamic/i.test(r.equipment));
    assert.ok(dynamics.length >= 20, `${dynamics.length} dynamic rows`);
    for (const r of dynamics) {
      assert.equal(spMicKind(r), 'dynamic', `${r.pkg}: ${r.label}`);
      assert.equal(spPhantomOf({ ...r, phantom: 'unknown' }), 'not-required', `${r.pkg}: ${r.label}`);
    }
  });

  it('the catalog names no ribbon (so no active-ribbon model list is kept): a ribbon is known by its words', () => {
    // If a ribbon is ever added to the catalog, add its active models here and in spCatalog.
    assert.deepEqual(EQUIPMENTS.filter((e) => /ribbon/i.test(e)), []);
    const mic = (equipment: string) => ({ capture: 'mic' as const, equipment, phantom: 'unknown' as SpPhantom });
    assert.equal(spPhantomOf(mic('Ribbon microphone')), 'not-required');
    assert.equal(spPhantomOf(mic('Passive ribbon microphone')), 'not-required');
    assert.equal(spPhantomOf(mic('Active ribbon microphone')), 'required');
    assert.equal(spPhantomOf(mic('Royer R-122 active ribbon')), 'required');
    assert.equal(spMicKind(mic('Dynamic or condenser microphone')), null, 'not decided when it says both');
    assert.equal(spPhantomOf({ ...mic('Dynamic vocal microphone'), capture: 'wireless' }), 'unknown', 'a wireless receiver output is not a microphone row');
    assert.equal(spPhantomOf(mic('Kick drum microphone')), 'unknown', 'a kick drum microphone may be a condenser: still asked');
    // the band's own answer always wins
    assert.equal(spPhantomOf({ ...mic('Dynamic vocal microphone'), phantom: 'do-not-apply' }), 'do-not-apply');
  });

  it('printed: a dynamic or ribbon the band brings says "no phantom power"; an active ribbon says "phantom power required" with its note; the venue is not asked about its own', () => {
    const { p, key } = grid(['Dynamic vocal microphone', 'Ribbon microphone', 'Active ribbon microphone']);
    const c = cells(p);
    for (const supplier of SUPPLIERS) {
      const asked = supplier !== 'venue';
      for (const eq of ['Dynamic vocal microphone', 'Ribbon microphone']) {
        const row = c.get(key.get(`${eq} | ${supplier} | unknown`) ?? '');
        assert.ok(row);
        assert.ok(!/to be confirmed/.test(row.capture), `${eq} ${supplier}: ${row.capture}`);
        assert.equal(row.capture, asked ? `${eq}; no phantom power` : eq, `${eq} ${supplier}`);
      }
      const active = c.get(key.get(`Active ribbon microphone | ${supplier} | unknown`) ?? '');
      assert.ok(active);
      assert.equal(active.capture, 'Active ribbon microphone; phantom power required', supplier);
      assert.equal(active.note, SP_ACTIVE_RIBBON_NOTE);
      assert.equal(SP_ACTIVE_RIBBON_NOTE, 'Active ribbon: needs 48 V phantom power.');
    }
  });

  it('condensers are unchanged: the capture cell for every condenser of the catalog, every supplier and every answer, as it printed before the ruling', () => {
    // SNAPSHOT taken from the code before this change (HEAD of 2026-11-24),
    // for 'Condenser microphone', 'Small-diaphragm condenser microphone' and
    // 'Clip-on condenser microphone': the cell is the equipment, then this.
    const BEFORE: Record<SpSupplier, Record<SpPhantom, string>> = {
      band: { required: '; phantom power required', 'not-required': '', 'do-not-apply': '; do not apply phantom power', unknown: '; phantom power to be confirmed' },
      other: { required: '; phantom power required', 'not-required': '', 'do-not-apply': '; do not apply phantom power', unknown: '; phantom power to be confirmed' },
      tbc: { required: '; phantom power required', 'not-required': '', 'do-not-apply': '; do not apply phantom power', unknown: '; phantom power to be confirmed' },
      venue: { required: '; phantom power required', 'not-required': '', 'do-not-apply': '; do not apply phantom power', unknown: '' },
    };
    const condensers = EQUIPMENTS.filter((e) => /condenser/i.test(e));
    assert.deepEqual([...condensers].sort(), ['Clip-on condenser microphone', 'Condenser microphone', 'Small-diaphragm condenser microphone']);
    const { p, key } = grid(condensers);
    const c = cells(p);
    let n = 0;
    for (const eq of condensers)
      for (const supplier of SUPPLIERS)
        for (const phantom of PHANTOMS) {
          const row = c.get(key.get(`${eq} | ${supplier} | ${phantom}`) ?? '');
          assert.ok(row);
          assert.equal(row.capture, `${eq}${BEFORE[supplier][phantom]}`, `${eq} ${supplier} ${phantom}`);
          assert.equal(row.note, '');
          assert.equal(spPhantomOf(p.inputs.find((i) => i.label === key.get(`${eq} | ${supplier} | ${phantom}`)) ?? { capture: 'mic', equipment: eq, phantom }), phantom);
          n++;
        }
    assert.equal(n, 48);
  });

  it('the unresolved list asks about a condenser the band brings, never about a dynamic or a ribbon', () => {
    const { p, key } = grid(['Dynamic instrument microphone', 'Ribbon microphone', 'Condenser microphone']);
    const open = spOpenItems(p).map((o) => o.text);
    const asked = (eq: string, supplier: SpSupplier) => open.some((t) => t.startsWith(`${key.get(`${eq} | ${supplier} | unknown`)}:`) && /phantom power/.test(t));
    for (const supplier of ['band', 'other', 'tbc'] as const) {
      assert.equal(asked('Dynamic instrument microphone', supplier), false, supplier);
      assert.equal(asked('Ribbon microphone', supplier), false, supplier);
      assert.equal(asked('Condenser microphone', supplier), true, supplier);
    }
  });

  it('a review question when the band’s answer goes against the microphone: a dynamic marked required; an active ribbon marked not required', () => {
    const { p, key } = grid(['Dynamic vocal microphone', 'Active ribbon microphone', 'Condenser microphone']);
    const asks = spReview(p).filter((i) => i.rule === 'mic-phantom');
    const about = (eq: string, phantom: SpPhantom) => asks.filter((i) => i.target.id === p.inputs.find((x) => x.label === key.get(`${eq} | band | ${phantom}`))?.id);
    assert.equal(about('Dynamic vocal microphone', 'required').length, 1);
    assert.match(about('Dynamic vocal microphone', 'required')[0].text, /A dynamic microphone does not use phantom power\. Which is right\?$/);
    assert.equal(about('Dynamic vocal microphone', 'not-required').length, 0);
    assert.equal(about('Dynamic vocal microphone', 'unknown').length, 0);
    assert.equal(about('Active ribbon microphone', 'not-required').length, 1);
    assert.equal(about('Active ribbon microphone', 'required').length, 0);
    assert.equal(about('Condenser microphone', 'required').length, 0);
    assert.equal(about('Condenser microphone', 'not-required').length, 0);
  });

  it('every example and template: no dynamic microphone prints or asks "phantom power to be confirmed"', () => {
    for (const band of BANDS)
      for (const id of EXAMPLES) {
        const p = tpl(id, band);
        for (const packet of ['full', 'compact'] as const) {
          const text = spDocText(docOf(p, 'letter', packet));
          for (const line of text.split('\n')) if (/Dynamic/.test(line)) assert.ok(!/phantom power to be confirmed/.test(line), `${id} ${packet}: ${line}`);
        }
        for (const i of p.inputs.filter((x) => spMicKind(x) === 'dynamic')) {
          assert.equal(spPhantomOf(i), 'not-required', `${id}: ${i.label}`);
          assert.ok(!spOpenItems(p).some((o) => o.text.startsWith(`${i.label}:`) && /phantom power/.test(o.text)), `${id}: ${i.label} is not asked`);
        }
      }
  });
});

/* ── 4. no change ───────────────────────────────────────────────────────── */

describe('ruling 4 (owner 2026-11-23): no change to the leader lines or to "Supplied by"', () => {
  it('"Supplied by" is still a column of the input list, and the equipment table still says who supplies each item', () => {
    for (const id of EXAMPLES) {
      const d = docOf(tpl(id), 'letter', 'full');
      const inputs = d.sections.find((s) => s.id === 'inputs')?.blocks.find((b): b is Extract<SpDocBlock, { t: 'table' }> => b.t === 'table');
      assert.ok(inputs?.table.columns.some((c) => c.label === 'Supplied by'), id);
      assert.equal(d.sections.find((s) => s.id === 'equipment')?.title, 'Equipment and who supplies it');
    }
  });
});
