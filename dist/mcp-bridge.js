// Only the local MCP companion serves /ai-build. Public Pages remains static.
export function connectMcpPreview({load,notify}){
 const token=new URL(location.href).searchParams.get('aiBridge');
 if(!token||location.hostname!=='127.0.0.1')return;
 const bar=document.createElement('div');bar.className='mcp-build-bar';bar.setAttribute('role','status');
 const label=document.createElement('span'),button=document.createElement('button'),dismiss=document.createElement('button');button.textContent='Load AI build';dismiss.textContent='×';dismiss.title='Dismiss this update';bar.append(label,button,dismiss);document.body.append(bar);bar.hidden=true;
 let seen=0,pending=null,stopped=false;
 dismiss.onclick=()=>{seen=pending.sequence;pending=null;bar.hidden=true;};
 button.onclick=()=>{if(!pending)return;try{if(load(JSON.stringify(pending.model))===false)return;seen=pending.sequence;pending=null;bar.hidden=true;}catch(e){notify(e.message);}};
 async function poll(){try{const r=await fetch('/ai-build?token='+encodeURIComponent(token),{cache:'no-store'});if(!r.ok)throw Error('MCP preview disconnected. Keep the local MCP server running.');const next=await r.json();if(next.sequence>seen){pending=next;label.textContent=`AI draft: ${next.name} · revision ${next.revision}`;bar.hidden=false;}}catch(e){label.textContent=e.message;button.disabled=true;bar.hidden=false;stopped=true;}if(!stopped)setTimeout(poll,1500);}
 poll();
}
