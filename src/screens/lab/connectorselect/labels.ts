/**
 * Human labels for the verified records' CarriedType vocabulary — display
 * only, no new facts.
 */
import type { CarriedType } from '../cable/cableTypes';

export const CARRIED_LABELS: Record<CarriedType, string> = {
  mic_level: 'Mic-level audio',
  instrument_level: 'Instrument-level audio',
  line_level: 'Line-level audio',
  headphone_level: 'Headphone audio',
  speaker_level: 'Speaker-level power',
  digital_audio: 'Digital audio',
  network_audio: 'Networked audio',
  clock_sync: 'Clock / sync',
  control_data: 'Control data',
  dc_power: 'DC power',
  ac_mains: 'AC mains',
  hybrid_power_data: 'Power + data',
};
