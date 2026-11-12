/**
 * GameAudioEngineCheckScreen — the PROOF that the Game Audio lab's sound
 * engine works on THIS device (plan 2026-11-12 §6, must-do D60). A dev
 * surface, not a lesson: it is opened in the web preview
 * (`#labpreview/GameAudioEngineCheck`) and, for the phone proof, from a
 * preview update. It is not in the Labs menu, and it lives in src/dev because
 * it is a dev tool, not a lab screen.
 *
 * RUN ALL CHECKS drives the real engine through the eight things the lab
 * needs and prints what the ENGINE reported — measured levels and audio-clock
 * times, never "it should have worked":
 *
 *   1 the engine starts              5 a live pan moves the level L ↔ R
 *   2 a one-shot sounds              6 stop is a stop: no voice, no level
 *   3 three sounds overlap           7 music: a change lands on the bar line
 *   4 a loop sustains; a gain        8 an interruption is reported, and the
 *     ramp changes its level           engine comes back
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
import { MUSIC_BAR_S, MUSIC_BEATS_PER_BAR, MUSIC_BPM, MUSIC_BARS } from '../screens/lab/gameaudio/sounds/gaSynth';

type Line = { name: string; state: 'wait' | 'run' | 'pass' | 'fail'; detail: string };

const CHECKS = [
  'The engine starts',
  'A one-shot sounds',
  'Three sounds overlap',
  'A loop sustains; a gain ramp changes its level',
  'A live pan moves the level left and right',
  'Stop is a stop',
  'Music: a change lands on the bar line',
  'An interruption is reported; the engine comes back',
] as const;

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
      const need = ['door', footstepId('wood', 0), footstepId('stone', 1), footstepId('gravel', 2), 'gen_hum', 'mu_calm', 'mu_pulse', 'mu_drive'];
      const missing = await s.ensure(need);
      if (missing.length) {
        mark(1, 'fail', `could not load: ${missing.join(', ')}`);
        return;
      }
      engine.send({ t: 'master', gain: 0.6 });

      // 2
      mark(1, 'run', '');
      let n = events.length;
      engine.send({ t: 'start', v: 'chk-door', buf: 'door', bus: 'sfx', gain: 1, mode: 'none' });
      let heard = await listen(700);
      const st = since(n).find((e) => e.e === 'started' && e.v === 'chk-door') as Extract<GaEvt, { e: 'started' }> | undefined;
      mark(1, st && heard.rms > 0.001 ? 'pass' : 'fail', st ? `started ${((st.at - st.now) * 1000).toFixed(0)} ms after the request; peak level ${db(heard.rms)}` : 'no start reported');
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

      // 7
      mark(6, 'run', '');
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
      mark(6, barOk && applied && full.rms > 0.005 ? 'pass' : 'fail', q && mu ? `asked mid-bar; scheduled exactly ${barsFromStart.toFixed(4)} bars after the start; applied: ${applied ? 'yes' : 'no'}; level ${db(full.rms)}` : 'the music did not start');

      // 8
      mark(7, 'run', '');
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
      mark(7, refused && sawSuspend && back ? 'pass' : 'fail', `suspended reported: ${sawSuspend ? 'yes' : 'no'}; a start while suspended refused: ${refused ? 'yes' : 'no'}; running again: ${back ? 'yes' : 'no'}`);
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
