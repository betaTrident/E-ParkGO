import {
  BarChart3,
  Bell,
  CalendarDays,
  CarFront,
  ChevronDown,
  Cloud,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPinned,
  QrCode,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { requireActiveProfile } from "@/lib/auth/session";
import type { ActiveProfile } from "@/lib/auth/types";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    available: true,
  },
  { label: "Entries", href: "/entry", icon: CarFront, available: false },
  { label: "Scan & Exit", href: "/scanner", icon: QrCode, available: false },
  { label: "Payments", href: "/payments", icon: CreditCard, available: false },
  {
    label: "Active Sessions",
    href: "/sessions",
    icon: CalendarDays,
    available: false,
  },
  {
    label: "Parking Spaces",
    href: "/spaces",
    icon: MapPinned,
    available: false,
  },
  { label: "Reports", href: "/reports", icon: BarChart3, available: false },
  { label: "Rates", href: "/rates", icon: SlidersHorizontal, available: false },
] as const;

const mobileNavigation = navigation.slice(0, 4);

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

interface ProtectedShellProps {
  children: React.ReactNode;
  profile: ActiveProfile;
}

export function ProtectedShell({
  children,
  profile,
}: ProtectedShellProps) {
  const initials = getInitials(profile.full_name);

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-[#10213d] dark:bg-[#07111f] dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] border-r border-[#dde5ef] bg-white dark:border-slate-800 dark:bg-[#0b1626] lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          aria-label="E-ParkGO dashboard"
          className="flex h-[94px] items-center border-b border-[#e5ebf3] px-7 dark:border-slate-800"
        >
          <BrandLogo priority className="h-11 w-[10.4rem]" />
        </Link>

        <nav aria-label="Primary navigation" className="space-y-1 px-3 py-5">
          {navigation.map(({ label, href, icon: Icon, available }) =>
            available ? (
              <Link
                key={href}
                href={href}
                aria-current="page"
                className="flex min-h-11 items-center gap-4 rounded-lg bg-[#eaf2ff] px-4 text-sm font-semibold text-[#0969f9] transition-colors hover:bg-[#dceaff] dark:bg-blue-500/15 dark:text-blue-300"
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                {label}
              </Link>
            ) : (
              <span
                key={href}
                aria-disabled="true"
                title={`${label} becomes available in a later implementation phase`}
                className="flex min-h-11 cursor-not-allowed items-center gap-4 rounded-lg px-4 text-sm font-medium text-[#263955] opacity-70 dark:text-slate-300"
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                {label}
              </span>
            ),
          )}

          {profile.role === "ADMIN" ? (
            <>
              <span
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed items-center gap-4 rounded-lg px-4 text-sm font-medium text-[#263955] opacity-70 dark:text-slate-300"
              >
                <Users aria-hidden="true" className="size-[18px]" />
                Staff &amp; Users
              </span>
              <span
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed items-center gap-4 rounded-lg px-4 text-sm font-medium text-[#263955] opacity-70 dark:text-slate-300"
              >
                <Settings aria-hidden="true" className="size-[18px]" />
                Settings
              </span>
            </>
          ) : null}
        </nav>

        <div className="mt-auto space-y-4 px-5 pb-5">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-900/60 dark:from-blue-950/50 dark:to-slate-900">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#0969f9] dark:text-blue-300">
              <Cloud aria-hidden="true" className="size-6" />
              <span>
                Serverless &amp;
                <br />
                Scalable
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Built on modern cloud services for reliability and performance.
            </p>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              className="min-h-11 w-full justify-start gap-3 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[228px]">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center gap-4 border-b border-[#dde5ef] bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-[#0b1626]/95 sm:px-6 xl:px-8">
          <Link
            href="/dashboard"
            aria-label="E-ParkGO dashboard"
            className="mr-auto lg:hidden"
          >
            <BrandLogo compact />
          </Link>
          <h1 className="mr-auto hidden text-[26px] font-bold tracking-[-0.03em] lg:block">
            Dashboard
          </h1>

          <div className="hidden h-11 min-w-48 items-center gap-3 rounded-lg border border-[#d9e2ee] bg-white px-4 text-sm font-medium shadow-xs dark:border-slate-700 dark:bg-slate-900 xl:flex">
            <MapPinned
              aria-hidden="true"
              className="size-[18px] text-slate-500"
            />
            <span>Main Street Parking</span>
            <ChevronDown aria-hidden="true" className="ml-auto size-4" />
          </div>
          <div className="hidden h-11 items-center gap-3 rounded-lg border border-[#d9e2ee] bg-white px-4 text-sm font-medium shadow-xs dark:border-slate-700 dark:bg-slate-900 xl:flex">
            <CalendarDays
              aria-hidden="true"
              className="size-[18px] text-slate-500"
            />
            <span>Today</span>
            <ChevronDown aria-hidden="true" className="size-4" />
          </div>
          <label className="relative hidden min-w-52 flex-1 lg:block lg:max-w-60 2xl:max-w-[310px]">
            <span className="sr-only">Search parking operations</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search..."
              disabled
              title="Search becomes available in a later phase"
              className="h-11 w-full rounded-lg border border-[#d9e2ee] bg-white pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <button
            type="button"
            disabled
            aria-label="Notifications become available in a later phase"
            className="relative flex size-11 cursor-not-allowed items-center justify-center rounded-full text-slate-500 opacity-75"
          >
            <Bell aria-hidden="true" className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
          </button>
          <ThemeToggle />
          <div className="hidden h-11 items-center gap-3 sm:flex">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 text-xs font-bold text-white ring-2 ring-blue-100 dark:ring-blue-900">
              {initials}
            </span>
            <span className="hidden min-w-0 xl:block">
              <span className="block max-w-32 truncate text-sm font-semibold">
                {profile.full_name}
              </span>
              <span className="block text-xs capitalize text-slate-500 dark:text-slate-400">
                {profile.role.toLowerCase()}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="hidden size-4 text-slate-400 xl:block"
            />
          </div>
        </header>

        <main className="min-h-[calc(100dvh-76px)] pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-[#0b1626]/95 lg:hidden"
      >
        {mobileNavigation.map(({ label, href, icon: Icon, available }) =>
          available ? (
            <Link
              key={href}
              href={href}
              aria-current="page"
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-blue-600"
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          ) : (
            <span
              key={href}
              aria-disabled="true"
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-400"
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </span>
          ),
        )}
      </nav>
    </div>
  );
}

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireActiveProfile();

  return <ProtectedShell profile={profile}>{children}</ProtectedShell>;
}
