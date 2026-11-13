/**
 * stageplot/monitors/NeedsPanel — WHAT EACH MIX NEEDS TO HEAR, one mix at a
 * time: the mix's inputs as rows, each with the four words (Primary,
 * Supporting, Not needed, Must exclude). On a phone a source-by-mix table
 * would be too wide to read, so the mix is chosen first and its inputs run
 * down the page.
 *
 * A row is SHORT (review 1, visual: 200 pt for each input was too long to
 * finish): one line with the channel number, the input and who plays it,
 * then the four words on one line at 375 pt and wider. A row with no word
 * chosen says nothing more: the empty row is the message.
 *
 * These are PREFERENCES GIVEN BEFORE THE SHOW, never faders or numbers
 * (handoff §5). A click, cue or talkback input carries the MONITOR ONLY label
 * on its row and starts as "Must exclude" in every mix (the model does that);
 * the band can change it on purpose.
 */
import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SP_NEED_WORD } from '../../../../features/stageplot/spCatalog';
import { spSetNeed } from '../../../../features/stageplot/spModel';
import type { SpId, SpMixNeed } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { useSpEditor } from '../spContext';
import { Button, Choice, HelpTip, Note } from '../spForm';
import { AudienceTag, ChipRow, Line, ToggleChip } from './bits';
import { SPM_NEED_MEANING, SPM_NEEDS, SPM_NEEDS_NOTE, spmChannelWord, spmMixTitle, spmNeedRows, spmNeedSummary, spmRecipients, type SpmNeedRow } from './monitorPlan';

const FOUR_WORDS = SPM_NEEDS.map((k) => `${SP_NEED_WORD[k]}: ${SPM_NEED_MEANING[k]}`).join('\n');

const NeedRow = memo(function NeedRow({ row, mixTitle, onSet }: { row: SpmNeedRow; mixTitle: string; onSet: (inputId: SpId, need: SpMixNeed | null) => void }) {
  const who = row.performerName ? (row.own ? `${row.performerName}, on this mix` : row.performerName) : '';
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{row.badge}</Text>
        </View>
        <Text style={styles.rowTitle}>
          {row.label}
          {who ? <Text style={styles.rowWho}>{` · ${who}`}</Text> : null}
        </Text>
      </View>
      {row.audienceLabel ? <AudienceTag text={row.audienceLabel} /> : null}
      <ChipRow tight>
        {SPM_NEEDS.map((k) => (
          <ToggleChip
            key={k}
            compact
            label={SP_NEED_WORD[k]}
            selected={row.need === k}
            tone={k === 'exclude' ? 'red' : 'amber'}
            onPress={() => onSet(row.inputId, row.need === k ? null : k)}
            a11yLabel={`${row.label}, ${spmChannelWord(row.badge)}: ${SP_NEED_WORD[k]} in ${mixTitle}`}
          />
        ))}
      </ChipRow>
      {row.need == null && row.audienceLabel ? <Line tone="dim">No word is chosen. With no word, the engineer is not told to keep this out of the mix.</Line> : null}
    </View>
  );
});

export function NeedsPanel({ mixId, onPickMix }: { mixId: SpId | null; onPickMix: (id: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const mix = p.mixes.find((m) => m.id === mixId) ?? p.mixes[0];
  const rows = useMemo(() => (mix ? spmNeedRows(p, mix.id) : []), [p, mix]);
  const { apply } = ed;
  const openMixId = mix?.id ?? '';
  const onSet = useCallback((inputId: SpId, need: SpMixNeed | null) => apply((cur) => spSetNeed(cur, openMixId, inputId, need)), [apply, openMixId]);

  if (!mix) return <Note>There are no mixes yet. Use ADD A MIX first. Then say here what the mix needs to hear.</Note>;

  const title = spmMixTitle(mix);

  return (
    <View style={styles.wrap}>
      <Choice label="Mix" value={mix.id} options={p.mixes.map((m) => ({ value: m.id, label: spmMixTitle(m) }))} onChange={onPickMix} hint="One mix at a time. Each mix keeps its own answers." />
      <Line tone="strong">{`${title}, for ${spmRecipients(p, mix)}`}</Line>
      <Note>{SPM_NEEDS_NOTE}</Note>
      <HelpTip title="The four words" body={`${FOUR_WORDS}\n\nTap a chosen word again to clear it. An input with no word has no preference recorded.`} />
      {rows.length ? (
        <>
          <Line tone="dim">{spmNeedSummary(rows)}</Line>
          {rows.map((r) => (
            <NeedRow key={r.inputId} row={r} mixTitle={title} onSet={onSet} />
          ))}
        </>
      ) : (
        <>
          <Note>There are no inputs yet. The inputs you add in INPUTS appear here as rows.</Note>
          <Button label="GO TO INPUTS" onPress={() => ed.goTo('inputs')} a11yLabel="Go to the Inputs area" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 8, gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: { minWidth: 30, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: colors.steelBorder, alignItems: 'center' },
  badgeText: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  rowTitle: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  rowWho: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub },
});
