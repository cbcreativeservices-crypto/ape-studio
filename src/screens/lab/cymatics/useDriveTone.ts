/**
 * useDriveTone — the Cymatics Lab's sound source (spec §2): OUR native
 * generator only (ape-dsp), the Harmonograph audio-lifecycle idiom.
 *
 *  • single drive tone → GEN_MODES.sine at f (phase-continuous retune while
 *    playing, so a sweep or a fader drag glides — no clicks);
 *  • dual drive (two frequencies summed MONO) → GEN_MODES.dual on engine ≥ 8;
 *    on the current dev client (engine 7) the second tone is VISUAL-ONLY and
 *    the hook says so through `dualReady` — never an untrue stand-in.
 *  • Level: the studio's AMPLITUDE fader maps to −40…−12 dBFS; the native Q4
 *    cap (−12) is the ceiling. Speaker-safety HPF is route-aware native-side
 *    (engine ≥ 4).
 *  • Output gate + activity pings + focus-loss stop exactly as every lab.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, GEN_MODES, type GenParams } from '../../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';

const ACTIVITY_MS = 500;

export type DriveTone = {
  gate: EngineState;
  engineReady: boolean;
  /** engine ≥ 8 — GEN_MODES.dual exists on this client. */
  dualReady: boolean;
  running: boolean;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
  /** Retune while running (no-op when stopped). */
  retune: (hzA: number, hzB: number | null, amplitude01: number) => void;
};

export function levelDbFor(amplitude01: number): number {
  const a = Math.max(0, Math.min(1, amplitude01));
  return -40 + 28 * a; // −40 … −12 dBFS (Q4 cap)
}

export function useDriveTone(hzA: number, hzB: number | null, amplitude01: number): DriveTone {
  const { requestAudioOutput } = useAudioOutputGate();
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const dualReady = engineReady && ApeDsp.engineVersion() >= 8;
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const genRef = useRef(0);

  const params = useCallback(
    (a: number, b: number | null, amp: number): GenParams => {
      const levelDb = levelDbFor(amp);
      if (b != null && dualReady) return { mode: GEN_MODES.dual, frequency: a, dual: { freqB: b, levelB: 1 }, levelDb };
      return { mode: GEN_MODES.sine, frequency: a, levelDb };
    },
    [dualReady],
  );

  const start = useCallback(async () => {
    if (!engineReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setError('');
    ApeDsp.genSet(params(hzA, hzB, amplitude01));
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setError(e instanceof Error ? e.message : String(e));
    }
  }, [engineReady, requestAudioOutput, params, hzA, hzB, amplitude01]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  const retune = useCallback(
    (a: number, b: number | null, amp: number) => {
      if (!running) return;
      ApeDsp.genSet(params(a, b, amp));
      noteAudioActivity();
    },
    [running, params],
  );

  // Follow the controls while playing.
  useEffect(() => {
    retune(hzA, hzB, amplitude01);
  }, [hzA, hzB, amplitude01, retune]);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  return { gate, engineReady, dualReady, running, error, start, stop, retune };
}
