import { DataError } from "@/components/data-error";
import { EnvError } from "@/components/env-error";
import { getPortfolioKpi, getPropertySummaries } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";
import { formatJpy, formatPercent, formatRatio } from "@/lib/format";
import type { PortfolioKpiView, PropertySummaryView } from "@/types/supabase";

export const dynamic = "force-dynamic";

function sum(values: Array<number | null | undefined>): number {
  let total = 0;

  for (const value of values) {
    total += value ?? 0;
  }

  return total;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatIsoMonth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getPortfolioSnapshot(
  kpi: PortfolioKpiView | null,
  properties: PropertySummaryView[]
) {
  const annualRent = sum(properties.map((property) => property.annual_rent_current));
  const propertyLoanBalance = sum(properties.map((property) => property.loan_balance));
  const annualPayment = sum(properties.map((property) => property.annual_payment_master));
  const annualCfProxy = kpi?.annual_cf_proxy ?? sum(properties.map((property) => property.annual_cf_proxy));
  const dscrProxy = kpi?.dscr_proxy ?? (annualPayment === 0 ? null : annualRent / annualPayment);

  return {
    annualRent,
    loanBalance: kpi?.loan_balance ?? propertyLoanBalance,
    annualPayment,
    annualCfProxy,
    dscrProxy,
    ltv: kpi?.ltv ?? null
  };
}

export default async function BankSummaryPage() {
  try {
    const [kpi, properties] = await Promise.all([
      getPortfolioKpi(),
      getPropertySummaries()
    ]);
    const now = new Date();
    const snapshot = getPortfolioSnapshot(kpi, properties);

    return (
      <main className="bank-summary mx-auto min-h-screen max-w-[210mm] bg-white p-6 text-ink shadow-panel print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="document-header border-b border-ink/20 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay">
            77Days Property OS
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="document-title text-3xl font-bold text-ink">
                Portfolio Financing Summary
              </h1>
              <p className="document-subtitle mt-2 max-w-3xl text-sm leading-6 text-ink/65">
                A4 print-friendly financing snapshot for portfolio review.
              </p>
              <p className="no-print mt-2 text-xs text-ink/50">
                For browser printing, disable Chrome print headers and footers in the print dialog.
              </p>
            </div>
            <dl className="grid gap-1 text-sm text-ink/70 sm:text-right">
              <div>
                <dt className="font-semibold text-ink">Generated date</dt>
                <dd>{formatIsoDate(now)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Target month</dt>
                <dd>{formatIsoMonth(now)}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="summary-section mt-6">
          <div className="section-heading mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-clay">
                Portfolio Snapshot
              </p>
              <h2 className="text-xl font-bold text-ink">Financing KPIs</h2>
            </div>
          </div>
          <div className="snapshot-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SnapshotCard label="Annual Rent" value={formatJpy(snapshot.annualRent)} />
            <SnapshotCard label="Loan Balance" value={formatJpy(snapshot.loanBalance)} />
            <SnapshotCard label="Annual Payment" value={formatJpy(snapshot.annualPayment)} />
            <SnapshotCard label="Annual CF Proxy" value={formatJpy(snapshot.annualCfProxy)} />
            <SnapshotCard label="DSCR Proxy" value={formatRatio(snapshot.dscrProxy)} />
            <SnapshotCard label="LTV" value={formatPercent(snapshot.ltv)} />
          </div>
        </section>

        <section className="table-section mt-7">
          <div className="section-heading mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">
              Property Table
            </p>
            <h2 className="text-xl font-bold text-ink">Property-Level Financing</h2>
          </div>
          {properties.length === 0 ? (
            <div className="rounded border border-dashed border-ink/20 p-5 text-center text-sm text-ink/60">
              No property rows were returned.
            </div>
          ) : (
            <div className="table-wrap overflow-x-auto">
              <table className="property-table min-w-full border-separate border-spacing-0 text-left text-xs">
                <thead>
                  <tr className="uppercase text-ink/55">
                    <TableHeader className="code-column">Code</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Annual Rent</TableHeader>
                    <TableHeader>Loan Balance</TableHeader>
                    <TableHeader>Annual Payment</TableHeader>
                    <TableHeader>Annual CF Proxy</TableHeader>
                    <TableHeader>DSCR Proxy</TableHeader>
                    <TableHeader>LTV</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property, index) => (
                    <tr key={`${property.property_code ?? "property"}-${index}`}>
                      <TableCell className="code-column" strong>
                        {property.property_code ?? "-"}
                      </TableCell>
                      <TableCell>{property.property_name ?? "-"}</TableCell>
                      <TableCell>{property.property_type ?? "-"}</TableCell>
                      <TableCell>{formatJpy(property.annual_rent_current)}</TableCell>
                      <TableCell>{formatJpy(property.loan_balance)}</TableCell>
                      <TableCell>{formatJpy(property.annual_payment_master)}</TableCell>
                      <TableCell>{formatJpy(property.annual_cf_proxy)}</TableCell>
                      <TableCell>{formatRatio(property.dscr_proxy)}</TableCell>
                      <TableCell>{formatPercent(property.ltv)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="assumptions-section mt-7 rounded border border-ink/10 bg-paper/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay">
            Assumptions
          </p>
          <ul className="assumptions-list mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink/70">
            <li>DSCR Proxy and CF Proxy are preliminary proxy values.</li>
            <li>These values are calculated before final NOI and operating expense review.</li>
            <li>They should not be treated as final lender underwriting metrics.</li>
          </ul>
        </section>

        <footer className="document-footer mt-8 border-t border-ink/20 pt-4 text-xs leading-5 text-ink/55">
          Generated by 77Days Property OS. This page is not tax, accounting, or
          financing advice.
        </footer>
      </main>
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

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="snapshot-card rounded border border-ink/10 p-4">
      <p className="snapshot-label text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <p className="snapshot-value mt-2 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function TableHeader({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`border-b border-ink/20 px-2 py-2 font-semibold text-ink/60 ${className}`}>
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
  strong = false
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <td
      className={`border-b border-ink/10 px-2 py-2 align-top ${
        strong ? "font-semibold text-ink" : "text-ink/75"
      } ${className}`}
    >
      {children}
    </td>
  );
}
