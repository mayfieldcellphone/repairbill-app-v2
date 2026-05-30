export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  category: 'Parts' | 'Utilities' | 'Services' | 'Rent' | 'Insurance' | 'Other';
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: 'Shop Rent' | 'Ads' | 'Electricity' | 'Insurance' | 'ADT Security' | 'Phone Orders' | 'Supplier Payment' | 'Tools' | 'Staff' | 'Marketing' | 'Other';
  amount: number;
  supplierId?: string; // Optional link to a supplier
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  status: 'paid' | 'pending';
  reference?: string; // Invoice number or receipt ref
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: 'Suppliers' | 'Shop Rent' | 'Advertise' | 'Utility Bills' | 'Insurance' | 'Sales' | 'Software' | 'Services' | 'Marketing' | 'Operations' | 'Other';
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
}

export interface Metric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartData {
  name: string;
  income: number;
  expenses: number;
  cashFlow: number;
}

export interface PayableReceivable {
  id: string;
  partner: string;
  amount: number;
  dueDate: string;
  status: 'overdue' | 'upcoming' | 'paid';
}

export interface ProductModel {
  id: string;
  name: string;
  releaseYear?: number;
  order?: number;
}

export interface ProductSeries {
  id: string;
  name: string; // e.g., "iPhone", "MacBook"
  models: ProductModel[];
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  series: ProductSeries[];
  order?: number;
}

export interface RepairService {
  id: string;
  name: string;
  category: 'hardware' | 'software' | 'accessory' | 'other';
  basePrice: number;
  hidden?: boolean;
}

export interface InvoiceItem {
  id: string;
  serviceId: string;
  brandName: string;
  modelName: string;
  serviceName: string;
  price: number;
  quantity: number;
}

export interface InvoiceSettings {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  primaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  template: 'modern' | 'classic' | 'minimalist';
  showLogo: boolean;
  footerMessage: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  estimatePrefix: string;
  warrantyPeriod: string;
  appTheme: 'modern' | 'cyber' | 'minimalist';
  taxInclusive: boolean;
  notes?: string;
  logo?: string;
  hideCompanyName?: boolean;
  companyNameSize?: 'sm' | 'md' | 'lg' | 'xl';
  charlaApiKey?: string;
  creationFlowOrder?: 'brand-first' | 'service-first';
  dashboardServiceIds?: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerNotes?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void' | 'estimate';
  type: 'invoice' | 'estimate';
  paymentMethod?: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
}

export interface Lead {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject?: string;
  message: string;
  type: 'contact' | 'quote' | 'booking' | 'corporate' | 'voice_message';
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
  metadata?: {
    source?: string;
    brand?: string;
    model?: string;
    recordingDuration?: string;
    companyName?: string;
    [key: string]: any;
  };
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'suspended';
  apiKey?: string;
  createdAt: string;
}
