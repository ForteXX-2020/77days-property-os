"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPropertyExpense } from "@/app/expenses/actions";
import { getPropertyLabel, getUnitLabel } from "@/lib/expenses";
import type { GenericPropertyRow, GenericUnitRow } from "@/types/supabase";

const cashflowCategories = [
  { value: "operating_expense", label: "Operating Expense" },
  { value: "capex", label: "Capex" },
  { value: "loan_interest", label: "Loan Interest" },
  { value: "loan_principal", label: "Loan Principal" },
  { value: "tax", label: "Tax" },
  { value: "insurance", label: "Insurance" },
  { value: "owner_adjustment", label: "Owner Adjustment" },
  { value: "other", label: "Other" }
];

const commonExpenseCategories = [
  "Repairs",
  "Cleaning",
  "Advertising",
  "Move-out cost",
  "Room-specific repair",
  "Utilities",
  "Property management",
  "Insurance",
  "Property tax",
  "Loan interest",
  "Loan principal",
  "Capex",
  "Other"
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const initialActionState = {
  status: "idle" as const,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-lg border-2 border-black bg-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 hover:shadow-md disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-ink/15 disabled:text-ink/45"
    >
      {pending ? "Adding..." : "Add expense"}
    </button>
  );
}

export function ExpenseForm({
  properties,
  units
}: {
  properties: GenericPropertyRow[];
  units: GenericUnitRow[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [actionState, formAction] = useFormState(
    createPropertyExpense,
    initialActionState
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    formRef.current?.reset();
    setSelectedPropertyId("");
    setSelectedUnitId("");
  }, [actionState]);

  const filteredUnits = useMemo(() => {
    if (!selectedPropertyId) {
      return [];
    }

    return units.filter((unit) => unit.property_id === selectedPropertyId);
  }, [selectedPropertyId, units]);

  return (
    <section className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <p className="text-sm font-semibold text-clay">Add Expense</p>
      <h2 className="mt-1 text-xl font-bold text-ink">New expense</h2>
      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/70">Property</span>
          <select
            name="property_id"
            required
            value={selectedPropertyId}
            onChange={(event) => {
              setSelectedPropertyId(event.target.value);
              setSelectedUnitId("");
            }}
            className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {getPropertyLabel(property)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">Unit optional</span>
          <select
            name="unit_id"
            value={selectedUnitId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            disabled={!selectedPropertyId}
            className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink disabled:bg-ink/5 disabled:text-ink/40"
          >
            <option value="">Property-level expense</option>
            {filteredUnits.map((unit) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {getUnitLabel(unit)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/50">
            Use a unit for repairs, cleaning, advertising, move-out costs, or
            room-specific expenses.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">
            Lease UUID optional
          </span>
          <input
            name="lease_id"
            type="text"
            placeholder="Leave blank for now"
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink/70">Period month</span>
            <input
              name="period_month"
              type="month"
              defaultValue={getCurrentMonth()}
              required
              className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/70">Expense date</span>
            <input
              name="transaction_date"
              type="date"
              defaultValue={getToday()}
              className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink/70">Amount</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="1"
              required
              className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/70">Cashflow category</span>
            <select
              name="cashflow_category"
              required
              className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
            >
              {cashflowCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">Expense category</span>
          <input
            name="expense_category"
            list="expense-categories"
            required
            placeholder="Repairs, Cleaning, Advertising..."
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
          />
          <datalist id="expense-categories">
            {commonExpenseCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">
            Accounting account optional
          </span>
          <input
            name="accounting_account"
            type="text"
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">Notes optional</span>
          <textarea
            name="notes"
            rows={3}
            className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
          />
        </label>

        {actionState.status !== "idle" ? (
          <p
            className={
              actionState.status === "success"
                ? "rounded border border-moss/20 bg-moss/10 px-3 py-2 text-sm text-moss"
                : "rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            }
          >
            {actionState.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </section>
  );
}
