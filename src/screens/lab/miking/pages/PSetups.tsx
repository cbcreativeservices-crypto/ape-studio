/**
 * STARTING SETUPS — the heart of every lesson (owner restructure 2026-10-06:
 * "nowhere do I actually see mics set up or shown as an example, and that is
 * the goal of the lab").
 *
 *   SETUPS (rack)   one setup at a time, drawn ON the instrument: the mic(s)
 *                   at the lesson's own starting points, with stand / boom /
 *                   clip, the aim (amber) and the distance as a dimension
 *                   (white). SETUP steps through them; ONE MIC, TWO MICS,
 *                   CLOSE · LIVE, FARTHER BACK · STUDIO — whichever the
 *                   lesson's research gives (engine/setups.ts) — then the
 *                   lesson's other starting points. Each card: the mic type
 *                   and pattern, where to start (distance and aim) and one
 *                   plain line of what it tends to sound like and its
 *                   trade-off. The last one looked at is where the Placement
 *                   Studio starts.
 *   AROUND IT (read) what else reaches the mic, what it must keep clear of,
 *                   and what changes on a stage or in a studio — the old
 *                   "where it sits" page's mic decisions, said as decisions.
 * The lesson's own "before any mic" step (its checks) follows (the composed
 * page, engine/restructure.setupsKeep).
 *
 * Credit: every setup in one of the four roles looked at (+ the checks).
 */
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicPattern, SettingItem, ViewId } from '../engine/model/types.ts';
import { copyOf } from '../engine/model/copy.ts';
import { coreSetups, ROLE_LABEL, startingSetups, type StartingSetup } from '../engine/setups.ts';
import { bestView, guideFor } from '../engine/geometry/guides.ts';
import { hasBothViews, viewToggle } from '../engine/scene/viewToggle.ts';
import { SetupStage } from '../engine/scene/SetupStage';
import { PATTERN_LABELS } from '../engine/physics/polar.ts';
import { fmtLen } from '../engine/model/units.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point } from '../engine/kit';
import { MIC_TYPES, micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

const patternWord = (typeId: string, p: MicPattern) => micType(typeId).patterns.find((q) => q.id === p)?.label ?? PATTERN_LABELS[p];

/** A setup's mic in words: "End-address dynamic … · supercardioid". */
export function micWords(typeId: string, p: MicPattern): string {
  const t = MIC_TYPES[typeId];
  const pat = patternWord(typeId, p);
  return t ? (t.label.toLowerCase().includes(pat.toLowerCase()) ? t.label : `${t.label} · ${pat}`) : pat;
}

/** The setups for a lesson in one variant (the page and the studio agree). */
export function useSetups(lesson: PageProps['lesson'], variant: string): StartingSetup[] {
  return useMemo(() => startingSetups(lesson, variant, MIC_TYPES), [lesson, variant]);
}

/** The setting page's neighbours that say something to a mic (not the
 *  instrument itself, not which side the audience is). */
const SELF = /^(THE INSTRUMENT|THE DRUMS?|THE CYMBAL|THE SOURCE|FRONT SIDE|THE HOST)$/;
export function aroundItems(items: readonly SettingItem[]): { near: SettingItem[]; stage: SettingItem[]; studio: SettingItem[] } {
  const keep = items.filter((i) => !SELF.test(i.tag));
  return { near: keep.filter((i) => i.scene === 'all' || i.scene === 'kit'), stage: keep.filter((i) => i.scene === 'stage'), studio: keep.filter((i) => i.scene === 'studio') };
}

/** The web preview harness only (`&setup=<n>`, 1-based): open that setup, for
 *  captures of every setup (never the production router). */
function devSetupIndex(): number {
  if (!(__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined')) return 0;
  const m = /[?&]setup=(\d+)/.exec(window.location.search);
  return m ? Math.max(0, Number(m[1]) - 1) : 0;
}

/** `where`: per mic slot, the distance in words when the mic has no zone of
 *  its own (a second mic placed where the two-mic page puts it). */
export function SetupCard({ s, where }: { s: StartingSetup; where?: Partial<Record<string, string>> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.role}>{ROLE_LABEL[s.role]}</Text>
      <Text style={styles.title}>{s.title}</Text>
      {s.mics.map((m) => {
        const z = s.zones.find((q) => q.id === m.zoneId);
        return (
          <View key={m.slot} style={{ gap: 2 }}>
            <Text style={styles.line}>
              <Text style={styles.key}>{s.mics.length > 1 ? `MIC ${m.slot} · ` : 'MIC · '}</Text>
              {micWords(m.typeId, m.pattern)}
              {m.polarity === -1 ? ' · polarity switched' : ''}
            </Text>
            {z ? (
              <Text style={styles.line}>
                <Text style={styles.key}>{'START · '}</Text>
                {z.band}
              </Text>
            ) : where?.[m.slot] ? (
              <Text style={styles.line}>
                <Text style={styles.key}>{'START · '}</Text>
                {where[m.slot]}
              </Text>
            ) : null}
          </View>
        );
      })}
      <Text style={styles.tendency}>
        <Text style={styles.key}>{'TENDS TO · '}</Text>
        {s.line}
      </Text>
    </View>
  );
}

export function PSetups({ lesson, art, variant, setVariant, onInteractive, interactiveDone, chooseStart }: PageProps) {
  const C = copyOf(lesson);
  const setups = useSetups(lesson, variant);
  const core = useMemo(() => coreSetups(setups), [setups]);
  const [idx, setIdx] = useState(devSetupIndex);
  const i = Math.min(idx, Math.max(0, setups.length - 1));
  const sel = setups[i] as StartingSetup | undefined;
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const both = hasBothViews(lesson.model, variant);
  const guides = useMemo(() => {
    if (!sel) return [];
    return sel.mics
      .map((m) => {
        const s = lesson.model.surfaces.find((q) => q.id === m.surfaceId);
        return s ? guideFor(s, m.pose) : null;
      })
      .filter((g): g is NonNullable<typeof g> => !!g);
  }, [sel, lesson.model.surfaces]);
  const [view, setView] = useState<ViewId>('side');
  // Each setup opens in the view that shows its distance best.
  useEffect(() => {
    setView(bestView(guides, both));
  }, [sel?.id, variant]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sel) return;
    setSeen((prev) => (prev.has(`${variant}|${sel.id}`) ? prev : new Set([...prev, `${variant}|${sel.id}`])));
    chooseStart?.(sel.id);
  }, [sel?.id, variant]); // eslint-disable-line react-hooks/exhaustive-deps
  const seenCore = core.filter((s) => seen.has(`${variant}|${s.id}`)).length;
  useEffect(() => {
    if (core.length && seenCore >= core.length && !interactiveDone.has('setupsSeen')) onInteractive('setupsSeen');
  }, [seenCore, core.length, interactiveDone, onInteractive]);

  // A mic with no zone of its own: its distance, in words, from the surface it is measured from.
  const where: Partial<Record<string, string>> = {};
  sel?.mics.forEach((m, k) => {
    const sf = lesson.model.surfaces.find((q) => q.id === m.surfaceId);
    if (!m.zoneId && sf && guides[k]) where[m.slot] = `About ${fmtLen(guides[k].distance).replace(/^≈ /, '')} from ${/^the /i.test(sf.label) ? sf.label : `the ${sf.label}`}.`;
  });
  const variantLabel = lesson.model.variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
  const variantShort = C.variantShort[variant] ?? variantLabel.toLowerCase();
  const d0 = guides[0]?.distance;
  const t0 = sel ? micType(sel.mics[0].typeId) : null;
  const params: DockParam[] = useMemo(
    () => [
      {
        kind: 'fader',
        id: 'setup',
        label: 'SETUP',
        value: setups.length > 1 ? i / (setups.length - 1) : 0,
        onChange: (v) => setIdx(Math.round(v * (setups.length - 1))),
        format: () => (sel ? `${i + 1} of ${setups.length} · ${ROLE_LABEL[sel.role].toLowerCase()}` : 'no setup'),
        formatShort: () => `${i + 1} / ${setups.length}`,
      },
      {
        kind: 'options',
        id: 'pick',
        label: 'SETUPS',
        valueLabel: sel ? ROLE_LABEL[sel.role].split(' ')[0] : '—',
        selectedId: sel?.id ?? null,
        onSelect: (id) => setIdx(Math.max(0, setups.findIndex((s) => s.id === id))),
        sticky: true,
        options: setups.map((s) => ({ id: s.id, label: `${ROLE_LABEL[s.role]} · ${s.title}`, blurb: s.line })),
      },
      ...viewToggle({ view, setView, stage: 'dual', both }),
      ...(lesson.model.variants.length > 1
        ? [
            {
              kind: 'options' as const,
              id: 'variant',
              label: C.variantKey,
              valueLabel: variantLabel,
              selectedId: variant,
              onSelect: (id: string) => {
                setVariant(id);
                setIdx(0);
              },
              options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setups, i, sel, view, both, variant, variantLabel, lesson.model.variants, C.variantKey],
  );
  const bezel: BezelItem[] = [
    { k: 'SETUP', v: sel ? `${i + 1} / ${setups.length}` : '—', flex: 0.8 },
    { k: 'MIC', v: t0 ? t0.short : '—', flex: 1.2 },
    { k: 'DISTANCE', v: d0 != null ? fmtLen(d0).replace(/ \(.*\)$/, '') : '—', sub: sel?.mics.length === 2 && guides[1] ? `B ${fmtLen(guides[1].distance).replace(/ \(.*\)$/, '')}` : undefined, flex: 1.1 },
    { k: 'LOOKED AT', v: `${seenCore} / ${core.length}`, flex: 1 },
  ];
  const a11y = sel ? `${ROLE_LABEL[sel.role]}: ${sel.title}. ${sel.mics.map((m) => micWords(m.typeId, m.pattern)).join('; ')}.${d0 != null ? ` Distance ${fmtLen(d0)}.` : ''}` : 'No setup.';
  const around = aroundItems(lesson.setting.items);
  const aroundRow = (it: SettingItem) => (
    <Point key={it.id} title={`${it.tag} · ${it.label.toUpperCase()}`}>
      {it.note}
    </Point>
  );

  const steps: MikingStep[] = [
    {
      key: 'setups',
      title: 'Starting setups',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          sel ? <SetupStage key={`${variant}|${sel.id}`} lesson={lesson} art={art} setup={sel} view={view} setView={setView} w={w} h={h} label={a11y} /> : <Text style={styles.missing}>No starting setup for this choice.</Text>,
        badge: 'Setups placed for you · amber dashed = where the mic points · white = its distance · dashed lobe = pattern shape',
        bezel,
        params,
        initialParam: 'setup',
      },
      well: (
        <>
          <Landing looking={sel ? `${ROLE_LABEL[sel.role]} · ${variantShort}` : variantShort} prompt="Step through SETUP. Each one is drawn on the instrument: the mic and its stand, where it points (amber) and its distance (white)." />
          {sel ? <SetupCard s={sel} where={where} /> : <Note>This lesson has no starting setup for this choice — try another one in the dock.</Note>}
          <Body>{`Looked at: ${seenCore} of ${core.length} setups${setups.length > core.length ? ` (and ${setups.length - core.length} more starting point${setups.length - core.length === 1 ? '' : 's'} to explore)` : ''}. The Placement Studio starts from the last one you look at.`}</Body>
        </>
      ),
    },
    {
      key: 'around',
      title: 'What else the mic hears',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>{`Before you choose a setup: what reaches a mic on the ${lesson.noun.one} besides the ${lesson.noun.one}, what the mic and its stand must keep clear of, and what changes on a stage or in a studio.`}</Body>
          {around.near.length ? (
            <Card>
              <Text style={styles.key}>AROUND IT</Text>
              {around.near.map(aroundRow)}
            </Card>
          ) : null}
          <Card>
            <Text style={styles.key}>ON A STAGE (LIVE)</Text>
            <Body>{lesson.setting.stage}</Body>
            {around.stage.map(aroundRow)}
          </Card>
          <Card>
            <Text style={styles.key}>IN A STUDIO</Text>
            <Body>{lesson.setting.studio}</Body>
            {around.studio.map(aroundRow)}
          </Card>
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  card: { gap: 5, borderLeftWidth: 3, borderLeftColor: colors.amber, paddingLeft: 10 },
  role: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20 },
  key: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  tendency: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
