"use client";

import { useEffect, useRef, useState } from "react";
import type { AppScreenDef } from "@/lib/app-screens";

const WIDTH = {
  sm: "w-[132px]",
  md: "w-[168px]",
  lg: "w-[196px]",
  marquee: "w-[120px] sm:w-[160px]",
} as const;

type Asset = { kind: "video"; src: string } | { kind: "image"; src: string };

function assetFromScreen(screen: AppScreenDef): Asset {
  if (screen.media === "video") {
    return { kind: "video", src: `/app-screens/${screen.file}.mp4` };
  }
  return { kind: "image", src: `/app-screens/${screen.file}.png` };
}

export function AppScreen({
  screen,
  size = "md",
  caption = false,
  className = "",
  decorative = false,
}: {
  screen: AppScreenDef;
  size?: keyof typeof WIDTH;
  caption?: boolean;
  className?: string;
  /** Hide from AT when this frame is a duplicate in the marquee. */
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const planned = assetFromScreen(screen);
  const asset = failed ? null : planned;

  useEffect(() => {
    setFailed(false);
    setReady(false);
  }, [screen.file, screen.media]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || planned.kind !== "video" || failed) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [planned.kind, planned.src, failed]);

  const label = `${screen.title}. ${screen.caption}`;
  const imageFit = screen.fit === "contain" ? "object-contain" : "object-cover";

  return (
    <figure className={`mx-auto ${WIDTH[size]} ${className}`}>
      <div className="rounded-[1.65rem] border border-border bg-[#070707] p-[5px] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <div
          className="relative aspect-[9/19] overflow-hidden rounded-[1.3rem] bg-surface"
          style={{
            background: `radial-gradient(120% 70% at 50% 0%, ${screen.tint}28, transparent 62%)`,
          }}
        >
          {ready ? null : (
          <span
            aria-hidden
            className="absolute left-1/2 top-1.5 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/55"
          />
          )}
          <div className="flex h-full flex-col items-center justify-center px-3 text-center">
            <p
              className="font-mono text-[0.6rem] uppercase tracking-[0.28em]"
              style={{ color: screen.tint }}
            >
              App screen
            </p>
            <p className="mt-2 font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              {screen.title}
            </p>
            <p className="mt-1 text-[0.7rem] leading-snug text-text-muted">
              {screen.caption}
            </p>
          </div>
          {asset?.kind === "video" ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              muted
              loop
              playsInline
              preload="metadata"
              src={asset.src}
              onLoadedData={() => setReady(true)}
              onError={() => setFailed(true)}
              aria-hidden={decorative}
              aria-label={decorative ? undefined : label}
            />
          ) : null}
          {asset?.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- optional public still
            <img
              src={asset.src}
              alt={decorative ? "" : label}
              className={`absolute inset-0 h-full w-full ${imageFit} transition-opacity ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          ) : null}
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {screen.title}
          </p>
          <p className="mt-0.5 text-xs text-text-sub">{screen.caption}</p>
        </figcaption>
      ) : null}
    </figure>
  );
}
