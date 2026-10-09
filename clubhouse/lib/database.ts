import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { supabaseRootCA } from './supabase-ca';
let pool:Pool;
export function databaseConfig(connectionString:string,rootCA=process.env.DATABASE_SSL_CA):PoolConfig{
 const url=new URL(connectionString);
 const config:PoolConfig={connectionString,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000};
 if(url.hostname.endsWith('.pooler.supabase.com')||/^db\.[a-z0-9]+\.supabase\.co$/i.test(url.hostname)){
  // pg replaces an explicit ssl object when SSL parameters remain in the URI.
  // Supply trusted CA + certificate/hostname verification directly instead.
  for(const key of ['sslmode','sslrootcert','sslcert','sslkey','ssl','uselibpqcompat'])url.searchParams.delete(key);
  config.connectionString=url.toString();
  config.ssl={ca:rootCA?.replace(/\\n/g,'\n')||supabaseRootCA,rejectUnauthorized:true};
 }
 return config;
}
export function getPool(){if(!process.env.DATABASE_URL)throw Error('Supabase database is not configured.');return pool??=new Pool(databaseConfig(process.env.DATABASE_URL));}
// Compatibility with the existing clubhouse's parameterized SQL. No user SQL is accepted.
export function sqlParameters(sql:string){let i=0;return sql.replace(/\?/g,()=>`$${++i}`).replace('INSERT OR IGNORE INTO','INSERT INTO')+(sql.includes('INSERT OR IGNORE')?' ON CONFLICT DO NOTHING':'');}
export function database(client?:PoolClient){const executor=client||getPool();return {prepare(sql:string){let values:unknown[]=[];const statement={bind(...v:unknown[]){values=v;return statement},async first(){return (await executor.query(sqlParameters(sql),values)).rows[0]||null},async all(){return {results:(await executor.query(sqlParameters(sql),values)).rows}},async run(){const r=await executor.query(sqlParameters(sql),values);return {meta:{changes:r.rowCount||0}}}};return statement},async batch(statements:any[]){return Promise.all(statements.map(s=>s.all()))},async transaction(action:(db:any)=>Promise<any>,lock:string){const c=await getPool().connect();try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[lock]);const result=await action(database(c));await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}};}
