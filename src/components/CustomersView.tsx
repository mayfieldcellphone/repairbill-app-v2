import React, { useState } from 'react';
import { Customer } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  MoreVertical,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersViewProps {
  customers: Customer[];
}

export function CustomersView({ customers }: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Customer Database</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and track your repeat clients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full md:w-64 rounded-xl border-border bg-muted/50 focus:bg-card transition-all text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <motion.div 
            key={customer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-100">
                    {customer.name[0]}
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
                    {customer.company && (
                      <div className="flex items-center gap-1.5 text-blue-600 mt-0.5">
                        <Building2 size={12} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{customer.company}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Mail size={14} className="shrink-0" />
                      <span className="text-xs font-medium truncate">{customer.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <Phone size={14} className="shrink-0" />
                      <span className="text-xs font-medium">{customer.phone || 'No phone provided'}</span>
                    </div>
                    {customer.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Notes</p>
                        <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed">"{customer.notes}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-400 pt-2 border-t border-slate-50">
                      <Calendar size={12} className="shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Since {new Date(customer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
          <User size={48} className="mb-4 opacity-5" />
          <p className="text-sm font-bold uppercase tracking-widest">No customers found</p>
          <p className="text-xs mt-2">Customers are automatically added when you create an invoice with their details.</p>
        </div>
      )}
    </div>
  );
}
