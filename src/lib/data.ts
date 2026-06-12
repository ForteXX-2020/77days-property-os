import { createSupabaseClient, getMvpUserId } from "@/lib/supabase";
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
  const userId = getMvpUserId();

  const { data, error } = await supabase
    .from("portfolio_kpi_view")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw toDataError("portfolio_kpi_view", error.message);
  }

  return data;
}

export async function getAlerts(): Promise<AlertView[]> {
  const supabase = createSupabaseClient();
  const userId = getMvpUserId();

  const { data, error } = await supabase
    .from("alerts_view")
    .select("*")
    .eq("user_id", userId)
    .limit(20);

  if (error) {
    throw toDataError("alerts_view", error.message);
  }

  return data ?? [];
}

export async function getPropertySummaries(): Promise<PropertySummaryView[]> {
  const supabase = createSupabaseClient();
  const userId = getMvpUserId();

  const { data, error } = await supabase
    .from("property_summary_view")
    .select("*")
    .eq("user_id", userId)
    .limit(100);

  if (error) {
    throw toDataError("property_summary_view", error.message);
  }

  return data ?? [];
}
