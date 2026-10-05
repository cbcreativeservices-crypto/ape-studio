/**
 * Page 3 — THE SETTING: WHERE IT SITS (LESSON_JOURNEY §6 stage 3).
 *
 *   ON THE KIT (rack)        the kit from above — the lesson's own drum (its
 *                            art), its neighbours as illustrated objects, the
 *                            player's space hatched. Tap an item
 *                            (or step through ITEM) to read what it means for
 *                            a mic on this drum. Explore: nothing to answer.
 *   STAGE AND STUDIO (rack)  the same plan on a STAGE (the lesson's own two
 *                            monitors — the ones the Studio-or-live page uses
 *                            later — and the audience side) or in a STUDIO.
 *   BEFORE ANY MIC (read)    ask the player first; hear the drum unamplified;
 *                            hearing safety (review C1); then the
 *                            three checks.
 * Credit: the three checks.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { SettingItem } from '../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../engine/kit';
import { KitPlan, type KitPlanScene } from '../lessons/shared/KitPlan';
import { copyOf } from '../engine/model/copy.ts';
import type { PageProps } from './pageTypes';

export function PSetting({ lesson, art, answers, onAnswered, variant }: PageProps) {
  const C = copyOf(lesson);
  const items = lesson.setting.items;
  const kitItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
  const [kitSel, setKitSel] = useState<string | null>(null);
  const [kitSeen, setKitSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [where, setWhere] = useState<'stage' | 'studio'>('stage');
  const [wideSel, setWideSel] = useState<string | null>(null);
  const wideItems = items.filter((i) => i.scene === where || i.scene === 'all');
  const byId = (id: string | null): SettingItem | undefined => items.find((i) => i.id === id);
  const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
  const wedges = lesson.live.wedges;
  const plan = art.plan;

  const pickKit = (id: string) => {
    if (!kitItems.some((i) => i.id === id)) return;
    setKitSel(id);
    setKitSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };
  const pickWide = (id: string) => {
    if (wideItems.some((i) => i.id === id)) setWideSel(id);
  };

  const Own = art.SettingPlan;
  const PW = C.setting.plan;
  const render = (scene: KitPlanScene, sel: string | null, onTap: (id: string) => void, label: string) => (w: number, h: number) =>
    Own ? (
      <Own w={w} h={h} scene={scene} variant={variant} items={items} wedges={wedges} highlight={sel} onTap={onTap} accessibilityLabel={label} />
    ) : plan ? (
      <KitPlan w={w} h={h} scene={scene} variant={variant} items={items} own={plan.own} OwnArt={plan.useArt ? art.Instrument : undefined} offset={plan.offset} wedges={wedges} highlight={sel} onTap={onTap} accessibilityLabel={label} />
    ) : (
      <Text style={styles.missing}>No plan for this lesson.</Text>
    );

  const itemFader = (list: readonly SettingItem[], sel: string | null, pick: (id: string) => void): DockParam => {
    const idx = Math.max(0, list.findIndex((i) => i.id === sel));
    return {
      kind: 'fader',
      id: 'item',
      label: 'ITEM',
      value: list.length > 1 ? idx / (list.length - 1) : 0,
      onChange: (v) => {
        const it = list[Math.round(v * (list.length - 1))];
        if (it) pick(it.id);
      },
      format: () => (sel ? `${shortOf(sel)} · ${byId(sel)?.tag ?? ''}` : `step through the ${list.length} items`),
      formatShort: () => (sel ? shortOf(sel).slice(0, 9) : 'STEP'),
    };
  };
  const kitParams: DockParam[] = useMemo(() => [itemFader(kitItems, kitSel, pickKit)], [kitItems, kitSel]); // eslint-disable-line react-hooks/exhaustive-deps
  const wideParams: DockParam[] = [
    itemFader(wideItems, wideSel, pickWide),
    {
      kind: 'options',
      id: 'where',
      label: where === 'stage' ? 'STAGE' : 'STUDIO',
      valueLabel: where === 'stage' ? 'LIVE' : 'STUDIO',
      selectedId: where,
      onSelect: (id) => {
        setWhere(id as 'stage' | 'studio');
        setWideSel(null);
      },
      sticky: true,
      options: [
        { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
        { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
      ],
    },
  ];
  const bezel = (sel: SettingItem | undefined, extra: BezelItem): BezelItem[] => [
    { k: 'ITEM', v: sel ? sel.short : 'TAP ONE', flex: 1.4 },
    { k: `FOR A ${lesson.noun.one.toUpperCase()} MIC`, v: sel ? sel.tag : '—', flex: 1.4 },
    extra,
  ];
  const kitSelItem = byId(kitSel);
  const wideSelItem = byId(wideSel);
  const card = (it: SettingItem | undefined, prompt: string) =>
    it ? (
      <Card>
        <Point title={it.label.toUpperCase()}>{it.note}</Point>
      </Card>
    ) : (
      <Note>{prompt}</Note>
    );

  const steps: MikingStep[] = [
    {
      key: 'kit',
      title: PW?.title ?? 'On the kit',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render('kit', kitSel, pickKit, `${C.setting.kitA11y} ${kitSelItem ? `Highlighted: ${kitSelItem.label}.` : ''} A typical layout.`),
        badge: PW?.badge ?? 'The kit from above · a typical right-handed layout · grey hatch = the player’s space',
        bezel: bezel(kitSelItem, { k: 'LOOKED AT', v: `${kitSeen.size} / ${kitItems.length}`, flex: 1 }),
        params: kitParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={PW?.looking ?? 'Plan · the kit from above · the player sits at the left'} prompt={C.setting.kitLanding} />
          {card(kitSelItem, C.setting.kitIdle)}
          <Note>{C.setting.leftHanded}</Note>
        </>
      ),
    },
    {
      key: 'stage',
      title: 'Stage and studio',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render(where, wideSel, pickWide, `${where === 'stage' ? C.setting.stageA11y : C.setting.studioA11y} ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}`),
        badge: where === 'stage' ? PW?.stageBadge ?? 'From above · two monitors where a stage often puts them · audience side to the right' : PW?.studioBadge ?? 'From above · a typical studio room',
        bezel: bezel(wideSelItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
        params: wideParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={where === 'stage' ? PW?.stageLooking ?? 'Plan · the kit on a stage' : PW?.studioLooking ?? 'Plan · the kit in a studio'} prompt={PW?.widePrompt ?? 'Switch STAGE / STUDIO, and tap what is new around the kit.'} />
          <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
          {card(wideSelItem, where === 'stage' ? C.setting.stageIdle : C.setting.studioIdle)}
        </>
      ),
    },
    {
      key: 'before',
      title: 'Before any mic',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            {C.setting.before.map((b) => (
              <Point key={b.title} title={b.title}>
                {b.text}
              </Point>
            ))}
          </Card>
          <Note tone="warn">Protect your hearing during repeated hits and soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens. It has nothing to do with a microphone’s maximum SPL rating, and a mic inside a drum is not a hearing meter. Keep levels and repetitions down, and use hearing protection.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
