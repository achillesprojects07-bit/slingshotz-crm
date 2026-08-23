
import { allAvailableLessons } from "../data/curriculum.js";
import { isUnknown } from "../js/review-engine.js";

export function renderLibrary(state) {
  const lessons=allAvailableLessons();
  const items=lessons.flatMap(l=>l.items.map((i,index)=>({...i,lesson:l.greekTitle,lessonId:l.id,itemIndex:index,id:`${l.id}::${index}`})));
  return `<section class="card"><span class="pill">Library</span><h2>Cycle 1 language</h2>
    <p>Library content is independent of lesson completion. Mark anything unfamiliar and it will enter the Unknown review lane.</p>
    <div class="metric-grid"><div class="metric"><strong>${lessons.length}</strong><span>Lessons</span></div><div class="metric"><strong>${items.length}</strong><span>Core items</span></div></div>
  </section>
  <div class="library-list">${items.map(x=>`
    <article class="library-item">
      <div><strong lang="el">${x.greek}</strong><span>${x.natural}</span></div>
      <div class="library-actions">
        <small>${x.lesson}</small>
        <button class="mini-unknown ${isUnknown(state,x.id)?"is-unknown":""}" data-action="toggle-unknown" data-item-id="${x.id}">
          ${isUnknown(state,x.id)?"Unknown ✓":"Mark unknown"}
        </button>
      </div>
    </article>`).join("")}</div>`;
}
