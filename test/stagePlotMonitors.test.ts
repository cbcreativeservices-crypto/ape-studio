/**
 * Stage Plot and Channel Designer — the MONITORS area (must-do D60): the
 * words and small decisions in src/screens/lab/stageplot/monitors/monitorPlan.ts,
 * proven with no device against the four-piece, playback and salsa examples.
 *
 * The one idea the area must make unmistakable (owner's handoff, §5 and §11):
 * A MIX IS NOT A DEVICE. So these tests check RELATIONSHIPS a band relies on:
 *   • mixes, monitor feed audio channels ASKED OF THE HOUSE CONSOLE and
 *     monitor devices are three separate numbers, each in its own sentence;
 *   • the middle number holds only what the house console is asked to create:
 *     a mix the band creates in its own rig, a mix on a personal mixer system
 *     and a mix nobody is named to create are said apart and NEVER added in
 *     (review 1, live sound: "feed" reads as something the house sends);
 *   • adding a wedge to a mix changes the wedge count and nothing else;
 *   • a mono mix is 1 audio channel and a stereo mix is 2;
 *   • a name offered for a mix or a device never holds a performer's name, so
 *     renaming a performer leaves nothing stale;
 *   • a click starts as MONITOR ONLY and "Must exclude" in every mix.
 * Then the house copy rules on the area's own source, and the screen guide.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { SCREEN_GUIDE_BUDGET, SCREEN_GUIDE_SECTIONS, SCREEN_INTRO_WORDS } from '../src/features/lab/screenGuide/types.ts';
import { SP_MIX_INSTRUCTIONS } from '../src/features/stageplot/spCatalog.ts';
import { spMonitorTotals } from '../src/features/stageplot/spDerive.ts';
import { spAddMix, spAddPerformer, spEdit, spNewProject, spRemoveDevice, spRemoveMix, spRenumberMixes, spSetNeed, spUpdateInput, spUpdateMix, spUpdatePerformer } from '../src/features/stageplot/spModel.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpDelivery, SpProject } from '../src/features/stageplot/spTypes.ts';
import { SP_GUIDE_MONITORS } from '../src/screens/lab/stageplot/guides/monitors.ts';
import {
  SPM_BRINGS,
  SPM_FEED_HINT,
  SPM_MONITOR_ONLY,
  SPM_NEEDS,
  SPM_OWN_RIG_MEANS,
  SPM_PERSONAL_MIXER_NOTE,
  spmAddDevice,
  spmAddDevicesToMix,
  spmAddMixWithDevices,
  spmAddOwnInstruction,
  spmAudienceLabel,
  spmBandSentence,
  spmBlankDraft,
  spmClickNotes,
  spmCodesInOrder,
  spmCounts,
  spmCueLines,
  spmDeviceFacts,
  spmDeviceGroups,
  spmDeviceStage,
  spmDeviceTags,
  spmDraftLine,
  spmFeedWhy,
  spmHouseOutputNote,
  spmHouseSentence,
  spmList,
  spmMixDevicesLine,
  spmMixGroups,
  spmNeedRows,
  spmNeedSummary,
  spmNeedsTransmitter,
  spmNewDeviceLabel,
  spmNoMonitorByChoice,
  spmOwnInstructions,
  spmPersonalSentence,
  spmRecipients,
  spmRowWord,
  spmShareLine,
  spmSuggestName,
  spmTbcSentence,
  spmToggleInstruction,
  spmUnmonitored,
  spmUsualDevices,
  spmVenueFeedLines,
} from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';

const NOW = 1_800_000_000_000;
const make = (t: 'four-piece' | 'playback' | 'salsa'): SpProject => spFromTemplate(t, { id: `p-${t}`, now: NOW, band: 'The Example Band' });
const mixByCode = (p: SpProject, code: string) => {
  const m = p.mixes.find((x) => x.code === code);
  assert.ok(m, `mix ${code}`);
  return m;
};
const counts = (p: SpProject) => spmCounts(spMonitorTotals(p));
/** The audio channels of every mix, whoever creates it (the sum the middle count must NOT be). */
const allChannels = (p: SpProject) => spMonitorTotals(p).all.channels;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const AREA = 'src/screens/lab/stageplot';
const OWN_FILES = [`${AREA}/MonitorsArea.tsx`, `${AREA}/guides/monitors.ts`, ...readdirSync(new URL(`${AREA}/monitors/`, ROOT)).map((f) => `${AREA}/monitors/${f}`)];

describe('three separate counts: mixes, audio channels asked of the house console, monitor devices by type', () => {
  it('the four-piece example: 4 mixes, 6 audio channels asked of the house, 5 devices of four types (handoff §11)', () => {
    const c = counts(make('four-piece'));
    assert.equal(c.mixes, 4);
    assert.equal(c.houseFeedChannels, 6);
    assert.equal(c.devices, 5);
    assert.deepEqual(
      c.byType.map((x) => `${x.n} ${x.label}`),
      ['2 wedges', '1 wireless in-ear transmitter', '1 in-ear receiver pack', '1 wired headphone amplifier'],
    );
    assert.equal(c.mixLine, '4 mixes: 2 mono, 2 stereo.');
    assert.equal(c.feedLine, '6 monitor feed audio channels are asked of the house console.');
    assert.deepEqual(c.apartLines, [], 'every mix is the house console’s: nothing is apart');
    assert.equal(c.deviceLine, '5 monitor devices: 2 wedges, 1 wireless in-ear transmitter, 1 in-ear receiver pack and 1 wired headphone amplifier.');
  });

  it('a second wedge on M1 changes the wedge count only: not the mixes, not the feed, not the house sentence', () => {
    const p = make('four-piece');
    const before = counts(p);
    const houseBefore = spmHouseSentence(spMonitorTotals(p));
    const m1 = mixByCode(p, 'M1');
    assert.equal(spmNewDeviceLabel(p, 'wedge'), 'Wedge 3');
    const added = spmAddDevice(p, 'wedge', m1.id);
    const q = added.p;
    const after = counts(q);
    assert.equal(after.mixes, before.mixes);
    assert.equal(after.houseFeedChannels, before.houseFeedChannels);
    assert.equal(after.byType.find((x) => x.type === 'wedge')?.n, 3);
    assert.equal(after.devices, before.devices + 1);
    assert.equal(spmHouseSentence(spMonitorTotals(q)), houseBefore);
    assert.equal(q.mixes.length, p.mixes.length);
    assert.equal(q.devices.find((d) => d.id === added.id)?.label, 'Wedge 3');
    // the screen says in words that nothing else moved, and what is still open
    assert.equal(spmShareLine(q, mixByCode(q, 'M1')), '2 wedges share this mix. It is still 1 mix and 1 audio channel. How the feed reaches each one is to be confirmed.');
    assert.equal(spmShareLine(p, m1), '', 'one wedge: nothing is shared');
    // once the band writes how the feed is sent, the open question is gone
    const told = spUpdateMix(q, m1.id, { outputs: 'One output, linked to both wedges' });
    assert.equal(spmShareLine(told, mixByCode(told, 'M1')), '2 wedges share this mix. It is still 1 mix and 1 audio channel.');
    // in the band's own rig, how a feed reaches two devices is the band's own business
    const own = spUpdateMix(q, m1.id, { provider: 'band-console' });
    assert.equal(spmShareLine(own, mixByCode(own, 'M1')), '2 wedges share this mix. It is still 1 mix and 1 audio channel.');
  });

  it('a mono mix is 1 audio channel and a stereo mix is 2: M3 to mono takes the house number from 6 to 5', () => {
    const p = make('four-piece');
    const q = spUpdateMix(p, mixByCode(p, 'M3').id, { format: 'mono' });
    const c = counts(q);
    assert.equal(c.mixes, 4);
    assert.equal(c.houseFeedChannels, 5);
    assert.equal(c.mixLine, '4 mixes: 3 mono, 1 stereo.');
    assert.equal(c.feedLine, '5 monitor feed audio channels are asked of the house console.');
    assert.equal(spmHouseSentence(spMonitorTotals(q)), 'The house console is asked to create 4 mixes (3 mono, 1 stereo): 5 monitor feed audio channels.');
    assert.equal(c.devices, 5, 'the devices did not change');
  });

  it('salsa: six mixes play through nine wedges, and the two numbers are never one', () => {
    const p = make('salsa');
    const c = counts(p);
    assert.equal(c.mixes, 6);
    assert.equal(c.houseFeedChannels, 6);
    assert.equal(c.devices, 9);
    assert.equal(c.mixLine, '6 mixes: 6 mono.');
    assert.equal(c.deviceLine, '9 monitor devices: 9 wedges.');
    const horns = p.mixes.find((m) => m.name === 'Horns');
    assert.ok(horns);
    assert.equal(horns.recipients.length, 4, 'several performers share one mix');
    assert.equal(spmRecipients(p, horns), spmList(horns.recipients.map((id) => p.performers.find((x) => x.id === id)?.name ?? '?')));
    assert.equal(spmMixDevicesLine(p, horns), 'Devices on this mix: Wedge 4 and Wedge 5.');
    assert.match(spmShareLine(p, horns), /^2 wedges share this mix\. It is still 1 mix and 1 audio channel\./);
    assert.deepEqual(
      spmDeviceGroups(p).map((g) => [g.heading, g.brings]),
      [['9 wedges', 'Who brings them: 9 Venue.']],
    );
  });

  it('an empty plan says so in words, with no zero dressed up as a count', () => {
    const blank = spNewProject({ id: 'p-blank', now: NOW });
    const c = counts(blank);
    assert.equal(c.mixLine, 'No mixes yet.');
    assert.equal(c.feedLine, 'No mixes yet, so nothing is asked of the house console.');
    assert.equal(c.deviceLine, 'No monitor devices yet.');
    assert.deepEqual(c.byType, []);
    assert.deepEqual(c.apartLines, []);
    assert.deepEqual(spmMixGroups(blank), []);
  });
});

describe('asked of the house console, apart from what the band creates itself', () => {
  it('four-piece: everything is asked of the house, and the outputs note counts audio channels, not mixes', () => {
    const p = make('four-piece');
    const t = spMonitorTotals(p);
    assert.equal(spmHouseSentence(t), 'The house console is asked to create 4 mixes (2 mono, 2 stereo): 6 monitor feed audio channels.');
    // 4 mixes, 6 audio channels: "one output for each" is 6, and only when said of AUDIO CHANNELS
    assert.match(spmHouseOutputNote(t), /^If each audio channel is carried on its own analog console output, that is 6 outputs\./);
    assert.match(spmHouseOutputNote(t), /to be confirmed with the venue\.$/);
    assert.equal(spmBandSentence(t), '');
    assert.equal(spmPersonalSentence(t), '');
    assert.equal(spmTbcSentence(t), '');
    assert.deepEqual(
      spmMixGroups(p).map((g) => [g.key, g.mixes.map((m) => m.code).join(' ')]),
      [['house', 'M1 M2 M3 M4']],
    );
  });

  it('playback: the band creates all four mixes, so the house number is 0 and the band’s 8 audio channels are said apart', () => {
    const p = make('playback');
    const t = spMonitorTotals(p);
    const c = spmCounts(t);
    assert.equal(c.mixes, 4);
    assert.equal(allChannels(p), 8, 'the four stereo mixes are 8 audio channels in all');
    assert.equal(c.houseFeedChannels, 0, 'and NONE of them is asked of the house console');
    assert.equal(c.feedLine, 'No monitor feed audio channels are asked of the house console.');
    assert.deepEqual(c.apartLines, ['Apart, and not added to that number: 8 audio channels in 4 mixes that your band creates in its own rig.']);
    assert.equal(c.devices, 8);
    assert.deepEqual(
      c.byType.map((x) => `${x.n} ${x.label}`),
      ['4 wireless in-ear transmitters', '4 in-ear receiver packs'],
    );
    assert.equal(spmHouseSentence(t), 'Nothing is asked of the house console: no mix on this list is created there.');
    assert.equal(spmHouseOutputNote(t), '');
    assert.equal(spmBandSentence(t), 'Your band creates 4 mixes in its own rig (4 stereo). That is 8 audio channels that the house console is not asked to create.');
    assert.deepEqual(spmVenueFeedLines(p), ['For M1, M2, M3 and M4, the venue provides: an input split.']);
    const groups = spmMixGroups(p);
    assert.deepEqual(
      groups.map((g) => [g.key, g.mixes.length]),
      [
        ['house', 0],
        ['band', 4],
      ],
    );
    assert.equal(groups[0].sentence, spmHouseSentence(t), 'the house group is there to say "nothing" in words');
    assert.deepEqual(groups[1].notes, [SPM_OWN_RIG_MEANS, ...spmVenueFeedLines(p)]);
    // the transmitters and the packs are part of the band's own rig; a pack names who uses it
    const pack = p.devices.find((d) => d.type === 'iem-pack');
    assert.ok(pack);
    assert.match(spmDeviceFacts(p, pack), /^In-ear receiver pack · On M1 Drums, in-ear · Part of your band’s own rig · Used by \S+/);
    // every wireless in-ear mix has its transmitter, marked wireless: the venue is told radio equipment is coming
    assert.ok(p.mixes.every((m) => !spmNeedsTransmitter(p, m)));
    assert.equal(p.devices.filter((d) => d.wireless).length, 4);
    assert.ok(spmDeviceTags(p.devices.find((d) => d.type === 'iem-tx')!).includes('Wireless: coordination required'));
  });

  it('for a mix the house does not create, the plan says what the venue provides, and keeps "to be confirmed" as its own line', () => {
    const p = make('playback');
    const q = spUpdateMix(spUpdateMix(spUpdateMix(p, mixByCode(p, 'M2').id, { venueFeed: 'tbc' }), mixByCode(p, 'M4').id, { venueFeed: 'none' }), mixByCode(p, 'M3').id, { venueFeed: 'returns' });
    assert.deepEqual(spmVenueFeedLines(q), [
      'For M1, the venue provides: an input split.',
      'For M3, the venue provides: return lines from the house position to the stage.',
      'For M4, the venue provides: no monitor feeds.',
      'For M2, what the venue provides is to be confirmed.',
    ]);
    // a house mix is never in these lines
    assert.deepEqual(spmVenueFeedLines(make('four-piece')), []);
    // each choice is explained in one line, and the band's own rig is explained where it is chosen
    assert.equal(SPM_FEED_HINT.split('\n').length, 4);
    assert.match(SPM_FEED_HINT, /^An input split: a copy of every stage input for your own mixer\./);
    assert.ok(spmFeedWhy('band-console').includes(SPM_OWN_RIG_MEANS));
    assert.ok(!/your band creates/i.test(spmFeedWhy('personal-mixer')), 'a personal mixer system is not called the band’s');
  });

  it('moving one mix to the house console moves one mix and its 2 audio channels into the house number, and nothing else', () => {
    const p = make('playback');
    const q = spUpdateMix(p, mixByCode(p, 'M1').id, { provider: 'house' });
    const t = spMonitorTotals(q);
    const c = spmCounts(t);
    assert.equal(spmHouseSentence(t), 'The house console is asked to create 1 mix (1 stereo): 2 monitor feed audio channels.');
    assert.equal(spmBandSentence(t), 'Your band creates 3 mixes in its own rig (3 stereo). That is 6 audio channels that the house console is not asked to create.');
    assert.equal(c.mixes, 4);
    assert.equal(c.houseFeedChannels, 2);
    assert.equal(c.feedLine, '2 monitor feed audio channels are asked of the house console.');
    assert.deepEqual(c.apartLines, ['Apart, and not added to that number: 6 audio channels in 3 mixes that your band creates in its own rig.']);
    assert.equal(allChannels(q), 8);
  });

  it('a mix nobody is named to create and a mix on a personal mixer system are counted for neither side, each on its own line', () => {
    const p = make('four-piece');
    const q = spUpdateMix(spUpdateMix(p, mixByCode(p, 'M2').id, { provider: 'tbc' }), mixByCode(p, 'M4').id, { provider: 'personal-mixer' });
    const t = spMonitorTotals(q);
    const c = spmCounts(t);
    assert.equal(spmHouseSentence(t), 'The house console is asked to create 2 mixes (1 mono, 1 stereo): 3 monitor feed audio channels.');
    assert.equal(c.houseFeedChannels, 3);
    assert.equal(allChannels(q), 6, 'the plan still holds 6 audio channels');
    assert.deepEqual(c.apartLines, [
      'Apart, and not added to that number: 2 audio channels in 1 mix on a personal mixer system (not mixed on the house console).',
      'Apart, and not added to that number: 1 audio channel in 1 mix, with who creates it still to be confirmed.',
    ]);
    assert.equal(spmBandSentence(t), '', 'a personal mixer system is not "your band’s own rig": a venue may own one');
    assert.equal(spmPersonalSentence(t), '1 mix is made on a personal mixer system (1 stereo), not mixed on the house console. That is 2 audio channels inside that system.');
    assert.equal(spmTbcSentence(t), 'For 1 mix, who creates it is to be confirmed. It is not counted for the house console or for your band’s own rig.');
    const groups = spmMixGroups(q);
    assert.deepEqual(
      groups.map((g) => [g.key, g.title]),
      [
        ['house', 'ASKED OF THE HOUSE CONSOLE'],
        ['personal', 'ON A PERSONAL MIXER SYSTEM'],
        ['tbc', 'WHO CREATES IT: TO BE CONFIRMED'],
      ],
    );
    assert.ok(groups[1].notes.includes(SPM_PERSONAL_MIXER_NOTE));
    assert.equal(groups.reduce((n, g) => n + g.mixes.length, 0), 4, 'every mix is in exactly one group');
  });

  it('in every example and after every change of who creates a mix, the house number is the house console’s own and nothing more', () => {
    for (const t of ['four-piece', 'playback', 'salsa'] as const) {
      let p = make(t);
      for (const provider of ['house', 'band-console', 'personal-mixer', 'tbc'] as const) {
        p = spUpdateMix(p, p.mixes[0].id, { provider });
        const totals = spMonitorTotals(p);
        const c = spmCounts(totals);
        const house = p.mixes.filter((m) => m.provider === 'house').reduce((n, m) => n + (m.format === 'stereo' ? 2 : 1), 0);
        assert.equal(c.houseFeedChannels, house, `${t}/${provider}`);
        const apart = c.apartLines.map((line) => Number(/: (\d+) audio channel/.exec(line)?.[1]));
        assert.equal(house + apart.reduce((a, b) => a + b, 0), totals.all.channels, `${t}/${provider}: every audio channel is said once, in one place`);
        for (const line of c.apartLines) assert.match(line, /^Apart, and not added to that number: /);
      }
    }
  });
});

describe('the usual devices for a delivery: a proposal, shown before it is added', () => {
  const DELIVERIES: SpDelivery[] = ['wedge', 'wired-iem', 'wireless-iem', 'drum-fill', 'sidefill', 'custom'];

  it('the proposals rebuild the worked example’s devices from its own mixes, and no label holds a performer’s name', () => {
    const p = make('four-piece');
    const bare = spEdit(p, (d) => {
      d.devices = [];
    });
    const rows = bare.mixes.flatMap((m) => spmUsualDevices(bare, m));
    assert.deepEqual(
      rows.map((r) => r.type),
      ['wedge', 'wedge', 'iem-tx', 'iem-pack', 'hp-amp'],
    );
    assert.deepEqual(rows.map((r) => r.type).sort(), p.devices.map((d) => d.type).sort());
    const m3 = mixByCode(bare, 'M3');
    assert.deepEqual(
      spmUsualDevices(bare, m3).map((r) => [r.label, r.performerId, r.wireless]),
      [
        ['In-ear transmitter', null, true],
        ['Receiver pack', m3.recipients[0], false],
      ],
    );
    for (const r of rows) for (const pf of p.performers) assert.ok(!r.label.includes(pf.name), `"${r.label}" holds the name ${pf.name}`);
    // the screen still says who a personal device is for, read from the link
    const pack = spmUsualDevices(bare, m3)[1];
    assert.equal(spmRowWord(bare, pack), `Receiver pack for ${p.performers.find((x) => x.id === m3.recipients[0])?.name}`);
  });

  it('a proposal never adds anything, and every delivery has rows with unique keys and unused labels (custom has none)', () => {
    const p = make('four-piece');
    const before = JSON.stringify(p);
    for (const delivery of DELIVERIES) {
      const rows = spmUsualDevices(p, { delivery, recipients: p.performers.map((x) => x.id) });
      assert.equal(new Set(rows.map((r) => r.key)).size, rows.length, `${delivery}: unique keys`);
      assert.equal(new Set(rows.map((r) => r.label)).size, rows.length, `${delivery}: unique labels`);
      if (delivery === 'custom') assert.equal(rows.length, 0);
      else assert.ok(rows.length >= 1, `${delivery}: at least one row`);
      for (const r of rows) assert.ok(!p.devices.some((d) => d.label === r.label), `${delivery}: "${r.label}" is not a label already in use`);
    }
    assert.equal(JSON.stringify(p), before);
    // a new wedge takes the next free number
    assert.equal(spmUsualDevices(p, { delivery: 'wedge', recipients: [] })[0].label, 'Wedge 3');
    // two packs for two people, one transmitter: a pack does not need its own transmitter
    const two = spmUsualDevices(p, { delivery: 'wireless-iem', recipients: p.performers.slice(0, 2).map((x) => x.id) });
    assert.deepEqual(
      two.map((r) => [r.type, r.label]),
      [
        ['iem-tx', 'In-ear transmitter 2'],
        ['iem-pack', 'Receiver pack'],
        ['iem-pack', 'Receiver pack 2'],
      ],
    );
  });

  it('adding a mix with the rows the band kept gives the worked example’s totals; names come from roles, never from people', () => {
    let p = spNewProject({ id: 'p-build', now: NOW });
    const ids: string[] = [];
    for (const [name, role] of [
      ['Sam', 'Guitar and lead vocal'],
      ['Leo', 'Bass'],
      ['Maya', 'Drums'],
      ['Nina', 'Keys'],
    ]) {
      const a = spAddPerformer(p, { name, role });
      p = a.p;
      ids.push(a.id);
    }
    const plan: [number, 'mono' | 'stereo', SpDelivery][] = [
      [0, 'mono', 'wedge'],
      [1, 'mono', 'wedge'],
      [2, 'stereo', 'wireless-iem'],
      [3, 'stereo', 'wired-iem'],
    ];
    for (const [who, format, delivery] of plan) {
      const draft = { ...spmBlankDraft([ids[who]]), format, delivery, provider: 'house' as const };
      p = spmAddMixWithDevices(p, draft, spmUsualDevices(p, draft)).p;
    }
    const c = counts(p);
    assert.equal(c.mixes, 4);
    assert.equal(c.houseFeedChannels, 6);
    assert.deepEqual(
      c.byType.map((x) => `${x.n} ${x.label}`),
      ['2 wedges', '1 wireless in-ear transmitter', '1 in-ear receiver pack', '1 wired headphone amplifier'],
    );
    assert.deepEqual(
      p.mixes.map((m) => `${m.code} ${m.name}`),
      ['M1 Guitar and lead vocal', 'M2 Bass', 'M3 Drums, in-ear', 'M4 Keys, in-ear'],
    );
    assert.deepEqual(
      p.devices.map((d) => [d.label, d.performerId]),
      [
        ['Wedge 1', null],
        ['Wedge 2', null],
        ['In-ear transmitter', null],
        ['Receiver pack', ids[2]],
        ['Headphone amplifier', ids[3]],
      ],
    );
    assert.ok(p.devices.every((d) => d.supplier === 'tbc' && !d.selfContained), 'nobody is guessed to bring a device; house mixes are not the band’s own rig');
    assert.ok(p.devices.every((d) => d.mixId && p.mixes.some((m) => m.id === d.mixId)));
    assert.deepEqual(
      p.devices.filter((d) => d.wireless).map((d) => d.type),
      ['iem-tx'],
      'one radio link is recorded once, on its transmitter',
    );
    // RENAME: nothing made here goes stale, and everything that names a person follows
    const renamed = spUpdatePerformer(p, ids[2], { name: 'Carlos' });
    assert.ok(![...renamed.mixes.map((m) => m.name), ...renamed.devices.map((d) => d.label)].some((s) => /Maya|Carlos/.test(s)));
    assert.equal(spmRecipients(renamed, mixByCode(renamed, 'M3')), 'Carlos');
    assert.match(spmDeviceFacts(renamed, renamed.devices[3]), /Used by Carlos$/);
    // unticking every row adds the mix alone
    const draft = { ...spmBlankDraft([ids[0]]), delivery: 'wedge' as const };
    const alone = spmAddMixWithDevices(p, draft, []);
    assert.equal(alone.p.devices.length, p.devices.length);
    assert.equal(alone.p.mixes.length, p.mixes.length + 1);
    assert.equal(spmDraftLine(draft, 0), 'This adds 1 mix (mono, 1 audio channel) and no device.');
    assert.equal(spmDraftLine({ ...draft, format: 'stereo' }, 2), 'This adds 1 mix (stereo, 2 audio channels) and 2 devices.');
  });

  it('a mix the band creates keeps what the venue provides, and its devices start as the band’s own rig; a personal mixer system’s do not', () => {
    const base = make('four-piece');
    const drummer = base.performers[0].id;
    const draft = { ...spmBlankDraft([drummer]), format: 'stereo' as const, delivery: 'wireless-iem' as const, provider: 'band-console' as const, venueFeed: 'split' as const };
    const r = spmAddMixWithDevices(base, draft, spmUsualDevices(base, draft));
    const mix = r.p.mixes.find((m) => m.id === r.mixId);
    assert.equal(mix?.venueFeed, 'split');
    assert.equal(mix?.code, 'M5');
    assert.ok(r.deviceIds.length === 2 && r.deviceIds.every((id) => r.p.devices.find((d) => d.id === id)?.selfContained));
    // the house is asked for no more than before: not a mix, not an audio channel
    assert.equal(spmHouseSentence(spMonitorTotals(r.p)), spmHouseSentence(spMonitorTotals(base)));
    assert.equal(counts(r.p).houseFeedChannels, counts(base).houseFeedChannels);
    assert.equal(counts(r.p).mixes, counts(base).mixes + 1);
    // a house mix does not carry a venue-feed answer it was never asked
    const house = spmAddMixWithDevices(base, { ...draft, provider: 'house' }, []);
    assert.equal(house.p.mixes.find((m) => m.id === house.mixId)?.venueFeed, 'tbc');
    // a personal mixer system may be the venue's: its devices are not marked as the band's own rig
    const pm = spmAddMixWithDevices(base, { ...draft, provider: 'personal-mixer' }, spmUsualDevices(base, draft));
    assert.equal(pm.p.mixes.find((m) => m.id === pm.mixId)?.venueFeed, 'split');
    assert.ok(pm.deviceIds.every((id) => !pm.p.devices.find((d) => d.id === id)?.selfContained));
  });

  it('a mix made with no device (the review answer’s old path) is offered the same usual devices, and the question then stops', () => {
    const base = make('four-piece');
    const q0 = spRemoveMix(base, mixByCode(base, 'M2').id);
    const who = spmUnmonitored(q0)[0];
    assert.ok(who);
    const made = spAddMix(q0, { recipients: [who.id] });
    assert.ok(spReview(made.p).some((i) => i.rule === 'mix-no-device' && i.target.id === made.id), 'the review asks through what they hear it');
    const mix = made.p.mixes.find((m) => m.id === made.id);
    assert.ok(mix);
    const rows = spmUsualDevices(made.p, mix);
    assert.deepEqual(
      rows.map((r) => r.type),
      ['wedge'],
    );
    const done = spmAddDevicesToMix(made.p, made.id, rows);
    assert.equal(done.deviceIds.length, 1);
    assert.equal(done.p.mixes.length, made.p.mixes.length, 'no mix is added');
    assert.ok(!spReview(done.p).some((i) => i.rule === 'mix-no-device'));
    assert.deepEqual(spmAddDevicesToMix(made.p, 'no-such-mix', rows).deviceIds, []);
  });

  it('a wireless in-ear mix with packs and no transmitter is said, in step with the review', () => {
    const p = make('playback');
    const m1 = mixByCode(p, 'M1');
    const tx = p.devices.find((d) => d.mixId === m1.id && d.type === 'iem-tx');
    assert.ok(tx);
    const q = spRemoveDevice(p, tx.id);
    assert.equal(spmNeedsTransmitter(q, mixByCode(q, 'M1')), true);
    assert.equal(spmNeedsTransmitter(q, mixByCode(q, 'M2')), false);
    assert.deepEqual(
      spReview(q)
        .filter((i) => i.rule === 'wireless-no-transmitter')
        .map((i) => i.target.id),
      q.mixes.filter((m) => spmNeedsTransmitter(q, m)).map((m) => m.id),
    );
    // the fix the popup offers: one transmitter on that mix, wireless, part of the band's own rig
    const fixed = spmAddDevice(q, 'iem-tx', m1.id);
    const added = fixed.p.devices.find((d) => d.id === fixed.id);
    assert.ok(added?.wireless && added.selfContained && added.mixId === m1.id);
    assert.equal(spmNeedsTransmitter(fixed.p, mixByCode(fixed.p, 'M1')), false);
    assert.equal(counts(fixed.p).mixes, 4);
  });

  it('a name is offered from the roles of who is on the mix; a missing role or nobody = no name', () => {
    const p = make('salsa');
    const [a, b] = p.performers;
    assert.ok(a.role && b.role);
    assert.equal(spmSuggestName(p, [a.id, b.id], 'wedge'), `${a.role} and ${b.role}`);
    assert.equal(spmSuggestName(p, [a.id], 'wired-iem'), `${a.role}, in-ear`);
    assert.equal(spmSuggestName(p, [], 'wedge'), '');
    assert.equal(spmSuggestName(p, [], 'sidefill'), 'Sidefill');
    const noRole = spUpdatePerformer(p, a.id, { role: '' });
    assert.equal(spmSuggestName(noRole, [a.id, b.id], 'wedge'), '', 'half a name would say the wrong thing');
    assert.equal(spmList(['M1']), 'M1');
    assert.equal(spmList(['M1', 'M2', 'M3']), 'M1, M2 and M3');
  });
});

describe('what each mix needs to hear: four words, one mix at a time', () => {
  it('one mix’s rows are every input once, in channel order, with the band’s own inputs marked', () => {
    const p = make('four-piece');
    const m1 = mixByCode(p, 'M1');
    const rows = spmNeedRows(p, m1.id);
    assert.equal(rows.length, p.inputs.length);
    assert.deepEqual(
      rows.map((r) => r.badge),
      Array.from({ length: 14 }, (_, k) => String(k + 1)),
    );
    assert.deepEqual(
      rows.filter((r) => r.own).map((r) => r.label),
      ['Guitar cabinet', 'Lead vocal'],
    );
    assert.deepEqual(SPM_NEEDS, ['primary', 'supporting', 'not-needed', 'exclude']);
    assert.deepEqual(spmNeedRows(p, 'no-such-mix'), []);
  });

  it('click carries MONITOR ONLY and starts as "Must exclude" in every mix but the one that asks for it', () => {
    const p = make('four-piece');
    const click = p.inputs.find((i) => i.cue);
    assert.ok(click);
    assert.equal(spmAudienceLabel(click), SPM_MONITOR_ONLY);
    assert.equal(SPM_MONITOR_ONLY, 'MONITOR ONLY: kept out of the audience mix');
    for (const code of ['M1', 'M2', 'M4']) {
      const row = spmNeedRows(p, mixByCode(p, code).id).find((r) => r.inputId === click.id);
      assert.equal(row?.need, 'exclude', code);
      assert.equal(row?.audienceLabel, SPM_MONITOR_ONLY, code);
    }
    assert.equal(spmNeedRows(p, mixByCode(p, 'M3').id).find((r) => r.inputId === click.id)?.need, 'primary');
    assert.deepEqual(
      spmCueLines(p).map((c) => [c.label, c.badge, c.audienceLabel, c.heard]),
      [['Click', '14', SPM_MONITOR_ONLY, 'Heard in M3 (Primary). Must exclude: M1, M2 and M4.']],
    );
    // a NEW mix keeps the click out too
    const draft = spmBlankDraft([p.performers[1].id]);
    const added = spmAddMixWithDevices(p, draft, []);
    assert.equal(spmNeedRows(added.p, added.mixId).find((r) => r.inputId === click.id)?.need, 'exclude');
    // ordinary inputs carry no label
    assert.equal(spmNeedRows(p, mixByCode(p, 'M1').id).filter((r) => r.audienceLabel).length, 1);
  });

  it('a click sent to the audience, answered or not, or left undecided, is labeled just as plainly', () => {
    const p = make('playback');
    const click = p.inputs.find((i) => i.cue);
    assert.ok(click);
    const toAudience = spUpdateInput(p, click.id, { audience: 'audience' });
    assert.equal(spmAudienceLabel(toAudience.inputs.find((i) => i.id === click.id)!), 'CLICK OR CUE: set to go to the AUDIENCE mix');
    const answered = spUpdateInput(toAudience, click.id, { cueAudienceOk: true });
    assert.equal(spmAudienceLabel(answered.inputs.find((i) => i.id === click.id)!), 'CLICK OR CUE: the audience is meant to hear it');
    assert.match(spmAudienceLabel({ cue: true, audience: 'tbc' }) ?? '', /to be confirmed$/);
    assert.equal(spmAudienceLabel({ cue: false, audience: 'audience' }), null);
    assert.equal(spmAudienceLabel({ cue: false, audience: 'monitor-only' }), SPM_MONITOR_ONLY, 'any monitor-only input carries the label');
    // playback: the click feeds only the band monitor rig; it is one row, with that rig's number
    const lines = spmCueLines(p);
    assert.equal(lines.length, 1);
    assert.match(lines[0].badge, /^B\d+$/);
    assert.equal(lines[0].heard, 'Heard in M1 (Primary). Must exclude: M2, M3 and M4.');
  });

  it('the summary counts words, and "no preference" is its own count', () => {
    const p = make('four-piece');
    const m1 = mixByCode(p, 'M1');
    assert.equal(spmNeedSummary(spmNeedRows(p, m1.id)), 'Must exclude: 1 · No preference yet: 13');
    const lead = p.inputs.find((i) => i.label === 'Lead vocal');
    const kick = p.inputs.find((i) => i.label === 'Kick');
    assert.ok(lead && kick);
    const q = spSetNeed(spSetNeed(p, m1.id, lead.id, 'primary'), m1.id, kick.id, 'supporting');
    assert.equal(spmNeedSummary(spmNeedRows(q, m1.id)), 'Primary: 1 · Supporting: 1 · Must exclude: 1 · No preference yet: 11');
    // another mix keeps its own answers
    assert.equal(spmNeedSummary(spmNeedRows(q, mixByCode(q, 'M2').id)), 'Must exclude: 1 · No preference yet: 13');
    assert.equal(spmNeedSummary([]), 'There are no inputs yet.');
  });

  it('short instructions: "Click required" and "No click" cannot both be on, and a clash with the grid is said', () => {
    assert.deepEqual(spmToggleInstruction(['Full band', 'No click'], 'Click required'), ['Full band', 'Click required']);
    assert.deepEqual(spmToggleInstruction(['Click required'], 'No click'), ['No click']);
    assert.deepEqual(spmToggleInstruction(['Full band'], 'Full band'), []);
    assert.deepEqual(spmAddOwnInstruction(['Full band'], '  Less cymbals  '), ['Full band', 'Less cymbals']);
    assert.deepEqual(spmAddOwnInstruction(['Less cymbals'], 'less cymbals'), ['Less cymbals']);
    assert.deepEqual(spmAddOwnInstruction(['Full band'], '   '), ['Full band']);
    assert.deepEqual(spmOwnInstructions(['Full band', 'Less cymbals', SP_MIX_INSTRUCTIONS[0]]), ['Less cymbals']);
    // the salsa pianist's own words are kept as the band's own instruction
    const salsaPiano = make('salsa').mixes.find((m) => m.name === 'Piano');
    assert.ok(salsaPiano);
    assert.deepEqual(spmOwnInstructions(salsaPiano.instructions), ['Bass and congas']);

    const p = make('four-piece');
    const click = p.inputs.find((i) => i.cue);
    assert.ok(click);
    for (const m of p.mixes) assert.deepEqual(spmClickNotes(p, m), [], `${m.code}: the example agrees with itself`);
    const m3 = mixByCode(p, 'M3');
    const m4 = mixByCode(p, 'M4');
    const clashA = spSetNeed(p, m3.id, click.id, 'exclude');
    assert.match(spmClickNotes(clashA, mixByCode(clashA, 'M3'))[0], /“Click required”, and Click is kept out of what it hears/);
    const clashB = spSetNeed(p, m4.id, click.id, 'supporting');
    assert.match(spmClickNotes(clashB, mixByCode(clashB, 'M4'))[0], /“No click”, and Click is set to be heard in it/);
    // a note changes nothing by itself
    assert.equal(mixByCode(clashA, 'M3').instructions.includes('Click required'), true);
    const salsa = make('salsa');
    const noClick = spUpdateMix(salsa, salsa.mixes[0].id, { instructions: ['Click required'] });
    assert.match(spmClickNotes(noClick, noClick.mixes[0])[0], /there is no click or cue input in the input list yet/);
  });
});

describe('devices and performers', () => {
  it('a device says its type, its mix and who uses it; a device with no mix says so; who brings it uses the Inputs area’s words', () => {
    const p = make('four-piece');
    const pack = p.devices.find((d) => d.type === 'iem-pack');
    assert.ok(pack);
    const user = p.performers.find((x) => x.id === pack.performerId);
    assert.ok(user);
    assert.equal(spmDeviceFacts(p, pack), `In-ear receiver pack · On M3 Drums, in-ear · Used by ${user.name}`);
    const q = spRemoveMix(p, mixByCode(p, 'M1').id);
    const wedge = q.devices.find((d) => d.label === 'Wedge 1');
    assert.ok(wedge);
    assert.equal(spmDeviceFacts(q, wedge), 'Wedge · Not on any mix', 'a removed mix leaves its wedge on the list, flagged');
    assert.equal(counts(q).mixes, 3);
    assert.equal(counts(q).devices, 5);
    // the labels are kept (M2, M3, M4) until the band asks to renumber them
    assert.equal(spmCodesInOrder(p), true);
    assert.equal(spmCodesInOrder(q), false);
    assert.equal(spmCodesInOrder(spRenumberMixes(q)), true);
    assert.deepEqual(
      spmDeviceGroups(p).map((g) => [g.heading, g.brings]),
      [
        ['2 wedges', 'Who brings them: 2 Venue.'],
        ['1 wireless in-ear transmitter', 'Who brings it: 1 Band.'],
        ['1 in-ear receiver pack', 'Who brings it: 1 Band.'],
        ['1 wired headphone amplifier', 'Who brings it: 1 Band.'],
      ],
    );
    assert.deepEqual(spmDeviceTags(wedge), ['Venue brings it']);
    assert.deepEqual(SPM_BRINGS, { band: 'Band brings it', venue: 'Venue brings it', other: 'Other provider brings it', tbc: 'To be confirmed who brings it' });
    // the same words as the Inputs area, read from its source (one fact, one wording)
    const inputsWords = read(`${AREA}/inputs/inputsLogic.ts`);
    assert.ok(inputsWords.includes(`'${SPM_BRINGS.tbc}'`) && inputsWords.includes('} brings it`'), 'Inputs words who brings an item the same way');
  });

  it('LOCATE ON THE STAGE finds a device’s symbol, and says when there is none', () => {
    const p = make('four-piece');
    const wedge = p.devices.find((d) => d.label === 'Wedge 1');
    const pack = p.devices.find((d) => d.type === 'iem-pack');
    assert.ok(wedge && pack);
    const at = spmDeviceStage(p, wedge.id);
    assert.ok(at.objectId && p.objects.find((o) => o.id === at.objectId)?.deviceId === wedge.id);
    assert.equal(at.word, 'Downstage center');
    assert.deepEqual(spmDeviceStage(p, pack.id), { objectId: null, word: 'Not on the stage yet' }, 'a pack is worn, not drawn');
  });

  it('a performer with no monitor is asked about, then listed as "by choice", and it agrees with the review', () => {
    const p = make('four-piece');
    assert.deepEqual(spmUnmonitored(p), []);
    const m2 = mixByCode(p, 'M2');
    const who = p.performers.find((x) => x.id === m2.recipients[0]);
    assert.ok(who);
    const q = spRemoveMix(p, m2.id);
    assert.deepEqual(
      spmUnmonitored(q).map((x) => x.id),
      [who.id],
    );
    assert.deepEqual(
      spReview(q)
        .filter((i) => i.rule === 'performer-no-monitor')
        .map((i) => i.target.id),
      spmUnmonitored(q).map((x) => x.id),
    );
    const r = spUpdatePerformer(q, who.id, { noMonitor: true });
    assert.deepEqual(spmUnmonitored(r), []);
    assert.deepEqual(
      spmNoMonitorByChoice(r).map((x) => x.id),
      [who.id],
    );
    // playback: every performer is covered by the band's own rig
    assert.deepEqual(spmUnmonitored(make('playback')), []);
    assert.deepEqual(spmUnmonitored(make('salsa')), []);
  });
});

describe('the area’s own words and wiring', () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const sources = OWN_FILES.map((f) => ({ f, s: strip(read(f)) }));
  const all = sources.map((x) => x.s).join('\n');
  const tsx = sources.filter((x) => x.f.endsWith('.tsx'));

  it('says "audio channels", never "bus"; no "at once"; no "N of M"; US spelling; no payment words; one name per thing', () => {
    for (const { f, s } of sources) {
      assert.ok(!/\bbus(es|ses)?\b/i.test(s), `${f}: says "bus"`);
      assert.ok(!/\bat once\b/i.test(s), `${f}: says "at once"`);
      assert.ok(!/\b\d+ of \d+\b/.test(s), `${f}: progress as "N of M"`);
      assert.ok(!/\b(colour|behaviour|centre|programmes?|grey|labelled|metres?)\b|\b(organis|recognis)/i.test(s), `${f}: US spelling`);
      assert.ok(!/\b(free|upgrade|subscription|premium|paywall)\b/i.test(s), `${f}: no payment words`);
      assert.ok(!/production ready/i.test(s), `${f}: never "production ready"`);
      assert.ok(!/\b\d+(\.\d+)?\s?(MHz|kHz|GHz)\b/.test(s), `${f}: never a radio frequency`);
      // the lab's names (review 1, usability, section 5)
      assert.ok(!/audio program|distinct mix|advance preference|\bmusicians?\b|band member|Supplied by|Who supplies|the venue’s monitor system/i.test(s), `${f}: a name the lab does not keep`);
      assert.ok(!/Locate on stage|Go to Stage|MONITOR ONLY —/.test(s), `${f}: an old label`);
      assert.ok(!/\b(dock|bezel|press(es)? (the|a) key|\bkey\b(?!=))/i.test(s.replace(/key=\{|\bkey:|\.key\b|\(key\b|\bkey\)|keyboardShouldPersistTaps|r\.key|x\.key/g, '')), `${f}: a button is a button, never a key`);
    }
    assert.match(all, /audio channels/);
    assert.match(all, /does not choose radio frequencies/);
  });

  it('capitals: every button label is typed in CAPITALS; chips, field labels and popup titles are not', () => {
    let buttons = 0;
    for (const { f, s } of tsx) {
      for (const m of s.matchAll(/<Button\b[^>]*?\blabel="([^"]+)"/g)) {
        buttons += 1;
        assert.equal(m[1], m[1].toUpperCase(), `${f}: the button "${m[1]}" is not in capitals`);
      }
      for (const m of s.matchAll(/<Button\b[^>]*?\blabel=\{([^}]+)\}/g)) assert.match(m[1], /^(stage\.objectId \? '[A-Z ]+' : '[A-Z ]+'|`EDIT \$\{spmDeviceTitle\(d\)\.toUpperCase\(\)|`EDIT \$\{spmDeviceTitle\(d\).toUpperCase\()/, `${f}: a worked-out button label that may not be in capitals: ${m[1]}`);
      for (const m of s.matchAll(/<(?:Choice|TextField|Switch)\b[^>]*?\blabel="([^"]+)"/g)) assert.notEqual(m[1], m[1].toUpperCase(), `${f}: the field label "${m[1]}" is in capitals`);
      for (const m of s.matchAll(/<SubHeading>([^<{]+)<\/SubHeading>/g)) assert.equal(m[1], m[1].toUpperCase(), `${f}: the sub-heading "${m[1]}"`);
      for (const m of s.matchAll(/<Section\b[^>]*?\btitle="([^"]+)"/g)) assert.equal(m[1], m[1].toUpperCase(), `${f}: the section title "${m[1]}"`);
    }
    assert.ok(buttons >= 15, `${buttons} buttons checked`);
    const area = strip(read(`${AREA}/MonitorsArea.tsx`));
    assert.match(area, /popupTitle = 'Add a mix'/);
    for (const label of ['ADD A MIX', 'EDIT MIX', 'ADD A DEVICE', 'EDIT DEVICE', 'LOCATE ON THE STAGE', 'PLACE ON THE STAGE', 'ASK AGAIN', 'GO TO THIS INPUT']) assert.ok(area.includes(`'${label}'`) || area.includes(`"${label}"`), label);
  });

  it('house rules: no raw Alert, no one-line text without fitValue, every Pressable says what it does, no text under 12 pt', () => {
    for (const { f, s } of sources) {
      assert.ok(!/Alert\.alert/.test(s), `${f}: raw Alert`);
      assert.ok(!/numberOfLines=\{1\}/.test(s) || /fitValue\(/.test(s), `${f}: numberOfLines={1} without fitValue`);
      assert.ok(!/InteractionManager|AsyncStorage/.test(s), `${f}: house helpers only`);
      for (const m of s.matchAll(/<Pressable\b[^>]*>/g)) {
        assert.match(m[0], /accessibilityRole=/, `${f}: a Pressable with no role`);
        assert.match(m[0], /accessibilityLabel=/, `${f}: a Pressable with no label`);
        // a chosen chip says so on a phone AND in a browser (review 1, visual)
        if (/accessibilityState=\{\{ selected \}\}/.test(m[0])) assert.match(m[0], /aria-selected=\{selected\}/, `${f}: the chosen state is not in the page for a browser's screen reader`);
      }
      for (const m of s.matchAll(/fontSize:\s*([\d.]+)/g)) assert.ok(Number(m[1]) >= 12, `${f}: text at ${m[1]} pt is under the 12 pt reading floor`);
    }
    const bits = strip(read(`${AREA}/monitors/bits.tsx`));
    assert.match(bits, /style=\{styles\.tag\} accessible accessibilityLabel=\{text\}/, 'the MONITOR ONLY label is read as its words, not as a symbol');
  });

  it('the area reads its counts from spDerive through monitorPlan, edits only through the editor, and keeps the two lists apart', () => {
    const area = strip(read(`${AREA}/MonitorsArea.tsx`));
    assert.match(area, /export function MonitorsArea\(\)/);
    assert.match(area, /useSpEditor\(\)/);
    assert.match(area, /spMonitorTotals\(p\)/);
    assert.match(area, /spmCounts\(totals\)/);
    assert.ok(!/useState<number>|useState\(0\)/.test(area), 'no stored count');
    for (const { f, s } of tsx) {
      assert.ok(!/\bp\.(mixes|devices|performers|inputs)\.(push|splice|pop|shift|sort)\(/.test(s), `${f}: mutates the project`);
      for (const m of s.matchAll(/\bsp(Update|Remove|Set|Add|Renumber)\w+\(/g)) {
        const at = s.lastIndexOf('\n', m.index) + 1;
        const line = s.slice(at, s.indexOf('\n', m.index));
        assert.match(line, /apply\(\(cur\) =>/, `${f}: an spModel edit outside apply — ${line.trim().slice(0, 80)}`);
      }
      assert.ok(!/confirmDialog/.test(s), `${f}: a removal is asked in place (RemoveStep), as in the Inputs area`);
    }
    // three count boxes at the top; the middle one is the house console's number, with the rest apart
    const iMix = area.indexOf('title="MIXES"');
    const iDev = area.indexOf('title="MONITOR DEVICES"');
    assert.ok(iMix > 0 && iDev > iMix, 'the mix list and the device list are two sections');
    for (const part of ['value={counts.mixes}', 'value={counts.houseFeedChannels}', 'counts.apartLines.map(', 'counts.byType.map(']) assert.ok(area.indexOf(part) > 0 && area.indexOf(part) < iMix, `${part} is in a count box at the top`);
    assert.match(area, /value=\{counts\.houseFeedChannels\} label=\{[^}]*'monitor feed audio channels asked of the house console'\}/);
    assert.ok(!/t(otals)?\.all\.channels|allChannels|feedChannels\b(?!})/.test(area.replace(/houseFeedChannels/g, '')), 'the sum over every mix is not shown as a count');
    // the review answer "Add a monitor mix" opens the same popup as the button, with the performer on it
    assert.match(area, /action === 'add-mix' && kind === 'performer' && id\) setPopup\(\{ kind: 'new-mix', recipients: \[id\] \}\)/);
    // the needs grid is one mix at a time, with the four chips on a tight row, and the label
    const needs = strip(read(`${AREA}/monitors/NeedsPanel.tsx`));
    assert.match(needs, /<ChipRow tight>\s*\{SPM_NEEDS\.map\(/);
    assert.match(needs, /<AudienceTag text=\{row\.audienceLabel\}/);
    assert.match(needs, /SPM_NEEDS_NOTE/);
    assert.ok(!/No preference yet\./.test(needs), 'an empty row is its own message');
    assert.ok(!/Slider|fader=|<Fader/.test(needs), 'never a fader');
    assert.match(area, /<AudienceTag text=\{c\.audienceLabel\}/);
    // a mix with no device is offered its usual devices in the mix popup
    const mixes = strip(read(`${AREA}/monitors/MixSheets.tsx`));
    assert.match(mixes, /spmAddDevicesToMix\(cur, id, spmUsualDevices\(cur, now\)/);
    assert.match(mixes, /hint=\{`\$\{spmFeedWhy\((draft|mix)\.provider\)\}\\n\$\{SPM_FEED_HINT\}`\}/);
  });
});

describe('the Monitors screen guide', () => {
  const g = SP_GUIDE_MONITORS;
  const words = (s: string) => s.trim().split(/\s+/).length;
  const keys = SCREEN_GUIDE_SECTIONS.map((s) => s.key);
  const text = [g.intro?.learning ?? '', g.intro?.start ?? '', ...keys.flatMap((k) => g[k])].join('\n');

  it('shape and budgets: the intro card, five sections, 2–3 TRY THIS, no step scrolls', () => {
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
        const total = items.join('\n').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        assert.ok(total <= cap, `${s.key}: ${total} characters (cap ${cap})`);
      }
    }
  });

  it('house copy rules; every button and section it names is on the screen, in CAPITALS and with no quotation marks', () => {
    assert.ok(/\byou(r|’re|’ll|’ve)?\b/i.test(text), 'speaks to the user');
    assert.ok(!/you(’|')ll (master|build|mix)|you will (master|be able to)/i.test(text), 'knowledge, not skills');
    assert.ok(!/\b(colour|behaviour|centre|programmes?|grey)\b|\b(organis|recognis)/i.test(text), 'US spelling');
    assert.ok(!/\b(research shows|studies show|according to|survey)\b/i.test(text), 'no citations');
    assert.ok(!/\bthis screen (shows|lists|contains)\b/i.test(g.teaches.join(' ')));
    assert.ok(!/\bbus(es)?\b|\bat once\b|audio program|distinct|advance preference/i.test(text));
    assert.ok(!/[“”"]/.test(text), 'a button or a section is named in capitals, with no quotation marks');
    for (const sentence of text.split(/(?<=[.:])\s+/)) assert.ok(words(sentence) <= 26, `a long sentence (${words(sentence)} words): ${sentence}`);
    const screen = [`${AREA}/MonitorsArea.tsx`, `${AREA}/monitors/MixSheets.tsx`, `${AREA}/monitors/DeviceSheets.tsx`, `${AREA}/monitors/NeedsPanel.tsx`, `${AREA}/monitors/monitorPlan.ts`].map(read).join('\n');
    const named = [...new Set([...text.matchAll(/\b[A-Z]+(?: [A-Z]+)+\b/g)].map((m) => m[0]))];
    assert.deepEqual(named.sort(), ['ADD A DEVICE', 'ADD A MIX', 'EDIT MIX', 'GO TO THIS INPUT', 'LOCATE ON THE STAGE', 'MONITOR ONLY', 'WHAT EACH MIX NEEDS TO HEAR']);
    for (const label of named) assert.ok(screen.includes(label), `the guide names ${label}, which is not a label in the Monitors area`);
    // the numbers its experiments promise are the worked example's own
    const p = make('four-piece');
    assert.equal(counts(p).byType[0].n, 2);
    assert.equal(counts(p).mixes, 4);
    const more = counts(spmAddDevice(p, 'wedge', mixByCode(p, 'M1').id).p);
    assert.equal(more.byType[0].n, 3);
    assert.equal(more.mixes, 4);
    assert.equal(counts(p).houseFeedChannels, 6);
    assert.equal(counts(spUpdateMix(p, mixByCode(p, 'M3').id, { format: 'mono' })).houseFeedChannels, 5);
    assert.match(mixByCode(p, 'M3').name, /^Drums/, 'the mix the guide calls "the drums mix"');
  });
});
