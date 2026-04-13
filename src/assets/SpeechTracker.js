// ─── Speech Bubble + SSE Connection ──────────────────────────────────────────

const BACKEND_URL = 'http://localhost:3001';
const clientId = 'electron-dog-' + Math.random().toString(36).substring(2, 9);

let speechBubble = null;
let speechText = null;
let speechContainer = null;
let hideTimer = null;
let eventSource = null;

// Messages that are just informational (auto-hide after short time)
const AUTO_HIDE_MESSAGES = ['wait... i am checking', 'woof! i am online'];

export function showMessage(message, durationMs = 5000, persist = false) {
  if (!speechBubble) return;
  if (hideTimer) clearTimeout(hideTimer);

  const isDanger = message.toLowerCase().includes('danger') ||
                   message.toLowerCase().includes('phishing') ||
                   message.toLowerCase().includes('do not click') ||
                   message.toLowerCase().includes('warning') ||
                   message.toLowerCase().includes('sensitive') ||
                   message.toLowerCase().includes('copied');

  const isAutoHide = AUTO_HIDE_MESSAGES.some(t => message.toLowerCase().startsWith(t));

  speechText.textContent = message;
  speechBubble.classList.toggle('danger', isDanger);
  speechContainer.classList.remove('hidden');
  speechBubble.classList.remove('hidden');
  setTimeout(() => speechBubble.classList.add('visible'), 10);

  // Only auto-hide "checking" / greeting messages — everything else stays until X
  if (isAutoHide) {
    hideTimer = setTimeout(() => {
      speechBubble.classList.remove('visible');
      speechBubble.classList.add('hidden');
      setTimeout(() => speechContainer.classList.add('hidden'), 400);
    }, durationMs);
  }
}

function connectSSE() {
  if (eventSource) eventSource.close();

  eventSource = new EventSource(BACKEND_URL + '/api/stream?clientId=' + clientId);

  eventSource.addEventListener('connected', () => {
    console.log('[CyberDog] Connected to PolicyGuard backend');
    showMessage('Woof! I am online and watching over you. Stay safe!', 4000);
  });

  // Copy-paste violation
  eventSource.addEventListener('copy_paste_violation', (e) => {
    const data = JSON.parse(e.data);
    showMessage(data.sentinelMessage || 'Hey! I detected sensitive company info being copied. Please be careful!', 10000);
  });

  // Email scanned via API
  eventSource.addEventListener('email_scanned', (e) => {
    const data = JSON.parse(e.data);
    showMessage(data.sentinelMessage || 'I scanned an email and found suspicious patterns!', 10000);
  });

  // Link analyzed visually
  eventSource.addEventListener('link_visual_result', (e) => {
    const data = JSON.parse(e.data);
    const msg = data.sentinelMessage || 'I checked that link. ' + data.phishingProbability + '% chance it is phishing!';
    showMessage(msg, 12000);
  });

  // Email defender
  eventSource.addEventListener('email_defender', (e) => {
    const data = JSON.parse(e.data);
    showMessage('Suspicious link detected! Risk level: ' + data.riskLevel + '. Do not open it!', 10000);
  });

  // Policy violation
  eventSource.addEventListener('violation', (e) => {
    const data = JSON.parse(e.data);
    showMessage('Policy violation detected! Risk: ' + data.riskLevel + '. Decision: ' + data.decision, 8000);
  });

  // Override
  eventSource.addEventListener('override', () => {
    showMessage('Override noted. I will keep watching. Stay safe!', 5000);
  });

  // Policy updated
  eventSource.addEventListener('policy_update', (e) => {
    const data = JSON.parse(e.data);
    showMessage('Company policy has been ' + data.action + '. I am updating my rules!', 5000);
  });

  // ── Screen Monitor Events ──────────────────────────────────────────────────

  // Dog says "checking" before analysis result arrives
  eventSource.addEventListener('screen_checking', () => {
    showMessage('Wait... I am checking your screen right now.', 6000);
  });

  // General threat on screen
  eventSource.addEventListener('screen_threat', (e) => {
    const data = JSON.parse(e.data);
    if (data.sentinelMessage) showMessage(data.sentinelMessage, 5000);
  });

  // Email detected on screen
  eventSource.addEventListener('screen_email_detected', (e) => {
    const data = JSON.parse(e.data);
    if (data.sentinelMessage) showMessage(data.sentinelMessage, 5000);
  });

  // Sensitive data on screen
  eventSource.addEventListener('screen_sensitive_data', (e) => {
    const data = JSON.parse(e.data);
    if (data.sentinelMessage) showMessage(data.sentinelMessage, 5000);
  });

  // Suspicious link on screen
  eventSource.addEventListener('screen_suspicious_link', (e) => {
    const data = JSON.parse(e.data);
    if (data.sentinelMessage) showMessage(data.sentinelMessage, 5000);
  });

  eventSource.onerror = () => {
    console.warn('[CyberDog] SSE disconnected. Reconnecting in 5s...');
    eventSource.close();
    setTimeout(connectSSE, 5000);
  };
}

export function setupSpeechSystem() {
  speechBubble = document.getElementById('speech-bubble');
  speechText = document.getElementById('speech-text');
  speechContainer = document.getElementById('speech-container');
  connectSSE();

  // Clipboard alerts from Electron main process (direct IPC — faster than SSE)
  if (window.electronAPI && window.electronAPI.onClipboardAlert) {
    window.electronAPI.onClipboardAlert((data) => {
      showMessage(data.sentinelMessage || 'Hey! Sensitive info detected in clipboard. Be careful!');
    });
  }
}
