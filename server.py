"""Serve NQSHVN + Range-enabled assets + optional allowlisted WebSocket/TCP bridge.
Run: pip install aiohttp && python server.py
For iPhone on another network, deploy behind HTTPS reverse proxy and forward /ws.
"""
import asyncio, os, socket, time
from pathlib import Path
from aiohttp import web, WSMsgType

ROOT=Path(__file__).resolve().parent
PORT=int(os.environ.get('PORT','8000'))
# Prevent arbitrary DNS/IP TCP proxy usage. Override on deployment if game has other known servers.
ALLOWED_HOSTS={x.strip().lower() for x in os.getenv('ALLOWED_GAME_HOSTS','ip.nqshvn.com').split(',') if x.strip()}
ALLOWED_PORTS={int(x.strip()) for x in os.getenv('ALLOWED_GAME_PORTS','19129').split(',') if x.strip()}
_network_cache={'time':0,'data':None}


async def health(request):
    return web.json_response({'web':'ok','websocket_endpoint':'/ws','game_proxy':'enabled',
                              'allowed_game_hosts':sorted(ALLOWED_HOSTS),'allowed_game_ports':sorted(ALLOWED_PORTS)})

async def network_diagnostic(request):
    """Check the single, configured game destination; do not act as an open TCP probe."""
    if _network_cache['data'] and time.monotonic()-_network_cache['time']<30:
        return web.json_response(_network_cache['data'])
    host=sorted(ALLOWED_HOSTS)[0] if ALLOWED_HOSTS else ''
    port=sorted(ALLOWED_PORTS)[0] if ALLOWED_PORTS else 0
    result={'proxy':'online','destination':f'{host}:{port}','dns':'unknown','tcp':'unknown'}
    try:
        await asyncio.wait_for(asyncio.get_running_loop().getaddrinfo(host,port,type=socket.SOCK_STREAM),timeout=5)
        result['dns']='ok'
    except Exception as e:
        result['dns']='failed'
        result['detail']=f'DNS: {type(e).__name__}'
    if result['dns']=='ok':
        try:
            reader,writer=await asyncio.wait_for(asyncio.open_connection(host,port),timeout=6)
            result['tcp']='ok'
            writer.close();await writer.wait_closed()
        except Exception as e:
            result['tcp']='failed'
            result['detail']=f'TCP: {type(e).__name__}'
    _network_cache.update(time=time.monotonic(),data=result)
    return web.json_response(result,headers={'Cache-Control':'no-store'})

async def bridge(request):
    host=request.query.get('host','').strip().lower().rstrip('.')
    try:port=int(request.query.get('port','0'))
    except ValueError:raise web.HTTPBadRequest(text='Invalid port')
    if host not in ALLOWED_HOSTS or port not in ALLOWED_PORTS:
        raise web.HTTPForbidden(text='Game host/port not allowlisted')
    origin=request.headers.get('Origin','')
    if origin and origin.rstrip('/') != f'{request.scheme}://{request.host}':
        # Some managed reverse proxies use an internal scheme of http behind HTTPS; compare host only.
        from urllib.parse import urlsplit
        if urlsplit(origin).netloc != request.host:
            raise web.HTTPForbidden(text='Cross-origin WebSocket not allowed')
    try:
        reader,writer=await asyncio.wait_for(asyncio.open_connection(host,port),timeout=8)
    except Exception as e:
        raise web.HTTPBadGateway(text=f'Game server unavailable: {type(e).__name__}')
    ws=web.WebSocketResponse(heartbeat=20,max_msg_size=1024*1024)
    await ws.prepare(request)
    async def tcp_to_web():
        try:
            while True:
                data=await reader.read(65536)
                if not data:break
                await ws.send_bytes(data)
        finally:
            await ws.close()
    async def web_to_tcp():
        async for m in ws:
            if m.type==WSMsgType.BINARY:
                writer.write(m.data);await writer.drain()
            elif m.type in (WSMsgType.ERROR,WSMsgType.CLOSE):break
    tasks=[asyncio.create_task(tcp_to_web()),asyncio.create_task(web_to_tcp())]
    try:
        done,pending=await asyncio.wait(tasks,return_when=asyncio.FIRST_COMPLETED)
        for t in pending:t.cancel()
        await asyncio.gather(*tasks,return_exceptions=True)
    finally:
        writer.close()
        try:await writer.wait_closed()
        except Exception:pass
    return ws

async def files(request):
    p=request.match_info.get('path','') or 'index.html'
    path=(ROOT/p).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file() or path.name in {'server.py','requirements.txt','README.md'}:
        raise web.HTTPNotFound()
    response=web.FileResponse(path)
    response.headers['Cache-Control']='public, max-age=86400' if path.suffix in {'.jar','.js'} else 'no-cache'
    response.headers['X-Content-Type-Options']='nosniff'
    return response

app=web.Application()
app.router.add_get('/ws',bridge)
app.router.add_get('/api/health',health)
app.router.add_get('/api/network',network_diagnostic)
app.router.add_get('/{path:.*}',files)
if __name__=='__main__':web.run_app(app,host='0.0.0.0',port=PORT)
