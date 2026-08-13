import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './styles.css';

const canvas = document.querySelector('#figure-scene');
const resetButton = document.querySelector('.reset-view');
const soundButton = document.querySelector('.sound-toggle');
const shootingStar = document.querySelector('.shooting-star');
const feedbackButton = document.querySelector('.feedback-toggle');
const feedbackDialog = document.querySelector('.feedback-dialog');
const feedbackBackdrop = document.querySelector('.feedback-backdrop');
const feedbackCloseButton = document.querySelector('.feedback-close');
const copyWechatButton = document.querySelector('.copy-wechat');
const dust = document.querySelector('#poem-dust');
const backgroundTrack = new Audio('/music/happy-lullaby.mp3');
backgroundTrack.loop = true;
backgroundTrack.volume = 0.18;
backgroundTrack.preload = 'metadata';
const poemCharacters = ['\u6708', '\u98ce', '\u6c5f', '\u9152', '\u7af9', '\u4e91', '\u6e38', '\u8bcd'];

for (let index = 0; index < 18; index += 1) {
  const glyph = document.createElement('span');
  glyph.textContent = poemCharacters[index % poemCharacters.length];
  glyph.style.setProperty('--x', `${5 + ((index * 19) % 89)}%`);
  glyph.style.setProperty('--y', `${8 + ((index * 29) % 74)}%`);
  glyph.style.setProperty('--delay', `${(index % 6) * -1.25}s`);
  glyph.style.setProperty('--duration', `${8 + (index % 5)}s`);
  dust.appendChild(glyph);
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x10162f, 0.035);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 8.1);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
loader.load('/models/chibi-figure.glb', (gltf) => {
  figure = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(figure);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3.55 / Math.max(size.x, size.y, size.z);
  figure.scale.setScalar(scale);
  figureBaseY = -center.y * scale - 0.55;
  figure.position.set(-center.x * scale, figureBaseY, -center.z * scale);
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
  document.body.classList.add('model-ready');
}, undefined, () => document.body.classList.add('model-fallback'));

const clock = new THREE.Clock();
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
function resetView() {
  camera.position.set(0, 1.2, 8.1);
  controls.target.set(0, 0.8, 0);
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

window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.sound-toggle')) return;
  if (backgroundTrack.paused) startBackgroundTrack();
}, { once: true });

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
copyWechatButton.addEventListener('click', async () => {
  const originalText = copyWechatButton.textContent;
  try {
    await navigator.clipboard.writeText(copyWechatButton.dataset.wechat);
    copyWechatButton.textContent = '\u5df2\u590d\u5236';
  } catch {
    copyWechatButton.textContent = copyWechatButton.dataset.wechat;
  }
  window.setTimeout(() => { copyWechatButton.textContent = originalText; }, 1600);
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
