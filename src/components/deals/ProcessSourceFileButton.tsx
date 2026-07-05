"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { processDealSourceFile } from "@/app/deals/actions";

export function ProcessSourceFileButton({
  dealId,
  sourceFileId
}: {
  dealId: string;
  sourceFileId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await processDealSourceFile(dealId, sourceFileId);
              router.refresh();
            } catch (processError) {
              setError(
                processError instanceof Error
                  ? processError.message
                  : "Failed to process source file."
              );
            }
          });
        }}
        className="rounded border border-ink/20 px-3 py-1 text-xs font-semibold text-black transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Processing..." : "Process"}
      </button>
      {error ? <p className="max-w-48 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
