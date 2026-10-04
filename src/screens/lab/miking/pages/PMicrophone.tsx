/**
 * Page 2 — CHOOSE THE MICROPHONE (blueprint §7 row 2; lesson L14-L18).
 *
 * TRY BEFORE TELL (review M1): the activity comes first.
 * COMPARE (rack): a prediction ("where will a supercardioid pick up least?"),
 * then the chosen type's art + its IDEAL lobe and a test source at SOURCE
 * ANGLE. The NULL cell stays "?" until the learner has predicted and swept the
 * source round the back. IDEAL PICKUP never prints a number inside a null:
 * "deep null (ideal)" (review M3 / M8).
 * LEARN (read): the mic types BY PROPERTY in three plain lines each — power,
 * mount, pattern — with the full specs behind SPEC DETAILS (review M3), the
 * max-SPL caveat and the phantom procedure (review C1, m10).
 * CHECK (read): four scenarios, one of them a power choice.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DockParam } from '../../rack/rackTypes';
import type { MicPattern, MicType } from '../engine/model/types.ts';
import { PolarCompare } from '../engine/scene/PolarCompare';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ProvenanceTag, ScenarioList } from '../engine/kit';
import { gainDb, isModelled, nullAngles, PATTERN_LABELS } from '../engine/physics/polar.ts';
import { fmtDb, fmtIdealPickup, isDeepNull } from '../engine/model/units.ts';
import { MIC_TYPES, micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

/** Three plain lines per mic type: what the choice needs (review M3). */
export function plainLines(m: MicType): { power: string; mount: string; pattern: string } {
  const p = m.patterns[0].id;
  return {
    power: m.transducer === 'dynamic' ? 'Power: none needed' : 'Power: needs phantom power from the desk',
    mount: m.mount === 'surface' ? 'Mount: rests on the pillow — only because its own manual allows it' : 'Mount: a stand or approved mount, kept off the heads and damping',
    pattern:
      p === 'cardioid'
        ? 'Pattern: cardioid — rejects most directly behind'
        : p === 'supercardioid'
          ? 'Pattern: supercardioid — rejects most off to each side of the rear'
          : p === 'halfCardioid'
            ? 'Pattern: half-cardioid — picks up the half-space above its surface'
            : 'Pattern: the maker’s “open cardioid”, with no numbers given',
  };
}

function sizeLine(m: MicType): string {
  // The cited example's own product dimensions, in both units (not rounded
  // to the readouts' 5 mm: these are the maker's numbers).
  const cm = (mm: number) => `${(mm / 10).toFixed(1)}`;
  const inch = (mm: number) => `${(mm / 25.4).toFixed(1)}`;
  const d = m.body.radius.mm * 2;
  const l = m.body.length.mm;
  const w = m.body.width?.mm;
  return `Drawn size: ${cm(d)} × ${cm(l)}${w ? ` × ${cm(w)}` : ''} cm (${inch(d)} × ${inch(l)}${w ? ` × ${inch(w)}` : ''} in), from the cited example`;
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
        options: t.patterns.map((p) => ({ id: p.id, label: p.label, blurb: p.prov.kind === 'sourced' ? `Source: “${p.prov.quote}”` : undefined })),
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
        badge: 'IDEAL first-order pattern · frequency-independent · not this mic’s measured polar plot',
        bezel: [
          { k: 'PATTERN', v: isModelled(pat) ? pat.toUpperCase() : 'NOT DRAWN', flex: 1.3 },
          { k: 'AT ANGLE', v: `${angle}°` },
          db == null ? { k: 'PICKUP', v: 'NOT DRAWN', flex: 1.2 } : deep ? { k: 'IDEAL PICKUP', v: 'DEEP NULL', sub: 'ideal only', flex: 1.2 } : { k: 'IDEAL PICKUP', v: fmtDb(db), sub: 'ideal model', flex: 1.2 },
          { k: 'NULL', v: !nulls.length ? 'NONE' : tried ? `${nulls[0].toFixed(0)}°` : '?' },
        ],
        params,
        initialParam: 'angle',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${t.label} · ${patLabel}`} prompt="Move SOURCE ANGLE round the back. Where does the pickup fall furthest?" />
          {deep || nearNullNow ? <Note>An ideal pattern’s null is infinitely deep on paper. Real microphones reject far less there, and least at low frequencies — use a null to aim, not to promise silence.</Note> : null}
          {tried ? (
            pat === 'supercardioid' ? (
              <Note>{`What you just saw: the ideal supercardioid rejects most at ≈ 125° — toward the rear but OFF the axis — with a small inverted lobe directly behind (${fmtDb(gainDb('supercardioid', 180))}). Shure’s Beta 52A guide puts that mic’s greatest rejection at 120°; Shure’s live guide says 126°. The maker calls it “modified supercardioid”: its real pattern changes with frequency.`}</Note>
            ) : pat === 'cardioid' ? (
              <Note>What you just saw: a cardioid rejects most directly behind (180°).</Note>
            ) : !isModelled(pat) ? null : (
              <Note>{`What you just saw: this ideal ${pat} rejects most at ≈ ${Math.round(nulls[0] ?? 0)}°.`}</Note>
            )
          ) : null}
          {!isModelled(pat) ? (
            <Note>{t.mount === 'surface' ? 'A boundary plate: Shure states “half-cardioid (cardioid in hemisphere above mounting surface)” and “Keep sound sources within a 60° range above this surface.” That is not a free-field lobe, so none is drawn.' : 'The maker calls this pattern “open cardioid” without numbers, so no lobe is drawn. The generic ideal patterns are offered for comparison.'}</Note>
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
          <Body>No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and the level it is specified for. Models appear here only as the cited source of a number. Do not assume every dynamic is less detailed, every condenser flat, or that a larger diaphragm means better bass.</Body>
          {lesson.micTypeIds.map((id) => {
            const m = MIC_TYPES[id];
            const pl = plainLines(m);
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
                  <>
                    <Body>{`Power: ${m.power}. ${sizeLine(m)}.`}</Body>
                    {m.examples.map((e) => (
                      <View key={e.model} style={{ gap: 2 }}>
                        <ProvenanceTag kind="sourced" />
                        <Body>{`${e.model} — ${e.fact}`}</Body>
                      </View>
                    ))}
                  </>
                ) : null}
              </Card>
            );
          })}
          <Note tone="warn">Max SPL figures are distortion limits for the MIC, set by each maker under its own test conditions (1 % THD for one example here, 0.5 % for another), so they do not compare one-to-one. None of them is a safe listening level: NIOSH recommends no more than 85 dBA averaged over 8 hours for people, measured where they listen.</Note>
          <Note>Before connecting, disconnecting or switching phantom power: mute the outputs and lower the monitoring, and follow the actual equipment manual. Verify that the mute really covers every output in your setup — for example, Yamaha’s ZG01 manual says not to connect or disconnect the mic cable while phantom is on, and to turn the mic gain fully down with the channel muted before switching phantom power.</Note>
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
