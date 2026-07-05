import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ProcessSourceFileButton } from "@/components/deals/ProcessSourceFileButton";
import { formatDate } from "@/lib/format";
import {
  getSourceFileUnsupportedReason,
  isSourceFileParserSupported
} from "@/lib/sourceFileParser";
import { formatSourceFileDocumentType } from "@/lib/sourceFiles";
import type { SourceFileRow } from "@/types/supabase";

function formatText(value: string | null | undefined) {
  return value ?? "-";
}

export function SourceFilesTable({
  dealId,
  sourceFiles
}: {
  dealId: string;
  sourceFiles: SourceFileRow[];
}) {
  if (sourceFiles.length === 0) {
    return <EmptyState message="No source files are linked to this deal yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-ink/50">
            <TableHeader>File</TableHeader>
            <TableHeader>Document Type</TableHeader>
            <TableHeader>Processing</TableHeader>
            <TableHeader>Review</TableHeader>
            <TableHeader>Created</TableHeader>
            <TableHeader>Notes</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {sourceFiles.map((file) => (
            <tr key={file.id}>
              <TableCell strong>{file.file_name}</TableCell>
              <TableCell>
                {formatSourceFileDocumentType(file.document_type)}
              </TableCell>
              <TableCell>{file.processing_status}</TableCell>
              <TableCell>{file.review_status}</TableCell>
              <TableCell>{formatDate(file.created_at)}</TableCell>
              <TableCell>{formatText(file.notes)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/deals/${dealId}/sources/${file.id}`}
                    className="rounded border border-ink/20 px-3 py-1 text-xs font-semibold text-black transition hover:bg-paper"
                  >
                    Details
                  </Link>
                  <a
                    href={`/deals/${dealId}/source-files/${file.id}/open`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-ink/20 px-3 py-1 text-xs font-semibold text-black transition hover:bg-paper"
                  >
                    Open
                  </a>
                  <Link
                    href={`/deals/${dealId}/source-files/${file.id}/preview`}
                    className="rounded border border-ink/20 px-3 py-1 text-xs font-semibold text-black transition hover:bg-paper"
                  >
                    Preview
                  </Link>
                  {isSourceFileParserSupported(file) ? (
                    <ProcessSourceFileButton dealId={dealId} sourceFileId={file.id} />
                  ) : (
                    <p className="max-w-48 text-xs text-ink/50">
                      {getSourceFileUnsupportedReason(file)}
                    </p>
                  )}
                </div>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-ink/10 px-3 py-3 font-semibold">
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong = false
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`border-b border-ink/10 px-3 py-4 align-top ${
        strong ? "font-medium text-ink" : "text-ink/70"
      }`}
    >
      {children}
    </td>
  );
}
