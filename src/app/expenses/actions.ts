"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { PropertyExpenseInsert, PropertyExpenseRow } from "@/types/supabase";

type CashflowCategory = PropertyExpenseRow["cashflow_category"];

export type ExpenseActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function getCashflowFlags(cashflowCategory: CashflowCategory) {
  return {
    is_operating_expense:
      cashflowCategory === "operating_expense" ||
      cashflowCategory === "tax" ||
      cashflowCategory === "insurance",
    is_capex: cashflowCategory === "capex",
    is_financing:
      cashflowCategory === "loan_interest" || cashflowCategory === "loan_principal",
    is_tax: cashflowCategory === "tax"
  };
}

function isCashflowCategory(value: string): value is CashflowCategory {
  return [
    "operating_expense",
    "capex",
    "loan_interest",
    "loan_principal",
    "tax",
    "insurance",
    "owner_adjustment",
    "other"
  ].includes(value);
}

export async function createPropertyExpense(
  _previousState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  try {
    const propertyId = getRequiredString(formData, "property_id");
    const periodMonth = `${getRequiredString(formData, "period_month")}-01`;
    const amount = Number(getRequiredString(formData, "amount"));
    const cashflowCategoryValue = getRequiredString(formData, "cashflow_category");

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("amount must be a positive number.");
    }

    if (!isCashflowCategory(cashflowCategoryValue)) {
      throw new Error("cashflow_category is invalid.");
    }

    const payload: PropertyExpenseInsert = {
      property_id: propertyId,
      unit_id: getOptionalString(formData, "unit_id"),
      lease_id: getOptionalString(formData, "lease_id"),
      period_month: periodMonth,
      transaction_date: getOptionalString(formData, "transaction_date"),
      amount,
      expense_category: getRequiredString(formData, "expense_category"),
      accounting_account: getOptionalString(formData, "accounting_account"),
      cashflow_category: cashflowCategoryValue,
      ...getCashflowFlags(cashflowCategoryValue),
      source_type: "manual",
      source_file_id: null,
      notes: getOptionalString(formData, "notes")
    };

    const supabase = createSupabaseClient();
    const { error } = await supabase.from("property_expenses").insert(payload);

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    revalidatePath("/expenses");

    return {
      status: "success",
      message: "Expense added."
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to add expense."
    };
  }
}
