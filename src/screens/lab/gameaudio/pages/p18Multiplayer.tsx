/**
 * Page 18 — MULTIPLAYER SOUND (plan page 18; handoff lesson 16).
 *
 * Two players in one world: you, and the guide standing in for the other
 * player. A networked game usually sends what HAPPENED, and each player's
 * own machine plays the sound for its own listener; live voice chat is the
 * exception. The learner sends a door action with an ID (the door moves and
 * its sound plays), sends the SAME ID again and reads "already handled, so
 * it is ignored"; switches the ID check off and gets a double (the sound a
 * second time; the door does not move again); sends a private alert to each
 * player; and plays the stand-in sound for live chat.
 *
 * A MESSAGE TAKES TIME (accuracy audit B5, walk audit W2-05). An action is
 * SENT at the press and ARRIVES 0.25 s later (model `netFlights`,
 * `GA_NET_DELAY_S`): the door, the sound, the facts the goals read and the
 * ID check all happen at arrival. So the card ONE MESSAGE, TWO MACHINES
 * shows "on its way" first and then what the MODEL says became of it
 * (data/gaNet `netArrivalOutcome`), including which way the door moved
 * (W2-04: a closing action no longer reads "door opened").
 *
 * WORDS: "machine" on this page is a player's computer, and only that (the
 * generator is never called a machine elsewhere in the lab, learning audit
 * section 4). "ID" is written in capitals.
 *
 * Nothing here needs a server: the page imitates messages arriving. Action
 * IDs are handed out by data/gaNet (never one the scene has already sent).
 *
 * Common mistakes taught against: treating multiplayer audio as one shared
 * mix; letting a local action and its network copy both trigger the sound.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { InfoCard, Tray, TrayChip, TrayGrid, TrayNote, useWatch } from './chdKit';
import { NET_DELAY_S, netArrivalOutcome, netCheckAtArrival, netEffectWords, netFlightKey, netMemoryAdvance, netMemoryStart, netMessageWords, newestFlight, nextNetId, type NetArrival, type NetEffect, type NetSend } from './data/gaNet';
import { G18 } from './guides/p18';
import { useSince } from './shared';

const ASSETS = ['door', 'door_rattle', 'ui_confirm', 'vo_chat'] as const;
const TERMS = gaTerms('In-game voice chat', 'Proximity voice chat', 'Audio listener', 'Split-screen audio');

/** One delivery: what was sent, and the model's number for it (so the card
 *  can find what became of it when it lands). */
type Sent = { send: NetSend; key: string | null };

/** The words the NET strip prints under each machine (scene/hud cNet), so
 *  the card and the strip say the same thing. */
const effectWord = (effect: NetEffect, second: boolean, side: 'here' | 'there'): string =>
  effect === 'ignored' ? '✕ IGNORED · DUPLICATE' : effect === 'nothing' ? `○ NOT FOR ${side === 'here' ? 'YOU' : 'THEM'} · SILENT` : second ? '▶▶ PLAYED AGAIN · DOUBLE' : '▶ PLAYED';
const EFFECT_COLOR: Record<NetEffect, string> = { plays: colors.green, ignored: colors.orange, nothing: colors.textSub };
const DOUBLE_COLOR = colors.red;

/** SEND tray, two rows (chdKit: designed for 200 points): a new action (a
 *  world sound, or a private alert for either player), then the same action
 *  again and the stand-in chat line. No log line in the tray: the NET strip
 *  shows each action SENT, travelling and ARRIVED, and a log line that grew
 *  from one line to three moved every chip under the finger (seen at
 *  390 x 844). */
function SendTray({ last, onSend }: { last: Sent | null; onSend: (send: NetSend) => void }) {
  const s = useGa();
  const fresh = (what: NetSend['what'], to: NetSend['to']) => onSend({ id: nextNetId(gaGet().netSeen), what, to });
  return (
    <Tray>
      <TrayGrid head="SEND A NEW ACTION" cols={3}>
        <TrayChip label="DOOR · NEW ID" onPress={() => fresh('door', 'world')} />
        <TrayChip label="ALERT TO YOU" onPress={() => fresh('alert', 'me')} />
        <TrayChip label="ALERT TO OTHER" onPress={() => fresh('alert', 'them')} />
      </TrayGrid>
      <TrayGrid head="SEND IT AGAIN · LIVE CHAT" cols={3}>
        {last ? <TrayChip label={`${last.send.id} AGAIN`} a11y={`Send action ${last.send.id} again with the same ID`} onPress={() => onSend(last.send)} /> : <TrayNote>AGAIN: send an action first.</TrayNote>}
        <TrayChip label={gaPlaying(s, 'chat') ? 'CHAT LINE · PLAYING' : 'CHAT LINE'} selected={gaPlaying(s, 'chat')} onPress={() => gaDispatch({ type: 'post', event: 'chat' })} />
      </TrayGrid>
    </Tray>
  );
}

function Machine({ title, listener, effect, words, side, second = false, pending = false }: { title: string; listener: string; effect: NetEffect; words: string; side: 'here' | 'there'; second?: boolean; pending?: boolean }) {
  return (
    <View style={styles.machine}>
      <Text style={styles.machineTitle}>{title}</Text>
      <Text style={styles.machineSub}>{listener}</Text>
      <Text style={[styles.machineEffect, { color: pending ? colors.textSub : second && effect === 'plays' ? DOUBLE_COLOR : EFFECT_COLOR[effect] }]}>{pending ? '… ON ITS WAY' : effectWord(effect, second, side)}</Text>
      <Text style={styles.machineWords}>{words}</Text>
    </View>
  );
}

/** The last delivery, seen from both machines. While it travels both read
 *  ON ITS WAY; when it lands, each shows what the model says it did there.
 *  Read-only. */
function TwoMachines({ last, arrival }: { last: Sent | null; arrival: NetArrival | null }) {
  if (!last) {
    return (
      <InfoCard head="ONE MESSAGE, TWO MACHINES" a11y="One message, two machines. Nothing has been sent yet.">
        <Text style={styles.cardNote}>Nothing has been sent yet. Open SEND at the bottom.</Text>
      </InfoCard>
    );
  }
  if (!arrival) {
    const message = netMessageWords(last.send);
    return (
      <InfoCard head="ONE MESSAGE, TWO MACHINES" a11y={`One message, two machines. The message: ${message}. It is on its way: it arrives ${NET_DELAY_S} seconds after it was sent.`}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.machines}>
          <Machine title="YOUR MACHINE" listener="Listener: you" effect="nothing" words="On its way." side="here" pending />
          <Machine title="THE OTHER MACHINE" listener="Listener: the guide" effect="nothing" words="On its way." side="there" pending />
        </View>
        <Text style={styles.cardNote}>A message arrives {NET_DELAY_S} s after it is sent.</Text>
      </InfoCard>
    );
  }
  const out = netArrivalOutcome(last.send, arrival);
  const here = netEffectWords(last.send, out.here, out.second);
  const there = netEffectWords(last.send, out.there, out.second);
  const message = `${netMessageWords(last.send, arrival.door)}${arrival.again ? ' · sent again' : ''}`;
  const check = netCheckAtArrival(arrival);
  const checkWords = check == null ? 'A new ID: there was nothing to check.' : `ID CHECK was ${check ? 'ON' : 'OFF'} when it arrived.`;
  return (
    <InfoCard head="ONE MESSAGE, TWO MACHINES" a11y={`One message, two machines. The message: ${message}. ${checkWords} Your machine: ${here} The other player’s machine: ${there}`}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.machines}>
        <Machine title="YOUR MACHINE" listener="Listener: you" effect={out.here} words={here} side="here" second={out.second} />
        <Machine title="THE OTHER MACHINE" listener="Listener: the guide" effect={out.there} words={there} side="there" second={out.second} />
      </View>
      <Text style={styles.cardNote}>{checkWords} This page runs only your machine. The right-hand side applies the same rule from the other player’s side.</Text>
    </InfoCard>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [last, setLast] = useState<Sent | null>(null);
  const [check, setCheck] = useState(false);

  // what has landed on this visit, as the model recorded it at arrival
  const memory = useWatch(s, netMemoryStart, netMemoryAdvance);
  const arrival = last?.key != null ? (memory.landed[last.key] ?? null) : null;

  const onSend = (send: NetSend) => {
    gaDispatch({ type: 'net', id: send.id, what: send.what, to: send.to });
    const f = newestFlight(gaGet());
    setLast({ send, key: f && f.id === send.id && f.result === 'pending' ? netFlightKey(f) : null });
  };

  const goals = [
    { label: 'Send an action again and see it ignored', hit: since('netDuplicateIgnored') > 0 },
    { label: 'With ID CHECK off, send an action again: its sound plays twice', hit: since('netDoublePlayed') > 0 },
    { label: 'Send one alert to you and one to the other player', hit: since('netPrivateMe') > 0 && since('netPrivateOther') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const sendKey: DockParam = {
    kind: 'group',
    id: 'net',
    label: 'SEND',
    valueLabel: last ? last.send.id : 'NONE',
    valueA11y: last ? `last action sent: ${netMessageWords(last.send, arrival?.door)}` : 'no action sent yet',
    render: () => <SendTray last={last} onSend={onSend} />,
  };
  const checkKey: DockParam = {
    kind: 'toggle',
    id: 'idcheck',
    label: 'ID CHECK',
    labelLines: 2,
    value: s.options.dedupe,
    onToggle: () => gaDispatch({ type: 'option', patch: { dedupe: !gaGet().options.dedupe } }),
  };

  return (
    <GaRack
      spec={{
        keys: [sendKey, checkKey, masterKey(s)],
        initialParam: 'master',
        hud: 'net',
        // the guide's ears: the other player's listener (W2-05)
        show: { guideListens: true },
        readouts: [
          { k: 'ID CHECK', v: s.options.dedupe ? 'ON' : 'OFF', vA11y: s.options.dedupe ? 'an action that arrives again with the same ID is ignored' : 'an action that arrives again with the same ID is handled again' },
          { k: 'LAST ID', v: last ? last.send.id : '—', vA11y: last ? `last action ID ${last.send.id}` : 'no action sent yet' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Two players share this world: you, and the guide, who stands in for the other player with a separate machine.</Look>
        <P>A networked game usually does not send sound. It sends what HAPPENED, such as “door opened, action A1”. Each player’s machine plays the sound for its own listener, at its own distance and direction. So there is no single shared mix.</P>
        <P>Live voice chat is the exception: real audio travels between players. In proximity voice chat you hear only the players whose characters are near yours.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open SEND and press DOOR · NEW ID. Then press the AGAIN chip.</Do>
        <P>A message takes time to travel: here, 0.25 s. On a real network the delay changes from moment to moment and between players.</P>
        <P>When the action arrives, the door moves and its sound plays. A network sometimes delivers a message twice. With ID CHECK on, the copy is ignored: one action, one sound.</P>
        <TwoMachines last={last} arrival={arrival} />
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Switch ID CHECK off and send the same action again. Then send ALERT TO YOU and ALERT TO OTHER, and press CHAT LINE.</Do>
        <P>ID CHECK is read when an action arrives. With it off, the door sound plays again, but the door does not move. An alert for you plays a cue here; one for the other player plays nothing here.</P>
        <P>The chat line is a stand-in for live chat.</P>
        <Note tone="mistake">Treating multiplayer audio as one shared mix, or letting a local action and its network copy both play the sound.</Note>
      </Step>
      <Step n={4}>
        <P>Each goal is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You open a door. Your machine plays the door sound immediately. A moment later the network delivers your own action back to you with the same ID. What should your machine do?"
          options={[
            'See that its ID was handled, and play nothing more',
            'Play the door again, so that both players hear it',
            'Wait for the audio of the door to arrive from the server',
            'Stop the first sound and play the copy from the network',
          ]}
          correct={0}
          explain="One action gets one sound per listener. The ID shows that this action was already handled here, so the copy is ignored."
          wrong={[
            undefined,
            'The other player’s machine plays its own sound for its own listener. A second sound on your machine is a double.',
            'Games usually send the event, not the audio. Each machine plays the sound from its own files.',
            'Then your own action would sound late, and it would still be the same sound twice.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  message: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 18 },
  machines: { flexDirection: 'row', gap: 8 },
  machine: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#34343c', backgroundColor: '#101013', padding: 8, gap: 3 },
  machineTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  machineSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  machineEffect: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1 },
  machineWords: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  cardNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

export const P18: PageDef = { title: 'Multiplayer sound', short: 'MULTIPLAYER', Component: Page, manualDone: true, rack: true, guide: G18 };
