// Extract every user-visible Career Finder string, with file:line and a stable ID.
// Usage: node cf_extract.cjs <repoRoot> <outDir>
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const out = process.argv[3];
const ts = require(path.join(root, 'node_modules', 'typescript'));

const TS_FILES = [
  'src/screens/careerfinder/CareerFinderScreen.tsx',
  'src/screens/careerfinder/CareerFinderQuizScreen.tsx',
  'src/screens/careerfinder/CareerFinderResultsScreen.tsx',
  'src/screens/careerfinder/CareerFamilyListScreen.tsx',
  'src/screens/careerfinder/CareerFamilyScreen.tsx',
  'src/screens/careerfinder/CareerFinderAboutScreen.tsx',
  'src/screens/careerfinder/kit.tsx',
  'src/features/careerfinder/questions.ts',
  'src/features/careerfinder/dimensions.ts',
  'src/features/careerfinder/families.ts',
  'src/features/careerfinder/scoring.ts',
  'src/features/careerfinder/careerIndex.ts',
  'src/features/careerfinder/educationNote.ts',
  'src/features/careerfinder/labsForDimension.ts',
  'src/features/careerfinder/store.ts',
  'src/data/careerRequirement.ts',
  'src/data/gatedRoles.ts',
];

const SKIP_ATTRS = new Set(['style', 'testID', 'accessibilityRole', 'key', 'name', 'color', 'pointerEvents', 'resizeMode', 'hitSlop', 'nativeID', 'importantForAccessibility', 'textBreakStrategy', 'ellipsizeMode', 'keyboardShouldPersistTaps', 'behavior', 'source', 'icon', 'variant', 'tone', 'kind', 'size', 'align']);

function looksLikeCopy(s) {
  const t = s.trim();
  if (!/[A-Za-z]/.test(t)) return false;
  if (/^[a-z0-9_.\-/:#@]+$/.test(t)) return false;            // ids, keys, paths, kebab, lower words
  if (/^[a-z]+[A-Z][A-Za-z0-9]*$/.test(t)) return false;       // camelCase identifiers
  if (/^[A-Z][a-z]+[A-Z][A-Za-z]*$/.test(t)) return false;     // PascalCase route names
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false;
  if (/^(rgba?|hsla?)\(/.test(t)) return false;
  if (/^[A-Z]{2}$/.test(t)) return false;                       // dimension codes like RC, ER
  if (/^[A-Z_]{2,}$/.test(t) && t.includes('_')) return false;  // CONSTANT_NAMES
  if (/^\.\.?\//.test(t) || /\.(ts|tsx|json|webp|png)$/.test(t)) return false;
  return true;
}

const rows = [];
function add(file, line, kind, text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return;
  rows.push({ file, line, kind, text: clean });
}

for (const rel of TS_FILES) {
  const full = path.join(root, rel);
  const src = fs.readFileSync(full, 'utf8');
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  const skip = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isTypeNode(p) || ts.isLiteralTypeNode?.(p)) return true;
      if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 'require') return true;
      if (ts.isJsxAttribute(p) && SKIP_ATTRS.has(p.name.getText(sf))) return true;
      if (ts.isElementAccessExpression(p) && p.argumentExpression === n) return true;
      if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(p.operatorToken.kind)) return true;
      if (ts.isCaseClause(p) && p.expression === n) return true;
      if (ts.isPropertyAssignment(p) && p.name === n) return true;
      if (ts.isStatement(p) || ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p)) break;
    }
    // object keys like { id: 'x' } : skip known non-copy property names
    const pa = n.parent;
    if (pa && ts.isPropertyAssignment(pa) && pa.initializer === n) {
      const k = pa.name.getText(sf).replace(/['"]/g, '');
      if (['id', 'route', 'screen', 'name_id', 'key', 'code', 'kind', 'icon', 'testID', 'color', 'tone', 'gs', 'slug', 'type'].includes(k)) return true;
    }
    return false;
  };
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (!skip(n) && looksLikeCopy(n.text)) add(rel, lineOf(n), 'string', n.text);
    } else if (ts.isTemplateExpression(n)) {
      if (!skip(n)) {
        let s = n.head.text;
        for (const span of n.templateSpans) s += '{' + span.expression.getText(sf) + '}' + span.literal.text;
        if (looksLikeCopy(s.replace(/\{[^}]*\}/g, ''))) add(rel, lineOf(n), 'template', s);
      }
      return; // do not descend into spans separately
    } else if (ts.isJsxText(n)) {
      if (/[A-Za-z]/.test(n.text)) add(rel, lineOf(n), 'jsx', n.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

// ---- data files ----
const idx = JSON.parse(fs.readFileSync(path.join(root, 'src/data/careerIndex.json'), 'utf8'));
const fam = JSON.parse(fs.readFileSync(path.join(root, 'src/data/careerFamilies.json'), 'utf8'));
const data = [];
for (const [k, arr] of Object.entries(idx.enums)) arr.forEach((v, i) => data.push({ group: `Career detail labels: ${k}`, ref: `enums.${k}[${i}]`, text: v }));
fam.forEach((f) => {
  data.push({ group: 'Family path line (field › subject)', ref: `${f.id}.field / .subject`, text: `${f.field} › ${f.subject}` });
  data.push({ group: 'Family "where people work" line', ref: `${f.id}.settings`, text: f.settings.join(' · ') });
});
const sources = [...new Set(fam.flatMap((f) => f.sources))];
sources.forEach((s) => data.push({ group: 'Source names', ref: 'families[].sources', text: s }));

const famName = (i) => idx.families[i];
const titles = idx.careers.map((c) => ({ id: c.id, family: famName(c.f), title: c.t, alt: (c.alt || []).join(' · ') }));

fs.mkdirSync(out, { recursive: true });
let n = 0;
const appRows = rows.map((r) => ({ id: 'CF-A' + String(++n).padStart(4, '0'), ...r }));
fs.writeFileSync(path.join(out, 'rows.json'), JSON.stringify({ appRows, data, titles }, null, 1));
console.log('app strings:', appRows.length, 'data labels:', data.length, 'career titles:', titles.length, 'with alternates:', titles.filter((t) => t.alt).length);
const byFile = {};
appRows.forEach((r) => (byFile[r.file] = (byFile[r.file] || 0) + 1));
console.log(byFile);
