import { createSupabaseClient } from "@/lib/supabaseClient";
import type {
  AlertView,
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
    .limit(100);

  if (error) {
    throw toDataError("property_summary_with_proxies_view", error.message);
  }

  return data ?? [];
}
