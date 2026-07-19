import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CarFront,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signOutAction } from "@/features/auth/actions";
import { requireActiveProfile } from "@/lib/auth/session";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    available: true,
  },
  { label: "Entries", href: "/entry", icon: CarFront, available: false },
  { label: "Scan & Exit", href: "/scanner", icon: QrCode, available: false },
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
] as const;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireActiveProfile();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          aria-label="E-ParkGO dashboard"
          className="px-2"
        >
          <BrandLogo priority />
        </Link>

        <nav aria-label="Primary navigation" className="mt-8 space-y-1">
          {navigation.map(({ label, href, icon: Icon, available }) =>
            available ? (
              <Link key={href} href={href} className="nav-item nav-item-active">
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </Link>
            ) : (
              <span
                key={href}
                aria-disabled="true"
                title={`${label} becomes available in a later implementation phase`}
                className="nav-item cursor-not-allowed opacity-55"
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </span>
            ),
          )}
        </nav>

        {profile.role === "ADMIN" ? (
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </p>
            <span
              aria-disabled="true"
              className="nav-item cursor-not-allowed opacity-55"
            >
              <Users aria-hidden="true" className="size-5" />
              Staff &amp; Users
            </span>
            <span
              aria-disabled="true"
              className="nav-item cursor-not-allowed opacity-55"
            >
              <Settings aria-hidden="true" className="size-5" />
              Settings
            </span>
          </div>
        ) : null}

        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="truncate px-3 text-sm font-semibold">
            {profile.full_name}
          </p>
          <p className="px-3 text-xs text-slate-500 dark:text-slate-400">
            {profile.role}
          </p>
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              className="min-h-11 w-full justify-start gap-3"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Menu aria-hidden="true" className="size-5 text-slate-500" />
            <Link href="/dashboard" aria-label="E-ParkGO dashboard">
              <BrandLogo compact />
            </Link>
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold">
              E-ParkGO Operations
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Location-secured workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{profile.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile.role}
              </p>
            </div>
            <form action={signOutAction} className="lg:hidden">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="min-h-11 gap-2"
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1440px]">
          {children}
        </main>
      </div>
    </div>
  );
}
