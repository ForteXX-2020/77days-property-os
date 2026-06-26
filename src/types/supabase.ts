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

export type MonthlyPlPropertyView = {
  property_id?: string | null;
  property_code?: string | null;
  property_name?: string | null;
  period_month?: string | null;
  rent_income?: number | null;
  operating_expenses?: number | null;
  noi_draft?: number | null;
  capex?: number | null;
  financing?: number | null;
  tax?: number | null;
  insurance?: number | null;
  cf_draft?: number | null;
  [key: string]: Json | undefined;
};

export type MonthlyPlUnitView = {
  property_id?: string | null;
  property_code?: string | null;
  property_name?: string | null;
  unit_id?: string | null;
  unit_name?: string | null;
  occupancy_status?: string | null;
  rent_current?: number | null;
  period_month?: string | null;
  rent_received?: number | null;
  vacancy_start_date?: string | null;
  vacancy_days?: number | null;
  move_out_scheduled_date?: string | null;
  unit_level_expenses?: number | null;
  unit_level_cf_before_common_allocation?: number | null;
  [key: string]: Json | undefined;
};

export type PropertyExpenseRow = {
  id: string;
  property_id: string;
  unit_id?: string | null;
  lease_id?: string | null;
  period_month: string;
  transaction_date?: string | null;
  amount: number;
  expense_category: string;
  accounting_account?: string | null;
  cashflow_category:
    | "operating_expense"
    | "capex"
    | "loan_interest"
    | "loan_principal"
    | "tax"
    | "insurance"
    | "owner_adjustment"
    | "other";
  is_operating_expense: boolean;
  is_capex: boolean;
  is_financing: boolean;
  is_tax: boolean;
  source_type?: string | null;
  source_file_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: Json | undefined;
};

export type PropertyExpenseInsert = Omit<
  PropertyExpenseRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type GenericPropertyRow = {
  property_id: string;
  property_code?: string | null;
  property_name?: string | null;
  [key: string]: Json | undefined;
};

export type GenericUnitRow = {
  unit_id: string;
  property_id: string;
  unit_name?: string | null;
  [key: string]: Json | undefined;
};

export type Database = {
  public: {
    Tables: {
      property_expenses: {
        Row: PropertyExpenseRow;
        Insert: PropertyExpenseInsert;
        Update: Partial<PropertyExpenseInsert>;
        Relationships: [];
      };
      properties: {
        Row: GenericPropertyRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      units: {
        Row: GenericUnitRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
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
      monthly_pl_property_view: {
        Row: MonthlyPlPropertyView;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      monthly_pl_unit_view: {
        Row: MonthlyPlUnitView;
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
