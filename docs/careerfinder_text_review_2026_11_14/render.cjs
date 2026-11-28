// Render rows.json into the review list (.md + .html). Usage: node cf_render.cjs <rows.json> <outDir>
const fs = require('fs');
const path = require('path');
const { appRows, data, titles } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];

const SCREEN = {
  'src/screens/careerfinder/CareerFinderScreen.tsx': 'Start screen (first page of the Career Finder)',
  'src/screens/careerfinder/CareerFinderQuizScreen.tsx': 'Question screen (the quiz)',
  'src/screens/careerfinder/CareerFinderResultsScreen.tsx': 'Results screen',
  'src/screens/careerfinder/CareerFamilyListScreen.tsx': 'All career families list',
  'src/screens/careerfinder/CareerFamilyScreen.tsx': 'One career family page (titles, preparation, related topics)',
  'src/screens/careerfinder/CareerFinderAboutScreen.tsx': 'How this works (About) screen',
  'src/screens/careerfinder/kit.tsx': 'Shared pieces (buttons, chips, screen-reader labels)',
  'src/features/careerfinder/questions.ts': 'The questions and the answer buttons',
  'src/features/careerfinder/dimensions.ts': 'The activity areas (names and explanations)',
  'src/features/careerfinder/families.ts': 'The 42 career families (names, example titles, one-sentence descriptions)',
  'src/features/careerfinder/scoring.ts': 'Results wording built from the answers (profile labels, "why this appeared")',
  'src/features/careerfinder/careerIndex.ts': 'Career index labels',
  'src/features/careerfinder/educationNote.ts': 'Education chips on job titles',
  'src/features/careerfinder/labsForDimension.ts': '"Try a lab" suggestions on the results',
  'src/features/careerfinder/store.ts': 'Saving messages',
  'src/data/careerRequirement.ts': 'Required-education labels (degree, license, certification)',
  'src/data/gatedRoles.ts': 'Required-education helper',
};

const ENTRY = [
  ['CF-E0001', 'src/screens/courses/CourseSelectionScreen.tsx:272', 'Find Your Audio Career', 'Home card headline'],
  ['CF-E0002', 'src/screens/courses/CourseSelectionScreen.tsx:439', 'Audio Career Finder', 'Home card title'],
  ['CF-E0003', 'src/screens/courses/CourseSelectionScreen.tsx:458', 'Career Finder', 'Home card short name'],
  ['CF-E0004', 'src/features/intro/samplerStops.ts:88', 'Where this leads', 'First-run tour stop: label'],
  ['CF-E0005', 'src/features/intro/samplerStops.ts:89', 'The careers built on sound level and acoustics — find your fit.', 'First-run tour stop: blurb'],
  ['CF-E0006', 'src/features/intro/samplerStops.ts:92', 'From a single number to a whole career. Explore more, or make yourself at home?', 'First-run tour stop: recap'],
];

const esc = (s) => String(s).replace(/\|/g, '\\|');
const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let md = '';
let html = '';
const P = (m, x) => { md += m + '\n'; html += x + '\n'; };

P('# Career Finder: every piece of text, for review (2026-11-14)', '<h1>Career Finder: every piece of text, for review (2026-11-14)</h1>');
const nData = data.length;
P(`Pulled straight from the app's code on branch ota-after-approval-39-23 (commit f2fa9b62). Parts: A = screen text (${appRows.length} pieces), E = how people reach it (${ENTRY.length}), D = labels on career pages (${nData}), T = job titles (${titles.length}). Text in {curly braces} is filled in by the app (a number, a name or a list); keep the braces when you suggest a change.`,
  `<p>Pulled straight from the app's code on branch ota-after-approval-39-23 (commit f2fa9b62). Parts: A = screen text (${appRows.length} pieces), E = how people reach it (${ENTRY.length}), D = labels on career pages (${nData}), T = job titles (${titles.length}). Text in {curly braces} is filled in by the app (a number, a name or a list); keep the braces when you suggest a change.</p>`);

// Part E
P('\n## Part E: how people reach the Career Finder', '<h2>Part E: how people reach the Career Finder</h2>');
P('| ID | Where it shows | Text |\n|---|---|---|', '<table><tr><th>ID</th><th>Where it shows</th><th>Text</th></tr>');
ENTRY.forEach(([id, loc, t, w]) => P(`| ${id} | ${w} (${loc}) | ${esc(t)} |`, `<tr><td>${id}</td><td>${h(w)}<br><small>${h(loc)}</small></td><td>${h(t)}</td></tr>`));
html += '</table>\n';

// Part A
P('\n## Part A: screen text, grouped by screen', '<h2>Part A: screen text, grouped by screen</h2>');
P('A short piece next to a longer one on the same line is usually a label or a screen-reader version of the same button. Pieces on lines next to each other may be shown joined into one sentence.', '<p>A short piece next to a longer one on the same line is usually a label or a screen-reader version of the same button. Pieces on lines next to each other may be shown joined into one sentence.</p>');
const files = [...new Set(appRows.map((r) => r.file))];
for (const f of files) {
  P(`\n### ${SCREEN[f] || f}\nFile: \`${f}\``, `<h3>${h(SCREEN[f] || f)}</h3><p><small>File: ${h(f)}</small></p>`);
  P('| ID | Line | Text |\n|---|---|---|', '<table><tr><th>ID</th><th>Line</th><th>Text</th></tr>');
  appRows.filter((r) => r.file === f).forEach((r) => P(`| ${r.id} | ${r.line} | ${esc(r.text)} |`, `<tr><td>${r.id}</td><td>${r.line}</td><td>${h(r.text)}</td></tr>`));
  html += '</table>\n';
}

// Part D
P('\n## Part D: labels shown on career pages', '<h2>Part D: labels shown on career pages</h2>');
P('On each job title the app shows KIND OF ROLE (titleClass · orientation), HOW PEOPLE WORK (workModel), TYPICAL PREPARATION (preparation) and a status line ("{status}. Common pathways are described, not mandatory requirements."). Each family page shows a path line and a "where people work" line. Source: src/data/careerIndex.json and src/data/careerFamilies.json (both built by scripts/build-career-index.py from scripts/career-index-overrides.json).',
  '<p>On each job title the app shows KIND OF ROLE (titleClass · orientation), HOW PEOPLE WORK (workModel), TYPICAL PREPARATION (preparation) and a status line ("{status}. Common pathways are described, not mandatory requirements."). Each family page shows a path line and a "where people work" line. Source: src/data/careerIndex.json and src/data/careerFamilies.json (both built by scripts/build-career-index.py from scripts/career-index-overrides.json).</p>');
const groups = [...new Set(data.map((d) => d.group))];
let dn = 0;
for (const g of groups) {
  P(`\n### ${g}`, `<h3>${h(g)}</h3>`);
  P('| ID | Reference | Text |\n|---|---|---|', '<table><tr><th>ID</th><th>Reference</th><th>Text</th></tr>');
  data.filter((d) => d.group === g).forEach((d) => { const id = 'CF-D' + String(++dn).padStart(4, '0'); P(`| ${id} | ${esc(d.ref)} | ${esc(d.text)} |`, `<tr><td>${id}</td><td>${h(d.ref)}</td><td>${h(d.text)}</td></tr>`); });
  html += '</table>\n';
}

// Part T
P('\n## Part T: the job titles, by family', '<h2>Part T: the job titles, by family</h2>');
P('The ID is the title\'s own ID in the career index (AC-####). "Also called" shows on the title\'s detail.', '<p>The ID is the title\'s own ID in the career index (AC-####). "Also called" shows on the title\'s detail.</p>');
const fams = [...new Set(titles.map((t) => t.family))];
for (const fam of fams) {
  const list = titles.filter((t) => t.family === fam);
  P(`\n### ${fam} (${list.length})`, `<h3>${h(fam)} (${list.length})</h3>`);
  P('| ID | Title | Also called |\n|---|---|---|', '<table><tr><th>ID</th><th>Title</th><th>Also called</th></tr>');
  list.forEach((t) => P(`| ${t.id} | ${esc(t.title)} | ${esc(t.alt)} |`, `<tr><td>${t.id}</td><td>${h(t.title)}</td><td>${h(t.alt)}</td></tr>`));
  html += '</table>\n';
}

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Career Finder text for review</title><style>body{font:15px/1.5 system-ui,Segoe UI,sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;color:#1d1d1f;background:#fff}table{border-collapse:collapse;width:100%;margin:8px 0 20px}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f0f0f0}td:first-child{white-space:nowrap;font-family:Consolas,monospace;font-size:13px}h2{margin-top:36px;border-bottom:2px solid #333}small{color:#666}</style></head><body>\n${html}</body></html>`;
fs.writeFileSync(path.join(out, 'CAREER_FINDER_TEXT_FOR_REVIEW.md'), md);
fs.writeFileSync(path.join(out, 'CAREER_FINDER_TEXT_FOR_REVIEW.html'), page);
console.log('written; md lines', md.split('\n').length, 'data ids', dn);
