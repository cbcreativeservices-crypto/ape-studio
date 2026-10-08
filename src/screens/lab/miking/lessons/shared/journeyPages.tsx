/**
 * JOURNEY PAGE PIECES for lessons whose instrument is not a kick (added
 * 2026-10-05 with the speaker / Leslie module, tonbak and tabla). The kick's
 * pages (pages/P*.tsx) carry the kick's own words; these pieces carry the
 * same journey (LESSON_JOURNEY.md) with the LESSON's words, so a lesson can
 * supply its own page through `LessonArt.pages` without copying the engine.
 *
 *   startStep        page 1's START: the journey map, NEW / EXPERIENCED, the
 *                    quick check (it opens the activities; it credits nothing)
 *   factsStep        page 1's WHAT IT IS: a figure and the four facts
 *   GMicrophone      stage 4: patterns (predict, then sweep), mic types by
 *                    property for THIS source, the checks
 *   GPractice        stage 7: the setup in order + gain, the briefs + the
 *                    second-channel card, the mixed review, an optional sheet
 *   posParams        POSITION / AIM dock faders with the lesson's own words
 *   micSentence      a mic's readouts in words (canvas labels, screen reader)
 *
 * Same rules as the kick: suggested starting points in plain words, no
 * sources or badges on screen, FULLY SILENT, nothing loops.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import { useLatchedPress } from '../../../../../lib/latch';
import type { DockParam } from '../../../rack/rackTypes';
import type { Lesson, MicPattern, MicPose, MicSlot, MicType } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, KeyButton, Landing, Note, OrderTaskCard, Point, PredictCard, ScenarioList, SetupTaskCard } from '../../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard, type JourneyProps } from '../../engine/journeyKit';
import { journeyIntro } from '../../engine/journey.ts';
import { copyOf } from '../../engine/model/copy.ts';
import { PolarCompare } from '../../engine/scene/PolarCompare';
import { gainDb, isModelled, nullAngles, PATTERN_LABELS } from '../../engine/physics/polar.ts';
import { fmtAngle, fmtDb, fmtIdealPickup, fmtLen, isDeepNull } from '../../engine/model/units.ts';
import type { Rig } from '../../engine/scene/useRig.ts';
import { saveObservation, useObservations } from '../../engine/progress/observations';
import { MIC_TYPES, micType } from '../../data/micTypes';
import type { PageProps } from '../../pages/pageTypes';

/* ── page 1 ── */
/** `_intro`: the lesson's own words for the old journey, kept as written but no
 *  longer shown — every START says the journey as it now is (journeyIntro).
 *  `opts.ownIntro` (owner 2026-10-08, L7A): a lesson that names no instrument
 *  (B12–B17: a field, a dish, a venue) shows its OWN `terms.startIntro`. */
export function startStep(lesson: Lesson, journey: JourneyProps, _intro: string, opts: { ownIntro?: boolean } = {}): MikingStep {
  const own = opts.ownIntro ? copyOf(lesson).terms?.startIntro : undefined;
  return {
    key: 'start',
    title: 'Start here',
    kind: 'READ',
    layout: 'read',
    body: (
      <>
        <Body>{own ?? journeyIntro(lesson.noun, copyOf(lesson).words.instrument)}</Body>
        <JourneyMap met={journey.met} here="meet" />
        <PathChooser journey={journey} />
        {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
        {journey.path === 'new' ? <Note tone="ok">{`Good — NEXT takes you through the ${lesson.noun.one} first. You can change how you started here at any time.`}</Note> : null}
      </>
    ),
  };
}

export function factsStep(lesson: Lesson, figure: ReactNode): MikingStep {
  return {
    key: 'what',
    title: 'What it is',
    kind: 'LEARN',
    layout: 'read',
    body: (
      <>
        {figure}
        {lesson.orient.map((f) => (
          <Card key={f.title}>
            <Point title={f.title}>{f.text}</Point>
          </Card>
        ))}
      </>
    ),
  };
}

/* ── stage 4: microphones ── */
export type MicPageSpec = {
  /** What the mount line says for this source (stand / clip …). */
  mountLine: (m: MicType) => string;
  /** One sentence before the cards: choose by property for THIS source. */
  intro: string;
  /** More cards after the stand mics (Lab 3, 2026-10-05): a hand-held harp
   *  mic, instrument-mounted miniatures — mics no stand placement offers. */
  extra?: ReactNode;
};

export function GMicrophone({ lesson, answers, onAnswered }: PageProps, spec: MicPageSpec) {
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
  const tried = predicted != null && maxAngle >= 100;
  const pred = lesson.predictions.microphone;
  const deep = db != null && isDeepNull(db);
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
          {deep ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — use a null to aim, not to promise silence.</Note> : null}
          {tried ? (
            pat === 'cardioid' ? (
              <Note tone="ok">What you just saw: a cardioid rejects most directly behind (180°), and still picks up about half (−6 dB) at its sides.</Note>
            ) : pat === 'omni' ? (
              <Note tone="ok">What you just saw: an omni picks up all round — no null to aim. It hears more of the room and the stage.</Note>
            ) : isModelled(pat) ? (
              <Note tone="ok">{`What you just saw: this ${pat} rejects most at ≈ ${Math.round(nulls[0] ?? 0)}° — toward the rear but off the axis — with a small pickup lobe directly behind.`}</Note>
            ) : null
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
          <Body>{spec.intro}</Body>
          {lesson.micTypeIds.map((id) => {
            const m = MIC_TYPES[id];
            const isOpen = open.has(id);
            const p = m.patterns[0].id;
            return (
              <Card key={id}>
                <Point title={m.label.toUpperCase()}>{m.blurb}</Point>
                <Text style={styles.line}>{m.transducer === 'dynamic' ? 'Power: none needed' : 'Power: needs phantom power from the desk'}</Text>
                <Text style={styles.line}>{spec.mountLine(m)}</Text>
                <Text style={styles.line}>{p === 'cardioid' ? 'Pattern: cardioid — rejects most directly behind' : p === 'supercardioid' ? 'Pattern: supercardioid — rejects most off to each side of the rear' : `Pattern: ${PATTERN_LABELS[p]}`}</Text>
                <Pressable
                  onPress={() =>
                    setOpen((prev) => {
                      const n = new Set(prev);
                      if (n.has(id)) n.delete(id);
                      else n.add(id);
                      return n;
                    })
                  }
                  style={styles.toggle}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`Spec details for ${m.label}`}
                >
                  <Text style={styles.toggleText}>{isOpen ? 'SPEC DETAILS ▴' : 'SPEC DETAILS ▾'}</Text>
                </Pressable>
                {isOpen ? <Body>{`Power: ${m.power}. Drawn size: ${(m.body.radius.mm * 0.2).toFixed(1)} × ${(m.body.length.mm / 10).toFixed(1)} cm (${((m.body.radius.mm * 2) / 25.4).toFixed(1)} × ${(m.body.length.mm / 25.4).toFixed(1)} in), a typical size for this type.`}</Body> : null}
              </Card>
            );
          })}
          {spec.extra ?? null}
          <Note tone="warn">A mic’s max SPL is the level at which the MIC distorts, measured under its maker’s own conditions — never a safe listening level. For people, keep to about 85 dBA averaged over 8 hours, measured where they listen.</Note>
          <Note>Before connecting, disconnecting or switching phantom power: mute the outputs, lower the monitoring and turn the channel gain down, and follow the manual for your own equipment. Do not judge compatibility by the connector’s shape: a miniature mic may need its own adapter.</Note>
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

/* ── stage 7: practice ── */
export type PracticeSpec = {
  orderNote: string;
  gainId: string;
  secondId: string;
  mixIds: readonly string[];
  mixIntro: string;
  sheetNote: string;
};

export function GPractice({ lesson, answers, onAnswered, canSave, preview }: PageProps, spec: PracticeSpec) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'saved' | 'failed' | null>(null);
  const sheets = useObservations(lesson.id);
  const save = useLatchedPress(async () => {
    const ok = await saveObservation({ id: `${lesson.id}:${Date.now()}`, lessonId: lesson.id, at: Date.now(), fields });
    setResult(ok ? 'saved' : 'failed');
    if (ok) setFields({});
  });
  const order = lesson.orderTasks.filter((t) => t.page === 'practice');
  const setups = lesson.setupTasks.filter((t) => t.page === 'practice');
  const pick = (ids: readonly string[]) => lesson.scenarios.filter((s) => ids.includes(s.id));
  const steps: MikingStep[] = [
    {
      key: 'order',
      title: 'Set up in order',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{spec.orderNote}</Body>
          {order.map((t) => (
            <OrderTaskCard key={t.id} t={t} answered={t.id in answers} onAnswered={(ok) => onAnswered(t.id, ok)} />
          ))}
          <ScenarioList items={pick([spec.gainId])} answers={answers} onAnswered={onAnswered} />
          <Note tone="warn">Protect your hearing through all of this: keep levels and repetitions down during soundcheck, and use hearing protection.</Note>
        </>
      ),
    },
    {
      key: 'setup',
      title: 'Your setup',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{lesson.practice.task}</Body>
          <Body>Each brief accepts more than one setup — there is no single right answer. Choose one, then tick every reason that justifies it: the check reads your reasoning, not a single “right” position.</Body>
          {setups.map((t) => (
            <SetupTaskCard key={t.id} t={t} answered={t.id in answers} onAnswered={(ok) => onAnswered(t.id, ok)} />
          ))}
          <ScenarioList items={pick([spec.secondId])} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
    {
      key: 'mixed',
      title: 'Mixed review',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{spec.mixIntro}</Body>
          <ScenarioList items={pick(spec.mixIds)} answers={answers} onAnswered={onAnswered} />
          <Card>
            <Point title="OBSERVATION SHEET · OPTIONAL">{spec.sheetNote}</Point>
            {lesson.practice.fields.map((f) =>
              f.kind === 'choice' ? (
                <View key={f.id} style={{ gap: 4 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={styles.chips}>
                    {(f.choices ?? []).map((c) => (
                      <Pressable key={c} onPress={() => setFields((p) => ({ ...p, [f.id]: c }))} style={[styles.chip, fields[f.id] === c && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: fields[f.id] === c }} accessibilityLabel={`${f.label}: ${c}`}>
                        <Text style={[styles.chipText, fields[f.id] === c && { color: colors.amber }]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View key={f.id} style={{ gap: 4 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput value={fields[f.id] ?? ''} onChangeText={(v) => setFields((p) => ({ ...p, [f.id]: v }))} style={styles.input} placeholderTextColor={colors.textMuted} accessibilityLabel={f.label} maxLength={600} multiline={f.id === 'notes'} />
                </View>
              ),
            )}
            {canSave ? <KeyButton label="SAVE THIS SHEET" onPress={save} disabled={Object.values(fields).every((v) => !v.trim())} /> : <Note>{preview ? 'The preview does not keep sheets.' : 'Sheets are kept only when you are signed in to your account.'}</Note>}
            {result === 'saved' ? <Note tone="ok">Saved on this device.</Note> : null}
            {sheets.length ? <Body>{`${sheets.length} sheet${sheets.length === 1 ? '' : 's'} on this device for this lesson (the newest 24 are kept).`}</Body> : null}
          </Card>
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ── POSITION / AIM in the lesson's own words ── */
export type PosAxis = 'x' | 'y' | 'z';
export type AimAxis = 'az' | 'el';
export type AxisWords = Record<PosAxis, { label: string; blurb: string; short: string; fmt: (v: number) => string }>;
const AIM_MAX = 80;

export function posParams(o: { rig: Rig; slot: MicSlot; posAxis: PosAxis; setPosAxis: (a: PosAxis) => void; aimAxis: AimAxis; setAimAxis: (a: AimAxis) => void; words: AxisWords; aimWords: { az: string; el: string }; azCentre?: number }): DockParam[] {
  const { rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, words, aimWords } = o;
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const pose: MicPose = m.pose;
  const lo = rig.bounds.min[posAxis];
  const hi = rig.bounds.max[posAxis];
  const cur = pose.p[posAxis];
  const block = rig.stop[slot];
  const stopWord = block ? `✕ ${rig.lesson.model.parts.find((p) => p.id === block.partId)?.short ?? block.label}` : '';
  const azC = o.azCentre ?? 0;
  const a = aimAxis === 'az' ? pose.az - azC : pose.el;
  return [
    {
      kind: 'fader',
      id: 'pos',
      label: 'POSITION',
      value: Math.min(1, Math.max(0, (cur - lo) / (hi - lo))),
      // Preview while the finger rides the lane, commit on release (the
      // engine's fader contract, 2026-10-06: no page re-render per move).
      onChange: (v) => {
        rig.preview(slot, { ...pose, p: { ...pose.p, [posAxis]: lo + v * (hi - lo) } });
      },
      onCommit: () => rig.commit(slot),
      format: (v) => {
        const at = lo + v * (hi - lo);
        return Math.abs(at - cur) < 0.5 ? (stopWord ? `${stopWord} · ${fmtLen(Math.abs(cur))}` : words[posAxis].fmt(cur)) : words[posAxis].fmt(at);
      },
      formatShort: () => words[posAxis].short,
      chooser: {
        title: 'MOVE THE MIC',
        selectedId: posAxis,
        onSelect: (id) => setPosAxis(id as PosAxis),
        options: (['x', 'y', 'z'] as const).map((k) => ({ id: k, label: words[k].label, blurb: words[k].blurb })),
      },
    },
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a + AIM_MAX) / (2 * AIM_MAX),
      home: 0.5,
      onChange: (v) => {
        const ang = Math.round((v * 2 - 1) * AIM_MAX);
        rig.preview(slot, aimAxis === 'az' ? { ...pose, az: ang + azC } : { ...pose, el: ang });
      },
      onCommit: () => rig.commit(slot),
      format: (v) => {
        const want = Math.round((v * 2 - 1) * AIM_MAX);
        const live = Math.abs(want - a) >= 1;
        const x = live ? want : a;
        return `${stopWord && !live ? `${stopWord} · ` : ''}${aimAxis === 'az' ? (x >= 0 ? 'turned right' : 'turned left') : x >= 0 ? 'tilted up' : 'tilted down'} ${fmtAngle(Math.abs(x))}`;
      },
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as AimAxis),
        options: [
          { id: 'az', label: 'LEFT–RIGHT', blurb: aimWords.az },
          { id: 'el', label: 'UP–DOWN', blurb: aimWords.el },
        ],
      },
    },
  ];
}

/** One mic's readouts in plain words, with the lesson's own nouns. */
export function micSentence(rig: Rig, slot: MicSlot, nouns: { inside?: string; outside: string }): string {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const t = micType(m.typeId);
  const r = rig.shown(slot);
  const s = rig.lesson.model.surfaces.find((q) => q.id === rig.surfaceId);
  const l = rig.lesson.model.lines.find((q) => q.id === rig.lineId);
  const z = r.zoneId ? rig.lesson.zones.find((q) => q.id === r.zoneId) ?? null : null;
  const where = r.inside && nouns.inside ? nouns.inside : nouns.outside;
  return `Mic ${slot}: ${t.label.toLowerCase()}, ${where}, ${fmtLen(Math.abs(r.distance))} from ${s?.label ?? 'the reference'}, ${fmtLen(r.radial)} off ${l?.label ?? 'the reference line'}, aimed ${fmtAngle(r.offAxis)} off it.${z ? ` At a recommended starting point: ${z.label}.` : ' Not at a recommended starting point.'}${r.blocked ? ` Stopped: it would touch the ${r.blocked.label}.` : ' Clear of every part.'}`;
}

const styles = StyleSheet.create({
  line: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  toggle: { minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' },
  toggleText: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
  fieldLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, backgroundColor: '#101013' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
});

export { Chip };
function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label}>
      <Text style={[styles.chipText, on && { color: colors.amber }]}>{label}</Text>
    </Pressable>
  );
}
