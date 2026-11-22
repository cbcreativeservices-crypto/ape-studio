/**
 * American English in learner text (owner 2026-11-21, after "reads a polite
 * level" in a lab): every string a student can see or hear uses American
 * spelling. This ratchet parses every src file (TypeScript AST, so comments are
 * never read) and scans string literals, template text, JSX text and JSON
 * strings for British spellings and a few British idioms.
 *
 * Not scanned, because they are not text a student reads:
 *   - import paths, object keys, type literals, `===` / `case` operands and
 *     element-access keys (identifiers by construction);
 *   - slug-shaped literals with no space ('mar.centre.pair', 'musical-theatre');
 *   - words inside quotation marks within a literal, and `quote:` / src(…)
 *     values: those are verbatim words from a manufacturer or a guide.
 * Anything else kept on purpose is in KEEP below, each with its reason. KEEP may
 * only SHRINK: a stale entry fails the second test.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

const SPELLINGS = [
  'centre', 'centres', 'centred', 'centring',
  'colour\\w*', 'grey', 'greys', 'greyed', 'greying', 'greyish', 'greyscale',
  'cancelled', 'cancelling', 'labelled', 'labelling', 'neighbour\\w*',
  'metre', 'metres', 'centimetres?', 'millimetres?', 'kilometres?', 'programme', 'programmes',
  'normalis(e|ed|es|ing|ation)', 'behaviour\\w*', 'practis(e|ed|es|ing)',
  'travelling', 'travelled', 'traveller\\w*', 'favourite\\w*', 'favour(s|ed|ing|able)?', 'aluminium',
  'analys(e|ed|es|ing|er|ers)', 'catalogue\\w*', 'judgement\\w*', 'modelling', 'modelled',
  'signalling', 'signalled', 'levelling', 'levelled',
  'organis(e|ed|es|ing|ation|ations)', 'realis(e|ed|es|ing|ation)', 'recognis(e|ed|es|ing|able|ably)',
  'optimis(e|ed|es|ing|ation)', 'minimis(e|ed|es|ing)', 'maximis(e|ed|es|ing)', 'summaris(e|ed|es|ing)',
  'visualis(e|ed|es|ing|ation)', 'customis(e|ed|es|ing|ation)', 'emphasis(e|ed|es|ing)', 'prioritis(e|ed|es|ing)',
  'synchronis(e|ed|es|ing|ation)', 'quantis(e|ed|es|ing|ation)', 'localis(e|ed|es|ing|ation)',
  'whilst', 'amongst', 'learnt', 'towards', 'fibre', 'fibres', 'licence', 'licences', 'defence', 'offence',
  'sceptic\\w*', 'ageing', 'artefacts?', 'analogue', 'maths', 'theatre', 'theatres', 'litres?', 'enrols',
  'plough\\w*', 'atomisation',
];
const IDIOMS = ['straight away', 'pass mark', 'tick the box', 'wall socket', 'mains hum', 'mains power', 'mains voltage', 'polite level', 'fortnight', 'per cent'];
const WORD = new RegExp(`(?<![A-Za-z])(${SPELLINGS.join('|')})(?![A-Za-z])`, 'gi');
const PHRASE = new RegExp(`(?<![A-Za-z])(${IDIOMS.join('|')})(?![A-Za-z])`, 'gi');

/** Kept on purpose: `file` (relative to src) + the British word as written + why. */
const KEEP: { file: string; word: string; why: string }[] = [
  // Identifiers whose shown label is already American (the id must not change: saved data, ids, maps).
  { file: 'screens/lab/cymatics/MembraneStudioScreen.tsx', word: 'centre', why: "strike-point id; its label reads 'Center'" },
  { file: 'screens/lab/cymatics/PlateStudioScreen.tsx', word: 'centre', why: "driver-position id; its label reads 'Center'" },
  { file: 'screens/lab/cymatics/GalleryScreen.tsx', word: 'favourite', why: "accessibility action NAME (an id); its label reads 'Add to favorites'" },
  { file: 'screens/tools/Spl3dGauge.tsx', word: 'grey', why: 'colour-zone key of the gauge palette (never shown)' },
  { file: 'features/lab/guidedLessons/content.ts', word: 'grey', why: "noise-color key; its name reads 'Gray'" },
  { file: 'features/production/postprod/stage5.data.ts', word: 'quantised', why: "saved form value; its label reads 'Fully quantized'" },
  { file: 'features/production/postprod/logic2.ts', word: 'quantised', why: 'matches the saved form value above' },
  { file: 'features/production/postprod/stage6.data.ts', word: 'labelled', why: "saved form value; its label reads 'Tracks labeled'" },
  { file: 'features/production/postprod/stage6.data.ts', word: 'centre', why: "saved form value; its label reads 'Center-channel dependence'" },
  { file: 'features/study/sentences.ts', word: 'analogue', why: 'stop-word list matched against glossary text, never shown' },
  { file: 'features/permissions/PermissionPrompt.tsx', word: 'cancelled', why: 'result value of the permission prompt (code)' },
  { file: 'screens/lab/gameaudio/engine/gaEngineSource.ts', word: 'analyser', why: 'embedded Web Audio JavaScript (createAnalyser is the API name)' },
  { file: 'screens/lab/gameaudio/engine/gaEngineSource.ts', word: 'cancelling', why: 'a comment inside the embedded engine JavaScript' },
  { file: 'screens/lab/gameaudio/engine/gaEngineSource.ts', word: 'cancelled', why: 'engine message value inside the embedded JavaScript' },
  { file: 'screens/lab/miking/lessons/e02BackgroundVocals/lesson.ts', word: 'neighbour', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/f13RoomAcoustics/lesson.ts', word: 'centre', why: 'position id' },
  { file: 'screens/lab/miking/lessons/f15Machinery/geometry.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/i12Gong/pages.tsx', word: 'centre', why: 'strike-spot id' },
  { file: 'screens/lab/miking/lessons/m09Overheads/pages.tsx', word: 'centre', why: 'option id' },
  { file: 'screens/lab/miking/lessons/c11Piano/geometry.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/c10Harp/geometry.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/c05aBanjo/model.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/a11Accordion/geometry.ts', word: 'centre', why: 'zone id / radial line id' },
  { file: 'screens/lab/miking/lessons/c10Harp/model.ts', word: 'centre', why: 'radial line id' },
  { file: 'screens/lab/miking/lessons/m04cTimbales/model.ts', word: 'centre', why: 'radial line id' },
  { file: 'screens/lab/miking/lessons/m04cTimbales/geometry.ts', word: 'centre', why: 'zone id / ray origin id' },
  { file: 'screens/lab/miking/lessons/m04aCongas/geometry.ts', word: 'centre', why: 'ray origin id' },
  { file: 'screens/lab/miking/lessons/m04bBongos/geometry.ts', word: 'centre', why: 'ray origin id' },
  { file: 'screens/lab/miking/lessons/m05Djembe/geometry.ts', word: 'centre', why: 'ray origin id' },
  { file: 'screens/lab/miking/lessons/a03Horn/model.ts', word: 'centre', why: 'reference-surface id' },
  { file: 'screens/lab/miking/lessons/a04aTuba/model.ts', word: 'centre', why: 'reference-surface id' },
  { file: 'screens/lab/miking/lessons/a04bEuphonium/model.ts', word: 'centre', why: 'reference-surface id' },
  { file: 'screens/lab/miking/lessons/f15Machinery/model.ts', word: 'centre', why: 'reference-surface id' },
  { file: 'screens/lab/miking/lessons/shared/electric/ampPages.tsx', word: 'centre', why: "spot id; its label reads 'CENTER'" },
  { file: 'screens/lab/miking/lessons/shared/keys/keysPages.tsx', word: 'centre', why: "spot id; its label reads 'CENTER'" },
  { file: 'screens/lab/miking/lessons/shared/measure/RoomTools.tsx', word: 'centre', why: 'sampling-spot id' },
  { file: 'screens/lab/miking/lessons/shared/measure/ArrayTools.tsx', word: 'centre', why: 'state id' },
  { file: 'screens/lab/miking/lessons/shared/measure/sampling.ts', word: 'centre', why: "sampling-spot id; its label reads 'The middle of the room'" },
  { file: 'screens/lab/miking/lessons/shared/sports/arenaPages.tsx', word: 'centre', why: 'surround-channel id' },
  { file: 'screens/lab/miking/lessons/shared/sports/downmix.ts', word: 'centre', why: 'surround-channel id' },
  { file: 'screens/lab/miking/lessons/shared/ensemble/frameS.ts', word: 'centre', why: 'layout id' },
  { file: 'screens/lab/miking/lessons/shared/lowbrass/lowBrassModel.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/shared/mallets/malletModel.ts', word: 'centre', why: 'zone id' },
  { file: 'screens/lab/miking/lessons/spk/pages.tsx', word: 'centre', why: "spot id; its label reads 'CENTER'" },
  // Proper nouns and titles.
  { file: 'features/forum/sampleData.ts', word: 'Theatre', why: 'forum category name as the server stores it (sample of server rows)' },
];

type Hit = { file: string; line: number; word: string; text: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

const SLUG = /^[\w./-]+$/; // no space: an id, path, key or file name
/** Blank out quoted words (verbatim source text) so they are not scanned. */
const unquote = (s: string) => s.replace(/“[^”]*”|"[^"]*"/g, (q) => ' '.repeat(q.length));

function spans(file: string, text: string): { start: number; text: string }[] {
  const out: { start: number; text: string }[] = [];
  if (file.endsWith('.json')) {
    const re = /"((?:[^"\\]|\\.)*)"(\s*:)?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) if (!m[2]) out.push({ start: m.index + 1, text: m[1] });
    return out;
  }
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const skip = (node: ts.Node): boolean => {
    let n: ts.Node = node;
    if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) n = ts.isTemplateSpan(n.parent) ? n.parent.parent : n.parent;
    const p = n.parent;
    if (!p) return false;
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isLiteralTypeNode(p)) return true;
    if (ts.isCallExpression(p) && (p.expression.getText(sf) === 'require' || p.expression.getText(sf) === 'src')) return true;
    if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isEnumMember(p)) && p.name === n) return true;
    // A verbatim quotation: the value of `quote:` or of a *_QUOTE constant (also through a ?: choice).
    let q: ts.Node = n;
    while (q.parent && (ts.isConditionalExpression(q.parent) || ts.isParenthesizedExpression(q.parent))) q = q.parent;
    if (ts.isPropertyAssignment(q.parent) && q.parent.name.getText(sf) === 'quote') return true;
    if (ts.isVariableDeclaration(q.parent) && /quote/i.test(q.parent.name.getText(sf))) return true;
    if (ts.isElementAccessExpression(p) || ts.isCaseClause(p)) return true;
    if (ts.isBinaryExpression(p) && /^[!=]==?$/.test(p.operatorToken.getText(sf))) return true;
    return false;
  };
  const visit = (node: ts.Node) => {
    const k = node.kind;
    if (k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      if (!skip(node)) out.push({ start: node.getStart(sf) + 1, text: node.getText(sf).slice(1, -1) });
    } else if (k === ts.SyntaxKind.TemplateHead || k === ts.SyntaxKind.TemplateMiddle || k === ts.SyntaxKind.TemplateTail) {
      const raw = node.getText(sf);
      if (!skip(node)) out.push({ start: node.getStart(sf) + 1, text: raw.slice(1, k === ts.SyntaxKind.TemplateTail ? -1 : -2) });
    } else if (k === ts.SyntaxKind.JsxText) {
      out.push({ start: node.pos, text: text.slice(node.pos, node.end) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const abs of walk(SRC)) {
    const file = relative(SRC, abs).replace(/\\/g, '/');
    const text = readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
    for (const sp of spans(abs, text)) {
      if (SLUG.test(sp.text) && /[./_-]/.test(sp.text)) continue;
      const body = unquote(sp.text);
      for (const re of [WORD, PHRASE]) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(body))) {
          const line = text.slice(0, sp.start + m.index).split('\n').length;
          hits.push({ file, line, word: m[1], text: sp.text.slice(Math.max(0, m.index - 40), m.index + 40) });
        }
      }
    }
  }
  return hits;
}

const HITS = scan();
const kept = (h: Hit) => KEEP.some((k) => k.file === h.file && k.word === h.word);

describe('American English in learner text (owner 2026-11-21)', () => {
  it('no British spelling or idiom in any src string, template or JSX text', () => {
    const bad = HITS.filter((h) => !kept(h)).map((h) => `src/${h.file}:${h.line} «${h.word}» …${h.text}…`);
    assert.deepEqual(bad, [], 'use American English (center, color, gray, toward, right away, AC hum …)');
  });
  it('every KEEP entry is still needed and gives a reason (the list may only shrink)', () => {
    const stale = KEEP.filter((k) => !k.why.trim() || !HITS.some((h) => h.file === k.file && h.word === k.word));
    assert.deepEqual(stale, [], 'remove these KEEP entries');
  });
});
