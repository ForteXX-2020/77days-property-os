import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-error";
import { DeleteDealButton, RestoreDealButton } from "@/components/deals/DealActions";
import { SourceFilesTable } from "@/components/deals/SourceFilesTable";
import { EmptyState } from "@/components/empty-state";
import { EnvError } from "@/components/env-error";
import {
  getDeal,
  getDealSimulations,
  getDealSourceFiles,
  getDealUnits
} from "@/lib/data";
import { MissingEnvError } from "@/lib/env";
import { formatJpy, formatNumber, formatPercent, formatRatio } from "@/lib/format";
import type {
  DealRow,
  DealSimulationRow,
  DealUnitRow,
  SourceFileRow
} from "@/types/supabase";

export const dynamic = "force-dynamic";

type DealDetailPageProps = {
  params: {
    dealId: string;
  };
};

function formatText(value: string | null | undefined) {
  return value ?? "-";
}

function formatYield(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return formatPercent(value);
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

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  try {
    const [deal, units, simulations, sourceFiles] = await Promise.all([
      getDeal(params.dealId),
      getDealUnits(params.dealId),
      getDealSimulations(params.dealId),
      getDealSourceFiles(params.dealId)
    ]);

    if (!deal) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <DealHero deal={deal} />
        {deal.deleted_at ? <DeletedDealNotice deal={deal} /> : null}
        <DdMilestones />
        <KeyMetrics deal={deal} units={units} sourceFiles={sourceFiles} />
        <SourceFilesList dealId={deal.id} sourceFiles={sourceFiles} />
        <RentRollList units={units} />
        <DdNotes deal={deal} />
        <SimulationSummary simulations={simulations} />
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

function DealHero({ deal }: { deal: DealRow }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/deals"
          className="text-sm font-semibold text-black underline-offset-4 hover:underline"
        >
          Back to Deals
        </Link>
        {deal.deleted_at ? (
          <RestoreDealButton dealId={deal.id} />
        ) : (
          <DeleteDealButton dealId={deal.id} />
        )}
      </div>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            Deal Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            {deal.deal_name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 sm:text-base">
            {formatText(deal.property_name)} / {formatText(deal.address)}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-ink/70 sm:text-right">
          <p>
            <span className="font-semibold text-ink">Status:</span> {deal.status}
          </p>
          <p>
            <span className="font-semibold text-ink">Decision:</span>{" "}
            {formatText(deal.final_decision)}
          </p>
          <p>
            <span className="font-semibold text-ink">Updated:</span>{" "}
            {formatDateTime(deal.updated_at)}
          </p>
          {deal.deleted_at ? (
            <p>
              <span className="font-semibold text-red-700">Deleted:</span>{" "}
              {formatDateTime(deal.deleted_at)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DeletedDealNotice({ deal }: { deal: DealRow }) {
  return (
    <section className="rounded border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">
        Deleted / recoverable
      </p>
      <p className="mt-1 text-sm leading-6 text-red-700">
        This deal is soft-deleted and hidden from the normal Deals list. Related
        source files, rent roll rows, and simulations remain intact. Restore it
        to return it to the active list.
      </p>
      {deal.deleted_reason ? (
        <p className="mt-2 text-sm text-red-700">
          Reason: {deal.deleted_reason}
        </p>
      ) : null}
    </section>
  );
}

function DdMilestones() {
  const milestones = [
    "Source files received",
    "Rent roll reviewed",
    "Simulation reviewed",
    "Decision memo prepared"
  ];

  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <SectionHeading eyebrow="DD Milestones" title="Review Checklist" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map((milestone) => (
          <div key={milestone} className="rounded border border-ink/10 p-3">
            <p className="text-sm font-medium text-ink">{milestone}</p>
            <p className="mt-1 text-xs text-ink/50">Placeholder</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function KeyMetrics({
  deal,
  units,
  sourceFiles
}: {
  deal: DealRow;
  units: DealUnitRow[];
  sourceFiles: SourceFileRow[];
}) {
  const occupiedUnits = units.filter((unit) =>
    ["occupied", "leased"].includes((unit.occupancy_status ?? "").toLowerCase())
  ).length;

  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <SectionHeading eyebrow="Key Metrics" title="Deal Snapshot" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Asking Price" value={formatJpy(deal.asking_price)} />
        <MetricCard label="Full Annual Rent" value={formatJpy(deal.annual_rent_full)} />
        <MetricCard label="Current Annual Rent" value={formatJpy(deal.annual_rent_current)} />
        <MetricCard
          label="物件資料の満室想定利回り"
          value={formatYield(getManualFullYield(deal))}
        />
        <MetricCard
          label="物件資料の現況利回り"
          value={formatYield(deal.current_yield)}
        />
        <MetricCard
          label="賃料・価格からの満室想定利回りチェック"
          value={formatYield(deal.calculated_gross_yield_full)}
        />
        <MetricCard
          label="賃料・価格からの現況利回りチェック"
          value={formatYield(deal.calculated_current_yield)}
        />
        <MetricCard label="Total Units" value={formatNumber(deal.total_units)} />
        <MetricCard label="Rent Roll Units" value={formatNumber(units.length)} />
        <MetricCard label="Monthly Rent Full" value={formatJpy(deal.monthly_rent_full)} />
        <MetricCard
          label="Monthly Rent Current"
          value={formatJpy(deal.monthly_rent_current)}
        />
        <MetricCard label="Occupied Units" value={formatNumber(occupiedUnits)} />
        <MetricCard label="Source Files" value={formatNumber(sourceFiles.length)} />
      </div>
    </section>
  );
}

function SourceFilesList({
  dealId,
  sourceFiles
}: {
  dealId: string;
  sourceFiles: SourceFileRow[];
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Source Files" title="Attached Documents" />
        <Link
          href={`/deals/${dealId}/sources`}
          className="rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300"
        >
          Upload source file
        </Link>
      </div>
      <div className="mt-5">
        <SourceFilesTable dealId={dealId} sourceFiles={sourceFiles} />
      </div>
    </section>
  );
}

function RentRollList({ units }: { units: DealUnitRow[] }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <SectionHeading eyebrow="Rent Roll" title="Unit Draft" />
      <div className="mt-5">
        {units.length === 0 ? (
          <EmptyState message="No rent roll rows are linked to this deal yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <TableHeader>Unit</TableHeader>
                  <TableHeader>Area</TableHeader>
                  <TableHeader>Layout</TableHeader>
                  <TableHeader>Rent</TableHeader>
                  <TableHeader>Common Fee</TableHeader>
                  <TableHeader>Occupancy</TableHeader>
                  <TableHeader>Lease</TableHeader>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <TableCell strong>{unit.unit_name}</TableCell>
                    <TableCell>{formatNumber(unit.floor_area)}</TableCell>
                    <TableCell>{formatText(unit.layout)}</TableCell>
                    <TableCell>{formatJpy(unit.rent_amount)}</TableCell>
                    <TableCell>{formatJpy(unit.common_fee)}</TableCell>
                    <TableCell>{formatText(unit.occupancy_status)}</TableCell>
                    <TableCell>{formatText(unit.lease_status)}</TableCell>
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

function DdNotes({ deal }: { deal: DealRow }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <SectionHeading eyebrow="DD Notes" title="Memo and Next Action" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-ink/10 p-4">
          <p className="text-sm font-semibold text-ink">Memo</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/70">
            {formatText(deal.memo)}
          </p>
        </div>
        <div className="rounded border border-ink/10 p-4">
          <p className="text-sm font-semibold text-ink">Next Action</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/70">
            {formatText(deal.next_action)}
          </p>
        </div>
      </div>
    </section>
  );
}

function SimulationSummary({
  simulations
}: {
  simulations: DealSimulationRow[];
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <SectionHeading eyebrow="Simulation Summary" title="Scenarios" />
      <div className="mt-5">
        {simulations.length === 0 ? (
          <EmptyState message="No simulations are linked to this deal yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <TableHeader>Scenario</TableHeader>
                  <TableHeader>Purchase Price</TableHeader>
                  <TableHeader>Loan Amount</TableHeader>
                  <TableHeader>Annual Debt Service</TableHeader>
                  <TableHeader>NOI</TableHeader>
                  <TableHeader>Pre-tax CF</TableHeader>
                  <TableHeader>DSCR</TableHeader>
                  <TableHeader>CCR</TableHeader>
                  <TableHeader>Break-even</TableHeader>
                </tr>
              </thead>
              <tbody>
                {simulations.map((simulation) => (
                  <tr key={simulation.id}>
                    <TableCell strong>{simulation.scenario_name}</TableCell>
                    <TableCell>{formatJpy(simulation.purchase_price)}</TableCell>
                    <TableCell>{formatJpy(simulation.loan_amount)}</TableCell>
                    <TableCell>{formatJpy(simulation.annual_debt_service)}</TableCell>
                    <TableCell>{formatJpy(simulation.noi)}</TableCell>
                    <TableCell>{formatJpy(simulation.pre_tax_cash_flow)}</TableCell>
                    <TableCell>{formatRatio(simulation.dscr)}</TableCell>
                    <TableCell>{formatPercent(simulation.ccr)}</TableCell>
                    <TableCell>{formatPercent(simulation.break_even_occupancy)}</TableCell>
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

function SectionHeading({
  eyebrow,
  title
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-clay">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-ink/10 p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
    </article>
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
