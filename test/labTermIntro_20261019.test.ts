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
 *   1. every catalog lab is mapped — wired to a glossary term, or 'none'
 *      (the calculator lab, owner 2026-10-19); nothing is pending;
 *   2. the right term (and the right MEANING of it) per lab, the glossary
 *      text verbatim, and HOLD labs show nothing;
 *   3. who sees it: FREE labs show it to everyone ("yes, free labs should
 *      show pop up", owner 2026-10-19); on a MEMBERS-ONLY lab, members only:
 *      locked / checking / unconfirmed / preview → nothing,
 *      nothing owed, nothing marked seen;
 *   4. Low-Light (and the dev kill switch, the sampler) never auto-show it;
 *   5. ordering: it shows FIRST — the lab's own intros hold while it is owed —
 *      and never stacks on another Modal, a closing fade, a push, or the
 *      amplitude orientation page;
 *   6. once per TERM: CONTINUE writes the seen flag on the shared safe store
 *      (one flag per glossary row, so labs sharing a term share it),
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
const { LAB_CATEGORIES, categoryEntries, isMemberOnlyLabRoute } = await import('../src/screens/lab/labCatalog.ts');
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
  freeLab: false,
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

describe('1. every catalog lab is mapped (wired, HOLD or none) — and nothing else is', () => {
  it('each catalog lab row resolves to an entry', () => {
    const missing = leaves.filter((l) => L.labTermKey(l.route as string, l.params) == null).map((l) => `${l.name} (${l.route})`);
    assert.deepEqual(missing, [], 'a catalog lab with no term entry — add it as wired or hold');
  });
  it('every entry is a catalog lab (no stale rows)', () => {
    const keys = new Set(leaves.map((l) => L.labTermKey(l.route as string, l.params)));
    const stale = Object.keys(L.LAB_TERM_ENTRIES).filter((k) => !keys.has(k));
    assert.deepEqual(stale, []);
  });
  it('after the owner’s rulings (2026-10-19): 62 wired, none pending, the calculator lab has NO popup', () => {
    const all = Object.entries(L.LAB_TERM_ENTRIES);
    assert.equal(all.filter(([, e]) => e.status === 'wired').length, 62);
    assert.deepEqual(all.filter(([, e]) => e.status === 'hold').map(([k]) => k), []);
    assert.deepEqual(all.filter(([, e]) => e.status === 'none').map(([k]) => k), ['CalcLab']);
    assert.equal(L.wiredLabTerm(L.labTermKey('CalcLab')), null);
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
      // The owner's rulings, 2026-10-19: the ACTION (or the device) as it
      // applies to audio — "always explain the action".
      AmplitudeLab: 'Amplitude',
      FoundationsPlayground: 'Sound Wave',
      WaveLab: 'Acoustics',
      SpeakerLab: 'Coverage pattern',
      RoomDesignLab: 'Acoustic Treatment',
      MeterLab: 'Audio Analyzer',
      'MeterModule:detective': 'Troubleshooting',
      CableLab: 'Cables (audio)',
      ConnectorSelectLab: 'Connector',
      PatchbayLab: 'Patch bay',
      MixingGuides: 'Mixing',
      CompressionLab: 'Dynamic range compression',
      GateLab: 'Downward expansion',
      SmartProcessorsLab: 'De-esser',
      FmLab: 'Frequency modulation synthesis',
      EnvelopeLab: 'Envelope',
      BinauralLab: 'Binaural rendering',
      AutotuneLab: 'Vocal tuning pass',
      TuningLab: 'Tuning systems',
      BassLab: 'String length',
      MicSelectLab: 'Mic Technique',
      'MikingHub:drums': 'miking',
      'MikingHub:percussion': 'miking',
      'MikingHub:winds': 'miking',
      'MikingHub:strings': 'miking',
      'MikingHub:ensembles': 'miking',
      'MikingHub:field': 'miking',
      'MikingHub:broadcast': 'miking',
      SpeechLab: 'miking',
    };
    for (const [key, term] of Object.entries(want)) assert.equal(L.wiredLabTerm(key)?.term, term, key);
    assert.equal(Object.keys(want).length, 62, 'every wired lab is pinned here');
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
  it('Compression is the DYNAMICS process — never the air-pressure "Compression" or file "Audio compression"', () => {
    const c = wired('CompressionLab');
    assert.equal(c?.term, 'Dynamic range compression');
    assert.equal(c?.glossaryId, '037a431c-1b1a-418f-b6c1-51e0cea14a9b');
    assert.equal(
      c?.plainEnglish,
      'A compressor makes loud parts quieter, shrinking the gap between soft and loud. Above a set level (the threshold), it turns the signal down by a chosen ratio. Attack and release set how fast it reacts. Make-up gain restores overall loudness.',
    );
  });
  it('miking is the ACTION: every miking lab, the Speech & Voice lab and the Voice & Ensemble tile define "miking"', () => {
    const MIKING_ID = 'a40d40b1-35b3-496c-b488-65163b445bed';
    for (const lab of ['drums', 'percussion', 'winds', 'strings', 'ensembles', 'field', 'broadcast']) {
      assert.equal(wired('MikingHub', { lab })?.glossaryId, MIKING_ID, lab);
    }
    assert.equal(wired('SpeechLab')?.glossaryId, MIKING_ID);
    assert.equal(
      wired('MikingHub', { lab: 'ensembles' })?.plainEnglish,
      'Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.',
    );
    // Microphone Selection: the glossary's "Mic Technique" (picking + placing the mic).
    assert.equal(wired('MicSelectLab')?.glossaryId, '786545cf-6e0b-4b3e-9d3c-cf2fb1ec561c');
  });
  it('no wired term or text names a maker, model or product; no wrong-meaning or brand-name row is used', () => {
    const BRAND = /Yamaha|DX7|Shure|Neumann|Royer|SM7B|U87|R-121|auto-?tune|Antares|Melodyne|Speakon|Digital Performer/i;
    // Wrong meaning for a lab: air-pressure "Compression", file "Audio compression",
    // synth "Voice", RF "Spectrum Analyzer", operations "Monitoring".
    // A brand or product in the text: "FM Synthesis" (DX7), "Microphone types" (three makers),
    // "Auto-Tune", and "Pitch Correction" (its text ends with 'auto-tune').
    const BANNED = new Set([
      '0944f59b-bf79-4181-81bb-92d2c386b560',
      '7c954ccd-5c2b-4583-806d-5e3e11b9d745',
      '4fe4d0a5-eb3c-46ff-8060-2f6a9f490071',
      'fc1e912c-784d-438b-80f6-0355dcbaae68',
      '3da4e8b1-4f93-4963-be24-f28c9b3b780b',
      '745577c4-83bd-4537-a5bf-0f71af58519e',
      '54aff4e0-22ca-48de-8b4a-11a04317760f',
      'ba8a3ddf-2979-5b0d-b944-485136f685a4',
      '76962e8d-9fa1-4ecf-85b7-69dc19cbf989',
    ]);
    for (const e of Object.values(L.LAB_TERM_ENTRIES)) {
      if (e.status !== 'wired') continue;
      assert.doesNotMatch(e.plainEnglish, BRAND, e.lab);
      assert.doesNotMatch(e.term, BRAND, e.lab);
      assert.ok(!BANNED.has(e.glossaryId), `${e.lab}: uses a wrong-meaning or brand-name glossary row`);
      assert.ok(!['Compression', 'Voice', 'Spectrum Analyzer', 'Monitoring', 'FM Synthesis', 'Microphone types'].includes(e.term), e.lab);
    }
    // FM by its generic name; Autotune by pitch-correction software, no product name.
    assert.equal(wired('FmLab')?.term, 'Frequency modulation synthesis');
    assert.match(wired('AutotuneLab')?.plainEnglish ?? '', /Software nudges each note to the right pitch/);
  });
  it('the title raises only the first letter; the definition is untouched', () => {
    assert.equal(L.labTermTitle('delay'), 'Delay');
    assert.equal(L.labTermTitle('Signal Chain (Signal Path)'), 'Signal Chain (Signal Path)');
  });
  it('HOLD and "none" labs show nothing and owe nothing', () => {
    const holds = Object.entries(L.LAB_TERM_ENTRIES).filter(([, e]) => e.status !== 'wired');
    assert.ok(holds.length > 0);
    for (const [key] of holds) assert.equal(L.wiredLabTerm(key), null, key);
    assert.deepEqual(state({ wired: false }), { owed: false, show: false });
    // The host returns before any hook for a HOLD / unmapped lab.
    assert.match(code('src/features/intro/LabTermIntro.tsx'), /const term = wiredLabTerm\(labTermKey\(routeName, params\)\);\s*if \(!term\) return null;/);
  });
});

describe('3. who sees it: everyone on a FREE lab, members only on a members-only lab', () => {
  it('members-only lab — locked (guest or free), checking and unconfirmed: nothing shown, nothing owed', () => {
    for (const gate of ['locked', 'checking', 'unconfirmed'] as const) {
      assert.deepEqual(state({ gate }), { owed: false, show: false }, gate);
    }
  });
  it('never over a members-only preview scrim', () => {
    assert.deepEqual(state({ previewActive: true }), { owed: false, show: false });
  });
  it('a FREE lab shows it to guests and free users too (owner 2026-10-19: "yes, free labs should show pop up")', () => {
    assert.equal(L.wiredLabTerm(L.labTermKey('FoundationsCourse'))?.term, 'Sound');
    for (const gate of ['open', 'locked', 'checking', 'unconfirmed'] as const) {
      assert.deepEqual(state({ freeLab: true, gate }), { owed: true, show: true }, gate);
    }
    // First time only: once seen (by any lab with that term) it never comes back.
    assert.deepEqual(state({ freeLab: true, gate: 'locked', seen: true }), { owed: false, show: false });
    // Low-Light and the stacking rules still apply.
    assert.deepEqual(state({ freeLab: true, gate: 'locked', suppressed: true }), { owed: true, show: false });
  });
  it('the free labs are exactly the catalog’s non-members-only labs (calculator: no popup)', () => {
    const free = [...new Set(leaves.filter((l) => !isMemberOnlyLabRoute(l.route as string)).map((l) => L.labTermKey(l.route as string, l.params)))].sort();
    assert.deepEqual(free, ['AmplitudeLab', 'CalcLab', 'FoundationsCourse', 'WaveLab']);
    for (const k of ['AmplitudeLab', 'FoundationsCourse', 'WaveLab']) assert.ok(L.wiredLabTerm(k), k);
    assert.equal(L.wiredLabTerm('CalcLab'), null);
    // Members-only labs stay members-only, for example the miking tiles and Compression.
    assert.equal(isMemberOnlyLabRoute('MikingHub'), true);
    assert.equal(isMemberOnlyLabRoute('CompressionLab'), true);
  });
  it('the wrapper tells the popup which kind of lab it is, from the same rule it gates on', () => {
    const gate = code('src/features/lab/withMembershipPreview.tsx');
    assert.match(gate, /<LabTermIntroHost routeName=\{routeName\} params=\{params\} freeLab=\{!isMemberOnlyLabRoute\(routeName\)\} \/>/);
    const host = code('src/features/intro/LabTermIntro.tsx');
    assert.match(host, /freeLab = false,/, 'members only unless told the lab is free');
    assert.match(host, /const base = \{\s*wired: true,\s*freeLab,/);
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

describe('6. once per TERM (glossary row), on the shared safe store', () => {
  it('a new device: unseen → CONTINUE → seen, written, and never shown again', async () => {
    AS.clear();
    await seenStore.labTermsSeenHydrate();
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'CompressionLab'), false);
    assert.equal(await seenStore.markLabTermSeen('LimiterLab'), true);
    // Stored per glossary TERM (its row id), not per lab.
    assert.deepEqual(JSON.parse(AS.get('ape:intro:labTerms') ?? 'null'), ['term:7f621dc4-6d04-4c29-bc61-e6352f8afcd8']);
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'LimiterLab'), true);
    assert.deepEqual(state({ seen: true }), { owed: false, show: false });
    // Twice is still once.
    await seenStore.markLabTermSeen('LimiterLab');
    assert.deepEqual(JSON.parse(AS.get('ape:intro:labTerms') ?? 'null'), ['term:7f621dc4-6d04-4c29-bc61-e6352f8afcd8']);
    // Per lab: another lab is still owed.
    assert.equal(seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), 'ReverbLab'), false);
  });
  it('one term, many labs: CONTINUE on one miking lab means no popup on any other miking lab (owner 2026-10-19)', async () => {
    // A fresh device: the reset drops both the stored key and the store's memory.
    await intros.resetScreenIntros();
    await settle();
    await seenStore.labTermsSeenHydrate();
    assert.deepEqual([...seenStore.seenLabTerms()], []);
    const seenOf = (k: string) => seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), k);
    const MIKING = ['MikingHub:drums', 'MikingHub:percussion', 'MikingHub:winds', 'MikingHub:strings', 'MikingHub:ensembles', 'MikingHub:field', 'MikingHub:broadcast', 'SpeechLab'];
    for (const k of MIKING) assert.equal(seenOf(k), false, k);
    await seenStore.markLabTermSeen('MikingHub:drums');
    for (const k of MIKING) assert.equal(seenOf(k), true, k);
    assert.deepEqual(state({ seen: seenOf('MikingHub:strings') }), { owed: false, show: false });
    // A different term is still owed, even a close cousin ("Mic Technique").
    assert.equal(seenOf('MicSelectLab'), false);
    assert.equal(seenOf('CompressionLab'), false);
  });
  it('one shared term: Beginning Mixing seen → Advanced Mixing and Mixing Guides seen; EQ the same', async () => {
    // A fresh device: the reset drops both the stored key and the store's memory.
    await intros.resetScreenIntros();
    await settle();
    await seenStore.labTermsSeenHydrate();
    assert.deepEqual([...seenStore.seenLabTerms()], []);
    const seenOf = (k: string) => seenStore.labTermSeenOf(true, false, seenStore.seenLabTerms(), k);
    await seenStore.markLabTermSeen('BeginningMixingLab');
    assert.equal(seenOf('AdvancedMixingLab'), true);
    assert.equal(seenOf('MixingGuides'), true);
    assert.equal(seenOf('EqLabHome'), false);
    await seenStore.markLabTermSeen('EqLab');
    assert.equal(seenOf('EqLabHome'), true);
    // Two flags cover five labs.
    assert.equal(JSON.parse(AS.get('ape:intro:labTerms') ?? '[]').length, 2);
  });
  it('an older per-LAB flag still counts, for its term: a lab already seen means its term is seen', () => {
    assert.equal(L.isLabTermSeen(['MikingHub:winds'], 'MikingHub:winds'), true);
    assert.equal(L.isLabTermSeen(['MikingHub:winds'], 'MikingHub:field'), true);
    assert.equal(L.isLabTermSeen(['AdvancedMixingLab'], 'BeginningMixingLab'), true);
    assert.equal(L.isLabTermSeen(['AdvancedMixingLab'], 'MasteringLab'), false);
    assert.equal(L.isLabTermSeen([], 'MikingHub:winds'), false);
    // A HOLD lab has no term, so only its own key could ever count.
    assert.equal(L.labTermSeenFlag('CalcLab'), 'CalcLab');
    assert.equal(L.labTermSeenFlag('SpeechLab'), 'term:a40d40b1-35b3-496c-b488-65163b445bed');
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
