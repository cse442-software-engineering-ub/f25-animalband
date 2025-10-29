// stage_audioUtil.js
let audioCtx = null;
let masterGainNode = null;

// Lazily create or return existing AudioContext
export const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    //console.log("[DEBUG] Created AudioContext");

    // Create master gain node
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.value = 1; // default master volume 100%
    masterGainNode.connect(audioCtx.destination);
  }
  return audioCtx;
};

// Optional helper to update master volume
export const setMasterVolume = (value) => {
  if (masterGainNode) {
    masterGainNode.gain.value = value;
    //console.log("[DEBUG] Master volume set to:", value);
  }
};

// Play a buffer with optional volume
export const playSound = (buffer, gainValue = 1) => {
  const ctx = getAudioCtx();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.value = gainValue;

  //console.log("[DEBUG] masterGainNode:", masterGainNode);
  //console.log("[DEBUG] masterGainNode.gain.value:", masterGainNode?.gain.value);

  source.connect(gainNode).connect(masterGainNode);

  if (ctx.state === "suspended") {
    ctx.resume().then(() => source.start());
  } else {
    source.start();
  }
};


export const loadSound = async (filename) => {
  const ctx = getAudioCtx();
  const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
  console.log("[DEBUG] Fetching:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not load ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};