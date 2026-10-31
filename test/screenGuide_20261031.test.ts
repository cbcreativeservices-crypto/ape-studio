/**
 * Screen Guide pilot — Wave Physics Laboratory (owner 2026-10-31) — receipts.
 *
 * "What each lab screen really needs is an explanation of what the screen is
 * showing and what the user is interacting with … the missing 'I still don't
 * get this screen' helper." Owner decisions: (1) it opens from the header ⓘ
 * where the compact AccuracyNote sat, plus a one-time hint pointing at it;
 * (2) the accuracy chip stays only on live-mic tools and labs that show
 * real-world measurement numbers — Wave Physics is a CONCEPT lab, so its two
 * headers lose it; (3) the pilot is Wave Physics: 15 modules + Room Builder.
 *
 *   1. every WaveModuleId (and the lab home) has a guide with all five
 *      sections, each 1–5 non-empty bullets, in the house copy rules;
 *   2. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the module/renderer source (rename one → update the
 *      guide);
 *   3. WaveModuleScreen / WaveLabHomeScreen render the guide key (+ hint
 *      anchor) and no longer render AccuracyNote; other labs are untouched;
 *   4. the key + popup: AccuracyNote's chip look, DimModal (centred popup,
 *      never a raw Alert), "Explain this screen", a ✕;
 *   5. the one-time hint: createLocalStore under `ape:intro:*` (kept by both
 *      wipes, replayed by "Reset onboarding hints"), gated on Low-Light, focus,
 *      the lab term popup and any open DimModal — and it really persists;
 *   6. STEPPED + AREA-AWARE (owner review 2026-10-31: "too much to scroll …
 *      allow the correct area of the screen below to be still seen"): one
 *      section per step, "N · NAME" + dots (never "N of total"), each section
 *      within its no-scroll budget, each step placed away from the area it
 *      explains — measured from the Rack Unit, never guessed — and TRY THIS a
 *      non-blocking strip above the dock.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// ── a fake AsyncStorage (reads can fail) — the labTermIntro harness ────────
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SG_AS__ = AS;
g.__SG_FAIL_READS__ = false;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(`
    const s = globalThis.__SG_AS__;
    export default {
      async getItem(k) { if (globalThis.__SG_FAIL_READS__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
      async setItem(k, v) { s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
      async getAllKeys() { return [...s.keys()]; },
      async multiRemove(ks) { for (const k of ks) s.delete(k); },
    };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { WAVE_MODULES } = await import('../src/screens/lab/wave/modules/registry.ts');
const { WAVE_SCREEN_GUIDES, WAVE_HOME_GUIDE } = await import('../src/screens/lab/wave/waveScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_KEY_LABEL, SCREEN_GUIDE_BUDGET, screenGuideStepLabel } = await import(
  '../src/features/lab/screenGuide/types.ts'
);
const P = await import('../src/features/lab/screenGuide/placement.ts');
const hint = await import('../src/features/lab/screenGuide/screenGuideHintStore.ts');
const intros = await import('../src/features/intro/screenIntros.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const allGuides: [string, Guide][] = [
  ['home', WAVE_HOME_GUIDE as unknown as Guide],
  ...Object.entries(WAVE_SCREEN_GUIDES as unknown as Record<string, Guide>),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
/** One top-level function's source: from its declaration to the next one. */
const block = (src: string, decl: string) => {
  const at = src.indexOf(decl);
  if (at < 0) return '';
  const rest = src.slice(at + decl.length);
  const next = rest.search(/\n(export )?function |\nconst styles = /);
  return decl + (next < 0 ? rest : rest.slice(0, next));
};

describe('1. every Wave screen has a complete guide', () => {
  it('the five sections, in the owner’s order and words', () => {
    assert.deepEqual(
      SCREEN_GUIDE_SECTIONS.map((s: { title: string }) => s.title),
      ['WHAT YOU’RE SEEING', 'WHAT YOU CONTROL', 'WHAT CHANGES — AND WHY', 'WHAT THIS TEACHES', 'TRY THIS'],
    );
  });
  it('every WaveModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = WAVE_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 16, '15 modules + Room Builder');
    assert.deepEqual(Object.keys(WAVE_SCREEN_GUIDES).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend"', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const SRC = [
    'src/screens/lab/wave/modules/modWaveA.tsx',
    'src/screens/lab/wave/modules/modWaveB.tsx',
    'src/screens/lab/wave/vizWave.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    reflection: ['DIRECT', '1ST REFL', 'REFL LVL', 'LOSS/BNC', 'FREQ', 'MAT', 'LAYERS', 'WAVE FIELD'],
    absorption: ['1 BOUNCE', 'α 125 Hz', 'α 4 kHz', 'RT60', 'MAT'],
    diffusion: ['TOP WALL', 'DEPTH', 'MIN ƒ', 'MIRROR', 'SCATTER', 'BELOW ƒ', 'DIFFUSER', 'ENERGY RETURNED'],
    refraction: ['c GROUND', 'BEND', 'H @150 m', 'GRAD', 'WIND', 'LAPSE', 'INVERSION', 'NEUTRAL', 'WARM AIR', 'COOL AIR', 'UNIFORM AIR', 'HEIGHT ×'],
    diffraction: ['BARRIER', 'FRESNEL N', 'SHADOW ZONE', 'RING GAP', 'LOW REF — LOSS @ 80 Hz', 'HIGH REF — LOSS @ 8 kHz'],
    interference: ['S1 PATH', 'S2 PATH', 'Δ PATH', 'vs 1 SPKR', 'POL Ø S2', 'DELAY'],
    comb: ['Δt', '1ST NULL', 'SPACING', 'MIC→WALL', 'WALL', '← MIC', 'MIC →'],
    standing: ['TYPE', 'PRESSURE', 'VERDICT', 'TANGENTIAL', 'AXIAL', 'NODE', 'ANTINODE', 'WIDTH', 'DEPTH', 'MODE'],
    coverage: ['NOM COV', 'vs ON-AXIS', 'AIM', 'COV', 'HEAT'],
    linearray: ['BOXES', 'LEN', 'LF CTRL', 'SPLAY (PER BOX)', 'HEIGHT (HANG DEPTH)', 'ARRAY'],
    delayalign: ['REQ', 'SET', 'OFF BY', 'SUM', 'XOVER', 'AUTO-ALIGN', 'MAIN POLARITY Ø', 'THE WRONG TOOL'],
    cardioidsub: ['FRONT SUB', 'REAR SUB', 'AUDIENCE ↓', 'REAR MIC', 'F − R', 'CARDIOID', 'WRONG WAY', 'REAR POLARITY Ø INVERT', 'SOLO FRONT SUB'],
    beamsteer: ['STEER', 'Δt/BOX', 'GRATING', 'IN FIELD', 'vs STRAIGHT', 'BOXES'],
    echo: ['GAP', '1ST REFL', 'FUSES', 'ECHO', 'FAR WALL', 'CANYON 60 m', 'GYM 24 m', 'CHURCH 30 m', 'WAREHOUSE 40 m', 'ROCK'],
    reverb: ['RT 125', 'RT 500', 'RT 2K', 'GAP', 'ABSORB'],
    builder: ['ROOM', '1ST ARR', 'RT60', 'THROUGH −', 'WALLS', 'SRC', 'ROOM WIDTH', 'ROOM DEPTH', 'POLARITY Ø INVERT', 'LEVEL'],
  };
  it('a name list for every module', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(WAVE_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf((WAVE_SCREEN_GUIDES as unknown as Record<string, Guide>)[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the module/renderer source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the Refraction guide matches the screen’s scene (owner preview)', () => {
    const t = textOf((WAVE_SCREEN_GUIDES as unknown as Record<string, Guide>).refraction);
    const a = code('src/screens/lab/wave/modules/modWaveA.tsx');
    const v = code('src/screens/lab/wave/vizWave.tsx');
    // 150 m listener, ×20 height, 2 m source, 60 m aloft, 12 m/s wind.
    assert.match(v, /const GRAD_LISTENER_M = 150;/);
    assert.match(v, /const GRAD_V_EXAG = 20;/);
    assert.match(v, /const h0 = 2\.0;/);
    assert.match(a, /const ALOFT_M = 60;/);
    assert.match(a, /wind \* 12/);
    for (const s of ['150 m', 'HEIGHT ×20', '2 m up', '60 m up', '12 m/s']) assert.ok(t.includes(s), s);
  });
});

describe('3. the two Wave headers: the guide key in, the accuracy chip out', () => {
  const MOD = code('src/screens/lab/wave/WaveModuleScreen.tsx');
  const HOME = code('src/screens/lab/wave/WaveLabHomeScreen.tsx');
  it('WaveModuleScreen: per-module guide by WaveModuleId, inside the hint anchor, no AccuracyNote', () => {
    assert.doesNotMatch(MOD, /AccuracyNote/);
    assert.match(MOD, /<ScreenGuideHintAnchor>\s*<LabHeader[\s\S]*?right=\{<ScreenGuideKey title=\{meta\.title\.toUpperCase\(\)\} guide=\{WAVE_SCREEN_GUIDES\[meta\.id\]\} \/>\}/);
    // The overlay host wraps the root's whole content (its overlay is the
    // root's last child); a module change closes an open guide.
    assert.match(MOD, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\}>/);
    assert.match(MOD, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('WaveLabHomeScreen: the home guide, inside the hint anchor, no AccuracyNote', () => {
    assert.doesNotMatch(HOME, /AccuracyNote/);
    assert.match(HOME, /<ScreenGuideHintAnchor>\s*<LabHeader[\s\S]*?right=\{<ScreenGuideKey title="WAVE PHYSICS LABORATORY" guide=\{WAVE_HOME_GUIDE\} \/>\}/);
    // No Rack Unit on the menu: regions off, so every step sits low.
    assert.match(HOME, /<ScreenGuideHost regions=\{false\}/);
    assert.match(HOME, /<\/ScreenGuideHost>\s*<\/View>/);
  });
  it('only the concept lab changed: AccuracyNote itself and its other labs keep the chip', () => {
    assert.match(code('src/components/AccuracyNote.tsx'), /export function AccuracyNote/);
    // Spot-check labs outside the pilot. Digital Audio Systems left this list on
    // 2026-10-31: the Audio Fundamentals rollout ruled it a concept lab and its
    // own test (screenGuide_digital_20261031) pins the chip's absence. Room
    // Design keeps its chip (real-room acoustics numbers) and is pinned there.
    for (const p of ['src/screens/lab/eq/EqModuleScreen.tsx', 'src/screens/lab/roomdesign/RoomDesignLabScreen.tsx']) {
      if (existsSync(join(ROOT, p))) assert.match(code(p), /AccuracyNote/, `${p} lost its chip — not part of this pilot`);
    }
  });
});

describe('4. the key and the popup', () => {
  const SG = code('src/features/lab/screenGuide/ScreenGuide.tsx');
  const chipOf = (s: string) => (s.match(/\n  chip: \{[\s\S]*?\n  \},/) ?? [''])[0].replace(/\s+/g, ' ');
  it('the key wears the compact AccuracyNote chip exactly (the header does not shift)', () => {
    const mine = chipOf(SG);
    assert.ok(mine.length > 20, 'chip style found');
    assert.equal(mine, chipOf(code('src/components/AccuracyNote.tsx')));
    assert.match(SG, /<Text style=\{styles\.chipGlyph\}>ⓘ<\/Text>/);
  });
  it('accessible label "Explain this screen"', () => {
    assert.equal(SCREEN_GUIDE_KEY_LABEL, 'Explain this screen');
    assert.match(SG, /accessibilityLabel=\{SCREEN_GUIDE_KEY_LABEL\}/);
  });
  it('never a raw Alert; with no host it falls back to the same stepped card, centred in the app’s DimModal', () => {
    assert.match(SG, /import \{ Modal, rootModalHoldMs, useModalHostOpen \} from '\.\.\/\.\.\/\.\.\/components\/DimModal';/);
    assert.doesNotMatch(SG, /import \{[^}]*\bModal\b[^}]*\} from 'react-native'/);
    assert.doesNotMatch(SG, /\bAlert\b/);
    const popup = block(SG, 'export function ScreenGuidePopup(');
    assert.match(popup, /<Modal accessibilityViewIsModal/);
    assert.match(popup, /<GuideCard[\s\S]*?strip=\{false\}/);
    assert.match(SG, /modalBackdrop: \{[^}]*justifyContent: 'center'/);
  });
  it('the card: ✕ always, ‹ BACK / NEXT ›, GOT IT on the last step, dots + "N · NAME"', () => {
    const card = block(SG, 'function GuideCard(');
    assert.ok(card, 'GuideCard found');
    assert.match(card, />✕<\/Text>/);
    assert.match(card, />‹ BACK<\/Text>/);
    assert.match(card, />NEXT ›<\/Text>/);
    assert.match(card, /\{last \? \([\s\S]*?>GOT IT<\/Text>/);
    assert.match(card, /<StepDots count=\{SCREEN_GUIDE_SECTIONS\.length\} at=\{step\} \/>/);
    assert.match(card, /\{screenGuideStepLabel\(step\)\}/);
  });
  it('using the key retires the hint, and opens the screen’s overlay when there is a host', () => {
    assert.match(SG, /void markScreenGuideHintSeen\(\);\s*if \(host\) \{\s*host\.open\(title, guide\);/);
  });
});

describe('5. the one-time hint', () => {
  const STORE = code('src/features/lab/screenGuide/screenGuideHintStore.ts');
  const SG = code('src/features/lab/screenGuide/ScreenGuide.tsx');
  it('persists through createLocalStore under the intro family', () => {
    assert.match(STORE, /createLocalStore<boolean>\(\{/);
    assert.equal(hint.SCREEN_GUIDE_HINT_KEY, 'ape:intro:screenGuideHint');
    assert.match(STORE, /onScreenIntrosReset\(\(\) => store\.reset\(\)\)/);
    assert.doesNotMatch(STORE, /AsyncStorage/, 'no hand-rolled storage (D47)');
  });
  it('the intro family survives both wipes (clearLocalAccountData keeps ape:intro:*)', () => {
    assert.match(code('src/features/account/clearLocalAccountData.ts'), /k\.startsWith\('ape:intro:'\)/);
  });
  it('gated: Low-Light / kill switch, focus, the lab term popup, any open DimModal, a closing fade', () => {
    for (const re of [/useOverlaysSuppressed\(\)/, /useIsFocused\(\)/, /useLabTermIntroOwed\(\)/, /useModalHostOpen\(\)/, /rootModalHoldMs\(\)/]) {
      assert.match(SG, re);
    }
    assert.match(SG, /const clear = owed && focused && !suppressed && !labTermFirst && !modalUp;/);
    assert.match(SG, /return clear && settled;/);
  });
  it('an inline callout, not a modal: absolutely placed under the header, a tap retires it', () => {
    const anchor = (SG.match(/export function ScreenGuideHintAnchor[\s\S]*?\n\}/) ?? [''])[0];
    assert.ok(anchor, 'anchor found');
    assert.doesNotMatch(anchor, /<Modal/);
    assert.match(anchor, /onPress=\{\(\) => void markScreenGuideHintSeen\(\)\}/);
    assert.match(SG, /hint: \{\s*position: 'absolute',\s*top: '100%'/);
  });
  it('really persists: unseen → dismissed writes the flag → a reset brings it back', async () => {
    AS.clear();
    await hint.screenGuideHintHydrate();
    assert.equal(hint.screenGuideHintSeenNow(), false);
    assert.equal(AS.has(hint.SCREEN_GUIDE_HINT_KEY), false, 'nothing saved before it is seen');
    assert.equal(await hint.markScreenGuideHintSeen(), true);
    assert.equal(AS.get(hint.SCREEN_GUIDE_HINT_KEY), 'true');
    assert.equal(hint.screenGuideHintSeenNow(), true);
    // "Reset onboarding hints" removes ape:intro:* and the store forgets.
    await intros.resetScreenIntros();
    await hint.screenGuideHintHydrate();
    assert.equal(AS.has(hint.SCREEN_GUIDE_HINT_KEY), false);
    assert.equal(hint.screenGuideHintSeenNow(), false, 'the hint comes back after a reset');
  });
});

describe('6. stepped, and placed away from the area it explains (owner review 2026-10-31)', () => {
  const SG = code('src/features/lab/screenGuide/ScreenGuide.tsx');
  const RACK = code('src/screens/lab/rack/RackUnit.tsx');

  it('one section per step; the label is its number and name — never a count of the total', () => {
    const labels = SCREEN_GUIDE_SECTIONS.map((_: unknown, i: number) => screenGuideStepLabel(i));
    assert.deepEqual(labels, ['1 · WHAT YOU’RE SEEING', '2 · WHAT YOU CONTROL', '3 · WHAT CHANGES — AND WHY', '4 · WHAT THIS TEACHES', '5 · TRY THIS']);
    for (const l of labels) assert.doesNotMatch(l, /\bof\b|\/\s*\d/i);
    assert.doesNotMatch(SG, /`[^`]*\$\{[^}]+\}\s*(of|\/)\s*\$\{[^}]+\}[^`]*`/, 'no "N of M" / "N/M" counter built anywhere');
    assert.doesNotMatch(SG, /\bof \$\{/);
  });

  it('placement per section: seeing / changes / teaches low (display bright), control high (dock bright), TRY THIS a strip', () => {
    const map = Object.fromEntries(SCREEN_GUIDE_SECTIONS.map((s: { key: string; place: string; keep: readonly string[] }) => [s.key, [s.place, [...s.keep]]]));
    assert.deepEqual(map, {
      seeing: ['low', ['display']],
      control: ['high', ['dock']],
      changes: ['low', ['display']],
      teaches: ['low', ['display']],
      tryThis: ['strip', ['display', 'dock']],
    });
  });

  it('every step fits its no-scroll budget, on every Wave screen', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });

  // A 375 × 812 phone under a Rack Unit, as measured (relative to the overlay root).
  const PHONE = {
    rootW: 375,
    rootH: 812,
    insetTop: 47,
    insetBottom: 34,
    display: { x: 10, y: 167, w: 355, h: 292 },
    dock: { x: 0, y: 640, w: 375, h: 138 },
  };
  it('low: the card stays below the display + readouts, which stay bright', () => {
    const p = P.placeGuideStep('low', PHONE);
    assert.deepEqual(p.keep, PHONE.display);
    assert.equal(p.dim, true);
    assert.equal(p.card.bottom, PHONE.insetBottom + P.GUIDE_GAP);
    const cardTop = PHONE.rootH - (p.card.bottom as number) - p.card.maxHeight;
    assert.ok(cardTop >= PHONE.display.y + PHONE.display.h, `card top ${cardTop} overlaps the display`);
  });
  it('high: the card stays above the dock, which stays bright and live', () => {
    const p = P.placeGuideStep('high', PHONE);
    assert.deepEqual(p.keep, PHONE.dock);
    assert.equal(p.card.top, PHONE.insetTop + P.GUIDE_GAP);
    assert.ok((p.card.top as number) + p.card.maxHeight <= PHONE.dock.y, 'card overlaps the dock');
  });
  it('TRY THIS: a strip just above the dock — nothing dimmed, nothing blocked', () => {
    const p = P.placeGuideStep('strip', PHONE);
    assert.equal(p.dim, false);
    assert.equal(p.blocking, false);
    assert.equal(p.keep, null);
    assert.equal(p.card.bottom, PHONE.rootH - PHONE.dock.y + P.GUIDE_GAP);
  });
  it('no regions (the lab home, a hidden display): a bottom card, no bright band', () => {
    const none = { ...PHONE, display: null, dock: null };
    for (const place of ['low', 'high'] as const) {
      const p = P.placeGuideStep(place, none);
      assert.equal(p.keep, null);
      assert.equal(p.card.bottom, PHONE.insetBottom + P.GUIDE_GAP);
    }
    assert.equal(P.placeGuideStep('strip', none).card.bottom, PHONE.insetBottom + P.GUIDE_GAP);
  });
  it('a region off the overlay (a screen underneath) is ignored; glass ∪ readouts is one band', () => {
    assert.equal(P.onScreen({ x: 0, y: 900, w: 10, h: 10 }, 375, 812), null);
    assert.deepEqual(P.unionRect({ x: 10, y: 167, w: 355, h: 250 }, { x: 10, y: 417, w: 355, h: 42 }), { x: 10, y: 167, w: 355, h: 292 });
  });

  it('regions are MEASURED from the Rack Unit (register-only refs), never guessed', () => {
    assert.match(RACK, /import \{ useGuideRegion \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide\/guideRegions';/);
    assert.match(RACK, /useGuideRegion\('display', glassRef\);\s*useGuideRegion\('readouts', bezelRef\);\s*useGuideRegion\('dock', dockRef\);/);
    assert.match(RACK, /<View ref=\{glassRef\} collapsable=\{false\} style=\{\[styles\.glass/);
    assert.match(RACK, /<View ref=\{bezelRef\} collapsable=\{false\}>\s*<BezelReadouts/);
    assert.match(RACK, /<View ref=\{dockRef\} collapsable=\{false\} onLayout=/);
    const REG = code('src/features/lab/screenGuide/guideRegions.ts');
    assert.match(REG, /measureInWindow/);
    // The overlay measures itself and the regions in the same window, every step.
    assert.match(SG, /const root = await measureView\(rootRef\);/);
    assert.match(SG, /measureGuideRegion\('display'\), measureGuideRegion\('readouts'\), measureGuideRegion\('dock'\)/);
    assert.match(SG, /useEffect\(\(\) => \{\s*void measure\(\);\s*\}, \[step, measure\]\);/);
  });

  it('the overlay lives in the screen (Low-Light wash reaches it, no Modal-on-Modal); TRY THIS leaves the screen live; BACK closes', () => {
    const overlay = block(SG, 'function ScreenGuideOverlay(');
    assert.ok(overlay, 'overlay found');
    assert.doesNotMatch(overlay, /<Modal/);
    assert.match(overlay, /pointerEvents="box-none"/);
    assert.match(overlay, /place && place\.dim \?/);
    assert.match(overlay, /strip=\{section\.place === 'strip'\}/);
    assert.match(overlay, /useBackWhileFocused\(true, back\)/);
    // One experiment at a time with its own ‹ ›.
    assert.match(SG, /accessibilityLabel="Previous experiment"/);
    assert.match(SG, /accessibilityLabel="Next experiment"/);
    assert.match(SG, /<Text style=\{styles\.tryText\}>\{items\[e\]\}<\/Text>/);
  });
});
