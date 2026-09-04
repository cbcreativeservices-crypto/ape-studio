/**
 * CredentialBadge — the placeholder trophy disc for an earned certificate or
 * program, used until real credential art is supplied (owner supplies art in a
 * later session). Generalized from GalleryScreen's local `BadgeDisc`:
 * concentric rings in the category accent (certificate = blue, program =
 * purple) over a dark core. Presentation only.
 */
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type CredentialKind = 'certificate' | 'program';

const KIND_COLOR: Record<CredentialKind, string> = {
  certificate: colors.cyan, // #5bb0ff
  program: colors.programPurple, // #c4a2ff — matches Awards/Curriculum
};

export function CredentialBadge({
  kind,
  size = 48,
  color,
}: {
  kind: CredentialKind;
  size?: number;
  color?: string;
}) {
  const c = color ?? KIND_COLOR[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={24} fill="#101820" />
      <Circle cx={24} cy={24} r={16} fill="none" stroke={c} strokeWidth={3} />
      <Circle cx={24} cy={24} r={10.5} fill="none" stroke={c} strokeWidth={2.5} opacity={0.85} />
      {/* Program badges get a filled center pip so the two read apart at a glance. */}
      {kind === 'program' ? (
        <Circle cx={24} cy={24} r={4.5} fill={c} opacity={0.9} />
      ) : (
        <Circle cx={24} cy={24} r={4.5} fill="#0b0b0b" />
      )}
    </Svg>
  );
}
