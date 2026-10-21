// artshot example: the Patchbay lab's patch pair (src/screens/lab/patchbay/
// art/PatchPairView.tsx), GLASS geometry. PAIR env = config:breakSide:top:bottom
// (default half:top:0:1 — the top-breaking bay's CLASH state). Schematic only:
// artshot's View stub has no flex gap, so the faceplate strip would overlap. The shim stubs
// ExpandableFigure and requestAnimationFrame BEFORE the drawing loads.
(globalThis as any).requestAnimationFrame = (f: any) => setTimeout(() => f(Date.now()), 1);
(globalThis as any).cancelAnimationFrame = (h: any) => clearTimeout(h);
const efPath = (require as any).resolve('../../../src/screens/lab/kit/ExpandableFigure.tsx');
(require as any).cache[efPath] = { id: efPath, filename: efPath, loaded: true, exports: { ExpandableFigure: ({ render, aspect }: any) => render(340, 340 / aspect) } } as any;
const RN = require('react-native');
RN.AccessibilityInfo.isReduceMotionEnabled = () => Promise.resolve(true);
const { PatchPairDrawing, PATCH_PAIR_GLASS_ASPECT_BARE } = require('../../../src/screens/lab/patchbay/art/PatchPairView');

const W = 340;
const [config, breakSide, t, b] = (process.env.PAIR || 'half:top:0:1').split(':');
export const size = { width: W, height: Math.ceil(W / PATCH_PAIR_GLASS_ASPECT_BARE), scale: 3 };

export default function Pair() {
  return (
    <PatchPairDrawing
      glass
      hideFaceplate
      w={W}
      state={{ config, breakSide, topPlugged: t === '1', bottomPlugged: b === '1' }}
      sourceLabel="TAPE OUT 1"
      destLabel="CONSOLE TAPE RTN 1"
      topPatchLabel="YOUR CABLE"
      bottomPatchLabel="ALT SOURCE"
      reduceMotion
    />
  );
}
