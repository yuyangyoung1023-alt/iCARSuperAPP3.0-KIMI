const { chromium } = require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { spawn } = require('child_process');
(async()=>{
  // 启动真实 dev-server（含 Range 支持）
  const srv=spawn('python3',['scripts/dev-server.py','--host','127.0.0.1','--port','8812'],{cwd:__dirname+'/..'});
  await new Promise(r=>{srv.stdout.on('data',d=>{if(String(d).includes('http'))r()});setTimeout(r,3000)});
  const issues=[];
  // 1) Range 请求必须返回 206
  const res=await fetch('http://127.0.0.1:8812/assets/videos/intro.mp4',{headers:{Range:'bytes=0-1023'}});
  console.log('range status:',res.status,'content-range:',res.headers.get('content-range'));
  if(res.status!==206)issues.push('no 206 for intro.mp4');
  const res2=await fetch('http://127.0.0.1:8812/assets/videos/'+encodeURIComponent('哨兵PLUS.mp4'),{headers:{Range:'bytes=0-1023'}});
  console.log('sentry range status:',res2.status);
  if(res2.status!==206)issues.push('no 206 for sentry mp4');
  // 2) 浏览器实测
  const browser=await chromium.launch({channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1512,height:982}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8812/',{waitUntil:'networkidle'});
  // intro 弹窗
  await page.click('.v3Voice.primary');
  await page.waitForSelector('#v3IntroVideo');
  const intro=await page.evaluate(async()=>{
    const v=document.getElementById('v3IntroVideo'),empty=document.getElementById('v3IntroEmpty');
    await new Promise(r=>{if(v.readyState>=2)r();else{v.onloadeddata=r;v.onerror=()=>r()};setTimeout(r,8000)});
    let playErr=null;try{await v.play();await new Promise(r=>setTimeout(r,1200))}catch(e){playErr=String(e)}
    return {readyState:v.readyState,duration:v.duration,hidden:v.hidden,emptyShown:empty&&!empty.hidden,playErr,paused:v.paused,ct:v.currentTime};
  });
  console.log('intro:',JSON.stringify(intro));
  if(intro.emptyShown||intro.readyState<2||intro.playErr||intro.paused)issues.push('intro playback: '+JSON.stringify(intro));
  await page.keyboard.press('Escape').catch(()=>{});
  await page.evaluate(()=>window.closeModal&&closeModal());
  // 哨兵详情视频
  await page.evaluate(()=>window.ICAR_V3.openDetail('sentry-plus'));
  await page.waitForSelector('#v3Video');
  const sentry=await page.evaluate(async()=>{
    const v=document.getElementById('v3Video');
    await new Promise(r=>{if(v.readyState>=2)r();else{v.onloadeddata=r;v.onerror=()=>r()};setTimeout(r,15000)});
    let playErr=null;try{await v.play();await new Promise(r=>setTimeout(r,1500))}catch(e){playErr=String(e)}
    const errText=document.getElementById('v3VideoError')?.textContent||'';
    return {readyState:v.readyState,duration:v.duration,playErr,paused:v.paused,ct:v.currentTime,errText,vw:v.videoWidth,vh:v.videoHeight};
  });
  console.log('sentry:',JSON.stringify(sentry));
  if(sentry.readyState<2||sentry.playErr||sentry.paused||sentry.errText)issues.push('sentry playback: '+JSON.stringify(sentry));
  await page.screenshot({path:'qa/kimi-audit/r8-sentry-video.png'});
  if(errors.length)issues.push('pageerrors: '+errors.join(';'));
  console.log('ISSUES:',JSON.stringify(issues));
  await browser.close();srv.kill();
})();
