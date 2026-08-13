/**
 * Workspaces — Rooms & Acoustics, SECOND TIER (owner buildout 2026-08-07):
 * Critical Distance · Schroeder Frequency · Speaker-Boundary Interference ·
 * Reflection Path. Same pattern as wave.ts (the exemplar): explicit reverse
 * solves, unit-aware fields, worked steps, honesty notes, glossary terms.
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const CRITICAL_DISTANCE: Workspace = {
  id: 'critdist',
  name: 'Critical Distance',
  tagline: 'Where direct sound = reverberant field',
  section: 'rooms',
  reportPrefix: 'DC',
  intro:
    'The critical distance (Dc) is where a source’s direct sound and the room’s reverberant ' +
    'field are equally loud. Closer than Dc you hear mostly the source; farther, mostly the ' +
    'room. It sets how far a mic or a listener can be before the room takes over.',
  whyItMatters:
    'Beyond Dc, moving farther barely changes level (the reverberant field is roughly uniform) ' +
    'but clarity keeps falling. Gain-before-feedback, intelligibility, and mic distance all live ' +
    'or die by where Dc sits — a live-sound rig fights a small Dc; a dry studio enjoys a large one.',
  example:
    'A 300 m³ room with RT60 = 0.8 s and an omni source (Q = 1): Dc = 0.057·√(1·300/0.8) ≈ 1.1 m. ' +
    'A cardioid pointing at the listener (Q ≈ 3) pushes Dc to ≈ 1.9 m — directivity buys distance.',
  mistakes: [
    'Treating Dc as a hard wall — it is the crossover point, not a cliff; the direct field keeps falling 6 dB per doubling on both sides of it.',
    'Ignoring directivity Q: a horn (Q = 10+) has a far larger Dc than an omni in the SAME room.',
    'Assuming a bigger room always means a smaller Dc — Dc grows with volume; it shrinks with reverberation (RT60).',
  ],
  warnings:
    'Classroom diffuse-field model: Dc = 0.057·√(Q·V / RT60) (metric). It assumes a reasonably ' +
    'diffuse reverberant field and a single directivity factor — real rooms and real polar ' +
    'patterns vary with frequency. Formal room acoustics is the domain of ISO 3382.',
  glossary: ['Critical distance', 'Reverberation Time', 'RT60', 'Directivity', 'Q factor', 'Reverberation'],
  fields: [
    { key: 'vol', name: 'ROOM VOLUME', quantity: 'volume', placeholder: '300', help: 'Length × width × height of the room.', warn: { test: (x) => x <= 0, msg: 'Volume must be greater than zero.' } },
    { key: 'rt60', name: 'REVERBERATION TIME (RT60)', quantity: 'time', defaultUnit: 's', placeholder: '0.8', help: 'Time for the reverberant tail to decay 60 dB.', warn: { test: (x) => x <= 0, msg: 'RT60 must be greater than zero.' } },
    { key: 'q', name: 'DIRECTIVITY (Q)', quantity: 'number', placeholder: '1', help: 'Source directivity factor: omni ≈ 1, cardioid ≈ 3, horn ≈ 10+.', warn: { test: (x) => x <= 0, msg: 'Directivity Q must be greater than zero.' } },
    { key: 'r', name: 'LISTENING DISTANCE', quantity: 'length', placeholder: '3', help: 'How far the listener or mic is from the source.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'dc',
      name: 'Critical distance from room + directivity',
      inputs: ['vol', 'rt60', 'q'],
      formula: 'Dc = 0.057 · √(Q · V / RT60)',
      plainFormula:
        'The critical distance equals 0.057 times the square root of the directivity times the room volume divided by the reverberation time.',
      explain:
        'The critical distance is where a source’s direct sound and the room’s reverberant field are equally loud — closer, you hear the source; farther, the room. A more directional source (higher Q) or a bigger, deader room pushes it out. Doubling the directivity multiplies the distance by about 1.4.',
      keySymbols: ['·', '√', 'Q', '/'],
      compute: (v) => {
        const dc = 0.057 * Math.sqrt((n(v.q) * n(v.vol)) / n(v.rt60));
        return [
          { label: 'CRITICAL DISTANCE Dc', value: dc, quantity: 'length' },
          { label: 'Dc IN FEET', value: dc / 0.3048, quantity: 'length', unit: 'ft', chainable: false },
        ];
      },
      steps: (v) => {
        const dc = 0.057 * Math.sqrt((n(v.q) * n(v.vol)) / n(v.rt60));
        return [
          `Dc = 0.057 × √(${fmt(n(v.q))} × ${fmt(n(v.vol))} ÷ ${fmt(n(v.rt60))}) = ${fmt(dc)} m (${fmt(dc / 0.3048)} ft).`,
          `Inside ${fmt(dc)} m the source dominates; beyond it the room does. Doubling the directivity Q multiplies Dc by √2 (≈ 1.41×).`,
        ];
      },
    },
    {
      key: 'drr',
      name: 'Direct-to-reverberant ratio at a distance',
      inputs: ['vol', 'rt60', 'q', 'r'],
      formula: 'D/R = 20·log₁₀(Dc / r)',
      plainFormula:
        'The direct-to-reverberant ratio in dB equals twenty times the base-ten log of the critical distance divided by the listening distance.',
      explain:
        'Compares direct sound to the reverberant field at a given distance. Positive dB means the source still leads; zero is exactly at the critical distance; negative means the room is louder. Beyond the critical distance, moving farther costs clarity, not level.',
      keySymbols: ['/', 'log₁₀'],
      note: 'Positive dB = direct sound still wins; 0 dB is exactly at Dc; negative = the room is louder than the source.',
      compute: (v) => {
        const dc = 0.057 * Math.sqrt((n(v.q) * n(v.vol)) / n(v.rt60));
        const drr = 20 * Math.log10(dc / n(v.r));
        return [
          { label: 'DIRECT-TO-REVERBERANT RATIO', value: drr, quantity: 'db' },
          { label: 'CRITICAL DISTANCE Dc', value: dc, quantity: 'length', chainable: false },
        ];
      },
      steps: (v) => {
        const dc = 0.057 * Math.sqrt((n(v.q) * n(v.vol)) / n(v.rt60));
        const drr = 20 * Math.log10(dc / n(v.r));
        return [
          `Dc = ${fmt(dc)} m for this room and directivity.`,
          `At ${fmt(n(v.r))} m: D/R = 20·log₁₀(${fmt(dc)} ÷ ${fmt(n(v.r))}) = ${fmt(drr)} dB.`,
          drr > 0 ? `The listener is inside Dc — direct sound still leads by ${fmt(drr)} dB.` : `The listener is beyond Dc — the reverberant field leads by ${fmt(-drr)} dB, so clarity, not level, is what you lose moving farther.`,
        ];
      },
    },
  ],
};

const SCHROEDER: Workspace = {
  id: 'schroeder',
  name: 'Schroeder Frequency',
  tagline: 'Where a room stops behaving modally',
  section: 'rooms',
  reportPrefix: 'SCH',
  intro:
    'The Schroeder frequency marks the transition between the two ways a room behaves: BELOW it ' +
    'the response is a sparse set of resonant modes you can count; ABOVE it the modes overlap ' +
    'into a dense, statistical field better described by reverberation than by individual peaks.',
  whyItMatters:
    'It tells you which toolset applies. Below Schroeder you fight specific room modes (placement, ' +
    'bass traps, EQ of individual peaks); above it you manage diffusion and absorption statistically. ' +
    'Small rooms push Schroeder high — which is why small control rooms are a low-frequency battle.',
  example:
    'A 50 m³ control room with RT60 = 0.4 s: f_s = 2000·√(0.4/50) ≈ 179 Hz. Everything below ~180 Hz ' +
    'is modal (treat modes individually); above it, treat the room statistically.',
  mistakes: [
    'Trying to EQ away a "room mode" above the Schroeder frequency — up there the modes overlap and move with position; broadband treatment wins, not a notch.',
    'Forgetting Schroeder rises as the room shrinks — a bedroom studio is modal well into the low mids.',
    'Reading f_s as exact; it is a soft transition band roughly one-third octave wide, not a single line.',
  ],
  warnings:
    'Statistical-acoustics estimate: f_s = 2000·√(RT60 / V) (metric, V in m³). It marks the centre ' +
    'of a gradual transition, not a hard boundary. Modal analysis (below) is geometry-based; the ' +
    'diffuse-field model (above) assumes good diffusion.',
  glossary: ['Room Mode', 'Standing wave', 'Reverberation Time', 'RT60', 'Modal density'],
  fields: [
    { key: 'vol', name: 'ROOM VOLUME', quantity: 'volume', placeholder: '50', help: 'Length × width × height of the room.', warn: { test: (x) => x <= 0, msg: 'Volume must be greater than zero.' } },
    { key: 'rt60', name: 'REVERBERATION TIME (RT60)', quantity: 'time', defaultUnit: 's', placeholder: '0.4', help: 'Time for the reverberant tail to decay 60 dB.', warn: { test: (x) => x <= 0, msg: 'RT60 must be greater than zero.' } },
    { key: 'fs', name: 'TARGET SCHROEDER FREQUENCY', quantity: 'frequency', placeholder: '200', help: 'A Schroeder frequency you want to design toward.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'fs',
      name: 'Schroeder frequency from room',
      inputs: ['vol', 'rt60'],
      formula: 'f_s = 2000 · √(RT60 / V)',
      plainFormula:
        'The Schroeder frequency equals 2000 times the square root of the reverberation time divided by the room volume.',
      explain:
        'Marks the transition between a room’s two behaviours: below it, sparse resonant modes you can count and treat individually; above it, the modes overlap into a dense field managed statistically with diffusion and absorption. Small rooms push it high — which is why small control rooms are a low-frequency battle.',
      keySymbols: ['·', '√', '/'],
      compute: (v) => {
        const fs = 2000 * Math.sqrt(n(v.rt60) / n(v.vol));
        return [
          { label: 'SCHROEDER FREQUENCY', value: fs, quantity: 'frequency' },
          { label: 'MODAL REGION (below)', value: fs, quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const fs = 2000 * Math.sqrt(n(v.rt60) / n(v.vol));
        return [
          `f_s = 2000 × √(${fmt(n(v.rt60))} ÷ ${fmt(n(v.vol))}) = ${fmt(fs)} Hz.`,
          `Below ~${fmt(fs)} Hz the room is MODAL — count and treat individual resonances. Above it, treat the room statistically (diffusion + broadband absorption).`,
        ];
      },
    },
    {
      key: 'volForFs',
      name: 'Room volume for a target Schroeder frequency (reverse)',
      inputs: ['fs', 'rt60'],
      formula: 'V = RT60 · (2000 / f_s)²',
      plainFormula:
        'The required room volume equals the reverberation time times the square of 2000 divided by the target Schroeder frequency.',
      explain:
        'The reverse: how big a room must be, at a given reverberation time, to bring the modal transition down to a target frequency. Because the frequency depends on the square root of volume, lowering it needs dramatically more space — halving the Schroeder frequency takes about four times the volume.',
      keySymbols: ['·', '/', 'x²'],
      note: 'How big a room must be (at this RT60) to bring the modal transition down to your target.',
      compute: (v) => {
        const vol = n(v.rt60) * Math.pow(2000 / n(v.fs), 2);
        return [
          { label: 'REQUIRED VOLUME', value: vol, quantity: 'volume' },
          { label: 'VOLUME IN CUBIC FEET', value: vol / 0.028316846592, quantity: 'volume', unit: 'ft3', chainable: false },
        ];
      },
      steps: (v) => {
        const vol = n(v.rt60) * Math.pow(2000 / n(v.fs), 2);
        return [
          `V = ${fmt(n(v.rt60))} × (2000 ÷ ${fmt(n(v.fs))})² = ${fmt(vol)} m³ (${fmt(vol / 0.028316846592)} ft³).`,
          `Lower Schroeder frequencies need dramatically bigger rooms — halving f_s needs ~4× the volume.`,
        ];
      },
    },
  ],
};

const BOUNDARY: Workspace = {
  id: 'boundary',
  name: 'Boundary Interference',
  tagline: 'Speaker-boundary cancellation (SBIR)',
  section: 'rooms',
  reportPrefix: 'SBIR',
  intro:
    'A speaker near a wall, floor, or console hears its own reflection. The direct and reflected ' +
    'sound comb-filter: cancellations where the round trip is a half wavelength out of phase, ' +
    'reinforcements where it is in phase. This is SBIR — the dip that plagues near-wall monitors.',
  whyItMatters:
    'The first, deepest cancellation is the one you feel: a boom or a suck-out in the low mids set ' +
    'purely by how far the driver sits from the boundary. You cannot EQ a true cancellation back ' +
    '(the energy is gone) — you move the speaker, or you treat the boundary.',
  example:
    'A woofer 0.6 m from the front wall (20 °C, c = 343 m/s): first cancellation at c/(4·0.6) ≈ 143 Hz, ' +
    'first reinforcement at c/(2·0.6) ≈ 286 Hz. Pulling it to 0.3 m moves the null up to ≈ 286 Hz.',
  mistakes: [
    'EQ-ing out a boundary cancellation — the null is destructive interference, not excess energy; cut nothing, just move the speaker.',
    'Measuring to the cabinet face instead of the driver — SBIR is set by the DRIVER-to-boundary path.',
    'Forgetting the floor and side walls: every nearby surface adds its own comb; the worst is usually the closest boundary.',
  ],
  warnings:
    'Ideal rigid-boundary comb model. Real boundaries absorb (softening the null) and each surface ' +
    'adds its own comb; the true in-room response is the sum. First cancellation = c/(4d), first ' +
    'reinforcement = c/(2d).',
  glossary: ['Comb Filtering', 'Reflection', 'Interference', 'Phase', 'Standing wave', 'Wavelength'],
  fields: [
    { key: 'd', name: 'DISTANCE TO BOUNDARY', quantity: 'length', defaultUnit: 'm', placeholder: '0.6', help: 'Driver-to-surface distance (wall, floor, or console).', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound.' },
    { key: 'fNull', name: 'TARGET NULL FREQUENCY', quantity: 'frequency', placeholder: '150', help: 'A cancellation frequency you want to place (or avoid).', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'sbir',
      name: 'Cancellations & reinforcements from boundary distance',
      inputs: ['d', 'temp'],
      formula: 'f_null = (2k−1)·c/(4d) · f_peak = k·c/(2d)',
      plainFormula:
        'Cancellations fall at odd multiples of the speed of sound over four times the boundary distance; reinforcements fall at whole multiples of the speed of sound over twice the distance.',
      explain:
        'A speaker near a wall, floor, or console hears its own reflection, and the two comb-filter. The first, deepest cancellation is set purely by the driver-to-boundary distance. You cannot EQ a true cancellation back — the energy is gone — so you move the speaker or treat the boundary.',
      keySymbols: ['−', '·', 'c', '/'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.d);
        return [
          { label: 'FIRST CANCELLATION', value: c / (4 * d), quantity: 'frequency' },
          { label: 'FIRST REINFORCEMENT', value: c / (2 * d), quantity: 'frequency' },
          { label: 'SECOND CANCELLATION', value: (3 * c) / (4 * d), quantity: 'frequency', chainable: false },
          { label: 'SECOND REINFORCEMENT', value: (2 * c) / (2 * d), quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.d);
        return [
          `c = ${fmt(c)} m/s at ${fmt(n(v.temp))} °C; boundary path is 2 × ${fmt(d)} m = ${fmt(2 * d)} m round trip.`,
          `First cancellation (½-wave out of phase) at c/(4d) = ${fmt(c / (4 * d))} Hz; nulls repeat at odd multiples.`,
          `First reinforcement (in phase) at c/(2d) = ${fmt(c / (2 * d))} Hz; peaks repeat at every multiple.`,
        ];
      },
    },
    {
      key: 'distForNull',
      name: 'Boundary distance for a chosen null (reverse)',
      inputs: ['fNull', 'temp'],
      formula: 'd = c / (4 · f_null)',
      plainFormula: 'The boundary distance equals the speed of sound divided by four times the target null frequency.',
      explain:
        'Where to place the driver so its first cancellation lands on — or, more usefully, clears — a chosen frequency. In practice you move the null out of your working range rather than onto it, by changing how far the driver sits from the boundary.',
      keySymbols: ['c', '/', '·'],
      note: 'Where to place the driver so its FIRST cancellation lands on (or clears) a given frequency.',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = c / (4 * n(v.fNull));
        return [
          { label: 'BOUNDARY DISTANCE', value: d, quantity: 'length' },
          { label: 'DISTANCE IN INCHES', value: d / 0.0254, quantity: 'length', unit: 'in', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = c / (4 * n(v.fNull));
        return [
          `d = ${fmt(c)} ÷ (4 × ${fmt(n(v.fNull))}) = ${fmt(d)} m (${fmt(d / 0.0254)} in).`,
          `Placing the driver this far from the boundary puts the first null at ${fmt(n(v.fNull))} Hz — usually you move the null OUT of your working range, not onto it.`,
        ];
      },
    },
  ],
};

const REFLECTION: Workspace = {
  id: 'reflection',
  name: 'Reflection Path',
  tagline: 'Path difference → comb filtering',
  section: 'rooms',
  reportPrefix: 'REFL',
  intro:
    'When a delayed copy of a sound arrives — off a floor, a desk, a wall — it combs with the ' +
    'direct sound. The comb’s spacing is set entirely by the extra distance the reflection travels. ' +
    'Enter the direct and reflected path lengths and read the interference pattern.',
  whyItMatters:
    'Early reflections colour every mic and every mix position. The path DIFFERENCE sets the first ' +
    'notch (1/2 the comb spacing) and how tight the teeth are; a longer difference packs more, ' +
    'closer-spaced notches. It is the physics behind the 3:1 rule and desk-bounce dips.',
  example:
    'A mic 0.30 m from a source with a desk reflection travelling 0.75 m total: Δd = 0.45 m, ' +
    'Δt ≈ 1.31 ms. Comb teeth every c/Δd ≈ 762 Hz, first notch at half that ≈ 381 Hz.',
  mistakes: [
    'Assuming a distant reflection is harmless — a long path difference makes the comb FINER (more notches per octave), not weaker.',
    'Forgetting that level matters too: a reflection much quieter than the direct sound makes shallow teeth; equal levels make total nulls.',
    'Measuring straight-line distance instead of the actual reflected path (source → surface → listener).',
  ],
  warnings:
    'Ideal two-path comb: teeth spaced Δf = c/Δd, first notch at c/(2·Δd), where Δd is the path ' +
    'difference. Assumes the reflection is a clean single copy; real surfaces filter and scatter it.',
  glossary: ['Comb Filtering', 'Reflection', 'Interference', 'Delay', 'Phase'],
  fields: [
    { key: 'dDirect', name: 'DIRECT PATH', quantity: 'length', defaultUnit: 'm', placeholder: '0.3', help: 'Straight-line distance from source to listener/mic.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'dReflected', name: 'REFLECTED PATH', quantity: 'length', defaultUnit: 'm', placeholder: '0.75', help: 'Total distance the reflection travels: source → surface → listener.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound.' },
    { key: 'fNull', name: 'TARGET FIRST-NULL FREQUENCY', quantity: 'frequency', placeholder: '400', help: 'A first-notch frequency you want the geometry to produce.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'comb',
      name: 'Comb pattern from two path lengths',
      inputs: ['dDirect', 'dReflected', 'temp'],
      formula: 'Δd = d₂ − d₁ · Δt = Δd/c · Δf = c/Δd · first null = c/(2Δd)',
      plainFormula:
        'The path difference equals the reflected path minus the direct path; the delay equals that difference over the speed of sound; the comb teeth are spaced by the speed of sound over the path difference; and the first null sits at half that spacing.',
      explain:
        'When a delayed copy of a sound arrives off a floor, desk, or wall, it combs with the direct sound. The extra distance the reflection travels sets everything — a longer difference packs more, closer-spaced notches. This is the physics behind desk-bounce dips and the 3:1 mic rule.',
      keySymbols: ['Δ', '−', '/', 'c', 'x₁'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dd = Math.abs(n(v.dReflected) - n(v.dDirect));
        const dt = dd / c;
        return [
          { label: 'PATH DIFFERENCE', value: dd, quantity: 'length' },
          { label: 'ARRIVAL DELAY', value: dt * 1000, quantity: 'time', unit: 'ms' },
          { label: 'COMB SPACING (teeth)', value: c / dd, quantity: 'frequency', chainable: false },
          { label: 'FIRST NULL', value: c / (2 * dd), quantity: 'frequency' },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dd = Math.abs(n(v.dReflected) - n(v.dDirect));
        const dt = dd / c;
        return [
          `Path difference Δd = |${fmt(n(v.dReflected))} − ${fmt(n(v.dDirect))}| = ${fmt(dd)} m.`,
          `Delay Δt = ${fmt(dd)} ÷ ${fmt(c)} = ${fmt(dt * 1000)} ms.`,
          `Comb teeth every c/Δd = ${fmt(c / dd)} Hz; the FIRST null sits at half that, ${fmt(c / (2 * dd))} Hz.`,
        ];
      },
    },
    {
      key: 'pathForNull',
      name: 'Path difference for a target first null (reverse)',
      inputs: ['fNull', 'temp'],
      formula: 'Δd = c / (2 · f_null)',
      plainFormula:
        'The path difference equals the speed of sound divided by twice the target first-null frequency.',
      explain:
        'The reverse: the extra reflected-path length that would place the first comb notch at a chosen frequency. Any reflection whose path is that much longer than the direct sound notches first there.',
      keySymbols: ['Δ', 'c', '/', '·'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dd = c / (2 * n(v.fNull));
        return [
          { label: 'PATH DIFFERENCE', value: dd, quantity: 'length' },
          { label: 'ARRIVAL DELAY', value: (dd / c) * 1000, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dd = c / (2 * n(v.fNull));
        return [
          `Δd = ${fmt(c)} ÷ (2 × ${fmt(n(v.fNull))}) = ${fmt(dd)} m.`,
          `Any reflection whose path is ${fmt(dd)} m longer than the direct sound notches first at ${fmt(n(v.fNull))} Hz.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_ROOMS_SECOND: Workspace[] = [CRITICAL_DISTANCE, SCHROEDER, BOUNDARY, REFLECTION];
