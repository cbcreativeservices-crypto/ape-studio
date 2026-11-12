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
 *   voice:  buffer source → low-pass → voice gain → panner ─┐
 *                                        └→ reverb send ─┐  │
 *   reverb: convolver → return ──────────────────────────┼──┤
 *   bus[ambience|sfx|dialogue|music|ui|chat] gain ←──────┴──┘
 *        → pre-master → (mono fold-down) → lab master → protective limiter
 *        → level tap → OUTPUT CEILING (−12 dBFS, features/audio/outputCeiling)
 *        → the device
 *
 * Every stage is applied ONCE. The protective limiter is listener protection
 * only (many voices can sum above full scale); it is not a teaching control.
 *
 * MUSIC TIMING lives here, on the audio clock: the stems start on one clock
 * time, and a change asked "on the next bar" is written into the gain
 * automation at that bar's clock time. A JS timer only REPORTS that the
 * boundary passed; it never moves audio.
 *
 * Written in plain ES2017 with no imports and no template literals inside,
 * because this whole file is one String.raw template.
 */
export const GA_ENGINE_VERSION = 1;

/** The fixed output ceiling, linear (−12 dBFS). Kept equal to
 *  features/audio/outputCeiling PLAYBACK_CEILING by test. */
export const GA_OUTPUT_CEILING = 0.251188643150958;

export const GA_ENGINE_JS = String.raw`
(function (root) {
  'use strict';
  var BUSES = ['ambience', 'sfx', 'dialogue', 'music', 'ui', 'chat'];
  var CEILING = 0.251188643150958;
  var LEAD = 0.06; // seconds between "now" and the earliest boundary we promise

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
    var pre = null, monoNode = null, master = null, limiter = null, analyser = null, ceiling = null;
    var splitter = null, anL = null, anR = null, sideData = null;
    var revIn = null, convolver = null, revOut = null;
    var monoOn = false;
    var music = null;
    var levelTimer = null;
    var levelData = null;

    function say(m) { try { post(m); } catch (e) { /* the host is gone */ } }
    function now() { return ctx ? ctx.currentTime : 0; }
    function stateOf() { return !ctx ? 'closed' : ctx.state === 'running' ? 'running' : ctx.state === 'closed' ? 'closed' : 'suspended'; }
    function num(x, d) { return typeof x === 'number' && isFinite(x) ? x : d; }
    function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

    /** Move an AudioParam to a value over ramp seconds, replacing whatever
     *  automation was pending — one ramp at a time, never a stack of them. */
    function rampTo(param, value, ramp, at) {
      var t = at == null ? now() : at;
      var cur = param.value;
      try { param.cancelScheduledValues(t); } catch (e) { /* older engines */ }
      if (!(ramp > 0)) { param.setValueAtTime(value, t); return; }
      param.setValueAtTime(cur, t);
      param.linearRampToValueAtTime(value, t + ramp);
    }

    function wireMaster() {
      try { pre.disconnect(); } catch (e) { /* not connected yet */ }
      try { monoNode.disconnect(); } catch (e) { /* not connected yet */ }
      if (monoOn) { pre.connect(monoNode); monoNode.connect(master); }
      else pre.connect(master);
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
      master.gain.value = 0.7;
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -2;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.12;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      levelData = new Float32Array(analyser.fftSize);
      ceiling = ctx.createGain();
      ceiling.gain.value = CEILING;
      wireMaster();
      master.connect(limiter);
      limiter.connect(analyser);
      // left and right measured separately, so the lab can SHOW a pan
      if (ctx.createChannelSplitter) {
        splitter = ctx.createChannelSplitter(2);
        anL = ctx.createAnalyser();
        anR = ctx.createAnalyser();
        anL.fftSize = 1024;
        anR.fftSize = 1024;
        sideData = new Float32Array(1024);
        limiter.connect(splitter);
        splitter.connect(anL, 0);
        splitter.connect(anR, 1);
      }
      limiter.connect(ceiling);
      ceiling.connect(ctx.destination);

      for (var i = 0; i < BUSES.length; i++) {
        var g = ctx.createGain();
        g.connect(pre);
        buses[BUSES[i]] = g;
      }
      revIn = ctx.createGain();
      convolver = ctx.createConvolver();
      revOut = ctx.createGain();
      revOut.gain.value = 0;
      revIn.connect(convolver);
      convolver.connect(revOut);
      revOut.connect(pre);

      ctx.onstatechange = function () { say({ e: 'state', state: stateOf() }); };
      if (ctx.state !== 'running' && ctx.resume) { try { ctx.resume(); } catch (e4) { /* reported by state */ } }
      startLevels();
      say({ e: 'ready', sr: ctx.sampleRate, state: stateOf(), hrtf: true });
    }

    function startLevels() {
      if (levelTimer != null) return;
      var tick = function () {
        levelTimer = setT(tick, 180);
        if (!ctx || ctx.state !== 'running' || !analyser.getFloatTimeDomainData) return;
        var count = 0;
        for (var k in voices) if (voices.hasOwnProperty(k)) count++;
        if (music) count += music.order.length;
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
        say({ e: 'level', rms: Math.sqrt(s / levelData.length), peak: pk, l: side(anL), r: side(anR), voices: count });
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
        say({ e: 'buffer', id: m.id, ok: true, seconds: buf.duration });
      } catch (e) {
        say({ e: 'buffer', id: m.id, ok: false, why: String(e && e.message || e) });
      }
    }

    function setPos(p, pos, at, ramp) {
      var x = num(pos && pos[0], 0), y = num(pos && pos[1], 0), z = num(pos && pos[2], -1);
      if (p.positionX) { rampTo(p.positionX, x, ramp, at); rampTo(p.positionY, y, ramp, at); rampTo(p.positionZ, z, ramp, at); }
      else if (p.setPosition) p.setPosition(x, y, z);
    }

    function releaseVoice(v) {
      var o = voices[v];
      if (!o) return null;
      delete voices[v];
      try { o.out.disconnect(); } catch (e) { /* already gone */ }
      if (o.rs) { try { o.rs.disconnect(); } catch (e2) { /* already gone */ } }
      return o;
    }

    function start(m) {
      if (!ctx) { say({ e: 'failed', v: m.v, why: 'no-context' }); return; }
      if (ctx.state !== 'running') { say({ e: 'failed', v: m.v, why: 'suspended' }); return; }
      var buf = buffers[m.buf];
      if (!buf) { say({ e: 'failed', v: m.v, why: 'missing-buffer', detail: String(m.buf) }); return; }
      var bus = buses[m.bus];
      if (!bus) { say({ e: 'failed', v: m.v, why: 'bad-bus', detail: String(m.bus) }); return; }
      if (voices[m.v]) stop({ v: m.v, fade: 0.01 });
      try {
        var t0 = now() + num(m.delay, 0);
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = !!m.loop;
        src.playbackRate.value = clamp(num(m.rate, 1), 0.25, 4);
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = clamp(num(m.lowpass, 20000), 40, 20000);
        lp.Q.value = 0.707;
        var g = ctx.createGain();
        var target = clamp(num(m.gain, 1), 0, 4);
        if (m.fadeIn > 0) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(target, t0 + m.fadeIn); }
        else g.gain.value = target;
        src.connect(lp);
        lp.connect(g);
        var out = g, pan = null, mode = m.mode || 'none';
        if (mode === 'hrtf' && ctx.createPanner) {
          pan = ctx.createPanner();
          pan.panningModel = 'HRTF';
          pan.distanceModel = 'inverse';
          pan.rolloffFactor = 0; // the MODEL owns distance; the panner only places
          setPos(pan, m.pos, t0, 0);
          g.connect(pan);
          out = pan;
        } else if (mode === 'stereo' && ctx.createStereoPanner) {
          pan = ctx.createStereoPanner();
          pan.pan.value = clamp(num(m.pan, 0), -1, 1);
          g.connect(pan);
          out = pan;
        }
        out.connect(bus);
        var rs = ctx.createGain();
        rs.gain.value = clamp(num(m.rev, 0), 0, 1);
        g.connect(rs);
        rs.connect(revIn);
        var rec = { src: src, lp: lp, g: g, pan: pan, mode: mode, out: out, rs: rs, stopping: false };
        voices[m.v] = rec;
        src.onended = function () {
          if (voices[m.v] !== rec) return;
          releaseVoice(m.v);
          say({ e: 'ended', v: m.v, why: rec.stopping ? 'stopped' : 'natural' });
        };
        src.start(t0);
        say({ e: 'started', v: m.v, at: t0, now: now() });
      } catch (e) {
        releaseVoice(m.v);
        say({ e: 'failed', v: m.v, why: 'error', detail: String(e && e.message || e) });
      }
    }

    function setVoice(m) {
      var o = voices[m.v];
      if (!o || !ctx) return;
      var ramp = num(m.ramp, 0.04);
      if (m.gain != null) rampTo(o.g.gain, clamp(m.gain, 0, 4), ramp);
      if (m.rate != null) rampTo(o.src.playbackRate, clamp(m.rate, 0.25, 4), ramp);
      if (m.lowpass != null) rampTo(o.lp.frequency, clamp(m.lowpass, 40, 20000), ramp);
      if (m.rev != null) rampTo(o.rs.gain, clamp(m.rev, 0, 1), ramp);
      if (m.pan != null && o.mode === 'stereo' && o.pan) rampTo(o.pan.pan, clamp(m.pan, -1, 1), ramp);
      if (m.pos && o.mode === 'hrtf' && o.pan) setPos(o.pan, m.pos, now(), ramp);
    }

    function stop(m) {
      var o = voices[m.v];
      if (!o || !ctx) return;
      if (o.stopping) return;
      o.stopping = true;
      var fade = clamp(num(m.fade, 0.03), 0.005, 10);
      var t = now();
      rampTo(o.g.gain, 0, fade, t);
      try { o.src.stop(t + fade + 0.01); } catch (e) { releaseVoice(m.v); say({ e: 'ended', v: m.v, why: 'stopped' }); }
    }

    /* ── music transport ──────────────────────────────────────────────── */

    function unitOf(kind) {
      if (!music) return 0;
      return kind === 'beat' ? music.beat : kind === 'phrase' ? music.phrase : music.bar;
    }
    /** The next boundary of this kind that is at least LEAD away. */
    function nextBoundary(kind) {
      var t = now();
      if (!music || kind === 'now') return t + 0.01;
      var u = unitOf(kind);
      var n = Math.ceil((t + LEAD - music.t0) / u - 1e-9);
      if (n < 0) n = 0;
      return music.t0 + n * u;
    }

    function musicStart(m) {
      if (!ctx) return;
      if (ctx.state !== 'running') { say({ e: 'failed', v: 'music', why: 'suspended' }); return; }
      if (music) musicStop({ fade: 0.02 });
      var beat = 60 / m.bpm;
      var mu = { t0: now() + 0.12, beat: beat, bar: beat * m.beatsPerBar, phrase: beat * m.beatsPerBar * m.barsPerPhrase, stems: {}, order: [], pending: {} };
      for (var i = 0; i < m.stems.length; i++) {
        var s = m.stems[i];
        var buf = buffers[s.buf];
        if (!buf) { say({ e: 'failed', v: 'music:' + s.id, why: 'missing-buffer', detail: String(s.buf) }); continue; }
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        var g = ctx.createGain();
        g.gain.value = clamp(num(s.gain, 0), 0, 4);
        src.connect(g);
        g.connect(buses.music);
        src.start(mu.t0); // ONE clock time for every stem
        mu.stems[s.id] = { src: src, g: g, target: g.gain.value };
        mu.order.push(s.id);
      }
      music = mu;
      say({ e: 'music', what: 'started', at: mu.t0, bar: mu.bar, beat: mu.beat, phrase: mu.phrase });
    }

    function musicLayers(m) {
      if (!music || !ctx) return;
      var at = nextBoundary(m.at);
      var ramp = num(m.ramp, 0.03);
      var prev = {};
      for (var id in m.gains) {
        if (!m.gains.hasOwnProperty(id)) continue;
        var st = music.stems[id];
        if (!st) continue;
        prev[id] = st.target;
        var val = clamp(num(m.gains[id], 0), 0, 4);
        // hold the old value up to the boundary, then move
        st.g.gain.setValueAtTime(st.target, at);
        st.g.gain.linearRampToValueAtTime(val, at + ramp);
        st.target = val;
      }
      var inS = Math.max(0, at - now());
      var timer = setT(function () {
        if (!music || !music.pending[m.req]) return;
        delete music.pending[m.req];
        say({ e: 'music', what: 'applied', req: m.req, at: at });
      }, Math.round(inS * 1000) + 20);
      music.pending[m.req] = { kind: 'layers', at: at, prev: prev, timer: timer };
      say({ e: 'music', what: 'queued', req: m.req, at: at, inS: inS, boundary: m.at });
    }

    function musicStinger(m) {
      if (!music || !ctx) return;
      var buf = buffers[m.buf];
      if (!buf) { say({ e: 'failed', v: 'music:stinger', why: 'missing-buffer', detail: String(m.buf) }); return; }
      var at = nextBoundary(m.at);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var g = ctx.createGain();
      g.gain.value = clamp(num(m.gain, 1), 0, 4);
      src.connect(g);
      g.connect(buses.music);
      src.start(at);
      var inS = Math.max(0, at - now());
      var timer = setT(function () {
        if (!music || !music.pending[m.req]) return;
        delete music.pending[m.req];
        say({ e: 'music', what: 'applied', req: m.req, at: at });
      }, Math.round(inS * 1000) + 20);
      music.pending[m.req] = { kind: 'stinger', at: at, src: src, g: g, timer: timer };
      say({ e: 'music', what: 'queued', req: m.req, at: at, inS: inS, boundary: m.at });
    }

    /** Withdraw a change that has not reached its boundary: nothing of it
     *  may sound later. */
    function musicCancel(m) {
      if (!music) return;
      var p = music.pending[m.req];
      if (!p) return;
      delete music.pending[m.req];
      clearT(p.timer);
      if (p.kind === 'stinger') {
        try { p.src.stop(0); } catch (e) { /* never started */ }
        try { p.g.disconnect(); } catch (e2) { /* already gone */ }
      } else {
        for (var id in p.prev) {
          if (!p.prev.hasOwnProperty(id)) continue;
          var st = music.stems[id];
          if (!st) continue;
          try { st.g.gain.cancelScheduledValues(now()); } catch (e3) { /* older engines */ }
          st.g.gain.setValueAtTime(p.prev[id], now());
          st.target = p.prev[id];
        }
      }
      say({ e: 'music', what: 'cancelled', req: m.req });
    }

    function musicStop(m) {
      if (!music) return;
      var mu = music;
      music = null;
      var fade = clamp(num(m && m.fade, 0.05), 0.005, 10);
      var t = now();
      for (var req in mu.pending) {
        if (!mu.pending.hasOwnProperty(req)) continue;
        var p = mu.pending[req];
        clearT(p.timer);
        if (p.kind === 'stinger') { try { p.src.stop(0); } catch (e) { /* never started */ } }
      }
      for (var i = 0; i < mu.order.length; i++) {
        var st = mu.stems[mu.order[i]];
        try { st.g.gain.cancelScheduledValues(t); } catch (e2) { /* older engines */ }
        st.g.gain.setValueAtTime(st.g.gain.value, t);
        st.g.gain.linearRampToValueAtTime(0, t + fade);
        try { st.src.stop(t + fade + 0.01); } catch (e3) { /* already stopped */ }
      }
      say({ e: 'music', what: 'stopped' });
    }

    function stopAll(m) {
      var fade = num(m && m.fade, 0.03);
      var ids = [];
      for (var v in voices) if (voices.hasOwnProperty(v)) ids.push(v);
      for (var i = 0; i < ids.length; i++) stop({ v: ids[i], fade: fade });
      musicStop({ fade: fade });
    }

    function dispose() {
      if (levelTimer != null) { clearT(levelTimer); levelTimer = null; }
      stopAll({ fade: 0.01 });
      var c = ctx;
      ctx = null;
      buffers = {};
      voices = {};
      if (c && c.close) { try { c.close(); } catch (e) { /* already closed */ } }
      say({ e: 'state', state: 'closed' });
    }

    function handle(m) {
      try {
        switch (m.t) {
          case 'init': init(); break;
          case 'buffer': loadBuffer(m); break;
          case 'start': start(m); break;
          case 'set': setVoice(m); break;
          case 'stop': stop(m); break;
          case 'bus': if (ctx && buses[m.bus]) rampTo(buses[m.bus].gain, clamp(num(m.gain, 1), 0, 4), num(m.ramp, 0.05)); break;
          case 'master': if (ctx) rampTo(master.gain, clamp(num(m.gain, 0.7), 0, 1), num(m.ramp, 0.05)); break;
          case 'mono': if (ctx) { monoOn = !!m.on; wireMaster(); } break;
          // MEASURE ONLY: the graph runs and the level tap reads it, but the
          // device gets nothing (the tap sits before the ceiling gain).
          case 'silent': if (ctx) rampTo(ceiling.gain, m.on ? 0 : CEILING, 0.02); break;
          case 'reverb':
            if (ctx && buffers[m.buf]) { convolver.buffer = buffers[m.buf]; rampTo(revOut.gain, clamp(num(m.gain, 0.5), 0, 2), 0.05); }
            break;
          case 'music':
            if (m.op === 'start') musicStart(m);
            else if (m.op === 'layers') musicLayers(m);
            else if (m.op === 'stinger') musicStinger(m);
            else if (m.op === 'cancel') musicCancel(m);
            else if (m.op === 'stop') musicStop(m);
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
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
`;

/** The page a phone's hidden web view loads: the engine plus a two-line
 *  bridge. Commands arrive through window.__ga(msg); events leave through
 *  ReactNativeWebView.postMessage. */
export function gaEngineHtml(): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
    '<script>' +
    GA_ENGINE_JS +
    '</script><script>' +
    '(function(){var post=function(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}};' +
    'var eng=window.__gaCreateEngine({post:post,AudioContext:window.AudioContext||window.webkitAudioContext});' +
    'window.__ga=function(m){eng.handle(m);};post({e:"clock",now:0,state:"closed",latencyS:null});})();' +
    '</script></body></html>'
  );
}
