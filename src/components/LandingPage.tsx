import React, { useState } from 'react';
import { 
  Smartphone, 
  ChevronRight, 
  Check, 
  Shield, 
  Zap, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  Smartphone as PhoneIcon,
  Users,
  Clock,
  Layout,
  MessageSquare,
  LineChart
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AIAgentLandingView } from './AIAgentLandingView';

export function LandingPage() {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landingSection, setLandingSection] = useState<'main' | 'ai-agent'>('main');
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your name');
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Sparkles className="text-blue-600" />,
      title: "AI Repair Assistant",
      description: "Auto-extract repair details from notes or images. Our AI agent drafts professional invoices, predicts repair times, and assists technicians in real-time."
    },
    {
      icon: <Layout className="text-purple-600" />,
      title: "Custom Service Catalog",
      description: "Manage a deep hierarchy of Brands, Models, and Series. Pre-set pricing for common repairs like screen swaps and battery replacements."
    },
    {
      icon: <Users className="text-emerald-600" />,
      title: "Staff & Permissions",
      description: "Manage your entire team across multiple benches. Assign roles, track productivity, and secure sensitive financial data with ease."
    },
    {
      icon: <BarChart3 className="text-amber-600" />,
      title: "BAS & GST Engine",
      description: "Precision-engineered for Australian shops. Generate GST reports and BAS summaries for your accountant in one click."
    },
    {
      icon: <MessageSquare className="text-rose-600" />,
      title: "Universal Web Sync",
      description: "Connect your existing website directly to your inbox. Receive leads, quote requests, and customer inquiries instantly."
    },
    {
      icon: <LineChart className="text-indigo-600" />,
      title: "Financial Analytics",
      description: "Deep dive into profit margins, expense trends, and top-performing repair services with integrated monthly and quarterly reports."
    }
  ];

  if (landingSection === 'ai-agent') {
    return (
      <AIAgentLandingView 
        onBack={() => setLandingSection('main')}
        onSignUp={() => { setIsLogin(false); setShowAuthModal(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Smartphone className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">RepairBill</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Features</a>
            <a href="#comparison" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors tracking-tight">Software Comparison</a>
            <a href="#blog" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Insights</a>
            <a href="#about" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2"
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-black tracking-tight shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 md:pt-56 md:pb-40 relative px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <Zap size={14} className="fill-current" />
              The #1 Choice for Repair Shops
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
              Mobile Repair shop <span className="text-blue-600">POS.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
              The ultimate <strong>cell phone repair shop management software</strong>. From small kiosks to multi-store empires, RepairBill brings AI-powered invoicing and smart ticketing to every tech bench.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-black tracking-tight shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
              >
                Create Your Shop
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white border-2 border-slate-100 text-slate-600 px-10 py-5 rounded-2xl text-lg font-black tracking-tight hover:bg-slate-50 transition-all">
                Book a Demo
              </button>
            </div>
            
            <div className="flex items-center gap-8 pt-6 border-t border-slate-100">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-slate-50 rounded-lg">
                   <PhoneIcon size={16} className="text-slate-400" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile Ready</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-slate-50 rounded-lg">
                   <Layout size={16} className="text-slate-400" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Desktop Optimized</span>
               </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                 ))}
               </div>
               <p className="text-sm font-bold tracking-tight">Joined by 500+ local repairers worldwide</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-blue-600/5 rounded-[48px] blur-3xl" />
            <div className="relative bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(37,99,235,0.15)] border border-slate-100 overflow-hidden aspect-[4/3] group">
              <img 
                src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=2574&auto=format&fit=crop" 
                alt="RepairBill Dashboard Preview" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
            </div>
            {/* Floating Widget 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 hidden md:block"
            >
               <div className="flex items-center gap-3 mb-4 text-emerald-600">
                 <Check className="p-1 bg-emerald-100 rounded-lg" size={24} />
                 <span className="text-xs font-black uppercase tracking-widest text-slate-800">Job Completed</span>
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-black text-slate-800">iPhone 15 Pro Max</p>
                 <p className="text-[10px] font-bold text-slate-400">Invoice #INV-9283 Paid</p>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-slate-50 border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
           {[
             { label: "Devices Repaired", val: "1.2M+" },
             { label: "Active Shops", val: "500+" },
             { label: "AI Jobs Processed", val: "50k+" },
             { label: "Customer Rating", val: "4.9/5" }
           ].map((stat, i) => (
             <div key={i} className="text-center md:text-left">
               <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
             </div>
           ))}
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95] mb-6">
              Everything you need to <span className="text-blue-600">scale.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              We've talked to hundreds of repair tech owners to build the most intuitive shop management software on the planet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                onClick={() => {
                  if (f.title === "AI Repair Assistant") {
                    setLandingSection('ai-agent');
                  }
                }}
                className={cn(
                  "p-8 bg-slate-50 rounded-[32px] border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-100/50",
                  f.title === "AI Repair Assistant" && "cursor-pointer hover:border-blue-500/30 group"
                )}
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight">
                  {f.title}
                  {f.title === "AI Repair Assistant" && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono inline-block align-middle">Live Demo</span>
                  )}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-slate-900 text-white rounded-[48px] m-4 md:m-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 blur-[120px] opacity-20 -mr-48 -mt-48" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-none">The best phone repair <span className="text-blue-400">POS.</span></h2>
            <p className="text-slate-400 font-medium">Simple, shop-first pricing. No hidden fees or onboarding costs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
             {/* Starter */}
             <div className="bg-slate-800/50 backdrop-blur-md p-10 rounded-[40px] border border-slate-700/50 space-y-8">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Solo Pro</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">$29</span>
                    <span className="text-slate-400 text-sm">/mo</span>
                 </div>
               </div>
               <ul className="space-y-4">
                 {["100 Invoices/mo", "Basic Inventory", "Digital Warranties", "Email Support"].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <Check size={16} className="text-blue-400" /> {item}
                   </li>
                 ))}
               </ul>
               <button className="w-full py-4 rounded-2xl bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-600 transition-colors">Select Plan</button>
             </div>

             {/* Pro */}
             <div className="bg-blue-600 p-10 rounded-[40px] shadow-2xl shadow-blue-900/50 space-y-8 relative overflow-hidden transform lg:scale-110">
               <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">Popular</div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-4">Shop Master</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">$59</span>
                    <span className="text-blue-100 text-sm">/mo</span>
                 </div>
               </div>
               <ul className="space-y-4">
                 {["Unlimited Invoices", "AI Repair Agent", "Full Inventory Stack", "BAS & Tax Summaries", "SMS Notifications", "Priority Support"].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                     <Check size={16} /> {item}
                   </li>
                 ))}
               </ul>
               <button 
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                className="w-full py-4 rounded-2xl bg-white text-blue-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-colors shadow-xl"
               >
                 Start 14-Day Free Trial
               </button>
             </div>

             {/* Enterprise */}
             <div className="bg-slate-800/50 backdrop-blur-md p-10 rounded-[40px] border border-slate-700/50 space-y-8">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Multi-Store</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">$99</span>
                    <span className="text-slate-400 text-sm">/mo</span>
                 </div>
               </div>
               <ul className="space-y-4">
                 {["Multiple Locations", "Staff Permissions", "Advanced Analytics", "Dedicated Account Manager"].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <Check size={16} className="text-slate-400" /> {item}
                   </li>
                 ))}
               </ul>
               <button className="w-full py-4 rounded-2xl bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-600 transition-colors">Select Plan</button>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ or CTA */}
      <section className="py-40 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85]">Ready to transform your <span className="text-blue-600 underline underline-offset-8">business?</span></h2>
          <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
            Join 500+ shops already providing professional repair experiences with RepairBill. No setup fee. No credit card required to start.
          </p>
          <div className="pt-8">
             <button 
              onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
              className="bg-blue-600 text-white px-12 py-6 rounded-3xl text-xl font-black tracking-tight shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
             >
               Get Started for Free
             </button>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95] mb-6">
              The Modern <span className="text-blue-600">Alternative.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Why settle for legacy repair shop software? See how RepairBill stacks up against competitors like RepairDesk and RepairQ.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-100/50">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-slate-400">Feature</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-blue-600 bg-blue-50/50">RepairBill</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-slate-400">Legacy POS (eg. RepairDesk)</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-600">
                <tr className="border-b border-slate-50">
                  <td className="p-8">AI Automated Invoicing</td>
                  <td className="p-8 text-blue-600"><Check size={20} /></td>
                  <td className="p-8 text-slate-300">Manual Entry Only</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-8">Setup Time</td>
                  <td className="p-8 text-blue-600 tracking-tight">Under 5 Minutes</td>
                  <td className="p-8 text-slate-300">Hours of Training</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-8">Modern Interface</td>
                  <td className="p-8 text-blue-600">Liquid Visuals</td>
                  <td className="p-8 text-slate-300">Outdated 2010 Design</td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-8">Native Mobile Experience</td>
                  <td className="p-8 text-blue-600"><Check size={20} /></td>
                  <td className="p-8 text-slate-300">Clunky WebView</td>
                </tr>
                <tr>
                  <td className="p-8">Pricing Strategy</td>
                  <td className="p-8 text-blue-600">Flat Monthly Fee</td>
                  <td className="p-8 text-slate-300">Complex Tiers + Fee%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Blog/Insights Section */}
      <section id="blog" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95] mb-6">
                Repair Shop <span className="text-blue-600">Insights.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Master the art of the bench. Expert tips on scaling your <strong>electronic repair shop</strong>.
              </p>
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] bg-white px-8 py-4 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all">
              View All Articles <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "How to choose the best Cell Phone Repair POS in 2026",
                category: "Operations",
                image: "https://images.unsplash.com/photo-1601524909162-adc8723d5c88?q=80&w=2670&auto=format&fit=crop",
                tag: "Must Read"
              },
              {
                title: "Top 5 Inventory Management tips for Phone Shops",
                category: "Inventory",
                image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2574&auto=format&fit=crop",
                tag: "New"
              },
              {
                title: "Why legacy software like RepairDesk is slowing your bench",
                category: "Tech Strategy",
                image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop",
                tag: "Opinion"
              }
            ].map((post, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[16/10] bg-slate-200 rounded-[32px] mb-6 overflow-hidden relative">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-900 border border-white">
                    {post.category}
                  </div>
                </div>
                <div className="px-2 space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{post.tag}</p>
                   <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                     {post.title}
                   </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">Frequently Asked <span className="text-blue-600">Questions.</span></h2>
             <p className="text-slate-500 font-medium">Everything you need to know about the best <strong>phone repair POS</strong> alternative.</p>
          </div>
          
          <div className="space-y-4">
             {[
               { q: "Is RepairBill better than RepairDesk?", a: "While RepairDesk is a legacy player, RepairBill is built on modern architecture with native AI automation. We focus on speed, ease of use, and liquid-fast invoicing that technicians actually enjoy using." },
               { q: "Does this software handle mobile phone inventory?", a: "Yes, our 'Inventory Master' is designed specifically for electronic repair parts like screens, batteries, and small components with intelligent restocking alerts." },
               { q: "Can I migrate my data from RepairQ?", a: "Absolutely. We offer a 1-click CSV importer that brings over your customers, inventory, and historical invoices in seconds." },
               { q: "Is there a contract or hidden fee?", a: "No. We believe in our product, which is why we offer flat-rate monthly pricing with no long-term contracts. Cancel anytime." }
             ].map((item, i) => (
               <div key={i} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 mb-4">{item.q}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.a}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <div className="aspect-square bg-slate-100 rounded-[40px] overflow-hidden relative group">
               <img 
                src="https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=2574&auto=format&fit=crop" 
                alt="Repair Tech" 
                className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
                  <p className="text-white text-lg font-black tracking-tight mb-2">Master Bench Certified</p>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Industry Leading Precision</p>
               </div>
             </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95]">
              Built by technicians, <span className="text-blue-600">for technicians.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              RepairBill started in the back of a small repair kiosk. We knew that existing POS systems were too bloated, too slow, and lacked the specialized tools repair shops actually need.
            </p>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Our mission is to empower local repair shops with the same level of technology that massive tech giants use. From AI parts-detection to automated customer follow-ups, we're here to help you clear your bench faster.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
               <div>
                  <p className="text-2xl font-black text-slate-900">2023</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Founded</p>
               </div>
               <div>
                  <p className="text-2xl font-black text-slate-900">24/7</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Support</p>
               </div>
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] hover:gap-4 transition-all">
              Learn more about our mission <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="text-white" size={16} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-800">RepairBill</span>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-loose">
              Professional management for the modern repair industry. Built with ⚡️ in Newcastle.
            </p>
          </div>
          
          {[
            { title: "Product", links: ["Features", "Pricing", "Integrations", "AI Agent"] },
            { title: "Solution", links: ["Phone Repair", "Laptop Repair", "Managed Services", "Logistics"] },
            { title: "Company", links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"] }
          ].map((col, i) => (
            <div key={i} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (link === "AI Agent") {
                          setLandingSection('ai-agent');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else if (link === "Features") {
                          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "Pricing") {
                          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "Integrations") {
                          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "Phone Repair" || link === "Laptop Repair" || link === "Managed Services" || link === "Logistics") {
                          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "About Us") {
                          document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "Contact") {
                          document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (link === "Privacy Policy") {
                          setActivePolicy('privacy');
                        } else if (link === "Terms of Service") {
                          setActivePolicy('terms');
                        }
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-200 gap-4">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">© 2026 RepairBill Shop. All rights reserved.</p>
           <div className="flex items-center gap-6">
             {/* Social Links placeholder */}
             <div className="w-8 h-8 bg-white border border-slate-200 rounded-full" />
             <div className="w-8 h-8 bg-white border border-slate-200 rounded-full" />
             <div className="w-8 h-8 bg-white border border-slate-200 rounded-full" />
           </div>
        </div>
      </footer>

      {/* Policy Modal Overlay */}
      {activePolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setActivePolicy(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
          >
            <button 
              onClick={() => setActivePolicy(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Smartphone className="rotate-45" size={24} />
            </button>

            <div className="mb-6 space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                 <Shield size={24} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {activePolicy === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last updated: May 2026</p>
            </div>

            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4 text-sm text-slate-500 font-medium leading-relaxed">
              {activePolicy === 'privacy' ? (
                <>
                  <p>
                    At <strong>RepairBill</strong>, accessible from <strong>test.repairbill.shop</strong> and our service domains, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by RepairBill and how we use it.
                  </p>
                  <h4 className="font-extrabold text-slate-800">1. Information We Collect</h4>
                  <p>
                    We collect technician notes, device details (brand, series, model), invoice totals, customer names, contact phone numbers, and email addresses. This data is utilized solely to compile professional invoice records and manage catalog pricing securely.
                  </p>
                  <h4 className="font-extrabold text-slate-800">2. Secure Hosting & Storage</h4>
                  <p>
                    Our application and its supporting Firestore backend are engineered with state-of-the-art security patterns. No sensitive API credentials or customer information is ever shared with unrequested external networks.
                  </p>
                  <h4 className="font-extrabold text-slate-800">3. Cookies and Diagnostics</h4>
                  <p>
                    We utilize client-side localStorage to securely preserve preferred settings (such as catalog currency defaults and current active series selectors) locally on your device for unmatched speed.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Welcome to <strong>RepairBill</strong>! These terms and conditions outline the rules and regulations for the use of our repair-shop management software platform.
                  </p>
                  <h4 className="font-extrabold text-slate-800">1. Software Utilization Licence</h4>
                  <p>
                    By activating our technician workstation, you agree to utilize our invoice and service catalog interfaces solely for lawful business operations. Any reverse engineering of the AI extraction layers or systemic API abuse is strictly prohibited.
                  </p>
                  <h4 className="font-extrabold text-slate-800">2. Accuracy of Estimations</h4>
                  <p>
                    Prices and diagnostic suggestions generated by the <strong>AI Repair Assistant</strong> are intended as drafts and guidance on the bench. Technicians must exercise ultimate professional judgment before confirming final customer pricing.
                  </p>
                  <h4 className="font-extrabold text-slate-800">3. Localized Warranties</h4>
                  <p>
                    Standard warranty terms specified inside the Invoice Settings panel (such as "3 months screen parts warranty") represent commitments solely between the respective repair entity and the customer. RepairBill does not assume responsibility for individual workshop technician craftsmanship or hardware failures.
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setActivePolicy(null)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
              >
                Close & Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAuthModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
          >
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Smartphone className="rotate-45" size={24} />
            </button>

            <div className="text-center mb-10 space-y-2">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
                 <Shield size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLogin ? 'Welcome Back' : 'Create Your Shop'}</h2>
              <p className="text-slate-400 text-sm font-medium">Enter your details to securely access your studio.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
                <Shield size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    placeholder="Your Name"
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <>
                    {isLogin ? 'Access Dashboard' : 'Get Started'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-slate-400">or</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={async () => {
                  try {
                    setIsSubmitting(true);
                    await signIn();
                  } catch (err: any) {
                    setError(err.message || 'Google authentication failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm font-bold text-slate-400">
                {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
                >
                  {isLogin ? 'Create one now' : 'Log in here'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
