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
  LineChart,
  X,
  Calendar,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AIAgentLandingView } from './AIAgentLandingView';

function parseMarkdownLinks(text: string) {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline font-bold"
      >
        {match[1]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

const allBlogPosts = [
  {
    title: "How to choose the best Cell Phone Repair POS in 2026",
    category: "Operations",
    image: "https://images.unsplash.com/photo-1601524909162-adc8723d5c88?q=80&w=2670&auto=format&fit=crop",
    tag: "Must Read",
    date: "May 15, 2026",
    readTime: "5 min read",
    author: "Devin Mayfield",
    summary: "Standard registers don't cut it anymore on modern benches. Learn how cloud native flow, real-time ticket statuses, and instant parts synchronization can transform your repair operations this year.",
    content: [
      {
        section: "The Demise of Clunky POS Systems",
        text: "In 2026, choosing a point-of-sale system is no longer just about registering card payments and printing paper receipts. For busy electronic repair workshops, the POS acts as the heart of the entire shop—coordinating incoming tickets, technician assignments, inventory supply, and communication with clients. Live-tested and optimized in real-time at Newcastle's premier flagship workshop, [Mayfield Phone Repair](https://mayfieldphonerepair.com.au), we discovered that standard registers fall short of contemporary needs."
      },
      {
        section: "Key Feature #1: Seamless Intake with Device Intake Diagnostics",
        text: "A bottleneck at the front counter is a bottleneck for your profit margins. Your POS must enable rapid intake: recording physical imperfections (scratches, dents), pre-repair function checkmarks (cameras, FaceID, port charging), and snapping instant high-res bench photographs."
      },
      {
        section: "Key Feature #2: Intelligent Parts-To-Ticket Pairing",
        text: "Avoid the nightmare of matching wrong replacement screens. A modern solution synchronizes your physical inventory catalogs with your active service tickets, ensuring the parts are instantly reserved for the technician on the bench."
      },
      {
        section: "Key Feature #3: Native AI-Powered Workflow",
        text: "Manual data input is slow and prone to errors. AI-driven repair logs analyze conversational bench notes (e.g., 'cracked front glass, customer needs new battery too and express express delivery') and automatically translate them into itemized charges, saving hours of office admin."
      },
      {
        section: "Local Compliance Matters: BAS and GST Sync",
        text: "For operators based in Australia, accounting rules are highly specific. An ideal POS system shouldn't require third-party workarounds; it should directly track GST outlays per purchase, calculate appropriate taxable lines, and compile ready-to-use Business Activity Statements (BAS) summaries."
      }
    ]
  },
  {
    title: "Top 5 Inventory Management tips for Phone Shops",
    category: "Inventory",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2574&auto=format&fit=crop",
    tag: "New",
    date: "May 28, 2026",
    readTime: "4 min read",
    author: "Devin Mayfield",
    summary: "Excess part inventory stalls cash flow, while missing simple batteries loses deals. Optimize replacement component levels, track bin zones, and prevent dead capital using these five tips.",
    content: [
      {
        section: "Why Inventory is Your Biggest Profit Leak",
        text: "Cell phone replacement parts are highly granular and rapidly depreciate. A screen that costs $150 wholesale can dwindle in value to $40 as newer device generations release. Working with high-volume stores like [Mayfield Phone Repair](https://mayfieldphonerepair.com.au) highlights that efficient, lean stock tracking is crucial to keeping your shop in the green."
      },
      {
        section: "1. Group Small Consumables into Standard 'Kits'",
        text: "Stop scanning individual adhesive stickers, screen frames, or FPC connectors. Batch common components into unified replacement kits, ensuring small margins aren't lost to untracked miscellaneous parts."
      },
      {
        section: "2. Track High-Value Screen and Logic Assemblies by Serial",
        text: "Verify supplier warranty claims with precision. By assigning serial numbers to expensive screens or batteries, you can easily trace which vendor provided a defective unit and file hassle-free RMA claims."
      },
      {
        section: "3. Establish Automated Stock Reorder Triggers",
        text: "Do not wait until you run completely dry. Define logical safe stock limits (e.g. minimum 3 pieces of iPhone 13 replacement screens) so notifications trigger automatically when inventory thresholds are breached."
      },
      {
        section: "4. Standardize Alphanumeric Storage Locations",
        text: "Time spent hunting around the shop is time lost. Assign visual bins and catalog codes (e.g. Rack B, Row 4, Bin 1 for charging ports) so any apprentice tech can locate stock in seconds."
      },
      {
        section: "5. Run High-Speed Monthly Audits on Legacy Parts",
        text: "Quickly clear out unsold glass, batteries, and covers for outdated models (e.g., older model iPads or iPhone 8/X) before they turn into complete dead capital. Liquidate them or swap them for higher volume replacements."
      }
    ]
  },
  {
    title: "Why legacy software like RepairDesk is slowing your bench",
    category: "Tech Strategy",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop",
    tag: "Opinion",
    date: "May 10, 2026",
    readTime: "6 min read",
    author: "Devin Mayfield",
    summary: "Outdated software built on slow infrastructure frustrates technicians and delays customer checkouts. Learn why cloud native architecture and single screen workflow are replacing legacy bloat.",
    content: [
      {
        section: "The Real Cost of Stale Software",
        text: "Many local mobile repair operators keep utilizing old platforms like RepairDesk out of pure fatigue. But legacy interfaces require constant page refreshes, struggle with laggy mobile responsive formats, and lack the clean focus requested by active bench technicians."
      },
      {
        section: "Frustration #1: Endless Page Refreshes and Loading States",
        text: "In busy workshops, pace is key. Legacy POS systems were designed over a decade ago. Changing a simple ticket from 'In Queue' to 'Under Repair' requires reloading database schemas, opening secondary submenus, and clicking 'Confirm'."
      },
      {
        section: "Frustration #2: Confusing Multi-Tab Navigation",
        text: "A technician shouldn't require a college degree to operate a POS screen. Having to toggle three distinct tabs to find standard device specs, client approval notices, or internal workshop notes dilutes bench concentration."
      },
      {
        section: "Frustration #3: The Abrupt Lack of Modern AI Support",
        text: "Entering exact descriptions, repair labor billing, and tracking detailed faults manually is tedious. Modern cloud-native tools allow technicians to type simple notes, immediately auto-generating clean invoice descriptions and pricing."
      },
      {
        section: "Modern Solution: Liquid Fast, Single Screen Workspace",
        text: "Transitioning to a dynamic, single-screen desktop layout designed specifically around technician behavior ensures items are checked out in under 30 seconds. On-site audits at active workbenches like [Mayfield Phone Repair](https://mayfieldphonerepair.com.au) prove that eliminating page refreshes elevates daily ticket clearance speed by up to 40%."
      }
    ]
  },
  {
    title: "Dynamic wholesale parts sourcing: Maximizing shop margin",
    category: "Supply Chain",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2670&auto=format&fit=crop",
    tag: "Pro-Tip",
    date: "April 29, 2026",
    readTime: "5 min read",
    author: "Devin Mayfield",
    summary: "Relying on a single hardware vendor can constrain your margins by up to 20%. Let's explore how to spread vendor channels and optimize bulk parts acquisition securely.",
    content: [
      {
        section: "The Danger of Single-Vendor Dependency",
        text: "Many smartphone repair counters source 100% of their screens, ports, and batteries from a single distributor out of convenience. However, if that supplier faces stock shortages or raises premium rates, your shop's bottom line takes a direct hit. Leading workshops, including [Mayfield Phone Repair](https://mayfieldphonerepair.com.au), diversify their vendor pipelines to remain resilient against pricing shifts."
      },
      {
        section: "Analyze Vendor Tiers for Core Models",
        text: "Always maintain relationships with at least three reputable distributors. Keep spreadsheets tracking who offers the best reliability scores for iPhone screen quality, wholesale pricing for ipad assemblies, and battery safety certifications."
      },
      {
        section: "Leverage Volume Commitments for Key Commodities",
        text: "For highly recurring repairs (such as battery swaps for common devices), bulk ordering 50+ units directly from wholesale import hubs earns substantial discounts of 15% to 30%, which flows directly into your net profit margin."
      },
      {
        section: "Assess Original vs. Premium Aftermarket Sourcing",
        text: "Educate your team on when standard quality is acceptable versus when a client expects premium high-brightness panels. This transparency builds long-term customer trust and sets your shop apart."
      }
    ]
  },
  {
    title: "Explaining TrueTone and screen serialization to customers",
    category: "Operations",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2680&auto=format&fit=crop",
    tag: "Guides",
    date: "April 14, 2026",
    readTime: "4 min read",
    author: "Devin Mayfield",
    summary: "With device manufacturers locking down hardware components, technicians must learn how to handle serialization errors and proactively educate customers about display messages.",
    content: [
      {
        section: "The Battle Over Screen Repair Serialization",
        text: "As smartphone developers increasingly implement part-pairing restrictions, swapping displays can prompt standard alerts (such as 'Important Display Message') even when using premium OEM spares. Explaining this gracefully to a client is a highly requested skill."
      },
      {
        section: "Why TrueTone and Serialization Are Used",
        text: "Manufacturers link displays and batteries directly to specific logic boards via internal micro-controllers. Removing a broken screen breaks this secure link. To restore full functionality like TrueTone, technicians must transfer original IC chips or utilize advanced screen programmers."
      },
      {
        section: "Create Pre-Emptive Transparency",
        text: "Never let a client notice an alert message post-repair by surprise. Inform them of manufacturer component matching and write explicit warranty parameters inside the digital invoice workspace to maintain credibility. Leading local businesses, like Newcastle's [Mayfield Phone Repair](https://mayfieldphonerepair.com.au), master this conversation right at the initial intake desk."
      },
      {
        section: "Crafting Professional Bench Counter Responses",
        text: "Implement a standardized explanation script: 'To achieve competitive pricing and rapid turn-around, we use premium non-serialized replacement displays. These are calibrated to match factory tolerances, though standard iOS diagnostics might flag the part.'"
      }
    ]
  },
  {
    title: "How AI auto-extraction is revolutionizing the workshop",
    category: "AI Technology",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    tag: "Future Tech",
    date: "April 02, 2026",
    readTime: "4 min read",
    author: "Devin Mayfield",
    summary: "Writing structured invoices and labor lines manually is a key bottleneck. Discover how AI transforms unstructured bench notes into accurate billing sheets instantly.",
    content: [
      {
        section: "The Friction of Manual Billing on the Bench",
        text: "When a technician is deep in a complex microsoldering rebuild, the last thing they want to do is open catalog templates, search for separate parts, and type tedious, formal line-item pricing. They often record brief thoughts like 'fixed charging IC, swapped battery'."
      },
      {
        section: "The AI Translation Engine",
        text: "Enterprise AI tools read conversational tech notes and seamlessly convert them into detailed customer invoices. For instance, 'iphone11 water damage fix dynamic PMIC + aftermarket battery + 30m testing' turns into beautifully itemized service entries categorized perfectly under parts and labor."
      },
      {
        section: "Improving Workshop Operations",
        text: "This integration saves roughly 12 minutes of administrative billing labor per repair ticket, allows instant generation of customer estimate quotes, and ensures part inventories stay perfectly synchronized automatically. Our primary pilot workshop partner, [Mayfield Phone Repair](https://mayfieldphonerepair.com.au), reported a massive reduction in check-out bottlenecks after deploying AI auto-drafts of bench invoices."
      }
    ]
  }
];

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
  const [selectedBlogPost, setSelectedBlogPost] = useState<any | null>(null);
  const [showAllBlogs, setShowAllBlogs] = useState(false);

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
      description: "Auto-extract repair details from raw notes or bench images. Our AI agent instantly drafts professional invoices, predicts repair times, and assists technicians in real-time."
    },
    {
      icon: <Layout className="text-purple-600" />,
      title: "Custom Service Catalog",
      description: "Manage a deep hierarchy of Brands, Series, and Models. Pre-set custom pricing for common repairs like screen swaps, battery replacements, and port fixes."
    },
    {
      icon: <Users className="text-emerald-600" />,
      title: "Staff & Permissions",
      description: "Manage your entire team across multiple workbenches. Assign distinct technician or admin roles, control access levels, and secure sensitive financial charts."
    },
    {
      icon: <BarChart3 className="text-amber-600" />,
      title: "BAS & GST Engine",
      description: "Precision-engineered accounting module for modern shops. Automatically calculate GST outlays, track expenses, and export BAS summaries for your accountant."
    },
    {
      icon: <MessageSquare className="text-rose-600" />,
      title: "Live Lead & Website Sync",
      description: "Synchronize live leads from your workshop website directly to your bench. Convert inquiries, bookings, or cold leads into repair quotes in a single click."
    },
    {
      icon: <LineChart className="text-indigo-600" />,
      title: "Dynamic Invoicing Core",
      description: "Draft digital invoices or print-ready layouts. Customize brand styling, default warranty terms, notes, and currency settings to match your local market."
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
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Smartphone className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">RepairBill</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors tracking-tight cursor-pointer"
            >
              Software Comparison
            </button>
            <button 
              onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Insights
            </button>
            <button 
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              About
            </button>
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
            <div className="inline-flex flex-wrap items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <Zap size={14} className="fill-current animate-pulse" />
              <span>Developed with</span>
              <a href="https://mayfieldphonerepair.com.au" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 font-extrabold text-blue-700 transition-all">Mayfield Phone Repair</a>
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
            <button 
              onClick={() => setShowAllBlogs(!showAllBlogs)}
              className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px] bg-white px-8 py-4 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all hover:bg-slate-50"
            >
              {showAllBlogs ? "Show Curated Articles" : "View All Articles"} <ArrowRight size={14} className={cn("transition-transform", showAllBlogs && "rotate-90")} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(showAllBlogs ? allBlogPosts : allBlogPosts.slice(0, 3)).map((post, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                onClick={() => setSelectedBlogPost(post)}
                className="group cursor-pointer bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[420px]"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-200 rounded-[32px] mb-6 overflow-hidden relative">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-900 border border-white">
                      {post.category}
                    </div>
                  </div>
                  <div className="px-2 space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{post.tag}</p>
                     <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                       {post.title}
                     </h3>
                     {post.summary && (
                       <p className="text-xs text-slate-400 font-medium line-clamp-3 mt-1 leading-relaxed">
                         {post.summary}
                       </p>
                     )}
                  </div>
                </div>
                <div className="px-2 pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <span>{post.readTime}</span>
                  <span className="text-blue-600 group-hover:underline flex items-center gap-1 font-black">
                    Read Article <ChevronRight size={12} />
                  </span>
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
              RepairBill was originally developed and rigorously field-tested in collaboration with the premium workshop team at <a href="https://mayfieldphonerepair.com.au" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Mayfield Phone Repair</a>. From active workbenches in Newcastle, we discovered that existing POS platforms were too slow, bloated, and disconnected from daily diagnostic reality.
            </p>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Designed as the flagship system for <a href="https://mayfieldphonerepair.com.au" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-600 hover:underline font-bold">Mayfield Phone Repair</a>, our core platform delivers the exact speed and AI capabilities required to handle high-volume device turnarounds, instant supplier inventory matching, and direct customer SMS notifications.
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
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
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
                    At <strong>RepairBill</strong>, accessible from <strong>repairbill.shop</strong> and our service domains, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by RepairBill and how we use it.
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

      {/* Blog/Insights Post Detail Modal Overlay */}
      {selectedBlogPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedBlogPost(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Top Close Button in Modal */}
            <button 
              onClick={() => setSelectedBlogPost(null)}
              className="absolute top-6 right-6 p-3 bg-white/80 hover:bg-white text-slate-800 hover:text-blue-600 transition-all rounded-full border border-slate-100 shadow-md backdrop-blur-sm z-30 flex items-center justify-center"
            >
              <X size={18} />
            </button>

            {/* Scrollable Hero + Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Image Header */}
              <div className="relative w-full h-[240px] md:h-[300px]">
                <img 
                  src={selectedBlogPost.image} 
                  alt={selectedBlogPost.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-6 left-8 md:left-10 right-8 md:right-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                      {selectedBlogPost.category}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">
                      {selectedBlogPost.tag}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {selectedBlogPost.title}
                  </h1>
                </div>
              </div>

              {/* Body Content */}
              <div className="px-8 md:px-10 py-8 space-y-6 select-text">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 border-b border-slate-100 pb-5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>By {selectedBlogPost.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{selectedBlogPost.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>{selectedBlogPost.readTime}</span>
                  </div>
                </div>

                {/* Main Summary */}
                <p className="text-base text-slate-600 font-semibold leading-relaxed border-l-4 border-blue-600 pl-4 bg-blue-50/40 py-3 rounded-r-2xl">
                  {parseMarkdownLinks(selectedBlogPost.summary)}
                </p>

                {/* Article blocks */}
                <div className="space-y-6 text-sm md:text-base text-slate-500 font-medium leading-relaxed">
                  {selectedBlogPost.content?.map((block: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                        {block.section}
                      </h3>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm">
                        {parseMarkdownLinks(block.text)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-3">
                  <h4 className="text-base font-black text-slate-900">Empower your bench with modern POS & AI.</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Ready to leave laggy, bloated software behind? Let RepairBill handle your invoices, parts, and customer SMS automatically.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button 
                      onClick={() => {
                        setSelectedBlogPost(null);
                        setIsLogin(false);
                        setShowAuthModal(true);
                      }}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-tight uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                    >
                      Get Started Free
                    </button>
                    <button 
                      onClick={() => setSelectedBlogPost(null)}
                      className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-tight uppercase hover:bg-slate-50 transition"
                    >
                      Keep Reading
                    </button>
                  </div>
                </div>
              </div>
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
