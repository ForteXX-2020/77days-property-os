-- Adds optional lease_id support for future lease-level expense attribution.
-- This does not modify dashboard or bank-summary views.

alter table if exists public.property_expenses
  add column if not exists lease_id uuid null;

create index if not exists property_expenses_lease_id_idx
  on public.property_expenses (lease_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leases'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.property_expenses
      add constraint property_expenses_lease_id_fkey
      foreign key (lease_id)
      references public.leases(id)
      on delete set null;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rental_contracts'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.property_expenses
      add constraint property_expenses_lease_id_fkey
      foreign key (lease_id)
      references public.rental_contracts(id)
      on delete set null;
  end if;
exception
  when duplicate_object then null;
end;
$$;
