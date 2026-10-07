/**
 * Mixing Guides lab (owner 2026-10-07) — the data, the template, the wiring
 * and the release gate.
 *
 *   • DATA: 50 styles in the owner's index order, unique ids, the index and
 *     the guide files agree, every template section filled (or listed in
 *     `empty` — explicit, never silent), every table row complete, the
 *     "audience expects" line is the guide's own words.
 *   • LEARNER TEXT (owner ruling 2026-10-04): no brand or model names, no
 *     named authorities or citations, no links, no Sources section — the
 *     research stays in the owner's documents and docs/labs/mixing. Reference
 *     recordings name artists and are exempt from the brand list.
 *   • LAZY: no guide body is in the app-start graph; each loads on open.
 *   • WIRING: catalog leaf (Mixing, training, members-only), the gate
 *     predicate, typed routes, MemberGated + withMembershipPreview, the
 *     #labpreview harness; house helpers (createLocalStore, safeGoBack, the
 *     shared lab strip and what's-left screen).
 *   • RELEASE GATE: MIXING_PUBLIC is false; only dev or the preview update
 *     shows the tile.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/[^\n]*/g, '$1');
const DIR = 'src/screens/lab/mixingGuides';
const GUIDE_DIR = `${DIR}/data/guides`;

process.env.EXPO_PUBLIC_MIKING_PREVIEW = '1'; // the preview state the owner's Pixel runs

type Text = { label?: string; text: string; bullet?: boolean };
type Guide = {
  id: string;
  num: number;
  title: string;
  expects: string;
  glance: Record<string, string>;
  references: string[];
  empty: string[];
  [k: string]: unknown;
};
const { MIXING_GUIDE_INDEX } = (await import('../src/screens/lab/mixingGuides/data/index.ts')) as { MIXING_GUIDE_INDEX: { id: string; num: number; title: string; line: string; origin: string }[] };
const TYPES = await import('../src/screens/lab/mixingGuides/data/types.ts');
const { GUIDE_SECTIONS, TABLE_COLUMNS, GLANCE_ROWS, STARTING_POINTS_LINE } = TYPES as unknown as {
  GUIDE_SECTIONS: { key: string; title: string }[];
  TABLE_COLUMNS: Record<string, { key: string; label: string }[]>;
  GLANCE_ROWS: { key: string; label: string }[];
  STARTING_POINTS_LINE: string;
};
const FILES = readdirSync(join(ROOT, GUIDE_DIR)).filter((f) => f.endsWith('.ts')).sort();
const GUIDES: Guide[] = [];
for (const f of FILES) GUIDES.push(((await import(`../${GUIDE_DIR}/${f}`)) as { GUIDE: Guide }).GUIDE);

const PROSE = ['purpose', 'instruments', 'arrangement', 'dynamics', 'balance', 'vocals', 'loudness', 'notes'];
const TABLES = ['eq', 'compression', 'fx', 'liveStudio'];

/** Every string a learner reads, with where it lives. References name
 *  artists and recordings and are checked separately. */
function learnerText(g: Guide): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [{ path: 'title', text: g.title }, { path: 'expects', text: g.expects }];
  for (const [k, v] of Object.entries(g.glance)) out.push({ path: `glance.${k}`, text: v });
  for (const k of PROSE) (g[k] as Text[]).forEach((b, i) => out.push({ path: `${k}[${i}]`, text: `${b.label ?? ''} ${b.text}` }));
  for (const k of TABLES) {
    const t = g[k] as { rows: Record<string, string>[]; notes: Text[] };
    t.rows.forEach((r, i) => Object.entries(r).forEach(([c, v]) => out.push({ path: `${k}.rows[${i}].${c}`, text: v })));
    t.notes.forEach((b, i) => out.push({ path: `${k}.notes[${i}]`, text: `${b.label ?? ''} ${b.text}` }));
  }
  return out;
}

/** Brands, models, platforms and named authorities never shown to a learner
 *  (mirrors scripts/mixing-guides/flags.py, the conversion's own gate). */
const BRANDS = [
  'Shure', 'SM ?5[78]\\w*', 'SM ?7\\w*', 'Beta ?\\d+\\w*', 'KSM ?\\d*\\w*', 'Telefunken', 'M8[01]', 'DPA', 'd:facto', 'Sony', 'C-?800G?',
  'Neumann', 'U ?4[37]', 'U ?8[79]', 'U ?67', 'KMS? ?-?\\d+\\w*', 'KK ?\\d+', 'Sennheiser', 'MD ?\\d+\\w*', 'e ?9\\d\\d\\w*', 'e ?6\\d\\d',
  'AKG', 'Audix', 'D112', 'EV', 'RE ?\\d+', 'Electro-Voice', 'Coles', 'Countryman', 'Earthworks', 'Schoeps', 'Royer',
  'Melodyne\\w*', 'Auto-?Tune\\w*', 'Flex-?Tune', 'Soothe\\w*', 'Antares', 'Waves', 'iZotope', 'Neve', '1073', '1176\\w*', 'LA-?2A\\w*',
  'CL-1B', 'Fairchild\\w*', 'SSL\\w*', 'Distressor', 'Pultec\\w*', 'EMT', 'Lexicon\\w*', 'H3000\\w*', 'Eventide', 'AMS', 'Ableton',
  'Pro Tools', 'Serato', 'CDJs?', 'FL Studio', 'MPC\\w*', 'Akai', 'SP-?404\\w*', 'SP-?1200', 'S950\\w*', 'RC-20', 'Roland', 'TR-?\\d+\\w*',
  'TB-?303', 'CR-?78', 'SH-?101\\w*', 'Juno\\w*', 'Korg', 'Ketron', 'Yamaha', 'DX ?\\d+\\w*', 'PSR', 'Linn\\w*', 'Moog', 'Minimoog', 'ARP',
  'Solina', 'B-?3', 'Leslie\\w*', 'Rhodes', 'Wurlitzer', 'Clavinet', 'Mellotron', 'Farfisa', 'Vox', 'Fender', 'Telecasters?',
  'Tele', 'Strat\\w*', 'Jazzmasters?', 'Rickenbacker', 'Gibson', 'ES-335', 'Les Paul', 'Bassman', 'JC-?120', 'Marshall\\w*', 'Ampeg\\w*',
  'SansAmp\\w*', 'Big Muff', 'P-bass', 'Dobro', 'Hohner', 'Fishman', 'DiGiCo', 'RIVAGE', 'Axient', 'L-Acoustics', 'L-ISA', 'Meyer',
  'd&b', 'TiMax', 'KLANG', 'Spotify\\w*', 'YouTube\\w*', 'Apple(?: Music)?', 'Tidal', 'Amazon', 'Anghami', 'SoundCloud', 'TikTok',
  'WhatsApp', 'Netflix', 'Bluetooth', 'Atmos', 'Dolby', 'MultiTracks\\w*', 'Loop Community', 'WHO', 'NIOSH', 'OSHA', 'AES', 'AAO-HNS',
  'EBU', 'ARIB', 'DIN', 'NHK', 'Sound On Sound', 'Mix magazine', 'ProSoundWeb', 'Luminate', 'IFPI',
];
const BRAND_RE = new RegExp(`(?<![\\w-])(?:${BRANDS.join('|')})(?![\\w])`);
/** Citation voice and the source list the ruling took off the screen. */
const CITATION_FORMS: readonly RegExp[] = [
  /\baccording to\b/i,
  /\bput it\b/i,
  /\b(?:engineers?|mixers?|producers?|designers?) (?:have )?(?:reported|reports|says?|said|recommends?|warns?|describes?|cites?)\b/i,
  /\b(?:a|one) (?:\d{4} )?(?:study|survey|analysis|report) (?:found|shows?|of)\b/i,
  /\bper [A-Z]\w+/,
  /https?:\/\//,
  /\bSources?\b:/,
  /\bFOH engineer [A-Z]/,
];
/** Engineers, designers and publications named in the owner's research
 *  (removed in the conversion — they must not come back). */
const NAMED_AUTHORITIES = /\b(Ghenea|Marroquin|Gudwin|Firkins|Ernster|Elmhirst|Meyerson|Capouillez|Potter|Latham|Germain|Sheppell|Bedoya|Ayerbe|Goldberg|Sanour|Mutt Lange|Martin Stokes|Gabriel Roth|Kerri Chandler|Stevens)\b/;

describe('data: 50 styles on one template', () => {
  it('50 guides, in the owner’s index order, ids unique and kebab-case', () => {
    assert.equal(MIXING_GUIDE_INDEX.length, 50);
    assert.equal(GUIDES.length, 50);
    assert.deepEqual(MIXING_GUIDE_INDEX.map((e) => e.num), Array.from({ length: 50 }, (_, i) => i + 1));
    assert.equal(new Set(MIXING_GUIDE_INDEX.map((e) => e.id)).size, 50);
    for (const e of MIXING_GUIDE_INDEX) assert.match(e.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(MIXING_GUIDE_INDEX[0].title, 'Pop');
    assert.equal(MIXING_GUIDE_INDEX[49].title, 'French Variété / Chanson');
  });
  it('the index and the guide files agree (id, number, title, priority line, origin)', () => {
    for (const [i, e] of MIXING_GUIDE_INDEX.entries()) {
      const g = GUIDES[i];
      assert.equal(FILES[i], `g${String(e.num).padStart(2, '0')}-${e.id}.ts`);
      assert.equal(g.id, e.id);
      assert.equal(g.num, e.num);
      assert.equal(g.title, e.title);
      assert.equal(g.glance.priority, e.line);
      assert.equal(g.glance.origin, e.origin);
    }
  });
  it('the template: thirteen sections in the owner’s order, six glance rows, four tables with their columns', () => {
    assert.deepEqual(GUIDE_SECTIONS.map((s) => s.key), [...PROSE.slice(0, 5), 'eq', 'compression', 'fx', 'vocals', 'loudness', 'liveStudio', 'notes', 'references']);
    assert.deepEqual(GLANCE_ROWS.map((r) => r.key), ['origin', 'tempo', 'ensemble', 'priority', 'liveSpl', 'studioLoudness']);
    assert.deepEqual(Object.keys(TABLE_COLUMNS), TABLES);
    assert.match(STARTING_POINTS_LINE, /^Starting points, not rules\./);
    assert.match(STARTING_POINTS_LINE, /reference track/);
    assert.match(STARTING_POINTS_LINE, /listen and adjust/);
  });
  it('every section is filled, or EXPLICITLY empty (listed in `empty`) — never silently missing', () => {
    for (const g of GUIDES) {
      const isEmpty = (k: string) => (k === 'references' ? g.references.length === 0 : TABLES.includes(k) ? (g[k] as { rows: unknown[] }).rows.length === 0 : (g[k] as unknown[]).length === 0);
      for (const s of GUIDE_SECTIONS) {
        assert.equal(isEmpty(s.key), g.empty.includes(s.key), `${g.id}.${s.key}: ${isEmpty(s.key) ? 'empty but not listed' : 'listed empty but filled'}`);
      }
      for (const r of GLANCE_ROWS) assert.ok(g.glance[r.key]?.trim(), `${g.id}: glance ${r.key}`);
    }
  });
  it('every table row has every column, and every prose item has words', () => {
    for (const g of GUIDES) {
      for (const k of TABLES) {
        const cols = TABLE_COLUMNS[k].map((c) => c.key);
        for (const [i, r] of (g[k] as { rows: Record<string, string>[] }).rows.entries()) {
          assert.deepEqual(Object.keys(r), cols, `${g.id}.${k}[${i}] columns`);
          for (const c of cols) assert.ok(r[c].trim().length > 0, `${g.id}.${k}[${i}].${c} is blank`);
        }
      }
      for (const k of PROSE) for (const b of g[k] as Text[]) assert.ok(b.text.trim().length > 0 || b.label, `${g.id}.${k}: an empty item`);
      for (const r of g.references) assert.ok(r.trim().length > 3, `${g.id}: a blank reference`);
    }
  });
  it('the "what the audience expects" line is the guide’s own section 1, short enough to lead the page', () => {
    for (const g of GUIDES) {
      assert.ok(g.expects.length > 30 && g.expects.length < 320, `${g.id}: expects is ${g.expects.length} chars`);
      const purpose = (g.purpose as Text[]).map((b) => b.text).join(' ');
      // One assembled line (French chanson) is built from the section's own phrases.
      if (g.id !== 'french-variete-chanson') assert.ok(purpose.includes(g.expects), `${g.id}: expects is a sentence of section 1`);
    }
  });
  it('loudness reads as Live, then Studio / streaming, when the guide gives both', () => {
    let both = 0;
    for (const g of GUIDES) {
      const labels = (g.loudness as Text[]).map((b) => b.label);
      if (labels.includes('Studio / streaming:')) {
        both++;
        assert.ok(labels.indexOf('Live:') < labels.indexOf('Studio / streaming:'), `${g.id}: Live first`);
      }
    }
    assert.ok(both >= 45, `${both} guides split live / studio`);
  });
});

describe('learner text (owner ruling 2026-10-04: starting points; no brands, no citations)', () => {
  it('no brand, model, platform or named authority anywhere a learner reads (references excepted)', () => {
    const bad: string[] = [];
    for (const g of GUIDES) for (const { path, text } of learnerText(g)) {
      const m = text.match(BRAND_RE);
      if (m) bad.push(`${g.id}.${path}: "${m[0]}" in "${text.slice(0, 90)}"`);
      const n = text.match(NAMED_AUTHORITIES);
      if (n) bad.push(`${g.id}.${path}: named authority "${n[0]}"`);
    }
    assert.deepEqual(bad, []);
  });
  it('no citation voice, no links, no Sources section', () => {
    const bad: string[] = [];
    for (const g of GUIDES) {
      assert.ok(!('sources' in g), `${g.id} carries no sources`);
      for (const { path, text } of learnerText(g)) for (const re of CITATION_FORMS) if (re.test(text)) bad.push(`${g.id}.${path}: ${re}`);
      for (const r of g.references) assert.doesNotMatch(r, /https?:\/\//);
    }
    assert.deepEqual(bad, []);
  });
  it('reference recordings carry no record-label credits', () => {
    for (const g of GUIDES) for (const r of g.references) assert.doesNotMatch(r, /\((?:Decca|RCA[^)]*|BIS)[^)]*\)/, `${g.id}: ${r}`);
  });
  it('the screens’ own words name no brand and carry the starting-points line', () => {
    for (const f of ['MixingGuidesHubScreen.tsx', 'MixingGuideScreen.tsx']) {
      const s = strip(read(`${DIR}/${f}`));
      const words = [...s.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(' ') + [...s.matchAll(/'([^'\n]{12,})'/g)].map((m) => m[1]).join(' ');
      assert.doesNotMatch(words, BRAND_RE, f);
      assert.match(s, /STARTING_POINTS_LINE/, `${f} shows the starting-points line`);
    }
  });
});

describe('lazy: guide bodies stay out of app start; each loads on open', () => {
  /** The eagerGraph walk of test/perfStartTrim_20261004 (static, non-type imports). */
  function eagerClosure(entry: string): Set<string> {
    const EXTS = ['.tsx', '.ts', '.js', '.jsx', '.json'];
    const resolveFile = (fromAbs: string, spec: string): string | null => {
      const base = resolve(dirname(fromAbs), spec);
      if (existsSync(base) && statSync(base).isFile()) return base;
      for (const e of EXTS) if (existsSync(base + e)) return base + e;
      for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
      return null;
    };
    const seen = new Set<string>();
    const walk = (abs: string) => {
      if (seen.has(abs)) return;
      seen.add(abs);
      if (abs.endsWith('.json')) return;
      const src = readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
        if (!m[1].startsWith('.')) continue;
        const r = resolveFile(abs, m[1]);
        if (r) walk(r);
      }
    };
    walk(join(ROOT, entry));
    return new Set([...seen].map((a) => relative(ROOT, a).split('\\').join('/')));
  }
  const start = eagerClosure('App.tsx');
  it('nothing of the lab reaches the start graph — no index, no guide body, no screen', () => {
    const ours = [...start].filter((f) => f.startsWith(DIR));
    assert.deepEqual(ours, []);
    assert.ok(start.size <= 260, `start graph is ${start.size} modules (cap 260)`);
  });
  it('the loader requires each guide inside a function, one per index entry', () => {
    const load = read(`${DIR}/data/load.ts`);
    for (const [i, e] of MIXING_GUIDE_INDEX.entries()) {
      assert.ok(load.includes(`'${e.id}': () => (require('./guides/${FILES[i].replace(/\.ts$/, '')}') as { GUIDE: MixingGuide }).GUIDE,`), `${e.id} has a lazy loader`);
    }
    assert.doesNotMatch(strip(load), /^import (?!type)/m, 'no static import of a guide');
  });
});

describe('progress: read only grows (lab-local, createLocalStore)', async () => {
  const R = await import('../src/screens/lab/mixingGuides/readRecord.ts');
  it('sanitize drops junk; merge is a union; marking twice is a no-op', () => {
    assert.deepEqual(R.sanitizeGuidesRead({ read: ['pop', 'pop', 7, 'Bad Id', 'k-pop'] }), { v: 1, read: ['pop', 'k-pop'] });
    assert.deepEqual(R.sanitizeGuidesRead(null), { v: 1, read: [] });
    assert.deepEqual(R.mergeGuidesRead({ v: 1, read: ['pop'] }, { v: 1, read: ['rock', 'pop'] }).read, ['pop', 'rock']);
    const a = { v: 1 as const, read: ['pop'] };
    assert.equal(R.withRead(a, 'pop'), a);
    assert.deepEqual(R.withRead(a, 'jazz').read, ['pop', 'jazz']);
  });
  it('the store is on createLocalStore, holds a guest’s reading for sign-in, and a preview earns nothing', () => {
    const s = strip(read(`${DIR}/readProgress.ts`));
    assert.match(s, /createLocalStore<GuidesRead>\(\{\s*key: MIXING_GUIDES_KEY,/);
    assert.match(s, /export const MIXING_GUIDES_KEY = 'ape:mixingGuides:v1';/);
    assert.match(s, /if \(getLabPreview\(\)\.active\) return Promise\.resolve\(false\);/);
    assert.match(s, /holdSessionWork<GuidesRead>\(/);
    assert.match(s, /registerSessionCarry<GuidesRead>\(/);
    assert.doesNotMatch(s, /AsyncStorage/);
  });
});

const { LAB_CATEGORIES, isMemberOnlyLabRoute, labRouteName, MIXING_PUBLIC } = (await import('../src/screens/lab/labCatalog.ts')) as unknown as {
  LAB_CATEGORIES: { id: string; section: string; labs?: { name: string; route?: string; member?: boolean; countLine?: string }[] }[];
  isMemberOnlyLabRoute: (r: string) => boolean;
  labRouteName: (r: string) => string | undefined;
  MIXING_PUBLIC: boolean;
};

describe('wiring (Training Labs → Mixing, members only)', () => {
  it('one "Mixing Guides" tile in the training-section Mixing category, members-only', () => {
    const cat = LAB_CATEGORIES.find((c) => c.id === 'mixingworkflow')!;
    assert.equal(cat.section, 'training');
    const leaf = cat.labs!.filter((l) => l.route === 'MixingGuides');
    assert.equal(leaf.length, 1);
    assert.equal(leaf[0].name, 'Mixing Guides');
    assert.equal(leaf[0].member, true);
    assert.equal(leaf[0].countLine, undefined, 'no count line: the index stays out of the start graph');
  });
  it('THE PREDICATE AGREES: both routes are members-only to the gate, and named for the sheet', () => {
    assert.equal(isMemberOnlyLabRoute('MixingGuides'), true);
    assert.equal(isMemberOnlyLabRoute('MixingGuide'), true);
    assert.equal(labRouteName('MixingGuides'), 'Mixing Guides');
    assert.equal(labRouteName('MixingGuide'), 'Mixing Guides');
    assert.match(read('src/screens/lab/labCatalog.ts'), /MixingGuides: 'Mixing Guides',\n\s*MixingGuide: 'Mixing Guides',/);
  });
  it('both routes go through MemberGated + withMembershipPreview, lazily; typed; in the preview harness', () => {
    const nav = strip(read('src/navigation/RootNavigator.tsx'));
    assert.match(nav, /MixingGuides: lazyScreen\(\(\) => withMembershipPreview\(require\('\.\.\/screens\/lab\/mixingGuides\/MixingGuidesHubScreen'\)\.MixingGuidesHubScreen\)\)/);
    assert.match(nav, /MixingGuide: lazyScreen\(\(\) => withMembershipPreview\(require\('\.\.\/screens\/lab\/mixingGuides\/MixingGuideScreen'\)\.MixingGuideScreen\)\)/);
    assert.match(nav, /<Stack\.Screen name="MixingGuides" getComponent=\{MemberGated\.MixingGuides\} \/>/);
    assert.match(nav, /<Stack\.Screen name="MixingGuide" getComponent=\{MemberGated\.MixingGuide\} \/>/);
    const types = read('src/navigation/types.ts');
    assert.match(types, /MixingGuides: undefined;/);
    assert.match(types, /MixingGuide: \{ id: string \};/);
    const web = read('src/dev/webPreviews.tsx');
    assert.match(web, /MixingGuides: MixingGuidesHubScreen as ComponentType,/);
    assert.match(web, /MixingGuide: MixingGuideScreen as ComponentType,/);
    for (const r of ['MixingGuides', 'MixingGuide']) assert.doesNotMatch(r, /Lab$/, 'silent: out of the audio exposure check-in');
  });
  it('the hub is the shared glass push-button grid with a filter; the guide runs on the shared strip and ends on what’s left', () => {
    const hub = strip(read(`${DIR}/MixingGuidesHubScreen.tsx`));
    assert.match(hub, /import \{ GlassPanel, GlassTile \} from '\.\.\/\.\.\/tools\/GlassTile';/);
    assert.match(hub, /tileStyle=\{tablet \? tabletTile : styles\.tileHalf\}/);
    assert.match(hub, /tileHalf: \{ width: '48\.5%' \}/);
    assert.match(hub, /filterGuides\(MIXING_GUIDE_INDEX, deferredQuery\)/);
    assert.match(hub, /<ProgressUnreadableNote\b/);
    assert.match(hub, /readCountLine\(readCount, total\)/);
    const host = strip(read(`${DIR}/MixingGuideScreen.tsx`));
    assert.match(host, /useLabNav\(/);
    assert.match(host, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(host, /<LabEndScreen\b/);
    assert.match(host, /mode="progress"/);
    assert.match(host, /noun="guide"/);
    assert.match(host, /setGuidesSaveBlocked\(!persistAllowed\(tier\)\)/);
    assert.match(host, /loadGuide\(entry\.id\)/);
    assert.match(host, /readingColumn/);
    assert.match(host, /<AccuracyNote compact detail=\{ACCURACY_DETAIL\} \/>/);
  });
  it('house helpers: safeGoBack only, no raw Alert.alert, no direct AsyncStorage, no audio path', () => {
    for (const f of readdirSync(join(ROOT, DIR)).filter((x) => /\.tsx?$/.test(x))) {
      const s = strip(read(`${DIR}/${f}`));
      assert.doesNotMatch(s, /navigation\.goBack\(\)/, f);
      assert.doesNotMatch(s, /Alert\.alert\(/, f);
      assert.doesNotMatch(s, /AsyncStorage/, f);
      assert.doesNotMatch(s, /from '[^']*(features\/audio|startFenced|expo-audio|LabAudioPlayer|useLabAudio)[^']*'/, f);
    }
  });
});

describe('release gate (owner 2026-10-07: hidden on store builds until approved, as Miking)', () => {
  it('MIXING_PUBLIC is false; only dev or the preview update shows the tile', () => {
    assert.equal(MIXING_PUBLIC, false);
    const src = read('src/screens/lab/labCatalog.ts');
    assert.match(src, /export const MIXING_PUBLIC = false;/);
    assert.match(src, /export function mixingGuidesVisible\(\): boolean \{\s*return \(\s*MIXING_PUBLIC \|\|\s*\(typeof __DEV__ !== 'undefined' && __DEV__\) \|\|\s*process\.env\.EXPO_PUBLIC_MIKING_PREVIEW === '1'\s*\);\s*\}/);
    assert.match(src, /\.\.\.\(mixingGuidesVisible\(\)\s*\? \[\{ name: 'Mixing Guides',/);
  });
});
