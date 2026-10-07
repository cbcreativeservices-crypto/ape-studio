"""Brand / model / authority / citation patterns the learner text must not
carry (owner ruling 2026-10-04: no brand or model names, no named engineers,
publications, standards bodies or tours used as evidence — research stays in
docs). Used by flag_report.py (inspection) and convert.py (the final gate);
test/mixingGuidesData.test.ts holds the same list for the app.
"""
import re

BRAND_WORDS = [
    # microphones and their makers
    r"Shure", r"SM ?5[78]\w*", r"SM ?7\w*", r"Beta ?\d+\w*", r"KSM ?\d*\w*", r"PGA ?\d+", r"Telefunken", r"M8[01]", r"DPA",
    r"d:facto", r"Sony", r"C-?800G?", r"Neumann", r"U ?4[37]", r"U ?8[79]", r"U ?67", r"KMS? ?-?\d+\w*", r"KK ?\d+",
    r"Sennheiser", r"MD ?\d+\w*", r"e ?9\d\d\w*", r"e ?6\d\d", r"SKM ?\d*", r"MM ?445", r"M ?251", r"AKG", r"C ?414",
    r"Audix", r"D112", r"EV", r"RE ?\d+", r"Electro-Voice", r"Coles", r"4038", r"Countryman", r"MKE ?\d", r"Earthworks",
    r"Schoeps", r"Royer", r"Rode", r"Røde", r"Mojave", r"Lauten", r"Heil", r"9235", r"4061", r"4099", r"Green Bullet",
    r"JT-30", r"Astatic", r"KLANG",
    # processors, plug-ins, software, pitch tools
    r"Melodyne\w*", r"Auto-?Tune\w*", r"Flex-?Tune", r"Soothe\w*", r"Antares", r"Waves", r"iZotope", r"Neve", r"1073",
    r"1176\w*", r"LA-?2A\w*", r"LA-?3A", r"CL-1B", r"Fairchild\w*", r"SSL\w*", r"Distressor", r"Pultec\w*", r"API",
    r"EMT", r"Lexicon\w*", r"H3000\w*", r"Eventide", r"AMS", r"RMX16", r"Ableton", r"Pro Tools", r"Serato", r"CDJs?",
    r"FL Studio", r"Logic Pro", r"MPC\w*", r"Akai", r"SP-?404\w*", r"SP-?1200", r"S950\w*", r"RC-20", r"MicroShift\w*",
    r"Valhalla\w*", r"FabFilter", r"Teletronix", r"Tube-Tech", r"Manley", r"Urei", r"UREI", r"Bricasti", r"Cooper Time Cube",
    r"Echoplex", r"Space Echo", r"Binson", r"Roland", r"Dimension D", r"Chandler",
    # instruments and amps by brand / model
    r"TR-?\d+\w*", r"TB-?303", r"CR-?78", r"SH-?101\w*", r"Juno\w*", r"Korg", r"Ketron", r"Yamaha", r"DX ?\d+\w*", r"PSR",
    r"Linn\w*", r"Moog", r"Minimoog", r"ARP", r"Solina", r"B-?3", r"C-?3", r"A-?100", r"Leslie\w*", r"Rhodes",
    r"Wurlitzer", r"Clavinet", r"Mellotron", r"Farfisa", r"Vox", r"Fender", r"Telecasters?", r"Tele", r"Strat\w*",
    r"Jazzmasters?", r"Jaguars?", r"Rickenbacker", r"Gibson", r"ES-335", r"Les Paul", r"Bassman", r"Twin Reverb",
    r"Super Reverb", r"Deluxe Reverb", r"JC-?120", r"Marshall\w*", r"Ampeg\w*", r"SansAmp\w*", r"Big Muff", r"Precision Bass",
    r"P-bass", r"Dobro", r"Hohner", r"Fishman", r"Realist", r"Underwood", r"Mesa", r"Boogie", r"Peavey", r"Steinway",
    r"Bösendorfer", r"Kawai", r"Nord", r"Kemper", r"Fractal", r"Line 6", r"Helix", r"Pearl", r"Ludwig", r"Zildjian", r"Sabian",
    # live systems and consoles
    r"DiGiCo", r"SD ?7", r"RIVAGE", r"Quantum", r"Axient", r"L-Acoustics", r"K2", r"L-ISA", r"Meyer", r"d&b", r"Spacemap",
    r"TiMax", r"Midas", r"Avid", r"Allen ?& ?Heath", r"Soundcraft", r"Clair", r"Martin Audio",
    # platforms and services
    r"Spotify\w*", r"YouTube\w*", r"Apple(?: Music)?", r"Tidal", r"Amazon(?: Music)?", r"Deezer", r"Anghami", r"SoundCloud",
    r"TikTok", r"WhatsApp", r"Netflix", r"Bluetooth", r"Atmos", r"Dolby", r"MultiTracks\w*", r"Loop Community", r"Shazam",
    # standards bodies and authorities used as evidence
    r"WHO", r"NIOSH", r"OSHA", r"AES", r"AAO-HNS", r"EBU", r"ARIB", r"ATSC", r"ITU", r"DIN", r"NHK",
    # publications and research outfits
    r"Sound On Sound", r"Mix magazine", r"Tape Op", r"ProSoundWeb", r"FOH Online", r"Luminate", r"IFPI", r"Billboard",
]
CITATION_FORMS = [
    r"\baccording to\b",
    r"\bput it\b",
    r"\b(?:engineers?|mixers?|producers?) (?:have )?(?:reported|reports|says?|said|recommends?|warns?|warning)\b",
    r"\b(?:a|one) (?:\d{4} )?(?:study|survey|analysis|report) (?:found|shows?|of)\b",
    r"\bhttps?://",
]
BRAND_RE = re.compile(r"(?<![\w-])(?:" + "|".join(BRAND_WORDS) + r")(?![\w])")
CITE_RE = re.compile("(?i:" + "|".join(CITATION_FORMS) + r")|\bper [A-Z]\w+")
