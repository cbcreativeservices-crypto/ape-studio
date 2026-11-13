/**
 * Page 20 — FINDING YOUR WAY IN THE TOOLS (group E, pages 20 to 22: see
 * pages/index.ts).
 *
 * The owner's goal for the whole lab is delivered here: "ready for the real
 * tools generally - not specifically … recognize and orient themselves
 * quickly" in Unreal Engine, Unity, FMOD Studio and Wwise. Two lookup aids,
 * both read-only, and six checks that use them:
 *
 *   A  the usual windows   eight KINDS of window almost every game audio
 *                          tool has, what you do in each, and the lab page
 *                          where the idea was taught (by its title); then
 *                          what a game engine's editor shows first
 *   B  the names           for twelve core ideas, the CLOSEST name in Wwise,
 *                          FMOD Studio, Unity and Unreal Engine; where a tool
 *                          has a dash, what to look for in it instead
 *
 * THE CHECKS NEED THE NAMES (audit 2, 2026-11-12: learning L-05, accuracy
 * B10). Recognizing a tool's own name is the outcome, so five of the six
 * checks cannot be answered without reading a name card: one for each of
 * the four tools, and one that goes from a Wwise name to its kind of
 * window. Every name in a check is a cell of data/gaToolMap (the test holds
 * that), and the correct option is never the longest one (L-16).
 *
 * ON THE RACK (audit 2, W2-18, lead's decision 1). The glass is the
 * tool-window figure made operable: `GaToolsStage` (scene/hud/cToolsStage),
 * one simplified tool screen whose eight windows are alive from the scene's
 * state. The dock, from left to right:
 *   WINDOW  a slider over 0 … 8: 0 lights none (ALL), 1 … 8 light that
 *           window, so dragging it walks round the screen
 *   TOOL    a tray: ANY TOOL, WWISE, FMOD STUDIO, UNITY, UNREAL ENGINE. The
 *           windows then print that tool's names (data/gaToolMap)
 *   SCENE   a tray of the sounds that make the windows move: the door, the
 *           generator, a step, the music, the guide's line
 *   SPEED   the generator's speed, which GAME INFO shows as a value
 * and SOUND and ■ STOP. Nothing on the glass is a control.
 * GaRack opens the page on a clean scene, as every rack page.
 *
 * It counts once all six checks are passed (there are no practice goals),
 * and the page says so before the first check (audit 2, W2-28).
 *
 * ACCURACY. Every tool name on this page comes from data/gaToolMap, whose
 * cells were checked against each vendor's current documentation and are
 * recorded in docs/labs/gameaudio/SOURCES_TOOLS.md (internal; never shown).
 * The page says ONCE that the names are the closest idea, not an exact
 * equal, that middleware is not required to make a game, that Unreal Engine
 * has two sound-building systems, and what Wwise means by Game Syncs and by
 * Trigger (the same words as page 8 and the glossary chip: decision 3).
 *
 * Common mistake taught against: looking for the same NAME in a new tool,
 * when it is the same IDEA under another name.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { Note, P, Terms } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { GaToolsStage } from '../scene/hud/hudC';
import { Tray, TrayChip, TrayGrid, onOff } from './chdKit';
import { DocSection, useDocDone } from './cheKit';
import { ToolNameCards, ToolWindowList } from './cheToolMap';
import { GA_TOOLS, GA_TOOL_WINDOWS, type GaToolId } from './data/gaToolMap';
import { G20 } from './guides/p20';
import { speedKey } from './shared';

const TERMS = gaTerms('Audio Middleware', 'Game engine', 'Wwise', 'FMOD', 'Unity (game engine)', 'Unreal Engine');
/** How many checks the page has. GameAudioLabScreen's end-screen line for
 *  this page says the same number in words (the test holds both). */
export const P20_CHECKS = 6;

const ASSETS: readonly string[] = ['door', 'door_close', 'door_rattle', 'gen_hum', 'gen_air', 'fs_stone_1', 'fs_stone_2', 'fs_stone_3', 'fs_stone_4', 'mu_calm', 'mu_pulse', 'mu_drive', 'vo_greeting'];

/** The TOOL key's short value (a dock key holds about six letters). */
const TOOL_SHORT: Record<GaToolId, string> = { wwise: 'WWISE', fmod: 'FMOD', unity: 'UNITY', unreal: 'UNREAL' };

/** WINDOW: a slider over the eight windows. 0 = none lit (ALL). */
const windowKey = (win: number, setWin: (n: number) => void): DockParam => {
  const name = (n: number) => GA_TOOL_WINDOWS.find((w) => w.n === n)?.tag ?? '';
  const at = (v: number) => Math.max(0, Math.min(8, Math.round(v * 8)));
  return {
    kind: 'fader',
    id: 'window',
    label: 'WINDOW',
    value: win / 8,
    home: 0,
    onChange: (v) => setWin(at(v)),
    format: (v) => (at(v) === 0 ? 'WINDOW · ALL EIGHT' : `WINDOW ${at(v)} · ${name(at(v))}`),
    formatShort: (v) => (at(v) === 0 ? 'ALL' : String(at(v))),
  };
};

/** The sounds that make the windows move. Each chip says its state in words. */
function SceneTray() {
  const s = useGa();
  const genOn = !!s.machines[0]?.on;
  return (
    <Tray>
      <TrayGrid head="SCENE · THE WINDOWS FOLLOW WHAT PLAYS" cols={3}>
        <TrayChip label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'} onPress={() => gaDispatch({ type: 'door' })} />
        <TrayChip label={onOff('GENERATOR 1', genOn)} selected={genOn} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gaGet().machines[0]?.on })} />
        <TrayChip label="STEP" onPress={() => gaDispatch({ type: 'step', who: 'player' })} />
        <TrayChip label={onOff('MUSIC', s.music.on)} selected={s.music.on} onPress={() => gaDispatch({ type: gaGet().music.on ? 'musicStop' : 'musicStart' })} />
        <TrayChip label={gaPlaying(s, 'vo_greeting') ? 'GUIDE LINE · SPEAKING' : 'GUIDE LINE'} selected={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
      </TrayGrid>
    </Tray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const [win, setWin] = useState(0);
  const [tool, setTool] = useState<GaToolId | null>(null);
  const [passed, setPassed] = useState<readonly boolean[]>(() => Array.from({ length: P20_CHECKS }, () => false));
  const pass = (i: number) => setPassed((was) => was.map((x, k) => x || k === i));
  useDocDone(ctx, passed.every(Boolean));

  const toolKey: DockParam = {
    kind: 'options',
    id: 'tool',
    label: 'TOOL',
    valueLabel: tool ? TOOL_SHORT[tool] : 'ANY',
    valueA11y: tool ? (GA_TOOLS.find((t) => t.id === tool)?.spoken ?? '') : 'any tool',
    options: [{ id: 'any', label: 'ANY TOOL', blurb: 'The windows print this lab’s own words for each idea.' }, ...GA_TOOLS.map((t) => ({ id: t.id, label: t.label, blurb: `The windows print the closest name ${t.spoken} gives each idea. A dashed ring means it has no single name.` }))],
    selectedId: tool ?? 'any',
    onSelect: (id) => setTool(id === 'any' ? null : (id as GaToolId)),
    sticky: true,
  };
  const sceneKey: DockParam = { kind: 'group', id: 'scene', label: 'SCENE', valueLabel: s.inst.length ? 'LIVE' : 'QUIET', valueA11y: `${s.inst.length} playing`, render: () => <SceneTray /> };

  return (
    <GaRack
      spec={{
        keys: [windowKey(win, setWin), toolKey, sceneKey, speedKey(s)],
        initialParam: 'window',
        assets: ASSETS,
        glass: (w, h) => <GaToolsStage w={w} h={h} tool={tool} win={win} state={s} />,
      }}
    >
    <View style={styles.page}>
      <DocSection title="Before you open a real tool">
        <P>A real tool arranges the ideas you know in windows and gives each a name of its own. Look for the kinds of window first, then the names.</P>
        <P>Audio middleware is an audio tool between the sounds and the game engine. A game does not need it: an engine has audio of its own.</P>
        <Terms items={TERMS} />
      </DocSection>

      <DocSection title="The usual windows">
        <P>The picture is one simplified tool screen, not a real product. Most tools have these eight kinds of window, under other names.</P>
        <P>Slide WINDOW to light each window in turn. Choose a TOOL to see that tool’s names. In SCENE, start a sound: the windows show it.</P>
        <ToolWindowList />
        <P>A game engine’s editor shows the level, its objects and a properties panel. A sound source and the listener are parts you add to an object.</P>
      </DocSection>

      <DocSection title="What each idea is called">
        <P>Each name is the closest idea in that tool, not an exact equal. A dash means no close idea of its own: the line beside it says what to look for instead.</P>
        <P>For Unity and Unreal Engine, a card gives the engine’s own audio. Names change between versions.</P>
        <P>Unreal Engine builds a sound in two ways: the older Sound Cue and the newer MetaSound. A card names the closer one.</P>
        <P>In Wwise, Game Syncs are Switches, States, Game Parameters (linked by RTPCs) and Triggers. A Wwise Trigger starts a music stinger. This lab says trigger for anything that starts a sound.</P>
        <Note tone="mistake">Looking for the same name in a new tool. Look for the same idea: one tool’s Switch is another tool’s labeled parameter.</Note>
        <ToolNameCards />
      </DocSection>

      <Note>The six checks below complete this page.</Note>

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
        question="In Wwise, the list of surfaces for a footstep is a Switch Group. Which kind of window defines it?"
        options={[
          'Game information, where the game’s switches are listed',
          'The mixer, where each bus has its level and its effects',
          'The profiler, where each started sound is listed',
          'The audition controls, where you play an event by hand',
        ]}
        correct={0}
        explain="A Switch Group is a list of choices the game can send, so it is defined with the other game information. Which sound plays for each surface is then set on the sound, in the window for sound files and containers."
        wrong={[
          undefined,
          'A bus changes how loud a group is. It does not hold the list of surfaces.',
          'The profiler shows which surface was used. It does not define the list.',
          'Auditioning lets you try each surface by hand. The list is defined in another window.',
        ]}
        onCorrect={() => pass(1)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 3"
        question="In FMOD Studio, one footstep event has to sound different on gravel. Which name do you look for?"
        options={['Labeled parameter', 'Multi instrument', 'Studio Event Emitter', 'Group bus']}
        correct={0}
        explain="FMOD Studio does the work of a switch with a labeled parameter: a parameter whose values are names, such as stone and gravel. A local one is kept for each event instance."
        wrong={[
          undefined,
          'A multi instrument picks one of several takes. It does not know the surface.',
          'That is the emitter, in FMOD for Unity: the place a sound comes from.',
          'A group bus is a mix channel. It does not choose which sound plays.',
        ]}
        onCorrect={() => pass(2)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 4"
        question="FMOD Studio calls it a multi instrument: several takes of one sound, and one is picked each time. What is the nearest name in Unity?"
        options={['Audio Random Container', 'Audio Source', 'Audio Profiler module', 'Snapshot of an Audio Mixer']}
        correct={0}
        explain="The idea is a random choice among takes. Wwise calls it a Random Container, FMOD Studio a multi instrument, and Unity an Audio Random Container."
        wrong={[
          undefined,
          'An Audio Source is the emitter: it plays a sound in the scene.',
          'That is Unity’s profiler: a record of what the audio did.',
          'A snapshot stores mix settings. It does not pick a take.',
        ]}
        onCorrect={() => pass(3)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 5"
        question="In Wwise, the generator’s speed has to change its hum while it plays. Which two names do you look for?"
        options={['Game Parameter and RTPC', 'State and State Group', 'SoundBank and Playing ID', 'Random Container and Event']}
        correct={0}
        explain="The speed is a parameter. In Wwise the game sets a Game Parameter, and an RTPC links that value to a sound setting."
        wrong={[
          undefined,
          'A State is a mode for the whole game. Speed is a value that keeps changing.',
          'A SoundBank is a package, and a Playing ID names one playing sound. Neither links a value to a setting.',
          'A Random Container picks a take, and an Event starts it. Neither follows a value.',
        ]}
        onCorrect={() => pass(4)}
      />

      <UnderstandingCheck
        eyebrow="CHECK YOURSELF · 6"
        question="In Unreal Engine’s own audio, which name is the group channel that the effects feed?"
        options={['Sound Submix', 'Audio Component', 'Control Bus Mix', 'Audio Insights']}
        correct={0}
        explain="A bus is a group channel. Unreal Engine’s closest name for it is a Sound Submix."
        wrong={[
          undefined,
          'An Audio Component is the emitter: it gives an object a sound source.',
          'A Control Bus Mix is the closest name for a saved mix setup. It is not the channel.',
          'Audio Insights is the profiler: it shows what the audio did.',
        ]}
        onCorrect={() => pass(5)}
      />
    </View>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12 },
});

export const P20: PageDef = { title: 'Finding your way in the tools', short: 'TOOLS', Component: Page, manualDone: true, rack: true, guide: G20 };
