import { Transaction, Metric, ChartData, PayableReceivable, Lead } from './types';

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@example.com',
    customerPhone: '0412 345 678',
    message: 'I need a screen replacement for my iPhone 15 Pro. How much will it cost?',
    type: 'quote',
    status: 'new',
    createdAt: new Date().toISOString(),
    metadata: {
      source: 'mayfieldphonerepair.com.au',
      brand: 'Apple',
      model: 'iPhone 15 Pro'
    }
  },
  {
    id: 'l2',
    customerName: 'TechCorp Solutions',
    customerEmail: 'procurement@techcorp.com',
    customerPhone: '02 9876 5432',
    message: 'We have 20 iPads that need battery replacements for our staff.',
    type: 'corporate',
    status: 'read',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    metadata: {
      source: 'mayfieldphonerepair.com.au',
      companyName: 'TechCorp Solutions Pty Ltd',
      brand: 'Apple',
      model: 'iPad Air 5'
    }
  },
  {
    id: 'l3',
    customerName: 'Voice Mail',
    customerEmail: 'noreply@incoming-leads.com',
    message: 'Left a voice message regarding a Mac repair.',
    type: 'voice_message',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    metadata: {
      source: 'mayfieldphonerepair.com.au',
      recordingDuration: '1:45'
    }
  },
  {
    id: 'l4',
    customerName: 'David Miller',
    customerEmail: 'david@gmail.com',
    message: 'Booked in for charging port repair tomorrow at 10am.',
    type: 'booking',
    status: 'replied',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    metadata: {
      source: 'mayfieldphonerepair.com.au',
      brand: 'Samsung',
      model: 'S23 Ultra'
    }
  }
];

export const METRICS: Metric[] = [
  { label: 'Total Income', value: 125430, change: 12.5, trend: 'up' },
  { label: 'Total Expenses', value: 84210, change: -4.2, trend: 'down' },
  { label: 'Cash Flow', value: 41220, change: 8.1, trend: 'up' },
  { label: 'Net Profit', value: 38500, change: 15.3, trend: 'up' },
];

export const CHART_DATA: ChartData[] = [
  { name: 'Jan', income: 45000, expenses: 32000, cashFlow: 13000 },
  { name: 'Feb', income: 52000, expenses: 35000, cashFlow: 17000 },
  { name: 'Mar', income: 48000, expenses: 38000, cashFlow: 10000 },
  { name: 'Apr', income: 61000, expenses: 42000, cashFlow: 19000 },
  { name: 'May', income: 55000, expenses: 39000, cashFlow: 16000 },
  { name: 'Jun', income: 67000, expenses: 45000, cashFlow: 22000 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-06-01', description: 'Stripe Payout', category: 'Sales', amount: 4500.0, type: 'income', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: '2', date: '2024-06-02', description: 'AWS Infrastructure', category: 'Software', amount: 850.0, type: 'expense', status: 'completed', paymentMethod: 'Card' },
  { id: '3', date: '2024-06-03', description: 'Office Rent', category: 'Shop Rent', amount: 2500.0, type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: '4', date: '2024-06-04', description: 'Project Consulting', category: 'Services', amount: 3200.0, type: 'income', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: '5', date: '2024-06-05', description: 'Figma Subscription', category: 'Software', amount: 45.0, type: 'expense', status: 'completed', paymentMethod: 'Card' },
  { id: '6', date: '2024-06-06', description: 'Client Retainer', category: 'Sales', amount: 5000.0, type: 'income', status: 'pending', paymentMethod: 'Cash' },
  { id: '7', date: '2024-06-07', description: 'Marketing Ads', category: 'Advertise', amount: 1200.0, type: 'expense', status: 'completed', paymentMethod: 'Card' },
  { id: '8', date: '2024-06-08', description: 'Travel Expenses', category: 'Operations', amount: 320.0, type: 'expense', status: 'failed', paymentMethod: 'Other' },
  { id: '9', date: '2024-06-09', description: 'Hardware Suppliers', category: 'Suppliers', amount: 1540.0, type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: '10', date: '2024-06-10', description: 'Electricity Bill', category: 'Utility Bills', amount: 210.0, type: 'expense', status: 'completed', paymentMethod: 'Card' },
  { id: '11', date: '2024-06-11', description: 'Business Insurance', category: 'Insurance', amount: 450.0, type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
];

export const PAYABLES: PayableReceivable[] = [
  { id: 'p1', partner: 'Acme Corp', amount: 1200, dueDate: '2024-06-15', status: 'upcoming' },
  { id: 'p2', partner: 'Tech Solutions', amount: 850, dueDate: '2024-05-20', status: 'overdue' },
  { id: 'p3', partner: 'Cloud Services', amount: 450, dueDate: '2024-06-10', status: 'upcoming' },
];

export const RECEIVABLES: PayableReceivable[] = [
  { id: 'r1', partner: 'Global Industries', amount: 4500, dueDate: '2024-06-20', status: 'upcoming' },
  { id: 'r2', partner: 'Startup Inc', amount: 3200, dueDate: '2024-05-25', status: 'overdue' },
  { id: 'r3', partner: 'Design Studio', amount: 1500, dueDate: '2024-06-25', status: 'upcoming' },
];
