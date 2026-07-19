import type { ReactNode } from "react";
import { BarChart3, ShieldCheck, Workflow } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface AuthShellProps {
  children: ReactNode;
}

const benefits = [
  {
    icon: BarChart3,
    title: "Real-time insights",
    detail: "Live operational visibility.",
  },
  {
    icon: ShieldCheck,
    title: "Secure and reliable",
    detail: "Protected facility access.",
  },
  {
    icon: Workflow,
    title: "Automated operations",
    detail: "Fast, focused workflows.",
  },
];

const chartBars = [
  "h-[64%]",
  "h-[84%]",
  "h-[52%]",
  "h-[90%]",
  "h-[72%]",
  "h-[78%]",
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,0.92fr)_minmax(32rem,1.08fr)]">
      <section className="relative hidden overflow-hidden border-r bg-blue-50/70 p-12 lg:flex lg:flex-col dark:bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_28%,rgba(37,99,235,0.14),transparent_38%),radial-gradient(circle_at_78%_74%,rgba(16,185,129,0.12),transparent_34%)]"
          aria-hidden="true"
        />
        <BrandLogo className="relative z-10" priority />

        <div className="relative z-10 my-auto max-w-xl py-14">
          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Smarter parking from <span className="text-primary">entry</span> to{" "}
            <span className="text-emerald-500">exit</span>.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground xl:text-lg">
            Manage parking operations efficiently with clear, secure, and
            dependable workflows built for staff on the move.
          </p>

          <div className="mt-10 rounded-2xl border border-blue-200/70 bg-background/85 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.10)] backdrop-blur-sm dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-semibold">Facility operations</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Protected staff workspace
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Secure
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3" aria-hidden="true">
              {chartBars.map((heightClass, index) => (
                <div
                  key={index}
                  className="flex h-16 items-end rounded-lg bg-muted/60 p-2"
                >
                  <div
                    className={`w-full rounded-sm bg-primary/75 ${heightClass}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ul className="relative z-10 grid grid-cols-3 gap-5">
          {benefits.map(({ icon: Icon, title, detail }) => (
            <li key={title}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="absolute right-4 top-4 sm:right-8 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <BrandLogo priority />
          </div>
          <div className="rounded-2xl border bg-card px-5 py-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:px-10">
            {children}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Secure staff and administrator access
          </p>
        </div>
      </section>
    </main>
  );
}
