import React, { useEffect, useState, useCallback, useRef } from 'react';

const API = 'http://localhost:3001/api';

interface Violation {
  id: string;
  action: { type: string; content: string; userId: string; timestamp: string };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decision: string;
  explanation: string;
}
interface AuditLog { id: string; event: string; details: Record<string, unknown>; timestamp: string; }
interface Policy { id: string; name: string; description: string; enabled: boolean; category: string; severity: string; }
interface MonitorStatus { running: boolean; screenshotsTaken: number; threatsDetected: number; startedAt: string | null; intervalMs: number; }
interface LiveAlert { id: string; type: string; message: string; time: string; level: string; feature: string; }
interface EmployeeRisk { userId: string; total: number; high: number; medium: number; low: number; lastSeen: string; }

const RC: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  low:      { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.5)' },
  medium:   { bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)',  dot: '#fb923c', glow: '0 0 8px rgba(251,146,60,0.5)' },
  high:     { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)',    dot: '#f87171', glow: '0 0 10px rgba(239,68,68,0.6)' },
  critical: { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', border: 'rgba(236,72,153,0.3)',   dot: '#f472b6', glow: '0 0 12px rgba(236,72,153,0.7)' },
  none:     { bg: 'rgba(34,197,94,0.1)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)',   dot: '#4ade80', glow: '0 0 8px rgba(34,197,94,0.5)' },
};

function Badge({ level }: { level: string }) {
  const c = RC[level] ?? RC.medium;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
      <span style={{ background: c.dot, boxShadow: c.glow }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {level}
    </span>
  );
}

function Ping({ color = '#22c55e', size = 'md' }: { color?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';
  return (
    <span className={`relative flex ${s}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60`} style={{ background: color }} />
      <span className={`relative inline-flex rounded-full ${s}`} style={{ background: color }} />
    </span>
  );
}

function Card({ children, accent = '#3b82f6', className = '' }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${accent}80,transparent)` }} />
      {children}
    </div>
  );
}

function FeatureStatusCard({ label, icon, color, events, live }: {
  label: string; icon: string; color: string; events: number; live: boolean;
}) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: `linear-gradient(135deg,${color}12,${color}05)`, border: `1px solid ${color}25` }}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>{icon}</div>
        {live ? <Ping color={color} /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      <p className="text-3xl font-black text-white">{events}</p>
      <p className="text-xs mt-1" style={{ color: `${color}99` }}>events detected</p>
    </div>
  );
}

function StatNum({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
    </div>
  );
}

function AlertRow({ alert }: { alert: LiveAlert }) {
  const c = RC[alert.level] ?? RC.medium;
  const featureColor: Record<string, string> = {
    screen: '#a855f7', email: '#3b82f6', copy: '#f97316', policy: '#ef4444', general: '#64748b',
  };
  const fc = featureColor[alert.feature] ?? '#64748b';
  return (
    <div className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex-shrink-0 mt-1.5">
        <span className="w-1.5 h-1.5 rounded-full block" style={{ background: c.dot, boxShadow: c.glow }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded" style={{ background: `${fc}15`, color: fc, border: `1px solid ${fc}30` }}>
            {alert.feature}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{alert.time}</span>
        </div>
        <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>{alert.message}</p>
      </div>
      <Badge level={alert.level} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'overview' | 'employees' | 'violations' | 'audit' | 'policies' | 'monitor'>('overview');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [monitor, setMonitor] = useState<MonitorStatus | null>(null);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [v, a, p, m] = await Promise.all([
        fetch(`${API}/violations`).then(r => r.json()),
        fetch(`${API}/violations/audit/logs`).then(r => r.json()),
        fetch(`${API}/policies`).then(r => r.json()),
        fetch(`${API}/monitor/status`).then(r => r.json()),
      ]);
      setViolations(Array.isArray(v) ? v : []);
      setAuditLogs(Array.isArray(a) ? a : []);
      setPolicies(Array.isArray(p) ? p : []);
      setMonitor(m);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 6000); return () => clearInterval(iv); }, [fetchAll]);

  useEffect(() => {
    const es = new EventSource(`${API}/stream?clientId=dash-${Date.now()}`);
    const push = (type: string, feature: string) => (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const msg = data.sentinelMessage || data.explanation || data.message || JSON.stringify(data).slice(0, 140);
      const level = data.threatLevel || data.riskLevel || 'medium';
      setAlerts(prev => [{ id: `${Date.now()}-${Math.random()}`, type, message: msg, time: new Date().toLocaleTimeString(), level, feature }, ...prev.slice(0, 99)]);
    };
    const MAP: [string, string][] = [
      ['screen_threat', 'screen'], ['screen_email_detected', 'screen'], ['screen_sensitive_data', 'screen'],
      ['screen_suspicious_link', 'screen'], ['copy_paste_violation', 'copy'],
      ['email_scanned', 'email'], ['link_visual_result', 'email'], ['email_defender', 'email'],
      ['violation', 'policy'], ['override', 'policy'], ['policy_update', 'policy'],
    ];
    MAP.forEach(([ev, feat]) => es.addEventListener(ev, push(ev, feat) as EventListener));
    es.addEventListener('screen_checking', () => {
      setChecking(true);
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(() => setChecking(false), 4000);
    });
    return () => { es.close(); if (checkTimer.current) clearTimeout(checkTimer.current); };
  }, []);

  const employeeRisk: EmployeeRisk[] = React.useMemo(() => {
    const map: Record<string, EmployeeRisk> = {};
    violations.forEach(v => {
      const uid = v.action.userId || 'unknown';
      if (!map[uid]) map[uid] = { userId: uid, total: 0, high: 0, medium: 0, low: 0, lastSeen: v.action.timestamp };
      map[uid].total++;
      if (v.riskLevel === 'high' || v.riskLevel === 'critical') map[uid].high++;
      else if (v.riskLevel === 'medium') map[uid].medium++;
      else map[uid].low++;
      if (v.action.timestamp > map[uid].lastSeen) map[uid].lastSeen = v.action.timestamp;
    });
    return Object.values(map).sort((a, b) => b.high - a.high || b.total - a.total);
  }, [violations]);

  const highCount   = violations.filter(v => v.riskLevel === 'high' || v.riskLevel === 'critical').length;
  const enabledPol  = policies.filter(p => p.enabled).length;
  const maxEmp      = employeeRisk[0]?.total ?? 1;
  const screenEvts  = alerts.filter(a => a.feature === 'screen').length;
  const emailEvts   = alerts.filter(a => a.feature === 'email').length;
  const copyEvts    = alerts.filter(a => a.feature === 'copy').length;
  const policyEvts  = alerts.filter(a => a.feature === 'policy').length;

  const toggleMonitor = async () => {
    await fetch(`${API}/monitor/${monitor?.running ? 'stop' : 'start'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    fetchAll();
  };
  const togglePolicy = async (p: Policy) => {
    await fetch(`${API}/policies/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, enabled: !p.enabled }) });
    fetchAll();
  };

  const TABS = [
    { id: 'overview',   label: 'Overview',     icon: '⬡' },
    { id: 'employees',  label: 'Employee Risk', icon: '◉' },
    { id: 'violations', label: 'Violations',    icon: '◬' },
    { id: 'audit',      label: 'Audit Trail',   icon: '◎' },
    { id: 'policies',   label: 'Policies',      icon: '◍' },
    { id: 'monitor',    label: 'Monitor',       icon: '◌' },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#05080f 0%,#09112a 50%,#060c1a 100%)' }}>
      {/* Glow bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[700px] h-[500px] opacity-25" style={{ background: 'radial-gradient(ellipse at 20% 10%,rgba(59,130,246,0.2) 0%,transparent 65%)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] opacity-20" style={{ background: 'radial-gradient(ellipse at 80% 90%,rgba(168,85,247,0.2) 0%,transparent 65%)' }} />
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }}>
          <defs><pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.8"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      {/* ── HERO HEADER ────────────────────────────────────────────────────── */}
      <div className="relative" style={{ background: 'rgba(5,8,15,0.7)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Top bar */}
        <div className="max-w-[1440px] mx-auto px-8 pt-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            {/* Brand */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#1d4ed8,#0e7490)', boxShadow: '0 0 30px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' }}>🐕</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#05080f', background: monitor?.running ? '#22c55e' : '#334155' }}>
                  {monitor?.running && <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none">
                  <span className="text-white">Cyber</span><span style={{ background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dog</span>
                  <span className="ml-2 text-lg font-bold px-2 py-0.5 rounded-lg align-middle" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', verticalAlign: 'middle', fontSize: '0.5em', lineHeight: 1 }}>AI</span>
                </h1>
                <p className="text-xs font-bold tracking-[0.25em] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Security Operations Center</p>
              </div>
            </div>

            {/* Center stats */}
            <div className="hidden lg:flex items-center gap-8">
              <StatNum label="Violations" value={violations.length} color="#f87171" />
              <div className="w-px h-8 bg-white/8" />
              <StatNum label="High Risk" value={highCount} color="#fb923c" />
              <div className="w-px h-8 bg-white/8" />
              <StatNum label="Policies" value={`${enabledPol}/${policies.length}`} color="#4ade80" />
              <div className="w-px h-8 bg-white/8" />
              <StatNum label="Screenshots" value={monitor?.screenshotsTaken ?? 0} color="#a78bfa" />
              <div className="w-px h-8 bg-white/8" />
              <StatNum label="Threats" value={monitor?.threatsDetected ?? 0} color="#f472b6" />
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: monitor?.running ? 'rgba(34,197,94,0.1)' : 'rgba(51,65,85,0.3)', border: `1px solid ${monitor?.running ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, color: monitor?.running ? '#4ade80' : '#64748b' }}>
                {monitor?.running ? <Ping color="#22c55e" size="sm" /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
                {monitor?.running ? 'Monitor Active' : 'Monitor Off'}
              </div>
              {checking && (
                <div className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg animate-pulse" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  AI analyzing screen...
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className="relative flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-wide uppercase transition-all duration-200 rounded-t-xl"
                style={{ color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.28)', background: tab === t.id ? 'rgba(59,130,246,0.12)' : 'transparent', borderTop: tab === t.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent', borderLeft: tab === t.id ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent', borderRight: tab === t.id ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent' }}>
                <span className="font-mono">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-8 py-8 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 0 40px rgba(59,130,246,0.1)' }}>🐕</div>
            <p className="text-base font-semibold text-white/30">Connecting to CyberDog backend...</p>
          </div>
        )}

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {tab === 'overview' && !loading && (
          <div className="space-y-6">
            {/* Feature Status Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureStatusCard label="Screen Monitor" icon="👁️" color="#a855f7" events={screenEvts} live={monitor?.running ?? false} />
              <FeatureStatusCard label="Email Defender" icon="📧" color="#3b82f6" events={emailEvts} live={true} />
              <FeatureStatusCard label="Copy-Paste Guard" icon="📋" color="#f97316" events={copyEvts} live={true} />
              <FeatureStatusCard label="Policy Engine" icon="🛡️" color="#22c55e" events={policyEvts} live={true} />
            </div>

            {/* Main 3-col grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Live Feed - 2 cols */}
              <div className="lg:col-span-2">
                <Card accent="#ef4444">
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <Ping color="#ef4444" />
                      <p className="text-base font-black text-white">Live Threat Feed</p>
                    </div>
                    <div className="flex gap-2">
                      {['screen','email','copy','policy'].map(f => {
                        const cnt = alerts.filter(a=>a.feature===f).length;
                        const cols: Record<string,string> = {screen:'#a855f7',email:'#3b82f6',copy:'#f97316',policy:'#22c55e'};
                        return cnt > 0 ? (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:`${cols[f]}15`,color:cols[f],border:`1px solid ${cols[f]}30` }}>{f} {cnt}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: 'rgba(255,255,255,0.12)' }}>
                      <span className="text-5xl">📡</span>
                      <p className="text-sm font-medium">Monitoring all channels — no threats yet</p>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto">
                      {alerts.map((a, i) => <AlertRow key={a.id} alert={{ ...a, message: a.message }} />)}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                {/* Screen status */}
                <Card accent="#a855f7">
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Screen AI Status</p>
                      {checking ? <Ping color="#a855f7" size="sm" /> : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>idle</span>}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Screenshots', val: monitor?.screenshotsTaken ?? 0, color: '#a78bfa' },
                      { label: 'Threats Found', val: monitor?.threatsDetected ?? 0, color: '#f87171' },
                      { label: 'Screen Events', val: screenEvts, color: '#c084fc' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                        <span className="text-lg font-black" style={{ color: s.color }}>{s.val}</span>
                      </div>
                    ))}
                    <button onClick={toggleMonitor} className="w-full mt-2 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all hover:scale-[1.02]"
                      style={monitor?.running ? { background:'rgba(239,68,68,0.15)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)' } : { background:'rgba(34,197,94,0.15)',color:'#4ade80',border:'1px solid rgba(34,197,94,0.3)' }}>
                      {monitor?.running ? '⏹ Stop Monitor' : '▶ Start Monitor'}
                    </button>
                  </div>
                </Card>

                {/* Top risky employees */}
                <Card accent="#f97316">
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm font-bold text-white">Riskiest Employees</p>
                  </div>
                  {employeeRisk.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8" style={{ color: 'rgba(255,255,255,0.12)' }}>
                      <p className="text-xs">No violations recorded</p>
                    </div>
                  ) : (
                    <div>
                      {employeeRisk.slice(0, 5).map((emp, i) => {
                        const c = i===0?'#ef4444':i===1?'#fb923c':i===2?'#fbbf24':'#64748b';
                        return (
                          <div key={emp.userId} className="px-5 py-3 flex items-center gap-3 hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="text-sm font-black w-5 text-center" style={{ color: c }}>#{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{emp.userId}</p>
                              <div className="h-1 mt-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="h-full rounded-full" style={{ width:`${Math.round((emp.total/maxEmp)*100)}%`,background:`linear-gradient(90deg,${c}cc,${c}44)` }} />
                              </div>
                            </div>
                            <span className="text-lg font-black" style={{ color: c }}>{emp.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Recent violations */}
            <Card accent="#6366f1">
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-sm font-bold text-white">Recent Violations</p>
              </div>
              <ViolationTable violations={violations.slice(0, 6)} />
            </Card>
          </div>
        )}

        {/* ── EMPLOYEES ─────────────────────────────────────────────────────── */}
        {tab === 'employees' && !loading && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[{ l:'Tracked Employees',v:employeeRisk.length,c:'#60a5fa' },{ l:'High Risk Users',v:employeeRisk.filter(e=>e.high>0).length,c:'#f87171' },{ l:'Total Incidents',v:violations.length,c:'#c084fc' }]
                .map(s=><div key={s.l} className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>{s.l}</p>
                  <p className="text-4xl font-black" style={{ color:s.c }}>{s.v}</p>
                </div>)}
            </div>
            <Card accent="#a855f7">
              <div className="px-6 py-5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xl font-black text-white">Employee Risk Leaderboard</p>
                <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.3)' }}>Real-time ranking by security violations</p>
              </div>
              {employeeRisk.length === 0 ? (
                <div className="flex flex-col items-center py-24 gap-3" style={{ color:'rgba(255,255,255,0.12)' }}>
                  <span className="text-5xl">👥</span><p className="text-sm">No violations yet</p>
                </div>
              ) : employeeRisk.map((emp, i) => {
                const c = i===0?'#ef4444':i===1?'#fb923c':i===2?'#fbbf24':'rgba(255,255,255,0.3)';
                return (
                  <div key={emp.userId} className="px-6 py-5 hover:bg-white/[0.02] transition-colors" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0" style={{ background:`${c}12`,border:`1px solid ${c}35`,color:c }}>{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="text-lg font-bold text-white">{emp.userId}</span>
                          {(emp.high > 2 || i===0) && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background:'rgba(239,68,68,0.12)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)' }}>⚠ HIGH RISK</span>}
                        </div>
                        <p className="text-xs mb-3" style={{ color:'rgba(255,255,255,0.2)' }}>Last: {new Date(emp.lastSeen).toLocaleString()}</p>
                        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                          {emp.high>0   && <div style={{ width:`${(emp.high/emp.total)*100}%`,background:'linear-gradient(90deg,#ef4444,#dc2626)' }} />}
                          {emp.medium>0 && <div style={{ width:`${(emp.medium/emp.total)*100}%`,background:'linear-gradient(90deg,#f97316,#ea580c)' }} />}
                          {emp.low>0    && <div style={{ width:`${(emp.low/emp.total)*100}%`,background:'linear-gradient(90deg,#eab308,#ca8a04)' }} />}
                        </div>
                        <div className="flex gap-5 mt-2">
                          <span className="text-xs font-bold" style={{ color:'#f87171' }}>{emp.high} high</span>
                          <span className="text-xs font-bold" style={{ color:'#fb923c' }}>{emp.medium} medium</span>
                          <span className="text-xs font-bold" style={{ color:'#fbbf24' }}>{emp.low} low</span>
                        </div>
                      </div>
                      <div className="text-right"><p className="text-5xl font-black" style={{ color:c,lineHeight:1 }}>{emp.total}</p><p className="text-xs mt-1" style={{ color:'rgba(255,255,255,0.2)' }}>violations</p></div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* ── VIOLATIONS ────────────────────────────────────────────────────── */}
        {tab === 'violations' && (
          <Card accent="#6366f1">
            <div className="px-6 py-5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xl font-black text-white">All Violations</p>
              <p className="text-sm mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{violations.length} records</p>
            </div>
            <ViolationTable violations={violations} />
          </Card>
        )}

        {/* ── AUDIT ─────────────────────────────────────────────────────────── */}
        {tab === 'audit' && (
          <Card accent="#06b6d4">
            <div className="px-6 py-5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xl font-black text-white">Audit Trail</p>
              <p className="text-sm mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>{auditLogs.length} events</p>
            </div>
            {auditLogs.length===0 ? (
              <div className="flex flex-col items-center py-20" style={{ color:'rgba(255,255,255,0.12)' }}><span className="text-5xl mb-3">📋</span><p className="text-sm">No logs yet</p></div>
            ) : (
              <div className="max-h-[72vh] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background:'#3b82f6',boxShadow:'0 0 8px rgba(59,130,246,0.6)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color:'#60a5fa' }}>{log.event}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color:'rgba(255,255,255,0.22)' }}>{JSON.stringify(log.details)}</p>
                    </div>
                    <span className="text-xs font-mono whitespace-nowrap" style={{ color:'rgba(255,255,255,0.18)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── POLICIES ──────────────────────────────────────────────────────── */}
        {tab === 'policies' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 mb-2">
              {[{l:'Total',v:policies.length,c:'#60a5fa'},{l:'Active',v:enabledPol,c:'#4ade80'},{l:'Disabled',v:policies.length-enabledPol,c:'#64748b'}]
                .map(s=><div key={s.l} className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>{s.l} Policies</p>
                  <p className="text-4xl font-black" style={{ color:s.c }}>{s.v}</p>
                </div>)}
            </div>
            {policies.map(p => (
              <div key={p.id} className="rounded-2xl p-5 hover:bg-white/[0.02] transition-all" style={{ background:'rgba(255,255,255,0.025)',border:p.enabled?'1px solid rgba(59,130,246,0.2)':'1px solid rgba(255,255,255,0.06)',backdropFilter:'blur(20px)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-white">{p.name}</span>
                      <Badge level={p.severity} />
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.35)' }}>{p.category}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.38)' }}>{p.description}</p>
                  </div>
                  <button onClick={()=>togglePolicy(p)} className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 mt-1 focus:outline-none"
                    style={{ background:p.enabled?'linear-gradient(135deg,#3b82f6,#06b6d4)':'rgba(255,255,255,0.08)',boxShadow:p.enabled?'0 0 16px rgba(59,130,246,0.35)':'none' }}>
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300" style={{ transform:p.enabled?'translateX(24px)':'translateX(2px)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MONITOR ───────────────────────────────────────────────────────── */}
        {tab === 'monitor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {l:'Status',v:monitor?.running?'Running':'Stopped',c:monitor?.running?'#4ade80':'#64748b'},
                {l:'Screenshots',v:monitor?.screenshotsTaken??0,c:'#60a5fa'},
                {l:'Threats',v:monitor?.threatsDetected??0,c:'#f87171'},
                {l:'Interval',v:`${((monitor?.intervalMs??5000)/1000).toFixed(0)}s`,c:'#c084fc'},
              ].map(s=><div key={s.l} className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>{s.l}</p>
                <p className="text-4xl font-black" style={{ color:s.c }}>{s.v}</p>
              </div>)}
            </div>
            <Card accent={monitor?.running?'#22c55e':'#64748b'}>
              <div className="px-8 py-6 flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-white mb-1">Screen Monitor Control</p>
                  <p className="text-sm" style={{ color:'rgba(255,255,255,0.3)' }}>{monitor?.startedAt?`Running since ${new Date(monitor.startedAt).toLocaleString()}`:'Start to begin real-time screen analysis via Claude Vision'}</p>
                </div>
                <button onClick={toggleMonitor} className="px-8 py-3 rounded-xl font-black text-white text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
                  style={monitor?.running?{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 0 24px rgba(239,68,68,0.35)'}:{background:'linear-gradient(135deg,#22c55e,#16a34a)',boxShadow:'0 0 24px rgba(34,197,94,0.35)'}}>
                  {monitor?.running?'⏹ Stop':'▶ Start'}
                </button>
              </div>
            </Card>
            <Card accent="#ef4444">
              <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <Ping color="#ef4444" size="sm" />
                <p className="text-sm font-bold text-white">Screen Threat Log</p>
                <span className="ml-auto text-xs px-2 py-1 rounded-full font-mono" style={{ background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.2)' }}>{screenEvts}</span>
              </div>
              {alerts.filter(a=>a.feature==='screen').length===0 ? (
                <div className="flex flex-col items-center py-16 gap-3" style={{ color:'rgba(255,255,255,0.12)' }}><span className="text-4xl">👁️</span><p className="text-sm">No screen threats yet</p></div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {alerts.filter(a=>a.feature==='screen').map(a=><AlertRow key={a.id} alert={a} />)}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function ViolationTable({ violations }: { violations: Violation[] }) {
  if (violations.length === 0)
    return <div className="flex flex-col items-center py-16 gap-3" style={{ color:'rgba(255,255,255,0.12)' }}><span className="text-4xl">✅</span><p className="text-sm">No violations</p></div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {['Time','User','Type','Risk','Decision','Summary'].map(h=>(
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.2)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {violations.map(v=>(
            <tr key={v.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <td className="px-6 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color:'rgba(255,255,255,0.22)' }}>{new Date(v.action.timestamp).toLocaleString()}</td>
              <td className="px-6 py-3.5 font-semibold" style={{ color:'#60a5fa' }}>{v.action.userId}</td>
              <td className="px-6 py-3.5 capitalize" style={{ color:'rgba(255,255,255,0.55)' }}>{v.action.type}</td>
              <td className="px-6 py-3.5"><Badge level={v.riskLevel} /></td>
              <td className="px-6 py-3.5 capitalize" style={{ color:'rgba(255,255,255,0.4)' }}>{v.decision}</td>
              <td className="px-6 py-3.5 max-w-xs truncate" style={{ color:'rgba(255,255,255,0.32)' }}>{v.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
