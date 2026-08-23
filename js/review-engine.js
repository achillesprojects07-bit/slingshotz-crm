
import { allAvailableLessons } from "../data/curriculum.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVALS_DAYS = [1, 3, 7, 21, 60];

export function ensureReviewState(state) {
  state.review ||= {};
  state.review.items ||= {};
  state.review.unknown ||= {};
  return state.review;
}

export function allLearningItems() {
  return allAvailableLessons().flatMap(lesson =>
    lesson.items.map((item, itemIndex) => ({
      id: `${lesson.id}::${itemIndex}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      greekLessonTitle: lesson.greekTitle,
      itemIndex,
      ...item
    }))
  );
}

export function getLearningItem(itemId) {
  return allLearningItems().find(x => x.id === itemId) || null;
}

function nowMs() { return Date.now(); }

export function reviewRecord(state, itemId) {
  ensureReviewState(state);
  state.review.items[itemId] ||= {
    itemId,
    stage: 0,
    dueAt: nowMs(),
    lastReviewedAt: null,
    lastResult: null,
    correctStreak: 0,
    lapses: 0,
    seenInReview: 0,
    source: "learned"
  };
  return state.review.items[itemId];
}

export function seedReviewFromProgress(state) {
  ensureReviewState(state);
  const items = allLearningItems();

  for (const item of items) {
    const lessonProgress = state.progress?.lessons?.[item.lessonId];
    if (!lessonProgress?.started) continue;

    const rec = reviewRecord(state, item.id);

    // If the user self-rated pronunciation, use that as evidence.
    const speaking = lessonProgress.speaking?.[String(item.itemIndex)];
    if (speaking?.bestRating === "again") {
      rec.stage = 0;
      rec.dueAt = Math.min(rec.dueAt || nowMs(), nowMs());
      rec.source = "pronunciation";
    } else if (speaking?.bestRating === "almost") {
      rec.stage = Math.min(rec.stage, 1);
      rec.dueAt = Math.min(rec.dueAt || nowMs(), nowMs() + DAY_MS);
      rec.source = "pronunciation";
    } else if (speaking?.bestRating === "natural" && rec.seenInReview === 0) {
      rec.stage = Math.max(rec.stage, 1);
      rec.dueAt = Math.max(rec.dueAt || 0, nowMs() + 3 * DAY_MS);
    }

    // Completed lessons should have their content represented in review.
    if (lessonProgress.completed && !rec.lastReviewedAt && !rec.dueAt) {
      rec.dueAt = nowMs() + DAY_MS;
    }
  }

  // Practice mistakes become weak signals for the lesson's items.
  for (const lesson of allAvailableLessons()) {
    const lp = state.progress?.lessons?.[lesson.id];
    if (!lp) continue;
    const wrongCount = Object.values(lp.practiceAnswers || {}).filter(x => !x.correct).length;
    if (wrongCount > 0) {
      lesson.items.forEach((item, idx) => {
        const rec = reviewRecord(state, `${lesson.id}::${idx}`);
        if (rec.seenInReview === 0) {
          rec.stage = 0;
          rec.dueAt = Math.min(rec.dueAt || nowMs(), nowMs());
          rec.source = "lesson-weakness";
        }
      });
    }
  }
}

export function markUnknown(state, itemId, isUnknown=true) {
  ensureReviewState(state);
  if (isUnknown) {
    state.review.unknown[itemId] = true;
    const rec = reviewRecord(state, itemId);
    rec.stage = 0;
    rec.dueAt = nowMs();
    rec.source = "unknown";
  } else {
    delete state.review.unknown[itemId];
  }
}

export function isUnknown(state, itemId) {
  return Boolean(state.review?.unknown?.[itemId]);
}

export function submitReviewResult(state, itemId, result) {
  const rec = reviewRecord(state, itemId);
  rec.seenInReview += 1;
  rec.lastReviewedAt = nowMs();
  rec.lastResult = result;

  if (result === "again") {
    rec.stage = 0;
    rec.correctStreak = 0;
    rec.lapses += 1;
    rec.dueAt = nowMs(); // stays due; UI can move to next item without trapping user
  } else if (result === "hard") {
    rec.correctStreak += 1;
    rec.stage = Math.max(0, Math.min(rec.stage, 1));
    rec.dueAt = nowMs() + DAY_MS;
  } else if (result === "good") {
    rec.correctStreak += 1;
    rec.stage = Math.min(rec.stage + 1, INTERVALS_DAYS.length - 1);
    rec.dueAt = nowMs() + INTERVALS_DAYS[rec.stage] * DAY_MS;
  } else if (result === "easy") {
    rec.correctStreak += 1;
    rec.stage = Math.min(rec.stage + 2, INTERVALS_DAYS.length - 1);
    rec.dueAt = nowMs() + INTERVALS_DAYS[rec.stage] * DAY_MS;
  }
  return rec;
}

export function dueItems(state, limit=50) {
  seedReviewFromProgress(state);
  const now = nowMs();
  return allLearningItems()
    .map(item => ({ item, rec: reviewRecord(state, item.id) }))
    .filter(x => {
      const lessonProgress = state.progress?.lessons?.[x.item.lessonId];
      const hasBeenExposed = Boolean(lessonProgress?.started);
      return hasBeenExposed && x.rec.dueAt <= now;
    })
    .sort((a,b) => {
      const au = isUnknown(state,a.item.id) ? 0 : 1;
      const bu = isUnknown(state,b.item.id) ? 0 : 1;
      if (au !== bu) return au - bu;
      if (a.rec.stage !== b.rec.stage) return a.rec.stage - b.rec.stage;
      return a.rec.dueAt - b.rec.dueAt;
    })
    .slice(0, limit);
}

export function weakItems(state, limit=50) {
  seedReviewFromProgress(state);
  return allLearningItems()
    .map(item => ({item,rec:reviewRecord(state,item.id)}))
    .filter(x => {
      const lessonProgress = state.progress?.lessons?.[x.item.lessonId];
      return Boolean(lessonProgress?.started) &&
        (x.rec.lapses > 0 || x.rec.lastResult === "again" || x.rec.lastResult === "hard" || x.rec.stage <= 1);
    })
    .sort((a,b) => (b.rec.lapses - a.rec.lapses) || (a.rec.stage - b.rec.stage))
    .slice(0,limit);
}

export function unknownItems(state, limit=50) {
  ensureReviewState(state);
  return allLearningItems()
    .filter(item => isUnknown(state,item.id))
    .map(item => ({item,rec:reviewRecord(state,item.id)}))
    .slice(0,limit);
}

export function reviewStats(state) {
  seedReviewFromProgress(state);
  const due = dueItems(state,999).length;
  const unknown = unknownItems(state,999).length;
  const weak = weakItems(state,999).length;
  const records = Object.values(state.review?.items || {});
  const reviewed = records.filter(r => r.seenInReview > 0).length;
  return {due,unknown,weak,reviewed};
}

export function formatDue(rec) {
  if (!rec) return "New";
  const delta = rec.dueAt - nowMs();
  if (delta <= 0) return "Due now";
  const days = Math.ceil(delta / DAY_MS);
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export { INTERVALS_DAYS };
