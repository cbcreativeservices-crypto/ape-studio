/**
 * Module 1 — WHAT A ROOM MODEL CAN TELL YOU. A short reading module
 * (document layout: prose only, no live display): the three kinds of number
 * in this lab, what a model can and cannot know, and the hearing-safety rule
 * for monitoring level. Ends on the shared in-flow NEXT.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabNextButton } from '../../kit/LabNavBar';
import { Body, Caption, Card, SAFETY_LEVEL_NOTE, SectionTitle, TierTag } from '../bits';
import { accountDesignsLine, type RoomLabCtx } from '../labCtx';

export function IntroModule({ ctx }: { ctx: RoomLabCtx }) {
  return (
    <View style={styles.doc}>
      <Body>
        This lab expands the Wave Physics lab's room work into a planning tool. You build a model of your actual room, place the speakers and the listening position, explore how moving them may change what you hear, then add or adjust treatment. The lab offers guided suggestions — and labels every result for what it is.
      </Body>
      <Card>
        <SectionTitle title="THREE KINDS OF NUMBER" />
        <TierTag tier="CALCULATED" />
        <Caption>Dimensions, coordinates, distances, listening angle, and the idealized room-mode frequencies of a rectangular room. Exact arithmetic — the same equations as the app's calculators.</Caption>
        <TierTag tier="ESTIMATED" />
        <Caption>Where reflections land and how strong they are, how the surfaces absorb, how long the room rings. A simplified model with teaching-table coefficients. It shows where problems are LIKELY.</Caption>
        <TierTag tier="MEASURED" />
        <Caption>A number you took in the real room — a decay time, a resonance you found with a sweep. Only this tier describes what the room actually does. The REVIEW module compares it with the model.</Caption>
      </Card>
      <Body>
        A room model can identify likely placement problems: a seat on a pressure peak of the first length mode, a speaker whose front-wall bounce cancels in the bass, left and right sides that do not match. It cannot know a real room's exact response — the wall that flexes, the wardrobe full of clothes, the door that leaks — without measurements. Speaker symmetry, equal listening distances and a position on the room's centre line are useful starting points; the best result still depends on the room and the monitoring system, and on listening.
      </Body>
      <Card>
        <SectionTitle title="HEARING FIRST" />
        <Caption>{SAFETY_LEVEL_NOTE}</Caption>
      </Card>
      <Card>
        <SectionTitle title="HOW THE LAB RUNS" />
        <Caption>CREATE THE ROOM → MONITORING SETUP → EXPLORE PLACEMENT → ADD TREATMENT → REVIEW. Each live module is a rack: the plan on the display, readouts on its bezel, controls docked below, and FULL SCREEN when you want the drawing big. Drag on the plan, or ride the lane.</Caption>
        <Text style={styles.note}>{ctx.guest ? (ctx.preview ? 'This lab is part of membership: design freely, but designs made in a preview are not saved.' : ctx.account ? accountDesignsLine(ctx.account) : 'You are not signed in: design freely. Nothing is saved yet — sign in before you close the app and the designs you SAVE are kept on this device.') :'Designs can be saved on this device and compared later.'}</Text>
      </Card>
      <LabNextButton />
    </View>
  );
}

const styles = StyleSheet.create({
  doc: { gap: 12 },
  note: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
});
