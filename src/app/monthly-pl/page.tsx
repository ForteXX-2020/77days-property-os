import { DataError } from "@/components/data-error";
import { EmptyState } from "@/components/empty-state";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import {
  getMonthlyPlPropertyRows,
  getMonthlyPlUnitRows
} from "@/lib/data";
import { MissingEnvError } from "@/lib/env";
import { formatJpy, formatNumber } from "@/lib/format";
import type {
  MonthlyPlPropertyView,
  MonthlyPlUnitView
} from "@/types/supabase";

export const dynamic = "force-dynamic";

type MonthlyPlPageProps = {
  searchParams?: {
    period?: string;
  };
};

function formatText(value: string | null | undefined) {
  return value ?? "-";
}

function formatPeriodMonth(value: string | null | undefined) {
  return normalizePeriodMonth(value) ?? "-";
}

function normalizePeriodMonth(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}`;
}

function getPeriodOptions(
  propertyRows: MonthlyPlPropertyView[],
  unitRows: MonthlyPlUnitView[]
) {
  return Array.from(
    new Set(
      [...propertyRows, ...unitRows]
        .map((row) => normalizePeriodMonth(row.period_month))
        .filter((period): period is string => Boolean(period))
    )
  ).sort((left, right) => right.localeCompare(left));
}

export default async function MonthlyPlPage({ searchParams }: MonthlyPlPageProps) {
  try {
    const [propertyRows, unitRows] = await Promise.all([
      getMonthlyPlPropertyRows(),
      getMonthlyPlUnitRows()
    ]);

    const periods = getPeriodOptions(propertyRows, unitRows);
    const selectedPeriod =
      searchParams?.period && periods.includes(searchParams.period)
        ? searchParams.period
        : periods[0];
    const earliestPeriod = periods[periods.length - 1];
    const latestPeriod = periods[0];

    const filteredPropertyRows = selectedPeriod
      ? propertyRows.filter(
          (row) => normalizePeriodMonth(row.period_month) === selectedPeriod
        )
      : propertyRows;
    const filteredUnitRows = selectedPeriod
      ? unitRows.filter(
          (row) => normalizePeriodMonth(row.period_month) === selectedPeriod
        )
      : unitRows;

    return (
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <PageHeading
            eyebrow="Monthly PL"
            title="Monthly PL"
            description="Read-only draft monthly profit and loss view from monthly_pl_property_view and monthly_pl_unit_view."
          />

          {periods.length > 0 ? (
            <form className="rounded border border-ink/10 bg-white p-4 shadow-sm">
              <label className="block">
                <span className="text-sm font-medium text-black">Period</span>
                <input
                  type="month"
                  name="period"
                  defaultValue={selectedPeriod ?? ""}
                  min={earliestPeriod}
                  max={latestPeriod}
                  className="mt-1 w-full min-w-48 rounded border border-ink/20 bg-white px-3 py-2 text-sm text-black"
                />
              </label>
              <button
                type="submit"
                className="mt-3 w-full rounded-lg border-2 border-black bg-yellow-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
              >
                Apply
              </button>
            </form>
          ) : null}
        </div>

        {periods.length === 0 ? (
          <div className="mt-6">
            <EmptyState message="No monthly PL data is available yet." />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <PropertySummaryTable
              rows={filteredPropertyRows}
              emptyMessage="No monthly PL data for the selected month."
            />
            <UnitSummaryTable
              rows={filteredUnitRows}
              emptyMessage="No monthly PL data for the selected month."
            />
          </div>
        )}
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

function PropertySummaryTable({
  rows,
  emptyMessage
}: {
  rows: MonthlyPlPropertyView[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Property Summary</p>
          <h2 className="text-xl font-bold text-ink">Property PL</h2>
        </div>
        <p className="text-sm text-ink/60">{rows.length} rows</p>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Period</TableHeader>
                  <TableHeader>Rent Income</TableHeader>
                  <TableHeader>Operating Expenses</TableHeader>
                  <TableHeader>NOI Draft</TableHeader>
                  <TableHeader>Capex</TableHeader>
                  <TableHeader>Financing</TableHeader>
                  <TableHeader>Tax</TableHeader>
                  <TableHeader>Insurance</TableHeader>
                  <TableHeader>CF Draft</TableHeader>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.property_id ?? "property"}-${row.period_month ?? index}`}>
                    <TableCell strong>{formatText(row.property_code)}</TableCell>
                    <TableCell>{formatText(row.property_name)}</TableCell>
                    <TableCell>{formatPeriodMonth(row.period_month)}</TableCell>
                    <TableCell>{formatJpy(row.rent_income)}</TableCell>
                    <TableCell>{formatJpy(row.operating_expenses)}</TableCell>
                    <TableCell strong>{formatJpy(row.noi_draft)}</TableCell>
                    <TableCell>{formatJpy(row.capex)}</TableCell>
                    <TableCell>{formatJpy(row.financing)}</TableCell>
                    <TableCell>{formatJpy(row.tax)}</TableCell>
                    <TableCell>{formatJpy(row.insurance)}</TableCell>
                    <TableCell strong>{formatJpy(row.cf_draft)}</TableCell>
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

function UnitSummaryTable({
  rows,
  emptyMessage
}: {
  rows: MonthlyPlUnitView[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Unit Summary</p>
          <h2 className="text-xl font-bold text-ink">Unit PL</h2>
        </div>
        <p className="text-sm text-ink/60">{rows.length} rows</p>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Property</TableHeader>
                  <TableHeader>Unit</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Rent Current</TableHeader>
                  <TableHeader>Rent Received</TableHeader>
                  <TableHeader>Vacancy Days</TableHeader>
                  <TableHeader>Unit Expenses</TableHeader>
                  <TableHeader>Unit CF Before Allocation</TableHeader>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.unit_id ?? "unit"}-${row.period_month ?? index}-${index}`}
                  >
                    <TableCell strong>{formatText(row.property_code)}</TableCell>
                    <TableCell>{formatText(row.property_name)}</TableCell>
                    <TableCell strong>{formatText(row.unit_name)}</TableCell>
                    <TableCell>{formatText(row.occupancy_status)}</TableCell>
                    <TableCell>{formatJpy(row.rent_current)}</TableCell>
                    <TableCell>{formatJpy(row.rent_received)}</TableCell>
                    <TableCell>{formatNumber(row.vacancy_days)}</TableCell>
                    <TableCell>{formatJpy(row.unit_level_expenses)}</TableCell>
                    <TableCell strong>
                      {formatJpy(row.unit_level_cf_before_common_allocation)}
                    </TableCell>
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
      className={`border-b border-ink/10 px-3 py-4 ${
        strong ? "font-medium text-ink" : "text-ink/70"
      }`}
    >
      {children}
    </td>
  );
}
