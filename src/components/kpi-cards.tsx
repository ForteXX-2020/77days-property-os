import {
  formatJpy,
  formatNumber,
  formatOccupancyFromVacancy,
  formatPercent,
  formatRatio
} from "@/lib/format";
import type { PortfolioKpiView } from "@/types/supabase";

type KpiCard = {
  label: string;
  value: string;
  helper: string;
};

export function KpiCards({
  kpi,
  alertsCount
}: {
  kpi: PortfolioKpiView | null;
  alertsCount: number;
}) {
  const cards: KpiCard[] = [
    {
      label: "Properties",
      value: formatNumber(kpi?.property_count),
      helper: "portfolio_kpi_view"
    },
    {
      label: "Units",
      value: formatNumber(kpi?.unit_count),
      helper: `${formatNumber(kpi?.occupied_unit_count)} occupied, ${formatNumber(
        kpi?.vacant_unit_count
      )} vacant`
    },
    {
      label: "Occupancy",
      value: formatOccupancyFromVacancy(kpi?.unit_vacancy_rate_pct),
      helper: `${formatPercent(kpi?.unit_vacancy_rate_pct)} unit vacancy`
    },
    {
      label: "Monthly rent",
      value: formatJpy(kpi?.monthly_scheduled_rent),
      helper: `${formatJpy(kpi?.monthly_received_rent)} received`
    },
    {
      label: "NOI",
      value: formatJpy(kpi?.estimated_noi),
      helper: "Estimated annual NOI"
    },
    {
      label: "DSCR",
      value: formatRatio(kpi?.portfolio_dscr),
      helper: `${formatJpy(kpi?.annual_debt_service)} annual debt service`
    },
    {
      label: "LTV",
      value: formatPercent(kpi?.portfolio_ltv_pct),
      helper: `${formatJpy(kpi?.portfolio_loan_balance)} loan balance`
    },
    {
      label: "Alerts",
      value: formatNumber(alertsCount),
      helper: "Open alerts"
    }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded border border-ink/10 bg-white p-5 shadow-panel"
        >
          <p className="text-sm font-medium text-ink/60">{card.label}</p>
          <p className="mt-3 text-3xl font-bold text-ink">{card.value}</p>
          <p className="mt-2 text-xs text-ink/50">{card.helper}</p>
        </article>
      ))}
    </section>
  );
}
