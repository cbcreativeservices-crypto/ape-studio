/**
 * validateCableLab — standalone data-integrity validation for the Cable &
 * Connector Fundamentals Lab (owner spec §14 targeted tests; the repo has no
 * test runner by design, so this is a dependency-free script).
 *
 * Run from the project root:  npx tsx scripts/validateCableLab.ts
 * Fails by THROWING (non-zero exit) with every violation listed.
 *
 * Checks:
 *  1. Connector registry: 48 unique ids, required fields present, every
 *     contact ink is a real ConnectorInk, qualified-person coherence,
 *     cross-references (otherId, relatedLessons) resolve.
 *  2. Completion units: CABLE_UNITS is exactly lessons(9) + tester +
 *     challenges(2) + SAFETY_UNITS(7) + final, no duplicates.
 *  3. Every exercise dataset (all lesson data modules, generically
 *     introspected): any record with {options, correct} has correct ∈ options
 *     and accept ⊆ options; ids unique per array.
 *  4. Lesson 12 safety-question units exactly match SAFETY_UNITS.
 *  5. Tester cables: dispositions valid, fault answers present in options.
 */
import { CONNECTORS } from '../src/screens/lab/cable/data/registry';
import { CONNECTOR_INKS } from '../src/screens/lab/cable/connectorInks';
import {
  CHALLENGE_A_UNIT,
  CHALLENGE_B_UNIT,
  FINAL_UNIT,
  SAFETY_UNITS,
  TESTER_UNIT,
} from '../src/screens/lab/cable/cableTypes';
import { CABLE_LESSONS, CABLE_UNITS } from '../src/screens/lab/cable/data/lessons';
import * as L01 from '../src/screens/lab/cable/data/lesson01';
import * as L02 from '../src/screens/lab/cable/data/lesson02';
import * as L03 from '../src/screens/lab/cable/data/lesson03';
import * as L04 from '../src/screens/lab/cable/data/lesson04';
import * as L05 from '../src/screens/lab/cable/data/lesson05';
import * as L06 from '../src/screens/lab/cable/data/lesson06';
import * as L07 from '../src/screens/lab/cable/data/lesson07';
import * as L08 from '../src/screens/lab/cable/data/lesson08';
import * as L09 from '../src/screens/lab/cable/data/lesson09';
import * as L11 from '../src/screens/lab/cable/data/lesson11';
import * as L12 from '../src/screens/lab/cable/data/lesson12';
import * as TESTER from '../src/screens/lab/cable/data/testerCables';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// ── 1. connector registry ────────────────────────────────────────────────────
const ids = new Set<string>();
for (const c of CONNECTORS) {
  if (ids.has(c.id)) err(`duplicate connector id: ${c.id}`);
  ids.add(c.id);
  if (!c.displayName) err(`${c.id}: empty displayName`);
  if (!c.carried.length) err(`${c.id}: empty carried[]`);
  if (!c.typicalSources.length || !c.typicalDestinations.length) err(`${c.id}: empty sources/destinations`);
  if (!c.advantages.length || !c.limitations.length) err(`${c.id}: empty advantages/limitations`);
  if (!c.inspectionPoints.length) err(`${c.id}: empty inspectionPoints`);
  if (!c.basicTest) err(`${c.id}: empty basicTest`);
  if (!c.sourceNotes.length) err(`${c.id}: empty sourceNotes (audit trail required)`);
  for (const v of c.pinouts) {
    for (const p of v.contacts) {
      if (!(p.ink in CONNECTOR_INKS)) err(`${c.id}/${v.id}: unknown ink '${p.ink}' on contact ${p.label}`);
    }
    if (v.confidence !== 'standard' && !v.verifyAgainst) {
      err(`${c.id}/${v.id}: confidence '${v.confidence}' requires verifyAgainst`);
    }
  }
  for (const n of c.notInterchangeableWith) {
    if (n.otherId && !CONNECTORS.some((o) => o.id === n.otherId)) err(`${c.id}: otherId '${n.otherId}' unresolved`);
  }
  const lessonIds = new Set(CABLE_LESSONS.map((l) => l.id));
  for (const rl of c.relatedLessons) if (!lessonIds.has(rl)) err(`${c.id}: relatedLessons '${rl}' unknown`);
  if (c.tier === 'qualified-person' && !c.safety.qualifiedPersonOnly) {
    err(`${c.id}: qualified-person tier without safety.qualifiedPersonOnly`);
  }
}
if (CONNECTORS.length !== 48) err(`expected 48 connectors, found ${CONNECTORS.length}`);

// ── 2. completion units ─────────────────────────────────────────────────────
const expectedUnits = [
  ...CABLE_LESSONS.filter((l) => l.unit != null).map((l) => l.unit as string),
  TESTER_UNIT,
  CHALLENGE_A_UNIT,
  CHALLENGE_B_UNIT,
  ...SAFETY_UNITS,
  FINAL_UNIT,
];
if (CABLE_UNITS.length !== expectedUnits.length || new Set(CABLE_UNITS).size !== CABLE_UNITS.length) {
  err(`CABLE_UNITS malformed: ${CABLE_UNITS.length} entries, ${new Set(CABLE_UNITS).size} unique`);
}
for (const u of expectedUnits) if (!CABLE_UNITS.includes(u)) err(`CABLE_UNITS missing '${u}'`);
if (CABLE_LESSONS.length !== 12) err(`expected 12 lessons, found ${CABLE_LESSONS.length}`);

// ── 3. generic exercise-data introspection ──────────────────────────────────
type AnyRec = Record<string, unknown>;
/** True when `answer` appears in options either as a plain value or as an
 *  option object's id (both shapes exist across the lesson datasets). */
function optionMatch(options: unknown[], answer: unknown): boolean {
  return options.some((o) => o === answer || (o != null && typeof o === 'object' && (o as AnyRec).id === answer));
}
function walkModule(name: string, mod: Record<string, unknown>) {
  for (const [key, val] of Object.entries(mod)) {
    if (!Array.isArray(val)) continue;
    const seen = new Set<string>();
    val.forEach((item, i) => {
      if (item == null || typeof item !== 'object') return;
      const r = item as AnyRec;
      const where = `${name}.${key}[${(r.id as string) ?? i}]`;
      if (typeof r.id === 'string') {
        if (seen.has(r.id)) err(`${where}: duplicate id in array`);
        seen.add(r.id);
      }
      // {options, correct, accept?} referential integrity — any shape, any nesting level 1.
      // Options may be plain values OR objects carrying an id.
      if (Array.isArray(r.options) && r.correct != null) {
        if (!optionMatch(r.options as unknown[], r.correct)) err(`${where}: correct not in options`);
        if (Array.isArray(r.accept)) {
          for (const a of r.accept as unknown[]) {
            if (!optionMatch(r.options as unknown[], a)) err(`${where}: accept '${String(a)}' not in options`);
          }
        }
      }
      // nested steps (lesson08/11 shapes)
      for (const [nk, nv] of Object.entries(r)) {
        if (!Array.isArray(nv)) continue;
        (nv as unknown[]).forEach((sub, j) => {
          if (sub == null || typeof sub !== 'object') return;
          const s = sub as AnyRec;
          if (Array.isArray(s.options) && s.correct != null) {
            const w2 = `${where}.${nk}[${(s.id as string) ?? j}]`;
            if (!optionMatch(s.options as unknown[], s.correct)) err(`${w2}: correct not in options`);
            if (Array.isArray(s.accept)) {
              for (const a of s.accept as unknown[]) {
                if (!optionMatch(s.options as unknown[], a)) err(`${w2}: accept '${String(a)}' not in options`);
              }
            }
          }
        });
      }
    });
  }
}
walkModule('lesson01', L01);
walkModule('lesson02', L02);
walkModule('lesson03', L03);
walkModule('lesson04', L04);
walkModule('lesson05', L05);
walkModule('lesson06', L06);
walkModule('lesson07', L07);
walkModule('lesson08', L08);
walkModule('lesson09', L09);
walkModule('lesson11', L11);
walkModule('lesson12', L12);
walkModule('testerCables', TESTER);

// ── 4. lesson 12 safety units exact-match ───────────────────────────────────
{
  const found = new Set<string>();
  for (const val of Object.values(L12)) {
    if (!Array.isArray(val)) continue;
    for (const item of val as AnyRec[]) {
      if (item && typeof item === 'object' && typeof item.unit === 'string' && (item.unit as string).startsWith('q_safety_')) {
        found.add(item.unit as string);
      }
    }
  }
  for (const u of SAFETY_UNITS) if (!found.has(u)) err(`lesson12: safety unit '${u}' has no question`);
  for (const u of found) if (!SAFETY_UNITS.includes(u)) err(`lesson12: unknown safety unit '${u}'`);
}

// ── 5. tester cables ─────────────────────────────────────────────────────────
{
  const DISPOSITIONS = new Set(['requalify', 'relabel', 'remove', 'repair_qualified']);
  for (const val of Object.values(TESTER)) {
    if (!Array.isArray(val)) continue;
    for (const item of val as AnyRec[]) {
      if (!item || typeof item !== 'object' || !Array.isArray(item.faultOptions)) continue;
      const where = `testerCables[${String(item.id)}]`;
      if (typeof item.disposition === 'string' && !DISPOSITIONS.has(item.disposition)) {
        err(`${where}: unknown disposition '${item.disposition}'`);
      }
      if (item.faultId != null) {
        const opts = item.faultOptions as AnyRec[];
        const present = opts.some((o) => o === item.faultId || (o && typeof o === 'object' && o.id === item.faultId));
        if (!present) err(`${where}: faultId not among faultOptions`);
      }
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────
console.log(`connectors: ${CONNECTORS.length} · lessons: ${CABLE_LESSONS.length} · units: ${CABLE_UNITS.length}`);
if (errors.length) {
  console.log(`\n✕ ${errors.length} violation(s):`);
  for (const e of errors) console.log('  - ' + e);
  throw new Error(`cable lab data validation FAILED with ${errors.length} violation(s)`);
}
console.log('✓ cable lab data validation PASSED');
