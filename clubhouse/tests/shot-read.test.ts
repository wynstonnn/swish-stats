import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSheetTabs} from '../lib/sheets-client';

test('authenticated sync includes all shot columns and retains only required ranges when the optional tab is absent',async()=>{
 for(const hasShots of [true,false]){let ranges:string[]=[];const request:any=async(path:string)=>{
  if(path.startsWith('?fields='))return {sheets:[...['Games','Player_Data','Player_Roster',...(hasShots?['Shot_Data']:[])].map(title=>({properties:{title}}))]};
  ranges=new URLSearchParams(path.split('?')[1]).getAll('ranges');
  return {valueRanges:[{values:[['Position','Number','Player Name']]},{values:[['Player Name']]},{values:[['ID','No','Date','Type','Opponent']]},...(hasShots?[{values:[['Shot ID','Date','Opponent','Shot #','Player','Zone','Result','L/R','Detail','Error','Type','Situation','Play','Contest','Assisted','Assister','Quality','Remarks'],['id',46304,'Rivals',1,'Player A','Paint','Make','R','','','','','Fastbreak','Open','Yes','Player B','Good','Notes']]}]:[])]};
 };const raw=await readSheetTabs(request);assert.equal(ranges.includes("'Shot_Data'!A1:BZ12000"),hasShots);if(hasShots){assert.equal(raw.Shot_Data[1].P,'Player B');assert.equal(raw.Shot_Data[1].R,'Notes');}else assert.equal(raw.Shot_Data,undefined);}
});
