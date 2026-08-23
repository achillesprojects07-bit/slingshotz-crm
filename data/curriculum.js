export const curriculum = {
  orthographyPolicy: {
    standard: "Standard Modern Greek",
    fullForms: true,
    rule: "Preserve correct standard Greek spelling. Do not respell, simplify, anglicize, or use contracted teaching forms when a full standard written form is intended."
  },
  appTarget: {
    cefr: "B1",
    stretch: "B1+",
    deadline: "2026-12-31",
    mission: "Use Greek independently in everyday life through comprehension, recall, listening, speaking, reading and repeated real-world use."
  },
  cycles: [
    {
      id: "cycle-01",
      order: 1,
      title: "Me & My World",
      greekTitle: "Εγώ και ο κόσμος μου",
      cefrBand: "A1→A2 foundation",
      outcome: "Introduce yourself naturally, say where you live and come from, talk simply about work, family, likes, routines and current life.",
      status: "available",
      lessons: [
        {
          id: "c01-l01",
          title: "Meeting Someone",
          greekTitle: "Γνωριμία",
          minutes: 14,
          objective: "Greet someone, give your name, ask another person’s name and respond naturally.",
          grammarFocus: "είμαι + personal information; πώς σε λένε; με λένε",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Γεια σου!", natural:"Hi! / Hello!", note:"Neutral informal greeting to one person. Γεια σας is used politely or to more than one person."},
            {type:"expression", greek:"Πώς σε λένε;", natural:"What’s your name?", note:"Very common everyday phrasing. Do not learn it as a word-for-word English pattern."},
            {type:"expression", greek:"Με λένε Άννα.", natural:"My name is Anna.", note:"Natural conversational answer. Είμαι η Άννα is also common when introducing yourself."},
            {type:"expression", greek:"Χάρηκα!", natural:"Nice to meet you!", note:"Natural short response after an introduction."},
            {type:"expression", greek:"Και εγώ!", natural:"Me too! / Likewise!", note:"Full standard written form used in the teaching content. In natural speech you may also hear the contracted form κι, but the app teaches και in full."},
            {type:"expression", greek:"Τι κάνεις;", natural:"How are you? / How’s it going?", note:"Everyday singular/informal; context determines the natural English meaning."},
            {type:"expression", greek:"Καλά, ευχαριστώ. Εσύ;", natural:"Good, thanks. You?", note:"Simple and natural everyday response."},
            {type:"vocab", greek:"είμαι", natural:"I am / to be", note:"High-frequency verb learned through complete phrases, not as an isolated translation."}
          ],
          practice: [
            {id:"l01-p01", mode:"choice", prompt:"A new acquaintance says: «Γεια σου! Πώς σε λένε;» What is the most natural reply?", choices:["Με λένε Μαρία.","Είμαι καλά το όνομα.","Έχω Μαρία.","Λέω Μαρία."], answer:0, feedback:"«Με λένε Μαρία.» is a normal conversational way to say “My name is Maria.”"},
            {id:"l01-p02", mode:"choice", prompt:"Someone says «Χάρηκα!» after you introduce yourself. Choose the natural response.", choices:["Και εγώ!","Παρακαλώ να είμαι.","Τι όνομα;","Έχω καλά."], answer:0, feedback:"«Και εγώ!» means “Likewise / me too” in this exchange."},
            {id:"l01-p03", mode:"build", prompt:"Build the natural Greek: “Good, thanks. You?”", tokens:["Εσύ;","ευχαριστώ.","Καλά,"], answer:"Καλά, ευχαριστώ. Εσύ;", feedback:"This is a natural short everyday response."},
            {id:"l01-p04", mode:"recall", prompt:"Without looking back: how would you ask one person informally, “What’s your name?”", answer:"Πώς σε λένε;", accepted:["Πώς σε λένε;","Πως σε λένε;"], feedback:"Exactly: «Πώς σε λένε;»"}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"Mastery informs review; it does not trap you or block the Fluency Path."}
        },
        {
          id: "c01-l02",
          title: "Where You’re From & Where You Live",
          greekTitle: "Από πού είσαι;",
          minutes: 16,
          objective: "Say where you are from and where you live, and ask someone else.",
          grammarFocus: "από + place; μένω + σε/στην/στο",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Από πού είσαι;", natural:"Where are you from?", note:"Standard everyday question."},
            {type:"expression", greek:"Είμαι από τις Φιλιππίνες.", natural:"I’m from the Philippines.", note:"Natural country expression; article and preposition are part of the chunk."},
            {type:"expression", greek:"Πού μένεις;", natural:"Where do you live?", note:"Natural everyday singular/informal."},
            {type:"expression", greek:"Μένω στη Μανίλα.", natural:"I live in Manila.", note:"στη = σε + τη(ν). Learn place phrases as complete patterns."},
            {type:"expression", greek:"Μένω κοντά στο κέντρο.", natural:"I live near the center.", note:"Useful natural location phrase."},
            {type:"expression", greek:"Μένεις καιρό εδώ;", natural:"Have you been living here long?", note:"Natural conversational phrasing."},
            {type:"vocab", greek:"μένω", natural:"I live / I stay", note:"Meaning depends on context; here it is used for residence."},
            {type:"vocab", greek:"κοντά", natural:"near / nearby", note:"High-frequency everyday word."}
          ],
          practice: [
            {id:"l02-p01", mode:"choice", prompt:"Choose the natural way to say “I live in Manila.”", choices:["Μένω στη Μανίλα.","Είμαι μέσα Μανίλα.","Ζω σε η Μανίλα.","Έχω Μανίλα."], answer:0, feedback:"«Μένω στη Μανίλα.» is the normal everyday pattern."},
            {id:"l02-p02", mode:"choice", prompt:"Which question asks where someone is from?", choices:["Από πού είσαι;","Πού μένεις;","Τι κάνεις;","Πώς σε λένε;"], answer:0, feedback:"«Από πού είσαι;» = “Where are you from?”"},
            {id:"l02-p03", mode:"build", prompt:"Build: “I’m from the Philippines.”", tokens:["τις Φιλιππίνες.","Είμαι","από"], answer:"Είμαι από τις Φιλιππίνες.", feedback:"Treat «από τις Φιλιππίνες» as a useful complete place chunk."},
            {id:"l02-p04", mode:"recall", prompt:"Ask one person informally: “Where do you live?”", answer:"Πού μένεις;", accepted:["Πού μένεις;","Που μένεις;"], feedback:"Correct: «Πού μένεις;»"}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"Weak items will later enter Review rather than forcing repetition now."}
        },
        {
          id: "c01-l03",
          title: "What You Do",
          greekTitle: "Με τι ασχολείσαι;",
          minutes: 17,
          objective: "Ask and answer what someone does for work in natural conversational Greek.",
          grammarFocus: "δουλεύω; ασχολούμαι με; σε + field/company",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Με τι ασχολείσαι;", natural:"What do you do? / What line of work are you in?", note:"Natural conversational question about occupation or activity; not a literal English mapping."},
            {type:"expression", greek:"Δουλεύω στη διαφήμιση.", natural:"I work in advertising.", note:"Natural field-of-work answer."},
            {type:"expression", greek:"Έχω τη δική μου εταιρεία.", natural:"I have my own company.", note:"Common way to express business ownership."},
            {type:"expression", greek:"Δουλεύω με πολλές εταιρείες.", natural:"I work with many companies.", note:"Useful business/social introduction phrase."},
            {type:"expression", greek:"Μου αρέσει πολύ η δουλειά μου.", natural:"I really like my work.", note:"Natural everyday expression with μου αρέσει."},
            {type:"vocab", greek:"δουλεύω", natural:"I work", note:"Common spoken verb."},
            {type:"vocab", greek:"η δουλειά", natural:"work / job", note:"Meaning depends on sentence context."},
            {type:"vocab", greek:"η εταιρεία", natural:"company", note:"Standard Modern Greek."}
          ],
          practice: [
            {id:"l03-p01",mode:"choice",prompt:"At a social gathering, which is a natural way to ask what someone does professionally?",choices:["Με τι ασχολείσαι;","Τι δουλειά κάνεις εσύ τώρα πάντα;","Ποιο είναι το έργο σου;","Πού είσαι δουλειά;"],answer:0,feedback:"«Με τι ασχολείσαι;» is a natural broad conversational question."},
            {id:"l03-p02",mode:"choice",prompt:"Choose the natural Greek for “I work in advertising.”",choices:["Δουλεύω στη διαφήμιση.","Δουλεύω μέσα διαφήμιση.","Κάνω στη διαφήμιση.","Είμαι διαφήμιση."],answer:0,feedback:"«Δουλεύω στη διαφήμιση.» is idiomatic."},
            {id:"l03-p03",mode:"build",prompt:"Build: “I have my own company.”",tokens:["εταιρεία.","τη δική μου","Έχω"],answer:"Έχω τη δική μου εταιρεία.",feedback:"Natural ownership phrase: «τη δική μου εταιρεία»."},
            {id:"l03-p04",mode:"recall",prompt:"Say: “I really like my work.”",answer:"Μου αρέσει πολύ η δουλειά μου.",accepted:["Μου αρέσει πολύ η δουλειά μου.","Μου αρεσει πολυ η δουλεια μου."],feedback:"Correct. Greek naturally uses the «μου αρέσει» construction here."}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"Mastery records performance without making you repeat the same worksheet endlessly."}
        },
        {
          id: "c01-l04",
          title: "Family & People",
          greekTitle: "Η οικογένεια και οι άνθρωποί μου",
          minutes: 17,
          objective: "Talk simply about important people in your life without forcing English possessive patterns.",
          grammarFocus: "έχω; possessives after the noun; είναι + basic description",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Έχω μεγάλη οικογένεια.", natural:"I have a big family.", note:"Natural simple statement."},
            {type:"expression", greek:"Έχω δύο αδελφές.", natural:"I have two sisters.", note:"Number + noun pattern."},
            {type:"expression", greek:"Η αδελφή μου μένει στο εξωτερικό.", natural:"My sister lives abroad.", note:"The unstressed possessive «μου» normally follows the noun."},
            {type:"expression", greek:"Είμαστε πολύ κοντά.", natural:"We’re very close.", note:"For a close relationship; context distinguishes this from physical distance."},
            {type:"expression", greek:"Περνάμε πολύ χρόνο μαζί.", natural:"We spend a lot of time together.", note:"Natural everyday collocation with περνάω χρόνο."},
            {type:"vocab", greek:"η οικογένεια", natural:"family", note:"Standard everyday noun."},
            {type:"vocab", greek:"η αδελφή", natural:"sister", note:"αδερφή is also very common in everyday use."},
            {type:"vocab", greek:"μαζί", natural:"together", note:"High-frequency everyday word."}
          ],
          practice: [
            {id:"l04-p01",mode:"choice",prompt:"Choose the natural Greek for “My sister lives abroad.”",choices:["Η αδελφή μου μένει στο εξωτερικό.","Μου αδελφή μένει έξω χώρα.","Η μου αδελφή ζει εξωτερική.","Αδελφή μου είναι σε έξω."],answer:0,feedback:"Greek normally places the unstressed possessive after the noun: «η αδελφή μου»."},
            {id:"l04-p02",mode:"choice",prompt:"You mean emotionally close, not physically nearby. Choose “We’re very close.”",choices:["Είμαστε πολύ κοντά.","Είμαστε πολύ δίπλα.","Έχουμε κοντινά.","Είμαστε μαζί κοντά τόπο."],answer:0,feedback:"«Είμαστε πολύ κοντά.» can naturally describe a close relationship."},
            {id:"l04-p03",mode:"build",prompt:"Build: “We spend a lot of time together.”",tokens:["μαζί.","πολύ χρόνο","Περνάμε"],answer:"Περνάμε πολύ χρόνο μαζί.",feedback:"This uses the natural collocation «περνάω χρόνο»."},
            {id:"l04-p04",mode:"recall",prompt:"Say: “I have a big family.”",answer:"Έχω μεγάλη οικογένεια.",accepted:["Έχω μεγάλη οικογένεια.","Εχω μεγαλη οικογενεια."],feedback:"Correct."}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"The lesson result becomes evidence for future review, not a hard gate."}
        },
        {
          id: "c01-l05",
          title: "Likes & Everyday Preferences",
          greekTitle: "Τι σου αρέσει;",
          minutes: 18,
          objective: "Talk naturally about things you like doing and ask someone else.",
          grammarFocus: "μου αρέσει + noun / να + verb; σου αρέσει;",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Τι σου αρέσει να κάνεις στον ελεύθερο χρόνο σου;", natural:"What do you like to do in your free time?", note:"Natural complete question; learn it in meaningful chunks."},
            {type:"expression", greek:"Μου αρέσει να περπατάω.", natural:"I like walking.", note:"Greek commonly uses «μου αρέσει να + verb» for activities."},
            {type:"expression", greek:"Μου αρέσει πολύ να ταξιδεύω.", natural:"I really like traveling.", note:"Natural activity preference."},
            {type:"expression", greek:"Μου αρέσει να μαθαίνω γλώσσες.", natural:"I like learning languages.", note:"Useful personal conversation phrase."},
            {type:"expression", greek:"Και εσένα;", natural:"How about you? / And you?", note:"Full standard written form used in the teaching content."},
            {type:"vocab", greek:"ο ελεύθερος χρόνος", natural:"free time", note:"Common phrase."},
            {type:"vocab", greek:"ταξιδεύω", natural:"I travel", note:"Used after να as «να ταξιδεύω» here."},
            {type:"vocab", greek:"μαθαίνω", natural:"I learn", note:"High-frequency verb."}
          ],
          practice: [
            {id:"l05-p01",mode:"choice",prompt:"Choose the natural way to say “I like walking.”",choices:["Μου αρέσει να περπατάω.","Εγώ αρέσω περπάτημα.","Μου αρέσει περπατώ εγώ.","Έχω αρέσει να περπατάω."],answer:0,feedback:"For an activity, «μου αρέσει να + verb» is a core natural pattern."},
            {id:"l05-p02",mode:"choice",prompt:"After saying what you like, what is a natural short way to ask “How about you?”",choices:["Και εσένα;","Και εσύ είναι;","Τι από εσύ;","Σου εσύ;"],answer:0,feedback:"«Και εσένα;» is the full standard written form taught here."},
            {id:"l05-p03",mode:"build",prompt:"Build: “I really like traveling.”",tokens:["να ταξιδεύω.","πολύ","Μου αρέσει"],answer:"Μου αρέσει πολύ να ταξιδεύω.",feedback:"Natural word order and construction."},
            {id:"l05-p04",mode:"recall",prompt:"Say: “I like learning languages.”",answer:"Μου αρέσει να μαθαίνω γλώσσες.",accepted:["Μου αρέσει να μαθαίνω γλώσσες.","Μου αρεσει να μαθαινω γλωσσες."],feedback:"Correct."}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"Performance will later feed spaced review and speaking practice."}
        },
        {
          id: "c01-l06",
          title: "Put It Together",
          greekTitle: "Μίλα για σένα",
          minutes: 20,
          objective: "Combine the cycle into a short, natural self-introduction and simple two-way conversation.",
          grammarFocus: "integration of Cycle 1 patterns",
          register: "neutral everyday",
          items: [
            {type:"expression", greek:"Γεια σου! Με λένε Μαρία.", natural:"Hi! My name is Maria.", note:"Natural opening."},
            {type:"expression", greek:"Είμαι από τις Φιλιππίνες, αλλά μένω στη Μανίλα.", natural:"I’m from the Philippines, but I live in Manila.", note:"Connects two familiar facts naturally with αλλά."},
            {type:"expression", greek:"Έχω τη δική μου εταιρεία και δουλεύω στη διαφήμιση.", natural:"I have my own company and I work in advertising.", note:"Natural connected introduction."},
            {type:"expression", greek:"Στον ελεύθερο χρόνο μου, μου αρέσει να περπατάω και να ταξιδεύω.", natural:"In my free time, I like walking and traveling.", note:"Natural activity summary."},
            {type:"expression", greek:"Εσύ; Πες μου λίγα πράγματα για σένα.", natural:"How about you? Tell me a little about yourself.", note:"Natural conversational handoff."},
            {type:"vocab", greek:"αλλά", natural:"but", note:"Connector for building longer speech."},
            {type:"vocab", greek:"λίγα πράγματα", natural:"a few things / a little", note:"Here it means a little information about yourself."},
            {type:"vocab", greek:"για σένα", natural:"about you / for you", note:"Context determines meaning; here: about you."}
          ],
          practice: [
            {id:"l06-p01",mode:"choice",prompt:"Which sounds like a natural connected introduction?",choices:["Είμαι από τις Φιλιππίνες, αλλά μένω στη Μανίλα.","Είμαι από Φιλιππίνες όμως κατοικώ μέσα τη Μανίλα.","Από είμαι Φιλιππίνες και είμαι μένω Μανίλα.","Είμαι Φιλιππίνες αλλά έχω Μανίλα."],answer:0,feedback:"This uses the place phrases learned earlier and connects them naturally."},
            {id:"l06-p02",mode:"choice",prompt:"Choose the natural conversational handoff meaning “How about you? Tell me a little about yourself.”",choices:["Εσύ; Πες μου λίγα πράγματα για σένα.","Εσύ; Λέγε τα προσωπικά σου όλα.","Τι είσαι; Πες πληροφορίες.","Και εσύ; Δώσε βιογραφικό."],answer:0,feedback:"The first option is friendly and natural in ordinary conversation."},
            {id:"l06-p03",mode:"build",prompt:"Build a natural sentence: “In my free time, I like walking and traveling.”",tokens:["και να ταξιδεύω.","μου αρέσει","Στον ελεύθερο χρόνο μου,","να περπατάω"],answer:"Στον ελεύθερο χρόνο μου, μου αρέσει να περπατάω και να ταξιδεύω.",feedback:"This is an integrated sentence you can reuse in real conversation."},
            {id:"l06-p04",mode:"recall",prompt:"Give a short Greek introduction using at least 3 ideas from this cycle. Type your own answer; there is no single required script.",answerType:"free",minimumLength:20,feedback:"Good. The point is independent production, not copying one memorized paragraph."}
          ],
          mastery:{requiredCorrect:3,total:4,canContinueOnFail:true,message:"Cycle completion records progress; review remains separate."}
        }
      ]
    },
    {id:"cycle-02",order:2,title:"Everyday Life",greekTitle:"Η καθημερινότητά μου",cefrBand:"A2",outcome:"Talk about routines, time, meals, home and everyday plans.",status:"coming-soon",lessons:[]},
    {id:"cycle-03",order:3,title:"Social Greek",greekTitle:"Παρέα και σχέδια",cefrBand:"A2",outcome:"Make plans, invite, accept, decline and keep an everyday conversation going.",status:"coming-soon",lessons:[]}
  ]
};

export function getCycle(cycleId){ return curriculum.cycles.find(c=>c.id===cycleId); }
export function getLesson(lessonId){
  for(const cycle of curriculum.cycles){
    const lesson=(cycle.lessons||[]).find(l=>l.id===lessonId);
    if(lesson) return {cycle,lesson};
  }
  return null;
}
export function allAvailableLessons(){ return curriculum.cycles.flatMap(c=>c.lessons||[]); }
