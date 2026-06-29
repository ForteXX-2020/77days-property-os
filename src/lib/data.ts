import { createSupabaseClient } from "@/lib/supabaseClient";
import type {
  AlertView,
  MonthlyPlPropertyView,
  MonthlyPlUnitView,
  PortfolioKpiView,
  PropertySummaryView
} from "@/types/supabase";

function toDataError(viewName: string, message: string) {
  return new Error(`Failed to load ${viewName}: ${message}`);
}

export async function getPortfolioKpi(): Promise<PortfolioKpiView | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("portfolio_kpi_view")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw toDataError("portfolio_kpi_view", error.message);
  }

  return data;
}

export async function getAlerts(): Promise<AlertView[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("alerts_view")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(20);

  if (error) {
    throw toDataError("alerts_view", error.message);
  }

  return data ?? [];
}

export async function getPropertySummaries(): Promise<PropertySummaryView[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("property_summary_with_proxies_view")
    .select("*")
    .order("property_code", { ascending: true, nullsFirst: false });

  if (error) {
    throw toDataError("property_summary_with_proxies_view", error.message);
  }

  return data ?? [];
}

export async function getMonthlyPlPropertyRows(): Promise<MonthlyPlPropertyView[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("monthly_pl_property_view")
    .select("*")
    .order("period_month", { ascending: false, nullsFirst: false })
    .order("property_code", { ascending: true, nullsFirst: false })
    .limit(1000);

  if (error) {
    throw toDataError("monthly_pl_property_view", error.message);
  }

  return data ?? [];
}

export async function getMonthlyPlUnitRows(): Promise<MonthlyPlUnitView[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("monthly_pl_unit_view")
    .select("*")
    .order("period_month", { ascending: false, nullsFirst: false })
    .order("property_code", { ascending: true, nullsFirst: false })
    .order("unit_name", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (error) {
    throw toDataError("monthly_pl_unit_view", error.message);
  }

  return data ?? [];
}
