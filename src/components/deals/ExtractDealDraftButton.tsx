"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { extractDealDraftFromSourceFile } from "@/app/deals/actions";

export function ExtractDealDraftButton({
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
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await extractDealDraftFromSourceFile(dealId, sourceFileId);
              router.refresh();
            } catch (extractError) {
              setError(
                extractError instanceof Error
                  ? extractError.message
                  : "Failed to extract draft."
              );
            }
          });
        }}
        className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Extracting..." : "Extract Draft"}
      </button>
      {error ? <p className="max-w-md text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
