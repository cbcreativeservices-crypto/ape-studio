/**
 * Stage Plot and Channel Designer — the PACKET (handoff section 7 and the
 * export checks of section 12, and review 1), proven with no device:
 *
 *   one frozen snapshot → ONE SpDoc → the PDF, the HTML sheet, the text view.
 *
 * These tests check what a venue engineer relies on: the totals of the worked
 * example are stated; every input of a large band is printed with its number;
 * every "to be confirmed" is printed and none is answered; a contact item the
 * band hid is nowhere; a band's name cannot break the page; and the packet is
 * short enough to be read in two minutes (pages are counted with the app's
 * own PDF writer).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spPatchRows, spSummary } from '../src/features/stageplot/spDerive.ts';
import type { SpDoc, SpDocPlot, SpDocTable } from '../src/features/stageplot/spDocTypes.ts';
import { spAddObject, spAddPackage, spEdit, spFreeze, spMarkReady, spMoveObject, spNewProject, spUpdateInput } from '../src/features/stageplot/spModel.ts';
import {
  spAfterExport,
  spBadgeRuns,
  spBase64,
  spBuildDoc,
  spBuildSnapshot,
  spDocText,
  spEmailText,
  spEquipmentSplit,
  spFileName,
  spKeyLayout,
  spKeyLines,
  spLabelBlock,
  spPdfPageCount,
  spPlotDoc,
  spPlotItemName,
  spPlotMaxH,
  spPlotScale,
  spStamp,
  spUnresolved,
  SP_KEY_CELL,
  SP_PLOT_MAX_H,
  SP_PLOT_NOMINAL_W,
  SP_PLOT_ROOMY_H,
  SP_PLOT_ROOMY_PEOPLE,
  SP_PLOT_SMALL_H,
  SP_PLOT_SMALL_PEOPLE,
  SP_SHORT_NOTES,
  spTextW,
} from '../src/features/stageplot/spPacket.ts';
import { SP_PAGES, SP_ROOMY_H, spIsInputBadge, spKeyScene, spPacketHtml, spPlotPreview, spPlotScene } from '../src/features/stageplot/spPacketHtml.ts';
import { spIsSized, spKeySymbol, spPlotKey } from '../src/features/stageplot/spSymbols.ts';
import { spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpExportOptions, SpProject } from '../src/features/stageplot/spTypes.ts';

// The Export area's session file imports its neighbors with no extension (the
// app's way); this lets node find them when the test loads that file.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const NOW = 1_800_000_000_000;
const FULL: SpExportOptions = { paper: 'letter', packet: 'full' };
const COMPACT: SpExportOptions = { paper: 'letter', packet: 'compact' };
const example = (t: SpTemplateId, band = 'The Example Four'): SpProject => spFromTemplate(t, { id: `p-${t}`, now: NOW, band });
const four = (): SpProject => example('four-piece');
const docOf = (p: SpProject, options: SpExportOptions = FULL): SpDoc => spBuildDoc(spBuildSnapshot(p, options, NOW));
const pagesOf = (p: SpProject, options: SpExportOptions): number => spPdfPageCount(spPdfBytes(docOf(p, options)));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const plotOf = (d: SpDoc): SpDocPlot => {
  for (const s of d.sections) for (const b of s.blocks) if (b.t === 'plot') return b.plot;
  throw new Error('the document has no plot');
};
const tablesOf = (d: SpDoc, sectionId: string): SpDocTable[] => {
  const out: SpDocTable[] = [];
  for (const s of d.sections) if (s.id === sectionId) for (const b of s.blocks) if (b.t === 'table') out.push(b.table);
  return out;
};
const listsOf = (d: SpDoc, sectionId: string): string[] => {
  const out: string[] = [];
  for (const s of d.sections) if (s.id === sectionId) for (const b of s.blocks) if (b.t === 'list') out.push(...b.items);
  return out;
};
const parasOf = (d: SpDoc, sectionId: string): string[] => {
  const out: string[] = [];
  for (const s of d.sections) if (s.id === sectionId) for (const b of s.blocks) if (b.t === 'para') out.push(b.text);
  return out;
};

/** The salsa band (16 inputs) with more packages added: 32 inputs, long
 *  names and long notes. */
function big(): SpProject {
  let p = example('salsa', 'Orquesta de Prueba');
  for (const [pkg, label] of [
    ['drums-large', 'Drum kit on the second riser, stage left of the timbales'],
    ['keys-stereo', 'Second keyboard'],
    ['playback-stereo', 'Playback'],
    ['click', 'Click'],
    ['vocal', 'Guest vocal'],
  ] as const) {
    p = spAddPackage(p, pkg, { sourceLabel: label }).p;
  }
  const guest = p.inputs[p.inputs.length - 1];
  p = spUpdateInput(p, guest.id, {
    label: 'Guest vocal for the second half of the show, announced from the stage',
    notes: 'The guest arrives after the first set. Please keep this channel muted until the band leader points at the monitor desk; the microphone is handed over on stage.',
    alternatives: 'Any dynamic vocal microphone the venue has',
  });
  p = spEdit(p, (d) => {
    d.notes = Array.from({ length: 12 }, (_, n) => `Note ${n + 1}: the band changes instruments between songs, and the order of the changes is on the set list that the band leader carries.`).join('\n\n');
    d.accessNotes = 'Load-in is through the side door. The piano needs four people.';
  });
  return p;
}

describe('the worked example, as a packet (handoff section 11)', () => {
  const d = docOf(four());
  const text = spDocText(d);
  const html = spPacketHtml(d);
  it('states the totals of the handoff, in the text view and on the sheet', () => {
    for (const words of [
      '14 input channels to the house system',
      '13 for the audience mix',
      '1 monitor only (Click)',
      '10 microphones',
      '3 DI channels on 2 DI devices',
      '4 monitor mixes (2 mono, 2 stereo)',
      'Requested from the house console: 4 mixes, 6 audio channels',
      'If each audio channel is carried on its own analog console output, that is 6 outputs',
      '2 wedges',
      '1 wireless in-ear transmitter',
      '1 in-ear receiver pack',
      '1 wired headphone amplifier',
    ]) {
      assert.ok(text.includes(words), `the text view does not say "${words}"`);
      assert.ok(html.includes(esc(words)), `the sheet does not say "${words}"`);
    }
  });
  it('never says that one house MIX is one console output (a stereo mix is two audio channels)', () => {
    assert.ok(!/each house mix/i.test(text));
    assert.ok(text.includes('The real number depends on how the venue sends the feeds to the stage: to be confirmed with the venue.'));
  });
  it('the click is printed as monitor only, in bold, and each mix says whether it hears it', () => {
    const [inputs] = tablesOf(d, 'inputs');
    const click = inputs.rows.find((r) => r.cells.input === 'Click');
    assert.ok(click);
    assert.equal(click.cells.audience, 'MONITOR ONLY: kept out of the audience mix');
    assert.equal(click.strong, true);
    assert.equal(click.cells.ch, '14');
    const [mixes] = tablesOf(d, 'monitors');
    assert.match(mixes.rows.find((r) => r.cells.mix.startsWith('M3'))?.note ?? '', /Primary: Click \(14\)/);
    for (const code of ['M1', 'M2', 'M4']) assert.match(mixes.rows.find((r) => r.cells.mix.startsWith(code))?.note ?? '', /Must exclude: Click \(14\)/);
    assert.ok(text.includes('Click (14) is MONITOR ONLY: kept out of the audience mix. Asked for in M3. Must be kept out of M1, M2, M4.'));
  });
  it('band, venue and to-be-confirmed quantities are apart in the equipment table', () => {
    const [eq] = tablesOf(d, 'equipment');
    assert.deepEqual(
      eq.columns.map((c) => c.label),
      ['Item', 'Qty', 'Band', 'Venue', 'Other', 'To be confirmed', 'Notes'],
    );
    const wedge = eq.rows.find((r) => r.cells.item === 'Wedge');
    assert.deepEqual([wedge?.cells.qty, wedge?.cells.venue, wedge?.cells.band], ['2', '2', '']);
    const bassDi = eq.rows.find((r) => r.cells.item === 'DI device: Bass DI');
    assert.deepEqual([bassDi?.cells.qty, bassDi?.cells.band], ['1', '1']);
    assert.equal(eq.rows.filter((r) => r.cells.item.startsWith('DI device')).length, 2, 'two DI devices, each its own row');
    const riser = eq.rows.find((r) => r.cells.item === 'Drum riser');
    assert.deepEqual([riser?.cells.qty, riser?.cells.tbc], ['1', '1'], 'a riser that nobody has agreed to supply is in the to-be-confirmed column');
  });
  it('a required microphone is marked, and its alternatives are not counted as extra items', () => {
    let p = four();
    const lead = p.inputs.find((i) => i.label === 'Lead vocal');
    assert.ok(lead);
    p = spUpdateInput(p, lead.id, { priority: 'required', alternatives: 'A similar dynamic vocal microphone' });
    const d2 = docOf(p);
    const [eq] = tablesOf(d2, 'equipment');
    const row = eq.rows.find((r) => r.cells.item === 'Dynamic vocal microphone');
    assert.equal(row?.cells.qty, '3');
    assert.equal(row?.strong, true);
    assert.match(row?.cells.notes ?? '', /1 REQUIRED/);
    assert.match(row?.cells.notes ?? '', /not extra items/);
    assert.match(tablesOf(d2, 'inputs')[0].rows.find((r) => r.cells.input === 'Lead vocal')?.cells.capture ?? '', /REQUIRED/);
  });
});

describe('a row says only what differs from the usual (review 1: the two-minute read)', () => {
  const p = four();
  const d = docOf(p);
  const [inputs] = tablesOf(d, 'inputs');
  const row = (label: string) => {
    const r = inputs.rows.find((x) => x.cells.input === label);
    assert.ok(r, `no row for ${label}`);
    return r;
  };
  it('"preferred", an XLR connector and "phantom power not required" are not printed; one line above the table says the rule', () => {
    // a kind and a name that already says the kind are printed once
    assert.equal(row('Kick').cells.capture, 'Kick drum microphone');
    assert.equal(row('Lead vocal').cells.capture, 'Dynamic vocal microphone');
    const named = spUpdateInput(p, p.inputs.find((i) => i.label === 'Kick')!.id, { equipment: 'Large-diaphragm dynamic' });
    assert.equal(tablesOf(docOf(named), 'inputs')[0].rows[0].cells.capture, 'Microphone: Large-diaphragm dynamic', 'a name that does not say the kind keeps it');
    assert.ok(tablesOf(docOf(named), 'equipment')[0].rows.some((r) => r.cells.item === 'Microphone: Large-diaphragm dynamic'));
    assert.ok(tablesOf(d, 'equipment')[0].rows.some((r) => r.cells.item === 'Kick drum microphone'));
    assert.equal(row('Bass DI').cells.capture, 'DI');
    for (const r of inputs.rows) assert.ok(!/preferred|XLR|not required/i.test(r.cells.capture), r.cells.capture);
    assert.ok(parasOf(d, 'inputs').some((t) => t.includes('Equipment named here is a preference unless it says REQUIRED.')));
  });
  it('REQUIRED and flexible are printed; so is a connector that is not the usual one', () => {
    let q = spUpdateInput(p, p.inputs.find((i) => i.label === 'Kick')!.id, { priority: 'flexible' });
    q = spUpdateInput(q, q.inputs.find((i) => i.label === 'Snare')!.id, { priority: 'required', connector: 'TRS 1/4 inch' });
    const t = tablesOf(docOf(q), 'inputs')[0];
    assert.equal(t.rows.find((r) => r.cells.input === 'Kick')?.cells.capture, 'Kick drum microphone; flexible');
    assert.equal(t.rows.find((r) => r.cells.input === 'Snare')?.cells.capture, 'Dynamic instrument microphone; REQUIRED; TRS 1/4 inch');
    // XLR on a line output is not "the usual": it is printed
    const click = q.inputs.find((i) => i.label === 'Click')!;
    const withXlr = spUpdateInput(q, click.id, { connector: 'XLR' });
    assert.match(tablesOf(docOf(withXlr), 'inputs')[0].rows.find((r) => r.cells.input === 'Click')?.cells.capture ?? '', /; XLR;/);
  });
  it('phantom power: "required" and "do not apply" are printed; "to be confirmed" only when the venue is not the one who supplies it', () => {
    // the venue's own stereo DI, phantom unknown: the venue is not asked about its own box
    assert.equal(row('Keys L').cells.capture, 'DI');
    const q = spUpdateInput(p, p.inputs.find((i) => i.label === 'Kick')!.id, { phantom: 'required' });
    assert.equal(tablesOf(docOf(q), 'inputs')[0].rows[0].cells.capture, 'Kick drum microphone; phantom power required');
    // a line-level row says "balanced line" once, and the three phantom wordings are one family
    assert.equal(row('Click').cells.capture, 'Direct balanced line, line level; do not apply phantom power');
    assert.equal(row('Click').note, 'The receiving input must accept line level.');
    const solo = docOf(example('solo'));
    assert.equal(tablesOf(solo, 'inputs')[0].rows.find((r) => r.cells.input === 'Acoustic guitar DI')?.cells.capture, 'DI; phantom power to be confirmed', 'the band supplies this DI and has not said');
  });
  it('an ordinary audience input prints "Yes"', () => {
    assert.equal(row('Kick').cells.audience, 'Yes');
    assert.equal(inputs.rows.filter((r) => r.cells.audience === 'Yes').length, 13);
  });
  it('who supplies a DI channel is read from its DI device: one packet never says two things about one box', () => {
    // the channels say Band; the device they sit on is the venue's
    let q = p;
    for (const label of ['Keys L', 'Keys R']) q = spUpdateInput(q, q.inputs.find((i) => i.label === label)!.id, { supplier: 'band' });
    const d2 = docOf(q);
    const t = tablesOf(d2, 'inputs')[0];
    assert.equal(t.rows.find((r) => r.cells.input === 'Keys L')?.cells.supplier, 'Venue');
    assert.equal(t.rows.find((r) => r.cells.input === 'Keys R')?.cells.supplier, 'Venue');
    assert.equal(tablesOf(d2, 'equipment')[0].rows.find((r) => r.cells.item === 'DI device: Keys stereo DI')?.cells.venue, '1');
  });
  it('the list prints where the INPUT is, not where its performer stands (review 2, words S1)', () => {
    assert.equal(inputs.columns.find((c) => c.key === 'who')?.label, 'Performer and where the input is');
    // the amplifier is at center stage and Sam sings downstage center; the playback rig is upstage left and Maya plays upstage center
    assert.equal(row('Guitar cabinet').cells.who, 'Sam · at the guitar amplifier, center stage');
    assert.equal(row('Click').cells.who, 'Maya · at the playback rig, upstage left');
    assert.equal(row('Kick').cells.who, 'Maya · at the drum kit, upstage center');
    assert.equal(row('Bass DI').cells.who, 'Leo · at the bass amplifier, stage right');
    // a microphone's place says it: no "at the microphone"
    assert.equal(row('Lead vocal').cells.who, 'Sam · Downstage center');
    assert.equal(row('Nina vocal').cells.who, 'Nina · Stage left');
    // every row agrees with the drawing: the place is the place of the input's own symbol
    const text = spDocText(d);
    assert.ok(text.includes('- Guitar amp: center stage. Input channel 8'));
    assert.ok(text.includes('- Click: upstage left. Input channel 14'));
    assert.ok(text.includes('- Sam: downstage center. Monitor mix M1'));
    assert.ok(!/stage stage|Mid-stage/.test(text), 'no doubled "stage" in a position');
    // the compact packet has no place column, so it cannot print a wrong one
    const c = tablesOf(docOf(p, COMPACT), 'inputs')[0];
    assert.equal(c.columns.find((x) => x.key === 'who')?.label, 'Performer');
    assert.equal(c.rows.find((r) => r.cells.input === 'Guitar cabinet')?.cells.who, 'Sam');
  });
  it('the Stand column is 13% of the full input table, taken from "Audience mix" (review 2)', () => {
    const total = inputs.columns.reduce((a, c) => a + c.width, 0);
    const share = (key: string) => (inputs.columns.find((c) => c.key === key)?.width ?? 0) / total;
    assert.ok(Math.abs(share('stand') - 0.13) < 0.002, `Stand is ${(share('stand') * 100).toFixed(1)}%`);
    assert.ok(share('audience') < share('stand'));
  });
  it('says whose the channel numbers are', () => {
    assert.ok(parasOf(d, 'inputs').some((t) => t.startsWith('Channel numbers are the band’s proposed order. The venue may patch in another order.')));
  });
});

describe('a large band: 32 inputs, long names and long notes (section 12, check 8)', () => {
  const p = big();
  const d = docOf(p);
  const html = spPacketHtml(d);
  const text = spDocText(d);
  it('the project has 32 inputs', () => {
    assert.equal(spPatchRows(p, 'house').length, 32);
  });
  it('every input is on the sheet with its number, and in the text view', () => {
    const rows = spPatchRows(p, 'house');
    for (const r of rows) {
      assert.ok(html.includes(`<td class="center">${r.number}</td><td>${esc(r.input.label)}</td>`), `the sheet has no row for ${r.number} ${r.input.label}`);
      assert.ok(text.includes(`- Ch: ${r.number}; Input: ${r.input.label};`), `the text view has no row for ${r.number} ${r.input.label}`);
    }
    assert.equal(tablesOf(d, 'inputs')[0].rows.length, 32);
  });
  it('every note is printed whole: nothing is cut to fit a sheet', () => {
    for (let n = 1; n <= 12; n += 1) assert.ok(html.includes(`Note ${n}: the band changes instruments`), `note ${n} is missing`);
    assert.ok(html.includes('Please keep this channel muted until the band leader points at the monitor desk; the microphone is handed over on stage.'));
    assert.ok(html.includes('Any dynamic vocal microphone the venue has'));
    assert.ok(!html.includes('…'), 'no text is shortened with an ellipsis');
    assert.ok(!text.includes('…'));
  });
  it('the unresolved list holds every "to be confirmed" and every open review question, printed and not answered', () => {
    const open = spSummary(p).open;
    assert.ok(open.length >= 5, 'the large band leaves details to be confirmed');
    const listed = listsOf(d, 'notes');
    for (const o of open) {
      const line = `${o}.`;
      assert.ok(listed.includes(line), `not in the unresolved list: ${o}`);
      assert.ok(html.includes(esc(line)), `not on the sheet: ${o}`);
      assert.ok(text.includes(line), `not in the text view: ${o}`);
    }
    // the sentence as the VENUE reads it; a question to the band about its own title is not printed
    const wanted = spReview(p)
      .filter((i) => i.level !== 'block' && i.rule !== 'example-title')
      .map((i) => (i.packetText ?? i.text).replace(/^To be confirmed — /, ''));
    assert.ok(listed.includes('No technical contact is listed for this band.'));
    assert.ok(!listed.some((l) => /has nobody to ask|still says/.test(l)), 'never the sentence written for the band');
    for (const w of wanted) assert.ok(listed.includes(w), `a review question is not printed: ${w}`);
    assert.deepEqual(spUnresolved(spReview(p)), [...new Set(wanted)]);
    // the heading says "to be confirmed" once; the lines do not repeat it
    assert.ok(text.includes('Unresolved: to be confirmed'));
    assert.ok(!listed.some((l) => l.startsWith('To be confirmed')));
  });
  it('the compact packet drops no unresolved line and no input', () => {
    const c = docOf(p, COMPACT);
    assert.deepEqual(listsOf(c, 'notes'), listsOf(d, 'notes'));
    assert.equal(tablesOf(c, 'inputs')[0].rows.length, 32);
  });
  it('the 32-input plot has every stage object', () => {
    assert.equal(plotOf(d).items.length, p.objects.length);
  });
});

describe('contact items the band hid', () => {
  const withContact = (show: { name: boolean; role: boolean; email: boolean; phone: boolean }): SpProject =>
    spEdit(four(), (d) => {
      d.contact = { name: 'Dana Quillfeather', role: 'Tour manager person', email: 'dana.q@example.test', phone: '555-0142-777', show };
    });
  const everywhere = (p: SpProject): string => {
    const d = docOf(p);
    const mail = spEmailText(p);
    return [JSON.stringify(d), spPacketHtml(d), spDocText(d), mail.subject, mail.body, spPacketHtml(docOf(p, { paper: 'a4', packet: 'plot' })), spPacketHtml(docOf(p, { paper: 'a4', packet: 'compact' }))].join('\n');
  };
  it('a shown item is printed', () => {
    const all = everywhere(withContact({ name: true, role: true, email: true, phone: true }));
    for (const v of ['Dana Quillfeather', 'Tour manager person', 'dana.q@example.test', '555-0142-777']) assert.ok(all.includes(v), `${v} should be printed`);
  });
  it('a hidden email and phone are nowhere: not in the document, the sheet, the text or the message', () => {
    const all = everywhere(withContact({ name: true, role: true, email: false, phone: false }));
    assert.ok(all.includes('Dana Quillfeather'));
    assert.ok(all.includes('Tour manager person'));
    assert.ok(!all.includes('dana.q@example.test'));
    assert.ok(!all.includes('555-0142-777'));
  });
  it('with every item hidden there is no contact line at all', () => {
    const p = withContact({ name: false, role: false, email: false, phone: false });
    const all = everywhere(p);
    for (const v of ['Dana Quillfeather', 'Tour manager person', 'dana.q@example.test', '555-0142-777']) assert.ok(!all.includes(v), `${v} was hidden and is printed`);
    assert.ok(!spDocText(docOf(p)).includes('Technical contact:'));
  });
});

describe('the file name (handoff section 7)', () => {
  it('BandName_StagePlot_date_RevNN.pdf with an event date', () => {
    const p = { ...four(), eventDate: '2026-12-05', revision: 3 };
    assert.equal(spFileName(p), 'TheExampleFour_StagePlot_2026-12-05_Rev03.pdf');
    assert.equal(docOf(p).fileName, 'TheExampleFour_StagePlot_2026-12-05_Rev03.pdf');
  });
  it('no date part when the project has no event date', () => {
    assert.equal(spFileName({ ...four(), revision: 3 }), 'TheExampleFour_StagePlot_Rev03.pdf');
    assert.equal(spFileName({ ...four(), eventDate: 'next Friday', revision: 12 }), 'TheExampleFour_StagePlot_Rev12.pdf');
  });
  it('accents are folded and characters a file system may refuse are removed', () => {
    assert.equal(spFileName({ ...four(), band: 'bongó & café / <Rock>: "live"?' }), 'BongoCafeRockLive_StagePlot_Rev01.pdf');
    assert.equal(spFileName({ ...four(), band: '   ' }), 'StagePlot_Rev01.pdf', 'no made-up band name in the file name');
    assert.match(spFileName({ ...four(), band: '../../etc/passwd' }), /^EtcPasswd_StagePlot_Rev01\.pdf$/);
  });
});

describe('paper, packet kind and the stamp', () => {
  it('US Letter and A4 give different page sizes', () => {
    const letter = spPacketHtml(docOf(four(), { paper: 'letter', packet: 'full' }));
    const a4 = spPacketHtml(docOf(four(), { paper: 'a4', packet: 'full' }));
    const size = (h: string) => /@page \{ size: ([^;]+);/.exec(h)?.[1];
    assert.equal(size(letter), '612pt 792pt');
    assert.equal(size(a4), '595pt 842pt');
    assert.notEqual(size(letter), size(a4));
    assert.deepEqual([SP_PAGES.letter.w, SP_PAGES.letter.h, SP_PAGES.a4.w, SP_PAGES.a4.h], [612, 792, 595, 842]);
    assert.equal(docOf(four(), { paper: 'a4', packet: 'full' }).paper, 'a4');
  });
  it('the stamp is DRAFT for a draft, on the sheet too', () => {
    const d = docOf(four());
    assert.equal(d.stamp, 'DRAFT');
    const html = spPacketHtml(d);
    assert.ok(html.includes('<div class="stamp">DRAFT</div>'));
    assert.ok(html.includes('@top-right { content: "DRAFT"'));
    assert.ok(spDocText(d).split('\n').includes('DRAFT'));
  });
  it('the stamp is empty for a ready project with nothing to correct', () => {
    const ready = spMarkReady(four());
    assert.equal(spReview(ready).filter((i) => i.level === 'block').length, 0);
    const d = docOf(ready);
    assert.equal(d.stamp, '');
    const html = spPacketHtml(d);
    assert.ok(!html.includes('class="stamp"'));
    assert.ok(!html.includes('@top-right'));
    assert.ok(!html.includes('DRAFT'));
    assert.ok(spDocText(d).includes('Ready to advance: prepared for discussion with the venue'));
    assert.ok(!/production ready/i.test(spDocText(d)));
  });
  it('a project marked ready that has something to correct is still stamped DRAFT, and says what', () => {
    const ready = spMarkReady(four());
    const broken: SpProject = JSON.parse(JSON.stringify(ready));
    const house = broken.patches[0];
    house.numbers[house.order[1]] = house.numbers[house.order[0]];
    assert.equal(broken.status, 'ready');
    assert.equal(spStamp(broken), 'DRAFT');
    const d = docOf(broken);
    assert.equal(d.stamp, 'DRAFT');
    assert.ok(listsOf(d, 'notes').some((l) => /channel 1 is given to Kick and Snare/.test(l)));
  });
  it('the full packet starts a section on a new page only when little of the page is left; compact runs on; plot only is the plot', () => {
    assert.deepEqual(
      docOf(four()).sections.map((s) => [s.id, s.breakBefore]),
      [
        ['plot', 'none'],
        ['inputs', 'auto'],
        ['monitors', 'auto'],
        ['equipment', 'auto'],
        // a last section of a few lines runs on under the equipment table
        ['notes', 'none'],
      ],
    );
    assert.equal(SP_SHORT_NOTES, 4);
    assert.equal(docOf(big()).sections.find((s) => s.id === 'notes')?.breakBefore, 'auto', 'a long last section keeps the usual rule');
    const compact = docOf(four(), COMPACT);
    assert.ok(compact.sections.every((s) => s.breakBefore === 'none'));
    assert.equal(compact.sections.length, 5);
    assert.ok(!spPacketHtml(compact).includes('class="sec newpage"'));
    assert.ok(!spPacketHtml(docOf(four())).includes('class="sec newpage"'), 'the sheet never forces a break for "auto"');
    assert.equal(spPacketHtml(compact).match(/font-size: [\d.]+pt/g)?.join(), spPacketHtml(docOf(four())).match(/font-size: [\d.]+pt/g)?.join(), 'compact never makes the text smaller');
    const plotOnly = docOf(four(), { paper: 'letter', packet: 'plot' });
    assert.deepEqual(plotOnly.sections.map((s) => s.id), ['plot']);
    assert.equal(plotOnly.title, 'The Example Four — Stage plot');
    assert.equal(docOf(four()).title, 'The Example Four — Stage plot, input list and monitor plan', 'the header names everything the packet holds');
    assert.equal(compact.title, 'The Example Four — Stage plot, input list and monitor plan');
    const facts = docOf(four()).sections[0].blocks.find((b) => b.t === 'facts');
    assert.ok(facts && facts.t === 'facts');
    assert.deepEqual(facts.rows.slice(0, 2), [['Band', 'The Example Four'], ['Title', 'Four-piece band (example)']], 'the field under the heading "Stage plot" is labeled Title');
  });
});

describe('the compact packet really is compact (review 1)', () => {
  const p = four();
  const full = docOf(p);
  const compact = docOf(p, COMPACT);
  it('no performers table: the drawing names each performer with the mix code, the input list names who plays what', () => {
    assert.equal(tablesOf(full, 'plot').length, 1);
    assert.deepEqual(tablesOf(full, 'plot')[0].columns.map((c) => c.label), ['Performer', 'Role', 'Position on the stage', 'Monitor mix']);
    assert.equal(tablesOf(compact, 'plot').length, 0);
    assert.equal(tablesOf(docOf(p, { paper: 'letter', packet: 'plot' }), 'plot').length, 0, 'the plot alone leaves it out too');
    for (const pf of p.performers) assert.ok(plotOf(compact).items.some((i) => i.label === pf.name && i.badges.length > 0), `${pf.name} is on the drawing with a mix code`);
    assert.deepEqual(tablesOf(compact, 'inputs')[0].columns.map((c) => c.label), ['Ch', 'Input', 'Performer', 'Capture and equipment', 'Stand', 'Supplied by', 'Audience mix']);
    assert.equal(tablesOf(compact, 'inputs')[0].rows[0].cells.who, 'Maya', 'no position in the compact list: it is on the plot');
  });
  it('the plot legend is one short paragraph that still names the monitor-only input', () => {
    assert.ok(plotOf(full).legend.length >= 4);
    const legend = plotOf(compact).legend;
    assert.equal(legend.length, 1);
    assert.ok(legend[0].includes('stage right is on the left of this drawing'));
    assert.ok(legend[0].includes('Click (14) is monitor only: kept out of the audience mix.'));
    assert.ok(legend[0].length < plotOf(full).legend.join(' ').length);
  });
  it('the monitor plan is one line of totals and ONE table; what a mix is asked to hear is kept, under its row', () => {
    assert.equal(tablesOf(compact, 'monitors').length, 1, 'no second "Monitor devices" table');
    assert.equal(tablesOf(full, 'monitors').length, 2);
    const t = tablesOf(compact, 'monitors')[0];
    assert.deepEqual(t.columns.map((c) => c.label), ['Mix', 'For', 'Format and delivery', 'Who creates it', 'Devices']);
    assert.equal(t.rows[0].cells.format, 'Mono, wedge');
    assert.equal(t.rows[0].cells.devices, 'Wedge 1 (Venue)');
    assert.equal(t.rows[0].note, 'Asked to hear: Own vocal prominent; Some guitar · Must exclude: Click (14)');
    const paras = parasOf(compact, 'monitors');
    assert.equal(paras[0], '4 monitor mixes (2 mono, 2 stereo). Requested from the house console: 4 mixes, 6 audio channels. 1 wireless monitor device: radio frequency coordination needed. This packet lists no radio frequencies.');
    assert.ok(paras.some((x) => x.startsWith('Click (14) is MONITOR ONLY')), 'the exclusion stays visible');
    assert.ok(!paras.some((x) => /If each audio channel|A mono mix is/.test(x)), 'no explaining paragraphs');
  });
  it('equipment is ONE table of three columns, with band, venue and to-be-confirmed still told apart', () => {
    const t = tablesOf(compact, 'equipment')[0];
    assert.deepEqual(t.columns.map((c) => c.label), ['Item', 'Qty', 'Supplied by']);
    assert.equal(t.rows.find((r) => r.cells.item === 'Wedge')?.cells.by, 'Venue');
    assert.equal(t.rows.find((r) => r.cells.item === 'DI device: Bass DI')?.cells.by, 'Band');
    assert.equal(t.rows.find((r) => r.cells.item === 'Drum riser')?.cells.by, 'To be confirmed');
    assert.equal(t.rows.find((r) => r.cells.item === 'Wireless in-ear transmitter')?.note, 'Wireless: radio frequency coordination needed');
    assert.equal(t.rows.length, tablesOf(full, 'equipment')[0].rows.length, 'no item is dropped');
    // two suppliers for one kind of item: how many each
    const q = spUpdateInput(p, p.inputs.find((i) => i.label === 'Lead vocal')!.id, { supplier: 'band' });
    assert.equal(tablesOf(docOf(q, COMPACT), 'equipment')[0].rows.find((r) => r.cells.item === 'Dynamic vocal microphone')?.cells.by, '1 Band, 2 Venue');
  });
  it('the notes and every unresolved line are kept', () => {
    assert.deepEqual(listsOf(compact, 'notes'), listsOf(full, 'notes'));
    assert.ok(listsOf(compact, 'notes').length >= 1);
  });
});

describe('how long the packet is: pages counted with the app’s own PDF writer', () => {
  it('the page counter reads the writer’s page tree', () => {
    assert.equal(spPdfPageCount(new Uint8Array([1, 2, 3])), 0);
    assert.ok(pagesOf(four(), FULL) >= 2);
  });
  it('the four-piece full packet is at most 4 pages, on both papers', () => {
    assert.ok(pagesOf(four(), FULL) <= 4, `Letter: ${pagesOf(four(), FULL)} pages`);
    assert.ok(pagesOf(four(), { paper: 'a4', packet: 'full' }) <= 4);
  });
  it('the salsa full packet (12 performers, 16 inputs) is at most 5 pages, on both papers', () => {
    assert.ok(pagesOf(example('salsa'), FULL) <= 5, `Letter: ${pagesOf(example('salsa'), FULL)} pages`);
    assert.ok(pagesOf(example('salsa'), { paper: 'a4', packet: 'full' }) <= 5);
  });
  it('compact is never longer than full, and is shorter for every example with a band', () => {
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const) {
      const f = pagesOf(example(t), FULL);
      const c = pagesOf(example(t), COMPACT);
      assert.ok(c <= f, `${t}: compact ${c}, full ${f}`);
      if (t !== 'solo' || f > 2) assert.ok(c < f, `${t}: compact ${c} is not shorter than full ${f}`);
    }
    assert.ok(pagesOf(example('four-piece'), COMPACT) <= 3);
    assert.ok(pagesOf(example('salsa'), COMPACT) <= 4);
    assert.ok(pagesOf(example('duo'), COMPACT) <= 2);
  });
  it('the stage plot alone is one page for every example, the 12-performer band included', () => {
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const) assert.equal(pagesOf(example(t), { paper: 'letter', packet: 'plot' }), 1, t);
  });
  it('the solo compact packet: 2 pages today (the target is 1; see the report)', () => {
    // PINNED AS IT IS, not as wished: page 1 holds the plot and the input
    // list; the monitor plan, the equipment table and the unresolved list run
    // to page 2. Text is never made smaller to change this. If this number
    // drops to 1, tighten the assertion.
    assert.ok(pagesOf(example('solo'), COMPACT) <= 2);
  });
  it('a plot with two performers or fewer is drawn at most 240 pt tall; any other at most 380', () => {
    assert.deepEqual([SP_PLOT_SMALL_H, SP_PLOT_SMALL_PEOPLE, SP_PLOT_MAX_H], [240, 2, 380]);
    const solo = spPlotDoc(example('solo'));
    const band = spPlotDoc(four());
    assert.equal(spPlotMaxH(solo), 240);
    assert.equal(spPlotMaxH(spPlotDoc(example('duo'))), 240);
    assert.equal(spPlotMaxH(band), 380);
    const drawH = (plot: SpDocPlot) => (plot.depthM + plot.marginM * 2) * spPlotScale(plot, 526);
    assert.ok(drawH(solo) <= 240 + 1e-6);
    assert.ok(drawH(band) > 240 && drawH(band) <= 380 + 1e-6);
    assert.ok(spPlotScene(solo, 526).h < spPlotScene(band, 526).h);
  });
});

describe('the plot', () => {
  const p = four();
  const plot = spPlotDoc(p);
  // (by its name, printed or not: on a crowded stage a piece of equipment is printed with its number alone)
  const item = (label: string) => {
    const i = plot.items.find((x) => spPlotItemName(x) === label);
    assert.ok(i, `no plot item named ${label}`);
    return i;
  };
  it('has every stage object, each with shapes and a place', () => {
    assert.deepEqual(plot.items.map((i) => i.id).sort(), p.objects.map((o) => o.id).sort());
    for (const i of plot.items) {
      assert.ok(i.shapes.length > 0);
      assert.ok(Number.isFinite(i.at.x) && Number.isFinite(i.at.y) && Number.isFinite(i.labelAt.x) && Number.isFinite(i.labelAt.y));
    }
  });
  it('an object the band left with no name prints NO name: the editor’s drawing and the packet agree', () => {
    let q = spAddObject(p, 'chair', { x: 0.1, y: 0.9 }).p;
    q = spAddObject(q, 'music-stand', { x: 0.9, y: 0.9 }).p;
    const added = q.objects.slice(-2);
    for (const o of added) assert.equal(o.label, '');
    const d = docOf(q);
    for (const o of added) assert.equal(plotOf(d).items.find((i) => i.id === o.id)?.label, '');
    // the KEY says what the two shapes are; nothing beside the objects themselves does
    const html = spPacketHtml(d);
    const outsideKey = html.replace(/<g class="key">[\s\S]*?<\/g>/, '');
    assert.ok(!/Chair|Music stand/.test(outsideKey), 'no kind name is made up beside the object');
    assert.ok(html.includes('>Chair</text>') && html.includes('>Music stand</text>'), 'the key names the two kinds');
    assert.ok(spDocText(d).includes('- An object with no name: downstage'));
  });
  it('prints the performers’ names, as people', () => {
    for (const name of ['Maya', 'Leo', 'Nina', 'Sam']) assert.equal(item(name).person, true);
    assert.equal(item('Drums').person, false);
  });
  it('prints input numbers beside the symbols: a stereo pair as "9–10"', () => {
    assert.deepEqual(item('Keys').badges, ['9–10']);
    assert.deepEqual(item('Drums').badges, ['1–6']);
    assert.deepEqual(item('Bass amp').badges, ['7']);
    assert.deepEqual(item('Lead vocal').badges, ['11']);
    assert.deepEqual(item('Click').badges, ['14']);
    assert.deepEqual(spBadgeRuns(['1', '2', '3', '5', '6', 'B7', 'B8', '?', '?', '12']), ['1–3', '5–6', '12', 'B7–B8', '?']);
  });
  it('prints the mix codes at the performers and at the monitor devices', () => {
    assert.deepEqual(item('Sam').badges, ['M1']);
    assert.deepEqual(item('Maya').badges, ['M3']);
    assert.deepEqual(item('Wedge 1').badges, ['M1']);
    assert.deepEqual(item('Wedge 2').badges, ['M2']);
    assert.deepEqual(item('In-ear transmitter').badges, ['M3']);
    assert.deepEqual(item('Keys headphone amplifier').badges, ['M4']);
  });
  it('an input number gets a square box and a mix code round ends, on the sheet as in the PDF', () => {
    for (const b of ['7', '9–10', 'B3', 'B3–B4', '?']) assert.equal(spIsInputBadge(b), true, b);
    for (const b of ['M1', 'M12', 'A', 'Mon 2', 'IEM']) assert.equal(spIsInputBadge(b), false, b);
    const scene = spPlotScene(plot, 526);
    const boxes = scene.ops.filter((o) => o.t === 'rect' && o.stroke !== 'none' && o.h === 13);
    assert.ok(boxes.some((o) => o.t === 'rect' && o.r === 1.5) && boxes.some((o) => o.t === 'rect' && o.r === 6.5));
  });
  it('an input shown at its performer (no icon of its own) is numbered at the performer', () => {
    const q = spAddPackage(p, 'vocal', { performerId: p.performers[0].id, sourceLabel: 'Drummer vocal' }).p;
    const maya = spPlotDoc(q).items.find((x) => x.label === 'Maya');
    assert.deepEqual(maya?.badges, ['15', 'M3']);
  });
  it('the audience is at the bottom, upstage at the top, stage right on the left: all four words, never flipped', () => {
    const scene = spPlotScene(plot, 526);
    const word = (t: string) => {
      const op = scene.ops.find((o) => o.t === 'text' && o.text === t);
      assert.ok(op && op.t === 'text', `the plot does not say ${t}`);
      return op;
    };
    assert.ok(word('AUDIENCE / DOWNSTAGE').y > word('UPSTAGE').y);
    assert.ok(word('STAGE RIGHT').x < word('STAGE LEFT').x);
    // the drummer is upstage: above the lead singer on the page
    const y = (label: string) => item(label).at.y;
    assert.ok(y('Maya') < y('Sam'));
    assert.ok(item('Leo').at.x < item('Nina').at.x, 'the bassist is stage right: on the left of the page');
    const html = spPacketHtml(docOf(p));
    for (const w of ['UPSTAGE', 'AUDIENCE / DOWNSTAGE', 'STAGE RIGHT', 'STAGE LEFT']) assert.ok(html.includes(`>${w}</text>`));
  });
  it('always prints the size note: "Not to scale" with no size, the size when it is known', () => {
    assert.equal(plot.toScale, false);
    assert.equal(plot.sizeNote, 'Not to scale');
    assert.equal(plot.gridM, 0, 'no grid on a drawing that is not to scale');
    assert.ok(spPacketHtml(docOf(p)).includes('>NOT TO SCALE</text>'));
    const sized = spEdit(p, (d) => {
      d.stage.width = 24;
      d.stage.depth = 16;
    });
    const plot2 = spPlotDoc(sized);
    assert.equal(plot2.sizeNote, '24 ft × 16 ft (estimated)');
    assert.ok(Math.abs(plot2.widthM - 24 * 0.3048) < 1e-9);
    assert.ok(plot2.gridM > 0);
    assert.ok(spPacketHtml(docOf(sized)).includes('>Stage size: 24 ft × 16 ft (estimated)</text>'));
    assert.ok(plot2.legend.some((l) => /not its real size/.test(l)), 'a plot to scale says the symbols are drawings');
    assert.ok(plot.legend.some((l) => /^Not to scale/.test(l)));
  });
  it('the legend names the monitor-only input, so the plot alone shows the exclusion too', () => {
    assert.ok(plot.legend.includes('Click (14) is monitor only: kept out of the audience mix.'));
    assert.ok(spPacketHtml(docOf(p, { paper: 'letter', packet: 'plot' })).includes('Click (14) is monitor only: kept out of the audience mix.'));
  });
  it('the legend explains a B number and the short tags, only when the plot has them', () => {
    assert.ok(!plot.legend.some((l) => /A number with B/.test(l)));
    assert.ok(plot.legend.includes('IEM = in-ear monitor.'));
    const pb = spPlotDoc(example('playback'));
    assert.ok(pb.items.some((i) => i.badges.some((b) => /^B\d/.test(b))), 'the click is a band-rig-only channel');
    assert.ok(pb.legend.some((l) => l.includes('A number with B is a channel of the band monitor rig.')));
    assert.ok(pb.legend.includes('Click (B11) is monitor only: kept out of the audience mix.'));
  });
  it('no word on the plot is smaller than 9 points, at print size and at the preview size', () => {
    for (const plan of [plot, spPlotDoc(example('solo'))]) for (const width of [509, 526, 520]) for (const o of spPlotScene(plan, width).ops) if (o.t === 'text') assert.ok(o.size >= 9, `${o.text} is ${o.size} pt`);
  });
  it('a riser’s name sits inside its box', () => {
    const riser = p.objects.find((o) => o.kind === 'riser');
    assert.ok(riser);
    const it = plot.items.find((i) => i.id === riser.id);
    assert.ok(it && it.label === 'Drum riser');
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const s of it.shapes) {
      if (s.t !== 'poly') continue;
      for (let k = 0; k + 1 < s.pts.length; k += 2) {
        x0 = Math.min(x0, s.pts[k]);
        x1 = Math.max(x1, s.pts[k]);
        y0 = Math.min(y0, s.pts[k + 1]);
        y1 = Math.max(y1, s.pts[k + 1]);
      }
    }
    const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
    const b = spLabelBlock(it);
    const left = it.labelAt.x - b.labelW / k / 2;
    assert.ok(left >= x0 && left + b.w / k <= x1 && it.labelAt.y >= y0 && it.labelAt.y + b.h / k <= y1, 'the name is inside the dashed box');
  });
  it('in the example no name lies over another name, and every name stays on the drawing', () => {
    const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
    const rows = plot.items
      .filter((i) => spLabelBlock(i).h > 0)
      .map((i) => {
        const b = spLabelBlock(i);
        const x0 = i.labelAt.x - b.labelW / k / 2;
        return { label: i.label, x0, y0: i.labelAt.y, x1: x0 + b.w / k, y1: i.labelAt.y + b.h / k };
      });
    for (const a of rows) {
      assert.ok(a.x0 >= -plot.marginM - 1e-6 && a.x1 <= plot.widthM + plot.marginM + 1e-6 && a.y0 >= -plot.marginM - 1e-6 && a.y1 <= plot.depthM + plot.marginM + 1e-6, `${a.label} is off the drawing`);
      for (const b of rows) if (a !== b) assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, `${a.label} lies over ${b.label}`);
    }
  });
  it('moving a microphone moves it on the plot AND in the input list: the list says where the input is (section 12, check 2)', () => {
    const mic = p.objects.find((o) => o.label === 'Lead vocal');
    assert.ok(mic);
    const moved = spMoveObject(p, mic.id, { x: 0.1, y: 0.1 }, { snap: false });
    const d = docOf(moved);
    const at = plotOf(d).items.find((i) => i.id === mic.id)?.at;
    assert.ok(at && Math.abs(at.x - 0.1 * plotOf(d).widthM) < 1e-9 && Math.abs(at.y - 0.1 * plotOf(d).depthM) < 1e-9);
    assert.ok(spDocText(d).includes('- Lead vocal: upstage right. Input channel 11'));
    assert.equal(tablesOf(d, 'inputs')[0].rows.find((r) => r.cells.input === 'Lead vocal')?.cells.who, 'Sam · Upstage right');
    assert.equal(tablesOf(d, 'plot')[0].rows.find((r) => r.cells.name === 'Sam')?.cells.where, 'Downstage center', 'the performer has not moved');
    // moving the PERFORMER moves him in the performers table; his microphone's row stays where the microphone is
    const sam = p.objects.find((o) => o.kind === 'performer' && o.label === 'Sam');
    assert.ok(sam);
    const d2 = docOf(spMoveObject(p, sam.id, { x: 0.9, y: 0.1 }, { snap: false }));
    assert.equal(tablesOf(d2, 'inputs')[0].rows.find((r) => r.cells.input === 'Lead vocal')?.cells.who, 'Sam · Downstage center');
    assert.equal(tablesOf(d2, 'plot')[0].rows.find((r) => r.cells.name === 'Sam')?.cells.where, 'Upstage left');
  });
  it('something off the stage is still drawn, with room for it', () => {
    const rack = spEdit(p, (d) => {
      d.objects.push({ ...d.objects[0], id: 'ob-off', kind: 'rack', x: 1.2, y: 0.5, label: 'Monitor desk', performerId: null, sourceId: null, inputId: null, deviceId: null, w: null, h: null, offstageOk: true });
    });
    const plot2 = spPlotDoc(rack);
    assert.ok(plot2.marginM >= 0.2 * plot2.widthM, 'the margin grows to show it');
    assert.ok(plot2.legend.some((l) => /off the stage/.test(l)));
  });
});

describe('the KEY is part of every drawing of a stage (owner 2026-11-12)', () => {
  const EXAMPLES = ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const;
  const KINDS = ['full', 'compact', 'plot'] as const;
  /** The words of the key group in one SVG, in order. */
  const keyWords = (html: string): string[] | null => {
    const figure = /<figure class="plot">([\s\S]*?)<\/figure>/.exec(html)?.[1] ?? '';
    const group = /<g class="key">([\s\S]*?)<\/g>/.exec(figure)?.[1];
    return group == null ? null : [...group.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  };
  it('the key of each example’s plot is the key of its objects: every kind of symbol that is drawn, once', () => {
    for (const t of EXAMPLES) {
      const p = example(t);
      const plot = spPlotDoc(p);
      assert.deepEqual(plot.key.map((k) => ({ kind: k.kind, name: k.name })), spPlotKey(p.objects), t);
      assert.ok(plot.key.length >= 3, `${t} has a key`);
      for (const k of plot.key) {
        const sym = spKeySymbol(k.kind);
        assert.deepEqual([k.w, k.h, k.tag, k.shapes], [sym.w, sym.h, sym.tag, sym.shapes]);
        assert.ok(k.shapes.length > 0 && k.name.length > 0);
      }
      assert.equal(new Set(plot.key.map((k) => k.name)).size, plot.key.length, 'no name twice');
      // a vocal microphone and a microphone on a stand are one symbol: one entry
      assert.ok(plot.key.filter((k) => k.name === 'Microphone on a stand').length <= 1);
    }
  });
  it('every packet kind carries it inside the plot’s own figure: the heading, then each name once, each with its symbol', () => {
    for (const t of EXAMPLES) {
      const p = example(t);
      for (const packet of KINDS) {
        const d = docOf(p, { paper: 'letter', packet });
        const plot = plotOf(d);
        const html = spPacketHtml(d);
        const words = keyWords(html);
        assert.ok(words, `${t} ${packet}: the key is in the figure`);
        // "KEY", then for each entry its tag (when it has one) and its name in lines
        const want = ['KEY', ...plot.key.flatMap((k) => [...(k.tag ? [k.tag] : []), ...spKeyLines(k.name)])];
        assert.deepEqual(words, want, `${t} ${packet}`);
        assert.equal((html.match(/<g class="key">/g) ?? []).length, 1);
        // a symbol for each: the key group holds at least one shape for every entry
        const group = /<g class="key">([\s\S]*?)<\/g>/.exec(html)?.[1] ?? '';
        assert.ok((group.match(/<(circle|line|polygon|polyline) /g) ?? []).length >= plot.key.length);
        assert.ok(spDocText(d).includes(`Key: ${plot.key.map((k) => k.name).join('; ')}.`), 'the text view lists the key');
      }
    }
  });
  it('each symbol is drawn inside its own small box, with the fills and dashes it has on the plot, and its name is whole', () => {
    const plot = spPlotDoc(four());
    const scene = spPlotScene(plot, 526);
    assert.ok(scene.key);
    const K = SP_KEY_CELL;
    const layout = spKeyLayout(plot.key, 526 - 32);
    assert.equal(layout.cells.length, plot.key.length);
    assert.equal(layout.cols, 4);
    const ops = scene.ops.slice(scene.key.from, scene.key.to);
    const head = ops[0];
    assert.ok(head.t === 'text' && head.text === 'KEY' && head.bold);
    const keyTop = head.t === 'text' ? head.y - K.headPt : 0;
    // walk the ops cell by cell: shapes, an optional tag, then the name's lines
    let n = 1;
    layout.cells.forEach((cell, i) => {
      const x0 = 16 + cell.x;
      const y0 = keyTop + cell.y;
      let shapes = 0;
      while (ops[n] && ops[n].t !== 'text') {
        const o = ops[n];
        const xs = o.t === 'circle' ? [o.cx - o.r, o.cx + o.r] : o.t === 'line' ? [o.x1, o.x2] : o.t === 'poly' ? o.pts.filter((_, k) => k % 2 === 0) : [];
        const ys = o.t === 'circle' ? [o.cy - o.r, o.cy + o.r] : o.t === 'line' ? [o.y1, o.y2] : o.t === 'poly' ? o.pts.filter((_, k) => k % 2 === 1) : [];
        for (const x of xs) assert.ok(x >= x0 - 0.01 && x <= x0 + K.symbolW + 0.01, `${cell.name}: a shape leaves its box sideways`);
        for (const y of ys) assert.ok(y >= y0 - 0.01 && y <= y0 + K.symbolH + 0.01, `${cell.name}: a shape leaves its box`);
        shapes += 1;
        n += 1;
      }
      assert.ok(shapes >= 1, `${cell.name} has a symbol`);
      if (plot.key[i].tag) {
        const tag = ops[n];
        assert.ok(tag.t === 'text' && tag.text === plot.key[i].tag && tag.size >= 9);
        n += 1;
      }
      const lines: string[] = [];
      for (let k = 0; k < cell.lines.length; k += 1) {
        const o = ops[n + k];
        assert.ok(o.t === 'text' && o.size >= 9 && o.x === x0 + K.symbolW + K.gap);
        if (o.t === 'text') lines.push(o.text);
      }
      n += cell.lines.length;
      assert.equal(lines.join(' '), cell.name, 'the name is whole: wrapped between words, never cut');
    });
    assert.equal(n, ops.length, 'nothing else is in the key');
    // the riser keeps its dashed outline; the performer its gray fill
    const riserAt = layout.cells.findIndex((c) => c.kind === 'riser');
    assert.ok(riserAt >= 0);
    assert.ok(ops.some((o) => o.t === 'poly' && o.dash), 'a dashed symbol stays dashed in the key');
    assert.ok(ops.some((o) => o.t === 'circle' && o.fill === '#d2d2d2'), 'the gray of a performer is in the key');
  });
  it('the key sits under the stage and above the size note, in the same drawing', () => {
    const scene = spPlotScene(spPlotDoc(four()), 526);
    const y = (text: string) => {
      const o = scene.ops.find((x) => x.t === 'text' && x.text === text);
      assert.ok(o && o.t === 'text', text);
      return o.y;
    };
    assert.ok(y('AUDIENCE / DOWNSTAGE') < y('KEY'));
    assert.ok(y('KEY') < y('NOT TO SCALE'));
    const last = Math.max(...scene.ops.map((o) => (o.t === 'text' ? o.y : 0)));
    assert.equal(last, y('NOT TO SCALE'));
    assert.ok(scene.h >= last);
    // one SVG holds the plot and its key: a page break cannot come between them
    const html = spPacketHtml(docOf(four()));
    assert.equal((html.match(/<svg /g) ?? []).length, 1);
    assert.match(html, /figure\.plot \{[^}]*break-inside: avoid;/);
  });
  it('a long name wraps inside its cell and no word is lost; the numbers the PDF writer mirrors are these', () => {
    assert.deepEqual(SP_KEY_CELL, { symbolW: 26, symbolH: 20, textPt: 9, gap: 6, colW: 120, lineH: 11, rowGap: 6, headPt: 9.5, headH: 16 });
    const lines = spKeyLines('Wedge monitor (wide side faces the performer)');
    assert.ok(lines.length >= 2);
    assert.equal(lines.join(' '), 'Wedge monitor (wide side faces the performer)');
    assert.deepEqual(spKeyLines('Performer'), ['Performer']);
    assert.deepEqual(spKeyLines('Supercalifragilisticexpialidocious thing'), ['Supercalifragilisticexpialidocious', 'thing'], 'a word too long for the cell keeps its own line, whole');
    // a row is as tall as its tallest cell
    const layout = spKeyLayout(spPlotDoc(four()).key, 494);
    const wedge = layout.cells.find((c) => c.kind === 'wedge');
    assert.ok(wedge && wedge.h === wedge.lines.length * SP_KEY_CELL.lineH && wedge.h > SP_KEY_CELL.symbolH);
    for (const c of layout.cells) assert.ok(c.h >= c.lines.length * SP_KEY_CELL.lineH && c.x + SP_KEY_CELL.colW <= 494 + 1e-6);
  });
  it('a blank stage has an empty key and prints no KEY heading', () => {
    const empty = spNewProject({ id: 'p-empty', now: NOW });
    const plot = spPlotDoc(empty);
    assert.deepEqual(plot.key, []);
    assert.equal(spPlotScene(plot, 526).key, null);
    for (const packet of KINDS) {
      const d = docOf(empty, { paper: 'letter', packet });
      const html = spPacketHtml(d);
      assert.ok(!html.includes('class="key"'));
      assert.ok(!html.includes('>KEY</text>'));
      assert.ok(!spDocText(d).includes('Key:'));
    }
    assert.deepEqual(spKeyLayout([], 494), { h: 0, cols: 0, cells: [] });
  });
  it('the on-screen plot draws the same list, so the preview has the same key', () => {
    const src = readFileSync(new URL('../src/screens/lab/stageplot/export/PlotView.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    assert.match(src, /const parts = spPlotPreview\(plot, width, SP_PLOT_MIN_W\);/);
    assert.match(src, /\{scene\.ops\.map\(op\)\}/);
    assert.match(src, /export const SP_PLOT_MIN_W = 520;/, 'drawn at its printed size on a phone: key text stays 9 pt');
  });
});

describe('the sheet prints well (the web print view, and the phone’s fallback)', () => {
  const html = spPacketHtml(docOf(big()));
  const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  it('white paper, dark text, system fonts, nothing fetched', () => {
    assert.match(style, /body \{[^}]*background: #fff;[^}]*color: #111;/);
    assert.match(style, /font-family: -apple-system, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif/);
    assert.ok(!/<img|<link|<script|@import|url\(/.test(html));
    assert.deepEqual([...new Set(html.match(/https?:\/\/[^"' )]+/g) ?? [])], ['http://www.w3.org/2000/svg']);
  });
  it('table headers repeat and a row with its note is not split', () => {
    assert.ok(style.includes('thead { display: table-header-group; }'));
    assert.ok(style.includes('tr { break-inside: avoid; page-break-inside: avoid; }'));
    assert.ok(style.includes('tbody.row { break-inside: avoid; page-break-inside: avoid; }'));
    const tables = html.match(/<table>[\s\S]*?<\/table>/g) ?? [];
    assert.ok(tables.length >= 4);
    for (const t of tables) assert.ok(t.includes('<thead><tr><th scope="col"'), 'every table has a header row in a thead');
    assert.match(html, /<tbody class="row"><tr class="hasnote">[\s\S]*?<\/tr><tr class="note"><td colspan="\d+">[\s\S]*?<\/td><\/tr><\/tbody>/);
  });
  it('table text is 10 pt: nothing is under 10 pt except the running line', () => {
    assert.match(style, /\ntable \{[^}]*font-size: 10pt;/);
    const sizes = [...style.matchAll(/([^\n{}]*)\{[^{}]*?font-size: ([\d.]+)pt/g)].map((m) => ({ rule: m[1].trim(), pt: Number(m[2]) }));
    assert.ok(sizes.length > 8);
    for (const s of sizes) if (s.pt < 10) assert.equal(s.rule, '.runhead', `${s.rule} is ${s.pt} pt`);
    assert.ok(!/font-size: [0-8](\.\d+)?pt/.test(style));
  });
  it('a running footer with the band, the revision and the page number', () => {
    assert.ok(style.includes('@bottom-left { content: "Orquesta de Prueba · Revision 1";'));
    assert.ok(style.includes('@bottom-right { content: "Page " counter(page) " of " counter(pages);'));
    // and in the flow, for an engine that draws no margin boxes
    assert.ok(html.includes('<div class="docmeta">Orquesta de Prueba · Revision 1</div>'));
  });
  it('the plot is inline SVG, not a picture of the screen', () => {
    assert.equal((html.match(/<svg /g) ?? []).length, 1);
    assert.match(html, /<figure class="plot"><svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 526 [\d.]+" width="100%" role="img" aria-label="Stage plot drawing/);
    assert.ok(!/fill="#(?!111111|ffffff|d2d2d2)[0-9a-f]{6}"/.test(html), 'black, white and one gray: readable in grayscale');
  });
});

describe('a name cannot break the page', () => {
  const nasty = spEdit(four(), (d) => {
    d.band = '<Rock & Roll>';
    d.title = '"Quotes" & </title><script>alert(1)</script>';
    d.notes = '</style><script>alert(2)</script>';
    d.viewNote = 'Left & right are the drummer’s <own>';
    d.inputs[0].label = 'Kick "A" <b>loud</b>';
    d.performers[0].name = 'Maya <M>';
    d.mixes[0].name = 'Sam </svg>';
  });
  const d = docOf(nasty);
  const html = spPacketHtml(d);
  it('every word from the project is escaped, in the page, the SVG and the footer', () => {
    assert.ok(!html.includes('<Rock'));
    assert.ok(html.includes('&lt;Rock &amp; Roll&gt;'));
    assert.ok(!html.includes('<script'));
    assert.ok(!html.includes('<b>loud'));
    assert.ok(html.includes('Kick &quot;A&quot; &lt;b&gt;loud&lt;/b&gt;'));
    assert.ok(html.includes('>Maya &lt;M&gt;</text>'));
    assert.equal((html.match(/<\/style>/g) ?? []).length, 1);
    assert.equal((html.match(/<\/svg>/g) ?? []).length, 1);
    assert.equal((html.match(/<\/title>/g) ?? []).length, 2, 'the page title and the drawing title, and no other');
    assert.match(html, /@bottom-left \{ content: "\\3c Rock \\26  Roll\\3e  · Revision 1";/);
  });
  it('the file name, the text view and the PDF keep working', () => {
    assert.equal(d.fileName, 'RockRoll_StagePlot_Rev01.pdf');
    assert.ok(spDocText(d).includes('<ROCK & ROLL> — STAGE PLOT, INPUT LIST AND MONITOR PLAN'));
    assert.ok(spPdfPageCount(spPdfBytes(d)) >= 1);
  });
});

describe('one snapshot, and what an export does to the project', () => {
  it('the snapshot is a frozen copy: a later edit cannot reach a page made from it', () => {
    let p = four();
    const snap = spBuildSnapshot(p, FULL, NOW);
    const before = JSON.stringify(spBuildDoc(snap));
    assert.notEqual(snap.project, p);
    assert.ok(Object.isFrozen(snap.project) && Object.isFrozen(snap.project.inputs) && Object.isFrozen(snap.project.inputs[0]) && Object.isFrozen(snap.options));
    assert.throws(() => {
      (snap.project as SpProject).band = 'Changed';
    });
    p = spUpdateInput(p, p.inputs[0].id, { label: 'Kick, changed during the export' });
    assert.equal(JSON.stringify(spBuildDoc(snap)), before, 'every page comes from the snapshot and nothing else');
    assert.ok(!spPacketHtml(spBuildDoc(snap)).includes('changed during the export'));
    assert.equal(spBuildDoc(snap).generatedAt, NOW);
  });
  it('building the packet changes nothing in the project', () => {
    const p = four();
    const before = JSON.stringify(p);
    const d = docOf(p);
    spPacketHtml(d);
    spDocText(d);
    spEmailText(p);
    spPdfBytes(d);
    assert.equal(JSON.stringify(p), before);
  });
  it('an export freezes the revision that was shared and changes no other field', () => {
    const p = four();
    const snap = spBuildSnapshot(p, FULL, NOW);
    const after = spAfterExport(p, snap);
    assert.equal(after.frozenRevision, 1);
    assert.deepEqual({ ...after, frozenRevision: 0 }, { ...p, frozenRevision: 0 });
    assert.equal(spAfterExport(after, snap), after, 'a second output of the same revision changes nothing at all');
    // the next real edit moves the revision on
    assert.equal(spUpdateInput(after, after.inputs[0].id, { notes: 'x' }).revision, 2);
  });
  it('an edit made while the export was running belongs to the next revision', () => {
    const p = four();
    const snap = spBuildSnapshot(p, FULL, NOW);
    const edited = spUpdateInput(p, p.inputs[0].id, { label: 'Kick, changed during the export' });
    assert.equal(edited.revision, 1);
    const after = spAfterExport(edited, snap);
    assert.equal(after.revision, 2, 'revision 1 is what was shared; the changed project is revision 2');
    assert.equal(after.frozenRevision, 1);
    assert.equal(after.inputs[0].label, 'Kick, changed during the export');
    assert.equal(after.status, 'draft');
  });
  it('an export of an older revision does not touch a project that has moved on', () => {
    const p = four();
    const snap = spBuildSnapshot(p, FULL, NOW);
    const later = spUpdateInput(spFreeze(p), p.inputs[0].id, { notes: 'x' });
    assert.equal(later.revision, 2);
    assert.equal(spAfterExport(later, snap), later);
  });
});

describe('an empty draft, a band with its own monitor rig, and the message', () => {
  it('an empty project still makes a whole, honest packet, and says each empty thing once', () => {
    const empty = spNewProject({ id: 'p-empty', now: NOW });
    const d = docOf(empty);
    const html = spPacketHtml(d);
    const text = spDocText(d);
    assert.equal(d.stamp, 'DRAFT');
    // no band name: none is made up, anywhere
    assert.equal(d.title, 'Stage plot, input list and monitor plan');
    assert.equal(d.footer, 'Revision 1');
    assert.equal(d.fileName, 'StagePlot_Rev01.pdf');
    assert.ok(text.includes('Band: not named yet'));
    assert.ok(!/Untitled/i.test(text + html));
    assert.equal(spEmailText(empty).subject, 'Stage plot, input list and monitor plan (revision 1)');
    // a band with a stage and no name: the same, and the venue reads why
    const unnamed = docOf({ ...four(), band: '' });
    assert.equal(unnamed.title, 'Stage plot, input list and monitor plan');
    assert.equal(docOf({ ...four(), band: '' }, { paper: 'letter', packet: 'plot' }).title, 'Stage plot');
    assert.ok(spDocText(unnamed).includes('Band: not named yet'));
    assert.ok(listsOf(unnamed, 'notes').includes('No band or artist name is given.'));
    assert.ok(!/Untitled/i.test(spDocText(unnamed) + spPacketHtml(unnamed)));
    for (const words of ['No inputs yet.', 'No monitor mixes yet.', 'No equipment listed yet.', 'No performers yet.', 'No open question is recorded in this revision.', 'NOT TO SCALE', 'AUDIENCE / DOWNSTAGE']) assert.ok(html.includes(words), `the empty packet does not say "${words}"`);
    assert.ok(text.includes('Nothing is placed on the stage yet.'));
    for (const once of ['No inputs yet.', 'No monitor mixes yet.', 'No equipment listed yet.']) assert.equal(text.split(once).length - 1, 1, `"${once}" is said once`);
    assert.ok(!text.includes('No input channels yet.'));
    assert.ok(spPdfPageCount(spPdfBytes(d)) >= 1);
  });
  it('a rig the band mixes itself is not counted against the house console; the headline never adds the two', () => {
    const p = example('playback', 'Tracks');
    const d = docOf(p);
    const text = spDocText(d);
    assert.ok(text.includes('4 monitor mixes (all stereo). Nothing is requested from the house console.'), 'no zero count');
    assert.ok(text.includes('Created in the band monitor rig, and not requested from the house console: 4 mixes (8 audio channels inside that rig).'));
    assert.ok(!/monitor feed audio channels/.test(text), '"feed" would read as something the house sends');
    assert.ok(!/If each audio channel/.test(text), 'nothing is asked of the house: no output sentence');
    assert.ok(text.includes('4 wireless monitor devices: radio frequency coordination needed. This packet lists no radio frequencies.'));
    assert.equal(tablesOf(d, 'monitors')[0].rows[0].cells.by, 'Band monitor console. The venue provides: an input split');
    // said ONCE above the device table, not in all eight rows
    const once = 'All eight devices are part of the band monitor rig: nothing is requested from the venue’s monitor system.';
    assert.equal(text.split(once).length - 1, 1);
    const devices = tablesOf(d, 'monitors')[1];
    assert.equal(devices.rows.length, 8);
    assert.ok(!devices.rows.some((r) => /part of the band monitor rig/i.test(r.cells.notes)));
    // when only some devices are the band's own, each of those rows says it
    const mixed = spEdit(p, (x) => {
      x.devices[0].selfContained = false;
    });
    const rows2 = tablesOf(docOf(mixed), 'monitors')[1].rows;
    assert.ok(!spDocText(docOf(mixed)).includes('All eight devices'));
    assert.equal(rows2.filter((r) => r.cells.notes.includes('Part of the band monitor rig: nothing is requested from the venue’s monitor system')).length, 7);
  });
  it('a personal mixer system is not called the band’s own rig: it is "not mixed on the house console"', () => {
    const p = spEdit(example('playback'), (d) => {
      d.mixes[0].provider = 'personal-mixer';
    });
    assert.match(tablesOf(docOf(p), 'monitors')[0].rows[0].cells.by, /^Personal mixer system \(not mixed on the house console\)\./);
  });
  it('the band’s own list is four columns: both numbers for a shared input, the full description only for a band-rig-only input', () => {
    const p = example('playback', 'Tracks');
    const d = docOf(p);
    const [house, band] = tablesOf(d, 'inputs');
    assert.equal(house.rows.length, 10);
    assert.equal(band.rows.length, 11);
    assert.deepEqual(band.columns.map((c) => c.label), ['Ch', 'Input', 'House channel', 'Notes']);
    const kick = band.rows.find((r) => r.cells.input === 'Kick');
    assert.deepEqual([kick?.cells.ch, kick?.cells.house, kick?.cells.notes], ['1', '1', '']);
    const click = band.rows.find((r) => r.cells.input === 'Click');
    assert.equal(click?.cells.house, 'Band monitor rig only');
    assert.match(click?.cells.notes ?? '', /^Direct balanced line, line level; .*Supplied by: Band · MONITOR ONLY: kept out of the audience mix/);
    assert.ok(!house.rows.some((r) => r.cells.input === 'Click'), 'the house is not sent the click');
    const text = spDocText(d);
    assert.ok(text.includes('House system: 10 input channels:'));
    assert.ok(text.includes('Band monitor rig: 11 input channels:'));
    // the split: one paragraph above the table and one unresolved line, not a sentence under every row
    assert.equal(text.split('through a split').length - 1, 1);
    assert.ok(parasOf(d, 'inputs').some((x) => x.startsWith('Inputs in both lists reach the house system and the band monitor rig through a split.')));
    assert.ok(!house.rows.some((r) => r.note), 'no split sentence under the rows');
    assert.equal(listsOf(d, 'notes').filter((l) => l.startsWith('How the split is made:')).length, 1);
  });
  it('the suggested message names the event, the revision and the shown contact, and is only a suggestion', () => {
    const p = spEdit(four(), (d) => {
      d.venue = 'The Blue Room';
      d.eventDate = '2026-12-05';
      d.contact = { name: 'Sam', role: '', email: 'sam@example.test', phone: '', show: { name: true, role: true, email: true, phone: true } };
    });
    const mail = spEmailText(p);
    assert.equal(mail.subject, 'The Example Four: stage plot, input list and monitor plan for The Blue Room, December 5, 2026 (revision 1)');
    const said = 'The packet shows what we bring and what we ask the venue to provide. Please tell us about any substitutions, and help us settle the details marked “to be confirmed”.';
    assert.equal(mail.body, `Hello,\n\nAttached are our stage plot, input list and monitor plan for The Blue Room, December 5, 2026 (revision 1). ${said}\n\nThank you.\n\nTechnical contact: Sam · sam@example.test`);
    // no contact shown: the reviewer's text, to the letter
    assert.equal(spEmailText(four()).body, `Hello,\n\nAttached are our stage plot, input list and monitor plan (revision 1). ${said}\n\nThank you.`);
    // a contact item the band hid is not in the message
    const hidden = spEdit(p, (d) => {
      d.contact.show.email = false;
    });
    assert.ok(!spEmailText(hidden).body.includes('sam@example.test'));
    assert.ok(spEmailText(hidden).body.endsWith('Technical contact: Sam'));
    // no band name: the subject starts with what is attached
    assert.equal(spEmailText({ ...four(), band: ' ' }).subject, 'Stage plot, input list and monitor plan (revision 1)');
  });
});

describe('the PDF file on a phone: the app’s own writer, saved as base64', () => {
  it('base64 is the standard encoding, for every length of tail', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 255, 256, 1000, 20000]) {
      const bytes = new Uint8Array(n).map((_, k) => (k * 37 + 11) % 256);
      assert.equal(spBase64(bytes), Buffer.from(bytes).toString('base64'), `${n} bytes`);
    }
  });
  it('a packet survives the trip: the bytes read back from base64 are the same PDF', () => {
    const bytes = spPdfBytes(docOf(four()));
    const back = new Uint8Array(Buffer.from(spBase64(bytes), 'base64'));
    assert.deepEqual(back, bytes);
    assert.equal(spPdfPageCount(back), spPdfPageCount(bytes));
    assert.equal(Buffer.from(back.slice(0, 8)).toString('latin1').slice(0, 5), '%PDF-');
  });
});

describe('the Export area: its guide, its memory and its wiring', async () => {
  const { SP_GUIDE_EXPORT: g } = await import('../src/screens/lab/stageplot/guides/export.ts');
  const { SCREEN_GUIDE_BUDGET, SCREEN_GUIDE_SECTIONS, SCREEN_INTRO_WORDS } = await import('../src/features/lab/screenGuide/types.ts');
  const session = await import('../src/screens/lab/stageplot/export/exportSession.ts');
  const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const area = strip(read('screens/lab/stageplot/ExportArea.tsx'));
  const exportTs = strip(read('features/stageplot/spExport.ts'));
  const printView = strip(read('screens/lab/stageplot/export/WebPrintView.tsx'));
  const words = (s: string) => s.trim().split(/\s+/).length;

  it('the guide has its intro card and five sections inside the budgets', () => {
    assert.ok(g.intro);
    assert.ok(words(g.intro.learning) <= SCREEN_INTRO_WORDS.learning, `intro.learning is ${words(g.intro.learning)} words`);
    assert.ok(words(g.intro.start) <= SCREEN_INTRO_WORDS.start, `intro.start is ${words(g.intro.start)} words`);
    for (const s of SCREEN_GUIDE_SECTIONS) {
      const items = g[s.key];
      assert.ok(items.length >= 1 && items.length <= 5, `${s.key}: ${items.length} bullets`);
      for (const it of items) assert.ok(it.trim().length > 20);
      if (s.key === 'tryThis') {
        assert.ok(items.length >= 2 && items.length <= 3);
        for (const it of items) assert.ok(it.length <= SCREEN_GUIDE_BUDGET.tryItem, `a tryThis item is ${it.length} characters`);
      } else {
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        assert.ok(items.join('\n').length <= cap, `${s.key}: ${items.join('\n').length} characters (cap ${cap})`);
      }
    }
  });
  it('the guide follows the house copy rules: a button or a section in CAPITALS as on the screen, one name for each thing', () => {
    const t = [g.intro?.learning ?? '', g.intro?.start ?? '', ...SCREEN_GUIDE_SECTIONS.flatMap((s) => g[s.key])].join('\n');
    assert.ok(/\byou(r)?\b/i.test(t));
    assert.ok(!/you(’|')ll (master|build|mix)|you will (master|be able to)/i.test(t));
    assert.ok(!/\b(colour|behaviour|centre|programmes?|grey)\b|\b(organis|recognis)/i.test(t));
    assert.ok(!/\bat once\b/i.test(t));
    assert.ok(!/\bthis screen (shows|lists|contains)\b/i.test(g.teaches.join(' ')));
    assert.ok(!/\bkeys?\b|share sheet|clipboard|gig packet|your project|freezes/i.test(t), 'a button is a button; the share menu; the packet; your stage plot');
    const screen = read('screens/lab/stageplot/ExportArea.tsx') + read('screens/lab/stageplot/export/PacketPreview.tsx') + read('screens/lab/stageplot/export/WebPrintView.tsx') + read('screens/lab/stageplot/spForm.tsx') + read('features/stageplot/spPacket.ts');
    // every run of CAPITALS in the guide is a label that is typed in capitals on the screen
    for (const m of t.matchAll(/\b[A-Z][A-Z0-9]{2,}(?: [A-Z0-9]{2,})*\b/g)) assert.ok(screen.includes(m[0]), `the guide names ${m[0]}, which is not a label typed that way on the screen`);
    for (const m of t.matchAll(/“([^”]+)”/g)) assert.ok(screen.toUpperCase().includes(m[1].toUpperCase()), `the guide quotes “${m[1]}”, which is not on the screen`);
    for (const button of ['SHARE PDF', 'PRINT', 'DOWNLOAD PDF', 'COPY TECHNICAL SUMMARY', 'COPY THE MESSAGE']) {
      assert.ok(t.includes(button), `the guide names ${button}`);
      assert.ok(!t.includes(`“${button}`), 'a button is named without quotation marks');
    }
  });
  it('every button label is typed in CAPITALS, and a sentence that names one writes it the same way', () => {
    const labels = [...(area + printView).matchAll(/<Button\s+label=(?:"([^"]+)"|\{([^}]+)\})/g)].map((m) => m[1] ?? m[2]);
    assert.ok(labels.length >= 10);
    for (const l of labels) for (const s of l.match(/'[^']+'|^[^'?:]+$/g) ?? []) assert.equal(s, s.toUpperCase(), `a button label in sentence case: ${s}`);
    assert.ok(!/“(Print|Share PDF|Download PDF|Copy technical summary|Share the same PDF again)”/.test(area));
    assert.ok(!/share sheet|print engine|by hand|your project|\bkeys?\b/i.test(area.replace(/Object\.keys|keyboardShouldPersistTaps|keyof/g, '')));
  });
  it('one plural helper: no count is glued to a plural word', () => {
    assert.ok(!/\$\{[^}]+\} (input channels|audio channels|mixes|pages|details)\b/.test(area), 'a count is printed through plural()');
    assert.match(area, /const plural = \(n: number, one: string, many = `\$\{one\}s`\): string =>/);
  });
  it('every output is made from one snapshot, after the latest edit is saved, and an export only freezes the revision', () => {
    assert.match(area, /edRef\.current\.flush\(\);\s+const p = edRef\.current\.project;[\s\S]{0,300}?spBuildSnapshot\(p, \{ paper, packet \}, Date\.now\(\)\)/);
    assert.match(area, /now\.apply\(\(p\) => \{\s+const next = spAfterExport\(p, snap\);/);
    assert.match(area, /now\.markExported\(\)/);
    assert.ok(!/spUpdate|spSet[A-Z]|spAdd|spRemove|spMark|spEdit\(|spFreeze/.test(area), 'the Export area makes no other edit');
  });
  it('print, the PDF file, sharing, the download and the two copies are separate operations with separate lines', () => {
    assert.match(read('screens/lab/stageplot/export/exportSession.ts'), /export type SpExportLine = 'print' \| 'pdf' \| 'share' \| 'download' \| 'summary' \| 'message';/);
    for (const fn of ['spPrintNative', 'spMakePdf', 'spSharePdf', 'spDownloadPdf', 'spCopy']) assert.ok(exportTs.includes(`export async function ${fn}(`) || exportTs.includes(`export function ${fn}(`), `${fn} is its own operation`);
    const presses = [...area.matchAll(/onPress=\{(on[A-Za-z]+)\}/g)].map((m) => m[1]);
    assert.ok(presses.length >= 6);
    for (const name of presses) assert.ok(area.includes(`const ${name} = useLatchedPress(`), `${name} is on the latch`);
    // a line is not taken away when another button is pressed
    assert.ok(!/say\([^)]*null\)/.test(area));
  });
  it('opening a share menu or a mail app is never reported as sent', () => {
    assert.match(exportTs, /export type SpShareOutcome = 'opened' \| 'no-target' \| 'unavailable' \| 'failed';/);
    assert.ok(!/(email|message|packet|pdf|file|it) (was|has been|is) (sent|delivered|emailed)/i.test(area.replace(/Nothing was sent\./g, '')));
    assert.match(area, /This app cannot tell whether you sent it, or to whom\./);
    assert.match(area, /This tool does not send email\./);
    assert.ok(!/mailto:/i.test(area + exportTs), 'a mailto link cannot attach a file and is not offered');
  });
  it('a phone uses the app’s own PDF writer first: for the file, for sharing and for printing; the HTML sheet is the fallback', () => {
    assert.match(exportTs, /async function writeOwnPdf\(d: SpDoc\): Promise<SpPdfFile \| null> \{[\s\S]*?spPdfBytes\(d\)[\s\S]*?writeAsStringAsync\(uri, spBase64\(bytes\), \{ encoding: FileSystem\.EncodingType\.Base64 \}\)[\s\S]*?via: 'writer'/);
    assert.match(exportTs, /const file = \(await writeOwnPdf\(d\)\) \?\? \(await convertHtmlPdf\(d\)\);/);
    assert.match(exportTs, /await print\.printAsync\(own \? \{ uri: asFileUri\(own\.uri\) \} : htmlOptions\(d\)\);/);
    assert.match(exportTs, /via: 'html'/);
    // the status line says which engine made the PDF to a screen reader, not in the visible words
    assert.match(area, /a11y: `\$\{text\} \$\{VIA_WORDS\[file\.via\]\}`/);
    assert.match(area, /accessibilityLabel=\{s\.a11y \?\? s\.text\}/);
    assert.ok(!/<Note[^>]*>\{[^}]*VIA_WORDS/.test(area));
  });
  it('the phone paths go through the optional-module gate and never throw', () => {
    assert.match(exportTs, /optionalModule<PrintLib>\('expo-print'\)/);
    assert.match(exportTs, /optionalModule<SharingLib>\('expo-sharing'\)/);
    assert.ok(!/from 'expo-print'|from 'expo-sharing'|from 'expo-mail-composer'/.test(exportTs));
    assert.ok(!/\bthrow\b/.test(exportTs));
    assert.match(exportTs, /width: page\.w, height: page\.h/);
  });
  it('NOTHING PRINTS BY ITSELF in a browser: the print call is one button press away, never an effect, an onLoad or a timer', () => {
    // the one function that calls the browser's print
    assert.equal((exportTs.match(/\.print\(\)/g) ?? []).length, 1);
    assert.match(exportTs, /export function spPrintFrame\(frame: unknown\): SpFramePrintOutcome \{[\s\S]*?win\.print\(\);[\s\S]*?\n\}/);
    // its one caller is a press handler in the print view
    const everywhere = area + printView + strip(read('screens/lab/stageplot/export/PacketPreview.tsx')) + strip(read('screens/lab/stageplot/export/PlotView.tsx'));
    assert.equal((everywhere.match(/spPrintFrame\(/g) ?? []).length, 1);
    assert.match(printView, /const printThisView = \(\) => onPrinted\(spPrintFrame\(frame\.current\)\);/);
    assert.match(printView, /<Button label="PRINT THIS VIEW" tone="primary" onPress=\{printThisView\}/);
    assert.equal((printView.match(/printThisView/g) ?? []).length, 2, 'defined once, used once: by the button');
    assert.ok(!/useEffect|useLayoutEffect|onLoad|setTimeout|setInterval|requestAnimationFrame|\.print\(/.test(printView), 'the print view has no effect, no onLoad and no timer');
    assert.ok(!/\.print\(|window\.print|printRequest/.test(area));
    // PRINT on the web only opens the view; the view can be closed
    assert.match(area, /if \(SP_IS_WEB\) \{[\s\S]{0,400}?setPrintView\(true\);[\s\S]{0,200}?return;\s+\}/);
    assert.match(printView, /<Button label="CLOSE" onPress=\{onClose\}/);
    assert.match(area, /onClose=\{\(\) => setPrintView\(false\)\}/);
    assert.match(area, /the browser’s own dialog opens then, and “Save as PDF” there makes a file\./);
  });
  it('what the area remembers is held outside it, for the open stage plot, and the account wipe clears it', () => {
    const start = (): ReturnType<typeof session.spExportSession> => ({ packet: 'full', paper: 'letter', mail: null, kept: null, said: {} });
    session.resetSpExportSessions();
    const first = session.spExportSession('p1', start);
    assert.deepEqual(first, start());
    session.spPatchExportSession('p1', { paper: 'a4', mail: { subject: 'S', body: 'B' }, kept: { uri: 'file:///x.pdf', fileName: 'x.pdf', pages: 3, revision: 2, via: 'writer', what: 'Full packet, A4' } }, start);
    // the area is taken off the screen and comes back: it reads the same session
    const again = session.spExportSession('p1', start);
    assert.equal(again.paper, 'a4');
    assert.deepEqual(again.mail, { subject: 'S', body: 'B' });
    assert.equal(again.kept?.fileName, 'x.pdf');
    assert.deepEqual(session.spExportSession('p2', start), start(), 'another stage plot has its own');
    session.resetSpExportSessions();
    assert.deepEqual(session.spExportSession('p1', start), start(), 'cleared by the wipe');
    assert.match(read('screens/lab/stageplot/export/exportSession.ts'), /^registerLocalStoreReset\(resetSpExportSessions\);$/m);
    assert.match(area, /useState<SpExportSession>\(\(\) => spExportSession\(projectId, start\)\)/);
    assert.ok(!/useState<SpPaper>|useState<SpPacketKind>|setKept|setMail/.test(area), 'the choices, the kept PDF and the message are not state of the component');
    assert.match(area, /paper: unit === 'm' \? 'a4' : 'letter'/, 'a stage measured in meters starts on A4');
    assert.match(area, /Your stage plot is now at revision \$\{project\.revision\}\./, 'a kept PDF of an older revision says so');
  });
  it('the area says which contact details the packet shows, with a way to change them', () => {
    assert.match(area, /Contact shown in the packet: \$\{contactShown\.join\(', '\) \|\| 'none'\}\. Change it in SETUP\./);
    assert.match(area, /<Button label="GO TO SETUP" onPress=\{\(\) => ed\.goTo\('setup'\)\}/);
  });
  it('the preview comes before the buttons that send the packet', () => {
    assert.ok(area.indexOf('<Section title="PREVIEW"') > 0);
    assert.ok(area.indexOf('<Section title="PREVIEW"') < area.indexOf('<Section title="PRINT, SHARE AND SAVE"'));
    assert.ok(area.indexOf('<Section title="PRINT, SHARE AND SAVE"') < area.indexOf('title="EMAIL"'));
  });
});

/* ── review 2 (2026-11-12) ──────────────────────────────────────────────── */

const EXAMPLES = ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const;
const srcOf = (rel: string): string => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Bx = { x0: number; y0: number; x1: number; y1: number };
type PlotItem = SpDocPlot['items'][number];
/** The box of each shape of a symbol (meters, on the stage), a hair wider so a thin line counts. */
const partBoxes = (i: PlotItem): Bx[] =>
  i.shapes.map((s) => {
    let b: Bx;
    if (s.t === 'circle') b = { x0: s.cx - s.r, y0: s.cy - s.r, x1: s.cx + s.r, y1: s.cy + s.r };
    else if (s.t === 'line') b = { x0: Math.min(s.x1, s.x2), y0: Math.min(s.y1, s.y2), x1: Math.max(s.x1, s.x2), y1: Math.max(s.y1, s.y2) };
    else if (s.t === 'poly') {
      const xs = s.pts.filter((_, n) => n % 2 === 0);
      const ys = s.pts.filter((_, n) => n % 2 === 1);
      b = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    } else b = { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
    return { x0: b.x0 - 1e-4, y0: b.y0 - 1e-4, x1: b.x1 + 1e-4, y1: b.y1 + 1e-4 };
  });
const overlapOf = (a: Bx, b: Bx): number => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
const gapOf = (a: Bx, b: Bx): number => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
const unionOf = (list: Bx[]): Bx => ({ x0: Math.min(...list.map((b) => b.x0)), y0: Math.min(...list.map((b) => b.y0)), x1: Math.max(...list.map((b) => b.x1)), y1: Math.max(...list.map((b) => b.y1)) });

/** The label rules of review 2 (visuals A1, A2, A6, A8), measured on one plot
 *  at the printed scale. Every count but `leaders` and `short` must be 0. */
function labelFacts(p: SpProject, how: { roomy?: boolean } = {}) {
  const plot = spPlotDoc(p, how);
  const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
  const sized = new Set(p.objects.filter((o) => spIsSized(o.kind)).map((o) => o.id));
  const onStage = new Set(p.objects.filter((o) => o.x >= 0 && o.x <= 1 && o.y >= 0 && o.y <= 1).map((o) => o.id));
  const rows = plot.items
    .filter((i) => spLabelBlock(i).h > 0)
    .map((i) => {
      const b = spLabelBlock(i);
      const x0 = i.labelAt.x - b.labelW / k / 2;
      return { i, box: { x0, y0: i.labelAt.y, x1: x0 + b.w / k, y1: i.labelAt.y + b.h / k } };
    });
  const facts = { names: rows.length, overSymbol: 0, overName: 0, notNearest: 0, outside: 0, onRiserEdge: 0, leaders: 0, short: 0 };
  const said: string[] = [];
  const nameOf = (i: PlotItem) => spPlotItemName(i) || i.id;
  for (const r of rows) {
    const mine = sized.has(r.i.id);
    // 1. never over a symbol: another object's, or its own
    for (const o of plot.items) {
      if (sized.has(o.id)) continue;
      if (partBoxes(o).some((b) => overlapOf(r.box, b) > 1e-9)) {
        facts.overSymbol += 1;
        said.push(`${nameOf(r.i)} lies over ${nameOf(o)}`);
      }
    }
    // 2. never over another name
    for (const q of rows) if (q !== r && overlapOf(r.box, q.box) > 1e-9) facts.overName += 1;
    // 3. a name beside its symbol is nearer to its own symbol than to any other (edge to edge)
    if (!r.i.leader && !mine) {
      const own = Math.min(...partBoxes(r.i).map((b) => gapOf(r.box, b)));
      for (const o of plot.items) {
        if (o === r.i || sized.has(o.id)) continue;
        if (Math.min(...partBoxes(o).map((b) => gapOf(r.box, b))) <= own + 1e-9) {
          facts.notNearest += 1;
          said.push(`${nameOf(r.i)} is as near to ${nameOf(o)} as to its own symbol`);
        }
      }
    }
    // 4. an on-stage object's name is inside the outline, 4 pt clear of it
    if (onStage.has(r.i.id)) {
      const m = 4 / k - 1e-6;
      if (r.box.x0 < m || r.box.y0 < m || r.box.x1 > plot.widthM - m || r.box.y1 > plot.depthM - m) {
        facts.outside += 1;
        said.push(`${nameOf(r.i)} is not inside the stage outline`);
      }
    }
    // 5. never on a platform's dashed edge: wholly inside it, or wholly outside
    for (const o of plot.items) {
      if (o === r.i || !sized.has(o.id)) continue;
      const box = unionOf(partBoxes(o));
      const inside = r.box.x0 >= box.x0 && r.box.x1 <= box.x1 && r.box.y0 >= box.y0 && r.box.y1 <= box.y1;
      if (overlapOf(r.box, box) > 1e-9 && !inside) {
        facts.onRiserEdge += 1;
        said.push(`${nameOf(r.i)} is on the edge of ${nameOf(o)}`);
      }
    }
  }
  facts.leaders = plot.items.filter((i) => i.leader).length;
  facts.short = plot.items.filter((i) => !i.label && i.badges.length > 0).length;
  return { plot, facts, said };
}

describe('names on the plot keep the hard rules (review 2, visuals A1)', () => {
  // leaders and numbers printed alone, as they are today; the five rule counts are always 0
  const TODAY: Record<(typeof EXAMPLES)[number], { leaders: number; short: number }> = {
    solo: { leaders: 0, short: 0 },
    duo: { leaders: 0, short: 1 },
    'four-piece': { leaders: 1, short: 4 },
    playback: { leaders: 0, short: 0 },
    salsa: { leaders: 5, short: 12 },
  };
  for (const t of EXAMPLES) {
    it(`${t}: no name over a symbol or a name, every name nearest its own symbol, inside the outline, off the riser's edge`, () => {
      for (const how of [{}, { roomy: true }]) {
        const { facts, said } = labelFacts(example(t), how);
        assert.deepEqual({ overSymbol: facts.overSymbol, overName: facts.overName, notNearest: facts.notNearest, outside: facts.outside, onRiserEdge: facts.onRiserEdge }, { overSymbol: 0, overName: 0, notNearest: 0, outside: 0, onRiserEdge: 0 }, said.join('; '));
        assert.ok(facts.names > 0);
      }
      const { facts } = labelFacts(example(t));
      assert.ok(facts.leaders <= TODAY[t].leaders, `${t}: ${facts.leaders} leaders`);
      assert.ok(facts.short <= TODAY[t].short, `${t}: ${facts.short} numbers printed with no name`);
    });
  }
  it('the same rules hold on the 32-input band and on a hand-moved stage', () => {
    const a = labelFacts(big());
    assert.deepEqual([a.facts.overSymbol, a.facts.overName, a.facts.notNearest, a.facts.outside, a.facts.onRiserEdge], [0, 0, 0, 0, 0], a.said.join('; '));
    // everything pushed into one corner: names go farther out on leaders before they lie on anything
    const crowded = spEdit(four(), (d) => {
      d.objects.forEach((o, n) => {
        if (o.kind !== 'riser') {
          o.x = 0.08 + (n % 4) * 0.07;
          o.y = 0.1 + Math.floor(n / 4) * 0.09;
        }
      });
    });
    const b = labelFacts(crowded);
    assert.deepEqual([b.facts.overName, b.facts.outside], [0, 0], b.said.join('; '));
  });
  it('a name that cannot stand beside its symbol: equipment keeps its number alone, a person keeps the name on a leader line', () => {
    const { plot } = labelFacts(example('salsa'));
    const short = plot.items.filter((i) => !i.label && i.badges.length > 0);
    assert.ok(short.length > 0, 'the 12-performer stage is crowded');
    for (const i of short) {
      assert.equal(i.person, false, 'a performer always keeps the name');
      assert.ok(spPlotItemName(i), 'the name is kept for the text view');
    }
    for (const i of plot.items.filter((x) => x.person)) assert.ok(i.label, 'every performer is named on the drawing');
    // the legend says how to read a number with no name, only when there is one
    assert.ok(plot.legend.some((l) => l.includes('Where a number or a code has no name beside it, the key shows what the symbol is, and the input list or the monitor plan names it.')));
    assert.ok(!spPlotDoc(example('solo')).legend.some((l) => /no name beside it/.test(l)));
    // the text view names every one of them
    const text = spDocText(docOf(example('salsa')));
    for (const i of short) assert.ok(text.includes(`- ${spPlotItemName(i)}: `), `the text view does not name ${spPlotItemName(i)}`);
    assert.ok(!text.includes('An object with no name'));
  });
  it('a leader runs from the name to its own symbol, and the sheet draws it as a gray hairline under the symbols', () => {
    const { plot } = labelFacts(example('salsa'));
    const led = plot.items.filter((i) => i.leader);
    assert.ok(led.length > 0);
    const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
    for (const i of led) {
      assert.deepEqual(i.leader?.to, { x: i.at.x, y: i.at.y });
      const b = spLabelBlock(i);
      const x0 = i.labelAt.x - b.labelW / k / 2;
      const f = i.leader!.from;
      assert.ok(f.x >= x0 - 1e-9 && f.x <= x0 + b.w / k + 1e-9 && f.y >= i.labelAt.y - 1e-9 && f.y <= i.labelAt.y + b.h / k + 1e-9, 'it starts on the name’s own row');
    }
    const scene = spPlotScene(plot, 526);
    const lines = scene.ops.map((o, n) => ({ o, n })).filter((x) => x.o.t === 'line' && x.o.stroke === '#8a8a8a');
    assert.equal(lines.length, led.length);
    const firstSymbol = scene.ops.findIndex((o) => o.t === 'circle');
    assert.ok(lines.every((x) => x.n < firstSymbol), 'leaders are drawn first, so a symbol covers the end of its line');
    assert.ok(!spPlotDoc(example('solo')).items.some((i) => i.leader));
  });
  it('people are listed last, so a performer is drawn over the stool of the kit; the text view still reads them first', () => {
    const plot = spPlotDoc(four());
    const first = plot.items.findIndex((i) => i.person);
    assert.ok(first > 0 && plot.items.slice(first).every((i) => i.person));
    const text = spDocText(docOf(four()));
    assert.ok(text.indexOf('- Maya: upstage center. Monitor mix M3') < text.indexOf('- Drums: upstage center. Input channels 1–6'));
    assert.ok(!text.includes('References'));
    assert.ok(spDocText(docOf(example('playback'))).includes('- Playback and click: upstage left. Input channels 7–8. Band monitor rig channel B11'));
  });
});

describe('a plot that needs room (review 2, visuals A3)', () => {
  it('the plot-only packet and any plot with six or more performers are roomy; nothing else is', () => {
    assert.deepEqual([SP_PLOT_ROOMY_H, SP_PLOT_ROOMY_PEOPLE, SP_ROOMY_H.letter, SP_ROOMY_H.a4], [520, 6, 520, 560]);
    assert.equal(plotOf(docOf(four())).roomy, false);
    assert.equal(plotOf(docOf(four(), COMPACT)).roomy, false);
    assert.equal(plotOf(docOf(four(), { paper: 'letter', packet: 'plot' })).roomy, true);
    assert.equal(plotOf(docOf(example('salsa'))).roomy, true, '12 performers');
    assert.equal(plotOf(docOf(example('solo'), { paper: 'a4', packet: 'plot' })).roomy, true);
  });
  it('a roomy plot may be 520 pt tall, and is drawn larger when its stage has the width for it', () => {
    const usual = spPlotDoc(example('duo'));
    const roomy = spPlotDoc(example('duo'), { roomy: true });
    assert.equal(spPlotMaxH(usual), 240);
    assert.equal(spPlotMaxH(roomy), 520);
    assert.ok(spPlotScale(roomy, 526) > spPlotScale(usual, 526));
    assert.ok(spPlotScene(roomy, 526).h > spPlotScene(usual, 526).h);
    const drawH = (plot: SpDocPlot, maxH?: number) => (plot.depthM + plot.marginM * 2) * spPlotScale(plot, 526, maxH);
    assert.ok(drawH(roomy) <= 520 + 1e-6);
    assert.ok(drawH(roomy, SP_ROOMY_H.a4) <= 560 + 1e-6);
  });
  it('on the sheet the section after a roomy plot starts a new page; after any other plot it does not', () => {
    assert.ok(spPacketHtml(docOf(example('salsa'))).includes('class="sec newpage"'));
    assert.ok(!spPacketHtml(docOf(four())).includes('class="sec newpage"'));
    assert.equal(pagesOf(example('salsa'), { paper: 'letter', packet: 'plot' }), 1);
  });
});

describe('the key in the Export preview is always in view (review 2, visuals C)', () => {
  const plot = spPlotDoc(four());
  it('in a window narrower than the drawing, the stage scrolls sideways alone and the key is laid out at the window’s width', () => {
    const v = spPlotPreview(plot, 334, 520);
    assert.equal(v.scrolls, true);
    assert.equal(v.stage.w, 520);
    assert.equal(v.stage.key, null, 'the sideways scroller holds no key');
    assert.ok(!v.stage.ops.some((o) => o.t === 'text' && o.text === 'KEY'));
    assert.ok(v.key);
    assert.equal(v.key.w, 334);
    assert.equal(spKeyLayout(plot.key, 334).cols, 2);
    const words = v.key.ops.flatMap((o) => (o.t === 'text' ? [o] : []));
    const read = words.map((o) => o.text).join(' ');
    for (const e of plot.key) for (const w of e.name.split(' ')) assert.ok(read.includes(w), `the key under the preview does not say "${w}"`);
    for (const o of words) {
      assert.ok(o.size >= 9);
      assert.ok(o.x >= 0 && o.x + spTextW(o.text, o.size, o.bold) <= 334 + 0.5, `"${o.text}" would run past the window`);
    }
    assert.deepEqual(v.key.ops, spKeyScene(plot.key, 334).ops);
  });
  it('in a window as wide as the drawing, the key is part of the one drawing', () => {
    const v = spPlotPreview(plot, 700, 520);
    assert.equal(v.scrolls, false);
    assert.equal(v.key, null);
    assert.ok(v.stage.key, 'the key is in the scene');
    assert.equal(v.stage.w, 700);
    // a stage with nothing on it has no key in either layout
    const empty = spPlotDoc(spNewProject({ id: 'p-none', now: NOW }));
    assert.equal(spPlotPreview(empty, 334, 520).key, null);
  });
  it('PlotView draws it that way: only the stage inside the sideways scroller, the key after it; the choice is "Formatted"', () => {
    const view = srcOf('screens/lab/stageplot/export/PlotView.tsx');
    const scroller = /<ScrollView horizontal[\s\S]*?<\/ScrollView>/.exec(view);
    assert.ok(scroller);
    assert.ok(scroller[0].includes('<Scene scene={parts.stage}'));
    assert.ok(!scroller[0].includes('parts.key'));
    assert.ok(view.indexOf('<Scene scene={parts.key}') > view.indexOf('</ScrollView>'));
    assert.match(view, /seen from above, with the audience at the bottom/);
    const area = srcOf('screens/lab/stageplot/ExportArea.tsx');
    assert.match(area, /\{ value: 'pages', label: 'Formatted' \}/);
    assert.ok(!/label: 'Pages'/.test(area));
  });
});

describe('the words of review 2 in the packet', () => {
  const texts = EXAMPLES.map((t) => {
    const d = docOf(example(t));
    return spDocText(d) + '\n' + spPacketHtml(d) + '\n' + spDocText(docOf(example(t), COMPACT));
  }).join('\n');
  it('one name for one thing: none of the retired words is printed, in any example', () => {
    for (const old of [/asked of/i, /own rig\b/i, /Band rig/, /coordination required/i, /DI audio/i, /seen from the audience/i, /References:/, /Untitled/i, /Nobody yet/i, /\bround box/i, /by type/i, /device arrangement/i]) assert.ok(!old.test(texts), `the packet still says ${old}`);
    assert.ok(texts.includes('Seen from above, with the audience at the bottom. Stage right and stage left are the performers’ own right and left, so stage right is on the left of this drawing.'));
    assert.ok(texts.includes('rounded box'));
    assert.ok(texts.includes('by group'));
  });
  it('no zero count is printed: "(all mono)", "(all stereo)", "(mono)", "all for the audience mix"', () => {
    assert.ok(!/\b0 (mono|stereo|mix|mixes|monitor only|for the audience mix|audio channels?)\b/.test(texts));
    assert.ok(spDocText(docOf(example('salsa'))).includes('6 monitor mixes (all mono).'));
    assert.ok(spDocText(docOf(example('playback'))).includes('4 monitor mixes (all stereo).'));
    assert.match(spDocText(docOf(example('solo'))), /1 monitor mix \((mono|stereo)\)\./);
    assert.ok(spDocText(docOf(example('salsa'))).includes('16 input channels to the house system: all for the audience mix.'));
    // routing still to be confirmed and nothing monitor only: no "0 monitor only"
    const p = spEdit(four(), (d) => {
      for (const i of d.inputs) i.audience = i.label === 'Kick' ? 'tbc' : 'audience';
    });
    assert.ok(spDocText(docOf(p)).includes('14 input channels to the house system: 13 for the audience mix, 1 with the audience routing to be confirmed.'));
  });
  it('wireless: "radio frequency coordination needed", for inputs and for monitor devices', () => {
    const p = spAddPackage(four(), 'vocal-wireless', { sourceLabel: 'Guest' }).p;
    const text = spDocText(docOf(p));
    assert.ok(text.includes('1 wireless receiver output: radio frequency coordination needed.'));
    assert.ok(text.includes('1 wireless monitor device: radio frequency coordination needed. This packet lists no radio frequencies.'));
    assert.ok(text.includes('Notes: Wireless: radio frequency coordination needed'));
  });
  it('the equipment table: a backline row says what it is and has no made-up quantity; a DI device says what it carries', () => {
    const [eq] = tablesOf(docOf(four()), 'equipment');
    const backline = eq.rows.find((r) => r.cells.item.startsWith('Backline'));
    assert.deepEqual([backline?.cells.item, backline?.cells.qty, backline?.cells.band], ['Backline: drum kit, bass amplifier, guitar amplifier, keyboard', '–', '1']);
    assert.equal(eq.rows.find((r) => r.cells.item === 'DI device: Bass DI')?.cells.notes, 'Mono: 1 DI channel · passive · Carries: Bass DI (channel 7)');
    assert.equal(eq.rows.find((r) => r.cells.item === 'DI device: Keys stereo DI')?.cells.notes, 'Stereo: 2 DI channels · Carries: Keys L (channel 9), Keys R (channel 10)');
    // one thing, counted: its quantity is printed
    const p = spEdit(four(), (d) => {
      const b = d.extras.find((e) => e.kind === 'backline');
      assert.ok(b);
      b.label = 'Guitar amplifier';
      b.qty = 2;
    });
    const row = tablesOf(docOf(p), 'equipment')[0].rows.find((r) => r.cells.item.startsWith('Backline'));
    assert.deepEqual([row?.cells.item, row?.cells.qty], ['Backline: guitar amplifier', '2']);
  });
  it('a DI channel with no DI device yet is one honest row, in the singular and in the plural', () => {
    const loose = (labels: string[]) =>
      spEdit(four(), (d) => {
        for (const i of d.inputs) if (labels.includes(i.label)) i.diDeviceId = null;
      });
    const one = tablesOf(docOf(loose(['Bass DI'])), 'equipment')[0].rows.find((r) => r.cells.item.startsWith('DI channel'));
    assert.deepEqual([one?.cells.item, one?.cells.qty, one?.cells.notes], ['DI channel with no DI device yet', '1', 'Which DI box carries it is to be confirmed: Bass DI']);
    const two = tablesOf(docOf(loose(['Keys L', 'Keys R'])), 'equipment')[0].rows.find((r) => r.cells.item.startsWith('DI channel'));
    assert.deepEqual([two?.cells.item, two?.cells.qty, two?.cells.notes], ['DI channels with no DI device yet', '2', 'Which DI box carries them is to be confirmed: Keys L, Keys R']);
  });
  it('the tables give the room to the columns that need it (relative widths, as review 2 measured them)', () => {
    const [mixes, devices] = tablesOf(docOf(example('playback')), 'monitors');
    assert.deepEqual(mixes.columns.map((c) => [c.label, c.width]), [['Mix', 14], ['For', 10], ['Format', 8], ['Who creates it', 30], ['Delivery and devices', 22], ['Asked to hear', 16]]);
    assert.deepEqual(devices.columns.map((c) => [c.label, c.width]), [['Device', 17], ['Type', 18], ['Mix', 7], ['Used by', 10], ['Supplied by', 11], ['Notes', 37]]);
  });
  it('the Export summary counts the SAME equipment rows the packet prints', () => {
    for (const t of EXAMPLES) {
      const p = example(t);
      const [eq] = tablesOf(docOf(p), 'equipment');
      const sum = (key: string) => eq.rows.reduce((a, r) => a + (Number(r.cells[key]) || 0), 0);
      assert.deepEqual(spEquipmentSplit(p), { band: sum('band'), venue: sum('venue'), other: sum('other'), tbc: sum('tbc') }, t);
    }
    // review 2: a hand-built plot with a microphone, a stand, a DI channel with no device and a wedge, all to be confirmed
    const p = spEdit(four(), (d) => {
      for (const i of d.inputs) if (i.label === 'Bass DI') i.diDeviceId = null;
    });
    const before = spEquipmentSplit(four());
    const after = spEquipmentSplit(p);
    assert.equal(after.band + after.venue + after.other + after.tbc, before.band + before.venue + before.other + before.tbc + 1, 'the DI channel with no device is counted');
    const area = srcOf('screens/lab/stageplot/ExportArea.tsx');
    assert.match(area, /const split = spEquipmentSplit\(project, summary\);/);
    assert.match(area, /`Equipment to be confirmed: \$\{plural\(split\.tbc, 'item'\)\}\.`/);
    assert.match(area, /plural\(summary\.open\.length, 'open detail is', 'open details are'\)\} printed as unresolved\./);
    assert.ok(!/asked of|Asked of|in its own rig|Items to be confirmed/.test(area));
    assert.match(area, /requested from the house console/);
  });
  it('the EMAIL fields show all of their text: the subject two lines, the message as tall as what is in it', () => {
    const area = srcOf('screens/lab/stageplot/ExportArea.tsx');
    assert.match(area, /<MailField label="Subject" value=\{message\.subject\} minHeight=\{66\} oneParagraph /);
    assert.match(area, /<MailField label="Message" value=\{message\.body\} minHeight=\{150\} /);
    const field = srcOf('screens/lab/stageplot/export/MailField.tsx');
    assert.match(field, /const height = Math\.max\(p\.minHeight, Math\.ceil\(boxH\)\);/);
    // the height comes from a hidden copy of the text, never from the input's own content-size
    // event: in a browser that event already holds the height we set, and the field grew without
    // end until React stopped the Export screen (seen in the web preview, 2026-11-12)
    assert.ok(!/onContentSizeChange=/.test(field), 'the field does not size itself from its own content-size event');
    assert.match(field, /styles\.mirror/);
    assert.match(field, /Math\.abs\(was - h\) > 0\.5 \? h : was/, 'only a real change of height is stored');
    assert.match(field, /scrollEnabled=\{false\}/, 'no scroll bar of its own');
    assert.match(field, /accessibilityLabel=/);
    assert.ok(!/Alert\.alert/.test(field));
  });
});

describe('the packet files are pure', () => {
  const read = (f: string) => readFileSync(new URL(`../src/features/stageplot/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  it('no React, no native module, explicit .ts imports', () => {
    for (const f of ['spPacket.ts', 'spPacketHtml.ts']) {
      const src = read(f);
      const from = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
      assert.ok(from.length > 0);
      for (const spec of from) assert.match(spec, /^\.\/sp[A-Za-z]+\.ts$/, `${f} imports ${spec}`);
      assert.ok(!/Date\.now\(\)/.test(src), `${f} reads the clock: the caller passes the time`);
    }
  });
  it('the plot sizes the PDF writer mirrors are the ones exported here', () => {
    const src = read('spPacket.ts');
    for (const line of ['export const SP_PLOT_NOMINAL_W = 510;', 'export const SP_PLOT_SIDE = 16;', 'export const SP_PLOT_MAX_H = 380;', 'export const SP_PLOT_SMALL_H = 240;', 'export const SP_PLOT_SMALL_PEOPLE = 2;']) assert.ok(src.includes(line), line);
    for (const name of ['spLabelBlock', 'spPlotScale', 'spTextW', 'spBadgeW', 'SP_PLOT_TYPE']) assert.match(src, new RegExp(`^export (function|const) ${name}\\b`, 'm'), `${name} is still exported`);
  });
});
