import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PropertyPerformanceTable } from "@/components/dashboard/PropertyPerformanceTable";
import { DataError } from "@/components/data-error";
import { EmptyState } from "@/components/empty-state";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import { getAlerts, getPortfolioKpi, getPropertySummaries } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";
import { formatJpy, formatPercent, formatRatio } from "@/lib/format";

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
          title="Portfolio Dashboard"
          description="Read-only MVP dashboard powered by portfolio_kpi_view, property_summary_with_proxies_view, and alerts_view."
        />
        <div className="space-y-6">
          <section>
            <div className="mb-3">
              <p className="text-sm font-semibold text-clay">KPI Cards</p>
              <h2 className="text-xl font-bold text-ink">Portfolio KPIs</h2>
            </div>
            {kpi ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Monthly Rent Current"
                  value={formatJpy(kpi.monthly_rent_current)}
                />
                <KpiCard label="Monthly CF Actual" value={formatJpy(kpi.monthly_cf_actual)} />
                <KpiCard
                  label="Rent Collection Rate"
                  value={formatPercent(kpi.rent_collection_rate)}
                />
                <KpiCard label="DSCR Proxy" value={formatRatio(kpi.dscr_proxy)} />
                <KpiCard label="LTV" value={formatPercent(kpi.ltv)} />
                <KpiCard
                  label="Vacancy Rate Unit"
                  value={formatPercent(kpi.vacancy_rate_unit)}
                />
                <KpiCard label="Loan Balance" value={formatJpy(kpi.loan_balance)} />
                <KpiCard label="Annual CF Proxy" value={formatJpy(kpi.annual_cf_proxy)} />
              </div>
            ) : (
              <EmptyState message="No portfolio KPI data was returned." />
            )}
          </section>
          <PropertyPerformanceTable properties={properties} />
          <AlertsPanel alerts={alerts} />
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
