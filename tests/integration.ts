import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync,readdirSync,mkdtempSync,rmSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handle} from '../lib/backend';
import {passwordHash,bindSource} from '../lib/security';
const folder=mkdtempSync(join(tmpdir(),'portfolio-test-'));const dbfile=join(folder,'test.sqlite');let sqlite=new DatabaseSync(dbfile);
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
class Statement{sql:string;values:any[]=[];constructor(sql:string){this.sql=sql}bind(...args:any[]){this.values=args;return this}async first(){return sqlite.prepare(this.sql).get(...this.values)||null}async all(){return{results:sqlite.prepare(this.sql).all(...this.values)}}async run(){const r=sqlite.prepare(this.sql).run(...this.values);return{meta:{changes:Number(r.changes)}}}}
const DB={prepare:(s:string)=>new Statement(s),async batch(stmts:Statement[]){sqlite.exec('BEGIN');try{const result=[];for(const stmt of stmts)result.push({meta:{changes:Number(sqlite.prepare(stmt.sql).run(...stmt.values).changes)}});sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const blobs=new Map();const BUCKET={async put(k:string,v:any,meta:any){blobs.set(k,{body:v,...meta})},async get(k:string){return blobs.get(k)}};
const env:any={DB,BUCKET,INITIAL_ADMIN_HASH:passwordHash('testing-secure-password')};let now=1900000000000;let cookie='',csrf='';
async function req(path:string,method='GET',body?:any,source='owner',headers:any={}){const request=new Request('https://test.site/api/'+path,{method,headers:{Origin:'https://test.site','Content-Type':'application/json',...(source?{'oai-authenticated-user-id':source,'oai-authenticated-user-email':source+'@test.site'}:{}),Cookie:cookie,'x-csrf-token':csrf,...headers},body:body===undefined?undefined:body instanceof Uint8Array?body as any:JSON.stringify(body)});if(source)bindSource(request,source);const r=await handle(request,env,now);const result:any=r.headers.get('content-type')?.includes('json')?await r.json():await r.arrayBuffer();return{status:r.status,data:result,cookie:r.headers.get('set-cookie')}}
try{
assert.equal((await req('admin/data')).status,401);
assert.equal((await req('login','POST',{password:'wrong'},'')).status,401);
for(let i=0;i<3;i++){const r=await req('login','POST',{password:'wrong'});assert.equal(r.status,i===2?429:401);assert.equal(r.data.remaining,2-i)}
let state=await req('login-state');assert.equal(state.data.blockedUntil,now+3600000);
assert.equal((await req('login','POST',{password:'testing-secure-password'})).status,429);
assert.equal((await req('login','POST',{password:'testing-secure-password'},'other')).status,200);
sqlite.close();sqlite=new DatabaseSync(dbfile);assert.equal((await req('login-state')).data.blockedUntil,now+3600000);
now+=3599999;assert.equal((await req('login','POST',{password:'testing-secure-password'})).status,429);
now+=1;let login=await req('login','POST',{password:'testing-secure-password'});assert.equal(login.status,200);cookie=login.cookie!.split(';')[0];csrf=login.data.csrf;
let data=await req('admin/data');assert.equal(data.status,200);assert.equal(data.data.projects.length,0);
assert.equal((await req('admin/profile','PUT',data.data.profile,'owner',{'x-csrf-token':'bad'})).status,403);
assert.equal((await req('admin/profile','PUT',data.data.profile,'owner',{Origin:'https://evil.test'})).status,403);
const profile={...data.data.profile,intro:'Updated profile',telegram:'https://t.me/example'};assert.equal((await req('admin/profile','PUT',profile)).status,200);assert.equal((await req('public')).data.profile.intro,'Updated profile');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=','base64');let upload=await req('admin/upload','POST',png,'owner',{'Content-Type':'image/png'});assert.equal(upload.status,201);
assert.equal((await req('admin/upload','POST',new TextEncoder().encode('<svg onload="alert(1)">bad</svg>'),'owner',{'Content-Type':'image/svg+xml'})).status,400);
const project={title:'Test',summary:'A project',description:'Complete details',technologies:'React',image:upload.data.url,live:'https://example.com',github:'',position:2,published:1};assert.equal((await req('admin/projects','POST',project)).status,200);let projectId=(await req('admin/data')).data.projects[0].id;
assert.equal((await req('public')).data.projects.length,1);assert.equal((await req(upload.data.url.slice(5))).status,200);
assert.equal((await req('admin/projects/'+projectId,'PUT',{...project,title:'Changed',position:0,published:0})).status,200);assert.equal((await req('public')).data.projects.length,0);
assert.equal((await req('admin/projects','POST',{...project,live:'javascript:alert(1)'})).status,400);
assert.equal((await req('admin/projects/'+projectId,'DELETE')).status,200);
const service={title:'Test service',description:'Useful service',price:'Kelishiladi',position:3,published:1};assert.equal((await req('admin/services','POST',service)).status,200);const sid=(await req('admin/data')).data.services.find((s:any)=>s.title===service.title).id;assert.equal((await req('admin/services/'+sid,'PUT',{...service,price:'100 so‘m',position:0})).status,200);assert.equal((await req('public')).data.services.find((s:any)=>s.id===sid).price,'100 so‘m');
let challenge=(await req('challenge')).data.challenge;now+=3000;const order={id:crypto.randomUUID(),name:'Test customer',phone:'+998 (90) 123-45-67',message:'Please build my website',challenge,website:''};assert.equal((await req('orders','POST',order,'anonymous-ip')).status,201);assert.equal((await req('orders','POST',order,'anonymous-ip')).status,200);assert.equal((await req('admin/data')).data.orders.length,1);
assert.equal((await req('admin/orders/'+order.id,'PUT',{status:'Jarayonda'})).status,200);assert.equal((await req('admin/data')).data.orders[0].status,'Jarayonda');
const oldCookie=cookie;await req('admin/logout','POST',{});assert.equal((await req('admin/data')).status,401);
login=await req('login','POST',{password:'testing-secure-password'});cookie=login.cookie!.split(';')[0];csrf=login.data.csrf;
assert.equal((await req('admin/password','POST',{current:'testing-secure-password',password:'new-secure-password-123',confirm:'new-secure-password-123'})).status,200);assert.equal((await req('admin/data')).status,401);assert.equal((await req('login','POST',{password:'testing-secure-password'})).status,401);assert.equal((await req('login','POST',{password:'new-secure-password-123'})).status,200);
const concurrent=await Promise.all([req('login','POST',{password:'bad'},'race'),req('login','POST',{password:'bad'},'race')]);assert.ok(concurrent.some(r=>r.status===429));assert.equal((await req('login-state','GET',undefined,'race')).data.remaining,2);
console.log('PASS: lockout, exact expiry, restart persistence, independent sources, concurrent leases, sessions, CSRF, profile, images, projects, services, orders, logout, password invalidation.');
}finally{sqlite.close();rmSync(folder,{recursive:true,force:true})}
