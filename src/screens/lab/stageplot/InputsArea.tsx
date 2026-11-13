/**
 * InputsArea — the INPUTS work area of the Stage Plot and Channel Designer
 * (must-do D60): the connected input list, its order, the DI devices and the
 * equipment summary. One view of the one stage plot.
 *
 * A band member who is not an engineer builds a basic list without opening
 * MORE DETAILS: ADD A SOURCE, pick a package, read its rows, add them. The
 * list is a phone screen, not a spreadsheet: each input is a card (number,
 * name, performer and place, capture and stand, with L / R and MONITOR ONLY
 * as words), a tap opens its editor in a popup, and the ▲ ▼ buttons change
 * the order, a stereo pair moving as one.
 *
 * Every edit goes through the editor's `apply` with spModel functions, and
 * every count is read from spDerive when it is drawn. What the area decides
 * (preview rows, typed reserved channels, moves, summary text) is in the pure
 * inputs/inputsLogic.ts, tested by test/stagePlotInputs.test.ts.
 *
 * EVERY REVIEW CARD LEADS TO ITS ROW. A question, a correction or a "to be
 * confirmed" detail about an input, a source, a DI device or a listed item
 * opens that row here, whichever area the card was pressed in. An answer
 * that would change a shared revision (RENUMBER THIS LIST) asks first.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spPackage } from '../../../features/stageplot/spCatalog';
import { spBadge } from '../../../features/stageplot/spDerive';
import { spAddExtra, spInput, spPatch, spPatchesOf, spSource } from '../../../features/stageplot/spModel';
import type { SpIssue, SpIssueAction } from '../../../features/stageplot/spReview';
import type { SpId, SpPatchId } from '../../../features/stageplot/spTypes';
import { confirmDialog } from '../../../lib/confirm';
import { cardColumn } from '../../../theme/readingColumn';
import { AddMenu, PackagePicker, PackagePreview, QuietSource, SingleInput, type AddKind } from './inputs/AddSheets';
import { SheetBody, Small, bitStyles } from './inputs/bits';
import { DiEditor, DiPanel } from './inputs/DiPanel';
import { InputEditor, PairMonoStep } from './inputs/InputEditor';
import { InputBlock } from './inputs/InputRow';
import { SP_EXTRA_WORD, spBrokenPairDi, spInSentence, spInputQuestions, spMoveRow, spRowBlocks, spSharedNotice, spSourcesWithoutInputs } from './inputs/inputsLogic';
import { OrderPanel } from './inputs/OrderPanel';
import { SourceEditor } from './inputs/SourceEditor';
import { ExtraEditor, ExtrasPanel, SummaryPanel } from './inputs/SummaryPanel';
import { useSpEditor } from './spContext';
import { Button, Choice, Count, HelpTip, IssueList, Note, RowCard, Section, Sheet } from './spForm';
import { runIssueAction } from './spIssueActions';

type Popup =
  | { k: 'input'; id: SpId }
  | { k: 'source'; id: SpId }
  | { k: 'add' }
  | { k: 'packages'; sourceId: SpId | null }
  | { k: 'preview'; packageId: string; sourceId: SpId | null }
  | { k: 'single' }
  | { k: 'quiet' }
  | { k: 'di'; id: SpId }
  | { k: 'extra'; id: SpId }
  | { k: 'mono'; id: SpId }
  | { k: 'riser' }
  | null;

/** The rows this area owns: a selection of one of these kinds opens here. */
const MINE = ['input', 'source', 'di', 'extra'] as const;
const isMine = (kind: string): kind is (typeof MINE)[number] => (MINE as readonly string[]).includes(kind);

/** The row this area sent to the stage (PLACE ON THE STAGE for an input that
 *  is not drawn yet): it is not opened again when the user comes back. */
let sentAway = '';

export function InputsArea() {
  const ed = useSpEditor();
  const p = ed.project;
  const { selection, select } = ed;

  const [wanted, setWanted] = useState<SpPatchId>('house');
  const [popup, setPopup] = useState<Popup>(null);
  /** The rows last opened or added, so they stay marked after the popup closes. */
  const [marked, setMarked] = useState<ReadonlySet<string>>(() => new Set());

  const band = spPatch(p, 'band');
  const house = spPatch(p, 'house');
  // A stage plot whose inputs all feed the band's own rig still shows a list.
  const patchId: SpPatchId = band && (wanted === 'band' || !house?.order.length) ? 'band' : 'house';
  const patch = spPatch(p, patchId);
  const blocks = useMemo(() => spRowBlocks(p, patchId), [p, patchId]);
  const quiet = useMemo(() => spSourcesWithoutInputs(p), [p]);
  const questions = useMemo(() => spInputQuestions(ed.issues), [ed.issues]);
  const rowCount = patch?.order.length ?? 0;

  const openInput = (id: SpId) => {
    const input = spInput(p, id);
    if (input && !spPatchesOf(input).includes(patchId)) setWanted(spPatchesOf(input)[0]);
    setMarked(new Set([id]));
    setPopup({ k: 'input', id });
  };
  const openSource = (id: SpId) => {
    setMarked(new Set(p.inputs.filter((i) => i.sourceId === id).map((i) => i.id)));
    setPopup({ k: 'source', id });
  };
  const openDi = (id: SpId) => {
    setMarked(new Set([id]));
    setPopup({ k: 'di', id });
  };
  const openExtra = (id: SpId) => {
    setMarked(new Set([id]));
    setPopup({ k: 'extra', id });
  };
  const close = () => {
    setPopup(null);
    // The row another area sent us to has been seen: coming back here later
    // must not open it again. A selection that belongs to another area (an
    // object on the stage, a mix) is left alone.
    if (selection && isMine(selection.kind)) select(null);
    sentAway = '';
  };

  // An input, a source, a DI device or a listed item selected from another
  // area (GO TO, ADD ITS INPUTS, a symbol on the stage) opens here.
  const selKey = selection ? `${selection.kind}:${selection.id}` : '';
  useEffect(() => {
    if (!selection || !isMine(selection.kind)) {
      sentAway = '';
      return;
    }
    if (selKey === sentAway) return;
    if (selection.kind === 'input') openInput(selection.id);
    else if (selection.kind === 'source') openSource(selection.id);
    else if (selection.kind === 'di') openDi(selection.id);
    else openExtra(selection.id);
    // `selKey` is the selection: the effect runs when the selected row changes.
  }, [selKey]);

  const move = (id: SpId, by: -1 | 1) => ed.apply((q) => spMoveRow(q, patchId, id, by));

  /** PLACE ON THE STAGE for a row that is not drawn yet tells the stage which
   *  row it is about, and remembers that this area sent it. */
  const sentToStage = (key: string) => {
    setPopup(null);
    sentAway = key;
  };

  const goToIssue = (issue: SpIssue) => {
    const t = issue.target;
    if (issue.area !== 'inputs') {
      runIssueAction(ed, issue, 'edit');
      return;
    }
    if (t.patchId) setWanted(t.patchId);
    if ((t.kind === 'input' || t.kind === 'patch') && t.id) openInput(t.id);
    else if (t.kind === 'source' && t.id) openSource(t.id);
    else if (t.kind === 'di' && t.id) openDi(t.id);
    else if (t.kind === 'extra' && t.id) openExtra(t.id);
    else if (issue.rule === 'riser-not-listed') setPopup({ k: 'riser' });
  };
  const answer = (issue: SpIssue, action: SpIssueAction) => {
    const id = issue.target.id;
    if (action === 'edit') goToIssue(issue);
    else if (action === 'add-inputs' && issue.target.kind === 'source' && id) setPopup({ k: 'packages', sourceId: id });
    else if (action === 'pair-mono' && id && spBrokenPairDi(p, id)) {
      // The side that is left sits on a stereo DI device: what happens to
      // the device is the band's choice, asked before anything changes.
      setMarked(new Set([id]));
      setPopup({ k: 'mono', id });
    } else if (action === 'renumber') {
      // A shared revision is never renumbered in silence.
      const shared = spSharedNotice(p);
      if (shared) confirmDialog('Renumber a shared stage plot?', shared, 'Renumber', () => runIssueAction(ed, issue, action));
      else runIssueAction(ed, issue, action);
    } else runIssueAction(ed, issue, action);
  };

  const pickAdd = (kind: AddKind) => setPopup(kind === 'package' ? { k: 'packages', sourceId: null } : kind === 'single' ? { k: 'single' } : { k: 'quiet' });
  const addRiser = () => {
    const row = { kind: 'riser', label: SP_EXTRA_WORD.riser } as const;
    const made = spAddExtra(p, row);
    ed.apply((q) => spAddExtra(q, row).p);
    openExtra(made.id);
  };

  // The one popup and its body.
  let title = '';
  let body: ReactNode = null;
  if (popup?.k === 'input') {
    const input = spInput(p, popup.id);
    title = input ? `${spBadge(p, input.id)} · ${input.label}` : 'Input';
    body = (
      <InputEditor
        key={`input:${popup.id}`}
        inputId={popup.id}
        onClose={close}
        onLeaveForStage={() => sentToStage(`input:${popup.id}`)}
        onOpenInput={openInput}
        onOpenSource={openSource}
        onOpenDi={openDi}
      />
    );
  } else if (popup?.k === 'source') {
    title = `Source: ${spSource(p, popup.id)?.label ?? ''}`;
    body = (
      <SourceEditor
        key={`source:${popup.id}`}
        sourceId={popup.id}
        onClose={close}
        onLeaveForStage={() => sentToStage(`source:${popup.id}`)}
        onOpenInput={openInput}
        onAddPackage={(sourceId) => setPopup({ k: 'packages', sourceId })}
      />
    );
  } else if (popup?.k === 'add') {
    title = 'Add a source';
    body = <AddMenu key="add" onPick={pickAdd} />;
  } else if (popup?.k === 'packages') {
    const sourceId = popup.sourceId;
    title = 'Choose a package';
    body = <PackagePicker key="packages" sourceId={sourceId} onPick={(packageId) => setPopup({ k: 'preview', packageId, sourceId })} onBack={sourceId ? undefined : () => setPopup({ k: 'add' })} />;
  } else if (popup?.k === 'preview') {
    const sourceId = popup.sourceId;
    title = spPackage(popup.packageId)?.name ?? 'Package';
    body = (
      <PackagePreview
        key={`preview:${popup.packageId}`}
        packageId={popup.packageId}
        sourceId={sourceId}
        onBack={() => setPopup({ k: 'packages', sourceId })}
        onAdded={(ids) => {
          setMarked(new Set(ids));
          setPopup(null);
        }}
      />
    );
  } else if (popup?.k === 'single') {
    title = 'Add one input';
    body = <SingleInput key="single" onAdded={openInput} />;
  } else if (popup?.k === 'quiet') {
    title = 'No sound system connection needed';
    body = <QuietSource key="quiet" onAdded={openSource} />;
  } else if (popup?.k === 'di') {
    title = `DI device: ${p.diDevices.find((d) => d.id === popup.id)?.label ?? ''}`;
    body = <DiEditor key={`di:${popup.id}`} deviceId={popup.id} onClose={close} />;
  } else if (popup?.k === 'extra') {
    const extra = p.extras.find((e) => e.id === popup.id);
    title = extra ? extra.label.trim() || SP_EXTRA_WORD[extra.kind] : 'Listed item';
    body = <ExtraEditor key={`extra:${popup.id}`} extraId={popup.id} onClose={close} />;
  } else if (popup?.k === 'mono') {
    const input = spInput(p, popup.id);
    title = input ? `Make ${input.label} a mono request` : 'Make it a mono request';
    body = (
      <SheetBody key={`mono:${popup.id}`}>
        <Note tone="warning">The other side of this stereo pair is gone. Before it becomes a mono request, choose what happens to its stereo DI device.</Note>
        <PairMonoStep inputId={popup.id} onDone={close} />
        <Button label="KEEP IT AS IT IS" tone="plain" onPress={close} />
      </SheetBody>
    );
  } else if (popup?.k === 'riser') {
    title = 'A riser on the stage';
    body = (
      <SheetBody key="riser">
        <Note>A riser is drawn on your stage, and no riser is in your list for the venue. List it, so the venue knows who brings it and what size you need.</Note>
        <Button label="ADD: RISER" tone="primary" onPress={addRiser} a11yLabel="Add a riser to the listed items and open it" />
        <Button label="CLOSE" tone="plain" onPress={close} />
      </SheetBody>
    );
  }

  const listName = spInSentence(patch?.name ?? 'House system');

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[cardColumn, styles.column]}>
          {questions.length ? (
            <Section title="QUESTIONS ABOUT THE INPUTS" hint="Each one has its answers. Answering them prepares your stage plot. It does not mean the venue has agreed.">
              <IssueList issues={questions} onGoTo={goToIssue} onAction={answer} />
            </Section>
          ) : null}

          <Section title="INPUT LIST" hint="One row is one input: one audio channel that reaches a mixer. A source is one instrument or one voice. Tap a row to change it.">
            <HelpTip
              title="An input and a source"
              body="A source is one instrument or one voice. An input is one audio channel that reaches a mixer (also called a console). A drum kit is one source and may need six inputs. An acoustic instrument that needs no sound system has no input, and it still appears on your stage."
            />
            <HelpTip
              title="Mono and stereo"
              body="A mono source needs one input. A stereo source needs two, left and right, even when a console shows them as one linked strip. L and R name the two audio channels. They are not taken from where things are drawn."
            />
            <HelpTip
              title="A microphone and a DI"
              body="A microphone picks up sound in the air. A DI (direct box) takes the signal from an instrument’s output and sends it to the mixer as a balanced connection. A DI can be passive or active, and an active one may run on a battery or on phantom power: electricity that the mixer sends through the cable. The tool never guesses which. You say what you know, and the rest stays to be confirmed."
            />
            <Button label="ADD A SOURCE" tone="primary" onPress={() => setPopup({ k: 'add' })} a11yLabel="Add a source: a package, one input, or a source with no connection" />
            {band ? (
              <Choice<SpPatchId>
                label="Input list for"
                value={patchId}
                options={[
                  { value: 'house', label: `${house?.name ?? 'House system'} (${house?.order.length ?? 0})` },
                  { value: 'band', label: `${band.name} (${band.order.length})` },
                ]}
                onChange={setWanted}
                hint="Each system has its own channel numbers. The same number in both lists is not a clash."
              />
            ) : null}
            {rowCount ? (
              <View style={bitStyles.counts}>
                <Count value={rowCount} label={`${rowCount === 1 ? 'input' : 'inputs'} in the ${listName} list`} />
              </View>
            ) : null}
            {blocks.length ? (
              <View style={styles.list}>
                {blocks.map((block) => (
                  <InputBlock key={block.rows[0].id} block={block} selectedIds={marked} onOpen={openInput} onMove={move} />
                ))}
              </View>
            ) : (
              <Note>{p.inputs.length ? `No input feeds the ${listName}.` : 'No inputs yet. Add a source to start your list: a package adds the usual rows for one source, and you can change every row.'}</Note>
            )}
            {blocks.length > 6 ? <Button label="ADD A SOURCE" onPress={() => setPopup({ k: 'add' })} a11yLabel="Add a source: a package, one input, or a source with no connection" /> : null}
          </Section>

          {quiet.length ? (
            <Section title="SOURCES WITH NO INPUT" hint="On your stage and in your packet, and not counted as inputs.">
              {quiet.map((s) => (
                <RowCard
                  key={s.id}
                  title={s.label}
                  subtitle={`${s.who} · ${s.state}`}
                  badges={s.needsAnswer ? ['NEEDS AN ANSWER'] : undefined}
                  onPress={() => openSource(s.id)}
                  a11yLabel={`${s.label}. ${s.who}. ${s.state}. Opens this source to edit it.`}
                />
              ))}
              <Small>A source with “No sound system connection needed” is acoustic or self-contained. One marked “No input yet” is still waiting for its inputs.</Small>
            </Section>
          ) : null}

          <OrderPanel patchId={patchId} />
          <DiPanel selectedId={popup?.k === 'di' ? popup.id : ([...marked][0] ?? null)} onOpen={openDi} />
          <SummaryPanel onOpenIssue={goToIssue} />
          <ExtrasPanel onOpen={openExtra} />
        </View>
      </ScrollView>
      <Sheet visible={!!body} title={title} onClose={close}>
        {body}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 48 },
  column: { gap: 22 },
  list: { gap: 10 },
});
