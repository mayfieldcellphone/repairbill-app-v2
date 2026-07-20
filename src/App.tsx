import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  ChevronDown, 
  ChevronLeft,
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Wallet,
  PieChart,
  Activity,
  Menu,
  X,
  Printer,
  Sparkles,
  LayoutDashboard,
  CreditCard,
  FileText,
  Smartphone,
  Settings,
  LogIn,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Mic,
  Clock
} from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { FinancialChart } from './components/FinancialChart';
import { TransactionsList } from './components/TransactionsList';
import { AccountsOverview } from './components/AccountsOverview';
import { TRANSACTIONS, METRICS } from './lib/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice, InvoiceSettings, Expense, Brand, Customer, Supplier, Lead, RepairService } from './lib/types';
import { getBrandCatalog, saveBrandOrder } from './lib/deviceStore';
import { getSavedServices } from './lib/serviceData';
import { cn } from '@/lib/utils';

import { SettingsView } from './components/SettingsView';
import { CatalogView } from './components/CatalogView';
import { InvoiceCreator } from './components/InvoiceCreator';
import { InvoiceManagement } from './components/InvoiceManagement';
import { RepairDashboard } from './components/RepairDashboard';
import { CustomersView } from './components/CustomersView';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ExpenseManagement } from './components/ExpenseManagement';
import { BASCalculator } from './components/BASCalculator';
import { AIInvoiceAgent } from './components/AIInvoiceAgent';
import { ImportManager } from './components/ImportManager';
import { UserManagement } from './components/UserManagement';
import { ReportsView } from './components/ReportsView';

import { AIPanelLeadsFeed } from './components/AIPanelLeadsFeed';
import { useAuth } from './contexts/AuthContext';
import { saveDocument, saveDocumentsBatch, removeDocument, subscribeToDocuments } from './lib/firestore';

const MOCK_INVOICES: Invoice[] = [];

function LoginPage() {
  const { signIn, signInWithEmail, signUpWithEmail, signInDemo } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your name');
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      const isAuthDomainErr = err.code?.includes('unauthorized-domain') || err.message?.includes('authorized domain');
      if (isAuthDomainErr) {
        setError("This domain is not authorized in your Firebase console yet. Please use the instant Sandbox Bypass buttons below to test the app with full privileges!");
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-blue-100/50 border border-slate-100 p-8 sm:p-10"
      >
        <div className="text-center space-y-3 mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center mx-auto shadow-xl shadow-blue-200"
          >
            <Smartphone size={32} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">RepairBill</h1>
            <p className="text-slate-500 font-medium text-sm">
              {isLogin ? 'Welcome back to your repair studio' : 'Start your professional repair studio today'}
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-1.5 text-red-700 text-xs font-semibold leading-relaxed"
          >
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertCircle size={16} className="shrink-0" />
              <span>Authentication Alert</span>
            </div>
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="repairer@example.com"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
              {isLogin && (
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Forgot?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Log In' : 'Sign Up'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 py-1 bg-white text-slate-400 font-bold uppercase tracking-widest">or continue with</span>
          </div>
        </div>

        <button 
          onClick={() => {
            setError(null);
            signIn().catch((err: any) => {
              console.error(err);
              if (err.code?.includes('unauthorized-domain') || err.message?.includes('domain')) {
                setError("Google Auth domain not authorized yet. Use one of our dynamic Sandbox options below to sign in instantly!");
              } else {
                setError(err.message || 'Google Auth failed or was cancelled');
              }
            });
          }}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 px-6 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google Account
        </button>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 py-1 bg-white text-emerald-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-1 bg-emerald-50 rounded-full border border-emerald-100">
              <Sparkles size={11} className="text-emerald-500 animate-pulse" /> Direct Sandbox Bypass
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            Running in preview? Click below to instantly log in offline & bypass security domains:
          </p>
          <button 
            type="button"
            onClick={() => signInDemo('mayfieldcellphonerepairs@gmail.com', 'Mayfield Repair Owner')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black uppercase tracking-widest text-xs py-3.5 px-6 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md shadow-emerald-100/30 active:scale-[0.98]"
          >
            Launch as Owner (Admin Role)
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => signInDemo('technician@mayfieldrepairs.com', 'Lead Tech')}
              className="text-center bg-slate-50 border border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-all"
            >
              Log in as Staff
            </button>
            <button 
              type="button"
              onClick={() => signInDemo('guest@testing.com', 'Testing Guest')}
              className="text-center bg-slate-50 border border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-all"
            >
              Log in as Guest
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-sm font-medium text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-blue-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign up free' : 'Log in here'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoiceFilter, setInvoiceFilter] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [creatorType, setCreatorType] = useState<'invoice' | 'estimate'>('invoice');
  const [presetBrandName, setPresetBrandName] = useState<string | undefined>(undefined);
  const [presetServiceName, setPresetServiceName] = useState<string | undefined>(undefined);
  const [presetServiceIds, setPresetServiceIds] = useState<string[] | undefined>(undefined);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [brands, setBrands] = useState<Brand[]>(() => getBrandCatalog());
  const [services, setServices] = useState<RepairService[]>(() => getSavedServices());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<InvoiceSettings>({
    companyName: 'Mayfield Phone Repair',
    address: '123 Repair St, Tech City',
    email: 'contact@mayfieldphonerepair.com.au',
    phone: '0400 123 456',
    website: 'https://mayfieldphonerepair.com.au',
    primaryColor: '#2563eb',
    fontFamily: 'sans',
    template: 'modern',
    showLogo: true,
    footerMessage: 'Thank you for choosing Mayfield Phone Repair!',
    currency: 'AUD',
    taxRate: 10,
    invoicePrefix: 'INV-',
    estimatePrefix: 'EST-',
    warrantyPeriod: '90 Days',
    appTheme: 'modern',
    taxInclusive: true,
    charlaApiKey: '',
    creationFlowOrder: 'brand-first',
    aiProvider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash',
    openaiApiKey: '',
    openaiEndpoint: ''
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Sync Settings from Firestore
  useEffect(() => {
    if (!user) return;
    return subscribeToDocuments<InvoiceSettings>(`users/${user.uid}/settings`, (data) => {
      if (data.length > 0) {
        setSettings(data[0]);
      }
    });
  }, [user]);

  // Sync Invoices from PostgreSQL (VPS)
  useEffect(() => {
    if (!user) return;
    
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/invoices', {
          headers: { 'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b' }
        });
        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error("Failed to fetch invoices from VPS", error);
      }
    };

    fetchInvoices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchInvoices, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync Expenses from PostgreSQL (VPS)
  useEffect(() => {
    if (!user) return;
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses', {
          headers: { 'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b' }
        });
        if (response.ok) {
          const data = await response.json();
          setExpenses(data);
        }
      } catch (error) {
        console.error("Failed to fetch expenses from VPS", error);
      }
    };
    fetchExpenses();
    const interval = setInterval(fetchExpenses, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync Brands from Firestore
  useEffect(() => {
    if (!user) return;
    return subscribeToDocuments<Brand>(`users/${user.uid}/brands`, (data) => {
      if (data.length > 0) {
        // Sort by custom order if it exists, otherwise keep as is (natural sort from deviceStore)
        const hasOrder = data.some(b => b.order !== undefined);
        let sorted = [];
        if (hasOrder) {
          sorted = [...data].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        } else {
          // Fallback to alphabetical if no custom order is found
          sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        }
        setBrands(sorted);
        saveBrandOrder(sorted);
      }
    });
  }, [user]);

  // Sync Suppliers from Firestore
  useEffect(() => {
    if (!user) return;
    return subscribeToDocuments<Supplier>(`users/${user.uid}/suppliers`, (data) => {
      setSuppliers(data);
    });
  }, [user]);

  // Sync Customers from PostgreSQL (VPS)
  useEffect(() => {
    if (!user) return;
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers', {
          headers: { 'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b' }
        });
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Failed to fetch customers from VPS", error);
      }
    };
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync Leads from Firestore
  useEffect(() => {
    if (!user) return;
    return subscribeToDocuments<Lead>(`users/${user.uid}/leads`, (data) => {
      setLeads(data);
    });
  }, [user]);

  // Sync Services from Firestore
  useEffect(() => {
    if (!user) return;
    return subscribeToDocuments<RepairService>(`users/${user.uid}/services`, async (data) => {
      if (data.length > 0) {
        // Sort by 'order' if it exists, fallback to name or existing order
        const sorted = [...data].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
             return a.order - b.order;
          }
          return 0; // maintain original if order not found
        });
        setServices(sorted);
        localStorage.setItem('honeybill_custom_services', JSON.stringify(sorted));
      } else {
        // Bootstrap the database collection if it is currently empty!
        const initial = getSavedServices();
        if (initial && initial.length > 0) {
          const batchData = initial.map(s => ({
            id: s.id,
            data: s
          }));
          await saveDocumentsBatch(`users/${user.uid}/services`, batchData);
        }
      }
    });
  }, [user]);

  const handleServicesUpdate = async (updatedServices: RepairService[], deletedServiceId?: string) => {
    setServices(updatedServices);
    localStorage.setItem('honeybill_custom_services', JSON.stringify(updatedServices));
    if (user) {
      if (deletedServiceId) {
        await removeDocument(`users/${user.uid}/services`, deletedServiceId);
      }
      const batchData = updatedServices.map(s => ({
        id: s.id,
        data: s
      }));
      await saveDocumentsBatch(`users/${user.uid}/services`, batchData);
    }
  };

  const nextInvoiceNumber = useMemo(() => {
    if (invoices.length === 0) return 1;
    
    // Sort invoices by numeric value of their number to find the true maximum
    const numbers = invoices.map(inv => {
      // Extract the numeric part (e.g., from "INV-1024" or "2026-1024" or "1024")
      const matches = inv.invoiceNumber.match(/\d+/g);
      if (matches && matches.length > 0) {
        // Use the last group of numbers as it's typically the counter
        return parseInt(matches[matches.length - 1], 10);
      }
      return 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return maxNumber > 0 ? maxNumber + 1 : invoices.length + 1;
  }, [invoices]);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setActiveTab(invoice.type === 'estimate' ? 'estimates' : 'invoices');
    setEditingInvoice(invoice);
    setShowCreator(true);
  }, []);

  const handleFilterInvoices = (filter: { paymentMethod?: string; status?: string }) => {
    if (filter.paymentMethod) {
      setInvoiceFilter(filter.paymentMethod);
    } else if (filter.status) {
      setInvoiceFilter(filter.status);
    }
    setActiveTab('invoices');
  };

  const handleClearFilter = () => {
    setInvoiceFilter(null);
  };

  // Check for Public Shared Invoice
  const urlParams = new URL(window.location.href).searchParams;
  const viewType = urlParams.get('v');
  const encodedData = urlParams.get('d');

  if (viewType === 'inv' && encodedData) {
    try {
      const decoded = JSON.parse(atob(decodeURIComponent(encodedData)));
      const { invoice, ...sharedSettings } = decoded;
      
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-[800px] mb-6 flex justify-between items-center no-print">
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Customer Invoice View</h1>
            <div className="flex gap-2">
               <button 
                onClick={() => window.print()}
                className="bg-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
          <InvoiceTemplate invoice={invoice} settings={sharedSettings as InvoiceSettings} className="shadow-2xl border-none" />
          <footer className="mt-12 text-center text-slate-400 no-print">
            <p className="text-[10px] font-bold uppercase tracking-widest">Powered by RepairBill Studio</p>
          </footer>
        </div>
      );
    } catch (e) {
      console.error("Failed to decode shared invoice", e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Mayfield Cloud...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 text-center space-y-6 border border-slate-100"
        >
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[24px] flex items-center justify-center mx-auto shadow-inner">
            <Smartphone size={40} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Awaiting Approval</h1>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Thanks for joining **RepairBill**! Your account is currently pending review by our administration.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
            Admin will notify you once your access is granted.
          </div>
          <button 
            onClick={() => logout()}
            className="w-full py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Log Out & Switch Account
          </button>
        </motion.div>
      </div>
    );
  }

  if (profile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 text-center space-y-6 border border-red-50"
        >
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[24px] flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Account Suspended</h1>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Your access to the platform has been restricted. Please contact our support team for more information.
            </p>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
          >
            Log Out
          </button>
        </motion.div>
      </div>
    );
  }

  const isTrialExpired = profile && profile.role !== 'admin' && profile.createdAt && 
    (Math.ceil((new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 90);

  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 text-center space-y-6 border border-slate-100"
        >
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-[24px] flex items-center justify-center mx-auto">
             <AlertCircle size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Trial Expired</h1>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Your 3-month free trial has ended. Please contact the administrator to renew your access to the platform.
            </p>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
          >
            Log Out
          </button>
        </motion.div>
      </div>
    );
  }

  const isMasterAdmin = profile?.role === 'admin';


  const handleCatalogUpdate = async (data: { 
    brandName: string, 
    modelName?: string, 
    action: 'add_brand' | 'add_model' | 'remove_brand' | 'remove_model' | 'update_brand',
    updatedBrand?: Brand 
  }) => {
    if (!user) {
      // In offline mode, update local state
      if (data.action === 'update_brand' && data.updatedBrand) {
        setBrands(prev => {
          const updated = prev.map(b => b.id === data.updatedBrand!.id ? data.updatedBrand! : b);
          saveBrandOrder(updated);
          return updated;
        });
      }
      return;
    }
    
    let newBrands = [...brands];

    if (data.action === 'update_brand' && data.updatedBrand) {
      const idx = newBrands.findIndex(b => b.id === data.updatedBrand!.id);
      if (idx !== -1) {
        newBrands[idx] = data.updatedBrand!;
      } else {
        newBrands.push(data.updatedBrand!);
      }
      setBrands(newBrands);
      saveBrandOrder(newBrands);
      await saveDocument(`users/${user.uid}/brands`, data.updatedBrand!.id, data.updatedBrand!);
      return;
    }
    
    if (data.action === 'remove_brand') {
      const brand = newBrands.find(b => b.name.toLowerCase() === data.brandName.toLowerCase());
      if (brand) {
        await removeDocument(`users/${user.uid}/brands`, brand.id);
        // Local update will happen via subscription, but we can optimistically update
        setBrands(prev => prev.filter(b => b.id !== brand.id));
      }
      return;
    }

    if (data.action === 'remove_model' && data.modelName) {
      const brand = newBrands.find(b => b.name.toLowerCase() === data.brandName.toLowerCase());
      if (brand) {
        brand.series.forEach(s => {
          s.models = s.models.filter(m => m.name.toLowerCase() !== data.modelName!.toLowerCase());
        });
        await saveDocument(`users/${user.uid}/brands`, brand.id, brand);
      }
      return;
    }

    let brand = newBrands.find(b => b.name.toLowerCase() === data.brandName.toLowerCase());

    if (!brand) {
      brand = {
        id: data.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: data.brandName,
        series: [{
          id: 'general',
          name: 'General',
          models: data.modelName ? [{
            id: data.modelName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: data.modelName
          }] : []
        }]
      };
      await saveDocument(`users/${user.uid}/brands`, brand.id, brand);
    } else if (data.action === 'add_model' && data.modelName) {
      const generalSeries = brand.series.find(s => s.name === 'General') || brand.series[0];
      if (generalSeries && !generalSeries.models.find(m => m.name.toLowerCase() === data.modelName!.toLowerCase())) {
        generalSeries.models.push({
          id: data.modelName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: data.modelName
        });
        await saveDocument(`users/${user.uid}/brands`, brand.id, brand);
      }
    }
  };

  const handleInvoiceCreated = async (invoice: Invoice) => {
    if (!user) return;
    
    // Save Invoice to VPS PostgreSQL
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b'
        },
        body: JSON.stringify(invoice)
      });
      if (!response.ok) throw new Error("Server error");
    } catch (error) {
      console.error("Failed to save invoice to VPS", error);
      window.alert("CRITICAL: Failed to save invoice to secure database. Please check connection.");
      return; // Don't proceed if save failed
    }
    
    // Auto-save Customer to VPS PostgreSQL
    const customerId = invoice.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now().toString();
    const customer: Customer = {
      id: customerId,
      name: invoice.customerName,
      email: invoice.customerEmail,
      phone: invoice.customerPhone || '',
      createdAt: new Date().toISOString()
    };
    if (invoice.customerCompany !== undefined) customer.company = invoice.customerCompany;
    if (invoice.customerNotes !== undefined) customer.notes = invoice.customerNotes;
    
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b'
        },
        body: JSON.stringify(customer)
      });
    } catch (error) {
      console.error("Failed to save customer to VPS", error);
    }

    setEditingInvoice(null);
    setShowCreator(false);
    setSelectedInvoice(invoice);
  };

  const deleteInvoice = async (id: string) => {
    if (!user) return;
    await removeDocument(`users/${user.uid}/invoices`, id);
  };

  const handleBrandsReordered = async (reorderedBrands: Brand[]) => {
    if (!user) return;
    setBrands(reorderedBrands);
    
    try {
      const batchData = reorderedBrands.map(brand => ({
        id: brand.id,
        data: brand
      }));
      await saveDocumentsBatch(`users/${user.uid}/brands`, batchData);
    } catch (e) {
      console.error("Failed to save brand order to clouds", e);
    }
  };

  const handleSettingsUpdate = async (newSettings: InvoiceSettings) => {
    if (!user) return;
    setSettings(newSettings);
    await saveDocument(`users/${user.uid}/settings`, 'current', newSettings);
  };

  const addExpense = async (expense: Expense) => {
    if (!user) return;
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b'
        },
        body: JSON.stringify(expense)
      });
    } catch (error) {
      console.error("Failed to save expense", error);
      window.alert("Failed to save expense to secure database.");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'x-internal-api-key': 'RB_SECURE_3c818aaca6e25d77ac6fc73b' }
      });
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const addSupplier = async (supplier: Supplier) => {
    if (!user) return;
    await saveDocument(`users/${user.uid}/suppliers`, supplier.id, supplier);
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    await removeDocument(`users/${user.uid}/suppliers`, id);
  };

  const handleMassImport = async (invoices: Invoice[]) => {
    if (!user) return;
    const batchData = invoices.map(inv => ({ id: inv.id, data: inv }));
    await saveDocumentsBatch(`users/${user.uid}/invoices`, batchData);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    await saveDocument(`users/${user.uid}/leads`, id, { ...lead, ...updates });
  };

  const addLead = async (lead: Lead) => {
    if (!user) return;
    await saveDocument(`users/${user.uid}/leads`, lead.id, lead);
  };

  const deleteLead = async (id: string) => {
    if (!user) return;
    await removeDocument(`users/${user.uid}/leads`, id);
  };

  const handleConvertToQuote = (lead: Lead) => {
    setEditingInvoice(null);
    setCreatorType('estimate');
    // Pre-populate with lead data
    const draftInvoice: Partial<Invoice> = {
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      customerPhone: lead.customerPhone,
      customerNotes: `Lead Message: ${lead.message}${lead.metadata?.source ? `\nSource: ${lead.metadata.source}` : ''}${lead.metadata?.companyName ? `\nCompany: ${lead.metadata.companyName}` : ''}`,
      type: 'estimate',
      status: 'draft',
      items: [{
        id: Math.random().toString(36).substr(2, 9),
        serviceId: 'general',
        brandName: lead.metadata?.brand || 'Unknown',
        modelName: lead.metadata?.model || 'Repair Service',
        serviceName: lead.type === 'booking' ? 'Repair Booking' : 
                    lead.type === 'corporate' ? 'Corporate Service' : 'Quote Request',
        price: 0,
        quantity: 1
      }]
    };
    // We can't easily push the draft into InvoiceCreator without it being a full Invoice object
    // but the InvoiceCreator handles editingInvoice.
    // So we'll set a special state or just transition.
    // For now, let's just transition and the user can fill it.
    const today = new Date();
    const localDateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const nextWeek = new Date(today.getTime() + 7 * 86400000);
    const localDueDateStr = nextWeek.getFullYear() + '-' + String(nextWeek.getMonth() + 1).padStart(2, '0') + '-' + String(nextWeek.getDate()).padStart(2, '0');
    
    // Improved: Set editingInvoice with dummy data
    const fullDraft: Invoice = {
      id: `draft-${Date.now()}`,
      invoiceNumber: settings.estimatePrefix + nextInvoiceNumber,
      date: localDateStr,
      dueDate: localDueDateStr,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      ...(draftInvoice as Invoice)
    };
    
    setEditingInvoice(fullDraft);
    setActiveTab('estimates');
    setShowCreator(true);
    // Mark as replied
    updateLead(lead.id, { status: 'replied' });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div 
      className={cn(
        "flex min-h-screen bg-slate-50 font-sans transition-colors duration-500",
        settings?.appTheme === 'cyber' && "theme-cyber dark bg-slate-950",
        settings?.appTheme === 'minimalist' && "theme-minimalist bg-[#fdfcfa]"
      )}
    >
      <div 
        className={cn(
          "flex-1 flex min-h-screen bg-transparent",
          settings?.appTheme === 'minimalist' && "max-w-[1600px] mx-auto border-x border-slate-100"
        )}
      >
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setInvoiceFilter(null);
          }}
          settings={settings}
        />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={cn(
          "h-20 sm:h-16 flex items-center justify-between px-4 sm:px-8 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 flex-shrink-0 transition-all",
          settings?.appTheme === 'minimalist' && "h-24 sm:h-20"
        )}>
          <div className="flex items-center gap-3">
             <div className="sm:hidden w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-black/5 border border-slate-100 p-1.5 overflow-hidden">
               {settings?.logo && settings?.showLogo ? (
                 <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center">
                   <LayoutDashboard size={20} className="text-white" />
                 </div>
               )}
             </div>
            <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
              {activeTab === 'dashboard' ? 'Daily Ops' : 
               activeTab === 'catalog' ? 'Product Catalog' :
               activeTab === 'expenses' ? 'Expense & Supplier tracking' :
               activeTab === 'bas' ? 'BAS Tax Calculation' :
               activeTab === 'ai-agent' ? 'Repair AI Assistant' :
               activeTab === 'customers' ? 'Customer Database' :
               activeTab === 'settings' ? 'System Settings' : 
               activeTab === 'reports' ? 'Performance Reports' :
               activeTab === 'import' ? 'Legacy Data Import' :
               activeTab === 'estimates' ? 'Quote Management' : 'Invoice Management'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-none rounded-full text-xs w-64 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Floating AI Agent Shortcuts (Desktop) */}
        {!showCreator && activeTab !== 'ai-agent' && activeTab !== 'ai-agent-voice' && (
          <div className="hidden sm:flex fixed bottom-8 right-8 flex-row-reverse gap-4 z-50">
            <button 
              onClick={() => setActiveTab('ai-agent')}
              className={cn(
                "hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group relative",
                settings?.appTheme === 'cyber' 
                  ? "bg-cyan-500 text-slate-900 shadow-cyan-500/20" 
                  : settings?.appTheme === 'minimalist'
                  ? "bg-zinc-900 text-white rounded-none shadow-none"
                  : "bg-blue-600 text-white shadow-blue-200"
              )}
              title="Open AI Repair Assistant"
            >
              <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
              <div className={cn(
                "absolute top-[-40px] right-0 bg-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-black uppercase tracking-widest text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-100",
                settings?.appTheme === 'cyber' && "bg-slate-800 text-white border-slate-700",
                settings?.appTheme === 'minimalist' && "bg-black text-white rounded-none border-none"
              )}>
                AI Text Chat
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('ai-agent-voice')}
              className={cn(
                "hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group relative",
                settings?.appTheme === 'cyber' 
                  ? "bg-rose-500 text-white shadow-rose-500/20" 
                  : settings?.appTheme === 'minimalist'
                  ? "bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-none shadow-none"
                  : "bg-rose-500 text-white shadow-rose-200"
              )}
              title="AI Voice Assistant"
            >
              <Mic size={24} className="group-hover:scale-110 transition-transform" />
              <div className={cn(
                "absolute top-[-40px] right-0 bg-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-black uppercase tracking-widest text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-100",
                settings?.appTheme === 'cyber' && "bg-slate-800 text-white border-slate-700",
                settings?.appTheme === 'minimalist' && "bg-black text-white rounded-none border-none"
              )}>
                AI Voice Agent
              </div>
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                className="max-w-7xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20 }}
              >
                  <RepairDashboard 
                    invoices={invoices} 
                    expenses={expenses}
                    settings={settings} 
                    brands={brands}
                    onCreateInvoice={() => {
                      setCreatorType('invoice');
                      setActiveTab('invoices');
                      setShowCreator(true);
                    }}
                    onCreateEstimate={() => {
                      setCreatorType('estimate');
                      setActiveTab('estimates');
                      setShowCreator(true);
                    }}
                    onQuickService={(service, mode = 'ai') => {
                      if (mode === 'manual') {
                        setPresetServiceName(service.name);
                        setCreatorType('invoice');
                        setActiveTab('invoices');
                        setShowCreator(true);
                      } else {
                        setActiveTab('ai-agent');
                        setTimeout(() => {
                          const event = new CustomEvent('open-ai-agent-with-prompt', { detail: { prompt: `Start a new invoice for ${service.name}` } });
                          window.dispatchEvent(event);
                        }, 50);
                      }
                    }}
                    onQuickBrand={(brand, mode = 'ai') => {
                      if (mode === 'manual') {
                        setPresetBrandName(brand.name);
                        setCreatorType('invoice');
                        setActiveTab('invoices');
                        setShowCreator(true);
                      } else {
                        setActiveTab('ai-agent');
                        setTimeout(() => {
                          const event = new CustomEvent('open-ai-agent-with-prompt', { detail: { prompt: `Start a new invoice for ${brand.name}` } });
                          window.dispatchEvent(event);
                        }, 50);
                      }
                    }}
                    onFilterInvoices={handleFilterInvoices}
                    onEditInvoice={handleEditInvoice}
                  />
              </motion.div>
            ) : activeTab === 'catalog' ? (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <CatalogView 
                  brands={brands} 
                  onCatalogUpdate={handleCatalogUpdate}
                  services={services}
                  onServicesUpdate={handleServicesUpdate}
                  settings={settings}
                  onSettingsUpdate={handleSettingsUpdate}
                  onServicesSelectedForInvoice={(selectedIds) => {
                    setPresetServiceIds(selectedIds);
                    setCreatorType('invoice');
                    setActiveTab('invoices');
                    setShowCreator(true);
                  }}
                />
              </motion.div>
            ) : activeTab === 'import' ? (
              <motion.div
                key="import"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ImportManager settings={settings} onImport={handleMassImport} />
              </motion.div>
            ) : activeTab === 'expenses' ? (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ExpenseManagement 
                  settings={settings} 
                  expenses={expenses}
                  onAddExpense={addExpense}
                  onDeleteExpense={deleteExpense}
                  suppliers={suppliers}
                  onAddSupplier={addSupplier}
                  onDeleteSupplier={deleteSupplier}
                />
              </motion.div>
            ) : activeTab === 'bas' ? (
              <motion.div
                key="bas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BASCalculator 
                  invoices={invoices} 
                  expenses={expenses} 
                  settings={settings} 
                />
              </motion.div>
            ) : activeTab === 'reports' ? (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ReportsView 
                  invoices={invoices} 
                  expenses={expenses} 
                  settings={settings} 
                />
              </motion.div>
            ) : (activeTab === 'ai-agent' || activeTab === 'ai-agent-voice') ? (
              <motion.div
                key="ai-agent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 xl:col-span-8">
                    <AIInvoiceAgent 
                       settings={settings}
                       brands={brands}
                       invoices={invoices}
                       expenses={expenses}
                       leads={leads}
                       nextInvoiceNumber={nextInvoiceNumber}
                       onInvoiceCreated={handleInvoiceCreated}
                       onExpenseCreated={addExpense}
                       onCatalogUpdated={handleCatalogUpdate}
                       onClose={() => setActiveTab('dashboard')}
                       setActiveTab={setActiveTab}
                       startListening={activeTab === 'ai-agent-voice'}
                    />
                  </div>
                  <div className="lg:col-span-5 xl:col-span-4">
                    <AIPanelLeadsFeed 
                       leads={leads}
                       settings={settings}
                       onUpdateLead={updateLead}
                       onDeleteLead={deleteLead}
                       onConvertToQuote={handleConvertToQuote}
                    />
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'customers' ? (
              <motion.div
                key="customers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CustomersView customers={customers} />
              </motion.div>
            ) : activeTab === 'settings' ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SettingsView 
                  settings={settings} 
                  setSettings={handleSettingsUpdate} 
                  onBrandsReordered={handleBrandsReordered}
                  onCatalogUpdate={handleCatalogUpdate}
                  services={services}
                  onServicesUpdate={handleServicesUpdate}
                />
              </motion.div>
            ) : activeTab === 'users' && isMasterAdmin ? (
               <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-6xl mx-auto"
              >
                <UserManagement />
              </motion.div>
            ) : (activeTab === 'invoices' || activeTab === 'estimates') ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {showCreator ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setShowCreator(false);
                          setEditingInvoice(null);
                        }}
                        className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          {editingInvoice ? (editingInvoice.type === 'estimate' ? 'Edit Quote' : 'Edit Invoice') : 
                           (creatorType === 'estimate' ? 'Create New Quote' : 'Create New Invoice')}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                          {editingInvoice ? `Updating ${editingInvoice.invoiceNumber}` : 
                           (creatorType === 'estimate' ? 'Drafting a new estimate for client approval' : 'Step-by-step device repair billing')}
                        </p>
                      </div>
                    </div>
                    <InvoiceCreator 
                      settings={settings} 
                      invoiceToEdit={editingInvoice}
                      nextInvoiceNumber={nextInvoiceNumber}
                      initialType={creatorType}
                      brands={brands}
                      onCatalogUpdate={handleCatalogUpdate}
                      services={services}
                      onServicesUpdate={handleServicesUpdate}
                      initialBrandName={presetBrandName}
                      initialServiceName={presetServiceName}
                      initialServiceIds={presetServiceIds}
                      onClose={() => {
                        setShowCreator(false);
                        setEditingInvoice(null);
                        setPresetBrandName(undefined);
                        setPresetServiceName(undefined);
                        setPresetServiceIds(undefined);
                      }}
                      onInvoiceCreated={(newInvoice) => {
                        handleInvoiceCreated(newInvoice);
                        setPresetBrandName(undefined);
                        setPresetServiceName(undefined);
                        setPresetServiceIds(undefined);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => {
                          setEditingInvoice(null);
                          setCreatorType('estimate');
                          setShowCreator(true);
                        }}
                        className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all scale-100 active:scale-95"
                      >
                        <Plus size={18} /> New Quote
                      </button>
                      <button 
                        onClick={() => {
                          setEditingInvoice(null);
                          setCreatorType('invoice');
                          setShowCreator(true);
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all scale-100 active:scale-95"
                      >
                        <Plus size={18} /> New Invoice
                      </button>
                    </div>
                    <InvoiceManagement 
                      settings={settings} 
                      invoices={invoices} 
                      setInvoices={setInvoices} 
                      onEdit={handleEditInvoice}
                      onDelete={deleteInvoice}
                      initialPaymentMethod={invoiceFilter}
                      initialSelectedInvoice={selectedInvoice}
                      initialTab={activeTab === 'estimates' ? 'estimate' : 'invoice'}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                className="flex flex-col items-center justify-center h-full text-slate-400 py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Activity size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">This module is coming soon.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'dashboard' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'invoices' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <CreditCard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Billing</span>
        </button>
        <button 
          onClick={() => setActiveTab('estimates')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'estimates' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <FileText size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Quotes</span>
        </button>
        <div className="relative -top-6 flex gap-2">
          <button 
            onClick={() => (activeTab === 'ai-agent' || activeTab === 'ai-agent-voice') ? setActiveTab('dashboard') : setActiveTab('ai-agent')}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all active:scale-90",
              (activeTab === 'ai-agent') ? "bg-slate-800 shadow-slate-200" : "bg-blue-600 shadow-blue-200"
            )}
          >
            {(activeTab === 'ai-agent') ? <X size={20} className="text-white" /> : <Sparkles size={20} className="text-white" />}
          </button>
          <button 
            onClick={() => (activeTab === 'ai-agent-voice' || activeTab === 'ai-agent') ? setActiveTab('dashboard') : setActiveTab('ai-agent-voice')}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all active:scale-90 bg-rose-500 shadow-rose-200",
              (activeTab === 'ai-agent-voice') ? "bg-slate-800 shadow-slate-200" : ""
            )}
          >
            {(activeTab === 'ai-agent-voice') ? <X size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
          </button>
        </div>
        <button 
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'catalog' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <Smartphone size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Catalog</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'settings' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Admin</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
