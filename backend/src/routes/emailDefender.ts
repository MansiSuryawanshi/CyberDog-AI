import { Router, Request, Response } from 'express';
import { analyzeLink, analyzeEmail, analyzeUrlVisually } from '../services/aiEngine';
import { captureScreenshot } from '../services/screenshotService';
import { createViolation, createAuditLog } from '../services/database';
import { broadcastEvent } from '../sse/stream';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/email-defender/check-link
// Called when a user clicks/opens a link from an email
router.post('/check-link', async (req: Request, res: Response) => {
  const { url, userId, emailContext } = req.body as {
    url?: string;
    userId?: string;
    emailContext?: string;
  };

  if (!url || !userId) {
    return res.status(400).json({ error: 'url and userId are required' });
  }

  try {
    const analysis = await analyzeLink(url, emailContext);

    let violationId: string | undefined;

    if (!analysis.isSafe || analysis.decision !== 'allow') {
      const action = {
        id: uuidv4(),
        type: 'link_click' as const,
        content: url,
        userId,
        timestamp: new Date().toISOString(),
        metadata: { emailContext, domain: new URL(url).hostname },
      };

      const violation = createViolation({
        action,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        explanation: analysis.explanation,
        suggestedActions: analysis.suggestedActions,
      });
      violationId = violation.id;

      broadcastEvent('email_defender', {
        violationId,
        url,
        userId,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        redFlags: analysis.redFlags,
      });
    }

    createAuditLog('email_link_checked', {
      url,
      userId,
      riskLevel: analysis.riskLevel,
      decision: analysis.decision,
      isSafe: analysis.isSafe,
      violationId,
    }, userId);

    res.json({ ...analysis, violationId });
  } catch (err) {
    console.error('Email Defender error:', err);
    res.status(500).json({ error: 'Email Defender analysis failed' });
  }
});

// POST /api/email-defender/scan-email
// Step 1 — called when an email is opened. Scans for phishing keywords + external sender.
// Sentinel dog speaks to the user and asks if they want Claude to check the links.
router.post('/scan-email', async (req: Request, res: Response) => {
  const { subject, body, senderEmail, companyDomain, userId, linksFound } = req.body as {
    subject?: string;
    body?: string;
    senderEmail?: string;
    companyDomain?: string;
    userId?: string;
    linksFound?: string[];
  };

  if (!subject || !body || !senderEmail || !companyDomain || !userId) {
    return res.status(400).json({ error: 'subject, body, senderEmail, companyDomain, and userId are required' });
  }

  try {
    const analysis = await analyzeEmail(subject, body, senderEmail, companyDomain, linksFound ?? []);

    // Log violation if risky
    let violationId: string | undefined;
    if (analysis.decision !== 'allow') {
      const action = {
        id: uuidv4(),
        type: 'email' as const,
        content: `Subject: ${subject} | From: ${senderEmail}`,
        userId,
        timestamp: new Date().toISOString(),
        metadata: {
          senderEmail,
          isExternal: analysis.isExternal,
          threatScore: analysis.threatScore,
          flaggedCategories: analysis.flaggedCategories,
        },
      };
      const violation = createViolation({
        action,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        explanation: analysis.explanation,
        suggestedActions: ['Do not click any links', 'Verify sender via phone', 'Report to IT security'],
      });
      violationId = violation.id;

      // Broadcast to frontend so Sentinel dog pops up
      broadcastEvent('email_scanned', {
        violationId,
        userId,
        senderEmail,
        isExternal: analysis.isExternal,
        threatScore: analysis.threatScore,
        riskLevel: analysis.riskLevel,
        flaggedCategories: analysis.flaggedCategories,
        sentinelMessage: analysis.sentinelMessage,
        askUserToOpenLinks: analysis.askUserToOpenLinks,
        linksFound: analysis.linksFound,
      });
    }

    createAuditLog('email_scanned', {
      userId,
      senderEmail,
      isExternal: analysis.isExternal,
      threatScore: analysis.threatScore,
      riskLevel: analysis.riskLevel,
      totalFlaggedKeywords: analysis.totalFlaggedKeywords,
      violationId,
    }, userId);

    res.json({ ...analysis, violationId });
  } catch (err) {
    console.error('Email scan error:', err);
    res.status(500).json({ error: 'Email scan failed' });
  }
});

// POST /api/email-defender/open-link
// Step 2 — user said "yes, check the link". Claude analyzes it and returns phishing probability.
router.post('/open-link', async (req: Request, res: Response) => {
  const { url, userId, emailContext } = req.body as {
    url?: string;
    userId?: string;
    emailContext?: string;
  };

  if (!url || !userId) {
    return res.status(400).json({ error: 'url and userId are required' });
  }

  try {
    const analysis = await analyzeLink(url, emailContext);

    let violationId: string | undefined;
    if (!analysis.isSafe || analysis.decision !== 'allow') {
      let parsedMeta: Record<string, unknown> = {};
      try { parsedMeta = { domain: new URL(url).hostname }; } catch { /* ignore */ }

      const action = {
        id: uuidv4(),
        type: 'link_click' as const,
        content: url,
        userId,
        timestamp: new Date().toISOString(),
        metadata: { emailContext, ...parsedMeta },
      };
      const violation = createViolation({
        action,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        explanation: analysis.explanation,
        suggestedActions: analysis.suggestedActions,
      });
      violationId = violation.id;

      broadcastEvent('link_analyzed', {
        violationId,
        url,
        userId,
        phishingProbability: analysis.phishingProbability,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        redFlags: analysis.redFlags,
        sentinelMessage: analysis.sentinelMessage,
      });
    }

    createAuditLog('link_opened_by_request', { url, userId, phishingProbability: analysis.phishingProbability, violationId }, userId);
    res.json({ ...analysis, violationId });
  } catch (err) {
    console.error('Open-link error:', err);
    res.status(500).json({ error: 'Link analysis failed' });
  }
});

// POST /api/email-defender/open-link-visual
// User said "yes" — Claude opens the link via headless browser, screenshots it,
// Claude Vision analyzes what it sees, and returns phishing probability + what Claude saw.
router.post('/open-link-visual', async (req: Request, res: Response) => {
  const { url, userId, emailContext } = req.body as {
    url?: string;
    userId?: string;
    emailContext?: string;
  };

  if (!url || !userId) {
    return res.status(400).json({ error: 'url and userId are required' });
  }

  try {
    // Step 1: Puppeteer opens the link and takes a screenshot
    broadcastEvent('link_opening', { url, userId, message: '🐕 Opening the link now, give me a moment...' });
    const screenshot = await captureScreenshot(url);

    // Step 2: Claude Vision analyzes the screenshot
    const analysis = await analyzeUrlVisually(
      screenshot.imageBase64,
      url,
      screenshot.finalUrl,
      screenshot.pageTitle,
      screenshot.hadRedirect
    );

    // Step 3: Log violation if risky
    let violationId: string | undefined;
    if (analysis.decision !== 'allow') {
      const action = {
        id: uuidv4(),
        type: 'link_click' as const,
        content: url,
        userId,
        timestamp: new Date().toISOString(),
        metadata: { emailContext, finalUrl: screenshot.finalUrl, hadRedirect: screenshot.hadRedirect },
      };
      const violation = createViolation({
        action,
        riskLevel: analysis.riskLevel,
        decision: analysis.decision,
        explanation: analysis.whatClaudeSees,
        suggestedActions: analysis.redFlags.length > 0
          ? ['Do not proceed to this site', 'Report the email to IT security', 'Contact sender via phone']
          : ['Proceed with caution'],
      });
      violationId = violation.id;
    }

    // Step 4: Broadcast result so Sentinel dog can speak
    broadcastEvent('link_visual_result', {
      violationId,
      url,
      finalUrl: screenshot.finalUrl,
      userId,
      phishingProbability: analysis.phishingProbability,
      riskLevel: analysis.riskLevel,
      decision: analysis.decision,
      whatClaudeSees: analysis.whatClaudeSees,
      redFlags: analysis.redFlags,
      hadRedirect: screenshot.hadRedirect,
      sentinelMessage: analysis.sentinelMessage,
      screenshotBase64: screenshot.imageBase64,  // frontend can display the screenshot
    });

    createAuditLog('link_opened_visually', {
      url,
      finalUrl: screenshot.finalUrl,
      userId,
      phishingProbability: analysis.phishingProbability,
      hadRedirect: screenshot.hadRedirect,
      violationId,
    }, userId);

    // Return everything including the screenshot so the frontend can show it to the user
    res.json({
      ...analysis,
      screenshotBase64: screenshot.imageBase64,
      violationId,
    });
  } catch (err) {
    console.error('Visual link analysis error:', err);
    res.status(500).json({ error: 'Could not open or analyze the link. It may be blocking automated access.' });
  }
});

// GET /api/email-defender/violations
router.get('/violations', (_req: Request, res: Response) => {
  const { getAllViolations } = require('../services/database');
  const all = getAllViolations();
  const emailViolations = all.filter(
    (v: { action: { type: string } }) => v.action.type === 'link_click' || v.action.type === 'email'
  );
  res.json(emailViolations);
});

export default router;
