// Node verification of the ear-training TRIAL FACTORIES: for many seeds,
// FFT-measure the rendered clips and prove the trial's declared correct answer
// matches what the audio actually contains.
//
// Run from the repo root:  node scripts/verify-ear-modules.mjs
// (Node ≥ 22.15 strips the .ts types natively. The modules import each other
// WITHOUT extensions — Metro/tsx guess them, Node's ESM loader does not — so a
// resolve hook below appends ".ts" for relative specifiers. `npx tsx` still
// works too.)
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL)) + '.ts';
      if (existsSync(candidate)) return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

// Dynamic imports: static ones would be linked BEFORE the hook registers.
const { powerSpectrumDb, bandDb, sumToMono, rmsDb } = await import('../src/features/ear/earDsp.ts');
const { M1_FREQUENCY, M2_EQ, M3_BAND, M4_NOISE, BANDS } = await import('../src/features/ear/modules/tone.ts');
const { M7_LOUDNESS, M10_COMPRESSION, M14_CLIPPING } = await import('../src/features/ear/modules/dynamics.ts');
const { M8_DELAY, M9_REVERB, M12_POLARITY, M13_COMB } = await import('../src/features/ear/modules/time.ts');
const { M5_DEFECTS } = await import('../src/features/ear/modules/defects.ts');
const { M6_STEREO } = await import('../src/features/ear/modules/spatial.ts');
const { M11_PITCH } = await import('../src/features/ear/modules/pitch.ts');
const { EAR_MODULES } = await import('../src/features/ear/modules/registry.ts');
const { applyTrial, emptyModuleProgress } = await import('../src/features/ear/earProgress.ts');

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ✓', name, detail); }
  else { fail++; console.log('  ✗ FAIL', name, detail); }
};
const mono = (b) => (b.l ? sumToMono(b) : b);
const peakHz = (buf) => {
  const { freqs, db } = powerSpectrumDb(mono(buf));
  let m = 1;
  for (let i = 2; i < db.length; i++) if (db[i] > db[m]) m = i;
  return freqs[m];
};
const parseHz = (label) =>
  label.includes('kHz') ? parseFloat(label) * 1000 : parseFloat(label);

const SEEDS = Array.from({ length: 12 }, (_, i) => 1000 + i * 7919);

console.log('— registry: every module carries the shell contract —');
{
  ok('14 modules registered', EAR_MODULES.length === 14);
  ok('every module has a LISTEN FOR objective', EAR_MODULES.every((m) => typeof m.listenFor === 'string' && m.listenFor.length > 20));
  ok('every module names one level per ladder rung', EAR_MODULES.every((m) => m.levelNames.length === m.levels));
  // Every trial's correct index must point INSIDE its answers, near indices too.
  let bad = 0, n = 0;
  for (const m of EAR_MODULES) {
    for (let level = 1; level <= m.levels; level++) {
      for (const seed of SEEDS.slice(0, 4)) {
        const t = m.makeTrial(level, seed + level * 101);
        n++;
        if (t.correct < 0 || t.correct >= t.answers.length) bad++;
        if ((t.near ?? []).some((i) => i < 0 || i >= t.answers.length || i === t.correct)) bad++;
        if (t.seeIt.kind !== 'levels' && t.seeIt.clips.some((c) => c < 0 || c >= t.clips.length)) bad++;
      }
    }
  }
  ok(`answer/near/seeIt indices in range (${n - bad}/${n})`, bad === 0);
}

console.log('— M1 Frequency: declared answer matches the spectral peak —');
{
  let good = 0, total = 0, hlGood = 0, hlTotal = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 4; level++) {
      const t = M1_FREQUENCY.makeTrial(level, seed + level);
      if (t.question.startsWith('Which frequency')) {
        total++;
        const want = parseHz(t.answers[t.correct].label);
        const got = peakHz(t.clips[0].buf);
        if (Math.abs(Math.log2(got / want)) < 0.05) good++;
      } else if (t.question.startsWith('Which tone is higher')) {
        hlTotal++;
        const pa = peakHz(t.clips[0].buf), pb = peakHz(t.clips[1].buf);
        const higherIdx = pa > pb ? 0 : 1;
        if (higherIdx === t.correct) hlGood++;
      } else {
        total++;
        const m = /Which clip is (.+)\?/.exec(t.question);
        const want = parseHz(m[1]);
        const got = peakHz(t.clips[t.correct].buf);
        if (Math.abs(Math.log2(got / want)) < 0.05) good++;
      }
    }
  }
  ok(`name/find trials honest (${good}/${total})`, good === total && total > 0);
  ok(`higher/lower trials honest (${hlGood}/${hlTotal})`, hlGood === hlTotal && hlTotal > 0);
}

console.log('— M1 sub-bass opt-out —');
{
  let violations = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 4; level++) {
      const t = M1_FREQUENCY.makeTrial(level, seed * 3 + level, { subBassOk: false });
      for (const a of t.answers) {
        const hz = parseHz(a.label);
        if (Number.isFinite(hz) && hz <= 80) violations++;
      }
    }
  }
  ok('no ≤80 Hz answers when subBassOk=false', violations === 0, `${violations} violations`);
}

console.log('— M2 EQ: B really differs from A at the stated frequency, in the stated direction —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 4; level++) {
      const t = M2_EQ.makeTrial(level, seed + 31 * level);
      total++;
      const m = /([+-]?\d+) dB .* at ([\d.]+ ?k?Hz)/.exec(t.reveal);
      const gain = parseInt(m[1], 10);
      const freq = parseHz(m[2]);
      const dry = mono(t.clips[0].buf), wet = mono(t.clips[1].buf);
      const delta = bandDb(wet, Math.min(freq, 16000), 0.33) - bandDb(dry, Math.min(freq, 16000), 0.33);
      // RMS re-match shifts broadband level; direction must survive and the
      // magnitude must be a real fraction of the stated move.
      if (Math.sign(delta) === Math.sign(gain) && Math.abs(delta) > Math.abs(gain) * 0.3) good++;
      else console.log(`    seed ${seed} L${level}: stated ${gain}dB@${freq}, measured ${delta.toFixed(1)}dB`);
    }
  }
  ok(`EQ moves verified (${good}/${total})`, good === total && total > 0);
}

console.log('— M2/M7/M8: "how much / how long" chips are not answerable from the level alone —');
{
  const distinct = (mod, level, startsWith, tries = 60) => {
    const set = new Set();
    for (let i = 0; i < tries; i++) {
      const t = mod.makeTrial(level, 5000 + i * 7919);
      if (t.question.startsWith(startsWith)) set.add(t.answers[t.correct].label);
    }
    return set;
  };
  const eq3 = distinct(M2_EQ, 3, 'By about how much');
  ok(`M2 L3 amount varies (${[...eq3].join(', ')})`, eq3.size >= 2);
  const eq1 = distinct(M2_EQ, 1, 'By about how much');
  ok('M2 L1 never asks amount (only one magnitude exists there)', eq1.size === 0);
  const l3 = distinct(M7_LOUDNESS, 3, 'By about how much');
  ok(`M7 L3 magnitude varies (${[...l3].join(', ')})`, l3.size >= 2);
  const l1 = distinct(M7_LOUDNESS, 1, 'By about how much');
  ok('M7 L1 asks direction only', l1.size === 0);
  const d2 = distinct(M8_DELAY, 2, 'About how long');
  ok(`M8 L2 delay-time chips vary (${[...d2].join(', ')})`, d2.size >= 2);
  // Ladder floor kept: the AB "which is louder?" trial at L4 is still 1 dB.
  let abOk = true;
  for (let i = 0; i < 40; i++) {
    const t = M7_LOUDNESS.makeTrial(4, 9000 + i * 104729);
    if (t.question.startsWith('Which is louder') && !/ is 1 dB louder/.test(t.reveal)) abOk = false;
  }
  ok('M7 L4 direction trials stay at the 1 dB floor', abOk);
}

console.log('— M3 Band: the declared band moved more than any other —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 4; level++) {
      const t = M3_BAND.makeTrial(level, seed + 63 * level);
      total++;
      const dry = mono(t.clips[0].buf), wet = mono(t.clips[1].buf);
      const deltas = t.answers.map((a) => {
        const band = BANDS.find((b) => b.label === a.label);
        const c = Math.min(band.c, 16000);
        const oct = Math.log2(Math.min(band.hi, 20000) / band.lo);
        return Math.abs(bandDb(wet, c, oct) - bandDb(dry, c, oct));
      });
      const maxIdx = deltas.indexOf(Math.max(...deltas));
      if (maxIdx === t.correct || (t.near ?? []).includes(maxIdx)) good++;
      else console.log(`    seed ${seed} L${level}: said ${t.answers[t.correct].label}, biggest move ${t.answers[maxIdx].label}`);
    }
  }
  ok(`band trials verified (${good}/${total})`, good === total && total > 0);
}

console.log('— M4 Noise/Waveform: slopes + tonality match the declared answer —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 3; level++) {
      const t = M4_NOISE.makeTrial(level, seed + 127 * level);
      const label = t.answers[t.correct].label.toLowerCase();
      const buf = mono(t.clips[t.question.includes('pink') && t.clips.length === 2 ? t.correct : 0].buf);
      total++;
      const slope = bandDb(buf, 6000) - bandDb(buf, 750); // 3 octaves
      if (t.question.includes('pink noise?')) {
        // A/B pair: correct clip must measure pink (−9±5 over 3 oct).
        if (slope < -4 && slope > -14) good++;
        else console.log(`    pink A/B seed ${seed}: slope ${slope.toFixed(1)}`);
      } else if (label.includes('white')) {
        if (Math.abs(slope) < 3) good++; else console.log(`    white slope ${slope.toFixed(1)}`);
      } else if (label.includes('pink')) {
        if (slope < -4 && slope > -14) good++; else console.log(`    pink slope ${slope.toFixed(1)}`);
      } else if (label.includes('brown')) {
        if (slope < -14) good++; else console.log(`    brown slope ${slope.toFixed(1)}`);
      } else {
        // Tones: strong single-peak concentration for sine; harmonics otherwise.
        const f0 = peakHz(buf);
        const h2 = bandDb(buf, f0 * 2, 0.1) - bandDb(buf, f0, 0.1);
        const h3 = bandDb(buf, f0 * 3, 0.1) - bandDb(buf, f0, 0.1);
        if (label.includes('sine')) {
          if (h2 < -40 && h3 < -40) good++; else console.log(`    sine h2 ${h2.toFixed(0)} h3 ${h3.toFixed(0)}`);
        } else if (label.includes('square') || label.includes('triangle')) {
          // Odd-harmonic waves: 3rd well above 2nd.
          if (h3 - h2 > 10) good++; else console.log(`    ${label} h3-h2 ${(h3 - h2).toFixed(0)}`);
        } else {
          // Saw: even harmonic genuinely present.
          if (h2 > -30) good++; else console.log(`    saw h2 ${h2.toFixed(0)}`);
        }
      }
    }
  }
  ok(`noise/waveform trials verified (${good}/${total})`, good === total && total > 0);
  // Noise trials ask the view for slope guides; tone trials must not.
  let guideOk = true;
  for (let i = 0; i < 40; i++) {
    const t = M4_NOISE.makeTrial(2, 300 + i * 7919);
    const isNoise = /noise/i.test(t.answers[t.correct].label);
    if (Boolean(t.seeIt.slopeGuides) !== isNoise) guideOk = false;
  }
  ok('slope guides requested for noise trials only', guideOk);
}

console.log('— presentation loudness: all clips normalized (M1 LF makeup exempt ≤250 Hz) —');
{
  let bad = 0, checked = 0;
  for (const seed of SEEDS.slice(0, 6)) {
    for (const [modu, lvl] of [[M2_EQ, 2], [M3_BAND, 2], [M4_NOISE, 2]]) {
      const t = modu.makeTrial(lvl, seed + 501);
      for (const c of t.clips) {
        checked++;
        const db = rmsDb(mono(c.buf));
        if (Math.abs(db + 20) > 1.0) { bad++; console.log(`    ${modu.id} clip ${c.label}: ${db.toFixed(2)} dBFS`); }
      }
    }
  }
  ok(`clip RMS −20 dBFS ±1 (${checked - bad}/${checked})`, bad === 0);
}

console.log('— M7 Loudness: the declared louder clip really is, by the declared dB —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS) {
    for (let level = 1; level <= 4; level++) {
      const t = M7_LOUDNESS.makeTrial(level, seed + 11 * level);
      total++;
      const dA = rmsDb(mono(t.clips[0].buf));
      const dB = rmsDb(mono(t.clips[1].buf));
      const m = /(A|B) is (\d+(?:\.\d+)?) dB louder/.exec(t.reveal);
      const louder = m[1] === 'A' ? dA : dB;
      const quieter = m[1] === 'A' ? dB : dA;
      const stated = parseFloat(m[2]);
      const measured = louder - quieter;
      if (Math.abs(measured - stated) < 0.2) good++;
      else console.log(`    seed ${seed} L${level}: stated ${stated}, measured ${measured.toFixed(2)}`);
    }
  }
  ok(`loudness deltas exact (${good}/${total})`, good === total && total > 0);
}

console.log('— M10 Compression: compressed clips have flatter loud/soft envelopes, matched RMS —');
{
  const crest = (x) => {
    // Peak-envelope spread: dB gap between the 95th and 40th percentile of
    // 10 ms window peaks — big for punchy dry drums, smaller when squashed.
    const w = 480;
    const peaks = [];
    for (let i = 0; i + w < x.length; i += w) {
      let p = 0;
      for (let j = i; j < i + w; j++) p = Math.max(p, Math.abs(x[j]));
      peaks.push(p);
    }
    peaks.sort((a, b) => a - b);
    const q = (f) => 20 * Math.log10(Math.max(peaks[Math.floor(peaks.length * f)], 1e-9));
    return q(0.95) - q(0.4);
  };
  let good = 0, total = 0, rmsBad = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    const t = M10_COMPRESSION.makeTrial(1, seed + 77); // none vs heavy AB
    total++;
    const cA = crest(mono(t.clips[0].buf));
    const cB = crest(mono(t.clips[1].buf));
    const compressedIdx = cA < cB ? 0 : 1;
    if (compressedIdx === t.correct) good++;
    else console.log(`    seed ${seed}: crest A ${cA.toFixed(1)} B ${cB.toFixed(1)}, said ${t.correct}`);
    if (Math.abs(rmsDb(mono(t.clips[0].buf)) - rmsDb(mono(t.clips[1].buf))) > 1) rmsBad++;
  }
  ok(`heavy compression detectable by envelope, not level (${good}/${total})`, good === total && total > 0);
  ok('AB pairs loudness-matched within 1 dB', rmsBad === 0, `${rmsBad} leaked`);
  // Near credit: L2 moderate↔heavy adjacent, never none.
  let nearOk = true;
  for (let i = 0; i < 40; i++) {
    const t = M10_COMPRESSION.makeTrial(2, 400 + i * 7919);
    const label = t.answers[t.correct].label;
    const nearLabels = (t.near ?? []).map((k) => t.answers[k].label);
    if (label === 'None' && nearLabels.length) nearOk = false;
    if (label === 'Moderate' && !nearLabels.includes('Heavy')) nearOk = false;
    if (nearLabels.includes('None')) nearOk = false;
  }
  ok('M10 L2 adjacent-intensity half credit (none excluded)', nearOk);
}

console.log('— M14 Clipping: severity orders the flattened-peak density; ABX honest —');
{
  const flatness = (x) => {
    // Fraction of samples pinned within 2% of the clip's own max.
    let m = 0;
    for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
    let pinned = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > m * 0.98) pinned++;
    return pinned / x.length;
  };
  let orderedOk = 0, abxOk = 0, n = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    n++;
    const bySeverity = ['Clean', 'Mild', 'Moderate', 'Severe'].map((want) => {
      for (let tries = 0; tries < 200; tries++) {
        const t = M14_CLIPPING.makeTrial(3, seed * 13 + tries);
        if (t.answers[t.correct].label === want) return flatness(mono(t.clips[0].buf));
      }
      return null;
    });
    if (bySeverity.every((v) => v != null) && bySeverity[0] < bySeverity[2] && bySeverity[2] < bySeverity[3] && bySeverity[1] > bySeverity[0]) orderedOk++;
    else console.log(`    seed ${seed}: flatness ${bySeverity.map((v) => v?.toFixed(5)).join(' ')}`);
    const abx = M14_CLIPPING.makeTrial(4, seed + 999);
    const x = mono(abx.clips[2].buf);
    const same = (y) => {
      let diff = 0;
      for (let i = 0; i < x.length; i += 97) diff += Math.abs(x[i] - y[i]);
      return diff < 1e-6;
    };
    const matches = [same(mono(abx.clips[0].buf)), same(mono(abx.clips[1].buf))];
    if (matches[abx.correct] && !matches[1 - abx.correct]) abxOk++;
  }
  ok(`clipping severity orders peak flattening (${orderedOk}/${n})`, orderedOk === n);
  ok(`ABX X really is a copy of the declared clip (${abxOk}/${n})`, abxOk === n);
}

console.log('— M8 Delay: the declared echo really lands at the declared time —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    for (let level = 1; level <= 4; level++) {
      const t = M8_DELAY.makeTrial(level, seed + 17 * level);
      if (!t.question.startsWith('About how long')) continue;
      total++;
      const stated = parseInt(t.answers[t.correct].label, 10);
      const x = mono(t.clips[0].buf);
      // Normalized autocorrelation peak at the stated lag vs neighbours.
      const lag = Math.round((stated / 1000) * 48000);
      const score = (L) => {
        let s = 0;
        for (let i = 0; i + L < x.length; i += 3) s += x[i] * x[i + L];
        return s;
      };
      const at = score(lag);
      const off = Math.max(score(Math.round(lag * 0.62)), score(Math.round(lag * 1.43)));
      if (at > off) good++;
      else console.log(`    seed ${seed} L${level}: stated ${stated}ms, autocorr at=${at.toExponential(2)} off=${off.toExponential(2)}`);
      // The see-it markers must be exactly the stated delay apart.
      const [m0, m1] = t.seeIt.markersSec ?? [];
      if (m1 == null || Math.abs((m1 - m0) * 1000 - stated) > 0.5) { good--; console.log(`    seed ${seed} L${level}: markers ${m0}/${m1} vs ${stated} ms`); }
    }
  }
  ok(`delay-time trials honest, markers match (${good}/${total})`, good === total && total > 0);
}

console.log('— M13 Comb: the declared combed clip has the notches —');
{
  let good = 0, total = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    for (let level = 1; level <= 3; level++) {
      const t = M13_COMB.makeTrial(level, seed + 29 * level);
      total++;
      const m = /copy ([\d.]+) ms/.exec(t.reveal);
      const d = parseFloat(m[1]);
      // Construction proof, immune to sparse spectra: the combed clip must be
      // (up to one gain) dry + g·dry[n−dSamp]. Least-squares fit; scan ±3
      // samples because the reveal rounds the delay to 0.1 ms. A plain
      // combed≈s·dry fit must be far worse — that's the comb factor itself.
      const g = Math.pow(10, [0, -3, -6, -9][Math.min(level, 4) - 1] / 20);
      const combIdx = t.correct;
      const combed = mono(t.clips[combIdx].buf);
      const other = mono(t.clips[1 - combIdx].buf);
      const fitResid = (dd) => {
        // Skip 20 ms at each edge: fadeEdges ramps each clip separately, so
        // the linear comb model holds only in the interior.
        let cy = 0, yy = 0, cc = 0;
        const from = Math.max(dd, 960);
        for (let i = from; i < combed.length - 960; i++) {
          const y = dd < 0 ? other[i] : other[i] + g * other[i - dd];
          cy += combed[i] * y;
          yy += y * y;
          cc += combed[i] * combed[i];
        }
        const s = cy / yy;
        return Math.max(0, cc - 2 * s * cy + s * s * yy) / cc;
      };
      const dSamp0 = Math.round((d / 1000) * 48000);
      let best = Infinity;
      for (let dd = dSamp0 - 3; dd <= dSamp0 + 3; dd++) best = Math.min(best, fitResid(dd));
      const plain = fitResid(-1);
      if (best < 1e-3 && plain > best * 20) good++;
      else console.log(`    seed ${seed} L${level}: ${d}ms comb-fit resid ${best.toExponential(1)}, plain ${plain.toExponential(1)}`);
    }
  }
  ok(`comb trials honest (${good}/${total})`, good === total && total > 0);
}

console.log('— M12 Polarity: flipped sums lose level (L1) or low end (L2+) —');
{
  let l1ok = 0, l1n = 0, lfOk = 0, lfN = 0;
  for (const seed of SEEDS.slice(0, 10)) {
    const t1 = M12_POLARITY.makeTrial(1, seed + 41);
    if (t1.question.includes('fuller')) {
      l1n++;
      const full = rmsDb(mono(t1.clips[t1.correct].buf));
      const cancelled = rmsDb(mono(t1.clips[1 - t1.correct].buf));
      if (full - cancelled > 30) l1ok++;
      else console.log(`    L1 seed ${seed}: full ${full.toFixed(1)} vs cancelled ${cancelled.toFixed(1)}`);
    }
    const t2 = M12_POLARITY.makeTrial(2, seed + 43);
    if (t2.question.includes('fuller')) {
      lfN++;
      const fullLf = bandDb(mono(t2.clips[t2.correct].buf), 80, 1.5);
      const flipLf = bandDb(mono(t2.clips[1 - t2.correct].buf), 80, 1.5);
      if (fullLf - flipLf > 6) lfOk++;
      else console.log(`    L2 seed ${seed}: LF full ${fullLf.toFixed(1)} vs flipped ${flipLf.toFixed(1)}`);
    }
  }
  ok(`L1 flip cancels ≥30 dB (${l1ok}/${l1n})`, l1n === 0 || l1ok === l1n);
  ok(`L2 flip loses ≥6 dB of low end (${lfOk}/${lfN})`, lfN === 0 || lfOk === lfN);
}

console.log('— M9 Reverb: wet clips carry a tail the dry lacks; quoted RT60s are true —');
{
  const tailDb = (x) => rmsDb(x.slice(Math.round(x.length * 0.8)));
  // L1 spaces run at their TRUE RT60 (a 0.4 s room is honestly silent by
  // the end of the clip), so probe the window right after the direct sound
  // ends (last pluck 0.8 s + 0.4 s ring → 1.3–1.7 s).
  const earlyTailDb = (x) => rmsDb(x.slice(Math.round(1.3 * 48000), Math.round(1.7 * 48000)));
  let abOk = 0, abN = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    const t = M9_REVERB.makeTrial(1, seed + 53);
    abN++;
    const wet = earlyTailDb(mono(t.clips[t.correct].buf));
    const dry = earlyTailDb(mono(t.clips[1 - t.correct].buf));
    if (wet - dry > 10) abOk++;
    else console.log(`    seed ${seed}: wet tail ${wet.toFixed(1)} dry ${dry.toFixed(1)}`);
  }
  ok(`dry-vs-wet honest (${abOk}/${abN})`, abOk === abN);
  // Decay chips: measure the late-tail decay RATE of the render and compare
  // with the RT60 the feedback copy claims. Direct sound is over by ~1.25 s
  // (second pluck 0.8 s + 0.4 s ring); 100 ms RMS windows on the tail after.
  const winDb = (x, atSec) => rmsDb(x.slice(Math.round(atSec * 48000), Math.round((atSec + 0.1) * 48000)));
  const findDecay = (want) => {
    for (let tries = 0; tries < 300; tries++) {
      const t = M9_REVERB.makeTrial(2, 70000 + tries * 7919);
      if (t.answers[t.correct].label === want) return { x: mono(t.clips[0].buf), reveal: t.reveal };
    }
    return null;
  };
  const short = findDecay('Short'), medium = findDecay('Medium'), long = findDecay('Long');
  ok(
    'long decay outsustains short in the late tail',
    short != null && long != null && tailDb(long.x) - tailDb(short.x) > 6,
    short && long ? `${(tailDb(long.x) - tailDb(short.x)).toFixed(1)}dB` : 'not found',
  );
  const rtOf = (x, t0, t1) => (60 * (t1 - t0)) / (winDb(x, t0) - winDb(x, t1));
  const rtM = medium ? rtOf(medium.x, 1.4, 1.9) : NaN; // claimed 1.2 s
  const rtL = long ? rtOf(long.x, 1.6, 2.6) : NaN; // claimed 2.5 s
  const rtS = short ? rtOf(short.x, 1.3, 1.5) : NaN; // claimed 0.5 s
  ok('Medium tail decays at RT60 ≈ 1.2 s (0.8–1.8)', rtM > 0.8 && rtM < 1.8, `measured ${rtM.toFixed(2)} s`);
  ok('Long tail decays at RT60 ≈ 2.5 s (1.7–3.5)', rtL > 1.7 && rtL < 3.5, `measured ${rtL.toFixed(2)} s`);
  ok('Short tail decays at RT60 ≈ 0.5 s (0.3–0.9)', rtS > 0.3 && rtS < 0.9, `measured ${rtS.toFixed(2)} s`);
  ok('decay reveals quote the RT60', [short, medium, long].every((d) => d && /RT60 ≈ [\d.]+ s/.test(d.reveal)));
  // Spec: room↔chamber and hall↔plate confusions earn half credit at L3–L4.
  let hallNearPlate = false;
  for (let i = 0; i < 60 && !hallNearPlate; i++) {
    const t = M9_REVERB.makeTrial(3, 800 + i * 7919);
    if (t.answers[t.correct].label.startsWith('Hall')) {
      hallNearPlate = (t.near ?? []).some((k) => t.answers[k].label.startsWith('Plate'));
    }
  }
  ok('L3 hall↔plate confusion earns half credit', hallNearPlate);
  // Every reverb reveal carries the emulation label.
  let emu = true;
  for (let level = 1; level <= 5; level++) for (let i = 0; i < 6; i++) if (!/emulation/.test(M9_REVERB.makeTrial(level, 111 + i * 7919 + level).reveal)) emu = false;
  ok('every reverb reveal says "emulation"', emu);
}

console.log('— M6 Stereo: images measure as declared (correlation / channel balance / width) —');
{
  const stats = (buf) => {
    const { l, r } = buf;
    let lr = 0, ll = 0, rr = 0;
    for (let i = 0; i < l.length; i += 2) {
      lr += l[i] * r[i];
      ll += l[i] * l[i];
      rr += r[i] * r[i];
    }
    return { corr: lr / Math.sqrt(ll * rr), balDb: 10 * Math.log10(ll / rr) };
  };
  const side = (buf) => {
    const { l, r } = buf;
    let s = 0, m = 0;
    for (let i = 0; i < l.length; i += 2) {
      s += (l[i] - r[i]) ** 2;
      m += (l[i] + r[i]) ** 2;
    }
    return 10 * Math.log10(s / m);
  };
  let good = 0, total = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    for (let level = 1; level <= 3; level++) {
      const t = M6_STEREO.makeTrial(level, seed + 19 * level);
      total++;
      const st = stats(t.clips[0].buf);
      const label = t.answers[t.correct].label;
      let pass = false;
      if (label === 'Left') pass = st.balDb > 6;
      else if (label === 'Right') pass = st.balDb < -6;
      else if (label.startsWith('Centered')) pass = st.corr > 0.99 && Math.abs(st.balDb) < 1;
      else if (label === 'Out of phase') pass = st.corr < -0.99;
      else if (label === 'Wide') pass = side(t.clips[0].buf) > -6 && st.corr < 0.9;
      else if (label === 'Narrow') pass = side(t.clips[0].buf) < -11 && st.corr > 0.8;
      if (pass) good++;
      else console.log(`    seed ${seed} L${level} ${label}: corr ${st.corr.toFixed(2)} bal ${st.balDb.toFixed(1)} side ${side(t.clips[0].buf).toFixed(1)}`);
    }
    const t4 = M6_STEREO.makeTrial(4, seed + 91);
    total++;
    const wider = side(t4.clips[0].buf) > side(t4.clips[1].buf) ? 0 : 1;
    if (wider === t4.correct) good++;
    else console.log(`    seed ${seed} L4: side A ${side(t4.clips[0].buf).toFixed(1)} B ${side(t4.clips[1].buf).toFixed(1)}, said ${t4.correct}`);
  }
  ok(`stereo trials honest (${good}/${total})`, good === total && total > 0);
}

console.log('— M5 Defects: tonal signatures + time-domain events measure as declared —');
{
  const find5 = (want, level) => {
    for (let tries = 0; tries < 400; tries++) {
      const t = M5_DEFECTS.makeTrial(level, 90000 + tries * 104729);
      if (t.answers[t.correct].label === want) return mono(t.clips[0].buf);
    }
    return null;
  };
  const humBuf = find5('Hum', 2);
  const buzzBuf = find5('Buzz', 2);
  ok(
    'hum is LF-dominated, buzz is not',
    humBuf != null && buzzBuf != null &&
      bandDb(humBuf, 2000, 1) - bandDb(humBuf, 60, 1) < -20 &&
      bandDb(buzzBuf, 2000, 1) - bandDb(buzzBuf, 60, 1) > bandDb(humBuf, 2000, 1) - bandDb(humBuf, 60, 1) + 15,
  );
  const dropBuf = find5('Dropout', 2);
  ok(
    'dropout has a silent hole',
    dropBuf != null &&
      (() => {
        const w = 480;
        let minDb = 0;
        for (let i = 0; i + w * 4 < dropBuf.length; i += w) {
          minDb = Math.min(minDb, rmsDb(dropBuf.slice(i, i + w * 4)));
        }
        return minDb < -55;
      })(),
  );
  const clipBuf = find5('Clipping', 2);
  ok(
    'clipping pins samples at a ceiling',
    clipBuf != null &&
      (() => {
        let m = 0;
        for (const v of clipBuf) m = Math.max(m, Math.abs(v));
        let pinned = 0;
        for (const v of clipBuf) if (Math.abs(v) > m * 0.985) pinned++;
        return pinned / clipBuf.length > 0.005;
      })(),
  );
  // RF (emulation) is a 217 Hz TDMA pulse train: line at 217 Hz well above
  // the gap halfway to the next line.
  const rfBuf = find5('RF interference (emulation)', 2);
  const rfLine = rfBuf ? bandDb(rfBuf, 217, 0.06) - bandDb(rfBuf, 325, 0.06) : -99;
  ok('RF emulation pulses at 217 Hz (line ≥ 10 dB over the gap)', rfLine > 10, `${rfLine.toFixed(1)} dB`);
  // Buried level check: at L4 the defect must actually sit well below the bed.
  const t4 = M5_DEFECTS.makeTrial(4, 123457);
  ok('L4 clips still presented at −20 dBFS', Math.abs(rmsDb(mono(t4.clips[0].buf)) + 20) < 1);
}

console.log('— M11 Pitch: the declared higher note is higher; intervals are the declared ratio —');
{
  const f0Of = (x) => {
    const { freqs, db } = powerSpectrumDb(x);
    // Fundamental = lowest strong peak (within 12 dB of max below 2 kHz).
    let max = -300;
    for (let i = 1; i < db.length; i++) if (db[i] > max) max = db[i];
    for (let i = 2; i < db.length - 1; i++) {
      if (freqs[i] < 60) continue;
      if (db[i] > max - 12 && db[i] > db[i - 1] && db[i] >= db[i + 1]) return freqs[i];
    }
    return 0;
  };
  let hlOk = 0, hlN = 0, ivOk = 0, ivN = 0;
  for (const seed of SEEDS.slice(0, 10)) {
    for (let level = 1; level <= 5; level++) {
      const t = M11_PITCH.makeTrial(level, seed + 23 * level);
      const fA = f0Of(mono(t.clips[0].buf));
      const fB = f0Of(mono(t.clips[1].buf));
      if (t.question.startsWith('Which note')) {
        hlN++;
        if ((fA > fB ? 0 : 1) === t.correct) hlOk++;
        else console.log(`    seed ${seed} L${level}: fA ${fA.toFixed(1)} fB ${fB.toFixed(1)} said ${t.correct}`);
      } else {
        ivN++;
        const semis = Math.round(12 * Math.log2(fB / fA));
        const wantLabel = t.answers[t.correct].label;
        const SEMI = { Unison: 0, 'Minor 2nd': 1, 'Major 2nd': 2, 'Minor 3rd': 3, 'Major 3rd': 4, 'Perfect 4th': 5, Tritone: 6, 'Perfect 5th': 7, 'Minor 6th': 8, 'Major 6th': 9, 'Minor 7th': 10, 'Major 7th': 11, Octave: 12 };
        if (semis === SEMI[wantLabel]) ivOk++;
        else console.log(`    seed ${seed} L${level}: measured ${semis} semis, declared ${wantLabel} (fA ${fA.toFixed(1)} fB ${fB.toFixed(1)})`);
      }
    }
  }
  ok(`higher/lower honest (${hlOk}/${hlN})`, hlOk === hlN && hlN > 0);
  ok(`intervals honest (${ivOk}/${ivN})`, ivOk === ivN && ivN > 0);
}

console.log('— ordered decks: "k steps low/high" feedback only where the deck really is a ladder —');
{
  let bad = 0, n = 0;
  for (const m of EAR_MODULES) {
    for (let level = 1; level <= m.levels; level++) {
      for (let i = 0; i < 6; i++) {
        const t = m.makeTrial(level, 2000 + i * 7919 + level * 31);
        if (!t.ordered) continue;
        n++;
        // A ladder must be strictly monotonic where it is numeric.
        const nums = t.answers.map((a) => parseFloat(a.label.replace(/[^\d.]/g, '')) * (a.label.includes('kHz') ? 1000 : 1));
        if (nums.every(Number.isFinite)) {
          for (let k = 1; k < nums.length; k++) if (!(nums[k] > nums[k - 1])) { bad++; console.log(`    ${m.id} L${level}: not ascending — ${t.answers.map((a) => a.label).join(', ')}`); break; }
        }
        if (!t.ordered.low || !t.ordered.high) bad++;
      }
    }
  }
  ok(`ordered ladders ascend (${n - bad}/${n} trials)`, bad === 0 && n > 0);
}

console.log('— determinism: same seed, same trial —');
{
  const a = M2_EQ.makeTrial(3, 424242);
  const b = M2_EQ.makeTrial(3, 424242);
  ok('same correct index + reveal', a.correct === b.correct && a.reveal === b.reveal);
  const c = M2_EQ.makeTrial(3, 424243);
  ok('different seed varies (question or reveal)', c.reveal !== a.reveal || c.question !== a.question);
}

console.log('— progress rules (spec §1) —');
{
  let p = emptyModuleProgress();
  for (let i = 0; i < 20; i++) p = applyTrial(p, 4, 1).next;
  ok('20/20 at L1 levels up to 2', p.level === 2 && p.mastered === 1);
  let down = { ...emptyModuleProgress(), level: 2 };
  for (let i = 0; i < 20; i++) down = applyTrial(down, 4, i % 3 === 0 ? 1 : 0).next;
  ok('<50% over 20 at L2 steps down to 1', down.level === 1);
  let mid = emptyModuleProgress();
  for (let i = 0; i < 19; i++) mid = applyTrial(mid, 4, 1).next;
  ok('19 perfect trials do NOT level up yet', mid.level === 1);
  const half = applyTrial(emptyModuleProgress(), 4, 0.5).next;
  ok('near credit logs 0.5', half.totalScore === 0.5 && half.streak === 0);
  // Ping-pong guard: promote 1→2 on 20 perfect, demote 2→1 on 20 bad, then
  // the FIRST trial back at L1 must not re-promote off the 19 stale wins.
  let pp = emptyModuleProgress();
  for (let i = 0; i < 20; i++) pp = applyTrial(pp, 4, 1).next;
  for (let i = 0; i < 20; i++) pp = applyTrial(pp, 4, 0).next;
  const afterDown = pp.level;
  pp = applyTrial(pp, 4, 1).next;
  ok('step-down is not reversed by the next single trial', afterDown === 1 && pp.level === 1);
  for (let i = 0; i < 19; i++) pp = applyTrial(pp, 4, 1).next;
  ok('…but 20 fresh wins at L1 promote again', pp.level === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
