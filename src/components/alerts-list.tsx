import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import type { AlertView } from "@/types/supabase";

function severityClass(severity: string | null | undefined) {
  const normalized = severity?.toLowerCase();

  if (normalized === "critical" || normalized === "high") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (normalized === "medium" || normalized === "warning") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  return "bg-moss/10 text-moss border-moss/20";
}

export function AlertsList({ alerts }: { alerts: AlertView[] }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Alerts</p>
          <h2 className="text-xl font-bold text-ink">Items needing attention</h2>
        </div>
        <p className="text-sm text-ink/60">{alerts.length} items</p>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState message="No alerts are available." />
        ) : (
          alerts.map((alert, index) => (
            <article
              key={alert.alert_id ?? `${alert.title ?? "alert"}-${index}`}
              className="rounded border border-ink/10 bg-paper/60 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-2 py-1 text-xs font-semibold ${severityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity ?? "info"}
                    </span>
                    <span className="text-xs text-ink/50">
                      {alert.property_name ?? "Portfolio"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink">
                    {alert.title ?? "Untitled alert"}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink/65">
                    {alert.message ?? "No detailed message is available."}
                  </p>
                </div>
                <div className="shrink-0 text-left text-xs text-ink/50 sm:text-right">
                  <p>Created: {formatDate(alert.created_at)}</p>
                  <p className="mt-1">Due: {formatDate(alert.due_date)}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
