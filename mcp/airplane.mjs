import {airplaneModel} from '../dist/airplane-model.js';
export function buildAirplane(workspace){
 return {...workspace.adopt(airplaneModel()),note:'Original 3D airframe with a shaped fuselage, thick tapered wings, cockpit, tailplane, vertical fin and four wheels. Real catalog parts and modeled collision checks; no official-kit or flight claim.'};
}
