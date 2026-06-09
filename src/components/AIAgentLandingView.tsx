import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  CornerDownRight, 
  CheckCircle2, 
  Cpu, 
  MessageSquare,
  Mic,
  Smile,
  Zap,
  Play,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAgentLandingViewProps {
  onBack: () => void;
  onSignUp: () => void;
}

export function AIAgentLandingView({ onBack, onSignUp }: AIAgentLandingViewProps) {
  const [comment, setComment] = useState('Replace iPhone 15 Pro screen, part cost was $220, client paid with card');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState(0);
  
  // Parsed Result state
  const [parsedData, setParsedData] = useState({
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    services: [
      { name: 'Screen Replacement', price: 349 }
    ],
    customer: 'Walk-in Customer',
    paymentMethod: 'Card'
  });

  const presets = [
    {
      text: "Replace iPhone 15 Pro screen, part cost was $220, client paid with card",
      data: {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        services: [
          { name: 'Screen Replacement', price: 349 }
        ],
        customer: 'Walk-in Customer',
        paymentMethod: 'Card'
      }
    },
    {
      text: "Did a battery swap on Galaxy S23 Ultra, customer name is Sarah Jenkins, charge her $140 cash",
      data: {
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        services: [
          { name: 'Battery Replacement', price: 140 }
        ],
        customer: 'Sarah Jenkins',
        paymentMethod: 'Cash'
      }
    },
    {
      text: "Estimate a liquid damage cleaning and keyboard replacement for MacBook Air 13 M2, charge $299",
      data: {
        brand: 'Apple',
        model: 'MacBook Air 13" (M2)',
        services: [
          { name: 'Liquid Damage Assessment & Cleaning', price: 120 },
          { name: 'Keyboard Replacement', price: 179 }
        ],
        customer: 'Walk-in Customer',
        paymentMethod: 'Other'
      }
    }
  ];

  const handleRunPreset = (preset: typeof presets[0]) => {
    setComment(preset.text);
    triggerParsing(preset.data);
  };

  const triggerParsing = (targetData: typeof parsedData) => {
    setIsParsing(true);
    setParsingStep(0);
  };

  useEffect(() => {
    if (!isParsing) return;

    const timer = setInterval(() => {
      setParsingStep((prev) => {
        if (prev >= 3) {
          clearInterval(timer);
          setIsParsing(false);
          // Update the parsed data when fully completed
          const match = presets.find(p => p.text === comment);
          if (match) {
            setParsedData(match.data);
          } else {
            // General customized user input demo parser
            setParsedData({
              brand: comment.toLowerCase().includes('galaxy') || comment.toLowerCase().includes('samsung') ? 'Samsung' : 'Apple',
              model: comment.toLowerCase().includes('macbook') ? 'MacBook Air 13" (M2)' : comment.toLowerCase().includes('s23') ? 'Galaxy S23 Ultra' : 'iPhone 15 Pro',
              services: [
                { name: comment.toLowerCase().includes('screen') ? 'Screen Repair' : comment.toLowerCase().includes('battery') ? 'Battery Swap' : 'General Diagnostic service', price: 180 }
              ],
              customer: comment.match(/name is\s+([A-Za-z]+\s+[A-Za-z]+)/i)?.[1] || 'Walk-in Customer',
              paymentMethod: comment.toLowerCase().includes('cash') ? 'Cash' : 'Card'
            });
          }
          return 4;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(timer);
  }, [isParsing, comment]);

  // Total invoice sum helper
  const totalAmount = parsedData.services.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-600/30">
      {/* Background radial accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-900/20 via-transparent to-transparent pointer-events-none blur-3xl z-0" />

      {/* Hero Header bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between border-b border-slate-800">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div 
          onClick={onBack}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white" size={16} />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-200">REPAIRBILL AI</span>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 space-y-24">
        {/* Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Cpu size={12} /> Next-Gen Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.9]">
              The Bench Assistant <span className="text-blue-500">That Thinks.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
              Stop clicking through endless drop-downs and forms. Build beautiful invoices, capture new leads, and estimate repairs in seconds using high-fidelity natural language processing.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={onSignUp}
                className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all outline-none"
              >
                Launch AI App free
              </button>
              <a 
                href="#interactive-demo"
                className="px-6 py-4 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-300 hover:text-white text-sm font-bold transition-all"
              >
                Try Sandbox
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[32px] blur-2xl opacity-25" />
            <div className="relative bg-slate-950/70 border border-slate-800 p-8 rounded-[32px] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                  <Mic className="text-blue-500 animate-pulse animate-duration-2000" size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Voice Recognition</p>
                  <p className="text-sm font-bold text-slate-200">"Estimate screen repair for Sam's iPhone..."</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <span>Extracted Entities</span>
                    <span className="text-emerald-400">99.2% confidence</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold leading-none">Brand: Apple</span>
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold leading-none">Model: iPhone 15</span>
                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-bold leading-none">Customer: Sam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          {[
            {
              icon: <Zap className="text-yellow-400" size={24} />,
              title: "Extreme Efficiency",
              desc: "Write tech bench findings directly into notes, and let the AI generate structural records instantly behind the scenes."
            },
            {
              icon: <Coins className="text-green-400" size={24} />,
              title: "GST & Pricing Intelligence",
              desc: "Automatically checks current catalog listings, applies correct tax categories, and alerts you about outlier costs."
            },
            {
              icon: <FileSpreadsheet className="text-blue-400" size={24} />,
              title: "Multi-modal Support",
              desc: "Paste rough descriptions, talk directly to the workstation microphone, or snap bench images to feed the workspace."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Live Interactive Sandbox */}
        <section id="interactive-demo" className="space-y-8 pt-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Test Drive <span className="text-blue-500">The Sandbox.</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2">
              Select one of our realistic repair notes presets below, or type your own. Tap parse to watch the AI build the invoice live.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-3">
            {presets.map((p, idx) => (
              <button 
                key={idx}
                onClick={() => handleRunPreset(p)}
                className="px-4 py-2.5 bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-750 text-xs font-bold rounded-2xl transition-all"
              >
                Preset {idx + 1}: "{p.data.model}"
              </button>
            ))}
          </div>

          {/* Interactive Workspace Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Comment Column */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Technician Log Note</span>
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 font-bold px-2 py-1 rounded">Sandbox Active</span>
              </div>

              <div className="relative">
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-750 focus:border-blue-500 text-slate-200 outline-none resize-none font-bold text-sm tracking-tight transition-all"
                  placeholder="Type rough technician findings..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerParsing(presets[0].data)}
                  disabled={isParsing || !comment.trim()}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>{isParsing ? 'AI Parsing...' : 'Parse Technician Note'}</span>
                </button>
              </div>

              {/* Parsing Steps */}
              <div className="space-y-2 pt-4 border-t border-slate-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Brain Analysis Logs</p>
                {[
                  { step: 1, text: "Scanning text stream for matching model catalogs..." },
                  { step: 2, text: "Identifying standard services and assessing rates..." },
                  { step: 3, text: "Binding local customer client data records..." },
                  { step: 4, text: "Validating cash/card payment configurations..." }
                ].map((s) => {
                  const active = isParsing && parsingStep >= s.step - 1;
                  const completed = isParsing ? parsingStep >= s.step : !isParsing;
                  return (
                    <div key={s.step} className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
                      {completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      ) : active ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 shrink-0" />
                      )}
                      <span className={`font-medium ${completed ? 'text-slate-300' : 'text-slate-400'}`}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generated Invoice Output mockup */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structured Invoice Mockup</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black tracking-tight text-white leading-none">RepairBill Inc.</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sydney, NSW, Australia</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Draft</p>
                    <p className="text-sm font-bold text-slate-300 mt-1">#AI-2026-001</p>
                  </div>
                </div>

                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-900 py-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Client</p>
                    <p className="font-bold text-slate-300">{parsedData.customer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Device</p>
                    <p className="font-bold text-slate-300">{parsedData.brand} {parsedData.model}</p>
                  </div>
                </div>

                {/* Invoice Items list */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parsed Services</p>
                  {parsedData.services.map((srv, index) => (
                    <div key={index} className="flex justify-between items-center text-sm font-bold py-2 border-b border-slate-900">
                      <div className="flex items-center gap-2">
                        <CornerDownRight size={14} className="text-blue-500 shrink-0" />
                        <span className="text-slate-200">{srv.name}</span>
                      </div>
                      <span className="text-slate-300">${srv.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Final Total Pricing breakdown */}
                <div className="space-y-2 border-t border-slate-900 pt-6">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>${(totalAmount * 0.9090).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>GST (10% included)</span>
                    <span>${(totalAmount * 0.091).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2">
                    <span>Total Bill</span>
                    <span className="text-blue-500">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment terms */}
                <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-slate-900 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Smile size={14} className="text-yellow-400" />
                    <span>Paid with <strong>{parsedData.paymentMethod}</strong></span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded uppercase font-bold tracking-wider">Fully Paid</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Bottom */}
        <section className="text-center space-y-6 py-12 border-t border-slate-800">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-xl mx-auto leading-none">
            Ready to scale up your repair bench?
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm font-medium">
            Join hundreds of repair enterprises globally. Fully integrated POS catalog, invoice, and tracking workspace.
          </p>
          <div>
            <button 
              onClick={onSignUp}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-950/50 transition-all hover:scale-105"
            >
              Get Started with RepairBill Free
            </button>
          </div>
        </section>
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-500 font-bold">
        <p>© 2026 RepairBill Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}
