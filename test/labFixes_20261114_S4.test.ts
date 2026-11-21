/**
 * Lab fix round 1, phase 2, group S4 (2026-11-14): the END SCREEN recap and
 * the next-lab card, filled in for EVERY lab on the Labs menu.
 *
 * Owner approval: "Begin fixing all bugs found and do obvious (my decision is
 * not required) fixes as you suggested in the report", then the report's
 * suggested order, item 6 "The end screen recap" (section 3 row 5).
 *
 * What this pins (S2's test pins the shared rules; this adds the per-lab ones):
 *   1. every Labs-menu lab has an entry, under the id its end screen looks up;
 *   2. every key in labEndContent.ts is a real end-screen id: either a host
 *      already passes it (scanned from the source), or it is a PENDING host
 *      named in S4_REPORT.md as a SHARED NEED (a wrong key shows nothing);
 *   3. every next lab is a real Labs-menu route with no params (the card calls
 *      navigate(route) bare), titled as the menu titles it, never the lab
 *      itself, and no two labs point at each other;
 *   4. recaps are 3–5 lines of knowledge (never skills), ≤ 30 words, US spelling.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LAB_END_CONTENT } from '../src/features/lab/labEndContent.ts';

const read = (p: string) => readFileSync(p, 'utf8').split('\r\n').join('\n');

// ── The Labs menu, read from the catalog source ───────────────────────────
const CATALOG = read('src/screens/lab/labCatalog.ts');
/** route → the name the Labs menu shows (first appearance wins). */
const MENU = new Map<string, string>();
// A leaf's name, then its route before the next name (one line or several).
// The Calculator Laboratory has its own Home card and is not on the Labs menu.
for (const m of CATALOG.matchAll(/name: '([^']+)',((?:(?!name: ')[\s\S]){0,700}?)route: '(\w+)'/g)) {
  if (m[3] !== 'CalcLab' && !MENU.has(m[3])) MENU.set(m[3], m[1]);
}
// The Miking family tiles are built from the registry; they all open MikingHub.
const MIKING_FAMILIES = [...read('src/screens/lab/miking/data/registry.ts').matchAll(/\{ id: '(\w+)', num: \d+,/g)].map((m) => m[1]);
MENU.set('MikingHub', 'Miking Labs');

// ── Sound Systems: one end screen per mode (the hub has none of its own) ──
const SS_MODES: Record<string, { route: string; title: string }> = {
  'sound-systems-learn': { route: 'SoundSystemsLearn', title: 'Sound Systems · Learn' },
  'sound-systems-build': { route: 'SoundSystemsBuild', title: 'Sound Systems · Build' },
  'sound-systems-route': { route: 'SoundSystemsRoute', title: 'Sound Systems · Route' },
  'sound-systems-operate': { route: 'SoundSystemsOperate', title: 'Sound Systems · Operate' },
  'sound-systems-troubleshoot': { route: 'SoundSystemsTroubleshoot', title: 'Sound Systems · Troubleshoot' },
};

/** Labs-menu route → the end-screen id(s) its end screen looks up. */
const ROUTE_KEYS: Record<string, readonly string[]> = {
  AmplitudeLab: ['af_amplitude'],
  FoundationsCourse: ['af_foundations'],
  FoundationsPlayground: ['af_sound_playground'],
  MicLab: ['af_mic_principles'],
  WaveLab: ['af_wave_physics'],
  SpeakerLab: ['af_speaker_coverage'],
  RoomDesignLab: ['room-design'],
  DigitalLab: ['af_digital_audio'],
  MeterLab: ['af_visual_analysis'],
  SignalChainLab: ['af_signal_chain'],
  MeterModule: ['af_visual_analysis'], // Signal Detective: a module of Visual Audio Analysis, same end screen
  CableLab: ['af_cables'],
  ConnectorSelectLab: ['connector-select'],
  CableInstallLab: ['af_cable_install'],
  PatchbayLab: ['patchbay'],
  GainLabHome: ['af_gain_staging'],
  BeginningMixingLab: ['mixing-beg'],
  AdvancedMixingLab: ['mixing-adv'],
  MasteringLab: ['mastering'],
  MixingGuides: ['mixing-guides'],
  PreProdLab: ['preprod'],
  PostProdLab: ['postprod'],
  SoundSystemsLab: Object.keys(SS_MODES),
  DJSystemsLab: ['dj-systems'],
  StagePlotLab: ['stage-plot'],
  GameAudioLab: ['game-audio'],
  EqLab: ['eq'],
  EqLabHome: ['eq-lab'],
  CompressionLab: ['compression'],
  GateLab: ['gate'],
  LimiterLab: ['limiter'],
  SmartProcessorsLab: ['deesser'],
  DelayLab: ['delay'],
  ReverbLab: ['reverb'],
  ChorusLab: ['chorus'],
  FlangerLab: ['flanger'],
  PhaserLab: ['phaser'],
  DistortionLab: ['distortion'],
  PhaseLab: ['phase'],
  OscillatorLab: ['oscillator'],
  NoiseLab: ['noise'],
  HarmonicLab: ['harmonic'],
  FmLab: ['fm'],
  ModularLab: ['modular'],
  EnvelopeLab: ['envelope'],
  StereoLab: ['stereo'],
  BinauralLab: ['binaural'],
  AutotuneLab: ['autotune'],
  TuningLab: ['tuning'],
  DrumTuningLab: ['drum-tuning'],
  CymaticsLab: ['cymatics'],
  HarmonographLab: ['harmonograph'],
  BassLab: ['bass'],
  MicSelectLab: ['micselect'],
  MikingHub: MIKING_FAMILIES.map((f) => `miking-${f}`),
  SpeechLab: ['speech'],
  TubeLab: ['tube'],
  AmpLab: ['amp'],
  EarTrainingLab: ['ear-training'],
};

/**
 * PENDING: hosts that draw the end screen but do not pass their id yet (a
 * SHARED NEED in S4_REPORT.md). EMPTY since 2026-11-14: every host is wired
 * (S4 for most; F5 and F6 for theirs). A ratchet: it stays empty — a new lab
 * passes its id from the start.
 */
const PENDING: Record<string, readonly string[]> = {};

/** Every end-screen host and the key it passes (2026-11-14): S4 wired these on
 *  the coordinator's word, F5 and F6 the rest. */
const WIRED_HOSTS: Record<string, readonly string[]> = {
  // F5
  'src/screens/lab/foundations/FoundationsCourseScreen.tsx': ['af_foundations'],
  'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx': ['af_mic_principles'],
  'src/screens/lab/wave/WaveLabHomeScreen.tsx': ['af_wave_physics'],
  'src/screens/lab/wave/WaveModuleScreen.tsx': ['af_wave_physics'],
  'src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx': ['af_speaker_coverage'],
  'src/screens/lab/roomdesign/RoomDesignLabScreen.tsx': ['room-design'],
  // F6
  'src/screens/lab/digital/DigitalLabHomeScreen.tsx': ['af_digital_audio'],
  'src/screens/lab/digital/DigitalModuleScreen.tsx': ['af_digital_audio'],
  'src/screens/lab/meter/MeterLabHomeScreen.tsx': ['af_visual_analysis'],
  'src/screens/lab/meter/MeterModuleScreen.tsx': ['af_visual_analysis'],
  'src/screens/lab/gain/GainLabHomeScreen.tsx': ['af_gain_staging'],
  'src/screens/lab/gain/GainModuleScreen.tsx': ['af_gain_staging'],
  'src/screens/lab/tube/VacuumTubeLabScreen.tsx': ['tube'],
  'src/screens/lab/amp/AmpLabHomeScreen.tsx': ['amp'],
  'src/screens/lab/amp/AmpModuleScreen.tsx': ['amp'],
  'src/screens/lab/cable/lessons/lesson12.tsx': ['af_cables'],
  'src/screens/lab/cableinstall/CableInstallLabScreen.tsx': ['af_cable_install'],
  // S4
  'src/screens/lab/eq/EqLabHomeScreen.tsx': ['eq-lab'],
  'src/screens/lab/eq/EqModuleScreen.tsx': ['eq-lab'],
  'src/screens/lab/micselect/MicSelectLabScreen.tsx': ['micselect'],
  'src/screens/lab/miking/MikingLessonScreen.tsx': MIKING_FAMILIES.map((f) => `miking-${f}`),
  'src/screens/lab/soundsystems/SsPagedLab.tsx': Object.keys(SS_MODES),
  'src/screens/lab/mastering/MasteringLabScreen.tsx': ['mastering'],
  'src/screens/lab/mixingGuides/MixingGuideScreen.tsx': ['mixing-guides'],
  'src/screens/lab/ModularLabScreen.tsx': ['modular'],
  'src/screens/lab/tuning/TuningLabScreen.tsx': ['tuning'],
  'src/screens/lab/drumtuning/DrumTuningLabScreen.tsx': ['drum-tuning'],
  'src/screens/lab/cymatics/CymaticsHomeScreen.tsx': ['cymatics'],
  'src/screens/lab/cymatics/CymaticsModuleScreen.tsx': ['cymatics'],
  'src/screens/lab/eartraining/EarTrainingLabScreen.tsx': ['ear-training'],
  'src/screens/lab/eartraining/EarModuleScreen.tsx': ['ear-training'],
  'src/screens/lab/production/ProductionPacketScreen.tsx': ['preprod', 'postprod'],
  'src/screens/lab/stageplot/StagePlotLabScreen.tsx': ['stage-plot'],
};

// ── Which ids do the end-screen hosts pass TODAY? (scanned from the source) ─
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}
const SRC = files('src').map((p) => ({ p: p.split('\\').join('/'), s: read(p) }));
/** Every `const NAME = 'value'` in src (to resolve labId={NAME}). */
const CONSTS = new Map<string, string>();
for (const { s } of SRC) for (const m of s.matchAll(/\bconst ([A-Z][A-Z0-9_]*) = '([^']+)'/g)) CONSTS.set(m[1], m[2]);
const FX_IDS = [...read('src/screens/lab/fxLabConfigs.tsx').matchAll(/^\s{2}labId: '([\w-]+)',/gm)].map((m) => m[1]);
const CHECK_IDS = new Set(
  [...read('src/features/lab/understandingChecks.ts').split('export const PRACTICE_LAB_CHECKS')[1].matchAll(/^\s{2}'?([\w-]+)'?: [A-Z_]+,$/gm)].map((m) => m[1]),
);
/** The opening tag text of every <Tag …> in a file (braces balanced). */
function tags(s: string, tag: string): string[] {
  const out: string[] = [];
  let i = 0;
  while ((i = s.indexOf(`<${tag}`, i)) !== -1) {
    if (/\w/.test(s[i + tag.length + 1] ?? '')) { i += 1; continue; }
    let d = 0;
    let j = i + tag.length + 1;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '{') d++;
      else if (c === '}') d--;
      else if (c === '>' && d === 0) break;
    }
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}
function idsOf(attr: string, prop: 'labId' | 'labKey', file: string): string[] {
  const m = attr.match(new RegExp(`\\b${prop}=(?:"([^"]+)"|\\{([A-Za-z_][\\w.]*)\\})`));
  if (!m) return [];
  if (m[1]) return [m[1]];
  if (m[2] === 'config.labId' && file.endsWith('FxLabScreen.tsx')) return FX_IDS;
  if (m[2] === 'labId' && file.endsWith('soundsystems/SsPagedLab.tsx')) return SS_FORWARDED;
  const c = CONSTS.get(m[2]);
  return c ? [c] : [];
}
// SsPagedLab forwards its own labId to <LabEndScreen labId={labId}>: the ids it
// can forward are the mode screens' labIds (modeScreens.tsx imports it as PagedLab).
const SS_FORWARDED = (() => {
  const ms = read('src/screens/lab/soundsystems/modeScreens.tsx');
  return [...ms.matchAll(/labId=\{(SS_[A-Z_]+_ID)\}/g)].map((m) => CONSTS.get(m[1])).filter((x): x is string => !!x);
})();
const WIRED = new Map<string, string[]>(); // id → files that pass it
const wire = (id: string, p: string) => WIRED.set(id, [...(WIRED.get(id) ?? []), p]);
for (const { p, s } of SRC) {
  if (p.includes('/kit/') || p.endsWith('features/lab/labEndContent.ts')) continue; // the kit hosts forward their own prop
  const kitPaged = /import \{[^}]*\bPagedLab\b[^}]*\} from '[^']*kit\/PagedLab'/.test(s);
  if (kitPaged) for (const t of tags(s, 'PagedLab')) idsOf(t, 'labId', p).forEach((id) => wire(id, p));
  // The Miking lesson host passes `miking-<family>` from the lesson's own family.
  for (const t of tags(s, 'LabEndScreen')) if (/\blabId=\{`miking-\$\{lesson\.labId\}`\}/.test(t)) MIKING_FAMILIES.forEach((f) => wire(`miking-${f}`, p));
  // A host with no shared end screen reads the entry itself.
  for (const m of s.matchAll(/labEndContentFor\('([\w-]+)'\)/g)) wire(m[1], p);
  if (p.endsWith('production/ProductionPacketScreen.tsx') && /labEndContentFor\(lab\)/.test(s)) ['preprod', 'postprod'].forEach((id) => wire(id, p));
  for (const t of tags(s, 'LabCheckEnd')) idsOf(t, 'labId', p).forEach((id) => wire(id, p));
  for (const t of tags(s, 'ReviewLabEnd')) idsOf(t, 'labKey', p).forEach((id) => wire(id, p));
  for (const t of tags(s, 'LabEndScreen')) idsOf(t, 'labId', p).forEach((id) => wire(id, p));
  // The two cable labs draw their own end, with cable/labEndExtras' LabRecapNext.
  for (const t of tags(s, 'LabRecapNext')) idsOf(t, 'labId', p).forEach((id) => wire(id, p));
  // A LabShell with a CHECK and no checkEnd of its own draws LabCheckEnd labId={labId}.
  for (const t of tags(s, 'LabShell')) if (!/\bcheckEnd=/.test(t)) idsOf(t, 'labId', p).filter((id) => CHECK_IDS.has(id)).forEach((id) => wire(id, p));
}

const KEYS = Object.keys(LAB_END_CONTENT);
const OWN_ROUTE = new Map<string, string>();
for (const [route, keys] of Object.entries(ROUTE_KEYS)) for (const k of keys) if (!OWN_ROUTE.has(k)) OWN_ROUTE.set(k, route);
for (const [k, m] of Object.entries(SS_MODES)) OWN_ROUTE.set(k, m.route);

describe('S4 · every Labs-menu lab has a recap and a next lab', () => {
  it('the menu was read (65 tiles, 58 routes with Miking as one)', () => {
    assert.ok(MENU.size >= 55, String(MENU.size));
    assert.equal(MIKING_FAMILIES.length, 7);
  });
  it('every menu route is mapped to its end-screen id(s)', () => {
    for (const route of MENU.keys()) assert.ok(ROUTE_KEYS[route], `${route} (${MENU.get(route)}) has no end-screen id in ROUTE_KEYS`);
  });
  for (const [route, keys] of Object.entries(ROUTE_KEYS)) {
    it(`${route}: ${keys.join(', ')} filled in`, () => {
      assert.ok(MENU.has(route), `${route} is not on the Labs menu`);
      for (const k of keys) {
        assert.ok(LAB_END_CONTENT[k]?.recap?.length, `${k}: no recap`);
        assert.ok(LAB_END_CONTENT[k]?.next, `${k}: no next lab`);
      }
    });
  }
  it('no stray key: every entry belongs to a menu lab', () => {
    const mapped = new Set(Object.values(ROUTE_KEYS).flat());
    for (const k of KEYS) assert.ok(mapped.has(k), `${k} belongs to no Labs-menu lab`);
  });
});

describe('S4 · every key is a real end-screen id (a wrong key silently shows nothing)', () => {
  it('the source scan found the hosts S2 wired (envelope, gate, stereo, game-audio, af_signal_chain)', () => {
    for (const k of ['envelope', 'gate', 'stereo', 'game-audio', 'af_signal_chain', 'dj-systems', 'compression']) assert.ok(WIRED.has(k), k);
  });
  for (const k of KEYS) {
    it(`${k}: passed by a host today, or a listed SHARED NEED`, () => {
      if (WIRED.has(k)) return;
      const pending = PENDING[k];
      assert.ok(pending, `${k} is read by no end screen and is not listed as a SHARED NEED`);
      for (const f of pending) assert.ok(existsSync(f), `${k}: ${f} does not exist`);
    });
  }
  it('nothing is pending: every entry is read by a host today', () => {
    assert.deepEqual(Object.keys(PENDING), []);
    for (const k of KEYS) assert.ok(WIRED.has(k), `${k} is read by no end screen`);
  });
  it('every <LabEndScreen> outside the kit passes a labId (a host without one shows no recap)', () => {
    // StartHere is not a lab on the Labs menu: it has no recap.
    const exempt = new Set(['src/screens/startHere/StartHereScreen.tsx']);
    for (const { p, s } of SRC) {
      if (!p.endsWith('.tsx') || p.includes('/kit/') || exempt.has(p)) continue;
      for (const t of tags(s, 'LabEndScreen')) assert.match(t, /\blabId=/, p);
    }
  });
  for (const [f, keys] of Object.entries(WIRED_HOSTS)) {
    it(`wired: ${f.replace('src/screens/lab/', '')} passes ${keys.length > 2 ? `${keys.length} keys` : keys.join(', ')}`, () => {
      for (const k of keys) {
        assert.ok(WIRED.get(k)?.includes(f), `${f} does not pass ${k}`);
        assert.ok(!PENDING[k], `${k} is wired; take it off PENDING`);
      }
    });
  }
  it('EQ Lab and Equalizer have their own keys, and Modular’s Modal closes before the next-lab card leaves', () => {
    for (const f of ['src/screens/lab/eq/EqLabHomeScreen.tsx', 'src/screens/lab/eq/EqModuleScreen.tsx']) {
      const end = tags(read(f), 'LabEndScreen').join('\n');
      assert.match(end, /labId="eq-lab"/, f);
      // (the check block inside `extra` keeps its own check id 'eq')
      assert.doesNotMatch(end, /^\s*labId="eq"$/m, f);
    }
    assert.equal(LAB_END_CONTENT.eq.next!.route, 'EqLabHome');
    const mod = tags(read('src/screens/lab/ModularLabScreen.tsx'), 'LabEndScreen').join('\n');
    assert.match(mod, /labId="modular"/);
    assert.match(mod, /beforeLeave=\{close\}/);
  });
});

describe('S4 · next-lab cards', () => {
  const types = read('src/navigation/types.ts');
  const root = types.slice(types.indexOf('export type RootStackParamList = {'));
  const block = root.slice(0, root.indexOf('\n};'));
  const paramFree = (route: string) => new RegExp(`^\\s{2}${route}\\??: (?:undefined|[^;]*\\| undefined);`, 'm').test(block);
  for (const [k, c] of Object.entries(LAB_END_CONTENT)) {
    it(`${k} → ${c.next?.route}`, () => {
      const n = c.next!;
      const ss = Object.values(SS_MODES).find((m) => m.route === n.route);
      assert.ok(MENU.has(n.route) || ss, `${n.route} is not a Labs-menu lab`);
      assert.ok(paramFree(n.route), `${n.route} needs params; the card navigates with none`);
      assert.equal(n.title, ss ? ss.title : MENU.get(n.route), `${k}: title must read as the menu does`);
      assert.notEqual(n.route, OWN_ROUTE.get(k), `${k} points at itself`);
      assert.ok(n.why && n.why.split(/\s+/).length <= 16, `${k}: why`);
    });
  }
  it('no two labs point at each other', () => {
    for (const [k, c] of Object.entries(LAB_END_CONTENT)) {
      const own = OWN_ROUTE.get(k)!;
      for (const back of ROUTE_KEYS[c.next!.route] ?? Object.keys(SS_MODES).filter((m) => SS_MODES[m].route === c.next!.route)) {
        assert.notEqual(LAB_END_CONTENT[back]?.next?.route, own, `${k} ⇄ ${back}`);
      }
    }
  });
  it('Fundamentals run in Labs-menu order, and no Advanced lab sends a learner back to Fundamentals', () => {
    // Order and membership of Audio Fundamentals: owner 2026-11-21 (D74).
    const order = ['af_amplitude', 'af_foundations', 'af_sound_playground', 'af_mic_principles', 'af_wave_physics', 'af_signal_chain', 'af_cables', 'connector-select', 'af_gain_staging', 'af_digital_audio', 'af_visual_analysis'];
    for (let i = 0; i < order.length - 1; i++) assert.equal(LAB_END_CONTENT[order[i]].next!.route, OWN_ROUTE.get(order[i + 1]), order[i]);
    const fundamentalRoutes = new Set(order.map((k) => OWN_ROUTE.get(k)));
    for (const [k, c] of Object.entries(LAB_END_CONTENT)) if (!order.includes(k)) assert.ok(!fundamentalRoutes.has(c.next!.route), k);
  });
});

describe('S4 · recap lines are knowledge, short, US spelling', () => {
  const UK = /\b(colour|behaviour|practise|centre|favourite|analyse|organise|programme|labelled|modelling|travelling|metre|fibre|grey|catalogue|defence|licence)\b/i;
  // Knowledge, never skills (PROTOCOL 29): no "you'll / you will / you can …",
  // and none of the skill claims S2's ratchet bans ("you built", "you mixed").
  const SKILL = /\byou(?:'ll|’ll| will| can)\b|\byou (?:built|mastered|mixed)\b/i;
  for (const [k, c] of Object.entries(LAB_END_CONTENT)) {
    it(`${k}: 3–5 lines, ≤ 30 words, no skills claim`, () => {
      const r = c.recap!;
      assert.ok(r.length >= 3 && r.length <= 5, `${r.length} lines`);
      assert.equal(new Set(r).size, r.length, 'a line repeats');
      for (const l of r) {
        assert.ok(l.split(/\s+/).length <= 30, `${l.split(/\s+/).length} words: ${l}`);
        assert.doesNotMatch(l, SKILL, l);
        assert.doesNotMatch(l, UK, l);
        assert.match(l, /[.?]$/, `ends without a full stop: ${l}`);
      }
    });
  }
  it('Game Audio starts from its end guide’s first two “what this teaches” lines (SHARED_API S2 §3)', () => {
    const guide = read('src/screens/lab/gameaudio/pages/guides/end.ts');
    const teaches = guide.slice(guide.indexOf('teaches: ['));
    const lines = [...teaches.matchAll(/^\s{4}'((?:[^'\\]|\\.)*)',$/gm)].map((m) => m[1]);
    assert.deepEqual(LAB_END_CONTENT['game-audio'].recap!.slice(0, 2), lines.slice(0, 2));
  });
});
