const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, shell, clipboard } = require('electron');
const http = require('http');
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
    resizable: false, // User requested static size
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Check if we are in dev mode (Vite typically runs on 5174)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    // We expect Vite to be running (on port 5174)
    mainWindow.loadURL('http://localhost:5174');
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
  startClipboardMonitor();

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

// IPC Handler to open dashboard in browser
ipcMain.on('open-dashboard', () => {
  shell.openExternal('http://localhost:5174');
});

// IPC Handler for moving the window dragging
ipcMain.on('window-move', (event, { x, y }) => {
  if (mainWindow) {
    const pos = mainWindow.getPosition();
    mainWindow.setPosition(Math.round(pos[0] + x), Math.round(pos[1] + y));
  }
});

// IPC Handler for resizing the window removed as requested.

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

// ─── Clipboard Monitor ────────────────────────────────────────────────────────
let lastClipboardText = '';
let clipboardTimer = null;

function startClipboardMonitor() {
  clipboardTimer = setInterval(() => {
    try {
      const text = clipboard.readText();
      if (!text || text.length < 10 || text === lastClipboardText) return;
      lastClipboardText = text;

      // POST to backend copy-paste check
      const body = JSON.stringify({ content: text, userId: 'desktop-user', destination: 'clipboard' });
      const req = http.request({
        hostname: 'localhost', port: 3001,
        path: '/api/copy-paste/check', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(raw);
            if (result.containsSensitiveInfo && result.decision !== 'allow' && mainWindow) {
              mainWindow.webContents.send('clipboard-alert', {
                sentinelMessage: result.sentinelMessage || 'Hey! You copied sensitive info — be careful where you paste it!'
              });
            }
          } catch (_) {}
        });
      });
      req.on('error', () => {}); // Backend might not be up yet
      req.write(body);
      req.end();
    } catch (_) {}
  }, 1500);
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (clipboardTimer) clearInterval(clipboardTimer);
});

app.on('window-all-closed', () => {
  // CyberDog should always remain open unless explicitly quit
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
