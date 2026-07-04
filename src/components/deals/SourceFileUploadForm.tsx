"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  uploadDealSourceFile,
  type UploadDealSourceFileActionState
} from "@/app/deals/actions";
import {
  SOURCE_FILE_DOCUMENT_TYPE_LABELS,
  SOURCE_FILE_DOCUMENT_TYPE_OPTIONS
} from "@/lib/dealConstants";

const initialActionState: UploadDealSourceFileActionState = {
  status: "idle",
  message: ""
};

export function SourceFileUploadForm({ dealId }: { dealId: string }) {
  const uploadAction = uploadDealSourceFile.bind(null, dealId);
  const [actionState, formAction] = useFormState(
    uploadAction,
    initialActionState
  );
  const [originalFileName, setOriginalFileName] = useState("");

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-ink/70">File</span>
        <input
          name="file"
          type="file"
          required
          onChange={(event) => {
            const file = event.target.files?.[0];
            setOriginalFileName(file ? file.name.normalize("NFC") : "");
          }}
          className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink file:mr-4 file:rounded file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
        />
      </label>
      <input
        type="hidden"
        name="original_file_name"
        value={originalFileName}
      />

      <label className="block">
        <span className="text-sm font-medium text-ink/70">Document type</span>
        <select
          name="document_type"
          required
          defaultValue=""
          className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="" disabled>
            Select document type
          </option>
          {SOURCE_FILE_DOCUMENT_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SOURCE_FILE_DOCUMENT_TYPE_LABELS[option]} ({option})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/70">Notes</span>
        <textarea
          name="notes"
          rows={5}
          className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
        />
      </label>

      {actionState.status === "error" ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionState.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border-2 border-black bg-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Uploading..." : "Upload source file"}
    </button>
  );
}
