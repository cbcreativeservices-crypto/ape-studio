/**
 * StagePalette — what the ADD button of the Stage area opens (must-do D60):
 * every kind of object a band can put on its stage, in five rows (people,
 * instruments, microphones and DI, monitors, stage and support).
 *
 * AN OBJECT ON THE STAGE IS NOT AN INPUT (handoff §3). Tapping an instrument,
 * a microphone, a DI or a monitor does not place it immediately: the palette
 * first OFFERS what the symbol stands for:
 *   • something that is already in the lists (a source, an input, a monitor
 *     device, a performer): the symbol points at it and nothing is added;
 *   • a source package, with its assumption and EVERY row shown before
 *     anything is added, each row able to be left out. The rows and their
 *     names are the Inputs area's own preview (spPackagePreview), so a
 *     package added here and the same package added in Inputs are the same;
 *   • a new entry in the monitor plan (a monitor device, never an input);
 *   • "only a drawing": the object stands for nothing in the lists.
 * So an input never appears because a drawing was placed.
 *
 * It is drawn in the kit's popup on a phone and in the dock tray in FULL
 * SCREEN (where a popup cannot be presented), so it opens no popup of its
 * own. Every step starts at its top (StageStepScroll).
 */
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SP_DEVICE_WORD, SP_PALETTE, type SpPackage, type SpPaletteItem } from '../../../../features/stageplot/spCatalog';
import type { SpDeviceType, SpId, SpObjectKind, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { spPackagePreview, spPackageToggle } from '../inputs/inputsLogic';
import { Button, Choice, Note, Switch, TextField } from '../spForm';
import { StageStepScroll } from './StageStepScroll';
import {
  stageAddDrawing,
  stageAddLinked,
  stageAddPerformer,
  stageAddWithDevice,
  stageAddWithPackage,
  stageDeviceChoices,
  stageDeviceTypesFor,
  stageInputChoices,
  stageLinkMode,
  stagePackagesFor,
  stagePerformerChoices,
  stageSourceChoices,
  type StageAdded,
  type StageChoice,
} from './stageLinks';
import type { Pt } from './stageGeom';

const GROUPS: readonly { id: SpPaletteItem['group']; title: string }[] = [
  { id: 'people', title: 'PEOPLE' },
  { id: 'instruments', title: 'INSTRUMENTS' },
  { id: 'capture', title: 'MICROPHONES AND DI' },
  { id: 'monitors', title: 'MONITORS' },
  { id: 'stage', title: 'STAGE AND SUPPORT' },
];

type Step = { at: 'pick' } | { at: 'link'; item: SpPaletteItem } | { at: 'package'; item: SpPaletteItem; pkg: SpPackage } | { at: 'device'; item: SpPaletteItem };

const NOBODY = 'nobody';
const NO_MIX = 'no-mix';

export function StagePalette({
  project,
  onAdd,
  onGoInputs,
  onGoMonitors,
  maxHeight,
}: {
  project: SpProject;
  /** Make the edit (one undo step) and select what was added. The parent
   *  hands in where a new object goes. */
  onAdd: (make: (p: SpProject, at: Pt) => StageAdded) => void;
  onGoInputs: () => void;
  onGoMonitors: () => void;
  /** The height its own scroller may take inside the popup or the tray. */
  maxHeight: number;
}) {
  const p = project;
  const [step, setStep] = useState<Step>({ at: 'pick' });
  const [added, setAdded] = useState({ name: '', n: 0 });
  const [newName, setNewName] = useState('');
  /** Package rows the user keeps (by index); all kept to begin with. */
  const [ticked, setTicked] = useState<boolean[]>([]);
  const [who, setWho] = useState<string>(NOBODY);
  const [devType, setDevType] = useState<SpDeviceType>('wedge');
  const [mixId, setMixId] = useState<string>(NO_MIX);

  const done = (name: string, make: (q: SpProject, at: Pt) => StageAdded) => {
    onAdd(make);
    setAdded((a) => ({ name, n: a.n + 1 }));
    setNewName('');
    setStep({ at: 'pick' });
  };
  const back = () => setStep({ at: 'pick' });

  const pick = (item: SpPaletteItem) => {
    if (stageLinkMode(item.kind) === 'none') {
      done(item.name, (q, at) => stageAddDrawing(q, item.kind, at));
      return;
    }
    setStep({ at: 'link', item });
  };
  const openPackage = (item: SpPaletteItem, pkg: SpPackage) => {
    setTicked(pkg.rows.map(() => true));
    setWho(NOBODY);
    setStep({ at: 'package', item, pkg });
  };
  const openDevice = (item: SpPaletteItem) => {
    setDevType(stageDeviceTypesFor(item.kind)[0] ?? 'custom');
    setMixId(NO_MIX);
    setStep({ at: 'device', item });
  };

  // every step, and every object added, starts the scroller at its top
  const stepKey = step.at === 'pick' ? `pick:${added.n}` : step.at === 'package' ? `package:${step.item.kind}:${step.pkg.id}` : `${step.at}:${step.item.kind}`;
  const wrap = (body: ReactNode) => (
    <StageStepScroll stepKey={stepKey} maxHeight={maxHeight}>
      {body}
    </StageStepScroll>
  );

  /* ── the palette ── */
  if (step.at === 'pick') {
    return wrap(
      <>
        {added.name ? <Note tone="good">{`${added.name} is on the stage and selected. Drag it into place, or open OBJECT to name it and set its position.`}</Note> : null}
        <Text style={styles.lead}>Tap what you want on the stage. A symbol never adds an input by itself. For an instrument, a microphone or a monitor, you first choose what the symbol stands for.</Text>
        {GROUPS.map((g) => (
          <View key={g.id} style={styles.group}>
            <Text style={styles.heading} accessibilityRole="header">
              {g.title}
            </Text>
            <View style={styles.chips}>
              {SP_PALETTE.filter((it) => it.group === g.id).map((it) => (
                <Button key={it.kind} label={it.name.toUpperCase()} a11yLabel={`Add: ${it.name}`} onPress={() => pick(it)} />
              ))}
            </View>
          </View>
        ))}
      </>,
    );
  }

  const item = step.item;
  const kind: SpObjectKind = item.kind;
  const mode = stageLinkMode(kind);
  const BackButton = <Button label="‹ BACK TO THE PALETTE" onPress={back} a11yLabel="Back to the palette. Nothing is added." />;
  const people = [...p.performers.map((pf) => ({ value: pf.id, label: pf.name || 'Unnamed performer' })), { value: NOBODY, label: 'Nobody (shared source)' }];

  /* ── a source package: its assumption and its rows, before anything is added ── */
  if (step.at === 'package') {
    const pkg = step.pkg;
    const performerId = who === NOBODY ? null : who;
    const view = spPackagePreview(p, pkg, ticked, { performerId });
    const n = view.count;
    return wrap(
      <>
        <Text style={styles.title} accessibilityRole="header">{`${item.name}: ${pkg.name}`}</Text>
        <Note>{`This package assumes: ${pkg.assumes} It is a starting point. You can leave out any row now, and change any row later in Inputs.`}</Note>
        <Text style={styles.heading} accessibilityRole="header">
          THE INPUTS IT WOULD ADD
        </Text>
        {view.rows.map((r) => (
          <Switch
            key={r.index}
            label={r.label}
            hint={[r.how, r.monitorOnly ? 'MONITOR ONLY: kept out of the audience mix' : '', r.side ? 'One side of a stereo pair. The two sides stay together.' : ''].filter(Boolean).join(' · ')}
            value={r.ticked}
            onChange={() => setTicked((t) => spPackageToggle(pkg, t, r.index))}
          />
        ))}
        {p.performers.length ? <Choice label="Who plays or sings it" value={who} options={people} onChange={setWho} hint={`The new source is called ${view.sourceLabel}. You can rename it afterward in Inputs.`} /> : null}
        <Button
          tone="primary"
          label={n === 1 ? 'ADD THE SYMBOL AND 1 INPUT' : `ADD THE SYMBOL AND ${n} INPUTS`}
          disabled={n === 0}
          disabledReason="Every row is left out. Keep at least one row, or go back and choose ONLY A DRAWING."
          onPress={() => done(item.name, (q, at) => stageAddWithPackage(q, kind, at, pkg, { ticked, performerId }))}
        />
        <Button label="‹ BACK" onPress={() => setStep({ at: 'link', item })} a11yLabel="Back to the choices. Nothing is added." />
      </>,
    );
  }

  /* ── a new entry in the monitor plan ── */
  if (step.at === 'device') {
    const types = stageDeviceTypesFor(kind);
    return wrap(
      <>
        <Text style={styles.title} accessibilityRole="header">{`${item.name}: add it to the monitor plan`}</Text>
        <Note>A monitor device is equipment. A mix is what a performer hears. Several monitor devices can play one mix, so adding a device never adds a mix.</Note>
        {types.length > 1 ? <Choice label="What kind of monitor device" value={devType} options={types.map((t) => ({ value: t, label: SP_DEVICE_WORD[t] }))} onChange={setDevType} /> : null}
        <Choice
          label="Which mix it plays"
          value={mixId}
          options={[...p.mixes.map((m) => ({ value: m.id, label: m.name ? `${m.code} ${m.name}` : m.code })), { value: NO_MIX, label: 'No mix yet' }]}
          onChange={setMixId}
          hint={mixId === NO_MIX ? 'With no mix, the review asks which mix it plays. Mixes are made in Monitors.' : undefined}
        />
        <Button tone="primary" label="ADD THE SYMBOL AND THE DEVICE" onPress={() => done(item.name, (q, at) => stageAddWithDevice(q, kind, at, { type: devType, mixId: mixId === NO_MIX ? null : mixId }))} />
        <Button label="‹ BACK" onPress={() => setStep({ at: 'link', item })} a11yLabel="Back to the choices. Nothing is added." />
      </>,
    );
  }

  /* ── what does this symbol stand for? ── */
  const existing = (list: StageChoice[], link: (id: SpId) => { performerId?: SpId; sourceId?: SpId; inputId?: SpId; deviceId?: SpId }, none: string) =>
    list.length ? (
      <View style={styles.list}>
        {list.map((c) => (
          <Button
            key={c.id}
            label={`${c.label}${c.detail ? ` · ${c.detail}` : ''}${c.placed ? ' · already has a symbol' : ''}`.toUpperCase()}
            a11yLabel={`Place the symbol for ${c.label}${c.placed ? '. It already has a symbol on the stage' : ''}. Nothing is added to the lists.`}
            onPress={() => done(c.label, (q, at) => stageAddLinked(q, kind, at, link(c.id)))}
          />
        ))}
      </View>
    ) : (
      <Text style={styles.none}>{none}</Text>
    );

  if (mode === 'performer') {
    const list = stagePerformerChoices(p).filter((c) => !c.placed);
    const typed = newName.trim();
    return wrap(
      <>
        <Text style={styles.title} accessibilityRole="header">
          Performer: who is it?
        </Text>
        <Text style={styles.heading} accessibilityRole="header">
          A PERFORMER FROM SETUP
        </Text>
        {existing(list, (id) => ({ performerId: id }), p.performers.length ? 'Every performer in Setup is on the stage already.' : 'No performers yet. Add one here, or in Setup.')}
        <Text style={styles.heading} accessibilityRole="header">
          A NEW PERFORMER
        </Text>
        <TextField label="Name" value={newName} onCommit={setNewName} onChange={setNewName} placeholder="The name to print on the plot" />
        <Button tone="primary" label="ADD THIS PERFORMER" disabled={!typed} disabledReason="Type a name first." onPress={() => done(typed, (q, at) => stageAddPerformer(q, at, typed))} />
        <Text style={styles.heading}>OR</Text>
        <Button label="ONLY A DRAWING (NOT A PERFORMER)" a11yLabel="Add a figure that is only a drawing: not a performer in Setup" onPress={() => done(item.name, (q, at) => stageAddDrawing(q, kind, at))} />
        {BackButton}
      </>,
    );
  }

  if (mode === 'monitor') {
    return wrap(
      <>
        <Text style={styles.title} accessibilityRole="header">{`${item.name}: what does this symbol stand for?`}</Text>
        <Text style={styles.heading} accessibilityRole="header">
          A MONITOR DEVICE ALREADY IN THE MONITOR PLAN
        </Text>
        {existing(stageDeviceChoices(p, kind), (id) => ({ deviceId: id }), 'No monitor device of this kind is in the monitor plan yet.')}
        <Text style={styles.heading} accessibilityRole="header">
          A NEW MONITOR DEVICE
        </Text>
        <Button label="ADD IT TO THE MONITOR PLAN TOO ›" onPress={() => openDevice(item)} a11yLabel="Add a new monitor device with this symbol. The next step shows the choices first." />
        <Text style={styles.heading}>OR</Text>
        <Button label="ONLY A DRAWING" a11yLabel="Only a drawing: it is not in the monitor plan" onPress={() => done(item.name, (q, at) => stageAddDrawing(q, kind, at, { visualOnly: true }))} />
        <Button label="GO TO MONITORS ›" onPress={onGoMonitors} a11yLabel="Go to the Monitors area. Nothing is added." />
        {BackButton}
      </>,
    );
  }

  const packages = stagePackagesFor(kind);
  const capture = mode === 'capture';
  return wrap(
    <>
      <Text style={styles.title} accessibilityRole="header">{`${item.name}: what does this symbol stand for?`}</Text>
      <Text style={styles.heading} accessibilityRole="header">
        {capture ? 'AN INPUT ALREADY IN YOUR INPUT LIST' : 'A SOURCE ALREADY IN YOUR INPUT LIST'}
      </Text>
      {capture
        ? existing(stageInputChoices(p, kind), (id) => ({ inputId: id }), kind === 'di' ? 'No DI input is in the input list yet.' : 'No microphone input is in the input list yet.')
        : existing(stageSourceChoices(p, kind), (id) => ({ sourceId: id }), 'No sources yet.')}
      {packages.length ? (
        <>
          <Text style={styles.heading} accessibilityRole="header">
            A NEW SOURCE, FROM A PACKAGE
          </Text>
          <Text style={styles.none}>The next step shows what a package assumes and every input it would add. Nothing is added until you say so.</Text>
          <View style={styles.list}>
            {packages.map((pkg) => (
              <Button key={pkg.id} label={`${pkg.name.toUpperCase()} ›`} a11yLabel={`${pkg.name}. Show its inputs before adding.`} onPress={() => openPackage(item, pkg)} />
            ))}
          </View>
        </>
      ) : (
        <Note>{kind === 'di' ? 'A DI symbol shows an input that is already in the input list. It never adds a second input. New DI inputs are added in Inputs.' : 'New inputs for this are added in Inputs, where every field can be set.'}</Note>
      )}
      <Text style={styles.heading}>OR</Text>
      <Button label="ONLY A DRAWING: IT NEEDS NO INPUT" a11yLabel="Only a drawing: acoustic or self-contained, it needs no input" onPress={() => done(item.name, (q, at) => stageAddDrawing(q, kind, at, { visualOnly: true }))} />
      {kind === 'mic-stand' || kind === 'di' ? null : <Button label="DECIDE LATER" a11yLabel="Place the symbol now and decide later. The review will ask what it stands for." onPress={() => done(item.name, (q, at) => stageAddDrawing(q, kind, at))} />}
      <Button label="GO TO INPUTS ›" onPress={onGoInputs} a11yLabel="Go to the Inputs area. Nothing is added." />
      {BackButton}
    </>,
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { gap: 8 },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  heading: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub, marginTop: 2 },
  none: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
});
