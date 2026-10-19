const {chromium}=require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('http');
const {readFileSync,writeFileSync,mkdirSync}=require('fs');
const {join,extname}=require('path');
const ROOT=join(__dirname,'..'), OUT=join(ROOT,'qa','kimi-audit');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml'};
const srv=createServer((req,res)=>{try{let f=join(ROOT,decodeURIComponent(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';const d=readFileSync(f);res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});res.end(d)}catch(e){if(!res.headersSent){res.writeHead(404);res.end()}}});
(async()=>{await new Promise(r=>srv.listen(8802,'127.0.0.1',r));mkdirSync(join(OUT,'r3-frames'),{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
const p=await b.newPage({viewport:{width:1600,height:900},serviceWorkers:'block',deviceScaleFactor:1});
const issues=[];
p.on('pageerror',e=>issues.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:8802/index.html');await p.waitForTimeout(2600);
// capture motion frames across a category switch
await p.evaluate(()=>document.querySelector('[data-category3="travel"]').click());
for(let i=0;i<10;i++){await p.screenshot({path:join(OUT,'r3-frames',String(i).padStart(2,'0')+'.png')});await p.waitForTimeout(110)}
await p.waitForTimeout(800);
// count animations triggered on car & dog right after another switch
await p.evaluate(()=>document.querySelector('[data-category3="life"]').click());
await p.waitForTimeout(60);
const animInfo=await p.evaluate(()=>{
  const targets=document.getAnimations().map(a=>{const t=a.effect.target;return (t.className&&t.className.baseVal!==undefined?t.className.baseVal:t.className)||t.id||t.tagName});
  return {total:document.getAnimations().length,onCarDog:targets.filter(t=>/v25|corgi/.test(t)).length,onCards:targets.filter(t=>/v3Card/.test(t)).length,onRings:targets.filter(t=>/platformRing/.test(t)).length,onSweep:targets.filter(t=>/v3Sweep/.test(t)).length,onHero:targets.filter(t=>/heroCopy|v3Eyebrow|v3Voice/.test(t)).length};
});
console.log('animations on switch:',JSON.stringify(animInfo));
if(animInfo.onCarDog<3)issues.push('car/dog animations too few: '+animInfo.onCarDog);
if(animInfo.onCards<5)issues.push('card stagger missing: '+animInfo.onCards);
if(animInfo.onRings<2)issues.push('platform pulse missing');
if(animInfo.onSweep<1)issues.push('sweep missing');
// mine: silent toggle -> no toast, no modal
await p.waitForTimeout(1400);
await p.evaluate(()=>ICAR_V3.go('mine'));await p.waitForTimeout(1000);
await p.evaluate(()=>document.querySelector('.v3ManageCard .switch').click());await p.waitForTimeout(700);
const silent=await p.evaluate(()=>({modal:document.getElementById('modalWrap').className,toast:document.getElementById('toast').className}));
console.log('after toggle:',JSON.stringify(silent));
if(/open/.test(silent.modal))issues.push('modal opened on toggle');
if(/show/.test(silent.toast))issues.push('toast shown on toggle');
// reorder still works (toggled-off moves behind enabled)
const order=await p.evaluate(()=>[...document.querySelectorAll('.v3ManageCard')].map(c=>c.querySelector('.switch').classList.contains('on')));
const lastOn=order.reduce((m,v,i)=>v?i:m,-1);
if(order.some((v,i)=>v&&i>lastOn))issues.push('enabled-first order broken');
// detail view still opens modal
await p.evaluate(()=>document.querySelector('[data-detail3]').click());await p.waitForTimeout(700);
const modalOpen=await p.evaluate(()=>document.getElementById('modalWrap').className);
if(!/open/.test(modalOpen))issues.push('查看 did not open modal');
await p.evaluate(()=>closeModal());
console.log('ISSUES:',JSON.stringify(issues,null,1));
writeFileSync(join(OUT,'r3-check.json'),JSON.stringify({issues,animInfo,silent},null,1));
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
