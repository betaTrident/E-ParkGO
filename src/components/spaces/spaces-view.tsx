"use client";

import { useActionState, useTransition } from "react";

import { SpaceBoard } from "@/components/spaces/space-board";
import {
  updateSpaceStatusAction,
  type SpaceActionState,
} from "@/features/spaces/actions";
import type { SpaceBoardRecord } from "@/features/spaces/service";

const initialState: SpaceActionState = {
  success: false,
  error: null,
  message: null,
};

interface SpacesViewProps {
  spaces: SpaceBoardRecord[];
  zones: { id: string; code: string; name: string }[];
  isAdmin: boolean;
}

export function SpacesView({ spaces, zones, isAdmin }: SpacesViewProps) {
  const [state, formAction] = useActionState(updateSpaceStatusAction, initialState);
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus(space: SpaceBoardRecord) {
    const nextStatus =
      space.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE";
    const formData = new FormData();
    formData.set("spaceId", space.id);
    formData.set("status", nextStatus);
    formData.set("expectedVersion", String(space.version));
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="space-y-4">
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {state.message}
        </p>
      ) : null}
      <SpaceBoard
        spaces={spaces}
        zones={zones}
        isAdmin={isAdmin}
        {...(isAdmin && !isPending
          ? { onToggleStatus: handleToggleStatus }
          : {})}
      />
    </div>
  );
}
