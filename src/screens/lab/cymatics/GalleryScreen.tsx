/**
 * GalleryScreen — Cymatics Lab › PATTERN GALLERY & ART STUDIO (spec §4,
 * Phase 4). ONE route, four modes (owner decisions 1–3, 2026-09-17):
 *
 *   BROWSE   every pattern saved from the three studios — filter, favourite,
 *            select 2–4 to compare;
 *   OPEN     one pattern: the figure as line art on its object, its name and
 *            notes, the settings it came from, OPEN IN STUDIO (the exact
 *            configuration comes back), COLOUR, DUPLICATE, DELETE, EXPORT;
 *   ART      the same screen becomes the art board (GalleryArt, Rack Unit);
 *   COMPARE  2 or 4 on one canvas (GalleryCompare), with the data under it.
 *
 * Numeric state lives in ape:cymatics:patterns:v1 and is never touched by
 * colouring; artwork lives apart in ape:cymatics:artwork:v1 (patternStore).
 * Every figure here is drawn from the pattern's state through the studios'
 * own science chain (patternField) — nothing is stored as a picture.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { formatHz } from '../../../features/cymatics/music';
import { ART_N } from '../../../features/cymatics/figure';
import { patternGeometry, patternReadout, type PatternGeometry } from '../../../features/cymatics/patternField';
import { blankArtwork, patternStore, usePatterns, type Artwork, type SavedPattern, type StudioId } from '../../../features/cymatics/patternStore';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { ExportPanel } from './ExportPanel';
import { GalleryArt } from './GalleryArt';
import { CompareCanvas, CompareTable, type CompareItem } from './GalleryCompare';
import { PatternFigure } from './PatternFigure';
import { confirmDialog } from '../../../lib/confirm';
import { goToCymatics } from './goToCymatics';

type Mode = 'browse' | 'open' | 'art' | 'compare';
type Filter = 'all' | StudioId | 'fav';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'plate', label: 'Plate' },
  { id: 'liquid', label: 'Dish' },
  { id: 'membrane', label: 'Drum' },
  { id: 'fav', label: '★ Favourites' },
];
const STUDIO_ROUTE: Record<StudioId, 'CymaticsPlateStudio' | 'CymaticsLiquidStudio' | 'CymaticsMembraneStudio'> = { plate: 'CymaticsPlateStudio', liquid: 'CymaticsLiquidStudio', membrane: 'CymaticsMembraneStudio' };
const STUDIO_TAG: Record<StudioId, string> = { plate: 'PLATE', liquid: 'DISH', membrane: 'DRUM' };

// Geometry per (pattern, STATE) — the science chain runs once per distinct
// state; a rename or a note edit does not recompute the field.
const geomCache = new Map<string, PatternGeometry>();
function geometryFor(p: SavedPattern): PatternGeometry {
  const key = `${p.id}:${JSON.stringify(p.state)}`;
  let g = geomCache.get(key);
  if (!g) {
    g = patternGeometry(p.state, ART_N);
    if (geomCache.size > 80) geomCache.delete(geomCache.keys().next().value as string);
    geomCache.set(key, g);
  }
  return g;
}

export function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const { width: ww } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsGallery'>>();
  const { patterns, reload, upsert, remove, duplicate } = usePatterns();
  const [mode, setMode] = useState<Mode>(route.params?.id ? 'open' : 'browse');
  const [currentId, setCurrentId] = useState<string | null>(route.params?.id ?? null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selecting, setSelecting] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [artworks, setArtworks] = useState<Record<string, Artwork>>({});
  const [lessonKey, setLessonKey] = useState<string | undefined>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  // Artwork for every pattern, in one read (thumbnails show the colouring).
  const loadArt = useCallback(async () => {
    const list = await patternStore().loadArtworks();
    setArtworks(Object.fromEntries(list.map((a) => [a.patternId, a])));
  }, []);
  useEffect(() => {
    void loadArt();
  }, [loadArt]);
  // Coming back from a studio (SAVE there, or OPEN IN STUDIO from here): the
  // list and the artwork map re-read, so a fresh save is on the grid at once.
  useFocusEffect(
    useCallback(() => {
      void reload();
      void loadArt();
    }, [reload, loadArt]),
  );
  // A studio's "Open the gallery ›" navigates here with the new pattern's id —
  // whether this screen is fresh or already in the stack.
  const paramId = route.params?.id;
  useEffect(() => {
    if (!paramId) return;
    setCurrentId(paramId);
    setMode('open');
  }, [paramId]);

  const current = useMemo(() => patterns?.find((p) => p.id === currentId) ?? null, [patterns, currentId]);
  const currentGeom = useMemo(() => (current ? geometryFor(current) : null), [current]);
  const currentArt = current ? (artworks[current.id] ?? null) : null;

  const visible = useMemo(() => {
    const list = patterns ?? [];
    if (filter === 'all') return list;
    if (filter === 'fav') return list.filter((p) => p.favourite);
    return list.filter((p) => p.state.studio === filter);
  }, [patterns, filter]);

  const open = (id: string) => {
    setCurrentId(id);
    setMode('open');
  };
  const back = () => {
    if (mode === 'art') setMode('open');
    else if (mode === 'open' || mode === 'compare') setMode('browse');
    else navigation.goBack();
  };
  // Android hardware BACK walks the modes the same way (an open dock tray
  // registers later and closes itself first).
  useEffect(() => {
    if (mode === 'browse') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  const toggleSelect = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 4 ? ids : [...ids, id]));

  const rename = (name: string) => {
    if (!current || name.trim() === current.name) return;
    void upsert({ ...current, name: name.trim() || current.name });
  };
  const setNotes = (notes: string) => {
    if (!current || notes === current.notes) return;
    void upsert({ ...current, notes });
  };
  const toggleFav = (p: SavedPattern) => void upsert({ ...p, favourite: !p.favourite });
  const doDuplicate = () => {
    if (!current) return;
    void duplicate(current.id).then((copy) => {
      if (copy) open(copy.id);
    });
  };
  const doDelete = () => {
    if (!current) return;
    confirmDialog(
      'Delete this pattern?',
      `“${current.name}” and its artwork will be removed. This cannot be undone.`,
      'Delete',
      () => {
        void remove(current.id).then(() => {
          setArtworks((m) => {
            const n = { ...m };
            delete n[current.id];
            return n;
          });
          setCurrentId(null);
          setMode('browse');
        });
      },
      { destructive: true },
    );
  };
  const openInStudio = () => {
    if (!current) return;
    navigation.navigate(STUDIO_ROUTE[current.state.studio], { saved: current.id });
  };

  const compareItems: CompareItem[] = useMemo(
    () => compareIds.map((id) => patterns?.find((p) => p.id === id)).filter((p): p is SavedPattern => !!p).map((p) => ({ pattern: p, geometry: geometryFor(p), artwork: artworks[p.id] ?? null })),
    [compareIds, patterns, artworks],
  );

  const title = mode === 'art' ? 'ART STUDIO' : mode === 'compare' ? 'COMPARE' : mode === 'open' && current ? current.name.toUpperCase() : 'PATTERN GALLERY & ART STUDIO';
  const subtitle = mode === 'browse' ? 'Saved patterns from the three studios — reopen, colour, compare, print.' : 'Cymatics Lab: Sound Made Visible';
  const contentW = ww - 32;
  const cardW = Math.floor((contentW - 12) / 2);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <AccuracyNote compact />
      </View>

      {mode === 'art' && current && currentGeom ? (
        <GalleryArt
          key={current.id}
          pattern={current}
          geometry={currentGeom}
          initial={currentArt ?? blankArtwork(current.id, ART_N)}
          onArtwork={(a) => setArtworks((m) => ({ ...m, [a.patternId]: a }))}
          onHelp={help}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {mode === 'browse' ? (
            <>
              <View style={styles.chips}>
                {FILTERS.map((f) => (
                  <LabChip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} onLongPress={() => help('gallery')} />
                ))}
              </View>
              <View style={styles.rowBetween}>
                <LabChip
                  label={selecting ? `Selecting to compare · ${compareIds.length}/4` : 'Compare…'}
                  selected={selecting}
                  onPress={() => {
                    setSelecting((s) => !s);
                    if (selecting) setCompareIds([]);
                  }}
                  onLongPress={() => help('compare')}
                />
                {selecting ? (
                  <Pressable
                    hitSlop={4}
                    style={[styles.go, compareIds.length < 2 && styles.goOff]}
                    disabled={compareIds.length < 2}
                    onPress={() => setMode('compare')}
                    accessibilityRole="button"
                    accessibilityLabel={compareIds.length < 2 ? 'Pick at least two patterns to compare' : 'Compare the selected patterns'}
                  >
                    <Text style={styles.goText}>{compareIds.length < 2 ? 'PICK 2 – 4' : `COMPARE ${compareIds.length} ›`}</Text>
                  </Pressable>
                ) : null}
              </View>
              {patterns === null ? (
                <Text style={styles.caption}>Loading…</Text>
              ) : patterns.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>NOTHING SAVED YET</Text>
                  <Text style={styles.body}>Every studio has a SAVE key in its header. Press it while a figure is on the plate, in the dish or on the drumhead — the exact experiment comes here, ready to reopen, colour, compare and print.</Text>
                  <View style={styles.chips}>
                    <LabChip label="Open the plate studio ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsPlateStudio', {})} />
                    <LabChip label="The dish ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsLiquidStudio', {})} />
                    <LabChip label="The drum ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsMembraneStudio', {})} />
                  </View>
                </View>
              ) : visible.length === 0 ? (
                <Text style={styles.caption}>No patterns match this filter.</Text>
              ) : (
                <View style={styles.grid}>
                  {visible.map((p) => {
                    const g = geometryFor(p);
                    const sel = compareIds.includes(p.id);
                    return (
                      <Pressable
                        key={p.id}
                        style={[styles.card, { width: cardW }, selecting && sel && styles.cardSelected]}
                        onPress={() => (selecting ? toggleSelect(p.id) : open(p.id))}
                        onLongPress={() => toggleFav(p)}
                        accessibilityRole="button"
                        accessibilityLabel={`${p.name} — ${STUDIO_TAG[p.state.studio]}, ${formatHz(p.state.hz)}${selecting ? (sel ? ', selected' : ', tap to select') : ''}`}
                      >
                        <View style={styles.thumb}>
                          <PatternFigure geometry={g} artwork={artworks[p.id] ?? null} width={cardW - 2} height={cardW - 2} pad={8} />
                        </View>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Pressable onPress={() => toggleFav(p)} hitSlop={8} accessibilityRole="button" accessibilityLabel={p.favourite ? 'Remove from favourites' : 'Add to favourites'}>
                            <Text style={[styles.star, p.favourite && styles.starOn]}>★</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.cardSub}>
                          {STUDIO_TAG[p.state.studio]} · {formatHz(p.state.hz)}
                          {selecting && sel ? ` · ${String.fromCharCode(65 + compareIds.indexOf(p.id))}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <Pressable style={styles.lessonRow} onPress={() => help('gallery')} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
                <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — the gallery and the art studio</Text>
              </Pressable>
            </>
          ) : null}

          {mode === 'open' && current && currentGeom ? (
            <>
              <View style={styles.preview}>
                <PatternFigure geometry={currentGeom} artwork={currentArt} width={contentW} height={Math.round(contentW * Math.max(0.8, Math.min(1.2, currentGeom.aspect)))} />
                <Text style={styles.badge}>{/^SIMULATION/i.test(current.badge) ? current.badge : `SIMULATION · ${current.badge}`}</Text>
              </View>
              <View style={styles.chips}>
                <LabChip label="Open in studio ›" selected={false} onPress={openInStudio} onLongPress={() => help('save_pattern')} />
                <LabChip label="Colour ›" selected={false} onPress={() => setMode('art')} onLongPress={() => help('art_fill')} />
                <LabChip label="Duplicate" selected={false} onPress={doDuplicate} />
                <LabChip label={current.favourite ? '★ Favourited' : '★ Favourite'} selected={current.favourite} onPress={() => toggleFav(current)} />
                <LabChip label="Delete" selected={false} onPress={doDelete} />
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>NAME</Text>
                <TextInput key={`n${current.id}`} defaultValue={current.name} onEndEditing={(e) => rename(e.nativeEvent.text)} style={styles.input} placeholder="Name this pattern" placeholderTextColor={colors.textMuted} maxLength={80} returnKeyType="done" />
                <Text style={styles.label}>NOTES</Text>
                <TextInput key={`t${current.id}`} defaultValue={current.notes} onEndEditing={(e) => setNotes(e.nativeEvent.text)} onBlur={() => undefined} style={[styles.input, styles.inputMulti]} placeholder="What you were testing, what you saw…" placeholderTextColor={colors.textMuted} multiline maxLength={600} />
              </View>
              <Readout pattern={current} />
              <ExportPanel subject={{ kind: 'pattern', pattern: current, geometry: currentGeom, artwork: currentArt }} onHelp={help} />
              <Pressable style={styles.lessonRow} onPress={() => help('gallery')} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
                <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
              </Pressable>
            </>
          ) : null}

          {mode === 'compare' ? (
            compareItems.length < 2 ? (
              <Text style={styles.caption}>Pick two to four patterns in the gallery to compare them.</Text>
            ) : (
              <>
                <View style={styles.preview}>
                  <CompareCanvas items={compareItems} width={contentW - 20} />
                </View>
                <CompareTable items={compareItems} />
                <View style={styles.chips}>
                  <LabChip
                    label="Edit selection ‹"
                    selected={false}
                    onPress={() => {
                      setSelecting(true);
                      setMode('browse');
                    }}
                  />
                  <LabChip label="What am I looking at?" selected={false} onPress={() => help('compare')} />
                </View>
                <ExportPanel subject={{ kind: 'compare', items: compareItems }} onHelp={help} />
              </>
            )
          ) : null}
        </ScrollView>
      )}
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

function Readout({ pattern }: { pattern: SavedPattern }) {
  const ro = useMemo(() => patternReadout(pattern.state), [pattern]);
  return (
    <View style={styles.block}>
      <Text style={styles.label}>
        {ro.studioLabel} · {ro.note.label} {ro.note.centsLabel}
      </Text>
      {ro.rows.map((r) => (
        <View key={r.k} style={styles.tr}>
          <Text style={styles.th}>{r.k}</Text>
          <Text style={styles.td}>{r.v}</Text>
        </View>
      ))}
      <Text style={styles.caption}>Every value above is the state the figure was saved from. OPEN IN STUDIO restores exactly this.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  go: { borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11', paddingHorizontal: 14, paddingVertical: 9, minHeight: 40, justifyContent: 'center' },
  goOff: { opacity: 0.4 },
  goText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  empty: { borderRadius: 12, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 14, gap: 10 },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', overflow: 'hidden', paddingBottom: 8 },
  cardSelected: { borderColor: colors.green, borderWidth: 2 },
  thumb: { backgroundColor: '#0b0b10' },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 6, gap: 6 },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.textPrimary, flexShrink: 1 },
  cardSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, paddingHorizontal: 10 },
  star: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: '#3a3a44' },
  starOn: { color: colors.amber },
  preview: { borderRadius: 12, borderWidth: 1, borderColor: '#2a2a32', backgroundColor: '#0b0b10', overflow: 'hidden', alignItems: 'center', paddingBottom: 6 },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)', paddingHorizontal: 10 },
  block: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 6 },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  input: { fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: '#2a2a32', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, backgroundColor: '#0b0b10' },
  inputMulti: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 19, minHeight: 72, textAlignVertical: 'top' },
  tr: { flexDirection: 'row', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2a2a32', paddingVertical: 4 },
  th: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, width: 96 },
  td: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary, flex: 1 },
  lessonRow: { marginTop: 6, borderRadius: 10, borderWidth: 1, borderColor: '#232329', paddingVertical: 12, paddingHorizontal: 14 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
});
