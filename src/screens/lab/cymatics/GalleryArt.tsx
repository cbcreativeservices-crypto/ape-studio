/**
 * GalleryArt — the ART STUDIO: a mode inside the Gallery (owner decision 2),
 * on the Rack Unit. The Harmonograph art-board grammar applied to a Chladni
 * figure: the nodal lines are extracted once (contours.ts), the enclosed
 * regions are the sign components, and a tap fills the region under it —
 * the fill never crosses a still line because the still line IS the region's
 * boundary. Solid or gradient, the Academy swatches + a custom colour,
 * undo / redo on the bezel, line weight on the lane, the paper under it, and
 * rotational-symmetry fill so a full colouring takes a few taps.
 *
 *   STAGE  the figure (PatternFigure, interactive), sized by the glass ONCE.
 *   BEZEL  REGIONS · FILLED · ‹ UNDO · REDO ›  (tap cells).
 *   DOCK   FILL (swatches + custom + erase) · STYLE (solid / gradient + line
 *          colour) · WEIGHT (the bound lane) · PAPER · SYM.
 *   WELL   first-move caption, CLEAR ALL, the export panel, autosave state,
 *          the guided-lesson row.
 *
 * Artwork autosaves 500 ms after every change and on leaving — numeric state
 * is never touched (spec: stored separately).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SpectrumColorPicker } from '../../../components/SpectrumColorPicker';
import { colors, fonts } from '../../../theme/tokens';
import { WAVE_COLOR_SWATCHES } from '../../../features/tools/waveColorPref';
import { analyse, applyFill, domainPoint, fitFrame, regionAtPx, FIG_PAD } from '../../../features/cymatics/figure';
import type { PatternGeometry } from '../../../features/cymatics/patternField';
import { patternStore, type Artwork, type FillStyle, type SavedPattern } from '../../../features/cymatics/patternStore';
import { LabChip } from '../LabShell';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { ExportPanel } from './ExportPanel';
import { PAPERS, PatternFigure } from './PatternFigure';

const SWATCHES: string[] = [...WAVE_COLOR_SWATCHES, '#000000'];
const SYMS = [1, 2, 3, 4, 6, 8];
const LINE_COLORS = ['#ffffff', '#000000', '#ffc64d', '#1d1d22'];
const HIST_CAP = 60;
const MAX_W = 4; // px at the reference width

export function GalleryArt({
  pattern,
  geometry,
  initial,
  onArtwork,
  onHelp,
}: {
  pattern: SavedPattern;
  geometry: PatternGeometry;
  initial: Artwork;
  /** Every committed artwork (the gallery keeps its cache current). */
  onArtwork: (a: Artwork) => void;
  onHelp: (key?: string) => void;
}) {
  const [hist, setHist] = useState<{ list: Artwork[]; i: number }>({ list: [initial], i: 0 });
  const art = hist.list[hist.i];
  const [fillColor, setFillColor] = useState<string>(SWATCHES[3]);
  const [style, setStyle] = useState<FillStyle>('solid');
  const [erase, setErase] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved');
  const analysis = useMemo(() => analyse(geometry), [geometry]);
  const filled = useMemo(() => new Set(art.fills.map((f) => f.region)).size, [art.fills]);

  const push = (next: Artwork) =>
    setHist((h) => {
      const list = [...h.list.slice(0, h.i + 1), { ...next, updatedAt: Date.now() }].slice(-HIST_CAP);
      return { list, i: list.length - 1 };
    });
  const patch = (o: Partial<Artwork>) => push({ ...art, ...o });
  // A slider drag is one gesture, not sixty undo steps: it rewrites the
  // current history entry instead of pushing.
  const patchLive = (o: Partial<Artwork>) =>
    setHist((h) => {
      const list = [...h.list];
      list[h.i] = { ...list[h.i], ...o, updatedAt: Date.now() };
      return { list, i: h.i };
    });
  const canUndo = hist.i > 0;
  const canRedo = hist.i < hist.list.length - 1;
  const undo = () => setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) }));
  const redo = () => setHist((h) => ({ ...h, i: Math.min(h.list.length - 1, h.i + 1) }));

  // Autosave, debounced; flush on unmount.
  const latest = useRef(art);
  latest.current = art;
  const dirty = useRef(false);
  useEffect(() => {
    if (art === initial) return;
    dirty.current = true;
    setSaveState('saving');
    const t = setTimeout(() => {
      void patternStore()
        .saveArtwork(art)
        .then((ok) => {
          setSaveState(ok ? 'saved' : 'failed');
          dirty.current = !ok;
        });
      onArtwork(art);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art]);
  useEffect(
    () => () => {
      if (dirty.current) void patternStore().saveArtwork(latest.current);
    },
    [],
  );

  // ── the tap ──────────────────────────────────────────────────────────────
  const tap = (x: number, y: number, w: number, h: number) => {
    const frame = fitFrame(geometry.aspect, w, h, FIG_PAD);
    const region = regionAtPx(geometry, frame, x, y);
    if (region < 0) return;
    const fills = applyFill(geometry, art, region, domainPoint(frame, x, y), erase ? null : { color: fillColor, style });
    patch({ fills });
  };

  const bezel: BezelItem[] = [
    { k: 'REGIONS', v: String(analysis.regions.count), helpKey: 'art_fill' },
    { k: 'FILLED', v: `${filled}`, helpKey: 'art_fill', tint: filled > 0 ? colors.amber : colors.textSub },
    { k: 'UNDO', v: '‹', tint: canUndo ? colors.amber : colors.textSub, onPress: canUndo ? undo : undefined, helpKey: 'art_fill' },
    { k: 'REDO', v: '›', tint: canRedo ? colors.amber : colors.textSub, onPress: canRedo ? redo : undefined, helpKey: 'art_fill' },
  ];

  const params: DockParam[] = [
    {
      kind: 'group',
      id: 'fill',
      label: 'FILL',
      valueLabel: erase ? 'erase' : fillColor.replace('#', '').slice(0, 6),
      helpKey: 'art_fill',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>COLOUR</Text>
          <View style={styles.swatches}>
            {SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setFillColor(c);
                  setErase(false);
                }}
                hitSlop={4}
                style={[styles.swatch, { backgroundColor: c }, c === fillColor && !erase && styles.swatchOn]}
                accessibilityRole="button"
                accessibilityLabel={`Fill colour ${c}`}
                accessibilityState={{ selected: c === fillColor && !erase }}
              />
            ))}
          </View>
          <View style={styles.chips}>
            <LabChip label="Custom colour…" selected={false} onPress={() => setPickerOpen(true)} onLongPress={() => onHelp('art_fill')} />
            <LabChip label={erase ? 'Erase ON — tap a region' : 'Erase'} selected={erase} onPress={() => setErase((e) => !e)} onLongPress={() => onHelp('art_fill')} />
          </View>
          <Text style={styles.trayBlurb}>Tap a region on the figure to fill it with this colour. Regions are the areas between nodal lines — the parts of the plate that move together.</Text>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'style',
      label: 'STYLE',
      valueLabel: style === 'solid' ? 'Solid' : 'Grad',
      helpKey: 'art_style',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>FILL STYLE</Text>
          <View style={styles.chips}>
            <LabChip label="Solid" selected={style === 'solid'} onPress={() => setStyle('solid')} onLongPress={() => onHelp('art_style')} />
            <LabChip label="Gradient" selected={style === 'gradient'} onPress={() => setStyle('gradient')} onLongPress={() => onHelp('art_style')} />
          </View>
          <Text style={styles.trayBlurb}>{style === 'gradient' ? 'Gradient shades each region from its centre outward — the colour at the middle, 45 % darker at the edge. Reads as height: antinode in the middle, still line at the edge.' : 'Solid paints the region flat.'}</Text>
          <Text style={styles.trayHead}>NODAL LINES</Text>
          <View style={styles.swatches}>
            {[...LINE_COLORS, fillColor].map((c, i) => (
              <Pressable key={`${c}${i}`} onPress={() => patch({ lineColor: c })} hitSlop={4} style={[styles.swatch, { backgroundColor: c }, c === art.lineColor && styles.swatchOn]} accessibilityRole="button" accessibilityLabel={`Line colour ${c}`} />
            ))}
          </View>
        </View>
      ),
    },
    {
      kind: 'fader',
      id: 'weight',
      label: 'WEIGHT',
      value: Math.max(0, Math.min(1, art.lineWeight / MAX_W)),
      onChange: (v) => patchLive({ lineWeight: Math.round(v * MAX_W * 10) / 10 }),
      format: (v) => (v * MAX_W < 0.05 ? 'lines hidden' : `lines ${(v * MAX_W).toFixed(1)} px`),
      formatShort: (v) => (v * MAX_W < 0.05 ? 'off' : `${(v * MAX_W).toFixed(1)}px`),
      home: 1.5 / MAX_W,
      helpKey: 'art_weight',
    },
    {
      kind: 'options',
      id: 'paper',
      label: 'PAPER',
      valueLabel: (PAPERS.find((p) => p.id === art.background)?.label ?? 'Plate').split(' ')[0],
      options: PAPERS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
      selectedId: art.background,
      onSelect: (id) => patch({ background: id }),
      sticky: true,
      helpKey: 'art_paper',
    },
    {
      kind: 'options',
      id: 'sym',
      label: 'SYM',
      valueLabel: art.symmetry <= 1 ? 'Off' : `${art.symmetry}×`,
      options: SYMS.map((k) => ({ id: `${k}`, label: k === 1 ? 'Off' : `${k}-fold`, blurb: k === 1 ? 'Each tap fills one region.' : `Fill one region and its ${k - 1} rotated partners fill with it — the pattern’s own symmetry does the work.` })),
      selectedId: `${art.symmetry}`,
      onSelect: (id) => patch({ symmetry: Number(id) }),
      sticky: true,
      helpKey: 'art_symmetry',
    },
  ];

  return (
    <View style={styles.root}>
      <RackUnit
        stage={{
          size: 'L',
          badge: `ART BOARD · ${pattern.badge}`,
          bezel,
          onGuide: () => onHelp('art_fill'),
          hideDragTag: true,
          render: (w, h) => <PatternFigure geometry={geometry} artwork={art} width={w} height={h} interactive onTap={(x, y) => tap(x, y, w, h)} />,
        }}
        params={params}
        initialParam="weight"
        onHelp={onHelp}
      >
        <View style={styles.well}>
          <Text style={styles.caption}>Tap a region to fill it. Nodal lines are the still lines of the figure — a fill never crosses one. UNDO and REDO are on the bezel.</Text>
          <View style={styles.chips}>
            <LabChip label="Clear all fills" selected={false} onPress={() => patch({ fills: [] })} />
            <LabChip label={saveState === 'saved' ? 'Artwork saved ✓' : saveState === 'saving' ? 'Saving…' : 'Save failed — retry'} selected={false} onPress={() => void patternStore().saveArtwork(art).then((ok) => setSaveState(ok ? 'saved' : 'failed'))} />
          </View>
          <ExportPanel subject={{ kind: 'pattern', pattern, geometry, artwork: art }} onHelp={onHelp} />
          <Pressable style={styles.lessonRow} onPress={() => onHelp('gallery')} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
            <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
          </Pressable>
        </View>
      </RackUnit>

      {/* Custom colour — an IN-TREE overlay (never a nested Modal). */}
      {pickerOpen ? (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} accessibilityRole="button" accessibilityLabel="Close colour picker" />
          <View style={styles.overlayCard}>
            <Text style={styles.pickerTitle}>CUSTOM FILL COLOUR</Text>
            <SpectrumColorPicker
              value={fillColor}
              onPick={(hex) => {
                setFillColor(hex);
                setErase(false);
                setPickerOpen(false);
              }}
            />
            <View style={styles.chips}>
              <LabChip label="Close" selected={false} onPress={() => setPickerOpen(false)} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  well: { gap: 12, paddingBottom: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  tray: { gap: 8, paddingBottom: 4 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub, marginTop: 4 },
  trayBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#2a2a32' },
  swatchOn: { borderColor: colors.amber, borderWidth: 3 },
  lessonRow: { marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: '#232329', paddingVertical: 12, paddingHorizontal: 14 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  overlayCard: { borderRadius: 14, borderWidth: 1, borderColor: '#2a2a32', backgroundColor: '#101014', padding: 16, gap: 12, alignItems: 'center' },
  pickerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
});
