/**
 * stageplot/spDocTypes — the GIG PACKET as a document model: WHAT is on the
 * pages, with no layout engine named. One frozen snapshot of a project is
 * turned into one `SpDoc` (spPacket.ts), and every output is made from that
 * same `SpDoc`:
 *
 *   • the on-screen preview (React Native views + the plot in SVG)
 *   • the HTML sheet that the phone turns into a PDF, prints or shares
 *   • the PDF file a browser downloads (spPdf.ts writes it directly)
 *   • the structured text view (for a screen reader, and for copying)
 *
 * So the plot page and the table pages can never come from different
 * revisions, and a renderer cannot leave a row out: it is given the rows.
 *
 * Rules a renderer must keep (handoff §7):
 *   • white paper, dark lines, readable in grayscale; nothing told by color
 *   • table text at least 10 pt: add a page before shrinking
 *   • a table's header repeats on every page it runs to; a row is not split
 *   • a footer on every page: band, revision, page number
 *   • print EVERY row and every note: never cut text to fit a sheet
 *
 * Types only.
 */
import type { SpShape } from './spSymbols.ts';
import type { SpObjectKind } from './spTypes.ts';
import type { SpId, SpPaper } from './spTypes.ts';

/** One thing drawn on the plot, already placed (meters; 0,0 = the upstage,
 *  stage-right corner of the stage; +x toward stage left, +y toward the
 *  audience). */
export type SpDocPlotItem = {
  id: SpId;
  shapes: SpShape[];
  /** A short word printed INSIDE the symbol ("DI", "AC"), at `at`; '' = none. */
  tag: string;
  /** The symbol's center. */
  at: { x: number; y: number };
  /** The name printed beside it (a performer's name, "Wedge 1"); '' = none. */
  label: string;
  /** Where the label's top-center goes (under the symbol). */
  labelAt: { x: number; y: number };
  /** Small boxed references: input channel numbers ("7", "9–10") and monitor
   *  mix codes ("M3"). Printed beside the symbol. */
  badges: string[];
  /** A person: its name is printed larger than an equipment label. */
  person: boolean;
  /** A thin line from the label to its own symbol (meters), set when the
   *  label could not be placed right beside the symbol without sitting on
   *  another object (review 2, 2026-11-12). A renderer draws it as a hairline
   *  in the muted gray, under the symbols. Absent = no line. */
  leader?: { from: { x: number; y: number }; to: { x: number; y: number } };
};

export type SpDocPlot = {
  widthM: number;
  depthM: number;
  toScale: boolean;
  /** "24 ft × 16 ft (estimated)" or "Not to scale". Always printed. */
  sizeNote: string;
  /** Space drawn around the stage (meters) so nearby offstage items show. */
  marginM: number;
  /** One grid step in meters when the band wants the grid printed, else 0. */
  gridM: number;
  items: SpDocPlotItem[];
  /** Printed under the plot when the band wrote one (overhead L/R viewpoint). */
  viewNote: string;
  /** What the references on the plot mean, in words. */
  legend: string[];
  /** true = this drawing needs room (a plot-only packet, or six or more
   *  performers): the renderer lets it grow to the height the page has left
   *  after the header, the key and the notes, and starts the next section on
   *  a new page. false = the usual cap (`spPlotMaxH`). Review 2, 2026-11-12. */
  roomy: boolean;
  /** THE KEY: each kind of symbol that is on this plot, with its name. It is
   *  part of the drawing (owner 2026-11-12): every renderer prints it WITH
   *  the plot, in every packet kind, and never leaves an entry out. A
   *  renderer scales each symbol into its own small cell. */
  key: SpDocKeyItem[];
  /** A stage that is not a rectangle (2026-11-13): a renderer draws THIS in
   *  place of the plain rectangle, its grid and its front edge. Absent = the
   *  rectangle, 0…widthM × 0…depthM, as always. In meters, in the plot's own
   *  space (0,0 = the top left of everything the stage floor covers). */
  deck?: SpDocDeck;
};

export type SpDocDeck = {
  shape: 'thrust' | 'round' | 'wings';
  /** The performance area's outline: a closed polygon [x, y…] or a circle. */
  outline: { t: 'poly'; pts: number[] } | { t: 'circle'; cx: number; cy: number; r: number };
  /** The edges the audience sees, drawn heavier. `all`: the whole outline. */
  front: { all: boolean; lines: [number, number, number, number][] };
  /** Offstage floor drawn on the plot (the wings): a dashed box with a name. */
  areas: { x: number; y: number; w: number; h: number; name: string }[];
  /** Grid lines inside the shape (empty when no grid is printed). */
  grid: [number, number, number, number][];
  /** The four words round the drawing. */
  words: { up: string; down: string; right: string; left: string };
  /** Where the MAIN stage's upstage, stage-right corner is, and its size, so
   *  a point can be said in stage words again (the text view). */
  origin: { x: number; y: number };
  mainW: number;
  mainD: number;
  /** The shape fields the words are said from. */
  stage: { shape: 'thrust' | 'round' | 'wings'; thrustWidth: number | null; thrustDepth: number | null; wingWidth: number | null; roundForm: 'circle' | 'square'; roundRef: string; width: number | null; depth: number | null };
};

/** One entry of the plot's key: a symbol, drawn small, and what it is. */
export type SpDocKeyItem = {
  kind: SpObjectKind;
  /** "Performer", "Wedge monitor (wide side faces the performer)". */
  name: string;
  /** The symbol's footprint in meters, and its shapes around 0,0. */
  w: number;
  h: number;
  shapes: SpShape[];
  /** A short word printed inside the symbol ("DI", "IEM", "AC"), or ''. */
  tag: string;
};

export type SpDocColumn = {
  key: string;
  label: string;
  /** Relative width: a renderer shares the page width in these proportions. */
  width: number;
  align?: 'left' | 'center';
};

export type SpDocRow = {
  cells: Record<string, string>;
  /** Printed in bold (a required item, a monitor-only input). */
  strong?: boolean;
  /** A full-width line under the row (its notes). Kept with the row. */
  note?: string;
};

export type SpDocTable = {
  columns: SpDocColumn[];
  rows: SpDocRow[];
  /** Printed in place of the rows when there are none ("No inputs yet."). */
  empty: string;
};

export type SpDocBlock =
  | { t: 'heading'; level: 1 | 2; text: string }
  | { t: 'para'; text: string; tone?: 'normal' | 'muted' | 'strong' }
  /** Label / value pairs (the header facts: venue, date, contact…). */
  | { t: 'facts'; rows: [label: string, value: string][] }
  | { t: 'list'; items: string[] }
  | { t: 'table'; table: SpDocTable }
  | { t: 'plot'; plot: SpDocPlot };

export type SpDocSection = {
  id: 'plot' | 'inputs' | 'monitors' | 'equipment' | 'notes';
  title: string;
  blocks: SpDocBlock[];
  /** Where the section starts:
   *    'page'  always on a new page
   *    'auto'  on a new page only when less than a third of the page is left
   *            (so a section never starts with two lines at the foot of a
   *            page, and a short packet is not padded with blank paper)
   *    'none'  it follows on (the compact packet) */
  breakBefore: 'page' | 'auto' | 'none';
};

export type SpDoc = {
  /** "The Example Four — Stage plot and technical packet". */
  title: string;
  paper: SpPaper;
  /** Printed on every page: "The Example Four · Revision 3" (the renderer
   *  adds "· Page N of M"). */
  footer: string;
  /** Printed beside the title on every page while the project is a draft or
   *  has anything that must be corrected: "DRAFT". '' = none. */
  stamp: string;
  sections: SpDocSection[];
  /** "TheExampleFour_StagePlot_2026-12-05_Rev03.pdf" (no date part when the
   *  project has none). */
  fileName: string;
  revision: number;
  /** Milliseconds since 1970: when the snapshot was frozen. */
  generatedAt: number;
};
