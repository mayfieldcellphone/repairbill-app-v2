import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Trash2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Send,
  Sparkles,
  Info,
  X,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, InvoiceSettings } from '../lib/types';
import { cn } from '@/lib/utils';

interface AIPanelLeadsFeedProps {
  leads: Lead[];
  settings: InvoiceSettings;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertToQuote: (lead: Lead) => void;
}

export function AIPanelLeadsFeed({
  leads,
  settings,
  onUpdateLead,
  onDeleteLead,
  onConvertToQuote
}: AIPanelLeadsFeedProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rb_lead_sound_alert');
    return saved !== null ? saved === 'true' : true;
  });
  const [filterType, setFilterType] = useState<'all' | 'booking' | 'quote'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [knownLeadIds, setKnownLeadIds] = useState<Set<string>>(new Set());
  const [newLeadNotification, setNewLeadNotification] = useState<Lead | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const theme = settings?.appTheme || 'modern';

  // Audio synthesizer for notification chime
  const playChimeSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // Pleasant double-chime high bell tones
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5 note
      gain1.gain.setValueAtTime(0.06, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12); // B5 note
      gain2.gain.setValueAtTime(0.06, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (err) {
      console.warn("Chime synthesiser audio failed to trigger:", err);
    }
  };

  // Sound toggling persistence
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('rb_lead_sound_alert', String(nextVal));
    if (nextVal) {
      setTimeout(playChimeSound, 100);
    }
  };

  // Observe and detect real-time incoming leads (quotes, bookings)
  useEffect(() => {
    if (!leads) return;
    
    const currentIds = new Set(leads.map(l => l.id));

    // Initialize baseline on component mount
    if (knownLeadIds.size === 0 && leads.length > 0) {
      setKnownLeadIds(currentIds);
      return;
    }

    // Identify new arrivals
    const newArrivals = leads.filter(l => !knownLeadIds.has(l.id));
    if (newArrivals.length > 0) {
      // Focus specifically on 'booking' or 'quote'
      const activeArrivals = newArrivals.filter(l => l.type === 'booking' || l.type === 'quote');
      
      if (activeArrivals.length > 0) {
        const latestIncoming = activeArrivals[activeArrivals.length - 1];
        
        // Trigger sound warning
        playChimeSound();
        
        // Push notification popup
        setNewLeadNotification(latestIncoming);
        
        // Auto dispose splash after 6s
        const timer = setTimeout(() => {
          setNewLeadNotification(null);
        }, 6500);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Refresh memory of IDs
    if (leads.length !== knownLeadIds.size || Array.from(leads).some(l => !knownLeadIds.has(l.id))) {
      setKnownLeadIds(currentIds);
    }
  }, [leads, soundEnabled]);

  // Handle inline quick Reply submission
  const handleSendReply = async (leadId: string) => {
    if (!replyText.trim()) return;
    try {
      await onUpdateLead(leadId, { 
        status: 'replied',
        message: `${leads.find(l => l.id === leadId)?.message}\n\n[Shop Reply]: ${replyText}`
      });
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  // Helper formatting relative times nicely
  const getRelativeTimeString = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return past.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filter & Search computation
  const filteredLeads = leads
    ?.filter(lead => {
      if (filterType === 'booking' && lead.type !== 'booking') return false;
      if (filterType === 'quote' && lead.type !== 'quote') return false;
      
      // Match type bookings & quotes only (the core requests)
      if (lead.type !== 'booking' && lead.type !== 'quote') return false;
      
      if (searchQuery.trim()) {
        const text = `${lead.customerName} ${lead.customerPhone || ''} ${lead.customerEmail} ${lead.message}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-180px)] sm:h-[600px] rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border",
      theme === 'cyber' ? "bg-slate-950 border-slate-800 text-slate-100 shadow-cyan-950/20" :
      theme === 'minimalist' ? "bg-[#fdfcfa] border-zinc-900 rounded-none shadow-none text-zinc-900" :
      "bg-white border-slate-100 text-slate-800"
    )}>
      
      {/* Header Panel */}
      <div className={cn(
        "p-4 sm:p-5 flex justify-between items-center border-b shrink-0",
        theme === 'cyber' ? "bg-slate-900/60 border-slate-800" :
        theme === 'minimalist' ? "bg-zinc-100/50 border-zinc-900" :
        "bg-slate-50/80 border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute flex h-2 w-2 top-0 right-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              theme === 'cyber' ? "bg-cyan-900/40 text-cyan-400" :
              theme === 'minimalist' ? "bg-zinc-950 text-white" :
              "bg-blue-50 text-blue-600"
            )}>
              <Bell size={16} className="animate-bounce" />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest leading-none mb-1">Live Notifications</h4>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Customer bookings & quotes</p>
          </div>
        </div>

        {/* Audio Mute Switch Component */}
        <button
          onClick={handleToggleSound}
          className={cn(
            "p-2 rounded-xl transition-all border flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider",
            soundEnabled 
              ? (theme === 'cyber' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                 theme === 'minimalist' ? "bg-zinc-950 text-white rounded-none border-zinc-900" :
                 "bg-emerald-50 border-emerald-100 text-emerald-700")
              : (theme === 'cyber' ? "bg-slate-900 border-slate-800 text-slate-500" :
                 theme === 'minimalist' ? "bg-zinc-100 text-zinc-400 rounded-none border-zinc-200" :
                 "bg-slate-100 border-slate-200 text-slate-400")
          )}
          title={soundEnabled ? "Mute alert chimes" : "Enable alert chimes"}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={12} className="shrink-0" />
              <span>Sound On</span>
            </>
          ) : (
            <>
              <VolumeX size={12} className="shrink-0" />
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Mini Active Arrival Notification Banner overlay */}
      <AnimatePresence>
        {newLeadNotification && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className={cn(
              "p-4 flex items-start gap-3 border-b border-dashed",
              theme === 'cyber' ? "bg-cyan-950/40 border-cyan-800/50" :
              theme === 'minimalist' ? "bg-zinc-200 border-zinc-900" :
              "bg-emerald-50 border-emerald-100"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                newLeadNotification.type === 'booking' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
              )}>
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1",
                    newLeadNotification.type === 'booking' ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                  )}>
                    New {newLeadNotification.type}!
                  </span>
                  <button 
                    onClick={() => setNewLeadNotification(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                </div>
                <h5 className="font-bold text-xs truncate text-slate-900">{newLeadNotification.customerName}</h5>
                <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed mt-0.5">{newLeadNotification.message}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      onConvertToQuote(newLeadNotification);
                      setNewLeadNotification(null);
                    }}
                    className="bg-zinc-900 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition-all uppercase tracking-wider"
                  >
                    Draft Quote
                  </button>
                  <button
                    onClick={() => {
                      onUpdateLead(newLeadNotification.id, { status: 'read' });
                      setNewLeadNotification(null);
                    }}
                    className="border border-slate-300 text-slate-700 text-[9px] font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-all uppercase"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar controls */}
      <div className={cn(
        "p-3 space-y-2 border-b shrink-0",
        theme === 'cyber' ? "bg-slate-950 border-slate-800" :
        theme === 'minimalist' ? "bg-zinc-50 border-zinc-200" :
        "bg-slate-50/50 border-slate-100"
      )}>
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings/quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full text-[11px] font-medium pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 transition-all",
              theme === 'cyber' ? "bg-slate-900 text-white border-slate-800 focus:ring-cyan-500 rounded-xl" :
              theme === 'minimalist' ? "bg-white border-zinc-900 text-zinc-900 rounded-none focus:ring-zinc-900" :
              "bg-white border-slate-200 text-slate-800 focus:ring-blue-500 rounded-xl"
            )}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-1">
          {(['all', 'booking', 'quote'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "py-1 text-[9px] font-black uppercase tracking-widest text-center transition-all border",
                filterType === type 
                  ? (theme === 'cyber' ? "bg-cyan-500 text-slate-950 border-cyan-500" :
                     theme === 'minimalist' ? "bg-zinc-950 text-white border-zinc-950 rounded-none" :
                     "bg-blue-600 text-white border-blue-600 rounded-lg shadow-sm font-semibold")
                  : (theme === 'cyber' ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white" :
                     theme === 'minimalist' ? "bg-white text-zinc-600 border-zinc-200 rounded-none" :
                     "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 rounded-lg")
              )}
            >
              {type === 'all' ? 'All (Quotes/Bookings)' : type + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Feed Body list */}
      <div className={cn(
        "flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar",
        theme === 'cyber' ? "bg-slate-950" :
        theme === 'minimalist' ? "bg-[#fdfcfa]" :
        "bg-slate-50/20"
      )}>
        <AnimatePresence initial={false}>
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <Clock size={28} className="opacity-40 animate-pulse text-slate-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">No active requests</p>
                <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto">Waiting for new quotes or bookings to arrive from repair inquiries.</p>
              </div>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isReplying = replyingToId === lead.id;
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-3 border-2 rounded-2xl flex flex-col gap-2.5 transition-shadow relative overflow-hidden",
                    lead.status === 'new' 
                      ? (theme === 'cyber' ? "bg-slate-900/40 border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]" :
                         theme === 'minimalist' ? "bg-white border-zinc-900 rounded-none hover:shadow-sm" :
                         "bg-white border-blue-100 hover:shadow-md hover:border-blue-200")
                      : (theme === 'cyber' ? "bg-slate-900/10 border-slate-800 text-slate-400" :
                         theme === 'minimalist' ? "bg-zinc-50 border-zinc-200 rounded-none text-zinc-500" :
                         "bg-white border-slate-200 hover:border-slate-300 text-slate-600")
                  )}
                >
                  {/* Status marker node */}
                  {lead.status === 'new' && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  )}

                  {/* Top info and Type labels */}
                  <div className="flex justify-between items-start min-w-0 pr-4">
                    <div className="min-w-0">
                      <h5 className={cn(
                        "font-black text-xs truncate leading-tight",
                        theme === 'cyber' ? "text-slate-100" : "text-slate-800"
                      )}>
                        {lead.customerName}
                      </h5>
                      <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold mt-1 uppercase">
                        <Clock size={10} />
                        {getRelativeTimeString(lead.createdAt)}
                      </span>
                    </div>

                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                      lead.type === 'booking' 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    )}>
                      {lead.type}
                    </span>
                  </div>

                  {/* Client issue msg */}
                  <p className={cn(
                    "text-[11px] leading-relaxed whitespace-pre-wrap font-medium break-words",
                    theme === 'cyber' ? "text-slate-300" : "text-slate-600"
                  )}>
                    {lead.message}
                  </p>

                  {/* Client metadata credentials (Phone, Email, etc) if any */}
                  {(lead.customerPhone || lead.customerEmail) && (
                    <div className={cn(
                      "p-2 rounded-xl text-[9px] flex flex-col gap-0.5 font-mono",
                      theme === 'cyber' ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-500"
                    )}>
                      {lead.customerPhone && (
                        <div>Phone: <span className="font-bold text-slate-700">{lead.customerPhone}</span></div>
                      )}
                      {lead.customerEmail && (
                        <div>Email: <span className="font-bold text-slate-700 select-all">{lead.customerEmail}</span></div>
                      )}
                    </div>
                  )}

                  {/* Card quick CTA button bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100/80">
                    <button
                      onClick={() => onConvertToQuote(lead)}
                      className={cn(
                        "flex-1 py-1 px-2.5 text-[9px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1 border",
                        theme === 'cyber' ? "bg-cyan-500 text-slate-950 border-cyan-500 hover:bg-cyan-400" :
                        theme === 'minimalist' ? "bg-zinc-950 text-white rounded-none hover:bg-zinc-800 border-zinc-900" :
                        "bg-blue-600 hover:bg-blue-700 text-white border-blue-500 rounded-lg shadow-sm"
                      )}
                      title="Convert this booking or request to an estimate quote instantly"
                    >
                      <FileText size={10} />
                      <span>Convert</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isReplying) {
                          setReplyingToId(null);
                        } else {
                          setReplyingToId(lead.id);
                          setReplyText('');
                        }
                      }}
                      className={cn(
                        "py-1 px-2.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded-lg border",
                        isReplying
                          ? "bg-slate-200 border-slate-300 text-slate-800"
                          : (theme === 'cyber' ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700")
                      )}
                    >
                      <MessageSquare size={10} className="inline mr-1" />
                      Reply
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Remove lead request from ${lead.customerName}?`)) {
                          await onDeleteLead(lead.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                      title="Archive/Delete Lead"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Expandable Quick Inline reply form */}
                  {isReplying && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-2 pt-2 border-t border-dashed"
                    >
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write quick response..."
                        rows={2}
                        className={cn(
                          "w-full text-[11px] font-medium p-2 focus:outline-none focus:ring-1 transition-all rounded-lg",
                          theme === 'cyber' ? "bg-slate-950 border-slate-800 text-slate-100 focus:ring-cyan-500" :
                          theme === 'minimalist' ? "bg-white border-zinc-900 text-zinc-900 rounded-none" :
                          "bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500"
                        )}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-2 py-1 text-[9px] font-bold uppercase hover:bg-slate-100 text-slate-500 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(lead.id)}
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white transition-all rounded-lg flex items-center gap-1",
                            theme === 'minimalist' ? "bg-zinc-950 hover:bg-zinc-900 rounded-none" : "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          <Send size={8} />
                          <span>Send</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer System Status details */}
      <div className={cn(
        "p-3 text-[9px] text-center font-bold tracking-widest uppercase border-t shrink-0 flex items-center justify-center gap-1",
        theme === 'cyber' ? "bg-slate-900 border-slate-800 text-cyan-600" :
        theme === 'minimalist' ? "bg-zinc-100 border-zinc-900 text-zinc-400" :
        "bg-slate-50/50 border-slate-100 text-slate-400"
      )}>
        <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
        <span>Connected to Mayfield Lab Incoming Stream</span>
      </div>

    </div>
  );
}
