-- Source file upload storage foundation.
-- Keeps uploaded files in a private bucket. Public URLs are not enabled.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'source-files',
  'source-files',
  false,
  52428800,
  null
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'source_files_insert_anon'
  ) then
    create policy source_files_insert_anon
      on storage.objects
      for insert
      to anon
      with check (
        bucket_id = 'source-files'
        and name like 'deals/%'
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'source_files_delete_anon'
  ) then
    create policy source_files_delete_anon
      on storage.objects
      for delete
      to anon
      using (
        bucket_id = 'source-files'
        and name like 'deals/%'
      );
  end if;
end;
$$;
