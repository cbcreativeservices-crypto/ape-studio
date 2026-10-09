/**
 * Pattern hunt P10b (wave 4, 2026-10-02) — ONE gate for decorative motion.
 *
 * Owner rulings (2026-10-02, "favor consistency and learning outcomes"):
 *  • Under "Reduce animations" every DECORATIVE loop stops. Displays whose
 *    moving image IS the lesson (Harmonograph drawing, scope trace, wave pulse,
 *    MicCutaway…) keep running: the learner started them, they are the lesson.
 *  • Low-Light Production Mode ALSO stops decorative loops (SPL gold sweep,
 *    tuner chevrons, attention pulses…), the same as reduced motion.
 *
 * The shared piece: src/features/settings/decorativeMotion.ts —
 * `useDecorativeMotion()` (subscribed reduced motion AND Low-Light) and the
 * sync `decorativeMotionAllowed()`. useCiMotion().loops and useLabLoops() are
 * built on it, so every Cable Install / Sound Systems / Start Here loop rides it.
 *
 * Wave 3 fixed the withRepeat hosts' per-render reads; the rest (Animated.loop,
 * setInterval, effect-time reads) still read the plain `animationsAllowed()`,
 * which never re-runs when Settings (a modal) flips the switch.
 *
 * Ratchets below: every loop host in src/ is classified — gated, a listed
 * lesson display, a listed non-animation timer, or gated by its host. Lists
 * may only shrink.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

/* ── behaviour: the shared gate ─────────────────────────────────────────── */

const g = globalThis as Record<string, unknown>;
g.__P10B_AS__ = new Map<string, string>();
g.__P10B_FAIL__ = false;
g.__P10B_SUBS__ = [] as Array<(cb: () => void) => () => void>;
g.__P10B_SETS__ = [] as unknown[];
const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__P10B_AS__;
  export default {
    async getItem(k) { if (globalThis.__P10B_FAIL__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
  };`);
// Hooks run their effect at once; a state setter records what it was given;
// useSyncExternalStore records the subscribe it was handed.
const REACT = mod(`
  export function useState(v) { return [typeof v === 'function' ? v() : v, (x) => globalThis.__P10B_SETS__.push(x)]; }
  export function useEffect(fn) { fn(); }
  export function useSyncExternalStore(sub, get) { globalThis.__P10B_SUBS__.push(sub); return get(); }
  export default { useState, useEffect, useSyncExternalStore };`);
const RN = mod(`
  export const AccessibilityInfo = { addEventListener() { return { remove() {} }; }, isReduceMotionEnabled: async () => false, isScreenReaderEnabled: async () => false };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    if (specifier === 'react-native') return stub(RN);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});
const a11y = await import('../src/features/settings/a11y.ts');
const lowLight = await import('../src/features/settings/lowLight.ts');
const dm = await import('../src/features/settings/decorativeMotion.ts');
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
};
const reduce = (on: boolean) => a11y.applyA11yFromSettings({ reduceAnimations: on } as never);
function clean(): void {
  reduce(false);
  lowLight.resetLowLight();
  lowLight.setLowLight(false);
  g.__P10B_FAIL__ = false;
  (g.__P10B_SUBS__ as unknown[]).length = 0;
  (g.__P10B_SETS__ as unknown[]).length = 0;
}

describe('the shared decorative gate', () => {
  test('motion allowed, Low-Light off → decorative loops run', () => {
    clean();
    assert.equal(dm.decorativeMotionAllowed(), true);
    assert.equal(dm.useDecorativeMotion(), true);
  });

  test('"Reduce animations" stops them', () => {
    clean();
    reduce(true);
    assert.equal(dm.decorativeMotionAllowed(), false);
    assert.equal(dm.useDecorativeMotion(), false);
    reduce(false);
    assert.equal(dm.useDecorativeMotion(), true);
  });

  test('Low-Light stops them too (owner 2026-10-02) — with motion still allowed', () => {
    clean();
    lowLight.setLowLight(true);
    assert.equal(a11y.animationsAllowed(), true, 'precondition: reduced motion is OFF');
    assert.equal(dm.decorativeMotionAllowed(), false);
    assert.equal(dm.useDecorativeMotion(), false);
    lowLight.setLowLight(false);
    assert.equal(dm.useDecorativeMotion(), true);
  });

  test('a Low-Light value that could not be READ holds them, as it holds overlays', async () => {
    clean();
    lowLight.resetLowLight();
    g.__P10B_FAIL__ = true;
    lowLight.useLowLight(); // a mounted hook starts the read
    await settle();
    assert.equal(lowLight.isLowLightUnreadable(), true);
    assert.equal(dm.decorativeMotionAllowed(), false);
    assert.equal(dm.useDecorativeMotion(), false);
    clean();
  });

  test('it is SUBSCRIBED to both halves: a flip reaches a mounted host', () => {
    clean();
    dm.useDecorativeMotion();
    // reduced-motion half: the hook handed React a subscribe; a toggle fires it
    const subs = g.__P10B_SUBS__ as Array<(cb: () => void) => () => void>;
    assert.ok(subs.length >= 1, 'the motion half must be a subscription, not a one-off read');
    let fired = 0;
    const off = subs[subs.length - 1](() => { fired += 1; });
    reduce(true);
    assert.ok(fired >= 1, 'the Settings toggle must notify a mounted host');
    off();
    // Low-Light half: its listener pushes the new value into the host's state
    const sets = g.__P10B_SETS__ as unknown[];
    sets.length = 0;
    lowLight.setLowLight(true);
    assert.ok(sets.includes(true), 'switching Low-Light on must re-render a mounted host');
    clean();
  });
});

/* ── the sweep: every loop host classified ──────────────────────────────── */

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
function srcFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel));
    else if (/\.tsx?$/.test(name)) out.push(rel);
  }
  return out;
}
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const FILES = srcFiles().map((f) => ({ f, s: code(read(f)) }));

/** A file that runs repeating work: Animated.loop, withRepeat, a frame
 *  callback, a cancellable rAF chain, or setInterval. */
const isLoopHost = (s: string) =>
  /\bAnimated\.loop\(|\bwithRepeat\(|\buseFrameCallback\(|\bsetInterval\(/.test(s) ||
  (/\brequestAnimationFrame\(/.test(s) && /\bcancelAnimationFrame\b/.test(s));
/** The shared decorative gate, or a hook built on it. */
const DECORATIVE_GATE = /\buseDecorativeMotion\(|\buseCiMotion\(|\buseLabLoops\(/;

/** LESSON DISPLAYS, user-started (or a live measurement): the moving image is
 *  the content, so neither reduced motion nor Low-Light stops it through the
 *  shared gate. Shrink-only. */
const LESSON_DISPLAY: Record<string, string> = {
  'src/components/tooldemos/HzCounterDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/Rt60Demo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/RtaDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/SignalGenDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/SpectrogramDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/SplDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/components/tooldemos/WaveformDemo.tsx': 'Training Demo the learner opened — the animation IS the demo',
  'src/features/tools/engine/useRafFrameLoop.ts': 'the SPL meter live frame loop — a measurement',
  'src/screens/tools/SkinnedVu.tsx': 'live VU needle ballistics — a measurement',
  'src/screens/lab/HarmonographMachine.tsx': 'the pen drawing IS the lab display (owner 2026-10-02); paused on blur',
  'src/screens/lab/micspeaker/MicCutaway.tsx': 'the diaphragm motion IS the lesson (owner 2026-10-02); running={focused}',
  'src/screens/lab/wave/vizWave.tsx': 'the wave pulse runs while the learner traces (owner 2026-10-02)',
  'src/screens/lab/OscillatorLabScreen.tsx': 'the scope trace IS the display (owner 2026-10-02) + tone keepalive',
  'src/screens/lab/cymatics/vizLiquid.tsx': 'the driven surface IS the lesson; clock runs only while `running`',
  'src/screens/lab/cymatics/vizMembrane.tsx': 'the driven membrane IS the lesson; clock runs only while `running`',
  'src/screens/lab/cymatics/vizPlate.tsx': 'the driven plate IS the lesson; clock runs only while `running`',
  'src/screens/lab/cymatics/LiquidStudioScreen.tsx': 'the frequency SWEEP the learner started is the experiment',
  'src/screens/lab/cymatics/MembraneStudioScreen.tsx': 'the frequency SWEEP the learner started is the experiment',
  'src/screens/lab/cymatics/PlateStudioScreen.tsx': 'the frequency SWEEP the learner started is the experiment',
  'src/screens/lab/cymatics/modules/modHarmony.tsx': 'Lissajous precession while the learner’s tone runs + keepalive',
  'src/screens/lab/cymatics/modules/modSystems.tsx': 'standing-wave string phase while the learner runs it',
  'src/screens/lab/foundations/viz.tsx': 'wave clocks — the moving wave IS the content; active only while focused',
  'src/screens/lab/drumtuning/useDrumPlayback.ts': 'playhead under a clip the learner started — tracks the audio',
  'src/screens/lab/mastering/useMasterPlayback.ts': 'playhead under a clip the learner started — tracks the audio',
  'src/screens/lab/drumtuning/modules/ch2Prepare.tsx': 'the tightening pattern while the learner’s RUN is on',
  'src/screens/lab/NoiseLabScreen.tsx': 'noise shimmer only while the learner’s noise sounds + keepalive',
  'src/screens/lab/speech/speechViz.tsx': 'vocal folds vibrate for the voiced sound the learner picked; reduce-motion still holds them',
  'src/screens/lab/speech/speechPagesA.tsx': 'AUTO step-through the learner switched on; reduce-motion still holds it',
  'src/screens/lab/deesser/DeEsserLabScreen.tsx': 'AUTO step-through the learner switched on; reduce-motion still holds it',
  'src/screens/lab/connectorselect/pagesC.tsx': 'the FLICKERING lamp is the tester’s reading of the learner’s probe; reduce-motion holds it, the word carries it',
};

/** Repeating work that animates nothing (or runs once): clocks, engine polls,
 *  audio keepalives, single frames, finite steps. Shrink-only. */
const NOT_ANIMATION: Record<string, string> = {
  'src/components/detailSwipe.tsx': 'one-frame recentre',
  'src/screens/lab/HarmonicStems.tsx': 'rAF throttle for drag updates — one frame per queued value',
  'src/screens/lab/roomdesign/modules/modExplore.tsx': 'TRACE pulse — finite (TRACE_MS), pressed by the learner',
  'src/components/HoldToActivate.tsx': 'hold-to-confirm seconds countdown',
  'src/features/settings/DeleteAccountButton.tsx': 'hold-to-confirm seconds countdown',
  'src/features/account/SingleDeviceGuard.tsx': 'session poll',
  'src/features/audio/exposureMonitor.ts': 'exposure dose clock',
  'src/features/glossary/GlossaryLockView.tsx': 'reset clock',
  'src/features/intro/FirstRunCoordinator.tsx': 'state poll',
  'src/features/study/SessionTimer.tsx': 'study clock',
  'src/features/study/sync.ts': 'active-time accrual + sync clock',
  'src/features/study/timeTrial.ts': 'time-trial clock',
  'src/features/tools/capture/opticalCounter.ts': 'camera sample poll',
  'src/features/tools/engine/useDspEngine.ts': 'engine frame poll',
  'src/screens/tools/hubPreviewEngine.ts': 'engine frame poll + watchdog',
  'src/screens/tools/DspDebugScreen.tsx': 'engine debug poll',
  'src/screens/tools/MultiMeterScreen.tsx': 'engine spectrum poll',
  'src/screens/tools/Rt60Screen.tsx': 'engine RT60 poll',
  'src/screens/tools/RtaScreen.tsx': 'engine spectrum poll',
  'src/screens/tools/SignalGenScreen.tsx': 'generator status poll',
  'src/screens/tools/SpectrogramScreen.tsx': 'engine spectrum poll',
  'src/screens/exam/FinalExamScreen.tsx': 'countdown + submit retry clocks',
  'src/features/intro/glossaryUseTimer.ts': 'Glossary use clock for the one-time commitment popup',
  'src/screens/quiz/QuizScreen.tsx': 'countdown clock',
  'src/screens/results/ResultsScreen.tsx': 'lockout countdown',
  'src/screens/study/FillInBlankScreen.tsx': 'pace timer clock',
  'src/screens/study/MatchingScreen.tsx': 'pace timer clock (its one-shot layout transitions read the subscribed hook)',
  'src/screens/study/ScenariosScreen.tsx': 'pace timer clock',
  'src/screens/glossary/LinksToggleLabel.tsx': 'finite light-up on a toggle press',
  'src/screens/lab/cable/lessons/lesson10.tsx': 'finite scan after a learner action; reduce-motion shows the end state',
  'src/screens/lab/cable/lessons/lesson11.tsx': 'finite cascade after a learner action; reduce-motion shows the end state',
  'src/screens/lab/eartraining/EarModuleScreen.tsx': 'fatigue-nudge clock',
  'src/screens/lab/AutotuneLabScreen.tsx': 'melody note scheduler + audio keepalive',
  'src/screens/lab/BassLabScreen.tsx': 'URL refresh + audio keepalive',
  'src/screens/lab/BinauralLabScreen.tsx': 'audio keepalive + bus status poll',
  'src/screens/lab/cymatics/useDriveTone.ts': 'audio keepalive',
  'src/screens/lab/digital/modules/modAnalog.tsx': 'audio keepalive',
  'src/screens/lab/eq/modules/eqAudition.tsx': 'audio keepalive',
  'src/screens/lab/FmLabScreen.tsx': 'audio keepalive',
  'src/screens/lab/foundations/FoundationsCourseScreen.tsx': 'audio keepalive',
  'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx': 'audio keepalive',
  'src/screens/lab/FxLabScreen.tsx': 'audio keepalive + gain-reduction poll',
  'src/screens/lab/HarmonographLabScreen.tsx': 'audio keepalive',
  'src/screens/lab/ModularLabScreen.tsx': 'audio keepalive + module status poll',
  'src/screens/lab/SignalChainLabScreen.tsx': 'audio keepalive + gain-reduction poll',
};

/** Decorative loops gated where they are MOUNTED: the host must pass the
 *  shared gate down. Shrink-only. */
const GATED_BY_HOST: Record<string, { host: string; proof: RegExp }> = {
  'src/screens/tools/hubPreviewsSim.tsx': {
    host: 'src/screens/tools/ToolsHubScreen.tsx',
    proof: /const decorative = useDecorativeMotion\(\);[\s\S]*<Sim active=\{active && decorative\} \/>/,
  },
};

describe('ratchet: every loop host is classified', () => {
  test('a loop host is behind the shared gate, a listed lesson display, a listed timer, or gated by its host', () => {
    const hosts = FILES.filter(({ s }) => isLoopHost(s));
    const unclassified = hosts
      .filter(({ f, s }) => !DECORATIVE_GATE.test(s) && !LESSON_DISPLAY[f] && !NOT_ANIMATION[f] && !GATED_BY_HOST[f])
      .map(({ f }) => f);
    assert.deepEqual(
      unclassified,
      [],
      'a NEW loop: decorative → gate it with useDecorativeMotion(); the lesson itself → LESSON_DISPLAY with a reason; not animation → NOT_ANIMATION',
    );
    const hostSet = new Set(hosts.map(({ f }) => f));
    const stale = [...Object.keys(LESSON_DISPLAY), ...Object.keys(NOT_ANIMATION), ...Object.keys(GATED_BY_HOST)].filter((f) => !hostSet.has(f));
    assert.deepEqual(stale, [], 'remove stale entries');
    // A listed file that now carries the gate is decorative after all — unlist it.
    const nowGated = [...Object.keys(NOT_ANIMATION), ...Object.keys(GATED_BY_HOST)].filter((f) => DECORATIVE_GATE.test(FILES.find((x) => x.f === f)!.s));
    assert.deepEqual(nowGated, [], 'these are gated now — drop them from the list');
    for (const [f, { host, proof }] of Object.entries(GATED_BY_HOST)) {
      assert.match(code(read(host)), proof, `${host} must pass the decorative gate down to ${f}`);
    }
  });

  test('useCiMotion().loops and useLabLoops() are built on the shared gate', () => {
    const ci = code(read('src/screens/lab/cableinstall/motion.tsx'));
    assert.match(ci, /const decorative = useDecorativeMotion\(\);\s*const loops = !reduceMotion && decorative;/);
    assert.match(ci, /loops,\s*\}\),\s*\[reduceMotion, loops\],/);
    const ss = code(read('src/screens/lab/soundsystems/art/motion.tsx'));
    assert.match(ss, /export function useLabLoops\(\): boolean \{\s*const m = useCiMotion\(\);/);
  });
});

/** Plain `animationsAllowed()` reads that remain — each a ONE-SHOT read at the
 *  moment a transition fires (in a handler or a one-time effect), never a loop
 *  gate and never a render-body read. Exact counts; shrink-only. */
const ONE_SHOT_READS: Record<string, [number, string]> = {
  'src/components/Section.tsx': [1, 'LayoutAnimation on a press'],
  'src/components/Toggle.tsx': [1, 'thumb slide on a press'],
  'src/features/intro/FirstRunSampler.tsx': [2, 'one entrance at mount'],
  'src/screens/careerfinder/CareerFinderQuizScreen.tsx': [3, 'per-answer transition + advance delay, in handlers'],
  'src/screens/careerfinder/kit.tsx': [1, 'bar width tween when the value changes'],
  'src/screens/curriculum/InsideStats.tsx': [1, 'the one-time count-up (its loops ride the shared gate)'],
  'src/screens/enrollment/EnrollmentScreen.tsx': [1, 'LayoutAnimation during a drag step (its loop rides the shared gate)'],
  'src/screens/enrollment/HomeSetupSheet.tsx': [1, 'LayoutAnimation on a press'],
  'src/screens/help/HelpScreen.tsx': [1, 'LayoutAnimation on a press'],
  'src/screens/tools/ToolsHubScreen.tsx': [1, 'the one-time tile power-on (its sims ride the shared gate)'],
};

test('ratchet: no NEW plain animationsAllowed() read anywhere in src/', () => {
  const PLAIN = /(?<![\w.])animationsAllowed\(\)/g;
  const found: Record<string, number> = {};
  for (const { f, s } of FILES) {
    if (f === 'src/features/settings/a11y.ts' || f === 'src/features/settings/decorativeMotion.ts') continue;
    const n = (s.match(PLAIN) ?? []).length;
    if (n) found[f] = n;
  }
  const expected = Object.fromEntries(Object.entries(ONE_SHOT_READS).map(([f, [n]]) => [f, n]));
  assert.deepEqual(
    found,
    expected,
    'a plain read never re-runs when Settings (a modal) flips the switch — use useDecorativeMotion() for a loop, useAnimationsAllowed() otherwise',
  );
});

describe('the sites wave 3 left on the plain read', () => {
  const s = (p: string) => code(read(p));
  test('decorative loops read the shared gate', () => {
    assert.match(s('src/screens/dashboard/DashboardScreen.tsx'), /const motionOk = useDecorativeMotion\(\);\s*useEffect\(\(\) => \{\s*if \(!motionOk\) \{/);
    assert.match(s('src/screens/lab/amp/AmpRig.tsx'), /const motion = useDecorativeMotion\(\);/);
    assert.match(s('src/screens/lab/HarmonicsView.tsx'), /const motion = useDecorativeMotion\(\);\s*const sweep = /);
    assert.match(s('src/screens/tools/SplMeterScreen.tsx'), /const motionOk = useDecorativeMotion\(\);\s*useEffect\(\(\) => \{\s*if \(!flashing0 \|\| !motionOk\) \{/);
    const awards = s('src/screens/awards/AwardsScreen.tsx');
    assert.match(awards, /if \(w <= 0 \|\| suppressed \|\| !decorative\) \{/);
    assert.match(awards, /\}, \[w, x, suppressed, decorative\]\);/);
    // The Home shimmer read only the PHONE flag — the app switch never reached it.
    assert.match(s('src/screens/courses/CourseSelectionScreen.tsx'), /const off = reduceMotion \|\| suppressed \|\| !decorative(?: \|\| !focused)?;/);
    assert.match(s('src/screens/enrollment/LabScopeSweep.tsx'), /\}, \[w, windowW, live, suppressed, decorative, x\]\);/);
    assert.match(s('src/screens/enrollment/EnrollmentScreen.tsx'), /const animate = !on && !suppressed && decorative(?: && live)?;/);
    assert.match(s('src/screens/glossary/GlossaryScreen.tsx'), /if \(!motion\) return;\s*const id = setInterval/);
    const pp = s('src/screens/lab/patchbay/art/PatchPairView.tsx');
    assert.match(pp, /if \(reduceMotion \|\| !active \|\| !decorative\) return;/);
    assert.match(pp, /if \(reduceMotion \|\| !onToggleJack \|\| !pulseOk\) return;/);
  });

  test('the owner’s named decorative loops: SPL gold sweep, tuner chevrons, attention pulse', () => {
    assert.match(s('src/screens/tools/Spl3dGauge.tsx'), /const motionOk = useDecorativeMotion\(\);/);
    assert.match(s('src/screens/tools/CenterLockTuner.tsx'), /function TuneArrows[\s\S]{0,400}const allowed = useDecorativeMotion\(\);/);
    assert.match(s('src/screens/tools/SkinnedTunerVu.tsx'), /export function TuneChevrons[\s\S]{0,200}const allowed = useDecorativeMotion\(\);/);
    assert.match(s('src/features/lab/attentionPulse.tsx'), /const allowed = useDecorativeMotion\(\);/);
  });

  test('non-loop motion that must still hear the toggle reads the SUBSCRIBED hook', () => {
    assert.match(s('src/screens/study/MatchingScreen.tsx'), /const motionOk = useAnimationsAllowed\(\);/);
    assert.match(s('src/components/JogWheel.tsx'), /const motionAllowed = useAnimationsAllowed\(\);\s*const allowedRef = useRef\(true\);\s*allowedRef\.current = motionAllowed;/);
    assert.match(s('src/screens/lab/kit/PagedLab.tsx'), /const reduceMotion = osReduceMotion \|\| !motionAllowed;/);
    assert.match(s('src/screens/lab/soundsystems/SsPagedLab.tsx'), /const reduceMotion = osReduceMotion \|\| !motionAllowed;/);
    assert.match(s('src/screens/lab/tuning/TuningLabScreen.tsx'), /const reduceMotion = !useAnimationsAllowed\(\);/);
    assert.match(s('src/screens/startHere/StartHereScreen.tsx'), /const reduceMotion = osReduce \|\| !motionAllowed;/);
    assert.match(s('src/screens/lab/cable/lessons/bits.tsx'), /const allowed = useAnimationsAllowed\(\);\s*return rm \|\| !allowed;/);
  });

  test('the hub previews rest under the gate', () => {
    assert.match(s('src/screens/tools/ToolsHubScreen.tsx'), /<Sim active=\{active && decorative\} \/>/);
  });
});
