import './footprints.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function showPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

showPageTop();
window.addEventListener('pageshow', showPageTop);

const soundButton = document.querySelector('.trail-sound-toggle');
const backgroundTrack = document.querySelector('#background-track');

backgroundTrack.loop = true;
backgroundTrack.autoplay = true;
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
