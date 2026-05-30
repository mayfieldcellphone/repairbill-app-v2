import React, { useState, useMemo } from 'react';
import { Invoice, Expense, InvoiceSettings } from '../lib/types';
import { 
  Calculator, 
  Calendar, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Download,
  Info,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BASCalculatorProps {
  invoices: Invoice[];
  expenses: Expense[];
  settings: InvoiceSettings;
}

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export function BASCalculator({ invoices, expenses, settings }: BASCalculatorProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const theme = settings.appTheme || 'modern';
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(() => {
    const month = new Date().getMonth();
    if (month >= 6 && month <= 8) return 'Q1';
    if (month >= 9 && month <= 11) return 'Q2';
    if (month >= 0 && month <= 2) return 'Q3';
    return 'Q4';
  });
  
  const [includeCash, setIncludeCash] = useState(true);

  // Quarter date ranges (Financial Year usually starts July in AU)
  const quarterRanges = {
    Q1: { label: 'JUL-SEP', start: `${selectedYear}-07-01`, end: `${selectedYear}-09-30` },
    Q2: { label: 'OCT-DEC', start: `${selectedYear}-10-01`, end: `${selectedYear}-12-31` },
    Q3: { label: 'JAN-MAR', start: `${selectedYear + 1}-01-01`, end: `${selectedYear + 1}-03-31` },
    Q4: { label: 'APR-JUN', start: `${selectedYear + 1}-04-01`, end: `${selectedYear + 1}-06-30` },
  };

  const currentRange = quarterRanges[selectedQuarter];

  const basData = useMemo(() => {
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);

    // Filtered Revenue
    const qInvoices = invoices.filter(inv => {
      const date = new Date(inv.date);
      const isPaid = inv.status === 'paid';
      const isInvoice = inv.type === 'invoice';
      const isCash = inv.paymentMethod === 'Cash';
      return date >= start && date <= end && isPaid && isInvoice && (includeCash || !isCash);
    });

    const totalIncome = Math.round(qInvoices.reduce((acc, inv) => acc + inv.total, 0));
    const gstOnSales = Math.round(totalIncome / 11); // Standard AU GST

    // Filtered Expenses
    const qExpenses = expenses.filter(exp => {
      const date = new Date(exp.date);
      return date >= start && date <= end && exp.status === 'paid';
    });

    const totalExpenses = Math.round(qExpenses.reduce((acc, exp) => acc + exp.amount, 0));
    const gstOnPurchases = Math.round(totalExpenses / 11);

    // Categorized Expenses (for the breakdown)
    const categorized = qExpenses.reduce((acc, exp) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      gstOnSales,
      totalExpenses,
      gstOnPurchases,
      netGST: gstOnSales - gstOnPurchases,
      categorized,
      invoiceCount: qInvoices.length,
      expenseCount: qExpenses.length
    };
  }, [invoices, expenses, currentRange, includeCash]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={cn(
      "max-w-5xl mx-auto space-y-8 pb-12",
      theme === 'cyber' && "text-slate-100",
      theme === 'minimalist' && "font-serif"
    )}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={cn(
            "text-2xl font-black tracking-tight flex items-center gap-3",
            theme === 'cyber' ? "text-white uppercase italic" : "text-slate-800"
          )}>
            <Calculator className={theme === 'cyber' ? "text-cyan-400" : "text-blue-600"} size={28} />
            BAS Activity Statement
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Activity for {currentRange.label} {selectedQuarter === 'Q3' || selectedQuarter === 'Q4' ? selectedYear + 1 : selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <label className="text-[10px] font-black uppercase text-slate-400">Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={cn(
                "bg-transparent text-xs font-bold focus:outline-none",
                theme === 'cyber' ? "text-cyan-400" : "text-slate-800"
              )}
            >
              {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
              ))}
            </select>
          </div>
          <div className={cn(
            "flex p-1 rounded-xl",
            theme === 'cyber' ? "bg-slate-800" : theme === 'minimalist' ? "bg-zinc-100 rounded-none border border-zinc-200" : "bg-slate-100"
          )}>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase",
                  selectedQuarter === q 
                    ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-lg" : theme === 'minimalist' ? "bg-white text-zinc-900 rounded-none border border-zinc-300 shadow-none" : "bg-white text-blue-600 shadow-sm") 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIncludeCash(!includeCash)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold flex items-center gap-2 border transition-all shadow-sm",
              theme === 'minimalist' ? "rounded-none" : "rounded-xl",
              includeCash 
                ? (theme === 'cyber' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-emerald-50 border-emerald-100 text-emerald-700") 
                : (theme === 'cyber' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-100 text-amber-700")
            )}
          >
            <Download size={14} /> 
            {includeCash ? "Cash Included" : "Cash Excluded"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main BAS Factors */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden">
            <div className="bg-slate-900 p-8 text-white">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Financial Summary</h3>
                  <p className="text-lg font-bold">Tax Position (Net GST)</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-3xl font-black",
                    basData.netGST >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {formatCurrency(Math.abs(basData.netGST))}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {basData.netGST >= 0 ? "Payable to ATO" : "Refund Expected"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Sales (G1)</p>
                  <p className="text-xl font-bold">{formatCurrency(basData.totalIncome)}</p>
                </div>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">GST on Sales (A1)</p>
                  <p className="text-xl font-bold">{formatCurrency(basData.gstOnSales)}</p>
                </div>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">GST on Cost (B1)</p>
                  <p className="text-xl font-bold">{formatCurrency(basData.gstOnPurchases)}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Expense Breakdown</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{basData.expenseCount} Transactions Found</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] px-2">
                    <span>Category</span>
                    <div className="flex gap-16">
                      <span className="w-24 text-right">Inc-GST</span>
                      <span className="w-24 text-right">Ex-GST</span>
                    </div>
                  </div>
                  
                  {Object.entries(basData.categorized).length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">No expenses recorded for this period</p>
                    </div>
                  ) : Object.entries(basData.categorized).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                      <span className="text-xs font-bold text-slate-700">{cat}</span>
                      <div className="flex gap-16">
                        <span className="w-24 text-right text-xs font-bold text-slate-600">{formatCurrency(amount as number)}</span>
                        <span className="w-24 text-right text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">{formatCurrency((amount as number) / 1.1)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-6 border-t-2 border-slate-100 flex justify-between items-center px-4">
                    <span className="text-sm font-black text-slate-800">TOTAL EXPENSES</span>
                    <div className="flex gap-16">
                      <span className="w-24 text-right text-sm font-black text-slate-800">{formatCurrency(basData.totalExpenses)}</span>
                      <span className="w-24 text-right text-sm font-bold text-slate-400">{formatCurrency(basData.totalExpenses / 1.1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info & Side Stats */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden bg-blue-50/30">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <Info size={24} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">ATO Filing Guide</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                Use these values directly when completing your Business Activity Statement on the ATO Business Portal. 
                Values are calculated based on GST-inclusive amounts found in your invoices and expenses.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100/50">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">G1</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Sales</p>
                    <p className="text-xs font-bold text-slate-800">{formatCurrency(basData.totalIncome)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100/50">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">A1</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">GST on Sales</p>
                    <p className="text-xs font-bold text-slate-800">{formatCurrency(basData.gstOnSales)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100/50">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">B1</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">GST on Cost</p>
                    <p className="text-xs font-bold text-slate-800">{formatCurrency(basData.gstOnPurchases)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Quick Breakdown</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400">Net Profit (Pre-tax)</span>
                    <span>{formatCurrency(Number(basData.totalIncome) - Number(basData.totalExpenses))}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${Math.min(100, Math.max(0, ((Number(basData.totalIncome) - Number(basData.totalExpenses)) / (Number(basData.totalIncome) || 1)) * 100))}%` }} 
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-400">{basData.invoiceCount} Invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-400">{basData.expenseCount} Expenses</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
