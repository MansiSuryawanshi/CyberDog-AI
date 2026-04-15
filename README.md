<div align="center">

<img src="assets/logo.png" alt="CyberDog Logo" width="120" />

# CyberDog AI
### Real-Time AI Governance & Security Operations

> *"We ensure humans stay responsible decision-makers in AI-powered environments."*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-D97706?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

---

## What is CyberDog AI?

CyberDog AI is a **real-time AI governance system** that sits on your desktop and watches over your digital environment — intercepting risky decisions, flagging policy violations, and guiding users to act safely. It combines a **3D AI companion** (Sentinel), a **security operations dashboard**, and a **Claude-powered backend engine** to create a complete governance platform.

Instead of reacting to breaches *after* they happen, CyberDog intervenes **at the moment a decision is made**.

---

## Features

### Sentinel — Your 3D AI Companion

A real-time animated robot companion lives on your desktop, always on top, always watching.

- **3D procedural animations** — blinking, ear twitching, tail wagging, idle walking, and contextual look-around, all driven by Three.js
- **Transparent, frameless window** — blends seamlessly into your desktop
- **Speech bubble alerts** — Sentinel speaks directly on screen when it detects risk
- **Clipboard monitoring** — watches copy/paste actions every 1.5 seconds and alerts when sensitive data is detected
- **Encrypted 3D model** — the model is AES-256 encrypted at rest and decrypted in-memory at runtime
- **Always-on-top** — cannot be minimized or accidentally closed; admin shortcut (`Ctrl+Shift+Alt+D`) required to quit
- **Action menu** — right-click Sentinel to open Chat or view Policy Details at any time

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20184050.png" alt="Sentinel 3D companion with action menu" width="320" />
  &nbsp;&nbsp;
  <img src="Read_Photo/Screenshot%202026-04-14%20184335.png" alt="Sentinel companion" width="320" />
</div>

---

### Screen Monitor

CyberDog continuously watches what's happening on your screen using Claude Vision AI.

- **Automatic screenshots** every 5 seconds while monitoring is active
- **Claude Vision analysis** — each screenshot is sent to Claude Sonnet for real-time interpretation
- **Detects:** open emails, suspicious links, sensitive data on screen, phishing attempts, and active application context
- **Threat levels:** `none` / `low` / `medium` / `high` — each with a tailored Sentinel message
- **Alert deduplication** — 8-second cooldown prevents the same alert from firing repeatedly
- **Live statistics** — tracks total screenshots taken and threats detected per session

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183528.png" alt="Sentinel danger alert - API key exposed" width="340" />
  &nbsp;&nbsp;
  <img src="Read_Photo/Screenshot%202026-04-14%20184017.png" alt="Screen Monitor dashboard - running" width="580" />
</div>

---

### Email Defender

Protects users before they interact with potentially dangerous email content.

- **Link risk analysis** — evaluates any URL from email context using Claude AI
- **Visual URL inspection** — uses Puppeteer to visually render and screenshot suspicious links before the user visits them
- **Full email analysis** — scans sender, subject, body, and embedded links for phishing signals
- **Risk scoring** — every link and email gets a `low / medium / high` risk classification
- **Governance decisions** — outputs `allow`, `warn`, or `restrict` with plain-English explanations
- **Suggested safe actions** — tells the user exactly what to do instead of just blocking

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20182953.png" alt="Sentinel flagging phishing email" width="700" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183027.png" alt="Sentinel confirming legitimate email" width="700" />
</div>

> *Top: Sentinel flags a fake bonus payment phishing email. Bottom: Sentinel confirms a legitimate library reservation email is safe.*

---

### Copy-Paste Guard

Monitors clipboard activity to prevent accidental data leaks.

- **Real-time clipboard watching** — runs in the Electron main process, checks every 1.5 seconds
- **Sensitive data detection** — identifies passwords, API keys, PII, financial data, and internal content
- **Instant Sentinel alert** — triggers a speech bubble the moment sensitive content is copied
- **Backend decision engine** — clipboard content is evaluated by the policy engine before any alert fires

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183410.png" alt="Copy-Paste Guard blocking confidential financial data" width="420" />
</div>

> *Sentinel intercepts an attempt to copy Q3 confidential financial data — CONFIDENTIAL material flagged before it leaves the app.*

---

### Policy Assistant Chat

An interactive AI chatbot that knows your company's policies inside out — accessible directly from Sentinel.

- **Conversational AI** — powered by Claude with a persistent conversation history (last 20 turns)
- **Policy-aware responses** — answers questions about what is and isn't allowed, with clear reasoning
- **Topic detection** — automatically identifies the policy area being discussed
- **Accessible from Sentinel** — click the companion to open the chat panel instantly
- **Embedded in the dashboard** — also available from the SOC panel at any time

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20184250.png" alt="Policy Assistant chat opening" width="340" />
  &nbsp;&nbsp;
  <img src="Read_Photo/Screenshot%202026-04-14%20184308.png" alt="Policy Assistant answering copy paste question" width="340" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20184316.png" alt="Policy Assistant response - confidentiality" width="340" />
  &nbsp;&nbsp;
  <img src="Read_Photo/Screenshot%202026-04-14%20184322.png" alt="Policy Assistant escalation guidance" width="340" />
</div>

---

### SOC Dashboard

A full Security Operations Center interface for real-time monitoring and auditing.

| Panel | Description |
|---|---|
| **Overview** | Live threat feed with real-time alerts via SSE, module status cards |
| **Employee Risk** | Per-user risk leaderboard with high/medium/low incident counts |
| **Violations** | Full violations table — type, risk level, decision, and summary |
| **Audit Trail** | Timestamped log of every action, decision, and override |
| **Policies** | View and toggle all active governance policies |
| **Monitor** | Screen Monitor control panel — start/stop, live threat log |

Real-time updates are streamed from the backend via **Server-Sent Events (SSE)** — no polling, no page refresh needed.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183848.png" alt="SOC Dashboard - Overview" width="900" />
</div>

**Overview** — live threat feed, module status (Screen Monitor, Email Defender, Copy-Paste Guard, Policy Engine), and Screen AI status.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183907.png" alt="SOC Dashboard - Employee Risk" width="900" />
</div>

**Employee Risk** — real-time risk leaderboard ranking employees by security violations.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183917.png" alt="SOC Dashboard - Violations" width="900" />
</div>

**Violations** — full table of all violations with user, type, risk level, decision, and AI-generated summary.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183937.png" alt="SOC Dashboard - Audit Trail" width="900" />
</div>

**Audit Trail** — complete timestamped history of every intercepted action across all monitoring modules.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183953.png" alt="SOC Dashboard - Policies" width="900" />
</div>

**Policies** — toggle individual policies on/off. Includes Phishing Link Detection, Sensitive Data Sharing, External Email Warning, Unverified AI Output, Copy-Paste Guard, and more.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20184017.png" alt="SOC Dashboard - Screen Monitor" width="900" />
</div>

**Monitor** — live Screen Monitor control with running status, screenshot count, threat count, and a real-time threat log feed.

---

### Corporate Policy Center

Built-in policy documentation — readable from the dashboard and enforced automatically by the governance engine.

<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183706.png" alt="01 Privacy Policy" width="560" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183713.png" alt="02 Terms of Service" width="560" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183719.png" alt="03 Cookie Policy" width="560" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183730.png" alt="04 Data Protection" width="560" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183739.png" alt="05 Security Policy" width="560" />
</div>
<div align="center">
  <img src="Read_Photo/Screenshot%202026-04-14%20183754.png" alt="06 Acceptable Use Policy" width="560" />
</div>

---

### Governance Engine

The core decision-making layer that powers every feature.

- **AI risk scoring** using Claude — every action gets a `low / medium / high` classification
- **Policy engine** — rule-based evaluation layered on top of AI reasoning
- **Override system** — users can override warnings, but must provide a written justification
- **Audit logging** — every action, decision, and override is permanently recorded
- **Violation tracking** — violations are stored with full context for later review
- **Real-time broadcast** — all events are pushed to the dashboard instantly via SSE

---

## Architecture

```
CyberDog AI
│
├── Electron Desktop App          ← Sentinel companion (Three.js 3D robot)
│   ├── Transparent overlay window
│   ├── Clipboard monitor (main process)
│   ├── Speech bubble system
│   └── IPC bridge to renderer
│
├── Backend  (Node.js + Express + TypeScript)
│   ├── /api/monitor              ← Screen capture + Claude Vision
│   ├── /api/email-defender       ← Link & email risk analysis
│   ├── /api/copy-paste           ← Clipboard content evaluation
│   ├── /api/policies             ← Policy management
│   ├── /api/violations           ← Violation storage & retrieval
│   ├── /api/override             ← User override + justification
│   ├── /api/policy/chat          ← Policy assistant chatbot
│   └── /api/stream               ← SSE real-time event stream
│
├── Frontend  (React + Vite + TypeScript + Tailwind)
│   ├── SOC Dashboard
│   ├── Real-time alert panels
│   ├── Audit trail viewer
│   └── Policy assistant chat UI
│
└── Agent
    ├── Browser extension
    └── Action simulator
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop App | Electron 41, Three.js, WebGL |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI Engine | Anthropic Claude Sonnet (claude-sonnet-4-6) |
| Screen Capture | screenshot-desktop, Puppeteer |
| Real-time | Server-Sent Events (SSE) |
| Security | AES-256-CBC model encryption |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **An Anthropic API Key** — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone the repository

```bash
git clone https://github.com/MansiSuryawanshi/CyberDog-AI.git
cd CyberDog-AI
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

### 3. Install dependencies

```bash
# Root (Electron app)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend dashboard
cd frontend && npm install && cd ..
```

### 4. Run — open 3 terminals

**Terminal 1 — Backend API**
```bash
cd backend
npm run dev
# Running at http://localhost:3001
```

**Terminal 2 — SOC Dashboard**
```bash
cd frontend
npm run dev
# Running at http://localhost:5174
```

**Terminal 3 — CyberDog Desktop App**
```bash
npm run dev
# Launches Vite (port 5173) + Electron
```

---

## How It Works — End to End

```
User performs an action
        │
        ▼
Monitoring Layer captures it
(clipboard / screen / email / link)
        │
        ▼
Governance Engine evaluates
(Policy rules + Claude AI risk scoring)
        │
        ▼
Decision: Allow / Warn / Restrict
        │
        ▼
Sentinel alerts user on screen
(speech bubble + dashboard event)
        │
        ▼
User decides: Cancel or Override (with reason)
        │
        ▼
Action + decision logged to audit trail
```

---

## Demo Scenarios

### Phishing Email
1. User opens an email with an external link
2. Screen Monitor captures the screen and sends to Claude Vision
3. Claude identifies the suspicious sender and link
4. Sentinel pops up: *"This link looks suspicious — let me check it first"*
5. Email Defender evaluates the URL — risk: **high**
6. User sees the explanation and suggested alternatives
7. If user proceeds, they must enter a justification — action is logged

### Sensitive Data Leak
1. User copies an API key or internal document to clipboard
2. Clipboard monitor detects it within 1.5 seconds
3. Backend evaluates against policy — decision: **restrict**
4. Sentinel displays: *"Hey! You copied sensitive info — be careful where you paste it!"*
5. Violation recorded in audit trail with timestamp and content hash

### AI Output Governance
1. User attempts to share AI-generated content externally
2. Copy-Paste Guard intercepts the clipboard content
3. Claude evaluates for internal data, PII, or policy violations
4. Sentinel warns with context-specific guidance
5. Override requires written justification

---

## Project Structure

```
CyberDog-AI/
├── main.cjs              # Electron main process
├── preload.cjs           # Electron preload (IPC bridge)
├── index.html            # Sentinel companion UI entry
├── style.css             # Companion styles
├── vite.config.js        # Root Vite config (port 5173)
│
├── src/                  # Companion renderer
│   ├── renderer.js       # Three.js 3D scene + animations
│   ├── interactions/     # Mouse input, action menu
│   └── assets/           # Speech tracker, helpers
│
├── backend/              # API + AI engine
│   └── src/
│       ├── routes/       # Express route handlers
│       ├── services/     # AI engine, screen monitor, database
│       ├── sse/          # Server-Sent Events broadcast
│       └── types/        # TypeScript type definitions
│
├── frontend/             # SOC Dashboard
│   └── src/
│       ├── components/   # AlertBanner, AuditTrail, RiskMeter, etc.
│       ├── pages/        # Dashboard views
│       └── api/          # API client
│
└── agent/                # Browser extension + simulator
```

---

## Hackathon Track

**AI Safety & Governance** — Built for the AI4Good Hackathon

CyberDog AI shifts organizations from **reactive security** to **real-time decision control** — putting a human in the loop at every critical moment, guided by AI.

---

<div align="center">

Built with Claude AI · Three.js · React · Electron

*Making AI-powered workplaces safer, one decision at a time.*

</div>
