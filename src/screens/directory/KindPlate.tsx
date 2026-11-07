/**
 * The small plates of the approved community mockups: GRADUATE, EMPLOYER,
 * COMPANY, INSTITUTION, INSTRUCTOR. The same colours in the Directory and the
 * forum, so a plate means one thing everywhere.
 */
import { StyleSheet, Text } from 'react-native';
import { fonts } from '../../theme/tokens';

export type PlateKey = 'graduate' | 'employer' | 'company' | 'institution' | 'instructor';

const TONES: Record<PlateKey, { text: string; border: string; bg: string }> = {
  graduate: { text: '#ffc64d', border: 'rgba(255,198,77,.5)', bg: 'rgba(255,198,77,.08)' },
  employer: { text: '#9fb4c8', border: 'rgba(159,180,200,.45)', bg: 'rgba(159,180,200,.08)' },
  company: { text: '#5bb0ff', border: 'rgba(91,176,255,.45)', bg: 'rgba(91,176,255,.08)' },
  institution: { text: '#37e05f', border: 'rgba(55,224,95,.45)', bg: 'rgba(55,224,95,.07)' },
  instructor: { text: '#c58cff', border: 'rgba(197,140,255,.45)', bg: 'rgba(197,140,255,.08)' },
};

export function KindPlate({ tone, label }: { tone: PlateKey; label: string }) {
  const c = TONES[tone];
  return <Text style={[st.plate, { color: c.text, borderColor: c.border, backgroundColor: c.bg }]}>{label}</Text>;
}

const st = StyleSheet.create({
  plate: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.63,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 1,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
});
