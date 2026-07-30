/**
 * HarmonicLabScreen — Lab 13 "Harmonic" (v4 MASTER §7). The hear-see-control
 * harmonics centerpiece: additive synthesis, spectrum, and instructional
 * distortion. Reached from the Audio Learning Lab landing menu (EarLabScreen).
 *
 * SHELL: now the shared LabShell (v4 MASTER §4) — header + intro + the four
 * mode tabs (Learn / Explore / Practice / Test) + the on-entry audio-output
 * prompt, all owned by the shell. Explore mounts HarmonicsView, the interactive
 * centerpiece. Migrated onto LabShell 2026-07-26 (was a hand-rolled twin of it).
 *
 * Honesty (measurement-tools §1.7): no fake meters, no simulated output. The
 * shell itself produces no sound — HarmonicsView owns every sound path (behind
 * the audio-output gate, with its own noteAudioActivity keepalive). Live mode
 * needs the DSP engine; the SUBTLE engine note is rendered here inside Explore
 * (HarmonicsView relies on the Explore panel to surface it for absent/spike),
 * never a hard block — Learn/Practice/Test render without the engine.
 *
 * The stem-drag editor must win over the shell's ScrollView: the render-prop
 * child receives `setScrollLocked`, wired to HarmonicsView's onDragActive —
 * AND (layout v2, owner 2026-07-29) the whole view sits in an InteractionZone,
 * which claims the touch AT TOUCH-START so drags beat scroll from the first
 * pixel. The two compose: the zone silences the ScrollView instantly; the
 * legacy onDragActive wiring keeps it silenced for the drag's duration.
 *
 * LAYOUT v2 note: HarmonicsView is the self-contained hear-see-control
 * centerpiece — it owns its readouts, displays, controls, actions AND audio
 * lifecycle internally (off-limits to edit). It therefore does not split into
 * the standard READOUTS/DISPLAY/CONTROLS/ACTIONS sections, and its play
 * control cannot move to the header without editing it. Deliberately left
 * whole (owner order: "where pieces don't cleanly split, use judgment").
 */
import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp } from '../../../modules/ape-dsp';
import { EngineGate } from '../tools/EngineGate';
import { HarmonicsView } from './HarmonicsView';
import { InteractionZone, LabShell } from './LabShell';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HarmonicLab'>;

const INTRO =
  'Hear, see, and shape the harmonic content of a sound. Build waveforms from ' +
  'their partials, watch the spectrum respond in real time, and learn how ' +
  'timbre, distortion, and Fourier synthesis actually work.';

export function HarmonicLabScreen(_props: Props) {
  // Engine gate — computed ONCE (native availability cannot change mid-session);
  // mirrors the tool screens. 'idle' = engine usable; 'absent'/'spike' render the
  // shared honest EngineGate card as a SUBTLE note in Explore only.
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';

  return (
    <LabShell
      labId="harmonic"
      title="HARMONIC LAB"
      subtitle="Additive Synthesis · Spectrum · Distortion"
      intro={INTRO}
      exploreCaption="Freely change the generator, analyzer, level, and other controls."
    >
      {({ setScrollLocked }) => (
        <>
          {/* Subtle, HONEST engine note — the interactive view needs the DSP
              engine. Renders nothing when the engine is ready; the shell never
              hard-blocks on it. HarmonicsView relies on this panel to surface
              the absent/spike card. */}
          {!engineReady ? <EngineGate state={gate} /> : null}

          {/* HARMONICS / HEAR-SEE-CONTROL VIEW — the interactive centerpiece.
              HarmonicsView owns its state, sound, cleanup, and card chrome
              entirely. The InteractionZone claims the touch at touch-start so
              stem drags win over scroll; onDragActive keeps the shell's scroll
              locked for the drag's duration (they compose). */}
          <InteractionZone>
            <HarmonicsView onDragActive={setScrollLocked} />
          </InteractionZone>
        </>
      )}
    </LabShell>
  );
}
