/**
 * Tool Demo registry (Phase 1, spec of record 2026-07-23 §4 Demo mode).
 * Visual/animated training demos only (ruling 2026-07-23 — no audio path in
 * the app yet); ToolDemoScreen hosts each under the permanent
 * "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge (spec §5).
 */
import type { ToolKey } from '../../screens/tools/toolsData';
import type { ToolDemoComponent } from './types';
import { SplDemo } from './SplDemo';
import { RtaDemo } from './RtaDemo';
import { WaveformDemo } from './WaveformDemo';
import { SpectrogramDemo } from './SpectrogramDemo';
import { Rt60Demo } from './Rt60Demo';
import { SignalGenDemo } from './SignalGenDemo';
import { HzCounterDemo } from './HzCounterDemo';

export const TOOL_DEMOS: Partial<Record<ToolKey, ToolDemoComponent>> = {
  spl: SplDemo,
  rta: RtaDemo,
  waveform: WaveformDemo,
  spectrogram: SpectrogramDemo,
  rt60: Rt60Demo,
  signalgen: SignalGenDemo,
  hzcounter: HzCounterDemo,
};
