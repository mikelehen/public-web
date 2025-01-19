import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

let xrSession = null;
let renderer, scene, camera, referenceSpace;

async function initWebXR() {
  if (!navigator.xr) {
    console.error("WebXR not supported.");
    return;
  }

  const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
  if (!isARSupported) {
    console.error("AR session not supported.");
    return;
  }

  // Request AR session
  xrSession = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local'] });

  // Initialize WebGL and Three.js
  setupRenderer();

  // Set the base layer
  xrSession.updateRenderState({
    baseLayer: new XRWebGLLayer(xrSession, renderer.getContext()),
  });

  // Request reference space
  referenceSpace = await xrSession.requestReferenceSpace('local');

  // Start the animation loop
  xrSession.requestAnimationFrame(onXRFrame);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0, -1);
  scene.add(cube);
}

function onXRFrame(time, frame) {
  const session = frame.session;
  const glLayer = session.renderState.baseLayer;
  renderer.setFramebuffer(glLayer.framebuffer);

  const pose = frame.getViewerPose(referenceSpace);
  if (pose) {
    const view = pose.views[0];
    camera.matrix.fromArray(view.transform.matrix);
    camera.projectionMatrix.fromArray(view.projectionMatrix);
    camera.updateMatrixWorld(true);
  }

  renderer.clear();
  renderer.render(scene, camera);

  session.requestAnimationFrame(onXRFrame);
}

document.getElementById('enter-ar').addEventListener('click', () => {
  initWebXR();
});
