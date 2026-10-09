(function(root){
'use strict';
const acronyms=new Map(['SWISH','PTS','REB','AST','STL','BLK','TO','FG','FT','FGM','FGA','FTM','FTA','NBA','MVP','OVR','OFF','DEF','PG','SG','SF','PF','3PT','2PM','2PA','3PM','3PA','URL','API','SQL','PIN','SGT','MM','SS','XP','2K'].map(v=>[v,v]));acronyms.set('MYPLAYER','MyPlayer');acronyms.set('EFG','eFG');acronyms.set('YOUTUBE','YouTube');acronyms.set('GITHUB','GitHub');
function titleCase(text){return text.replace(/\b[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu,word=>(word==='to'||word==='To'?'To':acronyms.get(word.toUpperCase()))||word.charAt(0).toUpperCase()+word.slice(1).toLowerCase());}
const rosterSelects=new Set(['home-player','player','prediction-player','grind-player','vote-player','award-player','award-filter','note-player']);
function format(){
 for(const option of document.querySelectorAll('option')){const select=option.closest('select');if(rosterSelects.has(select?.id)||select?.hasAttribute('data-stint-player'))continue;if(!option.hasAttribute('value'))option.setAttribute('value',option.value);const next=titleCase(option.textContent);if(option.textContent!==next)option.textContent=next;}
 const nodes=document.querySelectorAll('h1,h2,h3,h4,button,label,summary,.eyebrow,.tag,.stat-label,#view-title,#account-label,footer,.conversation>span,.source-pill,.side-caption,.card-name>span,.rating-grid span,.badge-progress span,.badge-progress small,.game-badge,#sheet-sync-state');
 for(const el of nodes){if(el.closest('.editorial-copy')||el.id==='player-name'||el.closest('.lounge-snapshot h2')||el.closest('.card-name h2,[data-box-name],#print-area')||el.hasAttribute('data-player')||el.hasAttribute('data-film-id'))continue;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement.closest('select,textarea,input,.card-name h2,[data-player],[data-film-id],#player-name'))continue;const next=titleCase(node.data);if(next!==node.data)node.data=next;}}
 for(const select of document.querySelectorAll('select')){select.title=select.selectedOptions[0]?.textContent||'';}
 for(const region of document.querySelectorAll('.table-scroll')){region.tabIndex=0;region.setAttribute('role','region');if(!region.hasAttribute('aria-label'))region.setAttribute('aria-label','Scrollable Statistics Table');}
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;format();});}
root.Interface={format,titleCase};
function start(){format();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('change',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(globalThis);
