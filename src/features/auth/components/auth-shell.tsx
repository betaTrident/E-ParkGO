import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CarFront,
  House,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface AuthShellProps {
  children: ReactNode;
}

const benefits = [
  {
    icon: BarChart3,
    title: "Real-time insights",
    detail: "Live data and analytics at your fingertips.",
    accent: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    icon: ShieldCheck,
    title: "Secure & reliable",
    detail: "Enterprise-grade protection you can trust.",
    accent:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    icon: Workflow,
    title: "Automated operations",
    detail: "Streamlined workflows with fewer manual tasks.",
    accent:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
] as const;

const trendPoints = [18, 12, 16, 10, 14, 6, 10, 4] as const;

function ParkingIllustration() {
  return (
    <div
      className="relative mt-9 h-[19rem] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/65 shadow-[0_24px_70px_rgba(37,99,235,0.12)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-0 h-[72%] p-5">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-700">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
            <House className="size-3.5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Dashboard
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-100 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <CarFront className="size-4" />
              </span>
              <div>
                <p className="text-[0.55rem] text-slate-500 dark:text-slate-400">
                  Active sessions
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  128
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                P
              </span>
              <div>
                <p className="text-[0.55rem] text-slate-500 dark:text-slate-400">
                  Available spaces
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  342
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-blue-100 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[0.6rem] font-semibold text-slate-800 dark:text-slate-100">
              Revenue trend
            </p>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[0.5rem] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              &#8369;4,315.75
            </span>
          </div>
          <div className="mt-3 flex h-10 items-end gap-2 border-b border-l border-blue-100 px-2 dark:border-slate-700">
            {trendPoints.map((bottom, index) => (
              <span
                key={`${bottom}-${index}`}
                className="relative flex-1 border-t-2 border-blue-500"
                style={{ marginBottom: `${bottom}px` }}
              >
                <span className="absolute -right-0.5 -top-1 size-1.5 rounded-full bg-blue-600" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-blue-100/20 to-blue-200/80 dark:from-slate-800/10 dark:to-slate-800" />
      <div className="absolute -bottom-6 left-8 size-28 rounded-[45%] bg-white shadow-[0_8px_25px_rgba(15,23,42,0.12)] dark:bg-slate-300">
        <CarFront className="absolute left-6 top-5 size-16 text-slate-500" />
      </div>
      <div className="absolute bottom-4 right-24 h-2 w-36 bg-[repeating-linear-gradient(90deg,#2563eb_0_18px,#fff_18px_36px)] shadow-sm" />
      <div className="absolute bottom-0 right-20 h-16 w-3 rounded-t-sm bg-slate-500" />
      <div className="absolute bottom-4 right-6 flex size-14 items-center justify-center rounded-xl border-4 border-white bg-blue-600 text-3xl font-semibold text-white shadow-lg">
        P
      </div>
      <Building2 className="absolute bottom-0 right-0 size-28 translate-x-16 text-blue-200/70 dark:text-slate-700" />
    </div>
  );
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-svh overflow-hidden bg-background lg:grid-cols-[47%_53%]">
      <section className="relative hidden min-h-svh overflow-hidden border-r border-blue-100 bg-[#f2f7ff] px-10 py-9 lg:flex lg:flex-col xl:px-[4.5rem] xl:py-12 dark:border-slate-800 dark:bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgba(255,255,255,0.95),transparent_35%),radial-gradient(circle_at_25%_76%,rgba(59,130,246,0.13),transparent_42%)] dark:bg-[radial-gradient(circle_at_70%_25%,rgba(30,41,59,0.7),transparent_38%)]"
          aria-hidden="true"
        />

        <BrandLogo className="relative z-10" priority />

        <div className="relative z-10 mx-auto my-auto w-full max-w-[34rem] py-8">
          <h2 className="max-w-lg text-[2.55rem] font-bold leading-[1.16] tracking-[-0.035em] text-slate-950 xl:text-[3rem] dark:text-white">
            Smarter parking
            <br />
            from <span className="text-blue-600">entry</span> to{" "}
            <span className="text-emerald-500">exit</span>.
          </h2>
          <p className="mt-5 max-w-[31rem] text-base leading-7 text-slate-600 dark:text-slate-300">
            E-ParkGO helps you manage parking operations efficiently with
            real-time insights and automation.
          </p>

          <ParkingIllustration />
        </div>

        <ul className="relative z-10 grid grid-cols-3 gap-5">
          {benefits.map(({ icon: Icon, title, detail, accent }) => (
            <li key={title}>
              <span
                className={`flex size-11 items-center justify-center rounded-xl ${accent}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative flex min-h-svh flex-col bg-white px-4 py-6 sm:px-8 lg:px-12 dark:bg-slate-950">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-7">
          <div className="w-full max-w-[32.5rem] rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_22px_65px_rgba(15,23,42,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/25">
            <div className="px-5 py-8 sm:px-11 sm:py-10">{children}</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} E-ParkGO. All rights reserved.
        </p>
      </section>
    </main>
  );
}
