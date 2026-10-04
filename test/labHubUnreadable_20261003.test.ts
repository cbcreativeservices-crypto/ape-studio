/**
 * Lab hubs never say "not started" when the saved progress could not be read
 * (owner 2026-10-03, "do 2"; house rule D51 — a screen showing saved data has
 * three faces: loading, UNREADABLE, truly empty).
 *
 * Hunts 6 and 7 made every lab progress store refuse to write over a copy it
 * could not read, and say so when a change was dropped. But the hubs still
 * drew the empty stand-in as the learner's record: "0 of 8 modules complete",
 * no ✓, START instead of RESUME, a what's-left list with everything left.
 *
 * (A) behaviour: each store answers a read-only query that is TRUE after a
 *     getItem that throws and FALSE after a read that lands — the hub's only
 *     way to tell "unreadable" from "nothing saved yet".
 * (B) source: each hub renders the ONE shared note (kit/ProgressUnreadableNote,
 *     words in kit/labEnd PROGRESS_UNREADABLE) ahead of its progress line /
 *     module rows, and hands `unreadable` to the shared what's-left screen.
 * Credit is never touched: markLabUnit and the credit writes are unchanged.
 * R2: run against the HEAD stores and hubs (new note file removed) and failed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string>; failGet: boolean };
const kv: Kv = { map: new Map(), failGet: true }; // the BOOT read fails too
(globalThis as unknown as { __lhuKv: Kv }).__lhuKv = kv;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__lhuKv; export default {
    getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
    multiGet: async (ks) => { if (s.failGet) throw new Error('unreadable'); return ks.map((k) => [k, s.map.has(k) ? s.map.get(k) : null]); },
    setItem: async (k, v) => { s.map.set(k, v); },
    multiSet: async (rows) => { for (const [k, v] of rows) s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `export const supabase = { rpc: async () => ({ data: null, error: { message: 'user_not_found' } }) };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'lhu-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'lhu-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'lhu-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'lhu-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('lhu-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('lhu-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const ear = await import('../src/features/ear/earProgress.ts');
const amp = await import('../src/features/amp/ampProgress.ts');
const tuning = await import('../src/features/tuning/tuningProgress.ts');
const paged = await import('../src/features/lab/pagedProgress.ts');
const ss = await import('../src/features/soundsystems/progress.ts');
const completion = await import('../src/features/lab/labCompletion.ts');
const visits = await import('../src/features/lab/labVisits.ts');
const drum = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const mastering = await import('../src/screens/lab/mastering/masteringProgress.ts');
const labEnd = await import('../src/screens/lab/kit/labEnd.ts');

const tick = () => new Promise((r) => setTimeout(r, 0));
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const q = (name: string, mod: Record<string, unknown>) => {
  const fn = mod[name];
  assert.equal(typeof fn, 'function', `${name} is not exported — the hub cannot tell "unreadable" from "not started"`);
  return fn as (...a: unknown[]) => boolean;
};

/* ── (A) every store can say its read failed ─────────────────────────────── */

describe('(A) a getItem that throws → the store says "unreadable"; a read that lands → it does not', () => {
  it('labCompletion (banked units — Digital / Gain / Meter / Wave / Cable / paged credit)', async () => {
    // The boot read (module load) threw.
    await tick();
    const unreadable = q('isLabCompletionUnreadable', completion);
    assert.equal(unreadable(), true, 'a failed boot read must not read as "no units banked"');
    kv.failGet = false;
    completion.registerLabUnits('af_digital_audio', ['m1']); // a mount reads again
    await tick();
    await tick();
    assert.equal(unreadable(), false, 'a read that landed clears it');
    assert.equal(typeof completion.useLabCompletionUnreadable, 'function', 'the hubs need the reactive form');
    kv.failGet = true;
  });

  it('labVisits (EQ / Cymatics / Room Design / Mic Selection / Tube)', async () => {
    kv.failGet = true;
    const unreadable = q('isLabVisitsUnreadable', visits);
    visits.markLabVisit('lhu-lab', 'a', { persist: false });
    visits.markLabVisit('lhu-lab', 'b'); // persists → reads first
    await tick();
    assert.equal(unreadable(), true);
    kv.failGet = false;
    visits.markLabVisit('lhu-lab', 'c');
    await tick();
    await tick();
    assert.equal(unreadable(), false);
    assert.equal(typeof visits.useLabVisitsUnreadable, 'function');
  });

  it('Ear Training: the ladder handed out by a failed read is tagged; a readable one is not', async () => {
    ear.setEarSaveBlocked(false);
    kv.failGet = true;
    const bad = await ear.loadEarProgress();
    assert.equal(q('isEarProgressUnreadable', ear)(bad), true);
    kv.failGet = false;
    const good = await ear.loadEarProgress();
    assert.equal(q('isEarProgressUnreadable', ear)(good), false, 'a truly empty ladder is "not started", not unreadable');
  });

  it('Amplifier Principles: the hub’s focus read (updateAmpProgress no-op) is tagged', async () => {
    amp.setAmpSaveBlocked(false);
    kv.failGet = true;
    const bad = await amp.updateAmpProgress(() => {});
    assert.equal(q('isAmpProgressUnreadable', amp)(bad), true);
    kv.failGet = false;
    const good = await amp.updateAmpProgress(() => {});
    assert.equal(q('isAmpProgressUnreadable', amp)(good), false);
  });

  it('Tuning & Temperament', async () => {
    kv.failGet = true;
    await tuning.loadTuningProgress();
    assert.equal(q('isTuningProgressUnreadable', tuning)(), true);
    kv.failGet = false;
    await tuning.loadTuningProgress();
    assert.equal(q('isTuningProgressUnreadable', tuning)(), false);
  });

  it('paged labs (PagedLab, Sound Systems modes, Start Here)', async () => {
    kv.failGet = true;
    await paged.loadPagedProgress('lhu-paged');
    assert.equal(q('isPagedProgressUnreadable', paged)('lhu-paged'), true);
    assert.equal(q('isPagedProgressUnreadable', paged)('lhu-other'), false, 'per lab');
    kv.failGet = false;
    await paged.loadPagedProgress('lhu-paged');
    assert.equal(q('isPagedProgressUnreadable', paged)('lhu-paged'), false);
  });

  it('Sound Systems record (faults / capstones / exercises)', async () => {
    kv.failGet = true;
    ss.getSoundSystemsProgress(); // the hub's first read
    await tick();
    await tick();
    assert.equal(q('isSoundSystemsProgressUnreadable', ss)(), true);
    assert.equal(typeof ss.useSoundSystemsProgressUnreadable, 'function');
    kv.failGet = false;
  });

  it('Drum Tuning / Mastering already answer it (drumReadFailed / masteringReadFailed)', async () => {
    drum.setDrumSaveBlocked(false);
    mastering.setMasteringSaveBlocked(false);
    kv.failGet = true;
    assert.equal(drum.drumReadFailed(await drum.updateDrumProgress(() => {})), true);
    assert.equal(mastering.masteringReadFailed(await mastering.updateMasteringProgress(() => {}, false)), true);
    kv.failGet = false;
  });
});

/* ── (B) the hubs say it, with one shared note, ahead of "not started" ───── */

const NOTE = '<ProgressUnreadableNote';

/** `first` occurs, and before `second` (the progress line / the rows). */
function before(src: string, first: string, second: string, what: string): void {
  const a = src.indexOf(first);
  const b = src.indexOf(second);
  assert.ok(a >= 0, `${what}: ${first} is missing`);
  assert.ok(b >= 0, `${what}: ${second} is missing (test anchor moved?)`);
  assert.ok(a < b, `${what}: ${first} must render before ${second}`);
}

describe('(B) one shared note, in every hub, before the "not started" face', () => {
  it('the words are the house wording, in one place', () => {
    assert.equal(
      labEnd.PROGRESS_UNREADABLE,
      'Your saved progress could not be read from this device just now — it is not lost, and nothing is written over it. Leave this lab and come back to try again.',
    );
    const note = read('src/screens/lab/kit/ProgressUnreadableNote.tsx');
    assert.match(note, /export function ProgressUnreadableNote/);
    assert.match(note, /\{PROGRESS_UNREADABLE\}/);
    assert.doesNotMatch(note, /Alert\.alert/);
  });

  it('the shared what’s-left screen swaps its lead line for the note', () => {
    const src = read('src/screens/lab/kit/LabEndScreen.tsx');
    assert.match(src, /unreadable\?: boolean;/);
    before(src, '{unreadable ? (\n        <ProgressUnreadableNote />', 'endLead(w,', 'LabEndScreen');
  });

  it('Ear Training hub', () => {
    const src = read('src/screens/lab/eartraining/EarTrainingLabScreen.tsx');
    assert.match(src, /isEarProgressUnreadable\(progress\)/);
    before(src, NOTE, '{EAR_MODULES.map(', 'Ear');
    assert.match(src, /const p = unreadable \? undefined : progress\?\.modules\[m\.id\]/);
  });

  it('Amplifier Principles hub: loading and unreadable before "N of M modules complete"', () => {
    const src = read('src/screens/lab/amp/AmpLabHomeScreen.tsx');
    before(src, '<ProgressUnreadableNote />', 'modules complete</Text>', 'Amp');
    before(src, '<ProgressLoadingNote />', 'modules complete</Text>', 'Amp (loading)');
    assert.match(src, /unreadable=\{unreadable\}/);
    assert.match(read('src/screens/lab/amp/AmpModuleScreen.tsx'), /unreadable=\{isAmpProgressUnreadable\(endState\)\}/);
  });

  it('Tuning & Temperament', () => {
    const src = read('src/screens/lab/tuning/TuningLabScreen.tsx');
    assert.match(src, /setUnreadable\(!guestRef\.current && isTuningProgressUnreadable\(\)\)/);
    before(src, NOTE, '<LabEndScreen', 'Tuning');
    assert.match(src, /unreadable=\{unreadable\}/);
  });

  it('Drum Tuning and Mastering: after the retries run out, the note — not an empty record', () => {
    for (const [p, q2] of [
      ['src/screens/lab/drumtuning/DrumTuningLabScreen.tsx', 'drumReadFailed'],
      ['src/screens/lab/mastering/MasteringLabScreen.tsx', 'masteringReadFailed'],
    ] as const) {
      const src = read(p);
      assert.match(src, new RegExp(`setProgressUnreadable\\(!wasBlocked && ${q2}\\(s\\)\\)`), p);
      assert.match(src, new RegExp(`unreadable=\\{${q2}\\(endState\\)\\}`), p);
      assert.match(src, /\{progressUnreadable && !end \? <ProgressUnreadableNote/, p);
    }
  });

  it('Cable Install: intro and WHAT IS LEFT', () => {
    const src = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(src, /useLabCompletionUnreadable\(\)/);
    assert.match(src, /if \(alive\) setRunReadFailed\(readRef\.current === 'failed'\);/);
    before(src, '{unreadable ? <ProgressUnreadableNote /> : started ?', '{progressLine}</Text>', 'Cable Install intro');
    before(src, '{unreadable ? (\n            <ProgressUnreadableNote />', 'ciLeftLead(saveState', 'Cable Install what is left');
  });

  it('paged shells: PagedLab, Sound Systems modes, Start Here', () => {
    for (const p of ['src/screens/lab/kit/PagedLab.tsx', 'src/screens/lab/soundsystems/SsPagedLab.tsx', 'src/screens/startHere/StartHereScreen.tsx']) {
      const src = read(p);
      assert.match(src, /isPagedProgressUnreadable\(/, p);
      assert.ok(src.includes(NOTE), p);
      assert.match(src, /unreadable=\{(unreadable|pagesUnreadable)\}/, p);
    }
  });

  it('Sound Systems hub: no "0/N" before the read, the note when any record is unreadable', () => {
    const src = read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
    before(src, '{unreadable ? <ProgressUnreadableNote /> : pagesRead === \'pending\' ? <ProgressLoadingNote /> : null}', '{SS_MODES.map((m) => {\n          const row', 'Sound Systems');
    assert.match(src, /\{known \? `\$\{row\.done\}\/\$\{row\.total\}` : '—'\}/);
    assert.match(src, /useSoundSystemsProgressUnreadable\(\)/);
    assert.match(src, /useLabCompletionUnreadable\(\)/);
  });

  it('module hubs on the banked units: Digital, Gain, Meter, Wave, Cable', () => {
    for (const [p, row] of [
      ['src/screens/lab/digital/DigitalLabHomeScreen.tsx', '<ModuleAccordionRow'],
      ['src/screens/lab/gain/GainLabHomeScreen.tsx', '<ModuleAccordionRow'],
      ['src/screens/lab/meter/MeterLabHomeScreen.tsx', '<ModuleAccordionRow'],
      ['src/screens/lab/wave/WaveLabHomeScreen.tsx', '<ModuleAccordionRow'],
      ['src/screens/lab/cable/CableLabScreen.tsx', '<Body key='],
    ] as const) {
      const src = read(p);
      assert.match(src, /useLabCompletionUnreadable\(\)/, p);
      before(src, NOTE, row, p);
    }
    for (const p of ['digital/DigitalLabHomeScreen', 'gain/GainLabHomeScreen', 'meter/MeterLabHomeScreen', 'wave/WaveLabHomeScreen']) {
      assert.match(read(`src/screens/lab/${p}.tsx`), /unreadable=\{unreadable\}/, p);
    }
    assert.match(read('src/screens/lab/cable/CableLabScreen.tsx'), /total > 0 && !unreadable/);
  });

  it('visit hubs: EQ, Cymatics, Room Design', () => {
    for (const p of ['eq/EqLabHomeScreen', 'cymatics/CymaticsHomeScreen', 'roomdesign/RoomDesignLabScreen']) {
      const src = read(`src/screens/lab/${p}.tsx`);
      assert.match(src, /useLabVisitsUnreadable\(\)/, p);
      assert.match(src, /unreadable=\{visitsUnreadable\}/, p);
    }
    before(read('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx'), NOTE, '<LabEndScreen', 'Room Design');
  });

  it('every other what’s-left screen fed by these stores is told too', () => {
    for (const p of [
      'digital/DigitalModuleScreen', 'gain/GainModuleScreen', 'meter/MeterModuleScreen', 'wave/WaveModuleScreen',
      'foundations/FoundationsCourseScreen', 'micspeaker/MicPrinciplesLabScreen', 'micspeaker/SpeakerCoverageLabScreen',
      'cymatics/CymaticsModuleScreen', 'eq/EqModuleScreen', 'micselect/MicSelectLabScreen', 'tube/VacuumTubeLabScreen',
    ]) {
      assert.match(read(`src/screens/lab/${p}.tsx`), /unreadable=\{progressUnreadable\}/, p);
    }
  });

  it('credit is only ever read: no hub change touches markLabUnit', () => {
    // The stores' new queries are reads; the credit writer is unchanged.
    const src = read('src/features/lab/labCompletion.ts');
    const fn = src.slice(src.indexOf('export function markLabUnit'), src.indexOf('type HeldUnits'));
    assert.doesNotMatch(fn, /lastReadFailed/);
  });
});
