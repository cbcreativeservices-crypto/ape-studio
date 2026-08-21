import Image from "next/image";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  APP_LINKS_LIVE,
  APP_QR_SRC,
  APP_QR_READY,
} from "@/lib/appstore";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0" fill="currentColor">
      <path d="M16.365 12.9c.02 2.53 2.22 3.37 2.24 3.38-.02.06-.35 1.2-1.16 2.38-.7 1.02-1.43 2.03-2.58 2.05-1.12.02-1.48-.66-2.77-.66-1.28 0-1.69.64-2.75.68-1.1.04-1.95-1.1-2.66-2.12-1.44-2.08-2.55-5.88-1.07-8.45.74-1.28 2.06-2.09 3.49-2.11 1.09-.02 2.12.73 2.79.73.67 0 1.92-.9 3.24-.77.55.02 2.1.22 3.1 1.68-.08.05-1.85 1.08-1.83 3.22M14.2 6.34c.59-.72 1-1.71.89-2.71-.86.03-1.9.57-2.51 1.28-.55.63-1.03 1.64-.9 2.61.96.07 1.93-.49 2.52-1.18" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0">
      <path d="M3.6 2.4 13.6 12 3.6 21.6c-.35-.2-.6-.6-.6-1.08V3.48c0-.48.25-.88.6-1.08Z" fill="#34d399" />
      <path d="M16.8 8.8 13.6 12l3.2 3.2 3.35-1.9c.7-.4.7-1.4 0-1.8L16.8 8.8Z" fill="#fbbf24" />
      <path d="M13.6 12 3.6 2.4c.1-.06.36-.16.7-.12l12.5 6.52L13.6 12Z" fill="#60a5fa" />
      <path d="M13.6 12 4.3 21.72c.34.04.6-.06.7-.12l12.5-6.52L13.6 12Z" fill="#f87171" />
    </svg>
  );
}

function Badge({
  href,
  glyph,
  top,
  bottom,
}: {
  href?: string;
  glyph: React.ReactNode;
  top: string;
  bottom: string;
}) {
  const inner = (
    <span className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
      {glyph}
      <span className="text-left leading-tight">
        <span className="block text-[0.65rem] uppercase tracking-wide text-text-muted">{top}</span>
        <span className="block text-sm font-semibold text-foreground">{bottom}</span>
      </span>
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform hover:-translate-y-0.5"
      >
        {inner}
      </a>
    );
  }
  // Not live yet — non-clickable, dimmed.
  return <span className="cursor-default opacity-45">{inner}</span>;
}

export default function GetTheApp({ className = "" }: { className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-surface/40 p-5 ${className}`}>
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
        Get the app
      </h2>
      <p className="mt-1 text-sm text-text-sub">
        Download the Pro Audio Training Academy app to create your account and
        start learning. Membership is available inside the app.
      </p>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-3">
          <Badge
            href={APP_LINKS_LIVE && APP_STORE_URL ? APP_STORE_URL : undefined}
            glyph={<AppleGlyph />}
            top="Download on the"
            bottom="App Store"
          />
          <Badge
            href={APP_LINKS_LIVE && PLAY_STORE_URL ? PLAY_STORE_URL : undefined}
            glyph={<PlayGlyph />}
            top="Get it on"
            bottom="Google Play"
          />
        </div>

        <div className="flex items-center gap-3">
          {APP_QR_READY ? (
            <Image
              src={APP_QR_SRC}
              alt="Scan to download the Pro Audio Training Academy app"
              width={96}
              height={96}
              className="rounded-md border border-border bg-white p-1"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border text-center text-[0.65rem] leading-tight text-text-muted">
              QR
              <br />
              coming soon
            </div>
          )}
          <span className="text-xs text-text-muted sm:hidden">Scan to download</span>
        </div>
      </div>

      {!APP_LINKS_LIVE ? (
        <p className="mt-4 text-xs text-text-muted">
          App Store and Google Play links are coming soon.
        </p>
      ) : null}
    </section>
  );
}
