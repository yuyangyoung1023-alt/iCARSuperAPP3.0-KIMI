const {chromium}=require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('http');
const {readFileSync,existsSync,mkdirSync}=require('fs');
const {join,extname}=require('path');
const ROOT=join(__dirname,'..'), OUT=join(ROOT,'qa','kimi-audit');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{try{let f=join(ROOT,decodeURIComponent(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';const data=readFileSync(f);if(!res.headersSent){res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});res.end(data)}}catch(e){try{if(!res.headersSent){res.writeHead(404);res.end()}}catch{}}});
(async()=>{await new Promise(r=>srv.listen(8791,'127.0.0.1',r));mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
const p=await b.newPage({viewport:{width:1600,height:900},serviceWorkers:'block',deviceScaleFactor:2});
const errors=[];p.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE: '+m.text())});
await p.goto('http://127.0.0.1:8791/index.html');await p.waitForTimeout(2500);
await p.screenshot({path:join(OUT,'discover-smart.png')});
// car bounding box check
const car=await p.evaluate(()=>{const img=document.querySelector('.v25');const r=img.getBoundingClientRect();const sr=img.closest('.v3Showroom').getBoundingClientRect();const cs=getComputedStyle(img);return{imgRect:r.toJSON(),showroom:sr.toJSON(),clipPath:cs.clipPath,mask:cs.maskImage,natural:[img.naturalWidth,img.naturalHeight]}});
console.log('CAR:',JSON.stringify(car,null,1));
// each category
for(const c of ['fun','car','travel','life','entertainment']){await p.locator(`[data-category3="${c}"]`).click();await p.waitForTimeout(900);await p.screenshot({path:join(OUT,`discover-${c}.png`)})}
// smart expanded
await p.locator('[data-category3="smart"]').click();await p.waitForTimeout(600);await p.locator('#v3More').click();await p.waitForTimeout(700);await p.screenshot({path:join(OUT,'discover-smart-more.png')});
// mine
await p.evaluate(()=>ICAR_V3.go('mine'));await p.waitForTimeout(900);await p.screenshot({path:join(OUT,'mine.png',)});
// settings
await p.evaluate(()=>ICAR_V3.go('settings'));await p.waitForTimeout(900);await p.screenshot({path:join(OUT,'settings.png')});
// card cover inventory: which scenes use photo covers vs placeholder art
const covers=await p.evaluate(()=>{const out={};for(const s of ICAR_CATALOG.scenes)out[s.sceneId]={cat:s.category,name:s.name,cover:s.cover||null};return out});
require('fs').writeFileSync(join(OUT,'covers.json'),JSON.stringify(covers,null,1));
console.log('ERRORS:',JSON.stringify(errors));
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
