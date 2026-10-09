import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../lib/auth';
import { validatePlayer, rosterRequests, writePlayer } from '../lib/roster-entry';
import { fields, prepareFields } from '../lib/sheet-fields';
import { playerStats, portableApi } from '../lib/portable-api';

const fixture = () => ({id:'018de444-6e20-4f90-923f-6748a33b91ce',name:'New Player',position:'G / F',hand:'Right',divisions:['U18','U21']});
test('roster validation accepts multiple custom divisions and rejects reserved or malformed names',()=>{
  assert.deepEqual(validatePlayer({...fixture(),divisions:['Girls U16',"Women's Open"]}).divisions,['Girls U16',"Women's Open"]);
  for(const change of [{name:''},{name:'SWISH'},{id:'invalid'},{hand:'bad'},{divisions:['U18','u18']},{name:'A\nB'},{divisions:Array(11).fill('U18')}]) assert.throws(()=>validatePlayer({...fixture(),...change}),ApiError);
});
test('roster writes append safe metadata after private columns and never invent game appearances',()=>{
  const r:any[]=rosterRequests(validatePlayer({...fixture(),name:'=Not A Formula'}),{sheetId:3,gridProperties:{columnCount:8}},[{A:'Player Name',B:'Position',C:'Shoots',D:'Status',F:'Birth Year'},{A:'Old',H:'Private Note'}],'hash');
  assert.deepEqual(r[0],{appendDimension:{sheetId:3,dimension:'COLUMNS',length:1}});
  assert.equal(r[1].updateCells.start.columnIndex,8);
  const row=r.find(x=>x.updateCells?.start.rowIndex===1).updateCells.rows[0].values;
  assert.equal(row[0].userEnteredValue.stringValue,'=Not A Formula');assert.equal(row[3].userEnteredValue.stringValue,'Active');assert.deepEqual(row[5],{});
  assert.deepEqual(JSON.parse(row[8].userEnteredValue.stringValue),['U18','U21']);
  assert(r.every(x=>!x.insertDimension||x.insertDimension.range.sheetId===3));
});
test('existing metadata column is reused even when there are later unrelated fields',()=>{
  const layout=prepareFields([{A:'Player Name',E:fields.divisions,H:'Private Field'}],{sheetId:3,gridProperties:{columnCount:8}},[fields.divisions],4);
  assert.equal(layout.columns[fields.divisions],4);assert.deepEqual(layout.requests,[]);
});
function services(existingName='Old Player'){
  let marker='',writes=0,fail=true,released=0;const sql:string[]=[],batches:any[]=[];
  const client:any={query:async(s:string)=>{sql.push(s);return {rows:[],rowCount:1};},release(){released++;}};
  const pool:any={connect:async()=>client};
  const read:any=async()=>({Player_Roster:[{A:'Player Name',D:'Status'},{A:existingName}],Player_Data:[{}],Games:[{}]});
  const google:any=async(path:string,body:any)=>{if(path==='/developerMetadata:search')return {matchedDeveloperMetadata:marker?[{developerMetadata:{metadataValue:marker}}]:[]};if(path.startsWith('?fields='))return {sheets:[{properties:{title:'Player_Roster',sheetId:3,gridProperties:{columnCount:26}}}]};if(path===':batchUpdate'){writes++;batches.push(body);marker=body.requests.at(-1).createDeveloperMetadata.developerMetadata.metadataValue;if(fail){fail=false;throw new ApiError('Timeout',503);}return {};}throw Error(path);};
  return {pool,read,google,stats:()=>({writes,released,sql,batches})};
}
test('roster retry after an uncertain write uses its receipt, clears the cache and releases the lock',async()=>{
  const s=services(),p=validatePlayer(fixture());await assert.rejects(writePlayer(p,s));assert.equal(s.stats().writes,1);const result=await writePlayer(p,s);assert.equal(result.alreadySaved,true);assert.equal(s.stats().writes,1);assert.equal(s.stats().released,2);assert(s.stats().sql.some(x=>x.includes('pg_advisory_xact_lock')));assert(s.stats().sql.some(x=>x.includes('DELETE FROM dataset')));
  await assert.rejects(writePlayer({...p,position:'C'},s),(e:any)=>e.status===409);assert.equal(s.stats().writes,1);
});
test('case-insensitive duplicate roster names are blocked before a write',async()=>{const s=services('new player');await assert.rejects(writePlayer(validatePlayer(fixture()),s),(e:any)=>e.status===409);assert.equal(s.stats().writes,0);});
test('public stats include named SWISH metadata while excluding unrelated personal fields',()=>{
  const raw:any={Player_Roster:[{A:'Player Name',F:'Birth Year',H:fields.divisions},{A:'New Player',F:2010,H:'["U18"]'}],Games:[{K:fields.division,L:fields.tags,M:fields.gameId}],Player_Data:[{AK:fields.division,AL:fields.tags,AM:fields.gameId,AN:'Staff Remark'},{AK:'U18',AL:'["League"]',AM:'g1',AN:'Private'}]};
  const filtered=playerStats(raw);assert.equal(filtered.Player_Roster[1].H,'["U18"]');assert.equal(filtered.Player_Roster[1].F,undefined);assert.equal(filtered.Player_Data[1].AM,'g1');assert.equal(filtered.Player_Data[1].AN,undefined);
});
test('staff roster API validates input before passing it to the writer',async()=>{
  let called=false;const request=new Request('https://swish.example/api/roster',{method:'POST',headers:{origin:'https://swish.example','Content-Type':'application/json'},body:JSON.stringify(fixture())});
  const r=await portableApi(request,{DB:{},identity:async()=>({id:'staff',email:'Staff',role:'volunteer',player:null,admin:true}),writeRoster:async p=>{called=true;assert.equal(p.name,'New Player');return {ok:true,alreadySaved:false,player:p};}});
  assert.equal(r.status,201);assert(called);
});
