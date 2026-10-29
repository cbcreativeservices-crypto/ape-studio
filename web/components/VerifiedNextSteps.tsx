import { boldParts, nextStepsFor } from "@/lib/verifiedNextSteps";

function Rich({ s }: { s: string }) {
  return (
    <>
      {boldParts(s).map((p, i) =>
        p.bold ? (
          <b key={i} className="font-semibold text-foreground">
            {p.text}
          </b>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** "What to do next" under "You are verified" (must-do D23). */
export default function VerifiedNextSteps({ kind }: { kind: string | null | undefined }) {
  const c = nextStepsFor(kind);
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{c.title}</p>
      <ol className="ml-5 mt-2 list-decimal space-y-2 text-sm text-text-muted">
        {c.steps.map((s) => (
          <li key={s}>
            <Rich s={s} />
          </li>
        ))}
      </ol>
      {c.footer.map((s) => (
        <p key={s} className="mt-3 text-sm text-text-muted">
          <Rich s={s} />
        </p>
      ))}
    </div>
  );
}
