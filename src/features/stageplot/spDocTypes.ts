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
