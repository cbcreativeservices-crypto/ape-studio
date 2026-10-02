/**
 * PATTERN P13 / P21 / P24 — the navigation law (pattern hunt phase 2, wave 3,
 * 2026-10-02). Catalog: docs/bughunt/PATTERN_CATALOG_2026_10_02.md §P13, §P19/P24/P21.
 *
 * Ratchets (allowlists may only SHRINK):
 *  1. Android BACK is answered only by the FOCUSED screen. Every listener goes
 *     through src/lib/useBackWhileFocused.ts; a raw BackHandler.addEventListener
 *     is allowed only in the files below, each already focus-scoped by hand.
 *  2. Every native Modal answers Android BACK: an onRequestClose that does
 *     something.
 *  3. Every lab screen is classified: on the shared navigation (LabNavBar /
 *     PagedLab / SsPagedLab / LabEndScreen) or on the list below with why the
 *     strip does not apply. A NEW lab screen must pick one.
 *  4. No lab navigation control is gated on completion (NEXT/FINISH/CONTINUE
 *     never `disabled` by an answered/solved/complete flag).
 *  5. P24: every Haptics *Async / Speech.stop / Speech.*Async promise is caught.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { focusScopedBack } from '../src/lib/focusedBack.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const LAB = join(SRC, 'screens', 'lab');
const rel = (f: string) => relative(ROOT, f).split(sep).join('/');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}
/** Source with comments stripped and line endings normalised. */
const strip = (code: string) =>
  code
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const SRC_FILES = walk(SRC);

/* ───────────────────────── 1. focus-scoped BACK ───────────────────────── */

const HOOK = 'src/lib/useBackWhileFocused.ts';
/** Raw listeners not (yet) on the hook — each focus-scoped by hand. */
const RAW_BACK_ALLOWED: Record<string, string> = {
  'src/screens/dashboard/DashboardScreen.tsx': 'registered inside useFocusEffect (removed on blur)',
  'src/screens/glossary/GlossaryScreen.tsx': 'registered inside useFocusEffect (removed on blur)',
  'src/screens/study/FlashcardsScreen.tsx': 'registered inside useFocusEffect (removed on blur)',
  'src/screens/tools/FrequencyCounterScreen.tsx': 'effect gated on useIsFocused()',
  'src/screens/tools/SplMeterScreen.tsx': 'effect gated on useIsFocused()',
  'src/screens/lab/cymatics/GalleryScreen.tsx': 'handler checks navigation.isFocused() first',
  'src/screens/lab/kit/LabNavBar.tsx': 'handler checks navCtx.isFocused() first (pinned by labNavLaw.test.ts)',
  'src/screens/lab/rack/DockTray.tsx': 'handler checks navCtx.isFocused() first',
};
const FOCUS_IDIOM = /useFocusEffect|useIsFocused\(\)|\.isFocused\(\)/;

describe('P13/P21 — Android BACK belongs to the focused screen', () => {
  it('focusScopedBack: an unfocused screen lets BACK through without running its handler', () => {
    let ran = 0;
    const handler = () => {
      ran++;
      return true;
    };
    let focused = false;
    const listener = focusScopedBack({ isFocused: () => focused }, handler);
    assert.equal(listener(), false, 'covered screen must return false so the screen on top gets BACK');
    assert.equal(ran, 0, 'covered screen must not close its hidden tray');
    focused = true;
    assert.equal(listener(), true);
    assert.equal(ran, 1);
  });

  it('focusScopedBack: outside a navigator the handler always runs, and its false passes through', () => {
    assert.equal(focusScopedBack(null, () => true)(), true);
    assert.equal(focusScopedBack(undefined, () => false)(), false);
  });

  it('the hook registers through focusScopedBack, only while active', () => {
    const code = strip(readFileSync(join(ROOT, HOOK), 'utf8'));
    assert.match(code, /if \(!active\) return;/);
    assert.match(code, /BackHandler\.addEventListener\('hardwareBackPress', focusScopedBack\(navCtx, onBack\)\)/);
    assert.match(code, /useContext\(NavigationContext\)/);
  });

  it('no raw BackHandler.addEventListener outside the hook and the allowlist (ratchet)', () => {
    const offenders: string[] = [];
    const seen = new Set<string>();
    for (const f of SRC_FILES) {
      const r = rel(f);
      if (r === HOOK) continue;
      const code = strip(readFileSync(f, 'utf8'));
      if (!code.includes('BackHandler.addEventListener')) continue;
      seen.add(r);
      if (!(r in RAW_BACK_ALLOWED)) offenders.push(`${r}: use useBackWhileFocused (src/lib/useBackWhileFocused.ts)`);
      else if (!FOCUS_IDIOM.test(code)) offenders.push(`${r}: allowlisted but lost its focus check`);
    }
    for (const r of Object.keys(RAW_BACK_ALLOWED)) {
      if (!seen.has(r)) offenders.push(`${r}: no raw listener any more — remove it from RAW_BACK_ALLOWED (the list only shrinks)`);
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  it('the nine sites migrated on 2026-10-02 stay on the hook', () => {
    const migrated = [
      'src/screens/auth/AuthScreen.tsx',
      'src/screens/exam/FinalExamScreen.tsx',
      'src/screens/quiz/QuizScreen.tsx',
      'src/screens/lab/cableinstall/bits.tsx',
      'src/screens/lab/calc/CalcLabScreen.tsx',
      'src/screens/lab/HarmonographViewer.tsx',
      'src/screens/tools/ToolFullScreen.tsx',
      'src/screens/tools/WaveformScreen.tsx',
      'src/screens/tools/MultiMeterScreen.tsx',
    ];
    for (const r of migrated) {
      const code = strip(readFileSync(join(ROOT, r), 'utf8'));
      assert.match(code, /useBackWhileFocused\(/, `${r} must answer BACK through useBackWhileFocused`);
    }
  });
});

/* ───────────────────────── 2. every Modal answers BACK ───────────────────────── */

/** The full opening tag of each `<Modal` / `<RNModal`, braces balanced. */
function modalTags(code: string): { line: number; tag: string }[] {
  const out: { line: number; tag: string }[] = [];
  const re = /<(?:RN)?Modal\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 0;
    let i = m.index + 1;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0 && code[i - 1] !== '=') break;
    }
    out.push({ line: code.slice(0, m.index).split('\n').length, tag: code.slice(m.index, i + 1) });
  }
  return out;
}

describe('P21 — every native Modal can be closed by Android BACK', () => {
  it('modalTags reads a multi-line tag with arrow functions inside', () => {
    const tags = modalTags('<Modal\n  visible\n  onRequestClose={() => { if (a > b) x(); }}\n>\n<Modal visible>');
    assert.equal(tags.length, 2);
    assert.match(tags[0].tag, /onRequestClose/);
    assert.doesNotMatch(tags[1].tag, /onRequestClose/);
  });

  it('every <Modal> in src/ carries a working onRequestClose (ratchet, no exceptions today)', () => {
    const offenders: string[] = [];
    let count = 0;
    for (const f of SRC_FILES) {
      if (!f.endsWith('.tsx')) continue;
      const code = strip(readFileSync(f, 'utf8'));
      for (const { line, tag } of modalTags(code)) {
        count++;
        if (!/\bonRequestClose=\{/.test(tag)) offenders.push(`${rel(f)}:${line} has no onRequestClose`);
        else if (/onRequestClose=\{\s*\(\)\s*=>\s*(\{\s*\}|undefined|null)\s*\}/.test(tag))
          offenders.push(`${rel(f)}:${line} onRequestClose does nothing — BACK cannot close it`);
      }
    }
    assert.ok(count > 40, `expected the app's Modals to be found (found ${count})`);
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });
});

/* ───────────────────────── 3. every lab screen is classified ───────────────────────── */

/** On the shared navigation: the strip, the paged-lab kit, the end screen, or a
 *  module-lab HUB drawn with the shared LabHeader (‹ = leave the lab; its
 *  modules carry the strip and FINISH opens LabEndScreen). */
const SHARED_NAV = /useLabNav|<LabNavBar\b|<PagedLab\b|<SsPagedLab\b|kit\/LabEndScreen|<LabHeader\b/;
/**
 * Lab screens NOT on the shared strip, and why it does not apply. These are not
 * multi-module lessons: single-page instruments (credit, where any, is LabShell's
 * understanding check), hubs/menus, the calculator lab (a tool), references,
 * and components. Owner rule: the strip is for multi-module labs.
 */
const NOT_A_MODULE_LAB: Record<string, string> = {
  'AudioLearningScreen.tsx': 'hub — the Fundamentals / Training fork',
  'EarLabScreen.tsx': 'hub — the data-driven lab list',
  'LabCategoryScreen.tsx': 'hub — a category list',
  'AutotuneLabScreen.tsx': 'single-page instrument on LabShell',
  'BassLabScreen.tsx': 'single-page instrument on LabShell',
  'BinauralLabScreen.tsx': 'single-page instrument on LabShell',
  'FmLabScreen.tsx': 'single-page instrument on LabShell',
  'FxLabScreen.tsx': 'single-page instrument on LabShell',
  'HarmonicLabScreen.tsx': 'single-page instrument on LabShell',
  'HarmonographLabScreen.tsx': 'single-page instrument on LabShell',
  'ModularLabScreen.tsx': 'single-page instrument on LabShell',
  'NoiseLabScreen.tsx': 'single-page instrument on LabShell',
  'OscillatorLabScreen.tsx': 'single-page instrument on LabShell',
  'SignalChainLabScreen.tsx': 'single-page instrument on LabShell ("MODULES" are the chain processors)',
  'cymatics/LiquidStudioScreen.tsx': 'single-page studio on LabShell (the guided course is CymaticsModuleScreen)',
  'cymatics/MembraneStudioScreen.tsx': 'single-page studio on LabShell',
  'cymatics/PlateStudioScreen.tsx': 'single-page studio on LabShell',
  'cymatics/GalleryScreen.tsx': 'saved-pattern gallery, not a lesson',
  'foundations/FoundationsPlaygroundScreen.tsx': 'sandbox beside the Foundations course (the course is on the strip)',
  'deesser/SmartProcessorsLabScreen.tsx': 'hub — the Smart Processors family list',
  'calc/CalcLabScreen.tsx': 'calculator lab home — a tool, not a lesson',
  'calc/CalcProjectsScreen.tsx': 'calculator lab — saved projects',
  'calc/CalcResultsScreen.tsx': 'calculator lab — saved results',
  'calc/CalcSymbolsKeyScreen.tsx': 'calculator lab — symbols key',
  'calc/CalcWorkflowEditScreen.tsx': 'calculator lab — workflow editor',
  'calc/CalcWorkflowRunScreen.tsx': 'calculator lab — workflow runner (its own step bar, ungated)',
  'calc/CalcWorkflowsScreen.tsx': 'calculator lab — workflow list',
  'calc/CalcWorkspaceScreen.tsx': 'calculator lab — one calculator',
  'production/ProductionLabScreen.tsx': 'production lab home — project/stage list, any order',
  'production/ProductionStageScreen.tsx': 'production lab — one stage form',
  'production/ProductionActivityScreen.tsx': 'production lab — one exercise brief/debrief',
  'tube/TubeCardScreen.tsx': 'reference card viewer',
  'tube/TubeReferenceScreen.tsx': 'reference list',
  'rack/StageFullScreen.tsx': 'component (the rack full screen), not a route',
};

/** Lines where a NEXT/FINISH/CONTINUE/DONE control is `disabled` by a completion flag. */
function gatedNavLines(code: string): number[] {
  const NAV_WORD = /['">`](?:NEXT|FINISH|CONTINUE|DONE)\b[^a-z]/g;
  const GATE = /disabled=\{[^}]*\b(answered|solved\w*|complete\w*|passed|cleared|allDone|checked|canAdvance|canContinue|canNext)\b/;
  /** Start of the nearest JSX element opening before `at` (`<Upper…`). */
  const openBefore = (at: number) => {
    for (let i = at; i >= 0; i--) if (code[i] === '<' && /[A-Z]/.test(code[i + 1] ?? '')) return i;
    return -1;
  };
  /** The element's opening tag, braces balanced. */
  const tagAt = (open: number) => {
    let depth = 0;
    for (let i = open + 1; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0 && code[i - 1] !== '=') return code.slice(open, i + 1);
    }
    return code.slice(open);
  };
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = NAV_WORD.exec(code))) {
    // The element carrying the word — or, for <Text>NEXT</Text>, its parent control.
    let open = openBefore(m.index);
    if (open < 0) continue;
    let tag = tagAt(open);
    if (/^<Text\b/.test(tag) && open > 0) {
      open = openBefore(open - 1);
      if (open < 0) continue;
      tag = tagAt(open);
    }
    if (GATE.test(tag)) out.push(code.slice(0, m.index).split('\n').length);
  }
  return out;
}

describe('P13 — every lab screen is on the shared navigation or classified', () => {
  it('no unclassified lab screen (ratchet)', () => {
    const offenders: string[] = [];
    const seen = new Set<string>();
    for (const f of walk(LAB)) {
      if (!f.endsWith('Screen.tsx')) continue;
      const r = relative(LAB, f).split(sep).join('/');
      if (r.startsWith('kit/')) continue;
      const code = strip(readFileSync(f, 'utf8'));
      if (SHARED_NAV.test(code)) {
        if (r in NOT_A_MODULE_LAB) offenders.push(`${r}: now on the shared navigation — remove it from NOT_A_MODULE_LAB`);
        continue;
      }
      seen.add(r);
      if (!(r in NOT_A_MODULE_LAB))
        offenders.push(`${r}: a lab screen with no LabNavBar/PagedLab/LabEndScreen — put it on the shared strip, or classify it here with the reason`);
    }
    for (const r of Object.keys(NOT_A_MODULE_LAB)) if (!seen.has(r) && !offenders.some((o) => o.startsWith(r))) offenders.push(`${r}: file gone — remove it from NOT_A_MODULE_LAB`);
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  it('the gate detector sees a gated NEXT (self-test on a fixture)', () => {
    const bad = '<Pressable onPress={next} disabled={!answered}>\n  <Text style={s.t}>NEXT ›</Text>\n</Pressable>';
    const bad2 = "<KeyButton label='FINISH ›' disabled={!allDone} onPress={go} />";
    const ok = "<Chip disabled={solved && picked !== o} label={o} />\n<Chip label='NEXT PAIR ›' onPress={next} />";
    assert.deepEqual(gatedNavLines(bad), [2]);
    assert.deepEqual(gatedNavLines(bad2), [1]);
    assert.deepEqual(gatedNavLines(ok), []);
  });

  it('no lab NEXT / FINISH / CONTINUE / DONE is disabled by a completion flag', () => {
    const offenders: string[] = [];
    for (const f of walk(LAB)) {
      if (!f.endsWith('.tsx')) continue;
      for (const line of gatedNavLines(strip(readFileSync(f, 'utf8')))) offenders.push(`${rel(f)}:${line}`);
    }
    assert.deepEqual(offenders, [], `navigation gated on completion (owner law: labs never block):\n${offenders.join('\n')}`);
  });
});

/* ───────────────────────── 5. P24 — native promises are caught ───────────────────────── */

describe('P24 — Haptics / Speech promises never go unhandled', () => {
  it('every Haptics.*Async, Speech.stop and Speech.*Async call has a .catch within its statement', () => {
    const offenders: string[] = [];
    for (const f of SRC_FILES) {
      const code = strip(readFileSync(f, 'utf8'));
      const re = /\b(Haptics\.\w+Async|Speech\.stop|Speech\.\w+Async)\(/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(code))) {
        // The statement (to the first `;` outside brackets), plus the next line
        // (a `p.catch(...)` on the following line counts).
        let depth = 0;
        let i = m.index;
        for (; i < code.length; i++) {
          const ch = code[i];
          if (ch === '(' || ch === '{' || ch === '[') depth++;
          else if (ch === ')' || ch === '}' || ch === ']') {
            if (--depth < 0) break;
          } else if (ch === ';' && depth === 0) break;
        }
        const end = code.indexOf('\n', i + 1);
        const stmt = code.slice(m.index, end === -1 ? undefined : code.indexOf('\n', end + 1));
        if (!stmt.includes('.catch(')) offenders.push(`${rel(f)}:${code.slice(0, m.index).split('\n').length} ${m[1]}(`);
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });
});
