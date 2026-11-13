/**
 * hudA — instrument strips: level, cats, chain, sync, takes, beds. Contract: gaHudTypes.ts.
 *
 *   level, cats, beds      aLevels.tsx   strips made of level bars
 *   chain, sync, takes     aFlows.tsx    strips that show something sent or chosen
 *   what they read         aModel.ts     pure; test/gameAudioHudA.test.ts
 *   the loops' real shape  aLoopShapes.ts
 *   what they are made of  aParts.tsx    frame, words, bar, lamp, the one clock
 *
 * A STRIP NEVER THROWS (the contract). Each one is mounted inside a guard: if
 * a strip cannot draw the state it is given, the guard draws the strip's
 * empty face instead and tries again on the next state, so the scene above
 * it and the page around it carry on.
 */
import { Component, type ReactNode } from 'react';
import type { GaHudId, GaHudMap, GaHudProps } from './gaHudTypes';
import { A_FLOW_HUDS } from './aFlows';
import { A_LEVEL_HUDS } from './aLevels';
import { HudFrame } from './aParts';

type GuardProps = GaHudProps & { children: ReactNode };
type GuardState = { failed: boolean; seen: GaHudProps['state'] | null };

class HudGuard extends Component<GuardProps, GuardState> {
  state: GuardState = { failed: false, seen: null };

  /** A new state of the scene is a new try. */
  static getDerivedStateFromProps(props: GuardProps, state: GuardState): Partial<GuardState> | null {
    return props.state !== state.seen ? { seen: props.state, failed: false } : null;
  }

  static getDerivedStateFromError(): Partial<GuardState> {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <HudFrame w={this.props.w} h={this.props.h} label="This display has nothing to show for the scene as it is now.">
          {null}
        </HudFrame>
      );
    }
    return this.props.children;
  }
}

const STRIPS: Partial<Record<GaHudId, (p: GaHudProps) => ReactNode>> = { ...A_LEVEL_HUDS, ...A_FLOW_HUDS };

const guarded = (id: GaHudId) => {
  const Strip = STRIPS[id]!;
  return function GuardedHud(p: GaHudProps) {
    return (
      <HudGuard {...p}>
        <Strip {...p} />
      </HudGuard>
    );
  };
};

export const GA_HUDS_A: GaHudMap = Object.fromEntries((Object.keys(STRIPS) as GaHudId[]).map((id) => [id, guarded(id)])) as GaHudMap;
