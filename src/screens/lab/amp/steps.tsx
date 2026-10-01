/**
 * Amp module STEPS — how a module with several live rigs is laid out on the
 * Rack Unit (rack rebuild, owner 2026-09-30). One rack can pin ONE display, so
 * a module declares its reading order as steps: a RACK step (one rig or
 * diagram on the glass, its controls in the dock, its prose in the well) or a
 * READ step (a document page — calculators, cards, the final assessment).
 * The host screen (AmpModuleScreen) shows the step strip, keeps the module
 * component MOUNTED across steps (its state — sliders, scores, the final's
 * answers — survives), puts the OBJECTIVE at the top of the first step and
 * the checks / takeaway / CONTINUE at the end of the last.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { AmpRack, type AmpRackSpec } from './AmpRack';

export type AmpStep = { key: string; title: string } & (
  | { kind: 'rack'; rack: AmpRackSpec; well: ReactNode }
  | { kind: 'read'; body: ReactNode }
);

export type AmpStepHost = {
  step: number;
  setStep: (i: number) => void;
  /** The module reports its step titles (stable callback). */
  onSteps: (titles: string[]) => void;
  /** Rendered at the top of the FIRST step (the objective). */
  head?: ReactNode;
  /** Rendered at the end of the LAST step (checks, takeaway, navigation). */
  tail?: ReactNode;
  /** The host's document scroller for a READ step. */
  readWrap: (body: ReactNode) => ReactNode;
};

export const AmpStepHostContext = createContext<AmpStepHost | null>(null);

export function AmpModuleSteps({ steps }: { steps: AmpStep[] }) {
  const host = useContext(AmpStepHostContext);
  const onSteps = host?.onSteps;
  const titleKey = steps.map((s) => s.title).join('\u0001');
  useEffect(() => {
    onSteps?.(titleKey.split('\u0001'));
  }, [onSteps, titleKey]);
  const n = steps.length;
  const i = Math.min(Math.max(0, host?.step ?? 0), n - 1);
  const s = steps[i];
  const head = i === 0 ? host?.head : null;
  const tail = i === n - 1 ? host?.tail : null;
  // Every step but the last ends with the way forward — the strip at the top
  // is out of reach once the well has been scrolled.
  const next =
    i < n - 1 && host ? (
      <Pressable onPress={() => host.setStep(i + 1)} style={styles.nextStep} accessibilityRole="button" accessibilityLabel={`Next step: ${steps[i + 1].title}`}>
        <Text style={styles.nextStepText}>NEXT STEP · {steps[i + 1].title.toUpperCase()} ›</Text>
      </Pressable>
    ) : null;
  if (s.kind === 'rack') {
    return (
      <AmpRack key={s.key} spec={s.rack}>
        {head}
        {s.well}
        {next}
        {tail}
      </AmpRack>
    );
  }
  const body = (
    <>
      {head}
      {s.body}
      {next}
      {tail}
    </>
  );
  return host ? <>{host.readWrap(body)}</> : <ScrollView key={s.key}>{body}</ScrollView>;
}

const styles = StyleSheet.create({
  nextStep: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#131315',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nextStepText: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, textAlign: 'center' },
});
