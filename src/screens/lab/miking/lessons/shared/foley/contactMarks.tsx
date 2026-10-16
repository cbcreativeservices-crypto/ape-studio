/**
 * Foley MEET IT marks (art fix 2026-10-16 — the impacts were yellow
 * starbursts, unexplained marks on the floor and the basin):
 *
 *   ContactMark  the place a contact happens, as a flat amber ring lying on
 *                the surface (the contact patch, seen edge-on) — the page's
 *                circled number names it (① THE HEEL LANDS …).
 *   SplashCrown  the water's entry: the crown a pour throws up — a thin wall
 *                of water round the entry, its rim breaking into droplets.
 *   Droplet      one falling drop (a drip in the tail), its point up.
 * Drawn in the sound pictures' millimetres; static (D8).
 */
import { useMemo } from 'react';
import { Group, Path, Skia } from '@shopify/react-native-skia';
import { make } from '../concert/paths.ts';

const AMBER = '#ffc64d';
const WATER_LIGHT = '#d8eefb';
const WATER_LINE = '#5fa8d8';

/** `round`: a ring round a place in the air (a garment's fold rubbing), not
 *  lying on a surface. */
export function ContactMark({ c, w = 70, opacity = 1, round = false }: { c: readonly [number, number]; w?: number; opacity?: number; round?: boolean }) {
  const p = useMemo(() => {
    const ring = make();
    const hh = round ? w * 0.8 : w * 0.26;
    ring.addOval(Skia.XYWHRect(c[0] - w / 2, c[1] - hh / 2, w, hh));
    return ring;
  }, [c, w, round]);
  return (
    <Group opacity={opacity}>
      <Path path={p} color={AMBER} opacity={0.22} />
      <Path path={p} style="stroke" strokeWidth={4} color={AMBER} />
    </Group>
  );
}

/** The entry's crown, `k` 0…1 its growth (0 = nothing). The water's surface
 *  at y = c[1]; `rimY`: the container's rim — the crown shows above it only
 *  (the near wall hides its foot). */
export function SplashCrown({ c, k, rimY }: { c: readonly [number, number]; k: number; rimY?: number }) {
  const g = useMemo(() => {
    const wall = make();
    const drops = make();
    if (k <= 0) return { wall, drops };
    const half = 30 + k * 50;
    const hgt = 24 + k * 120;
    const [x, y] = c;
    // The crown's outline: out from the entry, up the flared wall to a rim of
    // points, and back down the far side; the inner sheet left open.
    const n = 6;
    wall.moveTo(x - half * 0.55, y);
    wall.cubicTo(x - half * 0.75, y - hgt * 0.3, x - half * 1.05, y - hgt * 0.7, x - half * 1.1, y - hgt);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = x - half * 1.1 + t * half * 2.2;
      const tipY = y - hgt - (i % 2 === 0 ? 14 * k : 0);
      wall.lineTo(px, tipY);
      if (i < n) wall.lineTo(px + (half * 2.2) / n / 2, y - hgt + 10 + 6 * k);
    }
    wall.cubicTo(x + half * 1.05, y - hgt * 0.7, x + half * 0.75, y - hgt * 0.3, x + half * 0.55, y);
    wall.close();
    for (let i = 0; i <= n; i += 2) {
      const px = x - half * 1.1 + (i / n) * half * 2.2;
      const r = 4 + 3 * k;
      drops.addCircle(px + (i - n / 2) * 2, y - hgt - 14 * k - 16 - r, r);
    }
    return { wall, drops };
  }, [c, k]);
  if (k <= 0) return null;
  return (
    <Group clip={rimY != null ? Skia.XYWHRect(c[0] - 400, rimY - 600, 800, 600) : undefined}>
      <Path path={g.wall} color={WATER_LIGHT} opacity={0.75} />
      <Path path={g.wall} style="stroke" strokeWidth={2.4} strokeJoin="round" color={WATER_LINE} />
      <Path path={g.drops} color={WATER_LIGHT} />
      <Path path={g.drops} style="stroke" strokeWidth={2} color={WATER_LINE} />
    </Group>
  );
}

/** One drop, its round end down at (x, y), radius r. */
export function Droplet({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  const p = useMemo(() => {
    const d = make();
    d.moveTo(x, y - r * 2.6);
    d.cubicTo(x + r * 0.5, y - r * 1.6, x + r, y - r * 0.9, x + r, y);
    d.cubicTo(x + r, y + r * 1.1, x - r, y + r * 1.1, x - r, y);
    d.cubicTo(x - r, y - r * 0.9, x - r * 0.5, y - r * 1.6, x, y - r * 2.6);
    d.close();
    return d;
  }, [x, y, r]);
  return (
    <Group>
      <Path path={p} color={WATER_LIGHT} opacity={0.9} />
      <Path path={p} style="stroke" strokeWidth={2} color={WATER_LINE} />
    </Group>
  );
}
