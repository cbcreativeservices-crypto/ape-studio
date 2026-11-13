/**
 * MailField — the two fields of the EMAIL section: the subject and the
 * message. Each one shows ALL of its text: the field is as tall as what is in
 * it (never shorter than `minHeight`), so the subject is not cut at the
 * field's edge and the message is not read through a scroll bar of its own
 * (review 2, visuals D).
 *
 * The lab's form kit has one text field with a fixed look; these two need a
 * height that follows the text, so they are their own small component with
 * the kit's colors and type. Every key is handed on: the EMAIL section keeps
 * the message outside this component, so a tab change loses nothing.
 *
 * HOW THE HEIGHT IS FOUND: from a hidden copy of the text (the "mirror"),
 * laid out with the field's own width, type and padding. NEVER from the
 * input's own `onContentSizeChange`: in a browser that reports the field's
 * scroll height, which already holds the height we set, so each answer made
 * the field taller and React stopped the screen ("Maximum update depth
 * exceeded", seen in the web preview 2026-11-12). The mirror's height depends
 * only on the text and the width, so it settles in one pass.
 */
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../../../../theme/tokens";

/** The form kit's field colors (spForm.tsx), so these two look like its fields. */
const FIELD_BG = "#0c0c0f";
const FIELD_BORDER = "#2c2c33";
const PAD_V = 11;

export function MailField(p: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  /** The least height of the typing area, in points. */
  minHeight: number;
  /** One paragraph: a line break typed into it is taken out (a subject). */
  oneParagraph?: boolean;
  hint?: string;
}) {
  const [boxH, setBoxH] = useState(0);
  const height = Math.max(p.minHeight, Math.ceil(boxH));
  // a last empty line has no height of its own in a Text: give it one
  const mirror =
    p.value.endsWith("\n") || !p.value ? `${p.value}\u200b` : p.value;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{p.label}</Text>
      <View>
        <Text
          style={[styles.input, styles.mirror]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            // only a real change is stored, so a layout pass cannot feed itself
            setBoxH((was) => (Math.abs(was - h) > 0.5 ? h : was));
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          {mirror}
        </Text>
        <TextInput
          style={[styles.input, { height }]}
          value={p.value}
          onChangeText={(t) =>
            p.onChange(p.oneParagraph ? t.replace(/\s*\n+\s*/g, " ") : t)
          }
          multiline
          scrollEnabled={false}
          submitBehavior={p.oneParagraph ? "blurAndSubmit" : "newline"}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType={p.oneParagraph ? "done" : "default"}
          accessibilityLabel={p.hint ? `${p.label}. ${p.hint}` : p.label}
        />
      </View>
      {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, width: "100%" },
  label: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSub,
  },
  input: {
    fontFamily: fonts.barlowRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    borderRadius: 9,
    backgroundColor: FIELD_BG,
    paddingHorizontal: 12,
    paddingVertical: PAD_V,
    textAlignVertical: "top",
  },
  /** The hidden copy that is measured: the field's own box, out of the flow. */
  mirror: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    pointerEvents: "none",
  },
});
