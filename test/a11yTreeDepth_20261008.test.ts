/**
 * ACCESSIBILITY TREE RATCHET — Sentry APE-STUDIO-W / R / S (2026-10-07).
 *
 * iOS 27, build 34, an iPhone 16 Pro in Cupertino on a development kernel —
 * almost certainly Apple App Review — and the same trace on builds 27 and 30:
 * the main thread hung for 2 s+ inside
 * `_accessibilityUserTestingSnapshotDescendantsWithAttributes` /
 * `_axRecursivelyPropertyListCoercedRepresentationWithError`, every time right
 * after the Study Dashboard loaded. An accessibility client asked for the whole
 * element tree and the app handed it THOUSANDS of native views, a dozen deep:
 *   • every react-native-svg shape is a native view — the powder-coat face
 *     behind every ElevatedFrame drew 240 <Circle>s, the Dashboard's rack face
 *     130 more, every screw 7;
 *   • unlabelled LED strips (21 views each), vent fields (78 each), glass
 *     sheens — all visible to the walk;
 *   • the Home carousel mounted all ~30 cards.
 * And a second, related class: on iOS a Pressable is an accessibility ELEMENT
 * by default, so a Pressable wrapping other controls hides them from a screen
 * reader and reads every text inside it as one run-on label.
 *
 * This file pins the fixes and ratchets the classes app-wide. Allowlists may
 * only SHRINK: an entry that no longer matches fails until it is removed.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const rel = (f: string) => relative(ROOT, f).split(sep).join('/');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) tsxFiles(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}
const FILES = tsxFiles(SRC).map((f) => ({ f: rel(f), sf: ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) }));

type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;
const attr = (el: Opening, name: string) =>
  el.attributes.properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === name);
const isFalse = (a: ts.JsxAttribute | undefined) =>
  !!a && !!a.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword;
const lineOf = (sf: ts.SourceFile, n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
const opening = (n: ts.Node): Opening | null => (ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null);

/** Name of the nearest enclosing function — a line-number-free key. */
function enclosingFn(n: ts.Node): string {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name) return p.name.text;
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text;
  }
  return '<module>';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Every react-native-svg ROOT makes an accessibility decision.
// ─────────────────────────────────────────────────────────────────────────────
const SVG_ROOTS = new Set(['Svg', 'SvgXml']);
const DECIDED = ['accessibilityElementsHidden', 'importantForAccessibility', 'aria-hidden', 'accessible', 'accessibilityLabel', 'aria-label', 'accessibilityRole', 'role'];
/** Reviewed exceptions (`file#enclosingFunction`). Empty on 2026-10-08 — every
 *  root in src/ decides. SHRINK ONLY: do not add to it; decide instead. */
const SVG_UNDECIDED_OK = new Set<string>([]);

describe('APE-STUDIO-W/R/S — the accessibility tree stays small', () => {
  it('every <Svg>/<SvgXml> root is hidden from the accessibility tree or is ONE labelled element', () => {
    const bad: string[] = [];
    const usedOk = new Set<string>();
    for (const { f, sf } of FILES) {
      const visit = (n: ts.Node) => {
        const o = opening(n);
        if (o && ts.isIdentifier(o.tagName) && SVG_ROOTS.has(o.tagName.text)) {
          const decided = DECIDED.some((a) => attr(o, a));
          if (!decided) {
            const key = `${f}#${enclosingFn(n)}`;
            if (SVG_UNDECIDED_OK.has(key)) usedOk.add(key);
            else bad.push(`${f}:${lineOf(sf, n)} (${enclosingFn(n)})`);
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert.deepEqual(bad, [], 'An <Svg> with no accessibility decision: add accessibilityElementsHidden importantForAccessibility="no-hide-descendants" (decorative), or make it ONE labelled element. Every SVG shape is a native view the accessibility walk visits.');
    const stale = [...SVG_UNDECIDED_OK].filter((k) => !usedOk.has(k));
    assert.deepEqual(stale, [], 'Allowlist entries that no longer match — remove them (shrink-only).');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. No accessibility element nested inside another.
  // ───────────────────────────────────────────────────────────────────────────
  it('no accessible element (a Pressable is one by default) sits inside another', () => {
    const PRESSABLE = /^(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Animated\.Pressable)$/;
    const isEl = (o: Opening) => {
      const a = attr(o, 'accessible');
      if (a) return !isFalse(a);
      return PRESSABLE.test(o.tagName.getText());
    };
    /** Miking lessons belong to the lessons' own agents (2026-10-08); each
     *  is a labelled figure frame around a labelled image. SHRINK ONLY. */
    const NESTED_OK: Record<string, number> = {
      'src/screens/lab/miking/lessons/a10Harmonica/art.tsx': 1,
      'src/screens/lab/miking/lessons/a10Harmonica/paths.tsx': 1,
      'src/screens/lab/miking/lessons/a11Accordion/art.tsx': 1,
      'src/screens/lab/miking/lessons/a12Organ/art.tsx': 3,
      'src/screens/lab/miking/lessons/a12Organ/pages.tsx': 1,
      'src/screens/lab/miking/lessons/shared/freereed/ReedArt.tsx': 2,
      'src/screens/lab/miking/lessons/shared/hand/HandPlan.tsx': 1,
      'src/screens/lab/miking/lessons/shared/handdrums/HandPlan.tsx': 1,
      'src/screens/lab/miking/lessons/shared/metal/metalPages.tsx': 1,
      'src/screens/lab/miking/lessons/shared/woodwinds/WindPlan.tsx': 1,
    };
    const counts: Record<string, number> = {};
    const where: string[] = [];
    for (const { f, sf } of FILES) {
      const visit = (n: ts.Node, inside: boolean) => {
        const o = opening(n);
        let now = inside;
        if (o && isEl(o)) {
          if (inside) {
            counts[f] = (counts[f] ?? 0) + 1;
            where.push(`${f}:${lineOf(sf, n)} <${o.tagName.getText()}>`);
          }
          now = true;
        }
        ts.forEachChild(n, (c) => visit(c, now));
      };
      visit(sf, false);
    }
    const over = Object.entries(counts).filter(([f, c]) => c > (NESTED_OK[f] ?? 0));
    assert.deepEqual(
      over.map(([f]) => where.filter((w) => w.startsWith(f + ':'))).flat(),
      [],
      'An accessible element inside another is unreachable on iOS and the outer one reads everything inside as one label. Make the wrapper accessible={false} (and give its action a visible key / onAccessibilityEscape), or keep the wrapper and move the inner control to accessibilityActions with the inner one accessible={false}.',
    );
    const shrunk = Object.entries(NESTED_OK).filter(([f, c]) => (counts[f] ?? 0) < c);
    assert.deepEqual(shrunk, [], 'Lower the NESTED_OK count to the new value (shrink-only).');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. The textures that carried the bulk of the tree.
  // ───────────────────────────────────────────────────────────────────────────
  it('specks are drawn as a few paths, not one native view each', async () => {
    // The helpers live in ElevatedFrame.tsx (the start-module budget is a
    // ratchet); transpile exactly the marked pure block and test it.
    const src = read('src/components/ElevatedFrame.tsx');
    const block = src.slice(src.indexOf('// <specks>'), src.indexOf('// </specks>'));
    assert.ok(block.length > 100, 'the <specks> block exists');
    const js = ts.transpileModule(block, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
    const { specksToPaths, circlePath } = mod as {
      specksToPaths: (s: { cx: number; cy: number; r: number; fill: string; opacity: number }[], step?: number) => { d: string; fill: string; opacity: number }[];
      circlePath: (cx: number, cy: number, r: number) => string;
    };
    assert.match(circlePath(10, 10, 1), /^M9 10a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z$/);
    // 240 specks over 5 colours with opacity spread 0.55–1.0 → a handful of paths.
    const specks = Array.from({ length: 240 }, (_, i) => ({
      cx: i % 64, cy: (i * 7) % 64, r: 0.5, fill: ['#a', '#b', '#c', '#d', '#e'][i % 5], opacity: 0.55 + ((i * 13) % 46) / 100,
    }));
    const paths = specksToPaths(specks);
    assert.ok(paths.length <= 5 * 11, `${paths.length} paths`);
    const drawn = paths.reduce((n, p) => n + (p.d.match(/M/g)?.length ?? 0), 0);
    assert.equal(drawn, 240, 'every speck still drawn');
    for (const s of specks.slice(0, 20)) {
      const group = paths.find((p) => p.fill === s.fill && Math.abs(p.opacity - s.opacity) <= 0.025 + 1e-9);
      assert.ok(group, 'each speck keeps its colour and (to 0.05) its opacity');
    }

    const frame = read('src/components/ElevatedFrame.tsx');
    assert.doesNotMatch(frame, /SPECKS\.map\(\(d, i\) => \(\s*<Circle/, 'PanelFace must not draw one <Circle> per speck');
    assert.match(frame, /<View pointerEvents="none" style=\{styles\.absFill\} \{\.\.\.A11Y_HIDDEN\}>/, 'PanelFace root is hidden from the accessibility tree');

    const dash = read('src/screens/dashboard/DashboardScreen.tsx');
    assert.doesNotMatch(dash, /GRIT_SPECKS\.map\(\(g, i\) => \(\s*<Circle/, 'BlackFaceBg must not draw one <Circle> per speck');
    assert.match(dash, /specksToPaths\(\s*GRIT_SPECKS\.map/);
  });

  it('the Dashboard hides its hardware and says each divider once', () => {
    const dash = read('src/screens/dashboard/DashboardScreen.tsx');
    const fnBody = (name: string) => {
      const i = dash.indexOf(`function ${name}(`);
      assert.ok(i >= 0, name);
      return dash.slice(i, dash.indexOf('\nfunction ', i + 10) > 0 ? dash.indexOf('\nfunction ', i + 10) : undefined);
    };
    assert.equal((fnBody('CornerScrews').match(/\{\.\.\.A11Y_HIDDEN\}/g) ?? []).length, 4, 'all four corner screws hidden');
    assert.match(fnBody('VentHoles'), /<View style=\{styles\.ventField\} \{\.\.\.A11Y_HIDDEN\}>/);
    assert.match(fnBody('GlassCover'), /\{\.\.\.A11Y_HIDDEN\}/);
    assert.match(fnBody('BlackFaceBg'), /\{\.\.\.A11Y_HIDDEN\}/);
    assert.match(fnBody('SectionRackPanel'), /accessible accessibilityRole="header" accessibilityLabel=\{label\}/);
  });

  it('an unlabelled LedMeter is decorative and hidden; a labelled one is one progressbar', () => {
    const led = read('src/components/LedMeter.tsx');
    assert.match(led, /accessibilityRole: 'progressbar' as const/);
    assert.match(led, /:\s*\/\/[^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*A11Y_HIDDEN;/, 'the no-label branch spreads A11Y_HIDDEN');
  });

  it('A11Y_HIDDEN hides the whole subtree on both platforms', () => {
    assert.match(
      read('src/features/settings/a11y.ts'),
      /export const A11Y_HIDDEN = \{\s*accessible: false,\s*accessibilityElementsHidden: true,\s*importantForAccessibility: 'no-hide-descendants',\s*\} as const;/,
    );
  });

  it('Home mounts a window of cards, not all of them, and the dots are ONE element', () => {
    const home = read('src/screens/courses/CourseSelectionScreen.tsx');
    const num = (k: string) => Number(home.match(new RegExp(`${k}=\\{(\\d+)\\}`))?.[1] ?? NaN);
    assert.ok(num('windowSize') <= 7, 'windowSize');
    assert.ok(num('initialNumToRender') <= 5, 'initialNumToRender');
    assert.match(home, /accessibilityLabel=\{displayDeck\?\.length \? `Card \$\{activeIdx \+ 1\} of \$\{displayDeck\.length\}` : undefined\}/);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. On the screens fixed here: no unlabelled element that reads a whole
  //    block of text as its label, and no label assembled from a list.
  // ───────────────────────────────────────────────────────────────────────────
  const FIXED = [
    'src/screens/dashboard/DashboardScreen.tsx',
    'src/screens/courses/CourseSelectionScreen.tsx',
    'src/screens/study/FlashcardsScreen.tsx',
    'src/screens/enrollment/EnrollmentScreen.tsx',
    'src/screens/glossary/GlossaryScreen.tsx',
    'src/features/intro/LearningIntroSheet.tsx',
    'src/features/intro/TopicWelcomeSheet.tsx',
    'src/components/TrophyModal.tsx',
    'src/components/ElevatedFrame.tsx',
    'src/components/LedMeter.tsx',
    'src/screens/awards/CredentialThumb.tsx',
    'src/screens/profile/ProfileScreen.tsx',
    'src/screens/tools/SplMeterScreen.tsx',
    'src/screens/tools/Rt60Screen.tsx',
    'src/screens/tools/WaveformScreen.tsx',
  ];
  it('fixed screens: no unlabelled element wrapping a block of text, no label built from a list', () => {
    const PRESSABLE = /^(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Animated\.Pressable)$/;
    const bad: string[] = [];
    for (const { f, sf } of FILES.filter((x) => FIXED.includes(x.f))) {
      const visit = (n: ts.Node) => {
        if (ts.isJsxElement(n)) {
          const o = n.openingElement;
          const a = attr(o, 'accessible');
          const isEl = a ? !isFalse(a) : PRESSABLE.test(o.tagName.getText());
          const labelled = !!(attr(o, 'accessibilityLabel') || attr(o, 'aria-label'));
          if (isEl && !labelled) {
            let texts = 0;
            let scroll = false;
            const count = (c: ts.Node) => {
              const co = opening(c);
              if (co) {
                const t = co.tagName.getText();
                if (t === 'Text' || t === 'LinkedText') texts++;
                if (/ScrollView|FlatList/.test(t)) scroll = true;
              }
              ts.forEachChild(c, count);
            };
            n.children.forEach(count);
            if (scroll || texts >= 4) bad.push(`${f}:${lineOf(sf, n)} unlabelled <${o.tagName.getText()}> over ${texts} texts${scroll ? ' + a scroll view' : ''}`);
          }
        }
        const o = opening(n);
        const la = o && attr(o, 'accessibilityLabel');
        if (la?.initializer && ts.isJsxExpression(la.initializer) && la.initializer.expression) {
          // A label MAPPED over data grows with the data (a fixed array of
          // parts joined together is fine — Profile's ID card does that).
          if (/\.map\(/.test(la.initializer.expression.getText(sf))) bad.push(`${f}:${lineOf(sf, n)} label mapped over a list`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert.deepEqual(bad, []);
  });

  it('the pinned nested-element fixes stay fixed', () => {
    const flash = read('src/screens/study/FlashcardsScreen.tsx');
    assert.match(flash, /style=\{\{ flex: 1 \}\}\s*accessible=\{false\}\s*>/, 'the card wrapper is not one element');
    assert.match(flash, /<Pressable accessible=\{false\} onPress=\{studyMode \|\| level !== 0 \? undefined : onTap\} style=\{styles\.fsBody\}>/);
    assert.match(read('src/features/intro/LearningIntroSheet.tsx'), /<Pressable accessible=\{false\} style=\{styles\.backdrop\} onPress=\{onBegin\} onAccessibilityEscape=\{onBegin\}>/);
    assert.match(read('src/features/intro/TopicWelcomeSheet.tsx'), /<Pressable style=\{styles\.scrim\} onPress=\{dismiss\} accessible=\{false\} onAccessibilityEscape=\{dismiss\}>/);
    assert.match(read('src/screens/glossary/GlossaryScreen.tsx'), /<Pressable onPress=\{popupBack\} accessible=\{false\} onAccessibilityEscape=\{popupBack\}>/);
    assert.match(read('src/components/TrophyModal.tsx'), /accessibilityActions=\{action && !action\.busy \? \[\{ name: 'trophyAction', label: action\.label \}\] : undefined\}/);
  });
});
