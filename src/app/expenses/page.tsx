import { DataError } from "@/components/data-error";
import { EmptyState } from "@/components/empty-state";
import { EnvError } from "@/components/env-error";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import {
  getExpenseProperties,
  getExpenseUnits,
  getPropertyExpenses,
  getPropertyLabel,
  getUnitLabel
} from "@/lib/expenses";
import { MissingEnvError } from "@/lib/env";
import { formatJpy } from "@/lib/format";
import type {
  GenericPropertyRow,
  GenericUnitRow,
  PropertyExpenseRow
} from "@/types/supabase";

export const dynamic = "force-dynamic";

function getPropertyName(propertyId: string, properties: GenericPropertyRow[]) {
  const property = properties.find((item) => item.property_id === propertyId);

  return property ? getPropertyLabel(property) : propertyId;
}

function getUnitName(unitId: string | null | undefined, units: GenericUnitRow[]) {
  if (!unitId) {
    return "-";
  }

  const unit = units.find((item) => item.unit_id === unitId);

  return unit ? getUnitLabel(unit) : unitId;
}

export default async function ExpensesPage() {
  try {
    const [properties, units, expenses] = await Promise.all([
      getExpenseProperties(),
      getExpenseUnits(),
      getPropertyExpenses()
    ]);

    return (
      <div>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            Expenses
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Property Expenses
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 sm:text-base">
            Foundation data for future NOI and real DSCR calculations. Unit and
            lease attribution are optional.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <ExpenseForm properties={properties} units={units} />

          <ExpensesTable
            expenses={expenses}
            properties={properties}
            units={units}
          />
        </div>
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

function ExpensesTable({
  expenses,
  properties,
  units
}: {
  expenses: PropertyExpenseRow[];
  properties: GenericPropertyRow[];
  units: GenericUnitRow[];
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Recent Expenses</p>
          <h2 className="text-xl font-bold text-ink">Expense ledger</h2>
        </div>
        <p className="text-sm text-ink/60">{expenses.length} rows</p>
      </div>

      <div className="mt-5">
        {expenses.length === 0 ? (
          <EmptyState message="No property expenses were returned." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-ink/50">
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Date</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Property</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Unit</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Category</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Cashflow</th>
                  <th className="border-b border-ink/10 px-3 py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {expense.transaction_date ?? expense.period_month}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 font-medium text-ink">
                      {getPropertyName(expense.property_id, properties)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {getUnitName(expense.unit_id, units)}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {expense.expense_category}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {expense.cashflow_category}
                    </td>
                    <td className="border-b border-ink/10 px-3 py-4 text-ink/70">
                      {formatJpy(expense.amount)}
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
