const {chromium}=require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('http');
const {readFileSync,writeFileSync,mkdirSync}=require('fs');
const {join,extname}=require('path');
const ROOT=join(__dirname,'..'), OUT=join(ROOT,'qa','kimi-audit');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{try{let f=join(ROOT,decodeURIComponent(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';const d=readFileSync(f);res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});res.end(d)}catch(e){if(!res.headersSent){res.writeHead(404);res.end()}}});
(async()=>{await new Promise(r=>srv.listen(8796,'127.0.0.1',r));mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
const p=await b.newPage({viewport:{width:1600,height:900},serviceWorkers:'block',deviceScaleFactor:1.5});
const bad=[];const failed404=[];
p.on('response',r=>{if(r.status()===404)failed404.push(r.url())});
p.on('pageerror',e=>bad.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:8796/index.html');await p.waitForTimeout(2500);
const checkImgs=async(label)=>{const r=await p.evaluate(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')));if(r.length)bad.push(label+' broken imgs: '+r.join(','));return r.length};
// all six categories
for(const c of ['smart','fun','car','travel','life','entertainment']){
  await p.locator(`[data-category3="${c}"]`).click();await p.waitForTimeout(1000);
  await checkImgs('discover-'+c);
  await p.screenshot({path:join(OUT,'final-'+c+'.png')});
}
// smart expanded
await p.locator('[data-category3="smart"]').click();await p.waitForTimeout(500);
await p.locator('#v3More').click();await p.waitForTimeout(900);
await checkImgs('smart-more');
await p.screenshot({path:join(OUT,'final-smart-more.png')});
// detail modal (MA card) + video card
await p.locator('[data-category3="car"]').click();await p.waitForTimeout(800);
await p.locator('[data-scene3="ma-car"]').click();await p.waitForTimeout(800);
await checkImgs('detail-ma-car');
await p.screenshot({path:join(OUT,'final-detail-ma.png')});
const intents=await p.locator('.v3Intents li').count();
if(intents!==10)bad.push('MA intents != 10: '+intents);
await p.evaluate(()=>closeModal());await p.waitForTimeout(300);
await p.locator('[data-category3="smart"]').click();await p.waitForTimeout(600);
await p.locator('[data-scene3="sentry-plus"]').click();await p.waitForTimeout(800);
const hasVideo=await p.locator('.v3Detail video, dialog video').count();
await p.screenshot({path:join(OUT,'final-detail-sentry.png')});
await p.evaluate(()=>closeModal());await p.waitForTimeout(300);
// mine
await p.evaluate(()=>ICAR_V3.go('mine'));await p.waitForTimeout(1200);
await checkImgs('mine');
await p.screenshot({path:join(OUT,'final-mine.png')});
const mineCards=await p.locator('.v3ManageCard').count();
// search & filter
await p.locator('#v3Search').fill('停车');await p.waitForTimeout(400);
const searchCount=await p.locator('.v3ManageCard').count();
await p.evaluate(()=>{const i=document.getElementById('v3Search');i.value='';i.dispatchEvent(new Event('input'))});await p.waitForTimeout(300);
// settings
await p.evaluate(()=>ICAR_V3.go('settings'));await p.waitForTimeout(900);
await p.screenshot({path:join(OUT,'final-settings.png')});
const settings=await p.evaluate(()=>{const r=document.querySelector('#settings').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,iw:innerWidth,ih:innerHeight}});
if(settings.x!==0||settings.y!==0||settings.w!==settings.iw||settings.h!==settings.ih)bad.push('settings not fullscreen: '+JSON.stringify(settings));
// multi-res car completeness: verify car painted bottom sits below platform top and above viewport
for(const [w,h] of [[1280,720],[1920,1080],[1512,982],[2560,1080]]){
  await p.setViewportSize({width:w,height:h});
  await p.evaluate(()=>ICAR_V3.go('discover'));await p.waitForTimeout(1200);
  const car=await p.evaluate(()=>{const img=document.querySelector('.v25');const r=img.getBoundingClientRect();const cs=getComputedStyle(img);return{top:r.top,bottom:r.bottom,clip:cs.clipPath,mask:cs.maskImage,vh:innerHeight}});
  if(car.bottom>car.vh+1)bad.push(`${w}x${h} car bottom ${car.bottom} > viewport ${car.vh}`);
  if(car.clip!=='none'||car.mask!=='none')bad.push(`${w}x${h} clip/mask still applied`);
}
console.log('mineCards:',mineCards,'search停车:',searchCount);
console.log('404s:',JSON.stringify([...new Set(failed404)]));
console.log('ISSUES:',JSON.stringify(bad,null,1));
writeFileSync(join(OUT,'final-check.json'),JSON.stringify({mineCards,searchCount,failed404:[...new Set(failed404)],issues:bad},null,1));
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
