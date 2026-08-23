import { getLesson } from "../data/curriculum.js";
export function ensureProgress(state){ state.progress ||= {}; state.progress.lessons ||= {}; state.progress.currentLessonId ||= "c01-l01"; return state.progress; }
export function lessonRecord(state,lessonId){ ensureProgress(state); state.progress.lessons[lessonId] ||= {started:false,completed:false,currentStep:0,practiceAnswers:{},correctCount:0,lastStudiedAt:null}; return state.progress.lessons[lessonId]; }
export function startLesson(state,lessonId){ const r=lessonRecord(state,lessonId); r.started=true; r.lastStudiedAt=new Date().toISOString(); state.progress.currentLessonId=lessonId; return r; }
export function setLessonStep(state,lessonId,step){ const r=lessonRecord(state,lessonId); r.currentStep=Math.max(0,Number(step)||0); r.lastStudiedAt=new Date().toISOString(); }
function normalize(v){ return String(v??"").trim().toLocaleLowerCase("el-GR").replace(/[.,!?;·]/g,"").replace(/\s+/g," "); }
export function gradePractice(state,lessonId,p,response){
  const r=lessonRecord(state,lessonId); let correct=false;
  if(p.mode==="choice") correct=Number(response)===Number(p.answer);
  else if(p.mode==="build") correct=normalize(response)===normalize(p.answer);
  else if(p.mode==="recall"){
    if(p.answerType==="free") correct=String(response||"").trim().length>=(p.minimumLength||1);
    else correct=(p.accepted||[p.answer]).some(a=>normalize(a)===normalize(response));
  }
  r.practiceAnswers[p.id]={response,correct,at:new Date().toISOString()};
  r.correctCount=Object.values(r.practiceAnswers).filter(x=>x.correct).length;
  r.lastStudiedAt=new Date().toISOString(); return correct;
}
export function completeLesson(state,lessonId){
  const found=getLesson(lessonId); if(!found) return null; const r=lessonRecord(state,lessonId); r.completed=true; r.lastStudiedAt=new Date().toISOString();
  const i=found.cycle.lessons.findIndex(x=>x.id===lessonId); if(i>=0 && i<found.cycle.lessons.length-1) state.progress.currentLessonId=found.cycle.lessons[i+1].id; return r;
}
export function isLessonUnlocked(state,cycle,index){ if(index===0)return true; return Boolean(state.progress?.lessons?.[cycle.lessons[index-1].id]?.completed); }
export function cycleCompletion(state,cycle){ if(!cycle.lessons?.length)return 0; const n=cycle.lessons.filter(l=>state.progress?.lessons?.[l.id]?.completed).length; return Math.round(n/cycle.lessons.length*100); }

export function saveSpeakingAttempt(state, lessonId, itemIndex, data={}) {
  const r = lessonRecord(state, lessonId);
  r.speaking ||= {};
  const key = String(itemIndex);
  r.speaking[key] ||= {attempts:0,bestRating:null,lastDurationMs:0,lastAt:null};
  r.speaking[key].attempts += 1;
  r.speaking[key].lastDurationMs = data.durationMs || 0;
  r.speaking[key].lastAt = new Date().toISOString();
  if (data.rating) {
    const rank = {again:0,almost:1,good:2,natural:3};
    const old = r.speaking[key].bestRating;
    if (!old || rank[data.rating] > rank[old]) r.speaking[key].bestRating = data.rating;
  }
  return r.speaking[key];
}
