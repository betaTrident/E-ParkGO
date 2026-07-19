import { Building2, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

import type { ActiveProfile } from "@/lib/auth/types";

interface DashboardViewProps {
  profile: ActiveProfile;
  error?: string;
}

const readinessItems = [
  {
    label: "Authentication",
    value: "Active",
    detail: "Secure server-side session verified",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    label: "Location access",
    value: "Assigned",
    detail: "Requests are restricted to your facility",
    icon: MapPin,
    tone: "green",
  },
  {
    label: "Account role",
    value: "Authorized",
    detail: "Role and permissions loaded from your profile",
    icon: CheckCircle2,
    tone: "violet",
  },
] as const;

export function DashboardView({ profile, error }: DashboardViewProps) {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Operations overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {profile.full_name}. Your secure workspace is ready.
        </p>
      </div>

      <section aria-labelledby="readiness-title" className="space-y-3">
        <h2 id="readiness-title" className="sr-only">
          Account readiness
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {readinessItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="reference-card flex min-h-36 items-start gap-4 p-5"
              >
                <span
                  className={
                    item.tone === "green"
                      ? "icon-surface bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                      : item.tone === "violet"
                        ? "icon-surface bg-violet-50 text-violet-600 dark:bg-violet-500/10"
                        : "icon-surface bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                  }
                >
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="reference-card p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="icon-surface bg-blue-50 text-blue-600 dark:bg-blue-500/10">
              <Building2 aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                Facility workspace
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Verified account scope
              </p>
            </div>
          </div>
          <dl className="grid gap-4 border-t border-slate-200 pt-5 text-sm dark:border-slate-800 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Operator</dt>
              <dd className="mt-1 font-semibold text-slate-950 dark:text-white">
                {profile.full_name}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="mt-1 font-semibold text-slate-950 dark:text-white">
                {profile.role}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500 dark:text-slate-400">
                Parking location ID
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                {profile.parking_location_id}
              </dd>
            </div>
          </dl>
        </article>

        <article className="reference-card bg-gradient-to-br from-blue-50 to-emerald-50 p-5 dark:from-blue-950/30 dark:to-emerald-950/20 sm:p-6">
          <ShieldCheck
            aria-hidden="true"
            className="mb-5 size-9 text-blue-600"
          />
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Secure by default
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Authorization is checked on the server and enforced again by
            database row-level security.
          </p>
          <p className="mt-5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Phase 4 access controls enabled
          </p>
        </article>
      </section>
    </div>
  );
}
