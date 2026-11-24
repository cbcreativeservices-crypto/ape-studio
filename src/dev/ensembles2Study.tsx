/**
 * FIGURE STUDY — "ENSEMBLES 2" (wave 6 of D78, 2026-11-24): the figures the
 * ensemble lessons still needed — the standing person from BEHIND, the
 * conductor with his baton, the chorister with a folder, the keys and
 * percussion seats — and the seatings switched on with them.
 * DEV + WEB ONLY: `#labpreview/FigureStudy/ensembles2` (all), or one part:
 * `ensembles2-back`, `ensembles2-cond`, `ensembles2-choir`, `ensembles2-seats`.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PersonBackV2 } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Back';
import { BACK_STANDING } from '../screens/lab/miking/lessons/shared/figureV2/backPlan';
import { PersonFrontV2 } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Front';
import { FRONT_STANDING } from '../screens/lab/miking/lessons/shared/figureV2/frontPlan';
import { castFor } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { ConductorV2, conductorPlan } from '../screens/lab/miking/lessons/shared/figureV2/conductorV2';
import { ChoristerV2, choristerPlan } from '../screens/lab/miking/lessons/shared/figureV2/choristerV2';
import { SeatingView } from '../screens/lab/miking/lessons/shared/ensemble/SeatingArt';
import { seatingOf, type SeatingId } from '../screens/lab/miking/lessons/shared/ensemble/seating';
import { windPlanFor } from '../screens/lab/miking/lessons/shared/woodwinds/WindPlan';
import { A06_PLAN } from '../screens/lab/miking/lessons/a06Flute/plan';

const A06Plan = windPlanFor(A06_PLAN);

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';
const ALL: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];

/** One picture: a window (mm) round (cu, cv), `w` pt wide. */
function Pic({ title, cu, cv, mmW, mmH, w, children }: { title: string; cu: number; cv: number; mmW: number; mmH: number; w: number; children: ReactNode }) {
  const s = w / mmW;
  const h = mmH * s;
  return (
    <View style={{ marginRight: 10, marginBottom: 10 }}>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 3, maxWidth: w }}>{title}</Text>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: h / 2 - cv * s }, { scale: s }]}>
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

const FLOOR = FRONT_STANDING.floor ?? 0;
const TOP = FRONT_STANDING.head.c.v - 160;
const MID = (FLOOR + TOP) / 2;
const TALL = FLOOR - TOP + 60;

/** Set 1: the standing person from behind — the five, at the lesson's size and enlarged; the front beside for comparison. */
function BackSet({ width, sub = '' }: { width: number; sub?: string }) {
  const big = Math.min(width - 24, 300);
  const on = (k: string) => !sub || sub === k;
  return (
    <View>
      {on('small') ? <>
      <Head title="FROM BEHIND — THE FIVE AT THE LESSON'S SIZE" note="Standing, the hands hanging. About 0.15 pt/mm (an ensemble's front elevation enlarged to the glass). From the front first, then from behind." />
      <Row>
        {ALL.map((id) => (
          <Pic key={`f${id}`} title={`${CAST[id].name} · front`} cu={0} cv={MID} mmW={560} mmH={TALL} w={84}>
            <PersonFrontV2 pose={FRONT_STANDING} who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      <Row>
        {ALL.map((id) => (
          <Pic key={`b${id}`} title={`${CAST[id].name} · back`} cu={0} cv={MID} mmW={560} mmH={TALL} w={84}>
            <PersonBackV2 pose={BACK_STANDING} who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      </> : null}
      {on('big') ? <>
      <Head title="FROM BEHIND — ENLARGED ABOUT 3× (full detail)" note="The back of the head and the hair per person, the collar's back, the shoulder seams, the shirt's back, the belt's loops, the trousers' seat, the heels; each hand from behind (its little-finger edge)." />
      <Row>
        {ALL.map((id) => (
          <Pic key={`B${id}`} title={CAST[id].name} cu={0} cv={MID} mmW={600} mmH={TALL} w={big}>
            <PersonBackV2 pose={BACK_STANDING} who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      </> : null}
      {on('jacket') ? <>
      <Head title="IN THE JACKET, FROM BEHIND" note="The jacket's back: its collar round the neck with the shirt collar a strip above, the side seams, the center seam ending in a center vent." />
      <Row>
        {ALL.filter((id) => id !== 'drummer').map((id) => (
          <Pic key={`J${id}`} title={CAST[id].name} cu={0} cv={MID} mmW={600} mmH={TALL} w={big}>
            <PersonBackV2 pose={BACK_STANDING} who={CAST[id]} opts={{ jacket: true }} />
          </Pic>
        ))}
      </Row>
      </> : null}
      {on('close') ? <>
      <Head title="CLOSE — HEADS AND HANDS FROM BEHIND" />
      <Row>
        {ALL.map((id) => (
          <Pic key={`H${id}`} title={`${CAST[id].name} · head`} cu={0} cv={FRONT_STANDING.head.c.v + 40} mmW={300} mmH={360} w={big}>
            <PersonBackV2 pose={BACK_STANDING} who={CAST[id]} />
          </Pic>
        ))}
        {(['ana', 'kofi'] as CastId[]).map((id) => (
          <Pic key={`Hd${id}`} title={`${CAST[id].name} · right hand`} cu={BACK_STANDING.handR.wrist.u + 30} cv={BACK_STANDING.handR.wrist.v + 50} mmW={200} mmH={240} w={big}>
            <PersonBackV2 pose={BACK_STANDING} who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      </> : null}
    </View>
  );
}

/** Set 2: the conductor with a baton — from behind, in profile, from above; at the lesson's size and enlarged. */
function CondSet({ width, sub = '' }: { width: number; sub?: string }) {
  const who = castFor('ensemble.conductor');
  const big = Math.min(width - 24, 420);
  const on = (k: string) => !sub || sub === k;
  const g = conductorPlan('back', who).arms.R.grip;
  const gs = conductorPlan('side', who).arms.R.grip;
  const hand = g ? g.wrist : { u: 0, v: 0 };
  const handS = gs ? gs.wrist : { u: 0, v: 0 };
  return (
    <View>
      {on('small') ? (
        <>
          <Head title="THE CONDUCTOR — AT THE LESSON'S SIZE" note="From behind (the front elevation, seen from the hall), in profile (the section, from his right), from above (the plan). About 0.15 pt/mm; from above about 0.1." />
          <Row>
            <Pic title="from behind" cu={0} cv={-900} mmW={900} mmH={TALL} w={130}>
              <ConductorV2 who={who} view="back" />
            </Pic>
            <Pic title="in profile" cu={150} cv={-900} mmW={900} mmH={TALL} w={130}>
              <ConductorV2 who={who} view="side" />
            </Pic>
            <Pic title="from above" cu={0} cv={-150} mmW={1000} mmH={1000} w={100}>
              <ConductorV2 who={who} view="top" />
            </Pic>
          </Row>
        </>
      ) : null}
      {on('big') ? (
        <>
          <Head title="THE CONDUCTOR — ENLARGED (full detail)" note="The beat position: the elbows out from the body, the forearms rising to the hands before the chest; the baton held between the thumb's pad and the side of the index's first joint, the bulb in the palm, the other fingers curled loosely round it; the left hand open, its palm toward the players." />
          <Row>
            <Pic title="from behind" cu={0} cv={-1050} mmW={1000} mmH={1300} w={big}>
              <ConductorV2 who={who} view="back" />
            </Pic>
            <Pic title="in profile" cu={200} cv={-1050} mmW={1000} mmH={1300} w={big}>
              <ConductorV2 who={who} view="side" />
            </Pic>
            <Pic title="from above" cu={0} cv={-180} mmW={1000} mmH={900} w={big}>
              <ConductorV2 who={who} view="top" />
            </Pic>
          </Row>
        </>
      ) : null}
      {sub === 'shoulders' ? (
        <>
          <Head title="(Ensembles3) THE SHOULDERS AND ARMS FROM BEHIND, about 3×; the profile's legs" />
          <Row>
            <Pic title="from behind, the shoulders" cu={0} cv={-1300} mmW={760} mmH={560} w={Math.min(width - 24, 760)}>
              <ConductorV2 who={who} view="back" />
            </Pic>
            <Pic title="in profile, the arms" cu={250} cv={-1300} mmW={760} mmH={560} w={Math.min(width - 24, 760)}>
              <ConductorV2 who={who} view="side" />
            </Pic>
            <Pic title="in profile, the legs" cu={0} cv={-500} mmW={900} mmH={1100} w={Math.min(width - 24, 420)}>
              <ConductorV2 who={who} view="side" />
            </Pic>
          </Row>
        </>
      ) : null}
      {on('hands') ? (
        <>
          <Head title="THE BATON HAND — CLOSE" note="From behind and from his right, about 6× the lesson's size." />
          <Row>
            <Pic title="baton hand, from behind" cu={hand.u + 20} cv={hand.v - 40} mmW={260} mmH={260} w={big}>
              <ConductorV2 who={who} view="back" />
            </Pic>
            <Pic title="baton hand, from his right" cu={handS.u + 40} cv={handS.v - 30} mmW={260} mmH={260} w={big}>
              <ConductorV2 who={who} view="side" />
            </Pic>
          </Row>
        </>
      ) : null}
    </View>
  );
}

/** A seating in one view, fitted (or a window round a point), v2 off or on. */
function SeatPic({ id, v2, w, view, zoom }: { id: SeatingId; v2: boolean; w: number; view: 'plan' | 'front' | 'section'; zoom?: { cu: number; cv: number; mm: number } }) {
  const st = seatingOf(id).stage;
  const elev = view !== 'plan';
  const mmW = zoom ? zoom.mm : view === 'section' ? st.z1 - st.z0 + 800 : st.x1 - st.x0 + 800;
  const mmH = zoom ? zoom.mm * 0.75 : elev ? 2800 : st.z1 - st.z0 + 800;
  const cu = zoom ? zoom.cu : view === 'section' ? -(st.z0 + st.z1) / 2 : (st.x0 + st.x1) / 2;
  const cv = zoom ? zoom.cv : elev ? -1100 : (st.z0 + st.z1) / 2;
  return (
    <Pic title={`${id} · ${view} · ${v2 ? 'NEW' : 'OLD'}${zoom ? ' (close)' : ''}`} cu={cu} cv={cv} mmW={mmW} mmH={mmH} w={w}>
      <SeatingView seating={seatingOf(id)} view={view} v2={v2} />
    </Pic>
  );
}

/** The seatings, OLD beside NEW, in each view: `seats-<id>` (the dots in the id kept), `-close` the conductor's podium. */
function SeatsSet({ width, sub }: { width: number; sub: string }) {
  const only = (['plan', 'front', 'section'] as const).find((v) => sub.endsWith(`-${v}`));
  const sub1 = only ? sub.slice(0, -(only.length + 1)) : sub;
  // (`-z<u>_<v>_<mm>`: a window of that width round (u, v) in every view asked)
  const zm = /-z(-?\d+)_(-?\d+)_(\d+)$/.exec(sub1);
  const zoom = zm ? { cu: +zm[1], cv: +zm[2], mm: +zm[3] } : undefined;
  const sub2 = zm ? sub1.slice(0, zm.index) : sub1;
  const close = sub2.endsWith('-close');
  const id = (close ? sub2.slice(0, -6) : sub2) as SeatingId;
  const w = Math.min(width - 24, 760);
  const s = seatingOf(id);
  const c = s.conductor;
  return (
    <View>
      <Head title={`THE SEATING ${id} — OLD AND NEW`} note="Plan (from above), front (from the hall), section (from the conductor's right)." />
      {(only ? [only] : (['plan', 'front', 'section'] as const)).map((view) =>
        close && c ? (
          <Row key={view}>
            <SeatPic id={id} v2={false} w={Math.min(w, 380)} view={view} zoom={{ cu: view === 'section' ? -c.p.z : c.p.x, cv: view === 'plan' ? c.p.z - 200 : -1100, mm: 3200 }} />
            <SeatPic id={id} v2 w={Math.min(w, 380)} view={view} zoom={{ cu: view === 'section' ? -c.p.z : c.p.x, cv: view === 'plan' ? c.p.z - 200 : -1100, mm: 3200 }} />
          </Row>
        ) : (
          <Row key={view}>
            <SeatPic id={id} v2={false} w={zoom ? Math.min(w, 380) : w} view={view} zoom={zoom} />
            <SeatPic id={id} v2 w={zoom ? Math.min(w, 380) : w} view={view} zoom={zoom} />
          </Row>
        ),
      )}
    </View>
  );
}

/** The woodwind section plan (A06's) with the conductor on the podium — the old marker was a gray disc. */
function WindPlanSet({ width }: { width: number }) {
  const w = Math.min(width - 24, 420);
  return (
    <View>
      <Head title="THE WOODWIND SECTION PLAN — THE CONDUCTOR ON THE PODIUM" note="A06's setting plan (stage and studio), as a 390 pt phone shows it, then the podium enlarged." />
      <Row>
        {(['stage', 'studio'] as const).map((scene) => (
          <View key={scene} style={{ marginRight: 10, marginBottom: 10 }}>
            <Text style={{ color: DIM, fontSize: 11 }}>{scene}</Text>
            <A06Plan w={w} h={w * 0.8} scene={scene} variant={'metal' as never} items={[]} wedges={[]} highlight={null} onTap={() => {}} accessibilityLabel="wind plan" />
          </View>
        ))}
        <View style={{ marginRight: 10, marginBottom: 10 }}>
          <Text style={{ color: DIM, fontSize: 11 }}>stage · 3× (the podium)</Text>
          <View style={{ width: w, height: w * 0.8, overflow: 'hidden' }}>
            <View style={{ transform: [{ scale: 3 }], transformOrigin: '50% 92%' } as never}>
              <A06Plan w={w} h={w * 0.8} scene="stage" variant={'metal' as never} items={[]} wedges={[]} highlight={null} onTap={() => {}} accessibilityLabel="wind plan" />
            </View>
          </View>
        </View>
      </Row>
    </View>
  );
}

/** Set 3: the chorister holding the open folder — from the front, in profile, from above; the five people. */
function ChoirSet({ width, sub = '' }: { width: number; sub?: string }) {
  const big = Math.min(width - 24, 360);
  const on = (k: string) => !sub || sub === k;
  const g = choristerPlan('front').arms.R.grip.wrist;
  const gs = choristerPlan('side', -1).arms.L.grip.wrist;
  return (
    <View>
      {on('small') ? (
        <>
          <Head title="THE CHORISTER — AT THE LESSON'S SIZE" note="From the hall, in profile (the choir faces the hall: from the conductor's right he looks left), from above. About 0.15 pt/mm; from above about 0.1." />
          {(['front', 'side', 'top'] as const).map((view) => (
            <Row key={view}>
              {ALL.map((id) => (
                <Pic key={id} title={`${CAST[id].name} · ${view}`} cu={view === 'side' ? -60 : 0} cv={view === 'top' ? -150 : 500} mmW={view === 'top' ? 800 : 620} mmH={view === 'top' ? 800 : 1950} w={view === 'top' ? 80 : 90}>
                  <ChoristerV2 who={CAST[id]} view={view} facing={-1} />
                </Pic>
              ))}
            </Row>
          ))}
        </>
      ) : null}
      {on('big') ? (
        <>
          <Head title="THE CHORISTER — ENLARGED (full detail)" note="Both hands under the folder's lower edge, the fingers round onto the cover, the thumbs on the pages; the folder open at chest height, its top tipped forward; the head up toward the conductor." />
          <Row>
            {(['ana', 'kofi'] as const).map((id) => (
              <Pic key={`f${id}`} title={`${CAST[id].name} · front`} cu={0} cv={150} mmW={700} mmH={900} w={big}>
                <ChoristerV2 who={CAST[id]} view="front" />
              </Pic>
            ))}
            {(['ruth', 'mei'] as const).map((id) => (
              <Pic key={`s${id}`} title={`${CAST[id].name} · profile`} cu={-150} cv={150} mmW={700} mmH={900} w={big}>
                <ChoristerV2 who={CAST[id]} view="side" facing={-1} />
              </Pic>
            ))}
            <Pic title="the drummer · from above" cu={0} cv={-160} mmW={700} mmH={700} w={big}>
              <ChoristerV2 who={CAST.drummer} view="top" />
            </Pic>
          </Row>
        </>
      ) : null}
      {on('hands') ? (
        <>
          <Head title="THE FOLDER HANDS — CLOSE" note="About 6× the lesson's size." />
          <Row>
            <Pic title="right hand · from the hall" cu={g.u + 10} cv={g.v - 10} mmW={240} mmH={240} w={big}>
              <ChoristerV2 who={CAST.ana} view="front" />
            </Pic>
            <Pic title="near hand · profile" cu={gs.u - 20} cv={gs.v - 10} mmW={240} mmH={240} w={big}>
              <ChoristerV2 who={CAST.ruth} view="side" facing={-1} />
            </Pic>
            <Pic title="hands · from above" cu={0} cv={-240} mmW={420} mmH={420} w={big}>
              <ChoristerV2 who={CAST.mei} view="top" />
            </Pic>
          </Row>
        </>
      ) : null}
    </View>
  );
}

export function Ensembles2Study({ width, part = '' }: { width: number; part?: string }) {
  const show = (k: string) => !part || part === k;
  return (
    <View>
      <Text style={{ color: INK, fontSize: 16, fontWeight: '700' }}>Ensembles 2 — the figures the ensemble lessons still needed</Text>
      {show('cond') || part.startsWith('cond-') ? <CondSet width={width} sub={part.startsWith('cond-') ? part.slice(5) : ''} /> : null}
      {show('choir') || part.startsWith('choir-') ? <ChoirSet width={width} sub={part.startsWith('choir-') ? part.slice(6) : ''} /> : null}
      {show('wind') ? <WindPlanSet width={width} /> : null}
      {part.startsWith('seats-') ? <SeatsSet width={width} sub={part.slice(6)} /> : null}
      {show('back') || part.startsWith('back-') ? <BackSet width={width} sub={part.startsWith('back-') ? part.slice(5) : ''} /> : null}
    </View>
  );
}
