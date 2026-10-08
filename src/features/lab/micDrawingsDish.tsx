/* lab6 group 2 (2026-10-08) — THE PARABOLIC DISH as a Miking mic drawing
 * (MikingMicArt 'dish'), on the Miking convention: the reference point is the
 * CAPSULE AT THE FOCUS (the front, at the origin), the dish's opening faces
 * the target along −y, its body (the bowl, the vertex, the handle) behind
 * along +y. The capsule faces back into the bowl (field_wildlife_distant/
 * SOURCES.md: SCH-DISH, INNERCORE), on a holder from the vertex; a pistol
 * grip under the handle. The bowl is drawn from its own equation z = r²/(4f)
 * (the focal length f = 0.36·D, the drawn dish's ratio). Seen from the side
 * or from above it is the same section (the dish is round).
 *
 * `r` = the dish's radius (D/2); `len` = focus to the handle's end; `fore` =
 * the capsule's body reaching ahead of the focus. Self-contained (no import
 * from micDrawings, so neither file depends on the other at load). Static. */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;

function buildDish(r: number, len: number, fore: number) {
  const f = 0.72 * r; // 0.36·D
  const shell = 0.011 * r * 2;
  const n = 36;
  // The bowl in the local frame: a radius ρ across (x), its height above the
  // vertex z = ρ²/(4f) measured back from the focus: y = f − z.
  const inner: SkPathT = Skia.Path.Make();
  const body: SkPathT = Skia.Path.Make();
  for (let k = 0; k <= n; k++) {
    const rho = -r + (2 * r * k) / n;
    const y = f - (rho * rho) / (4 * f);
    if (k === 0) {
      inner.moveTo(rho, y);
      body.moveTo(rho, y);
    } else {
      inner.lineTo(rho, y);
      body.lineTo(rho, y);
    }
  }
  for (let k = n; k >= 0; k--) {
    const rho = -r + (2 * r * k) / n;
    const y = f - (rho * rho) / (4 * f) + shell;
    body.lineTo(rho * (1 + shell / r), y);
  }
  body.close();
  // The holder: from the vertex (y = f) toward the focus, beside the capsule.
  const holder: SkPathT = Skia.Path.Make();
  holder.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.05, -fore * 0.6, r * 0.035, f + fore * 0.6), r * 0.015, r * 0.015));
  // The capsule: a small cylinder at the focus, its face (y = 0) toward the bowl… its body ahead (−y).
  const cap: SkPathT = Skia.Path.Make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.03, -fore, r * 0.06, fore), r * 0.012, r * 0.012));
  const grille: SkPathT = Skia.Path.Make();
  grille.addRect(Skia.XYWHRect(-r * 0.03, -r * 0.03, r * 0.06, r * 0.03));
  // The handle behind the vertex, and a pistol grip under it.
  const handle: SkPathT = Skia.Path.Make();
  handle.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.08, f + shell, r * 0.16, Math.max(r * 0.1, len - f - shell)), r * 0.04, r * 0.04));
  const grip: SkPathT = Skia.Path.Make();
  const gy = f + shell + (len - f) * 0.35;
  grip.moveTo(r * 0.08, gy);
  grip.lineTo(r * 0.5, gy + r * 0.06);
  grip.lineTo(r * 0.48, gy + r * 0.18);
  grip.lineTo(r * 0.08, gy + r * 0.14);
  grip.close();
  return { inner, body, holder, cap, grille, handle, grip, f };
}

export function ParabolicDishMic({ r, len, fore, tint }: { r: number; len: number; fore: number; tint?: string }) {
  const p = useMemo(() => buildDish(r, len, fore), [r, len, fore]);
  const hair = Math.max(0.6, r * 0.008);
  return (
    <Group>
      <Path path={p.grip}>
        <LinearGradient start={vec(0, p.f)} end={vec(r * 0.5, p.f)} colors={['#4d515b', '#1c1d22']} />
      </Path>
      <Path path={p.handle}>
        <LinearGradient start={vec(-r * 0.08, 0)} end={vec(r * 0.08, 0)} colors={['#7a7f89', '#3a3d44', '#1d1e22']} />
      </Path>
      <Path path={p.body}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, p.f)} colors={['#d2dce6', '#8c98a5', '#56606c']} />
      </Path>
      <Path path={p.inner} style="stroke" strokeWidth={hair * 2.4} color="#eef3f8" opacity={0.85} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.6} color="#0a0b0d" />
      <Path path={p.holder} color="#3a3d44" />
      <Path path={p.cap}>
        <LinearGradient start={vec(-r * 0.03, 0)} end={vec(r * 0.03, 0)} colors={['#e6e9ef', '#9aa0ab', '#2b2d34']} />
      </Path>
      <Path path={p.grille} color="#1e2025" />
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.2} />
    </Group>
  );
}
