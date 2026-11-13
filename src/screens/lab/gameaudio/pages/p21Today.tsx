/**
 * Page 21 — GAME AUDIO TODAY (group E, pages 20 to 22: see pages/index.ts).
 *
 * A short reading page (the owner's plan: "Included, short, no statistics").
 * Five sections under plain headings: implementation knowledge beside sound
 * design; procedural and hybrid sound; spatial and acoustic tools; adaptive
 * music, profiling with the game team, accessibility; and where AI fits.
 *
 * WHAT IT DOES NOT SAY (plan section 8, handoff section 14): no statistics,
 * no survey numbers, no adoption claims, no product betas, no legal advice,
 * nothing dated. Capability is described, never how many studios use it. On
 * AI it is short and neutral: asset creation, authoring help and runtime
 * generation are three different things, and a team weighs control,
 * repeatability, where the material came from and cost at runtime for each.
 * It names one ROLE (technical sound designer) and promises no career: if a
 * later edit says what a job needs, the required education must be said
 * honestly with it (house rule).
 *
 * WHAT THE LAB IS NOT. Nothing in this lab is procedural: every sound is a
 * file made ahead of time, and the generator is a fixed loop whose pitch and
 * level follow a speed value. The page says so in those words (the first
 * review corrected a claim that the generator is procedural: never bring it
 * back).
 *
 * LENGTH (audit 2, L-06): the prose was 322 words against a plan of 150 to
 * 260. The cuts are the sentences that restated pages 14 and 19.
 *
 * ON THE RACK (audit 2, W2-18, lead's decision 1). A TOPIC key sets the
 * scene up to SHOW what this lab really has of each section, with the strip
 * that shows it (P21_TOPICS below):
 *   RULES   the generator running: SPEED moves its pitch and level (the
 *           MIX strip's EFFECTS bar follows). It is a fixed loop, and the
 *           page says so
 *   SPACE   the generator behind the closed door: the WALL strip
 *   MUSIC   the music running, ALERT waiting for the bar: the MUSIC strip
 *   ACCESS  the alarm with its visual cue, the guide's line with its caption:
 *           the LINES strip
 *   TEST    a budget of 8 voices and a burst of 12 crates: the VOICES strip,
 *           and the log as a profiler
 *   AI      NOTHING: the lab has no AI, and the page says so. No demo.
 * The next key is that topic's one action (or none, for AI).
 *
 * SPEED (bug test GA2 B-01, 2026-11-13: the page opened on a SPEED slider
 * that moved only its own number, on no topic, AI, MUSIC and ACCESS). The
 * page now opens on TOPIC, with no slider. SPEED is in the dock only on the
 * topics where the generator runs (RULES, SPACE, TEST: P21_SPEED_TOPICS),
 * where it closes up the generator's rings in the picture (and on RULES
 * moves the EFFECTS bar); with the generator stopped it is LOCKED and says
 * why. Two checks; the page counts once both are passed. The two tool names on it are glossary
 * terms of this page (MetaSounds, Steam Audio), given as examples of what a
 * tool can do. In each check every option is a real approach or a real use
 * (audit 2, L-20: "a sound bank" and "a musical stinger" were not ways to
 * make wind), and the correct option is never the longest (L-16).
 *
 * Common mistake taught against: taking procedural audio (synthesis and
 * rules a designer wrote) for generative AI.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Caption, Note, P, Terms } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import type { GaHudId } from '../scene/hud';
import { DocSection, useDocDone } from './cheKit';
import { G21 } from './guides/p21';
import { doorKey, machineKey, speedKey } from './shared';

const TERMS = gaTerms('Technical sound designer', 'Procedural Audio', 'MetaSounds', 'Steam Audio');

const ASSETS: readonly string[] = ['door', 'door_close', 'door_rattle', 'gen_hum', 'gen_air', 'fountain', 'amb_room', 'amb_yard', 'bird_1', 'bird_2', 'bird_3', 'impact', 'debris', 'alarm', 'vo_greeting', 'mu_calm', 'mu_pulse', 'mu_drive', 'ir_room'];

export type P21Topic = 'rules' | 'space' | 'music' | 'access' | 'test' | 'ai';

/** Each topic: its key label, the strip that shows it, the scene it sets
 *  up (from a clean scene) and the one sentence that says what is on the
 *  glass now. Nothing here claims the lab does what it does not: every
 *  sound is a file made ahead of time, and the lab has no AI. */
export const P21_TOPICS: readonly { id: P21Topic; label: string; hud: GaHudId; setUp: () => void; says: string }[] = [
  {
    id: 'rules',
    label: 'RULES',
    hud: 'mix',
    setUp: () => gaDispatch({ type: 'machine', id: 'generator-1', on: true }),
    says: 'The generator runs. Move SPEED: its pitch and level follow, and the EFFECTS bar shows the level. It is a fixed loop.',
  },
  {
    id: 'space',
    label: 'SPACE',
    hud: 'wall',
    setUp: () => gaDispatch({ type: 'machine', id: 'generator-1', on: true }),
    says: 'The generator runs behind the closed door. The strip shows the wall’s level change and filter. OPEN DOOR compares.',
  },
  {
    id: 'music',
    label: 'MUSIC',
    hud: 'music',
    setUp: () => {
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'mood', mood: 'alert' });
    },
    says: 'The music runs, and ALERT waits for the next bar. The strip shows the bars and the waiting change.',
  },
  {
    id: 'access',
    label: 'ACCESS',
    hud: 'lines',
    setUp: () => {
      gaDispatch({ type: 'option', patch: { visualCue: true } });
      gaDispatch({ type: 'alarm', on: true });
      gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' });
    },
    says: 'The alarm runs with its sign in the picture. GUIDE LINE makes the guide speak, with a caption and its line on the strip.',
  },
  {
    id: 'test',
    label: 'TEST',
    hud: 'voices',
    setUp: () => {
      gaDispatch({ type: 'scene', on: true });
      gaDispatch({ type: 'machine', id: 'generator-1', on: true });
      gaDispatch({ type: 'voiceLimit', limit: 8 });
      gaDispatch({ type: 'burst', count: 12 });
    },
    says: 'A budget of eight voices. Press BURST: twelve crates arrive, and the strip marks each voice STOLEN. The log is your profiler.',
  },
  {
    id: 'ai',
    label: 'AI',
    hud: 'mix',
    setUp: () => {},
    says: 'This lab uses no AI, so there is nothing to show: the scene stays quiet. Every sound here is a file made ahead of time.',
  },
];

/** The topics where the generator runs, so SPEED changes what is seen
 *  (GA2 B-01). Every other topic has no slider. */
export const P21_SPEED_TOPICS: readonly P21Topic[] = ['rules', 'space', 'test'];

/** The SPEED key on this topic: absent where the generator does not run;
 *  locked, with the reason, while it is stopped (RULES can stop it). */
export function p21SpeedKey(topic: P21Topic | null, s: ReturnType<typeof gaGet>): DockParam | null {
  if (!topic || !P21_SPEED_TOPICS.includes(topic)) return null;
  const key = speedKey(s);
  const running = !!s.machines.find((m) => m.id === 'generator-1')?.on;
  return running || key.kind !== 'fader' ? key : { ...key, locked: p21SpeedOff(topic) };
}

/** Why SPEED is locked: only RULES has a GEN 1 key; on SPACE and TEST the
 *  generator stops only with ■ STOP, and choosing the topic again runs it. */
export const p21SpeedOff = (topic: P21Topic): string =>
  topic === 'rules' ? 'GEN 1 is off: switch it on, and SPEED moves its rings and its level' : 'Generator 1 was stopped: choose this TOPIC again to run it, and SPEED moves it';

/** The topic's one action key, or none (AI: nothing to run). */
function topicAction(topic: P21Topic | null, s: ReturnType<typeof gaGet>): DockParam | null {
  if (topic === 'rules') return machineKey(s);
  if (topic === 'space') return doorKey(s);
  if (topic === 'music') return { kind: 'action', id: 'mood', label: s.mood === 'alert' ? 'CALM' : 'ALERT', onPress: () => gaDispatch({ type: 'mood', mood: gaGet().mood === 'alert' ? 'calm' : 'alert' }), tint: colors.amber };
  if (topic === 'access') return { kind: 'action', id: 'line', label: 'GUIDE LINE', onPress: () => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' }), tint: colors.amber };
  if (topic === 'test') return { kind: 'action', id: 'burst', label: 'BURST', onPress: () => gaDispatch({ type: 'burst', count: 12 }), tint: colors.amber };
  return null;
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const [topic, setTopic] = useState<P21Topic | null>(null);
  const [passed, setPassed] = useState<readonly boolean[]>([false, false]);
  const pass = (i: number) => setPassed((was) => was.map((x, k) => x || k === i));
  useDocDone(ctx, passed.every(Boolean));

  const t = P21_TOPICS.find((x) => x.id === topic) ?? null;
  const choose = (id: P21Topic) => {
    // every topic starts from the clean scene, so one never shows another's sounds
    gaDispatch({ type: 'stopAll' });
    gaDispatch({ type: 'enterPage' });
    P21_TOPICS.find((x) => x.id === id)!.setUp();
    setTopic(id);
  };
  const topicKey: DockParam = {
    kind: 'options',
    id: 'topic',
    label: 'TOPIC',
    valueLabel: t ? t.label : 'CHOOSE',
    valueA11y: t ? t.label.toLowerCase() : 'not chosen yet',
    options: P21_TOPICS.map((x) => ({ id: x.id, label: x.label })),
    selectedId: topic,
    onSelect: (id) => choose(id as P21Topic),
  };
  const action = topicAction(topic, s);
  const speed = p21SpeedKey(topic, s);

  return (
    <GaRack
      spec={{
        // the page opens on TOPIC: no slider until a topic gives it something to move
        keys: [topicKey, ...(action ? [action] : []), ...(speed ? [speed] : [])],
        initialParam: 'speed-generator-1',
        assets: ASSETS,
        hud: t ? t.hud : 'mix',
      }}
    >
    <View style={styles.page}>
      {/* with the generator stopped, the topic's sentence would claim it runs */}
      <Note>{!t ? 'Choose a TOPIC under the picture. The scene then shows what this lab really has of it.' : speed?.kind === 'fader' && speed.locked ? `${speed.locked}.` : t.says}</Note>
      <Caption state={s} />
      {topic === 'test' ? <ActivityLog state={s} lines={5} only={['stop', 'refused']} /> : null}

      <DocSection title="Two kinds of knowledge">
        <P>Making a good sound is one part of the work. Implementation is the other: deciding when the sound plays, what changes it and what it costs. A technical sound designer works on both.</P>
        <Terms items={TERMS} />
      </DocSection>

      <DocSection title="Sound made by rules · TOPIC RULES">
        <P>Procedural audio is made while the game runs, from synthesis and rules, so it can follow the game. MetaSounds is a tool built for this work.</P>
        <P>Nothing in this lab is procedural: every sound is a file made ahead of time. The generator is a fixed loop; SPEED moves its pitch and level.</P>
        <P>Procedural audio is not generative AI. A designer wrote its rules.</P>
      </DocSection>

      <DocSection title="Space and acoustics · TOPIC SPACE">
        <P>Spatial tools place a sound around you on headphones and make it duller behind a wall. Some find its path around a corner and add a room’s reflections. Steam Audio is one.</P>
      </DocSection>

      <DocSection title="Music, testing and access · TOPICS MUSIC, TEST, ACCESS">
        <P>Adaptive music and profiling are everyday work. So is accessibility: separate volume controls, text for speech, and a visual cue for a warning sound.</P>
      </DocSection>

      <DocSection title="Where AI fits · TOPIC AI">
        <P>Three different things are called AI in game audio. AI can help create a sound before release. It can help with authoring, such as naming and sorting files. Or it can generate sound while the game runs.</P>
        <P>For each one, a team asks four questions. How much control does it keep? Does the result repeat when needed? Where did the material come from? What does it cost while the game runs?</P>
      </DocSection>

      <Note>The two checks below complete this page.</Note>

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 1"
        question="A team wants a wind sound that follows the game’s weather value smoothly. They want to write its behavior themselves and use no AI service. Which approach fits?"
        options={['Procedural audio', 'Generative AI that makes the wind while the game runs', 'One long wind recording with a volume control', 'An AI tool that sorts the wind files before release']}
        correct={0}
        explain="The team writes the rules, and synthesis follows the weather value while the game runs. That is procedural audio, and it uses no AI."
        wrong={[
          undefined,
          'The team asked for its own rules and no AI service.',
          'A fixed recording can get louder or quieter. It cannot change its character with the weather.',
          'That is help with authoring. It makes no sound.',
        ]}
        onCorrect={() => pass(0)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 2"
        question="Before a game is released, an AI tool names and sorts ten thousand sound files for the audio team. Which use of AI is this?"
        options={['Help with authoring', 'Generating sound while the game runs', 'Creating a sound before release', 'None: sorting files is not a use of AI']}
        correct={0}
        explain="Naming and sorting files is authoring work. It happens before release and makes no sound, so nothing new runs inside the game."
        wrong={[
          undefined,
          'This work is finished before release. Nothing is generated while the game runs.',
          'The tool makes no sound. It names and sorts sounds that exist.',
          'It is a use of AI: the tool does part of the authoring work.',
        ]}
        onCorrect={() => pass(1)}
      />
    </View>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12 },
});

export const P21: PageDef = { title: 'Game audio today', short: 'TODAY', Component: Page, manualDone: true, rack: true, guide: G21 };
