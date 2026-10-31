"use client";

import { useEffect, useMemo, useState } from "react";
import { loadCatalog, type Catalog, type CatalogEntry, type CatalogKind } from "@/lib/catalog";

/**
 * "What our credentials include" — the public catalog under a holder's
 * verified credentials (owner 2026-10-31). An employer can browse every
 * Specialization Certificate and Professional Certificate Program and the
 * topics each requires, read live from the database. A credential title in
 * the holder's list links here (#<anchor>): the right tab opens, the entry
 * expands and scrolls into view.
 */
export default function CredentialCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null | undefined>(undefined);
  const [tab, setTab] = useState<CatalogKind>("certificate");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);

  // Follow a link from the holder's list (#certificate-… / #program-…).
  useEffect(() => {
    if (!catalog) return;
    const follow = () => {
      const anchor = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      const entry = [...catalog.certificates, ...catalog.programs].find((e) => e.anchor === anchor);
      if (!entry) return;
      setTab(entry.kind);
      setQuery("");
      setOpen((s) => new Set(s).add(entry.anchor));
      requestAnimationFrame(() =>
        document.getElementById(entry.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [catalog]);

  const list = catalog ? (tab === "certificate" ? catalog.certificates : catalog.programs) : [];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.track ?? "").toLowerCase().includes(q) ||
        e.topics.some((t) => t.toLowerCase().includes(q)),
    );
  }, [list, query]);

  // Certificates are grouped by track; programs have no track and list A–Z.
  const groups = useMemo(() => {
    const m = new Map<string, CatalogEntry[]>();
    for (const e of shown) {
      const k = tab === "certificate" ? e.track ?? "Other" : "";
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shown, tab]);

  const toggle = (anchor: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(anchor)) n.delete(anchor);
      else n.add(anchor);
      return n;
    });

  return (
    <section id="credential-catalog" className="mt-10 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">For employers</p>
      <h2 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
        What our credentials include
      </h2>
      <div className="mt-3 max-w-prose space-y-3 text-sm leading-relaxed text-text-sub">
        <p>
          Every Academy credential is awarded only when its full requirements have been met. Each
          requires the core topics shared by every credential, the topics particular to that
          credential, successful performance on its final examination and, where the credential
          requires them, practical laboratory work.
        </p>
        <p>
          A <span className="text-foreground">Specialization Certificate</span> documents a focused
          area of professional practice. A{" "}
          <span className="text-foreground">Professional Certificate Program</span> documents a broader
          course of study across a complete professional role.
        </p>
        {catalog && catalog.core.length ? (
          <p>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
              Core topics, required for every credential:
            </span>{" "}
            {catalog.core.join(" · ")}
          </p>
        ) : null}
      </div>

      {catalog === undefined ? (
        <p className="mt-6 text-sm text-text-muted">Loading the credential list…</p>
      ) : catalog === null ? (
        <p className="mt-6 text-sm text-text-sub">
          The credential list is temporarily unavailable. Please try again in a moment.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Credential type">
            {(
              [
                ["certificate", "Specialization Certificates"],
                ["program", "Professional Certificate Programs"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  tab === k
                    ? "border-amber bg-amber/10 text-amber"
                    : "border-border text-text-sub hover:border-amber/60 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, track or topic"
            aria-label="Search credentials"
            className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-amber focus:outline-none"
          />

          {shown.length === 0 ? (
            <p className="mt-6 text-sm text-text-sub">No credential matches that search.</p>
          ) : (
            <div className="mt-4">
              {groups.map(([group, entries]) => (
                <div key={group || "all"} className="mt-4">
                  {group ? (
                    <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">{group}</p>
                  ) : null}
                  <ul className="divide-y divide-border border-y border-border">
                    {entries.map((e) => {
                      const isOpen = open.has(e.anchor);
                      return (
                        <li key={e.id} id={e.anchor} className="scroll-mt-24">
                          <button
                            type="button"
                            onClick={() => toggle(e.anchor)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between gap-4 py-3 text-left"
                          >
                            <span className="font-display text-base font-semibold text-foreground">{e.name}</span>
                            <span aria-hidden className="shrink-0 text-amber">
                              {isOpen ? "−" : "+"}
                            </span>
                          </button>
                          {isOpen ? (
                            <div className="pb-4 text-sm text-text-sub">
                              <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
                                {e.kind === "certificate" ? "Specialization Certificate" : "Professional Certificate Program"}
                                {e.track ? ` · ${e.track}` : ""}
                              </p>
                              <p className="mt-2 text-foreground">Required topics, in addition to the core topics:</p>
                              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                                {e.topics.map((t) => (
                                  <li key={t}>{t}</li>
                                ))}
                              </ul>
                              <p className="mt-2">Plus a passing result on the final examination.</p>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
