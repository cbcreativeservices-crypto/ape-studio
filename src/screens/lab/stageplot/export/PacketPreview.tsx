/**
 * PacketPreview — the gig packet on screen, drawn from the SAME `SpDoc` the
 * PDF, the print and the text view are made from (features/stageplot/
 * spDocTypes). Plain views on white paper: no web view, so it is the same on
 * a phone and in a browser, and it cannot show a different revision from the
 * one that will be exported.
 *
 * It is a READING view, not a picture of the pages: it has no page breaks,
 * and on a narrow phone a table row is set as a small block (the first two
 * cells as its heading, then "Label: value" lines) because seven columns
 * across 360 points cannot be read. Every row, every cell and every note of
 * the document is here: nothing is cut and nothing is shortened.
 */
import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { SpDoc, SpDocBlock, SpDocTable } from '../../../../features/stageplot/spDocTypes';
import { fonts } from '../../../../theme/tokens';
import { PlotView } from './PlotView';

const INK = '#111111';
const SOFT = '#3a3a3a';
const RULE = '#8a8a8a';
const PAPER = '#ffffff';
/** From this paper width a table is set in columns. */
const GRID_FROM = 640;
const EMPTY_CELL = '–';
const PAD = 14;

function TableGrid({ table }: { table: SpDocTable }) {
  return (
    <View style={styles.table}>
      <View style={[styles.gridRow, styles.gridHead]}>
        {table.columns.map((c) => (
          <Text key={c.key} style={[styles.th, { flex: c.width }, c.align === 'center' && styles.center]}>
            {c.label}
          </Text>
        ))}
      </View>
      {table.rows.map((r, n) => (
        <View key={n} style={styles.gridGroup}>
          <View style={styles.gridRow}>
            {table.columns.map((c) => (
              <Text key={c.key} style={[styles.td, { flex: c.width }, c.align === 'center' && styles.center, r.strong && styles.strong]}>
                {r.cells[c.key] ?? ''}
              </Text>
            ))}
          </View>
          {r.note ? <Text style={styles.rowNote}>{r.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function TableStack({ table }: { table: SpDocTable }) {
  const [first, second, ...rest] = table.columns;
  return (
    <View style={styles.table}>
      {table.rows.map((r, n) => {
        const head = [first ? r.cells[first.key] : '', second ? r.cells[second.key] : ''].filter((v) => v && v !== EMPTY_CELL).join(' · ');
        return (
          <View key={n} style={styles.stackRow}>
            <Text style={[styles.stackHead, r.strong && styles.strong]}>{head || EMPTY_CELL}</Text>
            {rest.map((c) => {
              const v = (r.cells[c.key] ?? '').trim();
              if (!v || v === EMPTY_CELL) return null;
              return (
                <Text key={c.key} style={[styles.stackLine, r.strong && styles.strong]}>
                  <Text style={styles.stackLabel}>{c.label}: </Text>
                  {v}
                </Text>
              );
            })}
            {r.note ? <Text style={styles.rowNote}>{r.note}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function Block({ block, width }: { block: SpDocBlock; width: number }) {
  if (block.t === 'heading') {
    return (
      <Text style={block.level === 1 ? styles.h1 : styles.h2} accessibilityRole="header">
        {block.text}
      </Text>
    );
  }
  if (block.t === 'para') return <Text style={[styles.p, block.tone === 'strong' && styles.strong, block.tone === 'muted' && styles.muted]}>{block.text}</Text>;
  if (block.t === 'facts') {
    return (
      <View style={styles.facts}>
        {block.rows.map(([k, v]) => (
          <Text key={k} style={styles.fact}>
            <Text style={styles.factLabel}>{k}: </Text>
            {v}
          </Text>
        ))}
      </View>
    );
  }
  if (block.t === 'list') {
    return (
      <View style={styles.list}>
        {block.items.map((item, n) => (
          <View key={n} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.t === 'table') {
    if (!block.table.rows.length) return <Text style={[styles.p, styles.muted]}>{block.table.empty}</Text>;
    return width >= GRID_FROM ? <TableGrid table={block.table} /> : <TableStack table={block.table} />;
  }
  const plot = block.plot;
  return (
    <View style={styles.plot}>
      <PlotView plot={plot} width={width} />
      {plot.viewNote ? (
        <Text style={styles.p}>
          <Text style={styles.factLabel}>Viewpoint: </Text>
          {plot.viewNote}
        </Text>
      ) : null}
      {plot.legend.map((l, n) => (
        <View key={n} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={[styles.listText, styles.muted]}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

export function PacketPreview({ doc }: { doc: SpDoc }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width) - PAD * 2;
    setWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
  };
  return (
    <View style={styles.paper} onLayout={onLayout}>
      <View style={styles.docHead}>
        <View style={styles.docHeadText}>
          <Text style={styles.docTitle} accessibilityRole="header">
            {doc.title}
          </Text>
          <Text style={styles.docMeta}>{doc.footer}</Text>
        </View>
        {doc.stamp ? (
          <View style={styles.stamp}>
            <Text style={styles.stampText}>{doc.stamp}</Text>
          </View>
        ) : null}
      </View>
      {width > 0
        ? doc.sections.map((s) => (
            <View key={s.id} style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {s.title}
              </Text>
              {s.blocks.map((b, n) => (
                <Block key={n} block={b} width={width} />
              ))}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: PAPER, borderRadius: 4, padding: PAD, gap: 18 },
  docHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: 2, borderBottomColor: INK, paddingBottom: 8 },
  docHeadText: { flex: 1, gap: 2 },
  docTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 19, lineHeight: 24, color: INK },
  docMeta: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 18, color: SOFT },
  stamp: { borderWidth: 2, borderColor: INK, paddingHorizontal: 9, paddingVertical: 3 },
  stampText: { fontFamily: fonts.barlowSemiBold, fontSize: 15, letterSpacing: 2, color: INK },
  section: { gap: 9 },
  sectionTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 17, lineHeight: 22, color: INK, borderBottomWidth: 1, borderBottomColor: RULE, paddingBottom: 3 },
  h1: { fontFamily: fonts.barlowSemiBold, fontSize: 15.5, lineHeight: 20, color: INK, marginTop: 4 },
  h2: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19, color: INK, marginTop: 4 },
  p: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 19.5, color: INK },
  strong: { fontFamily: fonts.barlowSemiBold },
  muted: { color: SOFT },
  center: { textAlign: 'center' },
  facts: { gap: 3 },
  fact: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 19.5, color: INK },
  factLabel: { fontFamily: fonts.barlowSemiBold, color: INK },
  list: { gap: 4 },
  listRow: { flexDirection: 'row', gap: 7 },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 19.5, color: INK, width: 9 },
  listText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 19.5, color: INK },
  plot: { gap: 6 },
  table: { borderTopWidth: 1, borderTopColor: INK },
  gridHead: { borderBottomWidth: 1, borderBottomColor: INK },
  gridGroup: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: RULE },
  gridRow: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  th: { fontFamily: fonts.barlowSemiBold, fontSize: 13, lineHeight: 17, color: INK },
  td: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 18, color: INK },
  rowNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17.5, color: SOFT, paddingBottom: 5 },
  stackRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: RULE, paddingVertical: 7, gap: 2 },
  stackHead: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19.5, color: INK },
  stackLine: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 18.5, color: INK },
  stackLabel: { color: SOFT },
});
