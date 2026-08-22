import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        404
      </p>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-wide text-foreground sm:text-4xl">
        This page is not here
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-text-sub">
        The address may be misspelled, or the page may have moved.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
