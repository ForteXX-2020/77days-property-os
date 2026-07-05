import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-error";
import { SourceFileUploadForm } from "@/components/deals/SourceFileUploadForm";
import { SourceFilesTable } from "@/components/deals/SourceFilesTable";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import { getDeal, getDealSourceFiles } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

type DealSourcesPageProps = {
  params: {
    dealId: string;
  };
};

export default async function DealSourcesPage({ params }: DealSourcesPageProps) {
  try {
    const [deal, sourceFiles] = await Promise.all([
      getDeal(params.dealId),
      getDealSourceFiles(params.dealId)
    ]);

    if (!deal) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <PageHeading
          eyebrow="Source Files"
          title="Deal Source Intake"
          description={`Upload and review source file records for ${deal.deal_name}. OCR and extraction are not enabled yet.`}
        />

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <Link
            href={`/deals/${deal.id}`}
            className="text-sm font-semibold text-black underline-offset-4 hover:underline"
          >
            Back to Deal
          </Link>
          <SourceFileUploadForm dealId={deal.id} />
        </section>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <div className="mb-5">
            <p className="text-sm font-semibold text-clay">Uploaded Files</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Source Files</h2>
          </div>
          <SourceFilesTable dealId={deal.id} sourceFiles={sourceFiles} />
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
