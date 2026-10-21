/**
 * Wiring round 4, DJ Systems Lab (owner decisions 2026-10-21) — each fix's
 * ratchet: the wrong model, wording or drawing fails here if it comes back.
 *   DJ-R4-PHONES  a booth monitor fed from the mixer's PHONES jack (a BOOTH
 *                 cable's mixer end moved there, DJ-R3-PHONES) is modelled
 *                 REALISTICALLY: the BOOTH lead is a balanced TRS lead into
 *                 the monitor's balanced input, and a stereo headphone jack
 *                 puts L on the tip (hot) and R on the ring (cold), so the
 *                 monitor plays hot − cold = L − R (halved: never louder than
 *                 the old summed feed). Centre-panned content cancels. The
 *                 wrongJob line says so in plain words.
 *   DJ-R4-MSTL    Screen 4: a freed MASTER L (deck A patched) no longer hangs
 *                 its XLR across deck A's leads: it drapes into the clear
 *                 pocket under them, ≥ 4 mm from every other run, under
 *                 gravity (rule book R1: always down, ends vertical).
 *   DJ-R4-LINE    Screen 4: the PHONO / LINE words print over each column's
 *                 L socket, so the RCA leads that come up into the R sockets
 *                 no longer run over them.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, PLUGS, builtBooth, connect, speakerFeed, wrongJob, type Booth, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { MAP_BODIES, MAP_PLUGS, fixedEnd } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
import { MIXER_REAR_JACKS } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import * as D from '../src/screens/lab/dj/geometry/dressGeometry.ts';
import { clearDeckCache, phonesIntoBalancedInput, renderBooth } from '../src/screens/lab/dj/engine/djRender.ts';
import { setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';

const ROOT = join(import.meta.dirname, '..');
/** Source text, line endings normalised (a Windows checkout writes CRLF). */
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';
type State = Partial<Record<PlugId, JackId | null>>;
type P = readonly [number, number];
type Box = { x: number; y: number; w: number; h: number };

const peak = (a: Float32Array) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
/** Deck A playing 16 bars in, its fader up — nothing cued. */
function playing(): Booth {
  let b = builtBooth();
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 0.12 + 16 * (240 / 122) } } };
  b = setPlaying(b, 0, 'A', true);
  return { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } } };
}
/** The booth after connect() (the model's own one-plug-per-jack rule). */
const movedState = (p: PlugId, j: JackId): State => {
  const b = connect(builtBooth(), p, j)!;
  return Object.fromEntries(MAP_PLUGS.map((q) => [q, b.plugs[q]]));
};

describe('DJ-R4-PHONES — the physics: a stereo headphone jack into a balanced input plays L − R', () => {
  it('the modelled BOOTH lead is a balanced TRS lead (so the subtraction is the physics of THIS cable)', () => {
    assert.equal(PLUGS['bth.trsL'].kind, 'trs');
    assert.equal(PLUGS['bth.trsR'].kind, 'trs');
    assert.match(PLUGS['bth.trsL'].from, /TRS/);
  });
  it('a centre-panned signal cancels; a hard-panned one passes at the old summed level; the peak never passes the headphone feed’s', () => {
    const n = 4800;
    const kick = new Float32Array(n);
    const hat = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      kick[i] = 0.8 * Math.sin((2 * Math.PI * 55 * i) / 48000);
      hat[i] = 0.2 * Math.sin((2 * Math.PI * 7000 * i) / 48000);
    }
    // centre only (kick, bass, vocal): the same in both ears → silence
    assert.equal(peak(phonesIntoBalancedInput(kick, kick)), 0);
    // centre + a hat panned hard left: only the hat is left, at half (the old (L + R) / 2 level)
    const L = kick.map((v, i) => v + hat[i]);
    const out = phonesIntoBalancedInput(L, kick);
    for (let i = 0; i < n; i++) assert.ok(Math.abs(out[i] - hat[i] / 2) < 1e-6);
    // never louder than the louder ear, even in anti-phase
    const anti = kick.map((v) => -v);
    const worst = phonesIntoBalancedInput(kick, anti);
    assert.ok(peak(worst) <= Math.max(peak(kick), peak(anti)) + 1e-6);
  });
  it('both renders route a PHONES-fed monitor through the one helper; the summed feed is gone', () => {
    for (const f of ['engine/djRender.ts', 'engine/djEventRender.ts']) {
      const src = read(DJ + f);
      assert.match(src, /const pDiff = phonesIntoBalancedInput\(pL, pR\);/, f);
      assert.match(src, /PHONES: \{ L: pDiff, R: pDiff \}/, f);
      assert.doesNotMatch(src, /pMono|\(pL\[i\] \+ pR\[i\]\) \/ 2/, f);
    }
    assert.match(read(`${DJ}engine/djRender.ts`), /out\[i\] = \(pL\[i\] - pR\[i\]\) \/ 2;/);
  });
});

describe('DJ-R4-PHONES — the render', () => {
  clearDeckCache();
  const moved = (b: Booth = playing()) => ({ ...connect(b, 'bth.trsL', 'mix.phones')!, perspective: 'BOOTH' as const });
  it('a centre-panned (mono) headphone feed: the headphones are loud, the PHONES-fed monitor is SILENT', () => {
    // SPLIT CUE with deck A both cued and on air: left ear = the cue (mono),
    // right ear = the mix (mono) — the same signal, so L = R exactly
    let b = moved();
    b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], cue: true } }, mixer: { ...b.mixer, splitCue: true } };
    assert.deepEqual(speakerFeed(b, 'boothL'), { out: 'PHONES', side: 'L' });
    const mon = renderBooth(b, 0, 1);
    assert.equal(peak(mon.playback.l), 0, 'the centre cancels in the balanced input');
    assert.ok(peak(mon.playback.r) > 0.01, 'BOOTH R (still on BOOTH OUT) plays');
    // the same feed in the headphones is loud
    const hp = renderBooth({ ...b, plugs: { ...b.plugs, phones: 'mix.phones' }, perspective: 'PHONES' }, 0, 1);
    assert.ok(peak(hp.playback.l) > 0.01 && peak(hp.playback.r) > 0.01);
  });
  it('a stereo track: the monitor plays exactly (L − R) / 2 of the headphone feed — thin, and well under it', () => {
    let b = moved();
    b = { ...b, mixer: { ...b.mixer, cueMix: 1 } }; // the headphones carry the mix
    const mon = renderBooth(b, 0, 1);
    const hp = renderBooth({ ...b, plugs: { ...b.plugs, phones: 'mix.phones' }, perspective: 'PHONES' }, 0, 1);
    assert.ok(mon.limiterDb > -0.01 && hp.limiterDb > -0.01, 'no limiter action in either (a clean comparison)');
    let worst = 0;
    for (let i = 0; i < mon.playback.l.length; i++) worst = Math.max(worst, Math.abs(mon.playback.l[i] - (hp.playback.l[i] - hp.playback.r[i]) / 2));
    assert.ok(worst < 1e-6, `monitor = (L − R) / 2 (worst ${worst})`);
    assert.ok(peak(mon.playback.l) > 0.001, 'the sides (panned hats, shaker) still play');
    assert.ok(peak(mon.playback.l) < 0.5 * Math.max(peak(hp.playback.l), peak(hp.playback.r)), 'and well under the full feed');
    // never louder than the old summed feed's ceiling (the louder ear)
    assert.ok(peak(mon.playback.l) <= Math.max(peak(hp.playback.l), peak(hp.playback.r)));
  });
});

describe('DJ-R4-PHONES — the words', () => {
  const t = wrongJob('bth.trsL', 'mix.phones')!;
  it('the learner reads why: it fits and plays, but the balanced input subtracts the two sides', () => {
    assert.equal(wrongJob('bth.trsR', 'mix.phones'), t);
    assert.match(t, /^It fits, and it plays — but thin and hollow\./);
    assert.match(t, /left on the tip, right on the ring/);
    assert.match(t, /balanced input subtracts one from the other, so it plays left minus right/);
    assert.match(t, /in the middle \(kick, bass, vocal\) cancels out/);
    assert.match(t, /a mono track goes almost silent/);
    assert.match(t, /follows your headphone cue and the PHONES knob, not BOOTH/);
    assert.match(t, /Booth monitors belong on BOOTH OUT\.$/);
    assert.doesNotMatch(t, /summed|one \(mono\) input/);
  });
  it('plain words: reading grade ≤ 9 (Flesch–Kincaid), short sentences, no gear maker names', () => {
    const words = t.replace(/[()—:,.]/g, ' ').split(/\s+/).filter((w) => /[a-z]/i.test(w));
    const sentences = t.split(/[.!?](\s|$)/).filter((s) => s && s.trim().length > 1).length;
    const syl = (w: string) => {
      const s = w.toLowerCase().replace(/[^a-z]/g, '');
      if (s.length <= 3) return 1;
      const m = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
      return Math.max(1, m ? m.length : 1);
    };
    const syllables = words.reduce((a, w) => a + syl(w), 0);
    const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
    assert.ok(grade <= 9, `grade ${grade.toFixed(1)}`);
    assert.doesNotMatch(t, /Pioneer|Allen|Rane|Denon|Numark|Behringer|Yamaha|JBL|QSC|Sennheiser|Audio-Technica|Sony/i);
  });
  it('MODEL.md says the physics (and what a TS lead would do instead)', () => {
    const md = read('docs/labs/dj/MODEL.md');
    assert.match(md, /DJ-R4-PHONES/);
    assert.match(md, /hot − cold = \*\*L − R\*\*/);
    assert.match(md, /Were the lead TS, the\nmonitor would hear the tip only — LEFT alone/);
    assert.doesNotMatch(md, /its stereo summed into the monitor's one input/);
  });
});

/* ── Screen 4 geometry helpers ───────────────────────────────────────── */
const crossings = (a: readonly P[], b: readonly P[]): P[] => {
  const out: P[] = [];
  for (let i = 1; i < a.length; i++) for (let k = 1; k < b.length; k++) {
    const [x1, y1] = a[i - 1], [x2, y2] = a[i], [x3, y3] = b[k - 1], [x4, y4] = b[k];
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (Math.abs(d) < 1e-9) continue;
    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    if (t < 0 || t > 1 || u < 0 || u > 1) continue;
    out.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]);
  }
  return out;
};
/** every 1 mm along a polyline */
const sample = (r: readonly P[]): P[] => {
  const out: P[] = [r[0]];
  for (let i = 1; i < r.length; i++) {
    const n = Math.max(1, Math.ceil(Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])));
    for (let j = 1; j <= n; j++) out.push([r[i - 1][0] + ((r[i][0] - r[i - 1][0]) * j) / n, r[i - 1][1] + ((r[i][1] - r[i - 1][1]) * j) / n]);
  }
  return out;
};
const grow = (b: Box, m: number): Box => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });
const ov = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

describe('DJ-R4-MSTL — Screen 4: a freed MASTER L hangs clear of deck A’s leads', () => {
  const FREEING = MAP_PLUGS.filter((p) => p !== 'mst.xlrL' && PLUGS[p].fits.includes('paL.in'));
  it('there are moves that free it with deck A patched (the finding’s state)', () => {
    assert.ok(FREEING.length >= 3, FREEING.join());
    for (const p of FREEING) {
      const st = movedState(p, 'paL.in');
      assert.equal(st['mst.xlrL'], null);
      assert.ok(st['A.rcaL'] && st['A.rcaR']);
    }
  });
  for (const p of FREEING) {
    it(`${p} → PA L: MASTER L's cable ≥ 4 mm from deck A's leads except where it crosses them, its plug ≥ 4 mm from every run, off the gear`, () => {
      const st = movedState(p, 'paL.in');
      const h = D.drawnRun4('mst.xlrL', st);
      const box = D.loosePlugBox4('mst.xlrL', st);
      const bad: string[] = [];
      for (const q of ['A.rcaL', 'A.rcaR'] as PlugId[]) {
        const o = D.drawnRun4(q, st);
        const xs = crossings(h, o);
        assert.ok(xs.length <= 1, `${q}: crosses once at most`);
        let worst = Infinity;
        for (const pt of sample(h)) {
          if (xs.some((c) => Math.hypot(c[0] - pt[0], c[1] - pt[1]) < 14)) continue;
          worst = Math.min(worst, D.distToPolyline(o, pt[0], pt[1]) - D.cableHalf4('mst.xlrL') - D.cableHalf4(q));
        }
        if (worst < 4) bad.push(`cable vs ${q}: ${worst.toFixed(2)} mm`);
        // where it crosses, it crosses steeply (a hanging cable, within 30° of upright — not a graze)
        for (const c of xs) {
          const i = h.findIndex(([, y]) => y >= c[1]);
          const [x0, y0] = h[Math.max(0, i - 2)];
          const [x1, y1] = h[Math.min(h.length - 1, i + 2)];
          if (Math.abs(Math.atan2(x1 - x0, y1 - y0)) > (30 * Math.PI) / 180) bad.push(`crosses ${q} at ${((Math.atan2(x1 - x0, y1 - y0) * 180) / Math.PI).toFixed(0)}° off vertical`);
        }
      }
      for (const q of MAP_PLUGS) {
        if (q === 'mst.xlrL' || !st[q]) continue;
        if (D.cableInBox(D.drawnRun4(q, st), grow(box, 4), D.cableHalf4(q)) > 0) bad.push(`the plug within 4 mm of ${q}`);
      }
      for (const b of [...MAP_BODIES, D.FRONT4]) if (ov(grow(box, 4), b) > 0) bad.push(`the plug within 4 mm of the gear at (${b.x}, ${b.y})`);
      for (const q of MAP_PLUGS) if (q !== 'mst.xlrL' && !st[q] && ov(grow(box, 4), D.loosePlugBox4(q, st)) > 0) bad.push(`the plug on ${q}'s plug`);
      // drawn where the geometry says: the run ends at the plug's boot
      assert.ok(Math.abs(h[h.length - 1][1] - box.y) < 1e-9 && Math.abs(h[h.length - 1][0] - (box.x + box.w / 2)) < 1e-9);
      assert.deepEqual(bad, []);
    });
  }
  it('R1: it HANGS — from its own socket, always downward, never steeper than 40°, and its plug pins-down (the last stretch vertical)', () => {
    const st = movedState('phones', 'paL.in');
    const h = D.hang4('mst.xlrL', st);
    const s = fixedEnd('mst.xlrL')!;
    assert.deepEqual(h[0], [s.x, s.y]);
    for (let i = 1; i < h.length; i++) {
      const dy = h[i][1] - h[i - 1][1];
      const dx = h[i][0] - h[i - 1][0];
      assert.ok(dy > 0, 'always down');
      assert.ok(Math.abs(Math.atan2(dx, dy)) <= (40 * Math.PI) / 180, `segment ${i}: ${((Math.atan2(dx, dy) * 180) / Math.PI).toFixed(1)}° off vertical`);
    }
    const [xa, ya] = h[h.length - 2];
    const [xb, yb] = h[h.length - 1];
    assert.ok(Math.abs(Math.atan2(xb - xa, yb - ya)) < (3 * Math.PI) / 180, 'it ends vertical');
    assert.deepEqual(D.DRAPE_MST_L, { dx: -53, from: 572, over: 104, boot: 678 });
  });
  it('with deck A unpatched it hangs under its own socket as before; MASTER R keeps its pocket when both are loose', () => {
    const un = D.loosePlugBox4('mst.xlrL');
    assert.ok(Math.abs(un.x + un.w / 2 - fixedEnd('mst.xlrL')!.x) < 2);
    const st: State = { ...Object.fromEntries(MAP_PLUGS.map((q) => [q, BUILT_PLUGS[q]])), 'mst.xlrL': null, 'mst.xlrR': null };
    const R = D.loosePlugBox4('mst.xlrR', st);
    assert.ok(Math.abs(R.x + R.w / 2 - (fixedEnd('mst.xlrR')!.x + D.DRAPE_MST_R.dx)) < 2, 'R drapes into the pocket (DJ-R2-11)');
  });
});

describe('DJ-R4-LINE — Screen 4: the RCA leads run clear of the PHONO / LINE words', () => {
  const WORDS = D.inputWordBoxes4();
  it('the words are over each column’s L socket, inside the CH bracket, next to it', () => {
    assert.equal(WORDS.length, 4);
    for (const { k, box } of WORDS) {
      const col = k.split(' ')[0] as 'ch1.line';
      const L = MIXER_REAR_JACKS[`${col}.L`];
      const cx = 375 + L.x; // MAP.mixer.x
      assert.ok(Math.abs(box.x + box.w / 2 - cx) < 1e-9, `${k} centred on its socket`);
      const sockTop = 526 + L.y - 5.5; // MAP.mixer.y; the 11 mm socket's rim
      const hair = 526 + L.y - 13; // the CH bracket's hairline
      assert.ok(box.y + box.h <= sockTop - 1, `${k} above its socket's rim`);
      assert.ok(sockTop - (box.y + box.h) <= 3, `${k} right next to its socket`);
      assert.ok(box.y >= hair + 1, `${k} under the bracket's hairline`);
    }
    const rp = read(`${DJ}art/RearPanels.tsx`);
    assert.match(rp, /<Leg x=\{J\[`\$\{k\}\.L`\]\.x\} y=\{J\[`\$\{k\}\.L`\]\.y \+ INPUT_WORDS_ABOVE_DY\} t=\{k\.endsWith\('phono'\) \? 'PHONO' : 'LINE'\} size=\{LEG_S\} \/>/);
    assert.match(rp, /<Leg x=\{J\[`\$\{k\}\.R`\]\.x\} y=\{J\[`\$\{k\}\.R`\]\.y \+ 13\}/, 'other screens keep the words under the R socket');
    assert.equal(D.INPUT_WORDS_SIZE, 3.4);
    assert.match(rp, /const LEG_S = 3\.4;/);
    assert.match(read(`${DJ}art/SystemMap.tsx`), /<MixerRear x=\{MAP\.mixer\.x\} y=\{MAP\.mixer\.y\} on=\{deviceLive\(booth, 'mixer'\)\} masterWordsDx=\{MASTER_WORDS_DX4\} inputWordsAbove \/>/);
  });
  it('wired, and after every RCA move: no cable on Screen 4 runs within 1 mm of the words', () => {
    const states: [string, State][] = [['wired', Object.fromEntries(MAP_PLUGS.map((q) => [q, BUILT_PLUGS[q]]))]];
    for (const p of MAP_PLUGS.filter((q) => PLUGS[q].kind === 'rca')) for (const j of PLUGS[p].fits) states.push([`${p} → ${j}`, movedState(p, j)]);
    const bad: string[] = [];
    for (const [name, st] of states) for (const q of MAP_PLUGS) {
      const run = D.drawnRun4(q, st);
      for (const { k, box } of WORDS) if (D.cableInBox(run, grow(box, 1), D.cableHalf4(q)) > 0) bad.push(`${name}: ${q} over ${k}`);
    }
    assert.deepEqual(bad, []);
  });
  it('the finding: the old spot (under the R socket) WAS under the red lead — the move is what clears it', () => {
    const st = Object.fromEntries(MAP_PLUGS.map((q) => [q, BUILT_PLUGS[q]])) as State;
    const R = MIXER_REAR_JACKS['ch1.line.R'];
    const w = 4 * 3.4 * 0.62;
    const old: Box = { x: 375 + R.x - w / 2, y: 526 + R.y + 13 - 3.4 * 0.75, w, h: 3.4 * 0.75 + 0.3 };
    assert.ok(D.cableInBox(D.drawnRun4('A.rcaR', st), old, D.cableHalf4('A.rcaR')) > 0);
  });
});
