
import { getLesson, allAvailableLessons } from "../data/curriculum.js";
import { ensureProgress } from "../js/lesson-engine.js";
import { reviewStats } from "../js/review-engine.js";

export function renderToday(state) {
  ensureProgress(state);
  const current=getLesson(state.progress.currentLessonId)||getLesson("c01-l01");
  const rec=state.progress.lessons?.[current.lesson.id];
  const done=allAvailableLessons().filter(l=>state.progress.lessons?.[l.id]?.completed).length,total=allAvailableLessons().length;
  const rs=reviewStats(state);

  return `<section class="card hero">
    <span class="pill">Fluency Session</span>
    <h2>${current.lesson.greekTitle}</h2>
    <p><strong>${current.lesson.title}</strong> · ${current.lesson.minutes} min</p>
    <p>${current.lesson.objective}</p>
    <button class="primary-button" data-action="open-lesson" data-lesson="${current.lesson.id}">${rec?.started&&!rec?.completed?"Continue lesson":"Start lesson"}</button>
  </section>

  <h3 class="section-title">Your path today</h3>
  <div class="stack">
    <button class="row-card today-action" data-route="review"><div><strong>Review</strong><span>${rs.due ? `${rs.due} due now · optional before new study` : "Nothing due now"}</span></div><span>${rs.due}</span></button>
    <div class="row-card"><div><strong>Learn in context</strong><span>Natural Greek expressions and patterns</span></div><span>${current.lesson.items.length}</span></div>
    <div class="row-card"><div><strong>Speaking</strong><span>Hear + record now active</span></div><span>Live</span></div><button class="row-card today-action" data-action="open-workouts"><div><strong>Fluency Workouts</strong><span>Mixed practice across completed lessons</span></div><span>→</span></button>
  </div>

  <h3 class="section-title">Cycle progress</h3>
  <section class="card"><div class="progress-head"><strong>${done} of ${total} model lessons complete</strong><span>${Math.round(done/total*100)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round(done/total*100)}%"></div></div></section>`;
}
