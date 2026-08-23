
import { allAvailableLessons } from "../data/curriculum.js";
import { reviewStats } from "../js/review-engine.js";

export function renderProgress(state){
 const lessons=allAvailableLessons(),records=Object.values(state.progress?.lessons||{});
 const done=lessons.filter(l=>state.progress?.lessons?.[l.id]?.completed).length;
 const attempts=records.reduce((n,r)=>n+Object.keys(r.practiceAnswers||{}).length,0);
 const correct=records.reduce((n,r)=>n+(r.correctCount||0),0);
 const speak=records.reduce((n,r)=>n+Object.values(r.speaking||{}).reduce((a,s)=>a+(s.attempts||0),0),0);
 const rs=reviewStats(state); const workoutDone=Object.values(state.workouts?.sessions||{}).filter(w=>w.completed).length;

 return `<section class="card"><span class="pill">Progress</span><h2>Evidence of learning</h2>
 <p>Phase 4 adds memory evidence: due items, weak spots, unknown items, and reviewed material.</p>
 <div class="metric-grid">
 <div class="metric"><strong>${done}/${lessons.length}</strong><span>Lessons complete</span></div>
 <div class="metric"><strong>${attempts?Math.round(correct/attempts*100)+"%":"—"}</strong><span>Retrieval accuracy</span></div>
 <div class="metric"><strong>${speak}</strong><span>Speaking attempts</span></div>
 <div class="metric"><strong>${rs.reviewed}</strong><span>Items reviewed</span></div><div class="metric"><strong>${workoutDone}/3</strong><span>Fluency workouts</span></div>
 </div></section>

 <h3 class="section-title">Memory health</h3>
 <section class="card">
   <div class="metric-grid">
     <div class="metric"><strong>${rs.due}</strong><span>Due now</span></div>
     <div class="metric"><strong>${rs.weak}</strong><span>Weak</span></div>
     <div class="metric"><strong>${rs.unknown}</strong><span>Unknown</span></div>
     <div class="metric"><strong>1·3·7·21·60</strong><span>Review spacing</span></div>
   </div>
 </section>`;
}
