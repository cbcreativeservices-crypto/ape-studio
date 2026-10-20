/**
 * Wiring A-grade audit, Phase 2 (owner go 2026-10-20) — automatic checks for
 * system signal flow, against the rule book
 * (docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md; rule ids in each title).
 *
 * KNOWN_FINDINGS lists the verified findings not yet fixed (owner decisions
 * pending, docs/wiring/WIRING_FINDINGS_2026_10_20.md). It may only SHRINK:
 * a fix with the finding still listed fails, so the list is cleared with it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();

// House resolver hook (see soundSystemsEngine.test.ts): extensionless sibling imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const op = await import('../src/features/soundsystems/operate.ts');
const { MAP } = await import('../src/screens/lab/dj/geometry/mapGeometry.ts');

/** Verified findings not yet fixed. May only shrink. */
const KNOWN_FINDINGS = {
  // WF-SS-01: at the default (unity) settings the amplifier has less headroom
  // than the stages before it, so it clips first.
  ampClipsBeforeUpstreamAtUnity: true,
  // WF-DJ-01: screen 4's map (seen from the audience side) puts PA R at house left.
  djMapPaRAtHouseLeft: true,
};

describe('F6 the power amplifier is the last stage to clip (Sound Systems, unity settings)', () => {
  it('amplifier headroom vs every stage before it matches the known findings', () => {
    const chain = op.computeGainChain({});
    const amp = chain.find((n) => n.id === 'amp')!;
    const upstream = chain.slice(0, chain.indexOf(amp)).filter((n) => n.id !== 'source');
    const ampFirst = upstream.some((n) => amp.headroomDb < n.headroomDb);
    assert.equal(ampFirst, KNOWN_FINDINGS.ampClipsBeforeUpstreamAtUnity,
      chain.map((n) => `${n.id} ${n.headroomDb.toFixed(1)} dB`).join(', '));
  });
});

describe('PA L is at house left on every DJ screen (screen 20 / djRoom)', () => {
  it('screen 4 map: seen from behind the booth (the audience side), house left is the viewer’s left', () => {
    // the map's own comment and screen 4's text: viewed from BEHIND the booth,
    // the way you reach round to wire it — i.e. standing on the audience side
    const paRLeft = MAP.room.paR < MAP.room.paL && MAP.plate.paR.x < MAP.plate.paL.x;
    assert.equal(paRLeft, KNOWN_FINDINGS.djMapPaRAtHouseLeft);
  });
  it('booth monitors stay the DJ’s own: booth L on the DJ’s left, which is the viewer’s right on the map', () => {
    assert.ok(MAP.room.boothL > MAP.room.boothR && MAP.plate.boothL.x > MAP.plate.boothR.x);
  });
});
