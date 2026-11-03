import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let okPlayer: AudioPlayer | null = null;
let badPlayer: AudioPlayer | null = null;
let ready = false;

function init() {
  if (ready) return;
  ready = true;
  try {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    okPlayer = createAudioPlayer(require('../../assets/sounds/correct.wav'));
    badPlayer = createAudioPlayer(require('../../assets/sounds/wrong.wav'));
  } catch {}
}

export function playFeedback(correct: boolean) {
  init();
  const p = correct ? okPlayer : badPlayer;
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {}
}