/**
 * stageplot/inputs/AddSheets — the three ways to add to the input list:
 *
 *   1. A READY-MADE PACKAGE. Its assumption (one plain sentence) and its rows
 *      are shown BEFORE anything is added; every row has a tick and can be
 *      left out. The two sides of a stereo pair are ticked together, so a
 *      package never adds half a pair.
 *   2. ONE INPUT, on a source that exists or on a new one.
 *   3. A SOURCE WITH NO SOUND SYSTEM CONNECTION: on the stage, no channel.
 *
 * Nothing typed stands between the user and the Add key: the new row opens
 * next, and its name is the first field there.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { SP_CAPTURE_WORD, SP_CATEGORY_ORDER, SP_CATEGORY_WORD, SP_PACKAGES, spPackage } from '../../../../features/stageplot/spCatalog';
import { spAddInput, spAddPackage, spAddSource, spSource, spUpdateSource } from '../../../../features/stageplot/spModel';
import type { SpCapture, SpCategory, SpId, SpProject } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Note, RowCard } from '../spForm';
import { Chevron, SheetBody, Small, SubTitle, Tag, TickRow, bitStyles } from './bits';
import { spPackageAllTicked, spPackagePreview, spPackageToggle, spPeopleOptions, spSourceOptions, spUniqueLabel } from './inputsLogic';

export type AddKind = 'package' | 'single' | 'quiet';

const CAPTURE: { value: SpCapture; label: string }[] = (['mic', 'di', 'line', 'wireless', 'custom'] as const).map((value) => ({ value, label: SP_CAPTURE_WORD[value] }));
const CATEGORY: { value: SpCategory; label: string }[] = SP_CATEGORY_ORDER.map((value) => ({ value, label: SP_CATEGORY_WORD[value] }));

export function AddMenu({ onPick }: { onPick: (kind: AddKind) => void }) {
  return (
    <SheetBody>
      <RowCard
        title="A ready-made package"
        subtitle="The usual inputs for one source. You see every row before it is added, and you can leave rows out."
        onPress={() => onPick('package')}
        right={<Chevron />}
        a11yLabel="Add a ready-made package. You see every row before it is added."
      />
      <RowCard title="One input" subtitle="A single input, on a source you already have or on a new one." onPress={() => onPick('single')} right={<Chevron />} a11yLabel="Add one input" />
      <RowCard
        title="No sound system connection needed"
        subtitle="An acoustic or self-contained source. It stays on the stage and adds no input."
        onPress={() => onPick('quiet')}
        right={<Chevron />}
        a11yLabel="Add a source that needs no sound system connection"
      />
    </SheetBody>
  );
}

export function PackagePicker({ sourceId, onPick, onBack }: { sourceId: SpId | null; onPick: (packageId: string) => void; onBack?: () => void }) {
  const ed = useSpEditor();
  const source = sourceId ? spSource(ed.project, sourceId) : undefined;
  return (
    <SheetBody>
      {source ? <Note>The rows you choose are added to {source.label}.</Note> : null}
      <Small>A package is a starting point. Each one says what it assumes, and nothing is added until you have seen its rows.</Small>
      {SP_CATEGORY_ORDER.map((category) => {
        const list = SP_PACKAGES.filter((x) => x.category === category);
        if (!list.length) return null;
        return (
          <View key={category} style={bitStyles.gap}>
            <SubTitle>{SP_CATEGORY_WORD[category]}</SubTitle>
            {list.map((def) => (
              <RowCard
                key={def.id}
                title={def.name}
                subtitle={def.assumes}
                badges={[def.rows.length === 1 ? '1 INPUT' : `${def.rows.length} INPUTS`]}
                onPress={() => onPick(def.id)}
                right={<Chevron />}
                a11yLabel={`${def.name}. ${def.assumes} Shows its rows before anything is added.`}
              />
            ))}
          </View>
        );
      })}
      {onBack ? <Button label="‹ BACK" tone="plain" onPress={onBack} a11yLabel="Back to the ways to add a source. Nothing is added." /> : null}
    </SheetBody>
  );
}

export function PackagePreview({ packageId, sourceId, onBack, onAdded }: { packageId: string; sourceId: SpId | null; onBack: () => void; onAdded: (inputIds: SpId[]) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const def = spPackage(packageId);
  const [ticked, setTicked] = useState<boolean[]>(() => (def ? spPackageAllTicked(def) : []));
  const [performerId, setPerformerId] = useState('');
  if (!def) {
    return (
      <SheetBody>
        <Note>This package is not available.</Note>
        <Button label="‹ BACK TO THE PACKAGES" onPress={onBack} a11yLabel="Back to the packages. Nothing is added." />
      </SheetBody>
    );
  }
  const source = sourceId ? spSource(p, sourceId) : undefined;
  const view = spPackagePreview(p, def, ticked, { performerId: performerId || null, sourceId: source?.id ?? null });

  const add = () => {
    if (!view.count) return;
    const args = { performerId: performerId || null, sourceLabel: view.sourceLabel, sourceId: source?.id, rows: view.picked };
    const made = spAddPackage(p, def, args);
    ed.apply((q) => spAddPackage(q, def, args).p);
    onAdded(made.inputIds);
  };

  return (
    <SheetBody>
      <SubTitle>This package assumes</SubTitle>
      <Note>{view.assumes}</Note>
      <SubTitle>Its rows</SubTitle>
      <Small>Untick a row to leave it out. Every row can be changed or removed after it is added.</Small>
      <View style={bitStyles.gap}>
        {view.rows.map((row) => {
          const pairWord = row.side ? `${row.side === 'L' ? 'Left' : 'Right'} side of a stereo pair. Its other side is ticked with it.` : '';
          return (
            <TickRow
              key={row.index}
              title={row.label}
              sub={row.how}
              checked={row.ticked}
              onPress={() => setTicked((t) => spPackageToggle(def, t, row.index))}
              a11yLabel={`${row.label}. ${row.how.replace(/ · /g, ', ')}. ${pairWord} ${row.monitorOnly ? 'Monitor only: kept out of the audience mix.' : ''} ${row.ticked ? 'Ticked: it is added.' : 'Not ticked: it is left out.'}`}
              tags={
                row.side || row.monitorOnly ? (
                  <>
                    {row.side ? <Tag tone="pair" text={row.side === 'L' ? 'L · LEFT' : 'R · RIGHT'} /> : null}
                    {row.monitorOnly ? <Tag tone="warn" text="MONITOR ONLY: kept out of the audience mix" /> : null}
                  </>
                ) : undefined
              }
            />
          );
        })}
      </View>
      {def.rows.some((r) => r.side) ? <Small>The two sides of a stereo pair are ticked together. For one input, add the pair, open one of its rows and choose MAKE IT MONO.</Small> : null}

      {source ? (
        <Note>These rows are added to {source.label}.</Note>
      ) : (
        <Choice<string> label="Who plays or sings it" value={performerId} options={spPeopleOptions(p)} onChange={setPerformerId} hint={`The new source is called ${view.sourceLabel}. You can rename it afterward.`} />
      )}

      {view.count ? (
        <Note>{view.adds} New rows join the end of the input list with the next free numbers. Who brings each item starts as “To be confirmed”, and so does phantom power. You answer them; the tool does not.</Note>
      ) : (
        <Note tone="warning">{view.adds}</Note>
      )}
      <Button
        label={view.count === 0 ? 'ADD INPUTS' : view.count === 1 ? 'ADD 1 INPUT' : `ADD ${view.count} INPUTS`}
        tone="primary"
        onPress={add}
        disabled={!view.count}
        disabledReason="Tick at least one row."
        a11yLabel={view.count === 1 ? `Add 1 input from ${def.name}` : `Add ${view.count} inputs from ${def.name}`}
      />
      <Button label="‹ BACK TO THE PACKAGES" tone="plain" onPress={onBack} a11yLabel="Back to the packages. Nothing is added." />
    </SheetBody>
  );
}

export function SingleInput({ onAdded }: { onAdded: (inputId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const [sourceId, setSourceId] = useState<string>(p.sources.find((s) => s.connection === 'inputs')?.id ?? '');
  const [capture, setCapture] = useState<SpCapture>('mic');
  const [category, setCategory] = useState<SpCategory>('other');
  const [performerId, setPerformerId] = useState('');
  const source = sourceId ? spSource(p, sourceId) : undefined;
  const sources: { value: string; label: string }[] = [...spSourceOptions(p), { value: '', label: 'A new source' }];

  const add = () => {
    const build = (q: SpProject): { p: SpProject; id: SpId } => {
      const taken = q.inputs.map((i) => i.label);
      const target = sourceId ? spSource(q, sourceId) : undefined;
      if (target) return spAddInput(q, target.id, { label: spUniqueLabel(taken, target.label), capture, equipment: '', stand: 'none' });
      const made = spAddSource(q, { label: spUniqueLabel(q.sources.map((s) => s.label), 'New source'), category, performerId: performerId || null });
      return spAddInput(made.p, made.id, { label: spUniqueLabel(taken, 'New input'), capture, equipment: '', stand: 'none' });
    };
    const made = build(p);
    ed.apply((q) => build(q).p);
    if (made.id) onAdded(made.id);
  };

  return (
    <SheetBody>
      <Choice<string> label="It belongs to" value={source ? sourceId : ''} options={sources} onChange={setSourceId} hint="A source is one instrument or one voice. One source can have several inputs." />
      {source ? null : (
        <>
          <Choice<SpCategory> label="Kind of source" value={category} options={CATEGORY} onChange={setCategory} />
          <Choice<string> label="Who plays or sings it" value={performerId} options={spPeopleOptions(p)} onChange={setPerformerId} />
        </>
      )}
      {source && source.connection === 'none' ? <Note tone="warning">{source.label} is marked “No sound system connection needed”. Adding an input connects it to the sound system.</Note> : null}
      <Choice<SpCapture> label="How it is captured" value={capture} options={CAPTURE} onChange={setCapture} />
      <Button label="ADD THIS INPUT" tone="primary" onPress={add} />
      <Small>The new input opens next, so you can name it and fill in the rest.</Small>
    </SheetBody>
  );
}

type Reason = 'acoustic' | 'self-contained' | '';
const REASON: { value: Reason; label: string }[] = [
  { value: 'acoustic', label: 'Acoustic: heard without the sound system' },
  { value: 'self-contained', label: 'Self-contained: it has its own sound' },
  { value: '', label: 'To be confirmed' },
];

export function QuietSource({ onAdded }: { onAdded: (sourceId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const [category, setCategory] = useState<SpCategory>('other');
  const [performerId, setPerformerId] = useState('');
  const [reason, setReason] = useState<Reason>('acoustic');

  const add = () => {
    const build = (q: SpProject): { p: SpProject; id: SpId } => {
      const made = spAddSource(q, { label: spUniqueLabel(q.sources.map((s) => s.label), 'New source'), category, performerId: performerId || null, connection: 'none' });
      return reason ? { p: spUpdateSource(made.p, made.id, { noneReason: reason }), id: made.id } : made;
    };
    const made = build(p);
    ed.apply((q) => build(q).p);
    onAdded(made.id);
  };

  return (
    <SheetBody>
      <Note>No sound system connection needed: the source is part of your stage and your packet, and it adds no input.</Note>
      <Choice<SpCategory> label="Kind of source" value={category} options={CATEGORY} onChange={setCategory} />
      <Choice<string> label="Who plays or sings it" value={performerId} options={spPeopleOptions(p)} onChange={setPerformerId} />
      <Choice<Reason> label="Why it needs no connection" value={reason} options={REASON} onChange={setReason} />
      <Button label="ADD THIS SOURCE" tone="primary" onPress={add} />
      <Small>The new source opens next, so you can name it.</Small>
    </SheetBody>
  );
}
