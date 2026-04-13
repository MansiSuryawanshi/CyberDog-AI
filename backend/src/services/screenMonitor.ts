import screenshot from 'screenshot-desktop';
import { analyzeScreen, ScreenAnalysis } from './screenAnalyzer';
import { broadcastEvent } from '../sse/stream';
import { createAuditLog, createViolation } from './database';
import { v4 as uuidv4 } from 'uuid';

interface MonitorState {
  running: boolean;
  intervalMs: number;
  timer: ReturnType<typeof setTimeout> | null;
  isAnalyzing: boolean;
  lastThreatLevel: string;
  lastSummary: string;
  lastSentinelMessage: string;   // dedup dog messages — don't repeat same alert
  lastAlertAt: number;
  lastActiveApp: string;
  screenshotsTaken: number;
  threatsDetected: number;
  startedAt: string | null;
}

const ALERT_COOLDOWN_MS = 8000; // don't repeat same alert within 8 seconds

const state: MonitorState = {
  running: false,
  intervalMs: 5000,
  isAnalyzing: false,
  timer: null,
  lastThreatLevel: 'none',
  lastSummary: '',
  lastSentinelMessage: '',
  lastAlertAt: 0,
  lastActiveApp: '',
  screenshotsTaken: 0,
  threatsDetected: 0,
  startedAt: null,
};

async function captureAndAnalyze(): Promise<void> {
  // Skip if Claude is still analyzing the previous screenshot
  if (state.isAnalyzing) {
    if (state.running) state.timer = setTimeout(captureAndAnalyze, state.intervalMs);
    return;
  }

  try {
    state.isAnalyzing = true;

    // Capture screen as JPEG buffer
    const imgBuffer = await screenshot({ format: 'jpg' }) as Buffer;
    const base64 = imgBuffer.toString('base64');
    state.screenshotsTaken++;

    // Always show "checking" before analysis so dog reacts immediately
    broadcastEvent('screen_checking', {});

    const analysis: ScreenAnalysis = await analyzeScreen(base64);

    const now = Date.now();
    const screenChanged = analysis.summary !== state.lastSummary;
    const appChanged = analysis.activeApp !== state.lastActiveApp;
    const cooldownPassed = (now - state.lastAlertAt) > ALERT_COOLDOWN_MS;

    // Update tracking state — reset dedup when app or page changes so dog always reacts to new context
    if (analysis.activeApp !== state.lastActiveApp || (screenChanged && appChanged)) {
      state.lastSentinelMessage = ''; // Force fresh message on context switch
    }
    state.lastActiveApp = analysis.activeApp;

    // Send dog message only if sentinel message changed (prevents infinite loop when dashboard is on screen)
    const messageChanged = analysis.sentinelMessage !== state.lastSentinelMessage;
    const isRoutineDashboard = analysis.activeApp === 'Chrome' &&
      analysis.summary?.toLowerCase().includes('dashboard');

    if (analysis.sentinelMessage && messageChanged && !isRoutineDashboard) {
      state.lastSentinelMessage = analysis.sentinelMessage;
      broadcastEvent('screen_threat', {
        threatLevel: analysis.threatLevel,
        sentinelMessage: analysis.sentinelMessage,
        summary: analysis.summary,
        activeApp: analysis.activeApp,
        hasEmail: analysis.hasEmail,
        hasSensitiveData: analysis.hasSensitiveData,
        hasSuspiciousLink: analysis.hasSuspiciousLink,
      });
    }

    // Only log violations / create audit entries when screen actually changed (dedup)
    const shouldLog = (analysis.threatLevel !== 'none' || analysis.hasEmail) && (screenChanged || appChanged || cooldownPassed);
    if (shouldLog) {
      if (analysis.threatLevel !== 'none') state.threatsDetected++;
      state.lastThreatLevel = analysis.threatLevel;
      state.lastSummary = analysis.summary;
      state.lastAlertAt = now;
      console.log(`[ScreenMonitor] ${analysis.threatLevel} | App: ${analysis.activeApp} | ${analysis.summary}`);

      // If email is open and suspicious — log violation
      if (analysis.hasEmail && analysis.emailDetails && analysis.threatLevel !== 'low') {
        broadcastEvent('screen_email_detected', {
          emailDetails: analysis.emailDetails,
          threatLevel: analysis.threatLevel,
          sentinelMessage: analysis.sentinelMessage,
          summary: analysis.summary,
          screenshotBase64: base64,
        });

        createViolation({
          action: {
            id: uuidv4(),
            type: 'email',
            content: `Subject: ${analysis.emailDetails.subject} | From: ${analysis.emailDetails.sender}`,
            userId: 'screen-monitor',
            timestamp: new Date().toISOString(),
            metadata: { source: 'screen_monitor', activeApp: analysis.activeApp },
          },
          riskLevel: analysis.threatLevel === 'high' ? 'high' : 'medium',
          decision: analysis.threatLevel === 'high' ? 'restrict' : 'warn',
          explanation: analysis.summary,
          suggestedActions: ['Close this email', 'Do not click any links', 'Report to IT security'],
        });
      }

      // Sensitive data visible on screen
      if (analysis.hasSensitiveData && analysis.sensitiveDataFound) {
        broadcastEvent('screen_sensitive_data', {
          sensitiveDataFound: analysis.sensitiveDataFound,
          threatLevel: analysis.threatLevel,
          sentinelMessage: analysis.sentinelMessage,
          activeApp: analysis.activeApp,
        });
      }

      // Suspicious link visible
      if (analysis.hasSuspiciousLink && analysis.suspiciousLink) {
        broadcastEvent('screen_suspicious_link', {
          suspiciousLink: analysis.suspiciousLink,
          threatLevel: analysis.threatLevel,
          sentinelMessage: analysis.sentinelMessage,
          activeApp: analysis.activeApp,
        });
      }

      createAuditLog('screen_threat_detected', {
        threatLevel: analysis.threatLevel,
        activeApp: analysis.activeApp,
        summary: analysis.summary,
        hasSensitiveData: analysis.hasSensitiveData,
        hasSuspiciousLink: analysis.hasSuspiciousLink,
        hasEmail: analysis.hasEmail,
      });
    }
  } catch (err) {
    console.error('[ScreenMonitor] Capture error:', err);
  } finally {
    state.isAnalyzing = false;
  }

  // Schedule next capture if still running
  if (state.running) {
    state.timer = setTimeout(captureAndAnalyze, state.intervalMs);
  }
}

export function startMonitor(intervalMs = 5000): void {
  if (state.running) return;
  state.running = true;
  state.intervalMs = intervalMs;
  state.startedAt = new Date().toISOString();
  state.screenshotsTaken = 0;
  state.threatsDetected = 0;
  console.log(`[ScreenMonitor] Started — capturing every ${intervalMs}ms`);
  captureAndAnalyze();
}

export function stopMonitor(): void {
  state.running = false;
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  console.log('[ScreenMonitor] Stopped');
}

export function getMonitorStatus() {
  return {
    running: state.running,
    intervalMs: state.intervalMs,
    screenshotsTaken: state.screenshotsTaken,
    threatsDetected: state.threatsDetected,
    lastThreatLevel: state.lastThreatLevel,
    startedAt: state.startedAt,
  };
}
