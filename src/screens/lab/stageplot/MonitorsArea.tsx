/**
 * MonitorsArea — the MONITORS work area of the Stage Plot and Channel
 * Designer (must-do D60): monitor mixes, monitor devices, and what each
 * performer needs to hear.
 *
 * THE ONE IDEA THIS AREA MUST MAKE UNMISTAKABLE (owner's handoff, §5):
 * A MIX IS NOT A DEVICE. A mix is what a performer hears; a wedge, a receiver
 * pack or a headphone amplifier is equipment that plays it. So:
 *
 *   • THREE SEPARATE COUNTS sit at the top, each in its own box with its own
 *     sentence: mixes · monitor feed audio channels ASKED OF THE HOUSE
 *     CONSOLE (mono 1, stereo 2) · monitor devices by type. They are never
 *     added together. The middle number holds only what the house console is
 *     asked to create: the audio channels of a mix the band creates in its
 *     own rig are written apart, under it, and are never added into it.
 *   • THE MIX LIST AND THE DEVICE LIST ARE TWO LISTS, in two sections. Several
 *     devices can share one mix; adding a device never adds a mix.
 *   • WHO CREATES A MIX is shown apart: what the HOUSE console is asked to
 *     create, what the band creates in its own rig, what is made on a
 *     personal mixer system (each with what the venue provides for it), and
 *     what is still to be confirmed.
 *   • WHAT A MIX NEEDS TO HEAR is four words for each input (a preference
 *     given before the show, never a fader or a number), one mix at a time.
 *   • A click, cue or talkback input carries the MONITOR ONLY label wherever
 *     it appears here.
 *
 * Every number is read from spDerive through monitors/monitorPlan each
 * render; nothing here stores a count. Every edit goes through the editor's
 * `apply` with spModel functions, so it is saved and can be undone.
 *
 * One popup (`Sheet`) serves the whole area and swaps its body: mix editor,
 * new mix, device editor, new device.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SP_DELIVERY_WORD } from '../../../features/stageplot/spCatalog';
import { spMonitorTotals } from '../../../features/stageplot/spDerive';
import { spRenumberMixes, spUpdatePerformer } from '../../../features/stageplot/spModel';
import type { SpIssue, SpIssueAction } from '../../../features/stageplot/spReview';
import type { SpDevice, SpId, SpMix } from '../../../features/stageplot/spTypes';
import { runSoon, type SoonHandle } from '../../../lib/afterInteractions';
import { cardColumn } from '../../../theme/readingColumn';
import { useSpEditor, type SpSelection } from './spContext';
import { Button, Count, HelpTip, IssueList, Note, RowCard, Section, Sheet } from './spForm';
import { goToIssue, runIssueAction } from './spIssueActions';
import { AudienceTag, Box, ButtonRow, FactTags, GroupHeading, Line } from './monitors/bits';
import { DeviceBody, NewDeviceBody } from './monitors/DeviceSheets';
import { MixBody, NewMixBody } from './monitors/MixSheets';
import { NeedsPanel } from './monitors/NeedsPanel';
import {
  SPM_CUE_MEANS,
  SPM_FEED_RULE,
  spmChannelWord,
  spmClickNotes,
  spmCodesInOrder,
  spmCounts,
  spmCueLines,
  spmDeviceFacts,
  spmDeviceGroups,
  spmDeviceStage,
  spmDeviceTags,
  spmDeviceTitle,
  spmFormatWord,
  spmMixDevicesLine,
  spmMixGroups,
  spmMixTitle,
  spmNoMonitorByChoice,
  spmPerformerName,
  spmRecipients,
  spmShareLine,
  spmUnmonitored,
} from './monitors/monitorPlan';

/** The selection this area itself handed to the stage (PLACE ON THE STAGE for
 *  a device with no symbol yet), so coming back by the tab does not open that
 *  device's popup again. It is compared by IDENTITY: the Stage area's own
 *  "GO TO THIS DEVICE" makes a new selection, and that one does open here.
 *  Kept outside the component because the area is taken off the screen while
 *  another area is in view. */
let sentAway: SpSelection = null;

/** What the area's one popup is showing. `fromMix`: the mix editor the
 *  device popup was opened from, to return to. */
type Popup = { kind: 'mix'; id: SpId } | { kind: 'device'; id: SpId; fromMix?: SpId } | { kind: 'new-mix'; recipients: SpId[] } | { kind: 'new-device'; mixId: SpId | null; fromMix?: SpId } | null;

const MIX_OR_DEVICE =
  'A mix is what a performer hears.\n\n' +
  'A monitor device is the equipment that plays or receives it. It can be a wedge, a wireless in-ear transmitter, a receiver pack, a wired headphone amplifier or a fill.\n\n' +
  'Several devices can share one mix. Two wedges on the same mix are still one mix. So this area counts three things separately. They are mixes, monitor feed audio channels asked of the house console, and monitor devices by type.\n\n' +
  'A mono mix is 1 audio channel. A stereo mix is 2. A console may show a stereo mix as one linked strip, so the plan says “audio channels”.\n\n' +
  'Only a mix that the house console creates is asked of the house console. A mix your band creates in its own rig is shown apart. It is never added to that number.';

function MixCard({ mix, selected, onEdit, onNeeds }: { mix: SpMix; selected: boolean; onEdit: () => void; onNeeds: () => void }) {
  const { project: p } = useSpEditor();
  const title = spmMixTitle(mix);
  const share = spmShareLine(p, mix);
  return (
    <RowCard title={title} subtitle={`For ${spmRecipients(p, mix)}`} selected={selected}>
      <FactTags items={[spmFormatWord(mix.format), SP_DELIVERY_WORD[mix.delivery]]} />
      <Line tone="dim">{spmMixDevicesLine(p, mix)}</Line>
      {share ? <Line tone="dim">{share}</Line> : null}
      {mix.instructions.length ? <Line tone="dim">{`Instructions: ${mix.instructions.join(' · ')}`}</Line> : null}
      {mix.outputs.trim() ? <Line tone="dim">{`Requested outputs: ${mix.outputs.trim()}`}</Line> : null}
      {mix.notes.trim() ? <Line tone="dim">{`Notes: ${mix.notes.trim()}`}</Line> : null}
      {spmClickNotes(p, mix).map((text) => (
        <Note key={text} tone="warning">
          {text}
        </Note>
      ))}
      <ButtonRow>
        <Button label="EDIT MIX" onPress={onEdit} a11yLabel={`Edit the mix ${title}`} />
        <Button label="WHAT IT NEEDS TO HEAR" onPress={onNeeds} a11yLabel={`Choose what ${title} needs to hear`} />
      </ButtonRow>
    </RowCard>
  );
}

function DeviceCard({ device, selected, onEdit, onLocate }: { device: SpDevice; selected: boolean; onEdit: () => void; onLocate: () => void }) {
  const { project: p } = useSpEditor();
  const title = spmDeviceTitle(device);
  const stage = spmDeviceStage(p, device.id);
  return (
    <RowCard title={title} subtitle={spmDeviceFacts(p, device)} selected={selected}>
      <FactTags items={spmDeviceTags(device)} />
      {device.model.trim() ? <Line tone="dim">{`Model: ${device.model.trim()}`}</Line> : null}
      {device.note.trim() ? <Line tone="dim">{`Notes: ${device.note.trim()}`}</Line> : null}
      <Line tone="dim">{stage.objectId ? `On the stage: ${stage.word}.` : `${stage.word}.`}</Line>
      <ButtonRow>
        <Button label="EDIT DEVICE" onPress={onEdit} a11yLabel={`Edit the device ${title}`} />
        <Button label={stage.objectId ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'} onPress={onLocate} a11yLabel={stage.objectId ? `Show ${title} on the stage` : `Go to the Stage area to place ${title}`} />
      </ButtonRow>
    </RowCard>
  );
}

export function MonitorsArea() {
  const ed = useSpEditor();
  const p = ed.project;
  const { selection, select } = ed;
  const insets = useSafeAreaInsets();

  const totals = useMemo(() => spMonitorTotals(p), [p]);
  const counts = useMemo(() => spmCounts(totals), [totals]);
  const mixGroups = useMemo(() => spmMixGroups(p, totals), [p, totals]);
  const deviceGroups = useMemo(() => spmDeviceGroups(p, totals), [p, totals]);
  const cueLines = useMemo(() => spmCueLines(p), [p]);
  const byChoice = useMemo(() => spmNoMonitorByChoice(p), [p]);
  const questions = useMemo(() => ed.issues.filter((i) => i.area === 'monitors'), [ed.issues]);

  const [popup, setPopup] = useState<Popup>(null);
  /** The mix the needs grid is showing (the first mix until one is chosen). */
  const [needsMix, setNeedsMix] = useState<SpId | null>(null);
  /** The row last opened, so it stays marked after its popup closes. */
  const [marked, setMarked] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  const needsY = useRef(0);
  const soon = useRef<SoonHandle | null>(null);
  useEffect(() => () => soon.current?.cancel(), []);
  /** The selection (from another area) that the open popup answers. */
  const answering = useRef<SpSelection>(null);

  const openMix = (id: SpId) => {
    setMarked(`mix:${id}`);
    setPopup({ kind: 'mix', id });
  };
  const openDevice = (id: SpId, fromMix?: SpId) => {
    setMarked(`device:${id}`);
    setPopup({ kind: 'device', id, fromMix });
  };
  const close = () => {
    setPopup(null);
    // The row another area sent us to has been seen: coming back here later
    // must not open it again. (A selection that belongs to another area, such
    // as an object on the stage, is left alone.)
    if (selection && selection === answering.current) select(null);
    answering.current = null;
    sentAway = null;
  };

  // A row selected from another area opens here: a mix or a device ("GO TO",
  // "Choose its mix", a monitor symbol on the stage), and a performer who has
  // no monitor yet ("Add a monitor mix", "GO TO MONITORS" from the stage) gets
  // the ADD A MIX popup with that performer already on it.
  useEffect(() => {
    // A device this area itself sent to the stage is not opened again when
    // the user comes back.
    if (!selection || selection === sentAway) return;
    sentAway = null;
    if (selection.kind === 'mix') openMix(selection.id);
    else if (selection.kind === 'device') openDevice(selection.id);
    else if (selection.kind === 'performer' && spmUnmonitored(p).some((pf) => pf.id === selection.id)) setPopup({ kind: 'new-mix', recipients: [selection.id] });
    else return;
    answering.current = selection;
    // Runs when the area opens and whenever another row is selected.
  }, [selection]);

  const showNeeds = (mixId: SpId) => {
    setNeedsMix(mixId);
    close();
    soon.current?.cancel();
    soon.current = runSoon(() => scrollRef.current?.scrollTo({ y: Math.max(0, needsY.current - 8), animated: false }));
  };
  const onNeedsLayout = (e: LayoutChangeEvent) => {
    needsY.current = e.nativeEvent.layout.y;
  };

  const locate = (device: SpDevice) => {
    const stage = spmDeviceStage(p, device.id);
    setPopup(null);
    answering.current = null;
    if (stage.objectId) {
      ed.goTo('stage', { kind: 'object', id: stage.objectId });
      return;
    }
    // Not on the stage yet: the stage is told which device this is about,
    // and offers to place it.
    sentAway = { kind: 'device', id: device.id };
    ed.goTo('stage', sentAway);
  };

  // "GO TO" on a question: a mix or a device opens here (through the
  // selection); a performer's own row is in Setup.
  const goToQuestion = (issue: SpIssue) => {
    const { kind, id } = issue.target;
    if (kind === 'performer' && id) ed.goTo('setup', { kind: 'performer', id });
    else goToIssue(ed, issue);
  };
  // An answer to a question. "Add a monitor mix" opens the same ADD A MIX
  // popup as the button, with the performer on it, so the usual devices are
  // proposed before anything is added. Every other answer is the lab's own.
  const answerQuestion = (issue: SpIssue, action: SpIssueAction) => {
    const { kind, id } = issue.target;
    if (action === 'add-mix' && kind === 'performer' && id) setPopup({ kind: 'new-mix', recipients: [id] });
    else runIssueAction(ed, issue, action);
  };

  // The one popup and its body.
  const mixOpen = popup?.kind === 'mix' ? p.mixes.find((m) => m.id === popup.id) : undefined;
  const deviceOpen = popup?.kind === 'device' ? p.devices.find((d) => d.id === popup.id) : undefined;
  let popupTitle = '';
  let popupBody: ReactNode = null;
  if (popup?.kind === 'new-mix') {
    popupTitle = 'Add a mix';
    popupBody = (
      <NewMixBody
        key={`new-mix:${popup.recipients.join(',')}`}
        recipients={popup.recipients}
        onClose={close}
        onAdded={(id) => {
          setMarked(`mix:${id}`);
          close();
        }}
      />
    );
  } else if (popup?.kind === 'new-device') {
    const fromMix = popup.fromMix;
    popupTitle = 'Add a device';
    popupBody = <NewDeviceBody key="new-device" mixId={popup.mixId} onClose={() => (fromMix ? openMix(fromMix) : close())} onAdded={(id) => openDevice(id, fromMix)} />;
  } else if (mixOpen) {
    popupTitle = `Mix ${spmMixTitle(mixOpen)}`;
    popupBody = <MixBody key={`mix:${mixOpen.id}`} mix={mixOpen} onClose={close} onNeeds={showNeeds} onAddDevice={(mixId) => setPopup({ kind: 'new-device', mixId, fromMix: mixId })} onOpenDevice={(id) => openDevice(id, mixOpen.id)} />;
  } else if (deviceOpen && popup?.kind === 'device') {
    const fromMix = popup.fromMix;
    popupTitle = `Device: ${spmDeviceTitle(deviceOpen)}`;
    popupBody = <DeviceBody key={`device:${deviceOpen.id}`} device={deviceOpen} onDone={() => (fromMix && p.mixes.some((m) => m.id === fromMix) ? openMix(fromMix) : close())} onLocate={() => locate(deviceOpen)} />;
  }

  const nothingYet = !p.mixes.length && !p.devices.length;

  return (
    <>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <View style={[cardColumn, styles.column]}>
          <Section title="MONITOR PLAN" hint="Three separate numbers. A mix is what a performer hears. A monitor device is the equipment that plays it.">
            <Box>
              <View style={styles.counts}>
                <Count value={counts.mixes} label={counts.mixes === 1 ? 'mix in the plan' : 'mixes in the plan'} />
              </View>
              <Line>{counts.mixLine}</Line>
            </Box>
            <Box>
              <View style={styles.counts}>
                <Count value={counts.houseFeedChannels} label={counts.houseFeedChannels === 1 ? 'monitor feed audio channel asked of the house console' : 'monitor feed audio channels asked of the house console'} />
              </View>
              <Line>{counts.feedLine}</Line>
              <Line tone="dim">{SPM_FEED_RULE}</Line>
              {counts.apartLines.map((text) => (
                <Line key={text} tone="dim">
                  {text}
                </Line>
              ))}
            </Box>
            <Box>
              <GroupHeading>MONITOR DEVICES, BY TYPE</GroupHeading>
              {counts.byType.length ? (
                <View style={styles.counts}>
                  {counts.byType.map((x) => (
                    <Count key={x.type} value={x.n} label={x.label} />
                  ))}
                </View>
              ) : null}
              <Line>{counts.deviceLine}</Line>
            </Box>
            {nothingYet ? <Note>There is no monitor plan yet. Use ADD A MIX for each different thing a performer needs to hear. Then add the devices that play it.</Note> : null}
            <HelpTip title="Mix or device: what is the difference?" body={MIX_OR_DEVICE} />
          </Section>

          {questions.length ? (
            <Section title="QUESTIONS ABOUT MONITORS" hint="Answer them here. A question you leave is printed in the packet as unresolved.">
              <IssueList issues={questions} onGoTo={goToQuestion} onAction={answerQuestion} />
            </Section>
          ) : null}

          <Section title="MIXES" hint="What each performer hears, grouped by who creates the mix." right={<Button label="ADD A MIX" tone="primary" onPress={() => setPopup({ kind: 'new-mix', recipients: [] })} a11yLabel="Add a monitor mix" />}>
            {mixGroups.length ? (
              mixGroups.map((g) => (
                <View key={g.key} style={styles.group}>
                  <GroupHeading>{g.title}</GroupHeading>
                  <Line>{g.sentence}</Line>
                  {g.notes.map((text) => (
                    <Line key={text} tone="dim">
                      {text}
                    </Line>
                  ))}
                  {g.mixes.map((m) => (
                    <MixCard key={m.id} mix={m} selected={marked === `mix:${m.id}`} onEdit={() => openMix(m.id)} onNeeds={() => showNeeds(m.id)} />
                  ))}
                </View>
              ))
            ) : (
              <Note>No mixes yet. Performers who hear the same thing can share one mix.</Note>
            )}
            {spmCodesInOrder(p) ? null : (
              <View style={styles.group}>
                <Line tone="dim">A mix keeps its label when another mix is removed, so the labels now skip a number. Renumber them only if nobody has this stage plot yet.</Line>
                <Button label="RENUMBER THE MIX LABELS" onPress={() => ed.apply((cur) => spRenumberMixes(cur))} a11yLabel="Renumber the mix labels M1, M2, M3 in their order on this list" />
              </View>
            )}
          </Section>

          <Section
            title="MONITOR DEVICES"
            hint="The equipment that plays or receives a mix. A separate list: adding a device does not add a mix."
            right={<Button label="ADD A DEVICE" tone="primary" onPress={() => setPopup({ kind: 'new-device', mixId: null })} a11yLabel="Add a monitor device" />}
          >
            {deviceGroups.length ? (
              deviceGroups.map((g) => (
                <View key={g.type} style={styles.group}>
                  <GroupHeading>{g.heading}</GroupHeading>
                  <Line tone="dim">{g.brings}</Line>
                  {g.devices.map((d) => (
                    <DeviceCard key={d.id} device={d} selected={marked === `device:${d.id}`} onEdit={() => openDevice(d.id)} onLocate={() => locate(d)} />
                  ))}
                </View>
              ))
            ) : (
              <Note>No monitor devices yet. Wedges, in-ear transmitters, receiver packs, headphone amplifiers and fills are listed here.</Note>
            )}
          </Section>

          <View onLayout={onNeedsLayout}>
            <Section title="WHAT EACH MIX NEEDS TO HEAR" hint="Four words for each input. Not faders, not numbers.">
              <NeedsPanel mixId={needsMix} onPickMix={setNeedsMix} />
            </Section>
          </View>

          <Section title="CLICK, CUE AND TALKBACK" hint={`${SPM_CUE_MEANS} They start as monitor only, and as “Must exclude” in every mix.`}>
            {cueLines.length ? (
              cueLines.map((c) => (
                <View key={c.inputId} style={styles.cue}>
                  <Line tone="strong">{`${c.label} · ${spmChannelWord(c.badge)}`}</Line>
                  <AudienceTag text={c.audienceLabel} />
                  <Line tone="dim">{c.heard}</Line>
                  <Button label="GO TO THIS INPUT" onPress={() => ed.goTo('inputs', { kind: 'input', id: c.inputId })} a11yLabel={`Go to the input ${c.label} in the Inputs area`} />
                </View>
              ))
            ) : (
              <>
                <Note>There is no click, cue or talkback input in the input list. Add one in INPUTS if your band uses one.</Note>
                <Button label="GO TO INPUTS" onPress={() => ed.goTo('inputs')} a11yLabel="Go to the Inputs area" />
              </>
            )}
            <Line tone="dim">This plan records what you intend. It does not control a real mixer.</Line>
          </Section>

          {byChoice.length ? (
            <Section title="NO MONITOR, BY CHOICE" hint="You said these performers need no monitor.">
              {byChoice.map((pf) => {
                const name = spmPerformerName(pf);
                return (
                  <RowCard
                    key={pf.id}
                    title={name}
                    subtitle="No monitor is intended."
                    right={<Button label="ASK AGAIN" onPress={() => ed.apply((cur) => spUpdatePerformer(cur, pf.id, { noMonitor: null }))} a11yLabel={`Ask again whether ${name} needs a monitor`} />}
                  />
                );
              })}
            </Section>
          ) : null}
        </View>
      </ScrollView>
      <Sheet visible={!!popupBody} title={popupTitle} onClose={close}>
        {popupBody}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12 },
  column: { gap: 22 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { gap: 10 },
  cue: { gap: 8 },
});
