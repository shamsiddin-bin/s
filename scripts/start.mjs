import 'dotenv/config';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {setup} from './setup.mjs';
if(!process.env.INITIAL_ADMIN_HASH&&!process.env.ADMIN_PASSWORD&&!existsSync((process.env.DATA_DIR||'data')+'/portfolio.sqlite')){if(!process.stdin.isTTY){console.error('Admin paroli kerak: npm run setup yoki ADMIN_PASSWORD muhit sozlamasi.');process.exit(1)}await setup();const dotenv=await import('dotenv');dotenv.config({override:true})}
if(!existsSync('dist/server.mjs')||!existsSync('dist/client/index.html')){console.log('Sayt birinchi marta tayyorlanmoqda…');const npm=process.platform==='win32'?'npm.cmd':'npm';const r=spawnSync(npm,['run','build'],{stdio:'inherit',shell:process.platform==='win32'});if(r.status!==0)process.exit(r.status||1)}
await import('../dist/server.mjs');
