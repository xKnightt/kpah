// NQSHVN Direct Web player - new minimal integration for FreeJ2ME-Web.
// Core JNI interfaces follow the FreeJ2ME-Web API. No cross-origin iframe.
import { LibMedia } from '../libmedia/libmedia.js';
import { codeMap } from './key.js';
import { EventQueue } from './eventqueue.js';
import canvasFontNatives from '../libjs/libcanvasfont.js';
import canvasGraphicsNatives from '../libjs/libcanvasgraphics.js';
import gles2Natives from '../libjs/libgles2.js';
import jsReferenceNatives from '../libjs/libjsreference.js';
import mediaBridgeNatives from '../libjs/libmediabridge.js';
import midiBridgeNatives from '../libjs/libmidibridge.js';
import wsBridgeNatives from '../libjs/libwebsocketbridge.js';

const display=document.getElementById('display');
const loading=document.getElementById('loading');
const progress=document.getElementById('loadingStep');
const status=t=>{progress.textContent=t;console.log('[NQSHVN]',t)};
const queue=new EventQueue();window.evtQueue=queue;window.soundEnabled=false;window.libmidi=null;window.libmedia=new LibMedia();
const ctx=display.getContext('2d',{alpha:false,desynchronized:true});ctx.imageSmoothingEnabled=false;
let ready=false;
// Fill the available game viewport. Java ME now renders at 360x480, target 30 FPS.
function fit(){
 if(!ready)return;
 const area=document.getElementById('screen-area');
 display.style.width='100%';
 display.style.height='100%';
}
window.addEventListener('resize',fit);
window.visualViewport?.addEventListener('resize',fit);
// MIDP phone special keys: STAR=42, POUND=35. Never alias them to E/R.
const codeFor=(key)=>({'*':42,'#':35,'F1':112,'F2':113,Enter:13,Backspace:8,ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39})[key]??codeMap[key]??(key.length===1?key.toUpperCase().charCodeAt(0):0);
const held=new Set();
function push(key,down){
 const code=codeFor(key);if(!code)return;
 if(down&&held.has(key))return;if(!down&&!held.has(key))return;
 down?held.add(key):held.delete(key);
 queue.queueEvent({kind:down?'keydown':'keyup',args:[code,key.length===1?key:'\\0',false,false]});
}
function bindControlButtons(){
 for(const b of document.querySelectorAll('#hud [data-key]')){
  if(b.dataset.bound==='1')continue;b.dataset.bound='1';
  const key=b.dataset.key;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);b.classList.add('pressed');push(key,true)});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{e.preventDefault();b.classList.remove('pressed');push(key,false)});
 }
}
function renderKeyLayout(){
 const hud=document.getElementById('hud');
 const layout=localStorage.getItem('nqshvn-key-layout')||'minimal';
 hud.classList.toggle('full',layout==='full');
 if(layout==='full'){
  hud.innerHTML='<button class="k soft" data-key="F1" aria-label="Phím chức năng trái">L</button><button class="k" data-key="ArrowUp" aria-label="Lên">▲</button><button class="k soft" data-key="F2" aria-label="Phím chức năng phải">R</button>'+
   '<button class="k" data-key="ArrowLeft" aria-label="Trái">◀</button><button class="k ok" data-key="Enter" aria-label="OK">OK</button><button class="k" data-key="ArrowRight" aria-label="Phải">▶</button>'+
   '<button class="k soft" data-key="*" aria-label="Phím sao">*</button><button class="k" data-key="ArrowDown" aria-label="Xuống">▼</button><button class="k soft" data-key="#" aria-label="Phím thăng">#</button>';
 }else{
  hud.innerHTML='<button class="k soft" data-key="*" aria-label="Phím sao">*</button><button class="k soft" data-key="#" aria-label="Phím thăng">#</button>';
 }
 bindControlButtons();
}
renderKeyLayout();
window.addEventListener('keydown',e=>{if(e.target.matches?.('input,textarea'))return;const k=e.key==='*'?'*':e.key==='#'?'#':e.key;if(codeFor(k)){e.preventDefault();push(k,true)}});
window.addEventListener('keyup',e=>{const k=e.key==='*'?'*':e.key==='#'?'#':e.key;if(codeFor(k)){e.preventDefault();push(k,false)}});
window.addEventListener('blur',()=>{for(const k of [...held])push(k,false)});
// iOS suspends PWAs when sent to background; JavaScript cannot force execution there.
// On return, release stale inputs, refresh the canvas layout and restore focus.
let backgroundedAt=0;
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){backgroundedAt=Date.now();for(const k of [...held])push(k,false);return;}
 requestAnimationFrame(()=>{fit();display.focus({preventScroll:true});});
});
window.addEventListener('pageshow',()=>requestAnimationFrame(()=>{fit();display.focus({preventScroll:true});}));
window.addEventListener('focus',()=>requestAnimationFrame(()=>{fit();display.focus({preventScroll:true});}));
// Map touch on game canvas to MIDP pointer coordinates.
let touchActive=false;function coords(e){let r=display.getBoundingClientRect();return{x:Math.max(0,Math.min(display.width-1,Math.floor((e.clientX-r.left)*display.width/r.width))),y:Math.max(0,Math.min(display.height-1,Math.floor((e.clientY-r.top)*display.height/r.height)))}};
display.addEventListener('pointerdown',e=>{e.preventDefault();touchActive=true;display.setPointerCapture(e.pointerId);queue.queueEvent({kind:'pointerpressed',...coords(e)})});
display.addEventListener('pointermove',e=>{if(touchActive)queue.queueEvent({kind:'pointerdragged',...coords(e)})});
for(const ev of ['pointerup','pointercancel'])display.addEventListener(ev,e=>{if(touchActive){touchActive=false;queue.queueEvent({kind:'pointerreleased',...coords(e)})}});
function error(e){console.error(e);const msg=String(e?.message||e);loading.style.display='none';document.getElementById('errorText').textContent='Lỗi Java ME: '+msg;document.getElementById('diag').classList.add('show')}
const DB_NAME='nqshvn-local-jars-v1', STORE='jars';
function openJarDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbAll(){const db=await openJarDB();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
async function dbPut(item){const db=await openJarDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function dbDelete(id){const db=await openJarDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
let selectedJar=null;
const picker=document.getElementById('jarPicker'), list=document.getElementById('jarList'), launchBtn=document.getElementById('startGame');
function safeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
async function renderJarList(){const items=await dbAll();list.innerHTML='';if(!items.length){list.innerHTML='<div style="padding:12px;border-radius:9px;background:#0b1320;color:#9eacc0;font-size:12px">Chưa có JAR. Hãy thêm file từ thiết bị.</div>';selectedJar=null;launchBtn.disabled=true;launchBtn.textContent='CHỌN JAR ĐỂ CHƠI';return;}
 for(const item of items){const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;padding:10px;background:#0b1320;border:1px solid #30435d;border-radius:9px';const radio=document.createElement('input');radio.type='radio';radio.name='selectedJar';radio.value=item.id;radio.checked=selectedJar===item.id;radio.addEventListener('change',()=>{selectedJar=item.id;launchBtn.disabled=false;launchBtn.textContent='CHƠI: '+item.name;});const label=document.createElement('div');label.style.cssText='flex:1;min-width:0;font-size:12px;overflow-wrap:anywhere';label.innerHTML='<b>'+safeText(item.name)+'</b><div style="color:#91a3bd">'+(item.size/1048576).toFixed(2)+' MB</div>';const del=document.createElement('button');del.textContent='Xóa';del.style.cssText='border:0;border-radius:7px;padding:7px 9px;background:#472b35;color:#ffdce2';del.addEventListener('click',async()=>{await dbDelete(item.id);if(selectedJar===item.id)selectedJar=null;renderJarList();});row.append(radio,label,del);list.append(row);}
 if(!selectedJar||!items.some(x=>x.id===selectedJar))selectedJar=items[0].id;const r=[...list.querySelectorAll('input')].find(x=>x.value===selectedJar);if(r)r.checked=true;launchBtn.disabled=false;launchBtn.textContent='CHƠI: '+items.find(x=>x.id===selectedJar).name;
}
picker.addEventListener('change',async()=>{for(const f of picker.files||[]){if(!f.name.toLowerCase().endsWith('.jar'))continue;if(f.size>100*1024*1024){alert('File vượt quá 100 MB: '+f.name);continue;}const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random();await dbPut({id,name:f.name,size:f.size,blob:f,lastUsed:Date.now()});selectedJar=id;}picker.value='';await renderJarList();});
renderJarList().catch(e=>{document.getElementById('jarNote').textContent='Không mở được bộ nhớ JAR: '+e.message;});
launchBtn.addEventListener('click',async()=>{const items=await dbAll();const item=items.find(x=>x.id===selectedJar);if(!item)return;const bytes=new Uint8Array(await item.blob.arrayBuffer());document.getElementById('launcher').style.display='none';document.getElementById('screen-area').style.display='flex';document.getElementById('loading').style.display='block';renderKeyLayout();start(item.name,bytes);});
const screenSettingsBtn=document.getElementById('screenSettingsBtn'),keySettingsBtn=document.getElementById('keySettingsBtn');
screenSettingsBtn.addEventListener('click',()=>document.getElementById('screenSettings').classList.toggle('open'));
keySettingsBtn.addEventListener('click',()=>document.getElementById('keySettings').classList.toggle('open'));
const jarWidthInput=document.getElementById('jarWidth'),jarHeightInput=document.getElementById('jarHeight');
const keyLayout=document.getElementById('keyLayout'),saveResolution=document.getElementById('saveResolution');
jarWidthInput.value=localStorage.getItem('nqshvn-width')||'360';
jarHeightInput.value=localStorage.getItem('nqshvn-height')||'480';
keyLayout.value=localStorage.getItem('nqshvn-key-layout')||'minimal';
saveResolution.addEventListener('click',()=>{
 const w=Number(jarWidthInput.value),h=Number(jarHeightInput.value);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<120||h<120||w>1200||h>1600){alert('W phải từ 120–1200 và H từ 120–1600 pixel.');return;}
 localStorage.setItem('nqshvn-width',String(w));localStorage.setItem('nqshvn-height',String(h));
 saveResolution.textContent='Đã lưu ✓';setTimeout(()=>saveResolution.textContent='Lưu kích thước',1400);
});
keyLayout.addEventListener('change',()=>{localStorage.setItem('nqshvn-key-layout',keyLayout.value);renderKeyLayout();});

async function start(jarName,jarBytes){
try{
 status('1/3 • Khởi tạo CheerpJ…');
 if(typeof cheerpjInit!=='function')throw Error('Không tải được CheerpJ loader (cần Internet).');
 await cheerpjInit({enableDebug:false,natives:{...canvasFontNatives,...canvasGraphicsNatives,...gles2Natives,...jsReferenceNatives,...mediaBridgeNatives,...midiBridgeNatives,...wsBridgeNatives,
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setTitle(lib,title){document.title=String(title)+' — NQSHVN'},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setIcon(lib,iconBytes){},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_getScreenCtx(lib){return ctx},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setCanvasSize(lib,w,h){display.width=w;display.height=h;ctx.imageSmoothingEnabled=false;display.style.display='block';ready=true;loading.style.display='none';document.body.classList.add('playing');const hud=document.getElementById('hud');if(hud)hud.style.display='grid';fit()},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_waitForAndDispatchEvents(lib,listener){
   const KeyEvent=await lib.pl.zb3.freej2me.bridge.shell.KeyEvent;
   const PointerEvent=await lib.pl.zb3.freej2me.bridge.shell.PointerEvent;
   const e=await queue.waitForEvent();
   if(e.kind==='keydown')await listener.keyPressed(await new KeyEvent(...e.args));
   else if(e.kind==='keyup')await listener.keyReleased(await new KeyEvent(...e.args));
   else if(e.kind==='pointerpressed')await listener.pointerPressed(await new PointerEvent(e.x,e.y));
   else if(e.kind==='pointerdragged')await listener.pointerDragged(await new PointerEvent(e.x,e.y));
   else if(e.kind==='pointerreleased')await listener.pointerReleased(await new PointerEvent(e.x,e.y));
   else if(e.kind==='player-eom')await listener.playerEOM(e.player);
   else if(e.kind==='player-video-frame')await listener.playerVideoFrame(e.player);
  },
  async Java_pl_zb3_freej2me_bridge_shell_Shell_restart(lib){location.reload()},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_exit(lib){location.reload()},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_sthop(lib){console.warn('J2ME pause')},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_say(lib,s){console.log('[J2ME]',s)},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_sayObject(lib,label,obj){console.log(label,obj)}
 }});
 status('2/3 • Tải FreeJ2ME runtime…');
 const lib=await cheerpjRunLibrary('/app/freej2me-web.jar');
 status('3/3 • Nạp '+jarName+'…');
 if(typeof cheerpOSAddStringFile!=='function')throw Error('Runtime không hỗ trợ nạp JAR từ thiết bị.');
 const safeJarName='selected-'+jarName.replace(/[^a-zA-Z0-9._-]/g,'_');
 cheerpOSAddStringFile('/str/'+safeJarName,jarBytes);
 const System=await lib.java.lang.System;
 const jarWidth=localStorage.getItem('nqshvn-width')||'360';
 const jarHeight=localStorage.getItem('nqshvn-height')||'480';
 await System.setProperty('freej2me.width',jarWidth);await System.setProperty('freej2me.height',jarHeight);
 await System.setProperty('freej2me.fps','30');await System.setProperty('freej2me.sound','off');
 const FreeJ2ME=await lib.org.recompile.freej2me.FreeJ2ME;
 FreeJ2ME.main(['jar','/str/'+safeJarName]).catch(error);
}catch(e){error(e)}}
