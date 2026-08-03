"use client";

import { useCallback, useState } from "react";

import { TicketView } from "@/components/tickets/ticket-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  reissueTicketAction,
  type TicketActionState,
} from "@/features/tickets/actions";
import type { TicketPrintFacts } from "@/features/tickets/service";
import { useTicketCredentials } from "@/lib/security/ticket-credential-context";

const initialReissueState: TicketActionState = {
  success: false,
  error: null,
  qrPayload: null,
  credentialRecovery: null,
};

interface TicketPageClientProps {
  facts: TicketPrintFacts;
  ticketNumber: string;
  issued: boolean;
  recovery: "REISSUE_REQUIRED" | null;
}

export function TicketPageClient({
  facts,
  ticketNumber,
  issued,
  recovery,
}: TicketPageClientProps) {
  const {
    readTicketCredential,
    storeTicketCredential,
    clearTicketCredential,
  } = useTicketCredentials();
  const [qrPayload, setQrPayload] = useState<string | null>(() => {
    if (issued) {
      return readTicketCredential(ticketNumber);
    }

    return null;
  });
  const [credentialRecovery, setCredentialRecovery] = useState<
    "REISSUE_REQUIRED" | null
  >(() => {
    if (recovery === "REISSUE_REQUIRED") {
      return recovery;
    }

    if (issued) {
      return readTicketCredential(ticketNumber) ? null : "REISSUE_REQUIRED";
    }

    return "REISSUE_REQUIRED";
  });
  const [reissueState, setReissueState] = useState(initialReissueState);
  const [reissuePending, setReissuePending] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const clearCredential = useCallback(() => {
    clearTicketCredential(ticketNumber);
    setQrPayload(null);
  }, [clearTicketCredential, ticketNumber]);

  const handleReissue = async (formData: FormData) => {
    setReissuePending(true);
    formData.set("idempotencyKey", crypto.randomUUID());
    const result = await reissueTicketAction(ticketNumber, reissueState, formData);
    setReissueState(result);
    setReissuePending(false);

    if (result.success && result.qrPayload) {
      storeTicketCredential(ticketNumber, result.qrPayload);
      setQrPayload(result.qrPayload);
      setCredentialRecovery(null);
    } else if (result.credentialRecovery) {
      setCredentialRecovery(result.credentialRecovery);
    }
  };

  return (
    <div className="space-y-8">
      <TicketView
        facts={facts}
        qrPayload={qrPayload}
        credentialRecovery={credentialRecovery}
        onClearCredential={clearCredential}
      />

      {!qrPayload ? (
        <section
          aria-labelledby="reissue-heading"
          className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 id="reissue-heading" className="text-lg font-semibold">
            Reissue ticket
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Reissue revokes the previous QR credential and issues a replacement ticket.
          </p>
          <form action={handleReissue} className="mt-4 space-y-4">
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                name="reason"
                required
                minLength={10}
                placeholder="Ticket damaged during initial print"
              />
            </div>
            {reissueState.error ? (
              <p role="alert" className="text-sm text-red-600">
                {reissueState.error}
              </p>
            ) : null}
            <Button type="submit" disabled={reissuePending}>
              {reissuePending ? "Reissuing..." : "Reissue ticket"}
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
