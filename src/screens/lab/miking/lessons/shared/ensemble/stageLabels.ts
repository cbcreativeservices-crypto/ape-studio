/**
 * The seating's HIT TEST and LABELS in each view (pure; no React Native — the
 * label ratchet and the tests reach them). Labels are said as the conductor
 * faces the ensemble and sit in free space beside their section, a thin
 * leader back to it (labelLayout.fitLabels places them; `clearOf` here keeps
 * them off the players).
 */
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { uv, type StageView } from './frameS.ts';
import { BASS_DRUM_STATION, headTop, KIND, sectionCentre, seatsOf, TIMPANI_ARC, TIMPANI_HEAD_H, TIMPANI_SET, type Gear, type Seat, type Seating } from './seating.ts';
import { GEAR_SIZE, PA_BOX } from './bandStage.ts';

/** group 5: the half-width of a wide section instrument in an elevation (mm). */
const WIDE_G5: Partial<Record<string, number>> = { marimba: 1100, vibraphone: 800, drumkit: 900, congas: 400, perctable: 650, guitar: 750 };

/** A player's footprint in a view (mm): a disc in plan, a box in elevation. */
function seatBox(q: Seat, view: StageView): { u0: number; u1: number; v0: number; v1: number } {
  const o = uv(view, q.p);
  if (view === 'plan') return { u0: o.u - 360, u1: o.u + 360, v0: o.v - 360, v1: o.v + 360 };
  // The drum kit (groups 4 and 5) is WIDE_G5's 900; group 4's keyboard 650.
  const wide = q.kind === 'piano' ? 1200 : q.kind === 'timpani' ? 900 : q.kind === 'keys' ? 650 : q.kind === 'harp' ? 450 : (WIDE_G5[q.kind] ?? 300);
  return { u0: o.u - wide, u1: o.u + wide, v0: -headTop(q), v1: o.v };
}

/** Group 4: a piece of gear's footprint in a view (a box round its centre). */
function gearBox(g: Gear, view: StageView): { u0: number; u1: number; v0: number; v1: number } {
  const S = GEAR_SIZE[g.kind];
  const o = uv(view, g.p);
  const r = Math.max(S.w, S.d) / 2;
  if (view === 'plan') return { u0: o.u - r, u1: o.u + r, v0: o.v - r, v1: o.v + r };
  return { u0: o.u - r, u1: o.u + r, v0: o.v - (g.kind === 'pa' ? PA_BOX.bottom + PA_BOX.h : S.h), v1: o.v };
}

/** What is under (u, v) in a view: a section id, 'cond' (the podium and the
 *  conductor), or null. `slice`: the section view's half-width (players
 *  beyond it are not drawn there). */
export function stageHit(s: Seating, view: StageView, u: number, v: number, tol: number, slice = Infinity): string | null {
  let best: { id: string; d: number } | null = null;
  const all = [...s.seats, ...(s.conductor ? [s.conductor] : [])];
  for (const q of all) {
    if (view === 'section' && Math.abs(q.p.x) > slice && q.kind !== 'conductor') continue;
    const b = seatBox(q, view);
    if (view === 'plan') {
      const o = uv(view, q.p);
      const r = q.kind === 'piano' ? 0 : 360;
      const d = Math.hypot(u - o.u, v - o.v);
      if (d <= r + tol && (!best || d < best.d)) best = { id: q.kind === 'conductor' ? 'cond' : q.section, d };
      if (KIND[q.kind].reach > 800 && q.kind !== 'trombone') {
        // A big instrument in front of its player (the piano, the timpani).
        const f = { x: Math.sin((q.face * Math.PI) / 180), z: -Math.cos((q.face * Math.PI) / 180) };
        for (let t = 0.2; t <= 1; t += 0.2) {
          const c = { u: q.p.x + f.x * KIND[q.kind].reach * t, v: q.p.z + f.z * KIND[q.kind].reach * t };
          const dd = Math.hypot(u - c.u, v - c.v);
          if (dd <= 600 + tol && (!best || dd < best.d)) best = { id: q.section, d: dd };
        }
      }
    } else if (u >= b.u0 - tol && u <= b.u1 + tol && v >= b.v0 - tol && v <= b.v1 + tol) {
      const d = Math.abs(u - (b.u0 + b.u1) / 2);
      if (!best || d < best.d) best = { id: q.kind === 'conductor' ? 'cond' : q.section, d };
    }
  }
  if (best) return best.id;
  // Group 4: a tap on a player's amp, DI or wedge names that player's section.
  for (const g of s.gear ?? []) {
    if (!g.section || (view === 'section' && Math.abs(g.p.x) > slice)) continue;
    const b = gearBox(g, view);
    if (u >= b.u0 - tol && u <= b.u1 + tol && v >= b.v0 - tol && v <= b.v1 + tol) return g.section;
  }
  if (s.podium) {
    const P = s.podium;
    const a = uv(view, { x: P.c.x - P.w / 2, y: -P.h, z: P.c.z - P.d / 2 });
    const b = uv(view, { x: P.c.x + P.w / 2, y: 0, z: P.c.z + P.d / 2 });
    if (u >= Math.min(a.u, b.u) - tol && u <= Math.max(a.u, b.u) + tol && v >= Math.min(a.v, b.v) - tol && v <= Math.max(a.v, b.v) + tol) return 'cond';
  }
  return null;
}

/** A seat's local (right, ahead) point in frame S (x, z). */
function localXZ(q: Seat, right: number, ahead: number): { x: number; z: number } {
  const F = (q.face * Math.PI) / 180;
  return { x: q.p.x + right * Math.cos(F) + ahead * Math.sin(F), z: q.p.z + right * Math.sin(F) - ahead * Math.cos(F) };
}

/** How near the viewer a frame-S point is in an elevation (larger = nearer). */
const nearness = (view: StageView, p: { x: number; z: number }) => (view === 'front' ? p.z : p.x);

/**
 * Where the TIMPANI label points in an elevation (round 2, 2026-10-10): at a
 * timpano bowl the viewer can SEE — a point on a bowl just under its head,
 * not hidden behind a nearer concert bass drum (E14's side view had the
 * TIMPANI leader landing on the bass drum). Null when no bowl shows.
 */
function timpaniAnchor(s: Seating, view: StageView, q: Seat, slice: number): { u: number; v: number } | null {
  const R = BASS_DRUM_STATION.R;
  const qn = nearness(view, q.p);
  // The bass drums in front of this player: their silhouettes in the view.
  const occ = s.seats
    .filter((o) => o.kind === 'percussion' && !/\.2$/.test(o.id) && (view !== 'section' || Math.abs(o.p.x) <= slice))
    .map((o) => {
      const c = localXZ(o, 0, BASS_DRUM_STATION.ahead);
      const F = (o.face * Math.PI) / 180;
      const a = Math.abs(view === 'front' ? Math.cos(F) : -Math.sin(F));
      const half = R * Math.sqrt(Math.max(0, 1 - a * a)) + (BASS_DRUM_STATION.depth / 2) * a + 40;
      const o2 = uv(view, { x: c.x, y: o.p.y - BASS_DRUM_STATION.up, z: c.z });
      return { near: nearness(view, c), u0: o2.u - half, u1: o2.u + half, v0: o2.v - R - 40, v1: o2.v + R + 40 };
    })
    .filter((o) => o.near > qn);
  const bowls = TIMPANI_SET.map((b) => {
    const a = (b.a * Math.PI) / 180;
    const c = localXZ(q, Math.sin(a) * TIMPANI_ARC, Math.cos(a) * TIMPANI_ARC);
    return { c, r: b.d / 2 };
  }).sort((m, n) => nearness(view, n.c) - nearness(view, m.c));
  for (const b of bowls) {
    const o = uv(view, { x: b.c.x, y: q.p.y - (TIMPANI_HEAD_H - 90), z: b.c.z });
    for (const du of [0, 0.6, -0.6, 0.85, -0.85]) {
      const u = o.u + du * b.r;
      if (!occ.some((k) => u >= k.u0 && u <= k.u1 && o.v >= k.v0 && o.v <= k.v1)) return { u, v: o.v };
    }
  }
  return null;
}

/** The section labels in a view, each beside its section with a leader to
 *  its centre (fitLabels moves a label that has no room, or drops it). */
export function stageLabels(s: Seating, view: StageView, slice = Infinity): ArtLabel[] {
  const out: ArtLabel[] = [];
  const players = s.seats;
  const cx = players.reduce((a, q) => a + q.p.x, 0) / Math.max(1, players.length);
  for (const sec of s.sections) {
    const seats = seatsOf(s, sec.id).filter((q) => view !== 'section' || Math.abs(q.p.x) <= slice);
    if (!seats.length) continue;
    // Group 4: a player whose sound leaves elsewhere (an amp) is named at the
    // player, chest high; the amp has its own label.
    const away = seats.some((q) => q.kind === 'eguitar' || q.kind === 'ebass');
    const c = away ? { x: seats.reduce((a, q) => a + q.p.x, 0) / seats.length, y: seats[0].p.y - 1150, z: seats.reduce((a, q) => a + q.p.z, 0) / seats.length } : sectionCentre(s, sec.id);
    const timp = view !== 'plan' && seats[0].kind === 'timpani' ? timpaniAnchor(s, view, seats[0], slice) : null;
    const at = timp ?? uv(view, view === 'plan' ? { x: c.x, y: 0, z: c.z } : c);
    const us = seats.map((q) => uv(view, q.p).u);
    const vs = seats.map((q) => uv(view, q.p).v);
    const u0 = Math.min(...us) - 420;
    const u1 = Math.max(...us) + 420;
    let v0 = Math.min(...vs);
    let v1 = Math.max(...vs);
    if (view === 'plan') {
      v0 -= 420;
      v1 += 420;
    } else {
      v0 = Math.min(...seats.map((q) => uv(view, q.p).v - headTop(q))) - 60;
    }
    const left = view === 'plan' ? c.x < cx - 300 : at.u < 0;
    const alts: ArtLabel['alts'] =
      view === 'plan'
        ? [
            { u: (u0 + u1) / 2, v: v0 - 140, align: 'center' },
            { u: left ? u0 - 80 : u1 + 80, v: at.v, align: left ? 'right' : 'left' },
            { u: (u0 + u1) / 2, v: v1 + 200, align: 'center' },
            { u: left ? u1 + 80 : u0 - 80, v: at.v, align: left ? 'left' : 'right' },
          ]
        : // Elevations (round 2): straight up or straight down from the
          // section's point first — vertical leaders cannot cross one another —
          // in tiers above the heads and below the floor, then beside it.
          [
            ...[260, 700, 1140, 1580, 2020, 2460, 2900].map((d) => ({ u: at.u, v: v0 - d, align: 'center' as const })),
            ...[520, 960, 1400, 1840, 2280].map((d) => ({ u: at.u, v: v1 + d, align: 'center' as const })),
            // …then a little to either side (short slanted leaders).
            ...[700, 1140, 1580, 2020, 2460].flatMap((d) => [-900, 900, -1800, 1800].map((du) => ({ u: at.u + du, v: v0 - d, align: 'center' as const }))),
            ...[520, 960, 1400, 1840].flatMap((d) => [-900, 900, -1800, 1800].map((du) => ({ u: at.u + du, v: v1 + d, align: 'center' as const }))),
            { u: (u0 + u1) / 2, v: v0 - 260, align: 'center' as const },
            { u: (u0 + u1) / 2, v: v0 - 700, align: 'center' as const },
          ];
    const first = alts[0];
    // The cropped form keeps the noun: "1ST VIOLINS" → "VN 1", never a bare "1ST".
    const w0 = sec.short.split(' ')[0];
    const short = /^\d/.test(w0) ? `VN ${w0[0]}` : w0;
    // Round 2: in an elevation the back row's percussion (the most crowded
    // corner, under the detail inset) is placed first, so it gets a clean
    // straight leader; the others fit round it.
    const priority = view !== 'plan' && (sec.family === 'percussion' || seats[0].kind === 'timpani') ? 1 : undefined;
    out.push({ id: sec.id, text: sec.short, short, u: first.u, v: first.v, align: first.align, alts: alts.slice(1), at, tone: undefined, ...(priority ? { priority } : {}) });
  }
  // Group 4: the amps, the PA and a gobo, named from above (muted: they are
  // not players).
  if (view === 'plan') {
    for (const g of (s.gear ?? []).filter((q) => q.kind === 'combo' || q.kind === 'bassRig' || q.kind === 'pa' || q.kind === 'gobo')) {
      const o = uv('plan', g.p);
      const r = Math.max(GEAR_SIZE[g.kind].w, GEAR_SIZE[g.kind].d) / 2;
      out.push({ id: `gear.${g.id}`, text: g.short, short: g.short.replace('GUITAR', 'GTR'), u: o.u, v: o.v - r - 160, align: 'center', tone: 'muted', at: o, alts: [{ u: o.u, v: o.v + r + 200, align: 'center' }, { u: o.u - r - 80, v: o.v, align: 'right' }, { u: o.u + r + 80, v: o.v, align: 'left' }] });
    }
  }
  // The conductor (and the podium).
  if (s.conductor && s.podium) {
    const o = uv(view, s.podium.c);
    // (Round 2: tiers straight above the conductor, so the label never lands on a mic stand.)
    const condAlts: ArtLabel['alts'] = view === 'plan' ? undefined : [2540, 2980, 3420, 3860].map((d) => ({ u: o.u, v: o.v - d, align: 'center' as const }));
    out.push({ id: 'cond', text: 'CONDUCTOR', short: 'COND.', u: o.u, v: view === 'plan' ? o.v + 700 : o.v - 2100, align: 'center', tone: 'muted', at: view === 'plan' ? { u: o.u, v: o.v } : { u: o.u, v: o.v - 1500 }, ...(condAlts ? { alts: condAlts } : {}) });
  }
  return out;
}

/** Free space for labels in a view: clear of every player (pure). */
export function stageClearOf(s: Seating, view: StageView, slice = Infinity) {
  return (u0: number, v0: number, u1: number, v1: number): boolean => {
    for (let i = 0; i <= 8; i++)
      for (let j = 0; j <= 3; j++) {
        const u = u0 + ((u1 - u0) * i) / 8;
        const v = v0 + ((v1 - v0) * j) / 3;
        if (stageHit(s, view, u, v, 0, slice) != null) return false;
      }
    return true;
  };
}
