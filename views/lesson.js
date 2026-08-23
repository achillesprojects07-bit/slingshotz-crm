
import { getLesson } from "../data/curriculum.js";
import { lessonRecord } from "../js/lesson-engine.js";

export function renderLesson(state, lessonId, ui={}) {
  const found=getLesson(lessonId);
  if(!found) return `<section class="card"><h2>Lesson unavailable</h2></section>`;
  const {lesson,cycle}=found;
  const r=lessonRecord(state,lessonId);
  const total=lesson.items.length+lesson.practice.length+1;
  const step=Math.min(r.currentStep||0,total-1);
  const pct=Math.round(step/Math.max(total-1,1)*100);

  if(step<lesson.items.length){
    const x=lesson.items[step];
    const sp=r.speaking?.[String(step)];
    return shell(lesson,cycle,step,total,pct,`
      <div class="learn-card pronunciation-card">
        <span class="activity-label">${x.type==="vocab"?"Core word":"Useful expression"}</span>
        <div class="greek-display" lang="el">${x.greek}</div>
        <div class="natural-meaning">${x.natural}</div>

        <div class="pronunciation-panel">
          <div class="pronunciation-head">
            <div><strong>Hear it. Say it. Compare.</strong><span>Listen first, then record yourself.</span></div>
            <span class="attempt-count">${sp?.attempts||0} attempts</span>
          </div>

          <div class="pronunciation-actions">
            <button class="speak-button" data-action="hear-greek" data-text="${esc(x.greek)}">
              <span class="action-icon">🔊</span><span><strong>Hear Greek</strong><small>el-GR voice</small></span>
            </button>
            <button class="record-button ${ui.isRecording?"is-recording":""}" data-action="${ui.isRecording?"stop-recording":"start-recording"}" data-lesson="${lesson.id}" data-item-index="${step}">
              <span class="action-icon">${ui.isRecording?"■":"●"}</span><span><strong>${ui.isRecording?"Stop recording":"Record me"}</strong><small>${ui.isRecording?"Recording…":"Tap and speak"}</small></span>
            </button>
          </div>

          ${ui.recordingUrl?`
            <div class="my-recording">
              <div><strong>Your recording</strong><span>${Math.round((ui.recordingDurationMs||0)/1000)}s</span></div>
              <audio controls preload="metadata" src="${ui.recordingUrl}"></audio>
              <div class="compare-row">
                <button class="secondary-button" data-action="hear-greek" data-text="${esc(x.greek)}">Hear Greek again</button>
                <button class="secondary-button" data-action="retry-recording">Record again</button>
              </div>
              <div class="self-rating">
                <span>How did that feel?</span>
                <div>
                  ${rateBtn("again","Again",sp?.bestRating)}
                  ${rateBtn("almost","Almost",sp?.bestRating)}
                  ${rateBtn("good","Good",sp?.bestRating)}
                  ${rateBtn("natural","Natural",sp?.bestRating)}
                </div>
              </div>
            </div>`:""}

          ${ui.message?`<div class="audio-message ${ui.messageType||""}">${ui.message}</div>`:""}
        </div>

        <div class="usage-note"><strong>Natural usage</strong><p>${x.note}</p></div>
      </div>
      <div class="lesson-actions">
        <button class="secondary-button" data-action="lesson-prev" data-lesson="${lesson.id}" ${step===0?"disabled":""}>Back</button>
        <button class="primary-button" data-action="lesson-next" data-lesson="${lesson.id}">Continue</button>
      </div>`);
  }

  if(step<lesson.items.length+lesson.practice.length){
    const p=lesson.practice[step-lesson.items.length];
    return shell(lesson,cycle,step,total,pct,practice(lesson.id,p,r.practiceAnswers?.[p.id]));
  }

  const passed=r.correctCount>=lesson.mastery.requiredCorrect;
  return shell(lesson,cycle,step,total,100,`
    <div class="completion-card"><span class="activity-label">Lesson check</span>
    <h2>${passed?"Ready to move on":"Still developing — and you can continue"}</h2>
    <div class="score-ring">${r.correctCount}/${lesson.practice.length}</div>
    <p>${lesson.mastery.message}</p>
    <p class="small-note">Pronunciation self-ratings are saved as learning evidence but do not block progression.</p>
    <button class="primary-button" data-action="complete-lesson" data-lesson="${lesson.id}">Complete lesson</button></div>`);
}

function shell(l,c,s,t,p,b){
  return `<section class="lesson-shell"><div class="lesson-topline">
  <button class="icon-button" data-action="exit-lesson">←</button>
  <div class="lesson-title"><small>${c.greekTitle}</small><strong>${l.greekTitle}</strong></div><span>${s+1}/${t}</span></div>
  <div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div>${b}</section>`;
}
function practice(id,p,prior){
 const result=prior?`<div class="answer-result ${prior.correct?"is-correct":"is-incorrect"}"><strong>${prior.correct?"Correct":"Not yet"}</strong><p>${p.feedback}</p></div>`:"";
 if(p.mode==="choice") return `<div class="practice-card"><span class="activity-label">Choose naturally</span><h2>${p.prompt}</h2><div class="choice-list">${p.choices.map((c,i)=>`<button class="choice-button" data-action="answer-choice" data-lesson="${id}" data-practice="${p.id}" data-answer="${i}" ${prior?"disabled":""}><span>${String.fromCharCode(65+i)}</span><strong lang="el">${c}</strong></button>`).join("")}</div>${result}${prior?`<button class="primary-button wide" data-action="lesson-next" data-lesson="${id}">Continue</button>`:""}</div>`;
 if(p.mode==="build") return `<div class="practice-card"><span class="activity-label">Build the sentence</span><h2>${p.prompt}</h2><div class="token-bank">${p.tokens.map(t=>`<button class="token" data-action="append-token" ${prior?"disabled":""}>${t}</button>`).join("")}</div><textarea id="practice-input" rows="3" ${prior?"disabled":""}>${prior?.response||""}</textarea>${result}${prior?`<button class="primary-button wide" data-action="lesson-next" data-lesson="${id}">Continue</button>`:`<button class="primary-button wide" data-action="submit-text" data-lesson="${id}" data-practice="${p.id}">Check</button>`}</div>`;
 return `<div class="practice-card"><span class="activity-label">${p.answerType==="free"?"Produce your own Greek":"Recall"}</span><h2>${p.prompt}</h2><textarea id="practice-input" rows="4" ${prior?"disabled":""}>${prior?.response||""}</textarea>${result}${prior?`<button class="primary-button wide" data-action="lesson-next" data-lesson="${id}">Continue</button>`:`<button class="primary-button wide" data-action="submit-text" data-lesson="${id}" data-practice="${p.id}">Check</button>`}</div>`;
}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function rateBtn(v,l,b){return `<button class="rating-button ${b===v?"is-selected":""}" data-action="rate-pronunciation" data-rating="${v}">${l}</button>`;}
