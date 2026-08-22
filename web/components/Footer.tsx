import Link from "next/link";

const FOOTER_SECTIONS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Academy",
    links: [
      { href: "/academy", label: "The Academy" },
      { href: "/curriculum", label: "Curriculum Development" },
      { href: "/credentials", label: "Credentials" },
      { href: "/membership", label: "Membership" },
      { href: "/get", label: "Get the app" },
      { href: "/about", label: "About" },
      { href: "/standards", label: "Educational Standards" },
    ],
  },
  {
    heading: "Verify & Organizations",
    links: [
      { href: "/verify", label: "Verify a Credential" },
      { href: "/employers", label: "For Employers" },
      { href: "/institutions", label: "For Institutions" },
      { href: "/tubes", label: "Tube Reference" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/support", label: "Support" },
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function Footer() {
  const year = 2026;
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
            Pro Audio Training Academy
          </p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">
            A structured educational system for learning, organizing, applying,
            and documenting professional audio knowledge. The mobile app is the
            primary learning environment; this site supports accounts,
            credentials, references, and verification.
          </p>
        </div>
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-text-sub">
              {section.heading}
            </p>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-amber"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {year} Pro Audio Training Academy. All rights reserved.</p>
          <p>info@proaudiotrainingacademy.com</p>
        </div>
      </div>
    </footer>
  );
}
