/**
 * Mastering Lab — toddler + cat bug pass 2 (2026-10-01, after pass 1
 * 0d1f56ea). The progress store is exercised for real (a key-value stub);
 * the screen fixes are pinned by source guards, the reasoning beside each
 * fix in the source.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { data: Map<string, string> };
const g = globalThis as unknown as { __masteringKv2: Kv };
g.__masteringKv2 = { data: new Map() };
const STUB = `export default {
  getItem: async (k) => { const kv = globalThis.__masteringKv2; return kv.data.has(k) ? kv.data.get(k) : null; },
  setItem: async (k, v) => { globalThis.__masteringKv2.data.set(k, v); },
  removeItem: async (k) => { globalThis.__masteringKv2.data.delete(k); },
};`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: `data:text/javascript,${encodeURIComponent(STUB)}`, shortCircuit: true };
    // The store now imports the shared sign-in hand-off ledger (2026-10-01),
    // an extensionless relative import like the rest of src/.
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const progress = await import('../src/screens/lab/mastering/masteringProgress.ts');
const { updateMasteringProgress, setMasteringSaveBlocked } = progress;
const carryPreLoad = (progress as Record<string, unknown>).carryPreLoad as
  | ((s: unknown, pre: unknown) => void)
  | undefined;

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/mastering';
const KEY = 'ape:mastering:v1';
const host = () => strip(read(`${DIR}/MasteringLabScreen.tsx`));

describe('answers given before the tier resolves are not lost on leave', () => {
  it('the blocked store drops them (the bug), and the first load carries them in', async () => {
    const kv = g.__masteringKv2;
    kv.data.set(KEY, JSON.stringify({ modules: { what: { done: true, answers: { t1: true } }, project: { done: false, answers: {}, qc: ['q1'] } }, lastModule: 'what', lastStep: 0 }));
    // Before `resolved`: the host's onAnswered write runs against a blocked store.
    setMasteringSaveBlocked(true);
    await updateMasteringProgress((s) => {
      const m = s.modules.roles ?? { done: false, answers: {} };
      s.modules.roles = { ...m, answers: { ...m.answers, r1: false } };
    });
    assert.equal(JSON.parse(kv.data.get(KEY)!).modules.roles, undefined, 'premise: the pre-load answer was never written');
    // The tier resolves: the first load carries what the screen held.
    setMasteringSaveBlocked(false);
    assert.equal(typeof carryPreLoad, 'function', 'masteringProgress exports carryPreLoad');
    await updateMasteringProgress((s) => carryPreLoad!(s, {
      answers: { roles: { r1: false, r2: true }, what: { t1: false } },
      checks: ['c1'],
      qc: ['q2'],
      at: { module: 'roles', step: 2 },
    }));
    const st = JSON.parse(kv.data.get(KEY)!);
    assert.deepEqual(st.modules.roles.answers, { r1: false, r2: true });
    assert.equal(st.modules.what.answers.t1, true, 'the stored (first) answer wins');
    assert.equal(st.modules.what.done, true, 'credit untouched');
    assert.deepEqual(st.modules.project.qc, ['q1', 'q2'], 'ticks are a union');
    assert.deepEqual(st.modules.project.checks, ['c1']);
    assert.equal(st.lastModule, 'roles');
    assert.equal(st.lastStep, 2);
  });
  it('the host holds pre-load answers and hands them to the FIRST unblocked load only', () => {
    const h = host();
    assert.match(h, /if \(!loadedRef\.current\) \{\s*const held = preAnswersRef\.current\[modId\] \?\? \{\};/);
    assert.match(h, /const pre: MasteringPreLoad \| null = !loaded && !blocked/);
    assert.match(h, /answers: preAnswersRef\.current,/);
    assert.match(h, /at: movedRef\.current \? \{ module: modIdRef\.current, step: stepRef\.current \} : undefined,/);
    // Hunt 6: the carry reports a failed read only on the last retry.
    assert.match(h, /void updateMasteringProgress\(\(s\) => \{\s*if \(pre\) carryPreLoad\(s, pre\);\s*\}, readRetriesRef\.current >= 3\)/);
  });
});

describe('the store unblocking (a failed tier read landing, a guest signing in) re-reads', () => {
  it('the load effect runs again when `blocked` lifts after a blocked load, and merges', () => {
    const h = host();
    assert.match(h, /const reread = loaded && loadedBlockedRef\.current && !blocked;\s*if \(loaded && !reread\) return;/);
    // Pass 3: a failed read is retried (readRetry), see masteringToddlerPass3.
    assert.match(h, /\}, \[resolved, loaded, blocked, readRetry\]\);/);
    assert.match(h, /setDoneIds\(\(prev\) => new Set\(\[\.\.\.prev, \.\.\.stored\]\)\);/);
    // Module 8 remounts on every landed load to read the lists it produced.
    assert.match(h, /<Fragment key=\{mod\.id === 'project' \? `reload:\$\{loadGen\}` : 'steady'\}>\s*<Component /);
    assert.match(h, /loadedBlockedRef\.current = wasBlocked;/);
  });
});

describe("openModule's read never overwrites newer state", () => {
  it('a superseded open is ignored, and a Module 8 tick made while the read was queued wins over it', () => {
    const h = host();
    const open = h.slice(h.indexOf('const openModule = useCallback'), h.indexOf('const onAnswered = useCallback'));
    assert.match(open, /const seq = \+\+openSeqRef\.current;\s*const projectRev = projectRevRef\.current;/);
    assert.match(open, /if \(seq !== openSeqRef\.current\) return;/);
    // Pass 3 adds the not-from-the-store guard between the two.
    assert.match(open, /if \(projectRev !== projectRevRef\.current\) return;\s*if \(!masteringReadFromStore\(s\)\) return;\s*const p = s\.modules\.project;\s*setProject/);
    const ps = h.slice(h.indexOf('const onProjectState = useCallback'));
    assert.match(ps, /^const onProjectState = useCallback\(\(checks: string\[\], qc: string\[\]\) => \{\s*projectRevRef\.current\+\+;/);
  });
  it('FINISH read landing after a move does not open the what\'s-left screen', () => {
    const h = host();
    assert.match(h, /const seq = \+\+navSeqRef\.current;\s*void updateMasteringProgress\(\(\) => \{\}\)\.then\(\(s\) => \{\s*if \(seq === navSeqRef\.current\) setEndState\(s\);/);
    assert.match(h, /const unEnd = useCallback\(\(\) => \{\s*navSeqRef\.current\+\+;/);
    const setStep = h.slice(h.indexOf('const setStep = useCallback'), h.indexOf('const onSteps'));
    assert.match(setStep, /navSeqRef\.current\+\+;/);
  });
});

describe('PRACTICE cards remounted by a step change show the recorded answers', () => {
  it('the host provides its answers; the deck reads them, opens on the first unanswered card, and each card shows its record', () => {
    assert.match(host(), /<RecordedAnswersContext\.Provider value=\{answers\}>/);
    const kit = strip(read(`${DIR}/kit.tsx`));
    assert.match(kit, /export const RecordedAnswersContext = createContext/);
    assert.match(kit, /const recorded = useContext\(RecordedAnswersContext\);\s*const \[cur, setCur\] = useState\(\(\) => Math\.max\(0, scenarios\.findIndex\(\(s\) => !\(s\.id in recorded\)\)\)\);/);
    assert.match(kit, /<ScenarioCard [^\n]*recorded=\{recorded\[s\.id\]\}/);
    assert.match(kit, /const picked = pickedHere \?\? \(recorded === true \? s\.correct : null\);/);
    assert.match(kit, /picked == null && recorded === false \?/);
  });
});

describe('Module 8: the QC card claims "Delivered" only when the module is', () => {
  it('every QC line ticked with a track decision open reads QC complete and names what is open', () => {
    const s = strip(read(`${DIR}/modules/mod8Project.tsx`));
    assert.match(s, /const openDecisions = PROJECT_TRACKS\.filter\(\(t\) => !\(t\.issue\.id in recorded\)\)\.length;/);
    assert.match(s, /title=\{!qcDone \? `\$\{qc\.size\} of \$\{PROJECT_QC\.length\}` : openDecisions === 0 \? 'Delivered' : 'QC complete'\}/);
    assert.doesNotMatch(s, /qc\.size === PROJECT_QC\.length \? 'Delivered'/);
  });
});

describe('LISTEN readouts never quote an earlier setting', () => {
  it('the hook says whether the measures belong to the current versions', () => {
    const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
    assert.match(hook, /setMeasuredKey\(JSON\.stringify\(variants\)\);\s*setMeasured\(measuredNext\);/);
    assert.match(hook, /current: measuredKey === variantsKey,/);
  });
  it('bezel measures need `current`; match gains (glass label, MATCH cell) need a READY render', () => {
    for (const [f, other] of [['mod5Workflow.tsx', 'eq'], ['mod6Loudness.tsx', 'l']] as const) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.match(s, /\.\.\.measureBezel\(current \? m : undefined/, f);
      assert.match(s, new RegExp(`matchBezel\\(matched, fresh \\? ${other}\\?\\.matchDb : undefined`), f);
      assert.match(s, /<WaveOverviewStage[^\n]*matchDb=\{fresh \? m\?\.matchDb : undefined\}/, f);
    }
    const m1 = strip(read(`${DIR}/modules/mod1What.tsx`));
    assert.match(m1, /const fresh = pb\.status === 'ready';/);
    assert.match(m1, /<WaveOverviewStage[^\n]*matchDb=\{fresh \? m\?\.matchDb : undefined\}/);
    assert.match(m1, /matchBezel\(matched, fresh \? loud\?\.matchDb : undefined, 'LOUDER'\)/);
    // The card's matched gain from the two loudness numbers (what matchedGains does), not a stale render.
    assert.doesNotMatch(m1, /LOUDER is played at \$\{loud\.matchDb/);
  });
});
