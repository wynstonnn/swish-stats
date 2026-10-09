(function(root){
'use strict';
const zones=[
 ['Restricted Area',250,68],['Paint (Non-restricted)',250,128],
 ['Mid-Range - Left',125,185],['Mid-Range - Right',375,185],['Mid-Range - Centre',250,215],
 ['3PT - Left Corner',55,70],['3PT - Right Corner',445,70],
 ['3PT - Left Wing',78,255],['3PT - Right Wing',422,255],['3PT - Top of Key',250,335],['Free Throw',null,null]
];
const text=v=>String(v??'').trim();
function normaliseZone(value){
 const z=text(value).toLowerCase().replace(/[–—_]/g,'-').replace(/\s+/g,' '),side=/\bleft\b/.test(z)?'Left':/\bright\b/.test(z)?'Right':'Centre';
 if(/free.?throw|\bft\b/.test(z))return 'Free Throw';
 if(/3\s*(pt|p|point)|three/.test(z)){
  if(/corner/.test(z)&&side!=='Centre')return `3PT - ${side} Corner`;
  if(/wing/.test(z)&&side!=='Centre')return `3PT - ${side} Wing`;
  if(/top|key|centre|center|straight/.test(z))return '3PT - Top of Key';
  if(side!=='Centre')return `3PT - ${side} Wing`;
  return text(value)||'Unspecified';
 }
 // Non-restricted paint must be checked before restricted/rim aliases.
 if(/paint|non.?restricted/.test(z))return 'Paint (Non-restricted)';
 if(/rim|restrict|lay.?up/.test(z))return 'Restricted Area';
 if(/mid|2\s*(pt|point)|elbow|short.?corner/.test(z))return `Mid-Range - ${side}`;
 return text(value)||'Unspecified';
}
function outcome(value){const z=text(value).toLowerCase();if(['make','made','hit','1'].includes(z))return true;if(['miss','missed','0'].includes(z))return false;return null;}
function rows(raw,name){return (raw||[]).slice(1).filter(r=>text(r.E)===text(name)&&outcome(r.G)!==null).map(r=>({zone:normaliseZone(r.F),made:outcome(r.G),raw:r}));}
function groups(shots){const result=new Map();for(const s of shots){const g=result.get(s.zone)||{zone:s.zone,made:0,attempts:0};g.attempts++;if(s.made)g.made++;result.set(s.zone,g);}return [...result.values()];}
function position(zone){return zones.find(z=>z[0]===normaliseZone(zone))?.slice(1)||[null,null];}
function court(content='',label='Basketball Half Court'){return `<svg class="shot-court" viewBox="0 0 500 390" role="img" aria-label="${label}"><rect x="15" y="15" width="470" height="360" rx="6" fill="#101b30" stroke="#aabfd7"/><path d="M165 15v175h170V15 M215 15v60h70V15 M40 15v65 C40 390 460 390 460 80V15" fill="none" stroke="#8aa3c1" stroke-width="2"/><circle cx="250" cy="52" r="10" fill="none" stroke="#e5ecfa"/><path d="M225 35h50" stroke="#e5ecfa" stroke-width="3"/>${content}</svg>`;}
root.SwishShots={zones,normaliseZone,outcome,rows,groups,position,court};
})(globalThis);
