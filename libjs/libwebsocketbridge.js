// WebSocket transport for FreeJ2ME Java socket bridge.
// Requires /ws server (see server.py). Netlify Drop alone cannot provide it.
const sockets=new Map();let idSeq=1;
export default {
  async Java_org_recompile_mobile_WebSocketBridge_connect(lib,host,port){
    const addr=typeof host==='string'?host:String(await host?.toString?.()||'');
    const proto=location.protocol==='https:'?'wss:':'ws:';
    const url=`${proto}//${location.host}/ws?host=${encodeURIComponent(addr)}&port=${encodeURIComponent(port)}`;
    return await new Promise((resolve,reject)=>{
      const ws=new WebSocket(url);ws.binaryType='arraybuffer';
      const s={ws,queue:[],offset:0,wait:null,closed:false};
      ws.onopen=()=>{const id=idSeq++;sockets.set(id,s);console.info('[NQSHVN] TCP bridge connected',addr,port);resolve(id)};
      ws.onerror=()=>{s.closed=true;s.wait?.();console.error('[NQSHVN] WebSocket bridge failed:',url);reject(Error('Không kết nối được TCP proxy /ws. Hãy chạy bản V7 trên hosting Python, không phải Netlify Drop.'))};
      ws.onclose=()=>{s.closed=true;s.wait?.()};
      ws.onmessage=e=>{if(e.data instanceof ArrayBuffer){s.queue.push(new Uint8Array(e.data));s.wait?.();s.wait=null}}
    });
  },
  Java_org_recompile_mobile_WebSocketBridge_send(lib,id,data,offset,length){const s=sockets.get(id);if(!s||s.ws.readyState!==1)throw Error('Socket disconnected');const arr=new Uint8Array(length);for(let i=0;i<length;i++)arr[i]=data[offset+i]&255;s.ws.send(arr)},
  async Java_org_recompile_mobile_WebSocketBridge_read(lib,id,out,offset,length){const s=sockets.get(id);if(!s)return -1;while(!s.queue.length){if(s.closed)return -1;await new Promise(r=>s.wait=r)}const chunk=s.queue[0],count=Math.min(length,chunk.length-s.offset);for(let i=0;i<count;i++)out[offset+i]=chunk[s.offset+i];s.offset+=count;if(s.offset>=chunk.length){s.queue.shift();s.offset=0}return count},
  Java_org_recompile_mobile_WebSocketBridge_close(lib,id){const s=sockets.get(id);if(s){s.closed=true;s.ws.close();s.wait?.();sockets.delete(id)}}
};
