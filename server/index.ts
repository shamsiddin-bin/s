import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import sharp from 'sharp';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {createStorage} from './storage';
import {handle,type Env} from '../lib/backend';
import {bindSource,passwordHash,ApiError} from '../lib/security';
const production=process.env.NODE_ENV==='production';const port=Number(process.env.PORT||3000);
const origin=process.env.APP_URL||process.env.RENDER_EXTERNAL_URL||`http://localhost:${port}`;
const url=new URL(origin);if(production&&url.protocol!=='https:')throw Error('Production uchun APP_URL=https://sizning-saytingiz kerak.');
if(process.env.RENDER&&!process.env.DATA_DIR)throw Error('Render uchun DATA_DIR va persistent disk sozlang.');
const storage=createStorage(process.env.DATA_DIR||'./data');
const existing=storage.sql.prepare("SELECT value FROM settings WHERE id='password'").get() as any;
if(!existing){let initial=process.env.INITIAL_ADMIN_HASH||'';if(!initial&&process.env.ADMIN_PASSWORD){if(process.env.ADMIN_PASSWORD.length<12)throw Error('ADMIN_PASSWORD kamida 12 belgi bo‘lsin.');initial=passwordHash(process.env.ADMIN_PASSWORD)}if(!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(initial))throw Error('Admin paroli sozlanmagan. npm run setup ni bajaring yoki ADMIN_PASSWORD ni sozlang.');storage.sql.prepare("INSERT INTO settings (id,value) VALUES ('password',?)").run(initial)}
const app=express();app.disable('x-powered-by');
// Only enable the known reverse-proxy topology. Never use trust proxy=true.
const hops=Number(process.env.TRUST_PROXY_HOPS||0);if(!Number.isInteger(hops)||hops<0||hops>3)throw Error('TRUST_PROXY_HOPS 0..3 bo‘lsin.');app.set('trust proxy',hops===0?false:hops);
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','blob:'],connectSrc:["'self'"],fontSrc:["'self'"],objectSrc:["'none'"],baseUri:["'self'"],frameAncestors:["'none'"],upgradeInsecureRequests:production?[]:null}},strictTransportSecurity:production?undefined:false}));
app.get('/healthz',(_req:any,res:any)=>{try{storage.sql.prepare('SELECT 1').get();res.json({ok:true})}catch{res.status(503).json({ok:false})}});
app.use('/api',express.raw({type:()=>true,limit:'5mb'}));
app.use('/api',async(req:any,res:any)=>{try{let bytes=req.body?.length?req.body:undefined;const headers=new Headers();for(const key of ['cookie','content-type','origin','x-csrf-token']){const value=req.get(key);if(value)headers.set(key,value)}
// Never forward client identity headers. Identity is injected from transport only.
const requestURL=url.origin+req.originalUrl;
// Local Vite dev proxy keeps its own same-origin Origin; only accept exact dev origins outside production.
if(!production&&['http://localhost:5173','http://127.0.0.1:5173','http://127.0.0.1:'+port].includes(headers.get('origin')||''))headers.set('origin',url.origin);
const request=new Request(requestURL,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:bytes});bindSource(request,req.ip||req.socket.remoteAddress);
const env:Env={DB:storage.DB as unknown as D1Database,BUCKET:{...storage.BUCKET,async put(key:string,data:Uint8Array){const mime=headers.get('content-type');const decoder=sharp(data,{limitInputPixels:25000000,failOn:'warning'});const meta=await decoder.metadata();const format=mime==='image/jpeg'?'jpeg':mime==='image/png'?'png':'webp';if(meta.format!==format)throw new ApiError(400,'Rasm formati mos emas.');const clean=await decoder.rotate().toFormat(format).toBuffer();return storage.BUCKET.put(key,clean)}} as unknown as R2Bucket};const result=await handle(request,env);res.status(result.status);result.headers.forEach((v,k)=>res.setHeader(k,v));res.send(Buffer.from(await result.arrayBuffer()));}catch(e){console.error('Request failed:',e instanceof Error?e.message:'error');res.status(400).json({error:'So‘rov yoki rasm noto‘g‘ri. Ma’lumotlarni tekshiring.'})}});
const client=resolve('dist/client');if(!existsSync(resolve(client,'index.html')))throw Error('Frontend tayyor emas. npm run build ni bajaring.');app.use(express.static(client,{index:false,maxAge:3600000}));app.get(['/', '/admin','/admin/'],(_req:any,res:any)=>res.sendFile(resolve(client,'index.html')));app.use((_req:any,res:any)=>res.status(404).send('Sahifa topilmadi.'));
app.use((err:any,_req:any,res:any,_next:any)=>res.status(err.status===413?413:400).json({error:err.status===413?'Fayl 5 MB dan kichik bo‘lsin.':'So‘rov noto‘g‘ri.'}));
const server=app.listen(port,'0.0.0.0',()=>console.log(`Portfolio: ${origin}\nAdmin panel: ${origin}/admin`));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>{storage.close();process.exit(0)}));
