/**
 * StudioButton — LEGACY WRAPPER (Booth 2026-07-09u). The old chamfered-octagon
 * SVG cap is retired; every StudioButton in the app now renders the
 * scribble-strip GLASS KEY (GlassButton — the Fill-in-Blank Prev/Next
 * aesthetic) with the ORIGINAL color assignments preserved via variant→tint:
 *   primary/white → gold (amber backlight) · success → green ·
 *   outline → blue · secondary/light → steel.
 * The old prop surface (small/chamfer/frameW/pinW/height) is kept so no call
 * site changes; the SVG-era chamfer props are accepted and ignored.
 */
import { GlassButton, type GlassTint } from './GlassButton';

export type StudioButtonVariant = 'primary' | 'secondary' | 'success' | 'outline' | 'white' | 'light';

const TINT: Record<StudioButtonVariant, GlassTint> = {
  primary: 'gold',
  white: 'gold',
  success: 'green',
  outline: 'blue',
  secondary: 'steel',
  light: 'steel',
};

export function StudioButton({
  label,
  variant = 'primary',
  small = false,
  disabled = false,
  height,
  onPress,
}: {
  label: string;
  variant?: StudioButtonVariant;
  small?: boolean;
  disabled?: boolean;
  /** Accepted for legacy call sites; the glass key has no chamfer. */
  chamfer?: number;
  frameW?: number;
  pinW?: number;
  /** Explicit cap height (e.g. 56 for thumb-target buttons); overrides small. */
  height?: number;
  onPress?: () => void;
}) {
  return (
    <GlassButton
      label={label.toUpperCase()}
      tint={TINT[variant]}
      disabled={disabled}
      height={height ?? (small ? 36 : 48)}
      fontSize={small ? 12.5 : 15}
      onPress={onPress}
    />
  );
}
