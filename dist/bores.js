// Explicit bore positions for housings with multiple independent axle passages.
// Legacy parts keep their existing center bore and dimensions.
export function localBores(d){if(d.bores)return d.bores;if(d.group==='rods'||d.flexi||d.tubing||d.tire||d.endCap||d.endBearing||d.chain||d.interlock||d.noBore)return [];return[{key:'hole',kind:'hole',pos:[0,0,0],dir:[0,0,1],thickness:d.thickness||6.3}];}
