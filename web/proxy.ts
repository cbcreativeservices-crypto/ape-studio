import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GATE_ENABLED, GATE_COOKIE, GATE_TOKEN } from "@/lib/gate";

/* ============================================================
 *  SITE GATE — a key is required to view the site.
 *  Settings (on/off + the key) live in  web/lib/gate.ts
 *
 *  On your own computer (npm run dev) the gate is OFF so you can
 *  keep working. It only applies to the LIVE site.
 * ============================================================ */

function gateHtml(error: boolean): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Pro Audio Training Academy</title>
<style>
  :root {
    --bg:#0c0c0c; --surface:#151515; --border:#2a2a2e;
    --amber:#ffc64d; --amber-deep:#ffb400;
    --fg:#f0f0f0; --sub:#a6a6ad; --muted:#8a8b93; --red:#ff4b3a;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; }
  body {
    background: radial-gradient(1000px 500px at 50% -10%, rgba(255,198,77,0.08), transparent 60%), var(--bg);
    color:var(--fg);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
    display:flex; align-items:center; justify-content:center;
    min-height:100%; padding:2rem 1.25rem; text-align:center;
  }
  .wrap { width:100%; max-width:22rem; }
  .logo { width:96px; height:auto; margin:0 auto 1.5rem; display:block; }
  .name {
    font-size:0.8rem; letter-spacing:0.22em; text-transform:uppercase;
    font-weight:600; color:var(--sub); margin-bottom:1.75rem;
  }
  form { display:flex; flex-direction:column; gap:0.75rem; }
  input[type=password] {
    width:100%; padding:0.85rem 1rem; font-size:1rem;
    background:var(--surface); color:var(--fg);
    border:1px solid var(--border); border-radius:10px; outline:none;
    text-align:center; letter-spacing:0.05em;
  }
  input[type=password]:focus { border-color:var(--amber); }
  input[type=password]::placeholder { color:var(--muted); letter-spacing:0.15em; }
  button {
    width:100%; padding:0.85rem 1rem; font-size:0.95rem; font-weight:700;
    background:var(--amber); color:#0c0c0c; border:0; border-radius:10px;
    cursor:pointer; transition:background .15s;
  }
  button:hover { background:var(--amber-deep); }
  .err { color:var(--red); font-size:0.85rem; min-height:1.1em; margin-top:0.25rem; }
</style>
</head>
<body>
  <main class="wrap">
    <img class="logo" src="/logo-hero.png" alt="Pro Audio Training Academy" />
    <div class="name">Pro Audio Training Academy</div>
    <form method="POST" action="/api/unlock" autocomplete="off">
      <input type="password" name="key" placeholder="Enter key" autofocus aria-label="Access key" />
      <button type="submit">Enter</button>
      <div class="err">${error ? "Incorrect key. Try again." : ""}</div>
    </form>
  </main>
</body>
</html>`;
}

export function proxy(request: NextRequest) {
  // Gate turned off (launch) -> everything public.
  if (!GATE_ENABLED) return NextResponse.next();

  // Local dev on your computer -> always show the real site.
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Let the key-check handler run.
  if (pathname.startsWith("/api/unlock")) return NextResponse.next();

  // Already unlocked with a valid cookie -> show the site.
  if (request.cookies.get(GATE_COOKIE)?.value === GATE_TOKEN) {
    return NextResponse.next();
  }

  // Otherwise show ONLY the key screen.
  const error = request.nextUrl.searchParams.get("e") === "1";
  return new NextResponse(gateHtml(error), {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const config = {
  // Run on all routes EXCEPT Next internals and static asset files
  // (so the logo and fonts still load on the key screen).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|mp4|woff|woff2|ttf)$).*)",
  ],
};
