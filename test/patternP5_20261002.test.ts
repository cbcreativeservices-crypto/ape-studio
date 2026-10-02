/**
 * Pattern P5 — iOS Modal-over-Modal and the 450 ms dialog fade (closer A3,
 * guard G5), 2026-10-02.
 *
 * UIKit presents one modal at a time. Opening a `presentation: 'modal'` screen
 * (Paywall, Settings, Help…) in the same tap that closes a popup — every popup
 * is a DimModal — is refused while the popup fades (HOST_DISMISS_MS): a dead
 * EXPLORE MEMBERSHIP / RENEW / UNLOCK on iPhone, a Paywall drawn BEHIND the
 * card on Android.
 *
 * 1. Behaviour of the shared hand-off core (src/lib/modalHandoff.ts) that
 *    `useModalHandoff` (lib/confirm.ts) wraps: it waits, holds the dialog
 *    queue for twice the wait, runs one hand-off at a time and drops a pending
 *    one on cancel (unmount). R2: with a hand-off that runs at once, or that
 *    does not latch, these fail.
 * 2. The opt-in dialog form: confirmDialog / notify `{ opensModalScreen }`.
 * 3. G5 RATCHET over src/: every navigate to a `presentation: 'modal'` route
 *    (read from RootNavigator, so a new modal screen is covered the day it is
 *    added) that runs from a dialog button, from inside a popup component's
 *    props or children, or from a handler handed to one, goes through
 *    afterDialogCloses / opensModalScreen / useModalHandoff. Every other
 *    (plain-screen) site is counted per file with a reason; the counts are
 *    exact, so a new site has to be looked at and written down.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { createModalHandoff } = await import('../src/lib/modalHandoff.ts');

/** A hand-run clock: timers fire only when the test advances it. */
function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    setTimer: (fn: () => void, ms: number) => {
      const id = ++seq;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimer: (id: unknown) => {
      timers.delete(id as number);
    },
    advance(ms: number) {
      now += ms;
      for (const [id, t] of [...timers]) {
        if (t.at <= now) {
          timers.delete(id);
          t.fn();
        }
      }
    },
    pending: () => timers.size,
  };
}

// ── 1. behaviour ─────────────────────────────────────────────────────────────

describe('createModalHandoff (the core of useModalHandoff)', () => {
  it('runs the next step only after the popup has faded, holding the dialog queue for twice the wait', () => {
    const clock = fakeClock();
    const holds: number[] = [];
    const h = createModalHandoff({ waitMs: 450, hold: (ms) => holds.push(ms), ...clock });
    const ran: string[] = [];
    h.run(() => ran.push('paywall'));
    assert.deepEqual(holds, [900], 'a queued dialog must wait out the dismissal AND the presentation');
    clock.advance(449);
    assert.deepEqual(ran, [], 'presented while the popup was still fading — the iOS refusal');
    clock.advance(1);
    assert.deepEqual(ran, ['paywall']);
  });

  it('a double tap is ONE hand-off (one Paywall), and a later tap after it landed is honoured', () => {
    const clock = fakeClock();
    const h = createModalHandoff({ waitMs: 450, hold: () => {}, ...clock });
    const ran: string[] = [];
    h.run(() => ran.push('first'));
    h.run(() => ran.push('second'));
    assert.equal(h.pending(), true);
    clock.advance(450);
    assert.deepEqual(ran, ['first']);
    assert.equal(h.pending(), false);
    h.run(() => ran.push('third'));
    clock.advance(450);
    assert.deepEqual(ran, ['first', 'third']);
  });

  it('cancel (the screen unmounted) drops the pending step — never a Paywall over a screen the learner left', () => {
    const clock = fakeClock();
    const h = createModalHandoff({ waitMs: 450, hold: () => {}, ...clock });
    const ran: string[] = [];
    h.run(() => ran.push('paywall'));
    h.cancel();
    clock.advance(1000);
    assert.deepEqual(ran, []);
    assert.equal(clock.pending(), 0);
  });
});

// ── 2. the hook and the opt-in dialog form ───────────────────────────────────

const confirmSrc = readFileSync('src/lib/confirm.ts', 'utf8');

describe('lib/confirm.ts', () => {
  it('useModalHandoff wraps the core with HOST_DISMISS_MS + holdAppDialogQueue and cancels on unmount', () => {
    const hook = confirmSrc.slice(confirmSrc.indexOf('export function useModalHandoff'));
    assert.match(hook, /createModalHandoff\(\{ waitMs: HOST_DISMISS_MS, hold: holdAppDialogQueue \}\)/);
    assert.match(hook, /return \(\) => h\?\.cancel\(\);/);
  });

  it('confirmDialog / notify take an opt-in opensModalScreen that runs the handler after the fade', () => {
    assert.match(confirmSrc, /const onYes = opts\?\.opensModalScreen \? afterDialogCloses\(yes\) : yes;/);
    assert.match(confirmSrc, /const onDone = done && opts\?\.opensModalScreen \? afterDialogCloses\(done\) : done;/);
    // Opt-in, never the default: ~155 dialog buttons would change timing.
    assert.doesNotMatch(confirmSrc, /opensModalScreen \?\? true/);
  });
});

// ── 3. G5 ratchet ────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
};
const rel = (p: string) => relative(ROOT, p).split(sep).join('/');
/** Comments blanked (same length, so offsets and line numbers hold): a
 *  `<Modal>` named in a comment is not an element. */
const stripComments = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/gm, (c, pre: string) => pre + ' '.repeat(c.length - pre.length));
const FILES = walk(join(ROOT, 'src')).map((p) => ({ path: rel(p), src: stripComments(readFileSync(p, 'utf8')) }));

/** The `presentation: 'modal'` routes, read from the navigator itself. */
const nav = readFileSync('src/navigation/RootNavigator.tsx', 'utf8');
const MODAL_ROUTES = [...nav.matchAll(/<Stack\.Screen name="(\w+)"[^>]*presentation: 'modal'/g)].map((m) => m[1]);

/** Components that render a DimModal — a navigate from their props is a hand-off. */
const POPUPS = new Set<string>();
for (const f of FILES) {
  if (!/import \{[^}]*\bModal\b[^}]*\} from '[./]*(?:components\/)?DimModal'/.test(f.src)) continue;
  // Only the exported components whose OWN body draws the Modal.
  const exportsAt = [...f.src.matchAll(/^(?:export )?function ([A-Z]\w*)/gm)];
  exportsAt.forEach((m, k) => {
    if (!/^export /.test(m[0]) || /Screen$/.test(m[1])) return;
    const body = f.src.slice(m.index!, k + 1 < exportsAt.length ? exportsAt[k + 1].index! : f.src.length);
    if (/<Modal\b/.test(body)) POPUPS.add(m[1]);
  });
}
POPUPS.add('Modal');

type Span = [number, number];
/** The balanced `( … )` that starts at `open`. */
function parenSpan(s: string, open: number): Span {
  let d = 0;
  for (let j = open; j < s.length; j++) {
    if (s[j] === '(') d++;
    else if (s[j] === ')' && --d === 0) return [open, j];
  }
  return [open, s.length];
}
/** End of the opening tag that starts at `at` (skipping `{…}` props). */
function tagEnd(s: string, at: number): { end: number; selfClosing: boolean } {
  let d = 0;
  for (let j = at + 1; j < s.length; j++) {
    const c = s[j];
    if (c === '{') d++;
    else if (c === '}') d--;
    else if (d === 0 && c === '/' && s[j + 1] === '>') return { end: j + 1, selfClosing: true };
    else if (d === 0 && c === '>') return { end: j, selfClosing: false };
  }
  return { end: s.length, selfClosing: true };
}
/** A JSX element from `<Tag` to its `/>` or its matching `</Tag>`. */
function jsxSpan(s: string, at: number, tag: string): Span {
  const open = tagEnd(s, at);
  if (open.selfClosing) return [at, open.end];
  let depth = 1;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = open.end;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[0].startsWith('</')) {
      if (--depth === 0) return [at, m.index + m[0].length];
    } else {
      const inner = tagEnd(s, m.index);
      if (!inner.selfClosing) depth++;
      re.lastIndex = inner.end;
    }
  }
  return [at, s.length];
}
const inside = (i: number, spans: Span[]) => spans.some(([a, b]) => i > a && i < b);

type Site = { file: string; line: number; route: string; wrapped: boolean; hard: string | null };

function sitesOf(file: string, s: string): Site[] {
  const routeRe = new RegExp(`\\.(?:navigate|push|replace)\\(\\s*['"](${MODAL_ROUTES.join('|')})['"]`, 'g');
  const found = [...s.matchAll(routeRe)];
  if (!found.length) return [];

  // Hand-off wrappers.
  const wrap: Span[] = [];
  for (const m of s.matchAll(/\bafterDialogCloses\(/g)) wrap.push(parenSpan(s, m.index! + m[0].length - 1));
  for (const m of s.matchAll(/const (\w+) = useModalHandoff\(\);/g)) {
    for (const c of s.matchAll(new RegExp(`\\b${m[1]}\\(`, 'g'))) wrap.push(parenSpan(s, c.index! + c[0].length - 1));
  }
  // Dialog calls; an opensModalScreen one wraps its handlers.
  const dialogs: Span[] = [];
  for (const m of s.matchAll(/\b(?:confirmDialog|notify)\(/g)) {
    const sp = parenSpan(s, m.index! + m[0].length - 1);
    if (/opensModalScreen:\s*true/.test(s.slice(sp[0], sp[1]))) wrap.push(sp);
    else dialogs.push(sp);
  }
  // Popup elements (props and children).
  const popups: Span[] = [];
  const popupTag: string[] = [];
  for (const m of s.matchAll(/<([A-Z]\w*)\b/g)) {
    if (!POPUPS.has(m[1])) continue;
    popups.push(jsxSpan(s, m.index!, m[1]));
    popupTag.push(`<${m[1]}> at line ${s.slice(0, m.index!).split('\n').length}`);
  }
  const popupAt = (i: number) => popupTag[popups.findIndex(([a, b]) => i > a && i < b)];

  /** The named handler (`const go = () => …`) a site sits in, if any. */
  const handlerName = (i: number): string | null => {
    const head = s.slice(0, i);
    const re = /const (\w+) = (?:useCallback\()?\s*(?:async\s*)?\([^)]*\)[^=]*=>/g;
    let best: string | null = null;
    for (const m of head.matchAll(re)) {
      const after = m.index! + m[0].length;
      const rest = s.slice(after).trimStart();
      const start = s.indexOf(rest[0], after);
      let end: number;
      if (rest[0] === '{') {
        let d = 0;
        end = s.length;
        for (let j = start; j < s.length; j++) {
          if (s[j] === '{') d++;
          else if (s[j] === '}' && --d === 0) {
            end = j;
            break;
          }
        }
      } else end = s.indexOf('\n', i) + 1;
      if (i > start && i <= end) best = m[1];
    }
    return best;
  };

  return found.map((m) => {
    const i = m.index!;
    const line = s.slice(0, i).split('\n').length;
    const wrapped = inside(i, wrap);
    let hard: string | null = null;
    if (!wrapped) {
      if (inside(i, dialogs)) hard = 'inside a confirmDialog/notify handler';
      else if (inside(i, popups)) hard = `inside a popup (DimModal) element ${popupAt(i)}`;
      else {
        const name = handlerName(i);
        if (name) {
          const uses = [...s.matchAll(new RegExp(`\\b${name}\\b`, 'g'))].map((u) => u.index!);
          if (uses.some((u) => inside(u, dialogs))) hard = `handler ${name} is handed to a dialog`;
          else if (uses.some((u) => inside(u, popups))) hard = `handler ${name} is handed to a popup`;
        }
      }
    }
    return { file, line, route: m[1], wrapped, hard };
  });
}

/**
 * Plain-screen sites, reviewed 2026-10-02: a button on the screen itself, with
 * no popup open over it, so there is nothing to wait out. Counts are EXACT —
 * a new site in one of these files, or a new file, must be looked at.
 */
const REVIEWED_PLAIN: Record<string, { count: number; why: string }> = {
  'src/components/HelpKey.tsx': { count: 1, why: 'header "?" key on the screen itself' },
  'src/features/audio/ExposureCheckin.tsx': {
    count: 1,
    why: 'root-level slide-down panel (an Animated.View, not a Modal); when it is hosted inside a Modal it only dismisses',
  },
  'src/features/commercial/MembershipGate.tsx': {
    count: 1,
    why: 'deliberate: the gate\'s own paywallPending request waits rootModalHoldMs() for every Modal (its own included) to go',
  },
  'src/features/dev/DevVisualIndex.tsx': { count: 4, why: 'dev-only visual index rows (__DEV__ harness)' },
  'src/features/lab/LabPreviewOverlay.tsx': {
    count: 1,
    why: 'UpgradeSheet is an in-tree View over the navigator, not a Modal — nothing to fade',
  },
  'src/screens/courses/CourseSelectionScreen.tsx': {
    count: 2,
    why: 'Membership corner button; UpgradeSheet "See plans" (UpgradeSheet is a View, not a Modal)',
  },
  'src/screens/curriculum/CurriculumScreen.tsx': { count: 1, why: 'Membership button in the screen\'s about row' },
  'src/screens/exam/FinalExamScreen.tsx': { count: 1, why: '"See membership plans" on the exam\'s refusal card (in-screen)' },
  'src/screens/glossary/GlossaryScreen.tsx': { count: 1, why: 'offline-save panel button, in the screen body' },
  'src/screens/lab/cableinstall/CableInstallLabScreen.tsx': { count: 1, why: 'in-flow end-screen JOIN button, not a popup' },
  'src/screens/lab/tube/TubeCardScreen.tsx': { count: 1, why: 'UPGRADE button on the screen body' },
  'src/screens/lab/tube/TubeReferenceScreen.tsx': { count: 1, why: 'UPGRADE button on the locked screen body' },
  'src/screens/profile/ProfileScreen.tsx': { count: 3, why: 'gear (×2 layouts) and UPGRADE button on the screen body' },
  'src/screens/settings/SettingsScreen.tsx': {
    count: 4,
    why: 'MEMBERSHIP / Help / About rows on Settings itself (a stacked modal screen, not a DimModal)',
  },
  'src/screens/tools/ConceptModuleScreen.tsx': { count: 1, why: 'ToolAcademyLock is an in-screen panel' },
  'src/screens/tools/FrequencyCounterScreen.tsx': { count: 2, why: 'Saved-Measurements door and ToolAcademyLock, in-screen' },
  'src/screens/tools/MeasurementLibraryScreen.tsx': { count: 1, why: 'SEE MEMBERSHIP on the locked screen body' },
  'src/screens/tools/ToolDemoScreen.tsx': { count: 1, why: 'ToolAcademyLock, in-screen' },
  'src/screens/tools/ToolInfoScreen.tsx': { count: 2, why: 'LEARN / DEMO locked buttons, in-screen' },
  'src/screens/tools/ToolLearnScreen.tsx': { count: 1, why: 'ToolAcademyLock, in-screen' },
  'src/screens/tools/ToolsHubScreen.tsx': { count: 3, why: 'hub doors behind openOnce (dosimeter chip, library, locked tile)' },
};

const ALL = FILES.flatMap((f) => sitesOf(f.path, f.src));

describe('G5 — modal-screen navigates wait out the popup (ratchet)', () => {
  it('reads the modal routes from RootNavigator', () => {
    assert.ok(MODAL_ROUTES.includes('Paywall') && MODAL_ROUTES.includes('Settings') && MODAL_ROUTES.includes('Help'));
    assert.ok(POPUPS.has('PrePaywallPrompt') && POPUPS.has('StudyAccessSheet') && POPUPS.has('GlossaryLockView'));
    assert.ok(!POPUPS.has('UpgradeSheet'), 'UpgradeSheet is a View; if it becomes a DimModal its sites must hand off');
  });

  it('the hand-off sites are recognised (so the ratchet is not passing on an empty scan)', () => {
    const wrapped = ALL.filter((x) => x.wrapped).map((x) => x.file);
    for (const f of [
      'src/screens/courses/CourseSelectionScreen.tsx',
      'src/screens/dashboard/DashboardScreen.tsx',
      'src/screens/enrollment/EnrollmentScreen.tsx',
      'src/screens/glossary/GlossaryScreen.tsx',
      'src/screens/lab/calc/CalcLabScreen.tsx',
      'src/screens/lab/tube/TubeReferenceScreen.tsx',
    ]) {
      assert.ok(wrapped.includes(f), `${f}: its hand-off is not recognised`);
    }
  });

  it('no modal-screen navigate from a dialog button, a popup, or a handler handed to one', () => {
    const bad = ALL.filter((x) => x.hard).map((x) => `${x.file}:${x.line} → ${x.route} (${x.hard})`);
    assert.deepEqual(
      bad,
      [],
      'Wrap it: confirmDialog(…, { opensModalScreen: true }), afterDialogCloses(fn), or useModalHandoff() for a screen popup.',
    );
  });

  it('every other site is a reviewed plain-screen button (exact counts per file)', () => {
    const plain = new Map<string, number>();
    for (const x of ALL) if (!x.wrapped && !x.hard) plain.set(x.file, (plain.get(x.file) ?? 0) + 1);
    const unexpected: string[] = [];
    for (const [file, n] of plain) {
      const r = REVIEWED_PLAIN[file];
      if (!r) unexpected.push(`${file}: ${n} new site(s) — review, then wrap or add with a reason`);
      else if (r.count !== n) unexpected.push(`${file}: ${n} site(s), reviewed ${r.count} — update after review`);
    }
    for (const file of Object.keys(REVIEWED_PLAIN)) {
      if (!plain.has(file)) unexpected.push(`${file}: listed but has no plain site any more — remove it`);
    }
    assert.deepEqual(unexpected, []);
  });
});
