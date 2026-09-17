/**
 * Module 1 — What Is Cymatics? (spec §1). Animated: air as a pressure wave,
 * the same vibration shaking a plate, sand walking to the still lines; node
 * vs antinode; why stable patterns appear only at resonance.
 */
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { LabChip } from '../../LabShell';
import { DEFAULT_PLATE, effectiveQ } from '../../../../features/cymatics/plateModes';
import { formatHz } from '../../../../features/cymatics/music';
import { requireVizPlate, skiaAvailable } from '../skiaGate';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { P, PlateDemo, ResponseStrip, excitableModes } from './shared';

export function IntroModule({ width, focused }: CymaticsModuleProps) {
  const viz = skiaAvailable ? requireVizPlate() : null;
  const spec = DEFAULT_PLATE;
  const modes = useMemo(() => excitableModes(spec), [spec]);
  const Q = useMemo(() => effectiveQ(spec.material, spec.damping), [spec]);
  const f1 = modes[0]?.hz ?? 300;
  // Start OFF resonance (learning pass D13): expectation first, then the surprise.
  const [atResonance, setAtResonance] = useState(false);
  const hz = atResonance ? f1 : f1 * 0.78;

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Sound is a travelling change in pressure. In air, molecules bunch up and spread out as the wave passes — a compression, then a
        rarefaction — and each molecule only moves back and forth a tiny distance around where it started.
      </Text>
      {viz ? (
        <View style={{ borderRadius: 10, overflow: 'hidden' }}>
          <viz.PressureWaveStrip width={width} height={96} running={focused} />
          <Text style={[P.badge, { position: 'absolute', left: 8, bottom: 6 }]}>ILLUSTRATIVE — AIR MOLECULES, LONGITUDINAL WAVE</Text>
        </View>
      ) : null}

      <Text style={P.h}>VIBRATION MOVES THINGS</Text>
      <Text style={P.body}>
        Drive a thin plate with a tone and the plate flexes at that frequency. Sand, powder or salt on top cannot stay where the surface is
        leaping — it is thrown off the moving regions and comes to rest where the plate is still. Liquids ripple; membranes bulge; strings
        bow. The material changes, the physics does not.
      </Text>

      <View style={P.card}>
        <View style={P.chips}>
          <LabChip label={`At resonance · ${formatHz(f1)}`} selected={atResonance} onPress={() => setAtResonance(true)} />
          <LabChip label={`Off resonance · ${formatHz(f1 * 0.78)}`} selected={!atResonance} onPress={() => setAtResonance(false)} />
        </View>
        {!atResonance ? <Text style={P.caption}>Now tap AT RESONANCE — the drive level does not change, only the frequency.</Text> : null}
        <View style={{ borderRadius: 8, overflow: 'hidden' }}>
          <PlateDemo width={width - 26} spec={spec} hz={hz} view="particles" running={focused} />
          <Text style={[P.badge, { position: 'absolute', left: 8, bottom: 6 }]}>SIMULATION · 240 mm ALUMINUM · CENTRE-DRIVEN</Text>
        </View>
        <ResponseStrip width={width - 26} modes={modes} Q={Q} hz={hz} fMin={60} fMax={2000} />
        <Text style={P.caption}>
          {atResonance
            ? 'On a resonance the plate moves a lot for very little drive, and the sand snaps into a stable figure within seconds.'
            : 'A little way off resonance the same drive barely moves the plate: the sand shivers in place and no figure forms.'}
        </Text>
      </View>

      <Text style={P.h}>NODE AND ANTINODE</Text>
      <Text style={P.body}>
        A <Text style={P.strong}>node</Text> is a place of minimal movement — the sand collects there. An <Text style={P.strong}>antinode</Text> is a
        place of maximal movement — the sand is thrown clear. Regions on opposite sides of a nodal line move in opposite directions: while
        one lobe rises, its neighbour falls.
      </Text>
      <View style={{ borderRadius: 10, overflow: 'hidden' }}>
        <PlateDemo width={width} spec={spec} hz={f1} view="phase" running={focused} />
        <Text style={[P.badge, { position: 'absolute', left: 8, bottom: 6 }]}>PHASE VIEW · AMBER RISES WHILE BLUE FALLS</Text>
      </View>

      <Text style={P.h}>WHY ONLY AT RESONANCE</Text>
      <Text style={P.body}>
        Every plate has a set of natural ways to flex — its <Text style={P.strong}>normal modes</Text>, each with its own frequency and its own
        pattern of still lines. Drive the plate near one of those frequencies and that mode responds strongly and cleanly, so the figure
        is sharp. Between them, several modes respond weakly at once and nothing organises.
      </Text>

      <View style={P.card}>
        <Text style={P.h}>THE ONE THING TO CARRY WITH YOU</Text>
        <Text style={P.body}>
          Sound does not have one universal shape. The figure you see also depends on the object’s geometry, dimensions, material,
          thickness, how it is supported, where it is driven, and how much it is damped. The same 440 Hz makes a strong pattern on one
          plate, no stable pattern on another, and a different pattern on a third.
        </Text>
      </View>
    </View>
  );
}
