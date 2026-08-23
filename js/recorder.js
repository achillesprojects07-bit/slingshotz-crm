
let recorder = null;
let stream = null;
let chunks = [];
let activeUrl = null;
let startedAt = 0;

export function recordingSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

function bestMime() {
  const options = ["audio/mp4","audio/webm;codecs=opus","audio/webm"];
  return options.find(x => MediaRecorder.isTypeSupported?.(x)) || "";
}

function stopStream() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
}

export async function startRecording() {
  if (!recordingSupported()) throw new Error("Audio recording is not supported.");
  stopStream();
  chunks = [];
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true }
  });
  const mime = bestMime();
  recorder = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream);
  recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
  startedAt = Date.now();
  recorder.start();
}

export function stopRecording() {
  return new Promise((resolve,reject) => {
    if (!recorder || recorder.state === "inactive") return reject(new Error("No active recording."));
    const r = recorder;
    r.onstop = () => {
      const blob = new Blob(chunks,{type:r.mimeType || "audio/webm"});
      if (activeUrl) URL.revokeObjectURL(activeUrl);
      activeUrl = URL.createObjectURL(blob);
      const durationMs = Date.now() - startedAt;
      stopStream();
      recorder = null;
      resolve({url:activeUrl,durationMs});
    };
    r.onerror = () => { stopStream(); recorder=null; reject(new Error("Recording failed.")); };
    r.stop();
  });
}

export function cancelRecording() {
  try { if (recorder && recorder.state !== "inactive") recorder.stop(); } catch {}
  stopStream();
  recorder = null;
  chunks = [];
}

export function releaseRecordingUrl() {
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = null;
}
