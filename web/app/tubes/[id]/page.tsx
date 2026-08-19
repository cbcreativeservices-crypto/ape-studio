"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSessionState } from "@/lib/session";
import { getTube, fetchTubePageUrl, TUBE_PAGES, type Tube } from "@/lib/tubes";

type State =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | { phase: "locked" }
  | { phase: "notFound" }
  | { phase: "ready"; tube: Tube };

export default function TubeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? "";
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    (async () => {
      const { signedIn, tier } = await getSessionState();
      if (!signedIn) return setState({ phase: "signedOut" });
      if (tier !== "academy") return setState({ phase: "locked" });
      const tube = await getTube(id);
      if (!tube) return setState({ phase: "notFound" });
      setState({ phase: "ready", tube });
    })();
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/tubes" className="text-sm text-text-muted underline underline-offset-2 hover:text-amber">
        ← All tubes
      </Link>

      {state.phase === "loading" ? (
        <p className="mt-8 text-text-muted">Loading…</p>
      ) : state.phase === "signedOut" ? (
        <Lock body="Sign in as an Academy member to view this card." href="/login" label="Sign in" />
      ) : state.phase === "locked" ? (
        <Lock body="The Tube Reference is an Academy benefit. Upgrade to Academy in the app to view the cards." href="/dashboard" label="Go to dashboard" />
      ) : state.phase === "notFound" ? (
        <p className="mt-8 text-text-sub">That tube wasn&rsquo;t found. <Link href="/tubes" className="text-amber underline">Browse the reference.</Link></p>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
            {state.tube.name}
          </h1>
          <p className="mt-2 text-text-sub">{state.tube.role}</p>
          <p className="mt-1 text-sm text-text-muted">
            {state.tube.base}
            {state.tube.alt.length ? <> · also: {state.tube.alt.join(", ")}</> : null}
          </p>

          <div className="mt-8 space-y-6">
            {Array.from({ length: TUBE_PAGES }, (_, i) => (i + 1) as 1 | 2).map((page) => (
              <TubePage key={page} stem={state.tube.stem} page={page} label={`${state.tube.short} — page ${page}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TubePage({ stem, page, label }: { stem: string; page: 1 | 2; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let alive = true;
    fetchTubePageUrl(stem, page).then((u) => {
      if (!alive) return;
      if (u) {
        setUrl(u);
        setStatus("ok");
      } else {
        setStatus("fail");
      }
    });
    return () => {
      alive = false;
    };
  }, [stem, page]);

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      {status === "loading" ? (
        <div className="flex aspect-[9/16] items-center justify-center text-text-muted">Loading card…</div>
      ) : status === "fail" ? (
        <div className="flex aspect-[9/16] flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm text-text-sub">Secured card unavailable right now.</p>
          <p className="text-xs text-text-muted">
            The protected image service is being enabled. Your access is fine —
            please check back shortly.
          </p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url!} alt={label} className="w-full" />
      )}
      <figcaption className="border-t border-border px-4 py-2 font-mono text-xs text-text-muted">
        {label}
      </figcaption>
    </figure>
  );
}

function Lock({ body, href, label }: { body: string; href: string; label: string }) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">Members only</p>
      <p className="mt-2 text-sm text-text-sub">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
      >
        {label}
      </Link>
    </div>
  );
}
