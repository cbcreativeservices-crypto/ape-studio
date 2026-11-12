/**
 * gaTerms — the glossary words the Game Audio lab uses, and what each means
 * on a lab screen. Pure data.
 *
 * Owner 2026-11-12: the lab's vocabulary must MATCH the glossary's Game Audio
 * terms ("matching glossary learning terms"), and only key concepts and
 * common terms are needed ("to get user started"). So:
 *
 *   - every KEY below is a glossary entry's exact name (checked against the
 *     live glossary's base tables on 2026-11-12; test/gameAudioTerms.test.ts
 *     pins the list, and a page can only show a term that is here);
 *   - every meaning agrees with that entry's plain English — shorter, and
 *     pointed at what the learner is doing in THIS lab;
 *   - real tool names appear where the glossary teaches them (owner
 *     2026-11-09: brand names are fine as engineers use them).
 *
 * WATCH: in this glossary "Localization" is hearing where a sound comes from,
 * NOT translating a game. Language versions are taught with "Dialogue
 * systems" and the subtitle terms, never under that word.
 */
import type { Term } from './bits';

export const GA_TERMS = {
  'Game audio': 'The sound side of a video game: effects, voices, music and background. Unlike a film, it changes as you play and reacts to what you do.',
  'Interactive audio': 'Sound that reacts to what you do. Nothing plays on a fixed timeline; it changes live with your actions and the situation.',
  'Audio event (game)': 'The game does not ask for a sound file. It calls out a name, such as Play_Door, and the audio side decides what that name plays. The sound designer can change what is behind the name without a programmer.',
  'Event-driven audio': 'Sound that plays because something happened, not on a schedule. The door opens, and the door sound starts at that moment.',
  'Audio parameter': 'A control for sound that the game turns by itself. Here, the generator’s SPEED is a parameter: as it rises, the hum climbs.',
  'Playback instance': 'One single time a sound is actually playing. Two generators running from the same event are two instances, and each can be changed on its own.',
  'Game engine': 'The software a game is built in. It runs the graphics, the physics and the sound together.',
  'Controller speaker': 'A small speaker inside some game controllers. The game can send it its own short cues, apart from the main mix.',
  'Platform certification': 'The checks a platform owner runs before a game can be sold on its console. Audio has its share of the rules, and each platform has its own list.',
  'Audio listener': 'A virtual pair of ears placed in the scene. The game measures every sound against it to decide direction and loudness.',
  'Listener position': 'Where those virtual ears are. It is often the player, but in an overhead view it may be the camera.',
  'Listener orientation': 'Which way the listener faces. Turn, and a sound that was in front is now at your side.',
  'Split-screen audio': 'Several players sharing one screen and one set of speakers. Each has a listener, so the engine takes care not to play one event twice.',
  'Ambient loop': 'A background sound edited so it can repeat with no gap, like wind or room tone. A short recording then fills a long scene.',
  'Gameplay sound effect': 'A sound that plays because of something you do: a step, a hit, opening a door.',
  'Interface sound': 'A short sound for a menu or a message, such as a confirm click. It tells you your action worked.',
  'NPC bark': 'A short line a character says on its own during play, picked from a pool so the same line does not come back too soon.',
  'Diegetic Sound': 'Sound that belongs to the world of the scene, so the characters could hear it too: the generator, the fountain, footsteps.',
  'Non-Diegetic Sound': 'Sound that exists only for the player, not the world: the score, a menu click.',
  'Foley': 'Everyday sounds performed to match movement: footsteps, clothing, handling an object.',
  'Audio asset': 'One piece of sound in a project: one effect, one music layer, one recorded line. Each is a file you can name, store and reuse.',
  'Audio Middleware': 'A tool that sits between the sounds and the game. Sound designers set up how sounds react there, and the game simply asks for them by name.',
  'Sound bank': 'A bundle of sounds and the rules for playing them, packed into one file the game loads when it needs that set.',
  'Implementation': 'Putting sounds into the game and making them play at the right time. It is how audio reacts to what the player does.',
  'Audio implementer': 'The person who connects each sound to the actions that should make it play.',
  'Technical sound designer': 'A sound designer who also works inside the game engine, setting the rules for when and how each sound plays.',
  'Audio pipeline': 'The path a sound takes from an idea to the running game, step by step.',
  'Audio Emitter': 'A spot in the game world that a sound comes from. The game compares it with the listener to pan the sound and fade it with distance.',
  'One-shot asset': 'A clip that plays once through each time it is fired, like a door. It ends by itself.',
  'Audio trigger': 'The thing that makes a sound play. A foot touching the ground is a trigger; so is a door opening.',
  'Trigger (game engine)': 'A game rule that fires when something happens. In audio it often starts or stops a sound.',
  'Audio state': 'A named mode for the whole game’s sound, such as calm or alert. When the state changes, many sounds change together.',
  'State group': 'A list of game-wide situations of which only one is active, such as Exploring, Combat or Paused.',
  'Switch group': 'A list of options, such as wood, stone or gravel, where EACH game object has its own current choice. One footstep event can then sound different for every character.',
  'Switch container': 'A holder for several versions of a sound that plays the one matching the current choice, such as the surface under a foot.',
  'Real-Time Parameter Control (RTPC)': 'A link from a game value to a sound setting. As the value changes, the sound changes right away, with nothing restarted.',
  'Game Syncs': 'The ways a game tells its sound engine what is happening: choices from a list (switches), game-wide modes (states) and numbers that keep changing (parameters).',
  'Sound variation': 'Another version of the same sound, a little different, so repeats do not sound identical.',
  'Random container': 'A holder for several versions of a sound that picks one at random each time the game asks.',
  'Sequence container': 'A holder that plays its sounds one after another, in an order you set.',
  'Layer container': 'A holder that plays several sounds at the same time, stacked into one bigger sound.',
  'Blend container': 'A holder that plays several sounds together and mixes between them as a game value changes.',
  'Avoid-repeat setting': 'A setting that stops the same version playing twice in a row when several exist.',
  'Machine-gun effect': 'What you hear when the exact same clip repeats: the ear notices immediately, and it sounds like a machine, not a person.',
  'Pitch randomization': 'Each play gets a slightly different pitch. In most engines this changes the playback speed, so the length changes with it.',
  'Ambience zone': 'An area with its own background sound. Cross from the courtyard to the workshop and the background changes to fit.',
  'Loop Point': 'The marks where the repeating part of a sound starts and ends.',
  'Crossfade': 'One sound fades down as the next fades up, overlapping, so the change has no click or hole.',
  'Seamless music loop': 'Music that returns from its end to its start with no gap or click, so you cannot hear the join.',
  'Room Tone': 'The quiet background sound a place has even when nothing happens in it.',
  'Volume (game engine)': 'An invisible box in a level. Entering it can change the reverb or the background sound.',
  'Attenuation curve': 'A graph that sets how a sound changes as it gets farther from the listener. Mostly, how fast it gets quieter.',
  'Minimum distance': 'The zone close to a sound where it stays at full level. Only beyond it does the sound start to fade.',
  'Maximum distance': 'The farthest point where the sound still changes. Past it the sound is silent or stays at one low level.',
  'Positional audio': 'Sound that seems to come from a real spot around you: louder in the nearer ear, quieter when far.',
  'Cone attenuation': 'A source can aim like a flashlight. In its beam you hear full level; off to the side it fades.',
  'Obstruction': 'Something blocks the straight path to a sound while you are in the same room. The direct sound is muffled; its echoes still arrive.',
  'Audio Occlusion': 'A sound behind a wall is turned down and made duller, as it would be in life. The game checks whether something is in the way.',
  'Reverb zone': 'An area where sounds pick up the reverb of that space, such as this workshop room.',
  'Acoustic portal': 'An opening, like this door, that lets sound pass from one room into another.',
  'Channel-based audio': 'Every sound is mixed into a fixed set of channels, and each channel goes to one speaker: left, right and so on. It assumes a known speaker layout.',
  'Object-Based Audio': 'Each sound is kept with where it should be, and a renderer maps it to whatever speakers or headphones are present.',
  'Binaural rendering': 'Headphone sound made to seem all around you, by filtering each sound for the left and right ear the way a head would.',
  'HRTF': 'How your head and outer ears change a sound before it reaches the eardrum, by direction. It is the filter behind 3D headphone sound.',
  'Ambisonics': 'A way to store sound arriving from every direction as one scene, which can then be played on any speaker setup or on headphones.',
  'Head tracking': 'Sensing which way your head is turned so sounds stay put in the room as you move.',
  'Downmix': 'Folding a mix down to fewer channels, for example stereo to mono.',
  'Mono compatibility': 'Whether a stereo mix still sounds right when both channels are combined into one, as on many phones and speakers.',
  'Adaptive music': 'Game music that changes as you play, following the action.',
  'Vertical layering': 'Music written as stacked parts that play together in time. The game switches parts on or off to change intensity without stopping the music.',
  'Horizontal resequencing': 'Music changed by choosing which section plays next, so the same piece can be reordered to fit the action.',
  'Music segment': 'One chunk of music the game can play, with a start and an end, such as an intro or a looping section.',
  'Music state': 'A label for what is happening, such as exploring or fighting. The music system watches it and plays music that fits.',
  'Music transition rule': 'The instruction for how music moves from one part to the next, such as waiting for the end of a bar.',
  'Bar-aligned transition': 'A change in the music that lands exactly at the start of a bar, so it stays in time.',
  'Musical stinger': 'A very short burst of music that marks a moment.',
  'Dialogue systems': 'The systems that run a game’s spoken lines: which line plays, and when.',
  'Playback priority': 'A number that says how important a sound is. When there is no room for everything, the least important goes first.',
  'Closed Captioning': 'On-screen text of what is said and heard, which the player can switch on or off.',
  'Subtitles for the deaf and hard of hearing': 'Subtitles that also name who is speaking and describe the sounds you would otherwise hear.',
  'Audio Bus (Game Audio)': 'A group channel many sounds feed into, such as all the effects. One control then changes the whole group.',
  'Ducking': 'One sound gets quieter while another plays, and comes back up afterwards. Here, music and background dip under speech.',
  'Snapshot (Game Mix State)': 'A saved mix setup the game can recall, such as a quieter outside when you go indoors.',
  'Dynamic mixing': 'A game mix that changes as you play, so the important sounds stay clear.',
  'Headroom': 'The space left above the usual level, so sudden loud moments come through cleanly instead of distorting.',
  'Playback limit': 'How many copies of a sound, or how many sounds in all, may play at the same time, and what happens when the limit is reached.',
  'Virtual voice': 'A sound the engine has stopped processing but has not forgotten. It costs almost nothing, and it is brought back when it matters again.',
  'Voice Stealing': 'When every voice is busy and a new sound arrives, one playing sound is stopped to make room.',
  'Audio memory budget': 'The share of memory audio is allowed. It decides how many sounds can be loaded at the same time.',
  'Audio CPU budget': 'The share of processing time audio is allowed each frame. Every voice and effect uses some of it.',
  'Audio level of detail (audio LOD)': 'Distant or unimportant sounds get simpler, cheaper versions, or are dropped, so the important ones can be afforded.',
  'Prefetch streaming': 'Keeping the first fraction of a second of a long file in memory, so it starts immediately while the rest is read.',
  'In-game voice chat': 'Players talking to each other live while the game runs. The game usually dips its own sound so speech stays clear.',
  'Proximity voice chat': 'Voice chat where you only hear players near you, from where their characters are.',
  'Audio profiling': 'Watching the audio engine while the game runs: every sound that started, how many played at the same time, what they cost.',
  'Quality assurance': 'Testing that everything works. In audio: that sounds play correctly, cleanly and at the right time.',
  Wwise: 'A widely used game audio tool (middleware). Sound designers build events, mixes and music rules in it, then connect it to the game engine.',
  FMOD: 'The other widely used game audio tool (middleware), with the same job: events, live mixing and music that changes with play.',
  'Unity (game engine)': 'A popular game engine. It plays and positions sound itself, and can also host Wwise or FMOD.',
  'Unreal Engine': 'A powerful game engine with its own sound and music tools, which can also host Wwise or FMOD.',
  MetaSounds: 'Unreal Engine’s tool for building sounds from connected nodes, made and processed live inside the game.',
  'Procedural Audio': 'Sound made live by rules and code rather than a fixed recording, so it can follow the game smoothly.',
  'Steam Audio': 'A free toolkit for 3D game sound: headphone rendering, muffling through walls, paths around corners and reflections.',
} as const;

export type GaTermName = keyof typeof GA_TERMS;

/** The Terms list for a page: names only; the meanings come from here. */
export const gaTerms = (...names: GaTermName[]): Term[] => names.map((term) => ({ term, def: GA_TERMS[term] }));
