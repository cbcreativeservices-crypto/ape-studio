/**
 * Membrane Studio TUNING card — kettle-on ratio list (2026-10-31 screen-guide
 * verification). With the kettle on, the card's caption says the ratios sit
 * "near 1 : 1.5 : 2 : 2.5". The list must therefore show only the principal
 * (n,1) series (n ≥ 1) — the (0,n) ring modes are bowl-damped (membrane.ts) and
 * listing them (0.85, 1.47, 2.31) hid the pattern. presets.ts names the same
 * four modes: (1,1), (2,1), (3,1), (4,1). The bare-head list is unchanged.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { MembraneSpec, MembraneMode } from '../src/features/cymatics/membrane.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const M = await import('../src/features/cymatics/membrane.ts');
const spec = (o: Partial<MembraneSpec> = {}): MembraneSpec => ({ ...M.DEFAULT_MEMBRANE, ...o });

// The screen's exact list expression (MembraneStudioScreen.tsx, TUNING card).
function tuningList(s: MembraneSpec): string {
  const modes: MembraneMode[] = M.membraneModes(s, 16);
  const ex = modes.filter((m) => m.drive > 0.05);
  const ref11 = modes.find((m) => m.n === 1 && m.s === 1);
  const ratioBase = s.kettle && ref11 ? ref11 : ex[0];
  const list = s.kettle ? modes.filter((m) => m.s === 1 && m.n >= 1).slice(0, 4) : modes.filter((m) => m.s === 1 || m.n === 0).slice(0, 6);
  return list.map((m) => (m.hz / ratioBase.hz).toFixed(2)).join(' : ');
}

test('kettle on: the list is the principal (n,1) series, near 1 : 1.5 : 2 : 2.5', () => {
  for (const strike of [{ r: 0, thetaDeg: 0 }, { r: 0.25, thetaDeg: 20 }, { r: 0.6, thetaDeg: 45 }]) {
    assert.equal(tuningList(spec({ kettle: true, strike })), '1.00 : 1.50 : 1.99 : 2.44');
  }
});

test('kettle off: the bare-head list is unchanged (inharmonic Bessel ratios)', () => {
  assert.equal(tuningList(spec({ kettle: false, strike: { r: 0.4, thetaDeg: 20 } })), '1.00 : 1.59 : 2.14 : 2.30 : 2.65 : 3.16');
});

test('the screen uses that expression and labels the kettle list as principal (n,1) modes', () => {
  const src = readFileSync(new URL('../src/screens/lab/cymatics/MembraneStudioScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(src.includes('spec.kettle ? modes.filter((m) => m.s === 1 && m.n >= 1).slice(0, 4) : modes.filter((m) => m.s === 1 || m.n === 0).slice(0, 6)'));
  assert.ok(src.includes("spec.kettle ? 'Principal (n,1) mode ratios' : 'Mode ratios'"));
  assert.ok(src.includes('near 1 : 1.5 : 2 : 2.5'));
});
