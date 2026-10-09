(function(root){
'use strict';
const text=v=>String(v??'').trim(),year=d=>d?d.slice(0,4):null;
const serialKey=(d,o)=>`${Swish.num(d)??text(d)}|${text(o).toLowerCase()}`;
const ordinal=r=>Number(text(r.key||r.id).match(/(?:id:)?\d+_(\d+)$/)?.[1])||0;
const latest=(a,b)=>(b.date||'').localeCompare(a.date||'')||ordinal(b)-ordinal(a)||a.index-b.index;
function recentKeys(rows,n=5){return new Set([...new Set(rows.filter(r=>r.date).slice().sort(latest).map(r=>r.key))].slice(0,n));}
 function dateMatches(date,state){return state.mode==='career'||(!!date&&(state.years===null||state.years.includes(year(date))));}
function divisionMatches(division,state){return state.divisions===null||state.divisions.includes(division||'__unassigned__');}
function divisionMap(full){const refs=new Map();for(const g of full.games){const entry=refs.get(g.key)||[];entry.push(g);refs.set(g.key,entry);}return refs;}
function rowDivision(row,refs){if(row.division)return row.division;const games=refs.get(row.key)||[];return games.length===1?games[0].division:'';}
function eligible(full,state){const refs=divisionMap(full),rows=full.rows.map(r=>({...r,division:rowDivision(r,refs)})).filter(r=>dateMatches(r.date,state)&&divisionMatches(r.division,state)),games=full.games.filter(g=>dateMatches(g.date,state)&&divisionMatches(g.division,state));return {rows,games};}
function options(full){const dates=[...full.rows.map(r=>r.date),...full.games.map(g=>g.date)],divisions=[...full.rows.map(r=>r.division),...full.games.map(g=>g.division)];return {years:[...new Set(dates.filter(Boolean).map(year))].sort().reverse(),divisions:[...new Set(divisions.map(d=>d||'__unassigned__'))].sort((a,b)=>a.localeCompare(b))};}
function shotGame(raw,full){const id=text(Swish.field(full.raw,'Shot_Data',raw,'SWISH Game ID'))||text(raw.A).replace(/_\d+$/,'');const byId=full.games.filter(g=>g.id===id||g.key==='id:'+id);if(byId.length===1)return byId[0];const legacy=serialKey(raw.B,raw.C),matches=full.games.filter(g=>serialKey(g.rawDate,g.name)===legacy);return matches.length===1?matches[0]:null;}
function apply(full,state){
 const base=eligible(full,state);let teamGames=base.games,teamRows=base.rows,playerRows=base.rows;
 const ownKeys=new Map();
 if(state.mode==='last5'){
  const teamKeys=recentKeys(base.games);teamGames=base.games.filter(g=>teamKeys.has(g.key));teamRows=base.rows.filter(r=>teamKeys.has(r.key));
  for(const p of full.players)ownKeys.set(p.name,recentKeys(base.rows.filter(r=>r.name===p.name)));
  playerRows=base.rows.filter(r=>ownKeys.get(r.name)?.has(r.key));
 }
 const playerIndexes=new Set(playerRows.map(r=>r.index)),teamIndexes=new Set(teamRows.map(r=>r.index));
 const acceptedGames=new Set(teamGames.map(g=>g._raw)),raw={...full.raw,Games:[full.raw.Games[0],...full.raw.Games.slice(1).filter(r=>acceptedGames.has(r))]};
 // Use raw object references to keep every original row/metadata cell unchanged.
 const accepted=new Set(full.rows.filter(r=>teamIndexes.has(r.index)).map(r=>r._raw));
 raw.Player_Data=[full.raw.Player_Data[0],...full.raw.Player_Data.slice(1).filter(r=>accepted.has(r))];
 const shots=(full.raw.Shot_Data||[]).slice(1).filter(r=>{
  if(!text(r.E)||!root.SwishShots||SwishShots.outcome(r.G)===null)return false;
  const date=Swish.date(r.B),g=shotGame(r,full),division=text(Swish.field(full.raw,'Shot_Data',r,'SWISH Division'))||g?.division||'';
  if(!dateMatches(date,state)||!divisionMatches(division,state))return false;
  if(state.mode==='last5')return !!g&&ownKeys.get(text(r.E))?.has(g.key);
  return true;
 });
 raw.Shot_Data=[full.raw.Shot_Data?.[0]||{},...shots];
 const model=Swish.build(raw),ownRaw={...raw,Player_Data:[full.raw.Player_Data[0],...full.rows.filter(r=>playerIndexes.has(r.index)).map(r=>r._raw)]};
 const individuals=state.mode==='last5'?Swish.build(ownRaw).players:model.players;
 // Preserve known historical game divisions even where only Games contains them.
 const enrich=p=>({...p,rows:p.rows.map(r=>({...r,division:rowDivision(r,divisionMap(full))}))});
 const keepPlayers=ps=>full.players.map(p=>ps.find(x=>x.name===p.name)||{...p,rows:[],shots:[],gp:0,totals:Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,0])),counts:Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,0])),avg:Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,null])),fg:null,two:null,three:null,ft:null,efg:null,ts:null});
 model.teamPlayers=keepPlayers(model.players).map(enrich);model.players=keepPlayers(individuals).map(enrich);
 model.rows=model.rows.map(r=>({...r,division:rowDivision(r,divisionMap(full))}));
 model.scope={...state};model.eligible=base;model.career=full;
 return model;
}
function label(state){const years=state.mode==='career'?'Career':state.years===null?'All Years':state.years.length?state.years.slice().sort().join(' + '):'No Years Selected',division=state.divisions===null?'All Divisions':state.divisions.length?state.divisions.map(d=>d==='__unassigned__'?'Division Not Recorded':d).join(' + '):'No Divisions Selected';return `${state.mode==='last5'?'Last Five · ':''}${years} · ${division}`;}
function totals(rows){const out=Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,rows.some(r=>Number.isFinite(r[k]))?rows.reduce((n,r)=>n+(Number.isFinite(r[k])?r[k]:0),0):null]));return out;}
function summaries(model,name=null){
 const groups=new Map(),source=name?model.players.find(p=>p.name===name)?.rows||[]:model.games;
 for(const r of source){if(!r.date)continue;const division=r.division||'__unassigned__',key=JSON.stringify([year(r.date),division]);if(!groups.has(key))groups.set(key,{year:year(r.date),division,rows:[],games:[],samples:[]});const g=groups.get(key);if(name){g.rows.push(r);g.samples.push(r);}else{g.games.push(r);g.rows.push(...r.rows);const sample={...Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,r.rows.length&&r.rows.every(x=>Number.isFinite(x[k]))?r.rows.reduce((n,x)=>n+x[k],0):null])),pts:r.score};g.samples.push(sample);}}
 return [...groups.values()].map(g=>{const count=k=>g.samples.filter(r=>Number.isFinite(r[k])).length,total=totals(g.samples),avg=Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,count(k)?total[k]/count(k):null])),fg=Development.shooting(g.rows,'fgm','fga');return {...g,gp:name?new Set(g.rows.map(r=>r.key)).size:g.games.length,totals:total,avg,counts:Object.fromEntries(Object.keys(Swish.cols).map(k=>[k,count(k)])),fg:fg.rate,fgAttempts:fg.attempts,wins:g.games.filter(r=>r.result==='W').length,losses:g.games.filter(r=>r.result==='L').length};}).sort((a,b)=>a.year.localeCompare(b.year)||a.division.localeCompare(b.division));
}
function recordMatches(record,state){const timestamp=record.created&&!record.date&&!record.awarded&&/T/.test(record.created)?new Date(record.created):null,date=timestamp&&!isNaN(timestamp)?timestamp.toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'}):Swish.date(record.date||record.awarded||record.created),season=text(record.season),years=season.match(/(?:19|20)\d{2}/g)||[],short=season.match(/(20\d{2})\s*[-/]\s*(\d{2})(?!\d)/);if(short)years.push(short[1].slice(0,2)+short[2]);return state.mode==='career'||(state.years===null?!!date||years.length>0:years.length?years.some(y=>state.years.includes(y)):dateMatches(date,state));}
root.SwishScope={apply,eligible,options,label,summaries,dateMatches,recordMatches,recentKeys,latest};
})(globalThis);
