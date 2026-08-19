import Link from "next/link";

export default function ComingSoon({
  eyebrow,
  title,
  body,
  note,
}: {
  eyebrow: string;
  title: string;
  body: string;
  note?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        {eyebrow}
      </p>
      <h1 className="mt-5 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-text-sub">{body}</p>
      {note ? <p className="mx-auto mt-4 max-w-xl text-sm text-text-muted">{note}</p> : null}
      <div className="mt-10">
        <Link
          href="/"
          className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
