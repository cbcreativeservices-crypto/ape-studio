/**
 * Audio Tools Learn-mode registry (Phase 1, spec of record 2026-07-23).
 * Assembles the per-tool Learn content + the 8 professional-measurement
 * concept modules (spec §15, §14 coherence folded in). Screens tolerate a
 * missing entry (honest "in authoring" card) — but all 7 tools + 8 modules
 * are authored as of 2026-07-23.
 */
import type { ToolKey } from '../../../screens/tools/toolsData';
import type { ConceptKey, ConceptModule, ToolLearnContent } from './types';
import { SPL_LEARN } from './spl';
import { RTA_LEARN } from './rta';
import { WAVEFORM_LEARN } from './waveform';
import { SPECTROGRAM_LEARN } from './spectrogram';
import { RT60_LEARN } from './rt60';
import { SIGNALGEN_LEARN } from './signalgen';
import { HZCOUNTER_LEARN } from './hzcounter';
import { CONCEPT_MODULES } from './concepts';

export const TOOL_LEARN: Partial<Record<ToolKey, ToolLearnContent>> = {
  spl: SPL_LEARN,
  rta: RTA_LEARN,
  waveform: WAVEFORM_LEARN,
  spectrogram: SPECTROGRAM_LEARN,
  rt60: RT60_LEARN,
  signalgen: SIGNALGEN_LEARN,
  hzcounter: HZCOUNTER_LEARN,
};

export { CONCEPT_MODULES };

export const conceptByKey = (key: ConceptKey): ConceptModule | undefined =>
  CONCEPT_MODULES.find((m) => m.key === key);
