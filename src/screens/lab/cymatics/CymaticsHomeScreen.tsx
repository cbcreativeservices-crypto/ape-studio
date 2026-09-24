/**
 * CymaticsHomeScreen — the Cymatics Lab's own home (spec §3 IA; Digital Lab
 * idiom). A LIVE hero — the illustrated plate with sand settling onto its
 * first figure — then the studio, the five Phase-1 modules, and the planned
 * areas as dimmed rows (no promises, no dates).
 */
import { useMemo, useState } from 'react';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { DEFAULT_PLATE, effectiveQ, plateModes, readResonance, sampleField } from '../../../features/cymatics/plateModes';
import { CYMATICS_MODULES, PLANNED_AREAS, type CymaticsModuleId } from './modules/registry';
import { requireVizPlate, skiaAvailable } from './skiaGate';
import { goToCymatics } from './goToCymatics';

const HERO_N = 48;

function HeroPlate({ width }: { width: number }) {
  const viz = skiaAvailable ? requireVizPlate() : null;
  // RUN ONLY WHEN THE HOME IS ACTUALLY IN FRONT (design pass, 2026-09-17).
  //
  // `running` was a literal `true`, so this 2,200-particle physics simulation
  // kept stepping every frame while the learner was two screens deep in a
  // studio — which is where they spend most of their time in this lab. Every
  // module already does this (CymaticsModuleScreen passes `focused`); the home,
  // the heaviest surface of the lot, was the one that did not.
  //
  // It is also the lab's only Low-Light concern: this is the one thing in
  // cymatics that starts moving before the learner asks for anything.
  const focused = useIsFocused();
  // The classic square aluminum plate parked on its second excitable mode.
  const spec = DEFAULT_PLATE;
  const { grid, strength } = useMemo(() => {
    const modes = plateModes(spec, 12);
    const Q = effectiveQ(spec.material, spec.damping);
    const ex = modes.filter((m) => m.drive > 0.05);
    const f = ex[1]?.hz ?? ex[0]?.hz ?? 300;
    return { grid: sampleField(spec, modes, f, Q, HERO_N), strength: readResonance(f, modes, Q).strength };
  }, [spec]);
  if (!viz) {
    return (
      <View style={[styles.heroFallback, { width, height: Math.round(width * 0.62) }]}>
        <Text style={styles.heroFallbackText}>The live plate needs the current app build (Skia).</Text>
      </View>
    );
  }
  return (
    <viz.PlateView
      width={width}
      height={Math.round(width * 0.62)}
      spec={spec}
      grid={grid}
      N={HERO_N}
      strength={strength}
      amplitude={0.8}
      view="particles"
      running={focused}
      slowMo={false}
      particleCount={2200}
      particleSize={0.4}
      friction={0.4}
      resetToken={0}
      sectionY={0.5}
      dragTarget={null}
    />
  );
}

export function CymaticsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const [openId, setOpenId] = useState<CymaticsModuleId | null>(null);
  const [width, setWidth] = useState(0);
  const open = (id: CymaticsModuleId) => goToCymatics(navigation, 'CymaticsModule', { id });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>CYMATICS LAB: SOUND MADE VISIBLE</Text>
          <Text style={styles.subtitle}>Chladni plates, liquids, membranes, resonance, frequency and harmonic relationships.</Text>
        </View>
        <AccuracyNote compact />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
          {width > 0 ? <HeroPlate width={width} /> : null}
          <Text style={styles.heroBadge}>SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTRE-DRIVEN</Text>
        </View>
        {/* ── ONE RECOMMENDED PATH (2026-09-18, design review #11) ─────────────
            The home offers thirteen entry points — four studio buttons ABOVE
            eight learn modules — so the default gesture is "open an instrument"
            before any framing, and the lab's actual designed path (the
            seventeen-experiment series) is buried inside module 8 where nobody
            finds it. One primary row orients the 80% and costs nothing. */}
        <Pressable
          style={styles.startHere}
          onPress={() => open('intro')}
          accessibilityRole="button"
          accessibilityLabel="New here? Start with What Is Cymatics"
        >
          <Text style={styles.startHereHead}>NEW HERE? START HERE ›</Text>
          <Text style={styles.startHereSub}>
            What Is Cymatics first, then Change One Thing — then run the seventeen experiments.
          </Text>
        </Pressable>
        <Text style={styles.body}>
          Does 440 Hz have a shape? Play a tone into a plate and sand walks into a figure — so it is tempting to say the figure belongs to
          the note. Every experiment in this lab lets you test that idea: keep the frequency exactly where it is and change the plate, the
          liquid, the driver or the support, and watch what happens to the pattern. The answer is the lab’s central discovery, and you get
          to find it yourself.
        </Text>

        <Pressable style={styles.studioBtn} onPress={() => goToCymatics(navigation, 'CymaticsPlateStudio', {})} accessibilityRole="button" accessibilityLabel="Open the Chladni Plate Studio">
          <Text style={styles.studioBtnText}>OPEN THE CHLADNI PLATE STUDIO ›</Text>
          <Text style={styles.studioBtnSub}>Build a plate · drive it with a tone · seven synchronised views</Text>
        </Pressable>
        <Pressable style={[styles.studioBtn, styles.studioBtnLiquid]} onPress={() => goToCymatics(navigation, 'CymaticsLiquidStudio', {})} accessibilityRole="button" accessibilityLabel="Open the Liquid Cymatics Studio">
          <Text style={[styles.studioBtnText, { color: '#7fd4ff' }]}>OPEN THE LIQUID CYMATICS STUDIO ›</Text>
          <Text style={styles.studioBtnSub}>A dish on a shaker · Faraday waves at half the drive frequency · eight liquids</Text>
        </Pressable>
        <Pressable style={[styles.studioBtn, styles.studioBtnMembrane]} onPress={() => goToCymatics(navigation, 'CymaticsMembraneStudio', {})} accessibilityRole="button" accessibilityLabel="Open the Membrane and Loudspeaker Studio">
          <Text style={[styles.studioBtnText, { color: '#e2c48a' }]}>OPEN THE MEMBRANE &amp; LOUDSPEAKER STUDIO ›</Text>
          <Text style={styles.studioBtnSub}>Tune and strike a drumhead · why a timpani has a pitch · a loudspeaker cone from piston to breakup</Text>
        </Pressable>
        <Pressable style={[styles.studioBtn, styles.studioBtnGallery]} onPress={() => goToCymatics(navigation, 'CymaticsGallery', {})} accessibilityRole="button" accessibilityLabel="Open the Pattern Gallery and Art Studio">
          <Text style={[styles.studioBtnText, { color: colors.programPurple }]}>OPEN THE PATTERN GALLERY &amp; ART STUDIO ›</Text>
          <Text style={styles.studioBtnSub}>Save a pattern from any studio · colour it · compare 2 or 4 · art print or lab sheet</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>LEARN &amp; EXPERIMENT</Text>
        {CYMATICS_MODULES.map((m, i) => (
          <ModuleAccordionRow key={m.id} num={i + 1} name={m.title} blurb={m.blurb} expanded={openId === m.id} onToggle={() => setOpenId(openId === m.id ? null : m.id)} onOpen={() => open(m.id)} />
        ))}

        {PLANNED_AREAS.length > 0 ? <Text style={styles.sectionTitle}>PLANNED AREAS</Text> : null}
        {PLANNED_AREAS.map((p) => (
          <View key={p.title} style={styles.planned}>
            <Text style={styles.plannedTitle}>{p.title}</Text>
            <Text style={styles.plannedBlurb}>{p.blurb}</Text>
            <Text style={styles.plannedNote}>Planned area — not open yet.</Text>
          </View>
        ))}

        <Pressable style={styles.lessonRow} onPress={() => setLessonOpen(true)} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
          <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — the lab in one read</Text>
        </Pressable>
      </ScrollView>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} onClose={() => setLessonOpen(false)} />
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
  hero: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a32', backgroundColor: '#0b0b10' },
  startHere: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.7)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  startHereHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
  startHereSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  heroBadge: { position: 'absolute', left: 10, bottom: 8, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroFallbackText: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  studioBtn: { borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.75)', backgroundColor: '#1a1409', paddingVertical: 14, paddingHorizontal: 16, gap: 3 },
  studioBtnLiquid: { borderColor: 'rgba(127,212,255,.7)', backgroundColor: '#0a1520' },
  studioBtnMembrane: { borderColor: 'rgba(226,196,138,.7)', backgroundColor: '#17130b' },
  studioBtnGallery: { borderColor: 'rgba(196,162,255,.7)', backgroundColor: '#120f1c' },
  studioBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.2, color: colors.amber },
  studioBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber, marginTop: 8 },
  planned: { borderRadius: 10, borderWidth: 1, borderColor: '#1f1f26', backgroundColor: '#0e0e12', padding: 12, gap: 3, opacity: 0.55 },
  plannedTitle: { fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.textPrimary },
  plannedBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  plannedNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub, marginTop: 2 },
  lessonRow: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#232329', paddingVertical: 12, paddingHorizontal: 14 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
});
