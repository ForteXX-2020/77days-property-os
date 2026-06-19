"use client";

import { EmptyState } from "@/components/empty-state";
import { formatJpy, formatPercent, formatRatio } from "@/lib/format";
import type { PropertySummaryView } from "@/types/supabase";
import { useMemo, useState } from "react";

type SortKey =
  | "property_code"
  | "property_name"
  | "property_type"
  | "monthly_rent_current"
  | "annual_rent_current"
  | "loan_balance"
  | "annual_payment_master"
  | "monthly_cf_proxy"
  | "annual_cf_proxy"
  | "dscr_proxy"
  | "vacancy_rate_unit"
  | "vacancy_rate_rent"
  | "ltv";

type SortDirection = "asc" | "desc";

type ColumnDefinition = {
  key: SortKey;
  label: string;
  type: "text" | "number";
};

const columns: ColumnDefinition[] = [
  { key: "property_code", label: "Code", type: "text" },
  { key: "property_name", label: "Name", type: "text" },
  { key: "property_type", label: "Type", type: "text" },
  { key: "monthly_rent_current", label: "Monthly Rent", type: "number" },
  { key: "annual_rent_current", label: "Annual Rent", type: "number" },
  { key: "loan_balance", label: "Loan Balance", type: "number" },
  { key: "annual_payment_master", label: "Annual Payment", type: "number" },
  { key: "monthly_cf_proxy", label: "Monthly CF Proxy", type: "number" },
  { key: "annual_cf_proxy", label: "Annual CF Proxy", type: "number" },
  { key: "dscr_proxy", label: "DSCR Proxy", type: "number" },
  { key: "vacancy_rate_unit", label: "Unit Vacancy", type: "number" },
  { key: "vacancy_rate_rent", label: "Rent Vacancy", type: "number" },
  { key: "ltv", label: "LTV", type: "number" }
];

function getTextSortValue(property: PropertySummaryView, key: SortKey) {
  const value = property[key];

  return typeof value === "string" ? value.toLocaleLowerCase("ja-JP") : "";
}

function getNumberSortValue(property: PropertySummaryView, key: SortKey) {
  const value = property[key];

  return typeof value === "number" ? value : 0;
}

export function PropertyPerformanceTable({
  properties
}: {
  properties: PropertySummaryView[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("property_code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedProperties = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey);
    const direction = sortDirection === "asc" ? 1 : -1;

    return [...properties].sort((left, right) => {
      if (column?.type === "number") {
        return (
          (getNumberSortValue(left, sortKey) - getNumberSortValue(right, sortKey)) *
          direction
        );
      }

      return (
        getTextSortValue(left, sortKey).localeCompare(getTextSortValue(right, sortKey), "ja-JP") *
        direction
      );
    });
  }, [properties, sortDirection, sortKey]);

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function getSortIndicator(columnKey: SortKey) {
    if (columnKey !== sortKey) {
      return "";
    }

    return sortDirection === "asc" ? "^" : "v";
  }

  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Property Performance</p>
          <h2 className="text-xl font-bold text-ink">Properties</h2>
        </div>
        <p className="text-sm text-ink/60">{properties.length} rows</p>
      </div>

      <div className="mt-5">
        {properties.length === 0 ? (
          <EmptyState message="No property performance data was returned." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="border-b border-ink/10 px-3 py-3 font-semibold"
                      aria-sort={
                        column.key === sortKey
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 text-left uppercase text-ink/60 transition hover:text-ink"
                      >
                        <span>{column.label}</span>
                        <span className="w-3 text-ink">{getSortIndicator(column.key)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProperties.map((property, index) => (
                  <tr
                    key={`${property.property_code ?? "property"}-${index}`}
                    className="border-b border-ink/10"
                  >
                    <td className="border-b border-ink/10 px-3 py-4 font-medium text-ink">
                      {property.property_code ?? "-"}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {property.property_name ?? "-"}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {property.property_type ?? "-"}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.monthly_rent_current)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.annual_rent_current)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.loan_balance)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.annual_payment_master)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.monthly_cf_proxy)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatJpy(property.annual_cf_proxy)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatRatio(property.dscr_proxy)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatPercent(property.vacancy_rate_unit)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatPercent(property.vacancy_rate_rent)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/75">
                      {formatPercent(property.ltv)}
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
