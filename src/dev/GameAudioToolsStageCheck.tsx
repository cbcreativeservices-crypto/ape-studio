/**
 * GameAudioToolsStageCheck — a DEV surface (`#labpreview/GameAudioToolsStageCheck`)
 * for the Game Audio lab's instrument strips MIX, VOICES and NET and the
 * tool-window stage for page 20 (scene/hud/hudC.tsx, cToolsStage.tsx), at the
 * sizes the lab gives them: a 48 pt strip on a phone, 72 pt in FULL SCREEN,
 * and the whole glass for the stage.
 *
 * It drives the lab's own scene store with plain buttons OUTSIDE the
 * displays (the displays are read-only), so every state the strips must show
 * can be reached in one tap and looked at or measured. No sound engine is
 * bound here: the scene simulates, and nothing can sound.
 *
 * A SCRIPT in the address runs once when the screen opens, so a state can be
 * reached again after a reload with no taps: `#labpreview/GameAudioToolsStageCheck/<steps>`,
 * steps joined by `~` (see STEPS below; `p300` waits 300 ms, `w3` lights
 * window 3, `tunity` picks a tool, `b8` sets the budget, `hold` holds the
 * displays). Example: `scene~gen~music~line~p250~hold`.
 *
 * Not in any menu. Safe to remove: only src/dev/webPreviews.tsx names it.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';
import { GA_BUSES, type GaBus } from '../screens/lab/gameaudio/engine/gaEngineProtocol';
import { gaPlaying, type GaState } from '../screens/lab/gameaudio/model/gaModel';
import { gaCloseScene, gaDispatch, gaGet, useGa } from '../screens/lab/gameaudio/model/gaStore';
import { GA_TOOLS, type GaToolId } from '../screens/lab/gameaudio/pages/data/gaToolMap';
import { BUDGET_STOPS, budgetStep } from '../screens/lab/gameaudio/pages/data/gaBudget';
import { nextNetId } from '../screens/lab/gameaudio/pages/data/gaNet';
import { GA_HUD_H, GA_HUD_H_FULL } from '../screens/lab/gameaudio/scene/hud/gaHudTypes';
import { GA_HUDS_C, GaToolsStage } from '../screens/lab/gameaudio/scene/hud/hudC';

function Key({ label, onPress, on }: { label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.key, on && styles.keyOn]}>
      <Text style={[styles.keyText, on && styles.keyTextOn]}>{label}</Text>
    </Pressable>
  );
}

const TOOLS: (GaToolId | null)[] = [null, ...GA_TOOLS.map((t) => t.id)];

export function GameAudioToolsStageCheck({ route }: { route?: { params?: { id?: string } } }) {
  const script = route?.params?.id ?? '';
  const live = useGa();
  // HOLD keeps the displays on the state of that moment (a line lasts three
  // seconds; a capture needs longer). The keys go on driving the live scene.
  const [held, setHeld] = useState<GaState | null>(null);
  const s = held ?? live;
  const { width } = useWindowDimensions();
  const [wide, setWide] = useState(false);
  const w = wide ? width - 24 : Math.min(width - 24, 366);
  const [win, setWin] = useState(0);
  const [tool, setTool] = useState<GaToolId | null>(null);
  const [bus, setBus] = useState<GaBus>('music');
  const [lastId, setLastId] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    gaDispatch({ type: 'enterPage' });
    let live2 = true;
    const last = { id: null as string | null };
    const net = (what: 'door' | 'alert', to: 'world' | 'me' | 'them') => {
      last.id = nextNetId(gaGet().netSeen);
      setLastId(last.id);
      gaDispatch({ type: 'net', id: last.id, what, to });
    };
    const STEPS: Record<string, () => void> = {
      scene: () => gaDispatch({ type: 'scene', on: true }),
      gen: () => gaDispatch({ type: 'machine', id: 'generator-1', on: true }),
      music: () => gaDispatch({ type: 'musicStart' }),
      alert: () => gaDispatch({ type: 'mood', mood: 'alert' }),
      line: () => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' }),
      chat: () => gaDispatch({ type: 'post', event: 'chat' }),
      door: () => gaDispatch({ type: 'door' }),
      step: () => gaDispatch({ type: 'step', who: 'player' }),
      fast: () => gaDispatch({ type: 'speed', id: 'generator-1', value: 0.9 }),
      noduck: () => gaDispatch({ type: 'option', patch: { duck: false } }),
      mute: () => gaDispatch({ type: 'bus', bus: 'music', mute: true }),
      solo: () => gaDispatch({ type: 'bus', bus: 'dialogue', solo: true }),
      down: () => gaDispatch({ type: 'bus', bus: 'music', db: -12 }),
      up: () => gaDispatch({ type: 'bus', bus: 'sfx', db: 6 }),
      burst: () => gaDispatch({ type: 'burst', count: 12 }),
      alarm: () => gaDispatch({ type: 'alarm', on: true }),
      warn: () => gaDispatch({ type: 'post', event: 'vo_warning', owner: 'guide' }),
      netdoor: () => net('door', 'world'),
      again: () => last.id && gaDispatch({ type: 'net', id: last.id, what: 'door', to: 'world' }),
      tome: () => net('alert', 'me'),
      tothem: () => net('alert', 'them'),
      nocheck: () => gaDispatch({ type: 'option', patch: { dedupe: false } }),
      stop: () => gaDispatch({ type: 'stopAll' }),
      hold: () => setHeld(gaGet()),
      tall: () => setFull(true),
      wide: () => setWide(true),
    };
    // every wait of the script is a timer held here and cleared when the screen closes
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        const h = setTimeout(() => {
          timers.delete(h);
          done();
        }, ms);
        timers.add(h);
      });
    void (async () => {
      for (const step of script.split('~').filter(Boolean)) {
        if (!live2) return;
        const m = /^([a-z]+?)(-?\d+)?$/.exec(step);
        const n = m && m[2] != null ? Number(m[2]) : null;
        if (m && m[1] === 'p' && n != null) await wait(n);
        else if (m && m[1] === 'w' && n != null) setWin(n);
        else if (m && m[1] === 'b' && n != null) gaDispatch({ type: 'voiceLimit', limit: n });
        else if (step.startsWith('t') && GA_TOOLS.some((t) => t.id === step.slice(1))) setTool(step.slice(1) as GaToolId);
        else if (step.startsWith('bus') && (GA_BUSES as readonly string[]).includes(step.slice(3))) setBus(step.slice(3) as GaBus);
        else STEPS[step]?.();
        await wait(30);
      }
    })();
    return () => {
      live2 = false;
      for (const h of timers) clearTimeout(h);
      gaCloseScene();
    };
    // the script is the address the screen was opened with
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // for measuring every window and tool from the browser console in one pass
  useEffect(() => {
    (globalThis as Record<string, unknown>).__gaCheck = { setWin, setTool, setFull, setWide, setHeld, dispatch: gaDispatch, get: gaGet };
    return () => {
      delete (globalThis as Record<string, unknown>).__gaCheck;
    };
  }, []);

  const Mix = GA_HUDS_C.mix;
  const Voices = GA_HUDS_C.voices;
  const Net = GA_HUDS_C.net;
  const h = full ? GA_HUD_H_FULL : GA_HUD_H;
  const scene = gaPlaying(s, 'bed_room') || gaPlaying(s, 'fountain');
  const send = (what: 'door' | 'alert', to: 'world' | 'me' | 'them') => {
    const id = nextNetId(gaGet().netSeen);
    setLastId(id);
    gaDispatch({ type: 'net', id, what, to });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h}>TOOL-WINDOW STAGE · window {win} · {tool ?? 'any tool'}</Text>
        <View testID="check-stage" style={[styles.glass, { width: w, height: full ? 420 : 251 }]}>
          <GaToolsStage w={w} h={full ? 420 : 251} tool={tool} win={win} state={s} />
        </View>
        <View style={styles.keys}>
          <Key label="WINDOW ‹" onPress={() => setWin((x) => (x + 8) % 9)} />
          <Key label="WINDOW ›" onPress={() => setWin((x) => (x + 1) % 9)} />
          <Key label="TOOL ›" onPress={() => setTool((x) => TOOLS[(TOOLS.indexOf(x) + 1) % TOOLS.length])} />
          <Key label="DOOR" onPress={() => gaDispatch({ type: 'door' })} />
          <Key label="GENERATOR" on={!!s.machines[0]?.on} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gaGet().machines[0]?.on })} />
          <Key label="SPEED +" onPress={() => gaDispatch({ type: 'speed', id: 'generator-1', value: ((gaGet().machines[0]?.speed ?? 0.4) + 0.2) % 1.01 })} />
          <Key label="STEP" onPress={() => gaDispatch({ type: 'step', who: 'player' })} />
          <Key label="MUSIC" on={s.music.on} onPress={() => gaDispatch({ type: gaGet().music.on ? 'musicStop' : 'musicStart' })} />
          <Key label="MOOD" on={s.mood === 'alert'} onPress={() => gaDispatch({ type: 'mood', mood: gaGet().mood === 'alert' ? 'calm' : 'alert' })} />
          <Key label="TALL" on={full} onPress={() => setFull((x) => !x)} />
          <Key label="STOP" onPress={() => gaDispatch({ type: 'stopAll' })} />
          <Key label="HOLD" on={!!held} onPress={() => setHeld((x) => (x ? null : gaGet()))} />
        </View>

        <Text style={styles.h}>MIX · bus on the key: {bus}</Text>
        <View testID="check-mix" style={[styles.glass, { width: w, height: h }]}>{Mix ? <Mix w={w} h={h} state={s} arg={bus} /> : null}</View>
        <View style={styles.keys}>
          <Key label="SCENE" on={scene} onPress={() => gaDispatch({ type: 'scene', on: !scene })} />
          <Key label="LINE" on={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
          <Key label="CHAT" onPress={() => gaDispatch({ type: 'post', event: 'chat' })} />
          <Key label="DUCK" on={s.options.duck} onPress={() => gaDispatch({ type: 'option', patch: { duck: !gaGet().options.duck } })} />
          <Key label="BUS ›" onPress={() => setBus((b) => GA_BUSES[(GA_BUSES.indexOf(b) + 1) % GA_BUSES.length])} />
          <Key label="−6" onPress={() => gaDispatch({ type: 'bus', bus, db: gaGet().bus[bus].db - 6 })} />
          <Key label="+6" onPress={() => gaDispatch({ type: 'bus', bus, db: gaGet().bus[bus].db + 6 })} />
          <Key label="MUTE" on={s.bus[bus].mute} onPress={() => gaDispatch({ type: 'bus', bus, mute: !gaGet().bus[bus].mute })} />
          <Key label="SOLO" on={s.bus[bus].solo} onPress={() => gaDispatch({ type: 'bus', bus, solo: !gaGet().bus[bus].solo })} />
        </View>

        <Text style={styles.h}>VOICES · budget {s.voiceLimit || 'none'}</Text>
        <View testID="check-voices" style={[styles.glass, { width: w, height: h }]}>{Voices ? <Voices w={w} h={h} state={s} /> : null}</View>
        <View style={styles.keys}>
          <Key label="‹ FEWER" onPress={() => gaDispatch({ type: 'voiceLimit', limit: budgetStep(gaGet().voiceLimit, -1) })} />
          <Key label="MORE ›" onPress={() => gaDispatch({ type: 'voiceLimit', limit: budgetStep(gaGet().voiceLimit, 1) })} />
          <Key label="BURST" onPress={() => gaDispatch({ type: 'burst', count: 12 })} />
          <Key label="ALARM" on={gaPlaying(s, 'alarm')} onPress={() => gaDispatch({ type: 'alarm', on: !gaPlaying(gaGet(), 'alarm') })} />
          <Key label="WARNING" onPress={() => gaDispatch({ type: 'post', event: 'vo_warning', owner: 'guide' })} />
          <Text style={styles.note}>stops {BUDGET_STOPS.join(' ')}</Text>
        </View>

        <Text style={styles.h}>NET · ID check {s.options.dedupe ? 'on' : 'off'} · last {lastId ?? 'none'}</Text>
        <View testID="check-net" style={[styles.glass, { width: w, height: h }]}>{Net ? <Net w={w} h={h} state={s} /> : null}</View>
        <View style={styles.keys}>
          <Key label="DOOR NEW" onPress={() => send('door', 'world')} />
          <Key label="AGAIN" onPress={() => lastId && gaDispatch({ type: 'net', id: lastId, what: 'door', to: 'world' })} />
          <Key label="TO YOU" onPress={() => send('alert', 'me')} />
          <Key label="TO OTHER" onPress={() => send('alert', 'them')} />
          <Key label="ID CHECK" on={s.options.dedupe} onPress={() => gaDispatch({ type: 'option', patch: { dedupe: !gaGet().options.dedupe } })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050506' },
  body: { padding: 12, gap: 8 },
  h: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  glass: { backgroundColor: '#0b0c0f', borderRadius: 4, overflow: 'hidden' },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  key: { minHeight: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3a3c46', backgroundColor: '#15161b', justifyContent: 'center' },
  keyOn: { borderColor: colors.amber },
  keyText: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.8 },
  keyTextOn: { color: colors.amber },
  note: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 11, alignSelf: 'center' },
});
