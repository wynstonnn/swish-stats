'use strict';
window.SwishAuth={user:{id:'clubhouse',email:'SWISH Clubhouse',role:'community',player:null,admin:false},ready:null};
SwishAuth.ready=(async()=>{try{const r=await fetch('/api/auth/me',{cache:'no-store'});if(r.ok)SwishAuth.user=await r.json();}catch{}document.body.dataset.role='community';document.getElementById('account-label').textContent='ONE CLUBHOUSE · EVERYONE WELCOME';return SwishAuth.user;})();
