/**
 * The ONE off switch for the Audio Community (owner 2026-11-05, report items
 * 7 and 26). While false: no way in from Home or Pro Registry, no badge, no
 * deep link or push tap into the directory, and no badge reads to the server.
 * ON since 2026-11-07: the owner chose to ship the forum by OTA (option A).
 *
 * LEAF ON PURPOSE: no imports, so the pure link rules and the start graph can
 * read it (reference_start_graph_cap).
 */
export const COMMUNITY_VISIBLE = true;
