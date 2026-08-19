import Link from "next/link";

const FOOTER_SECTIONS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Academy",
    links: [
      { href: "/verify", label: "Verify a Credential" },
      { href: "/tubes", label: "Tube Reference" },
      { href: "/institutions", label: "For Institutions" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/support", label: "Support" },
    ],
  },
];

export default function Footer() {
  const year = 2026;
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
            Pro Audio Training Academy
          </p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">
            Professional audio education, certification, and credential
            verification. The Academy&rsquo;s training and testing live in the
            mobile app; this site is your companion for credentials, references,
            and account access.
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
