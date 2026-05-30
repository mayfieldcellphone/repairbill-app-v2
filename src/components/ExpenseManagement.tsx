import React, { useState, useEffect } from 'react';
import { Expense, Supplier, InvoiceSettings } from '../lib/types';
import { 
  History, 
  Users, 
  Plus, 
  TrendingDown, 
  Calendar, 
  ArrowRight, 
  Search, 
  Filter, 
  X, 
  DollarSign,
  ShoppingCart,
  Building,
  Zap,
  Shield,
  Phone,
  FileText,
  Mail,
  MapPin,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Printer,
  Share2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ExpenseManagementProps {
  settings: InvoiceSettings;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

const ROUTINE_EXPENSES = [
  { id: 'rent', name: 'Shop Rent', category: 'Shop Rent', icon: <Building size={16} /> },
  { id: 'ads', name: 'Ads', category: 'Ads', icon: <DollarSign size={16} /> },
  { id: 'elec', name: 'Electricity', category: 'Electricity', icon: <Zap size={16} /> },
  { id: 'ins', name: 'Insurance', category: 'Insurance', icon: <Shield size={16} /> },
  { id: 'adt', name: 'ADT Security', category: 'ADT Security', icon: <Shield size={16} /> },
  { id: 'phone', name: 'Phone Orders', category: 'Phone Orders', icon: <Phone size={16} /> },
];

export function ExpenseManagement({ 
  settings, 
  expenses, 
  onAddExpense, 
  onDeleteExpense,
  suppliers,
  onAddSupplier,
  onDeleteSupplier
}: ExpenseManagementProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'suppliers'>('expenses');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const theme = settings.appTheme || 'modern';

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    amount: 0,
    paymentMethod: 'Cash',
    status: 'paid'
  });

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    category: 'Parts'
  });

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        date: newExpense.date || editingExpense.date,
        description: newExpense.description || editingExpense.description,
        category: (newExpense.category as any) || editingExpense.category,
        amount: Number(newExpense.amount),
        supplierId: newExpense.supplierId,
        paymentMethod: (newExpense.paymentMethod as any) || editingExpense.paymentMethod,
        status: (newExpense.status as any) || editingExpense.status,
        reference: newExpense.reference,
        notes: newExpense.notes
      };
      onAddExpense(updatedExpense);
    } else {
      const expense: Expense = {
        id: `exp-${Date.now()}`,
        date: newExpense.date || new Date().toISOString().split('T')[0],
        description: newExpense.description!,
        category: newExpense.category as any,
        amount: Number(newExpense.amount),
        supplierId: newExpense.supplierId,
        paymentMethod: newExpense.paymentMethod as any,
        status: newExpense.status as any,
        reference: newExpense.reference,
        notes: newExpense.notes
      };
      onAddExpense(expense);
    }

    setShowAddExpense(false);
    setEditingExpense(null);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      amount: 0,
      paymentMethod: 'Cash',
      status: 'paid'
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      supplierId: expense.supplierId,
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      reference: expense.reference,
      notes: expense.notes
    });
    setShowAddExpense(true);
  };

  const printExpense = (expense: Expense) => {
    const supplier = suppliers.find(s => s.id === expense.supplierId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Receipt - ${expense.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; }
            .meta { text-align: right; font-size: 14px; }
            .details { margin-bottom: 40px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .total { margin-top: 20px; border-top: 2px solid #0f172a; padding-top: 20px; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Expense Receipt</div>
              <div>${settings.companyName}</div>
            </div>
            <div class="meta">
              <div>Date: ${expense.date}</div>
              <div>Ref: ${expense.id}</div>
            </div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Description</span><span>${expense.description}</span></div>
            <div class="row"><span class="label">Category</span><span>${expense.category}</span></div>
            <div class="row"><span class="label">Supplier</span><span>${supplier?.name || 'Direct'}</span></div>
            <div class="row"><span class="label">Payment Method</span><span>${expense.paymentMethod}</span></div>
            <div class="row"><span class="label">Status</span><span style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #059669;">${expense.status}</span></div>
            ${expense.reference ? `<div class="row"><span class="label">Reference #</span><span>${expense.reference}</span></div>` : ''}
          </div>
          <div class="total">
            <div class="row"><span>Total Amount</span><span>${settings.currency} ${expense.amount.toLocaleString()}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const shareExpense = (expense: Expense) => {
    const supplier = suppliers.find(s => s.id === expense.supplierId);
    const text = `Expense Record: ${expense.description}\nDate: ${expense.date}\nAmount: ${settings.currency} ${expense.amount}\nCategory: ${expense.category}\nSupplier: ${supplier?.name || 'Direct'}\nStatus: ${expense.status}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Expense Record - ${expense.description}`,
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Expense details copied to clipboard!');
    }
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name) return;

    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      category: newSupplier.category as any,
      contactPerson: newSupplier.contactPerson,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      notes: newSupplier.notes,
      createdAt: new Date().toISOString()
    };

    onAddSupplier(supplier);
    setShowAddSupplier(false);
    setNewSupplier({ category: 'Parts' });
  };

  const quickAdd = (config: typeof ROUTINE_EXPENSES[0]) => {
    setNewExpense({
      description: config.name,
      category: config.category as any,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
    });
    setShowAddExpense(true);
  };

  const handleDeleteExpense = (id: string) => {
    onDeleteExpense(id);
  };

  const handleDeleteSupplier = (id: string) => {
    onDeleteSupplier(id);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn(
      "space-y-6 max-w-7xl mx-auto",
      theme === 'cyber' && "text-slate-100",
      theme === 'minimalist' && "font-serif"
    )}>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className={cn(
          "flex p-1 rounded-xl w-fit",
          theme === 'cyber' ? "bg-slate-800" : theme === 'minimalist' ? "bg-zinc-100 rounded-none border border-zinc-200" : "bg-slate-100"
        )}>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest",
              activeTab === 'expenses' 
                ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-lg" : theme === 'minimalist' ? "bg-white text-zinc-900 rounded-none border border-zinc-300 shadow-none" : "bg-white text-blue-600 shadow-sm") 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <History size={14} /> Expenses
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest",
              activeTab === 'suppliers' 
                ? (theme === 'cyber' ? "bg-cyan-500 text-slate-900 shadow-lg" : theme === 'minimalist' ? "bg-white text-zinc-900 rounded-none border border-zinc-300 shadow-none" : "bg-white text-blue-600 shadow-sm") 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Users size={14} /> Suppliers
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder={activeTab === 'expenses' ? "Search expenses..." : "Search suppliers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-9 pr-4 py-2.5 transition-all focus:ring-2 outline-none border",
                theme === 'cyber' ? "bg-slate-800 border-slate-700 text-white rounded-xl focus:ring-cyan-500 w-64" :
                theme === 'minimalist' ? "bg-zinc-50 border-zinc-200 text-zinc-900 rounded-none w-64 focus:ring-zinc-400" :
                "bg-white border-slate-200 rounded-xl text-xs w-64 focus:ring-blue-500"
              )}
            />
          </div>
          {activeTab === 'expenses' ? (
            <button 
              onClick={() => setShowAddExpense(true)}
              className={cn(
                "px-5 py-2.5 font-bold text-xs flex items-center gap-2 transition-all",
                theme === 'cyber' ? "bg-cyan-500 text-slate-900 rounded-xl hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
                theme === 'minimalist' ? "bg-zinc-900 text-white rounded-none hover:bg-zinc-800" :
                "bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700"
              )}
            >
              <Plus size={16} /> New Expense
            </button>
          ) : (
            <button 
              onClick={() => setShowAddSupplier(true)}
              className={cn(
                "px-5 py-2.5 font-bold text-xs flex items-center gap-2 transition-all",
                theme === 'cyber' ? "bg-cyan-500 text-slate-900 rounded-xl hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
                theme === 'minimalist' ? "bg-zinc-900 text-white rounded-none hover:bg-zinc-800" :
                "bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700"
              )}
            >
              <Plus size={16} /> Add Supplier
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'expenses' ? (
          <motion.div 
            key="expenses-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ROUTINE_EXPENSES.map(routine => (
                <button
                  key={routine.id}
                  onClick={() => quickAdd(routine)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 mb-3 transition-colors">
                    {routine.icon}
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Routine</h4>
                  <p className="text-xs font-bold text-slate-800">{routine.name}</p>
                </button>
              ))}
            </div>

            {/* Expenses List */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <TrendingDown size={14} className="text-red-500" />
                  Total Outflow: {settings.currency} {expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Description</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <History size={40} className="mx-auto text-slate-200 mb-3" />
                          <p className="text-sm text-slate-400 font-medium">No expenses found</p>
                        </td>
                      </tr>
                    ) : filteredExpenses.map(expense => (
                      <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{expense.description}</span>
                            <span className="text-[10px] font-medium text-slate-400">{expense.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold",
                            expense.category === 'Shop Rent' ? "bg-amber-100 text-amber-600" :
                            expense.category === 'Phone Orders' ? "bg-blue-100 text-blue-600" :
                            expense.category === 'Electricity' ? "bg-yellow-100 text-yellow-600" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-600 italic">
                            {suppliers.find(s => s.id === expense.supplierId)?.name || 'Direct / Local'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">
                            {settings.currency} {expense.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => printExpense(expense)}
                              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Print Receipt"
                            >
                              <Printer size={14} />
                            </button>
                            <button 
                              onClick={() => shareExpense(expense)}
                              className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                              title="Share Details"
                            >
                              <Share2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleEditExpense(expense)}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit Expense"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            key="suppliers-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No suppliers registered yet</p>
                <button 
                  onClick={() => setShowAddSupplier(true)}
                  className="mt-4 text-blue-600 text-xs font-bold hover:underline"
                >
                  Create your first supplier
                </button>
              </div>
            ) : filteredSuppliers.map(supplier => (
              <Card key={supplier.id} className="border border-slate-100 shadow-sm rounded-3xl hover:border-blue-200 transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShoppingCart size={24} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-1">{supplier.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                        {supplier.category}
                      </span>
                      {supplier.contactPerson && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {supplier.contactPerson}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-6">
                      {supplier.phone && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <Phone size={12} />
                          <span className="text-[11px] font-medium">{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <Mail size={12} />
                          <span className="text-[11px] font-medium">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <MapPin size={12} />
                          <span className="text-[11px] font-medium truncate">{supplier.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Spend</span>
                        <span className="text-xs font-bold text-slate-800">
                          {settings.currency} {expenses.filter(e => e.supplierId === supplier.id).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setNewExpense({
                            supplierId: supplier.id,
                            description: `Order from ${supplier.name}`,
                            category: 'Phone Orders'
                          });
                          setShowAddExpense(true);
                        }}
                        className="text-blue-600 text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                      >
                        Log Order <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{editingExpense ? 'Edit Expense' : 'Record Expense'}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{editingExpense ? 'Update Entry' : 'Operational Cost Entry'}</p>
                </div>
                <button onClick={() => { setShowAddExpense(false); setEditingExpense(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <input 
                    type="text"
                    placeholder="e.g. Parts Batch #44"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none appearance-none"
                    >
                      {['Shop Rent', 'Ads', 'Electricity', 'Insurance', 'ADT Security', 'Phone Orders', 'Supplier Payment', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Amount ({settings.currency})</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                    <input 
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplier</label>
                    <select 
                      value={newExpense.supplierId || ''}
                      onChange={(e) => setNewExpense({...newExpense, supplierId: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none appearance-none"
                    >
                      <option value="">Direct / Non-Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="NEW">+ Add New Supplier</option>
                    </select>
                    {newExpense.supplierId === 'NEW' && (
                      <button 
                        onClick={() => {
                          setNewExpense({...newExpense, supplierId: ''});
                          setShowAddSupplier(true);
                        }}
                        className="text-[10px] font-bold text-blue-600 mt-1 hover:underline px-1"
                      >
                        Create supplier profile first
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setShowAddExpense(false); setEditingExpense(null); }} className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm">Cancel</button>
                  <button 
                    onClick={handleAddExpense}
                    className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-100 text-sm"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {editingExpense ? 'Update Expense' : 'Post Expense'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddSupplier && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Add Supplier</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">New Partnership</p>
                </div>
                <button onClick={() => setShowAddSupplier(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplier Business Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Global Tech Parts"
                    value={newSupplier.name || ''}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Person</label>
                    <input 
                      type="text"
                      placeholder="Name"
                      value={newSupplier.contactPerson || ''}
                      onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                    <select 
                      value={newSupplier.category}
                      onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value as any})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none appearance-none"
                    >
                      {['Parts', 'Utilities', 'Services', 'Rent', 'Insurance', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                    <input 
                      type="email"
                      placeholder="supplier@example.com"
                      value={newSupplier.email || ''}
                      onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                    <input 
                      type="text"
                      placeholder="Number"
                      value={newSupplier.phone || ''}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
                  <textarea 
                    rows={2}
                    placeholder="Physical address..."
                    value={newSupplier.address || ''}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-800 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowAddSupplier(false)} className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm">Cancel</button>
                  <button 
                    onClick={handleAddSupplier}
                    className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-100 text-sm"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    Save Supplier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
