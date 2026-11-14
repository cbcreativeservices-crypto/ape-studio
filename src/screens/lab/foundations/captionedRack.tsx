/**
 * A lab's Rack Unit with the lab fix round (2026-11-14) filled in at one place
 * per lab:
 *  - phase 2: first-visit bezel captions from the lab's dictionary
 *    (bezelCaptions.ts, S3 BezelItem.caption) and, where asked, the shared
 *    "Sound off?" line on any rack whose dock has a PLAY key (S3 soundOffLine:
 *    every step of these labs can still be done and seen silently);
 *  - phase 3 (owner's decision 3): the plain one-sentence model note in place
 *    of an all-caps badge (modelNotes.ts, S3 RackStage.modelNote), and
 *    "drawing…" over the glass until the module's drawing has mounted and the
 *    screen has had a moment to paint it (S3 RackStage.drawing).
 */
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { RackUnit } from '../rack/RackUnit';
import { runSoon } from '../../../lib/afterInteractions';
import { withCaptions } from './bezelCaptions';
import { modelNoteFor } from './modelNotes';

/** Calls `onPainted` once, after its children mounted and the app went idle. */
function PaintSignal({ onPainted, children }: { onPainted: () => void; children: ReactNode }) {
  // []-deps: once per mount (the rack is keyed per module).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => runSoon(onPainted, { idleTimeoutMs: 300 }).cancel, []);
  return <>{children}</>;
}

export function captionedRack(
  dict: Readonly<Record<string, string>>,
  opts: { soundOffWhenPlayable?: boolean; modelNotes?: boolean; drawingPlaceholder?: boolean } = {},
) {
  return function CaptionedRackUnit(props: ComponentProps<typeof RackUnit>) {
    const [painted, setPainted] = useState(false);
    const playable = !!opts.soundOffWhenPlayable && props.params.some((p) => p.id === 'play');
    const render = props.stage.render;
    return (
      <RackUnit
        {...props}
        stage={{
          ...props.stage,
          bezel: withCaptions(props.stage.bezel, dict),
          soundOffLine: props.stage.soundOffLine ?? (playable ? true : undefined),
          modelNote: props.stage.modelNote ?? (opts.modelNotes ? modelNoteFor(props.stage.badge) : undefined),
          ...(opts.drawingPlaceholder
            ? {
                render: (w: number, h: number) => <PaintSignal onPainted={() => setPainted(true)}>{render(w, h)}</PaintSignal>,
                drawing: props.stage.drawing ?? !painted,
              }
            : null),
        }}
      />
    );
  };
}
