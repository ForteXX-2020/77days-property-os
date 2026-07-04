import Link from "next/link";
import { DataError } from "@/components/data-error";
import { RestoreDealButton } from "@/components/deals/DealActions";
import { EmptyState } from "@/components/empty-state";
import { EnvError } from "@/components/env-error";
import { PageHeading } from "@/components/page-heading";
import { getDeals, getDeletedDeals } from "@/lib/data";
import { MissingEnvError } from "@/lib/env";
import { formatJpy, formatPercent } from "@/lib/format";
import type { DealRow } from "@/types/supabase";

export const dynamic = "force-dynamic";

function formatText(value: string | null | undefined) {
  return value ?? "-";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getManualFullYield(deal: DealRow) {
  return deal.gross_yield_full ?? deal.gross_yield;
}

function formatYield(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return formatPercent(value);
}

export default async function DealsPage() {
  try {
    const [deals, deletedDeals] = await Promise.all([
      getDeals(),
      getDeletedDeals()
    ]);

    return (
      <div>
        <PageHeading
          eyebrow="DD Intake"
          title="Deals"
          description="Read-only deal intake list for diligence candidates and source file review."
        />

        <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-clay">Deal List</p>
              <h2 className="text-xl font-bold text-ink">Intake Pipeline</h2>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href="/deals/new"
                className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300"
              >
                New Deal
              </Link>
              <p className="text-sm text-ink/60">{deals.length} rows</p>
            </div>
          </div>

          <div className="mt-5">
            {deals.length === 0 ? (
              <EmptyState message="No deals were returned." />
            ) : (
              <DealsTable deals={deals} />
            )}
          </div>
        </section>

        <section className="mt-6 rounded border border-ink/10 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-clay">Deleted Deals</p>
              <h2 className="text-xl font-bold text-ink">Recoverable Archive</h2>
            </div>
            <p className="text-sm text-ink/60">{deletedDeals.length} rows</p>
          </div>

          <div className="mt-5">
            {deletedDeals.length === 0 ? (
              <EmptyState message="No deleted deals." />
            ) : (
              <DealsTable deals={deletedDeals} showRestore />
            )}
          </div>
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

function DealsTable({
  deals,
  showRestore = false
}: {
  deals: DealRow[];
  showRestore?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-ink/50">
            <TableHeader>Deal</TableHeader>
            <TableHeader>Property</TableHeader>
            <TableHeader>Address</TableHeader>
            <TableHeader>Asking Price</TableHeader>
            <TableHeader>満室想定利回り</TableHeader>
            <TableHeader>現況利回り</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Decision</TableHeader>
            <TableHeader>Updated</TableHeader>
            {showRestore ? <TableHeader>Action</TableHeader> : null}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id}>
              <TableCell strong>
                <Link
                  href={`/deals/${deal.id}`}
                  className="font-semibold text-black underline-offset-4 hover:underline"
                >
                  {deal.deal_name}
                </Link>
              </TableCell>
              <TableCell>{formatText(deal.property_name)}</TableCell>
              <TableCell>{formatText(deal.address)}</TableCell>
              <TableCell>{formatJpy(deal.asking_price)}</TableCell>
              <TableCell>{formatYield(getManualFullYield(deal))}</TableCell>
              <TableCell>{formatYield(deal.current_yield)}</TableCell>
              <TableCell>{deal.status}</TableCell>
              <TableCell>{formatText(deal.final_decision)}</TableCell>
              <TableCell>{formatDateTime(deal.updated_at)}</TableCell>
              {showRestore ? (
                <TableCell>
                  <RestoreDealButton dealId={deal.id} />
                </TableCell>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      className={`border-b border-ink/10 px-3 py-4 align-top ${
        strong ? "font-medium text-ink" : "text-ink/70"
      }`}
    >
      {children}
    </td>
  );
}
