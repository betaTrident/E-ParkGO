import { notFound } from "next/navigation";

import { TicketPageClient } from "@/features/tickets/components/ticket-page-client";
import { getTicketPrintFacts } from "@/features/tickets/service";
import { requireActiveProfile } from "@/lib/auth/session";

interface TicketPageProps {
  params: Promise<{ ticketNumber: string }>;
  searchParams: Promise<{ issued?: string; recovery?: string }>;
}

export default async function TicketPage({ params, searchParams }: TicketPageProps) {
  const profile = await requireActiveProfile();
  const { ticketNumber } = await params;
  const query = await searchParams;
  const facts = await getTicketPrintFacts(
    ticketNumber,
    profile.parking_location_id,
  );

  if (!facts) {
    notFound();
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <TicketPageClient
        facts={facts}
        ticketNumber={ticketNumber}
        issued={query.issued === "1"}
        recovery={query.recovery === "REISSUE_REQUIRED" ? "REISSUE_REQUIRED" : null}
      />
    </div>
  );
}
