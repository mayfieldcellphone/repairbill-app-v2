import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical, 
  Calendar, 
  ArrowUpDown,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Bell,
  X,
  Printer,
  Share2,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice, InvoiceSettings } from '../lib/types';
import { InvoiceTemplate } from './InvoiceTemplate';
import { generatePDF, printInvoice, shareInvoice } from '../lib/invoiceUtils';

// Mock data for invoices
const MOCK_INVOICES: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-2026-001', customerName: 'John Doe', customerEmail: 'john@example.com', date: '2026-07-05', dueDate: '2026-07-15', items: [], subtotal: 350, taxAmount: 35, total: 385, status: 'paid', type: 'invoice', paymentMethod: 'Card' },
  { id: '2', invoiceNumber: 'INV-2026-002', customerName: 'Sarah Smith', customerEmail: 'sarah@tech.co', date: '2026-10-12', dueDate: '2026-10-26', items: [], subtotal: 890, taxAmount: 89, total: 979, status: 'sent', type: 'invoice', paymentMethod: 'Bank Transfer' },
  { id: '3', invoiceNumber: 'INV-2026-003', customerName: 'Michael Brown', customerEmail: 'm.brown@mail.com', date: '2027-01-15', dueDate: '2027-01-29', items: [], subtotal: 120, taxAmount: 12, total: 132, status: 'overdue', type: 'invoice', paymentMethod: 'Cash' },
  { id: '4', invoiceNumber: 'INV-2026-004', customerName: 'Alice Johnson', customerEmail: 'alice@web.com', date: '2027-04-04', dueDate: '2027-04-18', items: [], subtotal: 2100, taxAmount: 210, total: 2310, status: 'draft', type: 'invoice', paymentMethod: 'Other' },
  { id: '5', invoiceNumber: 'INV-2026-005', customerName: 'TechCorp Systems', customerEmail: 'info@techcorp.com', date: '2026-08-20', dueDate: '2026-09-03', items: [], subtotal: 4500, taxAmount: 450, total: 4950, status: 'paid', type: 'invoice', paymentMethod: 'Bank Transfer' },
];

export function InvoiceManagement({ settings, invoices, setInvoices, onEdit, onDelete, initialPaymentMethod, initialSelectedInvoice, initialTab }: { 
  settings: InvoiceSettings, 
  invoices: Invoice[], 
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>,
  onEdit?: (invoice: Invoice) => void,
  onDelete?: (id: string) => void,
  initialPaymentMethod?: string | null,
  initialSelectedInvoice?: Invoice | null,
  initialTab?: 'invoice' | 'estimate'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'q1' | 'q2' | 'q3' | 'q4' | 'custom'>('all');
  const [activeTab, setActiveTab] = useState<'invoice' | 'estimate'>(initialTab || 'invoice');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [statusFilter, setStatusFilter] = useState<Invoice['status'][]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<Invoice['paymentMethod'][]>(
    initialPaymentMethod ? [initialPaymentMethod as any] : []
  );
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'asc' | 'desc' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(initialSelectedInvoice || null);
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    setDisplayLimit(50); // Reset limit when filters change
  }, [searchTerm, period, statusFilter, paymentMethodFilter, minAmount, maxAmount, startDate, endDate, activeTab]);

  useEffect(() => {
    if (initialSelectedInvoice) {
      setViewingInvoice(initialSelectedInvoice);
      setActiveTab(initialSelectedInvoice.type || 'invoice');
    }
  }, [initialSelectedInvoice]);

  useEffect(() => {
    if (initialPaymentMethod) {
      setPaymentMethodFilter([initialPaymentMethod as any]);
    } else {
      setPaymentMethodFilter([]);
    }
  }, [initialPaymentMethod]);

  const confirmDelete = () => {
    if (deletingId && onDelete) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const theme = settings.appTheme || 'modern';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency || 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const filterInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => (inv.type || 'invoice') === activeTab);

    // Period filtering
    if (period !== 'all' && period !== 'custom') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      
      // AU Financial Year (July 1 - June 30)
      // If we are in Feb 2027, the FY is 2026-2027 (Starts July 2026)
      const fyStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;

      filtered = filtered.filter(inv => {
        const [y, m, d] = inv.date.split('-').map(Number);
        const invDate = new Date(y, m - 1, d);
        invDate.setHours(0, 0, 0, 0);
        
        const invMonth = invDate.getMonth();
        const invYear = invDate.getFullYear();
        
        // Quarters based on Australian Financial Year (Jul-Jun)
        if (period === 'q1') {
          // July - Sept of the FY Start Year
          return invMonth >= 6 && invMonth <= 8 && invYear === fyStartYear;
        }
        if (period === 'q2') {
          // Oct - Dec of the FY Start Year
          return invMonth >= 9 && invMonth <= 11 && invYear === fyStartYear;
        }
        if (period === 'q3') {
          // Jan - Mar of the next year
          return invMonth >= 0 && invMonth <= 2 && invYear === fyStartYear + 1;
        }
        if (period === 'q4') {
          // Apr - Jun of the next year
          return invMonth >= 3 && invMonth <= 5 && invYear === fyStartYear + 1;
        }

        if (period === 'daily') {
          return invYear === now.getFullYear() && invMonth === now.getMonth() && invDate.getDate() === now.getDate();
        }
        
        if (period === 'weekly') {
          // Start of current week (assuming Monday start for AU)
          const day = now.getDay(); // 0 (Sun) - 6 (Sat)
          const diff = now.getDate() - (day === 0 ? 6 : day - 1); // Adjust to Monday
          const monday = new Date(now);
          monday.setDate(diff);
          monday.setHours(0, 0, 0, 0);
          
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          
          return invDate >= monday && invDate <= sunday;
        }
        
        if (period === 'monthly') {
          return invMonth === now.getMonth() && invYear === currentYear;
        }
        
        if (period === 'yearly') {
          // For records, yearly should probably mean "Current Financial Year" if we have Q1-Q4
          // But usually users expect Calendar Year for the specific "Yearly" label.
          // To satisfy "logical" sorting in a financial app, we'll allow both but focus on Calendar Year here 
          // since Q1-Q4 cover the FY splits.
          return invYear === currentYear;
        }
        
        return true;
      });
    }

    // Payment Method Filter
    if (paymentMethodFilter.length > 0) {
      filtered = filtered.filter(inv => inv.paymentMethod && paymentMethodFilter.includes(inv.paymentMethod));
    }

    // Custom Date Range
    if (period === 'custom') {
      if (startDate) {
        filtered = filtered.filter(inv => new Date(inv.date) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter(inv => new Date(inv.date) <= new Date(endDate));
      }
    }

    // Status Filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(inv => statusFilter.includes(inv.status));
    }

    // Amount Range Filter
    if (minAmount !== '') {
      filtered = filtered.filter(inv => inv.total >= parseFloat(minAmount));
    }
    if (maxAmount !== '') {
      filtered = filtered.filter(inv => inv.total <= parseFloat(maxAmount));
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort: Date desc, then Invoice Number desc
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.invoiceNumber.localeCompare(a.invoiceNumber);
      });
    }

    return filtered;
  }, [invoices, searchTerm, period, statusFilter, paymentMethodFilter, minAmount, maxAmount, startDate, endDate, sortConfig]);

  const displayedInvoices = useMemo(() => {
    return filterInvoices.slice(0, displayLimit);
  }, [filterInvoices, displayLimit]);

  const stats = useMemo(() => {
    const total = filterInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const paid = filterInvoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.total, 0);
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [filterInvoices]);

  const toggleStatus = (status: Invoice['status']) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const togglePaymentMethod = (method: Invoice['paymentMethod']) => {
    if (!method) return;
    setPaymentMethodFilter(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method) 
        : [...prev, method]
    );
  };

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filterInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filterInvoices.map(inv => inv.id)));
    }
  };

  const handleBulkStatusChange = (status: Invoice['status']) => {
    setInvoices(prev => prev.map(inv => 
      selectedIds.has(inv.id) ? { ...inv, status } : inv
    ));
    setSelectedIds(new Set());
  };

  const handleBulkReminder = () => {
    // In a real app, this would trigger email API
    alert(`Reminders sent for ${selectedIds.size} invoices.`);
    setSelectedIds(new Set());
  };

  const handleBulkDownload = async () => {
    for (const id of Array.from(selectedIds)) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        await generatePDF(`printable-invoice-${inv.id}`, `Invoice_${inv.invoiceNumber}`);
      }
    }
    setSelectedIds(new Set());
  };

  const requestSort = (key: keyof Invoice) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <span className="flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12}/> Paid</span>;
      case 'sent': return <span className="flex items-center gap-1.5 bg-info/10 text-info px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><Clock size={12}/> Sent</span>;
      case 'overdue': return <span className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><AlertCircle size={12}/> Overdue</span>;
      case 'draft': return <span className="flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><FileText size={12}/> Draft</span>;
      case 'estimate': return <span className="flex items-center gap-1.5 bg-warning/10 text-warning px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><FileText size={12}/> Estimate</span>;
      default: return null;
    }
  };

  const handleConvertToInvoice = (estimate: Invoice) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === estimate.id 
        ? { ...inv, type: 'invoice', status: 'draft', invoiceNumber: inv.invoiceNumber.replace('EST', 'INV') } 
        : inv
    ));
    setActiveTab('invoice');
  };

  const exportInvoices = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Invoice Number,Customer,Date,Total,Status\n"
      + filterInvoices.map(inv => `${inv.invoiceNumber},${inv.customerName},${inv.date},${inv.total},${inv.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoices_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn(
      "max-w-7xl mx-auto space-y-6",
      theme === 'minimalist' && "font-serif"
    )}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={cn(
            "text-2xl font-bold tracking-tight text-foreground",
            theme === 'cyber' && "uppercase italic"
          )}>Financial Records</h2>
          <p className="text-sm text-muted-foreground font-medium">Global tracking of invoices and quotes</p>
        </div>
        <div className={cn(
          "flex p-1 rounded-xl bg-muted border border-border",
          theme === 'minimalist' && "rounded-none"
        )}>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'invoice' 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Invoices
          </button>
          <button 
            onClick={() => setActiveTab('estimate')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'estimate' 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Quotes
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportInvoices}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all shadow-sm border bg-card border-border text-foreground hover:bg-muted",
              theme === 'minimalist' && "rounded-none shadow-none"
            )}
          >
            <Download size={14} /> Export CSV
          </button>
          <button className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all shadow-sm border bg-card border-border text-foreground hover:bg-muted",
              theme === 'minimalist' && "rounded-none shadow-none"
          )}>
            <Upload size={14} /> Import
          </button>
        </div>
      </div>

      <Card className={cn(
        "rounded-3xl shadow-sm overflow-hidden relative border bg-card border-border",
        theme === 'minimalist' && "rounded-none shadow-none"
      )}>
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 border-b border-border bg-card",
          (theme === 'cyber' || theme === 'minimalist') && "bg-muted/10"
        )}>
          <div className="p-6 border-r border-border">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-foreground">{formatPrice(stats.total)}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">{filterInvoices.length} {activeTab}s</p>
          </div>
          <div className={cn(
            "p-6 border-r border-border",
            "bg-success/5"
          )}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-success/80">Collected</p>
            <p className="text-2xl font-black text-success">{formatPrice(stats.paid)}</p>
            <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden bg-muted">
               <div 
                 className="h-full rounded-full transition-all duration-1000 bg-success" 
                 style={{ width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` }}
               />
            </div>
          </div>
          <div className={cn(
            "p-6",
            "bg-warning/5"
          )}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-warning/80">Outstanding</p>
            <p className="text-2xl font-black text-warning">{formatPrice(stats.unpaid)}</p>
            <p className="text-[10px] font-bold mt-1 text-warning/60">Pending Payment</p>
          </div>
        </div>

        <CardHeader className={cn(
          "bg-card border-b p-6 border-border"
        )}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className={cn(
                "flex p-1 rounded-xl w-fit overflow-x-auto no-scrollbar max-w-full bg-muted border border-border",
                theme === 'minimalist' && "rounded-none"
              )}>
                {(['all', 'daily', 'weekly', 'monthly', 'yearly', 'q1', 'q2', 'q3', 'q4', 'custom'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap",
                      period === p 
                        ? "bg-card text-foreground shadow-sm border border-border" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:flex-initial">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search records..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      "pl-10 h-10 w-full md:w-64 transition-all border bg-muted/50 border-border text-foreground rounded-xl focus:bg-background",
                      theme === 'minimalist' && "rounded-none font-serif"
                    )}
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all flex items-center justify-center relative shadow-sm",
                    showFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Filter size={18} />
                  {(statusFilter.length > 0 || minAmount || maxAmount) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                      {(statusFilter.length > 0 ? 1 : 0) + (minAmount || maxAmount ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Filter by Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['paid', 'sent', 'overdue', 'draft'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => toggleStatus(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border capitalize",
                          statusFilter.includes(s) 
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount Range ({settings.currency})</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-9 rounded-lg border-border bg-card text-foreground"
                    />
                    <span className="text-slate-300">-</span>
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-9 rounded-lg border-border bg-card text-foreground"
                    />
                  </div>
                </div>

                {period === 'custom' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Custom Date Range</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 rounded-lg border-border bg-card text-foreground"
                      />
                      <span className="text-slate-300">-</span>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 rounded-lg border-border bg-card text-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Method</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Cash', 'Card', 'Bank Transfer', 'Other'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => togglePaymentMethod(m)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border capitalize",
                          paymentMethodFilter.includes(m) 
                            ? "bg-slate-800 border-slate-800 text-white shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-start-3 flex justify-end items-end gap-3">
                  <button 
                    onClick={() => {
                      setStatusFilter([]);
                      setPaymentMethodFilter([]);
                      setMinAmount('');
                      setMaxAmount('');
                      setStartDate('');
                      setEndDate('');
                      setPeriod('all');
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest px-1"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border text-primary focus:ring-ring bg-card"
                      checked={filterInvoices.length > 0 && selectedIds.size === filterInvoices.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => requestSort('invoiceNumber')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-primary">
                      Invoice No <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => requestSort('customerName')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-primary">
                      Customer <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => requestSort('date')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-primary">
                      Date <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => requestSort('total')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-primary">
                      Amount <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => requestSort('paymentMethod')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-primary">
                      Method <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className={cn(
                      "transition-colors group",
                      "hover:bg-muted/30 text-foreground",
                      selectedIds.has(inv.id) && "bg-primary/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border text-primary focus:ring-ring bg-card"
                        checked={selectedIds.has(inv.id)}
                        onChange={() => toggleId(inv.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate text-foreground">{inv.customerName}</span>
                        {inv.customerCompany && (
                          <span className="text-[10px] font-bold truncate uppercase tracking-tighter text-info">{inv.customerCompany}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate">{inv.customerEmail}</span>
                        {inv.customerNotes && (
                          <span className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md self-start max-w-full truncate text-warning bg-warning/10" title={inv.customerNotes}>
                            NOTE: {inv.customerNotes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={14} />
                        <span className="text-xs font-semibold">{inv.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground">{formatPrice(inv.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-tight px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        {inv.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inv.type === 'estimate' && (
                          <button 
                            onClick={() => handleConvertToInvoice(inv)}
                            className="p-2 rounded-lg transition-all text-muted-foreground hover:text-success hover:bg-success/10"
                            title="Convert to Invoice"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button 
                           onClick={() => setViewingInvoice(inv)}
                          className="p-2 rounded-lg transition-all text-muted-foreground hover:text-info hover:bg-info/10"
                          title="View Invoice"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => generatePDF(`printable-invoice-${inv.id}`, `Invoice_${inv.invoiceNumber}`)}
                          className="p-2 rounded-lg transition-all text-muted-foreground hover:text-info hover:bg-info/10"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        {onEdit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                            className="p-2 rounded-lg transition-all text-muted-foreground hover:text-info hover:bg-info/10"
                            title="Edit Invoice"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(inv.id); }}
                            className="p-2 rounded-lg transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Invoice"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {displayedInvoices.map((inv) => (
              <div 
                key={inv.id} 
                className={cn(
                  "p-4 space-y-3 transition-colors",
                  selectedIds.has(inv.id) ? "bg-blue-50/50" : "bg-white"
                )}
                onClick={() => setViewingInvoice(inv)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.has(inv.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleId(inv.id);
                      }}
                    />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{inv.invoiceNumber}</p>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{inv.customerName}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">{formatPrice(inv.total)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{inv.date}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {inv.paymentMethod || 'N/A'}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        shareInvoice(inv, settings);
                      }}
                      className="p-2 text-slate-400 hover:text-purple-600 rounded-lg"
                    >
                      <Share2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(inv);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"
                    >
                      <Pencil size={14} />
                    </button>
                    {onDelete && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(inv.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(filterInvoices.length > displayLimit) && (
            <div className="p-8 flex justify-center bg-slate-50/50 border-t border-slate-100">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 100)}
                className="bg-white border border-slate-200 text-slate-900 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
              >
                Load {Math.min(100, filterInvoices.length - displayLimit)} More Records
              </button>
            </div>
          )}
          
          {filterInvoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Search size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-medium">No invoices found matching your criteria</p>
            </div>
          )}

          {/* Floating Bulk Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-2xl shadow-2xl p-2 flex items-center gap-4 z-50 border border-border"
              >
                <div className="flex items-center gap-3 px-4 border-r border-background/20">
                  <span className="text-sm font-black text-background">{selectedIds.size}</span>
                  <span className="text-[10px] font-bold text-background/60 uppercase tracking-wider">Selected</span>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleBulkStatusChange('paid')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-background/10 transition-colors text-success"
                  >
                    <CheckCircle2 size={14} /> Mark Paid
                  </button>
                  <button 
                    onClick={handleBulkReminder}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-background/10 transition-colors text-info"
                  >
                    <Bell size={14} /> Send Reminder
                  </button>
                  <button 
                    onClick={handleBulkDownload}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-background/10 transition-colors text-background/60"
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
                
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="p-2 text-background/40 hover:text-background transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {filterInvoices.length > displayLimit && (
          <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50">
            <button 
              onClick={() => setDisplayLimit(prev => prev + 50)}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm"
            >
              Load More ({filterInvoices.length - displayLimit} remaining)
            </button>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {viewingInvoice && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-slate-200 relative flex flex-col md:flex-row"
            >
              {/* Sidebar Actions */}
              <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col gap-4">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800">Invoice Details</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{viewingInvoice.invoiceNumber}</p>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => generatePDF(`printable-invoice-${viewingInvoice.id}`, `Invoice_${viewingInvoice.invoiceNumber}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                  <button 
                    onClick={() => printInvoice(`printable-invoice-${viewingInvoice.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    <Printer size={16} /> Print Invoice
                  </button>
                  <button 
                    onClick={() => shareInvoice(viewingInvoice, settings)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all shadow-sm"
                  >
                    <Share2 size={16} /> Share Link
                  </button>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 space-y-2">
                  {viewingInvoice.type === 'estimate' && (
                    <button 
                      onClick={() => {
                        handleConvertToInvoice(viewingInvoice);
                        setViewingInvoice(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <CheckCircle2 size={16} /> Convert to Invoice
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => {
                        onEdit(viewingInvoice);
                        setViewingInvoice(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all shadow-sm"
                    >
                      <Pencil size={16} /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => {
                        setDeletingId(viewingInvoice.id);
                        setViewingInvoice(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-xs hover:bg-red-100 transition-all shadow-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button 
                    onClick={() => setViewingInvoice(null)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-300 transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Invoice Preview Section */}
              <div className="flex-1 bg-slate-200 p-4 md:p-8 overflow-y-auto max-h-[80vh] md:max-h-[90vh]">
                <div className="bg-white shadow-xl rounded-sm mx-auto overflow-hidden">
                  <InvoiceTemplate 
                    invoice={viewingInvoice} 
                    settings={settings} 
                  />
                </div>
              </div>

              {/* Close Button Mobile */}
              <button 
                onClick={() => setViewingInvoice(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/10 hover:bg-slate-900/20 rounded-full text-slate-600 md:hidden"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Delete {activeTab === 'invoice' ? 'Invoice' : 'Quote'}?</h3>
                  <p className="text-sm text-slate-500 mt-2">This action cannot be undone. This record will be permanently removed.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-200 hover:brightness-110 transition-all font-bold"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Templates for PDF/Print Generation */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none z-[-1] bg-white">
        {filterInvoices.filter(inv => selectedIds.has(inv.id) || displayedInvoices.some(d => d.id === inv.id)).map(inv => (
          <div key={inv.id} id={`printable-invoice-${inv.id}`} className="bg-white p-8 w-[800px]">
            <InvoiceTemplate 
              invoice={inv} 
              settings={settings} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
