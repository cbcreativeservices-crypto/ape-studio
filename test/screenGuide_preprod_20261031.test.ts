/**
 * Screen Guide rollout — Audio Pre-Production (owner 2026-10-31) — receipts.
 * The Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts) applied
 * to a Production lab, whose screens are shared with Post-Production and
 * drawn from data (features/production/labs.ts):
 *
 *   1. every screen the learner reaches has a guide — the home (START A
 *      PROJECT, and an open project), each of the six stages, each of the six
 *      exercises, and the Production Packet — five sections, the house rules;
 *   2. every step fits its no-scroll budget;
 *   3. every quoted phrase is a real label, option, finding or screen word, and
 *      each stage guide names that stage's kicker and every section;
 *   4. every TRY THIS outcome is replayed through the engine the screens use
 *      (readStage / readProject / checkActivity / buildPacketModel);
 *   5. wiring + CHIP DECISION: a Production lab KEEPS its "practice"
 *      AccuracyNote (owner rule 2026-10-31) and the ⓘ key sits after it.
 *
 * The shared checks live in test/_productionScreenGuides.ts; this file is the
 * lab's own experiments.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  G,
  LABS,
  activityState,
  code,
  columnLabel,
  homeState,
  labelOf,
  optionLabel,
  packetModel,
  project,
  runProductionGuideSuite,
  stageState,
} from './_productionScreenGuides.ts';

const PACKET_MOD = await import('../src/features/production/packet.ts');

const LAB = 'preprod' as const;
const g = G.PRODUCTION_SCREEN_GUIDES[LAB];
const PAST = '2020-01-15';
const vocal = (phantom: string) => ({ in_num: '1', in_source: 'Lead vocal', in_capture: 'condenser_mic', in_phantom: phantom, in_channels: '1' });
const keys = (console: string) => ({ in_num: '2', in_source: 'Keys', in_capture: 'di', in_phantom: 'na', in_channels: '2', in_console: console });
const hazard = (extra: Record<string, string> = {}) => [{ hz_hazard: 'Cable across the fire exit', hz_likelihood: 'medium', hz_severity: 'severe', hz_status: 'open', ...extra }];

runProductionGuideSuite({
  lab: LAB,
  exampleInputs: ['Sam Lee and Alex Ray', 'click', 'finished', 'done'],
  stageExperiments: [
    {
      guide: 'define', at: 0,
      steps: [
        { set: {}, stage: 'define', in: ['Nobody can end this project'] },
        { set: { 'define.approver': 'Sam Lee' }, stage: 'define', out: ['Nobody can end this project', 'More than one person has the final yes'] },
        { set: { 'define.approver': 'Sam Lee and Alex Ray' }, stage: 'define', in: ['More than one person has the final yes'] },
      ],
      labels: [['define', 'approver']],
      says: ['Nobody can end this project', 'More than one person has the final yes'],
    },
    {
      guide: 'define', at: 1,
      steps: [{ set: { 'define.target_date': PAST }, stage: 'define', in: ['The completion date has already passed'], blocked: true }],
      labels: [['define', 'target_date']],
      says: ['BLOCKED', 'The completion date has already passed'],
    },
    {
      guide: 'define', at: 2,
      steps: [
        { set: { 'define.platform': ['livestream'] }, stage: 'define', in: ['A livestream destination with no livestream feed in scope'] },
        { set: { 'define.services': ['livestream_feed'] }, stage: 'define', out: ['A livestream destination with no livestream feed in scope'] },
      ],
      labels: [['define', 'platform'], ['define', 'services']],
      options: [['define', 'platform', 'livestream'], ['define', 'services', 'livestream_feed']],
    },
    {
      guide: 'deliver', at: 0,
      steps: [
        { set: {}, stage: 'deliver', in: ['No deliverables are defined', 'There is no archival master anywhere in the plan'] },
        { set: { 'deliver.deliverable_list': [{ item_name: 'Album master', item_type: 'mastered_program' }] }, stage: 'deliver', out: ['No deliverables are defined'], in: ['There is no archival master anywhere in the plan'] },
      ],
      labels: [['deliver', 'deliverable_list']],
      options: [['deliver', 'deliverable_list', 'mastered_program', 'item_type']],
      says: ['No deliverables are defined', 'There is no archival master anywhere in the plan'],
    },
    {
      guide: 'deliver', at: 1,
      steps: [
        {
          set: { 'deliver.deliverable_list': [{ item_name: 'Album master', item_type: 'mastered_program' }, { item_name: 'Archive', item_type: 'archival_package' }] },
          stage: 'deliver',
          out: ['There is no archival master anywhere in the plan'],
        },
      ],
      options: [['deliver', 'deliverable_list', 'archival_package', 'item_type']],
      says: ['There is no archival master anywhere in the plan'],
    },
    {
      guide: 'deliver', at: 2,
      steps: [
        { set: { 'deliver.silence_means': 'undecided' }, stage: 'deliver', in: ['Nothing says what happens when approval is late'] },
        { set: { 'deliver.silence_means': 'escalate' }, stage: 'deliver', out: ['Nothing says what happens when approval is late'] },
      ],
      labels: [['deliver', 'silence_means']],
      options: [['deliver', 'silence_means', 'undecided']],
    },
    {
      guide: 'people', at: 0,
      steps: [
        { set: { 'people.wireless_channels': 8 }, stage: 'people', in: ['Wireless channels with nobody coordinating them'] },
        { set: { 'people.rf_coordinator': 'Jo Park' }, stage: 'people', out: ['Wireless channels with nobody coordinating them'] },
      ],
      labels: [['people', 'wireless_channels'], ['people', 'rf_coordinator']],
      says: ['Wireless channels with nobody coordinating them', '8'],
    },
    {
      guide: 'people', at: 1,
      steps: [
        { set: { 'people.power_source': 'temporary_distro' }, stage: 'people', in: ['Temporary power with no licensed electrician'], blocked: true },
        { set: { 'people.electrician': 'Lee Ruiz' }, stage: 'people', out: ['Temporary power with no licensed electrician'], blocked: false },
      ],
      labels: [['people', 'power_source']],
      options: [['people', 'power_source', 'temporary_distro']],
      says: ['BLOCKED', 'licensed electrician'],
    },
    {
      guide: 'schedule', at: 0,
      // The rule is authored for music and live only (stage4.data.ts onlyFor).
      pathways: ['music', 'live'],
      steps: [
        { set: { 'define.source_count': 24, 'schedule.available_channels': 16 }, stage: 'schedule', in: ['More sources than the equipment can capture'], blocked: true },
        { set: { 'schedule.available_channels': 24 }, stage: 'schedule', out: ['More sources than the equipment can capture'], blocked: false },
      ],
      labels: [['schedule', 'available_channels']],
      says: ['24', '16', 'BLOCKED', 'More sources than the equipment can capture'],
    },
    {
      guide: 'schedule', at: 1,
      steps: [
        { set: { 'schedule.day_schedule': [{ blk_type: 'soundcheck', blk_start: '14:00', blk_duration: 30 }] }, stage: 'schedule', in: ['There is a soundcheck but no line check'] },
        {
          set: { 'schedule.day_schedule': [{ blk_type: 'line_check', blk_start: '13:30', blk_duration: 30 }, { blk_type: 'soundcheck', blk_start: '14:00', blk_duration: 30 }] },
          stage: 'schedule',
          out: ['There is a soundcheck but no line check'],
        },
      ],
      labels: [['schedule', 'day_schedule']],
      options: [['schedule', 'day_schedule', 'soundcheck', 'blk_type'], ['schedule', 'day_schedule', 'line_check', 'blk_type']],
    },
    {
      guide: 'schedule', at: 2,
      steps: [
        {
          set: { 'schedule.budget_total': 5000, 'schedule.budget_lines': [{ bl_category: 'personnel', bl_amount: 4000 }, { bl_category: 'venue', bl_amount: 1500 }] },
          stage: 'schedule',
          in: ['The lines add up to more than the budget', 'No contingency in the budget'],
        },
        // Why the item says "neither a Contingency line": file the 1500 as
        // Contingency and only the over-budget finding is left (5500 > 5000).
        {
          set: { 'schedule.budget_lines': [{ bl_category: 'personnel', bl_amount: 4000 }, { bl_category: 'contingency', bl_amount: 1500 }] },
          stage: 'schedule',
          in: ['The lines add up to more than the budget'],
          out: ['No contingency in the budget'],
        },
      ],
      labels: [['schedule', 'budget_total']],
      options: [['schedule', 'budget_lines', 'contingency', 'bl_category']],
      says: ['5000', '4000', '1500', 'neither a Contingency line', 'The lines add up to more than the budget', 'No contingency in the budget'],
    },
    {
      guide: 'technical', at: 0,
      steps: [
        { set: { 'technical.input_list': [vocal('off')] }, stage: 'technical', in: ['Phantom power does not match the source'] },
        { set: { 'technical.input_list': [vocal('on')] }, stage: 'technical', out: ['Phantom power does not match the source'] },
      ],
      labels: [['technical', 'input_list']],
      options: [['technical', 'input_list', 'condenser_mic', 'in_capture'], ['technical', 'input_list', 'off', 'in_phantom'], ['technical', 'input_list', 'on', 'in_phantom']],
      says: ['Phantom power does not match the source'],
    },
    {
      guide: 'technical', at: 1,
      steps: [
        { set: { 'technical.input_list': [vocal('on'), keys('9')] }, stage: 'technical', in: ['A stereo source has been given one channel'] },
        { set: { 'technical.input_list': [vocal('on'), keys('9-10')] }, stage: 'technical', out: ['A stereo source has been given one channel'] },
      ],
      options: [['technical', 'input_list', '2', 'in_channels']],
      says: ['A stereo source has been given one channel', '9-10'],
    },
    {
      guide: 'technical', at: 2,
      steps: [
        { set: { 'technical.input_list': [vocal('on'), keys('9-10')], 'schedule.available_channels': 2 }, stage: 'technical', in: ['The input list needs more channels than the equipment has'], blocked: true },
        { set: { 'schedule.available_channels': 3 }, stage: 'technical', out: ['The input list needs more channels than the equipment has'], blocked: false },
      ],
      labels: [['schedule', 'available_channels']],
      says: ['3 channels', 'then come back here', 'BLOCKED'],
    },
    {
      guide: 'readiness', at: 0,
      steps: [
        { set: { 'readiness.hazard_register': hazard() }, stage: 'readiness', in: ['A life-threatening hazard has no preventive action or no owner'], blocked: true },
        { set: { 'readiness.hazard_register': hazard({ hz_control: 'Re-route the run over the door frame', hz_owner: 'Sam Lee' }) }, stage: 'readiness', out: ['A life-threatening hazard has no preventive action or no owner'], blocked: false },
      ],
      labels: [['readiness', 'hazard_register']],
      options: [['readiness', 'hazard_register', 'severe', 'hz_severity']],
      says: ['BLOCKED'],
    },
    {
      guide: 'readiness', at: 1,
      steps: [
        { set: {}, stage: 'readiness', in: ['Nobody is named to decide whether the production continues'] },
        { set: { 'readiness.decision_authority': 'Sam Lee' }, stage: 'readiness', out: ['Nobody is named to decide whether the production continues'] },
      ],
      labels: [['readiness', 'decision_authority']],
      says: ['Nobody is named to decide whether the production continues'],
    },
  ],
  activityExperiments: [
    { activity: 'repair-the-brief', at: 0, changes: { 'define.approver': 'Sam Lee' }, turns: 'A single approver is named', labels: [['define', 'approver']] },
    { activity: 'repair-the-brief', at: 1, changes: { 'define.services': ['recording'], 'define.revisions_included': 2 }, turns: 'At least one service is selected and a revision count is entered', labels: [['define', 'services'], ['define', 'revisions_included']] },
    { activity: 'deliverable-detective', at: 0, changes: { 'deliver.silence_means': 'escalate' }, turns: 'The late-approval outcome is chosen', labels: [['deliver', 'silence_means']], options: [['deliver', 'silence_means', 'undecided']] },
    { activity: 'deliverable-detective', at: 1, changes: { 'deliver.final_approver': 'Sam Lee' }, turns: "One named person replaces 'the board'", labels: [['deliver', 'final_approver']] },
    { activity: 'who-owns-this-task', at: 0, changes: { 'people.media_manager': 'Kim Ortiz', 'people.stage_manager': 'Lou Park' }, turns: 'A media manager is named, and a stage manager on a live show', labels: [['people', 'media_manager'], ['people', 'stage_manager']] },
    { activity: 'who-owns-this-task', at: 1, changes: { 'people.monitor_engineer': 'Priya Shah', 'people.stream_operator': 'Lou Park' }, turns: 'Nobody holds two jobs that happen at the same time', labels: [['people', 'monitor_engineer'], ['people', 'stream_operator']] },
    { activity: 'save-the-production', at: 0, changes: { 'schedule.backup_media': 'Mirror to a second drive during the show; drive B leaves with the producer' }, turns: 'A backup method is described', labels: [['schedule', 'backup_media']] },
    { activity: 'save-the-production', at: 1, changes: { 'schedule.available_channels': 24, 'schedule.spare_inputs': 1 }, turns: 'There are enough channels for the sources, plus a spare', labels: [['schedule', 'available_channels'], ['schedule', 'spare_inputs']] },
    { activity: 'build-the-input-list', at: 1, changes: { 'technical.cue_mixes': [{ cm_who: 'Drummer', cm_on: 'wired', cm_content: 'Click and bass' }] }, turns: 'At least one cue mix exists that carries the click', labels: [['technical', 'cue_mixes']] },
    { activity: 'production-emergency', at: 0, changes: { 'readiness.decision_authority': 'Sam Lee', 'readiness.decision_triggers': 'Recorder lost and no backup inside five minutes: pause' }, turns: 'A decision authority is named, with the triggers written down', labels: [['readiness', 'decision_triggers']] },
    { activity: 'production-emergency', at: 1, changes: { 'readiness.minimum_viable': 'Two vocal mics and the recorder; the stream drops first' }, turns: 'The simplest version is described, and it still keeps the live recording', labels: [['readiness', 'minimum_viable']] },
  ],
});

describe('Audio Pre-Production: the home, packet and exercise claims, replayed', () => {
  it('START: a new Music recording project opens at 0 / 100, Not Ready for Production, NEXT OUTSTANDING = Project name in Stage 1 · Define the Project', () => {
    const { rep, next } = homeState(LAB, project(LAB, 'music'));
    assert.equal(rep.score, 0);
    assert.equal(rep.verdict, 'not_ready');
    assert.deepEqual([next.item.kind, next.item.text, next.num, next.title], ['required', 'Project name', 1, 'Define the Project']);
    // The home draws NEXT OUTSTANDING as the item's text over `Stage n · title`.
    assert.match(code('src/screens/lab/production/ProductionLabScreen.tsx'), /\{`Stage \$\{next\.num\} · \$\{next\.title\}`\}/);
    assert.ok(g.start.tryThis[0].includes('0 / 100, Not Ready for Production') && g.start.tryThis[0].includes('Project name in Stage 1 · Define the Project'));
  });
  it('START: the labels the start guide contrasts are each pathway’s own', () => {
    assert.equal(labelOf(LAB, 'music', 'define', 'size_estimate'), 'How many songs?');
    assert.equal(labelOf(LAB, 'podcast', 'define', 'size_estimate'), 'How many episodes?');
    assert.equal(labelOf(LAB, 'music', 'define', 'source_count'), 'Simultaneous sources to record');
    assert.equal(labelOf(LAB, 'live', 'define', 'source_count'), 'Inputs from the stage');
    const t = [...g.start.changes, ...g.start.tryThis].join(' ');
    for (const s of ['How many songs?', 'How many episodes?', 'Simultaneous sources to record', 'Inputs from the stage']) assert.ok(t.includes(s), s);
  });
  it('START: the people and emergency exercises are the live-only ones', () => {
    const only = Object.fromEntries(LABS[LAB].stages.map((s: { stageId: string; activity: { onlyFor?: string[] } }) => [s.stageId, s.activity.onlyFor ?? null]));
    assert.deepEqual(only.people, ['live']);
    assert.deepEqual(only.readiness, ['live']);
  });
  it('HOME: a past finish date blocks the project; accepting it on the record moves it to accepted and clears BLOCKED', () => {
    const p = project(LAB, 'music', { 'define.target_date': PAST });
    const a = homeState(LAB, p);
    assert.equal(a.rep.blockers.length, 1, 'ONE THING BLOCKS THIS PROJECT — one blocker');
    assert.equal(stageState(LAB, 'music', p.values, 'define').signal, 'BLOCKED');
    const ruleId = a.rep.blockers[0].ruleId;
    p.acceptedConditions = [{ ruleId, acceptedBy: 'Sam Lee', reason: 'The client moved the date in writing', at: Date.now() }];
    const b = homeState(LAB, p);
    assert.equal(b.rep.blockers.length, 0);
    assert.equal(b.rep.acceptedBlockers.length, 1);
    assert.notEqual(b.rep.stages.find((s: { stageId: string }) => s.stageId === 'define').state, 'conflict');
    assert.match(code('src/screens/lab/production/ReadinessMeter.tsx'), /'ONE THING BLOCKS THIS PROJECT'/);
    // PICK UP WHERE YOU LEFT OFF comes from the write that saved the answer.
    assert.match(code('src/features/production/projectStore.ts'), /lastStageId: stageId/);
  });
  it('PACKET: WHAT’S LEFT starts at Stage 1 · Project name; Prepared by follows the project lead; a Stage 6 blocker jumps to the top', () => {
    const blank = project(LAB, 'music');
    const { left } = homeState(LAB, blank);
    assert.deepEqual([left[0].num, left[0].title, left[0].items[0].kind, left[0].items[0].text], [1, 'Define the Project', 'required', 'Project name']);
    const ctl = (p: ReturnType<typeof project>) => Object.fromEntries(packetModel(LAB, p).control);
    assert.equal(ctl(blank)['Prepared by'], 'Unattributed');
    assert.equal(ctl(blank)['Revision'], '0 — not exported yet');
    assert.equal(labelOf(LAB, 'music', 'define', 'project_lead'), 'Producer or project lead');
    assert.equal(ctl(project(LAB, 'music', { 'define.project_lead': 'Sam Lee' }))['Prepared by'], 'Sam Lee');
    const h = homeState(LAB, project(LAB, 'music', { 'readiness.hazard_register': hazard() }));
    assert.equal(h.left[0].stageId, 'readiness');
    assert.equal(h.left[0].items[0].kind, 'blocker');
    assert.ok(g.packet.tryThis[2].includes(`STAGE 6 · ${h.left[0].title.toUpperCase()}`));
    assert.ok(g.packet.tryThis[0].includes('STAGE 1 · DEFINE THE PROJECT') && g.packet.tryThis[1].includes('“Producer or project lead”'));
  });
  it('EXERCISES: the counts and starting states the guides quote', () => {
    // Build the input list: 17 rows, 19 channels, 16 available.
    const a = LABS[LAB].stages.find((s: { stageId: string }) => s.stageId === 'technical').activity;
    const list = a.seed['technical.input_list'] as { in_channels?: string }[];
    assert.equal(list.length, 17);
    assert.equal(list.reduce((n, r) => n + (Number(r.in_channels) || 1), 0), 19);
    assert.equal(a.seed['schedule.available_channels'], 16);
    assert.ok(activityState(LAB, 'build-the-input-list').unmet.includes('The summed channel count is no more than the channels available'));
    assert.ok(g.activities['build-the-input-list'].tryThis[0].includes('17 rows needing 19 channels on a 16-channel system'));
    assert.equal(columnLabel(LAB, 'technical', 'cue_mixes', 'cm_content'), 'What they need in it');
    // Save the production: exactly the two checks the guide names pass on the fresh copy.
    assert.deepEqual(activityState(LAB, 'save-the-production').met, ['The blocks fit between the call and the hard out', 'The live recording is still in the services']);
    // …and its second experiment: Stage 1 lists 24 sources, and the channels fix works on every project type.
    assert.equal(LABS[LAB].stages.find((s: { stageId: string }) => s.stageId === 'schedule').activity.seed['define.source_count'], 24);
    for (const pw of ['music', 'podcast', 'live'] as const) {
      assert.ok(activityState(LAB, 'save-the-production', { 'schedule.available_channels': 24, 'schedule.spare_inputs': 1 }, pw).met.includes('There are enough channels for the sources, plus a spare'), pw);
    }
    assert.ok(g.activities['save-the-production'].tryThis[1].startsWith('Stage 1 lists 24 sources.'));
    // Who owns this task: Dana holds the three on-the-day jobs the guide says.
    const own = LABS[LAB].stages.find((s: { stageId: string }) => s.stageId === 'people').activity.seed;
    assert.deepEqual([own['people.engineer_primary'], own['people.monitor_engineer'], own['people.stream_operator']], ['Dana', 'Dana', 'Dana']);
    // No exercise TRY THIS is a pointer to READ THE REASONING (it is in WHAT YOU CONTROL).
    for (const [id, gd] of Object.entries(g.activities as Record<string, { tryThis: string[] }>)) assert.ok(!gd.tryThis.join(' ').includes('READ THE REASONING'), id);
  });
  it('TABLE COLUMNS quoted in TRY THIS are the screen’s column labels', () => {
    assert.equal(columnLabel(LAB, 'technical', 'input_list', 'in_capture'), 'Captured by');
    assert.equal(columnLabel(LAB, 'technical', 'input_list', 'in_phantom'), 'Phantom power');
    assert.equal(columnLabel(LAB, 'technical', 'input_list', 'in_channels'), 'Channels this source needs');
    assert.equal(columnLabel(LAB, 'technical', 'input_list', 'in_console'), 'Console channel');
    assert.equal(columnLabel(LAB, 'readiness', 'hazard_register', 'hz_severity'), 'Severity if it happens');
    assert.equal(columnLabel(LAB, 'readiness', 'hazard_register', 'hz_control'), 'Preventive action');
    assert.equal(columnLabel(LAB, 'readiness', 'hazard_register', 'hz_owner'), 'Owner');
    assert.equal(columnLabel(LAB, 'deliver', 'deliverable_list', 'item_type'), 'Type');
    assert.equal(optionLabel(LAB, 'technical', 'input_list', 'off', 'in_phantom'), 'Off');
    const t = (id: string) => g.stages[id].tryThis.join(' ');
    for (const s of ['Captured by', 'Phantom power', 'Channels this source needs', 'Console channel']) assert.ok(t('technical').includes(s), s);
    for (const s of ['Severity if it happens', 'Preventive action', 'Owner']) assert.ok(t('readiness').includes(s), s);
  });
});

// ── Review round 2026-10-31: each claim a reviewer challenged, pinned to the code it was checked against.
// Both labs draw these screens from one engine and one parts file, so the shared claims are pinned once, here.
describe('Production guides: the challenged claims, checked against the screens and the engine', () => {
  const { buildPacketHtml } = PACKET_MOD;
  it('PACKET: the title and verdict print; WHAT’S LEFT and the project type do not; on screen WHAT’S LEFT and SHARE AS PDF sit above the control table', () => {
    const p = project(LAB, 'live', { 'readiness.hazard_register': hazard() });
    const { rep, resolved } = homeState(LAB, p);
    const m = packetModel(LAB, p);
    const html: string = buildPacketHtml({ project: p, stages: resolved, report: rep });
    assert.ok(html.includes(m.title) && html.includes(m.verdictLine.replace(/&/g, '&amp;')));
    assert.ok(!/WHAT.S LEFT/i.test(html), 'WHAT’S LEFT is screen-only');
    assert.ok(!html.includes('Live performance or event'), 'the project type is screen-only');
    const K = code('src/screens/lab/production/ProductionPacketScreen.tsx');
    const at = (s: string) => K.indexOf(s);
    assert.ok(at('WHAT’S LEFT') < at('SHARE AS PDF') && at('SHARE AS PDF') < at('built.model.control.map'));
    for (const gd of [g.packet, G.PRODUCTION_SCREEN_GUIDES.postprod.packet]) {
      assert.ok(gd.seeing[0].includes('Its title, verdict and all below SHARE AS PDF print; the type and WHAT’S LEFT do not.'));
      assert.ok(!gd.seeing.join(' ').includes('what you read here is what prints'));
    }
  });
  it('STAGE ‹: the stage screen pops one screen, and the lab home, an exercise and the packet all open it', () => {
    assert.match(code('src/screens/lab/production/ProductionStageScreen.tsx'), /onPress=\{\(\) => safeGoBack\(navigation\)\}/);
    for (const f of ['ProductionLabScreen', 'ProductionActivityScreen', 'ProductionPacketScreen']) {
      assert.match(code(`src/screens/lab/production/${f}.tsx`), /navigation\.navigate\('ProductionStage'/, f);
    }
    for (const st of Object.values(g.stages as Record<string, { control: string[] }>)) {
      assert.ok(st.control.join(' ').includes('‹ goes back to what opened this stage: the lab home, the packet or an exercise.'));
    }
  });
  it('DOTS + FINDINGS: optional-and-blank is amber, required-and-open grey, n/a darker grey; a blocker finding has a red edge, the rest amber', () => {
    assert.match(code('src/features/production/readiness.ts'), /else if \(d === 'no'\) state = f\.required \? 'missing' : 'attention';/);
    const F = code('src/screens/lab/production/FieldRow.tsx');
    for (const re of [/complete: colors\.green/, /attention: colors\.amber/, /missing: colors\.textMuted,/, /conflict: colors\.red/, /na: colors\.textMutedDeep/]) assert.match(F, re);
    const S = code('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(S, /finding: \{[^}]*borderLeftColor: colors\.amber/);
    assert.match(S, /findingBlocker: \{ borderLeftColor: colors\.red \}/);
    const st = g.stages.define as { seeing: string[]; control: string[] };
    assert.ok(st.seeing.join(' ').includes('amber flagged or optional and blank') && st.seeing.join(' ').includes('dark grey not applicable'));
    assert.ok(st.control.join(' ').includes('WHAT THIS PLAN IS STILL MISSING (red edge: a blocker; amber: flagged)'));
  });
  it('SCORE: each attention finding costs 0.02 (2 points), capped at 0.2 and at 40% of what is earned; a blocker caps the score at 99', () => {
    const R = code('src/features/production/readiness.ts');
    assert.match(R, /const attention = findings\.filter\(\(f\) => f\.severity === 'attention'\)\.length;/);
    assert.match(R, /const penalty = Math\.min\(0\.2, attention \* 0\.02, base \* 0\.4\);/);
    assert.match(R, /export const BLOCKED_CEILING = 99;/);
    for (const gd of [g.home, G.PRODUCTION_SCREEN_GUIDES.postprod.home]) assert.ok(gd.changes.join(' ').includes('Each flagged finding costs up to 2 points (20 max)'));
  });
  it('START: the input-list exercise is Music and Live only, and the guide says so', () => {
    const only = Object.fromEntries(LABS[LAB].stages.map((s: { stageId: string; activity: { onlyFor?: string[] } }) => [s.stageId, s.activity.onlyFor ?? null]));
    assert.deepEqual(only.technical, ['music', 'live']);
    assert.ok(g.start.changes.join(' ').includes('the input-list exercise is for Music and Live'));
  });
  it('PEOPLE: the rigger is asked, and its blocker fires, on Live only; the electrician on every type', () => {
    assert.equal(labelOf(LAB, 'music', 'people', 'rigger'), undefined);
    assert.equal(labelOf(LAB, 'live', 'people', 'rigger'), 'Qualified rigger');
    assert.ok(stageState(LAB, 'live', { 'people.rigging_required': 'yes' }, 'people').titles.includes('Something is being flown and no qualified rigger is named'));
    assert.ok(g.stages.people.changes.join(' ').includes('on a live show, a qualified rigger'));
  });
  it('TECHNICAL: a condenser marked phantom “Not applicable” (its own supply) is not flagged; the guide no longer says every condenser needs phantom', () => {
    const row = { in_num: '1', in_source: 'Vocal', in_capture: 'condenser_mic', in_phantom: 'na', in_channels: '1' };
    assert.ok(!stageState(LAB, 'music', { 'technical.input_list': [row] }, 'technical').titles.includes('Phantom power does not match the source'));
    assert.ok(g.stages.technical.teaches.join(' ').includes('Most condensers and active ribbons need phantom power (a tube condenser has its own supply)'));
  });
  it('TECHNICAL #3: the channel block shows on Stage 5, not on Stage 4 where the number is typed', () => {
    const v = { 'technical.input_list': [vocal('on'), keys('9-10')], 'schedule.available_channels': 2 };
    for (const pw of ['music', 'podcast', 'live'] as const) {
      assert.equal(stageState(LAB, pw, v, 'technical').signal, 'BLOCKED');
      assert.notEqual(stageState(LAB, pw, v, 'schedule').signal, 'BLOCKED');
    }
  });
});
