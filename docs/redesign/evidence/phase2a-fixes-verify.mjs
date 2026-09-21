import { spawn } from "node:child_process";import{mkdirSync,writeFileSync}from"node:fs";
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';const PORT=9364;
const SP='C:/Users/Sajid/AppData/Local/Temp/claude/C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/c6ef8616-df74-46b1-9d32-459772a409c8/scratchpad';
const OUT='C:/Users/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase2a-fixes';
const B='http://127.0.0.1:1316';const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const proc=spawn(CHROME,['--headless=new',`--remote-debugging-port=${PORT}`,`--user-data-dir=${SP}/chrome-fx`,'--no-first-run','about:blank'],{stdio:'ignore'});
let ok=false;for(let i=0;i<90&&!ok;i++){try{ok=(await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok}catch{}if(!ok)await sleep(250)}
const t=await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));
let id=0;const pend=new Map();const hs=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result)}else if(m.method&&hs.has(m.method))hs.get(m.method).forEach(h=>h(m.params))});
const send=(M,P={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:M,params:P}))});
const on=(m,h)=>{if(!hs.has(m))hs.set(m,[]);hs.get(m).push(h)};
const once=(m,to=40000)=>new Promise(r=>{const x=setTimeout(()=>r(null),to);on(m,p=>{clearTimeout(x);r(p)})});
await send('Page.enable');await send('Runtime.enable');
const ev=async x=>(await send('Runtime.evaluate',{expression:x,returnByValue:true})).result.value;
const cap=async f=>{const c=await send('Page.captureScreenshot',{format:'jpeg',quality:90});mkdirSync(OUT,{recursive:true});writeFileSync(f,Buffer.from(c.data,'base64'))};
const go=async(w,h,theme,mobile)=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile,screenWidth:w,screenHeight:h});
 await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
 const l=once('Page.loadEventFired');await send('Page.navigate',{url:B+'/'});await l;await sleep(2400)};
const tab=async()=>{await send('Input.dispatchKeyEvent',{type:'rawKeyDown',windowsVirtualKeyCode:9,code:'Tab',key:'Tab'});
 await send('Input.dispatchKeyEvent',{type:'char',text:'\t'});
 await send('Input.dispatchKeyEvent',{type:'keyUp',windowsVirtualKeyCode:9,code:'Tab',key:'Tab'});await sleep(180)};
const R={};
// 1. mobile nav open, pointer (active state only, no focus ring)
await go(390,844,'light',true);
await ev(`document.getElementById('nav-toggle').click()`);await sleep(1200);
await ev(`if(document.activeElement)document.activeElement.blur()`);await sleep(400);
await cap(`${OUT}/nav-open-390x844-light-chromium.jpg`);
R.activeOnly=await ev(`(()=>{const a=document.querySelector('#nav-menu .nav-link.active');const s=getComputedStyle(a);
 return JSON.stringify({txt:a.textContent.trim(),color:s.color,boxShadow:s.boxShadow,outline:s.outlineStyle,
  traceH:getComputedStyle(a,'::before').height,traceW:getComputedStyle(a,'::before').width,
  nodeH:getComputedStyle(a,'::after').height,bg:s.backgroundColor})})()`);
// 2. mobile nav open, keyboard focus on an item (focus + active distinct)
await go(390,844,'light',true);
let g=0,f=false;while(!f&&g++<12){await tab();f=await ev(`document.activeElement&&document.activeElement.id==='nav-toggle'`)}
await send('Input.dispatchKeyEvent',{type:'rawKeyDown',windowsVirtualKeyCode:13,code:'Enter',key:'Enter'});
await send('Input.dispatchKeyEvent',{type:'char',text:'\r'});
await send('Input.dispatchKeyEvent',{type:'keyUp',windowsVirtualKeyCode:13,code:'Enter',key:'Enter'});await sleep(1000);
await tab(); // move focus to Research: focus != active, both visible at once
await sleep(500);
await cap(`${OUT}/nav-open-focus-390x844-light-chromium.jpg`);
R.focusVsActive=await ev(`(()=>{const fo=document.activeElement;const ac=document.querySelector('#nav-menu .nav-link.active');
 const fs=getComputedStyle(fo);const as=getComputedStyle(ac);
 return JSON.stringify({focused:fo.textContent.trim(),focusOutline:fs.outlineStyle+' '+fs.outlineWidth+' '+fs.outlineColor,
  focusOffset:fs.outlineOffset,focusBg:fs.backgroundColor,focusVisible:fo.matches(':focus-visible'),
  active:ac.textContent.trim(),activeColor:as.color,activeBg:as.backgroundColor,distinct:fo!==ac})})()`);
// 3. mobile dark
await go(390,844,'dark',true);
await ev(`document.getElementById('nav-toggle').click()`);await sleep(1200);
await ev(`if(document.activeElement)document.activeElement.blur()`);await sleep(400);
await cap(`${OUT}/nav-open-390x844-dark-chromium.jpg`);
// 4. Research anchor landing, 1440 dark
await go(1440,900,'dark',false);
await ev(`location.hash='#research'`);await sleep(1600);
await cap(`${OUT}/anchor-research-1440x900-dark-chromium.jpg`);
// 5. mid-scroll: heading passing under the (now opaque) header
await go(1440,900,'dark',false);
await ev(`window.scrollTo(0,1500)`);await sleep(1200);
await cap(`${OUT}/header-midscroll-1440x900-dark-chromium.jpg`);
await go(1440,900,'light',false);
await ev(`window.scrollTo(0,1500)`);await sleep(1200);
await cap(`${OUT}/header-midscroll-1440x900-light-chromium.jpg`);
// 6. overflow sweep
R.overflow=[];
for(const [w,h,th] of [[1920,1080,'light'],[1440,900,'light'],[1280,800,'light'],[1024,768,'light'],[768,1024,'light'],[430,932,'light'],[390,844,'light'],[1440,900,'dark'],[390,844,'dark']]){
 await go(w,h,th,w<1024);
 R.overflow.push(await ev(`JSON.stringify({vp:'${w}x${h} ${th}',scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1,headerH:Math.round(document.getElementById('site-header').getBoundingClientRect().height)})`));
}
// 7. desktop focus still visible
await go(1440,900,'light',false);
for(let i=0;i<4;i++)await tab();
R.desktopFocus=await ev(`(()=>{const a=document.activeElement;const s=getComputedStyle(a);
 return JSON.stringify({txt:a.textContent.trim(),outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor,offset:s.outlineOffset,fv:a.matches(':focus-visible')})})()`);
await cap(`${OUT}/focus-desktop-1440x900-light-chromium.jpg`);
console.log(JSON.stringify(R,null,1));
try{await fetch(`http://127.0.0.1:${PORT}/json/close`)}catch{}
proc.kill();
