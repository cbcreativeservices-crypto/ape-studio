/**
 * Page 20 — FINDING YOUR WAY IN THE TOOLS (chapter 6, "Into the real tools").
 *
 * The owner's goal for the whole lab is delivered here: "ready for the real
 * tools generally - not specifically … recognize and orient themselves
 * quickly". Two lookup aids, both read-only, and four checks that use them:
 *
 *   A  the usual windows   eight KINDS of window almost every game audio
 *                          tool has, what you do in each, and the lab page
 *                          where the idea was taught (by its title); then
 *                          what a game engine's editor shows first
 *   B  the names           for twelve core ideas, the CLOSEST name in Wwise,
 *                          FMOD Studio, Unity and Unreal Engine
 *
 * A DOCUMENT page: no scene, no rack, so the shell gives it its own scroll.
 * It opens on a clean scene (`useGaCleanScene`): a reading page has no
 * ■ STOP key, so nothing from the page before may play under it. It reads
 * the lab state only to say how long the student's own log is.
 *
 * It counts once all four checks are passed (there are no practice goals).
 *
 * ACCURACY. Every tool name on this page comes from data/gaToolMap, whose
 * cells were checked against each vendor's current documentation and are
 * recorded in docs/labs/gameaudio/SOURCES_TOOLS.md (internal; never shown).
 * The page says ONCE that the names are the closest idea, not an exact
 * equal, and that middleware is not required to make a game.
 *
 * Common mistake taught against: looking for the same NAME in a new tool,
 * when it is the same IDEA under another name.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { UnderstandingCheck } from '../../tuning/components/check';
import { useGaCleanScene } from '../GaLab';
import { Note, P, Terms } from '../bits';
import { gaTerms } from '../gaTerms';
import { useGa } from '../model/gaStore';
import { DocSection, useDocDone } from './cheKit';
import { ToolNameCards, ToolWindowList, ToolWindowsFigure } from './cheToolMap';
import { G20 } from './guides/p20';

const TERMS = gaTerms('Audio Middleware', 'Game engine', 'Wwise', 'FMOD', 'Unity (game engine)', 'Unreal Engine');
const CHECKS = 4;

function Page({ ctx }: { ctx: PageCtx }) {
  useGaCleanScene();
  const s = useGa();
  const [passed, setPassed] = useState<readonly boolean[]>(() => Array.from({ length: CHECKS }, () => false));
  const pass = (i: number) => setPassed((was) => was.map((x, k) => x || k === i));
  useDocDone(ctx, passed.every(Boolean));
  const logLines = s.logN;

  return (
    <View style={styles.page}>
      <DocSection title="Before you open a real tool">
        <P>You know the ideas now. A real tool arranges the same ideas in windows, and gives each idea a name of its own. On a first visit, look for the kinds of window first. Then look up the names.</P>
        <P>Audio middleware is a separate audio tool that works between the sounds and the game engine. It is not required to make a game. A game engine has audio of its own, and a game can be released with only that.</P>
        <Terms items={TERMS} />
      </DocSection>

      <DocSection title="The usual windows">
        <P>This picture is simplified. It is not one real product. Most game audio tools have these eight kinds of window, in different places and under different names.</P>
        <ToolWindowsFigure />
        <ToolWindowList />
        <Note>{logLines > 0 ? `The activity log you read in this lab is a small profiler. It has printed ${logLines} ${logLines === 1 ? 'line' : 'lines'} for you so far.` : 'The activity log you read in this lab is a small profiler.'}</Note>
        <P>A game engine opens differently. You see the level, a list of its objects, and a properties panel for the selected object. A sound source and the listener are parts you add to an object there.</P>
      </DocSection>

      <DocSection title="What each idea is called">
        <P>These tools do not organize the ideas in the same way. Each name below is the closest idea in that tool, not an exact equal. A dash means the tool has no close idea of its own.</P>
        <P>Wwise and FMOD are middleware. Unity and Unreal Engine are game engines, and their lines here are the engine’s own audio. Names also change from one version to the next, so check the tool’s manual.</P>
        <P>This lab uses the word trigger for anything that starts a sound. In Wwise, the word Trigger means one thing only: the Game Sync that starts a music stinger.</P>
        <Note tone="mistake">Looking for the same name in a new tool. Look for the same idea: a surface choice is a Switch in one tool and a labeled parameter in another.</Note>
        <ToolNameCards />
      </DocSection>

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 1"
        question="You open a game audio tool you have not used before. You want all the sound effects in the game to be a little quieter. Which kind of window do you look for?"
        options={[
          'The mixer, to find the bus the effects feed',
          'The list of sound files, to edit each effect file',
          'The profiler, to watch the effects play',
          'The event list, to post each event again',
        ]}
        correct={0}
        explain="A bus is a group channel. One control on the bus that the effects feed changes all of them together, in any tool."
        wrong={[
          undefined,
          'That changes one file at a time.',
          'A profiler shows what happened and what it cost. It does not set a level.',
          'Posting an event again starts its sound again. It does not change how loud the sound is.',
        ]}
        onCorrect={() => pass(0)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 2"
        question="A sound never starts. Which window shows whether the game asked for it?"
        options={['The profiler, or activity log', 'The mixer', 'The music editor', 'The list of sound files']}
        correct={0}
        explain="The profiler records each request from the running game and what the audio side did with it. If the request is not there, the game did not ask."
        wrong={[
          undefined,
          'The mixer sets levels and routing. It keeps no record of what the game asked for.',
          'The music editor arranges music. It keeps no record of the game’s requests.',
          'The list shows which files are in the project. A file can be there and still not be asked for.',
        ]}
        onCorrect={() => pass(1)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 3"
        question="Footsteps need a different sound on gravel. Which window holds that choice?"
        options={['Game information, where the surface switch is defined', 'The mixer', 'The profiler', 'A way to audition']}
        correct={0}
        explain="The surface is a switch: one choice from a list, kept for each character. It is defined with the other game information, and the footstep sound follows it."
        wrong={[
          undefined,
          'A bus changes how loud a group is. It does not choose which sound plays.',
          'The profiler shows which surface was used. It does not hold the choice.',
          'Auditioning lets you try each surface by hand. The choice is defined in another window.',
        ]}
        onCorrect={() => pass(2)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 4"
        question="In another tool you cannot find the word Switch. What do you look for?"
        options={[
          'The same idea under another name: one choice from a list, kept for each object',
          'A different tool, because this one cannot do it',
          'A sound file with the word Switch in its name',
          'A bus for each surface',
        ]}
        correct={0}
        explain="Names differ between tools and the idea stays the same. In one tool this idea is called a labeled parameter."
        wrong={[
          undefined,
          'Most tools have the idea. Read the cards above again and compare the four lines of one idea.',
          'A file name is only a label on one sound. It makes no choice.',
          'A bus groups sounds for the mix. It does not pick one sound from a list.',
        ]}
        onCorrect={() => pass(3)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12 },
});

export const P20: PageDef = { title: 'Finding your way in the tools', short: 'TOOLS', Component: Page, manualDone: true, guide: G20 };
