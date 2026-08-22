"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logoMark from "@/public/logo-mark.png";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/academy", label: "Academy" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/membership", label: "Membership" },
  { href: "/credentials", label: "Credentials" },
  { href: "/verify", label: "Verify" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Pro Audio Training Academy home"
          onClick={() => setOpen(false)}
        >
          <Image
            src={logoMark}
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-sm"
          />
        </Link>
        <ul className="hidden items-center gap-6 lg:flex">
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
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-text-sub transition-colors hover:text-amber sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/get"
            className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
          >
            Get the app
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>
      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background lg:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-2 py-2.5 text-base font-medium text-foreground hover:bg-surface hover:text-amber"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-md px-2 py-2.5 text-base font-medium text-text-sub hover:bg-surface hover:text-amber sm:hidden"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
