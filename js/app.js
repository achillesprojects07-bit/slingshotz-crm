
import { loadState,saveState,SCHEMA_VERSION } from "./storage.js";
import { renderRoute,renderLessonRoute,validRoute,renderWorkoutsRoute,renderWorkoutSessionRoute } from "./router.js";
import { getLesson,allAvailableLessons } from "../data/curriculum.js";
import { startLesson,setLessonStep,gradePractice,completeLesson,lessonRecord,saveSpeakingAttempt } from "./lesson-engine.js";
import { speakGreek,stopSpeech,preloadVoices,speechSupported } from "./audio.js";
import { recordingSupported,startRecording,stopRecording,cancelRecording,releaseRecordingUrl } from "./recorder.js";
import { ensureReviewState,markUnknown,isUnknown,submitReviewResult,reviewStats } from "./review-engine.js";
import { buildQueue } from "../views/review.js";
import { getWorkout } from "../data/workouts.js";
import { ensureWorkoutState,workoutRecord,startWorkout,gradeWorkoutItem,nextWorkoutItem,completeWorkout } from "./workout-engine.js";

const APP_VERSION="1.4.0-phase5";
const state=loadState();
ensureReviewState(state);
ensureWorkoutState(state);

let activeLessonId=null;
let ui={isRecording:false,recordingUrl:null,recordingDurationMs:0,message:"",messageType:""};
let recordingContext=null;
let reviewUi={mode:"dashboard",queue:[],index:0,revealed:false,type:"due"};
let activeWorkoutId=null;

preloadVoices();
if("speechSynthesis" in window) speechSynthesis.onvoiceschanged=preloadVoices;

function routeFromLocation(){const h=location.hash.replace("#","").trim();return validRoute(h)?h:(validRoute(state.lastRoute)?state.lastRoute:"today");}
function resetAudio(){stopSpeech();cancelRecording();releaseRecordingUrl();ui={isRecording:false,recordingUrl:null,recordingDurationMs:0,message:"",messageType:""};recordingContext=null;}
function go(r){
  resetAudio();activeLessonId=null;
  if(r!=="review") reviewUi={mode:"dashboard",queue:[],index:0,revealed:false,type:"due"};
  renderRoute(r,state,saveState,r==="review"?reviewUi:{});
}
function openLesson(id){if(!getLesson(id))return;resetAudio();activeLessonId=id;startLesson(state,id);saveState(state);renderLessonRoute(id,state,saveState,ui);}
function renderLessonNow(){if(activeLessonId)renderLessonRoute(activeLessonId,state,saveState,ui);}
function renderReviewNow(){renderRoute("review",state,saveState,reviewUi);}
function openWorkouts(){resetAudio();activeLessonId=null;activeWorkoutId=null;renderWorkoutsRoute(state,saveState);}
function openWorkout(id){
  const w=getWorkout(id); if(!w)return;
  activeWorkoutId=id; startWorkout(state,id); saveState(state);
  renderWorkoutSessionRoute(state,saveState,w,workoutRecord(state,id));
}
function renderWorkoutNow(){
  if(!activeWorkoutId)return;
  const w=getWorkout(activeWorkoutId);
  renderWorkoutSessionRoute(state,saveState,w,workoutRecord(state,activeWorkoutId));
}

document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-route]"); if(nav){go(nav.dataset.route);return;}
 const a=e.target.closest("[data-action]"); if(!a)return;
 try{
  const x=a.dataset.action;

  // Fluency Workout actions
  if(x==="open-workouts") return openWorkouts();
  if(x==="open-workout") return openWorkout(a.dataset.workout);
  if(x==="exit-workout"){activeWorkoutId=null;return openWorkouts();}
  if(x==="workout-choice"){
    const w=getWorkout(a.dataset.workout),item=w.items.find(i=>i.id===a.dataset.item);
    gradeWorkoutItem(state,w.id,item,Number(a.dataset.answer));saveState(state);return renderWorkoutNow();
  }
  if(x==="workout-append"){
    const input=document.querySelector("#workout-input");
    if(input) input.value=[input.value.trim(),a.textContent.trim()].filter(Boolean).join(" ");
    return;
  }
  if(x==="workout-submit"){
    const w=getWorkout(a.dataset.workout),item=w.items.find(i=>i.id===a.dataset.item);
    const input=document.querySelector("#workout-input");
    gradeWorkoutItem(state,w.id,item,input?.value||"");saveState(state);return renderWorkoutNow();
  }
  if(x==="workout-next"){
    nextWorkoutItem(state,a.dataset.workout);saveState(state);return renderWorkoutNow();
  }
  if(x==="finish-workout"){
    completeWorkout(state,a.dataset.workout);saveState(state);activeWorkoutId=null;return openWorkouts();
  }

  // Review actions
  if(x==="start-review"){
    reviewUi={mode:"session",queue:buildQueue(state,a.dataset.reviewType),index:0,revealed:false,type:a.dataset.reviewType};
    return renderReviewNow();
  }
  if(x==="exit-review-session"){
    reviewUi={mode:"dashboard",queue:[],index:0,revealed:false,type:"due"};
    return renderReviewNow();
  }
  if(x==="reveal-review"){reviewUi.revealed=true;return renderReviewNow();}
  if(x==="grade-review"){
    const current=reviewUi.queue[reviewUi.index];
    if(current) submitReviewResult(state,current.item.id,a.dataset.result);
    saveState(state);
    reviewUi.index+=1;reviewUi.revealed=false;
    return renderReviewNow();
  }
  if(x==="toggle-unknown"){
    const id=a.dataset.itemId;
    markUnknown(state,id,!isUnknown(state,id));
    saveState(state);
    if(state.lastRoute==="review" && reviewUi.mode==="session"){
      // Keep the current queue stable for predictable UX.
      return renderReviewNow();
    }
    return go(state.lastRoute || "library");
  }

  // Lesson actions
  if(x==="open-lesson") return openLesson(a.dataset.lesson);
  if(x==="exit-lesson") return go("path");
  if(x==="lesson-next"){resetAudio();activeLessonId=a.dataset.lesson;const r=lessonRecord(state,activeLessonId);setLessonStep(state,activeLessonId,r.currentStep+1);saveState(state);return renderLessonNow();}
  if(x==="lesson-prev"){resetAudio();activeLessonId=a.dataset.lesson;const r=lessonRecord(state,activeLessonId);setLessonStep(state,activeLessonId,Math.max(0,r.currentStep-1));saveState(state);return renderLessonNow();}
  if(x==="hear-greek"){ui.message="Playing Greek pronunciation…";ui.messageType="is-info";renderLessonNow();await speakGreek(a.dataset.text);ui.message="";ui.messageType="";return renderLessonNow();}
  if(x==="start-recording"){stopSpeech();recordingContext={lessonId:a.dataset.lesson,itemIndex:Number(a.dataset.itemIndex)};await startRecording();ui.isRecording=true;ui.recordingUrl=null;ui.message="Speak, then tap Stop recording.";ui.messageType="is-info";return renderLessonNow();}
  if(x==="stop-recording"){const out=await stopRecording();ui.isRecording=false;ui.recordingUrl=out.url;ui.recordingDurationMs=out.durationMs;ui.message="Recording ready. Compare it with the Greek audio.";ui.messageType="is-success";if(recordingContext)saveSpeakingAttempt(state,recordingContext.lessonId,recordingContext.itemIndex,{durationMs:out.durationMs});saveState(state);return renderLessonNow();}
  if(x==="retry-recording"){releaseRecordingUrl();ui.recordingUrl=null;ui.recordingDurationMs=0;ui.message="Tap Record me when you're ready.";ui.messageType="is-info";return renderLessonNow();}
  if(x==="rate-pronunciation"){if(recordingContext){saveSpeakingAttempt(state,recordingContext.lessonId,recordingContext.itemIndex,{rating:a.dataset.rating,durationMs:ui.recordingDurationMs});saveState(state);}ui.message=`Saved: ${a.dataset.rating}.`;ui.messageType="is-success";return renderLessonNow();}
  if(x==="answer-choice"){const f=getLesson(a.dataset.lesson),p=f.lesson.practice.find(p=>p.id===a.dataset.practice);gradePractice(state,f.lesson.id,p,Number(a.dataset.answer));saveState(state);return renderLessonNow();}
  if(x==="append-token"){const input=document.querySelector("#practice-input");if(input)input.value=[input.value.trim(),a.textContent.trim()].filter(Boolean).join(" ");return;}
  if(x==="submit-text"){const f=getLesson(a.dataset.lesson),p=f.lesson.practice.find(p=>p.id===a.dataset.practice),input=document.querySelector("#practice-input");gradePractice(state,f.lesson.id,p,input?.value||"");saveState(state);return renderLessonNow();}
  if(x==="complete-lesson"){completeLesson(state,a.dataset.lesson);saveState(state);return go("today");}
 }catch(err){
  console.error(err);ui.isRecording=false;
  const m=String(err?.message||err||"");
  ui.message=/permission|denied|notallowed/i.test(m)?"Microphone permission was denied. Allow microphone access in browser settings, then try again.":/not supported/i.test(m)?"This browser does not support this audio feature.":"Audio could not start. Check microphone permission and try again.";
  ui.messageType="is-error";renderLessonNow();
 }
});

window.addEventListener("hashchange",()=>{if(!activeLessonId)go(routeFromLocation());});
window.addEventListener("beforeunload",()=>resetAudio());

const d=document.querySelector("#diagnostics-dialog");
document.querySelector("#diagnostics-button").addEventListener("click",()=>{
 let storageOK=true;try{localStorage.setItem("__kt","1");localStorage.removeItem("__kt");}catch{storageOK=false;}
 const ls=allAvailableLessons(),rs=reviewStats(state),items=[
 ["App version",APP_VERSION,true],["Curriculum",`${ls.length} lessons loaded`,ls.length===6],
 ["Greek speech",speechSupported()?"Supported":"Unavailable",speechSupported()],
 ["Recording",recordingSupported()?"Supported":"Unavailable",recordingSupported()],
 ["Review engine",`Due ${rs.due} · Weak ${rs.weak} · Unknown ${rs.unknown}`,true],
 ["Fluency workouts","3 configured",true],
 ["Storage",storageOK?"Available":"Unavailable",storageOK],["Schema",`v${SCHEMA_VERSION}`,true],
 ["Service worker","Not installed by design",true]];
 document.querySelector("#diagnostics-content").innerHTML=items.map(([l,v,ok])=>`<div class="health-row"><span>${l}</span><strong class="${ok?"health-ok":"health-warn"}">${v}</strong></div>`).join("");
 d.showModal();
});
go(routeFromLocation());
