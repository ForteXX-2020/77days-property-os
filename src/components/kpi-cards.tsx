import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatJpy, formatPercent, formatRatio } from "@/lib/format";
import type { PortfolioKpiView } from "@/types/supabase";

export function KpiCards({
  kpi
}: {
  kpi: PortfolioKpiView | null;
}) {
  const cards = [
    {
      label: "Monthly Rent Current",
      value: formatJpy(kpi?.monthly_rent_current)
    },
    {
      label: "Monthly CF Actual",
      value: formatJpy(kpi?.monthly_cf_actual)
    },
    {
      label: "Rent Collection Rate",
      value: formatPercent(kpi?.rent_collection_rate)
    },
    {
      label: "DSCR Proxy",
      value: formatRatio(kpi?.dscr_proxy)
    },
    {
      label: "LTV",
      value: formatPercent(kpi?.ltv)
    },
    {
      label: "Vacancy Rate Unit",
      value: formatPercent(kpi?.vacancy_rate_unit)
    },
    {
      label: "Current Loan Balance",
      value: formatJpy(kpi?.loan_balance)
    },
    {
      label: "Annual CF Proxy",
      value: formatJpy(kpi?.annual_cf_proxy)
    }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} label={card.label} value={card.value} />
      ))}
    </section>
  );
}
