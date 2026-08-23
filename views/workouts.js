
import { workouts } from "../data/workouts.js";
import { workoutRecord, isWorkoutUnlocked, completedLessonCount } from "../js/workout-engine.js";

export function renderWorkouts(state) {
  return `<section class="card">
    <span class="pill">Fluency Workouts</span>
    <h2>Use the Greek you already learned.</h2>
    <p>These workouts mix lessons together so you must retrieve and recombine Greek instead of repeating one worksheet immediately after one lesson.</p>
  </section>
  <div class="workout-list">
    ${workouts.map(w => card(state,w)).join("")}
  </div>`;
}

function card(state,w) {
  const unlocked=isWorkoutUnlocked(state,w);
  const count=completedLessonCount(state,w);
  const rec=state.workouts?.sessions?.[w.id];
  return `<section class="card workout-card ${unlocked?"":"is-muted"}">
    <div class="cycle-kicker">${w.subtitle}</div>
    <h2>${w.greekTitle}</h2>
    <h3>${w.title}</h3>
    <p>${w.description}</p>
    <div class="workout-meta"><span>${w.items.length} activities</span><span>${count}/${w.lessonIds.length} related lessons completed</span></div>
    <button class="primary-button wide" ${unlocked?`data-action="open-workout" data-workout="${w.id}"`:"disabled"}>
      ${!unlocked ? `Unlock after ${w.requiredCompleted} related lessons` : rec?.completed ? "Do again" : rec?.started ? "Continue workout" : "Start workout"}
    </button>
  </section>`;
}

export function renderWorkoutSession(state, workout, rec, ui={}) {
  const index=rec.currentIndex||0;
  if(index>=workout.items.length) {
    const total=workout.items.length;
    return `<section class="card completion-card">
      <span class="pill">Fluency Workout Complete</span>
      <h2>${workout.greekTitle}</h2>
      <div class="score-ring">${rec.correctCount}/${total}</div>
      <p>Completion measures retrieval across lessons. Free-production items count as completed attempts, not as proof of perfect Greek.</p>
      <button class="primary-button" data-action="finish-workout" data-workout="${workout.id}">Finish</button>
    </section>`;
  }
  const item=workout.items[index],prior=rec.answers?.[item.id];
  const pct=Math.round(index/workout.items.length*100);
  return `<section class="workout-session">
    <div class="lesson-topline">
      <button class="icon-button" data-action="exit-workout">←</button>
      <div class="lesson-title"><small>${workout.title}</small><strong>${workout.greekTitle}</strong></div>
      <span>${index+1}/${workout.items.length}</span>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    ${renderItem(workout,item,prior)}
  </section>`;
}

function renderItem(workout,item,prior) {
  const result=prior?`<div class="answer-result ${prior.correct?"is-correct":"is-incorrect"}"><strong>${prior.correct?"Good retrieval":"Keep developing"}</strong><p>${item.explanation}</p></div>`:"";

  if(item.type==="choice") {
    return `<div class="practice-card"><span class="activity-label">Mixed retrieval</span><h2>${item.prompt}</h2>
      <div class="choice-list">${item.choices.map((c,i)=>`<button class="choice-button" data-action="workout-choice" data-workout="${workout.id}" data-item="${item.id}" data-answer="${i}" ${prior?"disabled":""}><span>${String.fromCharCode(65+i)}</span><strong lang="el">${c}</strong></button>`).join("")}</div>
      ${result}${prior?nextButton(workout.id):""}</div>`;
  }

  if(item.type==="build") {
    return `<div class="practice-card"><span class="activity-label">Recombine</span><h2>${item.prompt}</h2>
      <div class="token-bank">${item.tokens.map(t=>`<button class="token" data-action="workout-append" ${prior?"disabled":""}>${t}</button>`).join("")}</div>
      <textarea id="workout-input" rows="3" ${prior?"disabled":""}>${prior?.response||""}</textarea>
      ${result}${prior?nextButton(workout.id):`<button class="primary-button wide" data-action="workout-submit" data-workout="${workout.id}" data-item="${item.id}">Check</button>`}</div>`;
  }

  return `<div class="practice-card"><span class="activity-label">${item.type==="free"?"Independent production":"Recall"}</span><h2>${item.prompt}</h2>
    <textarea id="workout-input" rows="${item.type==="free"?6:4}" ${prior?"disabled":""}>${prior?.response||""}</textarea>
    ${result}${prior?nextButton(workout.id):`<button class="primary-button wide" data-action="workout-submit" data-workout="${workout.id}" data-item="${item.id}">${item.type==="free"?"Save response":"Check"}</button>`}</div>`;
}

function nextButton(id) {
  return `<button class="primary-button wide" data-action="workout-next" data-workout="${id}">Continue</button>`;
}
