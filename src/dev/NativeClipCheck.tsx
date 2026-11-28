/**
 * NativeClipCheck — DEV ONLY (engine 13, 2026-11-27, build must-do D16 / A15).
 * The ear check for the native CLIP source: load one already-published
 * lab-audio asset into ApeDsp (loadNativeLabClip → the native decoder) and play
 * it through the generator path and the EQ node, so the owner can HEAR on the
 * Pixel dev client that a recording runs through the same chain and the same
 * level cap as the generator.
 *
 * Not a lesson and not learner-facing: no production screen wires a clip.
 * Reached from the dev menu (DevVisualIndex → TOOLS → "Native clip check
 * (dev)", __DEV__ only) and, on web, from `#labpreview/NativeClipCheck`, where
 * it only says the check needs the native dev client.
 *
 * Every start is fenced (startFenced); the screen stops the voice, resets the
 * chain and unloads the clip when it closes.
 */
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { ApeDsp, EQ_BAND_TYPES, FX, FX_PARAM, GEN_MODES } from '../../modules/ape-dsp';
import { startFenced } from '../features/audio/startFenced';
import { useLatchedPress } from '../lib/latch';
import type { NativeClipLoad } from '../features/lab/nativeLabClip';

/** Already-published public assets (the Ear Training sources, earPrograms.ts). */
const ASSETS = [
  { labKey: 'demo_signals', assetKey: 'piano-chord-1', label: 'Piano chord' },
  { labKey: 'demo_signals', assetKey: 'acoustic-guitar-a-chord', label: 'Guitar chord' },
] as const;

const LEVEL_DB = -20; // the generator's Q4 default

/** EQ "telephone" (high-pass 300 Hz + low-pass 3 kHz) vs the same node flat. */
function setEq(phone: boolean) {
  ApeDsp.fxSet(FX.eq, FX_PARAM.enabled, 1);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'type'), phone ? EQ_BAND_TYPES.highPass : EQ_BAND_TYPES.off);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'freq'), 300);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'q'), 0.707);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(1, 'type'), phone ? EQ_BAND_TYPES.lowPass : EQ_BAND_TYPES.off);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(1, 'freq'), 3000);
  ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(1, 'q'), 0.707);
}

function describeLoad(r: NativeClipLoad | null): string {
  if (!r) return 'Nothing loaded yet.';
  if (!r.ok) return `Not loaded: ${r.error}${r.detail ? ` (${r.detail})` : ''} — ${r.message}`;
  return `Loaded ${r.assetKey}: ${r.durationSec.toFixed(2)} s, ${r.sampleRate} Hz, ${r.channels === 2 ? 'stereo' : 'mono'}${r.fromCache ? ', from the cache' : ''}`;
}

export function NativeClipCheck({ onClose }: { onClose?: () => void }) {
  const native = Platform.OS !== 'web';
  const [asset, setAsset] = useState(0);
  const [loaded, setLoaded] = useState<NativeClipLoad | null>(null);
  const [loop, setLoop] = useState(true);
  const [phone, setPhone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const gen = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      gen.current++;
      void ApeDsp.genStop().catch(() => {});
      ApeDsp.fxReset();
      ApeDsp.unloadClip();
    };
  }, []);

  // Honest engine read-back, on demand (READ STATUS, and after each action):
  // what the native side reports. No timer — this screen is not a loop host.
  const readStatus = () => {
    if (!native || !ApeDsp.clipAvailable()) return;
    const s = ApeDsp.genStatus();
    if (!s || !mounted.current) return;
    setStatus(
      `engine: ${s.running ? 'RUNNING' : 'stopped'} · level ${s.effectiveLevelDb.toFixed(1)} dBFS (cap ${s.capDb}) · ` +
        `clip ${s.clipFrames ?? 0} frames @ ${s.clipSampleRate ?? 0} Hz × ${s.clipChannels ?? 0}` +
        `${s.clipEnded ? ' · ENDED' : ''}${(s.clipNormGain ?? 1) < 1 ? ` · hot file scaled ×${(s.clipNormGain ?? 1).toFixed(3)}` : ''}`,
    );
  };

  const load = useLatchedPress(async () => {
    const a = ASSETS[asset];
    setLoaded(null);
    // On demand: the loader (expo-file-system, the edge function) is never on the start path.
    const { loadNativeLabClip } = require('../features/lab/nativeLabClip') as typeof import('../features/lab/nativeLabClip');
    const r = await loadNativeLabClip(a.labKey, a.assetKey);
    if (mounted.current) setLoaded(r);
    readStatus();
  });

  const play = useLatchedPress(async () => {
    if (!loaded?.ok) return;
    const mine = ++gen.current;
    setEq(phone);
    ApeDsp.genSet({ levelDb: LEVEL_DB, clip: { loop, gainDb: 0 }, mode: GEN_MODES.clip });
    const fenced = await startFenced({
      start: () => ApeDsp.genStart(),
      stop: () => ApeDsp.genStop(),
      isCurrent: () => mounted.current && mine === gen.current,
    });
    if (fenced.status === 'started' && mounted.current) setPlaying(true);
    readStatus();
  });

  const stop = () => {
    gen.current++;
    void ApeDsp.genStop().catch(() => {});
    setPlaying(false);
    readStatus();
  };

  const togglePhone = () => {
    const next = !phone;
    setPhone(next);
    if (playing) setEq(next);
  };

  const toggleLoop = () => {
    const next = !loop;
    setLoop(next);
    ApeDsp.genSet({ clip: { loop: next, gainDb: 0 } });
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>Native clip check (dev)</Text>
      {!native ? (
        <Text style={styles.sub}>
          Native only. The clip source lives in the phone's sound engine (engine 13): open this from the dev menu on
          the dev client to hear it. Nothing plays in the browser.
        </Text>
      ) : !ApeDsp.clipAvailable() ? (
        <Text style={styles.sub}>
          This build has engine {ApeDsp.engineVersion()}; the clip source needs engine 13 (the 1.0.1 native build).
          Loading does nothing here.
        </Text>
      ) : (
        <>
          <Text style={styles.sub}>
            Engine {ApeDsp.engineVersion()}. A published lab-audio asset, decoded natively, played through the
            generator path at {LEVEL_DB} dBFS and the EQ node (same Q4 cap, same speaker HPF).
          </Text>
          <View style={styles.rowWrap}>
            {ASSETS.map((a, i) => (
              <Pressable key={a.assetKey} style={[styles.chip, i === asset && styles.chipOn]} onPress={() => setAsset(i)}>
                <Text style={[styles.chipText, i === asset && styles.chipTextOn]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.btn} onPress={load}>
            <Text style={styles.btnText}>LOAD {ASSETS[asset].assetKey}</Text>
          </Pressable>
          <Text style={styles.detail}>{describeLoad(loaded)}</Text>
          <View style={styles.rowWrap}>
            <Pressable style={[styles.chip, loop && styles.chipOn]} onPress={toggleLoop}>
              <Text style={[styles.chipText, loop && styles.chipTextOn]}>{loop ? 'LOOP' : 'ONE-SHOT'}</Text>
            </Pressable>
            <Pressable style={[styles.chip, phone && styles.chipOn]} onPress={togglePhone}>
              <Text style={[styles.chipText, phone && styles.chipTextOn]}>{phone ? 'EQ: TELEPHONE' : 'EQ: FLAT'}</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.btn, !loaded?.ok && styles.btnBusy]} onPress={play} disabled={!loaded?.ok}>
            <Text style={styles.btnText}>{playing ? 'RESTART' : 'PLAY THROUGH EQ'}</Text>
          </Pressable>
          <Pressable style={styles.stop} onPress={stop}>
            <Text style={styles.stopText}>STOP</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={readStatus}>
            <Text style={styles.btnText}>READ STATUS</Text>
          </Pressable>
          <Text style={styles.note}>{status}</Text>
        </>
      )}
      {onClose ? (
        <Pressable style={styles.stop} onPress={onClose}>
          <Text style={styles.stopText}>CLOSE</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, backgroundColor: colors.screenBg, flexGrow: 1 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  sub: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { borderColor: colors.amber },
  chipText: { color: colors.textSub, fontFamily: fonts.barlowSemiBold, fontSize: 13 },
  chipTextOn: { color: colors.amber },
  btn: { borderWidth: 1, borderColor: colors.amber, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnBusy: { opacity: 0.5 },
  btnText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4 },
  stop: { borderWidth: 1, borderColor: colors.red, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  stopText: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  detail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, marginTop: 6 },
});
