import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const directory=mkdtempSync(join(tmpdir(),'portfolio-http-'));const origin=`http://localhost:${port}`;let child,cookie='',csrf='';let log='';
async function start(){child=spawn(process.execPath,['scripts/start.mjs'],{env:{...process.env,PORT:String(port),APP_URL:origin,NODE_ENV:'development',DATA_DIR:directory,ADMIN_PASSWORD:'smoke-test-password-123',INITIAL_ADMIN_HASH:'',TRUST_PROXY_HOPS:'0'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);for(let i=0;i<60;i++){try{if((await fetch(origin+'/healthz')).ok)return}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server did not start: '+log)}
async function stop(){if(!child||child.exitCode!==null)return;const done=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await done;}
async function api(path,method='GET',body,extra={}){const r=await fetch(origin+'/api/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'x-csrf-token':csrf,...extra},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});const data=r.headers.get('content-type')?.includes('json')?await r.json():await r.arrayBuffer();return{status:r.status,data,cookie:r.headers.get('set-cookie')}}
try{await start();assert.equal((await fetch(origin)).status,200);assert.equal((await fetch(origin+'/admin')).status,200);assert.equal((await api('admin/data')).status,401);
let r=await api('login','POST',{password:'smoke-test-password-123'});assert.equal(r.status,200);cookie=r.cookie.split(';')[0];csrf=r.data.csrf;
let profile=(await api('admin/data')).data.profile;const png=await sharp({create:{width:20,height:20,channels:3,background:'#aabbcc'}}).png().toBuffer();r=await api('admin/upload','POST',png,{'Content-Type':'image/png'});assert.equal(r.status,201);profile={...profile,photo:r.data.url,intro:'HTTP persistence verified'};assert.equal((await api('admin/profile','PUT',profile)).status,200);assert.equal((await api(profile.photo.slice(5))).status,200);
const challenge=(await api('challenge')).data.challenge;await new Promise(r=>setTimeout(r,2100));const order={id:crypto.randomUUID(),name:'Smoke test',phone:'+998 90 123 45 67',message:'Live HTTP smoke test order',challenge,website:''};assert.equal((await api('orders','POST',order)).status,201);
await stop();await start();assert.equal((await api('public')).data.profile.intro,'HTTP persistence verified');assert.equal((await api(profile.photo.slice(5))).status,200);assert.equal((await api('admin/data')).data.orders.length,1);
await api('admin/logout','POST',{});assert.equal((await api('admin/data')).status,401);
for(let i=0;i<3;i++)assert.equal((await api('login','POST',{password:'wrong'})).status,i===2?429:401);
await stop();await start();const forged={'X-Forwarded-For':'1.2.3.4','oai-authenticated-user-id':'forged-user','oai-authenticated-user-email':'fake@example.com'};assert.equal((await api('login','POST',{password:'smoke-test-password-123'},forged)).status,429);
assert.ok((await api('login-state')).data.blockedUntil>Date.now());console.log('PASS: actual HTTP startup, frontend/admin, authentication, image decode and disk persistence, order persistence, restart, logout, persistent lockout and forged-header rejection.');
}finally{await stop();rmSync(directory,{recursive:true,force:true})}
