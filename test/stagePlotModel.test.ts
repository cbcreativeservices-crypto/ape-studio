/**
 * Stage Plot and Channel Designer — the pure project model
 * (src/features/stageplot/): the owner's handoff, section 11 (the worked
 * example and its totals) and the model checks of section 12, proven with no
 * device.
 *
 * These tests check RELATIONSHIPS a band relies on (a count follows its rows;
 * a moved input keeps its links; a copy shares nothing with its master), not
 * the implementation's own arithmetic re-run.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SP_PACKAGES, SP_PALETTE } from '../src/features/stageplot/spCatalog.ts';
import { spAllInputsInOrder, spBadge, spDiTotals, spInputSupplier, spInputTotals, spMonitorTotals, spOpenItems, spPatchRows, spSummary, spTextSummary } from '../src/features/stageplot/spDerive.ts';
import {
  spAddDevice,
  spAddDiDevice,
  spAddExtra,
  spAddInput,
  spAddMix,
  spAddObject,
  spAddPackage,
  spAddPerformer,
  spBrokenRefs,
  spDuplicateObject,
  spDuplicateProject,
  spEdit,
  spFreeze,
  spGroup,
  spInputLocation,
  spLocationWord,
  spMarkReady,
  spMigrate,
  spMoveInput,
  spMoveObject,
  spNewProject,
  spPairRestore,
  spPairToMono,
  spPatch,
  spRemoveInput,
  spRemoveMix,
  spRemoveObjects,
  spRemovePerformer,
  spRenumber,
  spSetNeed,
  spSetNumber,
  spSetReserved,
  spSetVenueChannel,
  spSortConventional,
  spStereoToMono,
  spUpdateDiDevice,
  spUpdateInput,
  spUpdateMix,
  spUpdateSource,
} from '../src/features/stageplot/spModel.ts';
import { spCanMarkReady, spGuidedSteps, spReview } from '../src/features/stageplot/spReview.ts';
import { SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';

const NOW = 1_800_000_000_000;
const four = (): SpProject => spFromTemplate('four-piece', { id: 'p-four', now: NOW, band: 'The Example Four' });
const labels = (p: SpProject) => spPatchRows(p, 'house').map((r) => `${r.number} ${r.input.label}`);
const byLabel = (p: SpProject, label: string) => {
  const i = p.inputs.find((x) => x.label === label);
  assert.ok(i, `no input labelled ${label}`);
  return i;
};
const rules = (p: SpProject) => spReview(p).map((i) => i.rule);

describe('the worked example (handoff section 11)', () => {
  const p = four();
  it('lists the fourteen inputs in the order of the handoff', () => {
    assert.deepEqual(labels(p), [
      '1 Kick',
      '2 Snare',
      '3 Rack tom',
      '4 Floor tom',
      '5 Overhead L',
      '6 Overhead R',
      '7 Bass DI',
      '8 Guitar cabinet',
      '9 Keys L',
      '10 Keys R',
      '11 Lead vocal',
      '12 Leo vocal',
      '13 Nina vocal',
      '14 Click',
    ]);
  });
  it('14 input channels in the one house patch: 13 for the audience, the click monitor only', () => {
    const t = spInputTotals(p, 'house');
    assert.equal(t.channels, 14);
    assert.equal(t.audience, 13);
    assert.equal(t.monitorOnly, 1);
    assert.equal(spPatch(p, 'band'), undefined, 'no second system was asked for');
    assert.equal(byLabel(p, 'Click').audience, 'monitor-only');
  });
  it('10 microphones, 3 DI channels, 2 DI devices (one mono, one stereo)', () => {
    const s = spSummary(p);
    assert.equal(s.microphones, 10);
    assert.equal(s.di.channels, 3);
    assert.equal(s.di.devices, 2);
    assert.equal(s.di.unassignedChannels, 0);
    assert.deepEqual(p.diDevices.map((d) => d.channels).sort(), [1, 2]);
  });
  it('4 distinct mixes and 6 monitor feed audio channels, all requested from the house console', () => {
    const m = spMonitorTotals(p);
    assert.equal(m.all.mixes, 4);
    assert.equal(m.all.channels, 6);
    assert.equal(m.house.mixes, 4);
    assert.equal(m.house.channels, 6);
    assert.equal(m.bandOwned.mixes, 0);
  });
  it('2 wedges, 1 wireless in-ear transmitter, 1 receiver pack, 1 wired headphone amplifier: separate counts', () => {
    const d = spMonitorTotals(p).devices;
    assert.equal(d.wedge, 2);
    assert.equal(d['iem-tx'], 1);
    assert.equal(d['iem-pack'], 1);
    assert.equal(d['hp-amp'], 1);
  });
  it('the drummer receives the click; every other mix excludes it', () => {
    const click = byLabel(p, 'Click');
    const needs = p.mixes.map((m) => `${m.code}:${m.needs[click.id]}`);
    assert.deepEqual(needs, ['M1:exclude', 'M2:exclude', 'M3:primary', 'M4:exclude']);
  });
  it('a second wedge on M1: 3 wedges, still 4 mixes, the output channels do not move', () => {
    const q = spAddDevice(p, { type: 'wedge', mixId: p.mixes[0].id, label: 'Wedge 3', supplier: 'venue' }).p;
    const m = spMonitorTotals(q);
    assert.equal(m.devices.wedge, 3);
    assert.equal(m.all.mixes, 4);
    assert.equal(m.all.channels, 6);
  });
  it('making M3 mono takes the monitor feed channels from 6 to 5', () => {
    const q = spUpdateMix(p, p.mixes[2].id, { format: 'mono' });
    assert.equal(spMonitorTotals(q).all.channels, 5);
    assert.equal(spMonitorTotals(q).all.mixes, 4);
  });
  it('making the keyboard mono removes one keys input and one DI channel; the stereo DI device is an explicit choice', () => {
    const pairId = byLabel(p, 'Keys L').pairId as string;
    const kept = spStereoToMono(p, pairId, { keep: 'L', di: 'keep' });
    assert.equal(spInputTotals(kept, 'house').channels, 13);
    assert.equal(spDiTotals(kept).channels, 2);
    assert.equal(spDiTotals(kept).devices, 2, 'the stereo DI stays in use, one channel of it');
    assert.equal(byLabel(kept, 'Keys').side, null);
    const released = spStereoToMono(p, pairId, { keep: 'L', di: 'release' });
    assert.equal(spDiTotals(released).channels, 2);
    assert.equal(spDiTotals(released).devices, 1);
    assert.equal(spDiTotals(released).unassignedChannels, 1, 'the keys channel now reads: no DI device yet');
  });
  it('the review of the example asks nothing that must be corrected', () => {
    assert.ok(spCanMarkReady(spReview(p)));
    assert.deepEqual(spBrokenRefs(p), []);
  });
  it('the text summary states the same totals', () => {
    const t = spTextSummary(p);
    assert.match(t, /Inputs: 14 to the house system \(13 for the audience mix; monitor only, kept out of the audience mix: Click\)/);
    assert.match(t, /Microphones: 10\. 3 DI channels on 2 DI devices\./);
    assert.match(t, /Monitor mixes: 4 \(2 mono, 2 stereo\)\./);
    assert.match(t, /Requested from the house console: 4 mixes, 6 audio channels\./);
    assert.match(t, /Wireless monitor devices: 1 \(radio frequency coordination needed\)\./);
    assert.doesNotMatch(t, /band's own rig/, 'nothing in this example is mixed by the band');
    // a date is printed in words, a single thing is not "1 inputs", an undecided creator is said
    const gig = spEdit(spUpdateInput(p, byLabel(p, 'Kick').id, { destination: 'both' }), (d) => {
      d.venue = 'Club Example';
      d.eventDate = '2026-12-05';
      d.mixes[0].provider = 'tbc';
    });
    const g = spTextSummary(gig);
    assert.match(g, /Club Example, December 5, 2026/);
    assert.match(g, /Band monitor rig: 1 input\./);
    assert.match(g, /Who creates 1 mix is to be confirmed\./);
  });
});

describe('every example band', () => {
  for (const t of SP_TEMPLATES) {
    it(`${t.name}: no broken link, nothing that must be corrected, every input numbered once`, () => {
      const p = spFromTemplate(t.id, { id: `p-${t.id}`, now: NOW });
      assert.deepEqual(spBrokenRefs(p), []);
      const blocks = spReview(p).filter((i) => i.level === 'block');
      if (t.id === 'blank') assert.deepEqual(blocks.map((i) => i.rule), ['empty'], 'an empty stage is not ready to send');
      else assert.ok(spCanMarkReady(spReview(p)), blocks.map((i) => i.text).join(' | '));
      assert.equal(p.revision, 1);
      assert.equal(p.status, 'draft');
      for (const patch of p.patches) {
        const numbers = patch.order.map((id) => patch.numbers[id]);
        assert.equal(new Set(numbers).size, numbers.length, `${patch.name} has a repeated number`);
        assert.ok(numbers.every((n) => typeof n === 'number'));
      }
      if (t.id !== 'blank') {
        assert.ok(p.performers.every((pf) => p.objects.some((o) => o.performerId === pf.id)), 'every performer is on the stage');
        assert.ok(!rules(p).includes('source-unplaced'));
        assert.ok(!rules(p).includes('performer-no-monitor'));
        assert.ok(!rules(p).includes('mix-no-device') && !rules(p).includes('wireless-no-transmitter') && !rules(p).includes('riser-not-listed'));
        assert.ok(t.assumes.length > 20, 'an example states what it assumes');
        // an example answers phantom power only for the band's OWN equipment
        for (const i of p.inputs) if (spInputSupplier(p, i) === 'venue') assert.equal(i.phantom, 'unknown', `${t.id}: ${i.label}`);
        // names that would be wrong after a rename are not baked into mixes or devices
        for (const pf of p.performers) for (const x of [...p.mixes.map((m) => m.name), ...p.devices.map((d) => d.label)]) assert.ok(!x.includes(pf.name), `${t.id}: "${x}" names ${pf.name}`);
        assert.match(p.title, /\(example\)$/);
      }
    });
  }
  it('the salsa band is the large setup: 16 inputs, 6 mixes shared by 12 players, 9 wedges', () => {
    const p = spFromTemplate('salsa', { id: 'p-salsa', now: NOW });
    assert.equal(p.performers.length, 12);
    assert.equal(spInputTotals(p, 'house').channels, 16);
    const m = spMonitorTotals(p);
    assert.equal(m.all.mixes, 6);
    assert.equal(m.devices.wedge, 9);
    assert.equal(m.all.channels, 6, 'nine wedges on six mono mixes are six feeds, not nine');
    assert.equal(spSummary(p).acousticSources, 1, 'hand percussion is on the stage with no input of its own');
  });
  it('the band with playback mixes its own in-ears: nothing is requested from the house console, and each input feeds two systems', () => {
    const p = spFromTemplate('playback', { id: 'p-pb', now: NOW });
    const m = spMonitorTotals(p);
    assert.equal(m.all.mixes, 4);
    assert.equal(m.house.mixes, 0);
    assert.equal(m.house.channels, 0);
    assert.equal(m.bandOwned.mixes, 4);
    // the click stays inside the band's own rig: the house is not sent a channel it would never use
    assert.equal(spInputTotals(p, 'house').channels, 10);
    assert.equal(spInputTotals(p, 'band').channels, 11);
    const click = p.inputs.find((i) => i.cue);
    assert.ok(click);
    assert.equal(spBadge(p, click.id), 'B11');
    assert.ok(!spPatchRows(p, 'house').some((r) => r.input.cue));
    // wireless in-ears are listed with their transmitters, so the venue is told radio equipment is coming
    assert.equal(m.devices['iem-tx'], 4);
    assert.equal(m.devices['iem-pack'], 4);
    assert.equal(m.wirelessDevices, 4);
    assert.match(spTextSummary(p), /Wireless monitor devices: 4 \(radio frequency coordination needed\)/);
    assert.match(spTextSummary(p), /Requested from the house console: 0 mixes, 0 audio channels\./);
    // one split is one question, however many inputs go through it
    assert.equal(spSummary(p).open.filter((x) => /split is made/.test(x)).length, 1);
    assert.ok(p.mixes.every((x) => x.venueFeed === 'split'));
    // the same number in the two systems is not a clash
    assert.ok(!rules(p).includes('duplicate-channel'));
  });
});

describe('positions and the stage (section 12, check 2)', () => {
  it('stage right is the viewer’s left; upstage is the top', () => {
    assert.equal(spLocationWord({ x: 0.1, y: 0.1 }), 'Upstage right');
    assert.equal(spLocationWord({ x: 0.9, y: 0.9 }), 'Downstage left');
    assert.equal(spLocationWord({ x: 0.5, y: 0.5 }), 'Center stage');
    assert.equal(spLocationWord({ x: 0.1, y: 0.5 }), 'Stage right');
    assert.equal(spLocationWord({ x: 0.5, y: 0.9 }), 'Downstage center');
    assert.equal(spLocationWord({ x: 1.2, y: 0.5 }), 'Off the stage');
  });
  it('moving a performer’s microphone moves where its input says it is', () => {
    const p = four();
    const lead = byLabel(p, 'Lead vocal');
    assert.equal(spInputLocation(p, lead.id), 'Downstage center');
    const mic = p.objects.find((o) => o.inputId === lead.id);
    assert.ok(mic);
    const q = spMoveObject(p, mic.id, { x: 0.1, y: 0.1 }, { snap: false });
    assert.equal(spInputLocation(q, lead.id), 'Upstage right');
    assert.equal(spPatchRows(q, 'house').find((r) => r.input.id === lead.id)?.number, 11, 'its channel did not change');
  });
  it('positions are stage fractions: a dimension change does not move anything', () => {
    const p = four();
    const q = spEdit(p, (d) => {
      d.stage.width = 40;
      d.stage.depth = 20;
    });
    assert.deepEqual(q.objects.map((o) => [o.x, o.y]), p.objects.map((o) => [o.x, o.y]));
  });
  it('an icon never adds an input, and a duplicated icon points at nothing', () => {
    const p = four();
    const before = p.inputs.length;
    const amp = spAddObject(p, 'guitar-amp', { x: 0.3, y: 0.3 });
    assert.equal(amp.p.inputs.length, before);
    assert.ok(rules(amp.p).includes('icon-no-input'), 'it asks: a drawing only, or does it belong to a source?');
    const kit = p.objects.find((o) => o.kind === 'drum-kit');
    assert.ok(kit?.sourceId);
    const dup = spDuplicateObject(p, kit.id);
    const copy = dup.p.objects.find((o) => o.id === dup.ids[0]);
    assert.ok(copy);
    assert.equal(copy.sourceId, null);
    assert.equal(dup.p.inputs.length, before);
    assert.deepEqual(spBrokenRefs(dup.p), []);
  });
  it('a group moves, duplicates and is removed together; no list row is lost and none is shared (check 7)', () => {
    const p = four();
    const sam = p.performers.find((x) => x.name === 'Sam');
    assert.ok(sam);
    const figure = p.objects.find((o) => o.performerId === sam.id);
    const mic = p.objects.find((o) => o.inputId === byLabel(p, 'Lead vocal').id);
    assert.ok(figure && mic);
    let q = spGroup(p, [figure.id, mic.id]);
    const gap = { dx: mic.x - figure.x, dy: mic.y - figure.y };
    q = spMoveObject(q, figure.id, { x: 0.3, y: 0.5 }, { snap: false });
    const f2 = q.objects.find((o) => o.id === figure.id);
    const m2 = q.objects.find((o) => o.id === mic.id);
    assert.ok(f2 && m2);
    assert.ok(Math.abs(m2.x - f2.x - gap.dx) < 1e-9 && Math.abs(m2.y - f2.y - gap.dy) < 1e-9, 'the group kept its shape');
    const dup = spDuplicateObject(q, figure.id);
    assert.equal(dup.ids.length, 2);
    const copies = dup.p.objects.filter((o) => dup.ids.includes(o.id));
    assert.ok(copies.every((o) => !o.performerId && !o.inputId), 'the copies are drawings');
    assert.equal(new Set(copies.map((o) => o.groupId)).size, 1);
    assert.notEqual(copies[0].groupId, f2.groupId, 'the copy is its own group');
    const gone = spRemoveObjects(dup.p, [figure.id]);
    assert.ok(!gone.objects.some((o) => o.id === figure.id || o.id === mic.id));
    assert.ok(gone.performers.some((x) => x.id === sam.id), 'the performer is still in the lists');
    assert.ok(rules(gone).includes('performer-unplaced'));
    assert.equal(gone.inputs.length, p.inputs.length);
    assert.deepEqual(spBrokenRefs(gone), []);
  });
  it('removing a performer never erases a mix that others share', () => {
    const p = spFromTemplate('salsa', { id: 'p-s', now: NOW });
    const tito = p.performers.find((x) => x.name === 'Tito');
    assert.ok(tito);
    const coro = p.mixes.find((m) => m.recipients.includes(tito.id));
    assert.ok(coro && coro.recipients.length === 2);
    const q = spRemovePerformer(p, tito.id, { withSources: true });
    const after = q.mixes.find((m) => m.id === coro.id);
    assert.ok(after, 'the shared mix is still there');
    assert.equal(after.recipients.length, 1);
    assert.ok(!q.inputs.some((i) => i.label === 'Coro 1'));
    assert.deepEqual(spBrokenRefs(q), []);
    // and a mix that was only theirs goes with them
    const lead = p.performers.find((x) => x.name === 'Marisol');
    assert.ok(lead);
    const q2 = spRemovePerformer(p, lead.id, { withSources: true });
    assert.equal(q2.mixes.length, p.mixes.length - 1);
    // nothing is left standing for somebody who is gone: her wedge, her
    // microphone and their drawings go with her
    assert.ok(!rules(q2).includes('device-no-mix'));
    assert.ok(!q2.devices.some((d) => d.label === 'Wedge 1'));
    assert.ok(!q2.objects.some((o) => o.label === 'Lead vocal' || o.label === 'Wedge 1'));
    assert.deepEqual(spBrokenRefs(q2), []);
    // without that choice only the figure goes, and what is left is asked about
    const q3 = spRemovePerformer(p, lead.id, { withSources: false });
    assert.equal(q3.inputs.length, p.inputs.length);
    assert.equal(q3.devices.length, p.devices.length);
    assert.ok(q3.objects.some((o) => o.label === 'Wedge 1'));
  });
});

describe('order and numbers (section 12, checks 3 and 4)', () => {
  it('moving an input renumbers the list and every link stays on the right source', () => {
    const p = four();
    const lead = byLabel(p, 'Lead vocal');
    const m1 = p.mixes[0];
    let q = spSetNeed(p, m1.id, lead.id, 'primary');
    q = spSetVenueChannel(q, 'house', lead.id, 'SB-A 3');
    q = spMoveInput(q, 'house', lead.id, -10);
    assert.equal(labels(q)[0], '1 Lead vocal');
    assert.equal(spBadge(q, lead.id), '1');
    assert.equal(q.mixes[0].needs[lead.id], 'primary', 'the mix still refers to the same source');
    assert.equal(spPatch(q, 'house')?.venue[lead.id], 'SB-A 3', 'the venue mapping stayed with it');
    assert.equal(q.objects.find((o) => o.inputId === lead.id)?.inputId, lead.id);
    assert.equal(byLabel(q, 'Lead vocal').id, lead.id, 'the id never changed');
  });
  it('the two sides of a stereo pair move as one block, L before R', () => {
    const p = four();
    const q = spMoveInput(p, 'house', byLabel(p, 'Keys R').id, -8);
    assert.deepEqual(labels(q).slice(0, 3), ['1 Keys L', '2 Keys R', '3 Kick']);
    const r = spMoveInput(q, 'house', byLabel(q, 'Keys L').id, 1);
    assert.deepEqual(labels(r).slice(0, 3), ['1 Kick', '2 Keys L', '3 Keys R']);
  });
  it('the conventional order is a convenience: drums … playback, other, vocals, pairs kept together', () => {
    const p = four();
    const q = spSortConventional(spMoveInput(p, 'house', byLabel(p, 'Lead vocal').id, -10), 'house');
    assert.deepEqual(labels(q), ['1 Kick', '2 Snare', '3 Rack tom', '4 Floor tom', '5 Overhead L', '6 Overhead R', '7 Bass DI', '8 Guitar cabinet', '9 Keys L', '10 Keys R', '11 Click', '12 Lead vocal', '13 Leo vocal', '14 Nina vocal']);
  });
  it('renumber can keep the channels the band reserved', () => {
    const p = four();
    const q = spRenumber(spSetReserved(p, 'house', [7, 8]), 'house', { keepReserved: true });
    assert.deepEqual(labels(q).slice(5, 8), ['6 Overhead R', '9 Bass DI', '10 Guitar cabinet']);
    const flat = spRenumber(q, 'house', { keepReserved: false });
    assert.equal(labels(flat)[6], '7 Bass DI');
  });
  it('a typed duplicate inside one patch must be corrected; the same number in two systems is fine', () => {
    const p = four();
    const q = spSetNumber(p, 'house', byLabel(p, 'Snare').id, 1);
    const issues = spReview(q);
    assert.ok(issues.some((i) => i.rule === 'duplicate-channel' && i.level === 'block' && /channel 1/.test(i.text) && /Kick and Snare/.test(i.text)));
    assert.ok(!spCanMarkReady(issues));
    // a second destination system
    const split = spUpdateInput(p, byLabel(p, 'Kick').id, { destination: 'both' });
    assert.equal(spPatch(split, 'band')?.numbers[byLabel(split, 'Kick').id], 1);
    assert.equal(spPatch(split, 'house')?.numbers[byLabel(split, 'Kick').id], 1);
    assert.ok(!rules(split).includes('duplicate-channel'));
    assert.equal(spBadge(split, byLabel(split, 'Kick').id), '1');
    // and back: the band patch goes when nothing feeds it
    assert.equal(spPatch(spUpdateInput(split, byLabel(split, 'Kick').id, { destination: 'house' }), 'band'), undefined);
  });
  it('removing one side of a stereo pair is a review question with two answers', () => {
    const p = four();
    const q = spRemoveInput(p, byLabel(p, 'Keys R').id);
    assert.ok(rules(q).includes('pair-broken'));
    const mono = spPairToMono(q, byLabel(q, 'Keys L').id);
    assert.equal(byLabel(mono, 'Keys').pairId, null);
    assert.ok(!rules(mono).includes('pair-broken'));
    const back = spPairRestore(q, byLabel(q, 'Keys L').id);
    assert.equal(byLabel(back.p, 'Keys R').side, 'R');
    assert.ok(!rules(back.p).includes('pair-broken'));
    assert.equal(spInputTotals(back.p, 'house').channels, 14);
  });
});

describe('sources, capture paths and equipment (section 12, check 6)', () => {
  it('a wireless vocal is one input: the receiver output, not a microphone plus a receiver', () => {
    let p = spNewProject({ id: 'p', now: NOW });
    const who = spAddPerformer(p, { name: 'Jo' });
    p = spAddPackage(who.p, 'vocal-wireless', { performerId: who.id }).p;
    assert.equal(spInputTotals(p, 'house').channels, 1);
    const s = spSummary(p);
    assert.equal(s.microphones, 0);
    assert.equal(s.wirelessInputs, 1);
  });
  it('an acoustic instrument stays on the stage without adding to the input count', () => {
    let p = spNewProject({ id: 'p', now: NOW });
    const pk = spAddPackage(p, 'guitar-cab');
    p = spUpdateSource(pk.p, pk.sourceId, { connection: 'none', noneReason: 'acoustic' });
    assert.equal(p.inputs.length, 0);
    assert.equal(spSummary(p).acousticSources, 1);
    assert.ok(!rules(p).includes('source-no-input'));
  });
  it('three DI channels with no box chosen are reported as channels, never as three boxes', () => {
    let p = spNewProject({ id: 'p', now: NOW });
    p = spAddPackage(p, 'bass-di').p;
    p = spAddPackage(p, 'keys-stereo').p;
    const t = spDiTotals(p);
    assert.equal(t.channels, 3);
    assert.equal(t.devices, 0);
    assert.equal(t.summary, '3 DI channels have no DI device (DI box) yet.');
    // a mono DI asked to carry two channels is a capacity mismatch that was ENTERED
    const keys = p.inputs.filter((i) => i.label.startsWith('Keys')).map((i) => i.id);
    const over = spAddDiDevice(p, { channels: 1, label: 'Mono DI', inputIds: keys }).p;
    assert.ok(!rules(over).includes('capacity'), 'a device only takes as many inputs as it has channels');
    const forced = spEdit(over, (d) => {
      for (const i of d.inputs) if (keys.includes(i.id)) i.diDeviceId = d.diDevices[0].id;
    });
    assert.ok(rules(forced).includes('capacity'));
  });
  it('a DI icon that illustrates an existing path adds no input', () => {
    const p = four();
    const bass = byLabel(p, 'Bass DI');
    const q = spAddObject(p, 'di', { x: 0.25, y: 0.45 }, { inputId: bass.id }).p;
    assert.equal(q.inputs.length, p.inputs.length);
    assert.equal(spDiTotals(q).channels, 3);
  });
  it('alternatives are not extra equipment, and a required item is counted as required', () => {
    let p = four();
    const lead = byLabel(p, 'Lead vocal');
    p = spUpdateInput(p, lead.id, { equipment: 'Dynamic vocal microphone', alternatives: 'Any dynamic vocal microphone in good condition', priority: 'required' });
    const s = spSummary(p);
    assert.equal(s.microphones, 10);
    const line = s.microphoneLines.find((l) => l.name === 'Dynamic vocal microphone');
    assert.ok(line);
    assert.equal(line.qty, 3);
    assert.equal(line.required, 1);
    assert.deepEqual(line.alternatives, ['Any dynamic vocal microphone in good condition']);
  });
  it('phantom power is never inferred: a new microphone and a new DI both start as unknown', () => {
    let p = spNewProject({ id: 'p', now: NOW });
    p = spAddPackage(p, 'vocal').p;
    p = spAddPackage(p, 'bass-di').p;
    assert.deepEqual(p.inputs.map((i) => i.phantom), ['unknown', 'unknown']);
    assert.ok(spSummary(p).open.some((t) => /phantom power/.test(t)));
    assert.deepEqual(p.inputs.map((i) => i.supplier), ['tbc', 'tbc']);
  });
  it('a click added later is excluded from every existing mix until someone asks for it', () => {
    let p = spNewProject({ id: 'p', now: NOW });
    const a = spAddPerformer(p, { name: 'A' });
    p = spAddMix(a.p, { recipients: [a.id], provider: 'house' }).p;
    const c = spAddPackage(p, 'click');
    assert.equal(c.p.mixes[0].needs[c.inputIds[0]], 'exclude');
    assert.equal(c.p.inputs[0].audience, 'monitor-only');
    const loud = spUpdateInput(c.p, c.inputIds[0], { audience: 'audience' });
    assert.ok(rules(loud).includes('cue-to-audience'));
    // marking an ordinary input as a cue does the same
    const v = spAddInput(c.p, c.sourceId, { label: 'Talkback', capture: 'mic', equipment: 'Dynamic vocal microphone', stand: 'none' });
    const cue = spUpdateInput(v.p, v.id, { cue: true });
    assert.equal(cue.inputs.find((i) => i.id === v.id)?.audience, 'monitor-only');
    assert.equal(cue.mixes[0].needs[v.id], 'exclude');
  });
  it('removing a mix leaves its devices on the list, flagged', () => {
    const p = four();
    const q = spRemoveMix(p, p.mixes[0].id);
    assert.equal(spMonitorTotals(q).devices.wedge, 2);
    assert.ok(rules(q).includes('device-no-mix'));
    assert.ok(rules(q).includes('performer-no-monitor'));
  });
});

describe('copies, revisions and saved data (section 12, check 5)', () => {
  it('a gig copy has new ids everywhere, every link re-pointed, and shares nothing with its master', () => {
    const master = four();
    const gig = spDuplicateProject(master, { id: 'p-gig', kind: 'gig', now: NOW + 1000, title: 'Club night' });
    assert.equal(gig.kind, 'gig');
    assert.equal(gig.masterId, master.id);
    assert.deepEqual(spBrokenRefs(gig), []);
    assert.deepEqual(labels(gig), labels(master));
    assert.equal(spMonitorTotals(gig).all.channels, 6);
    const click = byLabel(gig, 'Click');
    assert.deepEqual(gig.mixes.map((m) => m.needs[click.id]), ['exclude', 'exclude', 'primary', 'exclude']);
    assert.equal(byLabel(gig, 'Keys L').pairId, byLabel(gig, 'Keys R').pairId);
    assert.notEqual(byLabel(gig, 'Keys L').pairId, null);
    assert.ok(byLabel(gig, 'Bass DI').diDeviceId && gig.diDevices.some((d) => d.id === byLabel(gig, 'Bass DI').diDeviceId));
    // editing the copy does not touch the master
    const before = JSON.stringify(master);
    const edited = spRemoveInput(spUpdateInput(gig, click.id, { label: 'Click (venue copy)' }), byLabel(gig, 'Kick').id);
    assert.equal(JSON.stringify(master), before);
    assert.equal(spInputTotals(edited, 'house').channels, 13);
    assert.equal(spInputTotals(master, 'house').channels, 14);
    // a copy of a copy still remembers the ONE master
    assert.equal(spDuplicateProject(gig, { id: 'p-gig2', kind: 'gig', now: NOW }).masterId, master.id);
  });
  it('a saved project comes back the same through storage text', () => {
    const p = four();
    const back = spMigrate(JSON.parse(JSON.stringify(p)));
    assert.ok(back);
    assert.deepEqual(back, p);
    assert.equal(spMigrate({ nonsense: true }), null);
    assert.equal(spMigrate(null), null);
    // an older save with a field missing gets its blank value, not a crash
    const old = JSON.parse(JSON.stringify(p));
    delete old.extras;
    delete old.viewNote;
    for (const o of old.objects) delete o.visualOnly;
    const up = spMigrate(old);
    assert.ok(up);
    assert.deepEqual(up.extras, []);
    assert.equal(up.viewNote, '');
    assert.ok(up.objects.every((o) => o.visualOnly === false));
    // a save that points at something missing is repaired by detaching, never by guessing
    const hurt = JSON.parse(JSON.stringify(p));
    hurt.mixes[0].recipients.push('pf999');
    hurt.objects[0].performerId = 'pf999';
    const healed = spMigrate(hurt);
    assert.ok(healed);
    assert.deepEqual(spBrokenRefs(healed), []);
  });
  it('the first edit after an export, or after Ready to advance, moves the revision on and returns to Draft', () => {
    const p = four();
    const sent = spFreeze(p);
    assert.equal(sent.revision, 1);
    const edited = spUpdateInput(sent, byLabel(sent, 'Kick').id, { notes: 'Port hole on the resonant head' });
    assert.equal(edited.revision, 2);
    assert.equal(spUpdateInput(edited, byLabel(edited, 'Snare').id, { notes: 'x' }).revision, 2, 'further edits stay in the same new revision');
    const ready = spMarkReady(p);
    assert.equal(ready.status, 'ready');
    const moved = spMoveInput(ready, 'house', byLabel(ready, 'Click').id, -3);
    assert.equal(moved.status, 'draft');
    assert.equal(moved.revision, 2, 'a renumbered list never carries the number of the one already sent');
  });
  it('the guided task is judged from the project, and ends with a packet made', () => {
    const blank = spNewProject({ id: 'p', now: NOW });
    assert.deepEqual(spGuidedSteps(blank, false).map((s) => s.done), [false, false, false, false, false]);
    const raw = four();
    assert.deepEqual(spGuidedSteps(raw, true).map((s) => s.done), [true, true, true, false, false], 'the example still asks who the venue should contact');
    const p = spEdit(raw, (d) => {
      d.contact.name = 'Sam Example';
      d.contact.phone = '555 0100';
      // an example's title would print "(example)" on the venue's copy
      d.title = 'Club set';
    });
    assert.deepEqual(spGuidedSteps(p, false).map((s) => s.done), [true, true, true, true, false]);
    assert.deepEqual(spGuidedSteps(p, true).map((s) => s.done), [true, true, true, true, true]);
    const broken = spRemoveObjects(p, [p.objects.find((o) => o.kind === 'performer')?.id ?? '']);
    assert.equal(spGuidedSteps(broken, true)[0].done, false);
    assert.equal(spGuidedSteps(broken, true)[4].done, false, 'a packet made earlier does not finish a project that now has a question open');
  });
});

describe('review round 1: one answer for each thing, and a question for each gap', () => {
  it('a DI channel on a DI device has ONE supplier: the device’s', () => {
    const p = four();
    const keysL = byLabel(p, 'Keys L');
    const dev = p.diDevices.find((d) => d.id === keysL.diDeviceId);
    assert.ok(dev);
    const q = spUpdateDiDevice(spUpdateInput(p, keysL.id, { supplier: 'band' }), dev.id, { supplier: 'venue' });
    assert.equal(spInputSupplier(q, byLabel(q, 'Keys L')), 'venue', 'the box is the venue’s, whatever the row says');
    assert.equal(spInputSupplier(q, byLabel(q, 'Kick')), 'venue');
    assert.equal(spInputSupplier(spUpdateInput(q, byLabel(q, 'Kick').id, { supplier: 'band' }), byLabel(q, 'Kick')), 'venue');
  });
  it('the venue is not asked about its own equipment, and one box is asked about once', () => {
    const p = four();
    const open = spSummary(p).open;
    assert.ok(!open.some((x) => /Kick|Snare|Overhead|vocal/.test(x) && /phantom/.test(x)), 'venue microphones');
    assert.ok(!open.some((x) => /Keys/.test(x)), 'the venue’s stereo DI: its type and its phantom power are the venue’s to know');
    // the band’s own DI of unknown type: asked once, on the device’s line
    const mine = spUpdateDiDevice(p, p.diDevices.find((d) => d.channels === 2)?.id ?? '', { supplier: 'band' });
    const lines = spSummary(mine).open.filter((x) => /Keys/.test(x));
    assert.deepEqual(lines, ['Keys stereo DI: passive or active; phantom power']);
  });
  it('every open question knows the row to open', () => {
    const p = spAddExtra(spUpdateMix(four(), four().mixes[0].id, { provider: 'tbc' }), { kind: 'stage-box', label: 'Stage box', supplier: 'tbc' }).p;
    const items = spOpenItems(p);
    assert.ok(items.length >= 3);
    for (const it of items) {
      const list = it.kind === 'input' ? p.inputs : it.kind === 'di' ? p.diDevices : it.kind === 'mix' ? p.mixes : it.kind === 'device' ? p.devices : p.extras;
      assert.ok(list.some((x) => x.id === it.id), it.text);
    }
    const open = spReview(p).filter((i) => i.level === 'open');
    assert.ok(open.every((i) => i.target.id), 'no card that leads nowhere');
    assert.ok(open.some((i) => i.area === 'monitors' && i.target.kind === 'mix'));
    assert.ok(open.some((i) => i.target.kind === 'extra'));
  });
  it('a click sent to the audience on purpose is a question that can be answered, and is asked again if its routing changes', () => {
    const p = four();
    const click = byLabel(p, 'Click');
    const loud = spUpdateInput(p, click.id, { audience: 'audience' });
    const issue = spReview(loud).find((i) => i.rule === 'cue-to-audience');
    assert.ok(issue && issue.actions.includes('cue-audience-ok'));
    const yes = spUpdateInput(loud, click.id, { cueAudienceOk: true });
    assert.ok(!rules(yes).includes('cue-to-audience'));
    const back = spUpdateInput(spUpdateInput(yes, click.id, { audience: 'monitor-only' }), click.id, { audience: 'audience' });
    assert.ok(rules(back).includes('cue-to-audience'), 'an old answer does not cover a new routing');
  });
  it('several devices on one house mix: how the feed reaches them is printed as open', () => {
    const p = four();
    const q = spAddDevice(p, { type: 'wedge', mixId: p.mixes[0].id, label: 'Wedge 3', supplier: 'venue' }).p;
    assert.ok(spSummary(q).open.some((x) => /^M1 .*how its 2 wedges are fed/.test(x)), spSummary(q).open.join(' | '));
    const told = spUpdateMix(q, q.mixes[0].id, { outputs: 'One output, linked to both wedges' });
    assert.ok(!spSummary(told).open.some((x) => /wedges are fed/.test(x)));
  });
  it('gaps that are asked: no band name, no contact, a mix with no device, wireless with no transmitter, a riser nobody is asked for', () => {
    const anon = spFromTemplate('four-piece', { id: 'p', now: NOW });
    assert.ok(rules(anon).includes('no-band-name'));
    assert.ok(rules(anon).includes('no-contact'));
    const named = spEdit(four(), (d) => {
      d.contact.name = 'Sam';
      d.contact.email = 'sam@example.com';
    });
    assert.ok(!rules(named).includes('no-contact') && !rules(named).includes('no-band-name'));
    const hidden = spEdit(named, (d) => {
      d.contact.show.email = false;
    });
    assert.ok(rules(hidden).includes('no-contact'), 'a contact that is not shown in the packet is no contact');
    // a mix with nobody's equipment
    const who = spAddPerformer(named, { name: 'Extra' });
    const bare = spAddMix(who.p, { recipients: [who.id], provider: 'house', delivery: 'wedge' }).p;
    assert.ok(rules(bare).includes('mix-no-device'));
    // wireless in-ears with a pack and no transmitter
    const m3 = named.mixes[2];
    const tx = named.devices.find((d) => d.type === 'iem-tx' && d.mixId === m3.id);
    assert.ok(tx);
    const noTx = spEdit(named, (d) => {
      d.devices = d.devices.filter((x) => x.id !== tx.id);
    });
    assert.ok(rules(noTx).includes('wireless-no-transmitter'));
    // a riser on the plot and none in the list
    const noRiser = spEdit(named, (d) => {
      d.extras = d.extras.filter((e) => e.kind !== 'riser');
    });
    assert.ok(rules(noRiser).includes('riser-not-listed'));
  });
  it('contradictions the band typed are asked about; a fill needs nobody named on it', () => {
    const p = four();
    const bass = byLabel(p, 'Bass DI');
    assert.ok(rules(spUpdateInput(p, bass.id, { phantom: 'required' })).includes('passive-phantom'));
    const line = spUpdateInput(p, bass.id, { capture: 'line' });
    assert.ok(rules(line).includes('di-unused'), 'a DI device that carries nothing');
    const twice = spSetVenueChannel(spSetVenueChannel(p, 'house', bass.id, 'CH 17'), 'house', byLabel(p, 'Kick').id, 'ch 17');
    assert.ok(rules(twice).includes('duplicate-venue-channel'));
    const fill = spAddMix(p, { name: 'Sidefills', delivery: 'sidefill', provider: 'house' });
    const withDev = spAddDevice(fill.p, { type: 'sidefill', mixId: fill.id, label: 'Sidefill SR', supplier: 'venue' }).p;
    assert.ok(!rules(withDev).includes('mix-no-recipient'));
  });
  it('a mix that says “No click” and asks for the click, or the reverse, is a question', () => {
    const p = four();
    assert.ok(!rules(p).includes('click-clash'), 'the example agrees with itself');
    const click = byLabel(p, 'Click');
    const m4 = p.mixes[3];
    assert.ok(m4.instructions.includes('No click'));
    assert.ok(rules(spSetNeed(p, m4.id, click.id, 'primary')).includes('click-clash'));
    const m3 = p.mixes[2];
    assert.ok(m3.instructions.includes('Click required'));
    assert.ok(rules(spSetNeed(p, m3.id, click.id, 'exclude')).includes('click-clash'));
  });
  it('the drum kit symbol is a right-handed kit as the audience sees it', async () => {
    const { spSymbol } = await import('../src/features/stageplot/spSymbols.ts');
    const circles = spSymbol('drum-kit').shapes.filter((x) => x.t === 'circle');
    // snare (r 0.2) on the viewer's right, floor tom (r 0.22) on the viewer's left
    assert.ok(circles.some((c) => c.t === 'circle' && c.r === 0.2 && c.cx > 0));
    assert.ok(circles.some((c) => c.t === 'circle' && c.r === 0.22 && c.cx < 0));
    // one kit, one layout, on screen and on paper (review 2): the stool is
    // the most upstage piece and is white (the drummer's circle sits on it);
    // the cymbals (dashed) are on the audience side of the kick
    const stool = circles.reduce((a, c) => (c.t === 'circle' && a.t === 'circle' && c.cy < a.cy ? c : a));
    assert.ok(stool.t === 'circle' && stool.r === 0.17 && stool.fill === 'paper');
    const kick = circles.find((c) => c.t === 'circle' && c.r === 0.34);
    for (const c of circles) if (c.t === 'circle' && c.dash && kick?.t === 'circle') assert.ok(c.cy > kick.cy, 'a cymbal is downstage of the kick');
    const sym = spSymbol('drum-kit');
    for (const c of circles) if (c.t === 'circle') assert.ok(Math.abs(c.cx) + c.r <= sym.w / 2 + 1e-9 && Math.abs(c.cy) + c.r <= sym.h / 2 + 1e-9, 'inside its footprint');
  });
});

describe('the key of a stage drawing (owner 2026-11-12)', () => {
  it('names every kind of symbol that is on the plot, once each, and nothing that is not', async () => {
    const { spPlotKey, spKeySymbol, spKeyKind } = await import('../src/features/stageplot/spSymbols.ts');
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `k-${t.id}`, now: NOW });
      const key = spPlotKey(p.objects);
      if (t.id === 'blank') {
        assert.deepEqual(key, []);
        continue;
      }
      const kinds = key.map((k) => k.kind);
      assert.equal(new Set(kinds).size, kinds.length, `${t.id}: an entry twice`);
      for (const o of p.objects) {
        const k = spKeyKind(o.kind);
        assert.ok(kinds.includes(k), `${t.id}: ${o.kind} is drawn and is not in the key`);
      }
      for (const k of key) {
        assert.ok(p.objects.some((o) => spKeyKind(o.kind) === k.kind), `${t.id}: ${k.kind} is in the key and not on the plot`);
        assert.ok(k.name.length >= 2);
        const sym = spKeySymbol(k.kind);
        assert.ok(sym.shapes.length > 0 && sym.w > 0 && sym.h > 0, `${k.kind} has a symbol to show`);
      }
      assert.equal(kinds[0], 'performer', 'people are read first');
    }
  });
  it('one entry for one look: a vocal microphone and a microphone on a stand share the entry', async () => {
    const { spPlotKey } = await import('../src/features/stageplot/spSymbols.ts');
    const key = spPlotKey([{ kind: 'vocal-mic' }, { kind: 'mic-stand' }, { kind: 'wedge' }]);
    assert.deepEqual(key.map((k) => k.kind), ['mic-stand', 'wedge']);
    assert.match(key[1].name, /wide side faces the performer/);
  });
});

describe('review round 2 (owner asked for it, 2026-11-12)', () => {
  it('the key: two amplifiers that look alike share one entry, and its wedge is turned like the wedges on the plot', async () => {
    const { spPlotKey, spKeySymbol, spSymbol, spKeyRot } = await import('../src/features/stageplot/spSymbols.ts');
    const key = spPlotKey([{ kind: 'bass-amp' }, { kind: 'guitar-amp' }, { kind: 'wedge' }]);
    assert.deepEqual(key.map((k) => k.kind), ['guitar-amp', 'wedge']);
    assert.equal(key[0].name, 'Amplifier (guitar or bass)');
    assert.deepEqual(spPlotKey([{ kind: 'bass-amp' }]).map((k) => k.name), ['Amplifier (guitar or bass)']);
    // on a plot a wedge is turned 180°, its wide side upstage toward the
    // performer: the key shows it the same way up
    assert.equal(spKeyRot('wedge'), 180);
    const wide = (s: { shapes: readonly { t: string; pts?: number[] }[] }) => {
      const poly = s.shapes.find((x) => x.t === 'poly');
      const pts = poly?.pts ?? [];
      let best = { w: 0, y: 0 };
      for (let i = 0; i + 3 < pts.length; i += 2) {
        if (pts[i + 1] === pts[i + 3] && Math.abs(pts[i] - pts[i + 2]) > best.w) best = { w: Math.abs(pts[i] - pts[i + 2]), y: pts[i + 1] };
      }
      // the closing side
      if (pts[1] === pts[pts.length - 1] && Math.abs(pts[0] - pts[pts.length - 2]) > best.w) best = { w: Math.abs(pts[0] - pts[pts.length - 2]), y: pts[1] };
      return best.y;
    };
    assert.ok(wide(spSymbol('wedge')) > 0, 'the symbol itself: wide side toward the audience at 0°');
    assert.ok(wide(spKeySymbol('wedge')) < 0, 'in the key: wide side upstage, as on the plots');
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `w-${t.id}`, now: NOW });
      for (const o of p.objects) if (o.kind === 'wedge') assert.notEqual(o.rot, 0, `${t.id}: ${o.label} faces its performer, not the audience`);
    }
  });
  it('the examples: one name for an input on the plot and in the list, and no abbreviation left unexplained', () => {
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `n-${t.id}`, now: NOW });
      for (const o of p.objects) {
        if (!o.inputId) continue;
        const i = p.inputs.find((x) => x.id === o.inputId);
        assert.equal(o.label, i?.label, `${t.id}: the plot says "${o.label}" and the list says "${i?.label}"`);
      }
      for (const x of [...p.objects.map((o) => o.label), ...p.inputs.map((i) => i.label)]) assert.doesNotMatch(x, /^(Tpt|Tbn)\b/, `${t.id}: ${x}`);
      for (const i of p.inputs) assert.doesNotMatch(i.label, /^(Guitar|Keys|Bassist|Keyboardist) vocal$/, `${t.id}: ${i.label}`);
    }
    const s = spFromTemplate('salsa', { id: 's', now: NOW });
    assert.ok(s.performers.some((x) => /Coro \(chorus vocal\)/.test(x.role)), 'a non-English term carries its English meaning where it is first met');
    assert.ok(s.inputs.some((x) => x.label === 'Tumba (low conga)'));
    const hand = s.sources.find((x) => x.label === 'Güiro and maracas');
    assert.equal(hand?.performerId, null, 'played by two singers: it belongs to neither one alone');
    const perc = s.mixes.find((m) => m.name === 'Percussion');
    assert.ok(perc && !perc.instructions.includes('Full band'), 'a mix does not ask for "some piano" and "full band" at once');
    const f = four();
    assert.ok(f.mixes.find((m) => m.name === 'Keys, in-ear')?.instructions.includes('Own instrument prominent'), 'a keyboard on in-ears makes no sound on the stage: its player hears it first');
  });
  it('the examples: nothing stands half on the drum riser, and the drummer sits on the stool', async () => {
    const { spObjectBoxM, spSymbol } = await import('../src/features/stageplot/spSymbols.ts');
    for (const id of ['four-piece', 'playback'] as const) {
      const p = spFromTemplate(id, { id: `r-${id}`, now: NOW });
      const kit = p.objects.find((o) => o.kind === 'drum-kit');
      const drummer = p.objects.find((o) => o.kind === 'performer' && o.label === 'Maya');
      assert.ok(kit && drummer);
      const k = spObjectBoxM(p, kit);
      const d = spObjectBoxM(p, drummer);
      const stool = spSymbol('drum-kit').shapes.find((x) => x.t === 'circle' && x.r === 0.17);
      assert.ok(stool && stool.t === 'circle');
      assert.ok(Math.hypot(d.cx - (k.cx + stool.cx), d.cy - (k.cy + stool.cy)) < 0.3, `${id}: the drummer is on the stool`);
      const riser = p.objects.find((o) => o.kind === 'riser');
      if (!riser) continue;
      const r = spObjectBoxM(p, riser);
      for (const o of p.objects) {
        if (o.id === riser.id || o.kind === 'riser') continue;
        const b = spObjectBoxM(p, o);
        const inside = Math.abs(b.cx - r.cx) <= r.w / 2 && Math.abs(b.cy - r.cy) <= r.h / 2;
        const overlap = Math.abs(b.cx - r.cx) < r.w / 2 + b.w / 2 - 0.02 && Math.abs(b.cy - r.cy) < r.h / 2 + b.h / 2 - 0.02;
        if (inside) assert.ok(Math.abs(b.cx - r.cx) + b.w / 2 <= r.w / 2 + 0.05 && Math.abs(b.cy - r.cy) + b.h / 2 <= r.h / 2 + 0.05, `${id}: ${o.label} is on the riser and hangs over its edge`);
        else assert.ok(!overlap, `${id}: ${o.label} stands half on the riser`);
      }
    }
  });
  it('the review: an example title is asked about, and a sentence meant for the band is not printed to the venue', () => {
    const p = four();
    const ex = spReview(p).find((i) => i.rule === 'example-title');
    assert.ok(ex && ex.level === 'ask' && ex.area === 'setup');
    assert.ok(!spReview(spEdit(p, (d) => { d.title = 'Club set'; })).some((i) => i.rule === 'example-title'));
    assert.ok(!spReview(spEdit(p, (d) => { d.title = ''; })).some((i) => i.rule === 'example-title'));
    const c = spReview(p).find((i) => i.rule === 'no-contact');
    assert.ok(c?.packetText && !/nobody to ask/.test(c.packetText));
    for (const i of spReview(p)) if (i.rule === 'to-be-confirmed') assert.doesNotMatch(i.text, /^To be confirmed/, 'the tag already says it');
  });
  it('counts are never printed as zero: all mono, all stereo, or both', async () => {
    const { spMonoStereoWord } = await import('../src/features/stageplot/spDerive.ts');
    assert.equal(spMonoStereoWord(6, 0), 'all mono');
    assert.equal(spMonoStereoWord(0, 4), 'all stereo');
    assert.equal(spMonoStereoWord(1, 0), 'mono');
    assert.equal(spMonoStereoWord(2, 2), '2 mono, 2 stereo');
    assert.match(spTextSummary(spFromTemplate('playback', { id: 'pb', now: NOW })), /Monitor mixes: 4 \(all stereo\)\./);
    assert.doesNotMatch(spTextSummary(spNewProject({ id: 'e', now: NOW })), /Untitled band/);
  });
});

describe('the catalog', () => {
  it('every package states what it assumes, names no brand, and pairs its stereo rows', () => {
    for (const pkg of SP_PACKAGES) {
      assert.ok(pkg.assumes.length > 15, pkg.id);
      const l = pkg.rows.filter((r) => r.side === 'L').length;
      const r = pkg.rows.filter((x) => x.side === 'R').length;
      assert.equal(l, r, `${pkg.id}: an L without an R`);
      for (const row of pkg.rows) assert.ok(/microphone|DI|line output|receiver/i.test(row.equipment), `${pkg.id}: ${row.equipment}`);
    }
  });
  it('the palette has a generic labeled object, so an unusual instrument never blocks a band', () => {
    assert.ok(SP_PALETTE.some((x) => x.kind === 'generic' && x.sized));
    assert.equal(new Set(SP_PALETTE.map((x) => x.kind)).size, SP_PALETTE.length);
  });
  it('inputs are listed once each, house order first', () => {
    const p = spFromTemplate('playback', { id: 'p', now: NOW });
    const all = spAllInputsInOrder(p);
    assert.equal(all.length, p.inputs.length);
    assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  });
});
