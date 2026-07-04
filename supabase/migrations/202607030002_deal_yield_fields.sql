-- Deal listing yield and calculated yield fields.
-- gross_yield is kept for backward compatibility.

alter table if exists public.deals
  add column if not exists gross_yield_full numeric(14, 4) null;

alter table if exists public.deals
  add column if not exists current_yield numeric(14, 4) null;

alter table if exists public.deals
  add column if not exists calculated_gross_yield_full numeric(14, 4) null;

alter table if exists public.deals
  add column if not exists calculated_current_yield numeric(14, 4) null;

alter table if exists public.deals
  add column if not exists monthly_rent_current numeric(14, 2) null;

alter table if exists public.deals
  add column if not exists annual_rent_current numeric(14, 2) null;

do $$
begin
  alter table public.deals
    add constraint deals_gross_yield_full_non_negative
    check (gross_yield_full is null or gross_yield_full >= 0);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.deals
    add constraint deals_current_yield_non_negative
    check (current_yield is null or current_yield >= 0);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.deals
    add constraint deals_calculated_gross_yield_full_non_negative
    check (
      calculated_gross_yield_full is null
      or calculated_gross_yield_full >= 0
    );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.deals
    add constraint deals_calculated_current_yield_non_negative
    check (
      calculated_current_yield is null
      or calculated_current_yield >= 0
    );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.deals
    add constraint deals_monthly_rent_current_non_negative
    check (monthly_rent_current is null or monthly_rent_current >= 0);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.deals
    add constraint deals_annual_rent_current_non_negative
    check (annual_rent_current is null or annual_rent_current >= 0);
exception
  when duplicate_object then null;
end;
$$;

update public.deals
set gross_yield_full = gross_yield
where gross_yield_full is null
  and gross_yield is not null;

update public.deals
set calculated_gross_yield_full =
  case
    when asking_price is null or asking_price <= 0 or annual_rent_full is null then null
    else round((annual_rent_full / asking_price * 100)::numeric, 2)
  end,
  calculated_current_yield =
  case
    when asking_price is null or asking_price <= 0 or annual_rent_current is null then null
    else round((annual_rent_current / asking_price * 100)::numeric, 2)
  end
where asking_price is not null;
