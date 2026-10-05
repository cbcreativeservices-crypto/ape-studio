/**
 * HAND DRUMS · Page 3 — THE SETTING: WHERE IT SITS (LESSON_JOURNEY §6 stage
 * 3, §8), the family's version of pages/PSetting.tsx.
 *
 *   IN THE BAND (rack)       the band from above — the lesson's drums (its
 *                            art), the player at them, the neighbours as
 *                            illustrated objects. Tap an item (or step through
 *                            ITEM) to read what it means for a mic here.
 *   STAGE AND STUDIO (rack)  the same plan on a STAGE (the lesson's monitor —
 *                            the one Studio-or-live uses later — and the
 *                            audience side) or in a STUDIO room.
 *   BEFORE ANY MIC (read)    ask the player first; hear the drums unamplified;
 *                            hearing safety; the three checks.
 * Credit: the three checks.
 */
import { useMemo, useState } from 'react';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import type { SettingItem } from '../../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../../engine/kit';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf } from '../family.ts';
import { HandPlan } from '../HandPlan';

export function HSetting({ lesson, art, answers, onAnswered, variant }: PageProps) {
  const H = handOf(lesson);
  const items = lesson.setting.items;
  const bandItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
  const [bandSel, setBandSel] = useState<string | null>(null);
  const [bandSeen, setBandSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [where, setWhere] = useState<'stage' | 'studio'>('stage');
  const [wideSel, setWideSel] = useState<string | null>(null);
  const wideItems = items.filter((i) => i.scene === where || i.scene === 'all');
  const byId = (id: string | null): SettingItem | undefined => items.find((i) => i.id === id);
  const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
  const things = H.plan.things;

  const pickBand = (id: string) => {
    if (!bandItems.some((i) => i.id === id)) return;
    setBandSel(id);
    setBandSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };
  const pickWide = (id: string) => {
    if (wideItems.some((i) => i.id === id)) setWideSel(id);
  };
  const render = (scene: 'kit' | 'stage' | 'studio', sel: string | null, onTap: (id: string) => void, label: string) => (w: number, h: number) => (
    <HandPlan w={w} h={h} scene={scene} variant={variant} Drums={art.Instrument as never} things={things.filter((t) => scene !== 'kit' || t.scene === 'all')} box={H.plan.box} shortOf={shortOf} highlight={sel} onTap={onTap} accessibilityLabel={label} />
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
  const bandParams: DockParam[] = useMemo(() => [itemFader(bandItems, bandSel, pickBand)], [bandItems, bandSel]); // eslint-disable-line react-hooks/exhaustive-deps
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
    { k: 'FOR A MIC HERE', v: sel ? sel.tag : '—', flex: 1.4 },
    extra,
  ];
  const card = (it: SettingItem | undefined, prompt: string) =>
    it ? (
      <Card>
        <Point title={it.label.toUpperCase()}>{it.note}</Point>
      </Card>
    ) : (
      <Note>{prompt}</Note>
    );
  const bandSelItem = byId(bandSel);
  const wideSelItem = byId(wideSel);

  const steps: MikingStep[] = [
    {
      key: 'band',
      title: 'In the band',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render('kit', bandSel, pickBand, `${H.plan.label} ${bandSelItem ? `Highlighted: ${bandSelItem.label}.` : ''} A typical layout.`),
        badge: H.plan.badge,
        bezel: bezel(bandSelItem, { k: 'LOOKED AT', v: `${bandSeen.size} / ${bandItems.length}`, flex: 1 }),
        params: bandParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={H.plan.looking} prompt={H.plan.prompt} />
          {card(bandSelItem, H.plan.intro)}
        </>
      ),
    },
    {
      key: 'stage',
      title: 'Stage and studio',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: render(where, wideSel, pickWide, where === 'stage' ? `The band on a stage, from above, with the monitors and the audience side. ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}` : `The same drums in a studio room, from above: no monitors on the floor. ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}`),
        badge: where === 'stage' ? 'From above · monitors where a stage often puts them · audience side to the right' : 'From above · a typical studio room',
        bezel: bezel(wideSelItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
        params: wideParams,
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={where === 'stage' ? 'Plan · on a stage' : 'Plan · in a studio'} prompt="Switch STAGE / STUDIO, and tap what is new around the drums." />
          <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
          {card(wideSelItem, where === 'stage' ? 'A floor monitor in front of the player, facing them, and the audience and PA beyond. Tap them.' : 'No monitors on the floor. The room itself is part of the picture now.')}
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
            <Point title="ASK THE PLAYER FIRST">{H.before.ask}</Point>
            <Point title="WORK WITH THE DRUMS AS THEY ARE">{H.before.asIs}</Point>
          </Card>
          <Note tone="warn">Protect your hearing during loud strokes and soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens. It has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
