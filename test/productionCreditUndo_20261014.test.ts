/**
 * Owner ruling 2026-10-14, #18 — Production (Pre/Post) labs:
 *   • practice / exercise projects never count toward Pre/Post-Production credit;
 *   • an answer that failed to save never counts (credit reads the STORED copy);
 *   • finishing the last item on the lab home reports credit at once;
 *   • a removed table row gets an UNDO (inline, the field's N/A UNDO style).
 * Banked credit is never removed (nothing here un-reports a key).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { productionProjectComplete } = await import('../src/features/production/complete.ts');
const { isActivityProject } = await import('../src/features/production/activities.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');
const { labDef } = await import('../src/features/production/labs.ts');
const { resolveLab, stageFields } = await import('../src/features/production/schema.ts');
const { valueKey } = await import('../src/features/production/types.ts');
type ProductionProject = import('../src/features/production/types.ts').ProductionProject;

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

/** Stage 1 answered (productionEngine.test's fixture), every other stage
 *  wholly NOT APPLICABLE with a reason — a well-filled plan (the rules still
 *  raise attention items on it, so it is not itself complete). */
function completeOwnProject(): ProductionProject {
  const future = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
  const p: ProductionProject = {
    ...newProject('preprod', 'music', 'Test'),
    values: {
      'define.project_name': 'Northgate Sessions',
      'define.project_lead': 'Dana Okonkwo',
      'define.purpose': 'A four-song release to open the autumn tour and give the band something to sell at the merch table.',
      'define.audience': 'Existing fans on streaming, plus people who see the band live for the first time this autumn.',
      'define.creative_objective': 'The room should feel small and close, as if the listener is standing by the piano.',
      'define.platform': ['streaming_music'],
      'define.size_estimate': 4,
      'define.target_date': future,
      'define.approver': 'Dana Okonkwo',
      'define.success_definition': 'All four masters accepted by the band and live on streaming before the first tour date.',
      'define.services': ['recording', 'mixing'],
      'define.performer_count': 5,
      'define.source_count': 12,
      'define.location_count': 1,
      'define.format': 'stereo',
      'define.revisions_included': 2,
      'define.archive_plan': 'both',
      'define.style': 'Indie folk, sparse, mostly live takes',
      'define.tone_mood': 'Warm and close, unhurried, with room for the voice to sit forward.',
    },
  };
  const na: Record<string, string> = {};
  for (const s of resolveLab(labDef('preprod').stages, p.pathway, p.values)) {
    if (s.stageId === 'define') continue;
    for (const f of stageFields(s)) na[valueKey(s.stageId, f.fieldId)] = 'Not part of this test project.';
  }
  return { ...p, na };
}

describe('#18 practice projects never count', () => {
  it('an exercise is recognised; the learner’s own project is not', () => {
    assert.equal(isActivityProject(newProject('preprod', 'music', 'Mine')), false);
    assert.equal(isActivityProject({ ...newProject('preprod', 'music', 'Ex'), scenarioId: 'repair_vague_brief' }), true);
  });
  it('a project flagged as an exercise (scenarioId) never counts, whatever its answers', () => {
    assert.equal(productionProjectComplete('preprod', { ...completeOwnProject(), scenarioId: 'repair_vague_brief' }), false);
    assert.equal(productionProjectComplete('postprod', { ...newProject('postprod', 'music', 'Ex'), scenarioId: 'x' }), false);
  });
  it('complete.ts refuses an activity project before anything else', () => {
    const src = read('src/features/production/complete.ts');
    assert.match(src, /if \(isActivityProject\(project\)\) return false;/);
  });
});

describe('#18 a failed save never counts; the lab home reports at once', () => {
  const stage = read('src/screens/lab/production/ProductionStageScreen.tsx');
  it('the stage screen credits from the STORED copy, never the optimistic one', () => {
    assert.match(stage, /if \(storedProject && productionProjectComplete\(lab, storedProject\)\) reportTrainingComplete\(trainingKeyFor\(lab === 'preprod' \? 'PreProdLab' : 'PostProdLab'\)\);\n  \}, \[lab, storedProject\]\);/);
    // The optimistic edit never touches storedProject; only reads and write RESULTS do.
    const setValue = stage.slice(stage.indexOf('const setValue = useCallback('), stage.indexOf('const setNa = useCallback('));
    assert.match(setValue, /setProject\(\(cur\) => \(cur \? \{ \.\.\.cur, values:/);
    assert.match(setValue, /if \(saved\) setStoredProject\(saved\);/);
    assert.doesNotMatch(setValue, /setStoredProject\(\(cur\)/);
  });
  it('the lab home reports from its stored read, own projects only', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    const reload = home.slice(home.indexOf('const reload = useCallback('), home.indexOf('useFocusEffect('));
    assert.match(reload, /const own = list\.filter\(\(p\) => !isActivityProject\(p\)\);/);
    assert.match(reload, /if \(own\.some\(\(p\) => productionProjectComplete\(lab, p\)\)\) reportTrainingComplete\(trainingKeyFor\(lab === 'preprod' \? 'PreProdLab' : 'PostProdLab'\)\);/);
    // An accepted condition (the last item done on the home) reloads → reports.
    const accept = home.slice(home.indexOf('const acceptCondition = useCallback('));
    assert.match(accept, /setAccepting\(null\);\s*await reload\(\);/);
  });
});

describe('#18 a removed table row can be put back', () => {
  const src = read('src/screens/lab/production/FieldRow.tsx');
  it('restoreTableRow puts the row back where it was (clamped)', () => {
    // The pure helper, run as written (no React needed).
    const body = src.slice(src.indexOf('export function restoreTableRow'), src.indexOf('function TableEditor('));
    const js = body
      .replace(/export function restoreTableRow\(rows: readonly TableRow\[\], row: TableRow, index: number\): TableRow\[\]/, 'function restoreTableRow(rows, row, index)')
      .replace(/\/\*\*[\s\S]*?\*\//g, '');
    const restore = new Function(`${js}; return restoreTableRow;`)() as (r: unknown[], row: unknown, i: number) => unknown[];
    assert.deepEqual(restore(['a', 'c'], 'b', 1), ['a', 'b', 'c']);
    assert.deepEqual(restore(['a'], 'z', 5), ['a', 'z'], 'rows gone since → the end');
    assert.deepEqual(restore([], 'z', 0), ['z']);
  });
  it('✕ remembers the row and an inline UNDO restores it', () => {
    const editor = src.slice(src.indexOf('function TableEditor('));
    assert.match(editor, /onChange\(rows\.filter\(\(_, n\) => n !== i\)\);\s*setRemoved\(\{ row, index: i \}\);/);
    assert.match(editor, /onChange\(restoreTableRow\(rows, removed\.row, removed\.index\)\);/);
    assert.match(editor, /<Text style=\{styles\.naUndo\}>UNDO<\/Text>/);
  });
});
