import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-error";
import { ExtractDealDraftButton } from "@/components/deals/ExtractDealDraftButton";
import { EnvError } from "@/components/env-error";
import { formatDate } from "@/lib/format";
import {
  formatSourceFileDocumentType,
  getDealSourceFile
} from "@/lib/sourceFiles";
import { MissingEnvError } from "@/lib/env";
import type { Json } from "@/types/supabase";

export const dynamic = "force-dynamic";

type SourceFileDetailPageProps = {
  params: {
    dealId: string;
    sourceFileId: string;
  };
};

function formatText(value: string | null | undefined) {
  return value ?? "-";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getAiDraft(extractedJson: Json | null | undefined) {
  if (isRecord(extractedJson) && "ai_draft" in extractedJson) {
    return extractedJson.ai_draft as Json;
  }

  return null;
}

function getParserResult(extractedJson: Json | null | undefined) {
  if (isRecord(extractedJson) && "parser_result" in extractedJson) {
    return extractedJson.parser_result as Json;
  }

  return extractedJson ?? null;
}

export default async function SourceFileDetailPage({
  params
}: SourceFileDetailPageProps) {
  try {
    const sourceFile = await getDealSourceFile(
      params.dealId,
      params.sourceFileId
    );

    if (!sourceFile) {
      notFound();
    }

    const hasParserOutput = Boolean(
      sourceFile.extracted_text || sourceFile.extracted_json
    );
    const isParsed = ["parsed", "extracted"].includes(
      sourceFile.processing_status
    );
    const canExtractDraft = isParsed && hasParserOutput;
    const aiDraft = getAiDraft(sourceFile.extracted_json);
    const parserResult = getParserResult(sourceFile.extracted_json);

    return (
      <div className="space-y-6">
        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <Link
            href={`/deals/${params.dealId}/sources`}
            className="text-sm font-semibold text-black underline-offset-4 hover:underline"
          >
            Back to Sources
          </Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">
                Extracted Data
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink">
                {sourceFile.file_name}
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                {formatSourceFileDocumentType(sourceFile.document_type)} /{" "}
                {sourceFile.processing_status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/deals/${params.dealId}/source-files/${sourceFile.id}/open`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300"
              >
                Open
              </a>
              <Link
                href={`/deals/${params.dealId}/source-files/${sourceFile.id}/preview`}
                className="rounded-lg border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-paper"
              >
                Raw Preview
              </Link>
            </div>
          </div>
        </section>

        {!isParsed ? (
          <section className="rounded border border-yellow-300 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-900">
              Process this file first to view extracted data.
            </p>
            <p className="mt-1 text-sm leading-6 text-yellow-800">
              Current status is {sourceFile.processing_status}. Use the Process
              button on the Sources page, then return here to inspect
              extracted_text and extracted_json.
            </p>
          </section>
        ) : null}

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-clay">AI Draft</p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                Draft only - not applied to Deal yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                This semantic candidate is stored inside source_files.extracted_json
                for review. It does not update deals, deal_units, simulations,
                rent payments, or expenses.
              </p>
            </div>
            {canExtractDraft ? (
              <ExtractDealDraftButton
                dealId={params.dealId}
                sourceFileId={sourceFile.id}
              />
            ) : null}
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded border border-ink/10 bg-paper/60 p-4 text-xs leading-5 text-ink/80">
            {aiDraft
              ? JSON.stringify(aiDraft, null, 2)
              : canExtractDraft
                ? "No AI draft yet. Click Extract Draft to generate one."
                : "Process this file first to generate an AI draft."}
          </pre>
        </section>

        <section className="grid gap-4 rounded border border-ink/10 bg-white p-5 shadow-panel md:grid-cols-2 xl:grid-cols-4">
          <MetadataItem label="Processing" value={sourceFile.processing_status} />
          <MetadataItem label="Review" value={sourceFile.review_status} />
          <MetadataItem label="File type" value={formatText(sourceFile.file_type)} />
          <MetadataItem label="Created" value={formatDate(sourceFile.created_at)} />
          <MetadataItem label="Processed" value={formatDate(sourceFile.processed_at)} />
          <MetadataItem
            label="Page count"
            value={
              sourceFile.page_count === null || sourceFile.page_count === undefined
                ? "-"
                : String(sourceFile.page_count)
            }
          />
          <MetadataItem
            label="Estimated cost"
            value={
              sourceFile.estimated_cost === null ||
              sourceFile.estimated_cost === undefined
                ? "-"
                : String(sourceFile.estimated_cost)
            }
          />
          <MetadataItem label="Storage path" value={sourceFile.storage_path} />
        </section>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold text-clay">Extracted Text</p>
          <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded border border-ink/10 bg-paper/60 p-4 text-sm leading-6 text-ink/80">
            {sourceFile.extracted_text ||
              "No extracted text yet. Process this file first to view extracted data."}
          </pre>
        </section>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold text-clay">Extracted JSON</p>
          <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-ink/10 bg-paper/60 p-4 text-xs leading-5 text-ink/80">
            {sourceFile.extracted_json
              ? JSON.stringify(parserResult, null, 2)
              : "No extracted JSON yet. Process this file first to view extracted data."}
          </pre>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return <EnvError error={error} />;
    }

    return (
      <DataError
        message={error instanceof Error ? error.message : "An unknown error occurred."}
      />
    );
  }
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
