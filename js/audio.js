
let currentUtterance = null;

export function speechSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function preloadVoices() {
  if (speechSupported()) speechSynthesis.getVoices();
}

export function stopSpeech() {
  if (!speechSupported()) return;
  speechSynthesis.cancel();
  currentUtterance = null;
}

export function speakGreek(text, rate = 0.84) {
  return new Promise((resolve, reject) => {
    if (!speechSupported()) return reject(new Error("Speech synthesis is not supported."));
    stopSpeech();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "el-GR";
    u.rate = rate;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => /^el(-|_)/i.test(v.lang || ""));
    if (voice) u.voice = voice;
    u.onend = () => { currentUtterance = null; resolve(); };
    u.onerror = e => { currentUtterance = null; reject(new Error(e.error || "Speech playback failed.")); };
    currentUtterance = u;
    speechSynthesis.speak(u);
  });
}
