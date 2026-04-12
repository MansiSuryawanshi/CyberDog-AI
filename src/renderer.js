import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setupInput } from './interactions/InputHandler.js';
import { setupSpeechSystem } from './assets/SpeechTracker.js';
// Removed createPlaceholderDog as we use the GLTF model now

// Global Scene State
const state = {
  scene: null,
  camera: null,
  renderer: null,
  dogModel: null,
  clock: new THREE.Clock(),
  time: 0,
  mixer: null, // For future GLTF animations
};

function init() {
  const container = document.getElementById('app');

  // Request high-res renderer with transparent background
  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(window.devicePixelRatio);
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.2;
  state.renderer.setClearColor(0x000000, 0); // Guarantee 100% transparent skybox
  container.appendChild(state.renderer.domElement);

  // Scene
  state.scene = new THREE.Scene();

  // Camera
  state.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 1.5, 5);
  state.camera.lookAt(0, 0.5, 0);

  // --- CINEMATIC LIGHTING ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  state.scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(5, 5, 5);
  state.scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xddeeff, 1.0);
  fillLight.position.set(-5, 2, 2);
  state.scene.add(fillLight);

  const rimLight = new THREE.SpotLight(0xffffff, 2.5);
  rimLight.position.set(0, 5, -5);
  rimLight.angle = Math.PI / 4;
  rimLight.penumbra = 0.5;
  state.scene.add(rimLight);

  // Load Model
  loadModel();

  // Setup Systems
  setupInput(container, state);
  setupSpeechSystem();

  // Resize Handler
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  state.renderer.setAnimationLoop(animate);
}

async function loadModel() {
  const loader = new GLTFLoader();
  
  try {
    const arrayBuffer = await window.electronAPI.getDecryptedModel();
    
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        state.dogModel = gltf.scene;
        
        // Scale and Position Adjustments
        state.dogModel.scale.set(1.2, 1.2, 1.2);
        state.dogModel.position.set(0, -0.2, 0); // Position slightly above bottom center (offset by init camera)
        
        state.scene.add(state.dogModel);
        
        // Setup Animation Mixer
        if (gltf.animations && gltf.animations.length) {
          state.mixer = new THREE.AnimationMixer(state.dogModel);
          const idleAction = state.mixer.clipAction(gltf.animations[0]);
          idleAction.play();
        } else {
          // Fallback: Simple Idle Animation if no clips provided
          state.dogModel.userData.isSimpleIdle = true;
        }
        
        console.log('CyberDog model loaded and decrypted successfully.');
      },
      (error) => {
        console.error('Failed to parse GLTF buffer:', error);
      }
    );
  } catch (err) {
    console.error('Failed to fetch decrypted model:', err);
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

  // Update GLTF animation if available
  if (state.mixer) state.mixer.update(delta);

  // Simple Idle Animation fallback
  if (state.dogModel && state.dogModel.userData.isSimpleIdle) {
    state.dogModel.position.y = -0.2 + Math.sin(state.time * 2) * 0.02;
    state.dogModel.rotation.y = Math.sin(state.time * 0.5) * 0.05;
  }

  // Render
  state.renderer.render(state.scene, state.camera);
}

// Initialize on script load
init();
