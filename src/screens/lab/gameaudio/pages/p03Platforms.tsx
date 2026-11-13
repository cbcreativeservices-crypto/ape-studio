/**
 * Page 3 — WHERE GAMES RUN (handoff lesson 2 and section 4).
 *
 * Three separate questions: the PLATFORM is where the game runs, DELIVERY is
 * how it reaches the player, OUTPUT is how the player hears it. The learner
 * opens platform cards (pages/data/gaPlatforms), picks a LISTENING setup
 * separately, and moves a resource BUDGET that belongs to neither: so the
 * page never teaches that every phone is weaker than every console.
 *
 * A card changes only what the learner READS. The one thing that changes the
 * scene is BUDGET: the model's voice limit, 8 or 16, a scenario setting of
 * this lab and not the limit of any real device (said once, in step 3).
 * Nothing plays on this page, so only the limit changes: step 3 says so and
 * points at the Budgets page, where the budget is filled.
 *
 * Which cards were opened and which setup was chosen are this page's own
 * state (the scene has no platform); the BUDGET goal is a model fact.
 *
 * WHAT EACH CONTROL CHANGES THAT THE LEARNER CAN READ (walk audit W1):
 *   PLATFORM   the CARD readout (the card's own name), the card in step 2,
 *              and, in the tray, the card's name and its ONE test (the card
 *              itself is far down the well while the tray is open: F24).
 *              The key counts the cards seen (never a second name: F18)
 *   LISTENING  the LISTEN readout, the setup card in step 2, the tray's own
 *              description, and the `output` strip under the picture (the
 *              setup seen from above; 'pick' draws NO SETUP IS CHOSEN YET:
 *              with no arg at all the strip would draw page 13's ears)
 *   BUDGET     the number after the slash in VOICES, the key (8 MAX /
 *              16 MAX), one MIX line in the log
 *   COMPACT / EXPANDED   the same as BUDGET, in one press
 * ■ STOP has nothing to stop here; its STOP ALL line (a GAME line) is shown
 * in this page's log so a press is never silent (F27).
 *
 * Common mistake taught against: treating a platform name as a fixed sound
 * quality or a fixed voice count.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import type { GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { ChABullets, ChACard, ChAEmpty, ChARow } from './chAViews';
import {
  GA_BUDGETS,
  GA_BUDGET_SHORT,
  GA_BUDGET_WORD,
  GA_LISTENING,
  GA_PLATFORMS,
  GA_PLATFORM_TEST_CHECK,
  gaBudgetAt,
  gaBudgetLane,
  gaBudgetOf,
  gaComparedCore,
  gaListening,
  gaPlatform,
  gaPlatformBlurb,
  gaSeenWord,
  type GaBudgetId,
  type GaListeningId,
  type GaPlatformId,
} from './data/gaPlatforms';
import { G03 } from './guides/p03';
import { useSince } from './shared';

const TERMS = gaTerms('Game engine', 'Controller speaker', 'Platform certification');

/** Set the scene's voice limit, once per real change (a drag calls this on
 *  every move; the log gets one BUDGET line per change, not one per pixel). */
function setBudget(id: GaBudgetId): void {
  if (gaGet().voiceLimit !== GA_BUDGETS[id]) gaDispatch({ type: 'voiceLimit', limit: GA_BUDGETS[id] });
}

// the lane's caption: at 320 wide "EXPANDED BUDGET · 16 VOICES AT MOST" was cut
// (bug test 2026-11-13, B-S2-06); the key above it already says BUDGET
const budgetText = (id: GaBudgetId): string => `${GA_BUDGET_WORD[id]} · ${GA_BUDGETS[id]} VOICES AT MOST`;

/** BUDGET: a slider with two positions. COMPACT is its left half, EXPANDED
 *  its right half. It is this page's teaching control: it moves by itself,
 *  whatever card is open. */
const budgetKey = (s: GaState): DockParam => {
  const now = gaBudgetOf(s.voiceLimit);
  return {
    kind: 'fader',
    id: 'budget',
    label: 'BUDGET',
    value: gaBudgetLane(s.voiceLimit),
    home: gaBudgetLane(GA_BUDGETS.expanded),
    onChange: (v) => setBudget(gaBudgetAt(v)),
    // a limit another page left behind is neither budget: say what it is
    format: (v) => (now === null && gaBudgetAt(v) === 'expanded' ? `${s.voiceLimit ? `${s.voiceLimit} VOICES AT MOST` : 'NO VOICE LIMIT'} · MOVE TO CHOOSE A BUDGET` : budgetText(gaBudgetAt(v))),
    // the key shows the limit itself: a value of 8 letters is cut in the dock
    formatShort: (v) => (now === null && gaBudgetAt(v) === 'expanded' ? 'OTHER' : GA_BUDGET_SHORT[gaBudgetAt(v)]),
    nudges: [
      { label: 'COMPACT', onPress: () => setBudget('compact'), a11y: 'Compact budget: 8 voices at most' },
      { label: 'EXPANDED', onPress: () => setBudget('expanded'), a11y: 'Expanded budget: 16 voices at most' },
    ],
  };
};

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [platform, setPlatform] = useState<GaPlatformId | null>(null);
  const [seen, setSeen] = useState<readonly GaPlatformId[]>([]);
  const [listening, setListening] = useState<GaListeningId | null>(null);
  const card = gaPlatform(platform);
  const setup = gaListening(listening);

  const goals = [
    { label: 'Open MOBILE, DESKTOP, CONSOLE and BROWSER', hit: gaComparedCore(seen) },
    { label: 'Choose a LISTENING setup', hit: listening !== null },
    { label: 'Change the BUDGET', hit: since(`limit:${GA_BUDGETS.compact}`) + since(`limit:${GA_BUDGETS.expanded}`) > 0 },
    { label: 'Pass both checks', hit: check && check2 },
  ];
  const latched = useVisitGoals(ctx, goals);

  const platformKey: DockParam = {
    kind: 'options',
    id: 'platform',
    label: 'PLATFORM',
    // a count, not a second name for the card (walk audit W1 F18)
    valueLabel: gaSeenWord(seen.length),
    valueA11y: card ? `${card.name} card; ${seen.length} cards seen on this visit` : 'no card chosen yet',
    // the chosen card's name and its ONE test stay in view in the tray
    options: GA_PLATFORMS.map((p) => ({ id: p.id, label: p.label, blurb: gaPlatformBlurb(p) })),
    selectedId: platform,
    onSelect: (id) => {
      const next = id as GaPlatformId;
      setPlatform(next);
      setSeen((was) => (was.includes(next) ? was : [...was, next]));
    },
    sticky: true,
  };
  const listeningKey: DockParam = {
    kind: 'options',
    id: 'listening',
    label: 'LISTENING',
    // the dock key is narrow: CHOSEN, and the LISTEN readout names the setup
    valueLabel: setup ? 'CHOSEN' : 'PICK',
    valueA11y: setup ? setup.label.toLowerCase() : 'no listening setup chosen yet',
    options: GA_LISTENING.map((l) => ({ id: l.id, label: l.label, blurb: l.blurb })),
    selectedId: listening,
    onSelect: (id) => setListening(id as GaListeningId),
    sticky: true,
  };

  return (
    <GaRack
      spec={{
        keys: [budgetKey(s), platformKey, listeningKey],
        initialParam: 'budget',
        hud: 'output',
        hudArg: listening ?? 'pick',
        readouts: [
          { k: 'CARD', v: card?.short ?? '—', vA11y: card ? `${card.name} card is open` : 'no card is open', flex: 1.3 },
          { k: 'LISTEN', v: setup?.short ?? '—', vA11y: setup ? `listening on ${setup.label.toLowerCase()}` : 'no listening setup chosen', flex: 1.3 },
        ],
      }}
    >
      <Step n={1}>
        <Look>The same courtyard and workshop. Here it stands for one small game that could run on many kinds of device.</Look>
        <P>Three questions are easy to confuse. The platform is where the game runs. Delivery is how the game reaches the player. Output is how the player hears it.</P>
        <P>These can be three different devices. A game can run on a remote computer, arrive as a stream, and be heard on earbuds connected to a phone. Many game engines build one game for several platforms. The sounds stay the same. The listening conditions change.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open PLATFORM and pick a card. The tray shows its one test; the whole card is here. Compare at least MOBILE, DESKTOP, CONSOLE and BROWSER.</Do>
        {card ? (
          <ChACard eyebrow="PLATFORM CARD" title={card.label} sub={card.name}>
            <ChARow label="AN EXAMPLE">{card.example}</ChARow>
            <ChARow label="AUDIO DECISIONS TO COMPARE">
              <ChABullets items={card.compare} />
            </ChARow>
            <ChARow label="WHAT STAYS THE SAME">{card.same}</ChARow>
            <ChARow label="WHAT COULD CHANGE">{card.change}</ChARow>
            <ChARow label="ONE TEST FOR THE AUDIO TEAM" tone="test">
              {card.test}
            </ChARow>
          </ChACard>
        ) : (
          <ChAEmpty>No card is open yet. The PLATFORM key is in the dock at the bottom.</ChAEmpty>
        )}
        <Do>Then open LISTENING and choose how the player hears the game. Any setup can go with any card.</Do>
        <P>The strip under the picture draws the setup you chose.</P>
        {setup ? (
          <ChACard eyebrow="LISTENING SETUP" title={setup.label}>
            <ChARow label="WHAT IT MEANS FOR THE SOUND">{setup.blurb}</ChARow>
          </ChACard>
        ) : null}
      </Step>
      <Step n={3}>
        <Do>Keep a card open and move BUDGET between COMPACT and EXPANDED. Watch the number after the slash in VOICES.</Do>
        <P>COMPACT lets 8 voices sound at the same time and EXPANDED lets 16. The card stays as it was: a platform’s name does not set a budget.</P>
        <Note>The two budgets are settings for this lab’s scene. They are not the limits of any real device.</Note>
        <Note tone="mistake">Treating a platform name as a fixed sound quality or a fixed number of voices. A mobile game can be a large one, and a console game can be a small one.</Note>
        <ActivityLog state={s} lines={4} only={['mix', 'trigger']} />
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="A game is installed on a handheld system. The player docks it to a TV and listens on a soundbar. Which line describes this correctly?"
          options={[
            'Platform: the handheld. Delivery: installed. Output: the soundbar',
            'It is a TV game, so the team only needs to test TV speakers',
            'It is a handheld, so it can use only a small, fixed number of voices',
            'Docking changes the platform, so the sounds have to change too',
          ]}
          correct={0}
          explain="Where the game runs, how it reaches the player and how the player hears it are three separate answers. Docking changed only the last one."
          wrong={[
            undefined,
            'The TV only shows the picture. The game runs on the handheld system, and this player hears a soundbar.',
            'A platform’s name does not fix a voice count. Devices of one kind differ widely.',
            'The game still runs on the same system. Ask which of the three answers the dock changed.',
          ]}
          onCorrect={() => setCheck(true)}
        />
        <UnderstandingCheck
          eyebrow=""
          question="Which test belongs to a browser game?"
          options={GA_PLATFORM_TEST_CHECK.options.map((o) => o.text)}
          correct={GA_PLATFORM_TEST_CHECK.options.findIndex((o) => o.of === GA_PLATFORM_TEST_CHECK.ask)}
          explain="Many browsers start sound only after the player acts, so a browser game is tested for what it does before the first tap."
          wrong={GA_PLATFORM_TEST_CHECK.options.map((o) => (o.of === GA_PLATFORM_TEST_CHECK.ask ? undefined : `That is the ${gaPlatform(o.of)?.label ?? ''} card’s test. Open the BROWSER card and compare.`))}
          onCorrect={() => setCheck2(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P03: PageDef = { title: 'Where games run', short: 'PLATFORMS', Component: Page, manualDone: true, rack: true, guide: G03 };
