import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './styles.css';

const canvas = document.querySelector('#figure-scene');
const resetButton = document.querySelector('.reset-view');
const soundButton = document.querySelector('.sound-toggle');
const shootingStar = document.querySelector('.shooting-star');
const changeFigureButton = document.querySelector('.change-figure');
const changeDialogue = document.querySelector('.change-dialogue');
const changeDialogueExit = document.querySelector('.change-dialogue-exit');
const feedbackButton = document.querySelector('.feedback-toggle');
const feedbackDialog = document.querySelector('.feedback-dialog');
const feedbackBackdrop = document.querySelector('.feedback-backdrop');
const feedbackCloseButton = document.querySelector('.feedback-close');
const copyEmailButton = document.querySelector('.copy-email');
const modelLoading = document.querySelector('.model-loading');
const isIPhoneWebKit = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const dust = document.querySelector('#poem-dust');
const backgroundTrack = document.querySelector('#background-track');
backgroundTrack.loop = true;
backgroundTrack.autoplay = true;
backgroundTrack.volume = 0.18;
backgroundTrack.preload = 'auto';
const poemCharacters = ['\u6708', '\u98ce', '\u6c5f', '\u9152', '\u7af9', '\u4e91', '\u6e38', '\u8bcd'];
const changeCharacterDelay = 220;
const changeFadeDuration = 3200;
const changeDialogueOverlapDelay = 760;
let changeMessages = [];
let changeMessageIndex = 0;
let changeDialogueTimer;
let changeDialogueExitTimer;
let changeDialogueRequestId = 0;
let changeDialoguePaused = false;
let changeDialogueNextAction;
let changeDialogueNextDueAt = 0;
let changeDialogueRemainingDelay = 0;
let changeLongPressTimer;
let suppressChangeClick = false;
const changeLongPressDelay = 650;

function parseChangeMessages(markdown) {
  return markdown.trim().split(/\r?\n\s*\r?\n/).map((paragraph) => (
    paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  )).filter((paragraph) => paragraph.length);
}

const changeMessagesReady = fetch('/content/change-dialogue.md', { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error('Unable to load Chang\'e dialogue');
    return response.text();
  })
  .then((markdown) => {
    changeMessages = parseChangeMessages(markdown);
    return changeMessages;
  })
  .catch(() => []);

for (let index = 0; index < 18; index += 1) {
  const glyph = document.createElement('span');
  glyph.textContent = poemCharacters[index % poemCharacters.length];
  glyph.style.setProperty('--x', `${5 + ((index * 19) % 89)}%`);
  glyph.style.setProperty('--y', `${8 + ((index * 29) % 74)}%`);
  glyph.style.setProperty('--delay', `${(index % 6) * -1.25}s`);
  glyph.style.setProperty('--duration', `${8 + (index % 5)}s`);
  dust.appendChild(glyph);
}

function hideChangeDialogue() {
  changeDialogue.classList.remove('is-visible', 'is-leaving', 'is-paused');
  changeDialogueExit.classList.remove('is-visible', 'is-leaving');
  changeDialogueExit.replaceChildren();
  changeDialogue.setAttribute('aria-hidden', 'true');
  changeFigureButton.setAttribute('aria-expanded', 'false');
  changeDialoguePaused = false;
  changeDialogueNextAction = undefined;
  changeDialogueNextDueAt = 0;
  changeDialogueRemainingDelay = 0;
}

function clearChangeDialogueTimers() {
  window.clearTimeout(changeDialogueTimer);
  window.clearTimeout(changeDialogueExitTimer);
  changeDialogueNextAction = undefined;
  changeDialogueNextDueAt = 0;
  changeDialogueRemainingDelay = 0;
}

function moveDialogueToExit() {
  changeDialogueExit.replaceChildren(...changeDialogue.childNodes);
  changeDialogueExit.classList.add('is-visible', 'is-leaving');
  changeDialogue.classList.remove('is-visible', 'is-leaving', 'is-paused');
  changeDialogue.setAttribute('aria-hidden', 'true');
  changeDialogueExitTimer = window.setTimeout(() => {
    changeDialogueExit.classList.remove('is-visible', 'is-leaving');
    changeDialogueExit.replaceChildren();
  }, changeFadeDuration);
}

function scheduleChangeAction(action, delay) {
  window.clearTimeout(changeDialogueTimer);
  changeDialogueNextAction = action;
  changeDialogueNextDueAt = performance.now() + delay;
  changeDialogueTimer = window.setTimeout(() => {
    changeDialogueNextAction = undefined;
    changeDialogueNextDueAt = 0;
    action();
  }, delay);
}

function getChangeCompleteHold(lines) {
  const characterCount = lines.join('').replace(/[\u3002\uff0c\uff1b\u3001\u2014\s]/g, '').length;
  return Math.max(2000, (characterCount / 20) * 2500);
}

function renderChangeParagraph() {
  const lines = changeMessages[changeMessageIndex];
  const characters = lines.flatMap((line) => [...line]);
  let characterIndex = 0;
  changeDialogue.replaceChildren(...lines.map((line) => {
    const item = document.createElement('span');
    item.className = 'change-dialogue-line';
    for (const character of line) {
      const glyph = document.createElement('i');
      glyph.className = 'change-dialogue-char';
      glyph.textContent = character;
      glyph.style.setProperty('--character-delay', `${characterIndex * changeCharacterDelay}ms`);
      const windX = -62 - Math.round(Math.random() * 54);
      const windY = -34 - Math.round(Math.random() * 38);
      const windRotate = -32 + Math.round(Math.random() * 64);
      glyph.style.setProperty('--wind-x', `${windX}px`);
      glyph.style.setProperty('--wind-y', `${windY}px`);
      glyph.style.setProperty('--wind-rotate', `${windRotate}deg`);
      glyph.style.setProperty('--wind-delay', `${Math.round(Math.random() * 280)}ms`);
      characterIndex += 1;
      item.appendChild(glyph);
    }
    return item;
  }));
  changeDialogue.setAttribute('aria-hidden', 'false');
  changeDialogue.classList.remove('is-leaving', 'is-paused');
  changeDialogue.classList.add('is-visible');
  changeFigureButton.setAttribute('aria-expanded', 'true');
  changeDialoguePaused = false;

  const typingDuration = characters.length * changeCharacterDelay + 440;
  const completeHold = getChangeCompleteHold(lines);
  const isLastParagraph = changeMessageIndex === changeMessages.length - 1;
  const fadeAndContinue = () => {
    moveDialogueToExit();
    scheduleChangeAction(() => {
      if (isLastParagraph) {
        hideChangeDialogue();
        return;
      }
      changeMessageIndex += 1;
      renderChangeParagraph();
    }, isLastParagraph ? changeFadeDuration : changeDialogueOverlapDelay);
  };

  scheduleChangeAction(fadeAndContinue, typingDuration + completeHold + (isLastParagraph ? 2400 : 0));
}

async function startChangeDialogue() {
  const requestId = ++changeDialogueRequestId;
  clearChangeDialogueTimers();
  hideChangeDialogue();
  await changeMessagesReady;
  if (requestId !== changeDialogueRequestId || !changeMessages.length) return;
  changeMessageIndex = 0;
  window.setTimeout(renderChangeParagraph, 180);
}

function markChangeFigureActivated() {
  changeFigureButton.classList.add('is-activated');
}

function pauseChangeDialogue() {
  if (!changeDialogueNextAction || changeDialogue.classList.contains('is-leaving')) return;
  changeDialogueRemainingDelay = Math.max(0, changeDialogueNextDueAt - performance.now());
  window.clearTimeout(changeDialogueTimer);
  changeDialoguePaused = true;
  changeDialogue.classList.add('is-paused');
}

function resumeChangeDialogue() {
  if (!changeDialoguePaused || !changeDialogueNextAction) return;
  const action = changeDialogueNextAction;
  const delay = changeDialogueRemainingDelay;
  changeDialoguePaused = false;
  changeDialogue.classList.remove('is-paused');
  scheduleChangeAction(action, delay);
}

function resetChangeDialogue() {
  changeDialogueRequestId += 1;
  clearChangeDialogueTimers();
  hideChangeDialogue();
}

changeFigureButton.addEventListener('pointerdown', (event) => {
  if (event.button && event.pointerType === 'mouse') return;
  window.clearTimeout(changeLongPressTimer);
  changeLongPressTimer = window.setTimeout(() => {
    suppressChangeClick = true;
    markChangeFigureActivated();
    startChangeDialogue();
  }, changeLongPressDelay);
});

['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
  changeFigureButton.addEventListener(eventName, () => window.clearTimeout(changeLongPressTimer));
});

changeFigureButton.addEventListener('click', () => {
  markChangeFigureActivated();
  if (suppressChangeClick) {
    suppressChangeClick = false;
    return;
  }
  if (!changeDialogue.classList.contains('is-visible')) {
    startChangeDialogue();
    return;
  }
  if (changeDialoguePaused) {
    resumeChangeDialogue();
    return;
  }
  pauseChangeDialogue();
});

changeFigureButton.addEventListener('dblclick', (event) => {
  event.preventDefault();
  resetChangeDialogue();
});

changeFigureButton.addEventListener('contextmenu', (event) => event.preventDefault());
changeFigureButton.addEventListener('dragstart', (event) => event.preventDefault());

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x10162f, 0.035);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 8.1);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isIPhoneWebKit,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isIPhoneWebKit ? 1 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !isIPhoneWebKit;
if (!isIPhoneWebKit) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.NONE;
controls.minPolarAngle = 0.65;
controls.maxPolarAngle = 1.65;
controls.target.set(0, 0.8, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.48;

scene.add(new THREE.HemisphereLight(0xd6def8, 0x14172d, 2.3));
const keyLight = new THREE.DirectionalLight(0xfff0bf, 3.4);
keyLight.position.set(-3, 5, 4);
keyLight.castShadow = true;
scene.add(keyLight);
const rimLight = new THREE.PointLight(0xb74a50, 11, 12, 2);
rimLight.position.set(3, 2.5, -2);
scene.add(rimLight);

const starsGeometry = new THREE.BufferGeometry();
const starCount = 150;
const starPositions = new Float32Array(starCount * 3);
for (let index = 0; index < starCount; index += 1) {
  const radius = 3.2 + Math.random() * 4.5;
  const angle = Math.random() * Math.PI * 2;
  starPositions[index * 3] = Math.cos(angle) * radius;
  starPositions[index * 3 + 1] = -0.5 + Math.random() * 5.2;
  starPositions[index * 3 + 2] = Math.sin(angle) * radius - 1.2;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xf8dea0, size: 0.032, transparent: true, opacity: 0.85, sizeAttenuation: true }));
scene.add(stars);

let figure;
let mixer;
let figureBaseY = 0;
const loader = new GLTFLoader();
const modelUrl = isIPhoneWebKit ? '/models/chibi-figure-ios-quality.glb' : '/models/chibi-figure.glb';
function setModelStatus(message, state) {
  modelLoading.querySelector('span').textContent = message;
  document.body.classList.remove('model-ready', 'model-fallback');
  if (state) document.body.classList.add(state);
}

loader.load(modelUrl, (gltf) => {
  figure = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(figure);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = (3.55 * 0.75) / Math.max(size.x, size.y, size.z);
  figure.scale.setScalar(scale);
  figureBaseY = -center.y * scale - 0.55;
  figure.position.set(-center.x * scale, figureBaseY, -center.z * scale);
  figure.rotation.set(THREE.MathUtils.degToRad(4), THREE.MathUtils.degToRad(-10), 0);
  figure.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) node.material.envMapIntensity = 0.72;
    }
  });
  scene.add(figure);
  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(figure);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  }
  window.__CHIBI_READY = true;
  setModelStatus('\u4eba\u7269\u5df2\u81f3\u6708\u4e0b', 'model-ready');
}, (event) => {
  if (event.lengthComputable) {
    setModelStatus(`\u6b63\u5728\u8f7d\u5165\u4eba\u7269 ${Math.round((event.loaded / event.total) * 100)}%`);
  } else if (event.loaded > 0) {
    setModelStatus('\u6b63\u5728\u8f7d\u5165\u4eba\u7269');
  }
}, () => setModelStatus('\u4eba\u7269\u672a\u80fd\u62b5\u8fbe\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5', 'model-fallback'));

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  setModelStatus('\u7ed8\u5236\u4e2d\u65ad\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5', 'model-fallback');
});

const clock = new THREE.Clock();
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
function resetView() {
  camera.position.set(0, 1.2, 8.1);
  controls.target.set(0, 0.8, 0);
  controls.autoRotate = true;
  controls.update();
}
window.addEventListener('resize', resize);
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
resetButton.addEventListener('click', resetView);

function setSoundState(isPlaying) {
  soundButton.setAttribute('aria-pressed', String(isPlaying));
  document.body.classList.toggle('sound-on', isPlaying);
}

async function startBackgroundTrack() {
  try {
    await backgroundTrack.play();
    setSoundState(true);
  } catch {
    setSoundState(false);
  }
}

soundButton.addEventListener('click', () => {
  if (!backgroundTrack.paused) {
    backgroundTrack.pause();
    setSoundState(false);
    return;
  }
  startBackgroundTrack();
});

startBackgroundTrack();

function scheduleShootingStar() {
  shootingStar.classList.add('meteor-active');
  window.setTimeout(() => shootingStar.classList.remove('meteor-active'), 1200);
  window.setTimeout(scheduleShootingStar, 2000 + Math.random() * 3000);
}

window.setTimeout(scheduleShootingStar, 2000 + Math.random() * 3000);

function closeFeedback() {
  feedbackDialog.hidden = true;
  feedbackBackdrop.hidden = true;
  feedbackButton.focus();
}

feedbackButton.addEventListener('click', () => {
  feedbackDialog.hidden = false;
  feedbackBackdrop.hidden = false;
  feedbackCloseButton.focus();
});
feedbackCloseButton.addEventListener('click', closeFeedback);
feedbackBackdrop.addEventListener('click', closeFeedback);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !feedbackDialog.hidden) closeFeedback();
});
copyEmailButton.addEventListener('click', async () => {
  const originalText = copyEmailButton.textContent;
  try {
    await navigator.clipboard.writeText(copyEmailButton.dataset.email);
    copyEmailButton.textContent = '\u5df2\u590d\u5236';
  } catch {
    copyEmailButton.textContent = copyEmailButton.dataset.email;
  }
  window.setTimeout(() => { copyEmailButton.textContent = originalText; }, 1600);
});
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();
  stars.rotation.y = elapsed * 0.017;
  if (figure) {
    figure.position.y = figureBaseY + Math.sin(elapsed * 1.25) * 0.025;
  }
  if (mixer) mixer.update(delta);
  rimLight.intensity = 10 + Math.sin(elapsed * 1.5) * 1.5;
  controls.update();
  renderer.render(scene, camera);
}
resize();
animate();
