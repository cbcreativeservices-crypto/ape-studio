/**
 * Page 21 — GAME AUDIO TODAY (chapter 6, "Into the real tools").
 *
 * A short reading page (the owner's plan: "Included, short, no statistics").
 * Five sections under plain headings: implementation knowledge beside sound
 * design; procedural and hybrid sound; spatial and acoustic tools; adaptive
 * music, profiling with the game team, accessibility; and where AI fits.
 *
 * WHAT IT DOES NOT SAY (plan section 8, handoff section 14): no statistics,
 * no survey numbers, no adoption claims, no product betas, no legal advice.
 * Capability is described, never how many studios use it. On AI it is short
 * and neutral: asset creation, authoring help and runtime generation are
 * three different things, and a team weighs control, repeatability, where
 * the material came from and cost at runtime for each.
 *
 * A DOCUMENT page: no scene, no rack; it opens on a clean scene
 * (`useGaCleanScene`), so no sound plays under it. Two checks; the page
 * counts once both are passed. The two tool names on it are glossary
 * terms of this page (MetaSounds, Steam Audio), given as examples of what a
 * tool can do.
 *
 * Common mistake taught against: taking procedural audio (synthesis and
 * rules a designer wrote) for generative AI.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { UnderstandingCheck } from '../../tuning/components/check';
import { useGaCleanScene } from '../GaLab';
import { P, Terms } from '../bits';
import { gaTerms } from '../gaTerms';
import { DocSection, useDocDone } from './cheKit';
import { G21 } from './guides/p21';

const TERMS = gaTerms('Technical sound designer', 'Procedural Audio', 'MetaSounds', 'Steam Audio');

function Page({ ctx }: { ctx: PageCtx }) {
  // a reading page has no ■ STOP key: nothing from the page before plays under it
  useGaCleanScene();
  const [passed, setPassed] = useState<readonly boolean[]>([false, false]);
  const pass = (i: number) => setPassed((was) => was.map((x, k) => x || k === i));
  useDocDone(ctx, passed.every(Boolean));

  return (
    <View style={styles.page}>
      <DocSection title="Two kinds of knowledge">
        <P>Making a good sound is one part of the work. The other part is implementation: deciding when the sound plays, what changes it and what it costs. A technical sound designer works on both sides. This lab was about the second part.</P>
        <Terms items={TERMS} />
      </DocSection>

      <DocSection title="Sound made by rules">
        <P>Procedural audio is made while the game runs, from synthesis and rules, so it can follow the game closely. A hybrid sound joins recordings with such rules. MetaSounds is a tool built for this kind of work.</P>
        <P>This lab’s generator is not procedural: it is a fixed loop whose pitch and level follow a speed value. A procedural generator would build the hum itself while the game runs.</P>
        <P>Procedural audio is not the same thing as generative AI. Its rules were written by a designer.</P>
      </DocSection>

      <DocSection title="Space and acoustics">
        <P>Spatial tools can place a sound around you on headphones, make it duller behind a wall, find its path around a corner and add the reflections of a room. Steam Audio is one such toolkit.</P>
        <P>What a tool can do and what a game uses are separate questions. Each team chooses what its game needs and what its platform can afford.</P>
      </DocSection>

      <DocSection title="Music, testing and access">
        <P>Adaptive music follows play with layers and with changes timed to the bar. Profiling is part of the routine: the audio team reads the log, finds the cause, and tries again with the rest of the game team.</P>
        <P>Accessibility is part of the design: separate volume controls, text for speech, and a visual cue for a sound that carries a warning.</P>
      </DocSection>

      <DocSection title="Where AI fits">
        <P>Three different things share this name. AI can help create a sound before the game is released. It can help with authoring, such as naming and sorting files. Or it can generate sound while the game runs.</P>
        <P>For each one, a team asks four questions. How much control does it keep? Does the result repeat when it needs to? Where did the material come from? What does it cost while the game runs?</P>
      </DocSection>

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 1"
        question="A team wants a wind sound that follows the game’s weather value smoothly, with rules the team writes and no AI service. Which approach fits?"
        options={['Procedural audio: synthesis and rules a designer wrote', 'Generative AI while the game runs', 'A sound bank', 'A musical stinger']}
        correct={0}
        explain="The team writes the rules, and synthesis follows the weather value while the game runs. That is procedural audio, and it uses no AI."
        wrong={[
          undefined,
          'The team asked for its own rules and no AI service.',
          'A sound bank delivers sounds to the game. It does not make a sound follow a value.',
          'A stinger is a short burst of music that marks a moment. It does not follow the weather.',
        ]}
        onCorrect={() => pass(0)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 2"
        question="Before a game is released, an AI tool names and sorts ten thousand sound files for the audio team. Which use of AI is this?"
        options={['Help with authoring', 'Generating sound while the game runs', 'Procedural audio', 'Adaptive music']}
        correct={0}
        explain="Naming and sorting files is authoring work. It happens before release and makes no sound, so nothing new runs inside the game."
        wrong={[
          undefined,
          'This work is finished before release. Nothing is generated while the game runs.',
          'Procedural audio makes a sound from rules while the game runs. This tool makes no sound.',
          'Adaptive music is music that changes as you play. This is work on files.',
        ]}
        onCorrect={() => pass(1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12 },
});

export const P21: PageDef = { title: 'Game audio today', short: 'TODAY', Component: Page, manualDone: true, guide: G21 };
