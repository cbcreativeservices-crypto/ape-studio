/**
 * ape-dsp — JS API for the native capture/DSP module (Spike 0).
 * Pull-based frames (kickoff brief D5): poll `getFrame()` at ≤30 Hz from the
 * UI. The module is absent in dev clients built before it existed (and on
 * web/Android) — `isAvailable()` gates every caller, so old clients degrade
 * to an honest "install the new dev build" state instead of crashing.
 */
import { requireNativeModule } from 'expo-modules-core';

export type DspFrame = {
  version: number;
  sequence: number;
  settingsEpoch: number;
  rmsDb: number;
  peakDb: number;
  peakHoldDb: number;
  droppedFrames: number;
  running: boolean;
  captureStalled: boolean;
  processedInput: boolean;
  bluetoothInput: boolean;
  interrupted: boolean;
};

export type DspInfo = {
  sampleRate: number;
  ioBufferDuration: number;
  measurementMode: boolean;
  bluetoothInput: boolean;
  routeName: string;
  inputPortType: string;
  running: boolean;
  lastError: string;
  /** Which code path last stopped capture (spike diagnostics). */
  stopReason: string;
  /** Rolling native lifecycle event log (spike diagnostics). */
  events: string[];
};

type NativeApeDsp = {
  start(): Promise<DspInfo>;
  stop(): Promise<void>;
  getFrame(): DspFrame;
  getInfo(): DspInfo;
  resetPeakHold(): void;
};

let native: NativeApeDsp | null = null;
try {
  native = requireNativeModule<NativeApeDsp>('ApeDsp');
} catch {
  native = null; // old dev client / unsupported platform
}

export const ApeDsp = {
  isAvailable(): boolean {
    return native != null;
  },
  /** Requests mic permission (lazily, per spec §1.5), configures the session, starts capture. */
  start(): Promise<DspInfo> {
    if (!native) return Promise.reject(new Error('ape-dsp native module not in this build'));
    return native.start();
  },
  stop(): Promise<void> {
    return native ? native.stop() : Promise.resolve();
  },
  getFrame(): DspFrame | null {
    return native ? native.getFrame() : null;
  },
  getInfo(): DspInfo | null {
    return native ? native.getInfo() : null;
  },
  resetPeakHold(): void {
    native?.resetPeakHold();
  },
};
