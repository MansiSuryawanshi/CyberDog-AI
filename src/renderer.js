import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setupInput } from './interactions/InputHandler.js';
import { setupSpeechSystem } from './assets/SpeechTracker.js';

// Global Scene State
const state = {
  scene: null,
  camera: null,
  renderer: null,
  dogModel: null,
  clock: new THREE.Clock(),
  time: 0,
  mixer: null,
};

function init() {
  const container = document.getElementById('app');

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(window.devicePixelRatio);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.2;
  state.renderer.setClearColor(0x000000, 0);
  container.appendChild(state.renderer.domElement);

  state.scene = new THREE.Scene();

  state.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 1.5, 5);
  state.camera.lookAt(0, 0.5, 0);

  // --- CINEMATIC LIGHTING ---
  // Optimized to showcase original Blender materials
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  state.scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(5, 5, 5);
  state.scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xddeeff, 1.2);
  fillLight.position.set(-5, 2, 2);
  state.scene.add(fillLight);

  const rimLight = new THREE.SpotLight(0xffffff, 2.5);
  rimLight.position.set(0, 5, -5);
  rimLight.angle = Math.PI / 4;
  rimLight.penumbra = 0.5;
  state.scene.add(rimLight);

  loadModel();
  setupInput(container, state);
  setupSpeechSystem();

  window.addEventListener('resize', onWindowResize);
  state.renderer.setAnimationLoop(animate);
}

async function loadModel() {
  const loader = new GLTFLoader();
  
  try {
    const tempUrl = await window.electronAPI.getDecryptedModel();
    console.log(`[DEBUG] Attempting to load native GLB from: ${tempUrl}`);
    
    loader.load(
      tempUrl,
      async (gltf) => {
        state.dogModel = gltf.scene;
        
        // Final position and scale
        state.dogModel.scale.set(1.2, 1.2, 1.2);
        state.dogModel.position.set(0, -0.2, 0);
        state.scene.add(state.dogModel);
        
        // Traverse to enable shadows and log materials.
        // STRICT REQUIREMENT: Keep all embedded materials exactly as-is.
        let materialCount = 0;
        state.dogModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) materialCount++;
          }
        });

        // Setup Animations
        if (gltf.animations && gltf.animations.length) {
          state.mixer = new THREE.AnimationMixer(state.dogModel);
          const idleAction = state.mixer.clipAction(gltf.animations[0]);
          idleAction.play();
        } else {
          state.dogModel.userData.isSimpleIdle = true;
        }
        
        console.log('[DEBUG] --- RUNTIME MODEL LOADING SUCCESS ---');
        console.log('[DEBUG] Model loaded successfully from decrypted file.');
        console.log(`[DEBUG] Embedded material count preserved: ${materialCount}`);
        console.log('[DEBUG] Strictly NO material replacement occurred after load.');
      },
      undefined,
      (error) => {
        console.error('[ERROR] Failed to load decrypted GLTF file:', error);
      }
    );
  } catch (err) {
    console.error('[ERROR] Failed to prepare decrypted model via IPC:', err);
  }
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const delta = state.clock.getDelta();
  state.time += delta;

  if (state.mixer) state.mixer.update(delta);

  if (state.dogModel && state.dogModel.userData.isSimpleIdle) {
    state.dogModel.position.y = -0.2 + Math.sin(state.time * 2) * 0.02;
    state.dogModel.rotation.y = Math.sin(state.time * 0.5) * 0.05;
  }

  state.renderer.render(state.scene, state.camera);
}

init();
