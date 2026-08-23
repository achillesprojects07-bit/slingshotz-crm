const APP_KEY="kathimerina_fluency_v1"; const SCHEMA_VERSION=2;
const defaults={schemaVersion:SCHEMA_VERSION,lastRoute:"today",createdAt:new Date().toISOString(),progress:{currentLessonId:"c01-l01",lessons:{}}};
const clone=()=>JSON.parse(JSON.stringify(defaults));
function migrate(p){
  if(!p||typeof p!=="object")return clone();
  if(p.schemaVersion===1)return {...clone(),...p,schemaVersion:SCHEMA_VERSION,progress:{currentLessonId:p.progress?.currentLessonId||"c01-l01",lessons:p.progress?.lessons||{}}};
  if(p.schemaVersion===SCHEMA_VERSION)return {...clone(),...p,progress:{...clone().progress,...(p.progress||{}),lessons:p.progress?.lessons||{}}};
  return clone();
}
export function loadState(){try{const raw=localStorage.getItem(APP_KEY);return raw?migrate(JSON.parse(raw)):clone();}catch(e){console.warn("State recovery:",e);return clone();}}
export function saveState(state){try{state.schemaVersion=SCHEMA_VERSION;localStorage.setItem(APP_KEY,JSON.stringify(state));return true;}catch(e){console.error("Save failed:",e);return false;}}
export {APP_KEY,SCHEMA_VERSION};
