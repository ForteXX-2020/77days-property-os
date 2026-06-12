import { DataError } from "@/components/data-error";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import { PropertyTable } from "@/components/property-table";
import { getPropertySummaries } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PropertySummaryPage() {
  try {
    const properties = await getPropertySummaries();

    return (
      <div>
        <PageHeading
          eyebrow="Property summary"
          title="Property Summary"
          description="Per-property occupancy, rent, NOI, cap rate, and value from property_summary_view."
        />
        <PropertyTable properties={properties} />
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
