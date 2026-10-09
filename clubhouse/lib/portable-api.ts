import {ApiError,identity,requireStaff,sameOrigin,reply,unlockPin,cookie,device} from './auth';
import {database} from './database';
import {getLiveSheet} from './google-sheet';
import {validateGame,writeGame} from './game-entry';
import {communityApi} from './community-api';
import {googleRequest} from './sheets-client';
import {validatePlayer,writePlayer} from './roster-entry';
import {fields} from './sheet-fields';
export function playerStats(raw:Record<string,any[]>){const allowed={Player_Roster:['A','B','C','D'],Player_Data:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','V','W','X','Y','Z','AA','AB','AC','AD','AE','AF','AG','AH','AI','AL','AM'],Games:['A','C','D','E','F','G','H'],Shot_Data:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q']};return Object.fromEntries(Object.entries(allowed).map(([tab,cols])=>{const metadata=Object.keys(raw[tab]?.[0]||{}).filter(c=>Object.values(fields).includes(raw[tab][0][c]));return [tab,(raw[tab]||[]).map(r=>Object.fromEntries([...cols,...metadata].filter(c=>r[c]!==undefined).map(c=>[c,r[c]])))];}));}
const communityPaths=['community','predictions','award-votes','check-ins','films','films/delete','awards','awards/delete','lineup-stints','lineup-stints/delete','notes'];
export async function portableApi(request:Request,services:{DB?:any;identity?:typeof identity;live?:typeof getLiveSheet;write?:typeof writeGame;writeRoster?:typeof writePlayer}={}){try{
sameOrigin(request);const path=new URL(request.url).pathname.replace(/^\/api\//,''),method=request.method;
const DB=services.DB!==undefined?services.DB:process.env.DATABASE_URL?database():null;
if(path==='auth/unlock'&&method==='POST')return await unlockPin(request,DB);
if(path==='auth/sign-out'&&method==='POST')return cookie(reply({ok:true}),'swish_staff','',request);
const user=await (services.identity||identity)(request);
if(path==='auth/me'&&method==='GET'){const r=reply({...user,backendReady:!!DB});if(process.env.STAFF_SESSION_SECRET){const d=device(request);if(d.new)cookie(r,'swish_device',d.token,request,31536000)}return r;}
if(path==='live-sheet'&&method==='GET'){const result=await (services.live||getLiveSheet)(DB,fetch,new URL(request.url).searchParams.get('refresh')==='now');return reply({...result,raw:playerStats(result.raw as any),sheetUrl:user.role==='player'?null:result.sheetUrl});}
if(communityPaths.includes(path)){
if(!['community','predictions','award-votes'].includes(path))requireStaff(user);
if(path==='predictions'&&method==='POST'&&DB?.transaction)return await DB.transaction((tx:any)=>communityApi(request,path,user,tx),'swish-sheet:'+(process.env.GOOGLE_SHEET_ID||'1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI'));
if(path==='lineup-stints'&&method==='POST'&&DB?.transaction)return await DB.transaction((tx:any)=>communityApi(request,path,user,tx),'swish-lineup-writes');
return await communityApi(request,path,user,DB) || reply({error:'Unknown endpoint.'},404);
}
requireStaff(user);
if(path==='google-check'&&method==='GET'){const result=await googleRequest('?fields=spreadsheetId,properties(title),sheets(properties(sheetId,title))');return reply({ok:true,title:result.properties.title,message:'Google authorisation and sheet read verified. Editor permission is required; the first saved game verifies writes.'});}
if(path==='setup'&&method==='GET'){let connected=false;try{if(DB){await DB.prepare('SELECT id FROM game_submissions LIMIT 1').all();await DB.prepare('SELECT id FROM check_ins LIMIT 1').all();connected=true;}}catch{}return reply({database:connected,databaseConfigured:!!DB,googleWrite:!!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&process.env.GOOGLE_PRIVATE_KEY),googleEmail:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||null,staffPin:!!process.env.STAFF_PIN,sessionSecret:!!process.env.STAFF_SESSION_SECRET,sheetId:process.env.GOOGLE_SHEET_ID||'1Z3suEMnt_FnA0_umEG4E-Crxm52y0nmJSXyVCGi-AnI'});}
if(path==='roster'&&method==='POST'){if(!DB)throw new ApiError('Connect the Supabase database before adding players. See Setup.',503);return reply(await (services.writeRoster||writePlayer)(validatePlayer(await request.json())),201);}
if(path==='games'&&method==='POST'){if(!DB)throw new ApiError('Connect the Supabase database before saving games. See Setup.',503);return reply(await (services.write||writeGame)(validateGame(await request.json()),user.email),201);}
return reply({error:'This endpoint is unavailable.'},404);
}catch(e){if(e instanceof ApiError)return reply({error:e.message},e.status);if(e instanceof SyntaxError)return reply({error:'Check the submitted form.'},400);console.error('SWISH request failed',e instanceof Error?e.message:'Unknown error');return reply({error:'The clubhouse could not complete this request. Your input is retained; try again. Check Setup if the backend is not connected.'},503);}}
