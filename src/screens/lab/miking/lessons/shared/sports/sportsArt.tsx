/**
 * The engine's LessonArt for a sports lesson whose pages are its own (Lab 7
 * part 2): the venue plan as the engine's "instrument" (top view: the plan;
 * side view: the ground and the marks along the line), its labels and a hit
 * test on its targets and marks. The engine draws this scene only where a
 * lesson keeps an engine page that shows the scene. Built once by group 2
 * (lab7-g5). Static.
 */
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { SourcePageId, VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { VenuePlan } from './VenueArt';
import { planUV, type VenueScene } from './venuePlan.ts';

/** `partOf`: the lesson's part id for a target or mark id (A → 'pf.A'). */
export function venueLessonArt(scene: VenueScene, partOf: (id: string) => string, pages: LessonArt['pages'], stepCounts: Partial<Record<SourcePageId, number>>): LessonArt {
  function Instrument({ view }: { view: ViewId; variant: VariantId }) {
    if (view === 'top') return <VenuePlan scene={scene} px={60} />;
    const ground = Skia.Path.Make();
    ground.addRect(Skia.XYWHRect(scene.frame.x0 * 1000 - 5000, 0, (scene.frame.x1 - scene.frame.x0) * 1000 + 10000, 300));
    const posts = Skia.Path.Make();
    for (const t of scene.targets) {
      posts.moveTo(t.p.x * 1000, 0);
      posts.lineTo(t.p.x * 1000, -t.h * 1000);
    }
    return (
      <Group>
        <Path path={ground} color="#2f4a28" />
        <Path path={posts} style="stroke" strokeWidth={40} color="#ffc64d" opacity={0.6} />
      </Group>
    );
  }
  const labels = (view: ViewId): ArtLabel[] => [
    ...scene.targets.map((t) => ({ id: partOf(t.id), text: t.short, u: planUV(t.p).u, v: view === 'top' ? planUV(t.p).v - 900 : -t.h * 1000 - 400, align: 'center' as const })),
    ...scene.marks.map((m) => ({ id: partOf(m.id), text: m.short, u: planUV(m.p).u, v: view === 'top' ? planUV(m.p).v + 900 : -300, align: 'center' as const, tone: 'muted' as const })),
  ];
  const hitTest = (view: ViewId, _v: VariantId, u: number, v: number, tol: number): string | null => {
    for (const t of scene.targets) {
      const o = view === 'top' ? planUV(t.p) : { u: t.p.x * 1000, v: -t.h * 1000 };
      if (Math.hypot(u - o.u, v - o.v) <= 700 + tol) return partOf(t.id);
    }
    for (const m of scene.marks) {
      const o = view === 'top' ? planUV(m.p) : { u: m.p.x * 1000, v: 0 };
      if (Math.hypot(u - o.u, v - o.v) <= 700 + tol) return partOf(m.id);
    }
    return null;
  };
  return { Instrument, labels, hitTest, pages, stepCounts };
}
