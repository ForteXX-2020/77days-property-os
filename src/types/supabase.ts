export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type PortfolioKpiView = {
  monthly_rent_current?: number | null;
  monthly_cf_actual?: number | null;
  rent_collection_rate?: number | null;
  dscr_proxy?: number | null;
  ltv?: number | null;
  vacancy_rate_unit?: number | null;
  loan_balance?: number | null;
  annual_cf_proxy?: number | null;
  [key: string]: Json | undefined;
};

export type PropertySummaryView = {
  property_code?: string | null;
  property_name?: string | null;
  property_type?: string | null;
  monthly_rent_current?: number | null;
  annual_rent_current?: number | null;
  loan_balance?: number | null;
  annual_payment_master?: number | null;
  monthly_cf_proxy?: number | null;
  annual_cf_proxy?: number | null;
  dscr_proxy?: number | null;
  vacancy_rate_unit?: number | null;
  vacancy_rate_rent?: number | null;
  ltv?: number | null;
  [key: string]: Json | undefined;
};

export type AlertView = {
  priority?: string | number | null;
  alert_type?: string | null;
  property_name?: string | null;
  unit_name?: string | null;
  due_date?: string | null;
  alert_message?: string | null;
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
      property_summary_with_proxies_view: {
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
