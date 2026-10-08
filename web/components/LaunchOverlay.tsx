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
  // Owner 2026-10-04 (2nd pass): a compact panel and a light blur, so most of
  // the screen shows the live site and carousel behind — "the full site is
  // there, just waiting to be unlocked".
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto px-4 py-6"
      style={{
        background: "rgba(8, 8, 10, 0.22)",
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1.5px)",
      }}
    >
      <style>{"html, body { overflow: hidden; }"}</style>
      <div
        className="w-full max-w-[19rem] rounded-xl border border-amber/40 px-5 py-5 text-center shadow-2xl"
        style={{
          background: "rgba(12, 12, 12, 0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-amber">Coming soon</p>
        <h1 id="launch-title" className="mt-1.5 font-display text-2xl font-semibold uppercase leading-tight tracking-wide text-foreground">
          Tuesday, October&nbsp;13
        </h1>
        <p className="mt-1 text-xs text-text-sub">{TAGLINE}</p>

        <nav aria-label="Legal and support" className="mt-3">
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
            {[
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/support", "Support"],
              ["/accessibility", "Accessibility"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-foreground underline decoration-border underline-offset-4 hover:text-amber hover:decoration-amber focus-visible:text-amber focus-visible:outline-none"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-2 text-[0.7rem] text-text-sub">
          <a href="mailto:info@proaudiotrainingacademy.com" className="hover:text-amber">
            info@proaudiotrainingacademy.com
          </a>
        </p>

        <details open={error} className="mt-3 border-t border-border pt-2">
          <summary className="cursor-pointer text-[0.7rem] text-text-sub">Early access</summary>
          <form method="POST" action="/api/unlock" autoComplete="off" className="mt-2 flex gap-2">
            <input
              type="password"
              name="key"
              placeholder="Key"
              aria-label="Access key"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-center text-sm text-foreground outline-none focus:border-amber"
            />
            <button
              type="submit"
              className="rounded-md bg-amber px-3 py-1.5 text-xs font-bold text-background hover:bg-amber-deep"
            >
              Enter
            </button>
          </form>
          {error ? <p className="mt-1 text-xs text-[#ff4b3a]">Incorrect key. Try again.</p> : null}
        </details>
      </div>
    </div>
  );
}
