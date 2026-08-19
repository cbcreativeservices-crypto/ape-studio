import Image from "next/image";
import Link from "next/link";
import logoMark from "@/public/logo-mark.png";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/verify", label: "Verify a Credential" },
  { href: "/tubes", label: "Tube Reference" },
  { href: "/institutions", label: "For Institutions" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Pro Audio Training Academy home">
          <Image
            src={logoMark}
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-sm"
          />
          <span className="hidden font-display text-base font-semibold uppercase tracking-wide text-foreground sm:inline">
            Pro Audio Training Academy
          </span>
          <span className="font-display text-base font-semibold uppercase tracking-wide text-foreground sm:hidden">
            The Academy
          </span>
        </Link>
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-text-sub transition-colors hover:text-amber"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/login"
          className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Member Sign In
        </Link>
      </nav>
    </header>
  );
}
