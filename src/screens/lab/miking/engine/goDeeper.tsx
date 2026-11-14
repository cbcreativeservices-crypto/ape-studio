/**
 * "Go deeper ▾" (owner decision 5, 2026-11-14; the rule: engine/foldRule.ts).
 * PageSteps passes every step's content through foldLong(): a long step keeps
 * its beginner core open and folds the rest of its longest list of reading
 * cards under one GO DEEPER key. Every card stays on the page, in order.
 */
import { Fragment, createElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Body, Card, Note, Point, ZoneCard } from './kit';
import { planFold } from './foldRule.ts';

/** Reading cards only (never a check, a prediction or a task). */
const READING = new Set<unknown>([Card, Body, Point, Note, ZoneCard]);
export const isReadingCard = (item: unknown): boolean => isValidElement(item) && READING.has(item.type);

export function GoDeeper({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.key}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Go deeper, open. Tap to fold it again.' : `Go deeper: ${count} more ${count === 1 ? 'card' : 'cards'}`}
      >
        <Text style={styles.keyText}>{open ? 'GO DEEPER ▴' : `GO DEEPER ▾ · ${count} more ${count === 1 ? 'card' : 'cards'}`}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

/** The step's content with its depth folded, or the content as it was. */
export function foldLong(node: ReactNode): ReactNode {
  if (!isValidElement(node) || node.type !== Fragment) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  const raw = el.props.children;
  const children: unknown[] = Array.isArray(raw) ? raw : [raw];
  const plan = planFold(children, isReadingCard);
  if (!plan) return node;
  const list = children[plan.list] as ReactNode[];
  const next = children.map((c, i) =>
    i === plan.list
      ? [
          ...list.slice(0, plan.keep),
          <GoDeeper key="go-deeper" count={plan.folded}>
            {list.slice(plan.keep)}
          </GoDeeper>,
        ]
      : c,
  );
  return createElement(Fragment, null, ...(next as ReactNode[]));
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  key: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#131316' },
  keyText: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1.2 },
  body: { gap: 10 },
});
