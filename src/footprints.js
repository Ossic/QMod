import './footprints.css';

const soundButton = document.querySelector('.trail-sound-toggle');
const backgroundTrack = new Audio('/music/happy-lullaby.mp3');

backgroundTrack.loop = true;
backgroundTrack.volume = 0.21;
backgroundTrack.playbackRate = 0.78;
backgroundTrack.preload = 'auto';

if ('preservesPitch' in backgroundTrack) backgroundTrack.preservesPitch = false;

function setSoundState(isPlaying) {
  soundButton.setAttribute('aria-pressed', String(isPlaying));
  document.body.classList.toggle('trail-sound-on', isPlaying);
}

async function startBackgroundTrack() {
  try {
    await backgroundTrack.play();
    setSoundState(true);
  } catch {
    setSoundState(false);
  }
}

function pauseBackgroundTrack() {
  backgroundTrack.pause();
  setSoundState(false);
}

soundButton.addEventListener('click', () => {
  if (!backgroundTrack.paused) {
    pauseBackgroundTrack();
    return;
  }
  startBackgroundTrack();
});

startBackgroundTrack();
window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.trail-sound-toggle')) return;
  if (backgroundTrack.paused) startBackgroundTrack();
}, { once: true });
