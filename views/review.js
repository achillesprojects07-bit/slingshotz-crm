
import { dueItems, weakItems, unknownItems, reviewStats, formatDue } from "../js/review-engine.js";

export function renderReview(state, ui={mode:"dashboard",queue:[],index:0,revealed:false}) {
  const stats = reviewStats(state);

  if (ui.mode === "session") {
    return renderSession(state, ui);
  }

  return `
    <section class="card review-hero">
      <span class="pill">Review</span>
      <h2>Strengthen what is fading.</h2>
      <p>Review is separate from the Fluency Path. Due items matter, but they never block new lessons.</p>
      <div class="metric-grid">
        <div class="metric"><strong>${stats.due}</strong><span>Due now</span></div>
        <div class="metric"><strong>${stats.weak}</strong><span>Weak</span></div>
        <div class="metric"><strong>${stats.unknown}</strong><span>Unknown</span></div>
        <div class="metric"><strong>${stats.reviewed}</strong><span>Reviewed before</span></div>
      </div>
      <button class="primary-button review-start" data-action="start-review" data-review-type="due" ${stats.due===0?"disabled":""}>${stats.due ? `Review ${stats.due} due item${stats.due===1?"":"s"}` : "Nothing due now"}</button>
    </section>

    <h3 class="section-title">Review lanes</h3>
    <div class="review-lanes">
      ${lane("Due now","Items scheduled for retrieval today.",stats.due,"due")}
      ${lane("Weak spots","Items with misses, difficulty, or low review stage.",stats.weak,"weak")}
      ${lane("Unknown","Items you explicitly marked as unknown.",stats.unknown,"unknown")}
    </div>

    <section class="card review-note">
      <strong>Spacing used in this phase</strong>
      <p>Successful items expand through roughly 1 → 3 → 7 → 21 → 60 day intervals. Difficult items return sooner. This is a simple, transparent first scheduler rather than an opaque score.</p>
    </section>`;
}

function lane(title,desc,count,type) {
  return `<button class="review-lane" data-action="start-review" data-review-type="${type}" ${count===0?"disabled":""}>
    <div><strong>${title}</strong><span>${desc}</span></div><em>${count}</em>
  </button>`;
}

function renderSession(state,ui) {
  const q=ui.queue||[];
  const current=q[ui.index];
  if(!current) {
    return `<section class="card completion-card">
      <span class="pill">Review complete</span>
      <h2>That review set is finished.</h2>
      <p>You can continue studying even if some items remain weak or become due again.</p>
      <button class="primary-button" data-action="exit-review-session">Back to Review</button>
    </section>`;
  }

  const {item,rec}=current;
  const progress=Math.round((ui.index/Math.max(q.length,1))*100);

  return `<section class="review-session">
    <div class="review-session-top">
      <button class="icon-button" data-action="exit-review-session">←</button>
      <div><small>${item.greekLessonTitle}</small><strong>${ui.index+1} of ${q.length}</strong></div>
      <span>${formatDue(rec)}</span>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>

    <div class="card review-card">
      <span class="activity-label">${item.type==="vocab"?"Recall the word":"Recall the expression"}</span>
      <div class="review-prompt">What does this mean, and how would you use it naturally?</div>
      <div class="greek-display" lang="el">${item.greek}</div>

      ${ui.revealed ? `
        <div class="review-answer">
          <strong>${item.natural}</strong>
          <p>${item.note}</p>
        </div>
        <div class="review-grade">
          <span>How well did you recall it?</span>
          <div>
            <button data-action="grade-review" data-result="again">Again</button>
            <button data-action="grade-review" data-result="hard">Hard</button>
            <button data-action="grade-review" data-result="good">Good</button>
            <button data-action="grade-review" data-result="easy">Easy</button>
          </div>
        </div>` :
        `<button class="primary-button wide" data-action="reveal-review">Reveal answer</button>`
      }

      <button class="unknown-toggle ${state.review?.unknown?.[item.id]?"is-unknown":""}" data-action="toggle-unknown" data-item-id="${item.id}">
        ${state.review?.unknown?.[item.id]?"✓ Marked unknown":"Mark as unknown"}
      </button>
    </div>
  </section>`;
}

export function buildQueue(state,type) {
  if(type==="weak") return weakItems(state,30);
  if(type==="unknown") return unknownItems(state,30);
  return dueItems(state,30);
}
