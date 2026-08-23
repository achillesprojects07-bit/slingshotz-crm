
export const workouts = [
  {
    id: "fw-01",
    title: "Fluency Workout 1",
    greekTitle: "Μιλάω για μένα",
    subtitle: "Lessons 1–3",
    description: "Combine introductions, place, and work language without relying on one memorized script.",
    lessonIds: ["c01-l01","c01-l02","c01-l03"],
    requiredCompleted: 2,
    items: [
      {
        id:"fw01-01", type:"choice",
        prompt:"You meet someone for the first time. Choose the most natural full-form response after they say «Χάρηκα!»",
        choices:["Και εγώ!","Έχω καλά.","Παρακαλώ είμαι.","Τι κάνεις όνομα;"],
        answer:0,
        explanation:"The app teaches the full standard written form «Και εγώ!»."
      },
      {
        id:"fw01-02", type:"build",
        prompt:"Build: “I am from the Philippines, but I live in Manila.”",
        tokens:["αλλά","Μένω στη Μανίλα.","Είμαι από τις Φιλιππίνες,"],
        answer:"Είμαι από τις Φιλιππίνες, αλλά μένω στη Μανίλα.",
        explanation:"This combines two previously learned place patterns naturally."
      },
      {
        id:"fw01-03", type:"choice",
        prompt:"At a social event, which question naturally asks what someone does professionally?",
        choices:["Με τι ασχολείσαι;","Πού μένεις;","Πώς σε λένε;","Τι κάνεις όνομα;"],
        answer:0,
        explanation:"«Με τι ασχολείσαι;» is a natural broad question about occupation or activity."
      },
      {
        id:"fw01-04", type:"recall",
        prompt:"Type in Greek: “I have my own company.”",
        answer:"Έχω τη δική μου εταιρεία.",
        accepted:["Έχω τη δική μου εταιρεία.","Εχω τη δικη μου εταιρεια."],
        explanation:"Use the complete possessive phrase «τη δική μου εταιρεία»."
      },
      {
        id:"fw01-05", type:"free",
        prompt:"Write a 3-sentence introduction in Greek using your name, where you are from/live, and what you do.",
        minimumLength:45,
        explanation:"There is no single script. The goal is independent recombination."
      }
    ]
  },
  {
    id: "fw-02",
    title: "Fluency Workout 2",
    greekTitle: "Οι άνθρωποι και όσα μου αρέσουν",
    subtitle: "Lessons 4–5",
    description: "Combine family, relationships, and preferences in natural connected Greek.",
    lessonIds: ["c01-l04","c01-l05"],
    requiredCompleted: 2,
    items: [
      {
        id:"fw02-01", type:"choice",
        prompt:"Choose the natural Greek for “My sister lives abroad.”",
        choices:["Η αδελφή μου μένει στο εξωτερικό.","Μου αδελφή είναι έξω χώρα.","Η μου αδελφή μένει εξωτερικά.","Αδελφή μένει μου έξω."],
        answer:0,
        explanation:"The unstressed possessive follows the noun: «η αδελφή μου»."
      },
      {
        id:"fw02-02", type:"build",
        prompt:"Build: “We spend a lot of time together.”",
        tokens:["Περνάμε","πολύ χρόνο","μαζί."],
        answer:"Περνάμε πολύ χρόνο μαζί.",
        explanation:"This is the natural collocation taught in the lesson."
      },
      {
        id:"fw02-03", type:"choice",
        prompt:"Choose the full standard written form for “How about you?” in this preference exchange.",
        choices:["Και εσένα;","Και εσύ είναι;","Τι από εσύ;","Σου εσύ;"],
        answer:0,
        explanation:"The app uses the full form «Και εσένα;» rather than the contracted «Κι εσένα;»."
      },
      {
        id:"fw02-04", type:"recall",
        prompt:"Type in Greek: “I really like traveling.”",
        answer:"Μου αρέσει πολύ να ταξιδεύω.",
        accepted:["Μου αρέσει πολύ να ταξιδεύω.","Μου αρεσει πολυ να ταξιδευω."],
        explanation:"For an activity, Greek naturally uses «μου αρέσει να + verb»."
      },
      {
        id:"fw02-05", type:"free",
        prompt:"Write 3–4 sentences about one person close to you and one or two things you like doing.",
        minimumLength:50,
        explanation:"Use your own content. This is flexible output, not translation."
      }
    ]
  },
  {
    id: "fw-03",
    title: "Cycle Fluency Challenge",
    greekTitle: "Μίλα ελεύθερα",
    subtitle: "Cycle 1 integration",
    description: "Use language from the whole cycle without depending on the lesson order.",
    lessonIds: ["c01-l01","c01-l02","c01-l03","c01-l04","c01-l05","c01-l06"],
    requiredCompleted: 5,
    items: [
      {
        id:"fw03-01", type:"choice",
        prompt:"Which is the best natural opening for a first-time introduction?",
        choices:["Γεια σου! Με λένε Μαρία.","Έχω Μαρία και είμαι όνομα.","Λέω εγώ Μαρία.","Είμαι καλό όνομα Μαρία."],
        answer:0,
        explanation:"This is a natural introduction using the learned pattern."
      },
      {
        id:"fw03-02", type:"build",
        prompt:"Build a connected sentence about work:",
        tokens:["και","Έχω τη δική μου εταιρεία","δουλεύω στη διαφήμιση."],
        answer:"Έχω τη δική μου εταιρεία και δουλεύω στη διαφήμιση.",
        explanation:"This connects two familiar ideas into one natural sentence."
      },
      {
        id:"fw03-03", type:"recall",
        prompt:"Ask in Greek: “What do you like to do in your free time?”",
        answer:"Τι σου αρέσει να κάνεις στον ελεύθερο χρόνο σου;",
        accepted:["Τι σου αρέσει να κάνεις στον ελεύθερο χρόνο σου;","Τι σου αρεσει να κανεις στον ελευθερο χρονο σου;"],
        explanation:"Recall the complete communicative question."
      },
      {
        id:"fw03-04", type:"free",
        prompt:"Write a short self-introduction of at least 5 sentences. Include where you are from, where you live, work, family, and something you enjoy.",
        minimumLength:90,
        explanation:"This measures your ability to combine familiar Greek independently."
      },
      {
        id:"fw03-05", type:"free",
        prompt:"Now continue the conversation: ask the other person at least two natural questions in Greek.",
        minimumLength:25,
        explanation:"Fluency includes keeping the conversation going, not only talking about yourself."
      }
    ]
  }
];

export function getWorkout(id) {
  return workouts.find(w => w.id === id) || null;
}
