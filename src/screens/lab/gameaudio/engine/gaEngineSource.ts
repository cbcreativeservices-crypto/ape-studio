/**
 * gaEngineSource — the Game Audio lab's VOICE SERVER, as plain JavaScript
 * SOURCE TEXT. It is text on purpose: the same engine must run in two places,
 *
 *   web build    in the page itself   (engine/gaTransport: `new Function`)
 *   phone        in a hidden web view (engine/GaEngineHost: injected source)
 *
 * and a phone's JS engine (Hermes) keeps no function source to send across,
 * so the engine cannot be an ordinary module. node:test loads this same text
 * against a recording fake of the Web Audio API (test/gameAudioEngine.test.ts)
 * — the scheduling arithmetic is pinned without a device.
 *
 * The protocol is engine/gaEngineProtocol.ts. The graph:
 *
 *   voice:  buffer source → low-pass → voice gain → panner → placement gain ─┐
 *                                        └→ reverb send → BUS SEND ─┐        │
 *   reverb: convolver → return ─────────────────────────────────────┼──┐     │
 *   bus[ambience|sfx|dialogue|music|ui|chat] gain ←─────────────────│──│─────┘
 *        → pre-master ←─────────────────────────────────────────────│──┘
 *        → (mono fold-down) → lab master → protective limiter → its make-up
 *        trim → HARD STOP at full scale → level tap → OUTPUT CEILING (a −12 dBFS sample-peak
 *        ceiling, features/audio/outputCeiling) → the device
 *
 * Every stage is applied ONCE. The protective limiter is listener protection
 * only (many voices can sum above full scale); it is not a teaching control.
 *
 * A −12 dBFS SAMPLE-PEAK CEILING (audit 2, F15; check E, problem 6). No
 * sample handed to the device is above −12.0 dBFS. The limiter (the
 * platform's compressor, threshold −6 dB) does the work; it overshoots a hard
 * attack by about 3 dB, which stays under full scale. The compressor
 * adds its own make-up gain (the Web Audio algorithm: +3.42 dB at these
 * settings, +1.14 dB at the −2 dB it had before); a fixed trim right after
 * it takes that back, so everything under the threshold leaves at the level
 * it came in. A wave shaper after it
 * passes every sample inside full scale unchanged and holds anything beyond
 * AT full scale: a backstop that only acts on extreme sums. The fixed ceiling
 * gain follows it. Between two samples the reconstructed wave can rise a
 * little above the sample peak ("true peak"); that is not what is promised.
 *
 * THE REVERB OBEYS THE MIX (audit 2, F8). A voice's reverb send goes through
 * its BUS's send gain, which follows that bus's fader, MUTE, SOLO and duck:
 * a muted bus has no wet sound either. The room impulse is converted to the
 * device's sample rate here if it differs (a convolver refuses any other
 * rate: F1), and the `reverb` command is ANSWERED, so the lab can say when a
 * device has none. STOP ALL also ends the reverb's tail: the old reverb fades
 * out with the fade and a fresh one takes the sends AT ONCE, so a sound
 * started right after STOP ALL has its room (check E, problem 8).
 *
 * STOP MEANS STOP (check E, problem 1). Everything that can still sound is
 * kept in one list until its last sample: playing voices, voices fading out,
 * a voice replaced by a newer start under the same id, music stems fading
 * after a music stop, and stingers. STOP ALL re-fades every one of them with
 * its own short fade, so a long fade already running is cut short, and all of
 * them count in `voices` until they end.
 *
 * EVERY AUTOMATION IS MIRRORED (check E, problems 2–4). The engine keeps its
 * own copy of what it has scheduled on each AudioParam and computes the
 * value at any time from it; it never reads `param.value` (which the
 * platform reports a render quantum late, and as the intrinsic value before
 * a future event). A move that interrupts another one first ends the
 * running ramp ON its own line at the moment of the change (a ramp to the
 * value it has there), so the level never falls back for a sample.
 *
 * MUSIC TIMING lives here, on the audio clock: the stems start on one clock
 * time, and a change asked "on the next bar" is written into the gain
 * automation at that bar's clock time. A JS timer only REPORTS that the
 * boundary passed; it never moves audio. A STINGER is tracked from the moment
 * it is scheduled until its last sample (F3): music stop and STOP ALL stop
 * it, and it counts as a voice while it sounds.
 *
 * Written in plain ES2017 with no imports and no template literals inside,
 * because this whole file is one String.raw template.
 */
import type { GaEvt } from './gaEngineProtocol.ts';

export const GA_ENGINE_VERSION = 3;

/** The fixed output ceiling, linear (−12 dBFS, sample peak). Kept equal to
 *  features/audio/outputCeiling PLAYBACK_CEILING by test. */
export const GA_OUTPUT_CEILING = 0.251188643150958;

/** The protective limiter's threshold, dB re full scale before the ceiling.
 *  Low enough that its attack overshoot stays under full scale, so the hard
 *  stop after it is a backstop (check E, problem 6). */
export const GA_LIMITER_THRESHOLD_DB = -6;

/** The compressor's own make-up gain at the limiter's settings (threshold
 *  −6 dB, knee 0, ratio 20), measured: 1.4825 (+3.42 dB). The engine trims it
 *  back after the limiter: GA_LIMITER_TRIM = 1 / that. */
export const GA_LIMITER_MAKEUP = 1.4825;
export const GA_LIMITER_TRIM = 1 / GA_LIMITER_MAKEUP;

/** The 3D (head-related) renderer measured about 2.5 dB louder than the
 *  stereo pan for the same source; its voices are trimmed by this (F26). */
export const GA_HRTF_TRIM = 0.75;

export const GA_ENGINE_JS = String.raw`
(function (root) {
  'use strict';
  var BUSES = ['ambience', 'sfx', 'dialogue', 'music', 'ui', 'chat'];
  var CEILING = 0.251188643150958;
  var LIMIT_DB = -6;
  var LIMIT_TRIM = 1 / 1.4825; // the compressor's own make-up gain, taken back
  var HRTF_TRIM = 0.75;
  var LEAD = 0.06; // seconds between "now" and the earliest boundary we promise
  var XFADE = 0.03; // seconds to move a living voice from one renderer to another

  function b64ToFloat(b64) {
    var bin = root.atob(b64);
    var n = bin.length >> 1;
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var v = ((bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) << 16) >> 16;
      out[i] = v / 32767;
    }
    return out;
  }

  function create(opts) {
    var post = opts.post;
    var AC = opts.AudioContext;
    var setT = opts.setTimeout || function (f, ms) { return root.setTimeout(f, ms); };
    var clearT = opts.clearTimeout || function (id) { root.clearTimeout(id); };
    var ctx = null;
    var buffers = {};
    var voices = {};
    var buses = {};
    var busSend = {};
    var pre = null, monoNode = null, master = null, limiter = null, trim = null, shaper = null, analyser = null, ceiling = null;
    var splitter = null, anL = null, anR = null, sideData = null;
    var revIn = null, convolver = null, revOut = null;
    var revBuf = null, revBufId = null, revGain = 0, revFed = false;
    var monoOn = false;
    var music = null;
    var stingers = {};
    /** Everything that can still sound, until its source ends: voice
     *  records (current, fading, or replaced), music stems, stingers. */
    var live = [];
    var levelTimer = null;
    var levelData = null;

    function say(m) { try { post(m); } catch (e) { /* the host is gone */ } }
    function now() { return ctx ? ctx.currentTime : 0; }
    function stateOf() { return !ctx ? 'closed' : ctx.state === 'running' ? 'running' : ctx.state === 'closed' ? 'closed' : 'suspended'; }
    function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : d; }
    function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
    function drop(node) { if (node) { try { node.disconnect(); } catch (e) { /* already gone */ } } }
    function forget(rec) { var i = live.indexOf(rec); if (i >= 0) live.splice(i, 1); }

    /* ── the automation mirror ────────────────────────────────────────── */

    var mirrors = typeof WeakMap === 'function' ? new WeakMap() : null;
    function mirrorOf(p) {
      var m = mirrors ? mirrors.get(p) : p.__gaMirror;
      if (!m) {
        m = { base: p.value, pts: [] };
        if (mirrors) mirrors.set(p, m); else p.__gaMirror = m;
      }
      return m;
    }
    /** A param's starting value, set before anything is scheduled on it. */
    function setBase(p, v) {
      p.value = v;
      var m = mirrorOf(p);
      m.base = v;
      m.pts = [];
    }
    /** What the param is worth at time t, from what was scheduled on it. */
    function valAt(p, t) {
      var m = mirrorOf(p), v = m.base, pt = null;
      for (var i = 0; i < m.pts.length; i++) {
        var e = m.pts[i];
        if (e.t <= t) { v = e.v; pt = e.t; continue; }
        if (e.k === 'set' || pt === null || !(e.t > pt)) return v;
        var f = (t - pt) / (e.t - pt);
        if (e.k === 'exp' && v > 0 && e.v > 0) return v * Math.pow(e.v / v, f);
        return v + (e.v - v) * f;
      }
      return v;
    }
    function addPt(p, k, v, t) {
      var m = mirrorOf(p), i = m.pts.length;
      while (i > 0 && m.pts[i - 1].t > t) i--;
      m.pts.splice(i, 0, { k: k, v: v, t: t });
      // what is long past is not needed: keep the last point before now
      var n = now(), keep = 0;
      for (var j = 0; j < m.pts.length; j++) if (m.pts[j].t <= n) keep = j;
      if (keep > 0) m.pts.splice(0, keep);
    }
    function pSet(p, v, t) { p.setValueAtTime(v, t); addPt(p, 'set', v, t); }
    function pLin(p, v, t) { p.linearRampToValueAtTime(v, t); addPt(p, 'lin', v, t); }
    function pExp(p, v, t) {
      if (!p.exponentialRampToValueAtTime || !(v > 0)) { pLin(p, v, t); return; }
      p.exponentialRampToValueAtTime(v, t);
      addPt(p, 'exp', v, t);
    }
    function pCancel(p, t) {
      try { p.cancelScheduledValues(t); } catch (e) { /* older engines */ }
      var m = mirrorOf(p), keep = [];
      for (var i = 0; i < m.pts.length; i++) if (m.pts[i].t < t) keep.push(m.pts[i]);
      m.pts = keep;
    }
    /** The scheduled points at or after t (to put back if a change is
     *  withdrawn). */
    function pointsFrom(p, t) {
      var m = mirrorOf(p), out = [];
      for (var i = 0; i < m.pts.length; i++) if (m.pts[i].t >= t) out.push(m.pts[i]);
      return out;
    }
    function putBack(p, pts) {
      for (var i = 0; i < pts.length; i++) {
        var e = pts[i];
        if (e.k === 'set') pSet(p, e.v, e.t); else if (e.k === 'exp') pExp(p, e.v, e.t); else pLin(p, e.v, e.t);
      }
    }
    /** Hold the param at its own value at time t and drop everything after:
     *  a ramp running across t is ended ON ITS LINE at t (a ramp to the value
     *  it has there), so the level never falls back for a sample (check E,
     *  problem 4: cancelling the ramp in flight and SETTING its value left one
     *  sample at the value before the ramp). Returns that value. */
    function holdAt(p, t) {
      var cur = valAt(p, t), m = mirrorOf(p), cross = null;
      for (var i = 0; i < m.pts.length; i++) if (m.pts[i].t > t) { cross = m.pts[i]; break; }
      pCancel(p, t);
      var before = m.pts.length > 0;
      if (cross && cross.k !== 'set' && before) { if (cross.k === 'exp') pExp(p, cur, t); else pLin(p, cur, t); }
      else pSet(p, cur, t);
      return cur;
    }
    /** Move an AudioParam to a value over ramp seconds from time at (now by
     *  default), from the value it HAS then, replacing whatever was
     *  scheduled after at — one ramp at a time, never a stack of them. */
    function rampTo(param, value, ramp, at) {
      var t = at == null ? now() : at;
      holdAt(param, t);
      if (ramp > 0) pLin(param, value, t + ramp);
      else pSet(param, value, t);
    }
    /** The same for a FREQUENCY: equal steps in pitch, not in hertz. A
     *  straight line from 900 Hz to 20 kHz spends nearly all its time above
     *  the range the ear hears as "opening" (audit 2, F27). */
    function rampFreq(param, value, ramp, at) {
      var t = at == null ? now() : at;
      var cur = holdAt(param, t);
      if (!(ramp > 0)) { pSet(param, value, t); return; }
      if (cur > 0 && value > 0) pExp(param, value, t + ramp); else pLin(param, value, t + ramp);
    }

    function wireMaster() {
      try { pre.disconnect(); } catch (e) { /* not connected yet */ }
      try { monoNode.disconnect(); } catch (e) { /* not connected yet */ }
      if (monoOn) { pre.connect(monoNode); monoNode.connect(master); }
      else pre.connect(master);
    }

    /** A reverb chain: send in → convolver → return → pre-master. The
     *  return opens at once only when an impulse is held. */
    function makeReverb() {
      revIn = ctx.createGain();
      convolver = ctx.createConvolver();
      revOut = ctx.createGain();
      setBase(revOut.gain, 0);
      if (revBuf) {
        try { convolver.buffer = revBuf; setBase(revOut.gain, revGain); }
        catch (e) { revBuf = null; revBufId = null; revGain = 0; }
      }
      revIn.connect(convolver);
      convolver.connect(revOut);
      revOut.connect(pre);
    }

    function init() {
      if (ctx) { say({ e: 'ready', sr: ctx.sampleRate, state: stateOf(), hrtf: true }); return; }
      if (!AC) { say({ e: 'error', msg: 'This device has no Web Audio engine.' }); return; }
      try {
        ctx = new AC({ latencyHint: 'interactive' });
      } catch (e1) {
        try { ctx = new AC(); } catch (e2) { say({ e: 'error', msg: String(e2 && e2.message || e2) }); return; }
      }
      // iOS: without this a web view's Web Audio follows the ring/silent
      // switch. A sound the learner started is content, not a notification.
      try { if (root.navigator && root.navigator.audioSession) root.navigator.audioSession.type = 'playback'; } catch (e3) { /* not offered */ }

      pre = ctx.createGain();
      monoNode = ctx.createGain();
      monoNode.channelCount = 1;
      monoNode.channelCountMode = 'explicit';
      monoNode.channelInterpretation = 'speakers';
      master = ctx.createGain();
      setBase(master.gain, 0.7);
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = LIMIT_DB;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.12;
      trim = ctx.createGain();
      setBase(trim.gain, LIMIT_TRIM);
      limiter.connect(trim);
      // The hard stop at full scale: an identity table, so a sample inside
      // ±1 leaves as it came and one beyond leaves AT ±1 (65537 points: fine
      // enough to be exact even where a browser does not interpolate).
      if (ctx.createWaveShaper) {
        shaper = ctx.createWaveShaper();
        var curve = new Float32Array(65537);
        for (var ci = 0; ci < 65537; ci++) curve[ci] = (ci - 32768) / 32768;
        shaper.curve = curve;
        try { shaper.oversample = 'none'; } catch (e5) { /* the default */ }
      }
      var tap = shaper || trim;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      levelData = new Float32Array(analyser.fftSize);
      ceiling = ctx.createGain();
      setBase(ceiling.gain, CEILING);
      wireMaster();
      master.connect(limiter);
      if (shaper) trim.connect(shaper);
      tap.connect(analyser);
      // left and right measured separately, so the lab can SHOW a pan
      if (ctx.createChannelSplitter) {
        splitter = ctx.createChannelSplitter(2);
        anL = ctx.createAnalyser();
        anR = ctx.createAnalyser();
        anL.fftSize = 1024;
        anR.fftSize = 1024;
        sideData = new Float32Array(1024);
        tap.connect(splitter);
        splitter.connect(anL, 0);
        splitter.connect(anR, 1);
      }
      tap.connect(ceiling);
      ceiling.connect(ctx.destination);

      makeReverb();
      for (var i = 0; i < BUSES.length; i++) {
        var g = ctx.createGain();
        setBase(g.gain, 1);
        g.connect(pre);
        buses[BUSES[i]] = g;
        // this bus's way into the reverb: it follows the bus gain
        var sg = ctx.createGain();
        setBase(sg.gain, 1);
        sg.connect(revIn);
        busSend[BUSES[i]] = sg;
      }

      ctx.onstatechange = function () { say({ e: 'state', state: stateOf() }); };
      if (ctx.state !== 'running' && ctx.resume) { try { ctx.resume(); } catch (e4) { /* reported by state */ } }
      startLevels();
      say({ e: 'ready', sr: ctx.sampleRate, state: stateOf(), hrtf: true });
    }

    /** Everything that is sounding or still to end: every voice (playing,
     *  fading, replaced), every music stem, every stinger that has begun. */
    function voiceCount() {
      var count = 0, t = now();
      for (var i = 0; i < live.length; i++) if (!(live[i].kind === 'stinger' && live[i].t0 > t)) count++;
      return count;
    }

    function startLevels() {
      if (levelTimer != null) return;
      var tick = function () {
        levelTimer = setT(tick, 180);
        if (!ctx || ctx.state !== 'running' || !analyser.getFloatTimeDomainData) return;
        analyser.getFloatTimeDomainData(levelData);
        var s = 0, pk = 0;
        for (var i = 0; i < levelData.length; i++) {
          var x = levelData[i];
          s += x * x;
          if (x > pk) pk = x; else if (-x > pk) pk = -x;
        }
        var side = function (an) {
          if (!an || !an.getFloatTimeDomainData) return 0;
          an.getFloatTimeDomainData(sideData);
          var q = 0;
          for (var j = 0; j < sideData.length; j++) q += sideData[j] * sideData[j];
          return Math.sqrt(q / sideData.length);
        };
        say({ e: 'level', rms: Math.sqrt(s / levelData.length), peak: pk, l: side(anL), r: side(anR), voices: voiceCount() });
      };
      levelTimer = setT(tick, 180);
    }

    function loadBuffer(m) {
      if (!ctx) { say({ e: 'buffer', id: m.id, ok: false, why: 'no-context' }); return; }
      try {
        var chans = m.f32 || [];
        if (!m.f32 && m.i16) { chans = []; for (var c = 0; c < m.i16.length; c++) chans.push(b64ToFloat(m.i16[c])); }
        if (!chans.length || !chans[0].length) { say({ e: 'buffer', id: m.id, ok: false, why: 'empty' }); return; }
        var buf = ctx.createBuffer(chans.length, chans[0].length, m.sr);
        for (var i = 0; i < chans.length; i++) buf.getChannelData(i).set(chans[i]);
        buffers[m.id] = buf;
        if (revBufId === m.id) { revBufId = null; revBuf = null; }
        say({ e: 'buffer', id: m.id, ok: true, seconds: buf.duration });
      } catch (e) {
        say({ e: 'buffer', id: m.id, ok: false, why: String(e && e.message || e) });
      }
    }

    /* ── the shared reverb ────────────────────────────────────────────── */

    /** A copy of a buffer at the context's own sample rate (linear
     *  interpolation). A convolver accepts an impulse at no other rate. The
     *  bank's impulse is authored at 48 kHz, so on most devices nothing is
     *  converted; elsewhere its content (under 6 kHz) is far from either
     *  rate's limit, where straight-line steps would leave images. */
    function atContextRate(b) {
      var k = ctx.sampleRate / b.sampleRate;
      var n = Math.max(1, Math.round(b.length * k));
      var o = ctx.createBuffer(b.numberOfChannels, n, ctx.sampleRate);
      for (var c = 0; c < b.numberOfChannels; c++) {
        var x = b.getChannelData(c), y = o.getChannelData(c);
        for (var i = 0; i < n; i++) {
          var p = i / k, j = Math.floor(p), f = p - j;
          y[i] = (j < x.length ? x[j] : 0) * (1 - f) + (j + 1 < x.length ? x[j + 1] : 0) * f;
        }
      }
      return o;
    }

    function setReverb(m) {
      if (!ctx) { say({ e: 'reverb', ok: false, why: 'no-context' }); return; }
      var ir = buffers[m.buf];
      if (!ir) { say({ e: 'reverb', ok: false, why: 'missing-buffer' }); return; }
      try {
        if (revBufId !== m.buf || !revBuf) {
          revBuf = ir.sampleRate === ctx.sampleRate ? ir : atContextRate(ir);
          convolver.buffer = revBuf;
          revBufId = m.buf;
        }
        revGain = clamp(num(m.gain, 0.5), 0, 2);
        rampTo(revOut.gain, revGain, 0.05);
        say({ e: 'reverb', ok: true });
      } catch (e) {
        revBuf = null;
        revBufId = null;
        revGain = 0;
        try { rampTo(revOut.gain, 0, 0.02); } catch (e2) { /* nothing to shut */ }
        say({ e: 'reverb', ok: false, why: String(e && e.message || e) });
      }
    }

    /** STOP ALL: the reverb's tail must end too. A convolver cannot be
     *  emptied, so the old one fades out with the fade and is let go, while
     *  a fresh one takes every bus's send AT ONCE: a sound started right
     *  after STOP ALL rings in the room as it should. */
    function flushReverb(fade) {
      // nothing was sent into it since it was last emptied: nothing to end
      if (!ctx || !convolver || !revFed) return;
      revFed = false;
      var old = { inp: revIn, conv: convolver, out: revOut };
      rampTo(old.out.gain, 0, fade);
      makeReverb();
      for (var i = 0; i < BUSES.length; i++) {
        var sg = busSend[BUSES[i]];
        try { sg.disconnect(old.inp); } catch (e) { drop(sg); }
        sg.connect(revIn);
      }
      setT(function () { drop(old.inp); drop(old.conv); drop(old.out); }, Math.round(fade * 1000) + 15);
    }

    /* ── voices ───────────────────────────────────────────────────────── */

    function setPos(p, pos, at, ramp, first) {
      var x = num(pos && pos[0], 0), y = num(pos && pos[1], 0), z = num(pos && pos[2], -1);
      if (p.positionX) {
        if (first) { setBase(p.positionX, x); setBase(p.positionY, y); setBase(p.positionZ, z); }
        else { rampTo(p.positionX, x, ramp, at); rampTo(p.positionY, y, ramp, at); rampTo(p.positionZ, z, ramp, at); }
      } else if (p.setPosition) p.setPosition(x, y, z);
    }

    /** How a voice is placed between the ears: voice gain → (panner) →
     *  placement gain → its bus. Returns the panner (or null), the mode that
     *  was really built, and the placement gain with the level it holds. */
    function place(g, mode, m, bus, level0) {
      var pan = null, level = 1, built = 'none';
      if (mode === 'hrtf' && ctx.createPanner) {
        pan = ctx.createPanner();
        pan.panningModel = 'HRTF';
        pan.distanceModel = 'inverse';
        pan.rolloffFactor = 0; // the MODEL owns distance; the panner only places
        setPos(pan, m.pos, 0, 0, true);
        level = HRTF_TRIM;
        built = 'hrtf';
      } else if (mode === 'stereo' && ctx.createStereoPanner) {
        pan = ctx.createStereoPanner();
        setBase(pan.pan, clamp(num(m.pan, 0), -1, 1));
        built = 'stereo';
      }
      var out = ctx.createGain();
      setBase(out.gain, level0 == null ? level : level0);
      if (pan) { g.connect(pan); pan.connect(out); }
      else g.connect(out);
      out.connect(bus);
      return { pan: pan, out: out, mode: built, level: level };
    }

    /** Every node of a voice that is connected to something shared. */
    function unplug(o) {
      drop(o.out);
      drop(o.pan);
      drop(o.rs);
      drop(o.g);
    }

    function releaseVoice(v) {
      var o = voices[v];
      if (!o) return null;
      delete voices[v];
      unplug(o);
      forget(o);
      return o;
    }

    /** Fade anything that can sound (a voice, a stem, a stinger) to silence
     *  within fade seconds and stop its source then. One already fading out
     *  more slowly is cut short; one already ending sooner is left alone. */
    function halt(rec, fade, t) {
      var end = t + fade + 0.01;
      if (rec.stopAt != null && rec.stopAt <= end) return false;
      rampTo(rec.g.gain, 0, fade, t);
      try { rec.src.stop(end); } catch (e) { /* never started, or gone */ }
      rec.stopAt = end;
      return true;
    }

    function start(m) {
      if (!ctx) { say({ e: 'failed', v: m.v, why: 'no-context' }); return; }
      if (ctx.state !== 'running') { say({ e: 'failed', v: m.v, why: 'suspended' }); return; }
      var buf = buffers[m.buf];
      if (!buf) { say({ e: 'failed', v: m.v, why: 'missing-buffer', detail: String(m.buf) }); return; }
      var bus = buses[m.bus];
      if (!bus) { say({ e: 'failed', v: m.v, why: 'bad-bus', detail: String(m.bus) }); return; }
      // a voice still under this id (playing or fading) goes in 10 ms; it
      // stays in the live list until its last sample
      if (voices[m.v]) stop({ v: m.v, fade: 0.01 });
      var rec = null;
      try {
        var t0 = now() + num(m.delay, 0);
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = !!m.loop;
        setBase(src.playbackRate, clamp(num(m.rate, 1), 0.25, 4));
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        setBase(lp.frequency, clamp(num(m.lowpass, 20000), 40, 20000));
        lp.Q.value = 0.707;
        var g = ctx.createGain();
        var target = clamp(num(m.gain, 1), 0, 4);
        var fadeIn = m.fadeIn > 0 ? m.fadeIn : 0;
        if (fadeIn) {
          // silent until the fade begins: a SET or STOP in the same batch
          // must find 0 here, not the gain node's default of 1 (check E,
          // problem 2: the room bed clicked on every SCENE ON)
          setBase(g.gain, 0);
          pSet(g.gain, 0, t0);
          pLin(g.gain, target, t0 + fadeIn);
        } else setBase(g.gain, target);
        src.connect(lp);
        lp.connect(g);
        var pl = place(g, m.mode || 'none', m, bus, null);
        var rs = ctx.createGain();
        var send = clamp(num(m.rev, 0), 0, 1);
        setBase(rs.gain, send);
        if (send > 0) revFed = true;
        g.connect(rs);
        rs.connect(busSend[m.bus]);
        rec = { kind: 'voice', src: src, lp: lp, g: g, pan: pl.pan, mode: pl.mode, want: m.mode || 'none', out: pl.out, rs: rs, bus: bus, t0: t0, fadeEnd: t0 + fadeIn, stopping: false, stopAt: null };
        voices[m.v] = rec;
        live.push(rec);
        src.onended = function () {
          forget(rec);
          // a voice replaced by a newer start under the same id still has to
          // let go of its nodes (audit 2, F29); only the CURRENT one reports
          if (voices[m.v] !== rec) { unplug(rec); return; }
          releaseVoice(m.v);
          say({ e: 'ended', v: m.v, why: rec.stopping ? 'stopped' : 'natural' });
        };
        src.start(t0);
        say({ e: 'started', v: m.v, at: t0, now: now() });
      } catch (e) {
        if (rec && voices[m.v] === rec) releaseVoice(m.v);
        say({ e: 'failed', v: m.v, why: 'error', detail: String(e && e.message || e) });
      }
    }

    /** Move a LIVING voice to another renderer (stereo pan ↔ head-related
     *  3D) without restarting its source: the new placement fades in as the
     *  old one fades out, and a loop keeps its place (audit 2, F26). */
    function replace(o, m) {
      var t = now();
      var old = { pan: o.pan, out: o.out };
      var pl = place(o.g, m.mode, m, o.bus, 0);
      rampTo(old.out.gain, 0, XFADE, t);
      rampTo(pl.out.gain, pl.level, XFADE, t);
      o.pan = pl.pan;
      o.out = pl.out;
      o.mode = pl.mode;
      o.want = m.mode;
      setT(function () {
        try { o.g.disconnect(old.pan || old.out); } catch (e) { /* already gone */ }
        drop(old.out);
        drop(old.pan);
      }, Math.round(XFADE * 1000) + 30);
    }

    /** A new gain for a voice. While its fade-in has not finished, the fade
     *  is re-aimed: from silence (or from where it is) to the new gain at the
     *  fade's own end, so a voice started with a fade still fades in. */
    function setGain(o, gain, ramp) {
      var t = now();
      if (o.fadeEnd > o.t0 && t < o.fadeEnd) {
        var from = t > o.t0 ? t : o.t0;
        holdAt(o.g.gain, from);
        pLin(o.g.gain, gain, o.fadeEnd);
      } else rampTo(o.g.gain, gain, ramp);
    }

    function setVoice(m) {
      var o = voices[m.v];
      if (!o || !ctx) return;
      var ramp = num(m.ramp, 0.04);
      if (m.mode != null && m.mode !== o.want && !o.stopping) replace(o, m);
      if (m.gain != null && !o.stopping) setGain(o, clamp(m.gain, 0, 4), ramp);
      if (m.rate != null) rampTo(o.src.playbackRate, clamp(m.rate, 0.25, 4), ramp);
      if (m.lowpass != null) rampFreq(o.lp.frequency, clamp(m.lowpass, 40, 20000), ramp);
      if (m.rev != null) { rampTo(o.rs.gain, clamp(m.rev, 0, 1), ramp); if (m.rev > 0) revFed = true; }
      if (m.pan != null && o.mode === 'stereo' && o.pan) rampTo(o.pan.pan, clamp(m.pan, -1, 1), ramp);
      if (m.pos && o.mode === 'hrtf' && o.pan) setPos(o.pan, m.pos, now(), ramp, false);
    }

    /** Stop a voice with a fade. A voice already fading out more slowly is
     *  re-faded with this shorter fade (check E, problem 1). */
    function stop(m) {
      var o = voices[m.v];
      if (!o || !ctx) return;
      var fade = clamp(num(m.fade, 0.03), 0.005, 10);
      o.stopping = true;
      try { halt(o, fade, now()); } catch (e) { releaseVoice(m.v); say({ e: 'ended', v: m.v, why: 'stopped' }); }
    }

    /* ── music transport ──────────────────────────────────────────────── */

    function unitOf(kind) {
      if (!music) return 0;
      return kind === 'beat' ? music.beat : kind === 'phrase' ? music.phrase : music.bar;
    }
    /** The next boundary of this kind that is at least LEAD away, plus the
     *  room a stinger's own pickup needs before the line (lead seconds). */
    function nextBoundary(kind, lead) {
      var t = now();
      var room = lead > 0 ? lead : 0;
      if (!music || kind === 'now') return t + 0.01 + room;
      var u = unitOf(kind);
      var n = Math.ceil((t + LEAD + room - music.t0) / u - 1e-9);
      if (n < 0) n = 0;
      return music.t0 + n * u;
    }

    function musicStart(m) {
      if (!ctx) return;
      if (ctx.state !== 'running') { say({ e: 'failed', v: 'music', why: 'suspended' }); return; }
      // The engine's OWN restart: no "stopped" is announced for it. That word
      // is kept for a stop COMMAND, or the lab would read the music it just
      // restarted as off (audit 2, F5).
      if (music) musicStop({ fade: 0.02 }, true);
      var beat = 60 / m.bpm;
      var mu = { t0: now() + 0.12, beat: beat, bar: beat * m.beatsPerBar, phrase: beat * m.beatsPerBar * m.barsPerPhrase, stems: {}, order: [], pending: {} };
      for (var i = 0; i < m.stems.length; i++) {
        var s = m.stems[i];
        var buf = buffers[s.buf];
        if (!buf) { say({ e: 'failed', v: 'music:' + s.id, why: 'missing-buffer', detail: String(s.buf) }); continue; }
        var st = makeStem(buf, clamp(num(s.gain, 0), 0, 4));
        st.src.start(mu.t0); // ONE clock time for every stem
        mu.stems[s.id] = st;
        mu.order.push(s.id);
      }
      music = mu;
      say({ e: 'music', what: 'started', at: mu.t0, bar: mu.bar, beat: mu.beat, phrase: mu.phrase });
    }
    function makeStem(buf, gain) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      var g = ctx.createGain();
      setBase(g.gain, gain);
      src.connect(g);
      g.connect(buses.music);
      var st = { kind: 'stem', src: src, g: g, target: gain, stopAt: null };
      live.push(st);
      src.onended = function () { forget(st); drop(g); }; // a stopped stem lets go of the bus (F29)
      return st;
    }

    function musicLayers(m) {
      if (!music || !ctx) return;
      var t = now();
      var immediate = m.at === 'now';
      var at = immediate ? t : nextBoundary(m.at, 0);
      var ramp = num(m.ramp, 0.03);
      var prev = {}, saved = {};
      for (var id in m.gains) {
        if (!m.gains.hasOwnProperty(id)) continue;
        var st = music.stems[id];
        if (!st) continue;
        var val = clamp(num(m.gains[id], 0), 0, 4);
        // the lab sends every layer each time: one that does not change is
        // not touched at all (check E, problem 3)
        if (val === st.target) continue;
        prev[id] = st.target;
        // NOW moves from where the layer IS (F21). A change on a line holds
        // whatever the layer is doing (a NOW fade included) up to the line
        // and moves from the value it has THERE.
        if (!immediate) saved[id] = pointsFrom(st.g.gain, at);
        rampTo(st.g.gain, val, ramp, at);
        st.target = val;
      }
      var inS = Math.max(0, at - t);
      var timer = setT(function () {
        if (!music || !music.pending[m.req]) return;
        delete music.pending[m.req];
        say({ e: 'music', what: 'applied', req: m.req, at: at });
      }, Math.round(inS * 1000) + 20);
      music.pending[m.req] = { kind: 'layers', at: at, prev: prev, saved: saved, timer: timer };
      say({ e: 'music', what: 'queued', req: m.req, at: at, inS: inS, boundary: m.at });
    }

    /* A stinger's life: scheduled → (pickup begins at t0) → its HIT lands on
       the line (at) → "applied" is reported → it ends by itself or is
       stopped. Every stinger that was reported "applied" is followed by
       exactly one "stinger" event (ended or stopped). */

    function stingerApplied(rec) {
      if (rec.applied || rec.done) return;
      rec.applied = true;
      if (rec.timer != null) { clearT(rec.timer); rec.timer = null; }
      if (rec.mu && rec.mu.pending[rec.req]) delete rec.mu.pending[rec.req];
      say({ e: 'music', what: 'applied', req: rec.req, at: rec.at });
    }
    function stingerOver(rec, state) {
      if (rec.done) return;
      // it played to its end before the report timer ran (a throttled tab):
      // it WAS applied, and the lab is told so first
      if (state === 'ended' && !rec.withdrawn) stingerApplied(rec);
      rec.done = true;
      if (rec.timer != null) { clearT(rec.timer); rec.timer = null; }
      if (rec.mu && rec.mu.pending[rec.req]) delete rec.mu.pending[rec.req];
      if (stingers[rec.req] === rec) delete stingers[rec.req];
      if (rec.applied) say({ e: 'music', what: 'stinger', req: rec.req, state: state });
    }
    /** Silence a stinger: one still waiting is unscheduled, one that has
     *  begun fades out. Its gain lets go of the bus when its source ends. */
    function stingerStop(rec, fade) {
      if (rec.done) return;
      var t = now();
      if (t < rec.t0) {
        try { rec.src.stop(0); } catch (e) { /* never started */ }
        rec.stopAt = t;
        drop(rec.g);
        forget(rec);
      } else halt(rec, fade, t);
      stingerOver(rec, 'stopped');
    }

    function musicStinger(m) {
      if (!music || !ctx) return;
      var buf = buffers[m.buf];
      if (!buf) { say({ e: 'failed', v: 'music:stinger', why: 'missing-buffer', detail: String(m.buf) }); return; }
      if (stingers[m.req]) stingerStop(stingers[m.req], 0.01);
      // the file's HIT is "lead" seconds in: it starts that much before the
      // line, on the first line that leaves room for it (audit 2, F9)
      var lead = clamp(num(m.lead, 0), 0, buf.duration);
      var at = nextBoundary(m.at, lead);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var g = ctx.createGain();
      setBase(g.gain, clamp(num(m.gain, 1), 0, 4));
      src.connect(g);
      g.connect(buses.music);
      var rec = { kind: 'stinger', req: m.req, src: src, g: g, at: at, t0: at - lead, mu: music, applied: false, done: false, withdrawn: false, timer: null, stopAt: null };
      src.onended = function () { forget(rec); drop(g); stingerOver(rec, 'ended'); };
      src.start(rec.t0);
      stingers[m.req] = rec;
      live.push(rec);
      var inS = Math.max(0, at - now());
      rec.timer = setT(function () { rec.timer = null; stingerApplied(rec); }, Math.round(inS * 1000) + 20);
      music.pending[m.req] = { kind: 'stinger', at: at, rec: rec, timer: rec.timer };
      say({ e: 'music', what: 'queued', req: m.req, at: at, inS: inS, boundary: m.at });
    }

    /** Withdraw a change that has not reached its boundary: nothing of it
     *  may sound later, and what the layers were doing before it (a NOW fade
     *  still running, say) goes on as if it had never been asked (check E,
     *  problem 3). One whose line has ALREADY passed did sound: it is
     *  reported applied, and nothing is undone (audit 2, F22). */
    function musicCancel(m) {
      if (!music) return;
      var p = music.pending[m.req];
      if (!p) return;
      if (now() >= p.at) {
        if (p.kind === 'stinger') { stingerApplied(p.rec); return; }
        delete music.pending[m.req];
        clearT(p.timer);
        say({ e: 'music', what: 'applied', req: m.req, at: p.at });
        return;
      }
      delete music.pending[m.req];
      clearT(p.timer);
      if (p.kind === 'stinger') {
        // its pickup may already be sounding: it is faded out before the line
        p.rec.withdrawn = true;
        stingerStop(p.rec, 0.03);
      } else {
        for (var id in p.prev) {
          if (!p.prev.hasOwnProperty(id)) continue;
          var st = music.stems[id];
          if (!st) continue;
          pCancel(st.g.gain, p.at);
          putBack(st.g.gain, p.saved[id] || []);
          st.target = p.prev[id];
        }
      }
      say({ e: 'music', what: 'cancelled', req: m.req });
    }

    /** Stop the music and every stinger, waiting or sounding. QUIET is the
     *  engine's own restart inside a music start: no "stopped" is sent. */
    function musicStop(m, quiet) {
      var fade = clamp(num(m && m.fade, 0.05), 0.005, 10);
      var ids = [];
      for (var q in stingers) if (stingers.hasOwnProperty(q)) ids.push(q);
      for (var k = 0; k < ids.length; k++) stingerStop(stingers[ids[k]], fade);
      if (!music) return;
      var mu = music;
      music = null;
      var t = now();
      for (var req in mu.pending) {
        if (!mu.pending.hasOwnProperty(req)) continue;
        clearT(mu.pending[req].timer);
      }
      mu.pending = {};
      for (var i = 0; i < mu.order.length; i++) halt(mu.stems[mu.order[i]], fade, t);
      if (!quiet) say({ e: 'music', what: 'stopped' });
    }

    function stopAll(m) {
      var fade = clamp(num(m && m.fade, 0.03), 0.005, 10);
      var ids = [];
      for (var v in voices) if (voices.hasOwnProperty(v)) ids.push(v);
      for (var i = 0; i < ids.length; i++) stop({ v: ids[i], fade: fade });
      musicStop({ fade: fade });
      // and everything else still sounding: a voice replaced under its id,
      // stems and stingers already fading after a music stop (problem 1)
      var t = now(), all = live.slice();
      for (var j = 0; j < all.length; j++) {
        try {
          halt(all[j], fade, t);
          // nothing of a stopped voice may reach the fresh reverb: its send
          // closes at once (what it already sent rings out in the old one,
          // which fades with the fade)
          if (all[j].rs && revFed) rampTo(all[j].rs.gain, 0, 0, t);
        } catch (e) { /* gone */ }
      }
      flushReverb(fade);
    }

    function dispose() {
      if (levelTimer != null) { clearT(levelTimer); levelTimer = null; }
      stopAll({ fade: 0.01 });
      var c = ctx;
      ctx = null;
      buffers = {};
      voices = {};
      stingers = {};
      live = [];
      revBuf = null;
      revBufId = null;
      if (c && c.close) { try { c.close(); } catch (e) { /* already closed */ } }
      say({ e: 'state', state: 'closed' });
    }

    function setBus(m) {
      if (!ctx || !buses[m.bus]) return;
      var gain = clamp(num(m.gain, 1), 0, 4), ramp = num(m.ramp, 0.05);
      rampTo(buses[m.bus].gain, gain, ramp);
      // the bus's reverb send moves with it: MUTE, SOLO, the fader and the
      // duck reach the wet sound as they reach the dry (audit 2, F8)
      rampTo(busSend[m.bus].gain, gain, ramp);
    }

    function handle(m) {
      try {
        switch (m.t) {
          case 'init': init(); break;
          case 'buffer': loadBuffer(m); break;
          case 'start': start(m); break;
          case 'set': setVoice(m); break;
          case 'stop': stop(m); break;
          case 'bus': setBus(m); break;
          case 'master': if (ctx) rampTo(master.gain, clamp(num(m.gain, 0.7), 0, 1), num(m.ramp, 0.05)); break;
          case 'mono': if (ctx) { monoOn = !!m.on; wireMaster(); } break;
          // MEASURE ONLY: the graph runs and the level tap reads it, but the
          // device gets nothing (the tap sits before the ceiling gain).
          case 'silent': if (ctx) rampTo(ceiling.gain, m.on ? 0 : CEILING, 0.02); break;
          case 'reverb': setReverb(m); break;
          case 'music':
            if (m.op === 'start') musicStart(m);
            else if (m.op === 'layers') musicLayers(m);
            else if (m.op === 'stinger') musicStinger(m);
            else if (m.op === 'cancel') musicCancel(m);
            else if (m.op === 'stop') musicStop(m, false);
            break;
          case 'stopAll': stopAll(m); break;
          case 'suspend': if (ctx && ctx.suspend) ctx.suspend(); break;
          case 'resume': if (ctx && ctx.resume) ctx.resume(); break;
          case 'ping':
            say({ e: 'clock', now: now(), state: stateOf(), latencyS: ctx ? num(ctx.outputLatency, num(ctx.baseLatency, -1)) < 0 ? null : num(ctx.outputLatency, ctx.baseLatency) : null });
            break;
          case 'dispose': dispose(); break;
          default: break;
        }
      } catch (e) {
        say({ e: 'error', msg: String(e && e.message || e) });
      }
    }

    return { handle: handle };
  }

  root.__gaCreateEngine = create;
  root.__gaEngineVersion = 3;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
`;

/** The page a phone's hidden web view loads: the engine plus a two-line
 *  bridge. Commands arrive through window.__ga(msg); events leave through
 *  ReactNativeWebView.postMessage. Its first message carries `hello: true`:
 *  nothing else the engine sends does (check E, problem 7). */
export function gaEngineHtml(): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
    '<script>' +
    GA_ENGINE_JS +
    '</script><script>' +
    '(function(){var post=function(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}};' +
    'var eng=window.__gaCreateEngine({post:post,AudioContext:window.AudioContext||window.webkitAudioContext});' +
    'window.__ga=function(m){eng.handle(m);};post({e:"clock",now:0,state:"closed",latencyS:null,hello:true});})();' +
    '</script></body></html>'
  );
}

/** What the web view is told as the lab closes: stop, then let go (sent
 *  while its ref is still set: engine/GaEngineHost, audit 2 F18). */
export const GA_CLOSING_JS = 'if(window.__ga){window.__ga({"t":"stopAll","fade":0.01});window.__ga({"t":"dispose"});}true;';

/** The page's first message (the last line of gaEngineHtml). Seen AGAIN from
 *  a page that is already attached, it means the page reloaded: its engine
 *  is new and holds nothing. A ping answered before init or after dispose
 *  looks the same in every other field, so only `hello` decides. */
export function gaIsPageHello(m: GaEvt): boolean {
  return m.e === 'clock' && m.hello === true;
}
