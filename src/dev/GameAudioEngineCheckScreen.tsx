/**
 * GameAudioEngineCheckScreen — the PROOF that the Game Audio lab's sound
 * engine works on THIS device (plan 2026-11-12 §6, must-do D60). A dev
 * surface, not a lesson: it is opened in the web preview
 * (`#labpreview/GameAudioEngineCheck`) and, for the phone proof, from a
 * preview update. It is not in the Labs menu, and it lives in src/dev because
 * it is a dev tool, not a lab screen.
 *
 * RUN ALL CHECKS drives the real engine through the fourteen things the lab
 * needs and prints what the ENGINE reported — measured levels and audio-clock
 * times, never "it should have worked":
 *
 *   1 the engine starts              7 a low-pass at 900 Hz lowers a bright
 *   2 a one-shot sounds; the bridge    sound (the wall and the door)
 *     round trip and the output      8 the 3D renderer places a sound
 *     delay are MEASURED             9 MONO folds both ears together
 *   3 three sounds overlap          10 a bus at zero is silent
 *   4 a loop sustains; a gain       11 the room reverb loads, and rings
 *     ramp changes its level        12 music: a change lands on the bar line
 *   5 a live pan moves the level    13 a stinger that has begun stops with
 *     L ↔ R                            STOP ALL
 *   6 stop is a stop: no voice,     14 an interruption is reported, and the
 *     no level                         engine comes back
 *
 * What line 2 measures (audit 2, F17). It used to print "started 0 ms after
 * the request": two numbers the engine wrote in the same call, 0 on any
 * device. It now times a PING there and back (app → engine → app: on a phone
 * that is the bridge into the web view and out again) before and after the
 * sound, and prints the output delay the device reports for itself. Neither
 * is the whole tap-to-ear delay: the ear's half is still for a listener.
 *
 * Each line is PASS / FAIL with the numbers. A line that needs ears (does it
 * sound right?) says so — this screen proves the plumbing, the owner's ears
 * prove the sound.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';
import { GaEngineHost } from '../screens/lab/gameaudio/engine/GaEngineHost';
import type { GaEvt } from '../screens/lab/gameaudio/engine/gaEngineProtocol';
import { useGaSound } from '../screens/lab/gameaudio/engine/useGaSound';
import { footstepId } from '../screens/lab/gameaudio/sounds/gaSoundBank';
import { MUSIC_BAR_S, MUSIC_BEATS_PER_BAR, MUSIC_BPM, MUSIC_BARS, MUSIC_STINGER_LEAD_S } from '../screens/lab/gameaudio/sounds/gaSynth';

type Line = { name: string; state: 'wait' | 'run' | 'pass' | 'fail'; detail: string };

const CHECKS = [
  'The engine starts',
  'A one-shot sounds',
  'Three sounds overlap',
  'A loop sustains; a gain ramp changes its level',
  'A live pan moves the level left and right',
  'Stop is a stop',
  'A low-pass at 900 Hz lowers a bright sound',
  'The 3D renderer places a sound to one side',
  'MONO folds both ears together, and back',
  'A bus at zero is silent, and comes back',
  'The room reverb loads, and rings',
  'Music: a change lands on the bar line',
  'A stinger that has begun stops with STOP ALL',
  'An interruption is reported; the engine comes back',
] as const;

/** Wall-clock milliseconds (a phone's JS engine has performance.now too). */
const wallMs = (): number => {
  const p = (globalThis as { performance?: { now?: () => number } }).performance;
  return p?.now ? p.now() : Date.now();
};

const db = (x: number) => (x > 1e-6 ? `${(20 * Math.log10(x)).toFixed(1)} dBFS` : 'silence');

export function GameAudioEngineCheckScreen() {
  const s = useGaSound();
  const { engine } = s;
  const [lines, setLines] = useState<Line[]>(CHECKS.map((name) => ({ name, state: 'wait', detail: '' })));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  /** MEASURE ONLY: run every check with the device output at zero. */
  const [silent, setSilent] = useState(false);
  const silentRef = useRef(false);
  silentRef.current = silent;
  // Every wait of a run is a timer held here and cleared when the screen
  // closes; a run that outlives the screen stops at its next wait.
  const alive = useRef(true);
  const waits = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    alive.current = true;
    const held = waits.current;
    return () => {
      alive.current = false;
      for (const t of held) clearTimeout(t);
      held.clear();
    };
  }, []);
  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (!alive.current) {
          reject(new Error('closed'));
          return;
        }
        const t = setTimeout(() => {
          waits.current.delete(t);
          if (alive.current) resolve();
          else reject(new Error('closed'));
        }, ms);
        waits.current.add(t);
      }),
    [],
  );

  const run = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const out: Line[] = CHECKS.map((name) => ({ name, state: 'wait', detail: '' }));
    const mark = (i: number, state: Line['state'], detail: string) => {
      out[i] = { ...out[i], state, detail };
      if (alive.current) setLines([...out]);
    };
    const events: GaEvt[] = [];
    const off = engine.subscribe((e) => events.push(e));
    const since = (n: number) => events.slice(n);
    /** The loudest level the engine measured over a stretch of time. */
    const listen = async (ms: number) => {
      const n = events.length;
      await sleep(ms);
      const lv = since(n).filter((e) => e.e === 'level') as Extract<GaEvt, { e: 'level' }>[];
      return {
        rms: lv.reduce((m, e) => Math.max(m, e.rms), 0),
        l: lv.reduce((m, e) => Math.max(m, e.l), 0),
        r: lv.reduce((m, e) => Math.max(m, e.r), 0),
        voices: lv.reduce((m, e) => Math.max(m, e.voices), 0),
        last: lv[lv.length - 1],
      };
    };
    /** There and back: a ping to the engine and its answer. Null = no answer
     *  inside 1.5 s. `latencyS` is the output delay the device reports. */
    const ping = async (): Promise<{ ms: number; latencyS: number | null } | null> => {
      const n = events.length;
      const t0 = wallMs();
      engine.send({ t: 'ping' });
      for (let waited = 0; waited < 1500; waited += 4) {
        const c = since(n).find((e) => e.e === 'clock') as Extract<GaEvt, { e: 'clock' }> | undefined;
        if (c) return { ms: wallMs() - t0, latencyS: c.latencyS };
        await sleep(4);
      }
      return null;
    };
    try {
      // 1
      mark(0, 'run', '');
      const on = await s.enable();
      if (!on) {
        mark(0, 'fail', `status: ${engine.status}${engine.lastError ? ` (${engine.lastError})` : ''}`);
        return;
      }
      engine.send({ t: 'silent', on: silentRef.current });
      mark(0, 'pass', `${engine.transportKind} transport, ${engine.sampleRate} Hz${silentRef.current ? ' — MEASURE ONLY, nothing is sent to the device' : ''}`);
      const need = ['door', footstepId('wood', 0), footstepId('stone', 1), footstepId('gravel', 2), 'gen_hum', 'gen_air', 'ir_room', 'mu_calm', 'mu_pulse', 'mu_drive', 'mu_stinger'];
      const missing = await s.ensure(need);
      if (missing.length) {
        mark(1, 'fail', `could not load: ${missing.join(', ')}`);
        return;
      }
      engine.send({ t: 'master', gain: 0.6 });

      // 2
      mark(1, 'run', '');
      const tripBefore = await ping();
      let n = events.length;
      engine.send({ t: 'start', v: 'chk-door', buf: 'door', bus: 'sfx', gain: 1, mode: 'none' });
      let heard = await listen(700);
      const st = since(n).find((e) => e.e === 'started' && e.v === 'chk-door') as Extract<GaEvt, { e: 'started' }> | undefined;
      const tripAfter = await ping();
      const trips = [tripBefore, tripAfter].map((t) => (t ? `${t.ms.toFixed(0)} ms` : 'no answer')).join(' and ');
      const lat = tripAfter?.latencyS ?? tripBefore?.latencyS ?? null;
      mark(
        1,
        st && heard.rms > 0.001 && tripBefore && tripAfter ? 'pass' : 'fail',
        st
          ? `scheduled at once (no delay asked); round trip to the engine and back ${trips}; output delay ${lat == null ? 'not reported by this device' : `${(lat * 1000).toFixed(0)} ms`}; loudest level ${db(heard.rms)}`
          : 'no start reported',
      );
      await sleep(700);

      // 3
      mark(2, 'run', '');
      n = events.length;
      [footstepId('wood', 0), footstepId('stone', 1), footstepId('gravel', 2)].forEach((buf, i) =>
        engine.send({ t: 'start', v: `chk-fs${i}`, buf, bus: 'sfx', gain: 1, mode: 'none', delay: i * 0.05 }),
      );
      heard = await listen(600);
      const starts = since(n).filter((e) => e.e === 'started').length;
      mark(2, starts === 3 && heard.voices >= 2 ? 'pass' : 'fail', `${starts} of 3 started; ${heard.voices} sounding at once`);
      await sleep(300);

      // 4
      mark(3, 'run', '');
      engine.send({ t: 'start', v: 'chk-hum', buf: 'gen_hum', bus: 'sfx', gain: 1, mode: 'stereo', pan: 0, loop: true, fadeIn: 0.1 });
      const loud = await listen(2400);
      engine.send({ t: 'set', v: 'chk-hum', gain: 0.25, ramp: 0.3 });
      await sleep(500);
      const quiet = await listen(900);
      const drop = 20 * Math.log10(loud.rms / Math.max(quiet.rms, 1e-9));
      mark(3, loud.rms > 0.005 && drop > 6 && drop < 20 ? 'pass' : 'fail', `2.4 s at ${db(loud.rms)}; after the ramp ${db(quiet.rms)} (${drop.toFixed(1)} dB lower, 12 expected)`);

      // 5
      mark(4, 'run', '');
      engine.send({ t: 'set', v: 'chk-hum', gain: 1, pan: -1, ramp: 0.1 });
      await sleep(350);
      const left = await listen(700);
      engine.send({ t: 'set', v: 'chk-hum', pan: 1, ramp: 0.1 });
      await sleep(350);
      const right = await listen(700);
      const okPan = left.l > left.r * 4 && right.r > right.l * 4;
      mark(4, okPan ? 'pass' : 'fail', `panned left: L ${db(left.l)} / R ${db(left.r)}; panned right: L ${db(right.l)} / R ${db(right.r)}`);

      // 6
      mark(5, 'run', '');
      n = events.length;
      engine.send({ t: 'stop', v: 'chk-hum', fade: 0.1 });
      await sleep(500);
      const after = await listen(600);
      const ended = since(n).find((e) => e.e === 'ended' && e.v === 'chk-hum') as Extract<GaEvt, { e: 'ended' }> | undefined;
      mark(5, ended?.why === 'stopped' && after.voices === 0 && after.rms < 0.0005 ? 'pass' : 'fail', `ended: ${ended?.why ?? 'not reported'}; ${after.voices} voices; level ${db(after.rms)}`);

      // 7 — the wall and the door: a low-pass on a bright sound (the fan)
      mark(6, 'run', '');
      engine.send({ t: 'start', v: 'chk-air', buf: 'gen_air', bus: 'sfx', gain: 1, mode: 'none', loop: true, fadeIn: 0.1 });
      await sleep(400);
      const bright = await listen(800);
      engine.send({ t: 'set', v: 'chk-air', lowpass: 900, ramp: 0.1 });
      await sleep(400);
      const dull = await listen(800);
      engine.send({ t: 'stop', v: 'chk-air', fade: 0.1 });
      const lpDrop = 20 * Math.log10(bright.rms / Math.max(dull.rms, 1e-9));
      mark(6, bright.rms > 0.003 && lpDrop > 3 && lpDrop < 14 ? 'pass' : 'fail', `open ${db(bright.rms)}; behind a 900 Hz low-pass ${db(dull.rms)} (${lpDrop.toFixed(1)} dB lower, about 6 expected)`);
      await sleep(500);

      // 8 — the 3D (head-related) renderer: a broadband sound hard right is
      // louder in the right ear (check E: a renderer check was missing)
      mark(7, 'run', '');
      engine.send({ t: 'start', v: 'chk-3d', buf: 'gen_air', bus: 'sfx', gain: 1, mode: 'hrtf', pos: [1, 0, 0], loop: true, fadeIn: 0.1 });
      await sleep(400);
      const side = await listen(800);
      engine.send({ t: 'stop', v: 'chk-3d', fade: 0.1 });
      const ild = 20 * Math.log10(Math.max(side.r, 1e-9) / Math.max(side.l, 1e-9));
      mark(7, side.r > 0.002 && ild > 4 ? 'pass' : 'fail', `source to the right: L ${db(side.l)} / R ${db(side.r)} (${ild.toFixed(1)} dB louder on the right)`);
      await sleep(400);

      // 9 — MONO: a sound hard left reaches both ears the same, then not
      mark(8, 'run', '');
      engine.send({ t: 'start', v: 'chk-mono', buf: 'gen_air', bus: 'sfx', gain: 1, mode: 'stereo', pan: -1, loop: true, fadeIn: 0.1 });
      await sleep(400);
      const apart = await listen(700);
      engine.send({ t: 'mono', on: true });
      await sleep(250);
      const folded = await listen(700);
      engine.send({ t: 'mono', on: false });
      await sleep(250);
      const unfolded = await listen(700);
      engine.send({ t: 'stop', v: 'chk-mono', fade: 0.1 });
      const foldDiff = Math.abs(20 * Math.log10(Math.max(folded.l, 1e-9) / Math.max(folded.r, 1e-9)));
      mark(
        8,
        apart.l > apart.r * 4 && foldDiff < 1 && unfolded.l > unfolded.r * 4 ? 'pass' : 'fail',
        `hard left: L ${db(apart.l)} / R ${db(apart.r)}; MONO on: L ${db(folded.l)} / R ${db(folded.r)}; MONO off: L ${db(unfolded.l)} / R ${db(unfolded.r)}`,
      );
      await sleep(400);

      // 10 — a bus fader: the effects bus at zero is silent, and comes back
      mark(9, 'run', '');
      engine.send({ t: 'start', v: 'chk-bus', buf: 'gen_air', bus: 'sfx', gain: 1, mode: 'none', loop: true, fadeIn: 0.1 });
      await sleep(400);
      const busOn = await listen(600);
      engine.send({ t: 'bus', bus: 'sfx', gain: 0, ramp: 0.05 });
      await sleep(200);
      const busOff = await listen(600);
      engine.send({ t: 'bus', bus: 'sfx', gain: 1, ramp: 0.05 });
      await sleep(200);
      const busBack = await listen(600);
      engine.send({ t: 'stop', v: 'chk-bus', fade: 0.1 });
      mark(
        9,
        busOn.rms > 0.002 && busOff.rms < 0.0005 && busBack.rms > busOn.rms * 0.7 ? 'pass' : 'fail',
        `effects bus at 1: ${db(busOn.rms)}; at 0: ${db(busOff.rms)}; at 1 again: ${db(busBack.rms)}`,
      );
      await sleep(500);

      // 8 — the room reverb: the impulse must LOAD on this device's sample
      // rate, and a sound sent to it must still ring after the sound is over
      mark(10, 'run', '');
      n = events.length;
      engine.send({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
      await sleep(250);
      const rv = since(n).find((e) => e.e === 'reverb') as Extract<GaEvt, { e: 'reverb' }> | undefined;
      const rvErr = since(n).find((e) => e.e === 'error') as Extract<GaEvt, { e: 'error' }> | undefined;
      // a stone step is over in about 0.1 s; with a full send the room rings on
      engine.send({ t: 'start', v: 'chk-rev', buf: footstepId('stone', 1), bus: 'sfx', gain: 1, mode: 'none', rev: 1 });
      await sleep(400);
      const ring = await listen(450);
      mark(
        10,
        rv?.ok && !rvErr && ring.rms > 0.0005 ? 'pass' : 'fail',
        rv
          ? rv.ok
            ? `loaded at ${engine.sampleRate} Hz; 0.4 s after a step the room still rings at ${db(ring.rms)} (silence with no reverb)`
            : `NO REVERB on this device: ${rv.why ?? 'no reason given'}`
          : `the engine did not answer${rvErr ? `: ${rvErr.msg}` : ''}`,
      );
      await sleep(900);

      // 9
      mark(11, 'run', '');
      n = events.length;
      engine.send({
        t: 'music',
        op: 'start',
        bpm: MUSIC_BPM,
        beatsPerBar: MUSIC_BEATS_PER_BAR,
        barsPerPhrase: MUSIC_BARS,
        stems: [
          { id: 'calm', buf: 'mu_calm', gain: 1 },
          { id: 'pulse', buf: 'mu_pulse', gain: 0 },
          { id: 'drive', buf: 'mu_drive', gain: 0 },
        ],
      });
      await sleep(900);
      engine.send({ t: 'music', op: 'layers', req: 'chk-q1', at: 'bar', gains: { pulse: 1, drive: 1 } });
      await sleep(250);
      const mu = since(n).find((e) => e.e === 'music' && e.what === 'started') as Extract<GaEvt, { e: 'music'; what: 'started' }> | undefined;
      const q = since(n).find((e) => e.e === 'music' && e.what === 'queued') as Extract<GaEvt, { e: 'music'; what: 'queued' }> | undefined;
      let barOk = false;
      let barsFromStart = 0;
      if (mu && q) {
        barsFromStart = (q.at - mu.at) / MUSIC_BAR_S;
        barOk = Math.abs(barsFromStart - Math.round(barsFromStart)) < 1e-6 && Math.round(barsFromStart) >= 1;
        await sleep(Math.max(0, q.inS * 1000) + 400);
      }
      const applied = since(n).some((e) => e.e === 'music' && e.what === 'applied');
      const full = await listen(1200);
      mark(11, barOk && applied && full.rms > 0.005 ? 'pass' : 'fail', q && mu ? `asked mid-bar; scheduled exactly ${barsFromStart.toFixed(4)} bars after the start; applied: ${applied ? 'yes' : 'no'}; level ${db(full.rms)}` : 'the music did not start');

      // 10 — a stinger that has BEGUN must stop with everything else (it
      // used to play on for up to 2.4 s after STOP ALL: audit 2, F3)
      mark(12, 'run', '');
      n = events.length;
      engine.send({ t: 'music', op: 'stinger', req: 'chk-sting', at: 'now', buf: 'mu_stinger', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
      const during = await listen(650); // its hit lands 0.32 s in
      const stApplied = since(n).some((e) => e.e === 'music' && e.what === 'applied' && e.req === 'chk-sting');
      engine.stopAll(0.03);
      await sleep(180);
      const afterStop = await listen(600);
      const stStopped = since(n).some((e) => e.e === 'music' && e.what === 'stinger' && e.req === 'chk-sting' && e.state === 'stopped');
      mark(
        12,
        stApplied && stStopped && during.voices >= 4 && afterStop.voices === 0 && afterStop.rms < 0.0005 ? 'pass' : 'fail',
        `hit reported: ${stApplied ? 'yes' : 'no'}; counted as a voice while it sounded: ${during.voices >= 4 ? 'yes' : 'no'} (${during.voices}); reported stopped: ${stStopped ? 'yes' : 'no'}; 0.2 s after STOP ALL: ${afterStop.voices} voices, level ${db(afterStop.rms)}`,
      );
      await sleep(300);

      // 11
      mark(13, 'run', '');
      n = events.length;
      engine.send({ t: 'suspend' });
      await sleep(500);
      engine.send({ t: 'start', v: 'chk-blocked', buf: 'door', bus: 'sfx', gain: 1, mode: 'none' });
      await sleep(200);
      const refused = since(n).some((e) => e.e === 'failed' && e.v === 'chk-blocked' && e.why === 'suspended');
      const sawSuspend = since(n).some((e) => e.e === 'state' && e.state === 'suspended');
      engine.send({ t: 'resume' });
      await sleep(600);
      const back = engine.status === 'running';
      mark(13, refused && sawSuspend && back ? 'pass' : 'fail', `suspended reported: ${sawSuspend ? 'yes' : 'no'}; a start while suspended refused: ${refused ? 'yes' : 'no'}; running again: ${back ? 'yes' : 'no'}`);
      await sleep(1200);
    } catch {
      /* the screen closed mid-run: nothing left to report to */
    } finally {
      off();
      s.stopAll();
      engine.send({ t: 'silent', on: false });
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }, [engine, s, sleep]);

  const passed = lines.filter((l) => l.state === 'pass').length;
  return (
    <SafeAreaView style={styles.safe}>
      <GaEngineHost engine={engine} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Game Audio sound engine check</Text>
        <Text style={styles.sub}>
          Sound: {s.sound} · engine: {engine.status} · {passed} of {CHECKS.length} passed
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Run all checks" onPress={run} disabled={busy} style={[styles.btn, busy && styles.btnBusy]}>
          <Text style={styles.btnText}>{busy ? 'RUNNING…' : 'RUN ALL CHECKS'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: silent }}
          accessibilityLabel="Measure only, no sound from the device"
          onPress={() => setSilent((v) => !v)}
          disabled={busy}
          style={[styles.stop, { borderColor: silent ? colors.amber : colors.steelBorder }]}
        >
          <Text style={[styles.stopText, { color: silent ? colors.amber : colors.textSub }]}>{silent ? '● MEASURE ONLY (NO SOUND)' : '○ MEASURE ONLY (NO SOUND)'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Stop all sound" onPress={s.stopAll} style={styles.stop}>
          <Text style={styles.stopText}>■ STOP</Text>
        </Pressable>
        {lines.map((l, i) => (
          <View key={l.name} style={styles.row} accessible accessibilityLabel={`Check ${i + 1}, ${l.name}: ${l.state}. ${l.detail}`}>
            <Text style={[styles.badge, l.state === 'pass' && styles.pass, l.state === 'fail' && styles.fail]}>
              {l.state === 'pass' ? 'PASS' : l.state === 'fail' ? 'FAIL' : l.state === 'run' ? '…' : '—'}
            </Text>
            <View style={styles.rowText}>
              <Text style={styles.name}>
                {i + 1}. {l.name}
              </Text>
              {l.detail ? <Text style={styles.detail}>{l.detail}</Text> : null}
            </View>
          </View>
        ))}
        <Text style={styles.note}>
          These lines prove the engine's plumbing from its own measurements. Whether each sound is right is for ears: listen while it runs.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screenBg },
  body: { padding: 16, gap: 10 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  sub: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13 },
  btn: { borderWidth: 1, borderColor: colors.amber, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnBusy: { opacity: 0.5 },
  btnText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4 },
  stop: { borderWidth: 1, borderColor: colors.red, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  stopText: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.hairline },
  badge: { width: 44, color: colors.textMuted, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  pass: { color: colors.green },
  fail: { color: colors.red },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  detail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, marginTop: 6 },
});
