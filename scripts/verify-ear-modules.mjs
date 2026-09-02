// Node verification of the ear-training TRIAL FACTORIES: for many seeds,
// FFT-measure the rendered clips and prove the trial's declared correct answer
// matches what the audio actually contains. Run: npx tsx scripts/verify-ear-modules.mjs
import {
  powerSpectrumDb, bandDb, sumToMono, rmsDb,
} from '../src/features/ear/earDsp.ts';
import { M1_FREQUENCY, M2_EQ, M3_BAND, M4_NOISE, BANDS } from '../src/features/ear/modules/tone.ts';
import { M7_LOUDNESS, M10_COMPRESSION, M14_CLIPPING } from '../src/features/ear/modules/dynamics.ts';
import { M8_DELAY, M9_REVERB, M12_POLARITY, M13_COMB } from '../src/features/ear/modules/time.ts';
import { M5_DEFECTS } from '../src/features/ear/modules/defects.ts';
import { M6_STEREO } from '../src/features/ear/modules/spatial.ts';
import { M11_PITCH } from '../src/features/ear/modules/pitch.ts';
import { applyTrial, emptyModuleProgress } from '../src/features/ear/earProgress.ts';

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
  // Autocorrelation-free check: the "which delay" chips trial names N ms; the
  // clip minus the dry pluck alignment is hard without the dry, so verify by
  // construction: the echo lifts energy at (onset + delay) vs a dry render.
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
    }
  }
  ok(`delay-time trials honest (${good}/${total})`, good === total && total > 0);
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

console.log('— M9 Reverb: wet clips carry a tail the dry lacks; decay chips ordered —');
{
  const tailDb = (x) => rmsDb(x.slice(Math.round(x.length * 0.8)));
  let abOk = 0, abN = 0;
  for (const seed of SEEDS.slice(0, 8)) {
    const t = M9_REVERB.makeTrial(1, seed + 53);
    abN++;
    const wet = tailDb(mono(t.clips[t.correct].buf));
    const dry = tailDb(mono(t.clips[1 - t.correct].buf));
    if (wet - dry > 10) abOk++;
    else console.log(`    seed ${seed}: wet tail ${wet.toFixed(1)} dry ${dry.toFixed(1)}`);
  }
  ok(`dry-vs-wet honest (${abOk}/${abN})`, abOk === abN);
  // Short vs long decay: find one of each and compare late-tail energy.
  const findDecay = (want) => {
    for (let tries = 0; tries < 300; tries++) {
      const t = M9_REVERB.makeTrial(2, 70000 + tries * 7919);
      if (t.answers[t.correct].label === want) return mono(t.clips[0].buf);
    }
    return null;
  };
  const short = findDecay('Short');
  const long = findDecay('Long');
  ok(
    'long decay outsustains short in the late tail',
    short != null && long != null && tailDb(long) - tailDb(short) > 6,
    short && long ? `${(tailDb(long) - tailDb(short)).toFixed(1)}dB` : 'not found',
  );
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
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
