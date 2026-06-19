import { EmptyState } from "@/components/empty-state";
import { formatDateOnly } from "@/lib/format";
import type { AlertView } from "@/types/supabase";

export function AlertsPanel({ alerts }: { alerts: AlertView[] }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Alerts</p>
          <h2 className="text-xl font-bold text-ink">Upcoming items</h2>
        </div>
        <p className="text-sm text-ink/60">{alerts.length} rows</p>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState message="No alerts were returned." />
        ) : (
          alerts.map((alert, index) => (
            <article
              key={`${alert.alert_type ?? "alert"}-${alert.property_name ?? "property"}-${index}`}
              className="rounded border border-ink/10 bg-paper/60 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-clay/20 bg-clay/10 px-2 py-1 text-xs font-semibold text-clay">
                      Priority {alert.priority ?? "-"}
                    </span>
                    <span className="rounded border border-ink/10 bg-white px-2 py-1 text-xs text-ink/60">
                      {alert.alert_type ?? "-"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink">
                    {alert.property_name ?? "-"}
                  </h3>
                  <p className="mt-1 text-xs text-ink/50">Unit: {alert.unit_name ?? "-"}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    {alert.alert_message ?? "-"}
                  </p>
                </div>
                <p className="shrink-0 text-left text-xs text-ink/50 sm:text-right">
                  Due: {formatDateOnly(alert.due_date)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
