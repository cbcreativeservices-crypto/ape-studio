/**
 * WebPrintView — the print view of the packet, for a BROWSER only.
 *
 * It is an iframe that holds the packet's HTML sheet and nothing else, so
 * the browser prints the packet, with its own page size and page breaks,
 * and not the app around it. The app has no other web print path:
 * expo-print on the web only prints the page that is open.
 *
 * TWO PRESSES, ON PURPOSE (review 1: the first version printed as soon as
 * the sheet had loaded, and in a browser that could not show its dialog the
 * whole page froze). Opening this view only SHOWS the sheet. Printing is
 * the PRINT THIS VIEW button inside it, and the browser's own print call
 * is made in that press and nowhere else: never when the sheet loads, never
 * from an effect, never on a timer. CLOSE takes the view away.
 *
 * The sheet is shown at the page's own width inside a sideways scroller, so
 * its words are readable on a narrow screen (a sheet squeezed to a phone's
 * width cannot be read).
 *
 * Never mounted on a phone (the caller checks the platform).
 */
import { createElement, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { spPrintFrame, type SpFramePrintOutcome } from '../../../../features/stageplot/spExport';
import { colors, fonts } from '../../../../theme/tokens';
import { Button } from '../spForm';

/** CSS pixels for one typographic point. */
const PX_PER_PT = 96 / 72;
const FRAME_H = 560;

export function WebPrintView({ html, pageWidthPt, onPrinted, onClose }: { html: string; pageWidthPt: number; onPrinted: (outcome: SpFramePrintOutcome) => void; onClose: () => void }) {
  const frame = useRef<unknown>(null);
  const width = Math.round(pageWidthPt * PX_PER_PT);
  // The one place the browser is asked to print: this press.
  const printThisView = () => onPrinted(spPrintFrame(frame.current));
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Print view: the pages as the browser prints them, at full size. Scroll sideways to see all of a page.</Text>
      <View style={styles.buttons}>
        <Button label="PRINT THIS VIEW" tone="primary" onPress={printThisView} a11yLabel="Print this view: the browser’s own print dialog opens next" />
        <Button label="CLOSE" onPress={onClose} a11yLabel="Close the print view" />
      </View>
      <Text style={styles.caption}>PRINT THIS VIEW opens the browser’s own print dialog next. To keep a file, choose “Save as PDF” there.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.box}>
        <View style={{ width, height: FRAME_H }}>
          {createElement('iframe', {
            ref: frame,
            srcDoc: html,
            title: 'Print view of the packet',
            style: { width: '100%', height: '100%', border: 0, background: '#ffffff' },
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  box: { height: FRAME_H, borderRadius: 4, backgroundColor: '#ffffff' },
});
