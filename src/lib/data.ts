import { createSupabaseClient } from "@/lib/supabaseClient";
import type {
  AlertView,
  DealRow,
  DealSimulationRow,
  DealUnitRow,
  MonthlyPlPropertyView,
  MonthlyPlUnitView,
  PortfolioKpiView,
  PropertySummaryView,
  SourceFileRow
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

export async function getDeals(): Promise<DealRow[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("deal_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw toDataError("deals", error.message);
  }

  return data ?? [];
}

export async function getDeletedDeals(): Promise<DealRow[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false, nullsFirst: false })
    .order("deal_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw toDataError("deleted deals", error.message);
  }

  return data ?? [];
}

export async function getDeal(dealId: string): Promise<DealRow | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .maybeSingle();

  if (error) {
    throw toDataError("deals", error.message);
  }

  return data;
}

export async function getDealUnits(dealId: string): Promise<DealUnitRow[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("deal_units")
    .select("*")
    .eq("deal_id", dealId)
    .order("unit_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw toDataError("deal_units", error.message);
  }

  return data ?? [];
}

export async function getDealSimulations(
  dealId: string
): Promise<DealSimulationRow[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("deal_simulations")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw toDataError("deal_simulations", error.message);
  }

  return data ?? [];
}

export async function getDealSourceFiles(dealId: string): Promise<SourceFileRow[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("source_files")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw toDataError("source_files", error.message);
  }

  return data ?? [];
}
