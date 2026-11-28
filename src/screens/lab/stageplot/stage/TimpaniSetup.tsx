/**
 * TimpaniSetup — which way round a set of timpani stands (round 3,
 * 2026-11-13, owner: "build the remaining held items too"). Used where the
 * timpani are added (the palette, before the package is chosen, so the
 * package's words fit the setup) and in the OBJECT details of a set on the
 * stage. The drawing on the screen, the printed symbol and the package words
 * all follow it. Each setup is its own drawing (spSymbols: SP_TIMPANI and
 * SP_TIMPANI_GERMAN); TURN still only turns.
 */
import { View } from 'react-native';
import { SP_TIMPANI_SETUP_WORDS } from '../../../../features/stageplot/spCatalog';
import type { SpTimpaniSetup } from '../../../../features/stageplot/spTypes';
import { Choice } from '../spForm';

export function TimpaniSetup({ value, onChange }: { value: SpTimpaniSetup; onChange: (s: SpTimpaniSetup) => void }) {
  return (
    <View>
      <Choice<SpTimpaniSetup>
        label="Setup"
        value={value}
        options={[
          { value: 'american', label: 'AMERICAN' },
          { value: 'german', label: 'GERMAN' },
        ]}
        onChange={onChange}
        hint={`${SP_TIMPANI_SETUP_WORDS[value]} Ask the timpanist which setup they play: the drums are set where the player's hands expect them.`}
      />
    </View>
  );
}
