import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BarChart3,
  CarFront,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

interface LandingCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "Themes", href: "#themes" },
  { label: "About", href: "#about" },
];

export const capabilities: LandingCard[] = [
  {
    icon: QrCode,
    title: "QR ticketing",
    description: "Issue secure tickets at entry with one-time tokens and instant print support.",
  },
  {
    icon: Wallet,
    title: "Automated fees",
    description: "Deterministic fee calculation with clear quotes before payment and exit.",
  },
  {
    icon: BarChart3,
    title: "Live operations",
    description: "Monitor occupancy, sessions, and revenue from a real-time dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Role-based access, audit trails, and server-authoritative parking state.",
  },
  {
    icon: Smartphone,
    title: "Mobile-ready PWA",
    description: "Installable on tablets and phones for fast entry, validation, and exit flows.",
  },
];

export const workflow: LandingCard[] = [
  {
    icon: CarFront,
    title: "Vehicle entry",
    description:
      "Staff capture plate and space details, then issue a QR ticket in seconds.",
  },
  {
    icon: Banknote,
    title: "Validate & pay",
    description:
      "Scan or enter the ticket, review the fee quote, and record cash payment with change.",
  },
  {
    icon: DoorOpen,
    title: "Confirmed exit",
    description:
      "Complete exit confirmation, release the space, and keep occupancy accurate.",
  },
];

export const features: LandingCard[] = [
  {
    icon: QrCode,
    title: "QR validation",
    description: "Camera scanning with manual fallback for reliable ticket lookup.",
  },
  {
    icon: Wallet,
    title: "Fee engine",
    description: "PostgreSQL-backed rates, grace periods, and overnight rules.",
  },
  {
    icon: LayoutDashboard,
    title: "Operations dashboard",
    description: "KPIs, occupancy, alerts, and recent movements in one view.",
  },
  {
    icon: Banknote,
    title: "Cash payments",
    description: "Shift-aware tender entry with exact-once payment recording.",
  },
  {
    icon: ClipboardList,
    title: "Audit & reports",
    description: "Traceable actions, exports, and reconciliation-ready summaries.",
  },
  {
    icon: Users,
    title: "Staff roles",
    description: "Scoped permissions for attendants, supervisors, and administrators.",
  },
  {
    icon: ShieldCheck,
    title: "Hardened access",
    description: "Protected routes, sanitized errors, and no client-side fee authority.",
  },
];
