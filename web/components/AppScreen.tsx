"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppScreenDef } from "@/lib/app-screens";

const WIDTH = {
  sm: "w-[132px]",
  md: "w-[168px]",
  lg: "w-[196px]",
  marquee: "w-[120px] sm:w-[160px]",
} as const;

type Asset =
  | { kind: "video"; src: string; poster?: string }
  | { kind: "image"; src: string };

function assetFromScreen(screen: AppScreenDef): Asset {
  if (screen.media === "video") {
    return { kind: "video", src: `/app-screens/${screen.file}.mp4`, poster: screen.poster };
  }
  return { kind: "image", src: `/app-screens/${screen.file}.png` };
}

export function AppScreen({
  screen,
  size = "md",
  caption = false,
  className = "",
  decorative = false,
  eager = false,
}: {
  screen: AppScreenDef;
  size?: keyof typeof WIDTH;
  caption?: boolean;
  className?: string;
  /** Hide from AT when this frame is a duplicate in the marquee. */
  decorative?: boolean;
  /**
   * Phone load speed (SEO part C4, 2026-11-14): every video loads only its
   * metadata and plays only while on screen. The one clip that is on screen
   * at first paint (the hero's first frame) passes `eager` so it loads and
   * starts at once and the hero never shows an empty frame.
   */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const planned = assetFromScreen(screen);
  const asset = failed ? null : planned;

  const markReady = useCallback(() => setReady(true), []);
  const identity = `${screen.file}:${screen.media}`;
  const prevIdentity = useRef(identity);

  useEffect(() => {
    if (prevIdentity.current === identity) return;
    prevIdentity.current = identity;
    setFailed(false);
    setReady(false);
  }, [identity]);

  useEffect(() => {
    const img = imageRef.current;
    if (img && img.complete && img.naturalWidth > 0) setReady(true);
    // A video counts as ready once a frame can be painted (not on metadata
    // alone: with preload="metadata" that would show a blank frame).
    const vid = videoRef.current;
    if (vid && vid.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true);
  }, [planned.src, failed]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || planned.kind !== "video" || failed) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // The eager clip carries autoPlay in the HTML; honour reduced motion.
      el.pause();
      return;
    }

    const tryPlay = () => {
      void el.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else el.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [planned.kind, planned.src, failed]);

  const label = `${screen.title}. ${screen.caption}`;
  const imageFit = screen.fit === "contain" ? "object-contain" : "object-cover";
  // A video with a poster still is shown at once (the poster covers the frame
  // until the clip plays); one without stays behind the labelled placeholder
  // until its first frame is decoded.
  const videoShown = ready || (asset?.kind === "video" && !!asset.poster);

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
              className={`absolute inset-0 z-[1] h-full w-full object-cover ${
                videoShown ? "opacity-100" : "opacity-0"
              }`}
              muted
              loop
              playsInline
              autoPlay={eager}
              preload={eager ? "auto" : "metadata"}
              poster={asset.poster}
              src={asset.src}
              onLoadedData={markReady}
              onCanPlay={markReady}
              onError={() => setFailed(true)}
              aria-hidden={decorative}
              aria-label={decorative ? undefined : label}
            />
          ) : null}
          {asset?.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- optional public still
            <img
              ref={imageRef}
              src={asset.src}
              alt={decorative ? "" : label}
              className={`absolute inset-0 z-[1] h-full w-full ${imageFit} ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              onLoad={markReady}
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
