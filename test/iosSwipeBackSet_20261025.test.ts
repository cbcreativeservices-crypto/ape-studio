/**
 * The iPhone swipe-back set is a DECISION, not a default (owner 2026-08-11:
 * off app-wide because the edge swipe stole slider drags; 2026-10-25: groups
 * A+B of Downloads/2026-10-25_IPHONE_SWIPE_BACK_AUDIT approved — screens audited
 * clean of sliders, knobs, drags and sideways lists, or guarded by a "discard
 * unsaved changes?" beforeRemove). Group C (calculator workspace, production
 * activity, RT60, spectrogram) stays off. A screen gains or loses the swipe only
 * by changing this list on purpose.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const nav = readFileSync(join(process.cwd(), 'src/navigation/RootNavigator.tsx'), 'utf8').replace(/\r\n/g, '\n');

const PILOT = [
  'AwardProgress', 'ToolInfo', 'ToolLearn', 'ConceptModule', 'ToolLibrary', 'AudioLearning', 'EarLab',
  'LabCategory', 'TubeReference', 'AmplitudeLab', 'CareerFinder', 'CareerFinderResults', 'CareerFamily',
  'CareerFamilyList', 'CareerFinderAbout', 'StartHereTerms',
];
const APPROVED_2026_10_25 = [
  // A — lab menus
  'DigitalLab', 'WaveLab', 'MeterLab', 'EqLabHome', 'GainLabHome', 'SoundSystemsLab', 'SmartProcessorsLab', 'EarTrainingLab',
  // A — mixing guides, production labs
  'MixingGuides', 'MixingGuide', 'PreProdLab', 'PostProdLab', 'ProductionLab', 'ProductionStage', 'ProductionPacket',
  // A — calculators, other
  'CalcLab', 'CalcSymbolsKey', 'CalcWorkflows', 'CalcResults', 'ToolsHub', 'AudioCommunityDirectory', 'CareerFinderQuiz',
  // B — guarded by a discard-changes beforeRemove
  'CalcWorkflowEdit', 'CalcWorkflowRun', 'CalcProjects',
];
const GROUP_C_OFF = ['CalcWorkspace', 'ProductionActivity', 'Rt60Live', 'SpectrogramLive'];

function swipeScreens(): string[] {
  const out: string[] = [];
  for (const m of nav.matchAll(/<Stack\.Screen\s+name="(\w+)"([\s\S]*?)\/>/g)) {
    if (/options=\{swipe\}|\.\.\.swipe\b|gestureEnabled: true/.test(m[2])) out.push(m[1]);
  }
  return out.sort();
}

test('exactly the pilot pages + the 25 approved screens have the iPhone swipe', () => {
  assert.deepEqual(swipeScreens(), [...PILOT, ...APPROVED_2026_10_25].sort());
});

test('group C stays off', () => {
  const on = new Set(swipeScreens());
  for (const n of GROUP_C_OFF) assert.equal(on.has(n), false, n);
});

test('the default is still off app-wide', () => {
  assert.match(nav, /screenOptions=\{\{ headerShown: false, gestureEnabled: false/);
});
