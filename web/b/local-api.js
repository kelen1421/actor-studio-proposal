'use strict';
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-accept-task]');if(b){ev.preventDefault();LocalApp.acceptTask(b.dataset.acceptTask)}});
window.LocalApp=(()=>{
 let bootstrapData, bindings, traceTarget, traceItems=[], editItem=null, activeHistory=null;
 const roles={artist:'明星',admin:'团队管理员',member:'团队成员'};
 const labels={project:'项目',task:'任务',event:'日程',travel:'差旅接送',contact:'现场联络',preparation:'准备事项',expense:'费用',belonging:'物品交接',request:'日程申请'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=s=>new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 async function api(path,{method='GET',body}={}){const res=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRF-Token':bootstrapData?.csrf||''}:{})},...(body?{body:JSON.stringify(body)}:{})});let data;try{data=await res.json();}catch{throw Error('演示数据暂时无法读取，请刷新。');}if(!res.ok){if(res.status===401||res.status===428){location.reload();}const error=Error(data.error||'操作未完成。');error.status=res.status;throw error;}return data;}
 async function boot(){bootstrapData=await api('/api/bootstrap');return bootstrapData;}
 function accept(value){bootstrapData=value;return value;}
 async function save(state,revision){const result=await api('/api/workspace',{method:'PUT',body:{state,revision}});return accept(result);}
 function count(kind,id){return bootstrapData?.evidence_counts?.[kind+':'+id]||0;}
 function traceButton(kind,id,title){return `<button type="button" class="trace-button" data-trace-kind="${kind}" data-trace-id="${esc(id)}" data-trace-title="${esc(title||labels[kind])}" title="文字与图片留痕">留痕${count(kind,id)?' · '+count(kind,id):''}</button>`;}
 function decorate(){
  const map={travel:'travel',contacts:'contact',preparations:'preparation',expenses:'expense',belongings:'belonging'};
  document.querySelectorAll('[data-action="project-detail"],[data-action="event-detail"],[data-action="request-detail"],[data-action="edit-record"]').forEach(el=>{
   if(el.dataset.traceInstalled)return;el.dataset.traceInstalled='1';const action=el.dataset.action,id=el.dataset.id;if(!id)return;
   const kind=action==='project-detail'?'project':action==='event-detail'?'event':action==='request-detail'?'request':map[el.dataset.kind];
   if(!kind)return;el.insertAdjacentHTML('afterend',traceButton(kind,id,el.closest('article')?.querySelector('h3')?.textContent||labels[kind]));
  });
  document.querySelectorAll('input[data-prep],input[data-task]').forEach(input=>{
   if(input.dataset.traceInstalled)return;input.dataset.traceInstalled='1';const label=input.closest('label'),kind=input.dataset.prep?'preparation':'task',id=input.dataset.prep||input.dataset.task;
   const wrapper=document.createElement('div');wrapper.className='trace-inline';label.parentNode.insertBefore(wrapper,label);wrapper.append(label);wrapper.insertAdjacentHTML('beforeend',traceButton(kind,id,label.querySelector('strong,span')?.textContent||labels[kind]));
  });
  const user=bootstrapData?.user;if(!user)return;
  document.querySelectorAll('input[data-task]').forEach(input=>{const t=bindings.getState().projects.flatMap(p=>p.tasks||[]).find(t=>t.id===input.dataset.task);if(t?.origin==='artist'&&!t.acceptedAt){input.disabled=true;const label=input.closest('label');if(!label.parentElement.querySelector('[data-accept-task]')&&(!t.assigneeId||t.assigneeId===user.id)&&user.role!=='artist')label.insertAdjacentHTML('afterend',`<button class="btn small" data-local-action="accept-task" data-accept-task="${esc(t.id)}">接受任务</button>`);}});
  if(user.role==='artist'){
   document.querySelectorAll('[data-action="new-project"],[data-action="new-record"],[data-action="edit-record"],[data-action="save-project"],[data-action="save-record"],[data-action="add-task"],[data-action="save-task"],[data-action="event-detail"]').forEach(b=>{b.disabled=true;b.title='明星账号可审批日程与编辑留痕，后勤执行由团队处理';});
   document.querySelectorAll('input[data-prep],input[data-task],#project-form input,#project-form textarea,#project-form select,#record-form input,#record-form select,#record-form textarea').forEach(i=>i.disabled=true);
  }
  document.querySelectorAll('[data-action="withdraw"]').forEach(el=>{const r=bindings.getState().requests.find(r=>r.id===el.dataset.id);if(r?.created_by!==user.id)el.hidden=true;});
  if(!document.querySelector('#local-account-button')&&document.querySelector('.topbar>.row')){
   document.querySelector('.topbar>.row').insertAdjacentHTML('beforeend',`<button id="local-account-button" class="account-pill" data-local-action="account">${esc(user.display_name)}</button>`);
  }
  const side=document.querySelector('.sidebar .user');if(side)side.innerHTML=`<span class="avatar">${esc(user.username.toUpperCase())}</span><div class="grow"><strong>${esc(user.display_name)}</strong><small>${roles[user.role]} · 演示账号</small></div>`;
  const chip=document.querySelector('.prototype');if(chip)chip.textContent='同一浏览器内协作 · 演示';
  if(user.role!=='artist'){
   document.querySelectorAll('input[data-task],input[data-prep]').forEach(input=>{const pid=input.dataset.project||bindings.getState().events.find(e=>e.id===bindings.getState().preparations.find(t=>t.id===input.dataset.prep)?.eventId)?.projectId;if(!bootstrapData.project_grants?.[pid]?.includes('execute'))input.disabled=true});
   document.querySelectorAll('[data-action="new-project"]').forEach(b=>b.disabled=!bootstrapData.can_create_projects);
   document.querySelectorAll('[data-action="event-detail"]').forEach(b=>{const e=bindings.getState().events.find(e=>e.id===b.dataset.id);if(e&&!bootstrapData.project_grants?.[e.projectId]?.includes('plan')){b.disabled=true;b.title='此项目未授予日程申请权限';}});
  }
  document.querySelectorAll('[data-action="edit-record"],input[data-prep],input[data-task]').forEach(el=>{
   const id=el.dataset.id||el.dataset.prep||el.dataset.task,s=bindings.getState(),all=[...s.travel,...s.preparations,...s.contacts,...s.belongings,...s.projects.flatMap(p=>p.tasks||[])],item=all.find(x=>x.id===id);
   if(item?.needsReview&&!el.parentElement.querySelector('.ab-review-needed'))el.insertAdjacentHTML('afterend','<small class="ab-review-needed">⚠ 日程已变更 · 准备需复核</small>');
  });
  const avatar=document.querySelector('.topbar .avatar');if(avatar)avatar.textContent=user.username.toUpperCase();
 }
 function targetName(kind,id){const s=bindings.getState(),maps={project:'projects',event:'events',travel:'travel',contact:'contacts',preparation:'preparations',expense:'expenses',belonging:'belongings',request:'requests'};if(kind==='task')return s.projects.flatMap(p=>p.tasks).find(t=>t.id===id)?.title||'任务';const t=s[maps[kind]]?.find(t=>t.id===id);return t?.title||t?.name||t?.before?.title||labels[kind];}
 async function openTrace(kind,id){traceTarget={kind,id,title:targetName(kind,id)};editItem=null;traceItems=(await api(`/api/evidence?target_type=${encodeURIComponent(kind)}&target_id=${encodeURIComponent(id)}`)).items;showTrace();}
 function showTrace(error=''){
  const target=traceTarget,item=editItem;
  bindings.drawer(`${labels[target.kind]}留痕`,target.title,`<div class="trace-policy">仅提交本人、团队管理员及明星可编辑。每次修改保留历史版本。</div><form id="trace-form"><label class="field"><span>${item?'修改留痕说明':'留痕说明'}</span><textarea id="trace-caption" maxlength="4000" placeholder="记录完成情况、核对依据或现场说明">${esc(item?.caption||'')}</textarea></label><label class="trace-upload"><span>${item?'选择替换图片（可选）':'选择图片（可多张）'}</span><input id="trace-files" type="file" accept="image/jpeg,image/png,image/webp" ${item?'':'multiple'}><small>JPG / PNG / WebP，每张最多 8 MB，一次最多 6 张；也可只提交文字。</small></label><div id="trace-file-names" class="muted" style="font-size:10px;margin:9px 0"></div><div id="trace-error" class="form-error">${esc(error)}</div><div class="row">${item?'<button type="button" class="btn small" data-local-action="cancel-edit">取消编辑</button>':''}<button type="submit" class="btn primary" id="trace-submit">${item?'保存新版本':'提交留痕'}</button></div></form><hr class="rule-divider"><div class="row between mb"><h3>已提交记录 · ${traceItems.length}</h3><span class="muted" style="font-size:9px">浏览器保存</span></div><div class="trace-list">${traceItems.map(e=>`<article class="trace-card">${e.url?`<button class="trace-image-button" data-local-action="preview" data-id="${e.id}"><img src="${e.url}?v=${e.revision}" alt="${esc(e.file_name||'留痕图片')}" loading="lazy"></button>`:''}<div class="trace-card-body"><div class="row between"><strong>${esc(e.author)}</strong><span class="badge blue">v${e.revision}</span></div>${e.caption?`<p class="trace-caption">${esc(e.caption)}</p>`:''}<small>提交于 ${time(e.created_at)}</small>${e.revision>1?`<small>修改：${esc(e.editor)} · ${time(e.updated_at)}</small>`:''}<div class="row between mt" style="margin-top:12px"><button class="text-btn" data-local-action="history" data-id="${e.id}">修改历史</button>${e.can_edit?`<button class="text-btn" data-local-action="edit-evidence" data-id="${e.id}">编辑留痕</button>`:'<span class="muted" style="font-size:9px">仅可查看</span>'}</div></div></article>`).join('')||'<div class="empty">暂无留痕，可先提交说明或图片。</div>'}</div>`,`<button class="btn" data-action="close">关闭</button>`);
 }
 async function upload(form){const caption=document.querySelector('#trace-caption').value.trim(),files=[...document.querySelector('#trace-files').files];if(!caption&&!files.length&&!editItem?.url)throw Error('请填写说明或选择图片。');if(files.length>6)throw Error('一次最多选择 6 张图片。');if(files.some(f=>f.size>8*1024*1024))throw Error('每张图片最多 8 MB。');const button=document.querySelector('#trace-submit');button.disabled=true;button.textContent='正在保存…';let done=0;
  try{
   const batch=files.length?files:[null];
   for(const file of batch){let data_base64;if(file){await new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{URL.revokeObjectURL(url);resolve();};image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('无法读取图片：'+file.name));};image.src=url;});data_base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});}
    await api(editItem?'/api/evidence/'+editItem.id:'/api/evidence',{method:editItem?'PUT':'POST',body:{target_type:traceTarget.kind,target_id:traceTarget.id,caption,...(file?{data_base64,file_name:file.name}:{}),...(editItem?{base_revision:editItem.revision}:{})}});done++;button.textContent=`已保存 ${done}/${batch.length}…`;
   }
   const wasEditing=Boolean(editItem),result=await boot();bindings.accept(result);bindings.render();await openTrace(traceTarget.kind,traceTarget.id);bindings.toast(wasEditing?'已保存新版本':'留痕已保存到当前浏览器');
  }catch(error){const box=document.querySelector('#trace-error');if(box)box.textContent=(done?'已有 '+done+' 条保存成功；':'')+error.message;button.disabled=false;button.textContent=editItem?'保存新版本':'提交留痕';}
 }
 async function account(){const u=bootstrapData.user;bindings.modal('演示账号',u.display_name,`<div class="data-tile"><strong>账号 ${esc(u.username)} · ${roles[u.role]}</strong><p>演示账号与共享团队工作区。留痕编辑权限按提交者和角色核验。</p></div><div class="row mt"><button class="btn" data-local-action="change-password">修改密码</button><button class="btn danger" data-local-action="logout">退出登录</button></div>`, '<button class="btn" data-action="close">关闭</button>');}
 async function teamAccounts(){
  if(bootstrapData.user.role!=='admin')return;
  const items=(await api('/api/users')).items;
  const host=document.querySelector('#live-account-list');if(!host)return;
  host.innerHTML=`<section class="panel mt"><div class="panel-head"><h2>演示账号</h2><span class="muted" style="font-size:10px">初始 3 个账号 · 固定角色</span></div><div class="panel-body">${items.map(u=>`<div class="local-user-row"><div class="grow"><strong>${esc(u.display_name)}</strong><p>账号 ${esc(u.username)} · ${roles[u.role]}${u.must_change?' · 待修改初始密码':''}</p></div>${u.role==='member'?`<button class="btn small" data-local-action="reset-member" data-id="${u.id}">重置临时密码</button>`:'<span class="muted" style="font-size:9px">自行修改密码</span>'}</div>`).join('')}</div></section>`;
 }
 async function acceptTask(id){try{const data=await api('/api/tasks/'+id+'/accept',{method:'POST',body:{}});accept(data);bindings.accept(data);bindings.close?.();bindings.render();bindings.toast('已接受任务，可在项目中更新完成状态')}catch(x){bindings.toast(x.message)}}
 async function decision(id,approve){const reason=document.querySelector('#decision-reason')?.value||'',keep=document.querySelector('#keep-conflict')?.checked||false,r=bindings.getState().requests.find(r=>r.id===id);try{const data=await api('/api/requests/'+id+'/decide',{method:'POST',body:{decision:approve?'approve':'reject',reason,keep_conflict:keep,conflicts:r.conflicts||[]}});accept(data);bindings.accept(data);bindings.render();bindings.requestDetail(id);bindings.toast(approve?'批准已生效，正式日程已更新':'已驳回，正式日程保持原样');}catch(e){const el=document.querySelector('#form-error');if(el)el.textContent=e.message;else bindings.toast(e.message);}}
 document.addEventListener('submit',e=>{if(e.target.id==='trace-form'){e.preventDefault();upload(e.target).catch(err=>bindings.toast(err.message));}if(e.target.id==='change-password-form'){e.preventDefault();(async()=>{const v=Object.fromEntries(new FormData(e.target));if(v.new!==v.confirm)throw Error('两次新密码不一致。');await api('/api/password',{method:'POST',body:{old_password:v.old,new_password:v.new}});location.reload();})().catch(err=>document.querySelector('#password-error').textContent=err.message);}});
 document.addEventListener('change',e=>{if(e.target.id==='trace-files')document.querySelector('#trace-file-names').textContent=[...e.target.files].map(f=>f.name).join('、');});
 document.addEventListener('click',e=>{const target=e.target.closest('[data-trace-kind]');if(target){e.preventDefault();openTrace(target.dataset.traceKind,target.dataset.traceId).catch(err=>bindings.toast(err.message));return;}const b=e.target.closest('[data-local-action]');if(!b)return;e.preventDefault();(async()=>{const a=b.dataset.localAction,id=b.dataset.id;if(a==='account')return account();if(a==='ack-update'){const result=await api('/api/updates/'+id+'/ack',{method:'POST',body:{}});accept(result);bindings.accept(result);bindings.close();bindings.render();bindings.toast('已确认知悉当前版本');return;}if(a==='logout'){await api('/api/logout',{method:'POST',body:{}});location.reload();}if(a==='edit-evidence'){editItem=traceItems.find(x=>x.id===id);if(editItem?.can_edit)showTrace();}if(a==='cancel-edit'){editItem=null;showTrace();}if(a==='preview'){const item=traceItems.find(x=>x.id===id);bindings.modal('留痕图片',item.file_name||'',`<img class="trace-full-image" src="${item.url}?v=${item.revision}" alt="留痕图片"><p class="trace-caption">${esc(item.caption)}</p>`,`<button class="btn" data-local-action="return-trace">返回记录</button>`);}if(a==='return-trace')showTrace();if(a==='history'){activeHistory=id;const result=await api('/api/evidence/'+id+'/history');bindings.drawer('留痕修改历史','每次编辑保留作者、时间和版本。',result.items.map(v=>`<article class="trace-version"><div class="row between"><strong>v${v.revision}</strong><span>${esc(v.actor)}</span></div><small>${time(v.at)}</small>${v.url?`<img src="${v.url}" alt="历史图片">`:''}<p class="trace-caption">${esc(v.caption)}</p></article>`).join(''),'<button class="btn" data-local-action="return-trace">返回记录</button>');}if(a==='change-password'){bindings.modal('修改密码','修改后，当前账号的所有登录会话将失效。',`<form id="change-password-form"><label class="field"><span>当前密码</span><input type="password" name="old" autocomplete="current-password" required></label><label class="field"><span>新密码（至少 12 位）</span><input type="password" name="new" autocomplete="new-password" minlength="12" maxlength="256" required></label><label class="field"><span>再次输入新密码</span><input type="password" name="confirm" autocomplete="new-password" minlength="12" required></label><div id="password-error" class="form-error"></div><button class="btn primary" type="submit">保存新密码</button></form>`, '<button class="btn" data-action="close">取消</button>');}if(a==='reset-member'){const result=await api('/api/users/'+id+'/reset',{method:'POST',body:{}});bindings.modal('成员临时密码已重置','成员下次登录必须修改密码。',`<p class="muted">账号 ${esc(result.username)}</p><code class="temporary-secret">${esc(result.temporary_password)}</code><p class="muted" style="font-size:10px">请单独交给该成员，关闭后不再显示。</p>`, '<button class="btn" data-action="close">关闭</button>');}})().catch(err=>bindings.toast(err.message));});
 let polling=false;
 setInterval(async()=>{
  if(polling||!bindings||document.hidden||document.querySelector('#overlay')?.childElementCount||document.body.classList.contains('is-saving')||document.activeElement?.matches('input,select,textarea'))return;
  polling=true;
  try{
   let fresh=await api('/api/bootstrap');const oldRevision=bootstrapData?.revision;
   if(fresh.user.role!=='artist')for(const item of fresh.state.syncs||[]){const mine=item.receipts?.find(r=>r.user_id===fresh.user.id);if(mine&&!mine.received_at)fresh=await api('/api/updates/'+item.id+'/received',{method:'POST',body:{}});}
   if(fresh.revision!==oldRevision){accept(fresh);bindings.accept(fresh);bindings.render();}
  }catch(e){const chip=document.querySelector('.prototype');if(chip)chip.textContent='同步暂不可用 · 点击刷新重试';}
  finally{polling=false;}
 },5000);
 return {acceptTask,boot,api,save,accept,decorate,traceButton,teamAccounts,decision,account,bind:x=>{bindings=x;},user:()=>bootstrapData?.user,roles};
})();
