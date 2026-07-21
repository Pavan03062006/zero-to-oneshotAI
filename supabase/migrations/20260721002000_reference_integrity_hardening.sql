-- Verification hardening: every redundant project reference must agree with its parent resource.
create or replace function public.validate_same_project() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'timelines' then
    if new.parent_timeline_id is not null and not exists (
      select 1 from timelines where id = new.parent_timeline_id and project_id = new.project_id) then
      raise exception using errcode = '23514', message = 'Parent timeline must belong to project';
    end if;
  elsif tg_table_name = 'story_events' then
    if not exists (select 1 from timelines where id = new.timeline_id and project_id = new.project_id) then
      raise exception using errcode = '23514', message = 'Timeline must belong to project';
    end if;
  elsif tg_table_name = 'entity_relationships' then
    if not exists (select 1 from story_entities where id = new.source_entity_id and project_id = new.project_id)
       or not exists (select 1 from story_entities where id = new.target_entity_id and project_id = new.project_id) then
      raise exception using errcode = '23514', message = 'Entities must belong to project';
    end if;
  end if;
  return new;
end $$;

create function public.validate_project_reference_integrity() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'story_entities' then
    if new.source_document_id is not null and not exists (
      select 1 from documents where id = new.source_document_id and project_id = new.project_id) then
      raise exception using errcode = '23514', message = 'Source document must belong to project';
    end if;
  elsif tg_table_name = 'document_revisions' then
    if not exists (select 1 from documents where id = new.document_id and project_id = new.project_id) then
      raise exception using errcode = '23514', message = 'Revision document must belong to project';
    end if;
  elsif tg_table_name = 'continuity_scans' then
    if not exists (select 1 from documents where id = new.document_id and project_id = new.project_id)
       or (new.document_revision_id is not null and not exists (
         select 1 from document_revisions where id = new.document_revision_id
           and document_id = new.document_id and project_id = new.project_id)) then
      raise exception using errcode = '23514', message = 'Scan document and revision must belong to project';
    end if;
  elsif tg_table_name = 'consistency_issues' then
    if (new.document_id is not null and not exists (
       select 1 from documents where id = new.document_id and project_id = new.project_id))
       or (new.scan_id is not null and not exists (
       select 1 from continuity_scans where id = new.scan_id and project_id = new.project_id
         and (new.document_id is null or document_id = new.document_id))) then
      raise exception using errcode = '23514', message = 'Issue scan and document must belong to project';
    end if;
  end if;
  return new;
end $$;

create trigger entities_project_reference before insert or update on public.story_entities
for each row execute function public.validate_project_reference_integrity();
create trigger revisions_project_reference before insert or update on public.document_revisions
for each row execute function public.validate_project_reference_integrity();
create trigger scans_project_reference before insert or update on public.continuity_scans
for each row execute function public.validate_project_reference_integrity();
create trigger issues_project_reference before insert or update on public.consistency_issues
for each row execute function public.validate_project_reference_integrity();

-- RLS and grants are complementary: authenticated clients need table privileges before policies apply.
grant select, insert, update, delete on public.profiles, public.projects, public.project_members,
  public.story_entities, public.entity_relationships, public.timelines, public.story_events,
  public.documents, public.document_revisions, public.continuity_scans, public.consistency_issues
  to authenticated;
-- The Edge Function uses a service-role client only after JWT and membership checks.
-- Keep this grant explicit rather than relying on environment-specific defaults.
grant select, insert, update, delete on public.profiles, public.projects, public.project_members,
  public.story_entities, public.entity_relationships, public.timelines, public.story_events,
  public.documents, public.document_revisions, public.continuity_scans, public.consistency_issues
  to service_role;
grant select, insert, update, delete on public.generation_jobs, public.generation_outputs, public.ai_usage_logs
  to service_role;
grant select on public.generation_jobs, public.generation_outputs, public.ai_usage_logs to authenticated;
revoke all on public.generation_jobs, public.generation_outputs, public.ai_usage_logs from anon;
revoke insert, update, delete on public.generation_jobs, public.generation_outputs, public.ai_usage_logs from authenticated;

create or replace function public.save_document_revision(
  p_document_id uuid, p_content text, p_change_summary text default null,
  p_revision_source public.revision_source default 'autosave'
) returns public.document_revisions
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_doc documents;
  v_hash text;
  v_revision document_revisions;
begin
  select * into v_doc from documents where id = p_document_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Document not found'; end if;
  if not has_project_role(v_doc.project_id, v_user, array['owner','editor']::project_role[]) then
    raise exception using errcode = '42501', message = 'Insufficient role';
  end if;
  v_hash := encode(extensions.digest(convert_to(p_content, 'UTF8'), 'sha256'), 'hex');
  select * into v_revision from document_revisions
    where document_id = p_document_id and content_hash = v_hash;
  if found then return v_revision; end if;
  insert into document_revisions(
    document_id, project_id, version_number, content, word_count,
    change_summary, revision_source, content_hash, created_by
  ) values (
    p_document_id, v_doc.project_id,
    coalesce((select max(version_number) + 1 from document_revisions where document_id = p_document_id), 1),
    p_content,
    case when btrim(p_content) = '' then 0 else array_length(regexp_split_to_array(btrim(p_content), '\s+'), 1) end,
    p_change_summary, p_revision_source, v_hash, v_user
  ) returning * into v_revision;
  return v_revision;
end $$;
