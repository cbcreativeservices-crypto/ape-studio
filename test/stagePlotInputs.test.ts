/**
 * Stage Plot and Channel Designer — the INPUTS area (must-do D60).
 *
 * What the area decides is in one pure file
 * (src/screens/lab/stageplot/inputs/inputsLogic.ts); these tests hold it to
 * the owner's handoff against the worked example (§11, the four-piece band):
 * a package is seen before it is added and never adds half a stereo pair, a
 * typed list of reserved channels is read the way a person writes it, a move
 * keeps the band's numbers and every link, and the equipment summary counts
 * each thing once.
 *
 * The last block pins the screen files to the house rules a node test can
 * read from source (accessibility, no cut-off values, the monitor-only mark).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { SCREEN_GUIDE_BUDGET, SCREEN_GUIDE_SECTIONS, SCREEN_INTRO_WORDS } from '../src/features/lab/screenGuide/types.ts';
import { SP_PACKAGES, spPackage } from '../src/features/stageplot/spCatalog.ts';
import { spBadge, spDiTotals, spPatchRows, spSummary } from '../src/features/stageplot/spDerive.ts';
import {
  spAddDiDevice,
  spAddExtra,
  spAddPackage,
  spAddSource,
  spBrokenRefs,
  spFreeze,
  spPartner,
  spPatch,
  spRemoveInput,
  spRenumber,
  spSetNumber,
  spSetReserved,
  spSetVenueChannel,
  spStereoToMono,
  spUpdateDevice,
  spUpdateDiDevice,
  spUpdateInput,
} from '../src/features/stageplot/spModel.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import { SP_GUIDE_INPUTS } from '../src/screens/lab/stageplot/guides/inputs.ts';
import {
  SP_CUE_HINT,
  SP_EXTRAS_HINT,
  SP_EXTRA_HINT,
  SP_MAX_CHANNEL,
  SP_PHANTOM_HINT,
  SP_NOBODY,
  SP_TBC_PRINTED,
  spCanMove,
  spDiChannelRows,
  spDiDeviceLine,
  spDiToggle,
  spEquipmentGroups,
  spInputQuestions,
  spMonoChoice,
  spMoveRow,
  spBringsWord,
  spBroughtBy,
  spBrokenPairDi,
  spListWords,
  spOpenIssues,
  spOpenLine,
  spPairMonoWithDi,
  spPeopleOptions,
  spSameNumber,
  spSourceOptions,
  spPackageAllTicked,
  spPackagePartner,
  spPackagePreview,
  spPackageToggle,
  spParseReserved,
  spReservedText,
  spResponsibility,
  spRowBlocks,
  spSharedNotice,
  spSourcesWithoutInputs,
  spSummaryCounts,
  spUniqueLabel,
  spWhoBrings,
  spWirelessNote,
} from '../src/screens/lab/stageplot/inputs/inputsLogic.ts';

const NOW = 1_800_000_000_000;
const four = (): SpProject => spFromTemplate('four-piece', { id: 'p-four', now: NOW, band: 'The Example Four' });
const list = (p: SpProject, patch: 'house' | 'band' = 'house') => spPatchRows(p, patch).map((r) => `${r.number ?? '-'} ${r.input.label}`);
const idOf = (p: SpProject, label: string): string => {
  const i = p.inputs.find((x) => x.label === label);
  assert.ok(i, `the example has an input called ${label}`);
  return i.id;
};
const pkg = (id: string) => {
  const def = spPackage(id);
  assert.ok(def, `package ${id}`);
  return def;
};

describe('a package is shown before it is added', () => {
  it('every package previews its assumption and one row for each row it would add', () => {
    const blank = spFromTemplate('blank', { id: 'p-blank', now: NOW });
    for (const def of SP_PACKAGES) {
      const v = spPackagePreview(blank, def, spPackageAllTicked(def));
      assert.equal(v.assumes, def.assumes);
      assert.equal(v.rows.length, def.rows.length);
      assert.equal(v.count, def.rows.length);
      assert.ok(v.rows.every((r) => r.ticked));
      // the preview and the model agree on what is added
      const added = spAddPackage(blank, def, { rows: v.picked, sourceLabel: v.sourceLabel });
      assert.deepEqual(
        added.p.inputs.map((i) => i.label),
        v.rows.map((r) => r.label),
        def.id,
      );
      assert.equal(spPatchRows(added.p, 'house').length, v.count, def.id);
    }
  });

  it('says how many input channels the ticked rows add, and asks for a tick when none is', () => {
    const p = four();
    const six = pkg('drums-six');
    assert.equal(spPackagePreview(p, six, spPackageAllTicked(six)).adds, 'Adds 6 inputs.');
    const one = pkg('vocal');
    assert.equal(spPackagePreview(p, one, [true]).adds, 'Adds 1 input.');
    const none = spPackagePreview(p, one, [false]);
    assert.equal(none.count, 0);
    assert.match(none.adds, /Tick at least one row/);
    assert.deepEqual(none.picked, []);
  });

  it('the two sides of a stereo pair are ticked and unticked together', () => {
    const six = pkg('drums-six');
    const L = six.rows.findIndex((r) => r.label === 'Overhead L');
    const R = six.rows.findIndex((r) => r.label === 'Overhead R');
    assert.equal(spPackagePartner(six, L), R);
    assert.equal(spPackagePartner(six, R), L);
    assert.equal(spPackagePartner(six, 0), null);
    let ticked = spPackageToggle(six, spPackageAllTicked(six), R);
    assert.equal(ticked[L], false);
    assert.equal(ticked[R], false);
    assert.deepEqual(
      spPackagePreview(four(), six, ticked).picked.map((r) => r.side ?? '-'),
      ['-', '-', '-', '-'],
    );
    ticked = spPackageToggle(six, ticked, L);
    assert.equal(ticked[L] && ticked[R], true);
    // a tick list that names one side only still adds no half pair
    const half = six.rows.map((_, k) => k !== R);
    const v = spPackagePreview(four(), six, half);
    assert.equal(v.rows[L].ticked, false);
    const added = spAddPackage(four(), six, { rows: v.picked });
    assert.equal(spReview(added.p).filter((i) => i.rule === 'pair-broken').length, 0);
  });

  it('unticking a row leaves it out, and the rest are ordinary rows', () => {
    const p = four();
    const six = pkg('drums-six');
    const ticked = spPackageToggle(six, spPackageAllTicked(six), 3); // Floor tom
    const v = spPackagePreview(p, six, ticked, {});
    assert.equal(v.count, 5);
    const added = spAddPackage(p, six, { rows: v.picked, sourceLabel: v.sourceLabel });
    assert.equal(added.inputIds.length, 5);
    assert.equal(spSummary(added.p).house.channels, 19);
    assert.deepEqual(spBrokenRefs(added.p), []);
  });

  it('a row gets a label nobody else has, and the stereo side stays the last word', () => {
    const p = four();
    const nina = p.performers.find((x) => x.name === 'Nina');
    assert.ok(nina);
    const keys = pkg('keys-stereo');
    const v = spPackagePreview(p, keys, spPackageAllTicked(keys), { performerId: nina.id });
    assert.deepEqual(
      v.rows.map((r) => r.label),
      ['Keys (Nina) L', 'Keys (Nina) R'],
    );
    assert.equal(v.sourceLabel, 'Keys (Nina)');
    // with nobody chosen, a number does the same job
    assert.deepEqual(
      spPackagePreview(p, keys, spPackageAllTicked(keys)).rows.map((r) => r.label),
      ['Keys 2 L', 'Keys 2 R'],
    );
    assert.equal(spUniqueLabel(['Vocal', 'Vocal (Sam)'], 'Vocal', 'Sam'), 'Vocal 2');
    assert.equal(spUniqueLabel(['Kick'], 'Snare'), 'Snare');
    // a click row says MONITOR ONLY before it is added
    const click = pkg('click');
    assert.equal(spPackagePreview(p, click, [true]).rows[0].monitorOnly, true);
  });

  it('a row shows everything it would set, the connector too, so nothing is assumed out of sight', () => {
    const blank = spFromTemplate('blank', { id: 'p-blank', now: NOW });
    for (const def of SP_PACKAGES) {
      const v = spPackagePreview(blank, def, spPackageAllTicked(def));
      def.rows.forEach((row, k) => {
        const shown = v.rows[k];
        assert.equal(shown.connector, (row.connector ?? '').trim(), `${def.id}: ${row.label}`);
        if (row.connector) assert.ok(shown.how.endsWith(`${row.connector} connector`), `${def.id}: ${row.label} shows its connector`);
        else assert.ok(!/connector/.test(shown.how), `${def.id}: ${row.label} sets no connector and says none`);
        // what is shown is what is added
        const added = spAddPackage(blank, def, { rows: v.picked }).p.inputs[k];
        assert.equal(added.connector, shown.connector, `${def.id}: ${row.label}`);
      });
    }
    const vocal = spPackagePreview(blank, pkg('vocal'), [true]).rows[0];
    assert.equal(vocal.how, 'Microphone · Dynamic vocal microphone · Tall boom stand · XLR connector');
    // a line output presets no connector: a 1/4 inch plug is as likely as an XLR
    assert.equal(spPackagePreview(blank, pkg('click'), [true]).rows[0].connector, '');
  });

  it('rows added to a source that exists keep that source and its name', () => {
    let p = four();
    const made = spAddSource(p, { label: 'Second guitar', category: 'guitars' });
    p = made.p;
    const cab = pkg('guitar-cab');
    const v = spPackagePreview(p, cab, [true], { sourceId: made.id });
    assert.equal(v.sourceLabel, 'Second guitar');
    assert.equal(v.rows[0].label, 'Guitar cabinet 2');
    const added = spAddPackage(p, cab, { sourceId: made.id, rows: v.picked });
    assert.equal(added.sourceId, made.id);
    assert.equal(added.p.sources.length, p.sources.length);
  });
});

describe('reserved channels, as a person types them', () => {
  it('reads single numbers, ranges and the words people use', () => {
    assert.deepEqual(spParseReserved('15, 16').numbers, [15, 16]);
    assert.deepEqual(spParseReserved('7; 20-22').numbers, [7, 20, 21, 22]);
    assert.deepEqual(spParseReserved('20 – 22 and 7').numbers, [7, 20, 21, 22]);
    assert.deepEqual(spParseReserved('22 to 20').numbers, [20, 21, 22]);
    assert.deepEqual(spParseReserved('ch 5, CH6, #7').numbers, [5, 6, 7]);
    assert.deepEqual(spParseReserved('  ').numbers, []);
    assert.deepEqual(spParseReserved('3 3 3').numbers, [3]);
  });
  it('hands back what it did not understand, and never invents a channel', () => {
    const r = spParseReserved('5, six, 0, 7.5, 9999, 12');
    assert.deepEqual(r.numbers, [5, 12]);
    assert.deepEqual(r.rejected, ['six', '0', '7.5', '9999']);
    assert.deepEqual(spParseReserved(`1-${SP_MAX_CHANNEL + 1}`).numbers, []);
  });
  it('prints them back so the same text reads to the same channels', () => {
    assert.equal(spReservedText([24, 7, 15, 16, 20, 21, 22, 23]), '7, 15–16, 20–24');
    assert.equal(spReservedText([]), '');
    assert.deepEqual(spParseReserved(spReservedText([7, 15, 16, 20, 21, 22])).numbers, [7, 15, 16, 20, 21, 22]);
  });
  it('a reserved channel is skipped by Renumber, and kept by a move', () => {
    let p = spSetReserved(four(), 'house', spParseReserved('7').numbers);
    p = spRenumber(p, 'house', { keepReserved: true });
    assert.equal(list(p)[6], '8 Bass DI');
    assert.equal(list(p)[13], '15 Click');
    p = spMoveRow(p, 'house', idOf(p, 'Guitar cabinet'), -1);
    assert.deepEqual(list(p).slice(4, 9), ['5 Overhead L', '6 Overhead R', '8 Guitar cabinet', '9 Bass DI', '10 Keys L']);
    assert.ok(!spPatchRows(p, 'house').some((r) => r.number === 7), 'channel 7 stays free');
  });
});

describe('the list, row by row', () => {
  it('is the worked example: fourteen rows in the proposed order', () => {
    const blocks = spRowBlocks(four(), 'house');
    const rows = blocks.flatMap((b) => b.rows);
    assert.deepEqual(
      rows.map((r) => `${r.number} ${r.label}`),
      ['1 Kick', '2 Snare', '3 Rack tom', '4 Floor tom', '5 Overhead L', '6 Overhead R', '7 Bass DI', '8 Guitar cabinet', '9 Keys L', '10 Keys R', '11 Lead vocal', '12 Leo vocal', '13 Nina vocal', '14 Click'],
    );
    assert.equal(blocks.length, 12, 'the two stereo pairs are one block each');
  });

  it('every example band: the blocks are the patch, row for row, in each system', () => {
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `p-${t.id}`, now: NOW });
      for (const patch of p.patches) {
        const blocks = spRowBlocks(p, patch.id);
        assert.deepEqual(
          blocks.flatMap((b) => b.rows.map((r) => r.id)),
          patch.order,
          `${t.id} ${patch.id}`,
        );
        for (const b of blocks) {
          assert.equal(b.pair, b.rows.length === 2, `${t.id}: a block of two is a pair`);
          if (b.pair) assert.deepEqual(b.rows.map((r) => r.side), ['L', 'R'], `${t.id}: left above right`);
          for (const r of b.rows) assert.ok(r.label && r.who && r.where && r.capture && r.stand && r.supplier && r.a11y, `${t.id}: ${r.label} is complete`);
        }
        if (blocks.length) {
          assert.equal(blocks[0].canUp, false);
          assert.equal(blocks[blocks.length - 1].canDown, false);
        }
      }
      // every block of "who brings what" exists, and each supplier appears once
      assert.deepEqual(
        spResponsibility(p).map((r) => r.supplier),
        ['band', 'venue', 'other', 'tbc'],
      );
    }
    assert.deepEqual(spRowBlocks(spFromTemplate('blank', { id: 'p-b', now: NOW }), 'band'), []);
  });

  it('a row says number, label, performer, place, capture and stand at one glance', () => {
    const rows = spRowBlocks(four(), 'house').flatMap((b) => b.rows);
    const oh = rows[4];
    assert.equal(oh.side, 'L');
    assert.equal(oh.partnerLabel, 'Overhead R');
    assert.equal(oh.who, 'Drum kit · Maya');
    assert.equal(oh.where, 'Upstage center');
    assert.equal(oh.capture, 'Microphone · Condenser microphone');
    assert.equal(oh.stand, 'Tall boom stand');
    assert.equal(oh.supplier, 'Venue brings it');
    assert.equal(oh.monitorOnly, false);
    // a source named like its input is not said twice; a DI is not "DI · DI"
    assert.equal(rows[10].who, 'Sam');
    assert.equal(rows[6].capture, 'DI');
    assert.equal(rows[6].stand, 'No stand');
    // the same words for a screen reader, the dot marks read as pauses
    for (const r of rows) for (const part of [r.label, r.who, r.where, r.capture, r.stand]) assert.ok(r.a11y.includes(part.replace(/ · /g, ', ')), `${r.label}: the screen reader hears "${part}"`);
    assert.equal(oh.a11y, 'Channel 5. Overhead L, left side of a stereo pair with Overhead R. Drum kit, Maya. Upstage center. Microphone, Condenser microphone. Tall boom stand. Venue brings it. Audience mix.');
  });

  it('the click is the one MONITOR ONLY row; thirteen go to the audience mix', () => {
    const rows = spRowBlocks(four(), 'house').flatMap((b) => b.rows);
    assert.deepEqual(
      rows.filter((r) => r.monitorOnly).map((r) => r.label),
      ['Click'],
    );
    assert.match(rows[13].a11y, /Monitor only: kept out of the audience mix/);
    assert.equal(rows.filter((r) => !r.monitorOnly && !r.audienceTbc).length, 13);
    // sending a click to the audience is shown on the row, not hidden
    const p = spUpdateInput(four(), idOf(four(), 'Click'), { audience: 'audience' });
    const click = spRowBlocks(p, 'house').flatMap((b) => b.rows)[13];
    assert.equal(click.cueToAudience, true);
    assert.equal(click.monitorOnly, false);
  });

  it('an input that is not on the stage says so, and a typed venue channel is shown apart from the number', () => {
    let p = four();
    const made = spAddPackage(p, 'horn-mic', {});
    p = spSetVenueChannel(made.p, 'house', made.inputIds[0], 'SB-A 4');
    const row = spRowBlocks(p, 'house').flatMap((b) => b.rows)[14];
    assert.equal(row.where, 'Not on the stage yet');
    assert.equal(row.placed, false);
    assert.equal(row.number, '15');
    assert.equal(row.venue, 'SB-A 4');
    assert.equal(row.who, 'Nobody (shared source)');
    assert.equal(row.supplier, 'Who brings it: to be confirmed');
    p = spSetNumber(p, 'house', made.inputIds[0], null);
    assert.equal(spRowBlocks(p, 'house').flatMap((b) => b.rows)[14].number, '—');
  });

  it('one side of a pair left alone is marked, and both review answers apply to it', () => {
    const p = spRemoveInput(four(), idOf(four(), 'Keys R'));
    const blocks = spRowBlocks(p, 'house');
    const keysL = blocks.flatMap((b) => b.rows).find((r) => r.label === 'Keys L');
    assert.ok(keysL);
    assert.equal(keysL.pairBroken, true);
    assert.equal(keysL.partnerLabel, '');
    assert.match(keysL.a11y, /the other side is missing/);
    const q = spInputQuestions(spReview(p)).find((i) => i.rule === 'pair-broken');
    assert.ok(q);
    assert.deepEqual(q.actions, ['pair-restore', 'pair-mono']);
  });
});

describe('moving a row', () => {
  it('the first row cannot go up and the last cannot go down', () => {
    const p = four();
    assert.deepEqual(spCanMove(p, 'house', idOf(p, 'Kick')), { up: false, down: true });
    assert.deepEqual(spCanMove(p, 'house', idOf(p, 'Click')), { up: true, down: false });
    assert.equal(spMoveRow(p, 'house', idOf(p, 'Kick'), -1), p, 'nothing moved: the same project, no new revision');
    assert.equal(spMoveRow(p, 'house', 'no-such-input', 1), p);
    const blocks = spRowBlocks(p, 'house');
    assert.equal(blocks[0].canUp, false);
    assert.equal(blocks[blocks.length - 1].canDown, false);
  });

  it('a stereo pair moves as one, from either side', () => {
    const p = four();
    const fromR = spMoveRow(p, 'house', idOf(p, 'Overhead R'), -1);
    assert.deepEqual(list(fromR).slice(2, 6), ['3 Rack tom', '4 Overhead L', '5 Overhead R', '6 Floor tom']);
    const fromL = spMoveRow(p, 'house', idOf(p, 'Overhead L'), -1);
    assert.deepEqual(list(fromL), list(fromR));
    // a single row steps over the whole pair
    const bass = spMoveRow(p, 'house', idOf(p, 'Bass DI'), -1);
    assert.deepEqual(list(bass).slice(4, 7), ['5 Bass DI', '6 Overhead L', '7 Overhead R']);
    const block = spRowBlocks(p, 'house').find((b) => b.pair);
    assert.ok(block);
    assert.equal(block.moves, 'the stereo pair Overhead L and Overhead R');
  });

  it('badges, the stereo link, the monitor references and the venue channel stay with their source', () => {
    let p = four();
    const click = idOf(p, 'Click');
    const lead = idOf(p, 'Lead vocal');
    p = spSetVenueChannel(p, 'house', lead, 'CH 21');
    const needs = JSON.stringify(p.mixes.map((m) => m.needs));
    for (let k = 0; k < 13; k += 1) p = spMoveRow(p, 'house', click, -1);
    assert.equal(list(p)[0], '1 Click');
    assert.equal(spBadge(p, click), '1');
    assert.equal(spBadge(p, lead), '12');
    assert.equal(spPatch(p, 'house')?.venue[lead], 'CH 21');
    assert.equal(JSON.stringify(p.mixes.map((m) => m.needs)), needs, 'each mix still names the same inputs');
    const keysL = p.inputs.find((i) => i.label === 'Keys L');
    assert.ok(keysL);
    assert.equal(spPartner(p, keysL)?.label, 'Keys R');
    assert.deepEqual(spBrokenRefs(p), []);
    assert.equal(spSummary(p).house.channels, 14);
  });

  it('the numbers stay where they were in the list, so a deliberate gap survives', () => {
    let p = four();
    p = spSetNumber(p, 'house', idOf(p, 'Lead vocal'), 17);
    p = spSetNumber(p, 'house', idOf(p, 'Leo vocal'), 18);
    p = spSetNumber(p, 'house', idOf(p, 'Nina vocal'), 19);
    p = spSetNumber(p, 'house', idOf(p, 'Click'), 24);
    p = spMoveRow(p, 'house', idOf(p, 'Nina vocal'), -1);
    assert.deepEqual(list(p).slice(9), ['10 Keys R', '17 Lead vocal', '18 Nina vocal', '19 Leo vocal', '24 Click']);
    assert.equal(spReview(p).filter((i) => i.rule === 'duplicate-channel').length, 0);
  });

  it('the same number in the house list and the band list is not a clash, and each list moves alone', () => {
    let p = four();
    const click = idOf(p, 'Click');
    p = spUpdateInput(p, click, { destination: 'both' });
    p = spUpdateInput(p, idOf(p, 'Kick'), { destination: 'both' });
    assert.deepEqual(list(p, 'band'), ['1 Click', '2 Kick']);
    assert.equal(spReview(p).filter((i) => i.rule === 'duplicate-channel').length, 0);
    const moved = spMoveRow(p, 'band', click, 1);
    assert.deepEqual(list(moved, 'band'), ['1 Kick', '2 Click']);
    assert.deepEqual(list(moved), list(p), 'the house list did not move');
    // a clash inside ONE list is a correction
    const clash = spSetNumber(p, 'house', click, 1);
    assert.equal(spInputQuestions(spReview(clash)).filter((i) => i.rule === 'duplicate-channel').length, 1);
  });

  it('a document that was shared says its revision moves on, before the order changes', () => {
    const p = four();
    assert.equal(spSharedNotice(p), null);
    const shared = spFreeze(p);
    const words = spSharedNotice(shared);
    assert.ok(words);
    assert.equal(words, 'Revision 1 was marked ready or shared. A change to the order or to a channel number starts revision 2, and the packet then shows the new revision number.');
    assert.ok(!/already shared|was shared\b/.test(words), 'the tool cannot know it was sent');
    assert.match(words, /starts revision 2/);
    const moved = spMoveRow(shared, 'house', idOf(shared, 'Bass DI'), -1);
    assert.equal(moved.revision, 2);
    assert.equal(spSharedNotice(moved), null);
    // a move that cannot happen does not start a revision
    assert.equal(spMoveRow(shared, 'house', idOf(shared, 'Kick'), -1).revision, 1);
  });
});

describe('stereo to mono is a choice that is stated first', () => {
  it('names both sides, the DI device in question, and what the list loses', () => {
    const p = four();
    const keysL = p.inputs.find((i) => i.label === 'Keys L');
    assert.ok(keysL?.pairId);
    const c = spMonoChoice(p, keysL.pairId);
    assert.ok(c);
    assert.deepEqual(c.sides, [
      { side: 'L', label: 'Keys L' },
      { side: 'R', label: 'Keys R' },
    ]);
    assert.equal(c.di?.label, 'Keys stereo DI');
    assert.equal(c.di?.channels, 2);
    assert.equal(c.monoLabel('R'), 'Keys');
    assert.match(c.says, /one input fewer, and one DI channel fewer/);
    // the handoff's own case: one keys input and one DI channel go; the
    // stereo DI device stays or goes by the band's answer
    const kept = spStereoToMono(p, keysL.pairId, { keep: 'L', di: 'keep' });
    assert.equal(spSummary(kept).house.channels, 13);
    assert.equal(spDiTotals(kept).channels, 2);
    assert.equal(spDiTotals(kept).devices, 2);
    const released = spStereoToMono(p, keysL.pairId, { keep: 'L', di: 'release' });
    assert.equal(spDiTotals(released).devices, 1);
    assert.equal(spDiTotals(released).unassignedChannels, 1);
    // overheads have no DI device to ask about
    const oh = p.inputs.find((i) => i.label === 'Overhead L');
    assert.ok(oh?.pairId);
    assert.equal(spMonoChoice(p, oh.pairId)?.di, null);
    assert.equal(spMonoChoice(spRemoveInput(p, idOf(p, 'Keys R')), keysL.pairId), null, 'a pair with one side left is a review question instead');
  });

  it('one side left on a stereo DI device: the same question, from the row and from the review answer', () => {
    const p = spRemoveInput(four(), idOf(four(), 'Keys R'));
    const left = idOf(p, 'Keys L');
    // the review offers "make it a mono request"; the device is still to be decided
    assert.ok(spInputQuestions(spReview(p)).some((i) => i.rule === 'pair-broken' && i.target.id === left && i.actions.includes('pair-mono')));
    assert.equal(spBrokenPairDi(p, left)?.label, 'Keys stereo DI');
    // keep: the stereo device stays, carrying the one channel
    const kept = spPairMonoWithDi(p, left, 'keep');
    assert.equal(kept.inputs.find((i) => i.id === left)?.label, 'Keys');
    assert.equal(kept.inputs.find((i) => i.id === left)?.pairId, null);
    assert.equal(spDiTotals(kept).devices, 2);
    assert.equal(spDiTotals(kept).unassignedChannels, 0);
    // take it off: nothing else uses the device, so it leaves the list
    const released = spPairMonoWithDi(p, left, 'release');
    assert.equal(spDiTotals(released).devices, 1);
    assert.equal(spDiTotals(released).unassignedChannels, 1);
    assert.equal(spReview(released).filter((i) => i.rule === 'pair-broken' || i.rule === 'di-unused').length, 0);
    assert.deepEqual(spBrokenRefs(released), []);
    // nothing to ask: a complete pair, a microphone pair, a side on a mono device
    assert.equal(spBrokenPairDi(four(), idOf(four(), 'Keys L')), null);
    assert.equal(spBrokenPairDi(spRemoveInput(four(), idOf(four(), 'Overhead R')), idOf(four(), 'Overhead L')), null);
    assert.equal(spBrokenPairDi(four(), idOf(four(), 'Bass DI')), null);
  });
});

describe('DI channels and DI devices are separate', () => {
  it('the example: three DI channels on two devices, each device saying what it carries', () => {
    const p = four();
    const t = spDiTotals(p);
    assert.equal(t.channels, 3);
    assert.equal(t.devices, 2);
    const [bass, keys] = p.diDevices;
    assert.equal(spDiDeviceLine(p, bass), 'Mono: 1 channel · Passive · Band brings it · Carries Bass DI');
    assert.equal(spDiDeviceLine(p, keys), 'Stereo: 2 channels · Passive or active: to be confirmed · Venue brings it · Carries Keys L and Keys R');
  });

  it('a device sees every DI channel: on it, on another device, or still to confirm', () => {
    let p = four();
    const [bass, keys] = p.diDevices;
    assert.deepEqual(
      spDiChannelRows(p, bass.id).map((r) => `${r.label}:${r.on ? 'on' : r.elsewhere || 'free'}`),
      ['Bass DI:on', 'Keys L:Keys stereo DI', 'Keys R:Keys stereo DI'],
    );
    // taking the bass off its box leaves a channel "to confirm", not a guess
    p = spDiToggle(p, bass.id, idOf(p, 'Bass DI'));
    assert.equal(spDiTotals(p).unassignedChannels, 1);
    assert.match(spDiDeviceLine(p, p.diDevices[0]), /No channel on it yet/);
    // putting it on the stereo box asks one box for three channels: said, not hidden
    p = spDiToggle(p, keys.id, idOf(p, 'Bass DI'));
    assert.deepEqual(spDiTotals(p).overloaded, [{ label: 'Keys stereo DI', channels: 2, used: 3 }]);
    assert.ok(spEquipmentGroups(p).find((g) => g.id === 'di')?.lines.includes('Keys stereo DI has 2 channels and is asked to carry 3.'));
    assert.equal(spDiToggle(p, keys.id, idOf(p, 'Kick')), p, 'a microphone input is never put on a DI device');
  });

  it('three DI channels with no device chosen never claims three boxes', () => {
    let p = spFromTemplate('blank', { id: 'p-di', now: NOW });
    p = spAddPackage(p, 'bass-di').p;
    p = spAddPackage(p, 'keys-stereo').p;
    assert.equal(spDiTotals(p).unassignedChannels, 3);
    const tbc = spResponsibility(p).find((r) => r.supplier === 'tbc');
    assert.ok(tbc?.lines.includes('3 × DI channel with no DI device (DI box) yet (Bass DI, Keys L, Keys R)'));
    assert.equal(spSummaryCounts(p).find((c) => /DI device/.test(c.label)), undefined, 'no DI device: no tile, never a zero');
    assert.equal(spSummaryCounts(p).find((c) => /DI channel/.test(c.label))?.value, 3);
  });
});

describe('the equipment and responsibility summary', () => {
  it('the headline counts are the worked example’s totals', () => {
    const counts = Object.fromEntries(spSummaryCounts(four()).map((c) => [c.label, c.value]));
    assert.deepEqual(counts, {
      'inputs to the house system': 14,
      'for the audience mix': 13,
      'monitor only': 1,
      microphones: 10,
      'DI channels': 3,
      'DI devices': 2,
    });
  });

  it('channels by destination and type, microphones by name, stands, and DI', () => {
    const g = Object.fromEntries(spEquipmentGroups(four()).map((x) => [x.id, x.lines]));
    assert.deepEqual(g.channels, ['House system: 14 inputs. 13 for the audience mix, 1 monitor only (Click).', 'House system by group: Drums 6, Bass 1, Guitars 1, Keys 2, Playback 1, Vocals 3.']);
    assert.equal(g.microphones[0], '10 microphones in all. A model you typed is a preference unless you marked it Required.');
    assert.deepEqual(g.microphones.slice(1), ['4 × Dynamic instrument microphone — venue', '3 × Dynamic vocal microphone — venue', '2 × Condenser microphone — venue', '1 × Kick drum microphone — venue']);
    assert.deepEqual(g.stands, ['3 × Short boom stand — venue', '2 × Clamp — venue', '5 × Tall boom stand — venue']);
    assert.deepEqual(g.lines, ['1 × Direct balanced line (Click) — band']);
    assert.deepEqual(g.di, [spDiTotals(four()).summary, '2 DI devices. The band brings 1 and the venue brings 1.']);
    assert.equal(g.wireless, undefined);
  });

  it('a required microphone is marked, and an alternative is never extra equipment', () => {
    let p = four();
    const lead = idOf(p, 'Lead vocal');
    p = spUpdateInput(p, lead, { equipment: 'My own vocal microphone', priority: 'required', supplier: 'band', alternatives: 'Any dynamic vocal microphone' });
    const mics = spEquipmentGroups(p).find((x) => x.id === 'microphones')?.lines ?? [];
    assert.ok(mics.includes('1 × My own vocal microphone — band. Required: 1'));
    assert.ok(mics.includes('Acceptable instead of My own vocal microphone: Any dynamic vocal microphone. Not counted as extra equipment.'));
    assert.equal(spSummary(p).microphones, 10, 'still ten microphones');
    const band = spResponsibility(p).find((r) => r.supplier === 'band');
    assert.ok(band?.lines.includes('1 × My own vocal microphone'));
  });

  it('who brings what: band, venue, other provider and to be confirmed, each thing once', () => {
    const by = Object.fromEntries(spResponsibility(four()).map((r) => [r.supplier, r.lines]));
    assert.deepEqual(by.band, [
      '1 × Direct balanced line (Click)',
      '1 × Bass DI (mono DI device)',
      '1 × Wireless in-ear transmitter',
      '1 × In-ear receiver pack',
      '1 × Wired headphone amplifier',
      '1 × Drum kit, bass amplifier, guitar amplifier, keyboard (backline)',
    ]);
    assert.deepEqual(by.venue, [
      '4 × Dynamic instrument microphone',
      '3 × Dynamic vocal microphone',
      '2 × Condenser microphone',
      '1 × Kick drum microphone',
      '3 × Short boom stand',
      '2 × Clamp',
      '5 × Tall boom stand',
      '1 × Keys stereo DI (stereo DI device)',
      '2 × Wedge',
    ]);
    // every line of every block starts the same way: a quantity, ×, the thing
    for (const block of spResponsibility(four())) for (const line of block.lines) assert.match(line, /^\d+ × \S/, line);
    assert.deepEqual(by.other, []);
    // the riser drawn on the example's stage is listed, and nobody has said who brings it
    assert.deepEqual(by.tbc, ['1 × Drum riser (riser)']);
    // a DI channel that has a device is the device, never a second line
    const all = spResponsibility(four()).flatMap((r) => r.lines);
    assert.equal(all.filter((l) => /DI/.test(l)).length, 2);
  });

  it('who brings a DI channel has ONE answer: the device, in the row, the summary and the blocks', () => {
    // the review's own case: both keys channels say Band, their device says Venue
    let p = four();
    for (const label of ['Keys L', 'Keys R']) p = spUpdateInput(p, idOf(p, label), { supplier: 'band' });
    const rows = spRowBlocks(p, 'house').flatMap((b) => b.rows);
    for (const label of ['Keys L', 'Keys R']) assert.equal(rows.find((r) => r.label === label)?.supplier, 'Venue brings it', `${label}: the device's answer`);
    const by = Object.fromEntries(spResponsibility(p).map((r) => [r.supplier, r.lines]));
    assert.ok(by.venue.includes('1 × Keys stereo DI (stereo DI device)'));
    assert.equal(by.band.filter((l) => /Keys/.test(l)).length, 0, 'the band is not also listed for the same DI');
    // changing the DEVICE changes every channel on it, and nothing else
    p = spUpdateDiDevice(p, p.diDevices[1].id, { supplier: 'other' });
    assert.equal(spRowBlocks(p, 'house').flatMap((b) => b.rows).find((r) => r.label === 'Keys L')?.supplier, 'Other provider brings it');
    assert.equal(spRowBlocks(p, 'house').flatMap((b) => b.rows).find((r) => r.label === 'Bass DI')?.supplier, 'Band brings it');
    // a DI channel with no device keeps its own answer
    p = spDiToggle(p, p.diDevices[1].id, idOf(p, 'Keys L'));
    assert.equal(spRowBlocks(p, 'house').flatMap((b) => b.rows).find((r) => r.label === 'Keys L')?.supplier, 'Band brings it');
    assert.ok(spResponsibility(p).find((r) => r.supplier === 'band')?.lines.includes('1 × DI channel with no DI device (DI box) yet (Keys L)'));
    assert.equal(spBringsWord('tbc'), 'Who brings it: to be confirmed');
    assert.equal(spListWords(['Keys L', 'Keys R', 'Keys (Jo) L']), 'Keys L, Keys R and Keys (Jo) L');
  });

  it('moving an item to another supplier moves it between blocks, and the totals do not change', () => {
    let p = four();
    p = spUpdateInput(p, idOf(p, 'Kick'), { supplier: 'tbc', standSupplier: 'other' });
    const by = Object.fromEntries(spResponsibility(p).map((r) => [r.supplier, r.lines]));
    assert.ok(by.tbc.includes('1 × Kick drum microphone'));
    assert.ok(by.other.includes('1 × Short boom stand'));
    assert.ok(by.venue.includes('2 × Short boom stand'));
    assert.ok(!by.venue.includes('1 × Kick drum microphone'));
    assert.equal(spSummary(p).microphones, 10);
    const open = spOpenIssues(spReview(p)).here;
    assert.ok(open.some((i) => /Kick: who supplies the microphone/.test(i.text)));
    // listed under its own heading, an open item does not repeat the heading.
    // A microphone the venue does not bring is also asked about phantom power.
    assert.ok(open.map(spOpenLine).some((line) => line.startsWith('Kick: who supplies the microphone')));
    assert.ok(open.map(spOpenLine).every((line) => !/^To be confirmed/.test(line) && !/\.$/.test(line)));
    assert.ok(!open.some((i) => /^To be confirmed — Snare/.test(i.text)), 'the venue is not asked about its own microphone');
  });

  it('every open detail leads to its row: here for inputs, DI devices and listed items; Monitors for the rest', () => {
    let p = four();
    p = spUpdateInput(p, idOf(p, 'Kick'), { supplier: 'tbc' });
    p = spUpdateDiDevice(p, p.diDevices[0].id, { supplier: 'tbc' });
    p = spUpdateDevice(p, p.devices[0].id, { supplier: 'tbc' });
    const open = spOpenIssues(spReview(p));
    assert.deepEqual(
      open.here.map((i) => `${i.target.kind}:${spOpenLine(i).split(':')[0]}`),
      ['input:Kick', 'di:Bass DI', 'extra:Drum riser'],
    );
    for (const i of open.here) assert.match(spOpenLine(i), /who supplies/);
    for (const i of open.here) {
      assert.equal(i.area, 'inputs');
      assert.ok(i.target.id, 'a row to open');
    }
    assert.equal(p.inputs.find((i) => i.id === open.here[0].target.id)?.label, 'Kick');
    assert.equal(p.extras.find((e) => e.id === open.here[2].target.id)?.label, 'Drum riser');
    assert.deepEqual(
      open.elsewhere.map((i) => `${i.area}:${i.target.kind}`),
      ['monitors:device'],
    );
    assert.equal(spInputQuestions(spReview(p)).filter((i) => i.level === 'open').length, 0, 'open details are not shown as questions');
  });

  it('a second system, a source with no connection, a wireless input and a listed item all appear, once', () => {
    let p = four();
    p = spUpdateInput(p, idOf(p, 'Kick'), { destination: 'both' });
    p = spAddSource(p, { label: 'Cajón', category: 'percussion', connection: 'none' }).p;
    p = spAddPackage(p, 'vocal-wireless', {}).p;
    p = spAddExtra(p, { kind: 'split', label: 'Input split', qty: 1, supplier: 'tbc' }).p;
    p = spAddExtra(p, { kind: 'power', label: '', qty: 2, supplier: 'venue' }).p;
    const g = Object.fromEntries(spEquipmentGroups(p).map((x) => [x.id, x.lines]));
    assert.equal(g.channels[0], 'House system: 15 inputs. 14 for the audience mix, 1 monitor only (Click).');
    assert.equal(g.channels[2], 'Band monitor rig: 1 input, shared with the house system through the split.');
    assert.ok(g.channels.includes('An input in both lists is one source that feeds two systems. It is one source, not two.'));
    assert.ok(g.channels.includes('1 source on the stage needs no sound system connection, and is not counted as an input.'));
    assert.deepEqual(g.wireless, ['1 × Wireless handheld microphone and receiver — to be confirmed', '1 wireless receiver output: radio frequency coordination needed.']);
    assert.equal(spWirelessNote(2), '2 wireless receiver outputs: radio frequency coordination needed.');
    assert.ok(!g.wireless.join(' ').match(/MHz|GHz/), 'never a frequency');
    const by = Object.fromEntries(spResponsibility(p).map((r) => [r.supplier, r.lines]));
    assert.ok(by.tbc.includes('1 × Input split (split)'));
    assert.ok(by.venue.includes('2 × Power location'));
    assert.equal(spSummaryCounts(p).find((c) => /band monitor rig/.test(c.label))?.value, 1);
    assert.deepEqual(
      spSourcesWithoutInputs(p).map((s) => `${s.label}: ${s.state}`),
      ['Cajón: No sound system connection needed'],
    );
  });

  it('a source still waiting for its inputs is listed as a question, not as acoustic', () => {
    const p = spAddSource(four(), { label: 'Second guitar', category: 'guitars' }).p;
    const quiet = spSourcesWithoutInputs(p);
    assert.deepEqual(
      quiet.map((s) => [s.label, s.state, s.needsAnswer]),
      [['Second guitar', 'No input yet', true]],
    );
    assert.ok(spInputQuestions(spReview(p)).some((i) => i.rule === 'source-no-input'));
    assert.equal(spSummary(p).house.channels, 14, 'it adds no input channel');
  });

  it('a new DI device changes the device count and nothing else', () => {
    const p = spAddDiDevice(four(), { channels: 1, supplier: 'band' }).p;
    const counts = Object.fromEntries(spSummaryCounts(p).map((c) => [c.label, c.value]));
    assert.equal(counts['DI devices'], 3);
    assert.equal(counts['DI channels'], 3);
    assert.equal(counts['inputs to the house system'], 14);
  });

  it('horns are their own type, counted and sorted after keys', () => {
    const salsa = spFromTemplate('salsa', { id: 'p-salsa', now: NOW });
    const line = spEquipmentGroups(salsa).find((x) => x.id === 'channels')?.lines[1] ?? '';
    assert.match(line, /Keys \d+, Horns 4,/);
    assert.ok(!/Other sources/.test(line), 'a horn section is not "other"');
  });

  it('two inputs with one number in one list both say so, and name each other', () => {
    let p = four();
    const kick = idOf(p, 'Kick');
    const snare = idOf(p, 'Snare');
    assert.deepEqual(spSameNumber(p, 'house', kick), []);
    p = spSetNumber(p, 'house', snare, 1);
    assert.deepEqual(spSameNumber(p, 'house', kick), ['Snare']);
    assert.deepEqual(spSameNumber(p, 'house', snare), ['Kick']);
    const rows = spRowBlocks(p, 'house').flatMap((b) => b.rows);
    assert.deepEqual(
      rows.filter((r) => r.sameNumberAs.length).map((r) => r.label),
      ['Kick', 'Snare'],
    );
    assert.match(rows[0].a11y, /Same number as Snare: each needs its own number/);
    // the same number in the OTHER system's list is not a clash
    p = spSetNumber(p, 'house', snare, 2);
    p = spUpdateInput(p, idOf(p, 'Click'), { destination: 'both' });
    assert.equal(spPatch(p, 'band')?.numbers[idOf(p, 'Click')], 1);
    assert.deepEqual(spSameNumber(p, 'house', kick), []);
    assert.deepEqual(spSameNumber(p, 'band', idOf(p, 'Click')), []);
    assert.equal(spRowBlocks(p, 'band').flatMap((b) => b.rows)[0].sameNumberAs.length, 0);
  });

  it('a click sent to the audience on purpose is a question once, then a fact on the row', () => {
    let p = spUpdateInput(four(), idOf(four(), 'Click'), { audience: 'audience' });
    const click = idOf(p, 'Click');
    const row = () => spRowBlocks(p, 'house').flatMap((b) => b.rows)[13];
    assert.equal(row().cueToAudience, true);
    assert.equal(row().cueAudienceOk, false);
    const q = spInputQuestions(spReview(p)).find((i) => i.rule === 'cue-to-audience');
    assert.ok(q?.actions.includes('cue-audience-ok'));
    p = spUpdateInput(p, click, { cueAudienceOk: true });
    assert.equal(row().cueAudienceOk, true);
    assert.match(row().a11y, /the audience is meant to hear/);
    assert.equal(spInputQuestions(spReview(p)).filter((i) => i.rule === 'cue-to-audience').length, 0);
    // changing who hears it brings the question back the next time
    p = spUpdateInput(p, click, { audience: 'monitor-only' });
    p = spUpdateInput(p, click, { audience: 'audience' });
    assert.equal(row().cueAudienceOk, false);
  });

  it('the chips name a performer and a source the same way in every popup', () => {
    let p = four();
    assert.deepEqual(
      spPeopleOptions(p).map((o) => o.label),
      ['Nobody (shared source)', 'Maya', 'Leo', 'Nina', 'Sam'],
    );
    assert.equal(spPeopleOptions(p)[0].value, '');
    // two sources with one name are told apart by who plays them
    const leo = p.performers.find((x) => x.name === 'Leo');
    assert.ok(leo);
    p = spAddSource(p, { label: 'Guitar', category: 'guitars', performerId: leo.id }).p;
    const guitars = spSourceOptions(p).filter((o) => /^Guitar/.test(o.label));
    assert.deepEqual(
      guitars.map((o) => o.label),
      ['Guitar · Sam', 'Guitar · Leo'],
    );
    assert.equal(new Set(spSourceOptions(p).map((o) => o.value)).size, p.sources.length);
  });

  it('words a band member may not know are explained where they are met', () => {
    assert.match(SP_PHANTOM_HINT, /^Phantom power is electricity that the mixer sends through the microphone cable\./);
    assert.match(SP_PHANTOM_HINT, /never decides it from the connector or from the word DI/);
    assert.match(SP_CUE_HINT, /A click is a metronome sound/);
    for (const word of ['Stage box:', 'Split:', 'Backline:']) assert.ok(SP_EXTRAS_HINT.includes(word), word);
  });

  it('the notes for a split and for power ask for a record, and promise no approval', () => {
    assert.match(SP_EXTRA_HINT.split, /phantom power/);
    assert.match(SP_EXTRA_HINT.power, /the venue decides/);
    for (const hint of Object.values(SP_EXTRA_HINT)) assert.ok(!/\b(guarantee|approved|compatible|safe)\b/i.test(hint));
  });
});

describe('review 2: count lines read as sentences, and words are true', () => {
  const groups = (p: SpProject) => Object.fromEntries(spEquipmentGroups(p).map((x) => [x.id, x.lines]));
  const zeroCount = /(^|[^\d.,])0 (inputs?|for the|monitor only|mono|stereo|Band|Venue|microphones?|DI)/;

  it('no example prints a zero count or a bare category word, in the summary or in the tiles', () => {
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `p-${t.id}`, now: NOW });
      const lines = [...spEquipmentGroups(p).flatMap((g) => g.lines), ...spResponsibility(p).flatMap((r) => r.lines)];
      for (const line of lines) {
        if (line === spDiTotals(p).summary) continue; // the model's own sentence (spDerive)
        assert.ok(!zeroCount.test(line), `${t.id}: a zero count in "${line}"`);
        assert.ok(!/\d (Band|Venue|Other provider|To be confirmed)\b/.test(line), `${t.id}: a bare category word in "${line}"`);
      }
      for (const c of spSummaryCounts(p)) assert.ok(c.value > 0, `${t.id}: a tile of zero "${c.label}"`);
    }
    const blank = spFromTemplate('blank', { id: 'p-blank', now: NOW });
    assert.deepEqual(spSummaryCounts(blank), []);
    assert.deepEqual(groups(blank).channels, ['No inputs yet.']);
  });

  it('the house line: all for the audience mix, or the parts that exist with the monitor-only inputs named', () => {
    const salsa = spFromTemplate('salsa', { id: 'p-salsa', now: NOW });
    assert.equal(groups(salsa).channels[0], `House system: ${spSummary(salsa).house.channels} inputs, all for the audience mix.`);
    assert.equal(groups(four()).channels[0], 'House system: 14 inputs. 13 for the audience mix, 1 monitor only (Click).');
    let p = spFromTemplate('blank', { id: 'p-one', now: NOW });
    p = spAddPackage(p, 'vocal').p;
    assert.equal(groups(p).channels[0], 'House system: 1 input, for the audience mix.');
    p = spUpdateInput(p, p.inputs[0].id, { audience: 'tbc' });
    assert.equal(groups(p).channels[0], 'House system: 1 input, with who hears it to be confirmed.');
  });

  it('the band monitor rig feeds no audience: its line says what it shares and what goes to it alone', () => {
    const playback = spFromTemplate('playback', { id: 'p-play', now: NOW });
    const g = groups(playback);
    assert.equal(g.channels[0], 'House system: 10 inputs, all for the audience mix.');
    assert.equal(g.channels[2], 'Band monitor rig: 11 inputs. 10 are shared with the house system through the split, 1 goes to the band monitor rig only (Click).');
    assert.ok(!g.channels.some((l) => /^Band monitor rig:.*audience mix/.test(l)), 'never "for the audience mix" for the band monitor rig');
    assert.match(g.channels[3], /^Band monitor rig by group: /);
    // every input for the band monitor rig alone, and one alone
    let p = spFromTemplate('blank', { id: 'p-band', now: NOW });
    p = spAddPackage(p, 'click').p;
    p = spUpdateInput(p, p.inputs[0].id, { destination: 'band' });
    assert.deepEqual(groups(p).channels.slice(0, 2), ['House system: no inputs yet.', 'Band monitor rig: 1 input, for the band monitor rig only (Click).']);
    p = spAddPackage(p, 'vocal').p;
    p = spUpdateInput(p, p.inputs[1].id, { destination: 'band' });
    assert.equal(groups(p).channels[1], 'Band monitor rig: 2 inputs, all for the band monitor rig only (Click, Vocal).');
  });

  it('who brings a quantity: one word after the dash, or a whole sentence', () => {
    const by = (band: number, venue: number, other = 0, tbc = 0) => ({ band, venue, other, tbc });
    assert.equal(spBroughtBy(by(0, 4)), 'venue');
    assert.equal(spBroughtBy(by(1, 0)), 'band');
    assert.equal(spBroughtBy(by(0, 0, 2)), 'other provider');
    assert.equal(spBroughtBy(by(0, 0, 0, 3)), 'to be confirmed');
    assert.equal(spBroughtBy(by(2, 1, 0, 1)), '2 from the band, 1 from the venue, 1 to be confirmed');
    assert.equal(spBroughtBy(by(0, 0)), '');
    assert.equal(spWhoBrings(by(0, 9)), 'The venue brings all 9.');
    assert.equal(spWhoBrings(by(1, 0)), 'The band brings it.');
    assert.equal(spWhoBrings(by(0, 0, 0, 1)), 'Who brings it: to be confirmed.');
    assert.equal(spWhoBrings(by(0, 0, 0, 2)), 'Who brings them: to be confirmed.');
    assert.equal(spWhoBrings(by(1, 1)), 'The band brings 1 and the venue brings 1.');
    assert.equal(spWhoBrings(by(1, 2, 1, 2)), 'The band brings 1, the venue brings 2, another provider brings 1 and 2 are to be confirmed.');
    assert.equal(spWhoBrings(by(0, 0)), '');
    // a mixed line in the summary
    let p = four();
    p = spUpdateInput(p, idOf(p, 'Kick'), { equipment: 'Dynamic instrument microphone', supplier: 'band' });
    assert.ok(groups(p).microphones.includes('5 × Dynamic instrument microphone — 1 from the band, 4 from the venue'));
  });

  it('a source nobody in particular plays has one name', () => {
    assert.equal(SP_NOBODY, 'Nobody (shared source)');
    const p = spAddPackage(four(), 'horn-mic', {}).p;
    assert.equal(spPeopleOptions(p)[0].label, SP_NOBODY);
    assert.equal(spRowBlocks(p, 'house').flatMap((b) => b.rows)[14].who, SP_NOBODY);
    assert.equal(spSourcesWithoutInputs(spAddSource(p, { label: 'Cajón', category: 'percussion', connection: 'none' }).p)[0].who, SP_NOBODY);
  });

  it('"to be confirmed" is said to be printed as a question only when that is true', () => {
    assert.equal(SP_TBC_PRINTED, 'To be confirmed is printed as a question when your band or another provider brings the item. For an item the venue brings, the venue already knows.');
    assert.ok(SP_PHANTOM_HINT.endsWith(SP_TBC_PRINTED));
    assert.match(SP_PHANTOM_HINT, /Not required: it works with or without it\. Do not apply: phantom power could damage it or cause noise/);
    // and it IS true: the venue's unknown is not asked, the band's is
    const venue = four();
    assert.ok(!spOpenIssues(spReview(venue)).here.some((i) => /Keys/.test(i.text)), 'the venue’s keys DI is not printed as a question');
    const band = spUpdateDiDevice(venue, venue.diDevices[1].id, { supplier: 'band' });
    assert.ok(spOpenIssues(spReview(band)).here.some((i) => /Keys stereo DI: passive or active/.test(i.text)));
  });

  it('backline means the instruments and amplifiers on the stage, whoever brings them', () => {
    assert.match(SP_EXTRAS_HINT, /Backline: the instruments and amplifiers on the stage, such as the drum kit, the amplifiers and the keyboards\. Say who brings each\./);
    assert.ok(!/supplied for you/.test(SP_EXTRAS_HINT));
  });

  it('the screens: a long tag wraps inside its card, a card that leads on carries ›, and the headings changed', () => {
    const bits = code(`${DIR}/inputs/bits.tsx`);
    assert.match(bits, /tag: \{[^}]*flexShrink: 1, maxWidth: '100%' \}/);
    assert.match(bits, /tagText: \{[^}]*flexShrink: 1 \}/);
    const add = code(`${DIR}/inputs/AddSheets.tsx`);
    assert.equal(add.split('right={<Chevron />}').length - 1, 4, 'the three ways to add, and each package');
    assert.match(add, /<SubTitle>This package assumes<\/SubTitle>\s*<Note>\{view\.assumes\}<\/Note>/);
    const summary = code(`${DIR}/inputs/SummaryPanel.tsx`);
    assert.match(summary, /title="Who brings what"/);
    assert.match(summary, /To answer in MONITORS:/);
    assert.match(code(`${DIR}/inputs/OrderPanel.tsx`), /'Sort a stage plot that may have been sent\?'/);
    assert.match(code(`${DIR}/inputs/DiPanel.tsx`), /\{totals\.channels \? <Count /);
    assert.ok(SP_GUIDE_INPUTS.tryThis.some((t) => t.includes('Channel 7 stays empty, and each row from there on takes the next number.')));
  });
});

/* ── the screen files, read as source ───────────────────────────────────── */

const ROOT = process.cwd();
const DIR = 'src/screens/lab/stageplot';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const SCREEN_FILES = [`${DIR}/InputsArea.tsx`, ...readdirSync(join(ROOT, DIR, 'inputs')).filter((f) => f.endsWith('.tsx')).map((f) => `${DIR}/inputs/${f}`)];
const ALL = SCREEN_FILES.map((f) => ({ f, src: code(f) }));

describe('the Inputs screens keep the house rules', () => {
  it('InputsArea is exported by name, takes no props and reads the one editor', () => {
    const src = code(`${DIR}/InputsArea.tsx`);
    assert.match(src, /export function InputsArea\(\)/);
    assert.match(src, /useSpEditor\(\)/);
    assert.ok(existsSync(join(ROOT, DIR, 'inputs/inputsLogic.ts')));
  });

  it('every edit goes through the editor: no screen file changes a project itself', () => {
    for (const { f, src } of ALL) {
      assert.ok(!/\bproject\.[a-zA-Z.]+\s*(=[^=>]|\.push\(|\.splice\()/.test(src), `${f}: writes into the project`);
      assert.ok(!/\bspEdit\(/.test(src), `${f}: edits go through the named spModel functions`);
      assert.ok(!/Alert\.alert|\.goBack\(|InteractionManager|AsyncStorage/.test(src), `${f}: house helpers`);
    }
  });

  /** Each `<Pressable …>` opening tag, read to its own closing `>` (an arrow
   *  function's `=>` inside a prop is not the end of the tag). */
  const pressables = (src: string): string[] => {
    const out: string[] = [];
    for (let at = src.indexOf('<Pressable'); at >= 0; at = src.indexOf('<Pressable', at + 1)) {
      let depth = 0;
      let end = at;
      for (; end < src.length; end += 1) {
        if (src[end] === '{') depth += 1;
        else if (src[end] === '}') depth -= 1;
        else if (src[end] === '>' && depth === 0) break;
      }
      out.push(src.slice(at, end + 1));
    }
    return out;
  };

  it('every Pressable says what it is and what it does', () => {
    let seen = 0;
    for (const { f, src } of ALL) {
      const tags = pressables(src);
      seen += tags.length;
      for (const tag of tags) {
        assert.match(tag, /accessibilityRole=/, `${f}: ${tag.slice(0, 80)}`);
        assert.match(tag, /accessibilityLabel=/, `${f}: ${tag.slice(0, 80)}`);
      }
    }
    assert.ok(seen >= 4, 'the rows, the move keys and the tick rows were read');
  });

  it('no value is cut off: a one-line text shrinks with fitValue, and nothing is under 9 pt', () => {
    for (const { f, src } of ALL) {
      assert.ok(!/numberOfLines=/.test(src), `${f}: use {...fitValue(size)} instead of numberOfLines`);
      assert.ok(!/ellipsizeMode/.test(src), f);
      for (const m of src.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)/g)) assert.ok(Number(m[1]) >= 12, `${f}: fontSize ${m[1]}`);
    }
  });

  it('touch targets are at least 44 pt', () => {
    for (const { f, src } of ALL) {
      for (const m of src.matchAll(/min(?:Height|Width):\s*(\d+)/g)) assert.ok(Number(m[1]) >= 44 || Number(m[1]) === 0, `${f}: a ${m[1]} pt target`);
    }
    const row = code(`${DIR}/inputs/InputRow.tsx`);
    assert.match(row, /moveButton: \{[^}]*width: 44,[^}]*minHeight: 44,/);
  });

  it('MONITOR ONLY and the stereo side are words on the row, not a color', () => {
    const row = code(`${DIR}/inputs/InputRow.tsx`);
    assert.match(row, /MONITOR ONLY/);
    assert.match(row, /kept out of the audience mix/);
    assert.match(row, /STEREO PAIR/);
    assert.match(row, /view\.side === 'L' \? 'L · LEFT' : 'R · RIGHT'/);
  });

  it('the fix round’s rules hold in the source', () => {
    const src = ALL.map((x) => x.src).join('\n');
    const editor = code(`${DIR}/inputs/InputEditor.tsx`);
    const area = code(`${DIR}/InputsArea.tsx`);
    const logic = code(`${DIR}/inputs/inputsLogic.ts`);
    // one name per thing: a thing you press is a button; the jump has two honest names
    assert.ok(!/\b(move|▼|▲) keys?\b|\bkeys? (on a row|below)\b/i.test(src + SP_GUIDE_INPUTS.control.join(' ')), 'a button is never called a key');
    assert.ok(!/LOCATE ON STAGE\b/.test(src), 'LOCATE ON THE STAGE, or PLACE ON THE STAGE when it is not there yet');
    assert.ok(!/channel list|input channels?\b|DI audio channel|Not known|Not answered yet|Who plays it"/.test(src), 'retired names');
    assert.ok(!/already shared|a shared stage plot|Answered in MONITORS|[Dd]evice arrangement|Nobody yet|[Nn]o performer \(|by type|This package assumes:|asked to provide|supplied for you|own rig|[Cc]oordination required|supplied and venue supplied/.test(src + logic), 'words retired by review 2');
    assert.ok(!/printed as a question, never guessed|To be confirmed is printed as a question\.'/.test(src + logic), 'a venue item that is to be confirmed is not printed as a question');
    assert.match(src, /MONITOR ONLY: kept out of the audience mix/);
    // a DI channel on a device shows the device's answer, and sends the user there
    assert.match(editor, /\{diDevice \? \(/);
    assert.match(editor, /SP_SUPPLIER_WORD\[diDevice\.supplier\]/);
    assert.match(editor, /onOpenDi\(diDevice\.id\)/);
    // the click's deliberate exception can be recorded where the warning is
    assert.match(editor, /label="The audience is meant to hear it"[\s\S]{0,80}value=\{input\.cueAudienceOk\}/);
    // a review card about a listed item opens it; a shared revision asks before renumbering
    assert.match(area, /t\.kind === 'extra' && t\.id\) openExtra\(t\.id\)/);
    assert.match(area, /selection\.kind === 'di'\) openDi\(selection\.id\);\s*else openExtra\(selection\.id\)/);
    assert.match(area, /if \(shared\) confirmDialog\('Renumber a stage plot that may have been sent\?'/);
    assert.match(area, /action === 'pair-mono' && id && spBrokenPairDi\(p, id\)/);
    // a state is in the page for a web screen reader too
    assert.match(code(`${DIR}/inputs/InputRow.tsx`), /accessibilityState=\{\{ selected \}\}\s*aria-selected=\{selected\}/);
    assert.match(code(`${DIR}/inputs/bits.tsx`), /accessibilityState=\{\{ checked \}\} aria-checked=\{checked\}/);
    // the reserved channels line says what the switch does in BOTH positions
    assert.match(code(`${DIR}/inputs/OrderPanel.tsx`), /They are not kept free while this is off\./);
    // glossary links stay unwired until entry names are verified
    assert.ok(!/<HelpTip[^>]*\bterm=/.test(src));
  });

  it('the usual order is offered as a convenience, never as a standard', () => {
    const src = ALL.map((x) => x.src).join('\n');
    assert.match(src, /label="SORT IN THE USUAL ORDER"/);
    assert.match(src, /convenience, not a house standard/);
    assert.match(src, /label="RENUMBER"/);
    assert.match(src, /Keep reserved channels free/);
    assert.match(src, /label=\{object \? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'\}/);
    assert.match(src, /ed\.goTo\('stage'/);
    assert.match(src, /No sound system connection needed/);
    assert.match(src, /<MoreDetails title="More details">/);
  });

  it('the tool documents and never prescribes', () => {
    const src = ALL.map((x) => x.src).join('\n') + code(`${DIR}/inputs/inputsLogic.ts`);
    assert.ok(!/production ready|at once|\bfree\b tier|you(’|')ll (master|build|mix)/i.test(src));
    assert.ok(!/\b(colour|behaviour|centre|programme|grey)\b|\b(organis|recognis)/i.test(src), 'US spelling');
    assert.ok(!/turn (on|off) phantom|set the gain|\bMHz\b/i.test(src));
  });
});

describe('the Inputs screen guide', () => {
  const g = SP_GUIDE_INPUTS;
  const words = (s: string) => s.trim().split(/\s+/).length;
  it('has the intro card and five sections inside their budgets', () => {
    assert.ok(g.intro);
    assert.ok(words(g.intro.learning) <= SCREEN_INTRO_WORDS.learning, `learning is ${words(g.intro.learning)} words`);
    assert.ok(words(g.intro.start) <= SCREEN_INTRO_WORDS.start, `start is ${words(g.intro.start)} words`);
    for (const s of SCREEN_GUIDE_SECTIONS) {
      const items = g[s.key];
      assert.ok(items.length >= 1 && items.length <= 5, `${s.key}: ${items.length} bullets`);
      for (const it of items) assert.ok(it.trim().length > 20, `${s.key}: a real sentence`);
      if (s.key === 'tryThis') {
        assert.ok(items.length >= 2 && items.length <= 3);
        for (const it of items) assert.ok(it.length <= SCREEN_GUIDE_BUDGET.tryItem, `tryThis item is ${it.length} characters`);
      } else {
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        assert.ok(items.join('\n').length <= cap, `${s.key}: ${items.join('\n').length} characters (cap ${cap})`);
      }
    }
  });
  it('follows the house copy rules and names controls the screen really has', () => {
    const t = [g.intro?.learning ?? '', g.intro?.start ?? '', ...SCREEN_GUIDE_SECTIONS.flatMap((s) => g[s.key])].join('\n');
    assert.ok(/\byou(r|’re|’ll|’ve)?\b/i.test(t), 'speaks to the user');
    assert.ok(!/you(’|')ll (master|build|mix)|you will (master|be able to)/i.test(t), 'knowledge, not skills');
    assert.ok(!/\b(colour|behaviour|centre|programmes?|grey)\b|\b(organis|recognis)/i.test(t), 'US spelling');
    assert.ok(!/\b(research shows|studies show|according to|survey)\b/i.test(t), 'no citations');
    assert.ok(!/\bthis screen (shows|lists|contains)\b/i.test(g.teaches.join(' ')));
    assert.ok(!/\bat once\b/i.test(t));
    const have = ALL.map((x) => x.src).join('\n').toUpperCase();
    for (const line of g.control) for (const m of line.matchAll(/\b[A-Z][A-Z0-9]{2,}(?: [A-Z0-9]{2,})*\b/g)) assert.ok(have.includes(m[0]), `the guide quotes "${m[0]}", which is not a label on the screen`);
    // quoted labels in the guide are the screen's own words
    for (const m of t.matchAll(/“([^”]+)”/g)) assert.ok(have.includes(m[1].toUpperCase()), `the guide quotes “${m[1]}”, which is not on the screen`);
  });
});
