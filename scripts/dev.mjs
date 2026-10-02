import {spawn,spawnSync} from 'node:child_process';
const npm=process.platform==='win32'?'npm.cmd':'npm';const opts={stdio:'inherit',shell:process.platform==='win32'};const result=spawnSync(npm,['run','build'],opts);if(result.status!==0)process.exit(result.status||1);
const server=spawn(process.execPath,['scripts/start.mjs'],{stdio:'inherit'});const vite=spawn(npm,['exec','vite'],opts);
function stop(){server.kill();vite.kill()}process.on('SIGINT',stop);process.on('SIGTERM',stop);server.on('exit',()=>vite.kill());vite.on('exit',()=>server.kill());
