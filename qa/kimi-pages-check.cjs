const { chromium } = require('/Users/yangyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1512,height:982}});
  const errors=[],notFound=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});
  await page.goto('https://yuyangyoung1023-alt.github.io/iCARSuperAPP3.0-KIMI/',{waitUntil:'networkidle',timeout:120000});
  // 封面破图检查
  const broken=await page.evaluate(()=>[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')));
  // 车模完整
  const car=await page.evaluate(()=>{const c=document.querySelector('.v25');const r=c.getBoundingClientRect();const cw=document.documentElement.clientWidth,ch=document.documentElement.clientHeight;return{ok:r.bottom<=ch+2&&r.right<=cw+2&&r.width>200,rect:[r.left|0,r.top|0,r.width|0,r.height|0]}});
  // 视频弹窗
  await page.click('.v3Voice.primary');
  await page.waitForSelector('#v3IntroVideo');
  const video=await page.evaluate(async()=>{
    const v=document.getElementById('v3IntroVideo'),e=document.getElementById('v3IntroEmpty');
    await new Promise(r=>{if(v.readyState>=2)r();else{v.onloadeddata=r;v.onerror=()=>r()};setTimeout(r,20000)});
    return {readyState:v.readyState,duration:v.duration,emptyShown:e&&!e.hidden};
  });
  await page.evaluate(()=>window.closeModal&&closeModal());
  // 哨兵详情视频
  await page.evaluate(()=>window.ICAR_V3.openDetail('sentry-plus'));
  await page.waitForSelector('#v3Video');
  const sentry=await page.evaluate(async()=>{
    const v=document.getElementById('v3Video');
    await new Promise(r=>{if(v.readyState>=2)r();else{v.onloadeddata=r;v.onerror=()=>r()};setTimeout(r,30000)});
    return {readyState:v.readyState,duration:v.duration,err:(document.getElementById('v3VideoError')||{}).textContent||''};
  });
  await page.screenshot({path:'qa/kimi-audit/pages-live.png'});
  const issues=[];
  if(broken.length)issues.push('broken imgs: '+broken.join(','));
  if(!car.ok)issues.push('car overflow: '+JSON.stringify(car));
  if(video.readyState<2||video.emptyShown)issues.push('intro video: '+JSON.stringify(video));
  if(sentry.readyState<2||sentry.err)issues.push('sentry video: '+JSON.stringify(sentry));
  if(errors.length)issues.push('pageerrors: '+errors.join(';'));
  const real404=notFound.filter(u=>!u.includes('intro.mp4'));
  if(real404.length)issues.push('404: '+real404.slice(0,3).join(','));
  console.log('car:',JSON.stringify(car));
  console.log('intro video:',JSON.stringify(video));
  console.log('sentry video:',JSON.stringify(sentry));
  console.log('ISSUES:',JSON.stringify(issues));
  await browser.close();
})();
