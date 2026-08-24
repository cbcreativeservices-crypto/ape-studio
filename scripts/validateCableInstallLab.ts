/**
 * validateCableInstallLab — data-integrity validation for the Cable Dressing &
 * Installation lab (the house substitute for tests; mirror of
 * validateCableLab.ts). Dependency-free; throws with the full violation list.
 *
 *   npx tsx scripts/validateCableInstallLab.ts
 *
 * Checks:
 *  - every rule id unique; every rule's sourceRefs resolve in the registry
 *  - every mistake's ruleId resolves; mistake ids unique
 *  - scenario data cross-references (route flags → rules; rack issues,
 *    ceiling + inspection defects → mistakes; myths + quiz ruleIds → rules)
 *  - quiz items: correctIdx in range, ≥3 options, unique ids
 *  - inspection pool ≥ draw max; zones in range
 *  - registry units unique + include every module unit + the 2 extra units
 *  - no rule text smuggles a universal numeric requirement (rules with digits
 *    must be flagged numericValueIsScenarioSpecific or be jurisdiction/scope
 *    statements — heuristic guard for spec §29)
 */
import { CI_RULES, ruleById } from '../src/screens/lab/cableinstall/data/rules';
import { CI_SOURCES, sourceById } from '../src/screens/lab/cableinstall/data/sources';
import { CI_MISTAKES, mistakeById } from '../src/screens/lab/cableinstall/data/mistakes';
import {
  CI_BEND_EXERCISES,
  CI_CEILING_DEFECTS,
  CI_FIRE_SPACES,
  CI_FLOOR_SCENARIOS,
  CI_ID_SCENARIOS,
  CI_INSPECTION_DRAW,
  CI_INSPECTION_POOL,
  CI_MYTHS,
  CI_QUIZ_BANK,
  CI_QUIZ_DRAW,
  CI_RACK_GROUPS,
  CI_RACK_ISSUES,
  CI_RACK_ZONES,
  CI_ROUTE_SCENARIOS,
  CI_SUPPORT_ITEMS,
  CI_WALL_TYPES,
} from '../src/screens/lab/cableinstall/data/scenarios';
import { CI_LAB_UNITS, CI_MODULES } from '../src/screens/lab/cableinstall/registry';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// ── rules & sources ─────────────────────────────────────────────────────────
const ruleIds = new Set<string>();
for (const r of CI_RULES) {
  if (ruleIds.has(r.id)) err(`duplicate rule id: ${r.id}`);
  ruleIds.add(r.id);
  if (!r.sourceRefs.length) err(`rule ${r.id}: no sourceRefs`);
  for (const s of r.sourceRefs) if (!sourceById(s)) err(`rule ${r.id}: unknown source '${s}'`);
  if (!r.studentText || !r.whyText) err(`rule ${r.id}: missing student/why text`);
  // §29 guard: digits in student text require the scenario-specific flag or a
  // clearly scoped statement (heuristic — reviewed by hand as well).
  if (/\b\d+(\.\d+)?\s*(×|x|%|ft|feet|in|inch|mm|cm|m|lb|kg|deg|°)/i.test(r.studentText) && !r.numericValueIsScenarioSpecific) {
    err(`rule ${r.id}: numeric in studentText without numericValueIsScenarioSpecific`);
  }
}
const srcIds = new Set<string>();
for (const s of CI_SOURCES) {
  if (srcIds.has(s.id)) err(`duplicate source id: ${s.id}`);
  srcIds.add(s.id);
}

// ── mistakes ────────────────────────────────────────────────────────────────
const mIds = new Set<string>();
for (const m of CI_MISTAKES) {
  if (mIds.has(m.id)) err(`duplicate mistake id: ${m.id}`);
  mIds.add(m.id);
  if (!ruleById(m.ruleId)) err(`mistake ${m.id}: unknown rule '${m.ruleId}'`);
}

// ── scenarios ───────────────────────────────────────────────────────────────
for (const sc of [...CI_ROUTE_SCENARIOS, ...CI_FLOOR_SCENARIOS]) {
  if (sc.options.length < 2) err(`route scenario ${sc.id}: needs ≥2 options`);
  for (const o of sc.options)
    for (const f of o.flags) if (!ruleById(f.ruleId)) err(`route ${sc.id}/${o.id}: unknown rule '${f.ruleId}'`);
}
for (const s of CI_ID_SCENARIOS) {
  if (!s.pathwayOptions.includes(s.pathway)) err(`id scenario ${s.id}: pathway not among options`);
  if (!s.keyRiskOptions.includes(s.keyRisk)) err(`id scenario ${s.id}: keyRisk not among options`);
}
for (const b of CI_BEND_EXERCISES) if (b.minRadiusDia <= 0) err(`bend ${b.id}: bad radius`);
for (const i of CI_RACK_ISSUES) if (!mistakeById(i.mistakeId)) err(`rack issue ${i.id}: unknown mistake '${i.mistakeId}'`);
for (const g of CI_RACK_GROUPS) if (!CI_RACK_ZONES.some((z) => z.id === g.zoneId)) err(`rack group ${g.id}: unknown zone '${g.zoneId}'`);
for (const d of CI_CEILING_DEFECTS) if (!mistakeById(d.mistakeId)) err(`ceiling defect ${d.id}: unknown mistake '${d.mistakeId}'`);
for (const w of CI_WALL_TYPES) if (!w.actions.includes(w.correctAction)) err(`wall ${w.id}: correctAction not among actions`);
for (const f of CI_FIRE_SPACES) {
  if (f.correctIdx < 0 || f.correctIdx >= f.options.length) err(`fire space ${f.id}: correctIdx out of range`);
  if (!ruleById(f.ruleId)) err(`fire space ${f.id}: unknown rule '${f.ruleId}'`);
}
for (const d of CI_INSPECTION_POOL) {
  if (!mistakeById(d.mistakeId)) err(`inspection ${d.id}: unknown mistake '${d.mistakeId}'`);
  if (d.zone < 0 || d.zone > 5) err(`inspection ${d.id}: zone out of range`);
  if (d.x < 0 || d.x > 100 || d.y < 0 || d.y > 100) err(`inspection ${d.id}: position out of range`);
}
if (CI_INSPECTION_POOL.length < CI_INSPECTION_DRAW.max) err('inspection pool smaller than max draw');
if (CI_INSPECTION_DRAW.min > CI_INSPECTION_DRAW.max) err('inspection draw min > max');

// ── myths & quiz ────────────────────────────────────────────────────────────
const mythIds = new Set<string>();
for (const m of CI_MYTHS) {
  if (mythIds.has(m.id)) err(`duplicate myth id: ${m.id}`);
  mythIds.add(m.id);
  if (m.ruleId && !ruleById(m.ruleId)) err(`myth ${m.id}: unknown rule '${m.ruleId}'`);
}
const qIds = new Set<string>();
for (const q of CI_QUIZ_BANK) {
  if (qIds.has(q.id)) err(`duplicate quiz id: ${q.id}`);
  qIds.add(q.id);
  if (q.options.length < 3) err(`quiz ${q.id}: needs ≥3 options`);
  if (q.correctIdx < 0 || q.correctIdx >= q.options.length) err(`quiz ${q.id}: correctIdx out of range`);
  if (q.ruleId && !ruleById(q.ruleId)) err(`quiz ${q.id}: unknown rule '${q.ruleId}'`);
}
if (CI_QUIZ_BANK.length < CI_QUIZ_DRAW) err('quiz bank smaller than the draw');

// ── registry units ──────────────────────────────────────────────────────────
const unitSet = new Set(CI_LAB_UNITS);
if (unitSet.size !== CI_LAB_UNITS.length) err('duplicate unit ids in CI_LAB_UNITS');
for (const m of CI_MODULES) if (!unitSet.has(m.unit)) err(`module ${m.id}: unit '${m.unit}' missing from CI_LAB_UNITS`);
if (!unitSet.has('inspect_pass') || !unitSet.has('final_check')) err('extra units missing from CI_LAB_UNITS');

// ── verdict ─────────────────────────────────────────────────────────────────
if (errors.length) {
  console.error(`validateCableInstallLab: ${errors.length} violation(s)`);
  for (const e of errors) console.error('  - ' + e);
  throw new Error('cable install lab data invalid');
}
console.log(
  `validateCableInstallLab OK — ${CI_RULES.length} rules, ${CI_SOURCES.length} sources, ${CI_MISTAKES.length} mistakes, ` +
    `${CI_INSPECTION_POOL.length} inspection defects, ${CI_QUIZ_BANK.length} quiz items, ${CI_MYTHS.length} myths, ${CI_LAB_UNITS.length} units.`,
);
