import {Vector3} from './vendor/three.module.js';
const NS='http://www.w3.org/2000/svg';
const vec=a=>new Vector3(...a);
export function createGizmo({stage,camera,state,start,change,finish}){
 const svg=document.createElementNS(NS,'svg');svg.classList.add('motion-gizmo');svg.setAttribute('aria-label','Drag arrows to move; drag rings to rotate');stage.append(svg);
 let handles=[],drag=null;
 const screen=p=>{const b=stage.getBoundingClientRect(),v=p.clone().project(camera());return {x:(v.x+1)*b.width/2,y:(1-v.y)*b.height/2};};
 const point=e=>{const b=stage.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};};
 function node(tag,attrs){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(attrs['data-handle']!==undefined){const hit=n.cloneNode();hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','16');hit.setAttribute('fill','none');hit.classList.add('handle-hit');svg.append(hit);n.style.pointerEvents='none';}svg.append(n);return n;}
 function render(){
  svg.replaceChildren();handles=[];const s=state();if(!s)return;const cam=camera(),origin=vec(s.origin),b=stage.getBoundingClientRect(),o=screen(origin);
  const scale=cam.isPerspectiveCamera?2*origin.distanceTo(cam.position)*Math.tan(cam.fov*Math.PI/360)/b.height:(cam.top-cam.bottom)/(cam.zoom*b.height);
  const axes=['axle','pivot'].includes(s.mode)?[{axis:s.axis,color:'#f4cc68',name:'Axle'}]:[{axis:[1,0,0],color:'#f18b87',name:'X'},{axis:[0,1,0],color:'#8cdb9b',name:'Y'},{axis:[0,0,1],color:'#8ebcff',name:'Z'}];
  for(const spec of axes){const axis=vec(spec.axis),end=screen(origin.clone().addScaledVector(axis,scale*85)),dx=end.x-o.x,dy=end.y-o.y;
   if(!['rotate','pivot'].includes(s.mode)&&!(s.mode==='axle'&&s.min===0&&s.max===0)&&Math.hypot(dx,dy)>15){
    const h={kind:'move',axis:spec.axis,origin:s.origin,dx:dx/(scale*85),dy:dy/(scale*85),name:spec.name};
    const i=handles.push(h)-1;const both=s.mode==='axle',x=both?o.x-dx:o.x,y=both?o.y-dy:o.y;
    node('line',{x1:x,y1:y,x2:end.x,y2:end.y,stroke:spec.color,'stroke-width':4,'stroke-linecap':'round','data-handle':i,'aria-label':`Drag ${spec.name} to move`});
    for(const sign of both?[-1,1]:[1]){const ex=o.x+sign*dx,ey=o.y+sign*dy,angle=Math.atan2(dy*sign,dx*sign),ux=Math.cos(angle),uy=Math.sin(angle);node('path',{d:`M${ex} ${ey} L${ex-ux*13-uy*6} ${ey-uy*13+ux*6} L${ex-ux*13+uy*6} ${ey-uy*13-ux*6} Z`,fill:spec.color,'data-handle':i});}
    node('text',{x:end.x+8,y:end.y-8,fill:spec.color,'font-size':12,'font-weight':700}).textContent=spec.name==='Axle'?'Slide':spec.name;
   }
   if(s.mode==='move')continue;
   const reference=Math.abs(axis.y)<.9?vec([0,1,0]):vec([1,0,0]),u=reference.cross(axis).normalize().multiplyScalar(scale*64),v=axis.clone().cross(u).normalize().multiplyScalar(scale*64),pu=screen(origin.clone().add(u)),pv=screen(origin.clone().add(v));
   const ux=pu.x-o.x,uy=pu.y-o.y,vx=pv.x-o.x,vy=pv.y-o.y,det=ux*vy-uy*vx;
   if(Math.abs(det)<120)continue;
   const i=handles.push({kind:'rotate',axis:spec.axis,origin:s.origin,o,ux,uy,vx,vy,det,name:spec.name})-1;
   let d='';for(let n=0;n<=64;n++){const a=n/64*Math.PI*2,p=screen(origin.clone().addScaledVector(u,Math.cos(a)).addScaledVector(v,Math.sin(a)));d+=(n?' L':'M')+p.x+' '+p.y;}
   node('path',{d,fill:'none',stroke:'#141922','stroke-width':9,class:'ring-halo'});
   node('path',{d,fill:'none',stroke:spec.color,'stroke-width':4,'data-handle':i,'aria-label':`Drag ${spec.name} ring to rotate`});
   node('circle',{cx:o.x+ux,cy:o.y+uy,r:7,fill:spec.color,stroke:'#182029','stroke-width':2,class:'ring-grip'});
   if(s.mode==='axle')node('text',{x:o.x+ux+8,y:o.y+uy-8,fill:spec.color,'font-size':12,'font-weight':700}).textContent='Spin';
  }
  node('circle',{cx:o.x,cy:o.y,r:4,fill:'#fff'});
 }
 const angle=(h,p)=>{const x=p.x-h.o.x,y=p.y-h.o.y;return Math.atan2((h.ux*y-h.uy*x)/h.det,(x*h.vy-y*h.vx)/h.det);};
 svg.addEventListener('pointerdown',e=>{const i=e.target.getAttribute('data-handle');if(i===null||e.button!==0)return;e.preventDefault();e.stopPropagation();const h=handles[Number(i)],p=point(e);drag={h,p,angle:h.kind==='rotate'?angle(h,p):0,total:0};svg.setPointerCapture(e.pointerId);start(h);});
 svg.addEventListener('pointermove',e=>{if(!drag)return;e.preventDefault();const {h,p}=drag,next=point(e);let value;if(h.kind==='move')value=((next.x-p.x)*h.dx+(next.y-p.y)*h.dy)/(h.dx*h.dx+h.dy*h.dy);else{const a=angle(h,next);let step=a-drag.angle;if(step>Math.PI)step-=2*Math.PI;if(step< -Math.PI)step+=2*Math.PI;drag.total+=step;drag.angle=a;value=drag.total*180/Math.PI;}if(e.shiftKey)value=Math.round(value/(h.kind==='move'?5:15))*(h.kind==='move'?5:15);change(h,value);});
 const end=(e,cancel)=>{if(!drag)return;e.preventDefault();e.stopPropagation();drag=null;finish(cancel);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);};
 svg.addEventListener('pointerup',e=>end(e,false));svg.addEventListener('pointercancel',e=>end(e,true));
 return {render,cancel(){if(drag){drag=null;finish(true);}},get dragging(){return !!drag;}};
}
