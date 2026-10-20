// artshot example: the Patchbay lab's jack cutaway (src/screens/lab/patchbay/
// art/JackCutaway.tsx) at several plug insertions, stacked top to bottom
// (INS env, comma-separated; default 0,0.6,0.87,1). The shim below stubs
// ExpandableFigure and requestAnimationFrame BEFORE the drawing loads.
(globalThis as any).requestAnimationFrame = (f: any) => setTimeout(() => f(Date.now()), 1);
(globalThis as any).cancelAnimationFrame = (h: any) => clearTimeout(h);
const efPath = (require as any).resolve('../../../src/screens/lab/kit/ExpandableFigure.tsx');
(require as any).cache[efPath] = { id: efPath, filename: efPath, loaded: true, exports: { ExpandableFigure: ({ render, aspect }: any) => render(340, 340 / aspect) } } as any;
const RN = require('react-native');
RN.AccessibilityInfo.isReduceMotionEnabled = () => Promise.resolve(true);
const { JackCutawayDrawing, JACK_ASPECT } = require('../../../src/screens/lab/patchbay/art/JackCutaway');
const { View } = RN;

const W = 340;
const INS: number[] = (process.env.INS || '0,0.6,0.87,1').split(',').map(Number);
const H = W / JACK_ASPECT;
export const size = { width: W, height: Math.ceil(H * INS.length), scale: 3 };

export default function Jack() {
  return (
    <View style={{ width: W, height: H * INS.length }}>
      {INS.map((ins, i) => (
        <View key={i} style={{ position: 'absolute', left: 0, top: i * H, width: W, height: H }}>
          <JackCutawayDrawing insertion={ins} reduceMotion showConductors={!!process.env.TRS} w={W} h={H} />
        </View>
      ))}
    </View>
  );
}
