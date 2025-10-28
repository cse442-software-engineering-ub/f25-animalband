import { SOUND_CONFIG } from "../stage/stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "../stage/stage_audioUtil";

export async function preloadLandingSounds() {
  const buffers = {};
  for (const s of SOUND_CONFIG) {
    buffers[s.key] = await loadSound(s.file);
  }
  setMasterVolume(1);
  return buffers;
}

export function flattenRecording(rec) {
  if (!Array.isArray(rec)) return [];
  return Array.isArray(rec[0]) ? rec.flat() : rec;
}

export function schedulePlayback(buffers, recording, onDone = () => {}) {
  const timers = [];
  const notes = flattenRecording(recording);
  if (!notes.length) return () => {};

  for (const { key, time } of notes) {
    if (!buffers[key]) continue;
    timers.push(setTimeout(() => playSound(buffers[key], 1), Math.max(0, time)));
  }
  const endAt = Math.max(...notes.map(n => n.time)) + 500;
  timers.push(setTimeout(onDone, endAt));

  return () => timers.forEach(clearTimeout);
}
