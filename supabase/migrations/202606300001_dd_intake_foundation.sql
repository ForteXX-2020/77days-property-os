-- DD Intake database foundation.
-- Creates deal detail and source file intake tables only.
-- No UI, upload, OCR, or extraction implementation is included here.

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  deal_name text not null,
  property_name text null,
  address text null,
  source_media text null,
  source_url text null,
  broker_name text null,
  property_type text null,
  asking_price numeric(14, 2) null check (asking_price is null or asking_price >= 0),
  monthly_rent_full numeric(14, 2) null check (
    monthly_rent_full is null or monthly_rent_full >= 0
  ),
  annual_rent_full numeric(14, 2) null check (
    annual_rent_full is null or annual_rent_full >= 0
  ),
  gross_yield numeric(14, 4) null check (gross_yield is null or gross_yield >= 0),
  structure text null,
  total_units integer null check (total_units is null or total_units >= 0),
  status text not null default 'draft',
  final_decision text null,
  memo text null,
  next_action text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_units (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  unit_name text not null,
  floor_area numeric(10, 2) null check (floor_area is null or floor_area >= 0),
  layout text null,
  rent_amount numeric(14, 2) null check (rent_amount is null or rent_amount >= 0),
  common_fee numeric(14, 2) null check (common_fee is null or common_fee >= 0),
  occupancy_status text null,
  lease_status text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_simulations (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  scenario_name text not null,
  purchase_price numeric(14, 2) null check (
    purchase_price is null or purchase_price >= 0
  ),
  acquisition_cost_amount numeric(14, 2) null check (
    acquisition_cost_amount is null or acquisition_cost_amount >= 0
  ),
  equity_amount numeric(14, 2) null check (
    equity_amount is null or equity_amount >= 0
  ),
  loan_amount numeric(14, 2) null check (loan_amount is null or loan_amount >= 0),
  loan_term_years numeric(6, 2) null check (
    loan_term_years is null or loan_term_years >= 0
  ),
  interest_rate numeric(14, 6) null check (
    interest_rate is null or interest_rate >= 0
  ),
  monthly_debt_service numeric(14, 2) null check (
    monthly_debt_service is null or monthly_debt_service >= 0
  ),
  annual_debt_service numeric(14, 2) null check (
    annual_debt_service is null or annual_debt_service >= 0
  ),
  noi numeric(14, 2) null,
  pre_tax_cash_flow numeric(14, 2) null,
  dscr numeric(14, 4) null,
  ccr numeric(14, 4) null,
  break_even_occupancy numeric(14, 4) null,
  assumptions_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_files (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null references public.deals(id) on delete cascade,
  property_id uuid null,
  file_name text not null,
  file_type text null,
  document_type text null,
  storage_path text not null,
  processing_status text not null default 'pending',
  extracted_text text null,
  extracted_json jsonb null,
  page_count integer null check (page_count is null or page_count >= 0),
  estimated_cost numeric(14, 2) null check (
    estimated_cost is null or estimated_cost >= 0
  ),
  processed_at timestamptz null,
  review_status text not null default 'unreviewed',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_files_deal_or_property_required check (
    deal_id is not null or property_id is not null
  )
);

create index if not exists deals_status_idx
  on public.deals (status);

create index if not exists deals_final_decision_idx
  on public.deals (final_decision);

create index if not exists deal_units_deal_id_idx
  on public.deal_units (deal_id);

create index if not exists deal_simulations_deal_id_idx
  on public.deal_simulations (deal_id);

create index if not exists source_files_deal_id_idx
  on public.source_files (deal_id);

create index if not exists source_files_property_id_idx
  on public.source_files (property_id);

create index if not exists source_files_document_type_idx
  on public.source_files (document_type);

create index if not exists source_files_processing_status_idx
  on public.source_files (processing_status);

create index if not exists source_files_review_status_idx
  on public.source_files (review_status);

create or replace function public.set_dd_intake_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
before update on public.deals
for each row
execute function public.set_dd_intake_updated_at();

drop trigger if exists set_deal_units_updated_at on public.deal_units;
create trigger set_deal_units_updated_at
before update on public.deal_units
for each row
execute function public.set_dd_intake_updated_at();

drop trigger if exists set_deal_simulations_updated_at on public.deal_simulations;
create trigger set_deal_simulations_updated_at
before update on public.deal_simulations
for each row
execute function public.set_dd_intake_updated_at();

drop trigger if exists set_source_files_updated_at on public.source_files;
create trigger set_source_files_updated_at
before update on public.source_files
for each row
execute function public.set_dd_intake_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'property_id'
      and data_type = 'uuid'
  ) then
    alter table public.source_files
      add constraint source_files_property_id_fkey
      foreign key (property_id)
      references public.properties(property_id)
      on delete cascade;
  else
    raise notice 'TODO: source_files.property_id FK not added because public.properties.property_id uuid was not found.';
  end if;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'property_expenses'
      and column_name = 'source_file_id'
      and data_type = 'uuid'
  ) then
    alter table public.property_expenses
      add constraint property_expenses_source_file_id_fkey
      foreign key (source_file_id)
      references public.source_files(id)
      on delete set null;
  else
    raise notice 'TODO: property_expenses.source_file_id FK not added because the column is missing or not uuid.';
  end if;
exception
  when duplicate_object then null;
end;
$$;
