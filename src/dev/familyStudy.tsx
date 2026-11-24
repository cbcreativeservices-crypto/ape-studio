/**
 * FIGURE STUDY — "FAMILIES" (wave 5 of D78, 2026-11-24): the players the
 * instrument families draw with their own figure code.
 * DEV + WEB ONLY: `#labpreview/FigureStudy/families` (all), or
 * `#labpreview/FigureStudy/families-<id>` for one case (see CASES: violin,
 * violinSeated, viola, cello, bassBow, bassPluck, trumpet, flugelhorn,
 * trombone, bassTrombone …); `-dbg` after the id shows each hand alone with
 * its parts outlined. Each picture OLD beside NEW at the lesson's size, then
 * the new one enlarged, the head and shoulders, and each hand close.
 */
import { useMemo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import type { Vec3 } from '../screens/lab/miking/engine/model/types';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { PaintItem, sceneGroups as bowedGroups, cutFor, type Group3 } from '../screens/lab/miking/lessons/shared/bowed/BowedArt';
import { underChin, seated, standing, type Posture } from '../screens/lab/miking/lessons/shared/bowed/posture';
import { VIOLIN, VIOLA, CELLO, BASS } from '../screens/lab/miking/lessons/shared/bowed/bowedSpec';
import { drawnHands } from '../screens/lab/miking/lessons/shared/bowed/bowedHands';
import { bowedFamIn, bowedPlayer } from '../screens/lab/miking/lessons/shared/bowed/bowedFigureV2';
import { sceneGroups as brassGroups } from '../screens/lab/miking/lessons/shared/brass/BrassArt';
import { MuteView } from '../screens/lab/miking/lessons/shared/brass/BrassSoundArt';
import { slidePose, valvedPose, type HornPose } from '../screens/lab/miking/lessons/shared/brass/brassPosture';
import { BASS_TB, FLUGELHORN, TENOR, TRUMPET } from '../screens/lab/miking/lessons/shared/brass/brassSpec';
import { brassFamIn, brassPlayer } from '../screens/lab/miking/lessons/shared/brass/brassFigureV2';
import { famPlan, type FamIn, type FamPlan } from '../screens/lab/miking/lessons/shared/figureV2/familyV2';
import { FamilyHandV2 } from '../screens/lab/miking/lessons/shared/figureV2/familyHandV2';
import { FigureLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import type { CastMember } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { sceneItems as lowItems } from '../screens/lab/miking/lessons/shared/lowbrass/LowBrassArt';
import { brassScene as lowScene, type BrassScene as LowScene } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassScene';
import { HORN, TUBA, EUPH } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassSpec';
import { lowBrassFamIn, lowBrassPlayer } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassFigureV2';

const LOW_SPECS = [HORN, TUBA, EUPH];
import { SHK_ART } from '../screens/lab/miking/lessons/i03aShaker/art';
import { EGG_ART } from '../screens/lab/miking/lessons/i03bEgg/art';
import { MAR_ART } from '../screens/lab/miking/lessons/i03cMaracas/art';
import { TMB_ART } from '../screens/lab/miking/lessons/i04Tambourine/art';
import { BELL_ART } from '../screens/lab/miking/lessons/i05aCowbell/art';
import { CLV_ART } from '../screens/lab/miking/lessons/i05bClaves/art';
import { WB_ART } from '../screens/lab/miking/lessons/i05cWoodblock/art';
import { GU_ART } from '../screens/lab/miking/lessons/i05dGuiro/art';
import { C13_ART } from '../screens/lab/miking/lessons/c13Oud/art';
import { C14_ART } from '../screens/lab/miking/lessons/c14Sitar/art';
import { C15_ART } from '../screens/lab/miking/lessons/c15Veena/art';
import { spPlayer } from '../screens/lab/miking/lessons/shared/smallperc/smallPercV2';
import { lutePlayer } from '../screens/lab/miking/lessons/shared/lutes/luteFigureV2';
import { accFigure, AccordionPlayerV2 } from '../screens/lab/miking/lessons/shared/freereed/accordionFigureV2';
import { PersonFrontV2 } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Front';
import { A10_ART, HandChamber } from '../screens/lab/miking/lessons/a10Harmonica/art';
import { FLOOR_Y as HM_FLOOR, H0 as HM_H0 } from '../screens/lab/miking/lessons/a10Harmonica/model';
import { A11_ART, AccordionFront, BellowsCycle } from '../screens/lab/miking/lessons/a11Accordion/art';
import { BODY as ACC_BODY, FLOOR_Y as ACC_FLOOR } from '../screens/lab/miking/lessons/a11Accordion/model';
import { castFor as castOf } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { sceneOfKind } from '../screens/lab/miking/lessons/shared/lutes/luteModel';
import { WindScene } from '../screens/lab/miking/lessons/shared/woodwinds/WindArt';
import { pointAt as windPointAt, type Layout as WindLayout } from '../screens/lab/miking/lessons/shared/woodwinds/windPosture';
import { windFamIn, windPlayer } from '../screens/lab/miking/lessons/shared/woodwinds/windFigureV2';
import { layoutOf as fluteLayout } from '../screens/lab/miking/lessons/a06Flute/geometry';
import { layoutOf as piccLayout } from '../screens/lab/miking/lessons/a07Piccolo/geometry';
import { layoutOf as clLayout } from '../screens/lab/miking/lessons/a08aClarinet/geometry';
import { layoutOf as bclLayout } from '../screens/lab/miking/lessons/a08bBassClarinet/geometry';
import { layoutOf as obLayout } from '../screens/lab/miking/lessons/a09aOboe/geometry';
import { layoutOf as bsnLayout } from '../screens/lab/miking/lessons/a09bBassoon/geometry';
import { SaxScene } from '../screens/lab/miking/lessons/shared/sax/SaxArt';
import { saxPosture, centre, type SaxPosture } from '../screens/lab/miking/lessons/shared/sax/saxPosture';
import { SOPRANO, ALTO, TENOR as SAX_TENOR, BARITONE, pathOf } from '../screens/lab/miking/lessons/shared/sax/saxSpec';
import { saxFamIn, saxPlayer } from '../screens/lab/miking/lessons/shared/sax/saxFigureV2';

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

type Box = { u0: number; v0: number; u1: number; v1: number };
type View2 = 'side' | 'top';

/** One case of the study: its groups old or new, its figure input, who plays, its neck. */
export type FamCase = { id: string; title: string; groups: (view: View2, v2: boolean) => Group3[]; famIn: (view: View2) => FamIn | null; who: CastMember; neck: Vec3; /** the picture's window when the groups carry no boxes */ box?: (view: View2) => Box; /** the lesson's own art only (the switch decides the look): no OLD column */ noOld?: boolean };

/** One picture: a window (mm) `box`, `w` pt wide. */
function Pic({ title, box, w, children }: { title: string; box: Box; w: number; children: ReactNode }) {
  const mmW = box.u1 - box.u0;
  const mmH = box.v1 - box.v0;
  const s = w / mmW;
  const h = mmH * s;
  return (
    <View style={{ marginRight: 10, marginBottom: 10 }}>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 3, maxWidth: w }}>{title}</Text>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <Group transform={[{ translateX: -box.u0 * s }, { translateY: -box.v0 * s }, { scale: s }]}>
          <FigureScale ptPerMm={s}>{children}</FigureScale>
        </Group>
      </Canvas>
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</View>;
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginTop: 14, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

/** The scene's groups painted far → near (without sweeps or labels). */
function Scene({ c, view, v2 }: { c: FamCase; view: View2; v2: boolean }) {
  const groups = useMemo(() => c.groups(view, v2), [c, view, v2]);
  return (
    <Group>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
    </Group>
  );
}

const bowedCase = (id: string, title: string, P: Posture, bow: boolean): FamCase => ({
  id,
  title,
  groups: (view, v2) => bowedGroups(P, view, { bow, v2 }),
  famIn: (view) => {
    const D = drawnHands(P, bow && P.strokes.length > 0);
    return bowedFamIn(D.P, D, view, bow, (a) => cutFor(view, a));
  },
  who: bowedPlayer(P),
  neck: P.player.neck,
});
const brassCase = (id: string, title: string, P: HornPose): FamCase => ({
  id,
  title,
  groups: (view, v2) => brassGroups(P, view, { v2 }),
  famIn: (view) => brassFamIn(P, view),
  who: brassPlayer(P),
  neck: P.player.neck,
});

const EMPTY = Skia.Path.Make();
const nodeGroups = (items: { key: string; depth: number; node: ReactNode }[]): Group3[] => items.map((it) => ({ key: it.key, depth: it.depth, items: [{ path: EMPTY, box: { u0: 0, v0: 0, u1: 0, v1: 0 }, node: <Group>{it.node}</Group> }] }));
const ptsBox = (view: View2, pts: Vec3[], pad: number): Box => {
  const q = pts.map((p) => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z }));
  return { u0: Math.min(...q.map((p) => p.u)) - pad, v0: Math.min(...q.map((p) => p.v)) - pad, u1: Math.max(...q.map((p) => p.u)) + pad, v1: Math.max(...q.map((p) => p.v)) + pad };
};
const lowCase = (id: string, title: string, s: LowScene): FamCase => ({
  id,
  title,
  groups: (view, v2) => nodeGroups(lowItems(s, view, { v2 })),
  famIn: (view) => lowBrassFamIn(s, view),
  who: lowBrassPlayer(s),
  neck: s.J.neck,
  box: (view) => ptsBox(view, [...s.tubes.flatMap((t) => t.pts), s.J.head, s.J.toeR, s.J.toeL, s.J.shoulderL, s.J.shoulderR, s.J.hipL, { x: s.J.hipL.x, y: 0, z: s.J.hipL.z }], 220),
});

const saxCase = (id: string, title: string, P: SaxPosture): FamCase => ({
  id,
  title,
  groups: (view, v2) => nodeGroups([{ key: 'sax', depth: 0, node: <SaxScene P={P} view={view} v2={v2} /> }]),
  famIn: (view) => saxFamIn(P, view),
  who: saxPlayer(P),
  neck: P.player.neck,
  box: (view) => {
    const S = pathOf(P.row);
    const us = Array.from({ length: 12 }, (_, i) => S.mouthEnd + ((S.bellStart - S.mouthEnd) * i) / 11);
    const j = P.player;
    return ptsBox(view, [...us.map((u) => centre(P, u)), j.head, j.toeL, j.toeR, j.shoulderL, j.shoulderR, j.hipL, { x: j.hipL.x, y: P.floorY, z: j.hipL.z }], 200);
  },
});

const windCase = (id: string, title: string, L: WindLayout): FamCase => ({
  id,
  title,
  // (the woodwinds' engine 'side' view is the player face-on)
  groups: (view, v2) => nodeGroups([{ key: 'wind', depth: 0, node: <WindScene L={L} view={view} v2={v2} /> }]),
  famIn: (view) => windFamIn(L, view),
  who: windPlayer(L),
  neck: L.body.neck,
  box: (view) => {
    const B = L.body;
    const tube = Array.from({ length: 10 }, (_, i) => windPointAt(L, L.segs[0].s0 + ((L.segs[L.segs.length - 1].s1 - L.segs[0].s0) * i) / 9));
    return ptsBox(view, [...tube, B.head.c, B.toeL, B.toeR, B.shoulderL, B.shoulderR, B.hipL, { x: B.hipL.x, y: B.floorY, z: B.hipL.z }], 220);
  },
});

/** A lesson's own art (the switch decides the look), in a fixed window. */
const artCase = (id: string, title: string, art: { Instrument: (p: { view: View2; variant: string }) => ReactNode }, variant: string, who: CastMember, neck: Vec3, boxes: Record<View2, Box>, famIn: (view: View2) => FamIn | null = () => null): FamCase => ({
  id,
  title,
  groups: (view) => nodeGroups([{ key: 'art', depth: 0, node: <>{art.Instrument({ view, variant })}</> }]),
  famIn,
  who,
  neck,
  box: (view) => boxes[view],
  noOld: true,
});
const SP_BOX: Record<View2, Box> = { side: { u0: -700, v0: -1780, u1: 650, v1: 80 }, top: { u0: -700, v0: -480, u1: 650, v1: 480 } };
const SP_NECK = { x: -352, y: -1440, z: 0 };
const luteBox = (kind: 'oud' | 'sitar' | 'veena'): Record<View2, Box> => {
  const sc = sceneOfKind(kind);
  const h = sc.fit.head.c;
  return { side: { u0: h.x - 900, v0: h.y - 250, u1: h.x + 1500, v1: sc.floorY + 80 }, top: { u0: h.x - 900, v0: h.z - 700, u1: h.x + 1500, v1: h.z + 700 } };
};

const CASES: FamCase[] = [
  bowedCase('violin', 'VIOLIN, standing (C09a)', underChin(VIOLIN, 0, false), true),
  bowedCase('violinSeated', 'VIOLIN, seated (C09a)', underChin(VIOLIN, 0, true), true),
  bowedCase('viola', 'VIOLA, standing (C09b; seated as the violin)', underChin(VIOLA, 20, false), true),
  bowedCase('cello', 'CELLO (C09c)', seated(CELLO), true),
  bowedCase('bassBow', 'DOUBLE BASS, bowed (C06b)', standing(BASS, 'bow'), true),
  bowedCase('bassPluck', 'DOUBLE BASS, plucked (C06a)', standing(BASS, 'pluck'), false),
  brassCase('trumpet', 'TRUMPET (A01)', valvedPose(TRUMPET)),
  brassCase('flugelhorn', 'FLUGELHORN (A01)', valvedPose(FLUGELHORN)),
  brassCase('trombone', 'TENOR TROMBONE (A02)', slidePose(TENOR)),
  brassCase('bassTrombone', 'BASS TROMBONE (A02)', slidePose(BASS_TB)),
  ...[SOPRANO, ALTO, SAX_TENOR, BARITONE].flatMap((row) => (['standing', 'seated'] as const).map((k) => saxCase(`${row.id}${k === 'seated' ? 'Seated' : ''}`, `${row.id.toUpperCase()} SAX · ${k}`, saxPosture(row, k)))),
  windCase('flute', 'FLUTE (A06)', fluteLayout('')),
  windCase('piccolo', 'PICCOLO (A07)', piccLayout('standing')),
  windCase('clarinet', 'CLARINET (A08a), seated', clLayout('seated')),
  windCase('bassClarinet', 'BASS CLARINET (A08b)', bclLayout('')),
  windCase('oboe', 'OBOE (A09a), seated', obLayout('seated')),
  windCase('bassoon', 'BASSOON (A09b), seated', bsnLayout('seated')),
  artCase('shaker', 'SHAKER (I03a)', SHK_ART as never, 'tube', spPlayer(), SP_NECK, SP_BOX),
  artCase('egg', 'EGG SHAKER (I03b)', EGG_ART as never, 'one', spPlayer(), SP_NECK, SP_BOX),
  artCase('maracas', 'MARACAS (I03c)', MAR_ART as never, 'pair', spPlayer(), SP_NECK, SP_BOX),
  artCase('tambourine', 'TAMBOURINE (I04)', TMB_ART as never, 'shake', spPlayer(), SP_NECK, SP_BOX),
  artCase('cowbell', 'COWBELL (I05a)', BELL_ART as never, 'mounted', spPlayer(), SP_NECK, SP_BOX),
  artCase('cowbellHand', 'COWBELL, handheld (I05a)', BELL_ART as never, 'handheld', spPlayer(), SP_NECK, SP_BOX),
  artCase('claves', 'CLAVES (I05b)', CLV_ART as never, 'standard', spPlayer(), SP_NECK, SP_BOX),
  artCase('woodblock', 'WOODBLOCK (I05c)', WB_ART as never, 'handheld', spPlayer(), SP_NECK, SP_BOX),
  artCase('guiro', 'GÜIRO (I05d)', GU_ART as never, 'standard', spPlayer(), SP_NECK, SP_BOX),
  artCase('oud', 'OUD (C13)', C13_ART as never, 'standard', lutePlayer({ kind: 'oud' }), sceneOfKind('oud').fit.head.c, luteBox('oud')),
  artCase('sitar', 'SITAR (C14)', C14_ART as never, 'standard', lutePlayer({ kind: 'sitar' }), sceneOfKind('sitar').fit.head.c, luteBox('sitar')),
  artCase('veena', 'VEENA (C15)', C15_ART as never, 'standard', lutePlayer({ kind: 'veena' }), sceneOfKind('veena').fit.head.c, luteBox('veena')),
  artCase('harmonica', 'HARMONICA (A10) — the close-ups: families-harmonicaClose', A10_ART as never, 'acoustic', castOf('freereed.harmonica'), HM_H0, { side: { u0: HM_H0.x - 900, v0: HM_FLOOR - 1900, u1: HM_H0.x + 500, v1: HM_FLOOR + 80 }, top: { u0: HM_H0.x - 900, v0: HM_H0.z - 600, u1: HM_H0.x + 500, v1: HM_H0.z + 600 } }),
  ...(['in', 'out'] as const).map((v) => artCase(`accordion${v === 'in' ? 'Closed' : 'Open'}`, `ACCORDION (A11), ${v === 'in' ? 'closed' : 'fully open'} — face-on: families-accordionFront`, A11_ART as never, v, castOf('freereed.accordion'), ACC_BODY.headC, { side: { u0: -900, v0: -700, u1: 500, v1: ACC_FLOOR + 80 }, top: { u0: -900, v0: -1100, u1: 500, v1: 600 } })),
  ...LOW_SPECS.flatMap((sp) => sp.orients.map((o) => lowCase(`${sp.id}-${o}`.replace(/-/g, ''), `${sp.id.toUpperCase()} · ${o} (${sp.id === 'horn' ? 'A03' : sp.id === 'tuba' ? 'A04a' : 'A04b'})`, lowScene(sp, o)))),
];

/** The window round the whole picture (every item's box, old look). */
function boxOf(c: FamCase, view: View2): Box {
  if (c.box) return c.box(view);
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const g of c.groups(view, false))
    for (const it of g.items) {
      u0 = Math.min(u0, it.box.u0);
      v0 = Math.min(v0, it.box.v0);
      u1 = Math.max(u1, it.box.u1);
      v1 = Math.max(v1, it.box.v1);
    }
  const pad = 60;
  return { u0: u0 - pad, v0: v0 - pad, u1: u1 + pad, v1: v1 + pad };
}

const DBG = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#f78c6b'];
/** (dev) each part's own outline in its own color: is the pose read right? */
function HandDebug({ fp, side }: { fp: FamPlan; side: 'L' | 'R' }) {
  const a = fp.arms.find((x) => x.side === side);
  if (!a) return null;
  return (
    <Group>
      <FigureLook look={fp.in.who.look}>
        <FamilyHandV2 h={a.hand} />
      </FigureLook>
      {a.hand.parts.map((p, i) => {
        const path = Skia.Path.Make();
        p.form.forEach((q, j) => (j ? path.lineTo(q.u, q.v) : path.moveTo(q.u, q.v)));
        path.close();
        return <Path key={i} path={path} style="stroke" strokeWidth={0.8} color={DBG[i % DBG.length]} opacity={p.layer === 'behind' ? 0.5 : 1} />;
      })}
    </Group>
  );
}

function planOf(c: FamCase, view: View2) {
  const fi = c.famIn(view);
  return fi ? famPlan(fi) : null;
}

function shoulderBox(c: FamCase, view: View2): Box {
  const n = c.neck;
  const q = view === 'side' ? { u: n.x, v: n.y } : { u: n.x, v: n.z };
  return { u0: q.u - 300, v0: q.v - 300, u1: q.u + 300, v1: q.v + 300 };
}

function handBoxes(c: FamCase, view: View2): { side: 'L' | 'R'; title: string; box: Box }[] {
  const fp = planOf(c, view);
  if (!fp) return [];
  return fp.arms.map((a) => {
    const b = a.hand.box;
    const cu = (b.u0 + b.u1) / 2;
    const cv = (b.v0 + b.v1) / 2;
    const r = 110;
    return { side: a.side, title: a.side === 'L' ? 'LEFT HAND' : 'RIGHT HAND', box: { u0: cu - r, v0: cv - r, u1: cu + r, v1: cv + r } };
  });
}

function CaseView({ c, width, dbg }: { c: FamCase; width: number; dbg?: boolean }) {
  const lessonW = Math.min(330, width - 24);
  const big = Math.min(width - 24, 900);
  const close = Math.min(width - 24, 760);
  return (
    <View>
      <Head title={`${c.title} — played by ${c.who.name}`} note="Side view (from the player's right) and from above, OLD beside NEW at about the lesson's size; then NEW enlarged; the head and shoulders; each hand close (the instrument drawn, as in the lesson)." />
      {(['side', 'top'] as const).map((view) => {
        const box = boxOf(c, view);
        const hands = handBoxes(c, view);
        // (the lesson's 'side' picture of a wind, lute or accordion player is the player face-on)
        const vName = view === 'side' && c.famIn('side')?.view === 'front' ? 'face-on' : view === 'side' ? 'side' : 'from above';
        if (dbg) {
          const fp = planOf(c, view);
          return fp ? (
            <Row key={view}>
              {hands.map((h) => (
                <Pic key={h.side} title={`DEBUG · ${view} · ${h.title} alone`} box={h.box} w={close}>
                  <HandDebug fp={fp} side={h.side} />
                </Pic>
              ))}
            </Row>
          ) : null;
        }
        return (
          <View key={view}>
            <Row>
              {c.noOld ? null : (
                <Pic title={`OLD · ${vName}`} box={box} w={lessonW}>
                  <Scene c={c} view={view} v2={false} />
                </Pic>
              )}
              <Pic title={`NEW · ${vName}`} box={box} w={lessonW}>
                <Scene c={c} view={view} v2 />
              </Pic>
            </Row>
            <Row>
              <Pic title={`NEW · ${vName} · enlarged`} box={box} w={big}>
                <Scene c={c} view={view} v2 />
              </Pic>
            </Row>
            <Row>
              <Pic title={`NEW · ${vName} · head and shoulders`} box={shoulderBox(c, view)} w={close}>
                <Scene c={c} view={view} v2 />
              </Pic>
            </Row>
            <Row>
              {hands.map((h) => (
                <Pic key={h.side} title={`NEW · ${vName} · ${h.title}`} box={h.box} w={close}>
                  <Scene c={c} view={view} v2 />
                </Pic>
              ))}
            </Row>
          </View>
        );
      })}
    </View>
  );
}

export function FamiliesStudy({ width, only, dbg }: { width: number; only?: string; dbg?: boolean }) {
  const cases = only ? CASES.filter((c) => c.id === only) : CASES;
  if (only === 'accordionFront')
    return (
      <View>
        <Head title="A11 — face-on (MEET, the bellows sound page): closed, half, fully open" />
        <Row>
          {[0, 0.5, 1].map((t) => (
            <BellowsCycle key={t} w={width - 24} h={Math.round((width - 24) * 0.68)} t={t} push={false} mic={{ u: 700, v: 0 }} accessibilityLabel={`accordion ${t}`} />
          ))}
        </Row>
        <Head title="A11 — face-on, close: the shoulders and both hands (half open)" />
        {(() => {
          const W = width - 24;
          const box = { u0: -520, u1: 560, v0: -620, v1: 120 };
          const k = W / (box.u1 - box.u0);
          return (
            <Canvas style={{ width: W, height: Math.round((box.v1 - box.v0) * k) }}>
              <Group transform={[{ scale: k }, { translateX: -box.u0 }, { translateY: -box.v0 }]}>
                <AccordionFront top={175} bottom={350} />
              </Group>
            </Canvas>
          );
        })()}
        <Head title="A11 — the approved front figure, same pose, its own arms (reference)" />
        {(() => {
          const W = width - 24;
          const box = { u0: -420, u1: 420, v0: -620, v1: -100 };
          const k = W / (box.u1 - box.u0);
          const fp = accFigure(175, 350, 'front').fp;
          return fp.front ? (
            <Canvas style={{ width: W, height: Math.round((box.v1 - box.v0) * k) }}>
              <Group transform={[{ scale: k }, { translateX: -box.u0 }, { translateY: -box.v0 }]}>
                <PersonFrontV2 pose={fp.front.pose} who={fp.in.who} />
              </Group>
            </Canvas>
          ) : null;
        })()}
        <Head title="A11 — the player alone, face-on (half open)" />
        {(() => {
          const W = width - 24;
          const box = { u0: -420, u1: 420, v0: -620, v1: -100 };
          const k = W / (box.u1 - box.u0);
          return (
            <Canvas style={{ width: W, height: Math.round((box.v1 - box.v0) * k) }}>
              <Group transform={[{ scale: k }, { translateX: -box.u0 }, { translateY: -box.v0 }]}>
                <AccordionPlayerV2 top={175} bottom={350} view="front" part="back" />
              </Group>
            </Canvas>
          );
        })()}
      </View>
    );
  if (only === 'harmonicaClose')
    return (
      <View>
        <Head title="A10 — the hands' chamber close-up: open, half, cupped" />
        <Row>
          {(['open', 'half', 'cupped'] as const).map((st) => (
            <HandChamber key={st} w={Math.min(width - 24, 760)} h={Math.round(Math.min(width - 24, 760) * 0.8)} state={st} accessibilityLabel={`harmonica ${st}`} />
          ))}
        </Row>
      </View>
    );
  if (only === 'plunger')
    return (
      <View>
        <Head title="A01 / A02 — the mute page, PLUNGER: the left hand round the cup (new)" />
        <Row>
          <MuteView w={Math.min(width - 24, 420)} h={300} P={valvedPose(TRUMPET)} mute="plunger" accessibilityLabel="plunger, trumpet" />
          <MuteView w={Math.min(width - 24, 420)} h={300} P={slidePose(TENOR)} mute="plunger" accessibilityLabel="plunger, trombone" />
        </Row>
      </View>
    );
  return (
    <View>
      <Head title="Families with their own figure — wave 5" note="Every joint, hand pose and contact is the lesson's own; only the drawing is new." />
      {cases.map((c) => (
        <CaseView key={c.id} c={c} width={width} dbg={dbg} />
      ))}
    </View>
  );
}
