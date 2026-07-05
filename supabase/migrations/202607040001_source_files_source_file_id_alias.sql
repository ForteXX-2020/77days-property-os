-- Compatibility alias for Source File Intake MVP terminology.
-- The canonical primary key remains id. source_file_id mirrors id for callers
-- that expect an explicit source_file_id column.

alter table public.source_files
  add column if not exists source_file_id uuid generated always as (id) stored;

create unique index if not exists source_files_source_file_id_key
  on public.source_files (source_file_id);
