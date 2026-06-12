export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type PortfolioKpiView = {
  user_id: string;
  property_count?: number | null;
  unit_count?: number | null;
  occupied_unit_count?: number | null;
  vacant_unit_count?: number | null;
  monthly_scheduled_rent?: number | null;
  monthly_received_rent?: number | null;
  monthly_unpaid_rent?: number | null;
  monthly_scheduled_loan_payment?: number | null;
  monthly_paid_loan_payment?: number | null;
  monthly_operating_cost_estimate?: number | null;
  monthly_projected_cf?: number | null;
  monthly_actual_cf_to_date?: number | null;
  rent_collection_rate_pct?: number | null;
  unit_vacancy_rate_pct?: number | null;
  rent_weighted_vacancy_rate_pct?: number | null;
  estimated_noi?: number | null;
  annual_debt_service?: number | null;
  portfolio_dscr?: number | null;
  portfolio_loan_balance?: number | null;
  portfolio_value?: number | null;
  portfolio_ltv_pct?: number | null;
  [key: string]: Json | undefined;
};

export type PropertySummaryView = {
  user_id: string;
  property_name?: string | null;
  address?: string | null;
  property_type?: string | null;
  ownership_entity?: string | null;
  management_company?: string | null;
  purchase_price?: number | null;
  current_value?: number | null;
  monthly_operating_cost_estimate?: number | null;
  unit_count?: number | null;
  occupied_unit_count?: number | null;
  vacant_unit_count?: number | null;
  full_monthly_rent?: number | null;
  current_monthly_rent?: number | null;
  annual_current_rent?: number | null;
  unit_vacancy_rate_pct?: number | null;
  rent_weighted_vacancy_rate_pct?: number | null;
  loan_balance?: number | null;
  monthly_debt_service?: number | null;
  annual_debt_service?: number | null;
  estimated_noi?: number | null;
  dscr?: number | null;
  ltv_pct?: number | null;
  [key: string]: Json | undefined;
};

export type AlertView = {
  user_id: string;
  alert_id?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  severity?: string | null;
  title?: string | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
  due_date?: string | null;
  [key: string]: Json | undefined;
};

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: {
      portfolio_kpi_view: {
        Row: PortfolioKpiView;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      property_summary_view: {
        Row: PropertySummaryView;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      alerts_view: {
        Row: AlertView;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
