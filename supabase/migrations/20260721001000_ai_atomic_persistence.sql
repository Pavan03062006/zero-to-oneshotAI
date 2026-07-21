-- Service-only atomic persistence for already-authenticated, validated AI results.
create function public.persist_generation_result(
  p_job_id uuid, p_user_id uuid, p_project_id uuid, p_action text,
  p_raw jsonb, p_validated jsonb, p_model text,
  p_prompt_tokens integer default null, p_completion_tokens integer default null,
  p_total_tokens integer default null, p_latency_ms integer default 0
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_result jsonb:='{}'; v_document jsonb:=null; v_scan uuid; v_timeline uuid; v_item jsonb; v_id uuid;
begin
 if not public.has_project_role(p_project_id,p_user_id,array['owner','editor']::public.project_role[]) then raise exception using errcode='42501',message='Insufficient role'; end if;
 if not exists(select 1 from generation_jobs where id=p_job_id and user_id=p_user_id and project_id=p_project_id and action=p_action and status='running') then raise exception using errcode='23514',message='Invalid generation job'; end if;
 if p_action='generate_story_dna' then
   for v_item in select value from jsonb_array_elements(p_validated->'entities') loop insert into story_entities(project_id,entity_type,name,summary,attributes,canon_status,created_by) values(p_project_id,(v_item->>'entity_type')::entity_type,v_item->>'name',v_item->>'summary',coalesce(v_item->'attributes','{}'), 'proposed',p_user_id); end loop;
   select id into v_timeline from timelines where project_id=p_project_id and is_primary;
   for v_item in select value from jsonb_array_elements(p_validated->'events') loop insert into story_events(project_id,timeline_id,title,description,sequence_number,story_time,emotional_impact,canon_status,created_by) values(p_project_id,v_timeline,v_item->>'title',v_item->>'description',(v_item->>'sequence_order')::numeric,v_item->>'story_time',v_item->>'emotional_impact','proposed',p_user_id); end loop;
   insert into documents(project_id,document_type,title,status,order_index,current_content,word_count,created_by) values(p_project_id,'story_bible',p_validated#>>'{document,title}','draft',coalesce((select max(order_index)+1 from documents where project_id=p_project_id),0),p_validated#>>'{document,content}',array_length(regexp_split_to_array(trim(p_validated#>>'{document,content}'),'\s+'),1),p_user_id) returning id into v_id;
   v_document=jsonb_build_object('id',v_id,'title',p_validated#>>'{document,title}','status','draft');
   v_result=jsonb_build_object('logline',p_validated->>'logline','themes',p_validated->'themes','entities',(select coalesce(jsonb_agg(e),'[]') from story_entities e where e.project_id=p_project_id and e.created_by=p_user_id and e.created_at>=now()-interval '1 minute'),'events',p_validated->'events','document',v_document);
 elsif p_action='analyze_continuity' then
   v_scan := (p_validated->>'scan_id')::uuid;
   update continuity_scans set status='completed',score=(p_validated->>'score')::numeric,context_summary=coalesce(p_validated->'context_summary','{}'),model=p_model,completed_at=now()
     where id=v_scan and project_id=p_project_id and document_id=(p_validated->>'document_id')::uuid and created_by=p_user_id and status='running';
   if not found then raise exception using errcode='23514',message='Invalid running continuity scan'; end if;
   for v_item in select value from jsonb_array_elements(p_validated->'issues') loop insert into consistency_issues(scan_id,project_id,document_id,issue_type,severity,title,explanation,evidence,suggested_fix,confidence,status) values(v_scan,p_project_id,(p_validated->>'document_id')::uuid,v_item->>'issue_type',(v_item->>'severity')::issue_severity,v_item->>'title',v_item->>'explanation',v_item->'evidence',v_item->>'suggested_fix',(v_item->>'confidence')::numeric,'open'); end loop;
   v_result=jsonb_build_object('summary',p_validated->>'summary','score',p_validated->'score','scanId',v_scan,'issues',(select coalesce(jsonb_agg(i),'[]') from consistency_issues i where i.scan_id=v_scan));
 elsif p_action='generate_development_pack' then
   for v_item in select value from jsonb_array_elements(p_validated->'character_arcs') loop if not exists(select 1 from story_entities where project_id=p_project_id and entity_type='character' and lower(name)=lower(v_item->>'name')) then insert into story_entities(project_id,entity_type,name,summary,attributes,canon_status,created_by) values(p_project_id,'character',v_item->>'name',v_item->>'arc',v_item,'proposed',p_user_id); end if; end loop;
   select id into v_timeline from timelines where project_id=p_project_id and is_primary;
   for v_item in select value from jsonb_array_elements(p_validated->'beats') loop insert into story_events(project_id,timeline_id,title,description,sequence_number,canon_status,created_by) values(p_project_id,v_timeline,v_item->>'title',v_item->>'purpose',(v_item->>'sequence_order')::numeric,'proposed',p_user_id); end loop;
   insert into documents(project_id,document_type,title,status,order_index,current_content,word_count,created_by) values(p_project_id,case when p_validated->>'format'='movie' then 'treatment'::document_type else 'outline'::document_type end,p_validated#>>'{document,title}','draft',coalesce((select max(order_index)+1 from documents where project_id=p_project_id),0),p_validated#>>'{document,content}',array_length(regexp_split_to_array(trim(p_validated#>>'{document,content}'),'\s+'),1),p_user_id) returning id into v_id;
   v_document=jsonb_build_object('id',v_id,'title',p_validated#>>'{document,title}','status','draft');
   v_result=jsonb_build_object('suggestions',p_validated->'suggestions','character_arcs',p_validated->'character_arcs','beats',p_validated->'beats','document',v_document);
 else raise exception using errcode='22023',message='Unknown action'; end if;
 insert into generation_outputs(job_id,raw_response,validated_output,prompt_tokens,completion_tokens,total_tokens) values(p_job_id,p_raw,p_validated || jsonb_build_object('_result',v_result),p_prompt_tokens,p_completion_tokens,p_total_tokens);
 insert into ai_usage_logs(user_id,project_id,job_id,action,provider,model,prompt_tokens,completion_tokens,total_tokens,latency_ms,success) values(p_user_id,p_project_id,p_job_id,p_action,'openrouter',p_model,p_prompt_tokens,p_completion_tokens,p_total_tokens,p_latency_ms,true);
 update generation_jobs set status='completed',model=p_model,completed_at=now() where id=p_job_id;
 return v_result;
end $$;
revoke all on function public.persist_generation_result(uuid,uuid,uuid,text,jsonb,jsonb,text,integer,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.persist_generation_result(uuid,uuid,uuid,text,jsonb,jsonb,text,integer,integer,integer,integer) to service_role;
