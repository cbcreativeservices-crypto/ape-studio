import { TAGLINE } from "@/lib/brand";

/* ============================================================
 *  LAUNCH OVERLAY (owner 2026-10-04)
 *  While the site gate is on, a visitor WITHOUT the key sees the real home
 *  page — moving app-screen carousel included — blurred behind this centered
 *  panel. The page behind is inert (no clicks, no keyboard focus, no scroll);
 *  every other path is still gated by web/proxy.ts. The early-access form
 *  posts to /api/unlock exactly as before.
 *  Shown only when web/proxy.ts marks the request with x-ape-locked: 1.
 *  Remove at launch (turning the gate off removes it automatically).
 * ============================================================ */
export function LaunchOverlay({ error }: { error: boolean }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{
        background: "rgba(8, 8, 10, 0.45)",
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
      }}
    >
      <style>{"html, body { overflow: hidden; }"}</style>
      <div className="w-full max-w-md rounded-2xl border border-border bg-[#151515]/95 px-6 py-8 text-center shadow-2xl sm:px-8">
        <img src="/logo-hero.png" alt="Pro Audio Training Academy" className="mx-auto mb-5 h-auto w-24" />
        <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-text-sub">
          Pro Audio Training Academy
        </p>
        <h1 id="launch-title" className="mt-4 font-display text-3xl font-semibold uppercase leading-tight tracking-wide text-foreground sm:text-4xl">
          Coming soon
          <span className="mt-1 block text-amber">Monday, October&nbsp;12</span>
        </h1>
        <p className="mt-3 text-base text-text-sub">{TAGLINE}</p>

        <nav aria-label="Legal and support" className="mt-6">
          <ul className="flex flex-wrap justify-center gap-2">
            {[
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms of Service"],
              ["/support", "Support"],
              ["/accessibility", "Accessibility"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-block rounded-lg border border-border bg-background/60 px-3.5 py-2 text-sm text-foreground transition-colors hover:border-amber hover:text-amber focus-visible:border-amber focus-visible:text-amber focus-visible:outline-none"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 text-sm text-text-sub">
          Questions?{" "}
          <a href="mailto:info@proaudiotrainingacademy.com" className="text-amber">
            info@proaudiotrainingacademy.com
          </a>
        </p>

        <details open={error} className="mx-auto mt-6 max-w-xs border-t border-border pt-4">
          <summary className="cursor-pointer text-xs text-text-sub">Early access</summary>
          <form method="POST" action="/api/unlock" autoComplete="off" className="mt-3 flex flex-col gap-2">
            <input
              type="password"
              name="key"
              placeholder="Enter key"
              aria-label="Access key"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-center text-base text-foreground outline-none focus:border-amber"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-background hover:bg-amber-deep"
            >
              Enter
            </button>
            {error ? <p className="text-sm text-[#ff4b3a]">Incorrect key. Try again.</p> : null}
          </form>
        </details>

        <p className="mt-6 text-xs text-text-sub">&copy; 2026 Pro Audio Training Academy LLC</p>
      </div>
    </div>
  );
}
