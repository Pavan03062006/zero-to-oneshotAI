begin;
select plan(30);

insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000001','owner@test.local'),
 ('00000000-0000-0000-0000-000000000002','editor@test.local'),
 ('00000000-0000-0000-0000-000000000003','viewer@test.local'),
 ('00000000-0000-0000-0000-000000000004','outsider@test.local');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.bootstrap_project('RLS Project','Premise','Logline','Fantasy','novel','Hopeful','Third limited','strict','violet')$$,'owner bootstraps project');
select is((select count(*)::integer from projects where title='RLS Project'),1,'owner reads project');
select is((select count(*)::integer from project_members where project_id=(select id from projects where title='RLS Project') and role='owner'),1,'bootstrap creates owner membership');
select is((select count(*)::integer from timelines where project_id=(select id from projects where title='RLS Project') and is_primary),1,'bootstrap creates primary timeline');
select throws_ok($$insert into timelines(project_id,name,description,is_primary) values((select id from projects where title='RLS Project'),'Second primary','',true)$$,'23505',null,'second primary timeline rejected');
insert into project_members(project_id,user_id,role) select id,'00000000-0000-0000-0000-000000000002','editor' from projects where title='RLS Project';
insert into project_members(project_id,user_id,role) select id,'00000000-0000-0000-0000-000000000003','viewer' from projects where title='RLS Project';
insert into documents(project_id,title,created_by) select id,'Chapter 1','00000000-0000-0000-0000-000000000001' from projects where title='RLS Project';
select lives_ok($$update projects set tone='Bright' where title='RLS Project'$$,'owner updates project');
select throws_ok($$delete from project_members where user_id='00000000-0000-0000-0000-000000000001'$$,'42501','Project owner membership is protected','owner membership cannot be removed');
select throws_ok($$update project_members set role='viewer' where user_id='00000000-0000-0000-0000-000000000001'$$,'42501','Project owner membership is protected','owner membership cannot be demoted');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select is((select count(*)::integer from projects where title='RLS Project'),1,'editor reads project');
select lives_ok($$update projects set tone='Dark' where title='RLS Project'$$,'editor updates permitted project field');
select lives_ok($$insert into story_entities(project_id,entity_type,name,created_by) select id,'character','Editor Character','00000000-0000-0000-0000-000000000002' from projects where title='RLS Project'$$,'editor inserts content');
select throws_ok($$update projects set status='archived' where title='RLS Project'$$,'42501','Only the owner can archive a project','editor cannot archive project');
select throws_ok($$update projects set owner_id='00000000-0000-0000-0000-000000000002' where title='RLS Project'$$,'42501','Project ownership cannot be changed directly','editor cannot transfer ownership');
select throws_ok($$insert into project_members(project_id,user_id,role) select id,'00000000-0000-0000-0000-000000000004','viewer' from projects where title='RLS Project'$$,'42501',null,'editor cannot manage members');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is((select count(*)::integer from projects where title='RLS Project'),1,'viewer reads project');
select is((select count(*)::integer from documents where title='Chapter 1'),1,'viewer reads document');
select throws_ok($$insert into story_entities(project_id,entity_type,name) select id,'character','Viewer Character' from projects where title='RLS Project'$$,'42501',null,'viewer cannot insert content');
select results_eq($$update documents set title='Changed' where title='Chapter 1' returning 1$$,$$select 1 where false$$,'viewer cannot update content');
select results_eq($$delete from documents where title='Chapter 1' returning 1$$,$$select 1 where false$$,'viewer cannot delete content');
select results_eq($$update project_members set role='owner' where user_id='00000000-0000-0000-0000-000000000003' returning 1$$,$$select 1 where false$$,'viewer cannot promote self');
select throws_ok($$insert into ai_usage_logs(user_id,project_id,action,provider,model,latency_ms,success) select '00000000-0000-0000-0000-000000000003',id,'generate_story_dna','fake','fake',0,true from projects where title='RLS Project'$$,'42501',null,'viewer cannot forge usage');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select is((select count(*)::integer from projects where title='RLS Project'),0,'outsider cannot read project');
select is((select count(*)::integer from documents where title='Chapter 1'),0,'outsider cannot read document');
select is((select count(*)::integer from generation_jobs),0,'outsider cannot read jobs');
select results_eq($$update documents set title='Guessed' where id='11111111-1111-1111-1111-111111111111' returning 1$$,$$select 1 where false$$,'outsider cannot mutate guessed document');

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select lives_ok($$select public.save_document_revision((select id from documents where title='Chapter 1'),'first content','first','autosave')$$,'first revision succeeds');
select lives_ok($$select public.save_document_revision((select id from documents where title='Chapter 1'),'first content','duplicate','autosave')$$,'identical revision returns existing row');
select is((select count(*)::integer from document_revisions),1,'identical revision is deduplicated');
select lives_ok($$select public.save_document_revision((select id from documents where title='Chapter 1'),'second content','second','checkpoint')$$,'changed revision succeeds');
select results_eq($$select version_number from document_revisions order by version_number$$,$$select * from (values(1),(2)) as expected(version_number)$$,'revision versions are monotonic');

select * from finish();
rollback;
