/**
 * Screen Guide rollout — Audio Post-Production (owner 2026-10-31) — receipts.
 * The Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts) applied
 * to a Production lab, whose screens are shared with Pre-Production and drawn
 * from data (features/production/labs.ts):
 *
 *   1. every screen the learner reaches has a guide — the home (START A
 *      PROJECT, and an open project), each of the eight stages, each of the
 *      eight exercises, and the Delivery Package — five sections, house rules;
 *   2. every step fits its no-scroll budget;
 *   3. every quoted phrase is a real label, option, finding or screen word, and
 *      each stage guide names that stage's kicker and every section;
 *   4. every TRY THIS outcome — each loudness and true-peak number included —
 *      is replayed through the engine the screens use;
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
  VERDICT_LABEL,
  activityState,
  code,
  homeState,
  labelOf,
  packetModel,
  project,
  runProductionGuideSuite,
  stageState,
  textOf,
} from './_productionScreenGuides.ts';

const LAB = 'postprod' as const;
const g = G.PRODUCTION_SCREEN_GUIDES[LAB];
const SPEC = { 'brief.loudness_target': -16, 'brief.loudness_tolerance': 1, 'brief.true_peak_max': -1 };

runProductionGuideSuite({
  lab: LAB,
  exampleInputs: [],
  stageExperiments: [
    {
      guide: 'brief', at: 0,
      steps: [
        { set: { 'brief.spec_source': 'assumed' }, stage: 'brief', in: ['You are working from an assumed specification'] },
        { set: { 'brief.spec_source': 'written' }, stage: 'brief', out: ['You are working from an assumed specification'] },
      ],
      labels: [['brief', 'spec_source']],
      options: [['brief', 'spec_source', 'assumed'], ['brief', 'spec_source', 'written']],
      says: ['You are working from an assumed specification'],
    },
    {
      guide: 'brief', at: 1,
      steps: [
        { set: { 'brief.true_peak_max': 1 }, stage: 'brief', in: ['That true-peak ceiling looks wrong'] },
        { set: { 'brief.true_peak_max': -1 }, stage: 'brief', out: ['That true-peak ceiling looks wrong'] },
      ],
      labels: [['brief', 'true_peak_max']],
      says: ['That true-peak ceiling looks wrong', 'Enter 1', 'Enter -1'],
    },
    {
      guide: 'brief', at: 2,
      // Frame rate and Start timecode are not asked on a music project.
      pathways: ['podcast', 'live'],
      steps: [
        { set: { 'brief.frame_rate': 'unknown' }, stage: 'brief', in: ['Picture work with no frame rate agreed'], blocked: true },
        { set: { 'brief.frame_rate': 'none' }, stage: 'brief', out: ['Picture work with no frame rate agreed'], blocked: false },
      ],
      labels: [['brief', 'frame_rate'], ['brief', 'start_timecode']],
      options: [['brief', 'frame_rate', 'unknown'], ['brief', 'frame_rate', 'none']],
      says: ['BLOCKED'],
    },
    {
      guide: 'media', at: 0,
      steps: [{ set: { 'media.source_still_intact': 'no' }, stage: 'media', in: ['Sources were cleared before the copy was proven'], blocked: true }],
      labels: [['media', 'source_still_intact']],
      options: [['media', 'source_still_intact', 'no']],
      says: ['BLOCKED', 'Sources were cleared before the copy was proven'],
    },
    {
      guide: 'media', at: 1,
      steps: [
        { set: { 'media.source_still_intact': 'no' }, stage: 'media', blocked: true },
        { set: { 'media.verify_method': ['checksum'], 'media.verify_coverage': 'all' }, stage: 'media', out: ['Sources were cleared before the copy was proven'], blocked: false },
      ],
      labels: [['media', 'verify_method'], ['media', 'verify_coverage']],
      options: [['media', 'verify_method', 'checksum'], ['media', 'verify_coverage', 'all']],
    },
    {
      guide: 'media', at: 2,
      steps: [
        { set: { 'media.source_still_intact': 'no', 'media.verify_method': ['checksum'], 'media.verify_coverage': 'all' }, stage: 'media', out: ['Counting files is not verifying them'] },
        // D41 bug #19: a file count alone is not proof, so the cleared-sources blocker returns.
        { set: { 'media.verify_method': ['file_count'] }, stage: 'media', in: ['Counting files is not verifying them', 'Sources were cleared before the copy was proven'], blocked: true },
      ],
      options: [['media', 'verify_method', 'checksum'], ['media', 'verify_method', 'file_count']],
      says: ['Counting files is not verifying them'],
    },
    {
      guide: 'session', at: 0,
      steps: [
        { set: { 'brief.target_sample_rate': '48000', 'session.session_rate': '44100' }, stage: 'session', in: ['The session rate does not match the delivery rate'] },
        { set: { 'session.session_rate': '48000' }, stage: 'session', out: ['The session rate does not match the delivery rate'] },
      ],
      labels: [['brief', 'target_sample_rate'], ['session', 'session_rate']],
      options: [['brief', 'target_sample_rate', '48000'], ['session', 'session_rate', '44100']],
      says: ['The session rate does not match the delivery rate'],
    },
    {
      guide: 'session', at: 1,
      steps: [{ set: { 'session.recorder_count': 'several_free', 'session.sync_checked_at_end': 'no' }, stage: 'session', in: ['Several recorders on their own clocks', 'Sync was only checked at the start'] }],
      labels: [['session', 'recorder_count']],
      options: [['session', 'recorder_count', 'several_free'], ['session', 'sync_checked_at_end', 'no']],
    },
    {
      guide: 'session', at: 2,
      steps: [
        { set: { 'session.recorder_count': 'several_free', 'session.sync_checked_at_end': 'no' }, stage: 'session', in: ['Several recorders on their own clocks', 'Sync was only checked at the start'] },
        { set: { 'session.sync_checked_at_end': 'yes' }, stage: 'session', out: ['Several recorders on their own clocks', 'Sync was only checked at the start'] },
      ],
      options: [['session', 'sync_checked_at_end', 'yes']],
    },
    {
      guide: 'edit', at: 0,
      steps: [
        { set: { 'edit.alternates_preserved': 'deleted' }, stage: 'edit', in: ['The alternate takes have been removed'] },
        { set: { 'edit.alternates_preserved': 'kept' }, stage: 'edit', out: ['The alternate takes have been removed'] },
      ],
      labels: [['edit', 'alternates_preserved']],
      options: [['edit', 'alternates_preserved', 'deleted'], ['edit', 'alternates_preserved', 'kept']],
      says: ['The alternate takes have been removed'],
    },
    {
      guide: 'edit', at: 1,
      pathways: ['podcast', 'live'],
      steps: [{ set: { 'edit.room_tone_available': 'none' }, stage: 'edit', in: ['Speech edited with no room tone to fill the gaps'] }],
      labels: [['edit', 'room_tone_available']],
      options: [['edit', 'room_tone_available', 'none']],
      says: ['Speech edited with no room tone to fill the gaps'],
    },
    {
      guide: 'edit', at: 2,
      pathways: ['podcast', 'live'],
      steps: [{ set: { 'edit.breaths_kept': 'removed' }, stage: 'edit', in: ['Every breath has been removed'] }],
      labels: [['edit', 'breaths_kept']],
      options: [['edit', 'breaths_kept', 'removed']],
      says: ['Every breath has been removed'],
    },
    {
      guide: 'build', at: 0,
      steps: [
        { set: { 'build.correction_decision': 'not_discussed', 'build.correction_scope': ['pitch'] }, stage: 'build', in: ['A performance is being altered without an agreement to do it'] },
        { set: { 'build.correction_decision': 'agreed' }, stage: 'build', out: ['A performance is being altered without an agreement to do it'] },
      ],
      labels: [['build', 'correction_decision'], ['build', 'correction_scope']],
      options: [['build', 'correction_decision', 'not_discussed'], ['build', 'correction_scope', 'pitch'], ['build', 'correction_decision', 'agreed']],
    },
    {
      guide: 'build', at: 1,
      steps: [{ set: { 'build.ambience_continuous': 'per_clip' }, stage: 'build', in: ['Atmosphere attached to clips rather than laid under them'] }],
      labels: [['build', 'ambience_continuous']],
      options: [['build', 'ambience_continuous', 'per_clip']],
      says: ['Atmosphere attached to clips rather than laid under them'],
    },
    {
      guide: 'build', at: 2,
      steps: [{ set: { 'build.music_edits_musical': 'to_length' }, stage: 'build', in: ['Music cut to a duration rather than to a phrase'] }],
      labels: [['build', 'music_edits_musical']],
      options: [['build', 'music_edits_musical', 'to_length']],
      says: ['Music cut to a duration rather than to a phrase'],
    },
    {
      guide: 'mix', at: 0,
      steps: [
        { set: { 'mix.recombination_test': 'differs' }, stage: 'mix', in: ['The stems do not add up to the mix'], blocked: true },
        { set: { 'mix.recombination_test': 'nulls' }, stage: 'mix', out: ['The stems do not add up to the mix'], blocked: false },
      ],
      labels: [['mix', 'recombination_test']],
      options: [['mix', 'recombination_test', 'differs'], ['mix', 'recombination_test', 'nulls']],
      says: ['BLOCKED', 'The stems do not add up to the mix'],
    },
    {
      guide: 'mix', at: 1,
      steps: [{ set: { 'mix.mix_version_created': 'no' }, stage: 'mix', in: ['Mixing in the edit session'] }],
      labels: [['mix', 'mix_version_created']],
      options: [['mix', 'mix_version_created', 'no']],
      says: ['Mixing in the edit session'],
    },
    {
      guide: 'mix', at: 2,
      steps: [
        { set: {}, stage: 'mix', in: ['The mix has only been heard on one system'] },
        { set: { 'mix.cross_checked': ['headphones', 'phone'] }, stage: 'mix', out: ['The mix has only been heard on one system'] },
      ],
      labels: [['mix', 'cross_checked']],
      options: [['mix', 'cross_checked', 'headphones'], ['mix', 'cross_checked', 'phone']],
      says: ['The mix has only been heard on one system'],
    },
    {
      guide: 'finish', at: 0,
      steps: [
        { set: { ...SPEC, 'finish.measured_integrated': -13.2, 'finish.measured_true_peak': 0.4 }, stage: 'finish', in: ['The program misses its loudness target', 'True peak above the permitted ceiling'], blocked: true },
        { set: { 'finish.measured_integrated': -16.4, 'finish.measured_true_peak': -1.2 }, stage: 'finish', out: ['The program misses its loudness target', 'True peak above the permitted ceiling'], blocked: false },
      ],
      // The three Stage 1 labels are too long to quote whole in one strip; the item names them by their
      // first words, and the BRIEF + FINISH test below pins the labels themselves.
      says: ['loudness target, tolerance and true-peak fields', '-16, 1 and -1', '-13.2 LUFS and 0.4 dBTP as measured', '-16.4 and -1.2', 'two blockers'],
    },
    {
      guide: 'finish', at: 1,
      steps: [
        { set: { ...SPEC, 'finish.measured_true_peak': -1.2, 'finish.measured_integrated': -17 }, stage: 'finish', out: ['The program misses its loudness target'] },
        { set: { 'finish.measured_integrated': -17.1 }, stage: 'finish', in: ['The program misses its loudness target'] },
      ],
      says: ['-17 still passes', '-17.1', 'The program misses its loudness target'],
    },
    {
      guide: 'finish', at: 2,
      steps: [{ set: { 'finish.full_playback_review': 'session' }, stage: 'finish', in: ['Nobody has listened to the deliverable all the way through'], blocked: true }],
      labels: [['finish', 'full_playback_review']],
      options: [['finish', 'full_playback_review', 'session']],
      says: ['BLOCKED'],
    },
    {
      guide: 'deliver', at: 0,
      steps: [
        { set: { 'deliver.approved_version_preserved': 'no' }, stage: 'deliver', in: ['Revisions are being made over the approved version'], blocked: true },
        { set: { 'deliver.approved_version_preserved': 'yes' }, stage: 'deliver', out: ['Revisions are being made over the approved version'], blocked: false },
      ],
      labels: [['deliver', 'approved_version_preserved']],
      options: [['deliver', 'approved_version_preserved', 'no'], ['deliver', 'approved_version_preserved', 'yes']],
      says: ['BLOCKED', 'Revisions are being made over the approved version'],
    },
    {
      guide: 'deliver', at: 1,
      steps: [
        // Before 2 is entered the field is empty and the rule is silent: entering 2 is what makes it APPEAR.
        { set: {}, stage: 'deliver', out: ['One copy is not an archive'] },
        { set: { 'deliver.archive_copies': 2 }, stage: 'deliver', in: ['One copy is not an archive'] },
        { set: { 'deliver.archive_locations': 'Studio drive; offsite drive' }, stage: 'deliver', out: ['One copy is not an archive'] },
      ],
      labels: [['deliver', 'archive_copies'], ['deliver', 'archive_locations']],
      says: ['Enter 2', 'One copy is not an archive', 'appears', 'it clears'],
    },
    {
      guide: 'deliver', at: 2,
      steps: [{ set: { 'deliver.archive_contents': ['session', 'originals'], 'deliver.restore_tested': 'listed' }, stage: 'deliver', in: ['The archive has never been restored'] }],
      labels: [['deliver', 'archive_contents'], ['deliver', 'restore_tested']],
      options: [['deliver', 'restore_tested', 'listed']],
      says: ['The archive has never been restored'],
    },
  ],
  activityExperiments: [
    { activity: 'clarify-the-handoff', at: 0, changes: { 'brief.approval_authority': 'Dana Cole' }, turns: 'One named person is recorded as the approval authority', labels: [['brief', 'approval_authority']] },
    { activity: 'clarify-the-handoff', at: 1, changes: { 'brief.delivery_destination': 'The network ingest portal' }, turns: 'A delivery destination is named', labels: [['brief', 'delivery_destination']] },
    { activity: 'safe-ingest', at: 0, changes: { 'media.originals_read_only': 'locked' }, turns: 'The originals are protected from writing', labels: [['media', 'originals_read_only']], options: [['media', 'originals_read_only', 'locked']] },
    { activity: 'safe-ingest', at: 1, changes: { 'media.conversion_policy': 'on_ingest' }, turns: 'A conversion policy is chosen for the mixed sample rates', labels: [['media', 'conversion_policy']], options: [['media', 'conversion_policy', 'on_ingest']] },
    { activity: 'restore-synchronisation', at: 0, changes: { 'session.sync_checked_at_end': 'yes' }, turns: 'Sync is checked at the end of the longest file', labels: [['session', 'sync_checked_at_end']], options: [['session', 'sync_checked_at_end', 'yes']] },
    { activity: 'restore-synchronisation', at: 1, changes: { 'session.sync_sources': ['manual', 'slate'] }, turns: 'A synchronization source beyond doing it by hand is recorded', labels: [['session', 'sync_sources']], options: [['session', 'sync_sources', 'slate']] },
    { activity: 'repair-without-overprocessing', at: 0, changes: { 'edit.breaths_kept': 'kept' }, turns: 'Breaths are no longer being removed wholesale', labels: [['edit', 'breaths_kept']], options: [['edit', 'breaths_kept', 'kept']] },
    { activity: 'repair-without-overprocessing', at: 1, changes: { 'edit.processing_order': 'Clicks first, then broadband noise, then EQ' }, turns: 'A processing order is written down', labels: [['edit', 'processing_order']] },
    { activity: 'add-without-erasing', at: 0, changes: { 'build.ambience_continuous': 'continuous', 'build.loop_variation': 'varied' }, turns: 'The atmosphere runs as a continuous bed and no longer loops plainly', labels: [['build', 'loop_variation']], options: [['build', 'ambience_continuous', 'continuous'], ['build', 'loop_variation', 'varied']] },
    { activity: 'add-without-erasing', at: 1, changes: { 'build.music_speech_relationship': ['sidechain'] }, turns: 'Something manages the relationship between music and speech', labels: [['build', 'music_speech_relationship']], options: [['build', 'music_speech_relationship', 'sidechain']] },
    { activity: 'route-the-mix', at: 0, changes: { 'mix.master_processing': 'finishing_only' }, turns: 'Master processing is no longer heavy with stems printed beneath it', labels: [['mix', 'master_processing']], options: [['mix', 'master_processing', 'finishing_only']] },
    { activity: 'route-the-mix', at: 1, changes: { 'mix.recombination_test': 'nulls' }, turns: 'The stems recombine into the mix, or the difference is described', labels: [['mix', 'recombination_test']], options: [['mix', 'recombination_test', 'nulls']] },
    { activity: 'meet-the-specification', at: 1, changes: { 'finish.dither_applied': 'once_final' }, turns: 'Dither is decided rather than left unconsidered, and applied at most once', options: [['finish', 'dither_applied', 'once_final']] },
    { activity: 'meet-the-specification', at: 2, changes: { 'finish.measurement_source': 'exported_file' }, turns: 'The measurement is taken from the exported deliverable', labels: [['finish', 'measurement_source']], options: [['finish', 'measurement_source', 'exported_file']] },
    { activity: 'the-upload-succeeded', at: 0, changes: { 'deliver.approved_version_preserved': 'yes' }, turns: 'The approved version is preserved as a session and a print', labels: [['deliver', 'approved_version_preserved']], options: [['deliver', 'approved_version_preserved', 'yes']] },
    { activity: 'the-upload-succeeded', at: 1, changes: { 'deliver.final_approval': 'Approved', 'deliver.approval_record': 'Dana Cole approved v3 by email' }, turns: 'The approval is no longer pending, with a record of who approved what', labels: [['deliver', 'final_approval'], ['deliver', 'approval_record']] },
  ],
});

describe('Audio Post-Production: the home, packet and exercise claims, replayed', () => {
  it('START: a new Podcast project opens at 0 / 100, Not Approved, NEXT OUTSTANDING = Project name in Stage 1 · Receive the Project', () => {
    const { rep, next } = homeState(LAB, project(LAB, 'podcast'));
    assert.equal(rep.score, 0);
    assert.equal(VERDICT_LABEL[LAB][rep.verdict], 'Not Approved');
    assert.deepEqual([next.item.kind, next.item.text, next.num, next.title], ['required', 'Project name', 1, 'Receive the Project']);
    assert.ok(g.start.tryThis[0].includes('0 / 100, Not Approved') && g.start.tryThis[0].includes('Project name in Stage 1 · Receive the Project'));
  });
  it('START: Frame rate and Start timecode are asked on podcast and live only; the two editing sections split by project type', () => {
    for (const f of ['frame_rate', 'start_timecode']) {
      assert.equal(labelOf(LAB, 'music', 'brief', f), undefined, `${f} on music`);
      assert.ok(labelOf(LAB, 'podcast', 'brief', f) && labelOf(LAB, 'live', 'brief', f), `${f} on podcast and live`);
    }
    const edit = LABS[LAB].stages.find((s: { stageId: string }) => s.stageId === 'edit');
    const only = Object.fromEntries(edit.sections.map((s: { title: string; onlyFor?: string[] }) => [s.title, s.onlyFor ?? null]));
    assert.deepEqual(only['Speech and Dialogue Editing'], ['podcast', 'live']);
    assert.deepEqual(only['Music Editing and Comping'], ['music', 'live']);
  });
  it('BRIEF: “No picture on this job” hides Start timecode, with a note naming Frame rate and that answer', () => {
    const s = stageState(LAB, 'podcast', { 'brief.frame_rate': 'none' }, 'brief');
    assert.ok(s.hidden.some((h: { question: string; answer: string }) => h.question === 'Frame rate' && h.answer === 'No picture on this job'));
    assert.equal(s.stage.sections.flatMap((x: { fields: { fieldId: string }[] }) => x.fields).some((f: { fieldId: string }) => f.fieldId === 'start_timecode'), false);
  });
  it('HOME: cleared sources block the project; accepting it on the record moves it to accepted and clears BLOCKED', () => {
    const p = project(LAB, 'music', { 'media.source_still_intact': 'no' });
    const a = homeState(LAB, p);
    assert.equal(a.rep.blockers.length, 1);
    assert.equal(stageState(LAB, 'music', p.values, 'media').signal, 'BLOCKED');
    p.acceptedConditions = [{ ruleId: a.rep.blockers[0].ruleId, acceptedBy: 'Dana Cole', reason: 'The producer confirmed a second copy exists', at: Date.now() }];
    const b = homeState(LAB, p);
    assert.equal(b.rep.blockers.length, 0);
    assert.equal(b.rep.acceptedBlockers.length, 1);
    assert.notEqual(b.rep.stages.find((s: { stageId: string }) => s.stageId === 'media').state, 'conflict');
  });
  it('PACKET: WHAT’S LEFT starts at Stage 1 · Project name; Prepared by follows the supervisor; a Stage 8 blocker jumps to the top', () => {
    const blank = project(LAB, 'music');
    const { left } = homeState(LAB, blank);
    assert.deepEqual([left[0].num, left[0].title, left[0].items[0].kind, left[0].items[0].text], [1, 'Receive the Project', 'required', 'Project name']);
    const ctl = (p: ReturnType<typeof project>) => Object.fromEntries(packetModel(LAB, p).control);
    assert.equal(ctl(blank)['Prepared by'], 'Unattributed');
    assert.equal(labelOf(LAB, 'music', 'brief', 'supervisor'), 'Post-production supervisor');
    assert.equal(ctl(project(LAB, 'music', { 'brief.supervisor': 'Dana Cole' }))['Prepared by'], 'Dana Cole');
    const h = homeState(LAB, project(LAB, 'music', { 'deliver.approved_version_preserved': 'no' }));
    assert.equal(h.left[0].stageId, 'deliver');
    assert.equal(h.left[0].items[0].kind, 'blocker');
    assert.ok(g.packet.tryThis[2].includes(`STAGE 8 · ${h.left[0].title.toUpperCase()}`));
    assert.ok(g.packet.tryThis[0].includes('STAGE 1 · RECEIVE THE PROJECT'));
  });
  it('BRIEF + FINISH: the loudness fields the guides name, and LUFS / dBTP said once in the brief guide', () => {
    assert.equal(labelOf(LAB, 'music', 'brief', 'loudness_target'), 'Integrated loudness target');
    assert.equal(labelOf(LAB, 'music', 'brief', 'loudness_tolerance'), 'Permitted tolerance');
    assert.equal(labelOf(LAB, 'music', 'brief', 'true_peak_max'), 'Maximum true peak');
    assert.ok(g.stages.brief.teaches.join(' ').includes('Integrated loudness (LUFS) is a gated average of the whole program; true peak (dBTP) is the highest peak, even between samples'));
    // The finish item no longer says "Measure … here" (the app measures nothing): the learner enters what was measured.
    assert.ok(!g.stages.finish.tryThis[0].includes('Measure'));
  });
  it('EDIT: the edit guide says "flagged", never "noted" — info findings are drawn exactly like attention ones', () => {
    assert.ok(!textOf(g.stages.edit).includes('noted'));
    const S = code('src/screens/lab/production/ProductionStageScreen.tsx');
    assert.match(S, /style=\{\[styles\.finding, f\.severity === 'blocker' && styles\.findingBlocker\]\}/);
  });
  it('MIX: the routing line is a softened claim, not "most mix problems"', () => {
    assert.ok(!textOf(g.stages.mix).includes('Most mix problems'));
  });
  it('EXERCISE: Meet the specification starts at the numbers its guide quotes, out of specification', () => {
    const a = LABS[LAB].stages.find((s: { stageId: string }) => s.stageId === 'finish').activity;
    assert.equal(a.seed['finish.measured_integrated'], -13.2);
    assert.equal(a.seed['finish.measured_true_peak'], 0.4);
    assert.equal(a.seed['brief.loudness_target'], -16);
    assert.equal(a.seed['brief.loudness_tolerance'], 1);
    assert.equal(a.seed['brief.true_peak_max'], -1);
    assert.ok(activityState(LAB, 'meet-the-specification').unmet.includes('Integrated loudness is within tolerance and true peak is at or below the ceiling'));
    assert.ok(g.activities['meet-the-specification'].tryThis[0].includes('-13.2 LUFS and 0.4 dBTP against -16 ± 1 LU and -1 dBTP'));
    assert.equal(labelOf(LAB, 'podcast', 'finish', 'dither_applied'), 'Dither');
  });
});
