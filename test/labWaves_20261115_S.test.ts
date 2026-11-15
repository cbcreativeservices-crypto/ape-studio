/**
 * Beginner waves 1-3 (2026-11-15), group S (shared frame).
 *
 * Owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan).
 * Items: docs/labs/beginner_waves_2026_11_15/S_ITEMS.md
 * Report: docs/labs/beginner_waves_2026_11_15/S_REPORT.md
 *
 * SH-75: every check says that nothing is lost and there is no score, on the
 * shared check card (src/components/LabUnderstandingCheck.tsx), in the wording
 * the lab screen guides already use, as one plain sentence; and the card does
 * not grow (a line in, a line out): the lead around it is shorter than before.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const CARD = 'src/components/LabUnderstandingCheck.tsx';
/** The no-score sentence, word for word as 15 lab screen guides said it on
 *  2026-11-15 (lab groups may now drop it from their guides, since the card
 *  says it on every check, so this test does not read the guides). */
const NO_SCORE = 'Nothing is lost and there is no score.';
/** The lead before SH-75 (owner wording of 2026-11-09), for the length check. */
const OLD_LEAD = 'Answer all ${questions.length} correctly to pass the check. Get one wrong and you can try it again straight away; nothing is lost and there is no score.';

/** The not-yet-passed lead, as written in the card's template literal. */
function lead(): string {
  const c = code(CARD);
  const m = c.match(/<Text style=\{s\.lead\}>\s*\{done\s*\?\s*'[^']*'\s*:\s*`([^`]*)`\}\s*<\/Text>/);
  assert.ok(m, 'the lead is still one Text with the done / not-done branches');
  return m[1];
}

describe('SH-75: the shared check card says nothing is lost and there is no score', () => {
  it('the lead ends on the guides\' own sentence, as a plain sentence of its own', () => {
    const l = lead();
    assert.ok(l.endsWith(` ${NO_SCORE}`), l);
  });

  it('a line in, a line out: the lead is shorter than before and the card has no new element', () => {
    const l = lead();
    assert.ok(l.length < OLD_LEAD.length - 20, `lead ${l.length} chars vs ${OLD_LEAD.length} before`);
    assert.doesNotMatch(l, /try it again straight away/);
    assert.match(l, /Get one wrong\? Try again\./);
    const c = code(CARD);
    // Same Text elements as before SH-75: eyebrow, title, lead, remaining,
    // prompt, option, CORRECT head, line, THE EXPLANATION, explanation body,
    // Check passed, and the pending card's head + body (13), plus qNum (14).
    assert.equal((c.match(/<Text\b/g) ?? []).length, 14);
  });

  it('the words other tests and guides read from the card are kept', () => {
    const c = code(CARD);
    for (const w of ['CHECK YOUR UNDERSTANDING', 'no score', 'the check is passed', 'still to get right', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Check passed']) {
      assert.ok(c.includes(w), w);
    }
  });
});

// ─────────────────────────────────────────────── SN-1 (F8b TU-04 / SH-64)
// A locked rack key can read "not yet" words instead of LOCKED. The dock
// renderer is cut from RackUnit.tsx and run against a stub createElement, the
// same harness as test/batch4_G5-rack-locked-toggle_20261105.test.ts.
import ts from 'typescript';

const blob: any = new Proxy(function () {}, {
  get: (_t, k) => (typeof k === 'symbol' ? undefined : blob),
  apply: () => blob,
});
type El = { type: unknown; props: any };
const React = {
  createElement: (type: unknown, props: any, ...children: unknown[]): El => ({ type, props: { ...props, children } }),
  Fragment: 'Fragment',
};
function walk(n: any, out: El[] = []): El[] {
  if (Array.isArray(n)) n.forEach((c) => walk(c, out));
  else if (n && typeof n === 'object' && 'props' in n) {
    out.push(n);
    walk(n.type === 'DockStrip' ? n.props.children[0](() => undefined) : n.props.children, out);
  }
  return out;
}
const words = (n: any): string =>
  Array.isArray(n) ? n.map(words).join('') : n && typeof n === 'object' ? words(n.props?.children) : n == null || n === false ? '' : String(n);
function run(js: string, own: Record<string, unknown>, result: string) {
  const scope = new Proxy(own, {
    has: () => true,
    get: (t, k) => (typeof k === 'symbol' ? undefined : k in t ? t[k as string] : k in globalThis ? (globalThis as any)[k] : blob),
  });
  return new Function('scope', `with (scope) { ${js}; return ${result}; }`)(scope);
}
const compile = (src: string) =>
  ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
const rackSrc = read('src/screens/lab/rack/RackUnit.tsx');
const dockJs = compile(rackSrc.slice(rackSrc.indexOf('const shownIn = (inFull: boolean) =>'), rackSrc.indexOf('\n  const closeTray')));

function dock(params: any[]) {
  let note: string | null = null;
  const render = () =>
    run(dockJs, {
      React, DockButton: 'DockButton', DockStrip: 'DockStrip', isLabelOnly: () => false, params, lockedNoteId: note, bound: null, trayParam: null, openTrayId: null, effBoundId: '', styles: blob,
      setLockedNoteId: (v: any) => { note = typeof v === 'function' ? v(note) : v; },
      setOpenTrayId: () => {},
    }, 'dockFor')(false);
  return {
    key: (id: string) => walk(render()).find((e) => e.type === 'DockButton' && e.props.key === id)!,
    note: () => {
      const hit = walk(render()).find((e) => e.props.accessibilityLiveRegion && /(locked|not yet):/.test(words(e.props.children)));
      return hit ? words(hit.props.children) : null;
    },
  };
}
const KINDS = {
  fader: (extra: object) => ({ kind: 'fader', id: 'k', label: 'PLAY', value: 0, onChange() {}, format: () => '', locked: 'reveal a second note first.', ...extra }),
  options: (extra: object) => ({ kind: 'options', id: 'k', label: 'PLAY', valueLabel: 'x', options: [], selectedId: 'x', onSelect() {}, locked: 'reveal a second note first.', ...extra }),
  toggle: (extra: object) => ({ kind: 'toggle', id: 'k', label: 'PLAY', value: false, onToggle() {}, locked: 'reveal a second note first.', ...extra }),
} as const;

describe('SN-1: a locked key may say "not yet" (lockedValue)', () => {
  for (const [kind, make] of Object.entries(KINDS)) {
    it(`${kind}: without lockedValue it is exactly as before: LOCKED, "locked —", "locked:"`, () => {
      const d = dock([make({})]);
      assert.equal(d.key('k').props.value, 'LOCKED');
      assert.equal(d.key('k').props.dim, true);
      assert.equal(d.key('k').props.a11y, 'PLAY: locked — reveal a second note first.');
      d.key('k').props.onPress();
      assert.equal(d.note(), 'PLAY — locked: reveal a second note first.');
    });
    it(`${kind}: with lockedValue the key reads it, and the spoken label and the reason say "not yet"`, () => {
      const d = dock([make({ lockedValue: 'after 2 notes' })]);
      assert.equal(d.key('k').props.value, 'after 2 notes');
      assert.equal(d.key('k').props.dim, true, 'still dimmed: it still does nothing yet');
      assert.equal(d.key('k').props.a11y, 'PLAY: not yet — reveal a second note first.');
      assert.doesNotMatch(d.key('k').props.a11y, /locked/);
      d.key('k').props.onPress();
      assert.equal(d.note(), 'PLAY — not yet: reveal a second note first.');
    });
  }
  it('the type carries lockedValue on the fader, options and toggle variants', () => {
    assert.equal((read('src/screens/lab/rack/rackTypes.ts').match(/^\s*lockedValue\?: string;$/gm) ?? []).length, 3);
  });
});

// ─────────────────────────────────────────────── SN-2 (F6b TB-01)
// A bezel cell's lesson opens on a plain TAP too, only where a tap has no job.
describe('SN-2: a bezel cell opens its lesson on a tap, never taking a tap that has a job', () => {
  it('bezelTapHelp: helpKey + onHelp and no onPress → a tap opens that lesson', async () => {
    const { bezelTapHelp } = await import('../src/screens/lab/rack/bezelRules.ts');
    const opened: (string | undefined)[] = [];
    const onHelp = (k?: string) => opened.push(k);
    const tap = bezelTapHelp({ helpKey: 'cutaway' }, onHelp);
    assert.ok(tap);
    tap!();
    assert.deepEqual(opened, ['cutaway']);
  });
  it('bezelTapHelp: a tap-to-reset cell keeps its tap; no helpKey or no onHelp → nothing', async () => {
    const { bezelTapHelp } = await import('../src/screens/lab/rack/bezelRules.ts');
    const onHelp = () => {};
    assert.equal(bezelTapHelp({ helpKey: 'pk', onPress: () => {} }, onHelp), undefined);
    assert.equal(bezelTapHelp({}, onHelp), undefined);
    assert.equal(bezelTapHelp({ helpKey: 'pk' }, undefined), undefined);
  });
  it('the spoken label says "tap" where a tap opens the lesson, "long-press" where the tap resets', async () => {
    const { bezelCellSaid } = await import('../src/screens/lab/rack/bezelRules.ts');
    assert.equal(bezelCellSaid({ v: '3', helpKey: 'k' }), '3 — tap for its lesson');
    assert.equal(bezelCellSaid({ v: '3', helpKey: 'k', onPress: () => {} }), '3 — long-press for its lesson');
    assert.equal(bezelCellSaid({ v: '3' }), '3');
  });
  it('the cell: its own onPress first, then the lesson; long-press kept; nothing new drawn', () => {
    const c = code('src/screens/lab/rack/BezelReadouts.tsx');
    assert.match(c, /const tapHelp = bezelTapHelp\(it, onHelp\);/);
    assert.match(c, /onPress=\{it\.onPress \?\? tapHelp\}/);
    assert.match(c, /onLongPress=\{it\.helpKey \? \(\) => onHelp\?\.\(it\.helpKey\) : undefined\}/);
    assert.match(c, /accessibilityRole=\{it\.onPress \|\| tapHelp \? 'button' : 'text'\}/);
    // the lifted look and the › caret stay for tap-to-reset cells only
    assert.match(c, /it\.onPress && styles\.cellTappable/);
    assert.doesNotMatch(c, /tapHelp && styles/);
  });
});

// ─────────────────────────────────────────────── SN-3 (F4)
describe('SN-3: PagedLab draws no subtitle line for an empty subtitle', () => {
  it('the page-one subtitle Text renders only when the subtitle has words', () => {
    const c = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(c, /\{page === 0 && subtitle \? <Text style=\{styles\.subtitle\}>\{subtitle\}<\/Text> : null\}/);
    assert.doesNotMatch(c, /\{page === 0 \? <Text style=\{styles\.subtitle\}>/);
  });
});

// ─────────────────────────────────────────────── SN-4 (F8a HAR-01)
describe('SN-4: LabShell rack.wellTop may be a function of the shell API', () => {
  const shell = code('src/screens/lab/LabShell.tsx');
  it('the type takes a node OR (api) => node, like the children', () => {
    assert.match(shell, /wellTop\?: ReactNode \| \(\(api: LabShellExploreApi\) => ReactNode\);/);
  });
  it('a function gets the rack api; a plain node renders as itself, in the same place (above the caption, outside LAB NOTES)', () => {
    const line = "{typeof rack.wellTop === 'function' ? rack.wellTop(api) : rack.wellTop}";
    assert.ok(shell.includes(line));
    const at = shell.indexOf(line);
    assert.ok(at > shell.indexOf('{(api) => ('), 'inside the RackUnit well function, so `api` is the rack api');
    assert.ok(at < shell.indexOf('<Text style={styles.caption}>{exploreCaption}</Text>', at), 'above the caption');
    assert.ok(at < shell.indexOf('<CollapsibleSection title="LAB NOTES"', at), 'outside LAB NOTES');
    // run the branch: a node passes through untouched; a function receives the api
    const pick = (wellTop: unknown, api: unknown) => (typeof wellTop === 'function' ? (wellTop as (a: unknown) => unknown)(api) : wellTop);
    const node = { type: 'View' };
    const api = { setScrollLocked: () => {} };
    assert.equal(pick(node, api), node);
    assert.equal(pick(undefined, api), undefined);
    assert.equal(pick((a: unknown) => a, api), api);
  });
});

// ─────────────────────────────────────────────── SN-5 (F7a EQ-05)
describe('SN-5: LEARN and LAB NOTES end on "Done here? Try CHECK ›"; the repeat caption is gone', () => {
  const shell = code('src/screens/lab/LabShell.tsx');
  it('the caption that only repeated the section heads is gone from both LEARN branches', () => {
    assert.doesNotMatch(shell, /What this lab teaches — definitions, common mistakes, pro tips, and the formula\./);
  });
  it('rack LEARN: the lesson, then the line, only in a lab with a CHECK tab', () => {
    assert.match(shell, /<GuidedLessonBody lesson=\{lesson\} \/>\s*\{hasCheck \? <TryCheckLine onPress=\{openCheck\} \/> : null\}/);
  });
  it('LAB NOTES: the line is the last thing inside the disclosure, after the GUIDED LESSON row', () => {
    assert.match(shell, /ⓘ GUIDED LESSON — long-press any control for its own entry<\/Text>\s*<\/Pressable>\s*\{hasCheck \? <TryCheckLine onPress=\{openCheck\} \/> : null\}\s*<\/CollapsibleSection>/);
    assert.equal((shell.match(/<TryCheckLine /g) ?? []).length, 2, 'rack LEARN and LAB NOTES only (the non-rack branch draws no CHECK view)');
  });
  it('the line does exactly what the CHECK tab does', () => {
    const fn = shell.slice(shell.indexOf('const openCheck = () => {'), shell.indexOf('};', shell.indexOf('const openCheck = () => {')));
    assert.match(fn, /pickedTabRef\.current = true;\s*setScrollLocked\(false\);\s*setMode\('check'\);/);
    const tab = shell.slice(shell.indexOf('accessibilityRole="tablist"'), shell.indexOf('accessibilityRole="tab"'));
    assert.match(tab, /pickedTabRef\.current = true;\s*setScrollLocked\(false\);\s*setMode\(m\.key\);/);
    assert.match(shell, /const hasCheck = modes\.some\(\(m\) => m\.key === 'check'\);/);
  });
  it('the words and the look: a 12 pt line in the CHECK tab\'s blue, a 44 pt target', () => {
    assert.match(shell, /<Text style=\{styles\.tryCheckText\}>Done here\? Try CHECK ›<\/Text>/);
    assert.match(shell, /tryCheckText: \{ fontFamily: fonts\.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: MODE_COLORS\.check \}/);
    assert.match(shell, /tryCheck: \{ alignSelf: 'flex-start', minHeight: 44/);
  });
});
