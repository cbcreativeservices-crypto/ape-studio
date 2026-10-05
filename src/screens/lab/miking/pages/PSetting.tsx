/**
 * Page 3 — THE SETTING: WHERE IT SITS (LESSON_JOURNEY §6 stage 3).
 *
 *   ON THE KIT (rack)        the kit from above — the lesson's own drum (its
 *                            art), its neighbours as illustrated objects, the
 *                            player's space hatched ILLUSTRATIVE. Tap an item
 *                            (or step through ITEM) to read what it means for
 *                            a mic on this drum. Explore: nothing to answer.
 *   STAGE AND STUDIO (rack)  the same plan on a STAGE (the lesson's own two
 *                            monitors — the ones the Studio-or-live page uses
 *                            later — and the audience side) or in a STUDIO.
 *   BEFORE ANY MIC (read)    ask the player first; hear the drum unamplified;
 *                            hearing safety (NIOSH, review C1); then the
 *                            three checks.
 * Credit: the three checks.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { SettingItem } from '../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, ProvenanceTag, ScenarioList } from '../engine/kit';
import { KitPlan, type KitPlanScene } from '../lessons/shared/KitPlan';
import type { PageProps } from './pageTypes';

export function PSetting({ lesson, art, answers, onAnswered, variant }: PageProps) {
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

  const render = (scene: KitPlanScene, sel: string | null, onTap: (id: string) => void, label: string) => (w: number, h: number) =>
    plan ? (
      <KitPlan w={w} h={h} scene={scene} variant={variant} Drum={art.Instrument} drumBox={plan.drum} pedalBox={plan.pedal} wedges={wedges} shortOf={shortOf} highlight={sel} onTap={onTap} accessibilityLabel={label} />
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
        <ProvenanceTag kind={it.prov.kind === 'sourced' ? 'sourced' : 'illustrative'} />
      </Card>
    ) : (
      <Note>{prompt}</Note>
    );

  const steps: MikingStep[] = [
    {
      key: 'kit',
      title: 'On the kit',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render('kit', kitSel, pickKit, `The drum kit from above: the kick in the middle, its pedal and the throne behind it, the hi-hat and snare to the player's left, the floor tom to the right, a rack tom over the kick. ${kitSelItem ? `Highlighted: ${kitSelItem.label}.` : ''} Positions illustrative.`),
        badge: 'PLAN from above · a typical right-handed kit · positions ILLUSTRATIVE (no source gives a layout) · grey hatch = the player’s space',
        bezel: bezel(kitSelItem, { k: 'LOOKED AT', v: `${kitSeen.size} / ${kitItems.length}`, flex: 1 }),
        params: kitParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking="Plan · the kit from above · the player sits at the left" prompt="Tap anything around the kick — or step through ITEM — to see what it means for a kick mic. There is nothing to answer yet." />
          {card(kitSelItem, 'The kick sits in the middle of the kit, on the floor, with the player behind its batter head. Everything around it is either the player’s space or a loud neighbour.')}
          <Note>Left-handed players set the kit up mirrored — the hi-hat on the right, the floor tom on the left.</Note>
        </>
      ),
    },
    {
      key: 'stage',
      title: 'Stage and studio',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render(where, wideSel, pickWide, where === 'stage' ? `The kit on a stage, from above: the drummer's fill monitor beside the throne, a downstage wedge on the audience side of the kick, and the audience and PA to the right. ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}` : `The kit in a studio room, from above: no monitors on the floor; the room's walls around it. ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}`),
        badge: where === 'stage' ? 'PLAN · the lesson’s two monitors at ILLUSTRATIVE stage positions · audience side to the right' : 'PLAN · a generic room, size ILLUSTRATIVE',
        bezel: bezel(wideSelItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
        params: wideParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={where === 'stage' ? 'Plan · the kit on a stage' : 'Plan · the kit in a studio'} prompt="Switch STAGE / STUDIO, and tap what is new around the kit." />
          <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
          {card(wideSelItem, where === 'stage' ? 'Two floor monitors: the drummer’s own fill beside the throne, and another player’s wedge on the audience side. The front head faces the audience and the PA.' : 'No monitors on the floor. The room itself is part of the picture now.')}
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
            <Point title="ASK THE PLAYER FIRST">Is the front head intact or ported, and what should the kick do — a supportive pulse, a defined attack, a resonant note, or a mix? Hear the drum without reinforcement first. If its tuning or damping needs work, agree it with the player (the Drum Tuning Lab covers that): mic placement cannot fix a drum that does not make the wanted sound acoustically.</Point>
            <Point title="WORK WITH THE DRUM AS IT IS">Never cut a port, or change the drum, to match a diagram.</Point>
          </Card>
          <Note tone="warn">Protect your hearing during repeated hits and soundcheck. NIOSH (the US National Institute for Occupational Safety and Health) recommends no more than 85 dBA averaged over an 8-hour day, and halving the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens. It has nothing to do with a microphone’s maximum SPL rating, and a mic inside a drum is not a hearing meter. Keep levels and repetitions down, and use hearing protection.</Note>
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
