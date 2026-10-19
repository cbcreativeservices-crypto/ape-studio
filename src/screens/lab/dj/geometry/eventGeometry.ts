/**
 * eventGeometry — where the event rig's extra sockets sit (Stage 2b), in the
 * same face-on millimetres as geometry/boothGeometry's rear panels. Pure, so
 * test/djEvent.test.ts can check that each sits on its panel and clears the
 * Stage 1 sockets.
 *
 * THE MIXER'S REAR, LOWER BAND (drawn only with RearPanels `extras`): REC OUT
 * (an RCA pair) under CH 2's inputs, MIDI OUT (5-pin DIN) and the CLOCK
 * switch (which channel's beat counter sends clock) under CH 1, and a second
 * USB port beside the first (USB 1 → CH 1, USB 2 → CH 2 when their selector
 * is on USB — two computers can be connected at once).
 */
export const MIXER_REAR_EXTRA = {
  'rec.L': { x: 30, y: 90, d: 10 },
  'rec.R': { x: 52, y: 90, d: 10 },
  midiOut: { x: 84, y: 90, d: 14 },
  clock: { x: 108, y: 86, w: 24, h: 8 },
  usb2: { x: 196, y: 76 },
} as const;
