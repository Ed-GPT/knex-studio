// Retain each selected part's materials while the pointer crosses other parts.
// Repainting a large group on every hover used to churn thousands of materials.
export function createPartHighlighter(){
 const painted=new Map();
 function release(group){for(const {mesh,original,paint} of painted.get(group)?.materials||[]){mesh.material=original;for(const mat of paint)mat.dispose();}painted.delete(group);}
 return{
  clear(){for(const group of painted.keys())release(group);},
  update(root,selection,hovered,enabled=true){
   const desired=new Map();
   for(const group of root.children){const id=group.userData.partId,state=enabled&&selection.has(id)?'selected':id===hovered?'hover':null;if(group.visible&&state)desired.set(group,state);}
   for(const [group,old] of painted)if(desired.get(group)!==old.state)release(group);
   for(const [group,state] of desired){if(painted.has(group))continue;const materials=[],color=state==='selected'?'#ff29d6':'#8effed';
    group.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.material,paint=(Array.isArray(original)?original:[original]).map(mat=>{const m=mat.clone();m.color?.set(color);m.emissive?.set(color);m.emissiveIntensity=state==='selected'?.55:.35;m.toneMapped=false;return m;});mesh.material=Array.isArray(original)?paint:paint[0];materials.push({mesh,original,paint});});
    painted.set(group,{state,materials});
   }
  }
 };
}
