import {BY_ID,part,emptyModel} from './engine.js';
import {FRAME_ROD_CHOICES,buildFrame} from './frame-builder.js';
import {makeLayer} from './editor-state.js';
export function rodColorBench(){const m=emptyModel('Classic rod colors');for(let n=0;n<6;n++){const ds=FRAME_ROD_CHOICES.map(id=>BY_ID[id]).filter(d=>d.stockIndex===n),ids=[];ds.forEach((d,i)=>{const p=part(d.id,[n*220,30+i*32,0]);m.parts.push(p);ids.push(p.id);});makeLayer(m,ids,[16,32,54,86,128,190][n]+' mm');}return m;}
export function rodColorLattice(){const m=buildFrame({rod:'r-909523',counts:[2,4,2],braced:true}).model;m.name='Rod color lattice';for(const p of m.parts){if(p.type==='r-yellow')p.type='r-90953g';p.pos[1]+=15;}return m;}
