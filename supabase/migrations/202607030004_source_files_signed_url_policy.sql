-- Allow the app to create short-lived signed URLs for private source files.
-- The bucket remains private; this does not create public URLs.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'source_files_select_anon'
  ) then
    create policy source_files_select_anon
      on storage.objects
      for select
      to anon
      using (
        bucket_id = 'source-files'
        and name like 'deals/%'
      );
  end if;
end;
$$;
