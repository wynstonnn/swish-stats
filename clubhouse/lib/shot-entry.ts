import { ApiError } from './auth';
import { fields, metadataCells } from './sheet-fields';
export const shotHeaders = ['Shot ID','Date','Opponent','Shot #','Player','Zone','Result','L/R','Shot Detail','Shot Error','Shot Type','Scoring Situation','Play','Contest','Assisted','Assister','Shot Quality','Remarks'];
export const shotTextKeys = ['hand','detail','error','type','situation','play','contest','assisted','assister','quality','remarks'] as const;
export type Shot = {name:string;zone:string;result:'Make'|'Miss';number:number} & Record<typeof shotTextKeys[number],string>;
export function optionalText(v:unknown,label:string,max=150){
 if(v===undefined||v===null||v==='')return '';
 if(typeof v!=='string'||v.trim().length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw new ApiError(`${label}: enter text of at most ${max} characters.`);
 return v.trim();
}
export function shotKind(zone:string){if(/free.?throw|\bft\b/i.test(zone))return 'ft';if(/3\s*(pt|p|point)|three/i.test(zone))return 'three';if(/paint|rim|restrict|lay.?up|mid|2\s*(pt|point)|elbow|short.?corner/i.test(zone))return 'two';return null;}
export function validateShots(input:unknown,players:any[]):Shot[]{
 if(input===undefined)return [];
 if(!Array.isArray(input)||input.length>800)throw new ApiError('Log at most 800 shots per game.');
 const shots=input.map((s:any,i)=>{
  if(!s||typeof s!=='object')throw new ApiError('Each shot needs a player, zone and result.');
  const name=optionalText(s.name,'Shot player',100),zone=optionalText(s.zone,'Shot zone',100);
  if(!players.some(p=>p.name===name)||!zone||!['Make','Miss'].includes(s.result))throw new ApiError(`Shot ${i+1}: choose a participating player, zone and Make/Miss.`);
  const number=s.number===undefined||s.number===null||s.number===''?i+1:s.number;
  if(!Number.isInteger(number)||number<1||number>2000)throw new ApiError('Shot numbers must be whole numbers from 1 to 2000.');
  const row:any={name,zone,result:s.result,number};for(const k of shotTextKeys)row[k]=optionalText(s[k],`Shot ${i+1} ${k}`,k==='remarks'?500:150);
  if(row.hand&&!['L','R','Both'].includes(row.hand))throw new ApiError('Shot L/R records the shooting hand: L, R or Both.');
  if(row.assisted&&!['Yes','No'].includes(row.assisted))throw new ApiError('Assisted must be Yes, No or blank.');
  if(row.assisted==='Yes'&&!row.assister)throw new ApiError(`Shot ${number}: name the assister, or leave Assisted unrecorded.`);
  if(row.assisted==='No'&&row.assister)throw new ApiError(`Shot ${number}: an unassisted shot cannot have an assister.`);
  return row as Shot;
 });
 if(new Set(shots.map(s=>s.number)).size!==shots.length)throw new ApiError('Use a different shot number for every shot in this game.');
 for(const p of players){const ps=shots.filter(s=>s.name===p.name),known=ps.filter(s=>shotKind(s.zone));for(const [kind,made,att] of [['two','twoMade','twoAtt'],['three','threeMade','threeAtt'],['ft','ftm','fta'],['fg','fgm','fga']]){const set=known.filter(s=>kind==='fg'?shotKind(s.zone)!=='ft':shotKind(s.zone)===kind);if((p[att]!==null&&set.length>p[att])||(p[made]!==null&&set.filter(s=>s.result==='Make').length>p[made]))throw new ApiError(`${p.name}: logged ${kind} shots exceed the box score. Check totals or remove duplicate shots.`);}const loggedPoints=known.filter(s=>s.result==='Make').reduce((n,s)=>n+(shotKind(s.zone)==='three'?3:shotKind(s.zone)==='ft'?1:2),0);if(loggedPoints>p.pts)throw new ApiError(`${p.name}: logged shot points exceed the box-score points.`);}
 return shots;
}
export function shotRequests(game:any,sheetId:number,gameNo:number,columns:Record<string,number>={}){
 const serial=Date.parse(game.date+'T00:00:00Z')/86400000+25569,id=`${serial}_${gameNo}`;
 const text=(v:any)=>({userEnteredValue:{stringValue:String(v)}}),number=(v:number)=>({userEnteredValue:{numberValue:v}});
 const rows=game.shots.map((s:Shot)=>({values:metadataCells(columns,{[fields.gameId]:id,[fields.division]:game.division,[fields.tags]:JSON.stringify(game.tags)},[text(`${id}_${s.number}`),number(serial),text(game.opponent),number(s.number),text(s.name),text(s.zone),text(s.result),...shotTextKeys.map(k=>s[k]?text(s[k]):{})])}));
 return [{insertDimension:{range:{sheetId,dimension:'ROWS',startIndex:1,endIndex:1+rows.length},inheritFromBefore:false}},{updateCells:{start:{sheetId,rowIndex:1,columnIndex:0},rows,fields:'userEnteredValue'}}];
}
