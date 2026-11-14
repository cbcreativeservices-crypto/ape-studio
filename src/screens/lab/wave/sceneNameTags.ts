/**
 * On-picture names for the Wave Physics room view (lab fix round 2026-11-14,
 * G1_WaveLab.md + G1b_WaveLab.md S3/S10: the speaker and the listener were
 * ~6 px marks with no labels; Module 12's REAR MIC / FRONT SUB / AUDIENCE ↓
 * labels are the model every module now follows). Pure, so it is testable.
 */
import type { WaveScene, WaveSource } from './waveEngine';

/** `sources[id]` renames one source (null hides its tag); `listener` renames
 *  the listener (null hides it); `false` = no tags at all. */
export type NameTags = { sources?: Record<string, string | null>; listener?: string | null } | false;

/** The default on-picture names for a scene (pure; RoomSceneView draws them).
 *  One or two sources of a kind: "SPEAKER" / "SPEAKER 1", "SPEAKER 2"; three or
 *  more (an array): one plural tag on the first box only. */
export function sceneNameTags(
  scene: Pick<WaveScene, 'sources'>,
  opts: {
    nameTags?: NameTags;
    listenerKind?: 'head' | 'mic';
    draggableListener?: boolean;
  },
): { sources: { id: string; text: string }[]; listener: string | null } {
  if (opts.nameTags === false) return { sources: [], listener: null };
  const over = opts.nameTags?.sources ?? {};
  const visible = scene.sources.filter((s) => !s.muted);
  const word = (k: WaveSource['kind']) => (k === 'sub' ? 'SUB' : 'SPEAKER');
  const plural = (k: WaveSource['kind']) => (k === 'sub' ? 'SUBS' : 'SPEAKERS');
  const sources: { id: string; text: string }[] = [];
  for (const s of visible) {
    if (Object.prototype.hasOwnProperty.call(over, s.id)) {
      const t = over[s.id];
      if (t) sources.push({ id: s.id, text: t });
      continue;
    }
    const same = visible.filter((o) => word(o.kind) === word(s.kind));
    const idx = same.indexOf(s);
    if (same.length <= 1) sources.push({ id: s.id, text: word(s.kind) });
    else if (same.length === 2) sources.push({ id: s.id, text: `${word(s.kind)} ${idx + 1}` });
    else if (idx === 0) sources.push({ id: s.id, text: plural(s.kind) });
  }
  const listenerDefault = opts.listenerKind === 'mic' ? 'MIC' : opts.draggableListener ? 'YOU (drag)' : 'YOU';
  const listener =
    opts.nameTags && Object.prototype.hasOwnProperty.call(opts.nameTags, 'listener') ? (opts.nameTags.listener ?? null) : listenerDefault;
  return { sources, listener };
}

