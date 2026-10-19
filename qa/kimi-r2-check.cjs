const {chromium}=require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('http');
const {readFileSync,writeFileSync,mkdirSync}=require('fs');
const {join,extname}=require('path');
const ROOT=join(__dirname,'..'), OUT=join(ROOT,'qa','kimi-audit');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{try{let f=join(ROOT,decodeURIComponent(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';const d=readFileSync(f);res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});res.end(d)}catch(e){if(!res.headersSent){res.writeHead(404);res.end()}}});
(async()=>{await new Promise(r=>srv.listen(8798,'127.0.0.1',r));mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
const p=await b.newPage({viewport:{width:1600,height:900},serviceWorkers:'block',deviceScaleFactor:1.5});
const issues=[];
p.on('pageerror',e=>issues.push('PAGEERROR: '+e.message));
const f404=[];p.on('response',r=>{if(r.status()===404)f404.push(r.url())});
await p.goto('http://127.0.0.1:8798/index.html');await p.waitForTimeout(2500);
await p.screenshot({path:join(OUT,'r2-discover.png')});
// 1. three video cards show new covers
const coversOk=await p.evaluate(()=>['find-car','parking-pay','sentry-plus'].map(id=>{const img=document.querySelector(`[data-scene3="${id}"] img`);return img&&img.complete&&img.naturalWidth>0&&img.src.includes(id==='sentry-plus'?'sentry':id)}));
if(coversOk.some(x=>!x))issues.push('video card covers broken: '+coversOk);
// 4. category switch triggers car+dog animations
await p.locator('[data-category3="fun"]').click();await p.waitForTimeout(120);
const anims=await p.evaluate(()=>document.getAnimations().map(a=>({t:a.effect.target.className||a.effect.target.id})).filter(a=>/v25|corgi/.test(a.t)).length);
if(anims<2)issues.push('category switch: car/dog animations='+anims);
await p.waitForTimeout(1200);
await p.screenshot({path:join(OUT,'r2-fun.png')});
// 2. mine page structure
await p.evaluate(()=>ICAR_V3.go('mine'));await p.waitForTimeout(1100);
const mine=await p.evaluate(()=>({
  sourceCards:document.querySelectorAll('.v3SourceCard').length,
  hasPresetsBtn:!!document.getElementById('v3Presets'),
  hasDropdowns:!!document.getElementById('v3Source')||!!document.getElementById('v3Status')||!!document.getElementById('v3Trigger'),
  searchPh:document.getElementById('v3Search')?.placeholder||'',
  order:[...document.querySelectorAll('.v3ManageCard')].map(c=>({name:c.querySelector('h3').textContent,on:c.querySelector('.switch').classList.contains('on')})),
}));
if(mine.sourceCards!==2)issues.push('source cards != 2');
if(mine.hasPresetsBtn)issues.push('添加预设 button still present');
if(mine.hasDropdowns)issues.push('dropdown filters still present');
if(!/名称/.test(mine.searchPh))issues.push('search placeholder not name-search');
const enabledFirst=mine.order.every((c,i,arr)=>!c.on?arr.slice(i).every(x=>!x.on):true);
if(!enabledFirst)issues.push('enabled-first sort violated: '+JSON.stringify(mine.order.map(o=>o.on)));
await p.screenshot({path:join(OUT,'r2-mine.png')});
// toggle: turn off the first enabled card -> should move after enabled group
const before=mine.order.findIndex(c=>c.on);
const firstOnName=mine.order[before]?.name;
await p.evaluate(()=>document.querySelector('.v3ManageCard .switch.on').click());await p.waitForTimeout(500);
await p.evaluate(()=>{const w=document.getElementById('modalWrap');if(w&&w.classList.contains('open'))closeModal()});await p.waitForTimeout(500);
const after=await p.evaluate(()=>[...document.querySelectorAll('.v3ManageCard')].map(c=>({name:c.querySelector('h3').textContent,on:c.querySelector('.switch').classList.contains('on')})));
const idx=after.findIndex(c=>c.name===firstOnName);
const lastOnIdx=after.reduce((m,c,i)=>c.on?i:m,-1);
if(idx<=lastOnIdx)issues.push(`toggled-off card "${firstOnName}" at ${idx} not after last enabled (${lastOnIdx})`);
// source card filter
await p.evaluate(()=>document.querySelector('[data-source3="custom"]').click());await p.waitForTimeout(500);
const customOnly=await p.evaluate(()=>[...document.querySelectorAll('.v3ManageCard header span')].every(s=>s.textContent==='我创建的'));
if(!customOnly)issues.push('我的创建 filter broken');
await p.screenshot({path:join(OUT,'r2-mine-custom.png')});
await p.evaluate(()=>document.querySelector('[data-source3="custom"]').click());await p.waitForTimeout(400);
// 3. settings nav
await p.evaluate(()=>ICAR_V3.go('settings'));await p.waitForTimeout(900);
const nav=await p.evaluate(()=>[...document.querySelectorAll('.v3SettingsNav button')].map(b=>b.textContent));
if(JSON.stringify(nav)!==JSON.stringify(['我的记忆','我的智能代理','语音与唤醒','账号','隐私与权限']))issues.push('settings nav mismatch: '+nav);
await p.screenshot({path:join(OUT,'r2-settings-voice.png')});
for(const key of ['memory','personal','account','privacy']){
  await p.evaluate(k=>document.querySelector(`[data-set3="${k}"]`).click(),key);await p.waitForTimeout(700);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('#settings .content .page')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id));
  const expect=key==='account'||key==='privacy'?'page-privacy':'page-'+key;
  if(vis.length!==1||vis[0]!==expect)issues.push(`settings ${key} shows ${vis}`);
}
await p.screenshot({path:join(OUT,'r2-settings-privacy.png')});
// 5. background
const bg=await p.evaluate(()=>getComputedStyle(document.querySelector('.app'),':before').backgroundImage);
if(!bg.includes('pavilion-min'))issues.push('background not swapped: '+bg.slice(0,120));
console.log('404s:',JSON.stringify([...new Set(f404)]));
console.log('ISSUES:',JSON.stringify(issues,null,1));
writeFileSync(join(OUT,'r2-check.json'),JSON.stringify({issues,f404:[...new Set(f404)],order:after},null,1));
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
