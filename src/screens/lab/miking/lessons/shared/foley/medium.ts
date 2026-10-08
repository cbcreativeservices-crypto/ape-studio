/**
 * THE SENSING-MEDIUM CARD (F04; later F10 / F16) — three different paths a
 * sound can be picked up from, each its own labelled track (F04 L28: "Compare
 * tracks with their sensing medium named"). Pure data; the drawing is
 * MediumArt.tsx. Built once by group 1 (lab6-g1).
 *
 *   air        an ordinary airborne mic ABOVE the water: the surface sounds —
 *              the splash, the pour, the drips, the room;
 *   water      a HYDROPHONE in the water: pressure in the water — internal
 *              water sounds; only a model made and rated for immersion,
 *              never an ordinary mic lowered into a basin (exact safety);
 *   structure  a CONTACT transducer on a DRY container wall: the vibration
 *              in the structure itself.
 * The hydrophone and the contact sensor are CARDS only in Lab 6 part 1
 * (O-7): never placed in the scene. Research: foley_impacts_liquids/
 * SOURCES.md (ASE-ELEM, S-SM4-UG).
 */
export type MediumId = 'air' | 'water' | 'structure';
export type Medium = { id: MediumId; title: string; sensor: string; hears: string; care: string; typeId: string };

export const MEDIA: readonly Medium[] = [
  { id: 'air', title: 'AIR', sensor: 'An airborne mic above the basin, outside the splash', hears: 'The surface: the entry, the splash, the pour, the drips — and the room.', care: 'Outside the splash envelope; a windshield is for wind and handling, not water.', typeId: 'scSupercard' },
  { id: 'water', title: 'WATER', sensor: 'A hydrophone in the water', hears: 'Pressure in the water itself: bubbles and the sound inside the water.', care: 'Only a hydrophone made and rated for immersion — never an ordinary mic lowered into a basin.', typeId: 'hydrophone' },
  { id: 'structure', title: 'STRUCTURE', sensor: 'A contact sensor on a dry container wall', hears: 'Vibration in the container or the board itself — a structure-borne path.', care: 'On a dry surface, its cable clear of the water.', typeId: 'contactSensor' },
];
