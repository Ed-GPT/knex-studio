// A compact category rail with a visual flyout. Part cards keep the same
// data-part contract as the editor's click and drag placement handlers.
const names={rods:'Rods',flexible:'Flexi & track',connectors:'Connectors',panels:'Panels',wheels:'Wheels',gears:'Gears & chain',extras:'Clips & spacers',motors:'Motors'};
const matches=(d,q)=>[d.name,d.nominal,d.partNumber].some(v=>String(v??'').toLowerCase().includes(q));
export function createPartLibrary({root,parts,icon,choose,active}){
 const flyout=document.createElement('section');flyout.id='part-flyout';flyout.className='part-flyout';flyout.hidden=true;flyout.setAttribute('role','dialog');flyout.setAttribute('aria-label','Part picker');document.body.append(flyout);
 let group=null,trigger=null;
 const card=d=>`<button class="part-card ${active()===d.id?'active':''}" data-part="${d.id}" title="${d.name}${d.nominal?' '+d.nominal+' mm':''}"><span class="add-sign">+</span>${icon(d)}<strong>${d.name}</strong><small>${d.nominal?d.nominal+' mm · classic':d.tubing?'Cut-to-length · Classic':d.partNumber?'Part '+d.partNumber:''}</small></button>`;
 function bind(node){node.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>choose(b.dataset.part));}
 function position(){const r=root.closest('.library').getBoundingClientRect(),small=innerWidth<700;flyout.style.left=small?'8px':Math.min(r.right+8,innerWidth-330)+'px';flyout.style.top=Math.max(8,r.top)+'px';flyout.style.width=small?'calc(100vw - 16px)':Math.min(490,innerWidth-r.right-16)+'px';flyout.style.maxHeight=Math.max(160,innerHeight-r.top-36)+'px';}
 function close(focus=false){if(flyout.hidden)return;flyout.hidden=true;group=null;root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-expanded','false'));if(focus)trigger?.focus();}
 function drawParts(){const q=flyout.querySelector('input').value.trim().toLowerCase(),ds=parts.filter(d=>d.group===group&&matches(d,q)),grid=flyout.querySelector('.flyout-parts');grid.innerHTML=ds.map(card).join('')||'<p class="empty-search">No matching parts.</p>';bind(grid);flyout.querySelector('.flyout-count').textContent=ds.length+(ds.length===1?' part':' parts');}
 function open(key,b){if(group===key&&!flyout.hidden){close(true);return;}group=key;trigger=b;root.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-expanded',String(x===b)));flyout.innerHTML=`<header><strong>${names[key]}</strong><span class="flyout-count"></span><button aria-label="Close part picker" title="Close (Esc)">×</button></header><input type="search" aria-label="Search ${names[key]}" placeholder="Name, color or part number"><div class="flyout-parts"></div>`;flyout.hidden=false;position();drawParts();flyout.querySelector('header button').onclick=()=>close(true);flyout.querySelector('input').oninput=drawParts;flyout.querySelector('input').focus();}
 function render(query=''){const q=query.trim().toLowerCase();if(q){close();const ds=parts.filter(d=>matches(d,q));root.innerHTML='<div class="catalog-heading">Search results<span>'+ds.length+'</span></div><div class="part-grid">'+(ds.map(card).join('')||'<p class="empty-search">No matching parts.</p>')+'</div>';bind(root);return;}
  root.innerHTML=Object.entries(names).map(([key,name])=>{const ds=parts.filter(d=>d.group===key);return `<button class="category-card" data-category="${key}" aria-label="${name}" aria-expanded="${group===key}" aria-controls="part-flyout"><span class="category-preview" aria-hidden="true">${ds.slice(0,3).map(icon).join('')}</span><strong>${name}</strong><small>${ds.length} parts</small><span class="category-chevron" aria-hidden="true">›</span></button>`;}).join('');root.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>open(b.dataset.category,b));if(group){trigger=root.querySelector(`[data-category="${group}"]`);drawParts();}
 }
 document.addEventListener('pointerdown',e=>{if(!flyout.hidden&&!flyout.contains(e.target)&&!e.target.closest('[data-category]'))close();});
 document.addEventListener('keydown',e=>{if(flyout.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true);}else e.stopPropagation();},true);
 document.addEventListener('focusin',e=>{if(!flyout.hidden&&!flyout.contains(e.target)&&!e.target.closest('[data-category]'))close();});
 window.addEventListener('resize',()=>{if(!flyout.hidden)position();});
 return{render,close,element:flyout};
}
