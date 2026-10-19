const { chromium } = require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('nf')}else{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(d)}});
});
(async()=>{
  await new Promise(r=>server.listen(8810,r));
  const browser=await chromium.launch({channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1512,height:982}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8810/',{waitUntil:'networkidle'});
  // 打开视频弹窗
  await page.click('.v3Voice.primary');
  await page.waitForSelector('#v3IntroVideo',{timeout:5000});
  await page.waitForTimeout(1500);
  const state=await page.evaluate(()=>{
    const v=document.getElementById('v3IntroVideo'),empty=document.getElementById('v3IntroEmpty');
    return {readyState:v.readyState,duration:v.duration,hidden:v.hidden,emptyHidden:empty?empty.hidden:null,vw:v.videoWidth,vh:v.videoHeight,src:v.currentSrc};
  });
  console.log('video state:',JSON.stringify(state));
  // 尝试播放 2 秒
  const play=await page.evaluate(async()=>{
    const v=document.getElementById('v3IntroVideo');
    try{await v.play();await new Promise(r=>setTimeout(r,2000));return {paused:v.paused,currentTime:v.currentTime}}catch(e){return {error:String(e)}}
  });
  console.log('play result:',JSON.stringify(play));
  await page.screenshot({path:'qa/kimi-audit/r7-video-playing.png'});
  // 关闭弹窗后应暂停
  await page.click('.modalWrap .modalClose, .v3IntroModal .modalClose').catch(()=>{});
  const issues=[];
  if(state.readyState<2)issues.push('video not loaded');
  if(!(state.duration>0))issues.push('no duration');
  if(play.error||play.paused||!(play.currentTime>0.5))issues.push('playback failed: '+JSON.stringify(play));
  if(errors.length)issues.push('pageerrors: '+errors.join(';'));
  console.log('ISSUES:',JSON.stringify(issues));
  await browser.close();server.close();
})();
