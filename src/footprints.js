import './footprints.css';

const soundButton = document.querySelector('.trail-sound-toggle');
const ancientScale = [293.66, 329.63, 392, 440, 493.88, 587.33, 659.25];
let audioContext;
let sequenceTimer;
let sequenceIndex = 0;
let isPlaying = false;

function setSoundState(isPlaying) {
  soundButton.setAttribute('aria-pressed', String(isPlaying));
  document.body.classList.toggle('trail-sound-on', isPlaying);
}

async function startBackgroundTrack() {
  try {
    if (!audioContext) audioContext = new AudioContext();
    await audioContext.resume();
    isPlaying = true;
    playPhrase();
    setSoundState(true);
  } catch {
    isPlaying = false;
    setSoundState(false);
  }
}

function pluckNote(frequency, duration) {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const overtoneGain = audioContext.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, now);
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(frequency * 2, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  overtoneGain.gain.setValueAtTime(0.0001, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.012, now + 0.025);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.64);
  oscillator.connect(gain).connect(audioContext.destination);
  overtone.connect(overtoneGain).connect(audioContext.destination);
  oscillator.start(now);
  overtone.start(now);
  oscillator.stop(now + duration + 0.08);
  overtone.stop(now + duration + 0.08);
}

function playPhrase() {
  if (!isPlaying) return;
  const phrase = [0, 2, 4, 2, 1, 0, 4, 5, 4, 2, 1, 0];
  const note = ancientScale[phrase[sequenceIndex % phrase.length]];
  const duration = sequenceIndex % 4 === 3 ? 2.4 : 1.7;
  pluckNote(note, duration);
  sequenceIndex += 1;
  sequenceTimer = window.setTimeout(playPhrase, duration * 1000);
}

function pauseBackgroundTrack() {
  isPlaying = false;
  window.clearTimeout(sequenceTimer);
  audioContext?.suspend();
  setSoundState(false);
}

soundButton.addEventListener('click', () => {
  if (isPlaying) {
    pauseBackgroundTrack();
    return;
  }
  startBackgroundTrack();
});

startBackgroundTrack();
window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.trail-sound-toggle')) return;
  if (!isPlaying) startBackgroundTrack();
}, { once: true });
