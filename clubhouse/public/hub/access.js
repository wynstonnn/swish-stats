'use strict';
window.Access={canView(){return true},apply(){document.body.dataset.role='community';document.querySelectorAll('[data-view],[data-go]').forEach(b=>b.hidden=false);},render(){}};
