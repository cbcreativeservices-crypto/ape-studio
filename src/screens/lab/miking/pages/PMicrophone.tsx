/**
 * Page 2 — CHOOSE THE MICROPHONE (blueprint §7 row 2; lesson L14-L18).
 *
 * TRY BEFORE TELL (review M1): the activity comes first.
 * COMPARE (rack): a prediction ("where will a supercardioid pick up least?"),
 * then the chosen type's art + its simplified lobe and a test source at SOURCE
 * ANGLE. The NULL cell stays "?" until the learner has predicted and swept the
 * source round the back. PICKUP never prints a number inside a null:
 * "deep null" (review M3 / M8); the badge says once that the pattern is a
 * simplified picture (owner ruling 2026-10-04: no "ideal" tag per readout).
 * LEARN (read): the mic types BY PROPERTY in three plain lines each — power,
 * mount, pattern — with power and size behind SPEC DETAILS (review M3), the
 * max-SPL caveat and the phantom procedure (review C1, m10).
 * CHECK (read): four scenarios, one of them a power choice.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DockParam } from '../../rack/rackTypes';
import type { MicPattern, MicType } from '../engine/model/types.ts';
import { PolarCompare } from '../engine/scene/PolarCompare';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../engine/kit';
import { gainDb, isModelled, nullAngles, PATTERN_LABELS } from '../engine/physics/polar.ts';
import { fmtDb, fmtIdealPickup, isDeepNull } from '../engine/model/units.ts';
import { MIC_TYPES, micType } from '../data/micTypes';
import { copyOf } from '../engine/model/copy.ts';
import type { PageProps } from './pageTypes';

/** Three plain lines per mic type: what the choice needs (review M3). */
export function plainLines(m: MicType, mountWords?: Readonly<Partial<Record<MicType['mount'], string>>>): { power: string; mount: string; pattern: string } {
  const p = m.patterns[0].id;
  return {
    power: m.transducer === 'dynamic' ? 'Power: none needed' : 'Power: needs phantom power from the desk',
    mount:
      mountWords?.[m.mount] ??
      (m.mount === 'surface'
        ? 'Mount: rests on the pillow — it is made for that'
        : m.mount === 'clip'
          ? 'Mount: clamps to the drum’s hoop — a clamp made for it, with the player’s agreement'
          : 'Mount: a stand or a suitable mount, kept off the heads and damping'),
    pattern:
      p === 'cardioid'
        ? 'Pattern: cardioid — rejects most directly behind'
        : p === 'supercardioid'
          ? 'Pattern: supercardioid — rejects most off to each side of the rear'
          : p === 'hypercardioid'
            ? 'Pattern: hypercardioid — rejects most off to each side of the rear, with a larger rear lobe'
            : p === 'halfCardioid'
              ? 'Pattern: half-cardioid — picks up the half-space above its surface'
              : 'Pattern: open cardioid — not drawn here',
  };
}

function sizeLine(m: MicType): string {
  // A typical product size for the type, in both units (not rounded to the
  // readouts' 5 mm; the products it comes from are the internal record).
  const cm = (mm: number) => `${(mm / 10).toFixed(1)}`;
  const inch = (mm: number) => `${(mm / 25.4).toFixed(1)}`;
  const d = m.body.radius.mm * 2;
  const l = m.body.length.mm;
  const w = m.body.width?.mm;
  return `Drawn size: ${cm(d)} × ${cm(l)}${w ? ` × ${cm(w)}` : ''} cm (${inch(d)} × ${inch(l)}${w ? ` × ${inch(w)}` : ''} in), a typical size for this type`;
}

export function PMicrophone({ lesson, answers, onAnswered }: PageProps) {
  const [typeId, setTypeId] = useState(lesson.micTypeIds[0]);
  const t = micType(typeId);
  const [pattern, setPattern] = useState<MicPattern>(t.patterns[0].id);
  const [angle, setAngle] = useState(0);
  const [maxAngle, setMaxAngle] = useState(0);
  const [predicted, setPredicted] = useState<string | null>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const pat: MicPattern = t.patterns.some((p) => p.id === pattern) ? pattern : t.patterns[0].id;
  const patLabel = t.patterns.find((p) => p.id === pat)?.label ?? PATTERN_LABELS[pat];
  const db = isModelled(pat) ? gainDb(pat, angle) : null;
  const pickup = db == null ? 'not drawn' : fmtIdealPickup(db);
  const nulls = isModelled(pat) ? nullAngles(pat) : [];
  const nearNullNow = nulls.some((n) => Math.abs(angle - n) <= 15);
  // The NULL cell is the answer to the prediction: shown once the learner
  // has predicted AND swept round the back.
  const tried = predicted != null && maxAngle >= 100;
  const pred = lesson.predictions.microphone;

  const params: DockParam[] = useMemo(
    () => [
      {
        kind: 'fader',
        id: 'angle',
        label: 'SOURCE ANGLE',
        value: angle / 180,
        onChange: (v) => {
          const a = Math.round(v * 180);
          setAngle(a);
          setMaxAngle((m) => Math.max(m, a));
        },
        format: () => `${angle}° off axis · ${pickup}`,
        formatShort: () => `${angle}°`,
        home: 0,
      },
      {
        kind: 'options',
        id: 'type',
        label: 'TYPE',
        valueLabel: t.short,
        selectedId: typeId,
        onSelect: (id) => {
          setTypeId(id);
          setPattern(micType(id).patterns[0].id);
        },
        sticky: true,
        options: lesson.micTypeIds.map((id) => ({ id, label: MIC_TYPES[id].label, blurb: MIC_TYPES[id].blurb })),
      },
      {
        kind: 'options',
        id: 'pattern',
        label: 'PATTERN',
        valueLabel: (isModelled(pat) ? pat : 'NOT DRAWN').toUpperCase().slice(0, 10),
        selectedId: pat,
        onSelect: (id) => setPattern(id as MicPattern),
        sticky: true,
        options: t.patterns.map((p) => ({ id: p.id, label: p.label })),
      },
    ],
    [angle, pickup, t, typeId, pat, lesson.micTypeIds],
  );

  const deep = db != null && isDeepNull(db);
  const steps: MikingStep[] = [
    {
      key: 'compare',
      title: 'Patterns',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PolarCompare w={w} h={h} typeId={typeId} pattern={pat} angle={angle} label={`${t.label}, ${patLabel}. Test source ${angle} degrees off the front axis: ${pickup}.`} />,
        badge: 'A simplified pattern, the same at every pitch · a real mic’s pattern changes with pitch',
        bezel: [
          { k: 'PATTERN', v: isModelled(pat) ? pat.toUpperCase() : 'NOT DRAWN', flex: 1.3 },
          { k: 'AT ANGLE', v: `${angle}°` },
          db == null ? { k: 'PICKUP', v: 'NOT DRAWN', flex: 1.2 } : deep ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.2 } : { k: 'PICKUP', v: fmtDb(db), flex: 1.2 },
          { k: 'NULL', v: !nulls.length ? 'NONE' : tried ? `${nulls[0].toFixed(0)}°` : '?' },
        ],
        params,
        initialParam: 'angle',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${t.label} · ${patLabel}`} prompt="Move SOURCE ANGLE round the back. Where does the pickup fall furthest?" />
          {deep || nearNullNow ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — use a null to aim, not to promise silence.</Note> : null}
          {tried ? (
            pat === 'supercardioid' ? (
              <Note>{`What you just saw: a supercardioid rejects most at ≈ 125° — toward the rear but OFF the axis — with a small inverted lobe directly behind (${fmtDb(gainDb('supercardioid', 180))}). Real supercardioid ${lesson.noun.one} mics put their deepest rejection somewhere around 120°–126°, and a real pattern changes with pitch.`}</Note>
            ) : pat === 'cardioid' ? (
              <Note>What you just saw: a cardioid rejects most directly behind (180°).</Note>
            ) : !isModelled(pat) ? null : (
              <Note>{`What you just saw: this ${pat} rejects most at ≈ ${Math.round(nulls[0] ?? 0)}°.`}</Note>
            )
          ) : null}
          {!isModelled(pat) ? (
            <Note>{t.mount === 'surface' ? 'A boundary plate picks up the half-space above its surface (a half-cardioid): keep the sound source within about 60° above the surface. That is not a free-field lobe, so none is drawn.' : 'An “open cardioid” has no simple shape to draw, so no lobe is drawn. The textbook patterns are offered for comparison.'}</Note>
          ) : null}
        </>
      ),
    },
    {
      key: 'learn',
      title: 'By property, not brand',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and the level it is specified for. Try not to assume every dynamic is less detailed, every condenser flat, or that a larger diaphragm means better bass — test ideas like these with your ears.</Body>
          {lesson.micTypeIds.map((id) => {
            const m = MIC_TYPES[id];
            const pl = plainLines(m, copyOf(lesson).words?.mount);
            const isOpen = open.has(id);
            return (
              <Card key={id}>
                <Point title={m.label.toUpperCase()}>{m.blurb}</Point>
                <Text style={styles.line}>{pl.power}</Text>
                <Text style={styles.line}>{pl.mount}</Text>
                <Text style={styles.line}>{pl.pattern}</Text>
                <Pressable
                  onPress={() => setOpen((prev) => {
                    const n = new Set(prev);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                  })}
                  style={styles.toggle}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`Spec details for ${m.label}`}
                >
                  <Text style={styles.toggleText}>{isOpen ? 'SPEC DETAILS ▴' : 'SPEC DETAILS ▾'}</Text>
                </Pressable>
                {isOpen ? (
                  <Body>{`Power: ${m.power}. ${sizeLine(m)}.`}</Body>
                ) : null}
              </Card>
            );
          })}
          <Note tone="warn">Max SPL figures are distortion limits for the MIC, each measured under its maker’s own test conditions, so they do not compare one-to-one. None of them is a safe listening level: for people, keep to about 85 dBA averaged over 8 hours, measured where they listen.</Note>
          <Note>Before connecting, disconnecting or switching phantom power: mute the outputs, lower the monitoring and turn the channel gain down, and follow the manual for your own equipment. Check that the mute really covers every output in your setup, and avoid plugging or unplugging a mic cable while phantom power is on.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'microphone')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  line: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  toggle: { minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' },
  toggleText: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
});
