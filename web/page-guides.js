(()=>{'use strict';
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Each route has its own task, steps, and an honest capability boundary.
const A={
 home:['我的首页','先找出今天最需要准备的事。',['先看时间线中的正式日程与待批准事项。','编辑个人清单；常用模块和卡片可调整顺序。','点击日程进入详情，需要团队执行的事到“工作室协同”发布。'],'首页读取个人与团队演示安排；不会自动发送提醒。'],
 script:['剧本与角色','从对白回到人物和原文依据。',['直接查看虚构示例，或粘贴“人物名：台词”正文。','点击人物、关系连线或场次筛选，查看对应的原文。','编辑人物笔记与关系，按需导出关系资料。'],'支持 UTF-8 TXT / Markdown 和粘贴；按规则整理对白，尚未接入 AI 解读。'],
 performance:['表演分析','比较一场戏的不同处理方式。',['先读人物目标、阻碍和行动转折。','对照原文，比较三种行动与节奏处理。','带着讨论问题进入“台词对练”，与老师核对。'],'当前为原创片段的分析示例，尚不支持上传表演视频或自动分析。'],
 rehearsal:['台词对练','分角色练习对白、停顿与回应。',['选择我的角色，编辑对白、顺序和每句停顿。','选择完整、关键词或隐藏提示，开始或暂停练习。','保存场次或导出项目，下次继续。'],'网页语音使用浏览器可用音色；录音识别和声音克隆未接入。'],
 visual:['妆容与造型','比较同一人物的配色与整体氛围。',['选择清透、镜头、复古或舞台风格。','打开自定义色号，调整唇色、腮红与眼影。','保存喜欢的配色，再与妆造团队讨论。'],'画面使用已生成的虚构人物；尚未支持本人照片上脸。'],
 storyboard:['镜头与漫剧','用三个镜头讨论一场戏的叙事。',['按建立关系、对手回应、做出选择阅读分镜。','比较景别、人物距离与场面重点。','整理时长、场景与素材授权等待确认事项。'],'当前为静态分镜示例；视频和动态漫剧生成尚未接入。'],
 schedule:['我的日程','把个人安排与团队正式通告放在一起。',['切换周视图或月视图，选择日期查看安排。','新建个人项目；编辑团队正式通告前先预览差异和冲突。','本人修改直接生效；团队建议到“工作室协同”审批。'],'私人与团队安排分开保存；没有接入外部日历或推送服务。'],
 fans:['粉丝沟通','把留言整理成经过人工确认的回复草稿。',['查看示例留言，按分类、热度或随机方式阅读。','选择语气、编辑回复，并核对事实与公开边界。','确认草稿后导出；平台模拟导入有单独标注。'],'未连接真实社交平台，不会自动回复或对外发布。'],
 dance:['舞蹈训练','把音乐、动作观察和训练目标对应起来。',['按时间段查看音乐与表达主题。','记录希望与老师讨论的动作观察问题。','结合训练反馈，回到“个人发展”安排下一步。'],'当前为训练结构示例；动作评估、视频分析与身体负荷判断未接入。'],
 industry:['行业简报','把值得关注的信息变成下一步。',['按影视、舞蹈、音乐、时尚或 AI 筛选，也可搜索。','展开简报查看摘要、与我的关系和待核验问题，标记已读或收藏。','把下一步加入个人行动；可添加自己的来源链接、日期和笔记。'],'内置条目为虚构演示；不会实时抓取新闻。新增来源需自行核验。'],
 growth:['个人发展','让阶段目标对应到具体行动和复盘。',['新建或编辑阶段目标，写明截止日期与可核对的里程碑。','勾选本周行动和里程碑，进度随完成数量更新。','记录复盘与下一步；需要安排时间时打开“我的日程”。'],'目标、行动和复盘只保存在当前浏览器的个人空间，不自动下发团队。'],
 studio:['工作室协同','在批准、发布和授权之间快速做决定。',['日程审核中查看修改前后差异、标注和红色冲突。','批准后正式版本生效；有重叠时先确认并填写原因。','在任务发布、成员放权、执行与回执中继续跟进。'],'A/B 需在同一浏览器中演示；未接入异地同步、真实通知或加密中继。'],
 rights:['数字人与授权','先确认素材怎么用，再讨论制作。',['逐项查看照片、剧本、声音、音乐和视觉素材的拟用场景。','核对用途、渠道、期限、地域、训练与再授权范围。','把待确认问题交给权利人及专业人员审核。'],'当前为授权核对示例，不代表已获得授权，也不会采集声音或签订合同。']
};
const B={
 overview:['执行总览','先处理今天尚未落实的事项。',['查看正式到场时间、准备待落实与出行待确认。','从执行入口进入通告、接送、联络、清单或交接。','对具体事项提交图文留痕，回看团队动态。'],'数字由当前账号已授权的项目计算；不执行预订、付款或外部通知。'],
 projects:['项目与任务','把项目目标落实到负责人和任务。',['按长期、周期或临时项目筛选，切换卡片或看板。','管理员可新建项目，团队可维护授权项目内的执行任务。','艺人发布的任务先由负责人接受，再更新完成并留痕。'],'成员仅能访问获授权项目；团队不能改写艺人发布的任务要求。'],
 schedule:['通告与日程','提出调整建议，保留正式安排。',['切换周程或月程，点开一条正式通告。','填写建议时间、理由和修改标注，查看前后差异与冲突。','提交后到“变更申请”跟踪；A 批准前正式安排不变。'],'b、c 不能直接修改正式日程；a 可审批，旧申请不能覆盖较新版本。'],
 travel:['差旅与接送','把交通、住宿与集合信息落实到人。',['查看关联通告，核对日期、集合点、接送和住宿状态。','登记或编辑执行信息，并确认负责人。','补充演示图片或文字留痕；正式通告变更后重新复核。'],'这里只登记需求与状态；没有真实订票、订房、付款或地图定位。'],
 site:['现场与联络','让现场对接信息容易找到。',['按通告查看现场联系人、负责事项和入场地点。','更新授权范围内的联系渠道、到场要求和备注。','完成核对后给该记录提交留痕。'],'地点和联系人按项目授权展示；不会实际拨号或发送消息。'],
 checklists:['准备清单','逐项落实出发、现场、妆发和收尾准备。',['查看分组中的负责人、检查时间和完成状态。','完成核对后勾选；通告变化时留意“需复核”。','点击留痕提交文字或图片，编辑后查看修改历史。'],'留痕由提交本人、管理员或明星编辑，且仍需具备项目访问权限。'],
 handoff:['费用与交接','把票据、物品去向和确认依据记清楚。',['分别查看费用登记与物品借还状态。','登记金额、经手人、交接人和确认依据。','提交演示票据或交接图片，并查看留痕历史。'],'不实际报销或付款；费用信息还需项目的财务查看权限。'],
 reviews:['变更申请','追踪建议从提出到生效的全过程。',['按状态查找待审批、已处理或待更新的申请。','展开查看修改前后差异、冲突和讨论标注。','a 可批准或退回；b、c 跟踪结果并复核受影响的执行事项。'],'管理员身份不能代替明星审批；正式版本变化后需重新提出建议。'],
 team:['团队与权限','确认谁能查看、谁能执行。',['查看 a、b、c 的角色和当前项目授权。','需要开放或收回项目范围时，由 a 到 A 端“成员放权”设置。','切换到成员 c，检查其仅能看到已授权项目。'],'网页角色用于演示；正式账号验证和远程团队管理仍待接入。']
};
const auth=['B 端登录','先选择演示身份。',['明星 a / 666666；管理员 b / 666666；成员 c / 666666。','a 可查看审批与留痕，b 负责管理，c 仅进入获授权的项目。','登录后从页面上方或底部随时打开本页指引。'],'只使用虚构资料；演示记录仅在当前浏览器中保存。'];
const portal=['双端演示入口','从一条日程申请体验团队协作。',['选择 a 进入个人工作台，选择 b 或 c 进入团队工作台。','B 提出调整，A 查看差异与冲突后审批。','回到 B 刷新，复核执行事项并提交图文留痕。'],'a、b、c 的初始密码均为 666666；两端须使用同一浏览器。'];
const side=()=>window.Demo.side;
const route=()=>location.hash.slice(1).split('?')[0]||(side()==='a'?'home':'overview');
function current(){return side()==='portal'?portal:/\/auth(?:\.html)?$/.test(location.pathname)?auth:(side()==='a'?A:B)[route()]||(side()==='a'?A.home:B.overview)}
function steps(info){return `<p class="page-guide-purpose">${e(info[1])}</p><ol class="page-guide-steps">${info[2].map(s=>`<li>${e(s)}</li>`).join('')}</ol><p class="page-guide-limit">${e(info[3])}</p>`}
function guide(mode='page'){
 let dialog=document.querySelector('#route-guide-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='route-guide-dialog';dialog.className='route-guide-dialog';document.body.append(dialog);dialog.addEventListener('click',ev=>{const b=ev.target.closest('[data-route-guide]');if(!b)return;const a=b.dataset.routeGuide;if(a==='close')dialog.close();if(a==='page'||a==='flow'){dialog.close();guide(a)}if(a==='reset'&&confirm('恢复当前浏览器中的演示数据？新增演示记录和图片会清除。'))window.Demo.reset()})}
 const info=mode==='flow'?portal:current();dialog.innerHTML=`<header><div><span>使用指引</span><h2>${e(info[0])}</h2></div><button data-route-guide="close" aria-label="关闭使用指引">×</button></header><nav aria-label="指引范围"><button data-route-guide="page" aria-pressed="${mode==='page'}">本页操作</button><button data-route-guide="flow" aria-pressed="${mode==='flow'}">双端演示流程</button></nav>${steps(info)}${mode==='flow'?'<p class="page-guide-account">演示账号：a 明星、b 管理员、c 成员；密码均为 <b>666666</b>。</p>':''}<footer><button data-route-guide="reset">恢复演示数据</button><button data-route-guide="close" class="guide-primary">知道了</button></footer>`;dialog.showModal();
}
function decorate(){
 const host=side()==='a'?document.querySelector('#module-screen'):document.querySelector('#app .content');if(!host||host.querySelector('.page-help'))return;
 const info=current(),key='actor-guide-collapse-'+side()+'-'+route(),panel=document.createElement('details');panel.className='page-help';panel.innerHTML=`<summary><span><b>本页指引</b><span>${e(info[1])}</span></span><span class="page-help-toggle">展开 / 收起</span></summary>${steps(info)}<button type="button" class="page-help-more">查看完整指引</button>`;
 panel.open=localStorage.getItem(key)==='0';panel.addEventListener('toggle',()=>localStorage.setItem(key,panel.open?'0':'1'));panel.querySelector('button').onclick=()=>guide();const title=host.querySelector(':scope > h1,:scope > .page-head');if(title)title.after(panel);else host.prepend(panel);
}
window.PageGuide={guide,decorate,current,A,B};
document.addEventListener('DOMContentLoaded',()=>{decorate();const host=document.querySelector('#module-screen')||document.querySelector('#app');if(host)new MutationObserver(decorate).observe(host,{childList:true,subtree:true})});
window.addEventListener('hashchange',decorate);
})();
