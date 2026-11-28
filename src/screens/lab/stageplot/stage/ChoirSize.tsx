/**
 * ChoirSize — how many singers a choir has and in how many rows (round 2,
 * owner 2026-11-13: "Yes, build them all"). Used where a choir is added (the
 * palette, before its package is chosen, so the package fits it) and in the
 * OBJECT details of a choir on the stage. The riser, the drawing, the
 * printed symbol and the area microphones all follow (spChoir).
 */
import { StyleSheet, Text, View } from 'react-native';
import { SP_CHOIR_MAX, SP_CHOIR_MIC_HOW, SP_CHOIR_MIN, spChoirAutoRows, spChoirLayout, spChoirMics, spChoirWords } from '../../../../features/stageplot/spChoir';
import type { SpChoir } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { Choice, NumberField } from '../spForm';

type RowsValue = 'auto' | '1' | '2' | '3' | '4';

export function ChoirSize({ value, onChange, mics }: { value: SpChoir; onChange: (c: SpChoir) => void; /** Area microphones its source has now (the OBJECT details), or undefined. */ mics?: number }) {
  const lay = spChoirLayout(value);
  const want = spChoirMics(lay);
  const rows: RowsValue = value.rows === 'auto' ? 'auto' : (String(value.rows) as RowsValue);
  const micLine = mics == null ? `Area microphones for this choir: about ${want}.` : mics === 0 ? `Area microphones for this choir: about ${want}. Its source has none yet.` : `Area microphones for this choir: about ${want}. Its source has ${mics}.`;
  return (
    <View style={styles.wrap}>
      <NumberField label={`Singers (${SP_CHOIR_MIN} to ${SP_CHOIR_MAX})`} value={value.singers} min={SP_CHOIR_MIN} max={SP_CHOIR_MAX} onCommit={(n) => (n != null ? onChange({ ...value, singers: n }) : undefined)} width="half" />
      <Choice<RowsValue>
        label="Rows"
        value={rows}
        options={[
          { value: 'auto', label: `AUTO (${spChoirAutoRows(value.singers)})` },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ]}
        onChange={(v) => onChange({ ...value, rows: v === 'auto' ? 'auto' : Number(v) })}
        hint="One row stands on the floor. Two, three or four rows stand on choral riser units, 6 ft (1.83 m) wide with 18 in steps, in window spacing: each singer stands in a gap of the row in front."
      />
      <Text style={styles.line}>{`${spChoirWords(value)}.`}</Text>
      <Text style={styles.line}>{micLine}</Text>
      <Text style={styles.hint}>{SP_CHOIR_MIC_HOW}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  line: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  hint: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSub,
  },
});
