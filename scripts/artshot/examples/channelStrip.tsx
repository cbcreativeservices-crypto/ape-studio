// artshot example: the Sound Systems lab's ChannelStrip teaching diagram
// (src/screens/lab/soundsystems/art/diagrams.tsx). It is react-native-svg inside
// an RN View; artshot's svg/react-native stubs redraw it in Skia. The diagram is
// 354 × 246 units, drawn here at the glass width of a 375-pt phone (341 pt).
import { ChannelStrip, STRIP_H } from '../../../src/screens/lab/soundsystems/art/diagrams';

export const size = { width: 341, height: Math.ceil((341 * STRIP_H) / 354), scale: 3 };

export default function Strip() {
  return <ChannelStrip selected="sends" onTap={() => {}} />;
}
