"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { VerifiedCredential } from "@/lib/verify";
import type { CertificateSource } from "@/lib/certificate/render";

/**
 * CertificateGallery — the credentials list on the two public pages, with a
 * small certificate beside each title and a full-size viewer (D15, owner
 * Option A, 2026-10-27).
 *
 * The certificate is the app's own renderer (lib/certificate/, a verbatim copy
 * of src/features/credentials/certificateHtml.ts), loaded with import() only
 * once this list is on screen, so its ~520 KB of fonts and art never touch the
 * page for anyone else. Each certificate is drawn into a sandboxed iframe
 * (no scripts, no forms, no popups, no clicks) — the same HTML the app
 * prints, scaled, so the website can never drift from the PDF.
 *
 * A row whose certificate cannot be drawn keeps its text and gets no thumbnail
 * and no button. Never a broken frame.
 */

const SHEET_W = 1056;
const SHEET_H = 816;

/**
 * "allow-same-origin" and nothing else (owner 2026-10-29, "fix the blank
 * wait"). With sandbox="" the opaque-origin frame took 2–6 s on a phone to
 * paint its embedded fonts, showing a blank cream sheet; same-origin paints in
 * under 0.4 s (measured side by side). Still no allow-scripts, so the sheet can
 * run nothing: same-origin only lets this page read the frame's fonts state.
 */
const SANDBOX = "allow-same-origin";

type Props = {
  credentials: VerifiedCredential[];
  /** Fallback name when a credential row carries no holder_label. */
  holder: string;
  source: CertificateSource;
};

/** The server's no-name label, in the app's printed casing ("Academy Member",
 *  certificatePdf.ts). */
/** The credential kind as the app names it (Level 1 / Level 2). */
function credentialKindLabel(kind: string): string {
  const k = kind.trim().toLowerCase();
  if (k === "certificate") return "Specialization Certificate";
  if (k === "program") return "Professional Certificate Program";
  return kind;
}

function certificateName(label: string): string {
  return label.trim().toLowerCase() === "academy member" ? "Academy Member" : label;
}

/** undefined = still loading; null = no certificate for this row. */
type Rendered = (string | null)[] | undefined;

export default function CertificateGallery({ credentials, holder, source }: Props) {
  // Keyed to the list it was drawn for, so a stale result can never show.
  const [drawn, setDrawn] = useState<{ key: string; list: VerifiedCredential[]; rendered: (string | null)[] } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const rowButtons = useRef<(HTMLButtonElement | null)[]>([]);

  const sourceKey = source.kind === "registry" ? `r:${source.token}` : `c:${source.code}`;

  useEffect(() => {
    let alive = true;
    import("@/lib/certificate/render")
      .then(({ renderCertificates }) => {
        if (!alive) return;
        setDrawn({
          key: sourceKey,
          list: credentials,
          rendered: renderCertificates(
            credentials.map((c) => ({
              // Owner 2026-10-27: a certificate prints the name the member typed in
              // Profile → "Name on your certificates" (users.registry_name), and
              // the app prints "Academy Member" when that is empty — never the
              // private user name. On /registry the PROFILE label is exactly that
              // (registry_name, else "Academy member"). The credential lookups
              // fall back to the nickname instead, so /verify still uses theirs
              // until Comp A drops that fallback [MD:D15].
              holderName: certificateName(source.kind === "registry" ? holder : c.holder_label || holder),
              credentialName: c.credential_name,
              credentialType: c.credential_type,
              earnedAt: c.earned_at,
            })),
            source,
          ),
        });
      })
      .catch(() => {
        if (alive) setDrawn({ key: sourceKey, list: credentials, rendered: credentials.map(() => null) });
      });
    return () => {
      alive = false;
    };
    // sourceKey stands in for `source` (a fresh object each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials, holder, sourceKey]);

  const rendered: Rendered =
    drawn && drawn.key === sourceKey && drawn.list === credentials ? drawn.rendered : undefined;
  const viewable = rendered ? rendered.flatMap((html, i) => (html ? [i] : [])) : [];

  const close = () => {
    const current = open;
    setOpen(null);
    // Back to the row of the certificate that was showing.
    if (current !== null) requestAnimationFrame(() => rowButtons.current[current]?.focus());
  };

  return (
    <>
      <ul className="mt-4 divide-y divide-border">
        {credentials.map((c, i) => {
          const html = rendered?.[i] ?? null;
          const loading = rendered === undefined;
          return (
            <li key={i} className="relative flex items-start gap-4 py-4">
              {html ? (
                <Thumbnail html={html} name={c.credential_name} />
              ) : loading ? (
                <span
                  aria-hidden
                  className="block aspect-[1056/816] w-[88px] shrink-0 animate-pulse rounded-sm border border-border bg-surface-raised sm:w-[112px]"
                />
              ) : null}
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-display text-lg font-semibold text-foreground">
                  {c.credential_name}
                </p>
                <p className="mt-1 text-sm text-text-sub">
                  {/* The credential's proper name, not the raw database
                      "certificate · L1" (owner 2026-10-31). Every certificate
                      is Level 1 and every program Level 2, so the level code
                      added nothing and read as jargon. Same names as the app
                      (src/screens/awards/awardsData.ts). */}
                  <span className="text-text-muted">{credentialKindLabel(c.credential_type)}</span>
                  {c.track ? <> · {c.track}</> : null}
                </p>
                {c.earned_at ? (
                  <time className="font-mono text-xs text-text-muted" dateTime={c.earned_at}>
                    Earned {new Date(c.earned_at).toLocaleDateString()}
                  </time>
                ) : null}
              </div>
              {html ? (
                // The whole row is the target: a real button stretched over it.
                // (An iframe may not sit inside a <button>, so it overlays.)
                <button
                  type="button"
                  ref={(el) => {
                    rowButtons.current[i] = el;
                  }}
                  onClick={() => setOpen(i)}
                  aria-label={`Open certificate: ${c.credential_name}`}
                  className="group absolute inset-0 cursor-zoom-in rounded-md transition-colors hover:bg-foreground/[0.03]"
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {open !== null && rendered?.[open] ? (
        <CertificateViewer
          sheets={sheetsAround(viewable, open, rendered)}
          current={open}
          name={credentials[open].credential_name}
          position={viewable.indexOf(open)}
          count={viewable.length}
          onPrevious={() => {
            const p = viewable.indexOf(open);
            if (p > 0) setOpen(viewable[p - 1]);
          }}
          onNext={() => {
            const p = viewable.indexOf(open);
            if (p >= 0 && p < viewable.length - 1) setOpen(viewable[p + 1]);
          }}
          onClose={close}
        />
      ) : null}
    </>
  );
}

/**
 * The certificate on screen plus its neighbours (owner 2026-10-29, "fix the
 * blank wait"): a full sheet takes 2–6 s to draw on a phone, so the previous
 * and next ones are drawn hidden while the learner looks at this one, and
 * Next/Previous then shows a sheet that is already finished.
 */
function sheetsAround(viewable: number[], open: number, rendered: (string | null)[]) {
  const p = viewable.indexOf(open);
  return [viewable[p - 1], open, viewable[p + 1]]
    .filter((i): i is number => i !== undefined && !!rendered[i])
    .map((i) => ({ index: i, html: rendered[i]! }));
}

function Thumbnail({ html, name }: { html: string; name: string }) {
  return (
    <span
      role="img"
      aria-label={`Certificate: ${name}`}
      className="relative block aspect-[1056/816] w-[88px] shrink-0 overflow-hidden rounded-sm border border-border bg-[#fbf9f4] sm:w-[112px]"
    >
      <iframe
        srcDoc={html}
        sandbox={SANDBOX}
        title={`Certificate: ${name}`}
        aria-hidden
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 origin-top-left scale-[0.0833333] border-0 sm:scale-[0.1060606]"
        style={{ width: SHEET_W, height: SHEET_H }}
      />
    </span>
  );
}

function CertificateViewer({
  sheets,
  current,
  name,
  position,
  count,
  onPrevious,
  onNext,
  onClose,
}: {
  sheets: { index: number; html: string }[];
  current: number;
  name: string;
  position: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);
  // Credential indexes whose sheet has finished drawing. Kept across
  // Next/Previous: a sheet stays mounted (same key) while it is a neighbour.
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
  const currentLoaded = loaded.has(current);

  // Fit the sheet to the window, leaving room for the control bar.
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth - 32;
      const h = window.innerHeight - 32 - 64;
      setScale(Math.max(0.1, Math.min(w / SHEET_W, h / SHEET_H, 1)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPrevious();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNext();
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const hasPrevious = position > 0;
  const hasNext = position >= 0 && position < count - 1;
  const control =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:border-amber hover:text-amber disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Certificate: ${name}`}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <div
        role="img"
        aria-label={`Certificate: ${name}`}
        className="relative overflow-hidden rounded-sm bg-[#fbf9f4] shadow-2xl"
        style={{ width: Math.round(SHEET_W * scale), height: Math.round(SHEET_H * scale) }}
      >
        {!currentLoaded ? (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[#7a6a4a]">
            <span className="animate-pulse">Loading certificate…</span>
          </span>
        ) : null}
        {scale > 0
          ? sheets.map((s) => (
              <iframe
                key={s.index}
                srcDoc={s.html}
                sandbox={SANDBOX}
                title={`Certificate: ${name}`}
                aria-hidden
                tabIndex={-1}
                onLoad={(e) => {
                  const mark = () =>
                    setLoaded((prev) => (prev.has(s.index) ? prev : new Set(prev).add(s.index)));
                  // "load" comes before the embedded fonts are drawn; wait for
                  // them so the label, never a blank sheet, fills the gap.
                  const fonts = e.currentTarget.contentDocument?.fonts;
                  if (fonts) fonts.ready.then(mark, mark);
                  else mark();
                }}
                className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
                style={{
                  width: SHEET_W,
                  height: SHEET_H,
                  transform: `scale(${scale})`,
                  // Neighbours draw out of sight; the current one appears only
                  // once finished, so the label shows instead of a blank sheet.
                  visibility: s.index === current && loaded.has(s.index) ? "visible" : "hidden",
                }}
              />
            ))
          : null}
      </div>
      <div className="mt-4 flex w-full max-w-md flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onPrevious} disabled={!hasPrevious} className={control}>
          Previous
        </button>
        <span className="min-w-[4.5rem] text-center font-mono text-xs text-text-muted" aria-live="polite">
          {position + 1} of {count}
        </span>
        <button type="button" onClick={onNext} disabled={!hasNext} className={control}>
          Next
        </button>
        <button type="button" ref={closeRef} onClick={onClose} className={`${control} ml-2`}>
          Close
        </button>
      </div>
    </div>
  );
}
