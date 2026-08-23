
import { getWorkout, workouts } from "../data/workouts.js";

export function ensureWorkoutState(state) {
  state.workouts ||= {};
  state.workouts.sessions ||= {};
  return state.workouts;
}

export function workoutRecord(state,id) {
  ensureWorkoutState(state);
  state.workouts.sessions[id] ||= {
    started:false,
    completed:false,
    currentIndex:0,
    answers:{},
    correctCount:0,
    lastAt:null
  };
  return state.workouts.sessions[id];
}

export function completedLessonCount(state, workout) {
  return workout.lessonIds.filter(id => state.progress?.lessons?.[id]?.completed).length;
}

export function isWorkoutUnlocked(state, workout) {
  return completedLessonCount(state, workout) >= workout.requiredCompleted;
}

export function availableWorkouts(state) {
  return workouts.filter(w => isWorkoutUnlocked(state,w));
}

function normalize(v) {
  return String(v ?? "")
    .trim()
    .toLocaleLowerCase("el-GR")
    .replace(/[.,!?;·]/g,"")
    .replace(/\s+/g," ");
}

export function gradeWorkoutItem(state, workoutId, item, response) {
  const rec = workoutRecord(state,workoutId);
  let correct=false;
  if(item.type==="choice") correct=Number(response)===Number(item.answer);
  else if(item.type==="build") correct=normalize(response)===normalize(item.answer);
  else if(item.type==="recall") correct=(item.accepted||[item.answer]).some(a=>normalize(a)===normalize(response));
  else if(item.type==="free") correct=String(response||"").trim().length >= (item.minimumLength||1);

  rec.answers[item.id]={response,correct,at:new Date().toISOString()};
  rec.correctCount=Object.values(rec.answers).filter(x=>x.correct).length;
  rec.lastAt=new Date().toISOString();
  return correct;
}

export function startWorkout(state,id) {
  const rec=workoutRecord(state,id);
  rec.started=true;
  rec.lastAt=new Date().toISOString();
  return rec;
}

export function nextWorkoutItem(state,id) {
  const w=getWorkout(id),r=workoutRecord(state,id);
  r.currentIndex=Math.min(r.currentIndex+1,w.items.length);
  r.lastAt=new Date().toISOString();
}

export function resetWorkoutItemView(state,id) {
  const r=workoutRecord(state,id);
  r.lastAt=new Date().toISOString();
}

export function completeWorkout(state,id) {
  const r=workoutRecord(state,id);
  r.completed=true;
  r.lastAt=new Date().toISOString();
  return r;
}
