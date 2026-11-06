import Link from "next/link";
import type { PublicSiteSettings } from "@/lib/site";

const FOOTER_LINKS = [
  {
    title: "Explore",
    links: [
      { href: "/news", label: "News" },
      { href: "/software", label: "Software" },
      { href: "/ai", label: "AI Tools" },
      { href: "/tutorials", label: "Tutorials" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/android", label: "Android" },
      { href: "/windows", label: "Windows" },
      { href: "/categories", label: "Categories" },
      { href: "/premium", label: "Premium" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/submission-policy", label: "Submission Policy" },
    ],
  },
];

export function PublicFooter({ settings }: { settings: PublicSiteSettings }) {
  return (
    <footer className="mt-auto border-t border-border bg-[#071833] text-white dark:bg-[#050d18]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">{settings.platformName}</p>
          <div className="mt-3 h-1 w-12 rounded-full bg-secondary" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {settings.tagline}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            {settings.description ||
              "Your daily destination for technology news, AI discoveries, software downloads, and useful resources."}
          </p>
          {settings.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-5 inline-block text-sm font-medium text-secondary hover:underline"
            >
              {settings.contactEmail}
            </a>
          ) : null}
        </div>

        {FOOTER_LINKS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold tracking-wide text-white">{group.title}</p>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 transition hover:text-secondary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {settings.platformName}. All rights reserved.
          </p>
          <p>Listings show distribution source and verification — never installation claims.</p>
        </div>
      </div>
    </footer>
  );
}
