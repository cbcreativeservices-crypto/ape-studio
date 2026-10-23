/**
 * Owner decisions on the held items, 2026-10-23 — group O (other).
 * Items 10–17: mixing-guide glance/rows, flanger reveal, lab requirement
 * mk_F13 (+ the generated seed SQL), postprod depth help, cable lesson 02
 * plug/jack/socket notes, and the room-design lab (THICKNESS lane wording and
 * the real ceiling area of a sloped / vaulted ceiling in the Sabine sum).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const M = await import('../src/screens/lab/roomdesign/roomModel.ts');
const { bounds, ceilingArea, defaultDesign, polygonArea, roomVolume, rt60Bands, shapeVertices, surfaceList } = M;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');

const TEXT: { item: string; file: string; now: string; gone: string }[] = [
  {
    item: '10 classical glance',
    file: 'src/screens/lab/mixingGuides/data/guides/g15-classical-orchestral.ts',
    now: 'Unamplified halls: about 75–80 dBA Leq across a concert (quiet stretches 60–70), fortissimo',
    gone: 'about 65–80 dBA Leq in the audience',
  },
  {
    item: '11 flanger reveal',
    file: 'src/screens/lab/fxLabConfigs.tsx',
    now: 'sharpens the comb: deeper contrast and taller resonant peaks',
    gone: 'narrower notches and',
  },
  {
    item: '12 gospel piano',
    file: 'src/screens/lab/mixingGuides/data/guides/g20-gospel.ts',
    now: '"boost": "+2 dB around 5 kHz for definition",\n        "notes": "Keep out of the lead vocal’s 2–4 kHz zone.',
    gone: '+2 dB at 2–5 kHz for definition',
  },
  {
    item: '13 latin pop',
    file: 'src/screens/lab/mixingGuides/data/guides/g07-latin-pop.ts',
    now: 'When the singer works near the PA, ride the vocal down between lines at the desk.',
    gone: 'mute switch',
  },
  {
    item: '14 mk_F13',
    file: 'src/data/labRequirements.ts',
    now: "Room acoustics are measured from several seats, and each seat's reverb figure is kept on its own rather than averaged away.",
    gone: 'seats that differ',
  },
  {
    item: '14 seed SQL',
    file: 'docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql',
    now: "'mk_F13', 'Room acoustics are measured from several seats, and each seat''s reverb figure is kept on its own rather than averaged away.'",
    gone: 'seats that differ',
  },
  {
    item: '15 postprod depth',
    file: 'src/features/production/postprod/stage6.data.ts',
    now: 'Reverb is one of these, but not always the most effective. Level, tone and early reflections also place a sound near or far.',
    gone: 'rarely the most effective',
  },
  {
    item: '16 inline jack',
    file: 'src/screens/lab/cable/data/lesson02.ts',
    now: 'one travels with the cable, the other stays put. Some cables (extension leads, Y-cables) end in an inline jack.',
    gone: 'the other stays put.\',',
  },
  {
    item: '16 socket meaning',
    file: 'src/screens/lab/cable/data/lesson02.ts',
    now: 'but all three name the half that stays mounted. Many people also say socket for any female connector, even on a cable end — check which meaning is meant.',
    gone: 'the half that stays mounted.\',',
  },
  {
    item: '17a thickness lane',
    file: 'src/screens/lab/roomdesign/modules/modTreatment.tsx',
    now: 'toFixed(2)} · full to ${down}`',
    gone: 'toFixed(2)} · to ${down}`',
  },
  {
    item: '17b caption',
    file: 'src/screens/lab/roomdesign/modules/modCreate.tsx',
    now: 'ceiling ${ceilingArea(room).toFixed(1)} m² (measured along its shape, so larger than the floor)',
    gone: 'counted at its plan area',
  },
];

describe('owner decisions 2026-10-23 · group O wording', () => {
  for (const c of TEXT) {
    it(`${c.item}`, () => {
      const src = read(c.file);
      assert.ok(src.includes(c.now), `${c.file} should contain: ${c.now}`);
      assert.ok(!src.includes(c.gone), `${c.file} should no longer contain: ${c.gone}`);
    });
  }
  it('16 keeps the mounting taxonomy (plug = cable-mounted half)', () => {
    assert.ok(read('src/screens/lab/cable/data/lesson02.ts').includes('“Plug” names the cable-mounted half of a connection, whatever its shape.'));
  });
});

describe('owner decisions 2026-10-23 · 17b the Sabine sum counts a sloped ceiling at its real area', () => {
  const base = defaultDesign().room;
  const rect = { ...base, vertices: shapeVertices('rect', 4, 5), openings: [], features: [] };

  it('a flat ceiling is exactly the plan area (unchanged)', () => {
    const room = { ...rect, ceiling: 'flat' as const };
    assert.equal(ceilingArea(room), polygonArea(room.vertices));
  });

  it('a sloped ceiling (3 m front, 2 m rear) is larger than the plan: plan × √(L² + Δh²) / L', () => {
    const room = { ...rect, ceiling: 'sloped' as const, height: 3, heightLow: 2 };
    const plan = polygonArea(room.vertices);
    const L = bounds(room).length;
    const expected = (plan * Math.hypot(L, 1)) / L;
    const got = ceilingArea(room);
    assert.ok(got > plan, `ceiling ${got} should exceed plan ${plan}`);
    assert.ok(Math.abs(got - expected) < 1e-9, `ceiling ${got} vs ${expected}`);
    const line = surfaceList(room, []).find((l) => /^Ceiling ·/.test(l.label))!;
    assert.ok(Math.abs(line.area - expected) < 1e-9, 'the surface list uses the real ceiling area');
  });

  it('a vaulted ceiling is larger than the plan too, and the extra area shortens the Sabine decay', () => {
    const vaulted = { ...rect, ceiling: 'vaulted' as const, height: 4, heightLow: 2.4 };
    const plan = polygonArea(vaulted.vertices);
    assert.ok(ceilingArea(vaulted) > plan);
    // Same room, ceiling counted at plan area (the old sum) → longer RT60.
    const bands = rt60Bands(vaulted, []);
    const lines = surfaceList(vaulted, []);
    const V = roomVolume(vaulted);
    const A_old = lines.reduce((s, l) => s + (/^Ceiling ·/.test(l.label) ? plan : l.area) * l.alpha[2], 0);
    assert.ok(bands[2].sabine < (0.161 * V) / A_old, 'more ceiling area, more absorption, shorter decay');
  });
});
