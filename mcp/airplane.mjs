import {airplaneModel} from '../dist/airplane-model.js';
export function buildAirplane(workspace){
 return {...workspace.adopt(airplaneModel()),note:'Original straight-rod swept-wing plane with triangular wing webs, tapered 3D fuselage, raised cockpit, tail surfaces, retained propeller and four wheels. Real catalog parts and modeled collision checks; no official-kit or flight claim.'};
}
