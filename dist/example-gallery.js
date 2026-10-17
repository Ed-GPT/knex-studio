import {loadExampleModel} from './example-loader.js';
import * as T from './vendor/three.module.js';
import {makeRenderPart as makePart} from './render-part.js';
import {EXAMPLES,REFERENCE_SCENES} from './examples.js';
import {icon} from './icons.js';
const thumbnails=new Map(),counts=new Map();
export function exampleGallery(root,open){
 let filter='All',cancelled=false,renderer=null,pending=null,previewController=null,openController=null;
 const schedule=()=>{if(cancelled||pending!==null)return;pending=setTimeout(()=>{pending=null;drawNext();},32);};
 const observer=new IntersectionObserver(schedule,{root:null,rootMargin:'100px'});
 root.innerHTML=`<div class="gallery-heading"><h2>Examples</h2><span>Opening a build archives your current model.</span></div><div class="gallery-filters" role="group" aria-label="Example difficulty">${['All','Simple','Intermediate','Advanced'].map(level=>`<button data-level="${level}" aria-pressed="${level==='All'}">${level}</button>`).join('')}</div><div class="example-gallery"></div><details class="reference-scenes"><summary>Part reference scenes</summary><div>${REFERENCE_SCENES.map(e=>`<button data-reference="${e.id}">${icon('examples')}${e.title}</button>`).join('')}</div></details>`;
 const grid=root.querySelector('.example-gallery');
 const render=()=>{previewController?.abort();previewController=null;observer.disconnect();grid.replaceChildren();for(const entry of EXAMPLES.filter(e=>filter==='All'||e.level===filter)){
  const card=document.createElement('article');card.className='example-card';card.dataset.exampleId=entry.id;
  card.innerHTML=`<button class="open-example" aria-label="Open ${entry.title}"><div class="example-image"><img alt="${entry.title} built from K’NEX parts" ${thumbnails.has(entry.id)?`src="${thumbnails.get(entry.id)}"`:''}><span class="example-level ${entry.level.toLowerCase()}">${entry.level}</span><span class="example-open">${icon('add')}</span></div><div class="example-caption"><strong>${entry.title}</strong><small>${counts.has(entry.id)?counts.get(entry.id)+' parts · ':''}${entry.skill}</small></div></button><details class="example-info"><summary aria-label="About ${entry.title}">About this build</summary><p>${entry.hint}</p><p>${entry.kind}. <a href="${entry.source}" target="_blank" rel="noreferrer">Reference</a></p></details>`;
  card.querySelector('button').onclick=async()=>{
   openController?.abort();const controller=new AbortController();openController=controller;
   const button=card.querySelector('button');button.setAttribute('aria-busy','true');button.disabled=true;
   try{await open(entry.id,{signal:controller.signal});}finally{button.removeAttribute('aria-busy');button.disabled=false;}
  };grid.append(card);observer.observe(card);
 }
 schedule();
 };
 async function drawNext(){if(cancelled||previewController||!root.isConnected||!root.closest('dialog')?.open)return;const card=[...grid.children].find(c=>{const r=c.getBoundingClientRect();return !thumbnails.has(c.dataset.exampleId)&&r.bottom>0&&r.top<innerHeight+100;});if(!card)return;
  const controller=new AbortController();previewController=controller;
  try{const model=await loadExampleModel(card.dataset.exampleId,{signal:controller.signal});if(cancelled||controller.signal.aborted||!card.isConnected)return;
   if(!renderer){renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(440,260);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;}
   const scene=new T.Scene();scene.background=new T.Color('#252e3a');scene.add(new T.HemisphereLight('#fff','#71859a',3));const light=new T.DirectionalLight('#fff7e4',3.7);light.position.set(-200,400,300);scene.add(light);const group=new T.Group();scene.add(group);
   counts.set(card.dataset.exampleId,model.parts.length);card.querySelector('.example-caption small').textContent=model.parts.length+' parts · '+EXAMPLES.find(e=>e.id===card.dataset.exampleId).skill;for(const p of model.parts){const g=makePart(p.type,p);g.position.fromArray(p.pos);g.quaternion.fromArray(p.quat);group.add(g);}
   const bounds=new T.Box3().setFromObject(group),center=bounds.getCenter(new T.Vector3()),radius=Math.max(12,bounds.getBoundingSphere(new T.Sphere()).radius),camera=new T.PerspectiveCamera(34,440/260,.1,10000),direction=new T.Vector3(.9,.55,1.3).normalize();camera.position.copy(center).addScaledVector(direction,radius/Math.sin(17*Math.PI/180)*1.08);camera.lookAt(center);renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');thumbnails.set(card.dataset.exampleId,url);card.querySelector('img').src=url;for(const p of group.children)if(p.userData.dynamic)p.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  }catch(e){if(e.name!=='AbortError'){card.querySelector('img').alt='Preview unavailable';thumbnails.set(card.dataset.exampleId,'');}}
  finally{if(previewController===controller)previewController=null;}
  schedule();
 }
 root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{filter=b.dataset.level;root.querySelectorAll('[data-level]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
 root.querySelectorAll('[data-reference]').forEach(b=>b.onclick=()=>{openController?.abort();openController=new AbortController();return open(b.dataset.reference,{signal:openController.signal});});
 render();return()=>{cancelled=true;previewController?.abort();openController?.abort();clearTimeout(pending);observer.disconnect();renderer?.dispose();renderer?.forceContextLoss();};
}
