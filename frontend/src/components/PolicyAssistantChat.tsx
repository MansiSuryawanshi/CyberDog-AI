import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  X, 
  MessageSquare, 
  ArrowRight,
  Shield,
  LifeBuoy,
  ChevronRight,
  History,
  Info
} from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  type?: 'policy' | 'clarification' | 'escalation';
}

const QUICK_PROMPTS = [
  { label: 'Leave Policy', icon: Shield },
  { label: 'Remote Work', icon: Info },
  { label: 'Expenses', icon: LifeBuoy },
  { label: 'Security', icon: Shield }
];

export default function PolicyAssistantChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi, I'm Sentinel, your AI Policy Assistant. I can help you with leave, workplace rules, benefits, or HR guidelines. Ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate natural delay for that "thinking" feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await fetch('http://localhost:3001/api/policy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text, type: data.type }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the policy server. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="flex flex-col h-[600px] w-full max-w-lg bg-[#0a0c10] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
    >
      {/* HEADER */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Sentinel AI</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Policy Engine Active</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 hover:text-white" />
          </button>
        )}
      </div>

      {/* MESSAGES */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/5 border border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none' 
                    : msg.type === 'escalation'
                      ? 'bg-red-500/10 border border-red-500/20 text-slate-300 rounded-tl-none'
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {msg.text.split('\n').map((line, idx) => (
                      <div key={idx} className={line.startsWith('**') ? 'font-black text-white mb-2' : ''}>
                        {line.startsWith('•') ? (
                          <div className="flex gap-2">
                            <span>•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        ) : line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500/50"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
        {/* QUICK PROMPTS */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.label)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-[11px] font-bold text-slate-400 hover:text-blue-400 flex items-center gap-2"
            >
              <p.icon className="w-3 h-3" />
              {p.label}
            </button>
          ))}
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="relative"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about policy..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-wider">
          CyberDog AI • Policy Expert Mode Active
        </p>
      </div>
    </motion.div>
  );
}
