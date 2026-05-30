import { useState, useMemo } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Search, 
  Archive, 
  ExternalLink, 
  Trash2, 
  User, 
  Smartphone,
  ChevronRight,
  Send,
  MoreVertical,
  ArrowRight,
  FileText,
  ArrowUpRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, InvoiceSettings } from '../lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CommunicationCenterProps {
  leads: Lead[];
  settings: InvoiceSettings;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onAddLead: (lead: Lead) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertToQuote: (lead: Lead) => void;
}

export function CommunicationCenter({ 
  leads, 
  settings, 
  onUpdateLead, 
  onAddLead,
  onDeleteLead,
  onConvertToQuote
}: CommunicationCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'quote' | 'booking' | 'corporate' | 'voice_message'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'replied' | 'archived'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const theme = settings.appTheme;

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => {
        const matchesSearch = 
          l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || l.type === filterType;
        const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, searchTerm, filterType, filterStatus]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleLeadClick = async (lead: Lead) => {
    setSelectedLeadId(lead.id);
    if (lead.status === 'new') {
      await onUpdateLead(lead.id, { status: 'read' });
    }
  };

  const handleSyncLeads = async () => {
    if (!settings.charlaApiKey) {
      alert("Please configure your Charla API Key in Settings to sync live leads.");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('https://charla.com/api/v1/leads', {
        headers: {
          'Authorization': `Bearer ${settings.charlaApiKey}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leads from Charla');
      
      const data = await response.json();
      
      let newLeadsCount = 0;
      for (const item of data) {
        // Check if lead already exists to avoid duplicates
        if (!leads.find(l => l.id === item.id)) {
          const newLead: Lead = {
            id: item.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            customerName: item.name || 'Anonymous',
            customerEmail: item.email || 'no-email@charla.com',
            customerPhone: item.phone || '',
            message: item.message || '',
            type: item.metadata?.type || 'contact',
            status: 'new',
            createdAt: item.createdAt || new Date().toISOString(),
            metadata: {
              source: item.metadata?.source || 'charla.com',
              brand: item.metadata?.brand,
              model: item.metadata?.model,
              recordingDuration: item.metadata?.recordingDuration,
              companyName: item.metadata?.companyName
            }
          };
          await onAddLead(newLead);
          newLeadsCount++;
        }
      }
      
      alert(`Sync successful! Imported ${newLeadsCount} new leads from Charla.`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync with Charla API. Please ensure your API key is correct.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedLead || !replyText.trim() || isReplying) return;
    
    setIsReplying(true);
    try {
      // If Charla API key is configured, send the reply there as well
      if (settings.charlaApiKey) {
        const response = await fetch('https://charla.com/api/v1/replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.charlaApiKey}`
          },
          body: JSON.stringify({
            leadId: selectedLead.id,
            to: selectedLead.customerEmail,
            message: replyText,
            metadata: {
              source: 'RepairBill Pro',
              convertedFrom: selectedLead.type
            }
          })
        });

        if (!response.ok) {
          console.warn('Charla API reply failed, but updating local status anyway.');
        }
      }

      await onUpdateLead(selectedLead.id, { status: 'replied' });
      setReplyText('');
      alert(`Reply sent to ${selectedLead.customerName} via ${settings.charlaApiKey ? 'Charla API' : 'local system'}.`);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please check your connection and Charla API key.');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className={cn(
      "flex bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden h-[calc(100vh-12rem)] min-h-[700px]",
      theme === 'cyber' && "bg-slate-900 border-slate-800 text-slate-100 shadow-cyan-500/5",
      theme === 'minimalist' && "rounded-none border-zinc-200 shadow-none h-[calc(100vh-14rem)]"
    )}>
      {/* Category Navigation (Vertical Tabs) */}
      <div className={cn(
        "w-16 sm:w-20 bg-slate-50/50 border-r border-slate-100 flex flex-col items-center py-6 gap-6",
        theme === 'cyber' && "bg-slate-800/20 border-slate-800",
        theme === 'minimalist' && "bg-zinc-50/30 border-zinc-200"
      )}>
        {[
          { id: 'all', label: 'All', icon: <Mail size={20} /> },
          { id: 'quote', label: 'Quotes', icon: <FileText size={20} /> },
          { id: 'booking', label: 'Bookings', icon: <Clock size={20} /> },
          { id: 'corporate', label: 'B2B', icon: <ArrowUpRight size={20} /> },
          { id: 'voice_message', label: 'Voice', icon: <MessageSquare size={20} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={cn(
              "group relative flex flex-col items-center gap-1 transition-all",
              filterType === tab.id ? "text-blue-600 scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              filterType === tab.id 
                ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20" : "bg-blue-600 text-white shadow-lg shadow-blue-200") 
                : "bg-transparent group-hover:bg-white"
            )}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              {tab.label}
            </span>
            {filterType === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute -right-[21px] w-1 h-8 bg-blue-600 rounded-l-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* List Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col bg-white",
        theme === 'cyber' && "bg-slate-900 border-slate-800",
        theme === 'minimalist' && "border-zinc-200"
      )}>
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn(
              "text-xs font-black uppercase tracking-widest text-slate-400",
              theme === 'cyber' && "text-cyan-400/50"
            )}>Messages</h3>
            <div className="flex gap-1.5">
              <button 
                onClick={handleSyncLeads}
                disabled={isSyncing}
                className={cn(
                  "p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all",
                  isSyncing && "animate-spin text-blue-600"
                )}
                title="Sync leads from Charla"
              >
                <RefreshCw size={14} />
              </button>
              <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {leads.filter(l => l.status === 'new').length} New
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className={cn(
                "w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500 transition-all",
                theme === 'cyber' && "bg-slate-800 text-white focus:ring-cyan-500",
                theme === 'minimalist' && "bg-zinc-50 border border-zinc-100 rounded-none focus:ring-zinc-900"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Mail className="text-slate-200 mb-2" size={32} />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No entries found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredLeads.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => handleLeadClick(lead)}
                  className={cn(
                    "w-full p-5 text-left hover:bg-blue-50/30 transition-all relative group border-l-4 border-transparent",
                    selectedLeadId === lead.id 
                      ? "bg-blue-50/50 border-blue-600 shadow-inner" 
                      : lead.status === 'new' 
                      ? "bg-blue-50/10" 
                      : "bg-transparent",
                    theme === 'cyber' && selectedLeadId === lead.id && "bg-slate-800 border-cyan-500",
                    theme === 'minimalist' && "rounded-none border-l-2"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-black tracking-tight",
                        theme === 'cyber' && selectedLeadId === lead.id ? "text-cyan-400" : "text-slate-900"
                      )}>
                        {lead.customerName}
                      </span>
                      {lead.status === 'new' && (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                      {format(new Date(lead.createdAt), 'MMM d')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      lead.type === 'quote' ? "bg-amber-100 text-amber-600" :
                      lead.type === 'booking' ? "bg-emerald-100 text-emerald-600" :
                      lead.type === 'corporate' ? "bg-purple-100 text-purple-600" :
                      lead.type === 'voice_message' ? "bg-rose-100 text-rose-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                       {lead.type === 'quote' ? <FileText size={10} /> :
                        lead.type === 'booking' ? <Clock size={10} /> :
                        lead.type === 'corporate' ? <ArrowUpRight size={10} /> :
                        lead.type === 'voice_message' ? <MessageSquare size={10} /> :
                        <Mail size={10} />}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{lead.type.replace('_', ' ')}</p>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1 italic font-medium">
                    {lead.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Detail Area */}
      <div className={cn(
        "hidden md:flex flex-1 flex-col bg-slate-50/30",
        theme === 'cyber' && "bg-slate-900/50",
        theme === 'minimalist' && "bg-white"
      )}>
        {selectedLead ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedLead.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col h-full"
            >
              <div className={cn(
                "p-8 bg-white border-b border-slate-100 flex justify-between items-start",
                theme === 'cyber' && "bg-slate-900 border-slate-800",
                theme === 'minimalist' && "border-zinc-200"
              )}>
                <div className="flex gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner",
                    theme === 'cyber' && "bg-slate-800 text-cyan-400 shadow-cyan-500/10"
                  )}>
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className={cn(
                      "text-2xl font-black text-slate-900 tracking-tight",
                      theme === 'cyber' && "text-white"
                    )}>{selectedLead.customerName}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Mail size={14} className="text-blue-500" /> {selectedLead.customerEmail}
                      </span>
                      {selectedLead.customerPhone && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                           <Smartphone size={14} className="text-blue-500" /> {selectedLead.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onConvertToQuote(selectedLead)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl",
                      theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-cyan-500/20" : "bg-blue-600 text-white shadow-blue-200"
                    )}
                  >
                    Create Quote <Plus size={16} />
                  </button>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    <button 
                      onClick={() => onUpdateLead(selectedLead.id, { status: 'archived' })}
                      className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm shadow-transparent hover:shadow-slate-200"
                      title="Archive"
                    >
                      <Archive size={20} />
                    </button>
                    <button 
                      onClick={() => onDeleteLead(selectedLead.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 mb-8">
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                      selectedLead.type === 'quote' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      selectedLead.type === 'booking' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      selectedLead.type === 'corporate' ? "bg-purple-50 text-purple-600 border-purple-100" :
                      selectedLead.type === 'voice_message' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {selectedLead.type === 'quote' ? <FileText size={12} /> :
                       selectedLead.type === 'booking' ? <Clock size={12} /> :
                       selectedLead.type === 'corporate' ? <ArrowUpRight size={12} /> :
                       selectedLead.type === 'voice_message' ? <MessageSquare size={12} /> :
                       <Mail size={12} />}
                      {selectedLead.type.replace('_', ' ')}
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Clock size={14} /> Received {format(new Date(selectedLead.createdAt), 'EEEE, MMMM do @ h:mm a')}
                    </span>
                  </div>

                  <div className={cn(
                    "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5 relative mb-10",
                    theme === 'cyber' && "bg-slate-900 border-slate-800 shadow-none"
                  )}>
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <MessageSquare size={20} />
                    </div>
                    
                    <p className={cn(
                      "text-slate-700 text-base leading-relaxed tracking-tight font-medium whitespace-pre-wrap",
                      theme === 'cyber' && "text-slate-300"
                    )}>
                      {selectedLead.message}
                    </p>
                    
                    {selectedLead.metadata && (
                      <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                        {(selectedLead.metadata.brand || selectedLead.metadata.model) && (
                          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Target Device</p>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                                <Smartphone size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{selectedLead.metadata.brand}</p>
                                <p className="text-xs font-bold text-blue-600">{selectedLead.metadata.model}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedLead.metadata.source && (
                          <div className="col-span-1 sm:col-span-2 bg-slate-100/50 p-4 rounded-2xl border border-slate-200 border-dashed">
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Captured via Website</p>
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                {selectedLead.metadata.source.replace('https://', '').replace('http://', '').split('/')[0]}
                              </span>
                            </div>
                          </div>
                        )}
                        {selectedLead.metadata.recordingDuration && (
                          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3">Audio Message</p>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500">
                                <Clock size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{selectedLead.metadata.recordingDuration}</p>
                                <p className="text-[10px] font-bold text-rose-500 uppercase">Duration</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedLead.metadata.companyName && (
                          <div className="col-span-1 sm:col-span-2 bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Corporate Client</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{selectedLead.metadata.companyName}</p>
                          </div>
                        )}
                        {selectedLead.metadata.source && (
                          <div className="col-span-1 sm:col-span-2 flex items-center justify-between bg-slate-50/30 px-6 py-4 rounded-3xl border border-dashed border-slate-200">
                            <div className="flex items-center gap-3">
                              <ExternalLink size={16} className="text-slate-400" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Captured via</p>
                            </div>
                            <p className="text-xs font-black text-slate-600 tracking-tight">{selectedLead.metadata.source}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedLead.status === 'replied' && (
                    <div className="mb-8 flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-700">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white scale-75">
                        <CheckCircle size={20} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">You successfully replied to this lead</span>
                    </div>
                  )}

                  {/* Reply Box */}
                  <div className={cn(
                    "bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden",
                    theme === 'cyber' && "bg-slate-950 border border-slate-800"
                  )}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Send size={120} className="rotate-12" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                         <MessageSquare size={20} />
                       </div>
                       <div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-white">Craft Response</h3>
                         <p className="text-[10px] text-white/40 font-bold uppercase">Sending to {selectedLead.customerEmail}</p>
                       </div>
                    </div>

                    <textarea 
                      placeholder={`Type your reply to ${selectedLead.customerName.split(' ')[0]}...`}
                      className="w-full h-40 p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:text-white/20 resize-none mb-6"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                       <p className="text-[10px] text-white/30 font-bold italic tracking-wide">
                         Authenticated as {settings.companyName || 'Mayfield Admin'}
                       </p>
                       <button 
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isReplying}
                        className={cn(
                          "w-full sm:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-blue-500/20",
                          theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-cyan-500/40" : "bg-blue-600 text-white"
                        )}
                       >
                         {isReplying ? (
                           <>Processing... <Clock size={16} className="animate-spin" /></>
                         ) : (
                           <>Dispatch Response <ArrowRight size={16} /></>
                         )}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Mail size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">Select a conversation</p>
            <p className="text-xs mt-2 text-slate-400 font-medium">Messages from mayfieldphonerepair.com.au pop up here</p>
          </div>
        )}
      </div>

      {/* Mobile view could be implemented if needed, but keeping it simple for now */}
    </div>
  );
}
