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
function fit(){if(!ready)return;const area=document.getElementById('screen-area');const r=area.getBoundingClientRect();const w=display.width||240,h=display.height||320;const s=Math.min(r.width/w,r.height/h);display.style.width=Math.max(1,Math.floor(w*s))+'px';display.style.height=Math.max(1,Math.floor(h*s))+'px';}
window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
const codeFor=(key)=>({e:69,r:82,F1:112,F2:113,Enter:13,Backspace:8,ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39})[key]||codeMap[key]||(key.length===1?key.toUpperCase().charCodeAt(0):0);
const held=new Set();function push(key,down){const code=codeFor(key);if(!code)return;if(down&&held.has(key))return;if(!down&&!held.has(key))return;down?held.add(key):held.delete(key);queue.queueEvent({kind:down?'keydown':'keyup',args:[code,key.length===1?key:'\0',false,false]});}
for(const b of document.querySelectorAll('[data-key]')){
 const key=b.dataset.key;
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);b.classList.add('pressed');push(key,true)});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{e.preventDefault();b.classList.remove('pressed');push(key,false)});
}
window.addEventListener('keydown',e=>{if(e.target.matches?.('input,textarea'))return;const k=e.key.toLowerCase()==='e'?'e':e.key.toLowerCase()==='r'?'r':e.key;if(codeFor(k)){e.preventDefault();push(k,true)}});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase()==='e'?'e':e.key.toLowerCase()==='r'?'r':e.key;if(codeFor(k)){e.preventDefault();push(k,false)}});
window.addEventListener('blur',()=>{for(const k of [...held])push(k,false)});
// Map touch on game canvas to MIDP pointer coordinates.
let touchActive=false;function coords(e){let r=display.getBoundingClientRect();return{x:Math.max(0,Math.min(display.width-1,Math.floor((e.clientX-r.left)*display.width/r.width))),y:Math.max(0,Math.min(display.height-1,Math.floor((e.clientY-r.top)*display.height/r.height)))}};
display.addEventListener('pointerdown',e=>{e.preventDefault();touchActive=true;display.setPointerCapture(e.pointerId);queue.queueEvent({kind:'pointerpressed',...coords(e)})});
display.addEventListener('pointermove',e=>{if(touchActive)queue.queueEvent({kind:'pointerdragged',...coords(e)})});
for(const ev of ['pointerup','pointercancel'])display.addEventListener(ev,e=>{if(touchActive){touchActive=false;queue.queueEvent({kind:'pointerreleased',...coords(e)})}});
function error(e){console.error(e);const msg=String(e?.message||e);loading.style.display='none';document.getElementById('errorText').textContent='Lỗi Java ME: '+msg;document.getElementById('diag').classList.add('show')}
async function start(){
try{
 status('1/3 • Khởi tạo CheerpJ…');
 if(typeof cheerpjInit!=='function')throw Error('Không tải được CheerpJ loader (cần Internet).');
 await cheerpjInit({enableDebug:false,natives:{...canvasFontNatives,...canvasGraphicsNatives,...gles2Natives,...jsReferenceNatives,...mediaBridgeNatives,...midiBridgeNatives,...wsBridgeNatives,
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setTitle(lib,title){document.title=String(title)+' — NQSHVN'},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setIcon(lib,iconBytes){},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_getScreenCtx(lib){return ctx},
  async Java_pl_zb3_freej2me_bridge_shell_Shell_setCanvasSize(lib,w,h){display.width=w;display.height=h;ctx.imageSmoothingEnabled=false;display.style.display='block';ready=true;loading.style.display='none';document.body.classList.add('playing');fit()},
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
 status('3/3 • Khởi động NQSHVN…');
 const System=await lib.java.lang.System;
 await System.setProperty('freej2me.width','240');await System.setProperty('freej2me.height','320');
 await System.setProperty('freej2me.fps','30');await System.setProperty('freej2me.sound','off');
 const FreeJ2ME=await lib.org.recompile.freej2me.FreeJ2ME;
 FreeJ2ME.main(['jar','/app/NQSHVN-FULL.jar']).catch(error);
}catch(e){error(e)}}
start();
