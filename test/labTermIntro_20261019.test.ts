/**
 * Lab first-open glossary popup (owner 2026-10-19) — receipts.
 *
 * "When a lab is opened for the first time, I want a popup to appear first
 * with the lab's title and the plain english definition underneath it …
 * then a continue button and on into the lab. This happens only the very
 * first time a user opens the lab."
 * And: "do not show the glossary pop up for free non-members. this is for
 * members when they are opening the lab."
 *
 *   1. every catalog lab is mapped — wired to a glossary term, or on HOLD;
 *   2. the right term (and the right MEANING of it) per lab, the glossary
 *      text verbatim, and HOLD labs show nothing;
 *   3. members only: locked / checking / unconfirmed / preview → nothing,
 *      nothing owed, nothing marked seen;
 *   4. Low-Light (and the dev kill switch, the sampler) never auto-show it;
 *   5. ordering: it shows FIRST — the lab's own intros hold while it is owed —
 *      and never stacks on another Modal, a closing fade, a push, or the
 *      amplitude orientation page;
 *   6. once per lab: CONTINUE writes the seen flag on the shared safe store,
 *      it is never shown again, it survives both wipes (intro family) and
 *      "Reset onboarding hints" brings it back;
 *   7. it stays out of the app-start graph.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ── a fake AsyncStorage (reads can fail) ─────────────────────────────────
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__LT_AS__ = AS;
g.__LT_FAIL_READS__ = false;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(`
    const s = globalThis.__LT_AS__;
    export default {
      async getItem(k) { if (globalThis.__LT_FAIL_READS__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
      async setItem(k, v) { s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
      async getAllKeys() { return [...s.keys()]; },
      async multiRemove(ks) { for (const k of ks) s.delete(k); },
    };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

process.env.EXPO_PUBLIC_MIKING_PREVIEW = '1';
const { LAB_CATEGORIES, categoryEntries } = await import('../src/screens/lab/labCatalog.ts');
const L = await import('../src/features/intro/labTermIntros.ts');
const intros = await import('../src/features/intro/screenIntros.ts');
const seenStore = await import('../src/features/intro/labTermSeenStore.ts');

const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise<void>((r) => setImmediate(r));
};

type Leaf = { name: string; route?: string; params?: object };
const leaves: Leaf[] = (LAB_CATEGORIES as never[]).flatMap((c) => categoryEntries(c) as Leaf[]).filter((l) => l.route);

/** A member on a focused lab, everything clear — each case changes one thing. */
const CLEAR = {
  wired: true,
  gate: 'open' as const,
  previewActive: false,
  seen: false as const,
  dismissed: false,
  focused: true,
  suppressed: false,
  held: false,
  pushSettled: true,
  otherModalOpen: false,
  holdMs: 0,
  presented: false,
};
const state = (over: Partial<Parameters<typeof L.labTermIntroState>[0]>) => L.labTermIntroState({ ...CLEAR, ...over });

describe('1. every catalog lab is mapped (wired or HOLD) — and nothing else is', () => {
  it('each catalog lab row resolves to an entry', () => {
    const missing = leaves.filter((l) => L.labTermKey(l.route as string, l.params) == null).map((l) => `${l.name} (${l.route})`);
    assert.deepEqual(missing, [], 'a catalog lab with no term entry — add it as wired or hold');
  });
  it('every entry is a catalog lab (no stale rows)', () => {
    const keys = new Set(leaves.map((l) => L.labTermKey(l.route as string, l.params)));
    const stale = Object.keys(L.LAB_TERM_ENTRIES).filter((k) => !keys.has(k));
    assert.deepEqual(stale, []);
  });
  it('the counts the owner was given: 33 wired, 30 on HOLD', () => {
    const all = Object.values(L.LAB_TERM_ENTRIES);
    assert.equal(all.filter((e) => e.status === 'wired').length, 33);
    assert.equal(all.filter((e) => e.status === 'hold').length, 30);
  });
  it('route + params pick the catalog row; module screens are not labs', () => {
    assert.equal(L.labTermKey('MikingHub', { lab: 'drums' }), 'MikingHub:drums');
    assert.equal(L.labTermKey('MikingHub'), null);
    assert.equal(L.labTermKey('MeterModule', { id: 'detective' }), 'MeterModule:detective');
    assert.equal(L.labTermKey('MeterModule', { id: 'lufs' }), null);
    assert.equal(L.labTermKey('ProductionLab', { lab: 'postprod' }), 'PostProdLab');
    assert.equal(L.labTermKey('PreProdLab', { lab: 'preprod' }), 'PreProdLab');
    for (const r of ['CymaticsModule', 'MikingLesson', 'EqModule', 'SoundSystemsLearn', 'DeEsserLab', 'CalcWorkspace']) {
      assert.equal(L.labTermKey(r), null, r);
    }
  });
});

describe('2. the right term — and the right meaning — per lab', () => {
  const wired = (route: string, params?: object) => L.wiredLabTerm(L.labTermKey(route, params));
  it('the obvious labs carry their own term', () => {
    const want: Record<string, string> = {
      FoundationsCourse: 'Sound',
      MicLab: 'Microphone (Mic)',
      DigitalLab: 'Digital Audio',
      SignalChainLab: 'Signal Chain (Signal Path)',
      CableInstallLab: 'Cable dressing',
      GainLabHome: 'Gain Staging',
      BeginningMixingLab: 'Mixing',
      AdvancedMixingLab: 'Mixing',
      MasteringLab: 'mastering',
      PreProdLab: 'Pre-Production',
      PostProdLab: 'Post-production',
      SoundSystemsLab: 'Sound System',
      EqLab: 'Equalizer',
      EqLabHome: 'Equalizer',
      LimiterLab: 'Limiter',
      DelayLab: 'delay',
      ReverbLab: 'Reverb',
      ChorusLab: 'Chorus',
      FlangerLab: 'Flanger',
      PhaserLab: 'phaser',
      DistortionLab: 'Distortion',
      PhaseLab: 'Phase',
      OscillatorLab: 'Oscillator',
      NoiseLab: 'Noise',
      HarmonicLab: 'Harmonics',
      ModularLab: 'Modular synthesizer',
      StereoLab: 'Stereo Imaging',
      DrumTuningLab: 'Drum Tuning',
      CymaticsLab: 'Cymatics',
      HarmonographLab: 'Harmonograph',
      TubeLab: 'Vacuum tube',
      AmpLab: 'Amplifier',
      EarTrainingLab: 'ear training',
    };
    for (const [route, term] of Object.entries(want)) assert.equal(wired(route)?.term, term, route);
    assert.equal(Object.keys(want).length, 33, 'every wired lab is pinned here');
  });
  it('the words are the glossary’s, not a paraphrase (spot checks, copied 2026-10-19)', () => {
    assert.equal(wired('EqLab')?.plainEnglish, 'An equalizer boosts or cuts chosen frequencies. It shapes the tone of a sound.');
    assert.equal(
      wired('LimiterLab')?.plainEnglish,
      'A limiter is an extreme compressor with an infinite ratio. You set a threshold, and any signal above it is absolutely stopped from going higher. This protects against surprise clipping. Limiters are essential on the master bus and for safety on inputs. Used right, they are invisible. Used wrong, they squash the sound.',
    );
    // A real em dash, as stored — not a replacement character.
    assert.match(wired('ModularLab')?.plainEnglish ?? '', /Nothing is fixed and nothing is saved \u2014 that is the appeal\.$/);
    for (const e of Object.values(L.LAB_TERM_ENTRIES)) {
      if (e.status !== 'wired') continue;
      assert.ok(e.plainEnglish.trim().length > 30, `${e.lab}: empty text`);
      assert.ok(!e.plainEnglish.includes('\uFFFD'), `${e.lab}: a mangled character`);
      assert.match(e.glossaryId, /^[0-9a-f-]{36}$/, `${e.lab}: names its glossary row`);
    }
  });
  it('Compression is NOT wired to the glossary’s air-pressure "Compression" (or file compression) — it waits for the owner', () => {
    assert.equal(wired('CompressionLab'), null);
    const e = L.LAB_TERM_ENTRIES.CompressionLab;
    assert.equal(e.status, 'hold');
    if (e.status === 'hold') {
      assert.equal(e.suggested, 'Dynamic range compression');
      assert.ok(!e.candidates.includes('Audio compression') && !e.candidates.includes('Data compression'));
    }
  });
  it('no wired text names a maker or model; the senses that would be wrong are not wired', () => {
    for (const e of Object.values(L.LAB_TERM_ENTRIES)) {
      if (e.status !== 'wired') continue;
      assert.doesNotMatch(e.plainEnglish, /Yamaha|DX7|Shure|Neumann|Royer|SM7B|U87|Auto-Tune/, e.lab);
    }
    // The glossary's "Voice" is a synth voice and "Spectrum Analyzer" is an RF tool.
    assert.equal(wired('SpeechLab'), null);
    assert.equal(wired('MeterLab'), null);
    assert.equal(wired('FmLab'), null);
    assert.equal(wired('AutotuneLab'), null);
  });
  it('the title raises only the first letter; the definition is untouched', () => {
    assert.equal(L.labTermTitle('delay'), 'Delay');
    assert.equal(L.labTermTitle('Signal Chain (Signal Path)'), 'Signal Chain (Signal Path)');
  });
  it('HOLD labs show nothing and owe nothing', () => {
    const holds = Object.entries(L.LAB_TERM_ENTRIES).filter(([, e]) => e.status === 'hold');
    assert.ok(holds.length > 0);
    for (const [key] of holds) assert.equal(L.wiredLabTerm(key), null, key);
    assert.deepEqual(state({ wired: false }), { owed: false, show: false });
    // The host returns before any hook for a HOLD / unmapped lab.
    assert.match(code('src/features/intro/LabTermIntro.tsx'), /const term = wiredLabTerm\(labTermKey\(routeName, params\)\);\s*if \(!term\) return null;/);
  });
});

describe('3. members only', () => {
  it('locked (guest or free), checking and unconfirmed: nothing shown, nothing owed', () => {
    for (const gate of ['locked', 'checking', 'unconfirmed'] as const) {
      assert.deepEqual(state({ gate }), { owed: false, show: false }, gate);
    }
  });
  it('never over a members-only preview scrim', () => {
    assert.deepEqual(state({ previewActive: true }), { owed: false, show: false });
  });
  it('a FREE lab opened by a non-member gets nothing either (members only, owner 2026-10-19)', () => {
    assert.equal(L.wiredLabTerm(L.labTermKey('FoundationsCourse'))?.term, 'Sound');
    assert.deepEqual(state({ gate: 'locked' }), { owed: false, show: false });
  });
  it('a member does get it', () => {
    assert.deepEqual(state({}), { owed: true, show: true });
  });
  it('nothing is marked seen except by CONTINUE (so a non-member’s later first open as a member still gets it)', () => {
    const src = code('src/features/intro/LabTermIntro.tsx');
    assert.equal((src.match(/markLabTermSeen\(/g) ?? []).length, 1);
    assert.match(src, /const onContinue = useCallback\(\(\) => \{[\s\S]*?markLabTermSeen\(term\.key\)/);
  });
  it('the gate is read from useMemberGate and the preview store', () => {
    const src = code('src/features/intro/LabTermIntro.tsx');
    assert.match(src, /const gate = useMemberGate\(\);/);
    assert.match(src, /const previewActive = useLabPreview\(\)\.active;/);
  });
});

describe('4. Low-Light: nothing auto-appears', () => {
  it('suppressed: not shown, still owed (so it comes later, unseen)', () => {
    assert.deepEqual(state({ suppressed: true }), { owed: true, show: false });
  });
  it('a popup already up hides if Low-Light comes on', () => {
    assert.deepEqual(state({ presented: true, suppressed: true }), { owed: true, show: false });
  });
  it('the component reads useOverlaysSuppressed AND the sampler, both every render', () => {
    const src = code('src/features/intro/LabTermIntro.tsx');
    assert.match(src, /const overlaysSuppressed = useOverlaysSuppressed\(\);\s*const sampling = useSamplingActive\(\);/);
  });
});

describe('5. ordering — first, and never stacked', () => {
  it('a member’s first visit, step by step', () => {
    // Seen flags still loading: owed (the lab's own intros already wait), not shown.
    assert.deepEqual(state({ seen: 'loading' }), { owed: true, show: false });
    // Mid-push.
    assert.deepEqual(state({ pushSettled: false }), { owed: true, show: false });
    // Another Modal is up (the sound-safety popup, a dialog, a sheet).
    assert.deepEqual(state({ otherModalOpen: true }), { owed: true, show: false });
    // That Modal is still fading away.
    assert.deepEqual(state({ holdMs: 300 }), { owed: true, show: false });
    // The amplitude orientation page owns the screen.
    assert.deepEqual(state({ held: true }), { owed: true, show: false });
    // Clear: shown.
    assert.deepEqual(state({}), { owed: true, show: true });
    // Once up it stays, even when something else opens.
    assert.deepEqual(state({ presented: true, otherModalOpen: true, holdMs: 300 }), { owed: true, show: true });
    // CONTINUE: gone, and nothing owed — the lab's own intro may come now.
    assert.deepEqual(state({ presented: true, dismissed: true }), { owed: false, show: false });
  });
  it('unfocused (pushed over, or mounted under another screen): nothing, nothing owed', () => {
    assert.deepEqual(state({ focused: false }), { owed: false, show: false });
  });
  it('a stored flag that could not be read shows nothing and never holds the lab’s intros', () => {
    assert.deepEqual(state({ seen: 'unreadable' }), { owed: false, show: false });
  });
  it('the OWED signal: set, cleared, many owners', () => {
    const a = intros.labTermSignalId();
    const b = intros.labTermSignalId();
    assert.equal(intros.isLabTermIntroOwed(), false);
    intros.setLabTermIntroOwed(a, true);
    intros.setLabTermIntroOwed(b, true);
    intros.setLabTermIntroOwed(a, false);
    assert.equal(intros.isLabTermIntroOwed(), true);
    intros.setLabTermIntroOwed(b, false);
    assert.equal(intros.isLabTermIntroOwed(), false);
    const release = intros.holdLabTermIntro();
    assert.equal(intros.isLabTermIntroHeld(), true);
    release();
    release();
    assert.equal(intros.isLabTermIntroHeld(), false);
  });
  it('the lab’s own intros wait while it is owed: useScreenIntro (ProNote) and GuestStartReminder', () => {
    const overlay = code('src/features/intro/ScreenIntroOverlay.tsx');
    assert.match(overlay, /const labTermFirst = useLabTermIntroOwed\(\);/);
    assert.match(overlay, /visible: visible && focused && !suppressed && !hold && !labTermFirst/);
    const guest = code('src/features/lab/GuestStartReminder.tsx');
    assert.match(guest, /const hold = holdProp \|\| labTermFirst;/);
    assert.match(guest, /if \(!asGuest \|\| !focused \|\| suppressed \|\| hold\) return;/);
    // ProNote goes through useScreenIntro, so it inherits the wait.
    assert.match(code('src/features/lab/ProNote.tsx'), /useScreenIntro\('mixingProNote'\)/);
  });
  it('the lab shell’s entry audio prompt (the sound-safety / output popup) waits for it, and asks once', () => {
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /const labTermFirst = useLabTermIntroOwed\(\);/);
    assert.match(shell, /if \(labTermFirst \|\| entryAskedRef\.current\) return undefined;/);
    assert.match(shell, /if \(isLabTermIntroOwed\(\)\) return;[^\n]*\n\s*entryAskedRef\.current = true;\s*void requestAudioOutput\(\);/);
    assert.match(shell, /\}, \[labTermFirst\]\);/);
  });
  it('the owed flag is published before paint and cleared on unmount', () => {
    const src = code('src/features/intro/LabTermIntro.tsx');
    assert.match(src, /useLayoutEffect\(\(\) => \{\s*setLabTermIntroOwed\(id, owed\);/);
    assert.match(src, /useLayoutEffect\(\(\) => \(\) => setLabTermIntroOwed\(id, false\), \[\]\);/);
  });
  it('the orientation page holds it; the stacking inputs are the house ones', () => {
    assert.match(code('src/screens/lab/amplitude/AmplitudeOrientation.tsx'), /export function AmplitudeOrientationGatePage\(\) \{[\s\S]{0,200}useEffect\(\(\) => holdLabTermIntro\(\), \[\]\);/);
    const src = code('src/features/intro/LabTermIntro.tsx');
    assert.match(src, /const otherModalOpen = useModalHostOpen\(\);/);
    assert.match(src, /rootModalHoldMs\(\)/);
    assert.match(src, /addListener\?\.\('transitionEnd'/);
    assert.match(src, /from '\.\.\/\.\.\/components\/DimModal'/, 'a DimModal (Low-Light wash, overlay host), never a raw RN Modal');
    assert.doesNotMatch(src, /Alert\.alert/);
  });
});

describe('6. once per lab, on the shared safe store', () => {
  it('a new device: unseen → CONTINUE → seen, written, and never shown again', async () => {
    AS.clear();
    await seenStore.labTermsSeenHydrate();
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'CompressionLab'), false);
    assert.equal(await seenStore.markLabTermSeen('LimiterLab'), true);
    assert.deepEqual(JSON.parse(AS.get('ape:intro:labTerms') ?? 'null'), ['LimiterLab']);
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'LimiterLab'), true);
    assert.deepEqual(state({ seen: true }), { owed: false, show: false });
    // Twice is still once.
    await seenStore.markLabTermSeen('LimiterLab');
    assert.deepEqual(JSON.parse(AS.get('ape:intro:labTerms') ?? 'null'), ['LimiterLab']);
    // Per lab: another lab is still owed.
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'ReverbLab'), false);
  });
  it('"Reset onboarding hints" brings every lab popup back without a relaunch', async () => {
    await seenStore.markLabTermSeen('ReverbLab');
    await intros.resetScreenIntros();
    await settle();
    assert.equal(AS.has('ape:intro:labTerms'), false);
    await seenStore.labTermsSeenHydrate();
    assert.deepEqual([...seenStore.seenLabTerms()], []);
  });
  it('a failed read is UNREADABLE (no popup), and nothing is written over the stored list', () => {
    assert.equal(seenStore.labTermSeenOf(false, true, [], 'LimiterLab'), 'unreadable');
    assert.equal(seenStore.labTermSeenOf(false, false, [], 'LimiterLab'), 'loading');
    assert.match(code('src/features/intro/labTermSeenStore.ts'), /createLocalStore<string\[\]>\(\{\s*key: LAB_TERMS_SEEN_KEY,/);
  });
  it('a damaged blob is not trusted (parse throws → set aside by the store)', () => {
    assert.throws(() => L.parseSeenLabTerms({ x: 1 }));
    assert.deepEqual(L.parseSeenLabTerms(['A', 'A', 3, '', 'B']), ['A', 'B']);
  });
  it('the key is in the intro family, which BOTH wipes keep (account switch and guest wipe)', () => {
    assert.equal(seenStore.LAB_TERMS_SEEN_KEY, 'ape:intro:labTerms');
    const wipe = code('src/features/account/clearLocalAccountData.ts');
    assert.match(wipe, /function isOnboardingFlag\(k: string\): boolean \{\s*return \(\s*k\.startsWith\('ape:intro:'\)/);
    // The intro family is decided BEFORE the guest (`total`) allowlist.
    assert.match(wipe, /if \(isOnboardingFlag\(k\)\) return true;\s*return opts\?\.total === true \? GUEST_KEEP\.has\(k\) : KEEP\.has\(k\);/);
  });
});

describe('7. reach and weight', () => {
  it('every catalog lab route is registered through withMembershipPreview, which mounts the popup', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    const wrapped = new Set<string>();
    // Loader tables: `Name: lazyScreen(() => withMembershipPreview(` …
    for (const m of nav.matchAll(/^\s*(\w+): lazyScreen\(\(\) => withMembershipPreview\(/gm)) wrapped.add(m[1]);
    const regs = new Map<string, string>();
    for (const m of nav.matchAll(/<Stack\.Screen\s+name="(\w+)"[\s\S]{0,220}?getComponent=\{(\w+)\.(\w+)\}/g)) regs.set(m[1], m[3]);
    const notWrapped = [...new Set(leaves.map((l) => l.route as string))].filter((r) => !wrapped.has(regs.get(r) ?? ''));
    assert.deepEqual(notWrapped, []);
    const gate = code('src/features/lab/withMembershipPreview.tsx');
    assert.match(gate, /require\('\.\.\/intro\/LabTermIntro'\)/);
    assert.match(gate, /<LabTermIntroSlot routeName=\{route\.name\} params=\{route\.params\} \/>/);
  });
  it('none of it is in the app-start graph (it is required on first use)', () => {
    const EXTS = ['.tsx', '.ts', '.js', '.jsx', '.json'];
    const resolveFile = (fromAbs: string, spec: string): string | null => {
      const base = resolve(dirname(fromAbs), spec);
      if (existsSync(base) && statSync(base).isFile()) return base;
      for (const e of EXTS) if (existsSync(base + e)) return base + e;
      for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
      return null;
    };
    const seen = new Set<string>();
    const walk = (abs: string) => {
      if (seen.has(abs)) return;
      seen.add(abs);
      if (abs.endsWith('.json')) return;
      const src = readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
        if (!m[1].startsWith('.')) continue;
        const r = resolveFile(abs, m[1]);
        if (r) walk(r);
      }
    };
    walk(join(ROOT, 'App.tsx'));
    const start = new Set([...seen].map((a) => relative(ROOT, a).split('\\').join('/')));
    for (const f of [
      'src/features/intro/LabTermIntro.tsx',
      'src/features/intro/labTermIntros.ts',
      'src/features/intro/labTermIntroData.ts',
      'src/features/intro/labTermSeenStore.ts',
    ]) {
      assert.equal(start.has(f), false, `${f} is in the start graph`);
    }
    assert.ok(start.has('src/features/intro/screenIntros.ts'), 'precondition: the signals live in a file already at start');
  });
});
