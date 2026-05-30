import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Plus, X, Receipt } from 'lucide-react';
import { TRANSACTIONS as INITIAL_TRANSACTIONS } from '../lib/mockData';
import { Transaction } from '../lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  const [newExpense, setNewExpense] = useState<{
    description: string;
    amount: string;
    category: Transaction['category'];
    paymentMethod: Transaction['paymentMethod'];
    date: string;
  }>({
    description: '',
    amount: '',
    category: 'Suppliers',
    paymentMethod: 'Card',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;

    const expense: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
      date: newExpense.date,
      type: 'expense',
      status: 'completed'
    };

    setTransactions([expense, ...transactions]);
    setShowAddExpense(false);
    setNewExpense({
      description: '',
      amount: '',
      category: 'Suppliers',
      paymentMethod: 'Card',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount: number, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Paid</span>;
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pending</span>;
      case 'failed':
        return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Failed</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Add New Expense</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Financial Transaction</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddExpense(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <Input 
                    placeholder="e.g., Shop Rent - July" 
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={newExpense.amount}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                        className="h-12 pl-8 rounded-xl border-slate-200 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                    <Input 
                      type="date"
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    {['Suppliers', 'Shop Rent', 'Advertise', 'Utility Bills', 'Insurance', 'Software', 'Operations', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Method</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {['Cash', 'Card', 'Bank Transfer', 'Other'].map(m => (
                      <button 
                        key={m}
                        onClick={() => setNewExpense({...newExpense, paymentMethod: m as any})}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold border transition-all",
                          newExpense.paymentMethod === m 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowAddExpense(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddExpense}
                    className="flex-[2] px-6 py-3 rounded-xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-sm"
                  >
                    Save Expense
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="text-sm font-semibold text-slate-800">Recent Transactions</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddExpense(true)}
            className="text-[10px] px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-blue-200"
          >
            <Plus size={14} /> Add Expense
          </button>
          <button className="text-[10px] px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-slate-500 uppercase tracking-wider transition-colors">
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Transaction</TableHead>
              <TableHead className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">Status</TableHead>
              <TableHead className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">Method</TableHead>
              <TableHead className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">Date</TableHead>
              <TableHead className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm divide-y divide-slate-100">
            {filteredTransactions.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors border-none group">
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{t.description}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t.category}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  {getStatusBadge(t.status)}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    {t.paymentMethod || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-slate-500 text-center font-medium">{t.date}</TableCell>
                <TableCell className={cn(
                  "px-6 py-4 text-right font-black",
                  t.type === 'income' ? "text-blue-600" : "text-slate-900"
                )}>
                  {formatCurrency(t.amount, t.type)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
