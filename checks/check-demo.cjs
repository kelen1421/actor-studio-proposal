const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('web/web-demo.js','utf8'),seed=fs.readFileSync('web/demo-seed.json','utf8');
let saved;const storage=new Map();
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const db={createObjectStore(){},transaction(){const t={objectStore(){return {get(){const r={};queueMicrotask(()=>{r.result=saved?structuredClone(saved):undefined;r.onsuccess?.()});return r},put(v){saved=structuredClone(v);queueMicrotask(()=>t.oncomplete?.())}}}};return t}};
const indexedDB={open(){const r={};queueMicrotask(()=>{r.result=db;r.onupgradeneeded?.();r.onsuccess?.()});return r}};
function context(side){const c={structuredClone,crypto:require('node:crypto').webcrypto,URL,Response,console,indexedDB,localStorage,location:{pathname:'/actor-studio-proposal/web/'+side+'/index.html',href:'https://demo.test/actor-studio-proposal/web/'+side+'/index.html',origin:'https://demo.test',replace(){}},navigator:{},document:{currentScript:{src:'https://demo.test/actor-studio-proposal/web/web-demo.js'},addEventListener(){}},fetch:async input=>{assert.equal(input,'/actor-studio-proposal/web/demo-seed.json');return new Response(seed)},setTimeout};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync("web/demo-script-parser.js","utf8"),c);vm.runInContext(code,c);return c}
const a=context('a'),b=context('b');
assert.equal(a.Demo.path('/b/auth.html'),'/actor-studio-proposal/web/b/auth.html');
assert.equal(b.Demo.path('/?account=a'),'/actor-studio-proposal/web/?account=a');
async function call(ctx,path,body,method=body?'POST':'GET'){const r=await ctx.fetch(path,{method,...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
async function login(ctx,name){const r=await ctx.Demo.login(name,'666666');assert.equal(r,name==='a'?'a':'b')}
(async()=>{
 await login(a,'a');await login(b,'b');let ab=(await call(a,'/api/team/bootstrap')).data,bb=(await call(b,'/api/bootstrap')).data;assert.equal(ab.state.projects.length,4);assert.equal(bb.state.projects.length,4);
 let changed=structuredClone(bb.state);changed.events[0].title='Unauthorized';assert.equal((await call(b,'/api/workspace',{state:changed,revision:bb.revision},'PUT')).status,403);
 const request=ab.state.requests[0];assert.equal((await call(a,'/api/team/requests/'+request.id+'/decide',{decision:'approve',conflicts:request.conflicts,keep_conflict:false,reason:''})).status,400);
 assert.equal((await call(a,'/api/team/requests/'+request.id+'/decide',{decision:'approve',conflicts:request.conflicts,keep_conflict:true,reason:'演示确认：团队重新协调重叠安排'})).status,200);
 bb=(await call(b,'/api/bootstrap')).data;assert.equal(bb.state.events.find(x=>x.id==='e1').revision,4);assert.equal(bb.state.requests[0].status,'已批准生效');assert.ok(bb.state.syncs[0].receipts.find(x=>x.user_id==='demo-b').received_at);
 const lib=await call(a,'/api/scripts');assert.equal(lib.status,200);assert.equal(lib.data[0].characterCount,5);const imported=await call(a,'/api/scripts/import',{title:'测试剧本',text:'第一场 · 门口\n林夏：你好。\n周宁：再见。'});assert.equal(imported.data.relations.length,1);assert.equal((await call(b,'/api/scripts')).status,403);
 const newTask=await call(a,'/api/team/tasks',{projectId:'p1',title:'演示任务验收',assigneeId:'demo-c',note:'提交图文结果',due:'',key:'task-check'});assert.equal(newTask.status,200);
 await login(b,'c');let cb=(await call(b,'/api/bootstrap')).data;assert.equal(cb.state.projects.length,1);assert.equal(cb.state.expenses.length,0);const task=cb.state.projects[0].tasks.find(x=>x.origin==='artist');assert.ok(task);
 assert.equal((await call(b,'/api/tasks/'+task.id+'/accept',{})).status,200);cb=(await call(b,'/api/bootstrap')).data;changed=structuredClone(cb.state);changed.projects[0].tasks.find(x=>x.id===task.id).title='Overwritten';assert.equal((await call(b,'/api/workspace',{state:changed,revision:cb.revision},'PUT')).status,403);
 changed=structuredClone(cb.state);changed.projects[0].tasks.find(x=>x.id===task.id).done=true;assert.equal((await call(b,'/api/workspace',{state:changed,revision:cb.revision},'PUT')).status,200);assert.equal((await call(b,'/api/workspace',{state:changed,revision:cb.revision},'PUT')).status,409);
 let e=await call(b,'/api/evidence',{target_type:'preparation',target_id:'ck1',caption:'演示核对完成'});assert.equal(e.status,200);const eid=e.data.id;assert.equal(e.data.can_edit,true);
 assert.equal((await call(b,'/api/evidence/'+eid,{target_type:'preparation',target_id:'ck1',caption:'补充说明',base_revision:1},'PUT')).status,200);const history=await call(b,'/api/evidence/'+eid+'/history');assert.equal(history.data.items.length,2);
 const eA=await call(a,'/api/evidence',{target_type:'preparation',target_id:'ck1',caption:'本人复核'});assert.equal(eA.status,200);assert.equal((await call(b,'/api/evidence/'+eA.data.id,{target_type:'preparation',target_id:'ck1',caption:'越权改写',base_revision:1},'PUT')).status,403);
 await login(b,'b');assert.equal((await call(b,'/api/evidence/'+eid,{target_type:'preparation',target_id:'ck1',caption:'管理员复核',base_revision:2},'PUT')).status,200);
 assert.equal((await call(b,'/api/team/grants',{userId:'demo-c',projectId:'p1',scopes:[]})).status,403);
 assert.equal((await call(a,'/api/team/grants',{userId:'demo-c',projectId:'p1',scopes:[]})).status,200);await login(b,'c');assert.equal((await call(b,'/api/bootstrap')).data.state.projects.length,0);assert.equal((await call(b,'/api/evidence?target_type=preparation&target_id=ck1')).status,403);
 console.log(JSON.stringify({checks:'passed',scenarios:['A/B demo login','B cannot directly edit formal schedule','conflict requires explicit confirmation','A approval updates B revision','receipt fetch distinguished','task assign accept complete','member project scope','task requirements protected','concurrent save rejected','evidence history and owner/admin/star edits','revocation enforced']}));
})().catch(e=>{console.error(e);process.exit(1)});
