/**
 * Workspaces — Digital Audio, ADVANCED TIER (owner buildout 2026-08-07):
 * Clock Drift · Network-Audio Bandwidth · Timecode · FIR Filter Length ·
 * Convolution Resources. Section 'digital'. Same pattern as wave.ts.
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const CLOCKDRIFT: Workspace = {
  id: 'clockdrift',
  name: 'Clock Drift',
  tagline: 'ppm error → sample slip over time',
  section: 'digital',
  reportPrefix: 'CLK',
  intro:
    'Two digital devices never run at exactly the same rate unless they share a clock. A tiny ' +
    'frequency error — measured in parts per million — slowly slips samples, and eventually a ' +
    'click or a dropout. Enter the sample rate, the clock error, and a duration to see the slip.',
  whyItMatters:
    'This is why word clock, AES sync, and PTP exist. An unsynced digital link that "sounds fine" ' +
    'for a minute can tick or glitch over a long session as the two clocks drift apart. Knowing the ' +
    'rate tells you how tight your sync has to be.',
  example:
    'At 48 kHz with a 50 ppm error: drift = 50×10⁻⁶, so samples slip at 48000×50µ ≈ 2.4 samples per ' +
    'second — a full sample about every 0.42 s, and ≈ 8640 samples (180 ms) adrift over an hour.',
  mistakes: [
    'Assuming "same sample rate" means "same clock" — nominal 48 kHz devices still differ by ppm unless one slaves to the other.',
    'Ignoring drift on long records — the error is cumulative, so a rate that seems tiny becomes audible over time.',
    'Confusing ppm of frequency with the timing error — the sample slip grows with BOTH the rate and the elapsed time.',
  ],
  warnings:
    'Ideal constant-offset model: sample slip = sample rate × (ppm×10⁻⁶) × time; time error = ' +
    '(ppm×10⁻⁶) × time. Real clocks also jitter and wander; this is the steady-state drift only.',
  glossary: ['Sample Rate', 'Word Clock', 'Jitter', 'Synchronization'],
  fields: [
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'Sample rate of the digital link.', warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'ppm', name: 'CLOCK ERROR (ppm)', quantity: 'number', placeholder: '50', help: 'Frequency error in parts per million between the two clocks.', warn: { test: (x) => x <= 0, msg: 'Clock error must be greater than zero.' } },
    { key: 'dur', name: 'DURATION', quantity: 'time', defaultUnit: 'min', placeholder: '60', help: 'How long the two devices run unsynced.', warn: { test: (x) => x <= 0, msg: 'Duration must be greater than zero.' } },
    { key: 'maxSlip', name: 'SLIP BUDGET', quantity: 'samples', placeholder: '1', help: 'How many samples of slip you can tolerate before it matters.', warn: { test: (x) => x <= 0, msg: 'Slip budget must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'slip',
      name: 'Sample slip over a duration',
      inputs: ['sr', 'ppm', 'dur'],
      formula: 'slip = SR · (ppm×10⁻⁶) · t',
      compute: (v) => {
        const drift = n(v.ppm) * 1e-6;
        const slip = n(v.sr) * drift * n(v.dur);
        return [
          { label: 'SAMPLES SLIPPED', value: slip, quantity: 'samples' },
          { label: 'TIME ERROR', value: drift * n(v.dur), quantity: 'time' },
          { label: 'TIME PER 1-SAMPLE SLIP', value: 1 / (n(v.sr) * drift), quantity: 'time', chainable: false },
        ];
      },
      steps: (v) => {
        const drift = n(v.ppm) * 1e-6;
        const slip = n(v.sr) * drift * n(v.dur);
        return [
          `Drift fraction = ${fmt(n(v.ppm))} ppm = ${fmt(drift)}.`,
          `Slip = ${fmt(n(v.sr))} × ${fmt(drift)} × ${fmt(n(v.dur))} s = ${fmt(slip)} samples.`,
          `That is one sample every ${fmt(1 / (n(v.sr) * drift))} s; timing error = ${fmt(drift * n(v.dur) * 1000)} ms over the run.`,
        ];
      },
    },
    {
      key: 'untilSlip',
      name: 'Time until the slip budget is used up (reverse)',
      inputs: ['sr', 'ppm', 'maxSlip'],
      formula: 't = slip / (SR · ppm×10⁻⁶)',
      compute: (v) => {
        const drift = n(v.ppm) * 1e-6;
        return [{ label: 'TIME TO REACH SLIP BUDGET', value: n(v.maxSlip) / (n(v.sr) * drift), quantity: 'time' }];
      },
      steps: (v) => {
        const drift = n(v.ppm) * 1e-6;
        const t = n(v.maxSlip) / (n(v.sr) * drift);
        return [
          `t = ${fmt(n(v.maxSlip))} samples ÷ (${fmt(n(v.sr))} × ${fmt(drift)}) = ${fmt(t)} s (${fmt(t / 60)} min).`,
          `After this long, the two unsynced clocks have drifted by your ${fmt(n(v.maxSlip))}-sample budget.`,
        ];
      },
    },
  ],
};

const NETAUDIO: Workspace = {
  id: 'netaudio',
  name: 'Network-Audio Bandwidth',
  tagline: 'Channels × rate × depth → data on the wire',
  section: 'digital',
  reportPrefix: 'NET',
  intro:
    'Audio-over-IP (Dante, AES67, AVB) turns channels into packets. The raw payload is simply ' +
    'channels × sample rate × bit depth, but the wire also carries packet headers many times a ' +
    'second. This workspace gives both the raw rate and a realistic on-the-wire estimate.',
  whyItMatters:
    'It tells you whether a switch port, a link, or a cable run has the headroom for your channel ' +
    'count — and shows why tiny packet times (low latency) cost bandwidth in header overhead. ' +
    'Undersize the link and you get dropouts under load.',
  example:
    '64 channels at 48 kHz / 24-bit: raw = 64×48000×24 ≈ 73.7 Mbit/s. At a 1 ms packet time that is ' +
    '48 samples/packet, ≈ 9.2 kB payload every ms, 1000 packets/s — plus ~78 bytes header each.',
  mistakes: [
    'Sizing only the raw audio rate — at low latency, per-packet headers add a large, real overhead on top.',
    'Forgetting bandwidth is per DIRECTION — a full-duplex flow needs the rate both ways.',
    'Running audio and control/other traffic on an unmanaged, uncongested-by-luck switch — AoIP wants QoS and headroom.',
  ],
  warnings:
    'Raw rate = channels × sample rate × bit depth. Wire estimate adds ~78 bytes/packet (Ethernet ' +
    '+ IP + UDP + RTP + preamble + inter-frame gap). Real Dante/AES67 overhead varies with format ' +
    'and switch; treat the wire figure as an estimate.',
  glossary: ['Sample Rate', 'Bit Depth', 'Bandwidth', 'Latency', 'Packet'],
  fields: [
    { key: 'channels', name: 'CHANNELS', quantity: 'number', placeholder: '64', help: 'Number of audio channels in one direction.', warn: { test: (x) => x <= 0, msg: 'Channels must be greater than zero.' } },
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'Sample rate of each channel.', warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'bitdepth', name: 'BIT DEPTH', quantity: 'bitdepth', placeholder: '24', help: 'Bits per sample carried on the wire.', warn: { test: (x) => x <= 0, msg: 'Bit depth must be greater than zero.' } },
    { key: 'packetms', name: 'PACKET TIME', quantity: 'time', defaultUnit: 'ms', placeholder: '1', help: 'Audio time carried per packet — smaller = lower latency, more overhead.', warn: { test: (x) => x <= 0, msg: 'Packet time must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'bandwidth',
      name: 'Raw audio data rate',
      inputs: ['channels', 'sr', 'bitdepth'],
      formula: 'rate = channels × sample rate × bit depth',
      compute: (v) => {
        const raw = n(v.channels) * n(v.sr) * n(v.bitdepth);
        return [
          { label: 'RAW DATA RATE', value: raw, quantity: 'datarate', unit: 'mbps' },
          { label: 'PER-CHANNEL RATE', value: n(v.sr) * n(v.bitdepth), quantity: 'datarate', unit: 'mbps', chainable: false },
          { label: 'RAW BYTES PER SECOND', value: raw / 8, quantity: 'datasize', unit: 'mb', chainable: false },
        ];
      },
      steps: (v) => {
        const raw = n(v.channels) * n(v.sr) * n(v.bitdepth);
        return [
          `Raw = ${fmt(n(v.channels))} ch × ${fmt(n(v.sr))} Hz × ${fmt(n(v.bitdepth))} bit = ${fmt(raw / 1e6)} Mbit/s.`,
          `That is one direction; a full-duplex flow needs it both ways.`,
        ];
      },
    },
    {
      key: 'packetize',
      name: 'Packets & on-the-wire rate',
      inputs: ['channels', 'sr', 'bitdepth', 'packetms'],
      formula: 'wire = pkts/s × (payload + ~78 B header)',
      note: 'Header estimate 78 B/packet (Ethernet+IP+UDP+RTP + preamble + inter-frame gap).',
      compute: (v) => {
        const spp = n(v.sr) * n(v.packetms);
        const payload = spp * n(v.channels) * (n(v.bitdepth) / 8);
        const pps = 1 / n(v.packetms);
        const wireBps = pps * (payload + 78) * 8;
        return [
          { label: 'SAMPLES PER PACKET', value: spp, quantity: 'samples', chainable: false },
          { label: 'PAYLOAD PER PACKET', value: payload, quantity: 'datasize', unit: 'kb', chainable: false },
          { label: 'PACKETS PER SECOND', value: pps, quantity: 'number', chainable: false },
          { label: 'ON-THE-WIRE RATE', value: wireBps, quantity: 'datarate', unit: 'mbps' },
        ];
      },
      steps: (v) => {
        const spp = n(v.sr) * n(v.packetms);
        const payload = spp * n(v.channels) * (n(v.bitdepth) / 8);
        const pps = 1 / n(v.packetms);
        const wireBps = pps * (payload + 78) * 8;
        return [
          `${fmt(n(v.packetms) * 1000)} ms/packet → ${fmt(spp)} samples/packet, ${fmt(pps)} packets/s.`,
          `Payload = ${fmt(spp)} × ${fmt(n(v.channels))} ch × ${fmt(n(v.bitdepth) / 8)} B = ${fmt(payload)} B; + ~78 B header.`,
          `Wire rate ≈ ${fmt(pps)} × ${fmt(payload + 78)} B × 8 = ${fmt(wireBps / 1e6)} Mbit/s.`,
        ];
      },
    },
  ],
};

const TIMECODE: Workspace = {
  id: 'timecode',
  name: 'Timecode',
  tagline: 'Frames ↔ time, fps & pulldown',
  section: 'digital',
  reportPrefix: 'TC',
  intro:
    'SMPTE timecode counts hours, minutes, seconds, and frames. Convert a frame count to a clock ' +
    'time and back, and see the 0.1% pulldown offset that separates 30 fps from real-world 29.97 ' +
    'fps workflows.',
  whyItMatters:
    'Timecode is how audio, video, and lighting stay in step. Get the frame rate or the pulldown ' +
    'wrong and a session that starts in sync drifts a frame at a time — the classic film-to-video ' +
    'audio-sync headache.',
  example:
    'At 25 fps, 9000 frames = 9000 ÷ 25 = 360 s = 00:06:00:00. Running 30 fps material at 29.97 ' +
    '(0.1% pulldown) drifts ≈ 3.6 s per hour.',
  mistakes: [
    'Mixing frame rates — 24, 25, 29.97, and 30 fps all count differently; a frame number means nothing without its fps.',
    'Confusing 30 fps with 29.97 — the 0.1% difference is exactly the pulldown that drifts audio against picture.',
    'Forgetting drop-frame timecode SKIPS labels (not frames) to track real time at 29.97 — it is a counting trick, not lost media.',
  ],
  warnings:
    'Non-drop conversions: time = frames ÷ fps. Pulldown offset uses the 1000/1001 (0.1%) film↔video ' +
    'factor. Drop-frame label mechanics are described, not renumbered here.',
  glossary: ['Timecode', 'Frame Rate', 'Synchronization', 'Sample Rate'],
  fields: [
    { key: 'frames', name: 'FRAME COUNT', quantity: 'number', placeholder: '9000', help: 'Total number of frames.', warn: { test: (x) => x < 0, msg: 'Frame count cannot be negative.' } },
    { key: 'fps', name: 'FRAME RATE (fps)', quantity: 'number', placeholder: '25', help: 'Frames per second: 24, 25, 29.97, or 30.', warn: { test: (x) => x <= 0, msg: 'Frame rate must be greater than zero.' } },
    { key: 'hours', name: 'HOURS', quantity: 'number', placeholder: '0', help: 'Hours component of the timecode.' },
    { key: 'mins', name: 'MINUTES', quantity: 'number', placeholder: '6', help: 'Minutes component of the timecode.' },
    { key: 'secs', name: 'SECONDS', quantity: 'number', placeholder: '0', help: 'Seconds component of the timecode.' },
    { key: 'dur', name: 'NOMINAL DURATION', quantity: 'time', defaultUnit: 'min', placeholder: '60', help: 'Program duration to evaluate the pulldown offset over.', warn: { test: (x) => x <= 0, msg: 'Duration must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'fromFrames',
      name: 'Frames → timecode',
      inputs: ['frames', 'fps'],
      formula: 'time = frames ÷ fps',
      compute: (v) => {
        const totS = n(v.frames) / n(v.fps);
        return [
          { label: 'TOTAL TIME', value: totS, quantity: 'time' },
          { label: 'WHOLE SECONDS', value: Math.floor(totS), quantity: 'time', chainable: false },
        ];
      },
      table: (v) => {
        const fps = n(v.fps);
        const totFrames = Math.round(n(v.frames));
        const fpsInt = Math.round(fps);
        const totS = Math.floor(totFrames / fpsInt);
        const h = Math.floor(totS / 3600);
        const m = Math.floor((totS % 3600) / 60);
        const s = totS % 60;
        const f = totFrames % fpsInt;
        const p2 = (x: number) => String(x).padStart(2, '0');
        return {
          title: 'TIMECODE (HH:MM:SS:FF)',
          cols: ['Hours', 'Minutes', 'Seconds', 'Frames'],
          rows: [[p2(h), p2(m), p2(s), p2(f)]],
        };
      },
      steps: (v) => {
        const totS = n(v.frames) / n(v.fps);
        return [
          `Time = ${fmt(n(v.frames))} frames ÷ ${fmt(n(v.fps))} fps = ${fmt(totS)} s.`,
          `Broken out into HH:MM:SS:FF in the table below (frame remainder uses the whole-frame rate).`,
        ];
      },
    },
    {
      key: 'toFrames',
      name: 'Timecode → frames',
      inputs: ['hours', 'mins', 'secs', 'fps'],
      formula: 'frames = (h·3600 + m·60 + s) · fps',
      compute: (v) => {
        const totS = n(v.hours) * 3600 + n(v.mins) * 60 + n(v.secs);
        return [
          { label: 'TOTAL FRAMES', value: Math.round(totS * n(v.fps)), quantity: 'number' },
          { label: 'TOTAL TIME', value: totS, quantity: 'time' },
        ];
      },
      steps: (v) => {
        const totS = n(v.hours) * 3600 + n(v.mins) * 60 + n(v.secs);
        return [
          `Seconds = ${fmt(n(v.hours))}·3600 + ${fmt(n(v.mins))}·60 + ${fmt(n(v.secs))} = ${fmt(totS)} s.`,
          `Frames = ${fmt(totS)} × ${fmt(n(v.fps))} = ${fmt(Math.round(totS * n(v.fps)))}.`,
        ];
      },
    },
    {
      key: 'pulldown',
      name: '0.1% pulldown offset (30 ↔ 29.97)',
      inputs: ['dur'],
      formula: 'offset = duration × (1/1000)',
      note: 'The 1000/1001 factor between 30 fps and 29.97 fps (and 48 kHz ↔ 47.952 kHz).',
      compute: (v) => {
        const off = n(v.dur) / 1000;
        return [
          { label: 'PULLDOWN OFFSET', value: off, quantity: 'time' },
          { label: 'OFFSET PER HOUR', value: 3600 / 1000, quantity: 'time', chainable: false },
        ];
      },
      steps: (v) => {
        const off = n(v.dur) / 1000;
        return [
          `0.1% of ${fmt(n(v.dur))} s = ${fmt(off)} s of drift between 30 fps and 29.97 fps material.`,
          `Over an hour that is exactly 3.6 s — audio pulled up/down by 1000/1001 to match.`,
        ];
      },
    },
  ],
};

const FIRLEN: Workspace = {
  id: 'firlen',
  name: 'FIR Filter Length',
  tagline: 'Taps for a transition band & the latency cost',
  section: 'digital',
  reportPrefix: 'FIR',
  intro:
    'A linear-phase FIR filter’s sharpness comes from its length: the narrower the transition band ' +
    'and the deeper the stopband, the more taps it needs — and every tap adds latency. Enter the ' +
    'sample rate, transition width, and stopband attenuation to size it.',
  whyItMatters:
    'This is the trade at the heart of linear-phase EQ, oversampling, and steep crossovers: sharp ' +
    'and deep costs taps, and taps cost latency. A brickwall filter that looks great can add ' +
    'milliseconds of delay you have to budget for.',
  example:
    'To carve a 100 Hz transition at 48 kHz with 60 dB rejection: N ≈ (48000/100)·(60/22) ≈ 1310 ' +
    'taps, and the linear-phase latency is (N−1)/2 ≈ 655 samples ≈ 13.6 ms.',
  mistakes: [
    'Chasing a razor-sharp transition without counting the latency — linear-phase delay is half the filter length.',
    'Forgetting the taps scale with SAMPLE RATE — the same Hz transition needs far more taps at 96 kHz than at 48 kHz.',
    'Treating the estimate as exact — window and design method shift the real tap count; this is a sizing rule of thumb.',
  ],
  warnings:
    'Harris rule of thumb: N ≈ (fs/Δf)·(A/22), with Δf the transition width (Hz) and A the stopband ' +
    'attenuation (dB). Linear-phase latency = (N−1)/2 samples. Exact designs (Parks–McClellan, ' +
    'windowed-sinc) vary — size, then verify.',
  glossary: ['FIR Filter', 'Linear Phase', 'Latency', 'Sample Rate', 'Transition Band'],
  fields: [
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'Processing sample rate.', warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'trans', name: 'TRANSITION WIDTH', quantity: 'frequency', placeholder: '100', help: 'Hz between passband edge and stopband edge.', warn: { test: (x) => x <= 0, msg: 'Transition width must be greater than zero.' } },
    { key: 'atten', name: 'STOPBAND ATTENUATION', quantity: 'db', placeholder: '60', help: 'How deep the stopband rejection must be, in dB.', warn: { test: (x) => x <= 0, msg: 'Attenuation must be greater than zero.' } },
    { key: 'taps', name: 'TAP COUNT', quantity: 'number', placeholder: '1024', help: 'Filter length in taps, for the reverse latency calc.', warn: { test: (x) => x <= 0, msg: 'Tap count must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'sizeTaps',
      name: 'Taps & latency for a transition',
      inputs: ['sr', 'trans', 'atten'],
      formula: 'N ≈ (fs/Δf)·(A/22) · latency = (N−1)/2',
      compute: (v) => {
        const N = Math.ceil((n(v.sr) / n(v.trans)) * (n(v.atten) / 22));
        const latS = (N - 1) / 2;
        return [
          { label: 'FILTER TAPS (N)', value: N, quantity: 'number' },
          { label: 'LATENCY', value: (latS / n(v.sr)) * 1000, quantity: 'time', unit: 'ms' },
          { label: 'LATENCY IN SAMPLES', value: latS, quantity: 'samples', chainable: false },
        ];
      },
      steps: (v) => {
        const N = Math.ceil((n(v.sr) / n(v.trans)) * (n(v.atten) / 22));
        const latS = (N - 1) / 2;
        return [
          `N ≈ (${fmt(n(v.sr))} ÷ ${fmt(n(v.trans))}) × (${fmt(n(v.atten))} ÷ 22) = ${fmt(N)} taps.`,
          `Linear-phase latency = (N−1)/2 = ${fmt(latS)} samples = ${fmt((latS / n(v.sr)) * 1000)} ms.`,
        ];
      },
    },
    {
      key: 'latency',
      name: 'Latency from a tap count (reverse)',
      inputs: ['sr', 'taps'],
      formula: 'latency = (N − 1) / 2 samples',
      compute: (v) => {
        const latS = (n(v.taps) - 1) / 2;
        return [
          { label: 'LATENCY', value: (latS / n(v.sr)) * 1000, quantity: 'time', unit: 'ms' },
          { label: 'LATENCY IN SAMPLES', value: latS, quantity: 'samples', chainable: false },
        ];
      },
      steps: (v) => {
        const latS = (n(v.taps) - 1) / 2;
        return [
          `Latency = (${fmt(n(v.taps))} − 1) ÷ 2 = ${fmt(latS)} samples.`,
          `At ${fmt(n(v.sr))} Hz that is ${fmt((latS / n(v.sr)) * 1000)} ms of delay.`,
        ];
      },
    },
  ],
};

const CONVOLUTION: Workspace = {
  id: 'convolution',
  name: 'Convolution Resources',
  tagline: 'IR length → compute & memory cost',
  section: 'digital',
  reportPrefix: 'CONV',
  intro:
    'Convolution reverb multiplies your signal by every sample of an impulse response. Direct-form ' +
    'convolution is brutally expensive; this workspace shows the raw multiply-accumulate load and ' +
    'the memory an IR needs, plus the latency of a processing block.',
  whyItMatters:
    'It explains why convolution reverb is heavy and why real plug-ins use PARTITIONED FFT ' +
    'convolution instead of brute force. The numbers show the gap between the naïve cost and what ' +
    'makes it run in real time — and the latency your block size buys.',
  example:
    'A 2 s IR at 48 kHz stereo: 96000 taps per channel. Direct form = 96000×48000×2 ≈ 9.2 billion ' +
    'MAC/s — far past real time by hand, which is why FFT partitioning exists. The IR itself is ' +
    '≈ 768 kB as 32-bit floats.',
  mistakes: [
    'Assuming direct-form convolution is feasible — the MAC/s count shows why partitioned FFT convolution is mandatory for long IRs.',
    'Forgetting cost scales with BOTH IR length and sample rate — a 96 kHz project doubles the taps of the same reverb.',
    'Confusing block latency with quality — a bigger FFT block is cheaper per sample but adds delay; partitioning keeps the first block small.',
  ],
  warnings:
    'Direct-form teaching figures: taps = IR seconds × sample rate; MAC/s = taps × sample rate × ' +
    'channels; memory = taps × 4 bytes × channels (32-bit float). Real engines use partitioned FFT ' +
    'convolution — orders of magnitude cheaper than these direct-form numbers.',
  glossary: ['Convolution', 'Impulse Response', 'Latency', 'Sample Rate', 'FFT'],
  fields: [
    { key: 'irSec', name: 'IR LENGTH', quantity: 'time', defaultUnit: 's', placeholder: '2', help: 'Duration of the impulse response.', warn: { test: (x) => x <= 0, msg: 'IR length must be greater than zero.' } },
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'Processing sample rate.', warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'channels', name: 'CHANNELS', quantity: 'number', placeholder: '2', help: 'Number of channels processed.', warn: { test: (x) => x <= 0, msg: 'Channels must be greater than zero.' } },
    { key: 'block', name: 'BLOCK SIZE', quantity: 'samples', placeholder: '512', help: 'Processing block / FFT partition size, for the latency figure.', warn: { test: (x) => x <= 0, msg: 'Block size must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'cost',
      name: 'Direct-form compute & memory',
      inputs: ['irSec', 'sr', 'channels'],
      formula: 'taps = IR·fs · MAC/s = taps·fs·ch · mem = taps·4·ch',
      compute: (v) => {
        const taps = n(v.irSec) * n(v.sr);
        const macs = taps * n(v.sr) * n(v.channels);
        return [
          { label: 'IR LENGTH IN TAPS', value: taps, quantity: 'samples', chainable: false },
          { label: 'DIRECT-FORM LOAD (GMAC/s)', value: macs / 1e9, quantity: 'number', chainable: false },
          { label: 'IR MEMORY (32-bit float)', value: taps * 4 * n(v.channels), quantity: 'datasize', unit: 'mb', chainable: false },
        ];
      },
      steps: (v) => {
        const taps = n(v.irSec) * n(v.sr);
        const macs = taps * n(v.sr) * n(v.channels);
        return [
          `Taps = ${fmt(n(v.irSec))} s × ${fmt(n(v.sr))} Hz = ${fmt(taps)} per channel.`,
          `Direct MAC/s = ${fmt(taps)} × ${fmt(n(v.sr))} × ${fmt(n(v.channels))} ch = ${fmt(macs / 1e9)} GMAC/s.`,
          `Memory = ${fmt(taps)} × 4 B × ${fmt(n(v.channels))} = ${fmt((taps * 4 * n(v.channels)) / 1e6)} MB — and this is why real plug-ins partition with FFTs.`,
        ];
      },
    },
    {
      key: 'blockLatency',
      name: 'Processing-block latency',
      inputs: ['block', 'sr'],
      formula: 'latency = block ÷ sample rate',
      compute: (v) => {
        return [
          { label: 'BLOCK LATENCY', value: (n(v.block) / n(v.sr)) * 1000, quantity: 'time', unit: 'ms' },
          { label: 'ROUND-TRIP (2× BLOCK)', value: (n(v.block) / n(v.sr)) * 2000, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        return [
          `Block latency = ${fmt(n(v.block))} samples ÷ ${fmt(n(v.sr))} Hz = ${fmt((n(v.block) / n(v.sr)) * 1000)} ms.`,
          `Uniform-block convolution adds one block in and one out; partitioned schemes keep the FIRST block small to cut this.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_DIGITAL_ADV: Workspace[] = [CLOCKDRIFT, NETAUDIO, TIMECODE, FIRLEN, CONVOLUTION];
