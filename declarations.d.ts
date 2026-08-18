// Lets TypeScript treat `import X from './foo.svg'` as a react-native-svg
// component (paired with react-native-svg-transformer in metro.config.js).
// Added 2026-08-17 for the Measurement Tools card strips.
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
