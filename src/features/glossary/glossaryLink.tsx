/**
 * glossaryLink — auto-link glossary terms inside lab text (owner 2026-08-07):
 * "if it's a glossary term, it should have a link so the user can understand a
 * term they don't know yet."
 *
 * `<GlossaryText>` scans a plain-string body for known audio glossary terms and
 * renders the FIRST occurrence of each as a tappable link; the tap opens the
 * in-place `GlossaryTermPopup` (definition + plain-English, returns to spot).
 * Wrap a screen once in `<GlossaryLinkProvider>` — it holds the single shared
 * popup, so many `<GlossaryText>` blocks cost one modal, not dozens. Without a
 * provider above it, `<GlossaryText>` degrades to plain text.
 *
 * The link set is the curated core-audio vocabulary VERIFIED to exist in the
 * glossary (2026-08-07). It stays deliberately small and specific so links are
 * high-signal — not every "the" and "signal" underlined. Grow it as needed.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { GlossaryTermPopup } from './GlossaryTermPopup';

// Verified present in the `glossary` table (lowercased match keys). Longer
// phrases must precede their sub-words so "cutoff frequency" wins over
// "frequency" — the segmenter sorts by length, so order here is cosmetic.
const LINK_TERMS: string[] = [
  'sound pressure level', 'parametric equalizer', 'graphic equalizer', 'nyquist frequency',
  'cutoff frequency', 'center frequency', 'corner frequency', 'proximity effect', 'comb filtering',
  'dynamic range', 'shelving filter', 'peaking filter', 'high-pass filter', 'low-pass filter',
  'low-cut filter', 'bandpass filter', 'notch filter', 'standing wave', 'minimum phase',
  'critical band', 'gain staging', 'sample rate', 'phase shift', 'bell filter', 'high shelf',
  'low shelf', 'white noise', 'pink noise', 'q factor', 'roll-off', 'wavelength', 'bandwidth',
  'amplitude', 'attenuation', 'resonance', 'reverberation', 'sibilance', 'transient', 'harmonic',
  'headroom', 'passband', 'stopband', 'fundamental', 'formant', 'clipping', 'distortion',
  'feedback', 'spectrum', 'decibel', 'frequency', 'octave', 'timbre', 'bypass', 'phase', 'gain',
];

const RE = (() => {
  const escaped = LINK_TERMS.slice()
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Optional trailing "s" catches simple plurals (filters, transients, gains).
  return new RegExp(`\\b(${escaped.join('|')})(s)?\\b`, 'gi');
})();

type Seg = { text: string; term?: string };

/** Split text into plain + first-occurrence glossary-term segments. */
export function linkifyGlossary(text: string): Seg[] {
  const segs: Seg[] = [];
  const seen = new Set<string>();
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(text)) !== null) {
    const base = m[1].toLowerCase();
    if (seen.has(base)) continue; // only the first mention becomes a link
    seen.add(base);
    if (m.index > last) segs.push({ text: text.slice(last, m.index) });
    segs.push({ text: m[0], term: base });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ text: text.slice(last) });
  return segs;
}

const OpenCtx = createContext<((name: string) => void) | null>(null);

/** Wrap a screen once; holds the single shared glossary popup. */
export function GlossaryLinkProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<string | null>(null);
  return (
    <OpenCtx.Provider value={setTerm}>
      {children}
      <GlossaryTermPopup termName={term} onClose={() => setTerm(null)} />
    </OpenCtx.Provider>
  );
}

/** A <Text> whose known glossary terms become tappable links. `children` MUST
 *  be a single plain string (interpolated bodies stay plain Text). */
export function GlossaryText({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const open = useContext(OpenCtx);
  const segs = useMemo(() => (open ? linkifyGlossary(children) : [{ text: children }]), [children, open]);
  return (
    <Text style={style}>
      {segs.map((s, i) =>
        s.term && open ? (
          <Text key={i} style={styles.link} suppressHighlighting onPress={() => open(s.term!)}>
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  // The app's glossary-link blue (matches the glossary screen's termLink), so a
  // tappable term reads the same everywhere.
  link: { color: '#9fbede', textDecorationLine: 'underline', textDecorationColor: 'rgba(159,190,222,0.4)' },
});
