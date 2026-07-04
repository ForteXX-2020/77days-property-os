-- Soft delete support for deals.
-- Deal child records are intentionally kept intact because delete/restore is
-- recoverable at the deal level.

alter table if exists public.deals
  add column if not exists deleted_at timestamptz null;

alter table if exists public.deals
  add column if not exists deleted_reason text null;

alter table if exists public.deals
  add column if not exists restored_at timestamptz null;

create index if not exists deals_deleted_at_idx
  on public.deals (deleted_at);

comment on column public.deals.deleted_at is
  'Soft-delete timestamp. Null means active.';

comment on column public.deals.deleted_reason is
  'Optional reason for soft-deleting the deal.';

comment on column public.deals.restored_at is
  'Timestamp of the most recent restore action.';
