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
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { GaEngineHost } from './engine/GaEngineHost';
import { useGaSound, type GaSoundState } from './engine/useGaSound';
import { gaVoiceCount, type GaState } from './model/gaModel';
import { gaBindEngine, gaCloseScene, gaDispatch, useGa } from './model/gaStore';
import { GA_SCENE_ASPECT, GaScene, type GaSceneSelect } from './scene/GaScene';

/* ── the lab session ────────────────────────────────────────────────────── */

export type GaLabApi = {
  sound: GaSoundState;
  /** Ask for sound; `assets` are loaded before it resolves. */
  enableSound: (assets?: readonly string[]) => Promise<boolean>;
  /** Stop everything (the model and the engine). */
  stopAll: () => void;
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
  const session = useGaSound(() => gaDispatch({ type: 'stopAll' }));
  const { engine, ensure, enable, stopAll, sound } = session;

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
  const api = useMemo<GaLabApi>(() => ({ sound, enableSound, stopAll, preload }), [sound, enableSound, stopAll, preload]);

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
  unavailable: 'NO ENGINE',
  failed: 'FAILED',
};

/* ── the rack ───────────────────────────────────────────────────────────── */

export type GaRackSpec = {
  /** The page's own dock keys (three at most reads best: SOUND and ■ STOP
   *  follow them on every page). At least one must be a fader. */
  keys: DockParam[];
  /** The fader the lane binds when the page opens: its teaching control. */
  initialParam: string;
  /** Up to two page readouts, shown before the standard three. */
  readouts?: BezelItem[];
  select?: GaSceneSelect;
  showNames?: boolean;
  /** The sounds this page plays (loaded when sound comes on). */
  assets?: readonly string[];
};

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
  const { height: winH } = useWindowDimensions();
  const assets = spec.assets;
  const { sound, enableSound, stopAll, preload } = lab;

  useGaCleanScene();
  useEffect(() => {
    if (assets) preload(assets);
  }, [assets, preload]);

  const soundKey: DockParam = {
    kind: 'toggle',
    id: 'sound',
    label: sound === 'on' ? 'SOUND ON' : 'SOUND',
    value: sound === 'on',
    onToggle: () => {
      if (sound === 'on') stopAll();
      else void enableSound(assets ? [...new Set([...GA_CORE_ASSETS, ...assets])] : undefined);
    },
  };
  const stopKey: DockParam = { kind: 'action', id: 'stop', label: '■ STOP', onPress: () => gaDispatch({ type: 'stopAll' }), tint: colors.red };

  const voices = gaVoiceCount(s);
  const bezel: BezelItem[] = [
    ...(spec.readouts ?? []),
    { k: 'PLAYING', v: String(s.inst.length), vA11y: `${s.inst.length} instances playing` },
    { k: 'VOICES', v: s.voiceLimit ? `${voices}/${s.voiceLimit}` : String(voices), vA11y: s.voiceLimit ? `${voices} of ${s.voiceLimit} voices` : `${voices} voices` },
    { k: 'SOUND', v: GA_SOUND_WORD[sound], tint: sound === 'on' ? colors.green : sound === 'failed' || sound === 'unavailable' ? colors.red : colors.textSub },
  ];

  return (
    <RackUnit
      params={[...spec.keys, soundKey, stopKey]}
      initialParam={spec.initialParam}
      stage={{
        size: 'L',
        phoneHeight: glassHeight(winH),
        minWell: 120,
        fullScreen: true,
        bezel,
        render: (w, h) => {
          // the same box StageFit centres: the widest 16:10 that fits the glass
          const fitW = Math.max(40, Math.min(w - 4, (h - 4) * GA_SCENE_ASPECT));
          return (
            <StageFit w={w} h={h} aspect={GA_SCENE_ASPECT} pad={2}>
              <GaScene w={fitW} h={fitW / GA_SCENE_ASPECT} state={s} select={spec.select ?? null} showNames={!!spec.showNames} />
            </StageFit>
          );
        },
      }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
