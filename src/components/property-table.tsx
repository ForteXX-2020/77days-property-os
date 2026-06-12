import { EmptyState } from "@/components/empty-state";
import {
  formatJpy,
  formatNumber,
  formatOccupancyFromVacancy,
  formatPercent,
  formatRatio
} from "@/lib/format";
import type { PropertySummaryView } from "@/types/supabase";

export function PropertyTable({
  properties
}: {
  properties: PropertySummaryView[];
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Performance</p>
          <h2 className="text-xl font-bold text-ink">Property performance</h2>
        </div>
        <p className="text-sm text-ink/60">{properties.length} items</p>
      </div>

      <div className="mt-5">
        {properties.length === 0 ? (
          <EmptyState message="No property summary data is available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Property</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Units</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Occupancy</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Monthly rent</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">NOI</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">DSCR</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">LTV</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property, index) => (
                  <tr
                    key={`${property.property_name ?? "property"}-${property.address ?? index}`}
                    className="border-b border-ink/10"
                  >
                    <td className="border-b border-ink/10 px-3 py-4">
                      <p className="font-semibold text-ink">
                        {property.property_name ?? "Untitled property"}
                      </p>
                      <p className="mt-1 text-xs text-ink/50">
                        {[property.address, property.property_type].filter(Boolean).join(" | ") ||
                          "-"}
                      </p>
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatNumber(property.occupied_unit_count)} / {formatNumber(property.unit_count)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatOccupancyFromVacancy(property.unit_vacancy_rate_pct)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatJpy(property.current_monthly_rent)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatJpy(property.estimated_noi)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatRatio(property.dscr)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatPercent(property.ltv_pct)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatJpy(property.current_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
