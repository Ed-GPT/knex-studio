import {CLASSIC_CONNECTORS,connectorShape} from './classic-connectors.js';
import {emptyModel,part} from './engine.js';
import {makeLayer} from './editor-state.js';
import {poweredWindmill} from './motor.js';
export function connectorVariantBench(){const m=emptyModel('Classic connector colors');let row=0;for(const shape of [...new Set(CLASSIC_CONNECTORS.map(connectorShape))]){const ds=CLASSIC_CONNECTORS.filter(d=>connectorShape(d)===shape),ids=[];ds.forEach((d,i)=>{const p=part(d.id,[i*55,30+row*65,0]);m.parts.push(p);ids.push(p.id);});makeLayer(m,ids,ds[0].name.split(' · ')[1]);row++;}return m;}
export function variantWindmill(){const m=poweredWindmill();m.name='Black connector windmill';for(const p of m.parts){if(p.type==='c-white')p.type='c-90968';if(p.type==='c-red')p.type='c-909042';}return m;}
