import Image from "next/image";

/**
 * Atmosphere is a ROOM, not a mural.
 *
 * Previous passes pasted uploaded formula/HUD plates as left/right strips.
 * Those files are pictures of knowledge, composed with a dead left half —
 * every crop still reads as “all the art on one side.”
 *
 * This system:
 *   RoomField  — page-level CSS (balanced light, no picture)
 *   Veil       — original 16:9 plates with empty CENTERS; 4-edge vignette
 *   Meterbridge — thin HORIZONTAL rail of signal (Y axis, not X)
 *   Well       — dark pool around AppScreens so phones never sit on a picture
 *
 * Never object-left / object-right a wash. Never a left-to-right fade as the
 * primary mask. Do not reintroduce the uploaded fundamentals/glossary/calc-lab
 * /training-labs documents as section backgrounds.
 */

type Rail = "ceiling" | "floor";
type Tone = "amber" | "blue" | "mix";

/** Page-level room: symmetric radials + a faint grid. Not a picture. */
export function RoomField() {
  return <div aria-hidden className="home-atmosphere" />;
}

/**
 * Full-bleed original plate. Art lives at the edges and horizon; type and
 * phones sit in the dark well. Crop is always center.
 */
export function Veil({
  src,
  opacity = 0.82,
}: {
  src: string;
  opacity?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover object-center"
        style={{ opacity }}
        sizes="100vw"
      />
      {/* Dim the middle for type only. Do not cover the edges — that is the art. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,12,12,0.42)_0%,rgba(12,12,12,0.12)_42%,transparent_68%)]" />
    </div>
  );
}

/** Horizontal rail of studio light and a single trace. Clipped to its own height. */
export function Meterbridge({
  rail = "ceiling",
  tone = "blue",
}: {
  rail?: Rail;
  tone?: Tone;
}) {
  const stroke =
    tone === "amber" ? "#ffc64d" : tone === "mix" ? "#d4c48a" : "#2f9bff";
  const spots =
    tone === "amber"
      ? "radial-gradient(ellipse 38% 90% at 12% 50%, rgba(255,198,77,0.18), transparent 70%), radial-gradient(ellipse 38% 90% at 88% 50%, rgba(47,155,255,0.1), transparent 70%)"
      : tone === "mix"
        ? "radial-gradient(ellipse 38% 90% at 12% 50%, rgba(255,198,77,0.16), transparent 70%), radial-gradient(ellipse 38% 90% at 88% 50%, rgba(47,155,255,0.16), transparent 70%)"
        : "radial-gradient(ellipse 38% 90% at 12% 50%, rgba(47,155,255,0.16), transparent 70%), radial-gradient(ellipse 38% 90% at 88% 50%, rgba(47,155,255,0.16), transparent 70%)";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-0 overflow-hidden ${
        rail === "ceiling"
          ? "top-0 h-[56px] md:h-[120px]"
          : "bottom-0 h-[48px] md:h-[96px]"
      }`}
    >
      <div className="absolute inset-0" style={{ background: spots }} />
      <svg
        className="absolute inset-x-[4%] top-1/2 h-8 w-[92%] -translate-y-1/2 opacity-50 md:h-10"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0 22 C 80 10, 160 30, 240 20 S 400 8, 480 22 S 640 34, 720 18 S 880 8, 960 24 S 1120 30, 1200 16"
          fill="none"
          stroke={stroke}
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
      <div
        className={`absolute inset-0 ${
          rail === "ceiling"
            ? "bg-gradient-to-b from-transparent to-background/35"
            : "bg-gradient-to-t from-transparent to-background/35"
        }`}
      />
    </div>
  );
}

/** Dark radial around AppScreen(s) — product light, not a backdrop. */
export function Well({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative isolate ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[190%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(12,12,12,0.72)_78%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Inner-page atmosphere: original veil + a ceiling rail. */
export function PageAtmosphere({
  src,
  tone = "amber",
  opacity = 0.32,
}: {
  src: string;
  tone?: Tone;
  opacity?: number;
}) {
  return (
    <>
      <Veil src={src} opacity={opacity} />
      <Meterbridge rail="ceiling" tone={tone} />
    </>
  );
}
