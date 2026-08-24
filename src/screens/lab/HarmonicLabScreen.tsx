/**
 * HarmonicLabScreen — Lab 13 "Harmonic" (v4 MASTER §7). The hear-see-control
 * harmonics centerpiece: additive synthesis, spectrum, and instructional
 * distortion. Reached from the Audio Learning Lab landing menu (EarLabScreen).
 *
 * RACK UNIT layout (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved) — the
 * shared LabShell's `rack` mode: the three linked panels pin on the STAGE
 * with the model measurements on the bezel; F0 / PRESET / AXIS / MODE ride
 * the pinned DOCK; the teaching prose + the stem editor scroll in the WELL
 * between them ("reading may scroll; operating may not"). HarmonicsView
 * still OWNS all state, sound paths, and cleanup — it hands this screen the
 * rack declaration, the compact HeaderPlayButton, and the well renderer via
 * a render prop, and the screen threads them into LabShell (which also owns
 * the header, mode tabs, and the on-entry audio-output prompt).
 *
 * Honesty (measurement-tools §1.7): no fake meters, no simulated output. The
 * shell itself produces no sound — HarmonicsView owns every sound path (behind
 * the audio-output gate, with its own noteAudioActivity keepalive). Live mode
 * needs the DSP engine; the SUBTLE engine note renders here at the top of the
 * well for absent/spike — never a hard block (Learn renders without the
 * engine, and the analytic model stays fully editable).
 *
 * The stem-drag editor must win over the well's ScrollView: the well renderer
 * receives the shell api and wires `setScrollLocked` to HarmonicStems'
 * onDragActive, so the RackUnit's scroller goes quiet for the drag's duration
 * (the editor's own PanResponder claims the gesture from the first pixel).
 */
import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp } from '../../../modules/ape-dsp';
import { EngineGate } from '../tools/EngineGate';
import { HarmonicsView } from './HarmonicsView';
import { LabShell } from './LabShell';
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
  // shared honest EngineGate card as a SUBTLE note at the top of the well.
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';

  return (
    <HarmonicsView>
      {({ rack, headerAction, renderWell }) => (
        <LabShell
          labId="harmonic"
          title="HARMONIC LAB"
          subtitle="Additive Synthesis · Spectrum · Distortion"
          intro={INTRO}
          exploreCaption="Ride the F0 fader, A/B presets from the dock, and drag the stems below — the display and audio follow live."
          headerAction={headerAction}
          rack={rack}
        >
          {(api) => (
            <>
              {/* Subtle, HONEST engine note — the sound paths + live mode need
                  the DSP engine. Renders nothing when the engine is ready; the
                  shell never hard-blocks on it. HarmonicsView relies on this
                  well slot to surface the absent/spike card. */}
              {!engineReady ? <EngineGate state={gate} /> : null}
              {renderWell(api)}
            </>
          )}
        </LabShell>
      )}
    </HarmonicsView>
  );
}
