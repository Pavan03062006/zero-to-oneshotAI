-- ONESHOT Phase 1: reproducible schema, authorization, and atomic operations.
create extension if not exists pgcrypto;

create type public.project_role as enum ('owner', 'editor', 'viewer');
create type public.project_status as enum ('active', 'archived');
create type public.project_format as enum ('novel', 'screenplay', 'series', 'short_story', 'other');
create type public.canon_strictness as enum ('flexible', 'balanced', 'strict');
create type public.canon_status as enum ('proposed', 'approved', 'rejected', 'superseded', 'alternate', 'archived');
create type public.entity_type as enum ('character', 'location', 'organization', 'object', 'world_rule', 'theme', 'plot_thread');
create type public.document_type as enum ('chapter', 'story_bible', 'outline', 'treatment', 'note');
create type public.document_status as enum ('draft', 'review', 'approved', 'published', 'archived');
create type public.revision_source as enum ('manual', 'checkpoint', 'autosave', 'ai_edit', 'restore', 'import');
create type public.scan_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');
create type public.issue_status as enum ('open', 'accepted', 'dismissed', 'fixed', 'false_positive');
create type public.issue_severity as enum ('critical', 'high', 'medium', 'low');
create type public.generation_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120), avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200), premise text not null default '' check (char_length(premise) <= 20000),
  logline text not null default '' check (char_length(logline) <= 1000), genre text check (char_length(genre) <= 100),
  format public.project_format not null default 'novel', tone text check (char_length(tone) <= 100), point_of_view text check (char_length(point_of_view) <= 100),
  canon_strictness public.canon_strictness not null default 'balanced', status public.project_status not null default 'active',
  cover_style text not null default 'violet' check (char_length(cover_style) <= 50), progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_members (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role public.project_role not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,user_id)
);
create table public.documents (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  document_type public.document_type not null default 'chapter', title text not null check (char_length(title) between 1 and 200),
  status public.document_status not null default 'draft', order_index integer not null default 0, current_content text not null default '',
  word_count integer not null default 0 check(word_count >= 0), created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.story_entities (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  entity_type public.entity_type not null, name text not null check(char_length(name) between 1 and 200), summary text check(char_length(summary) <= 5000),
  attributes jsonb not null default '{}'::jsonb check(jsonb_typeof(attributes)='object'), canon_status public.canon_status not null default 'proposed',
  source_document_id uuid references public.documents(id) on delete set null, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.timelines (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 200), description text not null default '' check(char_length(description)<=5000),
  is_primary boolean not null default false, parent_timeline_id uuid references public.timelines(id) on delete restrict, branch_point text check(char_length(branch_point)<=2000),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index timelines_one_primary_per_project on public.timelines(project_id) where is_primary;
create table public.story_events (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  timeline_id uuid not null references public.timelines(id) on delete cascade, title text not null check(char_length(title) between 1 and 200),
  description text check(char_length(description)<=5000), sequence_number numeric not null default 0, story_time text check(char_length(story_time)<=500),
  emotional_impact text check(char_length(emotional_impact)<=1000), canon_status public.canon_status not null default 'proposed',
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.entity_relationships (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  source_entity_id uuid not null references public.story_entities(id) on delete cascade, target_entity_id uuid not null references public.story_entities(id) on delete cascade,
  relationship_type text not null check(char_length(relationship_type) between 1 and 100), description text check(char_length(description)<=5000),
  canon_status public.canon_status not null default 'proposed', start_event_id uuid references public.story_events(id) on delete set null,
  end_event_id uuid references public.story_events(id) on delete set null, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(source_entity_id<>target_entity_id)
);
create table public.document_revisions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, version_number integer not null check(version_number>0), content text not null,
  word_count integer not null default 0 check(word_count>=0), change_summary text check(char_length(change_summary)<=500),
  revision_source public.revision_source not null default 'autosave', content_hash text not null,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), unique(document_id,version_number), unique(document_id,content_hash)
);
create table public.continuity_scans (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade, document_revision_id uuid references public.document_revisions(id) on delete set null,
  status public.scan_status not null default 'queued', score numeric check(score between 0 and 100), context_summary jsonb not null default '{}'::jsonb,
  model text, input_hash text not null, created_by uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), unique(created_by,project_id,document_id,input_hash)
);
create table public.consistency_issues (
  id uuid primary key default gen_random_uuid(), scan_id uuid references public.continuity_scans(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, document_id uuid references public.documents(id) on delete cascade,
  issue_type text not null check(issue_type in ('contradiction','timeline','character_voice','world_rule','unresolved_thread')),
  severity public.issue_severity not null, title text not null check(char_length(title) between 1 and 200), explanation text check(char_length(explanation)<=5000),
  evidence jsonb not null default '[]'::jsonb check(jsonb_typeof(evidence)='array'), suggested_fix text check(char_length(suggested_fix)<=5000),
  confidence numeric check(confidence between 0 and 1), status public.issue_status not null default 'open', resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, action text not null check(action in ('generate_story_dna','analyze_continuity','generate_development_pack')),
  status public.generation_status not null default 'queued', idempotency_key text not null, input_hash text not null, model text,
  error_code text, error_message text, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(),
  unique(user_id,project_id,action,idempotency_key)
);
create table public.generation_outputs (
  id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.generation_jobs(id) on delete cascade,
  raw_response jsonb not null, validated_output jsonb not null, prompt_tokens integer, completion_tokens integer, total_tokens integer,
  estimated_cost numeric, created_at timestamptz not null default now()
);
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, job_id uuid references public.generation_jobs(id) on delete set null,
  action text not null, provider text not null, model text not null, prompt_tokens integer, completion_tokens integer, total_tokens integer,
  latency_ms integer not null check(latency_ms>=0), success boolean not null, error_code text, created_at timestamptz not null default now()
);

create index projects_owner_idx on public.projects(owner_id); create index members_user_idx on public.project_members(user_id);
create index entities_project_idx on public.story_entities(project_id); create index entities_project_type_idx on public.story_entities(project_id,entity_type);
create index entities_project_canon_idx on public.story_entities(project_id,canon_status); create index entities_name_lower_idx on public.story_entities(project_id,lower(name));
create index documents_project_order_idx on public.documents(project_id,order_index); create index events_project_timeline_idx on public.story_events(project_id,timeline_id,sequence_number);
create index revisions_document_idx on public.document_revisions(document_id,version_number desc); create index issues_project_status_idx on public.consistency_issues(project_id,status);
create index jobs_rate_idx on public.generation_jobs(user_id,project_id,action,created_at desc); create index usage_user_idx on public.ai_usage_logs(user_id,created_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','projects','project_members','story_entities','entity_relationships','timelines','story_events','documents','consistency_issues'] loop execute format('create trigger %I_updated before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;

create function public.is_project_member(p_project_id uuid,p_user_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.project_members where project_id=p_project_id and user_id=p_user_id) $$;
create function public.has_project_role(p_project_id uuid,p_user_id uuid,p_roles public.project_role[]) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.project_members where project_id=p_project_id and user_id=p_user_id and role=any(p_roles)) $$;
create function public.owns_project(p_project_id uuid,p_user_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.projects where id=p_project_id and owner_id=p_user_id) $$;
revoke all on function public.is_project_member(uuid,uuid),public.has_project_role(uuid,uuid,public.project_role[]),public.owns_project(uuid,uuid) from public;
grant execute on function public.is_project_member(uuid,uuid),public.has_project_role(uuid,uuid,public.project_role[]),public.owns_project(uuid,uuid) to authenticated,service_role;

create function public.validate_same_project() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_table_name='timelines' and new.parent_timeline_id is not null and not exists(select 1 from timelines where id=new.parent_timeline_id and project_id=new.project_id) then raise exception using errcode='23514',message='Parent timeline must belong to project'; end if;
 if tg_table_name='story_events' and not exists(select 1 from timelines where id=new.timeline_id and project_id=new.project_id) then raise exception using errcode='23514',message='Timeline must belong to project'; end if;
 if tg_table_name='entity_relationships' and (not exists(select 1 from story_entities where id=new.source_entity_id and project_id=new.project_id) or not exists(select 1 from story_entities where id=new.target_entity_id and project_id=new.project_id)) then raise exception using errcode='23514',message='Entities must belong to project'; end if;
 return new;
end $$;
create trigger timelines_same_project before insert or update on public.timelines for each row execute function public.validate_same_project();
create trigger events_same_project before insert or update on public.story_events for each row execute function public.validate_same_project();
create trigger relationships_same_project before insert or update on public.entity_relationships for each row execute function public.validate_same_project();

create function public.protect_project_ownership() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin
 if new.owner_id<>old.owner_id then raise exception using errcode='42501',message='Project ownership cannot be changed directly'; end if;
 if new.status='archived' and old.status<>'archived' and not owns_project(old.id,auth.uid()) then raise exception using errcode='42501',message='Only the owner can archive a project'; end if;
 return new;
end $$;
create trigger projects_protect_owner before update on public.projects for each row execute function public.protect_project_ownership();
create function public.protect_owner_membership() returns trigger language plpgsql set search_path=public,pg_temp as $$ declare v_owner uuid; begin
 select owner_id into v_owner from projects where id=coalesce(new.project_id,old.project_id);
 if (tg_op='DELETE' and old.user_id=v_owner) or (tg_op='UPDATE' and old.user_id=v_owner and (new.user_id<>old.user_id or new.role<>'owner')) then raise exception using errcode='42501',message='Project owner membership is protected'; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
create trigger members_protect_owner before update or delete on public.project_members for each row execute function public.protect_owner_membership();

create function public.bootstrap_project(p_title text,p_premise text default '',p_logline text default '',p_genre text default null,p_format public.project_format default 'novel',p_tone text default null,p_point_of_view text default null,p_canon_strictness public.canon_strictness default 'balanced',p_cover_style text default 'violet') returns public.projects
language plpgsql security definer set search_path=public,pg_temp as $$ declare v_user uuid:=auth.uid(); v_project projects; begin
 if v_user is null then raise exception using errcode='42501',message='Unauthenticated'; end if;
 insert into projects(owner_id,title,premise,logline,genre,format,tone,point_of_view,canon_strictness,cover_style) values(v_user,p_title,p_premise,p_logline,p_genre,p_format,p_tone,p_point_of_view,p_canon_strictness,p_cover_style) returning * into v_project;
 insert into project_members(project_id,user_id,role) values(v_project.id,v_user,'owner');
 insert into timelines(project_id,name,description,is_primary,created_by) values(v_project.id,'Primary timeline','Primary canon timeline.',true,v_user);
 return v_project;
end $$;
revoke all on function public.bootstrap_project(text,text,text,text,public.project_format,text,text,public.canon_strictness,text) from public;
grant execute on function public.bootstrap_project(text,text,text,text,public.project_format,text,text,public.canon_strictness,text) to authenticated;

create function public.save_document_revision(p_document_id uuid,p_content text,p_change_summary text default null,p_revision_source public.revision_source default 'autosave') returns public.document_revisions
language plpgsql security definer set search_path=public,pg_temp as $$ declare v_user uuid:=auth.uid(); v_doc documents; v_hash text; v_revision document_revisions; begin
 select * into v_doc from documents where id=p_document_id for update; if not found then raise exception using errcode='P0002',message='Document not found'; end if;
 if not has_project_role(v_doc.project_id,v_user,array['owner','editor']::project_role[]) then raise exception using errcode='42501',message='Insufficient role'; end if;
 v_hash:=encode(digest(p_content,'sha256'),'hex'); select * into v_revision from document_revisions where document_id=p_document_id and content_hash=v_hash; if found then return v_revision; end if;
 insert into document_revisions(document_id,project_id,version_number,content,word_count,change_summary,revision_source,content_hash,created_by)
 values(p_document_id,v_doc.project_id,coalesce((select max(version_number)+1 from document_revisions where document_id=p_document_id),1),p_content,array_length(regexp_split_to_array(trim(p_content),'\s+'),1),p_change_summary,p_revision_source,v_hash,v_user) returning * into v_revision; return v_revision;
end $$;
revoke all on function public.save_document_revision(uuid,text,text,public.revision_source) from public; grant execute on function public.save_document_revision(uuid,text,text,public.revision_source) to authenticated;

alter table public.profiles enable row level security; alter table public.projects enable row level security; alter table public.project_members enable row level security;
alter table public.story_entities enable row level security; alter table public.entity_relationships enable row level security; alter table public.timelines enable row level security;
alter table public.story_events enable row level security; alter table public.documents enable row level security; alter table public.document_revisions enable row level security;
alter table public.continuity_scans enable row level security; alter table public.consistency_issues enable row level security; alter table public.generation_jobs enable row level security;
alter table public.generation_outputs enable row level security; alter table public.ai_usage_logs enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid()); create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy projects_read on public.projects for select to authenticated using(is_project_member(id,auth.uid()));
create policy projects_update on public.projects for update to authenticated using(has_project_role(id,auth.uid(),array['owner','editor']::project_role[])) with check(has_project_role(id,auth.uid(),array['owner','editor']::project_role[]));
create policy projects_delete on public.projects for delete to authenticated using(owns_project(id,auth.uid()));
create policy members_read on public.project_members for select to authenticated using(is_project_member(project_id,auth.uid()));
create policy members_owner_write on public.project_members for all to authenticated using(owns_project(project_id,auth.uid()) and not(user_id=(select owner_id from projects where id=project_id) and role<>'owner')) with check(owns_project(project_id,auth.uid()) and not(user_id=(select owner_id from projects where id=project_id) and role<>'owner'));
do $$ declare t text; begin foreach t in array array['story_entities','entity_relationships','timelines','story_events','documents','document_revisions','continuity_scans','consistency_issues'] loop
 execute format('create policy %I_read on public.%I for select to authenticated using(public.is_project_member(project_id,auth.uid()))',t,t);
 execute format('create policy %I_write on public.%I for all to authenticated using(public.has_project_role(project_id,auth.uid(),array[''owner'',''editor'']::public.project_role[])) with check(public.has_project_role(project_id,auth.uid(),array[''owner'',''editor'']::public.project_role[]))',t,t);
end loop; end $$;
create policy jobs_read on public.generation_jobs for select to authenticated using(user_id=auth.uid() and is_project_member(project_id,auth.uid()));
create policy outputs_read on public.generation_outputs for select to authenticated using(exists(select 1 from generation_jobs j where j.id=job_id and j.user_id=auth.uid() and is_project_member(j.project_id,auth.uid())));
create policy usage_read on public.ai_usage_logs for select to authenticated using(user_id=auth.uid() and is_project_member(project_id,auth.uid()));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin insert into profiles(id,display_name) values(new.id,new.raw_user_meta_data->>'display_name') on conflict do nothing; return new; end $$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.handle_new_user();
