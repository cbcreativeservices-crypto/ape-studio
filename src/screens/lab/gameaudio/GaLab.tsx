/**
 * GaLab — what every Game Audio lab page shares:
 *
 *   GaLabProvider   ONE sound session and ONE scene for the lab screen. It
 *                   mounts the engine host, connects the scene store to the
 *                   engine, and keeps the model's "sound on" equal to what
 *                   the session can honestly say.
 *   GaRack          a page on the Rack Unit (owner rule: every page with a
 *                   live display uses the rack): the shared scene PINNED on
 *                   the glass, read-only readouts under it, the lesson in the
 *                   well, every control in the dock.
 *   dock keys       SOUND and ■ STOP are on every page, in the same place;
 *                   a page adds its own teaching controls before them.
 *                   SOUND switches sound ON (through the app's output gate)
 *                   and OFF again; ■ STOP stops what is playing and leaves
 *                   sound as it is.
 *
 * Every page opens on a CLEAN scene (model: 'enterPage'): start positions,
 * door closed, nothing playing, standard settings, an empty log. The lab's
 * sound session and level carry on from page to page; the scene does not.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../theme/tokens';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import { RackUnit } from '../rack/RackUnit';
import { StageFit } from '../rack/StageFit';
import { StageAspectReport, StageInFullScreen } from '../rack/stageAspect';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { GaEngineHost } from './engine/GaEngineHost';
import { useGaSound, type GaSoundState } from './engine/useGaSound';
import { gaVoiceCount, type GaState } from './model/gaModel';
import { gaBindEngine, gaCloseScene, gaDispatch, useGa } from './model/gaStore';
import { gaCount, gaFitReadouts, type GaReadout } from './bitsLogic';
import { GA_SCENE_ASPECT, GaScene, type GaSceneSelect, type GaSceneShow } from './scene/GaScene';
import { GA_GLASS_PAD, GA_SPLIT_ASPECT, gaGlassSplit } from './scene/gaSceneLogic';
import { GA_HUDS, GA_HUD_H, type GaHudId } from './scene/hud';

/* ── the lab session ────────────────────────────────────────────────────── */

export type GaLabApi = {
  sound: GaSoundState;
  /** Ask for sound; `assets` are loaded before it resolves. */
  enableSound: (assets?: readonly string[]) => Promise<boolean>;
  /** Stop everything (the model and the engine). Sound stays as it is. */
  stopAll: () => void;
  /** Switch sound OFF: everything stops and `sound` reads 'off' until
   *  `enableSound` is asked again (audit 2, SND F7: the SOUND key could not
   *  switch sound off; it was a second ■ STOP). */
  disableSound: () => void;
  /** Make sure the engine holds these sounds (a page calls it on open, so
   *  the first tap is not the one that pays for building them). */
  preload: (assets: readonly string[]) => void;
};

const GaLabContext = createContext<GaLabApi | null>(null);

export function useGaLab(): GaLabApi {
  const c = useContext(GaLabContext);
  if (!c) throw new Error('useGaLab must be used inside <GaLabProvider>');
  return c;
}

/** The sounds nearly every page plays. */
export const GA_CORE_ASSETS = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'ir_room'] as const;

export function GaLabProvider({ children }: { children: ReactNode }) {
  // The session calls back for THREE stops: ■ STOP / SOUND off asked HERE
  // (`own` is set around those calls), and the app-wide safety stop when the
  // learner leaves the app. The last one is the app's, not the game's: the
  // log says so, once (bug test 2026-11-13, B-S3-01: "GAME · STOP ALL"
  // printed twice when the app was hidden).
  const own = useRef(false);
  const session = useGaSound(() => gaDispatch(own.current ? { type: 'stopAll' } : { type: 'stopAll', why: 'app' }));
  const { engine, ensure, enable, stopAll: sessionStop, disable: sessionDisable, sound } = session;
  const stopAll = useCallback(() => {
    own.current = true;
    try {
      sessionStop();
    } finally {
      own.current = false;
    }
  }, [sessionStop]);
  const disable = useCallback(() => {
    own.current = true;
    try {
      sessionDisable();
    } finally {
      own.current = false;
    }
  }, [sessionDisable]);

  useEffect(() => gaBindEngine(engine, ensure), [engine, ensure]);
  useEffect(() => {
    gaDispatch({ type: 'sound', on: sound === 'on' });
  }, [sound]);
  // The lab can close while sound is still being asked for: nothing after
  // that await may touch the scene.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      gaCloseScene();
    };
  }, []);

  const enableSound = useCallback(
    async (assets: readonly string[] = GA_CORE_ASSETS) => {
      const ok = await enable();
      if (!alive.current) return false;
      if (ok) await ensure(assets);
      return ok && alive.current;
    },
    [enable, ensure],
  );
  const preload = useCallback(
    (assets: readonly string[]) => {
      if (engine.status === 'running') void ensure(assets);
    },
    [engine, ensure],
  );
  const api = useMemo<GaLabApi>(() => ({ sound, enableSound, stopAll, disableSound: disable, preload }), [sound, enableSound, stopAll, disable, preload]);

  return (
    <GaLabContext.Provider value={api}>
      <GlossaryLinkProvider>
        <GaEngineHost engine={engine} />
        {children}
      </GlossaryLinkProvider>
    </GaLabContext.Provider>
  );
}

/** What the SOUND readout says, in words (never colour alone). */
export const GA_SOUND_WORD: Record<GaSoundState, string> = {
  off: 'OFF',
  starting: 'STARTING',
  on: 'ON',
  blocked: 'TAP AGAIN',
  declined: 'OFF',
  unavailable: 'NO SOUND',
  failed: 'FAILED',
};

/* ── the rack ───────────────────────────────────────────────────────────── */

export type GaRackSpec = {
  /** The page's own dock keys (three at most reads best: SOUND and ■ STOP
   *  follow them on every page). At least one must be a fader. */
  keys: DockParam[];
  /** The fader the lane binds when the page opens: its teaching control. */
  initialParam: string;
  /** Up to two page readouts, shown before the standard three. A readout
   *  may name a shorter key for a narrow phone (bitsLogic `gaFitReadouts`). */
  readouts?: (BezelItem & Pick<GaReadout, 'kNarrow'>)[];
  /** The source whose MIN and MAX distance rings (and their numbers) the
   *  scene draws, with a line from the listener to it. */
  select?: GaSceneSelect;
  /** Print every object's name in the scene (otherwise only the selected). */
  showNames?: boolean;
  /** What else the scene shows on this page, each OFF unless asked for
   *  (scene/GaScene `GaSceneShow`):
   *    ids           page 7: the INSTANCE id by each generator's rings
   *    mood          page 8: MOOD · CALM / MOOD · ALERT, and a border around
   *                  the whole picture while it is ALERT
   *    guideListens  page 18: a blue listener wedge on the guide
   *    surface       page 8: the SURFACE by the foot that stepped
   *    take          page 9: the TAKE by the foot that stepped
   *    beds          pages 1 and 10: a mark over each zone while its bed
   *                  plays, as strong as the bed's level */
  show?: GaSceneShow;
  /** The sounds this page plays (loaded when sound comes on). */
  assets?: readonly string[];
  /** The instrument strip under the scene (scene/hud): the one thing this
   *  page teaches that the scene cannot draw. Read-only; the dock changes it. */
  hud?: GaHudId | null;
  /** The page's own choice for its strip (which output, which topic). */
  hudArg?: string;
  /** A page whose display is NOT the scene (page 20's tool windows) draws
   *  its own glass. Read-only, like everything on the glass. */
  glass?: (w: number, h: number) => ReactNode;
};

/** The glass of a scene page: the scene at its own aspect, centered, and the
 *  page's instrument strip (if it has one) under it, full width. */
function GaGlass({ w, h, spec, state }: { w: number; h: number; spec: GaRackSpec; state: GaState }) {
  const full = useContext(StageInFullScreen);
  const report = useContext(StageAspectReport);
  const Hud = spec.hud ? GA_HUDS[spec.hud] : undefined;
  // with a strip, the full-screen canvas takes the shape of scene + strip
  // (StageFit, below, reports the scene's own shape first; this effect runs
  // after it and is the one that counts)
  useEffect(() => {
    if (Hud) report?.aspect(GA_SPLIT_ASPECT, GA_GLASS_PAD);
  }, [Hud, report]);
  const { hudH, sceneH, sceneW, sceneDrawH } = gaGlassSplit(w, h, !!Hud, full);
  return (
    <View style={{ width: w, height: h }}>
      <StageFit w={w} h={sceneH} aspect={GA_SCENE_ASPECT} pad={GA_GLASS_PAD}>
        <GaScene w={sceneW} h={sceneDrawH} state={state} select={spec.select ?? null} showNames={!!spec.showNames} show={spec.show} />
      </StageFit>
      {Hud ? (
        <View style={{ width: w, height: hudH }}>
          <Hud w={w} h={hudH} state={state} arg={spec.hudArg} />
        </View>
      ) : null}
    </View>
  );
}

/** Glass height: taller where the phone allows, as the DJ and Miking labs. */
const glassHeight = (winH: number): number => Math.max(200, Math.min(270, Math.round(winH * 0.3)));

/** The lab's master level as a fader key (the default teaching control on
 *  pages that have no better one). */
export const masterKey = (s: GaState): DockParam => ({
  kind: 'fader',
  id: 'master',
  label: 'LEVEL',
  value: s.master,
  level: true,
  home: 0.7,
  onChange: (v) => gaDispatch({ type: 'master', value: v }),
  format: (v) => `THIS LAB · ${Math.round(v * 100)}%`,
  formatShort: (v) => `${Math.round(v * 100)}%`,
});

/** Every page opens on a clean scene (model: 'enterPage'). GaRack calls it;
 *  a reading page with no rack calls it too, so no sound from the page
 *  before plays on under a page that has no ■ STOP key. */
export function useGaCleanScene(): void {
  useEffect(() => {
    gaDispatch({ type: 'enterPage' });
  }, []);
}

export function GaRack({ spec, children }: { spec: GaRackSpec; children: ReactNode }) {
  const s = useGa();
  const lab = useGaLab();
  const { height: winH, width: winW } = useWindowDimensions();
  const assets = spec.assets;
  const { sound, enableSound, disableSound, preload } = lab;

  useGaCleanScene();
  useEffect(() => {
    if (assets) preload(assets);
  }, [assets, preload]);

  const soundKey: DockParam = {
    kind: 'toggle',
    id: 'sound',
    label: sound === 'on' ? 'SOUND ON' : 'SOUND',
    value: sound === 'on',
    // ON → OFF really switches sound off (the readout then says OFF); it is
    // not a second ■ STOP
    onToggle: () => {
      if (sound === 'on') disableSound();
      else void enableSound(assets ? [...new Set([...GA_CORE_ASSETS, ...assets])] : undefined);
    },
  };
  const stopKey: DockParam = { kind: 'action', id: 'stop', label: '■ STOP', onPress: () => gaDispatch({ type: 'stopAll' }), tint: colors.red };

  const voices = gaVoiceCount(s);
  // on a narrow phone each cell's share follows its words: at 320 wide five
  // even cells cut "PLAYING" to "PLAYI…" (bug test B-S2-06)
  const bezel: BezelItem[] = gaFitReadouts(
    [
      ...(spec.readouts ?? []),
      // short keys: the frame drops a key that does not fit its cell (round 2)
      { k: 'PLAYING', kNarrow: 'PLAYS', v: String(s.inst.length), vA11y: `${gaCount(s.inst.length, 'instance')} playing` },
      { k: 'VOICES', v: s.voiceLimit ? `${voices}/${s.voiceLimit}` : String(voices), vA11y: s.voiceLimit ? `${voices} of ${gaCount(s.voiceLimit, 'voice')}` : gaCount(voices, 'voice') },
      { k: 'SOUND', kNarrow: 'SND', v: GA_SOUND_WORD[sound], tint: sound === 'on' ? colors.green : sound === 'failed' || sound === 'unavailable' ? colors.red : colors.textSub },
    ],
    winW,
  );

  return (
    <RackUnit
      params={[...spec.keys, soundKey, stopKey]}
      initialParam={spec.initialParam}
      stage={{
        size: 'L',
        // a page with a strip gets half the strip's height from the well and
        // half from the scene
        phoneHeight: glassHeight(winH) + (spec.hud && GA_HUDS[spec.hud] ? GA_HUD_H / 2 : 0),
        minWell: 120,
        fullScreen: true,
        bezel,
        render: (w, h) => (spec.glass ? spec.glass(w, h) : <GaGlass w={w} h={h} spec={spec} state={s} />),
      }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
