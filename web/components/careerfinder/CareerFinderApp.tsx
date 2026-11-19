"use client";

/**
 * The web Audio Career Finder (owner 2026-11-19). It is the app's Career Finder
 * on a web page: intro, the 28 questions, results, one family, all families and
 * How this works. Logic and data come from web/lib/careerfinder/, a generated
 * copy of the app's files (scripts/sync-career-finder-web.mjs). Screen wording is
 * the app's approved text (owner review 2026-11-14, must-do D63), copied as is;
 * test/webCareerFinder_20261119.test.ts pins the key lines to the app screens.
 *
 * Web-only differences, all because the website has no account and no study list:
 *   • adding topics to a study list and opening labs happen in the app, so those
 *     steps say "In the app" and the page ends with the store badges;
 *   • no feedback form (it collects nothing); corrections go by the visitor's own mail app.
 *
 * Answers live only in this browser (localStorage). Nothing is sent anywhere.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { StoreBadges } from "@/components/GetTheApp";
import { APP_LINKS_LIVE } from "@/lib/appstore";
import { DIMENSION_CODES, DIMENSIONS, type DimensionCode } from "@/lib/careerfinder/dimensions";
import { ANSWERS, QUESTIONS, QUESTION_COUNT, type QuestionId, type Response } from "@/lib/careerfinder/questions";
import { FAMILIES, FAMILY_COUNT, familyById } from "@/lib/careerfinder/families";
import {
  CLARITY_LABEL,
  CLARITY_RULES,
  FAMILY_WEIGHTS,
  band,
  clarityCopy,
  computeResult,
  explainFamily,
  unknownNote,
  type DimensionScores,
  type FamilyScore,
  type Responses,
} from "@/lib/careerfinder/scoring";
import {
  CAREER_COUNT,
  CAREER_INDEX_VERSION,
  CENTRALITY,
  careersInFamily,
  centralitySplit,
  entryPoints,
  familyFieldOf,
  familyMetaOf,
  familyView,
  furtherEducationForTitle,
  isRegulatedTitle,
  type AudioCentrality,
  type Career,
} from "@/lib/careerfinder/careerIndex";
import {
  EDUCATION_NOT_REPLACED,
  LICENSED_WARNING,
  PREPARATION_ROUTES_NOTE,
  educationChip,
  prepForDisplay,
} from "@/lib/careerfinder/educationNote";
import { LAB_FOR_DIMENSION } from "@/lib/careerfinder/labsForDimension";

/* ── the app's approved text (src/screens/careerfinder/*.tsx) ─────────── */

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const ASSESSMENT_VERSION = "career-finder-v1";
const CORRECTIONS_MAIL = "info@proaudiotrainingacademy.com";

const FINDER_INTRO = {
  lead: "Which kinds of audio work would you enjoy doing?",
  body: `Rate ${QUESTION_COUNT} activities. In about five minutes you’ll have five career families worth exploring, and a place in the Academy to start on each.`,
  trust: "Free. No account needed. Your answers stay on this device.",
  howTo:
    "You’ll rate activities, not job titles. Rate each one only by how much you would enjoy it. Whether you would be good at it, or could do it today, does not matter here. If you don’t know what an activity is like, say so. That is a useful answer, never a low score.",
  scope:
    "This is a career-exploration tool. It does not measure your worth, guarantee success or decide what you can learn. It gives no percentages, verdicts or talent scores, only possibilities to explore, each with a place to start learning.",
};
const RESULTS_LEAD =
  "These five audio career families draw most on what you said you would enjoy. Start with the top one.";
const RESULTS_NOTE =
  "These are possibilities to explore, not limits on what you can pursue. Interests change with experience, so your results may change too.";
const RESET_MESSAGE = "Clears your answers and results on this device. Saved families are kept.";

const STEM = "How would you feel about ";
const HALF = Math.floor(QUESTION_COUNT / 2);
function toGoText(index: number): string {
  const left = QUESTION_COUNT - (index + 1);
  return left === 0 ? "Last question" : `${left} to go`;
}
const MILESTONE: Record<number, string> = {
  [Math.round(QUESTION_COUNT / 4) - 1]: "A quarter done",
  [HALF - 1]: `Halfway — ${QUESTION_COUNT - HALF} to go`,
  [QUESTION_COUNT - 8]: "Last seven",
};
const ADVANCE_MS = 300;
const PAGE = 12;

/* ── the visitor's answers, on this device only ───────────────────────── */

type Rec = { responses: Responses; index: number; completed: boolean; saved: string[] };
const EMPTY: Rec = { responses: {}, index: 0, completed: false, saved: [] };
const KEY = "pata-web:careerfinder:v1";
const QIDS = new Set<string>(QUESTIONS.map((q) => q.id));
const VALID = new Set<unknown>(ANSWERS.map((a) => a.value));

/** null = the browser refused storage (private window, blocked site data). */
function readRec(): Rec | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<Rec>;
    const responses: Responses = {};
    for (const [k, v] of Object.entries(p.responses ?? {})) if (QIDS.has(k) && VALID.has(v)) responses[k as QuestionId] = v as Response;
    return {
      responses,
      index: Number.isInteger(p.index) ? Math.max(0, Math.min(QUESTION_COUNT - 1, p.index as number)) : 0,
      completed: p.completed === true,
      saved: Array.isArray(p.saved) ? p.saved.filter((id): id is string => typeof id === "string" && !!familyById(id)) : [],
    };
  } catch {
    return null;
  }
}
function writeRec(r: Rec): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r));
    return true;
  } catch {
    return false;
  }
}
const answeredCount = (r: Rec) => QUESTIONS.filter((q) => q.id in r.responses).length;
const allAnswered = (r: Rec) => answeredCount(r) === QUESTION_COUNT;
const firstUnansweredIndex = (r: Rec) => {
  const i = QUESTIONS.findIndex((q) => !(q.id in r.responses));
  return i < 0 ? QUESTION_COUNT - 1 : i;
};

/* ── views, kept in the address so the browser's Back works ───────────── */

type View =
  | { name: "intro" }
  | { name: "quiz" }
  | { name: "results" }
  | { name: "families" }
  | { name: "about" }
  | { name: "family"; id: string; from?: "results" | "browse" };

function parseHash(h: string): View {
  const s = h.replace(/^#/, "");
  if (s === "questions") return { name: "quiz" };
  if (s === "results") return { name: "results" };
  if (s === "families") return { name: "families" };
  if (s === "how-it-works") return { name: "about" };
  const m = /^family\/([a-z0-9-]+)(?:\/(results|browse))?$/.exec(s);
  if (m && familyById(m[1])) return { name: "family", id: m[1], from: m[2] as "results" | "browse" | undefined };
  return { name: "intro" };
}
function hashOf(v: View): string {
  switch (v.name) {
    case "quiz": return "#questions";
    case "results": return "#results";
    case "families": return "#families";
    case "about": return "#how-it-works";
    case "family": return `#family/${v.id}${v.from ? `/${v.from}` : ""}`;
    default: return "";
  }
}

export default function CareerFinderApp() {
  const [rec, setRec] = useState<Rec>(EMPTY);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(true);
  const [view, setView] = useState<View>({ name: "intro" });
  const top = useRef<HTMLDivElement>(null);

  // The saved answers live in this browser's storage, which the server render cannot see, so
  // they are read once after the page mounts (reading during render would mismatch the HTML).
  useEffect(() => {
    const r = readRec();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one read of browser storage after mount
    setSaving(r !== null);
    setRec(r ?? { ...EMPTY });
    setReady(true);
    const sync = () => setView(parseHash(window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const update = useCallback(
    (fn: (r: Rec) => Rec) => {
      setRec((prev) => {
        const next = fn(prev);
        if (saving) setSaving(writeRec(next));
        return next;
      });
    },
    [saving],
  );

  const go = useCallback((v: View, replace = false) => {
    const url = `${window.location.pathname}${window.location.search}${hashOf(v)}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setView(v);
    top.current?.scrollIntoView({ block: "start" });
  }, []);
  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else go({ name: "intro" }, true);
  }, [go]);

  const ctx: Ctx = { rec, saving, update, go, back };

  return (
    <div ref={top} className="mx-auto max-w-2xl scroll-mt-24 px-4 pt-10 sm:px-6">
      {!ready ? (
        <p className="text-center text-sm text-text-muted" aria-live="polite">Loading your answers…</p>
      ) : view.name === "quiz" ? (
        <Quiz ctx={ctx} />
      ) : view.name === "results" ? (
        <Results ctx={ctx} />
      ) : view.name === "family" ? (
        <Family ctx={ctx} id={view.id} from={view.from} />
      ) : view.name === "families" ? (
        <FamilyList ctx={ctx} />
      ) : view.name === "about" ? (
        <About ctx={ctx} />
      ) : (
        <Intro ctx={ctx} />
      )}
    </div>
  );
}

type Ctx = {
  rec: Rec;
  saving: boolean;
  update: (fn: (r: Rec) => Rec) => void;
  go: (v: View, replace?: boolean) => void;
  back: () => void;
};

function confirmReset(onConfirm: () => void) {
  if (window.confirm(`Reset the Career Finder? ${RESET_MESSAGE}`)) onConfirm();
}
const resetRec = (r: Rec): Rec => ({ ...EMPTY, saved: r.saved });
const toggleSaved = (id: string) => (r: Rec): Rec => ({
  ...r,
  saved: r.saved.includes(id) ? r.saved.filter((s) => s !== id) : [...r.saved, id],
});

/* ── shared pieces (the app's kit, as web elements) ───────────────────── */

function Shell({ kicker, title, onBack, backLabel = "Back", children }: { kicker: string; title: string; onBack?: () => void; backLabel?: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      {onBack ? (
        <button type="button" onClick={onBack} className="min-h-11 text-sm font-semibold text-text-sub hover:text-foreground" aria-label={backLabel}>
          ‹ {backLabel.startsWith("Back") ? backLabel : "Back"}
        </button>
      ) : null}
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">{kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-wide text-foreground sm:text-4xl">{title}</h1>
      </header>
      {children}
    </div>
  );
}

function Card({ tone = "plain", children }: { tone?: "plain" | "raised" | "amber" | "ok"; children: ReactNode }) {
  const t =
    tone === "raised" ? "border-[#333] bg-surface-raised" :
    tone === "amber" ? "border-[rgba(255,198,77,0.35)] bg-[#17130a]" :
    tone === "ok" ? "border-[rgba(55,224,95,0.35)] bg-[#0f1a12]" :
    "border-border bg-surface";
  return <section className={`space-y-3 rounded-xl border p-4 sm:p-5 ${t}`}>{children}</section>;
}

function Label({ tone = "amber", children }: { tone?: "amber" | "green" | "cyan" | "muted"; children: ReactNode }) {
  const c = tone === "green" ? "text-green" : tone === "cyan" ? "text-[#7fd4ff]" : tone === "muted" ? "text-text-muted" : "text-[#d99f1f]";
  return <h2 className={`font-display text-xs font-semibold uppercase tracking-[0.18em] ${c}`}>{children}</h2>;
}

const Lead = ({ children }: { children: ReactNode }) => <p className="text-lg leading-relaxed text-foreground">{children}</p>;
const Body = ({ muted, children }: { muted?: boolean; children: ReactNode }) => (
  <p className={`leading-relaxed ${muted ? "text-sm text-text-muted" : "text-text-sub"}`}>{children}</p>
);
const Em = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>;

function Btn({ label, onClick, tone = "plain", disabled, aria, title }: { label: string; onClick: () => void; tone?: "plain" | "green" | "danger"; disabled?: boolean; aria?: string; title?: string }) {
  const t =
    tone === "green" ? "border-green bg-[#173021] text-green hover:bg-[#1c3b28]" :
    tone === "danger" ? "border-[rgba(255,75,58,0.5)] bg-[#1c0f0d] text-[#ff8a7d] hover:bg-[#261310]" :
    "border-border bg-[#131315] text-foreground hover:bg-[#1a1a1f]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      title={title}
      className={`min-h-12 w-full rounded-xl border px-4 font-display text-sm font-semibold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${t}`}
    >
      {label}
    </button>
  );
}

function TextBtn({ label, onClick, muted }: { label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-11 text-left text-sm underline underline-offset-2 ${muted ? "text-text-muted hover:text-text-sub" : "text-amber hover:text-amber-deep"}`}>
      {label}
    </button>
  );
}

const STRENGTH_WORD = { strong: "strong", some: "some", neutral: "neutral", little: "little", unknown: "unexplored" } as const;
const strengthOf = (s: number | undefined, insufficient?: boolean) => (insufficient || s == null ? "unknown" : band(s));

function DimChip({ code, dims, primary }: { code: DimensionCode; dims?: DimensionScores; primary?: boolean }) {
  const d = dims?.[code];
  const strength = dims ? strengthOf(d?.score, d?.insufficient) : null;
  const strong = strength === "strong";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${strong ? "border-[rgba(127,212,255,0.55)] bg-[#0f1a22]" : primary ? "border-[#444] bg-[#18181b]" : "border-border bg-[#141416]"}`}
    >
      <span className={strong ? "font-semibold text-[#7fd4ff]" : "font-semibold text-foreground"}>{DIMENSIONS[code].label}</span>
      {primary ? <span className="text-text-muted">· main</span> : null}
      {strength ? <span className="text-text-sub">· {STRENGTH_WORD[strength]}</span> : null}
    </span>
  );
}

function CentralityChip({ value, count }: { value: AudioCentrality; count?: number }) {
  const c = CENTRALITY[value];
  const tone = value === "core" ? "text-amber border-[rgba(255,198,77,0.45)]" : value === "specialized" ? "text-[#7fd4ff] border-[rgba(127,212,255,0.45)]" : "text-text-sub border-border";
  return (
    <span title={c.explain} className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 font-display text-[11px] font-medium uppercase tracking-wider ${tone}`}>
      {count != null ? `${count} ` : ""}
      {c.label}
    </span>
  );
}

function Spectrum({ dims, highlight }: { dims: DimensionScores; highlight: DimensionCode[] }) {
  const W = 340, H = 132, n = DIMENSION_CODES.length, gap = 6, left = 10, right = 10;
  const bw = (W - left - right - gap * (n - 1)) / n;
  const topY = 14, base = H - 26;
  const summary = DIMENSION_CODES.map((c) => `${DIMENSIONS[c].label}: ${dims[c].insufficient ? "not enough evidence" : `${strengthOf(dims[c].score)} interest`}`).join("; ");
  return (
    <figure className="w-full">
      <svg role="img" aria-label={`Your interest by activity. ${summary}. Heights show what you said you would enjoy, not ability.`} viewBox={`0 0 ${W} ${H}`} className="h-[132px] w-full" preserveAspectRatio="none">
        <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={10} fill="#0a0a0c" stroke="#2c2c2c" />
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={left} y1={base - (base - topY) * g} x2={W - right} y2={base - (base - topY) * g} stroke="rgba(255,255,255,0.06)" />)}
        <line x1={left} y1={base} x2={W - right} y2={base} stroke="#8a8b93" />
        {DIMENSION_CODES.map((c, i) => {
          const d = dims[c];
          const x = left + i * (bw + gap);
          const h = Math.max(2, (base - topY) * d.score);
          const hi = highlight.includes(c);
          const fill = d.insufficient ? "none" : hi ? "#7fd4ff" : d.score >= 0.75 ? "#ffc64d" : d.score >= 0.5 ? "#d99f1f" : "#3a3a40";
          return (
            <g key={c}>
              <rect x={x} y={base - h} width={bw} height={h} rx={2} fill={fill} stroke={d.insufficient ? "#8a8b93" : "none"} strokeDasharray={d.insufficient ? "3 2" : undefined} />
              {d.insufficient ? <text x={x + bw / 2} y={base - h / 2 + 3} fontSize={10} fill="#8a8b93" textAnchor="middle">?</text> : null}
              <text x={x + bw / 2} y={H - 11} fontSize={9.5} fill={hi ? "#7fd4ff" : "#a6a6ad"} textAnchor="middle">{c}</text>
            </g>
          );
        })}
      </svg>
      {highlight.length ? (
        <figcaption className="mt-1 text-xs text-text-sub">{highlight.map((c) => `${c} ${DIMENSIONS[c].label}`).join("  ·  ")}</figcaption>
      ) : null}
    </figure>
  );
}

/** Example titles with the ⚠ disclosures, exactly as the app's results card and family page. */
function Examples({ examples, inline }: { examples: readonly string[]; inline?: boolean }) {
  const gated = (e: string) => isRegulatedTitle(e) || !!furtherEducationForTitle(e);
  return (
    <div className="space-y-1.5">
      {inline ? (
        <p className="text-sm leading-snug text-text-sub">
          <span className="mr-2 font-display text-[11px] font-medium uppercase tracking-widest text-[#d99f1f]">For example</span>
          {examples.map((e, i) => (
            <span key={e}>
              {i > 0 ? " · " : ""}
              {e}
              {gated(e) ? <span className="text-[#ffb060]" aria-label="further education or a license required"> ⚠</span> : null}
            </span>
          ))}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {examples.map((e) => (
            <li key={e} className="font-medium text-foreground/90">
              ▸ {e}
              {gated(e) ? <span className="text-[#ffb060]" aria-label="further education or a license required"> ⚠</span> : null}
            </li>
          ))}
        </ul>
      )}
      {examples.some(isRegulatedTitle) ? <p className="text-xs leading-snug text-[#ffb060]">{LICENSED_WARNING}</p> : null}
      {examples.map((e) => {
        const need = furtherEducationForTitle(e);
        return need ? (
          <p key={`edu-${e}`} className="text-xs leading-snug text-[#ffb060]">
            ⚠ {e}: {need} {EDUCATION_NOT_REPLACED}
          </p>
        ) : null;
      })}
    </div>
  );
}

/** The end of results and family pages (owner 2026-11-19: "Yes, at the end"). */
function InTheApp() {
  return (
    <Card>
      <Label>Take it further in the app</Label>
      <Body>In the app, each career family links to the Academy topics and labs that lead into it, and you can add those topics to your study list.</Body>
      {APP_LINKS_LIVE ? <StoreBadges /> : <Link href="/get" className="text-amber underline underline-offset-2">Get the app</Link>}
    </Card>
  );
}

/**
 * The app's own Career Finder menu card (owner 2026-11-19: "use the same career finder image as
 * in the app main menu so there is continuity and familiarity"). The picture is the app's
 * course-cards/career_finder.webp, byte for byte (copied unchanged from
 * assets/Menu Course Cards/webp/); the frame, wash and title follow the app's
 * menu card in src/screens/courses/CourseSelectionScreen.tsx. Owner 2026-11-19: no green
 * eyebrow above it and no button inside it; the picture and its title only.
 */
function MenuCard() {
  return (
    <div className="mx-auto w-full max-w-[240px] shrink-0 sm:mx-0 sm:w-[220px]">
      <div className="relative aspect-[941/1672] overflow-hidden rounded-2xl border-2 border-[rgba(55,224,95,0.6)] bg-[#0c0c0c]">
        <Image src="/career-finder/career_finder.webp" alt="" fill priority sizes="240px" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0) 30%, rgba(8,8,10,0.45) 58%, rgba(8,8,10,0.95) 100%)" }}
        />
        <div className="absolute inset-x-0 top-0 p-4">
          <p className="text-center font-display text-2xl font-semibold tracking-wide text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">Career Finder</p>
        </div>
      </div>
    </div>
  );
}

/* ── intro ────────────────────────────────────────────────────────────── */

function Intro({ ctx }: { ctx: Ctx }) {
  const { rec, saving, update, go } = ctx;
  const answered = answeredCount(rec);
  const inProgress = answered > 0 && !rec.completed;
  const stored = QUESTIONS[rec.index];
  const resumeAt = allAnswered(rec) || (stored && !(stored.id in rec.responses)) ? rec.index : firstUnansweredIndex(rec);
  const savedFamilies = rec.saved.map(familyById).filter((f): f is NonNullable<typeof f> => !!f);
  const start = () => go({ name: "quiz" });
  const changeAnswers = () => { update((r) => ({ ...r, index: 0 })); go({ name: "quiz" }); };


  return (
    <Shell kicker="Audio Career Finder · Free · No account" title="Audio Career Finder">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <MenuCard />
        <div className="flex-1 space-y-5">
      <div className="grid grid-cols-4 gap-1.5" aria-label={`${fmt(CAREER_COUNT)} job titles, ${FAMILY_COUNT} career families, ${QUESTION_COUNT} questions, about five minutes`} role="group">
        {[
          { v: fmt(CAREER_COUNT), l: "Titles", c: "text-amber" },
          { v: String(FAMILY_COUNT), l: "Families", c: "text-amber" },
          { v: String(QUESTION_COUNT), l: "Questions", c: "text-foreground" },
          { v: "~5", l: "Minutes", c: "text-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-[#262626] bg-[#141414] py-2.5 text-center" aria-hidden>
            <div className={`font-display text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="font-display text-[10px] font-semibold uppercase tracking-wider text-text-sub">{s.l}</div>
          </div>
        ))}
      </div>

      <Lead>{FINDER_INTRO.lead}</Lead>
      <Body>{FINDER_INTRO.body}</Body>

      <div className="space-y-2">
        {rec.completed ? (
          <>
            <Btn label="View my results" tone="green" onClick={() => go({ name: "results" })} />
            <Btn label="Change my answers" onClick={changeAnswers} />
          </>
        ) : inProgress ? (
          <>
            <Btn label={`Continue · Question ${Math.min(QUESTION_COUNT, resumeAt + 1)}`} tone="green" onClick={start} aria={`Continue at question ${resumeAt + 1}`} />
            <p className="text-center text-sm text-text-muted">
              {allAnswered(rec) ? "All answered" : `${QUESTION_COUNT - answered} to go`} · {saving ? "saved on this device" : "not saved on this device"}
            </p>
          </>
        ) : (
          <>
            <Btn label="Start Career Finder" tone="green" onClick={start} />
            <p className="text-center text-sm text-text-muted">
              {saving ? FINDER_INTRO.trust : "This browser is not letting the page save, so your answers are kept only until you leave this page."}
            </p>
          </>
        )}
      </div>
        </div>
      </div>

      <Card>
        <Label>How to answer</Label>
        <Body>{FINDER_INTRO.howTo}</Body>
        <Label>What you get</Label>
        <Body>Your answers become a profile across {DIMENSION_CODES.length} kinds of audio work. That profile is compared with {FAMILY_COUNT} career families, and the families that draw most on what you enjoy come to the top. Each one shows why it appeared and which Academy topics lead into it.</Body>
        <Body>{FINDER_INTRO.scope}</Body>
      </Card>

      {savedFamilies.length ? (
        <div className="space-y-2">
          <Label tone="green">{saving ? "Saved families" : "Starred families — not saved on this device"}</Label>
          {savedFamilies.map((f) => (
            <button key={f.id} type="button" onClick={() => go({ name: "family", id: f.id })} className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-[#232323] bg-[#161616] px-3.5 text-left">
              <span className="flex-1 font-display font-medium text-amber">{f.name}</span>
              <span className="text-text-sub" aria-hidden>›</span>
            </button>
          ))}
        </div>
      ) : null}

      {answered > 0 || rec.completed ? (
        <Btn label="Reset & start over" tone="danger" onClick={() => confirmReset(() => update(resetRec))} aria="Reset and start over" />
      ) : null}

      <div className="flex flex-col">
        <TextBtn label={`Browse all ${FAMILY_COUNT} career families`} onClick={() => go({ name: "families" })} />
        <TextBtn label="How this works, and what it does not measure" onClick={() => go({ name: "about" })} />
      </div>
    </Shell>
  );
}

/* ── the questions ────────────────────────────────────────────────────── */

function Quiz({ ctx }: { ctx: Ctx }) {
  const { rec, saving, update, go, back } = ctx;
  const [index, setIndex] = useState(() => {
    const q = QUESTIONS[rec.index];
    return allAnswered(rec) ? Math.min(rec.index, QUESTION_COUNT - 1) : q && !(q.id in rec.responses) ? rec.index : firstUnansweredIndex(rec);
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);
  const live = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const q = QUESTIONS[index];
  const current = rec.responses[q.id];
  const answeredThis = q.id in rec.responses;
  const last = index === QUESTION_COUNT - 1;
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const move = (i: number) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const idx = Math.max(0, Math.min(QUESTION_COUNT - 1, i));
    setIndex(idx);
    update((r) => ({ ...r, index: idx }));
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    update((r) => ({ ...r, completed: true }));
    go({ name: "results" }, true);
  };
  const choose = (value: Response) => {
    const nextResponses = { ...rec.responses, [q.id]: value };
    update((r) => ({ ...r, responses: { ...r.responses, [q.id]: value } }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!last) move(index + 1);
      else if (QUESTIONS.every((x) => x.id in nextResponses)) finish();
    }, reduceMotion ? 0 : ADVANCE_MS);
  };
  const canFinish = last && allAnswered(rec);
  const progress = (index + (answeredThis ? 1 : 0)) / QUESTION_COUNT;

  return (
    <Shell
      kicker="Audio Career Finder"
      title={`Question ${index + 1}`}
      onBack={back}
      backLabel={saving ? "Leave the questions. Your answers are saved." : "Leave the questions. Your answers could not be saved on this device."}
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e22]" role="progressbar" aria-label={`Question ${index + 1}, ${toGoText(index)}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-[#7fd4ff] transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
      <p ref={live} className="-mt-2 text-sm text-text-muted" aria-live="polite">{MILESTONE[index] ?? toGoText(index)}</p>

      <h2 className="text-xl leading-snug font-medium text-foreground sm:text-2xl">
        <span className="font-normal text-text-sub">{STEM}</span>
        {q.text.replace(new RegExp(`^${STEM}`), "").replace(/\?$/, "")}?
      </h2>

      <div role="radiogroup" aria-label="Your answer" className="space-y-1.5">
        {ANSWERS.map((a) => {
          const on = answeredThis && current === a.value;
          const unknown = a.value === null;
          return (
            <button
              key={String(a.value)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(a.value)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left transition-colors ${unknown ? "mt-2 border-dashed" : ""} ${on ? "border-[#7fd4ff] bg-[#0f1a22]" : unknown ? "border-[#3a3a44] bg-[#0f0f12] hover:bg-[#16161b]" : "border-[#2c2c2c] bg-[#131315] hover:bg-[#1a1a1f]"}`}
            >
              <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${unknown ? "border-dashed" : ""} ${on ? "border-[#7fd4ff] bg-[#7fd4ff]" : "border-[#3a3a44]"}`}>
                {on ? <span className="text-[13px] font-bold text-[#08141a]">✓</span> : null}
              </span>
              <span className={`flex-1 ${on ? "font-semibold text-foreground" : unknown ? "text-text-sub" : "text-[#e6e6e6]"}`}>{a.label}</span>
            </button>
          );
        })}
      </div>
      {index === 0 || (answeredThis && current === null) ? (
        <p className="text-sm text-text-muted">“I don’t know enough about this” is never counted as dislike. It only marks an activity you haven’t tried yet.</p>
      ) : null}

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => move(index - 1)} disabled={index === 0} aria-label="Back one question" className="min-h-12 rounded-xl border border-border px-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground disabled:opacity-40">
          ‹ Back
        </button>
        <div className="flex-1" />
        {last ? (
          <button type="button" onClick={finish} disabled={!canFinish} aria-label={canFinish ? "See my results" : "See my results — answer every question first"} className="min-h-12 rounded-xl border border-green bg-[#173021] px-4 font-display text-sm font-semibold uppercase tracking-wider text-green disabled:opacity-40">
            See my results ›
          </button>
        ) : (
          <button type="button" onClick={() => move(index + 1)} disabled={!answeredThis} aria-label={answeredThis ? "Continue to the next question" : "Continue — choose an answer first"} className="min-h-12 rounded-xl border border-border px-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground disabled:opacity-40">
            Continue ›
          </button>
        )}
      </div>
    </Shell>
  );
}

/* ── results ──────────────────────────────────────────────────────────── */

function Results({ ctx }: { ctx: Ctx }) {
  const { rec, saving, update, go, back } = ctx;
  const result = useMemo(() => computeResult(rec.responses, familyFieldOf), [rec.responses]);
  const [meanings, setMeanings] = useState(false);

  if (answeredCount(rec) === 0) {
    return (
      <Shell kicker="Audio Career Finder · Results" title="Your audio career results" onBack={back}>
        <Body>No results yet — answer the questions first.</Body>
        <Btn label="Start Career Finder" tone="green" onClick={() => go({ name: "quiz" }, true)} />
      </Shell>
    );
  }

  const strongestCodes = result.strongest.map((d) => d.code);
  const weak = !result.strongest.length || result.strongest[0].score < 0.75 || result.top[0].score < 0.5 || result.clarity === "broad";
  const lead = result.strongest[0];
  const lab = lead ? LAB_FOR_DIMENSION[lead.code] : null;
  const unexplored = result.ranked.find((f) => result.dims[f.family.dimensions[0]].insufficient) ?? null;
  const openFamily = (id: string) => go({ name: "family", id, from: "results" });
  const changeAnswers = () => { update((r) => ({ ...r, index: 0 })); go({ name: "quiz" }, true); };
  const retake = () => confirmReset(() => { update(resetRec); go({ name: "quiz" }, true); });

  const familyCard = ({ item, size, why, ranked = true }: { item: FamilyScore; size: "large" | "compact"; why?: string; ranked?: boolean }) => {
    const f = item.family;
    const meta = familyMetaOf(f.id);
    const saved = rec.saved.includes(f.id);
    return (
      <Card key={f.id} tone={size === "large" ? "raised" : "plain"}>
        <div className="flex items-center gap-3">
          {ranked ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green font-display text-sm font-semibold text-green" aria-label={`Rank ${item.rank}`}>
              {item.rank}
            </span>
          ) : null}
          <h3 className={`flex-1 font-display font-semibold text-amber ${size === "large" ? "text-lg" : "text-base"}`}>{f.name}</h3>
          {meta ? <span className="shrink-0 font-mono text-xs text-text-muted">{meta.count} titles</span> : null}
        </div>
        {size === "large" ? <Body>{f.description}</Body> : null}
        <div className="flex flex-wrap gap-1.5">
          {f.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}
        </div>
        {why ? <p className="font-medium leading-relaxed text-[#e6e6e6]">{why}</p> : null}
        <Examples examples={f.examples} inline />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => openFamily(f.id)} className="min-h-11 flex-1 rounded-xl border border-green bg-[#173021] px-3 font-display text-xs font-semibold uppercase tracking-wider text-green" aria-label={`Explore ${f.name}`}>
            Explore family ›
          </button>
          <button type="button" onClick={() => update(toggleSaved(f.id))} aria-pressed={saved} aria-label={saved ? `Remove ${f.name} from saved` : `Save ${f.name}`} className={`min-h-11 rounded-xl border px-3.5 font-display text-xs font-semibold uppercase tracking-wider ${saved ? "border-[rgba(255,198,77,0.5)] bg-[#1a150b] text-amber" : "border-border bg-[#131315] text-[#e6e6e6]"}`}>
            {saved ? (saving ? "★ Saved" : "★ Not saved") : "☆ Save"}
          </button>
        </div>
      </Card>
    );
  };

  const top2 = result.top.filter((t) => t.rank <= 2);
  const rest = result.top.filter((t) => t.rank > 2);

  return (
    <Shell kicker="Audio Career Finder · Results" title="Your audio career results" onBack={back}>
      <Lead>{weak ? "Nothing stood out strongly yet, so these are the families nearest to your answers, not matches. Exploring one will teach you more than the questions did." : RESULTS_LEAD}</Lead>

      <Label tone="green">{weak ? "Closest to your answers" : "Strongest matches"}</Label>
      {top2.map((t) => familyCard({ item: t, size: "large", why: explainFamily(t.family, result.dims, { rank: t.rank }) }))}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <Label tone="cyan">Your profile</Label>
          <span className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-[#7fd4ff]">{CLARITY_LABEL[result.clarity]}</span>
        </div>
        <Spectrum dims={result.dims} highlight={strongestCodes} />
        <Body>{clarityCopy(result.clarity, result.dims)}</Body>
        {result.strongest.length ? (
          <>
            <p className="font-semibold text-foreground">Activities you said you would enjoy most</p>
            <div className="flex flex-wrap gap-1.5">{result.strongest.map((d) => <DimChip key={d.code} code={d.code} dims={result.dims} />)}</div>
          </>
        ) : null}
        <button type="button" onClick={() => setMeanings(!meanings)} aria-expanded={meanings} className="min-h-9 font-display text-xs font-medium uppercase tracking-[0.14em] text-text-sub">
          What these mean {meanings ? "▴" : "▾"}
        </button>
        {meanings ? (
          <>
            {result.strongest.map((d) => (
              <Body key={d.code} muted><Em>{DIMENSIONS[d.code].label}</Em> — {DIMENSIONS[d.code].measures}</Body>
            ))}
            <Body muted>Each activity is measured by only two questions, so one answer moves its bar a lot. Treat the bars as a sketch of what you said you would enjoy, not a measurement of ability.</Body>
            {unknownNote(rec.responses) ? <Body muted>{unknownNote(rec.responses)}</Body> : null}
          </>
        ) : null}
      </Card>

      <Label>{weak ? "Next closest" : "Other families to explore"}</Label>
      {rest.map((t) => familyCard({ item: t, size: "compact" }))}

      {result.surprise ? (
        <>
          <Label tone="cyan">One you may not have considered</Label>
          <Body>It shares your strongest interest, in a different part of audio. Many of these families are unfamiliar even to people who work in audio, which is part of why the index exists.</Body>
          {familyCard({ item: result.surprise, size: "compact", ranked: false, why: lead ? `Shares your strongest interest, ${DIMENSIONS[lead.code].label}, in a field none of your top five touch.` : undefined })}
        </>
      ) : null}

      <Card tone="ok">
        <Label tone="green">What to do next</Label>
        <NextRow n={1} onClick={() => openFamily(result.top[0].family.id)}>
          Open <Em>{result.top[0].family.name}</Em>. In the app, add its first topic to your study list.
        </NextRow>
        {lab && lead ? (
          <NextRow n={2}>
            In the app, try a lab that uses <Em>{DIMENSIONS[lead.code].label}</Em>: {lab.title} — {lab.why}.
          </NextRow>
        ) : null}
        {result.clarity === "developing" && unexplored ? (
          <NextRow n={3} onClick={() => openFamily(unexplored.family.id)}>
            Open one family you said you didn’t know enough about: <Em>{unexplored.family.name}</Em>.
          </NextRow>
        ) : result.surprise ? (
          <NextRow n={3} onClick={() => openFamily(result.surprise!.family.id)}>
            Read <Em>{result.surprise.family.name}</Em>: it shares your strongest interest, in a different part of audio.
          </NextRow>
        ) : null}
        <Body muted>When you have tried one, come back and change any answer. Your results update.</Body>
      </Card>

      <div className="space-y-2">
        <Btn label={`Browse all ${FAMILY_COUNT} families`} onClick={() => go({ name: "families" })} />
        <Label>Change or start over</Label>
        <Btn label="Change my answers" onClick={changeAnswers} />
        <Btn label="Reset & start over" tone="danger" onClick={retake} aria="Reset and start over" />
        <Body muted>{RESULTS_NOTE}</Body>
      </div>

      <InTheApp />

      <TextBtn label="How this works, and what it does not measure" onClick={() => go({ name: "about" })} />
    </Shell>
  );
}

function NextRow({ n, onClick, children }: { n: number; onClick?: () => void; children: ReactNode }) {
  const inner = (
    <>
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-green font-display text-xs font-semibold text-green">{n}</span>
      <span className="flex-1 font-medium leading-relaxed text-[#e6e6e6]">{children}</span>
      {onClick ? <span className="font-display text-xl text-green" aria-hidden>›</span> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 py-1 text-left">{inner}</button>
  ) : (
    <div className="flex min-h-11 items-center gap-3 py-1">{inner}</div>
  );
}

/* ── one family ───────────────────────────────────────────────────────── */

function Family({ ctx, id, from }: { ctx: Ctx; id: string; from?: "results" | "browse" }) {
  const { rec, saving, update, go, back } = ctx;
  const fam = familyView(id);
  const hasResults = rec.completed && answeredCount(rec) > 0;
  const result = useMemo(() => (hasResults ? computeResult(rec.responses, familyFieldOf) : null), [hasResults, rec.responses]);
  const rank = result?.ranked.find((r) => r.family.id === id)?.rank ?? null;
  const careers = useMemo(() => careersInFamily(id), [id]);
  const entries = useMemo(() => entryPoints(id), [id]);
  const split = useMemo(() => centralitySplit(id), [id]);
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!fam) {
    return (
      <Shell kicker="Audio Career Finder" title="Career family" onBack={back}>
        <Body>This family is not in the current index. Go back and choose another.</Body>
      </Shell>
    );
  }
  const licensed = careers.some((c) => c.regulated);
  const saved = rec.saved.includes(id);
  const correction = `mailto:${CORRECTIONS_MAIL}?subject=${encodeURIComponent(`Correction: ${fam.name}`)}&body=${encodeURIComponent(`Screen: Career family (website)\nFamily id: ${fam.id}\nIndex version: ${CAREER_INDEX_VERSION}\n\n`)}`;

  return (
    <Shell kicker={`Career family · ${fam.count} titles`} title={fam.name} onBack={back} backLabel={from === "results" ? "Back to results" : from === "browse" ? "Back to all families" : "Back"}>
      <div className="flex flex-wrap items-center gap-3">
        {rank != null && rank <= 5 ? <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-green">Ranked #{rank} for you</span> : rank != null && rank <= 10 ? <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">In your top ten</span> : null}
        <button type="button" onClick={() => update(toggleSaved(id))} aria-pressed={saved} aria-label={saved ? `Remove ${fam.name} from saved` : `Save ${fam.name}`} className={`ml-auto min-h-10 rounded-lg border px-3 font-display text-xs font-semibold uppercase tracking-wider ${saved ? "border-[rgba(255,198,77,0.5)] text-amber" : "border-border text-[#e6e6e6]"}`}>
          {saved ? (saving ? "★ Saved" : "★ Not saved") : "☆ Save"}
        </button>
      </div>
      <Lead>{fam.description}</Lead>

      {result ? (
        <Card tone="raised">
          <Label tone="cyan">How it lines up with your answers</Label>
          <Body>{explainFamily(fam, result.dims, { rank: rank ?? undefined })}</Body>
          <div className="flex flex-wrap gap-1.5">{fam.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}</div>
        </Card>
      ) : (
        <Card>
          <Label>The activities it draws on</Label>
          <div className="flex flex-wrap gap-1.5">{fam.dimensions.map((c, i) => <DimChip key={c} code={c} primary={i === 0} />)}</div>
          <Body muted>Main activity first. Take the Career Finder to see how your own interests line up with them.</Body>
        </Card>
      )}

      {licensed ? (
        <Card tone="amber">
          <Label>Licensed or credentialed professions in this family</Label>
          <Body>Some titles here are licensed, credentialed or restricted-entry occupations (marked LICENSED below). Academy topics teach the audio and acoustics knowledge those fields draw on. They are not a route to any license, clinical credential, bar admission or security clearance. Completing them does not qualify anyone to practice. Check the licensing body where you live.</Body>
        </Card>
      ) : null}

      <Card tone="ok">
        <Label tone="green">{licensed ? "Audio knowledge that supports this family" : "Start learning in the Academy"}</Label>
        <p className="font-display font-medium text-foreground">{fam.field === fam.subject ? fam.field : `${fam.field} › ${fam.subject}`}</p>
        {fam.topicGs.length ? (
          <Body muted>In the app, {fam.topicGs.length} Academy {fam.topicGs.length === 1 ? "topic leads" : "topics lead"} into this family. You can add {fam.topicGs.length === 1 ? "it" : "them"} to your study list there.</Body>
        ) : (
          <Body muted>The subject above is the place to begin; its topics are listed on the Explore page.</Body>
        )}
        <Link href="/curriculum" className="text-sm text-amber underline underline-offset-2">See the curriculum</Link>
      </Card>

      <Card>
        <Label>Example titles</Label>
        <Examples examples={fam.examples} />
        <Label>Where the work happens</Label>
        <Body>{fam.settings.map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)).join(" · ")}</Body>
        <Label>How central audio is</Label>
        <div className="flex flex-wrap gap-1.5">
          {(["core", "specialized", "enabled"] as const).filter((k) => split[k] > 0).map((k) => <CentralityChip key={k} value={k} count={split[k]} />)}
        </div>
        {fam.sources.length ? <p className="text-xs text-text-muted">Titles cross-checked against public listings from {fam.sources.join(", ")}. None of them reviewed or endorsed this index. See How this works.</p> : null}
      </Card>

      {entries.length ? (
        <div className="space-y-2">
          <Label>Common entry points</Label>
          <Body muted>Titles in this family that usually need the least formal preparation to get started.</Body>
          {entries.map((c) => <CareerRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />)}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Browse titles in this family</Label>
        <Body muted>{careers.length} titles in this family. Some are the same job under different names, seniority levels or employers, because that is how people in the industry name them.</Body>
        {careers.slice(0, shown).map((c) => <CareerRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />)}
        {shown < careers.length ? <Btn label={`Show ${Math.min(PAGE * 2, careers.length - shown)} more · ${careers.length - shown} left`} onClick={() => setShown(shown + PAGE * 2)} /> : null}
      </div>

      <div className="space-y-2">
        {from === "results" ? (
          <Btn label="Back to results" tone="green" onClick={back} />
        ) : from === "browse" ? (
          <Btn label="Back to all families" tone="green" onClick={back} />
        ) : hasResults ? (
          <Btn label="See my results" tone="green" onClick={() => go({ name: "results" })} />
        ) : (
          <Btn label="Take the Career Finder" tone="green" onClick={() => go({ name: "intro" })} />
        )}
        <div className="flex flex-wrap gap-x-5">
          {hasResults ? <TextBtn label="Back to the Career Finder" onClick={() => go({ name: "intro" })} muted /> : null}
          <a href={correction} className="flex min-h-11 items-center text-sm text-text-muted underline underline-offset-2 hover:text-text-sub" aria-label="Suggest a correction. Opens your mail app with this family named.">Suggest a correction</a>
        </div>
      </div>

      <InTheApp />
    </Shell>
  );
}

function CareerRow({ c, open, onToggle }: { c: Career; open: boolean; onToggle: () => void }) {
  const edu = educationChip(c);
  return (
    <div className="overflow-hidden rounded-lg border border-[#232323] bg-[#161616]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2 text-left">
        <span className="w-3 text-sm text-text-sub" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="flex-1 font-medium text-foreground">{c.title}</span>
        <span className="flex flex-col items-end gap-1">
          {c.regulated ? <Tag>Licensed</Tag> : null}
          {edu ? <Tag>{edu}</Tag> : null}
          <CentralityChip value={c.centrality} />
        </span>
      </button>
      {open ? (
        <div className="space-y-1.5 border-t border-[#1e1e1e] px-3.5 pt-2 pb-3 text-sm leading-relaxed text-text-sub">
          {c.alternates.length ? <p><DL>Also called</DL>{c.alternates.join(" · ")}</p> : null}
          <p><DL>Kind of role</DL>{c.titleClass} · {c.orientation}</p>
          <p><DL>How people work</DL>{c.workModel}</p>
          <p><DL>Typical preparation</DL>{prepForDisplay(c.preparation)}</p>
          <p><DL>Audio in this role</DL>{CENTRALITY[c.centrality].explain}</p>
          {c.regulated ? <p className="text-[#ffb060]">{LICENSED_WARNING}</p> : null}
          {c.professionalEngineer ? <p className="text-[#ffb060]">⚠ In many places, offering engineering services to the public or stamping reports with an engineer’s seal requires a Professional Engineer license.</p> : null}
          <p className="text-text-muted">{c.status}. {PREPARATION_ROUTES_NOTE}</p>
        </div>
      ) : null}
    </div>
  );
}
const Tag = ({ children }: { children: ReactNode }) => (
  <span className="whitespace-nowrap rounded-md border border-[rgba(255,138,30,0.6)] bg-[#2a1706] px-2 py-0.5 font-display text-[11px] font-medium uppercase tracking-wider text-[#ffb060]">{children}</span>
);
const DL = ({ children }: { children: ReactNode }) => (
  <span className="mr-2 font-display text-[11px] font-medium uppercase tracking-widest text-[#d99f1f]">{children}</span>
);

/* ── all families ─────────────────────────────────────────────────────── */

function FamilyList({ ctx }: { ctx: Ctx }) {
  const { rec, go, back } = ctx;
  const hasResults = rec.completed && answeredCount(rec) > 0;
  const rankOf = useMemo(
    () => (hasResults ? new Map(computeResult(rec.responses, familyFieldOf).ranked.map((r) => [r.family.id, r.rank] as const)) : new Map<string, number>()),
    [hasResults, rec.responses],
  );
  const groups = useMemo(() => {
    const byField = new Map<string, (typeof FAMILIES)[number][]>();
    for (const f of FAMILIES) {
      const field = familyFieldOf(f.id) ?? "Other";
      byField.set(field, [...(byField.get(field) ?? []), f]);
    }
    return [...byField.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  return (
    <Shell kicker={`Audio Career Finder · ${FAMILIES.length} families`} title="Most kinds of paid audio work" onBack={back}>
      <Body>{fmt(CAREER_COUNT)} titles, grouped into {FAMILIES.length} families, each listed under the Academy field that leads into it.{hasResults ? " Your rank from the Career Finder is shown beside each one." : ""}</Body>
      {groups.map(([field, fams]) => (
        <div key={field} className="space-y-1.5">
          <Label tone="muted">{field}</Label>
          {fams.map((f) => {
            const rank = rankOf.get(f.id);
            return (
              <button key={f.id} type="button" onClick={() => go({ name: "family", id: f.id, from: "browse" })} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-[#232323] bg-[#161616] px-3.5 py-2.5 text-left hover:bg-[#1b1b1b]">
                <span className="flex-1">
                  <span className="block font-display font-medium text-amber">{f.name}</span>
                  <span className="line-clamp-2 block text-sm text-text-sub">{f.description}</span>
                </span>
                <span className="flex min-w-9 flex-col items-end">
                  {rank ? <span className={`font-display text-xs font-semibold ${rank <= 5 ? "text-green" : "text-text-sub"}`}>#{rank}</span> : null}
                  <span className="font-mono text-xs text-text-muted">{familyMetaOf(f.id)?.count ?? 0}</span>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </Shell>
  );
}

/* ── how this works ───────────────────────────────────────────────────── */

function About({ ctx }: { ctx: Ctx }) {
  const low = (s: string) => s.toLowerCase().replace(/\.$/, "");
  const report = `mailto:${CORRECTIONS_MAIL}?subject=${encodeURIComponent("Correction: Audio Career Finder")}&body=${encodeURIComponent(`Screen: How this works (website)\nAssessment version: ${ASSESSMENT_VERSION}\nIndex version: ${CAREER_INDEX_VERSION}\n\n`)}`;
  return (
    <Shell kicker="Audio Career Finder · How this works" title="What it measures, and what it doesn’t" onBack={ctx.back}>
      <Lead>The Career Finder is a career-exploration tool. It helps you find kinds of paid audio work and pick the ones worth looking into. It does not tell you what you should become.</Lead>

      <Card>
        <Label>What counts as an audio career</Label>
        <Body>Any paid work that requires audio knowledge, audio-related skill or audio ability. That includes employees, freelancers, contractors, consultants, business owners, performers, researchers, educators, clinicians, craftspeople and paid gig workers. A title does not need the word “audio” in it if sound-related knowledge is necessary to do the job. Unpaid hobby or volunteer activity is not included.</Body>
        <Body>Because that definition is broad, every title also says how central audio is to it: <Em>{CENTRALITY.core.label}</Em> ({low(CENTRALITY.core.explain)}), <Em>{CENTRALITY.specialized.label}</Em> ({low(CENTRALITY.specialized.explain)}) or <Em>{CENTRALITY.enabled.label}</Em> ({low(CENTRALITY.enabled.explain)}).</Body>
      </Card>

      <Card>
        <Label>What the questions measure</Label>
        <Body>{QUESTION_COUNT} questions ask how you would feel about doing specific activities. They measure <Em>interest</Em> (what you think you would enjoy) across {DIMENSION_CODES.length} kinds of audio work:</Body>
        <ul className="space-y-1 text-sm leading-relaxed text-text-sub">
          {DIMENSION_CODES.map((c) => (
            <li key={c}><span className="mr-2 font-display text-xs font-medium tracking-wider text-[#d99f1f]">{c}</span><Em>{DIMENSIONS[c].label}</Em> — {DIMENSIONS[c].measures}</li>
          ))}
        </ul>
      </Card>

      <Card tone="amber">
        <Label>What it does not measure</Label>
        <Body>It does not measure ability, aptitude, knowledge, readiness, personality or fit with a workplace. It cannot tell whether you can hear distortion, troubleshoot signal flow, write code or run a session today. Interest is one useful piece of a career decision. Research finds it relates to satisfaction, but only modestly. Pay, colleagues, values, preparation and opportunity matter too.</Body>
        <Body>“I don’t know enough about this” is treated as missing evidence, never as dislike. Not having tried something is not the same as being unsuited to it.</Body>
        <Body>Each activity is measured by only two questions, so one answer can move its bar a lot. Treat the profile as a sketch, not a measurement.</Body>
        <Body>Your answers are stored only on this device and are never sent anywhere unless you choose to email feedback.</Body>
      </Card>

      <Card>
        <Label>How careers are grouped and matched</Label>
        <Body>{fmt(CAREER_COUNT)} job titles were cross-checked against publicly available occupational listings and role descriptions. Sources include the U.S. Bureau of Labor Statistics and O*NET, the Audio Engineering Society, the Acoustical Society of America, the Society of Motion Picture and Television Engineers (SMPTE), the American Speech-Language-Hearing Association (ASHA), the International Alliance of Theatrical Stage Employees (IATSE) and the Piano Technicians Guild. The Academy grouped the titles into {FAMILY_COUNT} career families. None of those organizations participated in, reviewed or endorsed this index, and no title here implies membership in or certification by any of them. Titles and licensing rules are described mainly as used in the United States; names and requirements differ elsewhere.</Body>
        <Body>Many titles are the same occupation under different names, seniority levels or employers. The index keeps them all, because that is how people in the industry name them.</Body>
        <Body>Each family names its three dominant activities. Your score on the main activity carries {Math.round(FAMILY_WEIGHTS[0] * 100)}% of the family’s score, the second {Math.round(FAMILY_WEIGHTS[1] * 100)}% and the third {Math.round(FAMILY_WEIGHTS[2] * 100)}%. Families are ranked from highest to lowest, and the reason each one appeared is generated from your actual answers by a fixed template, never by an AI.</Body>
        <Body>Profile clarity is a plain description of your answers: <Em>Clear</Em> when at least one activity scored high and others sat clearly lower; <Em>Broad</Em> when most were rated alike; <Em>Early</Em> when more than {Math.round(CLARITY_RULES.unknownShare * 100)}% of answers were “I don’t know enough about this.”</Body>
      </Card>

      <Card>
        <Label>An early estimate</Label>
        <Body>The links between families and activities, and the weights above, are an expert’s first estimate, not a tested measure. They haven’t been checked against real answers yet and will change as people use the Career Finder and professionals correct it. Nothing here should be used to screen anyone for a job.</Body>
        <p className="font-mono text-xs text-text-muted">Questionnaire {ASSESSMENT_VERSION} · Index {CAREER_INDEX_VERSION}</p>
      </Card>

      <Card tone="ok">
        <Label tone="green">See something wrong?</Label>
        <Body>If a title is misnamed, a family is missing a career you know, or a requirement is stated badly, tell us. Corrections from people who do the work are how this index improves.</Body>
        <a href={report} className="flex min-h-12 w-full items-center justify-center rounded-xl border border-green bg-[#173021] px-4 font-display text-sm font-semibold uppercase tracking-[0.12em] text-green">
          Suggest a correction
        </a>
        <Body muted>Opens your mail app. You decide whether to send.</Body>
      </Card>
    </Shell>
  );
}
