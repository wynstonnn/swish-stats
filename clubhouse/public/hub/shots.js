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
 if(/non.?restricted/.test(z)||(/paint/.test(z)&&! /restrict/.test(z)))return 'Paint (Non-restricted)';
 if(/rim|restrict|lay.?up/.test(z))return 'Restricted Area';
 if(/mid|2\s*(pt|point)|elbow|short.?corner/.test(z))return `Mid-Range - ${side}`;
 return text(value)||'Unspecified';
}
function outcome(value){const z=text(value).toLowerCase();if(['make','made','hit','1'].includes(z))return true;if(['miss','missed','0'].includes(z))return false;return null;}
function rows(raw,name){return (raw||[]).slice(1).filter(r=>text(r.E)===text(name)&&outcome(r.G)!==null).map(r=>({zone:normaliseZone(r.F),made:outcome(r.G),raw:r}));}
function groups(shots){const result=new Map();for(const s of shots){const g=result.get(s.zone)||{zone:s.zone,made:0,attempts:0};g.attempts++;if(s.made)g.made++;result.set(s.zone,g);}return [...result.values()];}
function position(zone){return zones.find(z=>z[0]===normaliseZone(zone))?.slice(1)||[null,null];}
function court(content='',label='Basketball Half Court'){return `<svg class="shot-court" viewBox="0 0 500 390" role="img" aria-label="${label}"><rect x="15" y="15" width="470" height="360" rx="6" fill="#101b30" stroke="#aabfd7"/><path d="M165 15v175h170V15 M215 15v60h70V15 M40 15v65 C40 390 460 390 460 80V15" fill="none" stroke="#8aa3c1" stroke-width="2"/><circle cx="250" cy="52" r="10" fill="none" stroke="#e5ecfa"/><path d="M225 35h50" stroke="#e5ecfa" stroke-width="3"/>${content}</svg>`;}
// A scaled 50 × 47 ft half-court. Ten disjoint regions share the same
// rim, 23 ft 9 in arc and 22 ft corner lines; Free Throws stay separate.
let heatSeq=0;
const heatZones=[
 {zone:'Restricted Area',path:'M210 55a40 40 0 1 0 80 0a40 40 0 1 0-80 0',x:250,y:67},
 {zone:'Paint (Non-restricted)',path:'M170 0H330V190H170Z M210 55a40 40 0 1 0 80 0a40 40 0 1 0-80 0',x:250,y:145},
 {zone:'Mid-Range - Left',rect:[30,0,140,470],clip:'inside',x:107,y:160},
 {zone:'Mid-Range - Right',rect:[330,0,140,470],clip:'inside',x:393,y:160},
 {zone:'Mid-Range - Centre',rect:[170,190,160,280],clip:'inside',x:250,y:235},
 {zone:'3PT - Left Corner',rect:[0,0,30,144.478],x:15,y:85,rotate:true},
 {zone:'3PT - Right Corner',rect:[470,0,30,144.478],x:485,y:85,rotate:true},
 {zone:'3PT - Left Wing',path:'M0 144.478H198.34L10.4 470H0Z',clip:'outside',x:61,y:303},
 {zone:'3PT - Right Wing',path:'M500 144.478H301.66L489.6 470H500Z',clip:'outside',x:439,y:303},
 {zone:'3PT - Top of Key',path:'M250 55L489.6 470H10.4Z',clip:'outside',x:250,y:368}
];
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function zoneState(own,peer){if(!own?.attempts)return {state:'empty',color:'#182131',label:'No Shots Logged'};if(own.attempts<5||!peer||peer.attempts<10)return {state:'sample',color:'#39465c',label:'More Shots Needed'};const gap=own.made/own.attempts-peer.made/peer.attempts;return gap>=.1-1e-9?{state:'hot',color:'#e84932',label:'Hot Zone'}:gap<=-.1+1e-9?{state:'cold',color:'#267cda',label:'Cold Zone'}:{state:'neutral',color:'#556175',label:'Near Team Average'};}
function accuracyColor(rate){const stops=rate<=.5?[[38,124,218],[85,97,117],rate*2]:[[85,97,117],[232,73,50],(rate-.5)*2];return '#'+stops[0].map((v,i)=>Math.round(v+(stops[1][i]-v)*stops[2]).toString(16).padStart(2,'0')).join('');}
function heatColor(own,peer,mode,total){const relative=zoneState(own,peer);if(mode==='relative'||!own?.attempts)return relative;if(mode==='volume'){const share=own.attempts/total;return {state:'volume',color:accuracyBlue(share),label:(share*100).toFixed(1)+'% Of Mapped Field-Goal Attempts'};}return {state:'accuracy',color:accuracyColor(own.made/own.attempts),label:'Observed Accuracy'+(own.attempts<5?' · Small Sample (Fewer Than Five Attempts)':'')};}
function accuracyBlue(share){return '#'+[19,47,79].map((v,i)=>Math.round(v+([68,167,255][i]-v)*Math.sqrt(share)).toString(16).padStart(2,'0')).join('');}
function segmented(shots,peerShots,label,mode='accuracy'){const id='zone-'+(++heatSeq),own=new Map(groups(shots).map(g=>[g.zone,g])),peers=new Map(groups(peerShots).map(g=>[g.zone,g])),inside='M30 0V144.478A237.5 237.5 0 0 0 470 144.478V0Z';
 const total=heatZones.reduce((sum,z)=>sum+(own.get(z.zone)?.attempts||0),0);
 const zones=heatZones.map(z=>{const g=own.get(z.zone),peer=peers.get(z.zone),c=heatColor(g,peer,mode,total),detail=z.zone+': '+(g?g.made+'/'+g.attempts+' ('+(100*g.made/g.attempts).toFixed(1)+'%). ':'No shots logged. ')+c.label+'. '+(peer?.attempts?'Other teammates: '+peer.made+'/'+peer.attempts+'. ':'No teammate zone sample. '),shape=z.rect?`<rect x="${z.rect[0]}" y="${z.rect[1]}" width="${z.rect[2]}" height="${z.rect[3]}" fill="${c.color}"/>`:`<path d="${z.path}" fill="${c.color}" fill-rule="evenodd"/>`;return `<g data-zone="${xml(z.zone)}" data-zone-state="${c.state}" data-zone-attempts="${g?.attempts||0}" data-help-text="${xml(detail)}" tabindex="0" role="button" aria-label="${xml(detail)}" fill="${c.color}" stroke="#a0b4cd" stroke-width="1" ${z.clip?`clip-path="url(#${id}-${z.clip})"`:''}><title>${xml(detail)}</title>${shape}${g?`<text class="zone-value" x="${z.x}" y="${z.y}" text-anchor="middle" fill="#fff" stroke="none" ${z.rotate?`transform="rotate(-90 ${z.x} ${z.y})"`:''}>${g.made}/${g.attempts}${z.rotate?'':`<tspan x="${z.x}" dy="19" font-size="13">${Math.round(100*g.made/g.attempts)}%</tspan>`}</text>`:''}</g>`;}).join('');
 return `<svg class="segmented-court" viewBox="-2 -2 504 474" role="group" aria-label="${xml(label)}"><defs><clipPath id="${id}-inside"><path d="${inside}"/></clipPath><clipPath id="${id}-outside"><path d="M0 0H500V470H0Z ${inside}" clip-rule="evenodd"/></clipPath></defs>${zones}<g class="court-lines" fill="none" stroke="#d8e5f4" stroke-width="2" pointer-events="none"><rect x="0" y="0" width="500" height="470"/><path d="M170 0V190H330V0 M30 0V144.478A237.5 237.5 0 0 0 470 144.478V0 M210 55a40 40 0 0 0 80 0 M190 190a60 60 0 0 0 120 0"/><path d="M190 190a60 60 0 0 1 120 0" stroke-dasharray="6 5"/><path d="M220 40H280" stroke-width="4"/><circle cx="250" cy="55" r="8" stroke="#ffb46e"/></g></svg>`;
}
root.SwishShots={zones,normaliseZone,outcome,rows,groups,position,court,heatZones,zoneState,accuracyColor,heatColor,segmented};
})(globalThis);
