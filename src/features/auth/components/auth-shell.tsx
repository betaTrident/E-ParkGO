import type { ReactNode } from "react";
import Image from "next/image";
import { BarChart3, ShieldCheck, Workflow } from "lucide-react";

import parkingHeroIllustration from "@/app/assets/auth/parking-hero-illustration.png";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface AuthShellProps {
  children: ReactNode;
}

const benefits = [
  {
    icon: BarChart3,
    title: "Real-time Insights",
    detail: "Live data and analytics at your fingertips.",
    accent: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    detail: "Enterprise-grade security you can trust.",
    accent:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    icon: Workflow,
    title: "Automated Operations",
    detail: "Streamline workflows and reduce manual tasks.",
    accent:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
] as const;

function ParkingHeroImage() {
  return (
    <div className="relative mt-7 overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-[0_20px_50px_rgba(37,99,235,0.08)] backdrop-blur-xs dark:border-slate-700/60 dark:bg-slate-900/40">
      <div className="relative aspect-square w-full sm:aspect-4/3">
        <Image
          src={parkingHeroIllustration}
          alt="E-ParkGO Smart Parking dashboard and automated entry gate illustration"
          fill
          priority
          sizes="(min-width: 1280px) 34rem, (min-width: 1024px) 47vw, 100vw"
          className="object-contain object-center"
        />
      </div>
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

        <div className="relative z-10 mx-auto my-auto w-full max-w-[34rem] py-6">
          <h2 className="max-w-lg text-[2.55rem] font-bold leading-[1.16] tracking-[-0.035em] text-slate-950 xl:text-[3rem] dark:text-white">
            Smarter parking
            <br />
            from <span className="text-blue-600">entry</span> to{" "}
            <span className="text-emerald-500">exit</span>.
          </h2>
          <p className="mt-4 max-w-[31rem] text-base leading-7 text-slate-600 dark:text-slate-300">
            E-ParkGO helps you manage parking operations efficiently with
            real-time insights and automation.
          </p>

          <ParkingHeroImage />
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
