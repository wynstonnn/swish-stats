import { test } from 'node:test';
import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';
import { Client } from 'pg';
import { databaseConfig } from '../lib/database';
import { supabaseRootCA } from '../lib/supabase-ca';

test('Supabase pooler keeps certificate verification through pg URI parsing',()=>{
 for(const mode of ['require','verify-full','disable','no-verify']){
  const config=databaseConfig(`postgresql://postgres.example:fake%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=${mode}`);
  const client=new Client(config);
  const params=(client as any).connectionParameters;
  assert.equal(params.ssl.ca,supabaseRootCA);
  assert.equal(params.ssl.rejectUnauthorized,true);
  assert.equal(params.password,'fake!');
  assert.equal(params.host,'aws-0-ap-northeast-2.pooler.supabase.com');
  assert.equal(params.port,6543);
 }
});

test('Supabase direct endpoints use the official CA; unrelated servers keep their own configuration',()=>{
 const config=databaseConfig('postgresql://postgres:fake@db.example.supabase.co:5432/postgres?sslmode=require');
 assert.equal((config.ssl as any).rejectUnauthorized,true);
 assert.equal((config.ssl as any).ca,supabaseRootCA);
 const local='postgresql://postgres:fake@localhost:5432/postgres?sslmode=disable';
 assert.equal(databaseConfig(local).connectionString,local);
 assert.equal(databaseConfig(local).ssl,undefined);
});

test('certificate overrides survive conflicting URI SSL settings and preserve other parameters',()=>{
 const config=databaseConfig('postgresql://postgres:fake@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?ssl=true&sslmode=require&sslrootcert=wrong&sslcert=wrong&sslkey=wrong&uselibpqcompat=true&application_name=SWISH','custom\\nCA');
 const url=new URL(config.connectionString!);
 assert.equal(url.searchParams.get('application_name'),'SWISH');
 const params=(new Client(config) as any).connectionParameters;
 assert.equal(params.ssl.ca,'custom\nCA');
 assert.equal(params.ssl.rejectUnauthorized,true);
});

test('bundled certificate is the authenticated Supabase trust anchor and is current',()=>{
 const ca=new X509Certificate(supabaseRootCA);
 assert.equal(ca.ca,true);
 assert.equal(ca.fingerprint256,'80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA');
 assert(ca.verify(ca.publicKey));
 assert(new Date(ca.validTo).getTime()>Date.now());
});
