import { AlertsList } from "@/components/alerts-list";
import { DataError } from "@/components/data-error";
import { EnvError } from "@/components/env-error";
import { KpiCards } from "@/components/kpi-cards";
import { PageHeading } from "@/components/page-heading";
import { PropertyTable } from "@/components/property-table";
import { getAlerts, getPortfolioKpi, getPropertySummaries } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const [kpi, alerts, properties] = await Promise.all([
      getPortfolioKpi(),
      getAlerts(),
      getPropertySummaries()
    ]);

    return (
      <div>
        <PageHeading
          eyebrow="Dashboard"
          title="Portfolio Overview"
          description="Live operating metrics from portfolio_kpi_view, alerts_view, and property_summary_view."
        />
        <div className="space-y-6">
          <KpiCards kpi={kpi} alertsCount={alerts.length} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
            <PropertyTable properties={properties} />
            <AlertsList alerts={alerts} />
          </div>
        </div>
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
