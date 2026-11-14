/**
 * StageArea — the STAGE work area of the Stage Plot and Channel Designer
 * (must-do D60): the band's setup seen from above, on the Rack Unit.
 *
 *   STAGE  the top-down stage, pinned on the glass (StagePlanView). The
 *          audience is at the bottom; the four direction words never move.
 *          FULL SCREEN is on: the drawing is laid out in glass units, so the
 *          same drags work at every size.
 *          THE KEY is a strip under the stage, inside the display, always:
 *          each kind of object on this stage, drawn small, with its name.
 *          Its heading row carries the scale words (NOT TO SCALE, or the
 *          stage's size). There is no readout row and no line under the
 *          glass: their height is the key's.
 *   DOCK   every control (owner rule: controls in the bottom dock):
 *            ZOOM    the lane: the whole stage … 4×. Zoomed in, a finger on
 *                    the bare stage slides the drawing.
 *            TURN    the lane: the selected object's turn (one edit when the
 *                    finger lets go).
 *            ADD     the palette (each kind with its own art). A symbol
 *                    never adds an input by itself.
 *            OBJECT  the selected object's position and turn buttons, under
 *                    the drawing; NAME, LINKS AND MORE opens the rest.
 *            VIEW    four switches: grid, snap, names, numbers. (FIT STAGE is
 *                    under ZOOM; UNDO and REDO are in the bar at the top, and
 *                    in the VIEW tray in FULL SCREEN, which has no bar.)
 *   WELL   reading, and THE LIST ALTERNATIVE TO DRAGGING: what is not on the
 *          stage yet, the review's stage questions, and every object as a
 *          row that opens its position buttons and its typed position.
 *
 * ADD OPENS AS A POPUP; OBJECT AND VIEW OPEN UNDER THE DRAWING (fix rounds
 * 2026-11-12; VIEW became a short tray in the bug test of 2026-11-13, S2-12:
 * its switches change the drawing, so the drawing stays in sight). On a
 * 390 × 844 phone the rack's tray had a 94-point window for 900 points of
 * palette, so outside FULL SCREEN the ADD button opens the kit's centered popup (`Sheet`, with this area's own scroller in
 * it: one scroll bar). In FULL SCREEN a popup cannot be presented over the
 * full-screen view (iOS refuses it), so there the same buttons open the dock
 * tray, with the fader strip folded away (`hideLane`).
 *
 * OBJECT is a tray in both, because its first job is to MOVE and TURN the
 * selected object, and a control must show its effect: the tray lies over
 * the well, UNDER the pinned drawing, and holds the position and turn
 * buttons (StageMovePad). The rest of the object (its name, its links, its
 * group, its note, duplicate, remove) is one press away: NAME, LINKS AND
 * MORE opens the popup, or, in FULL SCREEN, opens it in the tray. The
 * OBJECT button's second line is the selected object's name.
 *
 * The drawing's full-screen copy tells this area which surface is showing
 * (`onFullScreen`), and how many names it had to leave out at the present
 * size (`onNamesLeftOut`), so the line under the drawing tells the truth.
 *
 * ONE MODEL. Nothing here keeps a copy of the stage plot: every change is a
 * spModel edit through the editor's `apply` (one undo step each; a drag is
 * ONE step, made when the finger lets go). Zoom, pan and what the drawing
 * shows are this screen's own and are never saved: zoom and screen size
 * cannot change a position.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { spGridStep, spMoveObject, spObject, spSetStageView, spToScale, spUpdateObject } from '../../../features/stageplot/spModel';
import type { SpId, SpProject } from '../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../theme/tokens';
import { RackUnit } from '../rack/RackUnit';
import type { DockParam } from '../rack/rackTypes';
import { useSpEditor } from './spContext';
import { Button, HelpTip, IssueList, Note, Sheet, Switch } from './spForm';
import { goToIssue, runIssueAction } from './spIssueActions';
import { StageInspector } from './stage/StageInspector';
import { StageMovePad } from './stage/StageMovePad';
import { StageObjectList } from './stage/StageObjectList';
import { StagePalette } from './stage/StagePalette';
import { StagePlanView } from './stage/StagePlanView';
import { StageStepScroll, stageSheetScrollHeight, stageTrayScrollHeight } from './stage/StageStepScroll';
import { STAGE_KEY_SHARE, STAGE_VIEW_FIT, STAGE_ZOOM_MAX, stageFacingShort, stageFacingWord, stageGlassWidthGuess, stageKeyLayout, stageScaleNote, stageSizeWords, stageZoomTo, type Pt, type StageView } from './stage/stageGeom';
import { STAGE_NEW_SPOT, stageKeyEntries, stageListName, stageListOrder, stagePlace, stageSelectedObjectId, stageSelectionName, stageUnplaced, stageWhere, type StageAdded } from './stage/stageLinks';

/** The TURN lane moves in 5° steps (0…355). */
const turnOf = (v: number): number => (Math.round((Math.max(0, Math.min(1, v)) * 360) / 5) * 5) % 360;
const zoomOf = (v: number): number => 1 + Math.max(0, Math.min(1, v)) * (STAGE_ZOOM_MAX - 1);

const gridWords = (p: SpProject): string => {
  if (p.stage.width && p.stage.depth) return p.stage.unit === 'ft' ? 'One step is 1 ft.' : 'One step is 0.25 m.';
  const n = Math.round(1 / spGridStep(p).x);
  return `One step is 1/${n} of the stage width.`;
};

type Panel = 'add' | 'object';

/** VIEW's two screen-only switches, remembered while the app is open: a
 *  visit to another area does not turn them back on (bug test S3-07). */
const drawingShows = { names: true, numbers: true };
/** ZOOM and the slide of the drawing, remembered the same way, per stage plot
 *  (the rest of S3-07, R2-SP1-10). Never saved: a screen preference. */
const stageViews: Record<string, StageView> = {};

/** A name short enough for the second line of a dock button. */
const dockName = (name: string): string => (name.length > 12 ? `${name.slice(0, 11).trimEnd()}…` : name);

export function StageArea() {
  const ed = useSpEditor();
  const p = ed.project;
  const { height: winH, width: winW } = useWindowDimensions();

  const [view, setView] = useState<StageView>(stageViews[p.id] ?? STAGE_VIEW_FIT);
  useEffect(() => {
    stageViews[p.id] = view;
  }, [p.id, view]);
  // screen preferences, remembered while the app is open (S3-07)
  const [names, setNamesState] = useState(drawingShows.names);
  const [numbers, setNumbersState] = useState(drawingShows.numbers);
  const setNames = (on: boolean) => {
    drawingShows.names = on;
    setNamesState(on);
  };
  const setNumbers = (on: boolean) => {
    drawingShows.numbers = on;
    setNumbersState(on);
  };
  /** The TURN lane's preview while the finger rides it. */
  const [turn, setTurn] = useState<{ id: SpId; rot: number } | null>(null);
  /** The popup that is open (outside FULL SCREEN). */
  const [panel, setPanel] = useState<Panel | null>(null);
  /** True while the drawing's FULL SCREEN copy is showing. */
  const [inFull, setInFull] = useState(false);
  /** How many names the drawing leaves out at its present size. */
  const [leftOut, setLeftOut] = useState(0);
  /** How many performers are named without their mix code at this size. */
  const [codesOut, setCodesOut] = useState(0);
  /** Performers whose name touches another label, and equipment whose
   *  numbers are left out, at this size (R2-SP1-02). */
  const [crowded, setCrowded] = useState(0);
  const [numbersOut, setNumbersOut] = useState(0);
  /** FULL SCREEN: the object whose details are open in the OBJECT tray. */
  const [detailsFor, setDetailsFor] = useState<SpId | null>(null);

  const selId = stageSelectedObjectId(p, ed.selection);
  const sel = selId ? spObject(p, selId) : undefined;
  const selName = sel ? stageListName(p, sel) : '';
  /** Something chosen in another area that is not on the stage yet. */
  const toPlace = ed.selection && ed.selection.kind !== 'object' && !selId && stageSelectionName(p, ed.selection) ? ed.selection : null;

  const select = useCallback((id: SpId | null) => ed.select(id ? { kind: 'object', id } : null), [ed]);
  const closePanel = useCallback(() => setPanel(null), []);
  /** Where a new object is wanted: downstage center, or the middle of what
   *  the drawing shows when it is zoomed in. The edit itself finds the
   *  nearest place there that is free for the box of what is added. */
  const near: Pt = view.zoom > 1 ? { x: view.cx, y: view.cy } : STAGE_NEW_SPOT;
  /** One edit that adds something, then select it. */
  const add = (make: (q: SpProject, at: Pt) => StageAdded | null) => {
    let id = '';
    ed.apply((q) => {
      const r = make(q, near);
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
  // Snap (never printed) and an unprinted grid are screen preferences: they
  // do not start a new revision of a Ready plot (spSetStageView).
  const setStage = (patch: { grid?: boolean; snap?: boolean }) => ed.apply((q) => spSetStageView(q, patch));
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
      onNamesLeftOut={(n, codes, crowd = 0, nums = 0) => {
        setLeftOut(n);
        setCodesOut(codes);
        setCrowded(crowd);
        setNumbersOut(nums);
      }}
    />
  );

  /** A phone too narrow for the four ZOOM words in one row. */
  const narrow = winW < 360;
  const shownRot = sel ? (turn && turn.id === sel.id ? turn.rot : sel.rot) : 0;
  const size = stageSizeWords(p);
  // NO READOUT ROW AND NO LINE UNDER THE GLASS (lead, 2026-11-12). The key
  // under the stage needs its height, and the rack gives the glass only what
  // its own strips leave. So what they said is said elsewhere: the selected
  // object's name is drawn on the stage (in the selection's own color, with
  // its ring) and in the well's first lines; ZOOM and TURN are on their own
  // dock buttons; the count of objects is the well's first line; and the scale
  // words are in the key's heading row, inside the drawing.
  const scaleNote = stageScaleNote(p);

  // ── what ADD, OBJECT and VIEW show (in the popup, or in the tray) ─────────
  const sheetH = stageSheetScrollHeight(winH);
  const trayH = stageTrayScrollHeight(winH);
  const paletteBody = (maxHeight: number, onAdd: (make: (q: SpProject, at: Pt) => StageAdded) => void) => (
    <StagePalette project={p} onAdd={onAdd} onGoInputs={() => ed.goTo('inputs')} onGoMonitors={() => ed.goTo('monitors')} maxHeight={maxHeight} />
  );
  const chooser = (
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
  );
  /** THE OBJECT TRAY, under the pinned drawing: move and turn, seen to work. */
  const objectTray = () => {
    const body = sel ? (
      <View style={styles.tray}>
        <StageMovePad id={sel.id} />
        <View style={styles.buttons}>
          <Button
            label={inFull && detailsFor === sel.id ? 'HIDE NAME, LINKS AND MORE' : 'NAME, LINKS AND MORE ›'}
            a11yLabel={`${selName}: its name, what it stands for, its group, its note, duplicate and remove`}
            onPress={() => (inFull ? setDetailsFor((cur) => (cur === sel.id ? null : sel.id)) : setPanel('object'))}
          />
          <Button label="DESELECT" a11yLabel={`Deselect ${selName}`} onPress={() => select(null)} />
        </View>
        {inFull && detailsFor === sel.id ? <StageInspector id={sel.id} part="details" /> : null}
      </View>
    ) : (
      <View style={styles.tray}>{chooser}</View>
    );
    // in FULL SCREEN the tray is tall: its own scroller starts at the top for each object
    return inFull ? (
      <StageStepScroll stepKey={`${sel ? sel.id : 'none'}:${detailsFor ?? ''}`} maxHeight={trayH}>
        {body}
      </StageStepScroll>
    ) : (
      body
    );
  };
  /** THE OBJECT POPUP: everything about the object except moving and turning it. */
  const objectSheet = (
    <StageStepScroll stepKey={sel ? sel.id : 'none'} maxHeight={sheetH}>
      {sel ? <StageInspector id={sel.id} part="details" onDone={closePanel} /> : chooser}
    </StageStepScroll>
  );
  const viewSwitches = (
    <>
      <Switch label="Grid" value={p.stage.grid} onChange={(v) => setStage({ grid: v })} hint={`Lines on the stage to place things by. ${gridWords(p)}`} />
      <Switch label="Snap to the grid" value={p.stage.snap} onChange={(v) => setStage({ snap: v })} hint="On: an object you drag or move with a position button lands on the nearest grid step. A typed position is kept exactly as typed." />
      <Switch label="Names on the drawing" value={names} onChange={setNames} hint="For this screen only. The packet always prints the names." />
      <Switch label="Channel numbers and mix codes on the drawing" value={numbers} onChange={setNumbers} hint="For this screen only. A number in a square box is an input channel. A code in a rounded box (M1, M2) is a monitor mix." />
    </>
  );
  /** The VIEW popup holds the four switches and nothing else: FIT STAGE is
   *  under the ZOOM fader, UNDO and REDO are in the bar at the top. */
  const viewBody: ReactNode = (
    <StageStepScroll stepKey="view" maxHeight={Math.max(110, Math.round(winH * 0.2))}>
      <View style={styles.tray}>{viewSwitches}</View>
    </StageStepScroll>
  );
  /** In FULL SCREEN the bar at the top is not there, so UNDO and REDO are
   *  in the tray. */
  // a SHORT scroller: in FULL SCREEN the stage stands at the top and the
  // tray stays in the dark glass under it, so the switches are seen to work
  // on the drawing (bug test S2-12)
  const viewTray: ReactNode = (
    <StageStepScroll stepKey="view" maxHeight={Math.max(110, Math.round(winH * 0.2))}>
      <View style={styles.tray}>
        {viewSwitches}
        <View style={styles.buttons}>
          <Button label="UNDO" onPress={ed.undo} disabled={!ed.canUndo} disabledReason="Nothing to undo." a11yLabel="Undo the last change" />
          <Button label="REDO" onPress={ed.redo} disabled={!ed.canRedo} disabledReason="Nothing to redo." a11yLabel="Redo the change that was undone" />
        </View>
      </View>
    </StageStepScroll>
  );

  // ── the dock ──────────────────────────────────────────────────────────────
  const commitTurn = (rot: number) => {
    setTurn(null);
    if (sel && rot !== sel.rot) ed.apply((q) => spUpdateObject(q, sel.id, { rot }));
  };
  /** ADD and VIEW: a popup outside FULL SCREEN, the tray (with the fader
   *  strip folded) inside it. */
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
      // on a narrow phone (320 wide) four buttons did not fit the row and
      // ZOOM OUT went off the screen (bug test S1-01). FIND OBJECT is left
      // out there: ZOOM IN from the whole stage already centers on the
      // selected object (stageZoomTo)
      nudges: [
        { label: 'ZOOM OUT', onPress: () => zoomBy(-0.5), a11y: 'Zoom out by half a step' },
        { label: 'ZOOM IN', onPress: () => zoomBy(0.5), a11y: 'Zoom in by half a step' },
        { label: 'FIT STAGE', onPress: fit, a11y: 'Show the whole stage in the drawing' },
        ...(sel && !narrow ? [{ label: 'FIND OBJECT', onPress: () => setView((cur) => ({ zoom: Math.max(2, cur.zoom), cx: sel.x, cy: sel.y })), a11y: `Zoom in on ${selName}` }] : []),
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
            { label: 'FACE THE AUDIENCE', onPress: () => commitTurn(0), a11y: `Turn ${selName} to face the audience` },
          ]
        : undefined,
      locked: sel ? undefined : 'nothing is selected. Tap an object on the stage first',
    },
    opener('add', 'ADD', 'NEW', 'the palette of objects', () => paletteBody(trayH, add)),
    // OBJECT: a tray on both screens, under the drawing; its second line is the selection's name
    // the button's second line is cut short (the whole name is said to a
    // screen reader): a long name reflowed the dock and shrank the stage
    { kind: 'group', id: 'object', label: 'OBJECT', valueLabel: sel ? dockName(selName).toUpperCase() : 'NOTHING', valueA11y: sel ? `${selName} is selected` : 'nothing is selected', hideLane: true, render: objectTray },
    // VIEW is a TRAY under the drawing on both screens (bug test S2-12): its
    // switches change the drawing, so the drawing stays in sight
    { kind: 'group', id: 'view', label: 'VIEW', valueLabel: p.stage.snap ? 'SNAP' : p.stage.grid ? 'GRID' : 'PLAIN', valueA11y: `grid ${p.stage.grid ? 'on' : 'off'}, snap ${p.stage.snap ? 'on' : 'off'}`, hideLane: true, render: () => (inFull ? viewTray : viewBody) },
  ];

  // ── the well ──────────────────────────────────────────────────────────────
  const unplaced = stageUnplaced(p);
  // a review question that only repeats "X is not on the stage yet" is left
  // out here: the block above it already says so, with the same button
  const offered = new Set(unplaced.map((u) => `${u.kind}:${u.id}`));
  const stageIssues = ed.issues.filter((i) => i.area === 'stage' && !((i.rule === 'performer-unplaced' || i.rule === 'source-unplaced') && offered.has(`${i.target.kind}:${i.target.id}`)));
  // a taller glass where the phone has the room (the rack still protects the
  // dock and the well)
  // THE KEY under the stage is part of the display, so the display grows by
  // the key's height: the stage keeps its room, and the well keeps its
  // minimum (the rack still clamps the glass for the dock and the well).
  const keyHeight = Math.ceil(stageKeyLayout(stageKeyEntries(p.objects), stageGlassWidthGuess(winW), scaleNote).height);
  // the key asks for no more than its share: past it, it scrolls inside the
  // display (stageKeySplit), so a long key never takes the stage's room
  const stageBase = Math.max(250, Math.min(320, Math.round(winH * 0.36)));
  const phoneHeight = stageBase + Math.min(keyHeight, Math.round((stageBase * STAGE_KEY_SHARE) / (1 - STAGE_KEY_SHARE)));
  // On a tall window (a tablet) the well keeps about a third of the height:
  // the list of objects under the drawing is the way to work without a drag,
  // and it was read through a 165-point slot there (visual review). On a
  // SHORT phone (375 × 667, 320 × 640) the stage needs the room more: the
  // well keeps two lines and scrolls, and HIDE DISPLAY gives it the whole
  // screen (bug test S1-01: a 110-point well left the stage a 45-point strip).
  const minWell = winH >= 900 ? Math.round(winH * 0.3) : winH < 760 ? 48 : 110;
  const placeName = toPlace ? stageSelectionName(p, toPlace) : '';
  // A popup shows only outside FULL SCREEN (there the same button opens the tray).
  const shown = inFull ? null : panel;

  return (
    <>
      <RackUnit stage={{ render: stage, size: 'L', phoneHeight, minWell, hideDragTag: true, fullScreen: true }} params={params} initialParam="zoom">
        <View style={styles.well}>
          <Text style={styles.status} accessibilityLiveRegion="polite">
            {`${p.objects.length === 1 ? '1 object' : `${p.objects.length} objects`} on the stage. ${sel ? `Selected: ${selName} (${stageWhere(sel)}, ${stageFacingWord(sel.rot)}).` : 'Nothing is selected.'}`}
          </Text>
          {leftOut > 0 || codesOut > 0 || crowded > 0 || numbersOut > 0 ? (
            <Note>
              {[
                // "every performer is named" only while no name is covered (R2-SP1-02)
                leftOut > 0 ? `At this size ${leftOut === 1 ? '1 equipment name is' : `${leftOut} equipment names are`} not shown, to keep the names apart.${numbersOut > 0 ? '' : ' The equipment keeps its channel numbers and mix codes.'}${crowded > 0 ? '' : ' Every performer is named.'}` : '',
                numbersOut > 0 ? `${numbersOut === 1 ? '1 piece of equipment is' : `${numbersOut} pieces of equipment are`} shown without ${numbersOut === 1 ? 'its' : 'their'} channel numbers or mix codes at this size, so no name is covered.` : '',
                crowded > 0 ? `${crowded === 1 ? '1 performer’s name touches' : `${crowded} performers’ names touch`} another label at this size.` : '',
                codesOut > 0 ? `${codesOut === 1 ? '1 performer is' : `${codesOut} performers are`} named without ${codesOut === 1 ? 'their mix code' : 'their mix codes'} at this size. Each code is still on that performer’s monitor.` : '',
                'Press ZOOM IN to see every name. In FULL SCREEN, turn the phone sideways for a larger stage.',
              ]
                .filter(Boolean)
                .join(' ')}
            </Note>
          ) : null}
          <Text style={styles.body}>Drag an object to move it; tap it to select it. ADD opens the palette, OBJECT moves and turns what is selected, and NAME, LINKS AND MORE opens the rest. You are looking down on the stage, with the audience at the bottom: stage right is on your left.</Text>
          <Text style={styles.caption}>A performer, their instrument, their microphone and their wedge are separate objects. Group them in OBJECT to move them together.</Text>

          {toPlace ? (
            <Note tone="warning">
              <Text style={styles.noteText}>{`${placeName} is in your lists, and it is not on the stage yet.`}</Text>
              <Button tone="primary" label="PLACE ON THE STAGE" a11yLabel={`Place ${placeName} on the stage`} onPress={() => add((q, at) => stagePlace(q, toPlace, at))} />
            </Note>
          ) : null}

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
                ? `The stage is drawn to scale: ${size}. Symbols are drawings, not the real size of the equipment. The plot does not prove that anything fits.`
                : 'This plot is NOT TO SCALE: the stage width and depth are not both set in Setup. Symbols are drawings, not the real size of the equipment.'}
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

      {/* ADD, VIEW and an object's details: the kit's popup, over the whole screen */}
      <Sheet visible={shown === 'add'} title="Add to the stage" onClose={closePanel} scroll={false}>
        {paletteBody(sheetH, addFromPalette)}
      </Sheet>
      <Sheet visible={shown === 'object'} title={sel ? selName : 'Choose an object'} onClose={closePanel} scroll={false}>
        {objectSheet}
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
  status: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
});
