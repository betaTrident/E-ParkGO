"use client";

import { useMemo, useRef } from "react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { extractTokenFromPayload } from "@/lib/security/qr-token";
import type { TicketPrintFacts } from "@/features/tickets/service";

import "./ticket-print.css";

export interface TicketViewProps {
  facts: TicketPrintFacts;
  qrPayload: string | null;
  credentialRecovery?: "REISSUE_REQUIRED" | null;
  onClearCredential?: () => void;
}

function formatEntryTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function TicketView({
  facts,
  qrPayload,
  credentialRecovery = null,
  onClearCredential,
}: TicketViewProps) {
  const token = useMemo(() => extractTokenFromPayload(qrPayload), [qrPayload]);
  const clearedRef = useRef(false);

  const handlePrint = () => {
    window.print();
  };

  const handleLeave = () => {
    clearedRef.current = true;
    onClearCredential?.();
    window.location.assign("/entry");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section
        aria-labelledby="ticket-heading"
        data-ticket-view
        className="ticket-print-shell rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
            Parking ticket
          </p>
          <h1 id="ticket-heading" className="text-2xl font-bold tracking-tight">
            {facts.ticket_number}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Entry {formatEntryTime(facts.entry_time)} · Space {facts.zone_code}-
            {facts.space_code}
          </p>
        </header>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Plate</dt>
            <dd>{facts.display_plate_number}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Vehicle type</dt>
            <dd>{facts.vehicle_type_code}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Status</dt>
            <dd>{facts.status}</dd>
          </div>
        </dl>

        {token ? (
          <div
            className="ticket-print-qr mt-6 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4"
            aria-label={`QR code for ticket ${facts.ticket_number}`}
          >
            <QRCode value={qrPayload ?? ""} size={180} />
          </div>
        ) : (
          <p
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {credentialRecovery === "REISSUE_REQUIRED"
              ? "The one-time QR credential is no longer available. Use controlled reissue to print a replacement ticket."
              : "QR credential is not available for this view."}
          </p>
        )}

        <p className="sr-only">
          Ticket number {facts.ticket_number}. Vehicle plate {facts.display_plate_number}.
        </p>
      </section>

      <div className="screen-only flex flex-wrap gap-3">
        <Button type="button" onClick={handlePrint} disabled={!token}>
          Print ticket
        </Button>
        <Button type="button" variant="outline" onClick={handleLeave}>
          Done
        </Button>
      </div>
    </div>
  );
}
