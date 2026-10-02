import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
export function passwordHash(p:string){const salt=randomBytes(16).toString('hex');return `scrypt$${salt}$${scryptSync(p,salt,64,{N:16384,r:8,p:1}).toString('hex')}`;}
export function verifyPassword(p:string,h:string){try{const [kind,salt,key]=h.split('$');if(kind!=='scrypt'||!salt||key.length!==128)return false;return timingSafeEqual(scryptSync(p,salt,64,{N:16384,r:8,p:1}),Buffer.from(key,'hex'));}catch{return false;}}
export class ApiError extends Error{constructor(public status:number,message:string,public extra:Record<string,unknown>={}){super(message)}}
const identities=new WeakMap<Request,string>();
export function bindSource(req:Request,identity:string){identities.set(req,identity)}
export function trustedSource(req:Request){const identity=identities.get(req);if(!identity)throw new ApiError(401,'Kirish manbasi aniqlanmadi.');return hash(identity);}
export async function claimLogin(db:D1Database,source:string,now:number){const lease=token();await db.prepare('INSERT OR IGNORE INTO login_sources (id) VALUES (?)').bind(source).run();const row=await db.prepare('UPDATE login_sources SET lease=?,lease_until=? WHERE id=? AND lease_until<=? RETURNING *').bind(lease,now+30000,source,now).first<any>();if(!row)throw new ApiError(429,'Kirish tekshirilmoqda. Bir necha soniyadan so‘ng urinib ko‘ring.');if(row.blocked_until>now){await releaseLogin(db,source,lease);throw new ApiError(429,'3 marta noto‘g‘ri parol kiritildi. Kirish 1 soatga bloklandi.',{blockedUntil:row.blocked_until});}return{lease,failures:row.blocked_until?0:row.failures};}
export async function releaseLogin(db:D1Database,source:string,lease:string){await db.prepare('UPDATE login_sources SET lease=NULL,lease_until=0 WHERE id=? AND lease=?').bind(source,lease).run();}
export async function recordFailure(db:D1Database,source:string,lease:string,failures:number,now:number){const count=failures+1;const until=count>=3?now+3600000:0;await db.prepare('UPDATE login_sources SET failures=?,blocked_until=?,lease=NULL,lease_until=0 WHERE id=? AND lease=?').bind(count,until,source,lease).run();return{remaining:Math.max(0,3-count),blockedUntil:until};}
