import * as THREE from 'three';
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
  
  // Track structural parts for procedural animation
  parts: {
    head: null,
    body: null,
    tail: null,
    earL: null,
    earR: null,
    eyes: [],
    legs: []
  },
  
  // Procedural states/targets
  procedural: {
    targetXY: new THREE.Vector2(0, 0),
    blinkTimer: 0,
    earTwitchTimer: 0,
    wagging: false,
    autoBlinkTimer: 3.0,
    walking: false,
    lookingAroundTimer: 0,
    lookAroundOffsetXY: new THREE.Vector2(0, 0)
  }
};

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function init() {
  const container = document.getElementById('app');

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(window.devicePixelRatio);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.2;
  state.renderer.setClearColor(0x000000, 0); // Transparent Background
  container.appendChild(state.renderer.domElement);

  state.scene = new THREE.Scene();

  state.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 1.2, 4);
  state.camera.lookAt(0, 0.5, 0);

  // --- CINEMATIC LIGHTING ---
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

  createProceduralDog();

  setupInput(container, state);
  setupSpeechSystem();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  
  state.renderer.setAnimationLoop(animate);
}

function createProceduralDog() {
  state.dogModel = new THREE.Group();

  // Materials for premium appearance
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6e6e6,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.8
  });

  const darkScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    roughness: 0.2,
    metalness: 0.9,
    clearcoat: 1.0
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff, // Cyan glow
    emissive: 0x00ffff,
    emissiveIntensity: 2.5,
    toneMapped: false
  });

  // Body
  state.parts.body = new THREE.Group();
  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.4, 32, 32), bodyMat);
  bodyMesh.rotation.x = Math.PI / 2; // Lay horizontal along Z axis
  state.parts.body.add(bodyMesh);

  // Head
  state.parts.head = new THREE.Group();
  const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.scale.set(1.1, 0.85, 1.0); // Slightly flattened sphere
  state.parts.head.add(headMesh);

  // Face Screen
  const softFaceGeo = new THREE.CapsuleGeometry(0.18, 0.2, 16, 32);
  const softFaceMesh = new THREE.Mesh(softFaceGeo, darkScreenMat);
  softFaceMesh.rotation.z = Math.PI / 2;
  softFaceMesh.scale.set(1.0, 1.2, 0.5); // Flatten depth
  softFaceMesh.position.set(0, 0, 0.26); // Place in front of the head
  state.parts.head.add(softFaceMesh);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.08, 16, 16), eyeMat);
  eyeL.rotation.z = Math.PI / 2;
  eyeL.position.set(-0.12, 0.02, 0.34);
  state.parts.eyes.push(eyeL);

  const eyeR = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.08, 16, 16), eyeMat);
  eyeR.rotation.z = Math.PI / 2;
  eyeR.position.set(0.12, 0.02, 0.34);
  state.parts.eyes.push(eyeR);

  state.parts.head.add(eyeL);
  state.parts.head.add(eyeR);

  // Ears
  state.parts.earL = new THREE.Group();
  state.parts.earL.position.set(-0.25, 0.1, -0.05);
  const earMeshL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 16, 16), bodyMat);
  earMeshL.position.y = 0.075; // Pivot at base
  earMeshL.rotation.z = 0.4;
  state.parts.earL.add(earMeshL);

  state.parts.earR = new THREE.Group();
  state.parts.earR.position.set(0.25, 0.1, -0.05);
  const earMeshR = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 16, 16), bodyMat);
  earMeshR.position.y = 0.075; // Pivot at base
  earMeshR.rotation.z = -0.4;
  state.parts.earR.add(earMeshR);

  state.parts.head.add(state.parts.earL);
  state.parts.head.add(state.parts.earR);

  // Neck Joint
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16), jointMat);
  neckMesh.position.set(0, -0.25, -0.1);
  state.parts.head.add(neckMesh);
  
  // Position head to rest above front part of body
  state.parts.head.position.set(0, 0.35, 0.35); 

  // Tail
  state.parts.tail = new THREE.Group();
  state.parts.tail.position.set(0, 0.1, -0.4); 
  const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.2, 16, 16), bodyMat);
  tailMesh.position.y = 0.1;
  tailMesh.rotation.x = -0.5; // Angled back/up
  state.parts.tail.add(tailMesh);
  
  // Legs
  const legPositions = [
    [-0.2, -0.15, 0.25],  // Front Left
    [0.2, -0.15, 0.25],   // Front Right
    [-0.2, -0.15, -0.25], // Back Left
    [0.2, -0.15, -0.25],  // Back Right
  ];

  legPositions.forEach(pos => {
    const legGroup = new THREE.Group();
    legGroup.position.set(pos[0], pos[1], pos[2]);
    
    // Joint
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), jointMat);
    legGroup.add(shoulder);

    // Limb
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.2, 16, 16), bodyMat);
    limb.position.y = -0.15;
    legGroup.add(limb);

    // Foot
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), bodyMat);
    foot.position.set(0, -0.28, 0.05); // slightly pointing forward
    foot.scale.set(1, 0.6, 1.2);
    legGroup.add(foot);

    state.parts.body.add(legGroup);
    state.parts.legs.push({ group: legGroup, initRotX: 0 });
  });

  // Assemble the hierarchy
  state.parts.body.add(state.parts.head);
  state.parts.body.add(state.parts.tail);

  // Center entire body around origin
  state.parts.body.position.set(0, 0.6, 0);
  
  state.dogModel.add(state.parts.body);
  state.scene.add(state.dogModel);
}

function onMouseMove(e) {
  // Normalize mapping for head tracking
  state.procedural.targetXY.x = (e.clientX / window.innerWidth) * 2 - 1;
  state.procedural.targetXY.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Global Interaction Hooks
window.playIdle = () => {
    state.procedural.wagging = false;
    state.procedural.walking = false;
};

window.playBlink = () => {
    state.procedural.blinkTimer = 0.15;
};

window.playTailWag = () => {
    state.procedural.wagging = true;
    setTimeout(() => { state.procedural.wagging = false; }, 3000);
};

window.playLookAround = () => {
    state.procedural.lookingAroundTimer = 3.0;
};

window.playTalk = () => {
    state.procedural.wagging = true;
    setTimeout(() => { state.procedural.wagging = false; }, 2000);
};

window.playExcited = () => {
   state.procedural.wagging = true;
   state.procedural.earTwitchTimer = 2.0;
   setTimeout(() => { state.procedural.wagging = false; }, 2000);
};

window.playSleep = () => {
   window.playIdle();
};

window.playSpecificAction = (name, loop = false) => {
   const lower = name.toLowerCase();
   if (lower.includes('talk')) window.playTalk();
   else if (lower.includes('wag') || lower.includes('tail')) window.playTailWag();
   else if (lower.includes('idle')) window.playIdle();
   else if (lower.includes('blink')) window.playBlink();
   else if (lower.includes('look')) window.playLookAround();
};

function animate() {
  const delta = Math.min(state.clock.getDelta(), 0.1);
  state.time += delta;

  // --- PROCEDURAL ANIMATIONS ---
  
  // 1. Idle Breathing (Body scaling and floating gently)
  if (state.parts.body) {
    const breath = Math.sin(state.time * 2.5) * 0.02;
    state.parts.body.position.y = 0.6 + breath; // Float at baseline 0.6
    state.parts.body.scale.x = 1.0 + (Math.cos(state.time * 2.5) * 0.01);
    state.parts.body.scale.y = 1.0 - (Math.cos(state.time * 2.5) * 0.01);
  }

  // 2. Head Tracking (Mouse Look & Look Around)
  if (state.parts.head) {
    let targetX = -state.procedural.targetXY.y * 0.6; // Up/down
    let targetY = state.procedural.targetXY.x * 0.8;  // Left/right

    if (state.procedural.lookingAroundTimer > 0) {
       state.procedural.lookingAroundTimer -= delta;
       // Add smooth random offsets for look around
       state.procedural.lookAroundOffsetXY.x = Math.sin(state.time * 2) * 0.5;
       state.procedural.lookAroundOffsetXY.y = Math.cos(state.time * 1.5) * 0.3;
       
       targetX += state.procedural.lookAroundOffsetXY.y;
       targetY += state.procedural.lookAroundOffsetXY.x;
    }

    state.parts.head.rotation.y = lerp(state.parts.head.rotation.y, targetY, 0.08);
    state.parts.head.rotation.x = lerp(state.parts.head.rotation.x, targetX, 0.08);
  }

  // 3. Procedural Blinking
  state.procedural.autoBlinkTimer -= delta;
  if (state.procedural.autoBlinkTimer <= 0) {
      state.procedural.blinkTimer = 0.15;
      state.procedural.autoBlinkTimer = Math.random() * 3 + 2; 
  }
  
  if (state.procedural.blinkTimer > 0) {
    state.procedural.blinkTimer -= delta;
    if (state.parts.eyes.length) {
        state.parts.eyes.forEach(eye => {
            eye.scale.y = lerp(eye.scale.y, 0.1, 0.4);
        });
    }
  } else {
    if (state.parts.eyes.length) {
        state.parts.eyes.forEach(eye => {
            eye.scale.y = lerp(eye.scale.y, 1.0, 0.3);
        });
    }
  }

  // 4. Ear Twitches
  if (state.procedural.earTwitchTimer > 0) {
    state.procedural.earTwitchTimer -= delta;
    const twitch = Math.sin(state.time * 25) * 0.2;
    if (state.parts.earL) state.parts.earL.rotation.z = 0.4 + twitch;
    if (state.parts.earR) state.parts.earR.rotation.z = -0.4 - twitch;
  } else {
    if (state.parts.earL) state.parts.earL.rotation.z = lerp(state.parts.earL.rotation.z, 0.4, 0.1);
    if (state.parts.earR) state.parts.earR.rotation.z = lerp(state.parts.earR.rotation.z, -0.4, 0.1);
  }

  // 5. Procedural Tail Wag
  if (state.parts.tail) {
    if (state.procedural.wagging) {
      state.parts.tail.rotation.y = lerp(state.parts.tail.rotation.y, Math.sin(state.time * 20) * 0.5, 0.2);
    } else {
      state.parts.tail.rotation.y = lerp(state.parts.tail.rotation.y, 0, 0.1);
    }
  }

  state.renderer.render(state.scene, state.camera);
}

init();
