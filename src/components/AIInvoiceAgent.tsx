import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle2, 
  X, 
  Sparkles,
  ArrowRight,
  Printer,
  Share2,
  Download,
  Eye,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processInvoiceRequest } from '../services/geminiService';
import { Invoice, InvoiceSettings, Brand, InvoiceItem } from '../lib/types';
import { getBrandCatalog } from '../lib/brandData';
import { cn } from '@/lib/utils';
import { InvoiceTemplate } from './InvoiceTemplate';
import { printInvoice, generatePDF, shareInvoice, getLocalDateString } from '../lib/invoiceUtils';

interface AIInvoiceAgentProps {
  settings: InvoiceSettings;
  brands: Brand[];
  invoices: Invoice[];
  expenses: any[];
  leads: any[];
  onInvoiceCreated: (invoice: Invoice) => void;
  onExpenseCreated: (expense: any) => void;
  onCatalogUpdated: (data: any) => void;
  onClose: () => void;
  nextInvoiceNumber: number;
  setActiveTab: (tab: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'invoice' | 'expense' | 'catalog';
  data?: any;
}

export function AIInvoiceAgent({ settings, brands, invoices, expenses, leads, onInvoiceCreated, onExpenseCreated, onCatalogUpdated, onClose, nextInvoiceNumber, setActiveTab, startListening = false }: AIInvoiceAgentProps & { startListening?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: "I'm your shop assistant. I can create invoices, log expenses, or update your device catalog. What can I do for you?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastProcessedInvoice, setLastProcessedInvoice] = useState<Invoice | null>(null);
  const [lastProcessedExpense, setLastProcessedExpense] = useState<any | null>(null);
  const [lastProcessedCatalog, setLastProcessedCatalog] = useState<any | null>(null);
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const handlePromptEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.prompt && handleSendRef.current) {
        handleSendRef.current(customEvent.detail.prompt);
      }
    };
    window.addEventListener('open-ai-agent-with-prompt', handlePromptEvent);
    return () => window.removeEventListener('open-ai-agent-with-prompt', handlePromptEvent);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Use the utilities for actions
  const handlePrint = (invoice: Invoice) => {
    setLastProcessedInvoice(invoice);
    const elementId = `ai-printable-${invoice.id}`;
    // Small delay to ensure hidden template is rendered or updated
    setTimeout(() => {
      printInvoice(elementId);
    }, 100);
  };

  const handleDownload = (invoice: Invoice) => {
    setLastProcessedInvoice(invoice);
    const elementId = `ai-printable-${invoice.id}`;
    setTimeout(() => {
      generatePDF(elementId, `Invoice_${invoice.invoiceNumber}`);
    }, 100);
  };

  const handleShare = (invoice: Invoice) => {
    shareInvoice(invoice, settings);
  };

  // Handle Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-AU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      if (startListening) {
        setIsListening(true);
        recognitionRef.current.start();
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setIsConfirmed(false); // Reset confirmation state for new turn

    try {
      const response = await processInvoiceRequest(text, settings, brands, invoices, expenses, leads);
      
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // Process each function call independently
        for (let i = 0; i < functionCalls.length; i++) {
          const call = functionCalls[i];
          
          if (call.name === 'createInvoice') {
            const args = call.args as any;
            const items: InvoiceItem[] = args.items.map((item: any, idx: number) => ({
              id: `ai-${Date.now()}-${i}-${idx}`,
              brandName: item.brandName || 'Other',
              modelName: item.modelName || 'Device',
              serviceName: item.serviceName,
              price: item.price,
              quantity: item.quantity || 1
            }));

            const baseTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            let subtotal = 0;
            let taxAmount = 0;
            let total = 0;

            if (settings.taxInclusive) {
              total = Math.round(baseTotal);
              subtotal = Math.round(total / (1 + settings.taxRate / 100));
              taxAmount = total - subtotal;
            } else {
              subtotal = Math.round(baseTotal);
              taxAmount = Math.round(subtotal * (settings.taxRate / 100));
              total = subtotal + taxAmount;
            }

            const prefix = args.type === 'estimate' ? settings.estimatePrefix : settings.invoicePrefix;

            const newInvoice: Invoice = {
              id: Math.random().toString(36).substr(2, 9),
              invoiceNumber: `${prefix}${(nextInvoiceNumber + i).toString().padStart(3, '0')}`,
              customerName: args.customerName,
              customerEmail: args.customerEmail || 'N/A',
              customerPhone: args.customerPhone || 'N/A',
              date: args.date || getLocalDateString(),
              dueDate: args.date 
                ? new Date(new Date(args.date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              items,
              subtotal,
              taxAmount,
              total,
              status: args.type === 'estimate' ? 'estimate' : 'paid',
              type: (args.type || 'invoice') as 'invoice' | 'estimate',
              paymentMethod: args.paymentMethod || 'Cash'
            };

            setMessages(prev => [...prev, { 
              id: (Date.now() + 1 + i).toString(), 
              role: 'assistant', 
              content: `Prepped ${newInvoice.type === 'estimate' ? 'quote' : 'invoice'} for ${newInvoice.customerName} - ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(newInvoice.total)}. Correct?`,
              type: 'invoice',
              data: newInvoice
            }]);
          } else if (call.name === 'createExpense') {
            const args = call.args as any;
            const taxAmount = Math.round((args.amount * settings.taxRate) / (100 + settings.taxRate));
            const newExpense = {
              id: Math.random().toString(36).substr(2, 9),
              description: args.description,
              amount: Math.round(args.amount),
              taxAmount: taxAmount,
              category: args.category,
              paymentMethod: args.paymentMethod || 'Cash',
              supplier: args.supplier || 'Generic Supplier',
              date: args.date || getLocalDateString()
            };
            setMessages(prev => [...prev, {
              id: (Date.now() + i).toString(),
              role: 'assistant',
              content: `I've logged a ${newExpense.category} expense of ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(newExpense.amount)} for ${newExpense.description}. Confirm?`,
              type: 'expense',
              data: newExpense
            }]);
          } else if (call.name === 'updateCatalog') {
            const args = call.args as any;
            let content = '';
            if (args.action === 'add_brand') content = `Add new brand: ${args.brandName}`;
            else if (args.action === 'add_model') content = `Add ${args.modelName} to ${args.brandName}`;
            else if (args.action === 'remove_brand') content = `REMOVE brand: ${args.brandName}`;
            else if (args.action === 'remove_model') content = `REMOVE ${args.modelName} from ${args.brandName}`;

            setMessages(prev => [...prev, {
              id: (Date.now() + i).toString(),
              role: 'assistant',
              content: `I'm ready to update the catalog: ${content}. Proceed?`,
              type: 'catalog',
              data: args
            }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: response.text || "I understood your request and I've prepared it. Please let me know if you want to proceed." 
        }]);
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `I'm having trouble connecting to the AI. Error details: ${error.message || String(error)}. Please check your internet or try again.` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeAction = (msgId: string, data: any, type: string) => {
    if (type === 'invoice') {
      onInvoiceCreated(data as Invoice);
    } else if (type === 'expense') {
      onExpenseCreated(data);
    } else if (type === 'catalog') {
      onCatalogUpdated(data);
    }
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        let content = '';
        if (type === 'invoice') {
          content = `Invoice saved! Use the options below.`;
        } else if (type === 'expense') {
          content = `Expense logged successfully for ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.amount)}.`;
        } else if (type === 'catalog') {
          if (data.action.startsWith('remove')) {
            content = `Catalog updated: Removed ${data.brandName} ${data.modelName || ''}.`;
          } else {
            content = `Catalog updated: ${data.brandName} ${data.modelName || ''} is now in your system.`;
          }
        }

        return {
          ...msg,
          content,
          data: { ...data, isSaved: true }
        };
      }
      return msg;
    }));
    setIsConfirmed(false); // Don't lock the agent, allow next turn
  };

  const theme = settings.appTheme || 'modern';

  const SUGGESTED_COMMANDS = [
    "Add 2 invoices for yesterday for walk-in client for $50 each",
    "Log $1200 rent for last month and $150 utility for this month",
    "Add Samsung Galaxy S24 to catalog",
    "Stop supporting LG brand",
    "Compare this week sales with last week",
  ];

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-180px)] sm:h-[600px] bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100",
      theme === 'cyber' && "bg-slate-900 border-slate-800 shadow-cyan-900/20",
      theme === 'minimalist' && "bg-white border-zinc-100 rounded-none shadow-none border"
    )}>
      {/* Header */}
      <div className={cn(
        "bg-slate-900 p-4 sm:p-6 flex justify-between items-center text-white shrink-0",
        theme === 'cyber' && "bg-slate-800 border-b border-slate-700",
        theme === 'minimalist' && "bg-zinc-50 text-zinc-900 border-b border-zinc-100"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border",
            theme === 'cyber' ? "bg-cyan-500/10 border-cyan-500/30" : 
            theme === 'minimalist' ? "bg-zinc-900 text-white rounded-none border-none" :
            "bg-blue-500/20 border-blue-500/30"
          )}>
            <Sparkles className={theme === 'cyber' ? "text-cyan-400" : theme === 'minimalist' ? "text-white" : "text-blue-400"} size={18} />
          </div>
          <div>
            <h3 className={cn(
              "font-black text-[10px] sm:text-sm uppercase tracking-widest leading-none mb-1",
              theme === 'minimalist' ? "text-zinc-400" : "text-slate-400"
            )}>Shop Assistant AI</h3>
            <p className={cn(
              "text-[10px] sm:text-xs font-bold leading-none",
              theme === 'minimalist' ? "text-zinc-900" : "text-white/60"
            )}>Now with bulk & removal support</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            theme === 'minimalist' 
              ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-none" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <X size={14} /> Close
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto p-6 space-y-6",
          theme === 'modern' ? "bg-slate-50/50" : theme === 'cyber' ? "bg-slate-900/50" : "bg-white"
        )}
      >
        <AnimatePresence initial={false}>
          {messages.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4"
            >
              {SUGGESTED_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(cmd)}
                  className={cn(
                    "text-left p-3 rounded-2xl text-[10px] sm:text-xs font-bold border transition-all hover:scale-[0.98] active:scale-95",
                    theme === 'cyber' ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50" :
                    theme === 'minimalist' ? "bg-white border-zinc-200 text-zinc-600 rounded-none" :
                    "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30"
                  )}
                >
                  "{cmd}"
                </button>
              ))}
            </motion.div>
          )}
          {messages.length > 2 && messages.some(m => m.data && !m.data.isSaved) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-0 z-10 flex justify-center pb-4"
            >
              <button 
                onClick={() => {
                  messages.forEach(m => {
                    if (m.data && !m.data.isSaved) {
                      finalizeAction(m.id, m.data, m.type || 'invoice');
                    }
                  });
                }}
                className={cn(
                  "px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border transition-all",
                  theme === 'cyber' ? "bg-cyan-500 text-slate-900 border-cyan-400 hover:bg-cyan-400" :
                  theme === 'minimalist' ? "bg-zinc-900 text-white rounded-none border-zinc-800" :
                  "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                )}
              >
                <CheckCircle2 size={14} /> Confirm All Pending
              </button>
            </motion.div>
          )}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'user' 
                  ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900" : theme === 'minimalist' ? "bg-zinc-900 rounded-none" : "bg-blue-600 text-white") 
                  : (theme === 'cyber' ? "bg-slate-800 text-white border border-slate-700" : theme === 'minimalist' ? "bg-zinc-100 text-zinc-900 rounded-none border-none" : "bg-white text-slate-600 border border-slate-100")
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-3">
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? (theme === 'cyber' ? "bg-cyan-500/20 text-cyan-50 border border-cyan-500/50" : theme === 'minimalist' ? "bg-zinc-900 text-white font-medium rounded-none" : "bg-blue-600 text-white font-medium") 
                    : (theme === 'cyber' ? "bg-slate-800 text-slate-200 border border-slate-700" : theme === 'minimalist' ? "bg-white text-zinc-700 border border-zinc-200 rounded-none font-serif" : "bg-white text-slate-700 border border-slate-100")
                )}>
                  {msg.content}
                </div>
                
                {/* Data Preview Cards */}
                {msg.data && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "bg-white rounded-3xl border-2 p-5 shadow-xl shadow-slate-500/5 space-y-4",
                      theme === 'cyber' ? "bg-slate-800 border-slate-700" : theme === 'minimalist' ? "bg-white border-zinc-900 rounded-none shadow-none" : "border-slate-100"
                    )}
                  >
                    {msg.type === 'invoice' && (
                      <div className="space-y-4 text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-widest mb-1",
                              theme === 'minimalist' ? "text-zinc-400" : "text-slate-400"
                            )}>
                              {msg.data.type === 'estimate' ? 'QUOTATION' : 'INVOICE'}
                            </p>
                            <h4 className={cn("font-bold", theme === 'cyber' ? "text-white" : "text-slate-800")}>{msg.data.customerName}</h4>
                          </div>
                          <p className={cn(
                            "text-lg font-black",
                            theme === 'cyber' ? "text-cyan-400" : "text-emerald-600"
                          )}>
                            {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(msg.data.total)}
                          </p>
                        </div>
                        <div className={cn("space-y-2 border-t pt-4", theme === 'cyber' ? "border-slate-700" : "border-slate-100")}>
                          {msg.data.items.map((item: InvoiceItem) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span className={cn("truncate mr-2", theme === 'cyber' ? "text-slate-400" : "text-slate-600")}>{item.serviceName}</span>
                              <span className={cn("font-bold shrink-0", theme === 'minimalist' ? "text-zinc-900" : "text-slate-400")}>{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.type === 'expense' && (
                      <div className="space-y-4 text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">NEW EXPENSE</p>
                            <h4 className={cn("font-bold", theme === 'cyber' ? "text-white" : "text-slate-800")}>{msg.data.description}</h4>
                          </div>
                          <p className="text-lg font-black text-rose-600">
                            {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(msg.data.amount)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] uppercase font-black tracking-wider">
                          <div className={cn("p-2 rounded-lg", theme === 'cyber' ? "bg-slate-900 text-slate-500" : "bg-slate-50 text-slate-400")}>Cat: <span className={theme === 'cyber' ? "text-slate-300" : "text-slate-700"}>{msg.data.category}</span></div>
                          <div className={cn("p-2 rounded-lg", theme === 'cyber' ? "bg-slate-900 text-slate-500" : "bg-slate-50 text-slate-400")}>via: <span className={theme === 'cyber' ? "text-slate-300" : "text-slate-700"}>{msg.data.paymentMethod}</span></div>
                        </div>
                      </div>
                    )}

                    {msg.type === 'catalog' && (
                      <div className="space-y-4 text-left">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest mb-1", 
                          msg.data.action.startsWith('remove') ? "text-rose-500" : (theme === 'cyber' ? "text-cyan-400" : "text-blue-400")
                        )}>
                          {msg.data.action.startsWith('remove') ? 'CATALOG REMOVAL' : 'CATALOG UPDATE'}
                        </p>
                        <div className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border",
                          msg.data.action.startsWith('remove') 
                            ? "bg-rose-50 border-rose-100 text-rose-900" 
                            : (theme === 'cyber' ? "bg-slate-900 border-slate-700" : "bg-blue-50 border-blue-100")
                        )}>
                          <Smartphone className={msg.data.action.startsWith('remove') ? "text-rose-600" : (theme === 'cyber' ? "text-cyan-400" : "text-blue-600")} size={24} />
                          <div>
                            <h4 className={cn("font-bold", theme === 'cyber' && !msg.data.action.startsWith('remove') ? "text-white" : "text-slate-800")}>{msg.data.brandName}</h4>
                            {msg.data.modelName && <p className={cn("text-xs font-bold", msg.data.action.startsWith('remove') ? "text-rose-600" : (theme === 'cyber' ? "text-cyan-400" : "text-blue-600"))}>{msg.data.modelName}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.data.isSaved ? (
                      msg.type === 'invoice' && (
                        <div className="flex flex-col gap-2 pt-2">
                          <button 
                            onClick={() => setActiveTab('invoices')}
                            className={cn(
                                "w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                                theme === 'cyber' ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400" :
                                theme === 'minimalist' ? "bg-zinc-900 text-white rounded-none" :
                                "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                            )}
                          >
                            <Eye size={18} /> View Full Invoice
                          </button>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handlePrint(msg.data)} className={cn("flex-1 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border", theme === 'cyber' ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                                <Printer size={14} /> Print
                            </button>
                            <button onClick={() => handleDownload(msg.data)} className={cn("flex-1 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border", theme === 'cyber' ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                                <Download size={14} /> PDF
                            </button>
                            <button onClick={() => handleShare(msg.data)} className={cn("flex-1 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border", theme === 'cyber' ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                                <Share2 size={14} /> Share
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <button 
                        onClick={() => finalizeAction(msg.id, msg.data, msg.type || 'invoice')}
                        className={cn(
                          "w-full text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                          theme === 'minimalist' ? "rounded-none shadow-none" : "",
                          msg.type === 'expense' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" :
                          msg.type === 'catalog' ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900 border-none" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200") :
                          (theme === 'cyber' ? "bg-cyan-500 text-slate-900 border-none" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200")
                        )}
                      >
                        <CheckCircle2 size={18} /> Confirm Action
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isProcessing && (
          <div className="flex gap-3">
            <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border text-slate-400",
                theme === 'cyber' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
            )}>
              <Bot size={16} />
            </div>
            <div className={cn(
                "p-4 rounded-2xl border flex items-center gap-2",
                theme === 'cyber' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
            )}>
              <Loader2 className={cn("animate-spin", theme === 'cyber' ? "text-cyan-400" : "text-blue-500")} size={16} />
              <span className={cn("text-xs font-medium italic", theme === 'cyber' ? "text-slate-400" : "text-slate-500")}>Processing your request...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={cn(
          "p-6 bg-white border-t",
          theme === 'cyber' ? "bg-slate-900 border-slate-800" : theme === 'minimalist' ? "bg-white border-zinc-200" : "border-slate-100"
      )}>
        <div className="relative flex items-center gap-3">
          <button 
            onClick={toggleListening}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
              theme === 'minimalist' && "rounded-none",
              isListening 
                ? "bg-rose-100 text-rose-600 animate-pulse shadow-lg shadow-rose-200" 
                : (theme === 'cyber' ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            )}
          >
            <Mic size={20} />
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Type repair details or expense..."}
            className={cn(
                "flex-1 border-none px-5 h-12 text-sm font-medium focus:ring-2 transition-all disabled:opacity-50",
                theme === 'cyber' ? "bg-slate-800 text-white focus:ring-cyan-500" : 
                theme === 'minimalist' ? "bg-zinc-50 border border-zinc-200 rounded-none" : "bg-slate-50 rounded-2xl focus:ring-blue-500"
            )}
            disabled={isProcessing}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none",
                theme === 'minimalist' && "rounded-none shadow-none",
                theme === 'cyber' ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-lg shadow-cyan-900/50" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Hidden Templates for PDF/Print Generation */}
      {lastProcessedInvoice && (
        <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none z-[-1] bg-white">
          <div id={`ai-printable-${lastProcessedInvoice.id}`} className="bg-white p-8 w-[800px]">
            <InvoiceTemplate 
              invoice={lastProcessedInvoice} 
              settings={settings} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
