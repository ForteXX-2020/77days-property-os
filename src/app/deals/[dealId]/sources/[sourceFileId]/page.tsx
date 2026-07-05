import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-error";
import { EnvError } from "@/components/env-error";
import { formatDate } from "@/lib/format";
import {
  formatSourceFileDocumentType,
  getDealSourceFile
} from "@/lib/sourceFiles";
import { MissingEnvError } from "@/lib/env";

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
                Source File
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink">
                {sourceFile.file_name}
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                {formatSourceFileDocumentType(sourceFile.document_type)}
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
                Preview
              </Link>
            </div>
          </div>
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
            {sourceFile.extracted_text || "No extracted text yet."}
          </pre>
        </section>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold text-clay">Extracted JSON</p>
          <pre className="mt-3 max-h-[520px] overflow-auto rounded border border-ink/10 bg-paper/60 p-4 text-xs leading-5 text-ink/80">
            {sourceFile.extracted_json
              ? JSON.stringify(sourceFile.extracted_json, null, 2)
              : "No extracted JSON yet."}
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
