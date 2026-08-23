
import { renderToday } from "../views/today.js";
import { renderPath } from "../views/path.js";
import { renderReview } from "../views/review.js";
import { renderLibrary } from "../views/library.js";
import { renderProgress } from "../views/progress.js";
import { renderLesson } from "../views/lesson.js";
import { renderWorkouts, renderWorkoutSession } from "../views/workouts.js";

const routes={
  today:{title:"Today",render:renderToday},
  path:{title:"Fluency Path",render:renderPath},
  review:{title:"Review",render:renderReview},
  library:{title:"Library",render:renderLibrary},
  progress:{title:"Progress",render:renderProgress}
};

export function validRoute(r){return Boolean(routes[r]);}

export function renderRoute(route,state,saveState,routeUi={}){
  const r=validRoute(route)?route:"today",c=routes[r];
  document.body.classList.remove("focus-mode");
  document.querySelector("#page-title").textContent=c.title;
  document.querySelector("#view").innerHTML=c.render(state,routeUi);
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("is-active",b.dataset.route===r));
  state.lastRoute=r; saveState(state); history.replaceState({},"",`#${r}`);
}

export function renderLessonRoute(id,state,saveState,ui={}){
  document.body.classList.add("focus-mode");
  document.querySelector("#view").innerHTML=renderLesson(state,id,ui);
  saveState(state);
}

export function renderWorkoutsRoute(state,saveState){
  document.body.classList.add("focus-mode");
  document.querySelector("#view").innerHTML=renderWorkouts(state);
  saveState(state);
}
export function renderWorkoutSessionRoute(state,saveState,workout,rec,ui={}){
  document.body.classList.add("focus-mode");
  document.querySelector("#view").innerHTML=renderWorkoutSession(state,workout,rec,ui);
  saveState(state);
}
