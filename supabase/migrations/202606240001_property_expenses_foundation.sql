-- Property expenses foundation for future NOI and real DSCR calculations.
-- This migration does not modify existing dashboard or bank-summary views.

create table if not exists public.property_expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  unit_id uuid null,
  period_month date not null,
  transaction_date date null,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_category text not null,
  accounting_account text null,
  cashflow_category text not null check (
    cashflow_category in (
      'operating_expense',
      'capex',
      'loan_interest',
      'loan_principal',
      'tax',
      'insurance',
      'owner_adjustment',
      'other'
    )
  ),
  is_operating_expense boolean not null default false,
  is_capex boolean not null default false,
  is_financing boolean not null default false,
  is_tax boolean not null default false,
  source_type text null,
  source_file_id uuid null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_expenses_period_month_is_month_start check (
    period_month = date_trunc('month', period_month)::date
  )
);

create index if not exists property_expenses_property_id_idx
  on public.property_expenses (property_id);

create index if not exists property_expenses_period_month_idx
  on public.property_expenses (period_month);

create index if not exists property_expenses_property_period_idx
  on public.property_expenses (property_id, period_month);

create unique index if not exists property_expenses_seed_unique_idx
  on public.property_expenses (
    property_id,
    period_month,
    expense_category,
    cashflow_category,
    source_type
  )
  where source_type = 'seed';

create or replace function public.set_property_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_property_expenses_updated_at on public.property_expenses;

create trigger set_property_expenses_updated_at
before update on public.property_expenses
for each row
execute function public.set_property_expenses_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.property_expenses
      add constraint property_expenses_property_id_fkey
      foreign key (property_id)
      references public.properties(id)
      on delete cascade;
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
      and table_name = 'units'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.property_expenses
      add constraint property_expenses_unit_id_fkey
      foreign key (unit_id)
      references public.units(id)
      on delete set null;
  end if;
exception
  when duplicate_object then null;
end;
$$;

create or replace view public.property_noi_draft_view as
select
  property_id,
  period_month,
  coalesce(sum(amount) filter (where is_operating_expense), 0) as operating_expense_total,
  coalesce(sum(amount) filter (where is_capex), 0) as capex_total,
  coalesce(sum(amount) filter (where is_financing), 0) as financing_total,
  coalesce(sum(amount) filter (where is_tax), 0) as tax_total,
  coalesce(sum(amount) filter (where cashflow_category = 'insurance'), 0) as insurance_total,
  coalesce(sum(amount) filter (
    where cashflow_category in ('owner_adjustment', 'other')
  ), 0) as other_expense_total
from public.property_expenses
group by property_id, period_month;

-- Seed sample expenses for the existing 4-property sample portfolio.
-- Uses existing property IDs and does not assume specific property UUIDs.
do $$
declare
  ordering_expression text := 'id::text';
begin
  if to_regclass('public.properties') is null then
    raise notice 'Skipping property_expenses seed: public.properties does not exist.';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    raise notice 'Skipping property_expenses seed: public.properties.id is not uuid.';
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'property_code'
  ) then
    ordering_expression := 'coalesce(property_code, id::text)';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'name'
  ) then
    ordering_expression := 'coalesce(name, id::text)';
  end if;

  execute format($seed$
    with sample_properties as (
      select id, row_number() over (order by %s) as sample_number
      from public.properties
      order by %s
      limit 4
    ),
    seed_rows as (
      select
        id as property_id,
        date '2026-06-01' as period_month,
        date '2026-06-15' as transaction_date,
        (35000 + sample_number * 2500)::numeric(14, 2) as amount,
        'Repairs and maintenance' as expense_category,
        'Repairs' as accounting_account,
        'operating_expense' as cashflow_category,
        true as is_operating_expense,
        false as is_capex,
        false as is_financing,
        false as is_tax,
        'seed' as source_type,
        null::uuid as source_file_id,
        'Sample operating expense for NOI draft foundation' as notes
      from sample_properties
      union all
      select
        id,
        date '2026-06-01',
        date '2026-06-18',
        (18000 + sample_number * 1200)::numeric(14, 2),
        'Property insurance',
        'Insurance',
        'insurance',
        true,
        false,
        false,
        false,
        'seed',
        null::uuid,
        'Sample insurance expense for NOI draft foundation'
      from sample_properties
      union all
      select
        id,
        date '2026-06-01',
        date '2026-06-19',
        (22000 + sample_number * 1400)::numeric(14, 2),
        'Property tax',
        'Taxes',
        'tax',
        true,
        false,
        false,
        true,
        'seed',
        null::uuid,
        'Sample tax expense for NOI draft foundation'
      from sample_properties
      union all
      select
        id,
        date '2026-06-01',
        date '2026-06-20',
        (24000 + sample_number * 1700)::numeric(14, 2),
        'Loan interest',
        'Interest expense',
        'loan_interest',
        false,
        false,
        true,
        false,
        'seed',
        null::uuid,
        'Sample financing item excluded from NOI operating expenses'
      from sample_properties
      union all
      select
        id,
        date '2026-06-01',
        date '2026-06-22',
        (42000 + sample_number * 3100)::numeric(14, 2),
        'Capital improvement',
        'Capex',
        'capex',
        false,
        true,
        false,
        false,
        'seed',
        null::uuid,
        'Sample capex item excluded from operating NOI'
      from sample_properties
    )
    insert into public.property_expenses (
      property_id,
      period_month,
      transaction_date,
      amount,
      expense_category,
      accounting_account,
      cashflow_category,
      is_operating_expense,
      is_capex,
      is_financing,
      is_tax,
      source_type,
      source_file_id,
      notes
    )
    select
      property_id,
      period_month,
      transaction_date,
      amount,
      expense_category,
      accounting_account,
      cashflow_category,
      is_operating_expense,
      is_capex,
      is_financing,
      is_tax,
      source_type,
      source_file_id,
      notes
    from seed_rows
    on conflict do nothing;
  $seed$, ordering_expression, ordering_expression);
end;
$$;
