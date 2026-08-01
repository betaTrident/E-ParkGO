"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CarFront,
  ChevronDown,
  ChevronsLeft,
  Cloud,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  QrCode,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";

import { TicketCredentialProvider } from "@/lib/security/ticket-credential-context";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";
import type { ActiveProfile } from "@/lib/auth/types";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    available: true,
  },
  { label: "Entries", href: "/entry", icon: CarFront, available: true },
  { label: "Scan & Exit", href: "/scanner", icon: QrCode, available: true },
  { label: "Payments", href: "/payments", icon: CreditCard, available: false },
  {
    label: "Active Sessions",
    href: "/sessions",
    icon: Calendar,
    available: true,
  },
  {
    label: "Parking Spaces",
    href: "/spaces",
    icon: MapPinned,
    available: false,
  },
  { label: "Reports", href: "/reports", icon: BarChart3, available: false },
  {
    label: "Rates",
    href: "/admin/rates",
    icon: SlidersHorizontal,
    available: true,
    adminOnly: true,
  },
] as const;

const adminLinks = [
  { label: "Staff & Users", href: "/admin/staff", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/entry": "Entries",
  "/scanner": "Scan & Exit",
  "/payments": "Payments",
  "/transactions": "Payments",
  "/sessions": "Active Sessions",
  "/spaces": "Parking Spaces",
  "/reports": "Reports",
  "/admin/rates": "Rates",
  "/admin/staff": "Staff & Users",
  "/admin/settings": "Settings",
  "/verify": "Verify",
  "/exit": "Exit",
  "/tickets": "Ticket",
};

type NavigationItem = (typeof navigation)[number];

function isNavigationVisible(
  item: NavigationItem,
  role: ActiveProfile["role"],
) {
  if (!item.available) return false;
  if ("adminOnly" in item && item.adminOnly && role !== "ADMIN") return false;
  return true;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return title;
  }
  return "Dashboard";
}

interface ProtectedShellProps {
  children: React.ReactNode;
  profile: ActiveProfile;
}

export function ProtectedShell({ children, profile }: ProtectedShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const initials = getInitials(profile.full_name);
  const pageTitle = getPageTitle(pathname);

  const visibleNavigation = navigation.filter((item) =>
    isNavigationVisible(item, profile.role),
  );
  const mobileNavigation = visibleNavigation.slice(0, 4);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <TicketCredentialProvider>
      <div className="min-h-dvh bg-[#F8F9FC] text-[#1E293B] antialiased dark:bg-[#07111f] dark:text-slate-100">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200/80 bg-white transition-[width] duration-200 ease-in-out dark:border-slate-800 dark:bg-[#0b1626] lg:flex lg:flex-col",
            collapsed ? "w-16" : "w-62.5",
          )}
        >
          {/* Logo Header */}
          <Link
            href="/dashboard"
            aria-label="E-ParkGO dashboard"
            className="flex h-20 shrink-0 items-center overflow-hidden px-4"
          >
            <BrandLogo
              compact={collapsed}
              className={cn(
                "transition-[width] duration-200",
                collapsed ? "w-9" : "w-36",
              )}
            />
          </Link>

          {/* Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1"
          >
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const { label, href, icon: Icon } = item;
                const active = isActive(href);

                if (!isNavigationVisible(item, profile.role)) {
                  if (!item.available) {
                    return (
                      <li key={href}>
                        <span
                          aria-disabled="true"
                          title={`${label} — coming soon`}
                          className={cn(
                            "flex h-10 cursor-not-allowed select-none items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400 opacity-50 dark:text-slate-600",
                            collapsed && "justify-center",
                          )}
                        >
                          <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                          {!collapsed && <span>{label}</span>}
                        </span>
                      </li>
                    );
                  }
                  return null;
                }

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                        collapsed && "justify-center",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-4.5 shrink-0",
                          active
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}

              {/* Admin-only links */}
              {profile.role === "ADMIN" && (
                <>
                  {!collapsed && (
                    <li aria-hidden="true">
                      <div className="mx-1 my-2 border-t border-slate-100 dark:border-slate-800" />
                    </li>
                  )}
                  {collapsed && <li aria-hidden="true" className="h-2" />}
                  {adminLinks.map(({ label, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          title={collapsed ? label : undefined}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-blue-600 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                            collapsed && "justify-center",
                          )}
                        >
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "size-4.5 shrink-0",
                              active ? "text-white" : "text-slate-400",
                            )}
                          />
                          {!collapsed && (
                            <span className="truncate">{label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </nav>

          {/* Bottom: Promo card + Collapse toggle */}
          <div className="shrink-0 space-y-2 p-2">
            {!collapsed && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3.5 dark:border-blue-950 dark:bg-blue-950/40">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Cloud aria-hidden="true" className="size-4 shrink-0" />
                  <span>Serverless &amp; Scalable</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Built on modern cloud infrastructure for reliability.
                </p>
                <Link
                  href="#"
                  className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Learn more →
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                collapsed && "justify-center",
              )}
            >
              <ChevronsLeft
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200",
                  collapsed && "rotate-180",
                )}
              />
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Shell */}
        <div
          className={cn(
            "transition-[padding] duration-200 ease-in-out",
            collapsed ? "lg:pl-16" : "lg:pl-62.5",
          )}
        >
          {/* Top Header Navbar */}
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur dark:border-slate-800 dark:bg-[#0b1626]/95 sm:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                aria-label="E-ParkGO dashboard"
                className="mr-auto lg:hidden"
              >
                <BrandLogo compact />
              </Link>

              <h1 className="hidden text-xl font-bold tracking-tight text-slate-900 dark:text-white lg:block">
                {pageTitle}
              </h1>

              {/* Facility Selector */}
              <div className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 xl:flex">
                <Building2 className="size-4 text-slate-400" />
                <span>Main Street Parking</span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </div>

              {/* Date Selector */}
              <div className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 xl:flex">
                <Calendar className="size-4 text-slate-400" />
                <span>May 19, 2025</span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative hidden max-w-xs md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  readOnly
                  className="h-9 w-56 rounded-lg border border-slate-200/90 bg-white pl-9 pr-12 text-xs text-slate-700 placeholder:text-slate-400 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 flex h-5 -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  ⌘ K
                </kbd>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="size-4" />
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Profile */}
              <div className="flex items-center gap-2.5 border-l border-slate-200/80 pl-3 dark:border-slate-800">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
                  {initials}
                </span>
                <div className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-28 truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {profile.full_name}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {profile.role === "ADMIN" ? "Admin" : "Staff"}
                  </span>
                </div>
                <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-h-[calc(100dvh-80px)] pb-24 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Navigation Bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-[#0b1626]/95 lg:hidden"
        >
          {mobileNavigation.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-5",
                    active ? "text-blue-600 dark:text-blue-400" : "",
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </TicketCredentialProvider>
  );
}
