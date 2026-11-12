/**
 * Page 18 — MULTIPLAYER SOUND (plan page 18; handoff lesson 16).
 *
 * Two players in one world: you, and the guide standing in for the other
 * player. A networked game usually sends what HAPPENED, and each player's
 * own machine plays the sound for its own listener; live voice chat is the
 * exception. The learner sends a door action with an id (the door moves and
 * its sound plays), sends the SAME id again and reads "already handled,
 * ignored"; switches the id check off and gets a double (the sound a second
 * time; the door does not move again); sends a private alert to each
 * player; and plays the stand-in sound for live chat.
 *
 * Nothing here needs a server: the page imitates messages arriving. Action
 * ids are handed out by data/gaNet (never one the scene has already seen).
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
import { InfoCard, Tray, TrayChip, TrayGrid, TrayLast, TrayNote } from './chdKit';
import { netEffectWords, netMessageWords, netOutcome, nextNetId, type NetEffect, type NetSend } from './data/gaNet';
import { G18 } from './guides/p18';
import { useSince } from './shared';

const ASSETS = ['door', 'door_rattle', 'ui_confirm', 'vo_chat'] as const;
const TERMS = gaTerms('In-game voice chat', 'Proximity voice chat', 'Audio listener', 'Split-screen audio');

/** One delivery, as it was when it was sent. */
type Sent = { send: NetSend; seenBefore: boolean; idCheck: boolean };

const EFFECT_WORD: Record<NetEffect, string> = { plays: '▶ PLAYS', ignored: '✕ IGNORED', nothing: '○ SILENT' };
const EFFECT_COLOR: Record<NetEffect, string> = { plays: colors.green, ignored: colors.orange, nothing: colors.textSub };

/** SEND tray, two rows so nothing needs scrolling: a new action (a world
 *  sound, or a private alert for either player), then the same action again
 *  and the stand-in chat line. */
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
      <TrayGrid head="THE SAME ACTION AGAIN · VOICE" cols={3}>
        {last ? <TrayChip label={`${last.send.id} AGAIN`} a11y={`Send action ${last.send.id} again with the same id`} onPress={() => onSend(last.send)} /> : <TrayNote>AGAIN: send an action first.</TrayNote>}
        <TrayChip label="CHAT LINE" selected={gaPlaying(s, 'chat')} onPress={() => gaDispatch({ type: 'post', event: 'chat' })} />
      </TrayGrid>
      <TrayLast lines={3} />
    </Tray>
  );
}

function Machine({ title, listener, effect, words }: { title: string; listener: string; effect: NetEffect; words: string }) {
  return (
    <View style={styles.machine}>
      <Text style={styles.machineTitle}>{title}</Text>
      <Text style={styles.machineSub}>{listener}</Text>
      <Text style={[styles.machineEffect, { color: EFFECT_COLOR[effect] }]}>{EFFECT_WORD[effect]}</Text>
      <Text style={styles.machineWords}>{words}</Text>
    </View>
  );
}

/** The last delivery, seen from both machines. Read-only. */
function TwoMachines({ last }: { last: Sent | null }) {
  if (!last) {
    return (
      <InfoCard head="ONE MESSAGE, TWO MACHINES" a11y="One message, two machines. Nothing has been sent yet.">
        <Text style={styles.cardNote}>Nothing has been sent yet. Open SEND at the bottom.</Text>
      </InfoCard>
    );
  }
  const out = netOutcome(last.send, last.seenBefore, last.idCheck);
  const here = netEffectWords(last.send, out.here, out.second);
  const there = netEffectWords(last.send, out.there, out.second);
  const message = `${netMessageWords(last.send)}${last.seenBefore ? ' · delivered again' : ''}`;
  return (
    <InfoCard head="ONE MESSAGE, TWO MACHINES" a11y={`One message, two machines. The message: ${message}. The ID check was ${last.idCheck ? 'on' : 'off'}. Your machine: ${here} The other player’s machine: ${there}`}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.machines}>
        <Machine title="YOUR MACHINE" listener="Listener: you" effect={out.here} words={here} />
        <Machine title="THE OTHER MACHINE" listener="Listener: the guide" effect={out.there} words={there} />
      </View>
      <Text style={styles.cardNote}>ID CHECK was {last.idCheck ? 'ON' : 'OFF'}. This page runs only your machine. The right-hand side applies the same rule from the other player’s side.</Text>
    </InfoCard>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [last, setLast] = useState<Sent | null>(null);
  const [check, setCheck] = useState(false);

  const onSend = (send: NetSend) => {
    const g = gaGet();
    setLast({ send, seenBefore: g.netSeen.includes(send.id), idCheck: g.options.dedupe });
    gaDispatch({ type: 'net', id: send.id, what: send.what, to: send.to });
  };

  const goals = [
    { label: 'Send an action again and see it ignored', hit: since('netDuplicateIgnored') > 0 },
    { label: 'Get a double with ID CHECK off', hit: since('netDoublePlayed') > 0 },
    { label: 'Send one alert to you and one to the other player', hit: since('netPrivateMe') > 0 && since('netPrivateOther') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const sendKey: DockParam = {
    kind: 'group',
    id: 'net',
    label: 'SEND',
    valueLabel: last ? last.send.id : 'NONE',
    valueA11y: last ? `last action sent: ${netMessageWords(last.send)}` : 'no action sent yet',
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
        readouts: [
          { k: 'ID CHECK', v: s.options.dedupe ? 'ON' : 'OFF', vA11y: s.options.dedupe ? 'repeated action ids are ignored' : 'repeated action ids are handled again' },
          { k: 'LAST ID', v: last ? last.send.id : '—', vA11y: last ? `last action id ${last.send.id}` : 'no action sent yet' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Two players share this world: you, and the guide, who stands in for the other player with a separate machine and separate ears.</Look>
        <P>A networked game usually does not send sound. It sends what HAPPENED, for example “door opened, action A1”. Each player’s machine then plays the sound itself, for its own listener, at its own distance and direction. So there is no single shared mix: each machine makes its own.</P>
        <P>Live voice chat is the exception. There, real audio travels between players. In proximity voice chat you hear only the players whose characters are near yours. Several players on one screen need the same care: more than one listener, one set of speakers.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open SEND and press DOOR · NEW ID. Then press the AGAIN chip to deliver the same action a second time.</Do>
        <P>The new action moves the door in the picture and plays its sound. A network sometimes delivers a message twice, and your own action can come back to you as a second copy. With ID CHECK on, the log reads “already handled, ignored”: one action, one sound.</P>
        <TwoMachines last={last} />
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Switch ID CHECK off and send the same action again. Then send ALERT TO YOU and ALERT TO OTHER, and press CHAT LINE.</Do>
        <P>With the check off, the door sound plays a second time and the log says so. The door itself does not move again. An alert for you plays an interface cue here. An alert for the other player plays nothing here: it belongs to the other machine.</P>
        <P>The chat line is a stand-in sound for live chat. In this scene the chat line does not turn the game down. This page has no server: it imitates messages arriving.</P>
        <Note tone="mistake">Treating multiplayer audio as one shared mix, or letting a local action and its network copy both trigger the sound.</Note>
      </Step>
      <Step n={4}>
        <P>Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You open a door. Your machine plays the door sound immediately. A moment later the network delivers your own action back to you with the same id. What should your machine do?"
          options={[
            'See that the id was already handled, and play nothing more',
            'Play the door again, so that both players hear it',
            'Wait for the audio of the door to arrive from the server',
            'Stop the first sound and play the copy from the network',
          ]}
          correct={0}
          explain="One action gets one sound per listener. The id shows that this action was already handled here, so the copy is ignored."
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
