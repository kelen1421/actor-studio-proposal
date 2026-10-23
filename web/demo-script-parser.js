/* Deterministic text organization for the browser demo; no AI service is called. */
window.parseDemoScript=(text,title,sourceName)=>{
 if(typeof text!=='string'||!text.trim())throw Error('请先填写剧本正文。');
 if(text.length>240000)throw Error('请按集导入，每次不超过 24 万字。');
 const lines=text.replace(/\r\n?/g,'\n').split('\n'),people=new Map(),scenes=[],cues=[],relations=[];
 const meta=new Set('时间 地点 场景 场次 人物 出场人物 角色 人物表 画面 字幕 旁白 音效 音乐 转场 镜头 动作 内景 外景 说明'.split(' '));
 let current=null;
 const valid=n=>n&&n.length<=30&&!meta.has(n)&&!/[，。！？；、/\\<>]/.test(n)&&!/^\d+$/.test(n)&&(!/[\u4e00-\u9fff]/.test(n)||n.length<=8);
 const person=n=>{if(!people.has(n))people.set(n,{id:'p-'+people.size,name:n,dialogueCount:0,sceneIds:[],firstLine:null});return people.get(n)};
 const scene=(line,index,explicit)=>{if(current)current.lineEnd=index;current={id:'scene-'+(scenes.length+1),title:line,explicit,lineStart:index+1,lineEnd:lines.length,characterIds:[],cueIds:[]};scenes.push(current);return current};
 lines.forEach((raw,index)=>{
  const line=raw.trim().replace(/^#+/,'').trim();if(!line)return;
  const roster=line.match(/^(?:人物表|出场人物|人物|角色)[：:]\s*(.+)$/);if(roster){roster[1].split(/[、,，;；\s]+/).filter(valid).forEach(person);return}
  if(/^(?:第[零〇一二三四五六七八九十百千\d]+[场幕集]|场[\s次]*[一二三四五六七八九十\d]+|\d{1,3}[.、．]\s*[^：:]+$|(?:INT\.|EXT\.|内景|外景|场景)[\s：:])/i.test(line)){scene(line.slice(0,100),index,true);return}
  const m=line.match(/^([\w\u4e00-\u9fff·. \-]{1,32}?)(?:[（(][^）)]{0,32}[）)])?\s*[：:]\s*(.+)$/);if(!m)return;
  const name=m[1].trim();if(!valid(name))return;const p=person(name),s=current||scene('未分场片段',0,false),c={id:'line-'+(index+1),characterId:p.id,role:name,text:m[2].trim(),line:index+1,sceneId:s.id};
  cues.push(c);p.dialogueCount++;p.firstLine??=index+1;if(!p.sceneIds.includes(s.id))p.sceneIds.push(s.id);if(!s.characterIds.includes(p.id))s.characterIds.push(p.id);s.cueIds.push(c.id);
 });
 if(!cues.length)throw Error('请使用“人物名：台词”的格式。网页演示按人名和场次整理，不调用 AI。');
 if(people.size>120)throw Error('请按集导入，每次不超过 120 位人物。');
 const edges=new Map();
 for(const s of scenes){const cs=cues.filter(c=>c.sceneId===s.id),pairs=s.explicit?s.characterIds.flatMap((a,i)=>s.characterIds.slice(i+1).map(b=>[cs.find(c=>c.characterId===a),cs.find(c=>c.characterId===b)])):cs.slice(1).map((b,i)=>[cs[i],b]);for(const [a,b] of pairs){if(a.characterId===b.characterId)continue;const ids=[a.characterId,b.characterId].sort(),key=ids.join('|');let r=edges.get(key);if(!r){r={id:'r-'+edges.size,source:ids[0],target:ids[1],sceneIds:[],evidence:[],basis:s.explicit?'scene':'dialogue',label:s.explicit?'同场对白':'相邻对白'};edges.set(key,r);relations.push(r)}if(!r.sceneIds.includes(s.id))r.sceneIds.push(s.id);if(r.evidence.length<6)r.evidence.push({sceneId:s.id,sceneTitle:s.title,line:a.line,quote:[a,b].map(c=>c.role+'：'+c.text.slice(0,180)).join('\n')})}}
 return {id:crypto.randomUUID(),title:String(title||'未命名剧本').slice(0,120),sourceName:String(sourceName||'粘贴剧本').slice(0,255),text,characters:[...people.values()].sort((a,b)=>b.dialogueCount-a.dialogueCount),scenes,cues,relations,relationNotes:{},characterNotes:{},customRelations:[],importedAt:new Date().toISOString()};
};
