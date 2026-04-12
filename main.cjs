const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const winWidth = 300;
  const winHeight = 350;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: 0,
    y: height - winHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    resizable: true, // Allow resizing at runtime
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Check if we are in dev mode (Vite typically runs on 5173)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    // We expect Vite to be running
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in a detached window so it doesn't break transparency
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Prevent default closing mechanisms
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault(); // Intercept Alt+F4 and normal closure attempts
      console.log('Closure prevented. Use the system tray or Ctrl+Shift+Alt+D to exit CyberDog.');
    }
  });
}

function createTray() {
  // Use a default icon or a specified one. 
  // It's recommended to have an icon file in production.
  // For now, we'll try to find a default or handle graceful fallback.
  // We'll leave it simple; we might need a blank icon if actual asset is missing.
  // Here we use a native empty tray setup on Windows if no icon, 
  // but let's just create an empty NativeImage for the placeholder.
  const { nativeImage } = require('electron');
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('CyberDog Companion AI');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'CyberDog System', enabled: false },
    { type: 'separator' },
    {
      label: 'Force Shut Down (Admin)', click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register an admin shortcut to kill the app silently across all apps
  const ret = globalShortcut.register('CommandOrControl+Shift+Alt+D', () => {
    console.log('Admin force quit triggered.');
    isQuitting = true;
    app.quit();
  });

  if (!ret) {
    console.log('Registration failed for shortcut');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// IPC Handler for moving the window dragging
ipcMain.on('window-move', (event, { x, y }) => {
  if (mainWindow) {
    const pos = mainWindow.getPosition();
    mainWindow.setPosition(Math.round(pos[0] + x), Math.round(pos[1] + y));
  }
});

// IPC Handler for resizing the window
ipcMain.on('window-resize', (event, { width, height }) => {
  if (mainWindow) {
    const size = mainWindow.getSize();
    // Enforce a minimum size
    const newWidth = Math.max(200, Math.round(size[0] + width));
    const newHeight = Math.max(200, Math.round(size[1] + height));
    mainWindow.setSize(newWidth, newHeight);
  }
});

// IPC Handler to decrypt and write a temporary model file
ipcMain.handle('get-decrypted-model', async () => {
  try {
    const modelPath = path.join(__dirname, 'src', 'models', 'cyberdog.glb.enc');
    const tempPath = path.join(__dirname, 'src', 'models', 'cyberdog_temp.glb');
    const encryptedData = fs.readFileSync(modelPath);

    // Extraction: first 16 bytes are IV
    const iv = encryptedData.slice(0, 16);
    const encryptedBuffer = encryptedData.slice(16);

    // Decryption using the provided key
    const key = Buffer.from('f94a5fc10d4c2ba0557c7326d4747e46cd35bbdcd5aec6efb52fdcb6b8a533da', 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    fs.writeFileSync(tempPath, decrypted);

    // Return the relative URL path for the frontend to load
    return '/src/models/cyberdog_temp.glb';
  } catch (err) {
    console.error('Decryption failed:', err);
    throw err;
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // CyberDog should always remain open unless explicitly quit
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
