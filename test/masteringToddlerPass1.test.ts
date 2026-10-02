/**
 * Mastering Lab — toddler + cat bug pass 1 (2026-10-01, after the standards
 * pass 31ec5de5). The progress store is exercised for real (a key-value stub
 * whose reads can fail); the screen fixes are pinned by source guards, the
 * reasoning beside each fix in the source.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// AsyncStorage is a native module: point it at a stub whose reads can fail.
type Kv = { data: Map<string, string>; failReads: number };
const g = globalThis as unknown as { __masteringKv: Kv };
g.__masteringKv = { data: new Map(), failReads: 0 };
const STUB = `export default {
  getItem: async (k) => { const kv = globalThis.__masteringKv; if (kv.failReads > 0) { kv.failReads--; throw new Error('transient'); } return kv.data.has(k) ? kv.data.get(k) : null; },
  setItem: async (k, v) => { globalThis.__masteringKv.data.set(k, v); },
  removeItem: async (k) => { globalThis.__masteringKv.data.delete(k); },
};`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: `data:text/javascript,${encodeURIComponent(STUB)}`, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { updateMasteringProgress, loadMasteringProgress, resetMasteringPractice, setMasteringSaveBlocked } = await import('../src/screens/lab/mastering/masteringProgress.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/mastering';
const KEY = 'ape:mastering:v1';

describe('progress store: one failed read never wipes banked credit', () => {
  it('an update that ran on an unreadable read writes nothing back', async () => {
    setMasteringSaveBlocked(false);
    const kv = g.__masteringKv;
    const stored = JSON.stringify({ modules: { what: { done: true, answers: { t1: true } }, loudness: { done: true, answers: {} } }, lastModule: 'loudness', lastStep: 2 });
    kv.data.set(KEY, stored);
    kv.failReads = 1;
    await updateMasteringProgress((s) => {
      s.lastStep = 4; // any move: a step change writes the resume point
    });
    assert.equal(kv.data.get(KEY), stored, 'the empty fallback was written over two banked modules');
    // A practice reset on a failed read must not wipe it either.
    kv.failReads = 1;
    await resetMasteringPractice();
    assert.equal(kv.data.get(KEY), stored);
    // Storage reads again: everything is still there and the next write lands.
    const s = await updateMasteringProgress((p) => {
      p.lastStep = 1;
    });
    assert.equal(s.modules.what?.done, true);
    assert.equal(s.modules.loudness?.done, true);
    assert.equal(JSON.parse(kv.data.get(KEY)!).lastStep, 1);
  });
  it('a damaged module entry (no answers map) is repaired on load instead of throwing on the next answer', async () => {
    setMasteringSaveBlocked(false);
    const kv = g.__masteringKv;
    kv.data.set(KEY, JSON.stringify({ modules: { what: { done: true }, roles: null, room: { answers: 'x' } } }));
    const p = await loadMasteringProgress();
    assert.deepEqual(p.modules.what, { done: true, answers: {} });
    assert.equal(p.modules.roles, undefined);
    assert.deepEqual(p.modules.room, { done: false, answers: {} });
    // The host's onAnswered mutation (`scenarioId in m.answers`) must not throw.
    const s = await updateMasteringProgress((st) => {
      const m = st.modules.what!;
      if ('t2' in m.answers) return;
      st.modules.what = { ...m, answers: { ...m.answers, t2: false } };
    });
    assert.equal(s.modules.what?.done, true, 'credit kept');
    assert.equal(s.modules.what?.answers.t2, false);
  });
});

describe('LISTEN pages', () => {
  it('tapping the display while a version renders STOPS the queued play (tap-to-toggle) — it used to queue it again', () => {
    for (const f of ['mod1What.tsx', 'mod5Workflow.tsx', 'mod6Loudness.tsx']) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.match(s, /<WaveOverviewStage[^\n]*onTap=\{\(\) => \(pb\.active \|\| pb\.pending \? pb\.stop\(\) : pb\.play\(shown\)\)\}/, f);
      assert.match(s, /<WaveOverviewStage[^\n]*pending=\{pb\.pending != null\}/, f);
    }
    assert.match(strip(read(`${DIR}/stages.tsx`)), /accessibilityLabel=\{onTap \? \(playing \|\| pending \? `Stop \$\{label\}` : `Play \$\{label\}`\) : undefined\}/);
  });
  it('the MATCH-off volume warning never quotes a step measured for an earlier DRIVE / TILT setting', () => {
    // pb.measured survives a fader change (the waveform stays drawn) until the
    // next render; only a READY render belongs to the current setting.
    const m6 = strip(read(`${DIR}/modules/mod6Loudness.tsx`));
    assert.match(m6, /const fresh = pb\.status === 'ready';/);
    // Pass 2: `current` (the measures belong to this DRIVE) — MATCH off keeps the real step.
    assert.match(m6, /unmatchedWarning\(current \? q\?\.lufs : undefined, current \? l\?\.lufs : undefined, 'LOUDER'\)/);
    assert.match(m6, /\{fresh && q && l \? \(/);
    const m5 = strip(read(`${DIR}/modules/mod5Workflow.tsx`));
    assert.match(m5, /const fresh = pb\.status === 'ready';/);
    assert.match(m5, /unmatchedWarning\(current \? mix\?\.lufs : undefined, current \? eq\?\.lufs : undefined, 'WITH EQ', '2–3'\)/);
    assert.match(m5, /\{fresh && mix && eq \? \(/);
    // The hook: a variant change drops status to idle; only a finished render sets ready.
    const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
    assert.match(hook, /renderingSigRef\.current = null;\s*if \(!again\) return;/);
    assert.match(hook, /setStatus\('idle'\);\s*setActive\(null\);/);
    assert.match(hook, /setMeasured\(measuredNext\);\s*setStatus\('ready'\);/);
  });
});

describe('Module 3: build a monitoring path', () => {
  it('with all five slots filled, + CONNECT reads SLOTS FULL instead of a key that silently does nothing', () => {
    const s = strip(read(`${DIR}/modules/mod3Room.tsx`));
    assert.match(s, /const full = chain\.length >= 5;/);
    assert.match(s, /label: placed \? '✓ PLACED' : full \? 'SLOTS FULL' : '\+ CONNECT'/);
    assert.match(s, /tint: placed \|\| full \? colors\.textMuted : colors\.green/);
  });
});

describe('Module 8: the QC page says what credit still needs', () => {
  it('ticking every QC line does not claim the module is complete while track decisions are open', () => {
    const s = strip(read(`${DIR}/modules/mod8Project.tsx`));
    assert.doesNotMatch(s, /every line ticked completes the module\./);
    assert.match(s, /every line ticked, with the four track decisions on step 2 answered, completes the module/);
  });
});

describe('host: a module change never drops an answer given before the store read lands', () => {
  it('openModule clears the answers at once and MERGES the stored copy, instead of replacing what was answered meanwhile', () => {
    const host = strip(read(`${DIR}/MasteringLabScreen.tsx`));
    const open = host.slice(host.indexOf('const openModule = useCallback'), host.indexOf('const onAnswered = useCallback'));
    assert.match(open, /setStepRaw\(atStep\);\s*setAnswers\(\{\}\);\s*void updateMasteringProgress/);
    assert.match(open, /const stored = s\.modules\[id\]\?\.answers \?\? \{\};\s*setAnswers\(\(prev\) => \(\{ \.\.\.prev, \.\.\.stored \}\)\);/);
    assert.doesNotMatch(open, /setAnswers\(s\.modules\[id\]\?\.answers \?\? \{\}\)/);
  });
});

/* ── measured text: nothing runs off a drawing (the real font files) ─────── */

/** Advance widths straight from a TrueType file (cmap format 4 + hmtx). */
function fontWidth(path: string): (s: string, size: number) => number {
  const b = readFileSync(join(process.cwd(), path));
  const t: Record<string, number> = {};
  for (let i = 0; i < b.readUInt16BE(4); i++) {
    const o = 12 + i * 16;
    t[b.toString('latin1', o, o + 4)] = b.readUInt32BE(o + 8);
  }
  const upm = b.readUInt16BE(t.head + 18);
  const nh = b.readUInt16BE(t.hhea + 34);
  let sub = -1;
  for (let i = 0; i < b.readUInt16BE(t.cmap + 2); i++) {
    const off = b.readUInt32BE(t.cmap + 8 + i * 8);
    if (b.readUInt16BE(t.cmap + 4 + i * 8) === 3 && b.readUInt16BE(t.cmap + off) === 4) sub = t.cmap + off;
  }
  const segX2 = b.readUInt16BE(sub + 6);
  const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
  const gid = (c: number) => {
    for (let i = 0; i < segX2 / 2; i++) {
      if (c > b.readUInt16BE(ends + i * 2)) continue;
      const s0 = b.readUInt16BE(starts + i * 2);
      if (c < s0) return 0;
      const d = b.readInt16BE(deltas + i * 2);
      const r = b.readUInt16BE(ranges + i * 2);
      if (!r) return (c + d) & 0xffff;
      const g0 = b.readUInt16BE(ranges + i * 2 + r + (c - s0) * 2);
      return g0 ? (g0 + d) & 0xffff : 0;
    }
    return 0;
  };
  return (s, size) => [...s].reduce((a, ch) => a + b.readUInt16BE(t.hmtx + Math.min(gid(ch.codePointAt(0)!), nh - 1) * 4), 0) / upm * size;
}
const barlow = fontWidth('node_modules/@expo-google-fonts/barlow/400Regular/Barlow_400Regular.ttf');
const { drawnWidth, fitFontBoost, glassHeightFor } = await import('../src/screens/lab/mastering/masteringEngine.ts');
const { DESTINATIONS } = await import('../src/screens/lab/mastering/masteringContent.ts');
const boostAt = (aspect: number, size: 'S' | 'M' | 'L', winW: number, winH: number) => fitFontBoost(drawnWidth(aspect, winW, glassHeightFor(size, winH)), 360, 10.5);
const wrap = (text: string, maxChars: number) => {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
};
const PHONES = [[390, 844], [375, 812], [375, 667]] as const;

describe('measured: no drawing line runs past the 360-unit edge', () => {
  const st = read(`${DIR}/stages.tsx`).replace(/\r\n/g, '\n');
  const fnBody = (name: string) => st.slice(st.indexOf(`export function ${name}`), st.indexOf('\nexport', st.indexOf(`export function ${name}`) + 10));
  it('the tool shelf footers (x 34) fit at every phone, the short-phone boost included', () => {
    const fn = fnBody('ToolStage');
    const lines = [...fn.matchAll(/<SvgText x=\{x0\} y=\{H - (?:4|16)\} fontSize=\{fs\}[^>]*fontFamily=\{fonts\.barlowRegular\}>([^<{]+)<\/SvgText>/g)].map((m) => m[1]);
    assert.ok(lines.length >= 4, `found ${lines.length} literal footers`);
    for (const [w, h] of PHONES) {
      const bst = boostAt(360 / 180, 'M', w, h);
      for (const l of lines) assert.ok(34 + barlow(l, 11 * bst) <= 356, `${w}×${h}: "${l}" ends at ${(34 + barlow(l, 11 * bst)).toFixed(0)}`);
    }
  });
  it('the sequence legend (x 10) fits with the short-phone boost', () => {
    const m = fnBody('SequenceStage').match(/<SvgText x=\{x0\} y=\{H - 5\} fontSize=\{fs\}[^>]*>([^<{]+)<\/SvgText>/);
    assert.ok(m);
    const text = m[1].replace(/&gt;/g, '>');
    for (const [w, h] of PHONES) {
      const bst = boostAt(360 / 236, 'L', w, h);
      assert.ok(10 + barlow(text, 11 * bst) <= 358, `${w}×${h}: legend ends at ${(10 + barlow(text, 11 * bst)).toFixed(0)}`);
    }
  });
  it('every delivery-sheet line keeps to two lines (nothing dropped by the slice) and fits; a cut brief says so', () => {
    const fn = fnBody('DeliverySheetStage');
    assert.match(fn, /const itemChars = bst > 1 \? 58 : 56;/);
    assert.match(fn, /boosted && briefAll\.length > 1 \? \[`\$\{briefAll\[0\]\} …`\]/);
    for (const [w, h] of PHONES) {
      const bst = boostAt(360 / 250, 'L', w, h);
      const itemChars = bst > 1 ? 58 : 56;
      for (const d of DESTINATIONS) {
        for (const it of d.confirm) {
          const ls = wrap(it, Math.floor(itemChars / bst));
          assert.ok(ls.length <= 2, `${w}×${h} ${d.id}: "${it}" wraps to ${ls.length} lines; the third is never drawn`);
          for (const l of ls) assert.ok(33 + barlow(l, (ls.length > 1 ? 10.5 : 11) * bst) <= 352, `${w}×${h}: "${l}"`);
        }
      }
    }
  });
});

describe('Module 5 status line names its own versions', () => {
  it('stopped with MATCH off, the line names WITH EQ (there is no LOUDER on that page)', () => {
    const kit = strip(read(`${DIR}/kit.tsx`));
    assert.match(kit, /labels, loud = 'LOUDER' \}/);
    assert.match(kit, /MATCH is OFF: unmatched, \$\{loud\} plays at its full level/);
    assert.doesNotMatch(kit, /MATCH is OFF: unmatched, LOUDER plays/);
    assert.match(strip(read(`${DIR}/modules/mod5Workflow.tsx`)), /<PlaybackStatus [^\n]*labels="▶ BYPASS or ▶ WITH EQ" loud="WITH EQ" \/>/);
  });
});

describe('a cropped readout drops its label, never its value (Module 2 was missed by the standards pass)', () => {
  it('the REQUEST cell shows the short name: every value fits the cell at 375 wide', async () => {
    const s = strip(read(`${DIR}/modules/mod2Roles.tsx`));
    assert.match(s, /\{ k: 'REQUEST', v: item\.short, flex: 2\.2 \}/);
    const { CONTROL_ITEMS } = await import('../src/screens/lab/mastering/masteringContent.ts');
    // BezelReadouts: 13.5 pt mono at 0.6 em per character, 16 pt of padding;
    // the REQUEST cell is 2.2 of 3.8 flex across a ~353 pt bezel at 375 wide.
    const chars = Math.floor(((353 * 2.2) / 3.8 - 16) / (13.5 * 0.6));
    for (const c of CONTROL_ITEMS) assert.ok(c.short.length <= chars, `${c.short} (${c.short.length}) > ${chars}`);
    assert.ok(CONTROL_ITEMS.some((c) => c.label.length > chars), 'the full labels really would crop (the reason for the fix)');
  });
});
