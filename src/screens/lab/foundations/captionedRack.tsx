/**
 * A lab's Rack Unit with phase 2 of the lab fix round (2026-11-14) filled in
 * at one place per lab: first-visit bezel captions from the lab's dictionary
 * (bezelCaptions.ts, S3 BezelItem.caption) and, where asked, the shared
 * "Sound off?" line on any rack whose dock has a PLAY key (S3 soundOffLine:
 * every step of these labs can still be done and seen silently).
 */
import type { ComponentProps } from 'react';
import { RackUnit } from '../rack/RackUnit';
import { withCaptions } from './bezelCaptions';

export function captionedRack(dict: Readonly<Record<string, string>>, opts: { soundOffWhenPlayable?: boolean } = {}) {
  return function CaptionedRackUnit(props: ComponentProps<typeof RackUnit>) {
    const playable = !!opts.soundOffWhenPlayable && props.params.some((p) => p.id === 'play');
    return (
      <RackUnit
        {...props}
        stage={{
          ...props.stage,
          bezel: withCaptions(props.stage.bezel, dict),
          soundOffLine: props.stage.soundOffLine ?? (playable ? true : undefined),
        }}
      />
    );
  };
}
