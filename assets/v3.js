/* V3 presentation and catalog adapter. V2 voice, DM, permissions and rule engine remain authoritative. */
(() => {
'use strict';
const {categories,scenes}=ICAR_CATALOG, byId=new Map(scenes.map(s=>[s.sceneId,s])), $=s=>document.querySelector(s), h=escapeHtml;
const store={get:()=>{try{return JSON.parse(localStorage.getItem('icarClawV3.ui')||'{}')}catch{return {}}},put:v=>{try{localStorage.setItem('icarClawV3.ui',JSON.stringify(v))}catch{}}};
const ui=Object.assign({page:'discover',category:'smart',more:false,scroll:{},search:'',source:'',status:'',trigger:'',paused:false,settings:'voice'},store.get());
if(ui.visualRevision!==31){ui.paused=false;ui.visualRevision=31;}
if(!categories.some(c=>c.id===ui.category))ui.category='smart';
const original={home:renderHome,services:renderServices,close:closeModal,modal,openSettings,goHome,showPage,startVoice:startSkillExperience};
let player=null, returnFocus=null;
// Replace only the preset catalog; keep every user-created rule and the original rule engine.
const seeds=scenes.filter(s=>s.automation).map(s=>{let a=s.automation,old=S.services.find(x=>x.id===s.sceneId||x.id===a.legacyId);return {id:s.sceneId,sceneId:s.sceneId,name:s.name,desc:s.description,trigger:a.trigger,actions:[...a.actions],requires:[...a.requires],triggerType:a.triggerType,source:'iCAR 官方',mode:'提醒并执行',record:'暂无记录',tableScene:true,editable:false,enabled:old?old.enabled:false}});
TABLE_HOME_SCENES.splice(0,TABLE_HOME_SCENES.length,...seeds);
const presetIds=new Set(seeds.map(s=>s.id));
S.services=S.services.filter(s=>s.source==='我的场景'||presetIds.has(s.id));
ensureTableScenes=()=>{for(const seed of seeds){let current=S.services.find(s=>s.id===seed.id);if(!current)S.services.push({...seed});else Object.assign(current,{...seed,enabled:current.enabled})}};
ensureTableScenes();persistV11();
const app=$('.app'),home=$('#home');document.body.classList.add('v3');
$('.brand').innerHTML='iCAR <b>Claw</b><small>3.0</small>';
$('.topRight').insertAdjacentHTML('afterbegin','<button id="v3Pause" aria-label="暂停动效">暂停动效</button>');
const nav=document.createElement('nav');nav.className='v3Nav';nav.setAttribute('aria-label','主导航');nav.innerHTML=[['discover','发现','sparkles'],['mine','我的场景','memory'],['settings','助手设置','settings']].map(([id,n,icon])=>`<button data-page3="${id}">${uiIcon(icon)}<span>${n}</span></button>`).join('');app.append(nav);

const backdrop=home.querySelector('.motionRoom');app.prepend(backdrop);backdrop.classList.add('v3Backdrop');
home.insertAdjacentHTML('beforeend',`<div class="v3Discover"><section class="v3Hero"><div class="heroCopy"><span class="v3Eyebrow">iCAR INTELLIGENCE · 随心而行</span><h1 id="v3Headline"></h1><p id="v3Description"></p><button class="v3Voice primary" onclick="openIntroVideo()">${uiIcon('media')} 查看完整介绍</button><small>一段视频，看懂 iCAR Claw 的完整能力</small></div><div class="v3Showroom"><div class="glassRoof"></div><div class="v3Platform"></div><img class="v25" src="assets/brand/v25-cutout.png" alt="白色 iCAR V25 前45度原图"><img class="corgi" src="assets/brand/卡基狗.png" alt="卡基狗"><span class="v25Label">iCAR V25 <i>一起，去更多地方</i></span></div></section><div class="v3Categories" role="tablist" aria-label="六大场景">${categories.map((c,i)=>`<button role="tab" data-category3="${c.id}" style="--arc:${[0,12,20,20,12,0][i]}px">${uiIcon(['sparkles','zodiac','car','route','service','media'][i])}<span><b>${c.name}</b><small>${c.subtitle}</small></span></button>`).join('')}</div><section class="v3Catalog"><header><div><h2 id="v3CategoryTitle"></h2><span id="v3Count"></span></div><div><button id="v3More">查看更多 · 10</button><button aria-label="向左浏览场景" data-slide="-1">‹</button><button aria-label="向右浏览场景" data-slide="1">›</button></div></header><div id="v3Cards" class="v3Cards"></div></section></div>`);
const manager=document.createElement('section');manager.id='v3Mine';manager.innerHTML=`<header class="v3ManagerHeader"><div><span class="v3Eyebrow">MY AUTOMATIONS</span><h1>我的场景</h1><p>把日常交给 iCAR，把时间留给自己。</p></div><div><button class="primary" onclick="createScene()">＋ 创建场景</button></div></header><div class="v3Tabs"><div class="v3SourceCards"><button class="v3SourceCard" data-source3="preset"><b>系统推荐</b><span id="v3PresetCount"></span></button><button class="v3SourceCard" data-source3="custom"><b>我的创建</b><span id="v3CustomCount"></span></button></div><label class="v3Search">${uiIcon('search')}<input id="v3Search" placeholder="搜索场景名称" aria-label="搜索我的场景"></label></div><div id="v3ManagerCount"></div><div id="v3Grid" class="v3Grid"></div>`;$('.screen').append(manager);
$('[data-page="services"]').hidden=true;
const settingsContent=$('#settings .content');
const settingsTop=document.createElement('header');settingsTop.className='v3SettingsTop';settingsTop.innerHTML=`<button id="v3SettingsBack" aria-label="返回发现">${uiIcon('arrowRight')} 返回</button><div><span>iCAR Claw</span><h1>助手设置</h1></div><span>让每一次交互，更合你的心意</span>`;
$('#settings').prepend(settingsTop);$('#v3SettingsBack').onclick=()=>go('discover');
const settingsNav=document.createElement('nav');settingsNav.className='v3SettingsNav';settingsNav.setAttribute('aria-label','设置分类');settingsNav.innerHTML=[['memory','我的记忆'],['personal','我的智能代理'],['voice','语音与唤醒'],['account','账号'],['privacy','隐私与权限']].map(([id,n])=>`<button data-set3="${id}">${n}</button>`).join('');settingsTop.after(settingsNav);
settingsNav.onclick=e=>{const b=e.target.closest('[data-set3]');if(!b)return;ui.settings=b.dataset.set3;displaySettings(b.dataset.set3);remember()};
for(const id of ['voice','personal','memory','privacy'])settingsContent.append($('#page-'+id));
const voiceRibbon=document.createElement('button');voiceRibbon.className='v3VoiceRibbon';voiceRibbon.innerHTML=`<span class="v3Wave">${'<i></i>'.repeat(9)}</span><span>你可以直接说：<b>“帮我找一家附近的川菜，顺便导航过去”</b></span><em>›</em>`;voiceRibbon.onclick=()=>startHomeVoice();$('.top').append(voiceRibbon);
const ambience=document.createElement('div');ambience.className='v3Ambience';ambience.innerHTML='<div class="ambientStars"></div><div class="ambientGlow"></div><div class="ambientFloor"></div>';app.prepend(ambience);
$('.v3Platform').insertAdjacentHTML('beforeend','<i class="platformRing ringOne"></i><i class="platformRing ringTwo"></i><i class="platformScan"></i>');
$('.v3Showroom').insertAdjacentHTML('beforeend','<div class="dogPedestal"></div>');$('.v3Showroom').insertAdjacentHTML('beforeend','<div class="v3Sweep"></div>');
let pageAnimation;
function enterSurface(page){const el=page==='discover'?$('.v3Discover'):page==='mine'?manager:$('#settings');pageAnimation?.cancel();if(ui.paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;pageAnimation=el.animate([{opacity:0,transform:'translateY(26px) scale(.975)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:700,easing:'cubic-bezier(.16,1,.3,1)'});}
function displaySettings(p){p=['memory','personal','voice','account','privacy'].includes(p)?p:'voice';const pageKey=(p==='account'||p==='privacy')?'privacy':p;original.showPage(pageKey);settingsContent.querySelectorAll('.page:not(#page-services)').forEach(e=>e.classList.toggle('active',e.id==='page-'+pageKey));document.querySelectorAll('[data-set3]').forEach(b=>{b.classList.toggle('active',b.dataset.set3===p);b.setAttribute('aria-current',b.dataset.set3===p?'page':'false')});settingsContent.scrollTop=0;if(p==='privacy')requestAnimationFrame(()=>{const t=[...document.querySelectorAll('#page-privacy h2')].find(x=>/身份识别|权限/.test(x.textContent));if(t)t.scrollIntoView({block:'start',behavior:ui.paused?'instant':'smooth'})});}

function remember(){store.put(ui)}
function go(page){guardRoleNavigationV11(()=>{stopPlayer();closeModal();ui.page=page;app.dataset.page3=page;home.style.display=page==='discover'?'block':'none';manager.hidden=page!=='mine';$('#settings').classList.toggle('open',page==='settings');$('#bottomNav').style.display='none';nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.page3===page);b.setAttribute('aria-current',b.dataset.page3===page?'page':'false')});if(page==='settings')displaySettings(ui.settings);if(page==='mine')renderManager();enterSurface(page);remember()})}
openSettings=function(p){if(p==='services'){go('mine');return}ui.settings=p||'voice';go('settings')};
goHome=()=>go('discover');showPage=function(p){if(p==='services'){go('mine');return}displaySettings(p);if(['memory','personal','voice','privacy'].includes(p)){ui.settings=p;remember()}};
nav.onclick=e=>{let b=e.target.closest('[data-page3]');if(b)go(b.dataset.page3)};
function cardArt(s){return `<img class="sceneCover" src="${h(s.cover)}" alt="${h(s.name)}场景封面" decoding="async">`}
function managedCover(s){const exact=byId.get(s.sceneId)||byId.get(s.id);if(exact)return exact.cover;const text=[s.name,s.trigger,...s.actions].join(' ');const file=/雨|雾|视野/.test(text)?'visibility':/儿童|孩子/.test(text)?'child':/宠物/.test(text)?'pet':/音乐|播放|音量/.test(text)?'audio':/导航|公司|出发|到达/.test(text)?'commute':/空调|座椅|午休/.test(text)?'welcome':'scene-master';return 'assets/covers/'+file+'.png';}
function renderDiscover(){const c=categories.find(c=>c.id===ui.category),all=scenes.filter(s=>s.category===c.id),list=c.id==='smart'&&!ui.more?all.slice(0,5):all;
$('#v3Headline').innerHTML=({'smart':'让 iCAR 在合适的时机<br>主动为你做更多','fun':'一路好奇<br>一路有趣','car':'你的舒适<br>一句话就懂','travel':'想去的地方<br>一起好好抵达','life':'把生活的精彩<br>安排在路上','entertainment':'喜欢的声音与故事<br>一路相伴'})[c.id];$('#v3Description').textContent=c.subtitle+'。探索每一种可能，让每次出发更从容。';$('#v3CategoryTitle').textContent=c.name;$('#v3Count').textContent=`${all.length} 个场景`;$('#v3More').hidden=c.id!=='smart';$('#v3More').textContent=ui.more?'收起更多':'查看更多 · 10';$('#v3More').setAttribute('aria-expanded',String(ui.more));
document.querySelectorAll('[data-category3]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.category3===c.id)));
$('#v3Cards').innerHTML=list.map((s,i)=>`<button class="v3Card" data-scene3="${s.sceneId}"><div class="v3CardArt">${cardArt(s,i)}</div><div class="v3CardCopy"><h3>${h(s.name)}</h3><p>${h(s.description)}</p><span>查看详情 <b>↗</b></span></div></button>`).join('');$('#v3Cards').scrollLeft=ui.scroll[c.id]||0;}
const APP_SCENES=new Set(['find-car','parking-pay','sentry-plus']);
window.launchAppDemo=function(id){const sc=byId.get(id);if(!sc)return;stopPlayer();
document.querySelectorAll('.v3AppLaunch').forEach(e=>e.remove());
const ov=document.createElement('div');ov.className='v3AppLaunch';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',sc.name+' APP 演示');
ov.innerHTML=`<div class="v3AppBoot"><img src="${h(sc.cover)}" alt=""><h2>${h(sc.name)}</h2><p>正在打开 APP<i class="v3BootDots"><b>.</b><b>.</b><b>.</b></i></p><span class="v3BootBar"><b></b></span></div>`;
document.body.append(ov);
ov._timer=setTimeout(()=>{ov.classList.add('ready');ov.innerHTML=`<div class="v3AppScreen"><header><img src="${h(sc.cover)}" alt=""><b>${h(sc.name)}</b><span>独立 APP · 演示示意</span><button onclick="this.closest('.v3AppLaunch').remove()">关闭</button></header><div class="v3AppBody"><img class="v3AppHero" src="${h(sc.cover)}" alt="${h(sc.name)} APP 界面示意"><div class="v3AppCopy"><h3>${h(sc.name)}</h3><p>${h(sc.description)}</p><small>此处为跳转到独立 APP 的演示界面，正式版本将在此打开对应 APP。</small></div></div></div>`},1500);
ov.onclick=e=>{if(e.target===ov){clearTimeout(ov._timer);ov.remove()}}};
window.openIntroVideo=function(){modal(`${modalCloseButton()}<div class="v3Intro"><span class="v3Eyebrow">ICAR CLAW · FULL INTRODUCTION</span><h2>完整介绍</h2><p class="sub">一段视频，看懂 iCAR Claw 的完整能力</p><div class="v3IntroStage"><video id="v3IntroVideo" controls playsinline preload="auto" src="assets/videos/intro.mp4"></video><div class="v3IntroEmpty" id="v3IntroEmpty" hidden><span class="v3IntroPlay">▶</span><b>完整介绍视频</b><span>视频接入中，后续在此播放</span></div></div></div>`,'v3IntroModal');
const v=document.getElementById('v3IntroVideo'),empty=document.getElementById('v3IntroEmpty');
const showEmpty=()=>{v.hidden=true;empty.hidden=false};
v.addEventListener('error',showEmpty);v.addEventListener('loadeddata',()=>{v.hidden=false;empty.hidden=true});
if(v.error||!v.currentSrc)showEmpty()};
const priorCloseModal=closeModal;closeModal=function(){const v=document.getElementById('v3IntroVideo');if(v){try{v.pause()}catch{}}priorCloseModal()};
function stageShow(ci){if(ui.paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const car=$('.v25'),dog=$('.corgi');
[...document.querySelectorAll('#v3Cards .v3Card')].forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(34px) scale(.93)',filter:'blur(5px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:720,delay:65*i,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
[...document.querySelectorAll('.heroCopy>*')].forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:620,delay:85*i,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
document.querySelectorAll('.platformRing').forEach((r,i)=>r.animate([{transform:'scale(.85)',opacity:.95},{transform:'scale(1.55)',opacity:0}],{duration:1250,delay:170*i,easing:'cubic-bezier(.16,1,.3,1)'}));
const sweep=$('.v3Sweep');if(sweep)sweep.animate([{opacity:0,transform:'translateX(-34%)'},{opacity:.6,offset:.45},{opacity:0,transform:'translateX(34%)'}],{duration:1500,easing:'ease-in-out'});
const v=ci%3;
const easeOut='cubic-bezier(.16,1,.3,1)',easeIn='cubic-bezier(.55,.06,.68,.19)',spring='cubic-bezier(.34,1.56,.64,1)';
const carBody=[[
{transform:'translateX(0) rotate(0deg) translateY(0)',offset:0,easing:easeIn},
{transform:'translateX(-92px) rotate(-1.1deg) translateY(-5px)',offset:.3,easing:easeOut},
{transform:'translateX(16px) rotate(.55deg) translateY(1px)',offset:.58,easing:spring},
{transform:'translateX(-6px) translateY(-7px) rotate(-.3deg)',offset:.78,easing:easeOut},
{transform:'none',offset:1}],[
{transform:'translateX(0) rotate(0deg)',offset:0,easing:easeIn},
{transform:'translateX(62px) rotate(.9deg) translateY(-4px)',offset:.3,easing:easeOut},
{transform:'translateX(-24px) rotate(-.5deg) translateY(2px)',offset:.6,easing:spring},
{transform:'translateX(7px) rotate(.2deg) translateY(0)',offset:.82,easing:easeOut},
{transform:'none',offset:1}],[
{transform:'translateY(0) rotate(0deg) scale(1)',offset:0,easing:easeIn},
{transform:'translateY(7px) scale(1.015,.985)',offset:.18,easing:spring},
{transform:'translateY(-24px) rotate(.8deg) scale(1)',offset:.48,easing:easeOut},
{transform:'translateY(3px) rotate(-.3deg)',offset:.72,easing:spring},
{transform:'translateY(-4px) rotate(.1deg)',offset:.87,easing:easeOut},
{transform:'none',offset:1}]];
car.animate(carBody[v],{duration:1500,easing:'linear'});
const baseGlow='drop-shadow(0 30px 18px #020612)';
car.animate([{filter:'brightness(1.05) '+baseGlow,offset:0},{filter:'brightness(1.45) drop-shadow(0 30px 28px #5aa8ff77)',offset:.32,easing:'ease-out'},{filter:'brightness(1.1) '+baseGlow,offset:.58},{filter:'brightness(1.38) drop-shadow(0 30px 24px #5aa8ff55)',offset:.8},{filter:'brightness(1.05) '+baseGlow,offset:1}],{duration:1500,easing:'linear'});
dog.animate([
{transform:'translateX(0) translateY(0) scale(1,1) rotate(0deg)',offset:0,easing:easeIn},
{transform:'translateX(4px) translateY(9px) scale(1.2,.76) rotate(-5deg)',offset:.16,easing:spring},
{transform:'translateX(-22px) translateY(-64px) scale(.88,1.16) rotate(-14deg)',offset:.42,easing:easeIn},
{transform:'translateX(-30px) translateY(-44px) scale(.96,1.05) rotate(12deg)',offset:.6,easing:spring},
{transform:'translateX(-6px) translateY(2px) scale(1.12,.84) rotate(4deg)',offset:.76,easing:spring},
{transform:'translateX(0) translateY(-13px) scale(1,1) rotate(-2deg)',offset:.88,easing:easeOut},
{transform:'none',offset:1}],{duration:1400,easing:'linear'})}
$('.v3Categories').onclick=e=>{let b=e.target.closest('[data-category3]');if(!b)return;if(b.dataset.category3===ui.category)return;ui.category=b.dataset.category3;app.dataset.category3=ui.category;renderDiscover();stageShow(categories.findIndex(c=>c.id===ui.category));remember()};
$('#v3More').onclick=()=>{ui.more=!ui.more;ui.scroll.smart=0;renderDiscover();remember()};
$('.v3Catalog').onclick=e=>{let b=e.target.closest('[data-slide]');if(b)$('#v3Cards').scrollBy({left:Number(b.dataset.slide)*$('#v3Cards').clientWidth*.8,behavior:ui.paused?'instant':'smooth'})};
$('#v3Cards').onscroll=()=>{ui.scroll[ui.category]=$('#v3Cards').scrollLeft;remember()};
$('#v3Cards').onclick=e=>{const b=e.target.closest('[data-scene3]');if(b)openDetail(b.dataset.scene3)};
function stopPlayer(){if(player){clearInterval(player.timer);player=null}document.querySelectorAll('#modal video').forEach(v=>v.pause())}
closeModal=function(){stopPlayer();original.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null};
modal=function(html,cls){stopPlayer();original.modal(html,cls)};
function openDetail(id){let s=byId.get(id);if(!s)return;cleanupDemoPlayer();cleanupVoiceExperience();cleanupSceneVoice();try{speechSynthesis.cancel()}catch{}returnFocus=document.activeElement;const ma=s.intents.length>0;
modal(`<section class="v3Detail"><header><div><span class="v3Eyebrow">${categories.find(c=>c.id===s.category).name}</span><h2>${h(s.name)}</h2><p>${h(s.description)}</p></div>${modalCloseButton()}</header><div class="v3DetailBody"><div class="v3Media">${s.video?`<video id="v3Video" src="${s.video}" ${s.poster?`poster="${h(s.poster)}"`:""} controls playsinline preload="metadata" aria-label="${h(s.name)}原始演示视频"></video><button class="secondary" id="v3VideoReplay">重播</button><p id="v3VideoError" role="status"></p>`:`<div class="v3DemoVisual">${cardArt(s,scenes.indexOf(s))}<span>${ma?'MA 概念演示 · 视频占位':'场景介绍 · 动画演示'}</span><h3 id="v3FrameTitle">${h(s.name)}</h3><p id="v3FrameText">点击播放，了解这个场景</p><div class="v3DemoPulse"></div></div><div class="v3PlayerControls"><button id="v3Play">播放</button><input id="v3Seek" type="range" min="0" max="20" value="0" step="0.1" aria-label="演示进度"><span id="v3Time">00:00 / 00:20</span><button id="v3Replay">重播</button></div>`}</div><aside>${ma?`<h3>一次说出10个意图</h3><p class="v3Query">“${h(s.query)}”</p><ol class="v3Intents">${s.intents.map(x=>`<li>${h(x)}</li>`).join('')}</ol><p class="v3Boundary">能力介绍：识别自然表达 → 拆解任务 → 协同执行 → 偏好记忆。此处为规划展示；未接入真实 Memory、声纹或十任务连续执行引擎。</p>`:`<h3>场景体验</h3><p>${h(s.automation?.trigger||'在合适的时机，说出你的需求')}</p><ol>${(s.automation?.actions||[s.description,'理解需求并确认必要信息','按当前已接入能力提供反馈']).map(a=>`<li>${h(a)}</li>`).join('')}</ol><p class="v3Boundary">演示用于说明交互；实际车辆、外部应用及服务需相应接入。语音体验沿用原 Demo 能力。</p>`}</aside></div><footer><span>播放介绍不会开启麦克风</span><div>${s.automation?`<button class="secondary" onclick="openScene('${s.sceneId}')">配置场景</button>`:''}${id==='scene-master'?'<button class="secondary" id="v3CreateFromDetail">创建我的场景</button>':''}${id==='persona'?'<button class="secondary" id="v3RoleFromDetail">设置人设</button>':''}<button class="ghost" onclick="closeModal()">返回</button>${APP_SCENES.has(id)?'<button class="primary" id="v3AppJump">立即体验</button>':'<button class="primary" id="v3Experience">立即体验</button>'}</div></footer></section>`,'v3DetailModal');
if($('#v3Experience'))$('#v3Experience').onclick=()=>{stopPlayer();try{speechSynthesis.cancel()}catch{}let valid=SKILL_TABS.some(t=>t.name===s.domain&&t.skills.includes(s.legacySkill));original.startVoice(valid?s.domain:'全局语音',valid?s.legacySkill:'Claw 全能助手')};if($('#v3AppJump'))$('#v3AppJump').onclick=()=>launchAppDemo(id);
if($('#v3CreateFromDetail'))$('#v3CreateFromDetail').onclick=()=>{go('mine');createScene()};if($('#v3RoleFromDetail'))$('#v3RoleFromDetail').onclick=()=>{closeModal();openSettings('personal')};
if(s.video){const v=$('#v3Video');$('#v3VideoReplay').onclick=()=>{v.currentTime=0;v.play().catch(()=>{})};v.onerror=()=>{$('#v3VideoError').textContent='视频暂时无法播放，请确认文件完整或使用支持 MP4 的浏览器。'};return}
const phases=ma?[['识别','理解自然语言中的明确需求'],['拆解','按领域组织多个意图与依赖'],['执行','介绍协同执行与确认机制'],['记忆','展示偏好规划，不写入真实个人记忆']]:[['场景触发',s.automation?.trigger||s.description],['理解需求',s.automation?.actions[0]||'理解本次表达，明确所需能力'],['执行与确认',s.automation?.actions.slice(1).join('，')||'必要时先确认，再按可用能力处理'],['结果反馈','返回明确结果，支持取消或继续表达']];
player={time:0,running:false,timer:null};const paint=()=>{if(!player)return;const n=Math.min(3,Math.floor(player.time/5));$('#v3FrameTitle').textContent=phases[n][0];$('#v3FrameText').textContent=phases[n][1];$('#v3Seek').value=player.time;$('#v3Time').textContent='00:'+String(Math.floor(player.time)).padStart(2,'0')+' / 00:20';$('#v3Play').textContent=player.running?'暂停':player.time>=20?'重播':'播放';$('.v3DemoVisual').classList.toggle('playing',player.running)};
const play=()=>{if(player.time>=20)player.time=0;player.running=!player.running;paint()};$('#v3Play').onclick=play;$('#v3Replay').onclick=()=>{player.time=0;player.running=true;paint()};$('#v3Seek').oninput=e=>{player.time=Number(e.target.value);paint()};player.timer=setInterval(()=>{if(player?.running){player.time=Math.min(20,player.time+.1);if(player.time===20)player.running=false;paint()}},100);
}
function triggerType(s){return s.triggerType||(/工作日|每天|点|早上|晚上|周末/.test(s.trigger)?'时间':/附近|到达|途经|地点/.test(s.trigger)?'地点':/上车|离车|驻车|锁车|车门/.test(s.trigger)?'车辆状态':/检测|雨|雾|温度/.test(s.trigger)?'环境感知':'其他')}
function managed(){return S.services.filter(s=>!s.template&&!s.legacyHidden&&(presetIds.has(s.id)||s.source==='我的场景')&&(S.loggedIn||s.source!=='我的场景'))}
function renderManager(){if(!$('#v3Grid'))return;const grid=$('#v3Grid'),oldRects={};grid.querySelectorAll('[data-id]').forEach(el=>oldRects[el.dataset.id]=el.getBoundingClientRect());ui.usage=ui.usage||{};const usage=id=>ui.usage[id]||0;let all=managed(),q=ui.search.trim().toLowerCase(),list=all.filter(s=>(!q||[s.name,s.trigger,...s.actions].join(' ').toLowerCase().includes(q))&&(!ui.source||(ui.source==='preset')===(s.source==='iCAR 官方')));list=list.map((s,i)=>({s,i})).sort((a,b)=>((b.s.enabled?1:0)-(a.s.enabled?1:0))||(usage(b.s.id)-usage(a.s.id))||(a.i-b.i)).map(x=>x.s);document.querySelectorAll('[data-source3]').forEach(b=>b.classList.toggle('active',ui.source===b.dataset.source3));const pc=$('#v3PresetCount'),cc=$('#v3CustomCount');if(pc)pc.textContent=all.filter(x=>x.source==='iCAR 官方').length+' 个场景';if(cc)cc.textContent=all.filter(x=>x.source!=='iCAR 官方').length+' 个场景';
$('#v3ManagerCount').innerHTML=`<span>${list.length} / ${all.length} 个场景</span>${!S.loggedIn?'<span>当前为访客，登录后恢复我创建的场景 <button onclick="loginFlow()">登录</button></span>':'<span>按条件触发 · 权限状态实时联动</span>'}`;
grid.innerHTML=list.map(s=>{const miss=depStatus(s),custom=s.source==='我的场景';return `<article class="v3ManageCard" data-id="${h(s.id)}"><div class="v3ManageArt"><img src="${h(managedCover(s))}" alt="${h(s.name)}场景封面" decoding="async"></div><header><span>${custom?'我创建的':'iCAR预设'}</span><button class="switch ${s.enabled?'on':''}" role="switch" aria-checked="${s.enabled}" aria-label="${h(s.name)}开关" data-toggle3="${h(s.id)}"><i></i></button></header><h3>${h(s.name)}</h3><dl><dt>${h(triggerType(s))}触发</dt><dd>${h(s.trigger)}</dd><dt>执行动作</dt><dd>${s.actions.map(h).join(' · ')}</dd></dl><footer><span class="${miss.length?'needs':''}">${miss.length?'需要 '+miss.join('、'):s.enabled?'已开启':'已关闭'}</span><button data-detail3="${h(s.id)}">${custom?'查看 / 编辑':'查看'} ↗</button></footer></article>`}).join('')||'<div class="v3Empty"><h2>没有匹配的场景</h2><p>试试其他关键词，或清除筛选后查看全部。</p><button onclick="const i=document.getElementById(\'v3Search\');i.value=\'\';i.dispatchEvent(new Event(\'input\'))">清除搜索</button></div>';if(!ui.paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)grid.querySelectorAll('[data-id]').forEach(el=>{const o=oldRects[el.dataset.id];if(!o)return;const n=el.getBoundingClientRect(),dx=o.left-n.left,dy=o.top-n.top;if(dx||dy)el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'})});}
let silentToggle=false;$('#v3Grid').onclick=e=>{let t=e.target.closest('[data-toggle3]'),d=e.target.closest('[data-detail3]');if(t){silentToggle=true;toggleService(t.dataset.toggle3);silentToggle=false}if(d)openScene(d.dataset.detail3)};
$('#v3Search').value=ui.search;$('#v3Search').addEventListener('input',e=>{ui.search=e.target.value;renderManager();remember()});
document.querySelectorAll('[data-source3]').forEach(b=>b.onclick=()=>{ui.source=ui.source===b.dataset.source3?'':b.dataset.source3;renderManager();remember()});
const priorToggle=toggleService;toggleService=function(id){const svc=S.services.find(x=>x.id===id);if(svc&&!svc.enabled){ui.usage=ui.usage||{};ui.usage[id]=(ui.usage[id]||0)+1;remember()}if(silentToggle){const _t=window.toast,_m=window.modal;window.toast=()=>{};window.modal=()=>{};try{priorToggle(id)}finally{window.toast=_t;window.modal=_m}if(typeof hideModalV11==='function')hideModalV11()}else priorToggle(id);renderManager()};
renderHome=function(){original.home()};renderServices=function(){original.services();renderManager()};
function setPaused(){if(ui.paused)document.getAnimations().forEach(a=>a.pause());else document.getAnimations().forEach(a=>a.play());document.body.classList.toggle('v3Paused',ui.paused);$('#v3Pause').textContent=ui.paused?'继续动效':'暂停动效';$('#v3Pause').setAttribute('aria-pressed',String(ui.paused));remember()};$('#v3Pause').onclick=()=>{ui.paused=!ui.paused;setPaused()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modalWrap').classList.contains('open'))closeModal()});
const priorSave=save;save=function(){S.services.forEach(s=>s.sceneId=s.id);priorSave()};
const priorLogout=logoutFlow;logoutFlow=function(){priorLogout();const action=window._confirm;if(action)window._confirm=()=>{action();go('discover')}};
window.ICAR_V3={openDetail,go,renderManager,catalog:ICAR_CATALOG};
renderDiscover();renderAll();setPaused();go(['discover','mine','settings'].includes(ui.page)?ui.page:'discover');
})();
