import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Lock, 
  Database, 
  Globe, 
  Server, 
  CheckCircle, 
  Headphones, 
  ChevronRight, 
  CreditCard,
  Building,
  Mail,
  Scale,
  Download,
  ExternalLink,
  Info,
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import PolicyAssistantChat from '../components/PolicyAssistantChat';

interface CorporatePolicyProps {
  onBack: () => void;
}

const SECTIONS = [
  { id: 'privacy', label: 'Privacy Policy', icon: Shield, color: '#3b82f6' },
  { id: 'terms', label: 'Terms of Service', icon: FileText, color: '#06b6d4' },
  { id: 'cookies', label: 'Cookie Policy', icon: Globe, color: '#a855f7' },
  { id: 'data-protection', label: 'Data Protection', icon: Database, color: '#10b981' },
  { id: 'security', label: 'Security Policy', icon: Lock, color: '#ef4444' },
  { id: 'acceptable-use', label: 'Acceptable Use', icon: Server, color: '#f59e0b' },
  { id: 'accessibility', label: 'Accessibility', icon: CheckCircle, color: '#ec4899' },
  { id: 'refund', label: 'Refund & Billing', icon: CreditCard, color: '#8b5cf6' },
  { id: 'contact', label: 'Contact', icon: Headphones, color: '#6366f1' }
];

const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function CorporatePolicy({ onBack }: CorporatePolicyProps) {
  const [activeSection, setActiveSection] = useState('privacy');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      let currSection = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scrollPos) {
          currSection = section.id;
        }
      }
      setActiveSection(currSection);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 selection:text-white" style={{ background: '#05060a', color: '#e2e8f0' }}>
      {/* ── PROGRESS BAR ────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* ── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 z-50" 
        style={{ background: 'rgba(5,6,10,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack} 
              className="group flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-all"
            >
              <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              Back to Dashboard
            </button>
            <div className="w-px h-6 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                🐕
              </div>
              <span className="text-xl font-black tracking-tight flex items-center gap-2">
                CyberDog <span className="text-blue-500 uppercase text-[10px] tracking-[0.2em] font-bold px-2 py-0.5 rounded-md border border-blue-500/50 bg-blue-500/10">Legal Portal</span>
              </span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            {['Trust Center', 'Status', 'Security'].map(item => (
              <a key={item} href="#" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                {item}
              </a>
            ))}
            <button className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Download className="w-4 h-4" /> Export All
            </button>
          </nav>
        </div>
      </motion.header>

      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-500/20 blur-[150px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[120px] rounded-full" 
          />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-[1440px] mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black tracking-widest uppercase mb-8">
                <Scale className="w-3 h-3" /> Compliance & Governance
              </div>
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
                Built on <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Deep Trust</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium mb-12">
                CyberDog AI adheres to the world’s most stringent security frameworks to ensure your enterprise data remains resilient, private, and fully auditable.
              </p>
              
                <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                  Verifiably Secure <br/> Through Local Execution
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsChatOpen(true)}
                className="mt-12 flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.3)] group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">New Policy Assistant</p>
                  <p className="text-lg font-black italic tracking-tighter">Ask Sentinel Anything</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img src="/images/corporate_office_banner.png" alt="HQ" className="w-full h-[500px] object-cover scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-transparent to-transparent opacity-90" />
              </div>
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-10 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Privacy Score</p>
                    <p className="text-2xl font-black text-white leading-none">99.8%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-8 py-24">
        <div className="grid lg:grid-cols-[280px_1fr] gap-20">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 pl-4">Legal Frameworks</h3>
              {SECTIONS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="w-full relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all group"
                    style={{ 
                      background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.3)'
                    }}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl border border-blue-500/30"
                      />
                    )}
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-slate-200'}`} />
                    <span className="text-sm font-bold tracking-tight">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </aside>

          {/* DOCUMENT CONTENT */}
          <main className="space-y-40">
            
            {/* 1. Privacy Policy */}
            <section id="privacy" className="scroll-mt-32">
              <FadeInWhenVisible>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white">Privacy Policy</h2>
                      <p className="text-sm text-slate-500 font-mono mt-1">Version 4.2 • Last Modified: April 12, 2026</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-400 leading-relaxed">
                    <p className="text-xl text-slate-200 leading-relaxed font-medium">
                      At CyberDog AI, we don’t just comply with privacy laws; we engineer them into our core architecture through <strong>Differential Privacy</strong> and <strong>Federated Learning</strong> models.
                    </p>
                    
                    <div className="my-12 rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
                       <img src="/images/privacy_data_protection.png" alt="Privacy Flow" className="w-full h-80 object-cover opacity-60 hover:opacity-100 transition-opacity duration-1000" />
                    </div>

                    <h3 className="text-2xl font-black text-white mt-12 mb-6">1. Data Architecture & Sovereignty</h3>
                    <p>Unlike centralized AI systems, CyberDog processes sensitive telemetry data within isolated <strong>Trusted Execution Environments (TEEs)</strong>. This means your data remains within your organizational perimeter at all times.</p>
                    
                    <div className="grid md:grid-cols-2 gap-6 my-10">
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 border-l-4 border-l-blue-500">
                        <h4 className="text-white font-black mb-2 text-base uppercase tracking-wider">Sub-Processors</h4>
                        <p className="text-sm">We strictly limit third-party sub-processors. Our primary AI inference runs on <strong>customer-managed VPCs</strong> or isolated instances.</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 border-l-4 border-l-indigo-500">
                        <h4 className="text-white font-black mb-2 text-base uppercase tracking-wider">Retention Rights</h4>
                        <p className="text-sm">You retain 100% ownership. Logs older than 365 days are automatically purged or archived via cryptographically signed protocols.</p>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mt-8 mb-4">2. Your Rights (GDPR / CCPA / LGPD)</h3>
                    <p>You have the right to access, rectify, or erase your data at any time via the <strong>Governance Dashboard</strong>. Our "Right to be Forgotten" implementation ensures all derived model weights associated with a specific user profile are re-synthesized to remove influence.</p>
                  </div>
                </div>
              </FadeInWhenVisible>
            </section>

            {/* 2. Terms of Service */}
            <section id="terms" className="scroll-mt-32">
              <FadeInWhenVisible>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Terms of Service</h2>
                  </div>

                  <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-400">
                    <p className="text-lg">By deploying the CyberDog Agent, you acknowledge that our AI guidance system provides <strong>probabilistic security recommendations</strong> based on real-time neural analysis.</p>
                    
                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 rounded-3xl border border-white/10 my-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Scale className="w-20 h-20 text-white" />
                      </div>
                      <h4 className="text-white text-xl font-black mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-indigo-400" /> Acceptable Use Standards
                      </h4>
                      <p className="text-slate-300 mb-6 leading-relaxed">
                        The software may <strong>not</strong> be used for unauthorized mass-surveillance, training competing LLMs, or circumventing legal discovery requirements.
                      </p>
                      <button className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-widest hover:text-indigo-400 transition-colors">
                        View Full Master Agreement <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-2xl font-black text-white mt-12">Dispute Resolution & Governing Law</h3>
                    <p>Any disputes arising under these terms will be settled via binding arbitration in the <strong>State of Delaware</strong>, under the rules of the American Arbitration Association.</p>
                  </div>
                </div>
              </FadeInWhenVisible>
            </section>

            {/* 3. Security Policy */}
            <section id="security" className="scroll-mt-32">
              <FadeInWhenVisible>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Security Infrastructure</h2>
                  </div>

                  <div className="my-12 rounded-3xl overflow-hidden border border-white/5 relative">
                     <img src="/images/security_compliance_visual.png" alt="Security" className="w-full h-96 object-cover" />
                     <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-red-950/80 to-transparent backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-white">
                           <Info className="w-6 h-6" />
                           <span className="font-black uppercase tracking-widest text-sm">Real-time Encryption Monitor Active</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8 my-10">
                    {[
                      { title: 'Encryption at Rest', desc: 'AES-256-GCM with rotate hardware-backed keys.', icon: Lock },
                      { title: 'Network Security', desc: 'mTLS enforced for all microservice communication.', icon: Globe },
                      { title: 'Auditing', desc: 'Immutable SIEM logging with cryptographic handshakes.', icon: Database },
                      { title: 'Vulnerability Mgmt', desc: '24/7 automated bug bounty and nightly static analysis.', icon: Shield },
                    ].map(card => (
                      <div key={card.title} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                        <card.icon className="w-8 h-8 text-red-400 mb-4" />
                        <h4 className="text-lg font-black text-white mb-2">{card.title}</h4>
                        <p className="text-sm text-slate-500">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInWhenVisible>
            </section>

            {/* 4. Cookie Policy */}
            <section id="cookies" className="scroll-mt-32">
              <FadeInWhenVisible>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Globe className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Cookie Classification</h2>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-6 py-4 font-black uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 font-black uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-4 font-black uppercase tracking-wider text-right">Lifespan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="px-6 py-4 font-bold text-white">Strictly Necessary</td>
                          <td className="px-6 py-4 text-slate-400">Auth, CSRF protection, session integrity.</td>
                          <td className="px-6 py-4 text-right text-slate-500">Session</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-white">Performance</td>
                          <td className="px-6 py-4 text-slate-400">Latency tracking and load balancing optimization.</td>
                          <td className="px-6 py-4 text-right text-slate-500">30 Days</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-white">Functional</td>
                          <td className="px-6 py-4 text-slate-400">Remembers dashboard layout and theme preferences.</td>
                          <td className="px-6 py-4 text-right text-slate-500">1 Year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </FadeInWhenVisible>
            </section>

            {/* 5. Contact Section */}
            <section id="contact" className="scroll-mt-32">
              <FadeInWhenVisible>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Headphones className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Contact & Support</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-10 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-white/10">
                      <Mail className="w-10 h-10 text-indigo-400 mb-6" />
                      <h4 className="text-xl font-black text-white mb-2">Legal Team</h4>
                      <p className="text-slate-500 mb-6">For inquiries related to data rights or master service agreements.</p>
                      <a href="mailto:legal@cyberdog.ai" className="text-indigo-400 font-bold text-lg hover:underline underline-offset-8 transition-all">
                        legal@cyberdog.ai
                      </a>
                    </div>
                    <div className="p-10 rounded-3xl bg-white/[0.03] border border-white/5">
                      <Building className="w-10 h-10 text-indigo-400 mb-6" />
                      <h4 className="text-xl font-black text-white mb-2">Corporate HQ</h4>
                      <p className="text-slate-400 leading-relaxed font-medium">
                        100 Governance Way<br/>
                        Suite 400<br/>
                        San Francisco, CA 94107
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            </section>

          </main>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-24 px-8 mt-24 bg-black/40">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🐕</div>
                <span className="text-xl font-black text-white uppercase tracking-tighter">CyberDog AI</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed mb-6 font-medium">
                The world's first autonomous security governance engine. Protecting privacy through machine intelligence.
              </p>
              <div className="flex gap-4">
                {['LinkedIn', 'Twitter', 'GitHub'].map(s => (
                  <a key={s} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all">
                    <div className="text-[10px] font-bold">X</div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
              © 2026 CyberDog AI Inc. All Rights Reserved.
            </p>
            <div className="flex gap-10">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Shield className="w-3 h-3" /> SOC 2 Type II Certified
              </p>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Lock className="w-3 h-3" /> GDPR Compliant
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ── POLICY ASSISTANT CHAT ────────────────────────────────────────────── */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-6">
        <AnimatePresence>
          {isChatOpen && (
            <PolicyAssistantChat onClose={() => setIsChatOpen(false)} />
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
            isChatOpen ? 'bg-white text-slate-900 rotate-90' : 'bg-blue-600 text-white'
          }`}
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
          {!isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 px-2 py-1 rounded-md bg-emerald-500 text-[10px] font-black text-white"
            >
              AI ONLINE
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
