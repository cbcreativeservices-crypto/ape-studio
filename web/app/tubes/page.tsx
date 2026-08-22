"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSessionState, type Tier } from "@/lib/session";
import { fetchTubes, searchTubes, FAMILY_META, type Tube } from "@/lib/tubes";

type State =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | { phase: "locked"; tier: Tier }
  | { phase: "unavailable" }
  | { phase: "ready"; tubes: Tube[] };

export default function TubesPage() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { signedIn, tier } = await getSessionState();
      if (!signedIn) return setState({ phase: "signedOut" });
      if (tier !== "academy") return setState({ phase: "locked", tier });
      try {
        const tubes = await fetchTubes();
        if (tubes.length === 0) return setState({ phase: "unavailable" });
        setState({ phase: "ready", tubes });
      } catch {
        setState({ phase: "unavailable" });
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (state.phase === "ready" ? searchTubes(state.tubes, query) : []),
    [state, query],
  );

  if (state.phase === "loading") {
    return <Shell><p className="mt-8 text-text-muted">Loading the tube reference…</p></Shell>;
  }

  if (state.phase === "signedOut") {
    return (
      <Shell>
        <LockCard
          title="Member Reference"
          body="The complete Vacuum Tube Reference is available to Pro Audio Training Academy members. Create your account in the app, then sign in here."
          cta={{ href: "/get", label: "Get the app" }}
        />
      </Shell>
    );
  }

  if (state.phase === "locked") {
    return (
      <Shell>
        <LockCard
          title="Member Reference"
          body="The complete Vacuum Tube Reference is available to Academy members. Academy membership unlocks this and other member resources — join in the Pro Audio Training Academy mobile app."
          cta={{ href: "/get", label: "Get the app" }}
        />
      </Shell>
    );
  }

  if (state.phase === "unavailable") {
    return (
      <Shell>
        <LockCard
          title="Being finalized"
          body="The secured Tube Reference is being enabled. Please check back shortly."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tubes — 12AX7, ECC83, octal, rectifier…"
        className="mt-6 w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground outline-none placeholder:text-text-muted focus:border-amber"
        aria-label="Search tubes"
      />

      <div className="mt-8 space-y-10">
        {FAMILY_META.map((fam) => {
          const rows = filtered.filter((t) => t.family === fam.key);
          if (rows.length === 0) return null;
          return (
            <section key={fam.key}>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                {fam.title}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{fam.note}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {rows.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tubes/${t.id}`}
                      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-amber"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-base font-semibold text-foreground">{t.name}</span>
                        <span className="font-mono text-xs text-text-muted">#{t.num}</span>
                      </div>
                      <p className="mt-1 text-sm text-text-sub">{t.role}</p>
                      <p className="mt-1 text-xs text-text-muted">{t.base}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted">No tubes match &ldquo;{query}&rdquo;.</p>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Members reference</p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        Tube Reference
      </h1>
      <p className="mt-3 text-text-sub">
        Vacuum tube spec cards for Academy members — 40 tubes across preamp,
        power, directly-heated, and rectifier families.
      </p>
      {children}
    </div>
  );
}

function LockCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <p className="mt-2 text-sm text-text-sub">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-5 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
