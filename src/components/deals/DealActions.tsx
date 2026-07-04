"use client";

import { useTransition } from "react";
import { restoreDeal, softDeleteDeal } from "@/app/deals/actions";

export function DeleteDealButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          "Delete this deal? This is recoverable from the deleted deals section."
        );

        if (!confirmed) {
          return;
        }

        startTransition(() => {
          void softDeleteDeal(dealId);
        });
      }}
      className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export function RestoreDealButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void restoreDeal(dealId);
        });
      }}
      className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Restoring..." : "Restore"}
    </button>
  );
}
