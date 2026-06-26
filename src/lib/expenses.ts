import { createSupabaseClient } from "@/lib/supabaseClient";
import type {
  GenericPropertyRow,
  GenericUnitRow,
  PropertyExpenseRow
} from "@/types/supabase";

function toDataError(sourceName: string, message: string) {
  return new Error(`Failed to load ${sourceName}: ${message}`);
}

export async function getExpenseProperties(): Promise<GenericPropertyRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select("property_id, property_code, property_name")
    .limit(100);

  if (error) {
    console.error("Failed to load properties", error);
    throw toDataError("properties", error.message);
  }

  return [...(data ?? [])].sort((left, right) =>
    getPropertyLabel(left).localeCompare(getPropertyLabel(right), "ja-JP")
  );
}

export async function getExpenseUnits(): Promise<GenericUnitRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("units")
    .select("unit_id, property_id, unit_name")
    .limit(500);

  if (error) {
    console.error("Failed to load units", error);

    if (error.code === "42P01") {
      return [];
    }

    throw toDataError("units", error.message);
  }

  return [...(data ?? [])].sort((left, right) =>
    getUnitLabel(left).localeCompare(getUnitLabel(right), "ja-JP")
  );
}

export async function getPropertyExpenses(): Promise<PropertyExpenseRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("property_expenses")
    .select("*")
    .order("transaction_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load property_expenses", error);
    throw toDataError("property_expenses", error.message);
  }

  return data ?? [];
}

export function getPropertyLabel(property: GenericPropertyRow) {
  const code = property.property_code;
  const name = property.property_name;

  return [code, name].filter(Boolean).join(" - ") || property.property_id;
}

export function getUnitLabel(unit: GenericUnitRow) {
  return unit.unit_name ?? unit.unit_id;
}
