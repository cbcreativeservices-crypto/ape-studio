/**
 * StageArea — the STAGE work area of the Stage Plot and Channel Designer
 * (must-do D60): the band's setup seen from above, on the Rack Unit.
 *
 *   STAGE  the top-down stage, pinned on the glass (StagePlanView). The
 *          audience is at the bottom; the four direction words never move.
 *          FULL SCREEN is on: the drawing is laid out in glass units, so the
 *          same drags work at every size.
 *   BEZEL  read-only: what is selected, where it stands, how it is turned.
 *   DOCK   every control (owner rule: controls in the bottom dock):
 *            ZOOM    the lane: the whole stage … 4×. Zoomed in, a finger on
 *                    the bare stage slides the drawing.
 *            TURN    the lane: the selected object's turn (one edit when the
 *                    finger lets go).
 *            ADD     the palette. A symbol never adds an input by itself.
 *            OBJECT  the selected object's inspector.
 *            VIEW    grid, snap, names, numbers, FIT STAGE, UNDO, REDO.
 *   WELL   reading, and THE LIST ALTERNATIVE TO DRAGGING: what is not on the
 *          stage yet, the review's stage questions, and every object as a
 *          row that opens its position buttons and its typed position.
 *
 * ADD, OBJECT AND VIEW OPEN AS POPUPS (fix round 2026-11-12, decision 2). On
 * a 390 × 844 phone the rack's tray had a 94-point window for 900 points of
 * palette. So outside FULL SCREEN the three dock buttons open the kit's
 * centered popup (`Sheet`). In FULL SCREEN a popup cannot be presented over
 * the full-screen view (iOS refuses it), so there the same three buttons open
 * the dock tray, with the fader strip folded away (`hideLane`) so the tray
 * has the height. The drawing's full-screen copy tells this area which of the
 * two is showing (`onFullScreen`). In both, the palette and the inspector
 * scroll in their own scroller, which starts at the top on every step.
 *
 * ONE MODEL. Nothing here keeps a copy of the stage plot: every change is a
 * spModel edit through the editor's `apply` (one undo step each; a drag is
 * ONE step, made when the finger lets go). Zoom, pan and what the drawing
 * shows are this screen's own and are never saved: zoom and screen size
 * cannot change a position.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { spEdit, spGridStep, spMoveObject, spObject, spToScale, spUpdateObject } from '../../../features/stageplot/spModel';
import type { SpId, SpProject } from '../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../theme/tokens';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { useSpEditor } from './spContext';
import { Button, HelpTip, IssueList, Note, Sheet, Switch } from './spForm';
import { goToIssue, runIssueAction } from './spIssueActions';
import { StageInspector } from './stage/StageInspector';
import { StageObjectList } from './stage/StageObjectList';
import { StagePalette } from './stage/StagePalette';
import { StagePlanView } from './stage/StagePlanView';
import { StageStepScroll, stageSheetScrollHeight, stageTrayScrollHeight } from './stage/StageStepScroll';
import { STAGE_VIEW_FIT, STAGE_ZOOM_MAX, stageAxisWords, stageFacingShort, stageFacingWord, stagePosShort, stagePosWords, stageSizeWords, stageZoomTo, type Pt, type StageView } from './stage/stageGeom';
import { STAGE_NEW_SPOT, stageFreeSpot, stageListName, stageListOrder, stagePlace, stageSelectedObjectId, stageSelectionName, stageUnplaced, type StageAdded } from './stage/stageLinks';

/** The TURN lane moves in 5° steps (0…355). */
const turnOf = (v: number): number => (Math.round((Math.max(0, Math.min(1, v)) * 360) / 5) * 5) % 360;
const zoomOf = (v: number): number => 1 + Math.max(0, Math.min(1, v)) * (STAGE_ZOOM_MAX - 1);

const gridWords = (p: SpProject): string => {
  if (p.stage.width && p.stage.depth) return p.stage.unit === 'ft' ? 'One step is 1 ft.' : 'One step is 0.25 m.';
  const n = Math.round(1 / spGridStep(p).x);
  return `One step is 1/${n} of the stage width.`;
};

type Panel = 'add' | 'object' | 'view';

export function StageArea() {
  const ed = useSpEditor();
  const p = ed.project;
  const { height: winH } = useWindowDimensions();

  const [view, setView] = useState<StageView>(STAGE_VIEW_FIT);
  const [names, setNames] = useState(true);
  const [numbers, setNumbers] = useState(true);
  /** The TURN lane's preview while the finger rides it. */
  const [turn, setTurn] = useState<{ id: SpId; rot: number } | null>(null);
  /** The popup that is open (outside FULL SCREEN). */
  const [panel, setPanel] = useState<Panel | null>(null);
  /** True while the drawing's FULL SCREEN copy is showing. */
  const [inFull, setInFull] = useState(false);

  const selId = stageSelectedObjectId(p, ed.selection);
  const sel = selId ? spObject(p, selId) : undefined;
  const selName = sel ? stageListName(p, sel) : '';
  /** Something chosen in another area that is not on the stage yet. */
  const toPlace = ed.selection && ed.selection.kind !== 'object' && !selId && stageSelectionName(p, ed.selection) ? ed.selection : null;

  const select = useCallback((id: SpId | null) => ed.select(id ? { kind: 'object', id } : null), [ed]);
  const closePanel = useCallback(() => setPanel(null), []);
  /** Where a new object goes: a free place near downstage center, or near
   *  the middle of what the drawing shows when it is zoomed in. */
  const spot = (q: SpProject): Pt => stageFreeSpot(q, view.zoom > 1 ? { x: view.cx, y: view.cy } : STAGE_NEW_SPOT);
  /** One edit that adds something, then select it. */
  const add = (make: (q: SpProject, at: Pt) => StageAdded | null) => {
    let id = '';
    ed.apply((q) => {
      const r = make(q, spot(q));
      if (!r) return q;
      id = r.id;
      return r.p;
    });
    if (id) ed.select({ kind: 'object', id });
  };
  /** Added from the popup: the popup closes, so the new object is seen,
   *  selected, on the stage. (The FULL SCREEN tray stays open.) */
  const addFromPalette = (make: (q: SpProject, at: Pt) => StageAdded) => {
    add(make);
    setPanel(null);
  };
  /** Pick from the list: select, and bring it into view when zoomed. */
  const selectFromList = (id: SpId | null) => {
    select(id);
    const o = id ? spObject(p, id) : undefined;
    if (o && view.zoom > 1) setView({ zoom: view.zoom, cx: o.x, cy: o.y });
  };
  const setStage = (patch: { grid?: boolean; snap?: boolean }) =>
    ed.apply((q) =>
      spEdit(q, (d) => {
        if (patch.grid != null) d.stage.grid = patch.grid;
        if (patch.snap != null) d.stage.snap = patch.snap;
      }),
    );
  const fit = () => setView(STAGE_VIEW_FIT);
  const zoomBy = (by: number) => setView((cur) => stageZoomTo(cur, cur.zoom + by, sel ?? null));

  // ── the glass ─────────────────────────────────────────────────────────────
  const stage = (w: number, h: number) => (
    <StagePlanView
      w={w}
      h={h}
      project={p}
      selectedId={selId}
      view={view}
      onView={setView}
      showNames={names}
      showNumbers={numbers}
      turn={turn && turn.id === selId ? turn : null}
      onSelect={select}
      onMove={(id, to) => ed.apply((q) => spMoveObject(q, id, to))}
      onResize={(id, size) => ed.apply((q) => spUpdateObject(q, id, { w: size.w, h: size.h }))}
      onFullScreen={setInFull}
    />
  );

  const shownRot = sel ? (turn && turn.id === sel.id ? turn.rot : sel.rot) : 0;
  const bezel: BezelItem[] = sel
    ? [
        { k: 'SELECTED', v: selName.toUpperCase(), vA11y: selName, flex: 1.7 },
        { k: 'ACROSS', v: stagePosShort(p, 'x', sel.x), vA11y: stageAxisWords(p, 'x', sel.x) },
        { k: 'DEPTH', v: stagePosShort(p, 'y', sel.y), vA11y: stageAxisWords(p, 'y', sel.y) },
        { k: 'TURN', v: `${shownRot}°`, vA11y: `${shownRot} degrees, ${stageFacingWord(shownRot)}` },
      ]
    : [
        { k: 'SELECTED', v: 'NOTHING', vA11y: 'Nothing is selected', flex: 1.7 },
        { k: 'ON STAGE', v: String(p.objects.length), vA11y: `${p.objects.length} objects on the stage` },
        { k: 'ZOOM', v: `${view.zoom.toFixed(1)}×`, vA11y: `Zoom ${view.zoom.toFixed(1)} times` },
      ];
  const size = stageSizeWords(p);
  const badge = spToScale(p) ? `${size.toUpperCase()} · SYMBOLS ARE DRAWINGS, NOT THE REAL SIZE OF THE EQUIPMENT` : 'NOT TO SCALE · SYMBOLS ARE DRAWINGS, NOT THE REAL SIZE OF THE EQUIPMENT';

  // ── what ADD, OBJECT and VIEW show (in the popup, or in the tray) ─────────
  const sheetH = stageSheetScrollHeight(winH);
  const trayH = stageTrayScrollHeight(winH);
  const paletteBody = (maxHeight: number, onAdd: (make: (q: SpProject, at: Pt) => StageAdded) => void) => (
    <StagePalette project={p} onAdd={onAdd} onGoInputs={() => ed.goTo('inputs')} onGoMonitors={() => ed.goTo('monitors')} maxHeight={maxHeight} />
  );
  const objectBody = (maxHeight: number, onDone?: () => void) => (
    <StageStepScroll stepKey={sel ? sel.id : 'none'} maxHeight={maxHeight}>
      {sel ? (
        <StageInspector id={sel.id} onDone={onDone} />
      ) : (
        <>
          <Text style={styles.body}>Nothing is selected. Tap an object on the stage, or choose one here.</Text>
          {p.objects.length ? (
            <View style={styles.buttons}>
              {stageListOrder(p.objects).map((o) => (
                <Button key={o.id} label={stageListName(p, o).toUpperCase()} a11yLabel={`Select ${stageListName(p, o)}`} onPress={() => selectFromList(o.id)} />
              ))}
            </View>
          ) : (
            <Text style={styles.caption}>The stage is empty. ADD opens the palette.</Text>
          )}
        </>
      )}
    </StageStepScroll>
  );
  const viewBody: ReactNode = (
    <View style={styles.tray}>
      <Switch label="Grid" value={p.stage.grid} onChange={(v) => setStage({ grid: v })} hint={`Lines on the stage to place things by. ${gridWords(p)}`} />
      <Switch label="Snap to the grid" value={p.stage.snap} onChange={(v) => setStage({ snap: v })} hint="On: an object you drag or move with a position button lands on the nearest grid step. A typed position is kept exactly as typed." />
      <Switch label="Names on the drawing" value={names} onChange={setNames} hint="For this screen only. The packet always prints the names." />
      <Switch label="Channel numbers and mix codes on the drawing" value={numbers} onChange={setNumbers} hint="For this screen only. A number in a square box is an input channel. A code in a round box (M1, M2) is a monitor mix." />
      <View style={styles.buttons}>
        <Button label="FIT STAGE" onPress={fit} a11yLabel="Show the whole stage in the drawing" />
        <Button label="UNDO" onPress={ed.undo} disabled={!ed.canUndo} disabledReason="Nothing to undo." a11yLabel="Undo the last change" />
        <Button label="REDO" onPress={ed.redo} disabled={!ed.canRedo} disabledReason="Nothing to redo." a11yLabel="Redo the change that was undone" />
      </View>
    </View>
  );

  // ── the dock ──────────────────────────────────────────────────────────────
  const commitTurn = (rot: number) => {
    setTurn(null);
    if (sel && rot !== sel.rot) ed.apply((q) => spUpdateObject(q, sel.id, { rot }));
  };
  /** One of the three buttons that open a surface: a popup outside FULL
   *  SCREEN, the tray (with the fader strip folded) inside it. */
  const opener = (id: Panel, label: string, valueLabel: string, valueA11y: string, render: () => ReactNode): DockParam =>
    inFull ? { kind: 'group', id, label, valueLabel, valueA11y, hideLane: true, render } : { kind: 'action', id, label, onPress: () => setPanel(id) };
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'zoom',
      label: 'ZOOM',
      value: (view.zoom - 1) / (STAGE_ZOOM_MAX - 1),
      onChange: (v) => setView((cur) => stageZoomTo(cur, zoomOf(v), sel ?? null)),
      // short enough for the lane's one line: never cut with "…"
      format: (v) => (zoomOf(v) <= 1.02 ? '1.0× · the whole stage' : `${zoomOf(v).toFixed(1)}× · drag the stage to slide`),
      formatShort: (v) => `${zoomOf(v).toFixed(1)}×`,
      home: 0,
      nudges: [
        { label: 'ZOOM OUT', onPress: () => zoomBy(-0.5), a11y: 'Zoom out by half a step' },
        { label: 'ZOOM IN', onPress: () => zoomBy(0.5), a11y: 'Zoom in by half a step' },
        { label: 'FIT STAGE', onPress: fit, a11y: 'Show the whole stage in the drawing' },
        ...(sel ? [{ label: 'FIND OBJECT', onPress: () => setView((cur) => ({ zoom: Math.max(2, cur.zoom), cx: sel.x, cy: sel.y })), a11y: `Zoom in on ${selName}` }] : []),
      ],
    },
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: shownRot / 360,
      // a preview while the finger rides the lane; ONE edit when it lets go
      onChange: (v) => {
        if (sel) setTurn({ id: sel.id, rot: turnOf(v) });
      },
      onCommit: (v) => commitTurn(turnOf(v)),
      format: (v) => `${turnOf(v)}° · ${stageFacingShort(turnOf(v))}`,
      formatShort: (v) => `${turnOf(v)}°`,
      home: 0,
      nudges: sel
        ? [
            { label: '↺ 15°', onPress: () => commitTurn((sel.rot + 345) % 360), a11y: `Turn ${selName} 15 degrees counterclockwise` },
            { label: '↻ 15°', onPress: () => commitTurn((sel.rot + 15) % 360), a11y: `Turn ${selName} 15 degrees clockwise` },
            { label: 'FACE AUDIENCE', onPress: () => commitTurn(0), a11y: `Turn ${selName} to face the audience` },
          ]
        : undefined,
      locked: sel ? undefined : 'nothing is selected. Tap an object on the stage first',
    },
    opener('add', 'ADD', 'NEW', 'the palette of objects', () => paletteBody(trayH, add)),
    opener('object', 'OBJECT', sel ? 'EDIT' : 'NONE', sel ? `edit ${selName}` : 'nothing is selected', () => objectBody(trayH)),
    opener('view', 'VIEW', p.stage.snap ? 'SNAP' : p.stage.grid ? 'GRID' : 'PLAIN', `grid ${p.stage.grid ? 'on' : 'off'}, snap ${p.stage.snap ? 'on' : 'off'}`, () => viewBody),
  ];

  // ── the well ──────────────────────────────────────────────────────────────
  const unplaced = stageUnplaced(p);
  const stageIssues = ed.issues.filter((i) => i.area === 'stage');
  // a taller glass where the phone has the room (the rack still protects the
  // dock and the well)
  const phoneHeight = Math.max(250, Math.min(320, Math.round(winH * 0.36)));
  // On a tall window (a tablet) the well keeps about a third of the height:
  // the list of objects under the drawing is the way to work without a drag,
  // and it was read through a 165-point slot there (visual review).
  const minWell = winH >= 900 ? Math.round(winH * 0.3) : 110;
  // A large band at the whole-stage zoom on a phone: the names cannot all be
  // clear of each other. The screen says how to read them.
  const crowded = p.objects.length > 16 && view.zoom < 1.5;
  const placeName = toPlace ? stageSelectionName(p, toPlace) : '';
  // A popup shows only outside FULL SCREEN (there the same button opens the tray).
  const shown = inFull ? null : panel;

  return (
    <>
      <RackUnit stage={{ render: stage, size: 'L', phoneHeight, minWell, badge, bezel, hideDragTag: true, fullScreen: true }} params={params} initialParam="zoom">
        <View style={styles.well}>
          {crowded ? <Note>{`This stage has ${p.objects.length} objects. At this size some names sit close together. Press ZOOM IN, or open FULL SCREEN, to read every name.`}</Note> : null}
          <Text style={styles.body}>Drag an object to move it; tap it to select it. ADD opens the palette, OBJECT edits what is selected, and TURN faces it another way. You are looking from the audience: stage right is on your left.</Text>
          <Text style={styles.caption}>A performer, their instrument, their microphone and their wedge are separate objects. Group them in OBJECT to move them together.</Text>

          {toPlace ? (
            <Note tone="warning">
              <Text style={styles.noteText}>{`${placeName} is in your lists, and it is not on the stage yet.`}</Text>
              <Button tone="primary" label="PLACE ON THE STAGE" a11yLabel={`Place ${placeName} on the stage`} onPress={() => add((q, at) => stagePlace(q, toPlace, at))} />
            </Note>
          ) : null}

          {sel ? <Text style={styles.caption}>{`Selected: ${selName}, ${stagePosWords(p, sel)}, ${stageFacingWord(sel.rot)}.`}</Text> : null}

          {unplaced.length ? (
            <View style={styles.block}>
              <Text style={styles.heading} accessibilityRole="header">
                NOT ON THE STAGE YET
              </Text>
              <Text style={styles.caption}>These are in your lists and are not on the stage yet. Placing one adds a drawing only: no input and no monitor device is added.</Text>
              <View style={styles.buttons}>
                {unplaced.map((u) => (
                  <Button key={`${u.kind}:${u.id}`} label={`PLACE ${u.name.toUpperCase()} ON THE STAGE`} a11yLabel={`Place ${u.name} on the stage${u.detail ? ` (${u.detail})` : ''}`} onPress={() => add((q, at) => stagePlace(q, { kind: u.kind, id: u.id }, at))} />
                ))}
              </View>
            </View>
          ) : null}

          {stageIssues.length ? (
            <View style={styles.block}>
              <Text style={styles.heading} accessibilityRole="header">
                REVIEW QUESTIONS ABOUT THE STAGE
              </Text>
              <IssueList issues={stageIssues} onGoTo={(i) => goToIssue(ed, i)} onAction={(i, a) => runIssueAction(ed, i, a)} />
            </View>
          ) : null}

          <View style={styles.block}>
            <Text style={styles.heading} accessibilityRole="header">
              OBJECTS ON THE STAGE
            </Text>
            <Text style={styles.caption}>Every object, from upstage to downstage. Choose a row to move it with buttons or typed numbers: nothing here needs a drag.</Text>
            <StageObjectList project={p} selectedId={selId} onSelect={selectFromList} />
          </View>

          <View style={styles.block}>
            {p.viewNote.trim() ? <Note>{`Your viewpoint note (from Setup, printed under the plot): ${p.viewNote.trim()}`}</Note> : null}
            <Note>
              {spToScale(p)
                ? `The stage is drawn to scale: ${size}. The symbols are not. They show what kind of thing stands there, not the real size of your equipment. The plot does not prove that anything fits.`
                : 'This plot is NOT TO SCALE: no stage width and depth are set in Setup. The symbols show what kind of thing stands there, not the real size of your equipment.'}
            </Note>
            <HelpTip
              title="Stage right, stage left, upstage, downstage"
              body="Stage directions are the performer’s, facing the audience. Stage right is the performer’s right, so it is on the LEFT of the drawing. Stage left is on the right of the drawing. Upstage is the back of the stage, away from the audience. Downstage is the front, toward the audience. The drawing always has the audience at the bottom."
            />
            <HelpTip
              title="A symbol is not an input"
              body="A symbol shows where something stands. An input is one audio channel that reaches a mixer. Placing an amplifier does not add a microphone, and placing a keyboard does not add a DI. When you add a symbol, you choose what it stands for. It can be something already in your lists. It can be a package of inputs, which you see before it is added. Or it can be only a drawing. A DI symbol points at an input that is already in the list. It never adds a second one."
            />
          </View>
        </View>
      </RackUnit>

      {/* ADD, OBJECT and VIEW: the kit's popup, over the whole screen */}
      <Sheet visible={shown === 'add'} title="Add to the stage" onClose={closePanel}>
        {paletteBody(sheetH, addFromPalette)}
      </Sheet>
      <Sheet visible={shown === 'object'} title={sel ? selName : 'Choose an object'} onClose={closePanel}>
        {objectBody(sheetH, closePanel)}
      </Sheet>
      <Sheet visible={shown === 'view'} title="View" onClose={closePanel}>
        {viewBody}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  well: { gap: 14 },
  block: { gap: 8 },
  tray: { gap: 12 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8, alignItems: 'flex-start' },
  heading: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4, color: colors.amberLabel },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
});
