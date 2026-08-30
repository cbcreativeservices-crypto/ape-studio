/**
 * rackTypes — the Rack Unit's typed control grammar (APE_LAB_UX_PROPOSAL
 * 2026-08-23, "The Rack Unit", owner-approved).
 *
 * A lab module hands the frame a DECLARATION of its controls; the frame owns
 * the layout law: *reading may scroll; operating may not*. Two button verbs
 * only (judge-panel coherence rule): a `fader` param BINDS the shared lane
 * (▪ glyph); `options`/`group` params OPEN a tray (▸ glyph). Toggles and
 * actions render visually distinct so the value-button skin keeps exactly one
 * meaning per surface.
 */
import type { ReactNode } from 'react';

/** Stage glass heights. Auto-drops one size on short viewports (<~700dp). */
export type StageSize = 'S' | 'M' | 'L';
export const STAGE_HEIGHTS: Record<StageSize, number> = { S: 160, M: 200, L: 250 };

/** One bezel legend window — readouts printed ON the display (ReadoutGrid's
 *  {k,v,helpKey} contract, rendered as the glass's bezel strip). */
export type BezelItem = {
  k: string;
  v: string;
  /** Value tint (e.g. levelColor ramp); default amber. */
  tint?: string;
  /** Long-press → this guided-lesson entry (via RackUnit.onHelp). */
  helpKey?: string;
  /** Tap action (PK-HOLD-style tap-to-reset cells). */
  onPress?: () => void;
  /** Relative width of this cell (default 1). */
  flex?: number;
};

/** The pinned display. `render` receives the glass's inner width/height —
 *  existing height-param'd viz components drop straight in. */
export type RackStage = {
  render: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Readouts on the bezel strip under the glass. */
  bezel?: BezelItem[];
  /** Honesty micro-badge over the glass (must stay per-display). */
  badge?: string;
  /** ⓘ display-guide slot on the bezel (opens the display lesson). */
  onGuide?: () => void;
  /** Suppress the floating drag tag over the glass (owner 2026-08-28): set on
   *  stages whose BEZEL already prints the bound parameter live, so the tag is
   *  pure redundancy sitting on top of the drawing. */
  hideDragTag?: boolean;
};

/** One option inside an options tray. LabChip semantics preserved
 *  (photoHint 📷, long-press lesson via helpKey). */
export type TrayOption = {
  id: string;
  label: string;
  photoHint?: boolean;
  /** Long-press override for this option (e.g. open a material photo). */
  onLongPress?: () => void;
  /** One–two sentences: what this option IS / what picking it does (owner
   *  2026-08-28). Shown in the open tray for the SELECTED option, so the
   *  learner reads what they just changed WITHOUT the lab's prose — which the
   *  tray is covering at that moment. Updates live as they A/B. Optional:
   *  self-evident values (frequencies, on/off) don't need one, and a tray with
   *  no blurbs renders exactly as before. */
  blurb?: string;
};

/** The dock grammar. */
export type DockParam =
  | {
      kind: 'fader';
      id: string;
      /** Dock-button label — keep SHORT (Oswald 12, one line). */
      label: string;
      /** 0..1 lane position; the lab owns its own value mapping/taper. */
      value: number;
      onChange: (v: number) => void;
      /** Formatted readout for the lane + drag tag (full detail). */
      format: (v: number) => string;
      /** Compact value for the dock BUTTON (~7 mono chars before truncation
       *  with 5 keys on a 375-wide phone). Defaults to `format`. */
      formatShort?: (v: number) => string;
      /** Lane/thumb tint (default amber) — e.g. levelColor ramp. */
      tint?: string;
      /** ONE key that is both a chooser and a slider (owner 2026-08-30 — two
       *  keys for one control was redundant): tapping opens this menu, and
       *  picking an option closes it and binds the lane, so the user lands on
       *  the slider for the thing they just chose. */
      chooser?: {
        /** Tray heading, e.g. "EQ FILTER". Defaults to the fader's label. */
        title?: string;
        options: TrayOption[];
        selectedId: string | null;
        onSelect: (id: string) => void;
        /** Sticky = the tray STAYS OPEN so the choices can be A/B'd while the
         *  glass reacts; the lane binds when the tray is closed instead of on
         *  each pick. Default = pick-and-go straight to the slider. */
        sticky?: boolean;
      };
      helpKey?: string;
    }
  | {
      kind: 'options';
      id: string;
      label: string;
      /** Current value shown on the button (mono amber). */
      valueLabel: string;
      options: TrayOption[];
      selectedId: string | null;
      onSelect: (id: string) => void;
      /** Sticky = teaching collection: pick applies and the tray STAYS OPEN
       *  for A/B while the glass reacts. Default = apply-and-close (tools
       *  parity, set-and-forget settings). */
      sticky?: boolean;
      /** In-tray reset (reset-in-container rule). */
      onReset?: { label: string; onPress: () => void };
      helpKey?: string;
    }
  | {
      kind: 'group';
      id: string;
      label: string;
      valueLabel: string;
      /** Custom tray content — 2–3 INTERACTING params co-visible in one sheet
       *  (the Meter Bridge graft). Compose LabChips/rows; long-press lessons
       *  keep working because the lab renders its own chips. Always sticky. */
      render: () => ReactNode;
      helpKey?: string;
    }
  | {
      kind: 'toggle';
      id: string;
      label: string;
      value: boolean;
      onToggle: () => void;
      helpKey?: string;
    }
  | {
      kind: 'action';
      id: string;
      label: string;
      onPress: () => void;
      /** Border tint for the key — e.g. green for a replay/reset. */
      tint?: string;
    };
