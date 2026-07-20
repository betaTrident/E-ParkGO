import { ArrowRight, Check, Link2, MessageCircle } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "Themes", href: "#themes" },
] as const;

const companyLinks = [
  { label: "About", href: "#about" },
  { label: "Security", href: "#about" },
  { label: "Accessibility", href: "#about" },
] as const;

export function LandingFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-slate-200 bg-white px-5 py-12 dark:border-white/10 dark:bg-[#050b0f] sm:px-8"
    >
      <div className="mx-auto grid max-w-[1340px] gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <BrandLogo compact />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
            A modern parking management PWA for simpler entry, secure payments,
            and clear operational insights.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="#about"
              aria-label="About E-ParkGO"
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 dark:border-white/10"
            >
              <Link2 aria-hidden="true" className="size-4" />
            </a>
            <a
              href="#contact"
              aria-label="E-ParkGO contact information"
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 dark:border-white/10"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
        <FooterLinks title="Product" links={productLinks} />
        <FooterLinks title="Company" links={companyLinks} />
        <div>
          <h2 className="text-sm font-semibold">Access</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Staff and administrator access is available through the secure
            sign-in portal.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300"
          >
            Staff sign in <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1340px] flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-500">
        <p>© 2026 E-ParkGO. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <Check aria-hidden="true" className="size-4 text-teal-600" />
          Built for dependable parking operations.
        </p>
      </div>
    </footer>
  );
}

interface FooterLinksProps {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="hover:text-teal-700 dark:hover:text-teal-300"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
