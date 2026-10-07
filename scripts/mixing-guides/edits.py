"""The light copy edit of the owner's 50 mixing guides (house rules, owner
ruling 2026-10-04: starting points, not rules; no brand or model names, no
named engineers, publications, standards bodies or tours used as evidence —
the research stays in the owner's documents and docs/labs/mixing).

EDITS[guide id] = [(exact text as written in the guide, replacement), ...]
Every left-hand side must be found in that guide (convert.py checks). An
empty replacement removes the words. Facts and numbers are kept; only the
name that carried them changes (a mic model becomes its type, a compressor
model its circuit, a streaming service "most streaming services", a health
body "common hearing-safety guidance").

EXPECTS[guide id] = the "what the audience expects" line shown at the top of
the guide: one or two consecutive sentences of the guide's own section 1
(after the edits). A line that starts with '=' is assembled from the guide's
own words where no single sentence says it (listed in the conversion notes).
"""

# Shared rewrites, applied after the per-guide edits (regex, replacement).
GLOBAL = [
    # Streaming normalisation, the forms that recur.
    (r"Spotify(?:’s)? (?:and|/) YouTube normalize to (?:about )?−14(?: LUFS)?(?:,)? (?:and )?Apple Music to −16", "most streaming services normalize to about −14 LUFS, some to −16"),
    (r"per Spotify(?:’s)? guidance", "a common streaming recommendation"),
    (r"Spotify(?:’s)? guidance", "common streaming guidance"),
    (r"\bUnder NIOSH guidance,? ", "By common hearing-safety guidance, "),
    (r"\bNIOSH allows only about 15 minutes at 100 dBA", "common hearing-safety guidance allows only about 15 minutes at 100 dBA"),
    (r"the WHO safe-listening standard", "the widely used safe-listening limit"),
    (r"WHO safe-listening standard", "widely used safe-listening limit"),
    # Compressor and processor models → their circuit or type.
    (r"FET/1176-style", "FET-style"),
    (r"opto/LA-2A-style", "opto-style"),
    (r"opto/LA-2A style", "opto-style"),
    (r"\b1176-style FET\b", "FET-style"),
    (r"\b1176-style\b", "FET-style"),
    (r"\bLA-2A-style\b", "opto-style"),
    (r"\bSSL-style\b", "VCA bus-style"),
    (r"\bFairchild-style\b", "vari-mu tube-style"),
    (r"\bMelodyne-style\b", "graphical, note-by-note"),
    # Keyboards by brand → the instrument.
    (r"\bRhodes/Wurlitzer\b", "electric pianos (tine and reed)"),
    (r"\bHammond organ with Leslie\b", "tonewheel organ with rotating speaker"),
    (r"\bHammond organ\b", "tonewheel organ"),
    (r"\bHammond B3\b", "tonewheel organ"),
    (r"\bHammond with Leslie\b", "tonewheel organ with rotating speaker"),
    (r"\bRhodes\b", "electric piano"),
    (r"\bWurlitzer\b", "reed electric piano"),
    (r"\bLeslie\b", "rotating speaker"),
    (r"(?<!Fred )\bHammond\b", "tonewheel organ"),  # not the gospel artist Fred Hammond
    (r"\bB3\b", "organ"),
    # Drum machines: keep the numbers the styles are named by, drop the maker.
    (r"\bRoland TR-(\d+)", r"\1"),
    (r"\bTR-(\d+)", r"\1"),
    (r"\bTB-303\b", "303"),
    # DJ media players.
    (r"\bCDJs\b", "DJ media players"),
]

EDITS = {
    "pop": [
        ("Top mixers such as Serban Ghenea put the song’s emotional impact first and technique second.", "Top pop mixers put the song’s emotional impact first and technique second."),
        ("(Ableton/Pro Tools rigs on redundant computers)", "(playback rigs on redundant computers)"),
        ("Fast-retune Auto-Tune is a stylistic choice", "Fast-retune, audible pitch correction is a stylistic choice"),
        (" (U 87/U 47 types, Sony C-800G)", ""),
        (" (Shure SM58/Beta 58, KSM9, Telefunken M80/M81, DPA d:facto)", ""),
        ("Engineers have reported quiet soundchecks in the low 90s rising past 110 dB with a packed, singing house.", "A soundcheck in the low 90s can rise past 110 dB with a packed, singing house."),
        ("The WHO Global Standard for safe listening venues (2022) sets a 100 dBA LAeq-15 min limit, and local rules differ", "A widely used safe-listening limit for venues is 100 dBA LAeq-15 min, and local rules differ"),
        ("(a 2024 chart analysis found pop ranging from about −10.7 to −6 LUFS)", "(chart pop ranges from about −10.7 to −6 LUFS)"),
        ("Spotify and YouTube normalize to about −14 LUFS and Apple Music to −16, so", "Most streaming services normalize to about −14 LUFS, some to −16, so"),
        ("(WHO cap 100 dBA)", "(common safe-listening cap 100 dBA)"),
        ("Spotify/YouTube normalize to −14, Apple Music to −16", "streaming normalizes to about −14 (some services −16)"),
        ("Catches transients; 1176-style", "Catches transients; fast FET-style"),
        ("LA-2A-style leveling", "Opto-style leveling"),
    ],
    "hip-hop-rap": [
        ("Synths and keys: pads, bells, plucks, Rhodes, strings.", "Synths and keys: pads, bells, plucks, electric piano, strings."),
        ("(Ableton/Pro Tools stems)", "(stems)"),
        ("Cole’s Forest Hills Drive run blended DJ stems with drums, two keyboard players, guitar and backing vocals across 36 inputs.", "A big arena run can blend DJ stems with drums, two keyboard players, guitar and backing vocals across three dozen inputs."),
        ("a large-diaphragm condenser such as the Sony C800G through a Neve 1073-style pre and an LA-2A or CL-1B is a common chain; live, dynamic handhelds (SM58, Beta 58A, e935-type) survive", "a bright large-diaphragm condenser through a transformer-coupled preamp and an optical compressor is a common chain; live, dynamic handhelds survive"),
        ("The AAO-HNS recommends staying below 100 dBA LAeq-15 min, with peaks under 140 dB LAmax;", "Common hearing-safety advice is to stay below 100 dBA LAeq-15 min, with peaks under 140 dB LAmax;"),
        ("Spotify normalizes to about −14 LUFS, so loud masters", "Most streaming services normalize to about −14 LUFS, so loud masters"),
        ("Commercial rap vocals are often processed through many stages; Cheese Goldberg counted 39 compression stages on a YoungBoy lead vocal.", "Commercial rap vocals are often processed through many stages — sometimes dozens of compressors on one lead vocal."),
        ("Auto-Tune (effect)", "Hard-tune pitch correction (effect)"),
    ],
    "rock": [
        ("(SM58, e935, MD431 class)", ""),
        ("Spotify and most services normalize to about −14 LUFS", "Most streaming services normalize to about −14 LUFS"),
    ],
    "contemporary-rnb": [
        ("Engineers like Manny Marroquin and Serban Ghenea describe mixing from emotion first and maximizing the one special thing in each song.", "Top R&B mixers work from emotion first and make the most of the one special thing in each song."),
        ("(TR-808, MPC-style samples,", "(808s, pad-sampler drums,"),
        ("Live, ride the vocal constantly; Mix magazine’s coverage of soul and hip-hop FOH engineers shows them “performing” the mix alongside the band.", "Live, ride the vocal constantly; good soul and hip-hop FOH engineers “perform” the mix alongside the band."),
        ("transparent Melodyne-style tuning for most artists, audible Auto-Tune effect where it is part of the artist’s sound", "transparent, note-by-note tuning for most artists, an audible hard-tune effect where it is part of the artist’s sound"),
        ("Mic choice: studio large-diaphragm condensers (U87 or tube U47 style); live, dynamic or supercardioid condenser handheld capsules (e.g. a Sennheiser 9235-class capsule, as on Drake’s tour, or Shure KSM9/Beta 58A).", "Mic choice: studio large-diaphragm condensers (solid-state or tube); live, dynamic or supercardioid condenser handheld capsules."),
        ("Live chains often still use LA-2A- or 1176-style compression for a natural sound.", "Live chains often still use optical or FET-style compression for a natural sound."),
        ("Spotify and YouTube normalize to about −14 and Apple to −16, so", "Most streaming services normalize to about −14, some to −16, so"),
        ("(keep under 100 per WHO)", "(keep the average under 100)"),
        ("streaming normalizes to about −14 (Apple −16)", "streaming normalizes to about −14 (some services −16)"),
        ("Lead vocal (stage 1, opto/LA-2A style)", "Lead vocal (stage 1, opto-style)"),
    ],
    "edm-festival-electronic": [
        ("(digitally via AES/SPDIF where possible)", "(digitally where possible)"),
        ("Common caps: WHO safe-listening standard 100 dBA LAeq-15 min; the Netherlands covenant 103 dBA LAeq-15 min (with health bodies pushing for 100 or lower); Sweden 100 dBA over 60 min with 115 dBA peak.", "Common caps: a widely used safe-listening limit of 100 dBA LAeq-15 min; 103 dBA LAeq-15 min in some countries (with health bodies pushing for 100 or lower); 100 dBA over 60 min with a 115 dBA peak in others."),
        ("Spotify recommends below −1 dBTP, or below −2 dBTP for masters louder than −14 LUFS.", "A common streaming recommendation is below −1 dBTP, or below −2 dBTP for masters louder than −14 LUFS."),
        ("Solo DJ/producer or duo on CDJs/laptop", "Solo DJ/producer or duo on DJ media players/laptop"),
        ("(e.g. 100 dBA WHO, 103 dBA Dutch covenant)", "(e.g. 100 or 103 dBA)"),
        ("3:1–4:1, then 1176-style fast stage", "3:1–4:1, then a fast FET-style stage"),
        ("Use digital output (AES) from the DJ mixer", "Use the DJ mixer’s digital output"),
    ],
    "country": [
        ("a clean Telecaster chicken-pick", "a clean, twangy chicken-picked electric"),
        ("Electric guitars: Telecaster twang (bridge pickup, compression, B-bender)", "Electric guitars: single-coil twang (bridge pickup, compression, B-bender)"),
        ("Dobro (resonator) on traditional tunes.", "Resonator guitar on traditional tunes."),
        ("Solos rotate among steel, Tele and fiddle", "Solos rotate among steel, electric guitar and fiddle"),
        ("(steel, Tele or fiddle —", "(steel, electric guitar or fiddle —"),
        ("(SM58/Beta 58 class) or handheld condensers such as the KSM11 and KSM9", "or handheld condensers"),
        ("; Eric Church’s FOH engineer reports about 105 dB peaking 108, chasing the level where the mix locks.", "; some FOH engineers run about 105 dB peaking 108, chasing the level where the mix locks."),
        ("push steel, Tele or fiddle up", "push steel, electric guitar or fiddle up"),
        ("2 electric guitars (often Telecaster)", "2 electric guitars (often bright single-coil)"),
        ("Mic off the cone center; ribbon or SM57 smooths highs", "Mic off the cone center; a ribbon or a classic dynamic smooths highs"),
        ("Catches belts; 1176-style is a Nashville default", "Catches belts; fast FET-style is a Nashville default"),
        ("(used live on Jason Aldean)", "(common live)"),
        ("(H3000-style, common live)", "(harmonizer-style, common live)"),
        ("Lead vocal, Telecaster", "Lead vocal, twangy electric guitar"),
        ("Telecaster", "Twangy electric guitar"),
    ],
    "latin-pop": [
        ("Live, artists use premium handheld condensers (Juanes used Shure KSM9s);", "Live, artists use premium handheld condensers;"),
        ("Audience singing is extremely loud: a 1999 Ricky Martin arena show registered 113 dBA at the console, and one Alejandro Sanz tour reported a 112 dB SPL average at FOH.", "Audience singing is extremely loud: arena shows have measured around 112–113 dBA at the console."),
        ("The WHO safe-listening standard caps average levels at 100 dBA LAeq-15; NIOSH allows only about 15 minutes at 100 dBA.", "A widely used safe-listening limit caps average levels at 100 dBA LAeq-15, and common hearing-safety guidance allows only about 15 minutes at 100 dBA."),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
        ("Like Josh Gudwin, build on the producer’s printed sounds rather than rebuilding them.", "Build on the producer’s printed sounds rather than rebuilding them."),
        ("Keep processing simple and onboard (Steve May’s approach for Ricky Martin) so", "Keep processing simple and onboard so"),
        ("Glue remote overdubs with one shared short room, as Carlos Bedoya does on Ricardo Arjona’s “Viaje”.", "Glue remote overdubs with one shared short room."),
        ("Mixer Maria Elisa Ayerbe stresses automated ear candy that grabs the listener from the first note.", "Automated ear candy grabs the listener from the first note."),
        ("Shakira’s FOH engineer Bill Sheppell used EMT 140, Lexicon 224 and AMS RMX16 emulations live while keeping her vocal out front in every style.", "Live, emulations of classic plates, digital halls and ambience units can recreate the record while the vocal stays out front in every style."),
    ],
    "reggaeton": [
        ("Pitch correction (Auto-Tune or Melodyne) is standard", "Pitch correction (real-time or graphical) is standard"),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
        ("parallel 1176/LA-2A style blend 10–25%", "parallel FET/opto-style blend 10–25%"),
    ],
    "regional-mexican": [
        ("(Grupo Firme tours carried seven)", "(big tours can carry seven)"),
        ("Cardioid sub arrays, as on recent Grupo Firme tours, help", "Cardioid sub arrays help"),
        ("NIOSH sets 85 dBA over 8 hours as the hazard threshold", "Common hearing-safety guidance sets 85 dBA over 8 hours as the hazard threshold"),
        ("(DPA 4099 class)", "(small clip-on condensers)"),
    ],
    "k-pop": [
        ("Korean studios record each member line by line on a tube condenser (JYP records TWICE on a Telefunken ELA M251 into a Neve 1073 and LA-2A); an in-house vocal director", "Korean studios record each member line by line on a tube condenser, often into a transformer-coupled preamp and an optical compressor; an in-house vocal director"),
        ("Live, members use headsets or handheld wireless (Blackpink: custom Sennheiser SKM 6000 handhelds with MM 445 capsules).", "Live, members use headsets or handheld wireless."),
        ("Blackpink’s FOH engineer reported 108–109 dBA and about 130 dBC from 52 subs—a target few venue limits allow.", "Stadium K-pop shows have run 108–109 dBA and about 130 dBC from 50-plus subs—a target few venue limits allow."),
        ("Spotify, YouTube and Amazon normalize to about −14 LUFS (Apple −16), so", "Most streaming services normalize to about −14 LUFS (some −16), so"),
        ("Slower attack keeps consonants; JYP uses a 1176-style unit this way", "Slower attack keeps consonants; a FET-style unit works well this way"),
        ("LA-2A at tracking is common in Korean studios", "Optical compression at tracking is common in Korean studios"),
        ("1176 fast / medium", "FET-style fast / medium"),
        ("Pitch-shift doubler (MicroShift-type)", "Pitch-shift doubler (micro-shift type)"),
    ],
    "alternative-indie-rock": [
        ("(P-bass into an Ampeg-type amp)", "(a passive bass into a tube bass amp)"),
        ("jangle (Rickenbacker/Telecaster clean with compression and chorus), fuzz (Big Muff style)", "jangle (bright 12-string or single-coil clean with compression and chorus), fuzz (classic fuzz-pedal style)"),
        ("analog-style synths, Farfisa/Vox organs, Wurlitzer, Mellotron sounds,", "analog-style synths, combo organs, reed electric piano, tape-replay keyboard sounds,"),
        ("(Beta 58A, e945, or a supercardioid condenser capsule chosen for background rejection)", "(a supercardioid dynamic or condenser capsule chosen for background rejection)"),
        (" (The National’s Prospect Park shows were held to 95 dBA over a short averaging window)", ""),
        ("Ribbon overheads (Coles 4038 style)", "Ribbon overheads (classic figure-8 ribbons)"),
        ("Farfisa-type organ can be harsh", "a combo organ can be harsh"),
    ],
    "christian-contemporary-worship": [
        ("Tracks: Ableton Live, MultiTracks Playback or Loop Community Prime supplying click,", "Tracks: a playback app or DAW supplying click,"),
        (" (SM58, Beta 58, e935, KSM9 class)", ""),
        ("Spotify normalizes to −14 LUFS and recommends −2 dBTP or lower for masters louder than that.", "Most streaming services normalize to −14 LUFS, and −2 dBTP or lower is recommended for masters louder than that."),
    ],
    "bollywood-indian-film-music": [
        ("but respected singers such as Sunidhi Chauhan have criticized heavy auto-tune for making voices sound alike;", "but respected playback singers have criticized heavy pitch correction for making voices sound alike;"),
        ("Live, Arijit Singh’s FOH engineer Sunny Sanour has used three mics (headset, wireless and wired handheld) for different tonal zones.", "Live, some FOH engineers give a star singer three mics (headset, wireless and wired handheld) for different tonal zones."),
        ("since Spotify normalizes to −14 LUFS and recommends that margin to avoid transcoding distortion", "since streaming services normalize to about −14 LUFS and that margin avoids transcoding distortion"),
        ("theatrical 5.1/Atmos versions", "theatrical 5.1/immersive versions"),
        ("multi-singer showcases like the Bollywood Music Project prepare sessions days ahead", "multi-singer showcases prepare sessions days ahead"),
        ("Large IEM mixes; Rahman’s tours have used KLANG immersive in-ear processing", "Large IEM mixes; big tours use immersive in-ear processing"),
        ("separate film/Atmos mix", "separate film/immersive mix"),
    ],
    "afrobeats": [
        ("Jesse Ray Ernster, who mixed Burna Boy’s Grammy-winning Twice As Tall, noted that this audience wants fast, upper-mid percussion upfront, at times even above the vocal.", "This audience wants fast, upper-mid percussion upfront, at times even above the vocal."),
        ("Live (Burna Boy’s tour ran Shure Axient Digital handhelds), drop", "Live, drop"),
        ("including deliberate Auto-Tune", "including deliberate hard-tuned pitch correction"),
        ("Small shelf at 10 kHz on Rhodes", "Small shelf at 10 kHz on electric piano"),
        ("Auto-Tune (effect)", "Hard-tune pitch correction (effect)"),
        (" (DiGiCo Quantum, Yamaha RIVAGE class)", ""),
    ],
    "classical-orchestral": [
        ("Systems at the Hollywood Bowl or Wolkenturm use delay-matrix and imaging", "Large outdoor orchestral venues use delay-matrix and imaging"),
        ("Spotify, Apple (−16) and Tidal use album normalization", "Several streaming services (some at −16) use album normalization"),
        ("a Decca tree or spaced omni AB pair", "a three-omni tree or spaced omni AB pair"),
        ("Decca tree", "three-omni tree"),
    ],
    "film-video-game-score": [
        ("follow Alan Meyerson’s rule of not building the mix in the middle", "follow the film mixer’s rule of not building the mix in the middle"),
        (" (Pink used 15–17 delay zones on a DiGiCo SD7)", " (big arena shows have used 15–17 delay zones)"),
        ("Netflix asks for −27 LKFS dialogue-gated", "A major streaming delivery spec asks for −27 LKFS dialogue-gated"),
        ("Spotify normalizes to −14 LUFS with −1 dBTP recommended", "streaming normalizes to about −14 LUFS with −1 dBTP recommended"),
        ("In Atmos, deliver a 7.1.2 bed", "In immersive formats, deliver a 7.1.2 bed"),
        ("arena hybrid shows (Hans Zimmer Live) average near 90 dBA", "arena hybrid score shows average near 90 dBA"),
        ("(Netflix −27 LKFS dialogue-gated, −2 dBTP)", "(a major streaming spec: −27 LKFS dialogue-gated, −2 dBTP)"),
        ("Live, Colin Pink (Hans Zimmer Live) favors upward compression that lifts quiet passages.", "Live, upward compression that lifts quiet passages works well for hybrid score shows."),
        ("Clip-on condensers (DPA 4099, Neumann, sE) on every player", "Clip-on condensers on every player"),
        ("Calibrated surround/Atmos room", "Calibrated surround/immersive room"),
    ],
    "trap": [
        ("derived from the Roland TR-808", "derived from the classic 808 drum machine"),
        ("artists usually track while hearing Auto-Tune", "artists usually track while hearing real-time pitch correction"),
        ("use a robust wireless dynamic (Beta 58, MD 435/9000-series),", "use a robust wireless dynamic,"),
        ("run a live Auto-Tune insert", "run a live pitch-correction insert"),
        ("(Future’s 2023 tour used 21 double-18 subs; Travis Scott’s Circus Maximus tour ran 66 subs in two rows)", "(from about 20 double-18 subs to more than 60 in two rows)"),
        ("intentional Auto-Tune artifacts", "intentional hard-tune artifacts"),
        ("(Firkins’ Future chain shelves up above roughly 5.2 kHz)", "(a common chain shelves up above roughly 5.2 kHz)"),
        ("Or dynamic EQ/Soothe keyed from the kick (Ethan Stevens’ approach)", "Or a dynamic EQ or resonance suppressor keyed from the kick"),
        ("1176 fast, 8:1+", "FET-style fast, 8:1+"),
        ("Before Auto-Tune when tracking", "Before real-time pitch correction when tracking"),
        ("Auto-Tune (hard)", "Real-time pitch correction (hard)"),
        ("Retune 0–5, key or chromatic, Flex-Tune off", "Retune 0–5, key or chromatic, natural-transition mode off"),
        ("Auto-Tune (melodic)", "Real-time pitch correction (melodic)"),
        ("live Auto-Tune", "live pitch correction"),
        ("Spotify normalizes to −14 LUFS and recommends true peak below −2 dBTP for masters louder than −14.", "Most streaming services normalize to −14 LUFS; keep true peak below −2 dBTP for masters louder than −14."),
        ("Seth Firkins (Future) cuts incoming track levels deeply to make headroom, warning against trading the song’s dynamics for a louder 808.", "Cut incoming track levels deeply to make headroom; never trade the song’s dynamics for a louder 808."),
    ],
    "house": [
        ("Drum machines: the Roland TR-909 (kick, clap, open and closed hats) and TR-808, plus TR-707/727 and CR-78 sounds; now mostly samples.", "Drum machines: the classic 909 (kick, clap, open and closed hats) and 808, plus 707/727 and other vintage drum-machine sounds; now mostly samples."),
        ("Harmony: Rhodes and electric piano, piano stabs (the “house piano” since Marshall Jefferson’s 1986 anthem), organ (M1 organ bass and Hammond-style), Juno-type pads,", "Harmony: electric pianos, piano stabs (the “house piano” of the mid-1980s anthems), organ (digital organ bass and tonewheel-style), analog-polysynth pads,"),
        ("on CDJs, turntables or controllers", "on DJ media players, turntables or controllers"),
        (" (SM58, Beta 58A, KSM9 class)", ""),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
        ("which is why producers like Kerri Chandler test music in real clubs", "which is why many producers test music in real clubs"),
        ("SSL-style glue is common in house", "VCA bus-style glue is common in house"),
    ],
    "heavy-metal": [],
    "gospel": [
        ("Hammond organ (B3, C3, A100, or clone) through a Leslie:", "Tonewheel organ (vintage or clone) through a rotating speaker:"),
        ("synth pads, strings and Rhodes in contemporary settings", "synth pads, strings and electric piano in contemporary settings"),
        ("Hammond top (horn)", "Organ top (horn)"),
        ("Hammond bottom (rotor)", "Organ bottom (rotor)"),
    ],
    "jazz": [
        ("piezo pickup (Fishman, Underwood, Realist) blended with a mic", "piezo or bridge pickup blended with a mic"),
        ("acoustic grand, or Rhodes/Hammond B3 in soul-jazz and organ trios", "acoustic grand, or electric piano/tonewheel organ in soul-jazz and organ trios"),
        ("(Neumann KMS 105, Shure KSM9 or Beta 87A class)", "(handheld condenser or high-end dynamic)"),
        ("2:1–4:1 (1176-style)", "2:1–4:1 (FET-style)"),
    ],
    "soul": [
        ("—Erykah Badu’s FOH engineer Kenneth Williams aims to immerse fans, not pummel them.", "—the aim is to immerse fans, not pummel them."),
        ("Keys: Hammond organ with Leslie, piano, Fender Rhodes and Wurlitzer (essential to neo-soul), clavinet;", "Keys: tonewheel organ with rotating speaker, piano, tine and reed electric pianos (essential to neo-soul), clavinet;"),
        ("Motown engineers rode faders by hand at mixdown, and FOH engineers like Gordon Williams (Leela James) describe “performing” the dynamics with the band.", "The classic soul engineers rode faders by hand at mixdown, and good FOH engineers “perform” the dynamics with the band."),
        (", and Daptone’s Gabriel Roth has used drums-left/bass-right layouts", ", and modern retro-soul records use drums-left/bass-right layouts too"),
        ("Live mics: SM58, Beta 58A, e935 or a quality condenser handheld.", "Live mics: a rugged dynamic or a quality condenser handheld."),
        ("Retro studio choices include ribbons and vintage dynamics (Charles Bradley sang into an EV RE15);", "Retro studio choices include ribbons and vintage dynamics;"),
        ("Under NIOSH guidance, 94 dBA is safe for about one hour", "By common hearing-safety guidance, 94 dBA is safe for about one hour"),
        (" (Roth rolls lows off before tape; Charles Bradley’s producer filtered above 6 kHz)", ""),
        ("Live, use virtual soundcheck when possible (as Anderson .Paak’s FOH engineer does).", "Live, use virtual soundcheck when possible."),
        ("Rhodes / Wurlitzer", "Electric piano (tine / reed)"),
        ("Hammond (Leslie)", "Organ (rotating speaker)"),
        ("Catches belts; Elmhirst hit “Rehab” with about 10 dB from a fast 1176", "Catches belts; famous retro-soul vocals took about 10 dB from a fast FET compressor"),
        ("LA-2A or Fairchild-style smoothing", "Optical or vari-mu tube-style smoothing"),
        ("As part of the tone; D’Angelo ran vocals through a Leslie", "As part of the tone; neo-soul has even run vocals through a rotating speaker"),
        ("(Beta 57A, Beta 98)", "(small dynamics or clip-on condensers)"),
    ],
    "hard-rock": [
        ("(Marshall crunch is the archetype)", "(British-style tube crunch is the archetype)"),
        ("Hammond (Deep Purple lineage)", "tonewheel organ (the Deep Purple lineage)"),
        ("Arena productions in the Mutt Lange tradition stack backing vocals", "Big 1980s-style arena productions stack backing vocals"),
        (" (SM58, Beta 58A, e935)", ""),
        ("Germany’s DIN 15905-5 sets 99 dBA over 30 minutes and 135 dBC peak;", "German rules set 99 dBA over 30 minutes and 135 dBC peak;"),
        ("Offer earplugs; per NIOSH, 100 dBA is safe for about 15 minutes a day.", "Offer earplugs; by common hearing-safety guidance, 100 dBA is safe for about 15 minutes a day."),
        ("Hammond / keys", "Organ / keys"),
        ("1176-style catches screams", "Fast FET-style catches screams"),
        ("SSL-style bus comp is standard", "VCA bus-style comp is standard"),
    ],
    "j-pop": [
        ("Tokyo-based engineer Gregory Germain (Mrs. GREEN APPLE, Juju) says the Japanese market demands a “big vocal” even over a huge backing track.", "The Japanese market demands a “big vocal” even over a huge backing track."),
        ("Hall shows (Nippon Budokan, Osaka-jo Hall, NHK Hall) typically run", "Hall shows typically run"),
        ("immersive systems (L-ISA on aiko and My Hair is Bad shows) rather than delay towers", "immersive systems rather than delay towers"),
        ("Streaming normalizes to about −14 LUFS (Spotify Loud mode −11)", "Streaming normalizes to about −14 LUFS (−11 on some services’ loud setting)"),
        ("which broadcasters normalize to −24 LKFS under ARIB TR-B32", "which Japanese broadcasters normalize to −24 LKFS"),
        ("Japanese TV uses −24 LKFS (ARIB TR-B32)", "Japanese TV uses −24 LKFS"),
        ("(the Yasutaka Nakata/Perfume lineage)", "(the electro-idol lineage)"),
    ],
    "c-pop-mandopop": [
        ("Live, RF handhelds (e.g. Sennheiser MD 435/445 capsules) on catwalks", "Live, RF handhelds on catwalks"),
        ("Some tours run loud and bass-rich (Jay Chou’s FOH engineer describes his mix that way), but", "Some tours run loud and bass-rich, but"),
        ("Under NIOSH, 100 dBA is safe for about 15 minutes.", "By common hearing-safety guidance, 100 dBA is safe for about 15 minutes."),
        ("as Spotify advises", "as streaming services advise"),
        ("Spotify normalizes to about −14", "streaming normalizes to about −14"),
        ("(DPA-type)", ""),
    ],
    "indie-pop": [
        ("clean or lightly driven Telecasters, Jazzmasters and Jaguars, often through a Roland JC-120 or Fender Twin;", "clean or lightly driven single-coil and offset guitars, often through a clean solid-state or big tube combo;"),
        ("combo organ or string-machine pads, Juno-60/106, DX7 electric pianos, Wurlitzer and Rhodes,", "combo organ or string-machine pads, 1980s analog polysynths, FM electric pianos, reed and tine electric pianos,"),
        ("or drum machine (Linn, MPC, preset boxes)", "or drum machine (vintage drum machines, pad samplers, preset boxes)"),
        ("Mitski’s FOH engineer Patrick Scott names keeping the quiet passages clear over loud drums as his main challenge, and his goal is that she seems to be speaking to each listener.", "the main challenge is keeping the quiet passages clear over loud drums, so the singer seems to be speaking to each listener."),
        ("Studio mics range from SM57/SM7 (Clairo tracked “Alewife” on a 57) to large condensers.", "Studio mics range from everyday dynamics (whole bedroom-pop hits were tracked on one) to large condensers."),
        (" (SM58, Beta 58, DPA d:facto class)", ""),
        ("Under NIOSH guidance, 94 dBA is safe for about an hour.", "By common hearing-safety guidance, 94 dBA is safe for about an hour."),
        ("Spotify normalizes to about −14 LUFS, so", "Most streaming services normalize to about −14 LUFS, so"),
        (" (iZotope suggests narrower verses, 50–75% panning in choruses)", " (narrower verses, 50–75% panning in choruses)"),
        ("JC-120 and Jazzmaster tones get spiky", "Clean solid-state amp and offset-guitar tones get spiky"),
        ("Piano / Rhodes / Wurlitzer", "Piano / electric pianos"),
        ("Wurlitzer bark at 1 kHz can mask vocal", "Reed electric-piano bark at 1 kHz can mask vocal"),
        ("Clairo’s Immunity used a 1176-type plug-in on vocals", "A FET-type plug-in on vocals is common in bedroom pop"),
        ("Wet Leg’s FOH engineer compresses groups instead of inputs to keep transients", "Live, compressing groups instead of inputs keeps transients"),
        ("Cocteau Twins layered effects-printed guitars through Lexicon and multi-effects units.", "Dream pop layers effects-printed guitars through digital reverbs and multi-effects units."),
        ("JC-120/Twin on stage can be loud and spiky", "Clean combo amps on stage can be loud and spiky"),
    ],
    "punk-pop-punk": [
        ("or a SansAmp-style pedal", "or an amp-simulator DI pedal"),
        ("humbucker or Strat-style guitars into crunchy Marshall-type amps", "humbucker or single-coil guitars into crunchy British-style amps"),
        ("tuned doubles and Melodyne-built harmonies are common", "tuned doubles and pitch-edited harmonies are common"),
        ("(SM58, Beta 58A, Telefunken M80 class)", ""),
        ("The WHO Global Standard for safe listening venues sets 100 dBA LAeq-15 as the average limit,", "A widely used safe-listening standard for venues sets 100 dBA LAeq-15 as the average limit,"),
        ("Spotify normalizes to −14 LUFS (−11 on its loud setting)", "Most streaming services normalize to −14 LUFS (−11 on some loud settings)"),
        ("WHO safe-listening guidance and many festivals cap at 100 dBA LAeq-15", "common safe-listening guidance and many festivals cap at 100 dBA LAeq-15"),
        ("1176-into-optical chain", "FET-into-optical chain"),
    ],
    "reggae": [
        ("Bass: Fender Jazz or Precision with flatwounds,", "Bass: a passive four-string with flatwounds,"),
        ("Hammond-style 16th-note shuffle", "Organ-style 16th-note shuffle"),
        (" (SM58, Beta 58, e935 class)", ""),
        ("Tape echo (Space Echo style)", "Tape echo (classic tape-loop style)"),
    ],
    "sertanejo": [
        ("(Melodyne or Auto-Tune at moderate speed)", "(graphical or real-time, at moderate speed)"),
        (" (SM58/Beta 58, e935/e945, DPA d:facto class)", ""),
        (" (DAS reported a constant 110 dBA across a 15,000 m² New Year’s show, which is at the high extreme)", " (a constant 110 dBA across a big New Year’s show is the high extreme)"),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
        ("from Pro Tools with redundant rigs", "from a playback DAW with redundant rigs"),
    ],
    "punjabi-pop-bhangra": [
        (" (SM58/Beta 58, e935, KSM9-class)", ""),
        ("Engineers on Diljit Dosanjh’s Dil-Luminati tour reported SPL regularly above 108 dB, and stadium shows in India", "Big Punjabi stadium tours run SPL regularly above 108 dB, and stadium shows in India"),
        ("Spotify normalizes to −14 LUFS (−11 on its loud setting)", "Most streaming services normalize to −14 LUFS (−11 on some loud settings)"),
        ("with a dynamic kick or tom mic (D112, MD421, e602-class) and the treble head with an SM57 or small condenser", "with a dynamic kick or tom mic and the treble head with a classic dynamic or small condenser"),
        ("Auto-Tune / pitch correction", "Pitch correction"),
    ],
    "blues": [
        ("flat-top or resonator (National steel, Dobro), often played", "flat-top or resonator (steel- or wood-bodied), often played"),
        ("Strat, Les Paul or ES-335 class guitars into tube combos (Fender Bassman, Deluxe, Super Reverb) at the edge of breakup;", "single-coil, solid-body humbucker or semi-hollow guitars into vintage-style tube combos at the edge of breakup;"),
        ("cupped to a bullet mic (Green Bullet, JT-30 class) into a small overdriven tube amp", "cupped to a bullet-style harmonica mic into a small overdriven tube amp"),
        ("Hammond with Leslie in soul-blues and blues-rock", "tonewheel organ with rotating speaker in soul-blues and blues-rock"),
        ("; Buddy Guy’s FOH engineer Sage Anthony names that swing as his main challenge.", "; riding that swing is the main live challenge."),
        (" (SM58, Beta 58A, e945 class)", ""),
        ("Under NIOSH guidance 100 dBA is safe for only 15 minutes;", "By common hearing-safety guidance, 100 dBA is safe for only 15 minutes;"),
        ("Large festivals (e.g., Chicago Blues Festival) use line arrays", "Large festivals use line arrays"),
        ("Spotify normalizes to −14 LUFS (−11 on its Loud setting)", "Most streaming services normalize to −14 LUFS (−11 on some loud settings)"),
        ("Piano / Hammond", "Piano / organ"),
        ("Hammond, occasionally guitar", "Organ, occasionally guitar"),
    ],
    "funk": [
        ("synth bass (Minimoog) took over in electro-funk", "analog synth bass took over in electro-funk"),
        ("Keys: Hohner Clavinet (often through an amp, with wah or phaser), Rhodes, Hammond organ,", "Keys: clavinet (often through an amp, with wah or phaser), electric piano, tonewheel organ,"),
        ("Electronic: TR-808/LinnDrum in 1980s electro-funk;", "Electronic: 808 and other vintage drum machines in 1980s electro-funk;"),
        ("Live, use an SM58/Beta 58/e935 or 5235-type capsule, and keep", "Live, use a rugged dynamic or a supercardioid capsule, and keep"),
        ("(−2 dBTP if louder than −14 LUFS, per Spotify)", "(−2 dBTP if louder than −14 LUFS)"),
        ("keys (clav, Rhodes, organ, synth)", "keys (clav, electric piano, organ, synth)"),
        ("Clavinet", "Clav (electric clavichord)"),
        ("Audible pumping (Vulf Compressor-style) is a deliberate revival flavor", "Audible pumping is a deliberate revival flavor"),
        ("(Bruno Mars’ FOH runs 100+, Earth, Wind & Fire 64+)", "(big pop-funk tours run 100+, classic funk bands 64+)"),
    ],
    "techno": [
        ("Drum machines: the Roland TR-909 (kick, clap, hats, ride) is the signature, with 808, 606, 707 and TR-8S-style units alongside.", "Drum machines: the 909 (kick, clap, hats, ride) is the signature, with 808, 606, 707 and modern drum-machine units alongside."),
        ("TB-303 acid lines, Moog/SH-101-style mono bass,", "303 acid lines, classic analog mono bass,"),
        ("most DJs play files via CDJ/USB or controllers", "most DJs play files via DJ media players/USB or controllers"),
        ("often with Ableton Live on a laptop", "often with a DAW on a laptop"),
        ("A study of over 60 Toronto nightclubs averaged about 96 dBA,", "Nightclubs commonly average about 96 dBA,"),
        ("Germany’s DIN 15905-5 sets 99 dBA LAeq-30", "German rules set 99 dBA LAeq-30"),
        ("(Apple about −16)", "(some services about −16)"),
        ("(Germany DIN 15905-5)", "(German rules)"),
        ("1176-style FET can make loops “dance”", "A FET-style compressor can make loops “dance”"),
    ],
    "folk-singer-songwriter": [
        (" (Brandi Carlile’s FOH team describes exactly that kind of ride)", ""),
        ("or an SM7-type dynamic for close intimacy", "or a broadcast-style dynamic for close intimacy"),
        (" (KM 105, e945, Beta 58A class)", ""),
    ],
    "brazilian-funk": [
        (", as Rennan da Penha’s Baile da Gaiola did in 2018", ", as the biggest bailes did in 2018"),
        ("(1998, Roland R-8, inspired by", "(1998, built on a drum machine, inspired by"),
        ("DJ runs Serato/CDJs;", "DJ runs DJ software or media players;"),
        ("Auto-Tune is common and accepted", "Real-time pitch correction is common and accepted"),
        (" (SM58, Beta 58A, e945 class)", ""),
        ("(WHO safe-listening guideline is 100 dBA LAeq-15)", "(the widely used safe-listening limit is 100 dBA LAeq-15)"),
        ("Spotify recommends −2 dBTP for masters louder than −14 LUFS", "−2 dBTP is recommended for masters louder than −14 LUFS"),
        ("(WHO guideline 100)", "(common safe-listening limit 100)"),
    ],
    "dancehall": [
        ("Engineer Dre Day (Koffee’s Rapture) frames the target as round bass, a chest-felt kick and crisp vocals that translate everywhere.", "The target is round bass, a chest-felt kick and crisp vocals that translate everywhere."),
        ("often use audible Auto-Tune as a style", "often use audible pitch correction as a style"),
        (" (SM58/Beta 58A, e935 class)", ""),
    ],
    "amapiano": [
        ("with tracks spreading on WhatsApp before radio", "with tracks spreading on messaging apps before radio"),
        ("plus TikTok challenges", "plus social-video challenges"),
        ("originally an FL Studio DX10 preset", "originally a stock software-synth preset"),
        ("Rhodes and acoustic piano looping", "Electric piano and acoustic piano looping"),
        ("(Scorpion Kings at Loftus Stadium; Red Bull Symphonic with Kabza De Small and a 33-piece orchestra, 2024)", "(stadium shows, and in 2024 a show with a 33-piece orchestra)"),
        (" (SM58, e935 class)", ""),
        ("(Spotify guidance)", "(common streaming guidance)"),
        ("small Bluetooth speakers", "small wireless speakers"),
    ],
    "salsa": [
        ("Bass: Ampeg Baby Bass (electric upright),", "Bass: baby bass (electric upright),"),
        ("Live, keep panning minimal; Marc Anthony’s FOH engineer Jose Rivera separates parts with mic choice and EQ rather than panning.", "Live, keep panning minimal; experienced salsa FOH engineers separate parts with mic choice and EQ rather than panning."),
        (" (SM58, Beta 58A, e935, KSM9 class)", ""),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
    ],
    "bachata": [
        (" (SM58, Beta 58A, e945, KSM9 class)", ""),
        ("(−2 dBTP for masters louder than −14 LUFS, per Spotify)", "(−2 dBTP for masters louder than −14 LUFS)"),
        ("Clip or dynamic mics on bongó (SM57 class)", "Clip or dynamic mics on bongó"),
    ],
    "cumbia": [
        ("diatonic button accordion, often a Hohner, played treble side", "diatonic button accordion, played treble side"),
        ("Use dynamic mics (SM58, Beta 58A, e935) live;", "Use dynamic mics live;"),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
    ],
    "arabic-pop": [
        ("arranger keyboards (Korg Pa Oriental, Yamaha, Ketron) with per-note quarter-tone switches", "arranger keyboards with per-note quarter-tone switches"),
        (" (KSM9, e945, KMS class)", ""),
        ("(L-Acoustics K2 or d&b J-Series with delay towers for 25,000–50,000 people)", "(large line arrays with delay towers for 25,000–50,000 people)"),
        ("Spotify, Anghami, YouTube and others normalize to roughly −14", "streaming services normalize to roughly −14"),
        ("clip-on condenser or SM57-type near the sound holes", "clip-on condenser or a dynamic near the sound holes"),
    ],
    "turkish-pop": [
        ("Its central theme, as Martin Stokes describes, is love:", "Its central theme is love:"),
        (" (Beta 58A, e945, KSM9, KMS 105 class)", ""),
        ("Spotify normalizes to −14 LUFS and recommends true peaks below −1 dBTP (below −2 dBTP for masters louder than −14).", "Most streaming services normalize to −14 LUFS; keep true peaks below −1 dBTP (below −2 dBTP for masters louder than −14)."),
        ("(SM57 or MD421 at the rim, 15–25 cm)", "(a dynamic at the rim, 15–25 cm)"),
        ("Clip-on mics (DPA 4099 class) or pickups", "Clip-on mics or pickups"),
    ],
    "dangdut": [
        ("(Yamaha PSR is iconic)", "(home arranger keyboards are iconic)"),
        (" (SM58/Beta 58, e935 class)", ""),
        ("NIOSH rates 100 dBA safe for about 15 minutes", "Common hearing-safety guidance rates 100 dBA safe for about 15 minutes"),
        ("Most listening is YouTube on phones", "Most listening is video streaming on phones"),
        ("(YouTube uploads often louder); YouTube and Spotify normalize to about −14", "(video uploads often louder); streaming services normalize to about −14"),
        (" (e.g., SM57/e604)", ""),
    ],
    "mpb-bossa-nova": [
        ("Live, a handheld condenser (Neumann KM105, Shure KSM9 or Beta 87A class) helps soft voices; Bebel Gilberto’s FOH engineer used a KM105 with a light chain.", "Live, a handheld condenser with a light chain helps soft voices."),
        ("A dynamic mic (SM58, e935) works", "A dynamic mic works"),
        ("(Marisa Monte’s and Gilberto Gil’s festival rigs use L/C/R arrays mainly for vocal clarity, not level)", "(big MPB festival rigs use L/C/R arrays mainly for vocal clarity, not level)"),
        ("NIOSH guidance allows about 1 hour at 97 dBA", "Common hearing-safety guidance allows about 1 hour at 97 dBA"),
        ("Spotify normalizes to about −14, so", "Most streaming services normalize to about −14, so"),
        ("Light group compression, as on Bebel Gilberto’s tours", "Light group compression, as on intimate bossa tours"),
        ("or a KM-54/U47 class tube mic", "or a vintage-style tube condenser"),
    ],
    "drum-and-bass": [
        (" (SM58, Beta 58A, e945)", ""),
        ("Andy C’s Wembley arena all-nighter, for example, averaged about 102 dBA and peaked near 106 dBA.", "A big arena all-nighter can average about 102 dBA and peak near 106 dBA."),
        ("NIOSH allows only about 15 minutes a day at 100 dBA unprotected", "common hearing-safety guidance allows only about 15 minutes a day at 100 dBA unprotected"),
    ],
    "lo-fi-chillhop": [
        ("(the Lofi Girl stream started in February 2017 and became a cultural symbol) or seasonal compilations such as Chillhop’s Essentials series", "(the best-known 24/7 stream started in 2017 and became a cultural symbol) or seasonal label compilations"),
        ("J Dilla’s unquantized MPC drums", "J Dilla’s unquantized sampler drums"),
        ("(often from old records, SP-1200/MPC-style)", "(often from old records, vintage-sampler style)"),
        ("Roland SP-404 (lo-fi, vinyl and cassette sim, compressor), MPC, Akai S950-style samplers; RC-20, iZotope Vinyl, tape emulations.", "compact performance samplers (lo-fi, vinyl and cassette sims, a built-in compressor), pad samplers and vintage 12-bit-style samplers; vinyl, lo-fi and tape emulation plug-ins."),
        ("a table with an SP-404 or MPC and a controller", "a table with a compact sampler and a controller"),
        ("Since Spotify and YouTube normalize to about −14", "Since streaming services normalize to about −14"),
        ("grew into a YouTube/SoundCloud streaming genre from about 2013–2017 (ChilledCow/Lofi Girl in France, Chillhop Music in Rotterdam)", "grew into a streaming genre from about 2013–2017 (24/7 streams from France, a key label in Rotterdam)"),
        ("(SP-404/MPC + keys)", "(sampler + keys)"),
        ("use the SP-404’s compressor on the whole beat", "use a compact sampler’s built-in compressor on the whole beat"),
        ("(SP-1200 / S950 feel)", "(vintage 12-bit sampler feel)"),
        ("Stereo pair from SP-404/MPC/laptop", "Stereo pair from sampler/laptop"),
    ],
    "bluegrass-americana": [
        ("As Ricky Skaggs put it about the form, the band itself is the star:", "In this form the band itself is the star:"),
        ("multi-mic bands use SM58-class dynamics", "multi-mic bands use rugged dynamics"),
        ("Festivals (Telluride, MerleFest, IBMA’s World of Bluegrass) use delay towers", "Big bluegrass festivals use delay towers"),
        ("Ribbon mics (KSM313 class) soften", "Ribbon mics soften"),
        ("Dobro (pickup)", "Resonator guitar (pickup)"),
    ],
    "musical-theatre": [
        ("Designers such as Mick Potter describe the target as being able to hear every word as easily as on TV while the show still feels exciting and unamplified.", "The target is to hear every word as easily as on TV while the show still feels exciting and unamplified."),
        (" (DPA 4061/4060, Sennheiser MKE1/MKE2, Countryman B3 class)", ""),
        (" (DPA d:fine, Sennheiser HSP class)", ""),
        ("QLab or Ableton cues", "Show-control or DAW cues"),
        ("(TiMax, d&b Soundscape, Meyer Spacemap)", "(delay-matrix and object-based systems)"),
        ("Hamilton’s album mixer Tim Latham cites a roughly 55:45 vocal-to-band balance, versus pop’s typical 70:30.", "Cast albums often sit near a 55:45 vocal-to-band balance, versus pop’s typical 70:30."),
        ("and practitioners report peaks around 110 dBA at FOH on the loudest West End rock shows.", "and the loudest West End rock shows peak around 110 dBA at FOH."),
        ("(LA-2A/1176 class)", "(optical/FET class)"),
    ],
    "disco-nu-disco": [
        ("(909/LinnDrum-style)", "(909 or vintage drum-machine style)"),
        ("Moog/synth bass in Munich disco", "analog synth bass in Munich disco"),
        ("string machines (ARP Solina/String Ensemble)", "string machines (classic string ensembles)"),
        ("Live, condensers like the KSM9/KSM11 or e965 suit polished pop singers; dynamic mics (SM58, Beta 58A) suit belters in loud stages.", "Live, handheld condensers suit polished pop singers; dynamic mics suit belters on loud stages."),
        ("Spotify recommends about −14 LUFS-I and true peak below −1 dBTP", "Streaming normalizes to about −14 LUFS-I; keep true peak below −1 dBTP"),
        ("Classic chain is 1176 or LA-2A; Stayin’ Alive vocals used an 1176 at 4:1", "Classic chain is FET or optical; famous falsetto disco vocals used a FET at 4:1"),
        ("Neve 33609 / SSL-style glue", "Diode-bridge or VCA bus-style glue"),
        ("(EMT 140 style)", "(classic plate style)"),
        ("Chorus / Dimension D", "Chorus / dimension-style chorus"),
    ],
    "french-variete-chanson": [
        ("Stromae’s show runs instrument processing in Ableton.", "some shows run instrument processing in a DAW."),
        ("(Céline Dion’s tour carries a four-piece string section and three-piece brass)", "(a big variété tour can carry a four-piece string section and three-piece brass)"),
        (" (Neumann KMS 105 or KK 105 class, DPA d:facto)", ""),
        ("Stromae’s chain is simply DPA d:facto, preamp, Distressor, de-esser and EQ.", "a simple chain of capsule, preamp, compressor, de-esser and EQ is often enough."),
        ("Spotify normalizes to −14 LUFS, so", "Most streaming services normalize to −14 LUFS, so"),
        ("1176 into opto is common", "FET into opto is common"),
        ("Live, Stromae’s engineer Lionel Capouillez keeps the master uncompressed to keep the music airy.", "Live, leaving the master uncompressed keeps the music airy."),
        ("(U67/U47 class)", "(classic tube types)"),
    ],
}

# Reference recordings: record-label credits come off (the recording stays).
EDITS["classical-orchestral"] += [
    (", 1959 (Decca)", ", 1959"),
    (", 1955 (RCA Living Stereo)", ", 1955"),
    (", 1958 (Decca, John Culshaw)", ", 1958"),
    (", 2011 (BIS)", ", 2011"),
]

# Second pass (converted text re-read for single-surname attributions and
# studio / company names in the history lines).
EDITS["latin-pop"] += [("Ricky Martin used a mic with a mute switch to avoid feedback near the PA.", "A mic with a mute switch helps a singer who works near the PA avoid feedback.")]
EDITS["afrobeats"] += [
    ("Ernster removed 2–3 kHz on snaps and widened them", "Removing 2–3 kHz on snaps and widening them works well"),
    ("HPF 25–35 Hz (Ernster used about 60 Hz on a busy track)", "HPF 25–35 Hz (about 60 Hz on a busy track)"),
    ("Ernster’s Burna vocal lifts sat near 4.3 kHz and 13.5 kHz", "Hit vocal lifts often sit near 4.3 kHz and 13.5 kHz"),
    ("Groove glue; Ernster’s bus compression stayed at 1–2 dB", "Groove glue; keep bus compression at 1–2 dB"),
    ("Ernster stacked several small clip and limiting stages (each 0.5–2 dB) rather than one heavy limiter.", "Stack several small clip and limiting stages (each 0.5–2 dB) rather than one heavy limiter."),
    ("Burna Boy’s stadium setup ran about 120 inputs", "a stadium setup can run about 120 inputs"),
]
EDITS["film-video-game-score"] += [(" (Remote Control, Abbey Road, AIR Lyndhurst)", "")]
EDITS["soul"] += [
    ("Elmhirst targeted about 5.5 kHz on Winehouse.", "around 5.5 kHz suits many soul voices."),
    ("(Roth calculates ~140 ms at 15 ips)", "(~140 ms at 15 ips)"),
    ("Elmhirst kept the “Rehab” drum spring dry in verses and pushed it in choruses", "keep a drum spring dry in verses and push it in choruses"),
]
EDITS["country"] += [("a B3 pad", "an organ pad")]
EDITS["hard-rock"] += [(", as AC/DC’s FOH engineer describes.", ".")]
EDITS["funk"] += [("James Brown’s band (Cincinnati’s King Studios and the road)", "James Brown’s band")]
EDITS["disco-nu-disco"] += [("Philadelphia soul (Sigma Sound, MFSB)", "Philadelphia soul (MFSB)"), ("Munich (Moroder/Musicland)", "Munich (Moroder)")]

# Third pass — expert review 2026-10-07 (docs/labs/reviews/REVIEW_2026_10_07_mixing.md).
# (a) Arithmetic / safety figures that were wrong in the source, corrected to
#     the physics: delay times at the stated tempo, the 3 dB exchange rate,
#     the C-weighted peak metric.
EDITS["hip-hop-rap"] += [("with peaks under 140 dB LAmax", "with peaks under 140 dB LCpeak")]
EDITS["mpb-bossa-nova"] += [("allows about 1 hour at 97 dBA", "allows only about 30 minutes at 97 dBA")]
EDITS["reggae"] += [("(about 350–700 ms at 75 BPM half-time)", "(at a 75 BPM half-time pulse about 600 ms dotted-eighth and 800 ms quarter; half those if you count the 150 BPM double time)")]
EDITS["amapiano"] += [("(about 400–550 ms for 1/4)", "(about 520–555 ms for 1/4, 390–415 ms for dotted 1/8)")]
EDITS["brazilian-funk"] += [("1/4 or 1/8 note (≈230 ms at 130 BPM, 200 ms at 150)", "1/4 or 1/8 note (1/8 ≈ 230 ms at 130 BPM, 200 ms at 150)")]
EDITS["techno"] += [("many EU venues capped at 99 dBA LAeq-30", "German venues capped at 99 dBA LAeq-30")]
# (b) Names and citations the earlier passes missed (owner ruling 2026-10-04).
EDITS["hip-hop-rap"] += [
    ("Bigger tours add a band; J. A big arena run can blend", "Bigger tours add a band; a big arena run can blend"),
    (" Tours like Drake’s have flown all subs (eight hangs of nine) to deliver even, high-impact bass without crushing the front rows.", " Large tours often fly all the subs to deliver even, high-impact bass without crushing the front rows."),
]
EDITS["contemporary-rnb"] += [
    ("Smooth leveling; SZA template pairs a 3A-style unit with a second compressor", "Smooth leveling; often paired with a second compressor"),
    ("Parallel 160-style crush blended in for punch", "A hard-compressed parallel copy blended in for punch"),
    ("Maserati-style: lift 80–110 Hz and 10 kHz, notch around 250 Hz", "A common move: lift 80–110 Hz and 10 kHz, notch around 250 Hz"),
    ("(study average ≈109)", "(often around 109)"),
]
EDITS["edm-festival-electronic"] += [("research measured a C-minus-A difference of about 18 dB at 98 dBA", "a C-minus-A difference of about 18 dB at 98 dBA is typical")]
EDITS["latin-pop"] += [(" A loudness-matched test found the “Despacito” remix 1.2 dB louder than the original yet less punchy and narrower.", " Played back at matched loudness, a louder, more limited version usually sounds less punchy and narrower.")]
EDITS["k-pop"] += [
    ("Hall / 480-style reverb", "Hall reverb"),
    (" Some tours (Jin’s solo tour) skip ultra-deep EDM sub in favour of punch and vocal clarity in the back rows.", " Some tours skip ultra-deep EDM sub in favour of punch and vocal clarity in the back rows."),
]
EDITS["afrobeats"] += [
    ("Hit vocal lifts often sit near 4.3 kHz and 13.5 kHz", "Common vocal lifts sit around 4–5 kHz and 12–14 kHz"),
    ("it has its own report.", "it has its own guide (Amapiano)."),
]
EDITS["trap"] += [
    ("(a common chain shelves up above roughly 5.2 kHz)", "(a common chain shelves up above roughly 5 kHz)"),
    ("Retune 0–5,", "Retune speed 0–5 ms,"),
    ("Retune 10–25", "Retune speed 10–25 ms"),
]
EDITS["musical-theatre"] += [
    ("Live Design’s guide to learning a mix notes 30–40 dB of program dynamic range", "A show can carry 30–40 dB of program dynamic range"),
    ("Hamilton’s album string bus used a narrow cut near 3.5 kHz", "A narrow cut near 3.5 kHz on the string bus is a common fix"),
]
EDITS["mpb-bossa-nova"] += [("the SOS method cut spill by 3–6 dB.", "this can cut spill by 3–6 dB.")]
EDITS["disco-nu-disco"] += [
    ("Dimension-style mode 2–3, or 0.5–1 Hz rate", "Subtle fixed-mode stereo chorus, or 0.5–1 Hz rate"),
    ("Section miked with a Decca tree plus spots", "Section miked with a three-omni tree plus spots"),
]
EDITS["film-video-game-score"] += [("Decca tree", "three-omni tree")]
# (c) Conversion leftovers that read oddly.
EDITS["pop"] += [
    ("Use transparent graphical correction (Melodyne-style) for most pop.", "Use transparent note-by-note (graphical) correction for most pop."),
    ("Hand mastering a mix with 3–6 dB of headroom", "Give mastering a mix with 3–6 dB of headroom"),
]
EDITS["reggae"] += [("Organ-style 16th-note shuffle around the offbeat", "a 16th-note organ shuffle (the “bubble”) around the offbeat")]

EXPECTS = {
    "pop": "They expect a voice that sounds intimate yet huge, a chorus that lifts noticeably above the verse, and low end that feels modern without blurring the vocal.",
    "hip-hop-rap": "Fans know the lyrics and often rap along, so a buried or smeared vocal is the fastest way to lose a crowd. They also expect to feel the low end in the chest.",
    "rock": "Audiences expect a band that sounds like real people playing together in a room, with the singer’s words understandable and the guitars big but not harsh.",
    "contemporary-rnb": "Audiences come for the singer, so they expect to hear vocal detail (breaths, falsetto, melisma, ad-libs) floating over a warm, heavy bottom and smooth, polished harmony.",
    "edm-festival-electronic": "The audience wants sub-bass felt in the chest, a singable lead hook, and a chorus to shout back in the breakdown.",
    "country": "The audience knows the words, so they expect to hear them; a buried or smeared vocal is the cardinal sin.",
    "latin-pop": "Fans expect an intimate, expensive-sounding voice, a lush but tidy band, and audible Latin flavor (percussion, nylon guitar, a tropical or urban groove).",
    "reggaeton": "Crowds expect to feel the dembow in their body, hear every word clearly enough to shout along, and get a drop or “beat switch” that sends the floor up.",
    "regional-mexican": "Fans sing every line, shout gritos in the gaps, and expect the singer’s voice to be big, close and fully intelligible.",
    "k-pop": "On record they expect a dense, glossy, hyper-polished mix where every member gets a recognizable moment; live, the record’s impact plus real voices and their own fandom chanting back.",
    "alternative-indie-rock": "Audiences expect the band’s recorded personality: the specific fuzz pedal, the jangly chord, the off-kilter vocal.",
    "christian-contemporary-worship": "People expect every lyric to be clear, a bridge that lifts as it repeats, and space in quiet moments of prayer.",
    "bollywood-indian-film-music": "The multigenerational audience knows every word, follows favorite playback singers for decades, and sings the mukhda (refrain) back at full volume.",
    "afrobeats": "Audiences sing every hook and expect a relaxed, warm, bouncy groove, never an aggressive one.",
    "classical-orchestral": "They expect the sound of real acoustic instruments in a real room: rich strings, woodwinds placed behind them, brass and timpani with weight but not glare.",
    "film-video-game-score": "The listener rarely focuses on it directly, so the score has to work emotionally while sitting under dialogue and effects. In concert the relationship flips: fans come for the themes they grew up with and want the full orchestral sweep behind the footage.",
    "trap": "Its job is physical: to shake a car, a club or an arena with sub-bass while the rapper’s cadence and persona sit on top.",
    "house": "Dancers expect a groove that never stops, a kick they feel in the chest, warm and round bass, crisp hats that push the swing, and vocal hooks that hit in the breakdowns.",
    "heavy-metal": "Audiences headbang, mosh, crowd-surf and form circle pits; they want to feel the kick drum in their chest and hear every riff articulated, even at 200 BPM.",
    "gospel": "The audience expects to understand every lyric, hear the call-and-response between leader and choir, and feel the band push the room higher through vamps and key changes.",
    "jazz": "They expect the real sound of the instruments: woody upright bass, an airy ride cymbal, a natural piano, horns with breath and edge.",
    "soul": "Listeners expect the singer’s breath and grit, a bass line they can follow, a backbeat in the pocket, and horns that punch without stabbing.",
    "hard-rock": "Fans come for swagger, guitar heroics and a singer who can belt over a wall of amps.",
    "j-pop": "The words matter enormously—songs are tied to drama themes, anime storylines and commercials—so the audience expects to hear every syllable.",
    "c-pop-mandopop": "At concerts, fans wave synchronized lightsticks, sing whole choruses back (the “big chorus,” 大合唱) and judge live vocals harshly; post-show complaints often say the singer could not be heard.",
    "indie-pop": "Indie pop is music for private feeling shared in public: headphone listening, late-night playlists, and small rooms where the crowd sings every word back softly.",
    "punk-pop-punk": "They expect relentless drive, a guitar wall, a cracking snare and a singer they can shout along with.",
    "reggae": "Audiences expect bass felt in the chest but never boomy, a relaxed groove behind the beat, and words they can follow.",
    "sertanejo": "The audience does not just listen; it sings the entire song, often louder than the PA in quiet passages, and raises phones during the big ballad.",
    "punjabi-pop-bhangra": "Listeners expect a chest-thumping dhol, a ringing tumbi hook, and a singer whose Punjabi words and “hoi/balle balle” calls are clear and proud.",
    "blues": "Club and festival audiences shout encouragement after a good line, applaud mid-tune after a solo, and expect the soloist to take the room from a whisper to a roar. They want warmth, grit and the sound of amps in a room.",
    "funk": "Crowds expect to move, sing the hooks and answer the band’s call-and-response.",
    "techno": "The audience wants hypnosis, repetition and a body-felt kick, not a show.",
    "folk-singer-songwriter": "The audience sits, goes quiet and listens to words. From coffeehouse to theater, the singer should feel a few feet away.",
    "brazilian-funk": "The crowd expects to feel the grave (bass) in the chest and to shout the MC’s hook back.",
    "dancehall": "Listeners expect bass they feel in the chest, a kick that knocks, and every word of the patois lyric understood, because wordplay and quotable lines are the currency.",
    "amapiano": "The crowd expects to feel the log drum physically, hear jazzy keys float over it, and shout back the hooks.",
    "salsa": "Audiences expect brassy excitement, a crisp percussive piano, a bass felt in the hips, and a sonero whose improvised inspiraciones are clear word by word.",
    "bachata": "Audiences expect a steady, dance-ready pulse with the tap on counts 4 and 8, plus an intimate, exposed voice telling a story of love and betrayal.",
    "cumbia": "Audiences expect a relaxed but unstoppable sway, a melody they can sing back, and the lead line (accordion, keyboard or guitar) bright and present.",
    "arabic-pop": "Audiences expect a commanding, larger-than-life voice, warm strings answering it, and percussion that makes people dance.",
    "turkish-pop": "Fans sing whole songs back, clap along, and get up to dance (shoulder shimmies, göbek atmak, halay lines) the moment a darbuka break or 9/8 section starts.",
    "dangdut": "Audiences want to feel the kendang in the body, follow every word (they sing along and know the cengkok, the vocal ornaments), and hear suling and keyboard hooks answer the singer.",
    "mpb-bossa-nova": "Audiences listen to the words, and Brazilian crowds sing along—in a pagode roda that is the point.",
    "drum-and-bass": "Drum & bass is dance music for sound systems: raves, clubs and festival tents where the crowd comes to feel sub bass physically and move to breakbeats running twice as fast as the bassline.",
    "lo-fi-chillhop": "Listeners want a steady, warm, nostalgic mood that never demands attention: dusty jazz or soul chords, vinyl crackle, rain, a lazy behind-the-beat groove.",
    "bluegrass-americana": "Its audience includes many pickers who know every lick, so they listen for the instrument breaks, the tight trio harmony and the “high lonesome” tenor above the lead.",
    "musical-theatre": "Theatre audiences are seated, attentive and paying high ticket prices; they expect the sound to be clear, warm and “invisible,” with the voice appearing to come from the performer’s mouth rather than from a speaker cluster.",
    "disco-nu-disco": "Audiences expect an unbroken, physical groove: a kick that hits the chest steadily, a bass line you can sing, hi-hats that shimmer, and a lush, glamorous top of strings, horns and soaring vocals.",
    "french-variete-chanson": "=The audience treats the text as the point: the French public expects to understand the lyrics, because the songs follow the rhythms of the language and are valued for their writing.",
}
