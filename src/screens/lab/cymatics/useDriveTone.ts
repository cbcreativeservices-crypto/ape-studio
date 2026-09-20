/**
 * useDriveTone — the Cymatics Lab's sound source (spec §2): OUR native
 * generator only (ape-dsp), the Harmonograph audio-lifecycle idiom.
 *
 *  • sine drive → GEN_MODES.sine at f (phase-continuous retune while playing,
 *    so a sweep or a fader drag glides — no clicks);
 *  • SQUARE / TRIANGLE drive (Liquid Studio waveform control) → the ADDITIVE
 *    engine (engine ≥ 3) rendering the exact Fourier series: square = odd
 *    harmonics at 1/n, triangle = odd harmonics at 1/n² with alternating
 *    sign (180° phase) — 12 harmonics, band-limited by construction, through
 *    the speaker-safety guard;
 *  • PULSE drive → GEN_MODES.burst (50 ms tone bursts, 4 per second);
 *  • dual drive (two frequencies summed MONO) → GEN_MODES.dual on engine ≥ 8;
 *    on the current dev client (engine 7) the second tone is VISUAL-ONLY and
 *    the hook says so through `dualReady` — never an untrue stand-in.
 *  • Level: the studio's amplitude control maps to −40…−12 dBFS; the native
 *    Q4 cap (−12) is the ceiling. Speaker-safety HPF is route-aware
 *    native-side (engine ≥ 4).
 *  • Output gate + activity pings + focus-loss stop exactly as every lab.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, AUDIO_UNAVAILABLE_MESSAGE, GEN_MODES, type GenParams } from '../../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine } from '../../../features/audio/speakerSafety';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';
import { useStopOnAudioMute } from '../../../features/audio/useStopOnAudioMute';

const ACTIVITY_MS = 500;

export type DriveWave = 'sine' | 'square' | 'triangle' | 'pulse';

export type DriveTone = {
  gate: EngineState;
  engineReady: boolean;
  /** engine ≥ 8 — GEN_MODES.dual exists on this client. */
  dualReady: boolean;
  /** engine ≥ 3 — additive (square/triangle) exists on this client. */
  additiveReady: boolean;
  running: boolean;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
  /** Retune while running (no-op when stopped). */
  retune: (hzA: number, hzB: number | null, amplitude01: number, wave?: DriveWave) => void;
};

export function levelDbFor(amplitude01: number): number {
  const a = Math.max(0, Math.min(1, amplitude01));
  return -40 + 28 * a; // −40 … −12 dBFS (Q4 cap)
}

/** [f0, a1..a12, p1..p12] for a square (odd 1/n) or triangle (odd 1/n², alternating). */
export function additivePayload(f0: number, wave: 'square' | 'triangle'): number[] {
  const amps = new Array(12).fill(0);
  const phases = new Array(12).fill(0);
  for (let n = 1; n <= 12; n += 2) {
    const idx = n - 1;
    if (wave === 'square') amps[idx] = 1 / n;
    else {
      amps[idx] = 1 / (n * n);
      phases[idx] = ((n - 1) / 2) % 2 === 1 ? 180 : 0;
    }
  }
  return [f0, ...amps, ...phases];
}

export function useDriveTone(hzA: number, hzB: number | null, amplitude01: number, wave: DriveWave = 'sine'): DriveTone {
  const { requestAudioOutput } = useAudioOutputGate();
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const dualReady = engineReady && ApeDsp.engineVersion() >= 8;
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  const [running, setRunning] = useState(false);
  // Something else can silence this lab — backgrounding, shake-to-mute, the
  // idle auto-mute. Without this the transport stayed lit over silence.
  useStopOnAudioMute(setRunning);

  const [error, setError] = useState('');
  const genRef = useRef(0);

  const params = useCallback(
    (a: number, b: number | null, amp: number, w: DriveWave): GenParams => {
      const levelDb = levelDbFor(amp);
      if (b != null && dualReady) return { mode: GEN_MODES.dual, frequency: a, dual: { freqB: b, levelB: 1 }, levelDb };
      if ((w === 'square' || w === 'triangle') && additiveReady) {
        return { mode: GEN_MODES.additive, additive: guardAdditiveForEngine(additivePayload(a, w)), levelDb };
      }
      if (w === 'pulse') return { mode: GEN_MODES.burst, frequency: a, levelDb };
      return { mode: GEN_MODES.sine, frequency: a, levelDb };
    },
    [dualReady, additiveReady],
  );

  const start = useCallback(async () => {
    if (!engineReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setError('');
    ApeDsp.genSet(params(hzA, hzB, amplitude01, wave));
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setError(AUDIO_UNAVAILABLE_MESSAGE);
    }
  }, [engineReady, requestAudioOutput, params, hzA, hzB, amplitude01, wave]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  const retune = useCallback(
    (a: number, b: number | null, amp: number, w: DriveWave = 'sine') => {
      if (!running) return;
      ApeDsp.genSet(params(a, b, amp, w));
      noteAudioActivity();
    },
    [running, params],
  );

  // Follow the controls while playing.
  useEffect(() => {
    retune(hzA, hzB, amplitude01, wave);
  }, [hzA, hzB, amplitude01, wave, retune]);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  return { gate, engineReady, dualReady, additiveReady, running, error, start, stop, retune };
}
