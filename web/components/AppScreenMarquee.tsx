"use client";

import { useEffect, useState } from "react";
import { AppScreen } from "@/components/AppScreen";
import { getAppScreen, type AppScreenId } from "@/lib/app-screens";

export function AppScreenMarquee({
  ids,
}: {
  ids: AppScreenId[];
}) {
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className={`app-screen-marquee relative mt-6 pb-8 ${paused ? "is-paused" : ""}`}
    >
      <div className="app-screen-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16" />
      <div className="app-screen-marquee-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16" />
      <div className="app-screen-marquee-viewport overflow-hidden py-1" aria-hidden>
        <div className="app-screen-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-4 pr-4 sm:gap-5 sm:pr-5">
              {ids.map((id) => (
                <AppScreen
                  key={`${copy}-${id}`}
                  screen={getAppScreen(id)}
                  size="marquee"
                  decorative
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {reduceMotion ? null : (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((v) => !v)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-sub transition-colors hover:border-amber hover:text-amber"
          >
            {paused ? "Play screen tour" : "Pause screen tour"}
          </button>
        </div>
      )}
    </div>
  );
}
