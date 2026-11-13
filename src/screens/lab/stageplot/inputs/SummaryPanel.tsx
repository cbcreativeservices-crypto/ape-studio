/**
 * stageplot/inputs/SummaryPanel — the EQUIPMENT AND RESPONSIBILITY SUMMARY
 * (handoff §6) and the other listed items (stage box, split, backline, riser,
 * power location).
 *
 * Every number is read from the project through spDerive each time it is
 * drawn: there is no counter to drift. The panel says what is needed
 * (channels by destination and type, microphones by name with Required
 * marked, stands, DI channels apart from DI devices) and then WHO BRINGS
 * WHAT in four separate blocks: the band, the venue, another provider, and
 * to be confirmed. Each item is in exactly one block.
 *
 * Power and split entries are requests and notes. The tool never works out
 * circuit capacity or says a split is compatible.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { SP_SUPPLIER_WORD } from '../../../../features/stageplot/spCatalog';
import { spAddExtra, spRemoveExtra, spUpdateExtra } from '../../../../features/stageplot/spModel';
import type { SpExtra, SpId, SpSupplier } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Count, FocusMark, HelpTip, Note, NumberField, RowCard, Section, TextField } from '../spForm';
import { Lines, RemoveStep, SheetBody, Small, SubTitle, bitStyles } from './bits';
import type { SpIssue } from '../../../../features/stageplot/spReview';
import { SP_EXTRAS_HINT, SP_EXTRA_HINT, SP_EXTRA_WORD, SP_SUPPLIERS, spEquipmentGroups, spExtraLine, spOpenIssues, spOpenLine, spResponsibility, spSummaryCounts } from './inputsLogic';

const SUPPLIER: { value: SpSupplier; label: string }[] = SP_SUPPLIERS.map((value) => ({ value, label: SP_SUPPLIER_WORD[value] }));
const KINDS: readonly SpExtra['kind'][] = ['stage-box', 'split', 'backline', 'riser', 'power', 'other'];
const KIND: { value: SpExtra['kind']; label: string }[] = KINDS.map((value) => ({ value, label: SP_EXTRA_WORD[value] }));

export function SummaryPanel({ onOpenIssue }: { onOpenIssue: (issue: SpIssue) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const counts = useMemo(() => spSummaryCounts(p), [p]);
  const groups = useMemo(() => spEquipmentGroups(p), [p]);
  const who = useMemo(() => spResponsibility(p), [p]);
  const open = useMemo(() => spOpenIssues(ed.issues), [ed.issues]);

  return (
    <Section title="EQUIPMENT AND WHO BRINGS IT" hint="Counted from your rows each time. To change a number here, change the row.">
      <HelpTip
        title="Who brings what"
        body="Each item has someone who brings it: the band, the venue, another provider, or to be confirmed. The packet prints these apart, so the venue sees what your band asks it to bring and what is still open."
      />
      {counts.length ? (
        <View style={bitStyles.counts}>
          {counts.map((c) => (
            <Count key={c.label} value={c.value} label={c.label} />
          ))}
        </View>
      ) : null}
      {groups.map((g) => (
        <View key={g.id} style={bitStyles.gap}>
          <SubTitle>{g.title}</SubTitle>
          <Lines lines={g.lines} />
        </View>
      ))}
      {who.map((block) => (
        <View key={block.supplier} style={bitStyles.gap}>
          <SubTitle>{block.title}</SubTitle>
          {block.lines.length ? <Lines lines={block.lines} mark={block.supplier === 'tbc' ? '?' : '•'} /> : <Small>Nothing listed.</Small>}
        </View>
      ))}
      <View style={bitStyles.gap}>
        <SubTitle>Details still to be confirmed</SubTitle>
        {open.here.length || open.elsewhere.length ? <Small>These are kept and printed as open questions. Nothing is filled in for you. Tap one to open the row it is about.</Small> : <Small>Nothing is waiting to be confirmed.</Small>}
        {open.here.map((issue) => (
          <RowCard key={issue.key} title={spOpenLine(issue)} onPress={() => onOpenIssue(issue)} a11yLabel={`To be confirmed: ${spOpenLine(issue)}. Opens the row it is about.`} />
        ))}
        {open.elsewhere.length ? (
          <>
            <Small>To answer in MONITORS:</Small>
            <Lines lines={open.elsewhere.map(spOpenLine)} mark="?" />
          </>
        ) : null}
      </View>
      <Small>Monitor mixes and monitor devices have their own totals in MONITORS.</Small>
    </Section>
  );
}

export function ExtrasPanel({ onOpen }: { onOpen: (extraId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const add = (kind: SpExtra['kind']) => {
    const made = spAddExtra(p, { kind, label: SP_EXTRA_WORD[kind] });
    ed.apply((q) => spAddExtra(q, { kind, label: SP_EXTRA_WORD[kind] }).p);
    onOpen(made.id);
  };
  return (
    <Section title="STAGE BOX, SPLIT, BACKLINE, RISERS AND POWER" hint={`Other things you want listed for the venue. Each is a request and a note. ${SP_EXTRAS_HINT}`}>
      {p.extras.length ? (
        p.extras.map((e) => <RowCard key={e.id} title={e.label.trim() || SP_EXTRA_WORD[e.kind]} subtitle={spExtraLine(e)} onPress={() => onOpen(e.id)} a11yLabel={`${e.label.trim() || SP_EXTRA_WORD[e.kind]}. ${spExtraLine(e).replace(/ · /g, ', ')}. Opens this item to edit it.`} />)
      ) : (
        <Small>Nothing is listed yet.</Small>
      )}
      <View style={bitStyles.gap}>
        {KINDS.map((kind) => (
          <Button key={kind} label={`ADD: ${SP_EXTRA_WORD[kind].toUpperCase()}`} tone="plain" onPress={() => add(kind)} />
        ))}
      </View>
    </Section>
  );
}

export function ExtraEditor({ extraId, onClose }: { extraId: SpId; onClose: () => void }) {
  const ed = useSpEditor();
  const e = ed.project.extras.find((x) => x.id === extraId);
  if (!e) {
    return (
      <SheetBody>
        <Note>This item is no longer in the list.</Note>
        <Button label="CLOSE" onPress={onClose} />
      </SheetBody>
    );
  }
  const set = (patch: Partial<Omit<SpExtra, 'id'>>) => ed.apply((q) => spUpdateExtra(q, extraId, patch));
  return (
    <SheetBody>
      <Choice<SpExtra['kind']> label="What it is" value={e.kind} options={KIND} onChange={(kind) => (kind === e.kind ? undefined : set({ kind }))} />
      <TextField label="Name" value={e.label} onCommit={(t) => (t === e.label ? undefined : set({ label: t }))} placeholder={SP_EXTRA_WORD[e.kind]} />
      <NumberField label="How many" value={e.qty} onCommit={(n) => (n == null || n === e.qty ? undefined : set({ qty: n }))} min={1} max={99} width="half" />
      <FocusMark k="supplier">
        <Choice<SpSupplier> label="Who brings it" value={e.supplier} options={SUPPLIER} onChange={(supplier) => (supplier === e.supplier ? undefined : set({ supplier }))} />
      </FocusMark>
      <TextField label="Note" value={e.note} onCommit={(t) => (t === e.note ? undefined : set({ note: t }))} multiline hint={SP_EXTRA_HINT[e.kind]} />
      {e.kind === 'power' ? <Note>A power location is a request. The tool does not calculate what a circuit can carry, and a request here is not the venue’s electrical approval.</Note> : null}
      {e.kind === 'split' ? <Note>The tool does not decide that a split suits both systems. In this version the facts about a split are one note, not separate fields. What is not confirmed is printed as a question for the venue.</Note> : null}
      <RemoveStep
        label="REMOVE THIS ITEM"
        question={`Remove ${e.label.trim() || SP_EXTRA_WORD[e.kind]} from the list?`}
        yes="YES, REMOVE IT"
        onRemove={() => {
          ed.apply((q) => spRemoveExtra(q, extraId));
          onClose();
        }}
      />
    </SheetBody>
  );
}
