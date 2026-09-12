/**
 * Picks the right drawing for a saved measurement, and says nothing when there
 * isn't one.
 *
 * Five of the six payload kinds carry a curve or an image; the MultiMeter
 * snapshot is a set of instrument readings whose honest presentation IS the
 * numbers, so it deliberately returns null rather than being given a chart to
 * justify its existence. `tap_log` likewise: a frequency, a period and a BPM
 * are three numbers, not a shape.
 *
 * Returning null is a real answer here, not a gap — the summary rows render
 * underneath every preview regardless, so a measurement without a picture
 * simply looks the way the whole library used to.
 */
import type { SavedMeasurement } from '../types';
import { PREVIEW_H } from './previewKit';
import { SpectrogramPreview } from './SpectrogramPreview';
import { WaveformPreview } from './WaveformPreview';
import { SpectrumPreview } from './SpectrumPreview';
import { TimelinePreview } from './TimelinePreview';
import { DecayPreview } from './DecayPreview';

/** True when this record has something to draw — lets a caller decide whether
 *  to offer "tap to enlarge" without rendering the chart first. */
export function hasPreview(m: SavedMeasurement): boolean {
  const k = m.data_payload.kind;
  return (
    k === 'spectrogram_snapshot' ||
    k === 'waveform_snapshot' ||
    k === 'spectrum_trace' ||
    k === 'spl_log' ||
    k === 'impulse_response'
  );
}

export function MeasurementPreview({
  measurement,
  height = PREVIEW_H,
  onPress,
  forCapture = false,
}: {
  measurement: SavedMeasurement;
  height?: number;
  onPress?: () => void;
  /** Being rendered for a share-as-image capture rather than for the screen.
   *  Only the spectrogram cares — it is the one preview drawn with Skia, which
   *  view-shot cannot photograph (see SpectrogramPreview). The others are SVG
   *  and RN views, which capture as they appear, so they ignore this. */
  forCapture?: boolean;
}) {
  const p = measurement.data_payload;
  switch (p.kind) {
    case 'spectrogram_snapshot':
      return <SpectrogramPreview payload={p} height={height} onPress={onPress} forCapture={forCapture} />;
    case 'waveform_snapshot':
      return <WaveformPreview payload={p} height={height} onPress={onPress} />;
    case 'spectrum_trace':
      // The unit label is not derivable from the payload — a trace is dBFS
      // unless the RECORD says the input was calibrated, so the record has to
      // say so rather than the preview assuming.
      return (
        <SpectrumPreview
          payload={p}
          height={height}
          onPress={onPress}
          calibrationStatus={measurement.calibration_status}
        />
      );
    case 'spl_log':
      // Same reason as the RTA trace: whether these levels are a calibrated
      // reading or an uncalibrated estimate is a property of the RECORD.
      return (
        <TimelinePreview
          payload={p}
          height={height}
          onPress={onPress}
          calibrationStatus={measurement.calibration_status}
        />
      );
    case 'impulse_response':
      return <DecayPreview payload={p} height={height} onPress={onPress} />;
    default:
      return null;
  }
}
