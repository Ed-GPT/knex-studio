import {part,emptyModel,definition,targets,solve,add} from './engine.js';
import {CLASSIC_GEARS} from './classic-gears.js';
import {makeLayer} from './editor-state.js';
// A locked test fixture, not a freestanding construction or an official manual model.
export function idlerGearModel(){
 const m=emptyModel('Snap-on idler gear train'),motor=part('m-blue',[0,70,0]);m.parts.push(motor);
 const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const input=attach('r-red',motor,'through'),clip=attach('k-tan',input,'through',{offset:25}),drive=attach('g-red34',clip,'keyed');
 m.links.push({a:input.id,ap:'shaft',b:drive.id,bp:'hole',mode:'through',offset:drive.pos[2]});
 const idler=attach('g-snap-gray14',drive,'mesh'),pin=attach('r-white',idler,'end',{portIndex:1});pin.grounded=true;
 const output=attach('g-gold14',idler,'mesh'),shaft=attach('r-red',output,'through'),key=attach('k-tan',shaft,'through',{offset:-6.35});
 key.quat=[...output.quat];
 m.links.push({a:key.id,ap:'key',b:output.id,bp:'key',mode:'keyed'});
 for(const offset of[-42,42])attach('c-gray',shaft,'through',{offset,roll:90});
 makeLayer(m,[idler.id],'Free-spinning idler');return m;
}
export function classicGearBench(){const m=emptyModel('Classic gear variants');let x=0;for(const d of CLASSIC_GEARS){x+=d.diameter/2+20;const gear=part(d.id,[x,80,0]);m.parts.push(gear);add(m,solve(m,'r-blue',targets(m,'r-blue',d.endBearing?'end':'through').find(t=>t.partId===gear.id),d.endBearing?'end':'through',{portIndex:1}));makeLayer(m,m.parts.slice(-2).map(p=>p.id),d.partNumber+' · '+d.name);x+=d.diameter/2;}return m;}
// Two right-angle stages on three spatial axles. Supports are locked test fixtures.
export function crownGearModel(){
 const m=emptyModel('Three-axis crown gearbox'),motor=part('m-blue',[0,85,0]);m.parts.push(motor);
 const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const input=attach('r-gray',motor,'through'),clip=attach('k-tan',input,'through',{offset:42}),first=attach('g-yellow34',clip,'keyed');
 m.links.push({a:input.id,ap:'shaft',b:first.id,bp:'hole',mode:'through',offset:first.pos[2]});
 const pinion=attach('g-gray14',first,'crown'),middle=attach('r-red',pinion,'through');
 for(const offset of[-40,48])attach('c-gray',middle,'through',{offset,roll:90});
 const key=attach('k-tan',middle,'through',{offset:27}),second=attach('g-gray34',key,'keyed');
 m.links.push({a:middle.id,ap:'shaft',b:second.id,bp:'hole',mode:'through',offset:33.35});
 const final=attach('g-gray14',second,'crown',{roll:90}),out=attach('r-red',final,'through');
 for(const offset of[-38,38])attach('c-gray',out,'through',{offset});
 return m;
}
