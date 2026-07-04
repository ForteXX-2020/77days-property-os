import Link from "next/link";
import { notFound } from "next/navigation";
import { EnvError } from "@/components/env-error";
import {
  createSourceFileSignedUrl,
  formatSourceFileDocumentType,
  getDealSourceFile,
  supportsSourceFilePreview
} from "@/lib/sourceFiles";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

type SourceFilePreviewPageProps = {
  params: {
    dealId: string;
    sourceFileId: string;
  };
};

export default async function SourceFilePreviewPage({
  params
}: SourceFilePreviewPageProps) {
  try {
    const sourceFile = await getDealSourceFile(
      params.dealId,
      params.sourceFileId
    );

    if (!sourceFile) {
      notFound();
    }

    const canPreview = supportsSourceFilePreview(sourceFile.file_type);
    const signedUrl = canPreview
      ? await createSourceFileSignedUrl(sourceFile)
      : null;
    const openUrl = `/deals/${params.dealId}/source-files/${params.sourceFileId}/open`;

    return (
      <div className="space-y-5">
        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/deals/${params.dealId}`}
                className="text-sm font-semibold text-black underline-offset-4 hover:underline"
              >
                Back to Deal
              </Link>
              <h1 className="mt-3 text-2xl font-bold text-ink">
                {sourceFile.file_name}
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                {formatSourceFileDocumentType(sourceFile.document_type)} /{" "}
                {sourceFile.file_type ?? "unknown"}
              </p>
            </div>
            <a
              href={openUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300"
            >
              Open
            </a>
          </div>
        </section>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          {signedUrl && sourceFile.file_type === "application/pdf" ? (
            <object
              data={signedUrl}
              type="application/pdf"
              className="h-[75vh] w-full rounded border border-ink/10"
            >
              <div className="p-5 text-sm text-ink/70">
                Preview could not be embedded in this browser. Use Open instead.
              </div>
            </object>
          ) : signedUrl && sourceFile.file_type?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt={sourceFile.file_name}
              className="max-h-[75vh] w-full rounded border border-ink/10 object-contain"
            />
          ) : (
            <div className="rounded border border-ink/10 bg-paper/60 p-5">
              <p className="text-sm font-semibold text-ink">
                Preview not available yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                PDF and image files can be previewed here. For spreadsheets,
                CSV, text, or unknown file types, use Open for now.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return <EnvError error={error} />;
    }

    return <SourceFilePreviewError error={error} />;
  }
}

function SourceFilePreviewError({ error }: { error: unknown }) {
  return (
    <section className="rounded border border-red-200 bg-white p-6 shadow-panel">
      <p className="text-sm font-semibold text-red-700">
        Could not load source file preview.
      </p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Preview unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        {error instanceof Error ? error.message : "An unknown error occurred."}
      </p>
    </section>
  );
}
