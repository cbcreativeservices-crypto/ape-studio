/**
 * Page 3 — THE SETTING, for the woodwind family (LESSON_JOURNEY §6 stage 3,
 * §8). The family's own page (LessonArt.pages.setting): the shared page's
 * hearing words are a drummer's ("repeated hits"); a woodwind's are its own
 * (a piccolo by the player's ear, a section of loud brass behind).
 *
 *   IN THE SECTION (rack)    the woodwinds from above (WindPlan): the
 *                            lesson's own player lit, its neighbours as
 *                            real drawings; tap an item (or step ITEM) to
 *                            read what it means for a mic here.
 *   STAGE AND STUDIO (rack)  the same plan on a STAGE (the lesson's two
 *                            wedges — the ones the Studio-or-live page uses
 *                            later — the PA and the audience) or in a
 *                            STUDIO (the main pair, the room).
 *   BEFORE ANY MIC (read)    ask the player first; protect the instrument;
 *                            protect your hearing; then the three checks.
 * Credit: the three checks.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SettingItem } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';

export type WindSettingConfig = {
  /** BEFORE ANY MIC: ask the player, protect the instrument (title + text each). */
  before: readonly { title: string; text: string }[];
  /** The hearing note for this instrument (plain advice, never a source). */
  hearing: string;
  sectionLanding: string;
  sectionIdle: string;
  stageIdle: string;
  studioIdle: string;
  a11y: { section: string; stage: string; studio: string };
};

export function makeWindSettingPage(cfg: WindSettingConfig): (p: PageProps) => ReactNode {
  return function WindSetting({ lesson, art, answers, onAnswered, variant }: PageProps) {
    const items = lesson.setting.items;
    const kitItems = items.filter((i) => i.scene === 'all' || i.scene === 'kit');
    const [kitSel, setKitSel] = useState<string | null>(null);
    const [kitSeen, setKitSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [where, setWhere] = useState<'stage' | 'studio'>('stage');
    const [wideSel, setWideSel] = useState<string | null>(null);
    const wideItems = items.filter((i) => i.scene === where || i.scene === 'all');
    const byId = (id: string | null): SettingItem | undefined => items.find((i) => i.id === id);
    const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
    const Own = art.SettingPlan!;

    const pickKit = (id: string) => {
      if (!kitItems.some((i) => i.id === id)) return;
      setKitSel(id);
      setKitSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    };
    const pickWide = (id: string) => {
      if (wideItems.some((i) => i.id === id)) setWideSel(id);
    };
    const render = (scene: 'kit' | 'stage' | 'studio', sel: string | null, onTap: (id: string) => void, label: string) => (w: number, h: number) => (
      <Own w={w} h={h} scene={scene} variant={variant} items={items} wedges={lesson.live.wedges} highlight={sel} onTap={onTap} accessibilityLabel={label} />
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
        title: 'In the section',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: render('kit', kitSel, pickKit, `${cfg.a11y.section} ${kitSelItem ? `Highlighted: ${kitSelItem.label}.` : ''} A typical layout.`),
          badge: 'The woodwinds from above · a typical layout · the conductor and the audience below',
          bezel: bezel(kitSelItem, { k: 'LOOKED AT', v: `${kitSeen.size} / ${kitItems.length}`, flex: 1 }),
          params: kitParams,
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={`Plan · the woodwind section from above · the ${lesson.noun.one} ringed in amber`} prompt={cfg.sectionLanding} />
            {card(kitSelItem, cfg.sectionIdle)}
          </>
        ),
      },
      {
        key: 'stage',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: render(where, wideSel, pickWide, `${where === 'stage' ? cfg.a11y.stage : cfg.a11y.studio} ${wideSelItem ? `Highlighted: ${wideSelItem.label}.` : ''}`),
          badge: where === 'stage' ? 'From above · two wedges where a stage often puts them · the audience below' : 'From above · a studio room · a main pair above the conductor',
          bezel: bezel(wideSelItem, { k: 'WHERE', v: where === 'stage' ? 'LIVE' : 'STUDIO', flex: 1 }),
          params: wideParams,
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={where === 'stage' ? `Plan · the ${lesson.noun.one} on a stage` : `Plan · the ${lesson.noun.one} in a studio`} prompt="Switch STAGE / STUDIO, and tap what is new around the section." />
            <Body>{where === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
            {card(wideSelItem, where === 'stage' ? cfg.stageIdle : cfg.studioIdle)}
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
              {cfg.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{cfg.hearing}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}
