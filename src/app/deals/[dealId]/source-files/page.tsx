import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-error";
import { SourceFileUploadForm } from "@/components/deals/SourceFileUploadForm";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import { getDeal } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

type DealSourceFilesPageProps = {
  params: {
    dealId: string;
  };
};

export default async function DealSourceFilesPage({
  params
}: DealSourceFilesPageProps) {
  try {
    const deal = await getDeal(params.dealId);

    if (!deal) {
      notFound();
    }

    return (
      <div>
        <PageHeading
          eyebrow="Source Files"
          title="Upload Source File"
          description={`Attach a diligence source file to ${deal.deal_name}. OCR and extraction are not enabled yet.`}
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
