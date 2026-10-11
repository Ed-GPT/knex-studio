// Grounding is a world-space constraint, independent of visibility and editor locks.
export function groundedParts(model,ids){return model.parts.filter(p=>p.grounded===true&&(!ids||ids.has(p.id)));}
export function groundingReason(model,ids){const fixed=groundedParts(model,ids);return fixed.length?`Locked ${fixed.length===1?'part #'+(model.parts.indexOf(fixed[0])+1):fixed.length+' parts'} would move. Unlock the support or select the moving side of its joint.`:'';}
export function assertUngrounded(model,ids){const reason=groundingReason(model,ids);if(reason)throw Error(reason);}
export function setGrounded(model,ids,value=true){for(const p of model.parts)if(ids.has(p.id)){if(value)p.grounded=true;else delete p.grounded;}}
