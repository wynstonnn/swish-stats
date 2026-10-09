import {ApiError,identity,sameOrigin,reply,cookie,device} from './auth';
import {validateGame} from './game-entry';
import {database} from './database';
import {getLiveSheet} from './google-sheet';
import {communityApi} from './community-api';
export function playerStats(raw:Record<string,any[]>){const allowed={Player_Roster:['A','B','C','D'],Player_Data:['A','B','C','D','E','F','I','J','K','L','M','N','O','V','W','Z','AA','AB','AC','AD','AE','AF','AG','AH','AI'],Games:['A','C','D','E','F','G','H'],Shot_Data:[]};return Object.fromEntries(Object.entries(allowed).map(([tab,cols])=>[tab,(raw[tab]||[]).map(r=>Object.fromEntries(cols.filter(c=>r[c]!==undefined).map(c=>[c,r[c]])))]));}
const communityPaths=['community','predictions','check-ins','films','films/delete','awards','awards/delete','lineup-stints','lineup-stints/delete','notes'];
export async function portableApi(request:Request,services:{DB?:any;identity?:typeof identity;live?:typeof getLiveSheet}={}){try{
sameOrigin(request);const path=new URL(request.url).pathname.replace(/^\/api\//,''),method=request.method;
if(path==='game-worksheet'&&method==='POST')return reply({game:validateGame(await request.json())});
const DB=services.DB!==undefined?services.DB:process.env.DATABASE_URL?database():null;
if(path==='auth/unlock')return reply({error:'The clubhouse is open to everyone. PIN access has been removed.'},410);
if(path==='games')return reply({error:'Google Sheet writes have been removed. Export a Game Worksheet and update the source sheet directly.'},410);
if(path==='films'||path==='films/delete')return reply({error:'Film Room clips are published with the site. Use the catalogue editor and export.'},410);
if(path==='auth/sign-out'&&method==='POST')return cookie(reply({ok:true}),'swish_staff','',request);
const user=await (services.identity||identity)(request);
if(path==='auth/me'&&method==='GET'){const r=reply({...user,backendReady:!!DB});if(process.env.CLUBHOUSE_SESSION_SECRET||process.env.STAFF_SESSION_SECRET){const d=device(request);if(d.new)cookie(r,'swish_device',d.token,request,31536000)}return r;}
if(path==='live-sheet'&&method==='GET'){const result=await (services.live||getLiveSheet)(DB,fetch,new URL(request.url).searchParams.get('refresh')==='now');return reply({...result,raw:playerStats(result.raw as any),sheetUrl:result.sheetUrl});}
if(communityPaths.includes(path)){

if(path==='predictions'&&method==='POST'&&DB?.transaction)return await DB.transaction((tx:any)=>communityApi(request,path,user,tx),'swish-sheet:'+(process.env.GOOGLE_SHEET_ID||'1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI'));
if(path==='lineup-stints'&&method==='POST'&&DB?.transaction)return await DB.transaction((tx:any)=>communityApi(request,path,user,tx),'swish-lineup-writes');
return await communityApi(request,path,user,DB) || reply({error:'Unknown endpoint.'},404);
}
if(path==='setup'&&method==='GET'){let connected=false;try{if(DB){await DB.prepare('SELECT id FROM game_submissions LIMIT 1').all();await DB.prepare('SELECT id FROM check_ins LIMIT 1').all();connected=true;}}catch{}return reply({database:connected,databaseConfigured:!!DB,googleWrite:false,access:'open',statsMode:'read-only',filmMode:'published',sessionSecret:!!(process.env.CLUBHOUSE_SESSION_SECRET||process.env.STAFF_SESSION_SECRET),sheetId:process.env.GOOGLE_SHEET_ID||'1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI'});}
return reply({error:'This endpoint is unavailable.'},404);
}catch(e){if(e instanceof ApiError)return reply({error:e.message},e.status);if(e instanceof SyntaxError)return reply({error:'Check the submitted form.'},400);console.error('SWISH request failed',e instanceof Error?e.message:'Unknown error');return reply({error:'The clubhouse could not complete this request. Your input is retained; try again. Check Setup if the backend is not connected.'},503);}}
