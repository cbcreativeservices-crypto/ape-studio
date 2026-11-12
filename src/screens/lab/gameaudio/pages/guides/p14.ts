/**
 * Screen guide — page 14, "Adaptive music". Pure data (the guide test loads
 * it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G14: ScreenGuide = {
  intro: {
    learning: 'How game music follows play and stays in time: layers on one clock, and changes that wait for a musical boundary.',
    start: 'Open MUSIC and press START. Switch PULSE on and watch PENDING until the log says APPLIED. Then set CHANGE AT to NEXT PHRASE and press the two MOOD keys, one after the other.',
  },
  seeing: [
    'The music has no place in the picture, so a card in the text draws its three layers: CALM, PULSE and DRIVE, four bars each, on one clock.',
    'The card and the MUSIC tray name each layer’s state: HEARD, ZERO LEVEL, or WAITING to come in or go out. With SOUND off they say ON, NOT HEARD.',
    'MUSIC shows whether the music runs. PLAYING and VOICES count your scene’s sounds, not the music.',
  ],
  control: [
    'LEVEL sets how loud the lab plays, the music included. The slider controls it when the page opens.',
    'MUSIC holds START and STOP MUSIC, STINGER, a key for each layer, and MOOD CALM and MOOD ALERT. It also shows each layer’s state and the change that is waiting.',
    'CHANGE AT chooses the boundary a change waits for: NOW, NEXT BEAT, NEXT BAR or NEXT PHRASE. The log prints each choice as a SETTING.',
  ],
  changes: [
    'A layer change or a MOOD change is QUEUED, waits as PENDING, and is APPLIED exactly on the boundary. With SOUND off it still waits, unheard.',
    'A second request before the boundary replaces the first. The log marks the first one WITHDRAWN, and it does not play later.',
    'MOOD ALERT asks for PULSE and DRIVE together. MOOD CALM asks for the CALM layer alone.',
  ],
  teaches: [
    'Layers stay in time because they all start together and keep playing. One that is off is at zero level.',
    'A change asked for now can be scheduled for a later beat, bar or phrase, so the music keeps its rhythm.',
    'A transition rule has to say what happens when the game changes its mind before the boundary.',
    'Adaptive music uses music a composer wrote. It does not need AI.',
  ],
  tryThis: [
    'Set CHANGE AT to NEXT PHRASE. Press the MOOD key that is not marked, then the other one before the phrase ends. The log says WITHDRAWN, and the first change does not play.',
    'Switch DRIVE on with CHANGE AT on NOW, then again on NEXT BAR. Listen to where the new layer enters against the beat.',
    'Press STINGER and listen: it starts on the boundary you chose, over the music.',
  ],
};
