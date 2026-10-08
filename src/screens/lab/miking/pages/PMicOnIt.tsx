/**
 * MICROPHONES, step 1 — ON THE INSTRUMENT (owner restructure 2026-10-06:
 * "show the chosen mic ON the instrument in its setup, not only on the polar
 * display"). The mic type chosen in TYPE is drawn where the lesson starts it:
 * the starting setup that uses that type, else the lesson's first starting
 * point that takes it — with its stand or clip, its pickup shape, its aim and
 * its distance (engine/scene/SetupStage). PATTERN switches the drawn shape
 * where the type offers more than one. The lesson's own microphone page (the
 * patterns, by property, the checks) follows: a composed page.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicPattern, ViewId } from '../engine/model/types.ts';
import { copyOf } from '../engine/model/copy.ts';
import { roleWords, typeForZone, zoneInVariant, type StartingSetup } from '../engine/setups.ts';
import { bestView, guideFor } from '../engine/geometry/guides.ts';
import { hasBothViews, viewToggle } from '../engine/scene/viewToggle.ts';
import { SetupStage } from '../engine/scene/SetupStage';
import { isModelled, PATTERN_LABELS } from '../engine/physics/polar.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point } from '../engine/kit';
import { MIC_TYPES, micType } from '../data/micTypes';
import { plainLines } from './PMicrophone';
import { micWords, useSetups } from './PSetups';
import type { PageProps } from './pageTypes';

export function PMicOnIt({ lesson, art, variant, startFrom }: PageProps) {
  const C = copyOf(lesson);
  const setups = useSetups(lesson, variant);
  const start = setups.find((s) => s.id === startFrom) ?? setups[0];
  const [typeId, setTypeId] = useState(start?.mics[0].typeId ?? lesson.micTypeIds[0]);
  const t = micType(typeId);
  const [pattern, setPattern] = useState<MicPattern>(t.patterns[0].id);
  const pat: MicPattern = t.patterns.some((p) => p.id === pattern) ? pattern : t.patterns[0].id;
  // Where this type starts: a setup that uses it (the chosen one first), else
  // the first starting point in this setup of the instrument that takes it.
  const setup = useMemo<StartingSetup | null>(() => {
    const own = [start, ...setups].find((s) => s && s.mics[0].typeId === typeId);
    const base = own ?? (() => {
      const z = lesson.zones.find((q) => zoneInVariant(q, variant) && (q.requires?.micTypeIds ?? lesson.micTypeIds).includes(typeId) && (!q.requires?.mount || q.requires.mount === micType(typeId).mount));
      if (!z) return null;
      const s: StartingSetup = { id: `type:${z.id}`, role: 'more', variant, title: z.label, mics: [{ slot: 'A', typeId, pattern: micType(typeId).patterns[0].id, pose: z.start, zoneId: z.id, surfaceId: z.refSurface, polarity: 1 }], zones: [z], line: z.tendency };
      return s;
    })();
    if (!base) return null;
    // One mic, of this type and pattern, at the setup's first mic.
    const m = base.mics[0];
    return { ...base, id: `${base.id}|${typeId}|${pat}`, mics: [{ ...m, typeId, pattern: pat }], zones: base.zones.filter((z) => z.id === m.zoneId) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setups, start?.id, typeId, pat, variant, lesson]);
  const both = hasBothViews(lesson.model, variant);
  const guide = useMemo(() => {
    const m = setup?.mics[0];
    const s = m ? lesson.model.surfaces.find((q) => q.id === m.surfaceId) : undefined;
    return m && s ? guideFor(s, m.pose) : null;
  }, [setup, lesson.model.surfaces]);
  const [view, setView] = useState<ViewId>(() => bestView(guide ? [guide] : [], both));
  const pl = plainLines(t, C.words);
  const zone = setup?.zones[0];
  const typeFits = zone ? typeForZone(lesson, zone, MIC_TYPES) === typeId || (zone.requires?.micTypeIds ?? lesson.micTypeIds).includes(typeId) : false;

  const params: DockParam[] = [
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
    ...viewToggle({ view, setView, stage: 'dual', both }),
  ];
  const bezel: BezelItem[] = [
    { k: 'TYPE', v: t.short, flex: 1.3 },
    { k: 'PATTERN', v: isModelled(pat) ? pat.toUpperCase() : 'NOT DRAWN', flex: 1.2 },
    { k: 'POWER', v: t.transducer === 'condenser' ? 'PHANTOM' : 'NONE', flex: 1 },
    { k: 'MOUNT', v: t.mount.toUpperCase(), flex: 0.9 },
  ];
  const steps: MikingStep[] = [
    {
      key: 'onit',
      title: 'On the instrument',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          setup ? (
            <SetupStage key={setup.id} lesson={lesson} art={art} setup={setup} view={view} setView={setView} w={w} h={h} label={`${micWords(typeId, pat)}, where this lesson starts it: ${setup.title}.`} />
          ) : (
            <Text style={styles.missing}>This mic type has no starting point in this setup of the instrument.</Text>
          ),
        badge: 'The chosen mic where this lesson starts it · amber dashed = where it points · white = its distance · dashed lobe = pattern shape',
        bezel,
        params,
        initialParam: 'type',
      },
      well: (
        <>
          <Landing looking={micWords(typeId, pat)} prompt="Choose a TYPE: each one is drawn where this lesson starts it, with its mount, its pickup shape and its distance." />
          <Card>
            <Point title={t.label.toUpperCase()}>{t.blurb}</Point>
            <Text style={styles.line}>{pl.power}</Text>
            <Text style={styles.line}>{pl.mount}</Text>
            <Text style={styles.line}>{pl.pattern}</Text>
          </Card>
          {setup ? (
            <Body>{`${setup.role === 'more' ? 'Where it starts' : roleWords(setup)}: ${setup.title}.${zone && typeFits ? ` ${zone.band}` : ''}`}</Body>
          ) : (
            <Note>None of this lesson’s starting points uses this type here — try another TYPE, or another setup of the instrument on the setups page.</Note>
          )}
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  line: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
