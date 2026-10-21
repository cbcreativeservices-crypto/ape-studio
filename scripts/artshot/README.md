# artshot — lab art to PNG in plain Node (dev-only, never imported by the app)
`node scripts/artshot/render.mjs <entry.tsx> <out.png> [width height scale] [--bg=#101216|transparent] [--verbose]`
- `entry.tsx` `export default`s a component ({width, height, scale} props) returning Skia elements in points; optional `export const size = {width, height, scale}`. PNG = (width×scale)×(height×scale) px.
- Examples: `examples/djSpeaker.tsx` (SpeakerRear + SpeakerPlate), `examples/channelStrip.tsx` (react-native-svg ChannelStrip), `examples/stagePlanDi.tsx` (Miking StagePlan, DI behind the combo).
- DJ scene art needs `<SceneFontsProvider s={ptPerMm}>`; SceneText hides text under 9 pt, so use s ≥ 2.25 to see the 4 mm legends.
- `hooks.mjs`: Babel (TS + JSX) for .ts/.tsx, extensionless imports, asset requires → file path, stubs in `stubs/`.
- Stubs: skia (headless + Skia/vec/loadData/useFont/Canvas), reanimated (animations land at their target), react-native (View/Text emulated in Skia: absolute layout only, no flexbox/wrapping), react-native-svg (redrawn in Skia; gradients/clip/mask ignored), async-storage, generic no-op for other native packages (reported on stdout).
- Before/after: render the same entry on each tree state (e.g. a second worktree) and compare the PNGs. Exit code 1 = a render error was logged.
