let audioCtx = null;

// Lazily create or return existing AudioContext
export const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("[DEBUG] Created AudioContext");
  }
  return audioCtx;
};

// Load a sound file into an AudioBuffer
export const loadSound = async (filename) => {
  const ctx = getAudioCtx();
  const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
  console.log("[DEBUG] Fetching:", url);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} - Could not load ${url}`);

  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};

// Play a buffer with optional volume
export const playSound = (buffer, gainValue = 1) => {
  const ctx = getAudioCtx();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.value = gainValue;

  source.connect(gainNode).connect(ctx.destination);

  if (ctx.state === "suspended") {
    ctx.resume().then(() => source.start());
  } else {
    source.start();
  }
};
