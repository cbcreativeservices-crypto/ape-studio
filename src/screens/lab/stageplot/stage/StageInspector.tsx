/**
 * StageInspector — everything about ONE stage object, with large targets
 * (must-do D60): its name, where it stands (typed numbers and four position
 * buttons, so nothing here needs a drag), which way it faces, its size when
 * it is a platform, what it stands for in the lists (with a way to go there),
 * its group, and duplicate / remove.
 *
 * It is drawn in three places from this one file. Under the object's row in
 * the list of objects it is whole (`part="all"`): the drawing is pinned above
 * the list, so the position and turn buttons are seen to work. In the popup
 * that OBJECT's "NAME, LINKS AND MORE" opens, and in the FULL SCREEN tray, it
 * is the DETAILS only (`part="details"`): the popup covers the drawing, so
 * the buttons that move and turn stay in the dock, under the drawing
 * (StageMovePad; visual review 2, B10). It opens no popup of its own.
 *
 * Every change is one spModel edit through the editor's `apply`: one undo
 * step. Removing asks in place first, as the Inputs area does (RemoveStep),
 * and never removes anything from the lists; the screen says so.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SP_DEVICE_WORD } from '../../../../features/stageplot/spCatalog';
import { spMixesOf } from '../../../../features/stageplot/spDerive';
import { spDevice, spDuplicateObject, spGroup, spInput, spLocationWord, spMix, spObject, spOnStage, spPerformer, spRemoveObjects, spSource, spUngroup, spUpdateObject } from '../../../../features/stageplot/spModel';
import { spIsSized } from '../../../../features/stageplot/spSymbols';
import type { SpId, SpObject, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { parseRoomNumber } from '../../roomdesign/roomParse';
import { RemoveStep } from '../inputs/bits';
import { useSpEditor } from '../spContext';
import { Button, MoreDetails, Note, Switch, TextField } from '../spForm';
import { StageMovePad } from './StageMovePad';
import { stageFacingWord, stagePosFraction, stagePosUnit, stagePosValue, stageSizeFraction } from './stageGeom';
import { stageDeviceChoices, stageInputBadges, stageInputChoices, stageKindName, stageLinkMode, stageListName, stageMoveExact, stageObjectKindName, stagePerformerChoices, stageSourceChoices } from './stageLinks';

/** Short labels, so the two boxes sit at one height; the long words are in
 *  the line under them. */
function posLabel(p: SpProject, axis: 'x' | 'y'): string {
  const unit = stagePosUnit(p);
  return `${axis === 'x' ? 'Across' : 'Depth'} ${unit === '%' ? '%' : `(${unit})`}`;
}

export function StageInspector({
  id,
  onDone,
  part = 'all',
}: {
  id: SpId;
  /** Called when the object is deselected or removed here (the popup closes). */
  onDone?: () => void;
  /** 'all' under the list row; 'details' in the popup and the FULL SCREEN tray
   *  (no name heading: the popup's title is the name; no position or turn). */
  part?: 'all' | 'details';
}) {
  const ed = useSpEditor();
  const p = ed.project;
  const o = spObject(p, id);
  const [groupPick, setGroupPick] = useState<SpId[]>([]);
  if (!o) return null;

  const name = stageListName(p, o);
  const set = (patch: Partial<Omit<SpObject, 'id' | 'groupId'>>) => ed.apply((q) => spUpdateObject(q, id, patch));
  const typed = (axis: 'x' | 'y') => (text: string) => {
    const f = stagePosFraction(p, axis, parseRoomNumber(text));
    if (f != null) ed.apply((q) => stageMoveExact(q, id, axis === 'x' ? { x: f } : { y: f }));
  };
  const sizeTyped = (axis: 'x' | 'y') => (text: string) => {
    const f = stageSizeFraction(p, axis, parseRoomNumber(text));
    if (f != null) set(axis === 'x' ? { w: f } : { h: f });
  };
  const unit = stagePosUnit(p);
  const sized = spIsSized(o.kind);
  const mode = stageLinkMode(o.kind);
  const linked = !!(o.performerId || o.sourceId || o.inputId || o.deviceId);
  const group = o.groupId ? p.objects.filter((x) => x.groupId === o.groupId && x.id !== o.id) : [];
  const others = p.objects.filter((x) => x.id !== o.id);

  const performer = spPerformer(p, o.performerId);
  const source = o.sourceId ? spSource(p, o.sourceId) : undefined;
  const input = o.inputId ? spInput(p, o.inputId) : undefined;
  const device = spDevice(p, o.deviceId);
  const deviceMix = spMix(p, device?.mixId ?? null);
  const mixes = o.kind === 'performer' && o.performerId ? spMixesOf(p, o.performerId) : [];
  const badges = stageInputBadges(p, o);

  const linkChoices = mode === 'performer' ? stagePerformerChoices(p).filter((c) => !c.placed) : mode === 'sound' ? stageSourceChoices(p, o.kind) : mode === 'capture' ? stageInputChoices(p, o.kind) : mode === 'monitor' ? stageDeviceChoices(p, o.kind) : [];
  const linkTo = (cid: SpId) => set(mode === 'performer' ? { performerId: cid } : mode === 'sound' ? { sourceId: cid, visualOnly: false } : mode === 'capture' ? { inputId: cid, visualOnly: false } : { deviceId: cid, visualOnly: false });

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        {part === 'all' ? (
          <Text style={styles.name} accessibilityRole="header">
            {name}
          </Text>
        ) : null}
        <Text style={styles.sub}>{[stageObjectKindName(o.kind).toLowerCase() === name.toLowerCase() ? '' : stageObjectKindName(o.kind), spLocationWord(o), stageFacingWord(o.rot)].filter(Boolean).join(' · ')}</Text>
      </View>

      {/* ── name ── */}
      {o.kind === 'performer' && performer ? (
        <Note>{`The plot prints this performer’s name from Setup: ${performer.name || 'not named yet'}.`}</Note>
      ) : (
        <TextField label="Name on the plot" value={o.label} onCommit={(t) => set({ label: t })} placeholder={stageKindName(o.kind)} hint="Leave it empty to print no name beside this object." />
      )}

      {/* ── position and turn: only where the drawing is in view ── */}
      {part === 'all' ? (
        <>
          <Text style={styles.heading} accessibilityRole="header">
            POSITION AND TURN
          </Text>
          <StageMovePad id={id} />
          <View style={styles.row}>
            <TextField label={posLabel(p, 'x')} value={String(stagePosValue(p, 'x', o.x))} onCommit={typed('x')} keyboard="numeric" width="half" />
            <TextField label={posLabel(p, 'y')} value={String(stagePosValue(p, 'y', o.y))} onCommit={typed('y')} keyboard="numeric" width="half" />
          </View>
          <Text style={styles.hint}>Type a position to place it exactly. Across is measured from the stage right edge (the left of the drawing). Depth is measured from the upstage edge (the top).</Text>
        </>
      ) : null}
      {!spOnStage(o) ? (
        <>
          <Note tone="warning">{`${name} is outside the stage. That is allowed: the plot shows it there, marked OFF STAGE.`}</Note>
          <Switch label="It is off the stage on purpose" value={o.offstageOk} onChange={(v) => set({ offstageOk: v })} hint="Turn this on and the review stops asking about it." />
        </>
      ) : null}

      {/* ── a platform's own size ── */}
      {sized ? (
        <>
          <Text style={styles.heading} accessibilityRole="header">
            SIZE
          </Text>
          <View style={styles.row}>
            <TextField label={unit === '%' ? 'Width (% of the stage width)' : `Width (${unit})`} value={String(stagePosValue(p, 'x', o.w ?? 0))} onCommit={sizeTyped('x')} keyboard="numeric" width="half" />
            <TextField label={unit === '%' ? 'Depth (% of the stage depth)' : `Depth (${unit})`} value={String(stagePosValue(p, 'y', o.h ?? 0))} onCommit={sizeTyped('y')} keyboard="numeric" width="half" />
          </View>
          <TextField label="Height or size note" value={o.sizeNote} onCommit={(t) => set({ sizeNote: t })} placeholder={o.kind === 'riser' ? 'For example: 12 in high' : 'In your own words'} />
          <Text style={styles.hint}>On the drawing, drag the round handle at its corner to size it.</Text>
        </>
      ) : null}

      {/* ── what it stands for ── */}
      {mode !== 'none' || linked ? (
        <Text style={styles.heading} accessibilityRole="header">
          WHAT IT STANDS FOR
        </Text>
      ) : null}
      {performer ? (
        <>
          <Text style={styles.line}>{`Performer: ${performer.name || 'not named yet'}${performer.role ? ` (${performer.role})` : ''}`}</Text>
          {mixes.length ? <Text style={styles.line}>{`Monitor ${mixes.length === 1 ? 'mix' : 'mixes'}: ${mixes.map((m) => (m.name ? `${m.code} ${m.name}` : m.code)).join(', ')}`}</Text> : <Text style={styles.line}>No monitor mix yet.</Text>}
          <View style={styles.row}>
            <Button label="GO TO SETUP ›" a11yLabel={`Go to ${performer.name || 'this performer'} in Setup`} onPress={() => ed.goTo('setup', { kind: 'performer', id: performer.id })} />
            <Button label="GO TO MONITORS ›" a11yLabel={`Go to the monitors of ${performer.name || 'this performer'}`} onPress={() => ed.goTo('monitors', mixes.length ? { kind: 'mix', id: mixes[0].id } : { kind: 'performer', id: performer.id })} />
          </View>
        </>
      ) : null}
      {source ? (
        <>
          <Text style={styles.line}>{`Source: ${source.label}. ${source.connection === 'none' ? 'No sound system connection needed.' : badges.length ? `Input ${badges.length === 1 && !badges[0].includes('–') ? 'channel' : 'channels'} ${badges.join(', ')}.` : 'It has no inputs yet.'}`}</Text>
          <Button label="GO TO ITS INPUTS ›" a11yLabel={`Go to ${source.label} in Inputs`} onPress={() => ed.goTo('inputs', { kind: 'source', id: source.id })} />
        </>
      ) : null}
      {input ? (
        <>
          <Text style={styles.line}>{`Input: channel ${badges.join(', ')}, ${input.label}${input.cue ? '. MONITOR ONLY: kept out of the audience mix' : ''}.`}</Text>
          <Button label="GO TO THIS INPUT ›" a11yLabel={`Go to ${input.label} in Inputs`} onPress={() => ed.goTo('inputs', { kind: 'input', id: input.id })} />
        </>
      ) : null}
      {device ? (
        <>
          <Text style={styles.line}>{`Monitor device: ${device.label || SP_DEVICE_WORD[device.type]} (${SP_DEVICE_WORD[device.type]}). ${deviceMix ? `It plays mix ${deviceMix.name ? `${deviceMix.code} ${deviceMix.name}` : deviceMix.code}.` : device.selfContained ? 'It is part of the band monitor rig.' : 'It is not on a mix yet.'}`}</Text>
          <Button label="GO TO THIS DEVICE ›" a11yLabel={`Go to ${device.label || SP_DEVICE_WORD[device.type]} in Monitors`} onPress={() => ed.goTo('monitors', { kind: 'device', id: device.id })} />
        </>
      ) : null}
      {linked ? (
        <Button
          label="REMOVE THE LINK"
          a11yLabel={`Remove the link from ${name}. It becomes only a drawing. Nothing is removed from the lists.`}
          onPress={() => set({ performerId: null, sourceId: null, inputId: null, deviceId: null })}
        />
      ) : null}
      {!linked && mode !== 'none' ? (
        <>
          {mode !== 'performer' ? (
            <Switch
              label="It is only a drawing"
              value={o.visualOnly}
              onChange={(v) => set({ visualOnly: v })}
              hint={mode === 'monitor' ? 'On: it is not in the monitor plan, and the review does not ask about it.' : 'On: it needs no input (acoustic, or self-contained), and the review does not ask about it.'}
            />
          ) : (
            <Text style={styles.line}>A drawing of a person who is not a performer in Setup.</Text>
          )}
          <MoreDetails title={mode === 'performer' ? 'Make it a performer from Setup' : 'Link it to something in your lists'}>
            {linkChoices.length ? (
              linkChoices.map((c) => <Button key={c.id} label={`${c.label}${c.detail ? ` · ${c.detail}` : ''}${c.placed ? ' · already has a symbol' : ''}`.toUpperCase()} a11yLabel={`Link ${name} to ${c.label}. Nothing is added to the lists.`} onPress={() => linkTo(c.id)} />)
            ) : (
              <Text style={styles.hint}>{mode === 'performer' ? 'Every performer in Setup is on the stage already.' : 'Nothing in the lists fits this symbol yet.'}</Text>
            )}
            {mode === 'sound' || mode === 'capture' ? <Button label="GO TO INPUTS ›" a11yLabel="Go to the Inputs area to add its inputs" onPress={() => ed.goTo('inputs')} /> : null}
            {mode === 'monitor' ? <Button label="GO TO MONITORS ›" a11yLabel="Go to the Monitors area to add its monitor device" onPress={() => ed.goTo('monitors')} /> : null}
          </MoreDetails>
        </>
      ) : null}

      {/* ── group ── */}
      <Text style={styles.heading} accessibilityRole="header">
        GROUP
      </Text>
      {group.length ? (
        <>
          <Text style={styles.line}>{`Grouped with ${group.map((g) => stageListName(p, g)).join(', ')}. A group moves, duplicates and is removed together.`}</Text>
          <Button label="UNGROUP" a11yLabel={`Ungroup ${name} and the objects grouped with it`} onPress={() => ed.apply((q) => spUngroup(q, id))} />
        </>
      ) : others.length ? (
        <MoreDetails title="Group it with other objects">
          <Text style={styles.hint}>A group moves, duplicates and is removed together: a drummer, the kit and the riser under them, for example.</Text>
          {others.map((x) => (
            <Switch key={x.id} label={stageListName(p, x)} hint={`${stageObjectKindName(x.kind)} · ${spLocationWord(x)}`} value={groupPick.includes(x.id)} onChange={(on) => setGroupPick((cur) => (on ? [...cur.filter((c) => c !== x.id), x.id] : cur.filter((c) => c !== x.id)))} />
          ))}
          <Button
            tone="primary"
            label={groupPick.length ? `GROUP THESE ${groupPick.length + 1} OBJECTS` : 'GROUP'}
            disabled={!groupPick.length}
            disabledReason="Turn on at least one other object first."
            onPress={() => {
              const ids = [id, ...groupPick];
              setGroupPick([]);
              ed.apply((q) => spGroup(q, ids));
            }}
          />
        </MoreDetails>
      ) : (
        <Text style={styles.hint}>A group needs two objects. This is the only one on the stage.</Text>
      )}

      {/* ── note ── */}
      <MoreDetails title="Note for this object">
        <TextField label="Note" value={o.note} onCommit={(t) => set({ note: t })} multiline placeholder="Anything the venue should know about it" />
      </MoreDetails>

      {/* ── duplicate, deselect, remove ── */}
      <View style={styles.row}>
        <Button
          label={group.length ? 'DUPLICATE THE GROUP' : 'DUPLICATE'}
          a11yLabel={`Duplicate ${name}${group.length ? ' and its group' : ''}. The copy is only a drawing: it shares no input or monitor device.`}
          onPress={() => {
            let first = '';
            ed.apply((q) => {
              const r = spDuplicateObject(q, id);
              first = r.ids[0] ?? '';
              return r.p;
            });
            if (first) ed.select({ kind: 'object', id: first });
          }}
        />
        <Button
          label="DESELECT"
          a11yLabel={`Deselect ${name}`}
          onPress={() => {
            ed.select(null);
            onDone?.();
          }}
        />
      </View>
      <Text style={styles.hint}>A copy is only a drawing. It never shares an input or a monitor device with the original.</Text>
      <RemoveStep
        label={group.length ? 'REMOVE THE GROUP FROM THE STAGE' : 'REMOVE FROM THE STAGE'}
        question={
          group.length
            ? `Remove ${name} and the ${group.length === 1 ? 'object' : `${group.length} objects`} grouped with it from the stage? They leave the drawing only: performers, inputs and monitor devices stay in your lists. To remove one object alone, choose UNGROUP first.`
            : `Remove ${name} from the stage? It leaves the drawing only: performers, inputs and monitor devices stay in your lists.`
        }
        yes="YES, REMOVE IT"
        onRemove={() => {
          ed.select(null);
          ed.apply((q) => spRemoveObjects(q, [id]));
          onDone?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { gap: 3 },
  name: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.5, color: colors.amber },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  heading: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub, marginTop: 4 },
  line: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 10, alignItems: 'flex-start' },
});
