import React, { useState, useMemo } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Calendar, 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown,
  TrendingUp,
  CreditCard,
  DollarSign,
  Package,
  Clock,
  Search,
  FileText,
  Smartphone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Invoice, Expense, InvoiceSettings } from '../lib/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ReportsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  settings: InvoiceSettings;
}

type TimeInterval = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export function ReportsView({ invoices, expenses, settings }: ReportsViewProps) {
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const theme = settings.appTheme || 'modern';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    const allInvoices = invoices.filter(inv => inv.type === 'invoice');
    return allInvoices.filter(inv => {
      const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const parts = inv.date.split('-').map(Number);
      const invYear = parts[0];
      const invMonth = parts[1] - 1; // 0-indexed to match now.getMonth()
      
      const now = new Date();
      
      let matchesTime = true;
      if (timeInterval === 'monthly') {
        matchesTime = invMonth === now.getMonth() && invYear === now.getFullYear();
      } else if (timeInterval === 'quarterly') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const invQuarter = Math.floor(invMonth / 3);
        matchesTime = currentQuarter === invQuarter && invYear === now.getFullYear();
      } else if (timeInterval === 'yearly') {
        matchesTime = invYear === now.getFullYear();
      } else if (timeInterval === 'custom' && customRange.start && customRange.end) {
        matchesTime = inv.date >= customRange.start && inv.date <= customRange.end;
      }
      
      return matchesSearch && matchesTime;
    });
  }, [invoices, searchTerm, timeInterval, customRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const parts = exp.date.split('-').map(Number);
      const expYear = parts[0];
      const expMonth = parts[1] - 1; // 0-indexed to match now.getMonth()
      
      const now = new Date();
      
      let matchesTime = true;
      if (timeInterval === 'monthly') {
        matchesTime = expMonth === now.getMonth() && expYear === now.getFullYear();
      } else if (timeInterval === 'quarterly') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const expQuarter = Math.floor(expMonth / 3);
        matchesTime = currentQuarter === expQuarter && expYear === now.getFullYear();
      } else if (timeInterval === 'yearly') {
        matchesTime = expYear === now.getFullYear();
      } else if (timeInterval === 'custom' && customRange.start && customRange.end) {
        matchesTime = exp.date >= customRange.start && exp.date <= customRange.end;
      }
      
      return matchesSearch && matchesTime;
    });
  }, [expenses, searchTerm, timeInterval, customRange]);

  const stats = useMemo(() => {
    const income = filteredInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const cost = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const profit = income - cost;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    
    return { income, cost, profit, margin };
  }, [filteredInvoices, filteredExpenses]);

  const monthlyChartData = useMemo(() => {
    // Show last 6 months for context
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`; // Local YYYY-MM without UTC shifting
      
      const monthIncome = invoices
        .filter(inv => inv.type === 'invoice' && inv.date.startsWith(monthStr))
        .reduce((sum, inv) => sum + inv.total, 0);
        
      const monthExpenses = expenses
        .filter(exp => exp.date.startsWith(monthStr))
        .reduce((sum, exp) => sum + exp.amount, 0);
        
      data.push({
        name: monthYear,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }
    return data;
  }, [invoices, expenses]);

  const itemPerformance = useMemo(() => {
    const performance: Record<string, { count: number, total: number }> = {};
    
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.serviceName || 'General Service';
        if (!performance[key]) {
          performance[key] = { count: 0, total: 0 };
        }
        performance[key].count += item.quantity;
        performance[key].total += (item.price * item.quantity);
      });
    });
    
    return Object.entries(performance)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filters */}
      <div className={cn(
        "bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
        theme === 'minimalist' && "rounded-none shadow-none border-x-0"
      )}>
        <div>
          <h2 className="text-xl font-black text-foreground">Advanced Reports</h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Deep dive into your business health</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted p-1 rounded-2xl border border-border">
            {(['monthly', 'quarterly', 'yearly', 'custom'] as TimeInterval[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeInterval(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  timeInterval === tab 
                    ? "bg-card text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button className="p-2.5 bg-muted rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {timeInterval === 'custom' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4"
        >
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Start Date</label>
            <input 
              type="date" 
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">End Date</label>
            <input 
              type="date" 
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground"
            />
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: formatCurrency(stats.income), icon: <DollarSign size={16} />, color: 'bg-blue-500' },
          { label: 'Total Expenses', value: formatCurrency(stats.cost), icon: <ArrowUpRight size={16} className="rotate-90" />, color: 'bg-rose-500' },
          { label: 'Net Profit', value: formatCurrency(stats.profit), icon: <TrendingUp size={16} />, color: 'bg-emerald-500' },
          { label: 'Profit Margin', value: `${stats.margin.toFixed(1)}%`, icon: <Clock size={16} />, color: 'bg-amber-500' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm group hover:scale-[1.02] transition-all"
          >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg", stat.color)}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-black text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Income Graph */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Monthly Income vs Expenses</h3>
              <p className="text-[10px] text-muted-foreground font-bold mt-1">Comparing financial flow over the last 6 months</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="text-[9px] font-black text-muted-foreground uppercase">Income</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500" />
                 <span className="text-[9px] font-black text-muted-foreground uppercase">Expenses</span>
               </div>
            </div>
          </div>
          <div className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'cyber' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${val > 1000 ? (val/1000) + 'k' : val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl space-y-2">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{payload[0].payload.name}</p>
                           <div className="space-y-1">
                              <div className="flex justify-between gap-8">
                                 <span className="text-[10px] font-black text-blue-400 uppercase">Income</span>
                                 <span className="text-xs font-black text-white">{formatCurrency(payload[0].value as number)}</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                 <span className="text-[10px] font-black text-rose-400 uppercase">Expense</span>
                                 <span className="text-xs font-black text-white">{formatCurrency(payload[1].value as number)}</span>
                              </div>
                              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between gap-8">
                                 <span className="text-[10px] font-black text-emerald-400 uppercase">Profit</span>
                                 <span className="text-xs font-black text-white">{formatCurrency((payload[0].value as number) - (payload[1].value as number))}</span>
                              </div>
                           </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="income" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="bg-card rounded-3xl border border-border shadow-sm flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Top Repair Services</h3>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">Based on revenue for selected period</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {itemPerformance.length > 0 ? (
              <div className="space-y-6">
                {itemPerformance.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{item.name}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase">{item.count} repairs sold</span>
                      </div>
                      <span className="text-xs font-black text-primary">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.total / itemPerformance[0].total) * 100}%` }}
                        className="h-full bg-primary rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-3 py-12">
                <Package size={40} className="mx-auto text-muted/30" />
                <p className="text-xs font-bold text-muted-foreground">No repair data for this period.</p>
              </div>
            )}
          </div>
          {itemPerformance.length > 0 && (
            <div className="p-6 pt-0 mt-auto">
               <div className="bg-muted/50 rounded-2xl p-4 border border-border text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Leading Revenue Driver</p>
                  <p className="text-xs font-bold text-foreground">{itemPerformance[0].name}</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Transaction List for Report */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Transaction Audit Log</h3>
                <p className="text-[10px] text-muted-foreground font-bold italic uppercase">All income and expenses in view</p>
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-xs w-full sm:w-64 focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Entity / Description</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Category / Device</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Combine income and expenses for audit log */}
              {[
                ...filteredInvoices.map(inv => ({
                  date: inv.date,
                  description: inv.customerName,
                  type: 'Income' as const,
                  category: inv.items[0]?.modelName || 'Service',
                  amount: inv.total,
                  id: inv.id
                })),
                ...filteredExpenses.map(exp => ({
                  date: exp.date,
                  description: exp.description,
                  type: 'Expense' as const,
                  category: exp.category,
                  amount: -exp.amount,
                  id: exp.id
                }))
              ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-muted-foreground">{item.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          item.type === 'Income' ? "bg-emerald-500" : "bg-rose-500"
                       )} />
                       <span className="text-xs font-bold text-foreground">{item.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded border uppercase",
                      item.type === 'Income' 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "text-sm font-black",
                      item.type === 'Income' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {item.type === 'Income' ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </span>
                  </td>
                </tr>
              ))}
              {(filteredInvoices.length === 0 && filteredExpenses.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
