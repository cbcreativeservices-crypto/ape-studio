/**
 * AlbumDisc — LP vinyl at the student's tier (Black/Silver/Gold/Platinum/
 * Diamond), SVG approximation of design-reference AlbumDisc.dc.html:
 * tier-toned disc, concentric grooves, two-lobe gloss hint, steel #3c3c3c
 * center label, spindle hole. Tier = f(overall %), thresholds locked.
 */
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import type { AlbumTierName } from '../theme/tokens';

const TIER_TONES: Record<AlbumTierName, { base: string; groove: string; rim: string }> = {
  Black: { base: '#161616', groove: '#2a2a2a', rim: '#3a3a3a' },
  Silver: { base: '#9c9c9c', groove: '#6f6f6f', rim: '#d8d8d8' },
  Gold: { base: '#d4af37', groove: '#a4831f', rim: '#ffd700' },
  Platinum: { base: '#cfcecb', groove: '#a3a29e', rim: '#e5e4e1' },
  Diamond: { base: '#ccd4f5', groove: '#9aa6d9', rim: '#e6e7ff' },
};

export function AlbumDisc({ level, size = 60 }: { level: AlbumTierName; size?: number }) {
  const t = TIER_TONES[level];
  const r = 50; // viewBox radius
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="discShade" cx="35%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
          <Stop offset="45%" stopColor="#ffffff" stopOpacity={0.02} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.35} />
        </RadialGradient>
      </Defs>
      {/* disc + rim */}
      <Circle cx={50} cy={50} r={r} fill={t.base} stroke={t.rim} strokeWidth={1.5} />
      {/* grooves */}
      {[43, 37, 31, 25].map((gr) => (
        <Circle key={gr} cx={50} cy={50} r={gr} fill="none" stroke={t.groove} strokeWidth={1} opacity={0.7} />
      ))}
      {/* two-lobe gloss */}
      <Path d="M18 30 A38 38 0 0 1 44 13" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M82 70 A38 38 0 0 1 56 87" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* steel center label + spindle */}
      <Circle cx={50} cy={50} r={16} fill="#3c3c3c" stroke="#2a2a2a" strokeWidth={1} />
      <Circle cx={50} cy={50} r={2.5} fill="#000000" />
      {/* lighting overlay */}
      <Circle cx={50} cy={50} r={r} fill="url(#discShade)" />
    </Svg>
  );
}
