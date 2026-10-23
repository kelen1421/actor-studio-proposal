/* Local prototype rules. Production authorization and transactions belong on the server. */
(function (root) {
  'use strict';
  const copy = o => JSON.parse(JSON.stringify(o));
  const uid = () => globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2);
  function conflicts(events, proposal, id) {
    return events.filter(e => e.id !== id && e.status !== '已取消' && e.members.some(m => proposal.members.includes(m)) && e.start < proposal.end && proposal.start < e.end)
      .map(e => ({id:e.id, title:e.title, start:e.start, end:e.end, members:e.members.filter(m=>proposal.members.includes(m)), minutes:Math.round((Math.min(Date.parse(e.end),Date.parse(proposal.end))-Math.max(Date.parse(e.start),Date.parse(proposal.start)))/60000)}));
  }
  const signature = list => JSON.stringify(list.map(e=>[e.id,e.start,e.end,e.minutes,e.members.slice().sort()]).sort());
  function submit(state, id, proposal, reason, note, key) {
    if (state.requests.some(r=>r.key===key)) return state.requests.find(r=>r.key===key);
    const event=state.events.find(e=>e.id===id);
    if(!event) throw Error('目标日程不存在');
    if(!proposal.start||!proposal.end||Date.parse(proposal.start)>=Date.parse(proposal.end))throw Error('结束时间必须晚于开始时间');
    if(!reason.trim())throw Error('请填写发起理由');
    const request={id:uid(),key,eventId:id,base_revision:event.revision,before:copy(event),after:{...copy(event),...copy(proposal)},reason,note,status:'待审批',created_at:new Date().toISOString(),comments:[],decision:null,conflicts:conflicts(state.events,{...event,...proposal},id)};
    state.requests.unshift(request);return request;
  }
  function receive(state, id, result, options={}) {
    const r=state.requests.find(x=>x.id===id);if(!r)throw Error('申请不存在');
    if(r.status!=='待审批')throw Error('当前申请不可审批');
    const e=state.events.find(x=>x.id===r.eventId);
    if(!e||e.revision!==r.base_revision){r.status='待更新';throw Error('正式日程已变化，旧申请不可覆盖，请基于最新版重新提交');}
    if(result==='驳回'){r.status='已驳回';r.decision={result,reason:options.reason||'请重新协调时间',at:new Date().toISOString()};return r;}
    const latest=conflicts(state.events,r.after,e.id);
    if(signature(latest)!==signature(r.conflicts)){r.conflicts=latest;r.conflictRefresh=true;throw Error('冲突已变化，已刷新结果；请再次确认回执');}
    if(latest.length&&!options.keepConflict)throw Error('存在时间冲突，A 端须明确保留并给出原因');
    if(latest.length&&!options.reason?.trim())throw Error('保留冲突时必须有审核原因');
    const next={...copy(r.after),revision:e.revision+1};
    Object.assign(e,next);r.status='已批准生效';r.applied_revision=next.revision;r.decision={result:'批准',reason:options.reason||'同意调整',at:new Date().toISOString()};
    state.requests.forEach(x=>{if(x.id!==id&&x.eventId===e.id&&x.status==='待审批')x.status='待更新';});
    return r;
  }
  function directSync(state,id,patch) {
    const e=state.events.find(x=>x.id===id);if(!e)throw Error('日程不存在');
    const before=copy(e);Object.assign(e,patch,{revision:e.revision+1});
    state.requests.forEach(x=>{if(x.eventId===id&&x.status==='待审批')x.status='待更新';});
    state.syncs.unshift({id:uid(),eventId:id,before,after:copy(e),at:new Date().toISOString(),status:'已接收（模拟）'});return e;
  }
  function withdraw(state,id){const r=state.requests.find(x=>x.id===id);if(!r||r.status!=='待审批')throw Error('仅待审批申请可撤回');r.status='已撤回';}
  const api={copy,uid,conflicts,signature,submit,receive,directSync,withdraw};
  if(typeof module!=='undefined')module.exports=api;else root.Workbench=api;
})(typeof window!=='undefined'?window:globalThis);
