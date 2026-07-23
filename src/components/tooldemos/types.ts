/**
 * Tool Demo components — shared contract (Phase 1, spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §4 Demo mode; user ruling 2026-07-23:
 * demos are VISUAL/ANIMATED ONLY until an audio output path exists).
 *
 * INTEGRITY RULES for every demo component (spec §5 + measurement-tools §1.7):
 *  - The hosting screen (ToolDemoScreen) renders the permanent
 *    "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge — components must not
 *    imply live measurement, and must NOT use LedMeter (real values only).
 *  - Animations use RN core `Animated` (the house pattern) + react-native-svg.
 *  - Every scene carries a caption explaining what the viewer is seeing.
 */
import type { ComponentType } from 'react';

/** Demo components take no props — each is a self-contained scene player. */
export type ToolDemoComponent = ComponentType<Record<string, never>>;
