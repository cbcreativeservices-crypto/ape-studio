"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Error
      </p>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-wide text-foreground sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-text-sub">
        Try again. If it keeps happening, email us.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Try again
        </button>
        <a
          href="/contact"
          className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          Contact
        </a>
      </div>
    </div>
  );
}
