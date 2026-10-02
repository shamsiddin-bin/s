interface D1PreparedStatement {bind(...values:any[]):D1PreparedStatement; first<T=Record<string,unknown>>():Promise<T|null>; all<T=Record<string,unknown>>():Promise<{results:T[]}>; run():Promise<{meta:{changes:number}}>}
interface D1Database {prepare(query:string):D1PreparedStatement;batch(statements:D1PreparedStatement[]):Promise<unknown[]>}
interface R2Bucket {put(key:string,data:Uint8Array,options?:unknown):Promise<unknown>;get(key:string):Promise<{body:BodyInit;httpMetadata?:{contentType?:string}}|null>}
