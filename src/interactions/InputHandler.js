import * as THREE from 'three';

export function setupInput(container, state) {
  let isDraggingWindow = false;
  let isResizingWindow = false;
  let previousMousePosition = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const resizeHandle = document.getElementById('resize-handle');

  // Handle Resizing
  if (resizeHandle) {
    resizeHandle.addEventListener('pointerdown', (e) => {
      isResizingWindow = true;
      previousMousePosition = { x: e.screenX, y: e.screenY };
      e.stopPropagation(); // prevent window drag
      resizeHandle.setPointerCapture(e.pointerId);
    });

    resizeHandle.addEventListener('pointerup', (e) => {
      isResizingWindow = false;
      resizeHandle.releasePointerCapture(e.pointerId);
    });

    resizeHandle.addEventListener('pointermove', (e) => {
      if (isResizingWindow) {
        const deltaX = e.screenX - previousMousePosition.x;
        const deltaY = e.screenY - previousMousePosition.y;
        
        if (window.electronAPI) {
          window.electronAPI.resizeWindow({ width: deltaX, height: deltaY });
        }

        previousMousePosition = { x: e.screenX, y: e.screenY };
      }
    });
  }

  // Handle Dragging
  container.addEventListener('pointerdown', (e) => {
    isDraggingWindow = true;
    previousMousePosition = { x: e.screenX, y: e.screenY };
    container.style.cursor = 'grabbing';
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    // 1. Handle Dragging Window
    if (isDraggingWindow) {
      const deltaX = e.screenX - previousMousePosition.x;
      const deltaY = e.screenY - previousMousePosition.y;
      
      // Send IPC message to move window (via context bridge)
      if (window.electronAPI) {
        window.electronAPI.moveWindow({ x: deltaX, y: deltaY });
      }

      previousMousePosition = { x: e.screenX, y: e.screenY };
      return;
    }

    // 2. Handle Hover Raycasting (make dog look at mouse)
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, state.camera);
    if (state.dogModel && state.dogModel.isPlaceholder) {
      const intersects = raycaster.intersectObject(state.dogModel.group, true);
      if (intersects.length > 0) {
        // Subtle reaction logic could go here
        // The procedural animation already has scanning, but we could blend it.
        state.dogModel.parts.neonMaterial.emissiveIntensity = 2.0;
      }
    }
  });

  container.addEventListener('pointerup', (e) => {
    isDraggingWindow = false;
    container.style.cursor = 'grab';
    container.releasePointerCapture(e.pointerId);
  });
}
