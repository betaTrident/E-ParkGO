import {
  ArrowRight,
  CirclePlay,
  Clock3,
  Menu,
  QrCode,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import dashboardImage from "@/app/assets/pages/dashboard.png";
import darkLandingImage from "@/app/assets/pages/Landing-page-dark.png";
import lightLandingImage from "@/app/assets/pages/Landing-page-light.png";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  capabilities,
  features,
  navItems,
  workflow,
} from "@/components/landing/landing-data";
import { LandingFooter } from "@/components/landing/landing-footer";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#fbfdfd] text-slate-950 dark:bg-[#071016] dark:text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#071016]/90">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
          <Link
            href="/"
            aria-label="E-ParkGO home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <BrandLogo compact className="sm:h-10 sm:w-[8.25rem]" />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-8 lg:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-lg bg-teal-600 px-5 text-white shadow-lg shadow-teal-950/10 hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400",
              )}
            >
              Get Started
            </Link>
            <a
              href="#features"
              aria-label="Jump to features"
              className="flex size-11 items-center justify-center rounded-lg border border-slate-200 lg:hidden dark:border-white/15"
            >
              <Menu aria-hidden="true" className="size-5" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_74%_25%,rgba(13,148,136,0.10),transparent_35%)] dark:bg-[radial-gradient(circle_at_70%_22%,rgba(20,184,166,0.12),transparent_36%)]"
          />
          <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:px-14 lg:py-24">
            <div className="max-w-xl">
              <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <span
                  className="size-2 rounded-full bg-teal-500"
                  aria-hidden="true"
                />
                Automated Parking Management PWA
              </p>
              <h1
                id="hero-title"
                className="text-4xl font-bold leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[clamp(3.5rem,4.6vw,4.1rem)]"
              >
                <span className="block">Smarter parking</span>{" "}
                <span className="block">
                  from{" "}
                  <span className="text-teal-600 dark:text-teal-400">
                    entry to exit.
                  </span>
                </span>
              </h1>
              <p className="mt-6 max-w-[590px] text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                <strong className="font-semibold text-slate-900 dark:text-white">
                  E-ParkGO
                </strong>{" "}
                automates vehicle entry, QR ticketing, fee calculation,
                payments, and exit confirmation—delivering a seamless, secure,
                and efficient parking experience.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-lg bg-teal-600 px-6 text-white shadow-xl shadow-teal-950/15 hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400",
                  )}
                >
                  Get Started{" "}
                  <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                </Link>
                <Link
                  href="#workflow"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-lg border-slate-300 bg-white px-6 dark:border-white/20 dark:bg-white/5",
                  )}
                >
                  Watch Demo{" "}
                  <CirclePlay aria-hidden="true" className="ml-2 size-4" />
                </Link>
              </div>
              <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-sm dark:border-white/10">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">
                    Faster entry
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-teal-700 dark:text-teal-300">
                    +98%
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">
                    Operating cost
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-teal-700 dark:text-teal-300">
                    -40%
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">
                    System uptime
                  </dt>
                  <dd className="mt-1 flex items-center gap-1 font-mono text-lg font-semibold text-teal-700 dark:text-teal-300">
                    <Clock3 aria-hidden="true" className="size-4" />
                    24/7
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-4xl lg:translate-x-6">
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/5"
              />
              <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_28px_70px_rgba(15,23,42,0.16)] dark:border-white/15 dark:bg-[#101920] dark:shadow-black/50">
                <Image
                  src={dashboardImage}
                  alt="E-ParkGO parking management dashboard"
                  priority
                  sizes="(min-width: 1024px) 56vw, 94vw"
                  className="aspect-[4/3] w-full rounded-[16px] object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-2 hidden w-40 rounded-[28px] border-[5px] border-slate-900 bg-white p-2 shadow-2xl sm:block dark:border-slate-300 dark:bg-[#0d171d]">
                <div className="rounded-[19px] bg-teal-600 px-3 py-7 text-center text-white dark:bg-teal-500 dark:text-slate-950">
                  <QrCode aria-hidden="true" className="mx-auto size-12" />
                  <p className="mt-3 text-xs font-semibold">Scan QR at Exit</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Platform highlights"
          className="mx-auto max-w-[1340px] px-5 sm:px-8"
        >
          <div className="grid rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-5 dark:border-white/10 dark:bg-white/[0.035]">
            {capabilities.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="border-b border-slate-100 p-6 last:border-b-0 sm:nth-[n+4]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 dark:border-white/10"
              >
                <Icon
                  aria-hidden="true"
                  className="size-9 rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"
                />
                <h2 className="mt-4 text-sm font-semibold">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          aria-labelledby="workflow-title"
          className="scroll-mt-24 px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="workflow-title"
              className="text-center text-3xl font-bold tracking-tight"
            >
              How{" "}
              <span className="text-teal-600 dark:text-teal-400">E-ParkGO</span>{" "}
              Works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {workflow.map(({ title, description, icon: Icon }, index) => (
                <article
                  key={title}
                  className="relative rounded-2xl border border-teal-900/15 bg-white p-7 text-center shadow-sm dark:border-teal-300/15 dark:bg-white/[0.035]"
                >
                  <span className="absolute left-5 top-5 flex size-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white dark:bg-teal-400 dark:text-slate-950">
                    {index + 1}
                  </span>
                  <Icon
                    aria-hidden="true"
                    className="mx-auto size-16 text-teal-600 dark:text-teal-400"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="features-title"
          className="scroll-mt-24 px-5 pb-20 sm:px-8"
        >
          <div className="mx-auto max-w-[1340px]">
            <h2
              id="features-title"
              className="text-center text-3xl font-bold tracking-tight"
            >
              Powerful{" "}
              <span className="text-teal-600 dark:text-teal-400">Features</span>{" "}
              for Modern Parking
            </h2>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {features.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.035]"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-10 rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"
                  />
                  <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="themes"
          aria-labelledby="themes-title"
          className="scroll-mt-24 bg-slate-50 px-5 py-20 dark:bg-black/15 sm:px-8"
        >
          <div className="mx-auto max-w-[1240px]">
            <div className="text-center">
              <h2
                id="themes-title"
                className="text-3xl font-bold tracking-tight"
              >
                Designed for Every Preference
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Choose a clean light experience or an easy-on-the-eyes dark
                workspace.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <Image
                  src={lightLandingImage}
                  alt="E-ParkGO light theme preview"
                  sizes="(min-width: 768px) 45vw, 94vw"
                  className="aspect-[16/8] w-full rounded-xl object-cover object-top"
                />
                <div className="flex items-start gap-3 p-4">
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-amber-500"
                  />
                  <div>
                    <h3 className="font-semibold">Light Mode</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Clean, bright, and optimized for daylight operations.
                    </p>
                  </div>
                </div>
              </article>
              <article className="overflow-hidden rounded-2xl border border-teal-500 bg-[#0b141a] p-3 text-white shadow-sm">
                <Image
                  src={darkLandingImage}
                  alt="E-ParkGO dark theme preview"
                  sizes="(min-width: 768px) 45vw, 94vw"
                  className="aspect-[16/8] w-full rounded-xl object-cover object-top"
                />
                <div className="flex items-start gap-3 p-4">
                  <Sparkles
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-teal-400"
                  />
                  <div>
                    <h3 className="font-semibold">Dark Mode</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Focused, comfortable, and ideal for night shifts.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="about"
          aria-labelledby="trust-title"
          className="scroll-mt-24 px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2 id="trust-title" className="text-3xl font-bold tracking-tight">
              Trusted by Parking Operators
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Built for teams that need reliable, secure, and efficient parking
              operations.
            </p>
            <figure className="mt-9 rounded-2xl border border-slate-200 bg-white px-7 py-9 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div
                className="flex justify-center gap-1 text-amber-400"
                aria-label="Five out of five stars"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    aria-hidden="true"
                    className="size-5 fill-current"
                  />
                ))}
              </div>
              <blockquote className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                “E-ParkGO makes entry faster, payments seamless, and day-to-day
                parking operations easier to understand.”
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold">
                Parking Operations Team
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="px-5 pb-12 sm:px-8">
          <div className="mx-auto flex max-w-[1340px] flex-col items-start justify-between gap-7 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 px-7 py-9 text-white shadow-xl shadow-teal-950/10 md:flex-row md:items-center md:px-12">
            <div>
              <p className="text-2xl font-bold">
                Ready to transform your parking experience?
              </p>
              <p className="mt-2 text-sm text-teal-50">
                Get started with E-ParkGO and see the difference.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-white px-5 text-teal-800 hover:bg-teal-50",
                )}
              >
                Get Started{" "}
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </Link>
              <Link
                href="#workflow"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-white/70 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                View Workflow
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
